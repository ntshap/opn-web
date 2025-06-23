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

    // Log additional details about the URL format
    if (url.includes('uploads')) {
      console.log(`[formatImageUrl] URL contains 'uploads' path: ${url}`);
    }

    if (url.includes('//')) {
      console.log(`[formatImageUrl] URL contains double slashes: ${url}`);
    }

    // If it's already a complete URL, return it as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      console.log(`[formatImageUrl] URL is already complete: ${url}`);
      return url;
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

    // For URLs from the backend API that start with /uploads or contain /uploads/
    if (url.startsWith('/uploads') || url.includes('/uploads/')) {
      let cleanUrl = url;

      // Ensure the URL starts with /
      if (!cleanUrl.startsWith('/')) {
        cleanUrl = `/${cleanUrl}`;
      }

      // Extract the path after 'uploads/'
      let pathAfterUploads = '';
      if (cleanUrl.includes('uploads/')) {
        pathAfterUploads = cleanUrl.split('uploads/')[1];
      } else {
        pathAfterUploads = cleanUrl.startsWith('/') ? cleanUrl.substring(1) : cleanUrl;
      }

      // Preserve double slashes as required by the backend
      // The backend expects URLs like https://beopn.penaku.site//uploads/...
      console.log(`[formatImageUrl] Using double slash format for uploads`);
      const fullUrl = `${baseUrl}//uploads/${pathAfterUploads}`;

      console.log(`[formatImageUrl] Returning direct full URL with double slash: ${fullUrl}`);
      return fullUrl;
    }

    // For URLs that include 'uploads' but don't start with /uploads
    if (url.includes('uploads')) {
      // Handle the case where the URL might be in the format 'uploads/news/{news_id}/{filename}'
      // or 'uploads/events/2025-04-21/2025-04/24_1745227510164.png'
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
      // The backend expects URLs like https://beopn.penaku.site//uploads/...
      console.log(`[formatImageUrl] Using double slash format for clean URL`);
      const fullUrl = `${baseUrl}//${cleanUrl}`;
      console.log(`[formatImageUrl] Returning direct full URL with double slash: ${fullUrl}`);
      return fullUrl;
    }

    // If it's a relative URL starting with /, add the base URL
    if (url.startsWith('/')) {
      // Preserve double slashes as required by the backend
      // The backend expects URLs like https://beopn.penaku.site//uploads/...
      console.log(`[formatImageUrl] Using double slash format for relative URL`);
      const fullUrl = `${baseUrl}//${url.startsWith('/') ? url.substring(1) : url}`;
      console.log(`[formatImageUrl] Returning direct full URL with double slash: ${fullUrl}`);
      return fullUrl;
    }

    // Check if it might be a filename only (no path)
    if (!url.includes('/')) {
      // Assume it's a filename that should be in the uploads directory
      // Preserve double slashes as required by the backend
      // The backend expects URLs like https://beopn.penaku.site//uploads/...
      console.log(`[formatImageUrl] Using double slash format for uploads without slash`);
      const fullUrl = `${baseUrl}//uploads/${url}`;
      console.log(`[formatImageUrl] Returning direct full URL with double slash: ${fullUrl}`);
      return fullUrl;
    }

    // For any other URL, assume it's a relative path and add the base URL
    // Preserve double slashes as required by the backend
    // The backend expects URLs like https://beopn.penaku.site//uploads/...
    console.log(`[formatImageUrl] Using double slash format for uploads with slash`);
    const fullUrl = `${baseUrl}//uploads/${url}`;
    console.log(`[formatImageUrl] Returning direct full URL with double slash: ${fullUrl}`);
    return fullUrl;
  } catch (error) {
    console.error('[formatImageUrl] Error formatting URL:', error);
    return '/placeholder-news.svg';
  }
}

/**
 * Since we can't directly add Authorization headers to <img> tags in HTML,
 * we should use direct URLs for client-side components that can handle auth
 * @param url The original image URL
 * @returns A properly formatted direct URL to the backend
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
    return '';
  }

  // Ensure double slashes are preserved for the backend
  if (fullUrl.includes('beopn.penaku.site/') && !fullUrl.includes('beopn.penaku.site//')) {
    console.log(`[formatImageUrl] Fixing single slash to double slash`);
    fullUrl = fullUrl.replace('beopn.penaku.site/', 'beopn.penaku.site//');
  }

  // Return the direct URL - the component should handle authentication
  console.log(`[getAuthenticatedImageUrl] Using direct URL: ${fullUrl}`);

  return fullUrl;
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
    console.log(`[loadBackendImage] Formatted URL: ${url}`);

    // IMPORTANT: Never use localhost, always use the backend URL directly
    if (url.includes('localhost')) {
      console.error(`[loadBackendImage] Error: URL contains localhost: ${url}`);
      return null;
    }

    // Get the auth token
    const token = getAuthToken();
    if (!token) {
      console.error('[loadBackendImage] No authentication token available');
      return null;
    }

    // Make sure token has Bearer prefix
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    // Add a timestamp to prevent caching
    const urlWithTimestamp = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    console.log(`[loadBackendImage] Using URL with timestamp: ${urlWithTimestamp}`);

    // Make the request to the backend - explicitly use GET method
    console.log(`[loadBackendImage] Fetching with auth token: ${authHeader.substring(0, 15)}...`);
    const response = await fetch(urlWithTimestamp, {
      method: 'GET', // Explicitly use GET method, not OPTIONS
      headers: {
        'Authorization': authHeader,
        'Accept': 'image/*',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[loadBackendImage] Failed to load image: ${url}`, response.status);
      return null;
    }

    return await response.blob();
  } catch (error) {
    console.error(`[loadBackendImage] Error loading image: ${path}`, error);
    return null;
  }
}

/**
 * Fetches an image from the backend with authentication and returns a blob URL
 * @param path The image path
 * @returns A promise that resolves to a blob URL
 */
export async function fetchImageAsBlob(path: string): Promise<string | null> {
  try {
    console.log(`[fetchImageAsBlob] Starting with original path: ${path}`);

    // Format the URL using our utility function
    const url = formatImageUrl(path);
    console.log(`[fetchImageAsBlob] Formatted URL: ${url}`);

    // Additional logging for URL structure
    if (url.includes('uploads')) {
      console.log(`[fetchImageAsBlob] URL contains 'uploads' path: ${url}`);

      // Check if the URL has the correct structure
      if (url.includes('beopn.penaku.site//uploads')) {
        console.log(`[fetchImageAsBlob] URL has correct double-slash structure`);
      } else if (url.includes('beopn.penaku.site/uploads')) {
        console.log(`[fetchImageAsBlob] URL has incorrect single-slash structure`);
      }
    }

    // IMPORTANT: Never use localhost, always use the backend URL directly
    if (url.includes('localhost')) {
      console.error(`[fetchImageAsBlob] Error: URL contains localhost: ${url}`);
      return null;
    }

    // Get the auth token
    const token = getAuthToken();
    if (!token) {
      console.error('[fetchImageAsBlob] No authentication token available');
      return null;
    }

    // Make sure token has Bearer prefix
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    console.log(`[fetchImageAsBlob] Using auth token: ${authHeader.substring(0, 15)}...`);

    // Add a timestamp to prevent caching
    const urlWithTimestamp = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    console.log(`[fetchImageAsBlob] Using direct URL with timestamp: ${urlWithTimestamp}`);

    // Direct fetch with proper headers
    try {
      console.log(`[fetchImageAsBlob] Fetching image with auth token: ${authHeader.substring(0, 15)}...`);
      const response = await fetch(urlWithTimestamp, {
        method: 'GET', // Explicitly use GET method, not OPTIONS
        headers: {
          'Authorization': authHeader,
          'Accept': 'image/*',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error(`[fetchImageAsBlob] Error fetching image: ${response.status} ${response.statusText}`);
        return null;
      }

      // Convert the response to a blob
      const blob = await response.blob();

      // Create a blob URL
      const objectUrl = URL.createObjectURL(blob);
      console.log(`[fetchImageAsBlob] Created blob URL from direct fetch: ${objectUrl}`);

      return objectUrl;
    } catch (fetchError) {
      console.error(`[fetchImageAsBlob] Direct fetch error:`, fetchError);

      // If direct fetch fails, try using the Image element approach
      // This approach avoids OPTIONS preflight requests
      console.log(`[fetchImageAsBlob] Trying Image element approach`);

      // Create a new XMLHttpRequest to avoid CORS issues
      const xhr = new XMLHttpRequest();
      xhr.open('GET', urlWithTimestamp, true);
      xhr.responseType = 'blob';
      xhr.setRequestHeader('Authorization', authHeader);
      xhr.setRequestHeader('Accept', 'image/*');

      // Create a promise that resolves when the request completes
      const imagePromise = new Promise<Blob>((resolve, reject) => {
        xhr.onload = function() {
          if (this.status >= 200 && this.status < 300) {
            resolve(this.response);
          } else {
            reject(new Error(`Failed to load image: ${this.status} ${this.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send();
      });

      try {
        // Wait for the image to load
        const blob = await imagePromise;

        // Create a blob URL
        const objectUrl = URL.createObjectURL(blob);
        console.log(`[fetchImageAsBlob] Created blob URL from XHR: ${objectUrl}`);

        return objectUrl;
      } catch (xhrError) {
        console.error(`[fetchImageAsBlob] XHR error:`, xhrError);
        return null;
      }
    }
  } catch (error) {
    console.error(`[fetchImageAsBlob] Error loading image: ${path}`, error);
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
