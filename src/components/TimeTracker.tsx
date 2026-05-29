'use client'

import { useState } from 'react'
import type { TimeCategory } from '@/app/hooks/useTimeCategories'
import type { TimeSession } from '@/app/hooks/useTimeSessions'

// ── Preset colours the user can pick from ────────────────────────
const PRESET_COLORS = [
    '#4f8fff', '#3dffc0', '#ffd166', '#ff6b6b',
    '#a78bfa', '#2dd4bf', '#f472b6', '#fb923c',
    '#34d399', '#60a5fa', '#f87171', '#c084fc',
]

// ── Preset emojis ─────────────────────────────────────────────────
const PRESET_EMOJIS = [
    '📚', '💼', '😴', '🏃', '🧘', '💻', '🎨', '🎵',
    '📖', '✍️', '🍳', '🏋️', '🙏', '🌿', '🎯', '💡',
]

// ── Format HH:MM:SS ───────────────────────────────────────────────
function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

// ── Sub-components ────────────────────────────────────────────────

interface AddCategoryFormProps {
    onAdd: (name: string, color: string, icon: string) => Promise<{ error: string | null }>
    onCancel: () => void
}

function AddCategoryForm({ onAdd, onCancel }: AddCategoryFormProps) {
    const [name, setName] = useState('')
    const [color, setColor] = useState(PRESET_COLORS[0])
    const [icon, setIcon] = useState(PRESET_EMOJIS[0])
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    async function handleSubmit() {
        if (!name.trim()) { setError('Enter a category name'); return }
        setSaving(true)
        const result = await onAdd(name.trim(), color, icon)
        setSaving(false)
        if (result.error) { setError(result.error); return }
        onCancel()
    }

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 animate-fade-in-up">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-3">
                New Category
            </p>

            {/* Name */}
            <input
                autoFocus
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(null) }}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onCancel() }}
                placeholder="e.g. Reading, Exercise…"
                maxLength={40}
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 text-white placeholder-slate-600 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors mb-3"
            />

            {/* Emoji picker */}
            <p className="text-xs font-mono text-slate-500 mb-2">Icon</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
                {PRESET_EMOJIS.map(e => (
                    <button
                        key={e}
                        onClick={() => setIcon(e)}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 ${icon === e
                            ? 'bg-slate-600 ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900'
                            : 'bg-slate-800 hover:bg-slate-700'
                            }`}
                    >
                        {e}
                    </button>
                ))}
            </div>

            {/* Colour picker */}
            <p className="text-xs font-mono text-slate-500 mb-2">Color</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {PRESET_COLORS.map(c => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        style={{ background: c }}
                        className={`w-6 h-6 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ${color === c
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                            : ''
                            }`}
                    />
                ))}
            </div>

            {error && (
                <p className="text-red-400 text-xs font-mono mb-3 animate-fade-in">⚠ {error}</p>
            )}

            <div className="flex gap-2 justify-end">
                <button
                    onClick={onCancel}
                    className="text-xs font-semibold text-slate-400 border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={saving || !name.trim()}
                    className="flex items-center gap-1.5 text-xs font-bold bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5 active:scale-95"
                >
                    {saving ? (
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    ) : null}
                    {saving ? 'Saving…' : 'Add category'}
                </button>
            </div>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────

interface TimeTrackerProps {
    categories: TimeCategory[]
    activeSession: TimeSession | null
    elapsedSeconds: number
    onStart: (categoryId: string) => Promise<{ error: string | null }>
    onStop: () => Promise<{ error: string | null }>
    onAddCategory: (name: string, color: string, icon: string) => Promise<{ error: string | null }>
    onDeleteCategory: (id: string) => Promise<{ error: string | null }>
}

export default function TimeTracker({
    categories,
    activeSession,
    elapsedSeconds,
    onStart,
    onStop,
    onAddCategory,
    onDeleteCategory,
}: TimeTrackerProps) {
    const [busy, setBusy] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)

    // Map category id → category for quick lookup
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))
    const activeCategory = activeSession ? categoryMap[activeSession.category_id] : null

    async function handleCategoryClick(categoryId: string) {
        if (busy) return
        setActionError(null)

        // If clicking the already-active category → stop it
        if (activeSession?.category_id === categoryId) {
            setBusy(true)
            const { error } = await onStop()
            if (error) setActionError(error)
            setBusy(false)
            return
        }

        // Otherwise start (auto-stops previous if any)
        setBusy(true)
        const { error } = await onStart(categoryId)
        if (error) setActionError(error)
        setBusy(false)
    }

    async function handleStop() {
        if (busy) return
        setBusy(true)
        setActionError(null)
        const { error } = await onStop()
        if (error) setActionError(error)
        setBusy(false)
    }

    async function handleDelete(id: string) {
        setDeleteError(null)
        const { error } = await onDeleteCategory(id)
        if (error) setDeleteError(error)
    }

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">⏱</span>
                    <h3 className="text-sm font-bold">Time Tracker</h3>
                </div>
                <button
                    onClick={() => { setShowAddForm(v => !v); setDeleteError(null) }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 active:scale-95 ${showAddForm
                        ? 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                        : 'bg-blue-500 border-blue-500 text-white hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5'
                        }`}
                >
                    <svg
                        width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                        className={`transition-transform duration-300 ${showAddForm ? 'rotate-45' : ''}`}
                    >
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {showAddForm ? 'Cancel' : 'Add category'}
                </button>
            </div>

            {/* Active session banner */}
            {activeSession && activeCategory && (
                <div
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border animate-fade-in"
                    style={{
                        background: activeCategory.color + '18',
                        borderColor: activeCategory.color + '50',
                    }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Pulsing dot */}
                        <span className="relative flex-shrink-0">
                            <span
                                className="absolute inline-flex h-3 w-3 rounded-full opacity-75 animate-ping"
                                style={{ background: activeCategory.color }}
                            />
                            <span
                                className="relative inline-flex rounded-full h-3 w-3"
                                style={{ background: activeCategory.color }}
                            />
                        </span>
                        <span className="text-base">{activeCategory.icon}</span>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{activeCategory.name}</p>
                            <p className="text-xs font-mono text-slate-400">In progress</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Live timer */}
                        <span className="text-xl font-mono font-bold text-white tabular-nums">
                            {formatElapsed(elapsedSeconds)}
                        </span>

                        {/* Stop button */}
                        <button
                            onClick={handleStop}
                            disabled={busy}
                            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="4" y="4" width="16" height="16" rx="2" />
                            </svg>
                            Stop
                        </button>
                    </div>
                </div>
            )}

            {/* Add category form */}
            {showAddForm && (
                <AddCategoryForm
                    onAdd={async (name, color, icon) => {
                        const result = await onAddCategory(name, color, icon)
                        if (!result.error) setShowAddForm(false)
                        return result
                    }}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {/* Category grid */}
            {categories.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm font-mono">
                    No categories yet — add one above
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {categories.map(cat => {
                        const isActive = activeSession?.category_id === cat.id

                        return (
                            <div key={cat.id} className="relative group">
                                <button
                                    onClick={() => handleCategoryClick(cat.id)}
                                    disabled={busy}
                                    style={{
                                        borderColor: isActive ? cat.color : cat.color + '40',
                                        background: isActive ? cat.color + '25' : 'transparent',
                                        boxShadow: isActive ? `0 0 16px ${cat.color}30` : 'none',
                                    }}
                                    className={`w-full flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 transition-all duration-200 disabled:cursor-not-allowed ${isActive
                                        ? 'scale-[1.02]'
                                        : 'hover:scale-[1.02] hover:bg-slate-700/50 active:scale-[0.98]'
                                        }`}
                                >
                                    <span className="text-2xl leading-none">{cat.icon}</span>
                                    <span
                                        className="text-xs font-bold truncate w-full text-center"
                                        style={{ color: isActive ? cat.color : '#e2e8f0' }}
                                    >
                                        {cat.name}
                                    </span>
                                    {isActive && (
                                        <span
                                            className="text-xs font-mono tabular-nums"
                                            style={{ color: cat.color }}
                                        >
                                            {formatElapsed(elapsedSeconds)}
                                        </span>
                                    )}
                                </button>

                                {/* Delete button — only visible on hover, only when not active */}
                                {!isActive && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(cat.id) }}
                                        title="Remove category"
                                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md bg-slate-900/80 border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500/40 opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center justify-center active:scale-90 text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Hint */}
            {!activeSession && categories.length > 0 && (
                <p className="text-xs font-mono text-slate-600 text-center">
                    Click a category to start tracking time
                </p>
            )}

            {/* Delete error */}
            {deleteError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono rounded-lg px-3 py-2.5 animate-fade-in">
                    ⚠ {deleteError}
                </div>
            )}

            {/* Action error */}
            {actionError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono rounded-lg px-3 py-2.5 animate-fade-in">
                    ⚠ {actionError}
                </div>
            )}
        </div>
    )
}