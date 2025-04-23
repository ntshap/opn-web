"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi } from "@/lib/api-service" // Updated path

export default function SecurityTest() {
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean
    tokenStart?: string
    tokenLength?: number
  }>({ hasToken: false })

  useEffect(() => {
    // Check token status
    const token = localStorage.getItem('token')
    if (token) {
      setTokenInfo({
        hasToken: true,
        tokenStart: token.substring(0, 10) + '...',
        tokenLength: token.length
      })
    }
  }, [])

  const handleTestLogin = async () => {
    try {
      await authApi.login('test@example.com', 'password')
      // Re-check token after login
      const token = localStorage.getItem('token')
      if (token) {
        setTokenInfo({
          hasToken: true,
          tokenStart: token.substring(0, 10) + '...',
          tokenLength: token.length
        })
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const handleTestLogout = async () => {
    await authApi.logout()
    setTokenInfo({ hasToken: false })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Security Test Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-medium">Token Status:</h3>
            <p>Has Token: {tokenInfo.hasToken ? '✅' : '❌'}</p>
            {tokenInfo.hasToken && (
              <>
                <p>Token Start: {tokenInfo.tokenStart}</p>
                <p>Token Length: {tokenInfo.tokenLength}</p>
              </>
            )}
          </div>
          
          <div className="space-x-4">
            <Button onClick={handleTestLogin}>
              Test Login
            </Button>
            <Button onClick={handleTestLogout} variant="destructive">
              Test Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
