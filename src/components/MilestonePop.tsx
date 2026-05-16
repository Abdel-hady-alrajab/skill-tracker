'use client'

import { useState, useCallback } from 'react'

interface MilestoneData {
    icon: string
    title: string
    sub: string
}

/** Hook that provides triggerMilestone() — call it to show the popup. */
export function useMilestone() {
    const [data, setData] = useState<MilestoneData | null>(null)
    const [visible, setVisible] = useState(false)

    const triggerMilestone = useCallback((icon: string, title: string, sub: string) => {
        setData({ icon, title, sub })
        setVisible(true)
        setTimeout(() => setVisible(false), 2800)
    }, [])

    return { data, visible, triggerMilestone }
}

interface MilestonePopProps {
    data: MilestoneData | null
    visible: boolean
}

export default function MilestonePop({ data, visible }: MilestonePopProps) {
    if (!data) return null

    return (
        <div
            className={`
                fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                bg-slate-800 border border-slate-700 rounded-2xl py-7 px-10
                text-center z-50 pointer-events-none
                transition-all duration-[250ms]
                ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
            `}
        >
            <div className="text-5xl leading-none mb-3">{data.icon}</div>
            <div className="text-lg font-extrabold mb-1">{data.title}</div>
            <div className="text-sm font-mono text-slate-400">{data.sub}</div>
        </div>
    )
}
