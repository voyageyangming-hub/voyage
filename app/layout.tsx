import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Voyage 陽明山 — 線上預約',
  description: '預約 Voyage 陽明山園區入園，體驗陽明山最美的自然風光',
  openGraph: {
    title: 'Voyage 陽明山 — 線上預約',
    description: '預約 Voyage 陽明山園區入園',
  },
  icons: {
    apple: '/icon-180.png',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Voyage 陽明山',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full bg-stone-50 text-stone-900">{children}</body>
    </html>
  )
}
