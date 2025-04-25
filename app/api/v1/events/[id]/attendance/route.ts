/**
 * API route for event attendance
 * Handles GET and POST requests for event attendance
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../../_helpers/api-route-handler';

// GET /api/v1/events/[id]/attendance
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`[API Route] GET /api/v1/events/${id}/attendance/ - Forwarding request to backend`);

    // Skip the event existence check and directly fetch attendance
    console.log(`[API Route] Proceeding to fetch attendance for event ID ${id}`);

    // Now try to get the attendance - make sure to add trailing slash to match backend API
    try {
      const attendanceResponse = await handleApiRoute(request, `/events/${id}/attendance/`, {
        requireAuth: true,
        timeout: 15000,
      });

      if (attendanceResponse.status === 404) {
        console.log(`[API Route] No attendance found for event ID ${id}, returning empty array`);
        // Return the actual 404 response to the client
        return attendanceResponse;
      }

      return attendanceResponse;
    } catch (attendanceError) {
      console.error(`[API Route] Error fetching attendance:`, attendanceError);
      // Return a proper error response
      return new Response(JSON.stringify({ error: 'Failed to fetch attendance', message: 'An error occurred while fetching attendance data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('[API Route] Error in GET /api/v1/events/[id]/attendance:', error);
    // Return a proper error response
    return new Response(JSON.stringify({ error: 'Failed to fetch attendance', message: 'An unexpected error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST /api/v1/events/[id]/attendance
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`[API Route] POST /api/v1/events/${id}/attendance/ - Forwarding request to backend`);

    // Try to create/update attendance - make sure to add trailing slash to match backend API
    const response = await handleApiRoute(request, `/events/${id}/attendance/`, {
      requireAuth: true,
      timeout: 20000,
    });

    return response;
  } catch (error) {
    console.error('[API Route] Error in POST /api/v1/events/[id]/attendance:', error);
    return new Response(JSON.stringify({ error: 'Failed to create/update attendance' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
