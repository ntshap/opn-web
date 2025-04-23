"use client"

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Use dynamic import without ssr: false to be compatible with Next.js 15
const EditFinancePageClient = dynamic(
  () => import('./page.client'),
  {
    loading: () => (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
)

export default function ClientWrapper({ id }: { id: string }) {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <EditFinancePageClient id={id} />
    </Suspense>
  )
}
