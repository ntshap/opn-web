"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { meetingMinutesApi, type MeetingMinutes, type MeetingMinutesFormData } from "@/lib/api-service" // Updated path
import { useToast } from "@/components/ui/use-toast"

// Query keys for meeting minutes
export const meetingMinutesKeys = {
  all: ['meeting-minutes'] as const,
  lists: () => [...meetingMinutesKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...meetingMinutesKeys.lists(), filters] as const,
  details: () => [...meetingMinutesKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...meetingMinutesKeys.details(), id] as const,
}

// Hook for fetching all meeting minutes
export function useMeetingMinutes() {
  const { toast } = useToast()

  return useQuery({
    queryKey: meetingMinutesKeys.lists(),
    queryFn: async ({ signal }) => {
      try {
        return await meetingMinutesApi.getMeetingMinutes(signal)
      } catch (error) {
        // Handle specific error cases
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 403) {
            console.log('Permission denied for meeting minutes. Returning empty array.')
            return [] // Return empty array for 403 errors
          }

          // Handle timeout errors
          if (error.code === 'ECONNABORTED') {
            console.log('Timeout error fetching meeting minutes. Returning empty array.')
            toast({
              title: "Waktu permintaan habis",
              description: "Tidak dapat memuat data notulensi. Silakan coba lagi nanti.",
              variant: "destructive",
            })
            return [] // Return empty array for timeout errors
          }
        }

        // For all other errors, return empty array to prevent UI from breaking
        console.error('Error fetching meeting minutes:', error)
        return []
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry if the request was canceled
      if (axios.isCancel(error)) {
        return false
      }
      // Don't retry 403 errors
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        return false
      }
      // Don't retry timeout errors after 1 attempt
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED' && failureCount >= 1) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    // Return a default value on error to prevent UI from breaking
    // Important: We want to return the error so components can handle it
    throwOnError: false,
    // Increase stale time to reduce unnecessary refetches
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching meeting minutes by event ID
export function useMeetingMinutesByEvent(eventId: number | string) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const numericEventId = Number(eventId)

  console.log('%c useMeetingMinutesByEvent called with eventId:', 'background: #00f; color: #fff', eventId, 'Type:', typeof eventId)
  console.log('%c Converted to numericEventId:', 'background: #00f; color: #fff', numericEventId, 'Type:', typeof numericEventId)

  // Use a specific query key for this event's meeting minutes
  const eventMinutesKey = [...meetingMinutesKeys.all, 'event', numericEventId]
  console.log('%c Using query key:', 'background: #00f; color: #fff', eventMinutesKey)

  // Use direct API call to get meeting minutes by event ID
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: eventMinutesKey,
    queryFn: async ({ signal }) => {
      try {
        console.log('%c Fetching meeting minutes directly for event ID', 'background: #00f; color: #fff', numericEventId)

        // Create an AbortController that we can use to track cancellations
        const controller = new AbortController()
        const localSignal = controller.signal

        // Combine the signal from React Query with our local one
        const combinedSignal = signal || localSignal

        // Set up a cleanup function
        const cleanup = () => {
          try {
            if (!controller.signal.aborted) {
              controller.abort()
              console.log(`%c Aborted meeting minutes request for event ID ${numericEventId}`, 'background: #f0f; color: #fff')
            }
          } catch (e) {
            console.error('Error during cleanup:', e)
          }
        }

        try {
          const result = await meetingMinutesApi.getMeetingMinutesByEventId(numericEventId, combinedSignal)
          console.log('%c Fetched result:', 'background: #0f0; color: #000', result)
          return result
        } catch (error) {
          // Handle canceled requests gracefully
          if (axios.isCancel(error)) {
            console.log(`Meeting minutes request for event ID ${numericEventId} was cancelled - returning empty array`)
            return [] // Return empty array instead of throwing error
          }

          // For other errors, log and return empty array
          console.error('%c Error in useMeetingMinutesByEvent:', 'background: #f00; color: #fff', error)
          return []
        } finally {
          // Clean up our controller
          cleanup()
        }
      } catch (outerError) {
        // This catches any errors in our setup code
        console.error('%c Outer error in useMeetingMinutesByEvent:', 'background: #f00; color: #fff', outerError)
        return []
      }
    },
    // Disable stale time to always fetch fresh data
    staleTime: 0,
    // Disable caching
    gcTime: 0,
    // Always refetch on window focus
    refetchOnWindowFocus: true,
    // Always refetch on mount
    refetchOnMount: true,
    // Retry failed requests
    retry: (failureCount, error: any) => {
      // Don't retry if the request was canceled
      if (axios.isCancel(error) || error?.name === 'CanceledError') {
        console.log('%c Not retrying canceled request', 'background: #f00; color: #fff')
        return false
      }
      // Don't retry 403 errors
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        console.log('%c Not retrying 403 error', 'background: #f00; color: #fff')
        return false
      }
      // Don't retry 404 errors
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('%c Not retrying 404 error', 'background: #f00; color: #fff')
        return false
      }
      // Don't retry 502 or 504 errors (gateway issues)
      if (axios.isAxiosError(error) && (error.response?.status === 502 || error.response?.status === 504)) {
        console.log('%c Not retrying gateway error', 'background: #f00; color: #fff')
        return false
      }
      // Retry up to 2 times for other errors (reduced from 3)
      console.log('%c Retrying request, attempt', 'background: #f00; color: #fff', failureCount + 1, 'of 2')
      return failureCount < 2
    },
  })

  // Enhanced refetch function that also invalidates the query cache
  const enhancedRefetch = async () => {
    console.log('%c Enhanced refetch called for event ID', 'background: #f0f; color: #fff', numericEventId)

    // Force clear the cache completely
    console.log('%c Clearing query cache', 'background: #f0f; color: #fff')
    queryClient.clear()

    // Invalidate ALL queries
    console.log('%c Invalidating all queries', 'background: #f0f; color: #fff')
    queryClient.invalidateQueries()

    // Specifically invalidate this event's query
    console.log('%c Specifically invalidating event query', 'background: #f0f; color: #fff', eventMinutesKey)
    queryClient.invalidateQueries({ queryKey: eventMinutesKey })

    // Invalidate all meeting minutes queries
    console.log('%c Invalidating all meeting minutes queries', 'background: #f0f; color: #fff')
    queryClient.invalidateQueries({ queryKey: meetingMinutesKeys.all })

    // Force refetch
    console.log('%c Forcing refetch', 'background: #f0f; color: #fff')
    try {
      // Reset the query to force a complete refresh
      await queryClient.resetQueries({ queryKey: eventMinutesKey })

      // Then refetch
      const result = await refetch()
      console.log('%c Refetch result:', 'background: #0f0; color: #000', result)
      return result
    } catch (error) {
      console.error('%c Error during refetch:', 'background: #f00; color: #fff', error)
      throw error
    }
  }

  // Handle errors gracefully
  if (error) {
    console.error(`Error in useMeetingMinutesByEvent(${numericEventId}):`, error)

    // Check if it's a 403 error (permission denied)
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      console.log('Permission denied for meeting minutes. Returning empty array.')
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk melihat notulensi ini.",
        variant: "destructive",
      })
    }

    // Check if it's a timeout error
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      console.log('Timeout error fetching meeting minutes. Returning empty array.')
      toast({
        title: "Waktu permintaan habis",
        description: "Tidak dapat memuat data notulensi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    }
  }

  return {
    data: data || [],
    isLoading,
    error,
    refetch: enhancedRefetch
  }
}

// Hook for fetching a single meeting minutes item
export function useMeetingMinutesItem(id: number | string) {
  const { toast } = useToast()

  return useQuery({
    queryKey: meetingMinutesKeys.detail(id),
    queryFn: async ({ signal }) => {
      try {
        // This will now always return data, even in error cases
        return await meetingMinutesApi.getMeetingMinutesById(id, signal)
      } catch (error) {
        // This should never happen since the API function handles all errors internally
        // But just in case, we'll handle it here too
        console.error(`Unexpected error in useMeetingMinutesItem(${id}):`, error);

        // Show toast notification
        toast({
          title: "Terjadi kesalahan",
          description: "Tidak dapat memuat data notulensi.",
          variant: "destructive",
        });

        // Rethrow the error to be handled by the component
        throw error;
      }
    },
    enabled: !!id,
    retry: (failureCount, error: any) => {
      // Don't retry if the request was canceled
      if (axios.isCancel(error)) {
        return false
      }
      // Don't retry timeout errors after 1 attempt
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED' && failureCount >= 1) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    // Return a default value on error to prevent UI from breaking
    // Increase stale time to reduce unnecessary refetches
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for meeting minutes mutations (create, update, delete)
export function useMeetingMinutesMutations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createMeetingMinutes = useMutation({
    mutationFn: (data: MeetingMinutesFormData) => meetingMinutesApi.createMeetingMinutes(data),
    onSuccess: (data) => {
      console.log('%c Meeting minutes created successfully:', 'background: #0f0; color: #000', data)

      // Get the event ID from the created data
      const eventId = data.event_id
      console.log('%c Event ID from created data:', 'background: #0f0; color: #000', eventId, 'Type:', typeof eventId)

      // Force clear the cache completely
      console.log('%c Clearing query cache', 'background: #0f0; color: #000')
      queryClient.clear()

      // Invalidate ALL queries to force a complete refresh
      console.log('%c Invalidating all queries', 'background: #0f0; color: #000')
      queryClient.invalidateQueries()

      // Specifically invalidate meeting minutes queries
      console.log('%c Invalidating meeting minutes queries', 'background: #0f0; color: #000')
      queryClient.invalidateQueries({ queryKey: meetingMinutesKeys.all })
      queryClient.invalidateQueries({ queryKey: meetingMinutesKeys.lists() })

      // Invalidate the specific event's meeting minutes query
      console.log('%c Invalidating event-specific meeting minutes query', 'background: #0f0; color: #000', [...meetingMinutesKeys.all, 'event', eventId])
      queryClient.invalidateQueries({ queryKey: [...meetingMinutesKeys.all, 'event', eventId] })

      // Reset queries to force a complete refresh
      console.log('%c Resetting queries', 'background: #0f0; color: #000')
      queryClient.resetQueries({ queryKey: meetingMinutesKeys.all })
      queryClient.resetQueries({ queryKey: [...meetingMinutesKeys.all, 'event', eventId] })

      // Force refetch ALL queries
      console.log('%c Force refetching all queries', 'background: #0f0; color: #000')
      queryClient.refetchQueries()

      // Specifically force refetch meeting minutes queries
      console.log('%c Force refetching meeting minutes queries', 'background: #0f0; color: #000')
      queryClient.refetchQueries({ queryKey: meetingMinutesKeys.lists() })
      queryClient.refetchQueries({ queryKey: [...meetingMinutesKeys.all, 'event', eventId] })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Notulensi berhasil dibuat",
      })
    },
    onError: (error) => {
      console.error("Error creating meeting minutes:", error)

      // Show more specific error messages based on the error type
      let errorMessage = "Terjadi kesalahan saat membuat notulensi";

      if (error instanceof Error) {
        // Use the error message from the API if available
        errorMessage = error.message;
      }

      // Show error toast with the appropriate message
      toast({
        title: "Gagal",
        description: errorMessage,
        variant: "destructive",
      })
    }
  })

  const updateMeetingMinutes = useMutation({
    // Adjusting data type to match API function expectation (potential issue to revisit)
    mutationFn: ({ id, data }: { id: number | string, data: MeetingMinutesFormData }) =>
      meetingMinutesApi.updateMeetingMinutes(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific meeting minutes item and list
      queryClient.invalidateQueries({ queryKey: meetingMinutesKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: meetingMinutesKeys.lists() })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Notulensi berhasil diperbarui",
      })
    },
    onError: (error) => {
      console.error("Error updating meeting minutes:", error)

      // Show more specific error messages based on the error type
      let errorMessage = "Terjadi kesalahan saat memperbarui notulensi";

      if (error instanceof Error) {
        // Use the error message from the API if available
        errorMessage = error.message;
      }

      // Show error toast with the appropriate message
      toast({
        title: "Gagal",
        description: errorMessage,
        variant: "destructive",
      })
    }
  })

  const deleteMeetingMinutes = useMutation({
    mutationFn: (id: number | string) => meetingMinutesApi.deleteMeetingMinutes(id),
    onSuccess: (_, id) => {
      // Invalidate all meeting minutes queries
      queryClient.invalidateQueries({ queryKey: meetingMinutesKeys.lists() })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Notulensi berhasil dihapus",
      })
    },
    onError: (error) => {
      console.error("Error deleting meeting minutes:", error)

      // Show more specific error messages based on the error type
      let errorMessage = "Terjadi kesalahan saat menghapus notulensi";

      if (error instanceof Error) {
        // Use the error message from the API if available
        errorMessage = error.message;
      }

      // Show error toast with the appropriate message
      toast({
        title: "Gagal",
        description: errorMessage,
        variant: "destructive",
      })
    }
  })

  return {
    createMeetingMinutes,
    updateMeetingMinutes,
    deleteMeetingMinutes,
  }
}
