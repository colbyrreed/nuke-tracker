// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { QueryProvider } from '@/components/layout/query-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Nuke Tracker — MLB Home Run Analytics',
  description: 'The most advanced MLB home run prediction and research platform. Rank every hitter by HR probability using live Statcast, weather, park factors, and AI.',
  keywords: ['MLB', 'home run', 'baseball', 'analytics', 'prop bets', 'Statcast', 'DFS', 'sabermetrics'],
  authors: [{ name: 'Nuke Tracker' }],
  openGraph: {
    title: 'Nuke Tracker',
    description: 'The most advanced MLB home run analytics platform.',
    type: 'website',
    url: 'https://nuketracker.com',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nuke Tracker',
    description: 'MLB home run prediction and research platform.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080c14',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
