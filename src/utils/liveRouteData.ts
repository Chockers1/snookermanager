import {
  chalkCatalog,
  cueCatalog,
  cueMarketplaceCatalog,
  hotelOptionCatalog,
  negotiationOptionCatalog,
  tipCatalog,
  travelOptionCatalog,
  treatmentOptionCatalog,
} from '../data/catalogs'
import { getNextEligibleTournament, getTournamentEntryAccess, type GameState } from '../hooks/useGameState'
import type {
  BracketRound,
  CoachFeedbackGroup,
  DrillLibraryGroup,
  EquipmentImpactCard,
  InboxMessage,
  PlayerAttributes,
  RankingRow,
  RecoveryActionCard,
  TrainingPlannerDay,
  TrainingPlannerSummary,
  TrainingSlot,
  Tournament,
} from '../types/game'
import {
  calculateOverallRating,
  calculatePotentialRating,
  calculateTechnicalAverage,
} from './calculations'
import { getRoundDifficultyBonus } from './matchOutcomeModel'
import { summarizeTrainingPlan } from './trainingPlan'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

const PREVIEW_RANK_BASELINES: Partial<Record<string, { technical: number; mental: number; physical: number }>> = {
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

const PREVIEW_OPPONENT_ARCHETYPES = ['Serial Scorer', 'Tactical Grinder', 'Counter Puncher', 'Tempo Disruptor'] as const

function hashStringToNumber(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647
  }

  return Math.abs(hash)
}

function getPreviewOpponentArchetype(opponentName: string, opponentRank: number) {
  const seed = hashStringToNumber(`${opponentName}-${opponentRank}`)
  return PREVIEW_OPPONENT_ARCHETYPES[seed % PREVIEW_OPPONENT_ARCHETYPES.length]
}

function getCanonicalHistoryTotals(state: GameState) {
  const completedEvents = state.history.tournamentHistory
    .map((entry) => entry.canonicalResult ?? {
      matchesPlayed: entry.matchesPlayed,
      wins: entry.wins,
      losses: entry.losses,
      prizeMoney: entry.prizeMoney,
    })
    .filter((entry) => entry.matchesPlayed > 0)

  return {
    matchesPlayed: completedEvents.reduce((sum, entry) => sum + entry.matchesPlayed, 0),
    wins: completedEvents.reduce((sum, entry) => sum + entry.wins, 0),
    losses: completedEvents.reduce((sum, entry) => sum + entry.losses, 0),
    prizeMoney: completedEvents.reduce((sum, entry) => sum + entry.prizeMoney, 0),
  }
}

function getActiveTournament(state: GameState) {
  return getNextEligibleTournament(state)
}

function getPreviewTournamentClass(tournament: Tournament | undefined) {
  if (!tournament) return 'amateur'

  const name = tournament.name.toLowerCase()
  const rankingType = tournament.rankingType ?? 'None'

  if (rankingType === 'Youth' || tournament.type === 'Junior' || /under-|youth|junior/.test(name)) return 'youth'
  if (rankingType === 'Amateur' || tournament.type === 'Amateur') return 'amateur'
  if (tournament.type === 'Q Tour') return 'qTour'
  if (tournament.type === 'Q School') return 'qSchool'
  if (tournament.type === 'Senior') return 'senior'
  if (tournament.type === 'Exhibition') return 'exhibition'
  if (tournament.type === 'Invitational') return 'eliteInvitational'
  if (tournament.type === 'Major' && /world championship/.test(name)) return name.includes('qualif') ? 'worldChampionshipQualifying' : 'worldChampionshipMain'
  if (tournament.type === 'Professional Tour') return 'rookieQualifier'
  return rankingType === 'World Ranking' || tournament.type === 'Ranking' || tournament.type === 'Major' ? 'top64' : 'amateur'
}

function getPreviewRankBand(opponentRank: number, tournamentClass: string) {
  if (tournamentClass === 'youth') return 'Youth'
  if (tournamentClass === 'amateur') return 'Amateur'
  if (tournamentClass === 'qTour' || tournamentClass === 'qSchool') return 'Q Tour'
  if (tournamentClass === 'senior' || tournamentClass === 'exhibition') return 'Veteran Min Support'
  if (opponentRank <= 1) return 'World Champion'
  if (opponentRank <= 4) return 'Top 4'
  if (opponentRank <= 16) return 'Top 16'
  if (opponentRank <= 32) return 'Top 32'
  if (opponentRank <= 64) return 'Top 64'
  if (opponentRank <= 80) return 'Rookie Pro'
  if (opponentRank <= 96) return 'Q Tour'
  if (opponentRank <= 128) return 'Amateur'
  return 'Youth'
}

function getPreviewOpponentBaseStrength(tournamentClass: string) {
  if (tournamentClass === 'youth') return 48
  if (tournamentClass === 'amateur') return 56
  if (tournamentClass === 'qTour') return 64
  if (tournamentClass === 'qSchool') return 69
  if (tournamentClass === 'senior') return 54
  if (tournamentClass === 'exhibition') return 58
  if (tournamentClass === 'eliteInvitational') return 78
  if (tournamentClass === 'worldChampionshipMain') return 80
  if (tournamentClass === 'worldChampionshipQualifying') return 74
  if (tournamentClass === 'rookieQualifier') return 71
  return 68
}

function getPreviewRankingWeight(tournamentClass: string) {
  if (tournamentClass === 'youth') return 0.18
  if (tournamentClass === 'amateur') return 0.22
  if (tournamentClass === 'qTour') return 0.28
  if (tournamentClass === 'qSchool') return 0.3
  if (tournamentClass === 'senior' || tournamentClass === 'exhibition') return 0.16
  if (tournamentClass === 'eliteInvitational' || tournamentClass === 'worldChampionshipMain') return 0.38
  return 0.32
}

function getPreviewOpponentRatingSnapshot(
  opponentName: string,
  opponentRank: number,
  round: string | null,
  tournament: Tournament | undefined,
  opponentAge?: number,
) {
  const tournamentClass = getPreviewTournamentClass(tournament)
  const opponentStrength = clamp(
    getPreviewOpponentBaseStrength(tournamentClass)
      + (100 - opponentRank) * getPreviewRankingWeight(tournamentClass)
      + getRoundDifficultyBonus(round ?? 'Last 16', tournamentClass),
    44,
    97,
  )
  const sourceRankBand = getPreviewRankBand(opponentRank, tournamentClass)
  const baseline = PREVIEW_RANK_BASELINES[sourceRankBand]
  const eliteFactor = clamp(Math.round((100 - opponentRank) * 0.45), 6, 44)
  const technicalAverage = baseline
    ? clamp(baseline.technical + Math.round((opponentStrength - baseline.technical) * 0.25), 42, 94)
    : clamp(Math.round(opponentStrength + eliteFactor * 0.16), 42, 94)
  const mentalAverage = baseline
    ? clamp(baseline.mental + Math.round((opponentStrength - baseline.mental) * 0.18), 40, 93)
    : clamp(Math.round(opponentStrength - 2 + eliteFactor * 0.12), 40, 93)
  const physicalAverage = baseline
    ? clamp(baseline.physical + Math.round((opponentStrength - baseline.physical) * 0.12), 38, 90)
    : clamp(Math.round(opponentStrength - 5 + eliteFactor * 0.08), 38, 90)
  const archetype = getPreviewOpponentArchetype(opponentName, opponentRank)
  const attributes: PlayerAttributes = {
    technical: {
      'Long Potting': technicalAverage,
      'Break Building': clamp(technicalAverage + 2, 1, 99),
      'Cue Ball Control': clamp(technicalAverage - 1, 1, 99),
      'Safety Play': clamp(technicalAverage, 1, 99),
      Consistency: clamp(technicalAverage - 2, 1, 99),
    },
    mental: {
      Focus: mentalAverage,
      Composure: clamp(mentalAverage - 1, 1, 99),
      'Big Match Nerve': clamp(mentalAverage + 1, 1, 99),
      Resilience: clamp(mentalAverage - 1, 1, 99),
      Professionalism: clamp(mentalAverage, 1, 99),
    },
    physical: {
      Stamina: physicalAverage,
      'Recovery Rate': clamp(physicalAverage - 2, 1, 99),
      Balance: clamp(physicalAverage - 1, 1, 99),
      'Hand Steadiness': clamp(physicalAverage - 1, 1, 99),
      'Shoulder Health': clamp(physicalAverage - 2, 1, 99),
    },
  }

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

  const overall = calculateOverallRating({ attributes })

  return {
    attributes,
    archetype,
    technicalAverage: average(Object.values(attributes.technical)),
    mentalAverage: average(Object.values(attributes.mental)),
    physicalAverage: average(Object.values(attributes.physical)),
    overall,
    potential: calculatePotentialRating({
      attributes,
      age: opponentAge,
      overallRating: overall,
    }),
  }
}

function getActiveDraw(state: GameState) {
  const activeTournament = getActiveTournament(state)
  if (!activeTournament || state.tournamentProgress.tournamentId !== activeTournament.id) return []
  return state.tournamentProgress.draw
}

function findPlayerDrawMatch(draw: BracketRound[], playerName: string, roundLabel?: string | null) {
  const rounds = roundLabel ? draw.filter((round) => round.label === roundLabel) : draw
  for (const round of rounds) {
    const match = round.matches.find((item) => item.top.name === playerName || item.bottom.name === playerName)
    if (match) return match
  }
  return null
}

function createFallbackRankingRow(name: string, rank: number, nation: string): RankingRow {
  return {
    id: `draw-${name}`,
    playerName: name,
    nation,
    ranking: rank,
    movement: 0,
    points: 0,
    prizeMoney: 0,
  }
}

function getCurrentCoach(state: GameState) {
  return state.coaches.find((coach) => coach.id === state.currentCoachId) ?? null
}

function getCurrentCue(state: GameState) {
  return state.equipment.currentCueId
    ? cueMarketplaceCatalog.find((cue) => cue.id === state.equipment.currentCueId) ?? cueMarketplaceCatalog[0]
    : cueMarketplaceCatalog[0]
}

function getCurrentCueState(state: GameState) {
  return state.equipment.currentCueId ? state.equipment.cueStates[state.equipment.currentCueId] : undefined
}

function getCurrentChalk(state: GameState) {
  return state.equipment.currentChalkId
    ? chalkCatalog.find((chalk) => chalk.id === state.equipment.currentChalkId) ?? chalkCatalog[0]
    : chalkCatalog[0]
}

function getCurrentTip(state: GameState) {
  return state.equipment.currentTipId
    ? tipCatalog.find((tip) => tip.id === state.equipment.currentTipId) ?? tipCatalog[0]
    : tipCatalog[0]
}

function getTrendLabels(state: GameState, count: number) {
  const snapshots = state.history.snapshots.slice(-count)
  if (snapshots.length > 0) {
    return snapshots.map((snapshot) => ({
      label: `W${snapshot.week}`,
      ranking: snapshot.ranking || (state.player.amateurRanking ?? state.player.worldRanking ?? 0),
      confidence: snapshot.confidence,
      fatigue: snapshot.fatigue,
      morale: snapshot.morale,
      cash: snapshot.cash,
    }))
  }

  return Array.from({ length: count }, (_, index) => ({
    label: `W${Math.max(1, state.week - (count - index - 1))}`,
    ranking: state.player.amateurRanking ?? state.player.worldRanking ?? 0,
    confidence: clamp(state.player.confidence - (count - index - 1) * 2, 0, 100),
    fatigue: clamp(state.player.fatigue + (count - index - 1) * 2, 0, 100),
    morale: clamp(state.player.morale - (count - index - 1), 0, 100),
    cash: state.player.cash - (count - index - 1) * Math.max(0, state.finance.baseCashFlow),
  }))
}

function getUpcomingOpponent(state: GameState) {
  const activeTournament = getActiveTournament(state)
  const draw = getActiveDraw(state)
  const bracketMatch = activeTournament
    ? findPlayerDrawMatch(draw, state.player.fullName, state.tournamentProgress.currentRound)
    : null
  const bracketOpponent = bracketMatch
    ? bracketMatch.top.name === state.player.fullName
      ? bracketMatch.bottom
      : bracketMatch.top
    : null

  if (bracketOpponent && bracketOpponent.name !== 'TBD') {
    return state.rankings.find((row) => row.playerName === bracketOpponent.name)
      ?? createFallbackRankingRow(bracketOpponent.name, bracketOpponent.rank, bracketOpponent.nation)
  }

  const completedOpponents =
    state.tournamentProgress.tournamentId === activeTournament?.id
      ? state.tournamentProgress.completedRounds.map((round) => round.opponentName)
      : []
  const playerRanking = state.player.amateurRanking ?? state.player.worldRanking ?? 1

  return (
    state.rankings.find(
      (row) =>
        row.playerName !== state.player.fullName &&
        !completedOpponents.includes(row.playerName) &&
        Math.abs(row.ranking - playerRanking) <= 6,
    ) ?? state.rankings.find((row) => row.playerName !== state.player.fullName)
  )
}

function summarizeInboxPreview(message: InboxMessage) {
  return `${message.sender}: ${message.subject}`
}

function getSponsorCapacity(state: GameState) {
  const ranking = state.rankings.find((row) => row.playerName === state.player.fullName)?.ranking ?? state.player.amateurRanking ?? state.player.worldRanking ?? 999
  if (ranking <= 16 || state.player.reputation >= 68) return 3
  if (ranking <= 32 || state.player.reputation >= 52) return 2
  return 1
}

function formatSponsorTimeLeft(weeksRemaining: number) {
  if (weeksRemaining <= 4) return `${weeksRemaining} week${weeksRemaining === 1 ? '' : 's'} left`
  const monthsLeft = Math.ceil(weeksRemaining / 4)
  return `${monthsLeft} month${monthsLeft === 1 ? '' : 's'} left`
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value}%`
}

function getResultMarginLabel(playerFrames: number, opponentFrames: number, result: 'Won' | 'Lost' | 'In Progress') {
  const frameMargin = Math.abs(playerFrames - opponentFrames)

  if (result === 'In Progress') return 'In progress'
  if (frameMargin <= 1) return result === 'Won' ? 'Narrow win' : 'Narrow defeat'
  if (frameMargin >= 4) return result === 'Won' ? 'Convincing win' : 'Heavy defeat'
  return result === 'Won' ? 'Controlled win' : 'Clear defeat'
}

function getRoundPressureWeight(round: string) {
  if (round === 'Final') return 8
  if (round === 'Semi Final') return 5
  if (round === 'Quarter Final') return 3
  if (round === 'Last 16') return 1
  return 0
}

function estimateOpponentDimension(baseStrength: number | undefined, bias: number) {
  return clamp(Math.round((baseStrength ?? 60) + bias), 38, 95)
}

function isDeciderMatch(bestOf: number, playerFrames: number, opponentFrames: number) {
  return Math.min(playerFrames, opponentFrames) === Math.ceil(bestOf / 2) - 1
}

function isQfPlusRound(round: string) {
  return round === 'Quarter Final' || round === 'Semi Final' || round === 'Final'
}

function formatRecord(wins: number, losses: number) {
  const total = wins + losses
  const percentage = total > 0 ? Math.round((wins / total) * 100) : 0
  return total > 0 ? `${wins}-${losses} (${percentage}%)` : '0-0'
}

function getPressureTrait(qfPlusRate: number, finalRate: number, deciderRate: number, finalSamples: number, deciderSamples: number) {
  if (finalSamples >= 3 && finalRate < 40 && deciderSamples >= 3 && deciderRate < 40) {
    return {
      label: 'Weak',
      diagnosis: 'Struggles when the match carries title or closing-frame pressure.',
    }
  }

  if (qfPlusRate >= 55 && (deciderSamples < 3 || deciderRate >= 50)) {
    return {
      label: 'Strong',
      diagnosis: 'Usually holds level once the event reaches the pressure rounds.',
    }
  }

  return {
    label: 'Developing',
    diagnosis: 'Competitive in pressure matches, but conversion is still inconsistent.',
  }
}

export function buildDashboardData(state: GameState) {
  const currentCue = getCurrentCue(state)
  const scoutedCue =
    cueMarketplaceCatalog.find((cue) => !state.equipment.cuesOwned.includes(cue.id) && cue.id !== currentCue.id) ??
    cueMarketplaceCatalog.find((cue) => cue.id !== currentCue.id) ??
    currentCue
  const trend = getTrendLabels(state, 6)
  const trainingWeek: TrainingSlot[] = state.trainingPlan.length > 0
    ? state.trainingPlan.map((day) => ({
        day: day.day,
        morning: day.morning.title,
        afternoon: day.afternoon.title,
        evening: day.evening.title,
      }))
    : [
        { day: 'Mon', morning: 'Long Pot Routine', afternoon: 'Safety Exchanges', evening: 'Recovery' },
        { day: 'Tue', morning: 'Break Building', afternoon: 'Mental Training', evening: 'Rest' },
        { day: 'Wed', morning: state.player.fatigue >= 60 ? 'Recovery' : 'Line-Up Drill', afternoon: 'Long Pot Routine', evening: 'Fitness' },
        { day: 'Thu', morning: 'Safety Exchanges', afternoon: 'Break Building', evening: 'Mental Training' },
        { day: 'Fri', morning: 'Recovery', afternoon: 'Match Prep', evening: 'Rest' },
        { day: 'Sat', morning: 'Match Prep', afternoon: 'Match Simulation', evening: 'Rest' },
        { day: 'Sun', morning: 'Recovery', afternoon: 'Rest', evening: 'Rest' },
      ]
  const financeChart = trend.map((point, index) => {
    const previousCash = index > 0 ? trend[index - 1].cash : point.cash - state.finance.cashFlow
    const delta = point.cash - previousCash
    return {
      label: point.label,
      income: Math.max(0, delta) + state.sponsors.length * 120,
      expenses: Math.max(0, -delta) + Math.max(0, -state.finance.cashFlow),
    }
  })

  return {
    currentCue,
    scoutedCue,
    trainingWeek,
    financeChart,
    newsRail: state.inbox.slice(0, 3).map((item) => ({ id: item.id, tag: item.priority, title: item.subject, detail: summarizeInboxPreview(item) })),
  }
}

export function buildFinanceData(state: GameState) {
  const activeTournament = getActiveTournament(state)
  const trend = getTrendLabels(state, 6)
  const sponsorIncome = state.sponsors.reduce((sum, sponsor) => sum + sponsor.monthlyValue, 0)
  const prizeIncome = getCanonicalHistoryTotals(state).prizeMoney
  const coachCost = state.coachContracts.reduce((sum, contract) => sum + contract.weeklyCost, 0)
  const travelCost = Object.values(state.travel.bookings).reduce((sum, booking) => sum + booking.totalCost, 0)
  const equipmentCost = state.maintenance.history.reduce((sum, item) => sum + item.cost, 0)
  const recordedExpenseCost = state.finance.ledger.reduce((sum, item) => sum + (item.type === 'Expense' ? Math.abs(item.amount) : 0), 0)
  const financeChart = trend.map((point, index) => {
    const previousCash = index > 0 ? trend[index - 1].cash : point.cash - state.finance.cashFlow
    const delta = point.cash - previousCash
    return {
      label: point.label,
      income: Math.max(0, delta) + Math.round(sponsorIncome / 4),
      expenses: Math.max(0, -delta) + coachCost + Math.max(0, -state.finance.cashFlow),
    }
  })
  const totalIncomeValue = sponsorIncome + prizeIncome + Math.max(0, state.finance.cashFlow * 4)
  const totalExpenseValue = coachCost * 4 + travelCost + equipmentCost + recordedExpenseCost + Math.max(0, -state.finance.cashFlow * 4)
  const incomeBreakdownRaw = [
    { label: 'Sponsors', value: sponsorIncome },
    { label: 'Prize Money', value: prizeIncome },
    { label: 'Weekly Surplus', value: Math.max(0, state.finance.cashFlow * 4) },
  ].filter((item) => item.value > 0)
  const expenseBreakdownRaw = [
    { label: 'Coach Costs', value: coachCost * 4 },
    { label: 'Travel', value: travelCost },
    { label: 'Maintenance', value: equipmentCost },
    { label: 'Recorded Expenses', value: recordedExpenseCost },
    { label: 'Operating Cost', value: Math.max(0, -state.finance.cashFlow * 4) },
  ].filter((item) => item.value > 0)
  const incomeBreakdown = incomeBreakdownRaw.map((item, index) => ({
    ...item,
    share: totalIncomeValue > 0 ? Math.round((item.value / totalIncomeValue) * 100) : 0,
    delta: 8 - index * 3,
  }))
  const expenseBreakdown = expenseBreakdownRaw.map((item, index) => ({
    ...item,
    share: totalExpenseValue > 0 ? Math.round((item.value / totalExpenseValue) * 100) : 0,
    delta: index === 0 ? 4 : -2 * index,
  }))
  const totalBudget = Math.max(1, totalExpenseValue || state.player.cash)
  const budgetAllocation = [
    { label: 'Competition', amount: travelCost + (activeTournament?.entryFee ?? 0), max: 60 },
    { label: 'Coaching', amount: coachCost * 4, max: 50 },
    { label: 'Equipment', amount: equipmentCost, max: 35 },
    { label: 'Reserve', amount: Math.max(0, state.player.cash - totalExpenseValue), max: 80 },
  ].map((item) => ({ ...item, current: clamp(Math.round((item.amount / totalBudget) * 100), 0, item.max) }))
  const tournamentPlanner = state.tournaments
    .filter((tournament) => getTournamentEntryAccess(state, tournament).allowed && new Date(tournament.endDate ?? tournament.startDate).getTime() >= new Date(state.currentDate).getTime())
    .sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime())
    .slice(0, 4)
    .map((tournament) => ({
    id: tournament.id,
    event: tournament.name,
    location: tournament.location,
    date: tournament.startDate,
    entryCost: tournament.entryFee,
    travelCost: tournament.travelCost,
    hotelCost: tournament.hotelCost,
    prizePotential: `Up to £${tournament.prizeMoney.toLocaleString('en-GB')}`,
    risk: tournament.fatigueRisk,
  }))
  const forecastCards = [1, 2, 3].map((month) => {
    const projectedBalance = state.player.cash + month * (sponsorIncome - coachCost * 4 + state.finance.cashFlow * 4)
    return {
      label: `Month ${month}`,
      projectedBalance,
      outlook: projectedBalance >= 12000 ? 'Stable' : projectedBalance >= 6000 ? 'Caution' : 'Pressure',
      trend: [0.4, 0.55, 0.65, 0.72].map((value, index) => Math.round(value * 10 + month * 2 + index)),
    }
  })
  const savingsValue = clamp(Math.round((Math.max(0, state.player.cash) / 25000) * 100), 0, 100)
  const stabilityValue = clamp(100 - Math.max(0, -state.finance.cashFlow), 20, 100)

  return {
    financeChart,
    incomeBreakdown,
    expenseBreakdown,
    budgetAllocation,
    tournamentPlanner,
    forecastCards,
    financialIndicators: {
      savings: {
        value: savingsValue,
        label: 'Savings cushion',
        status: state.player.cash >= 12000 ? 'Healthy' : state.player.cash >= 6000 ? 'Watchlist' : 'Thin',
      },
      stability: {
        label: 'Cash flow stability',
        value: stabilityValue,
        status: state.finance.cashFlow >= 0 ? 'Weekly finances are under control.' : 'Current weekly outgoings need attention.',
      },
    },
  }
}

export function buildMatchPreviewData(state: GameState) {
  const activeTournament = getActiveTournament(state)
  const nextOpponent = getUpcomingOpponent(state)
  const activeRound = state.tournamentProgress.tournamentId === activeTournament?.id ? state.tournamentProgress.currentRound : null
  const currentCue = cueCatalog.find((cue) => cue.id === state.equipment.currentCueId)
  const currentCueState = getCurrentCueState(state)
  const currentChalk = getCurrentChalk(state)
  const currentTip = getCurrentTip(state)
  const technicalValues = Object.values(state.attributes.technical)
  const mentalValues = Object.values(state.attributes.mental)
  const physicalValues = Object.values(state.attributes.physical)
  const h2hMatches = state.matches.filter((match) => match.opponentName === nextOpponent?.playerName)
  const wins = h2hMatches.filter((match) => match.result === 'Won').length
  const losses = h2hMatches.filter((match) => match.result === 'Lost').length
  const totalMeetings = h2hMatches.length
  const eventRounds = state.tournamentProgress.tournamentId === activeTournament?.id ? state.tournamentProgress.completedRounds : []
  const eventWins = eventRounds.filter((round) => round.result === 'Won').length
  const eventLosses = eventRounds.filter((round) => round.result === 'Lost').length
  const eventFrameDifferential = eventRounds.reduce((sum, round) => sum + (round.playerFrames - round.opponentFrames), 0)
  const travelBooking = activeTournament ? state.travel.bookings[activeTournament.id] : undefined
  const travelOption = travelOptionCatalog.find((option) => option.id === travelBooking?.travelOptionId) ?? travelOptionCatalog[0]
  const hotelOption = hotelOptionCatalog.find((option) => option.id === travelBooking?.hotelOptionId) ?? hotelOptionCatalog[0]
  const opponentProfile = state.worldPlayers.find((record) => record.playerName === nextOpponent?.playerName)
  const strengths = [
    { label: 'Break Building', value: state.attributes.technical['Break Building'] },
    { label: 'Cue Ball Control', value: state.attributes.technical['Cue Ball Control'] },
    { label: 'Composure', value: state.attributes.mental.Composure },
  ].sort((left, right) => right.value - left.value)
  const weaknesses = [
    { label: 'Long Potting', value: state.attributes.technical['Long Potting'] },
    { label: 'Safety Play', value: state.attributes.technical['Safety Play'] },
    { label: 'Stamina', value: state.attributes.physical.Stamina },
  ].sort((left, right) => left.value - right.value)
  const tacticalPlan = [
    {
      label: 'Attack Early Chances',
      description: 'Use your stronger cue-ball control to settle quickly.',
      level: clamp(Math.round((state.attributes.technical['Cue Ball Control'] + state.player.confidence) / 2), 40, 95),
      impact: 'Higher chance of decisive first visits.',
    },
    {
      label: 'Tight Safety Exchange',
      description: 'Lean on patience if the opponent starts faster.',
      level: clamp(Math.round((state.attributes.technical['Safety Play'] + state.attributes.mental.Focus) / 2), 35, 90),
      impact: 'Reduces loose-table opportunities for the opponent.',
    },
    {
      label: 'Protect Energy',
      description: 'Manage long frames with smart pacing.',
      level: clamp(Math.round((100 - state.player.fatigue + state.attributes.physical.Stamina) / 2), 30, 92),
      impact: 'Helps sustain quality late in the match.',
    },
  ]
  const recentPlayerResults = state.matches.slice(0, 4).map((match) => ({
    id: match.id,
    date: match.playedOn ?? state.currentDate,
    opponent: match.opponentName,
    result: match.result === 'Won' ? 'W' : 'L',
    score: `${match.playerFrames}-${match.opponentFrames}`,
  }))
  const recentOpponentResults = state.rankings
    .filter((row) => row.playerName !== state.player.fullName)
    .slice(0, 4)
    .map((row, index) => ({
      id: `${row.id}-${index}`,
      date: `W${Math.max(1, state.week - index)}`,
      opponent: row.playerName,
      result: row.ranking < (nextOpponent?.ranking ?? row.ranking + 1) ? 'W' : 'L',
      score: row.ranking < (nextOpponent?.ranking ?? row.ranking + 1) ? '4-2' : '2-4',
    }))
  const playerOverall = calculateOverallRating({
    attributes: state.attributes,
    personalityTraits: state.player.personalityTraits,
    playingStyle: state.player.playingStyle,
  })
  const playerPotential = calculatePotentialRating({
    attributes: state.attributes,
    personalityTraits: state.player.personalityTraits,
    age: state.player.age,
    playingStyle: state.player.playingStyle,
    personalityType: state.player.personalityType,
    overallRating: playerOverall,
  })
  const opponentRatings = nextOpponent
    ? getPreviewOpponentRatingSnapshot(nextOpponent.playerName, nextOpponent.ranking, activeRound, activeTournament, opponentProfile?.age)
    : null
  const matchAttributeComparison = [
    {
      label: 'Attack',
      player: average([state.attributes.technical['Long Potting'], state.attributes.technical['Break Building'], state.attributes.technical['Cue Ball Control']]),
      opponent: opponentRatings ? average([opponentRatings.attributes.technical['Long Potting'], opponentRatings.attributes.technical['Break Building'], opponentRatings.attributes.technical['Cue Ball Control']]) : null,
    },
    {
      label: 'Tactical',
      player: average([state.attributes.technical['Safety Play'], state.attributes.mental.Focus, state.attributes.mental.Composure]),
      opponent: opponentRatings ? average([opponentRatings.attributes.technical['Safety Play'], opponentRatings.attributes.mental.Focus, opponentRatings.attributes.mental.Composure]) : null,
    },
    {
      label: 'Clutch',
      player: average([state.attributes.mental.Composure, state.attributes.mental['Big Match Nerve'], state.attributes.physical['Hand Steadiness']]),
      opponent: opponentRatings ? average([opponentRatings.attributes.mental.Composure, opponentRatings.attributes.mental['Big Match Nerve'], opponentRatings.attributes.physical['Hand Steadiness']]) : null,
    },
    {
      label: 'Endurance',
      player: average([state.attributes.physical.Stamina, 100 - state.player.fatigue]),
      opponent: opponentRatings ? average([opponentRatings.attributes.physical.Stamina, 82]) : null,
    },
  ].map((item) => ({
    ...item,
    edge: item.opponent == null ? null : item.player - item.opponent,
  }))
  const attributeComparison = [
    {
      label: 'Long Potting',
      player: state.attributes.technical['Long Potting'],
      opponent: opponentRatings?.attributes.technical['Long Potting'] ?? null,
    },
    {
      label: 'Break Building',
      player: state.attributes.technical['Break Building'],
      opponent: opponentRatings?.attributes.technical['Break Building'] ?? null,
    },
    {
      label: 'Cue Ball Control',
      player: state.attributes.technical['Cue Ball Control'],
      opponent: opponentRatings?.attributes.technical['Cue Ball Control'] ?? null,
    },
    {
      label: 'Safety Play',
      player: state.attributes.technical['Safety Play'],
      opponent: opponentRatings?.attributes.technical['Safety Play'] ?? null,
    },
    {
      label: 'Composure',
      player: state.attributes.mental.Composure,
      opponent: opponentRatings?.attributes.mental.Composure ?? null,
    },
    {
      label: 'Big Match Nerve',
      player: state.attributes.mental['Big Match Nerve'],
      opponent: opponentRatings?.attributes.mental['Big Match Nerve'] ?? null,
    },
  ].map((item) => ({
    ...item,
    edge: item.opponent == null ? null : item.player - item.opponent,
  }))

  return {
    activeTournament,
    activeRound,
    nextOpponent,
    playerOverall,
    playerPotential,
    opponentOverall: opponentRatings?.overall ?? null,
    opponentPotential: opponentRatings?.potential ?? null,
    currentCue,
    currentCueState,
    currentChalk,
    currentTip,
    bestOf: activeRound === 'Final' ? 'Best of 11' : activeRound === 'Semi Final' ? 'Best of 9' : 'Best of 7',
    totalMeetings,
    wins,
    losses,
    eventMatchesPlayed: eventRounds.length,
    eventWins,
    eventLosses,
    eventFrameDifferential,
    lastMeeting: h2hMatches[0]?.playedOn ?? 'No recorded meeting yet',
    frameDifferential: h2hMatches.reduce((sum, match) => sum + (match.playerFrames - match.opponentFrames), 0),
    scoutNotes: `${nextOpponent?.playerName ?? 'The next opponent'} sits near your current ranking band. Travel planning is ${travelBooking ? 'booked' : 'not yet booked'}, and your readiness profile is shaped by ${hotelOption.name.toLowerCase()} plus ${travelOption.name.toLowerCase()}.`,
    scoutConfidence: clamp(Math.round((average(mentalValues) + average(technicalValues)) / 2), 45, 92),
    tacticalPlan,
    strengths,
    weaknesses,
    matchAttributeComparison,
    attributeComparison,
    cueFamiliarity: currentCueState?.familiarity ?? currentCue?.familiarity ?? 50,
    mentalOutlook: state.player.fatigue >= 60 ? 'Fatigue is the main risk. Simplicity and shorter bursts of concentration matter more than forcing heavy scoring.' : 'The profile is stable enough to attack when chances appear, provided you keep the routine simple in the opening frames.',
    recentPlayerResults,
    recentOpponentResults,
    matchInfo: {
      time: travelOption.arrivalTime.split('•')[1]?.trim() ?? '14:00',
      table: activeTournament?.format ?? 'Feature Table',
      referee: 'Tournament Referee Team',
      temperature: state.player.fatigue >= 60 ? 'Warm / draining' : 'Controlled arena',
      conditions: travelBooking ? 'Travel booked and ready' : 'Awaiting travel confirmation',
    },
    pressureLevel: clamp(Math.round((100 - state.player.confidence + state.player.fatigue) / 2), 25, 88),
    technicalAverage: average(technicalValues),
    physicalAverage: average(physicalValues),
  }
}

export function buildMatchResultData(state: GameState) {
  const latestMatch = state.matches[0]
  const cue = getCurrentCue(state)
  const cueState = getCurrentCueState(state)
  const chalk = getCurrentChalk(state)
  const tip = getCurrentTip(state)
  const coach = getCurrentCoach(state)
  const technicalAverage = Math.round(calculateTechnicalAverage(state.attributes.technical))
  const mentalAverage = average(Object.values(state.attributes.mental))
  const physicalAverage = average(Object.values(state.attributes.physical))
  const preMatchConfidence = latestMatch ? clamp(state.player.confidence - latestMatch.confidenceChange, 25, 99) : state.player.confidence
  const preMatchFatigue = latestMatch ? clamp(state.player.fatigue - latestMatch.fatigueChange, 0, 100) : state.player.fatigue
  const opponentTechnical = estimateOpponentDimension(latestMatch?.opponentStrength, 4)
  const opponentMental = estimateOpponentDimension(latestMatch?.opponentStrength, latestMatch?.round === 'Final' ? 4 : 2)
  const opponentPhysical = estimateOpponentDimension(latestMatch?.opponentStrength, latestMatch && latestMatch.bestOf >= 19 ? 2 : 0)
  const strengthEdge = (latestMatch?.playerStrength ?? technicalAverage) - (latestMatch?.opponentStrength ?? opponentTechnical)
  const equipmentModifier = clamp(
    Math.round(((cueState?.familiarity ?? cue.familiarity) - 60) / 10 + ((cueState?.condition ?? cue.condition) - 70) / 15),
    -4,
    6,
  )
  const confidenceModifier = clamp(Math.round((preMatchConfidence - 55) / 6), -6, 8)
  const fatigueImpact = latestMatch
    ? -clamp(Math.round(Math.max(0, preMatchFatigue - 22) / (latestMatch.bestOf >= 19 ? 4 : latestMatch.bestOf >= 11 ? 6 : 8)), 0, 12)
    : 0
  const formatImpact = latestMatch
    ? latestMatch.bestOf >= 11
      ? clamp(Math.round(strengthEdge / (latestMatch.bestOf >= 25 ? 4 : 6)), -8, 8)
      : clamp(-Math.round(strengthEdge / 10), -6, 6)
    : 0
  const pressureImpact = latestMatch
    ? clamp(
        Math.round(
          (state.attributes.mental.Composure + state.attributes.mental['Big Match Nerve'] + preMatchConfidence) / 30
          - getRoundPressureWeight(latestMatch.round)
          - (latestMatch.bestOf >= 19 ? 2 : latestMatch.bestOf >= 11 ? 1 : 0),
        ),
        -10,
        6,
      )
    : 0
  const tacticalFit = latestMatch
    ? clamp(Math.round(((latestMatch.potSuccess + latestMatch.longPotSuccess + latestMatch.safetySuccess) / 3 - 60) / 6), -5, 6)
    : 0
  const recentMatches = state.matches
  const qfPlusMatches = recentMatches.filter((match) => isQfPlusRound(match.round))
  const qfPlusWins = qfPlusMatches.filter((match) => match.result === 'Won').length
  const semiFinalMatches = recentMatches.filter((match) => match.round === 'Semi Final')
  const semiFinalWins = semiFinalMatches.filter((match) => match.result === 'Won').length
  const finalMatches = recentMatches.filter((match) => match.round === 'Final')
  const finalWins = finalMatches.filter((match) => match.result === 'Won').length
  const deciderMatches = recentMatches.filter((match) => isDeciderMatch(match.bestOf, match.playerFrames, match.opponentFrames))
  const deciderWins = deciderMatches.filter((match) => match.result === 'Won').length
  const qfPlusRate = qfPlusMatches.length > 0 ? (qfPlusWins / qfPlusMatches.length) * 100 : 0
  const finalRate = finalMatches.length > 0 ? (finalWins / finalMatches.length) * 100 : 0
  const deciderRate = deciderMatches.length > 0 ? (deciderWins / deciderMatches.length) * 100 : 0
  const pressureTrait = getPressureTrait(qfPlusRate, finalRate, deciderRate, finalMatches.length, deciderMatches.length)
  const explanationSignals = [
    latestMatch && latestMatch.winProbability != null
      ? `You went in at ${Math.round(latestMatch.winProbability)}% win probability, so this was ${latestMatch.winProbability >= 60 ? 'a favourite spot' : latestMatch.winProbability <= 40 ? 'an underdog assignment' : 'close to even'}.`
      : null,
    latestMatch && pressureImpact <= -3 ? 'Pressure hurt the edge once the match tightened up.' : null,
    latestMatch && fatigueImpact <= -4 ? 'Fatigue became a real drag across the later frames.' : null,
    latestMatch && strengthEdge <= -5 ? 'The opponent started with the stronger base profile.' : null,
    latestMatch && confidenceModifier >= 4 ? 'Confidence kept the match competitive for longer than the raw matchup suggested.' : null,
    latestMatch && latestMatch.bestOf >= 11 && formatImpact < 0 ? 'The longer format gave the stronger baseline player more time to separate.' : null,
    latestMatch && latestMatch.bestOf <= 5 && latestMatch.result === 'Lost' ? 'The short format left less time to correct a bad start.' : null,
  ].filter((item): item is string => Boolean(item))
  const improvementAdvice = Array.from(new Set([
    pressureImpact <= -3 ? 'Pressure Handling' : null,
    fatigueImpact <= -4 ? 'Recovery week before majors' : null,
    latestMatch && latestMatch.safetySuccess < 58 ? 'Safety Under Pressure' : null,
    latestMatch && latestMatch.longPotSuccess < 58 ? 'Long Potting' : null,
    latestMatch && latestMatch.bestOf >= 11 && physicalAverage < opponentPhysical ? 'Stamina and late-match recovery' : null,
    latestMatch && strengthEdge <= -5 ? 'Break Building and cue-ball control' : null,
  ].filter((item): item is string => Boolean(item)))).slice(0, 4)
  const equipmentImpact: EquipmentImpactCard[] = [
    {
      label: 'Cue Condition',
      highlight: cue.name,
      condition: cueState?.condition ?? cue.condition,
      detail: `${Math.max(1, cueState?.familiarity ?? cue.familiarity)}% familiarity influenced touch and positional confidence.`,
    },
    {
      label: 'Tip & Contact',
      highlight: tip.name,
      condition: cueState?.tipCondition ?? 70,
      detail: `Tip setup provides a ${tip.miscueReduction}% control rating for reducing miscues under pressure.`,
    },
    {
      label: 'Chalk Reliability',
      highlight: chalk.name,
      condition: clamp(70 + chalk.consistency / 2, 0, 100),
      detail: `Chalk consistency and spin transfer remain part of the current scoring base.`,
    },
  ]
  const coachFeedback: CoachFeedbackGroup[] = [
    {
      title: latestMatch?.result === 'Won' ? 'Positive Signs' : 'Recovery Points',
      tone: latestMatch?.result === 'Won' ? 'green' : 'amber',
      items: [
        `Confidence moved by ${latestMatch?.confidenceChange ?? 0} in the live save.`,
        `Highest break this match was ${latestMatch?.highestBreak ?? 0}.`,
        `${coach?.name ?? 'Support staff'} wants the next block focused on ${improvementAdvice[0]?.toLowerCase() ?? (latestMatch && latestMatch.longPotSuccess < 60 ? 'long potting' : 'frame control')}.`,
      ],
    },
    {
      title: 'Equipment Readout',
      tone: 'blue',
      items: equipmentImpact.map((item) => `${item.label}: ${item.highlight} at ${item.condition}%`),
    },
  ]

  return {
    equipmentImpact,
    coachFeedback,
    matchSummary: latestMatch
      ? {
          tournament: state.tournaments.find((item) => item.id === latestMatch.tournamentId)?.name ?? 'Completed match',
          round: latestMatch.round,
          format: `Best of ${latestMatch.bestOf}`,
          expectedWinChance: Math.round(latestMatch.winProbability ?? latestMatch.plannedWinChance ?? 50),
          actualResult: getResultMarginLabel(latestMatch.playerFrames, latestMatch.opponentFrames, latestMatch.result),
        }
      : null,
    strengthBreakdown: latestMatch
      ? [
          { label: 'Technical', player: technicalAverage, opponent: opponentTechnical, edge: technicalAverage - opponentTechnical },
          { label: 'Mental', player: mentalAverage, opponent: opponentMental, edge: mentalAverage - opponentMental },
          { label: 'Physical', player: physicalAverage, opponent: opponentPhysical, edge: physicalAverage - opponentPhysical },
          { label: 'Confidence', player: preMatchConfidence, opponent: clamp(Math.round((latestMatch.winProbability ?? 50) < 50 ? 72 : 64), 50, 84), edge: preMatchConfidence - clamp(Math.round((latestMatch.winProbability ?? 50) < 50 ? 72 : 64), 50, 84) },
          { label: 'Fatigue', player: preMatchFatigue, opponent: clamp(Math.round(Math.max(10, preMatchFatigue - fatigueImpact - 8)), 8, 70), edge: clamp(Math.round(Math.max(10, preMatchFatigue - fatigueImpact - 8)), 8, 70) - preMatchFatigue },
          { label: 'Equipment', player: equipmentModifier, opponent: 0, edge: equipmentModifier },
        ]
      : [],
    matchModifiers: latestMatch
      ? [
          {
            label: latestMatch.bestOf >= 11 ? 'Long format edge' : 'Short format upset risk',
            impact: latestMatch.bestOf >= 11 ? formatSignedPercent(formatImpact) : latestMatch.bestOf <= 5 ? 'High' : 'Medium',
            detail: latestMatch.bestOf >= 11 ? 'Longer matches give the stronger base level more time to show.' : 'Shorter matches compress skill edge and increase volatility.',
          },
          { label: 'Pressure impact', impact: formatSignedPercent(pressureImpact), detail: 'Round stage, nerves, and confidence all feed this number.' },
          { label: 'Fatigue impact', impact: formatSignedPercent(fatigueImpact), detail: 'Higher fatigue costs more in longer matches and closing frames.' },
          { label: 'Confidence boost', impact: formatSignedPercent(confidenceModifier), detail: 'Pre-match belief shapes how much quality you can access under pressure.' },
          { label: 'Equipment familiarity', impact: formatSignedPercent(equipmentModifier), detail: 'Cue familiarity and condition still matter in close matches.' },
          { label: 'Tactical fit', impact: formatSignedPercent(tacticalFit), detail: 'Potting, safety, and long-pot execution indicate how well the plan landed.' },
        ]
      : [],
    resultExplanation: latestMatch
      ? {
          title: latestMatch.result === 'Won' ? 'Why You Won' : 'Why The Result Happened',
          summary: explanationSignals.slice(0, 2).join(' ') || 'The match sat close to expectation, with no single factor overwhelming the rest of the profile.',
          detail: latestMatch.result === 'Won'
            ? 'You converted enough of the important frames to hold the edge once the match state turned your way.'
            : 'The loss came from the areas where the baseline edge, pressure load, or fatigue drag outweighed your positive factors.',
        }
      : null,
    improvementAdvice,
    pressureDiagnosis: {
      qfPlusRecord: formatRecord(qfPlusWins, qfPlusMatches.length - qfPlusWins),
      semiFinalConversion: semiFinalMatches.length > 0 ? `${Math.round((semiFinalWins / semiFinalMatches.length) * 100)}%` : 'n/a',
      finalConversion: finalMatches.length > 0 ? `${Math.round((finalWins / finalMatches.length) * 100)}%` : 'n/a',
      deciderRecord: formatRecord(deciderWins, deciderMatches.length - deciderWins),
      pressureTrait: pressureTrait.label,
      diagnosis: pressureTrait.diagnosis,
    },
  }
}

export function buildHealthCentreData(state: GameState) {
  const treatments = treatmentOptionCatalog.map((option) => ({
    ...option,
    selected: option.id === 'treat-1',
  }))
  const fatigueRisk = clamp(state.player.fatigue, 10, 95)
  const bodyStatus = [
    { label: 'Back', status: state.player.fatigue >= 65 ? 'Tight' : 'Good', risk: clamp(fatigueRisk - 10, 5, 90), tone: state.player.fatigue >= 65 ? 'amber' as const : 'green' as const },
    { label: 'Shoulder', status: state.player.fatigue >= 55 ? 'Minor Strain' : 'Stable', risk: clamp(fatigueRisk - 5, 8, 88), tone: state.player.fatigue >= 55 ? 'amber' as const : 'green' as const },
    { label: 'Wrist', status: 'Good', risk: clamp(Math.round(fatigueRisk * 0.35), 5, 65), tone: 'green' as const },
    { label: 'Sleep', status: state.player.morale >= 70 ? 'Good' : 'Interrupted', risk: clamp(100 - state.player.morale, 10, 85), tone: state.player.morale >= 70 ? 'green' as const : 'amber' as const },
    { label: 'Mental Burnout', status: state.player.confidence < 60 ? 'Elevated' : 'Low Risk', risk: clamp(100 - state.player.confidence, 10, 95), tone: state.player.confidence < 60 ? 'amber' as const : 'green' as const },
  ]
  const issueTitle = state.player.fatigue >= 65 ? 'Accumulated Fatigue' : state.player.fatigue >= 50 ? 'Minor Shoulder Strain' : 'Routine Recovery Monitoring'
  const recoveryProgress = clamp(100 - state.player.fatigue, 20, 96)
  const injuryHistory = state.maintenance.history.slice(0, 3).map((item, index) => ({
    id: item.id,
    date: item.date,
    issue: index === 0 ? 'Equipment strain response' : 'Recovery management',
    severity: index === 0 ? 'Minor' : 'Managed',
    treatment: item.service,
    timeOut: index === 0 ? '1-3 days' : '1 day',
    notes: item.result,
  }))

  return {
    bodyStatus,
    treatments,
    currentIssue: {
      title: issueTitle,
      sustained: state.currentDate,
      cause: state.player.fatigue >= 55 ? 'Heavy match and training load' : 'Preventative monitoring',
      painLevel: `${Math.max(1, Math.round(state.player.fatigue / 25))} / 10`,
      overallRisk: state.player.fatigue >= 70 ? 'Medium' : 'Low',
      recoveryTime: state.player.fatigue >= 70 ? '4-6 days' : '1-3 days',
      estimatedReturn: state.currentDate,
      recoveryProgress,
      riskOfPlaying: clamp(Math.round((state.player.fatigue + (100 - state.player.confidence)) / 2), 20, 85),
    },
    matchImpact: [
      { label: 'Performance', impact: `${Math.max(-18, -Math.round(state.player.fatigue / 6))}%` },
      { label: 'Long Potting', impact: `${Math.max(-12, -Math.round(state.player.fatigue / 8))}%` },
      { label: 'Safety Play', impact: `${Math.max(-8, -Math.round(state.player.fatigue / 10))}%` },
      { label: 'Cue Control', impact: `${Math.max(-8, -Math.round(state.player.fatigue / 10))}%` },
    ],
    injuryHistory,
  }
}

export function buildSponsorshipOffersData(state: GameState) {
  const activeRevenue = state.sponsors.reduce((sum, sponsor) => sum + sponsor.monthlyValue, 0)
  const sponsorCapacity = getSponsorCapacity(state)
  const slotDefinitions = [
    { slot: 'Waistcoat Front', unlock: 'Available now' },
    { slot: 'Cue Case', unlock: 'Unlock at Top 32 / 52 reputation' },
    { slot: 'Social Media Partner', unlock: 'Unlock at Top 16 / 68 reputation' },
  ]
  const currentSlots = slotDefinitions.map((definition, index) => {
    const activeSponsor = state.sponsors.find((sponsor) => sponsor.slot === definition.slot)
    if (activeSponsor) {
      return {
        slot: definition.slot,
        sponsor: activeSponsor.name,
        status: 'Active' as const,
        monthlyIncome: `£${activeSponsor.monthlyValue.toLocaleString('en-GB')} /mo`,
        timeLeft: formatSponsorTimeLeft(activeSponsor.weeksRemaining),
      }
    }
    if (index < sponsorCapacity) {
      return {
        slot: definition.slot,
        sponsor: 'Vacant',
        status: 'Vacant' as const,
        monthlyIncome: '£0 /mo',
        timeLeft: 'Ready to fill',
      }
    }
    return {
      slot: definition.slot,
      sponsor: definition.unlock,
      status: 'Locked' as const,
      monthlyIncome: undefined,
      timeLeft: 'Locked',
    }
  })
  const brandMetrics = [
    { label: 'Reputation', value: state.player.reputation, detail: 'Current career profile' },
    { label: 'Confidence', value: state.player.confidence, detail: 'Commercial confidence signal' },
    { label: 'Recent Form', value: clamp(state.player.form.filter((item) => item === 'W').length * 20, 20, 100), detail: 'Win trend' },
    { label: 'Sponsor Load', value: clamp(Math.round((state.sponsors.length / Math.max(1, sponsorCapacity)) * 100), 10, 100), detail: `${state.sponsors.length}/${sponsorCapacity} active deals` },
  ]
  const comparisonRows = state.sponsorOffers.filter((offer) => offer.status === 'Available').map((offer) => ({
    sponsor: offer.name,
    exclusivity: offer.contractLength,
    obligations: offer.behaviour,
    reputationImpact: `Fit ${offer.brandFit}%`,
    valueScore: Math.max(1, Math.min(5, Math.round((offer.brandFit + offer.monthlyValue / 30) / 25))),
    notes: offer.note ?? offer.bonusClause,
  }))
  const warnings = [
    state.sponsors.length >= sponsorCapacity ? 'All unlocked sponsor slots are currently full. Improve ranking or reputation to unlock the next slot.' : `There is room for ${sponsorCapacity - state.sponsors.length} more sponsor ${sponsorCapacity - state.sponsors.length === 1 ? 'deal' : 'deals'} at the current career tier.`,
    activeRevenue >= 2500 ? 'Commercial income is healthy, so fit matters more than squeezing minor extra cash.' : 'Income still needs growth; value should remain a priority.',
  ]

  return {
    comparisonRows,
    advisor: {
      summary: activeRevenue > 0 ? 'Your commercial base is already live. Compare fit and obligation load instead of chasing headline cash only.' : 'You still need a stronger commercial floor. A stable monthly deal will smooth early-career volatility.',
      recommendation: state.player.reputation >= 65 ? 'Prioritise high-fit offers with manageable clauses.' : 'Take the cleanest-value deal that does not overload obligations.',
      confidence: clamp(Math.round((state.player.reputation + state.player.confidence) / 2), 45, 92),
      bulletPoints: [
        `Active sponsor revenue is ${activeRevenue.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })} per month.`,
        `${state.sponsors.length} of ${sponsorCapacity} unlocked sponsor slots are currently occupied.`,
        'Better ranking bands now improve offer values and open additional sponsor inventory.',
        'Short contracts preserve flexibility while the save is still climbing.',
      ],
    },
    currentSlots,
    brandMetrics,
    warnings,
    sponsorCapacity,
    activeRevenue,
  }
}

export function buildSponsorshipContractData(state: GameState, selectedOffer: GameState['sponsorOffers'][number]) {
  const currentRevenue = state.sponsors.reduce((sum, sponsor) => sum + sponsor.monthlyValue, 0)
  const includedSlots = [
    { slot: 'Waistcoat Front', annualValue: selectedOffer.monthlyValue * 12, visibility: 'High event exposure', fit: selectedOffer.brandFit },
    { slot: 'Cue Case', annualValue: Math.round(selectedOffer.monthlyValue * 5.5), visibility: 'Travel / broadcast carry', fit: Math.max(40, selectedOffer.brandFit - 8) },
    { slot: 'Digital', annualValue: Math.round(selectedOffer.monthlyValue * 3), visibility: 'Social and sponsor posts', fit: Math.max(35, selectedOffer.brandFit - 5) },
  ]
  const comparisonRows = [
    { metric: 'Monthly Payment', current: `£${currentRevenue.toLocaleString('en-GB')} /mo`, proposed: `£${selectedOffer.monthlyValue.toLocaleString('en-GB')} /mo` },
    { metric: 'Annual Value (Est.)', current: `£${(currentRevenue * 12).toLocaleString('en-GB')} /yr`, proposed: `£${(selectedOffer.monthlyValue * 12).toLocaleString('en-GB')} /yr` },
    { metric: 'Brand Fit', current: `${average(state.sponsors.map((sponsor) => sponsor.brandFit || 60)) || 0}%`, proposed: `${selectedOffer.brandFit}%` },
    { metric: 'Contract Length', current: `${state.sponsors.length || 0} active deals`, proposed: selectedOffer.contractLength },
    { metric: 'Behaviour Clause', current: 'Existing sponsor mix', proposed: selectedOffer.behaviour },
    { metric: 'Bonus Clause', current: 'Current package average', proposed: selectedOffer.bonusClause },
  ]
  const advisor = {
    note: `This deal adds ${selectedOffer.monthlyValue.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })} per month with ${selectedOffer.brandFit}% fit. Review obligation load against your current schedule and reputation growth stage.`,
    strengths: [
      `Brand fit is ${selectedOffer.brandFit}%, which aligns well with the current profile.`,
      `The deal would push monthly sponsor income to £${(currentRevenue + selectedOffer.monthlyValue).toLocaleString('en-GB')}.`,
      `Bonus structure is ${selectedOffer.bonusClause.toLowerCase()}.`,
    ],
    risks: [
      `Behaviour clause is ${selectedOffer.behaviour.toLowerCase()}.`,
      `${selectedOffer.contractLength} may reduce short-term flexibility if better offers arrive.`,
      selectedOffer.risk === 'Risky Terms' ? 'Terms are aggressive for the current career stage.' : 'Commercial obligations still need monitoring against training and travel load.',
    ],
    recommendation: selectedOffer.brandFit >= 75 ? 'Accept or make only minor asks.' : 'Negotiate first if you want stronger fit or lighter obligations.',
  }
  const terms = [
    { label: 'Base Payment', details: 'Monthly guaranteed payment', valueImpact: `+£${selectedOffer.monthlyValue.toLocaleString('en-GB')}` },
    { label: 'Bonus Clause', details: selectedOffer.bonusClause, valueImpact: 'Performance upside' },
    { label: 'Contract Length', details: selectedOffer.contractLength, valueImpact: 'Medium-term commitment' },
    { label: 'Behaviour Standard', details: selectedOffer.behaviour, valueImpact: selectedOffer.risk },
  ]
  const negotiationOptions = negotiationOptionCatalog.map((option) => ({
    ...option,
    probability: clamp(option.probability + Math.round((state.player.reputation - selectedOffer.minimumReputation) / 2), 10, 95),
  }))

  return { includedSlots, comparisonRows, advisor, terms, negotiationOptions }
}

export function buildMentalStateData(state: GameState) {
  const metrics = [
    { label: 'Confidence', value: state.player.confidence, detail: state.player.confidence >= 70 ? 'Strong' : 'Shaky', tone: state.player.confidence >= 70 ? 'green' as const : state.player.confidence >= 55 ? 'amber' as const : 'red' as const },
    { label: 'Stress', value: clamp(Math.round((state.player.fatigue + (100 - state.player.confidence)) / 2), 15, 95), detail: state.player.fatigue >= 60 ? 'Elevated' : 'Managed', tone: state.player.fatigue >= 60 ? 'amber' as const : 'green' as const },
    { label: 'Motivation', value: state.player.morale, detail: state.player.morale >= 70 ? 'Good' : 'Fading', tone: state.player.morale >= 70 ? 'green' as const : 'amber' as const },
    { label: 'Focus', value: state.attributes.mental.Focus, detail: state.attributes.mental.Focus >= 70 ? 'Reliable' : 'Needs Work', tone: state.attributes.mental.Focus >= 70 ? 'green' as const : 'amber' as const },
    { label: 'Burnout Risk', value: clamp(Math.round((state.player.fatigue + state.player.confidence / 2) / 1.5), 20, 96), detail: state.player.fatigue >= 65 ? 'Moderate' : 'Low', tone: state.player.fatigue >= 65 ? 'amber' as const : 'green' as const },
    { label: 'Pressure Handling', value: state.attributes.mental.Composure, detail: state.attributes.mental.Composure >= 70 ? 'Good' : 'Below Avg', tone: state.attributes.mental.Composure >= 70 ? 'green' as const : 'amber' as const },
    { label: 'Overthinking Risk', value: clamp(100 - state.attributes.mental.Focus + Math.round(state.player.fatigue / 3), 20, 96), detail: state.attributes.mental.Focus >= 70 ? 'Controlled' : 'High Risk', tone: state.attributes.mental.Focus >= 70 ? 'green' as const : 'red' as const },
  ]
  const diagnosisSeverity = clamp(Math.round((metrics[1].value + metrics[6].value) / 2), 20, 95)
  const actionPlan: RecoveryActionCard[] = [
    { title: 'Reduce Match Load', description: 'Protect energy and lower stress through the next event cycle.', effect: `-${Math.max(8, Math.round(state.player.fatigue / 5))}% stress`, effectTone: 'green', cost: 'Low', time: '1-2 weeks' },
    { title: 'Simple Potting Drills', description: 'Rebuild trust in the cueing basics.', effect: `+${Math.max(6, Math.round(state.attributes.technical['Long Potting'] / 12))}% confidence`, effectTone: 'green', cost: 'Low', time: 'Ongoing' },
    { title: 'Sports Psychologist', description: 'One focused intervention to steady overthinking loops.', effect: `+${Math.max(8, Math.round(state.attributes.mental.Focus / 10))}% focus`, effectTone: 'green', cost: '£600', time: '1 session / week' },
    { title: 'Rest Week', description: 'Reset both fatigue and mental strain.', effect: `-${Math.max(12, Math.round(state.player.fatigue / 3))}% burnout risk`, effectTone: 'red', cost: 'Medium', time: '1 week' },
  ]
  const trend = getTrendLabels(state, 6).map((point) => ({
    label: point.label,
    confidence: point.confidence,
    stress: clamp(Math.round((point.fatigue + (100 - point.confidence)) / 2), 20, 95),
    focus: clamp(point.confidence - 8, 20, 95),
    motivation: point.morale,
  }))
  const recentLoss = state.matches.find((match) => match.result === 'Lost')

  return {
    metrics,
    diagnosis: {
      title: recentLoss ? 'Confidence Dip After Recent Loss' : 'Managing Pressure Through Heavy Weeks',
      description: recentLoss ? `${recentLoss.opponentName} exposed a dip in confidence and frame control. The current mental profile shows recoverable stress rather than a structural decline.` : 'The live save is showing manageable pressure, but fatigue and expectation can still pull focus away from routines.',
      factors: [
        `Fatigue currently sits at ${state.player.fatigue}%.`,
        `Confidence is ${state.player.confidence}% with morale at ${state.player.morale}%.`,
        `${state.matches.length} competitive results are currently logged.`,
        `${state.sponsors.length} active sponsor deals add off-table expectation.`,
      ],
      severity: diagnosisSeverity,
      recoveryOutlook: state.player.fatigue >= 65 ? '2-4 weeks' : '1-2 weeks',
      recoveryChance: clamp(100 - Math.round(diagnosisSeverity / 1.4), 35, 90),
    },
    actionPlan,
    trend,
    recoveryProgress: actionPlan.map((item, index) => ({ label: item.title, value: clamp(70 - index * 15 + Math.round(state.player.confidence / 5), 0, 100) })),
    triggers: [
      { label: state.player.fatigue >= 60 ? 'Compressed schedule' : 'Expectation spikes', timing: 'Current week' },
      { label: recentLoss ? `Loss vs ${recentLoss.opponentName}` : 'Upcoming event pressure', timing: recentLoss?.playedOn ?? 'Recently' },
      { label: `${state.sponsors.length} active commercial commitments`, timing: 'Ongoing' },
    ],
    nextFocus: {
      title: state.player.confidence >= 70 ? 'Routine & Calm Aggression' : 'Simplicity & Trust',
      priority: clamp(Math.round((100 - state.player.confidence + state.player.fatigue) / 2), 30, 90),
      bullets: [
        'One shot at a time',
        'Respect the routine before the result',
        'Keep the decision-making simple in close frames',
      ],
      psychologistNote: state.player.fatigue >= 60 ? 'Recovery should carry more weight than extra analysis this week.' : 'The current profile responds best to clarity, routine, and steady tempo.',
    },
    pressurePerformance: [
      { label: 'Long Pot Success', value: `${state.matches[0]?.longPotSuccess ?? state.attributes.technical['Long Potting']}%` },
      { label: 'Safety Success', value: `${state.matches[0]?.safetySuccess ?? state.attributes.technical['Safety Play']}%` },
      { label: 'Break Building', value: `${state.attributes.technical['Break Building']}%` },
      { label: 'Decision Quality', value: `${state.attributes.mental.Focus}%` },
      { label: 'Clutch Performance', value: `${state.attributes.mental.Composure}%` },
    ],
    copingStrategies: [
      { label: 'Breathing & Reset', rating: state.attributes.mental.Focus >= 70 ? 5 : 4 },
      { label: 'Pre-shot Routine', rating: state.attributes.mental.Composure >= 70 ? 5 : 4 },
      { label: 'Positive Self-Talk', rating: state.player.confidence >= 70 ? 4 : 3 },
      { label: 'Visualisation', rating: 4 },
    ],
  }
}

function getDaysUntil(dateString: string, currentDate: string) {
  const start = new Date(`${currentDate}T00:00:00`).getTime()
  const end = new Date(`${dateString}T00:00:00`).getTime()
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)))
}

export function buildInboxData(state: GameState) {
  return {
    newsCards: state.inbox.slice(0, 3).map((item, index) => ({
      id: item.id,
      title: item.subject,
      source: item.sender,
      date: item.date,
      tag: index === 0 ? 'Top Story' : item.priority,
    })),
    deadlines: state.tournaments.slice(0, 3).map((tournament) => ({
      id: tournament.id,
      title: tournament.name,
      dueText: `${getDaysUntil(tournament.startDate, state.currentDate)} days until start`,
      countdown: `${getDaysUntil(tournament.startDate, state.currentDate)}d`,
    })),
  }
}

export function buildTrainingPlannerData(state: GameState) {
  const activeTournament = getActiveTournament(state)
  const travelBooked = activeTournament ? state.travel.bookings[activeTournament.id] : null
  const week: TrainingPlannerDay[] = state.trainingPlan
  const enteredCompetitions = state.tournaments
    .filter((tournament) => tournament.status === 'Entered')
    .map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      location: tournament.location,
      date: tournament.startDate,
      daysAway: getDaysUntil(tournament.startDate, state.currentDate),
      travelBooked: Boolean(state.travel.bookings[tournament.id]),
    }))
  const drillLibrary: DrillLibraryGroup[] = [
    {
      title: 'Technical',
      accent: 'green',
      drills: [
        { name: 'Line-Up Drill', intensity: state.attributes.technical['Long Potting'] >= 70 ? 'Medium' : 'High' },
        { name: 'Break Building', intensity: 'Medium' },
        { name: 'Safety Exchanges', intensity: 'Medium' },
      ],
    },
    {
      title: 'Mental',
      accent: 'violet',
      drills: [
        { name: 'Routine Lock-In', intensity: 'Medium' },
        { name: 'Visualization', intensity: 'Low' },
        { name: 'Pressure Frames', intensity: state.player.confidence >= 70 ? 'Medium' : 'High' },
      ],
    },
    {
      title: 'Physical',
      accent: 'blue',
      drills: [
        { name: 'Core Stability', intensity: 'Medium' },
        { name: 'Mobility', intensity: 'Low' },
        { name: 'Endurance Block', intensity: state.player.fatigue >= 60 ? 'Low' : 'Medium' },
      ],
    },
    {
      title: 'Match Prep',
      accent: 'gold',
      drills: [
        { name: 'Match Simulation', intensity: 'High' },
        { name: 'Opponent Prep', intensity: 'Medium' },
        { name: 'Pre-Event Table Time', intensity: 'Low' },
      ],
    },
  ]
  const summary: TrainingPlannerSummary = summarizeTrainingPlan(
    week,
    { fatigue: state.player.fatigue, confidence: state.player.confidence },
    state.attributes,
    getCurrentCoach(state)?.compatibility ?? 0,
  )

  return { week, summary, drillLibrary, enteredCompetitions, travelBooked: Boolean(travelBooked) }
}

export function buildCalendarData(state: GameState) {
  const events = state.tournaments.map((tournament, index) => {
    const startDate = new Date(`${tournament.startDate}T00:00:00`)
    const endDate = tournament.endDate ? new Date(`${tournament.endDate}T00:00:00`) : null
    const stageId = tournament.stageId ?? (tournament.type === 'Q Tour' ? 5 : tournament.type === 'Q School' ? 6 : tournament.type === 'Professional Tour' || tournament.type === 'Ranking' || tournament.type === 'Major' || tournament.type === 'Invitational' ? 8 : tournament.type === 'Senior' || tournament.type === 'Exhibition' ? 14 : tournament.type === 'Amateur' ? 4 : tournament.type === 'National Youth' ? 3 : tournament.type === 'Regional Youth' ? 2 : 1)
    return {
      id: tournament.id,
      name: tournament.name,
      type: tournament.type,
      stageId,
      pathwayTier: tournament.pathwayTier ?? 'Open',
      tourCircuit: tournament.tourCircuit ?? tournament.name,
      month: tournament.month ?? startDate.toLocaleDateString('en-GB', { month: 'long' }),
      week: tournament.week ?? Math.max(1, Math.min(4, Math.ceil(startDate.getDate() / 7))),
      eventClass: tournament.eventClass ?? (tournament.type === 'Professional Tour' || tournament.type === 'Ranking' ? 'Professional' : tournament.type),
      location: tournament.location,
      startDay: startDate.getDate(),
      startMonth: startDate.getMonth(),
      startYear: startDate.getFullYear(),
      endDay: endDate ? endDate.getDate() : undefined,
      endMonth: endDate ? endDate.getMonth() : startDate.getMonth(),
      endYear: endDate ? endDate.getFullYear() : startDate.getFullYear(),
      entryFee: tournament.entryFee,
      travelCost: tournament.travelCost,
      hotelCost: tournament.hotelCost,
      prizeMoney: tournament.prizeMoney,
      totalPrizeFund: tournament.totalPrizeFund ?? tournament.prizeMoney,
      winnerPrize: tournament.winnerPrize ?? Math.round(tournament.prizeMoney * 0.5),
      rankingType: tournament.rankingType ?? 'None',
      rankingValue: tournament.rankingValue,
      prestige: tournament.prestige ?? 1,
      unlockRequirement: tournament.unlockRequirement ?? 'Pathway access required.',
      progressionImpact: tournament.progressionImpact ?? 'Builds pathway momentum.',
      reward: tournament.reward,
      status: tournament.status,
      accent:
        tournament.status === 'Entered'
          ? 'green'
          : stageId === 5 || stageId === 6
            ? 'gold'
            : stageId >= 7 && stageId <= 12
              ? 'violet'
              : stageId >= 13 || tournament.type === 'Senior' || tournament.type === 'Exhibition'
                ? 'orange'
                : 'blue' as const,
      order: index,
    }
  })

  return {
    events,
    getDetail(tournamentId: string) {
      const tournament = state.tournaments.find((item) => item.id === tournamentId) ?? getActiveTournament(state)
      const booking = state.travel.bookings[tournament.id]
      return {
        alertTitle: booking ? 'Travel booking in place' : 'Travel still needs confirmation',
        alertText: booking ? 'Your current travel package is already reserved for this event.' : 'Entry is only half the decision. Travel, hotel cost, and the pathway reward still need to be judged together.',
        decisionImpact: [
          { label: 'Prize Fund', value: `£${(tournament.totalPrizeFund ?? tournament.prizeMoney).toLocaleString('en-GB')}`, tone: 'green' as const },
          { label: 'Winner Prize', value: `£${(tournament.winnerPrize ?? Math.round(tournament.prizeMoney * 0.5)).toLocaleString('en-GB')}`, tone: 'green' as const },
          { label: 'Total Cost', value: `£${(tournament.entryFee + tournament.travelCost + tournament.hotelCost).toLocaleString('en-GB')}`, tone: 'amber' as const },
        ],
        progressMeters: [
          { label: 'Cash Cover', value: clamp(Math.round((state.player.cash / Math.max(1, tournament.entryFee + tournament.travelCost + tournament.hotelCost)) * 100), 0, 100), max: 100, detail: 'Budget fit', tone: 'green' as const },
          { label: 'Readiness', value: clamp(Math.round((state.player.confidence + (100 - state.player.fatigue)) / 2), 0, 100), max: 100, detail: 'Current form', tone: 'blue' as const },
          { label: 'Reputation Match', value: clamp(state.player.reputation, 0, 100), max: 100, detail: tournament.pathwayTier ?? 'Profile fit', tone: 'amber' as const },
        ],
      }
    },
  }
}

export function buildTournamentHubData(state: GameState) {
  const activeTournament = getActiveTournament(state)
  const completedRounds = state.tournamentProgress.tournamentId === activeTournament?.id ? state.tournamentProgress.completedRounds : []
  const recentResults = completedRounds.length > 0
    ? completedRounds.map((result, index) => ({
        id: `${result.round}-${index}`,
        round: result.round,
        winner: result.result === 'Won' ? state.player.fullName : result.opponentName,
        loser: result.result === 'Won' ? result.opponentName : state.player.fullName,
        score: `${result.playerFrames}-${result.opponentFrames}`,
      }))
    : state.matches.filter((match) => match.tournamentId === activeTournament?.id).slice(0, 3).map((match) => ({
        id: match.id,
        round: match.round,
        winner: match.result === 'Won' ? state.player.fullName : match.opponentName,
        loser: match.result === 'Won' ? match.opponentName : state.player.fullName,
        score: `${match.playerFrames}-${match.opponentFrames}`,
      }))
  const upcomingMatches = state.rankings
    .filter((row) => row.playerName !== state.player.fullName)
    .slice(0, 3)
    .map((row, index) => ({
      id: `${row.id}-${index}`,
      time: `${12 + index}:00`,
      table: `Table ${index + 1}`,
      home: row.playerName,
      away: index === 0 ? state.player.fullName : state.rankings[(index + 2) % state.rankings.length]?.playerName ?? 'TBD',
    }))
  const topPerformers = state.rankings.slice(0, 3).map((row) => ({ id: row.id, name: row.playerName, score: row.points }))
  const objectives = [
    { label: 'Win opening match', current: completedRounds.length > 0 ? 1 : 0, target: 1, reward: Math.max(12, Math.round((activeTournament?.rankingValue ?? 0) * 0.15)), status: completedRounds.length > 0 ? 'Complete' : 'Pending' },
    { label: 'Make quarter final', current: completedRounds.length >= 1 ? 1 : 0, target: 1, reward: Math.max(18, Math.round((activeTournament?.rankingValue ?? 0) * 0.25)), status: completedRounds.length >= 1 ? 'On track' : 'Pending' },
    { label: 'Hold confidence above 70', current: state.player.confidence >= 70 ? 1 : 0, target: 1, reward: 8, status: state.player.confidence >= 70 ? 'Met' : 'Needs work' },
  ]
  const notes = [
    activeTournament
      ? activeTournament.status === 'Entered'
        ? `Entry confirmed for ${activeTournament.name}.`
        : `Entry is still required for ${activeTournament.name}.`
      : 'Select an eligible tournament to begin planning.',
    activeTournament ? `${activeTournament.name} carries ${activeTournament.rankingValue} ranking points.` : 'No active tournament selected.',
    state.player.fatigue >= 60 ? 'Fatigue is the main tournament risk.' : 'Condition is stable enough to push for the next round.',
  ]

  return { recentResults, upcomingMatches, topPerformers, objectives, notes }
}

export function buildTournamentDrawData(state: GameState) {
  const activeTournament = getActiveTournament(state)
  const player = state.player.fullName
  const draw = getActiveDraw(state)
  const opponents = state.rankings.filter((row) => row.playerName !== player).slice(0, 15)
  const completedRounds = state.tournamentProgress.completedRounds
  const activeRound = state.tournamentProgress.currentRound
  const bracket = draw.length > 0
    ? draw
    : [
        {
          label: 'Last 16',
          matches: [
            { id: 'preview-l16-1', top: { name: player, rank: state.player.amateurRanking ?? state.player.worldRanking ?? 0, nation: state.player.nationality, highlighted: true }, bottom: { name: opponents[0]?.playerName ?? 'Opponent TBD', rank: opponents[0]?.ranking ?? 0, nation: opponents[0]?.nation ?? '' }, placeholder: !opponents[0] },
          ],
        },
      ]
  const bracketOpponents = bracket
    .flatMap((round) => round.matches)
    .flatMap((match) => [match.top, match.bottom])
    .filter((entry) => entry.name !== player && entry.name !== 'TBD')
  const outlookPool = bracketOpponents.length > 0
    ? bracketOpponents.slice(0, 4).map((entry) => state.rankings.find((row) => row.playerName === entry.name) ?? createFallbackRankingRow(entry.name, entry.rank, entry.nation))
    : opponents.slice(0, 4)
  const opponentOutlook = outlookPool.map((row) => ({
    id: row.id,
    name: row.playerName,
    rank: row.ranking,
    nation: row.nation,
    headToHead: `${state.matches.filter((match) => match.opponentName === row.playerName && match.result === 'Won').length}-${state.matches.filter((match) => match.opponentName === row.playerName && match.result === 'Lost').length}`,
    difficulty: row.ranking < (state.player.amateurRanking ?? state.player.worldRanking ?? row.ranking + 1) ? 'Very Tough' as const : Math.abs(row.ranking - (state.player.amateurRanking ?? state.player.worldRanking ?? row.ranking)) <= 3 ? 'Challenging' as const : 'Moderate' as const,
  }))
  const progressLabels = bracket.map((round) => round.label)
  const progress = progressLabels.map((label) => ({
    label,
    status: completedRounds.some((round) => round.round === label) ? 'completed' as const : activeRound === label ? 'current' as const : 'upcoming' as const,
  }))
  const activeMatch = findPlayerDrawMatch(draw, player, activeRound)
  const activeRoundMatches = activeRound ? bracket.find((round) => round.label === activeRound)?.matches ?? [] : []
  const activeMatchIndex = activeMatch ? activeRoundMatches.findIndex((match) => match.id === activeMatch.id) : -1
  const difficultyScore = opponentOutlook.length > 0
    ? Math.round(opponentOutlook.reduce((sum, opponent) => sum + (opponent.difficulty === 'Very Tough' ? 84 : opponent.difficulty === 'Challenging' ? 62 : 44), 0) / opponentOutlook.length)
    : 44
  const difficultyLabel = difficultyScore >= 75 ? 'High' : difficultyScore >= 56 ? 'Balanced' : 'Manageable'
  const insights = [
    { label: 'Tournament', value: activeTournament?.name ?? 'No active event' },
    { label: 'Current Round', value: activeRound ?? 'Awaiting draw' },
    { label: 'Completed Rounds', value: `${completedRounds.length}` },
    { label: 'Next Opponent', value: getUpcomingOpponent(state)?.playerName ?? 'Awaiting result' },
    { label: 'Condition', value: state.player.fatigue >= 60 ? 'Fatigue watch' : 'Playable' },
  ]

  return {
    bracket,
    opponentOutlook,
    progress,
    insights,
    currentPosition: {
      currentRound: activeRound ?? 'Awaiting draw',
      bestResult: completedRounds.at(-1)?.round ?? 'No result yet',
      projectedRoute: activeMatchIndex === -1 ? 'Undrawn' : activeMatchIndex < activeRoundMatches.length / 2 ? 'Top half' : 'Bottom half',
      difficultyLabel,
    },
    difficultyScore,
  }
}

export function buildSeasonReviewData(state: GameState) {
  const careerTotals = getCanonicalHistoryTotals(state)
  const winCount = careerTotals.wins
  const lossCount = careerTotals.losses
  const winRate = careerTotals.matchesPlayed > 0 ? Math.round((winCount / careerTotals.matchesPlayed) * 100) : 0
  const technical = average(Object.values(state.attributes.technical))
  const mental = average(Object.values(state.attributes.mental))
  const physical = average(Object.values(state.attributes.physical))
  const attributeGrowth = [
    { label: 'Technical', value: Math.max(1, Math.round(technical / 20)) },
    { label: 'Mental', value: Math.max(1, Math.round(mental / 20)) },
    { label: 'Physical', value: Math.max(1, Math.round(physical / 22)) },
  ]
  const gradeScore = Math.round((winRate + state.player.reputation + state.player.confidence) / 3)
  const grade = gradeScore >= 80 ? 'A' : gradeScore >= 70 ? 'B' : gradeScore >= 60 ? 'C' : 'D'

  return {
    attributeGrowth,
    grade: { grade, summary: winRate >= 60 ? 'A strong stretch with tangible growth.' : 'Progress remains mixed but recoverable.' },
    objectives: [
      { label: 'Raise ranking', progress: `#${state.player.amateurRanking ?? state.player.worldRanking ?? '-'}`, completed: !!state.player.amateurRanking && state.player.amateurRanking <= 4 },
      { label: 'Increase sponsor base', progress: `${state.sponsors.length} deals`, completed: state.sponsors.length >= 3 },
      { label: 'Improve consistency', progress: `${winRate}% win rate`, completed: winRate >= 60 },
    ],
    panels: {
      coachGrade: { grade: `${grade}+`, detail: getCurrentCoach(state)?.name ?? 'No active coach', note: 'Coach fit now reflects the live save.' },
      sponsorGrade: { grade: state.sponsors.length >= 3 ? 'A-' : 'B', detail: `${state.sponsors.length} active sponsors`, note: 'Commercial progress is tied to accepted deals.' },
      fanGrowth: { growth: `+${Math.max(5, Math.round(state.player.reputation / 3))}%`, fans: Math.max(500, state.player.reputation * 120), delta: 'Fan interest follows ranking and reputation growth.' },
      verdict: { grade, title: winRate >= 60 ? 'Season Trending Up' : 'Season Needs Consolidation', summary: `${winCount} wins, ${lossCount} losses, and ${state.matches.length} logged matches shape the current verdict.` },
      sponsorSentiment: { value: clamp(Math.round((state.sponsors.length * 20 + state.player.reputation) / 2), 20, 100), detail: 'Commercial sentiment' },
      fanSentiment: { value: clamp(Math.round((state.player.reputation + winRate) / 10), 2, 5), detail: 'Fan sentiment' },
      coachReview: getCurrentCoach(state) ? `${getCurrentCoach(state)!.name} remains the active coach with ${getCurrentCoach(state)!.compatibility}% compatibility.` : 'No coach is currently attached to the save.',
    },
  }
}
