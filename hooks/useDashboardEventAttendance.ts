"use client"

import { useState, useEffect } from "react"
import { eventApi } from "@/lib/api-service" // Updated path

// Hook for calculating attendance counts for dashboard events
export function useDashboardEventAttendance(events: any[] = []) {
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string | number, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  // Calculate attendance counts for each event
  useEffect(() => {
    const fetchAttendanceCounts = async () => {
      if (!events.length) return
      
      setIsLoading(true)
      const counts: Record<string | number, number> = {}
      
      try {
        // For each event, fetch its attendance and store the count
        for (const event of events) {
          try {
            if (event.id) {
              const attendees = await eventApi.getEventAttendance(event.id)
              counts[event.id] = attendees.length
              console.log(`Fetched ${attendees.length} attendees for event ${event.id}`)
            }
          } catch (error) {
            console.error(`Error fetching attendance for event ${event.id}:`, error)
            counts[event.id] = 0 // Default to 0 if there's an error
          }
        }
        
        setAttendanceCounts(counts)
      } catch (error) {
        console.error('Error fetching attendance counts:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAttendanceCounts()
  }, [events])
  
  return { attendanceCounts, isLoading }
}
