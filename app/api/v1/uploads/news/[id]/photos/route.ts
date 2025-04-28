/**
 * API route for uploading news photos
 * Handles POST requests for uploading news photos
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../../../_helpers/api-route-handler';

// POST /api/v1/uploads/news/[id]/photos
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing POST request for uploading photos to news ${id}`);

    // Forward the request to the backend API using the correct uploads endpoint
    // The backend expects the URL to be /uploads/news/{id}/photos (without trailing slash)
    console.log(`[API Route] Forwarding to backend endpoint: /uploads/news/${id}/photos`);
    const response = await handleApiRoute(request, `/uploads/news/${id}/photos`, {
      timeout: 30000, // Increase timeout for uploads
      requireAuth: true
    });

    // Check if response is HTML (indicates wrong endpoint/404)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      console.error(`Received HTML response instead of JSON for news ${id} photos upload`);
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
          error: errorData.error || 'Failed to upload news photos',
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
    console.error(`Error in POST /uploads/news/${id}/photos:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload news photos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
