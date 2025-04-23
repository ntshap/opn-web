/**
 * API route for event photos
 * Handles GET and POST requests for event photos
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../../../_helpers/api-route-handler';

// GET /api/v1/uploads/events/[id]/photos
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing GET request for event ${id} photos from uploads endpoint`);

    // Since the backend might not have a direct GET endpoint for photos,
    // we'll try to get the event details first and extract the photos
    try {
      // First try to get the event details which might include photos
      const eventResponse = await handleApiRoute(request, `/events/${id}`, {
        timeout: 15000, // Increase timeout for event details
        requireAuth: true
      });

      // Check if the event response is valid
      if (eventResponse.ok) {
        const eventData = await eventResponse.json();

        // If the event has photos, return them
        if (eventData && eventData.photos && Array.isArray(eventData.photos)) {
          console.log(`Found ${eventData.photos.length} photos in event ${id} details`);
          return new Response(
            JSON.stringify(eventData.photos),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // If we couldn't get photos from the event details, try the direct uploads endpoint
      console.log(`Trying direct uploads endpoint for event ${id} photos`);
      const uploadsResponse = await handleApiRoute(request, `/uploads/events/${id}/photos`, {
        timeout: 15000, // Increase timeout for photos
        requireAuth: true
      });

      // Check if response is HTML (indicates wrong endpoint/404)
      const contentType = uploadsResponse.headers.get('content-type');
      if (contentType?.includes('text/html')) {
        console.error(`Received HTML response instead of JSON for event ${id} photos`);
        // Return an empty array instead of an error to prevent UI from breaking
        return new Response(
          JSON.stringify([]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // If the uploads response is not OK, return an empty array
      if (!uploadsResponse.ok) {
        console.log(`No photos found for event ${id} in uploads endpoint (${uploadsResponse.status})`);
        return new Response(
          JSON.stringify([]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Parse and return the uploads response
      const uploadsData = await uploadsResponse.json();
      const photosArray = Array.isArray(uploadsData) ? uploadsData :
                         (uploadsData.uploaded_files ? uploadsData.uploaded_files.map((url: string) => ({
                           id: Math.floor(Math.random() * 10000),
                           event_id: Number(id),
                           photo_url: url,
                           caption: '',
                           uploaded_at: new Date().toISOString()
                         })) : []);

      console.log(`Returning ${photosArray.length} photos for event ${id} from uploads endpoint`);
      return new Response(
        JSON.stringify(photosArray),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (apiError) {
      console.error(`API error fetching photos for event ${id}:`, apiError);
      // Return an empty array instead of an error to prevent UI from breaking
      return new Response(
        JSON.stringify([]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`Error in GET /uploads/events/${id}/photos:`, error);
    // Return an empty array instead of an error to prevent UI from breaking
    return new Response(
      JSON.stringify([]),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// POST /api/v1/uploads/events/[id]/photos
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing POST request for uploading photos to event ${id}`);

    // Forward the request to the backend API using the correct uploads endpoint
    const response = await handleApiRoute(request, `/uploads/events/${id}/photos`, {
      timeout: 30000, // Increase timeout for uploads
      requireAuth: true
    });

    // Check if response is HTML (indicates wrong endpoint/404)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      console.error(`Received HTML response instead of JSON for event ${id} photos upload`);
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
          error: errorData.error || 'Failed to upload event photos',
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
    console.error(`Error in POST /uploads/events/${id}/photos:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload event photos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
