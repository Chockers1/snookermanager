import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useGame } from '../../context/useGame';
import { depthOf, pendingStory, plusDays } from '../../game/careerDepth/shared';
import { PROJECTS, partnerAvailable } from '../../game/careerDepth/developmentProjects';
import { getRivalry, partnerCandidates, coachRelationshipLabel } from '../../game/careerDepth/relationships';
import { STRATEGIES, recommendSeason, recurringCost } from '../../game/careerDepth/seasonPlanning';
import { COMMITMENTS, commitmentQuote, commitmentConflict } from '../../game/careerDepth/commitments';
import { STORY_CHOICES, storyCommitmentDate } from '../../game/careerDepth/careerStories';
import type { CommitmentKind, ProjectKind, Strategy } from '../../game/careerDepth/types';

const input = 'min-h-9 max-w-full rounded border border-border bg-background px-2 py-1 text-xs text-white';
const button = 'btn-secondary min-h-9 text-xs';
const money = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;
const disclosure = 'card shrink-0 min-w-0 text-xs';
const body = 'min-h-0 overflow-y-auto overscroll-contain border-t border-border p-4 space-y-3';

export function CareerEditor({ title, children, onClose, required = false }: { title: string; children: ReactNode; onClose: () => void; required?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return createPortal(<dialog ref={ref} onCancel={event => { if (required) event.preventDefault(); }} onClose={onClose} aria-label={title} className="m-auto w-[min(64rem,calc(100vw-2rem))] max-w-none rounded-xl border border-border bg-surface p-0 text-gray-200 shadow-2xl backdrop:bg-black/65">
    <div className="flex max-h-[calc(100dvh-3rem)] flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3"><h2 className="text-sm font-semibold text-white">{title}</h2>{!required && <button type="button" className={button} onClick={() => ref.current?.close()}>Close editor</button>}</header>
      {children}
    </div>
  </dialog>, document.body);
}
export function CareerDisclosure({ summary, title, children }: { summary: ReactNode; title: string; children: ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(title === 'Plan your season and commitments' && new URLSearchParams(location.search).has('commitments'));
  return <section className={disclosure}><button type="button" aria-haspopup="dialog" className="w-full cursor-pointer px-3 py-2 text-left font-semibold text-white" onClick={() => setOpen(true)}>▸ {summary}</button>{open && <CareerEditor title={title} onClose={() => setOpen(false)}>{children}</CareerEditor>}</section>;
}

export function CareerDecisionNotice() {
  const { gameState } = useGame();
  const story = pendingStory(gameState);
  return story ? <Link to="/inbox" className="block shrink-0 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">Decision waiting: {story.title} · Open Inbox</Link> : null;
}

export function StoryDecisionPanel({ messageId }: { messageId: string }) {
  const { gameState, actOnCareer } = useGame();
  const story = depthOf(gameState).stories.find(s => s.id === messageId || `review:${s.id}` === messageId);
  if (!story) return null;
  return <section className="space-y-3 rounded-lg border border-green-500/30 bg-green-500/5 p-3" aria-label="Career decision">
    <p className="text-xs text-gray-300">{story.status === 'pending' ? `Choose a response · available until ${story.expiresDate}` : `${story.status} · ${story.reviewDate ? `review ${story.reviewDate}` : ''}`}</p>
    {story.status === 'pending' && <div className="grid gap-2 lg:grid-cols-3">{STORY_CHOICES[story.kind].map(choice => {
      const kind = choice.id === 'exhibition' ? 'exhibition' : choice.id === 'media' ? 'appearance' : null;
      const date = storyCommitmentDate(gameState);
      const quote = kind ? commitmentQuote(gameState, kind, date) : null;
      const conflict = quote ? commitmentConflict(gameState, quote.startDate, quote.endDate) : null;
      return <div key={choice.id} className="flex min-w-0 flex-col gap-2 rounded border border-border bg-surface p-3">
        <h3 className="text-sm font-semibold text-white">{choice.label}</h3>
        <p className="flex-1 text-xs leading-5 text-gray-300">{choice.effect}</p>
        {quote && <p className="text-xs text-green-400">{date}–{quote.endDate} · income {money(quote.income)} · cost {money(quote.cost)}</p>}
        {conflict && <p className="text-xs text-amber-300">{conflict}</p>}
        <button className={button} disabled={Boolean(conflict)} onClick={() => actOnCareer({ type: 'decision', id: story.id, choice: choice.id })}>{choice.label}</button>
      </div>;
    })}</div>}
    {story.updates.map((update, i) => <p key={i} className="border-l-2 border-green-600 pl-3 text-xs leading-5 text-gray-300">{update}</p>)}
    <p role="status" className="text-xs text-amber-300">{gameState.lastAction}</p>
  </section>;
}

export function DevelopmentPanel() {
  const { gameState, actOnCareer } = useGame();
  const d = depthOf(gameState), project = d.project;
  const [kind, setKind] = useState<ProjectKind>('long-pot');
  const all = project?.closingAttributes ?? { ...gameState.attributes.technical, ...gameState.attributes.mental, ...gameState.attributes.physical };
  return <CareerDisclosure title="Development project & practice partner" summary={<>Development & practice · {project ? `${PROJECTS[project.kind].name}: ${project.completedWeeks}/${PROJECTS[project.kind].weeks} weeks` : 'Choose a multi-week project'}</>}>
    <div className={body}>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-gray-300">Development project<select aria-label="Development project" className={input} value={kind} onChange={e => setKind(e.target.value as ProjectKind)}>{Object.entries(PROJECTS).map(([id, p]) => <option key={id} value={id}>{p.name} · {p.weeks} weeks</option>)}</select></label>
        <button className={button} disabled={project?.status === 'active'} onClick={() => actOnCareer({ type: 'project', kind })}>Start project</button>
        {project?.status === 'active' && <button className={button} onClick={() => actOnCareer({ type: 'cancel-project' })}>Cancel project</button>}
      </div>
      <p className="text-gray-300">Relevant sessions: {PROJECTS[project?.kind ?? kind].sessions.join(', ')}. Complete three per week; projects do not auto-fill or add training sessions.</p>
      {(project?.kind ?? kind) === 'cue-action' && <p className="text-amber-300">Cue-action rebuild: temporary effective consistency −2 during the first two completed training weeks. Permanent consistency is unchanged by this penalty.</p>}
      {project?.matchEvidence && project.matchEvidence.matches > 0 && <p className="text-gray-300">Measured match evidence ({project.matchEvidence.matches} matches): potting {Math.round(project.matchEvidence.pottingTotal / project.matchEvidence.matches)}% · safety {Math.round(project.matchEvidence.safetyTotal / project.matchEvidence.matches)}% · high break {project.matchEvidence.highestBreak} · long matches {project.matchEvidence.longMatchWins}/{project.matchEvidence.longMatches} won. These results do not award attributes.</p>}
      {project && <div className="grid gap-2 sm:grid-cols-2"><div><p className="text-green-400">{project.status} · review {project.reviewDate}</p><p className="mt-1 text-gray-300">{project.note}</p><p className="mt-1 text-gray-400">Match evidence: {project.evidenceMatches} matches. {project.evidenceMatches < 5 ? 'Small sample; no reliable performance conclusion yet.' : 'Compare match statistics separately from training gains.'}</p></div><div className="space-y-1">{Object.entries(project.baseline).map(([skill, before]) => <p key={skill} className="flex justify-between gap-3"><span>{skill}</span><span className={(all[skill] ?? before) >= before ? 'text-green-400' : 'text-red-400'}>{before} → {all[skill] ?? before} ({(all[skill] ?? before) - before >= 0 ? '+' : ''}{Math.round(((all[skill] ?? before) - before) * 10) / 10})</span></p>)}</div></div>}
      <label className="flex flex-col gap-1 text-gray-300">Practice partner<select aria-label="Practice partner" className={input} value={d.partnerId ?? ''} onChange={e => actOnCareer({ type: 'partner', id: e.target.value || null })}><option value="">No practice partner</option>{partnerCandidates(gameState).map(p => <option key={p.id} value={p.id}>{p.playerName} · age {p.age} · OVR {p.overallRating ?? '—'}</option>)}</select></label>
      <p className="text-gray-400">{d.partnerId ? partnerAvailable(gameState) ? 'Available: one existing technical session becomes shared practice. Project and partner efficiency combined is capped at +10%.' : 'Partner unavailable during competition, travel or injury. No extra sessions or bonus this week.' : 'Select a partner to share an existing technical session—not add an extra training day.'}</p>
      {d.partnerId && <div className="flex flex-wrap items-center gap-3"><label>Shared practice skill <select aria-label="Shared practice skill" className={input} value={d.partnerFocus ?? 'Long Potting'} onChange={e => actOnCareer({ type: 'partner-focus', skill: e.target.value })}>{['Long Potting', 'Break Building', 'Cue Ball Control', 'Safety Play'].map(skill => <option key={skill}>{skill}</option>)}</select></label><span className="text-green-400">{d.practiceHistory?.[d.partnerId]?.sessions ?? 0} shared sessions completed · benefits target this skill</span></div>}
      <p role="status" className="text-amber-300">{gameState.lastAction}</p>
    </div>
  </CareerDisclosure>;
}

export function SeasonPlanningPanel() {
  const { gameState, actOnCareer } = useGame();
  const d = depthOf(gameState), rows = recommendSeason(gameState);
  const [ids, setIds] = useState<string[]>([]);
  const [cap, setCap] = useState(0);
  const [reserve, setReserve] = useState(recurringCost(gameState) * 4);
  const [kind, setKind] = useState<CommitmentKind>('recovery');
  const [date, setDate] = useState(plusDays(gameState.currentDate, 7));
  const quote = commitmentQuote(gameState, kind, date || plusDays(gameState.currentDate, 7));
  const conflict = commitmentConflict(gameState, quote.startDate, quote.endDate);
  const selected = rows.filter(r => ids.includes(r.event.id));
  const total = selected.reduce((n, r) => n + r.total, 0);
  return <CareerDisclosure title="Plan your season and commitments" summary={<>Season strategy & commitments · {STRATEGIES[d.strategy]} · {d.schedule?.enabled ? `${money(d.schedule.spent)} / ${money(d.schedule.cap)} approved` : 'Assistance off'}</>}>
    <div className={body}>
      <label className="flex flex-col gap-1">Career strategy<select className={input} value={d.strategy} onChange={e => { actOnCareer({ type: 'strategy', strategy: e.target.value as Strategy, targets: d.targets }); setIds([]); }}>{Object.entries(STRATEGIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      {d.strategy === 'majors' && <fieldset className="flex flex-wrap gap-3"><legend className="mb-2 text-gray-400">Choose up to three peak events</legend>{rows.filter(r => (r.event.prestige ?? 0) >= 4 || r.event.type === 'Major').map(r => <label key={r.event.id} className="flex items-center gap-2"><input type="checkbox" checked={d.targets.includes(r.event.id)} disabled={!d.targets.includes(r.event.id) && d.targets.length >= 3} onChange={e => actOnCareer({ type: 'strategy', strategy: d.strategy, targets: e.target.checked ? [...d.targets, r.event.id] : d.targets.filter(id => id !== r.event.id) })} />{r.event.name}</label>)}</fieldset>}
      <p className="text-gray-400">Season outline below. Only the next six weeks can be approved; no future winnings are included. Entry and your selected travel package are automated, preparation and matches remain yours.</p>
      {d.strategy === 'majors' && <p className="text-green-400">An approved peak event protects the three preceding days for light match preparation, review and rest. Off-table bookings cannot use this time.</p>}
      <div className="max-h-52 divide-y divide-border overflow-y-auto rounded border border-border">{rows.map(r => <label key={r.event.id} className="flex items-start gap-3 p-2"><input type="checkbox" aria-label={`Approve ${r.event.name}`} className="mt-1" disabled={!r.inApprovalWindow} checked={ids.includes(r.event.id)} onChange={e => setIds(e.target.checked ? [...ids, r.event.id] : ids.filter(id => id !== r.event.id))} /><span className="min-w-0 flex-1"><span className="font-semibold text-white">{r.event.name}</span><span className="block text-gray-400">{r.event.startDate} · {r.reason} {!r.inApprovalWindow && 'Outside this approval block.'}</span></span><span className="text-right text-gray-300">Entry {money(r.entry)}<br />Travel {money(r.travel)}<br /><span className={r.include ? 'text-green-400' : 'text-amber-300'}>{r.include ? 'Recommended' : 'Optional / omitted'}</span></span></label>)}</div>
      <div className="flex flex-wrap items-end gap-3"><label className="flex flex-col gap-1">Spending ceiling<input aria-label="Spending ceiling" type="number" min="0" className={input} value={cap} onChange={e => setCap(Number(e.target.value))} /></label><label className="flex flex-col gap-1">Minimum cash reserve<input aria-label="Minimum cash reserve" type="number" min="0" className={input} value={reserve} onChange={e => setReserve(Number(e.target.value))} /></label><button className={button} onClick={() => { const recommended = rows.filter(r => r.include && r.inApprovalWindow); setIds(recommended.map(r => r.event.id)); setCap(recommended.reduce((n, r) => n + r.total, 0)); }}>Use recommended block</button></div>
      <p>Selected bookings <span className="text-amber-300">{money(total)}</span> · Cash after bookings <span className="text-green-400">{money(gameState.player.cash - total)}</span> · Recurring commitments <span>{money(recurringCost(gameState))}/week</span> · Four-week reserve suggestion {money(recurringCost(gameState) * 4)}</p>
      <div className="flex flex-wrap gap-2"><button className="btn-primary min-h-9 text-xs" onClick={() => actOnCareer({ type: 'approve-schedule', eventIds: ids, cap, reserve })}>Approve six-week schedule</button><button className={button} disabled={!d.schedule?.enabled} onClick={() => actOnCareer({ type: 'run-assistance' })}>Handle next entry & travel</button><button className={button} disabled={!d.schedule?.enabled} onClick={() => actOnCareer({ type: 'pause-schedule' })}>Pause assistance</button></div>
      {d.schedule?.pauseReason && <p className="text-amber-300">{d.schedule.pauseReason}</p>}
      <fieldset className="space-y-2 border-t border-border pt-3"><legend className="pt-3 font-semibold text-white">Off-table commitments</legend><div className="flex flex-wrap gap-2"><select aria-label="Commitment type" className={input} value={kind} onChange={e => setKind(e.target.value as CommitmentKind)}>{(['recovery', 'camp', 'appearance'] as const).map(k => <option key={k} value={k}>{COMMITMENTS[k].name}</option>)}</select><input aria-label="Commitment start date" type="date" className={input} min={gameState.currentDate} value={date} onChange={e => setDate(e.target.value)} /></div>
        {kind === 'appearance' && <p className="text-amber-300">{gameState.sponsors.find(s => s.id === quote.sponsorId)?.name ?? 'Requires an active sponsor'} · one paid appearance per four weeks. Completion credits this sponsor's obligation, not a later replacement.</p>}
        <p>{quote.startDate}–{quote.endDate} · replaces {COMMITMENTS[kind].days * 3} training sessions</p><p><span className="text-red-400">Cost {money(quote.cost)}</span> · <span className="text-green-400">Income {money(quote.income)}</span> · <span className={quote.fatigue > 0 ? 'text-amber-300' : 'text-green-400'}>Fatigue {gameState.player.fatigue}% → {Math.max(0, Math.min(100, gameState.player.fatigue + quote.fatigue))}%</span> · Sharpness +{quote.sharpness} for 14 days</p><p className="text-gray-400">Forecast excludes intervening play and training. Upfront costs are non-refundable. Exhibitions require a breakthrough invitation.</p>
        {conflict && <p className="text-amber-300">{conflict}</p>}<button className={button} disabled={Boolean(conflict) || !date} onClick={() => actOnCareer({ type: 'commitment', kind, startDate: date })}>Reserve commitment</button>
      </fieldset>
      {d.commitments.slice(-8).map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2"><span>{COMMITMENTS[c.kind].name} · {c.startDate}–{c.endDate} · {c.status}</span>{c.status === 'scheduled' && c.startDate > gameState.currentDate && <button className={button} onClick={() => actOnCareer({ type: 'cancel-commitment', id: c.id })}>Cancel (no refund)</button>}</div>)}
      <p role="status" className="text-amber-300">{gameState.lastAction}</p>
    </div>
  </CareerDisclosure>;
}

export function CoachRelationshipsPanel() {
  const { gameState, actOnCareer } = useGame();
  const d = depthOf(gameState);
  return <details className={disclosure}><summary className="cursor-pointer px-3 py-2 font-semibold text-white">Working relationships & agreed development</summary><div className={body}>{gameState.coachContracts.length ? gameState.coachContracts.map(c => {
    const relation = d.coachRelationships[c.coachId];
    return <div key={c.coachId} className="space-y-2"><p><span className="font-semibold text-white">{gameState.coaches.find(coach => coach.id === c.coachId)?.name}</span> · <span className="text-green-400">{coachRelationshipLabel(relation?.trust ?? 55)}</span><span className="block text-gray-400">{relation?.note ?? 'Agree a development project in Training.'}</span></p><button className={button} onClick={() => actOnCareer({ type: 'coach-review', id: c.coachId })}>Review development together</button></div>;
  }) : <p className="text-gray-400">Hire a coach to build an ongoing development relationship.</p>}<p>Agreed goal: {d.project?.status === 'active' ? PROJECTS[d.project.kind].name : 'No active project'}. Workload and adherence influence future negotiations—not a single defeat.</p><Link className="text-green-400" to="/training">Review development project</Link></div></details>;
}

export function RivalryContext({ opponent }: { opponent: string }) {
  const { gameState } = useGame();
  const relationship = getRivalry(gameState, opponent);
  if (!relationship || !relationship.rivalry) return null;
  return <p className="shrink-0 rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">Competitive rivalry · {opponent} · H2H {relationship.wins}–{relationship.losses} · {relationship.deciders} deciding frames · Recent {relationship.recent.join(' ')}. Familiar opponents can adapt their tactics.</p>;
}

export function CareerSeasonSummary() {
  const { gameState } = useGame();
  const d = depthOf(gameState);
  return <CareerDisclosure title="Career story and development history" summary={<>Career history · {d.projectHistory.filter(p => p.status === 'completed').length} projects completed · {Object.values(d.relationships).filter(r => r.rivalry).length} rivalries</>}>
    <div className={body}>
      {[...d.stories].reverse().map(s => <details key={s.id} className="rounded border border-border p-3"><summary className="cursor-pointer font-semibold text-white">{s.createdDate} · {s.title} · {s.status}</summary><p className="mt-2 text-gray-400">{s.evidence}</p>{s.updates.map((update, i) => <p key={i} className="mt-2 border-l-2 border-green-600 pl-2 text-gray-300">{update}</p>)}</details>)}
      {d.projectHistory.map(p => <div key={p.id}><p className="text-white">{PROJECTS[p.kind].name} · {p.status} · {p.completedWeeks} training weeks</p>{p.closingAttributes && <p className="text-gray-400">{Object.entries(p.baseline).map(([skill, before]) => `${skill}: ${before} → ${p.closingAttributes![skill]}`).join(' · ')}</p>}</div>)}
      {Object.entries(d.coachRelationships).map(([id, relation]) => <p key={id}>{gameState.coaches.find(c => c.id === id)?.name ?? 'Former coach'} · {coachRelationshipLabel(relation.trust)} · {relation.note}</p>)}
      {Object.values(d.relationships).filter(r => r.rivalry).map(r => <p key={r.opponentId}>{r.name} · competitive rivalry · H2H {r.wins}–{r.losses}{gameState.worldPlayers.find(p => p.id === r.opponentId)?.retired ? ' · retired' : ''}</p>)}
      <Link className="text-green-400" to="/calendar">Set the next season strategy</Link>
    </div>
  </CareerDisclosure>;
}
