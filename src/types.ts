export interface Student {
  id: number
  mssv: string
  full_name: string
  ngay_sinh: string | null
  hoc_sinh_tot_nghiep: string | null
  nganh: string | null
  sdt: string | null
}

export interface SpinRecord {
  id: number
  student_id: number
  prize: string
  prize_type: string
  spun_at: string
}

export interface Prize {
  id: number
  name: string
  display_name: string
  total: number
  remaining: number
  color: string
}

export type PrizeType = 'special' | 'voucher10' | 'voucher5'

export interface WheelSegment {
  label: string
  shortLabel: string
  color: string
  prizeType: PrizeType
}
