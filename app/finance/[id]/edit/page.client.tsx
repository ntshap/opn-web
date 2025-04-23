"use client"

import { useEffect } from "react"
import { FinanceForm } from "@/components/finance/finance-form"
import { useFinance } from "@/hooks/useFinance"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function EditFinancePageClient({ id }: { id: string }) {
  const router = useRouter()
  
  // Ensure ID is valid
  useEffect(() => {
    if (!id) {
      router.push('/finance')
    }
  }, [id, router])

  // Use the ID passed from the server component
  const { data: finance, isLoading, isError, error } = useFinance(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex justify-end space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load finance data"}
        </AlertDescription>
      </Alert>
    )
  }

  if (!finance) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          The requested finance record could not be found.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Edit Transaksi Keuangan</h2>
      <FinanceForm finance={finance} isEditing={true} />
    </div>
  )
}
