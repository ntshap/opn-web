// Simple authentication utilities for reliable token management

// Set a token that will persist across page loads
export function setAuthToken(token) {
  if (typeof window === 'undefined') return false;
  
  try {
    console.log('Setting auth token');
    
    // Store in localStorage
    localStorage.setItem('auth_token', token);
    
    // Also store in sessionStorage as backup
    sessionStorage.setItem('auth_token', token);
    
    // Set a cookie as another backup
    document.cookie = `auth_token=${token};path=/;max-age=86400;SameSite=Lax`;
    
    return true;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return false;
  }
}

// Check if a user is authenticated
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check localStorage first
    const localToken = localStorage.getItem('auth_token');
    if (localToken) {
      console.log('Found token in localStorage');
      return true;
    }
    
    // Check sessionStorage next
    const sessionToken = sessionStorage.getItem('auth_token');
    if (sessionToken) {
      console.log('Found token in sessionStorage');
      // Restore to localStorage
      localStorage.setItem('auth_token', sessionToken);
      return true;
    }
    
    // Check cookies last
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
      
    if (cookieToken) {
      console.log('Found token in cookies');
      // Restore to localStorage and sessionStorage
      localStorage.setItem('auth_token', cookieToken);
      sessionStorage.setItem('auth_token', cookieToken);
      return true;
    }
    
    // No token found
    console.log('No auth token found');
    return false;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Clear all authentication data
export function clearAuth() {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Clear sessionStorage
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    
    // Clear cookies
    document.cookie = 'auth_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
}

// Get the current auth token
export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  
  try {
    // Check localStorage first
    const localToken = localStorage.getItem('auth_token');
    if (localToken) return localToken;
    
    // Check sessionStorage next
    const sessionToken = sessionStorage.getItem('auth_token');
    if (sessionToken) return sessionToken;
    
    // Check cookies last
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
      
    if (cookieToken) return cookieToken;
    
    // No token found
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}
