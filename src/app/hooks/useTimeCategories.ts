'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface TimeCategory {
    id: string
    user_id: string
    name: string
    color: string
    icon: string
    created_at: string
}

export interface NewCategory {
    name: string
    color: string
    icon: string
}

export function useTimeCategories(userId: string) {
    const [categories, setCategories] = useState<TimeCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const fetchCategories = useCallback(async () => {
        setError(null)
        const { data, error: err } = await supabase
            .from('time_categories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

        if (err) setError(err.message)
        else setCategories(data ?? [])
        setLoading(false)
    }, [userId])

    useEffect(() => { fetchCategories() }, [fetchCategories])

    // ── Add a new category ──────────────────────────────────────────
    async function addCategory(cat: NewCategory): Promise<{ error: string | null }> {
        setError(null)

        if (!cat.name.trim()) return { error: 'Category name is required' }
        if (cat.name.trim().length > 40) return { error: 'Name must be under 40 characters' }
        if (categories.some(c => c.name.toLowerCase() === cat.name.trim().toLowerCase())) {
            return { error: `"${cat.name.trim()}" already exists` }
        }

        const { data, error: err } = await supabase
            .from('time_categories')
            .insert({
                user_id: userId,
                name: cat.name.trim(),
                color: cat.color,
                icon: cat.icon,
            })
            .select()
            .single()

        if (err) { setError(err.message); return { error: err.message } }
        setCategories(prev => [...prev, data])
        return { error: null }
    }

    // ── Delete a category ───────────────────────────────────────────
    // Blocked if the category has any sessions logged against it.
    async function deleteCategory(id: string): Promise<{ error: string | null }> {
        setError(null)

        // Check for existing sessions first
        const { count, error: countErr } = await supabase
            .from('time_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', id)

        if (countErr) return { error: countErr.message }

        if ((count ?? 0) > 0) {
            const msg = `This category has ${count} session${count === 1 ? '' : 's'} logged. Delete all sessions first, or keep the category.`
            setError(msg)
            return { error: msg }
        }

        const { error: delErr } = await supabase
            .from('time_categories')
            .delete()
            .eq('id', id)
            .eq('user_id', userId) // extra safety — only own categories

        if (delErr) { setError(delErr.message); return { error: delErr.message } }

        setCategories(prev => prev.filter(c => c.id !== id))
        return { error: null }
    }

    // ── Update a category name/color/icon ───────────────────────────
    async function updateCategory(
        id: string,
        updates: Partial<Pick<TimeCategory, 'name' | 'color' | 'icon'>>
    ): Promise<{ error: string | null }> {
        const { error: err } = await supabase
            .from('time_categories')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)

        if (err) return { error: err.message }

        setCategories(prev =>
            prev.map(c => c.id === id ? { ...c, ...updates } : c)
        )
        return { error: null }
    }

    return {
        categories,
        loading,
        error,
        addCategory,
        deleteCategory,
        updateCategory,
        refetch: fetchCategories,
    }
}