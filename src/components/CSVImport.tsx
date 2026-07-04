import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '../lib/supabase'

interface Props {
  onImported: () => void
}

interface PreviewRow {
  mssv: string
  full_name: string
  ngay_sinh: string
  hoc_sinh_tot_nghiep: string
  nganh: string
  sdt: string
}

function detectColumn(headers: string[]): Record<string, keyof PreviewRow> {
  const map: Record<string, keyof PreviewRow> = {}
  for (const h of headers) {
    const k = h.toLowerCase().trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (k.includes('mssv') || k.includes('ma sv') || k.includes('ma so')) {
      map[h] = 'mssv'
    } else if (k.includes('ho va ten') || k.includes('ho ten') || k.includes('full name')) {
      map[h] = 'full_name'
    } else if (k.includes('ngay sinh')) {
      map[h] = 'ngay_sinh'
    } else if (k.includes('tot nghiep') || k.includes('hoc sinh')) {
      map[h] = 'hoc_sinh_tot_nghiep'
    } else if (k.includes('nganh')) {
      map[h] = 'nganh'
    } else if (k.includes('sdt') || k.includes('dien thoai') || k.includes('phone')) {
      map[h] = 'sdt'
    }
  }
  return map
}

export default function CSVImport({ onImported }: Props) {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMap, setColumnMap] = useState<Record<string, keyof PreviewRow>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete(results) {
        const h = results.meta.fields || []
        if (h.length === 0) {
          setError('File CSV không có dữ liệu hoặc sai định dạng')
          return
        }
        setHeaders(h)
        const map = detectColumn(h)
        setColumnMap(map)

        const rows: PreviewRow[] = results.data.slice(0, 5).map((row: any) => ({
          mssv: String(row[Object.keys(map).find(k => map[k] === 'mssv') || ''] || '').trim(),
          full_name: String(row[Object.keys(map).find(k => map[k] === 'full_name') || ''] || '').trim(),
          ngay_sinh: String(row[Object.keys(map).find(k => map[k] === 'ngay_sinh') || ''] || '').trim(),
          hoc_sinh_tot_nghiep: String(row[Object.keys(map).find(k => map[k] === 'hoc_sinh_tot_nghiep') || ''] || '').trim(),
          nganh: String(row[Object.keys(map).find(k => map[k] === 'nganh') || ''] || '').trim(),
          sdt: String(row[Object.keys(map).find(k => map[k] === 'sdt') || ''] || '').trim(),
        }))
        setPreview(rows)
      },
      error(err) {
        setError('Lỗi đọc file: ' + err.message)
      },
    })
  }

  async function handleImport() {
    if (!preview || !headers.length) return
    setImporting(true)
    setError(null)

    const file = fileRef.current?.files?.[0]
    if (!file) { setImporting(false); return }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: async (results) => {
        const allRows = results.data
          .filter((r: any) => {
            const mssvKey = Object.keys(columnMap).find(k => columnMap[k] === 'mssv')
            return mssvKey && String(r[mssvKey] || '').trim().length > 0
          })
          .map((r: any) => ({
            mssv: String(r[Object.keys(columnMap).find(k => columnMap[k] === 'mssv') || ''] || '').trim(),
            full_name: String(r[Object.keys(columnMap).find(k => columnMap[k] === 'full_name') || ''] || '').trim(),
            ngay_sinh: String(r[Object.keys(columnMap).find(k => columnMap[k] === 'ngay_sinh') || ''] || '').trim(),
            hoc_sinh_tot_nghiep: String(r[Object.keys(columnMap).find(k => columnMap[k] === 'hoc_sinh_tot_nghiep') || ''] || '').trim(),
            nganh: String(r[Object.keys(columnMap).find(k => columnMap[k] === 'nganh') || ''] || '').trim(),
            sdt: String(r[Object.keys(columnMap).find(k => columnMap[k] === 'sdt') || ''] || '').trim(),
          }))

        const { data, error: rpcError } = await supabase.rpc('import_students', {
          p_data: allRows,
        })

        setImporting(false)

        if (rpcError) {
          setError('Lỗi import: ' + rpcError.message)
          return
        }

        const res = data as { success?: boolean; imported?: number }
        setResult(`✅ Import thành công ${res.imported || allRows.length} sinh viên`)
        setPreview(null)
        if (fileRef.current) fileRef.current.value = ''
        onImported()
      },
      error(err) {
        setImporting(false)
        setError('Lỗi parse file: ' + err.message)
      },
    })
  }

  function handleCancel() {
    setPreview(null)
    setResult(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-yellow-400 text-lg">📥</span>
        <h3 className="text-sm font-semibold text-white uppercase">Import từ Google Sheet</h3>
      </div>

      <p className="text-gray-400 text-xs mb-4">
        Tải file CSV từ Google Sheet (File → Download → Comma Separated Values) rồi upload lên đây.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-white hover:file:bg-yellow-400 cursor-pointer"
      />

      {error && (
        <p className="mt-3 text-red-400 text-sm">{error}</p>
      )}

      {result && (
        <p className="mt-3 text-green-400 text-sm">{result}</p>
      )}

      {preview && preview.length > 0 && (
        <div className="mt-4">
          <p className="text-gray-400 text-xs mb-2">
            Xem trước ({preview.length} dòng đầu):
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-2 py-1 text-left text-gray-400">MSSV</th>
                  <th className="px-2 py-1 text-left text-gray-400">Họ tên</th>
                  <th className="px-2 py-1 text-left text-gray-400 hidden sm:table-cell">Ngành</th>
                  <th className="px-2 py-1 text-left text-gray-400 hidden sm:table-cell">SĐT</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-2 py-1 text-white">{row.mssv}</td>
                    <td className="px-2 py-1 text-white">{row.full_name}</td>
                    <td className="px-2 py-1 text-gray-400 hidden sm:table-cell">{row.nganh || '—'}</td>
                    <td className="px-2 py-1 text-gray-400 hidden sm:table-cell">{row.sdt || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              {importing ? 'Đang import...' : 'Import vào hệ thống'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg bg-white/10 text-gray-400 text-sm hover:text-white transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
