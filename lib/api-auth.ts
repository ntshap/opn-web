"use client";

import { API_CONFIG } from './config';
import { setAuthTokens, removeAuthTokens } from './auth-utils';

// Helper function to process login response
function processLoginResponse(data: any): { token: string; refreshToken: string } {
  console.log('Processing login response:', {
    access_token: data.access_token ? '[PRESENT]' : '[MISSING]',
    token_type: data.token_type
  });

  // Store token
  if (!data.access_token) {
    throw new Error('No access token received');
  }

  // For debugging
  console.log('About to set auth tokens with:', {
    token_length: data.access_token.length,
    refresh_token: data.refresh_token ? 'present' : 'missing'
  });

  try {
    // Set auth tokens
    setAuthTokens(data.access_token, data.refresh_token);

    // Verify tokens were set
    setTimeout(() => {
      const storedToken = localStorage.getItem('auth_token');
      console.log('Verification - token in localStorage:', storedToken ? 'present' : 'missing');
    }, 100);

    return {
      token: data.access_token,
      refreshToken: data.refresh_token || '',
    };
  } catch (error) {
    console.error('Error in processLoginResponse:', error);
    throw error;
  }
}

// Auth API service
export const authApi = {
  // Login function
  login: async (username: string, password: string): Promise<{ token: string; refreshToken: string }> => {
    try {
      console.log(`Attempting to login with username: ${username}`);

      // Create form data
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('grant_type', 'password');

      // Try the primary login method first using the API proxy
      try {
        console.log('Trying primary login method...');
        // Make API request through the local API proxy to handle CORS properly
        const response = await fetch(`/api/v1/auth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
          // Explicitly disable CORS mode to prevent preflight OPTIONS requests
          mode: 'same-origin',
          credentials: 'same-origin',
        });

        console.log('Login response status:', response.status);

        // If successful, process the response
        if (response.ok) {
          const data = await response.json();
          console.log('Login successful with primary method');
          return processLoginResponse(data);
        }

        // If we get a Method Not Allowed error, try the fallback method
        if (response.status === 405) {
          throw new Error('Method not allowed, trying fallback method');
        }

        // For other errors, handle them normally
        const errorText = await response.text();
        throw new Error(errorText);
      } catch (primaryError) {
        // If primary method fails, try the fallback method
        console.log('Primary login method failed, trying fallback...', primaryError);

        // Try the fallback login method (JSON-based) through the local API proxy
        const fallbackResponse = await fetch(`/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
          // Explicitly disable CORS mode to prevent preflight OPTIONS requests
          mode: 'same-origin',
          credentials: 'same-origin',
        });

        console.log('Fallback login response status:', fallbackResponse.status);

        // Handle fallback response
        if (!fallbackResponse.ok) {
          const errorText = await fallbackResponse.text();
          console.error('Fallback login failed:', errorText);

          if (fallbackResponse.status === 401) {
            throw new Error('Username atau password salah');
          } else if (fallbackResponse.status === 403) {
            throw new Error('Akun Anda tidak memiliki izin untuk masuk');
          } else {
            // Include more detailed error information
            try {
              const errorJson = JSON.parse(errorText);
              const errorDetail = errorJson.detail || errorJson.message || 'Unknown error';
              throw new Error(`Gagal masuk: ${errorDetail}`);
            } catch (parseError) {
              // If we can't parse the error as JSON, just use the raw text
              throw new Error(`Gagal masuk. ${errorText || 'Silakan coba lagi nanti.'}`);
            }
          }
        }

        // Parse fallback response
        const data = await fallbackResponse.json();
        console.log('Login successful with fallback method');
        return processLoginResponse(data);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout function
  logout: (): void => {
    removeAuthTokens();
  },

  // Refresh token function
  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    try {
      // Create form data
      const formData = new URLSearchParams();
      formData.append('refresh_token', refreshToken);
      formData.append('grant_type', 'refresh_token');

      // Make API request
      const response = await fetch(`${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      // Handle response
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      // Parse response
      const data = await response.json();

      // Store token
      if (!data.access_token) {
        throw new Error('No access token received');
      }

      // Set auth tokens
      setAuthTokens(data.access_token, data.refresh_token);

      return {
        token: data.access_token,
        refreshToken: data.refresh_token || '',
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async (): Promise<any> => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem(API_CONFIG.AUTH.TOKEN_KEY);

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Make API request
      const response = await fetch(`${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.AUTH.ME}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Handle response
      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      // Parse response
      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
};
