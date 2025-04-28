"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Calendar, Clock, MapPin, Users, Image, Download, Edit, Trash2, Check, X, Loader2, ImageIcon, Upload } from "lucide-react"
import { formatImageUrl } from "@/lib/image-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UploadPhotosDirect } from "@/components/events/upload-photos-direct"
import { useToast } from "@/components/ui/use-toast"
import { eventApi, type EventPhoto } from "@/lib/api-service" // Updated path, added EventPhoto import
import { TipTapEditor, TipTapContent } from "@/components/ui/tiptap-editor"
import { SecureImage } from "@/components/shared/SecureImage"

interface EventDetailModalProps {
  show: boolean
  onClose: () => void
  event: any
  onUpdate?: (updatedEvent: any) => void
}

export function EventDetailModal({ show, onClose, event, onUpdate }: EventDetailModalProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [minutesContent, setMinutesContent] = useState(event.minutes || "")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isSavingMinutes, setIsSavingMinutes] = useState(false)
  const [isEditingMinutes, setIsEditingMinutes] = useState(false)
  const { toast } = useToast()

  // Function to save meeting notes
  const saveMinutes = async () => {
    setIsSavingMinutes(true)
    try {
      console.log(`Saving minutes for event ${event.id}:`, minutesContent)

      // Use the eventApi.updateEvent method to update the minutes
      const updatedEvent = await eventApi.updateEvent(event.id, {
        minutes: minutesContent
      })

      console.log('Minutes saved successfully:', updatedEvent)

      toast({
        title: "Berhasil",
        description: "Notulensi berhasil disimpan",
      })

      // Update the local state with the new minutes
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate({
          ...event,
          minutes: minutesContent
        })
      }

      // Exit edit mode after saving
      setIsEditingMinutes(false)
    } catch (error) {
      console.error('Error saving minutes:', error)
      toast({
        title: "Gagal",
        description: "Gagal menyimpan notulensi. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsSavingMinutes(false)
    }
  }

  // Fetch attendance data from the API
  const [attendees, setAttendees] = useState<any[]>([])
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true)

  // Fetch attendance data when the modal is shown
  useEffect(() => {
    if (show && event?.id) {
      setIsLoadingAttendance(true)
      eventApi.getEventAttendance(event.id)
        .then(data => {
          console.log('Fetched attendance data:', data)
          setAttendees(data)
        })
        .catch(error => {
          console.error('Error fetching attendance data:', error)
          // Set empty array instead of using fallback data
          setAttendees([])

          // Show error toast
          toast({
            title: "Gagal memuat data kehadiran",
            description: "Terjadi kesalahan saat memuat data kehadiran",
            variant: "destructive",
          })
        })
        .finally(() => {
          setIsLoadingAttendance(false)
        })
    }
  }, [show, event?.id, toast])

  const [selectedAttendee, setSelectedAttendee] = useState<number | null>(null)
  const [attendanceForm, setAttendanceForm] = useState({
    status: "Hadir",
    notes: ""
  })
  const [isSavingAttendance, setIsSavingAttendance] = useState(false)

  // Use photos from the event data with proper logging
  const photos = event.photos?.map((photo: EventPhoto) => { // Add type EventPhoto
    console.log("[EventDetailModal] Processing photo:", photo);
    const photoUrl = photo.photo_url;
    console.log("[EventDetailModal] Photo URL before formatting:", photoUrl);

    // Create a photo object with proper URL
    const photoObj = {
      id: photo.id || Math.random().toString(36).substring(7),
      url: photoUrl,
      // Add a default caption since EventPhoto doesn't have a caption property
      caption: `Foto acara ${event.title}`,
      date: photo.uploaded_at || event.date
    };

    console.log("[EventDetailModal] Processed photo object:", photoObj);
    return photoObj;
  }) || [];

  // Log the final photos array
  console.log("[EventDetailModal] Final photos array:", photos);

  // Handle saving attendance
  const handleSaveAttendance = async () => {
    const attendee = attendees.find(a => a.id === selectedAttendee);
    if (!attendee) return;

    setIsSavingAttendance(true);
    try {
      console.log(`Saving attendance for member ${attendee.member_id || attendee.id} with status: ${attendanceForm.status}`);

      // Format the data for the API and ensure status is one of the allowed values
      const status = attendanceForm.status === "Hadir" ? "Hadir" :
                    attendanceForm.status === "Izin" ? "Izin" : "Alfa";

      const attendanceData = [{
        member_id: attendee.member_id || attendee.id,
        status: status,
        notes: attendanceForm.notes
      }];

      // Call the API to save the attendance
      await eventApi.createUpdateAttendance(event.id, attendanceData);

      // Show success toast
      toast({
        title: "Berhasil",
        description: "Data kehadiran berhasil disimpan",
      });

      // Refresh the attendance data
      eventApi.getEventAttendance(event.id)
        .then(data => {
          console.log('Fetched updated attendance data:', data);
          setAttendees(data);

          // Update the parent component with the refreshed event data
          if (onUpdate && typeof onUpdate === 'function') {
            onUpdate({
              ...event,
              attendance: data
            });
          }
        })
        .catch(error => {
          console.error('Error fetching updated attendance data:', error);
        });

      // Close the form
      setSelectedAttendee(null);
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({
        title: "Gagal",
        description: "Gagal menyimpan data kehadiran. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => { // Update return type
    switch (status.toLowerCase()) {
      case "hadir":
        return "secondary" // Map success to secondary
      case "alfa":
        return "destructive"
      case "izin":
        return "secondary" // Map warning to secondary (or outline)
      default:
        return "default"
    }
  }

  return (
    <>
      <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold text-slate-900">{event.title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
              >
                Detail
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
              >
                Kehadiran
              </TabsTrigger>
              <TabsTrigger
                value="gallery"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
              >
                Galeri
              </TabsTrigger>
              <TabsTrigger
                value="minutes"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
                onClick={() => {
                  // Log when the minutes tab is clicked
                  console.log("[EventDetailModal] Notulensi tab clicked");
                }}
              >
                Notulensi
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="p-6 pt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Informasi Acara</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Tanggal</p>
                      <p className="font-medium">{event.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Waktu</p>
                      <p className="font-medium">{event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Lokasi</p>
                      <p className="font-medium">{event.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Peserta</p>
                      <p className="font-medium">{event.attendees} peserta</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Deskripsi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700">{event.description}</p>

                  <div className="mt-6">
                    <p className="text-sm font-medium text-slate-500 mb-2">Status</p>
                    <Badge variant={event.status === "selesai" ? "secondary" : "default"} className="px-3 py-1 text-xs"> {/* Map success to secondary */}
                      {event.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>


          </TabsContent>

          <TabsContent value="attendance" className="p-0">
            <div className="p-6 pb-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">Daftar Kehadiran</h3>
                  <p className="text-sm text-slate-500">
                    {isLoadingAttendance ? "Memuat data kehadiran..." :
                     attendees.length > 0 ?
                     `${attendees.filter((a) => a.status === "Hadir").length} dari ${attendees.length} anggota hadir` :
                     "Tidak ada data kehadiran"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Ekspor
                  </Button>
                  <Button size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Ubah
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[400px] border-t">
              <div className="p-6 pt-3">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Divisi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead className="text-right">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAttendance ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            <div className="flex flex-col items-center justify-center space-y-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                              <p className="text-muted-foreground">Memuat data kehadiran...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : attendees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            <p className="text-muted-foreground">Tidak ada data kehadiran yang tersedia</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendees.map((attendee) => (
                        <TableRow key={attendee.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.name)}&background=c7d2fe&color=4f46e5`}
                                />
                                <AvatarFallback>{attendee.avatar}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{attendee.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{attendee.division}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(attendee.status)}>{attendee.status}</Badge>
                          </TableCell>
                          <TableCell>{attendee.notes || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedAttendee(attendee.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                      )}

                    </TableBody>
                  </Table>
                </div>
              </div>
            </ScrollArea>

            {selectedAttendee && (
              <div className="p-6 border-t">
                <h3 className="text-base font-semibold mb-4">Update Kehadiran</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attendance-status">Status</Label>
                    <Select
                      value={attendanceForm.status}
                      onValueChange={(value) => setAttendanceForm({...attendanceForm, status: value})}
                    >
                      <SelectTrigger id="attendance-status">
                        <SelectValue placeholder="Pilih status kehadiran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hadir">Hadir</SelectItem>
                        <SelectItem value="Izin">Izin</SelectItem>
                        <SelectItem value="Alfa">Alfa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendance-notes">Keterangan</Label>
                    <Input
                      id="attendance-notes"
                      placeholder="Tambahkan keterangan (opsional)"
                      value={attendanceForm.notes}
                      onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setSelectedAttendee(null)}>Batal</Button>
                  <Button
                    onClick={handleSaveAttendance}
                    disabled={isSavingAttendance}
                  >
                    {isSavingAttendance ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Simpan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="p-0">
            {selectedPhoto ? (
              <div className="relative h-[500px] bg-slate-900">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4 z-10 h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex h-full items-center justify-center">
                  <SecureImage
                    src={selectedPhoto || ''}
                    alt="Event photo"
                    width="100%"
                    height="100%"
                    className="max-h-full max-w-full object-contain"
                    fallbackSrc="/placeholder.svg"
                    style={{ maxHeight: '100%', maxWidth: '100%' }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="p-6 pb-3">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold">Foto Acara</h3>
                      <p className="text-sm text-slate-500">{photos.length} {photos.length === 1 ? 'foto' : 'foto'} dari acara ini</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Unduh Semua
                      </Button>
                      <Button size="sm" onClick={() => setShowUploadModal(true)}>
                        <Image className="h-4 w-4 mr-2" />
                        Tambah Foto
                      </Button>
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-[400px] border-t">
                  <div className="p-6 pt-3">
                    {photos.length === 0 ? (
                      <div className="text-center py-8">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-muted-foreground">Belum ada foto yang diunggah untuk acara ini.</p>
                        <Button variant="outline" className="mt-4" onClick={() => setShowUploadModal(true)}>
                          <Upload className="mr-2 h-4 w-4" />
                          Unggah Foto Pertama
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map((photo: EventPhoto & { url?: string, caption?: string, date?: string }) => { // Add extended type with optional properties
                          console.log("[EventDetailModal] Rendering photo:", photo);
                          const photoUrl = photo.photo_url || photo.url;
                          console.log("[EventDetailModal] Photo URL:", photoUrl);
                          const formattedUrl = formatImageUrl(photoUrl);
                          console.log("[EventDetailModal] Formatted URL:", formattedUrl);

                          return (
                            <div
                              key={photo.id}
                              className="group relative aspect-video cursor-pointer overflow-hidden rounded-md border bg-slate-50"
                              onClick={() => setSelectedPhoto(photoUrl || null)}
                            >
                              <SecureImage
                                src={photoUrl || ''}
                                alt={photo.caption || `Foto acara ${event.title}`}
                                width="100%"
                                height="100%"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                fallbackSrc="/placeholder.svg"
                                style={{ width: '100%', height: '100%' }}
                              />
                              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <p className="text-sm font-medium text-white">{photo.caption || `Foto acara ${event.title}`}</p>
                                <p className="text-xs text-white/80">{photo.date || photo.uploaded_at || event.date}</p>
                              </div>
                              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full bg-black/20 text-white hover:bg-black/40"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full bg-black/20 text-white hover:bg-black/40"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="minutes" className="p-0">
            <div className="p-6">
              {/* View Mode */}
              {!isEditingMinutes && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-semibold">Notulensi</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingMinutes(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Notulensi
                    </Button>
                  </div>

                  <TipTapContent content={event.minutes} />
                </div>
              )}

              {/* Edit Mode */}
              {isEditingMinutes && (
                <div>
                  <h3 className="text-base font-semibold mb-4">{event.minutes ? "Edit Notulensi" : "Tambah Notulensi"}</h3>

                  <TipTapEditor
                    content={minutesContent}
                    onChange={setMinutesContent}
                    placeholder="Tulis notulensi rapat di sini..."
                  />

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingMinutes(false)
                        setMinutesContent(event.minutes || "")
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={saveMinutes}
                      disabled={isSavingMinutes}
                    >
                      {isSavingMinutes ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Simpan Notulensi
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Ubah Acara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Photo Upload Modal */}
    <UploadPhotosDirect
      open={showUploadModal}
      onClose={() => setShowUploadModal(false)}
      eventId={event.id}
      onSuccess={() => {
        // Refresh the event data
        console.log('Photos uploaded successfully')
        // Update the parent component with the refreshed event data
        if (onUpdate && typeof onUpdate === 'function') {
          // Fetch the latest event data
          eventApi.getEvent(event.id)
            .then(updatedEvent => {
              console.log('Fetched updated event data:', updatedEvent);
              onUpdate(updatedEvent);
            })
            .catch(error => {
              console.error('Error fetching updated event data:', error);
            });
        }
      }}
    />
    </>
  )
}
