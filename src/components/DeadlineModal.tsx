'use client'

import { useState, useEffect } from 'react'
import type { Skill } from '@/app/hooks/useSkills'

interface DeadlineModalProps {
    isOpen: boolean
    onClose: () => void
    skills: Skill[]
    preselectedSkillId: string | null
    onSave: (skillId: string, dateStr: string) => Promise<void>
}

function localDateStr(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function DeadlineModal({
    isOpen,
    onClose,
    skills,
    preselectedSkillId,
    onSave,
}: DeadlineModalProps) {
    const [skillId, setSkillId] = useState('')
    const [dateStr, setDateStr] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = localDateStr(tomorrow)

    useEffect(() => {
        if (!isOpen) return
        setSkillId(preselectedSkillId ?? skills[0]?.id ?? '')
        setDateStr('')
        setError('')
    }, [isOpen, preselectedSkillId, skills])

    useEffect(() => {
        if (!isOpen) return
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isOpen, onClose])

    async function handleSave() {
        if (!skillId) { setError('No skill selected'); return }
        if (!dateStr) { setError('Please pick a finish date'); return }
        setSaving(true)
        await onSave(skillId, dateStr)
        setSaving(false)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-5"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md relative animate-scale-in-spring shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-5 text-slate-400 hover:text-white text-xl leading-none"
                >
                    ✕
                </button>

                <h2 className="text-xl font-extrabold mb-1">📅 Set Deadline</h2>
                <p className="text-sm text-slate-400 mb-7">
                    Choose a skill and a finish date. The card will show your required daily pace.
                </p>

                <div className="mb-5">
                    <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
                        Skill
                    </label>
                    <select
                        value={skillId}
                        onChange={e => setSkillId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg text-white text-sm px-3 py-2.5 outline-none transition-colors"
                    >
                        {skills.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-2">
                    <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
                        Finish Date
                    </label>
                    <input
                        type="date"
                        min={minDate}
                        value={dateStr}
                        onChange={e => { setDateStr(e.target.value); setError('') }}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg text-white text-sm px-3 py-2.5 outline-none transition-colors"
                    />
                    {error && (
                        <p className="text-red-400 text-xs font-mono mt-1.5">{error}</p>
                    )}
                </div>

                <div className="flex gap-3 justify-end mt-7">
                    <button
                        onClick={onClose}
                        className="text-sm font-semibold px-5 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 active:scale-95 transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="text-sm font-bold px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all duration-200"
                    >
                        {saving ? 'Saving…' : 'Set Deadline'}
                    </button>
                </div>
            </div>
        </div>
    )
}
