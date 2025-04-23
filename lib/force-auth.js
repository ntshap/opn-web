// Force authentication to stick by using multiple storage mechanisms
// and aggressive checking

// Set a token with maximum persistence
export function forceSetAuth(token) {
  if (typeof window === 'undefined') return false;

  try {
    console.log('Force setting auth token');

    // Clear any existing tokens first to avoid conflicts
    clearAllAuth();

    // Store in every possible location
    // 1. localStorage
    localStorage.setItem('force_auth_token', token);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('token', token);

    // 2. sessionStorage
    sessionStorage.setItem('force_auth_token', token);
    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('token', token);

    // 3. Cookies with different paths and names
    document.cookie = `force_auth_token=${token};path=/;max-age=86400;SameSite=Lax`;
    document.cookie = `auth_token=${token};path=/;max-age=86400;SameSite=Lax`;
    document.cookie = `token=${token};path=/;max-age=86400;SameSite=Lax`;

    // 4. Set a flag indicating we've set the token
    const authTime = Date.now().toString();
    localStorage.setItem('auth_set_time', authTime);
    sessionStorage.setItem('auth_set_time', authTime);
    document.cookie = `auth_set_time=${authTime};path=/;max-age=86400;SameSite=Lax`;

    // 5. Set a special flag that we can check for
    const authFlag = 'authenticated-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('auth_flag', authFlag);
    sessionStorage.setItem('auth_flag', authFlag);
    document.cookie = `auth_flag=${authFlag};path=/;max-age=86400;SameSite=Lax`;

    // Verify tokens were set
    const verifyLocalStorage = localStorage.getItem('force_auth_token');
    const verifySessionStorage = sessionStorage.getItem('force_auth_token');

    console.log('Auth token verification:', {
      localStorage: verifyLocalStorage ? 'Set' : 'Failed',
      sessionStorage: verifySessionStorage ? 'Set' : 'Failed'
    });

    return true;
  } catch (error) {
    console.error('Error force setting auth:', error);
    return false;
  }
}

// Check if authenticated with aggressive checking
export function isForceAuthenticated() {
  if (typeof window === 'undefined') return false;

  try {
    console.log('Checking force authentication');

    // First check for our special auth flag
    const authFlag = localStorage.getItem('auth_flag') ||
                     sessionStorage.getItem('auth_flag');

    if (authFlag && authFlag.startsWith('authenticated-')) {
      console.log('Found auth flag, user is authenticated');
      return true;
    }

    // Check localStorage
    const localToken = localStorage.getItem('force_auth_token') ||
                       localStorage.getItem('auth_token') ||
                       localStorage.getItem('token');

    // Check sessionStorage
    const sessionToken = sessionStorage.getItem('force_auth_token') ||
                         sessionStorage.getItem('auth_token') ||
                         sessionStorage.getItem('token');

    // Log what we found
    console.log('Auth check results:', {
      localStorage: localToken ? 'Found' : 'Not found',
      sessionStorage: sessionToken ? 'Found' : 'Not found'
    });

    // If we have a token in any storage, consider authenticated
    const isAuthenticated = !!(localToken || sessionToken);
    console.log('Force authentication result:', isAuthenticated ? 'Authenticated' : 'Not authenticated');

    // Removed development mode bypass

    return isAuthenticated;
  } catch (error) {
    console.error('Error checking force authentication:', error);

    // Removed development mode bypass on error

    return false;
  }
}

// Clear all authentication data
export function clearAllAuth() {
  if (typeof window === 'undefined') return;

  try {
    // Clear localStorage
    localStorage.removeItem('force_auth_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('auth_set_time');
    localStorage.removeItem('auth_flag');
    localStorage.removeItem('login_timestamp');

    // Clear sessionStorage
    sessionStorage.removeItem('force_auth_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('auth_set_time');
    sessionStorage.removeItem('auth_flag');
    sessionStorage.removeItem('login_timestamp');
    sessionStorage.removeItem('loginSuccess');
    sessionStorage.removeItem('loginTime');
    sessionStorage.removeItem('redirectCount');

    // Clear cookies
    document.cookie = 'force_auth_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'auth_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'auth_set_time=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'auth_flag=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'login_timestamp=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';

    console.log('All auth data cleared');
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
}

// Get the current auth token from any storage
export function getForceAuthToken() {
  if (typeof window === 'undefined') return null;

  try {
    // Check localStorage first
    const localToken = localStorage.getItem('force_auth_token') ||
                       localStorage.getItem('auth_token') ||
                       localStorage.getItem('token');
    if (localToken) return localToken;

    // Check sessionStorage next
    const sessionToken = sessionStorage.getItem('force_auth_token') ||
                         sessionStorage.getItem('auth_token') ||
                         sessionStorage.getItem('token');
    if (sessionToken) return sessionToken;

    // Check cookies last
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('force_auth_token=') ||
                   row.startsWith('auth_token=') ||
                   row.startsWith('token='))
      ?.split('=')[1];

    if (cookieToken) return cookieToken;

    // No token found
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}
