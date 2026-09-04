import { useRef, useState } from 'react'
import { Download, FolderOpen, Save, Trash2, Upload } from 'lucide-react'
import { useGame } from '../context/useGame'
import type { SaveSlotSummary } from '../hooks/useGameState'

export function SaveManagerPage() {
  const { gameState, activeSaveSlotId, listSaveSlots, saveToSlot, loadSaveSlot, deleteSaveSlot, exportCareer, importCareer } = useGame()
  const [slots, setSlots] = useState<SaveSlotSummary[]>(() => listSaveSlots())
  const [slotName, setSlotName] = useState(`${gameState.player.fullName} · ${gameState.season}`)
  const [message, setMessage] = useState('Each career autosaves independently. Loading a slot makes it the active career.')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function createSlot() {
    const slot = saveToSlot(slotName)
    if (!slot) return
    setSlots(listSaveSlots())
    setMessage(`Created and switched to “${slot.name}”.`)
  }

  function downloadSave() {
    const url = URL.createObjectURL(new Blob([exportCareer()], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `snooker-career-${gameState.player.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Downloaded a portable career save.')
  }

  async function importFile(file: File | undefined) {
    if (!file) return
    const imported = importCareer(await file.text())
    setMessage(imported ? 'Career imported and upgraded successfully.' : 'That file is not a valid Snooker Career Manager save.')
    if (imported) setSlotName('Imported career')
  }

  function removeSlot(slot: SaveSlotSummary) {
    if (!window.confirm(`Delete the save slot “${slot.name}”? This cannot be undone.`)) return
    deleteSaveSlot(slot.id)
    setSlots(listSaveSlots())
    setMessage(`Deleted “${slot.name}”.`)
  }

  return (
    <div className="space-y-4">
      <header className="rounded-xl border border-border bg-surface/85 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-400">Career Data</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Save Manager</h1>
        <p className="mt-1 text-sm text-gray-400">Manage independent autosaving careers or move one between devices with JSON import and export.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <section className="card card-body">
          <h2 className="text-base font-semibold text-white">Named Save Slots</h2>
          <div className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="save-slot-name">Save slot name</label>
            <input id="save-slot-name" className="min-w-0 flex-1 rounded border border-border bg-surface-light px-3 py-2 text-sm text-white" value={slotName} onChange={(event) => setSlotName(event.target.value)} />
            <button type="button" className="btn-primary" onClick={createSlot}><Save className="h-4 w-4" /> Create Copy</button>
          </div>
          <div className="mt-4 space-y-2">
            {slots.length === 0 ? <p className="rounded-lg bg-surface-light/50 p-4 text-sm text-gray-400">No named saves yet.</p> : slots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-light/40 p-3">
                <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate font-medium text-white">{slot.name}</p>{slot.id === activeSaveSlotId ? <span className="rounded bg-green-600/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-400">Active · autosaving</span> : null}</div><p className="mt-0.5 text-xs text-gray-400">{slot.playerName} · {slot.season} · {slot.date}</p></div>
                <div className="flex shrink-0 gap-2"><button type="button" className="btn-secondary text-xs" onClick={() => { if (loadSaveSlot(slot.id)) setMessage(`Loaded “${slot.name}”.`) }}><FolderOpen className="h-3.5 w-3.5" /> Load</button><button type="button" className="btn-secondary text-xs text-red-300" onClick={() => removeSlot(slot)} aria-label={`Delete ${slot.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div>
              </div>
            ))}
          </div>
        </section>

        <section className="card card-body">
          <h2 className="text-base font-semibold text-white">Portable Backup</h2>
          <p className="mt-2 text-sm text-gray-400">Export includes the complete versioned career state. Imported saves are validated, upgraded, and repaired before loading.</p>
          <div className="mt-4 grid gap-2"><button type="button" className="btn-primary justify-center" onClick={downloadSave}><Download className="h-4 w-4" /> Export Career</button><button type="button" className="btn-secondary justify-center" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Import Career</button><input ref={fileInputRef} className="hidden" type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} /></div>
          <p role="status" className="mt-4 rounded-lg border border-green-600/20 bg-green-600/10 p-3 text-xs text-green-200">{message}</p>
        </section>
      </div>
    </div>
  )
}
