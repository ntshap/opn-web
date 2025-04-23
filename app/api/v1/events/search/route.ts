/**
 * API route for searching events
 * Forwards the request to the backend API
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../_helpers/api-route-handler';

// GET /api/v1/events/search
export async function GET(request: NextRequest) {
  return handleApiRoute(request, '/events/search' + request.nextUrl.search);
}
