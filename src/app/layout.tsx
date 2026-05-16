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

export const metadata: Metadata = {
  title: 'Skill Tracker — Track every skill, build every habit',
  description:
    'A personal dashboard to track your learning progress across any skill — Quran, coding, languages and more. With streaks, coins, charts and heatmaps.',
  openGraph: {
    title: 'Skill Tracker',
    description: 'Track every skill. Build every habit.',
    type: 'website',
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