"use client";

import { useState } from 'react';

export default function DirectLoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebugInfo('Starting login process...');

    try {
      // Log the login attempt
      console.log('Attempting login with:', { username, password: '********' });
      setDebugInfo(prev => prev + '\nAttempting login with: ' + username);

      // Create form data
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('grant_type', 'password');

      // Log the request
      console.log('Making API request with body:', formData.toString());
      setDebugInfo(prev => prev + '\nMaking API request...');

      // Make API request
      const response = await fetch('https://beopn.penaku.site/api/v1/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      // Log the response status
      console.log('Response status:', response.status);
      setDebugInfo(prev => prev + '\nResponse status: ' + response.status);

      // Handle error response
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login failed:', errorText);
        setDebugInfo(prev => prev + '\nLogin failed: ' + errorText);
        throw new Error('Login failed: ' + (errorText || 'Invalid credentials'));
      }

      // Parse response
      const data = await response.json();
      console.log('Login successful, received data:', {
        access_token: data.access_token ? '[PRESENT]' : '[MISSING]',
        token_type: data.token_type,
        expires_in: data.expires_in
      });
      setDebugInfo(prev => prev + '\nLogin successful, received token');

      // Validate token
      if (!data.access_token) {
        setDebugInfo(prev => prev + '\nError: No access token in response');
        throw new Error('No access token received');
      }

      // Store token in localStorage
      localStorage.setItem('direct_token', data.access_token);
      console.log('Token stored in localStorage');
      setDebugInfo(prev => prev + '\nToken stored in localStorage');

      // Store token in sessionStorage as backup
      sessionStorage.setItem('direct_token', data.access_token);
      console.log('Token stored in sessionStorage');
      setDebugInfo(prev => prev + '\nToken stored in sessionStorage');

      // Store token type
      localStorage.setItem('token_type', data.token_type || 'bearer');
      sessionStorage.setItem('token_type', data.token_type || 'bearer');

      // Set a flag indicating successful login
      localStorage.setItem('is_logged_in', 'true');
      sessionStorage.setItem('is_logged_in', 'true');
      localStorage.setItem('login_time', Date.now().toString());
      sessionStorage.setItem('login_time', Date.now().toString());

      // Wait a moment to ensure storage is complete
      setDebugInfo(prev => prev + '\nWaiting before redirect...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to dashboard
      console.log('Redirecting to dashboard...');
      setDebugInfo(prev => prev + '\nRedirecting to dashboard...');

      // Use direct navigation to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      setDebugInfo(prev => prev + '\nError: ' + (error.message || 'Unknown error'));
      setError(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Direct Login</h1>

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
