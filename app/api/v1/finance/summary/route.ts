/**
 * Finance Summary API Route Handler
 * Handles fetching finance summary data
 */
import type { NextRequest } from 'next/server'
import { handleApiRoute } from '../../_helpers/api-route-handler'

// GET /api/v1/finance/summary
export async function GET(request: NextRequest) {
  return handleApiRoute(request, '/finance/summary' + request.nextUrl.search, {
    timeout: 60000 // 60 seconds timeout for finance endpoints
  });
}
