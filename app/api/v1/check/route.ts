/**
 * Simple API route to check if the API is working
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { API_CONFIG } from '@/lib/config'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'API is working',
    config: {
      baseUrl: API_CONFIG.BASE_URL,
      backendUrl: API_CONFIG.BACKEND_URL,
    }
  })
}
