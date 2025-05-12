"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ArrowLeft, Edit, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { useFinance, useFinanceMutations } from "@/hooks/useFinance"
import { formatRupiah } from "@/lib/utils"

interface FinanceDetailProps {
  financeId: string | number
}

export function FinanceDetail({ financeId }: FinanceDetailProps) {
  const router = useRouter()
  const { data: finance, isLoading, error } = useFinance(financeId)
  const { deleteFinance } = useFinanceMutations()
  const [isDeleting, setIsDeleting] = useState(false)

  // Format currency in Rupiah
  const formatCurrency = (amount: string) => {
    return formatRupiah(amount)
  }

  // Handle delete
  const handleDelete = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      setIsDeleting(true)
      try {
        deleteFinance.mutate(financeId)
        router.push("/finance")
      } catch (error) {
        console.error("Error deleting finance:", error)
        setIsDeleting(false)
      }
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center p-4 text-red-600 bg-red-50 rounded-lg">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>Terjadi kesalahan saat memuat data. Silakan coba lagi.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/finance/${financeId}/edit`)}
            disabled={isLoading}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || isDeleting}
          >
            {isDeleting ? (
              <>
                <Skeleton className="h-4 w-4 mr-2 rounded-full" /> Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> Hapus
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Transaksi</CardTitle>
          <CardDescription>Informasi lengkap transaksi keuangan</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          ) : finance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Deskripsi</h3>
                  <p className="text-lg font-medium">{finance.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Kategori</h3>
                  <Badge className="mt-1" variant={finance.category === "Pemasukan" ? "success" : finance.category === "Pengeluaran" ? "destructive" : "outline"}>
                    {finance.category}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tanggal</h3>
                  <p className="text-lg font-medium">
                    {format(parseISO(finance.date), "EEEE, dd MMMM yyyy", { locale: id })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Waktu</h3>
                  <p className="text-lg font-medium">
                    {format(parseISO(finance.date), "HH:mm", { locale: id })}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Jumlah</h3>
                  <p className={`text-2xl font-medium ${finance.category === "Pemasukan" ? "text-green-600" : finance.category === "Pengeluaran" ? "text-red-600" : ""}`}>
                    {finance.category === "Pemasukan" ? "+" : finance.category === "Pengeluaran" ? "-" : ""}
                    {formatCurrency(finance.amount)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Sebelum</h3>
                  <p className="text-lg font-medium">{formatCurrency(finance.balance_before)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Sesudah</h3>
                  <p className="text-lg font-medium">{formatCurrency(finance.balance_after)}</p>
                </div>

              </div>
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground">Transaksi tidak ditemukan</p>
          )}
        </CardContent>
        <CardFooter className="text-sm text-gray-500">
          {finance && (
            <div className="w-full flex flex-col md:flex-row md:justify-between gap-2">
              <p>Dibuat pada: {format(parseISO(finance.created_at), "dd MMM yyyy HH:mm", { locale: id })}</p>
              <p>Terakhir diperbarui: {format(parseISO(finance.updated_at), "dd MMM yyyy HH:mm", { locale: id })}</p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
