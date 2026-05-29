'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useTimeCategories } from '@/app/hooks/useTimeCategories'
import { useTimeSessions } from '@/app/hooks/useTimeSessions'

type TimeCategoriesReturn = ReturnType<typeof useTimeCategories>
type TimeSessionsReturn = ReturnType<typeof useTimeSessions>

interface TimeTrackerContextValue {
    categoriesData: TimeCategoriesReturn
    sessionsData: TimeSessionsReturn
}

const TimeTrackerContext = createContext<TimeTrackerContextValue | null>(null)

export function TimeTrackerProvider({ userId, children }: { userId: string, children: ReactNode }) {
    const categoriesData = useTimeCategories(userId)
    const sessionsData = useTimeSessions(userId)

    return (
        <TimeTrackerContext.Provider value={{ categoriesData, sessionsData }}>
            {children}
        </TimeTrackerContext.Provider>
    )
}

export function useTimeTracker() {
    const context = useContext(TimeTrackerContext)
    if (!context) {
        throw new Error('useTimeTracker must be used within a TimeTrackerProvider')
    }
    return context
}
