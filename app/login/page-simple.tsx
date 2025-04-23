"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function SimplifiedLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Function to handle direct login
  const handleDirectLogin = () => {
    setIsLoading(true)
    setError("")

    try {
      console.log("Performing direct login...")

      // Clear any existing auth data
      localStorage.clear()
      sessionStorage.clear()

      // Clear cookies
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      // Create a simple token
      const simpleToken = "admin-token-" + Date.now()

      // Set token in localStorage
      localStorage.setItem("token", simpleToken)
      localStorage.setItem("refreshToken", simpleToken)
      localStorage.setItem("admin_token", simpleToken)

      // Set token in cookies
      document.cookie = `token=${simpleToken};path=/;max-age=86400`

      // Set user data
      localStorage.setItem("user", JSON.stringify({
        id: 1,
        username: "admin",
        name: "Admin",
        role: "admin"
      }))

      console.log("Direct login successful, redirecting to dashboard...")

      // Redirect to dashboard
      window.location.href = "/dashboard"
    } catch (err) {
      console.error("Login error:", err)
      setError("An error occurred during login")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-6">
          <Image
            src="/images/opn-logo.png"
            alt="OPN Logo"
            width={80}
            height={80}
            className="rounded-full"
          />
        </div>

        <h1 className="text-2xl font-bold text-center mb-6">Login Langsung</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleDirectLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
          >
            {isLoading ? "Memproses..." : "Login Sebagai Admin"}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Klik tombol di atas untuk login langsung ke dashboard
          </p>
        </div>
      </div>
    </div>
  )
}
