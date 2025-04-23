import { NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/config'

/**
 * Health check endpoint to verify if the backend is online
 * GET /api/v1/health
 *
 * Note: The backend doesn't have a /health endpoint, so we use /auth/token instead
 * to check if the backend is responding.
 */
export async function GET() {
  try {
    // Use the /auth/token endpoint which we know exists
    // We're just checking if the server responds, not trying to authenticate
    const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/v1/auth/token`, {
      method: 'HEAD', // Use HEAD request to avoid downloading the full response
      // No timeout to avoid Edge Runtime issues
    });

    // If we get any response (even 401 Unauthorized), the backend is online
    // We just want to know if the server is responding
    if (response.status < 500) {
      return NextResponse.json({
        status: 'ok',
        message: 'Backend is online',
        timestamp: new Date().toISOString(),
        response_code: response.status
      }, { status: 200 })
    }

    // If we get a 5xx response, the backend is having issues
    return NextResponse.json({
      status: 'error',
      message: 'Backend returned server error',
      code: response.status,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  } catch (error) {
    console.error('[Health] Backend health check failed:', error)

    // If we get an error, the backend is offline
    return NextResponse.json({
      status: 'error',
      message: 'Backend is offline or unreachable',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}
