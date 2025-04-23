/**
 * API route for finance
 * Handles POST requests for creating finance records
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../_helpers/api-route-handler';

// POST /api/v1/finance
export async function POST(request: NextRequest) {
  return handleApiRoute(request, '/finance');
}
