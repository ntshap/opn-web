export const API_CONFIG = {
  // Use local API proxy
  BASE_URL: '/api/v1',
  // Backend URL for server-side API calls
  BACKEND_URL: 'https://backend-project-pemuda.onrender.com',
  TIMEOUT: {
    DEFAULT: 15000,
    FINANCE: 30000,
  },
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000,
    BACKOFF_FACTOR: 2,
  },
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  AUTH: {
    TOKEN_KEY: 'token',
    REFRESH_TOKEN_KEY: 'refreshToken',
    REDIRECT_KEY: 'redirectAfterLogin',
  },
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/token',
      REFRESH: '/auth/refresh',
      REGISTER: '/auth/register',
      ME: '/auth/me',
    },
    NEWS: '/news/',
    EVENTS: '/events/',
    MEMBERS: '/members/',
    // Based on the API documentation, the correct endpoint is /meeting-minutes/
    MEETING_MINUTES: '/meeting-minutes/',
  },
}

export const APP_CONFIG = {
  DEFAULT_LANGUAGE: 'id',
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
  },
}

