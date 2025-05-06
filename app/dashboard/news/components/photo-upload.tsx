"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { newsApi } from "@/lib/api-service"
import { SecureImage } from "@/components/shared/SecureImage"
import { toast } from "@/components/ui/use-toast"

export function PhotoUpload({ newsId, onPhotoUploaded }: { newsId: string, onPhotoUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadedPhotoUrl(null)

    try {
      const result = await newsApi.uploadNewsPhoto(newsId, file)

      if (result && result.photo_url) {
        setUploadedPhotoUrl(result.photo_url)
        toast({
          title: "Success",
          description: "Photo uploaded successfully",
        })

        // Reset the file input
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Call the callback function to notify parent component
        if (onPhotoUploaded) {
          onPhotoUploaded()
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err)
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Ganti Foto Berita</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground mb-2">
          Upload foto baru untuk menggantikan foto yang sudah ada. Foto yang baru diupload akan langsung menggantikan foto yang lama.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-2 w-full"
            />
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? "Sedang Mengupload..." : "Upload Foto Baru"}
            </Button>
          </div>

          {uploadedPhotoUrl && (
            <div className="w-full sm:w-1/3">
              <div className="border rounded p-2">
                <p className="text-sm font-medium mb-2 text-center">Foto Baru</p>
                <SecureImage
                  src={uploadedPhotoUrl}
                  alt="Foto baru yang diupload"
                  width="100%"
                  height={150}
                  className="mx-auto object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
