"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function EventEditRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== "undefined") {
      // Get the current URL path
      const path = window.location.pathname
      
      // Extract the event ID from the path
      const match = path.match(/\/dashboard\/events\/(\d+)\/edit/)
      if (match && match[1]) {
        const eventId = match[1]
        
        // Redirect to the correct edit page
        router.push(`/dashboard/events/edit/${eventId}`)
      } else {
        // If we can't extract the ID, redirect to the events list
        router.push("/dashboard/events")
      }
    }
  }, [router])

  // Show a loading state while redirecting
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />

          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
