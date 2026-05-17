import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Circle, Route, Trophy } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { CircularMeter } from '../components/ui/CircularMeter'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'
import { careerPathStageCatalog } from '../data/catalogs'
import { calculateAverage, calculateTechnicalAverage } from '../utils/calculations'
import type { Coach, Tournament } from '../types/game'

const COACH_LEVEL_VALUE: Record<Coach['level'], number> = {
  Low: 1,
  Mid: 2,
  High: 3,
  Elite: 4,
}

const SEASON_STRUCTURE = [
  { period: 'July-August', purpose: 'New season, junior and regional development, amateur restarts, and rookie professional onboarding.' },
  { period: 'September-December', purpose: 'Main amateur, Q Tour, and ranking-season volume builds.' },
  { period: 'January-March', purpose: 'Major events, elite invitationals, ranking pressure, and Q Tour finishing runs.' },
  { period: 'April', purpose: 'World Championship-style climax and decisive legacy swings.' },
  { period: 'May-June', purpose: 'Q School, senior events, and off-season review reset the pathway.' },
] as const

const TOUR_RULES = [
  'Q Tour is a real mini-tour: ranking position, finals, wins, and Global Play-Off qualification all matter.',
  'Q School has no prize money. The card is the reward, with Order of Merit acting as the fallback route.',
  'Rookie professional life is a two-year survival window driven by ranking money, travel pressure, and the top-64 cut.',
  'Veteran and senior stages are not just retirement labels. They become selective-schedule, exhibition, media, and ambassador phases.',
] as const

type StageMetricSnapshot = {
  careerStage: string
  rankingLabel: string
  age: number
  reputation: number
  confidence: number
  cash: number
  legacyScore: number
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

type RequirementStatus = {
  label: string
  value: string
  complete: boolean
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function getCommittedEvents(tournaments: Tournament[]) {
  return tournaments.filter((tournament) => tournament.status === 'Entered' || tournament.status === 'Booked')
}

function getCanonicalCareerTotals(gameState: ReturnType<typeof useGame>['gameState']) {
  const completedEvents = gameState.history.tournamentHistory
    .map((entry) => entry.canonicalResult ?? {
      matchesPlayed: entry.matchesPlayed,
      wins: entry.wins,
    })
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
  if (stage.includes('junior club') || label.includes('youth')) return 1

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
  if (metrics.legacyScore >= 70) stage = Math.max(stage, 12)
  if (metrics.age >= 35 && (metrics.proCommitted || metrics.reputation >= 65)) stage = Math.max(stage, 13)
  if (metrics.reputation >= 70 && (metrics.age >= 40 || metrics.seniorCommitted)) stage = Math.max(stage, 14)

  return stage
}

function buildStageRequirements(nextStageNumber: number, metrics: StageMetricSnapshot): RequirementStatus[] {
  switch (nextStageNumber) {
    case 2:
      return [
        { label: 'Local Match Wins', value: `${metrics.wins} / 5`, complete: metrics.wins >= 5 },
        { label: 'Technical Average', value: `${metrics.technicalAverage} / 35`, complete: metrics.technicalAverage >= 35 },
        { label: 'Confidence', value: `${metrics.confidence} / 45`, complete: metrics.confidence >= 45 },
        { label: 'Match Volume', value: `${metrics.matchesPlayed} / 3`, complete: metrics.matchesPlayed >= 3 },
      ]
    case 3:
      return [
        { label: 'Technical Average', value: `${metrics.technicalAverage} / 42`, complete: metrics.technicalAverage >= 42 },
        { label: 'Mental Average', value: `${metrics.mentalAverage} / 38`, complete: metrics.mentalAverage >= 38 },
        { label: 'Reputation', value: `${metrics.reputation} / 15`, complete: metrics.reputation >= 15 },
        { label: 'Regional Results Proxy', value: `${metrics.wins} wins`, complete: metrics.wins >= 6 },
      ]
    case 4:
      return [
        { label: 'Break Building', value: `${metrics.breakBuilding} / 45`, complete: metrics.breakBuilding >= 45 },
        { label: 'Safety Play', value: `${metrics.safetyPlay} / 40`, complete: metrics.safetyPlay >= 40 },
        { label: 'Confidence', value: `${metrics.confidence} / 55`, complete: metrics.confidence >= 55 },
        { label: 'National Results Proxy', value: `${metrics.wins} wins`, complete: metrics.wins >= 8 },
      ]
    case 5:
      return [
        { label: 'Technical Average', value: `${metrics.technicalAverage} / 50`, complete: metrics.technicalAverage >= 50 },
        { label: 'Mental Average', value: `${metrics.mentalAverage} / 48`, complete: metrics.mentalAverage >= 48 },
        { label: 'Travel Funds', value: `£${metrics.cash.toLocaleString('en-GB')} / £1,500`, complete: metrics.cash >= 1500 },
        { label: 'Adult Results Proxy', value: `${metrics.wins} wins`, complete: metrics.wins >= 10 },
      ]
    case 6:
      return [
        { label: 'Q Tour Entry', value: metrics.qTourCommitted ? 'Committed' : 'Not entered', complete: metrics.qTourCommitted },
        { label: 'Reputation', value: `${metrics.reputation} / 35`, complete: metrics.reputation >= 35 },
        { label: 'Mental Average', value: `${metrics.mentalAverage} / 52`, complete: metrics.mentalAverage >= 52 },
        { label: 'Strong Season Proxy', value: `${metrics.wins} wins`, complete: metrics.wins >= 12 },
      ]
    case 7:
      return [
        { label: 'Q School Campaign', value: metrics.qSchoolCommitted ? 'Active' : 'Not active', complete: metrics.qSchoolCommitted },
        { label: 'Funding', value: `£${metrics.cash.toLocaleString('en-GB')} / £3,300`, complete: metrics.cash >= 3300 },
        { label: 'Confidence', value: `${metrics.confidence} / 55`, complete: metrics.confidence >= 55 },
        { label: 'Card Outcome', value: metrics.proCommitted ? 'Tour card secured' : 'Still qualifying', complete: metrics.proCommitted },
      ]
    case 8:
      return [
        { label: 'Top 64', value: metrics.worldRanking != null ? `#${metrics.worldRanking}` : 'Not ranked', complete: metrics.worldRanking != null && metrics.worldRanking <= 64 },
        { label: 'Professional Match Wins', value: `${metrics.wins} / 12`, complete: metrics.wins >= 12 },
        { label: 'Sustainable Cash', value: `£${metrics.cash.toLocaleString('en-GB')}`, complete: metrics.cash >= 5000 },
      ]
    case 9:
      return [
        { label: 'Top 32', value: metrics.worldRanking != null ? `#${metrics.worldRanking}` : 'Not ranked', complete: metrics.worldRanking != null && metrics.worldRanking <= 32 },
        { label: 'Reputation', value: `${metrics.reputation} / 65`, complete: metrics.reputation >= 65 },
        { label: 'Elite Wins Proxy', value: `${metrics.wins} wins`, complete: metrics.wins >= 18 },
      ]
    case 10:
      return [
        { label: 'Top 16', value: metrics.worldRanking != null ? `#${metrics.worldRanking}` : 'Not ranked', complete: metrics.worldRanking != null && metrics.worldRanking <= 16 },
        { label: 'Big Match Nerve', value: `${metrics.bigMatchNerve} / 70`, complete: metrics.bigMatchNerve >= 70 },
        { label: 'Major Exposure', value: metrics.majorCommitted ? 'Major calendar active' : 'Still outside major tier', complete: metrics.majorCommitted },
      ]
    case 11:
      return [
        { label: 'Reputation', value: `${metrics.reputation} / 80`, complete: metrics.reputation >= 80 },
        { label: 'Legacy Score', value: `${metrics.legacyScore} / 50`, complete: metrics.legacyScore >= 50 },
        { label: 'Elite Ranking', value: metrics.worldRanking != null ? `#${metrics.worldRanking}` : 'Not ranked', complete: metrics.worldRanking != null && metrics.worldRanking <= 16 },
      ]
    case 12:
      return [
        { label: 'World Title Readiness', value: metrics.majorCommitted ? 'Major runs active' : 'No major run yet', complete: metrics.majorCommitted },
        { label: 'Legacy Score', value: `${metrics.legacyScore} / 70`, complete: metrics.legacyScore >= 70 },
        { label: 'Elite Ranking', value: metrics.worldRanking != null ? `#${metrics.worldRanking}` : 'Not ranked', complete: metrics.worldRanking != null && metrics.worldRanking <= 16 },
      ]
    case 13:
      return [
        { label: 'Age Trigger', value: `${metrics.age} / 35`, complete: metrics.age >= 35 },
        { label: 'Reputation', value: `${metrics.reputation} / 65`, complete: metrics.reputation >= 65 },
        { label: 'Tour Presence', value: metrics.proCommitted ? 'Still active on tour' : 'Reduced main-tour role', complete: metrics.proCommitted || metrics.reputation >= 70 },
      ]
    case 14:
      return [
        { label: 'Age Trigger', value: `${metrics.age} / 40`, complete: metrics.age >= 40 },
        { label: 'Reputation', value: `${metrics.reputation} / 70`, complete: metrics.reputation >= 70 },
        { label: 'Senior Route', value: metrics.seniorCommitted ? 'Senior calendar active' : 'Senior access not yet active', complete: metrics.seniorCommitted || metrics.age >= 45 },
      ]
    default:
      return []
  }
}

function getRequirementProgress(requirements: RequirementStatus[]) {
  if (requirements.length === 0) return 100
  return clampProgress((requirements.filter((item) => item.complete).length / requirements.length) * 100)
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
  const wins = careerTotals.wins
  const matchesPlayed = careerTotals.matchesPlayed
  const worldRanking = gameState.player.worldRanking ?? null
  const metrics: StageMetricSnapshot = {
    careerStage: gameState.player.careerStage,
    rankingLabel: gameState.player.rankingLabel,
    age: gameState.player.age,
    reputation: gameState.player.reputation,
    confidence: gameState.player.confidence,
    cash: gameState.player.cash,
    legacyScore: gameState.player.legacyScore,
    technicalAverage: calculateTechnicalAverage(gameState.attributes.technical),
    mentalAverage: calculateAverage(Object.values(gameState.attributes.mental)),
    breakBuilding: gameState.attributes.technical['Break Building'] ?? 0,
    safetyPlay: gameState.attributes.technical['Safety Play'] ?? 0,
    bigMatchNerve: gameState.attributes.mental['Big Match Nerve'] ?? 0,
    worldRanking,
    wins,
    matchesPlayed,
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
  const stageRequirements = buildStageRequirements(nextStageNumber, metrics)
  const currentStageProgress = currentStageNumber === careerPathStageCatalog.length ? 100 : getRequirementProgress(stageRequirements)
  const overallProgress = clampProgress((((currentStageNumber - 1) + currentStageProgress / 100) / careerPathStageCatalog.length) * 100)
  const stages = careerPathStageCatalog.map((stage) => ({
    ...stage,
    current: stage.stage === currentStageNumber,
    progress: stage.stage < currentStageNumber ? 100 : stage.stage === currentStageNumber ? currentStageProgress : 0,
  }))
  const visibleStages = stages.filter((stage) => (tierFilter === 'All' ? true : stage.tier === tierFilter))
  const currentStage = visibleStages.find((stage) => stage.current) ?? stages.find((stage) => stage.current) ?? stages[0]
  const nextStage = stages.find((stage) => stage.stage === nextStageNumber) ?? stages[stages.length - 1]
  const stagesCompleted = Math.max(0, currentStageNumber - 1)
  const careerStatus = currentStageProgress >= 70 ? 'On Track' : currentStageProgress >= 40 ? 'Building' : 'Needs Momentum'
  const currentStageEvents = gameState.tournaments
    .filter((event) => (event.stageId ?? 1) <= currentStage.stage && (event.stageId ?? 1) >= Math.max(1, currentStage.stage - 2))
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .slice(0, 5)
  const nextStageEvents = gameState.tournaments
    .filter((event) => (event.stageId ?? 1) === nextStage.stage)
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .slice(0, 4)
  const playerRankingText = worldRanking != null ? `World #${worldRanking}` : `${gameState.player.rankingLabel} #${gameState.player.amateurRanking ?? '-'}`
  const stageBenefits = [
    { label: 'Event Access', detail: currentStage.eventAccess ?? currentStage.tournaments },
    { label: 'Tour Circuit', detail: currentStage.tourCircuit ?? currentStage.tournaments },
    { label: 'Unlock Focus', detail: (currentStage.unlocks ?? ['Long-term pathway access']).slice(0, 2).join(' and ') },
  ]
  const stageTips = [
    'Prioritise events that fit the current pathway tier instead of jumping too early into expensive travel blocks.',
    'Treat Q Tour and Q School as separate systems: one is a season table, the other is a brutal qualification campaign.',
    'Use legacy stages as scheduling and revenue strategy phases, not just as lower-pressure tournament labels.',
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Career"
        title="Career Pathway"
        description="Updated 14-stage pathway from junior clubs to senior legends, aligned to July-to-June tours, access rules, and progression triggers."
        actions={
          <div className="flex items-center gap-3">
            <ActionButton tone="secondary" onClick={() => setTierFilter((value) => tierOptions[(tierOptions.indexOf(value) + 1) % tierOptions.length])}>{tierFilter === 'All' ? 'Stage Filter: All' : `Stage Filter: ${tierFilter}`}</ActionButton>
            <ActionButton tone="secondary" icon={<CalendarDays className="h-4 w-4" />} onClick={() => navigate('/calendar')}>View Stage Calendar</ActionButton>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.55fr_360px]">
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <SectionCard title="Updated Pathway Map Table" subtitle="This map now follows the full 14-stage junior-to-legacy route and the event-access model requested.">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Stage</th>
                      <th className="px-3 py-2">Tier</th>
                      <th className="px-3 py-2">Tour / Circuit</th>
                      <th className="px-3 py-2">Event Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStages.map((stage) => (
                      <tr key={stage.id} className={`border-t border-scm-border ${stage.current ? 'bg-scm-green/10' : ''}`}>
                        <td className="px-3 py-3 text-scm-text">{stage.stage}</td>
                        <td className="px-3 py-3 font-medium text-scm-text">{stage.name}</td>
                        <td className="px-3 py-3 text-scm-textSoft">{stage.tier}</td>
                        <td className="px-3 py-3 text-scm-textSoft">{stage.tourCircuit ?? stage.tournaments}</td>
                        <td className="px-3 py-3 text-scm-textSoft">{stage.eventAccess ?? stage.tournaments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Career Progression" subtitle="Overall pathway summary and current save position.">
              <div className="flex items-center justify-center pb-4">
                <CircularMeter value={overallProgress} label="Overall Progress" />
              </div>
              <div className="space-y-3 text-sm text-scm-textSoft">
                <div className="flex items-center justify-between"><span>Current stage</span><span className="text-scm-text">{currentStage.name}</span></div>
                <div className="flex items-center justify-between"><span>Stage marker</span><span className="text-scm-text">Stage {currentStageNumber} of {careerPathStageCatalog.length}</span></div>
                <div className="flex items-center justify-between"><span>Next stage</span><span className="text-scm-text">{nextStage.name}</span></div>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard title="Pathway Overview" subtitle="Status snapshot for the current development tier.">
              <div className="space-y-4 text-sm text-scm-textSoft">
                <div className="flex items-center justify-between"><span>Stages Completed</span><span className="text-scm-text">{stagesCompleted} / {careerPathStageCatalog.length}</span></div>
                <div className="flex items-center justify-between"><span>Current Stage Progress</span><span className="text-scm-text">{currentStageProgress}%</span></div>
                <div className="flex items-center justify-between"><span>Overall Progress</span><span className="text-scm-text">{overallProgress}%</span></div>
                <div className="flex items-center justify-between"><span>Ranking Context</span><span className="text-scm-text">{playerRankingText}</span></div>
                <div className="flex items-center justify-between"><span>Career Status</span><span className="text-emerald-300">{careerStatus}</span></div>
                <div className="flex items-center justify-between"><span>Technical Average</span><span className="text-scm-text">{metrics.technicalAverage}</span></div>
                <div className="flex items-center justify-between"><span>Mental Average</span><span className="text-scm-text">{metrics.mentalAverage}</span></div>
              </div>
            </SectionCard>

            <SectionCard title="Key Benefits By Stage" subtitle="Why climbing the pathway matters beyond ranking alone.">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                {stageBenefits.map((benefit) => (
                  <div key={benefit.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                    <p className="font-semibold text-scm-text">{benefit.label}</p>
                    <p className="mt-2 text-sm text-scm-textSoft">{benefit.detail}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Season Structure" subtitle="The core season now runs July to June across pathway, pro, and legacy circuits.">
            <div className="grid gap-4 md:grid-cols-5">
              {SEASON_STRUCTURE.map((item) => (
                <div key={item.period} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-gold">{item.period}</p>
                  <p className="mt-2 text-sm text-scm-textSoft">{item.purpose}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title={currentStage.name} subtitle="Current Stage">
            <p className="text-sm leading-6 text-scm-textSoft">{currentStage.description}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-gold">Typical Events</p>
                {currentStageEvents.length ? currentStageEvents.map((event) => (
                  <p key={event.id} className="mt-2 text-sm text-scm-text">{event.name} · {event.tourCircuit ?? event.name}</p>
                )) : (
                  <p className="mt-2 text-sm text-scm-text">{currentStage.eventAccess ?? currentStage.tournaments}</p>
                )}
              </div>
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-gold">Progression Type</p>
                <p className="mt-2 text-sm text-scm-textSoft">{currentStage.progressionType ?? 'Structured pathway progression'}</p>
                {(currentStage.moveUpWhen ?? []).slice(0, 3).map((rule) => <p key={rule} className="mt-2 text-sm text-scm-textSoft">{rule}</p>)}
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Prize Level</p>
                <p className="mt-2 text-scm-text">Cash {gameState.player.cash.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })}</p>
              </div>
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Coaching Access</p>
                <p className="mt-2 text-scm-text">{currentCoach?.level ?? 'None'} ({currentStage.coaching})</p>
              </div>
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Sponsor Access</p>
                <p className="mt-2 text-scm-text">{gameState.sponsors.length > 0 ? `${gameState.sponsors.length} active deals` : currentStage.sponsor}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title={`Next Step: ${nextStage.name}`} subtitle="Requirements to unlock the next tier.">
            <div className="space-y-3">
              {stageRequirements.map((requirement) => (
                <div key={requirement.label} className="flex items-center justify-between gap-3 rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm">
                  <div className="flex items-center gap-3 text-scm-textSoft">
                    {requirement.complete ? <CheckCircle2 className="h-4 w-4 text-scm-green" /> : <Circle className="h-4 w-4 text-scm-textMuted" />}
                    <span>{requirement.label}</span>
                  </div>
                  <span className="text-scm-text">{requirement.value}</span>
                </div>
              ))}
            </div>
            {(nextStage.unlocks ?? []).length ? (
              <div className="mt-4 rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-gold">Unlocks</p>
                {(nextStage.unlocks ?? []).map((unlock) => <p key={unlock} className="mt-2 text-sm text-scm-textSoft">{unlock}</p>)}
              </div>
            ) : null}
            <div className="mt-4">
              <ActionButton className="w-full" icon={<Route className="h-4 w-4" />} onClick={() => navigate('/calendar')}>View {nextStage.name} Calendar</ActionButton>
            </div>
          </SectionCard>

          <SectionCard title="Upcoming Unlock Events" subtitle="The next circuit’s schedule is visible before you commit to it.">
            <div className="space-y-3">
              {nextStageEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm">
                  <p className="font-medium text-scm-text">{event.name}</p>
                  <p className="mt-1 text-scm-textSoft">{event.month ?? ''} W{event.week ?? 1} · {event.tourCircuit ?? event.name}</p>
                  <p className="mt-1 text-scm-textSoft">{event.progressionImpact ?? 'Builds pathway momentum.'}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Tour Rules" subtitle="The biggest structural rules now built into the pathway design.">
            <div className="space-y-3">
              {TOUR_RULES.map((rule) => (
                <div key={rule} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">{rule}</div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Pathway Tips" subtitle="Planning guidance for efficient progression.">
            <ul className="space-y-3 text-sm text-scm-textSoft">
              {stageTips.map((tip) => (
                <li key={tip} className="flex gap-3"><Trophy className="mt-0.5 h-4 w-4 text-scm-gold" />{tip}</li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
