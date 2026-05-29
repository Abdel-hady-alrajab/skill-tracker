'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserStats {
    coins: number
    streak_count: number
    streak_best: number
    streak_last_date: string | null
    streak_freezes: number
    booster_left: number
    deadline_unlocked: boolean
}

function localDateStr() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useUserStats(userId: string, initialStats?: UserStats) {
    const [stats, setStats] = useState<UserStats>(initialStats ?? {
        coins: 0,
        streak_count: 0,
        streak_best: 0,
        streak_last_date: null,
        streak_freezes: 0,
        booster_left: 0,
        deadline_unlocked: false,
    })
    const supabase = createClient()

    const fetchStats = useCallback(async () => {
        // Skip the initial fetch if data was server-provided
        if (initialStats) return
        const { data } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (data) setStats(data)
    }, [userId])

    useEffect(() => { fetchStats() }, [fetchStats])

    async function patch(updates: Partial<UserStats>) {
        const next = { ...stats, ...updates }
        setStats(next) // optimistic update
        await supabase
            .from('user_stats')
            .update(updates)
            .eq('user_id', userId)
    }

    async function addCoins(n: number) {
        const boosted = stats.booster_left > 0 ? n * 2 : n
        const updates: Partial<UserStats> = {
            coins: stats.coins + boosted,
        }
        if (stats.booster_left > 0) {
            updates.booster_left = Math.max(0, stats.booster_left - 1)
        }
        await patch(updates)
        return boosted
    }

    async function spendCoins(n: number) {
        await patch({ coins: Math.max(0, stats.coins - n) })
    }

    async function updateStreak() {
        const today = localDateStr()
        if (stats.streak_last_date === today) return // already logged today

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const ydStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

        let newStreak = stats.streak_count
        let newFreezes = stats.streak_freezes

        if (stats.streak_last_date === ydStr) {
            newStreak += 1
        } else {
            // Missed more than 1 day — use a freeze if available
            if (stats.streak_freezes > 0 && stats.streak_count > 0) {
                newFreezes = stats.streak_freezes - 1
                // streak keeps going
            } else {
                newStreak = 1
            }
        }

        const newBest = Math.max(stats.streak_best, newStreak)

        await patch({
            streak_count: newStreak,
            streak_best: newBest,
            streak_last_date: today,
            streak_freezes: newFreezes,
        })
    }

    async function setDeadlineUnlocked() {
        await patch({ deadline_unlocked: true })
    }

    async function buyBooster() {
        if (stats.booster_left > 0 || stats.coins < 25) return false
        await patch({ coins: stats.coins - 25, booster_left: 5 })
        return true
    }

    async function buyFreeze() {
        if (stats.streak_freezes >= 2 || stats.coins < 10) return false
        await patch({ coins: stats.coins - 10, streak_freezes: stats.streak_freezes + 1 })
        return true
    }

    async function buyDeadlineTracker() {
        if (stats.deadline_unlocked || stats.coins < 20) return false
        await patch({ coins: stats.coins - 20, deadline_unlocked: true })
        return true
    }

    const streakActive = stats.streak_last_date === localDateStr()

    return {
        stats,
        streakActive,
        addCoins,
        spendCoins,
        updateStreak,
        setDeadlineUnlocked,
        buyBooster,
        buyFreeze,
        buyDeadlineTracker,
        refetch: fetchStats,
    }
}