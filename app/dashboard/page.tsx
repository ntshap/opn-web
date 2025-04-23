"use client"

import { FinanceCard } from "./components/finance-card"
import { RealStats } from "./components/real-stats"
import { QuickActions } from "./components/quick-actions"
import { EventsList } from "./components/events-list"

export default function DashboardPage() {

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-medium">Dasbor</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RealStats />
        <FinanceCard />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Upcoming Events */}
      <div className="space-y-4">
        <h2 className="text-2xl font-medium">Acara Terbaru</h2>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <EventsList />
          </div>
        </div>
      </div>


    </div>
  )
}
