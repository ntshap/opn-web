"use client";

import React, { useState } from 'react';
import { getAuthToken } from '@/lib/auth-utils';

interface DirectImageProps {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
}

/**
 * A component that displays an image directly from the backend URL
 * without any URL manipulation
 */
export function DirectImage({
  url,
  alt,
  width = 300,
  height = 300,
  className = '',
  fallbackSrc = '/placeholder-image.png'
}: DirectImageProps) {
  const [error, setError] = useState(false);

  // Don't render anything if the URL is invalid
  if (!url) {
    console.warn(`[DirectImage] Invalid URL: ${url}`);
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className}`}
        style={{ width, height }}
      >
        <span>{alt}</span>
      </div>
    );
  }

  // If there was an error loading the image, show an error message
  if (error) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className}`}
        style={{ width, height }}
      >
        <span>{alt}</span>
      </div>
    );
  }

  // Use the image directly with the URL
  console.log(`[DirectImage] Using direct URL: ${url}`);
  return (
    <div className={className} style={{ width, height, position: 'relative', overflow: 'hidden' }}>
      {/* No fallback image */}

      {/* Use the improved image-proxy API endpoint */}
      <img
        src={`/api/v1/image-proxy?url=${encodeURIComponent(url)}&token=${encodeURIComponent(getAuthToken() || '')}`}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        crossOrigin="anonymous"
        onError={(e) => {
          console.error(`[DirectImage] Error loading image: ${url}`);
          console.error(`[DirectImage] Error details:`, e);
          console.error(`[DirectImage] API URL: /api/v1/image-proxy?url=${encodeURIComponent(url)}`);
          setError(true);
        }}
      />
    </div>
  );
}
