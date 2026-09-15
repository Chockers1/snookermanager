import { useState, useSyncExternalStore } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Bug, Eye, Keyboard, LockKeyhole, Settings2 } from 'lucide-react';
import { SectionTabs } from '../components/ui/SectionTabs';
import { useGame } from '../context/useGame';
import { careerDifficulty } from '../game/careerDifficulty';
import { defaultAccessibility, readAccessibility, saveAccessibility, subscribeAccessibility, keyboardRoutes, type AccessibilityPreferences } from '../game/accessibility';
import { downloadBugReport, gameBuild } from '../game/bugReport';

const tabs = ['Display', 'Controls', 'Career', 'Support'] as const;
const basicControls = [
  ['Tab / Shift+Tab', 'Move focus'], ['Enter / Space', 'Activate a focused control'],
  ['Arrow keys', 'Change options or tabs'], ['Escape', 'Close supported menus and dialogs'],
];

export function SettingsPage() {
  const { gameState, careerSessionMode, updateFirstWeekGuide } = useGame();
  const location = useLocation();
  const prefs = useSyncExternalStore(subscribeAccessibility, readAccessibility, () => defaultAccessibility);
  const [tab, setTab] = useState<typeof tabs[number]>('Display');
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const [exporting, setExporting] = useState(false);
  const active = careerSessionMode === 'active';
  const mode = careerDifficulty(gameState);

  function update(change: Partial<AccessibilityPreferences>) {
    try { saveAccessibility({ ...prefs, ...change }); setMessage('Preferences saved on this browser.'); }
    catch { setMessage('Could not save preferences. Check browser storage permissions.'); }
  }
  async function exportReport() {
    setExporting(true);
    try {
      setMessage('Preparing complete bug report…');
      await downloadBugReport(active ? gameState : null, description, location.pathname);
      setMessage('Bug report downloaded. Attach it when reporting the problem.');
    } catch { setMessage('Could not export the report. Try exporting your career from Save Manager.'); }
    finally { setExporting(false); }
  }

  return <div className="settings-workspace" data-testid="settings-viewport">
    <header className="settings-header">
      <div className="settings-heading"><Settings2 aria-hidden="true"/><div><span>Make yourself comfortable</span><h1>Settings & help</h1></div></div>
      <Link className="btn-secondary text-xs" to={active ? '/saves' : '/'}>{active ? 'Open Save Manager' : 'Back to careers'}</Link>
    </header>
    <SectionTabs id="settings-sections" label="Settings sections" tabs={tabs} active={tab} onChange={setTab}/>
    <div className="settings-content" role="tabpanel" id="settings-sections-panel" aria-labelledby={`settings-sections-tab-${tabs.indexOf(tab)}`}>
      {tab === 'Display' && <div className="settings-grid">
        <section className="settings-card" aria-label="Accessibility">
          <header><Eye aria-hidden="true"/><div><h2>Accessibility & readability</h2><p>Preferences apply across this browser.</p></div></header>
          <div className="settings-card-body">
            <label className="settings-option"><span><strong>Text size</strong><small>Choose the most comfortable reading size.</small></span><select aria-label="Text size" value={prefs.textScale} onChange={e => update({ textScale: Number(e.target.value) as AccessibilityPreferences['textScale'] })}><option value={100}>Standard · 100%</option><option value={115}>Larger · 115%</option><option value={130}>Largest · 130%</option></select></label>
            <label className="settings-option"><span><strong>Higher text contrast</strong><small>Give labels and supporting text more contrast.</small></span><input type="checkbox" checked={prefs.highContrast} onChange={e => update({ highContrast: e.target.checked })}/></label>
            <label className="settings-option"><span><strong>Reduce interface motion</strong><small>Reduce transitions and animation.</small></span><input type="checkbox" checked={prefs.reducedMotion} onChange={e => update({ reducedMotion: e.target.checked })}/></label>
          </div>
          <footer><button className="btn-secondary text-xs" onClick={() => update(defaultAccessibility)}>Reset accessibility settings</button></footer>
        </section>
        <section className="settings-card settings-card-accent">
          <header><h2>Clear at a glance</h2></header>
          <div className="settings-card-body settings-reading-guide">
            <div className="settings-result-key"><span><b>W</b>Win</span><span><b>L</b>Loss</span><span><b>D</b>Draw</span></div>
            <p>Results include letters alongside colours, so you can read them without relying on red and green.</p>
            <div className="settings-note"><h3>Motion preferences</h3><p>Your operating system’s reduced-motion preference is also respected.</p></div>
            <div className="settings-note"><h3>More room for text</h3><p>Panels adapt to your text size. Wide tables retain horizontal scrolling when needed.</p></div>
          </div>
        </section>
      </div>}
      {tab === 'Controls' && <div className="settings-grid">
        <section className="settings-card"><header><Keyboard aria-hidden="true"/><div><h2>Keyboard controls</h2><p>Use the whole interface from your keyboard.</p></div></header><div className="settings-card-body"><dl className="settings-key-list">{basicControls.map(([keys, action]) => <div key={keys}><dt><kbd>{keys}</kbd></dt><dd>{action}</dd></div>)}</dl><p className="settings-note">Space toggles checkboxes and presses focused buttons. These controls are always available.</p></div></section>
        <section className="settings-card"><header><h2>Navigation shortcuts</h2></header><div className="settings-card-body"><label className="settings-option"><span><strong>Enable keyboard navigation shortcuts</strong></span><input type="checkbox" checked={prefs.shortcuts} onChange={e => update({ shortcuts: e.target.checked })}/></label><dl className="settings-shortcuts">{Object.entries(keyboardRoutes).map(([key, value]) => <div key={key}><dt><kbd>Alt + Shift + {key.slice(3)}</kbd></dt><dd>{value.label}</dd></div>)}</dl><p className="settings-note">Shortcuts pause while typing, choosing a select option or using a dialog. They navigate only; they never advance time or play a shot.</p></div></section>
      </div>}
      {tab === 'Career' && <div className="settings-grid">
        <section className="settings-card settings-card-accent" aria-label="Career difficulty"><header><LockKeyhole aria-hidden="true"/><div><h2>Career difficulty</h2><p>{active ? 'Fixed for this career' : 'Choose during new-career setup'}</p></div></header><div className="settings-card-body">
          {active ? <><div className="settings-mode"><div><small>{gameState.player.fullName}</small><strong>{mode.label}</strong></div><span className="settings-badge">Locked</span></div><dl className="settings-mode-facts"><div><dt>Background support</dt><dd>{Math.round(mode.support * 100)}%</dd></div><div><dt>Missed obligation</dt><dd>−{mode.missedCompliance} compliance</dd></div><div><dt>Missed obligation limit</dt><dd>{mode.missedLimit}</dd></div></dl><p>A sponsor can end a deal at the missed-obligation limit or below 40 compliance.</p></> : <p>Relaxed, Standard and Demanding vary background financial support and sponsor-management pressure.</p>}
          <p className="settings-note">Match rules, opponents, training and prizes are identical in every mode. Background support tapers between £25,000 and £100,000 cash, resumes when reserves fall, and stops at retirement.</p>
          <p>Choose difficulty during setup; it stays locked. Existing saves keep their mode, defaulting to Standard if none was saved.</p>
        </div></section>
        <section className="settings-card"><header><BookOpen aria-hidden="true"/><div><h2>First-week guide</h2><p>A helping hand whenever you need it.</p></div></header><div className="settings-card-body"><ol className="settings-guide-steps">{['Plan training', 'Check equipment', 'Enter an event', 'Arrange travel', 'Prepare for the event', 'Play your first match'].map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol><p>Reopen the guide to work through these steps. You can minimise it, skip individual explanations or dismiss it at any time.</p></div><footer>{active ? <button className="btn-primary text-xs" onClick={() => { updateFirstWeekGuide('resume'); setMessage('First-week guide reopened.'); }}>Show first-week guide</button> : <p>The guide starts automatically with a new career.</p>}</footer></section>
      </div>}
      {tab === 'Support' && <div className="settings-grid">
        <section className="settings-card" aria-label="Bug report"><header><Bug aria-hidden="true"/><div><h2>Export a bug report</h2><p>Help reproduce the problem you found.</p></div></header><div className="settings-card-body settings-report-body"><label htmlFor="bug-description">What went wrong?</label><textarea id="bug-description" value={description} maxLength={8000} onChange={e => setDescription(e.target.value)} placeholder="What you did, what you expected, and what happened instead."/><p>Your description stays here while you switch settings tabs.</p></div><footer><button className="btn-primary text-xs" disabled={exporting} onClick={exportReport}>{exporting ? 'Preparing report…' : 'Download bug report'}</button></footer></section>
        <section className="settings-card"><header><h2>What’s included</h2></header><div className="settings-card-body"><ul className="settings-export-list"><li>{active ? 'Your complete career save and player name' : 'No career save while outside an active career'}</li><li>Game version and build</li><li>Recent actions and captured interface errors</li><li>Your description of the problem</li></ul><div className="settings-note"><h3>You control what you share</h3><p>The report downloads to your device. Nothing is uploaded automatically. Attach it when reporting the issue.</p></div><p>For save backups, restoring a career or moving devices, use Save Manager.</p></div></section>
      </div>}
    </div>
    <footer className="settings-footer"><p role="status">{message || 'Display and control preferences are saved automatically.'}</p><span>Version {gameBuild.version} · Build {gameBuild.revision}</span></footer>
  </div>;
}
