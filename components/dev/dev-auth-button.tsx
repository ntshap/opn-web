"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { setMockAuthToken, clearMockAuthToken, hasMockAuthToken } from '@/lib/dev-auth'

/**
 * Development authentication button
 * This component is only rendered in development mode
 * It provides a button to set/clear a mock authentication token
 */
export function DevAuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if mock token is set on mount
  useEffect(() => {
    setIsAuthenticated(hasMockAuthToken())
  }, [])

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const handleToggleAuth = () => {
    if (isAuthenticated) {
      clearMockAuthToken()
      setIsAuthenticated(false)
      // Reload the page to apply the changes
      window.location.reload()
    } else {
      setMockAuthToken()
      setIsAuthenticated(true)
      // Reload the page to apply the changes
      window.location.reload()
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-100 p-3 rounded-md border-2 border-yellow-500 shadow-lg">
      <div className="text-sm font-bold mb-2 text-yellow-800">Development Mode</div>
      <Button
        size="sm"
        variant={isAuthenticated ? "destructive" : "default"}
        onClick={handleToggleAuth}
        className="w-full font-semibold"
      >
        {isAuthenticated ? 'Clear Auth Token' : 'Set Auth Token'}
      </Button>
      <div className="text-xs mt-2 text-yellow-700">
        {isAuthenticated ? 'Auth token is set' : 'No auth token'}
      </div>
    </div>
  )
}
