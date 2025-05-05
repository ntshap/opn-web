/**
 * API route for individual meeting minutes
 * Handles GET, PUT, and DELETE requests for individual meeting minutes
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../_helpers/api-route-handler';
import { API_CONFIG } from '@/lib/config';

// GET /api/v1/meeting-minutes/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing GET request for meeting minutes ID: ${id}`);

    // Forward the request to the backend API
    return await handleApiRoute(request, `/meeting-minutes/${id}/`, {
      timeout: 15000, // Increase timeout for meeting minutes details
      requireAuth: true
    });
  } catch (error) {
    console.error(`Error in GET /meeting-minutes/${params.id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch meeting minutes details' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/v1/meeting-minutes/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing PUT request for meeting minutes ID: ${id}`);

    // Get the request body as text
    const requestBody = await request.text();
    console.log(`Request body for meeting minutes update:`, requestBody);

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Forward the request directly to the backend API using handleApiRoute
    // This will ensure we're using the same approach as other endpoints
    return await handleApiRoute(
      request,
      `/meeting-minutes/${id}`,
      {
        timeout: 15000,
        requireAuth: true,
        // Override the content type to ensure it's text/plain
        overrideContentType: 'text/plain'
      }
    );
  } catch (error) {
    console.error(`Error in PUT /meeting-minutes/${params.id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to update meeting minutes', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/v1/meeting-minutes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing DELETE request for meeting minutes ID: ${id}`);

    // Forward the request to the backend API without trailing slash
    return await handleApiRoute(request, `/meeting-minutes/${id}`, {
      timeout: 15000, // Increase timeout for meeting minutes deletion
      requireAuth: true
    });
  } catch (error) {
    console.error(`Error in DELETE /meeting-minutes/${params.id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete meeting minutes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
