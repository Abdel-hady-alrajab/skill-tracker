'use client'

import React, { useState, useEffect } from 'react'
import { useTimeTracker } from '@/app/contexts/TimeTrackerContext'
import { WeeklyBreakdown, DailyBreakdown } from '@/app/hooks/useTimeSessions'
import TimeTracker from './TimeTracker'
import TimeLineChart from './TimeLineChart'
import DayDetailModal from './DayDetailModal'

export default function TimeStatsDashboard({ userId }: { userId: string }) {
    const { categoriesData, sessionsData } = useTimeTracker()

    const { 
        categories, 
        addCategory, 
        deleteCategory 
    } = categoriesData

    const { 
        activeSession, 
        elapsedSeconds, 
        startSession, 
        stopSession, 
        getWeeklyBreakdown,
        getDailyBreakdown
    } = sessionsData

    const [period, setPeriod] = useState<'7days' | '30days' | 'thisMonth' | 'prevMonth'>('7days')
    const [chartData, setChartData] = useState<WeeklyBreakdown>([])
    const [selectedDayData, setSelectedDayData] = useState<DailyBreakdown | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Helper to format date reliably to YYYY-MM-DD
    const formatDateStr = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    }

    useEffect(() => {
        const fetchChartData = async () => {
            const today = new Date()
            let start = new Date()
            let end = today

            switch (period) {
                case '7days':
                    start.setDate(today.getDate() - 6)
                    break
                case '30days':
                    start.setDate(today.getDate() - 29)
                    break
                case 'thisMonth':
                    start = new Date(today.getFullYear(), today.getMonth(), 1)
                    break
                case 'prevMonth':
                    start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                    end = new Date(today.getFullYear(), today.getMonth(), 0) // Last day of prev month
                    break
            }

            const data = await getWeeklyBreakdown(formatDateStr(start), formatDateStr(end))
            setChartData(data)
        }
        
        fetchChartData()
        // Re-fetch when activeSession toggles (start/stop) to reflect the new tracked time in the chart
    }, [period, activeSession, getWeeklyBreakdown])

    const handleDayClick = async (dateStr: string) => {
        const data = await getDailyBreakdown(dateStr)
        setSelectedDayData(data)
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <TimeTracker 
                categories={categories}
                activeSession={activeSession}
                elapsedSeconds={elapsedSeconds}
                onStart={startSession}
                onStop={stopSession}
                onAddCategory={(name, color, icon) => addCategory({ name, color, icon })}
                onDeleteCategory={deleteCategory}
            />

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        <h3 className="text-sm font-bold">Time Analysis</h3>
                    </div>

                    <div className="flex p-1 bg-slate-900 rounded-lg">
                        {[
                            { id: '7days', label: '7 Days' },
                            { id: '30days', label: '30 Days' },
                            { id: 'thisMonth', label: 'This Month' },
                            { id: 'prevMonth', label: 'Last Month' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setPeriod(tab.id as any)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                    period === tab.id 
                                        ? 'bg-slate-700 text-white shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Make it dark-themed container instead of white since the rest of the app is dark */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                    {/* The TimeLineChart renders with a white background inside it, but we can wrap it */}
                    {/* We should also modify TimeLineChart slightly to adapt to dark mode but I'll let it be for now */}
                    <div className="dark-chart-wrapper">
                        <TimeLineChart 
                            breakdown={chartData}
                            categories={categories}
                            onDayClick={handleDayClick}
                        />
                    </div>
                </div>
            </div>

            <DayDetailModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                dailyData={selectedDayData}
                categories={categories}
            />
        </div>
    )
}
