"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useEventMutations } from "@/hooks/useEvents"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UploadPhotosModalProps {
  open: boolean
  onClose: () => void
  eventId: number | string
  onSuccess?: () => void
}

export function UploadPhotosModal({ open, onClose, eventId, onSuccess }: UploadPhotosModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const { uploadPhotos } = useEventMutations()

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

  // Handle file change from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files)

      // Filter for specific image file types only
      const imageFiles = fileArray.filter((file) => {
        const fileType = file.type.toLowerCase()
        return fileType === 'image/jpeg' ||
               fileType === 'image/png' ||
               fileType === 'image/gif' ||
               fileType === 'image/webp'
      })

      // Check file sizes (max 10MB per file)
      const validFiles = imageFiles.filter((file) => file.size <= 10 * 1024 * 1024)

      // Show appropriate error messages
      if (validFiles.length < fileArray.length) {
        if (imageFiles.length < fileArray.length) {
          setError("Beberapa file dilewati (format file tidak didukung)")
        } else {
          setError("Beberapa file dilewati karena melebihi batas ukuran 10MB")
        }
      } else {
        setError(null)
      }

      setFiles(validFiles)
    }
  }

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
  const handleUpload = () => {
    if (files.length === 0) {
      setError("Silakan pilih setidaknya satu file untuk diunggah")
      return
    }

    // Log the eventId for debugging
    console.log('[UploadPhotosModal] Event ID received:', eventId, 'Type:', typeof eventId)

    // Validate eventId
    if (!eventId) {
      console.error('[UploadPhotosModal] Event ID is empty or undefined')
      setError("ID acara tidak valid. Silakan coba lagi atau muat ulang halaman.")
      return
    }

    // Ensure eventId is a number
    const numericEventId = Number(eventId)
    console.log('[UploadPhotosModal] Converted event ID:', numericEventId, 'isNaN:', isNaN(numericEventId))

    if (isNaN(numericEventId) || numericEventId <= 0) {
      console.error('[UploadPhotosModal] Invalid numeric event ID:', numericEventId)
      setError("ID acara tidak valid. Silakan coba lagi atau muat ulang halaman.")
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    // Log the files being uploaded
    console.log(`[UploadPhotosModal] Uploading ${files.length} files to event ${numericEventId}:`, files.map(f => ({ name: f.name, size: f.size, type: f.type })))

    uploadPhotos.mutate(
      {
        eventId: numericEventId, // Use the validated numeric event ID
        files,
        onProgress: (percentage) => {
          setUploadProgress(percentage)
        },
      },
      {
        onSuccess: (response) => {
          console.log('Upload success response:', response)
          setIsSuccess(true)
          setIsUploading(false)

          // Call the onSuccess callback IMMEDIATELY if provided
          if (onSuccess) {
            console.log('[UploadPhotosModal] Immediately triggering onSuccess callback to refresh gallery');
            onSuccess()
          }

          // Reset UI after 2 seconds
          setTimeout(() => {
            setFiles([])
            setIsSuccess(false)
            onClose()
          }, 2000)
        },
        onError: (error) => {
          console.error('Upload error:', error)

          // Provide more specific error messages
          let errorMessage = "Gagal mengunggah foto. Silakan coba lagi."

          if (error instanceof Error) {
            // Network error handling
            if (error.message === 'Network Error') {
              errorMessage = "Kesalahan jaringan. Periksa koneksi internet Anda dan coba lagi."
            } else if (error.message.includes('422')) {
              errorMessage = "Format file tidak valid atau ukuran file terlalu besar."
            } else if (error.message.includes('404')) {
              errorMessage = "Endpoint tidak ditemukan. Silakan hubungi administrator."
            } else if (error.message.includes('401')) {
              errorMessage = "Tidak memiliki izin untuk mengunggah foto. Silakan login kembali."
            } else if (error.message.includes('413')) {
              errorMessage = "Ukuran file terlalu besar. Maksimal 10MB per file."
            } else {
              errorMessage = error.message
            }
          }

          // Set the error message
          setError(errorMessage)
          setIsUploading(false)
          setUploadProgress(0)
        },
      },
    )
  }

  const handleClose = () => {
    if (!isUploading) {
      setFiles([])
      setError(null)
      setUploadProgress(0)
      setIsSuccess(false)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unggah Foto Acara</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">Foto berhasil diunggah!</AlertDescription>
            </Alert>
          )}

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary"}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Seret & lepas foto di sini, atau klik untuk memilih file
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Mendukung: JPG, PNG, GIF, WebP (maks 10MB per file)
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center text-gray-500">
                Mengunggah... {uploadProgress}%
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
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
                  Unggah
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
