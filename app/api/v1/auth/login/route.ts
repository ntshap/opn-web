/**
 * API route for authentication login
 * Handles login requests and forwards them to the backend
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { API_CONFIG } from '@/lib/config'

// Helper function to get backend URL
function getBackendUrl() {
  const backendUrl = API_CONFIG.BACKEND_URL
  return backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl
}

// Add CORS headers to response
function addCorsHeaders(response: Response | NextResponse) {
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE,PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')
  return response
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  console.log('Handling OPTIONS request for auth login endpoint')
  
  // Create a new response with 200 status
  const response = new NextResponse(null, {
    status: 200,
  })
  
  // Add CORS headers
  return addCorsHeaders(response)
}

// POST /api/v1/auth/login
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.text()
    
    // Log the request (without sensitive data)
    console.log('Auth login request received')
    
    // Get backend URL
    const backendUrl = getBackendUrl()
    const fullUrl = `${backendUrl}/api/v1/auth/login`
    
    console.log(`Forwarding auth login request to: ${fullUrl}`)
    
    // Forward request to backend API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    // Get the response data
    const data = await response.json()
    
    // Return the response with CORS headers
    const nextResponse = NextResponse.json(data, { status: response.status })
    return addCorsHeaders(nextResponse)
  } catch (error) {
    console.error('Error in auth login route:', error)
    
    // Return appropriate error response with CORS headers
    const errorResponse = new Response(
      JSON.stringify({ 
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
    return addCorsHeaders(errorResponse)
  }
}
