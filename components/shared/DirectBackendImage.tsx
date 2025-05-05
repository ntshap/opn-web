"use client";

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { getAuthToken } from '@/lib/auth-utils';

interface DirectBackendImageProps {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
}

/**
 * A component that displays an image directly from the backend URL
 * without any URL manipulation whatsoever
 */
export function DirectBackendImage({
  url,
  alt,
  width = 300,
  height = 300,
  className = '',
  fallbackSrc = '/placeholder-image.png'
}: DirectBackendImageProps) {
  const [error, setError] = useState(false);

  // Don't render anything if the URL is invalid or is the literal "string"
  if (!url || url.includes('/uploads/string') || url === 'string') {
    console.warn(`[DirectBackendImage] Invalid URL: ${url}`);
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className}`}
        style={{ width, height }}
      >
        {fallbackSrc ? (
          <img
            src={fallbackSrc}
            alt={`Fallback for ${alt}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span>{alt}</span>
        )}
      </div>
    );
  }

  // Check if the URL contains localhost
  if (url.includes('localhost')) {
    console.error(`[DirectBackendImage] URL contains localhost: ${url}`);
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className}`}
        style={{ width, height }}
      >
        {fallbackSrc && (
          <img
            src={fallbackSrc}
            alt={`Fallback for ${alt}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>
    );
  }

  // If there was an error loading the image, show the fallback
  if (error) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className}`}
        style={{ width, height }}
      >
        {fallbackSrc && (
          <img
            src={fallbackSrc}
            alt={`Fallback for ${alt}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>
    );
  }

  // Do NOT fix double slashes in URL as the backend requires them
  // The backend expects URLs like https://beopn.mysesa.site//uploads/...
  console.log(`[DirectBackendImage] Using URL: ${url}`);

  // Keep the original URL as is
  // url = url;

  // State for the blob URL
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the image using apiClient to handle authentication
  useEffect(() => {
    let isMounted = true;

    // Check if the URL is a placeholder or local image
    if (url.includes('placeholder') || url.startsWith('/') && !url.startsWith('/api/')) {
      console.log(`[DirectBackendImage] Using local image: ${url}`);
      // For local images, just create a blob URL directly
      if (isMounted) {
        setBlobUrl(url);
        setLoading(false);
      }
      return;
    }

    const fetchImage = async () => {
      try {
        setLoading(true);

        // Get the auth token first - we'll need it for all approaches
        const token = getAuthToken();
        if (!token) {
          console.error('[DirectBackendImage] No authentication token available');
          throw new Error('Authentication required. Please log in again.');
        }

        // Make sure token has Bearer prefix
        const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        console.log(`[DirectBackendImage] Using auth token: ${authHeader.substring(0, 15)}...`);

        // Try different approaches to fetch the image
        let response;
        let errorMessage = '';

        // First try: Use fetch with authentication token directly
        try {
          console.log(`[DirectBackendImage] Trying to fetch with fetch API: ${url}`);

          // Use fetch with authentication
          console.log(`[DirectBackendImage] Fetch headers:`, {
            'Authorization': `${authHeader.substring(0, 10)}...`,
            'Accept': 'image/*',
          });

          response = await fetch(url, {
            method: 'GET', // Explicitly use GET method, not OPTIONS
            headers: {
              'Authorization': authHeader,
              'Accept': 'image/*',
            },
            mode: 'cors', // Explicitly set CORS mode
            credentials: 'same-origin' // Only include credentials for same-origin requests
          });

          console.log(`[DirectBackendImage] Fetch response status: ${response.status} ${response.statusText}`);
          console.log(`[DirectBackendImage] Response headers:`, Object.fromEntries([...response.headers.entries()]));

          // If the response is not ok, throw an error to try the next approach
          if (!response.ok) {
            // Try to get more information about the error
            let errorText = '';
            try {
              // Try to parse the response as text
              errorText = await response.text();
              console.error(`[DirectBackendImage] Error response body:`, errorText);
            } catch (textError) {
              console.error(`[DirectBackendImage] Could not read error response body:`, textError);
            }

            throw new Error(`Fetch failed with status ${response.status}: ${errorText}`);
          }

          console.log(`[DirectBackendImage] Successfully fetched with fetch API`);
        } catch (fetchError) {
          console.error(`[DirectBackendImage] Error fetching with fetch API:`, fetchError);
          errorMessage += `fetch error: ${fetchError.message}\n`;

          // Second try: Use apiClient
          try {
            console.log(`[DirectBackendImage] Trying to fetch with apiClient: ${url}`);
            console.log(`[DirectBackendImage] apiClient headers:`, {
              'Authorization': `${authHeader.substring(0, 10)}...`,
              'Accept': 'image/*',
            });

            const apiResponse = await apiClient.get(url, {
              method: 'GET', // Explicitly use GET method
              responseType: 'blob',
              timeout: 30000,
              headers: {
                'Authorization': authHeader,
                'Accept': 'image/*',
              }
            });

            console.log(`[DirectBackendImage] apiClient response status:`, apiResponse.status);
            console.log(`[DirectBackendImage] apiClient response headers:`, apiResponse.headers);

            // Create a Response object from the apiClient response
            response = new Response(apiResponse.data, {
              status: 200,
              statusText: 'OK',
              headers: {
                'Content-Type': apiResponse.headers['content-type'] || 'image/jpeg',
              },
            });

            console.log(`[DirectBackendImage] Successfully fetched with apiClient`);
          } catch (apiError) {
            console.error(`[DirectBackendImage] Error fetching with apiClient:`, apiError);
            errorMessage += `apiClient error: ${apiError.message}\n`;

            // Third try: Use raw-image API endpoint
            try {
              console.log(`[DirectBackendImage] Trying to fetch with raw-image API endpoint`);
              const proxyUrl = `/api/v1/raw-image?url=${encodeURIComponent(url)}`;
              console.log(`[DirectBackendImage] Proxy URL: ${proxyUrl}`);

              // Use the raw-image API endpoint without additional headers
              // The server-side API will handle adding the authorization header
              response = await fetch(proxyUrl);

              console.log(`[DirectBackendImage] raw-image response status: ${response.status} ${response.statusText}`);
              console.log(`[DirectBackendImage] raw-image response headers:`, Object.fromEntries([...response.headers.entries()]));

              if (!response.ok) {
                throw new Error(`Raw-image API failed with status ${response.status}`);
              }

              console.log(`[DirectBackendImage] Successfully fetched with raw-image API endpoint`);
            } catch (proxyError) {
              console.error(`[DirectBackendImage] Error fetching with raw-image API endpoint:`, proxyError);
              errorMessage += `proxy error: ${proxyError.message}`;
              throw new Error(`Failed to fetch image: ${errorMessage}`);
            }
          }
        }

        console.log(`[DirectBackendImage] Fetch response status: ${response.status} ${response.statusText}`);

        // Log detailed information about the response
        console.log(`[DirectBackendImage] Response headers:`, Object.fromEntries([...response.headers.entries()]));

        if (!response.ok) {
          // Try to get more information about the error
          let errorText = '';
          try {
            // Try to parse the response as text
            errorText = await response.text();
            console.error(`[DirectBackendImage] Error response body:`, errorText);
          } catch (textError) {
            console.error(`[DirectBackendImage] Could not read error response body:`, textError);
          }

          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}\nDetails: ${errorText}`);
        }

        const blob = await response.blob();

        if (isMounted) {
          const objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error(`[DirectBackendImage] Error fetching image: ${url}`, err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      // Clean up blob URL when component unmounts
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [url]);

  return (
    <div className={className} style={{ width, height, position: 'relative', overflow: 'hidden' }}>
      {/* Show loading state */}
      {loading && (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
        }}>
          <span>Loading...</span>
        </div>
      )}

      {/* Show error message if there's an error */}
      {error && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#666',
            fontSize: '12px',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {alt || 'Image unavailable'}
        </div>
      )}

      {/* Use the blob URL for the image */}
      {!loading && !error && blobUrl && (
        <img
          src={blobUrl}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          onError={(e) => {
            console.error(`[DirectBackendImage] Error displaying image: ${url}`);
            // Don't call setError here as it can cause React rendering issues
            // Instead, show a simple error message
            setError(true);
            // Do NOT set fallback src here as it can cause infinite loops
          }}
        />
      )}
    </div>
  );
}
