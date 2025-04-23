// Client-side authentication utilities

// Check if the user is authenticated
export const isAuthenticated = (): boolean => {
  // No longer bypass authentication in development mode
  // This ensures we're using real authentication

  if (typeof window === 'undefined') return false

  try {
    // Limit console logging to reduce noise
    const debugMode = false;

    // Check localStorage first (primary storage)
    const token = localStorage.getItem('token')
    const authToken = localStorage.getItem('auth_token')

    if (authToken) {
      // Validate token format (simple check)
      if (authToken.length < 10) {
        if (debugMode) console.warn('Auth check: Invalid token format in localStorage')
        return false
      }

      // Log authentication status for debugging
      if (debugMode) console.log('Auth check: Valid auth_token found in localStorage')
      return true
    }

    if (token) {
      // Validate token format (simple check)
      if (token.length < 10) {
        if (debugMode) console.warn('Auth check: Invalid token format in localStorage')
        return false
      }

      // Log authentication status for debugging
      if (debugMode) console.log('Auth check: Valid token found in localStorage')
      return true
    }

    // Fallback to cookies
    const cookieToken = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1")
    const cookieAuthToken = document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")

    if (cookieAuthToken && cookieAuthToken.length >= 10) {
      console.log('Auth check: Valid auth_token found in cookies')
      return true
    }

    if (cookieToken && cookieToken.length >= 10) {
      console.log('Auth check: Valid token found in cookies')
      return true
    }

    console.log('Auth check: No valid token found')
    return false
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

// Set authentication tokens
export const setAuthTokens = (token: string, refreshToken?: string): void => {
  if (typeof window === 'undefined') return

  console.log('Setting auth tokens:', token ? 'Token present' : 'No token')

  try {
    // Store in localStorage - use both formats for compatibility
    localStorage.setItem('token', token)
    localStorage.setItem('auth_token', token)

    // Set the is_logged_in flag to true
    localStorage.setItem('is_logged_in', 'true')

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }

    // Store in cookies with secure attributes
    const cookieOptions = 'path=/;max-age=2592000;SameSite=Lax' // 30 days, more compatible SameSite
    document.cookie = `token=${token};${cookieOptions}`
    document.cookie = `auth_token=${token};${cookieOptions}`
    document.cookie = `is_logged_in=true;${cookieOptions}`

    if (refreshToken) {
      document.cookie = `refreshToken=${refreshToken};${cookieOptions}`
    }

    console.log('Auth tokens and login flag set successfully')
  } catch (error) {
    console.error('Error setting auth tokens:', error)
  }
}

// Remove authentication tokens
export const removeAuthTokens = (): void => {
  if (typeof window === 'undefined') return

  // Remove from localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('auth_token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('is_logged_in')

  // Remove from cookies
  document.cookie = "token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"
  document.cookie = "auth_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"
  document.cookie = "refreshToken=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"
  document.cookie = "is_logged_in=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"

  console.log('Auth tokens and login flag removed successfully')
}

// Get the authentication token
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    console.log('[Auth] Running on server, no token available');
    return null;
  }

  console.log('[Auth] Attempting to retrieve auth token...');

  // Check localStorage first for auth_token (new format)
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    console.log('[Auth] Found auth_token in localStorage:',
      authToken.length > 20 ?
      `${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 10)}` :
      'Invalid token format');

    // If the token doesn't have the Bearer prefix, add it
    if (!authToken.startsWith('Bearer ')) {
      const tokenWithPrefix = `Bearer ${authToken}`;
      console.log('[Auth] Added Bearer prefix to auth_token');
      return tokenWithPrefix;
    }
    console.log('[Auth] auth_token already has Bearer prefix');
    return authToken;
  }

  // Check localStorage for token (old format)
  const token = localStorage.getItem('token');
  if (token) {
    console.log('[Auth] Found token in localStorage:',
      token.length > 20 ?
      `${token.substring(0, 10)}...${token.substring(token.length - 10)}` :
      'Invalid token format');

    // If the token doesn't have the Bearer prefix, add it
    if (!token.startsWith('Bearer ')) {
      const tokenWithPrefix = `Bearer ${token}`;
      console.log('[Auth] Added Bearer prefix to token');
      return tokenWithPrefix;
    }
    console.log('[Auth] token already has Bearer prefix');
    return token;
  }

  // Fallback to cookies
  const cookieAuthToken = document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  if (cookieAuthToken) {
    console.log('[Auth] Found auth_token in cookies:',
      cookieAuthToken.length > 20 ?
      `${cookieAuthToken.substring(0, 10)}...${cookieAuthToken.substring(cookieAuthToken.length - 10)}` :
      'Invalid token format');

    // If the token doesn't have the Bearer prefix, add it
    if (!cookieAuthToken.startsWith('Bearer ')) {
      const tokenWithPrefix = `Bearer ${cookieAuthToken}`;
      console.log('[Auth] Added Bearer prefix to cookie auth_token');
      return tokenWithPrefix;
    }
    console.log('[Auth] cookie auth_token already has Bearer prefix');
    return cookieAuthToken;
  }

  const cookieToken = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  if (cookieToken) {
    console.log('[Auth] Found token in cookies:',
      cookieToken.length > 20 ?
      `${cookieToken.substring(0, 10)}...${cookieToken.substring(cookieToken.length - 10)}` :
      'Invalid token format');

    // If the token doesn't have the Bearer prefix, add it
    if (!cookieToken.startsWith('Bearer ')) {
      const tokenWithPrefix = `Bearer ${cookieToken}`;
      console.log('[Auth] Added Bearer prefix to cookie token');
      return tokenWithPrefix;
    }
    console.log('[Auth] cookie token already has Bearer prefix');
    return cookieToken;
  }

  console.log('[Auth] No token found in localStorage or cookies');
  return null;
}

// Get the refresh token
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null

  // Check localStorage first
  const refreshToken = localStorage.getItem('refreshToken')
  if (refreshToken) return refreshToken

  // Fallback to cookies
  return document.cookie.replace(/(?:(?:^|.*;\s*)refreshToken\s*\=\s*([^;]*).*$)|^.*$/, "$1") || null
}
