"use client"

import { useState } from "react"
// import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  Calendar,
  Clock,
  Edit,
  FileText,
  MapPin,
  MessageSquare,
  Trash2,
  Upload,
  Users
} from "lucide-react"
import { FeedbackList } from "@/components/events/feedback-list"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { type Event } from "@/lib/api-service" // Updated path

interface EventDetailProps {
  event: Event
  isLoading?: boolean
  error?: Error | null
  onEdit?: () => void
  onDelete?: () => void
}

export function EventDetail({
  event,
  isLoading = false,
  error = null,
  onEdit,
  onDelete
}: EventDetailProps) {
  // const router = useRouter() // Commented out as it's not being used
  const [activeTab, setActiveTab] = useState("details")

  // Format date for display
  const formatEventDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "EEEE, dd MMMM yyyy", { locale: id })
    } catch (error) {
      return dateString
    }
  }

  // Format time for display
  const formatEventTime = (timeString: string) => {
    try {
      // If it's a full ISO string, extract just the time
      if (timeString.includes("T")) {
        return format(parseISO(timeString), "HH:mm", { locale: id })
      }

      // If it's just a time string like "14:30:00"
      const timeParts = timeString.split(":")
      if (timeParts.length >= 2) {
        return `${timeParts[0]}:${timeParts[1]}`
      }

      return timeString
    } catch (error) {
      return timeString
    }
  }

  // Get status badge variant
  const getStatusVariant = (status: string): "status" | "success" | "warning" | "info" => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("akan datang")) {
      return "status"
    } else if (statusLower.includes("selesai")) {
      return "success"
    }
    return "info"
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        <Skeleton className="h-12 w-full" />

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-medium">{event.title}</h1>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Detail</TabsTrigger>
          <TabsTrigger value="attendees">Peserta</TabsTrigger>
          <TabsTrigger value="minutes">Notulensi</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Acara</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Deskripsi</h3>
                      <p className="mt-1">{event.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Tanggal</h4>
                          <p>{formatEventDate(event.date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Waktu</h4>
                          <p>{formatEventTime(event.time)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Lokasi</h4>
                          <p>{event.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Peserta</h4>
                          <p>{event.attendees || 0} orang</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-24">
                    <Badge variant={getStatusVariant(event.status)} className="text-lg px-4 py-2">
                      {event.status}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-2">
                      Terakhir diperbarui: {format(parseISO(event.updated_at), "dd MMM yyyy", { locale: id })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {event.photos && event.photos.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Foto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {event.photos.map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.photo_url}
                          alt="Foto acara"
                          className="rounded-md object-cover w-full h-24"
                        />
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      <Upload className="mr-2 h-4 w-4" /> Unggah Foto
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attendees">
          <Card>
            <CardHeader>
              <CardTitle>Peserta</CardTitle>
              <CardDescription>Daftar peserta yang menghadiri acara ini</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-6 text-muted-foreground">
                Fitur manajemen peserta akan segera hadir
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minutes">
          <Card>
            <CardHeader>
              <CardTitle>Notulensi Rapat</CardTitle>
              <CardDescription>Catatan dan hasil rapat dari acara ini</CardDescription>
            </CardHeader>
            <CardContent>
              {(event as any).minutes ? (
                <div className="prose max-w-none">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium m-0">Notulensi</h3>
                  </div>
                  <p className="whitespace-pre-line">{(event as any).minutes}</p>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Belum ada notulensi untuk acara ini</p>
                  {onEdit && (
                    <Button variant="outline" onClick={onEdit} className="mt-4">
                      <Edit className="mr-2 h-4 w-4" /> Tambahkan Notulensi
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Anggota</CardTitle>
              <CardDescription>Komentar dan saran dari anggota tentang acara ini</CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackList eventId={event.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
