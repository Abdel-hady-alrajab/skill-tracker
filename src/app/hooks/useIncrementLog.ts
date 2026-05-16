'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface IncrementEntry {
    id: string
    skill_id: string | null
    skill_name: string
    amount: number
    logged_at: string // ISO timestamp string
}

function isoWeek(ts: number): string {
    const d = new Date(ts)
    const day = d.getDay() || 7 // 1=Mon … 7=Sun
    d.setDate(d.getDate() + 4 - day) // move to Thursday of ISO week
    const year = d.getFullYear()
    const jan1 = new Date(year, 0, 1)
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + 1) / 7)
    return `${year}-W${String(week).padStart(2, '0')}`
}

function weekLabel(isoW: string): string {
    const [yr, w] = isoW.split('-W')
    const jan1 = new Date(+yr, 0, 1)
    const ws = new Date(jan1)
    ws.setDate(jan1.getDate() + (+w - 1) * 7 - ((jan1.getDay() || 7) - 1))
    return ws.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export interface WeeklyDataset {
    skillId: string
    skillName: string
    data: number[] // one value per week, 8 weeks
    color: string
}

export interface WeeklyChartData {
    labels: string[]
    datasets: WeeklyDataset[]
}

const COLORS = ['#4f8fff', '#3dffc0', '#ffd166', '#ff6b6b', '#a78bfa', '#2dd4bf', '#f472b6']

export function useIncrementLog(userId: string) {
    const [entries, setEntries] = useState<IncrementEntry[]>([])
    const supabase = createClient()

    const fetchEntries = useCallback(async () => {
        // Fetch last 8 weeks
        const eightWeeksAgo = new Date()
        eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

        const { data } = await supabase
            .from('increment_log')
            .select('id, skill_id, skill_name, amount, logged_at')
            .eq('user_id', userId)
            .gte('logged_at', eightWeeksAgo.toISOString())
            .order('logged_at', { ascending: true })

        if (data) setEntries(data)
    }, [userId])

    useEffect(() => { fetchEntries() }, [fetchEntries])

    async function logIncrement(skillId: string, skillName: string, amount: number) {
        const { data } = await supabase
            .from('increment_log')
            .insert({ user_id: userId, skill_id: skillId, skill_name: skillName, amount })
            .select()
            .single()

        if (data) {
            setEntries(prev => [...prev, data])
        }
    }

    function getWeeklyData(): WeeklyChartData {
        // Build last 8 ISO week keys
        const now = Date.now()
        const weekKeys: string[] = []
        for (let i = 7; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i * 7)
            weekKeys.push(isoWeek(d.getTime()))
        }
        const uniqWeeks = [...new Set(weekKeys)].slice(-8)
        const labels = uniqWeeks.map(weekLabel)

        // Group by skill
        const skillIds = [...new Set(entries.map(e => e.skill_id ?? e.skill_name))]

        const datasets: WeeklyDataset[] = skillIds.map((sid, i) => {
            const skillEntries = entries.filter(e => (e.skill_id ?? e.skill_name) === sid)
            const skillName = skillEntries[0]?.skill_name ?? String(sid)
            const data = uniqWeeks.map(w =>
                skillEntries
                    .filter(e => isoWeek(new Date(e.logged_at).getTime()) === w)
                    .reduce((sum, e) => sum + e.amount, 0)
            )
            return {
                skillId: String(sid),
                skillName,
                data,
                color: COLORS[i % COLORS.length],
            }
        })

        return { labels, datasets }
    }

    return { entries, logIncrement, getWeeklyData, refetch: fetchEntries }
}