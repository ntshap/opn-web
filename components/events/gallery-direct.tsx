"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Download, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { UploadPhotosModal } from "./upload-photos-modal"
import { SecureImage } from "@/components/shared/SecureImage"

interface GalleryDirectProps {
  eventId: string | number
}

interface EventPhoto {
  id: number
  photo_url: string
  uploaded_at: string
  caption?: string
}

export function GalleryDirect({ eventId }: GalleryDirectProps) {
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const fetchPhotos = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log(`Fetching photos for event ${eventId}`)

      // Use direct backend URL instead of local API proxy
      const response = await fetch(`https://beopn.penaku.site/api/v1/events/${eventId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Event response:", data)

      if (data && data.photos) {
        // Make sure we have valid photo objects
        const validPhotos = data.photos
          .filter(photo => photo && photo.photo_url) // Filter out invalid photos
          .map(photo => ({
            ...photo,
            // Ensure photo_url is a string
            photo_url: typeof photo.photo_url === 'string' ? photo.photo_url : '',
            // Ensure uploaded_at is a valid date string
            uploaded_at: photo.uploaded_at || new Date().toISOString()
          }))

        console.log("Valid photos:", validPhotos)
        setPhotos(validPhotos)
      } else {
        setPhotos([])
      }
    } catch (err) {
      console.error("Error fetching photos:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [eventId])

  const handleUploadPhotos = () => {
    setIsUploadModalOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Foto Acara</CardTitle>
          <Button variant="outline" size="sm" onClick={handleUploadPhotos}>
            <Upload className="mr-2 h-4 w-4" />
            Unggah Foto
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40 text-red-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
                  {/* Use SecureImage component for authenticated image loading */}
                  <SecureImage
                    src={photo.photo_url}
                    alt={`Foto acara ${photo.id}`}
                    width="100%"
                    height="100%"
                    className="absolute inset-0 w-full h-full object-cover"
                    fallbackSrc="/placeholder.svg"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                    {photo.caption || `Foto ${photo.id}`}
                    <div className="text-xs opacity-75">
                      {new Date(photo.uploaded_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Belum ada foto yang diunggah untuk acara ini.</p>
              <Button variant="outline" className="mt-4" onClick={handleUploadPhotos}>
                <Upload className="mr-2 h-4 w-4" />
                Unggah Foto Pertama
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadPhotosModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        eventId={eventId}
        onSuccess={() => {
          // Refetch photos after successful upload
          fetchPhotos()
        }}
      />
    </>
  )
}
