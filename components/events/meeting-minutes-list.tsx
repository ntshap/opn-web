import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Plus, AlertCircle, Lock, FileText, Trash } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { useMeetingMinutesByEvent, useMeetingMinutesMutations } from "@/hooks/useMeetingMinutes"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MeetingMinutesForm } from "./meeting-minutes-form"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { TipTapContent } from "@/components/ui/tiptap-editor"
import { generateStorageKey, STORAGE_KEYS, formatDate } from "@/lib/utils"
import { ErrorBoundary } from "react-error-boundary"

interface MeetingMinutesListProps {
  eventId: number
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        <p>Something went wrong loading the meeting minutes:</p>
        <pre>{error.message}</pre>
        <Button onClick={resetErrorBoundary} variant="outline" className="mt-4">
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function MeetingMinutesListContent({ eventId }: MeetingMinutesListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMinute, setEditingMinute] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Fetch meeting minutes for this event
  const { data: meetingMinutes, isLoading, error, refetch } = useMeetingMinutesByEvent(eventId)
  const { createMeetingMinutes, updateMeetingMinutes, deleteMeetingMinutes } = useMeetingMinutesMutations()

  // Get local storage minutes - only run this once on component mount
  const [localStorageMinutes, setLocalStorageMinutes] = useState<any[]>([])

  // Load local storage minutes only once on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedMinutesString = localStorage.getItem(`event_${eventId}_minutes`)
      if (storedMinutesString) {
        const parsedMinutes = JSON.parse(storedMinutesString)
        console.log('%c Loaded local storage minutes:', 'background: #00f; color: #fff', parsedMinutes)
        setLocalStorageMinutes(parsedMinutes)
      }
    } catch (error) {
      console.error('%c Error reading from local storage:', 'background: #f00; color: #fff', error)
    }
  }, [eventId]) // Only depend on eventId

  // Use API minutes directly, no need to combine with local storage
  const combinedMinutes = useMemo(() => {
    // Get meeting minutes from API
    const apiMinutes = meetingMinutes || []
    console.log('API minutes for event ID', eventId, ':', apiMinutes)

    // Filter minutes to ensure they belong to this event
    const filteredMinutes = apiMinutes.filter(minute => minute.event_id === Number(eventId))
    console.log('Filtered minutes for event ID', eventId, ':', filteredMinutes)

    return filteredMinutes;
  }, [meetingMinutes, eventId])

  // Clean up local storage if all local minutes are now in API
  useEffect(() => {
    if (typeof window === 'undefined' || !meetingMinutes || localStorageMinutes.length === 0) return;

    // Check if all local minutes are now in API
    const allInApi = localStorageMinutes.every(localMinute =>
      meetingMinutes.some(apiMinute =>
        apiMinute.id === localMinute.id ||
        (apiMinute.title === localMinute.title && apiMinute.event_id === localMinute.event_id)
      )
    )

    if (allInApi) {
      console.log('%c All local minutes now in API, clearing local storage', 'background: #0f0; color: #000')
      localStorage.removeItem(`event_${eventId}_minutes`)
      // Update local storage minutes state to empty array
      setLocalStorageMinutes([])
    }
  }, [eventId, meetingMinutes, localStorageMinutes])

  // Handle manual refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      console.log('Manually refreshing meeting minutes for event ID:', eventId)
      await refetch()
      console.log('Manual refresh completed')
      toast({
        title: "Berhasil",
        description: "Data notulensi berhasil diperbarui",
      })
    } catch (error) {
      console.error('Error refreshing meeting minutes:', error)
      toast({
        title: "Gagal",
        description: "Gagal memperbarui data notulensi",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMMM yyyy", { locale: id })
    } catch (error) {
      return dateString
    }
  }

  // Handle form submission for creating new meeting minutes
  const handleCreateMinutes = (data: any) => {
    try {
      console.log('Creating meeting minutes with data:', data)
      console.log('Event ID:', eventId, 'Type:', typeof eventId)

      // Format the data as expected by the API
      const formattedData = {
        ...data,
        // Date should already be formatted as YYYY-MM-DD by the form
        date: data.date,
        // Ensure event_id is the correct number from the component prop
        event_id: Number(eventId),
        // Handle empty document URL
        document_url: data.document_url || 'https://example.com/',
        // Ensure description is a string
        description: data.description || ''
      }

      console.log('Formatted data:', formattedData)
      console.log('Event ID in formatted data:', formattedData.event_id, 'Type:', typeof formattedData.event_id)
      console.log('%c Current event ID from component prop:', 'background: #ff0; color: #000', eventId, 'Type:', typeof eventId)
      console.log('%c Date in formatted data:', 'background: #ff0; color: #000', formattedData.date, 'Type:', typeof formattedData.date)

      // Immediately add to local storage for instant display (only in browser environment)
      if (typeof window !== 'undefined') {
        try {
          // Create a temporary ID for the local entry
          const tempId = `temp_${Date.now()}`

          // Create a temporary meeting minutes object
          const tempMinute = {
            ...formattedData,
            id: tempId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Add to our local state directly for immediate display
          setLocalStorageMinutes(prev => [...prev, tempMinute])

          // Also save to localStorage for persistence
          const storedMinutes = localStorage.getItem(`event_${eventId}_minutes`)
            ? JSON.parse(localStorage.getItem(`event_${eventId}_minutes`) || '[]')
            : [];

          // Add the new meeting minutes to the array
          storedMinutes.push(tempMinute);

          // Save back to local storage
          localStorage.setItem(`event_${eventId}_minutes`, JSON.stringify(storedMinutes));
          console.log('%c Added temporary meeting minutes to local storage:', 'background: #0f0; color: #000', tempMinute);
        } catch (error) {
          console.error('%c Error adding temporary meeting minutes to local storage:', 'background: #f00; color: #fff', error);
        }
      }

      // Validate required fields
      if (!formattedData.title) {
        toast({
          title: "Validasi Gagal",
          description: "Judul notulensi harus diisi",
          variant: "destructive",
        })
        return;
      }

      if (!formattedData.description) {
        toast({
          title: "Validasi Gagal",
          description: "Deskripsi notulensi harus diisi",
          variant: "destructive",
        })
        return;
      }

      // First close the dialog to improve UX
      setIsDialogOpen(false)

      // Then create the meeting minutes
      createMeetingMinutes.mutate(formattedData, {
        onSuccess: async (data) => {
          console.log('%c Meeting minutes created successfully:', 'background: #0f0; color: #000', data)
          console.log('%c Created meeting minutes for event ID:', 'background: #0f0; color: #000', data.event_id)

          // Show success toast
          toast({
            title: "Berhasil",
            description: "Notulensi berhasil dibuat",
          })

          // Refetch the data instead of reloading the page
          console.log('%c Meeting minutes created successfully, refetching data', 'background: #0f0; color: #000');
          refetch();

          // Clear local storage entries for this event
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`event_${eventId}_minutes`);
            // Update our local state
            setLocalStorageMinutes([]);
          }
        },
        onError: (error) => {
          console.error('Error creating meeting minutes:', error)

          // Show more specific error messages based on the error type
          let errorMessage = "Terjadi kesalahan saat membuat notulensi";

          if (error instanceof Error) {
            // Use the error message from the API if available
            errorMessage = error.message;
          }

          toast({
            title: "Gagal",
            description: errorMessage,
            variant: "destructive",
          })

          // Keep the dialog open so the user can try again
          // setIsDialogOpen(false)
        }
      })
    } catch (error) {
      console.error('Error in handleCreateMinutes:', error)
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat memproses data notulensi",
        variant: "destructive",
      })
    }
  }

  // Handle editing meeting minutes
  const handleEditMinutes = (minute: any) => {
    console.log('Editing meeting minute with ID:', minute.id, 'and data:', minute)
    setEditingMinute(minute)
    setIsEditDialogOpen(true)
  }

  // Handle update meeting minutes
  const handleUpdateMinutes = async (data: any) => {
    try {
      if (!editingMinute) return;

      console.log('Updating meeting minutes with description:', data.description)
      console.log('Minute ID:', editingMinute.id)

      // Show loading toast
      toast({
        title: "Memperbarui...",
        description: "Sedang memperbarui notulensi",
      });

      try {
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Make sure we have the correct ID
        const minuteId = editingMinute.id;
        console.log('Using meeting minute ID for update:', minuteId);

        // Create a new meeting minute with the updated data
        const createResponse = await fetch(`/api/v1/meeting-minutes/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: editingMinute.title, // Keep the original title
            description: data.description || '',
            date: typeof editingMinute.date === 'string' ? editingMinute.date : new Date(editingMinute.date).toISOString().split('T')[0],
            document_url: editingMinute.document_url || '',
            event_id: Number(eventId)
          })
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error(`Error response from server when creating: ${createResponse.status} ${createResponse.statusText}`, errorText);
          throw new Error(`Failed to create new meeting minutes: ${createResponse.status} ${createResponse.statusText}`);
        }

        // Parse the response
        const createResponseData = await createResponse.json();
        console.log('Create successful, response:', createResponseData);

        // Now delete the old meeting minute
        const deleteResponse = await fetch(`/api/v1/meeting-minutes/${minuteId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!deleteResponse.ok) {
          console.error(`Error response from server when deleting: ${deleteResponse.status} ${deleteResponse.statusText}`);
          // Even if delete fails, we've still created a new one, so we can continue
        } else {
          console.log('Delete successful');
        }

        // Close the dialog and show success message
        setIsEditDialogOpen(false);
        setEditingMinute(null);

        // Refetch the data
        refetch();

        // Show success toast
        toast({
          title: "Berhasil",
          description: "Notulensi berhasil diperbarui",
        });
      } catch (error: any) {
        console.error('Error updating meeting minutes:', error);

        // Show more specific error messages based on the error type
        let errorMessage = "Terjadi kesalahan saat memperbarui notulensi";

        if (error instanceof Error) {
          // Use the error message from the API if available
          errorMessage = error.message;
        }

        toast({
          title: "Gagal",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in handleUpdateMinutes:', error);
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat memperbarui notulensi",
        variant: "destructive",
      });
    }
  }

  // Handle deleting meeting minutes
  const handleDeleteMinutes = (id: number) => {
    try {
      deleteMeetingMinutes.mutate(id, {
        onSuccess: () => {
          refetch()
          toast({
            title: "Berhasil",
            description: "Notulensi berhasil dihapus",
          })
        },
        onError: (error) => {
          console.error('Error deleting meeting minutes:', error)

          // Show more specific error messages based on the error type
          let errorMessage = "Terjadi kesalahan saat menghapus notulensi";

          if (error instanceof Error) {
            // Use the error message from the API if available
            errorMessage = error.message;
          }

          toast({
            title: "Gagal",
            description: errorMessage,
            variant: "destructive",
          })
        }
      })
    } catch (error) {
      console.error('Error in handleDeleteMinutes:', error)
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat menghapus notulensi",
        variant: "destructive",
      })
    }
  }

  // If there's an error, show a message with a retry button
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notulensi Rapat</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Terjadi kesalahan saat memuat notulensi rapat. Silakan coba lagi nanti.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Notulensi Rapat</CardTitle>
            <Skeleton className="h-9 w-32" /> {/* Button skeleton */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Skeleton className="h-5 w-40 mb-1" /> {/* Title skeleton */}
                  <Skeleton className="h-4 w-24" /> {/* Date skeleton */}
                </div>
                <Skeleton className="h-8 w-8 rounded-full" /> {/* Action button skeleton */}
              </div>
              <div className="mb-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle>Notulensi Rapat</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="ml-2"
              title="Refresh data"
              disabled={isRefreshing || isLoading}
            >
              {isRefreshing ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Notulensi
              </Button>
            </DialogTrigger>
            <DialogContent
              className="sm:max-w-[600px]"
              onPointerDownOutside={(e) => {
                // Prevent closing when clicking inside the editor
                if (e.target && (e.target as HTMLElement).closest('.tiptap')) {
                  e.preventDefault();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Tambah Notulensi Rapat</DialogTitle>
              </DialogHeader>
              <MeetingMinutesForm
                eventId={Number(eventId)}
                onSubmit={handleCreateMinutes}
                isSubmitting={createMeetingMinutes.isPending}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Meeting Minutes Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent
              className="sm:max-w-[600px]"
              onPointerDownOutside={(e) => {
                // Prevent closing when clicking inside the editor
                if (e.target && (e.target as HTMLElement).closest('.tiptap')) {
                  e.preventDefault();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Edit Notulensi Rapat</DialogTitle>
              </DialogHeader>
              {editingMinute && (
                <MeetingMinutesForm
                  eventId={Number(eventId)}
                  defaultValues={{
                    title: editingMinute.title,
                    description: editingMinute.description,
                    date: new Date(editingMinute.date),
                    document_url: editingMinute.document_url,
                    event_id: Number(eventId)
                  }}
                  onSubmit={handleUpdateMinutes}
                  isSubmitting={updateMeetingMinutes.isPending}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && combinedMinutes.length === 0 ? (
          <div className="text-center py-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              <p className="text-muted-foreground">Memuat notulensi...</p>
            </div>
          </div>
        ) : combinedMinutes.length > 0 ? (
          <div className="space-y-4">
            {combinedMinutes.map((minutes) => (
              <div key={minutes.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{minutes.title}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(minutes.date)}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditMinutes(minutes)}
                      title="Edit Notulensi"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Hapus Notulensi">
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Notulensi</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus notulensi ini? Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteMinutes(minutes.id)}>
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="mb-3 prose max-w-none">
                  {minutes.description && minutes.description.trim() !== '' ? (
                    <div className="meeting-minutes-content" dangerouslySetInnerHTML={{ __html: minutes.description }} />
                  ) : (
                    <p className="text-gray-500 italic">Tidak ada deskripsi</p>
                  )}
                </div>
                {minutes.document_url && (
                  <a
                    href={minutes.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-600 hover:underline"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Lihat Dokumen
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <FileText className="h-16 w-16 text-gray-300" />
              <p className="text-muted-foreground mb-4">Belum ada notulensi untuk acara ini</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Tambah Notulensi
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MeetingMinutesList(props: MeetingMinutesListProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <MeetingMinutesListContent {...props} />
    </ErrorBoundary>
  )
}
