"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NewsCard } from "./components/news-card"
import Link from "next/link"
import { useNews, useNewsMutations } from "@/hooks/useNews"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Plus } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { NewsForm } from "./components/news-form"

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [skip, setSkip] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const searchParams = useSearchParams()

  // Check for action parameter in URL
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create') {
      setIsDialogOpen(true)
    }
  }, [searchParams])

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Fetch news with filters
  const { data: newsItems = [], isLoading, error, refetch } = useNews({
    skip: skip,
    limit: 9,
    is_published: activeTab === "published" ? true : activeTab === "draft" ? false : undefined,
    search: debouncedSearchQuery || undefined
  })

  // Ensure newsItems is always an array
  const safeNewsItems = Array.isArray(newsItems) ? newsItems : [];

  // News mutations
  const { createNews, uploadNewsPhoto } = useNewsMutations()

  // Handle load more
  const handleLoadMore = async () => {
    if (safeNewsItems.length >= 9) {
      setIsLoadingMore(true)
      setSkip(prev => prev + 9)
      await refetch()
      setIsLoadingMore(false)
    }
  }

  // Handle create news
  const handleCreateNews = async (data: any, photos?: File[]) => {
    createNews.mutate({
      title: data.title,
      description: data.description,
      date: data.date.toISOString(),
      is_published: data.is_published
    }, {
      onSuccess: async (newNews) => {
        // Upload photos if provided
        if (photos && photos.length > 0 && newNews.id) {
          // Upload each photo
          for (const photo of photos) {
            try {
              await uploadNewsPhoto.mutateAsync({
                id: newNews.id,
                file: photo
              })
            } catch (error) {
              console.error('Error uploading photo:', error)
            }
          }
        }

        setIsDialogOpen(false)
        refetch()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-64">
            <Input
              placeholder="Cari berita..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="published">Dipublikasikan</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button
              className="flex items-center text-blue-600 py-2 px-4 rounded"
              style={{
                backgroundColor: '#e0f2fe',
                border: 'none',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                fontWeight: 400
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Berita
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Tambah Berita Baru</DialogTitle>
            </DialogHeader>
            <NewsForm
              onSubmit={handleCreateNews}
              isSubmitting={createNews.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        // Loading skeleton
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <p className="text-muted-foreground">Terjadi kesalahan saat memuat berita</p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-sm text-red-500 mt-2">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            )}
          </CardContent>
        </Card>
      ) : safeNewsItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <p className="text-muted-foreground">Tidak ada berita yang ditemukan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeNewsItems.map((news) => (
            <NewsCard
              key={news.id}
              id={news.id}
              title={news.title}
              description={news.description}
              date={news.date}
              is_published={news.is_published}
              photos={news.photos}
              created_at={news.created_at}
              updated_at={news.updated_at}
            />
          ))}
        </div>
      )}

      {safeNewsItems.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={safeNewsItems.length < 9 || isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat...
              </>
            ) : safeNewsItems.length >= 9 ? (
              "Muat Lebih Banyak"
            ) : (
              "Tidak ada lagi berita"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
