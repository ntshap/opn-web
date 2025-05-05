/**
 * Popup component for managing event attendance
 */
"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MemberAttendanceForm } from "./member-attendance-form"
import { UserCheck, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { saveAttendanceData } from "@/utils/attendance-utils"

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
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [attendanceData, setAttendanceData] = useState<Array<{ member_id: number; status: string; notes: string }>>([])

  // Update attendanceData when onAttendanceChange is called
  const handleAttendanceChange = (data: Array<{ member_id: number; status: string; notes: string }>) => {
    setAttendanceData(data);
    if (onAttendanceChange) {
      onAttendanceChange(data);
    }
  };

  const formRef = useRef<{
    handleSaveAttendance?: () => Promise<void>,
    getAttendanceData?: () => Array<{ member_id: number; status: string; notes: string }>
  }>(null)

  // Function to handle saving attendance
  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log("Saving attendance data...");

      // Try to get data from the form ref first
      let dataToSave = attendanceData;

      // If we have a ref and it has the getAttendanceData method, use that
      if (formRef.current && formRef.current.getAttendanceData) {
        const refData = formRef.current.getAttendanceData();
        if (refData && refData.length > 0) {
          dataToSave = refData;
          console.log("Using data from form ref:", dataToSave);
        }
      }

      // If we have data to save, use our utility function to save it to localStorage
      if (dataToSave && dataToSave.length > 0) {
        try {
          // Save data using our utility function
          const saveResult = saveAttendanceData(eventId, dataToSave);

          if (!saveResult) {
            console.error("[AttendancePopup] Failed to save attendance data");
            toast({
              title: "Error",
              description: "Gagal menyimpan data kehadiran ke penyimpanan lokal",
              variant: "destructive"
            });
            setIsSaving(false);
            return;
          }

          console.log(`[AttendancePopup] Successfully saved attendance data to localStorage`);

          // Show success toast
          toast({
            title: "Berhasil",
            description: "Data kehadiran berhasil disimpan",
          });

          // Close the dialog after successful save
          setTimeout(() => {
            onClose();
          }, 1000);
        } catch (storageError) {
          console.error("[AttendancePopup] Error saving to localStorage:", storageError);
          toast({
            title: "Error",
            description: "Gagal menyimpan data kehadiran ke penyimpanan lokal",
            variant: "destructive"
          });
          throw storageError;
        }
      } else {
        // Try to call the handleSaveAttendance method as a fallback
        if (formRef.current && formRef.current.handleSaveAttendance) {
          console.log("Calling handleSaveAttendance as fallback...");
          await formRef.current.handleSaveAttendance();

          // Show success toast
          toast({
            title: "Berhasil",
            description: "Data kehadiran berhasil disimpan",
          });

          // Close the dialog after successful save
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          console.error("No attendance data to save and no save method available");
          toast({
            title: "Error",
            description: "Tidak ada data kehadiran untuk disimpan",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data kehadiran",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            <span>Daftar Kehadiran - {eventName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <MemberAttendanceForm
            ref={formRef}
            eventId={eventId}
            onAttendanceChange={handleAttendanceChange}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t bg-white p-4">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            }}
            disabled={isSaving}
            className={`flex items-center justify-center px-4 py-2 rounded-md text-white font-medium ${
              isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors`}
            style={{
              minWidth: '100px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}