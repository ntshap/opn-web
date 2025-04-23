"use client";

import { useState, useEffect } from 'react';

export default function StandaloneDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authInfo, setAuthInfo] = useState({});
  const [debugInfo, setDebugInfo] = useState('');

  const addDebugInfo = (message) => {
    console.log(message);
    setDebugInfo(prev => prev + '\n' + message);
  };

  const handleLogout = () => {
    addDebugInfo('Logging out...');
    
    // Clear authentication data
    localStorage.removeItem('standalone_token');
    localStorage.removeItem('standalone_token_type');
    localStorage.removeItem('standalone_logged_in');
    localStorage.removeItem('standalone_login_time');
    
    sessionStorage.removeItem('standalone_token');
    sessionStorage.removeItem('standalone_token_type');
    sessionStorage.removeItem('standalone_logged_in');
    sessionStorage.removeItem('standalone_login_time');
    
    addDebugInfo('Authentication data cleared');
    
    // Redirect to login
    addDebugInfo('Redirecting to login...');
    window.location.href = '/standalone-login';
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    addDebugInfo('Checking authentication...');
    
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      addDebugInfo('Development mode: Bypassing auth check');
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }
    
    try {
      // Get authentication info
      const token = localStorage.getItem('standalone_token');
      const tokenType = localStorage.getItem('standalone_token_type');
      const isLoggedIn = localStorage.getItem('standalone_logged_in') === 'true';
      const loginTime = localStorage.getItem('standalone_login_time');
      
      addDebugInfo(`Token: ${token ? 'Found' : 'Not found'}`);
      addDebugInfo(`Token Type: ${tokenType || 'Not found'}`);
      addDebugInfo(`Is Logged In: ${isLoggedIn ? 'Yes' : 'No'}`);
      addDebugInfo(`Login Time: ${loginTime ? new Date(parseInt(loginTime)).toLocaleString() : 'Not found'}`);
      
      // Set auth info for display
      setAuthInfo({
        token: token ? `${token.substring(0, 10)}...` : 'Not found',
        tokenType: tokenType || 'Not found',
        isLoggedIn: isLoggedIn ? 'Yes' : 'No',
        loginTime: loginTime ? new Date(parseInt(loginTime)).toLocaleString() : 'Not found'
      });
      
      // Check if authenticated
      if (token && isLoggedIn) {
        addDebugInfo('User is authenticated');
        setIsAuthenticated(true);
      } else {
        addDebugInfo('User is not authenticated');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          addDebugInfo('Redirecting to login...');
          window.location.href = '/standalone-login';
        }, 3000);
      }
    } catch (error) {
      addDebugInfo(`Error checking authentication: ${error.message}`);
      console.error('Error checking authentication:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Please wait while we check your authentication...</p>
          
          {debugInfo && (
            <div className="mt-6 p-4 bg-gray-100 rounded overflow-auto max-h-60 text-left">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <pre className="whitespace-pre-wrap text-xs">{debugInfo}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Authentication Failed</h2>
          <p className="mb-4">You are not authenticated. Redirecting to login page...</p>
          
          <button
            onClick={() => window.location.href = '/standalone-login'}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Login
          </button>
          
          {debugInfo && (
            <div className="mt-6 p-4 bg-gray-100 rounded overflow-auto max-h-60 text-left">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <pre className="whitespace-pre-wrap text-xs">{debugInfo}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Standalone Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Authentication Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Token:</p>
                <p className="text-gray-700">{authInfo.token}</p>
              </div>
              <div>
                <p className="font-medium">Token Type:</p>
                <p className="text-gray-700">{authInfo.tokenType}</p>
              </div>
              <div>
                <p className="font-medium">Is Logged In:</p>
                <p className="text-gray-700">{authInfo.isLoggedIn}</p>
              </div>
              <div>
                <p className="font-medium">Login Time:</p>
                <p className="text-gray-700">{authInfo.loginTime}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Dashboard Content</h2>
            <p>This is a standalone dashboard page that doesn't rely on any existing components.</p>
            <p className="mt-2">You are successfully logged in!</p>
          </div>
        </div>
        
        {debugInfo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-4 rounded">{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
