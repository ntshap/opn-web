"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LockKeyhole, User } from "@/components/ui/icons"
import { authApi } from "@/lib/api-auth"
import { NetworkStatus } from "@/components/ui/network-status"
// import { forceSetAuth, clearAllAuth } from "@/lib/force-auth"

import { API_CONFIG } from '@/lib/config'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const redirectingRef = useRef(false)

  // Simple check for existing login - no automatic redirects
  useEffect(() => {
    console.log('Login page loaded - checking for logout parameter');

    // Check if this is a logout redirect (has timestamp parameter)
    const params = new URLSearchParams(window.location.search);
    const isLogoutRedirect = params.has('t');

    if (isLogoutRedirect) {
      console.log('Login page loaded after logout, clearing all tokens');
      // Clear any remaining tokens to be safe
      localStorage.clear();
      sessionStorage.clear();

      // Clear cookies
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }

    // Check for error parameter in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get('error');
      const redirectParam = params.get('redirect');

      // Store redirect path if provided
      if (redirectParam) {
        localStorage.setItem(API_CONFIG.AUTH.REDIRECT_KEY, redirectParam);
      }

      // Handle error messages
      if (errorParam === 'backend_offline') {
        setError('Server tidak tersedia. Silakan coba lagi nanti.');
      } else if (errorParam === 'unauthorized') {
        setError('Sesi Anda telah berakhir. Silakan masuk kembali.');
      }
    }

    // Only auto-login in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Auto-login enabled');

      // Set default credentials
      setUsername('admin');
      setPassword('admin');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Reset redirecting flag to ensure button can be clicked again if needed
    redirectingRef.current = false;

    try {
      // Clear any existing tokens
      localStorage.removeItem(API_CONFIG.AUTH.TOKEN_KEY)
      localStorage.removeItem(API_CONFIG.AUTH.REFRESH_TOKEN_KEY)

      console.log("Attempting to login with username:", username);

      // Use the auth API service to login
      await authApi.login(username, password);

      // Login successful, tokens are already stored by authApi.login
      console.log("Login successful, token received")

      // Explicitly set the is_logged_in flag to true
      localStorage.setItem('is_logged_in', 'true');
      console.log("is_logged_in flag set to true")

      // Get redirect path or default to dashboard
      const redirectPath = localStorage.getItem(API_CONFIG.AUTH.REDIRECT_KEY) || '/dashboard'
      localStorage.removeItem(API_CONFIG.AUTH.REDIRECT_KEY)

      // Small delay to ensure tokens are stored
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verify token is stored before redirecting
      const storedToken = localStorage.getItem('auth_token')
      console.log('Before redirect - token in localStorage:', storedToken ? 'present' : 'missing')

      if (!storedToken) {
        console.warn('Token not found in localStorage after login')
      }

      // Redirect
      console.log("Login successful, redirecting to:", redirectPath)

      // Use window.location.href for a full page refresh to ensure tokens are properly loaded
      window.location.href = redirectPath;
      // Don't use router.push here as it might not fully reload the page

    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Terjadi kesalahan saat login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <NetworkStatus />
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute -left-4 -top-24 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl animate-blob"></div>
        <div className="absolute -right-4 -bottom-24 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute left-1/3 top-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <LockKeyhole className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">
              Selamat Datang Kembali
            </CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-gray-400">
              Masukkan kredensial Anda untuk mengakses dasbor
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="px-6 pb-4">
              <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-blue-400 transition-all"
                  placeholder="Masukkan nama pengguna Anda"
                />
                <User className="w-5 h-5 text-blue-600 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-blue-400 transition-all"
                  placeholder="Masukkan kata sandi Anda"
                />
                <LockKeyhole className="w-5 h-5 text-blue-600 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full text-blue-600 font-normal py-2 px-4 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: '#e0f2fe',
                border: 'none',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </div>
              ) : (
                "Masuk"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
