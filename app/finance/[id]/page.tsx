import { FinanceDetail } from "@/components/finance/finance-detail"
import { financeApi } from "@/lib/api-service" // Updated path

type FinancePageParams = Promise<{ id: string }>

// This function is required for static site generation with dynamic routes
export async function generateStaticParams() {
  try {
    // For static export, we'll provide a few sample IDs
    // In a real app, you might fetch these from an API
    return [{ id: '1' }, { id: '2' }, { id: '3' }]
  } catch (error) {
    console.error('Error generating static params for finance detail page:', error)
    return [{ id: '1' }] // Fallback to at least one ID
  }
}

export default async function FinanceDetailPage({ params }: { params: FinancePageParams }) {
  // In Next.js 15, params is a Promise that needs to be awaited
  const { id } = await params

  return (
    <div className="container mx-auto py-6">
      <FinanceDetail financeId={id} />
    </div>
  )
}
