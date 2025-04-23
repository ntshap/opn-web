import { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string
  className?: string
  containerClassName?: string
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  className,
  containerClassName,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setImgSrc(typeof src === 'string' ? src : fallbackSrc)
    setIsLoading(true)
    setError(false)
  }, [src, fallbackSrc])

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <Image
        {...props}
        src={imgSrc || fallbackSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          error ? 'grayscale' : '',
          className
        )}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setError(true)
          setImgSrc(fallbackSrc)
          setIsLoading(false)
        }}
        loading="lazy"
        quality={80}
      />
    </div>
  )
}
