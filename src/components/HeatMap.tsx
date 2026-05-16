'use client'

import { useMemo, useRef, useState } from 'react'
import type { ActivityLog } from '@/app/hooks/useActivityLog'

interface Props {
    log: ActivityLog
}

function localDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Cell {
    dateStr: string
    count: number
    level: 0 | 1 | 2 | 3 | 4
    isToday: boolean
    isFuture: boolean
}

interface Column {
    cells: Cell[]
    monthLabel: string | null // shown above if this column starts a new month
}

const LEVEL_CLASSES: Record<number, string> = {
    0: 'bg-slate-800 border border-slate-700/50',
    1: 'bg-emerald-900   border-transparent',
    2: 'bg-emerald-600   border-transparent',
    3: 'bg-emerald-500   border-transparent',
    4: 'bg-emerald-400   border-transparent',
}

export default function ActivityHeatmap({ log }: Props) {
    const WEEKS = 26
    const tooltipRef = useRef<HTMLDivElement>(null)
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

    const { columns, totalDays, totalActions } = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const todayStr = localDateStr(today)

        // Max value for scaling
        const values = Object.values(log).map(Number)
        const maxVal = values.length ? Math.max(...values) : 1

        function level(count: number): 0 | 1 | 2 | 3 | 4 {
            if (!count) return 0
            if (count / maxVal <= .25) return 1
            if (count / maxVal <= .50) return 2
            if (count / maxVal <= .75) return 3
            return 4
        }

        // Anchor: Sunday of the current week, then go back WEEKS-1 weeks
        const start = new Date(today)
        start.setDate(today.getDate() - today.getDay())          // this week's Sunday
        start.setDate(start.getDate() - (WEEKS - 1) * 7)        // 25 weeks back

        const cols: Column[] = []
        let prevMonth = -1

        for (let w = 0; w < WEEKS; w++) {
            const cells: Cell[] = []
            let monthLabel: string | null = null

            for (let d = 0; d < 7; d++) {
                const cur = new Date(start)
                cur.setDate(start.getDate() + w * 7 + d)
                const ds = localDateStr(cur)
                const isFuture = ds > todayStr
                const count = log[ds] ?? 0

                cells.push({
                    dateStr: ds,
                    count,
                    level: isFuture ? 0 : level(count),
                    isToday: ds === todayStr,
                    isFuture,
                })

                // Month label on Sunday (d === 0) of the column
                if (d === 0 && !isFuture) {
                    const m = cur.getMonth()
                    if (m !== prevMonth) {
                        monthLabel = MONTH_NAMES[m]
                        prevMonth = m
                    }
                }
            }

            cols.push({ cells, monthLabel })
        }

        const totalDays = Object.keys(log).length
        const totalActions = Object.values(log).reduce((a, b) => a + b, 0)

        return { columns: cols, totalDays, totalActions }
    }, [log])

    function handleMouseEnter(cell: Cell, e: React.MouseEvent) {
        if (cell.isFuture) return
        const rect = (e.target as HTMLElement).getBoundingClientRect()
        setTooltip({
            text: `${cell.dateStr} — ${cell.count} action${cell.count !== 1 ? 's' : ''}`,
            x: rect.left + rect.width / 2,
            y: rect.top - 8,
        })
    }

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                    <h3 className="text-sm font-bold">Activity Heatmap</h3>
                    <p className="text-xs font-mono text-slate-500 mt-1">
                        {totalDays > 0
                            ? `${totalDays} active day${totalDays !== 1 ? 's' : ''} · ${totalActions} total action${totalActions !== 1 ? 's' : ''} logged`
                            : 'Log progress to start filling the grid'}
                    </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                    <span>Less</span>
                    {[0, 1, 2, 3, 4].map(l => (
                        <div
                            key={l}
                            className={`w-3 h-3 rounded-sm ${LEVEL_CLASSES[l]}`}
                        />
                    ))}
                    <span>More</span>
                </div>
            </div>

            {/* Grid wrapper — scrolls horizontally on small screens */}
            <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                    {/* Day labels */}
                    <div className="flex flex-col gap-0.5 mr-1 pt-[18px]">
                        {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                            <div
                                key={i}
                                className="text-[9px] font-mono text-slate-600 h-[15px] leading-[15px] w-6 text-right"
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Columns */}
                    <div className="flex flex-col">
                        {/* Month labels row */}
                        <div className="flex gap-0.5 mb-1 h-[14px]">
                            {columns.map((col, wi) => (
                                <div
                                    key={wi}
                                    className="w-[15px] text-[9px] font-mono text-slate-500 overflow-hidden"
                                >
                                    {col.monthLabel ?? ''}
                                </div>
                            ))}
                        </div>

                        {/* Cell grid */}
                        <div className="flex gap-0.5">
                            {columns.map((col, wi) => (
                                <div key={wi} className="flex flex-col gap-0.5">
                                    {col.cells.map((cell, di) => (
                                        <div
                                            key={di}
                                            onMouseEnter={e => handleMouseEnter(cell, e)}
                                            onMouseLeave={() => setTooltip(null)}
                                            className={`
                        w-[15px] h-[15px] rounded-[3px] cursor-default transition-opacity
                        ${LEVEL_CLASSES[cell.level]}
                        ${cell.isFuture ? 'opacity-20' : 'hover:opacity-75'}
                        ${cell.isToday ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-800' : ''}
                      `}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tooltip — rendered via portal-like fixed position */}
            {tooltip && (
                <div
                    ref={tooltipRef}
                    className="fixed z-50 bg-slate-900 border border-slate-700 text-white text-xs font-mono px-2.5 py-1.5 rounded-lg pointer-events-none whitespace-nowrap shadow-xl"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    {tooltip.text}
                </div>
            )}
        </div>
    )
}