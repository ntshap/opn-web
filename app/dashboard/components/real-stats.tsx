"use client"

import { useState, useEffect } from "react"
import { Calendar, Users, FileText } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { apiClient } from "@/lib/api-client"

export function RealStats() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalPhotos: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)

        // Get token from localStorage
        const token = localStorage.getItem('token')

        if (!token) {
          console.error("No authentication token found")
          // Redirect to login
          window.location.href = '/login'
          return
        }

        try {
          // Fetch events directly from the backend API
          const response = await fetch('https://beopn.mysesa.site/api/v1/events/?limit=100', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }

          const events = await response.json()

          // Events data is already parsed from the fetch response

          // Calculate stats from real data
          const totalEvents = events.length
          const activeEvents = events.filter(e => e.status === "akan datang").length
          const totalPhotos = events.reduce((acc, e) => acc + (e.photos?.length || 0), 0)

          setStats({
            totalEvents,
            activeEvents,
            totalPhotos
          })

          console.log('Fetched real stats:', { totalEvents, activeEvents, totalPhotos })
        } catch (error) {
          console.error('Error fetching stats:', error)

          // Handle authentication error
          if (error.response?.status === 401) {
            console.error("Authentication error, redirecting to login")

            // Clear tokens
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')

            // Redirect to login
            window.location.href = '/login'
            return
          }

          // Keep the default values for other errors
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <>
      <StatCard
        title="Total Acara"
        value={stats.totalEvents.toString()}
        description="Total acara"
        trend="up"
        percentage={0}
        icon={Calendar}
        isLoading={isLoading}
      />
      <StatCard
        title="Acara Aktif"
        value={stats.activeEvents.toString()}
        description="Acara mendatang"
        trend="up"
        percentage={0}
        icon={Users}
        isLoading={isLoading}
      />
      <StatCard
        title="Total Foto"
        value={stats.totalPhotos.toString()}
        description="Foto acara"
        trend="up"
        percentage={0}
        icon={FileText}
        isLoading={isLoading}
      />
    </>
  )
}
