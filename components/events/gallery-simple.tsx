"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ImageIcon, AlertCircle, Loader2, Download, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { eventApi } from "@/lib/api-events"
import { fileApi } from "@/lib/api-files"
import { formatImageUrl, formatDate } from "@/lib/image-utils"
import { UploadPhotosDirect } from "./upload-photos-direct"
import { ProtectedImage } from "@/components/shared/ProtectedImage"

// Import the API base URL for image fallback
const API_BASE_URL = "https://backend-project-pemuda.onrender.com"

interface GallerySimpleProps {
  eventId: string | number
}

export function GallerySimple({ eventId }: GallerySimpleProps) {
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Memoize the fetchPhotos function to prevent infinite loops
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`[GallerySimple] Fetching photos for event ${eventId}`);

      try {
        // Use the event API to get photos
        const eventPhotos = await eventApi.getEventPhotos(eventId);
        console.log(`[GallerySimple] Fetched ${eventPhotos.length} photos for event ${eventId}`);

        if (eventPhotos && eventPhotos.length > 0) {
          console.log("[GallerySimple] Raw photos from API:", eventPhotos);

          // Process photos to ensure they have the correct URL format
          const processedPhotos = eventPhotos
            .filter(photo => photo && (photo.photo_url || photo.url)) // Filter out invalid photos
            .map(photo => {
              // Get the photo URL (handle both photo_url and url properties)
              const photoUrl = photo.photo_url || photo.url || '';
              console.log("[GallerySimple] Processing photo URL:", photoUrl);

              // Ensure the URL is properly formatted
              let processedUrl = photoUrl;

              // Make sure the URL starts with a slash if it's a relative path
              if (processedUrl && !processedUrl.startsWith('http') && !processedUrl.startsWith('/')) {
                processedUrl = `/${processedUrl}`;
                console.log(`[GallerySimple] Added leading slash to URL: ${processedUrl}`);
              }

              // Handle different URL formats
              if (processedUrl) {
                // Check if the URL is a full path with date format from the backend
                // Example: /uploads/events/2025-04-14/2025-04/1744619396045_0.png
                if (processedUrl.match(/\/uploads\/events\/\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}\/\d+_\d+\.\w+$/)) {
                  console.log(`[GallerySimple] Detected date-based URL pattern: ${processedUrl}`);
                  // This is already a correctly formatted URL, just use it as is
                }
                // If the path doesn't start with /uploads/ but contains 'uploads', fix it
                else if (!processedUrl.startsWith('/uploads/') && processedUrl.includes('uploads')) {
                  const uploadsPart = processedUrl.split('uploads/');
                  if (uploadsPart.length > 1) {
                    processedUrl = `/uploads/${uploadsPart[1]}`;
                    console.log(`[GallerySimple] Fixed uploads path: ${processedUrl}`);
                  }
                }
                // Check if the URL needs the event ID prefix
                else if (!processedUrl.includes(`/events/${eventId}/`)) {
                  // If the URL contains /photos/ but not /events/{eventId}/, add the event ID
                  if (processedUrl.includes('/photos/') && !processedUrl.includes('/events/')) {
                    // Extract the photo ID or filename
                    const photoIdMatch = processedUrl.match(/\/photos\/([^\/]+)/);
                    if (photoIdMatch && photoIdMatch[1]) {
                      const photoIdOrFilename = photoIdMatch[1];
                      // Reconstruct the URL with the event ID
                      processedUrl = processedUrl.replace(
                        /\/photos\/([^\/]+)/,
                        `/events/${eventId}/photos/${photoIdOrFilename}`
                      );
                      console.log(`[GallerySimple] Added event ID to photo URL: ${processedUrl}`);
                    }
                  }
                }
              }

              const processedPhoto = {
                ...photo,
                photo_url: processedUrl,
                // Add event_id if not present
                event_id: photo.event_id || eventId,
                // Ensure the photo has an ID
                id: photo.id || `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
              };

              console.log("[GallerySimple] Processed photo:", processedPhoto);
              return processedPhoto;
            });

          console.log("[GallerySimple] Final processed photos:", processedPhotos);
          // Store the processed photos array
          setPhotos(processedPhotos);
        } else {
          console.log("[GallerySimple] No photos found in response");
          setPhotos([]);
        }
      } catch (err) {
        console.error("[GallerySimple] Error fetching photos:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setPhotos([]);
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Listen for changes to the lastPhotoUpload timestamp, but only on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if there's a lastPhotoUpload in localStorage
      const lastUpload = localStorage.getItem('lastPhotoUpload');
      if (lastUpload) {
        console.log(`[GallerySimple] Detected photo upload timestamp: ${lastUpload}`);
        // We don't need to call fetchPhotos() here since it's already called in the eventId useEffect
      }

      // Create a storage event listener to detect changes from other components
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'lastPhotoUpload' && e.newValue) {
          console.log(`[GallerySimple] Storage event: photo upload timestamp changed to ${e.newValue}`);
          fetchPhotos();
        }
      };

      // Add the event listener
      window.addEventListener('storage', handleStorageChange);

      // Clean up the event listener on unmount
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [fetchPhotos]);

  // Fetch photos when the event ID changes
  useEffect(() => {
    console.log(`[GallerySimple] Event ID changed to ${eventId}, fetching photos`);
    fetchPhotos();
  }, [eventId, fetchPhotos]);

  const handleUploadPhotos = () => {
    setIsUploadModalOpen(true);
  };

  // We'll use the formatImageUrl utility from image-utils.ts

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleUploadPhotos}>
              <Upload className="mr-2 h-4 w-4" />
              Unggah Foto
            </Button>

            {photos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Export all photos as a ZIP file
                  if (process.env.NODE_ENV === 'development') {
                    alert('Fitur ekspor foto sedang dalam pengembangan. Silakan unduh foto satu per satu.');
                  } else {
                    // In production, this would call an API endpoint to generate a ZIP file
                    alert('Mengunduh semua foto...');
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Ekspor Semua
              </Button>
            )}
          </div>
        </div>
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40 text-red-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          ) : photos.length > 0 ? (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">Total foto: {photos.length}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={photo.id || index} className="relative aspect-square rounded-md overflow-hidden border bg-muted group">
                    {/* Image with ProtectedImage component */}
                    <div className="relative w-full h-full">
                      <ProtectedImage
                        filePath={photo.photo_url}
                        alt={`Foto acara ${index + 1}`}
                        className="w-full h-full object-cover"
                        fallbackSrc="/placeholder-image.png"
                        width={300}
                        height={300}
                      />

                      {/* Action buttons overlay - visible on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2 p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-white/20 hover:bg-white/40 text-white border-white/30"
                          onClick={async () => {
                            try {
                              // Download the photo using the protected file API
                              console.log(`[GallerySimple] Downloading photo: ${photo.photo_url}`);

                              // Normalize the file path
                              let normalizedPath = photo.photo_url;

                              // Ensure it starts with a slash
                              if (!normalizedPath.startsWith('/')) {
                                normalizedPath = `/${normalizedPath}`;
                              }

                              // If the path doesn't start with /uploads/ but contains 'uploads', fix it
                              if (!normalizedPath.startsWith('/uploads/') && normalizedPath.includes('uploads')) {
                                const uploadsPart = normalizedPath.split('uploads/');
                                if (uploadsPart.length > 1) {
                                  normalizedPath = `/uploads/${uploadsPart[1]}`;
                                }
                              }

                              console.log(`[GallerySimple] Using normalized path: ${normalizedPath}`);

                              // Fetch the file as a blob directly from the backend
                              const blob = await fileApi.getProtectedFile(normalizedPath);
                              if (blob.size === 0) {
                                console.error(`[GallerySimple] Failed to download photo: ${normalizedPath}`);
                                alert('Gagal mengunduh foto. Silakan coba lagi.');
                                return;
                              }

                              // Create a download link
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `event-${eventId}-photo-${photo.id || index}.jpg`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);

                              // Clean up the URL object
                              URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error(`[GallerySimple] Error downloading photo:`, error);
                              alert('Gagal mengunduh foto. Silakan coba lagi.');
                            }
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Unduh
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-white/20 hover:bg-white/40 text-white border-white/30"
                          onClick={async () => {
                            // Ask for confirmation before deleting
                            if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) {
                              return;
                            }

                            try {
                              // Delete the photo using the API
                              console.log(`[GallerySimple] Deleting photo: ${photo.id} from event ${eventId}`);

                              // In development mode, handle mock data in localStorage
                              if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
                                const eventPhotosKey = `event_${eventId}_photos`;
                                const existingPhotos = JSON.parse(localStorage.getItem(eventPhotosKey) || '[]');
                                const updatedPhotos = existingPhotos.filter((p: any) => p.id !== photo.id);
                                localStorage.setItem(eventPhotosKey, JSON.stringify(updatedPhotos));

                                // Force refresh
                                localStorage.setItem('lastPhotoUpload', Date.now().toString());
                              }

                              // Call the API to delete the photo
                              await eventApi.deleteEventPhoto(eventId, photo.id);
                              console.log(`[GallerySimple] Successfully deleted photo ${photo.id}`);

                              // Update the photos state directly instead of fetching again
                              setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photo.id));
                              console.log(`[GallerySimple] Removed photo ${photo.id} from state`);
                            } catch (error) {
                              console.error(`[GallerySimple] Error deleting photo:`, error);
                              alert('Gagal menghapus foto. Silakan coba lagi.');
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </Button>
                      </div>
                    </div>

                    {/* Date display */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                      {formatDate(photo.uploaded_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada foto yang diunggah untuk acara ini.</p>
              <Button variant="outline" className="mt-4" onClick={handleUploadPhotos}>
                <Upload className="mr-2 h-4 w-4" />
                Unggah Foto Pertama
              </Button>
            </div>
          )}
        </div>
      </div>

      <UploadPhotosDirect
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        eventId={eventId}
        onSuccess={() => {
          // Refetch photos after successful upload
          fetchPhotos();
        }}
      />
    </>
  );
}
