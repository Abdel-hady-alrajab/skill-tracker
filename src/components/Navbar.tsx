'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

interface NavbarProps {
    userId: string
    email: string
    initialCoins: number
    initialStreakCount: number
    initialStreakActive: boolean
    initialFreezes: number
}

function todayStr() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Navbar({
    userId,
    email,
    initialCoins,
    initialStreakCount,
    initialStreakActive,
    initialFreezes,
}: NavbarProps) {
    const router = useRouter()
    const supabase = createClient()
    const { theme, toggle } = useTheme()

    const [coins, setCoins] = useState(initialCoins)
    const [streakCount, setStreakCount] = useState(initialStreakCount)
    const [streakActive, setStreakActive] = useState(initialStreakActive)
    const [freezes, setFreezes] = useState(initialFreezes)

    // Subscribe to real-time user_stats changes so coins/streak stay in sync
    useEffect(() => {
        const channel = supabase
            .channel('navbar-stats')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_stats',
                    filter: `user_id=eq.${userId}`,
                },
                ({ new: s }) => {
                    setCoins((s as any).coins)
                    setStreakCount((s as any).streak_count)
                    setStreakActive((s as any).streak_last_date === todayStr())
                    setFreezes((s as any).streak_freezes)
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [userId])

    async function signOut() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-800">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
                {/* Logo */}
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent flex-shrink-0">
                    Skill Tracker
                </span>

                {/* Stats */}
                <div className="flex items-center gap-3 sm:gap-5 text-sm font-mono flex-wrap">
                    {/* Streak */}
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-base">{streakActive ? '🔥' : '💤'}</span>
                        <span className="font-bold text-white">{streakCount}</span>
                        <span className="hidden sm:inline">day streak</span>
                    </div>

                    {/* Freeze badge */}
                    {freezes > 0 && (
                        <div className="flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs px-2.5 py-1 rounded-full">
                            🧊 <span>{freezes}</span>
                        </div>
                    )}

                    {/* Coins */}
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-base">🪙</span>
                        <span className="font-bold text-yellow-400">{coins}</span>
                    </div>

                    {/* Email — hidden on small screens */}
                    <span className="hidden md:block text-slate-500 text-xs truncate max-w-[160px]">
                        {email}
                    </span>

                    {/* Theme toggle */}
                    <button
                        onClick={toggle}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="border text-sm px-2.5 py-1.5 rounded-lg transition-all"
                        style={{
                            borderColor: theme === 'dark' ? '#475569' : '#94a3b8',
                            color: theme === 'dark' ? '#94a3b8' : '#475569',
                        }}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {/* Sign out */}
                    <button
                        onClick={signOut}
                        className="text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 text-xs px-3 py-1.5 rounded-lg transition-all"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </nav>
    )
}
