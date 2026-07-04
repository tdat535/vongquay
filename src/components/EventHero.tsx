import type { SpinWheelHandle } from './SpinWheel'
import SpinWheel from './SpinWheel'

interface Props {
  wheelRef: React.RefObject<SpinWheelHandle | null>
  spinning: boolean
  students: number
  spun: number
  onSpin: () => void
  onSpinEnd: () => void
}

export default function EventHero({ wheelRef, spinning, students, spun, onSpin, onSpinEnd }: Props) {
  const hasData = students > 0
  const allDone = hasData && spun >= students

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 w-full overflow-hidden">

      {/* Subtle warm gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Top-left branding */}
      <div className="absolute top-8 left-8 right-8 flex items-start justify-between z-10">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Viễn Đông"
            className="h-9 w-auto object-contain"
          />
          <div className="leading-tight">
            <p className="text-[#1C1C1E] text-sm font-semibold tracking-tight">Vòng Quay May Mắn</p>
            <p className="text-[#6E6E73] text-[10px] font-medium tracking-[0.15em] uppercase">Cao Đẳng Viễn Đông</p>
          </div>
        </div>
        {hasData && !allDone && (
          <div className="flex items-center gap-3 text-xs text-[#A1A1A6]">
            <span className="text-[#6E6E73]">{students} tham dự</span>
            <span className="w-1 h-1 rounded-full bg-black/10" />
            <span className="text-emerald-600/60">{spun} đã quay</span>
          </div>
        )}
      </div>

      {/* Wheel */}
      <div className="relative animate-wheel-entry mt-16 md:mt-0">
        <div className="absolute -inset-24 bg-gold/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <SpinWheel ref={wheelRef} onSpinEnd={onSpinEnd} />
      </div>

      {/* Spin area */}
      <div className="flex flex-col items-center gap-5 mt-8 md:mt-10">
        {allDone ? (
          <div className="text-center">
            <p className="text-emerald-600 text-lg font-medium">🎉 Tất cả đã quay xong</p>
            <p className="text-[#6E6E73] text-sm mt-1">Cảm ơn các bạn đã tham gia</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSpin}
            disabled={spinning || !hasData}
            className="spin-button-glow relative px-16 py-4 rounded-2xl bg-gradient-to-b from-gold to-gold-dark text-white font-semibold text-lg tracking-wide disabled:opacity-25 disabled:cursor-not-allowed hover:from-gold-light hover:to-gold transition-all active:scale-[0.97]"
          >
            <span className="relative z-10">
              {!hasData
                ? 'CHƯA CÓ DỮ LIỆU'
                : spinning
                  ? 'ĐANG QUAY...'
                  : 'QUAY NGẪU NHIÊN'}
            </span>
          </button>
        )}

        {hasData && !allDone && (
          <p className="text-[#A1A1A6] text-xs tracking-wide">
            Còn <span className="text-gold font-medium">{students - spun}</span> sinh viên chờ quay
          </p>
        )}
      </div>
    </section>
  )
}
