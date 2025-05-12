import { useMutation, useQuery } from '@tanstack/react-query';
import { Finance, financeApi, FinanceHistoryResponse as ApiFinanceHistoryResponse } from '@/lib/api-service'; // Updated path
import { uploadsApi } from '@/lib/api-uploads';


// This interface matches the transaction object in the API response
export interface FinanceTransaction {
  id: number;
  amount: string;
  category: string;
  date: string;
  description: string;
  balance_before: string;
  balance_after: string;
  document_url: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// This interface matches the API response from /api/v1/finance/history
export interface FinanceHistoryResponse {
  transactions: FinanceTransaction[];
  current_balance: string;
}

export interface FinanceData {
  amount: number;
  category: "Pemasukan" | "Pengeluaran";
  date: string;
  description: string;
}

interface UpdateFinanceParams {
  id: number;
  data: FinanceData;
}

// Add the missing useFinance hook to fetch a single finance record
export function useFinance(id: string | number) {
  return useQuery<Finance>({
    queryKey: ['finance', id],
    queryFn: async () => {
      console.log(`Fetching finance record with ID ${id}`);
      // Use the statically imported financeApi
      try {
        // Removed dynamic import: const { financeApi } = await import('@/lib/api');
        const financeRecord = await financeApi.getFinance(id);
        console.log('Finance record response:', financeRecord);
        return financeRecord;
      } catch (error) {
        console.error('Error fetching finance record:', error);
        throw error;
      }
    },
    staleTime: 30000,
    retryDelay: (attemptIndex: number) => Math.min(
      1000 * Math.pow(2, attemptIndex),
      30000
    )
  });
}

// This hook was missing before, now correctly defined
export function useFinanceHistory() {
  return useQuery<FinanceHistoryResponse>({
    queryKey: ['finance-history'],
    queryFn: async () => {
      console.log('Fetching finance history');
      // Use the statically imported financeApi
      try {
        // Removed dynamic import: const { financeApi } = await import('@/lib/api');
        const historyResponse = await financeApi.getFinanceHistory();
        console.log('Finance history response:', historyResponse);
        return historyResponse;
      } catch (error) {
        console.error('Error fetching finance history:', error);
        throw error;
      }
    },
    staleTime: 30000,
    retryDelay: (attemptIndex: number) => Math.min(
      1000 * Math.pow(2, attemptIndex),
      30000
    )
  });
}


export function useFinanceMutations() {
  const createFinance = useMutation<Finance, Error, FinanceData>({
    mutationFn: async (data: FinanceData) => {
      console.log('Creating finance record:', data);
      // Use the statically imported financeApi
      try {
        // Removed dynamic import: const { financeApi } = await import('@/lib/api');
        return await financeApi.createFinance(data);
      } catch (error) {
        console.error('Error creating finance record:', error);
        throw error;
      }
    }
  });

  const updateFinance = useMutation<Finance, Error, UpdateFinanceParams>({
    mutationFn: async ({ id, data }: UpdateFinanceParams) => {
      console.log(`Updating finance record ${id}:`, data);
      // Use the statically imported financeApi
      try {
        // Removed dynamic import: const { financeApi } = await import('@/lib/api');
        return await financeApi.updateFinance(id, data);
      } catch (error) {
        console.error('Error updating finance record:', error);
        throw error;
      }
    }
  });

  const deleteFinance = useMutation<void, Error, number | string>({
    mutationFn: async (id: number | string) => {
      console.log(`Deleting finance record ${id}`);
      // Use the statically imported financeApi
      try {
        // Removed dynamic import: const { financeApi } = await import('@/lib/api');
        await financeApi.deleteFinance(id);
      } catch (error) {
        console.error('Error deleting finance record:', error);
        throw error;
      }
    }
  });



  // Upload document mutation using the proper API function with PUT method
  const uploadDocument = useMutation<any, Error, { financeId: number | string, file: File }>({
    mutationFn: async ({ financeId, file }: { financeId: number | string, file: File }) => {
      console.log(`Uploading document for finance record ${financeId} using PUT method`);
      try {
        // Use the uploadsApi to upload the document with PUT method
        // Note: We use PUT for both new uploads and updates as per backend requirements
        const response = await uploadsApi.uploadFinanceDocument(financeId, file);
        console.log('Document upload response:', response);
        return response;
      } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
      }
    }
  });

  return {
    createFinance,
    updateFinance,
    deleteFinance,
    uploadDocument
  };
}
