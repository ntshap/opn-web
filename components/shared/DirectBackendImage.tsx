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

  // Don't render anything if the URL is invalid
  if (!url) {
    console.warn(`[DirectBackendImage] Invalid URL: ${url}`);
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className}`}
        style={{ width, height }}
      >
        <span>{alt}</span>
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

  // Use the image directly with the exact URL provided
  console.log(`[DirectBackendImage] Using exact URL: ${url}`);

  // State for the blob URL
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the image using apiClient to handle authentication
  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      try {
        setLoading(true);

        // Try two different approaches to fetch the image
        let response;
        let errorMessage = '';

        // First try: Use apiClient directly
        try {
          console.log(`[DirectBackendImage] Trying to fetch with apiClient: ${url}`);
          const apiResponse = await apiClient.get(url, {
            responseType: 'blob',
            timeout: 30000,
          });

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

          // Second try: Use fetch with authentication token
          try {
            // Get the auth token
            const token = getAuthToken();
            console.log(`[DirectBackendImage] Trying to fetch with fetch API: ${url}`);

            // Use fetch with authentication
            response = await fetch(url, {
              headers: {
                'Authorization': token ? `Bearer ${token}` : '',
              },
            });

            console.log(`[DirectBackendImage] Successfully fetched with fetch API`);
          } catch (fetchError) {
            console.error(`[DirectBackendImage] Error fetching with fetch API:`, fetchError);
            errorMessage += `fetch error: ${fetchError.message}\n`;

            // Third try: Use server-side proxy
            try {
              console.log(`[DirectBackendImage] Trying to fetch with server-side proxy`);
              const proxyUrl = `/api/v1/proxy-image?url=${encodeURIComponent(url)}`;
              console.log(`[DirectBackendImage] Proxy URL: ${proxyUrl}`);

              response = await fetch(proxyUrl);
              console.log(`[DirectBackendImage] Successfully fetched with server-side proxy`);
            } catch (proxyError) {
              console.error(`[DirectBackendImage] Error fetching with server-side proxy:`, proxyError);
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

      {/* Add a fallback image that will show if the main image fails to load */}
      {fallbackSrc && error && (
        <img
          src={fallbackSrc}
          alt={`Fallback for ${alt}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
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
            setError(true);
          }}
        />
      )}
    </div>
  );
}
