"use client"

import { useEffect, useState } from "react"
import { Calendar, Users, FileText } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api-client"

interface Event {
  id: number
  title: string
  date: string
  status: string
  photos?: any[]
}

export function RealEventsStats() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // No sample data - we'll only use real data from the backend

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)

        // Use the local API proxy instead of direct backend call
        const response = await fetch('/api/v1/events', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('Events data for stats from backend:', data)

        // Ensure data is an array
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data)
          setError(null)
        } else {
          // If no events, set empty array
          setEvents([])
          setError(null)
        }
      } catch (err) {
        console.error("Error in events stats component:", err)
        // Don't use sample data, just show empty data
        setEvents([])
        setError("Gagal memuat data acara dari server")
        toast({
          title: "Error",
          description: "Gagal memuat data statistik acara. Silakan coba lagi nanti.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [toast])

  // Calculate stats
  const totalEvents = events.length
  const activeEvents = events.filter(e => e.status === "akan datang").length
  const totalPhotos = events.reduce((acc, e) => acc + (e.photos?.length || 0), 0)

  return (
    <>
      <StatCard
        title="Total Acara"
        value={totalEvents.toString()}
        description="Total acara"
        trend="up"
        percentage={0}
        icon={Calendar}
        isLoading={isLoading}
      />
      <StatCard
        title="Acara Aktif"
        value={activeEvents.toString()}
        description="Acara mendatang"
        trend="up"
        percentage={0}
        icon={Users}
        isLoading={isLoading}
      />
      <StatCard
        title="Total Foto"
        value={totalPhotos.toString()}
        description="Foto acara"
        trend="up"
        percentage={0}
        icon={FileText}
        isLoading={isLoading}
      />
    </>
  )
}
