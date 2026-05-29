'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────

export interface TimeSession {
  id: string
  user_id: string
  category_id: string
  started_at: string       // ISO timestamp
  ended_at: string | null  // null while running
  duration_seconds: number | null
  created_at: string
}

// One day's breakdown: seconds per category + wasted seconds
export interface DailyBreakdown {
  date: string                          // 'YYYY-MM-DD'
  byCategory: Record<string, number>    // { categoryId: totalSeconds }
  totalTracked: number                  // sum of all category seconds
  wastedSeconds: number                 // 86400 - totalTracked (min 0)
}

// Weekly breakdown: one DailyBreakdown per day
export type WeeklyBreakdown = DailyBreakdown[]

// ── Local date helper ─────────────────────────────────────────────
function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function startOfDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function endOfDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}

const SECONDS_IN_DAY = 86400

// ── Hook ──────────────────────────────────────────────────────────
export function useTimeSessions(userId: string) {
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null)
  const [sessions, setSessions]           = useState<TimeSession[]>([])
  const [loading, setLoading]             = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Interval ref for the live timer
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // ── Fetch active session and recent sessions on mount ───────────
  const fetchSessions = useCallback(async () => {
    // Active (running) session
    const { data: active } = await supabase
      .from('time_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (active) {
      setActiveSession(active)
      // Calculate how many seconds have already elapsed
      const elapsed = Math.floor(
        (Date.now() - new Date(active.started_at).getTime()) / 1000
      )
      setElapsedSeconds(elapsed)
    }

    setLoading(false)
  }, [userId])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  // ── Live timer — updates elapsedSeconds every second ────────────
  useEffect(() => {
    if (activeSession) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setElapsedSeconds(0)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeSession])

  // ── Start a session ─────────────────────────────────────────────
  async function startSession(categoryId: string): Promise<{ error: string | null }> {
    // If another session is already running, stop it first
    if (activeSession) {
      const stopResult = await stopSession()
      if (stopResult.error) return stopResult
    }

    const { data, error } = await supabase
      .from('time_sessions')
      .insert({
        user_id:     userId,
        category_id: categoryId,
        started_at:  new Date().toISOString(),
        ended_at:    null,
        duration_seconds: null,
      })
      .select()
      .single()

    if (error) return { error: error.message }

    setActiveSession(data)
    setElapsedSeconds(0)
    return { error: null }
  }

  // ── Stop the current session ────────────────────────────────────
  async function stopSession(): Promise<{ error: string | null }> {
    if (!activeSession) return { error: 'No active session' }

    const endedAt = new Date()
    const durationSeconds = Math.floor(
      (endedAt.getTime() - new Date(activeSession.started_at).getTime()) / 1000
    )

    const { error } = await supabase
      .from('time_sessions')
      .update({
        ended_at:         endedAt.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', activeSession.id)

    if (error) return { error: error.message }

    // Update local sessions list
    const completed: TimeSession = {
      ...activeSession,
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
    }
    setSessions(prev => [completed, ...prev])
    setActiveSession(null)
    return { error: null }
  }

  // ── Get active session (from state — already loaded on mount) ────
  function getActiveSession(): TimeSession | null {
    return activeSession
  }

  // ── Daily breakdown ─────────────────────────────────────────────
  async function getDailyBreakdown(date: string): Promise<DailyBreakdown> {
    const from = startOfDay(date).toISOString()
    const to   = endOfDay(date).toISOString()

    const { data } = await supabase
      .from('time_sessions')
      .select('category_id, started_at, ended_at, duration_seconds')
      .eq('user_id', userId)
      .gte('started_at', from)
      .lte('started_at', to)
      .not('ended_at', 'is', null) // only completed sessions

    const byCategory: Record<string, number> = {}
    let totalTracked = 0

    for (const session of data ?? []) {
      const secs = session.duration_seconds ?? 0
      byCategory[session.category_id] = (byCategory[session.category_id] ?? 0) + secs
      totalTracked += secs
    }

    // Cap totalTracked at one full day (can't track more than 24h)
    const cappedTotal = Math.min(totalTracked, SECONDS_IN_DAY)
    const wastedSeconds = Math.max(0, SECONDS_IN_DAY - cappedTotal)

    return { date, byCategory, totalTracked: cappedTotal, wastedSeconds }
  }

  // ── Weekly / range breakdown ────────────────────────────────────
  // Returns one DailyBreakdown per day between startDate and endDate (inclusive)
  async function getWeeklyBreakdown(
    startDate: string,
    endDate: string
  ): Promise<WeeklyBreakdown> {
    const from = startOfDay(startDate).toISOString()
    const to   = endOfDay(endDate).toISOString()

    const { data } = await supabase
      .from('time_sessions')
      .select('category_id, started_at, ended_at, duration_seconds')
      .eq('user_id', userId)
      .gte('started_at', from)
      .lte('started_at', to)
      .not('ended_at', 'is', null)

    // Group sessions by local date
    const grouped: Record<string, Record<string, number>> = {}

    for (const session of data ?? []) {
      const dateStr = toLocalDateStr(new Date(session.started_at))
      if (!grouped[dateStr]) grouped[dateStr] = {}
      const secs = session.duration_seconds ?? 0
      grouped[dateStr][session.category_id] =
        (grouped[dateStr][session.category_id] ?? 0) + secs
    }

    // Build one entry per calendar day in the range
    const result: WeeklyBreakdown = []
    const cursor = startOfDay(startDate)
    const end    = startOfDay(endDate)

    while (cursor <= end) {
      const dateStr = toLocalDateStr(cursor)
      const byCategory = grouped[dateStr] ?? {}
      const totalTracked = Math.min(
        Object.values(byCategory).reduce((a, b) => a + b, 0),
        SECONDS_IN_DAY
      )
      result.push({
        date: dateStr,
        byCategory,
        totalTracked,
        wastedSeconds: Math.max(0, SECONDS_IN_DAY - totalTracked),
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    return result
  }

  // ── Format elapsed seconds as HH:MM:SS ─────────────────────────
  function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
  }

  // ── Format any seconds as readable string ───────────────────────
  function formatDuration(seconds: number): string {
    if (seconds < 60)   return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return {
    activeSession,
    sessions,
    loading,
    elapsedSeconds,
    startSession,
    stopSession,
    getActiveSession,
    getDailyBreakdown,
    getWeeklyBreakdown,
    formatElapsed,
    formatDuration,
  }
}