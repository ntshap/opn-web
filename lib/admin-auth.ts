import axios from 'axios';

// Base URL for the API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://beopn.penaku.site/api/v1';

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

// Key for storing admin token in localStorage
const ADMIN_TOKEN_KEY = 'admin_token';

/**
 * Authenticate with admin credentials and store the token
 */
export async function authenticateAsAdmin(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Authenticating as admin...');

    // Make the authentication request
    const response = await axios.post(`${API_BASE_URL}/auth/token`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });

    if (response.data && response.data.access_token) {
      // Store the admin token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_TOKEN_KEY, response.data.access_token);

        if (response.data.refresh_token) {
          localStorage.setItem('admin_refresh_token', response.data.refresh_token);
        }
      }

      console.log('Admin authentication successful');
      return { success: true, message: 'Admin authentication successful' };
    } else {
      console.error('Admin authentication failed: No token in response', response.data);
      return { success: false, message: 'Admin authentication failed: No token in response' };
    }
  } catch (error: any) {
    console.error('Admin authentication error:', error);
    return {
      success: false,
      message: `Admin authentication failed: ${error.message}`
      // Removed: error: error.response?.data || error.message
    };
  }
}

/**
 * Get the admin token from localStorage
 */
export function getAdminToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }
  return null;
}

/**
 * Check if admin is authenticated
 */
export function isAdminAuthenticated(): boolean {
  return !!getAdminToken();
}

/**
 * Clear admin authentication
 */
export function clearAdminAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem('admin_refresh_token');
  }
}

/**
 * Get authorization headers with admin token
 */
export function getAdminAuthHeaders(): { Authorization: string } | {} {
  const token = getAdminToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}
