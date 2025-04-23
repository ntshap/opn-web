/**
 * API route for updating a specific member's attendance
 * Handles PUT requests for a specific member's attendance
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../../../_helpers/api-route-handler';

// PUT /api/v1/events/[id]/attendance/[member_id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; member_id: string } }
) {
  // Extract the IDs from params - use Promise.resolve to handle async params
  const { id, member_id: memberId } = await Promise.resolve(params);
  return handleApiRoute(request, `/events/${id}/attendance/${memberId}/`);
}
