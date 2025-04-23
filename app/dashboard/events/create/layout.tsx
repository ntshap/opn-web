import type React from "react"

export default function CreateEventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div>{children}</div>
    </div>
  )
}
