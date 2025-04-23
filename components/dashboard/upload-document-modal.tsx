"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, File, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UploadDocumentModalProps {
  show: boolean
  onClose: () => void
  eventId: number
}

export function UploadDocumentModal({ show, onClose, eventId }: UploadDocumentModalProps) {
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
      const imageFiles = newFiles.filter((file) => file.type.startsWith("image/"))
      setFiles((prev) => [...prev, ...imageFiles])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadComplete(false)

    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setUploadProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)
        setUploading(false)
        setUploadComplete(true)

        setTimeout(() => {
          toast({
            title: "Upload complete",
            description: `Successfully uploaded ${files.length} files.`,
          })
        }, 500)
      }
    }, 200)
  }

  const handleClose = () => {
    if (uploading) {
      const confirmClose = window.confirm("Upload in progress. Are you sure you want to cancel?")
      if (!confirmClose) return
    }

    setFiles([])
    setUploadProgress(0)
    setUploading(false)
    setUploadComplete(false)
    onClose()
  }

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">Upload Event Photos</DialogTitle>
        </DialogHeader>

        {uploadComplete ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Upload Complete!</h3>
            <p className="mt-1 text-center text-slate-500">All {files.length} files have been successfully uploaded.</p>
            <Button className="mt-6" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                files.length > 0
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-300 hover:border-blue-300 hover:bg-blue-50"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {files.length === 0 ? (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">Drag and drop files here</h3>
                  <p className="mt-1 text-center text-slate-500">or click to browse from your computer</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    Browse Files
                  </Button>
                  <p className="mt-2 text-xs text-slate-400">Supported formats: JPG, PNG, GIF (Max 10MB per file)</p>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              ) : (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{files.length} files selected</h3>
                      <p className="text-sm text-slate-500">
                        Total size: {(files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("file-upload")?.click()}
                        disabled={uploading}
                      >
                        Add More
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setFiles([])} disabled={uploading}>
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[200px] rounded-md border">
                    <div className="p-4 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between rounded-md border p-2 bg-white">
                          <div className="flex items-center gap-3">
                            {file.type.startsWith("image/") ? (
                              <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-slate-50">
                                <img
                                  src={URL.createObjectURL(file) || "/placeholder.svg"}
                                  alt={file.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100">
                                <File className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="truncate text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            disabled={uploading}
                            className="h-8 w-8 rounded-full hover:bg-slate-100"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Uploading...</p>
                  <p className="text-sm font-medium">{uploadProgress}%</p>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={handleClose} disabled={uploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="relative overflow-hidden"
              >
                {uploading ? "Uploading..." : "Upload Files"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

