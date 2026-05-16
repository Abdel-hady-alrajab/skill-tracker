'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavbarProps {
    email: string
    coins: number
    streakCount: number
    streakActive: boolean
    freezes: number
}

export default function Navbar({
    email,
    coins,
    streakCount,
    streakActive,
    freezes,
}: NavbarProps) {
    const router = useRouter()
    const supabase = createClient()

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