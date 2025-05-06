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

  // Log the params for debugging
  console.log('useNews hook called with params:', params)

  return useQuery<NewsItem[], Error>({
    queryKey: newsKeys.list(params || {}),
    queryFn: async ({ signal }) => {
      console.log('useNews queryFn executing with params:', params)

      try {
        // Check if the signal is aborted before making the request
        if (signal?.aborted) {
          console.log('Request was aborted before execution')
          return []
        }

        // Add a timestamp to prevent caching issues
        const paramsWithTimestamp = {
          ...params,
          _t: Date.now()
        }

        console.log('Calling newsApi.getNews with params:', paramsWithTimestamp)
        const data = await newsApi.getNews(paramsWithTimestamp, signal)
        console.log('newsApi.getNews returned data:', data)

        // Additional validation at the hook level
        if (!Array.isArray(data)) {
          console.error('Invalid data format received:', data)
          // Return empty array instead of throwing to prevent UI errors
          return []
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

        // Filter out invalid items instead of throwing an error
        const validItems = data.filter(isValidNewsItem)
        console.log(`Filtered ${data.length} news items to ${validItems.length} valid items`)

        if (validItems.length < data.length) {
          console.warn('Some news items had invalid format and were filtered out')
        }

        return validItems
      } catch (error) {
        // Handle axios cancellation errors silently
        if (axios.isCancel(error)) {
          console.log('Request was cancelled')
          return []
        }

        // Handle specific error types
        if (error instanceof Error) {
          console.error('Error in useNews:', error.message)

          // Don't show toast for every error to avoid spamming the user
          // Only show for specific errors that need user attention
          if (error.message !== 'An unexpected error occurred' &&
              !error.message.includes('aborted') &&
              !error.message.includes('cancel')) {
            toast({
              title: "Perhatian",
              description: "Gagal memuat data berita. Silakan coba lagi nanti.",
              variant: "destructive",
            })
          }

          // Return empty array instead of throwing to prevent UI errors
          return []
        }

        // Handle unknown errors
        console.error('Unknown error in useNews:', error)
        // Return empty array instead of throwing to prevent UI errors
        return []
      }
    },
    retry: (failureCount, error) => {
      // Don't retry for cancelled requests or aborted signals
      if (axios.isCancel(error) ||
          (error instanceof Error && (
            error.message.includes('aborted') ||
            error.message.includes('cancel')
          ))) {
        return false
      }
      return failureCount < 2
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Add refetchOnWindowFocus: false to prevent unnecessary refetches
    refetchOnWindowFocus: false
  })
}

// Hook for fetching a single news item
export function useNewsItem(id: number | string) {
  const { toast } = useToast()

  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: async ({ signal }) => {
      console.log(`[useNewsItem] Fetching news item with ID: ${id}`);
      try {
        // Add a timestamp to prevent caching issues
        const timestamp = Date.now();
        console.log(`[useNewsItem] Adding timestamp to prevent caching: ${timestamp}`);

        const data = await newsApi.getNewsItem(id, signal);
        console.log(`[useNewsItem] Successfully fetched news item:`, data);

        // Validate the data structure
        if (!data) {
          console.error(`[useNewsItem] No data returned for news item with ID: ${id}`);
          throw new Error('No data returned from API');
        }

        // Ensure we have a valid description
        if (!data.description) {
          console.warn(`[useNewsItem] News item has no description, setting empty string`);
          data.description = '';
        } else {
          console.log(`[useNewsItem] Description type: ${typeof data.description}, length: ${data.description.length}`);

          // Check if the description is valid HTML or just plain text
          if (typeof data.description === 'string' && !data.description.includes('<')) {
            console.log(`[useNewsItem] Description appears to be plain text, not HTML`);
          }

          // Log a sample of the description for debugging
          if (typeof data.description === 'string' && data.description.length > 0) {
            console.log(`[useNewsItem] Description sample: ${data.description.substring(0, 100)}...`);
          }
        }

        // Log the photos for debugging
        if (data.photos && data.photos.length > 0) {
          console.log(`[useNewsItem] News has ${data.photos.length} photos`);
          data.photos.forEach((photo, index) => {
            console.log(`[useNewsItem] Photo ${index + 1}: ${photo.photo_url}`);

            // Validate photo URL
            if (!photo.photo_url) {
              console.warn(`[useNewsItem] Photo ${index + 1} has no URL`);
            } else if (photo.photo_url.includes('localhost')) {
              console.error(`[useNewsItem] Photo ${index + 1} has localhost URL: ${photo.photo_url}`);
            }
          });
        } else {
          console.log(`[useNewsItem] News has no photos`);
        }

        return data;
      } catch (error) {
        console.error(`[useNewsItem] Error fetching news item:`, error);
        throw error;
      }
    },
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
      // Show success toast first
      toast({
        title: "Berhasil",
        description: "Berita berhasil dihapus",
      })

      // Use a small delay before invalidating queries to avoid race conditions
      setTimeout(() => {
        // Invalidate specific news item first
        queryClient.invalidateQueries({ queryKey: newsKeys.detail(id) })

        // Then invalidate the list queries
        queryClient.invalidateQueries({
          queryKey: newsKeys.lists(),
          // Don't throw on error during refetch
          throwOnError: false
        })
      }, 300)
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
