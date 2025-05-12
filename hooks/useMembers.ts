"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { memberApi, type Member, type MemberFormData, type MemberResponse, type BiodataFormData } from "@/lib/api-service" // Updated path
import { useToast } from "@/components/ui/use-toast"

// Query keys for members
export const memberKeys = {
  all: ['members'] as const,
  lists: () => [...memberKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...memberKeys.lists(), filters] as const,
  profile: () => [...memberKeys.all, 'profile'] as const,
}

// Hook for fetching all members
export function useMembers(filters?: { age_gt?: number }) {
  const { toast } = useToast()

  return useQuery({
    queryKey: memberKeys.list(filters || {}),
    queryFn: ({ signal }: { signal?: AbortSignal }) => memberApi.getMembers(signal, filters),
    retry: (failureCount, error: any) => {
      // Don't retry if the request was canceled
      if (axios.isCancel(error)) {
        console.log("[useMembers] Request was canceled, not retrying");
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    // Return a default value on error to prevent UI from breaking
    gcTime: 0, // Don't keep failed queries in cache
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    onError: (error) => {
      // Only show toast for non-cancellation errors
      if (!axios.isCancel(error)) {
        toast({
          title: "Gagal memuat data anggota",
          description: "Terjadi kesalahan saat memuat data anggota",
          variant: "destructive",
        })
      }
    }
  })
}

// Hook for fetching current user's profile
export function useMyProfile() {
  return useQuery({
    queryKey: memberKeys.profile(),
    queryFn: ({ signal }: { signal?: AbortSignal }) => memberApi.getMyProfile(signal),
    retry: (failureCount, error: any) => {
      // Don't retry if the request was canceled
      if (axios.isCancel(error)) {
        return false
      }
      // Retry up to 3 times for other errors
      return failureCount < 3
    },
  })
}

// Hook for member mutations (create, update, delete)
export function useMemberMutations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createUser = useMutation({
    mutationFn: (data: any) => memberApi.createUser(data),
    onSuccess: () => {
      // Invalidate all member queries to refetch the list
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Pengguna baru berhasil ditambahkan",
      })
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat menambahkan pengguna baru",
        variant: "destructive",
      })
      console.error("Error creating user:", error)
    }
  })

  const createMember = useMutation({
    mutationFn: (data: MemberFormData) => memberApi.createMember(data),
    onSuccess: () => {
      // Invalidate all member queries to refetch the list
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Anggota berhasil ditambahkan",
      })
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat menambahkan anggota",
        variant: "destructive",
      })
      console.error("Error creating member:", error)
    }
  })

  const createBiodata = useMutation({
    mutationFn: (data: BiodataFormData) => memberApi.createBiodata(data),
    onSuccess: () => {
      // Invalidate profile query to refetch the data
      queryClient.invalidateQueries({ queryKey: memberKeys.profile() })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Biodata berhasil ditambahkan",
      })
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat menambahkan biodata",
        variant: "destructive",
      })
      console.error("Error creating biodata:", error)
    }
  })

  const updateBiodata = useMutation({
    mutationFn: (data: BiodataFormData) => memberApi.updateBiodata(data),
    onSuccess: () => {
      // Invalidate profile query to refetch the data
      queryClient.invalidateQueries({ queryKey: memberKeys.profile() })
      // Invalidate members list to reflect changes
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Biodata berhasil diperbarui",
      })
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat memperbarui biodata",
        variant: "destructive",
      })
      console.error("Error updating biodata:", error)
    }
  })

  const deleteUser = useMutation({
    mutationFn: (userId: number | string) => memberApi.deleteUser(userId),
    onSuccess: () => {
      // Show success toast first
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus",
      })

      // Use setTimeout to delay the invalidation to avoid race conditions
      setTimeout(() => {
        // Invalidate all member queries to refetch the list
        queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
      }, 300)
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat menghapus pengguna",
        variant: "destructive",
      })
      console.error("Error deleting user:", error)
    }
  })

  // Upload member photo mutation
  const uploadMemberPhoto = useMutation({
    mutationFn: ({ memberId, file }: { memberId: number | string, file: File }) =>
      memberApi.uploadMemberPhoto(memberId, file),
    onSuccess: () => {
      // Invalidate all member queries to refetch the list with updated photos
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Foto anggota berhasil diunggah",
      })
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat mengunggah foto anggota",
        variant: "destructive",
      })
      console.error("Error uploading member photo:", error)
    }
  })

  return {
    createUser,
    createMember,
    createBiodata,
    updateBiodata,
    deleteUser,
    uploadMemberPhoto,
  }
}
