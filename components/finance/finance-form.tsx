"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { type Finance, type FinanceFormData } from "@/lib/api-service" // Updated path
import { useFinanceMutations } from "@/hooks/useFinance"

interface FinanceFormProps {
  finance?: Finance
  isEditing?: boolean
  onSuccess?: () => void
}

export function FinanceForm({ finance, isEditing = false, onSuccess }: FinanceFormProps) {
  const router = useRouter()
  // Get mutations
  const { createFinance, updateFinance } = useFinanceMutations()

  // Form state
  const [formData, setFormData] = useState({
    amount: "", // Start as string for input, will convert to number on submit
    category: "Pemasukan", // Default category - matches backend expectation
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    description: "",
  })


  const [errorMessage, setErrorMessage] = useState("")

  // Initialize form with finance data if editing
  useEffect(() => {
    if (isEditing && finance) {
      setFormData({
        amount: finance.amount, // Keep as string for the input field
        category: finance.category,
        date: finance.date.substring(0, 16), // Format for datetime-local input
        description: finance.description,
      })
    }
  }, [isEditing, finance])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }



  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    try {
      // Validate form data
      if (!formData.amount) throw new Error("Jumlah harus diisi")
      if (!formData.category) throw new Error("Kategori harus dipilih")
      if (!formData.date) throw new Error("Tanggal harus diisi")
      if (!formData.description) throw new Error("Deskripsi harus diisi")

      // Prepare data for API - convert amount to number as expected by backend
      const apiData = {
        amount: Number(formData.amount),
        category: formData.category as "Pemasukan" | "Pengeluaran", // Cast to expected type
        date: new Date(formData.date).toISOString(), // Format date as ISO string
        description: formData.description,
      }

      if (isEditing && finance) {
        // Update existing finance record
        updateFinance.mutate({
          id: finance.id,
          data: apiData,
        })
      } else {
        // Create new finance record
        createFinance.mutate(apiData)
      }

      // Call onSuccess callback or redirect
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/finance")
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const isSubmitting = createFinance.isPending || updateFinance.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Jumlah (Rupiah)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              className="pl-10"
              placeholder="0"
              required
            />
          </div>
          <p className="text-xs text-gray-500">Masukkan jumlah dalam Rupiah tanpa titik atau koma</p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <Select
            value={formData.category}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pemasukan">Pemasukan</SelectItem>
              <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
              <SelectItem value="Lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Tanggal</Label>
          <Input
            id="date"
            name="date"
            type="datetime-local"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Deskripsi transaksi"
            required
          />
        </div>


      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Menyimpan..." : "Membuat..."}
            </>
          ) : (
            <>{isEditing ? "Simpan Perubahan" : "Buat Transaksi"}</>
          )}
        </Button>
      </div>
    </form>
  )
}
