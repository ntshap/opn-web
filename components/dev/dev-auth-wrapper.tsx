"use client"

import dynamic from 'next/dynamic'

// Dynamically import the DevAuthButton to avoid SSR issues
const DevAuthButton = dynamic(
  () => import('./dev-auth-button').then(mod => mod.DevAuthButton)
)

export function DevAuthWrapper() {
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return <DevAuthButton />
}
