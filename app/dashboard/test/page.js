"use client";

import { useState, useEffect } from 'react';
import LogoutButton from '@/components/logout-button';

export default function TestPage() {
  const [authInfo, setAuthInfo] = useState({});
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Get authentication info
    const directToken = localStorage.getItem('direct_token');
    const isLoggedIn = localStorage.getItem('is_logged_in');
    const tokenType = localStorage.getItem('token_type');
    const loginTime = localStorage.getItem('login_time');
    
    setAuthInfo({
      directToken: directToken ? `${directToken.substring(0, 10)}...` : 'Not found',
      isLoggedIn,
      tokenType,
      loginTime: loginTime ? new Date(parseInt(loginTime)).toLocaleString() : 'Not found'
    });
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Info</h2>
        
        <div className="space-y-2">
          <p><strong>Token:</strong> {authInfo.directToken}</p>
          <p><strong>Is Logged In:</strong> {authInfo.isLoggedIn}</p>
          <p><strong>Token Type:</strong> {authInfo.tokenType}</p>
          <p><strong>Login Time:</strong> {authInfo.loginTime}</p>
        </div>
      </div>
      
      <div className="flex space-x-4">
        <a 
          href="/dashboard" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </a>
        
        <LogoutButton />
      </div>
    </div>
  );
}
