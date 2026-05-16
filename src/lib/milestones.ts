import type { SupabaseClient } from '@supabase/supabase-js'

const MILESTONES = [25, 50, 75, 100] as const

const MILESTONE_COINS: Record<number, number> = { 25: 5, 50: 10, 75: 20, 100: 50 }
const MILESTONE_ICONS: Record<number, string> = { 25: '🥉', 50: '🥈', 75: '🥇', 100: '🏆' }
const MILESTONE_LABELS: Record<number, string> = {
    25: '25% reached',
    50: 'Halfway there',
    75: '75% done',
    100: 'Skill completed!',
}

export interface MilestoneResult {
    icon: string
    title: string
    sub: string
}

/** Fetch which milestone percentages have already been awarded for a skill. */
export async function getMilestonesReached(
    userId: string,
    skillId: string,
    supabase: SupabaseClient
): Promise<number[]> {
    const { data } = await supabase
        .from('milestones_reached')
        .select('milestone')
        .eq('user_id', userId)
        .eq('skill_id', skillId)

    return data?.map((row: { milestone: number }) => row.milestone) ?? []
}

/**
 * Check if any milestone thresholds (25/50/75/100%) have been crossed.
 * If so, inserts the record, awards coins, and returns the milestone data
 * so the caller can trigger the popup. Returns null if no milestone crossed.
 */
export async function checkMilestones(
    userId: string,
    skillId: string,
    skillName: string,
    oldPct: number,
    newPct: number,
    milestonesAlreadyReached: number[],
    supabase: SupabaseClient
): Promise<MilestoneResult | null> {
    for (const m of MILESTONES) {
        if (oldPct < m && newPct >= m && !milestonesAlreadyReached.includes(m)) {
            const coins = MILESTONE_COINS[m]

            // Record the milestone
            await supabase.from('milestones_reached').insert({
                user_id: userId,
                skill_id: skillId,
                milestone: m,
            })

            // Award coins — fetch current balance then update
            const { data: statsData } = await supabase
                .from('user_stats')
                .select('coins')
                .eq('user_id', userId)
                .single()

            if (statsData) {
                await supabase
                    .from('user_stats')
                    .update({ coins: statsData.coins + coins })
                    .eq('user_id', userId)
            }

            return {
                icon: MILESTONE_ICONS[m],
                title: `${skillName} — ${MILESTONE_LABELS[m]}`,
                sub: `+${coins} 🪙 awarded`,
            }
        }
    }
    return null
}
