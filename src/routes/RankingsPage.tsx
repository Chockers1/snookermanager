import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Minus, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useGame } from '../context/useGame'
import { getNextEligibleTournament } from '../hooks/useGameState'
import { getPlayableRounds, resolveTournamentFormat } from '../data/tournamentFormats'
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
  { key: 'amateur', label: 'Amateur Ranking', seasonLabel: 'Amateur pathway', rankField: 'amateurRank' },
  { key: 'qTour', label: 'Q Tour Ranking', seasonLabel: 'Global Q Tour', rankField: 'qTourRank' },
  { key: 'qSchool', label: 'Q School OOM', seasonLabel: 'Top-up race', rankField: 'qSchoolRank' },
  { key: 'senior', label: 'Senior Ranking', seasonLabel: 'Late-career circuit', rankField: 'seniorRank' },
  { key: 'youth', label: 'Youth Ranking', seasonLabel: 'Junior development', rankField: 'youthRank' },
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

function formTone(result: string) {
  if (result === 'W') return 'bg-green-500'
  if (result === 'L') return 'bg-red-500'
  return 'bg-amber-500'
}

function buildFormDots(wins: number, losses: number) {
  const total = Math.max(1, Math.min(8, wins + losses))
  const winDots = Math.min(total, wins)
  return Array.from({ length: total }, (_, index) => index < winDots ? 'W' : 'L')
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
  const currentPathTab: RankingTabKey = gameState.careerSystems.lateCareer.seniorActive
    ? 'senior'
    : gameState.careerSystems.pro.hasTourCard
      ? 'world'
      : gameState.careerSystems.qSchool.campaignsEntered > 0
        ? 'qSchool'
        : gameState.careerSystems.qTour.playerPoints > 0
          ? 'qTour'
          : 'amateur'
  const defaultTab = finalRankingTab ?? currentPathTab
  const [activeTab, setActiveTab] = useState<RankingTabKey>(defaultTab)
  const activeConfig = rankingTabs.find((tab) => tab.key === activeTab) ?? rankingTabs[0]
  const activeRows = gameState.competitionTables[activeConfig.key]
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
        overall: playerOverall,
        potential: playerPotential,
      }
    }

    const archive = worldPlayerByName.get(row.playerName)
    return {
      ...row,
      ...getEstimatedRatings(row.playerName, row.ranking, ratingCircuit, archive?.age),
    }
  })
  const playerRow = activeRowsWithRatings.find((row) => row.playerName === gameState.player.fullName) ?? activeRowsWithRatings[0]
  const nextTournament = getNextEligibleTournament(gameState)
  const nextTarget = activeRowsWithRatings.find((row) => row.ranking === Math.max(1, (playerRow?.ranking ?? 2) - 1))
  const rankingSources = buildTournamentRankingSources(
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
  const rankingScenarios = scenarioDefinitions.map((scenario) => {
    const points = eventAffectsActiveTable
      ? getProjectedTournamentRankingPoints(nextTournament, scenario.round, scenario.champion)
      : 0
    return {
      label: scenario.label,
      points,
      projectedRank: projectRankingAfterEvent(
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
    value: season[activeConfig.rankField] ?? playerRow?.ranking ?? 1,
  }))
  const rankingMomentum = archivedMomentum.length > 0
    ? archivedMomentum
    : Array.from({ length: 6 }, (_, index) => ({
        label: `W${index + 1}`,
        value: Math.max(1, (playerRow?.ranking ?? 1) + (5 - index) - Math.max(0, playerRow?.movement ?? 0)),
      }))
  const rankingCards = [
    { title: 'Tour Card', body: gameState.careerSystems.pro.hasTourCard ? `${gameState.careerSystems.pro.survivalStatus} - ${gameState.careerSystems.pro.yearsRemaining > 0 ? `${gameState.careerSystems.pro.yearsRemaining} season(s) left` : 'retained on merit'}` : 'No active main-tour card yet.' },
    { title: 'Q Tour', body: gameState.careerSystems.qTour.playerRank ? `Rank ${gameState.careerSystems.qTour.playerRank} - ${gameState.careerSystems.qTour.playerPoints} pts${gameState.careerSystems.qTour.directCardAwarded ? ' - card secured' : ''}` : 'No Q Tour points logged yet.' },
    { title: 'Q School', body: `${gameState.careerSystems.qSchool.campaignsEntered} campaigns - ${gameState.careerSystems.qSchool.repeatedFailures} failed runs${gameState.careerSystems.qSchool.topUpEligible ? ' - top-up live' : ''}` },
    { title: 'Late Career', body: gameState.careerSystems.lateCareer.seniorActive ? 'Senior circuit active.' : gameState.careerSystems.lateCareer.seniorEligible ? 'Senior eligible; veteran path open.' : gameState.careerSystems.lateCareer.veteranActive ? 'Veteran phase active.' : 'Standard career phase.' },
  ]
  const playerMovement = playerRow?.movement ?? 0
  const playerMovementTone = playerMovement > 0 ? 'text-green-400' : playerMovement < 0 ? 'text-red-400' : 'text-gray-400'
  const movementLabel = playerMovement > 0 ? `+${playerMovement}` : `${playerMovement}`

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:-m-6 xl:h-[calc(100vh-5.5rem)] xl:gap-2 xl:overflow-hidden xl:p-1.5">
      <div className="rounded-xl border border-border bg-surface/85 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Rankings</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-white">Rankings</h1>
            <p className="mt-1 truncate text-xs text-gray-400">{finalRankingTab ? `Final complete: your updated ${activeConfig.label.toLowerCase()} is shown first.` : 'Track the live ladder, pathway pressure, and the next event impact.'}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setActiveTab(defaultTab)}>{finalRankingTab ? 'Final Ranking' : 'Current Path'}</button>
            <button type="button" className="btn-primary px-3 py-2 text-xs" onClick={() => navigate('/calendar')}>Next Event</button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {rankingTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={tab.key === activeTab ? 'tab-active px-2.5 py-1 text-[11px]' : 'tab-inactive px-2.5 py-1 text-[11px]'}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-2">
        <div className="grid min-h-0 gap-3 xl:col-span-8 xl:grid-rows-[minmax(0,1fr)_84px] xl:gap-2">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header px-3 py-2.5"><h3 className="text-sm font-semibold text-white">{activeConfig.label}</h3><span className="text-[10px] text-gray-400">{activeConfig.seasonLabel}</span></div>
            <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 z-10 bg-surface-light/95 backdrop-blur">
                  <tr className="border-b border-border text-gray-500">
                    <th className="px-3 py-2 text-left font-medium">Rank</th>
                    <th className="px-2 py-2 text-center font-medium">Move</th>
                    <th className="px-3 py-2 text-left font-medium">Player</th>
                    <th className="px-2 py-2 text-left font-medium">Nation</th>
                    <th className="px-2 py-2 text-center font-medium">OVR</th>
                    <th className="px-2 py-2 text-center font-medium">POT</th>
                    <th className="px-3 py-2 text-right font-medium">Points</th>
                    <th className="px-3 py-2 text-right font-medium">Prize Money</th>
                    <th className="px-2 py-2 text-center font-medium">Events</th>
                    <th className="px-2 py-2 text-center font-medium">Titles</th>
                    <th className="px-3 py-2 text-center font-medium">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRowsWithRatings.map((row) => (
                    <tr key={row.id} className={`border-b border-border/40 ${row.highlighted ? 'bg-green-600/12' : 'hover:bg-surface-light/40'}`}>
                      <td className="px-3 py-2 font-bold text-white">{row.ranking}</td>
                      <td className="px-2 py-2 text-center"><Movement value={row.movement} /></td>
                      <td className={`px-3 py-2 font-medium ${row.highlighted ? 'text-green-400' : 'text-white'}`}>{row.playerName}</td>
                      <td className="px-2 py-2 text-gray-400">{row.nation}</td>
                      <td className="px-2 py-2 text-center font-semibold text-white">{row.overall}</td>
                      <td className="px-2 py-2 text-center font-semibold text-green-400">{row.potential}</td>
                      <td className="px-3 py-2 text-right text-white">{row.points}</td>
                      <td className="px-3 py-2 text-right text-white">{formatMoney(row.prizeMoney)}</td>
                      <td className="px-2 py-2 text-center text-gray-400">{row.eventsPlayed}</td>
                      <td className="px-2 py-2 text-center text-white">{row.titles}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center gap-1">
                          {buildFormDots(row.wins, row.losses).map((result, index) => (
                            <span key={`${row.id}-${result}-${index}`} className={`h-2 w-2 rounded-full ${formTone(result)}`} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid h-full grid-cols-4 gap-2">
            {rankingCards.map((card) => (
              <div key={card.title} className="card min-h-0 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">{card.title}</p>
                <p className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-gray-300">{card.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 gap-3 xl:col-span-4 xl:grid-rows-[0.23fr_0.22fr_0.14fr_0.16fr_0.17fr_0.08fr] xl:gap-2">
          <div className="card min-h-0 overflow-hidden bg-gradient-to-b from-surface-light/80 to-surface/80 px-4 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">{finalRankingTab ? 'Current Ranking After Final' : `Your ${activeConfig.label}`}</p>
            <p className="mt-1 text-5xl font-bold text-white">#{playerRow?.ranking ?? '-'}</p>
            <div className={`mt-1 flex items-center justify-center gap-1 text-xs ${playerMovementTone}`}>
              {playerMovement > 0 ? <TrendingUp className="h-3 w-3" /> : playerMovement < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              <span>{movementLabel} movement</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-300">OVR <span className="font-semibold text-white">{playerRow?.overall ?? '-'}</span> <span className="mx-1 text-border">|</span> POT <span className="font-semibold text-green-400">{playerRow?.potential ?? '-'}</span></p>
            <p className="mt-1 text-[10px] text-gray-400">{playerRow?.points ?? 0} points <span className="mx-1 text-border">•</span> {formatMoney(playerRow?.prizeMoney ?? 0)}</p>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header px-3 py-2"><h3 className="text-sm font-semibold text-white">Ranking Movement</h3></div>
            <div className="card-body h-full min-h-0 px-2 py-2">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                <LineChart data={rankingMomentum}>
                  <CartesianGrid stroke="#203449" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis reversed tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={26} />
                  <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card min-h-0 px-3 py-2.5 text-center">
            <h3 className="text-xs font-semibold text-white">Next Target</h3>
            <p className="mt-1 text-3xl font-bold text-white">#{nextTarget?.ranking ?? Math.max(1, (playerRow?.ranking ?? 2) - 1)}</p>
            <p className="mt-1 text-xs text-green-400">Needs {Math.max(0, (nextTarget?.points ?? 0) - (playerRow?.points ?? 0) + 1)} pts</p>
            <p className="mt-1 truncate text-[10px] text-gray-500">{nextTournament?.name ?? 'Next event'} can shift this race.</p>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-2.5">
            <h3 className="mb-2 text-xs font-semibold text-white">Recent Ranking Sources</h3>
            <div className="min-h-0 flex-1 space-y-1.5 overflow-auto text-[10px] text-gray-400 scrollbar-thin">
              {rankingSources.length > 0 ? rankingSources.map((item) => (
                <div key={item.label} className="rounded bg-surface-light/70 px-2.5 py-2">
                  <span className="text-white">{item.label}</span> <span className="text-gray-500">•</span> {item.points} pts <span className="text-gray-500">•</span> {formatMoney(item.prizeMoney)}
                </div>
              )) : <div className="rounded bg-surface-light/70 px-2.5 py-2">No ranked matches logged yet.</div>}
            </div>
          </div>

          <div className="card min-h-0 px-3 py-2.5">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-white"><Target className="h-3 w-3 text-green-400" /> Event Scenarios</h3>
            <div className="grid h-[calc(100%-1.5rem)] grid-cols-3 gap-2">
              {rankingScenarios.map((scenario) => (
                <div key={scenario.label} className="flex min-h-0 flex-col items-center justify-center rounded bg-surface-light/70 px-2 py-1.5 text-center">
                  <p className="text-[9px] text-gray-500">{scenario.label}</p>
                  <p className="text-sm font-bold text-green-400">+{scenario.points}</p>
                  <p className="text-[10px] text-gray-400">Rank {scenario.projectedRank}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card min-h-0 px-3 py-2.5">
            <h3 className="mb-2 text-xs font-semibold text-white">Form</h3>
            <div className="flex items-center gap-1">
              {gameState.player.form.slice(0, 10).map((result, index) => <span key={`${result}-${index}`} className={`h-2.5 w-2.5 rounded-full ${formTone(result)}`} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
