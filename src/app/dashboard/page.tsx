import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/DashboardClient'

export const metadata: Metadata = {
    title: 'Dashboard',
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    // Layout already redirects unauthenticated users, so user is guaranteed here
    const userId = user!.id

    // Fetch all critical data in parallel on the server — no client-side waterfall
    const [skillsResult, statsResult, todosResult] = await Promise.all([
        supabase
            .from('skills')
            .select(`
                id, name, total, unit, color, incs, has_custom, is_pinned, position,
                skill_progress ( counter )
            `)
            .eq('user_id', userId)
            .order('is_pinned', { ascending: false })
            .order('position', { ascending: true })
            .order('created_at', { ascending: true }),
        supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single(),
        supabase
            .from('todo_skills')
            .select('id, name, position, created_at')
            .eq('user_id', userId)
            .order('position', { ascending: true })
            .order('created_at', { ascending: true }),
    ])

    // Normalize the skills data shape to match the Skill interface
    const initialSkills = (skillsResult.data ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        total: s.total,
        unit: s.unit,
        color: s.color,
        incs: s.incs,
        has_custom: s.has_custom,
        is_pinned: s.is_pinned,
        position: s.position,
        counter: (Array.isArray(s.skill_progress) ? s.skill_progress[0]?.counter : s.skill_progress?.counter) ?? 0,
    }))

    return (
        <DashboardClient
            userId={userId}
            initialSkills={initialSkills}
            initialStats={statsResult.data ?? undefined}
            initialTodos={todosResult.data ?? undefined}
        />
    )
}
