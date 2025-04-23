"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useNewsItem, useNewsMutations } from "@/hooks/useNews"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Calendar, Edit, Trash, User } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatImageUrl } from "@/lib/image-utils"
import { NewsForm } from "../components/news-form"
import { PhotoTest } from "../components/photo-test"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function NewsDetailPageClient({ slug }: { slug: string }) {
  const router = useRouter()
  const newsId = slug
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Fetch news item
  const { data: newsItem, isLoading, error, refetch } = useNewsItem(newsId)
  const { updateNews, deleteNews, uploadNewsPhoto } = useNewsMutations()

  // Debug: Log the news item data when it's available
  useEffect(() => {
    if (newsItem) {
      console.log('News item data:', newsItem)
      if (newsItem.photos && newsItem.photos.length > 0) {
        console.log('News photo URL:', newsItem.photos[0].photo_url)
        console.log('Formatted photo URL:', formatImageUrl(newsItem.photos[0].photo_url))
      }
    }
  }, [newsItem])

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: id })
  }

  // Handle back button
  const handleBack = () => {
    router.back()
  }

  // Handle edit news
  const handleEditNews = async (data: any, photos?: File[]) => {
    updateNews.mutate({
      id: newsId,
      data: {
        title: data.title,
        description: data.description,
        date: data.date.toISOString(),
        is_published: data.is_published
      }
    }, {
      onSuccess: async () => {
        // Upload photos if provided
        if (photos && photos.length > 0) {
          // Upload each photo
          for (const photo of photos) {
            try {
              await uploadNewsPhoto.mutateAsync({
                id: newsId,
                file: photo
              })
            } catch (error) {
              console.error('Error uploading photo:', error)
            }
          }
        }

        setIsEditDialogOpen(false)
        refetch()
      }
    })
  }

  // Handle delete photo
  const handleDeletePhoto = async (photoId: number) => {
    try {
      // Call API to delete photo
      // Since we don't have a specific endpoint for deleting photos in the API docs,
      // we'll just refetch the news item after a simulated delay
      await new Promise(resolve => setTimeout(resolve, 500))
      refetch()
    } catch (error) {
      console.error('Error deleting photo:', error)
    }
  }

  // Handle delete news
  const handleDeleteNews = () => {
    deleteNews.mutate(newsId, {
      onSuccess: () => {
        router.push('/dashboard/news')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <Card>
          <CardHeader className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !newsItem) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Berita tidak ditemukan</p>
            <Button variant="outline" onClick={handleBack} className="mt-4">
              Kembali ke daftar berita
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Edit Berita</DialogTitle>
              </DialogHeader>
              <NewsForm
                defaultValues={{
                  title: newsItem.title,
                  description: newsItem.description,
                  date: new Date(newsItem.date),
                  is_published: newsItem.is_published
                }}
                existingPhotos={newsItem.photos}
                newsId={newsId}
                onSubmit={handleEditNews}
                onDeletePhoto={handleDeletePhoto}
                isSubmitting={updateNews.isPending}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="mr-2 h-4 w-4" />
                Hapus
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
                  onClick={handleDeleteNews}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteNews.isPending}
                >
                  {deleteNews.isPending ? "Menghapus..." : "Hapus"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Badge variant={newsItem.is_published ? "success" : "outline"}>
              {newsItem.is_published ? "Dipublikasikan" : "Draft"}
            </Badge>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(newsItem.date)}
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl">{newsItem.title}</CardTitle>
          <CardDescription className="flex items-center mt-2">
            <User className="h-3 w-3 mr-1" />
            <span>Admin</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {newsItem.photos && newsItem.photos.length > 0 && newsItem.photos[0].photo_url ? (
            <div className="relative h-64 md:h-96 w-full rounded-md overflow-hidden">
              {/* Log the photo URL for debugging */}
              {console.log('Photo URL:', newsItem.photos[0].photo_url)}

              {/* Use img tag with formatted URL and fallback */}
              <img
                src={formatImageUrl(newsItem.photos[0].photo_url)}
                alt={newsItem.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`Error loading image: ${newsItem.photos[0].photo_url}`)
                  // Set fallback image when the original fails to load
                  e.currentTarget.src = "/placeholder-news.svg"
                  // Add a class to indicate this is a fallback image
                  e.currentTarget.classList.add("fallback-image")
                }}
              />
            </div>
          ) : (
            <div className="relative h-64 md:h-96 w-full rounded-md overflow-hidden bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Tidak ada foto</p>
            </div>
          )}

          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: newsItem.description }} />
          </div>

          {/* Photo upload test component */}
          <PhotoTest newsId={newsId} />
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6">
          <div className="flex items-center text-sm text-muted-foreground">
            Dibuat: {formatDate(newsItem.created_at)}
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            Diperbarui: {formatDate(newsItem.updated_at)}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
