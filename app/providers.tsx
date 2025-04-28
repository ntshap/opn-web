"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster, toast } from 'sonner';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '@/lib/config';
import { defaultRetryFunction, handleQueryError } from '@/lib/query-utils';
import { LucideProvider } from '@/lib/lucide-config';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: API_CONFIG.CACHE_DURATION,
            gcTime: API_CONFIG.CACHE_DURATION * 2,
            retry: (failureCount, error) => defaultRetryFunction(failureCount, error, API_CONFIG.RETRY.ATTEMPTS),
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            // Add a global error handler for queries
            onError: (error) => {
              handleQueryError(error);

              // Show error toast for non-canceled errors
              if (!axios.isCancel(error) && error instanceof Error) {
                toast.error(error.message);
              }
            },
          },
          mutations: {
            retry: API_CONFIG.RETRY.ATTEMPTS,
            onError: (error: unknown) => {
              if (error instanceof Error) {
                toast.error(error.message);
              }
            },
          },
        },
      })
  );

  // Use state to track if we're on the client side
  const [mounted, setMounted] = useState(false);

  // When the component mounts, we're on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" suppressHydrationWarning>
        <LucideProvider>
          {children}
          {mounted && <Toaster />}
        </LucideProvider>
      </ThemeProvider>
      {mounted && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}




