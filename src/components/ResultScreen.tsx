import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { PrizeType } from '../types'

interface Props {
  prizeType: PrizeType
  prizeName: string
  studentName: string
  onClose: () => void
}

const THEME: Record <
  PrizeType,
  { accent: string; accentLight: string; accentDeep: string; ring: string; label: string }
> = {
  special: {
    accent: '#E8B54D',
    accentLight: '#FFE9AE',
    accentDeep: '#7A5A1E',
    ring: 'rgba(232,181,77,0.35)',
    label: 'Giải Đặc Biệt',
  },
  voucher10: {
    accent: '#3FD9A4',
    accentLight: '#B8F5DE',
    accentDeep: '#0F5C43',
    ring: 'rgba(63,217,164,0.3)',
    label: 'Voucher 10% + Áo + Balo',
  },
  voucher5: {
    accent: '#6FC3FF',
    accentLight: '#C7E8FF',
    accentDeep: '#134D75',
    ring: 'rgba(111,195,255,0.3)',
    label: 'Voucher 5%',
  },
}

// Chuẩn hoá về NFC: gộp base-letter + các dấu rời (combining marks) thành
// 1 ký tự Unicode đã ghép sẵn. Sửa lỗi dấu bị tách thành ký tự backtick/rời
// khi dữ liệu gốc (DB, Excel, macOS...) lưu dạng NFD.
const vn = (s: string) => s.normalize('NFC')

// Dùng 1 font stack DUY NHẤT, có hỗ trợ tiếng Việt đầy đủ, cho toàn bộ text
// trong component — không để bất kỳ chỗ nào rơi về font mặc định của app
// (đó là lý do chữ hoa "CHIẾN" bị mất dấu ở bản trước).
const FONT_SANS = "'Inter', 'Be Vietnam Pro', 'Noto Sans', system-ui, -apple-system, sans-serif"
const FONT_SERIF = "Georgia, 'Times New Roman', 'Noto Serif', serif"

export default function ResultScreen({ prizeType, prizeName, studentName, onClose }: Props) {
  const t = THEME[prizeType]
  const fired = useRef(false)

  const safeName = vn(studentName)
  const safePrizeName = vn(prizeName)
  const safeLabel = vn(t.label)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const palette = [t.accent, t.accentLight, '#FFFFFF']

    if (reduceMotion) {
      confetti({ particleCount: 60, spread: 100, origin: { x: 0.5, y: 0.3 }, colors: palette })
      return
    }

    const end = Date.now() + 3600
    function f() {
      if (Date.now() > end) return
      confetti({ particleCount: 3, angle: 50, spread: 100, origin: { x: 0, y: 0.5 }, colors: palette, gravity: 0.8, scalar: 1.1 })
      confetti({ particleCount: 3, angle: 130, spread: 100, origin: { x: 1, y: 0.5 }, colors: palette, gravity: 0.8, scalar: 1.1 })
      requestAnimationFrame(f)
    }
    f()
    setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.5, y: 0.3 }, colors: palette, gravity: 0.6, scalar: 1.3 }), 150)
    setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { x: 0.5, y: 0.4 }, colors: palette, gravity: 0.5, scalar: 1.5 }), 600)
  }, [t])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0B10]/92 backdrop-blur-md animate-fade-in"
      style={{ fontFamily: FONT_SANS }}
    >
      <div
        className="pointer-events-none absolute w-[520px] h-[520px] rounded-full blur-[100px] opacity-40"
        style={{ background: t.accent }}
      />

      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/40 hover:text-white/80 transition-colors text-sm tracking-wide"
      >
        Đóng ✕
      </button>

      <div className="relative w-full max-w-sm px-6 animate-scale-in">
        <div
          className="relative rounded-2xl px-7 pb-7 pt-7"
          style={{
            background: 'linear-gradient(180deg, #1B1B24 0%, #131319 100%)',
            border: `1px solid ${t.ring}`,
            boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px -20px ${t.ring}`,
          }}
        >
          {[
            'top-3 left-3 border-t border-l',
            'top-3 right-3 border-t border-r',
            'bottom-3 left-3 border-b border-l',
            'bottom-3 right-3 border-b border-r',
          ].map((pos) => (
            <span key={pos} className={`absolute w-3 h-3 ${pos}`} style={{ borderColor: t.ring }} />
          ))}

          <div className="flex flex-col items-center -mt-16 mb-4">
            <div className="flex gap-1 -mb-2 z-0">
              <div
                className="w-4 h-12"
                style={{ background: t.accentDeep, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)' }}
              />
              <div
                className="w-4 h-12"
                style={{ background: t.accentDeep, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)' }}
              />
            </div>
            <div
              className="relative z-10 w-[72px] h-[72px] rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${t.accentLight}, ${t.accent} 55%, ${t.accentDeep} 100%)`,
                boxShadow: `0 0 0 4px #131319, 0 0 0 5px ${t.ring}, 0 8px 24px -6px ${t.ring}`,
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l2.4 6.6L21 9.3l-5.2 4.3L17.3 21 12 17l-5.3 4 1.5-7.4L3 9.3l6.6-.7L12 2z"
                  fill="#1B1B24"
                />
              </svg>
            </div>
          </div>

          {/* Không dùng CSS text-transform: uppercase nữa — viết hoa sẵn trong
              chuỗi + normalize NFC, để tránh việc uppercase làm rớt dấu tổ hợp
              trên một số trình duyệt. */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="h-px w-6" style={{ background: t.ring }} />
            <span
              className="text-[11px] font-medium tracking-[0.22em] whitespace-nowrap"
              style={{ color: t.accent, fontFamily: FONT_SANS }}
            >
              {vn('NGƯỜI CHIẾN THẮNG')}
            </span>
            <span className="h-px w-6" style={{ background: t.ring }} />
          </div>

          <h2
            className="text-center text-white text-[24px] leading-snug mb-6 break-words px-1"
            style={{ fontFamily: FONT_SERIF, fontWeight: 700 }}
          >
            {safeName}
          </h2>

          <div
            className="rounded-xl py-3 px-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${t.ring}` }}
          >
            <p className="text-sm font-semibold" style={{ color: t.accentLight, fontFamily: FONT_SANS }}>
              {safeLabel}
            </p>
            <p className="text-xs mt-0.5 text-white/40" style={{ fontFamily: FONT_SANS }}>
              {safePrizeName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-3 rounded-xl text-sm font-semibold text-[#131319] transition-transform active:scale-[0.98]"
            style={{ background: `linear-gradient(180deg, ${t.accentLight}, ${t.accent})`, fontFamily: FONT_SANS }}
          >
            {prizeType === 'special' ? '🎉 Quay tiếp' : 'Quay tiếp'}
          </button>
        </div>
      </div>
    </div>
  )
}