"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Edit, Loader2 } from "lucide-react"
import { useEventMutations } from "@/hooks/useEvents"
import { useToast } from "@/components/ui/use-toast"

interface NotulensiEditorProps {
  eventId: string | number
  initialContent: string
  onSaved: () => void
}

export function NotulensiEditor({ eventId, initialContent, onSaved }: NotulensiEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(initialContent || "")
  const { updateEvent } = useEventMutations()
  const { toast } = useToast()

  const handleSave = async () => {
    // Validate content before saving
    if (!content || content.trim() === '') {
      toast({
        title: "Validasi Gagal",
        description: "Notulensi tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    updateEvent.mutate(
      {
        id: eventId,
        data: {
          minutes: content.trim() // Trim whitespace
        }
      },
      {
        onSuccess: () => {
          toast({
            title: "Berhasil",
            description: "Notulensi berhasil disimpan",
          })
          setIsEditing(false)
          if (onSaved) onSaved()
        },
        onError: (error) => {
          console.error('Error saving notulensi:', error)

          // Try to extract a meaningful error message
          let errorMessage = "Gagal menyimpan notulensi. Silakan coba lagi."

          if (error instanceof Error) {
            errorMessage = error.message
          } else if (typeof error === 'object' && error !== null) {
            // Try to extract error details from response
            const errorObj = error as any
            if (errorObj.response?.data?.detail) {
              errorMessage = String(errorObj.response.data.detail)
            }
          }

          toast({
            title: "Gagal",
            description: errorMessage,
            variant: "destructive",
          })
        }
      }
    )
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
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {initialContent && (
          <Button variant="outline" onClick={() => {
            setContent(initialContent)
            setIsEditing(false)
          }}>
            Batal
          </Button>
        )}
        <Button onClick={handleSave} disabled={updateEvent.isPending}>
          {updateEvent.isPending ? (
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
