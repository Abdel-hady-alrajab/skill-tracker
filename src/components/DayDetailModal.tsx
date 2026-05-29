'use client'

import React, { useEffect } from 'react'
import TimePieChart from './TimePieChart'
import { DailyBreakdown } from '@/app/hooks/useTimeSessions'
import { TimeCategory } from '@/app/hooks/useTimeCategories'

interface DayDetailModalProps {
    isOpen: boolean
    onClose: () => void
    dailyData: DailyBreakdown | null
    categories: TimeCategory[]
}

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

export default function DayDetailModal({ isOpen, onClose, dailyData, categories }: DayDetailModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown)
            // Prevent body scroll
            document.body.style.overflow = 'hidden'
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'auto'
        }
    }, [isOpen, onClose])

    if (!isOpen || !dailyData) return null

    // Safe date parsing to avoid timezone shift
    const [y, m, d] = dailyData.date.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    
    const formattedDate = dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    // Prepare breakdown for pie chart
    const pieBreakdown: Record<string, number> = { ...dailyData.byCategory }
    if (dailyData.wastedSeconds > 0) {
        pieBreakdown['wasted'] = dailyData.wastedSeconds
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden flex flex-col max-h-[90vh] transform transition-all"
                onClick={e => e.stopPropagation()} // prevent click from closing modal
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">{formattedDate}</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {/* Pie Chart */}
                    <div className="mb-8 h-64">
                        <TimePieChart 
                            breakdown={pieBreakdown}
                            categories={categories}
                            date={dateObj}
                        />
                    </div>

                    {/* Breakdown List */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                            Daily Breakdown
                        </h3>
                        
                        {Object.entries(dailyData.byCategory)
                            .filter(([_, secs]) => secs > 0)
                            .sort((a, b) => b[1] - a[1]) // highest time first
                            .map(([catId, seconds]) => {
                                const category = categories.find(c => c.id === catId)
                                if (!category) return null
                                return (
                                    <div key={catId} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-3.5 h-3.5 rounded-full shadow-sm" 
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <span className="font-semibold text-slate-700">
                                                {category.icon} {category.name}
                                            </span>
                                        </div>
                                        <span className="font-bold text-slate-700">
                                            {formatDuration(seconds)}
                                        </span>
                                    </div>
                                )
                        })}

                        {/* Wasted Time */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50/50 mt-4">
                            <div className="flex items-center gap-3">
                                <div className="w-3.5 h-3.5 rounded-full bg-slate-300 shadow-sm" />
                                <span className="font-semibold text-red-500">Wasted Time</span>
                            </div>
                            <span className="font-bold text-red-600">
                                {formatDuration(dailyData.wastedSeconds)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
