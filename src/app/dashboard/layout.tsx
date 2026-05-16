import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch user stats for navbar display
    const { data: stats } = await supabase
        .from('user_stats')
        .select('coins, streak_count, streak_last_date, streak_freezes')
        .eq('user_id', user.id)
        .single()

    // Determine if streak is active (last logged date = today in local time)
    const todayLocal = new Date()
    const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`
    const streakActive = stats?.streak_last_date === todayStr

    return (
        <div className="min-h-screen bg-slate-900">
            <Navbar
                email={user.email ?? ''}
                coins={stats?.coins ?? 0}
                streakCount={stats?.streak_count ?? 0}
                streakActive={streakActive}
                freezes={stats?.streak_freezes ?? 0}
            />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>
        </div>
    )
}