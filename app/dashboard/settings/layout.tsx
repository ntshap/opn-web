import type React from "react"
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="w-full min-h-screen bg-background">{children}</div>
}

