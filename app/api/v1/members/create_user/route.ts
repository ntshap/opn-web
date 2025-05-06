/**
 * API route for creating a new user
 * Handles POST requests for creating a new user with username and password
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../_helpers/api-route-handler';

// POST /api/v1/members/create_user
export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] Processing POST request for creating a new user');
    
    // Forward the request to the backend API
    const response = await handleApiRoute(request, '/members/create_user', {
      timeout: 15000,
      requireAuth: true
    });
    
    console.log('[API Route] User creation response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Route] Error in POST /members/create_user:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create user', 
        message: 'There was an error connecting to the server',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
