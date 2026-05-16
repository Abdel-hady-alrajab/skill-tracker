'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ActivityLog = Record<string, number> // { 'YYYY-MM-DD': count }

function localDateStr() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useActivityLog(userId: string) {
    const [log, setLog] = useState<ActivityLog>({})
    const supabase = createClient()

    const fetchLog = useCallback(async () => {
        // Fetch last 6 months of activity
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        const from = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`

        const { data } = await supabase
            .from('activity_log')
            .select('logged_date, action_count')
            .eq('user_id', userId)
            .gte('logged_date', from)

        if (data) {
            const mapped: ActivityLog = {}
            data.forEach(row => {
                mapped[row.logged_date] = row.action_count
            })
            setLog(mapped)
        }
    }, [userId])

    useEffect(() => { fetchLog() }, [fetchLog])

    async function logActivity() {
        const today = localDateStr()

        // Upsert: if a row exists for today, increment it; otherwise insert
        const { error } = await supabase.rpc('increment_activity_log', {
            p_user_id: userId,
            p_date: today,
        })

        if (error) {
            // Fallback if the RPC doesn't exist yet — manual upsert
            const current = log[today] ?? 0
            await supabase
                .from('activity_log')
                .upsert(
                    { user_id: userId, logged_date: today, action_count: current + 1 },
                    { onConflict: 'user_id,logged_date' }
                )
        }

        // Optimistic update
        setLog(prev => ({ ...prev, [today]: (prev[today] ?? 0) + 1 }))
    }

    return { log, logActivity, refetch: fetchLog }
}