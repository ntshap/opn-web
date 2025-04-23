"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth-utils'
import { useToast } from '@/components/ui/use-toast'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Check if the user is authenticated
    const authenticated = isAuthenticated()
    
    if (!authenticated) {
      // User is not authenticated, redirect to login
      toast({
        title: "Authentication required",
        description: "Please log in to access this page.",
        variant: "destructive",
      })
      router.push('/login')
    } else {
      setIsAuthorized(true)
    }
    
    setIsLoading(false)
  }, [router, toast])
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }
  
  // Show children only if authorized
  return isAuthorized ? <>{children}</> : null
}
