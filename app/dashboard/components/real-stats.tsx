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

        // Check if token exists in localStorage
        const token = localStorage.getItem('token')

        if (!token) {
          console.error("No authentication token found")
          // Redirect to login
          window.location.href = '/login'
          return
        }

        // apiClient will automatically use the token from localStorage

        try {
          console.log("Fetching events for stats calculation...");

          // Make a direct fetch call with the updated API format
          const response = await fetch('https://beopn.penaku.site/api/v1/events/?page=1&limit=100', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }

          // Get the raw text first to inspect it
          const rawText = await response.text();
          console.log('Raw API response for stats:', rawText.substring(0, 200) + '...');

          // Try to parse as JSON
          let responseData;
          try {
            responseData = JSON.parse(rawText);
            console.log('Parsed events data for stats:',
              typeof responseData === 'object' ?
                (Array.isArray(responseData) ?
                  `Array with ${responseData.length} items` :
                  `Object with keys: ${Object.keys(responseData).join(', ')}`) :
                typeof responseData);
          } catch (parseError) {
            console.error('Failed to parse JSON response for stats:', parseError);
            throw new Error('Invalid JSON response from server');
          }

          // Handle the new response format with metadata
          let events = [];
          let paginationMeta = null;

          console.log('Stats: Response structure:', Object.keys(responseData));

          // The new format should have data array and meta object
          if (responseData && typeof responseData === 'object') {
            // Check if the response has the expected structure
            if (Array.isArray(responseData)) {
              // If it's directly an array (old format)
              console.log('Stats: Response is an array with', responseData.length, 'items (old format)');
              events = responseData;
            } else {
              // New format with data and meta
              if (Array.isArray(responseData.data)) {
                console.log('Stats: Response has data array with', responseData.data.length, 'items');
                events = responseData.data;

                // Extract pagination metadata if available
                if (responseData.meta && typeof responseData.meta === 'object') {
                  paginationMeta = responseData.meta;
                  console.log('Stats: Pagination metadata:', paginationMeta);

                  // If we have total_pages > 1, use the total count from metadata if available
                  if (paginationMeta.total_pages && paginationMeta.total_pages > 1) {
                    console.log(`Stats: There are ${paginationMeta.total_pages} pages of events.`);

                    // If the API provides a total count, use it instead of just the current page
                    if (paginationMeta.total_count !== undefined) {
                      console.log(`Stats: Using total_count from metadata: ${paginationMeta.total_count}`);
                      // We'll use this later when calculating stats
                    } else {
                      console.log(`Stats: No total_count in metadata. Current stats are based on page 1 only.`);
                    }
                  }
                }
              } else {
                // If data is not an array, look for any array in the response
                console.log('Stats: Looking for arrays in response object');
                const arrayProps = Object.entries(responseData)
                  .filter(([_, value]) => Array.isArray(value))
                  .map(([key, value]) => ({ key, length: (value as any[]).length }));

                console.log('Stats: Found array properties:', arrayProps);

                if (arrayProps.length > 0) {
                  // Use the first array found
                  const firstArrayKey = arrayProps[0].key;
                  events = responseData[firstArrayKey];
                  console.log(`Stats: Using array from property '${firstArrayKey}' with ${events.length} items`);
                } else {
                  console.log('Stats: No arrays found in response');
                }
              }
            }
          }

          // Calculate stats from real data
          // Make sure we have an array before calculating stats
          if (!Array.isArray(events)) {
            console.error('Events data is not an array:', events)
            setStats({
              totalEvents: 0,
              activeEvents: 0,
              totalPhotos: 0
            })
            return
          }

          // Calculate total events - use metadata total_count if available
          let totalEvents = events.length;

          // If we have pagination metadata with total_count, use that instead
          if (paginationMeta && paginationMeta.total_count !== undefined) {
            totalEvents = paginationMeta.total_count;
            console.log(`Stats: Using total count from metadata: ${totalEvents}`);
          }

          // Calculate active events (status "akan datang")
          const activeEvents = events.filter(e => e.status === "akan datang").length

          // Calculate total photos across all events
          // The API returns photos array for each event
          const totalPhotos = events.reduce((acc, e) => {
            // Check if photos property exists and is an array
            if (e.photos && Array.isArray(e.photos)) {
              return acc + e.photos.length
            }
            return acc
          }, 0)

          setStats({
            totalEvents,
            activeEvents,
            totalPhotos
          })

          console.log('Fetched real stats:', { totalEvents, activeEvents, totalPhotos })
        } catch (error) {
          console.error('Error fetching stats:', error)

          // Handle authentication error
          if (error.response?.status === 401 || (error instanceof Error && error.message.includes('401'))) {
            console.error("Authentication error, redirecting to login")

            // Clear tokens
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')

            // Redirect to login
            window.location.href = '/login'
            return
          }

          // For other errors, set stats to 0 values
          setStats({
            totalEvents: 0,
            activeEvents: 0,
            totalPhotos: 0
          })

          // Log detailed error information for debugging
          if (error.response) {
            console.error('API error response:', {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers
            })
          } else if (error.request) {
            console.error('No response received:', error.request)
          } else {
            console.error('Error setting up request:', error.message)
          }
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
