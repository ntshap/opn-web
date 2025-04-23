"use client"

import { FinanceForm } from "@/components/finance/finance-form"

export default function CreateFinancePageClient() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Tambah Transaksi Keuangan</h2>
      <FinanceForm />
    </div>
  )
}
