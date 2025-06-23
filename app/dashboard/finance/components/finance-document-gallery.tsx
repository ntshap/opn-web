"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Download, Image, Trash2, Upload, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { uploadsApi } from "@/lib/api-uploads"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface FinanceDocumentGalleryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  financeId: number
  documentUrl: string | null
  onSuccess?: () => void
}

export function FinanceDocumentGallery({
  open,
  onOpenChange,
  financeId,
  documentUrl,
  onSuccess
}: FinanceDocumentGalleryProps) {
  const [showUploadView, setShowUploadView] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setFile(null)
      setError(null)
      setUploadProgress(0)
      // Only show upload view if there's no document URL
      // Make sure to properly check for empty strings and null values
      setShowUploadView(!documentUrl || documentUrl === "" || documentUrl === "null")

      // Log for debugging
      console.log("Document gallery opened with URL:", documentUrl)
    }
  }, [open, documentUrl])

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

      // Switch to gallery view after successful upload
      setShowUploadView(false)

      // Refresh the data
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

  const handleDeleteDocument = async () => {
    if (!documentUrl) return

    try {
      setIsDeleting(true)
      setError(null)

      // Delete the document
      await uploadsApi.deleteFinanceDocument(financeId)

      // Show success message
      toast({
        title: "Berhasil",
        description: "Dokumen berhasil dihapus",
      })

      // Switch to upload view after successful delete
      setShowUploadView(true)

      // Refresh the data
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("Error deleting document:", err)
      setError(err instanceof Error ? err.message : "Gagal menghapus dokumen. Silakan coba lagi.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Bukti Transaksi</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showUploadView ? (
          // Upload View
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Pilih File</h3>
              <Input
                id="document"
                type="file"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
                disabled={isUploading}
                className="cursor-pointer"
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
                        <Download className="h-5 w-5 text-blue-600" />
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

            <div className="flex justify-between items-center pt-4">
              {documentUrl && (
                <Button
                  variant="outline"
                  onClick={() => setShowUploadView(false)}
                  disabled={isUploading}
                >
                  Kembali ke Galeri
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
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
            </div>
          </div>
        ) : (
          // Gallery View
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Total dokumen: {documentUrl ? 1 : 0}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadView(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Unggah Dokumen
                </Button>
                {documentUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (documentUrl) {
                        // Open the document URL in a new tab
                        window.open(documentUrl, '_blank');
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Lihat Dokumen
                  </Button>
                )}
              </div>
            </div>

            {documentUrl ? (
              <div className="grid grid-cols-1 gap-4">
                <div className="relative bg-gray-100 aspect-square overflow-hidden group border-2 border-blue-200 rounded-lg shadow-md">
                  {documentUrl.toLowerCase().endsWith('.pdf') ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Image className="h-16 w-16 mx-auto text-slate-400" />
                        <p className="mt-2 text-sm text-slate-600">Dokumen PDF</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => {
                            if (documentUrl) {
                              window.open(documentUrl, '_blank');
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Buka PDF
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={documentUrl}
                        alt="Bukti transaksi"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          console.error("Error loading image:", documentUrl);

                          // Try to fix the URL if it's missing the API prefix
                          const target = e.target as HTMLImageElement;

                          if (documentUrl) {
                            // Check if URL is relative and doesn't have the proper API prefix
                            if (documentUrl.startsWith('/uploads/') && !documentUrl.includes('/api/v1/')) {
                              const fixedUrl = `/api/v1${documentUrl}`;
                              console.log("Fixing document URL format. New URL:", fixedUrl);
                              target.src = fixedUrl;
                              return;
                            }

                            // Check if URL is absolute but missing the API path
                            if (documentUrl.includes('beopn.penaku.site') && !documentUrl.includes('/api/v1/')) {
                              const fixedUrl = documentUrl.replace('beopn.penaku.site/', 'beopn.penaku.site/api/v1/');
                              console.log("Fixing document URL format. New URL:", fixedUrl);
                              target.src = fixedUrl;
                              return;
                            }

                            // Log the URL format for debugging
                            console.warn("Document URL format issue. Current URL:", documentUrl);
                          }

                          // If all fixes fail, show placeholder
                          target.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                    Bukti Transaksi
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex flex-col justify-center items-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-black hover:bg-gray-100"
                        onClick={() => {
                          if (documentUrl) {
                            // Open the document URL in a new tab
                            window.open(documentUrl, '_blank');
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Unduh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-red-600 hover:bg-red-50"
                        onClick={handleDeleteDocument}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Menghapus...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Image className="h-16 w-16 text-slate-300 mb-4" />
                <p className="text-muted-foreground">Belum ada dokumen yang diunggah</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowUploadView(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Unggah Dokumen
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
