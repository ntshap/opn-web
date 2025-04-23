"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { feedbackApi, type Feedback, type FeedbackFormData } from "@/lib/api-feedback"
import { useToast } from "@/components/ui/use-toast"

// Query keys for feedback
export const feedbackKeys = {
  all: ['feedback'] as const,
  lists: () => [...feedbackKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...feedbackKeys.lists(), filters] as const,
  details: () => [...feedbackKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...feedbackKeys.details(), id] as const,
  event: (eventId: number | string | null) => [...feedbackKeys.all, 'event', eventId || 'none'] as const,
}

// Hook for fetching feedback for an event
export function useEventFeedback(eventId: number | string | null) {
  const { toast } = useToast()

  return useQuery({
    queryKey: feedbackKeys.event(eventId || 'none'),
    queryFn: async ({ signal }) => {
      // If eventId is null or undefined, return empty array
      if (!eventId) {
        console.log('No event ID provided for feedback. Returning empty array.');
        return [];
      }

      try {
        return await feedbackApi.getEventFeedback(eventId, signal)
      } catch (error) {
        // Handle specific error cases
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 403) {
            console.log('Permission denied for feedback. Returning empty array.')
            return [] // Return empty array for 403 errors
          }

          // Handle timeout errors
          if (error.code === 'ECONNABORTED') {
            console.log('Timeout error fetching feedback. Returning empty array.')
            toast({
              title: "Waktu permintaan habis",
              description: "Tidak dapat memuat data feedback. Silakan coba lagi nanti.",
              variant: "destructive",
            })
            return [] // Return empty array for timeout errors
          }
        }

        // For all other errors, return empty array to prevent UI from breaking
        console.error('Error fetching event feedback:', error)
        return []
      }
    },
    retry: (failureCount, error) => {
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
    onError: (error) => {
      console.error('Error in useEventFeedback:', error)
    },
    // Refetch every 30 seconds to get new feedback
    refetchInterval: 30000,
  })
}

// Hook for fetching a single feedback
export function useFeedback(id: number | string) {
  const { toast } = useToast()

  return useQuery({
    queryKey: feedbackKeys.detail(id),
    queryFn: async ({ signal }) => {
      try {
        const feedback = await feedbackApi.getFeedback(id, signal)
        if (!feedback) {
          throw new Error('Feedback not found')
        }
        return feedback
      } catch (error) {
        // Handle specific error cases
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            toast({
              title: "Feedback tidak ditemukan",
              description: "Feedback yang Anda cari tidak ditemukan.",
              variant: "destructive",
            })
          }
        }

        // Rethrow the error to be handled by the component
        throw error
      }
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      // Don't retry if the request was canceled
      if (axios.isCancel(error)) {
        return false
      }
      // Don't retry 404 errors
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
  })
}

// Hook for feedback mutations (create, update, delete)
export function useFeedbackMutations(eventId: number | string | null) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createFeedback = useMutation({
    mutationFn: (data: FeedbackFormData) => {
      // If eventId is null or undefined, throw an error
      if (!eventId) {
        throw new Error('Cannot create feedback: No event ID provided');
      }
      return feedbackApi.createFeedback(eventId, data);
    },
    onSuccess: () => {
      // Invalidate the event feedback query to refetch the list
      queryClient.invalidateQueries({ queryKey: feedbackKeys.event(eventId || 'none') })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Feedback berhasil dikirim",
      })
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat mengirim feedback",
        variant: "destructive",
      })
      console.error("Error creating feedback:", error)
    }
  })

  const updateFeedback = useMutation({
    mutationFn: ({ id, data }: { id: number | string, data: FeedbackFormData }) => {
      // If eventId is null or undefined, throw an error
      if (!eventId) {
        throw new Error('Cannot update feedback: No event ID provided');
      }
      return feedbackApi.updateFeedback(id, data);
    },
    onSuccess: () => {
      // Invalidate the event feedback query to refetch the list
      queryClient.invalidateQueries({ queryKey: feedbackKeys.event(eventId || 'none') })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Feedback berhasil diperbarui",
      })
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat memperbarui feedback",
        variant: "destructive",
      })
      console.error("Error updating feedback:", error)
    }
  })

  const deleteFeedback = useMutation({
    mutationFn: (id: number | string) => {
      // If eventId is null or undefined, throw an error
      if (!eventId) {
        throw new Error('Cannot delete feedback: No event ID provided');
      }
      return feedbackApi.deleteFeedback(id);
    },
    onSuccess: () => {
      // Invalidate the event feedback query to refetch the list
      queryClient.invalidateQueries({ queryKey: feedbackKeys.event(eventId || 'none') })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Feedback berhasil dihapus",
      })
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat menghapus feedback",
        variant: "destructive",
      })
      console.error("Error deleting feedback:", error)
    }
  })

  return {
    createFeedback,
    updateFeedback,
    deleteFeedback,
  }
}
