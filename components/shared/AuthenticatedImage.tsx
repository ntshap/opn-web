"use client";

import React, { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import { formatImageUrl } from '@/lib/image-utils';
import { getAuthToken } from '@/lib/auth-utils';
import { API_CONFIG } from '@/lib/config';

/**
 * Helper function to construct a proper URL with the backend domain and path
 * Ensures there are no double slashes between the domain and path
 */
function constructFullBackendUrl(backendUrl: string, path: string): string {
  // Remove trailing slash from backend URL if present
  const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;

  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Combine them to form the full URL
  return `${baseUrl}${normalizedPath}`;
}

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
}

/**
 * A component that displays an image from the backend
 * This approach uses next/image to handle image loading with direct backend URLs
 */
export function AuthenticatedImage({
  src,
  alt,
  width = 300,
  height = 300,
  className = '',
  fallbackSrc = '/placeholder-image.png'
}: AuthenticatedImageProps) {
  const [error, setError] = useState(false);
  const [directUrl, setDirectUrl] = useState<string>('');

  // Format the URL to use our API proxy for authentication
  useEffect(() => {
    if (!src) return;

    try {
      // Format the URL using our utility function
      const directUrl = formatImageUrl(src);

      // Verify the URL doesn't contain localhost
      if (directUrl.includes('localhost')) {
        console.error(`[AuthenticatedImage] Error: URL contains localhost: ${directUrl}`);
        setError(true);
        return;
      }

      // Use our raw-image API proxy route that will add the Authorization header server-side
      // The directUrl already contains the full backend URL, so we don't need to add it again
      const proxyUrl = `/api/v1/raw-image?url=${encodeURIComponent(directUrl)}`;

      console.log(`[AuthenticatedImage] Using raw-image API proxy URL: ${proxyUrl}`);
      setDirectUrl(proxyUrl);
    } catch (e) {
      console.error(`[AuthenticatedImage] Error formatting URL: ${src}`, e);
      setError(true);
    }
  }, [src]);

  // Don't render anything if the src is invalid or there was an error
  if (!src || error || !directUrl) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className}`}
        style={{ width: width, height: height }}
      >
        <span>{alt}</span>
      </div>
    );
  }

  // Use next/image with unoptimized to avoid the image optimization API
  return (
    <div className={className} style={{ width, height, position: 'relative' }}>
      <Image
        src={directUrl}
        alt={alt}
        fill
        className="object-cover"
        unoptimized={true}
        crossOrigin="anonymous"
        onError={() => {
          console.error(`[AuthenticatedImage] Error loading image: ${directUrl}`);
          setError(true);
        }}
      />
    </div>
  );
}
