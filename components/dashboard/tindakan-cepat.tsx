"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Users,
  Plus
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LazyEventForm } from "@/components/lazy-imports"
import { useToast } from "@/components/ui/use-toast"

interface TindakanCepatProps {
  className?: string
}

export function TindakanCepat({ className }: TindakanCepatProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false)

  // Fungsi untuk navigasi ke halaman anggota tim
  const handleInviteTeam = () => {
    router.push("/dashboard/members")
  }

  // Fungsi untuk navigasi ke halaman pengumuman
  const handleCreateAnnouncement = () => {
    router.push("/dashboard/news?action=create")
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="text-xl font-medium">Tindakan Cepat</h2>
        <p className="text-sm text-muted-foreground">Tugas umum dan pintasan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Buat Acara */}
        <Card
          className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setIsCreateEventDialogOpen(true)}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-medium">Buat Acara</h3>
          <p className="text-xs text-muted-foreground">Jadwalkan acara baru</p>
        </Card>

        {/* Undang Tim */}
        <Card
          className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-accent transition-colors"
          onClick={handleInviteTeam}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-medium">Undang Tim</h3>
          <p className="text-xs text-muted-foreground">Tambah anggota tim</p>
        </Card>

        {/* Postingan Baru */}
        <Card
          className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-accent transition-colors"
          onClick={handleCreateAnnouncement}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
            <Plus className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-medium">Postingan Baru</h3>
          <p className="text-xs text-muted-foreground">Buat pengumuman</p>
        </Card>
      </div>

      {/* Dialog untuk membuat acara baru */}
      <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Buat Acara Baru</DialogTitle>
          </DialogHeader>
          <LazyEventForm
            onSuccess={(event) => {
              setIsCreateEventDialogOpen(false);
              toast({
                title: "Berhasil",
                description: "Acara berhasil dibuat",
              });
              router.push(`/dashboard/events/${event.id}`);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
