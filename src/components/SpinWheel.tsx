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

export function getSegmentIndex(prizeType: PrizeType): number {
  const candidates = SEGMENTS
    .map((seg, i) => ({ i, seg }))
    .filter(s => s.seg.prizeType === prizeType)
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
  const rotationRef = useRef(0)
  const animFrameRef = useRef<number>(0)

  const drawWheel = useCallback((rotation: number) => {
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
    const glowGrad = ctx.createRadialGradient(cx, cy, radius - 10, cx, cy, radius + 30)
    glowGrad.addColorStop(0, 'rgba(200,164,92,0)')
    glowGrad.addColorStop(0.7, 'rgba(200,164,92,0)')
    glowGrad.addColorStop(0.85, 'rgba(200,164,92,0.04)')
    glowGrad.addColorStop(1, 'rgba(200,164,92,0.15)')
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 30, 0, 2 * Math.PI)
    ctx.fillStyle = glowGrad
    ctx.fill()

    // Outer shadow ring
    const shadowGrad = ctx.createRadialGradient(cx, cy, radius - 8, cx, cy, radius + 16)
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0)')
    shadowGrad.addColorStop(0.7, 'rgba(0,0,0,0.1)')
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0.35)')
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 16, 0, 2 * Math.PI)
    ctx.fillStyle = shadowGrad
    ctx.fill()

    // Segments
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const startAngle = rotation + i * SEGMENT_ANGLE - Math.PI / 2
      const endAngle = startAngle + SEGMENT_ANGLE

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()

      const segGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      segGrad.addColorStop(0, lightenColor(SEGMENTS[i].color, 30))
      segGrad.addColorStop(1, SEGMENTS[i].color)
      ctx.fillStyle = segGrad
      ctx.fill()

      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Text
      const midAngle = startAngle + SEGMENT_ANGLE / 2

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(midAngle)

      ctx.fillStyle = '#fff'
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.lineWidth = 0.5
      ctx.font = `600 ${Math.max(10, size * 0.036)}px Outfit, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const lines = SEGMENTS[i].shortLabel.split('\n')
      const lineHeight = Math.max(11, size * 0.045)
      const textRadius = radius * 0.58

      for (let j = 0; j < lines.length; j++) {
        const offset = (j - (lines.length - 1) / 2) * lineHeight
        ctx.fillText(lines[j], textRadius, offset)
        ctx.strokeText(lines[j], textRadius, offset)
      }

      ctx.restore()
    }

    // Gold ring outer
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(200,164,92,0.25)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Gold ring mid
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.24, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(200,164,92,0.15)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Center hub — polished brass look
    const hubGrad = ctx.createRadialGradient(cx - 4, cy - 4, 0, cx, cy, radius * 0.2)
    hubGrad.addColorStop(0, '#2A2E3A')
    hubGrad.addColorStop(1, '#0B0E17')
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.2, 0, 2 * Math.PI)
    ctx.fillStyle = hubGrad
    ctx.fill()

    ctx.strokeStyle = 'rgba(200,164,92,0.4)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Hub inner glow
    const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.2)
    innerGlow.addColorStop(0, 'rgba(200,164,92,0.08)')
    innerGlow.addColorStop(1, 'rgba(200,164,92,0)')
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.2, 0, 2 * Math.PI)
    ctx.fillStyle = innerGlow
    ctx.fill()
  }, [])

  const animateTo = useCallback((targetSegment: number, callback: () => void) => {
    const extraSpins = 10 + Math.floor(Math.random() * 4)
    const segmentCenter = targetSegment * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
    const landingAngle = 2 * Math.PI - segmentCenter
    const totalRotation = extraSpins * 2 * Math.PI + landingAngle
    const startRotation = rotationRef.current
    const totalDelta = totalRotation - (startRotation % (2 * Math.PI))
    let startTime: number | null = null

    function easeOutExpo(t: number): number {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    }

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const duration = 7000 + Math.random() * 1000
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutExpo(progress)

      rotationRef.current = startRotation + totalDelta * eased
      drawWheel(rotationRef.current)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        rotationRef.current = rotationRef.current % (2 * Math.PI)
        callback()
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }, [drawWheel])

  useImperativeHandle(ref, () => ({
    spin(targetIndex: number) {
      animateTo(targetIndex, () => {
        onSpinEnd?.(targetIndex)
      })
    }
  }), [animateTo, onSpinEnd])

  useEffect(() => {
    drawWheel(rotationRef.current)

    const handleResize = () => drawWheel(rotationRef.current)
    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [drawWheel])

  return (
    <div className="relative inline-flex items-center justify-center select-none">
      {/* Pointer */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
        <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[34px] border-l-transparent border-r-transparent border-t-gold" />
      </div>
      <canvas
        ref={canvasRef}
        className="w-[580px] h-[580px] max-w-[88vw] max-h-[88vw] drop-shadow-2xl"
      />
      {/* Center mark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[84px] h-[84px] rounded-full bg-gradient-to-br from-[#1E2230] to-[#0B0E17] border-[2px] border-gold/40 flex items-center justify-center z-10 shadow-[0_0_32px_rgba(200,164,92,0.12)] pointer-events-none">
        <div className="text-center leading-tight">
          <div className="text-gold text-[11px] font-semibold tracking-[0.15em]">VIỄN</div>
          <div className="text-gold text-[11px] font-semibold tracking-[0.15em]">ĐÔNG</div>
        </div>
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
