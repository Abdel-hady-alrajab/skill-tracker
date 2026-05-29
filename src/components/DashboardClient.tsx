'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSkills } from '@/app/hooks/useSkills'
import type { Skill } from '@/app/hooks/useSkills'
import { useUserStats } from '@/app/hooks/useUserStats'
import { useActivityLog } from '@/app/hooks/useActivityLog'
import { useIncrementLog } from '@/app/hooks/useIncrementLog'
import { useMilestone } from '@/components/MilestonePop'
import MilestonePop from '@/components/MilestonePop'
import AddSkillModal from '@/components/AddSkillModal'
import DeadlineModal from '@/components/DeadlineModal'
import SkillCard from '@/components/SkillCard'
import type { DeadlineInfo } from '@/components/SkillCard'
import CoinShop from '@/components/CoinShop'
import ActivityHeatmap from '@/components/HeatMap'
import Charts from '@/components/Charts'
import { checkMilestones, getMilestonesReached } from '@/lib/milestones'
import { useTodoSkills } from '@/app/hooks/useTodoSkills'
import TodoSkills from '@/components/TodoSkills'
import TimeStatsDashboard from '@/components/TimeStatsDashboard'


interface Props {
    userId: string
}

function AnimatedNumber({ value }: { value: number | string }) {
    const strVal = String(value)
    const match = strVal.match(/^(\d+(?:\.\d+)?)(.*)$/)
    const target = match ? parseFloat(match[1]) : 0
    const suffix = match ? match[2] : ''

    const [current, setCurrent] = useState(0)

    useEffect(() => {
        let startTime = performance.now()
        const duration = 1200 // smooth count up duration
        let animationFrameId: number

        const update = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 4) // easeOutQuart
            setCurrent(Math.floor(ease * target))

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(update)
            } else {
                setCurrent(target)
            }
        }

        animationFrameId = requestAnimationFrame(update)
        return () => cancelAnimationFrame(animationFrameId)
    }, [target])

    return (
        <span>
            {current}
            {suffix}
        </span>
    )
}

export default function DashboardClient({ userId }: Props) {
    const supabase = useRef(createClient()).current

    const { skills, loading, addSkill, deleteSkill, updateCounter } = useSkills(userId)
    const {
        stats,
        streakActive,
        addCoins,
        updateStreak,
        buyFreeze,
        buyBooster,
        buyDeadlineTracker,
        refetch: refetchStats,
    } = useUserStats(userId)
    const { log, logActivity } = useActivityLog(userId)
    const { logIncrement, getWeeklyData } = useIncrementLog(userId)
    const { data: milestoneData, visible: milestoneVisible, triggerMilestone } = useMilestone()
    const {
        todos, loading: todosLoading,
        addTodos, deleteTodo, promoteToSkill,
    } = useTodoSkills(userId)
    const [addSkillOpen, setAddSkillOpen] = useState(false)
    const [deadlineModalOpen, setDeadlineModalOpen] = useState(false)
    const [deadlineSkillId, setDeadlineSkillId] = useState<string | null>(null)
    const [deadlines, setDeadlines] = useState<Record<string, string>>({})
    const [prevCounters, setPrevCounters] = useState<Record<string, number>>({})
    const [toast, setToast] = useState<string | null>(null)
    const [importing, setImporting] = useState(false)
    const [prefilledName, setPrefilledName] = useState('')

    // ── Legacy skills (pre-completed) ────────────────────────────────────
    const LEGACY_SKILLS = [
        { name: 'Tailwind', total: 100, unit: '%', color: 'teal' },
        { name: 'CORS', total: 100, unit: '%', color: 'orange' },
        { name: 'Task Runners', total: 100, unit: '%', color: 'red' },
        { name: 'Webpack', total: 100, unit: '%', color: 'purple' },
        { name: 'Jira', total: 100, unit: '%', color: 'blue' },
        { name: 'Cypress Testing', total: 100, unit: '%', color: 'green' },
        { name: 'TypeScript', total: 100, unit: '%', color: 'blue' },
        { name: 'PWA', total: 100, unit: '%', color: 'pink' },
        { name: 'Next.js', total: 100, unit: '%', color: 'teal' },
        { name: 'Node', total: 100, unit: '%', color: 'green' },
        { name: 'React Native', total: 100, unit: '%', color: 'purple' },
        { name: 'Programming', total: 100, unit: '%', color: 'orange' },
        { name: 'GTmetrix', total: 100, unit: '%', color: 'red' },
        { name: 'Agile / Coursera', total: 100, unit: '%', color: 'blue' },
        { name: 'Chrome DevTools', total: 100, unit: '%', color: 'teal' },
        { name: 'Mock Interviews', total: 100, unit: '%', color: 'pink' },
        { name: 'Material UI', total: 100, unit: '%', color: 'purple' },
        { name: 'AI Tutorials', total: 100, unit: '%', color: 'green' },
    ]

    const alreadyImported = typeof window !== 'undefined'
        && localStorage.getItem('legacy_skills_imported') === 'true'

    const legacyNotYetAdded = !alreadyImported
        && !loading
        && !LEGACY_SKILLS.some(ls =>
            skills.some(s => s.name.toLowerCase() === ls.name.toLowerCase())
        )

    async function importLegacySkills() {
        setImporting(true)
        const maxPos = skills.length > 0 ? Math.max(...skills.map(s => s.position)) : -1

        for (let i = 0; i < LEGACY_SKILLS.length; i++) {
            const ls = LEGACY_SKILLS[i]
            const { data: inserted } = await supabase.from('skills').insert({
                user_id: userId,
                name: ls.name,
                total: ls.total,
                unit: ls.unit,
                color: ls.color,
                incs: [1],
                has_custom: false,
                position: maxPos + 1 + i,
            }).select('id').single()

            if (inserted) {
                await supabase.from('skill_progress').insert({
                    skill_id: inserted.id,
                    counter: ls.total,
                })
            }
        }

        localStorage.setItem('legacy_skills_imported', 'true')
        setImporting(false)
        showToast('✅ Legacy skills imported!')
        // Force a full refetch to show the new completed skills
        window.location.reload()
    }

    // Load deadlines from DB whenever skills list changes
    useEffect(() => {
        if (!skills.length) return
        supabase
            .from('deadlines')
            .select('skill_id, deadline_date')
            .eq('user_id', userId)
            .then(({ data }) => {
                if (!data) return
                const map: Record<string, string> = {}
                data.forEach(row => { map[row.skill_id] = row.deadline_date })
                setDeadlines(map)
            })
    }, [skills.length, userId, supabase])

    function showToast(msg: string) {
        setToast(msg)
        setTimeout(() => setToast(null), 3500)
    }

    async function handleIncrement(skillId: string, amount: number) {
        const skill = skills.find(s => s.id === skillId)
        if (!skill) return

        const newCounter = Math.min(skill.counter + amount, skill.total)
        if (newCounter <= skill.counter) return

        setPrevCounters(prev => ({ ...prev, [skillId]: skill.counter }))

        await updateCounter(skillId, newCounter)
        logActivity()
        logIncrement(skillId, skill.name, amount)

        const earned = await addCoins(1)
        if (earned > 1) showToast(`⚡ Booster active! +${earned} 🪙`)

        await updateStreak()

        // Check milestones
        const oldPct = (skill.counter / skill.total) * 100
        const newPct = (newCounter / skill.total) * 100
        const alreadyReached = await getMilestonesReached(userId, skillId, supabase)
        const result = await checkMilestones(
            userId, skillId, skill.name, oldPct, newPct, alreadyReached, supabase
        )
        if (result) {
            triggerMilestone(result.icon, result.title, result.sub)
            await refetchStats()
        }
    }

    async function handleUndo(skillId: string) {
        const prev = prevCounters[skillId]
        if (prev === undefined) return
        await updateCounter(skillId, prev)
        setPrevCounters(p => {
            const n = { ...p }
            delete n[skillId]
            return n
        })
    }

    async function handlePromote(id: string) {
        const name = await promoteToSkill(id)
        if (name) {
            setPrefilledName(name)
            setAddSkillOpen(true)
        }
    }

    async function handleSaveDeadline(skillId: string, dateStr: string) {
        await supabase
            .from('deadlines')
            .upsert(
                { user_id: userId, skill_id: skillId, deadline_date: dateStr },
                { onConflict: 'skill_id' }
            )
        setDeadlines(prev => ({ ...prev, [skillId]: dateStr }))
        setDeadlineModalOpen(false)
    }

    async function handleRemoveDeadline(skillId: string) {
        await supabase
            .from('deadlines')
            .delete()
            .eq('skill_id', skillId)
            .eq('user_id', userId)
        setDeadlines(prev => {
            const n = { ...prev }
            delete n[skillId]
            return n
        })
    }

    function openDeadlineModal(skillId?: string) {
        setDeadlineSkillId(skillId ?? null)
        setDeadlineModalOpen(true)
    }

    function getDeadlineInfo(skill: Skill): DeadlineInfo | null {
        const dateStr = deadlines[skill.id]
        if (!dateStr) return null

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const deadline = new Date(dateStr + 'T00:00:00')
        const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
        const remaining = skill.total - skill.counter
        const done = skill.counter >= skill.total
        const paceNeeded = daysLeft > 0 ? remaining / daysLeft : remaining

        return { dateStr, daysLeft, paceNeeded, done }
    }

    // Aggregate stats
    const totalUnits = skills.reduce((s, sk) => s + sk.total, 0)
    const doneUnits = skills.reduce((s, sk) => s + sk.counter, 0)
    const leftUnits = skills.reduce((s, sk) => s + Math.max(0, sk.total - sk.counter), 0)
    const completedSkills = skills.filter(s => s.counter >= s.total).length
    const overallPct = totalUnits > 0 ? (doneUnits / totalUnits) * 100 : 0

    const [animatedOverallPct, setAnimatedOverallPct] = useState(0)

    useEffect(() => {
        const t = setTimeout(() => {
            setAnimatedOverallPct(overallPct)
        }, 100)
        return () => clearTimeout(t)
    }, [overallPct])

    const activeSkills = skills.filter(s => s.counter < s.total)
    const completedSkillsList = skills.filter(s => s.counter >= s.total)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <span className="text-slate-500 font-mono text-sm animate-pulse">Loading…</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">

            {/* Overall progress bar */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 animate-fade-in-up delay-0 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <span className="text-sm font-bold">Overall Progress</span>
                    <span className="text-xs font-mono text-slate-400">
                        {overallPct.toFixed(1)}% across all skills
                    </span>
                </div>
                <div className="bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-800">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-[1000ms] ease-out"
                        style={{ width: `${animatedOverallPct}%` }}
                    />
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-fade-in-up delay-75">
                {[
                    { label: 'Skills Tracked', value: skills.length, icon: '📚' },
                    { label: 'Completed', value: completedSkills, icon: '✅' },
                    { label: 'Units Done', value: doneUnits, icon: '📈' },
                    { label: 'Units Left', value: leftUnits, icon: '🎯' },
                    { label: 'Best Streak', value: `${stats.streak_best}d`, icon: streakActive ? '🔥' : '💤' },
                ].map(({ label, value, icon }) => (
                    <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center transition-all duration-300 hover:border-slate-500 hover:-translate-y-0.5 hover:shadow-md group">
                        <div className="text-2xl leading-none mb-1 transition-transform duration-300 group-hover:scale-110">{icon}</div>
                        <div className="text-xl font-extrabold font-mono"><AnimatedNumber value={value} /></div>
                        <div className="text-[11px] font-mono text-slate-500 mt-1">{label}</div>
                    </div>
                ))}
            </div>

            {/* Coin Shop */}
            <div className="animate-fade-in-up delay-150">
                <CoinShop
                    coins={stats.coins}
                    freezes={stats.streak_freezes}
                    boosterLeft={stats.booster_left}
                    deadlineUnlocked={stats.deadline_unlocked}
                    onBuyFreeze={buyFreeze}
                    onBuyBooster={buyBooster}
                    onBuyDeadline={buyDeadlineTracker}
                    onOpenDeadlineModal={() => openDeadlineModal()}
                    onToast={showToast}
                />
            </div>

            {/* Activity Heatmap */}
            <div className="animate-fade-in-up delay-225">
                <ActivityHeatmap log={log} />
            </div>

            {/* Charts */}
            <div className="animate-fade-in-up delay-300">
                <Charts skills={activeSkills} weeklyData={getWeeklyData()} />
            </div>

            {/* Skill cards */}
            <div className="animate-fade-in-up delay-375">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h2 className="text-base font-bold">Your Skills</h2>
                    <div className="flex items-center gap-2">
                        {legacyNotYetAdded && (
                            <button
                                onClick={importLegacySkills}
                                disabled={importing}
                                className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 disabled:active:scale-100 duration-200"
                            >
                                {importing ? 'Importing…' : '📥 Import Previous Skills'}
                            </button>
                        )}
                        <button
                            onClick={() => setAddSkillOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 disabled:active:scale-100 duration-200 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                        >
                            + Add Skill
                        </button>
                    </div>
                </div>

                {activeSkills.length === 0 && completedSkillsList.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 font-mono text-sm border border-dashed border-slate-700 rounded-xl transition-all duration-300">
                        No skills yet — click &quot;+ Add Skill&quot; to get started!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                        {activeSkills.map(skill => (
                            <SkillCard
                                key={skill.id}
                                skill={skill}
                                deadlineInfo={getDeadlineInfo(skill)}
                                deadlineUnlocked={stats.deadline_unlocked}
                                onIncrement={handleIncrement}
                                onUndo={handleUndo}
                                onDelete={async (id) => { await deleteSkill(id) }}
                                onSetDeadline={(id) => openDeadlineModal(id)}
                                onRemoveDeadline={handleRemoveDeadline}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Completed skills */}
            {completedSkillsList.length > 0 && (
                <div className="animate-fade-in-up delay-450">
                    <h3 className="text-xs font-mono text-slate-500 mb-3 uppercase tracking-widest">
                        Completed
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {completedSkillsList.map(skill => (
                            <span
                                key={skill.id}
                                className="bg-slate-800 border border-emerald-700/50 text-emerald-400 text-xs font-mono px-3 py-1.5 rounded-full hover:bg-slate-700 transition-all duration-300 hover:scale-105 cursor-default"
                            >
                                ✓ {skill.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Skill Queue */}
            <TodoSkills
                todos={todos}
                loading={todosLoading}
                onAdd={addTodos}
                onDelete={deleteTodo}
                onPromote={handlePromote}
            />

            {/* Time Tracker Section */}
            <div className="animate-fade-in-up delay-500">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">⏳</span>
                    <h2 className="text-base font-bold">Time Tracker</h2>
                </div>
                <TimeStatsDashboard userId={userId} />
            </div>

            {/* Modals */}
            <AddSkillModal
                isOpen={addSkillOpen}
                prefilledName={prefilledName}
                onClose={() => {
                    setAddSkillOpen(false);
                    setPrefilledName('');
                }}
                onAdd={async (newSkill) => {
                    // Explicitly handle the action so it returns Promise<void> matching your modal's expected type
                    const error = await addSkill(newSkill);
                    if (error) {
                        console.error("Failed to add skill:", error);
                        // Optional: Handle your Supabase error here (e.g., toast notification)
                    }
                    setAddSkillOpen(false);
                }}
            />

            <DeadlineModal
                isOpen={deadlineModalOpen}
                onClose={() => setDeadlineModalOpen(false)}
                skills={skills}
                preselectedSkillId={deadlineSkillId}
                onSave={handleSaveDeadline}
            />

            <MilestonePop data={milestoneData} visible={milestoneVisible} />

            {/* Toast notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-slate-800 border border-slate-700 text-white text-sm font-mono px-4 py-3 rounded-xl shadow-xl z-40 animate-scale-in-spring hover:scale-105 transition-transform duration-300">
                    {toast}
                </div>
            )}
        </div>
    )
}
