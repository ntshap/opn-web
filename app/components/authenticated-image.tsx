"use client"

import { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'
import { getAuthToken } from '@/lib/auth-utils'
import { formatImageUrl } from '@/lib/image-utils'

interface AuthenticatedImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined
  fallbackSrc?: string
  onLoadError?: (error: Error) => void
}

/**
 * A component that loads images with authentication
 * This component handles authentication and error states for images
 */
export function AuthenticatedImage({
  src,
  fallbackSrc = '/placeholder-news.svg',
  onLoadError,
  alt,
  ...props
}: AuthenticatedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc)
  const [error, setError] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Reset state when src changes
    setError(false)
    setLoading(true)

    if (!src) {
      setImageSrc(fallbackSrc)
      setLoading(false)
      return
    }

    // Format the image URL
    const formattedUrl = formatImageUrl(src)
    console.log(`[AuthenticatedImage] Formatted URL: ${formattedUrl}`)

    // Get the auth token
    const token = getAuthToken()
    if (!token) {
      console.warn('[AuthenticatedImage] No auth token available')
      setError(true)
      setLoading(false)
      setImageSrc(fallbackSrc)
      if (onLoadError) {
        onLoadError(new Error('No authentication token available'))
      }
      return
    }

    // Create a new AbortController for this request
    const controller = new AbortController()
    const { signal } = controller

    // Fetch the image with authentication
    fetch(formattedUrl, {
      headers: {
        Authorization: token,
        Accept: 'image/*',
      },
      signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status} ${response.statusText}`)
        }
        return response.blob()
      })
      .then((blob) => {
        // Create an object URL from the blob
        const objectUrl = URL.createObjectURL(blob)
        setImageSrc(objectUrl)
        setLoading(false)
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          console.log('[AuthenticatedImage] Fetch aborted')
          return
        }
        console.error(`[AuthenticatedImage] Error loading image: ${error.message}`)
        setError(true)
        setLoading(false)
        setImageSrc(fallbackSrc)
        if (onLoadError) {
          onLoadError(error)
        }
      })

    // Clean up function
    return () => {
      controller.abort()
    }
  }, [src, fallbackSrc, onLoadError])

  return (
    <>
      <Image
        src={imageSrc}
        alt={alt || 'Image'}
        {...props}
        className={`${props.className || ''} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        unoptimized={true} // Skip Next.js image optimization to ensure headers are preserved
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-pulse h-8 w-8 rounded-full bg-muted-foreground/20"></div>
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <p className="text-muted-foreground text-sm">Failed to load image</p>
        </div>
      )}
    </>
  )
}
