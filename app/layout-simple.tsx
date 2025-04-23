import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OPN Admin Portal',
  description: 'Admin portal for OPN',
}

export default function SimpleRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
