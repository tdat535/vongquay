import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { PrizeType } from '../types'

interface Props {
  prizeType: PrizeType
  prizeName: string
  studentName: string
  onClose: () => void
}

const THEMES: Record<PrizeType, { border: string; badge: string; label: string; button: string; glow: string }> = {
  special: {
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    label: 'text-amber-700',
    button: 'bg-gradient-to-b from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 shadow-[0_4px_20px_rgba(217,119,6,0.2)]',
    glow: 'bg-amber-400/20',
  },
  voucher10: {
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    label: 'text-emerald-700',
    button: 'bg-black/[0.05] text-[#1C1C1E] hover:bg-black/[0.08] border border-black/[0.08]',
    glow: 'bg-emerald-400/15',
  },
  voucher5: {
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    label: 'text-sky-700',
    button: 'bg-black/[0.05] text-[#1C1C1E] hover:bg-black/[0.08] border border-black/[0.08]',
    glow: 'bg-sky-400/15',
  },
}

const TITLES: Record<PrizeType, string> = {
  special: 'GIẢI ĐẶC BIỆT',
  voucher10: 'VOUCHER 10% + ÁO + BALO',
  voucher5: 'VOUCHER 5%',
}

export default function ResultScreen({ prizeType, prizeName, studentName, onClose }: Props) {
  const theme = THEMES[prizeType]
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    const gold = ['#C8A45C', '#E8CC8A', '#FFD700', '#A8883B', '#FFF8DC']
    const end = Date.now() + 5000

    function frame() {
      if (Date.now() > end) return
      confetti({ particleCount: 3, angle: 50, spread: 100, origin: { x: 0, y: 0.5 }, colors: gold, gravity: 0.8, scalar: 1.2 })
      confetti({ particleCount: 3, angle: 130, spread: 100, origin: { x: 1, y: 0.5 }, colors: gold, gravity: 0.8, scalar: 1.2 })
      requestAnimationFrame(frame)
    }
    frame()

    setTimeout(() => {
      confetti({ particleCount: 80, spread: 120, origin: { x: 0.5, y: 0.3 }, colors: gold, gravity: 0.6, scalar: 1.4 })
    }, 150)

    setTimeout(() => {
      confetti({ particleCount: 60, spread: 90, origin: { x: 0.5, y: 0.4 }, colors: gold, gravity: 0.5, scalar: 1.6 })
    }, 600)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Glow */}
        <div className={`absolute -inset-12 rounded-full blur-[100px] ${theme.glow} pointer-events-none`} />

        <div className={`relative rounded-3xl p-8 text-center border ${theme.border} bg-white shadow-xl`}>
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#A1A1A6] hover:text-[#6E6E73] hover:bg-black/[0.04] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Winner */}
          <div className="mb-5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium tracking-widest uppercase ${theme.badge}`}>
              Người chiến thắng
            </span>
            <h3 className="text-[#1C1C1E] text-2xl font-semibold tracking-tight mt-4">
              {studentName}
            </h3>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
            <div className={`w-2 h-2 rotate-45 ${prizeType === 'special' ? 'bg-amber-500' : 'bg-black/20'}`} />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
          </div>

          {/* Prize */}
          <div className="mb-8">
            <p className={`text-sm font-bold tracking-wide mb-1 ${theme.label}`}>
              {TITLES[prizeType]}
            </p>
            <p className="text-[#A1A1A6] text-xs">{prizeName}</p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all active:scale-[0.98] ${theme.button}`}
          >
            {prizeType === 'special' ? 'QUAY TIẾP' : 'Quay tiếp'}
          </button>
        </div>
      </div>
    </div>
  )
}
