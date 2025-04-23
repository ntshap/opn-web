"use client";

import React, { useState } from 'react';
import { API_CONFIG } from '@/lib/config';

interface BackendProxyProps {
  path: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
}

/**
 * A component that displays an image directly from the backend
 * without any URL manipulation or proxying
 */
export function BackendProxy({
  path,
  alt,
  width = 300,
  height = 300,
  className = '',
  fallbackSrc = '/placeholder-image.png'
}: BackendProxyProps) {
  const [error, setError] = useState(false);

  // Don't render anything if the path is invalid
  if (!path) {
    console.warn(`[BackendProxy] Invalid path: ${path}`);
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className}`}
        style={{ width, height }}
      >
        <span>{alt}</span>
      </div>
    );
  }

  // Normalize the path
  let normalizedPath = path;
  
  // If it's a full URL, extract just the path
  if (normalizedPath.startsWith('http')) {
    try {
      const url = new URL(normalizedPath);
      normalizedPath = url.pathname;
    } catch (e) {
      console.error(`[BackendProxy] Failed to parse URL: ${normalizedPath}`, e);
    }
  }
  
  // Ensure path starts with a slash
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }

  // Construct the full URL to the backend
  const backendUrl = API_CONFIG.BACKEND_URL.endsWith('/')
    ? API_CONFIG.BACKEND_URL.slice(0, -1)
    : API_CONFIG.BACKEND_URL;

  // Construct the full URL
  const fullUrl = `${backendUrl}${normalizedPath}`;

  console.log(`[BackendProxy] Using direct backend URL: ${fullUrl}`);

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

  // Use the image directly with the backend URL
  return (
    <div className={className} style={{ width, height, position: 'relative', overflow: 'hidden' }}>
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
      
      {/* Use the image directly from the backend */}
      <img
        src={fullUrl}
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
          console.error(`[BackendProxy] Error loading image: ${fullUrl}`);
          console.error(`[BackendProxy] Original path: ${path}`);
          setError(true);
        }}
      />
    </div>
  );
}
