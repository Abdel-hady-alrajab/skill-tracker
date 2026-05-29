'use client'

import React, { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import { TimeCategory } from '@/app/hooks/useTimeCategories'

interface TimePieChartProps {
    breakdown: Record<string, number>
    categories: TimeCategory[]
    date: Date
}

function formatDuration(seconds: number) {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hrs > 0) {
        return `${hrs}h ${mins}m`
    }
    return `${mins}m`
}

export default function TimePieChart({ breakdown, categories, date }: TimePieChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<Chart | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return

        // Prepare data
        const labels: string[] = []
        const data: number[] = []
        const backgroundColors: string[] = []

        // Add tracked categories
        Object.entries(breakdown).forEach(([key, seconds]) => {
            if (key === 'wasted') return // handled later
            if (seconds <= 0) return

            const category = categories.find(c => c.id === key)
            if (category) {
                labels.push(`${category.icon || ''} ${category.name}`.trim())
                data.push(seconds)
                backgroundColors.push(category.color)
            }
        })

        // Add wasted time
        const wasted = breakdown['wasted'] || 0
        if (wasted > 0) {
            labels.push('Wasted')
            data.push(wasted)
            backgroundColors.push('#cbd5e1') // Tailwind slate-300
        }

        // Initialize or update chart
        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        if (chartRef.current) {
            chartRef.current.destroy()
        }

        chartRef.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor: backgroundColors,
                        borderWidth: 0,
                        hoverOffset: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const value = context.raw as number;
                                label += formatDuration(value);
                                return label;
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function(chart) {
                    const width = chart.width;
                    const height = chart.height;
                    const ctx = chart.ctx;

                    ctx.restore();
                    const fontSize = (height / 160).toFixed(2);
                    ctx.font = `600 ${fontSize}em Inter, sans-serif`;
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#64748b'; // Tailwind slate-500

                    const text = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    const textX = Math.round((width - ctx.measureText(text).width) / 2);
                    // Adjust Y to sit slightly above center due to legend at bottom
                    const textY = Math.round((height - chart.legend?.height!) / 2);

                    ctx.fillText(text, textX, textY);
                    ctx.save();
                }
            }]
        })

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy()
            }
        }
    }, [breakdown, categories, date])

    return (
        <div className="relative w-full h-64 flex items-center justify-center">
            {Object.keys(breakdown).length === 0 ? (
                <p className="text-slate-400">No data for this day</p>
            ) : (
                <canvas ref={canvasRef}></canvas>
            )}
        </div>
    )
}
