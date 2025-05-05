"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Edit } from "lucide-react"
import { useAttendanceMutations } from "@/hooks/useEvents"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSavedAttendanceData, saveAttendanceData, updateAttendanceData } from "@/utils/attendance-utils"

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

  // Ensure attendees is always an array
  const [attendees, setAttendees] = useState<Attendee[]>([])

  // Initialize attendees from props and localStorage
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

    setAttendees(attendeesList);
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Daftar Kehadiran</CardTitle>
        {attendees.length > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setIsEditingAll(!isEditingAll);
                if (!isEditingAll) {
                  const initialData: Record<number, { status: string, notes: string }> = {};
                  attendees.forEach(attendee => {
                    initialData[attendee.id] = {
                      status: attendee.status,
                      notes: attendee.notes
                    };
                  });
                  setBulkEditData(initialData);
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditingAll ? 'Batal' : 'Ubah Semua'}
            </Button>
            {isEditingAll && (
              <Button
                variant="default"
                size="sm"
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
                      console.log('[AttendanceForm] Saving bulk attendance data:', updateData);

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

                      // Save to localStorage using our utility function
                      try {
                        // Update the attendance data for all members in bulk
                        const updateResult = updateAttendanceData(eventId, updateData);

                        if (!updateResult) {
                          console.error("[AttendanceForm] Failed to update bulk attendance data");
                          throw new Error("Failed to update bulk attendance data");
                        }

                        console.log(`[AttendanceForm] Successfully updated bulk attendance data in localStorage`);
                      } catch (storageError) {
                        console.error("[AttendanceForm] Error saving bulk data to localStorage:", storageError);
                      }

                      // Call the onRefresh callback to refresh the parent component
                      if (onRefresh && typeof onRefresh === 'function') {
                        console.log('[AttendanceForm] Calling onRefresh after bulk update');
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
                <Check className="h-4 w-4 mr-2" />
                Simpan
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {attendees.length === 0 ? (
          <Alert>
            <AlertDescription>
              Belum ada data kehadiran untuk acara ini.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attendees.map((attendee) => (
                <Button
                  key={attendee.id}
                  variant={selectedAttendee === attendee.id ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => handleSelectAttendee(attendee.id)}
                >
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
                    <span>{attendee.member_name || attendee.name || 'Anggota'}</span>
                  </div>
                </Button>
              ))}
            </div>

            {selectedAttendee && (
              <div id="edit-attendance-form" className="mt-6 border-t pt-6 bg-slate-50 p-4 rounded-md border border-slate-200 animate-fadeIn">
                <h3 className="text-base font-semibold mb-4">
                  Edit Kehadiran: {(() => {
                    const attendee = attendees.find(a => a.id === selectedAttendee);
                    return attendee ? (attendee.member_name || attendee.name || 'Anggota') : 'Anggota';
                  })()}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attendance-status">Status</Label>
                    <Select
                      value={attendanceForm.status}
                      onValueChange={(value) => setAttendanceForm({...attendanceForm, status: value})}
                    >
                      <SelectTrigger id="attendance-status">
                        <SelectValue placeholder="Pilih status kehadiran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hadir">Hadir</SelectItem>
                        <SelectItem value="Izin">Izin</SelectItem>
                        <SelectItem value="Alfa">Alfa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendance-notes">Keterangan</Label>
                    <Input
                      id="attendance-notes"
                      placeholder="Tambahkan keterangan (opsional)"
                      value={attendanceForm.notes}
                      onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setSelectedAttendee(null)}>Batal</Button>
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
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Simpan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
