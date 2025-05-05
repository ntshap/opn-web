import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_CONFIG } from '../config';
import { toast } from 'sonner';

// Flag to disable mock data fallback
const USE_MOCK_DATA = false;

interface ErrorResponse {
  message?: string;
  data?: any;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;

  private constructor() {
    // Log the API URL being used
    console.log('API Client initializing with URL:', API_CONFIG.BASE_URL);

    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL, // Direct connection to backend
      timeout: API_CONFIG.TIMEOUT.FINANCE, // Using longer timeout for better reliability
      headers: {
        'Content-Type': 'application/json',
      },
      // Add retry logic for failed requests
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Handle 500 errors through interceptor
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        // Check network connectivity before making request
        if (typeof window !== 'undefined' && !navigator.onLine) {
          toast.error('No internet connection. Please check your network.');
          return Promise.reject(new ApiError(0, 'No internet connection'));
        }

        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (!config.url?.includes('/auth/token')) {
          // If no token and not a login request, reject
          return Promise.reject(new ApiError(401, 'No authentication token'));
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ErrorResponse>) => {
        // Handle network errors with more detailed messages
        if (!error.response) {
          const message = error.code === 'ECONNABORTED'
            ? 'Request timed out. The server is taking too long to respond.'
            : 'Network error. Please check your connection and try again.';

          toast.error(message);
          return Promise.reject(new ApiError(0, message));
        }

        const originalRequest = error.config!;

        // Handle auth errors
        if (error.response.status === 401) {
          // Only try to refresh token if we're not already trying to refresh
          if (!originalRequest.url?.includes('/auth/token') && !originalRequest.headers['X-Retry']) {
            try {
              const newToken = await this.refreshToken();
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              originalRequest.headers['X-Retry'] = 'true';
              return this.client(originalRequest);
            } catch (refreshError) {
              this.handleAuthError();
              return Promise.reject(refreshError);
            }
          } else {
            // If we're already trying to refresh or it's a login request, handle auth error
            this.handleAuthError();
          }
        }

        // Handle server errors
        if (error.response.status >= 500) {
          toast.error('Server error. Please try again later.');
        }

        return Promise.reject(
          new ApiError(
            error.response.status,
            error.response.data?.message || 'An error occurred',
            error.response.data
          )
        );
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;

    // Try to get the token from multiple storage locations
    // 1. Try localStorage first (primary storage)
    const localToken = localStorage.getItem(API_CONFIG.AUTH.TOKEN_KEY);
    if (localToken) return localToken;

    // 2. Try admin token
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      console.log('Using admin token as fallback');
      return adminToken;
    }

    // 3. Try sessionStorage
    const sessionToken = sessionStorage.getItem(API_CONFIG.AUTH.TOKEN_KEY);
    if (sessionToken) {
      console.log('Using session token as fallback');
      // Also store in localStorage for future requests
      localStorage.setItem(API_CONFIG.AUTH.TOKEN_KEY, sessionToken);
      return sessionToken;
    }

    // 4. Try cookies as last resort
    const cookieToken = document.cookie.replace(
      new RegExp(`(?:(?:^|.*;\\s*)${API_CONFIG.AUTH.TOKEN_KEY}\\s*\\=\\s*([^;]*).*$)|^.*$`),
      "$1"
    );
    if (cookieToken) {
      console.log('Using cookie token as fallback');
      // Also store in localStorage for future requests
      localStorage.setItem(API_CONFIG.AUTH.TOKEN_KEY, cookieToken);
      return cookieToken;
    }

    // No more mock tokens in development mode - require proper login
    return null;
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem(API_CONFIG.AUTH.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Create form data as expected by the backend
      const formData = new URLSearchParams();
      formData.append('refresh_token', refreshToken);
      formData.append('grant_type', 'refresh_token');

      // Make direct fetch call to avoid interceptors loop
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`Refresh token failed: ${response.status}`);
      }

      const data = await response.json();
      const newToken = data.access_token;
      const newRefreshToken = data.refresh_token || refreshToken;

      // Store both tokens
      localStorage.setItem(API_CONFIG.AUTH.TOKEN_KEY, newToken);
      localStorage.setItem(API_CONFIG.AUTH.REFRESH_TOKEN_KEY, newRefreshToken);

      return newToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw new Error('Failed to refresh token');
    }
  }

  private handleAuthError() {
    localStorage.removeItem(API_CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.AUTH.REFRESH_TOKEN_KEY);

    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      localStorage.setItem(API_CONFIG.AUTH.REDIRECT_KEY, window.location.pathname);
      window.location.href = '/login';
    }
  }

  // No mock data implementation - always use real backend data

  public async get<T>(url: string, config = {}): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error in GET request to ${url}:`, error);
      throw error;
    }
  }

  public async post<T>(url: string, data?: any, config = {}): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error in POST request to ${url}:`, error);
      throw error;
    }
  }

  public async put<T>(url: string, data?: any, config = {}): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error in PUT request to ${url}:`, error);
      throw error;
    }
  }

  public async delete<T>(url: string, config = {}): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error in DELETE request to ${url}:`, error);
      throw error;
    }
  }
}

export const apiClient = ApiClient.getInstance();

