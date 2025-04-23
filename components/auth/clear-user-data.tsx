"use client"

import { useEffect } from "react"

export function ClearUserData() {
  useEffect(() => {
    // Clear any user data from localStorage for security
    if (typeof window !== "undefined") {
      // Only remove the user data, keep the token
      localStorage.removeItem("user")
    }
  }, [])

  return null
}
