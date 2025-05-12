"use client";

import React, { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/auth-utils';
import { formatImageUrl } from '@/lib/image-utils';

interface ProtectedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  filePath: string | null | undefined;
  alt: string;
  fallbackSrc?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * A component that displays a protected image from the backend
 * This version uses fetch with authentication headers to load images
 * and explicitly uses the GET method, not OPTIONS
 */
export const ProtectedImage: React.FC<ProtectedImageProps> = ({
  filePath,
  alt,
  className,
  width,
  height,
  fallbackSrc = '/placeholder-news.svg',
  loadingComponent,
  ...rest
}) => {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset state when filePath changes
    setIsError(false);
    setIsLoading(true);

    // Don't do anything if the file path is invalid
    if (!filePath || filePath === 'string') {
      console.warn(`[ProtectedImage] Invalid filePath prop: ${filePath}`);
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // Format the image URL using our utility function
    const formattedUrl = formatImageUrl(filePath);
    if (!formattedUrl) {
      console.warn(`[ProtectedImage] Could not format URL: ${filePath}`);
      setIsError(true);
      setIsLoading(false);
      return;
    }

    console.log(`[ProtectedImage] Formatted URL: ${formattedUrl}`);

    // Get the auth token
    const token = getAuthToken();
    if (!token) {
      console.warn('[ProtectedImage] No auth token available');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // Add a cache-busting parameter to ensure we get fresh images
    const cacheBuster = Date.now();

    // Use our improved image-proxy endpoint that ensures GET method with Bearer token
    // This avoids the OPTIONS preflight request and ensures proper authentication
    const proxyUrl = `/api/v1/image-proxy?url=${encodeURIComponent(formattedUrl)}&token=${encodeURIComponent(token)}&_=${cacheBuster}`;
    console.log(`[ProtectedImage] Using improved image-proxy URL with cache buster: ${proxyUrl}`);

    // Create a new AbortController for this request
    const controller = new AbortController();
    const { signal } = controller;

    // Use fetch with priority to load the image faster
    fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
        'Cache-Control': 'no-cache',
        'Priority': 'high'
      },
      cache: 'no-store',
      signal,
      priority: 'high'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status} ${response.statusText}`);
      }
      return response.blob();
    })
    .then(blob => {
      const objectUrl = URL.createObjectURL(blob);
      setImageSrc(objectUrl);
      setIsLoading(false);
      console.log(`[ProtectedImage] Image loaded successfully via fetch: ${formattedUrl}`);
    })
    .catch(error => {
      console.error(`[ProtectedImage] Error loading image via fetch: ${formattedUrl}`, error);

      // Fallback to Image element approach if fetch fails
      console.log(`[ProtectedImage] Falling back to Image element approach`);

      const img = new Image();

      img.onload = () => {
        console.log(`[ProtectedImage] Image loaded successfully via Image element: ${formattedUrl}`);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);

        // Convert to blob and create object URL
        canvas.toBlob((blob) => {
          if (blob) {
            const objectUrl = URL.createObjectURL(blob);
            setImageSrc(objectUrl);
            setIsLoading(false);
          } else {
            console.error(`[ProtectedImage] Failed to create blob from image`);
            setIsError(true);
            setIsLoading(false);
          }
        });
      };

      img.onerror = () => {
        console.error(`[ProtectedImage] Image element approach also failed for: ${formattedUrl}`);
        setIsError(true);
        setIsLoading(false);
      };

      // Add a different cache buster for the retry
      const retryUrl = `/api/v1/image-proxy?url=${encodeURIComponent(formattedUrl)}&token=${encodeURIComponent(token)}&_=${cacheBuster + 1}`;
      img.src = retryUrl;
    });

    // Clean up function
    return () => {
      controller.abort();
    };
  }, [filePath, fallbackSrc]);

  // If there's an error or we're still loading, show a placeholder
  if (isError) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className || ''}`}
        style={{
          width,
          height,
          ...rest.style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          color: '#666',
          fontSize: '12px',
          textAlign: 'center',
          padding: '8px'
        }}
      >
        <span>{alt || 'Image unavailable'}</span>
      </div>
    );
  }

  // Show loading component if we're still loading
  if (isLoading && loadingComponent) {
    return (
      <div className={className} style={{ width, height, position: 'relative', overflow: 'hidden' }}>
        {loadingComponent}
      </div>
    );
  }

  // Render the image with the blob URL
  return (
    <div className={className} style={{ width, height, position: 'relative', overflow: 'hidden' }}>
      <img
        src={imageSrc}
        alt={alt}
        width={width as number}
        height={height as number}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        onError={(e) => {
          console.error(`[ProtectedImage] Error displaying image:`, e);
          setIsError(true);
        }}
        {...rest}
      />
    </div>
  );
};
