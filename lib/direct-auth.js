// Direct authentication utility - simplified for reliability

// Set authentication directly
export function setDirectAuth(token) {
  if (typeof window === 'undefined') return false;
  
  try {
    // Store token directly in localStorage
    localStorage.setItem('direct_auth_token', token);
    
    // Also store in sessionStorage as backup
    sessionStorage.setItem('direct_auth_token', token);
    
    return true;
  } catch (error) {
    console.error('Error setting direct auth:', error);
    return false;
  }
}

// Check if authenticated
export function isDirectAuthenticated() {
  if (typeof window === 'undefined') return false;
  
  // In development mode, always return true
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  try {
    // Check localStorage
    const token = localStorage.getItem('direct_auth_token');
    
    // If token exists, user is authenticated
    return !!token;
  } catch (error) {
    console.error('Error checking direct auth:', error);
    return false;
  }
}

// Get the auth token
export function getDirectAuthToken() {
  if (typeof window === 'undefined') return null;
  
  try {
    // Get token from localStorage
    return localStorage.getItem('direct_auth_token');
  } catch (error) {
    console.error('Error getting direct auth token:', error);
    return null;
  }
}

// Clear auth
export function clearDirectAuth() {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage
    localStorage.removeItem('direct_auth_token');
    
    // Clear sessionStorage
    sessionStorage.removeItem('direct_auth_token');
  } catch (error) {
    console.error('Error clearing direct auth:', error);
  }
}
