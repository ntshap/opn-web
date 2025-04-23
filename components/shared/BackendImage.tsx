"use client";

import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils';

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

interface BackendImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
}

/**
 * A component that displays an image from the backend with proper authentication
 * This uses the direct backend URL with authentication
 */
export function BackendImage({
  src,
  alt,
  width = 300,
  height = 300,
  className = '',
  fallbackSrc = '/placeholder-image.png'
}: BackendImageProps) {
  const [error, setError] = useState(false);
  const [fullUrl, setFullUrl] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);

  // Get the auth token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      const authToken = await getAuthToken();
      setToken(authToken);
    };

    fetchToken();
  }, []);

  // Construct the URL when src changes
  useEffect(() => {
    if (!src) return;

    // Get the backend URL from config
    const backendBaseUrl = API_CONFIG.BACKEND_URL.endsWith('/')
      ? API_CONFIG.BACKEND_URL.slice(0, -1)
      : API_CONFIG.BACKEND_URL;

    // Remove /api/v1 from the backend URL if present
    const baseUrlWithoutApiPath = backendBaseUrl.replace(/\/api\/v1$/, '');

    // Normalize the path
    let normalizedPath = src;

    // If it's a full URL, extract the path part
    if (normalizedPath.startsWith('http')) {
      try {
        const url = new URL(normalizedPath);
        normalizedPath = url.pathname;
      } catch (e) {
        console.error(`[BackendImage] Failed to parse URL: ${normalizedPath}`, e);
      }
    }

    // Ensure it starts with a slash
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }

    // If the path doesn't start with /uploads/ but contains 'uploads', fix it
    if (!normalizedPath.startsWith('/uploads/') && normalizedPath.includes('uploads')) {
      const uploadsPart = normalizedPath.split('uploads/');
      if (uploadsPart.length > 1) {
        normalizedPath = `/uploads/${uploadsPart[1]}`;
      }
    }

    // Construct the full URL directly to the backend
    const directUrl = `${baseUrlWithoutApiPath}${normalizedPath}`;

    // Verify the URL doesn't contain localhost
    if (directUrl.includes('localhost')) {
      console.error(`[BackendImage] Error: URL contains localhost: ${directUrl}`);
      setError(true);
      return;
    }

    console.log(`[BackendImage] Using direct backend URL: ${directUrl}`);
    setFullUrl(directUrl);

    // Log that we'll be using the API proxy for authentication
    console.log(`[BackendImage] Will use API proxy for authentication: /api/v1/direct-image?path=${encodeURIComponent(directUrl)}`);

  }, [src]);

  // Don't render anything if the src is invalid
  if (!src) {
    console.warn(`[BackendImage] Invalid src prop: ${src}`);
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className}`}
        style={{ width: width, height: height }}
      >
        <span>{alt}</span>
      </div>
    );
  }

  // If there was an error loading the image, show the fallback
  if (error) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className}`}
        style={{ width: width, height: height }}
      >
        <span>{alt}</span>
      </div>
    );
  }

  // If we don't have a full URL yet, show a loading state
  if (!fullUrl) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className}`}
        style={{ width: width, height: height }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  // Use our API proxy route to handle authentication properly
  // We need to use a proxy route that can add the Authorization header
  // since we can't add headers to <img> tags directly
  console.log(`[BackendImage] Using API proxy for authentication: ${fullUrl}`);
  return (
    <div className={className} style={{ width, height, position: 'relative', overflow: 'hidden' }}>
      {/* Add a fallback image that will show if the main image fails to load */}
      {fallbackSrc && (
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
            display: error ? 'block' : 'none'
          }}
        />
      )}

      {/* Use the raw-image API proxy route that will add the Authorization header server-side */}
      <img
        src={`/api/v1/raw-image?url=${encodeURIComponent(fullUrl)}`}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          display: error ? 'none' : 'block'
        }}
        crossOrigin="anonymous"
        onError={(e) => {
          console.error(`[BackendImage] Error loading image: ${fullUrl}`);
          // Log the error details
          console.error(`[BackendImage] Error details:`, e);
          setError(true);
        }}
      />
    </div>
  );
}
