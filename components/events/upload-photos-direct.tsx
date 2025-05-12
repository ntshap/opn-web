"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDropzone } from "react-dropzone"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { uploadsApi } from "@/lib/api-uploads"
import eventBus, { EVENTS } from "@/lib/event-bus"

interface UploadPhotosDirectProps {
  open: boolean
  onClose: () => void
  eventId: number | string
  onSuccess?: () => void
}

export function UploadPhotosDirect({ open, onClose, eventId, onSuccess }: UploadPhotosDirectProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for specific image file types only
    const imageFiles = acceptedFiles.filter((file) => {
      const fileType = file.type.toLowerCase()
      return fileType === 'image/jpeg' ||
             fileType === 'image/png' ||
             fileType === 'image/gif' ||
             fileType === 'image/webp'
    })

    // Check file sizes (max 10MB per file)
    const validFiles = imageFiles.filter((file) => file.size <= 10 * 1024 * 1024)

    // Show appropriate error messages
    if (validFiles.length < acceptedFiles.length) {
      if (imageFiles.length < acceptedFiles.length) {
        setError("Beberapa file dilewati (format file tidak didukung)")
      } else {
        setError("Beberapa file dilewati karena melebihi batas ukuran 10MB")
      }
    }

    setFiles((prev) => [...prev, ...validFiles])
  }, [])

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  // Remove file from list
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  // Handle upload
  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Silakan pilih setidaknya satu file untuk diunggah")
      return
    }

    // Log the eventId for debugging
    console.log('[UploadPhotosDirect] Event ID received:', eventId, 'Type:', typeof eventId)

    // Validate eventId
    if (!eventId) {
      console.error('[UploadPhotosDirect] Event ID is empty or undefined')
      setError("ID acara tidak valid. Silakan coba lagi atau muat ulang halaman.")
      return
    }

    // Ensure eventId is a number
    const numericEventId = Number(eventId)
    console.log('[UploadPhotosDirect] Converted event ID:', numericEventId, 'isNaN:', isNaN(numericEventId))

    if (isNaN(numericEventId) || numericEventId <= 0) {
      console.error('[UploadPhotosDirect] Invalid numeric event ID:', numericEventId)
      setError("ID acara tidak valid. Silakan coba lagi atau muat ulang halaman.")
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Check if token exists
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
      if (!token && process.env.NODE_ENV !== 'development') {
        setError('Anda belum login. Silakan login terlebih dahulu.')
        setIsUploading(false)
        return
      }

      // Create form data
      const formData = new FormData()

      // Add files to form data
      files.forEach(file => {
        formData.append('files', file)
      })

      console.log(`[UploadPhotosDirect] Uploading ${files.length} files to event ${eventId}`)

      // Log the form data for debugging
      console.log(`[UploadPhotosDirect] FormData contains ${files.length} files:`,
        files.map(f => ({ name: f.name, size: f.size, type: f.type })))

      // Use the uploadsApi.uploadEventPhotos method which handles the event ID prefix
      // Pass the numeric event ID to ensure it's a valid number
      const response = await uploadsApi.uploadEventPhotos(numericEventId, files, (percentCompleted) => {
        setUploadProgress(percentCompleted)
      })

      console.log('[UploadPhotosDirect] Upload response:', response)

      // In development mode, make sure the mock photos are available in localStorage
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        // Check if we have mock photos for this event
        const eventPhotosKey = `event_${numericEventId}_photos`;
        const existingPhotos = JSON.parse(localStorage.getItem(eventPhotosKey) || '[]');

        // If we have mock photos but they're not showing up, force a refresh
        if (existingPhotos.length > 0) {
          console.log(`[UploadPhotosDirect] Found ${existingPhotos.length} mock photos in localStorage, ensuring they're visible`);

          // Add a timestamp to force a refresh
          localStorage.setItem('lastPhotoUpload', Date.now().toString());
        }
      }

      // Success
      setIsSuccess(true)
      setIsUploading(false)

      // Create a timestamp for this upload event
      const uploadTimestamp = Date.now();

      // IMPORTANT: Call onSuccess callback IMMEDIATELY to refresh the gallery
      // This ensures the gallery refreshes as soon as the upload is complete
      if (onSuccess) {
        console.log('[UploadPhotosDirect] Immediately triggering onSuccess callback to refresh gallery');
        onSuccess();
      }

      // Emit event to notify all components that photos have been uploaded
      console.log(`[UploadPhotosDirect] Emitting PHOTO_UPLOADED event for event ID ${numericEventId}`);
      eventBus.emit(EVENTS.PHOTO_UPLOADED, {
        eventId: numericEventId,
        timestamp: uploadTimestamp,
        count: files.length
      });

      // Also emit a gallery refresh event
      eventBus.emit(EVENTS.GALLERY_REFRESH, {
        eventId: numericEventId,
        timestamp: uploadTimestamp,
        count: files.length
      });

      // For backward compatibility, still use localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastPhotoUpload', uploadTimestamp.toString());
        localStorage.setItem(`lastPhotoUpload_${numericEventId}`, uploadTimestamp.toString());

        // Force a window storage event to ensure all components are notified
        // This helps with components that might be listening for storage events
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'lastPhotoUpload',
          newValue: uploadTimestamp.toString(),
          url: window.location.href
        }));

        // Also dispatch an event specific to this event ID
        window.dispatchEvent(new StorageEvent('storage', {
          key: `lastPhotoUpload_${numericEventId}`,
          newValue: uploadTimestamp.toString(),
          url: window.location.href
        }));
      }

      // Schedule additional refresh attempts to ensure photos appear
      // This helps when the backend takes a moment to process the upload
      setTimeout(() => {
        if (onSuccess) {
          console.log('[UploadPhotosDirect] Triggering delayed refresh 1 (500ms)');
          onSuccess();
        }
      }, 500);

      setTimeout(() => {
        if (onSuccess) {
          console.log('[UploadPhotosDirect] Triggering delayed refresh 2 (1500ms)');
          onSuccess();
        }
      }, 1500);

      // Reset the UI after 1.5 seconds (keep the success message visible briefly)
      setTimeout(() => {
        setFiles([])
        setIsSuccess(false)
        onClose()
      }, 1500)
    } catch (error) {
      console.error('[UploadPhotosDirect] Upload error:', error)

      // Handle error
      let errorMessage = "Gagal mengunggah foto. Silakan coba lagi."

      // Set error message based on error type and response status
      if (error.response?.status === 401) {
        errorMessage = 'Sesi login Anda telah berakhir. Silakan login kembali.'

        // Redirect to login after a short delay
        setTimeout(() => {
          localStorage.setItem('redirectAfterLogin', window.location.pathname)
          window.location.href = '/login'
        }, 2000)
      } else if (error.response?.status === 403) {
        errorMessage = 'Anda tidak memiliki izin untuk mengunggah foto.'
      } else if (error.response?.status === 413) {
        errorMessage = 'Ukuran file terlalu besar. Maksimal 5MB per file.'
      } else if (error.response?.data?.detail) {
        errorMessage = `Error: ${error.response.data.detail}`
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      setError(errorMessage)
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !isUploading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unggah Foto Acara</DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">Berhasil Diunggah!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Foto telah berhasil diunggah ke acara ini.
            </p>
          </div>
        ) : (
          <>
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm font-medium">
                Seret & lepas file di sini, atau klik untuk memilih file
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Mendukung: JPG, PNG, GIF, WEBP (Maks. 10MB per file)
              </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">File yang dipilih ({files.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted p-2 rounded-md text-sm"
                    >
                      <div className="flex items-center overflow-hidden">
                        <div className="w-8 h-8 bg-background rounded-md flex items-center justify-center mr-2 flex-shrink-0">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <div className="overflow-hidden">
                          <p className="truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Upload progress */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Mengunggah...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Actions */}
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={onClose} disabled={isUploading}>
                Batal
              </Button>
              <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Unggah ({files.length})
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
