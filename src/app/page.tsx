import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Already logged in — go straight to dashboard
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Skill Tracker
        </span>
        <Link
          href="/login"
          className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
        >
          Sign in →
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-24">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
          🔥 Build real habits. Track real progress.
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight max-w-3xl">
          Track every{' '}
          <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            skill.
          </span>
          <br />
          Build every{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent">
            habit.
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-xl leading-relaxed">
          A personal dashboard for tracking Quran, courses, languages, coding — anything.
          With streaks, coins, heatmaps, charts, and deadlines to keep you moving.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <Link
            href="/login"
            className="bg-blue-500 hover:bg-blue-400 text-white font-bold text-base px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/25"
          >
            Get started free →
          </Link>
          <span className="text-sm text-slate-500 font-mono">
            No credit card required
          </span>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-16">
          {[
            '🔥 Daily streaks',
            '🪙 Coin rewards',
            '📊 Progress charts',
            '🗓️ Activity heatmap',
            '📅 Deadlines',
            '☁️ Cloud sync',
          ].map(f => (
            <span
              key={f}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm font-mono px-4 py-2 rounded-full"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </main>
  )
}