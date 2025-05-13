"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Edit,
  Trash2,
  Download,
  Loader2,
  AlertCircle,
  Upload,
  ImageIcon,
} from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useEvent, useEventAttendance, useEventMutations } from "@/hooks/useEvents"
import { UploadPhotosModal } from "@/components/events/upload-photos-modal"
import { MeetingMinutesList } from "@/components/events/meeting-minutes-list"
import { GallerySimple } from "@/components/events/gallery-simple"
import { AttendanceForm } from "@/components/events/attendance-form"
import { FeedbackList } from "@/components/events/feedback-list"
import { format, parseISO, isValid } from "date-fns"

export default function EventPageClient({ id }: { id: string }) {
  const router = useRouter()
  const eventId = id

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Fetch event data with refetch capability
  const { data: event, isLoading, isError, error, refetch } = useEvent(eventId)

  // Get attendance data with refetch capability
  const { data: attendanceData, refetch: refetchAttendance } = useEventAttendance(eventId)
  const attendanceArray = Array.isArray(attendanceData) ? attendanceData : []

  // Get mutations
  const { deleteEvent } = useEventMutations()

  // Format date for display
  const formatEventDate = (dateString?: string) => {
    if (!dateString) return "Tanggal tidak tersedia"

    try {
      const date = parseISO(dateString)
      if (!isValid(date)) return dateString
      return format(date, "dd MMMM yyyy")
    } catch (e) {
      return dateString
    }
  }

  // Handle delete event
  const handleDeleteEvent = () => {
    if (!event) return

    deleteEvent.mutate(event.id, {
      onSuccess: () => {
        router.push("/dashboard/events")
      },
    })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state or fallback for non-existent events
  if (isError || !event) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant={isError ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{isError ? "Error" : "Acara Tidak Ditemukan"}</AlertTitle>
          <AlertDescription>
            {isError && error instanceof Error
              ? error.message
              : !event
                ? `Acara dengan ID ${id} tidak ditemukan atau belum dibuat.`
                : "Gagal memuat data acara. Silakan coba lagi."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          {isError && <Button onClick={() => refetch()}>Coba Lagi</Button>}
          <Button
            variant="outline"
            className={isError ? "ml-2" : ""}
            onClick={() => router.push("/dashboard/events")}
          >
            Kembali ke Daftar Acara
          </Button>
          <Button
            variant="default"
            className="ml-2"
            onClick={() => router.push("/dashboard/events/new")}
          >
            Buat Acara Baru
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-medium">{event.title}</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Acara</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-2">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Tanggal</p>
                <p>{formatEventDate(event.date)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Waktu</p>
                <p>{event.time || "Waktu tidak tersedia"}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Lokasi</p>
                <p>{event.location || "Lokasi tidak tersedia"}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Status</p>
                <Badge variant={event.status === "selesai" ? "success" : "status"}>
                  {event.status === "akan datang" ? "Akan Datang" : event.status === "selesai" ? "Selesai" : event.status}
                </Badge>
              </div>
            </div>
          </div>
          <div>
            <p className="font-medium mb-2">Deskripsi</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="minutes">Notulensi</TabsTrigger>
          <TabsTrigger value="gallery">Galeri</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Daftar Hadir</h2>
          </div>
          <AttendanceForm
            eventId={event.id}
            attendees={attendanceArray.map(a => ({
              ...a,
              // Ensure we have a name field for backward compatibility
              name: a.member_name || "Tidak ada nama"
            }))}
            onRefresh={() => {
              // Refresh both event and attendance data
              refetchAttendance();
              refetch();
            }}
          />
        </TabsContent>
        <TabsContent value="minutes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Notulensi Rapat</h2>
          </div>
          <MeetingMinutesList eventId={event.id} />
        </TabsContent>
        <TabsContent value="gallery" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Galeri Foto</h2>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Unggah Foto
            </Button>
          </div>
          <GallerySimple eventId={event.id} />
        </TabsContent>
        <TabsContent value="feedback" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Feedback Anggota</h2>
          </div>
          <FeedbackList eventId={event.id} isAdmin={true} />
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
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
            <AlertDialogAction onClick={handleDeleteEvent} disabled={deleteEvent.isPending}>
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

      {/* Upload photos modal */}
      <UploadPhotosModal
        eventId={Number(event.id)}
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  )
}
