import { RecoverySaves } from '../components/game/RecoverySaves';
import { CareerEditor } from '../components/career/CareerDepthPanels';
import { SectionTabs } from '../components/ui/SectionTabs';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Copy, Download, FolderOpen, Pencil, Search, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { useGame } from '../context/useGame';
import type { SaveSlotSummary } from '../hooks/useGameState';
import { formatMoney } from '../utils/formatters';

const tabs = ['Careers', 'Automatic backups', 'Import & export'] as const;
const savedTime = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString() : 'Not recorded';

export function SaveManagerPage() {
  const { gameState, savePending, saveWarning, activeSaveSlotId, listSaveSlots, saveToSlot, loadSaveSlot, renameSaveSlot, deleteSaveSlot, exportCareer, importCareer } = useGame();
  const slots = listSaveSlots();
  const active = slots.find(slot => slot.id === activeSaveSlotId);
  const [tab, setTab] = useState<typeof tabs[number]>('Careers');
  const [selectedId, setSelectedId] = useState<string | null>(activeSaveSlotId);
  const [search, setSearch] = useState('');
  const [slotName, setSlotName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState<SaveSlotSummary | null>(null);
  const [renameText, setRenameText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const locked = savePending || busy;
  const visible = slots.filter(slot => `${slot.name} ${slot.playerName} ${slot.season} ${slot.date}`.toLowerCase().includes(search.trim().toLowerCase()));
  const selected = visible.find(slot => slot.id === selectedId) ?? visible.find(slot => slot.id === activeSaveSlotId) ?? visible[0];
  const sourceName = active?.name ?? gameState.player.fullName;
  const copyName = slotName || `${sourceName} · Copy`;

  async function createSlot() {
    setBusy(true);
    try { const slot = await saveToSlot(copyName); if (slot) { setSelectedId(slot.id); setSearch(''); setSlotName(''); setMessage(`Created and switched to “${slot.name}”, copied from “${sourceName}”. Future progress autosaves in the new copy; the original remains available.`); } else setMessage('The copy was not created. Check the save status above.'); }
    catch { setMessage('Could not create the copy. Your existing career is preserved.'); }
    finally { setBusy(false); }
  }
  async function openSlot(slot: SaveSlotSummary) {
    setBusy(true);
    try { if (await loadSaveSlot(slot.id)) { setSlotName(''); setMessage(`Now playing “${slot.name}”. Future progress autosaves to this career.`); } else setMessage(`Could not open “${slot.name}”. Your current career remains active.`); }
    catch { setMessage('Could not open this career. Your current career is preserved.'); }
    finally { setBusy(false); }
  }
  async function downloadSave() {
    setBusy(true); setMessage(`Preparing a complete backup of “${sourceName}”, including historical seasons…`);
    try {
      const url = URL.createObjectURL(new Blob([await exportCareer()], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url;
      link.download = `snooker-career-${sourceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${gameState.currentDate}.json`;
      link.click(); URL.revokeObjectURL(url);
      setMessage(`Downloaded “${sourceName}” with all archived history. The active career has not changed.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Export failed. Your save is unchanged.'); }
    finally { setBusy(false); }
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try { const imported = await importCareer(await file.text()); setMessage(imported ? 'Imported as a separate career and made it active. Your previous career remains in Careers.' : 'That file is not a valid Snooker Career Manager save. Your current career is unchanged.'); if (imported) { setSelectedId(null); setSlotName(''); setSearch(''); setTab('Careers'); } }
    catch { setMessage('Could not read or import this file. Your current career is unchanged.'); }
    finally { setBusy(false); }
  }
  async function removeSlot(slot: SaveSlotSummary) {
    if (!window.confirm(`Delete “${slot.name}”?\nPlayer: ${slot.playerName} · ${slot.season} · ${slot.date}\nThis removes this saved career and cannot be undone.`)) return;
    setBusy(true);
    try { if (await deleteSaveSlot(slot.id)) { setSelectedId(activeSaveSlotId); setMessage(`Deleted “${slot.name}”. The active career is unchanged.`); } else setMessage('The career was not deleted. Check the save status above.'); }
    finally { setBusy(false); }
  }
  async function renameSlot() {
    if (!renaming) return;
    setBusy(true);
    try { if (await renameSaveSlot(renaming.id, renameText)) { setMessage('Career renamed. Its progress and autosave destination are unchanged.'); setRenaming(null); } else setMessage('Could not rename this career. Check the save status above.'); }
    finally { setBusy(false); }
  }

  return <div className="save-manager-page" data-testid="save-manager-page">
    <header className="save-manager-heading"><div><span>Career library</span><h1>Save Manager</h1><p>Your current career saves automatically. Open a different career below when you want to switch.</p></div><Link className="btn-secondary text-xs" to="/">Continue playing <ArrowUpRight size={14}/></Link></header>
    <section className="save-active" aria-label="Active career"><div className="save-active-identity"><span><CheckCircle2 size={14}/> Currently playing</span><h2>{sourceName}</h2><p>Player: {gameState.player.fullName} · {gameState.player.careerStage}</p></div><div className="save-active-facts"><div><span>Game progress</span><strong>{gameState.season}</strong><small>{gameState.currentDate}</small></div><div><span>Funds</span><strong>{formatMoney(gameState.player.cash)}</strong><small>Current career</small></div><div><span>{savePending ? 'Saving progress…' : saveWarning ? 'Save needs attention' : 'Autosave destination'}</span><strong>{savePending ? 'Please wait' : saveWarning ? 'Check warning below' : 'This career'}</strong><small>{active ? `Last saved ${savedTime(active.updatedAt)}` : 'First save in progress'}</small></div></div></section>
    {saveWarning && <p role="alert" className="save-warning">{saveWarning}</p>}
    <SectionTabs id="save-manager" label="Save manager sections" tabs={tabs} active={tab} onChange={setTab}/>
    <div id="save-manager-panel" role="tabpanel" aria-labelledby={`save-manager-tab-${tabs.indexOf(tab)}`} className="save-manager-body">
      {tab === 'Careers' && <div className="save-careers-layout">
        <section className="save-library" aria-label="Saved careers"><header><h2>Your careers <span>{slots.length}</span></h2><label><Search size={15}/><input aria-label="Search careers" placeholder="Search career, player or season" value={search} onChange={event => setSearch(event.target.value)}/></label></header><div className="save-slot-list" tabIndex={0}>{visible.map(slot => <button key={slot.id} className="save-slot" aria-pressed={selected?.id === slot.id} aria-label={`Select career ${slot.name}`} onClick={() => setSelectedId(slot.id)}><div><strong>{slot.name}</strong><span>{slot.id === activeSaveSlotId ? 'Active · autosaving' : 'Saved career'}</span></div><p>{slot.playerName} · {slot.season} · {slot.date}</p><small>Saved {savedTime(slot.updatedAt)}</small></button>)}{!visible.length && <p className="save-empty">{slots.length ? 'No careers match your search.' : 'Your first saved career will appear here when autosaving finishes.'}</p>}</div></section>
        <div className="save-career-actions">
          <section className="save-selected" aria-label="Selected career"><header><FolderOpen size={18}/><h2>{selected?.id === activeSaveSlotId ? 'Your active career' : 'Open another career'}</h2></header>{selected ? <><h3>{selected.name}</h3><dl><div><dt>Player</dt><dd>{selected.playerName}</dd></div><div><dt>Season / game date</dt><dd>{selected.season} · {selected.date}</dd></div><div><dt>Last saved on this device</dt><dd>{savedTime(selected.updatedAt)}</dd></div><div><dt>Career reference</dt><dd>{selected.id.slice(-8)}</dd></div></dl><p>{selected.id === activeSaveSlotId ? 'This is the career currently on screen. Progress saves here automatically; you do not need to create a copy to save.' : `Opening this switches from “${sourceName}” to “${selected.name}”. Both careers keep their own progress.`}</p><div className="save-action-buttons"><button className="btn-primary text-xs" disabled={locked || selected.id === activeSaveSlotId} onClick={() => void openSlot(selected)}>{selected.id === activeSaveSlotId ? 'Already playing' : 'Open career'}</button><button className="btn-secondary text-xs" disabled={locked} onClick={() => { setRenaming(selected); setRenameText(selected.name); }}><Pencil size={13}/>Rename</button><button className="btn-secondary text-xs" disabled={locked || selected.id === activeSaveSlotId} onClick={() => void removeSlot(selected)} aria-label={`Delete ${selected.name}`}><Trash2 size={13}/>Delete</button></div>{selected.id === activeSaveSlotId && <small>Open another career before deleting this one.</small>}</> : <p>Select a saved career to see its details and open it.</p>}</section>
          <section className="save-copy" aria-label="Copy current career"><header><Copy size={18}/><h2>Create a separate copy</h2></header><p>Copying <b>{sourceName}</b> · {gameState.player.fullName} · {gameState.currentDate}. This creates a new autosaving career and switches to it.</p><label htmlFor="save-slot-name">New copy name</label><div><input id="save-slot-name" aria-label="Save slot name" value={copyName} maxLength={100} onChange={event => setSlotName(event.target.value)}/><button className="btn-primary text-xs" disabled={locked} onClick={() => void createSlot()}>Create Copy</button></div><small>The original stays in your career library.</small></section>
        </div>
      </div>}
      {tab === 'Automatic backups' && <RecoverySaves initialCareerId={activeSaveSlotId ?? gameState.player.id} contained/>}
      {tab === 'Import & export' && <div className="save-transfer-grid"><section><Download/><h2>Export your active career</h2><div className="save-transfer-source"><span>Exporting</span><strong>{sourceName}</strong><p>{gameState.player.fullName} · {gameState.season} · {gameState.currentDate}</p></div><p>Download the complete career, including all historical seasons, to keep a portable backup or move to another device.</p><button className="btn-primary text-xs" disabled={busy} onClick={() => void downloadSave()}>Export Career</button><small>To export another career, open it from Careers first.</small></section><section><Upload/><h2>Import a career file</h2><p>Choose an exported JSON save. The file is validated and upgraded, then opened as a separate career.</p><div className="save-transfer-note"><ShieldCheck/><p>Your current career remains in the library. Importing does not overwrite it.</p></div><button className="btn-secondary text-xs" disabled={locked} onClick={() => fileInputRef.current?.click()}>Import Career</button><input ref={fileInputRef} aria-label="Import career file" className="hidden" type="file" accept="application/json,.json" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void importFile(file); }}/><small>Browser saves stay on this device. Keep exported files somewhere safe.</small></section></div>}
    </div>
    <p role="status" className="save-manager-status">{savePending ? 'Saving your latest progress. Career changes become available when this finishes.' : message || 'Selecting a row only previews it. Use Open career to switch.'}</p>
    {renaming && <CareerEditor title={`Rename ${renaming.name}`} onClose={() => { if (!busy) setRenaming(null); }}><form className="save-rename" onSubmit={event => { event.preventDefault(); void renameSlot(); }}><p>Rename the library entry for {renaming.playerName} · {renaming.season} · {renaming.date}. Your player’s name and progress stay the same.</p><label>Career name<input autoFocus value={renameText} maxLength={100} onChange={event => setRenameText(event.target.value)}/></label><button className="btn-primary text-xs" disabled={locked || !renameText.trim()} type="submit">Save name</button></form></CareerEditor>}
  </div>;
}
