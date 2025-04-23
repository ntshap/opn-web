/**
 * API route for a specific finance record
 * Handles GET, PUT, and DELETE requests for a specific finance record
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../_helpers/api-route-handler';

// GET /api/v1/finance/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  return handleApiRoute(request, `/finance/${id}`);
}

// PUT /api/v1/finance/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  return handleApiRoute(request, `/finance/${id}`);
}

// DELETE /api/v1/finance/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  return handleApiRoute(request, `/finance/${id}`);
}
