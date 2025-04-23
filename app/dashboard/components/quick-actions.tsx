"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Calendar, FileText, Users, PlusCircle, Upload, BarChart2 } from "lucide-react"
import { SafeIcon } from "@/components/ui/safe-icon"

export function QuickActions() {
  const router = useRouter()
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const quickActions = [
    {
      title: "Buat Acara",
      description: "Jadwalkan acara baru",
      icon: Calendar,
      onClick: () => router.push("/dashboard/events/create"),
    },
    {
      title: "Undang Tim",
      description: "Tambah anggota tim",
      icon: Users,
      onClick: () => router.push("/dashboard/members"),
    },
    {
      title: "Postingan Baru",
      description: "Buat pengumuman",
      icon: PlusCircle,
      onClick: () => router.push("/dashboard/news?action=create"),
    },
  ]

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Undangan terkirim",
      description: `Undangan telah dikirim ke ${inviteEmail}`,
    })
    setInviteEmail("")
    setIsInviteDialogOpen(false)
  }

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadFile) {
      toast({
        title: "Berkas diunggah",
        description: `${uploadFile.name} telah berhasil diunggah`,
      })
      setUploadFile(null)
      setIsUploadDialogOpen(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-medium">Tindakan Cepat</h2>
          <p className="text-sm text-muted-foreground">Tugas umum dan pintasan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Card
                key={index}
                className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-accent transition-colors"
                onClick={action.onClick}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-medium">{action.title}</h3>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Invite Team Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undang Anggota Tim</DialogTitle>
            <DialogDescription>Kirim undangan untuk bergabung dengan tim Anda</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Alamat email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan alamat email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Kirim Undangan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Files Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unggah Berkas</DialogTitle>
            <DialogDescription>Bagikan dokumen dengan tim Anda</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">Pilih berkas</Label>
                <Input id="file" type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Unggah</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

