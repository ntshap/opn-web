/**
 * Development authentication utilities
 * These functions are only used in development mode to help with testing
 */

/**
 * Sets a mock authentication token for development purposes
 * This is useful for testing authenticated API routes
 */
export function setMockAuthToken(): void {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('setMockAuthToken should only be used in development mode');
    return;
  }

  if (typeof window === 'undefined') return;

  // This function is disabled - we should never use mock tokens
  console.warn('Mock authentication is disabled - please use real backend authentication');
  return;

  // This function is disabled
}

/**
 * Checks if a mock authentication token is set
 */
export function hasMockAuthToken(): boolean {
  // This function is disabled - we should never use mock tokens
  return false;
}

/**
 * Clears the mock authentication token
 */
export function clearMockAuthToken(): void {
  // This function is disabled - we should never use mock tokens
  console.warn('Mock authentication is disabled - please use real backend authentication');
  return;
}
