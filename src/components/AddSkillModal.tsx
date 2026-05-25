'use client'

import { useState, useEffect } from 'react'
import type { NewSkill } from '@/app/hooks/useSkills'

const COLORS = ['blue', 'green', 'orange', 'red', 'purple', 'teal', 'pink'] as const
type Color = typeof COLORS[number]

const COLOR_SWATCHES: Record<Color, string> = {
    blue: 'bg-gradient-to-br from-blue-700 to-blue-400',
    green: 'bg-gradient-to-br from-emerald-900 to-emerald-400',
    orange: 'bg-gradient-to-br from-amber-900 to-amber-400',
    red: 'bg-gradient-to-br from-red-900 to-red-400',
    purple: 'bg-gradient-to-br from-purple-900 to-purple-400',
    teal: 'bg-gradient-to-br from-teal-900 to-teal-400',
    pink: 'bg-gradient-to-br from-pink-900 to-pink-400',
}

interface AddSkillModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (skill: NewSkill) => Promise<void>
}

export default function AddSkillModal({ isOpen, onClose, onAdd }: AddSkillModalProps) {
    const [name, setName] = useState('')
    const [total, setTotal] = useState('')
    const [unit, setUnit] = useState('')
    const [incOne, setIncOne] = useState(true)
    const [incHalf, setIncHalf] = useState(false)
    const [incCustom, setIncCustom] = useState(false)
    const [color, setColor] = useState<Color>('blue')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Close on Escape key
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [isOpen, onClose])

    if (!isOpen) return null

    function reset() {
        setName(''); setTotal(''); setUnit('')
        setIncOne(true); setIncHalf(false); setIncCustom(false)
        setColor('blue'); setError(null)
    }

    function handleClose() {
        reset()
        onClose()
    }

    async function handleCreate() {
        setError(null)
        const totalNum = parseInt(total)

        if (!name.trim()) { setError('Please enter a skill name'); return }
        if (!totalNum || totalNum < 1) { setError('Please enter a valid total count'); return }

        const incs: number[] = []
        if (incOne) incs.push(1)
        if (incHalf) incs.push(0.5)
        if (!incs.length) incs.push(1)

        setLoading(true)
        await onAdd({
            name: name.trim(),
            total: totalNum,
            unit: unit.trim() || 'units',
            color,
            incs,
            has_custom: incCustom,
        })
        setLoading(false)
        reset()
        onClose()
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-7 w-full max-w-md shadow-2xl pointer-events-auto animate-scale-in-spring"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-extrabold">Add New Skill</h2>
                            <p className="text-sm text-slate-400 mt-1">Set up a new progress tracker</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-slate-500 hover:text-white text-xl leading-none p-1 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Skill name */}
                    <div className="mb-4">
                        <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
                            Skill Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Quran, React, Arabic…"
                            autoFocus
                            className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                        />
                    </div>

                    {/* Total + Unit */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
                                Total Count
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={total}
                                onChange={e => setTotal(e.target.value)}
                                placeholder="e.g. 100"
                                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
                                Unit Label
                            </label>
                            <input
                                type="text"
                                value={unit}
                                onChange={e => setUnit(e.target.value)}
                                placeholder="pages, stages…"
                                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Increments */}
                    <div className="mb-5">
                        <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-3">
                            Button Increments
                        </label>
                        <div className="space-y-2.5">
                            {[
                                { id: 'inc1', label: '+1', desc: 'Add one full unit', checked: incOne, set: setIncOne },
                                { id: 'inch', label: '+½', desc: 'Add half a unit', checked: incHalf, set: setIncHalf },
                                { id: 'incc', label: 'Custom', desc: 'Type any number', checked: incCustom, set: setIncCustom },
                            ].map(opt => (
                                <label key={opt.id} className="flex items-center gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={opt.checked}
                                        onChange={e => opt.set(e.target.checked)}
                                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-white font-semibold">{opt.label}</span>
                                    <span className="text-xs font-mono text-slate-500">— {opt.desc}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Color picker */}
                    <div className="mb-6">
                        <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-3">
                            Color
                        </label>
                        <div className="flex gap-2.5 flex-wrap">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-full transition-all ${COLOR_SWATCHES[c]} ${color === c
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                                        : 'hover:scale-110'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono rounded-xl px-4 py-3 mb-4">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={handleClose}
                            className="text-sm font-semibold text-slate-400 border border-slate-700 hover:border-slate-500 px-5 py-2.5 rounded-xl active:scale-95 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 disabled:active:scale-100 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200"
                        >
                            {loading ? 'Creating…' : 'Create Tracker'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}