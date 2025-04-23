import type React from "react"
export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="w-full min-h-screen bg-gray-50">{children}</div>
}

