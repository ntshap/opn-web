"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Edit } from "lucide-react"
import { useAttendanceMutations } from "@/hooks/useEvents"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const attendees = Array.isArray(initialAttendees) ? initialAttendees : []

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
      // Backend expects specific status values
      const status = attendanceForm.status === "Hadir" ? "Hadir" :
                    attendanceForm.status === "Izin" ? "Izin" : "Alfa";

      const attendanceData = [{
        member_id: attendee.member_id,
        status: status, // Send the validated status string
        notes: attendanceForm.notes
      }]

      console.log(`Saving attendance for member ${attendee.member_id} with status: ${status}`)

      // Use createOrUpdateAttendance instead of updateAttendance
      await createOrUpdateAttendance.mutateAsync(attendanceData)

      // Close the form and refresh data
      setSelectedAttendee(null)
      onRefresh()
    } catch (error) {
      console.error("Error updating attendance:", error)
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
                      await createOrUpdateAttendance.mutateAsync(updateData as any);
                      alert('Data kehadiran berhasil diperbarui');
                      onRefresh();
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
