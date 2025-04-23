import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/lib/api-service'; // Updated path
import { API_CONFIG } from '@/lib/config';
import { toast } from 'sonner';

export interface FinanceSummary {
  total_income: string;
  total_expense: string;
  current_balance: string;
}

export function useFinanceData() {
  return useQuery<FinanceSummary>({
    queryKey: ['finance-summary'],
    queryFn: async (): Promise<FinanceSummary> => {
      console.log('Fetching finance summary from:', `${API_CONFIG.BASE_URL}/finance/summary`);

      try {
        // Check network connectivity
        if (!navigator.onLine) {
          console.log('No internet connection, using cached data if available');
          throw new Error('No internet connection');
        }

        // Use financeApi instead of apiClient
        const data = await financeApi.getFinanceSummary();
        console.log('Finance summary response data:', data);

        if (!data || typeof data !== 'object') {
          console.error('Invalid finance summary data received:', data);
          throw new Error('Invalid finance summary data format');
        }

        // Validate and sanitize the received data
        const totalIncome = data.total_income ? String(Math.max(0, Number(data.total_income))) : "0";
        const totalExpense = data.total_expense ? String(Math.max(0, Number(data.total_expense))) : "0";
        let currentBalance = data.current_balance;

        // Ensure current_balance is correctly calculated
        const calculatedBalance = Number(totalIncome) - Number(totalExpense);
        if (!currentBalance || Math.abs(Number(currentBalance) - calculatedBalance) > 0.01) {
          currentBalance = String(calculatedBalance);
          console.log('Recalculated current balance:', currentBalance);
        }

        return {
          total_income: totalIncome,
          total_expense: totalExpense,
          current_balance: currentBalance
        };
      } catch (error: any) {
        console.error('Error fetching finance summary:', error);

        // Show appropriate error message to user
        const errorMessage = error.message === 'No internet connection'
          ? 'Unable to fetch latest financial data. Using cached data if available.'
          : 'Error loading financial data. Trying alternative source...';
        toast.error(errorMessage);

        // Try to get data from the finance history as fallback
        try {
          // Use financeApi instead of apiClient
          const historyResponse = await financeApi.getFinanceHistory();
          console.log('Fallback to finance history:', historyResponse);

          if (historyResponse?.transactions?.length > 0) {
            const { totalIncome, totalExpense } = historyResponse.transactions.reduce(
              (acc: { totalIncome: number; totalExpense: number }, transaction: any) => {
                const amount = Number(transaction.amount) || 0;
                if (transaction.category === 'Pemasukan' && amount > 0) {
                  acc.totalIncome += amount;
                } else if (transaction.category === 'Pengeluaran' && amount > 0) {
                  acc.totalExpense += amount;
                }
                return acc;
              },
              { totalIncome: 0, totalExpense: 0 }
            );

            const currentBalance = totalIncome - totalExpense;

            console.log('Calculated from transactions:', {
              totalIncome, totalExpense, currentBalance
            });

            return {
              total_income: String(totalIncome),
              total_expense: String(totalExpense),
              current_balance: String(currentBalance)
            };
          }
        } catch (historyError) {
          console.error('Error fetching finance history as fallback:', historyError);
        }

        // Return default values if all else fails
        return {
          total_income: "0",
          total_expense: "0",
          current_balance: "0"
        };
      }
    },
    staleTime: API_CONFIG.CACHE_DURATION,
    retry: API_CONFIG.RETRY.ATTEMPTS,
    retryDelay: (attemptIndex) => Math.min(
      API_CONFIG.RETRY.DELAY * Math.pow(API_CONFIG.RETRY.BACKOFF_FACTOR, attemptIndex),
      30000
    )
  });
}
