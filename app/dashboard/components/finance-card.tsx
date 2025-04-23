"use client";

import { DollarSign } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { useFinanceData } from "@/lib/hooks/use-finance-data";

export function FinanceCard() {
  const { data: financeSummary, isLoading } = useFinanceData();
  
  const formatRupiah = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
      .format(numValue)
      .replace(/^Rp\s*/, 'Rp');
  };

  return (
    <StatCard
      title="Keuangan"
      value={formatRupiah(financeSummary?.current_balance || "0")}
      isLoading={isLoading}
      description="Saldo bersih"
      trend="up"
      percentage={0}
      icon={DollarSign}
      color="green"
    />
  );
}

