import axios, { isCancel, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from "axios" // Import types including InternalAxiosRequestConfig
import { getAuthToken, setAuthTokens, removeAuthTokens } from './auth-utils'; // Use ES6 import for auth utils

import { API_CONFIG } from './config';

// Create an Axios instance with default config
export const apiClient = axios.create({
  // Use the backend API URL directly
  baseURL: `${API_CONFIG.BACKEND_URL}/api/v1`, // Direct connection to backend
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout,
  // Don't encode URLs that are already encoded
  paramsSerializer: {
    encode: (value) => value // Don't encode URL parameters
  }
})

// Create a special Axios instance for uploads with a longer timeout
export const uploadsApiClient = axios.create({
  // Use the standard backend API URL for all endpoints
  baseURL: `${API_CONFIG.BACKEND_URL}/api/v1`, // Standard format for all endpoints
  headers: {
    "Content-Type": "multipart/form-data",
  },
  timeout: 30000, // 30 seconds timeout for uploads
  // Don't encode URLs that are already encoded
  paramsSerializer: {
    encode: (value) => value // Don't encode URL parameters
  }
})

// Log the base URL in development
if (process.env.NODE_ENV === 'development') {
  console.log(`[ApiClient] Initialized with baseURL: ${apiClient.defaults.baseURL}`);
  console.log(`[UploadsApiClient] Initialized with baseURL: ${uploadsApiClient.defaults.baseURL}`);
}

// Add request interceptor to handle authentication
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => { // Use InternalAxiosRequestConfig
    // Skip authentication for login and refresh endpoints
    const isAuthEndpoint = config.url && (
      config.url.includes('/auth/token') ||
      config.url.includes('/auth/refresh')
    );

    if (isAuthEndpoint) {
      console.log(`[ApiClient] Skipping auth header for auth endpoint: ${config.url}`);
      return config;
    }

    // Get token from auth-utils (imported above)
    const token = typeof window !== "undefined" ? getAuthToken() : null

    // If token exists, add it to the headers
    if (token && config.headers) { // Add check for config.headers
      config.headers.Authorization = token
      // Reduce console logging
      // console.log(`[ApiClient] Request to ${config.url}: Added Authorization header`);
    } else {
      // Only log warnings in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[ApiClient] Request to ${config.url}: No Authorization header added - token is ${token ? 'present but headers missing' : 'missing'}`);
        if (!token) {
          console.warn('[ApiClient] No token available. User might not be authenticated properly.');
        }
        if (!config.headers) {
          console.warn('[ApiClient] Request headers object is missing or invalid.');
        }
      }
    }

    // Log the full request details in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[ApiClient] Request details:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        headers: config.headers,
        params: config.params,
        data: config.data ? (typeof config.data === 'string' && config.data.length > 500 ?
          config.data.substring(0, 500) + '...' : config.data) : undefined
      });
    }

    return config
  },
  (error) => {
    console.error('[ApiClient] Error in request interceptor:', error);
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging, auth handling, and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => { // Add type for response
    // Log successful responses in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[ApiClient] Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        // Avoid logging large data blobs
        data: typeof response.data === 'string' && response.data.length > 500 ? response.data.substring(0, 500) + '...' : response.data,
      })
    }
    return response
  },
  async (error: unknown) => {
    // Cast to any to avoid TypeScript errors
    const anyError = error as any;

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[ApiClient] Response interceptor caught an error:', error);
    }

    // Check if it's a valid error object
    if (!(error instanceof Error)) {
      console.error('[ApiClient] Error is not an Error instance:', error);
      return Promise.reject({
        message: 'Unknown error (not an Error instance)',
        originalError: error
      });
    }

    // Now TypeScript knows error is an Error instance
    // Use auth-utils functions (imported above)
    // const { setAuthTokens, removeAuthTokens } = require('./auth-utils') // Removed require

    // Handle canceled requests gracefully
    if (isCancel(error)) {
      console.log('Request canceled:', error.message)
      return Promise.reject({
        isCanceled: true,
        message: 'Request was canceled',
        originalError: error
      })
    }

    // Log errors in development and production for debugging
    if (axios.isAxiosError(anyError)) {
      const axiosError = anyError;
      console.error(`API Error [${axiosError.config?.method?.toUpperCase()}] ${axiosError.config?.url}:`, {
        message: axiosError.message,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.config?.headers,
        baseURL: axiosError.config?.baseURL,
      })
    } else {
      console.error('Non-Axios error:', error)
    }

    // Handle 401 Unauthorized - Attempt Token Refresh
    if (axios.isAxiosError(anyError) && anyError.response?.status === 401) {
      const axiosError = anyError;
      const originalRequest = axiosError.config as AxiosRequestConfig & { _retry?: boolean }

      if (!originalRequest._retry) {
        originalRequest._retry = true
        console.log('Attempting token refresh due to 401 error...')

        try {
          // Attempt to refresh token using logic similar to api-new.ts/api.ts
          // Note: Assumes refreshToken is stored by auth-utils or login flow
          const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null

          if (!refreshToken) {
            console.error('No refresh token found. Redirecting to login.')
            removeAuthTokens() // Use function from auth-utils
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
               localStorage.setItem('redirectAfterLogin', window.location.pathname)
               window.location.href = "/login"
            }
            return Promise.reject(error)
          }

          // Use axios directly for the refresh request to avoid interceptor loop
          const refreshResponse = await axios.post(`${API_CONFIG.BACKEND_URL}/api/v1/auth/refresh`, {
            refreshToken,
          }, {
            headers: { "Content-Type": "application/json" }
          })

          const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data
          console.log('Token refresh successful.')
          setAuthTokens(newToken, newRefreshToken) // Use function from auth-utils

          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          console.log('Retrying original request with new token.')
          return apiClient(originalRequest) // Retry with the configured apiClient instance

        } catch (refreshError: any) {
          console.error('Token refresh failed:', refreshError?.response?.data || refreshError.message)
          removeAuthTokens() // Use function from auth-utils
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
             localStorage.setItem('redirectAfterLogin', window.location.pathname)
             window.location.href = "/login"
          }
          return Promise.reject(error) // Reject with the original 401 error
        }
      } else {
         console.error('Token refresh already attempted or request is not retryable. Rejecting.')
      }
    }

    // For other errors, just reject
    return Promise.reject(error)
  }
)

// Add the same interceptors to the uploadsApiClient
uploadsApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from auth-utils
    const token = typeof window !== "undefined" ? getAuthToken() : null

    // If token exists, add it to the headers
    if (token && config.headers) {
      config.headers.Authorization = token
      console.log(`[UploadsApiClient] Request to ${config.url}: Added Authorization header`);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[UploadsApiClient] Request to ${config.url}: No Authorization header added - token is ${token ? 'present but headers missing' : 'missing'}`);
      }
    }

    // Log the full request details in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[UploadsApiClient] Request details:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        headers: config.headers,
        params: config.params,
        data: config.data ? 'FormData (not shown)' : undefined
      });
    }

    return config
  },
  (error) => {
    console.error('[UploadsApiClient] Error in request interceptor:', error);
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging and error handling
uploadsApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[UploadsApiClient] Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: 'Response data not shown (likely binary)'
      })
    }
    return response
  },
  async (error: unknown) => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[UploadsApiClient] Response interceptor caught an error:', error);
    }

    // Handle canceled requests gracefully
    if (isCancel(error)) {
      console.log('Upload request canceled:', (error as Error).message)
      return Promise.reject({
        isCanceled: true,
        message: 'Upload request was canceled',
        originalError: error
      })
    }

    // Log errors for debugging
    if (axios.isAxiosError(error)) {
      console.error(`UploadsApiClient Error [${error.config?.method?.toUpperCase()}] ${error.config?.url}:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.config?.headers,
        baseURL: error.config?.baseURL,
      })
    } else {
      console.error('Non-Axios error in UploadsApiClient:', error)
    }

    // Handle 401 Unauthorized - Redirect to login
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.error('Unauthorized upload request. Redirecting to login.')
      removeAuthTokens()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        localStorage.setItem('redirectAfterLogin', window.location.pathname)
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)
