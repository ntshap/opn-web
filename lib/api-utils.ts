/**
 * API Utilities
 * Contains helper functions for API calls
 */
import axios, { AxiosError, type AxiosResponse } from "axios";
import { API_CONFIG } from './config';

/**
 * Check if the backend API is online
 * @returns Promise<boolean> True if the backend is online, false otherwise
 */
export const isBackendOnline = async (): Promise<boolean> => {
  try {
    // Try to ping a known endpoint on the backend API with a short timeout
    // Create an AbortController to implement timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    // Add cache-busting parameter to prevent caching
    const timestamp = new Date().getTime();

    // Use the /auth/token endpoint which we know exists
    // We're just checking if the server responds, not trying to authenticate
    const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/v1/auth/token?_=${timestamp}`, {
      method: 'HEAD', // Use HEAD request to avoid downloading the full response
      signal: controller.signal,
      cache: 'no-store', // Don't cache the response
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    // Clear the timeout
    clearTimeout(timeoutId);

    // If we get any response (even 401 Unauthorized), the backend is online
    // We just want to know if the server is responding
    return response.status < 500;
  } catch (error) {
    console.error('[API] Backend health check failed:', error)
    return false
  }
}

/**
 * Helper function to implement retry logic with exponential backoff
 * @param apiCall Function that makes the API call
 * @param retries Number of retries to attempt
 * @param initialDelay Initial delay in milliseconds
 * @returns Promise with the API response
 */
export async function withRetry<T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  retries = API_CONFIG?.RETRY?.ATTEMPTS || 3,
  initialDelay = API_CONFIG?.RETRY?.DELAY || 1000,
): Promise<AxiosResponse<T>> {
  try {
    console.log('Making API call with retry mechanism');
    return await apiCall();
  } catch (error: any) {
    if (!retries) {
      console.error('No more retries left, throwing error:', error);
      throw error;
    }

    // Don't retry canceled requests
    if (axios.isCancel(error)) {
      console.log('Request was cancelled, not retrying');
      throw error;
    }

    // Check for network errors or server errors
    let shouldRetry = false;

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Retry on network errors, timeouts, or server errors (5xx)
      shouldRetry =
        axiosError.code === 'ECONNABORTED' ||
        axiosError.message === 'Network Error' ||
        (axiosError.response?.status !== undefined && axiosError.response.status >= 500);

      console.log(`Axios error: ${axiosError.message}, status: ${axiosError.response?.status}, code: ${axiosError.code}`);
    } else {
      // For non-Axios errors, check if it's a network error
      shouldRetry = error.message === 'Network Error' || error.message?.includes('network');
      console.log('Non-Axios error:', error.message);
    }

    if (!shouldRetry) {
      console.log(`Error is not retryable, throwing error`);
      throw error;
    }

    // Calculate delay with exponential backoff
    const backoffFactor = API_CONFIG?.RETRY?.BACKOFF_FACTOR || 2;
    const maxAttempts = API_CONFIG?.RETRY?.ATTEMPTS || 3;
    const delay = Math.min(
      initialDelay * Math.pow(backoffFactor, maxAttempts - retries),
      30000 // Max delay of 30 seconds
    );

    console.log(`Request failed, retrying in ${delay}ms... (${retries} attempts remaining)`);
    await new Promise(resolve => setTimeout(resolve, delay));

    return withRetry(apiCall, retries - 1, initialDelay);
  }
}
