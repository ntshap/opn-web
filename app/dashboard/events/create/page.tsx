"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { LazyEventForm } from "@/components/lazy-imports"
import { useEventMutations } from "@/hooks/useEvents"

export default function CreateEventPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createEvent } = useEventMutations()

  const handleCreateEvent = async (data: any) => {
    try {
      setIsSubmitting(true)
      await createEvent.mutateAsync(data)
      
      toast({
        title: "Berhasil",
        description: "Acara berhasil dibuat",
      })
      
      // Redirect to events page
      router.push("/dashboard/events")
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat membuat acara",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Buat Acara Baru</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Acara</CardTitle>
          <CardDescription>
            Masukkan informasi untuk acara baru
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LazyEventForm 
            onSubmit={handleCreateEvent}
            isSubmitting={isSubmitting || createEvent.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
