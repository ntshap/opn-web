import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, User, Trash2, Edit } from "lucide-react"
import { SecureImage } from "@/components/shared/SecureImage"
import { formatImageUrl } from "@/lib/image-utils"
import { TipTapContent } from "@/components/ui/tiptap-editor"
import { useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import "./news-card.css"

interface NewsCardProps {
  id: number
  title: string
  description: string
  date: string
  is_published: boolean
  photos: Array<{ id: number, photo_url: string }>
  created_at: string
  updated_at: string
  onDelete?: (id: number) => void
}

export function NewsCard({
  id,
  title,
  description,
  date,
  is_published,
  photos,
  created_at,
  updated_at,
  onDelete
}: NewsCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('id-ID', options)
  }

  // Check if there are photos
  const hasPhoto = photos && photos.length > 0 && photos[0].photo_url;
  const photoUrl = hasPhoto ? photos[0].photo_url : null;

  // Log the photo URL for debugging
  if (hasPhoto) {
    console.log(`[NewsCard] Photo URL for news ${id}: ${photoUrl}`);
  }

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative h-48 w-full">
        <div className="relative w-full h-full">
          {/* Use our new SecureImage component */}
          <SecureImage
            src={photoUrl || ''}
            alt={title}
            width="100%"
            height="100%"
            className="object-cover"
            fallbackSrc="/placeholder-news.svg"
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        </div>
      </div>
      <CardHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className={`px-2 py-1 rounded-full text-xs ${is_published ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
            {is_published ? "Dipublikasikan" : "Draft"}
          </span>
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(date)}
          </div>
        </div>
        <CardTitle className="card-title">{title}</CardTitle>
        <CardDescription className="line-clamp-3">
          <div className="news-card-description">
            {/* Use TipTapContent for formatted description */}
            <TipTapContent content={description} />
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          <span>Diperbarui: {formatDate(updated_at)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex gap-4">
          <div className="flex items-center text-muted-foreground">
            <User className="h-4 w-4 mr-1" />
            <span>Admin</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/dashboard/news/${id}`} className="no-underline">
              Baca Selengkapnya
            </a>
          </Button>

          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Berita</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus berita ini? Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
