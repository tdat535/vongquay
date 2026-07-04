import { useState, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

interface Props {
  onImported: () => void
}

function parseSheetUrl(s: string): string {
  const t = s.trim()
  const pub = t.match(/\/d\/e\/([a-zA-Z0-9_-]+)/)
  if (pub) return `https://docs.google.com/spreadsheets/d/e/${pub[1]}/pub?output=csv`
  const id = t.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (id) return `https://docs.google.com/spreadsheets/d/${id[1]}/export?format=csv`
  return ''
}

function mapRow(headers: string[], row: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().trim()
    const v = String(row[i] || '').trim()
    if (h.includes('mssv') || h.includes('mã số') || h.includes('student id') || (h.includes('mã') && h.includes('sv'))) { out.mssv = v }
    else if (h.includes('tốt nghiệp') || h.includes('graduated')) { out.hoc_sinh_tot_nghiep = v }
    else if (h.includes('ngành')) { if (!out.nganh) out.nganh = v }
    else if (h.includes('sđt') || h.includes('điện thoại') || h.includes('phone') || h.includes('số đt') || h.includes('số điện')) { out.sdt = v }
    else if (h.includes('ngày sinh') || h.includes('dob')) { out.ngay_sinh = v }
    else if (h.includes('họ') || h.includes('tên')) { out.full_name = v }
  }
  return out
}

function parseExcel(f: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = (e) => {
      try {
        const d = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(d, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const j = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
        if (!j.length) { reject(new Error('File Excel không có dữ liệu')); return }
        const h = Object.keys(j[0])
        resolve({ headers: h, rows: j.map(r => { const m: Record<string, string> = {}; for (const k of h) m[k] = String(r[k] || '').trim(); return m }) })
      } catch { reject(new Error('Lỗi đọc file Excel')) }
    }
    r.onerror = () => reject(new Error('Không thể đọc file'))
    r.readAsArrayBuffer(f)
  })
}

export default function DataManager({ onImported }: Props) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [mode, setMode] = useState<'url' | 'file'>('url')
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null)
  const [importing, setImporting] = useState(false)
  const urlRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const stored = useRef<{ headers: string[]; data: Record<string, string>[] } | null>(null)

  async function sync() {
    const csv = parseSheetUrl(url)
    if (!csv) { setStatus({ ok: false, msg: 'Không tìm thấy Sheet ID' }); return }
    setBusy(true); setStatus(null)
    try {
      const r = await fetch('/api/fetch-csv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: csv }) })
      if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'Sheet yêu cầu đăng nhập' : `HTTP ${r.status}`)
      const text = await r.text()
      const { data: rows } = Papa.parse(text, { header: false, skipEmptyLines: true }) as { data: string[][] }
      if (rows.length < 2) { setStatus({ ok: false, msg: 'File CSV rỗng' }); setBusy(false); return }
      const h = rows[0]
      const data = rows.slice(1).map(r => mapRow(h, r)).filter(r => r.mssv && r.full_name)
      if (!data.length) { setStatus({ ok: false, msg: 'Không tìm thấy cột MSSV và Họ tên' }); setBusy(false); return }
      stored.current = { headers: h, data }
      await commit(data)
    } catch (e) { setStatus({ ok: false, msg: e instanceof Error ? e.message : 'Lỗi' }) }
    setBusy(false)
  }

  async function commit(data: Record<string, string>[]) {
    const size = 100
    let n = 0
    for (let i = 0; i < data.length; i += size) {
      const { error } = await supabase.rpc('import_students', { p_data: data.slice(i, i + size) })
      if (error) { setStatus({ ok: false, msg: error.message }); return }
      n += Math.min(size, data.length - i)
    }
    setStatus({ ok: true, msg: `✅ Đã đồng bộ ${n} sinh viên` })
    onImported()
  }

  async function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setStatus(null); stored.current = null; setPreview(null)
    try {
      let h: string[], d: Record<string, string>[]
      if (/\.xlsx?$/i.test(f.name)) {
        const r = await parseExcel(f); h = r.headers; d = r.rows
      } else {
        const text = await f.text()
        const p = Papa.parse(text, { header: true, skipEmptyLines: true }) as { meta: { fields: string[] }; data: Record<string, string>[] }
        h = p.meta.fields || []; d = p.data
      }
      const toVals = (r: Record<string, string>) => h.map(k => r[k] || '')
      const mapped = d.map(r => mapRow(h, toVals(r))).filter(r => r.mssv && r.full_name)
      setPreview(mapped.slice(0, 5))
      stored.current = { headers: h, data: mapped }
    } catch (err) { setStatus({ ok: false, msg: err instanceof Error ? err.message : 'Lỗi đọc file' }) }
  }

  async function doFileImport() {
    if (!stored.current?.data.length) return
    setImporting(true); setStatus(null)
    await commit(stored.current.data)
    setImporting(false)
  }

  return (
    <div>
      <div className="flex gap-1 mb-5 bg-black/[0.02] rounded-xl p-0.5 border border-black/[0.04]">
        {(['url', 'file'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setStatus(null) }}
            className={`flex-1 py-2 rounded-[9px] text-xs font-medium transition-all ${
              mode === m
                ? 'bg-gold/12 text-gold shadow-sm'
                : 'text-[#A1A1A6] hover:text-[#6E6E73]'
            }`}
          >
            <span className="block leading-tight">{m === 'url' ? 'Tự động' : 'Thủ công'}</span>
            <span className="block text-[10px] opacity-50 mt-0.5">{m === 'url' ? 'URL Google Sheet' : 'CSV / Excel'}</span>
          </button>
        ))}
      </div>

      {mode === 'url' ? (
        <div>
          <div className="flex gap-2">
            <input
              ref={urlRef}
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.07] text-[#1C1C1E] text-sm placeholder-[#A1A1A6] focus:outline-none focus:border-gold/40 focus:bg-black/[0.03] transition-all"
            />
            <button
              type="button"
              onClick={sync}
              disabled={busy || !url.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-gold to-gold-dark text-white text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:from-gold-light hover:to-gold transition-all shrink-0"
            >
              {busy ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Đồng bộ'}
            </button>
          </div>
          <details className="mt-3 group">
            <summary className="text-[12px] text-[#A1A1A6] cursor-pointer hover:text-[#6E6E73] transition-colors">
              Hướng dẫn
            </summary>
            <ol className="mt-2 text-[12px] text-[#A1A1A6] space-y-1 list-decimal list-inside">
              <li>Mở sheet → <span className="text-[#6E6E73]">File → Share → Publish to web</span></li>
              <li>Định dạng <span className="text-[#6E6E73]">Comma-separated values (.csv)</span></li>
              <li>Copy URL → dán vào ô trên</li>
            </ol>
          </details>
        </div>
      ) : (
        <div>
          <p className="text-[#A1A1A6] text-xs mb-3">
            Tải file từ Google Sheet (<span className="text-[#6E6E73]">File → Download → Microsoft Excel</span>) rồi upload.
          </p>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/[0.02] border border-black/[0.06] border-dashed cursor-pointer hover:bg-black/[0.03] hover:border-black/[0.12] transition-all">
            <svg className="w-5 h-5 text-[#A1A1A6] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-[#6E6E73] text-sm font-medium">Chọn file CSV hoặc Excel</p>
              <p className="text-[#A1A1A6] text-xs mt-0.5">.csv, .xlsx, .xls</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFilePick} className="hidden" />
          </label>

          {preview && preview.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-black/[0.02] border border-black/[0.04]">
              <p className="text-[#A1A1A6] text-xs mb-3">Xem trước ({preview.length} dòng đầu):</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="px-2 py-1.5 text-left text-[#A1A1A6] font-medium">MSSV</th>
                      <th className="px-2 py-1.5 text-left text-[#A1A1A6] font-medium">Họ tên</th>
                      <th className="px-2 py-1.5 text-left text-[#A1A1A6] font-medium hidden sm:table-cell">Ngành</th>
                      <th className="px-2 py-1.5 text-left text-[#A1A1A6] font-medium hidden sm:table-cell">SĐT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-black/5">
                        <td className="px-2 py-1.5 text-[#1C1C1E]">{row.mssv}</td>
                        <td className="px-2 py-1.5 text-[#1C1C1E]">{row.full_name}</td>
                        <td className="px-2 py-1.5 text-[#A1A1A6] hidden sm:table-cell">{row.nganh || '—'}</td>
                        <td className="px-2 py-1.5 text-[#A1A1A6] hidden sm:table-cell">{row.sdt || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={doFileImport}
                disabled={importing}
                className="mt-3 px-5 py-2.5 rounded-xl bg-gradient-to-b from-gold to-gold-dark text-white text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:from-gold-light hover:to-gold transition-all"
              >
                {importing ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang import...
                  </span>
                ) : (
                  'Import vào hệ thống'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {status && (
        <div className={`mt-3 px-4 py-2.5 rounded-xl text-xs ${
          status.ok
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {status.msg}
        </div>
      )}
    </div>
  )
}
