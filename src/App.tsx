import { useState } from 'react'
import useSpinEngine from './hooks/useSpinEngine'
import { useStats } from './hooks/useData'
import EventHero from './components/EventHero'
// import PrizeShowcase from './components/PrizeShowcase'
import ParticipantList from './components/ParticipantList'
import ResultScreen from './components/ResultScreen'
import DataManager from './components/DataManager'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const engine = useSpinEngine()
  const stats = useStats(engine.refreshKey)

  return (
    <main className="w-full max-w-full overflow-x-hidden">

      <EventHero
        wheelRef={engine.wheelRef}
        spinning={engine.spinning}
        students={stats.students}
        spun={stats.spun}
        onSpin={engine.pick}
        onSpinEnd={engine.onSpinEnd}
      />

      {/* <PrizeShowcase refreshKey={engine.refreshKey} /> */}

      <ParticipantList refreshKey={engine.refreshKey} />

      <footer className="w-full py-6 px-6 text-center text-xs text-[#A1A1A6]">
        Cao Đẳng Viễn Đông · Vòng Quay May Mắn · 2026
      </footer>

      {/* Settings trigger */}
      <button
        type="button"
        onClick={() => setShowSettings(p => !p)}
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-[#A1A1A6] hover:text-[#6E6E73] hover:border-black/[0.15] transition-all shadow-sm"
        aria-label="Settings"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-lg animate-scale-in">
            <div className="rounded-2xl p-6 border border-black/[0.08] bg-white shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="Viễn Đông"
                    className="h-8 w-auto object-contain"
                  />
                  <div>
                    <h2 className="text-[#1C1C1E] text-sm font-semibold">Quản lý dữ liệu</h2>
                    <p className="text-[#A1A1A6] text-xs">Đồng bộ danh sách sinh viên</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A1A1A6] hover:text-[#6E6E73] hover:bg-black/[0.04] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <DataManager onImported={() => { setShowSettings(false) }} />
            </div>
          </div>
        </div>
      )}

      {/* Result Screen */}
      {engine.result && (
        <ResultScreen
          prizeType={engine.result.prizeType}
          prizeName={engine.result.prizeName}
          studentName={engine.result.name}
          onClose={engine.dismissResult}
        />
      )}

    </main>
  )
}
