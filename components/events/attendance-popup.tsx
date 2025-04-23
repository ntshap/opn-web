/**
 * Popup component for managing event attendance
 */
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MemberAttendanceForm } from "./member-attendance-form"
import { UserCheck } from "lucide-react"

interface AttendancePopupProps {
  eventId: string | number
  eventName: string
  open: boolean
  onClose: () => void
  onAttendanceChange?: (records: Array<{ member_id: number; status: string; notes: string }>) => void
}

export function AttendancePopup({ 
  eventId, 
  eventName,
  open, 
  onClose,
  onAttendanceChange 
}: AttendancePopupProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            <span>Daftar Kehadiran - {eventName}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <MemberAttendanceForm 
            eventId={eventId} 
            onAttendanceChange={onAttendanceChange}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 