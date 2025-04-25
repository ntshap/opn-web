/**
 * Utility functions for handling image URLs
 */
import { API_CONFIG } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils';

/**
 * Formats an image URL to ensure it's a complete URL
 * @param url The original URL from the API
 * @returns A complete URL that can be used in an img tag
 */
export function formatImageUrl(url: string | null | undefined, contextId?: string | number): string {
  // If the URL is null or undefined, return empty string to prevent infinite loops
  if (!url) {
    console.log('[formatImageUrl] URL is null or undefined');
    return '';
  }

  // If the URL is a placeholder, return empty string to prevent infinite loops
  if (url.includes('placeholder')) {
    console.log('[formatImageUrl] URL is a placeholder, returning empty string to prevent loops');
    return '';
  }

  try {
    // Log the original URL for debugging
    console.log(`[formatImageUrl] Original URL: ${url}`);

    // If it's already a complete URL, return it as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      console.log(`[formatImageUrl] URL is already complete: ${url}`);
      return url;
    }

    // Special case for the specific URL pattern that's causing issues
    if (url.includes('/uploads/news/2025-04-03/2025-04/1743634833908_0.png')) {
      console.log('[formatImageUrl] Detected problematic URL pattern, using placeholder');
      return '/placeholder-news.svg';
    }

    // IMPORTANT: Never use localhost, always use the backend URL directly
    // Get the backend URL from config
    const backendUrl = API_CONFIG.BACKEND_URL;

    // Make sure we have the correct backend URL
    if (!backendUrl || backendUrl.includes('localhost')) {
      console.error('[formatImageUrl] Invalid backend URL:', backendUrl);
      return '/placeholder-news.svg';
    }

    // Remove trailing slash if present
    const backendBaseUrl = backendUrl.endsWith('/')
      ? backendUrl.slice(0, -1)
      : backendUrl;

    // Remove /api/v1 from the backend URL if present
    const baseUrl = backendBaseUrl.replace(/\/api\/v1$/, '');
    console.log(`[formatImageUrl] Base URL: ${baseUrl}`);

    // For URLs from the backend API that start with /uploads
    if (url.startsWith('/uploads') || url.includes('/uploads/')) {
      let cleanUrl = url;

      // Ensure the URL starts with /
      if (!cleanUrl.startsWith('/')) {
        cleanUrl = `/${cleanUrl}`;
      }

      // Preserve double slashes as required by the backend
      // The backend expects URLs like https://backend-project-pemuda.onrender.com//uploads/...
      const fullUrl = `${baseUrl}//${cleanUrl.startsWith('/') ? cleanUrl.substring(1) : cleanUrl}`;

      console.log(`[formatImageUrl] Returning direct full URL with double slash: ${fullUrl}`);

      // Log the URL components for debugging
      console.log(`[formatImageUrl] URL components:`, {
        baseUrl,
        cleanUrl,
        fullUrl
      });

      return fullUrl;
    }

    // For URLs that include 'uploads' but don't start with /uploads
    if (url.includes('uploads')) {
      // Handle the case where the URL might be in the format 'uploads/news/{news_id}/{filename}'
      let cleanUrl = url;

      // Remove any leading slashes
      if (cleanUrl.startsWith('/')) {
        cleanUrl = cleanUrl.substring(1);
      }

      // Ensure we have the correct path structure
      if (!cleanUrl.startsWith('uploads/')) {
        const uploadsPart = cleanUrl.split('uploads/');
        if (uploadsPart.length > 1) {
          cleanUrl = `uploads/${uploadsPart[1]}`;
        } else {
          cleanUrl = `uploads/${cleanUrl}`;
        }
      }

      // Preserve double slashes as required by the backend
      const fullUrl = `${baseUrl}//${cleanUrl}`;
      console.log(`[formatImageUrl] Returning direct full URL with double slash: ${fullUrl}`);
      return fullUrl;
    }

    // If it's a relative URL starting with /, add the base URL
    if (url.startsWith('/')) {
      // Preserve double slashes as required by the backend
      const fullUrl = `${baseUrl}//${url.startsWith('/') ? url.substring(1) : url}`;
      console.log(`[formatImageUrl] Returning direct full URL with double slash: ${fullUrl}`);
      return fullUrl;
    }

    // Check if it might be a filename only (no path)
    if (!url.includes('/')) {
      // Assume it's a filename that should be in the uploads directory
      // Preserve double slashes as required by the backend
      const fullUrl = `${baseUrl}//uploads/${url}`;
      console.log(`[formatImageUrl] Returning direct full URL with double slash: ${fullUrl}`);
      return fullUrl;
    }

    // For any other URL, assume it's a relative path and add the base URL
    // Preserve double slashes as required by the backend
    const fullUrl = `${baseUrl}//uploads/${url}`;
    console.log(`[formatImageUrl] Returning direct full URL with double slash: ${fullUrl}`);
    return fullUrl;
  } catch (error) {
    console.error('[formatImageUrl] Error formatting URL:', error);
    return '/placeholder-news.svg';
  }
}

/**
 * Since we can't directly add Authorization headers to <img> tags,
 * we need to use our API proxy for authenticated image requests
 * @param url The original image URL
 * @returns A URL that can be used in an img tag with authentication
 */
export function getAuthenticatedImageUrl(url: string | null | undefined): string {
  if (!url) return '';

  // If the URL is a placeholder, return empty string to prevent infinite loops
  if (url.includes('placeholder')) {
    console.log('[getAuthenticatedImageUrl] URL is a placeholder, returning empty string to prevent loops');
    return '';
  }

  // The URL might already be a complete URL from formatImageUrl
  // We'll use it directly in that case
  let fullUrl = url;

  // If it's not a complete URL, we need to format it
  if (!url.startsWith('http')) {
    // Format the URL using our utility function
    fullUrl = formatImageUrl(url);
    console.log(`[getAuthenticatedImageUrl] Formatted URL: ${fullUrl}`);
  }

  // Verify the URL doesn't contain localhost
  if (fullUrl.includes('localhost')) {
    console.error(`[getAuthenticatedImageUrl] Error: URL contains localhost: ${fullUrl}`);
    return '/placeholder-news.svg';
  }

  // Use our raw-image API proxy route that will add the Authorization header server-side
  // This is the proper way to handle authentication for images
  const proxyUrl = `/api/v1/raw-image?url=${encodeURIComponent(fullUrl)}`;
  console.log(`[getAuthenticatedImageUrl] Using raw-image API proxy: ${proxyUrl}`);

  return proxyUrl;
}

/**
 * Creates an authenticated fetch function for loading images
 * @returns A fetch function with authentication headers
 */
export async function createAuthenticatedImageFetch() {
  const token = await getAuthToken();

  return async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});

    // Add authorization header if we have a token
    if (token) {
      headers.set('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
    }

    // Add accept header for images
    headers.set('Accept', 'image/*');

    // Return the fetch promise
    return fetch(url, {
      ...options,
      headers,
    });
  };
}

/**
 * Loads an image from the backend with authentication
 * @param path The image path
 * @returns A promise that resolves to the image data
 */
export async function loadBackendImage(path: string): Promise<Blob | null> {
  try {
    // Format the URL using our utility function
    const url = formatImageUrl(path);

    // IMPORTANT: Never use localhost, always use the backend URL directly
    if (url.includes('localhost')) {
      console.error(`[Image Utils] Error: URL contains localhost: ${url}`);
      return null;
    }

    // Create an authenticated fetch function
    const authenticatedFetch = await createAuthenticatedImageFetch();

    // Make the request to the backend
    const response = await authenticatedFetch(url, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[Image Utils] Failed to load image: ${url}`, response.status);
      return null;
    }

    return await response.blob();
  } catch (error) {
    console.error(`[Image Utils] Error loading image: ${path}`, error);
    return null;
  }
}

/**
 * Formats a date string for display
 * @param dateString The date string to format
 * @returns A formatted date string
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''

  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (e) {
    return dateString
  }
}
