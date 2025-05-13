import axios, { type AxiosResponse } from "axios";
import { API_CONFIG } from './config';
import { apiClient } from './api-client'; // Import the consolidated client
import { setAuthTokens, removeAuthTokens, getAuthToken } from './auth-utils'; // Import auth utils

// Helper function to implement retry logic with exponential backoff
async function withRetry<T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  retries = API_CONFIG?.RETRY?.ATTEMPTS || 3,
  initialDelay = API_CONFIG?.RETRY?.DELAY || 1000,
): Promise<AxiosResponse<T>> {
  try {
    console.log('Making API call with retry mechanism')
    return await apiCall()
  } catch (error: any) {
    if (!retries) {
      console.error('No more retries left, throwing error:', error)

      // Log detailed error information for debugging
      if (axios.isAxiosError(error)) {
        console.error('Final Axios error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
          params: error.config?.params
        })
      } else {
        console.error('Final non-Axios error:', error)
      }

      throw error
    }

    // Don't retry canceled requests
    if (axios.isCancel(error)) {
      console.log('Request was cancelled, not retrying')
      throw error
    }

    // Check for network errors or server errors
    let shouldRetry = false

    if (axios.isAxiosError(error)) {
      // Always log detailed error information
      console.log('Axios error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      })

      shouldRetry = (
        error.code === 'ECONNABORTED' ||
        error.message === 'Network Error' ||
        error.message.includes('timeout') ||
        !error.response || // No response at all (likely network issue)
        (error.response?.status !== undefined && error.response.status >= 500) ||
        error.response?.status === 429 // Too many requests
      )

      // For 500 errors, provide more context
      if (error.response?.status === 500) {
        console.error('Server error (500):', {
          url: error.config?.url,
          method: error.config?.method,
          data: error.response?.data
        })
      }

      // For 404 errors, provide context
      if (error.response?.status === 404) {
        console.error('Resource not found (404):', {
          url: error.config?.url,
          method: error.config?.method
        })
      }
    } else {
      // For non-Axios errors, check if it's a network error
      shouldRetry = error.message === 'Network Error' ||
                   error.message?.includes('network') ||
                   error.message?.includes('timeout') ||
                   error.message?.includes('connection')
      console.log('Non-Axios error:', error.message)
    }

    if (!shouldRetry) {
      console.log(`Error is not retryable, throwing error`)
      throw error
    }

    // Calculate delay with exponential backoff
    const backoffFactor = API_CONFIG?.RETRY?.BACKOFF_FACTOR || 2
    const maxAttempts = API_CONFIG?.RETRY?.ATTEMPTS || 3
    const delay = Math.min(
      initialDelay * Math.pow(backoffFactor, maxAttempts - retries),
      30000 // Max delay of 30 seconds
    )

    console.log(`Request failed, retrying in ${delay}ms... (${retries} attempts remaining)`)
    await new Promise(resolve => setTimeout(resolve, delay))

    return withRetry(apiCall, retries - 1, initialDelay)
  }
}

// --- API Service Definitions ---
// Using the imported apiClient from lib/api-client.ts

// API service for events
const eventApiOriginal = {
  // Get events with pagination - updated to use new API format
  getEvents: async (page = 1, limit = 10, signal?: AbortSignal): Promise<Event[]> => {
    try {
      console.log(`[API] Fetching events with page=${page} and limit=${limit}`)
      const response = await withRetry(() =>
        apiClient.get<any>("/events/", { // Use imported apiClient
          params: { page, limit }, // Updated to use page instead of skip
          signal,
        })
      )

      // Check if the response has the new format with data and meta
      if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
        console.log(`[API] Received events in new format with meta:`, response.data.meta)
        return response.data.data
      } else if (Array.isArray(response.data)) {
        // Fallback for old format
        console.log(`[API] Received events in old array format`)
        return response.data
      } else {
        console.error(`[API] Unexpected events response format:`, response.data)
        return []
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('[API] Events request was cancelled - returning empty array')
        return []
      }
      console.error('[API] Error fetching events:', error)
      throw error
    }
  },

  // Search events - updated to use new API format
  searchEvents: async (
    params: {
      keyword?: string
      date?: string
      time?: string
      status?: "akan datang" | "selesai" | string
      startDate?: string
      endDate?: string
      page?: number
      limit?: number
    },
    signal?: AbortSignal,
  ): Promise<Event[]> => {
    try {
      const apiParams: Record<string, string | number> = {
        page: params.page || 1,
        limit: params.limit || 10
      };

      if (params.keyword) apiParams.keyword = params.keyword;
      if (params.date) apiParams.date = params.date;
      if (params.time) apiParams.time = params.time;
      if (params.status) apiParams.status = params.status;
      if (params.startDate) apiParams.start_date = params.startDate;
      if (params.endDate) apiParams.end_date = params.endDate;

      console.log(`[API] Searching events with params:`, apiParams);

      const response = await withRetry(() =>
        apiClient.get<any>("/events/search", { // Use imported apiClient
          params: apiParams,
          signal,
        })
      )

      // Check if the response has the new format with data and meta
      if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
        console.log(`[API] Received search results in new format with meta:`, response.data.meta);
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        // Fallback for old format
        console.log(`[API] Received search results in old array format`);
        return response.data;
      } else {
        console.error(`[API] Unexpected search response format:`, response.data);
        return [];
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('[API] Search request was cancelled - returning empty array')
        return []
      }
      console.error('[API] Error searching events:', error)
      throw error
    }
  },

  // Get single event
  getEvent: async (id: number | string, signal?: AbortSignal): Promise<Event> => {
    try {
      const eventId = String(id).trim();
      const response = await withRetry(() =>
        apiClient.get<Event>(`/events/${eventId}`, { // Use imported apiClient
          signal,
          headers: { 'X-Request-ID': `event-${eventId}-${Date.now()}` }
        })
      );
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Event request was cancelled');
        throw new Error('Request was cancelled');
      }
      console.error(`Error fetching event ${id}:`, error);
      throw error;
    }
  }
}

export const eventApi = {
  ...eventApiOriginal,
  // Create event
  createEvent: async (eventData: EventFormData): Promise<Event> => {
    try {
      const apiEventData: any = { ...eventData };
      // ... (data validation and formatting logic remains the same)
       if (!apiEventData.title) throw new Error('Title is required');
       if (!apiEventData.description) apiEventData.description = '';
       if (!apiEventData.date) throw new Error('Date is required');
       else if (!/^\d{4}-\d{2}-\d{2}$/.test(apiEventData.date)) throw new Error('Date must be in YYYY-MM-DD format');
       if (!apiEventData.location) throw new Error('Location is required');
       if (apiEventData.date && !apiEventData.date.includes('T')) {
         let timeStr = '00:00:00';
         if (apiEventData.time) {
           let formattedTime = apiEventData.time;
           if (/^\d{2}:\d{2}$/.test(formattedTime)) formattedTime = `${formattedTime}:00`;
           timeStr = formattedTime;
         }
         apiEventData.date = `${apiEventData.date}T${timeStr}.000Z`;
       }
       let formattedTime;
       if (apiEventData.time !== undefined) {
         formattedTime = apiEventData.time;
         if (/^\d{2}:\d{2}$/.test(formattedTime)) formattedTime = `${formattedTime}:00`;
         apiEventData.event_time = `${formattedTime}.000Z`;
         apiEventData.time = formattedTime;
       } else if (apiEventData.event_time) {
         const timeMatch = apiEventData.event_time.match(/^([\d:]+)/);
         apiEventData.time = timeMatch ? timeMatch[1] : '00:00:00';
       } else {
         apiEventData.time = '00:00:00';
         apiEventData.event_time = '00:00:00.000Z';
       }
       if (apiEventData.minutes !== undefined) delete apiEventData.minutes;
       if (apiEventData.status) {
         apiEventData.status = apiEventData.status.toLowerCase();
         if (!['akan datang', 'selesai'].includes(apiEventData.status)) apiEventData.status = 'akan datang';
       } else apiEventData.status = 'akan datang';
       if (!apiEventData.created_by) {
         try {
           if (typeof window !== 'undefined') {
             const userStr = localStorage.getItem('user');
             if (userStr) {
               const user = JSON.parse(userStr);
               if (user && user.id) apiEventData.created_by = user.id;
             }
           }
         } catch (e) { console.error('Error getting user ID:', e); }
         if (!apiEventData.created_by) apiEventData.created_by = 1;
       }
      // ... (end of data validation)

      const response = await withRetry(() =>
        apiClient.post<Event>("/events/", apiEventData) // Use imported apiClient with trailing slash
      )
      return response.data;
    } catch (error: any) {
      console.error('Error creating event:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error
    }
  },

  // Update event
  updateEvent: async (id: number | string, eventData: Partial<EventFormData>): Promise<Event> => {
    try {
      const apiEventData: any = { ...eventData };
      // ... (data validation and formatting logic remains the same)
       if (apiEventData.time && !apiEventData.event_time) {
         apiEventData.event_time = apiEventData.time;
         delete apiEventData.time;
       }
       if (apiEventData.date && apiEventData.date.includes('T')) {
         apiEventData.date = apiEventData.date.split('T')[0];
       }
       if (apiEventData.event_time) {
         if (/^\d{2}:\d{2}$/.test(apiEventData.event_time)) apiEventData.event_time = `${apiEventData.event_time}:00`;
         if (!apiEventData.event_time.includes('.')) apiEventData.event_time = `${apiEventData.event_time}.000Z`;
       }
       let formattedTime;
       if (apiEventData.time !== undefined) {
         formattedTime = apiEventData.time;
         if (/^\d{2}:\d{2}$/.test(formattedTime)) formattedTime = `${formattedTime}:00`;
         apiEventData.event_time = `${formattedTime}.000Z`;
         apiEventData.time = formattedTime;
       } else if (apiEventData.event_time) {
         const timeMatch = apiEventData.event_time.match(/^([\d:]+)/);
         apiEventData.time = timeMatch ? timeMatch[1] : '00:00:00';
       }
       if (Object.keys(eventData).length === 1 && 'minutes' in eventData) {
         try {
           const response = await withRetry(() => apiClient.patch<Event>(`/events/${id}/minutes`, { minutes: eventData.minutes })); // Use imported apiClient
           return response.data;
         } catch (patchError) {
           console.log(`PATCH endpoint not available, falling back to PUT for minutes update of event ${id}`);
           const response = await withRetry(() => apiClient.put<Event>(`/events/${id}`, { minutes: eventData.minutes })); // Use imported apiClient
           return response.data;
         }
       }
       if (apiEventData.status) {
         apiEventData.status = apiEventData.status.toLowerCase();
         if (!['akan datang', 'selesai'].includes(apiEventData.status)) apiEventData.status = 'akan datang';
       }
      // ... (end of data validation)

      const response = await withRetry(() =>
        apiClient.put<Event>(`/events/${id}`, apiEventData) // Use imported apiClient
      );
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Delete event
  deleteEvent: async (id: number | string): Promise<void> => {
    try {
      await withRetry(() =>
        apiClient.delete(`/events/${id}`) // Use imported apiClient
      )
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  },

  // Get event attendance
  getEventAttendance: async (eventId: number | string, signal?: AbortSignal): Promise<EventAttendance[]> => {
    try {
      console.log(`[API] Fetching attendance for event ID: ${eventId}`);

      // Skip the event existence check and directly try to fetch attendance
      // If the event doesn't exist, the attendance endpoint will return 404 anyway
      try {
        // Make sure to add trailing slash to match backend API
        const response = await withRetry(() =>
          apiClient.get<EventAttendance[]>(`/events/${eventId}/attendance/`, { signal })
        );
        console.log(`[API] Successfully fetched attendance for event ID: ${eventId}`);

        // If the response is empty or not an array, return an empty array
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          console.log(`[API] No attendance records found for event ID: ${eventId}, returning empty array`);
          return [];
        }

        return response.data;
      } catch (attendanceError) {
        // Handle specific errors for attendance
        if (axios.isCancel(attendanceError)) {
          console.log('[API] Attendance request was cancelled');
          return [];
        }
        if (axios.isAxiosError(attendanceError)) {
          // For 404 errors, return empty array
          if (attendanceError.response?.status === 404) {
            console.log(`[API] No attendance found for event ID: ${eventId} (404 response)`);
            return [];
          }
          // For server errors, return empty array
          if (attendanceError.response?.status === 502 || attendanceError.response?.status === 504 ||
              (attendanceError.response?.status && attendanceError.response.status >= 500)) {
            console.log(`[API] Server error (${attendanceError.response.status}) fetching attendance for event ID: ${eventId}`);
            return [];
          }
        }
        // For any other errors, log and return empty array
        console.error(`[API] Error fetching attendance for event ID: ${eventId}:`, attendanceError);
        return [];
      }
    } catch (error) {
      // Catch-all error handler
      console.error(`[API] Unexpected error in getEventAttendance for event ID: ${eventId}:`, error);
      return [];
    }
  },

  // Create or update event attendance
  createUpdateAttendance: async (eventId: number | string, attendanceData: AttendanceFormData[]): Promise<EventAttendance[]> => {
    try {
      console.log(`[API] Creating/updating attendance for event ${eventId} with data:`, attendanceData);

      // Validate the data before sending to the API
      const validatedData = attendanceData.map(record => {
        // Only allow the three valid status values from the database schema: Hadir, Izin, Alfa
        const validStatus = ["Hadir", "Izin", "Alfa"].includes(record.status) ? record.status : "Hadir";
        return {
          member_id: record.member_id,
          status: validStatus,
          notes: record.notes || ""
        };
      });

      // Make sure the endpoint has a trailing slash to match the backend API
      const response = await withRetry(() =>
        apiClient.post<EventAttendance[]>(`/events/${eventId}/attendance/`, validatedData)
      );

      console.log(`[API] Successfully created/updated attendance for event ${eventId}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[API] Error creating/updating attendance for event ${eventId}:`, error);

      // Return empty array instead of throwing error to prevent UI from breaking
      if (axios.isAxiosError(error)) {
        console.error(`[API] Axios error details:`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }

      throw error;
    }
  },

  // Upload event photo
  uploadEventPhoto: async (eventId: number | string, file: File): Promise<EventPhoto> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await withRetry(() =>
        apiClient.post<EventPhoto>(`/events/${eventId}/photos`, formData, { // Use imported apiClient
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      )
      return response.data
    } catch (error) {
      console.error('Error uploading event photo:', error)
      throw error
    }
  },

  // Upload multiple event photos
  uploadEventPhotos: async (
    eventId: number | string,
    files: File[],
    onProgress?: (percentage: number) => void
  ): Promise<EventPhoto[]> => {
    try {
      const numericEventId = Number(eventId);
      if (isNaN(numericEventId) || numericEventId <= 0) throw new Error('ID acara tidak valid.');

      // No mock data - always use real backend

      // Production logic using apiClient
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      // Use the correct endpoint for uploading photos
      const endpoint = `/uploads/events/${numericEventId}/photos`;
      console.log(`[API] Uploading photos to: ${endpoint}`);

      const response = await apiClient.post(
        endpoint,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
          onUploadProgress: onProgress ? (progressEvent) => {
            const total = progressEvent.total || 0;
            const loaded = progressEvent.loaded || 0;
            const percentCompleted = total > 0 ? Math.round((loaded * 100) / total) : 0;
            onProgress(percentCompleted);
          } : undefined
        }
      );

      console.log(`[API] Successfully uploaded photos for event ${numericEventId}:`, response.data);
      return response.data;

    } catch (error) {
      // Log specific Axios error details
      if (axios.isAxiosError(error)) {
        console.error(`[API Upload] Axios error: Status ${error.response?.status}, Data:`, error.response?.data);

        // Provide specific error messages based on status code
        if (error.response?.status === 401) {
          throw new Error('Anda tidak terautentikasi. Silakan login kembali.');
        } else if (error.response?.status === 403) {
          throw new Error('Anda tidak memiliki izin untuk mengunggah foto ke acara ini.');
        } else if (error.response?.status === 404) {
          throw new Error('Acara tidak ditemukan. Silakan periksa ID acara.');
        } else if (error.response?.status === 413) {
          throw new Error('Ukuran file terlalu besar. Silakan kompres foto atau unggah file yang lebih kecil.');
        } else if (error.response?.status === 415) {
          throw new Error('Format file tidak didukung. Silakan gunakan format JPG, PNG, atau GIF.');
        } else if (error.response?.status && error.response.status >= 500) {
          throw new Error(`Terjadi kesalahan pada server (${error.response.status}). Silakan coba lagi nanti.`);
        }
      }

      console.error('Error in uploadEventPhotos:', error);
      throw new Error(`Gagal mengunggah foto. ${error instanceof Error ? error.message : 'Silakan coba lagi.'}`);
    }
  },

  // Delete event photo
  deleteEventPhoto: async (eventId: number | string, photoId: number | string): Promise<void> => {
    try {
      await withRetry(() =>
        apiClient.delete(`/events/${eventId}/photos/${photoId}`) // Use imported apiClient
      )
    } catch (error) {
      console.error('Error deleting event photo:', error)
      throw error
    }
  },
}

// Finance API service
export const financeApi = {
  // Get finance history
  getFinanceHistory: async (
    params?: { skip?: number; limit?: number; category?: string; start_date?: string; end_date?: string },
    signal?: AbortSignal
  ): Promise<FinanceHistoryResponse> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<FinanceHistoryResponse>("/finance/history", { params, signal, timeout: API_CONFIG.TIMEOUT.FINANCE }) // Use imported apiClient
      )
      if (!response || !response.data) throw new Error('No data received');
      return response.data
    } catch (error) {
      console.error('Failed to fetch finance history:', error);
      if (axios.isCancel(error)) throw new Error('Request was cancelled');
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') throw new Error('Request timed out.');
        if (error.response?.status === 500) throw new Error('Server error.');
        if (error.response?.status === 404) throw new Error('Resource not found.');
      }
      throw new Error(`Finance history error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get finance summary
  getFinanceSummary: async (
    params?: { start_date?: string; end_date?: string },
    signal?: AbortSignal
  ): Promise<any> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<any>("/finance/summary", { params, signal, timeout: 20000 }) // Use imported apiClient
      )
      if (!response || !response.data) throw new Error('No data received');
      return response.data
    } catch (error) {
      const safeError = error || { message: 'Unknown error' };
      if (axios.isCancel(safeError)) throw new Error('Request was cancelled');
      console.error('Error fetching finance summary:', safeError);
      if (axios.isAxiosError(safeError)) {
        if (safeError.code === 'ECONNABORTED') throw new Error('Request timed out.');
        if (safeError.response?.status === 500) throw new Error('Server error.');
        if (safeError.response?.status === 404) throw new Error('Endpoint not found.');
      }
      throw new Error('Failed to fetch finance summary');
    }
  },

  // Get single finance record
  getFinance: async (id: number | string, signal?: AbortSignal): Promise<Finance> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<Finance>(`/finance/${id}`, { signal }) // Use imported apiClient
      )
      if (!response || !response.data) throw new Error('No data received');
      return response.data
    } catch (error) {
      if (axios.isCancel(error)) throw new Error('Request was cancelled');
      console.error('Error fetching finance record:', error)
      throw error
    }
  },

  // Create finance record
  createFinance: async (financeData: FinanceFormData): Promise<Finance> => {
    try {
      const response = await withRetry(() =>
        apiClient.post<Finance>("/finance/", financeData) // Use imported apiClient
      )
      return response.data
    } catch (error) {
      console.error('Error creating finance record:', error)
      throw error
    }
  },

  // Update finance record
  updateFinance: async (id: number | string, financeData: FinanceFormData): Promise<Finance> => {
    try {
      const response = await withRetry(() =>
        apiClient.put<Finance>(`/finance/${id}`, financeData) // Use imported apiClient
      )
      return response.data
    } catch (error) {
      console.error('Error updating finance record:', error)
      throw error
    }
  },

  // Delete finance record
  deleteFinance: async (id: number | string): Promise<void> => {
    try {
      await withRetry(() =>
        apiClient.delete(`/finance/${id}`) // Use imported apiClient
      )
    } catch (error) {
      console.error('Error deleting finance record:', error)
      throw error
    }
  },
}

// Auth API service (Modified to use apiClient and auth-utils)
export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; refreshToken: string }> => {
    try {
      const formData = new URLSearchParams()
      formData.append("username", email)
      formData.append("password", password)
      formData.append("grant_type", "password")

      // Use fetch for this specific endpoint as before
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/token`, {
        method: 'POST',
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      })

      if (!response.ok) {
        if (response.status === 401) throw new Error("Email atau password salah");
        if (response.status === 403) throw new Error("Akun Anda tidak memiliki izin untuk masuk");
        throw new Error("Gagal masuk. Silakan coba lagi nanti.");
      }

      const data = await response.json()
      const authData = { token: data.access_token, refreshToken: data.refresh_token };
      setAuthTokens(authData.token, authData.refreshToken); // Use auth-utils
      return authData;
    } catch (error) {
      console.error("Login error:", error)
      if (error instanceof Error) throw error;
      throw new Error("Terjadi kesalahan saat login");
    }
  },

  register: async (userData: RegisterFormData): Promise<{ message: string }> => {
    try {
      const response = await withRetry(() =>
        apiClient.post<{ message: string }>("/auth/register", userData) // Use imported apiClient
      )
      return response.data
    } catch (error) {
      console.error('Error registering user:', error)
      throw error
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      // apiClient interceptor handles token automatically
      const response = await withRetry(() =>
        apiClient.get<User>("/auth/me") // Use imported apiClient
      )
      return response.data
    } catch (error) {
      console.error('Error fetching current user:', error)
      // If 401, interceptor should handle redirect/refresh
      throw error
    }
  },

  refreshToken: async (refreshTokenValue: string): Promise<{ token: string; refreshToken?: string }> => {
    try {
      // Use axios directly to avoid interceptor loop if called manually
      const response = await axios.post<{ token: string; refresh_token?: string }>(
        `${API_CONFIG.BASE_URL}/auth/refresh`,
         { refreshToken: refreshTokenValue },
         { headers: { "Content-Type": "application/json" } }
      )
      const authData = { token: response.data.token, refreshToken: response.data.refresh_token };
      setAuthTokens(authData.token, authData.refreshToken); // Use auth-utils
      return authData;
    } catch (error) {
      console.error('Error refreshing token:', error)
      removeAuthTokens(); // Clear tokens on refresh failure
      throw error
    }
  },

  logout: async (): Promise<void> => {
    try {
      // apiClient interceptor adds token
      await withRetry(() =>
        apiClient.post("/auth/logout") // Use imported apiClient
      )
    } catch (error) {
      console.error('Error logging out:', error)
      // Still remove tokens even if the API call fails
    } finally {
       removeAuthTokens() // Use auth-utils
    }
  },
}

// News API service
export const newsApi = {
  // Get news
  getNews: async (
    params?: { skip?: number; limit?: number; is_published?: boolean; search?: string },
    signal?: AbortSignal
  ): Promise<NewsItem[]> => {
    try {
      // Check if the signal is already aborted
      if (signal?.aborted) {
        console.log('Request was aborted before execution')
        return []
      }

      // Use the correct URL format with trailing slash to match backend API
      const response = await withRetry(() =>
        apiClient.get<NewsItem[]>("/news/", {
          params,
          signal,
          timeout: API_CONFIG.TIMEOUT.DEFAULT,
          // Add additional headers for debugging
          headers: {
            'X-Request-ID': `news-list-${Date.now()}`,
            'Cache-Control': 'no-cache'
          }
        })
      )

      // Handle invalid response formats gracefully
      if (!response || !response.data) {
        console.warn('Empty response received from news API')
        return []
      }

      if (!Array.isArray(response.data)) {
        console.warn('Non-array response received from news API:', response.data)
        return []
      }

      // Validate and transform the data
      const validatedData = response.data.map(item => {
        if (!item || typeof item !== 'object') return null;
        return {
          id: typeof item.id === 'number' ? item.id : 0,
          title: typeof item.title === 'string' ? item.title : '',
          description: typeof item.description === 'string' ? item.description : '',
          date: typeof item.date === 'string' ? item.date : new Date().toISOString(),
          is_published: Boolean(item.is_published),
          created_at: typeof item.created_at === 'string' ? item.created_at : new Date().toISOString(),
          updated_at: typeof item.updated_at === 'string' ? item.updated_at : new Date().toISOString(),
          created_by: String(item.created_by || ''),
          photos: Array.isArray(item.photos) ? item.photos : []
        }
      }).filter((item): item is NewsItem => item !== null);

      return validatedData;
    } catch (error) {
      // Handle cancellation gracefully
      if (axios.isCancel(error)) {
        console.log('News request was cancelled')
        return []
      }

      // Log detailed error information
      if (axios.isAxiosError(error)) {
        console.error('Axios error in getNews:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          headers: error.config?.headers
        })

        // Return empty array for common errors to prevent UI breakage
        if (error.response?.status === 404) {
          console.warn('News endpoint not found (404)')
          return []
        }
        if (error.response?.status === 401) {
          console.warn('Unauthorized access to news (401)')
          return []
        }
        if (error.response?.status === 405) {
          console.warn('Method not allowed (405) - check API endpoint format')
          return []
        }
        if (error.response?.status && error.response.status >= 500) {
          console.warn(`Server error (${error.response.status}) when fetching news`)
          return []
        }
      } else if (error instanceof Error) {
        console.error('Non-Axios error in getNews:', error.message)
      } else {
        console.error('Unknown error type in getNews:', error)
      }

      // Return empty array instead of throwing to prevent UI breakage
      return []
    }
  },

  // Get single news item
  getNewsItem: async (id: number | string, signal?: AbortSignal): Promise<NewsItem> => {
    try {
      console.log(`Fetching news item with ID: ${id}`)

      // Add a timestamp to prevent caching issues
      const timestamp = Date.now();

      const response = await withRetry(() =>
        apiClient.get<NewsItem>(`${API_CONFIG.ENDPOINTS.NEWS}/${id}/`, {
          signal,
          params: {
            _t: timestamp // Add timestamp to prevent caching
          },
          // Add additional headers for debugging
          headers: {
            'X-Request-ID': `news-item-${id}-${timestamp}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      )

      if (!response || !response.data) {
        console.error('No data received for news item')
        throw new Error('No data received')
      }

      // Log the raw data for debugging
      console.log(`Raw news item data:`, response.data)

      // Validate the photos array
      if (response.data.photos && Array.isArray(response.data.photos)) {
        console.log(`News item has ${response.data.photos.length} photos`)

        // Log each photo URL for debugging
        response.data.photos.forEach((photo, index) => {
          if (photo && photo.photo_url) {
            console.log(`Photo ${index + 1} URL: ${photo.photo_url}`)
          } else {
            console.warn(`Photo ${index + 1} has no URL or is invalid`)
          }
        })
      } else {
        console.warn(`News item has no photos array or it's not an array`)
        // Ensure photos is always an array
        response.data.photos = []
      }

      // Validate and normalize the data to ensure valid date strings
      const validatedData: NewsItem = {
        id: typeof response.data.id === 'number' ? response.data.id : Number(id),
        title: typeof response.data.title === 'string' ? response.data.title : '',
        description: typeof response.data.description === 'string' ? response.data.description : '',
        // Ensure date is a valid string
        date: typeof response.data.date === 'string' && response.data.date
          ? response.data.date
          : new Date().toISOString().split('T')[0],
        is_published: Boolean(response.data.is_published),
        // Ensure created_at is a valid string
        created_at: typeof response.data.created_at === 'string' && response.data.created_at
          ? response.data.created_at
          : new Date().toISOString(),
        // Ensure updated_at is a valid string
        updated_at: typeof response.data.updated_at === 'string' && response.data.updated_at
          ? response.data.updated_at
          : new Date().toISOString(),
        created_by: String(response.data.created_by || ''),
        photos: Array.isArray(response.data.photos) ? response.data.photos.map(photo => {
          // Log each photo URL for debugging
          if (photo && photo.photo_url) {
            console.log(`[getNewsItem] Photo URL from API: ${photo.photo_url}`);
          }
          return photo;
        }) : []
      }

      // Log the photos array for debugging
      if (validatedData.photos && validatedData.photos.length > 0) {
        console.log(`[getNewsItem] News has ${validatedData.photos.length} photos`);
        validatedData.photos.forEach((photo, index) => {
          console.log(`[getNewsItem] Photo ${index + 1}: ${photo.photo_url}`);
        });
      } else {
        console.log(`[getNewsItem] News has no photos`);
      }

      console.log(`Validated news item data:`, validatedData)
      return validatedData
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('News item request was cancelled')
        throw new Error('Request was cancelled')
      }
      console.error(`Error fetching news item ${id}:`, error)
      throw error
    }
  },

  // Create news item
  createNewsItem: async (newsData: NewsFormData): Promise<NewsItem> => {
    try {
      const response = await withRetry(() =>
        apiClient.post<NewsItem>("/news/", newsData) // Use imported apiClient
      )
      return response.data
    } catch (error) {
      console.error('Error creating news item:', error)
      throw error
    }
  },

  // Update news item
  updateNewsItem: async (id: number | string, newsData: NewsFormData): Promise<NewsItem> => {
    try {
      const response = await withRetry(() =>
        apiClient.put<NewsItem>(`/news/${id}/`, newsData) // Use imported apiClient
      )
      return response.data
    } catch (error) {
      console.error('Error updating news item:', error)
      throw error
    }
  },

  // Delete news item
  deleteNewsItem: async (id: number | string): Promise<void> => {
    try {
      // Use direct URL format without trailing slash to match backend API
      await withRetry(() =>
        apiClient.delete(`/news/${id}`)
      )
    } catch (error) {
      console.error('Error deleting news item:', error)
      throw error
    }
  },

  // Upload news photo (Modified to use apiClient)
  uploadNewsPhoto: async (id: number | string, file: File): Promise<NewsPhoto> => {
    try {
      console.log(`Uploading photo for news ID ${id}`)

      // Get the auth token - apiClient will automatically add this in its interceptor
      // but we'll check it here for validation
      const authToken = getAuthToken()
      if (!authToken) {
        console.error('No authentication token available for photo upload')
        throw new Error('Authentication required. Please log in again.')
      }

      console.log(`Auth token available for upload: ${authToken.substring(0, 15)}...`)

      // Create FormData object
      const formData = new FormData()

      // Use 'files' as the field name to match backend API
      // The backend expects a field named 'files' (plural)
      formData.append('files', file)

      // Use the correct endpoint URL format for uploads
      const endpoint = `/uploads/news/${id}/photos`
      console.log(`Using endpoint: ${endpoint}`)

      // Use apiClient directly instead of axios to ensure consistent headers and error handling
      const response = await apiClient.post<any>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000 // Increase timeout for uploads
        }
      );

      console.log(`Upload response:`, response.data)

      // Process the response to match the expected NewsPhoto format
      if (response.data && response.data.uploaded_files && Array.isArray(response.data.uploaded_files)) {
        // Extract the first uploaded file URL
        const photoUrl = response.data.uploaded_files[0] || '';

        // Ensure the photo URL is properly formatted with double slashes
        let formattedPhotoUrl;
        if (photoUrl.startsWith('http')) {
          formattedPhotoUrl = photoUrl;
        } else {
          // Remove any leading slash from the photo URL
          const cleanPhotoUrl = photoUrl.startsWith('/') ? photoUrl.substring(1) : photoUrl;
          // Ensure we have double slashes after the domain and correct path structure
          formattedPhotoUrl = `${API_CONFIG.BACKEND_URL}//uploads/${cleanPhotoUrl.includes('uploads/') ? cleanPhotoUrl.split('uploads/')[1] : cleanPhotoUrl}`;
        }

        console.log(`Formatted photo URL: ${formattedPhotoUrl}`)

        // Return in the expected format
        return {
          id: 0, // ID will be assigned by the backend
          news_id: Number(id),
          photo_url: formattedPhotoUrl,
          created_at: new Date().toISOString()
        }
      }

      // If response format is unexpected, try to extract photo_url
      if (response.data && response.data.photo_url) {
        const photoUrl = response.data.photo_url;

        // Ensure the photo URL is properly formatted with double slashes
        let formattedPhotoUrl;
        if (photoUrl.startsWith('http')) {
          formattedPhotoUrl = photoUrl;
        } else {
          // Remove any leading slash from the photo URL
          const cleanPhotoUrl = photoUrl.startsWith('/') ? photoUrl.substring(1) : photoUrl;
          // Ensure we have double slashes after the domain and correct path structure
          formattedPhotoUrl = `${API_CONFIG.BACKEND_URL}//uploads/${cleanPhotoUrl.includes('uploads/') ? cleanPhotoUrl.split('uploads/')[1] : cleanPhotoUrl}`;
        }

        return {
          ...response.data,
          news_id: Number(id),
          photo_url: formattedPhotoUrl
        } as NewsPhoto;
      }

      // Fallback for unexpected response format
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error(`Error uploading news photo for news ID ${id}:`, error)

      // Log detailed error information
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        })

        // Handle specific error cases
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        }
      }

      throw error
    }
  },
}

// Meeting Minutes API service
export const meetingMinutesApi = {
  // Get all meeting minutes
  getMeetingMinutes: async (signal?: AbortSignal): Promise<MeetingMinutes[]> => {
    try {
      const timestamp = new Date().getTime();
      const response = await withRetry(() =>
        apiClient.get<MeetingMinutes[]>("/meeting-minutes/", { signal, params: { _t: timestamp } }) // Use imported apiClient
      )
      if (!response || !response.data || !Array.isArray(response.data)) return [];
      // ... (validation logic remains the same)
      const validatedData = response.data
         .filter((item): item is MeetingMinutes => item !== null && typeof item === 'object')
         .map(item => ({
           id: typeof item.id === 'number' ? item.id : 0,
           title: typeof item.title === 'string' ? item.title : '',
           description: typeof item.description === 'string' ? item.description : '',
           date: typeof item.date === 'string' ? item.date : new Date().toISOString().split('T')[0],
           document_url: typeof item.document_url === 'string' ? item.document_url : '',
           event_id: typeof item.event_id === 'number' ? item.event_id : 0,
           created_at: typeof item.created_at === 'string' ? item.created_at : new Date().toISOString(),
           updated_at: typeof item.updated_at === 'string' ? item.updated_at : new Date().toISOString()
         }));
      return validatedData;
    } catch (error) {
      if (axios.isCancel(error)) return [];
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 404)) return [];
      console.error('Error fetching meeting minutes:', error);
      return [];
    }
  },

  // Get meeting minutes by event ID
  getMeetingMinutesByEventId: async (eventId: number | string, signal?: AbortSignal): Promise<MeetingMinutes[]> => {
    if (signal?.aborted) return [];
    try {
      const numericEventId = Number(eventId);
      const timestamp = new Date().getTime();
      const response = await withRetry(() =>
        apiClient.get<MeetingMinutes[]>("/meeting-minutes/", { signal, params: { _t: timestamp, event_id: numericEventId } }) // Use imported apiClient
      );
      if (!response || !response.data || !Array.isArray(response.data)) return [];

      // Double-check that all returned minutes are for this event
      const filteredData = response.data.filter(minute => minute.event_id === numericEventId);
      console.log(`Filtered ${response.data.length} minutes to ${filteredData.length} for event ID ${numericEventId}`);
      return filteredData;
    } catch (error) {
      if (axios.isCancel(error) || (error instanceof Error && error.name === 'CanceledError') || signal?.aborted) return [];
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 404 || error.response?.status === 502 || error.response?.status === 504)) return [];
      console.error(`Error fetching meeting minutes for event ID ${eventId}:`, error);
      return [];
    }
  },

  // Get meeting minutes by ID
  getMeetingMinutesById: async (id: number | string, signal?: AbortSignal): Promise<MeetingMinutes> => {
     const defaultMinute = {
        id: Number(id), title: 'Error', description: 'Failed to load content', date: new Date().toISOString().split('T')[0],
        document_url: '', event_id: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
     };
    try {
      const response = await withRetry(() =>
        apiClient.get<MeetingMinutes>(`/meeting-minutes/${id}/`, { signal }) // Use imported apiClient
      )
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) return { ...defaultMinute, title: 'Loading...', description: 'Content is being loaded' };
      if (axios.isAxiosError(error) && error.response?.status === 403) return { ...defaultMinute, title: 'No Access', description: 'No permission' };
      console.error(`Error fetching meeting minutes with ID ${id}:`, error);
      return defaultMinute;
    }
  },

  // Create meeting minutes
  createMeetingMinutes: async (data: MeetingMinutesFormData): Promise<MeetingMinutes> => {
    try {
      const formattedData = {
        title: data.title, description: data.description || '', date: typeof data.date === 'string' ? data.date : new Date().toISOString().split('T')[0],
        document_url: data.document_url || 'https://example.com/', event_id: Number(data.event_id)
      };
      const response = await withRetry(() =>
        apiClient.post<MeetingMinutes>("/meeting-minutes/", formattedData) // Use imported apiClient
      );
      return response.data;
    } catch (error) {
      console.error('Error creating meeting minutes:', error);
      throw error;
    }
  },

  // Update meeting minutes
  updateMeetingMinutes: async (id: number | string, data: MeetingMinutesFormData): Promise<MeetingMinutes> => {
    try {
      // According to the API documentation, the PUT endpoint expects a string
      // Let's use the description field as the string content
      const stringContent = data.description || '';

      console.log(`Updating meeting minutes ${id} with string content`);

      // Use fetch API directly instead of axios
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Make the request to our Next.js API route
      const response = await fetch(`/api/v1/meeting-minutes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${token}`
        },
        body: stringContent
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from server: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to update meeting minutes: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error(`Error updating meeting minutes with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete meeting minutes
  deleteMeetingMinutes: async (id: number | string): Promise<void> => {
    try {
      // Remove trailing slash to match backend API expectations
      await withRetry(() =>
        apiClient.delete(`/meeting-minutes/${id}`) // Use imported apiClient without trailing slash
      );
    } catch (error) {
      console.error(`Error deleting meeting minutes with ID ${id}:`, error);
      throw error;
    }
  }
};

// Notifications API service
export const notificationsApi = {
  // Get all notifications
  getNotifications: async (signal?: AbortSignal): Promise<Notification[]> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<Notification[]>("/notifications/", { signal }) // Use imported apiClient
      )
      return response.data
    } catch (error) {
      if (axios.isCancel(error)) return [];
      console.error('Error fetching notifications:', error)
      throw error
    }
  },

  // Create notification
  createNotification: async (data: NotificationCreateData): Promise<Notification> => {
    try {
      const response = await withRetry(() =>
        apiClient.post<Notification>("/notifications/", data) // Use imported apiClient
      )
      return response.data
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  },

  // Mark notification as read
  markAsRead: async (id: number | string): Promise<Notification> => {
    try {
      const response = await withRetry(() =>
        apiClient.post<Notification>(`/notifications/${id}/read`) // Use imported apiClient
      )
      return response.data
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  },

  // Stream notifications (SSE) - Remains the same as it uses EventSource directly
  streamNotifications: () => {
    if (typeof window === 'undefined') return null
    try {
      // const token = getAuthToken() // Needs getAuthToken from auth-utils if used
      // if (!token) return null;
      const url = new URL(`${API_CONFIG.BASE_URL}/notifications/sse`)
      const eventSource = new EventSource(url.toString(), { withCredentials: true })
      return eventSource
    } catch (error) {
      console.error('Error setting up notification stream:', error)
      return null
    }
  },
}

// Member API service
export const memberApi = {
  // Upload member photo
  uploadMemberPhoto: async (memberId: number | string, file: File): Promise<any> => {
    try {
      console.log(`[API] Uploading photo for member ID ${memberId}`);

      // Get the auth token - apiClient will automatically add this in its interceptor
      // but we'll check it here for validation
      const authToken = getAuthToken();
      if (!authToken) {
        console.error('[API] No authentication token available for member photo upload');
        throw new Error('Authentication required. Please log in again.');
      }

      console.log(`[API] Auth token available for member photo upload: ${authToken.substring(0, 15)}...`);

      // Create FormData object
      const formData = new FormData();

      // Use 'files' as the field name to match backend API
      // The backend expects a field named 'files' (plural)
      formData.append('files', file);

      // Use the correct endpoint URL format for uploads
      const endpoint = `/uploads/members/${memberId}/photos`;
      console.log(`[API] Using endpoint for member photo upload: ${endpoint}`);

      // Use apiClient directly instead of axios to ensure consistent headers and error handling
      const response = await apiClient.post<any>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000 // Increase timeout for uploads
        }
      );

      console.log(`[API] Member photo upload response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[API] Error uploading member photo:`, error);
      throw error;
    }
  },

  // Create a new user with username and password
  createUser: async (userData: { user_data: { username: string; password: string }; biodata: BiodataFormData }): Promise<any> => {
    try {
      console.log('[API] Creating a new user with username and password');

      // Format the data according to the API schema with exact field order
      const apiData = {
        user_data: {
          username: userData.user_data.username,
          password: userData.user_data.password
        },
        biodata: {
          full_name: userData.biodata.full_name,
          email: userData.biodata.email,
          phone_number: userData.biodata.phone_number,
          birth_place: userData.biodata.birth_place,
          birth_date: userData.biodata.birth_date,
          division: userData.biodata.division,
          address: userData.biodata.address,
          photo_url: userData.biodata.photo_url || ""
        }
      };

      console.log('[API] User creation data being sent:', {
        ...apiData,
        user_data: { ...apiData.user_data, password: '******' } // Mask password in logs
      });

      const response = await withRetry(() =>
        apiClient.post('/members/create_user', apiData)
      );

      console.log('[API] Successfully created new user');
      return response.data;
    } catch (error) {
      console.error('[API] Error creating new user:', error);

      // Log detailed error information
      if (axios.isAxiosError(error)) {
        console.error('[API] Axios error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }

      throw error;
    }
  },

  // Get all members
  getMembers: async (signal?: AbortSignal, filters?: { age_gt?: number }): Promise<MemberResponse> => {
    try {
      console.log('[API] Fetching members data with filters:', filters);

      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();

      // Create params object with all filters and timestamp
      const params = {
        ...filters,
        _t: timestamp
      };

      console.log('[API] Request params:', params);
      console.log('[API] Request URL:', apiClient.defaults.baseURL + '/members/');

      // Log the auth token (redacted for security)
      const authHeader = apiClient.defaults.headers.common['Authorization'] as string;
      if (authHeader) {
        const tokenParts = authHeader.split(' ');
        if (tokenParts.length > 1) {
          const token = tokenParts[1];
          const firstChars = token.substring(0, 10);
          const lastChars = token.substring(token.length - 10);
          console.log(`[API] Using auth token: ${firstChars}...${lastChars}`);
        } else {
          console.log('[API] Auth header present but not in expected format');
        }
      } else {
        console.log('[API] No auth token found in request headers');
      }

      const response = await withRetry(() =>
        apiClient.get<any>("/members/", { // WITH trailing slash as per API spec
          signal,
          params,
          timeout: 30000 // Increase timeout for this specific request
        })
      );

      console.log('[API] Raw members response status:', response.status);
      console.log('[API] Raw members response headers:', response.headers);
      console.log('[API] Raw members response data:', response.data);

      // Ensure we return a properly structured MemberResponse
      if (!response.data || typeof response.data !== 'object') {
        console.warn('[API] Invalid members response format, returning empty object');
        return {};
      }

      // Create a normalized response
      const normalizedResponse: MemberResponse = {};

      // If the response is an array, convert it to a division-based structure
      if (Array.isArray(response.data)) {
        console.log('[API] Converting array response to division-based structure');

        response.data.forEach((member: any) => {
          if (member && typeof member === 'object') {
            // Extract member_info if it exists
            const memberInfo = member.member_info || member;

            // Use a default division if none is provided
            const division = memberInfo.division || 'Umum';
            if (!normalizedResponse[division]) {
              normalizedResponse[division] = [];
            }

            normalizedResponse[division].push({
              id: member.id || 0,
              username: member.username || '',
              role: member.role || 'member',
              full_name: memberInfo.full_name || 'Tidak ada nama',
              division: memberInfo.division || division,
              position: memberInfo.position || '',
              email: memberInfo.email || '',
              phone_number: memberInfo.phone_number || '',
              birth_date: memberInfo.birth_date || '',
              birth_place: memberInfo.birth_place || '',
              address: memberInfo.address || '',
              photo_url: memberInfo.photo_url || '',
              age: memberInfo.age || 0,
              member_info: memberInfo
            });
          }
        });
      } else {
        // Handle object response
        Object.entries(response.data).forEach(([key, value]) => {
          // Use a default division name for numeric keys
          const divisionName = /^\d+$/.test(key) ? `Divisi ${key}` : key;

          if (Array.isArray(value)) {
            // If it's already an array, validate each member
            normalizedResponse[divisionName] = value.map((member: any) => {
              // Extract member_info if it exists
              const memberInfo = member.member_info || member;

              return {
                id: member.id || 0,
                username: member.username || '',
                role: member.role || 'member',
                full_name: memberInfo.full_name || 'Tidak ada nama',
                division: memberInfo.division || divisionName,
                position: memberInfo.position || '',
                email: memberInfo.email || '',
                phone_number: memberInfo.phone_number || '',
                birth_date: memberInfo.birth_date || '',
                birth_place: memberInfo.birth_place || '',
                address: memberInfo.address || '',
                photo_url: memberInfo.photo_url || '',
                age: memberInfo.age || 0,
                member_info: memberInfo
              };
            });
          } else if (value && typeof value === 'object') {
            // If it's an object with member properties, convert to array with single item
            const memberObj = value as any; // Cast to any to access properties
            // Extract member_info if it exists
            const memberInfo = memberObj.member_info || memberObj;

            if (memberObj.id || memberInfo.full_name) {
              normalizedResponse[divisionName] = [{
                id: memberObj.id || 0,
                username: memberObj.username || '',
                role: memberObj.role || 'member',
                full_name: memberInfo.full_name || 'Tidak ada nama',
                division: memberInfo.division || divisionName,
                position: memberInfo.position || '',
                email: memberInfo.email || '',
                phone_number: memberInfo.phone_number || '',
                birth_date: memberInfo.birth_date || '',
                birth_place: memberInfo.birth_place || '',
                address: memberInfo.address || '',
                photo_url: memberInfo.photo_url || '',
                age: memberInfo.age || 0,
                member_info: memberInfo
              }];
            } else {
              // If it's an object with multiple members
              normalizedResponse[divisionName] = Object.values(value)
                .filter((item: any) => item && typeof item === 'object')
                .map((member: any) => {
                  // Extract member_info if it exists
                  const memberInfo = member.member_info || member;

                  return {
                    id: member.id || 0,
                    username: member.username || '',
                    role: member.role || 'member',
                    full_name: memberInfo.full_name || 'Tidak ada nama',
                    division: memberInfo.division || divisionName,
                    position: memberInfo.position || '',
                    email: memberInfo.email || '',
                    phone_number: memberInfo.phone_number || '',
                    birth_date: memberInfo.birth_date || '',
                    birth_place: memberInfo.birth_place || '',
                    address: memberInfo.address || '',
                    photo_url: memberInfo.photo_url || '',
                    age: memberInfo.age || 0,
                    member_info: memberInfo
                  };
                });
            }
          } else {
            // If it's neither an array nor a valid object, use an empty array
            normalizedResponse[divisionName] = [];
          }
        });
      }

      // Remove any divisions with empty arrays
      Object.keys(normalizedResponse).forEach(division => {
        if (!Array.isArray(normalizedResponse[division]) || normalizedResponse[division].length === 0) {
          delete normalizedResponse[division];
        }
      });

      console.log('[API] Normalized members response:', normalizedResponse);
      return normalizedResponse;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('[API] Members request was cancelled');
        return {};
      }

      // Log detailed error information
      if (error instanceof Error) {
        // Check if it's an Axios error
        if (axios.isAxiosError(error)) {
          console.error('[API] Axios error fetching members:', {
            name: error.name,
            message: error.message,
            code: error.code,
            // Response details
            status: error.response?.status,
            statusText: error.response?.statusText,
            responseData: error.response?.data,
            responseHeaders: error.response?.headers,
            // Request details
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            method: error.config?.method,
            headers: error.config?.headers,
            params: error.config?.params,
            timeout: error.config?.timeout
          });

          // Check for specific status codes
          if (error.response?.status === 401) {
            console.error('[API] Authentication error (401): User is not authenticated or token is invalid');
          } else if (error.response?.status === 403) {
            console.error('[API] Authorization error (403): User does not have permission to access this resource');
          } else if (error.response?.status === 404) {
            console.error('[API] Not found error (404): The requested resource was not found');
          } else if (error.response?.status === 422) {
            console.error('[API] Validation error (422): The request contains invalid parameters');
          } else if (error.response?.status && error.response.status >= 500) {
            console.error('[API] Server error (' + error.response?.status + '): An error occurred on the server');
          }
        } else {
          console.error('[API] Non-Axios error fetching members:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      } else {
        console.error('[API] Unknown error fetching members (not an Error instance):', error);
        console.error('[API] Error type:', typeof error);
        console.error('[API] Error stringified:', JSON.stringify(error));

        // Try to extract more information
        try {
          const errorKeys = Object.keys(error || {});
          console.error('[API] Error keys:', errorKeys);

          for (const key of errorKeys) {
            try {
              console.error(`[API] Error property ${key}:`, (error as any)[key]);
            } catch (propError) {
              console.error(`[API] Error accessing property ${key}:`, propError);
            }
          }
        } catch (extractError) {
          console.error('[API] Error extracting properties from error object:', extractError);
        }
      }

      // Log the actual error from the /members/ attempt
      console.error('[API] Error fetching members via /members/:', error);

      // Log detailed error information
      if (axios.isAxiosError(error)) {
        console.error('[API] Axios error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          responseHeaders: error.response?.headers,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          headers: error.config?.headers,
          params: error.config?.params,
          timeout: error.config?.timeout
        });

        if (error.response?.status === 401) {
          console.error('[API] Authentication error (401): Check if user is logged in and token is valid.');
        } else if (error.response?.status === 403) {
          console.error('[API] Authorization error (403): User lacks permission.');
        } else if (error.response?.status === 404) {
          console.error('[API] Not found error (404): Endpoint /members/ not found on backend? (Should exist based on spec).');
        } else if (error.response?.status && error.response.status >= 500) {
          console.error(`[API] Server error (${error.response.status}) on backend.`);
        }
      } else {
        console.error('[API] Non-Axios error:', error);
      }

      // Return empty object to prevent UI break, but the real error is logged above
      return {};
    }
  },

  // Get current user's profile
  getMyProfile: async (signal?: AbortSignal): Promise<Member> => {
    try {
      console.log('[API] Fetching current user profile');
      const response = await withRetry(() =>
        apiClient.get<Member>('/members/me', { signal })
      )
      console.log('[API] Successfully fetched current user profile');
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('[API] Profile request was cancelled');
        throw new Error('Request was cancelled');
      }
      console.error('[API] Error fetching profile:', error);
      throw error;
    }
  },

  // Create or update member biodata
  createMember: async (memberData: MemberFormData): Promise<Member> => {
    try {
      console.log('[API] Creating or updating member biodata');

      // Create biodata object exactly matching the API schema - ONLY include fields in the schema
      const biodataData = {
        full_name: memberData.member_info.full_name,
        email: memberData.member_info.email,
        phone_number: memberData.member_info.phone_number,
        division: memberData.member_info.division,
        birth_place: memberData.member_info.birth_place,
        birth_date: memberData.member_info.birth_date,
        address: memberData.member_info.address,
        photo_url: ''
      };

      // Log the data being sent to the API
      console.log('[API] Member data being sent:', biodataData);

      // First, check if the user already has biodata by fetching their profile
      try {
        console.log('[API] Checking if user already has biodata');
        const profileResponse = await withRetry(() =>
          apiClient.get<Member>('/members/me')
        );

        console.log('[API] User profile:', profileResponse.data);

        // Check if the user already has biodata
        if (profileResponse.data.member_info) {
          console.log('[API] User already has biodata, updating instead of creating');

          // Use PUT to update existing biodata
          console.log('[API] Updating biodata with formatted data:', biodataData);
          console.log('[API] Request payload:', JSON.stringify(biodataData));

          const updateResponse = await withRetry(() =>
            apiClient.put<MemberInfo>('/members/biodata/', biodataData)
          );

          console.log('[API] Successfully updated member biodata');

          // Return a response based on the updated biodata
          return {
            id: updateResponse.data.id || 0,
            username: memberData.username || updateResponse.data.email?.split('@')[0] || '',
            role: memberData.role || 'Member',
            full_name: updateResponse.data.full_name,
            division: updateResponse.data.division,
            position: position, // Use the position we stored earlier
            email: updateResponse.data.email,
            member_info: updateResponse.data
          } as Member;
        } else {
          console.log('[API] User does not have biodata, creating new biodata');
        }
      } catch (profileError) {
        console.error('[API] Error checking user profile:', profileError);
        console.log('[API] Proceeding with biodata creation attempt');
      }

      // If we reach here, either the user doesn't have biodata or we couldn't check
      // Try to create new biodata
      console.log('[API] Creating biodata with formatted data:', biodataData);
      console.log('[API] Request payload:', JSON.stringify(biodataData));

      try {
        const createResponse = await withRetry(() =>
          apiClient.post<MemberInfo>('/members/biodata/', biodataData)
        );

        console.log('[API] Successfully created member with biodata');

        // Return a response based on the created biodata
        return {
          id: createResponse.data.id || 0,
          username: memberData.username || createResponse.data.email?.split('@')[0] || '',
          role: memberData.role || 'Member',
          full_name: createResponse.data.full_name,
          division: createResponse.data.division,
          position: position, // Use the position we stored earlier
          email: createResponse.data.email,
          member_info: createResponse.data
        } as Member;
      } catch (createError: any) {
        // Check if the error is "Biodata already exists"
        if (createError.response?.data?.detail === "Biodata already exists") {
          console.log('[API] Biodata already exists, trying to update instead');

          // Use PUT to update existing biodata
          const updateResponse = await withRetry(() =>
            apiClient.put<MemberInfo>('/members/biodata/', biodataData)
          );

          console.log('[API] Successfully updated member biodata after creation failed');

          // Return a response based on the updated biodata
          return {
            id: updateResponse.data.id || 0,
            username: memberData.username || updateResponse.data.email?.split('@')[0] || '',
            role: memberData.role || 'Member',
            full_name: updateResponse.data.full_name,
            division: updateResponse.data.division,
            position: position, // Use the position we stored earlier
            email: updateResponse.data.email,
            member_info: updateResponse.data
          } as Member;
        } else {
          // If it's a different error, rethrow it
          throw createError;
        }
      }
    } catch (error) {
      // Log detailed error information
      if (error instanceof Error) {
        console.error('[API] Error creating/updating member:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          // Additional axios error properties if available
          response: (error as any).response?.data,
          status: (error as any).response?.status,
          headers: (error as any).response?.headers
        });
      } else {
        console.error('[API] Unknown error creating/updating member:', error);
      }
      throw error;
    }
  },

  // Create biodata for current user
  createBiodata: async (biodataData: BiodataFormData): Promise<MemberInfo> => {
    try {
      // Create a new object with only the fields expected by the API
      const apiData = {
        full_name: biodataData.full_name,
        email: biodataData.email,
        phone_number: biodataData.phone_number,
        division: biodataData.division,
        birth_place: biodataData.birth_place,
        address: biodataData.address,
        photo_url: biodataData.photo_url,
        birth_date: biodataData.birth_date
      };

      console.log('[API] Creating biodata with formatted data:', apiData);
      console.log('[API] Request payload:', JSON.stringify(apiData));

      const response = await withRetry(() =>
        apiClient.post<MemberInfo>('/members/biodata/', apiData)
      )
      console.log('[API] Successfully created biodata');

      // Return the response data
      const responseData = response.data;

      return responseData;
    } catch (error) {
      // Log detailed error information
      if (error instanceof Error) {
        console.error('[API] Error creating biodata:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          // Additional axios error properties if available
          response: (error as any).response?.data,
          status: (error as any).response?.status,
          headers: (error as any).response?.headers
        });
      } else {
        console.error('[API] Unknown error creating biodata:', error);
      }
      throw error;
    }
  },

  // Update biodata for current user
  updateBiodata: async (biodataData: BiodataFormData): Promise<MemberInfo> => {
    try {
      // Create a new object with only the fields expected by the API
      const apiData = {
        full_name: biodataData.full_name,
        email: biodataData.email,
        phone_number: biodataData.phone_number,
        division: biodataData.division,
        birth_place: biodataData.birth_place,
        address: biodataData.address,
        photo_url: biodataData.photo_url,
        birth_date: biodataData.birth_date
      };

      // Log the API data for debugging
      console.log('[API] Updating biodata with formatted data:', apiData);
      console.log('[API] Request payload:', JSON.stringify(apiData));

      const response = await withRetry(() =>
        apiClient.put<MemberInfo>('/members/biodata/', apiData)
      )
      console.log('[API] Successfully updated biodata');

      // Return the response data
      const responseData = response.data;

      return responseData;
    } catch (error) {
      // Log detailed error information
      if (error instanceof Error) {
        console.error('[API] Error updating biodata:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          // Additional axios error properties if available
          response: (error as any).response?.data,
          status: (error as any).response?.status,
          headers: (error as any).response?.headers
        });
      } else {
        console.error('[API] Unknown error updating biodata:', error);
      }
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId: number | string): Promise<void> => {
    try {
      console.log(`[API] Deleting user with ID: ${userId}`);

      // Add a timeout to the delete request to prevent it from hanging
      await withRetry(() =>
        apiClient.delete(`/members/user/${userId}`, {
          timeout: 10000 // 10 second timeout
        })
      );

      console.log(`[API] Successfully deleted user with ID: ${userId}`);

      // Add a small delay to ensure the backend has time to process the deletion
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      if (axios.isCancel(error)) {
        console.log(`[API] Delete user request was cancelled for ID: ${userId}`);
        // Don't throw for cancellation, just return
        return;
      }

      console.error(`[API] Error deleting user with ID ${userId}:`, error);

      // Log more detailed error information
      if (axios.isAxiosError(error)) {
        console.error(`[API] Axios error details for delete user ${userId}:`, {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data
        });
      }

      throw error;
    }
  },
}

// --- Type Definitions ---
// (Copied from lib/api.ts)

export interface Event {
  id: number
  title: string
  description: string
  date: string
  time: string
  location: string
  status: string
  created_at: string
  updated_at: string
  photos: EventPhoto[]
  attendees: number[]
  minutes?: string // Added optional minutes based on usage
}

export interface EventPhoto {
  id: number
  event_id: number
  photo_url: string
  uploaded_at: string
}

export interface EventAttendance {
  id: number
  event_id: number
  member_id: number
  status: string
  notes: string
  created_at: string
  updated_at: string
}

export interface EventFormData {
  title: string
  description: string
  date: string
  event_time?: string
  time?: string
  location: string
  status: string
  created_by?: number
  minutes?: string // Added optional minutes based on usage
}

export interface AttendanceFormData {
  member_id: number
  status: string
  notes: string
}

export interface Finance {
  id: number
  amount: string
  category: string
  date: string
  description: string
  balance_before: string
  balance_after: string
  document_url: string | null
  created_by: number
  created_at: string
  updated_at: string
}

export interface FinanceFormData {
  amount: number
  category: string
  date: string
  description: string
}

export interface FinanceHistoryResponse {
  transactions: Finance[]
  current_balance: string
}

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
}

export interface RegisterFormData {
  username: string
  email: string
  password: string
  full_name: string
}

export interface NewsItem {
  id: number
  title: string
  description: string
  date: string
  is_published: boolean
  created_at: string
  updated_at: string
  created_by: string
  photos: NewsPhoto[]
}

export interface NewsPhoto {
  id: number
  photo_url: string
  news_id: number
  created_at: string
}

export interface NewsFormData {
  title: string
  description: string
  date: string
  is_published: boolean
}

export interface MeetingMinutes {
  id: number
  title: string
  description: string
  date: string
  document_url: string
  event_id: number
  created_at: string
  updated_at: string
}

export interface MeetingMinutesFormData {
  title: string
  description: string
  date: string
  document_url?: string
  event_id: number
}

export interface MemberInfo {
  id: number
  full_name: string
  birth_place?: string
  birth_date?: string
  age?: number
  email?: string
  phone_number?: string
  division: string
  address?: string
  photo_url?: string
}

export interface Member {
  id: number
  username?: string
  role?: string
  full_name?: string
  division?: string
  email?: string
  phone_number?: string
  birth_date?: string
  birth_place?: string
  address?: string
  photo_url?: string
  age?: number
  member_info?: MemberInfo
}

export interface MemberFormData {
  username?: string
  role?: string
  member_info: {
    full_name: string
    division: string
    email: string
    phone_number: string
    birth_date: string
    birth_place: string
    address: string
    photo_url: string
    age?: number
  }
}

export interface BiodataFormData {
  full_name: string
  email: string
  phone_number: string
  division: string
  birth_place: string
  birth_date: string
  address: string
  photo_url: string
}

export interface MemberResponse {
  [division: string]: Member[]
}

export interface Notification {
  id: number
  title: string
  content: string
  is_read: boolean
  created_at: string
}

export interface NotificationCreateData {
  title: string
  content: string
  user_id: number
}

/**
 * Extract a user-friendly error message from various error types
 * @param error The error object
 * @returns A user-friendly error message
 */
// (Copied from lib/api.ts)
export function extractErrorMessage(error: unknown): string {
  let errorMessage = "Terjadi kesalahan. Silakan coba lagi."
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, any>
    if (errorObj.response?.data?.detail) {
      const detail = errorObj.response.data.detail
      if (Array.isArray(detail)) errorMessage = detail.join(", ")
      else if (typeof detail === "object") errorMessage = Object.values(detail).flat().join(", ")
      else errorMessage = String(detail)
    } else if (errorObj.message) {
      errorMessage = errorObj.message
    }
  } else if (typeof error === "string") {
    errorMessage = error
  }
  return errorMessage
}
