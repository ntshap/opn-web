"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Edit, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api-client"

interface NotulensiEditorDirectProps {
  eventId: string | number
  initialContent: string
  onSaved?: () => void
}

export function NotulensiEditorDirect({ eventId, initialContent, onSaved }: NotulensiEditorDirectProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(initialContent || "")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Update content when initialContent changes
  useEffect(() => {
    setContent(initialContent || "")
  }, [initialContent])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    // Validate content before saving
    if (!content || content.trim() === '') {
      setError("Notulensi tidak boleh kosong")
      toast({
        title: "Validasi Gagal",
        description: "Notulensi tidak boleh kosong",
        variant: "destructive",
      })
      setIsSaving(false)
      return
    }

    try {
      console.log(`[NotulensiEditorDirect] Saving notulensi for event ${eventId}:`, content)

      // Try the PATCH endpoint first (more specific for minutes updates)
      try {
        console.log(`[NotulensiEditorDirect] Trying PATCH endpoint for minutes update`)
        const patchResponse = await apiClient.patch(`/events/${eventId}/minutes`, {
          minutes: content.trim()
        })

        console.log(`[NotulensiEditorDirect] PATCH response:`, patchResponse.data)

        toast({
          title: "Berhasil",
          description: "Notulensi berhasil disimpan",
        })

        setIsEditing(false)

        if (onSaved) {
          onSaved()
        }
        setIsSaving(false)
        return
      } catch (patchError) {
        // PATCH endpoint might not exist, fall back to PUT
        console.log(`[NotulensiEditorDirect] PATCH error, falling back to PUT:`, patchError)
      }

      // Fall back to the PUT endpoint with just the minutes field
      const response = await apiClient.put(`/events/${eventId}`, {
        minutes: content.trim()
      })

      console.log(`[NotulensiEditorDirect] PUT response:`, response.data)

      toast({
        title: "Berhasil",
        description: "Notulensi berhasil disimpan",
      })

      setIsEditing(false)

      if (onSaved) {
        onSaved()
      }
    } catch (err) {
      console.error("Error saving notulensi:", err)

      let errorMessage = "Gagal menyimpan notulensi. Silakan coba lagi."

      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        // Try to extract error details from response
        const errorObj = err as any
        if (errorObj.response?.data?.detail) {
          errorMessage = String(errorObj.response.data.detail)
        }
      }

      setError(errorMessage)

      toast({
        title: "Gagal",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isEditing && initialContent) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Notulensi Rapat</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Notulensi
          </Button>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-line">{initialContent}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialContent ? "Edit Notulensi" : "Tambah Notulensi"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Masukkan notulensi rapat atau catatan penting dari acara ini"
          className="min-h-[200px]"
        />

        {error && (
          <div className="mt-2 p-2 bg-red-50 text-red-800 rounded-md flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {initialContent && (
          <Button variant="outline" onClick={() => {
            setContent(initialContent)
            setIsEditing(false)
            setError(null)
          }}>
            Batal
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Notulensi
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
