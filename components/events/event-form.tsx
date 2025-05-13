"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { eventApi, type EventFormData, type Event } from "@/lib/api-service" // Updated path
import { useEventMutations } from "@/hooks/useEvents"
import { useEventAttendance } from "@/hooks/useEventAttendance"
import { format, parse, isValid } from "date-fns"
import { MemberAttendanceForm } from "@/components/events/member-attendance-form"
import { MeetingMinutesForm } from "@/components/events/meeting-minutes-form"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// Define the form schema with validation
const eventFormSchema = z.object({
  title: z.string().min(1, { message: "Judul acara harus diisi" }),
  description: z.string().min(1, { message: "Deskripsi acara harus diisi" }),
  date: z.string().min(1, { message: "Tanggal acara harus diisi" }),
  time: z.string().min(1, { message: "Waktu acara harus diisi" }),
  location: z.string().min(1, { message: "Lokasi acara harus diisi" }),
  status: z.string().min(1, { message: "Status acara harus diisi" }),
})

// Define the props for the EventForm component
interface EventFormProps {
  event?: Event
  onSuccess?: (event: Event) => void
}

export function EventForm({ event, onSuccess }: EventFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("details")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get event mutations from custom hook
  const { createEvent, updateEvent } = useEventMutations()

  // Initialize the form with default values or existing event data
  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      date: event?.date ? format(new Date(event.date), "yyyy-MM-dd") : "",
      time: event?.time ?
        (typeof event.time === 'string' && event.time.match(/(\d{2}):(\d{2})/) ?
          `${event.time.match(/(\d{2}):(\d{2})/)![1]}:${event.time.match(/(\d{2}):(\d{2})/)![2]}` :
          "") :
        "",
      location: event?.location || "",
      status: event?.status || "akan datang",
    },
  })

  // Handle form submission
  const onSubmit = async (formData: z.infer<typeof eventFormSchema>) => {
    setIsSubmitting(true)
    try {
      // Determine if we're creating a new event or updating an existing one
      if (event?.id) {
        // Update existing event
        await handleUpdateEvent(formData)
      } else {
        // Create new event
        await handleCreateEvent(formData)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan data acara",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle creating a new event
  const handleCreateEvent = async (formData: z.infer<typeof eventFormSchema>) => {
    try {
      // Format the data for the API
      const eventData: EventFormData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        status: formData.status,
      }

      // Create the event
      const newEvent = await createEvent.mutateAsync(eventData)

      // Show success message
      toast({
        title: "Berhasil",
        description: "Acara berhasil dibuat",
      })

      // Attendance records are now managed after event creation

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess(newEvent)
      } else {
        // Navigate to the event detail page
        router.push(`/dashboard/events/${newEvent.id}`)
      }
    } catch (error) {
      console.error("Error creating event:", error)
      throw error
    }
  }

  // Handle updating an existing event
  const handleUpdateEvent = async (formData: z.infer<typeof eventFormSchema>) => {
    if (!event?.id) return

    try {
      // Check which fields have changed to only update those
      const changedFields: Partial<EventFormData> = {}

      // Helper function to check if a value has changed
      const hasChanged = (newValue: any, oldValue: any) => {
        if (newValue === undefined || oldValue === undefined) return false
        return newValue !== oldValue
      }

      // Check each field
      if (hasChanged(formData.title, event.title)) changedFields.title = formData.title
      if (hasChanged(formData.description, event.description)) changedFields.description = formData.description
      if (hasChanged(formData.location, event.location)) changedFields.location = formData.location
      if (hasChanged(formData.status, event.status)) changedFields.status = formData.status

      // For date, extract and compare just the date part
      const eventDatePart = event.date ? format(new Date(event.date), "yyyy-MM-dd") : ""
      if (formData.date !== eventDatePart) changedFields.date = formData.date

      // For time, extract and compare just the time part
      // The backend might return time in different formats or as event_time
      let eventTimePart = '';

      // Try to extract time from event.time
      if (typeof event.time === 'string' && event.time) {
        const timeMatch = event.time.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
          eventTimePart = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      }

      // If we couldn't extract from time, try event_time if it exists
      if (!eventTimePart && (event as any).event_time) {
        const eventTimeValue = (event as any).event_time;
        if (typeof eventTimeValue === 'string') {
          const timeMatch = eventTimeValue.match(/(\d{2}):(\d{2})/);
          if (timeMatch) {
            eventTimePart = `${timeMatch[1]}:${timeMatch[2]}`;
          }
        }
      }

      if (formData.time !== eventTimePart) {
        console.log(`Time changed from '${eventTimePart}' to '${formData.time}'`);
        changedFields.time = formData.time;
      }

      // If no fields have changed, show a message and return
      if (Object.keys(changedFields).length === 0) {
        toast({
          title: "Info",
          description: "Tidak ada perubahan data acara",
        })
        return
      }

      // Update the event with only the changed fields
      const updatedEvent = await updateEvent.mutateAsync({
        id: event.id,
        data: changedFields,
      })

      // Show success message
      toast({
        title: "Berhasil",
        description: "Acara berhasil diperbarui",
      })

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess(updatedEvent)
      }
    } catch (error) {
      console.error("Error updating event:", error)
      throw error
    }
  }

  // Attendance records are now managed in the attendance tab after event creation

  // For new events, only show the event form without tabs
  if (!event?.id) {
    return (
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Buat Acara Baru</CardTitle>
                <CardDescription>
                  Isi formulir berikut untuk membuat acara baru
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Acara</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan judul acara" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan deskripsi acara"
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waktu</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan lokasi acara" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status acara" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="akan datang">Akan Datang</SelectItem>
                          <SelectItem value="selesai">Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    );
  }

  // For existing events, show the tabs interface
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Detail Acara</TabsTrigger>
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="minutes">Notulensi</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Acara</CardTitle>
                  <CardDescription>
                    Edit informasi acara yang sudah ada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Judul Acara</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan judul acara" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Masukkan deskripsi acara"
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waktu</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lokasi</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan lokasi acara" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status acara" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="akan datang">Akan Datang</SelectItem>
                            <SelectItem value="selesai">Selesai</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Kehadiran</CardTitle>
              <CardDescription>
                Kelola daftar kehadiran untuk acara ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberAttendanceForm
                eventId={event.id}
                onAttendanceChange={(records) => {
                  console.log('Attendance records updated:', records);
                  // You can add additional logic here if needed
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minutes" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notulensi Rapat</CardTitle>
              <CardDescription>
                Kelola notulensi rapat untuk acara ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MeetingMinutesForm
                eventId={event.id}
                onSubmit={(data) => {
                  console.log('Meeting minutes submitted:', data);
                  // Handle the submission here
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
