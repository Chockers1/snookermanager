import { PathwayEvents } from '../components/career/PathwayEvents'
import { SectionTabs } from '../components/ui/SectionTabs';
import { CareerEditor } from '../components/career/CareerDepthPanels';
import { careerLegacyOf, careerLegacyRating } from '../game/careerLegacy'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Check, ChevronRight, Route, Trophy, Target, Users } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import { careerPathStageCatalog } from '../data/catalogs'
import { calculateAverage, calculateTechnicalAverage } from '../utils/calculations'
import { formatMoney, formatAttribute, formatPercent } from '../utils/formatters'
import type { Coach, Tournament } from '../types/game'

const COACH_LEVEL_VALUE: Record<Coach['level'], number> = {
  Low: 1,
  Mid: 2,
  High: 3,
  Elite: 4,
}

type StageMetricSnapshot = {
  careerStage: string
  rankingLabel: string
  age: number
  reputation: number
  confidence: number
  cash: number
  legacyScore: number
  worldTitles: number
  technicalAverage: number
  mentalAverage: number
  breakBuilding: number
  safetyPlay: number
  bigMatchNerve: number
  worldRanking: number | null
  wins: number
  matchesPlayed: number
  sponsors: number
  coachLevel: number
  qTourCommitted: boolean
  qSchoolCommitted: boolean
  proCommitted: boolean
  majorCommitted: boolean
  seniorCommitted: boolean
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function getCommittedEvents(tournaments: Tournament[]) {
  return tournaments.filter((tournament) => tournament.status === 'Entered' || tournament.status === 'Booked')
}

function getCanonicalCareerTotals(gameState: ReturnType<typeof useGame>['gameState']) {
  const completedEvents = gameState.history.tournamentHistory
    .map((entry) => entry.canonicalResult ?? { matchesPlayed: entry.matchesPlayed, wins: entry.wins })
    .filter((entry) => entry.matchesPlayed > 0)

  return {
    wins: completedEvents.reduce((sum, entry) => sum + entry.wins, 0),
    matchesPlayed: completedEvents.reduce((sum, entry) => sum + entry.matchesPlayed, 0),
  }
}

function getSeededStageNumber(careerStage: string, rankingLabel: string) {
  const stage = careerStage.toLowerCase()
  const label = rankingLabel.toLowerCase()
  if (stage.includes('senior')) return 14
  if (stage.includes('veteran')) return 13
  if (stage.includes('world champion')) return 12
  if (stage.includes('major contender') || stage.includes('triple crown') || stage.includes('major winner')) return 11
  if (stage.includes('top 16')) return 10
  if (stage.includes('top 32')) return 9
  if (stage.includes('top 64') || stage.includes('tour survivor')) return 8
  if (stage.includes('rookie professional')) return 7
  if (stage.includes('q school')) return 6
  if (stage.includes('q tour')) return 5
  if (stage.includes('elite amateur') || label.includes('amateur')) return 4
  if (stage.includes('national youth')) return 3
  if (stage.includes('regional youth')) return 2
  return 1
}

function getStageFromState(metrics: StageMetricSnapshot) {
  let stage = getSeededStageNumber(metrics.careerStage, metrics.rankingLabel)
  if (metrics.matchesPlayed >= 3 && stage < 2) stage = 2
  if (metrics.matchesPlayed >= 8 && stage < 3) stage = 3
  if (metrics.rankingLabel === 'Amateur Ranking' && stage < 4) stage = 4
  if (metrics.qTourCommitted || (metrics.reputation >= 35 && metrics.mentalAverage >= 52)) stage = 5
  if (metrics.qSchoolCommitted) stage = 6
  if (metrics.proCommitted || metrics.worldRanking != null) stage = 7
  if (metrics.worldRanking != null && metrics.worldRanking <= 64) stage = 8
  if (metrics.worldRanking != null && metrics.worldRanking <= 32) stage = 9
  if (metrics.worldRanking != null && metrics.worldRanking <= 16) stage = 10
  if (metrics.majorCommitted || (metrics.legacyScore >= 50 && metrics.reputation >= 80)) stage = Math.max(stage, 11)
  if (metrics.worldTitles > 0) stage = Math.max(stage, 12)
  if (metrics.age >= 35 && (metrics.proCommitted || metrics.reputation >= 65)) stage = Math.max(stage, 13)
  if (metrics.reputation >= 70 && (metrics.age >= 40 || metrics.seniorCommitted)) stage = Math.max(stage, 14)
  return stage
}

function readThreshold(label: string) {
  const value = label.match(/(\d+)/)?.[1]
  return value ? Number(value) : null
}

function getRequirementStatus(label: string, metrics: StageMetricSnapshot) {
  const text = label.toLowerCase()
  const threshold = readThreshold(label)
  if (text.includes('technical average')) return metrics.technicalAverage >= (threshold ?? 50)
  if (text.includes('mental average')) return metrics.mentalAverage >= (threshold ?? 50)
  if (text.includes('confidence')) return metrics.confidence >= (threshold ?? 50)
  if (text.includes('reputation')) return metrics.reputation >= (threshold ?? 35)
  if (text.includes('break building')) return metrics.breakBuilding >= (threshold ?? 45)
  if (text.includes('safety play')) return metrics.safetyPlay >= (threshold ?? 40)
  if (text.includes('big match nerve')) return metrics.bigMatchNerve >= (threshold ?? 70)
  if (text.includes('fund') || text.includes('cash')) return metrics.cash >= (threshold ?? 1500)
  if (text.includes('q tour')) return metrics.qTourCommitted || metrics.reputation >= 35
  if (text.includes('q school')) return metrics.qSchoolCommitted
  if (text.includes('tour card')) return metrics.proCommitted
  if (text.includes('top 64')) return metrics.worldRanking != null && metrics.worldRanking <= 64
  if (text.includes('top 32')) return metrics.worldRanking != null && metrics.worldRanking <= 32
  if (text.includes('top 16')) return metrics.worldRanking != null && metrics.worldRanking <= 16
  if (text.includes('legacy score')) return metrics.legacyScore >= (threshold ?? 50)
  if (text.includes('age')) return metrics.age >= (threshold ?? 35)
  if (text.includes('win')) return metrics.wins >= (threshold ?? 5)
  if (text.includes('play') || text.includes('event')) return metrics.matchesPlayed >= (threshold ?? 3)
  return false
}

export function CareerProgressionPage() {
  const navigate = useNavigate()
  const { gameState } = useGame()
  const [tab, setTab] = useState<'Overview' | 'Full Pathway' | 'Events' | 'Career Snapshot'>('Overview')
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [tierFilter, setTierFilter] = useState<'All' | string>('All')
  const tierOptions = ['All', ...Array.from(new Set(careerPathStageCatalog.map((stage) => stage.tier)))]
  const committedEvents = getCommittedEvents(gameState.tournaments)
  const currentCoach = gameState.coaches.find((coach) => coach.id === gameState.currentCoachId) ?? null
  const coachLevel = currentCoach ? COACH_LEVEL_VALUE[currentCoach.level] : 0
  const careerTotals = getCanonicalCareerTotals(gameState)
  const legacy = careerLegacyOf(gameState)
  const legacyRating = careerLegacyRating(legacy)
  const trophies = [...new Map(legacy.trophies.map(trophy => [trophy.id, trophy])).values()]
  const majorTitles = trophies.filter(trophy => trophy.category === 'Major').length
  const worldRanking = gameState.player.worldRanking ?? null
  const metrics: StageMetricSnapshot = {
    careerStage: gameState.player.careerStage,
    rankingLabel: gameState.player.rankingLabel,
    age: gameState.player.age,
    reputation: gameState.player.reputation,
    confidence: gameState.player.confidence,
    cash: gameState.player.cash,
    legacyScore: legacyRating.score,
    worldTitles: legacyRating.worldTitles,
    technicalAverage: calculateTechnicalAverage(gameState.attributes.technical),
    mentalAverage: calculateAverage(Object.values(gameState.attributes.mental)),
    breakBuilding: gameState.attributes.technical['Break Building'] ?? 0,
    safetyPlay: gameState.attributes.technical['Safety Play'] ?? 0,
    bigMatchNerve: gameState.attributes.mental['Big Match Nerve'] ?? 0,
    worldRanking,
    wins: careerTotals.wins,
    matchesPlayed: careerTotals.matchesPlayed,
    sponsors: gameState.sponsors.length,
    coachLevel,
    qTourCommitted: committedEvents.some((event) => event.type === 'Q Tour'),
    qSchoolCommitted: committedEvents.some((event) => event.type === 'Q School'),
    proCommitted: committedEvents.some((event) => (event.stageId ?? 0) >= 7 && (event.stageId ?? 0) <= 12) || worldRanking != null,
    majorCommitted: committedEvents.some((event) => event.type === 'Major' || event.type === 'Invitational'),
    seniorCommitted: committedEvents.some((event) => (event.stageId ?? 0) >= 13),
  }
  const currentStageNumber = getStageFromState(metrics)
  const nextStageNumber = Math.min(careerPathStageCatalog.length, currentStageNumber + 1)
  const currentStageProgress = currentStageNumber === careerPathStageCatalog.length ? 100 : clampProgress(((careerPathStageCatalog[nextStageNumber - 1]?.requirements ?? []).filter((requirement) => getRequirementStatus(requirement, metrics)).length / Math.max(1, (careerPathStageCatalog[nextStageNumber - 1]?.requirements ?? []).length)) * 100)
  const overallProgress = clampProgress((((currentStageNumber - 1) + currentStageProgress / 100) / careerPathStageCatalog.length) * 100)
  const stages = careerPathStageCatalog.map((stage) => ({
    ...stage,
    current: stage.stage === currentStageNumber,
    complete: stage.stage < currentStageNumber,
    progress: stage.stage < currentStageNumber ? 100 : stage.stage === currentStageNumber ? currentStageProgress : 0,
  }))
  const visibleStages = stages.filter((stage) => (tierFilter === 'All' ? true : stage.tier === tierFilter))
  const currentStage = stages.find((stage) => stage.current) ?? stages[0]
  const nextStage = stages.find((stage) => stage.stage === nextStageNumber) ?? stages[stages.length - 1]
  const requirements = (nextStage.requirements ?? nextStage.moveUpWhen ?? []).map((label) => ({ label, complete: getRequirementStatus(label, metrics) }))
  const currentStageEvents = gameState.tournaments.filter((event) => (event.stageId ?? 1) === currentStage.stage).sort((left, right) => left.startDate.localeCompare(right.startDate))
  const nextStageEvents = gameState.tournaments.filter((event) => (event.stageId ?? 1) === nextStage.stage).sort((left, right) => left.startDate.localeCompare(right.startDate))
  const playerRankingText = worldRanking != null ? `World #${worldRanking}` : `${gameState.player.rankingLabel} #${gameState.player.amateurRanking ?? '-'}`
  const statusLabel = currentStageProgress >= 70 ? 'On Track' : currentStageProgress >= 40 ? 'Building' : 'Needs Momentum'

  const compactStageNames: Record<number, string> = {
    5: 'Q Tour / Global Amateur',
    7: 'Rookie Professional',
    8: 'Tour Survivor / Top 64',
    11: 'Major / Triple Crown Contender',
    14: 'Senior Tour / Legends',
  }
  const selectedStage = stages.find(stage => stage.id === selectedStageId)
  const stageStatus = (stage: typeof currentStage) => stage.current ? 'Current stage' : stage.complete ? 'Earlier stage' : 'Later stage'

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden" data-testid="career-progression-page">
      <header className="card flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0"><h1 className="text-2xl font-bold text-white">Career Pathway</h1><p className="mt-1 text-xs text-gray-300">{currentStage.name} · {playerRankingText}</p></div>
        <div className="flex items-center gap-4"><div className="text-right"><p className="text-lg font-bold text-green-300">{overallProgress}%</p><p className="text-[10px] text-gray-300">Stage {currentStageNumber} of {careerPathStageCatalog.length}</p></div><button className="btn-secondary text-xs" onClick={() => navigate('/calendar')}><CalendarDays className="h-3.5 w-3.5" /> Calendar</button></div>
      </header>
      {gameState.careerSystems.lateCareer.retirementPending && <p role="status" className="shrink-0 rounded-lg border border-amber-500/30 p-2 text-xs text-amber-200">Retirement follows your booked competitions. Finish your existing entries; new entries are closed.</p>}
      {gameState.careerSystems.lateCareer.retired && <p role="status" className="shrink-0 rounded-lg border border-border p-2 text-xs text-gray-300">Retired from competition. Your career records remain available, and you can advance the calendar to follow the tour.</p>}
      <SectionTabs id="career-progression" label="Career progression sections" tabs={['Overview', 'Full Pathway', 'Events', 'Career Snapshot'] as const} active={tab} onChange={setTab} />
      <div id="career-progression-panel" role="tabpanel" aria-labelledby={`career-progression-tab-${['Overview', 'Full Pathway', 'Events', 'Career Snapshot'].indexOf(tab)}`} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {tab === 'Overview' && <div className="pathway-overview">
          <section className="pathway-now" aria-label="Current stage">
            <header className="pathway-overview-heading"><span className="pathway-overview-icon"><Route aria-hidden="true" /></span><div><p>Your position</p><h2>Where you are now</h2></div><span className="pathway-tier">{currentStage.tier}</span></header>
            <div className="pathway-overview-body">
              <div className="pathway-current-title"><span>{String(currentStageNumber).padStart(2, '0')}</span><div><p>Current career stage</p><h3>{currentStage.name}</h3></div></div>
              <p className="pathway-stage-description">{currentStage.description}</p>
              <div className="pathway-context"><div><span>Your circuit</span><strong>{currentStage.tourCircuit ?? currentStage.tournaments}</strong></div><div><span>Career focus</span><strong>{currentStage.progressionType}</strong></div><div><span>Commercial support</span><strong>{gameState.sponsors.length > 0 ? `${gameState.sponsors.length} active sponsors` : `${currentStage.sponsor} sponsor access`}</strong></div></div>
              <div className="pathway-current-note"><Target aria-hidden="true" /><p>Choose events that serve this stage. Check eligibility, costs and recovery time before booking.</p></div>
            </div>
            <footer className="pathway-overview-actions"><button onClick={() => setSelectedStageId(currentStage.id)}>Stage details <ChevronRight aria-hidden="true" /></button><button className="pathway-action-primary" onClick={() => setTab('Events')}>View stage events <CalendarDays aria-hidden="true" /></button></footer>
          </section>
          <section className="pathway-next" aria-label="Next step">
            <header className="pathway-overview-heading"><span className="pathway-overview-icon"><Trophy aria-hidden="true" /></span><div><p>Your next target</p><h2>{nextStage.name}</h2></div></header>
            <div className="pathway-overview-body">
              <div className="pathway-target-progress"><div><strong>{statusLabel}</strong><span>{requirements.filter(requirement => requirement.complete).length} / {requirements.length} requirements met</span></div><ProgressBar value={currentStageProgress} compact /></div>
              <div className="pathway-requirements"><h3>What you need</h3>{requirements.map((requirement, index) => <div key={requirement.label} className={`pathway-requirement ${requirement.complete ? 'pathway-requirement--met' : ''}`}><span className="pathway-requirement-marker">{requirement.complete ? <Check aria-hidden="true" /> : String(index + 1).padStart(2, '0')}</span><p>{requirement.label}</p><span className="pathway-requirement-status">{requirement.complete ? 'Met' : 'To achieve'}</span></div>)}</div>
              <button className="pathway-unlocks" onClick={() => setSelectedStageId(nextStage.id)}><span><strong>What comes next</strong><span>{(nextStage.unlocks ?? []).length} unlocks · view full stage details</span></span><ChevronRight aria-hidden="true" /></button>
            </div>
            <footer className="pathway-overview-actions"><button className="pathway-action-primary" onClick={() => navigate('/calendar')}>Check entry & qualification <ChevronRight aria-hidden="true" /></button></footer>
          </section>
        </div>}
        {tab === 'Full Pathway' && <>
          <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs"><p className="text-gray-300">Select a stage to read its requirements and unlocks.</p><label className="flex items-center gap-2 text-white">Tier<select aria-label="Tier" className="rounded-lg border border-border bg-surface p-2" value={tierFilter} onChange={event => setTierFilter(event.target.value)}>{tierOptions.map(tier => <option key={tier}>{tier}</option>)}</select></label></div>
          <div className="pathway-map" aria-label="Pathway stages" role="region">
            {[
              { name: 'Build your game', detail: 'Youth & amateur', from: 1, to: 5, colour: 'blue' },
              { name: 'Make your mark', detail: 'Qualification & professional tour', from: 6, to: 10, colour: 'green' },
              { name: 'Leave a legacy', detail: 'Major titles & later career', from: 11, to: 14, colour: 'gold' },
            ].map(phase => {
              const phaseStages = visibleStages.filter(stage => stage.stage >= phase.from && stage.stage <= phase.to)
              if (!phaseStages.length) return null
              return <section key={phase.name} className={`pathway-phase pathway-phase--${phase.colour}`} aria-label={phase.detail}>
                <header className="pathway-phase-heading"><div><p>{phase.detail}</p><h2>{phase.name}</h2></div><span>{String(phase.from).padStart(2, '0')}–{phase.to}</span></header>
                <div className="pathway-phase-stages">
                  {phaseStages.map(stage => <button key={stage.id} onClick={() => setSelectedStageId(stage.id)} aria-haspopup="dialog" aria-label={`${stage.stage}. ${stage.name} · ${stageStatus(stage)}`} aria-current={stage.current ? 'step' : undefined} title={stage.name} className={`pathway-stage ${stage.current ? 'pathway-stage--current' : ''}`}>
                    <span className="pathway-stage-number">{String(stage.stage).padStart(2, '0')}</span>
                    <span className="pathway-stage-copy"><span className="pathway-stage-status">{stage.current ? 'You are here' : stage.complete ? 'Earlier stage' : 'Ahead of you'}</span><span className="pathway-stage-title">{compactStageNames[stage.stage] ?? stage.name}</span><span className="pathway-stage-tier">{stage.tier}</span></span>
                    <ChevronRight className="pathway-stage-arrow" aria-hidden="true" />
                  </button>)}
                </div>
              </section>
            })}
          </div>
        </>}
        {tab === 'Events' && <PathwayEvents groups={[
          { title: 'Current stage events', stage: currentStage.name, events: currentStageEvents },
          ...(nextStage.id !== currentStage.id ? [{ title: 'Next-stage opportunities', stage: nextStage.name, events: nextStageEvents }] : []),
        ]} />}
        {tab === 'Career Snapshot' && <div className="career-snapshot" data-testid="career-snapshot">
          <section className="snapshot-panel snapshot-panel--gold">
            <header className="snapshot-heading"><span className="snapshot-icon"><Trophy aria-hidden="true" /></span><div><p>Your career</p><h2>Results & standing</h2></div></header>
            <div className="snapshot-body">
              <div className="snapshot-feature"><p>Current ranking</p><strong>{playerRankingText}</strong><span>{currentStage.name}</span></div>
              <div className="snapshot-results-grid" aria-label="Career results totals">
                {[
                  ['Match wins', metrics.wins], ['Matches played', metrics.matchesPlayed],
                  ['Win rate', metrics.matchesPlayed ? formatPercent(metrics.wins / metrics.matchesPlayed * 100) : '—'],
                  ['Tournament titles', trophies.length], ['Major titles', majorTitles], ['World titles', legacyRating.worldTitles],
                ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
              <p className="snapshot-titles-note">Major and World titles are included in tournament titles.</p>
              <div className="snapshot-note"><span>Next-step readiness</span><strong>{statusLabel}</strong><p>{requirements.filter(item => item.complete).length} of {requirements.length} requirements met</p></div>
            </div>
            <button className="snapshot-link" onClick={() => setTab('Overview')}>Review next step <ChevronRight aria-hidden="true" /></button>
          </section>
          <section className="snapshot-panel snapshot-panel--blue">
            <header className="snapshot-heading"><span className="snapshot-icon"><Target aria-hidden="true" /></span><div><p>Your game</p><h2>Skills & development</h2></div></header>
            <div className="snapshot-body">
              {[['Technical average', metrics.technicalAverage], ['Mental average', metrics.mentalAverage]].map(([label, value]) => <div className="snapshot-skill" key={label}><div><span>{label}</span><strong>{formatAttribute(Number(value))}<small> /100</small></strong></div><ProgressBar value={Number(value)} compact /></div>)}
              <div className="snapshot-detail"><div className="flex items-center justify-between gap-3"><span>Confidence</span><b>{formatPercent(metrics.confidence)}</b></div><ProgressBar value={metrics.confidence} compact /></div>
              <div className="snapshot-note"><span>Development focus</span><strong>Build a balanced game</strong><p>These are current ability averages. Open Attributes to review changes over time.</p></div>
            </div>
            <button className="snapshot-link" onClick={() => navigate('/player/attributes')}>View player attributes <ChevronRight aria-hidden="true" /></button>
          </section>
          <section className="snapshot-panel snapshot-panel--green">
            <header className="snapshot-heading"><span className="snapshot-icon"><Users aria-hidden="true" /></span><div><p>Your support</p><h2>Team & finances</h2></div></header>
            <div className="snapshot-body">
              <div className="snapshot-feature"><p>Available funds</p><strong>{formatMoney(metrics.cash)}</strong><span>Current cash balance</span></div>
              <div className="snapshot-pair"><div><span>Coach level</span><strong>{currentCoach?.level ?? 'None'}</strong></div><div><span>Active sponsors</span><strong>{metrics.sponsors}</strong></div></div>
              <div className="snapshot-note"><span>Lead coach</span><strong>{currentCoach?.name ?? 'Training independently'}</strong><p>{currentCoach ? 'Review coaching strengths, agreements and costs in Staff.' : 'Your training continues without a coach. Recruit when your budget allows.'}</p></div>
            </div>
            <div className="snapshot-footer"><button className="snapshot-link" onClick={() => navigate('/staff/coaches')}>Manage staff <ChevronRight aria-hidden="true" /></button><button className="snapshot-link" onClick={() => navigate('/finance')}>Finances <ChevronRight aria-hidden="true" /></button></div>
          </section>
        </div>}

      </div>
      {selectedStage && <CareerEditor title={`${selectedStage.stage}. ${selectedStage.name}`} onClose={() => setSelectedStageId(null)}><div className="min-h-0 space-y-4 overflow-y-auto p-4 text-sm text-gray-300"><p className="font-semibold text-green-300">{selectedStage.tier} · {stageStatus(selectedStage)}</p><p>{selectedStage.description}</p><p><b className="text-white">Circuit: </b>{selectedStage.tourCircuit ?? selectedStage.tournaments}</p><h3 className="font-semibold text-white">Requirements</h3><ul className="space-y-2">{(selectedStage.requirements ?? selectedStage.moveUpWhen ?? []).map(requirement => <li key={requirement} className="flex justify-between gap-3"><span>{requirement}</span><span className="shrink-0 text-xs">{getRequirementStatus(requirement, metrics) ? 'Met' : 'To work on'}</span></li>)}</ul><h3 className="font-semibold text-white">Unlocks</h3><ul className="list-inside list-disc space-y-2">{(selectedStage.unlocks ?? []).map(unlock => <li key={unlock}>{unlock}</li>)}</ul><p className="text-xs">Event entry and qualification rules are confirmed in Calendar.</p><button className="btn-primary text-xs" onClick={() => navigate('/calendar')}>View calendar</button></div></CareerEditor>}
    </div>
  )
}
