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
    counter: number
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

    // Block subscription-triggered fetches during addSkill inserts
    const blockFetch = useRef(false)

    const fetchSkills = useCallback(async (force = false) => {
        if (!force && blockFetch.current) return

        const { data, error } = await supabase
            .from('skills')
            .select('id, name, total, unit, color, incs, has_custom, is_pinned, position, counter')
            .eq('user_id', userId)
            .order('is_pinned', { ascending: false })
            .order('position', { ascending: true })
            .order('created_at', { ascending: true })

        if (!error && data) {
            const mapped: Skill[] = data.map((s: any) => ({
                id: s.id,
                name: s.name,
                total: s.total,
                unit: s.unit,
                color: s.color,
                incs: s.incs,
                has_custom: s.has_custom,
                is_pinned: s.is_pinned,
                position: s.position,
                counter: s.counter ?? 0,
            }))
            setSkills(mapped)
        }
        setLoading(false)
    }, [userId])

    useEffect(() => {
        fetchSkills(true)

        const channel = supabase
            .channel('skills-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'skills',
                filter: `user_id=eq.${userId}`,
            }, () => fetchSkills())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [fetchSkills, userId])

    async function addSkill(newSkill: NewSkill) {
        const maxPosition = skills.length > 0
            ? Math.max(...skills.map(s => s.position))
            : -1

        blockFetch.current = true

        const { data: inserted, error } = await supabase
            .from('skills')
            .insert({
                user_id: userId,
                name: newSkill.name,
                total: newSkill.total,
                unit: newSkill.unit,
                color: newSkill.color,
                incs: newSkill.incs,
                has_custom: newSkill.has_custom,
                position: maxPosition + 1,
                counter: 0,
            })
            .select('id, name, total, unit, color, incs, has_custom, is_pinned, position, counter')
            .single()

        if (!error && inserted) {
            setSkills(prev => [
                ...prev,
                {
                    id: inserted.id,
                    name: inserted.name,
                    total: inserted.total,
                    unit: inserted.unit,
                    color: inserted.color,
                    incs: inserted.incs,
                    has_custom: inserted.has_custom,
                    is_pinned: inserted.is_pinned ?? false,
                    position: inserted.position,
                    counter: 0,
                },
            ])
        }

        setTimeout(() => { blockFetch.current = false }, 800)
        return error
    }

    async function deleteSkill(skillId: string) {
        const { error } = await supabase
            .from('skills')
            .delete()
            .eq('id', skillId)
            .eq('user_id', userId)

        if (!error) {
            setSkills(prev => prev.filter(s => s.id !== skillId))
        }
        return error
    }

    async function updateCounter(skillId: string, newValue: number) {
        // Optimistic update — always runs immediately
        setSkills(prev =>
            prev.map(s => s.id === skillId ? { ...s, counter: newValue } : s)
        )

        // Persist to the skills table directly — same RLS that works for everything else
        await supabase
            .from('skills')
            .update({ counter: newValue })
            .eq('id', skillId)
            .eq('user_id', userId)
    }

    return { skills, loading, addSkill, deleteSkill, updateCounter, refetch: (force?: boolean) => fetchSkills(force ?? true) }
}
