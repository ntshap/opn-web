"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function EmergencyPage() {
  const [storageInfo, setStorageInfo] = useState<string>("")
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Get all localStorage items
    let localStorageItems = "localStorage:\n"
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        localStorageItems += `${key}: ${value}\n`
      }
    }
    
    // Get all sessionStorage items
    let sessionStorageItems = "\nsessionStorage:\n"
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) {
        const value = sessionStorage.getItem(key)
        sessionStorageItems += `${key}: ${value}\n`
      }
    }
    
    setStorageInfo(localStorageItems + sessionStorageItems)
  }, [])
  
  const clearAllStorage = () => {
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    
    alert("All storage cleared!")
    window.location.reload()
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-red-600 mb-6">Emergency Navigation Page</h1>
        <p className="mb-6 text-gray-700">
          This page is designed to help you navigate without redirect loops. All automatic redirects have been disabled.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link 
            href="/login" 
            className="bg-blue-500 text-white p-4 rounded-lg text-center font-medium hover:bg-blue-600 transition-colors"
          >
            Go to Login Page
          </Link>
          
          <Link 
            href="/dashboard" 
            className="bg-green-500 text-white p-4 rounded-lg text-center font-medium hover:bg-green-600 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
        
        <div className="mb-8">
          <button 
            onClick={clearAllStorage}
            className="bg-red-500 text-white p-4 rounded-lg text-center font-medium hover:bg-red-600 transition-colors w-full"
          >
            Clear All Storage (localStorage, sessionStorage, cookies)
          </button>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Current Storage Contents:</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
            {storageInfo || "Loading..."}
          </pre>
        </div>
        
        <div className="border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Troubleshooting Instructions:</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Use the buttons above to navigate directly to the login or dashboard page</li>
            <li>If you're still experiencing redirect loops, click "Clear All Storage" to reset your authentication state</li>
            <li>After clearing storage, try navigating to the login page and logging in again</li>
            <li>If problems persist, try opening the site in an incognito/private window</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
