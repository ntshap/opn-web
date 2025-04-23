import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

/**
 * Debug endpoint to check what headers are being sent
 * GET /api/v1/debug-headers
 */
export async function GET(request: NextRequest) {
  try {
    // Get all headers from the request
    const headersList = headers();
    const allHeaders: Record<string, string> = {};
    
    headersList.forEach((value, key) => {
      // Mask sensitive headers like authorization
      if (key.toLowerCase() === 'authorization' && value) {
        const maskedValue = value.length > 15 
          ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}` 
          : '***';
        allHeaders[key] = maskedValue;
      } else {
        allHeaders[key] = value;
      }
    });

    // Get cookies
    const cookieStore = cookies();
    const allCookies: Record<string, string> = {};
    
    cookieStore.getAll().forEach(cookie => {
      // Mask sensitive cookies like auth tokens
      if ((cookie.name === 'token' || cookie.name === 'auth_token') && cookie.value) {
        const maskedValue = cookie.value.length > 15 
          ? `${cookie.value.substring(0, 10)}...${cookie.value.substring(cookie.value.length - 5)}` 
          : '***';
        allCookies[cookie.name] = maskedValue;
      } else {
        allCookies[cookie.name] = cookie.value;
      }
    });

    // Get the auth token we would use for backend requests
    let authToken = headersList.get('authorization');

    if (!authToken) {
      const tokenCookie = cookieStore.get('token') || cookieStore.get('auth_token');
      if (tokenCookie && tokenCookie.value) {
        authToken = tokenCookie.value.startsWith('Bearer ')
          ? tokenCookie.value
          : `Bearer ${tokenCookie.value}`;
      }
    }

    // Mask the auth token
    let maskedAuthToken = null;
    if (authToken) {
      maskedAuthToken = authToken.length > 15 
        ? `${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 5)}` 
        : '***';
    }

    // Return all the information
    return NextResponse.json({
      message: 'Debug Headers Information',
      headers: allHeaders,
      cookies: allCookies,
      authToken: maskedAuthToken,
      hasAuthToken: !!authToken,
    });
  } catch (error) {
    console.error('[Debug Headers] Error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
