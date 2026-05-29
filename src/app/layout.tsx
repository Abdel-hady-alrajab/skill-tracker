import type { Metadata } from 'next'
import { Syne } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import Script from 'next/script'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap', // Optimization: Prevents Flash of Invisible Text (FOIT)
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap', // Optimization: Prevents Flash of Invisible Text (FOIT)
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://skill-tracker.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  // ── Titles ──────────────────────────────────────────────────────
  title: {
    default: 'Skill Tracker — Track every skill, build every habit',
    template: '%s | Skill Tracker',
  },

  // ── Description & Keywords ──────────────────────────────────────
  description:
    'A personal dashboard to track your learning progress across any skill — Quran, coding, languages and more. With streaks, coins, progress charts and activity heatmaps.',
  keywords: [
    'skill tracker',
    'habit tracker',
    'learning dashboard',
    'progress tracker',
    'streak tracker',
    'quran tracker',
    'coding progress',
  ],

  // ── Authors & Publisher ─────────────────────────────────────────
  authors: [{ name: 'Skill Tracker', url: siteUrl }],
  creator: 'Skill Tracker',
  publisher: 'Skill Tracker',

  // ── Canonical URL Strategy ──────────────────────────────────────
  // FIX: Removing the hardcoded siteUrl from here allows Next.js to 
  // correctly generate dynamic self-referencing canonical links.
  alternates: {},

  // ── Open Graph ──────────────────────────────────────────────────
  openGraph: {
    title: 'Skill Tracker — Track every skill, build every habit',
    description:
      'Track every skill. Build every habit. Streaks, coins, charts and heatmaps.',
    url: '/',
    siteName: 'Skill Tracker',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Skill Tracker — Track every skill, build every habit',
      },
    ],
  },

  // ── Twitter / X Cards ───────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'Skill Tracker — Track every skill, build every habit',
    description:
      'Track every skill. Build every habit. Streaks, coins, charts and heatmaps.',
    images: ['/og-image.png'],
  },

  // ── Robots ──────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── PWA / App icons ─────────────────────────────────────────────
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html lang="en" className={`${syne.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-slate-900 text-slate-100 font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>

        {/* Analytics — only loaded if NEXT_PUBLIC_GA_ID is set in .env */}
        {/* strategy="afterInteractive" loads AFTER hydration, never blocking LCP */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}