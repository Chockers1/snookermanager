import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Award, BookOpen, Check, ChevronRight, Flag, LineChart as ChartIcon, MessageSquare, Target, Trophy } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useGame } from '../../context/useGame'
import { ACHIEVEMENTS } from '../../game/careerAchievements'
import { careerLegacyOf } from '../../game/careerLegacy'
import { snapshotWeekLabel } from '../../game/seasonClock'
import { formatMoney, formatPercent } from '../../utils/formatters'
import { PlayerNames } from '../game/PlayerNames'
import { LegacyRecords } from './LegacyRecords'
import { ExhibitionAchievements } from './ExhibitionAchievements'
import { TournamentCareerHistory } from './TournamentCareerHistory'
import { SeasonArchive } from './SeasonArchive'

export function LegacyView({ icon, eyebrow, title, summary, children, controls }: { icon: ReactNode; eyebrow: string; title: string; summary?: string; children: ReactNode; controls?: ReactNode }) {
  return <section className="legacy-workspace">
    <header className="legacy-workspace-heading"><span className="legacy-workspace-icon">{icon}</span><div><p>{eyebrow}</p><h2>{title}</h2></div>{summary && <span className="legacy-workspace-summary">{summary}</span>}</header>
    {controls}<div className="legacy-workspace-content">{children}</div>
  </section>
}

function CollectionSwitch({ options, active, onChange }: { options: string[]; active: string; onChange: (value: string) => void }) {
  return <div className="legacy-collection-switch" role="group" aria-label="Choose collection">{options.map(option => <button key={option} aria-pressed={active === option} onClick={() => onChange(option)}>{option}</button>)}</div>
}

export function LegacyTrophiesTab() {
  const { gameState } = useGame(), { hash } = useLocation(), navigate = useNavigate()
  const collection = hash === '#exhibition-achievements' ? 'Exhibition wins' : 'Competitive titles'
  const career = careerLegacyOf(gameState)
  return <LegacyView icon={<Trophy />} eyebrow="Your honours" title="Trophies & achievements" summary={`${career.trophies.length} competitive titles`} controls={<CollectionSwitch options={['Competitive titles', 'Exhibition wins']} active={collection} onChange={value => navigate({ hash: value === 'Exhibition wins' ? '#exhibition-achievements' : '#trophy-cabinet' }, { replace: true })} />}>
    <div className="legacy-collection-content">{collection === 'Competitive titles' ? <LegacyRecords stats={career} view="trophies" /> : <ExhibitionAchievements />}</div>
  </LegacyView>
}

export function LegacyHistoryTab({ completed }: { completed: ReactNode }) {
  const { hash, search } = useLocation(), navigate = useNavigate()
  const collection = hash === '#season-archive' ? 'World archive' : hash === '#completed-events' ? 'Completed events' : 'Your tournaments'
  return <LegacyView icon={<BookOpen />} eyebrow="Every circuit · every season" title="Tournament history" controls={<CollectionSwitch options={['Your tournaments', 'World archive', 'Completed events']} active={collection} onChange={value => navigate({ search, hash: value === 'World archive' ? '#season-archive' : value === 'Completed events' ? '#completed-events' : '#tournament-history' }, { replace: true })} />}>
    <div className="legacy-collection-content">{collection === 'World archive' ? <SeasonArchive inline /> : collection === 'Completed events' ? completed : <TournamentCareerHistory />}</div>
  </LegacyView>
}

export function LegacyAchievementsTab() {
  const { gameState } = useGame()
  const awards = gameState.careerDepth?.achievements ?? []
  const earnedCount = ACHIEVEMENTS.filter(goal => awards.some(a => a.id === goal.id)).length
  const icons = [<MessageSquare />, <Target />, <Trophy />, <Flag />]
  return <LegacyView icon={<Award />} eyebrow="Career milestones" title="Your achievements" summary={`${earnedCount} of ${ACHIEVEMENTS.length} earned`}>
    <div className="legacy-goals-grid" aria-label="Career achievements">{ACHIEVEMENTS.map((goal, index) => {
      const earned = awards.find(a => a.id === goal.id)
      return <article key={goal.id} className={`legacy-goal ${earned ? 'legacy-goal--earned' : ''}`}>
        <header><span className="legacy-goal-icon">{icons[index]}</span><span>{earned ? <><Check /> Earned</> : 'To achieve'}</span></header>
        <div><p className="legacy-eyebrow">Milestone {String(index + 1).padStart(2, '0')}</p><h3>{goal.title}</h3><p>{goal.target}</p></div>
        <footer><strong>{earned ? earned.date ?? 'Recorded in existing save' : 'Build towards this goal'}</strong><p>{earned ? <PlayerNames text={earned.evidence} /> : 'Awarded when a qualifying result is recorded.'}</p></footer>
      </article>
    })}</div>
    <p className="legacy-footnote">Achievements persist across seasons. Older saves use surviving evidence; missing dates are not invented.</p>
  </LegacyView>
}

export function LegacyStoriesTab() {
  const { gameState } = useGame(), life = gameState.careerDepth?.seasonLife
  const [collection, setCollection] = useState('Story conclusions')
  const [visible, setVisible] = useState(20)
  const stories = [...(life?.stories.filter(s => s.resolved).map(s => ({ id: s.id, title: s.title, date: s.resolved!, text: s.steps.at(-1)?.text ?? '' })) ?? []), ...(life?.archivedStories ?? [])]
  const uniqueStories = [...new Map(stories.map(s => [s.id, s])).values()].sort((a, b) => b.date.localeCompare(a.date))
  const interviews = [...(life?.interviews.filter(i => i.response) ?? [])].sort((a, b) => (b.answered ?? b.created).localeCompare(a.answered ?? a.created))
  const summaries = [...(life?.summaries ?? [])].reverse()
  const teamWins = (life?.teams.filter(e => e.champion && e.champion === e.teams[0]?.name).length ?? 0) + (life?.archivedTeams?.filter(e => e.won).length ?? 0)
  const rows = collection === 'Story conclusions' ? uniqueStories.map(s => ({ id: s.id, date: s.date, title: s.title, text: s.text, response: '' })) : collection === 'Interviews' ? interviews.map(i => ({ id: i.id, date: i.answered ?? i.created, title: i.title, text: i.context, response: `${({ praise: 'Praised opponent', candid: 'Spoke candidly', challenge: 'Competitive challenge', private: 'Remained private' })[i.response!]}${i.reaction ? ` · ${i.reaction}` : ''}` })) : summaries.map((s, i) => ({ id: `${s.season}-${i}`, date: s.season, title: 'Season summary', text: s.text, response: '' }))
  return <LegacyView icon={<MessageSquare />} eyebrow="Life around the table" title="Your career journal" summary={`${uniqueStories.length} conclusions · ${interviews.length} ${interviews.length === 1 ? 'interview' : 'interviews'}`} controls={<CollectionSwitch options={['Story conclusions', 'Interviews', 'Season summaries']} active={collection} onChange={value => { setCollection(value); setVisible(20) }} />}>
    <div className="legacy-journal-layout"><div className="legacy-journal-list">
      {rows.slice(0, visible).map(row => <article key={row.id} className="legacy-journal-entry"><time>{row.date}</time><div><h3><PlayerNames text={row.title} /></h3><p><PlayerNames text={row.text} /></p>{row.response && <p className="legacy-journal-response"><PlayerNames text={row.response} /></p>}</div></article>)}
      {!rows.length && <div className="legacy-empty"><BookOpen /><h3>No {collection.toLowerCase()} recorded yet</h3><p>Meaningful moments from your career will appear here as they happen.</p></div>}
      {rows.length > visible && <button className="btn-secondary text-xs" onClick={() => setVisible(v => v + 20)}>Show more entries ({rows.length - visible} remaining)</button>}
    </div><aside className="legacy-journal-aside"><Trophy /><p className="legacy-eyebrow">Shared achievements</p><h3>Club & national teams</h3><strong>{teamWins}</strong><p>Team trophies are kept separately from singles and major titles.</p><Link to="/career/teams">Teams & doubles results <ChevronRight /></Link></aside></div>
  </LegacyView>
}

export function LegacyTrendsTab() {
  const { gameState } = useGame()
  const [metric, setMetric] = useState('Ranking'), [limit, setLimit] = useState(12)
  const snapshots = gameState.history.snapshots.slice(-limit)
  const events = gameState.history.tournamentHistory.filter(e => e.status === 'Completed').slice(0, limit).reverse()
  const data = metric === 'Event prizes' ? events.map(e => ({ label: e.tournamentName, date: e.startDate, value: e.prizeMoney })) : snapshots.map(s => ({ label: snapshotWeekLabel(s, gameState), date: s.date, value: metric === 'Ranking' ? s.ranking > 0 ? s.ranking : null : metric === 'Career prizes' ? s.totalPrizeMoney : s.confidence }))
  const recorded = data.filter(d => d.value !== null)
  const money = metric === 'Career prizes' || metric === 'Event prizes'
  const format = (value: number) => money ? formatMoney(value) : metric === 'Ranking' ? `#${value}` : formatPercent(value)
  const tone = metric === 'Ranking' ? '#6ee7b7' : money ? '#fcd34d' : '#7dd3fc'
  const latest = recorded.at(-1)
  return <LegacyView icon={<ChartIcon />} eyebrow="Recorded career history" title="Trends & performance" controls={<div className="legacy-trend-controls"><CollectionSwitch options={['Ranking', 'Career prizes', 'Confidence', 'Event prizes']} active={metric} onChange={setMetric} /><label>Window<select aria-label="Trend history window" value={limit} onChange={e => setLimit(Number(e.target.value))}>{[6, 12, 24].map(n => <option key={n} value={n}>Last {n} records</option>)}</select></label></div>}>
    <div className="legacy-trend-layout"><section className="legacy-trend-chart"><header><div><p className="legacy-eyebrow">{metric === 'Ranking' ? 'Lower is better' : metric === 'Career prizes' ? 'Cumulative tournament earnings' : metric === 'Event prizes' ? 'Completed tournament earnings' : 'Player confidence'}</p><h3>{metric}</h3></div><strong style={{ color: tone }}>{latest ? format(latest.value!) : 'No records'}</strong></header>
      {recorded.length > 1 ? <div className="legacy-chart-canvas"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}><AreaChart data={data} margin={{ top: 10, right: 15, bottom: 10, left: 10 }}><CartesianGrid stroke="#2a3b4c" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#b8c7d6' }} tickLine={false} axisLine={false} hide={metric === 'Event prizes'} /><YAxis reversed={metric === 'Ranking'} domain={metric === 'Confidence' ? [0, 100] : ['auto', 'auto']} width={70} tick={{ fontSize: 10, fill: '#b8c7d6' }} tickFormatter={v => money ? Math.abs(v) >= 1000000 ? `£${(v / 1000000).toFixed(1)}m` : `£${Math.round(v / 1000)}k` : metric === 'Confidence' ? `${v}%` : `#${v}`} allowDecimals={metric !== 'Ranking'} axisLine={false} tickLine={false} /><Tooltip formatter={v => typeof v === 'number' ? [format(v), metric] : ['Unrecorded', metric]} contentStyle={{ background: '#14202b', border: '1px solid #2a3b4c', borderRadius: 8, color: '#fff', fontSize: 12 }} /><Area type="linear" dataKey="value" stroke={tone} fill={tone} fillOpacity={0.08} strokeWidth={2} dot={{ r: 3, fill: tone }} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div> : <div className="legacy-empty"><ChartIcon /><h3>{recorded.length ? 'Your first point is recorded' : 'Your trend starts here'}</h3><p>At least two recorded points are needed to show a trend.</p></div>}
      <p className="legacy-footnote">{metric === 'Ranking' ? 'Positions are taken from saved career snapshots; the active ranking circuit can change during a career.' : 'Saved observations only. Missing history is not treated as zero.'}</p>
    </section><aside className="legacy-trend-ledger"><header><h3>Recorded values</h3><span>{recorded.length} observations</span></header><div>{[...data].reverse().map((row, i) => <div key={`${row.date}-${i}`}><span><strong>{row.label}</strong><small>{row.date}</small></span><b>{row.value === null ? 'Unranked' : format(row.value)}</b></div>)}{!data.length && <p className="legacy-footnote">No observations in this window.</p>}</div></aside></div>
  </LegacyView>
}
