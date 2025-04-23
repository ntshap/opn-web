"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { newsApi, type NewsItem, type NewsFormData } from "@/lib/api-service" // Updated path
import { useToast } from "@/components/ui/use-toast"

// Query keys for news
export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...newsKeys.lists(), filters] as const,
  details: () => [...newsKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...newsKeys.details(), id] as const,
}

// Hook for fetching news with filters
export function useNews(params?: {
  skip?: number
  limit?: number
  is_published?: boolean
  search?: string
}) {
  const { toast } = useToast()
  
  return useQuery<NewsItem[], Error>({
    queryKey: newsKeys.list(params || {}),
    queryFn: async ({ signal }) => {
      try {
        const data = await newsApi.getNews(params, signal)
        
        // Additional validation at the hook level
        if (!Array.isArray(data)) {
          console.error('Invalid data format received:', data)
          toast({
            title: "Error",
            description: "Invalid data format received from server",
            variant: "destructive",
          })
          throw new Error('Invalid response format from server')
        }

        // Validate that each item has the required fields
        const isValidNewsItem = (item: any): item is NewsItem => {
          return (
            item &&
            typeof item === 'object' &&
            typeof item.id === 'number' &&
            typeof item.title === 'string' &&
            typeof item.description === 'string' &&
            typeof item.date === 'string' &&
            typeof item.is_published === 'boolean'
          )
        }

        if (!data.every(isValidNewsItem)) {
          console.error('Invalid news items in response:', data)
          toast({
            title: "Error",
            description: "Some news items have invalid format",
            variant: "destructive",
          })
          throw new Error('Invalid news items in response')
        }

        return data
      } catch (error) {
        // Handle specific error types
        if (error instanceof Error) {
          console.error('Error in useNews:', error.message)
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          })
          throw error
        }

        // Handle unknown errors
        console.error('Unknown error in useNews:', error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
        throw new Error('An unexpected error occurred')
      }
    },
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === 'Invalid response format from server') {
        return false // Don't retry for invalid format errors
      }
      return failureCount < 2
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}

// Hook for fetching a single news item
export function useNewsItem(id: number | string) {
  const { toast } = useToast()

  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: ({ signal }) => newsApi.getNewsItem(id, signal),
    enabled: !!id,
    retry: (failureCount, error) => {
      if (axios.isCancel(error)) {
        return false
      }
      return failureCount < 2
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

// Hook for news mutations (create, update, delete)
export function useNewsMutations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createNews = useMutation({
    mutationFn: (data: NewsFormData) => newsApi.createNewsItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() })
      toast({
        title: "Berhasil",
        description: "Berita berhasil dibuat",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Terjadi kesalahan saat membuat berita",
        variant: "destructive",
      })
      console.error("Error creating news:", error)
    }
  })

  const updateNews = useMutation({
    mutationFn: ({ id, data }: { id: number | string, data: NewsFormData }) =>
      newsApi.updateNewsItem(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: newsKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() })
      toast({
        title: "Berhasil",
        description: "Berita berhasil diperbarui",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Terjadi kesalahan saat memperbarui berita",
        variant: "destructive",
      })
      console.error("Error updating news:", error)
    }
  })

  const deleteNews = useMutation({
    mutationFn: (id: number | string) => newsApi.deleteNewsItem(id),
    onSuccess: (_, id) => {
      // Invalidate all news queries
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Berita berhasil dihapus",
      })
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat menghapus berita",
        variant: "destructive",
      })
      console.error("Error deleting news:", error)
    }
  })

  const uploadNewsPhoto = useMutation({
    mutationFn: ({ id, file }: { id: number | string, file: File }) =>
      newsApi.uploadNewsPhoto(id, file),
    onSuccess: (_, variables) => {
      // Invalidate specific news item
      queryClient.invalidateQueries({ queryKey: newsKeys.detail(variables.id) })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Foto berhasil diunggah",
      })
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat mengunggah foto",
        variant: "destructive",
      })
      console.error("Error uploading photo:", error)
    }
  })

  return {
    createNews,
    updateNews,
    deleteNews,
    uploadNewsPhoto,
  }
}
