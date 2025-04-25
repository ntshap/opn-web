"use client";

import React from 'react';

interface ProtectedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  filePath: string | null | undefined;
  alt: string;
  fallbackSrc?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * EMERGENCY FIX: Simplified image component to prevent infinite loops
 * This version just shows a placeholder div with the alt text
 */
export const ProtectedImage: React.FC<ProtectedImageProps> = ({
  filePath,
  alt,
  className,
  width,
  height,
  ...rest
}) => {
  // Just show a placeholder div with the alt text
  return (
    <div
      className={`flex items-center justify-center text-muted-foreground text-xs bg-secondary ${className || ''}`}
      style={{
        width,
        height,
        ...rest.style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        color: '#666',
        fontSize: '12px',
        textAlign: 'center',
        padding: '8px'
      }}
    >
      <span>{alt || 'Image temporarily unavailable'}</span>
    </div>
  );
};
