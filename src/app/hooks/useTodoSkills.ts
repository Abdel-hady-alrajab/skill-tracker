import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface TodoSkill {
    id: string
    name: string
    position: number
    created_at: string
}

export function useTodoSkills(userId: string) {
    const [todos, setTodos] = useState<TodoSkill[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchTodos = useCallback(async () => {
        const { data } = await supabase
            .from('todo_skills')
            .select('id, name, position, created_at')
            .eq('user_id', userId)
            .order('position', { ascending: true })
            .order('created_at', { ascending: true })

        if (data) setTodos(data)
        setLoading(false)
    }, [userId])

    useEffect(() => { fetchTodos() }, [fetchTodos])

    async function addTodos(names: string[]) {
        const maxPos = todos.length > 0
            ? Math.max(...todos.map(t => t.position))
            : -1

        const rows = names
            .map(n => n.trim())
            .filter(Boolean)
            .map((name, i) => ({
                user_id: userId,
                name,
                position: maxPos + 1 + i,
            }))

        if (!rows.length) return

        const { data } = await supabase
            .from('todo_skills')
            .insert(rows)
            .select('id, name, position, created_at')

        if (data) setTodos(prev => [...prev, ...data])
    }

    async function deleteTodo(id: string) {
        await supabase.from('todo_skills').delete().eq('id', id)
        setTodos(prev => prev.filter(t => t.id !== id))
    }

    // Removes the todo and returns its name so DashboardClient
    // can pre-fill the AddSkillModal
    async function promoteToSkill(id: string): Promise<string | null> {
        const todo = todos.find(t => t.id === id)
        if (!todo) return null
        await deleteTodo(id)
        return todo.name
    }

    return { todos, loading, addTodos, deleteTodo, promoteToSkill }
}