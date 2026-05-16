import type { Metadata } from 'next'
import { Syne } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://skill-tracker.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Skill Tracker — Track every skill, build every habit',
    template: '%s — Skill Tracker',
  },
  description:
    'A personal dashboard to track your learning progress across any skill — Quran, coding, languages and more. With streaks, coins, charts and heatmaps.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Skill Tracker — Track every skill, build every habit',
    description: 'Track every skill. Build every habit.',
    url: siteUrl,
    siteName: 'Skill Tracker',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skill Tracker — Track every skill, build every habit',
    description: 'Track every skill. Build every habit.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-slate-900 text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}