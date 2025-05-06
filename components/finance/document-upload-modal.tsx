"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Upload, X, Image, File } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { uploadsApi } from "@/lib/api-uploads"

interface DocumentUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  financeId: number
  onSuccess?: () => void
}

export function DocumentUploadModal({
  open,
  onOpenChange,
  financeId,
  onSuccess
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setError(null)
  }

  const handleRemoveFile = () => {
    setFile(null)
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Silakan pilih file terlebih dahulu")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file terlalu besar. Maksimal 5MB")
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError("Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau PDF")
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // Upload the document using PUT method
      // Note: We use PUT for both new uploads and updates as per backend requirements
      await uploadsApi.uploadFinanceDocument(
        financeId,
        file,
        (progress) => {
          setUploadProgress(progress)
        }
      )

      // Show success message
      toast({
        title: "Berhasil",
        description: "Dokumen berhasil diunggah",
      })

      // Close the modal and refresh the data
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("Error uploading document:", err)
      setError(err instanceof Error ? err.message : "Gagal mengunggah dokumen. Silakan coba lagi.")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unggah Bukti Transaksi</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="document">Pilih File</Label>
            <Input
              id="document"
              type="file"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              Format yang didukung: JPG, JPEG, PNG, PDF (maks. 5MB)
            </p>
          </div>

          {file && (
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {file.type.startsWith("image/") ? (
                    <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center">
                      <Image className="h-5 w-5 text-blue-600" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center">
                      <File className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isUploading && (
                <div className="mt-3">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center mt-1">{uploadProgress}%</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Batal
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
      </DialogContent>
    </Dialog>
  )
}
