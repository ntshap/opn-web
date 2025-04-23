"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api-client"

// Define the exact structure from the backend
interface BackendEvent {
  id: number
  title: string
  description: string
  date: string
  location: string
  status: string
  created_at: string
  updated_at: string
}

export function BackendEvents() {
  const [events, setEvents] = useState<BackendEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // No sample data - we'll only use real data from the backend

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)

        // Use the local API proxy instead of direct backend call
        const response = await fetch('/api/v1/events', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('Raw backend events data:', data)

        // Use the data exactly as it comes from the backend
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data)
          setError(null)
        } else {
          // If no events, set empty array
          setEvents([])
          setError(null)
        }
      } catch (err) {
        console.error("Error in events component:", err)
        // Don't use sample data, just show error
        setEvents([])
        setError("Gagal memuat data acara dari server")
        toast({
          title: "Error",
          description: "Gagal memuat data acara. Silakan coba lagi nanti.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [toast])

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "dd MMM yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Acara Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Tidak ada acara yang ditemukan</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 font-medium text-gray-500 pb-2">
              <div>Nama Acara</div>
              <div className="text-right">Tanggal</div>
            </div>
            {events.map((event) => (
              <div key={event.id} className="grid grid-cols-2 border-b pb-4">
                <div className="font-medium">{event.title}</div>
                <div className="text-right">{formatDate(event.date)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
