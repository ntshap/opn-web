"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ArrowUpDown, Edit, Plus, Search, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { useFinanceHistory } from "@/hooks/useFinance"
import { formatRupiah } from "@/lib/utils"

import { TruncatedDescription } from "./truncated-description"

export function FinanceList() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    category: "",
    start_date: "",
    end_date: "",
  })
  // Fetch finance history with real API
  const { data, isLoading, error, refetch } = useFinanceHistory(filters)

  // Format currency in Rupiah
  const formatCurrency = (amount: string) => {
    return formatRupiah(amount)
  }

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  // Apply filters
  const handleApplyFilters = () => {
    refetch()
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      category: "",
      start_date: "",
      end_date: "",
    })
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-medium tracking-tight">Keuangan</h2>
        <Button onClick={() => router.push("/finance/create")}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Transaksi
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Keuangan</CardTitle>
          <CardDescription>Saldo dan ringkasan transaksi keuangan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Saldo Saat Ini</p>
              <p className="text-2xl font-medium">{isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(data?.current_balance || "0")}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Pemasukan</p>
              <p className="text-2xl font-medium">
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency(
                    data?.transactions
                      .filter((t) => t.category === "Pemasukan")
                      .reduce((sum, t) => sum + Number(t.amount), 0)
                      .toString() || "0"
                  )
                )}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Pengeluaran</p>
              <p className="text-2xl font-medium">
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency(
                    data?.transactions
                      .filter((t) => t.category === "Pengeluaran")
                      .reduce((sum, t) => sum + Number(t.amount), 0)
                      .toString() || "0"
                  )
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Kategori</SelectItem>
                  <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                placeholder="Tanggal Mulai"
                value={filters.start_date}
                onChange={(e) => handleFilterChange("start_date", e.target.value)}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="Tanggal Akhir"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="flex-1">
                <Search className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button variant="outline" onClick={handleResetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>Riwayat transaksi keuangan</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center p-4 text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>Terjadi kesalahan saat memuat data. Silakan coba lagi.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-9 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : data?.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Tidak ada transaksi yang ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.transactions.map((finance) => (
                      <TableRow key={finance.id}>
                        <TableCell>
                          {format(parseISO(finance.date), "dd MMM yyyy", { locale: id })}
                        </TableCell>
                        <TableCell className="min-w-[200px] max-w-[300px]">
                          <TruncatedDescription
                            description={finance.description}
                            maxLength={30}
                            title={`Deskripsi Transaksi - ${format(parseISO(finance.date), "dd MMM yyyy", { locale: id })}`}
                          />
                        </TableCell>
                        <TableCell>
                          <span
                            className="py-1 px-3 rounded inline-flex items-center"
                            style={{
                              backgroundColor: finance.category === "Pemasukan" ? "#dcfce7" : finance.category === "Pengeluaran" ? "#fee2e2" : "#f3f4f6",
                              color: finance.category === "Pemasukan" ? "#166534" : finance.category === "Pengeluaran" ? "#991b1b" : "#4b5563",
                              border: "none",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                              fontWeight: 400,
                              fontSize: "0.875rem"
                            }}
                          >
                            {finance.category}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right ${finance.category === "Pemasukan" ? "text-green-600" : finance.category === "Pengeluaran" ? "text-red-600" : ""}`}>
                          {finance.category === "Pemasukan" ? "+" : finance.category === "Pengeluaran" ? "-" : ""}
                          {formatCurrency(finance.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(finance.balance_after)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/finance/${finance.id}`)}
                              title="Edit Transaksi"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() => {
                                if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
                                  // Delete action would go here
                                  console.log("Delete finance", finance.id)
                                }
                              }}
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {data?.transactions.length || 0} transaksi
          </p>
          {/* Pagination would go here */}
        </CardFooter>
      </Card>


    </div>
  )
}
