import { RecoverySaves } from '../components/game/RecoverySaves';
import { useRef, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, FolderOpen, PlayCircle, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/useGame'

export function CareerLauncherPage() {
  const { hasActiveCareer, listSaveSlots, continueActiveCareer, beginNewCareer, loadSaveSlot, importCareer, startDemoCareer } = useGame()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showSaves, setShowSaves] = useState(false)
  const [message, setMessage] = useState('Choose how you want to enter the game.')
  const slots = listSaveSlots()

  function openNewCareer() {
    beginNewCareer()
    navigate('/new-career')
  }

  function continueCareer() {
    if (continueActiveCareer()) navigate('/')
  }

  async function importSave(file: File | undefined) {
    if (!file) return
    if (importCareer(await file.text())) {
      navigate('/')
      return
    }
    setMessage('That file is not a valid Snooker Career Manager save.')
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background px-4 py-6 text-white sm:px-6 sm:py-10 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,197,94,0.14),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(242,183,5,0.08),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col justify-center">
        <header className="mb-7 max-w-2xl sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-400">Snooker Career Manager</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">Your career starts here.</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">Continue your tour, create a new player, or restore another career. The dashboard opens only after you choose a save.</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button type="button" disabled={!hasActiveCareer} onClick={continueCareer} className="group min-h-36 rounded-xl border border-green-500/40 bg-green-600/15 p-5 text-left transition hover:border-green-400 hover:bg-green-600/20 disabled:cursor-not-allowed disabled:border-border disabled:bg-surface/60 disabled:opacity-45 sm:min-h-44">
            <PlayCircle className="h-6 w-6 text-green-400" />
            <span className="mt-5 block text-lg font-semibold">Continue Career</span>
            <span className="mt-1 block text-sm text-gray-400">{hasActiveCareer ? 'Resume the active local career.' : 'No active career found.'}</span>
            <ArrowRight className="mt-4 h-4 w-4 text-green-400 transition-transform group-hover:translate-x-1" />
          </button>
          <button type="button" onClick={openNewCareer} className={`group min-h-36 rounded-xl border p-5 text-left transition sm:min-h-44 ${hasActiveCareer ? 'border-border bg-surface/90 hover:border-green-500/50' : 'border-green-500/50 bg-green-600/15 hover:border-green-400'}`}>
            <BriefcaseBusiness className="h-6 w-6 text-green-400" />
            <span className="mt-5 block text-lg font-semibold">New Career</span>
            <span className="mt-1 block text-sm text-gray-400">Build a player and choose a starting path.</span>
            <ArrowRight className="mt-4 h-4 w-4 text-green-400 transition-transform group-hover:translate-x-1" />
          </button>
          <button type="button" onClick={() => setShowSaves((visible) => !visible)} className="group min-h-36 rounded-xl border border-border bg-surface/90 p-5 text-left transition hover:border-green-500/50 sm:min-h-44">
            <FolderOpen className="h-6 w-6 text-green-400" />
            <span className="mt-5 block text-lg font-semibold">Load Career</span>
            <span className="mt-1 block text-sm text-gray-400">Choose from {slots.length} named {slots.length === 1 ? 'save' : 'saves'}.</span>
            <ArrowRight className="mt-4 h-4 w-4 text-green-400 transition-transform group-hover:translate-x-1" />
          </button>
        </section>

        {showSaves && (
          <section className="mt-4 rounded-xl border border-border bg-surface/95 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Named careers</h2><button type="button" className="min-h-10 px-2 text-sm text-gray-400 hover:text-white" onClick={() => setShowSaves(false)}>Close</button></div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {slots.length === 0 ? <p className="rounded-lg bg-surface-light/50 p-4 text-sm text-gray-400">No named saves yet. Create a new career or import a backup.</p> : slots.map((slot) => (
                <button key={slot.id} type="button" className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-border bg-surface-light/40 p-3 text-left hover:border-green-500/40" onClick={() => { if (loadSaveSlot(slot.id)) navigate('/') }}>
                  <span className="min-w-0"><strong className="block truncate text-sm">{slot.name}</strong><span className="mt-1 block truncate text-xs text-gray-400">{slot.playerName} · {slot.season} · {slot.date}</span></span><FolderOpen className="h-4 w-4 shrink-0 text-green-400" />
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-surface/80 px-4 py-3 text-sm font-semibold hover:border-green-500/40" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Import Save</button>
          <input ref={fileInputRef} className="hidden" type="file" accept="application/json,.json" onChange={(event) => void importSave(event.target.files?.[0])} />
          <button type="button" className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-surface/80 px-4 py-3 text-sm font-semibold text-gray-300 hover:border-amber-500/40 hover:text-white" onClick={() => { startDemoCareer(); navigate('/') }}><PlayCircle className="h-4 w-4 text-amber-400" /> Demo Career</button>
        </div>
        <details className="mt-4"><summary className="cursor-pointer rounded-lg border border-border bg-surface p-4 text-sm font-semibold">Restore automatic backup</summary><div className="mt-2"><RecoverySaves /></div></details>
        <a href="/settings" className="mt-4 text-center text-sm text-green-300 underline">Settings, accessibility &amp; bug reports</a>
        <p role="status" className="mt-4 text-center text-xs text-gray-500">{message}</p>
      </div>
    </main>
  )
}
