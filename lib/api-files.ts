import { apiClient } from './api-client';
import axios from 'axios';
import { API_CONFIG } from './config';

export const fileApi = {
  /**
   * Fetches a protected file as a Blob object using a relative path from the API.
   * @param relativePath - The relative path (e.g., /uploads/...) as received from the API.
   * @param signal - Optional AbortSignal
   * @returns Promise<Blob> - The file data as a Blob
   */
  getProtectedFile: async (relativePath: string, signal?: AbortSignal): Promise<Blob> => {
    // 1. Validate input is a non-empty string starting with /
    // Adjust validation if other path structures are possible
    if (!relativePath || typeof relativePath !== 'string' || !relativePath.startsWith('/')) {
      console.error('[API Files] Invalid or missing relative file path provided:', relativePath);
      return new Blob();
    }

    console.log(`[API Files] Received relative path: ${relativePath}`); // Log input

    try {
      // 2. Construct the full absolute URL
      const cleanRelativePath = relativePath; // Already starts with / based on validation

      // Use the exact backend URL without any manipulation
      const backendBaseUrl = 'https://backend-project-pemuda.onrender.com';

      // Construct the exact URL
      const fullUrl = `${backendBaseUrl}/${cleanRelativePath.startsWith('/') ? cleanRelativePath.substring(1) : cleanRelativePath}`;

      // Check if the URL contains localhost
      if (fullUrl.includes('localhost')) {
        console.error('[API Files] Error: URL contains localhost:', fullUrl);
        throw new Error('Direct localhost requests are not allowed');
      }

      console.log(`[API Files] Constructed full URL for direct fetch: ${fullUrl}`); // Log URL being fetched

      // 3. Fetch directly using apiClient (handles auth)
      const response = await apiClient.get(
        fullUrl, // Use the absolute URL that was constructed
        {
          responseType: 'blob',
          signal,
          timeout: 20000,
          // Auth header is added automatically by apiClient interceptor
        }
      );

      console.log(`[API Files] Successfully fetched file directly: ${fullUrl}`); // Log success
      return response.data; // Return the blob data

    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('[API Files] Direct file request was cancelled for path:', relativePath);
        return new Blob();
      }

      console.error(`[API Files] Error fetching file directly for path ${relativePath}:`, error);

      if (axios.isAxiosError(error)) {
        console.error(`[API Files] Axios error details: Status ${error.response?.status}`);
        if (error.response?.status === 404) {
          console.error('[API Files] URL that returned 404:', error.config?.url); // Log URL that failed with 404
        }
        console.error('[API Files] Request details:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          baseURL: error.config?.baseURL
        });
      }
      return new Blob(); // Return empty blob on error
    }
  }
};
