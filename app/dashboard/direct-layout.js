"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ClientAuthCheck } from "@/components/auth/client-auth-check";
import { HydrationProvider } from "@/components/providers/hydration-provider";

export default function DirectDashboardLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Check authentication on dashboard load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const log = (message) => {
      console.log(message);
      setDebugInfo(prev => prev + '\n' + message);
    };

    log('Dashboard: Checking authentication');

    // Function to check if user is authenticated
    const checkAuth = async () => {
      try {
        // Check if we're in development mode
        if (process.env.NODE_ENV === 'development') {
          log('Development mode: Bypassing auth check');
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Check for auth token (standard token)
        const authToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
        log('Auth token: ' + (authToken ? 'Found' : 'Not found'));

        // Check for direct token
        const directToken = localStorage.getItem('direct_token');
        log('Direct token: ' + (directToken ? 'Found' : 'Not found'));

        // Check for is_logged_in flag
        const isLoggedIn = localStorage.getItem('is_logged_in') === 'true';
        log('Is logged in flag: ' + (isLoggedIn ? 'True' : 'False'));

        // If we have a token but no is_logged_in flag, set it now
        if ((authToken || directToken) && !isLoggedIn) {
          log('Token found but no is_logged_in flag, setting it now');
          localStorage.setItem('is_logged_in', 'true');
        }

        // Consider user authenticated if they have a token, even if is_logged_in flag is not set
        if (authToken || directToken) {
          log('User is authenticated, showing dashboard');
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Check if backend is available
        log('Checking if backend is available...');
        try {
          // Simple check to see if backend is responding
          // Add cache-busting parameter to prevent caching
          const timestamp = new Date().getTime();
          const response = await fetch(`/api/v1/auth/token?_=${timestamp}`, {
            method: 'HEAD',
            headers: { 'Content-Type': 'application/json' },
            // Add timeout using AbortController
            signal: AbortSignal.timeout(5000), // 5 second timeout
            cache: 'no-store',
          });

          // If we get any response (even 401 Unauthorized), the backend is online
          if (response.status < 500) {
            log('Backend is available');
          } else {
            // Only log the issue but continue anyway
            log('Backend returned server error, but continuing anyway');
          }
        } catch (error) {
          // Only log the error but continue anyway
          log('Error checking backend: ' + error.message);
          log('Continuing despite backend check failure');
        }

        // Not authenticated, redirect to login
        log('User is not authenticated, redirecting to login');
        window.location.href = '/login?error=unauthorized';
      } catch (error) {
        console.error('Error checking authentication:', error);
        log('Error checking authentication: ' + error.message);

        // In development mode, show dashboard anyway
        if (process.env.NODE_ENV === 'development') {
          log('Development mode: Showing dashboard despite error');
          setIsAuthenticated(true);
          setIsLoading(false);
        } else {
          // In production, redirect to login
          window.location.href = '/login?error=unauthorized';
        }
      }
    };

    // Add a delay to ensure localStorage is available
    const timer = setTimeout(checkAuth, 500);
    return () => clearTimeout(timer);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded max-w-md">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <pre className="whitespace-pre-wrap text-xs">{debugInfo}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated
  if (isAuthenticated) {
    return (
      <HydrationProvider>
        <ClientAuthCheck>
          <DashboardLayout>{children}</DashboardLayout>
        </ClientAuthCheck>
      </HydrationProvider>
    );
  }

  // This should never be reached, but just in case
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="mb-4">There was an error checking your authentication.</p>
        <button
          onClick={() => window.location.href = '/direct-login'}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go to Login
        </button>
        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded max-w-md mx-auto">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <pre className="whitespace-pre-wrap text-xs">{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
