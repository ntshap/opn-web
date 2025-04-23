"use client"

import { useState, useEffect, ReactNode } from "react"

interface SafeIconProps {
  children: ReactNode
}

/**
 * A component that safely renders icons only on the client side
 * to prevent hydration mismatches with SVG attributes
 */
export function SafeIcon({ children }: SafeIconProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    // Return a placeholder with the same dimensions during SSR
    return <div className="inline-block" style={{ width: '1em', height: '1em' }} />
  }

  return <>{children}</>
}
