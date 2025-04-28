"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, removeAuthTokens } from '@/lib/auth-utils'
import { useToast } from '@/components/ui/use-toast'

// Define the authentication context
type AuthContextType = {
  isLoggedIn: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  checkAuth: () => boolean
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAuthenticated: false,
  logout: async () => {},
  checkAuth: () => false,
})

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext)

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Use refs to track state between renders
  const redirectingRef = useRef(false)
  const lastPathRef = useRef<string | null>(null)
  const redirectCountRef = useRef(0)

  // Simple authentication check - no redirect loops
  useEffect(() => {
    // Skip auth check for login page to prevent loops
    if (pathname === '/login') {
      console.log('Auth provider: Skipping auth check on login page');
      return;
    }

    const checkAuthentication = () => {
      try {
        const authenticated = isAuthenticated()
        console.log(`Auth check for path ${pathname}: ${authenticated ? 'Authenticated' : 'Not authenticated'}`);
        setIsLoggedIn(authenticated)

        // No automatic redirects - just update state
      } catch (error) {
        console.error('Error in auth check:', error);
        // Set as authenticated to prevent being stuck
        setIsLoggedIn(true);
      }
    }

    // Only run on client-side with a delay to prevent immediate redirects
    if (typeof window !== 'undefined') {
      const timer = setTimeout(checkAuthentication, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname])

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Import auth functions
      const { authApi } = await import('@/lib/api-auth')
      await authApi.logout()

      // Remove tokens
      removeAuthTokens()

      // Update state
      setIsLoggedIn(false)

      // Show success message
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })

      // Note: We're not using router.push here anymore
      // The direct window.location.href in the component will handle redirection
      console.log('Logout successful, redirection will be handled by component')
    } catch (error) {
      console.error('Logout error:', error)

      // Remove tokens even if API call fails
      removeAuthTokens()
      setIsLoggedIn(false)

      // Show message
      toast({
        title: "Logged out",
        description: "You have been logged out.",
      })

      // Note: We're not using router.push here anymore
      console.log('Logout completed with errors, redirection will be handled by component')
    }
  }

  // Function to check authentication status
  const checkAuth = (): boolean => {
    const authenticated = isAuthenticated()
    setIsLoggedIn(authenticated)
    return authenticated
  }

  // Provide the auth context to children
  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      isAuthenticated: isLoggedIn, // Alias for isLoggedIn
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}
