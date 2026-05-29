'use client'

import React, { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import { WeeklyBreakdown } from '@/app/hooks/useTimeSessions'
import { TimeCategory } from '@/app/hooks/useTimeCategories'

interface TimeLineChartProps {
    breakdown: WeeklyBreakdown
    categories: TimeCategory[]
    onDayClick: (dateStr: string) => void
}

export default function TimeLineChart({ breakdown, categories, onDayClick }: TimeLineChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<Chart | null>(null)

    useEffect(() => {
        if (!canvasRef.current || breakdown.length === 0) return

        // Extract dates (X-axis)
        const labels = breakdown.map(d => {
            // d.date is 'YYYY-MM-DD', but we must be careful with timezones.
            // Using split prevents timezone shifting.
            const [y, m, day] = d.date.split('-').map(Number)
            const date = new Date(y, m - 1, day)
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        })

        // Datasets
        const datasets: any[] = []

        // 1. A dataset for each category
        categories.forEach(category => {
            const data = breakdown.map(d => {
                const seconds = d.byCategory[category.id] || 0
                return seconds / 3600 // convert to hours
            })
            // Only add dataset if there's > 0 hours in this range
            if (data.some(h => h > 0)) {
                datasets.push({
                    label: `${category.icon || ''} ${category.name}`.trim(),
                    data,
                    borderColor: category.color,
                    backgroundColor: category.color,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                })
            }
        })

        // 2. Wasted time area/line
        const wastedData = breakdown.map(d => d.wastedSeconds / 3600)
        datasets.push({
            label: 'Wasted',
            data: wastedData,
            borderColor: '#cbd5e1', // slate-300
            backgroundColor: 'rgba(203, 213, 225, 0.2)', // light slate for area
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
        })

        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        if (chartRef.current) {
            chartRef.current.destroy()
        }

        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index
                        const clickedDateStr = breakdown[index].date
                        onDayClick(clickedDateStr)
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 24,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || ''
                                if (label) label += ': '
                                const value = context.raw as number
                                // convert hours back to h/m
                                const totalMins = Math.round(value * 60)
                                const h = Math.floor(totalMins / 60)
                                const m = totalMins % 60
                                if (h > 0) label += `${h}h ${m}m`
                                else label += `${m}m`
                                return label
                            }
                        }
                    }
                }
            }
        })

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy()
            }
        }
    }, [breakdown, categories, onDayClick])

    return (
        <div className="relative w-full h-[400px] bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            {breakdown.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-400">
                    No data available for this range
                </div>
            ) : (
                <canvas ref={canvasRef}></canvas>
            )}
        </div>
    )
}
