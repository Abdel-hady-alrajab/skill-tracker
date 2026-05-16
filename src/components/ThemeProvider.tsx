'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
    theme: 'dark',
    toggle: () => {},
})

export function useTheme() {
    return useContext(ThemeContext)
}

function applyTheme(t: Theme) {
    if (t === 'light') {
        document.documentElement.classList.add('light')
    } else {
        document.documentElement.classList.remove('light')
    }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark')

    useEffect(() => {
        const saved = (localStorage.getItem('theme') as Theme) ?? 'dark'
        setTheme(saved)
        applyTheme(saved)
    }, [])

    function toggle() {
        setTheme(prev => {
            const next: Theme = prev === 'dark' ? 'light' : 'dark'
            localStorage.setItem('theme', next)
            applyTheme(next)
            return next
        })
    }

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    )
}
