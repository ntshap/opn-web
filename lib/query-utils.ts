/**
 * Utility functions for React Query
 */
import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

/**
 * Default error handler for React Query that ignores canceled requests
 * @param error The error to handle
 * @param options Options for error handling
 */
export function handleQueryError(
  error: unknown, 
  options: { 
    showConsoleError?: boolean; 
    logMessage?: string;
  } = {}
) {
  const { showConsoleError = true, logMessage = 'Query error:' } = options;
  
  // Don't treat canceled requests as errors
  if (axios.isCancel(error)) {
    console.log('Request was canceled - this is normal when components unmount');
    return;
  }
  
  // Log other errors
  if (showConsoleError) {
    console.error(logMessage, error);
  }
}

/**
 * Default retry function for React Query that doesn't retry canceled requests
 * @param failureCount The number of times the query has failed
 * @param error The error that caused the failure
 * @param maxRetries Maximum number of retries
 */
export function defaultRetryFunction(
  failureCount: number, 
  error: unknown, 
  maxRetries: number = 3
): boolean {
  // Don't retry if the request was canceled
  if (axios.isCancel(error)) {
    return false;
  }
  
  // Don't retry 404 errors
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return false;
  }
  
  // Don't retry 403 errors
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return false;
  }
  
  // Otherwise retry up to maxRetries times
  return failureCount < maxRetries;
}

/**
 * Configure a QueryClient to handle canceled requests gracefully
 * @param queryClient The QueryClient to configure
 */
export function configureCanceledRequestHandling(queryClient: QueryClient) {
  // Set default error behavior for all queries
  queryClient.setDefaultOptions({
    queries: {
      retry: (failureCount, error) => defaultRetryFunction(failureCount, error),
      onError: (error) => handleQueryError(error),
    },
  });
}
