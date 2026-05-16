'use client'

interface DeadlineBarProps {
    deadline: string | null
    daysLeft: number
    paceNeeded: number
    unit: string
    done: boolean
    onRemove: () => void
    onSetDeadline: () => void
}

export default function DeadlineBar({
    deadline,
    daysLeft,
    paceNeeded,
    unit,
    done,
    onRemove,
    onSetDeadline,
}: DeadlineBarProps) {
    if (!deadline) {
        return (
            <button
                onClick={onSetDeadline}
                className="text-blue-400 hover:text-blue-300 text-xs font-mono transition-colors"
            >
                + Set deadline
            </button>
        )
    }

    const overdue = !done && daysLeft < 0

    const barCls = done
        ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
        : overdue
            ? 'border-red-500/40 bg-red-500/10 text-red-400'
            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'

    const daysText = done
        ? 'Completed! 🎉'
        : overdue
            ? `${Math.abs(daysLeft)} days overdue`
            : `${daysLeft} days left`

    const dateLabel = new Date(deadline).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    })

    return (
        <div className={`flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-lg border text-xs font-mono ${barCls}`}>
            <div>
                <span className="font-bold">{daysText}</span>
                {' · '}
                <span className="text-slate-400">{dateLabel}</span>
            </div>
            <div className="flex items-center gap-3">
                {!done && (
                    <span className="text-slate-400">
                        Need {paceNeeded.toFixed(1)} {unit}/day
                    </span>
                )}
                <button
                    onClick={onRemove}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
