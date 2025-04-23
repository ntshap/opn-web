import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API route to proxy image requests with authentication
 * This is a simplified version that just returns a text response to stop the infinite requests
 */
export async function GET(request: NextRequest) {
  // Return a simple text response to stop the infinite requests
  return new NextResponse('Image loading disabled to prevent infinite requests', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
