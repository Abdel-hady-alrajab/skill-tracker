'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Skill {
    id: string
    name: string
    total: number
    unit: string
    color: string
    incs: number[]
    has_custom: boolean
    is_pinned: boolean
    position: number
    counter: number // joined from skill_progress
}

export interface NewSkill {
    name: string
    total: number
    unit: string
    color: string
    incs: number[]
    has_custom: boolean
}

export function useSkills(userId: string) {
    const [skills, setSkills] = useState<Skill[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    // Track counters that have been updated locally but may not yet be in the DB.
    // fetchSkills will merge these in so real-time subscription can't wipe them.
    const localCounters = useRef<Record<string, number>>({})

    const fetchSkills = useCallback(async () => {
        const { data, error } = await supabase
            .from('skills')
            .select(`
        id, name, total, unit, color, incs, has_custom, is_pinned, position,
        skill_progress ( counter )
      `)
            .eq('user_id', userId)
            .order('is_pinned', { ascending: false })
            .order('position', { ascending: true })
            .order('created_at', { ascending: true })

        if (!error && data) {
            const mapped: Skill[] = data.map((s: any) => {
                const dbCounter = s.skill_progress?.[0]?.counter ?? 0
                // Prefer the local value if we have a pending optimistic update
                const counter = localCounters.current[s.id] ?? dbCounter
                return {
                    id: s.id,
                    name: s.name,
                    total: s.total,
                    unit: s.unit,
                    color: s.color,
                    incs: s.incs,
                    has_custom: s.has_custom,
                    is_pinned: s.is_pinned,
                    position: s.position,
                    counter,
                }
            })
            setSkills(mapped)
        }
        setLoading(false)
    }, [userId])

    useEffect(() => {
        fetchSkills()

        // Real-time subscription — refresh when skills or progress change
        const channel = supabase
            .channel('skills-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'skills',
                filter: `user_id=eq.${userId}`,
            }, fetchSkills)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'skill_progress',
            }, fetchSkills)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [fetchSkills, userId])

    async function addSkill(newSkill: NewSkill) {
        const maxPosition = skills.length > 0
            ? Math.max(...skills.map(s => s.position))
            : -1

        const { data: inserted, error } = await supabase.from('skills').insert({
            user_id: userId,
            name: newSkill.name,
            total: newSkill.total,
            unit: newSkill.unit,
            color: newSkill.color,
            incs: newSkill.incs,
            has_custom: newSkill.has_custom,
            position: maxPosition + 1,
        }).select('id').single()

        if (!error && inserted) {
            // Ensure a skill_progress row exists for the new skill
            await supabase.from('skill_progress').insert({
                skill_id: inserted.id,
                counter: 0,
            })
            await fetchSkills()
        }
        return error
    }

    async function deleteSkill(skillId: string) {
        const { error } = await supabase
            .from('skills')
            .delete()
            .eq('id', skillId)
            .eq('user_id', userId)

        if (!error) {
            delete localCounters.current[skillId]
            setSkills(prev => prev.filter(s => s.id !== skillId))
        }
        return error
    }

    async function updateCounter(skillId: string, newValue: number) {
        // 1. Optimistic local update — always happens immediately
        localCounters.current[skillId] = newValue
        setSkills(prev =>
            prev.map(s => s.id === skillId ? { ...s, counter: newValue } : s)
        )

        // 2. Try UPDATE (works when the row already exists)
        const { data: updated, error: updateErr } = await supabase
            .from('skill_progress')
            .update({ counter: newValue })
            .eq('skill_id', skillId)
            .select('skill_id')

        console.log('[updateCounter] UPDATE result:', { updated, updateErr, skillId, newValue })

        // 3. If no row matched, INSERT one
        if (!updateErr && (!updated || updated.length === 0)) {
            const { error: insertErr } = await supabase
                .from('skill_progress')
                .insert({ skill_id: skillId, counter: newValue })
            console.log('[updateCounter] INSERT result:', { insertErr, skillId, newValue })
        }

        // 4. Once the DB is in sync, clear the pending local override
        if (!updateErr) {
            delete localCounters.current[skillId]
        }
    }

    return { skills, loading, addSkill, deleteSkill, updateCounter, refetch: fetchSkills }
}
