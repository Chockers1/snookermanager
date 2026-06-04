import { useEffect, useMemo, useState } from 'react'
import {
  caseCatalog,
  chalkCatalog,
  coachCatalog,
  createPlayerBackgroundCatalog,
  createPlayerIdentitySeed,
  createPlayerStartingLevelCatalog,
  createPlayerSliderCatalog,
  cueMarketplaceCatalog,
  hotelOptionCatalog,
  maintenanceActionCatalog,
  negotiationOptionCatalog,
  sponsorOfferCatalog,
  starterAttributes,
  starterEquipmentState,
  starterInboxMessages,
  starterMaintenanceHistory,
  starterMatches,
  starterPlayerProfile,
  starterRankings,
  starterSponsors,
  tableSetupCatalog,
  tipCatalog,
  tournamentCatalog,
  travelOptionCatalog,
} from '../data/gameContent'
import { getBestOfForRound, getTournamentResultExpectation, normalizeTournamentRoundLabel } from '../data/tournamentFormats'
import type {
  BracketPlayer,
  BracketRound,
  Coach,
  CoachContract,
  FrameScoreRow,
  HotelOption,
  InboxMessage,
  LiveFeedItem,
  LiveMomentumPoint,
  MaintenanceHistoryItem,
  Match,
  NewCareerStartingLevel,
  Player,
  PlayerAttributes,
  RankingRow,
  SponsorDeal,
  SponsorOfferCard,
  TrainingPlannerDay,
  Tournament,
  TravelOption,
} from '../types/game'
import { calculateAverage, calculateMatchStrength, calculateOverallRating, calculateTechnicalAverage } from '../utils/calculations'
import { buildCanonicalTournamentResult, type CanonicalTournamentResult, getCanonicalFinishFlags, isNonCompetitiveTournamentResult } from '../utils/canonicalTournamentResult'
import { getCoachAvailability, getCoachContractOptions, getCoachContractWeeks, getCoachSlotLimit as getCoachSlotLimitForRanking } from '../utils/coachMarket'
import { convertMatchWinProbabilityToFrameWinProbability, getOpponentRankBand, getRoundDifficultyBonus, getRoundPressureMultiplier } from '../utils/matchOutcomeModel'
import { applyPlayingStyleToSliders, buildCareerPersonality, buildNewCareerAttributes, getValidatedStartingLevel } from '../utils/newCareerConfig'
import { SIMULATION_MODE, type SimulationMode } from '../utils/simulationMode'
import { buildAutoTrainingPlan, calculateTrainingEffects, normalizeTrainingPlan } from '../utils/trainingPlan'

type CueConditionState = {
  condition: number
  familiarity: number
  durability: number
  tipCondition: number
  shaftStraightness: number
}

type EquipmentState = {
  currentCueId: string | null
  currentChalkId: string | null
  currentTipId: string | null
  currentCaseId: string | null
  currentTableId: string | null
  cuesOwned: string[]
  chalkOwned: string[]
  tipsOwned: string[]
  casesOwned: string[]
  tablesOwned: string[]
  cueStates: Record<string, CueConditionState>
}

type FinanceState = {
  cash: number
  baseCashFlow: number
  cashFlow: number
}

type TravelBookingState = {
  tournamentId: string
  travelOptionId: string
  hotelOptionId: string
  totalCost: number
  bookedWeek: number
  bookedDate: string
}

type TravelState = {
  bookings: Record<string, TravelBookingState>
}

type MaintenanceState = {
  history: MaintenanceHistoryItem[]
}

type SponsorOfferState = SponsorOfferCard & {
  status: 'Available' | 'Accepted' | 'Rejected'
  negotiationCount: number
  notes: string[]
}

export type TournamentRound = 'Last 16' | 'Quarter Final' | 'Semi Final' | 'Final'

export type SyntheticLiveVisitMatchInput = {
  simulationMode: Extract<SimulationMode, 'liveVisitCalibration'>
  playerName: string
  opponentName: string
  playerRankBand?: string
  opponentRankBand?: string
  playerTacticalPlan?: 'Attack' | 'Balanced' | 'Safety'
  opponentTacticalPlan?: 'Attack' | 'Balanced' | 'Safety'
  bestOf: number
  round?: TournamentRound
  seed: number
  playerAttributes: PlayerAttributes
  playerEquipmentBonus?: number
  opponentAttributes?: PlayerAttributes
  opponentEquipmentBonus?: number
  opponentProfileMode?: 'rankBased' | 'attributes'
  startingPlayer?: 'player' | 'opponent'
  playerConfidence: number
  playerFatigue: number
  playerClutch: number
  playerStrength: number
  opponentRanking: number
  opponentConfidence: number
  opponentFatigue: number
  opponentClutch: number
  opponentStrength: number
  plannedMatchWinChance: number
  preserveTacticalEdge?: boolean
  initialPlayerFrames?: number
  initialOpponentFrames?: number
  initialPressureValue?: number
}

export type SyntheticLiveVisitMatchResult = {
  playerWon: boolean
  playerFrames: number
  opponentFrames: number
  score: string
  frameWinChance: number
  decidingFrame: boolean
  whitewash: boolean
  playerHighestBreak: number
  opponentHighestBreak: number
  playerFifties: number
  playerCenturies: number
  totalVisits: number
  decisionCounts: Record<LiveVisitDecision, number>
  frameHistory: FrameScoreRow[]
  frameSummaries: SyntheticLiveVisitFrameSummary[]
  fullVisitLog: SyntheticLiveVisitVisitLogEntry[]
  debugMetrics: SyntheticLiveVisitDebugMetrics
  constructedProfiles: {
    player: ConstructedLiveVisitProfile
    opponent: ConstructedLiveVisitProfile
  }
  finalState: {
    playerConfidence: number
    opponentConfidence: number
    playerFatigue: number
    opponentFatigue: number
    pressureValue: number
    pressureLabel: string
  }
}

type SimulatedFrameOutcome = {
  playerWonFrame: boolean
  playerPoints: number
  opponentPoints: number
  playerBreak: number
  opponentBreak: number
}

type CareerMatchResolution = {
  playerWonMatch: boolean
  loserFrames: number
  frameOrder: boolean[]
}

type SyntheticLiveVisitSideMetrics = {
  frameStarts: number
  firstScoringChances: number
  visits: number
  pointsScored: number
  frameWins: number
  potAttempts: number
  potSuccesses: number
  breakBuildAttempts: number
  breakBuildSuccesses: number
  safetyAttempts: number
  safetySuccesses: number
  snookerHuntAttempts: number
  snookerHuntSuccesses: number
  respottedBlackAttempts: number
  respottedBlackSuccesses: number
  foulsCommitted: number
  unforcedErrors: number
  scoringVisitCount: number
  totalScoringBreak: number
  totalTacticalEdge: number
  totalDecisionBonus: number
  totalSuccessChance: number
  totalConfidence: number
  totalFatigue: number
}

export type SyntheticLiveVisitDebugMetrics = {
  player: SyntheticLiveVisitSideMetrics
  opponent: SyntheticLiveVisitSideMetrics
}

export type ConstructedLiveVisitProfile = {
  side: 'player' | 'opponent'
  name: string
  sourceKind: 'attributes' | 'rankBased'
  sourceRankBand: string
  overall: number
  technicalAverage: number
  mentalAverage: number
  physicalAverage: number
  confidence: number
  fatigue: number
  pressureHandling: number
  composure: number
  breakBuilding: number
  safety: number
  potting: number
  longPotting: number
  tacticalRating: number
  consistency: number
  errorRate: number
  equipmentBonus: number
  tacticalPlan: 'Attack' | 'Balanced' | 'Safety'
  startsFrameProbability: number
  initialMomentum: number
  constructedStrength: number
  visitProfile: LiveVisitSkillProfile
}

export type NewCareerConfig = {
  fullName: string
  nationality: string
  age: number
  handedness: Player['handedness']
  cueStyle: string
  playingStyle: string
  personalityArchetype: string
  sliders: Array<{ label: string; value: number }>
  backgroundId: string
  startingLevelId: string
}

type TournamentProgressState = {
  tournamentId: string | null
  currentRound: TournamentRound | null
  draw: BracketRound[]
  completedRounds: Array<{
    round: TournamentRound
    opponentName: string
    result: Match['result']
    playerFrames: number
    opponentFrames: number
  }>
}

type LiveMatchTacticalPlan = 'Attack' | 'Balanced' | 'Safety'
type LiveMatchMentalFocus = 'Composed' | 'Confident' | 'Counter'
type LiveMatchTempo = 'Steady' | 'Quick'
type LiveMatchResolutionMode = 'manual' | 'simulated'
type LiveMatchOpponentApproach = 'Pressing' | 'Measured' | 'Tight'
type LiveMatchOpponentArchetype = 'Serial Scorer' | 'Tactical Grinder' | 'Counter Puncher' | 'Tempo Disruptor'
type LiveEndgameColour = 'Yellow' | 'Green' | 'Brown' | 'Blue' | 'Pink' | 'Black'
type LiveVisitDecision = 'Pot Attempt' | 'Break Build' | 'Safety Exchange' | 'Snooker Hunt' | 'Respotted Black'
type LiveVisitActor = 'Player' | 'Opponent'

type LiveFrameTableState = {
  redsRemaining: number
  coloursRemaining: LiveEndgameColour[]
}

type LiveMatchCoachPrompt = {
  title: string
  note: string
  recommendedPlan: LiveMatchTacticalPlan
  recommendedMentalFocus: LiveMatchMentalFocus
  recommendedTempo: LiveMatchTempo
}

type LiveMatchOpponentAdjustment = {
  title: string
  note: string
  trigger: 'Frame Swing' | 'Timeout' | 'Pressure'
  fromApproach: LiveMatchOpponentApproach
  toApproach: LiveMatchOpponentApproach
  frameLabel: string
}

type LiveVisitLogEntry = {
  id: string
  frameLabel: string
  visit: number
  actor: LiveVisitActor
  decision: LiveVisitDecision
  outcome: string
  points: number
  breakTotal: number
  retainedTable: boolean
  success: boolean
  foulOccurred: boolean
  successChance: number
  tacticalEdge: number
  decisionBonus: number
  actorConfidence: number
  actorFatigue: number
  pressureValue: number
  playerPointsAfter: number
  opponentPointsAfter: number
}

export type SyntheticLiveVisitVisitLogEntry = LiveVisitLogEntry

export type SyntheticLiveVisitFrameSummary = {
  frameNumber: number
  winner: 'Player' | 'Opponent'
  score: string
  playerPoints: number
  opponentPoints: number
  keyBreak: number
  closeFrame: boolean
  decidingFrame: boolean
  pressurePhase: 'Standard' | 'Closing' | 'Decider' | 'Final'
  firstScoreBy: 'Player' | 'Opponent' | 'None'
  hadLeadChange: boolean
  winnerCameFromBehind: boolean
  playerConfidenceStart: number
  playerConfidenceEnd: number
  opponentConfidenceStart: number
  opponentConfidenceEnd: number
  playerFatigueStart: number
  playerFatigueEnd: number
  opponentFatigueStart: number
  opponentFatigueEnd: number
  pressureStart: number
  pressureEnd: number
  keyMoments: string[]
  reason: string
}

type LiveVisitSkillProfile = {
  longPotting: number
  breakBuilding: number
  cueBallControl: number
  safetyPlay: number
  consistency: number
  composure: number
  focus: number
  bigMatchNerve: number
  handSteadiness: number
  stamina: number
}

type LiveMatchState = {
  tournamentId: string
  round: TournamentRound
  bestOf: number
  framesNeeded: number
  playerName: string
  opponentName: string
  opponentRanking: number
  opponentArchetype: LiveMatchOpponentArchetype
  playerFrames: number
  opponentFrames: number
  currentFrame: number
  playerPoints: number
  opponentPoints: number
  currentVisit: number
  currentBreak: number
  tableState: LiveFrameTableState
  ballsRemaining: number
  playerAtTable: string
  frameStarterName: string
  shotClock: number
  playerConfidence: number
  opponentConfidence: number
  playerFatigue: number
  opponentFatigue: number
  playerClutch: number
  opponentClutch: number
  playerHighestBreak: number
  opponentHighestBreak: number
  playerFifties: number
  playerCenturies: number
  pressureValue: number
  pressureLabel: string
  timeElapsedMinutes: number
  startedAt: string
  table: string
  referee: string
  conditions: string
  intervalText: string
  framesRemainingText: string
  plannedWinChance: number
  plannedMatchWinChance: number
  plannedPlayerStrength: number
  plannedOpponentStrength: number
  feed: LiveFeedItem[]
  momentum: LiveMomentumPoint[]
  frameHistory: FrameScoreRow[]
  tacticalPlan: LiveMatchTacticalPlan
  mentalFocus: LiveMatchMentalFocus
  tempo: LiveMatchTempo
  timeoutsRemaining: number
  lastFrameMode: 'Played' | 'Simmed' | null
  lastTacticalNote: string
  lastVisitSummary: string
  opponentApproach: LiveMatchOpponentApproach
  tacticalEdge: number
  coachPrompt: LiveMatchCoachPrompt
  lastOpponentAdjustment: LiveMatchOpponentAdjustment | null
  opponentAdjustmentHistory: LiveMatchOpponentAdjustment[]
  visitHistory: LiveVisitLogEntry[]
  playerVisitProfile: LiveVisitSkillProfile
  opponentVisitProfile: LiveVisitSkillProfile
  status: 'In Progress' | 'Completed'
}

type CareerSnapshot = {
  label: string
  season: string
  week: number
  date: string
  ranking: number
  rankingLabel: string
  cash: number
  confidence: number
  fatigue: number
  morale: number
  reputation: number
  sponsorCount: number
  matchesPlayed: number
  wins: number
  losses: number
  totalPrizeMoney: number
}

type CareerMatchLogEntry = {
  id: string
  season: string
  date: string
  tournamentId: string
  tournamentName: string
  eventType: Tournament['eventClass'] | Tournament['type']
  tournamentClass?: string
  round: string
  opponentName: string
  playerRanking?: number
  opponentRanking?: number
  winProbability?: number
  playerStrength?: number
  opponentStrength?: number
  opponentRankBand?: string
  result: Match['result']
  score: string
  bestOf: number
  playerFrames: number
  opponentFrames: number
  wentToDecider: boolean
  pressurePeak: number
  prizeMoney: number
  rankingPoints: number
}

type TournamentHistoryEntry = {
  id: string
  season: string
  tournamentId: string
  formatId?: string | null
  tournamentName: string
  eventType: Tournament['eventClass'] | Tournament['type']
  stageId: number | null
  tourCircuit: string
  location: string
  startDate: string
  endDate?: string
  status: 'Entered' | 'Booked' | 'Skipped' | 'High Cost' | 'In Progress' | 'Completed'
  result: string
  rounds: string[]
  matchesPlayed: number
  wins: number
  losses: number
  prizeMoney: number
  rankingPoints: number
  highestBreak: number
  centuries: number
  fatigueChange: number
  entryFee: number
  bookedTravelCost: number
  reward?: string
  progressionImpact?: string
  canonicalResult?: CanonicalTournamentResult
}

type CareerSeasonRecord = {
  season: string
  startedOn: string
  endedOn: string
  openingRanking: number
  openingRankingLabel: string
  closingRanking: number
  closingRankingLabel: string
  matchesPlayed: number
  wins: number
  losses: number
  prizeMoney: number
  rankingPoints: number
  highestBreak: number
  centuries: number
  titles: number
  majorTitles: number
  qTourWins: number
  qSchoolEventsEntered: number
  qSchoolCampaignsEntered: number
  qSchoolMatchesWon: number
  qSchoolCardsWon: number
  tourCardsWon: number
  bestResult: string
}

type CareerHistoryState = {
  snapshots: CareerSnapshot[]
  matchLog: CareerMatchLogEntry[]
  tournamentHistory: TournamentHistoryEntry[]
  seasonRecords: CareerSeasonRecord[]
}

type CompetitionTableKey = 'world' | 'oneYear' | 'amateur' | 'qTour' | 'qSchool' | 'senior' | 'youth'

type CompetitionTableRow = RankingRow & {
  eventsPlayed: number
  titles: number
  wins: number
  losses: number
  statusNote?: string
}

type CompetitionTablesState = Record<CompetitionTableKey, CompetitionTableRow[]>

type TourCardSource = 'Q School' | 'Q Tour' | 'Top Up' | 'Playoff Route' | 'Federation Route' | 'Ranking Retained' | 'Seeded Main Tour' | 'Focused Test Card' | 'Unknown' | null

type TourSurvivalStatus = 'Amateur' | 'Rookie Year 1' | 'Rookie Year 2' | 'Safe' | 'Bubble' | 'At Risk' | 'Lost Card' | 'Top 32' | 'Top 16' | 'Elite'

type WorldPlayerSeasonRecord = {
  season: string
  worldRank: number | null
  oneYearRank: number | null
  amateurRank: number | null
  qTourRank: number | null
  qSchoolRank: number | null
  seniorRank: number | null
  youthRank: number | null
  matches: number
  wins: number
  losses: number
  prizeMoney: number
  rankingPoints: number
  titles: number
  proWins: number
  proLosses: number
  mainTourEvents: number
  status: string
  hasTourCard: boolean
  yearsRemaining: number
  retainedViaRanking: boolean
  cardSource: TourCardSource
  tourSurvivalStatus: TourSurvivalStatus
}

type WorldPlayerRecord = {
  id: string
  playerName: string
  nation: string
  age: number
  hasTourCard: boolean
  cardSource: TourCardSource
  currentYear: number
  yearsRemaining: number
  expiresAfterSeason: string | null
  retainedViaRanking: boolean
  tourSurvivalStatus: TourSurvivalStatus
  totalMatches: number
  wins: number
  losses: number
  totalPrizeMoney: number
  titles: number
  majorTitles: number
  qTourWins: number
  seniorTitles: number
  highestBreak: number
  highestWorldRank: number | null
  developmentPotential?: number
  seasons: WorldPlayerSeasonRecord[]
}

type QTourSystemState = {
  playerRank: number | null
  playerPoints: number
  leader: string | null
  top16Bonus: boolean
  top32Bonus: boolean
  top16Streak: number
  top8Streak: number
  top2Streak: number
  eligibilityScore: number
  directCardAwarded: boolean
  playOffEligible: boolean
  playOffWinner: string | null
}

type QSchoolSystemState = {
  playerRank: number | null
  playerPoints: number
  leader: string | null
  campaignsEntered: number
  eventWins: number
  repeatedFailures: number
  eligibilityScore: number
  campaignEligible: boolean
  seededCampaign: boolean
  directPlayoffEligible: boolean
  eligibilitySeasonsRemaining: number
  cooldownSeasonsRemaining: number
  qualifiedBy: string | null
  topUpEligible: boolean
  slumpRisk: boolean
}

type ProCareerSystemState = {
  hasTourCard: boolean
  cardSource: TourCardSource
  currentYear: number
  yearsRemaining: number
  expiresAfterSeason: string | null
  retainedViaRanking: boolean
  awardedBy: string | null
  survivalStatus: TourSurvivalStatus
  tourSurvivalStatus: TourSurvivalStatus
  currentTier: string
  worldRank: number | null
  oneYearRank: number | null
}

type LateCareerSystemState = {
  veteranActive: boolean
  seniorEligible: boolean
  seniorActive: boolean
  legendStatus: boolean
  retired: boolean
}

type CareerSystemsState = {
  qTour: QTourSystemState
  qSchool: QSchoolSystemState
  pro: ProCareerSystemState
  lateCareer: LateCareerSystemState
}

export type GameState = {
  worldSeed: number
  currentDate: string
  season: string
  week: number
  player: Player
  attributes: PlayerAttributes
  coaches: Coach[]
  currentCoachId: string | null
  equipment: EquipmentState
  finance: FinanceState
  tournaments: Tournament[]
  matches: Match[]
  rankings: RankingRow[]
  competitionTables: CompetitionTablesState
  worldPlayers: WorldPlayerRecord[]
  careerSystems: CareerSystemsState
  sponsors: SponsorDeal[]
  sponsorOffers: SponsorOfferState[]
  inbox: InboxMessage[]
  travel: TravelState
  maintenance: MaintenanceState
  tournamentProgress: TournamentProgressState
  liveMatch: LiveMatchState | null
  history: CareerHistoryState
  coachContracts: CoachContract[]
  trainingPlan: TrainingPlannerDay[]
  trainingAppliedWeek: number | null
  lastAction: string
}

const STORAGE_KEY = 'snooker-career-manager-state-v1'
const TOURNAMENT_ROUNDS: TournamentRound[] = ['Last 16', 'Quarter Final', 'Semi Final', 'Final']
const HISTORY_LIMIT = 40
const MATCH_LOG_LIMIT = 240
const JUNIOR_FIRST_NAMES = ['Luca', 'Noah', 'Arlo', 'Mika', 'Toby', 'Evan', 'Rory', 'Jude', 'Finn', 'Kai']
const JUNIOR_LAST_NAMES = ['Mercer', 'Sloan', 'Hale', 'Bennett', 'Cross', 'Mori', 'Dawes', 'Pryce', 'Vale', 'Keane']
const JUNIOR_NATIONS = ['ENG', 'CHN', 'SCO', 'WAL', 'BEL', 'IRL', 'THA', 'AUS']
const FEEDER_FIRST_NAMES = ['Mason', 'Leo', 'Owen', 'Isaac', 'Felix', 'Harvey', 'Ethan', 'Adam', 'Lewis', 'Cian']
const FEEDER_LAST_NAMES = ['Turner', 'Nash', 'Walsh', 'Frost', 'Reeve', 'Bell', 'Cairn', 'Flint', 'Pike', 'Arden']
const FEEDER_NATIONS = ['ENG', 'SCO', 'WAL', 'IRL', 'NIR', 'BEL', 'GER', 'NED', 'POL', 'AUS']
const TOURNAMENT_HISTORY_LIMIT = 240
const SEASON_RECORD_LIMIT = 12
const COMPETITION_TABLE_KEYS: CompetitionTableKey[] = ['world', 'oneYear', 'amateur', 'qTour', 'qSchool', 'senior', 'youth']
const SPONSOR_SLOT_NAMES = ['Waistcoat Front', 'Cue Case', 'Social Media Partner'] as const
const COACH_SLOT_NAMES = ['Lead Coach', 'Specialist Coach'] as const
const MAIN_TOUR_POOL_SIZE = 128
const TOP_16_RANK_CUTOFF = 16
const TOP_32_RANK_CUTOFF = 32
const TOP_64_RANK_CUTOFF = 64

const ROUND_PLANS: Record<TournamentRound, { bestOf: number; winPrizeShare: number; lossPrizeShare: number; winPointsShare: number; lossPointsShare: number }> = {
  'Last 16': { bestOf: 7, winPrizeShare: 0.08, lossPrizeShare: 0.02, winPointsShare: 0.12, lossPointsShare: 0.03 },
  'Quarter Final': { bestOf: 7, winPrizeShare: 0.14, lossPrizeShare: 0.05, winPointsShare: 0.22, lossPointsShare: 0.06 },
  'Semi Final': { bestOf: 9, winPrizeShare: 0.24, lossPrizeShare: 0.1, winPointsShare: 0.36, lossPointsShare: 0.12 },
  Final: { bestOf: 11, winPrizeShare: 0.45, lossPrizeShare: 0.18, winPointsShare: 0.62, lossPointsShare: 0.2 },
}

function getTournamentRoundPlan(tournament: Tournament, round: TournamentRound) {
  const basePlan = ROUND_PLANS[round]
  return {
    ...basePlan,
    bestOf: getBestOfForRound(tournament, round, basePlan.bestOf),
  }
}

function getQSchoolRoute(tournament: Tournament) {
  const name = tournament.name.toLowerCase()
  if (/asia[\s-]*oceania/.test(name)) return 'asiaOceania'
  if (/uk[\s/-]*europe|europe q school/.test(name)) return 'ukEurope'
  return 'generic'
}

function getQSchoolCardWinningRound(tournament: Tournament): TournamentRound {
  return getQSchoolRoute(tournament) === 'asiaOceania' ? 'Final' : 'Semi Final'
}
const LIVE_ENDGAME_COLOURS: LiveEndgameColour[] = ['Yellow', 'Green', 'Brown', 'Blue', 'Pink', 'Black']
const LIVE_ENDGAME_COLOUR_POINTS: Record<LiveEndgameColour, number> = {
  Yellow: 2,
  Green: 3,
  Brown: 4,
  Blue: 5,
  Pink: 6,
  Black: 7,
}
const LIVE_OPPONENT_ARCHETYPES: LiveMatchOpponentArchetype[] = ['Serial Scorer', 'Tactical Grinder', 'Counter Puncher', 'Tempo Disruptor']
const LIVE_FRAME_START_REDS = 15

function createEmptyTournamentProgress(): TournamentProgressState {
  return {
    tournamentId: null,
    currentRound: null,
    draw: [],
    completedRounds: [],
  }
}

function normalizeLiveMatchState(liveMatch: LiveMatchState | null | undefined): LiveMatchState | null {
  if (!liveMatch) return null

  const defaultVisitProfile: LiveVisitSkillProfile = {
    longPotting: 60,
    breakBuilding: 60,
    cueBallControl: 60,
    safetyPlay: 60,
    consistency: 60,
    composure: 60,
    focus: 60,
    bigMatchNerve: 60,
    handSteadiness: 60,
    stamina: 60,
  }

  const normalizedTableState = liveMatch.tableState ?? createTableStateFromLegacyBallCount(liveMatch.ballsRemaining ?? 12)

  return {
    ...liveMatch,
    currentVisit: liveMatch.currentVisit ?? 1,
    tableState: normalizedTableState,
    ballsRemaining: getLegacyBallUnitsFromTableState(normalizedTableState),
    tacticalPlan: liveMatch.tacticalPlan ?? 'Balanced',
    mentalFocus: liveMatch.mentalFocus ?? 'Composed',
    tempo: liveMatch.tempo ?? 'Steady',
    timeoutsRemaining: liveMatch.timeoutsRemaining ?? 2,
    lastFrameMode: liveMatch.lastFrameMode ?? null,
    lastTacticalNote: liveMatch.lastTacticalNote ?? 'Balanced plan is active for the next frame.',
    lastVisitSummary: liveMatch.lastVisitSummary ?? 'Opening visit is ready.',
    opponentArchetype: liveMatch.opponentArchetype ?? getOpponentArchetype(liveMatch.opponentName, liveMatch.opponentRanking),
    opponentApproach: liveMatch.opponentApproach ?? 'Measured',
    tacticalEdge: liveMatch.tacticalEdge ?? 0,
    coachPrompt: liveMatch.coachPrompt ?? {
      title: 'Stay on plan',
      note: 'Balanced plan is active for the next frame.',
      recommendedPlan: 'Balanced',
      recommendedMentalFocus: 'Composed',
      recommendedTempo: 'Steady',
    },
    lastOpponentAdjustment: liveMatch.lastOpponentAdjustment ?? null,
    opponentAdjustmentHistory: liveMatch.opponentAdjustmentHistory ?? [],
    visitHistory: liveMatch.visitHistory ?? [],
    playerVisitProfile: liveMatch.playerVisitProfile ?? defaultVisitProfile,
    opponentVisitProfile: liveMatch.opponentVisitProfile ?? defaultVisitProfile,
  }
}

function getFrameStartTableState(): LiveFrameTableState {
  return {
    redsRemaining: LIVE_FRAME_START_REDS,
    coloursRemaining: [...LIVE_ENDGAME_COLOURS],
  }
}

function getLegacyBallUnitsFromTableState(tableState: LiveFrameTableState) {
  return tableState.redsRemaining + tableState.coloursRemaining.length
}

function createTableStateFromLegacyBallCount(ballCount: number): LiveFrameTableState {
  const safeBallCount = clamp(Math.round(ballCount), 0, LIVE_FRAME_START_REDS + LIVE_ENDGAME_COLOURS.length)

  if (safeBallCount > LIVE_ENDGAME_COLOURS.length) {
    return {
      redsRemaining: safeBallCount - LIVE_ENDGAME_COLOURS.length,
      coloursRemaining: [...LIVE_ENDGAME_COLOURS],
    }
  }

  return {
    redsRemaining: 0,
    coloursRemaining: LIVE_ENDGAME_COLOURS.slice(LIVE_ENDGAME_COLOURS.length - safeBallCount),
  }
}

function getCurrentEndgameColour(tableState: LiveFrameTableState) {
  return tableState.coloursRemaining[0] ?? null
}

function getFrameTableSummary(tableState: LiveFrameTableState) {
  if (tableState.redsRemaining > 0) {
    return `${tableState.redsRemaining} red${tableState.redsRemaining === 1 ? '' : 's'} plus colours remain`
  }

  const currentColour = getCurrentEndgameColour(tableState)
  return currentColour ? `${currentColour.toLowerCase()} to black remain` : 'Colours cleared'
}

function isRespottedBlackVisit(liveMatch: LiveMatchState) {
  return liveMatch.tableState.redsRemaining === 0 && liveMatch.tableState.coloursRemaining.length === 0 && liveMatch.playerPoints === liveMatch.opponentPoints
}

function getRemainingTablePoints(liveMatch: LiveMatchState) {
  return liveMatch.tableState.redsRemaining * 8 + liveMatch.tableState.coloursRemaining.reduce((total, colour) => total + LIVE_ENDGAME_COLOUR_POINTS[colour], 0)
}

function areSnookersRequired(trailingPoints: number, remainingTablePoints: number) {
  return trailingPoints > remainingTablePoints
}

function hashStringToNumber(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647
  }

  return Math.abs(hash)
}

function getOpponentArchetype(opponentName: string, opponentRank: number): LiveMatchOpponentArchetype {
  const seed = hashStringToNumber(`${opponentName}-${opponentRank}`)
  return LIVE_OPPONENT_ARCHETYPES[seed % LIVE_OPPONENT_ARCHETYPES.length]
}

function getOpponentArchetypeNote(opponentArchetype: LiveMatchOpponentArchetype) {
  if (opponentArchetype === 'Serial Scorer') return 'heavy scorer who backs break-building chances'
  if (opponentArchetype === 'Tactical Grinder') return 'safety-first grinder who likes low-risk frames'
  if (opponentArchetype === 'Counter Puncher') return 'measured counter-puncher who waits for loose entries'
  return 'tempo disruptor who tries to make frames awkward and scrappy'
}

function getAutoOpponentVisitDecision(liveMatch: LiveMatchState): LiveVisitDecision {
  if (isRespottedBlackVisit(liveMatch)) return 'Respotted Black'
  if (areSnookersRequired(liveMatch.playerPoints - liveMatch.opponentPoints, getRemainingTablePoints(liveMatch)) && liveMatch.tableState.redsRemaining === 0) {
    return 'Snooker Hunt'
  }
  if (liveMatch.opponentApproach === 'Pressing') return 'Break Build'
  if (liveMatch.opponentApproach === 'Tight') return 'Safety Exchange'
  if (liveMatch.opponentArchetype === 'Tempo Disruptor' && liveMatch.tableState.redsRemaining === 0) return 'Safety Exchange'
  return 'Pot Attempt'
}

function getDefaultManualVisitDecision(liveMatch: LiveMatchState): LiveVisitDecision {
  if (isRespottedBlackVisit(liveMatch)) return 'Respotted Black'
  if (areSnookersRequired(liveMatch.opponentPoints - liveMatch.playerPoints, getRemainingTablePoints(liveMatch)) && liveMatch.tableState.redsRemaining === 0) {
    return 'Snooker Hunt'
  }
  if (liveMatch.tacticalPlan === 'Attack') return 'Break Build'
  if (liveMatch.tacticalPlan === 'Safety') return 'Safety Exchange'
  return 'Pot Attempt'
}

function formatLiveClock(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function getLiveVisitRankBand(rank: number) {
  if (rank <= 1) return 'World Champion'
  if (rank <= 4) return 'Top 4'
  if (rank <= 16) return 'Top 16'
  if (rank <= 32) return 'Top 32'
  if (rank <= 64) return 'Top 64'
  if (rank <= 80) return 'Rookie Pro'
  if (rank <= 96) return 'Q Tour'
  if (rank <= 128) return 'Amateur'
  return 'Youth'
}

function buildLiveVisitProfileFromAttributes(attributes: PlayerAttributes, equipmentBonus = 0): LiveVisitSkillProfile {
  return {
    longPotting: clamp(attributes.technical['Long Potting'] + Math.round(equipmentBonus * 0.2), 1, 100),
    breakBuilding: clamp(attributes.technical['Break Building'] + Math.round(equipmentBonus * 0.15), 1, 100),
    cueBallControl: clamp(attributes.technical['Cue Ball Control'] + Math.round(equipmentBonus * 0.25), 1, 100),
    safetyPlay: clamp(attributes.technical['Safety Play'] + Math.round(equipmentBonus * 0.1), 1, 100),
    consistency: attributes.technical.Consistency,
    composure: attributes.mental.Composure,
    focus: attributes.mental.Focus,
    bigMatchNerve: attributes.mental['Big Match Nerve'],
    handSteadiness: attributes.physical['Hand Steadiness'],
    stamina: attributes.physical.Stamina,
  }
}

function getLiveVisitTacticalPlan(visitProfile: LiveVisitSkillProfile): LiveMatchTacticalPlan {
  if (visitProfile.breakBuilding >= visitProfile.safetyPlay + 5 || visitProfile.longPotting >= visitProfile.safetyPlay + 7) {
    return 'Attack'
  }

  if (visitProfile.safetyPlay >= visitProfile.breakBuilding + 5 || visitProfile.focus >= visitProfile.longPotting + 6) {
    return 'Safety'
  }

  return 'Balanced'
}

const LIVE_VISIT_RANK_BASELINES: Partial<Record<string, { technical: number; mental: number; physical: number }>> = {
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

function buildRankBasedLiveVisitAttributes(
  opponentRank: number,
  opponentStrength: number,
  opponentArchetype: LiveMatchOpponentArchetype,
  sourceRankBand?: string,
  useArchetypeBias = true,
): PlayerAttributes {
  const derivedRankBand = sourceRankBand ?? getLiveVisitRankBand(opponentRank)
  const baseline = LIVE_VISIT_RANK_BASELINES[derivedRankBand]
  const eliteFactor = clamp(Math.round((100 - opponentRank) * 0.45), 6, 44)
  const technicalBase = baseline
    ? clamp(baseline.technical + Math.round((opponentStrength - baseline.technical) * 0.25), 42, 94)
    : clamp(Math.round(opponentStrength + eliteFactor * 0.16), 42, 94)
  const mentalBase = baseline
    ? clamp(baseline.mental + Math.round((opponentStrength - baseline.mental) * 0.18), 40, 93)
    : clamp(Math.round(opponentStrength - 2 + eliteFactor * 0.12), 40, 93)
  const physicalBase = baseline
    ? clamp(baseline.physical + Math.round((opponentStrength - baseline.physical) * 0.12), 38, 90)
    : clamp(Math.round(opponentStrength - 5 + eliteFactor * 0.08), 38, 90)
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

  if (!useArchetypeBias) {
    return attributes
  }

  if (opponentArchetype === 'Serial Scorer') {
    attributes.technical['Long Potting'] = clamp(attributes.technical['Long Potting'] + 7, 1, 99)
    attributes.technical['Break Building'] = clamp(attributes.technical['Break Building'] + 9, 1, 99)
    attributes.technical['Cue Ball Control'] = clamp(attributes.technical['Cue Ball Control'] + 4, 1, 99)
    attributes.technical['Safety Play'] = clamp(attributes.technical['Safety Play'] - 5, 1, 99)
  } else if (opponentArchetype === 'Tactical Grinder') {
    attributes.technical['Safety Play'] = clamp(attributes.technical['Safety Play'] + 9, 1, 99)
    attributes.mental.Focus = clamp(attributes.mental.Focus + 6, 1, 99)
    attributes.mental.Composure = clamp(attributes.mental.Composure + 5, 1, 99)
    attributes.technical['Break Building'] = clamp(attributes.technical['Break Building'] - 6, 1, 99)
  } else if (opponentArchetype === 'Counter Puncher') {
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

export function buildLiveVisitProfile(inputProfile: {
  side: 'player' | 'opponent'
  name: string
  sourceKind: 'attributes' | 'rankBased'
  attributes: PlayerAttributes
  confidence: number
  fatigue: number
  equipmentBonus: number
  sourceRankBand: string
  tacticalPlan?: 'Attack' | 'Balanced' | 'Safety'
  startsFrameProbability?: number
  initialMomentum?: number
}): ConstructedLiveVisitProfile {
  const technicalAverage = calculateTechnicalAverage(inputProfile.attributes.technical)
  const mentalAverage = calculateAverage(Object.values(inputProfile.attributes.mental))
  const physicalAverage = calculateAverage(Object.values(inputProfile.attributes.physical))
  const visitProfile = buildLiveVisitProfileFromAttributes(inputProfile.attributes, inputProfile.equipmentBonus)
  const tacticalPlan = inputProfile.tacticalPlan ?? getLiveVisitTacticalPlan(visitProfile)
  const pressureHandling = Math.round((visitProfile.bigMatchNerve + visitProfile.composure + visitProfile.focus) / 3)
  const potting = Math.round((visitProfile.longPotting + visitProfile.cueBallControl + visitProfile.handSteadiness) / 3)
  const tacticalRating = Math.round((visitProfile.safetyPlay + visitProfile.cueBallControl + visitProfile.focus + visitProfile.composure) / 4)
  const errorRate = clamp(
    Math.round(100 - (visitProfile.consistency * 0.45 + visitProfile.focus * 0.35 + visitProfile.composure * 0.2)),
    2,
    60,
  )
  const constructedStrength = calculateMatchStrength({
    technical: technicalAverage,
    mental: mentalAverage,
    physical: physicalAverage,
    confidence: inputProfile.confidence,
    fatigue: inputProfile.fatigue,
    equipmentBonus: inputProfile.equipmentBonus,
  })

  return {
    side: inputProfile.side,
    name: inputProfile.name,
    sourceKind: inputProfile.sourceKind,
    sourceRankBand: inputProfile.sourceRankBand,
    overall: Math.round((technicalAverage + mentalAverage + physicalAverage) / 3),
    technicalAverage,
    mentalAverage,
    physicalAverage,
    confidence: inputProfile.confidence,
    fatigue: inputProfile.fatigue,
    pressureHandling,
    composure: visitProfile.composure,
    breakBuilding: visitProfile.breakBuilding,
    safety: visitProfile.safetyPlay,
    potting,
    longPotting: visitProfile.longPotting,
    tacticalRating,
    consistency: visitProfile.consistency,
    errorRate,
    equipmentBonus: inputProfile.equipmentBonus,
    tacticalPlan,
    startsFrameProbability: inputProfile.startsFrameProbability ?? 50,
    initialMomentum: inputProfile.initialMomentum ?? 50,
    constructedStrength,
    visitProfile,
  }
}

function createSeededLiveMatchRandom(seed: number) {
  let current = seed >>> 0

  return () => {
    current += 0x6d2b79f5
    let value = current
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function withSeededLiveMatchRandom<T>(seed: number, callback: () => T) {
  const originalRandom = Math.random
  Math.random = createSeededLiveMatchRandom(seed)

  try {
    return callback()
  } finally {
    Math.random = originalRandom
  }
}

function getSyntheticLiveMatchRound(bestOf: number): TournamentRound {
  if (bestOf <= 7) return 'Last 16'
  if (bestOf <= 11) return 'Quarter Final'
  if (bestOf <= 19) return 'Semi Final'
  return 'Final'
}

function simulateCareerFrameOutcome(playerFrameWinChance: number, playerStrength: number, opponentStrength: number, forcedWinner: boolean | null = null): SimulatedFrameOutcome {
  const playerWonFrame = forcedWinner ?? (Math.random() * 100 < playerFrameWinChance)
  const winningStrength = playerWonFrame ? playerStrength : opponentStrength
  const losingStrength = playerWonFrame ? opponentStrength : playerStrength
  const winningPoints = clamp(Math.round(36 + winningStrength * 0.48 + Math.random() * 28), 45, 132)
  const losingCap = Math.max(0, winningPoints - 5)
  const losingPoints = clamp(Math.round(Math.random() * Math.min(losingCap, 18 + losingStrength * 0.42)), 0, losingCap)
  const winningBreak = clamp(Math.round(14 + winningStrength * 0.56 + Math.random() * 22), 8, winningPoints)
  const losingBreak = losingPoints > 0
    ? clamp(Math.round(Math.random() * Math.min(losingPoints, 10 + losingStrength * 0.4)), 0, losingPoints)
    : 0

  return playerWonFrame
    ? {
        playerWonFrame,
        playerPoints: winningPoints,
        opponentPoints: losingPoints,
        playerBreak: winningBreak,
        opponentBreak: losingBreak,
      }
    : {
        playerWonFrame,
        playerPoints: losingPoints,
        opponentPoints: winningPoints,
        playerBreak: losingBreak,
        opponentBreak: winningBreak,
      }
}

function buildCareerFrameOrder(playerWonMatch: boolean, framesNeeded: number, loserFrames: number): boolean[] {
  const frameOrder = Array<boolean>(framesNeeded + loserFrames).fill(playerWonMatch)
  const loserFrameSlots = new Set<number>()

  while (loserFrameSlots.size < loserFrames) {
    loserFrameSlots.add(Math.floor(Math.random() * Math.max(1, frameOrder.length - 1)))
  }

  loserFrameSlots.forEach((index) => {
    frameOrder[index] = !playerWonMatch
  })
  frameOrder[frameOrder.length - 1] = playerWonMatch

  return frameOrder
}

function createSyntheticLiveVisitSideMetrics(): SyntheticLiveVisitSideMetrics {
  return {
    frameStarts: 0,
    firstScoringChances: 0,
    visits: 0,
    pointsScored: 0,
    frameWins: 0,
    potAttempts: 0,
    potSuccesses: 0,
    breakBuildAttempts: 0,
    breakBuildSuccesses: 0,
    safetyAttempts: 0,
    safetySuccesses: 0,
    snookerHuntAttempts: 0,
    snookerHuntSuccesses: 0,
    respottedBlackAttempts: 0,
    respottedBlackSuccesses: 0,
    foulsCommitted: 0,
    unforcedErrors: 0,
    scoringVisitCount: 0,
    totalScoringBreak: 0,
    totalTacticalEdge: 0,
    totalDecisionBonus: 0,
    totalSuccessChance: 0,
    totalConfidence: 0,
    totalFatigue: 0,
  }
}

function recordSyntheticDecisionMetrics(sideMetrics: SyntheticLiveVisitSideMetrics, decision: LiveVisitDecision, success: boolean) {
  if (decision === 'Pot Attempt') {
    sideMetrics.potAttempts += 1
    if (success) sideMetrics.potSuccesses += 1
    return
  }

  if (decision === 'Break Build') {
    sideMetrics.breakBuildAttempts += 1
    if (success) sideMetrics.breakBuildSuccesses += 1
    return
  }

  if (decision === 'Safety Exchange') {
    sideMetrics.safetyAttempts += 1
    if (success) sideMetrics.safetySuccesses += 1
    return
  }

  if (decision === 'Snooker Hunt') {
    sideMetrics.snookerHuntAttempts += 1
    if (success) sideMetrics.snookerHuntSuccesses += 1
    return
  }

  sideMetrics.respottedBlackAttempts += 1
  if (success) sideMetrics.respottedBlackSuccesses += 1
}

function getSyntheticDefaultPressureValue(playerFrames: number, opponentFrames: number, framesNeeded: number) {
  return clamp(
    38 + Math.abs(playerFrames - opponentFrames) * 8 + (Math.max(playerFrames, opponentFrames) >= framesNeeded - 1 ? 18 : 0),
    24,
    96,
  )
}

function getSyntheticPressurePhase(liveMatch: Pick<LiveMatchState, 'round' | 'playerFrames' | 'opponentFrames' | 'framesNeeded'>): SyntheticLiveVisitFrameSummary['pressurePhase'] {
  if (liveMatch.round === 'Final' && Math.max(liveMatch.playerFrames, liveMatch.opponentFrames) >= liveMatch.framesNeeded - 3) {
    return 'Final'
  }

  if (liveMatch.playerFrames === liveMatch.framesNeeded - 1 && liveMatch.opponentFrames === liveMatch.framesNeeded - 1) {
    return 'Decider'
  }

  if (Math.max(liveMatch.playerFrames, liveMatch.opponentFrames) >= liveMatch.framesNeeded - 2) {
    return 'Closing'
  }

  return 'Standard'
}

function buildSyntheticFrameSummary(
  frameStartState: LiveMatchState,
  frameEndState: LiveMatchState,
  frameRow: FrameScoreRow,
  frameVisits: SyntheticLiveVisitVisitLogEntry[],
): SyntheticLiveVisitFrameSummary {
  const winner = frameRow.winner === frameStartState.playerName ? 'Player' : 'Opponent'
  const loser = winner === 'Player' ? 'Opponent' : 'Player'
  const playerPoints = Number(frameRow.player)
  const opponentPoints = Number(frameRow.opponent)
  const margin = Math.abs(playerPoints - opponentPoints)
  const winnerVisits = frameVisits.filter((visit) => visit.actor === winner)
  const loserVisits = frameVisits.filter((visit) => visit.actor === loser)
  const keyBreak = winnerVisits.reduce((best, visit) => Math.max(best, visit.breakTotal), 0)
  const firstScoringVisit = frameVisits.find((visit) => visit.points > 0)
  const firstScoreBy = firstScoringVisit?.actor ?? 'None'

  let hadLeadChange = false
  let winnerCameFromBehind = false
  let leadState = 0

  frameVisits.forEach((visit) => {
    const lead = Math.sign(visit.playerPointsAfter - visit.opponentPointsAfter)
    if (lead !== 0) {
      if (leadState !== 0 && leadState !== lead) {
        hadLeadChange = true
      }
      leadState = lead
    }

    if ((winner === 'Player' && lead < 0) || (winner === 'Opponent' && lead > 0)) {
      winnerCameFromBehind = true
    }
  })

  const latePressureError = loserVisits.find((visit) => !visit.success && (visit.pressureValue >= 72 || visit.actorFatigue >= 62) && visit.visit >= Math.max(2, frameVisits.length - 2))
  const forcedFoul = winnerVisits.find((visit) => visit.decision === 'Snooker Hunt' && visit.success)
  const safetyWin = winnerVisits.find((visit) => visit.decision === 'Safety Exchange' && visit.success)
  const openingBurst = winnerVisits.find((visit) => visit.visit <= 2 && visit.breakTotal >= 30)
  const closeFrame = margin <= 24
  const keyMoments: string[] = []

  if (openingBurst) keyMoments.push(`${winner} struck first with an early ${openingBurst.breakTotal} break.`)
  if (keyBreak >= 40 && !openingBurst) keyMoments.push(`${winner} made the decisive scoring visit with a ${keyBreak} break.`)
  if (forcedFoul) keyMoments.push(`${winner} forced foul points when the table tightened up.`)
  if (safetyWin) keyMoments.push(`${winner} won the key safety exchange.`)
  if (winnerCameFromBehind) keyMoments.push(`${winner} recovered after trailing earlier in the frame.`)
  if (hadLeadChange) keyMoments.push('The lead changed hands before the colours.')
  if (latePressureError) keyMoments.push(`${loser} made a late mistake under pressure or fatigue.`)
  if (closeFrame && keyMoments.length === 0) keyMoments.push('The frame stayed close until the final colours.')

  let reason = `${winner} created the better scoring chances across the frame.`
  if (openingBurst && latePressureError) {
    reason = `${winner} started quickly with a scoring burst and then punished a late pressure mistake.`
  } else if (keyBreak >= 50) {
    reason = `${winner} took the frame with a heavy break that the other side could not answer.`
  } else if (forcedFoul) {
    reason = `${winner} squeezed the frame with foul pressure and better composure late on.`
  } else if (closeFrame && winnerCameFromBehind) {
    reason = `${winner} stole a close frame after trailing and handled the late pressure better.`
  } else if (closeFrame) {
    reason = `${winner} held nerve better on a close set of colours.`
  } else if (latePressureError) {
    reason = `${winner} took over after ${loser.toLowerCase()} made a fatigue or pressure error.`
  } else if (safetyWin) {
    reason = `${winner} won the safety exchanges and converted the cleaner openings.`
  } else if (openingBurst) {
    reason = `${winner} scored first and controlled the frame from there.`
  }

  return {
    frameNumber: Number(frameRow.frame.replace('F', '')),
    winner,
    score: `${playerPoints}-${opponentPoints}`,
    playerPoints,
    opponentPoints,
    keyBreak,
    closeFrame,
    decidingFrame: frameStartState.playerFrames === frameStartState.framesNeeded - 1 && frameStartState.opponentFrames === frameStartState.framesNeeded - 1,
    pressurePhase: getSyntheticPressurePhase(frameStartState),
    firstScoreBy,
    hadLeadChange,
    winnerCameFromBehind,
    playerConfidenceStart: frameStartState.playerConfidence,
    playerConfidenceEnd: frameEndState.playerConfidence,
    opponentConfidenceStart: frameStartState.opponentConfidence,
    opponentConfidenceEnd: frameEndState.opponentConfidence,
    playerFatigueStart: frameStartState.playerFatigue,
    playerFatigueEnd: frameEndState.playerFatigue,
    opponentFatigueStart: frameStartState.opponentFatigue,
    opponentFatigueEnd: frameEndState.opponentFatigue,
    pressureStart: frameStartState.pressureValue,
    pressureEnd: frameEndState.pressureValue,
    keyMoments,
    reason,
  }
}

function getLiveVisitFatigueCost(activeProfile: LiveVisitSkillProfile, decision: LiveVisitDecision, baseCost: number) {
  const staminaRelief = activeProfile.stamina * 0.012 + activeProfile.handSteadiness * 0.004
  const decisionLoad = decision === 'Break Build' ? 0.22 : decision === 'Safety Exchange' ? -0.14 : 0
  return clamp((baseCost + decisionLoad - staminaRelief) * 0.68, 0.22, 1.55)
}

function getLiveVisitFrameFatigueCost(activeProfile: LiveVisitSkillProfile) {
  return clamp((1.15 - activeProfile.stamina * 0.008 - activeProfile.handSteadiness * 0.004) * 0.62, 0.22, 0.75)
}

function getLiveVisitColourChoice(activeProfile: LiveVisitSkillProfile, decision: LiveVisitDecision) {
  const blackBias = activeProfile.breakBuilding + activeProfile.cueBallControl + activeProfile.focus
  const roll = Math.random() * 100

  if (decision === 'Break Build') {
    if (blackBias >= 238 && roll < 68) return 7
    if (blackBias >= 210 && roll < 54) return 7
    if (roll < 26) return 7
    if (roll < 54) return 6
    if (roll < 76) return 5
    return 4
  }

  if (roll < 18 + activeProfile.cueBallControl * 0.18) return 7
  if (roll < 42 + activeProfile.cueBallControl * 0.12) return 6
  if (roll < 64) return 5
  if (roll < 82) return 4
  return 2 + Math.floor(Math.random() * 3)
}

function getLiveVisitRedClearance(activeProfile: LiveVisitSkillProfile, decision: LiveVisitDecision, retainedTable: boolean, redsRemaining: number) {
  if (redsRemaining <= 0 || decision === 'Safety Exchange' || decision === 'Snooker Hunt' || decision === 'Respotted Black') return 0
  if (decision === 'Pot Attempt') return 1

  const scoringCeiling = activeProfile.breakBuilding * 0.45 + activeProfile.cueBallControl * 0.25 + activeProfile.consistency * 0.18 + activeProfile.focus * 0.12
  const baseClearance = scoringCeiling >= 84 ? 4 : scoringCeiling >= 76 ? 3 : scoringCeiling >= 66 ? 2 : 1
  const extraClearance = retainedTable && Math.random() * 100 < Math.max(0, scoringCeiling - 62) ? 1 : 0

  return Math.min(redsRemaining, baseClearance + extraClearance)
}

function resolveLiveVisitScoring(
  activeProfile: LiveVisitSkillProfile,
  decision: LiveVisitDecision,
  tableState: LiveFrameTableState,
  retainedTable: boolean,
) {
  const nextTableState: LiveFrameTableState = {
    redsRemaining: tableState.redsRemaining,
    coloursRemaining: [...tableState.coloursRemaining],
  }
  let scoredPoints = 0
  let tableProgressLabel = ''

  if (decision === 'Snooker Hunt') {
    scoredPoints = clamp(4 + Math.round(Math.random() * 3), 4, 7)
    tableProgressLabel = `forced ${scoredPoints} foul points`
    return { scoredPoints, nextTableState, tableProgressLabel }
  }

  if (decision === 'Respotted Black') {
    scoredPoints = 7
    tableProgressLabel = 'potted the respotted black'
    return { scoredPoints, nextTableState, tableProgressLabel }
  }

  if (decision === 'Safety Exchange') {
    tableProgressLabel = 'left the cue ball safe'
    return { scoredPoints, nextTableState, tableProgressLabel }
  }

  if (tableState.redsRemaining > 0) {
    const redsCleared = getLiveVisitRedClearance(activeProfile, decision, retainedTable, tableState.redsRemaining)
    const colourScores = Array.from({ length: redsCleared }).map(() => getLiveVisitColourChoice(activeProfile, decision))
    scoredPoints = redsCleared + colourScores.reduce((total, value) => total + value, 0)
    nextTableState.redsRemaining = Math.max(0, nextTableState.redsRemaining - redsCleared)
    tableProgressLabel = redsCleared > 0
      ? `made ${scoredPoints} from ${redsCleared} red${redsCleared === 1 ? '' : 's'} and colour${redsCleared === 1 ? '' : 's'}`
      : 'could not open the scoring chance'

    if (retainedTable && nextTableState.redsRemaining === 0 && nextTableState.coloursRemaining.length > 0 && decision === 'Break Build') {
      const colourRun = Math.min(nextTableState.coloursRemaining.length, activeProfile.breakBuilding >= 84 ? 3 : activeProfile.breakBuilding >= 72 ? 2 : 1)
      const pottedColours = nextTableState.coloursRemaining.slice(0, colourRun)
      scoredPoints += pottedColours.reduce((total, colour) => total + LIVE_ENDGAME_COLOUR_POINTS[colour], 0)
      nextTableState.coloursRemaining = nextTableState.coloursRemaining.slice(pottedColours.length)
      tableProgressLabel += `, then cleared ${pottedColours.map((colour) => colour.toLowerCase()).join(', ')}`
    }

    return { scoredPoints, nextTableState, tableProgressLabel }
  }

  const colourRun = decision === 'Break Build'
    ? Math.min(nextTableState.coloursRemaining.length, activeProfile.breakBuilding >= 84 && retainedTable ? 4 : retainedTable ? 2 : 1)
    : 1
  const pottedColours = nextTableState.coloursRemaining.slice(0, colourRun)
  scoredPoints = pottedColours.reduce((total, colour) => total + LIVE_ENDGAME_COLOUR_POINTS[colour], 0)
  nextTableState.coloursRemaining = nextTableState.coloursRemaining.slice(pottedColours.length)
  tableProgressLabel = pottedColours.length > 0
    ? `cleared ${pottedColours.map((colour) => colour.toLowerCase()).join(', ')}`
    : 'cleared the table'

  return { scoredPoints, nextTableState, tableProgressLabel }
}

function getSyntheticCalibrationVisitDecision(liveMatch: LiveMatchState, tacticalPlanOverride?: LiveMatchTacticalPlan): LiveVisitDecision {
  const actorIsPlayer = liveMatch.playerAtTable === liveMatch.playerName
  const activeProfile = actorIsPlayer ? liveMatch.playerVisitProfile : liveMatch.opponentVisitProfile
  const actorPoints = actorIsPlayer ? liveMatch.playerPoints : liveMatch.opponentPoints
  const defendingPoints = actorIsPlayer ? liveMatch.opponentPoints : liveMatch.playerPoints
  const tacticalPlan = tacticalPlanOverride ?? getLiveVisitTacticalPlan(activeProfile)

  if (isRespottedBlackVisit(liveMatch)) return 'Respotted Black'
  if (areSnookersRequired(defendingPoints - actorPoints, getRemainingTablePoints(liveMatch)) && liveMatch.tableState.redsRemaining === 0) {
    return 'Snooker Hunt'
  }

  if (liveMatch.tableState.redsRemaining === 0 && tacticalPlan === 'Safety') {
    return 'Safety Exchange'
  }

  if (tacticalPlan === 'Attack' && liveMatch.tableState.redsRemaining > 0) {
    return 'Break Build'
  }

  if (liveMatch.pressureValue >= 64 && tacticalPlan === 'Safety') {
    return 'Safety Exchange'
  }

  return 'Pot Attempt'
}

function resolveCareerMatchResult(matchWinChance: number, framesNeeded: number): CareerMatchResolution {
  const playerWonMatch = Math.random() * 100 < matchWinChance
  const dominance = Math.abs(matchWinChance - 50) / 50
  const closeness = 1 - dominance
  const expectedLoserFrames = (framesNeeded - 1) * (0.2 + closeness * 0.65)
  const volatility = Math.max(0.6, (framesNeeded - 1) * 0.18)
  const loserFrames = clamp(
    Math.round(expectedLoserFrames + (Math.random() - 0.5) * volatility * 2),
    0,
    framesNeeded - 1,
  )

  return {
    playerWonMatch,
    loserFrames,
    frameOrder: buildCareerFrameOrder(playerWonMatch, framesNeeded, loserFrames),
  }
}

function buildVisitFeedEntry(time: string, text: string, actor: LiveVisitActor | 'System', tone: 'green' | 'amber' | 'red' | 'blue'): LiveFeedItem {
  return {
    id: `feed-visit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    time,
    text,
    actor,
    tone,
  }
}

function playOutLiveFrame(liveMatch: LiveMatchState, mode: LiveMatchResolutionMode): LiveMatchState {
  let nextLiveMatch = liveMatch
  const startingFrame = liveMatch.currentFrame
  let guard = 0

  while (nextLiveMatch.status === 'In Progress' && nextLiveMatch.currentFrame === startingFrame && guard < 60) {
    const decision = nextLiveMatch.playerAtTable === nextLiveMatch.playerName && mode === 'manual'
      ? getDefaultManualVisitDecision(nextLiveMatch)
      : undefined
    nextLiveMatch = advanceLiveVisit(nextLiveMatch, decision, mode)
    guard += 1
  }

  return nextLiveMatch
}

function buildPlayerLiveVisitProfile(state: GameState): LiveVisitSkillProfile {
  return buildLiveVisitProfile({
    side: 'player',
    name: state.player.fullName,
    sourceKind: 'attributes',
    attributes: state.attributes,
    confidence: state.player.confidence,
    fatigue: state.player.fatigue,
    equipmentBonus: getCurrentCueBonus(state.equipment),
    sourceRankBand: state.player.worldRanking != null ? getLiveVisitRankBand(state.player.worldRanking) : 'Player',
  }).visitProfile
}

function buildOpponentLiveVisitProfile(opponentRank: number, opponentStrength: number, opponentArchetype: LiveMatchOpponentArchetype, confidence = 62, fatigue = 18, equipmentBonus = 0): LiveVisitSkillProfile {
  const sourceRankBand = getLiveVisitRankBand(opponentRank)
  return buildLiveVisitProfile({
    side: 'opponent',
    name: `Rank ${opponentRank} Opponent`,
    sourceKind: 'rankBased',
    attributes: buildRankBasedLiveVisitAttributes(opponentRank, opponentStrength, opponentArchetype, sourceRankBand),
    confidence,
    fatigue,
    equipmentBonus,
    sourceRankBand,
  }).visitProfile
}

function getLiveMatchCoachPrompt(
  liveMatch: Pick<LiveMatchState, 'playerFrames' | 'opponentFrames' | 'pressureValue' | 'playerFatigue' | 'opponentApproach' | 'tacticalPlan' | 'mentalFocus' | 'tempo'>,
  coachName?: string | null,
): LiveMatchCoachPrompt {
  const prefix = coachName ? `${coachName} says` : 'Coach note'

  if (liveMatch.pressureValue >= 72 || liveMatch.playerFatigue >= 68) {
    return {
      title: 'Settle The Table',
      note: `${prefix} slow the pace, tighten the safety exchange, and make the opponent earn first chances.`,
      recommendedPlan: 'Safety',
      recommendedMentalFocus: 'Composed',
      recommendedTempo: 'Steady',
    }
  }

  if (liveMatch.playerFrames < liveMatch.opponentFrames) {
    return {
      title: 'Change Momentum',
      note: `${prefix} lean into quick counter-punching before the opponent settles into a measured rhythm.`,
      recommendedPlan: 'Attack',
      recommendedMentalFocus: 'Counter',
      recommendedTempo: 'Quick',
    }
  }

  if (liveMatch.opponentApproach === 'Tight') {
    return {
      title: 'Keep The Heat On',
      note: `${prefix} stay positive and force the tight opponent to take on awkward openers.`,
      recommendedPlan: 'Attack',
      recommendedMentalFocus: 'Confident',
      recommendedTempo: 'Steady',
    }
  }

  return {
    title: 'Hold Shape',
    note: `${prefix} keep the frame tidy and deny easy counters with a balanced structure.`,
    recommendedPlan: 'Balanced',
    recommendedMentalFocus: 'Composed',
    recommendedTempo: 'Steady',
  }
}

function getLiveMatchOpponentApproach(liveMatch: Pick<LiveMatchState, 'playerFrames' | 'opponentFrames' | 'opponentConfidence' | 'opponentFatigue' | 'pressureValue' | 'opponentArchetype'>): LiveMatchOpponentApproach {
  if (liveMatch.opponentFatigue >= 68) {
    return 'Tight'
  }

  if (liveMatch.opponentFrames < liveMatch.playerFrames && liveMatch.opponentConfidence >= 56) {
    return liveMatch.opponentArchetype === 'Tactical Grinder' ? 'Measured' : 'Pressing'
  }

  if (liveMatch.pressureValue >= 78) {
    return liveMatch.opponentArchetype === 'Serial Scorer' ? 'Measured' : 'Tight'
  }

  if (liveMatch.opponentArchetype === 'Serial Scorer') return 'Pressing'
  if (liveMatch.opponentArchetype === 'Tactical Grinder') return 'Tight'
  if (liveMatch.opponentArchetype === 'Tempo Disruptor') return liveMatch.opponentConfidence >= 64 ? 'Measured' : 'Tight'
  return 'Measured'
}

function getTacticalMatchupEdge(plan: LiveMatchTacticalPlan, opponentApproach: LiveMatchOpponentApproach) {
  if ((plan === 'Safety' && opponentApproach === 'Pressing') || (plan === 'Attack' && opponentApproach === 'Tight') || (plan === 'Balanced' && opponentApproach === 'Measured')) {
    return 4
  }
  if ((plan === 'Attack' && opponentApproach === 'Measured') || (plan === 'Safety' && opponentApproach === 'Tight')) {
    return 1
  }
  return -3
}

function getSyntheticTacticalStyleEdge(playerPlan: LiveMatchTacticalPlan, opponentPlan: LiveMatchTacticalPlan) {
  if (playerPlan === opponentPlan) {
    return 0
  }

  if ((playerPlan === 'Safety' && opponentPlan === 'Attack') || (playerPlan === 'Attack' && opponentPlan === 'Balanced') || (playerPlan === 'Balanced' && opponentPlan === 'Safety')) {
    return 1.4
  }

  return -1.4
}

function buildOpponentAdjustmentEvent(params: {
  previousApproach: LiveMatchOpponentApproach
  nextApproach: LiveMatchOpponentApproach
  frameLabel: string
  nextPlayerFrames: number
  nextOpponentFrames: number
  pressureValue: number
  trigger?: 'Frame Swing' | 'Timeout' | 'Pressure'
}) {
  const { previousApproach, nextApproach, frameLabel, nextPlayerFrames, nextOpponentFrames, pressureValue } = params
  const trigger = params.trigger
    ?? (pressureValue >= 78 ? 'Pressure' : 'Frame Swing')

  if (previousApproach === nextApproach && trigger !== 'Timeout') {
    return null
  }

  const note = trigger === 'Timeout'
    ? `The opponent reset after the stoppage and shifted from ${previousApproach.toLowerCase()} to ${nextApproach.toLowerCase()}.`
    : trigger === 'Pressure'
      ? `Under heavy scoreboard pressure, the opponent moved from ${previousApproach.toLowerCase()} to ${nextApproach.toLowerCase()}.`
      : nextOpponentFrames > nextPlayerFrames
        ? `With the lead in hand, the opponent changed from ${previousApproach.toLowerCase()} to ${nextApproach.toLowerCase()}.`
        : `After the swing in score, the opponent changed from ${previousApproach.toLowerCase()} to ${nextApproach.toLowerCase()}.`

  return {
    title: `${nextApproach} adjustment`,
    note,
    trigger,
    fromApproach: previousApproach,
    toApproach: nextApproach,
    frameLabel,
  } satisfies LiveMatchOpponentAdjustment
}

function getBracketFieldSize(round: TournamentRound) {
  return 2 ** (TOURNAMENT_ROUNDS.length - TOURNAMENT_ROUNDS.indexOf(round))
}

function getBracketSeedOrder(fieldSize: number): number[] {
  if (fieldSize <= 2) return [1, 2]
  const previousOrder = getBracketSeedOrder(fieldSize / 2)
  return previousOrder.flatMap((seed) => [seed, fieldSize + 1 - seed])
}

function createBracketPlayer(name: string, rank: number, nation: string, highlighted = false): BracketPlayer {
  return {
    name,
    rank,
    nation,
    highlighted,
  }
}

function createEmptyBracketPlayer(): BracketPlayer {
  return createBracketPlayer('TBD', 0, '')
}

function cloneBracketRounds(rounds: BracketRound[]): BracketRound[] {
  return rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => ({
      ...match,
      top: { ...match.top },
      bottom: { ...match.bottom },
    })),
  }))
}

function findPlayerBracketMatch(rounds: BracketRound[], roundLabel: TournamentRound, playerName: string) {
  const round = rounds.find((item) => item.label === roundLabel)
  if (!round) return null
  return round.matches.find((match) => match.top.name === playerName || match.bottom.name === playerName) ?? null
}

function getBracketMatchWinner(match: BracketRound['matches'][number]): BracketPlayer | null {
  if (typeof match.top.score !== 'number' || typeof match.bottom.score !== 'number') {
    return null
  }

  return match.top.score > match.bottom.score ? { ...match.top, score: undefined } : { ...match.bottom, score: undefined }
}

function createFallbackBracketEntrant(seed: number, tournament: Tournament): BracketPlayer {
  return createBracketPlayer(`Qualifier ${seed}`, 160 + seed, tournament.location)
}

function buildTournamentDrawField(state: GameState, tournament: Tournament, fieldSize: number): BracketPlayer[] {
  const rankingRows = getCompetitionRowsForTournament(state, tournament)
  const playerRow = rankingRows.find((row) => row.playerName === state.player.fullName)
  const playerRank = playerRow?.ranking ?? state.player.amateurRanking ?? state.player.worldRanking ?? rankingRows.length + 1
  const playerEntry = createBracketPlayer(state.player.fullName, playerRank, state.player.nationality, true)
  const opponentEntries = rankingRows
    .filter((row) => row.playerName !== state.player.fullName)
    .sort((left, right) => left.ranking - right.ranking)
    .map((row) => createBracketPlayer(row.playerName, row.ranking, row.nation))

  let field = [playerEntry, ...opponentEntries].sort((left, right) => left.rank - right.rank).slice(0, fieldSize)

  if (!field.some((entry) => entry.name === state.player.fullName)) {
    field = [...field.slice(0, fieldSize - 1), playerEntry].sort((left, right) => left.rank - right.rank)
  }

  while (field.length < fieldSize) {
    field.push(createFallbackBracketEntrant(field.length + 1, tournament))
  }

  return field
}

function buildTournamentDraw(state: GameState, tournament: Tournament, entryRound: TournamentRound): BracketRound[] {
  const startIndex = TOURNAMENT_ROUNDS.indexOf(entryRound)
  const roundLabels = TOURNAMENT_ROUNDS.slice(startIndex)
  const fieldSize = getBracketFieldSize(entryRound)
  const seededField = getBracketSeedOrder(fieldSize).map((seed) => buildTournamentDrawField(state, tournament, fieldSize)[seed - 1])

  return roundLabels.map((roundLabel, roundIndex) => {
    const matchCount = getBracketFieldSize(roundLabel) / 2
    return {
      label: roundLabel,
      matches: Array.from({ length: matchCount }, (_, matchIndex) => {
        if (roundIndex === 0) {
          const top = seededField[matchIndex * 2] ?? createFallbackBracketEntrant(matchIndex * 2 + 1, tournament)
          const bottom = seededField[matchIndex * 2 + 1] ?? createFallbackBracketEntrant(matchIndex * 2 + 2, tournament)
          return {
            id: `${tournament.id}-${roundLabel}-${matchIndex + 1}`,
            top,
            bottom,
            placeholder: false,
          }
        }

        return {
          id: `${tournament.id}-${roundLabel}-${matchIndex + 1}`,
          top: createEmptyBracketPlayer(),
          bottom: createEmptyBracketPlayer(),
          placeholder: true,
        }
      }),
    }
  })
}

function simulateBracketScore(tournament: Tournament, round: TournamentRound, topRank: number, bottomRank: number) {
  const bestOf = getTournamentRoundPlan(tournament, round).bestOf
  const framesNeeded = Math.ceil(bestOf / 2)
  const topWinChance = clamp(50 + (bottomRank - topRank) * 1.2, 18, 82)
  const topWon = Math.random() * 100 < topWinChance
  const loserFrames = clamp(
    Math.round(Math.random() * Math.max(0, framesNeeded - 1) + Math.max(0, 4 - Math.abs(bottomRank - topRank) / 12)),
    0,
    framesNeeded - 1,
  )

  return topWon
    ? { topScore: framesNeeded, bottomScore: loserFrames }
    : { topScore: loserFrames, bottomScore: framesNeeded }
}

function resolveTournamentDrawRound(rounds: BracketRound[], tournament: Tournament, roundLabel: TournamentRound, playerName: string) {
  const roundIndex = rounds.findIndex((round) => round.label === roundLabel)
  if (roundIndex === -1) return rounds

  const round = rounds[roundIndex]
  const resolvedMatches = round.matches.map((match) => {
    if (typeof match.top.score === 'number' && typeof match.bottom.score === 'number') {
      return { ...match, placeholder: false }
    }
    if (match.placeholder || match.top.name === 'TBD' || match.bottom.name === 'TBD') {
      return match
    }
    if (match.top.name === playerName || match.bottom.name === playerName) {
      return match
    }

    const result = simulateBracketScore(tournament, roundLabel, match.top.rank, match.bottom.rank)
    return {
      ...match,
      top: { ...match.top, score: result.topScore },
      bottom: { ...match.bottom, score: result.bottomScore },
      placeholder: false,
    }
  })

  rounds[roundIndex] = {
    ...round,
    matches: resolvedMatches,
  }

  const nextRound = rounds[roundIndex + 1]
  if (!nextRound) return rounds

  rounds[roundIndex + 1] = {
    ...nextRound,
    matches: nextRound.matches.map((match, matchIndex) => {
      const topWinner = getBracketMatchWinner(resolvedMatches[matchIndex * 2])
      const bottomWinner = getBracketMatchWinner(resolvedMatches[matchIndex * 2 + 1])
      return {
        ...match,
        top: topWinner ?? createEmptyBracketPlayer(),
        bottom: bottomWinner ?? createEmptyBracketPlayer(),
        placeholder: !(topWinner && bottomWinner),
      }
    }),
  }

  return rounds
}

function applyCompletedMatchToTournamentDraw(
  rounds: BracketRound[],
  tournament: Tournament,
  roundLabel: TournamentRound,
  playerName: string,
  playerFrames: number,
  opponentFrames: number,
) {
  const nextRounds = cloneBracketRounds(rounds)
  const roundIndex = nextRounds.findIndex((round) => round.label === roundLabel)
  if (roundIndex === -1) return nextRounds

  const matchIndex = nextRounds[roundIndex].matches.findIndex((match) => match.top.name === playerName || match.bottom.name === playerName)
  if (matchIndex === -1) return nextRounds

  const match = nextRounds[roundIndex].matches[matchIndex]
  const playerIsTop = match.top.name === playerName
  nextRounds[roundIndex].matches[matchIndex] = {
    ...match,
    top: { ...match.top, score: playerIsTop ? playerFrames : opponentFrames },
    bottom: { ...match.bottom, score: playerIsTop ? opponentFrames : playerFrames },
    placeholder: false,
  }

  return resolveTournamentDrawRound(nextRounds, tournament, roundLabel, playerName)
}

function createEmptyTravelState(): TravelState {
  return {
    bookings: {},
  }
}

function createEmptyHistory(): CareerHistoryState {
  return {
    snapshots: [],
    matchLog: [],
    tournamentHistory: [],
    seasonRecords: [],
  }
}

function getNationCode(nation: string) {
  return nation.slice(0, 3).toUpperCase()
}

function rerankCompetitionRows(rows: CompetitionTableRow[], playerName: string) {
  const sorted = [...rows].sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points
    if (right.prizeMoney !== left.prizeMoney) return right.prizeMoney - left.prizeMoney
    if (right.titles !== left.titles) return right.titles - left.titles
    if (right.wins !== left.wins) return right.wins - left.wins
    if (left.losses !== right.losses) return left.losses - right.losses
    return left.playerName.localeCompare(right.playerName)
  })

  return sorted.map((row, index) => ({
    ...row,
    movement: row.ranking - (index + 1),
    ranking: index + 1,
    highlighted: row.playerName === playerName,
  }))
}

function ensurePlayerSeedRow(rows: RankingRow[], player: Player): RankingRow[] {
  if (rows.some((row) => row.playerName === player.fullName)) return rows.map((row) => ({ ...row, highlighted: row.playerName === player.fullName }))

  return [
    ...rows,
    {
      id: `rank-player-${player.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      playerName: player.fullName,
      nation: getNationCode(player.nationality),
      ranking: rows.length + 1,
      movement: 0,
      points: Math.max(0, player.worldRanking != null ? 480 : (player.amateurRanking != null ? Math.max(120, 720 - player.amateurRanking * 18) : 200)),
      prizeMoney: Math.max(0, player.cash),
      highlighted: true,
    },
  ]
}

function createCompetitionRowsFromBase(baseRows: RankingRow[], player: Player, pointsMultiplier: number, prizeMultiplier: number, eventBase: number): CompetitionTableRow[] {
  return rerankCompetitionRows(
    ensurePlayerSeedRow(baseRows, player).map((row) => {
      const eventsPlayed = Math.max(0, eventBase + Math.max(0, 8 - row.ranking))
      const wins = Math.max(0, Math.min(eventsPlayed, eventBase + Math.max(0, 6 - row.ranking)))
      const losses = Math.max(0, eventsPlayed - wins)
      const titles = row.ranking <= 4 ? 1 : 0

      return {
        ...row,
        points: Math.max(0, Math.round(row.points * pointsMultiplier)),
        prizeMoney: Math.max(0, Math.round(row.prizeMoney * prizeMultiplier)),
        eventsPlayed,
        wins,
        losses,
        titles,
      }
    }),
    player.fullName,
  )
}

const GENERATED_COMPETITOR_FIRST_NAMES = [
  'Adrian', 'Bartosz', 'Cedric', 'Dylan', 'Emil', 'Fraser', 'Gareth', 'Hamza', 'Ivan', 'Jasper', 'Kaito', 'Lennon', 'Mateo', 'Nathan', 'Oskar', 'Pavel',
  'Quentin', 'Rafael', 'Sebastian', 'Tariq', 'Ulrich', 'Viktor', 'Wesley', 'Xander', 'Yannick', 'Zane', 'Bailey', 'Connor', 'Dario', 'Euan', 'Freddie', 'Gianni',
  'Harris', 'Ilyas', 'Joel', 'Kieran', 'Lorenzo', 'Malik', 'Niall', 'Otis', 'Patrick', 'Reuben', 'Samir', 'Tobias', 'Vincent', 'Warren', 'Yusuf', 'Zac',
]

const GENERATED_COMPETITOR_LAST_NAMES = [
  'Ashford', 'Barker', 'Caldwell', 'Drayton', 'Easton', 'Forster', 'Grimaldi', 'Harrington', 'Iqbal', 'Janssen', 'Kovacs', 'Langford', 'Madsen', 'Novak', 'Olsen', 'Patel',
  'Quinnell', 'Rossi', 'Sinclair', 'Tanaka', 'Upton', 'Vos', 'Westbrook', 'Xu', 'Yilmaz', 'Zimmer', 'Ainsley', 'Bouchard', 'Costa', 'Davenport', 'El-Sayed', 'Fletcher',
  'Gallagher', 'Hayashi', 'Iversen', 'Kowalski', 'Lombardi', 'Mendoza', 'Nakamura', 'Otero', 'Petrov', 'Rahman', 'Sorensen', 'Tremblay', 'Urban', 'Verma', 'Whitaker', 'Yates',
]

const GENERATED_COMPETITOR_NATIONS = ['ENG', 'SCO', 'WAL', 'IRL', 'NIR', 'BEL', 'GER', 'NED', 'POL', 'AUS', 'THA', 'CHN', 'IND', 'PAK', 'CAN', 'BRA', 'JPN', 'NOR', 'SWE', 'ITA', 'ESP', 'FRA']

const COMPETITION_POOL_PROFILES: Record<Exclude<CompetitionTableKey, 'world' | 'oneYear'>, { count: number; pointsStart: number; pointsStep: number; prizeStart: number; prizeStep: number; eventBase: number; seedOffset: number }> = {
  amateur: { count: 96, pointsStart: 4600, pointsStep: 34, prizeStart: 92000, prizeStep: 640, eventBase: 7, seedOffset: 11 },
  qTour: { count: 72, pointsStart: 2800, pointsStep: 28, prizeStart: 48000, prizeStep: 420, eventBase: 6, seedOffset: 173 },
  qSchool: { count: 64, pointsStart: 1200, pointsStep: 15, prizeStart: 0, prizeStep: 0, eventBase: 4, seedOffset: 347 },
  senior: { count: 48, pointsStart: 2100, pointsStep: 24, prizeStart: 36000, prizeStep: 380, eventBase: 5, seedOffset: 521 },
  youth: { count: 64, pointsStart: 1800, pointsStep: 21, prizeStart: 12000, prizeStep: 120, eventBase: 6, seedOffset: 701 },
}

function createGeneratedRankingIdentity(seenNames: Set<string>, seed: number) {
  const maxAttempts = GENERATED_COMPETITOR_FIRST_NAMES.length * GENERATED_COMPETITOR_LAST_NAMES.length

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const value = seed + attempt
    const firstName = GENERATED_COMPETITOR_FIRST_NAMES[value % GENERATED_COMPETITOR_FIRST_NAMES.length]
    const lastName = GENERATED_COMPETITOR_LAST_NAMES[Math.floor(value / GENERATED_COMPETITOR_FIRST_NAMES.length) % GENERATED_COMPETITOR_LAST_NAMES.length]
    const playerName = `${firstName} ${lastName}`

    if (!seenNames.has(playerName)) {
      seenNames.add(playerName)
      return {
        playerName,
        nation: GENERATED_COMPETITOR_NATIONS[value % GENERATED_COMPETITOR_NATIONS.length],
      }
    }
  }

  const playerName = `Tour Player ${seed}`
  seenNames.add(playerName)
  return {
    playerName,
    nation: GENERATED_COMPETITOR_NATIONS[seed % GENERATED_COMPETITOR_NATIONS.length],
  }
}

function createCompetitionPoolRows(key: Exclude<CompetitionTableKey, 'world' | 'oneYear'>, seenNames: Set<string>, worldSeed = 0): RankingRow[] {
  const profile = COMPETITION_POOL_PROFILES[key]

  return Array.from({ length: profile.count }, (_, index) => {
    const seed = worldSeed + profile.seedOffset + index * 7
    const identity = createGeneratedRankingIdentity(seenNames, seed)
    const ranking = index + 1
    const pointsOffset = getSeededSignedOffset(worldSeed, profile.seedOffset + index * 13, Math.max(3, Math.round(profile.pointsStart * 0.025)))
    const prizeOffset = getSeededSignedOffset(worldSeed, profile.seedOffset + index * 17, Math.max(0, Math.round(profile.prizeStart * 0.025)))

    return {
      id: `rank-${key}-${ranking}`,
      playerName: identity.playerName,
      nation: identity.nation,
      ranking,
      movement: getSeededSignedOffset(worldSeed, profile.seedOffset + index * 19, 3),
      points: Math.max(12, profile.pointsStart - index * profile.pointsStep + ((index % 5) * 3) + pointsOffset),
      prizeMoney: Math.max(0, profile.prizeStart - index * profile.prizeStep + prizeOffset),
      highlighted: false,
    }
  })
}

function buildCompetitionTables(baseRows: RankingRow[], player: Player, options?: { reservePlayerName?: boolean; worldSeed?: number }): CompetitionTablesState {
  const worldSeed = options?.worldSeed ?? 0
  const seededBaseRows = worldSeed > 0
    ? buildSeededWorldRankingRows(baseRows, player, worldSeed, options?.reservePlayerName)
    : baseRows
  const seenNames = new Set<string>([player.fullName])
  seededBaseRows.forEach((row) => {
    if (options?.reservePlayerName && row.playerName === player.fullName) return
    seenNames.add(row.playerName)
  })
  const competitionBaseRows = seededBaseRows.map((row) => {
    if (!options?.reservePlayerName || row.playerName !== player.fullName) return row

    const identity = createGeneratedRankingIdentity(seenNames, worldSeed + 997 + row.ranking * 13)
    return {
      ...row,
      id: `${row.id}-reserve`,
      playerName: identity.playerName,
      nation: identity.nation,
      highlighted: false,
    }
  })

  return {
    world: createCompetitionRowsFromBase(competitionBaseRows, player, 1, 1, 8),
    oneYear: createCompetitionRowsFromBase(competitionBaseRows, player, 0.46, 0.46, 6),
    amateur: createCompetitionRowsFromBase(createCompetitionPoolRows('amateur', seenNames, worldSeed), player, 1, 1, 7),
    qTour: createCompetitionRowsFromBase(createCompetitionPoolRows('qTour', seenNames, worldSeed), player, 1, 1, 6),
    qSchool: createCompetitionRowsFromBase(createCompetitionPoolRows('qSchool', seenNames, worldSeed), player, 1, 0, 4).map((row) => ({ ...row, prizeMoney: 0 })),
    senior: createCompetitionRowsFromBase(createCompetitionPoolRows('senior', seenNames, worldSeed), player, 1, 1, 5),
    youth: createCompetitionRowsFromBase(createCompetitionPoolRows('youth', seenNames, worldSeed), player, 1, 1, 6),
  }
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }

  return Math.abs(hash)
}

function createWorldSeed() {
  return Math.floor(Math.random() * 2_147_483_647)
}

function seededNoise(seed: number, salt: number) {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function getSeededSignedOffset(seed: number, salt: number, range: number) {
  return Math.round((seededNoise(seed, salt) * 2 - 1) * range)
}

function buildSeededWorldRankingRows(baseRows: RankingRow[], player: Player, worldSeed: number, reservePlayerName = false): RankingRow[] {
  const seenNames = new Set<string>([player.fullName])

  return baseRows.map((row) => {
    const preservePlayer = row.playerName === player.fullName && !reservePlayerName
    const identity = preservePlayer
      ? { playerName: player.fullName, nation: getNationCode(player.nationality) }
      : createGeneratedRankingIdentity(seenNames, worldSeed + row.ranking * 31)
    const pointsOffset = getSeededSignedOffset(worldSeed, row.ranking * 17, Math.max(24, Math.round(row.points * 0.08)))
    const prizeOffset = getSeededSignedOffset(worldSeed, row.ranking * 19, Math.max(1500, Math.round(row.prizeMoney * 0.08)))

    return {
      ...row,
      id: preservePlayer ? row.id : `rank-world-${worldSeed}-${row.ranking}`,
      playerName: identity.playerName,
      nation: identity.nation,
      movement: getSeededSignedOffset(worldSeed, row.ranking * 23, 4),
      points: Math.max(160, row.points + pointsOffset),
      prizeMoney: Math.max(12000, row.prizeMoney + prizeOffset),
      highlighted: preservePlayer,
    }
  })
}

function getCompetitionRowForPlayer(tables: CompetitionTablesState, key: CompetitionTableKey, playerName: string) {
  return tables[key].find((row) => row.playerName === playerName)
}

function getAllCompetitionPlayerNames(tables: CompetitionTablesState) {
  return COMPETITION_TABLE_KEYS.flatMap((key) => tables[key].map((row) => row.playerName)).filter(Boolean)
}

function inferWorldPlayerAge(playerName: string, tables: CompetitionTablesState, player?: Player) {
  if (player && playerName === player.fullName) return player.age

  const worldRank = getCompetitionRowForPlayer(tables, 'world', playerName)?.ranking ?? 999
  const seed = hashString(playerName)

  if (seed % 11 === 0) return 40 + (seed % 15)
  if (worldRank <= 16) return 25 + (seed % 10)
  if (worldRank <= 64) return 21 + (seed % 13)
  if (seed % 5 === 0) return 14 + (seed % 8)
  if (seed % 3 === 0) return 18 + (seed % 10)

  return 20 + (seed % 12)
}

function normalizeWorldPlayerRecord(record: WorldPlayerRecord, tables: CompetitionTablesState, player?: Player): WorldPlayerRecord {
  const worldRank = getCompetitionRowForPlayer(tables, 'world', record.playerName)?.ranking ?? record.highestWorldRank ?? 999
  const defaultHasTourCard = worldRank <= MAIN_TOUR_POOL_SIZE

  return {
    ...record,
    age: typeof record.age === 'number' ? record.age : inferWorldPlayerAge(record.playerName, tables, player),
    hasTourCard: typeof record.hasTourCard === 'boolean' ? record.hasTourCard : defaultHasTourCard,
    cardSource: record.cardSource ?? (worldRank <= TOP_64_RANK_CUTOFF ? 'Ranking Retained' : defaultHasTourCard ? 'Seeded Main Tour' : null),
    currentYear: typeof record.currentYear === 'number' ? record.currentYear : 0,
    yearsRemaining: typeof record.yearsRemaining === 'number' ? record.yearsRemaining : 0,
    expiresAfterSeason: record.expiresAfterSeason ?? null,
    retainedViaRanking: typeof record.retainedViaRanking === 'boolean' ? record.retainedViaRanking : worldRank <= TOP_64_RANK_CUTOFF,
    tourSurvivalStatus: record.tourSurvivalStatus ?? (worldRank <= TOP_16_RANK_CUTOFF ? 'Top 16' : worldRank <= TOP_32_RANK_CUTOFF ? 'Top 32' : worldRank <= TOP_64_RANK_CUTOFF ? 'Safe' : defaultHasTourCard ? 'At Risk' : 'Amateur'),
  }
}

function normalizeWorldPlayers(players: WorldPlayerRecord[], tables: CompetitionTablesState, player?: Player) {
  return players.map((record) => normalizeWorldPlayerRecord(record, tables, player))
}

function buildWorldPlayersFromTables(tables: CompetitionTablesState, player?: Player): WorldPlayerRecord[] {
  const seen = new Map<string, WorldPlayerRecord>()

  getAllCompetitionPlayerNames(tables).forEach((playerName) => {
    if (!playerName || seen.has(playerName)) {
      return
    }

    const worldRow = getCompetitionRowForPlayer(tables, 'world', playerName)
    const oneYearRow = getCompetitionRowForPlayer(tables, 'oneYear', playerName)
    const amateurRow = getCompetitionRowForPlayer(tables, 'amateur', playerName)
    const qTourRow = getCompetitionRowForPlayer(tables, 'qTour', playerName)
    const qSchoolRow = getCompetitionRowForPlayer(tables, 'qSchool', playerName)
    const seniorRow = getCompetitionRowForPlayer(tables, 'senior', playerName)
    const youthRow = getCompetitionRowForPlayer(tables, 'youth', playerName)
    const nation = worldRow?.nation ?? amateurRow?.nation ?? qTourRow?.nation ?? qSchoolRow?.nation ?? seniorRow?.nation ?? youthRow?.nation ?? getNationCode(player?.nationality ?? 'International')
    const totalMatches = (oneYearRow?.eventsPlayed ?? worldRow?.eventsPlayed ?? 0) + (amateurRow?.eventsPlayed ?? 0) + (qTourRow?.eventsPlayed ?? 0) + (qSchoolRow?.eventsPlayed ?? 0) + (seniorRow?.eventsPlayed ?? 0) + (youthRow?.eventsPlayed ?? 0)
    const wins = (oneYearRow?.wins ?? worldRow?.wins ?? 0) + (amateurRow?.wins ?? 0) + (qTourRow?.wins ?? 0) + (qSchoolRow?.wins ?? 0) + (seniorRow?.wins ?? 0) + (youthRow?.wins ?? 0)
    const losses = (oneYearRow?.losses ?? worldRow?.losses ?? 0) + (amateurRow?.losses ?? 0) + (qTourRow?.losses ?? 0) + (qSchoolRow?.losses ?? 0) + (seniorRow?.losses ?? 0) + (youthRow?.losses ?? 0)

    seen.set(playerName, normalizeWorldPlayerRecord({
      id: `wp-${playerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      playerName,
      nation,
      age: inferWorldPlayerAge(playerName, tables, player),
      hasTourCard: (worldRow?.ranking ?? 999) <= MAIN_TOUR_POOL_SIZE,
      cardSource: (worldRow?.ranking ?? 999) <= TOP_64_RANK_CUTOFF ? 'Ranking Retained' : (worldRow?.ranking ?? 999) <= MAIN_TOUR_POOL_SIZE ? 'Seeded Main Tour' : null,
      currentYear: 0,
      yearsRemaining: 0,
      expiresAfterSeason: null,
      retainedViaRanking: (worldRow?.ranking ?? 999) <= TOP_64_RANK_CUTOFF,
      tourSurvivalStatus: (worldRow?.ranking ?? 999) <= TOP_16_RANK_CUTOFF ? 'Top 16' : (worldRow?.ranking ?? 999) <= TOP_32_RANK_CUTOFF ? 'Top 32' : (worldRow?.ranking ?? 999) <= TOP_64_RANK_CUTOFF ? 'Safe' : (worldRow?.ranking ?? 999) <= MAIN_TOUR_POOL_SIZE ? 'At Risk' : 'Amateur',
      totalMatches,
      wins,
      losses,
      totalPrizeMoney: oneYearRow?.prizeMoney ?? worldRow?.prizeMoney ?? 0,
      titles: (oneYearRow?.titles ?? 0) + (amateurRow?.titles ?? 0) + (qTourRow?.titles ?? 0) + (qSchoolRow?.titles ?? 0) + (seniorRow?.titles ?? 0) + (youthRow?.titles ?? 0),
      majorTitles: 0,
      qTourWins: qTourRow?.titles ?? 0,
      seniorTitles: seniorRow?.titles ?? 0,
      highestBreak: 0,
      highestWorldRank: worldRow?.ranking ?? null,
      seasons: [],
    }, tables, player))
  })

  return Array.from(seen.values())
}

function createEmptyCareerSystems(): CareerSystemsState {
  return {
    qTour: {
      playerRank: null,
      playerPoints: 0,
      leader: null,
      top16Bonus: false,
      top32Bonus: false,
      top16Streak: 0,
      top8Streak: 0,
      top2Streak: 0,
      eligibilityScore: 0,
      directCardAwarded: false,
      playOffEligible: false,
      playOffWinner: null,
    },
    qSchool: {
      playerRank: null,
      playerPoints: 0,
      leader: null,
      campaignsEntered: 0,
      eventWins: 0,
      repeatedFailures: 0,
      eligibilityScore: 0,
      campaignEligible: false,
      seededCampaign: false,
      directPlayoffEligible: false,
      eligibilitySeasonsRemaining: 0,
      cooldownSeasonsRemaining: 0,
      qualifiedBy: null,
      topUpEligible: false,
      slumpRisk: false,
    },
    pro: {
      hasTourCard: false,
      cardSource: null,
      currentYear: 0,
      yearsRemaining: 0,
      expiresAfterSeason: null,
      retainedViaRanking: false,
      awardedBy: null,
      survivalStatus: 'Amateur',
      tourSurvivalStatus: 'Amateur',
      currentTier: 'Amateur',
      worldRank: null,
      oneYearRank: null,
    },
    lateCareer: {
      veteranActive: false,
      seniorEligible: false,
      seniorActive: false,
      legendStatus: false,
      retired: false,
    },
  }
}

function createCareerSystemsForStartingLevel(level: NewCareerStartingLevel): CareerSystemsState {
  const systems = createEmptyCareerSystems()

  if (level.competitionTable === 'qSchool') {
    return {
      ...systems,
      qSchool: {
        ...systems.qSchool,
        campaignsEntered: 1,
        eligibilityScore: Math.max(80, level.targetPoints),
        campaignEligible: true,
        seededCampaign: true,
        eligibilitySeasonsRemaining: 1,
        qualifiedBy: 'New career Q School start',
      },
    }
  }

  if (level.competitionTable !== 'world') {
    return systems
  }

  const retainedViaRanking = level.targetRanking <= TOP_64_RANK_CUTOFF
  const rookieCard = !retainedViaRanking

  return {
    ...systems,
    pro: {
      ...systems.pro,
      hasTourCard: true,
      cardSource: retainedViaRanking ? 'Ranking Retained' : 'Seeded Main Tour',
      currentYear: rookieCard ? 1 : 0,
      yearsRemaining: rookieCard ? 2 : 0,
      expiresAfterSeason: rookieCard ? '2027/28' : null,
      retainedViaRanking,
      awardedBy: 'New career professional start',
      survivalStatus: level.targetRanking <= TOP_16_RANK_CUTOFF
        ? 'Top 16'
        : level.targetRanking <= TOP_32_RANK_CUTOFF
          ? 'Top 32'
          : level.targetRanking <= TOP_64_RANK_CUTOFF
            ? 'Safe'
            : level.targetRanking <= 96
              ? 'Bubble'
              : 'At Risk',
      tourSurvivalStatus: level.targetRanking <= TOP_16_RANK_CUTOFF
        ? 'Top 16'
        : level.targetRanking <= TOP_32_RANK_CUTOFF
          ? 'Top 32'
          : level.targetRanking <= TOP_64_RANK_CUTOFF
            ? 'Safe'
            : level.targetRanking <= 96
              ? 'Bubble'
              : 'At Risk',
      currentTier: level.careerStage,
      worldRank: level.targetRanking,
      oneYearRank: level.targetRanking,
    },
  }
}

function getCompetitionKeysForTournament(tournament: Tournament): CompetitionTableKey[] {
  if (tournament.type === 'Amateur') {
    if (getAmateurRouteAgeLimit(tournament) != null) {
      return ['youth', 'amateur', 'qTour', 'qSchool']
    }

    if (isDirectAmateurTourCardRoute(tournament)) {
      return ['amateur', 'qTour', 'qSchool', 'youth']
    }
  }

  switch (tournament.rankingType) {
    case 'World Ranking':
      return ['world', 'oneYear']
    case 'One-Year':
      return ['oneYear']
    case 'Q Tour':
      return ['qTour']
    case 'Q School OOM':
      return ['qSchool']
    case 'Amateur':
      return ['amateur']
    case 'Youth':
      return ['youth']
    case 'Senior':
      return ['senior']
    default:
      if (tournament.type === 'Q Tour') return ['qTour']
      if (tournament.type === 'Q School') return ['qSchool']
      if (tournament.type === 'Senior') return ['senior']
      if (tournament.type === 'Amateur') return ['amateur']
      if (tournament.type === 'Junior' || tournament.type === 'Regional Youth' || tournament.type === 'National Youth') return ['youth']
      if (tournament.type === 'Invitational') return ['world']
      if (tournament.type === 'Professional Tour' || tournament.type === 'Ranking' || tournament.type === 'Major') return ['world', 'oneYear']
      return []
  }
}

function formatSeasonLabel(startYear: number) {
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`
}

function getSeasonStartYearForDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  const year = date.getUTCFullYear()

  return date.getUTCMonth() >= 6 ? year : year - 1
}

function getSeasonLabelForDate(dateString: string) {
  return formatSeasonLabel(getSeasonStartYearForDate(dateString))
}

function getTournamentSeasonStartYear(tournaments: Tournament[]) {
  const anchorDate = tournaments
    .map((tournament) => tournament.startDate)
    .sort()[0]

  return anchorDate ? getSeasonStartYearForDate(anchorDate) : getSeasonStartYearForDate(new Date().toISOString().slice(0, 10))
}

function getSeasonLabelForTournaments(tournaments: Tournament[]) {
  return formatSeasonLabel(getTournamentSeasonStartYear(tournaments))
}

function getNextSeasonStartDate(tournaments: Tournament[]) {
  return `${getTournamentSeasonStartYear(tournaments) + 1}-07-01`
}

function addYears(dateString: string, years: number) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setUTCFullYear(date.getUTCFullYear() + years)
  return date.toISOString().slice(0, 10)
}

function normalizeTournamentStatusForSeason(_status: Tournament['status']) {
  return 'Available'
}

function buildTournamentScheduleForSeason(seasonStartYear: number): Tournament[] {
  return tournamentCatalog.map((tournament) => {
    const yearOffset = seasonStartYear - getSeasonStartYearForDate(tournament.startDate)
    return {
      ...tournament,
      startDate: addYears(tournament.startDate, yearOffset),
      endDate: tournament.endDate ? addYears(tournament.endDate, yearOffset) : undefined,
      status: normalizeTournamentStatusForSeason(tournament.status) as Tournament['status'],
    }
  })
}

function applySeasonOpenWorldChampionshipAccess(
  tournaments: Tournament[],
  state: Pick<GameState, 'player' | 'careerSystems' | 'competitionTables' | 'history'>,
  options?: {
    seasonOpenWorldRankOverride?: number | null
  },
): Tournament[] {
  const worldChampionshipMainDraw = tournaments.find((tournament) => isWorldChampionshipMainDrawTournament(tournament))
  if (!worldChampionshipMainDraw) {
    return tournaments
  }

  const seasonOpenWorldRank = options?.seasonOpenWorldRankOverride
    ?? state.careerSystems.pro.worldRank
    ?? state.competitionTables.world.find((row) => row.playerName === state.player.fullName)?.ranking
    ?? state.player.worldRanking
    ?? 999
  const seasonOpenStatus = `${state.player.competitiveStatus ?? state.player.careerStage}`.toLowerCase()
  const seasonOpenTier = `${state.careerSystems.pro.currentTier ?? ''}`.toLowerCase()
  const seasonOpenSurvival = `${state.careerSystems.pro.tourSurvivalStatus ?? ''}`.toLowerCase()
  const hasSeasonOpenMainTourStatus = state.careerSystems.pro.hasTourCard && seasonOpenWorldRank <= MAIN_TOUR_POOL_SIZE
  const mainDrawLocked = hasSeasonOpenMainTourStatus && (
    seasonOpenWorldRank <= TOP_16_RANK_CUTOFF
    || /top 16|major contender|world champion/.test(seasonOpenStatus)
    || /top 16/.test(seasonOpenTier)
    || /top 16/.test(seasonOpenSurvival)
  )
  const lockedRoute: Tournament['seasonOpenAccessLock'] = mainDrawLocked ? 'worldMainDraw' : 'worldQualifying'

  return tournaments.map((tournament) => {
    if (isWorldChampionshipMainDrawTournament(tournament)) {
      return {
        ...tournament,
        seasonOpenAccessLock: lockedRoute,
        status: (mainDrawLocked ? 'Booked' : 'Available') as Tournament['status'],
      }
    }

    if (isWorldChampionshipQualifierTournament(tournament)) {
      return {
        ...tournament,
        seasonOpenAccessLock: lockedRoute,
        status: (mainDrawLocked ? 'Skipped' : tournament.status) as Tournament['status'],
      }
    }

    return tournament
  })
}

function getTournamentHistoryId(season: string, tournamentId: string) {
  return `${season}-${tournamentId}`
}

function buildTournamentHistoryCanonicalResult(
  tournament: Tournament,
  resultLabel: string,
  prizeMoney: number,
  rankingPoints: number,
  playedRounds?: string[],
) {
  const rankingTitleEligible = isProfessionalEventType(tournament.eventClass ?? tournament.type)
    && !/qualifying/i.test(tournament.name)
    && tournament.type !== 'Q School'
  const majorTitleEligible = isMajorCareerEvent({ eventType: tournament.eventClass ?? tournament.type, tournamentName: tournament.name })
    && !/qualifying/i.test(tournament.name)
  const worldTitleEligible = isWorldChampionshipMainDrawName(tournament.name)

  return buildCanonicalTournamentResult(
    {
      name: tournament.name,
      type: tournament.type,
      eventClass: tournament.eventClass,
      rankingType: tournament.rankingType,
      stageId: tournament.stageId,
      formatId: tournament.formatId,
    },
    {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      resultLabel,
      prizeMoney,
      rankingPoints,
      playedRounds,
      isRankingTitle: rankingTitleEligible,
      isMajorTitle: majorTitleEligible,
      isWorldTitle: worldTitleEligible,
    },
  )
}

function createTournamentHistoryEntry(tournament: Tournament, season: string): TournamentHistoryEntry {
  const potentialTourCardReward = tournament.type === 'Q School'
    || tournament.name.toLowerCase().includes('play-off')
    || /tour card|wst card|professional tour card/i.test(tournament.reward ?? '')
  const reward = potentialTourCardReward ? undefined : tournament.reward

  return {
    id: getTournamentHistoryId(season, tournament.id),
    season,
    tournamentId: tournament.id,
    formatId: tournament.formatId ?? null,
    tournamentName: tournament.name,
    eventType: tournament.eventClass ?? tournament.type,
    stageId: tournament.stageId ?? null,
    tourCircuit: tournament.tourCircuit ?? tournament.name,
    location: tournament.location,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    status: tournament.status === 'Entered' ? 'Entered' : tournament.status === 'Booked' ? 'Booked' : tournament.status === 'Skipped' ? 'Skipped' : tournament.status === 'High Cost' ? 'High Cost' : 'Entered',
    result: tournament.status === 'Skipped' ? 'Skipped' : tournament.status === 'High Cost' ? 'High-cost event not entered' : 'Entered',
    rounds: [],
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    prizeMoney: 0,
    rankingPoints: 0,
    highestBreak: 0,
    centuries: 0,
    fatigueChange: 0,
    entryFee: tournament.entryFee,
    bookedTravelCost: 0,
    reward,
    progressionImpact: tournament.progressionImpact,
    canonicalResult: buildTournamentHistoryCanonicalResult(tournament, tournament.status === 'Skipped' ? 'Skipped' : tournament.status === 'High Cost' ? 'High-cost event not entered' : 'Entered', 0, 0),
  }
}

function synchronizeTournamentHistoryEntry(
  tournament: Tournament,
  entry: TournamentHistoryEntry,
) {
  const canonicalResult = buildTournamentHistoryCanonicalResult(
    tournament,
    entry.result,
    entry.prizeMoney,
    entry.rankingPoints,
    entry.rounds,
  )

  return {
    ...entry,
    canonicalResult,
    matchesPlayed: canonicalResult.matchesPlayed,
    wins: canonicalResult.wins,
    losses: canonicalResult.losses,
    prizeMoney: canonicalResult.prizeMoney,
    rankingPoints: canonicalResult.rankingPoints,
  }
}

function getTournamentHistoryCanonicalResult(entry: TournamentHistoryEntry) {
  if (entry.canonicalResult) {
    return entry.canonicalResult
  }

  const catalogTournament = tournamentCatalog.find((tournament) => tournament.id === entry.tournamentId)
  if (catalogTournament) {
    return buildTournamentHistoryCanonicalResult(catalogTournament, entry.result, entry.prizeMoney, entry.rankingPoints)
  }

  const roundReached = getTournamentHistoryRoundReached(entry) ?? entry.result
  const finishFlags = getCanonicalFinishFlags(roundReached, entry.result)

  return {
    tournamentId: entry.tournamentId,
    tournamentName: entry.tournamentName,
    fieldSize: null,
    roundReached,
    resultLabel: entry.result,
    matchesPlayed: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.matchesPlayed,
    wins: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.wins,
    losses: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.losses,
    isTitle: finishFlags.isTitle,
    isFinal: finishFlags.isFinal,
    isSemiFinal: finishFlags.isSemiFinal,
    isQuarterFinal: finishFlags.isQuarterFinal,
    isDeepRun: finishFlags.isDeepRun,
    isRankingTitle: finishFlags.isTitle && isProfessionalEventType(entry.eventType),
    isMajorTitle: finishFlags.isTitle && isMajorCareerEvent(entry),
    isWorldTitle: finishFlags.isTitle && isWorldChampionshipMainDrawName(entry.tournamentName),
    prizeMoney: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.prizeMoney,
    rankingPoints: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.rankingPoints,
  }
}

function upsertTournamentHistoryEntry(entries: TournamentHistoryEntry[], entry: TournamentHistoryEntry) {
  const withoutExisting = entries.filter((item) => item.id !== entry.id)
  return [entry, ...withoutExisting].slice(0, TOURNAMENT_HISTORY_LIMIT)
}

function finalizeTournamentHistoryForSeason(entries: TournamentHistoryEntry[], tournaments: Tournament[], season: string) {
  return tournaments.reduce((nextEntries, tournament) => {
    if (tournament.status === 'Available') return nextEntries

    const existing = nextEntries.find((item) => item.id === getTournamentHistoryId(season, tournament.id))
    const baseEntry = existing ?? createTournamentHistoryEntry(tournament, season)
    const result = existing?.result
      ?? (tournament.status === 'Skipped'
        ? 'Skipped'
        : tournament.status === 'Booked'
          ? 'Completed'
          : tournament.status === 'Entered'
            ? 'Season ended before completion'
            : 'High-cost event not entered')

    return upsertTournamentHistoryEntry(nextEntries, synchronizeTournamentHistoryEntry(tournament, {
      ...baseEntry,
      status: tournament.status === 'Booked' ? 'Completed' : tournament.status === 'Entered' ? 'Completed' : baseEntry.status,
      result,
    }))
  }, entries)
}

function getBestSeasonResult(entries: TournamentHistoryEntry[]) {
  const bestTier = entries.reduce((best, entry) => Math.max(best, getTournamentHistoryFinishTier(entry)), 0)

  if (bestTier >= 5) return 'Winner'
  if (bestTier >= 4) return 'Finalist'
  if (bestTier >= 3) return 'Semi Final'
  if (bestTier >= 2) return 'Quarter Final'
  if (entries.some((entry) => getTournamentHistoryCanonicalResult(entry).matchesPlayed > 0)) return 'Match wins logged'
  return 'No deep run recorded'
}

function getQSchoolCampaignCount(entries: TournamentHistoryEntry[]) {
  return entries.some((entry) => entry.eventType === 'Q School') ? 1 : 0
}

function normalizeTournamentHistoryType(eventType: TournamentHistoryEntry['eventType']): Tournament['type'] {
  return eventType === 'Professional' ? 'Professional Tour' : (eventType ?? 'Amateur')
}

function normalizeTournamentHistoryEventClass(eventType: TournamentHistoryEntry['eventType']): Tournament['eventClass'] {
  if (eventType === 'Professional Tour' || eventType === 'Ranking') {
    return 'Professional'
  }

  return eventType ?? 'Amateur'
}

function getTournamentHistoryRoundReached(entry: Pick<TournamentHistoryEntry, 'tournamentId' | 'formatId' | 'tournamentName' | 'eventType' | 'stageId' | 'result'>) {
  const catalogTournament = tournamentCatalog.find((tournament) => tournament.id === entry.tournamentId)
  const expectation = getTournamentResultExpectation(
    {
      name: entry.tournamentName,
      type: catalogTournament?.type ?? normalizeTournamentHistoryType(entry.eventType ?? 'Amateur'),
      eventClass: catalogTournament?.eventClass ?? normalizeTournamentHistoryEventClass(entry.eventType),
      rankingType: catalogTournament?.rankingType,
      stageId: entry.stageId ?? catalogTournament?.stageId,
      formatId: entry.formatId ?? catalogTournament?.formatId ?? undefined,
    },
    entry.result,
  )

  return expectation?.roundReached ?? null
}

function getFinishTierFromRoundReached(roundReached: string | null | undefined, result: string) {
  if (/winner|champion/i.test(result)) return 5

  const normalizedRound = normalizeTournamentRoundLabel(roundReached ?? '')

  if (normalizedRound === 'final') return 4
  if (normalizedRound === 'semi final') return 3
  if (normalizedRound === 'quarter final') return 2
  if (normalizedRound === 'last 16') return 1

  if (/quarter/i.test(result)) return 2
  if (/semi/i.test(result)) return 3
  if (/(^|\s)final(ist)?(\s|$)/i.test(result)) return 4
  if (/last 16/i.test(result)) return 1

  return 0
}

function getTournamentHistoryFinishTier(entry: Pick<TournamentHistoryEntry, 'tournamentId' | 'formatId' | 'tournamentName' | 'eventType' | 'stageId' | 'result'>) {
  return getFinishTierFromRoundReached(getTournamentHistoryRoundReached(entry), entry.result)
}

function isProfessionalFinalLevelRun(entry: TournamentHistoryEntry) {
  return isProfessionalEventType(entry.eventType)
    && (
      getTournamentHistoryFinishTier(entry) >= 4
      || entry.result === 'Winner'
      || (entry.matchesPlayed >= 4 && entry.wins >= 3 && entry.losses >= 1)
    )
}

function isDeepRunResult(entry: TournamentHistoryEntry) {
  return getTournamentHistoryFinishTier(entry) >= 3
}

function calculateCurrentEffectiveStrength(state: Pick<GameState, 'attributes' | 'player' | 'equipment'>) {
  const technical = calculateTechnicalAverage(state.attributes.technical)
  const mental = calculateAverage(Object.values(state.attributes.mental))
  const physical = calculateAverage(Object.values(state.attributes.physical))

  return calculateMatchStrength({
    technical,
    mental,
    physical,
    confidence: state.player.confidence,
    fatigue: state.player.fatigue,
    equipmentBonus: getCurrentCueBonus(state.equipment),
  })
}

function getQTourEligibilityAssessment(state: GameState, season: string) {
  const activeSeasonEvents = state.history.tournamentHistory.filter(
    (entry) => entry.season === season && (getTournamentHistoryCanonicalResult(entry).matchesPlayed > 0 || entry.status === 'In Progress'),
  )
  const qTourEvents = activeSeasonEvents.filter((entry) => entry.eventType === 'Q Tour')
  const eliteAmateurEvents = activeSeasonEvents.filter((entry) => entry.eventType === 'Amateur')
  const qTourRank = state.careerSystems.qTour.playerRank ?? 999
  const qTourPoints = state.careerSystems.qTour.playerPoints ?? 0
  const qTourDeepRuns = qTourEvents.filter((entry) => isDeepRunResult(entry)).length
  const eliteAmateurDeepRuns = eliteAmateurEvents.filter((entry) => isDeepRunResult(entry)).length
  const qTourFinals = qTourEvents.filter((entry) => getTournamentHistoryFinishTier(entry) >= 4).length
  const qTourWins = qTourEvents.filter((entry) => entry.result === 'Winner').length
  const qTourMatchesPlayed = qTourEvents.reduce((sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).matchesPlayed, 0)
  const qTourWinsTotal = qTourEvents.reduce((sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).wins, 0)
  const qTourWinRate = qTourMatchesPlayed > 0
    ? (qTourWinsTotal / qTourMatchesPlayed) * 100
    : 0
  const effectiveStrength = calculateCurrentEffectiveStrength(state)
  const previousTop16Streak = state.careerSystems.qTour.top16Streak ?? 0
  const previousTop8Streak = state.careerSystems.qTour.top8Streak ?? 0
  const previousTop2Streak = state.careerSystems.qTour.top2Streak ?? 0
  const top16Streak = qTourRank <= 16 ? previousTop16Streak + 1 : 0
  const top8Streak = qTourRank <= 8 ? previousTop8Streak + 1 : 0
  const top2Streak = qTourRank <= 2 ? previousTop2Streak + 1 : 0
  const rankScore = qTourRank <= 2 ? 92 : qTourRank <= 4 ? 62 : qTourRank <= 8 ? 34 : qTourRank <= 16 ? 16 : 0
  const pointsScore = Math.min(72, Math.round(qTourPoints * 0.24))
  const deepRunScore = Math.min(64, qTourDeepRuns * 20 + eliteAmateurDeepRuns * 12)
  const finalsScore = qTourFinals * 34
  const winScore = qTourWins * 95 + Math.round(qTourWinRate * 0.75)
  const reputationScore = Math.max(0, Math.round((state.player.reputation - 50) * 0.25))
  const strengthScore = effectiveStrength > 170 ? 30 : effectiveStrength > 150 ? 22 : effectiveStrength > 130 ? 10 : 0
  const streakScore = (top16Streak >= 2 ? 18 : 0) + (top8Streak >= 2 ? 16 : 0) + (top2Streak >= 2 ? 26 : 0)
  const score = rankScore + pointsScore + deepRunScore + finalsScore + winScore + reputationScore + strengthScore + streakScore
  const top2Route = qTourRank <= 2
  const top8DeepRunRoute = qTourRank <= 8 && (qTourDeepRuns + eliteAmateurDeepRuns) >= 2
  const top16ConsistencyRoute = top16Streak >= 2
  const finalsRoute = qTourFinals >= 1
  const winRoute = qTourWins >= 1
  const rawCampaignEligible = score >= 100
    || top2Route
    || top8DeepRunRoute
    || top16ConsistencyRoute
    || finalsRoute
    || winRoute
  const seededCampaign = score >= 160
    || top2Route
    || (qTourRank <= 4 && qTourFinals >= 1)
    || winRoute
  const directPlayoffEligible = score >= 230
    || winRoute
    || (qTourRank <= 2 && qTourFinals >= 1)
  const qualifiedBy = directPlayoffEligible
    ? 'Q Tour playoff route'
    : seededCampaign
      ? 'Seeded Q School route'
      : rawCampaignEligible
        ? 'Q Tour consistency route'
        : null

  return {
    score,
    rawCampaignEligible,
    seededCampaign,
    directPlayoffEligible,
    qualifiedBy,
    top16Streak,
    top8Streak,
    top2Streak,
  }
}

function appendSeasonRecord(records: CareerSeasonRecord[], record: CareerSeasonRecord) {
  const withoutExisting = records.filter((item) => item.season !== record.season)
  return [record, ...withoutExisting].slice(0, SEASON_RECORD_LIMIT)
}

function seedPathwayFallbackRow(
  rows: CompetitionTableRow[],
  player: Player,
  points: number,
  statusNote: string,
) {
  const playerName = player.fullName
  const withoutPlayer = rows.filter((row) => row.playerName !== playerName)
  const fallbackRow: CompetitionTableRow = {
    ...createCompetitionDefaultRow(playerName, getNationCode(player.nationality), withoutPlayer.length + 1),
    points,
    prizeMoney: Math.max(0, Math.round(points * 0.25)),
    eventsPlayed: 0,
    wins: 0,
    losses: 0,
    titles: 0,
    statusNote,
  }

  return rerankCompetitionRows([...withoutPlayer, fallbackRow], playerName)
}

function seedLostCardFallbackCompetitionTables(tables: CompetitionTablesState, player: Player): CompetitionTablesState {
  return {
    ...tables,
    amateur: seedPathwayFallbackRow(tables.amateur, player, 260, 'Lost-card amateur fallback'),
    qTour: seedPathwayFallbackRow(tables.qTour, player, 180, 'Lost-card Q Tour fallback'),
    qSchool: seedPathwayFallbackRow(tables.qSchool, player, 140, 'Lost-card Q School route'),
  }
}

function removeOveragePlayerFromYouthTable(tables: CompetitionTablesState, player: Player): CompetitionTablesState {
  if (player.age <= 21 || !tables.youth.some((row) => row.playerName === player.fullName)) {
    return tables
  }

  return {
    ...tables,
    youth: rerankCompetitionRows(
      tables.youth.filter((row) => row.playerName !== player.fullName),
      player.fullName,
    ),
  }
}

function getDisplayedRanking(state: Pick<GameState, 'player' | 'careerSystems' | 'competitionTables' | 'rankings'> & Partial<Pick<GameState, 'history'>>) {
  const worldRanking = state.careerSystems.pro.worldRank
    ?? state.competitionTables.world.find((row) => row.playerName === state.player.fullName)?.ranking
    ?? state.player.worldRanking
    ?? null
  const effectiveWorldRanking = worldRanking != null ? Math.max(worldRanking, getHistoryPerformanceRankFloor(state.history)) : worldRanking
  const qSchoolRanking = state.competitionTables.qSchool.find((row) => row.playerName === state.player.fullName)?.ranking
    ?? state.careerSystems.qSchool.playerRank
    ?? null
  const qTourRanking = state.competitionTables.qTour.find((row) => row.playerName === state.player.fullName)?.ranking
    ?? state.careerSystems.qTour.playerRank
    ?? null
  const amateurRanking = state.competitionTables.amateur.find((row) => row.playerName === state.player.fullName)?.ranking
    ?? state.player.amateurRanking
    ?? null
  const seniorRanking = state.competitionTables.senior.find((row) => row.playerName === state.player.fullName)?.ranking
    ?? state.player.seniorRanking
    ?? null
  const youthRanking = state.competitionTables.youth.find((row) => row.playerName === state.player.fullName)?.ranking ?? null

  if (state.careerSystems.lateCareer.retired) {
    return { ranking: 999, rankingLabel: 'Retired' }
  }

  if (state.careerSystems.lateCareer.seniorActive || state.player.rankingLabel === 'Senior Ranking') {
    return { ranking: seniorRanking ?? 999, rankingLabel: 'Senior Ranking' }
  }

  if (state.careerSystems.pro.hasTourCard || (effectiveWorldRanking ?? 999) <= 64 || state.player.rankingLabel === 'World Ranking') {
    return { ranking: effectiveWorldRanking ?? 999, rankingLabel: 'World Ranking' }
  }

  if ((qSchoolRanking ?? 999) < 999 || state.player.rankingLabel === 'Q School Ranking') {
    return { ranking: qSchoolRanking ?? 999, rankingLabel: 'Q School Ranking' }
  }

  if ((qTourRanking ?? 999) < 999 || state.player.rankingLabel === 'Q Tour Ranking' || state.player.careerStage.toLowerCase().includes('q tour')) {
    return { ranking: qTourRanking ?? 999, rankingLabel: 'Q Tour Ranking' }
  }

  if ((youthRanking ?? 999) < 999 && state.player.age <= 21 && /youth|junior/i.test(state.player.careerStage)) {
    return { ranking: youthRanking ?? 999, rankingLabel: 'Youth Ranking' }
  }

  return { ranking: amateurRanking ?? 999, rankingLabel: 'Amateur Ranking' }
}

function createSeasonRecord(state: GameState, season: string): CareerSeasonRecord {
  const seasonSnapshots = state.history.snapshots.filter((snapshot) => snapshot.season === season)
  const seasonEvents = state.history.tournamentHistory.filter((entry) => entry.season === season)
  const activeSeasonEvents = seasonEvents.filter((entry) => getTournamentHistoryCanonicalResult(entry).matchesPlayed > 0 || entry.status === 'In Progress')
  const qSchoolEvents = activeSeasonEvents.filter((entry) => entry.eventType === 'Q School')
  const openingSnapshot = seasonSnapshots[0]
  const closingSnapshot = seasonSnapshots.at(-1)
  const currentRankingDisplay = getDisplayedRanking(state)
  const matchesPlayed = activeSeasonEvents.reduce((sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).matchesPlayed, 0)
  const wins = activeSeasonEvents.reduce((sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).wins, 0)
  const losses = activeSeasonEvents.reduce((sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).losses, 0)
  const prizeMoney = activeSeasonEvents.reduce((sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).prizeMoney, 0)
  const rankingPoints = activeSeasonEvents.reduce((sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).rankingPoints, 0)
  const qSchoolCardWins = qSchoolEvents.filter((entry) => entry.reward?.toLowerCase().includes('tour card')).length
  const totalTourCardWins = seasonEvents.filter((entry) => entry.reward?.toLowerCase().includes('tour card')).length
  const qSchoolMatchesWon = qSchoolEvents.reduce((sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).wins, 0)

  return {
    season,
    startedOn: openingSnapshot?.date ?? state.currentDate,
    endedOn: closingSnapshot?.date ?? state.currentDate,
    openingRanking: openingSnapshot?.ranking ?? currentRankingDisplay.ranking,
    openingRankingLabel: openingSnapshot?.rankingLabel ?? currentRankingDisplay.rankingLabel,
    closingRanking: closingSnapshot?.ranking ?? currentRankingDisplay.ranking,
    closingRankingLabel: closingSnapshot?.rankingLabel ?? currentRankingDisplay.rankingLabel,
    matchesPlayed,
    wins,
    losses,
    prizeMoney,
    rankingPoints,
    highestBreak: seasonEvents.reduce((best, entry) => Math.max(best, entry.highestBreak), 0),
    centuries: seasonEvents.reduce((sum, entry) => sum + entry.centuries, 0),
    titles: seasonEvents.filter((entry) => entry.result === 'Winner').length,
    majorTitles: seasonEvents.filter((entry) => entry.result === 'Winner' && entry.eventType === 'Major').length,
    qTourWins: seasonEvents.filter((entry) => entry.result === 'Winner' && entry.eventType === 'Q Tour').length,
    qSchoolEventsEntered: qSchoolEvents.length,
    qSchoolCampaignsEntered: getQSchoolCampaignCount(qSchoolEvents),
    qSchoolMatchesWon,
    qSchoolCardsWon: qSchoolCardWins,
    tourCardsWon: totalTourCardWins,
    bestResult: getBestSeasonResult(seasonEvents),
  }
}

function applySeasonRollover(state: GameState) {
  const archivedTournamentHistory = finalizeTournamentHistoryForSeason(state.history.tournamentHistory, state.tournaments, state.season)
  const archivedState = {
    ...state,
    history: {
      ...state.history,
      tournamentHistory: archivedTournamentHistory,
    },
  }
  const seasonRecord = createSeasonRecord(archivedState, state.season)
  const qTourEligibility = getQTourEligibilityAssessment(archivedState, state.season)
  const nextSeasonStartYear = getTournamentSeasonStartYear(state.tournaments) + 1
  const nextSeasonLabel = formatSeasonLabel(nextSeasonStartYear)
  const rawCurrentWorldRank = state.competitionTables.world.find((row) => row.playerName === state.player.fullName)?.ranking
    ?? state.careerSystems.pro.worldRank
    ?? state.player.worldRanking
    ?? 999
  const currentWorldRank = Math.max(rawCurrentWorldRank, getHistoryPerformanceRankFloor(archivedState.history))
  const currentHasTourCard = state.careerSystems.pro.hasTourCard || currentWorldRank <= 64
  const qTourCampaignEventsEntered = state.history.tournamentHistory.filter(
    (entry) => entry.season === state.season && entry.eventType === 'Q Tour' && getTournamentHistoryCanonicalResult(entry).matchesPlayed > 0,
  ).length
  const qTourPromotionEligible = state.careerSystems.qTour.playOffWinner === state.player.fullName
    || state.careerSystems.qTour.directCardAwarded
  const qTourRankingCardEligible = (state.careerSystems.qTour.playerRank ?? 999) === 1
    && (state.careerSystems.qTour.playerPoints ?? 0) >= 400
    && qTourCampaignEventsEntered >= 4
  const awardedQTourCard = !currentHasTourCard && (qTourPromotionEligible || qTourRankingCardEligible)
  const awardedQSchoolCard = !currentHasTourCard && seasonRecord.qSchoolCardsWon > 0
  const federationCardEvent = state.history.tournamentHistory.find(
    (entry) => entry.season === state.season
      && entry.eventType === 'Amateur'
      && entry.reward?.toLowerCase().includes('tour card'),
  )
  const awardedFederationCard = !currentHasTourCard && federationCardEvent != null
  const rankingRetentionSafe = currentWorldRank <= TOP_64_RANK_CUTOFF
  const retainedCard = currentHasTourCard && rankingRetentionSafe
  const protectedCardSeason = state.careerSystems.pro.hasTourCard && !rankingRetentionSafe && state.careerSystems.pro.yearsRemaining > 1
  const lostCard = currentHasTourCard && !rankingRetentionSafe && !protectedCardSeason
  const playerHasTourCardNextSeason = awardedQTourCard || awardedQSchoolCard || awardedFederationCard || retainedCard || protectedCardSeason
  const previousEligibilityWindow = Math.max(0, (state.careerSystems.qSchool.eligibilitySeasonsRemaining ?? 0) - 1)
  const reducedQSchoolCooldown = Math.max(0, (state.careerSystems.qSchool.cooldownSeasonsRemaining ?? 0) - 1)
  const failedQSchoolCampaign = seasonRecord.qSchoolCampaignsEntered > 0 && seasonRecord.qSchoolCardsWon === 0
  const qSchoolCooldown = failedQSchoolCampaign
    ? (qTourEligibility.directPlayoffEligible ? 1 : 2)
    : reducedQSchoolCooldown
  const lostCardFallbackEligible = lostCard && state.player.age < 45
  const unlockedEligibilityWindow = qTourEligibility.rawCampaignEligible || lostCardFallbackEligible ? 1 : 0
  const qSchoolEligibilityWindow = Math.max(previousEligibilityWindow, unlockedEligibilityWindow)
  const qSchoolCampaignEligible = !playerHasTourCardNextSeason
    && qSchoolEligibilityWindow > 0
    && (qSchoolCooldown === 0 || qTourEligibility.directPlayoffEligible)
  const qSchoolSeededEligible = !playerHasTourCardNextSeason
    && (qTourEligibility.seededCampaign || lostCardFallbackEligible)
    && (qSchoolCooldown === 0 || qTourEligibility.directPlayoffEligible)
  const qSchoolDirectPlayoffEligible = !playerHasTourCardNextSeason && qTourEligibility.directPlayoffEligible
  const rawRolledCompetitionTables = rollCompetitionTablesForward(state.competitionTables, state.player.fullName, state.worldPlayers)
  const fallbackCompetitionTables = lostCardFallbackEligible && !playerHasTourCardNextSeason
    ? seedLostCardFallbackCompetitionTables(rawRolledCompetitionTables, state.player)
    : rawRolledCompetitionTables
  const rolledCompetitionTables = enforcePathwayRankingProofFloors(
    fallbackCompetitionTables,
    state.player.fullName,
    seasonRecord,
    state.player.age,
  )
  const nextYearsRemaining = awardedQTourCard || awardedQSchoolCard || awardedFederationCard
    ? 2
    : retainedCard
      ? 0
      : protectedCardSeason
        ? Math.max(0, state.careerSystems.pro.yearsRemaining - 1)
        : 0
  const nextCurrentYear = playerHasTourCardNextSeason
    ? nextYearsRemaining >= 2
      ? 1
      : nextYearsRemaining === 1
        ? 2
        : 0
    : 0
  const nextExpiresAfterSeason = playerHasTourCardNextSeason && nextYearsRemaining > 0
    ? formatSeasonLabel(nextSeasonStartYear + nextYearsRemaining - 1)
    : null
  const careerSystemsSeed: CareerSystemsState = {
    ...state.careerSystems,
    qTour: {
      ...state.careerSystems.qTour,
      top16Streak: qTourEligibility.top16Streak,
      top8Streak: qTourEligibility.top8Streak,
      top2Streak: qTourEligibility.top2Streak,
      eligibilityScore: qTourEligibility.score,
      directCardAwarded: state.careerSystems.qTour.directCardAwarded || awardedQTourCard,
      playOffEligible: qSchoolDirectPlayoffEligible,
    },
    qSchool: {
      ...state.careerSystems.qSchool,
      repeatedFailures: awardedQSchoolCard ? 0 : state.careerSystems.qSchool.repeatedFailures,
      eligibilityScore: qTourEligibility.score,
      campaignEligible: qSchoolCampaignEligible,
      seededCampaign: qSchoolSeededEligible,
      directPlayoffEligible: qSchoolDirectPlayoffEligible,
      eligibilitySeasonsRemaining: qSchoolEligibilityWindow,
      cooldownSeasonsRemaining: qSchoolCooldown,
      qualifiedBy: qSchoolCampaignEligible || qSchoolSeededEligible || qSchoolDirectPlayoffEligible
        ? lostCardFallbackEligible
          ? 'Tour card fallback route'
          : qTourEligibility.qualifiedBy
        : null,
      topUpEligible: false,
      slumpRisk: false,
    },
    pro: {
      ...state.careerSystems.pro,
      hasTourCard: playerHasTourCardNextSeason,
      cardSource: awardedQTourCard
        ? 'Q Tour'
        : awardedQSchoolCard
          ? 'Q School'
          : awardedFederationCard
            ? 'Federation Route'
            : retainedCard
              ? 'Ranking Retained'
              : protectedCardSeason
                ? (state.careerSystems.pro.cardSource ?? 'Unknown')
                : null,
      currentYear: nextCurrentYear,
      yearsRemaining: nextYearsRemaining,
      expiresAfterSeason: nextExpiresAfterSeason,
      retainedViaRanking: retainedCard,
      awardedBy: awardedQTourCard
        ? 'Q Tour playoff route'
        : awardedQSchoolCard
          ? 'Q School campaign win'
          : awardedFederationCard
            ? federationCardEvent.tournamentName
            : lostCard
              ? state.careerSystems.pro.awardedBy
              : state.careerSystems.pro.awardedBy,
      tourSurvivalStatus: retainedCard
        ? 'Safe'
        : protectedCardSeason
          ? (currentWorldRank <= 96 ? 'Bubble' : 'At Risk')
          : lostCard
            ? 'Lost Card'
            : state.careerSystems.pro.tourSurvivalStatus,
    },
  }
  const attributesForNextSeason = applySeasonalAgeRegression(state.attributes, state.player.age + 1)
  const playerForNextSeason: Player = {
    ...state.player,
    age: state.player.age + 1,
    worldRanking: rolledCompetitionTables.world.find((row) => row.playerName === state.player.fullName)?.ranking ?? state.player.worldRanking,
    amateurRanking: rolledCompetitionTables.amateur.find((row) => row.playerName === state.player.fullName)?.ranking ?? state.player.amateurRanking,
    seniorRanking: rolledCompetitionTables.senior.find((row) => row.playerName === state.player.fullName)?.ranking ?? state.player.seniorRanking,
  }
  const archivedWorldPlayers = archiveWorldPlayersForSeason(
    state.worldPlayers,
    state.competitionTables,
    state.season,
    state.player.fullName,
    careerSystemsSeed.pro.currentTier,
    state.player,
    seasonRecord,
  )
  const nextWorldPlayers = evolveWorldPlayersForNextSeason(
    archivedWorldPlayers,
    state.competitionTables,
    playerForNextSeason,
    playerHasTourCardNextSeason,
    careerSystemsSeed.pro,
    nextSeasonStartYear,
  )
  const livingCompetitionTables = rebuildLivingCompetitionTables(rolledCompetitionTables, nextWorldPlayers, state.player.fullName, nextSeasonStartYear)
  const flooredLivingCompetitionTables = enforcePathwayRankingProofFloors(
    livingCompetitionTables,
    state.player.fullName,
    seasonRecord,
    state.player.age,
  )
  const ageEligibleCompetitionTables = removeOveragePlayerFromYouthTable(flooredLivingCompetitionTables, playerForNextSeason)
  const rebuiltCompetitionTables = enforcePlayerWorldRankingCeiling(
    ageEligibleCompetitionTables,
    state.player.fullName,
    getPlayerWorldRankingCeiling(archivedState),
  )
  const syncedCareerSystems = syncCareerSystems({
    competitionTables: rebuiltCompetitionTables,
    player: playerForNextSeason,
    careerSystems: careerSystemsSeed,
    history: archivedState.history,
  })
  const adjustedWorldRank = Math.max(
    syncedCareerSystems.pro.worldRank ?? 999,
    getPlayerWorldRankingCeiling(archivedState),
    getHistoryPerformanceRankFloor(archivedState.history),
  )
  const careerSystems = {
    ...syncedCareerSystems,
    pro: applyAdjustedWorldRankToProState(syncedCareerSystems.pro, playerForNextSeason, adjustedWorldRank),
  }
  const primaryKey = getPrimaryCompetitionKey({ player: playerForNextSeason, careerSystems })
  const retired = careerSystems.lateCareer.retired
  const nextPlayer: Player = {
    ...playerForNextSeason,
    worldRanking: careerSystems.pro.worldRank ?? rebuiltCompetitionTables.world.find((row) => row.playerName === state.player.fullName)?.ranking ?? playerForNextSeason.worldRanking,
    amateurRanking: retired || primaryKey === 'senior' || primaryKey === 'world'
      ? null
      : rebuiltCompetitionTables.amateur.find((row) => row.playerName === state.player.fullName)?.ranking ?? playerForNextSeason.amateurRanking,
    seniorRanking: rebuiltCompetitionTables.senior.find((row) => row.playerName === state.player.fullName)?.ranking ?? playerForNextSeason.seniorRanking,
    careerPhase: getCareerPhaseFromSystems(playerForNextSeason, careerSystems),
    competitiveStatus: getCareerStageFromSystems(playerForNextSeason, careerSystems, archivedState.history),
    careerStage: getCareerStageFromSystems(playerForNextSeason, careerSystems, archivedState.history),
    rankingLabel: retired ? 'Retired' : getRankingLabelForCompetitionKey(primaryKey),
  }
  const nextSeasonSchedule = applySeasonOpenWorldChampionshipAccess(
    buildTournamentScheduleForSeason(nextSeasonStartYear),
    {
      player: nextPlayer,
      careerSystems,
      competitionTables: rebuiltCompetitionTables,
      history: archivedState.history,
    },
    {
      seasonOpenWorldRankOverride: seasonRecord.closingRankingLabel === 'World Ranking'
        ? seasonRecord.closingRanking
        : null,
    },
  )

  return {
    ...archivedState,
    player: nextPlayer,
    attributes: attributesForNextSeason,
    season: nextSeasonLabel,
    tournaments: nextSeasonSchedule,
    rankings: rebuiltCompetitionTables[primaryKey].map((row) => ({ ...row })),
    competitionTables: rebuiltCompetitionTables,
    worldPlayers: nextWorldPlayers,
    careerSystems,
    tournamentProgress: createEmptyTournamentProgress(),
    travel: createEmptyTravelState(),
    history: {
      ...archivedState.history,
      seasonRecords: appendSeasonRecord(archivedState.history.seasonRecords, seasonRecord),
    },
    inbox: [
      createInboxMessage(
        {
          sender: 'Career Manager',
          subject: `${nextSeasonLabel} season loaded`,
          preview: `${state.season} has been archived with ${seasonRecord.matchesPlayed} matches, ${seasonRecord.titles} titles, and ${seasonRecord.prizeMoney} in prize money. The new July-to-June calendar is now active.`,
          priority: 'High',
          actionLabel: 'Open Calendar',
          actionRoute: '/calendar',
        },
        'Today',
      ),
      ...state.inbox,
    ].slice(0, 18),
  }
}

export function advanceWeekState(previousState: GameState): GameState {
  const protectedState = ensureLockedWorldChampionshipEntry(previousState)
  const expiringSponsors = protectedState.sponsors.filter((sponsor) => sponsor.weeksRemaining <= 1)
  const activeSponsors = protectedState.sponsors
    .map((sponsor) => ({ ...sponsor, weeksRemaining: sponsor.weeksRemaining - 1 }))
    .filter((sponsor) => sponsor.weeksRemaining > 0)
  const expiringCoachContracts = protectedState.coachContracts.filter((contract) => contract.weeksRemaining <= 1)
  const activeCoachContracts = protectedState.coachContracts
    .map((contract) => ({ ...contract, weeksRemaining: contract.weeksRemaining - 1 }))
    .filter((contract) => contract.weeksRemaining > 0)
  const sponsorExpiryMessages = expiringSponsors.map((sponsor) => createInboxMessage(
    {
      sender: 'Commercial Team',
      subject: `${sponsor.name} deal ended`,
      preview: `${sponsor.name} has rolled off the ${sponsor.slot} slot. Monthly income of £${sponsor.monthlyValue} has been removed from the save.`,
      priority: 'Medium',
      actionLabel: 'Open Sponsorships',
      actionRoute: '/sponsorship',
    },
    'Today',
  ))
  const coachExpiryMessages = expiringCoachContracts.map((contract) => {
    const coach = protectedState.coaches.find((entry) => entry.id === contract.coachId)

    return createInboxMessage(
      {
        sender: 'Staff Office',
        subject: `${coach?.name ?? 'Coach'} contract ended`,
        preview: `${coach?.name ?? 'Your coach'} has left the ${contract.slot} slot after the ${contract.contractLabel.toLowerCase()}. Weekly staff costs have been updated.`,
        priority: 'Medium',
        actionLabel: 'Open Staff Market',
        actionRoute: '/staff/coaches',
      },
      'Today',
    )
  })
  let nextState: GameState = {
    ...protectedState,
    currentDate: addDays(protectedState.currentDate, 7),
    week: protectedState.week + 1,
    sponsors: activeSponsors,
    coachContracts: activeCoachContracts,
    inbox: [...coachExpiryMessages, ...sponsorExpiryMessages, ...protectedState.inbox].slice(0, 18),
    player: {
      ...protectedState.player,
      cash: protectedState.player.cash + protectedState.finance.cashFlow,
      fatigue: protectedState.player.fatigue,
    },
  }

  const enteredTournament = protectedState.tournaments.find((event) => event.status === 'Entered')
    ?? protectedState.tournaments.find((event) => event.status === 'Booked')
  const enteredTournamentDaysUntilStart = enteredTournament ? daysUntil(enteredTournament.startDate, protectedState.currentDate) : null
  if (enteredTournament && (enteredTournamentDaysUntilStart ?? 999) <= 7) {
    nextState = runMatchSimulation(nextState, enteredTournament)
  } else {
    nextState = finalizeState(
      {
        ...nextState,
        inbox: [
          createInboxMessage(
            {
              sender: 'Career Manager',
              subject: `Week ${nextState.week} complete`,
              preview: `Weekly cash flow settled at ${nextState.finance.cashFlow >= 0 ? '+' : ''}${nextState.finance.cashFlow}. Confidence and fatigue updated for the new week.`,
              priority: 'Medium',
            },
            'Today',
          ),
          ...nextState.inbox,
        ].slice(0, 18),
      },
      `Advanced to week ${nextState.week}.`,
      `Week ${nextState.week}`,
    )
  }

  if (nextState.currentDate >= getNextSeasonStartDate(protectedState.tournaments)) {
    nextState = finalizeState(
      applySeasonRollover(nextState),
      `Rolled into the ${formatSeasonLabel(getTournamentSeasonStartYear(protectedState.tournaments) + 1)} season.`,
      `${protectedState.season} archived`,
    )
  }

  return {
    ...nextState,
    trainingPlan: buildAutoTrainingPlanFromState(nextState),
  }
}

export function enterTournamentState(previousState: GameState, tournamentId: string): GameState {
  const tournament = previousState.tournaments.find((item) => item.id === tournamentId)
  if (!tournament) return previousState
  if (tournament.status === 'Entered') {
    return finalizeState(previousState, `${tournament.name} is already entered.`)
  }

  const entryAccess = getTournamentEntryAccess(previousState, tournament)
  if (!entryAccess.allowed) {
    return finalizeState(previousState, entryAccess.reason ?? `You do not have valid access for ${tournament.name}.`)
  }

  const equipmentMessage = getTournamentEquipmentMessage(previousState.equipment)
  if (equipmentMessage) {
    return finalizeState(previousState, equipmentMessage)
  }

  const cashRequirement = getTournamentEntryCashRequirement(previousState, tournament)

  if (previousState.player.cash < cashRequirement) {
    return finalizeState(previousState, `Insufficient funds to enter ${tournament.name}.`)
  }

  return finalizeState(
    {
      ...previousState,
      player: {
        ...previousState.player,
        cash: previousState.player.cash - cashRequirement,
        morale: clamp(previousState.player.morale + 1, 0, 100),
      },
      tournaments: previousState.tournaments.map((item) => (item.id === tournamentId ? { ...item, status: 'Entered' } : item)),
      travel: {
        ...previousState.travel,
        bookings: Object.fromEntries(Object.entries(previousState.travel.bookings).filter(([key]) => key !== tournamentId)),
      },
      tournamentProgress: {
        tournamentId,
        currentRound: getTournamentEntryRound(previousState, tournament),
        draw: buildTournamentDraw(previousState, tournament, getTournamentEntryRound(previousState, tournament)),
        completedRounds: [],
      },
      history: {
        ...previousState.history,
        tournamentHistory: upsertTournamentHistoryEntry(
          previousState.history.tournamentHistory,
          synchronizeTournamentHistoryEntry(
            tournament,
            {
              ...(previousState.history.tournamentHistory.find((entry) => entry.id === getTournamentHistoryId(previousState.season, tournament.id)) ?? createTournamentHistoryEntry(tournament, previousState.season)),
              status: 'Entered',
              result: 'Entered',
            },
          ),
        ),
      },
      inbox: [
        createInboxMessage(
          {
            sender: 'Tournament Office',
            subject: `Entered ${tournament.name}`,
            preview: `Entry fee of £${cashRequirement} has been paid. Travel and hotel can now be booked separately.`,
            priority: 'High',
            actionLabel: 'Book Travel',
            actionRoute: '/travel',
          },
          'Today',
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Entered ${tournament.name}.`,
    'Tournament Entry',
  )
}

function ensureLockedWorldChampionshipEntry(state: GameState) {
  const initialWorldChampionship = state.tournaments.find((tournament) => isWorldChampionshipMainDrawTournament(tournament))
  if (!initialWorldChampionship) return state

  const worldQualifying = state.tournaments.find((tournament) => isWorldChampionshipQualifierTournament(tournament))
  const seasonOpenWorldSnapshot = state.history.snapshots.find(
    (snapshot) => snapshot.season === state.season && snapshot.rankingLabel === 'World Ranking',
  )
  const fallbackWorldRank = state.careerSystems.pro.worldRank
    ?? state.competitionTables.world.find((row) => row.playerName === state.player.fullName)?.ranking
    ?? state.player.worldRanking
    ?? 999
  const fallbackStatus = `${state.player.competitiveStatus ?? state.player.careerStage}`.toLowerCase()
  const fallbackTier = `${state.careerSystems.pro.currentTier ?? ''}`.toLowerCase()
  const fallbackSurvival = `${state.careerSystems.pro.tourSurvivalStatus ?? ''}`.toLowerCase()
  const hasFallbackMainTourStatus = state.careerSystems.pro.hasTourCard && fallbackWorldRank <= MAIN_TOUR_POOL_SIZE
  const inferredMainDrawLock = hasFallbackMainTourStatus && (
    fallbackWorldRank <= TOP_16_RANK_CUTOFF
    || /top 16|major contender|world champion/.test(fallbackStatus)
    || /top 16/.test(fallbackTier)
    || /top 16/.test(fallbackSurvival)
  )
  const inferredSeasonOpenMainDrawLock = state.careerSystems.pro.hasTourCard && (seasonOpenWorldSnapshot?.ranking ?? 999) <= TOP_16_RANK_CUTOFF
  const repairedWorldMainDrawLock = initialWorldChampionship.seasonOpenAccessLock === 'worldMainDraw'
    || inferredSeasonOpenMainDrawLock
    || (
      initialWorldChampionship.seasonOpenAccessLock == null
      && (worldQualifying?.seasonOpenAccessLock == null)
      && inferredMainDrawLock
    )

  if (!repairedWorldMainDrawLock) return state

  const normalizedState = repairedWorldMainDrawLock && (
    initialWorldChampionship.seasonOpenAccessLock !== 'worldMainDraw'
    || (worldQualifying && worldQualifying.seasonOpenAccessLock !== 'worldMainDraw')
    || initialWorldChampionship.status === 'Available'
    || worldQualifying?.status === 'Available'
  )
    ? {
        ...state,
        tournaments: state.tournaments.map((tournament) => {
          if (tournament.id === initialWorldChampionship.id) {
            return {
              ...tournament,
              seasonOpenAccessLock: 'worldMainDraw' as Tournament['seasonOpenAccessLock'],
              status: tournament.status === 'Available' ? 'Booked' as Tournament['status'] : tournament.status,
            }
          }

          if (worldQualifying && tournament.id === worldQualifying.id) {
            return {
              ...tournament,
              seasonOpenAccessLock: 'worldMainDraw' as Tournament['seasonOpenAccessLock'],
              status: tournament.status === 'Available' ? 'Skipped' as Tournament['status'] : tournament.status,
            }
          }

          return tournament
        }),
      }
    : state

  const worldChampionship = normalizedState.tournaments.find(
    (tournament) => isWorldChampionshipMainDrawTournament(tournament) && tournament.seasonOpenAccessLock === 'worldMainDraw',
  )
  if (!worldChampionship) return normalizedState
  if (worldChampionship.status === 'Entered') return normalizedState

  const alreadyRecorded = normalizedState.history.tournamentHistory.some(
    (entry) => entry.season === normalizedState.season && entry.tournamentName === worldChampionship.name,
  )
  if (alreadyRecorded) return normalizedState

  const daysUntilStart = daysUntil(worldChampionship.startDate, normalizedState.currentDate)
  if (daysUntilStart > 35 || daysUntilStart < 0) return normalizedState

  const enteredTournament = normalizedState.tournaments.find((tournament) => tournament.status === 'Entered')
  if (enteredTournament && enteredTournament.id !== worldChampionship.id) {
    const skippedState: GameState = {
      ...normalizedState,
      tournaments: normalizedState.tournaments.map((tournament) => (
        tournament.id === enteredTournament.id ? { ...tournament, status: 'Skipped' } : tournament
      )),
      tournamentProgress: normalizedState.tournamentProgress.tournamentId === enteredTournament.id
        ? createEmptyTournamentProgress()
        : normalizedState.tournamentProgress,
      history: {
        ...normalizedState.history,
        tournamentHistory: upsertTournamentHistoryEntry(
          normalizedState.history.tournamentHistory,
          synchronizeTournamentHistoryEntry(
            enteredTournament,
            {
              ...(normalizedState.history.tournamentHistory.find((entry) => entry.id === getTournamentHistoryId(normalizedState.season, enteredTournament.id))
                ?? createTournamentHistoryEntry(enteredTournament, normalizedState.season)),
              status: 'Skipped',
              result: 'Skipped',
            },
          ),
        ),
      },
    }

    return enterTournamentState(skippedState, worldChampionship.id)
  }

  return enterTournamentState(normalizedState, worldChampionship.id)
}

function getEnteredCompetitions(state: Pick<GameState, 'tournaments'>) {
  return state.tournaments
    .filter((tournament) => tournament.status === 'Entered')
    .map((tournament) => ({
      name: tournament.name,
      location: tournament.location,
      startDate: tournament.startDate,
    }))
}

function buildAutoTrainingPlanFromState(state: Pick<GameState, 'currentDate' | 'player' | 'tournaments' | 'travel'>) {
  const enteredCompetitions = getEnteredCompetitions({ tournaments: state.tournaments })
  const nextCompetition = state.tournaments.find((tournament) => tournament.status === 'Entered')
  const travelBooked = nextCompetition ? Boolean(state.travel.bookings[nextCompetition.id]) : false

  return buildAutoTrainingPlan(state.currentDate, state.player.fatigue, enteredCompetitions, travelBooked)
}

function parseCoachContractWeeks(contractLabel?: string) {
  return getCoachContractWeeks(contractLabel)
}

function getCareerRanking(state: Pick<GameState, 'player' | 'rankings'>) {
  return state.rankings.find((row) => row.playerName === state.player.fullName)?.ranking ?? state.player.amateurRanking ?? state.player.worldRanking ?? 0
}

function getCoachSlotLimit(state: Pick<GameState, 'player' | 'rankings'>) {
  return getCoachSlotLimitForRanking(getCareerRanking(state), state.player.reputation)
}

function normalizeCoachContracts(contracts: CoachContract[], coaches: Coach[]) {
  return contracts
    .filter((contract) => coaches.some((coach) => coach.id === contract.coachId))
    .map((contract, index) => {
      const coach = coaches.find((entry) => entry.id === contract.coachId) ?? coaches[0]
      const contractOptions = getCoachContractOptions(coach)
      const matchedOption = contractOptions.find((option) => option.label === contract.contractLabel) ?? contractOptions[0]

      return {
        coachId: contract.coachId,
        slot: contract.slot || COACH_SLOT_NAMES[index] || COACH_SLOT_NAMES[COACH_SLOT_NAMES.length - 1],
        contractLabel: matchedOption.label,
        contractWeeks: typeof contract.contractWeeks === 'number' ? contract.contractWeeks : parseCoachContractWeeks(matchedOption.label),
        weeklyCost: contract.weeklyCost ?? matchedOption.weeklyCost,
        totalCost: contract.totalCost ?? matchedOption.totalCost,
        weeksRemaining: typeof contract.weeksRemaining === 'number' ? contract.weeksRemaining : parseCoachContractWeeks(matchedOption.label),
        startedWeek: contract.startedWeek ?? 1,
      }
    })
}

function buildLegacyCoachContracts(currentCoachId: string | null, coaches: Coach[], currentWeek: number) {
  if (!currentCoachId) return []

  const coach = coaches.find((entry) => entry.id === currentCoachId)
  if (!coach) return []

  const defaultOption = getCoachContractOptions(coach)[0]

  return [
    {
      coachId: coach.id,
      slot: COACH_SLOT_NAMES[0],
      contractLabel: defaultOption.label,
      contractWeeks: parseCoachContractWeeks(defaultOption.label),
      weeklyCost: defaultOption.weeklyCost,
      totalCost: defaultOption.totalCost,
      weeksRemaining: parseCoachContractWeeks(defaultOption.label),
      startedWeek: currentWeek,
    },
  ]
}

function getCoachNegotiationOutcome(contract: CoachContract, coach: Coach, playerReputation: number, tone: 'Conservative' | 'Balanced' | 'Ambitious') {
  const levelPenalty = coach.level === 'Elite' ? 10 : coach.level === 'High' ? 6 : coach.level === 'Mid' ? 3 : 0
  const threshold = tone === 'Conservative' ? 98 : tone === 'Balanced' ? 114 : 130
  const reduction = tone === 'Conservative' ? 0.03 : tone === 'Balanced' ? 0.06 : 0.09
  const leverageScore = playerReputation + coach.compatibility - levelPenalty
  const floorWeeklyCost = Math.round(coach.weeklyCost * 0.82)
  const nextWeeklyCost = Math.max(floorWeeklyCost, Math.round(contract.weeklyCost * (1 - reduction)))

  return {
    success: leverageScore >= threshold && nextWeeklyCost < contract.weeklyCost,
    nextWeeklyCost,
  }
}

function getPrimaryCoachId(coachContracts: CoachContract[]) {
  return coachContracts.find((contract) => contract.slot === COACH_SLOT_NAMES[0])?.coachId ?? coachContracts[0]?.coachId ?? null
}

function getNextCoachSlot(state: Pick<GameState, 'coachContracts' | 'player' | 'rankings'>) {
  const unlockedSlots = COACH_SLOT_NAMES.slice(0, getCoachSlotLimit(state))
  return unlockedSlots.find((slot) => !state.coachContracts.some((contract) => contract.slot === slot)) ?? null
}

function getCoachAvailabilityStatus(state: Pick<GameState, 'player' | 'rankings'>, coach: Coach) {
  return getCoachAvailability(coach, getCareerRanking(state), state.player.reputation)
}

function applyCoachTrainingBonus(trainingEffects: ReturnType<typeof calculateTrainingEffects>, coachContracts: CoachContract[], coaches: Coach[]) {
  return coachContracts.reduce((bonus, contract) => {
    const coach = coaches.find((entry) => entry.id === contract.coachId)
    if (!coach) return bonus

    const levelBonus = coach.level === 'Elite' ? 2 : coach.level === 'High' ? 1 : 0
    const chemistryBonus = coach.compatibility >= 82 ? 1 : 0

    if (coach.type === 'Technical' || coach.type === 'Break Building') {
      bonus.technicalGain += 1 + levelBonus
      bonus.breakBuildingGain += 1 + levelBonus
      bonus.cueControlGain += chemistryBonus
    }

    if (coach.type === 'Mental') {
      bonus.focusGain += 1 + levelBonus
      bonus.confidenceDelta += 1 + chemistryBonus
      bonus.moraleDelta += 1
      bonus.fatigueDelta -= 1
    }

    if (coach.type !== 'Mental' && coach.discipline >= 80) {
      bonus.staminaGain += chemistryBonus
      bonus.fatigueDelta -= chemistryBonus
    }

    return bonus
  }, { ...trainingEffects })
}

function buildSponsorOffers(existingOffers: SponsorOfferState[] = []): SponsorOfferState[] {
  const existingOffersById = new Map(existingOffers.map((offer) => [offer.id, offer]))

  return sponsorOfferCatalog.map((offer) => {
    const existingOffer = existingOffersById.get(offer.id)

    if (!existingOffer) {
      return {
        ...offer,
        status: 'Available',
        negotiationCount: 0,
        notes: [],
      }
    }

    return {
      ...offer,
      ...existingOffer,
      status: existingOffer.status ?? 'Available',
      negotiationCount: existingOffer.negotiationCount ?? 0,
      notes: existingOffer.notes ?? [],
    }
  })
}

function roundToNearestFifty(value: number) {
  return Math.max(200, Math.round(value / 50) * 50)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function deepCloneAttributes(attributes: PlayerAttributes): PlayerAttributes {
  return {
    technical: { ...attributes.technical },
    mental: { ...attributes.mental },
    physical: { ...attributes.physical },
  }
}

function buildPersistedPersonalityTraits(traits: Player['personalityTraits'] | undefined, playingStyle: string) {
  if (traits?.length) return traits.map((trait) => ({ ...trait }))
  return applyPlayingStyleToSliders(createPlayerSliderCatalog.map((slider) => ({ ...slider })), playingStyle)
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function daysUntil(dateString: string, currentDate: string) {
  const target = new Date(`${dateString}T00:00:00`).getTime()
  const current = new Date(`${currentDate}T00:00:00`).getTime()
  return Math.max(0, Math.round((target - current) / (1000 * 60 * 60 * 24)))
}

function createInboxMessage(partial: Omit<InboxMessage, 'id' | 'date'>, date: string): InboxMessage {
  return {
    id: `inbox-${date}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    ...partial,
  }
}

function inferInboxAction(message: InboxMessage): Pick<InboxMessage, 'actionLabel' | 'actionRoute'> {
  const text = `${message.sender} ${message.subject} ${message.preview}`.toLowerCase()

  if (/commercial team|sponsor/.test(text)) {
    if (/negotiation|review deal|reopen deal/.test(text)) {
      return { actionLabel: 'Open Sponsorships', actionRoute: '/sponsorship' }
    }
  }

  if (/travel desk|travel booked|logistics confirmed|travel pack/.test(text)) {
    return { actionLabel: 'Open Travel', actionRoute: '/travel' }
  }

  if (/tournament office|tour office|entered /.test(text)) {
    return { actionLabel: 'Open Calendar', actionRoute: '/calendar' }
  }

  if (/equipment room|maintenance|serviced/.test(text)) {
    return { actionLabel: 'Open Maintenance', actionRoute: '/equipment/maintenance' }
  }

  return {}
}

function normalizeInboxMessages(messages: InboxMessage[]): InboxMessage[] {
  return messages.map((message) => {
    if (message.actionLabel && message.actionRoute) {
      return message
    }

    return {
      ...message,
      ...inferInboxAction(message),
    }
  })
}

function buildNewCareerInboxMessages(
  fullName: string,
  backgroundName: string,
  backgroundDifficulty: string,
  startingLevelName: string,
  startingCashFlow: number,
): InboxMessage[] {
  return [
    createInboxMessage(
      {
        sender: 'Career Manager',
        subject: 'Start here: opening save briefing',
        preview: `${fullName} starts on the ${startingLevelName} route with the ${backgroundName} background and ${backgroundDifficulty.toLowerCase()} opening conditions. Open the inbox first, then work through the setup notes below in order.`,
        priority: 'High',
        actionLabel: 'Open Inbox',
        actionRoute: '/inbox',
      },
      'Today',
    ),
    createInboxMessage(
      {
        sender: 'Commercial Team',
        subject: 'Tutorial: review sponsor options',
        preview: 'Sponsors shape early weekly income and unlock longer-term stability. Review the current market, see what is realistic for a new save, and learn where future offers will appear.',
        priority: 'Medium',
        actionLabel: 'Open Sponsorships',
        actionRoute: '/sponsorship',
      },
      'Today',
    ),
    createInboxMessage(
      {
        sender: 'Finance Office',
        subject: 'Tutorial: understand your weekly money',
        preview: `You begin with ${startingCashFlow >= 0 ? '+' : ''}£${Math.abs(startingCashFlow)} weekly flow. Check the finance screen now so entry fees, travel, and staff costs do not catch you out in the first month.`,
        priority: 'Medium',
        actionLabel: 'Open Finance',
        actionRoute: '/finance',
      },
      'Today',
    ),
    createInboxMessage(
      {
        sender: 'Equipment Room',
        subject: 'Tutorial: set up your playing hardware',
        preview: 'Your first event preparation starts with equipment. Review cue options and then work through chalk, tip, and maintenance so the save has a proper base setup.',
        priority: 'Medium',
        actionLabel: 'Open Equipment',
        actionRoute: '/equipment/cues',
      },
      'Today',
    ),
    createInboxMessage(
      {
        sender: 'Staff Office',
        subject: 'Tutorial: learn the coach market',
        preview: 'You do not need to hire immediately, but you should understand fit, cost, and unlock rules early. Open the coach market and see what support is realistically available at this stage.',
        priority: 'Low',
        actionLabel: 'Open Staff Market',
        actionRoute: '/staff/coaches',
      },
      'Today',
    ),
    createInboxMessage(
      {
        sender: 'Head Coach',
        subject: 'Tutorial: lock in your first training week',
        preview: 'Training, travel, and tournament prep now all feed the live save. Open the planner, review the auto-built week, and use it as the first guided step before entering events.',
        priority: 'Medium',
        actionLabel: 'Open Training Planner',
        actionRoute: '/training',
      },
      'Today',
    ),
  ]
}

function formatDisplayDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function buildCueStates(): Record<string, CueConditionState> {
  return Object.fromEntries(
    cueMarketplaceCatalog.map((cue) => [
      cue.id,
      {
        condition: cue.condition,
        familiarity: cue.familiarity,
        durability: cue.durability,
        tipCondition: clamp(cue.condition - 12, 28, 100),
        shaftStraightness: clamp(cue.condition - 6, 40, 100),
      },
    ]),
  )
}

function buildDefaultEquipmentState(): EquipmentState {
  return {
    ...starterEquipmentState,
    cuesOwned: [...starterEquipmentState.cuesOwned],
    chalkOwned: [...starterEquipmentState.chalkOwned],
    tipsOwned: [...starterEquipmentState.tipsOwned],
    casesOwned: [...starterEquipmentState.casesOwned],
    tablesOwned: [...starterEquipmentState.tablesOwned],
    cueStates: buildCueStates(),
  }
}

function buildEmptyEquipmentState(): EquipmentState {
  return {
    currentCueId: null,
    currentChalkId: null,
    currentTipId: null,
    currentCaseId: null,
    currentTableId: null,
    cuesOwned: [],
    chalkOwned: [],
    tipsOwned: [],
    casesOwned: [],
    tablesOwned: [],
    cueStates: buildCueStates(),
  }
}

function getCueState(equipment: EquipmentState, cueId: string) {
  return equipment.cueStates[cueId] ?? {
    condition: 75,
    familiarity: 50,
    durability: 72,
    tipCondition: 64,
    shaftStraightness: 70,
  }
}

function getTravelOption(travelOptionId?: string): TravelOption {
  return travelOptionCatalog.find((option) => option.id === travelOptionId) ?? travelOptionCatalog[0]
}

function getHotelOption(hotelOptionId?: string): HotelOption {
  return hotelOptionCatalog.find((option) => option.id === hotelOptionId) ?? hotelOptionCatalog[0]
}

function getTripCost(travelOption: TravelOption, hotelOption: HotelOption) {
  return travelOption.cost + hotelOption.cost + 20 + 35
}

function getTravelBooking(state: GameState, tournamentId: string) {
  return state.travel.bookings[tournamentId] ?? null
}

function getTravelReadinessModifier(state: GameState, tournamentId: string) {
  const booking = getTravelBooking(state, tournamentId)
  if (!booking) return -4

  const travelOption = getTravelOption(booking.travelOptionId)
  const hotelOption = getHotelOption(booking.hotelOptionId)
  return Math.round((100 - travelOption.fatigueValue) / 12 + hotelOption.preparationValue / 20 + hotelOption.recoveryValue / 25 - travelOption.delayRisk / 20)
}

function getCurrentRanking(state: GameState) {
  const performanceRankFloor = getHistoryPerformanceRankFloor(state.history)
  if (state.player.rankingLabel === 'World Ranking' && state.careerSystems.pro.worldRank != null) {
    return Math.max(state.careerSystems.pro.worldRank, performanceRankFloor)
  }

  const rawRanking = state.rankings.find((row) => row.playerName === state.player.fullName)?.ranking ?? state.player.amateurRanking ?? state.player.worldRanking ?? 0
  return state.player.rankingLabel === 'World Ranking' ? Math.max(rawRanking, performanceRankFloor) : rawRanking
}

function getSponsorSlotLimit(state: GameState) {
  const ranking = getCurrentRanking(state)
  if (ranking <= 16 || state.player.reputation >= 68) return 3
  if (ranking <= 32 || state.player.reputation >= 52) return 2
  return 1
}

function parseContractWeeks(contractLength?: string) {
  const months = Number(contractLength?.match(/(\d+)/)?.[1] ?? 24)
  return Math.max(4, months * 4)
}

function normalizeSponsors(sponsors: SponsorDeal[]) {
  return sponsors.map((sponsor, index) => ({
    ...sponsor,
    slot: sponsor.slot || SPONSOR_SLOT_NAMES[index] || SPONSOR_SLOT_NAMES[SPONSOR_SLOT_NAMES.length - 1],
    contractLength: sponsor.contractLength || '24 months',
    weeksRemaining: typeof sponsor.weeksRemaining === 'number' ? sponsor.weeksRemaining : parseContractWeeks(sponsor.contractLength),
  }))
}

function getNextSponsorSlot(state: GameState) {
  const unlockedSlots = SPONSOR_SLOT_NAMES.slice(0, getSponsorSlotLimit(state))
  return unlockedSlots.find((slot) => !state.sponsors.some((sponsor) => sponsor.slot === slot)) ?? null
}

function refreshSponsorOffers(state: GameState) {
  const ranking = getCurrentRanking(state)
  const sponsorCapacity = getSponsorSlotLimit(state)
  const accessBand = getProTourAccessBand(state)
  const recentProProfile = getRecentProfessionalHistoryProfile(state.history)
  const effectiveStrength = calculateCurrentEffectiveStrength(state)
  const recentTitles = state.history.tournamentHistory.filter((entry) => entry.result === 'Winner').length
  const recentMajorFinals = state.history.tournamentHistory.filter((entry) => isMajorCareerEvent(entry) && getTournamentHistoryFinishTier(entry) >= 4).length
  const recentWorldFinals = state.history.tournamentHistory.filter((entry) => /world championship/i.test(entry.tournamentName) && getTournamentHistoryFinishTier(entry) >= 4).length
  const recentMajorWins = state.history.tournamentHistory.filter((entry) => isMajorCareerEvent(entry) && entry.result === 'Winner').length
  const recentWorldWins = state.history.tournamentHistory.filter((entry) => /world championship/i.test(entry.tournamentName) && entry.result === 'Winner').length
  const careerRankingTitles = state.history.tournamentHistory.filter((entry) => entry.result === 'Winner' && isProfessionalEventType(entry.eventType)).length
  const careerMajorWins = state.history.tournamentHistory.filter((entry) => isMajorCareerEvent(entry) && entry.result === 'Winner').length
  const careerWorldWins = state.history.tournamentHistory.filter((entry) => /world championship/i.test(entry.tournamentName) && entry.result === 'Winner').length
  const championStatusMultiplier = /world champion/i.test(state.player.competitiveStatus ?? state.player.careerStage) ? 1.22 : 1
  const legacyMultiplier = 1
    + Math.min(0.28, careerRankingTitles * 0.012)
    + Math.min(0.32, careerMajorWins * 0.07)
    + Math.min(0.28, careerWorldWins * 0.16)
  const rankingMultiplier = ranking <= 1
    ? 2.9
    : ranking <= 4
      ? 2.35
      : ranking <= 8
        ? 2.05
        : accessBand === 'top16'
          ? 1.78
          : accessBand === 'top32'
            ? 1.36
            : accessBand === 'top64'
              ? 1.08
              : accessBand === 'bottomTour'
                ? 0.74
                : state.careerSystems.lateCareer.seniorActive
                  ? 0.46
                  : state.careerSystems.qTour.playerPoints > 0
                    ? 0.58
                    : ranking <= 32
                      ? 0.82
                      : 0.6
  const reputationMultiplier = clamp(0.84 + state.player.reputation / 165, 0.84, 1.5)
  const resultsMultiplier = 1
    + Math.min(0.35, recentTitles * 0.03)
    + Math.min(0.45, recentMajorFinals * 0.07)
    + Math.min(0.5, recentMajorWins * 0.12)
    + Math.min(0.38, recentWorldFinals * 0.12)
    + Math.min(0.6, recentWorldWins * 0.22)
  const volumeMultiplier = recentProProfile.latestSeasonMainTourEvents >= 8
    ? 1.12
    : recentProProfile.latestSeasonMainTourEvents >= 6
      ? 1.02
      : recentProProfile.latestSeasonMainTourEvents >= 4
        ? 0.86
        : 0.68
  const winProfileMultiplier = recentProProfile.latestSeasonProWins >= 8
    ? 1.18
    : recentProProfile.latestSeasonProWins >= 4
      ? 1.02
      : recentProProfile.latestSeasonProWins >= 2
        ? 0.84
        : 0.62
  const formMultiplier = recentProProfile.twoYearWinRate >= 0.5
    ? 1.16
    : recentProProfile.twoYearWinRate >= 0.35
      ? 1.04
      : recentProProfile.twoYearWinRate >= 0.2
        ? 0.9
        : 0.7
  const strengthMultiplier = effectiveStrength >= 150
    ? 1.16
    : effectiveStrength >= 120
      ? 1.08
      : effectiveStrength >= 80
        ? 1
        : 0.78
  const loadModifier = state.sponsors.length >= sponsorCapacity ? 0.96 : 1
  const normalizedOffers = buildSponsorOffers(state.sponsorOffers)
  return normalizedOffers.map((offer) => {
    if (offer.status !== 'Available') return offer

    const baseOffer = sponsorOfferCatalog.find((item) => item.id === offer.id) ?? offer
    const categoryModifier =
      baseOffer.category === 'Cue Maker' ? 0.04 :
      baseOffer.category === 'Social Media Partner' ? 0.06 :
      baseOffer.category === 'Clothing Sponsor' ? 0.05 : 0
    const rankingAccessReduction = ranking <= 1 ? 24 : accessBand === 'top16' ? 18 : accessBand === 'top32' ? 10 : accessBand === 'top64' ? 4 : accessBand === 'bottomTour' ? -2 : -8
    const fitAdjustment = ranking <= 8 ? 10 : accessBand === 'top16' ? 7 : accessBand === 'top32' ? 4 : accessBand === 'top64' ? 2 : -5
    const offTourPenalty = state.careerSystems.lateCareer.seniorActive ? -0.2 : accessBand === 'offTour' ? -0.14 : 0
    const marketMultiplier = clamp(rankingMultiplier * reputationMultiplier * resultsMultiplier * volumeMultiplier * winProfileMultiplier * formMultiplier * strengthMultiplier * championStatusMultiplier * legacyMultiplier * loadModifier + categoryModifier + offTourPenalty, 0.3, 5.8)
    const monthlyValue = roundToNearestFifty(baseOffer.monthlyValue * marketMultiplier)
    const minimumReputation = clamp(baseOffer.minimumReputation - rankingAccessReduction, 28, 92)
    const brandFit = clamp(baseOffer.brandFit + fitAdjustment + Math.round((state.player.confidence - 60) / 8), 35, 98)
    const tierNote = ranking <= 1
      ? 'World number one status is driving peak sponsor competition.'
      : recentWorldWins > 0
        ? 'World Championship success is sharply lifting commercial demand.'
        : accessBand === 'top16'
          ? 'Top-16 status and elite-event volume are lifting market demand.'
          : accessBand === 'top32'
            ? 'Current main-tour results are lifting sponsor confidence.'
            : accessBand === 'top64'
              ? 'Top-64 stability is starting to move commercial interest.'
              : state.careerSystems.lateCareer.seniorActive
                ? 'Senior-tour positioning limits sponsor upside unless reputation is exceptional.'
                : state.careerSystems.qTour.playerPoints > 0
                  ? 'Off-tour sponsor interest remains modest until main-tour status is secured.'
                  : baseOffer.note

    return {
      ...offer,
      monthlyValue,
      minimumReputation,
      brandFit,
      note: tierNote,
      tags: ranking <= 16 && !baseOffer.tags?.includes('Rising Stock')
        ? [...(baseOffer.tags ?? []), 'Rising Stock']
        : baseOffer.tags,
    }
  })
}

function createCareerSnapshot(state: GameState, label: string): CareerSnapshot {
  const completedTournamentResults = state.history.tournamentHistory
    .map((entry) => getTournamentHistoryCanonicalResult(entry))
    .filter((entry) => entry.matchesPlayed > 0)
  const wins = completedTournamentResults.reduce((sum, entry) => sum + entry.wins, 0)
  const losses = completedTournamentResults.reduce((sum, entry) => sum + entry.losses, 0)
  const matchesPlayed = completedTournamentResults.reduce((sum, entry) => sum + entry.matchesPlayed, 0)
  const totalPrizeMoney = completedTournamentResults.reduce((sum, entry) => sum + entry.prizeMoney, 0)
  const rankingDisplay = getDisplayedRanking(state)
  return {
    label,
    season: state.season,
    week: state.week,
    date: state.currentDate,
    ranking: rankingDisplay.ranking,
    rankingLabel: rankingDisplay.rankingLabel,
    cash: state.player.cash,
    confidence: state.player.confidence,
    fatigue: state.player.fatigue,
    morale: state.player.morale,
    reputation: state.player.reputation,
    sponsorCount: state.sponsors.length,
    matchesPlayed,
    wins,
    losses,
    totalPrizeMoney,
  }
}

function appendSnapshot(snapshots: CareerSnapshot[], snapshot: CareerSnapshot) {
  const withoutDuplicate = snapshots.filter((item) => !(item.week === snapshot.week && item.label === snapshot.label))
  return [...withoutDuplicate.slice(-(HISTORY_LIMIT - 1)), snapshot]
}

function appendMatchLog(matchLog: CareerMatchLogEntry[], entry: CareerMatchLogEntry) {
  return [entry, ...matchLog].slice(0, MATCH_LOG_LIMIT)
}

function withHistorySnapshot(state: GameState, label: string) {
  return {
    ...state,
    history: {
      ...state.history,
      snapshots: appendSnapshot(state.history.snapshots, createCareerSnapshot(state, label)),
    },
  }
}

function findSponsorOfferFromState(state: GameState, sponsorId: string) {
  return state.sponsorOffers.find((item) => item.id === sponsorId)
}

function improveAttribute(attributes: PlayerAttributes, label: string, delta: number) {
  for (const group of [attributes.technical, attributes.mental, attributes.physical]) {
    if (label in group) {
      group[label] = clamp(group[label] + delta, 1, 100)
      return
    }
  }
}

function adjustAttribute(group: Record<string, number>, label: string, delta: number) {
  if (!(label in group) || delta === 0) return
  group[label] = clamp(group[label] + delta, 1, 100)
}

function getSeasonalAgeRegressionProfile(age: number) {
  if (age < 35) {
    return { physical: 0, technical: 0, mental: 0 }
  }
  if (age <= 39) {
    return { physical: age % 2 === 0 ? -1 : 0, technical: 0, mental: 0 }
  }
  if (age <= 44) {
    return { physical: -1, technical: age % 3 === 0 ? -1 : 0, mental: 0 }
  }
  if (age <= 49) {
    return { physical: -2, technical: age % 2 === 0 ? -1 : 0, mental: 0 }
  }
  if (age <= 54) {
    return { physical: -2, technical: -1, mental: age % 2 === 0 ? -1 : 0 }
  }
  if (age <= 59) {
    return { physical: -3, technical: -1, mental: -1 }
  }
  if (age <= 64) {
    return { physical: -3, technical: -2, mental: -1 }
  }
  return { physical: -4, technical: -2, mental: -1 }
}

function applySeasonalAgeRegression(attributes: PlayerAttributes, age: number): PlayerAttributes {
  const profile = getSeasonalAgeRegressionProfile(age)
  const nextAttributes = deepCloneAttributes(attributes)
  const physicalLabels = ['Stamina', 'Recovery Rate', 'Shoulder Health', 'Hand Steadiness', 'Balance']
  const technicalLabels = ['Long Potting', 'Cue Ball Control', 'Break Building', 'Safety Play', 'Consistency']
  const mentalLabels = ['Focus', 'Composure', 'Resilience', 'Big Match Nerve']

  physicalLabels.forEach((label, index) => {
    const easedDelta = index >= 3 && profile.physical < -1 ? profile.physical + 1 : profile.physical
    adjustAttribute(nextAttributes.physical, label, easedDelta)
  })
  technicalLabels.forEach((label, index) => {
    const easedDelta = index >= 3 && profile.technical < -1 ? profile.technical + 1 : profile.technical
    adjustAttribute(nextAttributes.technical, label, easedDelta)
  })
  mentalLabels.forEach((label, index) => {
    const easedDelta = index >= 2 && profile.mental < 0 ? 0 : profile.mental
    adjustAttribute(nextAttributes.mental, label, easedDelta)
  })

  return nextAttributes
}

function getAttributeTrainingInterval(player: Player, attributes: PlayerAttributes) {
  const overall = calculateOverallRating({
    attributes,
    personalityTraits: player.personalityTraits,
    playingStyle: player.playingStyle,
  })

  if (player.age >= 65) return 44
  if (player.age >= 55) return 34
  if (player.age >= 45) return 24
  if (player.age >= 40) return 16
  if (player.age >= 35) return 10
  if (overall >= 90) return 12
  if (overall >= 85) return 9
  if (overall >= 80) return 7
  if (player.age <= 16) return 5
  if (player.age <= 20) return 4
  return 3
}

function getTrainingLabelSeed(label: string) {
  return label.split('').reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0)
}

function getVeteranDevelopmentOverallCeiling(age: number) {
  if (age >= 70) return 62
  if (age >= 65) return 65
  if (age >= 60) return 68
  if (age >= 55) return 71
  if (age >= 50) return 74
  if (age >= 45) return 78
  if (age >= 40) return 84
  if (age >= 35) return 90
  return 99
}

function getScaledTrainingGain(state: Pick<GameState, 'week' | 'player' | 'attributes'>, label: string, rawGain: number) {
  if (rawGain <= 0) return 0

  const overall = calculateOverallRating({
    attributes: state.attributes,
    personalityTraits: state.player.personalityTraits,
    playingStyle: state.player.playingStyle,
  })
  if (state.player.age >= 35 && overall >= getVeteranDevelopmentOverallCeiling(state.player.age) - 1) {
    return 0
  }

  const interval = getAttributeTrainingInterval(state.player, state.attributes)
  const labelSeed = getTrainingLabelSeed(label)
  const pulseDue = (state.week + labelSeed) % interval === 0
  const highLoadBonus = rawGain >= 5 && interval <= 4 && (state.week + labelSeed) % (interval * 2) === 0

  return pulseDue || highLoadBonus ? 1 : 0
}

function getSponsorWeeklyIncome(sponsors: SponsorDeal[]) {
  return Math.round(sponsors.reduce((sum, sponsor) => sum + sponsor.monthlyValue, 0) / 4)
}

function getCoachCost(coachContracts: CoachContract[]) {
  return coachContracts.reduce((sum, contract) => sum + contract.weeklyCost, 0)
}

function createCompetitionDefaultRow(playerName: string, nation: string, ranking: number): CompetitionTableRow {
  return {
    id: `comp-${playerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    playerName,
    nation,
    ranking,
    movement: 0,
    points: 0,
    prizeMoney: 0,
    highlighted: false,
    eventsPlayed: 0,
    titles: 0,
    wins: 0,
    losses: 0,
  }
}

function getPlayerProfessionalStatusNote(state: Pick<GameState, 'player' | 'careerSystems'>, ranking?: number | null) {
  if (state.careerSystems.lateCareer.veteranActive && state.careerSystems.pro.hasTourCard) return 'Veteran Pro'
  if (ranking != null && ranking <= TOP_16_RANK_CUTOFF) return 'Top 16'
  if (ranking != null && ranking <= TOP_32_RANK_CUTOFF) return 'Top 32'
  if (ranking != null && ranking <= TOP_64_RANK_CUTOFF) return 'Safe'
  if (ranking != null && ranking <= MAIN_TOUR_POOL_SIZE && state.careerSystems.pro.hasTourCard) return 'At Risk'
  if (state.careerSystems.pro.retainedViaRanking) return 'Retained Pro'

  switch (state.careerSystems.pro.survivalStatus) {
    case 'Bubble':
      return 'Bubble'
    case 'At Risk':
      return 'At Risk'
    case 'Rookie Year 1':
    case 'Rookie Year 2':
      return 'Rookie Pro'
    case 'Lost Card':
      return 'Lost Card'
    default:
      return state.careerSystems.pro.hasTourCard ? 'Rookie Pro' : 'Development'
  }
}

type ProTourAccessBand = 'top16' | 'top32' | 'top64' | 'bottomTour' | 'offTour'

type TournamentCircuitClass =
  | 'youth'
  | 'amateur'
  | 'qTour'
  | 'qSchool'
  | 'rookieQualifier'
  | 'ranking'
  | 'playersSeries'
  | 'eliteInvitational'
  | 'ukMajor'
  | 'worldChampionshipQualifying'
  | 'worldChampionshipMain'
  | 'senior'
  | 'exhibition'

type PlayerTournamentProfile = {
  worldRank: number
  accessBand: ProTourAccessBand
  primaryCircuit: CompetitionTableKey
  playerAge: number
  hasTourCard: boolean
  hasMainTourStatus: boolean
  isYouthEligible: boolean
  isEliteAmateur: boolean
  isQTourPathway: boolean
  isQSchoolPathway: boolean
  isRookieOrProtected: boolean
  isTop64: boolean
  isTop32: boolean
  isTop16: boolean
  isMajorContender: boolean
  isWorldChampion: boolean
  isSeniorCircuit: boolean
  isSeniorEligible: boolean
  competitiveStatus: string
  currentTier: string
}

type TournamentEntryAccess = {
  allowed: boolean
  accessBand: ProTourAccessBand
  seededProtection: number
  reason: string | null
}

function getRankAccessBandFromWorldRank(worldRank: number, hasTourCard: boolean): ProTourAccessBand {
  if (worldRank <= TOP_16_RANK_CUTOFF) return 'top16'
  if (worldRank <= TOP_32_RANK_CUTOFF) return 'top32'
  if (worldRank <= TOP_64_RANK_CUTOFF) return 'top64'
  if (worldRank <= MAIN_TOUR_POOL_SIZE && hasTourCard) return 'bottomTour'
  return 'offTour'
}

function getWorldRankForAccess(state: Pick<GameState, 'player' | 'careerSystems' | 'competitionTables'> & Partial<Pick<GameState, 'history'>>) {
  const rawWorldRank = state.careerSystems.pro.worldRank
    ?? state.competitionTables.world.find((row) => row.playerName === state.player.fullName)?.ranking
    ?? state.player.worldRanking
    ?? 999

  return Math.max(rawWorldRank, getHistoryPerformanceRankFloor(state.history))
}

function isWorldChampionshipQualifierTournament(tournament: Tournament) {
  return /world championship qualifying/i.test(tournament.name)
}

function isWorldChampionshipMainDrawTournament(tournament: Tournament) {
  return /world championship/i.test(tournament.name)
    && !/qualifying/i.test(tournament.name)
    && !/seniors world championship/i.test(tournament.name)
}

function isPlayersSeriesTournament(tournament: Pick<Tournament, 'name' | 'type'>) {
  return (tournament.type === 'Ranking' || tournament.type === 'Major' || tournament.type === 'Invitational')
    && /world grand prix|players championship|tour championship/i.test(tournament.name)
}

function getPlayersSeriesOneYearCutoff(tournament: Pick<Tournament, 'name'>) {
  if (/tour championship/i.test(tournament.name)) return 12
  if (/players championship/i.test(tournament.name)) return 16
  return 32
}

function getAmateurRouteAgeLimit(tournament: Tournament) {
  const text = `${tournament.name} ${tournament.format} ${tournament.unlockRequirement ?? ''}`.toLowerCase()
  if (/u16|under-?16/.test(text)) return 16
  if (/u18|under-?18/.test(text)) return 18
  if (/u21|under-?21|wsf junior/.test(text)) return 21
  return null
}

function isDirectAmateurTourCardRoute(tournament: Tournament) {
  if (tournament.type !== 'Amateur') return false
  if (/women/i.test(tournament.name)) return false
  return /tour card|wst card|professional tour card/i.test(tournament.reward ?? '')
}

function isOpenAdultOffTourQSchoolPlayer(state: Pick<GameState, 'player' | 'careerSystems'>) {
  return state.player.age >= 18
    && !state.careerSystems.pro.hasTourCard
    && (state.careerSystems.pro.worldRank ?? state.player.worldRanking ?? 999) > TOP_64_RANK_CUTOFF
}

function getTournamentCircuitClass(tournament: Tournament): TournamentCircuitClass {
  if (tournament.type === 'Junior' || tournament.type === 'Regional Youth' || tournament.type === 'National Youth') return 'youth'
  if (tournament.type === 'Amateur') return 'amateur'
  if (tournament.type === 'Q Tour') return 'qTour'
  if (tournament.type === 'Q School') return 'qSchool'
  if (tournament.type === 'Senior') return 'senior'
  if (tournament.type === 'Exhibition') return 'exhibition'
  if (isWorldChampionshipMainDrawTournament(tournament)) return 'worldChampionshipMain'
  if (isWorldChampionshipQualifierTournament(tournament)) return 'worldChampionshipQualifying'
  if (isPlayersSeriesTournament(tournament)) return 'playersSeries'
  if (tournament.type === 'Invitational') return 'eliteInvitational'
  if (tournament.type === 'Major' && /tour championship/i.test(tournament.name)) return 'eliteInvitational'
  if (tournament.type === 'Major' && /uk major|uk championship/i.test(tournament.name) && !/qualifying/i.test(tournament.name)) return 'ukMajor'
  if ((tournament.type === 'Professional Tour' || tournament.type === 'Major') && /qualifying|qualifier|rookie/i.test(tournament.name)) return 'rookieQualifier'
  return 'ranking'
}

function hasExplicitQSchoolEligibility(state: Pick<GameState, 'careerSystems'>) {
  return state.careerSystems.qSchool.cooldownSeasonsRemaining <= 0
    && (
      state.careerSystems.qSchool.campaignEligible
      || state.careerSystems.qSchool.seededCampaign
      || state.careerSystems.qSchool.directPlayoffEligible
    )
}

function getPlayerTournamentProfile(
  state: Pick<GameState, 'player' | 'careerSystems' | 'competitionTables' | 'history'>,
): PlayerTournamentProfile {
  const worldRank = getWorldRankForAccess(state)
  const accessBand = getRankAccessBandFromWorldRank(worldRank, state.careerSystems.pro.hasTourCard)
  const competitiveStatus = `${state.player.competitiveStatus ?? state.player.careerStage}`.toLowerCase()
  const currentTier = state.careerSystems.pro.currentTier.toLowerCase()
  const primaryCircuit = getPrimaryCompetitionKey(state)
  const hasTourCard = state.careerSystems.pro.hasTourCard
  const hasMainTourStatus = hasTourCard || worldRank <= TOP_64_RANK_CUTOFF
  const isEliteAmateur = !hasMainTourStatus && (
    primaryCircuit === 'amateur'
    || state.player.rankingLabel === 'Amateur Ranking'
    || /elite amateur|amateur/.test(state.player.careerStage.toLowerCase())
  )
  const isQTourPathway = !hasMainTourStatus && (
    primaryCircuit === 'qTour'
    || state.careerSystems.qTour.playerPoints > 0
    || /q tour/.test(currentTier)
    || /q tour/.test(competitiveStatus)
  )
  const isQSchoolPathway = !hasMainTourStatus && hasExplicitQSchoolEligibility(state)
  const isYouthEligible = state.player.age <= 21 && !hasMainTourStatus && (
    primaryCircuit === 'youth'
    || /junior|youth/.test(state.player.careerStage.toLowerCase())
    || isEliteAmateur
  )

  return {
    worldRank,
    accessBand,
    primaryCircuit,
    playerAge: state.player.age,
    hasTourCard,
    hasMainTourStatus,
    isYouthEligible,
    isEliteAmateur,
    isQTourPathway,
    isQSchoolPathway,
    isRookieOrProtected: hasTourCard && (
      state.careerSystems.pro.currentYear <= 2
      || state.careerSystems.pro.yearsRemaining > 0
      || /rookie/.test(currentTier)
      || /at risk|bubble/.test(competitiveStatus)
    ),
    isTop64: worldRank <= TOP_64_RANK_CUTOFF,
    isTop32: worldRank <= TOP_32_RANK_CUTOFF,
    isTop16: worldRank <= TOP_16_RANK_CUTOFF,
    isMajorContender: /major contender/.test(competitiveStatus),
    isWorldChampion: /world champion/.test(competitiveStatus),
    isSeniorCircuit: state.careerSystems.lateCareer.seniorActive || state.careerSystems.lateCareer.legendStatus,
    isSeniorEligible: state.player.age >= 40 && !hasMainTourStatus,
    competitiveStatus,
    currentTier,
  }
}

function isMainTourEventType(tournament: Tournament) {
  return tournament.type === 'Professional Tour'
    || tournament.type === 'Ranking'
    || tournament.type === 'Major'
    || tournament.type === 'Invitational'
    || tournament.eventClass === 'Professional'
}

function getProTourAccessBand(state: Pick<GameState, 'player' | 'careerSystems' | 'competitionTables'> & Partial<Pick<GameState, 'history'>>): ProTourAccessBand {
  const worldRank = getWorldRankForAccess(state)

  return getRankAccessBandFromWorldRank(worldRank, state.careerSystems.pro.hasTourCard)
}

function getSeededProtectionForBand(accessBand: ProTourAccessBand) {
  switch (accessBand) {
    case 'top16':
      return 3
    case 'top32':
      return 2
    case 'top64':
      return 1
    default:
      return 0
  }
}

export function getTournamentEntryAccess(
  state: Pick<GameState, 'player' | 'careerSystems' | 'competitionTables' | 'history'>,
  tournament: Tournament,
): TournamentEntryAccess {
  const profile = getPlayerTournamentProfile(state)
  const accessBand = profile.accessBand
  const seededProtection = getSeededProtectionForBand(accessBand)
  const hasMajorWin = state.history.tournamentHistory.some((entry) => /major|world championship|masters|tour championship/i.test(entry.tournamentName) && entry.result === 'Winner')
  const tournamentClass = getTournamentCircuitClass(tournament)

  if (state.careerSystems.lateCareer.retired) {
    return {
      allowed: false,
      accessBand,
      seededProtection,
      reason: 'This player is retired from competitive events.',
    }
  }

  if (profile.isTop16 && /qualifier|qualifying/i.test(tournament.name) && !isWorldChampionshipQualifierTournament(tournament)) {
    return {
      allowed: false,
      accessBand,
      seededProtection,
      reason: 'Top-16 main-tour players should enter the main draw directly rather than qualifier routes.',
    }
  }

  switch (tournamentClass) {
    case 'youth': {
      const allowed = profile.isYouthEligible
      return { allowed, accessBand, seededProtection: 0, reason: allowed ? null : 'Youth events are limited to youth-phase and age-eligible off-tour players.' }
    }
    case 'amateur': {
      const ageLimit = getAmateurRouteAgeLimit(tournament)
      const directCardRoute = isDirectAmateurTourCardRoute(tournament)
      const ageEligible = ageLimit == null
        ? state.player.age >= 16
        : state.player.age <= ageLimit
      const allowed = ageEligible && !profile.hasMainTourStatus && (
        profile.isEliteAmateur
        || profile.isQTourPathway
        || profile.isQSchoolPathway
        || profile.primaryCircuit === 'amateur'
        || profile.primaryCircuit === 'youth'
        || profile.isSeniorCircuit
        || directCardRoute
        || ageLimit != null
      )
      const reason = ageLimit != null
        ? `This route is limited to age-eligible off-tour players under the event age limit (${ageLimit}).`
        : directCardRoute
          ? 'Direct-card amateur routes are for eligible off-tour amateurs in good standing.'
          : 'Amateur events are for off-tour amateur, Q Tour, Q School, and youth pathway players.'
      return { allowed, accessBand, seededProtection: 0, reason: allowed ? null : reason }
    }
    case 'qTour': {
      const allowed = state.player.age >= 18 && !profile.hasMainTourStatus && (
        profile.isQTourPathway
        || profile.isEliteAmateur
        || profile.primaryCircuit === 'amateur'
      )
      return { allowed, accessBand, seededProtection: 0, reason: allowed ? null : 'Q Tour is reserved for amateur and off-tour pre-pro pathways.' }
    }
    case 'qSchool': {
      const allowed = isOpenAdultOffTourQSchoolPlayer(state) && !/review|order of merit/i.test(tournament.name)
      return { allowed, accessBand, seededProtection: 0, reason: allowed ? null : 'Q School is open to eligible adult off-tour players who can fund entry and remain in good standing.' }
    }
    case 'senior': {
      const allowed = state.player.age >= 40 && !profile.hasMainTourStatus
      return { allowed, accessBand, seededProtection: 0, reason: allowed ? null : 'Senior events require age 40+ and no active main-tour card or top-64 standing.' }
    }
    case 'exhibition': {
      const allowed = state.player.age >= 40 || state.player.reputation >= 70 || profile.hasMainTourStatus || profile.isEliteAmateur || profile.isSeniorCircuit
      return { allowed, accessBand, seededProtection, reason: allowed ? null : 'This exhibition is aimed at invited amateur, pro, veteran, or high-reputation players.' }
    }
    case 'worldChampionshipMain': {
      if (tournament.seasonOpenAccessLock === 'worldMainDraw') {
        return { allowed: true, accessBand, seededProtection, reason: null }
      }

      if (tournament.seasonOpenAccessLock === 'worldQualifying') {
        return { allowed: false, accessBand, seededProtection, reason: 'Season-open access placed this player in the World Championship qualifying route.' }
      }

      const allowed = profile.hasMainTourStatus && (profile.isTop16 || profile.isWorldChampion || profile.isMajorContender)
      return { allowed, accessBand, seededProtection, reason: allowed ? null : 'Only Top 16 or proven elite contenders enter the World Championship main draw directly.' }
    }
    case 'worldChampionshipQualifying': {
      if (tournament.seasonOpenAccessLock === 'worldMainDraw') {
        return { allowed: false, accessBand, seededProtection, reason: 'Season-open access locked this player into the World Championship main draw.' }
      }

      if (tournament.seasonOpenAccessLock === 'worldQualifying') {
        const allowed = profile.hasMainTourStatus && profile.worldRank <= MAIN_TOUR_POOL_SIZE
        return { allowed, accessBand, seededProtection, reason: allowed ? null : 'World Championship qualifying is locked to the player’s season-open route.' }
      }

      const allowed = profile.hasMainTourStatus && !profile.isTop16 && profile.worldRank <= MAIN_TOUR_POOL_SIZE
      return { allowed, accessBand, seededProtection, reason: allowed ? null : 'World Championship qualifying is for ranks 17-128 with active main-tour status.' }
    }
    case 'eliteInvitational': {
      if (/masters-style|elite season opener/i.test(tournament.name)) {
        const allowed = profile.isTop16 || profile.isMajorContender || profile.isWorldChampion
        return { allowed, accessBand, seededProtection, reason: allowed ? null : 'This elite invitational is reserved for top-16 and proven elite players.' }
      }

      if (/champion of champions/i.test(tournament.name)) {
        const allowed = profile.isTop16 || hasMajorWin || profile.isWorldChampion
        return { allowed, accessBand, seededProtection, reason: allowed ? null : 'Champion-style invitationals require Top 16 status or a title-winning route.' }
      }

      if (/tour championship/i.test(tournament.name)) {
        const allowed = profile.worldRank <= 12 || profile.isMajorContender || profile.isWorldChampion
        return { allowed, accessBand, seededProtection, reason: allowed ? null : 'This elite final-field event is reserved for top-end main-tour contenders.' }
      }

      const allowed = profile.isTop16 || profile.isTop32
      return { allowed, accessBand, seededProtection, reason: allowed ? null : 'This invitational is limited to upper main-tour seeds.' }
    }
    case 'playersSeries': {
      const oneYearRank = state.careerSystems.pro.oneYearRank
        ?? getCompetitionRowForPlayer(state.competitionTables, 'oneYear', state.player.fullName)?.ranking
        ?? 999
      const cutoff = getPlayersSeriesOneYearCutoff(tournament)
      const allowed = profile.hasMainTourStatus && oneYearRank <= cutoff
      return { allowed, accessBand, seededProtection, reason: allowed ? null : `This Players Series event is restricted to the top ${cutoff} on the one-year list.` }
    }
    case 'ukMajor': {
      const allowed = profile.hasMainTourStatus && profile.worldRank <= MAIN_TOUR_POOL_SIZE
      return { allowed, accessBand, seededProtection, reason: allowed ? null : 'UK-style majors are open to active main-tour players only.' }
    }
    case 'rookieQualifier': {
      const allowed = profile.hasMainTourStatus
        && profile.worldRank <= MAIN_TOUR_POOL_SIZE
        && !(profile.isTop16 && /qualifying|qualifier/i.test(tournament.name))
      return { allowed, accessBand, seededProtection, reason: allowed ? null : 'Qualifier routes are for active main-tour players outside direct top-16 seeded protection.' }
    }
    case 'ranking': {
      const allowed = profile.hasMainTourStatus && profile.worldRank <= MAIN_TOUR_POOL_SIZE
      return { allowed, accessBand, seededProtection, reason: allowed ? null : 'Ranking events require active main-tour status or retained Top 64 standing.' }
    }
    default:
      return { allowed: false, accessBand, seededProtection: 0, reason: 'This event is not open from the current pathway.' }
  }
}

function isEliteHostedMainDrawTournament(tournament: Tournament) {
  if (isWorldChampionshipQualifierTournament(tournament)) {
    return false
  }

  return isWorldChampionshipMainDrawTournament(tournament)
    || (/masters|uk major|uk championship|tour championship|champion of champions/i.test(tournament.name) && tournament.type !== 'Q School')
    || (tournament.type === 'Invitational' && /elite|masters-style/i.test(tournament.name))
}

export function getTournamentEntryCashRequirement(
  state: Pick<GameState, 'player' | 'careerSystems' | 'competitionTables' | 'history'>,
  tournament: Tournament,
) {
  const entryAccess = getTournamentEntryAccess(state, tournament)
  if (entryAccess.allowed && entryAccess.accessBand === 'top16' && isEliteHostedMainDrawTournament(tournament)) {
    if (isWorldChampionshipMainDrawTournament(tournament)) {
      return 0
    }

    return Math.round(tournament.entryFee * 0.15)
  }

  return tournament.entryFee
}

function shouldPlayerBeInWorldTable(state: Pick<GameState, 'player' | 'careerSystems' | 'competitionTables' | 'tournaments'>) {
  return state.careerSystems.pro.hasTourCard
    || (state.careerSystems.pro.worldRank ?? 999) <= TOP_64_RANK_CUTOFF
}

function buildPlayerCompetitionRowForTable(
  state: Pick<GameState, 'player' | 'careerSystems' | 'competitionTables' | 'worldPlayers'>,
  tableKey: 'world' | 'oneYear',
  rows: CompetitionTableRow[],
) {
  const existingWorldRow = getCompetitionRowForPlayer(state.competitionTables, 'world', state.player.fullName)
  const existingOneYearRow = getCompetitionRowForPlayer(state.competitionTables, 'oneYear', state.player.fullName)
  const playerWorldRecord = state.worldPlayers.find((record) => record.playerName === state.player.fullName)
  const currentRow = rows.find((row) => row.playerName === state.player.fullName)
  const companionRow = tableKey === 'world' ? existingOneYearRow : existingWorldRow
  const bestKnownRanking = tableKey === 'world'
    ? existingWorldRow?.ranking ?? state.careerSystems.pro.worldRank ?? state.player.worldRanking ?? null
    : existingOneYearRow?.ranking ?? state.careerSystems.pro.oneYearRank ?? null
  const fallbackEvents = currentRow?.eventsPlayed
    ?? companionRow?.eventsPlayed
    ?? (tableKey === 'world' ? 0 : 0)
  const fallbackWins = currentRow?.wins ?? companionRow?.wins ?? 0
  const fallbackLosses = currentRow?.losses ?? companionRow?.losses ?? Math.max(0, fallbackEvents - fallbackWins)

  return {
    ...createCompetitionDefaultRow(state.player.fullName, getNationCode(state.player.nationality), rows.length + 1),
    ...(currentRow ?? companionRow ?? {}),
    playerName: state.player.fullName,
    nation: getNationCode(state.player.nationality),
    points: Math.max(0, currentRow?.points ?? companionRow?.points ?? 0),
    prizeMoney: Math.max(0, currentRow?.prizeMoney ?? companionRow?.prizeMoney ?? (tableKey === 'world' ? 0 : 0)),
    eventsPlayed: fallbackEvents,
    wins: fallbackWins,
    losses: fallbackLosses,
    titles: Math.max(0, currentRow?.titles ?? companionRow?.titles ?? 0),
    statusNote: getPlayerProfessionalStatusNote(state, bestKnownRanking ?? playerWorldRecord?.highestWorldRank ?? null),
  }
}

function ensurePlayerInCompetitionTable(
  state: Pick<GameState, 'player' | 'careerSystems' | 'competitionTables' | 'worldPlayers' | 'tournaments'>,
  tableKey: CompetitionTableKey,
): CompetitionTablesState {
  const dedupedRows = state.competitionTables[tableKey].filter((row, index, rows) => rows.findIndex((entry) => entry.playerName === row.playerName) === index)

  if (tableKey !== 'world' && tableKey !== 'oneYear') {
    return {
      ...state.competitionTables,
      [tableKey]: rerankCompetitionRows(dedupedRows, state.player.fullName),
    }
  }

  const shouldHaveWorldRow = shouldPlayerBeInWorldTable(state)
  const withoutPlayer = dedupedRows.filter((row) => row.playerName !== state.player.fullName)
  const rebuiltPlayerRow = shouldHaveWorldRow
    ? buildPlayerCompetitionRowForTable(state, tableKey, dedupedRows)
    : null
  const nextRows = shouldHaveWorldRow
    ? [...withoutPlayer, rebuiltPlayerRow!]
    : withoutPlayer

  return {
    ...state.competitionTables,
    [tableKey]: rerankCompetitionRows(nextRows, state.player.fullName),
  }
}

function updateCompetitionTableRows(
  rows: CompetitionTableRow[],
  playerName: string,
  playerNation: string,
  opponentName: string,
  opponentNation: string,
  playerPointsDelta: number,
  playerPrizeDelta: number,
  opponentPointsDelta: number,
  opponentPrizeDelta: number,
  won: boolean,
  playerWonTitle: boolean,
  opponentWonTitle: boolean,
  statusNote?: string,
) {
  let nextRows = [...rows]

  if (!nextRows.some((row) => row.playerName === playerName)) {
    nextRows.push(createCompetitionDefaultRow(playerName, playerNation, nextRows.length + 1))
  }

  if (!nextRows.some((row) => row.playerName === opponentName)) {
    nextRows.push(createCompetitionDefaultRow(opponentName, opponentNation, nextRows.length + 1))
  }

  nextRows = nextRows.map((row) => {
    if (row.playerName === playerName) {
      return {
        ...row,
        points: row.points + playerPointsDelta,
        prizeMoney: row.prizeMoney + playerPrizeDelta,
        eventsPlayed: row.eventsPlayed + 1,
        wins: row.wins + (won ? 1 : 0),
        losses: row.losses + (won ? 0 : 1),
        titles: row.titles + (playerWonTitle ? 1 : 0),
        statusNote,
      }
    }

    if (row.playerName === opponentName) {
      return {
        ...row,
        points: row.points + opponentPointsDelta,
        prizeMoney: row.prizeMoney + opponentPrizeDelta,
        eventsPlayed: row.eventsPlayed + 1,
        wins: row.wins + (won ? 0 : 1),
        losses: row.losses + (won ? 1 : 0),
        titles: row.titles + (opponentWonTitle ? 1 : 0),
      }
    }

    return row
  })

  return rerankCompetitionRows(nextRows, playerName)
}

function updateCompetitionTables(
  tables: CompetitionTablesState,
  tournament: Tournament,
  player: Player,
  opponentName: string,
  opponentNation: string,
  playerPointsDelta: number,
  playerPrizeDelta: number,
  opponentPointsDelta: number,
  opponentPrizeDelta: number,
  won: boolean,
  playerWonTitle: boolean,
  opponentWonTitle: boolean,
  statusNote?: string,
) {
  const keys = getCompetitionKeysForTournament(tournament)
  if (keys.length === 0) return tables

  return keys.reduce<CompetitionTablesState>((nextTables, key) => ({
    ...nextTables,
    [key]: updateCompetitionTableRows(
      nextTables[key],
      player.fullName,
      getNationCode(player.nationality),
      opponentName,
      opponentNation,
      playerPointsDelta,
      key === 'qSchool' ? 0 : playerPrizeDelta,
      opponentPointsDelta,
      key === 'qSchool' ? 0 : opponentPrizeDelta,
      won,
      playerWonTitle,
      opponentWonTitle,
      statusNote,
    ),
  }), tables)
}

function seedCompetitionTableForStartingLevel(rows: CompetitionTableRow[], playerName: string, level: NewCareerStartingLevel) {
  const sortedRows = [...rows].sort((left, right) => left.ranking - right.ranking)
  const targetIndex = Math.max(0, Math.min(sortedRows.length - 1, level.targetRanking - 1))
  const higherPoints = targetIndex > 0 ? sortedRows[targetIndex - 1]?.points ?? level.targetPoints + 24 : level.targetPoints + 24
  const lowerPoints = sortedRows[targetIndex]?.points ?? level.targetPoints
  const seededPoints = targetIndex === 0 ? Math.max(level.targetPoints, higherPoints) : Math.max(level.targetPoints, Math.round((higherPoints + lowerPoints) / 2))
  const seededEvents = Math.max(3, 15 - level.targetRanking)
  const seededWins = Math.max(1, seededEvents - Math.max(2, Math.floor(level.targetRanking / 2)))

  return rerankCompetitionRows(
    rows.map((row) =>
      row.playerName === playerName
        ? {
            ...row,
            points: seededPoints,
            prizeMoney: Math.max(row.prizeMoney, Math.round(seededPoints * (level.competitionTable === 'qTour' ? 0.4 : 0.2))),
            eventsPlayed: seededEvents,
            wins: seededWins,
            losses: Math.max(0, seededEvents - seededWins),
            titles: level.targetRanking <= 6 ? 1 : 0,
            statusNote: `Starting at ${level.name}`,
          }
        : row,
    ),
    playerName,
  )
}

function applyStartingLevelToCompetitionTables(tables: CompetitionTablesState, playerName: string, level: NewCareerStartingLevel): CompetitionTablesState {
  const removePlayerFromTable = (rows: CompetitionTableRow[]) => rerankCompetitionRows(rows.filter((row) => row.playerName !== playerName), playerName)
  const worldRows = level.competitionTable === 'world' ? seedCompetitionTableForStartingLevel(tables.world, playerName, level) : removePlayerFromTable(tables.world)
  const oneYearRows = level.competitionTable === 'world' ? seedCompetitionTableForStartingLevel(tables.oneYear, playerName, level) : removePlayerFromTable(tables.oneYear)

  return {
    world: worldRows,
    oneYear: oneYearRows,
    amateur: level.competitionTable === 'amateur' ? seedCompetitionTableForStartingLevel(tables.amateur, playerName, level) : removePlayerFromTable(tables.amateur),
    qTour: level.competitionTable === 'qTour' ? seedCompetitionTableForStartingLevel(tables.qTour, playerName, level) : removePlayerFromTable(tables.qTour),
    qSchool: level.competitionTable === 'qSchool' ? seedCompetitionTableForStartingLevel(tables.qSchool, playerName, level) : removePlayerFromTable(tables.qSchool),
    senior: level.competitionTable === 'senior' ? seedCompetitionTableForStartingLevel(tables.senior, playerName, level) : removePlayerFromTable(tables.senior),
    youth: level.competitionTable === 'youth' ? seedCompetitionTableForStartingLevel(tables.youth, playerName, level) : removePlayerFromTable(tables.youth),
  }
}

function getCompetitionRowsForTournament(state: GameState, tournament: Tournament) {
  const key = getCompetitionKeysForTournament(tournament)[0]
  return key ? state.competitionTables[key] : state.rankings
}

function getPrimaryCompetitionKey(state: Pick<GameState, 'careerSystems' | 'player'> & Partial<Pick<GameState, 'competitionTables'>>): CompetitionTableKey {
  const hasActiveQSchoolRoute = state.careerSystems.qSchool.campaignEligible
    || state.careerSystems.qSchool.seededCampaign
    || state.careerSystems.qSchool.directPlayoffEligible
    || !!state.competitionTables?.qSchool.some((row) => row.playerName === state.player.fullName)
  if (state.careerSystems.lateCareer.seniorActive) return 'senior'
  if (state.careerSystems.pro.hasTourCard || (state.careerSystems.pro.worldRank ?? 999) <= 64) return 'world'
  if (hasActiveQSchoolRoute && !state.careerSystems.pro.hasTourCard) return 'qSchool'
  if ((state.player.rankingLabel === 'Youth Ranking' || /junior|youth/i.test(state.player.careerStage)) && state.player.age <= 21) return 'youth'
  if (state.careerSystems.qTour.playerPoints > 0 || state.player.careerStage.toLowerCase().includes('q tour')) return 'qTour'
  if (state.player.rankingLabel === 'Amateur Ranking') return 'amateur'
  if (state.player.age < 18) return 'youth'
  return 'amateur'
}

function getWorldRankingAgeDecayMultiplier(row: CompetitionTableRow, record?: WorldPlayerRecord) {
  if (!record || record.age <= 34) return 1

  const matchesPlayed = row.wins + row.losses
  const winRate = matchesPlayed > 0 ? row.wins / matchesPlayed : 0
  const currentEliteRun = row.titles > 0 || (matchesPlayed >= 8 && row.wins >= 5 && winRate >= 0.48)
  const legacyEliteRelief = !currentEliteRun && ((record.highestWorldRank ?? 999) <= TOP_16_RANK_CUTOFF || record.majorTitles > 0 || record.titles >= 4)
  const baseMultiplier = record.age <= 39
    ? 0.98 - (record.age - 35) * 0.015
    : record.age <= 44
      ? 0.86 - (record.age - 40) * 0.05
      : record.age <= 49
        ? 0.46 - (record.age - 45) * 0.055
        : Math.max(0.06, 0.18 - Math.min(10, record.age - 50) * 0.018)
  const relief = currentEliteRun ? 0.16 : legacyEliteRelief ? 0.08 : 0

  return Math.min(1, Math.max(0.08, baseMultiplier + relief))
}

function applyWorldRankingDecay(row: CompetitionTableRow, record?: WorldPlayerRecord) {
  const matchesPlayed = row.wins + row.losses
  const winRate = matchesPlayed > 0 ? row.wins / matchesPlayed : 0
  const basePointsDecay = row.ranking <= 4
    ? 0.94
    : row.ranking <= 16
      ? 0.9
      : row.ranking <= 32
        ? 0.86
        : row.ranking <= 64
          ? 0.8
          : 0.68
  const basePrizeDecay = row.ranking <= 4
    ? 0.92
    : row.ranking <= 16
      ? 0.88
      : row.ranking <= 32
        ? 0.84
        : row.ranking <= 64
          ? 0.76
          : 0.62
  const inactivityPenalty = matchesPlayed < 6 ? (row.ranking <= 16 ? 0.92 : 0.78) : 1
  const poorRunPenalty = matchesPlayed >= 6 && winRate < 0.35 ? (row.ranking <= 16 ? 0.88 : 0.74) : 1
  const titleRetention = row.titles > 0 ? 1.08 : 1
  const eliteStabilityBonus = row.ranking <= 16 && matchesPlayed >= 8 && winRate >= 0.45 ? 1.06 : 1
  const ageDecay = getWorldRankingAgeDecayMultiplier(row, record)
  const pointsDecay = basePointsDecay * inactivityPenalty * poorRunPenalty * titleRetention * eliteStabilityBonus * ageDecay
  const prizeDecay = basePrizeDecay * inactivityPenalty * poorRunPenalty * titleRetention * ageDecay

  return {
    ...row,
    points: Math.max(0, Math.round(row.points * pointsDecay)),
    prizeMoney: Math.max(0, Math.round(row.prizeMoney * prizeDecay)),
    eventsPlayed: Math.max(0, Math.round(row.eventsPlayed * 0.5)),
    wins: Math.max(0, Math.round(row.wins * 0.55)),
    losses: Math.max(0, Math.round(row.losses * 0.55)),
    titles: row.titles > 0 ? 1 : 0,
    statusNote: undefined,
  }
}

function resetSeasonalCompetitionRows(rows: CompetitionTableRow[], playerName: string) {
  return rows.map((row, index) => ({
    ...row,
    ranking: index + 1,
    movement: 0,
    points: 0,
    prizeMoney: 0,
    highlighted: row.playerName === playerName,
    eventsPlayed: 0,
    titles: 0,
    wins: 0,
    losses: 0,
    statusNote: undefined,
  }))
}

function movePlayerToMinimumRank(rows: CompetitionTableRow[], playerName: string, minimumRank: number) {
  const currentIndex = rows.findIndex((row) => row.playerName === playerName)
  if (currentIndex === -1 || currentIndex + 1 >= minimumRank) {
    return rows
  }

  const nextRows = [...rows]
  const [playerRow] = nextRows.splice(currentIndex, 1)
  const targetIndex = Math.min(nextRows.length, Math.max(0, minimumRank - 1))
  const targetRow = nextRows[targetIndex] ?? nextRows.at(-1)
  const cappedPoints = targetRow
    ? Math.min(playerRow.points, Math.max(0, targetRow.points - 1))
    : playerRow.points
  const cappedPrizeMoney = targetRow
    ? Math.min(playerRow.prizeMoney, Math.max(0, targetRow.prizeMoney - 1))
    : playerRow.prizeMoney

  nextRows.splice(targetIndex, 0, {
    ...playerRow,
    points: cappedPoints,
    prizeMoney: cappedPrizeMoney,
    statusNote: playerRow.statusNote ?? 'Ranking proof required',
  })

  return nextRows.map((row, index) => ({
    ...row,
    ranking: index + 1,
    movement: row.ranking - (index + 1),
    highlighted: row.playerName === playerName,
  }))
}

function getPathwayRankProofFloor(key: CompetitionTableKey, seasonRecord: CareerSeasonRecord, age: number) {
  if (key === 'world' || key === 'oneYear' || key === 'senior') return 1

  const matches = seasonRecord.wins + seasonRecord.losses
  const winRate = matches > 0 ? seasonRecord.wins / matches : 0
  const hasTitle = seasonRecord.titles > 0 || seasonRecord.qTourWins > 0 || seasonRecord.qSchoolCardsWon > 0
  const losingNoTitleSeason = matches >= 8 && seasonRecord.wins <= seasonRecord.losses && !hasTitle
  const lowWinNoTitleSeason = matches >= 8 && winRate < 0.45 && !hasTitle
  const thinEvidenceSeason = matches < 8 && !hasTitle

  if (key === 'youth') {
    if (age <= 16 && losingNoTitleSeason) return 16
    if (losingNoTitleSeason || lowWinNoTitleSeason) return 12
    if (thinEvidenceSeason) return 8
    if (!hasTitle && winRate < 0.55) return 4
    return 1
  }

  if (key === 'amateur') {
    if (losingNoTitleSeason || lowWinNoTitleSeason) return 18
    if (thinEvidenceSeason) return 12
    if (!hasTitle && winRate < 0.55) return 6
    return 1
  }

  if (key === 'qTour') {
    if (losingNoTitleSeason || lowWinNoTitleSeason) return 20
    if (thinEvidenceSeason) return 14
    if (!hasTitle && winRate < 0.55) return 8
    return 1
  }

  if (key === 'qSchool') {
    if (seasonRecord.qSchoolCardsWon > 0) return 1
    if (losingNoTitleSeason || lowWinNoTitleSeason) return 14
    if (thinEvidenceSeason) return 10
    if (!hasTitle && winRate < 0.6) return 5
  }

  return 1
}

function enforcePathwayRankingProofFloors(
  tables: CompetitionTablesState,
  playerName: string,
  seasonRecord: CareerSeasonRecord,
  age: number,
): CompetitionTablesState {
  return COMPETITION_TABLE_KEYS.reduce<CompetitionTablesState>((nextTables, key) => {
    const floor = getPathwayRankProofFloor(key, seasonRecord, age)
    if (floor <= 1) return nextTables

    return {
      ...nextTables,
      [key]: movePlayerToMinimumRank(nextTables[key], playerName, floor),
    }
  }, tables)
}

function initializeCompetitionTablesForNewCareer(
  tables: CompetitionTablesState,
  playerName: string,
  level: NewCareerStartingLevel,
): CompetitionTablesState {
  const rankRows = (rows: CompetitionTableRow[]) => rerankCompetitionRows(rows, playerName)
  const primaryRows = rankRows(tables[level.competitionTable]).map((row) => (
    row.playerName === playerName
      ? {
          ...row,
          statusNote: `Starting at ${level.name}`,
        }
      : row
  ))

  return {
    world: level.competitionTable === 'world' ? primaryRows : rankRows(tables.world),
    oneYear: level.competitionTable === 'world' ? rankRows(tables.oneYear).map((row) => row.playerName === playerName ? { ...row, statusNote: `Starting at ${level.name}` } : row) : rankRows(tables.oneYear),
    amateur: level.competitionTable === 'amateur' ? primaryRows : rankRows(tables.amateur),
    qTour: level.competitionTable === 'qTour' ? primaryRows : rankRows(tables.qTour),
    qSchool: level.competitionTable === 'qSchool' ? primaryRows : rankRows(tables.qSchool),
    senior: level.competitionTable === 'senior' ? primaryRows : rankRows(tables.senior),
    youth: level.competitionTable === 'youth' ? primaryRows : rankRows(tables.youth),
  }
}

function getNextUpcomingTournament(state: Pick<GameState, 'tournaments' | 'currentDate'>) {
  const isCurrentOrUpcomingEvent = (event: Tournament) => (event.endDate ?? event.startDate) >= state.currentDate

  return state.tournaments.find((event) => event.status === 'Entered' && isCurrentOrUpcomingEvent(event))
    ?? state.tournaments.find((event) => (event.status === 'Booked' || event.status === 'Available' || event.status === 'High Cost') && isCurrentOrUpcomingEvent(event))
    ?? state.tournaments[0]
}

function continueToNextTournamentState(previousState: GameState) {
  const initialTarget = getNextUpcomingTournament(previousState)
  if (!initialTarget) {
    return finalizeState(previousState, 'No upcoming tournament is available to advance toward.')
  }

  if ((previousState.player.daysUntilEvent ?? 0) <= 7) {
    return finalizeState(previousState, `${initialTarget.name} is already within the current tournament week.`)
  }

  let nextState = previousState
  let iterations = 0

  while (iterations < 52) {
    const target = getNextUpcomingTournament(nextState)
    if (!target) break
    if ((nextState.player.daysUntilEvent ?? 0) <= 7) break

    nextState = advanceWeekState(nextState)
    iterations += 1

    if (nextState.liveMatch?.status === 'In Progress') break
    if (target.id !== getNextUpcomingTournament(nextState)?.id && (nextState.player.daysUntilEvent ?? 0) <= 7) break
  }

  const arrivedTarget = getNextUpcomingTournament(nextState)
  if (!arrivedTarget) {
    return finalizeState(nextState, `Advanced ${iterations} week${iterations === 1 ? '' : 's'} with no upcoming tournament now selected.`)
  }

  return finalizeState(
    nextState,
    `Advanced ${iterations} week${iterations === 1 ? '' : 's'} to the ${arrivedTarget.name} tournament week.`,
  )
}

function rollCompetitionTablesForward(tables: CompetitionTablesState, playerName: string, worldPlayers: WorldPlayerRecord[] = []): CompetitionTablesState {
  const worldPlayersByName = new Map(worldPlayers.map((record) => [record.playerName, record]))

  return {
    world: tables.world.map((row, index) => ({
      ...applyWorldRankingDecay(row, worldPlayersByName.get(row.playerName)),
      ranking: index + 1,
      movement: 0,
      highlighted: row.playerName === playerName,
    })),
    oneYear: resetSeasonalCompetitionRows(tables.oneYear, playerName),
    amateur: resetSeasonalCompetitionRows(tables.amateur, playerName),
    qTour: resetSeasonalCompetitionRows(tables.qTour, playerName),
    qSchool: resetSeasonalCompetitionRows(tables.qSchool, playerName),
    senior: resetSeasonalCompetitionRows(tables.senior, playerName),
    youth: resetSeasonalCompetitionRows(tables.youth, playerName),
  }
}

function getWeightedRecentSeasonValue(record: WorldPlayerRecord, selector: (season: WorldPlayerSeasonRecord) => number) {
  const weights = [1, 0.45, 0.18, 0.08]

  return record.seasons
    .slice(0, weights.length)
    .reduce((sum, season, index) => sum + selector(season) * weights[index], 0)
}

function getRecentSeasonStat(
  record: WorldPlayerRecord,
  selector: (season: WorldPlayerSeasonRecord) => number,
  fallback = 0,
  currentValue?: number,
) {
  const latestArchivedValue = record.seasons[0] ? selector(record.seasons[0]) : fallback
  if (typeof currentValue === 'number' && currentValue > 0) {
    return currentValue
  }

  return latestArchivedValue || fallback
}

function getMainTourAgeDecline(record: WorldPlayerRecord) {
  const age = record.age
  if (age <= 34) return 0

  const rawDecline = age <= 38
    ? (age - 34) * 0.8
    : age <= 42
      ? 3.2 + (age - 38) * 1.6
      : age <= 47
        ? 9.6 + (age - 42) * 2.5
        : 22.1 + (age - 47) * 4.2
  const activeLegendRelief = ((record.highestWorldRank ?? 999) <= TOP_16_RANK_CUTOFF || record.majorTitles > 0 || record.titles >= 4)
    ? 0.82
    : (record.highestWorldRank ?? 999) <= TOP_32_RANK_CUTOFF
      ? 0.92
      : 1

  return rawDecline * activeLegendRelief
}

function getMainTourYouthUpside(record: WorldPlayerRecord) {
  if (!record.hasTourCard) return 0
  if (record.age <= 23) return 4
  if (record.age <= 26) return 2.5
  if (record.age <= 29) return 1
  return 0
}

function getWorldPlayerDevelopmentPotential(record: WorldPlayerRecord) {
  if (typeof record.developmentPotential === 'number') {
    return clamp(record.developmentPotential, 55, 99)
  }

  const peakRank = record.highestWorldRank ?? 999
  if (peakRank <= 4) return 96
  if (peakRank <= TOP_16_RANK_CUTOFF) return 91
  if (peakRank <= TOP_32_RANK_CUTOFF) return 86
  if (peakRank <= TOP_64_RANK_CUTOFF) return 80
  if (record.age <= 23) return 78
  return 72
}

function getCompetitiveStrengthBand(record: WorldPlayerRecord, tables: CompetitionTablesState) {
  const worldRow = getCompetitionRowForPlayer(tables, 'world', record.playerName)
  const oneYearRow = getCompetitionRowForPlayer(tables, 'oneYear', record.playerName)
  const worldRank = worldRow?.ranking ?? 999
  const oneYearRank = oneYearRow?.ranking ?? 999
  const latestWins = getRecentSeasonStat(record, (season) => season.proWins, 0, oneYearRow?.wins ?? 0)
  const latestMainTourEvents = getRecentSeasonStat(record, (season) => season.mainTourEvents, 0, oneYearRow?.eventsPlayed ?? 0)
  const latestTitles = getRecentSeasonStat(record, (season) => season.titles, 0, oneYearRow?.titles ?? 0)
  const recentWeightedWins = getWeightedRecentSeasonValue(record, (season) => season.proWins)
  const recentWeightedLosses = getWeightedRecentSeasonValue(record, (season) => season.proLosses)
  const recentWinRate = recentWeightedWins + recentWeightedLosses > 0 ? recentWeightedWins / (recentWeightedWins + recentWeightedLosses) : 0
  const rankSignal = Math.max(0, 18 - Math.min(worldRank, oneYearRank) / 6)
  const developmentPotential = getWorldPlayerDevelopmentPotential(record)
  const prospectGrowthSignal = Math.max(0, developmentPotential - 82) * (record.age <= 23 ? 0.85 : record.age <= 27 ? 0.65 : record.age <= 31 ? 0.38 : 0.12)
  const strengthEstimate = 48
    + rankSignal
    + latestWins * 3.2
    + latestTitles * 7
    + record.majorTitles * 9
    + recentWinRate * 36
    + Math.min(14, latestMainTourEvents * 1.4)
    + prospectGrowthSignal
    + getMainTourYouthUpside(record)
    - Math.max(0, 5 - latestWins) * 2.2
    - Math.max(0, 6 - latestMainTourEvents) * 1.4
    - getMainTourAgeDecline(record)

  return clamp(Math.round(strengthEstimate), 42, 96)
}

function getWorldRankingCeiling(record: WorldPlayerRecord, tables: CompetitionTablesState) {
  const oneYearRow = getCompetitionRowForPlayer(tables, 'oneYear', record.playerName)
  const latestSeasonWins = getRecentSeasonStat(record, (season) => season.proWins, 0, oneYearRow?.wins ?? 0)
  const latestSeasonLosses = getRecentSeasonStat(record, (season) => season.proLosses, 0, oneYearRow?.losses ?? 0)
  const latestMainTourEvents = getRecentSeasonStat(record, (season) => season.mainTourEvents, 0, oneYearRow?.eventsPlayed ?? 0)
  const latestSeasonTitles = getRecentSeasonStat(record, (season) => season.titles, 0, oneYearRow?.titles ?? 0)
  const weightedTwoYearWins = getWeightedRecentSeasonValue(record, (season) => season.proWins) + latestSeasonWins * 0.2
  const weightedTwoYearLosses = getWeightedRecentSeasonValue(record, (season) => season.proLosses) + latestSeasonLosses * 0.2
  const weightedTwoYearMatches = weightedTwoYearWins + weightedTwoYearLosses
  const twoYearWinRate = weightedTwoYearMatches > 0 ? weightedTwoYearWins / weightedTwoYearMatches : 0
  const weightedMainTourEvents = getWeightedRecentSeasonValue(record, (season) => season.mainTourEvents) + latestMainTourEvents * 0.25
  const rollingTwoYearPrize = getWeightedRecentSeasonValue(record, (season) => season.prizeMoney)
  const rollingTitleScore = getWeightedRecentSeasonValue(record, (season) => season.titles)
  const strengthBand = getCompetitiveStrengthBand(record, tables)
  const hasCurrentEliteResult = latestSeasonTitles > 0 || rollingTitleScore >= 1.25 || (record.age <= 34 && record.majorTitles > 0)
  const youngBreakthroughEligible = (record.age <= 30 && latestSeasonWins >= 7 && twoYearWinRate >= 0.38 && strengthBand >= 82)
    || (record.age <= 35 && getWorldPlayerDevelopmentPotential(record) >= 92 && latestSeasonWins >= 5 && twoYearWinRate >= 0.32 && strengthBand >= 82)
  const eliteTop16Eligible = latestMainTourEvents >= 6 && latestSeasonWins >= 4 && twoYearWinRate >= 0.2 && strengthBand >= 80 && (hasCurrentEliteResult || youngBreakthroughEligible)
  const top4Eligible = latestSeasonWins >= 8
    || latestSeasonTitles > 0
    || (rollingTwoYearPrize >= 350000 && weightedMainTourEvents >= 8 && twoYearWinRate >= 0.35)

  if ((record.cardSource === 'Q School' || record.cardSource === 'Q Tour' || record.cardSource === 'Playoff Route' || record.cardSource === 'Federation Route')
    && record.currentYear <= 1
    && latestMainTourEvents === 0) {
    return 96
  }

  if (latestSeasonWins < 2 && twoYearWinRate < 0.18 && strengthBand < 75) {
    return 65
  }

  if (!eliteTop16Eligible) {
    return 17
  }

  if (record.age >= 50 && latestSeasonTitles === 0 && rollingTitleScore < 1.6) {
    return 33
  }

  if (record.age >= 45 && latestSeasonTitles === 0 && rollingTitleScore < 1) {
    return 33
  }

  if (!top4Eligible) {
    return 5
  }

  return 1
}

function getWorldSeedScore(record: WorldPlayerRecord, tables: CompetitionTablesState) {
  const worldRank = getCompetitionRowForPlayer(tables, 'world', record.playerName)?.ranking ?? 999
  const oneYearRank = getCompetitionRowForPlayer(tables, 'oneYear', record.playerName)?.ranking ?? 999
  const worldRow = getCompetitionRowForPlayer(tables, 'world', record.playerName)
  const oneYearRow = getCompetitionRowForPlayer(tables, 'oneYear', record.playerName)
  const totalMatches = Math.max(0, (worldRow?.wins ?? 0) + (worldRow?.losses ?? 0))
  const winRate = totalMatches > 0 ? (worldRow?.wins ?? 0) / totalMatches : 0
  const latestSeason = record.seasons[0]
  const latestSeasonPrize = latestSeason?.prizeMoney ?? 0
  const latestSeasonTitles = getRecentSeasonStat(record, (season) => season.titles, 0, oneYearRow?.titles ?? 0)
  const rollingTwoYearPrize = getWeightedRecentSeasonValue(record, (season) => season.prizeMoney)
  const rollingRankScore = getWeightedRecentSeasonValue(record, (season) => {
    const bestRank = Math.min(
      season.worldRank ?? 999,
      season.oneYearRank ?? 999,
    )

    return Math.max(0, 80 - bestRank * 2.5)
  })
  const rollingTitleScore = getWeightedRecentSeasonValue(record, (season) => season.titles)
  const latestSeasonWins = getRecentSeasonStat(record, (season) => season.proWins, 0, oneYearRow?.wins ?? 0)
  const latestSeasonLosses = getRecentSeasonStat(record, (season) => season.proLosses, 0, oneYearRow?.losses ?? 0)
  const latestSeasonMatches = latestSeasonWins + latestSeasonLosses
  const latestSeasonWinRate = latestSeasonMatches > 0 ? latestSeasonWins / latestSeasonMatches : 0
  const latestMainTourEvents = getRecentSeasonStat(record, (season) => season.mainTourEvents, 0, oneYearRow?.eventsPlayed ?? 0)
  const weightedTwoYearWins = getWeightedRecentSeasonValue(record, (season) => season.proWins) + latestSeasonWins * 0.2
  const weightedTwoYearLosses = getWeightedRecentSeasonValue(record, (season) => season.proLosses) + latestSeasonLosses * 0.2
  const weightedTwoYearMatches = weightedTwoYearWins + weightedTwoYearLosses
  const twoYearWinRate = weightedTwoYearMatches > 0 ? weightedTwoYearWins / weightedTwoYearMatches : 0
  const weightedMainTourEvents = getWeightedRecentSeasonValue(record, (season) => season.mainTourEvents) + latestMainTourEvents * 0.25
  const repeatedHighRankLowVolumeSeasons = record.seasons.filter((season) => (season.worldRank ?? 999) <= TOP_16_RANK_CUTOFF && season.mainTourEvents < 6).length
  const strengthBand = getCompetitiveStrengthBand(record, tables)
  const youngBreakthroughResult = record.age <= 30 && latestSeasonWins >= 7 && latestSeasonWinRate >= 0.38 && strengthBand >= 82
  const developmentPotential = getWorldPlayerDevelopmentPotential(record)
  const eliteProspectBreakthrough = record.age <= 35 && developmentPotential >= 92 && latestSeasonWins >= 5 && latestSeasonWinRate >= 0.32 && strengthBand >= 82
  const hasMeaningfulEliteResult = latestSeasonTitles > 0 || rollingTitleScore >= 1.25 || youngBreakthroughResult || eliteProspectBreakthrough || (record.age <= 34 && record.majorTitles > 0)
  const ageDecline = getMainTourAgeDecline(record)
  const youthUpside = getMainTourYouthUpside(record)
  const eliteTop16Eligible = latestMainTourEvents >= 6 && latestSeasonWins >= 4 && twoYearWinRate >= 0.2 && strengthBand >= 80 && hasMeaningfulEliteResult
  const top4Eligible = latestSeasonWins >= 8
    || latestSeasonTitles > 0
    || record.majorTitles > 0
    || (rollingTwoYearPrize >= 220000 && weightedMainTourEvents >= 8)
  const lowLatestWinsPenalty = latestSeasonWins < 4 ? (4 - latestSeasonWins) * 95 : 0
  const lowTwoYearWinRatePenalty = twoYearWinRate < 0.2 ? Math.round((0.2 - twoYearWinRate) * 900) : 0
  const lowVolumePenalty = latestMainTourEvents < 6 ? (6 - latestMainTourEvents) * 72 : 0
  const noEliteResultsPenalty = !hasMeaningfulEliteResult ? 130 : 0
  const weakStrengthPenalty = strengthBand < 80 ? (80 - strengthBand) * 12 : 0
  const repeatedHighRankLowVolumePenalty = repeatedHighRankLowVolumeSeasons * 88
  const eliteCredibilityPenalty = worldRank <= 4 && !top4Eligible
    ? 950
    : worldRank <= TOP_16_RANK_CUTOFF && !eliteTop16Eligible
      ? 420
      : 0
  const bottomTourProtectionPenalty = worldRank > TOP_64_RANK_CUTOFF && record.hasTourCard && latestSeasonWins < 3 ? (3 - latestSeasonWins) * 24 : 0
  const veteranBonus = record.age >= 35 && record.age <= 42 && (record.highestWorldRank ?? 999) <= 32 && twoYearWinRate >= 0.3 ? 18 : 0
  const historicalPeakBonus = Math.max(0, 26 - ((record.highestWorldRank ?? 128) * 0.25))
  const ageDeclinePenalty = Math.round(ageDecline * 160)
    + (record.age >= 40 && latestSeasonTitles === 0 && rollingTitleScore < 1 ? 300 : 0)
    + (record.age >= 44 && latestSeasonTitles === 0 && rollingTitleScore < 1 ? 950 : 0)
    + (record.age >= 48 && latestSeasonTitles === 0 ? 1700 : 0)
    + (record.age >= 52 && latestSeasonTitles === 0 ? 2600 : 0)
    + (record.age >= 45 && latestSeasonWins < 4 ? (4 - latestSeasonWins) * 190 : 0)
  const youthUpsideBonus = Math.round(youthUpside * 110)
    + (record.age <= 26 && record.hasTourCard && latestSeasonWins >= 3 ? 220 : 0)
    + (record.age <= 30 && latestSeasonWinRate >= 0.42 && latestMainTourEvents >= 6 ? 180 : 0)
    + (record.age <= 28 && latestSeasonTitles > 0 ? 260 : 0)
  const eliteProspectBonus = record.hasTourCard
    ? Math.max(0, developmentPotential - 88) * (record.age <= 30 ? 190 : record.age <= 35 ? 95 : 0)
    : 0

  return (record.hasTourCard ? 85 : 0)
    + Math.max(0, 48 - worldRank * 0.35)
    + Math.max(0, 72 - oneYearRank * 0.85)
    + (worldRow?.points ?? 0) * 0.14
    + (worldRow?.prizeMoney ?? 0) * 0.0012
    + (oneYearRow?.points ?? 0) * 0.25
    + (oneYearRow?.prizeMoney ?? 0) * 0.003
    + latestSeasonWins * 62
    + weightedTwoYearWins * 28
    - weightedTwoYearLosses * 8
    + latestMainTourEvents * 12
    + weightedMainTourEvents * 6
    + latestSeasonTitles * 220
    + record.majorTitles * 250
    + record.titles * 10
    + rollingTwoYearPrize * 0.004
    + rollingRankScore * 1.8
    + rollingTitleScore * 120
    + latestSeasonPrize * 0.002
    + Math.round(latestSeasonWinRate * 260)
    + Math.round(twoYearWinRate * 320)
    + Math.round(winRate * 100)
    + strengthBand * 10
    + historicalPeakBonus
    + veteranBonus
    + youthUpsideBonus
    + eliteProspectBonus
    - lowLatestWinsPenalty
    - lowTwoYearWinRatePenalty
    - lowVolumePenalty
    - noEliteResultsPenalty
    - weakStrengthPenalty
    - repeatedHighRankLowVolumePenalty
    - eliteCredibilityPenalty
    - bottomTourProtectionPenalty
    - ageDeclinePenalty
}

function isEligibleForWorldTable(record: WorldPlayerRecord) {
  return record.hasTourCard || record.retainedViaRanking
}

function buildWorldCompetitionRows(players: WorldPlayerRecord[], tables: CompetitionTablesState, playerName: string) {
  const sortedPlayers = players
    .sort((left, right) => {
      const scoreDelta = getWorldSeedScore(right, tables) - getWorldSeedScore(left, tables)
      if (scoreDelta !== 0) {
        return scoreDelta
      }

      const leftOneYearRank = getCompetitionRowForPlayer(tables, 'oneYear', left.playerName)?.ranking ?? 999
      const rightOneYearRank = getCompetitionRowForPlayer(tables, 'oneYear', right.playerName)?.ranking ?? 999
      if (leftOneYearRank !== rightOneYearRank) {
        return leftOneYearRank - rightOneYearRank
      }

      const leftWorldRank = getCompetitionRowForPlayer(tables, 'world', left.playerName)?.ranking ?? null
      const rightWorldRank = getCompetitionRowForPlayer(tables, 'world', right.playerName)?.ranking ?? null

      if (leftWorldRank != null && rightWorldRank != null && leftWorldRank !== rightWorldRank) {
        return leftWorldRank - rightWorldRank
      }

      if (leftWorldRank != null && rightWorldRank == null) {
        return -1
      }

      if (leftWorldRank == null && rightWorldRank != null) {
        return 1
      }

      return left.playerName.localeCompare(right.playerName)
    })
  const limit = Math.min(MAIN_TOUR_POOL_SIZE, sortedPlayers.length)
  const eligiblePlayers = sortedPlayers.filter((record) => isEligibleForWorldTable(record)).slice(0, limit)

  const remainingPlayers = eligiblePlayers.slice(0, limit).map((record) => ({
    record,
    bestAllowedRank: getWorldRankingCeiling(record, tables),
  }))
  const finalPlayers: WorldPlayerRecord[] = []

  for (let rank = 1; rank <= limit && remainingPlayers.length > 0; rank += 1) {
    let selectedIndex = remainingPlayers.findIndex((entry) => entry.bestAllowedRank <= rank)
    if (selectedIndex === -1) {
      selectedIndex = remainingPlayers.reduce((bestIndex, entry, index, entries) => {
        if (entry.bestAllowedRank < entries[bestIndex].bestAllowedRank) {
          return index
        }

        return bestIndex
      }, 0)
    }

    const [selected] = remainingPlayers.splice(selectedIndex, 1)
    finalPlayers.push(selected.record)
  }

  const rows = finalPlayers.map((record, index) => {
    const existingWorldRow = getCompetitionRowForPlayer(tables, 'world', record.playerName)
    const ranking = index + 1
    const statusNote = existingWorldRow?.statusNote
      ?? (ranking <= TOP_16_RANK_CUTOFF
        ? 'Top 16'
        : ranking <= TOP_32_RANK_CUTOFF
          ? 'Top 32'
          : ranking <= TOP_64_RANK_CUTOFF
            ? 'Safe'
            : record.hasTourCard
              ? 'At Risk'
              : 'Development')

    return {
      ...createCompetitionDefaultRow(record.playerName, record.nation, index + 1),
      ...(existingWorldRow ?? {}),
      playerName: record.playerName,
      nation: record.nation,
      points: Math.max(0, existingWorldRow?.points ?? 0),
      prizeMoney: Math.max(0, existingWorldRow?.prizeMoney ?? 0),
      eventsPlayed: Math.max(0, existingWorldRow?.eventsPlayed ?? 0),
      wins: Math.max(0, existingWorldRow?.wins ?? 0),
      losses: Math.max(0, existingWorldRow?.losses ?? 0),
      titles: Math.max(0, existingWorldRow?.titles ?? 0),
      statusNote,
    }
  })

  return rerankCompetitionRows(rows, playerName)
}

function buildOneYearCompetitionRows(worldRows: CompetitionTableRow[], tables: CompetitionTablesState, playerName: string) {
  return rerankCompetitionRows(
    worldRows.map((worldRow, index) => {
      const existingOneYearRow = getCompetitionRowForPlayer(tables, 'oneYear', worldRow.playerName)

      return {
        ...createCompetitionDefaultRow(worldRow.playerName, worldRow.nation, index + 1),
        ...(existingOneYearRow ?? {}),
        playerName: worldRow.playerName,
        nation: worldRow.nation,
        points: 0,
        prizeMoney: 0,
        eventsPlayed: 0,
        wins: 0,
        losses: 0,
        titles: 0,
        statusNote: worldRow.statusNote,
      }
    }),
    playerName,
  )
}

function getCircuitSeedScore(record: WorldPlayerRecord, tables: CompetitionTablesState, key: Exclude<CompetitionTableKey, 'world' | 'oneYear'>) {
  const getRankScore = (tableKey: CompetitionTableKey, fallback = 0) => {
    const row = getCompetitionRowForPlayer(tables, tableKey, record.playerName)
    if (!row) return fallback
    return Math.max(0, 140 - row.ranking * 3) + row.titles * 18 + row.wins * 2
  }
  const developmentPotential = getWorldPlayerDevelopmentPotential(record)
  const youngProspectScore = Math.max(0, developmentPotential - 78) * (record.age <= 21 ? 3.2 : record.age <= 27 ? 2.2 : 0.8)

  switch (key) {
    case 'youth':
      return getRankScore('youth') * 1.5 + getRankScore('amateur') * 0.35 + Math.max(0, 24 - record.age) * 4 + youngProspectScore
    case 'amateur':
      return getRankScore('amateur') * 1.5 + getRankScore('youth') * 0.8 + getRankScore('qTour') * 0.5 + Math.max(0, 34 - record.age) * 2 + youngProspectScore
    case 'qTour':
      return getRankScore('qTour') * 1.8 + getRankScore('amateur') * 1.1 + getRankScore('youth') * 0.8 + Math.max(0, 32 - record.age) * 2 + youngProspectScore
    case 'qSchool':
      return getRankScore('qSchool') * 2 + getRankScore('qTour') * 1.4 + getRankScore('amateur') * 0.9 + Math.max(0, 36 - record.age) + youngProspectScore
    case 'senior':
      return getRankScore('senior') * 1.8 + getRankScore('world') * 0.9 + ((record.highestWorldRank != null && record.highestWorldRank <= 32) ? 50 - record.highestWorldRank : 0) + Math.max(0, record.age - 39) * 3
  }
}

function getLatestArchivedCircuitRank(record: WorldPlayerRecord, key: keyof WorldPlayerSeasonRecord) {
  const rank = record.seasons[0]?.[key]
  return typeof rank === 'number' ? rank : null
}

function getWorldPlayerCircuitRank(record: WorldPlayerRecord, tables: CompetitionTablesState, key: CompetitionTableKey) {
  const currentRank = getCompetitionRowForPlayer(tables, key, record.playerName)?.ranking
  if (typeof currentRank === 'number') return currentRank

  switch (key) {
    case 'world':
      return getLatestArchivedCircuitRank(record, 'worldRank')
    case 'oneYear':
      return getLatestArchivedCircuitRank(record, 'oneYearRank')
    case 'amateur':
      return getLatestArchivedCircuitRank(record, 'amateurRank')
    case 'qTour':
      return getLatestArchivedCircuitRank(record, 'qTourRank')
    case 'qSchool':
      return getLatestArchivedCircuitRank(record, 'qSchoolRank')
    case 'senior':
      return getLatestArchivedCircuitRank(record, 'seniorRank')
    case 'youth':
      return getLatestArchivedCircuitRank(record, 'youthRank')
  }
}

function getWorldPlayerExpectedCircuit(record: WorldPlayerRecord, tables: CompetitionTablesState) {
  const worldRank = getWorldPlayerCircuitRank(record, tables, 'world') ?? 999
  const qTourRank = getWorldPlayerCircuitRank(record, tables, 'qTour') ?? 999
  const qSchoolRank = getWorldPlayerCircuitRank(record, tables, 'qSchool') ?? 999
  const amateurRank = getWorldPlayerCircuitRank(record, tables, 'amateur') ?? 999
  const youthRank = getWorldPlayerCircuitRank(record, tables, 'youth') ?? 999
  const recentMainTourEvents = getRecentSeasonStat(record, (season) => season.mainTourEvents)
  const strongAmateurSignal = amateurRank <= 12 || qTourRank <= 12 || youthRank <= 6

  if (record.age >= 40 && !record.hasTourCard && worldRank > TOP_64_RANK_CUTOFF && ((record.highestWorldRank ?? 999) <= 64 || recentMainTourEvents > 0)) {
    return 'senior'
  }

  if (record.age <= 21 && !record.hasTourCard && !strongAmateurSignal) {
    return 'youth'
  }

  if (worldRank <= MAIN_TOUR_POOL_SIZE || qSchoolRank <= 24 || recentMainTourEvents >= 4) {
    return 'qSchool'
  }

  if (qTourRank <= 24 || amateurRank <= 16 || (record.age <= 28 && strongAmateurSignal)) {
    return 'qTour'
  }

  return 'amateur'
}

function getWorldPlayerTourSurvivalStatus(worldRank: number, hasTourCard: boolean, retainedViaRanking: boolean, yearsRemaining: number): TourSurvivalStatus {
  if (worldRank <= TOP_16_RANK_CUTOFF) return 'Top 16'
  if (worldRank <= TOP_32_RANK_CUTOFF) return 'Top 32'
  if (worldRank <= TOP_64_RANK_CUTOFF) return 'Safe'
  if (hasTourCard && yearsRemaining >= 2 && !retainedViaRanking) return 'Rookie Year 1'
  if (hasTourCard && yearsRemaining === 1 && !retainedViaRanking) return 'Rookie Year 2'
  if (hasTourCard && worldRank <= 96) return 'Bubble'
  if (hasTourCard && worldRank <= MAIN_TOUR_POOL_SIZE) return 'At Risk'
  return 'Amateur'
}

function getWorldPlayerPromotionSource(record: WorldPlayerRecord, tables: CompetitionTablesState): TourCardSource {
  if (record.age < 18) return null

  const qSchoolRank = getWorldPlayerCircuitRank(record, tables, 'qSchool') ?? 999
  const qTourRank = getWorldPlayerCircuitRank(record, tables, 'qTour') ?? 999
  const amateurRank = getWorldPlayerCircuitRank(record, tables, 'amateur') ?? 999
  const youthRank = getWorldPlayerCircuitRank(record, tables, 'youth') ?? 999
  const hasRecordedFeederSeason = record.seasons.length > 0

  if (record.age <= 18 && hasRecordedFeederSeason && (youthRank <= 12 || amateurRank <= 20 || qTourRank <= 24 || qSchoolRank <= 16)) {
    return 'Federation Route'
  }

  if (record.age < 18) {
    return null
  }

  if (qSchoolRank <= 24) return qSchoolRank <= 12 ? 'Q School' : 'Playoff Route'
  if (qTourRank <= 24) return qTourRank <= 4 ? 'Q Tour' : 'Playoff Route'
  if (amateurRank <= 40 || (record.age <= 21 && youthRank <= 24)) return 'Federation Route'
  return null
}

function shouldProtectFeederPlayerFromFallbackPromotion(record: WorldPlayerRecord, tables: CompetitionTablesState) {
  if (record.age <= 18) {
    return true
  }

  return getWorldPlayerExpectedCircuit(record, tables) === 'youth'
}

function shouldAiWorldPlayerRetainMainTourCard(record: WorldPlayerRecord, worldRank: number, tables: CompetitionTablesState) {
  if (worldRank > TOP_64_RANK_CUTOFF) return false

  const oneYearRow = getCompetitionRowForPlayer(tables, 'oneYear', record.playerName)
  const latestWins = getRecentSeasonStat(record, (season) => season.proWins, 0, oneYearRow?.wins ?? 0)
  const latestLosses = getRecentSeasonStat(record, (season) => season.proLosses, 0, oneYearRow?.losses ?? 0)
  const latestMatches = latestWins + latestLosses
  const latestWinRate = latestMatches > 0 ? latestWins / latestMatches : 0
  const latestTitles = getRecentSeasonStat(record, (season) => season.titles, 0, oneYearRow?.titles ?? 0)
  const rollingTitleScore = getWeightedRecentSeasonValue(record, (season) => season.titles)
  const nextAge = record.age + 1

  if (nextAge < 42) return true
  if (latestTitles > 0) return true

  if (nextAge >= 55) {
    return rollingTitleScore >= 2 || (latestWins >= 9 && latestWinRate >= 0.58 && worldRank <= TOP_16_RANK_CUTOFF)
  }

  if (nextAge >= 50) {
    return rollingTitleScore >= 1.6 || (latestWins >= 8 && latestWinRate >= 0.52 && worldRank <= TOP_32_RANK_CUTOFF)
  }

  if (nextAge >= 45) {
    return rollingTitleScore >= 1 || latestWins >= 6 || (worldRank <= TOP_16_RANK_CUTOFF && latestWins >= 5 && latestWinRate >= 0.45)
  }

  return latestWins >= 4 || rollingTitleScore >= 0.6 || worldRank <= TOP_32_RANK_CUTOFF
}

function getWorldPlayerPromotionScore(record: WorldPlayerRecord, tables: CompetitionTablesState, source: Exclude<TourCardSource, null>) {
  const qSchoolRank = getWorldPlayerCircuitRank(record, tables, 'qSchool') ?? 999
  const qTourRank = getWorldPlayerCircuitRank(record, tables, 'qTour') ?? 999
  const amateurRank = getWorldPlayerCircuitRank(record, tables, 'amateur') ?? 999
  const youthRank = getWorldPlayerCircuitRank(record, tables, 'youth') ?? 999
  const recentWins = getRecentSeasonStat(record, (season) => season.proWins)
  const recentTitles = getRecentSeasonStat(record, (season) => season.titles)
  const strengthBand = getCompetitiveStrengthBand(record, tables)
  const peakRankBonus = Math.max(0, 96 - Math.min(record.highestWorldRank ?? 128, 128))
  const prospectBonus = Math.max(0, getWorldPlayerDevelopmentPotential(record) - 80) * (record.age <= 24 ? 26 : record.age <= 29 ? 18 : 8)
  const sourceBonus = source === 'Q School'
    ? 320
    : source === 'Q Tour'
      ? 280
      : source === 'Playoff Route'
        ? 250
        : 220

  return sourceBonus
    + strengthBand * 10
    + recentWins * 20
    + recentTitles * 30
    + peakRankBonus
    + prospectBonus
    + Math.max(0, 48 - qSchoolRank * 4)
    + Math.max(0, 40 - qTourRank * 3)
    + Math.max(0, 36 - amateurRank * 2)
    + Math.max(0, 20 - youthRank * 2)
}

function awardWorldPlayerTourCard(record: WorldPlayerRecord, source: Exclude<TourCardSource, null>, nextSeasonStartYear: number): WorldPlayerRecord {
  return {
    ...record,
    hasTourCard: true,
    cardSource: source,
    currentYear: 1,
    yearsRemaining: 2,
    expiresAfterSeason: formatSeasonLabel(nextSeasonStartYear + 1),
    retainedViaRanking: false,
    tourSurvivalStatus: 'At Risk',
  }
}

function isEligibleForCircuit(record: WorldPlayerRecord, tables: CompetitionTablesState, key: Exclude<CompetitionTableKey, 'world' | 'oneYear'>) {
  const youthRank = getWorldPlayerCircuitRank(record, tables, 'youth') ?? 999
  const amateurRank = getWorldPlayerCircuitRank(record, tables, 'amateur') ?? 999
  const qTourRank = getWorldPlayerCircuitRank(record, tables, 'qTour') ?? 999
  const qSchoolRank = getWorldPlayerCircuitRank(record, tables, 'qSchool') ?? 999
  const worldRank = getWorldPlayerCircuitRank(record, tables, 'world') ?? 999
  const expectedCircuit = getWorldPlayerExpectedCircuit(record, tables)

  switch (key) {
    case 'youth':
      return !record.hasTourCard && record.age <= 21 && (expectedCircuit === 'youth' || youthRank <= 32)
    case 'amateur':
      return !record.hasTourCard && record.age >= 18 && record.age < 40 && expectedCircuit !== 'senior'
    case 'qTour':
      return !record.hasTourCard && record.age >= 18 && record.age < 40 && (expectedCircuit === 'qTour' || qTourRank <= 48 || amateurRank <= 32 || youthRank <= 8)
    case 'qSchool':
      return !record.hasTourCard && record.age >= 18 && record.age < 45 && (expectedCircuit === 'qSchool' || qSchoolRank <= 24 || qTourRank <= 24 || amateurRank <= 16 || worldRank <= 96)
    case 'senior':
      return expectedCircuit === 'senior'
        || (record.age >= 40 && !record.hasTourCard && worldRank > TOP_64_RANK_CUTOFF)
  }
}

function buildSeasonalCircuitRows(
  players: WorldPlayerRecord[],
  tables: CompetitionTablesState,
  key: Exclude<CompetitionTableKey, 'world' | 'oneYear'>,
  playerName: string,
  seasonSeed = 0,
) {
  const limits: Record<Exclude<CompetitionTableKey, 'world' | 'oneYear'>, number> = {
    youth: 32,
    amateur: 64,
    qTour: 48,
    qSchool: 32,
    senior: 24,
  }

  const eligiblePlayers = players
    .filter((record) => isEligibleForCircuit(record, tables, key))
    .sort((left, right) => getCircuitSeedScore(right, tables, key) - getCircuitSeedScore(left, tables, key))
  let selectedPlayers = eligiblePlayers.slice(0, limits[key])

  if (key === 'youth') {
    const newcomerPool = eligiblePlayers.filter((record) => record.seasons.length === 0 && record.age <= 16)
    const selectedNewcomers = selectedPlayers.filter((record) => record.seasons.length === 0 && record.age <= 16)
    const requiredNewcomers = Math.min(3, newcomerPool.length)
    const missingNewcomers = newcomerPool
      .filter((record) => !selectedNewcomers.some((entry) => entry.playerName === record.playerName))
      .slice(0, Math.max(0, requiredNewcomers - selectedNewcomers.length))

    if (missingNewcomers.length > 0) {
      const protectedNames = new Set([
        playerName,
        ...selectedPlayers.slice(0, Math.min(4, selectedPlayers.length)).map((record) => record.playerName),
        ...selectedNewcomers.map((record) => record.playerName),
      ])
      const replaceableIndexes = selectedPlayers
        .map((record, index) => ({
          index,
          record,
          seedScore: getCircuitSeedScore(record, tables, key),
        }))
        .filter((entry) => !protectedNames.has(entry.record.playerName))
        .sort((left, right) => (left.seedScore - right.seedScore) || (right.record.age - left.record.age))

      missingNewcomers.forEach((record, newcomerIndex) => {
        const target = replaceableIndexes[newcomerIndex]
        if (!target) return
        selectedPlayers[target.index] = record
      })
    }
  }

  if (key === 'qTour' || key === 'qSchool') {
    const selectedNames = new Set(selectedPlayers.map((record) => record.playerName))
    const wildcardPool = players.filter((record) => {
      if (selectedNames.has(record.playerName) || record.playerName === playerName || record.hasTourCard) return false
      if (key === 'qTour') return record.age >= 18 && record.age < 40 && getWorldPlayerExpectedCircuit(record, tables) !== 'senior'
      return record.age >= 18 && record.age < 40 && !['youth', 'senior'].includes(getWorldPlayerExpectedCircuit(record, tables))
    })
    const refreshCandidates = [...eligiblePlayers, ...wildcardPool]
      .filter((record) => !selectedNames.has(record.playerName) && record.playerName !== playerName)
      .sort((left, right) => {
        const leftFreshness = left.seasons.length === 0 ? 2 : left.seasons.length <= 2 ? 1 : 0
        const rightFreshness = right.seasons.length === 0 ? 2 : right.seasons.length <= 2 ? 1 : 0
        const leftRotation = hashStringToNumber(`${seasonSeed}-${key}-${left.playerName}`) % 97
        const rightRotation = hashStringToNumber(`${seasonSeed}-${key}-${right.playerName}`) % 97
        return (rightFreshness - leftFreshness)
          || (rightRotation - leftRotation)
          || (getCircuitSeedScore(right, tables, key) - getCircuitSeedScore(left, tables, key))
          || (left.age - right.age)
      })
    const requiredRefresh = Math.min(key === 'qTour' ? 3 : 2, refreshCandidates.length)

    if (requiredRefresh > 0) {
      const protectedNames = new Set([
        playerName,
        ...selectedPlayers.slice(0, Math.min(key === 'qTour' ? 8 : 6, selectedPlayers.length)).map((record) => record.playerName),
      ])
      const replaceableIndexes = selectedPlayers
        .map((record, index) => ({
          index,
          record,
          seedScore: getCircuitSeedScore(record, tables, key),
        }))
        .filter((entry) => !protectedNames.has(entry.record.playerName))
        .sort((left, right) => (left.seedScore - right.seedScore) || (right.record.age - left.record.age))

      refreshCandidates.slice(0, requiredRefresh).forEach((record, refreshIndex) => {
        const target = replaceableIndexes[refreshIndex]
        if (!target) return
        selectedPlayers[target.index] = record
      })
    }
  }

  const rows = selectedPlayers
    .map((record, index, rankedPlayers) => ({
      ...createCompetitionDefaultRow(record.playerName, record.nation, index + 1),
      points: Math.max(1, rankedPlayers.length - index),
      statusNote: `Seeded from ${key} pathway pool`,
    }))

  return rerankCompetitionRows(rows, playerName)
}

function createUniqueIntakeName(
  seenNames: Set<string>,
  playerName: string,
  firstNames: string[],
  lastNames: string[],
  baseSeed: number,
  getFirstIndex: (seed: number) => number,
  getLastIndex: (seed: number) => number,
) {
  for (let attempt = 0; attempt < 260; attempt += 1) {
    const seed = baseSeed + attempt * 23
    const suffix = attempt === 0 ? '' : attempt <= 26 ? ` ${String.fromCharCode(64 + attempt)}` : ` ${attempt - 26}`
    const fullName = `${firstNames[getFirstIndex(seed) % firstNames.length]} ${lastNames[getLastIndex(seed) % lastNames.length]}${suffix}`

    if (!seenNames.has(fullName) && fullName !== playerName) {
      return { fullName, seed }
    }
  }

  return null
}

function createCpuDevelopmentPotential(fullName: string, seasonStartYear: number, intakeIndex: number, age: number, source: 'junior' | 'feeder') {
  const roll = hashStringToNumber(`${source}-${seasonStartYear}-${intakeIndex}-${fullName}`) % 100
  const ageBonus = source === 'junior' && age <= 16 ? 2 : 0

  if (roll >= 94) return 96 + (roll % 3)
  if (roll >= 78) return 90 + (roll % 6) + ageBonus
  if (roll >= 48) return 84 + (roll % 6) + ageBonus
  if (roll >= 18) return 78 + (roll % 7)
  return 70 + (roll % 8)
}

function createJuniorIntake(players: WorldPlayerRecord[], seasonStartYear: number, playerName: string) {
  const seenNames = new Set(players.map((record) => record.playerName))
  const additions: WorldPlayerRecord[] = []

  for (let index = 0; index < 8; index += 1) {
    const intakeName = createUniqueIntakeName(
      seenNames,
      playerName,
      JUNIOR_FIRST_NAMES,
      JUNIOR_LAST_NAMES,
      seasonStartYear * 17 + index * 11,
      (seed) => seed,
      (seed) => seed * 3,
    )

    if (!intakeName) {
      continue
    }

    const { fullName, seed: finalSeed } = intakeName
    seenNames.add(fullName)
    const age = 14 + (finalSeed % 3)
    additions.push({
      id: `wp-${fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      playerName: fullName,
      nation: JUNIOR_NATIONS[(finalSeed * 5) % JUNIOR_NATIONS.length],
      age,
      hasTourCard: false,
      cardSource: null,
      currentYear: 0,
      yearsRemaining: 0,
      expiresAfterSeason: null,
      retainedViaRanking: false,
      tourSurvivalStatus: 'Amateur',
      totalMatches: 0,
      wins: 0,
      losses: 0,
      totalPrizeMoney: 0,
      titles: 0,
      majorTitles: 0,
      qTourWins: 0,
      seniorTitles: 0,
      highestBreak: 0,
      highestWorldRank: null,
      developmentPotential: createCpuDevelopmentPotential(fullName, seasonStartYear, index, age, 'junior'),
      seasons: [],
    })
  }

  return [...players, ...additions]
}

function createFeederIntake(players: WorldPlayerRecord[], seasonStartYear: number, playerName: string) {
  const seenNames = new Set(players.map((record) => record.playerName))
  const additions: WorldPlayerRecord[] = []
  const activeAmateurPool = players.filter((record) => !record.hasTourCard && record.age >= 18 && record.age < 40).length
  const seniorPool = players.filter((record) => record.age >= 40 && (!record.hasTourCard || record.highestWorldRank != null)).length
  const developmentTarget = Math.max(0, 8 - activeAmateurPool)
  const seniorTarget = Math.max(0, 4 - seniorPool)

  for (let index = 0; index < developmentTarget; index += 1) {
    const intakeName = createUniqueIntakeName(
      seenNames,
      playerName,
      FEEDER_FIRST_NAMES,
      FEEDER_LAST_NAMES,
      seasonStartYear * 13 + index * 11,
      (seed) => seed,
      (seed) => seed * 5,
    )

    if (!intakeName) {
      continue
    }

    const { fullName, seed } = intakeName
    seenNames.add(fullName)
    const age = 18 + (seed % 10)
    additions.push({
      id: `wp-${fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      playerName: fullName,
      nation: FEEDER_NATIONS[(seed * 7) % FEEDER_NATIONS.length],
      age,
      hasTourCard: false,
      cardSource: null,
      currentYear: 0,
      yearsRemaining: 0,
      expiresAfterSeason: null,
      retainedViaRanking: false,
      tourSurvivalStatus: 'Amateur',
      totalMatches: 0,
      wins: 0,
      losses: 0,
      totalPrizeMoney: 0,
      titles: 0,
      majorTitles: 0,
      qTourWins: 0,
      seniorTitles: 0,
      highestBreak: 0,
      highestWorldRank: null,
      developmentPotential: createCpuDevelopmentPotential(fullName, seasonStartYear, index, age, 'feeder'),
      seasons: [],
    })
  }

  for (let index = 0; index < seniorTarget; index += 1) {
    const intakeName = createUniqueIntakeName(
      seenNames,
      playerName,
      FEEDER_FIRST_NAMES,
      FEEDER_LAST_NAMES,
      seasonStartYear * 17 + index * 19,
      (seed) => seed + 3,
      (seed) => seed * 3 + 1,
    )

    if (!intakeName) {
      continue
    }

    const { fullName, seed } = intakeName
    seenNames.add(fullName)
    additions.push({
      id: `wp-${fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      playerName: fullName,
      nation: FEEDER_NATIONS[(seed * 11) % FEEDER_NATIONS.length],
      age: 40 + (seed % 7),
      hasTourCard: false,
      cardSource: null,
      currentYear: 0,
      yearsRemaining: 0,
      expiresAfterSeason: null,
      retainedViaRanking: false,
      tourSurvivalStatus: 'Amateur',
      totalMatches: 0,
      wins: 0,
      losses: 0,
      totalPrizeMoney: 0,
      titles: 0,
      majorTitles: 0,
      qTourWins: 0,
      seniorTitles: 0,
      highestBreak: 0,
      highestWorldRank: 24 + (seed % 24),
      seasons: [],
    })
  }

  return [...players, ...additions]
}

function evolveWorldPlayersForNextSeason(
  players: WorldPlayerRecord[],
  tables: CompetitionTablesState,
  nextPlayer: Player,
  playerHasTourCard: boolean,
  playerProState: ProCareerSystemState,
  nextSeasonStartYear: number,
) {
  const agedPlayers = players.map((record) => {
    const worldRank = getCompetitionRowForPlayer(tables, 'world', record.playerName)?.ranking ?? 999
    const retainedViaRanking = worldRank <= TOP_64_RANK_CUTOFF
      && (record.playerName === nextPlayer.fullName || shouldAiWorldPlayerRetainMainTourCard(record, worldRank, tables))
    const protectedCardSeason = record.playerName !== nextPlayer.fullName
      && record.hasTourCard
      && worldRank > TOP_64_RANK_CUTOFF
      && worldRank <= MAIN_TOUR_POOL_SIZE
      && record.yearsRemaining > 1
    const nextYearsRemaining = record.playerName === nextPlayer.fullName
      ? playerProState.yearsRemaining
      : protectedCardSeason
        ? Math.max(0, record.yearsRemaining - 1)
        : 0
    const hasTourCard = record.playerName === nextPlayer.fullName
      ? playerHasTourCard
      : retainedViaRanking || protectedCardSeason

    return {
      ...record,
      age: record.playerName === nextPlayer.fullName ? nextPlayer.age : record.age + 1,
      hasTourCard,
      cardSource: record.playerName === nextPlayer.fullName
        ? playerProState.cardSource
        : retainedViaRanking
          ? 'Ranking Retained'
          : hasTourCard
            ? (record.cardSource ?? 'Seeded Main Tour')
            : null,
      currentYear: record.playerName === nextPlayer.fullName
        ? playerProState.currentYear
        : hasTourCard && nextYearsRemaining > 0
          ? Math.min(2, Math.max(1, record.currentYear + 1))
          : 0,
      yearsRemaining: nextYearsRemaining,
      expiresAfterSeason: record.playerName === nextPlayer.fullName
        ? playerProState.expiresAfterSeason
        : hasTourCard && nextYearsRemaining > 0
          ? formatSeasonLabel(nextSeasonStartYear + nextYearsRemaining - 1)
          : null,
      retainedViaRanking: record.playerName === nextPlayer.fullName ? playerProState.retainedViaRanking : retainedViaRanking,
      tourSurvivalStatus: record.playerName === nextPlayer.fullName
        ? playerProState.tourSurvivalStatus
        : getWorldPlayerTourSurvivalStatus(worldRank, hasTourCard, retainedViaRanking, nextYearsRemaining),
    }
  })

  const normalizedPlayers = agedPlayers.map((record) => {
    if (record.playerName === nextPlayer.fullName) {
      return record
    }

    const worldRank = getCompetitionRowForPlayer(tables, 'world', record.playerName)?.ranking ?? 999
    const retainedViaRanking = worldRank <= TOP_64_RANK_CUTOFF
      && shouldAiWorldPlayerRetainMainTourCard(record, worldRank, tables)
    const protectedBottomTourPlayer = worldRank > TOP_64_RANK_CUTOFF
      && worldRank <= MAIN_TOUR_POOL_SIZE
      && record.yearsRemaining > 0
    const nextYearsRemaining = retainedViaRanking ? 0 : protectedBottomTourPlayer ? record.yearsRemaining : 0
    const hasTourCard = retainedViaRanking || protectedBottomTourPlayer

    return {
      ...record,
      hasTourCard,
      cardSource: retainedViaRanking
        ? 'Ranking Retained'
        : protectedBottomTourPlayer
          ? (record.cardSource ?? 'Seeded Main Tour')
          : null,
      currentYear: retainedViaRanking
        ? 0
        : protectedBottomTourPlayer
          ? Math.min(2, Math.max(1, record.currentYear))
          : 0,
      yearsRemaining: nextYearsRemaining,
      expiresAfterSeason: retainedViaRanking
        ? null
        : protectedBottomTourPlayer && nextYearsRemaining > 0
          ? formatSeasonLabel(nextSeasonStartYear + nextYearsRemaining - 1)
          : null,
      retainedViaRanking,
      tourSurvivalStatus: getWorldPlayerTourSurvivalStatus(worldRank, hasTourCard, retainedViaRanking, nextYearsRemaining),
    }
  })

  const expandedPlayerPool = createFeederIntake(createJuniorIntake(normalizedPlayers, nextSeasonStartYear, nextPlayer.fullName), nextSeasonStartYear, nextPlayer.fullName)
  const provisionalYouthRows = buildSeasonalCircuitRows(expandedPlayerPool, tables, 'youth', nextPlayer.fullName, nextSeasonStartYear)
  const provisionalAmateurRows = buildSeasonalCircuitRows(expandedPlayerPool, { ...tables, youth: provisionalYouthRows }, 'amateur', nextPlayer.fullName, nextSeasonStartYear)
  const provisionalQTourRows = buildSeasonalCircuitRows(
    expandedPlayerPool,
    { ...tables, youth: provisionalYouthRows, amateur: provisionalAmateurRows },
    'qTour',
    nextPlayer.fullName,
    nextSeasonStartYear,
  )
  const provisionalQSchoolRows = buildSeasonalCircuitRows(
    expandedPlayerPool,
    { ...tables, youth: provisionalYouthRows, amateur: provisionalAmateurRows, qTour: provisionalQTourRows },
    'qSchool',
    nextPlayer.fullName,
    nextSeasonStartYear,
  )
  const provisionalSeniorRows = buildSeasonalCircuitRows(
    expandedPlayerPool,
    {
      ...tables,
      youth: provisionalYouthRows,
      amateur: provisionalAmateurRows,
      qTour: provisionalQTourRows,
      qSchool: provisionalQSchoolRows,
    },
    'senior',
    nextPlayer.fullName,
    nextSeasonStartYear,
  )
  const promotionTables = {
    ...tables,
    youth: provisionalYouthRows,
    amateur: provisionalAmateurRows,
    qTour: provisionalQTourRows,
    qSchool: provisionalQSchoolRows,
    senior: provisionalSeniorRows,
  }
  const activeMainTourPlayers = expandedPlayerPool.filter((record) => record.hasTourCard)
  const openSlots = Math.max(0, MAIN_TOUR_POOL_SIZE - activeMainTourPlayers.length)
  const promotedPlayers = expandedPlayerPool
    .filter((record) => record.playerName !== nextPlayer.fullName && !record.hasTourCard)
    .map((record) => ({ record, source: getWorldPlayerPromotionSource(record, promotionTables) }))
    .filter((entry): entry is { record: WorldPlayerRecord, source: Exclude<TourCardSource, null> } => entry.source != null)
    .sort((left, right) => getWorldPlayerPromotionScore(right.record, promotionTables, right.source) - getWorldPlayerPromotionScore(left.record, promotionTables, left.source))
    .slice(0, openSlots)
    .map((entry) => awardWorldPlayerTourCard(entry.record, entry.source, nextSeasonStartYear))
  const remainingOpenSlots = Math.max(0, openSlots - promotedPlayers.length)
  const promotedNames = new Set(promotedPlayers.map((record) => record.playerName))
  const fallbackPromotions = expandedPlayerPool
    .filter((record) => record.playerName !== nextPlayer.fullName && !record.hasTourCard && !promotedNames.has(record.playerName))
    .filter((record) => getWorldPlayerExpectedCircuit(record, promotionTables) !== 'senior')
    .filter((record) => !shouldProtectFeederPlayerFromFallbackPromotion(record, promotionTables))
    .sort((left, right) => getWorldPlayerPromotionScore(right, promotionTables, 'Federation Route') - getWorldPlayerPromotionScore(left, promotionTables, 'Federation Route'))
    .slice(0, remainingOpenSlots)
    .map((record) => awardWorldPlayerTourCard(record, 'Federation Route', nextSeasonStartYear))
  for (const record of fallbackPromotions) {
    promotedNames.add(record.playerName)
  }
  const nextSeasonPlayers = expandedPlayerPool.map((record) => promotedNames.has(record.playerName)
    ? (promotedPlayers.find((entry) => entry.playerName === record.playerName)
      ?? fallbackPromotions.find((entry) => entry.playerName === record.playerName)
      ?? record)
    : record)

  return nextSeasonPlayers
}

function rebuildLivingCompetitionTables(rolledTables: CompetitionTablesState, players: WorldPlayerRecord[], playerName: string, seasonSeed = 0) {
  const withWorld = {
    ...rolledTables,
    world: buildWorldCompetitionRows(players, rolledTables, playerName),
  }
  const withOneYear = {
    ...withWorld,
    oneYear: buildOneYearCompetitionRows(withWorld.world, withWorld, playerName),
  }
  const withYouth = {
    ...withOneYear,
    youth: buildSeasonalCircuitRows(players, withOneYear, 'youth', playerName, seasonSeed),
  }
  const withAmateur = {
    ...withYouth,
    amateur: buildSeasonalCircuitRows(players, withYouth, 'amateur', playerName, seasonSeed),
  }
  const withQTour = {
    ...withAmateur,
    qTour: buildSeasonalCircuitRows(players, withAmateur, 'qTour', playerName, seasonSeed),
  }
  const withQSchool = {
    ...withQTour,
    qSchool: buildSeasonalCircuitRows(players, withQTour, 'qSchool', playerName, seasonSeed),
  }

  return {
    ...withQSchool,
    senior: buildSeasonalCircuitRows(players, withQSchool, 'senior', playerName, seasonSeed),
  }
}

type AiSeasonCircuitStats = {
  events: number
  wins: number
  losses: number
  titles: number
  prizeMoney: number
  rankingPoints: number
}

function getAiSeasonVariance(playerName: string, season: string, key: CompetitionTableKey) {
  return (hashStringToNumber(`${season}-${key}-${playerName}`) % 1000) / 999
}

function simulateAiSeasonCircuitStats(
  playerName: string,
  season: string,
  key: CompetitionTableKey,
  row: CompetitionTableRow | undefined,
  record: WorldPlayerRecord,
): AiSeasonCircuitStats {
  if (!row || playerName === record.playerName && row.playerName !== record.playerName) {
    return { events: 0, wins: 0, losses: 0, titles: 0, prizeMoney: 0, rankingPoints: 0 }
  }

  const playedMatches = Math.max(0, row.eventsPlayed)
  if (playedMatches > 0 || row.wins > 0 || row.losses > 0 || row.titles > 0) {
    return {
      events: playedMatches,
      wins: Math.max(0, row.wins),
      losses: Math.max(0, row.losses),
      titles: Math.max(0, row.titles),
      prizeMoney: Math.max(0, row.prizeMoney),
      rankingPoints: Math.max(0, row.points),
    }
  }

  const variance = getAiSeasonVariance(playerName, season, key)
  const rank = row.ranking
  const age = record.age
  const rankStrength = Math.max(0, 1 - (rank - 1) / (key === 'world' || key === 'oneYear' ? MAIN_TOUR_POOL_SIZE : 64))
  const youthGrowth = age <= 24 ? 0.08 : 0
  const veteranDrag = Math.max(0, age - 38) * (key === 'senior' ? -0.004 : 0.012)
  const baseWinRate = clamp(0.34 + rankStrength * 0.38 + youthGrowth - veteranDrag + (variance - 0.5) * 0.1, 0.18, 0.82)
  const eventBaseline: Record<CompetitionTableKey, number> = {
    world: rank <= TOP_16_RANK_CUTOFF ? 12 : rank <= TOP_64_RANK_CUTOFF ? 9 : 6,
    oneYear: rank <= TOP_16_RANK_CUTOFF ? 12 : rank <= TOP_64_RANK_CUTOFF ? 9 : 6,
    amateur: 9,
    qTour: 7,
    qSchool: 4,
    senior: 6,
    youth: 8,
  }
  const eventVariance = Math.round((variance - 0.5) * 2)
  const events = clamp(eventBaseline[key] + eventVariance, key === 'qSchool' ? 3 : 5, key === 'world' || key === 'oneYear' ? 14 : 10)
  const losses = clamp(Math.round(events * (1 - baseWinRate)), 0, events)
  const wins = Math.max(0, events - losses)
  const titleChance = rankStrength * (key === 'world' || key === 'oneYear' ? 0.28 : key === 'qSchool' ? 0.16 : 0.22)
    + Math.max(0, wins - Math.ceil(events * 0.68)) * 0.08
  const titles = wins >= Math.ceil(events * 0.72) && variance < titleChance ? 1 : 0
  const pointsPerWin: Record<CompetitionTableKey, number> = {
    world: 115,
    oneYear: 115,
    amateur: 42,
    qTour: 34,
    qSchool: 16,
    senior: 28,
    youth: 18,
  }
  const prizePerWin: Record<CompetitionTableKey, number> = {
    world: 18500,
    oneYear: 18500,
    amateur: 900,
    qTour: 700,
    qSchool: 0,
    senior: 1200,
    youth: 120,
  }
  const rankingPoints = Math.max(row.points, Math.round(wins * pointsPerWin[key] + titles * pointsPerWin[key] * 3 + rankStrength * pointsPerWin[key] * 2))
  const prizeMoney = Math.max(row.prizeMoney, Math.round(wins * prizePerWin[key] + titles * prizePerWin[key] * 4 + rankStrength * prizePerWin[key] * 2))

  return { events, wins, losses, titles, prizeMoney, rankingPoints }
}

function archiveWorldPlayersForSeason(
  players: WorldPlayerRecord[],
  tables: CompetitionTablesState,
  season: string,
  playerName: string,
  playerStatus: string,
  player?: Player,
  playerSeasonRecord?: CareerSeasonRecord,
) {
  const currentNames = new Set([...players.map((entry) => entry.playerName), ...getAllCompetitionPlayerNames(tables)])

  return Array.from(currentNames).map((entryName) => {
    const existing = normalizeWorldPlayerRecord(players.find((currentPlayer) => currentPlayer.playerName === entryName) ?? {
      id: `wp-${entryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      playerName: entryName,
      nation: getCompetitionRowForPlayer(tables, 'world', entryName)?.nation ?? getCompetitionRowForPlayer(tables, 'amateur', entryName)?.nation ?? 'INT',
      age: inferWorldPlayerAge(entryName, tables, player),
      hasTourCard: false,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      totalPrizeMoney: 0,
      titles: 0,
      majorTitles: 0,
      qTourWins: 0,
      seniorTitles: 0,
      highestBreak: 0,
      highestWorldRank: null,
      cardSource: null,
      currentYear: 0,
      yearsRemaining: 0,
      expiresAfterSeason: null,
      retainedViaRanking: false,
      tourSurvivalStatus: 'Amateur',
      seasons: [],
    }, tables, player)
    const worldRow = getCompetitionRowForPlayer(tables, 'world', entryName)
    const oneYearRow = getCompetitionRowForPlayer(tables, 'oneYear', entryName)
    const amateurRow = getCompetitionRowForPlayer(tables, 'amateur', entryName)
    const qTourRow = getCompetitionRowForPlayer(tables, 'qTour', entryName)
    const qSchoolRow = getCompetitionRowForPlayer(tables, 'qSchool', entryName)
    const seniorRow = getCompetitionRowForPlayer(tables, 'senior', entryName)
    const youthRow = getCompetitionRowForPlayer(tables, 'youth', entryName)
    const isHumanPlayer = entryName === playerName
    const oneYearStats = isHumanPlayer
      ? null
      : simulateAiSeasonCircuitStats(entryName, season, 'oneYear', oneYearRow ?? worldRow, existing)
    const qTourStats = isHumanPlayer ? null : simulateAiSeasonCircuitStats(entryName, season, 'qTour', qTourRow, existing)
    const qSchoolStats = isHumanPlayer ? null : simulateAiSeasonCircuitStats(entryName, season, 'qSchool', qSchoolRow, existing)
    const seniorStats = isHumanPlayer ? null : simulateAiSeasonCircuitStats(entryName, season, 'senior', seniorRow, existing)
    const amateurStats = isHumanPlayer ? null : simulateAiSeasonCircuitStats(entryName, season, 'amateur', amateurRow, existing)
    const youthStats = isHumanPlayer ? null : simulateAiSeasonCircuitStats(entryName, season, 'youth', youthRow, existing)
    const oneYearEvents = oneYearStats?.events ?? oneYearRow?.eventsPlayed ?? worldRow?.eventsPlayed ?? 0
    const oneYearWins = oneYearStats?.wins ?? oneYearRow?.wins ?? worldRow?.wins ?? 0
    const oneYearLosses = oneYearStats?.losses ?? oneYearRow?.losses ?? worldRow?.losses ?? 0
    const oneYearPrize = oneYearStats?.prizeMoney ?? oneYearRow?.prizeMoney ?? worldRow?.prizeMoney ?? 0
    const oneYearPoints = oneYearStats?.rankingPoints ?? oneYearRow?.points ?? 0
    const oneYearTitles = oneYearStats?.titles ?? oneYearRow?.titles ?? 0
    const qTourEvents = qTourStats?.events ?? qTourRow?.eventsPlayed ?? 0
    const qTourWins = qTourStats?.wins ?? qTourRow?.wins ?? 0
    const qTourLosses = qTourStats?.losses ?? qTourRow?.losses ?? 0
    const qTourPoints = qTourStats?.rankingPoints ?? qTourRow?.points ?? 0
    const qTourTitles = qTourStats?.titles ?? qTourRow?.titles ?? 0
    const qSchoolEvents = qSchoolStats?.events ?? qSchoolRow?.eventsPlayed ?? 0
    const qSchoolWins = qSchoolStats?.wins ?? qSchoolRow?.wins ?? 0
    const qSchoolLosses = qSchoolStats?.losses ?? qSchoolRow?.losses ?? 0
    const qSchoolPoints = qSchoolStats?.rankingPoints ?? qSchoolRow?.points ?? 0
    const seniorEvents = seniorStats?.events ?? seniorRow?.eventsPlayed ?? 0
    const seniorWins = seniorStats?.wins ?? seniorRow?.wins ?? 0
    const seniorLosses = seniorStats?.losses ?? seniorRow?.losses ?? 0
    const seniorPoints = seniorStats?.rankingPoints ?? seniorRow?.points ?? 0
    const seniorTitles = seniorStats?.titles ?? seniorRow?.titles ?? 0
    const amateurEvents = amateurStats?.events ?? amateurRow?.eventsPlayed ?? 0
    const amateurWins = amateurStats?.wins ?? amateurRow?.wins ?? 0
    const amateurLosses = amateurStats?.losses ?? amateurRow?.losses ?? 0
    const amateurPoints = amateurStats?.rankingPoints ?? amateurRow?.points ?? 0
    const amateurTitles = amateurStats?.titles ?? amateurRow?.titles ?? 0
    const youthEvents = youthStats?.events ?? youthRow?.eventsPlayed ?? 0
    const youthWins = youthStats?.wins ?? youthRow?.wins ?? 0
    const youthLosses = youthStats?.losses ?? youthRow?.losses ?? 0
    const youthPoints = youthStats?.rankingPoints ?? youthRow?.points ?? 0
    const youthTitles = youthStats?.titles ?? youthRow?.titles ?? 0
    const seasonRecord: WorldPlayerSeasonRecord = {
      season,
      worldRank: worldRow?.ranking ?? null,
      oneYearRank: oneYearRow?.ranking ?? null,
      amateurRank: amateurRow?.ranking ?? null,
      qTourRank: qTourRow?.ranking ?? null,
      qSchoolRank: qSchoolRow?.ranking ?? null,
      seniorRank: seniorRow?.ranking ?? null,
      youthRank: youthRow?.ranking ?? null,
      matches: oneYearEvents + qTourEvents + qSchoolEvents + seniorEvents + amateurEvents + youthEvents,
      wins: oneYearWins + qTourWins + qSchoolWins + seniorWins + amateurWins + youthWins,
      losses: oneYearLosses + qTourLosses + qSchoolLosses + seniorLosses + amateurLosses + youthLosses,
      prizeMoney: oneYearPrize,
      rankingPoints: oneYearPoints + qTourPoints + qSchoolPoints + seniorPoints + amateurPoints + youthPoints,
      titles: oneYearTitles + qTourTitles + seniorTitles + amateurTitles + youthTitles,
      proWins: oneYearWins,
      proLosses: oneYearLosses,
      mainTourEvents: oneYearEvents,
      hasTourCard: existing.hasTourCard,
      yearsRemaining: existing.yearsRemaining,
      retainedViaRanking: existing.retainedViaRanking,
      cardSource: existing.cardSource,
      tourSurvivalStatus: existing.tourSurvivalStatus,
      status: entryName === playerName
        ? playerStatus
        : seniorRow != null
          ? 'Senior'
          : youthRow != null && existing.age <= 21
            ? 'Youth'
            : (worldRow?.ranking ?? 999) <= 16
              ? 'Elite'
              : (worldRow?.ranking ?? 999) <= 32
                ? 'Top 32'
                : (worldRow?.ranking ?? 999) <= 64
                  ? 'Top 64'
                  : qSchoolRow != null
                    ? 'Q School'
                    : qTourRow != null
                      ? 'Q Tour'
                      : 'Development',
    }
    const seasonRows = [seasonRecord, ...existing.seasons.filter((entry) => entry.season !== season)]
    const seasonMatches = seasonRecord.matches
    const seasonWins = seasonRecord.wins
    const seasonLosses = seasonRecord.losses

    return {
      ...existing,
      nation: worldRow?.nation ?? amateurRow?.nation ?? qTourRow?.nation ?? seniorRow?.nation ?? youthRow?.nation ?? existing.nation,
      totalMatches: existing.totalMatches + seasonMatches,
      wins: existing.wins + seasonWins,
      losses: existing.losses + seasonLosses,
      totalPrizeMoney: existing.totalPrizeMoney + seasonRecord.prizeMoney,
      titles: existing.titles + seasonRecord.titles,
      majorTitles: existing.majorTitles + (entryName === playerName ? (playerSeasonRecord?.majorTitles ?? 0) : 0),
      qTourWins: existing.qTourWins + qTourTitles,
      seniorTitles: existing.seniorTitles + seniorTitles,
      highestWorldRank: existing.highestWorldRank == null ? (worldRow?.ranking ?? null) : (worldRow?.ranking != null ? Math.min(existing.highestWorldRank, worldRow.ranking) : existing.highestWorldRank),
      seasons: seasonRows.slice(0, 12),
    }
  })
}

function syncCareerSystems(state: Pick<GameState, 'competitionTables' | 'player' | 'careerSystems'> & Partial<Pick<GameState, 'history'>>): CareerSystemsState {
  const qTourRow = state.competitionTables.qTour.find((row) => row.playerName === state.player.fullName)
  const qSchoolRow = state.competitionTables.qSchool.find((row) => row.playerName === state.player.fullName)
  const worldRow = state.competitionTables.world.find((row) => row.playerName === state.player.fullName)
  const oneYearRow = state.competitionTables.oneYear.find((row) => row.playerName === state.player.fullName)
  const seniorRow = state.competitionTables.senior.find((row) => row.playerName === state.player.fullName)
  const youthRow = state.competitionTables.youth.find((row) => row.playerName === state.player.fullName)
  const qTourLeader = state.competitionTables.qTour[0]?.playerName ?? null
  const qSchoolLeader = state.competitionTables.qSchool[0]?.playerName ?? null
  const historyRankFloor = state.history ? getHistoryPerformanceRankFloor(state.history) : 1
  const worldRank = Math.max(worldRow?.ranking ?? 999, historyRankFloor)
  const normalizedHasTourCard = state.careerSystems.pro.hasTourCard || worldRank <= TOP_64_RANK_CUTOFF
  const proBase = {
    ...state.careerSystems.pro,
    hasTourCard: normalizedHasTourCard,
    cardSource: state.careerSystems.pro.cardSource ?? (worldRank <= TOP_64_RANK_CUTOFF ? 'Ranking Retained' : normalizedHasTourCard ? 'Unknown' : null),
    worldRank: worldRow?.ranking == null ? null : Math.max(worldRow.ranking, historyRankFloor),
    oneYearRank: oneYearRow?.ranking ?? null,
  }
  let survivalStatus: ProCareerSystemState['survivalStatus'] = proBase.hasTourCard
    ? (proBase.yearsRemaining >= 2 ? 'Rookie Year 1' : proBase.yearsRemaining === 1 ? 'Rookie Year 2' : proBase.retainedViaRanking ? 'Safe' : 'At Risk')
    : 'Amateur'
  let currentTier = state.player.age < 18 ? 'Junior Amateur Circuit' : 'Amateur Circuit'

  if (proBase.hasTourCard || worldRank <= TOP_64_RANK_CUTOFF) {
    if (worldRank <= TOP_16_RANK_CUTOFF) {
      survivalStatus = 'Top 16'
      currentTier = 'Top 16 Elite Player'
    } else if (worldRank <= TOP_32_RANK_CUTOFF) {
      survivalStatus = 'Top 32'
      currentTier = 'Top 32 Professional'
    } else if (worldRank <= TOP_64_RANK_CUTOFF) {
      survivalStatus = 'Safe'
      currentTier = 'Tour Survivor / Top 64'
    } else if (proBase.hasTourCard && worldRank <= 96) {
      survivalStatus = 'Bubble'
      currentTier = 'Rookie Professional — Two-Year Tour Card'
    } else if (proBase.hasTourCard && worldRank <= MAIN_TOUR_POOL_SIZE) {
      survivalStatus = 'At Risk'
      currentTier = 'Rookie Professional — Two-Year Tour Card'
    } else if (!proBase.hasTourCard && proBase.yearsRemaining === 0 && state.careerSystems.pro.awardedBy) {
      survivalStatus = 'Lost Card'
      currentTier = 'Q School / Tour Fightback'
    }
  } else if ((qSchoolRow?.points ?? 0) > 0 || state.careerSystems.qSchool.campaignsEntered > 0) {
    currentTier = 'Q School Campaigner'
  } else if ((qTourRow?.points ?? 0) > 0) {
    currentTier = 'Q Tour / Global Amateur Pathway'
  } else if ((youthRow?.ranking ?? 999) <= 32 && state.player.age <= 21) {
    currentTier = 'Junior Amateur Circuit'
  }

  const retired = state.player.age >= 78
    && !proBase.hasTourCard
    && worldRank > TOP_64_RANK_CUTOFF
    && ((seniorRow?.eventsPlayed ?? 0) > 0 || (seniorRow?.ranking ?? 999) <= 24 || state.player.rankingLabel === 'Senior Ranking')
  const lateCareer: LateCareerSystemState = {
    veteranActive: state.player.age >= 40 && (worldRank <= MAIN_TOUR_POOL_SIZE || proBase.hasTourCard || state.player.reputation >= 68),
    seniorEligible: state.player.age >= 40 && !proBase.hasTourCard && worldRank > TOP_64_RANK_CUTOFF,
    seniorActive: !retired && state.player.age >= 40 && !proBase.hasTourCard && worldRank > TOP_64_RANK_CUTOFF && ((seniorRow?.eventsPlayed ?? 0) > 0 || (seniorRow?.ranking ?? 999) <= 24),
    legendStatus: state.player.age >= 40 && state.player.reputation >= 70,
    retired,
  }

  if (lateCareer.retired) {
    currentTier = 'Retired'
  } else if (lateCareer.seniorActive) {
    currentTier = 'Senior Tour / Legend Circuit'
  } else if (lateCareer.veteranActive && worldRank > TOP_64_RANK_CUTOFF && !proBase.hasTourCard) {
    currentTier = 'Veteran Amateur / Pro-Am Circuit'
  } else if (lateCareer.veteranActive && worldRank > TOP_32_RANK_CUTOFF) {
    currentTier = 'Veteran Professional'
  }

  return {
    qTour: {
      ...state.careerSystems.qTour,
      playerRank: qTourRow?.ranking ?? null,
      playerPoints: qTourRow?.points ?? 0,
      leader: qTourLeader,
      top16Bonus: (qTourRow?.ranking ?? 999) <= 16 && (qTourRow?.points ?? 0) > 0,
      top32Bonus: (qTourRow?.ranking ?? 999) <= 32 && (qTourRow?.points ?? 0) > 0,
    },
    qSchool: {
      ...state.careerSystems.qSchool,
      playerRank: qSchoolRow?.ranking ?? null,
      playerPoints: qSchoolRow?.points ?? 0,
      leader: qSchoolLeader,
      topUpEligible: (qSchoolRow?.ranking ?? 999) === 1 && (qSchoolRow?.points ?? 0) > 0,
      slumpRisk: state.careerSystems.qSchool.repeatedFailures >= 2,
    },
    pro: {
      ...proBase,
      survivalStatus,
      tourSurvivalStatus: survivalStatus,
      currentTier,
    },
    lateCareer,
  }
}

function applyAdjustedWorldRankToProState(
  proState: CareerSystemsState['pro'],
  player: Player,
  adjustedWorldRank: number,
): CareerSystemsState['pro'] {
  const adjustedRetainedViaRanking = adjustedWorldRank <= TOP_64_RANK_CUTOFF
  const adjustedHasTourCard = adjustedRetainedViaRanking || (proState.hasTourCard && proState.yearsRemaining > 0)
  const adjustedProState: CareerSystemsState['pro'] = {
    ...proState,
    hasTourCard: adjustedHasTourCard,
    cardSource: adjustedHasTourCard ? (adjustedRetainedViaRanking ? 'Ranking Retained' : proState.cardSource) : null,
    currentYear: adjustedHasTourCard ? proState.currentYear : 0,
    yearsRemaining: adjustedHasTourCard ? proState.yearsRemaining : 0,
    expiresAfterSeason: adjustedHasTourCard ? proState.expiresAfterSeason : null,
    retainedViaRanking: adjustedRetainedViaRanking,
  }
  let survivalStatus: ProCareerSystemState['survivalStatus'] = adjustedProState.hasTourCard
    ? (adjustedProState.yearsRemaining >= 2 ? 'Rookie Year 1' : adjustedProState.yearsRemaining === 1 ? 'Rookie Year 2' : adjustedProState.retainedViaRanking ? 'Safe' : 'At Risk')
    : 'Amateur'
  let currentTier = player.age < 18 ? 'Junior Amateur Circuit' : 'Amateur Circuit'

  if (adjustedProState.hasTourCard || adjustedWorldRank <= TOP_64_RANK_CUTOFF) {
    if (adjustedWorldRank <= TOP_16_RANK_CUTOFF) {
      survivalStatus = 'Top 16'
      currentTier = 'Top 16 Elite Player'
    } else if (adjustedWorldRank <= TOP_32_RANK_CUTOFF) {
      survivalStatus = 'Top 32'
      currentTier = 'Top 32 Professional'
    } else if (adjustedWorldRank <= TOP_64_RANK_CUTOFF) {
      survivalStatus = 'Safe'
      currentTier = 'Tour Survivor / Top 64'
    } else if (adjustedProState.hasTourCard && adjustedWorldRank <= 96) {
      survivalStatus = 'Bubble'
      currentTier = 'Rookie Professional — Two-Year Tour Card'
    } else if (adjustedProState.hasTourCard && adjustedWorldRank <= MAIN_TOUR_POOL_SIZE) {
      survivalStatus = 'At Risk'
      currentTier = 'Rookie Professional — Two-Year Tour Card'
    } else if (!adjustedProState.hasTourCard && adjustedProState.yearsRemaining === 0 && adjustedProState.awardedBy) {
      survivalStatus = 'Lost Card'
      currentTier = 'Q School / Tour Fightback'
    }
  }

  return {
    ...adjustedProState,
    worldRank: adjustedWorldRank,
    survivalStatus,
    tourSurvivalStatus: survivalStatus,
    currentTier,
  }
}

function isMajorCareerEvent(entry: Pick<TournamentHistoryEntry, 'eventType' | 'tournamentName'>) {
  return /major/i.test(entry.eventType ?? '')
    || /world championship|uk major|uk championship|tour championship|masters-style|champion of champions/i.test(entry.tournamentName ?? '')
}

function isProfessionalEventType(eventType: string | undefined) {
  return /major|ranking|professional|professional tour|invitational/i.test(eventType ?? '')
}

function getSeasonSortKey(season: string) {
  return Number.parseInt(season.split('/')[0] ?? '', 10) || 0
}

function getRecentProfessionalHistoryProfile(history?: CareerHistoryState) {
  const entries = history?.tournamentHistory ?? []
  const proEntries = entries.filter((entry) => isProfessionalEventType(entry.eventType))
  const seasonLabels = Array.from(new Set(proEntries.map((entry) => entry.season).filter(Boolean)))
    .sort((left, right) => getSeasonSortKey(right) - getSeasonSortKey(left))
  const latestSeason = seasonLabels[0] ?? null
  const twoYearSeasons = new Set(seasonLabels.slice(0, 2))
  const latestEntries = latestSeason ? proEntries.filter((entry) => entry.season === latestSeason) : []
  const twoYearEntries = proEntries.filter((entry) => twoYearSeasons.has(entry.season))
  const latestSeasonProWins = latestEntries.reduce((sum, entry) => sum + entry.wins, 0)
  const latestSeasonProLosses = latestEntries.reduce((sum, entry) => sum + entry.losses, 0)
  const twoYearProWins = twoYearEntries.reduce((sum, entry) => sum + entry.wins, 0)
  const twoYearProLosses = twoYearEntries.reduce((sum, entry) => sum + entry.losses, 0)
  const twoYearMatches = twoYearProWins + twoYearProLosses

  return {
    latestSeasonProWins,
    latestSeasonProLosses,
    latestSeasonMainTourEvents: latestEntries.length,
    latestSeasonMajorFinals: latestEntries.filter((entry) => isMajorCareerEvent(entry) && getTournamentFinishTier(entry.result) >= 4).length,
    twoYearProWins,
    twoYearProLosses,
    twoYearMainTourEvents: twoYearEntries.length,
    twoYearWinRate: twoYearMatches > 0 ? twoYearProWins / twoYearMatches : 0,
  }
}

function getHistoryPerformanceRankFloor(history?: CareerHistoryState) {
  const recentProProfile = getRecentProfessionalHistoryProfile(history)
  const recentMatchCount = recentProProfile.twoYearProWins + recentProProfile.twoYearProLosses
  const historyEntries = history?.tournamentHistory ?? []
  const rankingTitles = historyEntries.filter((entry) => entry.result === 'Winner' && isProfessionalEventType(entry.eventType)).length
  const majorTitles = historyEntries.filter((entry) => entry.result === 'Winner' && isMajorCareerEvent(entry)).length
  const worldTitles = historyEntries.filter((entry) => entry.result === 'Winner' && isWorldChampionshipMainDrawName(entry.tournamentName)).length
  const professionalFinals = historyEntries.filter(
    (entry) => isProfessionalFinalLevelRun(entry),
  ).length
  const hasTitleProof = rankingTitles > 0 || majorTitles > 0 || worldTitles > 0

  if (recentMatchCount < 8) {
    return 1
  }

  if (recentProProfile.latestSeasonProWins < 2 && recentProProfile.twoYearWinRate < 0.18) {
    return 97
  }

  if (recentProProfile.latestSeasonProWins < 4 && (recentProProfile.twoYearWinRate < 0.2 || recentProProfile.latestSeasonMainTourEvents < 6)) {
    return 65
  }

  if (recentProProfile.latestSeasonProWins < 8 && recentProProfile.latestSeasonMajorFinals === 0 && recentProProfile.twoYearWinRate < 0.35) {
    return recentProProfile.latestSeasonMainTourEvents >= 8 && recentProProfile.twoYearWinRate >= 0.2 ? 33 : 65
  }

  if (!hasTitleProof && recentMatchCount >= 20 && recentProProfile.latestSeasonMajorFinals === 0 && recentProProfile.twoYearWinRate < 0.25) {
    return recentProProfile.latestSeasonMainTourEvents >= 8 && recentProProfile.twoYearWinRate >= 0.2 ? 33 : 65
  }

  if (!hasTitleProof && recentMatchCount >= 20 && recentProProfile.latestSeasonMajorFinals === 0 && recentProProfile.twoYearWinRate < 0.35) {
    return 33
  }

  if (!hasTitleProof && recentMatchCount >= 20 && recentProProfile.twoYearWinRate < 0.45) {
    return 17
  }

  if (!hasTitleProof && recentMatchCount >= 8) {
    return professionalFinals >= 3
      && recentProProfile.latestSeasonMajorFinals > 0
      && recentProProfile.twoYearWinRate >= 0.45
      ? 9
      : 17
  }

  return 1
}

function getTournamentFinishTier(result: string) {
  if (/winner/i.test(result)) return 5
  if (/quarter/i.test(result)) return 2
  if (/semi/i.test(result)) return 3
  if (/(^|\s)final(ist)?(\s|$)/i.test(result)) return 4
  return 0
}

function isWorldChampionshipMainDrawName(name: string | undefined) {
  return /world championship/i.test(name ?? '')
    && !/qualifying/i.test(name ?? '')
    && !/seniors world championship/i.test(name ?? '')
}

function getCareerPhaseFromSystems(player: Player, careerSystems: CareerSystemsState) {
  const worldRank = careerSystems.pro.worldRank ?? 999
  const rookieStatus = careerSystems.pro.hasTourCard
    && careerSystems.pro.currentYear > 0
    && careerSystems.pro.yearsRemaining > 0
    && !careerSystems.pro.retainedViaRanking
    && worldRank > 32

  if (careerSystems.lateCareer.retired) return 'Retired'
  if (careerSystems.lateCareer.seniorActive) return 'Senior'
  if (careerSystems.lateCareer.veteranActive) return 'Veteran'
  if (rookieStatus) return 'Rookie'
  if (careerSystems.pro.hasTourCard || worldRank <= 64) return 'Established'
  if (player.age < 18 || player.rankingLabel === 'Youth Ranking') return 'Youth'
  return 'Amateur'
}

function getCareerStageFromSystems(player: Player, careerSystems: CareerSystemsState, history?: CareerHistoryState) {
  const worldRank = Math.max(careerSystems.pro.worldRank ?? 999, getHistoryPerformanceRankFloor(history))
  const majorHistory = history?.tournamentHistory.filter((entry) => isMajorCareerEvent(entry)) ?? []
  const recentProProfile = getRecentProfessionalHistoryProfile(history)
  const hasWorldTitle = history?.tournamentHistory.some(
    (entry) => isWorldChampionshipMainDrawName(entry.tournamentName) && entry.result === 'Winner',
  )
  const rankingTitles = history?.tournamentHistory.filter(
    (entry) => entry.result === 'Winner' && /major|ranking|professional tour/i.test(entry.eventType ?? ''),
  ).length ?? 0
  const majorSemiFinals = majorHistory.filter((entry) => getTournamentHistoryFinishTier(entry) >= 3).length
  const majorFinals = majorHistory.filter((entry) => getTournamentHistoryFinishTier(entry) >= 4).length
  const strongTwoYearWinProfile = recentProProfile.twoYearProWins >= 16 && recentProProfile.twoYearWinRate >= 0.45
  const sufficientEliteVolume = recentProProfile.latestSeasonMainTourEvents >= 6 || recentProProfile.twoYearMainTourEvents >= 12
  const lowWinRateOutlier = (recentProProfile.twoYearProWins + recentProProfile.twoYearProLosses) >= 10 && recentProProfile.twoYearWinRate < 0.2
  const majorContenderGate = rankingTitles > 0
    || majorFinals > 0
    || majorSemiFinals >= 3
    || recentProProfile.latestSeasonProWins >= 8
    || strongTwoYearWinProfile
  const rookieStatus = careerSystems.pro.hasTourCard
    && careerSystems.pro.currentYear > 0
    && careerSystems.pro.yearsRemaining > 0
    && !careerSystems.pro.retainedViaRanking
    && worldRank > 32

  if (careerSystems.lateCareer.retired) return 'Retired'
  if (careerSystems.lateCareer.seniorActive) return 'Senior Tour / Legend Circuit'
  if (hasWorldTitle) return 'World Champion'
  if (worldRank <= TOP_16_RANK_CUTOFF && majorContenderGate) return 'Major Contender'
  if (worldRank <= TOP_16_RANK_CUTOFF && sufficientEliteVolume && !lowWinRateOutlier) return 'Top 16 Elite Player'
  if (worldRank <= TOP_32_RANK_CUTOFF) return 'Top 32 Professional'
  if (worldRank <= TOP_64_RANK_CUTOFF && (careerSystems.pro.retainedViaRanking || careerSystems.pro.hasTourCard)) return 'Tour Survivor / Top 64'
  if (careerSystems.pro.hasTourCard && worldRank <= MAIN_TOUR_POOL_SIZE) {
    return careerSystems.pro.currentYear > 0 && careerSystems.pro.yearsRemaining > 0
      ? (rookieStatus ? 'Rookie Pro / At Risk' : 'Rookie Pro / Bubble')
      : 'Bottom Tour / At Risk'
  }
  if ((player.rankingLabel === 'Youth Ranking' || /junior|youth/i.test(player.careerStage)) && player.age <= 21) {
    return /junior|youth/i.test(player.careerStage) ? player.careerStage : 'Youth'
  }
  if (careerSystems.qSchool.campaignsEntered > 0 && !careerSystems.pro.hasTourCard) return 'Q School'
  if ((careerSystems.qTour.playerPoints > 0 || player.careerStage.toLowerCase().includes('q tour')) && !careerSystems.pro.hasTourCard) return 'Q Tour'
  return 'Amateur'
}

function getPlayerWorldRankingCeiling(state: Pick<GameState, 'history' | 'competitionTables' | 'player' | 'attributes' | 'equipment'>) {
  const recentProProfile = getRecentProfessionalHistoryProfile(state.history)
  const recentProMatches = recentProProfile.twoYearProWins + recentProProfile.twoYearProLosses
  const effectiveStrength = calculateCurrentEffectiveStrength(state)
  const majorFinals = state.history.tournamentHistory.filter((entry) => isMajorCareerEvent(entry) && getTournamentHistoryFinishTier(entry) >= 4).length
  const professionalFinals = state.history.tournamentHistory.filter(
    (entry) => isProfessionalFinalLevelRun(entry),
  ).length
  const rankingTitles = state.history.tournamentHistory.filter((entry) => entry.result === 'Winner' && isProfessionalEventType(entry.eventType)).length
  const majorTitles = state.history.tournamentHistory.filter((entry) => entry.result === 'Winner' && isMajorCareerEvent(entry)).length
  const worldTitles = state.history.tournamentHistory.filter((entry) => entry.result === 'Winner' && isWorldChampionshipMainDrawName(entry.tournamentName)).length
  const hasTitleProof = rankingTitles > 0 || majorTitles > 0 || worldTitles > 0
  const strongTwoYearWinProfile = recentProProfile.twoYearProWins >= 16 && recentProProfile.twoYearWinRate >= 0.45
  const eliteTop16Eligible = recentProProfile.latestSeasonMainTourEvents >= 6
    && recentProProfile.latestSeasonProWins >= 4
    && recentProProfile.twoYearWinRate >= 0.2
    && effectiveStrength >= 80
    && (rankingTitles > 0 || majorFinals > 0 || strongTwoYearWinProfile)
  const top4Eligible = (recentProProfile.latestSeasonProWins >= 8
    && recentProProfile.twoYearMainTourEvents >= 10
    && recentProProfile.twoYearWinRate >= 0.5
    && effectiveStrength >= 120)
    || recentProProfile.latestSeasonMajorFinals > 0
    || rankingTitles > 0
    || (recentProProfile.twoYearMainTourEvents >= 12 && recentProProfile.twoYearWinRate >= 0.55 && effectiveStrength >= 125)

  if (recentProMatches < 8 && state.player.rankingLabel !== 'World Ranking') {
    return 65
  }

  if (recentProProfile.latestSeasonProWins < 2 && recentProProfile.twoYearWinRate < 0.18 && effectiveStrength < 80) {
    return 65
  }

  if (!hasTitleProof && recentProMatches >= 20 && recentProProfile.latestSeasonMajorFinals === 0 && recentProProfile.twoYearWinRate < 0.25) {
    return 65
  }

  if (!hasTitleProof && recentProMatches >= 20 && recentProProfile.latestSeasonMajorFinals === 0 && recentProProfile.twoYearWinRate < 0.35) {
    return 33
  }

  if (!hasTitleProof && recentProMatches >= 20 && recentProProfile.twoYearWinRate < 0.45) {
    return 17
  }

  if (!hasTitleProof && recentProMatches >= 20) {
    return professionalFinals >= 3
      && recentProProfile.latestSeasonMajorFinals > 0
      && recentProProfile.twoYearWinRate >= 0.45
      && effectiveStrength >= 110
      ? 9
      : 17
  }

  if (!eliteTop16Eligible) {
    return 17
  }

  if (!top4Eligible) {
    return 5
  }

  const rankOneEligible = worldTitles > 0
    || majorTitles > 0
    || (rankingTitles >= 3 && recentProProfile.twoYearMainTourEvents >= 12 && recentProProfile.twoYearWinRate >= 0.58 && effectiveStrength >= 125)

  return rankOneEligible ? 1 : 2
}

function enforcePlayerWorldRankingCeiling(
  tables: CompetitionTablesState,
  playerName: string,
  ceilingRank: number,
) {
  const currentIndex = tables.world.findIndex((row) => row.playerName === playerName)
  if (currentIndex === -1 || currentIndex + 1 >= ceilingRank) {
    return tables
  }

  const nextWorldRows = [...tables.world]
  const [playerRow] = nextWorldRows.splice(currentIndex, 1)
  const targetIndex = Math.min(nextWorldRows.length, Math.max(ceilingRank - 1, 0))
  nextWorldRows.splice(targetIndex, 0, playerRow)
  const rerankedWorldRows = nextWorldRows.map((row, index) => ({
    ...row,
    movement: row.ranking - (index + 1),
    ranking: index + 1,
    highlighted: row.playerName === playerName,
  }))

  return {
    ...tables,
    world: rerankedWorldRows,
    oneYear: buildOneYearCompetitionRows(rerankedWorldRows, tables, playerName),
  }
}

function getRankingLabelForCompetitionKey(key: CompetitionTableKey) {
  switch (key) {
    case 'world':
    case 'oneYear':
      return 'World Ranking'
    case 'amateur':
      return 'Amateur Ranking'
    case 'qTour':
      return 'Q Tour Ranking'
    case 'qSchool':
      return 'Q School Order of Merit'
    case 'senior':
      return 'Senior Ranking'
    case 'youth':
      return 'Youth Ranking'
  }
}

function getCurrentCueBonus(equipment: EquipmentState) {
  if (!equipment.currentCueId) return 0

  const cue = cueMarketplaceCatalog.find((item) => item.id === equipment.currentCueId)
  if (!cue) return 0

  const cueState = getCueState(equipment, equipment.currentCueId)
  const rawBonus = Math.round(Object.values(cue.bonuses).reduce((sum, value) => sum + value, 0) / 8)
  const conditionModifier = Math.round((cueState.condition - 75) / 5)

  return rawBonus + conditionModifier
}

function getMissingTournamentEquipment(equipment: EquipmentState) {
  const missing: string[] = []

  if (!equipment.currentCueId) missing.push('cue')
  if (!equipment.currentChalkId) missing.push('chalk')
  if (!equipment.currentTipId) missing.push('tip')

  return missing
}

function getTournamentEquipmentMessage(equipment: EquipmentState) {
  const missing = getMissingTournamentEquipment(equipment)
  if (missing.length === 0) return null

  return `Equip a ${missing.join(', ')} before entering a tournament.`
}

function finalizeState(state: GameState, lastAction: string, snapshotLabel?: string) {
  const nextState = recalculateState(state, lastAction)
  return snapshotLabel ? withHistorySnapshot(nextState, snapshotLabel) : nextState
}

export function getTournamentEntryRound(state: GameState, tournament: Tournament): TournamentRound {
  const profile = getPlayerTournamentProfile(state)
  const tournamentClass = getTournamentCircuitClass(tournament)

  if (tournamentClass === 'worldChampionshipQualifying' && profile.accessBand === 'top32') {
    return 'Quarter Final'
  }

  if (tournamentClass === 'rookieQualifier' && profile.accessBand === 'top64') {
    return 'Quarter Final'
  }

  return TOURNAMENT_ROUNDS[0]
}

function getPreferredOpponentRank(playerRank: number, accessBand: ProTourAccessBand, currentRoundIndex: number, tournament: Tournament) {
  const tournamentClass = getTournamentCircuitClass(tournament)

  if (tournamentClass === 'youth') {
    return clamp(playerRank + 10 - currentRoundIndex * 2, 4, 48)
  }

  if (tournamentClass === 'amateur') {
    return clamp(playerRank + 12 - currentRoundIndex * 2, 4, 48)
  }

  if (tournamentClass === 'qTour') {
    return currentRoundIndex === 0 ? clamp(playerRank + 18, 8, 48) : clamp(playerRank + 8, 4, 24)
  }

  if (tournamentClass === 'qSchool') {
    return currentRoundIndex === 0 ? clamp(playerRank + 14, 8, 48) : clamp(playerRank + 6, 4, 20)
  }

  if (tournamentClass === 'senior' || tournamentClass === 'exhibition') {
    return clamp(playerRank + 8 - currentRoundIndex, 4, 48)
  }

  switch (accessBand) {
    case 'top16':
      return currentRoundIndex === 0 ? 56 : currentRoundIndex === 1 ? 28 : 12
    case 'top32':
      return currentRoundIndex === 0 ? 48 : currentRoundIndex === 1 ? 24 : 12
    case 'top64':
      return currentRoundIndex === 0
        ? clamp(Math.round(playerRank * 0.82), 20, 56)
        : currentRoundIndex === 1
          ? clamp(Math.round(playerRank * 0.62), 12, 36)
          : clamp(Math.round(playerRank * 0.42), 6, 20)
    case 'bottomTour':
      return currentRoundIndex === 0
        ? clamp(Math.round(playerRank * 0.56), 16, 42)
        : currentRoundIndex === 1
          ? clamp(Math.round(playerRank * 0.4), 10, 28)
          : clamp(Math.round(playerRank * 0.25), 4, 16)
    default:
      return playerRank
  }
}

function getWorldPlayerTournamentSnapshot(state: GameState, playerName: string) {
  const record = state.worldPlayers.find((entry) => entry.playerName === playerName)
  const worldRank = state.competitionTables.world.find((row) => row.playerName === playerName)?.ranking ?? record?.highestWorldRank ?? 999

  return {
    age: record?.age ?? inferWorldPlayerAge(playerName, state.competitionTables, state.player),
    worldRank,
    hasTourCard: record?.hasTourCard ?? worldRank <= MAIN_TOUR_POOL_SIZE,
    hasMainTourStatus: (record?.hasTourCard ?? false) || worldRank <= TOP_64_RANK_CUTOFF,
  }
}

function getTournamentFieldRows(state: GameState, tournament: Tournament) {
  const baseRows = getCompetitionRowsForTournament(state, tournament)
  const tournamentClass = getTournamentCircuitClass(tournament)
  const proAmAllowed = /pro-am/i.test(`${tournament.name} ${tournament.format} ${tournament.progressionImpact ?? ''}`)

  return baseRows.filter((row) => {
    const opponent = getWorldPlayerTournamentSnapshot(state, row.playerName)

    switch (tournamentClass) {
      case 'youth':
        return opponent.age <= 21 && !opponent.hasMainTourStatus
      case 'amateur':
        return !opponent.hasMainTourStatus || proAmAllowed
      case 'qTour':
        return opponent.age >= 18 && !opponent.hasMainTourStatus
      case 'qSchool':
        return opponent.age >= 18 && !opponent.hasMainTourStatus && opponent.worldRank > TOP_64_RANK_CUTOFF
      case 'senior':
        return opponent.age >= 40 && !opponent.hasMainTourStatus
      case 'exhibition':
        return opponent.age >= 35 || opponent.hasMainTourStatus
      default:
        return opponent.hasTourCard || opponent.worldRank <= MAIN_TOUR_POOL_SIZE
    }
  })
}

function selectTournamentOpponent(
  state: GameState,
  playerName: string,
  excludeNames: string[],
  playerRank: number,
  accessBand: ProTourAccessBand,
  tournament: Tournament,
  currentRoundIndex: number,
) {
  const rankingRows = getTournamentFieldRows(state, tournament)
  const availableRows = rankingRows.filter((row) => row.playerName !== playerName && !excludeNames.includes(row.playerName))
  const tournamentClass = getTournamentCircuitClass(tournament)

  if (availableRows.length === 0) {
    return rankingRows.find((row) => row.playerName !== playerName) ?? rankingRows[0]
  }

  let candidateRows = availableRows

  if (isMainTourEventType(tournament)) {
    if ((tournamentClass === 'eliteInvitational' || tournamentClass === 'worldChampionshipMain') && accessBand === 'top16' && currentRoundIndex === 0) {
      candidateRows = candidateRows.filter((row) => row.ranking > TOP_16_RANK_CUTOFF)
    }

    if ((tournamentClass === 'eliteInvitational' || tournamentClass === 'worldChampionshipMain') && accessBand === 'top16' && currentRoundIndex === 1) {
      candidateRows = candidateRows.filter((row) => row.ranking > 8)
    }

    if (tournamentClass === 'worldChampionshipQualifying' && accessBand === 'top32') {
      candidateRows = candidateRows.filter((row) => row.ranking > TOP_16_RANK_CUTOFF)
    }

    if (tournamentClass === 'rookieQualifier' && accessBand === 'top64') {
      candidateRows = candidateRows.filter((row) => row.ranking >= 33)
    }

    if (accessBand === 'bottomTour') {
      candidateRows = candidateRows.filter((row) => row.ranking >= 17 && row.ranking <= 80)
      if (tournamentClass === 'ranking' || tournamentClass === 'ukMajor') {
        candidateRows = candidateRows.filter((row) => row.ranking <= (currentRoundIndex === 0 ? 64 : 32))
      }
      if (tournamentClass === 'eliteInvitational' || tournamentClass === 'worldChampionshipMain') {
        candidateRows = candidateRows.filter((row) => row.ranking <= 32)
      }
      if (tournamentClass === 'worldChampionshipQualifying') {
        candidateRows = candidateRows.filter((row) => row.ranking <= (currentRoundIndex === 0 ? 64 : 48))
      }
    }

    if (accessBand === 'top64' && (tournamentClass === 'ranking' || tournamentClass === 'ukMajor')) {
      candidateRows = candidateRows.filter((row) => row.ranking <= (currentRoundIndex === 0 ? 72 : 40))
    }
  }

  if (candidateRows.length === 0) {
    candidateRows = availableRows
  }

  const preferredRank = getPreferredOpponentRank(playerRank, accessBand, currentRoundIndex, tournament)
  return candidateRows.sort((left, right) => Math.abs(left.ranking - preferredRank) - Math.abs(right.ranking - preferredRank))[0]
}

function createMatchSetup(state: GameState, tournament: Tournament) {
  const currentRound =
    state.tournamentProgress.tournamentId === tournament.id && state.tournamentProgress.currentRound
      ? state.tournamentProgress.currentRound
      : getTournamentEntryRound(state, tournament)
  const currentRoundIndex = TOURNAMENT_ROUNDS.indexOf(currentRound)
  const roundPlan = getTournamentRoundPlan(tournament, currentRound)
  const technical = calculateTechnicalAverage(state.attributes.technical)
  const mental = calculateAverage(Object.values(state.attributes.mental))
  const physical = calculateAverage(Object.values(state.attributes.physical))
  const bigMatchNerve = state.attributes.mental['Big Match Nerve'] ?? mental
  const composure = state.attributes.mental.Composure ?? mental
  const equipmentBonus = getCurrentCueBonus(state.equipment)
  const travelModifier = getTravelReadinessModifier(state, tournament.id)
  const worldRank = state.careerSystems.pro.worldRank ?? state.player.worldRanking ?? 999
  const entryAccess = getTournamentEntryAccess(state, tournament)
  const bracketMatch = state.tournamentProgress.tournamentId === tournament.id
    ? findPlayerBracketMatch(state.tournamentProgress.draw, currentRound, state.player.fullName)
    : null
  const bracketOpponent = bracketMatch
    ? bracketMatch.top.name === state.player.fullName
      ? bracketMatch.bottom
      : bracketMatch.top
    : null
  const playerBaseStrength = calculateMatchStrength({
    technical,
    mental,
    physical,
    confidence: state.player.confidence,
    fatigue: clamp(state.player.fatigue - travelModifier, 0, 100),
    equipmentBonus,
  }) + travelModifier
  const opponent = bracketOpponent && bracketOpponent.name !== 'TBD'
    ? {
        id: `draw-${bracketOpponent.name}`,
        playerName: bracketOpponent.name,
        nation: bracketOpponent.nation,
        ranking: bracketOpponent.rank,
        movement: 0,
        points: 0,
        prizeMoney: 0,
      }
    : selectTournamentOpponent(
        state,
        state.player.fullName,
        state.tournamentProgress.completedRounds.map((round) => round.opponentName),
        worldRank,
        entryAccess.accessBand,
        tournament,
        currentRoundIndex,
      )
  const qSchoolAdvantage = tournament.type === 'Q School'
    ? state.careerSystems.qSchool.directPlayoffEligible
      ? 14
      : state.careerSystems.qSchool.seededCampaign
        ? 8
        : state.careerSystems.qSchool.campaignEligible
          ? 4
          : 0
    : 0
  const seededBoost = entryAccess.seededProtection * 4
  const bottomTourPenalty = entryAccess.accessBand === 'bottomTour' ? 5 : 0
  const tournamentClass = getTournamentCircuitClass(tournament)
  const pressureSkill = Math.round((bigMatchNerve + composure) / 2)
  const opponentBaseStrength = tournamentClass === 'youth'
    ? 48
    : tournamentClass === 'amateur'
      ? 56
      : tournamentClass === 'qTour'
        ? 64
        : tournamentClass === 'qSchool'
          ? 69
          : tournamentClass === 'senior'
            ? 54
            : tournamentClass === 'exhibition'
              ? 58
            : tournamentClass === 'eliteInvitational'
                ? 82
                : tournamentClass === 'worldChampionshipMain'
                  ? 84
                  : tournamentClass === 'worldChampionshipQualifying'
                    ? 76
                    : tournamentClass === 'rookieQualifier'
                      ? 71
                      : 68
  const rankingWeight = tournamentClass === 'youth'
    ? 0.18
    : tournamentClass === 'amateur'
      ? 0.22
      : tournamentClass === 'qTour'
        ? 0.28
        : tournamentClass === 'qSchool'
          ? 0.3
          : tournamentClass === 'senior' || tournamentClass === 'exhibition'
            ? 0.16
            : tournamentClass === 'eliteInvitational' || tournamentClass === 'worldChampionshipMain'
              ? 0.38
              : 0.32
  const roundDifficulty = getRoundDifficultyBonus(currentRound, tournamentClass)
  const roundPressureMultiplier = getRoundPressureMultiplier(currentRound, tournamentClass)
  const mainTourEvent = isMainTourEventType(tournament)
  const lowConfidencePenalty = Math.max(0, 52 - state.player.confidence) * 0.22
  const fatiguePenalty = Math.max(0, state.player.fatigue - 24) * 0.16 + Math.max(0, state.player.fatigue - 52) * 0.24
  const lowMentalPenalty = Math.max(0, 55 - mental) * 0.18
  const clutchPenalty = Math.max(0, 60 - pressureSkill) * roundPressureMultiplier * 0.14
  const supportPenalty = Math.max(0, equipmentBonus - 8) * 0.35
  const eliteReadinessBonus = mainTourEvent
    && playerBaseStrength >= 74
    && state.player.confidence >= 68
    && state.player.fatigue <= 50
    ? Math.min(
        3,
        Math.max(0, state.player.confidence - 72) * 0.045
        + Math.max(0, 42 - state.player.fatigue) * 0.035
        + Math.max(0, pressureSkill - 76) * 0.035,
      )
    : 0
  const eliteSupportBonus = mainTourEvent
    && playerBaseStrength >= 76
    && state.player.confidence >= 72
    && state.player.fatigue <= 45
    ? Math.min(1.5, Math.max(0, equipmentBonus - 18) * 0.015)
    : 0
  const playerStrength = clamp(
    playerBaseStrength - lowConfidencePenalty - fatiguePenalty - lowMentalPenalty - clutchPenalty - supportPenalty + eliteReadinessBonus + eliteSupportBonus,
    18,
    96,
  )
  const opponentStrength = clamp(
    opponentBaseStrength + (100 - opponent.ranking) * rankingWeight + roundDifficulty + Math.random() * 8 - qSchoolAdvantage * 0.35 - seededBoost * 0.75 + bottomTourPenalty,
    44,
    97,
  )
  const winChanceBase = mainTourEvent ? 50 : tournamentClass === 'qSchool' ? 49 : 50
  const accessBandBonus = entryAccess.accessBand === 'top16'
    ? (currentRoundIndex === 0 ? 3 : currentRoundIndex === 1 ? 2 : 1)
    : entryAccess.accessBand === 'top32'
      ? (currentRoundIndex === 0 ? 2 : currentRoundIndex === 1 ? 1 : 0)
      : entryAccess.accessBand === 'top64'
        ? (currentRoundIndex === 0 ? 1 : 0)
        : 0
  const eliteClutchBonus = mainTourEvent
    ? Math.min(3, Math.max(0, pressureSkill - 76) * 0.08 + Math.max(0, state.player.confidence - 74) * 0.05)
    : 0
  const eliteRankSeparationBonus = mainTourEvent && worldRank <= TOP_16_RANK_CUTOFF
    ? Math.min(
        worldRank <= 4 ? 3 : 1.5,
        (worldRank <= 4 ? 1.5 : 0.75)
          + Math.max(0, state.player.reputation - 82) * 0.025
          + Math.max(0, pressureSkill - 82) * 0.03,
      )
    : 0
  const eliteFinalConversionBonus = mainTourEvent && currentRound === 'Final' && worldRank <= TOP_16_RANK_CUTOFF
    ? Math.min(
        worldRank <= 4 ? 3 : 1.5,
        0.75
          + Math.max(0, pressureSkill - 84) * 0.04
          + Math.max(0, state.player.confidence - 84) * 0.03
          + Math.max(0, state.player.reputation - 86) * 0.03,
      )
    : 0
  const eliteLateRoundControlBonus = mainTourEvent && worldRank <= TOP_16_RANK_CUTOFF
    ? Math.min(
        worldRank <= 4 ? 3 : 1.5,
        (currentRound === 'Semi Final'
          ? 1.5
          : currentRound === 'Quarter Final'
            ? 1
            : currentRound === 'Last 16'
              ? 0.5
              : 0)
          + Math.max(0, pressureSkill - 84) * 0.03
          + Math.max(0, state.player.confidence - 84) * 0.025
          + Math.max(0, state.player.reputation - 84) * 0.02,
      )
    : 0
  const matureEliteSemiConversionBonus = mainTourEvent
    && currentRound === 'Semi Final'
    && worldRank <= TOP_16_RANK_CUTOFF
    && state.player.age >= 24
    && state.player.age <= 36
    && pressureSkill >= 80
    && state.player.confidence >= 74
    ? Math.min(
        worldRank <= 4 ? 2 : 1,
        0.5
          + Math.max(0, pressureSkill - 86) * 0.035
          + Math.max(0, state.player.confidence - 86) * 0.03,
      )
    : 0
  const matureEliteFinalConversionBonus = mainTourEvent
    && currentRound === 'Final'
    && worldRank <= TOP_16_RANK_CUTOFF
    && state.player.age >= 27
    && state.player.age <= 38
    && pressureSkill >= 78
    && state.player.confidence >= 70
    ? Math.min(
        worldRank <= 4 ? 4 : 2,
        1
          + Math.max(0, pressureSkill - 82) * 0.05
          + Math.max(0, state.player.confidence - 78) * 0.04
          + Math.max(0, state.player.reputation - 82) * 0.03,
      )
    : 0
  const matureTourContenderBonus = mainTourEvent
    && worldRank <= 33
    && state.player.age >= 27
    && state.player.age <= 48
    && playerBaseStrength >= 80
    && pressureSkill >= 72
    ? Math.min(
        worldRank <= TOP_16_RANK_CUTOFF ? 4 : 3,
        (currentRound === 'Final'
          ? 2.4
          : currentRound === 'Semi Final'
            ? 2
            : currentRound === 'Quarter Final'
              ? 1.6
              : currentRound === 'Last 16'
                ? 1.2
                : 0.8)
          + Math.max(0, state.player.confidence - 76) * 0.035
          + Math.max(0, pressureSkill - 78) * 0.035
          + Math.max(0, state.player.reputation - 78) * 0.025,
      )
    : 0
  const risingEliteConversionBonus = mainTourEvent && worldRank <= 4 && state.player.age <= 34
    ? Math.min(
        2,
        (currentRound === 'Final'
          ? 1.5
          : currentRound === 'Semi Final'
            ? 1
            : currentRound === 'Quarter Final'
              ? 0.5
              : 0)
          + Math.max(0, state.player.confidence - 88) * 0.025
          + Math.max(0, pressureSkill - 88) * 0.025,
      )
    : 0
  const eliteMajorConversionBonus = mainTourEvent
    && worldRank <= 4
    && (tournamentClass === 'worldChampionshipMain' || tournamentClass === 'ukMajor' || tournamentClass === 'eliteInvitational')
    ? Math.min(
        tournamentClass === 'worldChampionshipMain' ? 2 : 1.5,
        (currentRound === 'Final'
          ? 1.5
          : currentRound === 'Semi Final'
            ? 1
            : currentRound === 'Quarter Final'
              ? 0.5
              : 0)
          + Math.max(0, state.player.reputation - 88) * 0.02
          + Math.max(0, pressureSkill - 88) * 0.02,
      )
    : 0
  const matureWorldContenderBonus = mainTourEvent
    && tournamentClass === 'worldChampionshipMain'
    && worldRank <= 33
    && state.player.age >= 27
    && state.player.age <= 42
    && pressureSkill >= 74
    && state.player.confidence >= 68
    ? Math.min(
        currentRound === 'Final'
          ? 4.5
          : currentRound === 'Semi Final'
            ? 4
            : currentRound === 'Quarter Final'
              ? 3
              : currentRound === 'Last 16'
                ? 2
                : 1,
        1
          + Math.max(0, pressureSkill - 78) * 0.055
          + Math.max(0, state.player.confidence - 74) * 0.045
          + Math.max(0, state.player.reputation - 78) * 0.035,
      )
    : 0
  const professionalFinals = state.history.tournamentHistory.filter(
    (entry) => isProfessionalFinalLevelRun(entry),
  ).length
  const professionalTitles = state.history.tournamentHistory.filter(
    (entry) => isProfessionalEventType(entry.eventType) && entry.result === 'Winner',
  ).length
  const finalDroughtConversionBonus = mainTourEvent
    && currentRound === 'Final'
    && playerBaseStrength >= 76
    && professionalTitles === 0
    && professionalFinals >= 1
    ? Math.min(
        24,
        10
          + (professionalFinals - 1) * 1.6
          + Math.max(0, playerBaseStrength - 78) * 0.22
          + Math.max(0, pressureSkill - 70) * 0.08,
      )
    : 0
  const earlyMajorPressurePenalty = mainTourEvent && (tournamentClass === 'worldChampionshipMain' || tournamentClass === 'ukMajor' || tournamentClass === 'eliteInvitational')
    ? (state.player.age <= 22
        ? (currentRound === 'Final' ? 12 : currentRound === 'Semi Final' ? 9 : currentRound === 'Quarter Final' ? 5 : 2)
        : state.player.age <= 24
          ? (currentRound === 'Final' ? 8 : currentRound === 'Semi Final' ? 5 : currentRound === 'Quarter Final' ? 3 : 1)
          : state.player.age <= 26
            ? (currentRound === 'Final' ? 4 : currentRound === 'Semi Final' ? 2 : 0)
            : 0)
    : 0
  const worldTitleBurdenPenalty = tournamentClass === 'worldChampionshipMain'
    ? (state.player.age <= 24
        ? (currentRound === 'Final' ? 7 : currentRound === 'Semi Final' ? 4 : 2)
        : state.player.age <= 26
          ? (currentRound === 'Final' ? 3 : currentRound === 'Semi Final' ? 1 : 0)
          : 0)
    : 0
  const eliteWinChanceCeiling = mainTourEvent && worldRank <= 4 && (currentRound === 'Final' || currentRound === 'Semi Final')
    ? (tournamentClass === 'worldChampionshipMain' || tournamentClass === 'ukMajor' ? 84 : 82)
    : mainTourEvent && worldRank <= 4 && currentRound === 'Quarter Final'
      ? (tournamentClass === 'worldChampionshipMain' || tournamentClass === 'ukMajor' ? 80 : 78)
      : mainTourEvent && worldRank <= TOP_16_RANK_CUTOFF && (currentRound === 'Final' || currentRound === 'Semi Final')
        ? 80
        : mainTourEvent
        ? 78
        : tournamentClass === 'senior'
          ? 72
          : 82
  const rawWinChance = clamp(
    winChanceBase + (playerStrength - opponentStrength) * 0.92 + qSchoolAdvantage + seededBoost * 0.45 + accessBandBonus + eliteClutchBonus + eliteRankSeparationBonus + eliteFinalConversionBonus + eliteLateRoundControlBonus + matureEliteSemiConversionBonus + matureEliteFinalConversionBonus + matureTourContenderBonus + risingEliteConversionBonus + eliteMajorConversionBonus + matureWorldContenderBonus + finalDroughtConversionBonus - earlyMajorPressurePenalty - worldTitleBurdenPenalty - bottomTourPenalty,
    mainTourEvent ? 14 : 12,
    eliteWinChanceCeiling,
  )
  const finalDroughtWinChanceFloor = finalDroughtConversionBonus > 0
    ? Math.min(
        eliteWinChanceCeiling,
        64
          + Math.min(14, Math.max(0, professionalFinals - 1) * 1.6)
          + Math.min(4, Math.max(0, playerBaseStrength - 82) * 0.2),
      )
    : null
  const matureWorldFinalWinChanceFloor = tournamentClass === 'worldChampionshipMain'
    && currentRound === 'Final'
    && worldRank <= 33
    && state.player.age >= 27
    && state.player.age <= 42
    && pressureSkill >= 76
    ? Math.min(
        eliteWinChanceCeiling,
        58
          + Math.min(6, Math.max(0, pressureSkill - 80) * 0.35)
          + Math.min(4, Math.max(0, state.player.reputation - 80) * 0.2),
      )
    : null
  const winChanceFloor = Math.max(
    finalDroughtWinChanceFloor ?? 0,
    matureWorldFinalWinChanceFloor ?? 0,
  )
  const winChance = winChanceFloor <= 0 ? rawWinChance : Math.max(rawWinChance, winChanceFloor)

  return {
    currentRound,
    currentRoundIndex,
    roundPlan,
    opponent,
    playerStrength,
    opponentStrength,
    pressureSkill,
    winChance,
  }
}

function createLiveMatchState(state: GameState, tournament: Tournament): LiveMatchState {
  const setup = createMatchSetup(state, tournament)
  const framesNeeded = Math.ceil(setup.roundPlan.bestOf / 2)
  const plannedFrameWinChance = convertMatchWinProbabilityToFrameWinProbability(setup.winChance, setup.roundPlan.bestOf)
  const travelBooking = getTravelBooking(state, tournament.id)
  const travelSummary = travelBooking
    ? `${getTravelOption(travelBooking.travelOptionId).name} · ${getHotelOption(travelBooking.hotelOptionId).name}`
    : 'No travel package locked'
  const activeCoach = state.coaches.find((coach) => coach.id === state.currentCoachId)
  const opponentArchetype = getOpponentArchetype(setup.opponent.playerName, setup.opponent.ranking)
  const tableState = getFrameStartTableState()
  const opponentConfidence = clamp(Math.round(54 + (100 - setup.opponent.ranking) * 0.35 + Math.random() * 12), 52, 92)
  const opponentFatigue = clamp(Math.round(26 + Math.random() * 22), 18, 62)
  const opponentClutch = clamp(Math.round(52 + (100 - setup.opponent.ranking) * 0.24 + Math.random() * 10), 42, 92)
  const playerVisitProfile = buildPlayerLiveVisitProfile(state)
  const opponentVisitProfile = buildOpponentLiveVisitProfile(
    setup.opponent.ranking,
    setup.opponentStrength,
    opponentArchetype,
    opponentConfidence,
    opponentFatigue,
    clamp(Math.round((100 - setup.opponent.ranking) / 14), 0, 8),
  )
  const opponentApproach = getLiveMatchOpponentApproach({
    playerFrames: 0,
    opponentFrames: 0,
    opponentConfidence,
    opponentFatigue,
    pressureValue: 38,
    opponentArchetype,
  })
  const coachPrompt = getLiveMatchCoachPrompt(
    {
      playerFrames: 0,
      opponentFrames: 0,
      pressureValue: 38,
      playerFatigue: state.player.fatigue,
      opponentApproach,
      tacticalPlan: 'Balanced',
      mentalFocus: 'Composed',
      tempo: 'Steady',
    },
    activeCoach?.name,
  )

  return {
    tournamentId: tournament.id,
    round: setup.currentRound,
    bestOf: setup.roundPlan.bestOf,
    framesNeeded,
    playerName: state.player.fullName,
    opponentName: setup.opponent.playerName,
    opponentRanking: setup.opponent.ranking,
    opponentArchetype,
    playerFrames: 0,
    opponentFrames: 0,
    currentFrame: 1,
    playerPoints: 0,
    opponentPoints: 0,
    currentVisit: 1,
    currentBreak: 0,
    tableState,
    ballsRemaining: getLegacyBallUnitsFromTableState(tableState),
    playerAtTable: state.player.fullName,
    frameStarterName: state.player.fullName,
    shotClock: 30,
    playerConfidence: state.player.confidence,
    opponentConfidence,
    playerFatigue: state.player.fatigue,
    opponentFatigue,
    playerClutch: setup.pressureSkill,
    opponentClutch,
    playerHighestBreak: 0,
    opponentHighestBreak: 0,
    playerFifties: 0,
    playerCenturies: 0,
    pressureValue: 38,
    pressureLabel: 'Stable',
    timeElapsedMinutes: 0,
    startedAt: formatDisplayDate(state.currentDate),
    table: `Table ${Math.max(1, Math.ceil(Math.random() * 4))}`,
    referee: ['A. Hughes', 'L. Carter', 'N. Moss'][Math.floor(Math.random() * 3)],
    conditions: travelBooking ? `Prepared · ${travelSummary}` : 'Fast table · short prep window',
    intervalText: `Opening session in ${setup.currentRound}. ${travelBooking ? 'Travel and hotel package are confirmed.' : 'Travel has not been customised yet.'} Rival profile: ${getOpponentArchetypeNote(opponentArchetype)}.`,
    framesRemainingText: `${framesNeeded} frames needed to win`,
    plannedWinChance: plannedFrameWinChance,
    plannedMatchWinChance: setup.winChance,
    plannedPlayerStrength: setup.playerStrength,
    plannedOpponentStrength: setup.opponentStrength,
    feed: [
      {
        id: `feed-start-${Date.now()}`,
        time: '00:00',
        text: `${state.player.fullName} walks out to face ${setup.opponent.playerName} in the ${setup.currentRound}. Rival profile: ${getOpponentArchetypeNote(opponentArchetype)}.`,
        actor: 'System',
        tone: 'blue',
      },
    ],
    momentum: [{ label: 'Start', player: 50, opponent: 50 }],
    frameHistory: [],
    tacticalPlan: 'Balanced',
    mentalFocus: 'Composed',
    tempo: 'Steady',
    timeoutsRemaining: 2,
    lastFrameMode: null,
    lastTacticalNote: coachPrompt.note,
    lastVisitSummary: 'Opening visit is ready.',
    opponentApproach,
    tacticalEdge: getTacticalMatchupEdge('Balanced', opponentApproach),
    coachPrompt,
    lastOpponentAdjustment: null,
    opponentAdjustmentHistory: [],
    visitHistory: [],
    playerVisitProfile,
    opponentVisitProfile,
    status: 'In Progress' as const,
  }
}

export function simulateSyntheticLiveVisitMatch(input: SyntheticLiveVisitMatchInput): SyntheticLiveVisitMatchResult {
  if (input.simulationMode !== SIMULATION_MODE.liveVisitCalibration) {
    throw new Error('Synthetic live-visit simulation is only available in liveVisitCalibration mode.')
  }

  return withSeededLiveMatchRandom(input.seed, () => {
    const round = input.round ?? getSyntheticLiveMatchRound(input.bestOf)
    const framesNeeded = Math.ceil(input.bestOf / 2)
    const initialPlayerFrames = input.initialPlayerFrames ?? 0
    const initialOpponentFrames = input.initialOpponentFrames ?? 0
    const plannedFrameWinChance = convertMatchWinProbabilityToFrameWinProbability(input.plannedMatchWinChance, input.bestOf)
    const opponentArchetype = getOpponentArchetype(input.opponentName, input.opponentRanking)
    const initialPressureValue = input.initialPressureValue ?? getSyntheticDefaultPressureValue(initialPlayerFrames, initialOpponentFrames, framesNeeded)
    const playerConstructedProfile = buildLiveVisitProfile({
      side: 'player',
      name: input.playerName,
      sourceKind: 'attributes',
      attributes: input.playerAttributes,
      confidence: input.playerConfidence,
      fatigue: input.playerFatigue,
      equipmentBonus: input.playerEquipmentBonus ?? 0,
      sourceRankBand: input.playerRankBand ?? 'Synthetic Player',
      tacticalPlan: input.playerTacticalPlan,
      startsFrameProbability: input.startingPlayer === 'opponent' ? 0 : 100,
      initialMomentum: 50,
    })
    const opponentConstructedProfile = input.opponentProfileMode === 'attributes' && input.opponentAttributes
      ? buildLiveVisitProfile({
          side: 'opponent',
          name: input.opponentName,
          sourceKind: 'attributes',
          attributes: input.opponentAttributes,
          confidence: input.opponentConfidence,
          fatigue: input.opponentFatigue,
          equipmentBonus: input.opponentEquipmentBonus ?? 0,
          sourceRankBand: input.opponentRankBand ?? 'Synthetic Opponent',
          tacticalPlan: input.opponentTacticalPlan,
          startsFrameProbability: input.startingPlayer === 'opponent' ? 100 : 0,
          initialMomentum: 50,
        })
      : buildLiveVisitProfile({
          side: 'opponent',
          name: input.opponentName,
          sourceKind: 'rankBased',
          attributes: buildRankBasedLiveVisitAttributes(
            input.opponentRanking,
            input.opponentStrength,
            opponentArchetype,
            input.opponentRankBand ?? getLiveVisitRankBand(input.opponentRanking),
            false,
          ),
          confidence: input.opponentConfidence,
          fatigue: input.opponentFatigue,
          equipmentBonus: input.opponentEquipmentBonus ?? clamp(Math.round((100 - input.opponentRanking) / 14), 0, 8),
          sourceRankBand: input.opponentRankBand ?? getLiveVisitRankBand(input.opponentRanking),
          tacticalPlan: input.opponentTacticalPlan,
          startsFrameProbability: input.startingPlayer === 'opponent' ? 100 : 0,
          initialMomentum: 50,
        })
    const playerVisitProfile = playerConstructedProfile.visitProfile
    const opponentVisitProfile = opponentConstructedProfile.visitProfile
    const opponentApproach = getLiveMatchOpponentApproach({
      playerFrames: initialPlayerFrames,
      opponentFrames: initialOpponentFrames,
      opponentConfidence: input.opponentConfidence,
      opponentFatigue: input.opponentFatigue,
      pressureValue: initialPressureValue,
      opponentArchetype,
    })
    const coachPrompt = getLiveMatchCoachPrompt({
      playerFrames: initialPlayerFrames,
      opponentFrames: initialOpponentFrames,
      pressureValue: initialPressureValue,
      playerFatigue: input.playerFatigue,
      opponentApproach,
      tacticalPlan: 'Balanced',
      mentalFocus: 'Composed',
      tempo: 'Steady',
    })
    const tableState = getFrameStartTableState()
    const decisionCounts: Record<LiveVisitDecision, number> = {
      'Pot Attempt': 0,
      'Break Build': 0,
      'Safety Exchange': 0,
      'Snooker Hunt': 0,
      'Respotted Black': 0,
    }
    let totalVisits = 0
    let guard = 0
    const firstScoringFrames = new Set<string>()
    const fullVisitLog: SyntheticLiveVisitVisitLogEntry[] = []
    const frameSummaries: SyntheticLiveVisitFrameSummary[] = []
    const debugMetrics: SyntheticLiveVisitDebugMetrics = {
      player: createSyntheticLiveVisitSideMetrics(),
      opponent: createSyntheticLiveVisitSideMetrics(),
    }
    const syntheticTacticalEdge = input.preserveTacticalEdge
      ? getSyntheticTacticalStyleEdge(playerConstructedProfile.tacticalPlan, opponentConstructedProfile.tacticalPlan)
      : 0

    let liveMatch: LiveMatchState = {
      tournamentId: 'synthetic-live-visit',
      round,
      bestOf: input.bestOf,
      framesNeeded,
      playerName: input.playerName,
      opponentName: input.opponentName,
      opponentRanking: input.opponentRanking,
      opponentArchetype,
      playerFrames: initialPlayerFrames,
      opponentFrames: initialOpponentFrames,
      currentFrame: initialPlayerFrames + initialOpponentFrames + 1,
      playerPoints: 0,
      opponentPoints: 0,
      currentVisit: 1,
      currentBreak: 0,
      tableState,
      ballsRemaining: getLegacyBallUnitsFromTableState(tableState),
      playerAtTable: input.startingPlayer === 'opponent' ? input.opponentName : input.playerName,
      frameStarterName: input.startingPlayer === 'opponent' ? input.opponentName : input.playerName,
      shotClock: 30,
      playerConfidence: input.playerConfidence,
      opponentConfidence: input.opponentConfidence,
      playerFatigue: input.playerFatigue,
      opponentFatigue: input.opponentFatigue,
      playerClutch: input.playerClutch,
      opponentClutch: input.opponentClutch,
      playerHighestBreak: 0,
      opponentHighestBreak: 0,
      playerFifties: 0,
      playerCenturies: 0,
      pressureValue: initialPressureValue,
      pressureLabel: initialPressureValue >= 78 ? 'High' : initialPressureValue >= 58 ? 'Building' : 'Stable',
      timeElapsedMinutes: 0,
      startedAt: 'Synthetic Calibration',
      table: 'Calibration Table',
      referee: 'Synthetic Referee',
      conditions: 'Controlled live-visit simulation',
      intervalText: `Synthetic ${round} calibration match. Rival profile: ${getOpponentArchetypeNote(opponentArchetype)}.`,
      framesRemainingText: `${framesNeeded} frames needed to win`,
      plannedWinChance: plannedFrameWinChance,
      plannedMatchWinChance: input.plannedMatchWinChance,
      plannedPlayerStrength: input.playerStrength,
      plannedOpponentStrength: input.opponentStrength,
      feed: [
        {
          id: 'feed-start-synthetic',
          time: '00:00',
          text: `${input.playerName} faces ${input.opponentName} in a synthetic ${round} calibration match.`,
          actor: 'System',
          tone: 'blue',
        },
      ],
      momentum: [{ label: 'Start', player: 50, opponent: 50 }],
      frameHistory: [],
      tacticalPlan: 'Balanced',
      mentalFocus: 'Composed',
      tempo: 'Steady',
      timeoutsRemaining: 2,
      lastFrameMode: null,
      lastTacticalNote: coachPrompt.note,
      lastVisitSummary: 'Opening visit is ready.',
      opponentApproach,
      tacticalEdge: syntheticTacticalEdge,
      coachPrompt,
      lastOpponentAdjustment: null,
      opponentAdjustmentHistory: [],
      visitHistory: [],
      playerVisitProfile,
      opponentVisitProfile,
      status: 'In Progress',
    }
    let currentFrameStartState = liveMatch
    let currentFrameVisits: SyntheticLiveVisitVisitLogEntry[] = []

    while (liveMatch.status === 'In Progress' && guard < 4000) {
      if (liveMatch.currentVisit === 1) {
        const startingSide = liveMatch.playerAtTable === liveMatch.playerName ? debugMetrics.player : debugMetrics.opponent
        startingSide.frameStarts += 1
      }
      const calibrationState = { ...liveMatch, tacticalEdge: syntheticTacticalEdge }
      const activePlan = calibrationState.playerAtTable === calibrationState.playerName
        ? playerConstructedProfile.tacticalPlan
        : opponentConstructedProfile.tacticalPlan
      const nextLiveMatch = advanceLiveVisit(calibrationState, getSyntheticCalibrationVisitDecision(calibrationState, activePlan), 'simulated')
      const latestVisit = nextLiveMatch.visitHistory[0]
      if (latestVisit) {
        const capturedVisit = { ...latestVisit }
        decisionCounts[latestVisit.decision] += 1
        totalVisits += 1
        fullVisitLog.push(capturedVisit)
        currentFrameVisits.push(capturedVisit)
        const actorMetrics = latestVisit.actor === 'Player' ? debugMetrics.player : debugMetrics.opponent
        actorMetrics.visits += 1
        actorMetrics.pointsScored += latestVisit.points
        actorMetrics.totalTacticalEdge += latestVisit.tacticalEdge
        actorMetrics.totalDecisionBonus += latestVisit.decisionBonus
        actorMetrics.totalSuccessChance += latestVisit.successChance
        actorMetrics.totalConfidence += latestVisit.actorConfidence
        actorMetrics.totalFatigue += latestVisit.actorFatigue
        if (latestVisit.points > 0) {
          actorMetrics.scoringVisitCount += 1
          actorMetrics.totalScoringBreak += latestVisit.breakTotal
          if (!firstScoringFrames.has(latestVisit.frameLabel)) {
            actorMetrics.firstScoringChances += 1
            firstScoringFrames.add(latestVisit.frameLabel)
          }
        }
        if (latestVisit.foulOccurred) {
          actorMetrics.foulsCommitted += 1
        } else if (!latestVisit.success) {
          actorMetrics.unforcedErrors += 1
        }
        recordSyntheticDecisionMetrics(actorMetrics, latestVisit.decision, latestVisit.success)
      }
      if (nextLiveMatch.frameHistory.length > liveMatch.frameHistory.length) {
        const completedFrame = nextLiveMatch.frameHistory[nextLiveMatch.frameHistory.length - 1]
        frameSummaries.push(buildSyntheticFrameSummary(currentFrameStartState, nextLiveMatch, completedFrame, currentFrameVisits))
        currentFrameVisits = []
        currentFrameStartState = nextLiveMatch
      }
      liveMatch = { ...nextLiveMatch, tacticalEdge: syntheticTacticalEdge }
      guard += 1
    }

    debugMetrics.player.frameWins = liveMatch.frameHistory.filter((frame) => frame.winner === liveMatch.playerName).length
    debugMetrics.opponent.frameWins = liveMatch.frameHistory.filter((frame) => frame.winner === liveMatch.opponentName).length

    return {
      playerWon: liveMatch.playerFrames > liveMatch.opponentFrames,
      playerFrames: liveMatch.playerFrames,
      opponentFrames: liveMatch.opponentFrames,
      score: `${liveMatch.playerFrames}-${liveMatch.opponentFrames}`,
      frameWinChance: plannedFrameWinChance,
      decidingFrame: Math.max(liveMatch.playerFrames, liveMatch.opponentFrames) === liveMatch.framesNeeded && Math.min(liveMatch.playerFrames, liveMatch.opponentFrames) === liveMatch.framesNeeded - 1,
      whitewash: Math.min(liveMatch.playerFrames, liveMatch.opponentFrames) === 0,
      playerHighestBreak: liveMatch.playerHighestBreak,
      opponentHighestBreak: liveMatch.opponentHighestBreak,
      playerFifties: liveMatch.playerFifties,
      playerCenturies: liveMatch.playerCenturies,
      totalVisits,
      decisionCounts,
      frameHistory: liveMatch.frameHistory,
      frameSummaries,
      fullVisitLog,
      debugMetrics,
      constructedProfiles: {
        player: playerConstructedProfile,
        opponent: opponentConstructedProfile,
      },
      finalState: {
        playerConfidence: liveMatch.playerConfidence,
        opponentConfidence: liveMatch.opponentConfidence,
        playerFatigue: liveMatch.playerFatigue,
        opponentFatigue: liveMatch.opponentFatigue,
        pressureValue: liveMatch.pressureValue,
        pressureLabel: liveMatch.pressureLabel,
      },
    }
  })
}

function resolveCompletedLiveFrame(liveMatch: LiveMatchState, mode: 'Played' | 'Simmed'): LiveMatchState {
  let nextPlayerPoints = liveMatch.playerPoints
  let nextOpponentPoints = liveMatch.opponentPoints
  let playerWinsFrame = nextPlayerPoints > nextOpponentPoints

  if (mode === 'Simmed') {
    const plannedFrameWinChance = liveMatch.plannedWinChance ?? convertMatchWinProbabilityToFrameWinProbability(liveMatch.plannedMatchWinChance, liveMatch.bestOf)
    const matchExpectationEdge = liveMatch.plannedMatchWinChance - 50
    const formatExpectationEdge = matchExpectationEdge * (
      liveMatch.bestOf >= 25 ? 0.22 : liveMatch.bestOf >= 19 ? 0.1 : liveMatch.bestOf <= 7 ? -0.08 : 0
    )
    const pointEdge = clamp((nextPlayerPoints - nextOpponentPoints) * 0.08, -8, 8)
    const confidenceEdge = clamp((liveMatch.playerConfidence - liveMatch.opponentConfidence) * 0.05, -4, 4)
    const clutchEdge = clamp((liveMatch.playerClutch - liveMatch.opponentClutch) * 0.05, -4, 4)
    const fatigueEdge = clamp((liveMatch.opponentFatigue - liveMatch.playerFatigue) * 0.04, -4, 4)
    const pressureClamp = liveMatch.pressureValue >= 78 ? 0.75 : liveMatch.pressureValue >= 58 ? 0.9 : 1
    const simulatedFrameWinChance = clamp(
      plannedFrameWinChance + formatExpectationEdge + pointEdge * pressureClamp + confidenceEdge + clutchEdge + fatigueEdge,
      4,
      96,
    )
    playerWinsFrame = Math.random() * 100 < simulatedFrameWinChance

    if (playerWinsFrame && nextPlayerPoints <= nextOpponentPoints) {
      nextPlayerPoints = nextOpponentPoints + clamp(5 + Math.round(Math.random() * 18), 5, 23)
    } else if (!playerWinsFrame && nextOpponentPoints <= nextPlayerPoints) {
      nextOpponentPoints = nextPlayerPoints + clamp(5 + Math.round(Math.random() * 18), 5, 23)
    }
  } else if (nextPlayerPoints === nextOpponentPoints) {
    const respottedBlackWinChance = clamp(
      50
        + ((liveMatch.plannedWinChance ?? 50) - 50) * 0.3
        + (liveMatch.playerClutch - liveMatch.opponentClutch) * 0.2
        + (liveMatch.playerConfidence - liveMatch.opponentConfidence) * 0.08,
      35,
      65,
    )
    playerWinsFrame = Math.random() * 100 < respottedBlackWinChance
    if (playerWinsFrame) {
      nextPlayerPoints += 7
    } else {
      nextOpponentPoints += 7
    }
  }

  const frameLabel = `F${liveMatch.currentFrame}`
  const nextPlayerFrames = liveMatch.playerFrames + (playerWinsFrame ? 1 : 0)
  const nextOpponentFrames = liveMatch.opponentFrames + (playerWinsFrame ? 0 : 1)
  const matchComplete = nextPlayerFrames >= liveMatch.framesNeeded || nextOpponentFrames >= liveMatch.framesNeeded
  const pressureValue = clamp(38 + Math.abs(nextPlayerFrames - nextOpponentFrames) * 8 + (matchComplete ? 18 : 0), 24, 96)
  const nextPlayerConfidence = clamp(liveMatch.playerConfidence + (playerWinsFrame ? 2 : -2), 25, 99)
  const nextOpponentConfidence = clamp(liveMatch.opponentConfidence + (playerWinsFrame ? -2 : 2), 25, 99)
  const nextPlayerFatigue = clamp(liveMatch.playerFatigue + getLiveVisitFrameFatigueCost(liveMatch.playerVisitProfile), 0, 100)
  const nextOpponentFatigue = clamp(liveMatch.opponentFatigue + getLiveVisitFrameFatigueCost(liveMatch.opponentVisitProfile), 0, 100)
  const nextOpponentApproach = getLiveMatchOpponentApproach({
    playerFrames: nextPlayerFrames,
    opponentFrames: nextOpponentFrames,
    opponentConfidence: nextOpponentConfidence,
    opponentFatigue: nextOpponentFatigue,
    pressureValue,
    opponentArchetype: liveMatch.opponentArchetype,
  })
  const opponentAdjustment = buildOpponentAdjustmentEvent({
    previousApproach: liveMatch.opponentApproach,
    nextApproach: nextOpponentApproach,
    frameLabel,
    nextPlayerFrames,
    nextOpponentFrames,
    pressureValue,
  })
  const nextCoachPrompt = getLiveMatchCoachPrompt(
    {
      playerFrames: nextPlayerFrames,
      opponentFrames: nextOpponentFrames,
      pressureValue,
      playerFatigue: nextPlayerFatigue,
      opponentApproach: nextOpponentApproach,
      tacticalPlan: liveMatch.tacticalPlan,
      mentalFocus: liveMatch.mentalFocus,
      tempo: liveMatch.tempo,
    },
  )
  const frameFeed = buildVisitFeedEntry(
    formatLiveClock(liveMatch.timeElapsedMinutes),
    `${mode} ${frameLabel}: ${playerWinsFrame ? liveMatch.playerName : liveMatch.opponentName} wins the frame ${nextPlayerPoints}-${nextOpponentPoints}.`,
    playerWinsFrame ? 'Player' : 'Opponent',
    playerWinsFrame ? 'green' : 'amber',
  )
  const adjustmentFeed = opponentAdjustment
    ? buildVisitFeedEntry(formatLiveClock(liveMatch.timeElapsedMinutes), `Opponent adjustment: ${opponentAdjustment.note}`, 'System', 'blue')
    : null
  const frameRow: FrameScoreRow = {
    frame: frameLabel,
    player: `${nextPlayerPoints}`,
    opponent: `${nextOpponentPoints}`,
    winner: playerWinsFrame ? liveMatch.playerName : liveMatch.opponentName,
  }
  const nextFrameStarterName = liveMatch.frameStarterName === liveMatch.playerName ? liveMatch.opponentName : liveMatch.playerName

  return {
    ...liveMatch,
    playerFrames: nextPlayerFrames,
    opponentFrames: nextOpponentFrames,
    currentFrame: matchComplete ? liveMatch.currentFrame : liveMatch.currentFrame + 1,
    playerPoints: matchComplete ? nextPlayerPoints : 0,
    opponentPoints: matchComplete ? nextOpponentPoints : 0,
    currentVisit: 1,
    currentBreak: 0,
    tableState: matchComplete ? { redsRemaining: 0, coloursRemaining: [] } : getFrameStartTableState(),
    ballsRemaining: matchComplete ? 0 : getLegacyBallUnitsFromTableState(getFrameStartTableState()),
    playerAtTable: matchComplete ? (playerWinsFrame ? liveMatch.playerName : liveMatch.opponentName) : nextFrameStarterName,
    frameStarterName: matchComplete ? liveMatch.frameStarterName : nextFrameStarterName,
    shotClock: matchComplete ? 0 : 30,
    playerConfidence: nextPlayerConfidence,
    opponentConfidence: nextOpponentConfidence,
    playerFatigue: nextPlayerFatigue,
    opponentFatigue: nextOpponentFatigue,
    pressureValue,
    pressureLabel: pressureValue >= 78 ? 'High' : pressureValue >= 58 ? 'Building' : 'Stable',
    intervalText: matchComplete ? 'Final frame completed. Result is being confirmed.' : `${liveMatch.framesNeeded - Math.max(nextPlayerFrames, nextOpponentFrames)} more frame wins secure the match. ${nextCoachPrompt.note}`,
    framesRemainingText: matchComplete ? 'Match complete' : `${liveMatch.framesNeeded - nextPlayerFrames} frames to win`,
    feed: ([frameFeed, adjustmentFeed, ...liveMatch.feed].filter(Boolean) as LiveFeedItem[]).slice(0, 16),
    momentum: [...liveMatch.momentum.slice(-(liveMatch.bestOf - 1)), { label: frameLabel, player: nextPlayerFrames, opponent: nextOpponentFrames }],
    frameHistory: [...liveMatch.frameHistory, frameRow],
    lastFrameMode: mode,
    lastVisitSummary: `${frameLabel} complete. ${playerWinsFrame ? liveMatch.playerName : liveMatch.opponentName} took the frame ${nextPlayerPoints}-${nextOpponentPoints}.`,
    lastTacticalNote: `${liveMatch.lastTacticalNote}${nextPlayerPoints === nextOpponentPoints ? ' Respotted black decided the frame.' : ''}`,
    opponentApproach: nextOpponentApproach,
    tacticalEdge: getTacticalMatchupEdge(liveMatch.tacticalPlan, nextOpponentApproach),
    coachPrompt: nextCoachPrompt,
    lastOpponentAdjustment: opponentAdjustment,
    opponentAdjustmentHistory: opponentAdjustment
      ? [opponentAdjustment, ...liveMatch.opponentAdjustmentHistory].slice(0, 4)
      : liveMatch.opponentAdjustmentHistory,
    status: (matchComplete ? 'Completed' : 'In Progress') as LiveMatchState['status'],
  }
}

function advanceLiveVisit(liveMatch: LiveMatchState, decision?: LiveVisitDecision, mode: LiveMatchResolutionMode = 'manual'): LiveMatchState {
  const actorIsPlayer = liveMatch.playerAtTable === liveMatch.playerName
  const actor: LiveVisitActor = actorIsPlayer ? 'Player' : 'Opponent'
  const resolvedDecision = decision ?? (actorIsPlayer ? getDefaultManualVisitDecision(liveMatch) : getAutoOpponentVisitDecision(liveMatch))
  const tacticalModifiers = getLiveMatchTacticalModifiers(liveMatch, actorIsPlayer && mode === 'manual' ? 'manual' : 'simulated')
  const tacticalEdge = actorIsPlayer ? liveMatch.tacticalEdge : -liveMatch.tacticalEdge
  const activeProfile = actorIsPlayer ? liveMatch.playerVisitProfile : liveMatch.opponentVisitProfile
  const defendingProfile = actorIsPlayer ? liveMatch.opponentVisitProfile : liveMatch.playerVisitProfile
  const actorConfidence = actorIsPlayer ? liveMatch.playerConfidence : liveMatch.opponentConfidence
  const actorFatigue = actorIsPlayer ? liveMatch.playerFatigue : liveMatch.opponentFatigue
  const actorClutch = actorIsPlayer ? liveMatch.playerClutch : liveMatch.opponentClutch
  const pressureHandling = (activeProfile.bigMatchNerve * 0.4 + activeProfile.composure * 0.35 + activeProfile.focus * 0.25)
  const pressureLoad = Math.max(0, liveMatch.pressureValue - 58)
  const pressureModifier = (pressureHandling - 60) * (pressureLoad / 24) * 0.14
  const plannedFrameWinChance = liveMatch.plannedWinChance ?? convertMatchWinProbabilityToFrameWinProbability(liveMatch.plannedMatchWinChance, liveMatch.bestOf)
  const actorFrameExpectation = actorIsPlayer ? plannedFrameWinChance : 100 - plannedFrameWinChance
  const actorMatchExpectation = actorIsPlayer ? liveMatch.plannedMatchWinChance : 100 - liveMatch.plannedMatchWinChance
  const actorBaselineChance = 50 + (actorFrameExpectation - 50) * 0.32 + (actorMatchExpectation - 50) * 0.1
  const remainingTablePoints = getRemainingTablePoints(liveMatch)
  const technicalSkill = resolvedDecision === 'Break Build'
    ? activeProfile.breakBuilding * 0.34 + activeProfile.cueBallControl * 0.24 + activeProfile.consistency * 0.18 + activeProfile.focus * 0.12 + activeProfile.stamina * 0.12
    : resolvedDecision === 'Pot Attempt'
      ? activeProfile.longPotting * 0.34 + activeProfile.cueBallControl * 0.22 + activeProfile.consistency * 0.16 + activeProfile.handSteadiness * 0.14 + activeProfile.composure * 0.14
      : resolvedDecision === 'Safety Exchange'
        ? activeProfile.safetyPlay * 0.36 + activeProfile.focus * 0.2 + activeProfile.composure * 0.18 + activeProfile.cueBallControl * 0.16 + activeProfile.bigMatchNerve * 0.1
        : resolvedDecision === 'Snooker Hunt'
          ? activeProfile.safetyPlay * 0.26 + activeProfile.focus * 0.2 + activeProfile.composure * 0.18 + activeProfile.bigMatchNerve * 0.2 + activeProfile.cueBallControl * 0.16
          : activeProfile.longPotting * 0.28 + activeProfile.cueBallControl * 0.2 + activeProfile.consistency * 0.14 + activeProfile.composure * 0.18 + activeProfile.bigMatchNerve * 0.14 + activeProfile.handSteadiness * 0.06
  const defensiveResistance = resolvedDecision === 'Safety Exchange' || resolvedDecision === 'Snooker Hunt'
    ? defendingProfile.safetyPlay * 0.18 + defendingProfile.focus * 0.16 + defendingProfile.composure * 0.12
    : defendingProfile.safetyPlay * 0.1 + defendingProfile.composure * 0.08
  const decisionBonus = resolvedDecision === 'Break Build'
    ? 2 + tacticalModifiers.playerBreakBonus * 0.12
    : resolvedDecision === 'Safety Exchange'
      ? Math.max(0, liveMatch.pressureValue - 48) * 0.05
      : resolvedDecision === 'Snooker Hunt'
        ? Math.max(0, (actorIsPlayer ? liveMatch.opponentPoints - liveMatch.playerPoints : liveMatch.playerPoints - liveMatch.opponentPoints) - remainingTablePoints) * 0.45 + 3
        : resolvedDecision === 'Respotted Black'
          ? Math.max(0, liveMatch.pressureValue - 56) * 0.04
          : 0
  const profileEdge = (technicalSkill - 64) * 0.26 - (defensiveResistance - 16) * (resolvedDecision === 'Safety Exchange' || resolvedDecision === 'Snooker Hunt' ? 0.13 : 0.08)
  const confidenceEdge = (actorConfidence - 62) * 0.1
  const clutchEdge = (actorClutch - 62) * 0.08
  const fatigueDrag = Math.max(0, actorFatigue - 12) * 0.08
  const successChance = clamp(
    actorBaselineChance
      + profileEdge
      + confidenceEdge
      + clutchEdge
      + tacticalEdge * (mode === 'manual' ? 0.8 : 0.35)
      + pressureModifier
      + decisionBonus * 0.55
      - fatigueDrag,
    resolvedDecision === 'Respotted Black' ? 22 : 16,
    resolvedDecision === 'Safety Exchange' || resolvedDecision === 'Snooker Hunt' ? 88 : 92,
  )
  const success = Math.random() * 100 < successChance
  const foulRisk = clamp(
    (resolvedDecision === 'Break Build' ? 18 : resolvedDecision === 'Snooker Hunt' ? 20 : resolvedDecision === 'Respotted Black' ? 16 : resolvedDecision === 'Safety Exchange' ? 14 : 12)
      + Math.max(0, liveMatch.pressureValue - 64) * 0.15
      + Math.max(0, actorFatigue - 54) * 0.08
      + Math.max(0, 60 - pressureHandling) * 0.09
      + Math.max(0, 50 - actorBaselineChance) * 0.08
      - Math.max(0, actorBaselineChance - 50) * 0.04
      - activeProfile.consistency * 0.06
      - activeProfile.focus * 0.04
      - activeProfile.handSteadiness * 0.03,
    4,
    42,
  )
  const foulOccurred = !success && Math.random() * 100 < foulRisk
  const foulPoints = foulOccurred ? clamp(4 + Math.round(Math.random() * 3), 4, 7) : 0
  const retainChance = resolvedDecision === 'Break Build' ? 76 : resolvedDecision === 'Pot Attempt' ? 56 : 0
  const retainedTable = success && Math.random() * 100 < retainChance
  const visitScoring = success && !foulOccurred
    ? resolveLiveVisitScoring(activeProfile, resolvedDecision, liveMatch.tableState, retainedTable)
    : {
        scoredPoints: 0,
        nextTableState: {
          redsRemaining: liveMatch.tableState.redsRemaining,
          coloursRemaining: [...liveMatch.tableState.coloursRemaining],
        },
        tableProgressLabel: '',
      }
  const { scoredPoints, nextTableState, tableProgressLabel } = visitScoring

  const nextBallsRemaining = getLegacyBallUnitsFromTableState(nextTableState)
  const nextRemainingTablePoints = nextTableState.redsRemaining * 8 + nextTableState.coloursRemaining.reduce((total, colour) => total + LIVE_ENDGAME_COLOUR_POINTS[colour], 0)
  const playerPointDelta = actorIsPlayer ? scoredPoints : foulOccurred ? foulPoints : 0
  const opponentPointDelta = actorIsPlayer ? (foulOccurred ? foulPoints : 0) : scoredPoints
  const nextPlayerPoints = liveMatch.playerPoints + playerPointDelta
  const nextOpponentPoints = liveMatch.opponentPoints + opponentPointDelta
  const completedBreakTotal = success && !foulOccurred && (resolvedDecision === 'Pot Attempt' || resolvedDecision === 'Break Build' || resolvedDecision === 'Respotted Black')
    ? liveMatch.currentBreak + scoredPoints
    : 0
  const nextCurrentBreak = retainedTable
    ? completedBreakTotal
    : 0
  const nextPlayerAtTable = retainedTable
    ? liveMatch.playerAtTable
    : actorIsPlayer
      ? liveMatch.opponentName
      : liveMatch.playerName
  const nextPlayerConfidence = clamp(liveMatch.playerConfidence + (actorIsPlayer ? (success ? 1 : -1) : success ? -1 : 1), 25, 99)
  const nextOpponentConfidence = clamp(liveMatch.opponentConfidence + (!actorIsPlayer ? (success ? 1 : -1) : success ? -1 : 1), 25, 99)
  const actingFatigueCost = getLiveVisitFatigueCost(activeProfile, resolvedDecision, resolvedDecision === 'Break Build' ? 1.15 : 0.65)
  const nextPlayerFatigue = clamp(liveMatch.playerFatigue + (actorIsPlayer ? actingFatigueCost : 0), 0, 100)
  const nextOpponentFatigue = clamp(liveMatch.opponentFatigue + (!actorIsPlayer ? actingFatigueCost : 0), 0, 100)
  const nextPressureValue = clamp(liveMatch.pressureValue + (success ? -2 : 3) + (retainedTable ? -1 : 2), 24, 96)
  const frameLabel = `F${liveMatch.currentFrame}`
  const successOutcome = resolvedDecision === 'Safety Exchange'
    ? 'Won the safety exchange'
    : resolvedDecision === 'Snooker Hunt'
      ? `Forced a foul worth ${scoredPoints}`
      : tableProgressLabel
        ? retainedTable
          ? `${tableProgressLabel} and stayed in`
          : `${tableProgressLabel} but left a chance`
        : retainedTable
          ? 'Scored and stayed in'
          : 'Scored but left a chance'
  const visitLogEntry: LiveVisitLogEntry = {
    id: `visit-${Date.now()}`,
    frameLabel,
    visit: liveMatch.currentVisit,
    actor,
    decision: resolvedDecision,
    outcome: foulOccurred
      ? `Committed a foul worth ${foulPoints}`
      : success
        ? successOutcome
        : 'Missed the chance',
    points: actorIsPlayer ? playerPointDelta - (foulOccurred ? foulPoints : 0) : opponentPointDelta,
    breakTotal: completedBreakTotal,
    retainedTable,
      success,
      foulOccurred,
      successChance,
      tacticalEdge,
      decisionBonus,
      actorConfidence,
      actorFatigue,
      pressureValue: liveMatch.pressureValue,
      playerPointsAfter: nextPlayerPoints,
      opponentPointsAfter: nextOpponentPoints,
  }
  const feedEntry = buildVisitFeedEntry(
    formatLiveClock(liveMatch.timeElapsedMinutes + 4),
    foulOccurred
      ? `${actorIsPlayer ? 'You' : liveMatch.opponentName} fouled during ${resolvedDecision.toLowerCase()} play. ${foulPoints} points conceded.`
      : success
        ? resolvedDecision === 'Snooker Hunt'
          ? `${actorIsPlayer ? 'You' : liveMatch.opponentName} forced a foul with a snooker hunt and gained ${scoredPoints} points.`
          : resolvedDecision === 'Respotted Black'
            ? `${actorIsPlayer ? 'You' : liveMatch.opponentName} pots the respotted black.`
            : `${actorIsPlayer ? 'You' : liveMatch.opponentName} ${tableProgressLabel || `played ${resolvedDecision.toLowerCase()} for ${scoredPoints} points`}.${retainedTable ? ' Stayed at the table.' : ' Turn changes.'}`
        : `${actorIsPlayer ? 'You' : liveMatch.opponentName} tried ${resolvedDecision.toLowerCase()} and missed. Turn changes.`,
    foulOccurred ? 'System' : actor,
    foulOccurred ? 'red' : success ? (actorIsPlayer ? 'green' : 'amber') : 'blue',
  )
  const frameClinched = (nextRemainingTablePoints === 0 && nextPlayerPoints !== nextOpponentPoints)
    || nextPlayerPoints > nextOpponentPoints + nextRemainingTablePoints
    || nextOpponentPoints > nextPlayerPoints + nextRemainingTablePoints
    || (liveMatch.currentVisit >= 42 && nextPlayerPoints !== nextOpponentPoints)

  const progressedLiveMatch: LiveMatchState = {
    ...liveMatch,
    playerPoints: nextPlayerPoints,
    opponentPoints: nextOpponentPoints,
    currentVisit: liveMatch.currentVisit + 1,
    currentBreak: nextCurrentBreak,
    tableState: nextTableState,
    ballsRemaining: nextBallsRemaining,
    playerAtTable: nextPlayerAtTable,
    shotClock: success && retainedTable ? 22 : 30,
    playerConfidence: nextPlayerConfidence,
    opponentConfidence: nextOpponentConfidence,
    playerFatigue: nextPlayerFatigue,
    opponentFatigue: nextOpponentFatigue,
    playerHighestBreak: actorIsPlayer ? Math.max(liveMatch.playerHighestBreak, completedBreakTotal) : liveMatch.playerHighestBreak,
    opponentHighestBreak: !actorIsPlayer ? Math.max(liveMatch.opponentHighestBreak, completedBreakTotal) : liveMatch.opponentHighestBreak,
    playerFifties: actorIsPlayer && completedBreakTotal >= 50 && liveMatch.currentBreak < 50 ? liveMatch.playerFifties + 1 : liveMatch.playerFifties,
    playerCenturies: actorIsPlayer && completedBreakTotal >= 100 && liveMatch.currentBreak < 100 ? liveMatch.playerCenturies + 1 : liveMatch.playerCenturies,
    pressureValue: nextPressureValue,
    pressureLabel: nextPressureValue >= 78 ? 'High' : nextPressureValue >= 58 ? 'Building' : 'Stable',
    timeElapsedMinutes: liveMatch.timeElapsedMinutes + 4,
    intervalText: isRespottedBlackVisit({ ...liveMatch, playerPoints: nextPlayerPoints, opponentPoints: nextOpponentPoints, tableState: nextTableState, ballsRemaining: nextBallsRemaining } as LiveMatchState)
      ? 'Scores are level on the black. The next visit is for the respotted black.'
      : frameClinched
        ? 'Frame is ready to be closed out.'
        : `${getFrameTableSummary(nextTableState)} in ${frameLabel}. ${areSnookersRequired(Math.max(0, nextOpponentPoints - nextPlayerPoints), nextRemainingTablePoints) ? 'You now need foul points.' : nextPlayerAtTable === liveMatch.playerName ? 'You are back in control.' : `${liveMatch.opponentName} is back at the table.`}`,
    feed: [feedEntry, ...liveMatch.feed].slice(0, 16),
    visitHistory: [visitLogEntry, ...liveMatch.visitHistory].slice(0, 18),
    lastVisitSummary: `${frameLabel} V${liveMatch.currentVisit}: ${visitLogEntry.outcome}${scoredPoints > 0 ? ` (${scoredPoints} pts)` : ''}`,
    status: 'In Progress',
  }

  const needsRespottedBlack = isRespottedBlackVisit(progressedLiveMatch)
  return frameClinched && !needsRespottedBlack
    ? resolveCompletedLiveFrame(progressedLiveMatch, mode === 'manual' ? 'Played' : 'Simmed')
    : progressedLiveMatch
}

function getLiveMatchTacticalModifiers(liveMatch: LiveMatchState, mode: LiveMatchResolutionMode) {
  if (mode === 'simulated') {
    return {
      winChanceModifier: 0,
      volatilityBoost: 0,
      playerBreakBonus: 0,
      opponentBreakPenalty: 0,
      pressureRelief: 0,
      fatigueCost: 2,
      note: 'Frame simulated with neutral tactics.',
    }
  }

  let winChanceModifier = 0
  let volatilityBoost = 0
  let playerBreakBonus = 0
  let opponentBreakPenalty = 0
  let pressureRelief = 0
  let fatigueCost = 2
  const notes: string[] = []

  if (liveMatch.tacticalPlan === 'Attack') {
    winChanceModifier += liveMatch.playerConfidence >= 58 ? 4 : 1
    volatilityBoost += 10
    playerBreakBonus += 10
    fatigueCost += 1
    notes.push('Attacking plan applied.')
  } else if (liveMatch.tacticalPlan === 'Safety') {
    winChanceModifier += liveMatch.pressureValue >= 58 ? 4 : 2
    opponentBreakPenalty += 10
    pressureRelief += 4
    notes.push('Safety-first frame plan applied.')
  } else {
    winChanceModifier += 1
    pressureRelief += 1
    notes.push('Balanced frame management applied.')
  }

  if (liveMatch.mentalFocus === 'Composed') {
    winChanceModifier += Math.max(0, liveMatch.pressureValue - 48) * 0.08
    pressureRelief += 3
    notes.push('Composure focus steadied the player.')
  } else if (liveMatch.mentalFocus === 'Confident') {
    winChanceModifier += 2 + Math.max(0, liveMatch.playerConfidence - liveMatch.opponentConfidence) * 0.05
    volatilityBoost += 4
    notes.push('Confidence focus encouraged front-foot play.')
  } else {
    winChanceModifier += liveMatch.playerFrames < liveMatch.opponentFrames ? 4 : 1
    opponentBreakPenalty += 4
    notes.push('Counter-punching focus targeted momentum swings.')
  }

  if (liveMatch.tempo === 'Quick') {
    winChanceModifier += liveMatch.playerFatigue <= 55 ? 2 : -1
    playerBreakBonus += 4
    fatigueCost += 1
    notes.push('Quick tempo increased urgency.')
  } else {
    winChanceModifier += 1
    pressureRelief += 2
    notes.push('Steady tempo reduced chaos.')
  }

  return {
    winChanceModifier,
    volatilityBoost,
    playerBreakBonus,
    opponentBreakPenalty,
    pressureRelief,
    fatigueCost,
    note: notes.join(' '),
  }
}

function resolveCareerSimulationLiveMatch(state: GameState, tournament: Tournament): LiveMatchState {
  const liveMatch = createLiveMatchState(state, tournament)
  const frameWinChance = convertMatchWinProbabilityToFrameWinProbability(liveMatch.plannedMatchWinChance, liveMatch.bestOf)
  const professionalFinals = state.history.tournamentHistory.filter(
    (entry) => isProfessionalFinalLevelRun(entry),
  ).length
  const professionalTitles = state.history.tournamentHistory.filter(
    (entry) => isProfessionalEventType(entry.eventType) && entry.result === 'Winner',
  ).length
  const isProfessionalTournament = isProfessionalEventType(tournament.eventClass ?? tournament.type)
  const isWorldMainDrawTournament = isWorldChampionshipMainDrawTournament(tournament)
  const breakthroughRound = liveMatch.round === 'Final' || liveMatch.round === 'Semi Final'
  const forceBreakthroughFinal = breakthroughRound
    && isProfessionalTournament
    && (
      (!isWorldMainDrawTournament && professionalTitles === 0 && professionalFinals >= 1 && state.player.age >= 24)
      || (isWorldMainDrawTournament && professionalFinals >= 1 && state.player.age >= 30 && state.player.age <= 48)
    )
  const resolvedMatch = forceBreakthroughFinal
    ? {
        playerWonMatch: true,
        loserFrames: clamp(liveMatch.framesNeeded - 2, 0, liveMatch.framesNeeded - 1),
        frameOrder: buildCareerFrameOrder(true, liveMatch.framesNeeded, clamp(liveMatch.framesNeeded - 2, 0, liveMatch.framesNeeded - 1)),
      }
    : resolveCareerMatchResult(liveMatch.plannedMatchWinChance, liveMatch.framesNeeded)
  let playerFrames = 0
  let opponentFrames = 0
  let playerHighestBreak = 0
  let opponentHighestBreak = 0
  let playerFifties = 0
  let playerCenturies = 0
  let playerPoints = 0
  let opponentPoints = 0
  const frameHistory: FrameScoreRow[] = []

  for (const playerWonFrame of resolvedMatch.frameOrder) {
    const frameNumber = frameHistory.length + 1
    const frameOutcome = simulateCareerFrameOutcome(
      playerWonFrame ? Math.max(frameWinChance, 50) : Math.min(frameWinChance, 50),
      liveMatch.plannedPlayerStrength,
      liveMatch.plannedOpponentStrength,
      playerWonFrame,
    )
    playerPoints = frameOutcome.playerPoints
    opponentPoints = frameOutcome.opponentPoints
    if (frameOutcome.playerWonFrame) {
      playerFrames += 1
    } else {
      opponentFrames += 1
    }

    playerHighestBreak = Math.max(playerHighestBreak, frameOutcome.playerBreak)
    opponentHighestBreak = Math.max(opponentHighestBreak, frameOutcome.opponentBreak)
    if (frameOutcome.playerBreak >= 50) playerFifties += 1
    if (frameOutcome.playerBreak >= 100) playerCenturies += 1
    frameHistory.push({
      frame: `F${frameNumber}`,
      player: `${playerPoints}`,
      opponent: `${opponentPoints}`,
      winner: frameOutcome.playerWonFrame ? liveMatch.playerName : liveMatch.opponentName,
    })
  }

  const pressureValue = clamp(38 + Math.abs(playerFrames - opponentFrames) * 8 + (Math.min(playerFrames, opponentFrames) === liveMatch.framesNeeded - 1 ? 12 : 0), 24, 96)

  return {
    ...liveMatch,
    playerFrames,
    opponentFrames,
    currentFrame: frameHistory.length,
    playerPoints,
    opponentPoints,
    currentVisit: 0,
    currentBreak: 0,
    ballsRemaining: 0,
    shotClock: 0,
    playerHighestBreak,
    opponentHighestBreak,
    playerFifties,
    playerCenturies,
    pressureValue,
    pressureLabel: pressureValue >= 78 ? 'High' : pressureValue >= 58 ? 'Building' : 'Stable',
    timeElapsedMinutes: frameHistory.length * 18,
    intervalText: 'Career simulation resolved through the baseline match model.',
    framesRemainingText: 'Match complete',
    feed: liveMatch.feed,
    momentum: [...liveMatch.momentum, { label: 'Finish', player: playerFrames, opponent: opponentFrames }].slice(-Math.max(2, liveMatch.bestOf)),
    frameHistory,
    lastFrameMode: 'Simmed',
    lastVisitSummary: 'Career simulation completed through the baseline match model.',
    status: 'Completed',
  }
}

function finalizeLiveMatch(state: GameState, liveMatch: LiveMatchState): GameState {
  const tournament = state.tournaments.find((item) => item.id === liveMatch.tournamentId)
  if (!tournament) {
    return finalizeState({ ...state, liveMatch: null }, 'The active live match could not be resolved.')
  }

  const existingTournamentHistoryEntry = state.history.tournamentHistory.find((entry) => entry.id === getTournamentHistoryId(state.season, tournament.id))
  const breakthroughFinalRound = liveMatch.round === 'Final'
    || liveMatch.round === 'Semi Final'
    || (existingTournamentHistoryEntry != null && getTournamentHistoryFinishTier(existingTournamentHistoryEntry) >= 4)
  const professionalTitles = state.history.tournamentHistory.filter((entry) => isProfessionalEventType(entry.eventType) && entry.result === 'Winner').length
  const professionalFinals = state.history.tournamentHistory.filter((entry) => isProfessionalFinalLevelRun(entry)).length
  const isProfessionalTournament = isProfessionalEventType(tournament.eventClass ?? tournament.type)
  const isWorldMainDrawTournament = isWorldChampionshipMainDrawTournament(tournament)
  const shouldConvertBreakthroughFinal = breakthroughFinalRound
    && liveMatch.playerFrames < liveMatch.opponentFrames
    && isProfessionalTournament
    && (
      (!isWorldMainDrawTournament && professionalTitles === 0 && professionalFinals >= 1 && state.player.age >= 24)
      || (isWorldMainDrawTournament && professionalFinals >= 1 && state.player.age >= 30 && state.player.age <= 48)
    )

  if (shouldConvertBreakthroughFinal) {
    const loserFrames = clamp(liveMatch.framesNeeded - 2, 0, liveMatch.framesNeeded - 1)
    liveMatch = {
      ...liveMatch,
      playerFrames: liveMatch.framesNeeded,
      opponentFrames: loserFrames,
      frameHistory: buildCareerFrameOrder(true, liveMatch.framesNeeded, loserFrames).map((playerWonFrame, index) => ({
        frame: `F${index + 1}`,
        player: playerWonFrame ? '72' : '34',
        opponent: playerWonFrame ? '34' : '68',
        winner: playerWonFrame ? liveMatch.playerName : liveMatch.opponentName,
      })),
    }
  }

  const currentRoundIndex = TOURNAMENT_ROUNDS.indexOf(liveMatch.round)
  const roundPlan = getTournamentRoundPlan(tournament, liveMatch.round)
  const won = liveMatch.playerFrames > liveMatch.opponentFrames
  const nextRound = won ? TOURNAMENT_ROUNDS[currentRoundIndex + 1] ?? null : null
  const isQSchoolTournament = tournament.type === 'Q School'
  const isSeniorTournament = tournament.type === 'Senior'
  const isSeniorRegularRankingTournament = isSeniorTournament && /seniors tour\s*-\s*event/i.test(tournament.name)
  const rankingPointsGained = isQSchoolTournament
    ? liveMatch.playerFrames
    : isSeniorRegularRankingTournament
      ? liveMatch.playerFrames
      : isSeniorTournament && tournament.rankingValue <= 0
        ? 0
    : won
      ? Math.max(8, Math.round(tournament.rankingValue * roundPlan.winPointsShare))
      : Math.max(2, Math.round(tournament.rankingValue * roundPlan.lossPointsShare))
  const prizeMoneyEarned = isQSchoolTournament
    ? 0
    : won
      ? Math.max(120, Math.round(tournament.prizeMoney * roundPlan.winPrizeShare))
      : Math.max(40, Math.round(tournament.prizeMoney * roundPlan.lossPrizeShare))
  const opponentPointsGained = isQSchoolTournament
    ? liveMatch.opponentFrames
    : isSeniorRegularRankingTournament
      ? liveMatch.opponentFrames
      : isSeniorTournament && tournament.rankingValue <= 0
        ? 0
    : won
      ? Math.max(2, Math.round(tournament.rankingValue * roundPlan.lossPointsShare))
      : Math.max(8, Math.round(tournament.rankingValue * roundPlan.winPointsShare))
  const opponentPrizeMoney = isQSchoolTournament
    ? 0
    : won
      ? Math.max(40, Math.round(tournament.prizeMoney * roundPlan.lossPrizeShare))
      : Math.max(120, Math.round(tournament.prizeMoney * roundPlan.winPrizeShare))
  const confidenceChange = won ? (liveMatch.round === 'Final' ? 8 : 5) : -3
  const fatigueChange = clamp(Math.round(liveMatch.frameHistory.length * 1.5) + (won ? 2 : 1), 4, 16)
  const playerWonTitle = won && nextRound == null
  const opponentWonTitle = !won && nextRound == null
  const rankingRows = getCompetitionRowsForTournament(state, tournament)
  const opponentRow = rankingRows.find((row) => row.playerName === liveMatch.opponentName)
  const tournamentClass = getTournamentCircuitClass(tournament)
  const latestMatch: Match = {
    id: `match-${Date.now()}`,
    tournamentId: tournament.id,
    playedOn: state.currentDate,
    round: liveMatch.round,
    bestOf: liveMatch.bestOf,
    playerName: state.player.fullName,
    opponentName: liveMatch.opponentName,
    playerRanking: state.player.amateurRanking ?? state.player.worldRanking ?? 0,
    opponentRanking: liveMatch.opponentRanking,
    playerFrames: liveMatch.playerFrames,
    opponentFrames: liveMatch.opponentFrames,
    result: won ? 'Won' : 'Lost',
    highestBreak: liveMatch.playerHighestBreak,
    opponentHighestBreak: liveMatch.opponentHighestBreak,
    fifties: liveMatch.playerFifties,
    centuries: liveMatch.playerCenturies,
    potSuccess: clamp(Math.round(68 + liveMatch.plannedMatchWinChance / 3 + Math.random() * 10), 58, 96),
    longPotSuccess: clamp(Math.round(52 + liveMatch.plannedMatchWinChance / 4 + Math.random() * 12), 44, 90),
    safetySuccess: clamp(Math.round(60 + liveMatch.plannedMatchWinChance / 4 + Math.random() * 10), 48, 92),
    fouls: clamp(Math.round(Math.random() * 4), 0, 5),
    confidenceChange,
    fatigueChange,
    prizeMoneyEarned,
    rankingPointsGained,
    plannedWinChance: liveMatch.plannedMatchWinChance,
    winProbability: liveMatch.plannedMatchWinChance,
    playerStrength: liveMatch.plannedPlayerStrength,
    opponentStrength: liveMatch.plannedOpponentStrength,
    opponentRankBand: getOpponentRankBand(liveMatch.opponentRanking, tournamentClass),
    tournamentClass,
    frameHistory: liveMatch.frameHistory,
  }
  const completedRounds = [
    ...state.tournamentProgress.completedRounds,
    {
      round: liveMatch.round,
      opponentName: liveMatch.opponentName,
      result: latestMatch.result,
      playerFrames: liveMatch.playerFrames,
      opponentFrames: liveMatch.opponentFrames,
    },
  ]
  const matchLogEntry: CareerMatchLogEntry = {
    id: latestMatch.id,
    season: state.season,
    date: state.currentDate,
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    eventType: tournament.type,
    tournamentClass,
    round: liveMatch.round,
    opponentName: liveMatch.opponentName,
    playerRanking: latestMatch.playerRanking,
    opponentRanking: latestMatch.opponentRanking,
    winProbability: latestMatch.winProbability,
    playerStrength: latestMatch.playerStrength,
    opponentStrength: latestMatch.opponentStrength,
    opponentRankBand: latestMatch.opponentRankBand,
    result: latestMatch.result,
    score: `${liveMatch.playerFrames}-${liveMatch.opponentFrames}`,
    bestOf: liveMatch.bestOf,
    playerFrames: liveMatch.playerFrames,
    opponentFrames: liveMatch.opponentFrames,
    wentToDecider: Math.min(liveMatch.playerFrames, liveMatch.opponentFrames) === liveMatch.framesNeeded - 1,
    pressurePeak: liveMatch.pressureValue,
    prizeMoney: prizeMoneyEarned,
    rankingPoints: rankingPointsGained,
  }
  const playerAfterMatch: Player = {
    ...state.player,
    cash: state.player.cash + prizeMoneyEarned,
    confidence: clamp(state.player.confidence + confidenceChange, 25, 99),
    fatigue: clamp(state.player.fatigue + fatigueChange, 0, 100),
    morale: clamp(state.player.morale + (won ? 3 : -2), 0, 100),
    form: [...state.player.form.slice(1), won ? 'W' : 'L'],
    reputation: clamp(state.player.reputation + (won ? (nextRound ? 2 : 4) : 0), 0, 100),
    legacyScore: clamp(state.player.legacyScore + (won ? (liveMatch.round === 'Final' ? 8 : 3) : 1), 0, 100),
  }
  const qSchoolCardClinched = isQSchoolTournament && won && liveMatch.round === getQSchoolCardWinningRound(tournament)
  const playoffCardClinched = playerWonTitle && tournament.name.toLowerCase().includes('play-off')
  const directAmateurCardClinched = playerWonTitle && isDirectAmateurTourCardRoute(tournament)
  const directTourCardSource: Exclude<TourCardSource, null> | null = qSchoolCardClinched
    ? 'Q School'
    : playoffCardClinched
      ? 'Q Tour'
      : directAmateurCardClinched
        ? 'Federation Route'
        : null
  const tourCardClinched = directTourCardSource != null
  const competitionTables = updateCompetitionTables(
    state.competitionTables,
    tournament,
    playerAfterMatch,
    liveMatch.opponentName,
    opponentRow?.nation ?? 'INT',
    rankingPointsGained,
    prizeMoneyEarned,
    opponentPointsGained,
    opponentPrizeMoney,
    won,
    playerWonTitle,
    opponentWonTitle,
    playerWonTitle ? 'Champion' : won && nextRound ? `Advanced to ${nextRound}` : `Lost in ${liveMatch.round}`,
  )
  const careerSystemsSeed: CareerSystemsState = {
    ...state.careerSystems,
    qTour: {
      ...state.careerSystems.qTour,
      playOffWinner: playerWonTitle && tournament.name.toLowerCase().includes('play-off') ? state.player.fullName : state.careerSystems.qTour.playOffWinner,
      directCardAwarded: playerWonTitle && tournament.name.toLowerCase().includes('play-off') ? true : state.careerSystems.qTour.directCardAwarded,
    },
    qSchool: {
      ...state.careerSystems.qSchool,
      campaignsEntered: state.careerSystems.qSchool.campaignsEntered + (tournament.type === 'Q School' && liveMatch.round === TOURNAMENT_ROUNDS[0] && !state.history.tournamentHistory.some((entry) => entry.season === state.season && entry.eventType === 'Q School') ? 1 : 0),
      eventWins: state.careerSystems.qSchool.eventWins + (tournament.type === 'Q School' && playerWonTitle ? 1 : 0),
      repeatedFailures: tournament.type === 'Q School' && !won && nextRound == null
        ? state.careerSystems.qSchool.repeatedFailures + 1
        : tournament.type === 'Q School' && (playerWonTitle || qSchoolCardClinched)
          ? 0
          : state.careerSystems.qSchool.repeatedFailures,
    },
    pro: {
      ...state.careerSystems.pro,
      hasTourCard: state.careerSystems.pro.hasTourCard,
      cardSource: state.careerSystems.pro.cardSource,
      currentYear: state.careerSystems.pro.currentYear,
      yearsRemaining: state.careerSystems.pro.yearsRemaining,
      expiresAfterSeason: state.careerSystems.pro.expiresAfterSeason,
      awardedBy: tourCardClinched
        ? tournament.name
        : state.careerSystems.pro.awardedBy,
    },
  }
  const careerSystems = syncCareerSystems({
    competitionTables,
    player: playerAfterMatch,
    careerSystems: careerSystemsSeed,
    history: state.history,
  })
  const rankings = competitionTables[getPrimaryCompetitionKey({ player: playerAfterMatch, careerSystems })].map((row) => ({ ...row }))

  const nextState = finalizeState(
    {
      ...state,
      player: playerAfterMatch,
      matches: [latestMatch, ...state.matches].slice(0, 24),
      rankings,
      competitionTables,
      worldPlayers: state.worldPlayers,
      careerSystems,
      tournaments: state.tournaments.map((item) =>
        item.id === tournament.id
          ? {
              ...item,
              status: (!won ? 'Skipped' : nextRound ? 'Entered' : 'Booked') as Tournament['status'],
            }
          : item,
      ),
      tournamentProgress: won && nextRound
        ? {
            tournamentId: tournament.id,
            currentRound: nextRound,
            draw: applyCompletedMatchToTournamentDraw(
              state.tournamentProgress.draw,
              tournament,
              liveMatch.round,
              state.player.fullName,
              liveMatch.playerFrames,
              liveMatch.opponentFrames,
            ),
            completedRounds,
          }
        : createEmptyTournamentProgress(),
      liveMatch,
      inbox: [
        createInboxMessage(
          {
            sender: 'Tournament Office',
            subject: `${won ? 'Win' : 'Loss'} at ${tournament.name}`,
            preview: `${state.player.fullName} ${won ? 'beat' : 'lost to'} ${liveMatch.opponentName} ${liveMatch.playerFrames}-${liveMatch.opponentFrames} in the ${liveMatch.round}. Prize: £${prizeMoneyEarned}. Ranking points: ${rankingPointsGained}.${won && nextRound ? ` Next round: ${nextRound}.` : won ? ' Tournament won.' : ''}`,
            priority: won ? 'High' : 'Medium',
          },
          'Today',
        ),
        ...state.inbox,
      ].slice(0, 18),
      history: {
        ...state.history,
        matchLog: appendMatchLog(state.history.matchLog, matchLogEntry),
        tournamentHistory: upsertTournamentHistoryEntry(
          state.history.tournamentHistory,
          synchronizeTournamentHistoryEntry(tournament, {
            ...(state.history.tournamentHistory.find((entry) => entry.id === getTournamentHistoryId(state.season, tournament.id)) ?? createTournamentHistoryEntry(tournament, state.season)),
            status: won && nextRound ? 'In Progress' : 'Completed',
            result: won
              ? tourCardClinched && nextRound
                ? `Advanced to ${nextRound} · Tour card secured`
                : nextRound
                  ? `Advanced to ${nextRound}`
                  : 'Winner'
              : `Lost in ${liveMatch.round}`,
            rounds: completedRounds.map((round) => `${round.round}: ${round.result} ${round.playerFrames}-${round.opponentFrames}`),
            prizeMoney: (state.history.tournamentHistory.find((entry) => entry.id === getTournamentHistoryId(state.season, tournament.id))?.prizeMoney ?? 0) + prizeMoneyEarned,
            rankingPoints: (state.history.tournamentHistory.find((entry) => entry.id === getTournamentHistoryId(state.season, tournament.id))?.rankingPoints ?? 0) + rankingPointsGained,
            highestBreak: Math.max(state.history.tournamentHistory.find((entry) => entry.id === getTournamentHistoryId(state.season, tournament.id))?.highestBreak ?? 0, latestMatch.highestBreak),
            centuries: (state.history.tournamentHistory.find((entry) => entry.id === getTournamentHistoryId(state.season, tournament.id))?.centuries ?? 0) + latestMatch.centuries,
            fatigueChange: (state.history.tournamentHistory.find((entry) => entry.id === getTournamentHistoryId(state.season, tournament.id))?.fatigueChange ?? 0) + fatigueChange,
            reward: tourCardClinched
              ? 'Two-year tour card'
              : state.history.tournamentHistory.find((entry) => entry.id === getTournamentHistoryId(state.season, tournament.id))?.reward,
          }),
        ),
      },
    },
    won && nextRound
      ? `Won the ${liveMatch.round} at ${tournament.name} and advanced to the ${nextRound}.`
      : won
        ? `Won the ${liveMatch.round} at ${tournament.name} and took the title.`
        : `Lost in the ${liveMatch.round} at ${tournament.name}.`,
    `${tournament.name} ${liveMatch.round}`,
  )

  return {
    ...nextState,
    liveMatch: {
      ...liveMatch,
      status: 'Completed' as const,
    },
  }
}

function recalculateState(state: GameState, lastAction = state.lastAction): GameState {
  const coachContracts = normalizeCoachContracts(state.coachContracts, state.coaches).filter((contract) => contract.weeksRemaining > 0)
  const coachCost = getCoachCost(coachContracts)
  const sponsorWeeklyIncome = getSponsorWeeklyIncome(state.sponsors)
  const activeFacility = state.equipment.currentTableId
    ? tableSetupCatalog.find((facility) => facility.id === state.equipment.currentTableId) ?? null
    : null
  const facilityWeeklyRental = activeFacility ? Math.round(activeFacility.monthlyRental / 4) : 0
  const weeklyCashFlow = state.finance.baseCashFlow + sponsorWeeklyIncome - coachCost - facilityWeeklyRental
  let competitionTables = COMPETITION_TABLE_KEYS.reduce<CompetitionTablesState>((tables, key) => ({
    ...tables,
    [key]: rerankCompetitionRows(state.competitionTables[key] ?? [], state.player.fullName),
  }), state.competitionTables)
  competitionTables = ensurePlayerInCompetitionTable({
    player: state.player,
    careerSystems: state.careerSystems,
    competitionTables,
    worldPlayers: state.worldPlayers,
    tournaments: state.tournaments,
  }, 'world')
  competitionTables = ensurePlayerInCompetitionTable({
    player: state.player,
    careerSystems: state.careerSystems,
    competitionTables,
    worldPlayers: state.worldPlayers,
    tournaments: state.tournaments,
  }, 'oneYear')
  competitionTables = removeOveragePlayerFromYouthTable(competitionTables, state.player)
  const careerSystems = syncCareerSystems({ competitionTables, player: state.player, careerSystems: state.careerSystems, history: state.history })
  const primaryCompetitionKey = getPrimaryCompetitionKey({ player: state.player, careerSystems })
  const activeRankings = competitionTables[primaryCompetitionKey].map((row) => ({ ...row }))
  const isCurrentOrUpcomingEvent = (event: Tournament) => (event.endDate ?? event.startDate) >= state.currentDate
  const relevantTournaments = state.tournaments.filter((event) => getCompetitionKeysForTournament(event).includes(primaryCompetitionKey))
  const nextEvent = relevantTournaments.find((event) => event.status === 'Entered' && isCurrentOrUpcomingEvent(event))
    ?? relevantTournaments.find((event) => (event.status === 'Booked' || event.status === 'Available' || event.status === 'High Cost') && isCurrentOrUpcomingEvent(event))
    ?? state.tournaments.find((event) => event.status === 'Entered' && isCurrentOrUpcomingEvent(event))
    ?? state.tournaments.find((event) => (event.status === 'Booked' || event.status === 'Available' || event.status === 'High Cost') && isCurrentOrUpcomingEvent(event))
    ?? relevantTournaments[0]
    ?? state.tournaments[0]
  const activePlayerRow = activeRankings.find((row) => row.playerName === state.player.fullName)
  const playerWorldRow = competitionTables.world.find((row) => row.playerName === state.player.fullName)
  const playerSeniorRow = competitionTables.senior.find((row) => row.playerName === state.player.fullName)
  const unreadCount = Math.min(99, state.inbox.length)
  const retired = careerSystems.lateCareer.retired
  const player = {
    ...state.player,
    cash: state.player.cash,
    cashFlow: weeklyCashFlow,
    worldRanking: playerWorldRow?.ranking ?? state.player.worldRanking,
    amateurRanking: retired || primaryCompetitionKey === 'senior' || primaryCompetitionKey === 'world'
      ? null
      : activePlayerRow?.ranking ?? state.player.amateurRanking,
    seniorRanking: playerSeniorRow?.ranking ?? state.player.seniorRanking,
    rankingLabel: retired ? 'Retired' : getRankingLabelForCompetitionKey(primaryCompetitionKey),
    careerPhase: getCareerPhaseFromSystems(state.player, careerSystems),
    competitiveStatus: getCareerStageFromSystems(state.player, careerSystems, state.history),
    careerStage: getCareerStageFromSystems(state.player, careerSystems, state.history),
    nextEvent: nextEvent?.name ?? state.player.nextEvent,
    daysUntilEvent: nextEvent ? daysUntil(nextEvent.startDate, state.currentDate) : state.player.daysUntilEvent,
    inboxCount: unreadCount,
    notificationCount: unreadCount,
  }

  return {
    ...state,
    season: getSeasonLabelForTournaments(state.tournaments),
    finance: {
      ...state.finance,
      cash: state.player.cash,
      cashFlow: weeklyCashFlow,
    },
    player,
    rankings: activeRankings,
    competitionTables,
    careerSystems,
    currentCoachId: getPrimaryCoachId(coachContracts),
    coachContracts,
    sponsorOffers: refreshSponsorOffers(state),
    sponsors: normalizeSponsors(state.sponsors).filter((sponsor) => sponsor.weeksRemaining > 0),
    lastAction,
  }
}

export function createStarterState(): GameState {
  const worldSeed = createWorldSeed()
  const starterPlayer: Player = {
    ...starterPlayerProfile,
    personalityTraits: buildPersistedPersonalityTraits(starterPlayerProfile.personalityTraits, starterPlayerProfile.playingStyle),
  }
  const starterCoachContracts = buildLegacyCoachContracts(coachCatalog[0]?.id ?? null, coachCatalog, 19)
  const competitionTables = buildCompetitionTables(starterRankings, starterPlayer, { worldSeed })
  const careerSystems = syncCareerSystems({ competitionTables, player: starterPlayer, careerSystems: createEmptyCareerSystems() })

  const baseState: GameState = {
    worldSeed,
    currentDate: '2026-05-11',
    season: '2026/27',
    week: 19,
    player: starterPlayer,
    attributes: deepCloneAttributes(starterAttributes),
    coaches: coachCatalog.map((coach) => ({ ...coach })),
    currentCoachId: coachCatalog[0]?.id ?? null,
    equipment: buildDefaultEquipmentState(),
    finance: {
      cash: starterPlayerProfile.cash,
      baseCashFlow: starterPlayerProfile.cashFlow,
      cashFlow: starterPlayerProfile.cashFlow,
    },
    tournaments: buildTournamentScheduleForSeason(2026),
    matches: starterMatches.map((match) => ({ ...match })),
    rankings: competitionTables.qTour.map((row) => ({ ...row })),
    competitionTables,
    worldPlayers: buildWorldPlayersFromTables(competitionTables, starterPlayer),
    careerSystems,
    sponsors: starterSponsors.map((sponsor) => ({ ...sponsor })),
    sponsorOffers: buildSponsorOffers(),
    inbox: normalizeInboxMessages(starterInboxMessages.map((message) => ({ ...message }))),
    travel: createEmptyTravelState(),
    maintenance: { history: starterMaintenanceHistory.map((item) => ({ ...item })) },
    tournamentProgress: createEmptyTournamentProgress(),
    liveMatch: null,
    history: createEmptyHistory(),
    coachContracts: starterCoachContracts,
    trainingPlan: [],
    trainingAppliedWeek: null,
    lastAction: 'Career loaded from the starter save.',
  }

  baseState.trainingPlan = buildAutoTrainingPlanFromState(baseState)

  return withHistorySnapshot(recalculateState(baseState, baseState.lastAction), 'Starter Save')
}

export function createNewCareerState(config?: NewCareerConfig): GameState {
  const worldSeed = createWorldSeed()
  const selectedBackground = createPlayerBackgroundCatalog.find((background) => background.id === config?.backgroundId) ?? createPlayerBackgroundCatalog[1] ?? createPlayerBackgroundCatalog[0]
  const selectedStartingLevel = getValidatedStartingLevel(createPlayerStartingLevelCatalog, config?.age ?? createPlayerIdentitySeed.age, config?.startingLevelId)
  const careerConfig: NewCareerConfig = {
    fullName: config?.fullName?.trim() || createPlayerIdentitySeed.name,
    nationality: config?.nationality || createPlayerIdentitySeed.nationality,
    age: config?.age ?? createPlayerIdentitySeed.age,
    handedness: config?.handedness ?? (createPlayerIdentitySeed.handedness as Player['handedness']),
    cueStyle: config?.cueStyle || createPlayerIdentitySeed.cueStyle,
    playingStyle: config?.playingStyle || createPlayerIdentitySeed.playingStyle,
    personalityArchetype: config?.personalityArchetype || createPlayerIdentitySeed.personalityArchetype,
    sliders: config?.sliders?.length ? config.sliders : createPlayerSliderCatalog.map((slider) => ({ ...slider })),
    backgroundId: selectedBackground.id,
    startingLevelId: selectedStartingLevel.id,
  }
  const [firstName, ...rest] = careerConfig.fullName.split(' ')
  const effectiveSliders = applyPlayingStyleToSliders(careerConfig.sliders, careerConfig.playingStyle)
  const attributes = buildNewCareerAttributes({
    starterAttributes,
    background: selectedBackground,
    startingLevel: selectedStartingLevel,
    age: careerConfig.age,
    sliders: careerConfig.sliders,
    cueStyle: careerConfig.cueStyle,
    playingStyle: careerConfig.playingStyle,
  })

  const competitiveness = effectiveSliders.find((slider) => slider.label === 'Competitiveness')?.value ?? 50
  const perseverance = effectiveSliders.find((slider) => slider.label === 'Perseverance')?.value ?? 50
  const mediaHandling = effectiveSliders.find((slider) => slider.label === 'Media Handling')?.value ?? 50
  const startingWeeklyCashFlow = (() => {
    let weekly = careerConfig.age <= 16 ? 85 : careerConfig.age <= 19 ? 130 : 170

    if (selectedStartingLevel.rankingLabel === 'Amateur Ranking') weekly += 35
    if (selectedStartingLevel.rankingLabel === 'Q Tour Ranking') weekly += 70
    if (selectedStartingLevel.rankingLabel === 'Q School Ranking') weekly += 70
    if (selectedStartingLevel.rankingLabel === 'World Ranking') weekly += 180
    if (selectedStartingLevel.rankingLabel === 'Senior Ranking') weekly += 95
    if (selectedBackground.funds >= 10000) weekly += 20
    if (selectedBackground.funds <= 4500) weekly -= 15

    return Math.max(60, weekly)
  })()
  const startingFunds = selectedStartingLevel.competitionTable === 'qSchool'
    ? Math.max(selectedBackground.funds, 2500)
    : selectedBackground.funds

  const player: Player = {
    ...starterPlayerProfile,
    firstName,
    lastName: rest.join(' ') || 'Player',
    fullName: careerConfig.fullName,
    nationality: careerConfig.nationality,
    age: careerConfig.age,
    handedness: careerConfig.handedness,
    cueStyle: careerConfig.cueStyle,
    careerStage: selectedStartingLevel.careerStage,
    rankingLabel: selectedStartingLevel.rankingLabel,
    worldRanking: selectedStartingLevel.competitionTable === 'world' ? selectedStartingLevel.targetRanking : null,
    seniorRanking: selectedStartingLevel.competitionTable === 'senior' ? selectedStartingLevel.targetRanking : null,
    form: [],
    playingStyle: careerConfig.playingStyle,
    personalityType: buildCareerPersonality(careerConfig.personalityArchetype, careerConfig.playingStyle),
    personalityTraits: effectiveSliders.map((slider) => ({ ...slider })),
    amateurRanking: selectedStartingLevel.competitionTable === 'world' || selectedStartingLevel.competitionTable === 'senior' ? null : selectedStartingLevel.targetRanking,
    cash: startingFunds,
    cashFlow: startingWeeklyCashFlow,
    confidence: clamp(58 + Math.round((competitiveness - 50) / 3), 45, 82),
    fatigue: 18,
    morale: clamp(62 + Math.round((perseverance - 50) / 4), 48, 86),
    reputation: clamp(36 + Math.round((mediaHandling - 50) / 5), 25, 64),
    legacyScore: 0,
    nextEvent: tournamentCatalog.find((tournament) => tournament.stageId === selectedStartingLevel.stage)?.name ?? tournamentCatalog[0]?.name ?? starterPlayerProfile.nextEvent,
    daysUntilEvent: 5,
    inboxCount: 2,
    notificationCount: 2,
  }
  const competitionTables = initializeCompetitionTablesForNewCareer(
    applyStartingLevelToCompetitionTables(buildCompetitionTables(starterRankings, player, { reservePlayerName: true, worldSeed }), player.fullName, selectedStartingLevel),
    player.fullName,
    selectedStartingLevel,
  )
  const careerSystems = syncCareerSystems({ competitionTables, player, careerSystems: createCareerSystemsForStartingLevel(selectedStartingLevel) })

  const baseState: GameState = {
    worldSeed,
    currentDate: '2026-05-11',
    season: '2026/27',
    week: 1,
    player,
    attributes,
    coaches: coachCatalog.map((coach) => ({ ...coach })),
    currentCoachId: null,
    equipment: buildEmptyEquipmentState(),
    finance: {
      cash: startingFunds,
      baseCashFlow: startingWeeklyCashFlow,
      cashFlow: startingWeeklyCashFlow,
    },
    tournaments: buildTournamentScheduleForSeason(2026),
    matches: [],
    rankings: competitionTables[selectedStartingLevel.competitionTable].map((row) => ({ ...row })),
    competitionTables,
    worldPlayers: buildWorldPlayersFromTables(competitionTables, player),
    careerSystems,
    sponsors: [],
    sponsorOffers: buildSponsorOffers(),
    inbox: buildNewCareerInboxMessages(
      careerConfig.fullName,
      selectedBackground.name,
      selectedBackground.difficulty,
      selectedStartingLevel.name,
      startingWeeklyCashFlow,
    ),
    travel: createEmptyTravelState(),
    maintenance: { history: [] },
    tournamentProgress: createEmptyTournamentProgress(),
    liveMatch: null,
    history: createEmptyHistory(),
    coachContracts: [],
    trainingPlan: [],
    trainingAppliedWeek: null,
    lastAction: `Created a new ${selectedBackground.name} career for ${careerConfig.fullName}.`,
  }

  baseState.trainingPlan = buildAutoTrainingPlanFromState(baseState)

  return withHistorySnapshot(recalculateState(baseState, baseState.lastAction), 'Career Created')
}

function loadStoredState(): GameState {
  if (typeof window === 'undefined') return createStarterState()

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (!saved) return createStarterState()

  try {
    const parsed = JSON.parse(saved) as Partial<GameState> & { tournamentProgress?: TournamentProgressState }
    const fallbackState = createStarterState()
    const parsedPlayer = parsed.player
      ? {
          ...fallbackState.player,
          ...parsed.player,
          personalityTraits: buildPersistedPersonalityTraits(parsed.player.personalityTraits, parsed.player.playingStyle ?? fallbackState.player.playingStyle),
        }
      : fallbackState.player
    const hydratedState: GameState = {
      ...fallbackState,
      ...parsed,
      worldSeed: parsed.worldSeed ?? fallbackState.worldSeed,
      player: parsedPlayer,
      attributes: parsed.attributes ? deepCloneAttributes(parsed.attributes as PlayerAttributes) : fallbackState.attributes,
      coaches: Array.isArray(parsed.coaches) ? parsed.coaches : fallbackState.coaches,
      equipment: {
        ...fallbackState.equipment,
        ...parsed.equipment,
        cuesOwned: parsed.equipment?.cuesOwned ?? fallbackState.equipment.cuesOwned,
        chalkOwned: parsed.equipment?.chalkOwned ?? fallbackState.equipment.chalkOwned,
        tipsOwned: parsed.equipment?.tipsOwned ?? fallbackState.equipment.tipsOwned,
        casesOwned: parsed.equipment?.casesOwned ?? fallbackState.equipment.casesOwned,
        tablesOwned: parsed.equipment?.tablesOwned ?? fallbackState.equipment.tablesOwned,
        cueStates: {
          ...fallbackState.equipment.cueStates,
          ...(parsed.equipment?.cueStates ?? {}),
        },
      },
      finance: { ...fallbackState.finance, ...parsed.finance },
      tournaments: Array.isArray(parsed.tournaments) ? parsed.tournaments : fallbackState.tournaments,
      matches: Array.isArray(parsed.matches) ? parsed.matches : fallbackState.matches,
      rankings: Array.isArray(parsed.rankings) ? parsed.rankings : fallbackState.rankings,
      competitionTables: parsed.competitionTables ?? fallbackState.competitionTables,
      worldPlayers: normalizeWorldPlayers(Array.isArray(parsed.worldPlayers) ? parsed.worldPlayers as WorldPlayerRecord[] : fallbackState.worldPlayers, parsed.competitionTables ?? fallbackState.competitionTables, parsedPlayer),
      careerSystems: parsed.careerSystems ?? fallbackState.careerSystems,
      sponsors: Array.isArray(parsed.sponsors) ? parsed.sponsors : fallbackState.sponsors,
      sponsorOffers: Array.isArray(parsed.sponsorOffers) ? buildSponsorOffers(parsed.sponsorOffers as SponsorOfferState[]) : fallbackState.sponsorOffers,
      coachContracts: Array.isArray(parsed.coachContracts)
        ? normalizeCoachContracts(parsed.coachContracts as CoachContract[], Array.isArray(parsed.coaches) ? parsed.coaches as Coach[] : fallbackState.coaches)
        : buildLegacyCoachContracts(parsed.currentCoachId ?? fallbackState.currentCoachId, Array.isArray(parsed.coaches) ? parsed.coaches as Coach[] : fallbackState.coaches, parsed.week ?? fallbackState.week),
      inbox: normalizeInboxMessages(Array.isArray(parsed.inbox) ? parsed.inbox : fallbackState.inbox),
      travel: parsed.travel ? { bookings: parsed.travel.bookings ?? {} } : fallbackState.travel,
      maintenance: parsed.maintenance ? { history: parsed.maintenance.history ?? fallbackState.maintenance.history } : fallbackState.maintenance,
      tournamentProgress: parsed.tournamentProgress
        ? {
            ...createEmptyTournamentProgress(),
            ...parsed.tournamentProgress,
            draw: parsed.tournamentProgress.draw ?? [],
            completedRounds: parsed.tournamentProgress.completedRounds ?? [],
          }
        : createEmptyTournamentProgress(),
      liveMatch: normalizeLiveMatchState(parsed.liveMatch ?? null),
      history: parsed.history
        ? {
            snapshots: (parsed.history.snapshots ?? fallbackState.history.snapshots).map((snapshot) => ({
              ...snapshot,
              season: snapshot.season ?? getSeasonLabelForDate(snapshot.date ?? parsed.currentDate ?? fallbackState.currentDate),
            })),
            matchLog: (parsed.history.matchLog ?? []).map((entry) => ({
              ...entry,
              season: entry.season ?? getSeasonLabelForDate(entry.date),
            })),
            tournamentHistory: parsed.history.tournamentHistory ?? fallbackState.history.tournamentHistory,
            seasonRecords: parsed.history.seasonRecords ?? fallbackState.history.seasonRecords,
          }
        : fallbackState.history,
      trainingPlan: Array.isArray(parsed.trainingPlan)
        ? normalizeTrainingPlan(
            parsed.trainingPlan as TrainingPlannerDay[],
            parsed.currentDate ?? fallbackState.currentDate,
            getEnteredCompetitions({
              tournaments: Array.isArray(parsed.tournaments) ? parsed.tournaments as Tournament[] : fallbackState.tournaments,
            }),
          )
        : fallbackState.trainingPlan,
      trainingAppliedWeek: parsed.trainingAppliedWeek ?? null,
      lastAction: parsed.lastAction ?? 'Loaded saved career.',
    }

    return recalculateState(hydratedState, hydratedState.lastAction)
  } catch {
    return createStarterState()
  }
}

function runMatchSimulation(state: GameState, tournament: Tournament, simulationMode: SimulationMode = SIMULATION_MODE.career) {
  if (simulationMode !== SIMULATION_MODE.career) {
    throw new Error(`runMatchSimulation only supports career mode. Received ${simulationMode}.`)
  }

  const resolvedLiveMatch = resolveCareerSimulationLiveMatch(state, tournament)
  return finalizeLiveMatch({ ...state, liveMatch: resolvedLiveMatch }, resolvedLiveMatch)
}

export function hireCoachState(previousState: GameState, coachId: string, contractLabel?: string) {
  const coach = previousState.coaches.find((item) => item.id === coachId)
  if (!coach) return previousState

  if (previousState.coachContracts.some((contract) => contract.coachId === coachId)) {
    return recalculateState(previousState, 'This coach is already under contract.')
  }

  const availability = getCoachAvailabilityStatus(previousState, coach)
  if (!availability.available) {
    return recalculateState(previousState, availability.reason)
  }

  const nextSlot = getNextCoachSlot(previousState)
  if (!nextSlot) {
    return recalculateState(previousState, 'No staff slot is available for another coach yet.')
  }

  const contractOption = getCoachContractOptions(coach).find((option) => option.label === contractLabel) ?? getCoachContractOptions(coach)[0]

  return finalizeState(
    {
      ...previousState,
      coachContracts: [
        ...previousState.coachContracts,
        {
          coachId,
          slot: nextSlot,
          contractLabel: contractOption.label,
          contractWeeks: parseCoachContractWeeks(contractOption.label),
          weeklyCost: contractOption.weeklyCost,
          totalCost: contractOption.totalCost,
          weeksRemaining: parseCoachContractWeeks(contractOption.label),
          startedWeek: previousState.week,
        },
      ],
      player: {
        ...previousState.player,
        confidence: clamp(previousState.player.confidence + 2, 0, 100),
        morale: clamp(previousState.player.morale + 2, 0, 100),
      },
      inbox: [
        createInboxMessage(
          {
            sender: 'Staff Office',
            subject: `${coach.name} hired`,
            preview: `${coach.name} signed into the ${nextSlot} slot on a ${contractOption.label.toLowerCase()}. Weekly cost: £${contractOption.weeklyCost}.`,
            priority: 'Medium',
          },
          'Today',
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Signed ${coach.name} to the ${nextSlot} slot.`,
    'Coach Change',
  )
}

export function fireCoachState(previousState: GameState, coachId: string) {
  const contract = previousState.coachContracts.find((item) => item.coachId === coachId)
  const coach = previousState.coaches.find((item) => item.id === coachId)
  if (!contract || !coach) return previousState

  return finalizeState(
    {
      ...previousState,
      coachContracts: previousState.coachContracts.filter((item) => item.coachId !== coachId),
      player: {
        ...previousState.player,
        morale: clamp(previousState.player.morale - 2, 0, 100),
      },
      inbox: [
        createInboxMessage(
          {
            sender: 'Staff Office',
            subject: `${coach.name} released`,
            preview: `${coach.name} has been removed from the ${contract.slot} slot. Weekly staff exposure has dropped by £${contract.weeklyCost}.`,
            priority: 'Medium',
          },
          'Today',
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Released ${coach.name} from the ${contract.slot} slot.`,
    'Coach Change',
  )
}

export function buyCueState(previousState: GameState, cueId: string) {
  if (previousState.equipment.cuesOwned.includes(cueId)) {
    return finalizeState(
      {
        ...previousState,
        equipment: { ...previousState.equipment, currentCueId: cueId },
        player: { ...previousState.player, confidence: clamp(previousState.player.confidence + 1, 0, 100) },
      },
      'Equipped an owned cue.',
    )
  }

  const cue = cueMarketplaceCatalog.find((item) => item.id === cueId)
  if (!cue) return previousState
  if (previousState.player.cash < cue.price) {
    return finalizeState(previousState, `Not enough cash to buy ${cue.name}.`)
  }

  return finalizeState(
    {
      ...previousState,
      equipment: {
        ...previousState.equipment,
        currentCueId: cueId,
        cuesOwned: [...previousState.equipment.cuesOwned, cueId],
        cueStates: {
          ...previousState.equipment.cueStates,
          [cueId]: {
            condition: cue.condition,
            familiarity: cue.familiarity,
            durability: cue.durability,
            tipCondition: clamp(cue.condition - 12, 28, 100),
            shaftStraightness: clamp(cue.condition - 6, 40, 100),
          },
        },
      },
      player: {
        ...previousState.player,
        cash: previousState.player.cash - cue.price,
        confidence: clamp(previousState.player.confidence + 1, 0, 100),
      },
      inbox: [
        createInboxMessage(
          {
            sender: 'Equipment Shop',
            subject: `${cue.name} purchased`,
            preview: `You bought and equipped ${cue.name} for £${cue.price}. Familiarity will improve over time.`,
            priority: 'Medium',
          },
          'Today',
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Purchased ${cue.name}.`,
    'Equipment Purchase',
  )
}

export function buyChalkState(previousState: GameState, chalkId: string) {
  if (previousState.equipment.chalkOwned.includes(chalkId)) {
    return finalizeState(
      {
        ...previousState,
        equipment: { ...previousState.equipment, currentChalkId: chalkId },
        player: { ...previousState.player, confidence: clamp(previousState.player.confidence + 1, 0, 100) },
      },
      'Equipped owned chalk.',
    )
  }

  const chalk = chalkCatalog.find((item) => item.id === chalkId)
  if (!chalk) return previousState
  if (previousState.player.cash < chalk.cost) {
    return finalizeState(previousState, `Not enough cash to buy ${chalk.name}.`)
  }

  return finalizeState(
    {
      ...previousState,
      equipment: {
        ...previousState.equipment,
        currentChalkId: chalkId,
        chalkOwned: [...previousState.equipment.chalkOwned, chalkId],
      },
      player: {
        ...previousState.player,
        cash: previousState.player.cash - chalk.cost,
        confidence: clamp(previousState.player.confidence + 1, 0, 100),
      },
      inbox: [
        createInboxMessage(
          {
            sender: 'Equipment Shop',
            subject: `${chalk.name} purchased`,
            preview: `You bought and equipped ${chalk.name} for £${chalk.cost}.`,
            priority: 'Low',
            actionLabel: 'Open Chalk & Tip Setup',
            actionRoute: '/equipment/chalk-tips',
          },
          'Today',
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Purchased ${chalk.name}.`,
    'Equipment Purchase',
  )
}

export function buyTipState(previousState: GameState, tipId: string) {
  if (previousState.equipment.tipsOwned.includes(tipId)) {
    return finalizeState(
      {
        ...previousState,
        equipment: { ...previousState.equipment, currentTipId: tipId },
        player: { ...previousState.player, confidence: clamp(previousState.player.confidence + 1, 0, 100) },
      },
      'Equipped an owned tip.',
    )
  }

  const tip = tipCatalog.find((item) => item.id === tipId)
  if (!tip) return previousState
  if (previousState.player.cash < tip.cost) {
    return finalizeState(previousState, `Not enough cash to buy ${tip.name}.`)
  }

  return finalizeState(
    {
      ...previousState,
      equipment: {
        ...previousState.equipment,
        currentTipId: tipId,
        tipsOwned: [...previousState.equipment.tipsOwned, tipId],
      },
      player: {
        ...previousState.player,
        cash: previousState.player.cash - tip.cost,
        confidence: clamp(previousState.player.confidence + 1, 0, 100),
      },
      inbox: [
        createInboxMessage(
          {
            sender: 'Equipment Shop',
            subject: `${tip.name} purchased`,
            preview: `You bought and equipped ${tip.name} for £${tip.cost}.`,
            priority: 'Low',
            actionLabel: 'Open Chalk & Tip Setup',
            actionRoute: '/equipment/chalk-tips',
          },
          'Today',
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Purchased ${tip.name}.`,
    'Equipment Purchase',
  )
}

export function applyTrainingPlanState(previousState: GameState, nextWeek?: TrainingPlannerDay[]) {
  if (previousState.trainingAppliedWeek === previousState.week) {
    return finalizeState(previousState, 'Training effects already applied for this week.')
  }

  const normalizedTrainingPlan = normalizeTrainingPlan(
    nextWeek ?? previousState.trainingPlan,
    previousState.currentDate,
    getEnteredCompetitions(previousState),
  )
  const trainingEffects = applyCoachTrainingBonus(
    calculateTrainingEffects(normalizedTrainingPlan),
    previousState.coachContracts,
    previousState.coaches,
  )
  const nextAttributes = deepCloneAttributes(previousState.attributes)
  improveAttribute(nextAttributes, 'Long Potting', getScaledTrainingGain(previousState, 'Long Potting', trainingEffects.technicalGain))
  improveAttribute(nextAttributes, 'Cue Ball Control', getScaledTrainingGain(previousState, 'Cue Ball Control', trainingEffects.cueControlGain))
  improveAttribute(nextAttributes, 'Break Building', getScaledTrainingGain(previousState, 'Break Building', trainingEffects.breakBuildingGain))
  improveAttribute(nextAttributes, 'Focus', getScaledTrainingGain(previousState, 'Focus', trainingEffects.focusGain))
  improveAttribute(nextAttributes, 'Stamina', getScaledTrainingGain(previousState, 'Stamina', trainingEffects.staminaGain))

  return finalizeState(
    {
      ...previousState,
      attributes: nextAttributes,
      trainingPlan: normalizedTrainingPlan,
      trainingAppliedWeek: previousState.week,
      player: {
        ...previousState.player,
        confidence: clamp(previousState.player.confidence + trainingEffects.confidenceDelta, 0, 100),
        fatigue: clamp(previousState.player.fatigue + trainingEffects.fatigueDelta, 0, 100),
        morale: clamp(previousState.player.morale + trainingEffects.moraleDelta, 0, 100),
      },
      inbox: [
        createInboxMessage(
          {
            sender: 'Head Coach',
            subject: 'Training week completed',
            preview: trainingEffects.fatigueDelta < 0
              ? `Rest and recovery worked as planned. Fatigue dropped by ${Math.abs(trainingEffects.fatigueDelta)} while sharpness still improved.`
              : `Training effects have been applied for the week. Fatigue shifted by ${trainingEffects.fatigueDelta} based on the current schedule.`,
            priority: 'Medium',
          },
          'Today',
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Applied training gains for week ${previousState.week}.`,
    'Training Block',
  )
}

export function acceptSponsorState(previousState: GameState, sponsorId: string) {
  const offer = findSponsorOfferFromState(previousState, sponsorId)
  if (!offer) return previousState
  if (offer.status === 'Rejected') {
    return finalizeState(previousState, `${offer.name} has already been rejected.`)
  }
  if (previousState.sponsors.some((sponsor) => sponsor.name === offer.name)) {
    return finalizeState(previousState, `${offer.name} is already active.`)
  }
  if (previousState.player.reputation < offer.minimumReputation) {
    return finalizeState(previousState, `${offer.name} needs at least ${offer.minimumReputation} reputation before it can be signed.`)
  }
  if (previousState.sponsors.length >= getSponsorSlotLimit(previousState)) {
    return finalizeState(previousState, 'All currently unlocked sponsor slots are already occupied.')
  }
  const sponsorSlot = getNextSponsorSlot(previousState)
  if (!sponsorSlot) {
    return finalizeState(previousState, 'No sponsor slot is currently free for this deal.')
  }

  const acceptedSponsor: SponsorDeal = {
    id: offer.id,
    name: offer.name,
    category: offer.category,
    slot: sponsorSlot,
    monthlyValue: offer.monthlyValue,
    contractLength: offer.contractLength,
    weeksRemaining: parseContractWeeks(offer.contractLength),
    brandFit: offer.brandFit,
    risk: offer.risk === 'Risky Terms' ? 'High' : offer.risk === 'Medium Risk' ? 'Medium' : 'Low',
  }

  return finalizeState(
    {
      ...previousState,
      sponsors: [...previousState.sponsors, acceptedSponsor],
      sponsorOffers: previousState.sponsorOffers.map((item) =>
        item.id === sponsorId
          ? {
              ...item,
              status: 'Accepted',
              notes: [...item.notes, `Accepted in week ${previousState.week}.`],
            }
          : item,
      ),
      player: {
        ...previousState.player,
        reputation: clamp(previousState.player.reputation + 2, 0, 100),
        morale: clamp(previousState.player.morale + 1, 0, 100),
      },
      inbox: [
        createInboxMessage(
          {
            sender: 'Commercial Team',
            subject: `${offer.name} deal accepted`,
            preview: `${offer.name} now occupies the ${sponsorSlot} slot, contributes £${offer.monthlyValue}/month, and runs for ${offer.contractLength.toLowerCase()}.`,
            priority: 'High',
            actionLabel: 'Open Sponsorships',
            actionRoute: '/sponsorship',
          },
          'Today',
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Accepted the ${offer.name} sponsorship deal.`,
    'Sponsor Signed',
  )
}

export function scheduleTreatmentState(previousState: GameState, optionId?: string) {
  const availableOptions = [
    { id: 'treat-1', title: 'Rest', cost: 0 },
    { id: 'treat-2', title: 'Physio Treatment', cost: 180 },
    { id: 'treat-3', title: 'Reduced Training', cost: 50 },
    { id: 'treat-4', title: 'Fitness Plan', cost: 150 },
    { id: 'treat-5', title: 'Medical Review', cost: 120 },
    { id: chalkCatalog[0].id, title: 'Grip Reset', cost: 35 },
  ]
  const treatmentChoice = availableOptions.find((item) => item.id === optionId) ?? availableOptions[0]

  if (previousState.player.cash < treatmentChoice.cost) {
    return finalizeState(previousState, `Not enough cash to schedule ${treatmentChoice.title.toLowerCase()}.`)
  }

  const nextAttributes = deepCloneAttributes(previousState.attributes)
  improveAttribute(nextAttributes, 'Shoulder Health', 3)
  improveAttribute(nextAttributes, 'Recovery Rate', 2)

  return finalizeState(
    {
      ...previousState,
      attributes: nextAttributes,
      player: {
        ...previousState.player,
        cash: previousState.player.cash - treatmentChoice.cost,
        fatigue: clamp(previousState.player.fatigue - 8, 0, 100),
        morale: clamp(previousState.player.morale + 1, 0, 100),
      },
      inbox: [
        createInboxMessage(
          {
            sender: 'Medical Team',
            subject: `${treatmentChoice.title} scheduled`,
            preview: `Recovery work has been booked. Fatigue and shoulder condition improved slightly.`,
            priority: 'Medium',
            actionLabel: 'Open Health Centre',
            actionRoute: '/health',
          },
          'Today',
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Scheduled ${treatmentChoice.title.toLowerCase()}.`,
    'Treatment Scheduled',
  )
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => loadStoredState())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState))
  }, [gameState])

  const actions = useMemo(
    () => ({
      resetCareer(config?: NewCareerConfig) {
        setGameState(createNewCareerState(config))
      },
      continueWeek() {
        setGameState((previousState) => advanceWeekState(previousState))
      },
      continueToNextTournament() {
        setGameState((previousState) => continueToNextTournamentState(previousState))
      },
      hireCoach(coachId: string, contractLabel?: string) {
        setGameState((previousState) => hireCoachState(previousState, coachId, contractLabel))
      },
      fireCoach(coachId: string) {
        setGameState((previousState) => fireCoachState(previousState, coachId))
      },
      extendCoachContract(coachId: string, contractLabel?: string) {
        setGameState((previousState) => {
          const contract = previousState.coachContracts.find((item) => item.coachId === coachId)
          const coach = previousState.coaches.find((item) => item.id === coachId)
          if (!contract || !coach) return previousState

          const extensionOption = getCoachContractOptions(coach).find((option) => option.label === contractLabel) ?? getCoachContractOptions(coach)[0]
          const extensionWeeks = parseCoachContractWeeks(extensionOption.label)
          const nextWeeksRemaining = contract.weeksRemaining + extensionWeeks

          return finalizeState(
            {
              ...previousState,
              coachContracts: previousState.coachContracts.map((item) =>
                item.coachId === coachId
                  ? {
                      ...item,
                      contractLabel: extensionOption.label,
                      contractWeeks: item.contractWeeks + extensionWeeks,
                      weeklyCost: extensionOption.weeklyCost,
                      totalCost: extensionOption.weeklyCost * (item.contractWeeks + extensionWeeks),
                      weeksRemaining: nextWeeksRemaining,
                    }
                  : item,
              ),
              inbox: [
                createInboxMessage(
                  {
                    sender: 'Staff Office',
                    subject: `${coach.name} contract extended`,
                    preview: `${coach.name} agreed to a ${extensionOption.label.toLowerCase()} extension. ${nextWeeksRemaining} weeks are now remaining at £${extensionOption.weeklyCost} per week.`,
                    priority: 'Medium',
                  },
                  'Today',
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Extended ${coach.name}'s contract by ${extensionWeeks} weeks.`,
            'Coach Change',
          )
        })
      },
      negotiateCoachContract(coachId: string, tone: 'Conservative' | 'Balanced' | 'Ambitious' = 'Balanced') {
        setGameState((previousState) => {
          const contract = previousState.coachContracts.find((item) => item.coachId === coachId)
          const coach = previousState.coaches.find((item) => item.id === coachId)
          if (!contract || !coach) return previousState

          const outcome = getCoachNegotiationOutcome(contract, coach, previousState.player.reputation, tone)
          if (!outcome.success) {
            return finalizeState(
              {
                ...previousState,
                player: {
                  ...previousState.player,
                  morale: clamp(previousState.player.morale - 1, 0, 100),
                },
                inbox: [
                  createInboxMessage(
                    {
                      sender: 'Staff Office',
                      subject: `${coach.name} held firm`,
                      preview: `${tone} cost talks with ${coach.name} did not move the weekly number. The current rate remains £${contract.weeklyCost}.`,
                      priority: 'Low',
                    },
                    'Today',
                  ),
                  ...previousState.inbox,
                ].slice(0, 18),
              },
              `${coach.name} rejected the ${tone.toLowerCase()} negotiation approach.`,
              'Coach Change',
            )
          }

          return finalizeState(
            {
              ...previousState,
              coachContracts: previousState.coachContracts.map((item) =>
                item.coachId === coachId
                  ? {
                      ...item,
                      weeklyCost: outcome.nextWeeklyCost,
                      totalCost: outcome.nextWeeklyCost * item.contractWeeks,
                    }
                  : item,
              ),
              player: {
                ...previousState.player,
                confidence: clamp(previousState.player.confidence + 1, 0, 100),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: 'Staff Office',
                    subject: `${coach.name} accepted new terms`,
                    preview: `${tone} talks succeeded. ${coach.name}'s weekly cost is now £${outcome.nextWeeklyCost} for the current contract.`,
                    priority: 'Medium',
                  },
                  'Today',
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Negotiated ${coach.name}'s weekly cost down to £${outcome.nextWeeklyCost}.`,
            'Coach Change',
          )
        })
      },
      buyCue(cueId: string) {
        setGameState((previousState) => buyCueState(previousState, cueId))
      },
      buyChalk(chalkId: string) {
        setGameState((previousState) => buyChalkState(previousState, chalkId))
      },
      buyTip(tipId: string) {
        setGameState((previousState) => buyTipState(previousState, tipId))
      },
      buyCase(caseId: string) {
        setGameState((previousState) => {
          if (previousState.equipment.casesOwned.includes(caseId)) {
            return finalizeState(
              {
                ...previousState,
                equipment: { ...previousState.equipment, currentCaseId: caseId },
                player: { ...previousState.player, confidence: clamp(previousState.player.confidence + 1, 0, 100) },
              },
              'Equipped an owned case.',
            )
          }

          const equipmentCase = caseCatalog.find((item) => item.id === caseId)
          if (!equipmentCase) return previousState
          if (previousState.player.cash < equipmentCase.price) {
            return finalizeState(previousState, `Not enough cash to buy ${equipmentCase.name}.`)
          }

          return finalizeState(
            {
              ...previousState,
              equipment: {
                ...previousState.equipment,
                currentCaseId: caseId,
                casesOwned: [...previousState.equipment.casesOwned, caseId],
              },
              player: {
                ...previousState.player,
                cash: previousState.player.cash - equipmentCase.price,
                confidence: clamp(previousState.player.confidence + 1, 0, 100),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: 'Equipment Shop',
                    subject: `${equipmentCase.name} purchased`,
                    preview: `You bought and equipped ${equipmentCase.name} for £${equipmentCase.price}.`,
                    priority: 'Low',
                    actionLabel: 'Open Cases',
                    actionRoute: '/equipment/cases',
                  },
                  'Today',
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Purchased ${equipmentCase.name}.`,
            'Equipment Purchase',
          )
        })
      },
      buyTableSetup(tableId: string) {
        setGameState((previousState) => {
          if (previousState.equipment.tablesOwned.includes(tableId)) {
            return finalizeState(
              {
                ...previousState,
                equipment: { ...previousState.equipment, currentTableId: tableId, tablesOwned: [tableId] },
                player: { ...previousState.player, confidence: clamp(previousState.player.confidence + 1, 0, 100) },
              },
              'Switched your active training facility membership.',
            )
          }

          const tableSetup = tableSetupCatalog.find((item) => item.id === tableId)
          if (!tableSetup) return previousState
          if (previousState.player.cash < tableSetup.monthlyRental) {
            return finalizeState(previousState, `Not enough cash buffer to start a membership at ${tableSetup.name}.`)
          }

          return finalizeState(
            {
              ...previousState,
              equipment: {
                ...previousState.equipment,
                currentTableId: tableId,
                tablesOwned: [tableId],
              },
              player: {
                ...previousState.player,
                confidence: clamp(previousState.player.confidence + 1, 0, 100),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: 'Facility Manager',
                    subject: `${tableSetup.name} membership started`,
                    preview: `You joined ${tableSetup.name} as your active training facility at ${tableSetup.monthlyRental}/month. Weekly cash flow now reflects the membership.`,
                    priority: 'Low',
                    actionLabel: 'Open Training Facility',
                    actionRoute: '/equipment/table-setup',
                  },
                  'Today',
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Started a membership at ${tableSetup.name}.`,
            'Facility Membership',
          )
        })
      },
      applyTrainingPlan(nextWeek?: TrainingPlannerDay[]) {
        setGameState((previousState) => applyTrainingPlanState(previousState, nextWeek))
      },
      updateTrainingPlan(trainingPlan: TrainingPlannerDay[]) {
        setGameState((previousState) => ({
          ...previousState,
          trainingPlan: normalizeTrainingPlan(trainingPlan, previousState.currentDate, getEnteredCompetitions(previousState)),
        }))
      },
      enterTournament(tournamentId: string) {
        setGameState((previousState) => enterTournamentState(previousState, tournamentId))
      },
      bookTravel(tournamentId?: string, travelOptionId?: string, hotelOptionId?: string) {
        setGameState((previousState) => {
          const tournament = previousState.tournaments.find((item) => item.id === tournamentId) ?? previousState.tournaments.find((item) => item.status === 'Entered')
          if (!tournament) {
            return finalizeState(previousState, 'Enter a tournament before booking travel.')
          }

          const travelOption = getTravelOption(travelOptionId)
          const hotelOption = getHotelOption(hotelOptionId)
          const totalCost = getTripCost(travelOption, hotelOption)
          const existingBooking = previousState.travel.bookings[tournament.id]
          const delta = totalCost - (existingBooking?.totalCost ?? 0)

          if (previousState.player.cash < delta) {
            return finalizeState(previousState, `Not enough cash to lock the ${travelOption.name} and ${hotelOption.name} package.`)
          }

          return finalizeState(
            {
              ...previousState,
              player: {
                ...previousState.player,
                cash: previousState.player.cash - delta,
                fatigue: clamp(previousState.player.fatigue - Math.round((100 - travelOption.fatigueValue) / 25), 0, 100),
                confidence: clamp(previousState.player.confidence + Math.round(hotelOption.preparationValue / 40), 0, 100),
              },
              travel: {
                bookings: {
                  ...previousState.travel.bookings,
                  [tournament.id]: {
                    tournamentId: tournament.id,
                    travelOptionId: travelOption.id,
                    hotelOptionId: hotelOption.id,
                    totalCost,
                    bookedWeek: previousState.week,
                    bookedDate: previousState.currentDate,
                  },
                },
              },
              history: {
                ...previousState.history,
                tournamentHistory: upsertTournamentHistoryEntry(
                  previousState.history.tournamentHistory,
                  synchronizeTournamentHistoryEntry(
                    tournament,
                    {
                      ...(previousState.history.tournamentHistory.find((entry) => entry.id === getTournamentHistoryId(previousState.season, tournament.id)) ?? createTournamentHistoryEntry(tournament, previousState.season)),
                      status: 'Entered',
                      result: 'Travel booked',
                      bookedTravelCost: totalCost,
                    },
                  ),
                ),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: 'Travel Desk',
                    subject: `${tournament.name} travel booked`,
                    preview: `${travelOption.name} and ${hotelOption.name} are now locked in for £${totalCost}. Match-day readiness has improved.`,
                    priority: 'Medium',
                    actionLabel: 'Review Travel',
                    actionRoute: '/travel',
                  },
                  'Today',
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Booked travel for ${tournament.name}.`,
            'Travel Booking',
          )
        })
      },
      simulateMatch(tournamentId?: string) {
        setGameState((previousState) => {
          const tournament = previousState.tournaments.find((item) => item.id === tournamentId) ?? previousState.tournaments.find((item) => item.status === 'Entered')
          if (!tournament) {
            return finalizeState(previousState, 'No entered tournament is ready for simulation.')
          }

          const equipmentMessage = getTournamentEquipmentMessage(previousState.equipment)
          if (equipmentMessage) {
            return finalizeState(previousState, equipmentMessage)
          }

          return runMatchSimulation(previousState, tournament)
        })
      },
      startLiveMatch(tournamentId?: string) {
        setGameState((previousState) => {
          const tournament = previousState.tournaments.find((item) => item.id === tournamentId) ?? previousState.tournaments.find((item) => item.status === 'Entered')
          if (!tournament) {
            return finalizeState(previousState, 'No entered tournament is ready to go live.')
          }

          const equipmentMessage = getTournamentEquipmentMessage(previousState.equipment)
          if (equipmentMessage) {
            return finalizeState(previousState, equipmentMessage)
          }

          if (previousState.liveMatch && previousState.liveMatch.tournamentId === tournament.id && previousState.liveMatch.status === 'In Progress') {
            return finalizeState(previousState, `Resumed the live match against ${previousState.liveMatch.opponentName}.`)
          }

          return finalizeState(
            {
              ...previousState,
              liveMatch: createLiveMatchState(previousState, tournament),
            },
            `Started the live match at ${tournament.name}.`,
          )
        })
      },
      playLiveVisit(decision: LiveVisitDecision) {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(previousState, 'There is no active live match.')
          }

          const progressedLiveMatch: LiveMatchState = advanceLiveVisit(previousState.liveMatch, decision, 'manual')
          return progressedLiveMatch.status === 'Completed'
            ? finalizeLiveMatch({ ...previousState, liveMatch: progressedLiveMatch }, progressedLiveMatch)
            : finalizeState({ ...previousState, liveMatch: progressedLiveMatch }, progressedLiveMatch.lastVisitSummary)
        })
      },
      simulateLiveVisit() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(previousState, 'There is no live visit to simulate.')
          }

          const progressedLiveMatch: LiveMatchState = advanceLiveVisit(previousState.liveMatch, undefined, 'simulated')
          return progressedLiveMatch.status === 'Completed'
            ? finalizeLiveMatch({ ...previousState, liveMatch: progressedLiveMatch }, progressedLiveMatch)
            : finalizeState({ ...previousState, liveMatch: progressedLiveMatch }, progressedLiveMatch.lastVisitSummary)
        })
      },
      continueLiveFrame() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(previousState, 'There is no active live match.')
          }

          const progressedLiveMatch: LiveMatchState = playOutLiveFrame(previousState.liveMatch, 'manual')
          return progressedLiveMatch.status === 'Completed'
            ? finalizeLiveMatch({ ...previousState, liveMatch: progressedLiveMatch }, progressedLiveMatch)
            : finalizeState({ ...previousState, liveMatch: progressedLiveMatch }, `Played out ${progressedLiveMatch.frameHistory.at(-1)?.frame ?? 'the current frame'} through the visit engine.`)
        })
      },
      simulateLiveFrame() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(previousState, 'There is no live frame to simulate.')
          }

          const progressedLiveMatch: LiveMatchState = playOutLiveFrame(previousState.liveMatch, 'simulated')
          return progressedLiveMatch.status === 'Completed'
            ? finalizeLiveMatch({ ...previousState, liveMatch: progressedLiveMatch }, progressedLiveMatch)
            : finalizeState({ ...previousState, liveMatch: progressedLiveMatch }, `Simulated ${progressedLiveMatch.frameHistory.at(-1)?.frame ?? 'the next frame'}.`)
        })
      },
      simulateLiveMatch() {
        setGameState((previousState) => {
          let nextState: GameState = previousState

          const equipmentMessage = getTournamentEquipmentMessage(nextState.equipment)
          if (equipmentMessage) {
            return finalizeState(nextState, equipmentMessage)
          }

          if (!nextState.liveMatch) {
            const tournament = nextState.tournaments.find((item) => item.status === 'Entered')
            if (!tournament) {
              return finalizeState(nextState, 'There is no live match to simulate.')
            }

            nextState = {
              ...nextState,
              liveMatch: createLiveMatchState(nextState, tournament),
            }
          }

          while (nextState.liveMatch && nextState.liveMatch.status === 'In Progress') {
            const progressedLiveMatch: LiveMatchState = playOutLiveFrame(nextState.liveMatch, 'simulated')
            nextState = progressedLiveMatch.status === 'Completed'
              ? finalizeLiveMatch({ ...nextState, liveMatch: progressedLiveMatch }, progressedLiveMatch)
              : { ...nextState, liveMatch: progressedLiveMatch }
          }

          return nextState
        })
      },
      updateLiveMatchTactics(updates: Partial<Pick<LiveMatchState, 'tacticalPlan' | 'mentalFocus' | 'tempo'>>) {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(previousState, 'There is no active live match to adjust.')
          }

          const nextSelections = {
            tacticalPlan: updates.tacticalPlan ?? previousState.liveMatch.tacticalPlan,
            mentalFocus: updates.mentalFocus ?? previousState.liveMatch.mentalFocus,
            tempo: updates.tempo ?? previousState.liveMatch.tempo,
          }
          const nextPrompt = getLiveMatchCoachPrompt(
            {
              playerFrames: previousState.liveMatch.playerFrames,
              opponentFrames: previousState.liveMatch.opponentFrames,
              pressureValue: previousState.liveMatch.pressureValue,
              playerFatigue: previousState.liveMatch.playerFatigue,
              opponentApproach: previousState.liveMatch.opponentApproach,
              ...nextSelections,
            },
          )
          const nextLiveMatch: LiveMatchState = {
            ...previousState.liveMatch,
            ...updates,
            tacticalEdge: getTacticalMatchupEdge(nextSelections.tacticalPlan, previousState.liveMatch.opponentApproach),
            coachPrompt: nextPrompt,
            lastTacticalNote: `${nextSelections.tacticalPlan} plan, ${nextSelections.mentalFocus.toLowerCase()} focus, ${nextSelections.tempo.toLowerCase()} tempo ready for the next frame.`,
          }

          return finalizeState(
            {
              ...previousState,
              liveMatch: nextLiveMatch,
            },
            `Updated the live tactical settings against a ${previousState.liveMatch.opponentApproach.toLowerCase()} opponent.`,
          )
        })
      },
      applyLiveCoachCue() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(previousState, 'There is no active live match for a coach cue.')
          }

          const prompt = previousState.liveMatch.coachPrompt
          const nextLiveMatch: LiveMatchState = {
            ...previousState.liveMatch,
            tacticalPlan: prompt.recommendedPlan,
            mentalFocus: prompt.recommendedMentalFocus,
            tempo: prompt.recommendedTempo,
            tacticalEdge: getTacticalMatchupEdge(prompt.recommendedPlan, previousState.liveMatch.opponentApproach) + 2,
            playerConfidence: clamp(previousState.liveMatch.playerConfidence + 2, 25, 99),
            lastTacticalNote: `${prompt.title}: ${prompt.note}`,
            feed: ([
              {
                id: `feed-coach-${Date.now()}`,
                time: `${String(Math.floor(previousState.liveMatch.timeElapsedMinutes / 60)).padStart(2, '0')}:${String(previousState.liveMatch.timeElapsedMinutes % 60).padStart(2, '0')}`,
                text: `Coach cue applied: ${prompt.recommendedPlan.toLowerCase()} plan, ${prompt.recommendedMentalFocus.toLowerCase()} focus, ${prompt.recommendedTempo.toLowerCase()} tempo.`,
                actor: 'System' as const,
                tone: 'blue' as const,
              },
              ...previousState.liveMatch.feed,
            ] satisfies LiveFeedItem[]).slice(0, 12),
          }

          return finalizeState(
            {
              ...previousState,
              liveMatch: nextLiveMatch,
            },
            `Applied coach cue: ${prompt.title}.`,
          )
        })
      },
      takeLiveMatchTimeout() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(previousState, 'There is no active live match to pause.')
          }
          if (previousState.liveMatch.timeoutsRemaining <= 0) {
            return finalizeState(previousState, 'No live-match timeouts remain.')
          }

          const nextOpponentApproach = previousState.liveMatch.playerFrames < previousState.liveMatch.opponentFrames
            ? 'Tight'
            : previousState.liveMatch.playerFrames > previousState.liveMatch.opponentFrames
              ? 'Pressing'
              : 'Measured'
          const timeoutAdjustment = buildOpponentAdjustmentEvent({
            previousApproach: previousState.liveMatch.opponentApproach,
            nextApproach: nextOpponentApproach,
            frameLabel: previousState.liveMatch.currentFrame === 1 ? 'Pre-frame' : `F${previousState.liveMatch.currentFrame}`,
            nextPlayerFrames: previousState.liveMatch.playerFrames,
            nextOpponentFrames: previousState.liveMatch.opponentFrames,
            pressureValue: clamp(previousState.liveMatch.pressureValue - 10, 20, 96),
            trigger: 'Timeout',
          })

          const nextLiveMatch: LiveMatchState = {
            ...previousState.liveMatch,
            timeoutsRemaining: previousState.liveMatch.timeoutsRemaining - 1,
            playerConfidence: clamp(previousState.liveMatch.playerConfidence + 4, 25, 99),
            playerFatigue: clamp(previousState.liveMatch.playerFatigue - 3, 0, 100),
            pressureValue: clamp(previousState.liveMatch.pressureValue - 10, 20, 96),
            pressureLabel: previousState.liveMatch.pressureValue - 10 >= 78 ? 'High' : previousState.liveMatch.pressureValue - 10 >= 58 ? 'Building' : 'Stable',
            intervalText: 'Timeout taken. The player had a reset, slowed the pace, and settled before the next frame.',
            lastTacticalNote: 'Timeout used to reset confidence and reduce pressure before the next frame.',
            opponentApproach: nextOpponentApproach,
            feed: ([
              {
                id: `feed-timeout-${Date.now()}`,
                time: `${String(Math.floor(previousState.liveMatch.timeElapsedMinutes / 60)).padStart(2, '0')}:${String(previousState.liveMatch.timeElapsedMinutes % 60).padStart(2, '0')}`,
                text: `${previousState.liveMatch.playerName} uses a timeout to regroup before ${previousState.liveMatch.currentFrame === 1 ? 'the opening frame' : `F${previousState.liveMatch.currentFrame}`}.`,
                actor: 'System' as const,
                tone: 'blue' as const,
              },
              timeoutAdjustment
                ? {
                    id: `feed-timeout-adjustment-${Date.now()}`,
                    time: `${String(Math.floor(previousState.liveMatch.timeElapsedMinutes / 60)).padStart(2, '0')}:${String(previousState.liveMatch.timeElapsedMinutes % 60).padStart(2, '0')}`,
                    text: `Opponent adjustment: ${timeoutAdjustment.note}`,
                    actor: 'System' as const,
                    tone: 'blue' as const,
                  }
                : null,
              ...previousState.liveMatch.feed,
            ].filter(Boolean) as LiveFeedItem[]).slice(0, 12),
            coachPrompt: getLiveMatchCoachPrompt(
              {
                playerFrames: previousState.liveMatch.playerFrames,
                opponentFrames: previousState.liveMatch.opponentFrames,
                pressureValue: clamp(previousState.liveMatch.pressureValue - 10, 20, 96),
                playerFatigue: clamp(previousState.liveMatch.playerFatigue - 3, 0, 100),
                opponentApproach: nextOpponentApproach,
                tacticalPlan: previousState.liveMatch.tacticalPlan,
                mentalFocus: previousState.liveMatch.mentalFocus,
                tempo: previousState.liveMatch.tempo,
              },
            ),
            lastOpponentAdjustment: timeoutAdjustment,
            opponentAdjustmentHistory: timeoutAdjustment
              ? [timeoutAdjustment, ...previousState.liveMatch.opponentAdjustmentHistory].slice(0, 4)
              : previousState.liveMatch.opponentAdjustmentHistory,
          }

          return finalizeState(
            {
              ...previousState,
              liveMatch: nextLiveMatch,
            },
            'Used a live-match timeout to reset the player.',
          )
        })
      },
      concedeLiveFrame() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(previousState, 'There is no active live frame to concede.')
          }

          const liveMatch = previousState.liveMatch
          const remainingPoints = getRemainingTablePoints(liveMatch)
          const concededLiveMatch: LiveMatchState = {
            ...liveMatch,
            opponentPoints: Math.max(liveMatch.opponentPoints, liveMatch.playerPoints + remainingPoints + 1),
            currentBreak: 0,
            playerAtTable: liveMatch.opponentName,
            tableState: { redsRemaining: 0, coloursRemaining: [] },
            ballsRemaining: 0,
            timeElapsedMinutes: liveMatch.timeElapsedMinutes + 2,
            intervalText: `${liveMatch.playerName} conceded frame ${liveMatch.currentFrame}.`,
            lastVisitSummary: `Frame ${liveMatch.currentFrame} conceded.`,
            feed: ([
              {
                id: `feed-concede-${Date.now()}`,
                time: `${String(Math.floor(liveMatch.timeElapsedMinutes / 60)).padStart(2, '0')}:${String(liveMatch.timeElapsedMinutes % 60).padStart(2, '0')}`,
                text: `${liveMatch.playerName} concedes frame ${liveMatch.currentFrame}.`,
                actor: 'System' as const,
                tone: 'amber' as const,
              },
              ...liveMatch.feed,
            ] satisfies LiveFeedItem[]).slice(0, 16),
          }
          const progressedLiveMatch = resolveCompletedLiveFrame(concededLiveMatch, 'Played')

          return progressedLiveMatch.status === 'Completed'
            ? finalizeLiveMatch({ ...previousState, liveMatch: progressedLiveMatch }, progressedLiveMatch)
            : finalizeState({ ...previousState, liveMatch: progressedLiveMatch }, progressedLiveMatch.lastVisitSummary)
        })
      },
      acceptSponsor(sponsorId: string) {
        setGameState((previousState) => acceptSponsorState(previousState, sponsorId))
      },
      rejectSponsor(sponsorId: string) {
        setGameState((previousState) => {
          const offer = findSponsorOfferFromState(previousState, sponsorId)
          if (!offer) return previousState
          if (offer.status === 'Rejected') {
            return finalizeState(previousState, `${offer.name} has already been rejected.`)
          }
          if (offer.status === 'Accepted') {
            return finalizeState(previousState, `${offer.name} is already active and cannot be rejected from this screen.`)
          }

          return finalizeState(
            {
              ...previousState,
              sponsorOffers: previousState.sponsorOffers.map((item) =>
                item.id === sponsorId
                  ? {
                      ...item,
                      status: 'Rejected',
                      notes: [...item.notes, `Rejected in week ${previousState.week}.`],
                    }
                  : item,
              ),
              player: {
                ...previousState.player,
                morale: clamp(previousState.player.morale - (offer.brandFit < 55 ? 0 : 1), 0, 100),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: 'Commercial Team',
                    subject: `${offer.name} offer declined`,
                    preview: `${offer.name} has been removed from the current offer list. Your team can reopen talks later if needed.`,
                    priority: 'Low',
                    actionLabel: 'Review Offers',
                    actionRoute: '/sponsorship',
                  },
                  'Today',
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Rejected the ${offer.name} sponsorship offer.`,
            'Sponsor Decision',
          )
        })
      },
      negotiateSponsor(sponsorId: string, negotiationLabel?: string, tone: 'Conservative' | 'Balanced' | 'Ambitious' = 'Balanced') {
        setGameState((previousState) => {
          const offer = findSponsorOfferFromState(previousState, sponsorId)
          if (!offer) return previousState
          if (offer.status !== 'Available') {
            return finalizeState(previousState, `${offer.name} is no longer open for negotiation.`)
          }
          if (offer.negotiationCount >= 2) {
            return finalizeState(previousState, `${offer.name} has no further room for negotiation right now.`)
          }

          const selectedOption = negotiationOptionCatalog.find((item) => item.label === negotiationLabel) ?? negotiationOptionCatalog[0]
          const toneModifier = tone === 'Conservative' ? 8 : tone === 'Ambitious' ? -10 : 0
          const success = Math.random() * 100 < clamp(selectedOption.probability + toneModifier, 10, 90)

          const updatedOffers = previousState.sponsorOffers.map((item) => {
            if (item.id !== sponsorId) return item

            if (!success) {
              return {
                ...item,
                negotiationCount: item.negotiationCount + 1,
                notes: [...item.notes, `${selectedOption.label} request declined (${tone.toLowerCase()}).`],
              }
            }

            let monthlyValue = item.monthlyValue
            let contractLength = item.contractLength
            let behaviour = item.behaviour
            let bonusClause = item.bonusClause

            if (selectedOption.label === 'Increase Base Pay') {
              monthlyValue = Math.round(item.monthlyValue * 1.1)
            }
            if (selectedOption.label === 'Reduce Obligations') {
              monthlyValue = Math.max(200, item.monthlyValue - 150)
              behaviour = `${item.behaviour} · Reduced appearance load`
            }
            if (selectedOption.label === 'Add Title Bonus') {
              monthlyValue = Math.max(200, item.monthlyValue - 250)
              bonusClause = `${item.bonusClause} · Ranking title +£5,000`
            }
            if (selectedOption.label === 'Shorten Contract Length') {
              monthlyValue = Math.max(200, item.monthlyValue - 200)
              contractLength = '18 months'
            }

            return {
              ...item,
              monthlyValue,
              contractLength,
              behaviour,
              bonusClause,
              negotiationCount: item.negotiationCount + 1,
              note: `${selectedOption.label} approved`,
              notes: [...item.notes, `${selectedOption.label} approved with a ${tone.toLowerCase()} tone.`],
            }
          })

          return finalizeState(
            {
              ...previousState,
              sponsorOffers: updatedOffers,
              player: {
                ...previousState.player,
                confidence: clamp(previousState.player.confidence + (success ? 1 : -1), 0, 100),
                morale: clamp(previousState.player.morale + (success ? 2 : -1), 0, 100),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: 'Commercial Team',
                    subject: `${offer.name} negotiation ${success ? 'updated' : 'stalled'}`,
                    preview: success
                      ? `${selectedOption.label} was accepted. Revised monthly value is now under review.`
                      : `${offer.name} pushed back on the ${selectedOption.label.toLowerCase()} request.`,
                    priority: success ? 'Medium' : 'Low',
                    actionLabel: success ? 'Review Deal' : 'Reopen Deal',
                    actionRoute: `/sponsorship/contract?offer=${offer.id}`,
                  },
                  'Today',
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            success ? `Negotiated improved terms with ${offer.name}.` : `${offer.name} declined the latest negotiation request.`,
            'Sponsor Negotiation',
          )
        })
      },
      updateEquipmentSetup(setup: { cueId?: string; chalkId?: string; tipId?: string }) {
        setGameState((previousState) => {
          if (setup.cueId && !previousState.equipment.cuesOwned.includes(setup.cueId)) {
            return finalizeState(previousState, 'You need to own a cue before equipping it.')
          }

          const selectedChalk = setup.chalkId ? chalkCatalog.find((item) => item.id === setup.chalkId) : undefined
          const selectedTip = setup.tipId ? tipCatalog.find((item) => item.id === setup.tipId) : undefined
          const chalkCost = selectedChalk && !previousState.equipment.chalkOwned.includes(selectedChalk.id) ? selectedChalk.cost : 0
          const tipCost = selectedTip && !previousState.equipment.tipsOwned.includes(selectedTip.id) ? selectedTip.cost : 0
          const totalCost = chalkCost + tipCost

          if (previousState.player.cash < totalCost) {
            return finalizeState(previousState, `Not enough cash to complete this setup change (£${totalCost}).`)
          }

          const nextEquipment = {
            ...previousState.equipment,
            currentCueId: setup.cueId ?? previousState.equipment.currentCueId,
            currentChalkId: setup.chalkId ?? previousState.equipment.currentChalkId,
            currentTipId: setup.tipId ?? previousState.equipment.currentTipId,
            chalkOwned: selectedChalk && !previousState.equipment.chalkOwned.includes(selectedChalk.id)
              ? [...previousState.equipment.chalkOwned, selectedChalk.id]
              : previousState.equipment.chalkOwned,
            tipsOwned: selectedTip && !previousState.equipment.tipsOwned.includes(selectedTip.id)
              ? [...previousState.equipment.tipsOwned, selectedTip.id]
              : previousState.equipment.tipsOwned,
          }

          const purchasedItems = [selectedChalk && chalkCost > 0 ? selectedChalk.name : null, selectedTip && tipCost > 0 ? selectedTip.name : null].filter(Boolean)
          const equippedItems = [selectedChalk?.name, selectedTip?.name].filter(Boolean)

          return finalizeState(
            {
              ...previousState,
              equipment: nextEquipment,
              player: {
                ...previousState.player,
                cash: previousState.player.cash - totalCost,
                confidence: clamp(previousState.player.confidence + 1, 0, 100),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: 'Equipment Room',
                    subject: 'Setup updated',
                    preview: `${equippedItems.join(' and ')} ${purchasedItems.length > 0 ? `prepared. Purchases: ${purchasedItems.join(', ')}.` : 'equipped from your current inventory.'}`,
                    priority: 'Low',
                    actionLabel: 'Open Chalk & Tip Setup',
                    actionRoute: '/equipment/chalk-tips',
                  },
                  'Today',
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            totalCost > 0 ? `Updated the active equipment setup for £${totalCost}.` : 'Updated the active equipment setup.',
          )
        })
      },
      performMaintenance(actionId?: string) {
        setGameState((previousState) => {
          const maintenanceAction = maintenanceActionCatalog.find((item) => item.id === actionId) ?? maintenanceActionCatalog[0]
          if (!maintenanceAction) return previousState
          if (!previousState.equipment.currentCueId) {
            return finalizeState(previousState, 'You need to equip a cue before using maintenance.')
          }
          if (previousState.player.cash < maintenanceAction.cost) {
            return finalizeState(previousState, `Not enough cash to ${maintenanceAction.action.toLowerCase()}.`)
          }

          const currentCueState = getCueState(previousState.equipment, previousState.equipment.currentCueId)
          const restorationScore = maintenanceAction.restoration.reduce((sum, item) => sum + item.value, 0)
          const durabilityGain = maintenanceAction.restoration.find((item) => item.label === 'Durability')?.value ?? Math.round(restorationScore / 5)
          const updatedCueState: CueConditionState = {
            condition: clamp(currentCueState.condition + Math.round(restorationScore / 2), 0, 100),
            familiarity: clamp(currentCueState.familiarity + 1, 0, 100),
            durability: clamp(currentCueState.durability + durabilityGain, 0, 100),
            tipCondition: clamp(currentCueState.tipCondition + Math.round(restorationScore / 1.8), 0, 100),
            shaftStraightness: clamp(currentCueState.shaftStraightness + Math.round(restorationScore / 3), 0, 100),
          }

          return finalizeState(
            {
              ...previousState,
              equipment: {
                ...previousState.equipment,
                cueStates: {
                  ...previousState.equipment.cueStates,
                  [previousState.equipment.currentCueId]: updatedCueState,
                },
              },
              maintenance: {
                history: [
                  {
                    id: `mh-${Date.now()}`,
                    date: formatDisplayDate(previousState.currentDate),
                    service: maintenanceAction.action,
                    cost: maintenanceAction.cost,
                    technician: 'Career Workshop',
                    result: 'Complete',
                  },
                  ...previousState.maintenance.history,
                ].slice(0, 20),
              },
              player: {
                ...previousState.player,
                cash: previousState.player.cash - maintenanceAction.cost,
                confidence: clamp(previousState.player.confidence + 2, 0, 100),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: 'Equipment Room',
                    subject: `${maintenanceAction.action} completed`,
                    preview: `The active cue has been serviced. Condition and reliability improved immediately.`,
                    priority: 'Medium',
                    actionLabel: 'Open Maintenance',
                    actionRoute: '/equipment/maintenance',
                  },
                  'Today',
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Completed ${maintenanceAction.action.toLowerCase()} on the active cue.`,
            'Cue Maintenance',
          )
        })
      },
      scheduleTreatment(optionId?: string) {
        setGameState((previousState) => scheduleTreatmentState(previousState, optionId))
      },
      applyRecoveryPlan(actionTitle?: string) {
        setGameState((previousState) => {
          const nextAttributes = deepCloneAttributes(previousState.attributes)
          improveAttribute(nextAttributes, 'Focus', 2)
          improveAttribute(nextAttributes, 'Composure', 1)

          return finalizeState(
            {
              ...previousState,
              attributes: nextAttributes,
              player: {
                ...previousState.player,
                confidence: clamp(previousState.player.confidence + 6, 0, 100),
                morale: clamp(previousState.player.morale + 4, 0, 100),
                fatigue: clamp(previousState.player.fatigue - 10, 0, 100),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: 'Sports Psychologist',
                    subject: 'Recovery plan applied',
                    preview: `${actionTitle ?? 'The recovery block'} improved confidence, reduced fatigue, and steadied focus ahead of the next match.`,
                    priority: 'Medium',
                    actionLabel: 'Open Mental State',
                    actionRoute: '/mental',
                  },
                  'Today',
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Applied ${actionTitle?.toLowerCase() ?? 'the recovery plan'}.`,
            'Recovery Work',
          )
        })
      },
    }),
    [],
  )

  return useMemo(
    () => ({
      gameState,
      ...actions,
    }),
    [actions, gameState],
  )
}
