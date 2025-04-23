import type { Metadata } from "next"
import { Providers } from "./providers"
import "./globals.css"
import "./light-mode-override.css"

export const metadata: Metadata = {
  title: "OPN - Sistem Manajemen Acara",
  description: "Kelola acara dan aktivitas organisasi Anda",
  icons: {
    icon: [
      { url: "/images/opn-logo.png", type: "image/png" },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
