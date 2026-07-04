/**
 * Script đồng bộ dữ liệu từ Google Sheet lên Supabase
 *
 * Cách dùng:
 * 1. Tạo service account tại https://console.cloud.google.com
 * 2. Share sheet cho email service account
 * 3. Copy .env.example thành .env và điền thông tin
 * 4. Chạy: node scripts/sync-from-sheet.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const SHEET_ID = process.env.GOOGLE_SHEET_ID
const API_KEY = process.env.GOOGLE_API_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const RANGE = 'Sheet1!A:H' // Điều chỉnh theo sheet của bạn

async function main() {
  if (!SHEET_ID || !API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Thiếu biến môi trường! Copy .env.example thành .env và điền đầy đủ.')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Đọc dữ liệu từ Google Sheet (public read)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
  const res = await fetch(url)
  const data = await res.json()

  if (!data.values || data.values.length < 2) {
    console.error('Không có dữ liệu hoặc sheet không truy cập được')
    process.exit(1)
  }

  const rows = data.values.slice(1) // Bỏ header row
  let success = 0
  let skipped = 0

  for (const row of rows) {
    const [
      timestamp,
      mssv,
      fullName,
      ngaySinh,
      hocSinhTotNghiep,
      nganh,
      sdt,
    ] = row

    if (!mssv || !fullName) {
      skipped++
      continue
    }

    const { error } = await supabase.from('students').upsert(
      {
        mssv: String(mssv).trim(),
        full_name: String(fullName).trim(),
        ngay_sinh: ngaySinh ? String(ngaySinh).trim() : null,
        hoc_sinh_tot_nghiep: hocSinhTotNghiep ? String(hocSinhTotNghiep).trim() : null,
        nganh: nganh ? String(nganh).trim() : null,
        sdt: sdt ? String(sdt).trim() : null,
      },
      { onConflict: 'mssv' }
    )

    if (error) {
      console.error(`Lỗi khi insert MSSV ${mssv}:`, error.message)
    } else {
      success++
    }
  }

  console.log(`Hoàn thành! Đồng bộ: ${success} sinh viên, Bỏ qua: ${skipped}`)
}

main().catch(console.error)
