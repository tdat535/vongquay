import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Student, SpinRecord } from '../types'

interface Props {
  refreshKey: number
}

type FilterTab = 'pending' | 'all' | 'done'

const BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  special: { label: 'Đặc biệt', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
  voucher10: { label: 'Voucher 10%', color: '#047857', bg: '#D1FAE5', border: '#A7F3D0' },
  voucher5: { label: 'Voucher 5%', color: '#0369A1', bg: '#E0F2FE', border: '#BAE6FD' },
}

function Row({ student, done, prizeType, mssv }: { student: string; done: boolean; prizeType?: string; mssv: string }) {
  const initials = student.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const badge = done && prizeType ? BADGE[prizeType] : null

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${
        done
          ? 'opacity-45 border-black/[0.04] bg-black/[0.01]'
          : 'border-black/[0.06] bg-white hover:border-black/[0.12] hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ring-1 ${
          done ? 'bg-black/[0.03] text-[#A1A1A6] ring-black/[0.04]' : 'bg-gold/10 text-gold ring-gold/15'
        }`}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-medium truncate leading-snug ${done ? 'text-[#A1A1A6]' : 'text-[#1C1C1E]'}`}>
          {student}
        </p>
        <p className={`text-xs font-mono truncate mt-1 ${done ? 'text-[#A1A1A6]/50' : 'text-[#A1A1A6]'}`}>
          {mssv || '—'}
        </p>
      </div>
      {badge ? (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0"
          style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.color }} />
          {badge.label}
        </span>
      ) : done ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black/[0.03] text-[#A1A1A6] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-black/10" />
          Đã quay
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gold/8 text-gold/70 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-pulse" />
          Chờ
        </span>
      )}
    </div>
  )
}

function StatChip({ value, label, tone }: { value: number; label: string; tone: 'neutral' | 'done' | 'pending' }) {
  const toneMap = {
    neutral: 'text-[#1C1C1E]',
    done: 'text-emerald-600',
    pending: 'text-gold',
  }
  return (
    <div className="flex-1 text-center py-5">
      <p className={`text-3xl font-semibold tabular-nums ${toneMap[tone]}`}>{value}</p>
      <p className="text-xs text-[#A1A1A6] mt-1 tracking-wide">{label}</p>
    </div>
  )
}

export default function ParticipantList({ refreshKey }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [spins, setSpins] = useState<SpinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('pending')
  const [listVisible, setListVisible] = useState(true)

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    const [stuRes, spinRes] = await Promise.all([
      supabase.from('students').select('*').order('full_name'),
      supabase.from('spins').select('*'),
    ])
    if (stuRes.data) setStudents(stuRes.data)
    if (spinRes.data) setSpins(spinRes.data)
    setLoading(false)
    setRefreshing(false)
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
      list = list.filter(s => s.mssv.toLowerCase().includes(q) || s.full_name.toLowerCase().includes(q))
    }
    return list
  }, [students, spunSet, filter, search])

  if (loading) {
    return (
      <section className="w-full px-6 py-28 md:py-36">
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-black/5 border-t-black/20 rounded-full animate-spin mx-auto" />
        </div>
      </section>
    )
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'pending', label: 'Chờ' },
    { key: 'all', label: 'Tất cả' },
    { key: 'done', label: 'Đã quay' },
  ]

  return (
    <section className="w-full px-4 sm:px-8 lg:px-14 py-24 md:py-32">
      {/* Header */}
      <div className="mb-10 text-center">
        <span className="text-xs font-medium tracking-[0.2em] text-[#A1A1A6] uppercase">Tham dự</span>
        <h2 className="text-[#1C1C1E] text-3xl font-light tracking-tight mt-2">Danh sách tham dự</h2>
        <div className="w-12 h-px bg-gold/40 mx-auto mt-4" />
      </div>

      {/* Stats strip */}
      <div className="flex items-stretch rounded-xl border border-black/[0.04] divide-x divide-black/[0.04] mb-6 bg-black/[0.01]">
        <StatChip value={total} label="Sinh viên" tone="neutral" />
        <StatChip value={spun} label="Đã quay" tone="done" />
        <StatChip value={pending} label="Còn lại" tone="pending" />
      </div>

      {/* Filters + search + toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="inline-flex items-center p-1 rounded-full bg-black/[0.04] shrink-0 self-start">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-white text-[#1C1C1E] shadow-sm'
                  : 'text-[#A1A1A6] hover:text-[#6E6E73]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc MSSV..."
            className="w-full pl-10 pr-10 py-2.5 rounded-full bg-black/[0.03] border border-black/[0.06] text-sm text-[#1C1C1E] placeholder-[#A1A1A6] focus:outline-none focus:bg-white focus:border-black/[0.15] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Xoá tìm kiếm"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-black/10 text-black/50 hover:bg-black/20 text-[11px]"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={() => setListVisible(v => !v)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-black/[0.08] bg-white text-sm font-medium text-[#4A4A4E] hover:bg-black/[0.02] hover:border-black/[0.15] transition-all shrink-0"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${listVisible ? 'rotate-0' : '-rotate-90'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {listVisible ? 'Ẩn danh sách' : 'Hiện danh sách'}
        </button>
      </div>

      {/* Collapsible list — dùng grid-rows trick để có animation mượt khi ẩn/hiện */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: listVisible ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              {total === 0 ? (
                <>
                  <p className="text-2xl mb-2">📋</p>
                  <p className="text-[#A1A1A6] text-sm">Chưa có dữ liệu</p>
                  <p className="text-[#A1A1A6]/50 text-xs mt-1">Import từ menu cài đặt</p>
                </>
              ) : filter === 'pending' ? (
                <>
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-[#A1A1A6] text-sm">Tất cả đã quay xong</p>
                </>
              ) : (
                <>
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="text-[#A1A1A6] text-sm">Không tìm thấy kết quả</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-1">
              {filtered.map(s => {
                const done = spunSet.has(s.id)
                const rec = spins.find(sp => sp.student_id === s.id)
                return <Row key={s.id} student={s.full_name} done={done} prizeType={rec?.prize_type} mssv={s.mssv} />
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-xs text-[#A1A1A6]">
          {filtered.length === total ? `${total} sinh viên` : `${filtered.length} / ${total}`}
        </p>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/[0.08] bg-white text-xs font-medium text-[#4A4A4E] hover:bg-black/[0.02] hover:border-black/[0.15] transition-all disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Làm mới
        </button>
      </div>
    </section>
  )
}