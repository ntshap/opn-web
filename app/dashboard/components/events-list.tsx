"use client"

import { useState, useEffect } from "react"
import { Eye, Edit, Trash2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useEventMutations } from "@/hooks/useEvents"
import { DeleteConfirmationDialog } from "@/components/dashboard/delete-confirmation-dialog"
import { apiClient } from "@/lib/api-client"

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

// Define pagination metadata interface
interface PaginationMeta {
  page: number;
  limit: number;
  total_pages: number;
  total_count?: number; // Total number of items across all pages
}

export function EventsList() {
  const router = useRouter()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // Add a refresh key to force re-fetch
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null)

  // Get event mutations
  const { deleteEvent } = useEventMutations()

  // Function to manually refresh the events list
  const refreshEvents = () => {
    setIsLoading(true)
    setCurrentPage(1) // Reset to first page
    setRefreshKey(prevKey => prevKey + 1)
    toast({
      title: "Memperbarui data",
      description: "Sedang memuat data acara terbaru...",
    })
  }

  // Function to change page
  const changePage = (page: number) => {
    if (page < 1 || (paginationMeta && page > paginationMeta.total_pages)) {
      return
    }

    setIsLoading(true)
    setCurrentPage(page)
    setRefreshKey(prevKey => prevKey + 1)
  }

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        console.log("Fetching events for dashboard...")

        // Get token from localStorage
        const token = localStorage.getItem('token')

        if (!token) {
          console.error("No authentication token found")
          setError("Authentication required")
          return
        }

        // Make a direct fetch call to ensure we're getting the raw response
        try {
          // Use the updated API format with pagination parameters
          const response = await fetch(`https://beopn.penaku.site/api/v1/events/?page=${currentPage}&limit=10`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }

          // Get the raw text first to inspect it
          const rawText = await response.text();
          console.log('Raw API response:', rawText);

          // Try to parse as JSON
          let responseData;
          try {
            responseData = JSON.parse(rawText);
            console.log('Parsed events data:', responseData);
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            throw new Error('Invalid JSON response from server');
          }

          // Handle the new response format with metadata
          let eventsData = [];
          let paginationMeta = null;

          console.log('Response structure:', Object.keys(responseData));

          // The new format should have data array and meta object
          if (responseData && typeof responseData === 'object') {
            // Check if the response has the expected structure
            if (Array.isArray(responseData)) {
              // If it's directly an array (old format)
              console.log('Response is an array with', responseData.length, 'items (old format)');
              eventsData = responseData;
            } else {
              // New format with data and meta
              if (Array.isArray(responseData.data)) {
                console.log('Response has data array with', responseData.data.length, 'items');
                eventsData = responseData.data;

                // Extract pagination metadata if available
                if (responseData.meta && typeof responseData.meta === 'object') {
                  paginationMeta = responseData.meta;
                  console.log('Pagination metadata:', paginationMeta);

                  // Save pagination metadata to state
                  setPaginationMeta(paginationMeta);
                }
              } else {
                // If data is not an array, look for any array in the response
                console.log('Looking for arrays in response object');
                const arrayProps = Object.entries(responseData)
                  .filter(([_, value]) => Array.isArray(value))
                  .map(([key, value]) => ({ key, length: (value as any[]).length }));

                console.log('Found array properties:', arrayProps);

                if (arrayProps.length > 0) {
                  // Use the first array found
                  const firstArrayKey = arrayProps[0].key;
                  eventsData = responseData[firstArrayKey];
                  console.log(`Using array from property '${firstArrayKey}' with ${eventsData.length} items`);
                } else {
                  console.log('No arrays found in response');
                }
              }
            }
          }

          console.log('Final processed events data:', eventsData);

          // Sort events by date (newest first)
          const sortedEvents = [...eventsData].sort((a, b) => {
            // Try to parse dates and compare them
            try {
              const dateA = new Date(a.date);
              const dateB = new Date(b.date);
              // Sort in descending order (newest first)
              return dateB.getTime() - dateA.getTime();
            } catch (e) {
              console.error('Error sorting dates:', e);
              return 0;
            }
          });

          console.log('Sorted events (newest first):', sortedEvents.map(e => e.date));

          // Set the events data
          setEvents(sortedEvents);
          setError(null);
        } catch (apiError) {
          console.error("API error:", apiError);
          throw apiError; // Re-throw to be caught by the outer catch block
        }
      } catch (err) {
        console.error("Error in events component:", err);
        // Don't use sample data, just show error
        setEvents([]);

        // Provide more detailed error message for debugging
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Detailed error:", errorMessage);

        setError("Gagal memuat data acara dari server");
        toast({
          title: "Error",
          description: "Gagal memuat data acara. Silakan coba lagi nanti.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [toast, refreshKey, currentPage]); // Include currentPage in dependencies

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
        <Button
          variant="outline"
          className="mt-4"
          onClick={refreshEvents}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Coba Lagi
        </Button>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Belum ada acara yang dapat ditampilkan.</p>
        <p className="text-sm mt-1 mb-4">
          {isLoading ? "Sedang memuat data..." : "Silakan buat acara baru atau refresh untuk melihat data terbaru."}
        </p>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            className="mt-2"
            onClick={refreshEvents}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => router.push('/dashboard/events/new')}
          >
            Buat Acara Baru
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {paginationMeta && paginationMeta.total_count !== undefined
            ? `${events.length} dari ${paginationMeta.total_count} acara`
            : `${events.length} acara ditemukan`}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshEvents}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

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

        {/* Pagination UI */}
        {paginationMeta && paginationMeta.total_pages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <div className="text-sm text-muted-foreground">
              Halaman {paginationMeta.page} dari {paginationMeta.total_pages}
              {paginationMeta.total_count !== undefined && ` (Total: ${paginationMeta.total_count} acara)`}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </Button>

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, paginationMeta.total_pages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum;
                  if (paginationMeta.total_pages <= 5) {
                    // If 5 or fewer pages, show all
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    // If near start, show first 5
                    pageNum = i + 1;
                  } else if (currentPage >= paginationMeta.total_pages - 2) {
                    // If near end, show last 5
                    pageNum = paginationMeta.total_pages - 4 + i;
                  } else {
                    // Show 2 before and 2 after current
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => changePage(pageNum)}
                      disabled={isLoading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage >= paginationMeta.total_pages || isLoading}
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
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
