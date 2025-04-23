"use client"; // This needs state and effects, must be a Client Component

import React from 'react';
import { DirectBackendImage } from './DirectBackendImage';

interface ProtectedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  filePath: string | null | undefined;
  alt: string;
  fallbackSrc?: string; // Optional: default image if fetch fails
  loadingComponent?: React.ReactNode; // Optional: component while loading
}

/**
 * A component that displays a protected image from the backend
 * This is a wrapper around BackendImage that handles the file path normalization
 */
export const ProtectedImage: React.FC<ProtectedImageProps> = ({
  filePath,
  alt,
  fallbackSrc = '/placeholder-image.png',
  loadingComponent,
  className,
  width,
  height,
  ...rest // Pass other img props
}) => {
  // Don't render anything if the file path is invalid
  if (!filePath) {
    console.warn(`[ProtectedImage] Invalid filePath prop: ${filePath}`);
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className || ''}`}
        style={{ width, height, ...rest.style }}
      >
        {fallbackSrc ? (
          <img
            src={fallbackSrc}
            alt={alt}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span>{alt}</span>
        )}
      </div>
    );
  }

  // Use the exact URL format as specified
  let exactUrl = filePath;

  // If the URL doesn't start with http, construct it exactly as specified
  if (!exactUrl.startsWith('http')) {
    // Extract the path parts
    let path = exactUrl;
    if (path.startsWith('/')) {
      path = path.substring(1);
    }

    // Check if the path already contains 'uploads'
    if (!path.startsWith('uploads/')) {
      path = `uploads/${path}`;
    }

    // Construct the exact URL with double slash after domain as specified
    exactUrl = `https://backend-project-pemuda.onrender.com//${path}`;
  }

  console.log(`[ProtectedImage] Original path: ${filePath}`);
  console.log(`[ProtectedImage] Constructed URL: ${exactUrl}`);

  console.log(`[ProtectedImage] Using exact URL: ${exactUrl}`);

  // Simply use the DirectBackendImage component with the exact URL
  return (
    <DirectBackendImage
      url={exactUrl}
      alt={alt}
      width={width as number}
      height={height as number}
      className={className}
      fallbackSrc={fallbackSrc}
    />
  );
};
