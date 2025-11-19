import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Casemate – Pakistan Legal Template Generator',
  description: 'Generate legal document templates for Pakistan using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

