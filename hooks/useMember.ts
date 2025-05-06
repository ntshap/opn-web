"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/components/ui/use-toast"

// Query keys for a single member
export const memberKeys = {
  all: ['member'] as const,
  details: () => [...memberKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...memberKeys.details(), id] as const,
}

// Hook for fetching a single member by ID
export function useMember(memberId: number | string | null) {
  const { toast } = useToast()

  return useQuery({
    queryKey: memberKeys.detail(memberId || 'none'),
    queryFn: async () => {
      // If memberId is null or undefined, return null
      if (!memberId) {
        console.log('No member ID provided. Returning null.');
        return null;
      }

      try {
        const response = await axios.get(`/api/v1/members/${memberId}`);
        return response.data;
      } catch (error) {
        // Handle specific error cases
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            console.log(`Member with ID ${memberId} not found.`);
            return null;
          }

          // Handle timeout errors
          if (error.code === 'ECONNABORTED') {
            console.log('Timeout error fetching member. Returning null.');
            toast({
              title: "Waktu permintaan habis",
              description: "Tidak dapat memuat data anggota. Silakan coba lagi nanti.",
              variant: "destructive",
            });
            return null;
          }
        }

        // Log the error and return null
        console.error('Error fetching member:', error);
        return null;
      }
    },
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry if the request was canceled
      if (axios.isCancel(error)) {
        return false;
      }
      // Don't retry 404 errors
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}
