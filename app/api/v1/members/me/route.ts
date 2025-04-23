/**
 * API route for current user's member profile
 * Handles GET request for the current user's member profile
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../_helpers/api-route-handler';

// GET /api/v1/members/me
export async function GET(request: NextRequest) {
  try {
    console.log('[API Route] Processing GET request for current user profile');
    
    // Forward the request to the backend API
    const response = await handleApiRoute(request, '/members/me', {
      timeout: 15000, // Increase timeout for fetching profile
      requireAuth: true
    });
    
    return response;
  } catch (error) {
    console.error('[API Route] Error in GET /members/me:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch profile', message: 'There was an error connecting to the server' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
