/**
 * Individual News Item API Route Handler
 * Handles operations for a specific news item by ID
 */
import type { NextRequest } from 'next/server'
import { handleApiRoute } from '../../_helpers/api-route-handler'

// GET /api/v1/news/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  return handleApiRoute(request, `/news/${id}/`);
}

// PUT /api/v1/news/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  return handleApiRoute(request, `/news/${id}/`);
}

// DELETE /api/v1/news/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  // Remove trailing slash to match backend API
  return handleApiRoute(request, `/news/${id}`);
}