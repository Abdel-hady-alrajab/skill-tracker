'use client'

interface CoinShopProps {
    coins: number
    freezes: number
    boosterLeft: number
    deadlineUnlocked: boolean
    onBuyFreeze: () => Promise<boolean>
    onBuyBooster: () => Promise<boolean>
    onBuyDeadline: () => Promise<boolean>
    onOpenDeadlineModal: () => void
    onToast?: (msg: string) => void
}

export default function CoinShop({
    coins,
    freezes,
    boosterLeft,
    deadlineUnlocked,
    onBuyFreeze,
    onBuyBooster,
    onBuyDeadline,
    onOpenDeadlineModal,
    onToast,
}: CoinShopProps) {
    async function handleBuyFreeze() {
        const ok = await onBuyFreeze()
        if (ok) onToast?.('🧊 Streak Freeze purchased! Your streak is protected for 1 missed day.')
    }

    async function handleBuyBooster() {
        const ok = await onBuyBooster()
        if (ok) onToast?.('⚡ XP Booster active! Next 5 increments earn double coins.')
    }

    async function handleDeadlineBtn() {
        if (deadlineUnlocked) {
            onOpenDeadlineModal()
            return
        }
        const ok = await onBuyDeadline()
        if (ok) {
            onToast?.('📅 Deadline Tracker unlocked! Set deadlines on any skill card.')
            onOpenDeadlineModal()
        }
    }

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-950/30">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <span className="text-sm font-bold flex items-center gap-1.5 hover:scale-105 transition-transform duration-300 cursor-default">
                    🏪 <span className="bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent font-extrabold">Coin Shop</span>
                </span>
                <span className="text-xs font-mono text-slate-400  px-2.5 py-1 rounded-full border border-slate-750">
                    Balance: <b className="text-amber-400 animate-pulse">{coins}</b> 🪙
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Streak Freeze */}
                <div className="bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded-xl p-4 flex flex-col gap-2 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) hover:scale-[1.01] hover:shadow-[0_10px_25px_-5px_rgba(245,158,11,0.15)] group">
                    <div className="text-3xl leading-none transition-all duration-500 ease-out group-hover:scale-115 cursor-default">🧊</div>
                    <div className="text-sm font-bold transition-colors group-hover:text-amber-400">Streak Freeze</div>
                    <div className="text-xs text-slate-400 leading-relaxed flex-1">
                        Protects your streak for one missed day. Activates automatically when you skip a day. Max 2 stored.
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-mono font-bold text-amber-400">10 🪙</span>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-mono text-slate-500">{freezes} / 2 owned</span>
                            <button
                                onClick={handleBuyFreeze}
                                disabled={freezes >= 2 || coins < 10}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:active:scale-100 text-slate-900 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                            >
                                Buy
                            </button>
                        </div>
                    </div>
                </div>

                {/* XP Booster */}
                <div className="bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded-xl p-4 flex flex-col gap-2 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) hover:scale-[1.01] hover:shadow-[0_10px_25px_-5px_rgba(245,158,11,0.15)] group">
                    <div className="text-3xl leading-none transition-all duration-500 ease-out group-hover:scale-115 group-hover:animate-pulse cursor-default">⚡</div>
                    <div className="text-sm font-bold transition-colors group-hover:text-amber-400">XP Booster</div>
                    <div className="text-xs text-slate-400 leading-relaxed flex-1">
                        Next 5 increments earn double coins. Stack up during heavy study sessions.
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-mono font-bold text-amber-400">25 🪙</span>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-mono text-slate-500">
                                {boosterLeft > 0 ? `${boosterLeft} left` : 'inactive'}
                            </span>
                            <button
                                onClick={handleBuyBooster}
                                disabled={boosterLeft > 0 || coins < 25}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:active:scale-100 text-slate-900 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                            >
                                Buy
                            </button>
                        </div>
                    </div>
                </div>

                {/* Deadline Tracker */}
                <div className="bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded-xl p-4 flex flex-col gap-2 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) hover:scale-[1.01] hover:shadow-[0_10px_25px_-5px_rgba(245,158,11,0.15)] group">
                    <div className="text-3xl leading-none transition-all duration-500 ease-out group-hover:scale-115 cursor-default">📅</div>
                    <div className="text-sm font-bold transition-colors group-hover:text-amber-400">Deadline Tracker</div>
                    <div className="text-xs text-slate-400 leading-relaxed flex-1">
                        Set a finish date on any skill. Shows days left and daily pace needed. Turns red if you&apos;re falling behind.
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-mono font-bold text-amber-400">20 🪙</span>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-mono text-slate-500">
                                {deadlineUnlocked ? 'unlocked ✓' : 'locked'}
                            </span>
                            <button
                                onClick={handleDeadlineBtn}
                                disabled={!deadlineUnlocked && coins < 20}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:active:scale-100 text-slate-900 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                            >
                                {deadlineUnlocked ? 'Set Deadline' : 'Buy'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
