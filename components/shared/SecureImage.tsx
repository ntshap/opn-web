"use client";

import React from 'react';
import { SimpleImage } from './SimpleImage';

interface SecureImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  fallbackSrc?: string;
  style?: React.CSSProperties;
}

/**
 * A wrapper around SimpleImage that handles image display
 */
export function SecureImage({
  src,
  alt,
  width = 300,
  height = 300,
  className = '',
  fallbackSrc = '/placeholder-image.png',
  style = {}
}: SecureImageProps) {
  return (
    <SimpleImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      fallbackSrc={fallbackSrc}
      style={style}
    />
  );
}
