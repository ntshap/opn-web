"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useMemberMutations } from "@/hooks/useMembers"
import { ProtectedImage } from "@/components/shared/ProtectedImage"

interface MemberPhotoUploadProps {
  memberId: string | number
  currentPhotoUrl?: string | null
  onPhotoUploaded?: () => void
}

export function MemberPhotoUpload({ 
  memberId, 
  currentPhotoUrl, 
  onPhotoUploaded 
}: MemberPhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadMemberPhoto } = useMemberMutations()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      // Create a preview URL for the selected file
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreviewUrl(objectUrl)
      
      // Clean up the previous preview URL if it exists
      return () => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Silakan pilih file terlebih dahulu",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      await uploadMemberPhoto.mutateAsync({ memberId, file })
      
      // Reset the file input
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Clean up the preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }

      // Call the callback function to notify parent component
      if (onPhotoUploaded) {
        onPhotoUploaded()
      }
    } catch (err: any) {
      console.error("Upload error:", err)
      toast({
        title: "Error",
        description: "Gagal mengunggah foto. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Foto Anggota</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Current photo or preview */}
          <div className="w-full sm:w-1/3">
            <div className="aspect-square rounded-md overflow-hidden border bg-muted">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : currentPhotoUrl ? (
                <ProtectedImage
                  filePath={currentPhotoUrl}
                  alt="Foto anggota"
                  className="w-full h-full"
                  loadingComponent={
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  }
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                  <Upload className="h-12 w-12 opacity-50" />
                </div>
              )}
            </div>
          </div>
          
          {/* Upload controls */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              Unggah foto baru untuk anggota ini. Foto yang diunggah akan langsung ditampilkan tanpa perlu refresh halaman.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-4 w-full"
            />
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sedang Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Unggah Foto
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
