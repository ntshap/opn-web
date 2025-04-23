/**
 * Finance History API Route Handler
 * Handles fetching finance history data
 */
import type { NextRequest } from 'next/server'
import { handleApiRoute } from '../../_helpers/api-route-handler'

// GET /api/v1/finance/history
export async function GET(request: NextRequest) {
  return handleApiRoute(request, '/finance/history' + request.nextUrl.search, {
    timeout: 60000 // 60 seconds timeout for finance endpoints
  });
}
