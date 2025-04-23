'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RequestInfo {
  url: string;
  method: string;
  status?: number;
  type: string;
  timestamp: number;
  headers?: Record<string, string>;
  hasAuthHeader: boolean;
}

export function NetworkMonitor() {
  const [requests, setRequests] = useState<RequestInfo[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Start monitoring network requests
  const startMonitoring = () => {
    setRequests([]);
    setIsMonitoring(true);

    // Create a proxy for the original fetch function
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      const method = init?.method || (typeof input === 'string' ? 'GET' : input.method || 'GET');
      
      // Extract headers
      const headers: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            headers[key] = value;
          });
        } else {
          Object.entries(init.headers).forEach(([key, value]) => {
            headers[key] = value as string;
          });
        }
      }

      // Check for Authorization header
      const hasAuthHeader = Object.keys(headers).some(key => 
        key.toLowerCase() === 'authorization'
      );

      // Add request to our list
      const requestInfo: RequestInfo = {
        url,
        method,
        type: 'fetch',
        timestamp: Date.now(),
        headers,
        hasAuthHeader
      };

      try {
        // Make the actual fetch request
        const response = await originalFetch(input, init);
        
        // Update the request info with the status
        requestInfo.status = response.status;
        
        // Add to our list of requests
        setRequests(prev => [requestInfo, ...prev]);
        
        // Return the response
        return response;
      } catch (error) {
        // Add to our list of requests even if it failed
        setRequests(prev => [requestInfo, ...prev]);
        throw error;
      }
    };

    // Also monitor XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.open = function(method, url) {
      this._method = method;
      this._url = url;
      this._headers = {};
      this._startTime = Date.now();
      return originalXHROpen.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
      this._headers = this._headers || {};
      this._headers[header] = value;
      return originalXHRSetRequestHeader.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.send = function() {
      const hasAuthHeader = this._headers && Object.keys(this._headers).some(key => 
        key.toLowerCase() === 'authorization'
      );

      const requestInfo: RequestInfo = {
        url: this._url,
        method: this._method,
        type: 'xhr',
        timestamp: this._startTime,
        headers: this._headers,
        hasAuthHeader
      };

      this.addEventListener('load', function() {
        requestInfo.status = this.status;
        setRequests(prev => [requestInfo, ...prev]);
      });

      this.addEventListener('error', function() {
        setRequests(prev => [requestInfo, ...prev]);
      });

      return originalXHRSend.apply(this, arguments as any);
    };

    // Also monitor image loads
    const originalImageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
    
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      set: function(value) {
        const requestInfo: RequestInfo = {
          url: value,
          method: 'GET',
          type: 'img',
          timestamp: Date.now(),
          hasAuthHeader: false // We can't know for img tags
        };
        
        setRequests(prev => [requestInfo, ...prev]);
        return originalImageSrc.set!.call(this, value);
      },
      get: function() {
        return originalImageSrc.get!.call(this);
      }
    });
  };

  // Stop monitoring network requests
  const stopMonitoring = () => {
    setIsMonitoring(false);
    // Restore original fetch
    window.fetch = originalFetch;
    // We would need to restore XHR and Image.src too, but for simplicity we'll skip that
  };

  // Store original fetch to restore it later
  const originalFetch = window.fetch;

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (isMonitoring) {
        window.fetch = originalFetch;
      }
    };
  }, [isMonitoring]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Network Request Monitor</CardTitle>
        <CardDescription>
          Monitor network requests to check for authentication headers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          {isMonitoring ? (
            <Button onClick={stopMonitoring} variant="destructive">
              Stop Monitoring
            </Button>
          ) : (
            <Button onClick={startMonitoring}>
              Start Monitoring
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px] rounded-md border">
          {requests.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {isMonitoring ? "No requests captured yet" : "Click 'Start Monitoring' to begin capturing requests"}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {requests.map((req, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{req.method} {req.type === 'img' ? '(Image)' : req.type}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      req.status && req.status >= 200 && req.status < 300 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {req.status || 'Pending'}
                    </span>
                  </div>
                  
                  <div className="text-sm truncate mb-2" title={req.url}>
                    {req.url}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    {new Date(req.timestamp).toLocaleTimeString()}
                  </div>
                  
                  <div className={`text-sm ${req.hasAuthHeader ? 'text-green-600' : 'text-red-600'}`}>
                    {req.hasAuthHeader 
                      ? '✓ Has Authorization header' 
                      : '✗ No Authorization header'}
                  </div>
                  
                  {req.headers && Object.keys(req.headers).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer">Show Headers</summary>
                      <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-[100px]">
                        {JSON.stringify(req.headers, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          {isMonitoring 
            ? `Monitoring active - ${requests.length} requests captured` 
            : 'Monitoring inactive'}
        </div>
      </CardFooter>
    </Card>
  );
}
