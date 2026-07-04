import { usePrizes } from '../hooks/useData'

interface Props {
  refreshKey: number
}

const GRADIENTS: Record<string, string> = {
  special: 'from-amber-50 to-amber-100/50 border-amber-200',
  voucher10: 'from-emerald-50 to-emerald-100/50 border-emerald-200',
  voucher5: 'from-sky-50 to-sky-100/50 border-sky-200',
}

const ACCENTS: Record<string, string> = {
  special: 'bg-amber-500',
  voucher10: 'bg-emerald-500',
  voucher5: 'bg-sky-500',
}

export default function PrizeShowcase({ refreshKey }: Props) {
  const prizes = usePrizes(refreshKey)

  if (prizes.length === 0) return null

  return (
    <section className="w-full px-6 py-28 md:py-36">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="mb-14 text-center">
          <span className="inline-block text-[10px] font-medium tracking-[0.25em] text-[#A1A1A6] uppercase mb-3">
            Giải thưởng
          </span>
          <h2 className="text-[#1C1C1E] text-3xl md:text-4xl font-light tracking-tight">
            Danh sách giải thưởng
          </h2>
          <div className="w-12 h-px bg-gold/40 mx-auto mt-5" />
        </div>

        {/* Prize cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prizes.map((p, i) => {
            const key = p.name.replace('prize_', '')
            const bgClass = GRADIENTS[key] || 'from-gray-50 to-gray-100/50 border-gray-200'
            const dot = ACCENTS[key] || 'bg-gold'
            const pct = p.total > 0 ? (p.remaining / p.total) * 100 : 0

            return (
              <div
                key={p.name}
                className={`group relative rounded-2xl bg-gradient-to-br ${bgClass} p-6 transition-all duration-500 hover:shadow-sm`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Accent bar */}
                <div className={`w-8 h-0.5 rounded-full ${dot} mb-4 opacity-40`} />

                {/* Count */}
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-4xl font-light text-[#1C1C1E] tracking-tight">{p.remaining}</span>
                  <span className="text-sm text-[#A1A1A6]">/ {p.total}</span>
                </div>

                {/* Label */}
                <p className="text-[#6E6E73] text-sm font-medium leading-snug mb-4">
                  {p.display_name}
                </p>

                {/* Progress track */}
                <div className="h-px bg-black/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-gold/50 transition-all duration-1000 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
