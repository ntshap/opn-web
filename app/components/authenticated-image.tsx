"use client"

import { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'
import { getAuthToken } from '@/lib/auth-utils'
import { formatImageUrl } from '@/lib/image-utils'
import { ProtectedImage } from '@/components/shared/ProtectedImage'

interface AuthenticatedImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined
  fallbackSrc?: string
  onLoadError?: (error: Error) => void
}

/**
 * A component that loads images with authentication
 * This component now uses the improved ProtectedImage component
 * which explicitly uses the GET method, not OPTIONS
 */
export function AuthenticatedImage({
  src,
  fallbackSrc = '/placeholder-news.svg',
  onLoadError,
  alt,
  ...props
}: AuthenticatedImageProps) {
  // Log the source for debugging
  useEffect(() => {
    if (src) {
      console.log(`[AuthenticatedImage] Rendering image with src: ${src}`);
    }
  }, [src]);

  // Use our improved ProtectedImage component
  return (
    <ProtectedImage
      filePath={src}
      alt={alt || 'Image'}
      fallbackSrc={fallbackSrc}
      loadingComponent={
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-pulse h-8 w-8 rounded-full bg-muted-foreground/20"></div>
        </div>
      }
      {...props}
    />
  );
}
