import type React from "react"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Berita</h2>
      </div>
      <div>{children}</div>
    </div>
  )
}
