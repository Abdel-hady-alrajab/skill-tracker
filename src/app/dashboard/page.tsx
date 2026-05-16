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
    return <DashboardClient userId={user!.id} />
}
