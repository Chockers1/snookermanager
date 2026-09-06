import { careerLegacyOf, careerLegacyRating } from '../game/careerLegacy'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Check, ChevronRight, Circle, Lock, Route, Trophy } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import { careerPathStageCatalog } from '../data/catalogs'
import { calculateAverage, calculateTechnicalAverage } from '../utils/calculations'
import { formatMoney } from '../utils/formatters'
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

function tierClass(tier: string) {
  if (tier.includes('Foundation') || tier.includes('Development')) return 'bg-green-600/20 text-green-400'
  if (tier.includes('Pre-Pro') || tier.includes('Qualification') || tier.includes('Professional')) return 'bg-blue-600/20 text-blue-400'
  if (tier.includes('Elite')) return 'bg-amber-600/20 text-amber-400'
  return 'bg-red-600/20 text-red-400'
}

export function CareerProgressionPage() {
  const navigate = useNavigate()
  const { gameState } = useGame()
  const [tierFilter, setTierFilter] = useState<'All' | string>('All')
  const tierOptions = ['All', ...Array.from(new Set(careerPathStageCatalog.map((stage) => stage.tier)))]
  const committedEvents = getCommittedEvents(gameState.tournaments)
  const currentCoach = gameState.coaches.find((coach) => coach.id === gameState.currentCoachId) ?? null
  const coachLevel = currentCoach ? COACH_LEVEL_VALUE[currentCoach.level] : 0
  const careerTotals = getCanonicalCareerTotals(gameState)
  const worldRanking = gameState.player.worldRanking ?? null
  const metrics: StageMetricSnapshot = {
    careerStage: gameState.player.careerStage,
    rankingLabel: gameState.player.rankingLabel,
    age: gameState.player.age,
    reputation: gameState.player.reputation,
    confidence: gameState.player.confidence,
    cash: gameState.player.cash,
    legacyScore: careerLegacyRating(careerLegacyOf(gameState)).score,
    worldTitles: careerLegacyRating(careerLegacyOf(gameState)).worldTitles,
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
  const requirements = (nextStage.requirements ?? nextStage.moveUpWhen ?? []).slice(0, 6).map((label) => ({ label, complete: getRequirementStatus(label, metrics) }))
  const currentStageEvents = gameState.tournaments.filter((event) => (event.stageId ?? 1) === currentStage.stage).sort((left, right) => left.startDate.localeCompare(right.startDate)).slice(0, 4)
  const nextStageEvents = gameState.tournaments.filter((event) => (event.stageId ?? 1) === nextStage.stage).sort((left, right) => left.startDate.localeCompare(right.startDate)).slice(0, 4)
  const playerRankingText = worldRanking != null ? `World #${worldRanking}` : `${gameState.player.rankingLabel} #${gameState.player.amateurRanking ?? '-'}`
  const statusLabel = currentStageProgress >= 70 ? 'On Track' : currentStageProgress >= 40 ? 'Building' : 'Needs Momentum'

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">Career</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Career Pathway</h1>
          <p className="mt-1 text-sm text-gray-400">Fourteen-stage pathway from junior clubs to senior legends, driven by live save state.</p>
        </div>
        <div className="card card-body min-w-44 text-center">
          <p className="text-[10px] uppercase text-gray-500">Career Progression</p>
          <p className="mt-1 text-3xl font-bold text-green-400">{overallProgress}%</p>
          <p className="text-xs text-gray-400">Stage {currentStageNumber} of {careerPathStageCatalog.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tierOptions.map((tier) => <button key={tier} type="button" onClick={() => setTierFilter(tier)} className={tierFilter === tier ? 'tab-active text-xs' : 'tab-inactive text-xs'}>{tier}</button>)}
        <button type="button" className="btn-secondary ml-auto text-xs" onClick={() => navigate('/calendar')}><CalendarDays className="h-3.5 w-3.5" /> Calendar</button>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {visibleStages.map((stage) => (
              <div key={stage.id} className={`card card-body relative ${stage.current ? 'border-green-500' : stage.complete ? 'border-green-600/30' : 'opacity-65'}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${stage.complete ? 'bg-green-600 text-white' : stage.current ? 'border border-green-500 bg-green-600/20 text-green-400' : 'bg-surface-light text-gray-500'}`}>
                    {stage.complete ? <Check className="h-3 w-3" /> : stage.stage}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${tierClass(stage.tier)}`}>{stage.tier}</span>
                </div>
                <h3 className="min-h-8 text-xs font-semibold text-white">{stage.name}</h3>
                <p className="mt-1 line-clamp-2 min-h-8 text-[10px] leading-4 text-gray-500">{stage.tourCircuit ?? stage.tournaments}</p>
                <div className="mt-2"><ProgressBar value={stage.progress} compact /><span className="text-[10px] text-gray-400">{stage.progress}%</span></div>
                {!stage.complete && !stage.current ? <Lock className="absolute right-3 top-3 h-3 w-3 text-gray-600" /> : null}
                {stage.current ? <span className="absolute right-2 top-2 rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">CURRENT</span> : null}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['Ranking', playerRankingText],
              ['Status', statusLabel],
              ['Cash', formatMoney(gameState.player.cash)],
              ['Coach', currentCoach?.level ?? 'None'],
              ['Technical Avg', metrics.technicalAverage],
              ['Mental Avg', metrics.mentalAverage],
              ['Career Wins', metrics.wins],
              ['Sponsors', metrics.sponsors],
            ].map(([label, value]) => <div key={label} className="card card-body"><p className="metric-label">{label}</p><p className="mt-2 text-lg font-semibold text-white">{value}</p></div>)}
          </div>

          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Current Stage Events</h3><span className="text-[10px] text-gray-400">{currentStage.tourCircuit ?? currentStage.tournaments}</span></div>
            <div className="card-body grid grid-cols-2 gap-3 lg:grid-cols-4">
              {currentStageEvents.length > 0 ? currentStageEvents.map((event) => <div key={event.id} className="rounded bg-surface-light/50 p-3 text-xs"><p className="font-semibold text-white">{event.name}</p><p className="mt-1 text-gray-400">{event.month ?? ''} W{event.week ?? 1} - {event.status}</p><p className="mt-1 text-gray-500">{event.progressionImpact ?? 'Builds pathway momentum.'}</p></div>) : <div className="col-span-4 text-sm text-gray-400">No events are currently mapped to this stage.</div>}
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">{currentStage.name}</h3><span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] text-white">Current Stage</span></div>
            <div className="card-body space-y-3">
              <p className="text-xs leading-relaxed text-gray-400">{currentStage.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-surface-light p-3"><p className="text-gray-500">Progression</p><p className="mt-1 text-white">{currentStage.progressionType}</p></div>
                <div className="rounded bg-surface-light p-3"><p className="text-gray-500">Sponsor Access</p><p className="mt-1 text-white">{gameState.sponsors.length > 0 ? `${gameState.sponsors.length} active` : currentStage.sponsor}</p></div>
              </div>
              <button type="button" className="btn-primary w-full justify-center text-xs" onClick={() => navigate('/calendar')}><Route className="h-3.5 w-3.5" /> View Stage Calendar</button>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Next Step: {nextStage.name}</h3></div>
            <div className="card-body space-y-3">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase text-gray-500">Requirements</p>
                <div className="space-y-1.5">
                  {requirements.map((requirement) => <div key={requirement.label} className="flex items-center gap-2 text-xs"><span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${requirement.complete ? 'border-green-500 bg-green-600' : 'border-gray-600'}`}>{requirement.complete ? <Check className="h-2 w-2 text-white" /> : null}</span><span className={requirement.complete ? 'text-green-400' : 'text-gray-400'}>{requirement.label}</span></div>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase text-gray-500">Unlocks</p>
                <div className="space-y-1.5">
                  {(nextStage.unlocks ?? []).slice(0, 4).map((unlock) => <div key={unlock} className="flex items-center gap-2 text-xs text-gray-400"><Circle className="h-2.5 w-2.5 text-green-400" />{unlock}</div>)}
                </div>
              </div>
              <button type="button" className="btn-secondary w-full justify-center text-xs" onClick={() => navigate('/calendar')}>View {nextStage.name} <ChevronRight className="h-3 w-3" /></button>
            </div>
          </div>

          <div className="card card-body">
            <p className="mb-2 text-[10px] font-semibold uppercase text-gray-500">Upcoming Unlock Events</p>
            <div className="space-y-2">
              {nextStageEvents.length > 0 ? nextStageEvents.map((event) => <div key={event.id} className="rounded bg-surface-light p-2 text-xs"><p className="font-semibold text-white">{event.name}</p><p className="text-gray-400">{event.month ?? ''} W{event.week ?? 1} - {event.status}</p></div>) : <p className="text-xs text-gray-400">No future events are listed for this stage yet.</p>}
            </div>
          </div>

          <div className="card card-body">
            <p className="mb-2 text-[10px] font-semibold uppercase text-gray-500">Pathway Tips</p>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li className="flex gap-2"><Trophy className="mt-0.5 h-3 w-3 text-green-400" /> Prioritise events that match the current pathway tier.</li>
              <li className="flex gap-2"><Trophy className="mt-0.5 h-3 w-3 text-green-400" /> Treat Q Tour and Q School as separate progression systems.</li>
              <li className="flex gap-2"><Trophy className="mt-0.5 h-3 w-3 text-green-400" /> Keep funding, coach quality, and fatigue aligned before jumping tiers.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
