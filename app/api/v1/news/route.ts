/**
 * News API Route Handler
 * Handles CRUD operations for news items
 */
import type { NextRequest } from 'next/server'
import { handleApiRoute } from '../_helpers/api-route-handler'

// GET /api/v1/news
export async function GET(request: NextRequest) {
  return handleApiRoute(request, '/news/' + request.nextUrl.search);
}

// POST /api/v1/news
export async function POST(request: NextRequest) {
  return handleApiRoute(request, '/news/');
}