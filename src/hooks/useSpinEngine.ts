import { useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { SpinWheelHandle } from '../components/SpinWheel'
import { getSegmentIndex } from '../components/SpinWheel'
import type { PrizeType } from '../types'

interface PendingResult {
  name: string
  prizeType: PrizeType
  prizeName: string
}

interface SpinState {
  spinning: boolean
  noStudents: boolean
  error: string | null
  result: PendingResult | null
}

export default function useSpinEngine() {
  const wheelRef = useRef<SpinWheelHandle>(null)
  const pendingRef = useRef<PendingResult | null>(null)
  const [state, setState] = useState<SpinState>({
    spinning: false,
    noStudents: false,
    error: null,
    result: null,
  })
  const [refreshKey, setRefreshKey] = useState(0)

  const pick = useCallback(async () => {
    if (state.spinning) return

    setState(prev => ({ ...prev, error: null, noStudents: false, result: null }))
    pendingRef.current = null

    const { data: students, error: stuErr } = await supabase
      .from('students')
      .select('id, full_name')
    if (stuErr) { setState(prev => ({ ...prev, error: stuErr.message })); return }

    const { data: spins } = await supabase.from('spins').select('student_id')
    const spunSet = new Set((spins || []).map(s => s.student_id))
    const pending = (students || []).filter(s => !spunSet.has(s.id))

    if (pending.length === 0) {
      setState(prev => ({ ...prev, noStudents: true }))
      return
    }

    const pick = pending[Math.floor(Math.random() * pending.length)]
    setState(prev => ({ ...prev, spinning: true }))

    try {
      const { data, error: rpcError } = await supabase.rpc('perform_spin', {
        p_student_id: pick.id,
      })
      if (rpcError) throw new Error(rpcError.message)

      const result = data as { prize?: string; prizeType?: string; error?: string }
      if (result.error) throw new Error(result.error)

      const prizeType = result.prizeType as PrizeType
      const segmentIndex = getSegmentIndex(prizeType)

      pendingRef.current = {
        name: pick.full_name,
        prizeType,
        prizeName: result.prize || '',
      }

      wheelRef.current?.spin(segmentIndex)
    } catch (err) {
      setState(prev => ({
        ...prev,
        spinning: false,
        error: err instanceof Error ? err.message : 'Lỗi kết nối',
      }))
    }
  }, [state.spinning])

  const onSpinEnd = useCallback(() => {
    // Dramatic pause before revealing result
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        spinning: false,
        result: pendingRef.current,
      }))
      setRefreshKey(k => k + 1)
    }, 1500)
  }, [])

  const dismissResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      result: null,
    }))
    pendingRef.current = null
  }, [])

  return {
    ...state,
    refreshKey,
    wheelRef,
    pick,
    onSpinEnd,
    dismissResult,
  }
}
