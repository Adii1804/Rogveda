import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rogveda — Medical Travel Booking',
  description: 'Book world-class medical procedures in India. Compare top hospitals, choose your doctor, book with zero upfront payment.',
  keywords: 'medical tourism India, knee replacement India, affordable surgery India, medical travel booking',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Rogveda — Medical Travel Booking',
    description: 'World-class surgery at 70% less than US/UK costs. Book now, pay later.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
              padding: '12px 16px',
            },
            success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
            error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
          }}
        />
      </body>
    </html>
  )
}
