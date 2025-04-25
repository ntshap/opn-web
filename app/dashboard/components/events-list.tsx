"use client"

import { useState, useEffect } from "react"
import { Eye, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useEventMutations } from "@/hooks/useEvents"
import { DeleteConfirmationDialog } from "@/components/dashboard/delete-confirmation-dialog"

interface Event {
  id: number
  title: string
  description: string
  date: string
  time: string
  location: string
  status: string
  created_at: string
  updated_at: string
  photos: any[]
  attendees: number[]
}

export function EventsList() {
  const router = useRouter()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Get event mutations
  const { deleteEvent } = useEventMutations()

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)

        // Get token from localStorage
        const token = localStorage.getItem('token')

        if (!token) {
          console.error("No authentication token found")
          setError("Authentication required")
          return
        }

        // Use the local API proxy instead of direct backend call
        const response = await fetch('/api/v1/events/?limit=5', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('Events data:', data)

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

  const handleViewEvent = (event: Event) => {
    router.push(`/dashboard/events/${event.id}`)
  }

  const handleEditEvent = (event: Event) => {
    router.push(`/dashboard/events/edit/${event.id}`)
  }

  const handleDeleteEvent = (event: Event) => {
    setSelectedEvent(event)
    setShowDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setSelectedEvent(null)
    setShowDeleteDialog(false)
  }

  const handleConfirmDelete = async () => {
    if (!selectedEvent) return

    try {
      await deleteEvent.mutateAsync(selectedEvent.id)
      handleCloseDeleteDialog()
      toast({
        title: "Acara dihapus",
        description: "Acara telah berhasil dihapus.",
      })

      // Refresh the events list
      setEvents(events.filter(e => e.id !== selectedEvent.id))
    } catch (error) {
      toast({
        title: "Kesalahan",
        description: "Gagal menghapus acara. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{error}</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Belum ada acara yang dibuat.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard/events/new')}
        >
          Buat Acara Baru
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{event.title}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="truncate">
                  {format(new Date(event.date), 'dd MMM yyyy')} • {event.location}
                </span>
              </div>
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600" style={{ fontWeight: 400 }}>
                  {event.status === 'akan datang' ? 'Akan Datang' : 'Selesai'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewEvent(event)}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditEvent(event)}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteEvent(event)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      {selectedEvent && (
        <DeleteConfirmationDialog
          show={showDeleteDialog}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          title="Hapus Acara"
          description={`Apakah Anda yakin ingin menghapus "${selectedEvent.title}"? Tindakan ini tidak dapat dibatalkan.`}
        />
      )}
    </div>
  )
}
