'use client'

import { useState, useRef, useEffect } from 'react'
import type { TodoSkill } from '@/app/hooks/useTodoSkills'

interface TodoSkillsProps {
    todos: TodoSkill[]
    loading: boolean
    onAdd: (names: string[]) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onPromote: (id: string) => Promise<void> // moves to Your Skills
}

export default function TodoSkills({
    todos,
    loading,
    onAdd,
    onDelete,
    onPromote,
}: TodoSkillsProps) {
    const [input, setInput] = useState('')
    const [adding, setAdding] = useState(false)
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
    const [promotingIds, setPromotingIds] = useState<Set<string>>(new Set())
    const [showInput, setShowInput] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-focus textarea when panel opens
    useEffect(() => {
        if (showInput) {
            setTimeout(() => textareaRef.current?.focus(), 50)
        }
    }, [showInput])

    // Auto-resize textarea
    function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setInput(e.target.value)
        setError(null)
        e.target.style.height = 'auto'
        e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
    }

    async function handleAdd() {
        const names = input
            .split('\n')
            .map(n => n.trim())
            .filter(Boolean)

        if (!names.length) { setError('Enter at least one skill name'); return }
        if (names.some(n => n.length > 80)) { setError('Each skill name must be under 80 characters'); return }

        setAdding(true)
        await onAdd(names)
        setInput('')
        setAdding(false)
        setShowInput(false)
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        // Ctrl/Cmd + Enter submits
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
        }
        // Escape closes
        if (e.key === 'Escape') {
            setShowInput(false)
            setInput('')
            setError(null)
        }
    }

    async function handleDelete(id: string) {
        setDeletingIds(prev => new Set(prev).add(id))
        await onDelete(id)
        setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s })
    }

    async function handlePromote(id: string) {
        setPromotingIds(prev => new Set(prev).add(id))
        await onPromote(id)
        setPromotingIds(prev => { const s = new Set(prev); s.delete(id); return s })
    }

    const lineCount = (input.match(/\n/g)?.length ?? 0) + 1
    const validLines = input.split('\n').map(n => n.trim()).filter(Boolean)

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <span className="text-base">📋</span>
                    <h3 className="text-sm font-bold text-white">Skill Queue</h3>
                    {todos.length > 0 && (
                        <span className="bg-slate-700 text-slate-300 text-xs font-mono px-2 py-0.5 rounded-full">
                            {todos.length}
                        </span>
                    )}
                </div>

                <button
                    onClick={() => { setShowInput(v => !v); setError(null) }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 active:scale-95 ${showInput
                            ? 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                            : 'bg-blue-500 border-blue-500 text-white hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5'
                        }`}
                >
                    <svg
                        width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                        className={`transition-transform duration-300 ${showInput ? 'rotate-45' : ''}`}
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {showInput ? 'Cancel' : 'Add skills'}
                </button>
            </div>

            {/* Add input panel */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${showInput ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-start gap-1.5 mb-2">
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Skill names</span>
                        <span className="text-xs font-mono text-slate-600">— one per line to add multiple at once</span>
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={`e.g.\nReact Native\nAlgorithms\nArabic Grammar`}
                        rows={3}
                        className="w-full bg-transparent border-none outline-none text-white placeholder-slate-600 text-sm font-mono resize-none leading-relaxed min-h-[72px]"
                        style={{ height: 'auto' }}
                    />

                    {/* Line count preview */}
                    {input.trim() && (
                        <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                            {input.split('\n').map((name, i) => {
                                const trimmed = name.trim()
                                if (!trimmed) return null
                                return (
                                    <span
                                        key={i}
                                        className="bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-mono px-2 py-0.5 rounded-full animate-fade-in"
                                    >
                                        {trimmed.length > 24 ? trimmed.slice(0, 24) + '…' : trimmed}
                                    </span>
                                )
                            })}
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 text-xs font-mono mb-3 animate-fade-in">
                            ⚠ {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-xs font-mono text-slate-600">
                            {validLines.length > 0
                                ? `${validLines.length} skill${validLines.length !== 1 ? 's' : ''} to add`
                                : 'Ctrl+Enter to save'}
                        </span>
                        <button
                            onClick={handleAdd}
                            disabled={adding || !input.trim()}
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
                        >
                            {adding ? (
                                <>
                                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Adding…
                                </>
                            ) : (
                                <>
                                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Add {validLines.length > 1 ? `${validLines.length} skills` : 'skill'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Todo list */}
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-11 bg-slate-700/40 rounded-lg animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                    ))}
                </div>
            ) : todos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="text-3xl mb-3 opacity-40">📋</span>
                    <p className="text-sm text-slate-500 font-mono">No skills queued yet</p>
                    <p className="text-xs text-slate-600 font-mono mt-1">
                        Add skills you plan to start later
                    </p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {todos.map((todo, index) => {
                        const isDeleting = deletingIds.has(todo.id)
                        const isPromoting = promotingIds.has(todo.id)
                        const isBusy = isDeleting || isPromoting

                        return (
                            <li
                                key={todo.id}
                                className={`group flex items-center gap-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 hover:border-slate-600 rounded-lg px-3 py-2.5 transition-all duration-200 animate-fade-in-up ${isDeleting ? 'opacity-0 scale-95 translate-x-4' :
                                        isPromoting ? 'opacity-0 scale-95 -translate-x-4' : ''
                                    }`}
                                style={{ animationDelay: `${index * 40}ms` }}
                            >
                                {/* Drag handle / bullet */}
                                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors duration-200" />

                                {/* Name */}
                                <span className="flex-1 text-sm text-slate-300 group-hover:text-white transition-colors duration-200 truncate">
                                    {todo.name}
                                </span>

                                {/* Actions — visible on hover */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 flex-shrink-0">
                                    {/* Promote to skill */}
                                    <button
                                        onClick={() => handlePromote(todo.id)}
                                        disabled={isBusy}
                                        title="Move to Your Skills"
                                        className="flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 hover:text-emerald-300 text-xs font-mono px-2.5 py-1 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                                    >
                                        {isPromoting ? (
                                            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                        ) : (
                                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        )}
                                        Start
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(todo.id)}
                                        disabled={isBusy}
                                        title="Remove from queue"
                                        className="flex items-center justify-center w-7 h-7 bg-red-500/10 hover:bg-red-500/25 border border-transparent hover:border-red-500/40 text-slate-500 hover:text-red-400 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                                    >
                                        {isDeleting ? (
                                            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                        ) : (
                                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}

            {/* Footer hint when there are todos */}
            {todos.length > 0 && (
                <p className="text-xs font-mono text-slate-600 mt-3 text-center">
                    Hover a skill → click <span className="text-emerald-600">Start</span> to move it to Your Skills
                </p>
            )}
        </div>
    )
}