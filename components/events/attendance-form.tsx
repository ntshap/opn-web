"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Edit, User, X } from "lucide-react"
import { useAttendanceMutations } from "@/hooks/useEvents"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSavedAttendanceData, saveAttendanceData, updateAttendanceData } from "@/utils/attendance-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// This interface represents an existing attendance record
interface Attendee {
  id: number // Attendance record ID
  event_id: number
  member_id: number
  member_name?: string // From backend
  name?: string // For backward compatibility
  division?: string
  status: string
  notes: string
  avatar?: string
  created_at?: string
  updated_at?: string
}

interface AttendanceFormProps {
  eventId: string | number
  attendees: Attendee[]
  onRefresh?: () => void
}

export function AttendanceForm({ eventId, attendees: initialAttendees = [], onRefresh = () => {} }: AttendanceFormProps) {
  const [selectedAttendee, setSelectedAttendee] = useState<number | null>(null)
  const [attendanceForm, setAttendanceForm] = useState({
    status: "",
    notes: ""
  })
  const [isEditingAll, setIsEditingAll] = useState(false)
  const [bulkEditData, setBulkEditData] = useState<Record<number, { status: string, notes: string }>>({})
  const [activeTab, setActiveTab] = useState<string>("all")

  // Ensure attendees is always an array
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  // Get unique divisions for filtering
  const divisions = [...new Set(attendees.map(a => a.division).filter(Boolean))]

  // Initialize attendees from props, localStorage, and fetch members if needed
  useEffect(() => {
    // Start with the initial attendees from props
    let attendeesList = Array.isArray(initialAttendees) ? initialAttendees : [];

    // Load saved attendance data from localStorage using our utility function
    const savedAttendanceData = getSavedAttendanceData(eventId);
    console.log(`[AttendanceForm] Loaded ${savedAttendanceData.length} saved attendance records from localStorage:`, savedAttendanceData);

    // If we have saved attendance data, update the attendees list
    if (savedAttendanceData.length > 0) {
      // Create a map of member_id to saved attendance data
      const savedAttendanceMap = new Map();
      savedAttendanceData.forEach(item => {
        if (item && item.member_id) {
          savedAttendanceMap.set(item.member_id, item);
        }
      });

      // Update attendees with saved data
      attendeesList = attendeesList.map(attendee => {
        const savedData = savedAttendanceMap.get(attendee.member_id);
        if (savedData) {
          return {
            ...attendee,
            status: savedData.status || attendee.status,
            notes: savedData.notes || attendee.notes
          };
        }
        return attendee;
      });
    }

    // If we don't have any attendees, fetch members from the API
    if (attendeesList.length === 0) {
      setIsLoadingMembers(true);

      // Import the API client dynamically to avoid issues
      import('@/lib/api-service').then(({ memberApi }) => {
        memberApi.getMembers()
          .then(membersData => {
            console.log('[AttendanceForm] Fetched members data:', membersData);

            // Create attendee records from members data
            const membersAttendees: Attendee[] = [];

            // Process each division and its members
            Object.entries(membersData).forEach(([division, members]) => {
              if (Array.isArray(members)) {
                members.forEach(member => {
                  if (member && member.id) {
                    // Create an attendee record for each member
                    membersAttendees.push({
                      id: member.id, // Use member ID as temporary attendance record ID
                      event_id: Number(eventId),
                      member_id: member.id,
                      member_name: member.full_name || 'Tidak ada nama',
                      division: division,
                      status: 'Hadir', // Default status
                      notes: '',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    });
                  }
                });
              }
            });

            console.log(`[AttendanceForm] Created ${membersAttendees.length} attendee records from members data`);

            // Apply any saved attendance data to these records
            if (savedAttendanceData.length > 0) {
              const savedAttendanceMap = new Map();
              savedAttendanceData.forEach(item => {
                if (item && item.member_id) {
                  savedAttendanceMap.set(item.member_id, item);
                }
              });

              membersAttendees.forEach(attendee => {
                const savedData = savedAttendanceMap.get(attendee.member_id);
                if (savedData) {
                  attendee.status = savedData.status || attendee.status;
                  attendee.notes = savedData.notes || attendee.notes;
                }
              });
            }

            setAttendees(membersAttendees);
          })
          .catch(error => {
            console.error('[AttendanceForm] Error fetching members:', error);
          })
          .finally(() => {
            setIsLoadingMembers(false);
          });
      });
    } else {
      setAttendees(attendeesList);
    }
  }, [initialAttendees, eventId])

  // Reset form when selected attendee changes
  useEffect(() => {
    if (selectedAttendee) {
      const currentAttendee = attendees.find(a => a.id === selectedAttendee)
      if (currentAttendee) {
        setAttendanceForm({
          status: currentAttendee.status,
          notes: currentAttendee.notes || ""
        })
      }
    }
  }, [selectedAttendee, attendees])

  const { createOrUpdateAttendance } = useAttendanceMutations(eventId)

  // Get the selected attendee data
  const getSelectedAttendee = () => {
    if (!attendees || attendees.length === 0) return null
    return attendees.find(a => a.id === selectedAttendee)
  }

  // Initialize form when selecting an attendee
  const handleSelectAttendee = (id: number) => {
    setSelectedAttendee(id)
    const attendee = attendees.find(a => a.id === id)
    if (attendee) {
      setAttendanceForm({
        status: attendee.status,
        notes: attendee.notes || ""
      })
    }
  }

  // Handle saving attendance
  const handleSaveAttendance = async () => {
    const attendee = getSelectedAttendee()
    if (!attendee) return

    try {
      // Format the data for the API and ensure status is one of the allowed values
      // Only allow the three valid status values from the database schema: Hadir, Izin, Alfa
      const status = ["Hadir", "Izin", "Alfa"].includes(attendanceForm.status) ? attendanceForm.status : "Hadir";

      const attendanceData = {
        member_id: attendee.member_id,
        status: status,
        notes: attendanceForm.notes || ""
      };

      console.log(`[AttendanceForm] Saving attendance for member ${attendee.member_id} with status: ${status}`);

      // Update the attendees list with the new data
      const updatedAttendees = attendees.map(a =>
        a.id === selectedAttendee
          ? { ...a, status: status, notes: attendanceForm.notes || "" }
          : a
      );
      setAttendees(updatedAttendees);

      // Save to localStorage using our utility function
      try {
        // Update the attendance data for this member
        const updateResult = updateAttendanceData(eventId, [attendanceData]);

        if (!updateResult) {
          console.error("[AttendanceForm] Failed to update attendance data");
          throw new Error("Failed to update attendance data");
        }

        console.log(`[AttendanceForm] Successfully updated attendance data in localStorage`);
      } catch (storageError) {
        console.error("[AttendanceForm] Error saving to localStorage:", storageError);
      }

      // Close the form
      setSelectedAttendee(null);

      // Call the onRefresh callback to refresh the parent component
      if (onRefresh && typeof onRefresh === 'function') {
        console.log('[AttendanceForm] Calling onRefresh to update parent component');
        onRefresh();
      }
    } catch (error) {
      console.error("[AttendanceForm] Error updating attendance:", error);
    }
  }

  // Status colors are handled directly in the UI components

  // Filter attendees by active division
  const filteredAttendees = activeTab === "all"
    ? attendees
    : attendees.filter(a => a.division === activeTab)

  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>Daftar Kehadiran</CardTitle>
        </div>
        {attendees.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsEditingAll(true);
              const initialData: Record<number, { status: string, notes: string }> = {};
              attendees.forEach(attendee => {
                initialData[attendee.id] = {
                  status: attendee.status,
                  notes: attendee.notes
                };
              });
              setBulkEditData(initialData);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Ubah Semua
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoadingMembers ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-muted-foreground">Memuat data anggota...</p>
          </div>
        ) : attendees.length === 0 ? (
          <Alert>
            <AlertDescription>
              Belum ada data anggota untuk ditampilkan. Silakan tambahkan anggota terlebih dahulu.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">Semua</TabsTrigger>
                {divisions.map(division => (
                  <TabsTrigger key={division} value={division}>{division}</TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Divisi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          Tidak ada anggota di divisi ini
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendees.map((attendee) => (
                        <TableRow key={attendee.id} onClick={() => handleSelectAttendee(attendee.id)} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {attendee.avatar ? (
                                <img
                                  src={attendee.avatar}
                                  alt={attendee.member_name || attendee.name || 'Anggota'}
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                  <span className="text-xs">
                                    {(() => {
                                      const displayName = attendee.member_name || attendee.name || '';
                                      return displayName.length > 0 ? displayName[0] : '?';
                                    })()}
                                  </span>
                                </div>
                              )}
                              {attendee.member_name || attendee.name || 'Tidak ada nama'}
                            </div>
                          </TableCell>
                          <TableCell>{attendee.division || '-'}</TableCell>
                          <TableCell>
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${
                                attendee.status === "Hadir" ? "bg-green-100 text-green-800" :
                                attendee.status === "Izin" ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }`}
                            >
                              {attendee.status}
                            </span>
                          </TableCell>
                          <TableCell>{attendee.notes || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Edit Attendance Dialog */}
        <Dialog open={selectedAttendee !== null} onOpenChange={(open) => !open && setSelectedAttendee(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Edit Kehadiran: {(() => {
                  const attendee = attendees.find(a => a.id === selectedAttendee);
                  return attendee ? (attendee.member_name || attendee.name || 'Tidak ada nama') : 'Tidak ada nama';
                })()}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="attendance-status">Status</Label>
                <Select
                  value={attendanceForm.status}
                  onValueChange={(value) => setAttendanceForm({...attendanceForm, status: value})}
                >
                  <SelectTrigger id="attendance-status">
                    <SelectValue placeholder="Pilih status kehadiran">
                      {attendanceForm.status && (
                        <div className="flex items-center">
                          <span
                            className={`w-3 h-3 rounded-full mr-2 ${
                              attendanceForm.status === "Hadir" ? "bg-green-500" :
                              attendanceForm.status === "Izin" ? "bg-yellow-500" :
                              "bg-red-500"
                            }`}
                          ></span>
                          {attendanceForm.status}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hadir">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                        Hadir
                      </div>
                    </SelectItem>
                    <SelectItem value="Izin">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                        Izin
                      </div>
                    </SelectItem>
                    <SelectItem value="Alfa">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                        Alfa
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendance-notes">Keterangan</Label>
                <Input
                  id="attendance-notes"
                  placeholder="Masukkan keterangan"
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAttendee(null)}>
                Tutup
              </Button>
              <Button onClick={handleSaveAttendance} disabled={createOrUpdateAttendance.isPending}>
                {createOrUpdateAttendance.isPending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Edit Dialog */}
        <Dialog open={isEditingAll} onOpenChange={setIsEditingAll}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Ubah Semua Kehadiran</DialogTitle>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendees.map((attendee) => (
                    <TableRow key={attendee.id}>
                      <TableCell className="font-medium">
                        {attendee.member_name || attendee.name || 'Tidak ada nama'}
                      </TableCell>
                      <TableCell>{attendee.division || '-'}</TableCell>
                      <TableCell>
                        <Select
                          value={bulkEditData[attendee.id]?.status || attendee.status}
                          onValueChange={(value) => {
                            setBulkEditData({
                              ...bulkEditData,
                              [attendee.id]: {
                                ...bulkEditData[attendee.id],
                                status: value
                              }
                            });
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hadir">
                              <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                                Hadir
                              </div>
                            </SelectItem>
                            <SelectItem value="Izin">
                              <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                                Izin
                              </div>
                            </SelectItem>
                            <SelectItem value="Alfa">
                              <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                                Alfa
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Masukkan keterangan"
                          value={bulkEditData[attendee.id]?.notes || attendee.notes || ''}
                          onChange={(e) => {
                            setBulkEditData({
                              ...bulkEditData,
                              [attendee.id]: {
                                ...bulkEditData[attendee.id],
                                notes: e.target.value
                              }
                            });
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingAll(false)}>
                Tutup
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const updateData = Object.entries(bulkEditData).map(([id, data]) => {
                      const attendee = attendees.find(a => a.id === parseInt(id));
                      if (!attendee) return null;
                      return {
                        member_id: attendee.member_id,
                        status: data.status || 'Hadir',
                        notes: data.notes || ''
                      };
                    }).filter(Boolean);

                    if (updateData.length > 0) {
                      // Update the attendees list with the new data
                      const updatedAttendees = [...attendees];
                      updateData.forEach((data: any) => {
                        const index = updatedAttendees.findIndex(a => a.member_id === data.member_id);
                        if (index >= 0) {
                          updatedAttendees[index] = {
                            ...updatedAttendees[index],
                            status: data.status,
                            notes: data.notes || ""
                          };
                        }
                      });
                      setAttendees(updatedAttendees);

                      // Save to localStorage
                      updateAttendanceData(eventId, updateData);

                      // Call the onRefresh callback
                      if (onRefresh && typeof onRefresh === 'function') {
                        onRefresh();
                      }

                      setIsEditingAll(false);
                    }
                  } catch (error) {
                    console.error('Error updating attendance:', error);
                    alert('Gagal memperbarui data kehadiran');
                  }
                }}
              >
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
