"use client"

import { useParams, useRouter } from "next/navigation"
import { EventFormClient } from "@/components/events/event-form-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import type { Event } from "@/lib/api-service" // Updated path
import { Button } from "@/components/ui/button"

// Import the API client
import { eventApi } from "@/lib/api-service" // Updated path

export default function EditEventPageClient({ id }: { id: string }) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Fetch the event data from the API
    const fetchEvent = async () => {
      try {
        setIsLoading(true)
        // Use the API client to fetch the event
        const eventData = await eventApi.getEvent(id)
        setEvent(eventData)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching event:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch event'))
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [id])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant={error ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error ? "Error" : "Acara Tidak Ditemukan"}</AlertTitle>
          <AlertDescription>
            {error ? error.message : `Acara dengan ID ${id} tidak ditemukan atau belum dibuat.`}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Kembali
          </Button>
          <Button
            variant="default"
            className="ml-2"
            onClick={() => router.push("/dashboard/events")}
          >
            Lihat Daftar Acara
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Acara</h1>
      {event ? (
        <EventFormClient event={event} isEditing={true} />
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Acara tidak ditemukan</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
