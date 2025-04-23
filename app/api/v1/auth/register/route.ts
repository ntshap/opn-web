/**
 * API route for user registration
 * Forwards the request to the backend API
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../_helpers/api-route-handler';

// POST /api/v1/auth/register
export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] Processing POST request for user registration');

    // Forward the request to the backend API
    const response = await handleApiRoute(request, '/auth/register', {
      requireAuth: false,
      timeout: 15000 // Increase timeout for registration
    });

    console.log('[API Route] Registration response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Route] Error in POST /auth/register:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to register user', message: 'There was an error connecting to the server' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
