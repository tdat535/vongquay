import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import type { WheelSegment, PrizeType } from '../types'

const SEGMENTS: WheelSegment[] = [
  { label: 'Voucher 10% + Áo đồng phục + Balo', shortLabel: 'VOUCHER 10%\n+ ÁO + BALO', color: '#059669', prizeType: 'voucher10' },
  { label: 'Voucher giảm học phí 5%', shortLabel: 'VOUCHER 5%', color: '#0284C7', prizeType: 'voucher5' },
  { label: 'Giải Đặc Biệt\n1,000,000đ + Voucher 10%', shortLabel: 'GIẢI\nĐẶC BIỆT', color: '#B45309', prizeType: 'special' },
  { label: 'Voucher giảm học phí 5%', shortLabel: 'VOUCHER 5%', color: '#0284C7', prizeType: 'voucher5' },
  { label: 'Voucher 10% + Áo đồng phục + Balo', shortLabel: 'VOUCHER 10%\n+ ÁO + BALO', color: '#059669', prizeType: 'voucher10' },
  { label: 'Voucher giảm học phí 5%', shortLabel: 'VOUCHER 5%', color: '#0284C7', prizeType: 'voucher5' },
  { label: 'Voucher 10% + Áo đồng phục + Balo', shortLabel: 'VOUCHER 10%\n+ ÁO + BALO', color: '#059669', prizeType: 'voucher10' },
  { label: 'Voucher 10% + Áo đồng phục + Balo', shortLabel: 'VOUCHER 10%\n+ ÁO + BALO', color: '#059669', prizeType: 'voucher10' },
]

const NUM_SEGMENTS = SEGMENTS.length
const SEGMENT_ANGLE = (2 * Math.PI) / NUM_SEGMENTS
const RAD_TO_DEG = 180 / Math.PI

export function getSegmentIndex(prizeType: PrizeType): number {
  const candidates = SEGMENTS.map((seg, i) => ({ i, seg })).filter(s => s.seg.prizeType === prizeType)
  return candidates[Math.floor(Math.random() * candidates.length)].i
}

export const PRIZE_META: Record<PrizeType, { label: string; color: string }> = {
  special: { label: 'Giải Đặc Biệt: 1,000,000đ + Voucher 10%', color: '#B45309' },
  voucher10: { label: 'Voucher 10% + Áo đồng phục + Balo', color: '#059669' },
  voucher5: { label: 'Voucher giảm học phí 5%', color: '#0284C7' },
}

export interface SpinWheelHandle {
  spin: (targetIndex: number) => void
}

interface Props {
  onSpinEnd?: (segmentIndex: number) => void
}

const SpinWheel = forwardRef<SpinWheelHandle, Props>(({ onSpinEnd }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef(0)
  const rafRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = canvas.clientWidth
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 16

    ctx.clearRect(0, 0, size, size)

    // Outer glow ring
    const gg = ctx.createRadialGradient(cx, cy, radius - 10, cx, cy, radius + 30)
    gg.addColorStop(0, 'rgba(200,164,92,0)')
    gg.addColorStop(0.7, 'rgba(200,164,92,0)')
    gg.addColorStop(0.85, 'rgba(200,164,92,0.04)')
    gg.addColorStop(1, 'rgba(200,164,92,0.15)')
    ctx.beginPath(); ctx.arc(cx, cy, radius + 30, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill()

    // Outer shadow ring
    const sg = ctx.createRadialGradient(cx, cy, radius - 8, cx, cy, radius + 16)
    sg.addColorStop(0, 'rgba(0,0,0,0)')
    sg.addColorStop(0.7, 'rgba(0,0,0,0.1)')
    sg.addColorStop(1, 'rgba(0,0,0,0.35)')
    ctx.beginPath(); ctx.arc(cx, cy, radius + 16, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill()

    // Segments
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const a1 = i * SEGMENT_ANGLE - Math.PI / 2
      const a2 = a1 + SEGMENT_ANGLE

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, a1, a2)
      ctx.closePath()

      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      gr.addColorStop(0, lightenColor(SEGMENTS[i].color, 30))
      gr.addColorStop(1, SEGMENTS[i].color)
      ctx.fillStyle = gr; ctx.fill()

      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1.5; ctx.stroke()

      const mid = a1 + SEGMENT_ANGLE / 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(mid)
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.lineWidth = 0.5
      ctx.font = `600 ${Math.max(10, size * 0.036)}px Outfit, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const lines = SEGMENTS[i].shortLabel.split('\n')
      const lh = Math.max(11, size * 0.045)
      for (let j = 0; j < lines.length; j++) {
        const off = (j - (lines.length - 1) / 2) * lh
        ctx.fillText(lines[j], radius * 0.58, off)
        ctx.strokeText(lines[j], radius * 0.58, off)
      }
      ctx.restore()
    }

    // Gold rings
    ctx.strokeStyle = 'rgba(200,164,92,0.25)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke()

    ctx.strokeStyle = 'rgba(200,164,92,0.15)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(cx, cy, radius * 0.24, 0, Math.PI * 2); ctx.stroke()

    // Hub
    const hg = ctx.createRadialGradient(cx - 4, cy - 4, 0, cx, cy, radius * 0.2)
    hg.addColorStop(0, '#2A2E3A'); hg.addColorStop(1, '#0B0E17')
    ctx.beginPath(); ctx.arc(cx, cy, radius * 0.2, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill()

    ctx.strokeStyle = 'rgba(200,164,92,0.4)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(cx, cy, radius * 0.2, 0, Math.PI * 2); ctx.stroke()

    const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.2)
    ig.addColorStop(0, 'rgba(200,164,92,0.08)'); ig.addColorStop(1, 'rgba(200,164,92,0)')
    ctx.beginPath(); ctx.arc(cx, cy, radius * 0.2, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill()
  }, [])

  useImperativeHandle(ref, () => ({
    spin(targetIndex: number) {
      // CSS rotate is CW. Canvas rotate was CCW.
      // Segment center at segCenter radians CCW from top.
      // To bring it under the fixed top pointer with CSS CW rotation:
      // We need to rotate CW by segCenter degrees.
      const segCenterRad = targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
      const targetDeg = segCenterRad * RAD_TO_DEG
      const extraSpins = 10 + Math.floor(Math.random() * 4)
      const fullSpinsDeg = extraSpins * 360

      const startDeg = rotRef.current
      // Add full spins + target, but subtract any partial progress already done
      const totalDeg = startDeg + fullSpinsDeg + targetDeg - (startDeg % 360)

      const delta = totalDeg - startDeg
      const t0 = performance.now()
      const duration = 8000 + Math.random() * 1000

      function step(now: number) {
        const p = Math.min((now - t0) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        const current = startDeg + delta * eased
        rotRef.current = current

        const wrapper = canvasRef.current?.parentElement
        if (wrapper) wrapper.style.transform = `rotate(${current}deg)`

        if (p < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          rotRef.current = current % 360
          const w = canvasRef.current?.parentElement
          if (w) w.style.transform = `rotate(${rotRef.current}deg)`
          onSpinEnd?.(targetIndex)
        }
      }

      rafRef.current = requestAnimationFrame(step)
    }
  }), [onSpinEnd])

  useEffect(() => {
    draw()
    const onResize = () => draw()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [draw])

  return (
    <div className="relative inline-flex items-center justify-center select-none">
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
        <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[34px] border-l-transparent border-r-transparent border-t-gold" />
      </div>
      <div className="will-change-transform" style={{ transform: 'rotate(0deg)' }}>
        <canvas
          ref={canvasRef}
          className="w-[580px] h-[580px] max-w-[88vw] max-h-[88vw] drop-shadow-2xl"
        />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[84px] h-[84px] rounded-full bg-gradient-to-br from-[#1E2230] to-[#0B0E17] border-[2px] border-gold/40 flex items-center justify-center z-10 shadow-[0_0_32px_rgba(200,164,92,0.12)] pointer-events-none p-2.5">
        <img src="/logo.png" alt="VIỄN ĐÔNG" className="w-full h-full object-contain" />
      </div>
    </div>
  )
})

SpinWheel.displayName = 'SpinWheel'

export { SEGMENTS, SEGMENT_ANGLE, NUM_SEGMENTS }
export default SpinWheel

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (num >> 16) + Math.round(255 * percent / 100))
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * percent / 100))
  const b = Math.min(255, (num & 0x0000FF) + Math.round(255 * percent / 100))
  return `rgb(${r},${g},${b})`
}
