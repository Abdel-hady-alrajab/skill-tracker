'use client'

import { useState, useEffect, useCallback } from 'react'
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
                counter: s.skill_progress?.[0]?.counter ?? 0,
            }))
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

        const { error } = await supabase.from('skills').insert({
            user_id: userId,
            name: newSkill.name,
            total: newSkill.total,
            unit: newSkill.unit,
            color: newSkill.color,
            incs: newSkill.incs,
            has_custom: newSkill.has_custom,
            position: maxPosition + 1,
        })

        if (!error) await fetchSkills()
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
        const { error } = await supabase
            .from('skill_progress')
            .update({ counter: newValue })
            .eq('skill_id', skillId)

        if (!error) {
            setSkills(prev =>
                prev.map(s => s.id === skillId ? { ...s, counter: newValue } : s)
            )
        }
        return error
    }

    return { skills, loading, addSkill, deleteSkill, updateCounter, refetch: fetchSkills }
}