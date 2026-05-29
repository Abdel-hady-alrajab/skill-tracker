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

export function useSkills(userId: string, initialSkills?: Skill[]) {
    const [skills, setSkills] = useState<Skill[]>(initialSkills ?? [])
    const [loading, setLoading] = useState(!initialSkills)
    const supabase = createClient()

    const blockFetch = useRef(false)

    const fetchSkills = useCallback(async (force = false) => {
        if (!force && blockFetch.current) return

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
            setSkills(data.map((s: any) => ({
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
            })))
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
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'skill_progress',
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
            })
            .select('id, name, total, unit, color, incs, has_custom, is_pinned, position')
            .single()

        if (!error && inserted) {
            // Create the skill_progress row for this new skill
            await supabase.from('skill_progress').insert({
                skill_id: inserted.id,
                counter: 0,
            })

            setSkills(prev => [...prev, {
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
            }])
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
        // Always update local state immediately
        setSkills(prev =>
            prev.map(s => s.id === skillId ? { ...s, counter: newValue } : s)
        )

        // Try UPDATE first
        const { data: updated } = await supabase
            .from('skill_progress')
            .update({ counter: newValue })
            .eq('skill_id', skillId)
            .select('skill_id')

        // If no row existed, INSERT one
        if (!updated || updated.length === 0) {
            await supabase
                .from('skill_progress')
                .insert({ skill_id: skillId, counter: newValue })
        }
    }

    return { skills, loading, addSkill, deleteSkill, updateCounter, refetch: (force?: boolean) => fetchSkills(force ?? true) }
}
