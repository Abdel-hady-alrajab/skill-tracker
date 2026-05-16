'use client'

import { useEffect, useRef, useMemo } from 'react'
import {
    Chart,
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    RadialLinearScale,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Filler,
    DoughnutController,
    BarController,
    LineController,
    RadarController,
} from 'chart.js'
import type { Skill } from '@/app/hooks/useSkills'
import type { WeeklyChartData } from '@/app/hooks/useIncrementLog'

// Register all Chart.js components we use
Chart.register(
    DoughnutController,
    BarController,
    LineController,
    RadarController,
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    RadialLinearScale,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Filler
)

// ── Colour palette ────────────────────────────────────────────────
const SKILL_COLORS: Record<string, string> = {
    blue: '#4f8fff',
    green: '#3dffc0',
    orange: '#ffd166',
    red: '#ff6b6b',
    purple: '#a78bfa',
    teal: '#2dd4bf',
    pink: '#f472b6',
}
const FALLBACK = Object.values(SKILL_COLORS)
const skillColor = (s: Skill, i: number) =>
    SKILL_COLORS[s.color] ?? FALLBACK[i % FALLBACK.length]

// ── Shared tooltip / grid colours ────────────────────────────────
const GRID = 'rgba(255,255,255,0.07)'
const TICK = '#94a3b8'
const TIP_BG = '#1e293b'
const TIP_TX = '#f1f5f9'
const TIP_BD = '#334155'
const REMAIN = '#334155'

const tipBase = {
    backgroundColor: TIP_BG,
    titleColor: TIP_TX,
    bodyColor: TIP_TX,
    borderColor: TIP_BD,
    borderWidth: 1,
}

// ── Reusable canvas hook ──────────────────────────────────────────
function useChart(
    deps: unknown[],
    build: (canvas: HTMLCanvasElement) => Chart
) {
    const ref = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<Chart | null>(null)

    useEffect(() => {
        if (!ref.current) return
        chartRef.current?.destroy()
        chartRef.current = build(ref.current)
        return () => { chartRef.current?.destroy() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return ref
}

// ── Empty state ───────────────────────────────────────────────────
function Empty({ msg }: { msg: string }) {
    return (
        <div className="flex items-center justify-center h-44 text-xs font-mono text-slate-500 border border-dashed border-slate-700 rounded-xl">
            {msg}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// CHART 1 — Doughnut: progress per skill
// ─────────────────────────────────────────────────────────────────
function ProgressDoughnut({ skills }: { skills: Skill[] }) {
    const pcts = skills.map(s => parseFloat(Math.min((s.counter / s.total) * 100, 100).toFixed(1)))
    const cols = skills.map(skillColor)

    const ref = useChart([skills], canvas =>
        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: skills.map(s => s.name),
                datasets: [{
                    data: pcts,
                    backgroundColor: cols,
                    borderWidth: 3,
                    borderColor: '#1e293b',
                    hoverOffset: 10,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tipBase,
                        callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` },
                    },
                },
            },
        })
    )

    if (!skills.length) return <Empty msg="Add skills to see chart" />

    return (
        <div>
            {/* Custom legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
                {skills.map((s, i) => (
                    <span key={s.id} className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: cols[i] }} />
                        {s.name} {pcts[i]}%
                    </span>
                ))}
            </div>
            <div className="relative h-52">
                <canvas ref={ref} />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// CHART 2 — Stacked horizontal bar: done vs remaining
// ─────────────────────────────────────────────────────────────────
function DoneVsRemaining({ skills }: { skills: Skill[] }) {
    const h = Math.max(skills.length * 44 + 50, 180)

    const ref = useChart([skills], canvas =>
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: skills.map(s => s.name),
                datasets: [
                    {
                        label: 'Done',
                        data: skills.map(s => s.counter),
                        backgroundColor: skills.map(skillColor),
                        borderRadius: 4,
                        borderSkipped: false,
                        stack: 'a',
                    },
                    {
                        label: 'Remaining',
                        data: skills.map(s => Math.max(0, s.total - s.counter)),
                        backgroundColor: REMAIN,
                        borderRadius: 4,
                        borderSkipped: false,
                        stack: 'a',
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        grid: { color: GRID },
                        ticks: { color: TICK, font: { family: 'monospace', size: 10 } },
                    },
                    y: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { color: TICK, font: { family: 'monospace', size: 10 } },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: tipBase,
                },
            },
        })
    )

    if (!skills.length) return <Empty msg="Add skills to see chart" />

    return (
        <div>
            <div className="flex gap-4 mb-3">
                {[['Done', SKILL_COLORS.blue], ['Remaining', REMAIN]].map(([label, col]) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: col }} />
                        {label}
                    </span>
                ))}
            </div>
            <div style={{ height: h }}>
                <canvas ref={ref} />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// CHART 3 — Radar: skill strength
// ─────────────────────────────────────────────────────────────────
function SkillRadar({ skills }: { skills: Skill[] }) {
    const pcts = skills.map(s => parseFloat(Math.min((s.counter / s.total) * 100, 100).toFixed(1)))

    const ref = useChart([skills], canvas =>
        new Chart(canvas, {
            type: 'radar',
            data: {
                labels: skills.map(s => s.name),
                datasets: [{
                    label: 'Progress %',
                    data: pcts,
                    backgroundColor: 'rgba(79,143,255,0.18)',
                    borderColor: '#4f8fff',
                    borderWidth: 2,
                    pointBackgroundColor: skills.map(skillColor),
                    pointBorderColor: '#fff',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        grid: { color: GRID },
                        angleLines: { color: GRID },
                        pointLabels: { color: TICK, font: { family: 'monospace', size: 10 } },
                        ticks: {
                            color: TICK,
                            font: { size: 9 },
                            backdropColor: 'transparent',
                            stepSize: 25,
                        },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tipBase,
                        callbacks: { label: ctx => ` ${ctx.label}: ${(ctx.raw as number)}%` },
                    },
                },
            },
        })
    )

    if (skills.length < 3) return <Empty msg="Add 3+ skills to see radar" />

    return (
        <div className="relative h-56">
            <canvas ref={ref} />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// CHART 4 — Vertical bar: units completed ranking
// ─────────────────────────────────────────────────────────────────
function UnitsRanking({ skills }: { skills: Skill[] }) {
    const sorted = useMemo(
        () => [...skills].sort((a, b) => b.counter - a.counter),
        [skills]
    )

    const ref = useChart([skills], canvas =>
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: sorted.map(s => s.name),
                datasets: [{
                    label: 'Units done',
                    data: sorted.map(s => s.counter),
                    backgroundColor: sorted.map(skillColor),
                    borderRadius: 6,
                    borderSkipped: false,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: TICK,
                            font: { family: 'monospace', size: 10 },
                            autoSkip: false,
                            maxRotation: 20,
                        },
                    },
                    y: {
                        grid: { color: GRID },
                        ticks: { color: TICK, font: { family: 'monospace', size: 10 } },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tipBase,
                        callbacks: {
                            label: ctx =>
                                ` ${ctx.parsed.y} ${sorted[ctx.dataIndex]?.unit ?? 'units'} done`,
                        },
                    },
                },
            },
        })
    )

    if (!skills.length) return <Empty msg="Add skills to see chart" />

    return (
        <div className="relative h-56">
            <canvas ref={ref} />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// CHART 5 — Line: weekly activity per skill
// ─────────────────────────────────────────────────────────────────
function WeeklyActivity({ weeklyData }: { weeklyData: WeeklyChartData }) {
    const { labels, datasets } = weeklyData

    const chartDatasets = datasets.map((ds, i) => ({
        label: ds.skillName,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.color + '22',
        borderDash: i === 0 ? [] : i === 1 ? [6, 3] : [2, 2],
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35,
    }))

    const ref = useChart([weeklyData], canvas =>
        new Chart(canvas, {
            type: 'line',
            data: { labels, datasets: chartDatasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        grid: { color: GRID },
                        ticks: {
                            color: TICK,
                            font: { family: 'monospace', size: 10 },
                            maxRotation: 30,
                            autoSkip: false,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: GRID },
                        ticks: { color: TICK, font: { size: 10 }, stepSize: 1 },
                        title: {
                            display: true,
                            text: 'units logged',
                            color: TICK,
                            font: { size: 10 },
                        },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: tipBase,
                },
            },
        })
    )

    if (!datasets.length) return <Empty msg="Log progress to see weekly chart" />

    return (
        <div>
            {/* Custom legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
                {datasets.map(ds => (
                    <span key={ds.skillId} className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: ds.color }} />
                        {ds.skillName}
                    </span>
                ))}
            </div>
            <div className="relative h-56">
                <canvas ref={ref} />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT — grid of all 5 charts
// ─────────────────────────────────────────────────────────────────
interface ChartsProps {
    skills: Skill[]
    weeklyData: WeeklyChartData
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-bold mb-1">{title}</h3>
            <p className="text-xs font-mono text-slate-500 mb-4">{sub}</p>
            {children}
        </div>
    )
}

export default function Charts({ skills, weeklyData }: ChartsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <ChartCard title="Progress per Skill" sub="% completion of each tracker">
                <ProgressDoughnut skills={skills} />
            </ChartCard>

            <ChartCard title="Done vs Remaining" sub="units completed out of total">
                <DoneVsRemaining skills={skills} />
            </ChartCard>

            <ChartCard title="Skill Strength Radar" sub="how far you are in each skill (needs ≥ 3)">
                <SkillRadar skills={skills} />
            </ChartCard>

            <ChartCard title="Units Completed Ranking" sub="which skill you worked on most">
                <UnitsRanking skills={skills} />
            </ChartCard>

            <ChartCard title="Weekly Activity" sub="units logged per skill per week">
                <WeeklyActivity weeklyData={weeklyData} />
            </ChartCard>
        </div>
    )
}