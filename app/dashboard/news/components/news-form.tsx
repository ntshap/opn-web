import { useState, useRef } from "react"
import { useForm, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TipTapEditor } from "@/components/ui/tiptap-editor"
import { Switch } from "@/components/ui/switch"
import { Calendar as CalendarIcon, ImagePlus, Loader2, Trash, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { NewsFormData, NewsPhoto } from "@/lib/api-service" // Updated path
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatImageUrl } from "@/lib/image-utils"
import { SecureImage } from "@/components/shared/SecureImage"

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "Judul harus diisi"),
  description: z.string().min(1, "Deskripsi harus diisi"),
  date: z.date({
    required_error: "Tanggal harus diisi",
  }),
  is_published: z.boolean().default(false),
})

interface NewsFormProps {
  defaultValues?: Partial<NewsFormData & { date: Date }>
  existingPhotos?: NewsPhoto[]
  newsId?: number | string
  onSubmit: (data: z.infer<typeof formSchema>, photos?: File[]) => void
  onDeletePhoto?: (photoId: number) => void
  isSubmitting?: boolean
}

export function NewsForm({ defaultValues, existingPhotos = [], newsId, onSubmit, onDeletePhoto, isSubmitting = false }: NewsFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Explicitly type the form with the Zod schema inference
  type NewsFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewsFormValues>({ // Use explicit type
    resolver: zodResolver(formSchema) as Resolver<NewsFormValues>,
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      is_published: defaultValues?.is_published || false,
    },
  })

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...newFiles])

      // Create preview URLs
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file))
      setPreviewUrls(prev => [...prev, ...newPreviewUrls])
    }
  }

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))

    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  // Handle delete existing photo
  const handleDeletePhoto = (photoId: number) => {
    if (onDeletePhoto) {
      onDeletePhoto(photoId)
    }
  }

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  function handleSubmit(values: NewsFormValues) { // Use explicit type
    onSubmit(values, selectedFiles.length > 0 ? selectedFiles : undefined)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan judul berita" {...field} />
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
                <div
                  className="border rounded-md"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <TipTapEditor
                    content={field.value || ''}
                    onChange={(html) => {
                      field.onChange(html);
                      console.log('TipTap content updated:', html);
                    }}
                    placeholder="Masukkan deskripsi berita"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: id })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Publikasikan</FormLabel>
                <FormDescription>
                  Berita akan langsung dipublikasikan jika diaktifkan
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Photo Upload Section */}
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <FormLabel>Foto Berita</FormLabel>
            <FormDescription>
              Unggah foto untuk berita ini. Format yang didukung: JPG, PNG, GIF. Ukuran maksimal: 5MB.
            </FormDescription>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              multiple
            />

            {/* Upload button */}
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileInput}
              className="w-full h-24 border-dashed flex flex-col items-center justify-center gap-2"
            >
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span>Klik untuk mengunggah foto</span>
            </Button>
          </div>

          {/* Preview of selected files */}
          {previewUrls.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Foto yang akan diunggah:</h4>
              <ScrollArea className="h-40 w-full rounded-md border">
                <div className="flex gap-2 p-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="relative h-32 w-32 rounded-md overflow-hidden">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeSelectedFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Existing photos */}
          {existingPhotos && existingPhotos.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Foto yang sudah ada:</h4>
              <ScrollArea className="h-40 w-full rounded-md border">
                <div className="flex gap-2 p-2">
                  {existingPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="relative h-32 w-32 rounded-md overflow-hidden">
                        {/* Use our new SecureImage component */}
                        <SecureImage
                          src={photo.photo_url}
                          alt={`Photo ${photo.id}`}
                          width="100%"
                          height="100%"
                          className="object-cover"
                          fallbackSrc="/placeholder-news.svg"
                          style={{ position: 'absolute', top: 0, left: 0 }}
                        />
                      </div>
                      {onDeletePhoto && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeletePhoto(photo.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Berita"
          )}
        </Button>
      </form>
    </Form>
  )
}
