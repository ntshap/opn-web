/**
 * Uploads API Service
 * Handles all upload-related API calls
 */
import axios, { AxiosResponse } from 'axios';
import { apiClient, uploadsApiClient } from './api-client';
import { API_CONFIG } from './config';
import { getAuthToken } from './auth-utils';
import { withRetry } from './api-utils';

// Uploads API service
export const uploadsApi = {
  // Upload event photos
  uploadEventPhotos: async (
    eventId: number | string,
    files: File[],
    onProgress?: (percentage: number) => void
  ): Promise<any> => {
    try {
      // Detailed logging for debugging
      console.log('[API-Uploads] uploadEventPhotos called with eventId:', eventId, 'Type:', typeof eventId);

      // Validate eventId
      if (!eventId) {
        console.error('[API-Uploads] Invalid event ID for photo upload: empty or undefined');
        throw new Error('Invalid event ID. Please provide a valid event ID.');
      }

      // Ensure eventId is a valid number
      const numericEventId = Number(eventId);
      console.log('[API-Uploads] Converted event ID:', numericEventId, 'isNaN:', isNaN(numericEventId));

      if (isNaN(numericEventId) || numericEventId <= 0) {
        console.error('[API-Uploads] Invalid event ID (not a valid positive number) for photo upload:', eventId);
        throw new Error('Invalid event ID. Please provide a valid numeric event ID.');
      }

      console.log(`[API-Uploads] Uploading ${files.length} photos for event ID: ${numericEventId}`);

      // Make sure the ID is properly formatted
      const id = String(numericEventId).trim();
      console.log('[API-Uploads] Formatted ID for API call:', id);

      // Create form data
      const formData = new FormData();

      // Add files to form data - use 'files' as the parameter name as expected by the backend
      files.forEach(file => {
        formData.append('files', file);
      });

      // Get auth token
      const token = getAuthToken();
      if (!token && process.env.NODE_ENV !== 'development') {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Log the full API URL for debugging
      // Use the correct endpoint format based on the backend API
      const apiEndpoint = `/uploads/events/${id}/photos`; // Removed trailing slash
      console.log('[API-Uploads] Making API request to endpoint:', apiEndpoint);
      console.log('[API-Uploads] Full URL:', `${API_CONFIG.BASE_URL}${apiEndpoint}`);

      // Use the correct endpoint for uploading photos
      const response = await withRetry(() => {
        console.log('[API-Uploads] Attempting API call with apiClient');
        return apiClient.post(
          apiEndpoint,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: onProgress
              ? (progressEvent) => {
                  const total = progressEvent.total || 0;
                  const loaded = progressEvent.loaded || 0;
                  const percentCompleted = total > 0 ? Math.round((loaded * 100) / total) : 0;
                  console.log(`[API-Uploads] Upload progress: ${percentCompleted}%`);
                  onProgress(percentCompleted);
                }
              : undefined
          }
        );
      });

      console.log(`[API-Uploads] Successfully uploaded photos for event ${id}:`, response.data);
      console.log('[API-Uploads] Response status:', response.status, 'Response headers:', response.headers);

      // Process the response based on the backend API format
      let result;
      if (typeof response.data === 'string') {
        // If the response is a string (file path), convert it to an array of objects
        result = {
          uploaded_files: [response.data]
        };
      } else if (Array.isArray(response.data)) {
        // If the response is already an array, use it directly
        result = {
          uploaded_files: response.data
        };
      } else {
        // Otherwise, use the response data as is
        result = response.data;
      }

      return result;
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('[API-Uploads] Event photos upload was cancelled');
        return { uploaded_files: [] };
      }

      // Handle 502 Bad Gateway errors
      if (axios.isAxiosError(error) && (error.response?.status === 502 || error.response?.status === 504)) {
        console.error(`[API-Uploads] Server error (${error.response.status}) uploading photos for event ${eventId}. Returning empty result.`);
        return { uploaded_files: [] };
      }

      // Handle 404 Not Found errors
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error(`[API-Uploads] Endpoint not found (404) for event ${eventId}. Check API endpoint format.`);
        throw new Error('ID acara tidak valid. Silakan coba lagi atau muat ulang halaman.');
      }

      // Handle 400 Bad Request errors
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        console.error(`[API-Uploads] Bad request (400) for event ${eventId}. Invalid parameters.`);
        throw new Error('Format permintaan tidak valid. Silakan coba lagi.');
      }

      // Log detailed error information
      console.error('[API-Uploads] Error in uploadEventPhotos:', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        data: axios.isAxiosError(error) ? error.response?.data : null,
        headers: axios.isAxiosError(error) ? error.response?.headers : null,
        config: axios.isAxiosError(error) ? {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
          data: error.config?.data ? 'FormData (not shown)' : null
        } : null
      });

      // Log the request details
      console.error('[API-Uploads] Request details:', {
        endpoint: `/uploads/events/${eventId}/photos`,
        method: 'POST',
        fileCount: files.length,
        fileNames: files.map(f => f.name),
        fileSizes: files.map(f => f.size),
        fileTypes: files.map(f => f.type)
      });

      // Throw a user-friendly error message with more details
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error('Gagal mengunggah foto: Anda tidak terautentikasi. Silakan login kembali.');
        } else if (status === 403) {
          throw new Error('Gagal mengunggah foto: Anda tidak memiliki izin untuk mengunggah foto ke acara ini.');
        } else if (status === 404) {
          throw new Error('Gagal mengunggah foto: Acara tidak ditemukan. Silakan periksa ID acara.');
        } else if (status === 413) {
          throw new Error('Gagal mengunggah foto: Ukuran file terlalu besar. Silakan kompres foto atau unggah file yang lebih kecil.');
        } else if (status === 415) {
          throw new Error('Gagal mengunggah foto: Format file tidak didukung. Silakan gunakan format JPG, PNG, atau GIF.');
        } else if (status >= 500) {
          throw new Error(`Gagal mengunggah foto: Terjadi kesalahan pada server (${status}). Silakan coba lagi nanti.`);
        }
      }

      // Generic error message as fallback
      throw new Error('Gagal mengunggah foto. Silakan coba lagi atau muat ulang halaman.');
    }
  },

  // Upload news photos
  uploadNewsPhotos: async (
    newsId: number | string,
    files: File[],
    onProgress?: (percentage: number) => void
  ): Promise<any> => {
    try {
      console.log(`[API] Uploading ${files.length} photos for news ID: ${newsId}`);

      // Make sure the ID is properly formatted
      const id = String(newsId).trim();

      // Create form data
      const formData = new FormData();

      // Add files to form data
      files.forEach(file => {
        formData.append('files', file);
      });

      // Get auth token
      const token = getAuthToken();
      if (!token && process.env.NODE_ENV !== 'development') {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Use the correct endpoint for uploading photos
      const response = await apiClient.post(
        `/uploads/news/${id}/photos`, // Removed trailing slash
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: onProgress
            ? (progressEvent) => {
                const total = progressEvent.total || 0;
                const loaded = progressEvent.loaded || 0;
                const percentCompleted = total > 0 ? Math.round((loaded * 100) / total) : 0;
                onProgress(percentCompleted);
              }
            : undefined
        }
      );

      console.log(`[API] Successfully uploaded photos for news ${id}:`, response.data);
      return response.data;
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('[API] News photos upload was cancelled');
        return { uploaded_files: [] };
      }

      // Log detailed error information
      console.error('[API] Error in uploadNewsPhotos:', {
        newsId,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        data: axios.isAxiosError(error) ? error.response?.data : null,
      });

      throw error;
    }
  },

  // Upload finance document - using PUT instead of POST as per backend requirements
  uploadFinanceDocument: async (
    financeId: number | string,
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<any> => {
    try {
      console.log(`[API-Uploads] Uploading document for finance ID: ${financeId}`);

      // Validate financeId
      if (!financeId) {
        console.error('[API-Uploads] Invalid finance ID for document upload: empty or undefined');
        throw new Error('Invalid finance ID. Please provide a valid finance ID.');
      }

      // Ensure financeId is a valid number
      const numericFinanceId = Number(financeId);
      console.log('[API-Uploads] Converted finance ID:', numericFinanceId, 'isNaN:', isNaN(numericFinanceId));

      if (isNaN(numericFinanceId) || numericFinanceId <= 0) {
        console.error('[API-Uploads] Invalid finance ID (not a valid positive number) for document upload:', financeId);
        throw new Error('Invalid finance ID. Please provide a valid numeric finance ID.');
      }

      // Make sure the ID is properly formatted
      const id = String(numericFinanceId).trim();
      console.log('[API-Uploads] Formatted ID for API call:', id);

      // Create form data
      const formData = new FormData();

      // Add file to form data
      formData.append('file', file);

      // Get auth token
      const token = getAuthToken();
      if (!token && process.env.NODE_ENV !== 'development') {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Log the full API URL for debugging
      // Use the standard URL format for all endpoints
      // Format should be: https://beopn.penaku.site/api/v1/uploads/finances/10/document
      const apiEndpoint = `/uploads/finances/${id}/document`;
      // So the full URL will be: https://beopn.penaku.site/api/v1/uploads/finances/10/document
      console.log('[API-Uploads] Making API request to endpoint:', apiEndpoint);

      // The uploadsApiClient has baseURL: ${API_CONFIG.BACKEND_URL}/api/v1
      // So the full URL will be: https://beopn.penaku.site/api/v1/uploads/finances/10/document
      // This is the standard format for all API endpoints

      // Use the uploadsApiClient for uploading document with PUT method instead of POST
      const response = await withRetry(() => {
        console.log('[API-Uploads] Attempting API call with uploadsApiClient using PUT method');
        return uploadsApiClient.put(
          apiEndpoint,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: onProgress
              ? (progressEvent) => {
                  const total = progressEvent.total || 0;
                  const loaded = progressEvent.loaded || 0;
                  const percentCompleted = total > 0 ? Math.round((loaded * 100) / total) : 0;
                  console.log(`[API-Uploads] Upload progress: ${percentCompleted}%`);
                  onProgress(percentCompleted);
                }
              : undefined
          }
        );
      });

      console.log(`[API-Uploads] Successfully uploaded document for finance ${id}:`, response.data);
      console.log('[API-Uploads] Response status:', response.status, 'Response headers:', response.headers);
      return response.data;
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('[API-Uploads] Finance document upload was cancelled');
        return {};
      }

      // Handle 502 Bad Gateway errors
      if (axios.isAxiosError(error) && (error.response?.status === 502 || error.response?.status === 504)) {
        console.error(`[API-Uploads] Server error (${error.response.status}) uploading document for finance ${financeId}. Returning empty result.`);
        return {};
      }

      // Handle 404 Not Found errors
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error(`[API-Uploads] Endpoint not found (404) for finance ${financeId}. Check API endpoint format.`);
        throw new Error('ID transaksi tidak valid. Silakan coba lagi atau muat ulang halaman.');
      }

      // Handle 400 Bad Request errors
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        console.error(`[API-Uploads] Bad request (400) for finance ${financeId}. Invalid parameters.`);
        throw new Error('Format permintaan tidak valid. Silakan coba lagi.');
      }

      // Log detailed error information
      console.error('[API-Uploads] Error in uploadFinanceDocument:', {
        financeId,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        data: axios.isAxiosError(error) ? error.response?.data : null,
        headers: axios.isAxiosError(error) ? error.response?.headers : null,
        config: axios.isAxiosError(error) ? {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
          data: error.config?.data ? 'FormData (not shown)' : null
        } : null
      });

      // Throw a user-friendly error message with more details
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error('Gagal mengunggah dokumen: Anda tidak terautentikasi. Silakan login kembali.');
        } else if (status === 403) {
          throw new Error('Gagal mengunggah dokumen: Anda tidak memiliki izin untuk mengunggah dokumen ke transaksi ini.');
        } else if (status === 404) {
          throw new Error('Gagal mengunggah dokumen: Transaksi tidak ditemukan. Silakan periksa ID transaksi.');
        } else if (status === 413) {
          throw new Error('Gagal mengunggah dokumen: Ukuran file terlalu besar. Silakan kompres dokumen atau unggah file yang lebih kecil.');
        } else if (status === 415) {
          throw new Error('Gagal mengunggah dokumen: Format file tidak didukung. Silakan gunakan format JPG, PNG, atau PDF.');
        } else if (status >= 500) {
          throw new Error(`Gagal mengunggah dokumen: Terjadi kesalahan pada server (${status}). Silakan coba lagi nanti.`);
        }
      }

      // Generic error message as fallback
      throw new Error('Gagal mengunggah dokumen. Silakan coba lagi atau muat ulang halaman.');
    }
  },

  // Edit finance document
  editFinanceDocument: async (
    financeId: number | string,
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<any> => {
    try {
      console.log(`[API-Uploads] Editing document for finance ID: ${financeId}`);

      // Validate financeId
      if (!financeId) {
        console.error('[API-Uploads] Invalid finance ID for document edit: empty or undefined');
        throw new Error('Invalid finance ID. Please provide a valid finance ID.');
      }

      // Ensure financeId is a valid number
      const numericFinanceId = Number(financeId);
      console.log('[API-Uploads] Converted finance ID:', numericFinanceId, 'isNaN:', isNaN(numericFinanceId));

      if (isNaN(numericFinanceId) || numericFinanceId <= 0) {
        console.error('[API-Uploads] Invalid finance ID (not a valid positive number) for document edit:', financeId);
        throw new Error('Invalid finance ID. Please provide a valid numeric finance ID.');
      }

      // Make sure the ID is properly formatted
      const id = String(numericFinanceId).trim();
      console.log('[API-Uploads] Formatted ID for API call:', id);

      // Create form data
      const formData = new FormData();

      // Add file to form data
      formData.append('file', file);

      // Get auth token
      const token = getAuthToken();
      if (!token && process.env.NODE_ENV !== 'development') {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Log the full API URL for debugging
      // Use the standard URL format for all endpoints
      // Format should be: https://beopn.penaku.site/api/v1/uploads/finances/10/document
      const apiEndpoint = `/uploads/finances/${id}/document`;
      // So the full URL will be: https://beopn.penaku.site/api/v1/uploads/finances/10/document
      console.log('[API-Uploads] Making API request to endpoint:', apiEndpoint);

      // The uploadsApiClient has baseURL: ${API_CONFIG.BACKEND_URL}/api/v1
      // So the full URL will be: https://beopn.penaku.site/api/v1/uploads/finances/10/document
      // This is the standard format for all API endpoints

      // Use the uploadsApiClient for editing document
      const response = await withRetry(() => {
        console.log('[API-Uploads] Attempting API call with uploadsApiClient');
        return uploadsApiClient.put(
          apiEndpoint,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: onProgress
              ? (progressEvent) => {
                  const total = progressEvent.total || 0;
                  const loaded = progressEvent.loaded || 0;
                  const percentCompleted = total > 0 ? Math.round((loaded * 100) / total) : 0;
                  console.log(`[API-Uploads] Upload progress: ${percentCompleted}%`);
                  onProgress(percentCompleted);
                }
              : undefined
          }
        );
      });

      console.log(`[API-Uploads] Successfully edited document for finance ${id}:`, response.data);
      console.log('[API-Uploads] Response status:', response.status, 'Response headers:', response.headers);
      return response.data;
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('[API-Uploads] Finance document edit was cancelled');
        return {};
      }

      // Handle 502 Bad Gateway errors
      if (axios.isAxiosError(error) && (error.response?.status === 502 || error.response?.status === 504)) {
        console.error(`[API-Uploads] Server error (${error.response.status}) editing document for finance ${financeId}. Returning empty result.`);
        return {};
      }

      // Handle 404 Not Found errors
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error(`[API-Uploads] Endpoint not found (404) for finance ${financeId}. Check API endpoint format.`);
        throw new Error('ID transaksi tidak valid atau dokumen tidak ditemukan. Silakan coba lagi atau muat ulang halaman.');
      }

      // Handle 400 Bad Request errors
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        console.error(`[API-Uploads] Bad request (400) for finance ${financeId}. Invalid parameters.`);
        throw new Error('Format permintaan tidak valid. Silakan coba lagi.');
      }

      // Log detailed error information
      console.error('[API-Uploads] Error in editFinanceDocument:', {
        financeId,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        data: axios.isAxiosError(error) ? error.response?.data : null,
        headers: axios.isAxiosError(error) ? error.response?.headers : null,
        config: axios.isAxiosError(error) ? {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
          data: error.config?.data ? 'FormData (not shown)' : null
        } : null
      });

      // Throw a user-friendly error message with more details
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error('Gagal mengedit dokumen: Anda tidak terautentikasi. Silakan login kembali.');
        } else if (status === 403) {
          throw new Error('Gagal mengedit dokumen: Anda tidak memiliki izin untuk mengedit dokumen transaksi ini.');
        } else if (status === 404) {
          throw new Error('Gagal mengedit dokumen: Dokumen tidak ditemukan. Silakan periksa ID transaksi.');
        } else if (status === 413) {
          throw new Error('Gagal mengedit dokumen: Ukuran file terlalu besar. Silakan kompres dokumen atau unggah file yang lebih kecil.');
        } else if (status === 415) {
          throw new Error('Gagal mengedit dokumen: Format file tidak didukung. Silakan gunakan format JPG, PNG, atau PDF.');
        } else if (status >= 500) {
          throw new Error(`Gagal mengedit dokumen: Terjadi kesalahan pada server (${status}). Silakan coba lagi nanti.`);
        }
      }

      // Generic error message as fallback
      throw new Error('Gagal mengedit dokumen. Silakan coba lagi atau muat ulang halaman.');
    }
  },

  // Delete finance document
  deleteFinanceDocument: async (financeId: number | string): Promise<any> => {
    try {
      console.log(`[API-Uploads] Deleting document for finance ID: ${financeId}`);

      // Validate financeId
      if (!financeId) {
        console.error('[API-Uploads] Invalid finance ID for document delete: empty or undefined');
        throw new Error('Invalid finance ID. Please provide a valid finance ID.');
      }

      // Ensure financeId is a valid number
      const numericFinanceId = Number(financeId);
      console.log('[API-Uploads] Converted finance ID:', numericFinanceId, 'isNaN:', isNaN(numericFinanceId));

      if (isNaN(numericFinanceId) || numericFinanceId <= 0) {
        console.error('[API-Uploads] Invalid finance ID (not a valid positive number) for document delete:', financeId);
        throw new Error('Invalid finance ID. Please provide a valid numeric finance ID.');
      }

      // Make sure the ID is properly formatted
      const id = String(numericFinanceId).trim();
      console.log('[API-Uploads] Formatted ID for API call:', id);

      // Log the full API URL for debugging
      // Use the standard URL format for all endpoints
      // Format should be: https://beopn.penaku.site/api/v1/uploads/finances/10/document
      const apiEndpoint = `/uploads/finances/${id}/document`;
      // So the full URL will be: https://beopn.penaku.site/api/v1/uploads/finances/10/document
      console.log('[API-Uploads] Making API request to endpoint:', apiEndpoint);

      // The uploadsApiClient has baseURL: ${API_CONFIG.BACKEND_URL}/api/v1
      // So the full URL will be: https://beopn.penaku.site/api/v1/uploads/finances/10/document
      // This is the standard format for all API endpoints

      // Use the uploadsApiClient for deleting document
      const response = await withRetry(() => {
        console.log('[API-Uploads] Attempting API call with uploadsApiClient');
        return uploadsApiClient.delete(apiEndpoint);
      });

      console.log(`[API-Uploads] Successfully deleted document for finance ${id}:`, response.data);
      console.log('[API-Uploads] Response status:', response.status, 'Response headers:', response.headers);
      return response.data;
    } catch (error) {
      // Handle 502 Bad Gateway errors
      if (axios.isAxiosError(error) && (error.response?.status === 502 || error.response?.status === 504)) {
        console.error(`[API-Uploads] Server error (${error.response.status}) deleting document for finance ${financeId}. Returning empty result.`);
        return {};
      }

      // Handle 404 Not Found errors
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error(`[API-Uploads] Endpoint not found (404) for finance ${financeId}. Check API endpoint format.`);
        throw new Error('ID transaksi tidak valid atau dokumen tidak ditemukan. Silakan coba lagi atau muat ulang halaman.');
      }

      // Log detailed error information
      console.error('[API-Uploads] Error in deleteFinanceDocument:', {
        financeId,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        data: axios.isAxiosError(error) ? error.response?.data : null,
        headers: axios.isAxiosError(error) ? error.response?.headers : null,
        config: axios.isAxiosError(error) ? {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers
        } : null
      });

      // Throw a user-friendly error message with more details
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error('Gagal menghapus dokumen: Anda tidak terautentikasi. Silakan login kembali.');
        } else if (status === 403) {
          throw new Error('Gagal menghapus dokumen: Anda tidak memiliki izin untuk menghapus dokumen dari transaksi ini.');
        } else if (status === 404) {
          throw new Error('Gagal menghapus dokumen: Dokumen tidak ditemukan. Silakan periksa ID transaksi.');
        } else if (status >= 500) {
          throw new Error(`Gagal menghapus dokumen: Terjadi kesalahan pada server (${status}). Silakan coba lagi nanti.`);
        }
      }

      // Generic error message as fallback
      throw new Error('Gagal menghapus dokumen. Silakan coba lagi atau muat ulang halaman.');
    }
  },

  // Edit event photo
  editEventPhoto: async (
    photoId: number | string,
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<any> => {
    try {
      console.log(`[API] Editing photo with ID: ${photoId}`);

      // Make sure the ID is properly formatted
      const id = String(photoId).trim();

      // Create form data
      const formData = new FormData();

      // Add file to form data
      formData.append('file', file);

      // Get auth token
      const token = getAuthToken();
      if (!token && process.env.NODE_ENV !== 'development') {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Use the correct endpoint for editing photo
      const response = await apiClient.put(
        `/uploads/events/photos/${id}`, // Removed trailing slash
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: onProgress
            ? (progressEvent) => {
                const total = progressEvent.total || 0;
                const loaded = progressEvent.loaded || 0;
                const percentCompleted = total > 0 ? Math.round((loaded * 100) / total) : 0;
                onProgress(percentCompleted);
              }
            : undefined
        }
      );

      console.log(`[API] Successfully edited photo with ID ${id}:`, response.data);
      return response.data;
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('[API] Event photo edit was cancelled');
        return {};
      }

      // Log detailed error information
      console.error('[API] Error in editEventPhoto:', {
        photoId,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        data: axios.isAxiosError(error) ? error.response?.data : null,
      });

      throw error;
    }
  },

  // Delete event photo
  deleteEventPhoto: async (photoId: number | string): Promise<any> => {
    try {
      console.log(`[API] Deleting photo with ID: ${photoId}`);

      // Make sure the ID is properly formatted
      const id = String(photoId).trim();

      // Use the correct endpoint for deleting photo
      const response = await apiClient.delete(`/uploads/events/photos/${id}`); // Removed trailing slash

      console.log(`[API] Successfully deleted photo with ID ${id}:`, response.data);
      return response.data;
    } catch (error) {
      // Log detailed error information
      console.error('[API] Error in deleteEventPhoto:', {
        photoId,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        data: axios.isAxiosError(error) ? error.response?.data : null,
      });

      throw error;
    }
  },

  // Edit news photo
  editNewsPhoto: async (
    photoId: number | string,
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<any> => {
    try {
      console.log(`[API] Editing news photo with ID: ${photoId}`);

      // Make sure the ID is properly formatted
      const id = String(photoId).trim();

      // Create form data
      const formData = new FormData();

      // Add file to form data
      formData.append('file', file);

      // Get auth token
      const token = getAuthToken();
      if (!token && process.env.NODE_ENV !== 'development') {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Use the correct endpoint for editing photo
      const response = await apiClient.put(
        `/uploads/news/photos/${id}`, // Removed trailing slash
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: onProgress
            ? (progressEvent) => {
                const total = progressEvent.total || 0;
                const loaded = progressEvent.loaded || 0;
                const percentCompleted = total > 0 ? Math.round((loaded * 100) / total) : 0;
                onProgress(percentCompleted);
              }
            : undefined
        }
      );

      console.log(`[API] Successfully edited news photo with ID ${id}:`, response.data);
      return response.data;
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('[API] News photo edit was cancelled');
        return {};
      }

      // Log detailed error information
      console.error('[API] Error in editNewsPhoto:', {
        photoId,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        data: axios.isAxiosError(error) ? error.response?.data : null,
      });

      throw error;
    }
  },

  // Delete news photo
  deleteNewsPhoto: async (photoId: number | string): Promise<any> => {
    try {
      console.log(`[API] Deleting news photo with ID: ${photoId}`);

      // Make sure the ID is properly formatted
      const id = String(photoId).trim();

      // Use the correct endpoint for deleting photo
      const response = await apiClient.delete(`/uploads/news/photos/${id}`); // Removed trailing slash

      console.log(`[API] Successfully deleted news photo with ID ${id}:`, response.data);
      return response.data;
    } catch (error) {
      // Log detailed error information
      console.error('[API] Error in deleteNewsPhoto:', {
        photoId,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        data: axios.isAxiosError(error) ? error.response?.data : null,
      });

      throw error;
    }
  },
};
