"use client"

import { useState, useEffect } from "react"
import { AlertCircle, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showAlert, setShowAlert] = useState(false)
  const [apiConnected, setApiConnected] = useState(true)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    // Show alert if initially offline
    if (!navigator.onLine) {
      setShowAlert(true)
    }

    // Define event handlers
    const handleOnline = () => {
      console.log('Network connection restored')
      setIsOnline(true)
      // Show a temporary alert when connection is restored
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 5000) // Hide after 5 seconds
    }

    const handleOffline = () => {
      console.log('Network connection lost')
      setIsOnline(false)
      setShowAlert(true) // Keep showing when offline
    }

    // Simple function to check if we can reach the API base URL
    const checkApiConnection = async () => {
      try {
        // Just check if we're online, don't make actual API calls
        if (navigator.onLine) {
          setApiConnected(true)
        } else {
          setApiConnected(false)
          setShowAlert(true)
        }
      } catch (error) {
        console.log('API connection check failed:', error)
      }
    }

    // Check API connection initially
    checkApiConnection()

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])

  if (!showAlert) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {!isOnline ? (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Tidak Ada Koneksi Internet</AlertTitle>
          <AlertDescription>
            Anda sedang offline. Beberapa fitur mungkin tidak berfungsi dengan baik.
            Silakan periksa koneksi internet Anda.
          </AlertDescription>
        </Alert>
      ) : !apiConnected ? (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Masalah Koneksi Server</AlertTitle>
          <AlertDescription className="text-amber-700">
            Koneksi ke server bermasalah. Login dan beberapa fitur mungkin tidak berfungsi.
            Silakan coba lagi nanti.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Koneksi Dipulihkan</AlertTitle>
          <AlertDescription className="text-green-700">
            Koneksi internet Anda telah dipulihkan. Anda dapat melanjutkan aktivitas.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
