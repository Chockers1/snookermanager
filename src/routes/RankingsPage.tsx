import { SectionTabs } from '../components/ui/SectionTabs';
import { CareerEditor } from '../components/career/CareerDepthPanels';
import {currentRankingTab,rankingRoster} from '../game/rankingPresentation';
import { FormResult } from '../components/game/FormResult';
import { PlayerLink } from '../components/game/PlayerLink';
import { TourDevelopmentPanel } from '../components/career/SeasonExpansionPanels'
import { pathwayStandings, pathwayListStatus, qTourQualification } from '../game/pathwayRules'
import { useRef, useState } from 'react'
import { QualificationRacesPanel } from '../components/career/RealismPanels'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Minus, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useGame } from '../context/useGame'
import { getNextEligibleTournament, getCompetitionKeysForTournament } from '../hooks/useGameState'
import { getPlayableRounds, resolveTournamentFormat } from '../data/tournamentFormats'
import { rankingEarningsSummary } from '../game/rollingRankings'
import type { PlayerAttributes } from '../types/game'
import { calculateOverallRating, calculatePotentialRating } from '../utils/calculations'
import { formatMoney } from '../utils/formatters'
import {
  buildTournamentRankingSources,
  getProjectedTournamentRankingPoints,
  projectRankingAfterEvent,
  tournamentAffectsRankingTable,
} from '../utils/rankingProjections'

const rankingTabs = [
  { key: 'world', label: 'World Ranking', seasonLabel: 'Two-year list', rankField: 'worldRank' },
  { key: 'oneYear', label: 'One-Year Ranking', seasonLabel: 'Current season race', rankField: 'oneYearRank' },
  { key: 'youth', label: 'Youth Ranking', seasonLabel: 'Junior development', rankField: 'youthRank' },
  { key: 'amateur', label: 'Amateur Ranking', seasonLabel: 'Amateur pathway', rankField: 'amateurRank' },
  { key: 'qTour', label: 'Q Tour Ranking', seasonLabel: 'Global Q Tour', rankField: 'qTourRank' },
  { key: 'qSchool', label: 'Q School OOM', seasonLabel: 'Top-up race', rankField: 'qSchoolRank' },
  { key: 'senior', label: 'Senior Ranking', seasonLabel: 'Late-career circuit', rankField: 'seniorRank' },
] as const

type RankingTabKey = (typeof rankingTabs)[number]['key']

type RankingRatingCircuit = 'world' | 'amateur' | 'qTour' | 'qSchool' | 'senior' | 'youth'

const RATING_RANK_BASELINES: Partial<Record<string, { technical: number; mental: number; physical: number }>> = {
  Youth: { technical: 57, mental: 54, physical: 58 },
  Amateur: { technical: 63, mental: 60, physical: 61 },
  'Q Tour': { technical: 69, mental: 66, physical: 65 },
  'Rookie Pro': { technical: 74, mental: 70, physical: 68 },
  'Top 64': { technical: 79, mental: 75, physical: 71 },
  'Top 32': { technical: 83, mental: 79, physical: 73 },
  'Top 16': { technical: 88, mental: 84, physical: 76 },
  'Top 4': { technical: 91, mental: 87, physical: 79 },
  'World Champion': { technical: 94, mental: 91, physical: 82 },
  'Veteran Min Support': { technical: 80, mental: 76, physical: 67 },
}

const RATING_ARCHETYPES = ['Serial Scorer', 'Tactical Grinder', 'Counter Puncher', 'Tempo Disruptor'] as const

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function hashStringToNumber(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647
  }

  return Math.abs(hash)
}

function getRankingRatingCircuit(tabKey: RankingTabKey): RankingRatingCircuit {
  if (tabKey === 'amateur') return 'amateur'
  if (tabKey === 'qTour') return 'qTour'
  if (tabKey === 'qSchool') return 'qSchool'
  if (tabKey === 'senior') return 'senior'
  if (tabKey === 'youth') return 'youth'
  return 'world'
}

function getEstimatedArchetype(playerName: string, ranking: number) {
  const seed = hashStringToNumber(`${playerName}-${ranking}`)
  return RATING_ARCHETYPES[seed % RATING_ARCHETYPES.length]
}

function getEstimatedRankBand(ranking: number, circuit: RankingRatingCircuit) {
  if (circuit === 'youth') return 'Youth'
  if (circuit === 'amateur') return 'Amateur'
  if (circuit === 'qTour' || circuit === 'qSchool') return 'Q Tour'
  if (circuit === 'senior') return 'Veteran Min Support'
  if (ranking <= 1) return 'World Champion'
  if (ranking <= 4) return 'Top 4'
  if (ranking <= 16) return 'Top 16'
  if (ranking <= 32) return 'Top 32'
  if (ranking <= 64) return 'Top 64'
  if (ranking <= 80) return 'Rookie Pro'
  if (ranking <= 96) return 'Q Tour'
  if (ranking <= 128) return 'Amateur'
  return 'Youth'
}

function getEstimatedBaseStrength(circuit: RankingRatingCircuit) {
  if (circuit === 'youth') return 48
  if (circuit === 'amateur') return 56
  if (circuit === 'qTour') return 64
  if (circuit === 'qSchool') return 69
  if (circuit === 'senior') return 54
  return 68
}

function getEstimatedRankingWeight(circuit: RankingRatingCircuit) {
  if (circuit === 'youth') return 0.18
  if (circuit === 'amateur') return 0.22
  if (circuit === 'qTour') return 0.28
  if (circuit === 'qSchool') return 0.3
  if (circuit === 'senior') return 0.16
  return 0.32
}

function buildEstimatedAttributes(playerName: string, ranking: number, circuit: RankingRatingCircuit): PlayerAttributes {
  const sourceRankBand = getEstimatedRankBand(ranking, circuit)
  const baseline = RATING_RANK_BASELINES[sourceRankBand]
  const estimatedStrength = clamp(
    getEstimatedBaseStrength(circuit) + (100 - ranking) * getEstimatedRankingWeight(circuit),
    44,
    97,
  )
  const eliteFactor = clamp(Math.round((100 - ranking) * 0.45), 6, 44)
  const technicalBase = baseline
    ? clamp(baseline.technical + Math.round((estimatedStrength - baseline.technical) * 0.25), 42, 94)
    : clamp(Math.round(estimatedStrength + eliteFactor * 0.16), 42, 94)
  const mentalBase = baseline
    ? clamp(baseline.mental + Math.round((estimatedStrength - baseline.mental) * 0.18), 40, 93)
    : clamp(Math.round(estimatedStrength - 2 + eliteFactor * 0.12), 40, 93)
  const physicalBase = baseline
    ? clamp(baseline.physical + Math.round((estimatedStrength - baseline.physical) * 0.12), 38, 90)
    : clamp(Math.round(estimatedStrength - 5 + eliteFactor * 0.08), 38, 90)

  const attributes: PlayerAttributes = {
    technical: {
      'Long Potting': technicalBase,
      'Break Building': clamp(technicalBase + 2, 1, 99),
      'Cue Ball Control': clamp(technicalBase - 1, 1, 99),
      'Safety Play': clamp(technicalBase, 1, 99),
      Consistency: clamp(technicalBase - 2, 1, 99),
    },
    mental: {
      Focus: mentalBase,
      Composure: clamp(mentalBase - 1, 1, 99),
      'Big Match Nerve': clamp(mentalBase + 1, 1, 99),
      Resilience: clamp(mentalBase - 1, 1, 99),
      Professionalism: clamp(mentalBase, 1, 99),
    },
    physical: {
      Stamina: physicalBase,
      'Recovery Rate': clamp(physicalBase - 2, 1, 99),
      Balance: clamp(physicalBase - 1, 1, 99),
      'Hand Steadiness': clamp(physicalBase - 1, 1, 99),
      'Shoulder Health': clamp(physicalBase - 2, 1, 99),
    },
  }

  const archetype = getEstimatedArchetype(playerName, ranking)
  if (archetype === 'Serial Scorer') {
    attributes.technical['Long Potting'] = clamp(attributes.technical['Long Potting'] + 7, 1, 99)
    attributes.technical['Break Building'] = clamp(attributes.technical['Break Building'] + 9, 1, 99)
    attributes.technical['Cue Ball Control'] = clamp(attributes.technical['Cue Ball Control'] + 4, 1, 99)
    attributes.technical['Safety Play'] = clamp(attributes.technical['Safety Play'] - 5, 1, 99)
  } else if (archetype === 'Tactical Grinder') {
    attributes.technical['Safety Play'] = clamp(attributes.technical['Safety Play'] + 9, 1, 99)
    attributes.mental.Focus = clamp(attributes.mental.Focus + 6, 1, 99)
    attributes.mental.Composure = clamp(attributes.mental.Composure + 5, 1, 99)
    attributes.technical['Break Building'] = clamp(attributes.technical['Break Building'] - 6, 1, 99)
  } else if (archetype === 'Counter Puncher') {
    attributes.technical['Cue Ball Control'] = clamp(attributes.technical['Cue Ball Control'] + 6, 1, 99)
    attributes.technical.Consistency = clamp(attributes.technical.Consistency + 7, 1, 99)
    attributes.mental.Focus = clamp(attributes.mental.Focus + 5, 1, 99)
    attributes.technical['Break Building'] = clamp(attributes.technical['Break Building'] - 2, 1, 99)
  } else {
    attributes.technical['Safety Play'] = clamp(attributes.technical['Safety Play'] + 5, 1, 99)
    attributes.physical['Hand Steadiness'] = clamp(attributes.physical['Hand Steadiness'] + 5, 1, 99)
    attributes.mental.Focus = clamp(attributes.mental.Focus + 4, 1, 99)
    attributes.technical['Long Potting'] = clamp(attributes.technical['Long Potting'] - 2, 1, 99)
  }

  return attributes
}

function getEstimatedRatings(playerName: string, ranking: number, circuit: RankingRatingCircuit, age?: number) {
  const attributes = buildEstimatedAttributes(playerName, ranking, circuit)
  const overall = calculateOverallRating({ attributes })

  return {
    overall,
    potential: calculatePotentialRating({
      attributes,
      age,
      overallRating: overall,
    }),
  }
}

function getRankingTabForTournamentType(rankingType: string | undefined): RankingTabKey | null {
  if (rankingType === 'Youth') return 'youth'
  if (rankingType === 'Amateur') return 'amateur'
  if (rankingType === 'Q Tour') return 'qTour'
  if (rankingType === 'Q School OOM') return 'qSchool'
  if (rankingType === 'World Ranking') return 'world'
  if (rankingType === 'One-Year') return 'oneYear'
  if (rankingType === 'Senior') return 'senior'
  return null
}

function Movement({ value }: { value: number }) {
  if (value > 0) return <span className="flex items-center justify-center gap-0.5 text-green-400"><TrendingUp className="h-3 w-3" />{value}</span>
  if (value < 0) return <span className="flex items-center justify-center gap-0.5 text-red-400"><TrendingDown className="h-3 w-3" />{Math.abs(value)}</span>
  return <Minus className="mx-auto h-3 w-3 text-gray-600" />
}



function buildFormDots(recentResults: readonly string[] | undefined): Array<'W' | 'L' | 'D'> {
  return recentResults
    ?.filter((result): result is 'W' | 'L' | 'D' => result === 'W' || result === 'L' || result === 'D')
    .slice(-8) ?? []
}

export function RankingsPage() {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const latestMatch = gameState.matches[0]
  const latestTournament = gameState.tournaments.find((tournament) => tournament.id === latestMatch?.tournamentId)
  const finalRankingTab = latestMatch?.round === 'Final' && searchParams.get('from') === 'final'
    ? getRankingTabForTournamentType(latestTournament?.rankingType)
    : null
  const currentPathTab: RankingTabKey = currentRankingTab(gameState)
  const defaultTab = finalRankingTab ?? currentPathTab
  const [activeTab, setActiveTab] = useState<RankingTabKey>(defaultTab)
  const activeConfig = rankingTabs.find((tab) => tab.key === activeTab) ?? rankingTabs[0]
  const [section, setSection] = useState<'Standings' | 'Your race' | 'Pathway'>('Standings')
  const [query, setQuery] = useState('')
  const [showRules, setShowRules] = useState(false)
  const humanRow = useRef<HTMLTableRowElement>(null)
  const [pathwayList, setPathwayList] = useState('Europe')
  const lists = activeTab === 'qTour' ? ['Europe', 'Asia Pacific', 'Middle East', 'Americas'] : activeTab === 'qSchool' ? ['Q School UK', 'Q School Asia'] : activeTab === 'senior' ? ['Two-year seniors', 'Race to the Crucible'] : []
  const selectedList = lists.includes(pathwayList) ? pathwayList : lists[0]
  const pathwayRows = lists.length ? pathwayStandings(gameState, activeTab === 'senior' ? 'Senior' : selectedList as Parameters<typeof pathwayStandings>[1], gameState.currentDate, selectedList === 'Two-year seniors') : []
  const pathwayStatus = lists.length ? pathwayListStatus(gameState, activeTab === 'senior' ? 'Senior' : selectedList as Parameters<typeof pathwayListStatus>[1], selectedList === 'Two-year seniors') : null
  const developmentRanking = activeTab === 'youth' || activeTab === 'amateur'
  const nextDevelopmentEvent = developmentRanking ? gameState.tournaments.filter(t => t.rankingType !== 'None' && t.rankingValue > 0 && getCompetitionKeysForTournament(t).includes(activeTab) && (t.endDate ?? t.startDate) > gameState.currentDate).sort((a,b) => (a.endDate ?? a.startDate).localeCompare(b.endDate ?? b.startDate))[0] : undefined
  const earnedRows = lists.length ? pathwayRows.map((r, i) => ({ ...(gameState.competitionTables[activeConfig.key].find(p => p.playerName === r.name) ?? { id: r.name, playerName: r.name, nation: gameState.worldPlayers.find(p => p.playerName === r.name)?.nation ?? 'INT', movement: 0, prizeMoney: 0, wins: 0, losses: 0 }), ranking: i + 1, points: r.points, eventsPlayed: r.events, titles: r.titles })) : gameState.competitionTables[activeConfig.key].filter(row => !developmentRanking || row.eventsPlayed > 0)
  const rosterOnly = earnedRows.length === 0 && activeTab !== 'world' && activeTab !== 'oneYear'
  const activeRows = rosterOnly ? rankingRoster(gameState,activeTab) : earnedRows
  const qTourPlaces = activeTab === 'qTour' ? qTourQualification(gameState, gameState.currentDate) : null
  const playerOverall = calculateOverallRating({
    attributes: gameState.attributes,
    personalityTraits: gameState.player.personalityTraits,
    playingStyle: gameState.player.playingStyle,
  })
  const playerPotential = calculatePotentialRating({
    attributes: gameState.attributes,
    personalityTraits: gameState.player.personalityTraits,
    age: gameState.player.age,
    playingStyle: gameState.player.playingStyle,
    personalityType: gameState.player.personalityType,
    overallRating: playerOverall,
  })
  const worldPlayerByName = new Map(gameState.worldPlayers.map((player) => [player.playerName, player]))
  const ratingCircuit = getRankingRatingCircuit(activeTab)
  const activeRowsWithRatings = activeRows.map((row) => {
    if (row.playerName === gameState.player.fullName) {
      return {
        ...row,
        age: gameState.player.age,
        overall: playerOverall,
        potential: playerPotential,
        recentResults: gameState.player.form.slice(-10),
      }
    }

    const archive = worldPlayerByName.get(row.playerName)
    const estimated = getEstimatedRatings(row.playerName, row.ranking, ratingCircuit, archive?.age)
    return {
      ...row,
      age: archive?.age,
      overall: archive?.overallRating ?? estimated.overall,
      potential: Math.max(
        archive?.overallRating ?? estimated.overall,
        archive?.developmentPotential ?? archive?.overallRating ?? estimated.potential,
      ),
      recentResults: archive?.recentResults,
    }
  })
  const playerRow = rosterOnly ? undefined : activeRowsWithRatings.find((row) => row.playerName === gameState.player.fullName)
  const nextTournament = getNextEligibleTournament(gameState)
  const nextTarget = activeRowsWithRatings.find((row) => row.ranking === Math.max(1, (playerRow?.ranking ?? 2) - 1))
  const moneyRanking = activeTab === 'world' || activeTab === 'oneYear'
  const earningsSummary = rankingEarningsSummary(gameState, gameState.player.fullName)
  const pendingEarnings = earningsSummary.pending.filter(e => activeTab !== 'oneYear' || e.season === gameState.season)
  const rankingSources = moneyRanking ? earningsSummary.recent.filter(e => activeTab !== 'oneYear' || e.season === gameState.season).map(e => ({ label: `${gameState.rollingRankings?.events[e.eventKey]?.name ?? e.eventKey} · ${e.earnedOn}`, points: e.amount, prizeMoney: e.amount })) : buildTournamentRankingSources(
    gameState.history.tournamentHistory,
    gameState.tournaments,
    activeTab,
  )
  const nextEventRounds = nextTournament
    ? getPlayableRounds(resolveTournamentFormat(nextTournament))
    : []
  const firstScenarioRound = nextEventRounds.find((round) => /last\s*16/i.test(round))
    ?? nextEventRounds[Math.max(0, nextEventRounds.length - 3)]
    ?? 'Last 16'
  const semiFinalRound = nextEventRounds.find((round) => /semi.?final/i.test(round))
    ?? nextEventRounds[Math.max(0, nextEventRounds.length - 2)]
    ?? 'Semi Final'
  const eventAffectsActiveTable = tournamentAffectsRankingTable(nextTournament, activeTab)
  const scenarioDefinitions = [
    { label: `Reach ${firstScenarioRound}`, round: firstScenarioRound, champion: false },
    { label: semiFinalRound, round: semiFinalRound, champion: false },
    { label: 'Win Event', round: nextEventRounds.at(-1) ?? 'Final', champion: true },
  ]
  const rankingScenarios = (eventAffectsActiveTable ? scenarioDefinitions : []).map((scenario) => {
    const points = eventAffectsActiveTable
      ? getProjectedTournamentRankingPoints(nextTournament, scenario.round, scenario.champion)
      : 0
    return {
      label: scenario.label,
      points,
      projectedRank: !playerRow ? null : projectRankingAfterEvent(
        activeRowsWithRatings,
        gameState.player.fullName,
        eventAffectsActiveTable ? nextTournament : undefined,
        points,
      ),
    }
  })
  const playerArchive = gameState.worldPlayers.find((player) => player.playerName === gameState.player.fullName)
  const archivedMomentum = (playerArchive?.seasons ?? []).slice(0, 6).reverse().map((season) => ({
    label: season.season,
    value: season[activeConfig.rankField],
  })).filter(row=>row.value!=null)
  const liveMomentum = moneyRanking ? (gameState.rollingRankings?.revisions ?? []).slice(-10).map(revision => ({ label: revision.date.slice(5), value: (activeTab === 'oneYear' ? revision.oneYear : revision.world)[gameState.player.fullName] })).filter(row=>row.value!=null) : []
  const rankingMomentum = liveMomentum.length > 0 ? liveMomentum : archivedMomentum.length > 0
    ? archivedMomentum
    : playerRow ? [{ label: gameState.currentDate.slice(5), value: playerRow.ranking }] : []
  const rankingCards = [
    { title: 'Tour Card', body: gameState.careerSystems.pro.hasTourCard ? `${gameState.careerSystems.pro.survivalStatus} - ${gameState.careerSystems.pro.yearsRemaining > 0 ? `${gameState.careerSystems.pro.yearsRemaining} season(s) left` : 'retained on merit'}` : 'No active main-tour card yet.' },
    { title: 'Q Tour', body: gameState.careerSystems.qTour.playerRank ? `Rank ${gameState.careerSystems.qTour.playerRank} - ${gameState.careerSystems.qTour.playerPoints} pts${gameState.careerSystems.qTour.directCardAwarded ? ' - card secured' : ''}` : 'No Q Tour points logged yet.' },
    { title: 'Q School', body: `${gameState.careerSystems.qSchool.campaignsEntered} campaigns - ${gameState.careerSystems.qSchool.repeatedFailures} failed runs${gameState.careerSystems.qSchool.topUpEligible ? ' - top-up live' : ''}` },
    { title: 'Late Career', body: gameState.careerSystems.lateCareer.seniorActive ? 'Senior circuit active.' : gameState.careerSystems.lateCareer.seniorEligible ? 'Senior eligible; veteran path open.' : gameState.careerSystems.lateCareer.veteranActive ? 'Veteran phase active.' : 'Standard career phase.' },
  ]
  const playerMovement = playerRow?.movement ?? 0
  const playerMovementTone = playerMovement > 0 ? 'text-green-400' : playerMovement < 0 ? 'text-red-400' : 'text-gray-400'
  const movementLabel = playerMovement > 0 ? `+${playerMovement}` : `${playerMovement}`

  const visibleRows = activeRowsWithRatings.filter(row => `${row.playerName} ${row.nation}`.toLowerCase().includes(query.trim().toLowerCase()))
  const pendingTotal = pendingEarnings.reduce((total, entry) => total + entry.amount, 0)
  const targetGap = Math.max(0, (nextTarget?.points ?? 0) - (playerRow?.points ?? 0) + 1)
  const changeCircuit = (key: RankingTabKey) => { setActiveTab(key); setQuery('') }

  return (
    <div className="rankings-page flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden" data-testid="rankings-page">
      <header className="ranking-header flex shrink-0 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">The live ladder · {gameState.season}</p>
          <h1 className="text-2xl font-bold text-white">Rankings</h1>
          <p className="ranking-intro text-xs text-gray-300">Follow the field. See what counts and where your next result could take you.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className="btn-secondary px-3 py-2 text-xs" onClick={() => changeCircuit(defaultTab)}>{finalRankingTab ? 'Final Ranking' : 'Current Path'}</button>
          <button className="btn-primary px-3 py-2 text-xs" onClick={() => navigate('/calendar')}>Next Event</button>
        </div>
      </header>
      <nav aria-label="Ranking circuits" className="ranking-circuits flex shrink-0 gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1">
        {rankingTabs.map((tab, index) => <button key={tab.key} type="button" aria-pressed={tab.key === activeTab}
          onClick={() => changeCircuit(tab.key)} onKeyDown={event => {
            const next = event.key === 'ArrowRight' ? (index + 1) % rankingTabs.length : event.key === 'ArrowLeft' ? (index + rankingTabs.length - 1) % rankingTabs.length : null;
            if (next === null) return;
            event.preventDefault(); changeCircuit(rankingTabs[next].key);
            (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
          }} className={'min-h-10 flex-1 whitespace-nowrap rounded px-3 py-2 text-xs font-semibold ' + (tab.key === activeTab ? 'bg-emerald-500/15 text-emerald-300' : 'text-gray-300 hover:bg-white/5')}>
          {tab.label}
        </button>)}
      </nav>
      <div className="ranking-summary">
        <section className="ranking-summary-card ranking-summary-player">
          <div><p className="ranking-caption">{finalRankingTab ? 'Current Ranking After Final' : `Your ${activeConfig.label}`}</p>
            <div className="flex items-baseline gap-3"><strong className="ranking-number">{playerRow ? `#${playerRow.ranking}` : 'Unranked'}</strong><span className={'text-xs ' + playerMovementTone}>{movementLabel} movement</span></div>
          </div>
          <div className="ranking-summary-detail"><strong>{moneyRanking ? formatMoney(playerRow?.points ?? 0) : `${playerRow?.points ?? 0} points`}</strong><span>{moneyRanking ? 'Counting earnings' : 'Published results only'}</span></div>
        </section>
        <section className="ranking-summary-card ranking-summary-target">
          <div><p className="ranking-caption">Next position</p><strong className="ranking-number">{!playerRow ? 'Start your race' : playerRow.ranking === 1 ? 'Leading' : `#${nextTarget?.ranking ?? playerRow.ranking - 1}`}</strong></div>
          <div className="ranking-summary-detail">{playerRow && playerRow.ranking > 1 ? <><strong>{moneyRanking ? formatMoney(targetGap) : `${targetGap} pts`} away</strong>{nextTarget && <PlayerLink name={nextTarget.playerName} />}</> : <span>{playerRow ? 'Keep building your lead' : 'Complete a ranking event'}</span>}</div>
        </section>
        <button type="button" className="ranking-summary-card ranking-summary-credit text-left" onClick={() => setSection('Your race')}>
          <div><p className="ranking-caption">{moneyRanking ? 'Awaiting publication' : 'Ranking system'}</p><strong className="ranking-number">{moneyRanking ? formatMoney(pendingTotal) : activeTab === 'qSchool' || activeTab === 'senior' ? 'Frames won' : 'Event points'}</strong></div>
          <div className="ranking-summary-detail"><span>{moneyRanking ? `${pendingEarnings.length} pending award${pendingEarnings.length === 1 ? '' : 's'}` : 'See rules and sources'}</span><strong className="text-emerald-300">View your race →</strong></div>
        </button>
      </div>
      <div className="ranking-navigation flex shrink-0 items-center gap-2">
        <SectionTabs id="ranking-sections" label="Ranking sections" tabs={['Standings', 'Your race', 'Pathway'] as const} active={section} onChange={setSection} />
        <button type="button" className="btn-secondary ml-auto whitespace-nowrap px-3 py-2 text-xs" onClick={() => setShowRules(true)}>How this list works</button>
      </div>
      <div role="tabpanel" id="ranking-sections-panel" aria-labelledby={`ranking-sections-tab-${['Standings', 'Your race', 'Pathway'].indexOf(section)}`} className="min-h-0 min-w-0 flex-1 overflow-hidden">
        {section === 'Standings' && <section className="card flex h-full min-h-0 flex-col overflow-hidden" aria-label="Standings table">
          <div className="ranking-table-toolbar flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-3 py-2">
            <div className="mr-auto"><h2 className="text-sm font-bold text-white">{activeConfig.label}</h2><p className="text-[11px] text-gray-300"><span>{rosterOnly ? 'Player roster · awaiting results' : lists.length ? selectedList : developmentRanking ? 'Current-season points' : activeConfig.seasonLabel}</span> · {visibleRows.length} players</p></div>
            {lists.length > 0 && <select aria-label="Pathway standings" value={selectedList} onChange={e => setPathwayList(e.target.value)} className="rounded border border-border bg-background px-2 py-2 text-xs">{lists.map(list => <option key={list}>{list}</option>)}</select>}
            <input aria-label="Search players" type="search" placeholder="Find a player or nation…" className="ranking-search rounded border border-border bg-background px-3 py-2 text-xs" value={query} onChange={e => setQuery(e.target.value)} />
            <button type="button" className="btn-secondary px-3 py-2 text-xs" disabled={!activeRowsWithRatings.some(row => row.playerName === gameState.player.fullName)} onClick={() => { setQuery(''); requestAnimationFrame(() => humanRow.current?.scrollIntoView({ block: 'center', inline: 'nearest' })) }}>Find me</button>
          </div>
            {rosterOnly && <p className="px-3 py-2 text-xs text-gray-400">No published standings yet. {activeTab === 'youth' ? 'This roster includes eligible under-21 amateurs from other circuits. Existing seeds appear first; inclusion is not a confirmed event entry.' : 'These are the known players on this circuit, in starting seed order.'} Everyone is unranked until results count.{lists.length ? ' This is the circuit-wide roster, not a confirmed regional entry list.' : ''}</p>}

          <div className="min-h-0 flex-1 overflow-auto scrollbar-thin" tabIndex={0} aria-label="Ranking table scroll area">
              <table className="ranking-table w-full text-xs">
                <thead className="sticky top-0 z-10 bg-surface-light/95 backdrop-blur">
                  <tr className="border-b border-border text-gray-300">
                    <th className="px-3 py-2 text-left font-medium">Rank</th>
                    <th className="px-2 py-2 text-center font-medium">Move</th>
                    <th className="px-3 py-2 text-left font-medium">Player</th>
                    <th className="px-2 py-2 text-left font-medium">Nation</th>
                    <th className="px-2 py-2 text-center font-medium">Age</th>
                    <th className="px-2 py-2 text-center font-medium">OVR</th>
                    <th className="px-2 py-2 text-center font-medium">POT</th>
                    <th className="px-3 py-2 text-right font-medium">{moneyRanking ? 'Ranking earnings' : developmentRanking ? 'Ranking points' : 'Points'}</th>
                    <th className="px-3 py-2 text-right font-medium">{developmentRanking ? 'Prize earned' : 'Prize Money'}</th>
                    <th className="px-2 py-2 text-center font-medium">Events</th>
                    <th className="px-2 py-2 text-center font-medium">Titles</th>
                    <th className="px-3 py-2 text-center font-medium">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">{query ? "No players match your search." : pathwayStatus?.empty ?? (developmentRanking ? 'No published ranking results this season yet. Starting seed positions are not earned rankings.' : 'Complete events in this circuit to start its standings.')}</td></tr>}
                  {visibleRows.map((row) => (
                    <tr key={row.id} ref={row.playerName === gameState.player.fullName ? humanRow : undefined} data-human={row.playerName === gameState.player.fullName} className={`border-b border-border/40 ${row.highlighted ? 'bg-green-600/12' : 'hover:bg-surface-light/40'}`}>
                      <td className="px-3 py-2 font-bold text-white">{rosterOnly ? "—" : row.ranking}</td>
                      <td className="px-2 py-2 text-center"><Movement value={rosterOnly ? 0 : row.movement} /></td>
                      <td className={`px-3 py-2 font-medium ${row.highlighted ? 'text-green-400' : 'text-white'}`}><PlayerLink name={row.playerName} /></td>
                      <td className="px-2 py-2 text-gray-400">{row.nation}</td>
                      <td className="px-2 py-2 text-center tabular-nums text-gray-300">{row.age ?? "—"}</td>
                      <td className="px-2 py-2 text-center font-semibold text-white">{Math.round(row.overall)}</td>
                      <td className="px-2 py-2 text-center font-semibold text-green-400">{Math.round(row.potential)}</td>
                      <td className="px-3 py-2 text-right text-white">{moneyRanking ? formatMoney(row.points) : row.points}</td>
                      <td className="px-3 py-2 text-right text-white">{formatMoney(row.prizeMoney)}</td>
                      <td className="px-2 py-2 text-center text-gray-400">{row.eventsPlayed}</td>
                      <td className="px-2 py-2 text-center text-white">{row.titles}</td>
                      <td className="px-3 py-2">
                        <div
                          className="flex justify-center gap-1"
                          aria-label={`Recent form: ${(
                            row.highlighted
                              ? gameState.player.form.slice(-8)
                              : buildFormDots(row.recentResults)
                          ).join(', ') || 'No recent matches'}`}
                        >
                          {(row.highlighted
                            ? gameState.player.form.slice(-8)
                            : buildFormDots(row.recentResults)
                          ).map((result, index) => (
                            <FormResult key={`${row.id}-${result}-${index}`} result={result} />
                          ))}
                          {!row.highlighted && buildFormDots(row.recentResults).length === 0 ? (
                            <span className="text-[9px] text-gray-600">No recent matches</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          <div className="ranking-table-footer flex shrink-0 flex-wrap justify-between gap-1 border-t border-border px-3 py-2 text-[11px] text-gray-300"><span>Player names open profiles · OVR overall · POT potential</span><span>Form: oldest → newest · W win / D draw / L loss</span></div>
        </section>}
        {section === 'Your race' && <div className="h-full overflow-y-auto scrollbar-thin" aria-label="Ranking insights">
      {moneyRanking && !finalRankingTab && pendingEarnings.length > 0 && <section aria-label="Pending ranking credit" className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
        <h2 className="font-semibold text-amber-300">Results recorded · ranking credit pending</h2>
        <p className="mt-1 text-gray-300">Rankings update on the event’s scheduled finish date, even if you finish your matches earlier. Prize money is paid separately.</p>
        <ul className="mt-1 max-h-24 space-y-1 overflow-y-auto">{pendingEarnings.map(e => <li key={e.id} className="text-gray-300">{gameState.rollingRankings?.events[e.eventKey]?.name ?? e.eventKey}: <strong className="text-white">+{formatMoney(e.amount)}</strong> counts from <strong className="text-white">{e.earnedOn}</strong>.</li>)}</ul>
        <p className="mt-1 text-gray-400">Your eventual position also depends on other players’ results and expiring earnings. Exhibitions award no world-ranking credit.</p>
      </section>}
      {developmentRanking && <section aria-label="Ranking points explained" className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-gray-300">
        <p><strong className="text-white">{gameState.season} · Finishing-position points</strong> · Prize money does not determine rank. Only published ranking events count; non-ranking club events and starting seeds earn no points.</p>
        <p className="mt-1 text-gray-400">Ties use titles, match wins, fewer losses, then alphabetical order.{nextDevelopmentEvent ? ` Next ranking results: ${nextDevelopmentEvent.name} · ${nextDevelopmentEvent.endDate ?? nextDevelopmentEvent.startDate}.` : ''}</p>
      </section>}

          <div className="ranking-insights-grid">
          <div className="card ranking-chart flex flex-col overflow-hidden">
            <div className="card-header shrink-0 px-3 py-2"><h3 className="text-sm font-semibold text-white">Ranking Movement</h3></div>
            <div className="min-h-0 flex-1 px-2 py-2">
              {rankingMomentum.length===0 ? <p className="p-2 text-xs text-gray-400">No published ranking history yet.</p> : <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                <LineChart data={rankingMomentum}>
                  <CartesianGrid stroke="#203449" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis reversed tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={26} />
                  <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>}
            </div>
          </div>

          <div className="card min-h-0 px-3 py-2.5 text-center">
            <h3 className="text-xs font-semibold text-white">Next Target</h3>
            <p className="mt-1 text-3xl font-bold text-white">{playerRow?.ranking === 1 ? "Leading the list" : playerRow ? '#' + (nextTarget?.ranking ?? Math.max(1, playerRow.ranking - 1)) : 'Unranked'}</p>
            <p className="mt-1 text-xs text-green-400">{playerRow?.ranking === 1 ? 'Set the pace for the chasing field' : !playerRow ? 'Complete a ranking event' : <>Needs {moneyRanking ? formatMoney(Math.max(0, (nextTarget?.points ?? 0) - (playerRow?.points ?? 0) + 1)) : `${Math.max(0, (nextTarget?.points ?? 0) - (playerRow?.points ?? 0) + 1)} pts`}</>}</p>
            <p className="mt-1 truncate text-[10px] text-gray-500">{eventAffectsActiveTable ? `${nextTournament?.name} can shift this race.` : nextDevelopmentEvent ? `Next ranking event: ${nextDevelopmentEvent.name}.` : 'Only published results for this ranking list count.'}</p>
          </div>

          <div className="card flex flex-col px-3 py-2.5">
            <h3 className="mb-2 text-xs font-semibold text-white">Recent Ranking Sources</h3>
            <div className="max-h-36 space-y-1.5 overflow-y-auto text-[10px] text-gray-400 scrollbar-thin">
              {activeTab === 'world' && <p className="text-amber-300">Next 30 days expiring: {formatMoney(earningsSummary.expiring)}</p>}
              {activeTab === 'world' && earningsSummary.estimated > 0 && <p className="text-amber-300">Estimated opening carry-over: {formatMoney(earningsSummary.estimated)}. Replaced by recorded results as it expires. New awards post at the event's scheduled finish.</p>}
              {moneyRanking && <p className="text-sky-300">Latest world update: {gameState.rollingRankings?.revisions.at(-1)?.date ?? 'Opening list'} · {Object.values(gameState.rollingRankings?.events ?? {}).filter(e => e.applied && e.ranking && e.season === gameState.season).length} ranking events settled this season.</p>}
              {rankingSources.length > 0 ? rankingSources.map((item) => (
                <div key={item.label} className="rounded bg-surface-light/70 px-2.5 py-2">
                  <span className="text-white">{item.label}</span> <span className="text-gray-500">•</span> {moneyRanking ? formatMoney(item.points) : `${item.points} pts`}
                </div>
              )) : <div className="rounded bg-surface-light/70 px-2.5 py-2">No ranked matches logged yet.</div>}
            </div>
          </div>

          <div className="card min-h-0 px-3 py-2.5">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-white"><Target className="h-3 w-3 text-green-400" /> Event Scenarios</h3>
            {!eventAffectsActiveTable && <p className="text-xs text-gray-400">{nextTournament ? `${nextTournament.name} awards no points for this ranking list. Your rank will not change from this event.` : 'No upcoming ranking event selected.'}</p>}
            <div className="grid grid-cols-3 gap-2">
              {rankingScenarios.map((scenario) => (
                <div key={scenario.label} className="flex min-h-0 flex-col items-center justify-center rounded bg-surface-light/70 px-2 py-1.5 text-center">
                  <p className="text-[9px] text-gray-500">{scenario.label}</p>
                  <p className="text-sm font-bold text-green-400">+{moneyRanking ? formatMoney(scenario.points) : scenario.points}</p>
                  <p className="text-[10px] text-gray-400">{scenario.projectedRank==null ? 'Rank available after publication' : `Rank ${scenario.projectedRank}`}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card min-h-0 px-3 py-2.5">
            <h3 className="mb-2 text-xs font-semibold text-white">Form</h3><p className="mb-3 text-xs text-gray-300">OVR {Math.round(playerOverall)} · POT {Math.round(playerPotential)} · Last ten matches</p>
            <div className="flex flex-wrap items-center gap-1">
              {gameState.player.form.length === 0 && <p className="text-xs text-gray-300">No recent matches.</p>}
              {gameState.player.form.slice(-10).map((result, index) => <FormResult key={`${result}-${index}`} result={result} />)}
            </div>
          </div>

          </div>
        </div>}
        {section === 'Pathway' && <div className="h-full space-y-3 overflow-auto scrollbar-thin">
          <div className="ranking-pathway-cards">{rankingCards.map(card => <section className="card p-4" key={card.title}><h2 className="text-sm font-semibold text-emerald-300">{card.title}</h2><p className="mt-2 text-sm text-white">{card.body}</p></section>)}</div>
          {qTourPlaces?.automatic && <p className="text-sm text-emerald-300">Provisional Europe card: {qTourPlaces.automatic}</p>}
          <QualificationRacesPanel />
          <TourDevelopmentPanel />
        </div>}
      </div>
      {showRules && <CareerEditor title={`${activeConfig.label} · How it works`} onClose={() => setShowRules(false)}>
        {developmentRanking ? <section className="space-y-3 text-sm"><p>Finishing-position points determine rank, not prize money. Only published ranking events count; non-ranking club events and starting seeds earn no points.</p><p>Ties use titles, match wins, fewer losses, then alphabetical order.</p>{nextDevelopmentEvent && <p>Next ranking results: {nextDevelopmentEvent.name} · {nextDevelopmentEvent.endDate ?? nextDevelopmentEvent.startDate}.</p>}</section>
          : moneyRanking ? <section className="space-y-3 text-sm"><p>{activeTab === 'world' ? 'World ranking counts eligible earnings over two years. Older awards expire while new results enter the list.' : 'The one-year list counts eligible ranking earnings from the current season.'}</p><p>Credit publishes on the event’s scheduled finish date. Prize payments are separate. Non-ranking invitationals and exhibitions do not add world-ranking credit.</p><p>Projections hold other players’ totals constant. Other results and expiring earnings can change the eventual position.</p></section>
          : <section className="space-y-3 text-sm"><p>{selectedList} · {pathwayStatus?.completed ?? 0} completed events. Other players’ results count even when you do not enter.</p><p>{pathwayStatus?.empty}</p><p>{activeTab === 'qSchool' ? 'Q School orders of merit use frames won. Select UK or Asia to see the separate lists.' : activeTab === 'qTour' ? 'Regional Q Tour lists track published event points. Select a region to follow its race.' : 'Select the two-year seniors list or the current Race to the Crucible.'}</p></section>}
        <p className="mt-4 text-xs text-gray-300">Roster entries are unranked until results count. Roster membership is not confirmation of eligibility or entry for any individual event.</p>
      </CareerEditor>}
    </div>
  )
}
