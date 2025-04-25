/**
 * News API Route Handler
 * Handles CRUD operations for news items
 */
import type { NextRequest } from 'next/server'
import { handleApiRoute } from '../_helpers/api-route-handler'

// GET /api/v1/news
export async function GET(request: NextRequest) {
  // Use trailing slash to match backend API format
  return handleApiRoute(request, '/news/' + request.nextUrl.search, {
    timeout: 30000, // Increase timeout for news requests
  });
}

// POST /api/v1/news
export async function POST(request: NextRequest) {
  return handleApiRoute(request, '/news/');
}