import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Prize {
  name: string
  display_name: string
  remaining: number
  total: number
}

export function usePrizes(refreshKey: number) {
  const [prizes, setPrizes] = useState<Prize[]>([])
  useEffect(() => {
    supabase.from('prizes').select('*').then(res => {
      if (res.data) setPrizes(res.data)
    })
  }, [refreshKey])
  return prizes
}

export function useStats(refreshKey: number) {
  const [stats, setStats] = useState({ students: 0, spun: 0 })
  useEffect(() => {
    Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('spins').select('*', { count: 'exact', head: true }),
    ]).then(([sRes, spRes]) => {
      setStats({
        students: sRes.count ?? 0,
        spun: spRes.count ?? 0,
      })
    })
  }, [refreshKey])
  return stats
}
