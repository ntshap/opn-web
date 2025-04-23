'use client';

import { useState, useEffect } from 'react';
import { BackendImage } from '@/components/shared/BackendImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { NetworkMonitor } from '@/components/debug/NetworkMonitor';
import { API_CONFIG } from '@/lib/config';

export default function TestImagePageClient() {
  const [imagePath, setImagePath] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [directTestResult, setDirectTestResult] = useState<any>(null);
  const [directTestLoading, setDirectTestLoading] = useState<boolean>(false);

  // Function to check debug headers and auth status
  const checkDebugHeaders = async () => {
    setLoading(true);
    try {
      // Get auth token for debugging
      const { getAuthToken } = await import('@/lib/auth-utils');
      const token = await getAuthToken();
      const maskedToken = token ?
        `${token.substring(0, 10)}...${token.substring(token.length - 10)}` :
        'No token found';

      // Fetch debug headers from API
      const response = await fetch('/api/v1/debug-headers');
      const data = await response.json();

      // Add auth token info to debug data
      setDebugInfo({
        ...data,
        authTokenStatus: {
          hasToken: !!token,
          maskedToken
        }
      });
    } catch (error) {
      console.error('Error fetching debug headers:', error);
      setDebugInfo({ error: 'Failed to fetch debug headers' });
    } finally {
      setLoading(false);
    }
  };

  // Function to test image loading with authentication
  const testDirectImageLoading = async () => {
    if (!imagePath) {
      alert('Please enter an image path first');
      return;
    }

    setDirectTestLoading(true);
    try {
      // Import the formatImageUrl function
      const { formatImageUrl } = await import('@/lib/image-utils');
      const { getAuthToken } = await import('@/lib/auth-utils');

      // Format the URL using our utility function to get the direct backend URL
      const directUrl = formatImageUrl(imagePath);

      // Verify the URL doesn't contain localhost
      if (directUrl.includes('localhost')) {
        throw new Error(`Error: URL contains localhost: ${directUrl}`);
      }

      console.log(`[TestImage] Using direct backend URL: ${directUrl}`);

      // Use our raw-image API proxy route that will add the Authorization header server-side
      // The directUrl already contains the full backend URL, so we don't need to add it again
      const proxyUrl = `/api/v1/raw-image?url=${encodeURIComponent(directUrl)}`;
      console.log(`[TestImage] Using raw-image API proxy URL: ${proxyUrl}`);

      // Make a fetch request to our API proxy
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*',
        },
      });

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the response type
      const contentType = response.headers.get('content-type');

      // Set the result
      setDirectTestResult({
        success: true,
        status: response.status,
        contentType,
        message: `Successfully loaded image (${contentType})`,
        url: proxyUrl
      });
    } catch (error) {
      console.error('Error testing image loading:', error);
      setDirectTestResult({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setDirectTestLoading(false);
    }
  };

  useEffect(() => {
    // Check debug headers on page load
    checkDebugHeaders();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Image Loading Test Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Image Test Section */}
        <Card>
          <CardHeader>
            <CardTitle>Test Image Loading</CardTitle>
            <CardDescription>
              Enter an image path to test loading with authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Image Path</label>
                <Input
                  value={imagePath}
                  onChange={(e) => setImagePath(e.target.value)}
                  placeholder="e.g., /uploads/events/2023-01-01/image.jpg"
                  className="w-full"
                />
              </div>

              {imagePath && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Preview:</h3>
                  <div className="border rounded-md p-4 bg-gray-50">
                    <BackendImage
                      src={imagePath}
                      alt="Test image"
                      width={300}
                      height={200}
                      className="mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setImagePath('')}
            >
              Clear
            </Button>
            <Button
              onClick={testDirectImageLoading}
              disabled={!imagePath || directTestLoading}
              className="ml-2"
            >
              {directTestLoading ? 'Testing...' : 'Test Direct Fetch'}
            </Button>
          </CardFooter>

          {directTestResult && (
            <div className={`mt-4 p-3 rounded-md ${directTestResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="font-medium">{directTestResult.success ? '✓ Success' : '✗ Error'}</p>
              <p className="text-sm">{directTestResult.message}</p>
              {directTestResult.contentType && (
                <p className="text-xs mt-1">Content-Type: {directTestResult.contentType}</p>
              )}
              {directTestResult.url && (
                <p className="text-xs mt-1 break-all">Direct URL: {directTestResult.url}</p>
              )}
            </div>
          )}
        </Card>

        {/* Debug Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Info</CardTitle>
            <CardDescription>
              Information about your current authentication status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : debugInfo ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Auth Token Status:</h3>
                  <div className="text-sm p-2 rounded bg-gray-100">
                    {debugInfo.hasAuthToken ? (
                      <span className="text-green-600 font-medium">✓ Auth token found in request: {debugInfo.authToken}</span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ No auth token found in request</span>
                    )}
                  </div>
                  {debugInfo.authTokenStatus && (
                    <div className="mt-2 text-sm p-2 rounded bg-gray-100">
                      {debugInfo.authTokenStatus.hasToken ? (
                        <span className="text-green-600 font-medium">✓ Auth token found in client: {debugInfo.authTokenStatus.maskedToken}</span>
                      ) : (
                        <span className="text-red-600 font-medium">✗ No auth token found in client</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Request Headers:</h3>
                  <pre className="text-xs p-2 rounded bg-gray-100 overflow-auto max-h-40">
                    {JSON.stringify(debugInfo.headers, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Cookies:</h3>
                  <pre className="text-xs p-2 rounded bg-gray-100 overflow-auto max-h-40">
                    {JSON.stringify(debugInfo.cookies, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-red-500">Failed to load debug info</div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={checkDebugHeaders} disabled={loading}>
              Refresh Debug Info
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Network Monitor Section */}
      <div className="mb-8">
        <NetworkMonitor />
      </div>
    </div>
  );
}
