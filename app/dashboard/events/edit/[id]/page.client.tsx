"use client"

import { useParams } from "next/navigation"
import { EventForm } from "@/components/events/event-form"
import { useEvent } from "@/hooks/useEvents"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function EditEventPageClient({ id }: { id: string }) {
  // Use the ID passed from the server component
  const eventId = id

  const { data: event, isLoading, isError, error } = useEvent(eventId)

  if (isLoading) {
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

        <div className="flex justify-end space-x-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load event details. Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Edit Event</h1>
      </div>

      <EventForm event={event} />
    </div>
  )
}
