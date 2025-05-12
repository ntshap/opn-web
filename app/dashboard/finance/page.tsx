"use client";

import { useFinanceData } from "@/lib/hooks/use-finance-data";
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// Badge styling is now handled via CSS classes
import { PlusCircle, Edit, Trash2, ArrowUp, ArrowDown, Image } from "lucide-react"
import { TransactionForm } from "./components/transaction-form"
import { useFinanceHistory, useFinanceMutations, type FinanceData, type FinanceTransaction } from "@/hooks/useFinance"
import { formatRupiah } from "@/lib/utils"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

import { FinanceDocumentGallery } from "./components/finance-document-gallery"
import { TipTapContent } from "@/components/ui/tiptap-editor"
import { TruncatedDescription } from "@/components/finance/truncated-description"
import "./finance.css"

// Local interface for displaying transactions in the UI
interface Transaction extends FinanceTransaction {
  // Add any UI-specific fields here
  type?: "income" | "expense" // Optional field for UI purposes
}

interface TransactionFormData {
  amount: string;
  type: "income" | "expense";
  date: Date;
  description: string;
}

export default function FinancePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [selectedFinanceId, setSelectedFinanceId] = useState<number | null>(null)
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string | null>(null)

  const { data: financeSummary, isLoading } = useFinanceData();
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    refetch
  } = useFinanceHistory();

  // Map API transactions to UI transactions with derived type field
  const transactions: Transaction[] = (transactionsData?.transactions || []).map(t => ({
    ...t,
    type: t.category === "Pemasukan" ? "income" : "expense"
  }));
  const { createFinance, updateFinance, deleteFinance } = useFinanceMutations();

  const handleAddTransaction = (data: TransactionFormData) => {
    const financeData: FinanceData = {
      amount: Number(data.amount),
      category: data.type === "income" ? "Pemasukan" : "Pengeluaran",
      date: data.date.toISOString(),
      description: data.description
    }

    createFinance.mutate(financeData, {
      onSuccess: () => {
        setIsDialogOpen(false)
        refetch()
      }
    })
  }

  const handleEditTransaction = (data: TransactionFormData) => {
    if (!transactionToEdit) return

    const financeData: FinanceData = {
      amount: Number(data.amount),
      category: data.type === "income" ? "Pemasukan" : "Pengeluaran",
      date: data.date.toISOString(),
      description: data.description
    }

    updateFinance.mutate({
      id: transactionToEdit.id,
      data: financeData
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false)
        setTransactionToEdit(null)
        refetch()
      }
    })
  }

  const handleDeleteTransaction = () => {
    if (!transactionToDelete) return

    deleteFinance.mutate(transactionToDelete, {
      onSuccess: () => {
        setIsDeleteAlertOpen(false)
        setTransactionToDelete(null)
        refetch()
      }
    })
  }

  const openEditDialog = (transaction: Transaction) => {
    setTransactionToEdit(transaction)
    setIsEditDialogOpen(true)
  }

  const openDeleteAlert = (id: number) => {
    setTransactionToDelete(id)
    setIsDeleteAlertOpen(true)
  }

  const openDocumentGallery = (transaction: Transaction) => {
    setSelectedFinanceId(transaction.id)

    // Make sure we have a valid document URL
    let documentUrl = transaction.document_url;

    // Log the document URL for debugging
    console.log("Opening document gallery with URL:", documentUrl);

    // Set the document URL and open the gallery
    setSelectedDocumentUrl(documentUrl)
    setIsGalleryOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Keuangan</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button
              className="flex items-center text-blue-600 py-2 px-4 rounded"
              style={{
                backgroundColor: '#e0f2fe',
                border: 'none',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                fontWeight: 400
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Transaksi
            </button>
          </DialogTrigger>
          <DialogContent
            onPointerDownOutside={(e) => {
              // Prevent closing when clicking inside the editor
              if (e.target && (e.target as HTMLElement).closest('.tiptap')) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Tambah Transaksi Baru</DialogTitle>
            </DialogHeader>
            <TransactionForm onSubmit={handleAddTransaction} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Saldo Saat Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-medium">
                {formatRupiah(financeSummary?.current_balance || "0")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="finance-income-title">Total Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-medium finance-income-value">
                {formatRupiah(financeSummary?.total_income || "0")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="finance-expense-title">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-medium finance-expense-value">
                {formatRupiah(financeSummary?.total_expense || "0")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: Transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="min-w-[200px] max-w-[300px]">
                      <div>
                        <TruncatedDescription
                          description={transaction.description}
                          maxLength={30}
                          isRichText={true}
                          title={`Deskripsi Transaksi - ${format(new Date(transaction.date), "dd MMM yyyy")}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        className="py-1 px-3 rounded flex items-center"
                        style={{
                          backgroundColor: transaction.category === "Pemasukan" ? "#dcfce7" : "#fee2e2",
                          color: transaction.category === "Pemasukan" ? "#166534" : "#991b1b",
                          border: "none",
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                          fontWeight: 400
                        }}
                      >
                        {transaction.category === "Pemasukan" ? (
                          <ArrowDown className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowUp className="mr-1 h-3 w-3" />
                        )}
                        {transaction.category}
                      </button>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className="text-black">
                        {formatRupiah(Number(transaction.amount))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(transaction)}
                          title="Edit Transaksi"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => openDocumentGallery(transaction)}
                          title={transaction.document_url ? "Lihat Bukti Transaksi" : "Unggah Bukti Transaksi"}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => openDeleteAlert(transaction.id)}
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          onPointerDownOutside={(e) => {
            // Prevent closing when clicking inside the editor
            if (e.target && (e.target as HTMLElement).closest('.tiptap')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
          </DialogHeader>
          {transactionToEdit && (
            <TransactionForm
              onSubmit={handleEditTransaction}
              defaultValues={{
                date: new Date(transactionToEdit.date),
                description: transactionToEdit.description,
                amount: String(transactionToEdit.amount),
                type: transactionToEdit.category === "Pemasukan" ? "income" : "expense"
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
              className="bg-red-500 hover:bg-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Gallery */}
      {selectedFinanceId && (
        <FinanceDocumentGallery
          open={isGalleryOpen}
          onOpenChange={setIsGalleryOpen}
          financeId={selectedFinanceId}
          documentUrl={selectedDocumentUrl}
          onSuccess={() => {
            // Refresh the data after successful upload or delete
            refetch()
          }}
        />
      )}
    </div>
  )
}










