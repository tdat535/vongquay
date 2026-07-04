import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Student, SpinRecord } from '../types'

interface Props {
  refreshKey: number
}

type FilterTab = 'pending' | 'all' | 'done'

const PRIZE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  special: { label: 'ĐB', color: '#D97706', bg: '#FEF3C7' },
  voucher10: { label: 'V10', color: '#059669', bg: '#D1FAE5' },
  voucher5: { label: 'V5', color: '#0284C7', bg: '#E0F2FE' },
}

function Initials({ name, done }: { name: string; done: boolean }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
      done
        ? 'bg-black/[0.03] text-[#A1A1A6]'
        : 'bg-gold/10 text-gold'
    }`}>
      {letters}
    </div>
  )
}

function Pill({ done, prizeType }: { done: boolean; prizeType?: string }) {
  if (done && prizeType && PRIZE_BADGES[prizeType]) {
    const b = PRIZE_BADGES[prizeType]
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
        style={{ background: b.bg, color: b.color }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
        {b.label}
      </span>
    )
  }
  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-black/[0.03] text-[#A1A1A6]">
        <span className="w-1.5 h-1.5 rounded-full bg-black/10" />
        Đã quay
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-gold/8 text-gold/60">
      <span className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-pulse" />
      Chờ
    </span>
  )
}

export default function ParticipantList({ refreshKey }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [spins, setSpins] = useState<SpinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('pending')

  const load = useCallback(async () => {
    setLoading(true)
    const [stuRes, spinRes] = await Promise.all([
      supabase.from('students').select('*').order('full_name'),
      supabase.from('spins').select('*'),
    ])
    if (stuRes.data) setStudents(stuRes.data)
    if (spinRes.data) setSpins(spinRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [refreshKey, load])

  const spunSet = useMemo(() => new Set(spins.map(s => s.student_id)), [spins])
  const total = students.length
  const spun = spins.length
  const pending = total - spun

  const filtered = useMemo(() => {
    let list = students
    if (filter === 'pending') list = list.filter(s => !spunSet.has(s.id))
    else if (filter === 'done') list = list.filter(s => spunSet.has(s.id))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(s =>
        s.mssv.toLowerCase().includes(q) ||
        s.full_name.toLowerCase().includes(q)
      )
    }
    return list
  }, [students, spunSet, filter, search])

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-5 h-5 border-2 border-black/5 border-t-black/20 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <section className="w-full px-6 py-28 md:py-36">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="mb-14 text-center">
          <span className="inline-block text-[10px] font-medium tracking-[0.25em] text-[#A1A1A6] uppercase mb-3">
            Tham dự
          </span>
          <h2 className="text-[#1C1C1E] text-3xl md:text-4xl font-light tracking-tight">
            Sinh viên tham dự
          </h2>
          <div className="w-12 h-px bg-gold/40 mx-auto mt-5" />
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white border border-black/[0.06] overflow-hidden shadow-sm">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.04]">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A1A1A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc MSSV..."
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.06] text-[#1C1C1E] text-sm placeholder-[#A1A1A6] focus:outline-none focus:border-black/[0.15] focus:bg-black/[0.03] transition-all"
              />
            </div>
            <div className="flex gap-1 bg-black/[0.02] rounded-lg p-0.5 border border-black/[0.04]">
              {(['pending', 'all', 'done'] as FilterTab[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1.5 rounded-[7px] text-xs font-medium transition-all ${
                    filter === t
                      ? 'bg-gold/12 text-gold shadow-sm'
                      : 'text-[#A1A1A6] hover:text-[#6E6E73]'
                  }`}
                >
                  {t === 'pending' ? 'Chờ' : t === 'done' ? 'Đã quay' : 'Tất cả'}
                </button>
              ))}
            </div>
          </div>

          {/* Counter */}
          <div className="flex items-center gap-4 px-5 py-2.5 border-b border-black/[0.02]">
            <span className="text-xs text-[#A1A1A6]">
              <span className="text-[#6E6E73] font-medium">{total}</span> tham dự
            </span>
            <span className="w-1 h-1 rounded-full bg-black/5" />
            <span className="text-xs text-[#A1A1A6]">
              <span className="text-emerald-600/60 font-medium">{spun}</span> đã quay
            </span>
            <span className="w-1 h-1 rounded-full bg-black/5" />
            <span className="text-xs text-[#A1A1A6]">
              <span className="text-gold/70 font-medium">{pending}</span> chờ
            </span>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              {total === 0 ? (
                <>
                  <p className="text-[#A1A1A6] text-sm">Chưa có dữ liệu</p>
                  <p className="text-[#A1A1A6]/50 text-xs mt-1">Import dữ liệu từ menu cài đặt</p>
                </>
              ) : (
                <p className="text-[#A1A1A6] text-sm">
                  {filter === 'pending' ? '🎉 Tất cả đã quay xong' : 'Không tìm thấy'}
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-black/[0.02]">
              {filtered.map(s => {
                const done = spunSet.has(s.id)
                const rec = spins.find(sp => sp.student_id === s.id)
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 px-5 py-3 transition-all ${
                      done ? 'opacity-35' : 'hover:bg-black/[0.01]'
                    }`}
                  >
                    <Initials name={s.full_name} done={done} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate leading-tight ${
                        done ? 'text-[#A1A1A6]' : 'text-[#1C1C1E]'
                      }`}>
                        {s.full_name}
                      </p>
                      <p className={`text-[11px] font-mono truncate leading-tight mt-0.5 ${
                        done ? 'text-[#A1A1A6]/50' : 'text-[#A1A1A6]'
                      }`}>
                        {s.mssv || '—'}
                      </p>
                    </div>
                    <Pill done={done} prizeType={rec?.prize_type} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-black/[0.04]">
            <p className="text-[11px] text-[#A1A1A6]">
              {filtered.length === total
                ? `${total} sinh viên`
                : `${filtered.length} / ${total}`}
            </p>
            <button
              type="button"
              onClick={load}
              className="text-[11px] text-[#A1A1A6] hover:text-[#6E6E73] transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Làm mới
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
