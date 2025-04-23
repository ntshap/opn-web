"use client"

import { useEffect, useState, ReactNode } from "react"

interface HydrationProviderProps {
  children: ReactNode
}

/**
 * A component that prevents hydration mismatch errors by only rendering children after hydration is complete.
 * This is useful for components that use browser-specific APIs or have different rendering on server vs client.
 */
export function HydrationProvider({ children }: HydrationProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait until after client-side hydration to show
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return (
    <>
      {/* Render a hidden version during SSR/initial render, then swap once hydrated */}
      <div style={{ visibility: isHydrated ? "visible" : "hidden" }}>
        {children}
      </div>
      {/* Show a simple loading state until hydrated */}
      {!isHydrated && (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </>
  )
}
