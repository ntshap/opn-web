"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ClientAuthCheck } from "@/components/auth/client-auth-check";
import { HydrationProvider } from "@/components/providers/hydration-provider";

export default function DirectDashboardLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Simple authentication check - no redirect loops
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
        // Check for auth token (standard token)
        const authToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
        log('Auth token: ' + (authToken ? 'Found' : 'Not found'));

        // If we have a token, consider the user authenticated
        if (authToken) {
          log('Auth token found, showing dashboard');
          // Always set the is_logged_in flag if we have a token
          localStorage.setItem('is_logged_in', 'true');
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // If we get here, the user is not authenticated
        log('User is not authenticated, redirecting to login');

        // Redirect to login with no-cache parameter
        window.location.href = '/login';
      } catch (error) {
        console.error('Error checking authentication:', error);
        log('Error checking authentication: ' + error.message);

        // Show dashboard anyway to prevent being stuck
        log('Showing dashboard despite error to prevent being stuck');
        setIsAuthenticated(true);
        setIsLoading(false);
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
