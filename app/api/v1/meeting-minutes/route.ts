/**
 * API route for meeting minutes
 * Handles GET and POST requests for meeting minutes
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../_helpers/api-route-handler';

// GET /api/v1/meeting-minutes
export async function GET(request: NextRequest) {
  console.log('Processing GET request for meeting minutes');
  return handleApiRoute(request, '/meeting-minutes/' + request.nextUrl.search, {
    timeout: 15000, // Increase timeout for meeting minutes
    requireAuth: true
  });
}

// POST /api/v1/meeting-minutes
export async function POST(request: NextRequest) {
  console.log('Processing POST request for meeting minutes');
  return handleApiRoute(request, '/meeting-minutes/', {
    timeout: 15000, // Increase timeout for meeting minutes
    requireAuth: true
  });
}
