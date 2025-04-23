/**
 * API route for proxying protected file requests
 * This route forwards requests to the backend and returns the file data
 */
import { NextRequest } from 'next/server';
import { getAuthToken } from '@/lib/auth-utils';
import { API_CONFIG } from '@/lib/config';

// GET /api/v1/uploads/[...path]
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the file path from the params
    const filePath = params.path.join('/');

    // Remove any query parameters from the file path
    const cleanFilePath = filePath.split('?')[0];

    console.log(`[API Route] Processing GET request for file: ${cleanFilePath}`);

    // Get the auth token
    let token = getAuthToken();
    if (!token) {
      console.error('[API Route] No auth token found for file request');
      return new Response('Unauthorized', { status: 401 });
    }

    // Log token details for debugging
    console.log('[API Route] Token found:', token.substring(0, 20) + '...');

    // Check if token is in the correct format (Bearer token)
    if (!token.startsWith('Bearer ')) {
      console.error('[API Route] Token is not in the correct format (should start with "Bearer ")');
      console.log('[API Route] Attempting to fix token format...');
      token = `Bearer ${token}`;
      console.log('[API Route] Fixed token:', token.substring(0, 20) + '...');
    }

    // Try to decode the token to check expiration
    try {
      const tokenParts = token.split(' ');
      if (tokenParts.length > 1) {
        const tokenValue = tokenParts[1];
        // Simple check for JWT format (3 parts separated by dots)
        if (tokenValue.split('.').length === 3) {
          // Try to decode the payload (middle part)
          const payload = tokenValue.split('.')[1];
          const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
          console.log('[API Route] Token payload:', decodedPayload);

          // Check expiration
          if (decodedPayload.exp) {
            const expirationDate = new Date(decodedPayload.exp * 1000);
            const now = new Date();
            console.log('[API Route] Token expires at:', expirationDate.toISOString());
            console.log('[API Route] Current time:', now.toISOString());
            console.log('[API Route] Token is', expirationDate > now ? 'valid' : 'expired');
          }
        }
      }
    } catch (decodeError) {
      console.error('[API Route] Error decoding token:', decodeError);
    }

    // Test if the token is valid by making a simple API request
    try {
      console.log('[API Route] Testing token validity with a simple API request...');
      const backendBaseUrl = API_CONFIG.BACKEND_URL.endsWith('/')
        ? API_CONFIG.BACKEND_URL.slice(0, -1)
        : API_CONFIG.BACKEND_URL;

      const testResponse = await fetch(`${backendBaseUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: token,
        },
        signal: AbortSignal.timeout(5000), // 5 seconds timeout
      });

      console.log(`[API Route] Test API request status: ${testResponse.status} ${testResponse.statusText}`);

      if (testResponse.ok) {
        console.log('[API Route] Token is valid! Test API request succeeded.');
        try {
          const userData = await testResponse.json();
          console.log('[API Route] User data:', userData);
        } catch (parseError) {
          console.error('[API Route] Error parsing user data:', parseError);
        }
      } else {
        console.error('[API Route] Token might be invalid. Test API request failed.');
      }
    } catch (testError) {
      console.error('[API Route] Error testing token validity:', testError);
    }

    // Construct the full URL to the file on the backend
    const backendBaseUrl = API_CONFIG.BACKEND_URL.endsWith('/')
      ? API_CONFIG.BACKEND_URL.slice(0, -1)
      : API_CONFIG.BACKEND_URL;
    const fullUrl = `${backendBaseUrl}/uploads/${cleanFilePath}`;
    console.log(`[API Route] Fetching file from backend: ${fullUrl}`);

    // Forward the request to the backend with the auth token
    console.log(`[API Route] Using auth token: ${token.substring(0, 15)}...`);

    try {
      // Add a random query parameter to prevent caching issues on the backend
      const urlWithNoCacheParam = `${fullUrl}?nocache=${Date.now()}`;

      console.log(`[API Route] Fetching file with cache-busting: ${urlWithNoCacheParam}`);

      // Log the exact request we're about to make
      console.log('[API Route] Making fetch request with:');
      console.log('[API Route] URL:', urlWithNoCacheParam);
      console.log('[API Route] Headers:', {
        Authorization: token.substring(0, 20) + '...',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      });

      // Make the request
      const response = await fetch(urlWithNoCacheParam, {
        headers: {
          Authorization: token,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        signal: AbortSignal.timeout(30000), // 30 seconds timeout
      });

      // Log response details
      console.log(`[API Route] Response status: ${response.status} ${response.statusText}`);
      console.log(`[API Route] Response headers:`, Object.fromEntries(response.headers.entries()));

      // Check if the response is successful
      if (!response.ok) {
        console.error(`[API Route] Error fetching file: ${response.status} ${response.statusText}`);

        // Try to read the response body for error details
        try {
          const errorText = await response.text();
          console.error(`[API Route] Error response body: ${errorText}`);
        } catch (readError) {
          console.error(`[API Route] Could not read error response body: ${readError}`);
        }

        // If we got a 401 Unauthorized, try with a different token format
        if (response.status === 401) {
          console.log('[API Route] Got 401 Unauthorized, trying with a different token format...');

          // Try different token formats

          // 1. Try without the Bearer prefix
          if (token.startsWith('Bearer ')) {
            const tokenWithoutBearer = token.replace('Bearer ', '');
            console.log('[API Route] Trying without Bearer prefix:', tokenWithoutBearer.substring(0, 15) + '...');

            const retryResponse = await fetch(urlWithNoCacheParam, {
              headers: {
                Authorization: tokenWithoutBearer,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              },
              signal: AbortSignal.timeout(30000),
            });

            console.log(`[API Route] Retry response status: ${retryResponse.status} ${retryResponse.statusText}`);

            if (retryResponse.ok) {
              console.log('[API Route] Retry succeeded with token without Bearer prefix!');
              // Get the file data from the retry response
              const fileData = await retryResponse.arrayBuffer();
              console.log(`[API Route] Successfully fetched file with retry (${fileData.byteLength} bytes)`);

              // Get the content type from the retry response
              const contentType = retryResponse.headers.get('content-type') || 'application/octet-stream';

              // Return the file data with the correct content type
              return new Response(fileData, {
                headers: {
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
                },
              });
            } else {
              console.error('[API Route] Retry failed with token without Bearer prefix.');
            }
          }

          // 2. Try with a fresh token directly from localStorage (server-side)
          try {
            // This is a hack to access localStorage from the server
            // It won't work in production, but might help in development
            if (process.env.NODE_ENV === 'development') {
              console.log('[API Route] Trying with a fresh token from localStorage (dev only)...');

              // Create a fresh token by combining known formats
              const freshToken1 = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
              const freshToken2 = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;

              if (freshToken1 || freshToken2) {
                const freshToken = freshToken1 || freshToken2;
                console.log('[API Route] Found fresh token:', freshToken ? freshToken.substring(0, 15) + '...' : 'null');

                // Try with Bearer prefix
                const tokenWithBearer = freshToken?.startsWith('Bearer ') ? freshToken : `Bearer ${freshToken}`;

                const freshResponse = await fetch(urlWithNoCacheParam, {
                  headers: {
                    Authorization: tokenWithBearer,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                  },
                  signal: AbortSignal.timeout(30000),
                });

                console.log(`[API Route] Fresh token response status: ${freshResponse.status} ${freshResponse.statusText}`);

                if (freshResponse.ok) {
                  console.log('[API Route] Fresh token request succeeded!');
                  // Get the file data from the fresh response
                  const fileData = await freshResponse.arrayBuffer();
                  console.log(`[API Route] Successfully fetched file with fresh token (${fileData.byteLength} bytes)`);

                  // Get the content type from the fresh response
                  const contentType = freshResponse.headers.get('content-type') || 'application/octet-stream';

                  // Return the file data with the correct content type
                  return new Response(fileData, {
                    headers: {
                      'Content-Type': contentType,
                      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
                    },
                  });
                } else {
                  console.error('[API Route] Fresh token request failed.');
                }
              } else {
                console.error('[API Route] No fresh token found in localStorage.');
              }
            }
          } catch (freshTokenError) {
            console.error('[API Route] Error trying fresh token:', freshTokenError);
          }
        }

        return new Response(`Error fetching file: ${response.statusText}`, {
          status: response.status,
        });
      }

      // Get the file data as an array buffer
      const fileData = await response.arrayBuffer();
      console.log(`[API Route] Successfully fetched file (${fileData.byteLength} bytes)`);

      // Get the content type from the response
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Return the file data with the correct content type
      return new Response(fileData, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      });
    } catch (fetchError) {
      console.error(`[API Route] Fetch error: ${fetchError}`);
      return new Response(`Error fetching file: ${fetchError.message}`, {
        status: 500,
      });
    }
  } catch (error) {
    console.error('[API Route] Error in GET /uploads/[...path]:', error);
    return new Response('Error fetching file', { status: 500 });
  }
}
