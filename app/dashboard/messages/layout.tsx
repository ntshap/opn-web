import type React from "react"
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="w-full h-full bg-background">{children}</div>
}

