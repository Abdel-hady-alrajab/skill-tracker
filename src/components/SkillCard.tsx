'use client'

import { useState } from 'react'
import type { Skill } from '@/app/hooks/useSkills'

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

interface DeadlineInfo {
    dateStr: string
    daysLeft: number
    paceNeeded: string
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

    const pct = Math.min((skill.counter / skill.total) * 100, 100)
    const gradient = BAR_GRADIENTS[skill.color] ?? BAR_GRADIENTS.blue

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
        <div className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-5 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold tracking-tight">{skill.name}</h3>
                <span className="text-xs font-mono text-slate-500">
                    / {skill.total} {skill.unit}
                </span>
            </div>

            {/* Progress bar */}
            <div className="bg-slate-900 rounded-full h-7 overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradient} flex items-center pl-3 transition-all duration-500 min-w-[44px]`}
                    style={{ width: `${Math.max(pct, 0)}%` }}
                >
                    <span className="text-xs font-mono font-bold text-white whitespace-nowrap">
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
                            className="bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        >
                            +1 {skill.unit}
                        </button>
                    )}

                    {skill.incs.includes(0.5) && (
                        <button
                            onClick={() => handle(0.5)}
                            disabled={busy || skill.counter >= skill.total}
                            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
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
                                className="w-16 bg-slate-900 border border-slate-700 focus:border-blue-500 text-white text-xs font-mono px-2 py-1.5 rounded-lg outline-none"
                            />
                            <button
                                onClick={handleCustom}
                                disabled={busy || !customAmt}
                                className="bg-slate-700 hover:bg-slate-600 border border-slate-600 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                            >
                                Add
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleUndo}
                        disabled={busy || skill.counter <= 0}
                        className="text-slate-400 hover:text-white disabled:opacity-30 text-xs px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-600 transition-all"
                    >
                        ↩
                    </button>

                    <button
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1.5 rounded-lg border border-transparent hover:border-red-500/40 transition-all"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Deadline bar */}
            {deadlineUnlocked && (
                <div className="mt-3">
                    {deadlineInfo ? (
                        <div className={`flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-lg border text-xs font-mono ${deadlineInfo.done
                            ? 'border-yellow-500/40 bg-yellow-500/8 text-yellow-400'
                            : deadlineInfo.daysLeft < 0
                                ? 'border-red-500/40 bg-red-500/8 text-red-400'
                                : 'border-emerald-500/40 bg-emerald-500/8 text-emerald-400'
                            }`}>
                            <div>
                                <span className="font-bold">
                                    {deadlineInfo.done
                                        ? 'Completed! 🎉'
                                        : deadlineInfo.daysLeft < 0
                                            ? `${Math.abs(deadlineInfo.daysLeft)} days overdue`
                                            : `${deadlineInfo.daysLeft} days left`}
                                </span>
                                {' · '}
                                <span className="text-slate-400">
                                    {new Date(deadlineInfo.dateStr).toLocaleDateString('en-GB', {
                                        day: 'numeric', month: 'short', year: 'numeric',
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {!deadlineInfo.done && (
                                    <span className="text-slate-400">
                                        Need {deadlineInfo.paceNeeded} {skill.unit}/day
                                    </span>
                                )}
                                <button
                                    onClick={() => onRemoveDeadline(skill.id)}
                                    className="text-slate-500 hover:text-red-400 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => onSetDeadline(skill.id)}
                            className="text-blue-400 hover:text-blue-300 text-xs font-mono transition-colors"
                        >
                            + Set deadline
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}