"use client"

import { useState, useEffect } from "react"
import { DollarSign } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"

export function RealFinance() {
  const [isLoading, setIsLoading] = useState(true)
  const [financeSummary, setFinanceSummary] = useState({
    total_income: "20000",
    total_expense: "5000",
    current_balance: "15000"
  })

  useEffect(() => {
    const fetchFinanceSummary = async () => {
      try {
        setIsLoading(true)
        console.log('Fetching finance summary')

        // Get token from localStorage
        const token = localStorage.getItem('token')

        if (!token) {
          console.error("No authentication token found")
          throw new Error("Authentication required")
        }

        // Use direct backend URL instead of local API proxy
        const response = await fetch('https://beopn.penaku.site/api/v1/finance/summary', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const summary = await response.json()
        console.log('Fetched finance summary:', summary)

        setFinanceSummary({
          total_income: summary.total_income || "0",
          total_expense: summary.total_expense || "0",
          current_balance: summary.current_balance || "0"
        })
      } catch (error) {
        console.error('Error fetching finance summary:', error)

        // Show real error state in the UI
        setFinanceSummary({
          total_income: "0",
          total_expense: "0",
          current_balance: "0"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchFinanceSummary()
  }, [])

  // Format currency function
  const formatRupiah = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
      .format(numValue)
      .replace(/^Rp\s*/, 'Rp') // Remove space after Rp
  }

  return (
    <StatCard
      title="Keuangan"
      value={formatRupiah(financeSummary.current_balance)}
      isLoading={isLoading}
      description="Saldo bersih"
      trend="up"
      percentage={0}
      icon={DollarSign}
      color="green"
    />
  )
}
