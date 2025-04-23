/**
 * API route for events
 * Handles GET and POST requests for events
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { handleApiRoute } from '../_helpers/api-route-handler';

// GET /api/v1/events
export async function GET(request: NextRequest) {
  try {
    // Always get data from the backend
    // Use /events/ endpoint as per the backend implementation
    const response = await handleApiRoute(request, '/events/' + request.nextUrl.search, {
      timeout: 45000 // 45 seconds timeout for events endpoint
    });
    return response;
  } catch (error) {
    console.error('Error fetching events from backend:', error);
    // Return an empty array instead of mock data
    return NextResponse.json([], { status: 500 });
  }
}

// POST /api/v1/events
export async function POST(request: NextRequest) {
  try {
    return await handleApiRoute(request, '/events/', {
      timeout: 45000 // 45 seconds timeout for events endpoint
    });
  } catch (error) {
    console.error('Error posting event to backend:', error);
    // Return an error response instead of mock success
    return NextResponse.json({ success: false, message: 'Failed to create event' }, { status: 500 });
  }
}
