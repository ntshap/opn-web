"use client";

import React, { useState, useEffect } from 'react';
import { fetchImageAsBlob } from '@/lib/image-utils';

interface SimpleImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  fallbackSrc?: string;
  style?: React.CSSProperties;
}

/**
 * A component that displays an image from the backend with proper authentication
 * This uses a blob URL with authentication headers
 */
export function SimpleImage({
  src,
  alt,
  width = 300,
  height = 300,
  className = '',
  fallbackSrc = '/placeholder-image.png',
  style = {}
}: SimpleImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      try {
        if (!src) {
          console.warn('[SimpleImage] No src provided');
          if (isMounted) setError(true);
          return;
        }

        // Reset error state when trying to load a new image
        if (isMounted) setError(false);

        console.log(`[SimpleImage] Loading image: ${src}`);

        // Log more details about the image URL
        if (src.includes('uploads')) {
          console.log(`[SimpleImage] Image URL contains 'uploads' path: ${src}`);
        }

        if (src.startsWith('http')) {
          console.log(`[SimpleImage] Image URL is absolute: ${src}`);
        } else {
          console.log(`[SimpleImage] Image URL is relative: ${src}`);
        }

        // Additional debugging for news detail page
        if (window.location.pathname.includes('/news/')) {
          console.log(`[SimpleImage] On news detail page, loading image: ${src}`);
          console.log(`[SimpleImage] Current pathname: ${window.location.pathname}`);
        }

        // Use our utility function to fetch the image with authentication
        objectUrl = await fetchImageAsBlob(src);

        if (!objectUrl) {
          console.error(`[SimpleImage] Failed to fetch image: ${src}`);
          throw new Error('Failed to fetch image');
        }

        console.log(`[SimpleImage] Successfully loaded image: ${src}, blob URL: ${objectUrl.substring(0, 30)}...`);

        if (isMounted) {
          setImageSrc(objectUrl);
          setLoading(false);
        }
      } catch (e) {
        console.error(`[SimpleImage] Error loading image from ${src}:`, e);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    // Reset states when src changes
    setLoading(true);
    setError(false);
    setImageSrc(null);

    // If we have a previous objectUrl, revoke it
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }

    // Load the new image
    loadImage();

    return () => {
      isMounted = false;
      // Clean up the blob URL when the component unmounts
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  // If there was an error, show the fallback
  if (error) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          position: 'relative',
          overflow: 'hidden',
          ...style
        }}
      >
        {fallbackSrc ? (
          <img
            src={fallbackSrc}
            alt={`Fallback for ${alt}`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <span>{alt}</span>
        )}
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          ...style
        }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  // Show the image
  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            console.error(`[SimpleImage] Error displaying image`);
            setError(true);
          }}
        />
      )}
    </div>
  );
}
