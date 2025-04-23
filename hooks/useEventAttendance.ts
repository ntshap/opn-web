"use client"

import { useState, useEffect } from "react"
import { useAttendanceMutations, useEventAttendance as useEventAttendanceQuery } from "@/hooks/useEvents"
import { useMembers } from "@/hooks/useMembers"

export interface AttendanceRecord {
  member_id: number
  status: string
  notes: string
}

export function useEventAttendance(eventId: number | string) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const { data: members = [], isLoading: isMembersLoading } = useMembers()
  const { data: existingAttendance = [], isLoading: isAttendanceLoading } = useEventAttendanceQuery(eventId)
  const { createOrUpdateAttendance } = useAttendanceMutations(eventId)

  // Initialize attendance records from existing attendance data or members data
  useEffect(() => {
    // If we have existing attendance data, use that
    if (existingAttendance && existingAttendance.length > 0) {
      const records = existingAttendance.map(attendance => ({
        member_id: attendance.member_id,
        status: attendance.status,
        notes: attendance.notes || ""
      }))
      setAttendanceRecords(records)
    }
    // Otherwise, if we have members data but no attendance data, create initial records
    else if (members && Object.keys(members).length > 0 && !isAttendanceLoading) {
      // Create initial attendance records for all members
      const initialRecords = Object.entries(members).flatMap(([division, membersList]) =>
        membersList.map(member => ({
          member_id: member.id,
          status: "Hadir", // Default status is present
          notes: ""
        }))
      )
      setAttendanceRecords(initialRecords)
    }
  }, [members, existingAttendance, isAttendanceLoading])

  // Function to save attendance records
  const saveAttendanceRecords = async () => {
    // Only try to save if we have a valid eventId and records
    if (attendanceRecords.length > 0 && eventId && eventId !== 0 && createOrUpdateAttendance) {
      try {
        console.log('Saving attendance records for event:', eventId, 'Records:', attendanceRecords.length)
        await createOrUpdateAttendance.mutateAsync(attendanceRecords)
        console.log('Attendance records saved successfully')
        return true
      } catch (error) {
        console.error('Error saving attendance records:', error)
        return false
      }
    } else {
      // Log why we're not saving
      if (!attendanceRecords.length) {
        console.log('No attendance records to save')
      } else if (!eventId || eventId === 0) {
        console.log('No valid eventId for saving attendance')
      } else if (!createOrUpdateAttendance) {
        console.log('createOrUpdateAttendance mutation is not available')
      }
      // Just return success
      return true
    }
  }

  return {
    attendanceRecords,
    setAttendanceRecords,
    saveAttendanceRecords,
    isLoading: isMembersLoading || isAttendanceLoading,
    isMembersLoading,
    isAttendanceLoading
  }
}
