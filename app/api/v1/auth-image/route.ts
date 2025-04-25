import { NextRequest, NextResponse } from 'next/server';

/**
 * EMERGENCY FIX: This route is completely disabled to prevent infinite loops
 * Instead of proxying images, we'll return a simple SVG placeholder
 */
export async function GET(request: NextRequest) {
  // Return a simple SVG placeholder
  const svgPlaceholder = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#f0f0f0"/>
    <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#666" text-anchor="middle">Image unavailable</text>
  </svg>`;

  return new NextResponse(svgPlaceholder, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
