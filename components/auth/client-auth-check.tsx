"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
// Import commented out to prevent usage
// import { isAuthenticated } from '@/lib/auth-utils'

export function ClientAuthCheck({ children }: { children: React.ReactNode }) {
  // COMPLETELY DISABLED - Always render children immediately
  return <>{children}</>;

  /* Original implementation removed to prevent any chance of redirect loops
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const redirectingRef = useRef(false)

  useEffect(() => {
    // Only run this once per component mount
    if (redirectingRef.current) return

    const checkAuth = () => {
      try {
        // Check for redirect loop
        const redirectCount = parseInt(sessionStorage.getItem('redirectCount') || '0')
        if (redirectCount > 5) {
          console.error('Detected redirect loop in ClientAuthCheck, clearing auth state')
          // Clear all auth data to break the loop
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          sessionStorage.removeItem('redirectCount')
          redirectingRef.current = true
          router.replace('/login')
          return
        }

        // For development/demo purposes, always consider authenticated
        console.log(`Auth check at ${pathname}: Bypassing authentication check`)
        setIsAuthed(true)
        setIsLoading(false)
        return
      } catch (error) {
        console.error('Error in auth check:', error)
        // On error, assume authenticated for demo purposes
        setIsAuthed(true)
      } finally {
        setIsLoading(false)
      }
    }

    // Add a small delay to ensure localStorage is available
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [router, pathname])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return <>{children}</>
  */

  // This code is unreachable due to the early return above
  // Keeping it commented out for reference
}
