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
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 hover:from-emerald-400 hover:to-blue-400 bg-clip-text text-transparent flex-shrink-0 transition-all duration-500 hover:scale-105 cursor-default">
                    Skill Tracker
                </span>

                {/* Stats */}
                <div className="flex items-center gap-3 sm:gap-5 text-sm font-mono flex-wrap">
                    {/* Streak */}
                    <div className="flex items-center gap-1.5 text-slate-400 group cursor-default">
                        <span className={`text-base transition-transform duration-300 ${streakActive ? 'group-hover:scale-125 group-hover:rotate-12' : 'group-hover:-rotate-12'}`}>{streakActive ? '🔥' : '💤'}</span>
                        <span className="font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">{streakCount}</span>
                        <span className="hidden sm:inline group-hover:text-slate-300 transition-colors duration-300">day streak</span>
                    </div>

                    {/* Freeze badge */}
                    {freezes > 0 && (
                        <div className="flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs px-2.5 py-1 rounded-full hover:bg-blue-500/25 transition-all duration-300 hover:shadow-[0_0_8px_rgba(59,130,246,0.3)] cursor-default">
                            <span className="animate-pulse">🧊</span> <span>{freezes}</span>
                        </div>
                    )}

                    {/* Coins */}
                    <div className="flex items-center gap-1.5 text-slate-400 group cursor-default">
                        <span className="text-base transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110">🪙</span>
                        <span className="font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300">{coins}</span>
                    </div>

                    {/* Email — hidden on small screens */}
                    <span className="hidden md:block text-slate-500 text-xs truncate max-w-[160px]">
                        {email}
                    </span>

                    {/* Theme toggle */}
                    <button
                        onClick={toggle}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="border text-sm px-2.5 py-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-md"
                        style={{
                            borderColor: theme === 'dark' ? '#475569' : '#94a3b8',
                            color: theme === 'dark' ? '#94a3b8' : '#475569',
                        }}
                    >
                        <div className="transition-transform duration-500 hover:rotate-180">
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </div>
                    </button>

                    {/* Sign out */}
                    <button
                        onClick={signOut}
                        className="text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-xs px-3 py-1.5 rounded-lg transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,255,255,0.05)] active:scale-95"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </nav>
    )
}
