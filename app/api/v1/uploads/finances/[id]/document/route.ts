/**
 * API route for finance documents
 * Handles POST, PUT, and DELETE requests for finance documents
 *
 * Endpoints:
 * - PUT /api/v1/uploads/finances/{finance_id}/document - Upload or update a document
 * - DELETE /api/v1/uploads/finances/{finance_id}/document - Delete a document
 *
 * Note: We use PUT for both new uploads and updates as per backend requirements
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../../../_helpers/api-route-handler';

// POST /api/v1/uploads/finances/[id]/document
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing POST request for uploading document to finance ${id}`);

    // Forward the request to the backend API using the correct uploads endpoint
    // Note: The endpoint should start with /uploads/ to trigger the special URL handling in handleApiRoute
    const response = await handleApiRoute(request, `/uploads/finances/${id}/document`, {
      timeout: 30000, // Increase timeout for uploads
      requireAuth: true
    });

    // Check if response is HTML (indicates wrong endpoint/404)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      console.error(`Received HTML response instead of JSON for finance ${id} document upload`);
      return new Response(
        JSON.stringify({
          error: 'Invalid API endpoint or server error'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error: errorData.error || 'Failed to upload finance document',
          status: response.status
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return response;
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`Error in POST /uploads/finances/${id}/document:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload finance document' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/v1/uploads/finances/[id]/document
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing PUT request for updating document for finance ${id}`);

    // Forward the request to the backend API using the correct uploads endpoint
    // Note: The endpoint should start with /uploads/ to trigger the special URL handling in handleApiRoute
    const response = await handleApiRoute(request, `/uploads/finances/${id}/document`, {
      timeout: 30000, // Increase timeout for uploads
      requireAuth: true
    });

    // Check if response is HTML (indicates wrong endpoint/404)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      console.error(`Received HTML response instead of JSON for finance ${id} document update`);
      return new Response(
        JSON.stringify({
          error: 'Invalid API endpoint or server error'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error: errorData.error || 'Failed to update finance document',
          status: response.status
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return response;
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`Error in PUT /uploads/finances/${id}/document:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to update finance document' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/v1/uploads/finances/[id]/document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing DELETE request for document of finance ${id}`);

    // Forward the request to the backend API using the correct uploads endpoint
    // Note: The endpoint should start with /uploads/ to trigger the special URL handling in handleApiRoute
    const response = await handleApiRoute(request, `/uploads/finances/${id}/document`, {
      timeout: 15000, // Increase timeout for deletes
      requireAuth: true
    });

    // Check if response is HTML (indicates wrong endpoint/404)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      console.error(`Received HTML response instead of JSON for finance ${id} document delete`);
      return new Response(
        JSON.stringify({
          error: 'Invalid API endpoint or server error'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error: errorData.error || 'Failed to delete finance document',
          status: response.status
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return response;
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`Error in DELETE /uploads/finances/${id}/document:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete finance document' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
