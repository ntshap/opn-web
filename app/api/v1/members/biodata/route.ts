/**
 * API route for member biodata
 * Handles POST and PUT requests for member biodata
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../_helpers/api-route-handler';

// POST /api/v1/members/biodata
export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] Processing POST request for member biodata');
    return await handleApiRoute(request, '/members/biodata', {
      timeout: 15000,
      requireAuth: true
    });
  } catch (error) {
    console.error('[API Route] Error in POST /members/biodata:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create biodata', message: 'There was an error connecting to the server' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/v1/members/biodata
export async function PUT(request: NextRequest) {
  try {
    console.log('[API Route] Processing PUT request for member biodata');
    return await handleApiRoute(request, '/members/biodata', {
      timeout: 15000,
      requireAuth: true
    });
  } catch (error) {
    console.error('[API Route] Error in PUT /members/biodata:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update biodata', message: 'There was an error connecting to the server' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
