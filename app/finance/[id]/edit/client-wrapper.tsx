"use client"

import dynamic from 'next/dynamic'

// Use dynamic import with no SSR to avoid QueryClient issues during build
const EditFinancePageClient = dynamic(
  () => import('./page.client'),
  { 
    ssr: false,
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
  return <EditFinancePageClient id={id} />
}
