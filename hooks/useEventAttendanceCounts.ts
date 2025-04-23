"use client"

import { useQuery, useQueries } from "@tanstack/react-query"
import { eventApi } from "@/lib/api-service" // Updated path
import { eventKeys } from "@/hooks/useEvents"
import { useMemo } from "react"
import { type Event } from "@/lib/api-service" // Updated path

// Hook for calculating attendance counts for all events with optimized API calls
export function useEventAttendanceCounts(events: Event[] = []) {
  // Use parallel queries instead of sequential fetching
  const eventIds = useMemo(() => {
    return events.map(event => event.id).filter(Boolean)
  }, [events])

  // Use useQueries to fetch attendance for all events in parallel
  const attendanceQueries = useQueries({
    queries: eventIds.map(id => ({
      queryKey: eventKeys.attendance(id),
      queryFn: ({ signal }: { signal?: AbortSignal }) => eventApi.getEventAttendance(id, signal),
      retry: false,
      staleTime: 60000, // Cache for 1 minute
      cacheTime: 300000, // Keep in cache for 5 minutes
      // Return empty array on error instead of throwing
      onError: (error: Error) => {
        console.error(`Error fetching attendance for event ${id}:`, error)
      }
    }))
  })

  // Determine if any queries are still loading
  const isLoading = attendanceQueries.some(query => query.isLoading)

  // Combine all attendance counts into a single object
  const attendanceCounts = useMemo(() => {
    const counts: Record<string | number, number> = {}

    // Map event IDs to their corresponding query results
    eventIds.forEach((id, index) => {
      const query = attendanceQueries[index]
      if (query.data) {
        counts[id] = query.data.length
      } else {
        counts[id] = 0 // Default to 0 if no data or error
      }
    })

    return counts
  }, [eventIds, attendanceQueries])

  return { attendanceCounts, isLoading }
}
