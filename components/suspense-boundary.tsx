"use client"

import { Suspense, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface SuspenseBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  type?: 'card' | 'list' | 'table' | 'custom'
}

export function SuspenseBoundary({
  children,
  fallback,
  type = 'card'
}: SuspenseBoundaryProps) {
  // Default fallbacks based on type
  const defaultFallbacks = {
    card: (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    ),
    list: (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    ),
    table: (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    ),
    custom: null
  }

  return (
    <Suspense fallback={fallback || defaultFallbacks[type]}>
      {children}
    </Suspense>
  )
}
