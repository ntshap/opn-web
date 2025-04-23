"use client";

import { useState } from 'react';

export default function StandaloneLoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const addDebugInfo = (message) => {
    console.log(message);
    setDebugInfo(prev => prev + '\n' + message);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebugInfo('Starting login process...');

    try {
      addDebugInfo(`Attempting login with: ${username}`);

      // Create form data
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('grant_type', 'password');

      addDebugInfo(`Request body: ${formData.toString()}`);

      // Make API request
      addDebugInfo('Making API request...');
      const response = await fetch('https://backend-project-pemuda.onrender.com/api/v1/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      addDebugInfo(`Response status: ${response.status}`);

      // Handle error response
      if (!response.ok) {
        const errorText = await response.text();
        addDebugInfo(`Login failed: ${errorText}`);
        throw new Error(`Login failed: ${errorText || 'Invalid credentials'}`);
      }

      // Parse response
      const data = await response.json();
      addDebugInfo('Login successful, received token');

      // Validate token
      if (!data.access_token) {
        addDebugInfo('Error: No access token in response');
        throw new Error('No access token received');
      }

      // Store token in localStorage
      localStorage.setItem('standalone_token', data.access_token);
      addDebugInfo('Token stored in localStorage');

      // Store token in sessionStorage as backup
      sessionStorage.setItem('standalone_token', data.access_token);
      addDebugInfo('Token stored in sessionStorage');

      // Store token type
      localStorage.setItem('standalone_token_type', data.token_type || 'bearer');
      sessionStorage.setItem('standalone_token_type', data.token_type || 'bearer');

      // Set a flag indicating successful login
      localStorage.setItem('standalone_logged_in', 'true');
      sessionStorage.setItem('standalone_logged_in', 'true');
      localStorage.setItem('standalone_login_time', Date.now().toString());
      sessionStorage.setItem('standalone_login_time', Date.now().toString());

      // Wait a moment to ensure storage is complete
      addDebugInfo('Waiting before redirect...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to standalone dashboard
      addDebugInfo('Redirecting to standalone dashboard...');
      window.location.href = '/standalone-dashboard';
    } catch (error) {
      console.error('Login error:', error);
      addDebugInfo(`Error: ${error.message || 'Unknown error'}`);
      setError(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Standalone Login</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-100 rounded overflow-auto max-h-60">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <pre className="whitespace-pre-wrap text-xs">{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
