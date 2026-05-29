'use client'

import { useState, useEffect } from 'react'
import type { Skill } from '@/app/hooks/useSkills'
import DeadlineBar from '@/components/DeadlineBar'

// Color gradient map matching the original HTML app
const BAR_GRADIENTS: Record<string, string> = {
    blue: 'from-blue-700 to-blue-400',
    green: 'from-emerald-900 to-emerald-400',
    orange: 'from-amber-900 to-amber-400',
    red: 'from-red-900 to-red-400',
    purple: 'from-purple-900 to-purple-400',
    teal: 'from-teal-900 to-teal-400',
    pink: 'from-pink-900 to-pink-400',
}

export interface DeadlineInfo {
    dateStr: string
    daysLeft: number
    paceNeeded: number
    done: boolean
}

interface SkillCardProps {
    skill: Skill
    deadlineInfo: DeadlineInfo | null
    deadlineUnlocked: boolean
    onIncrement: (skillId: string, amount: number) => Promise<void>
    onUndo: (skillId: string) => Promise<void>
    onDelete: (skillId: string) => Promise<void>
    onSetDeadline: (skillId: string) => void
    onRemoveDeadline: (skillId: string) => void
}

export default function SkillCard({
    skill,
    deadlineInfo,
    deadlineUnlocked,
    onIncrement,
    onUndo,
    onDelete,
    onSetDeadline,
    onRemoveDeadline,
}: SkillCardProps) {
    const [customAmt, setCustomAmt] = useState('')
    const [busy, setBusy] = useState(false)
    const [animatedPct, setAnimatedPct] = useState(0)

    const pct = Math.min((skill.counter / skill.total) * 100, 100)
    const gradient = BAR_GRADIENTS[skill.color] ?? BAR_GRADIENTS.blue

    useEffect(() => {
        // Set animated percentage after component mounts to trigger the transition
        const t = setTimeout(() => {
            setAnimatedPct(pct)
        }, 100)
        return () => clearTimeout(t)
    }, [pct])

    async function handle(amount: number) {
        if (busy) return
        setBusy(true)
        await onIncrement(skill.id, amount)
        setBusy(false)
    }

    async function handleCustom() {
        const val = parseFloat(customAmt)
        if (!val || val <= 0) return
        setCustomAmt('')
        await handle(val)
    }

    async function handleUndo() {
        if (busy) return
        setBusy(true)
        await onUndo(skill.id)
        setBusy(false)
    }

    async function handleDelete() {
        if (!confirm(`Delete "${skill.name}"? This cannot be undone.`)) return
        await onDelete(skill.id)
    }

    return (
        <div className="bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/40">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold tracking-tight">{skill.name}</h3>
                <span className="text-xs font-mono text-slate-500">
                    / {skill.total} {skill.unit}
                </span>
            </div>

            {/* Progress bar */}
            <div className="bg-slate-900 rounded-full h-7 overflow-hidden border border-slate-800">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradient} flex items-center pl-3 transition-all duration-[1000ms] ease-out min-w-[44px] ${pct >= 100 ? 'animate-pulse' : ''}`}
                    style={{ width: `${Math.max(animatedPct, 0)}%` }}
                >
                    <span className="text-xs font-mono font-bold text-white whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                        {pct.toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                {/* Counter */}
                <span className="text-sm font-mono text-slate-400">
                    <strong className="text-white">{skill.counter}</strong> / {skill.total} {skill.unit}
                </span>

                {/* Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    {skill.incs.includes(1) && (
                        <button
                            onClick={() => handle(1)}
                            disabled={busy || skill.counter >= skill.total}
                            className="bg-blue-500 hover:bg-blue-400 active:scale-95 disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all duration-200 hover:shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                        >
                            +1 {skill.unit}
                        </button>
                    )}

                    {skill.incs.includes(0.5) && (
                        <button
                            onClick={() => handle(0.5)}
                            disabled={busy || skill.counter >= skill.total}
                            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-blue-400 active:scale-95 disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 hover:shadow-[0_0_10px_rgba(148,163,184,0.15)]"
                        >
                            +½
                        </button>
                    )}

                    {skill.has_custom && (
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={customAmt}
                                onChange={e => setCustomAmt(e.target.value)}
                                placeholder="Amt"
                                className="w-16 bg-slate-900 border border-slate-700 focus:border-blue-500 text-white text-xs font-mono px-2 py-1.5 rounded-lg outline-none transition-all duration-200"
                            />
                            <button
                                onClick={handleCustom}
                                disabled={busy || !customAmt}
                                className="bg-slate-700 hover:bg-slate-600 border border-slate-600 active:scale-95 disabled:active:scale-100 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 hover:border-slate-500"
                            >
                                Add
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleUndo}
                        disabled={busy || skill.counter <= 0}
                        aria-label={`Undo last increment for ${skill.name}`}
                        className="text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 active:scale-90 disabled:active:scale-100 text-xs px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-600 transition-all duration-200"
                    >
                        ↩
                    </button>

                    <button
                        onClick={handleDelete}
                        aria-label={`Delete ${skill.name}`}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 active:scale-90 text-xs px-2.5 py-1.5 rounded-lg border border-transparent hover:border-red-500/30 transition-all duration-200"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Deadline bar */}
            {deadlineUnlocked && (
                <div className="mt-3">
                    <DeadlineBar
                        deadline={deadlineInfo?.dateStr ?? null}
                        daysLeft={deadlineInfo?.daysLeft ?? 0}
                        paceNeeded={deadlineInfo?.paceNeeded ?? 0}
                        unit={skill.unit}
                        done={deadlineInfo?.done ?? false}
                        onRemove={() => onRemoveDeadline(skill.id)}
                        onSetDeadline={() => onSetDeadline(skill.id)}
                    />
                </div>
            )}
        </div>
    )
}