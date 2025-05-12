"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
// Badge styling is now handled via CSS classes
import { format, parseISO } from "date-fns"
import { Calendar, Plus, Loader2, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, UserCheck } from "lucide-react"

import { useEvents, useSearchEvents, useEventMutations } from "@/hooks/useEvents"
import type { Event } from "@/lib/api-service" // Updated path
import { EventSearchForm, type EventSearchParams } from "@/components/events/event-search-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AttendancePopup } from "@/components/events/attendance-popup"

export default function EventsPageClient() {
  const router = useRouter()
  const [searchFilters, setSearchFilters] = useState<EventSearchParams>({})
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<"grid" | "table">("table")

  // State for attendance popup
  const [attendanceEvent, setAttendanceEvent] = useState<Event | null>(null)
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)

  // Get events data
  const {
    data: events = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useEvents(currentPage, itemsPerPage)

  // Get event mutations
  const { deleteEvent } = useEventMutations()

  // Search events with filters
  const { data: searchResults = [], isLoading: isSearching } = useSearchEvents(
    {
      ...searchFilters,
      page: currentPage,
      limit: itemsPerPage
    },
    {
      enabled: Object.keys(searchFilters).length > 0,
    }
  )

  // Handle search form submission
  const handleSearch = (filters: EventSearchParams) => {
    setSearchFilters(filters)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle search reset
  const handleResetSearch = () => {
    setSearchFilters({})
  }

  // Determine which events to display
  const displayedEvents = Object.keys(searchFilters).length > 0 ? searchResults : events

  // Format date for display
  const formatEventDate = (dateString?: string) => {
    if (!dateString) return "Tanggal tidak tersedia"

    try {
      const date = parseISO(dateString)
      return format(date, "dd MMMM yyyy")
    } catch (e) {
      return dateString
    }
  }

  // Handle delete event
  const handleDeleteEvent = (event: Event) => {
    setEventToDelete(event)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteEvent = () => {
    if (!eventToDelete) return

    deleteEvent.mutate(eventToDelete.id, {
      onSuccess: () => {
        // Rely on invalidateQueries in the hook's onSettled callback
        setIsDeleteDialogOpen(false)
        setEventToDelete(null)
        // refetch() // Removed redundant refetch
      },
    })
  }

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    // Check if there are more pages to navigate to
    // We'll assume there are more pages if the current page has a full set of items
    if (events.length >= itemsPerPage) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Function to change page directly
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle opening attendance popup
  const handleOpenAttendance = (event: Event) => {
    setAttendanceEvent(event)
    setIsAttendanceOpen(true)
  }

  // Handle closing attendance popup
  const handleCloseAttendance = () => {
    setAttendanceEvent(null)
    setIsAttendanceOpen(false)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Gagal memuat data acara. Silakan coba lagi."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => refetch()}>Coba Lagi</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-medium">Daftar Acara</h1>
        <button
          onClick={() => router.push("/dashboard/events/new")}
          className="flex items-center text-blue-600 py-2 px-3 sm:px-4 rounded text-sm sm:text-base"
          style={{
            backgroundColor: '#e0f2fe',
            border: 'none',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            fontWeight: 400
          }}
        >
          <Plus className="mr-1 sm:mr-2 h-4 w-4" />
          Buat Acara Baru
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-full">
          <EventSearchForm
            onSearch={handleSearch}
            isSearching={isSearching}
            onReset={handleResetSearch}
          />
        </div>
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "table")}>
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Mencari...</span>
        </div>
      )}

      {!isSearching && displayedEvents.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium mb-2">Tidak ada acara</h2>
          <p className="text-muted-foreground mb-6">
            {Object.keys(searchFilters).length > 0 ? "Tidak ada acara yang sesuai dengan pencarian Anda." : "Belum ada acara yang dibuat."}
          </p>
          {Object.keys(searchFilters).length > 0 ? (
            <Button variant="outline" onClick={handleResetSearch}>
              Hapus Pencarian
            </Button>
          ) : (
            <button
              onClick={() => router.push("/dashboard/events/new")}
              className="flex items-center text-white font-medium py-2 px-4 rounded"
              style={{
                backgroundColor: '#2563eb',
                border: 'none',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Buat Acara Baru
            </button>
          )}
        </div>
      )}

      {!isSearching && displayedEvents.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatEventDate(event.date)}
                  {event.time && ` • ${event.time}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                <div className="flex items-center mt-2">
                  {/* Use custom badge variants for better readability */}
                  <button
                    className="font-medium py-1 px-3 rounded"
                    style={{
                      backgroundColor: event.status === "selesai" ? "#dcfce7" : "#dbeafe",
                      border: "none",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      color: event.status === "selesai" ? "#166534" : "#1e40af"
                    }}
                  >
                    {event.status === "akan datang" ? "Akan Datang" : event.status === "selesai" ? "Selesai" : event.status}
                  </button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/events/${event.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Detail
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteEvent(event)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isSearching && displayedEvents.length > 0 && viewMode === "table" && (
        <div className="rounded-md border responsive-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Acara</TableHead>
                <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                <TableHead className="hidden md:table-cell">Lokasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    {event.title}
                    <div className="sm:hidden text-xs text-muted-foreground mt-1">
                      {formatEventDate(event.date)}
                      {event.time && ` • ${event.time}`}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatEventDate(event.date)}
                    {event.time && ` • ${event.time}`}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{event.location}</TableCell>
                  <TableCell>
                    <button
                      className="py-1 px-2 sm:px-3 rounded text-xs sm:text-sm"
                      style={{
                        backgroundColor: event.status === "selesai" ? "#dcfce7" : "#dbeafe",
                        color: event.status === "selesai" ? "#166534" : "#1e40af",
                        border: "none",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                        fontWeight: 400
                      }}
                    >
                      {event.status === "akan datang" ? "Akan Datang" : event.status === "selesai" ? "Selesai" : event.status}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1 sm:space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        onClick={() => handleOpenAttendance(event)}
                      >
                        <UserCheck className="h-4 w-4" />
                        <span className="sr-only">Attendance</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        onClick={() => router.push(`/dashboard/events/${event.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        onClick={() => handleDeleteEvent(event)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {Object.keys(searchFilters).length === 0 && displayedEvents.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Menampilkan {displayedEvents.length} acara
            </p>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => {
                setItemsPerPage(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[60px] sm:h-9 sm:w-[70px] text-xs sm:text-sm">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial justify-center"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Sebelumnya</span>
            </Button>

            {/* Page number indicator */}
            <span className="text-sm mx-2">
              Halaman {currentPage}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial justify-center"
              onClick={handleNextPage}
              disabled={displayedEvents.length < itemsPerPage || isLoading}
            >
              <span className="mr-1 hidden sm:inline">Selanjutnya</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Acara</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus acara ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEvent} disabled={deleteEvent.isPending}>
              {deleteEvent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attendance Popup */}
      {attendanceEvent && (
        <AttendancePopup
          eventId={attendanceEvent.id}
          eventName={attendanceEvent.title}
          open={isAttendanceOpen}
          onClose={handleCloseAttendance}
        />
      )}
    </div>
  )
}
