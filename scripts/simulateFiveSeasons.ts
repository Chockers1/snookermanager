import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CALENDAR_MODEL, getCalendarModelSummary, getEventVolumeThresholdForBand } from './calendarModel'
import {
  getConfiguredFieldSizeLabel,
  getExpectedFieldSizeLabel,
  getFrameFormatSummary,
  getRoundCount,
  getRoundStructureSummary,
  getTournamentResultExpectation,
  isProfessionalFormat,
  isYouthFormat,
  normalizeTournamentRoundLabel,
  resolveTournamentFormat,
} from '../src/data/tournamentFormats'
import type { Chalk, Coach, Cue, Tip, Tournament } from '../src/types/game'
import { buildCanonicalTournamentResult, type CanonicalTournamentResult, isNonCompetitiveTournamentResult } from '../src/utils/canonicalTournamentResult'
import {
  acceptSponsorState,
  advanceWeekState,
  applyTrainingPlanState,
  buyChalkState,
  buyCueState,
  buyTipState,
  createNewCareerState,
  createStarterState,
  enterTournamentState,
  fireCoachState,
  getTournamentEntryAccess,
  getTournamentEntryCashRequirement,
  getTournamentEntryRound,
  hireCoachState,
  scheduleTreatmentState,
  type GameState,
  type TournamentRound,
} from '../src/hooks/useGameState'
import {
  chalkCatalog,
  coachCatalog,
  createPlayerBackgroundCatalog,
  createPlayerIdentitySeed,
  createPlayerSliderCatalog,
  createPlayerStartingLevelCatalog,
  cueMarketplaceCatalog,
  tableSetupCatalog,
  tipCatalog,
} from '../src/data/gameContent'
import { getCoachAvailability, getCoachContractOptions } from '../src/utils/coachMarket'
import {
  calculateAverage,
  calculateMatchStrength,
  calculateOverallRating,
  calculatePotentialRating,
  calculateTechnicalAverage,
} from '../src/utils/calculations'
import { getExpectedWinRateBand, getExpectedWinRateTier, getOpponentRankBand, type ExpectedWinRateTier, type OpponentRankBand } from '../src/utils/matchOutcomeModel'
import { getValidatedStartingLevel } from '../src/utils/newCareerConfig'

type CircuitSnapshot = Record<'world' | 'youth' | 'amateur' | 'qTour' | 'qSchool' | 'senior', string[]>

type SeasonPlayerSnapshot = {
  age: number
  careerPhase: string
  competitiveStatus: string
  careerStage: string
  rankingLabel: string
  worldRanking: number | null | undefined
  amateurRanking: number | null | undefined
  seniorRanking: number | null | undefined
  cash: number
  weeklyCashFlow: number
  confidence: number
  fatigue: number
  morale: number
  reputation: number
  overall: number
  potential: number
}

type CircuitMovement = {
  count: number
  entrants: string[]
  leavers: string[]
}

type TournamentMatchMetrics = {
  tournamentId?: string
  playerRanking?: number | null
  opponentRanking?: number | null
  winProbability?: number | null
  playerStrength?: number | null
  opponentStrength?: number | null
  opponentRankBand?: string | null
  tournamentClass?: string | null
}

type OpponentRankBandCounts = Record<OpponentRankBand, number>

type FinanceBreakdown = {
  prizeMoney: number
  sponsorIncome: number
  coachingStaffCosts: number
  facilityCosts: number
  equipmentMaintenance: number
  tournamentEntryFees: number
  travelHotelCosts: number
  treatmentRecoveryCosts: number
  other: number
}

type PathwaySnapshot = {
  worldRank: number | null
  oneYearRank: number | null
  amateurRank: number | null
  qTourRank: number | null
  qSchoolRank: number | null
  hasTourCard: boolean
  cardSource: string | null
  currentYear: number
  yearsRemaining: number
  expiresAfterSeason: string | null
  currentTier: string
  tourSurvivalStatus: string
  qTourEligibilityScore: number
  qTourTop2Streak: number
  qTourPlayOffEligible: boolean
  qSchoolEligibilityScore: number
  qSchoolCampaignEligible: boolean
  qSchoolSeededCampaign: boolean
  qSchoolDirectPlayoffEligible: boolean
  qSchoolEligibilitySeasonsRemaining: number
  qSchoolCooldownSeasonsRemaining: number
  qSchoolQualifiedBy: string | null
}

type SupportSetupSnapshot = {
  coachCount: number
  coachWeeklyCost: number
  coachNames: string[]
  cueName: string | null
  chalkName: string | null
  tipName: string | null
  cueBonus: number
  preparationBonus: number
}

type TourCardMovementSummary = {
  holdersAtSeasonOpen: number
  holdersAtNextSeasonOpen: number
  gainedCount: number
  lostCount: number
  gainedNames: string[]
  lostNames: string[]
}

type SeasonReport = {
  season: string
  dates: {
    startedOn: string
    endedOn: string
  }
  playerAtSeasonOpen: SeasonPlayerSnapshot
  playerAtNextSeasonOpen: SeasonPlayerSnapshot
  finance: {
    openingCash: number
    closingCash: number
    cashDelta: number
    weeklyCashFlow: number
    prizeMoney: number
    rankingPoints: number
    breakdown: FinanceBreakdown
  }
  performance: {
    openingRanking: number
    openingRankingLabel: string
    closingRanking: number
    closingRankingLabel: string
    matchesPlayed: number
    wins: number
    losses: number
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
  circuits: {
    sizes: Record<keyof CircuitSnapshot, number>
    movements: Record<keyof CircuitSnapshot, CircuitMovement>
    playerMembership: Record<keyof CircuitSnapshot, boolean>
  }
  pathway: {
    seasonOpen: PathwaySnapshot
    nextSeasonOpen: PathwaySnapshot
  }
  support: {
    seasonOpen: SupportSetupSnapshot
    nextSeasonOpen: SupportSetupSnapshot
  }
  tourCardMovement: TourCardMovementSummary
  worldRoster: {
    totalRecords: number
    tourCardHolders: number
    under21Players: number
    seniorEligiblePlayers: number
    includesPlayerRecord: boolean
  }
  calendar: {
    summary: SeasonCalendarSummary
    validationWarnings: string[]
    entries: SeasonCalendarAuditEntry[]
  }
  playerEntries: PlayerEventSummary
  recordByLevel: CompetitionRecord[]
  recordByPhase: CareerPhaseRecord[]
  matchCountAudit: HumanMatchCountAuditEntry[]
  tournaments: Array<{
    tournamentId: string
    formatId: string | null
    canonicalResult: CanonicalTournamentResult
    name: string
    type: string
    tournamentClass: string
    reportingClass: string
    levelBucket: CompetitionLevelKey
    result: string
    matchesPlayed: number
    wins: number
    losses: number
    prizeMoney: number
    rankingPoints: number
    startDate: string
    averageOpponentStrength: number | null
    averagePlayerStrength: number | null
    averageWinProbability: number | null
    averageOpponentRanking: number | null
    opponentRankBandCounts: OpponentRankBandCounts
    actualWinRate: number
    winRateVsExpected: number | null
    isRankingEvent: boolean
    isMajor: boolean
    isQualifier: boolean
    isWorldMainDraw: boolean
    titleAwarded: boolean
    countedInTotalRecord: boolean
    countedInProRecord: boolean
    countedInRankingRecord: boolean
    countedInRankingQualifierRecord: boolean
    countedInRankingMainDrawRecord: boolean
    countedInRankingQuarterFinalPlusRecord: boolean
    countedInRankingFinalRecord: boolean
    countedInTotalTitleRecord: boolean
    countedInRankingTitleRecord: boolean
    countedInMajorTitleRecord: boolean
    countedInWorldTitleRecord: boolean
  }>
}

type SimulationReport = {
  generatedAt: string
  scenario: string
  seasonsRequested: number
  seasonsCompleted: number
  weeksSimulated: number
  tournamentsEntered: number
  issues: string[]
  balanceWarnings: string[]
  finalPlayer: SeasonPlayerSnapshot
  supportMetrics: SupportProfileMetrics | null
  statusIntegrityAudit: StatusIntegrityAudit
  seasons: SeasonReport[]
}

type CompetitionLevelKey =
  | 'overall'
  | 'youth'
  | 'amateur'
  | 'qTour'
  | 'qSchool'
  | 'rookieBottomQualifiers'
  | 'proQualifying'
  | 'rankingEvents'
  | 'majors'
  | 'worldQualifying'
  | 'worldMainDraw'
  | 'playersSeries'
  | 'invitationals'
  | 'senior'
  | 'exhibition'

type CareerPhaseKey =
  | 'Youth phase'
  | 'Amateur phase'
  | 'Q Tour phase'
  | 'Rookie Pro phase'
  | 'Established Pro phase'
  | 'Veteran phase'
  | 'Senior phase'
  | 'Other phase'

type CompetitionRecord = {
  key: CompetitionLevelKey
  label: string
  eventsEntered: number
  matches: number
  wins: number
  losses: number
  draws: number
  winPercentage: number
  titles: number
  finals: number
  semiFinals: number
  quarterFinals: number
  deepRuns: number
  prizeMoney: number
  rankingPoints: number
  averageOpponentStrength: number | null
  averagePlayerStrength: number | null
  averageWinProbability: number | null
}

type CareerPhaseRecord = {
  key: CareerPhaseKey
  label: string
  seasons: number
  eventsEntered: number
  matches: number
  wins: number
  losses: number
  draws: number
  winPercentage: number
  titles: number
  rankingTitles: number
  majorTitles: number
  worldChampionshipEntries: number
  bestWorldRank: number | null
  worstWorldRank: number | null
  averageWorldRank: number | null
  prizeMoney: number
}

type HumanMatchCountAuditEntry = {
  season: string
  playerPhase: string
  playerStatus: string
  tournamentName: string
  tournamentClass: string
  reportingClass: string
  levelBucket: CompetitionLevelKey
  fieldSize: string
  roundReached: string
  expectedMatches: number
  actualMatchesAdded: number
  expectedWins: number
  actualWinsAdded: number
  expectedLosses: number
  actualLossesAdded: number
  titleAwarded: boolean
  isRankingEvent: boolean
  isMajor: boolean
  rankingMoneyAwarded: number
  rankingPointsAwarded: number
  averageOpponentStrength: number | null
  averageOpponentRanking: number | null
  averageWinProbability: number | null
  actualWinRate: number
  winRateVsExpected: number | null
  opponentRankBandCounts: OpponentRankBandCounts
  countedInTotalRecord: boolean
  countedInProRecord: boolean
  countedInRankingRecord: boolean
  countedInRankingQualifierRecord: boolean
  countedInRankingMainDrawRecord: boolean
  countedInTitleRecord: boolean
  countedInRankingTitleRecord: boolean
  countedInMajorTitleRecord: boolean
  countedInWorldTitleRecord: boolean
  warningFlags: string[]
}

type TournamentTitleSummary = {
  totalTitles: number
  rankingTitles: number
  majorTitles: number
  worldTitles: number
  invitationalTitles: number
  qTourTitles: number
  qSchoolEventWins: number
  youthAmateurTitles: number
}

type StatusIntegrityAudit = {
  finalStatus: string
  worldTitles: number
  worldChampionshipWins: number
  majorTitles: number
  rankingTitles: number
  bestTournamentResult: string
  sourceOfStatusAssignment: string
  valid: boolean
  warnings: string[]
}

type TitleCounterAuditEntry = {
  tournamentName: string
  tournamentClass: string
  reportingClass: string
  isRanking: boolean
  isMajor: boolean
  countedTotalTitle: boolean
  countedRankingTitle: boolean
  countedMajorTitle: boolean
  countedWorldTitle: boolean
  warning: string | null
}

type SnapshotRecordValue = {
  matches: number
  wins: number
  losses: number
  draws: number
  winPercentage: number
  eventsEntered: number
  titles: number
  finals: number
  prizeMoney: number
  points: number
}

type ManagedSupportProfile = 'worst' | 'middle' | 'best'

type SupportProfileConfig = {
  treatmentThreshold: number
  trainingConfidenceDelta: number
  trainingMoraleDelta: number
  trainingFatigueDelta: number
  trainingTechnicalPulse: number
  trainingMentalPulse: number
  trainingPhysicalPulse: number
  matchPrepConfidenceDelta: number
  matchPrepMoraleDelta: number
  matchPrepFatigueDelta: number
  slumpConfidenceDelta: number
  slumpMoraleDelta: number
  slumpFatigueDelta: number
  eventAmbition: number
  feeTolerance: number
}

type SupportMetricAccumulator = {
  weeksObserved: number
  fatigueSum: number
  confidenceSum: number
  strengthSum: number
  deciderMatches: number
  deciderWins: number
  deciderPressureSum: number
}

type SupportProfileMetrics = {
  supportProfile: ManagedSupportProfile
  expectedWinRateTier: ExpectedWinRateTier
  expectedWinRateBandMin: number
  expectedWinRateBandNormal: number
  expectedWinRateBandElite: number
  finalCareerPhase: string
  finalCompetitiveStatus: string
  finalWorldRank: number | null | undefined
  finalCash: number
  overall: number
  potential: number
  totalMatches: number
  wins: number
  losses: number
  winPercentage: number
  titles: number
  majorTitles: number
  qTourWins: number
  qSchoolEventsEntered: number
  qSchoolCampaignsEntered: number
  qSchoolMatchesWon: number
  qSchoolCardsWon: number
  tourCardsWon: number
  deepRuns: number
  finalsReached: number
  finalsWon: number
  finalWinPercentage: number
  semiFinalsReached: number
  semiFinalsWon: number
  quarterFinalPlusWinPercentage: number
  rankingFinals: number
  rankingFinalsWon: number
  rankingFinalWinPercentage: number
  averageFatigue: number
  averageConfidence: number
  averageEffectiveMatchStrength: number
  deciderWins: number
  deciderMatches: number
  deciderWinPercentage: number
  averageDeciderPressure: number
  bestTournamentResult: string
  worldChampionshipEntries: number
  bestWorldChampionshipFinish: string
  majorQuarterFinals: number
  majorSemiFinals: number
  majorFinals: number
  majorWins: number
  majorFinalWinPercentage: number
  worldFinals: number
  worldFinalsWon: number
  worldFinalWinPercentage: number
  prizeMoneyPerTournament: number
  totalSupportSpend: number
  totalEquipmentSpend: number
  totalSponsorIncome: number
  recordByLevel: CompetitionRecord[]
  recordByPhase: CareerPhaseRecord[]
}

type PlayerSnapshotRow = {
  season: string
  playerId: string
  name: string
  age: number
  nationality: string | null
  careerPhase: string
  competitiveStatus: string
  isHumanPlayer: boolean
  isOnMainTour: boolean
  isTourCardHolder: boolean
  tourCardSource: string | null
  tourCardYear: number
  yearsRemaining: number
  expiresAfterSeason: string | null
  tourSurvivalStatus: string
  seasonOpenWorldRank: number | null
  seasonCloseWorldRank: number | null
  normalizedWorldRank: number | null
  rawWorldRankBeforeCap: number | null
  worldRank: number | null
  oneYearRank: number | null
  amateurRank: number | null
  qTourRank: number | null
  qSchoolRank: number | null
  seniorRank: number | null
  previousWorldRank: number | null
  rankChange: number | null
  overall: number | null
  potential: number | null
  technicalAverage: number | null
  mentalAverage: number | null
  physicalAverage: number | null
  effectiveMatchStrength: number | null
  confidence: number | null
  fatigue: number | null
  reputation: number | null
  seasonMatches: number | null
  seasonWins: number | null
  seasonLosses: number | null
  seasonWinPercentage: number | null
  seasonTitles: number | null
  seasonMajorTitles: number | null
  seasonWorldChampionshipEntries: number | null
  seasonBestWorldChampionshipFinish: string | null
  seasonMajorQuarterFinals: number | null
  seasonMajorSemiFinals: number | null
  seasonMajorFinals: number | null
  seasonPrizeMoney: number | null
  seasonRankingPoints: number | null
  careerMatches: number | null
  careerWins: number | null
  careerLosses: number | null
  careerWinPercentage: number | null
  careerTitles: number | null
  careerMajorTitles: number | null
  careerPrizeMoney: number | null
  totalRecord: SnapshotRecordValue | null
  youthRecord: SnapshotRecordValue | null
  amateurRecord: SnapshotRecordValue | null
  qTourRecord: SnapshotRecordValue | null
  qSchoolRecord: SnapshotRecordValue | null
  proQualifierRecord: SnapshotRecordValue | null
  rankingEventRecord: SnapshotRecordValue | null
  majorRecord: SnapshotRecordValue | null
  worldQualifyingRecord: SnapshotRecordValue | null
  worldMainDrawRecord: SnapshotRecordValue | null
  playersSeriesRecord: SnapshotRecordValue | null
  invitationalRecord: SnapshotRecordValue | null
  seniorRecord: SnapshotRecordValue | null
  exhibitionRecord: SnapshotRecordValue | null
  bestWorldRank: number | null
  bestWorldChampionshipFinish: string | null
  worldChampionshipMainDrawEligible: boolean | null
  worldChampionshipMainDrawEntered: boolean | null
  worldChampionshipQualifyingEntered: boolean | null
  reasonSkippedWorldMainDraw: string | null
  availableEventsCount: number | null
  eligibleEventsCount: number | null
  enteredEventsCount: number | null
  rankingEventsEntered: number | null
  qualifierEventsEntered: number | null
  majorEventsEntered: number | null
  invitationalsEntered: number | null
  playersSeriesEntered: number | null
  qTourEventsEntered: number | null
  qSchoolEventsEntered: number | null
  amateurEventsEntered: number | null
  youthEventsEntered: number | null
  seniorEventsEntered: number | null
  skippedEligibleEventsCount: number | null
  skippedCoreEventsCount: number | null
  skippedReasonSummary: string | null
  eventAccessBand: string
  eventVolumeBandStatus: PlayerEventVolumeBand | null
  eventVolumeWarnings: string[]
  calendarValidationWarnings: string[]
  tourCardValidAtSeasonOpen: boolean
  tourCardValidAtSeasonClose: boolean
  lifecycleCorrectionApplied: boolean
  rankCapApplied: boolean
  recentSeasonWins: number | null
  twoYearWins: number | null
  twoYearPrizeMoney: number | null
  majorFinalsLastTwoYears: number | null
  titlesLastTwoYears: number | null
  rankingDecayApplied: boolean
  stalledReason: string | null
  validTourStatus: boolean
  validEventAccess: boolean
  invalidAccessReason: string | null
  invalidStateReasons: string[]
  expectedCircuit: string
  actualCircuit: string
  warningFlags: string[]
}

type WorldChampionshipWarningDetail = {
  season: string
  seasonOpenWorldRank: number | null
  seasonCloseWorldRank: number | null
  seasonOpenStatus: string
  seasonCloseStatus: string
  hadWorldMainDrawEntry: boolean
  hadWorldQualifyingEntry: boolean
  reasonSkippedWorldMainDraw: string | null
}

type WorldAccessDebugRow = {
  season: string
  week: number
  date: string
  playerAge: number
  seasonOpenWorldRank: number | null
  seasonCloseWorldRank: number | null
  currentWeekWorldRank: number | null
  normalizedWorldRank: number | null
  rawWorldRankBeforeCap: number | null
  seasonOpenStatus: string
  currentWeekStatus: string
  seasonCloseStatus: string | null
  hasTourCard: boolean
  tourCardSource: string | null
  yearsRemaining: number
  isTop16AtSeasonOpen: boolean
  isTop16AtWorldEntryDeadline: boolean
  isWorldMainDrawEligible: boolean
  hasWorldMainDrawLock: boolean
  hasWorldQualifierLock: boolean
  lockCreatedWeek: number | null
  lockRepairedWeek: number | null
  lockLostWeek: number | null
  tournamentId: string | null
  tournamentName: string | null
  tournamentClass: string | null
  accessBand: string | null
  entryRoute: string
  selectedForEntry: boolean
  skippedReason: string | null
  highCostFilterApplied: boolean
  unavailableReason: string | null
  finalTournamentResultRecorded: boolean
}

type WorldAccessDebugRecord = {
  target: string
  scenario: string
  reportBaseName: string
  season: string
  rows: WorldAccessDebugRow[]
}

type WorldAccessDebugStore = Record<string, WorldAccessDebugRecord>

type TournamentSelectionDecisionReason =
  | 'protected-world'
  | 'elite-hosted'
  | 'ranking-volume-floor'
  | 'main-tour-volume-floor'
  | 'young-support'
  | 'best-score'
  | 'none'

type TournamentSelectionCandidateAnalysis = {
  tournament: Tournament
  classification: TournamentClassification
  score: number
  budgetCost: number
  inSchedulingWindow: boolean
  isAffordable: boolean
  isCoreTracked: boolean
  classificationError: boolean
  fatigueCost: number
  expectedPrize: number
}

type TournamentSelectionAnalysis = {
  currentWorldRank: number
  schedulingWindowDays: number
  seasonMainTourEvents: number
  seasonCoreRankingEvents: number
  expectedMainTourMinimum: number
  targetCoreRankingEvents: number
  selectedTournament: Tournament | null
  selectedReason: TournamentSelectionDecisionReason
  candidates: TournamentSelectionCandidateAnalysis[]
  affordableAvailable: TournamentSelectionCandidateAnalysis[]
}

type EliteEventSelectionDebugRow = {
  season: string
  week: number
  date: string
  playerAge: number
  seasonOpenWorldRank: number | null
  seasonCloseWorldRank: number | null
  currentWeekWorldRank: number | null
  seasonOpenStatus: string
  currentWeekStatus: string
  seasonCloseStatus: string | null
  confidence: number
  fatigue: number
  unavailableStatus: string
  tournamentId: string
  tournamentName: string
  tournamentClass: string
  reportingClass: string
  eventDate: string
  isRankingEvent: boolean
  isMajor: boolean
  isInvitational: boolean
  isPlayersSeries: boolean
  isCoreProEvent: boolean
  inSchedulingWindow: boolean
  eventPriorityScore: number
  fatigueCost: number
  expectedPrize: number
  rankingValue: number
  selectedForEntry: boolean
  selectedTournamentName: string | null
  selectedReason: TournamentSelectionDecisionReason
  enteredEventCountAtDecision: number
  rankingEventCountAtDecision: number
  expectedMainTourMinimum: number
  targetCoreRankingEvents: number
  skippedBecauseAlreadyRankOne: boolean
  skippedBecauseEventSelectorHitMaxEventsCap: boolean
  skippedBecauseRestFatigueRule: boolean
  skippedBecauseClassificationError: boolean
  reasonSkipped: string | null
  finalTournamentResultRecorded: boolean
}

type EliteEventSelectionDebugRecord = {
  target: string
  scenario: string
  reportBaseName: string
  season: string
  rows: EliteEventSelectionDebugRow[]
}

type EliteEventSelectionDebugStore = Record<string, EliteEventSelectionDebugRecord>

type SeasonAuditSummary = {
  season: string
  activeMainTourPlayers: number
  activeAiAverageSeasonMatches: number
  activeAiZeroMatchPlayers: number
  newAiPlayers: number
  aiOverallMovers: number
  aiPotentialMovers: number
  top16AverageAge: number
  top16AverageOverall: number
  top16AveragePotential: number
  top64AverageAge: number
  top64AverageOverall: number
  top64AveragePotential: number
  gainedTourCards: string[]
  lostTourCards: string[]
  returnedViaQSchool: string[]
  movedToQTour: string[]
  movedToSenior: string[]
  biggestClimbers: string[]
  biggestFallers: string[]
  youngestTop16Player: string | null
  oldestTop16Player: string | null
  topProspects: string[]
  stalledProspects: string[]
  overperformers: string[]
  invalidPlayers: string[]
  warnings: string[]
}

type TournamentClassification = {
  tournamentClass: string
  reportingClass: string
  eligibleStatuses: string
  expectedEntryBands: string
  isRankingEvent: boolean
  isInvitational: boolean
  isQualifier: boolean
  isQualifyingEvent: boolean
  isMajor: boolean
  isWorldChampionship: boolean
  isWorldChampionshipEvent: boolean
  isWorldMainDraw: boolean
  isWorldQualifying: boolean
  isEliteInvitational: boolean
  isPlayersSeries: boolean
  isHomeNations: boolean
  isQTour: boolean
  isQSchool: boolean
  isAmateur: boolean
  isYouth: boolean
  isSenior: boolean
  isExhibition: boolean
  isAmateurYouth: boolean
  isSeniorExhibition: boolean
  isMainTourEvent: boolean
}

type SeasonCalendarSummary = {
  totalEventsAvailable: number
  rankingEvents: number
  qualifyingEvents: number
  majors: number
  worldChampionshipEvents: number
  eliteInvitationals: number
  playersSeriesEvents: number
  qTourEvents: number
  qSchoolEvents: number
  amateurYouthEvents: number
  seniorExhibitionEvents: number
}

type PlayerEventSummary = {
  totalTournamentsEntered: number
  rankingEventsEntered: number
  qualifiersEntered: number
  majorsEntered: number
  worldChampionshipMainDrawEntered: boolean
  worldChampionshipQualifyingEntered: boolean
  eliteInvitationalsEntered: number
  playersSeriesEntered: number
  qTourEventsEntered: number
  qSchoolEventsEntered: number
  amateurEventsEntered: number
  youthEventsEntered: number
  seniorEventsEntered: number
}

type SeasonCalendarAuditEntry = {
  tournamentId: string
  formatId: string
  season: string
  week: number | null
  date: string
  tournamentName: string
  tournamentClass: string
  reportingClass: string
  eligibleBands: string
  eligibleStatuses: string
  expectedEntryBands: string
  configuredFieldSize: string
  expectedFieldSize: string
  actualEntrantsTracked: number | null
  formatValid: boolean
  formatValidationStatus: string
  roundStructure: string
  frameFormat: string
  roundCount: number
  seedingModel: string
  rankingImpact: string
  pathwayImpact: string
  humanEntered: boolean
  humanEntryRoute: string
  aiEntrantsTracked: number | null
  winner: string | null
  prizeFund: number
  rankingValue: number
  validationStatus: string
}

type PlayerEventVolumeBand = 'too low' | 'normal' | 'too high'

type AccessBandVolumeSummary = {
  season: string
  accessBand: string
  playerCount: number
  averageEventsEntered: number
  minEventsEntered: number
  maxEventsEntered: number
  averageMatchesPlayed: number
  averageRankingEventsEntered: number
  averageQualifiersEntered: number
  averageInvitationalsEntered: number
  averageQTourQSchoolEventsEntered: number
  warnings: string[]
}

type TournamentHistorySnapshot = GameState['history']['tournamentHistory'][number]

type DerivedEventVolumeMetrics = {
  availableEventsCount: number
  eligibleEventsCount: number
  enteredEventsCount: number
  rankingEventsEntered: number
  qualifierEventsEntered: number
  majorEventsEntered: number
  worldChampionshipMainDrawEntered: boolean
  worldChampionshipQualifyingEntered: boolean
  invitationalsEntered: number
  playersSeriesEntered: number
  qTourEventsEntered: number
  qSchoolEventsEntered: number
  amateurEventsEntered: number
  youthEventsEntered: number
  seniorEventsEntered: number
  skippedEligibleEventsCount: number
  skippedCoreEventsCount: number
  skippedReasonSummary: string | null
  accessBand: string
  eventVolumeBandStatus: PlayerEventVolumeBand
  eventVolumeWarnings: string[]
}

const TOURNAMENT_ROUND_ORDER = ['Last 16', 'Quarter Final', 'Semi Final', 'Final'] as const
const ACCESS_BAND_ORDER = ['Top 16', 'Top 32', 'Top 64', 'Bottom Tour 65-128', 'Rookie Pro', 'Q Tour', 'Q School', 'Amateur', 'Youth', 'Senior/Legend'] as const
const COMPETITION_LEVEL_ORDER: CompetitionLevelKey[] = [
  'overall',
  'youth',
  'amateur',
  'qTour',
  'qSchool',
  'rookieBottomQualifiers',
  'proQualifying',
  'rankingEvents',
  'majors',
  'worldQualifying',
  'worldMainDraw',
  'playersSeries',
  'invitationals',
  'senior',
  'exhibition',
]
const CAREER_PHASE_ORDER: CareerPhaseKey[] = [
  'Youth phase',
  'Amateur phase',
  'Q Tour phase',
  'Rookie Pro phase',
  'Established Pro phase',
  'Veteran phase',
  'Senior phase',
  'Other phase',
]

function getCompetitionLevelLabel(level: CompetitionLevelKey) {
  switch (level) {
    case 'overall':
      return 'Overall'
    case 'youth':
      return 'Youth'
    case 'amateur':
      return 'Amateur'
    case 'qTour':
      return 'Q Tour'
    case 'qSchool':
      return 'Q School'
    case 'rookieBottomQualifiers':
      return 'Rookie / Bottom Tour qualifiers'
    case 'proQualifying':
      return 'Professional qualifying'
    case 'rankingEvents':
      return 'Ranking Events'
    case 'majors':
      return 'Majors'
    case 'worldQualifying':
      return 'World Qualifying'
    case 'worldMainDraw':
      return 'World Main Draw'
    case 'playersSeries':
      return 'Players Series'
    case 'invitationals':
      return 'Invitationals'
    case 'senior':
      return 'Senior / Legends'
    case 'exhibition':
      return 'Exhibition / Pro-Am'
  }
}

function getCompetitionLevelLabelForSnapshot(level: CompetitionLevelKey) {
  switch (level) {
    case 'overall':
      return 'totalRecord'
    case 'youth':
      return 'youthRecord'
    case 'amateur':
      return 'amateurRecord'
    case 'qTour':
      return 'qTourRecord'
    case 'qSchool':
      return 'qSchoolRecord'
    case 'rookieBottomQualifiers':
    case 'proQualifying':
      return 'proQualifierRecord'
    case 'rankingEvents':
      return 'rankingEventRecord'
    case 'majors':
      return 'majorRecord'
    case 'worldQualifying':
      return 'worldQualifyingRecord'
    case 'worldMainDraw':
      return 'worldMainDrawRecord'
    case 'playersSeries':
      return 'playersSeriesRecord'
    case 'invitationals':
      return 'invitationalRecord'
    case 'senior':
      return 'seniorRecord'
    case 'exhibition':
      return 'exhibitionRecord'
  }
}

function getCareerPhaseKey(phase: string | null | undefined): CareerPhaseKey {
  const value = (phase ?? '').toLowerCase()
  if (value.includes('youth')) return 'Youth phase'
  if (value.includes('amateur')) return 'Amateur phase'
  if (value.includes('q tour')) return 'Q Tour phase'
  if (value.includes('rookie')) return 'Rookie Pro phase'
  if (value.includes('established')) return 'Established Pro phase'
  if (value.includes('veteran')) return 'Veteran phase'
  if (value.includes('senior')) return 'Senior phase'
  return 'Other phase'
}

function createEmptyCompetitionRecord(level: CompetitionLevelKey): CompetitionRecord {
  return {
    key: level,
    label: getCompetitionLevelLabel(level),
    eventsEntered: 0,
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winPercentage: 0,
    titles: 0,
    finals: 0,
    semiFinals: 0,
    quarterFinals: 0,
    deepRuns: 0,
    prizeMoney: 0,
    rankingPoints: 0,
    averageOpponentStrength: null,
    averagePlayerStrength: null,
    averageWinProbability: null,
  }
}

function createEmptyCareerPhaseRecord(phase: CareerPhaseKey): CareerPhaseRecord {
  return {
    key: phase,
    label: phase,
    seasons: 0,
    eventsEntered: 0,
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winPercentage: 0,
    titles: 0,
    rankingTitles: 0,
    majorTitles: 0,
    worldChampionshipEntries: 0,
    bestWorldRank: null,
    worstWorldRank: null,
    averageWorldRank: null,
    prizeMoney: 0,
  }
}

function averageNullable(values: Array<number | null | undefined>) {
  const filtered = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (filtered.length === 0) return null
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length
}

function countsAsTotalTitle(classification: TournamentClassification, levelBucket: CompetitionLevelKey) {
  if (classification.isQualifyingEvent) return false
  if (classification.isQSchool) return false
  if (levelBucket === 'qSchool') return false
  return true
}

function countsAsRankingTitle(classification: TournamentClassification) {
  return classification.isRankingEvent && !classification.isQualifyingEvent
}

function countsAsMajorTitle(classification: TournamentClassification) {
  return classification.isMajor && !classification.isQualifyingEvent
}

function buildTournamentSubsetRecord(
  label: string,
  tournaments: SeasonReport['tournaments'],
  predicate: (tournament: SeasonReport['tournaments'][number]) => boolean,
) {
  const filtered = tournaments.filter(predicate)
  const record = createEmptyCompetitionRecord('overall')
  record.label = label

  for (const tournament of filtered) {
    record.eventsEntered += 1
    record.matches += tournament.matchesPlayed
    record.wins += tournament.wins
    record.losses += tournament.losses
    record.prizeMoney += tournament.prizeMoney
    record.rankingPoints += tournament.rankingPoints
    if (tournament.titleAwarded) record.titles += 1
    if (getSimulationTournamentResultTier(tournament) >= 4) record.finals += 1
    if (getSimulationTournamentResultTier(tournament) >= 3) record.semiFinals += 1
    if (getSimulationTournamentResultTier(tournament) >= 2) record.quarterFinals += 1
    if (getSimulationTournamentResultTier(tournament) >= 3) record.deepRuns += 1
  }

  record.winPercentage = record.matches > 0 ? (record.wins / record.matches) * 100 : 0
  record.averageOpponentStrength = averageNullable(filtered.map((tournament) => tournament.averageOpponentStrength))
  record.averagePlayerStrength = averageNullable(filtered.map((tournament) => tournament.averagePlayerStrength))
  record.averageWinProbability = averageNullable(filtered.map((tournament) => tournament.averageWinProbability))
  return record
}

function buildTitleSummary(tournaments: SeasonReport['tournaments']): TournamentTitleSummary {
  return tournaments.reduce<TournamentTitleSummary>((summary, tournament) => ({
    totalTitles: summary.totalTitles + (tournament.countedInTotalTitleRecord ? 1 : 0),
    rankingTitles: summary.rankingTitles + (tournament.countedInRankingTitleRecord ? 1 : 0),
    majorTitles: summary.majorTitles + (tournament.countedInMajorTitleRecord ? 1 : 0),
    worldTitles: summary.worldTitles + (tournament.countedInWorldTitleRecord ? 1 : 0),
    invitationalTitles: summary.invitationalTitles + (tournament.levelBucket === 'invitationals' && tournament.countedInTotalTitleRecord ? 1 : 0),
    qTourTitles: summary.qTourTitles + (tournament.levelBucket === 'qTour' && tournament.countedInTotalTitleRecord ? 1 : 0),
    qSchoolEventWins: summary.qSchoolEventWins + (tournament.levelBucket === 'qSchool' && tournament.titleAwarded ? 1 : 0),
    youthAmateurTitles: summary.youthAmateurTitles + ((tournament.levelBucket === 'youth' || tournament.levelBucket === 'amateur') && tournament.countedInTotalTitleRecord ? 1 : 0),
  }), {
    totalTitles: 0,
    rankingTitles: 0,
    majorTitles: 0,
    worldTitles: 0,
    invitationalTitles: 0,
    qTourTitles: 0,
    qSchoolEventWins: 0,
    youthAmateurTitles: 0,
  })
}

function buildTitleCounterAuditEntries(tournaments: SeasonReport['tournaments']): TitleCounterAuditEntry[] {
  return tournaments
    .filter((tournament) => tournament.titleAwarded)
    .map((tournament) => {
      const warnings: string[] = []
      if (tournament.isMajor && !tournament.countedInMajorTitleRecord) warnings.push('major winner not counted in major titles')
      if (tournament.isRankingEvent && !tournament.isQualifier && !tournament.countedInRankingTitleRecord) warnings.push('ranking winner not counted in ranking titles')
      if (tournament.isWorldMainDraw && !tournament.countedInWorldTitleRecord) warnings.push('World winner not counted in world titles')
      if (tournament.isQualifier && tournament.countedInTotalTitleRecord) warnings.push('qualifier winner counted as normal title')
      if (tournament.levelBucket === 'qSchool' && tournament.countedInTotalTitleRecord) warnings.push('Q School win counted as normal title')
      return {
        tournamentName: tournament.name,
        tournamentClass: tournament.tournamentClass,
        reportingClass: tournament.reportingClass,
        isRanking: tournament.isRankingEvent,
        isMajor: tournament.isMajor,
        countedTotalTitle: tournament.countedInTotalTitleRecord,
        countedRankingTitle: tournament.countedInRankingTitleRecord,
        countedMajorTitle: tournament.countedInMajorTitleRecord,
        countedWorldTitle: tournament.countedInWorldTitleRecord,
        warning: warnings.length === 0 ? null : warnings.join('; '),
      }
    })
}

function getCompetitionLevelRecord(records: CompetitionRecord[] | null | undefined, level: CompetitionLevelKey) {
  return records?.find((record) => record.key === level) ?? createEmptyCompetitionRecord(level)
}

function getPathwayRecord(records: CompetitionRecord[] | null | undefined) {
  return combineCompetitionRecords('Pathway', records, ['youth', 'amateur', 'qTour', 'qSchool'])
}

function combineCompetitionRecords(label: string, records: CompetitionRecord[] | null | undefined, keys: CompetitionLevelKey[]) {
  const combined = createEmptyCompetitionRecord('overall')
  combined.label = label
  const selected = keys.map((key) => getCompetitionLevelRecord(records, key))
  for (const record of selected) {
    combined.eventsEntered += record.eventsEntered
    combined.matches += record.matches
    combined.wins += record.wins
    combined.losses += record.losses
    combined.draws += record.draws
    combined.titles += record.titles
    combined.finals += record.finals
    combined.semiFinals += record.semiFinals
    combined.quarterFinals += record.quarterFinals
    combined.deepRuns += record.deepRuns
    combined.prizeMoney += record.prizeMoney
    combined.rankingPoints += record.rankingPoints
  }
  combined.winPercentage = combined.matches > 0 ? (combined.wins / combined.matches) * 100 : 0
  combined.averageOpponentStrength = averageNullable(selected.map((record) => record.averageOpponentStrength))
  combined.averagePlayerStrength = averageNullable(selected.map((record) => record.averagePlayerStrength))
  combined.averageWinProbability = averageNullable(selected.map((record) => record.averageWinProbability))
  return combined
}

function toSnapshotRecordValue(record: CompetitionRecord | null): SnapshotRecordValue | null {
  if (!record) return null
  return {
    matches: record.matches,
    wins: record.wins,
    losses: record.losses,
    draws: record.draws,
    winPercentage: record.winPercentage,
    eventsEntered: record.eventsEntered,
    titles: record.titles,
    finals: record.finals,
    prizeMoney: record.prizeMoney,
    points: record.rankingPoints,
  }
}

function addDaysToDateString(dateString: string, days: number) {
  const nextDate = new Date(dateString)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate.toISOString().slice(0, 10)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..')
const reportsDir = path.join(workspaceRoot, 'docs', 'reports')
const playerSnapshotsDir = path.join(reportsDir, 'player-snapshots')
const worldAccessDebugPath = path.join(reportsDir, 'world-access-debug.md')
const worldAccessDebugJsonPath = path.join(reportsDir, 'world-access-debug.json')
const eliteEventSelectionDebugPath = path.join(reportsDir, 'elite-event-selection-debug.md')
const eliteEventSelectionDebugJsonPath = path.join(reportsDir, 'elite-event-selection-debug.json')

const WORLD_ACCESS_DEBUG_TARGETS = [
  {
    reportBaseName: '30-season-managed-youth-14-middle-support-simulation',
    season: '2050/51',
    label: 'middle 2050/51',
  },
  {
    reportBaseName: '30-season-managed-youth-14-max-support-simulation',
    season: '2034/35',
    label: 'max 2034/35',
  },
] as const

const SUPPORT_PROFILE_CONFIGS: Record<ManagedSupportProfile, SupportProfileConfig> = {
  worst: {
    treatmentThreshold: 82,
    trainingConfidenceDelta: -1,
    trainingMoraleDelta: -1,
    trainingFatigueDelta: 2,
    trainingTechnicalPulse: 34,
    trainingMentalPulse: 48,
    trainingPhysicalPulse: 44,
    matchPrepConfidenceDelta: -3,
    matchPrepMoraleDelta: -1,
    matchPrepFatigueDelta: 3,
    slumpConfidenceDelta: -2,
    slumpMoraleDelta: -2,
    slumpFatigueDelta: 2,
    eventAmbition: -18,
    feeTolerance: 0.12,
  },
  middle: {
    treatmentThreshold: 76,
    trainingConfidenceDelta: 0,
    trainingMoraleDelta: 0,
    trainingFatigueDelta: 0,
    trainingTechnicalPulse: 22,
    trainingMentalPulse: 30,
    trainingPhysicalPulse: 28,
    matchPrepConfidenceDelta: 0,
    matchPrepMoraleDelta: 0,
    matchPrepFatigueDelta: 0,
    slumpConfidenceDelta: 0,
    slumpMoraleDelta: 0,
    slumpFatigueDelta: 0,
    eventAmbition: 0,
    feeTolerance: 0.18,
  },
  best: {
    treatmentThreshold: 68,
    trainingConfidenceDelta: 2,
    trainingMoraleDelta: 1,
    trainingFatigueDelta: -2,
    trainingTechnicalPulse: 12,
    trainingMentalPulse: 16,
    trainingPhysicalPulse: 14,
    matchPrepConfidenceDelta: 4,
    matchPrepMoraleDelta: 2,
    matchPrepFatigueDelta: -4,
    slumpConfidenceDelta: 2,
    slumpMoraleDelta: 2,
    slumpFatigueDelta: -2,
    eventAmbition: 14,
    feeTolerance: 0.4,
  },
}

function clampNumber(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function getSupportProfileDisplayName(profile: ManagedSupportProfile) {
  if (profile === 'worst') return 'min'
  if (profile === 'best') return 'max'
  return 'middle'
}

function getSupportProfileDescription(profile: ManagedSupportProfile) {
  return `${getSupportProfileDisplayName(profile)} coaching/equipment impact`
}

function createSupportMetricAccumulator(): SupportMetricAccumulator {
  return {
    weeksObserved: 0,
    fatigueSum: 0,
    confidenceSum: 0,
    strengthSum: 0,
    deciderMatches: 0,
    deciderWins: 0,
    deciderPressureSum: 0,
  }
}

const OPPONENT_RANK_BANDS: OpponentRankBand[] = ['Top 16', 'Top 32', 'Top 64', '65-128', 'Q Tour/amateur', 'youth']

function createEmptyOpponentRankBandCounts(): OpponentRankBandCounts {
  return {
    'Top 16': 0,
    'Top 32': 0,
    'Top 64': 0,
    '65-128': 0,
    'Q Tour/amateur': 0,
    youth: 0,
  }
}

function countOpponentRankBands(matches: TournamentMatchMetrics[]) {
  const counts = createEmptyOpponentRankBandCounts()

  for (const match of matches) {
    const band = (match.opponentRankBand as OpponentRankBand | null) ?? getOpponentRankBand(match.opponentRanking, match.tournamentClass)
    counts[band] += 1
  }

  return counts
}

function getCurrentCueBonus(state: GameState) {
  if (!state.equipment.currentCueId) return 0

  const cue = cueMarketplaceCatalog.find((item) => item.id === state.equipment.currentCueId)
  if (!cue) return 0

  const cueState = state.equipment.cueStates[cue.id]
  const intrinsicBonus = Object.values(cue.bonuses).reduce((sum, value) => sum + Number(value || 0), 0)
  const condition = typeof cueState?.condition === 'number'
    ? cueState.condition
    : typeof cue.condition === 'number'
      ? cue.condition
      : 75
  const conditionModifier = Math.round((condition - 75) / 5)
  return Math.round(intrinsicBonus) + conditionModifier
}

function getEquipmentPreparationBonus(state: GameState) {
  const cue = state.equipment.currentCueId
    ? cueMarketplaceCatalog.find((item) => item.id === state.equipment.currentCueId) ?? null
    : null
  const chalk = state.equipment.currentChalkId
    ? chalkCatalog.find((item) => item.id === state.equipment.currentChalkId) ?? null
    : null
  const tip = state.equipment.currentTipId
    ? tipCatalog.find((item) => item.id === state.equipment.currentTipId) ?? null
    : null

  const cueScore = cue ? getCueScore(cue) / 18 : 0
  const chalkScore = chalk ? getChalkScore(chalk) / 12 : 0
  const tipScore = tip ? getTipScore(tip) / 10 : 0
  const blendedReadiness = cueScore * 0.5 + chalkScore * 0.25 + tipScore * 0.25

  return clampNumber(Math.round((blendedReadiness - 26) / 3), -2, 5)
}

function calculateEffectiveMatchStrength(state: GameState) {
  const technical = calculateTechnicalAverage(state.attributes.technical)
  const mental = calculateAverage(Object.values(state.attributes.mental))
  const physical = calculateAverage(Object.values(state.attributes.physical))

  const strength = calculateMatchStrength({
    technical,
    mental,
    physical,
    confidence: state.player.confidence,
    fatigue: state.player.fatigue,
    equipmentBonus: getCurrentCueBonus(state),
  })

  return Number.isFinite(strength) ? strength : 0
}

function bumpAttribute(group: Record<string, number>, key: string, delta: number) {
  if (!(key in group)) return
  group[key] = clampNumber(group[key] + delta, 1, 99)
}

function getVeteranSupportOverallCeiling(age: number) {
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

function canApplySupportAttributePulse(state: GameState) {
  if (state.player.age < 35) return true

  const overall = calculateOverallRating({
    attributes: state.attributes,
    personalityTraits: state.player.personalityTraits,
    playingStyle: state.player.playingStyle,
  })

  return overall < getVeteranSupportOverallCeiling(state.player.age) - 1
}

function applySupportTrainingPulse(state: GameState, profile: ManagedSupportProfile) {
  const config = SUPPORT_PROFILE_CONFIGS[profile]
  if (state.trainingAppliedWeek !== state.week) {
    return state
  }
  if (!canApplySupportAttributePulse(state)) {
    return state
  }

  const technicalKeys = ['Cue Ball Control', 'Break Building', 'Consistency', 'Safety Play', 'Long Potting']
  const mentalKeys = ['Focus', 'Composure', 'Resilience', 'Professionalism', 'Big Match Nerve']
  const physicalKeys = ['Stamina', 'Recovery Rate', 'Balance', 'Hand Steadiness', 'Shoulder Health']
  const weekSeed = state.week + state.player.age * 3
  const nextAttributes = {
    technical: { ...state.attributes.technical },
    mental: { ...state.attributes.mental },
    physical: { ...state.attributes.physical },
  }

  let changed = false
  if (weekSeed % config.trainingTechnicalPulse === 0) {
    bumpAttribute(nextAttributes.technical, technicalKeys[weekSeed % technicalKeys.length], 1)
    changed = true
  }
  if (weekSeed % config.trainingMentalPulse === 0) {
    bumpAttribute(nextAttributes.mental, mentalKeys[(weekSeed + 1) % mentalKeys.length], 1)
    changed = true
  }
  if (weekSeed % config.trainingPhysicalPulse === 0) {
    bumpAttribute(nextAttributes.physical, physicalKeys[(weekSeed + 2) % physicalKeys.length], 1)
    changed = true
  }

  if (!changed) {
    return state
  }

  return {
    ...state,
    attributes: nextAttributes,
  }
}

function applySupportProfileState(state: GameState, profile: ManagedSupportProfile) {
  const config = SUPPORT_PROFILE_CONFIGS[profile]
  const enteredMatchWeekTournament = state.tournaments.find(
    (tournament) => tournament.status === 'Entered' && daysUntil(tournament.startDate, state.currentDate) <= 7,
  ) ?? null
  const hasMatchWeek = enteredMatchWeekTournament != null
  const inSlump = state.player.form.filter((result) => result === 'L').length >= 3
    || state.player.confidence < 56
    || state.player.morale < 60
  const equipmentBonus = hasMatchWeek ? getEquipmentPreparationBonus(state) : 0

  let nextState = applySupportTrainingPulse(state, profile)
  const nextPlayer = { ...nextState.player }

  if (nextState.trainingAppliedWeek === nextState.week) {
    nextPlayer.confidence = clampNumber(nextPlayer.confidence + config.trainingConfidenceDelta, 25, 99)
    nextPlayer.morale = clampNumber(nextPlayer.morale + config.trainingMoraleDelta, 25, 99)
    nextPlayer.fatigue = clampNumber(nextPlayer.fatigue + config.trainingFatigueDelta, 0, 99)
  }

  if (hasMatchWeek) {
    nextPlayer.confidence = clampNumber(nextPlayer.confidence + config.matchPrepConfidenceDelta + equipmentBonus, 25, 99)
    nextPlayer.morale = clampNumber(nextPlayer.morale + config.matchPrepMoraleDelta + Math.max(0, Math.floor(equipmentBonus / 2)), 25, 99)
    nextPlayer.fatigue = clampNumber(nextPlayer.fatigue + config.matchPrepFatigueDelta - Math.max(0, equipmentBonus), 0, 99)
  }

  if (profile === 'middle' && enteredMatchWeekTournament) {
    const highPressureWeek = isCoreMajorTournament(enteredMatchWeekTournament) || /tour championship|champion of champions|world grand prix|players championship/i.test(enteredMatchWeekTournament.name)
    const pressureResistance = ((nextState.attributes.mental['Big Match Nerve'] ?? 50) + (nextState.attributes.mental.Composure ?? 50)) / 2
    const currentWorldRank = nextState.careerSystems.pro.worldRank ?? nextState.player.worldRanking ?? 999

    if (highPressureWeek && pressureResistance < 90) {
      nextPlayer.confidence = clampNumber(nextPlayer.confidence - 2, 25, 99)
      nextPlayer.morale = clampNumber(nextPlayer.morale - 1, 25, 99)
      nextPlayer.fatigue = clampNumber(nextPlayer.fatigue + 2, 0, 99)
    }

    if (highPressureWeek && currentWorldRank <= 8 && pressureResistance < 95) {
      nextPlayer.confidence = clampNumber(nextPlayer.confidence - 2, 25, 99)
      nextPlayer.morale = clampNumber(nextPlayer.morale - 1, 25, 99)
      nextPlayer.fatigue = clampNumber(nextPlayer.fatigue + 2, 0, 99)
    }

    if (isWorldChampionshipTournament(enteredMatchWeekTournament) && pressureResistance < 94) {
      nextPlayer.confidence = clampNumber(nextPlayer.confidence - 2, 25, 99)
      nextPlayer.morale = clampNumber(nextPlayer.morale - 1, 25, 99)
      nextPlayer.fatigue = clampNumber(nextPlayer.fatigue + 2, 0, 99)
    }
  }

  if (inSlump) {
    nextPlayer.confidence = clampNumber(nextPlayer.confidence + config.slumpConfidenceDelta, 25, 99)
    nextPlayer.morale = clampNumber(nextPlayer.morale + config.slumpMoraleDelta, 25, 99)
    nextPlayer.fatigue = clampNumber(nextPlayer.fatigue + config.slumpFatigueDelta, 0, 99)
  }

  return {
    ...nextState,
    player: nextPlayer,
  }
}

function recordSupportSnapshot(metrics: SupportMetricAccumulator, state: GameState) {
  metrics.weeksObserved += 1
  metrics.fatigueSum += state.player.fatigue
  metrics.confidenceSum += state.player.confidence
  metrics.strengthSum += calculateEffectiveMatchStrength(state)
}

function recordMatchMetrics(metrics: SupportMetricAccumulator, previousState: GameState, nextState: GameState) {
  const latestMatch = nextState.history.matchLog[0]
  if (!latestMatch || latestMatch.id === previousState.history.matchLog[0]?.id) {
    return
  }

  if (latestMatch.wentToDecider) {
    metrics.deciderMatches += 1
    metrics.deciderPressureSum += latestMatch.pressurePeak
    if (latestMatch.result === 'Won') {
      metrics.deciderWins += 1
    }
  }
}

function getResultTierFromRoundReached(roundReached: string | null | undefined, result: string) {
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

function getSimulationTournamentResultTier(
  tournament: Pick<SeasonReport['tournaments'][number], 'name' | 'type' | 'formatId' | 'result'>,
) {
  const expectation = getTournamentResultExpectation(
    {
      name: tournament.name,
      type: tournament.type,
      eventClass: tournament.type,
      formatId: tournament.formatId ?? undefined,
    },
    tournament.result,
  )

  return getResultTierFromRoundReached(expectation?.roundReached ?? null, tournament.result)
}

function getHistoryEntryResultTier(
  entry: Pick<GameState['history']['tournamentHistory'][number], 'tournamentName' | 'eventType' | 'stageId' | 'formatId' | 'result'>,
) {
  const expectation = getTournamentResultExpectation(
    {
      name: entry.tournamentName,
      type: entry.eventType ?? 'Unknown',
      eventClass: entry.eventType ?? 'Unknown',
      stageId: entry.stageId ?? undefined,
      formatId: entry.formatId ?? undefined,
    },
    entry.result,
  )

  return getResultTierFromRoundReached(expectation?.roundReached ?? null, entry.result)
}

function isHistoryProfessionalFinalLevelRun(entry: GameState['history']['tournamentHistory'][number]) {
  return isProfessionalEventType(entry.eventType)
    && (
      getHistoryEntryResultTier(entry) >= 4
      || entry.result === 'Winner'
      || (entry.matchesPlayed >= 4 && entry.wins >= 3 && entry.losses >= 1)
    )
}

function getBestTournamentResult(tournaments: SeasonReport['tournaments']) {
  const bestTier = tournaments.reduce((best, tournament) => Math.max(best, getSimulationTournamentResultTier(tournament)), 0)

  if (bestTier >= 5) return 'Winner'
  if (bestTier >= 4) return 'Final'
  if (bestTier >= 3) return 'Semi Final'
  if (bestTier >= 2) return 'Quarter Final'
  if (bestTier >= 1) return 'Last 16'
  if (tournaments.some((tournament) => tournament.matchesPlayed > 0)) return 'Match wins logged'

  return 'No notable run'
}

function isMajorStyleTournament(tournament: Pick<SeasonReport['tournaments'][number], 'name' | 'type'>) {
  return /major/i.test(tournament.type)
    || /world championship|uk major|uk championship|tour championship|masters-style|champion of champions/i.test(tournament.name)
}

function isWorldChampionshipMainDrawName(name: string | null | undefined) {
  return /world championship/i.test(name ?? '')
    && !/seniors world championship/i.test(name ?? '')
    && !/qualifying/i.test(name ?? '')
}

function isWorldChampionshipTournament(tournament: Pick<SeasonReport['tournaments'][number], 'name'>) {
  return isWorldChampionshipMainDrawName(tournament.name)
}

function isWorldChampionshipQualifyingTournament(tournament: Pick<SeasonReport['tournaments'][number], 'name'>) {
  return /world championship qualifying/i.test(tournament.name)
}

function isUkStyleMajorTournament(tournament: Pick<Tournament, 'name' | 'type'> | Pick<SeasonReport['tournaments'][number], 'name' | 'type'>) {
  return /uk major|uk championship/i.test(tournament.name) && /major|ranking|professional|invitational/i.test(tournament.type)
}

function isMastersStyleTournament(tournament: Pick<Tournament, 'name' | 'type'> | Pick<SeasonReport['tournaments'][number], 'name' | 'type'>) {
  return /masters-style/i.test(tournament.name)
    || (/\bmasters\b/i.test(tournament.name) && /major|invitational|ranking|professional/i.test(tournament.type))
}

function isPlayersSeriesTournament(tournament: Pick<Tournament, 'name' | 'type'> | Pick<SeasonReport['tournaments'][number], 'name' | 'type'>) {
  return /world grand prix|players championship|tour championship/i.test(tournament.name)
    && /major|ranking|invitational|professional/i.test(tournament.type)
}

function isChampionOfChampionsStyleTournament(tournament: Pick<Tournament, 'name' | 'type'> | Pick<SeasonReport['tournaments'][number], 'name' | 'type'>) {
  return /champion of champions/i.test(tournament.name) && /major|invitational|ranking|professional/i.test(tournament.type)
}

function isHomeNationsTournament(tournament: Pick<Tournament, 'name' | 'type'> | Pick<SeasonReport['tournaments'][number], 'name' | 'type'>) {
  return /english open|northern ireland open|scottish open|welsh open/i.test(tournament.name)
}

function getTournamentClassification(tournament: Pick<Tournament, 'name' | 'type' | 'rankingType' | 'eventClass'>): TournamentClassification {
  const type = tournament.type
  const eventClass = tournament.eventClass ?? tournament.type
  const lowerType = `${type}`.toLowerCase()
  const isWorldMainDraw = isWorldChampionshipTournament(tournament)
  const isWorldQualifying = isWorldChampionshipQualifyingTournament(tournament)
  const isPlayersSeries = isPlayersSeriesTournament(tournament)
  const isMastersStyle = isMastersStyleTournament(tournament)
  const isUkStyleMajor = isUkStyleMajorTournament(tournament)
  const isChampionOfChampions = isChampionOfChampionsStyleTournament(tournament)
  const isHomeNations = isHomeNationsTournament(tournament)
  const isQTour = type === 'Q Tour'
  const isQSchool = type === 'Q School'
  const isYouth = /junior|youth/.test(lowerType)
  const isAmateur = lowerType === 'amateur'
  const isSenior = lowerType === 'senior'
  const isExhibition = lowerType === 'exhibition'
  const isQualifyingEvent = isWorldQualifying || ((type === 'Professional Tour' || type === 'Major') && /qualifier|qualifying|rookie/i.test(tournament.name))
  const isInvitational = type === 'Invitational' || isMastersStyle || isChampionOfChampions
  const isMajor = isWorldMainDraw || type === 'Major' || isMastersStyle
  const isEliteInvitational = !isExhibition && !isQualifyingEvent && (isMastersStyle || isChampionOfChampions || (type === 'Invitational' && !isPlayersSeries))
  const isRankingEvent = !isQualifyingEvent && !isQTour && !isQSchool && !isYouth && !isAmateur && !isSenior && !isExhibition
    && (tournament.rankingType === 'World Ranking' || (type === 'Ranking' && !isInvitational) || isPlayersSeries || isHomeNations)
  const isMainTourEvent = isRankingEvent || isQualifyingEvent || isEliteInvitational

  if (isWorldMainDraw) {
    return {
      tournamentClass: 'World Championship Main Draw',
      reportingClass: 'major',
      eligibleStatuses: 'Top 16 main-draw locks; promoted qualifiers and elite route players',
      expectedEntryBands: 'Top 16 direct, 17-128 via World qualifying route',
      isRankingEvent: true,
      isInvitational: false,
      isQualifier: false,
      isQualifyingEvent: false,
      isMajor: true,
      isWorldChampionship: true,
      isWorldChampionshipEvent: true,
      isWorldMainDraw: true,
      isWorldQualifying: false,
      isEliteInvitational: false,
      isPlayersSeries: false,
      isHomeNations: false,
      isQTour: false,
      isQSchool: false,
      isAmateur: false,
      isYouth: false,
      isSenior: false,
      isExhibition: false,
      isAmateurYouth: false,
      isSeniorExhibition: false,
      isMainTourEvent: true,
    }
  }

  if (isWorldQualifying) {
    return {
      tournamentClass: 'World Championship Qualifying',
      reportingClass: 'qualifying',
      eligibleStatuses: 'Active professionals outside the protected main draw',
      expectedEntryBands: 'Ranks 17-128 and equivalent qualified routes',
      isRankingEvent: false,
      isInvitational: false,
      isQualifier: true,
      isQualifyingEvent: true,
      isMajor: false,
      isWorldChampionship: true,
      isWorldChampionshipEvent: true,
      isWorldMainDraw: false,
      isWorldQualifying: true,
      isEliteInvitational: false,
      isPlayersSeries: false,
      isHomeNations: false,
      isQTour: false,
      isQSchool: false,
      isAmateur: false,
      isYouth: false,
      isSenior: false,
      isExhibition: false,
      isAmateurYouth: false,
      isSeniorExhibition: false,
      isMainTourEvent: true,
    }
  }

  if (isPlayersSeries) {
    return {
      tournamentClass: 'Players Series',
      reportingClass: type === 'Major' ? 'major' : 'ranking',
      eligibleStatuses: 'Top 32 / Top 16 / Top 8-style one-year qualifiers',
      expectedEntryBands: 'One-year ranking cut events for elite professionals',
      isRankingEvent: true,
      isInvitational: false,
      isQualifier: false,
      isQualifyingEvent: false,
      isMajor: type === 'Major',
      isWorldChampionship: false,
      isWorldChampionshipEvent: false,
      isWorldMainDraw: false,
      isWorldQualifying: false,
      isEliteInvitational: false,
      isPlayersSeries: true,
      isHomeNations: false,
      isQTour: false,
      isQSchool: false,
      isAmateur: false,
      isYouth: false,
      isSenior: false,
      isExhibition: false,
      isAmateurYouth: false,
      isSeniorExhibition: false,
      isMainTourEvent: true,
    }
  }

  if (isEliteInvitational) {
    return {
      tournamentClass: isChampionOfChampions ? 'Champion of Champions-style Invitational' : 'Elite Invitational',
      reportingClass: isMastersStyle ? 'major' : 'invitational',
      eligibleStatuses: isMastersStyle ? 'Top 16 / elite invitational field' : 'Qualified champions and elite invitees',
      expectedEntryBands: isMastersStyle ? 'Top 16 and elite invitational routes' : 'Selective invitational qualifiers only',
      isRankingEvent: false,
      isInvitational: true,
      isQualifier: false,
      isQualifyingEvent: false,
      isMajor: isMastersStyle,
      isWorldChampionship: false,
      isWorldChampionshipEvent: false,
      isWorldMainDraw: false,
      isWorldQualifying: false,
      isEliteInvitational: true,
      isPlayersSeries: false,
      isHomeNations: false,
      isQTour: false,
      isQSchool: false,
      isAmateur: false,
      isYouth: false,
      isSenior: false,
      isExhibition: false,
      isAmateurYouth: false,
      isSeniorExhibition: false,
      isMainTourEvent: true,
    }
  }

  if (isQTour) {
    return {
      tournamentClass: 'Q Tour Event',
      reportingClass: 'Q Tour',
      eligibleStatuses: 'Off-tour amateur and Q Tour pathway players',
      expectedEntryBands: 'Q Tour / amateur / pre-pro only',
      isRankingEvent: false,
      isInvitational: false,
      isQualifier: false,
      isQualifyingEvent: false,
      isMajor: false,
      isWorldChampionship: false,
      isWorldChampionshipEvent: false,
      isWorldMainDraw: false,
      isWorldQualifying: false,
      isEliteInvitational: false,
      isPlayersSeries: false,
      isHomeNations: false,
      isQTour: true,
      isQSchool: false,
      isAmateur: false,
      isYouth: false,
      isSenior: false,
      isExhibition: false,
      isAmateurYouth: false,
      isSeniorExhibition: false,
      isMainTourEvent: false,
    }
  }

  if (isQSchool) {
    return {
      tournamentClass: 'Q School Event',
      reportingClass: 'Q School',
      eligibleStatuses: 'Off-tour qualification routes and eligible comeback campaigns',
      expectedEntryBands: 'Q School campaigners and playoff routes',
      isRankingEvent: false,
      isInvitational: false,
      isQualifier: false,
      isQualifyingEvent: false,
      isMajor: false,
      isWorldChampionship: false,
      isWorldChampionshipEvent: false,
      isWorldMainDraw: false,
      isWorldQualifying: false,
      isEliteInvitational: false,
      isPlayersSeries: false,
      isHomeNations: false,
      isQTour: false,
      isQSchool: true,
      isAmateur: false,
      isYouth: false,
      isSenior: false,
      isExhibition: false,
      isAmateurYouth: false,
      isSeniorExhibition: false,
      isMainTourEvent: false,
    }
  }

  if (isYouth || isAmateur) {
    return {
      tournamentClass: isYouth ? 'Youth Pathway Event' : 'Amateur Pathway Event',
      reportingClass: isYouth ? 'youth' : 'amateur',
      eligibleStatuses: isYouth ? 'Youth and junior pathway players' : 'Amateur and off-tour players',
      expectedEntryBands: isYouth ? 'Youth / junior only' : 'Amateur / off-tour only',
      isRankingEvent: false,
      isInvitational: false,
      isQualifier: false,
      isQualifyingEvent: false,
      isMajor: false,
      isWorldChampionship: false,
      isWorldChampionshipEvent: false,
      isWorldMainDraw: false,
      isWorldQualifying: false,
      isEliteInvitational: false,
      isPlayersSeries: false,
      isHomeNations: false,
      isQTour: false,
      isQSchool: false,
      isAmateur,
      isYouth,
      isSenior: false,
      isExhibition: false,
      isAmateurYouth: true,
      isSeniorExhibition: false,
      isMainTourEvent: false,
    }
  }

  if (isSenior || isExhibition) {
    return {
      tournamentClass: isSenior ? 'Senior Event' : 'Exhibition Event',
      reportingClass: isSenior ? 'senior' : 'invitational',
      eligibleStatuses: isSenior ? 'Senior and legend circuit players' : 'Invited veterans and exhibition field',
      expectedEntryBands: isSenior ? 'Senior / legend only' : 'Exhibition invitees',
      isRankingEvent: false,
      isInvitational: !isSenior,
      isQualifier: false,
      isQualifyingEvent: false,
      isMajor: false,
      isWorldChampionship: false,
      isWorldChampionshipEvent: false,
      isWorldMainDraw: false,
      isWorldQualifying: false,
      isEliteInvitational: false,
      isPlayersSeries: false,
      isHomeNations: false,
      isQTour: false,
      isQSchool: false,
      isAmateur: false,
      isYouth: false,
      isSenior,
      isExhibition,
      isAmateurYouth: false,
      isSeniorExhibition: true,
      isMainTourEvent: false,
    }
  }

  if (isQualifyingEvent) {
    return {
      tournamentClass: isHomeNations ? 'Home Nations Qualifier' : 'Professional Qualifier',
      reportingClass: 'qualifying',
      eligibleStatuses: 'Professional ranks outside the seeded cutoff',
      expectedEntryBands: 'Top 17-128 and survival-route professionals',
      isRankingEvent: false,
      isInvitational: false,
      isQualifier: true,
      isQualifyingEvent: true,
      isMajor: false,
      isWorldChampionship: false,
      isWorldChampionshipEvent: false,
      isWorldMainDraw: false,
      isWorldQualifying: false,
      isEliteInvitational: false,
      isPlayersSeries: false,
      isHomeNations,
      isQTour: false,
      isQSchool: false,
      isAmateur: false,
      isYouth: false,
      isSenior: false,
      isExhibition: false,
      isAmateurYouth: false,
      isSeniorExhibition: false,
      isMainTourEvent: true,
    }
  }

  return {
    tournamentClass: isHomeNations ? 'Home Nations Ranking Event' : isUkStyleMajor ? 'UK-style Major' : eventClass === 'Professional' ? 'Professional Ranking Event' : 'Professional Ranking Event',
    reportingClass: isMajor ? 'major' : isInvitational ? 'invitational' : 'ranking',
    eligibleStatuses: 'Main-tour professionals and qualified invitational routes',
    expectedEntryBands: isUkStyleMajor ? 'Full professional field with qualifying route' : 'Main-tour ranking field',
    isRankingEvent,
    isInvitational,
    isQualifier: false,
    isQualifyingEvent: false,
    isMajor,
    isWorldChampionship: false,
    isWorldChampionshipEvent: false,
    isWorldMainDraw: false,
    isWorldQualifying: false,
    isEliteInvitational: false,
    isPlayersSeries: false,
    isHomeNations,
    isQTour: false,
    isQSchool: false,
    isAmateur: false,
    isYouth: false,
    isSenior: false,
    isExhibition: false,
    isAmateurYouth: false,
    isSeniorExhibition: false,
    isMainTourEvent,
  }
}

function summarizeSeasonCalendar(tournaments: Tournament[]): SeasonCalendarSummary {
  return tournaments.reduce<SeasonCalendarSummary>((summary, tournament) => {
    const classification = getTournamentClassification(tournament)
    return {
      totalEventsAvailable: summary.totalEventsAvailable + 1,
      rankingEvents: summary.rankingEvents + (classification.isRankingEvent ? 1 : 0),
      qualifyingEvents: summary.qualifyingEvents + (classification.isQualifyingEvent ? 1 : 0),
      majors: summary.majors + (classification.isMajor ? 1 : 0),
      worldChampionshipEvents: summary.worldChampionshipEvents + (classification.isWorldChampionshipEvent ? 1 : 0),
      eliteInvitationals: summary.eliteInvitationals + (classification.isEliteInvitational ? 1 : 0),
      playersSeriesEvents: summary.playersSeriesEvents + (classification.isPlayersSeries ? 1 : 0),
      qTourEvents: summary.qTourEvents + (classification.isQTour ? 1 : 0),
      qSchoolEvents: summary.qSchoolEvents + (classification.isQSchool ? 1 : 0),
      amateurYouthEvents: summary.amateurYouthEvents + (classification.isAmateurYouth ? 1 : 0),
      seniorExhibitionEvents: summary.seniorExhibitionEvents + (classification.isSeniorExhibition ? 1 : 0),
    }
  }, {
    totalEventsAvailable: 0,
    rankingEvents: 0,
    qualifyingEvents: 0,
    majors: 0,
    worldChampionshipEvents: 0,
    eliteInvitationals: 0,
    playersSeriesEvents: 0,
    qTourEvents: 0,
    qSchoolEvents: 0,
    amateurYouthEvents: 0,
    seniorExhibitionEvents: 0,
  })
}

function getTournamentFormatWarnings(tournament: Tournament, classification: TournamentClassification) {
  const format = resolveTournamentFormat(tournament)
  const warnings: string[] = []
  const tournamentName = tournament.name.toLowerCase()

  const allowsOpenEndedField = (classification.isQSchool && /uk[\s/-]*europe/.test(tournamentName))
    || (classification.isQTour && /americas|asia pacific|middle east|china/.test(tournamentName))

  if (format.fieldSize == null && format.formatFamily !== 'administrative' && !allowsOpenEndedField) {
    warnings.push('missing field size')
  }

  if (format.frameFormat.length === 0) {
    warnings.push('missing frame format')
  }

  if (getRoundCount(format) === 0 && format.formatFamily !== 'administrative') {
    warnings.push('missing round structure')
  }

  if (classification.isWorldMainDraw && format.fieldSize !== 32) {
    warnings.push('World Championship main draw not 32 players')
  }

  if ((/masters-style|german-style masters/.test(tournamentName)) && format.fieldSize !== 16) {
    warnings.push('Masters-style event not 16 players')
  }

  if (classification.isQSchool && !/order of merit review/.test(tournamentName)) {
    if (/asia[\s-]*oceania/.test(tournamentName) && format.maxFieldSize !== 128) {
      warnings.push('Asia-Oceania Q School max field not 128 players')
    }
    if (/uk[\s/-]*europe/.test(tournamentName) && format.maxFieldSize !== null) {
      warnings.push('UK / Europe Q School should not have a listed maximum field')
    }
    if (!/asia[\s-]*oceania|uk[\s/-]*europe/.test(tournamentName) && format.fieldSize !== 128) {
      warnings.push('Generic Q School not 128 players')
    }
  }

  if (classification.isQTour && /play off|play-off|playoff/.test(tournamentName)) {
    if (format.fieldSize !== 24) {
      warnings.push('Q Tour Global Play-Off not 24 players')
    }
  }

  if (classification.isQTour && !/play off|play-off|playoff|review/.test(tournamentName)) {
    const minField = format.minFieldSize ?? format.fieldSize
    const maxField = format.maxFieldSize ?? format.fieldSize
    if (/europe\s*-\s*event|europe event/.test(tournamentName)) {
      if ((minField ?? 0) > 64 || (maxField ?? 0) < 128) {
        warnings.push('Q Tour Europe event has invalid Last 128 field model')
      }
    } else if (/americas|asia pacific|middle east|china/.test(tournamentName)) {
      if ((maxField ?? 0) > 128) {
        warnings.push('Regional Q Tour event exceeds 128-player cap')
      }
    } else if (minField !== 64 || maxField !== 64) {
      warnings.push('Generic Q Tour event too small/too large')
    }
  }

  if ((classification.isYouth || classification.isAmateur) && isProfessionalFormat(format)) {
    warnings.push('youth event using pro format')
  }

  if (classification.isMainTourEvent && isYouthFormat(format)) {
    warnings.push('pro event using youth format')
  }

  if (classification.isRankingEvent && !/world ranking|one-year ranking/i.test(format.rankingImpact)) {
    warnings.push('ranking event has no ranking impact')
  }

  if (classification.isInvitational && !classification.isPlayersSeries && !classification.isMajor && tournament.rankingType === 'World Ranking') {
    warnings.push('invitational incorrectly gives normal ranking points')
  }

  if (classification.isWorldQualifying && format.id === 'worldChampionshipMain') {
    warnings.push('qualifying event counted as main draw')
  }

  return warnings
}

function getCompetitionLevelBucket(
  tournament: Pick<Tournament, 'name' | 'type' | 'rankingType' | 'eventClass'>,
  classification: TournamentClassification,
): CompetitionLevelKey {
  if (classification.isYouth) return 'youth'
  if (classification.isAmateur) return 'amateur'
  if (classification.isQTour) return 'qTour'
  if (classification.isQSchool) return 'qSchool'
  if (classification.isWorldQualifying) return 'worldQualifying'
  if (classification.isWorldMainDraw) return 'worldMainDraw'
  if (classification.isPlayersSeries) return 'playersSeries'
  if (classification.isSenior) return 'senior'
  if (classification.isExhibition) return 'exhibition'
  if (classification.isMajor) return 'majors'
  if (classification.isQualifyingEvent) {
    return /rookie|survival|bottom tour/i.test(tournament.name) ? 'rookieBottomQualifiers' : 'proQualifying'
  }
  if (classification.isInvitational) return 'invitationals'
  return 'rankingEvents'
}

function countsTowardsProfessionalRecord(levelBucket: CompetitionLevelKey) {
  return [
    'rookieBottomQualifiers',
    'proQualifying',
    'rankingEvents',
    'majors',
    'worldQualifying',
    'worldMainDraw',
    'playersSeries',
    'invitationals',
  ].includes(levelBucket)
}

function countsTowardsRankingRecord(levelBucket: CompetitionLevelKey) {
  return ['rankingEvents', 'majors', 'worldQualifying', 'worldMainDraw', 'playersSeries'].includes(levelBucket)
}

function getTournamentAverageMetrics(matches: TournamentMatchMetrics[]) {
  return {
    averageOpponentStrength: averageNullable(matches.map((match) => match.opponentStrength)),
    averagePlayerStrength: averageNullable(matches.map((match) => match.playerStrength)),
    averageWinProbability: averageNullable(matches.map((match) => match.winProbability)),
    averageOpponentRanking: averageNullable(matches.map((match) => match.opponentRanking)),
    averagePlayerRanking: averageNullable(matches.map((match) => match.playerRanking)),
    opponentRankBandCounts: countOpponentRankBands(matches),
  }
}

function buildCompetitionRecords(tournaments: SeasonReport['tournaments']) {
  const recordMap = new Map<CompetitionLevelKey, CompetitionRecord>(
    COMPETITION_LEVEL_ORDER.map((level) => [level, createEmptyCompetitionRecord(level)]),
  )

  for (const tournament of tournaments) {
    const levels: CompetitionLevelKey[] = ['overall', tournament.levelBucket]
    for (const level of levels) {
      const record = recordMap.get(level) ?? createEmptyCompetitionRecord(level)
      record.eventsEntered += 1
      record.matches += tournament.matchesPlayed
      record.wins += tournament.wins
      record.losses += tournament.losses
      record.prizeMoney += tournament.prizeMoney
      record.rankingPoints += tournament.rankingPoints
      if (tournament.titleAwarded) record.titles += 1
      if (getSimulationTournamentResultTier(tournament) >= 4) record.finals += 1
      if (getSimulationTournamentResultTier(tournament) >= 3) record.semiFinals += 1
      if (getSimulationTournamentResultTier(tournament) >= 2) record.quarterFinals += 1
      if (getSimulationTournamentResultTier(tournament) >= 3) record.deepRuns += 1
      recordMap.set(level, record)
    }
  }

  const records = COMPETITION_LEVEL_ORDER.map((level) => recordMap.get(level) ?? createEmptyCompetitionRecord(level))
  for (const record of records) {
    const levelTournaments = tournaments.filter((tournament) => record.key === 'overall' || tournament.levelBucket === record.key)
    record.winPercentage = record.matches > 0 ? (record.wins / record.matches) * 100 : 0
    record.averageOpponentStrength = averageNullable(levelTournaments.map((tournament) => tournament.averageOpponentStrength))
    record.averagePlayerStrength = averageNullable(levelTournaments.map((tournament) => tournament.averagePlayerStrength))
    record.averageWinProbability = averageNullable(levelTournaments.map((tournament) => tournament.averageWinProbability))
  }

  return records
}

function buildSeasonCareerPhaseRecord(season: SeasonReport): CareerPhaseRecord[] {
  const phaseKey = getCareerPhaseKey(season.playerAtSeasonOpen.careerPhase)
  const phaseRecord = createEmptyCareerPhaseRecord(phaseKey)
  const overallRecord = getCompetitionLevelRecord(season.recordByLevel, 'overall')
  phaseRecord.seasons = 1
  phaseRecord.eventsEntered = overallRecord.eventsEntered
  phaseRecord.matches = overallRecord.matches
  phaseRecord.wins = overallRecord.wins
  phaseRecord.losses = overallRecord.losses
  phaseRecord.draws = overallRecord.draws
  phaseRecord.winPercentage = overallRecord.winPercentage
  phaseRecord.titles = season.tournaments.filter((tournament) => tournament.countedInTotalTitleRecord).length
  phaseRecord.rankingTitles = season.tournaments.filter((tournament) => tournament.countedInRankingTitleRecord).length
  phaseRecord.majorTitles = season.tournaments.filter((tournament) => tournament.countedInMajorTitleRecord).length
  phaseRecord.worldChampionshipEntries = season.tournaments.filter((tournament) => tournament.levelBucket === 'worldMainDraw' || tournament.levelBucket === 'worldQualifying').length
  const openRank = getReportedSeasonOpenWorldRank(season)
  const closeRank = getReportedSeasonCloseWorldRank(season)
  const rankedValues = [openRank, closeRank].filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  phaseRecord.bestWorldRank = rankedValues.length > 0 ? Math.min(...rankedValues) : null
  phaseRecord.worstWorldRank = rankedValues.length > 0 ? Math.max(...rankedValues) : null
  phaseRecord.averageWorldRank = rankedValues.length > 0 ? rankedValues.reduce((sum, value) => sum + value, 0) / rankedValues.length : null
  phaseRecord.prizeMoney = season.finance.prizeMoney
  return [phaseRecord]
}

function buildCareerPhaseRecords(seasons: SeasonReport[]) {
  const phaseMap = new Map<CareerPhaseKey, CareerPhaseRecord>(CAREER_PHASE_ORDER.map((phase) => [phase, createEmptyCareerPhaseRecord(phase)]))

  for (const season of seasons) {
    const phaseKey = getCareerPhaseKey(season.playerAtSeasonOpen.careerPhase)
    const phaseRecord = phaseMap.get(phaseKey) ?? createEmptyCareerPhaseRecord(phaseKey)
    const overallRecord = getCompetitionLevelRecord(season.recordByLevel, 'overall')
    phaseRecord.seasons += 1
    phaseRecord.eventsEntered += overallRecord.eventsEntered
    phaseRecord.matches += overallRecord.matches
    phaseRecord.wins += overallRecord.wins
    phaseRecord.losses += overallRecord.losses
    phaseRecord.draws += overallRecord.draws
    phaseRecord.titles += season.tournaments.filter((tournament) => tournament.countedInTotalTitleRecord).length
    phaseRecord.rankingTitles += season.tournaments.filter((tournament) => tournament.countedInRankingTitleRecord).length
    phaseRecord.majorTitles += season.tournaments.filter((tournament) => tournament.countedInMajorTitleRecord).length
    phaseRecord.worldChampionshipEntries += season.tournaments.filter((tournament) => tournament.levelBucket === 'worldMainDraw' || tournament.levelBucket === 'worldQualifying').length
    phaseRecord.prizeMoney += season.finance.prizeMoney
    const openRank = getReportedSeasonOpenWorldRank(season)
    const closeRank = getReportedSeasonCloseWorldRank(season)
    const rankedValues = [openRank, closeRank].filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    if (rankedValues.length > 0) {
      phaseRecord.bestWorldRank = phaseRecord.bestWorldRank == null ? Math.min(...rankedValues) : Math.min(phaseRecord.bestWorldRank, ...rankedValues)
      phaseRecord.worstWorldRank = phaseRecord.worstWorldRank == null ? Math.max(...rankedValues) : Math.max(phaseRecord.worstWorldRank, ...rankedValues)
      const cumulativeAverageBase = phaseRecord.averageWorldRank == null ? 0 : phaseRecord.averageWorldRank * (phaseRecord.seasons - 1)
      phaseRecord.averageWorldRank = (cumulativeAverageBase + rankedValues.reduce((sum, value) => sum + value, 0) / rankedValues.length) / phaseRecord.seasons
    }
    phaseMap.set(phaseKey, phaseRecord)
  }

  return CAREER_PHASE_ORDER
    .map((phase) => phaseMap.get(phase) ?? createEmptyCareerPhaseRecord(phase))
    .filter((record) => record.seasons > 0)
    .map((record) => ({
      ...record,
      winPercentage: record.matches > 0 ? (record.wins / record.matches) * 100 : 0,
    }))
}

function buildHumanMatchCountAuditEntries(
  season: string,
  phase: string,
  status: string,
  seasonHistoryEntries: TournamentHistorySnapshot[],
  openingTournamentById: Map<string, Tournament>,
  seasonMatchLogByTournamentId: Map<string, TournamentMatchMetrics[]>,
  tournaments: SeasonReport['tournaments'],
) {
  return seasonHistoryEntries
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .map((entry) => {
      const tournament = openingTournamentById.get(entry.tournamentId)
      const classification = tournament ? getTournamentClassification(tournament) : null
      const levelBucket = tournament && classification ? getCompetitionLevelBucket(tournament, classification) : 'rankingEvents'
      const record = tournaments.find((item) => item.tournamentId === entry.tournamentId && item.startDate === entry.startDate)
      const canonicalResult = record?.canonicalResult ?? getSeasonReportCanonicalResult(entry, tournament, classification, levelBucket)
      const warningFlags: string[] = []
      const titleAwarded = canonicalResult.isTitle
      const actualMatchesAdded = canonicalResult.matchesPlayed
      const actualWinsAdded = canonicalResult.wins
      const actualLossesAdded = canonicalResult.losses
      const expectedMatches = canonicalResult.matchesPlayed
      const expectedWins = canonicalResult.wins
      const expectedLosses = canonicalResult.losses
      const seasonMatches = seasonMatchLogByTournamentId.get(entry.tournamentId) ?? []
      const tournamentMetrics = getTournamentAverageMetrics(seasonMatches)
      const actualWinRate = actualMatchesAdded > 0 ? (actualWinsAdded / actualMatchesAdded) * 100 : 0
      const winRateVsExpected = tournamentMetrics.averageWinProbability == null ? null : actualWinRate - tournamentMetrics.averageWinProbability

      if (entry.matchesPlayed !== canonicalResult.matchesPlayed) {
        warningFlags.push('stored matches did not match canonical event result')
      }
      if (entry.wins !== canonicalResult.wins) {
        warningFlags.push('stored wins did not match canonical event result')
      }
      if (entry.losses !== canonicalResult.losses) {
        warningFlags.push('stored losses did not match canonical event result')
      }
      if (isNonCompetitiveTournamentResult(entry.result) && (entry.matchesPlayed > 0 || entry.wins > 0 || entry.losses > 0)) {
        warningFlags.push('skipped or no-entry event stored match counts')
      }
      if (isNonCompetitiveTournamentResult(entry.result) && (entry.prizeMoney > 0 || entry.rankingPoints > 0)) {
        warningFlags.push('skipped or no-entry event stored prize money or ranking points')
      }

      if (actualMatchesAdded !== expectedMatches) {
        warningFlags.push('actual matches do not match field size + round reached')
      }
      if (actualWinsAdded !== expectedWins) {
        warningFlags.push('wins added do not match expected round progression')
      }
      if (actualLossesAdded !== expectedLosses) {
        warningFlags.push('losses added do not match expected round progression')
      }
      if (actualWinsAdded > expectedWins) {
        warningFlags.push('actual wins exceed possible wins for round reached')
      }
      if (/last 16|last 32|last 64|qualifying/i.test(entry.result) && actualWinsAdded >= 4) {
        warningFlags.push('player records many wins but round reached is early loss')
      }
      if (/winner/i.test(entry.result) && record?.countedInTotalTitleRecord !== true && levelBucket !== 'qSchool' && levelBucket !== 'proQualifying' && levelBucket !== 'rookieBottomQualifiers' && levelBucket !== 'worldQualifying') {
        warningFlags.push('winner result not reflected in total title counters')
      }
      if (/winner/i.test(entry.result) && record?.isRankingEvent && !record.countedInRankingTitleRecord && !record.isQualifier) {
        warningFlags.push('ranking-event winner not reflected in ranking title counters')
      }
      if (/winner/i.test(entry.result) && record?.isMajor && !record.countedInMajorTitleRecord && !record.isQualifier) {
        warningFlags.push('major winner not reflected in major title counters')
      }
      if (/winner/i.test(entry.result) && record?.isWorldMainDraw && !record.countedInWorldTitleRecord) {
        warningFlags.push('World Championship winner not reflected in world title counters')
      }
      if ((levelBucket === 'proQualifying' || levelBucket === 'rookieBottomQualifiers' || levelBucket === 'worldQualifying') && actualWinsAdded > 0) {
        warningFlags.push('qualifier matches are counted as full career wins but not clearly separated')
      }
      if (record?.countedInRankingQualifierRecord && record.countedInRankingRecord) {
        warningFlags.push('qualifier wins counted inside both ranking qualifier and ranking main-draw buckets')
      }
      if (['qTour', 'qSchool', 'amateur', 'youth'].includes(levelBucket) && actualWinsAdded > 0) {
        warningFlags.push('Q Tour/youth/amateur wins are counted as pro career wins without category separation')
      }
      return {
        season,
        playerPhase: phase,
        playerStatus: status,
        tournamentName: entry.tournamentName,
        tournamentClass: classification?.tournamentClass ?? 'Unknown',
        reportingClass: classification?.reportingClass ?? 'unknown',
        levelBucket,
        fieldSize: canonicalResult.fieldSize == null ? 'n/a' : String(canonicalResult.fieldSize),
        roundReached: canonicalResult.resultLabel,
        expectedMatches,
        actualMatchesAdded,
        expectedWins,
        actualWinsAdded,
        expectedLosses,
        actualLossesAdded,
        titleAwarded,
        isRankingEvent: record?.isRankingEvent ?? classification?.isRankingEvent ?? false,
        isMajor: record?.isMajor ?? classification?.isMajor ?? false,
        rankingMoneyAwarded: entry.prizeMoney,
        rankingPointsAwarded: entry.rankingPoints,
        averageOpponentStrength: tournamentMetrics.averageOpponentStrength,
        averageOpponentRanking: tournamentMetrics.averageOpponentRanking,
        averageWinProbability: tournamentMetrics.averageWinProbability,
        actualWinRate,
        winRateVsExpected,
        opponentRankBandCounts: tournamentMetrics.opponentRankBandCounts,
        countedInTotalRecord: true,
        countedInProRecord: countsTowardsProfessionalRecord(levelBucket),
        countedInRankingRecord: countsTowardsRankingRecord(levelBucket),
        countedInRankingQualifierRecord: record?.countedInRankingQualifierRecord ?? false,
        countedInRankingMainDrawRecord: record?.countedInRankingMainDrawRecord ?? false,
        countedInTitleRecord: record?.countedInTotalTitleRecord ?? titleAwarded,
        countedInRankingTitleRecord: record?.countedInRankingTitleRecord ?? false,
        countedInMajorTitleRecord: record?.countedInMajorTitleRecord ?? false,
        countedInWorldTitleRecord: record?.countedInWorldTitleRecord ?? false,
        warningFlags,
      } satisfies HumanMatchCountAuditEntry
    })
}

function getSeasonCalendarValidationWarnings(tournaments: Tournament[]) {
  const summary = summarizeSeasonCalendar(tournaments)
  const warnings: string[] = []

  if (summary.rankingEvents < CALENDAR_MODEL.rankingEventsMin) {
    warnings.push(`Calendar only includes ${summary.rankingEvents} ranking events; expected at least ${CALENDAR_MODEL.rankingEventsMin}.`)
  }

  if (summary.rankingEvents > CALENDAR_MODEL.rankingEventsMax) {
    warnings.push(`Calendar includes ${summary.rankingEvents} ranking events; expected no more than ${CALENDAR_MODEL.rankingEventsMax}.`)
  }

  if (summary.qualifyingEvents < CALENDAR_MODEL.qualifierEventsMin) {
    warnings.push(`Calendar only includes ${summary.qualifyingEvents} attached qualifiers; expected at least ${CALENDAR_MODEL.qualifierEventsMin}.`)
  }

  if (summary.qualifyingEvents > CALENDAR_MODEL.qualifierEventsMax) {
    warnings.push(`Calendar includes ${summary.qualifyingEvents} attached qualifiers; expected no more than ${CALENDAR_MODEL.qualifierEventsMax}.`)
  }

  if (summary.playersSeriesEvents < CALENDAR_MODEL.playersSeriesMin) {
    warnings.push(`Calendar only includes ${summary.playersSeriesEvents} Players Series events; expected at least ${CALENDAR_MODEL.playersSeriesMin}.`)
  }

  if (summary.playersSeriesEvents > CALENDAR_MODEL.playersSeriesMax) {
    warnings.push(`Calendar includes ${summary.playersSeriesEvents} Players Series events; expected no more than ${CALENDAR_MODEL.playersSeriesMax}.`)
  }

  if (summary.qTourEvents < CALENDAR_MODEL.qTourEventsMin) {
    warnings.push(`Calendar only includes ${summary.qTourEvents} Q Tour events; expected at least ${CALENDAR_MODEL.qTourEventsMin}.`)
  }

  if (summary.qTourEvents > CALENDAR_MODEL.qTourEventsMax) {
    warnings.push(`Calendar includes ${summary.qTourEvents} Q Tour events; expected no more than ${CALENDAR_MODEL.qTourEventsMax}.`)
  }

  if (summary.qSchoolEvents < CALENDAR_MODEL.qSchoolEventsMin) {
    warnings.push(`Calendar only includes ${summary.qSchoolEvents} Q School events; expected at least ${CALENDAR_MODEL.qSchoolEventsMin}.`)
  }

  if (summary.qSchoolEvents > CALENDAR_MODEL.qSchoolEventsMax) {
    warnings.push(`Calendar includes ${summary.qSchoolEvents} Q School events; expected no more than ${CALENDAR_MODEL.qSchoolEventsMax}.`)
  }

  if (!tournaments.some((tournament) => getTournamentClassification(tournament).isWorldMainDraw)) {
    warnings.push('Calendar is missing the World Championship main draw.')
  }

  if (!tournaments.some((tournament) => getTournamentClassification(tournament).isWorldQualifying)) {
    warnings.push('Calendar is missing World Championship qualifying.')
  }

  if (!tournaments.some((tournament) => getTournamentClassification(tournament).isQSchool)) {
    warnings.push('Calendar is missing Q School.')
  }

  if (!tournaments.some((tournament) => getTournamentClassification(tournament).isQTour)) {
    warnings.push('Calendar is missing a Q Tour path.')
  }

  if (!tournaments.some((tournament) => isUkStyleMajorTournament(tournament))) {
    warnings.push('Calendar is missing a UK Championship-style major.')
  }

  if (!tournaments.some((tournament) => isMastersStyleTournament(tournament))) {
    warnings.push('Calendar is missing a Masters-style elite event.')
  }

  if (!tournaments.some((tournament) => getTournamentClassification(tournament).isQualifyingEvent)) {
    warnings.push('Calendar is missing a qualification route for ranks 17-128.')
  }

  const invalidFormatCount = tournaments.filter((tournament) => {
    const classification = getTournamentClassification(tournament)
    return getTournamentFormatWarnings(tournament, classification).length > 0
  }).length
  if (invalidFormatCount > 0) {
    warnings.push(`Calendar has ${invalidFormatCount} tournament format validation warnings.`)
  }

  return warnings
}

function getTournamentHistoryEntryMap(entries: TournamentHistorySnapshot[]) {
  return new Map(entries.map((entry) => [entry.tournamentId, entry]))
}

function hasTrackedTournamentEntry(entry: TournamentHistorySnapshot | null | undefined) {
  return entry != null && entry.status !== 'Skipped' && entry.status !== 'High Cost'
}

function getSeasonReportCanonicalResult(
  entry: TournamentHistorySnapshot,
  tournament: Tournament | undefined,
  classification: TournamentClassification | null,
  levelBucket: CompetitionLevelKey,
) {
  const rankingTitleEligible = Boolean(classification?.isRankingEvent && !classification.isQualifyingEvent)
  const majorTitleEligible = Boolean(classification?.isMajor && !classification.isQualifyingEvent)
  const worldTitleEligible = Boolean(classification?.isWorldMainDraw)

  if (entry.canonicalResult) {
    return {
      ...entry.canonicalResult,
      levelBucket,
      reportingClass: classification?.reportingClass ?? entry.canonicalResult.reportingClass,
      isRankingTitle: entry.canonicalResult.isTitle && rankingTitleEligible,
      isMajorTitle: entry.canonicalResult.isTitle && majorTitleEligible,
      isWorldTitle: entry.canonicalResult.isTitle && worldTitleEligible,
    }
  }

  if (tournament) {
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
        tournamentId: entry.tournamentId,
        tournamentName: entry.tournamentName,
        resultLabel: entry.result,
        prizeMoney: entry.prizeMoney,
        rankingPoints: entry.rankingPoints,
        levelBucket,
        reportingClass: classification?.reportingClass,
        isRankingTitle: rankingTitleEligible,
        isMajorTitle: majorTitleEligible,
        isWorldTitle: worldTitleEligible,
      },
    )
  }

  return {
    tournamentId: entry.tournamentId,
    tournamentName: entry.tournamentName,
    fieldSize: null,
    roundReached: entry.result,
    resultLabel: entry.result,
    matchesPlayed: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.matchesPlayed,
    wins: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.wins,
    losses: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.losses,
    isTitle: /winner|champion/i.test(entry.result),
    isFinal: /winner|champion|final/i.test(entry.result),
    isSemiFinal: /winner|champion|final|semi/i.test(entry.result),
    isQuarterFinal: /winner|champion|final|semi|quarter/i.test(entry.result),
    isDeepRun: /winner|champion|final|semi|quarter/i.test(entry.result),
    isRankingTitle: /winner|champion/i.test(entry.result) && rankingTitleEligible,
    isMajorTitle: /winner|champion/i.test(entry.result) && majorTitleEligible,
    isWorldTitle: /winner|champion/i.test(entry.result) && worldTitleEligible,
    prizeMoney: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.prizeMoney,
    rankingPoints: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.rankingPoints,
    levelBucket,
    reportingClass: classification?.reportingClass,
  }
}

function summarizeTournamentSelection(tournaments: Tournament[], selectedIds: Set<string>): PlayerEventSummary {
  return tournaments.reduce<PlayerEventSummary>((summary, tournament) => {
    if (!selectedIds.has(tournament.id)) {
      return summary
    }

    const classification = getTournamentClassification(tournament)
    return {
      totalTournamentsEntered: summary.totalTournamentsEntered + 1,
      rankingEventsEntered: summary.rankingEventsEntered + (classification.isRankingEvent ? 1 : 0),
      qualifiersEntered: summary.qualifiersEntered + (classification.isQualifyingEvent ? 1 : 0),
      majorsEntered: summary.majorsEntered + (classification.isMajor ? 1 : 0),
      worldChampionshipMainDrawEntered: summary.worldChampionshipMainDrawEntered || classification.isWorldMainDraw,
      worldChampionshipQualifyingEntered: summary.worldChampionshipQualifyingEntered || classification.isWorldQualifying,
      eliteInvitationalsEntered: summary.eliteInvitationalsEntered + (classification.isEliteInvitational ? 1 : 0),
      playersSeriesEntered: summary.playersSeriesEntered + (classification.isPlayersSeries ? 1 : 0),
      qTourEventsEntered: summary.qTourEventsEntered + (classification.isQTour ? 1 : 0),
      qSchoolEventsEntered: summary.qSchoolEventsEntered + (classification.isQSchool ? 1 : 0),
      amateurEventsEntered: summary.amateurEventsEntered + (classification.isAmateur ? 1 : 0),
      youthEventsEntered: summary.youthEventsEntered + (classification.isYouth ? 1 : 0),
      seniorEventsEntered: summary.seniorEventsEntered + (classification.isSeniorExhibition ? 1 : 0),
    }
  }, {
    totalTournamentsEntered: 0,
    rankingEventsEntered: 0,
    qualifiersEntered: 0,
    majorsEntered: 0,
    worldChampionshipMainDrawEntered: false,
    worldChampionshipQualifyingEntered: false,
    eliteInvitationalsEntered: 0,
    playersSeriesEntered: 0,
    qTourEventsEntered: 0,
    qSchoolEventsEntered: 0,
    amateurEventsEntered: 0,
    youthEventsEntered: 0,
    seniorEventsEntered: 0,
  })
}

function getCalendarEntryValidationWarnings(
  openingState: GameState,
  tournament: Tournament,
  classification: TournamentClassification,
  historyEntry: TournamentHistorySnapshot | null,
) {
  const warnings = [...getTournamentFormatWarnings(tournament, classification)]
  const humanEntered = hasTrackedTournamentEntry(historyEntry)

  if (!humanEntered) {
    return warnings
  }

  if (classification.isQTour && openingState.careerSystems.pro.hasTourCard) {
    warnings.push('main-tour player allowed into Q Tour while active')
  }

  if (classification.isQSchool && openingState.careerSystems.pro.hasTourCard) {
    warnings.push('current main-tour player entered Q School')
  }

  if (classification.isAmateurYouth && openingState.careerSystems.pro.hasTourCard) {
    warnings.push('current main-tour player entered an amateur or youth event')
  }

  if (classification.isPlayersSeries) {
    const oneYearRank = openingState.careerSystems.pro.oneYearRank
      ?? openingState.competitionTables.oneYear.find((row) => row.playerName === openingState.player.fullName)?.ranking
      ?? 999
    const cutoff = /tour championship/i.test(tournament.name)
      ? 12
      : /players championship/i.test(tournament.name)
        ? 16
        : 32

    if (oneYearRank > cutoff) {
      warnings.push(`player entered Players Series without top-${cutoff} one-year qualification`)
    }
  } else if (classification.isEliteInvitational && (openingState.careerSystems.pro.worldRank ?? 999) > 64) {
    warnings.push('bottom-tour player entered an elite restricted event')
  }

  if (classification.isMainTourEvent && !openingState.careerSystems.pro.hasTourCard && !classification.isEliteInvitational) {
    warnings.push('non-tour player allowed into ranking event without wildcard')
  }

  return warnings
}

function getHumanTournamentEntryRoute(
  openingState: GameState,
  tournament: Tournament,
  classification: TournamentClassification,
  historyEntry: TournamentHistorySnapshot | null,
) {
  if (hasTrackedTournamentEntry(historyEntry)) {
    if (tournament.seasonOpenAccessLock === 'worldMainDraw') return 'worldMainDraw'
    if (tournament.seasonOpenAccessLock === 'worldQualifying') return 'worldQualifying'
    if (classification.isQTour) return 'qTour'
    if (classification.isQSchool) return 'qSchool'
    if (classification.isAmateurYouth) return classification.isYouth ? 'youth' : 'amateur'
    if (classification.isSeniorExhibition) return classification.isSenior ? 'senior' : 'exhibition'
    if (classification.isQualifyingEvent) return 'qualifying'

    const access = getTournamentEntryAccess(openingState, tournament)
    return access.accessBand ?? 'mainTour'
  }

  const access = getTournamentEntryAccess(openingState, tournament)
  return access.allowed ? (access.accessBand ?? 'eligible') : (access.reason ?? 'not eligible')
}

function buildSeasonCalendarAuditEntries(
  archivedSeason: string,
  openingState: GameState,
  historyEntries: TournamentHistorySnapshot[],
) {
  const historyByTournamentId = getTournamentHistoryEntryMap(historyEntries)

  return [...openingState.tournaments]
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .map((tournament) => {
      const classification = getTournamentClassification(tournament)
      const format = resolveTournamentFormat(tournament)
      const formatWarnings = getTournamentFormatWarnings(tournament, classification)
      const historyEntry = historyByTournamentId.get(tournament.id) ?? null
      const validationWarnings = getCalendarEntryValidationWarnings(openingState, tournament, classification, historyEntry)
      return {
        tournamentId: tournament.id,
        formatId: format.id,
        season: archivedSeason,
        week: tournament.week ?? null,
        date: tournament.startDate,
        tournamentName: tournament.name,
        tournamentClass: classification.tournamentClass,
        reportingClass: classification.reportingClass,
        eligibleBands: format.eligibleBands.join(', '),
        eligibleStatuses: classification.eligibleStatuses,
        expectedEntryBands: classification.expectedEntryBands,
        configuredFieldSize: getConfiguredFieldSizeLabel(format),
        expectedFieldSize: getExpectedFieldSizeLabel(format),
        actualEntrantsTracked: null,
        formatValid: formatWarnings.length === 0,
        formatValidationStatus: formatWarnings.length === 0 ? 'ok' : formatWarnings.join(' | '),
        roundStructure: getRoundStructureSummary(format),
        frameFormat: getFrameFormatSummary(format),
        roundCount: getRoundCount(format),
        seedingModel: format.seedingModel,
        rankingImpact: format.rankingImpact,
        pathwayImpact: format.pathwayImpact,
        humanEntered: hasTrackedTournamentEntry(historyEntry),
        humanEntryRoute: getHumanTournamentEntryRoute(openingState, tournament, classification, historyEntry),
        aiEntrantsTracked: null,
        winner: historyEntry?.result === 'Winner' ? openingState.player.fullName : null,
        prizeFund: tournament.totalPrizeFund ?? tournament.prizeMoney,
        rankingValue: tournament.rankingValue,
        validationStatus: validationWarnings.length === 0 ? 'ok' : validationWarnings.join(' | '),
      }
    })
}

function isQualifierTournament(tournament: Pick<SeasonReport['tournaments'][number], 'name'>) {
  return /qualifier|qualifying/i.test(tournament.name)
}

function isCoreMajorTournament(tournament: Pick<SeasonReport['tournaments'][number], 'name' | 'type'>) {
  return !/junior|youth|amateur|q tour|q school|senior/i.test(tournament.type)
    && (isWorldChampionshipTournament(tournament) || isMajorStyleTournament(tournament))
    && !isQualifierTournament(tournament)
}

function isNormalMainTourTournament(tournament: Pick<SeasonReport['tournaments'][number], 'name' | 'type'>) {
  return !/junior|youth|amateur|q tour|q school|senior/i.test(tournament.type)
    && !isQualifierTournament(tournament)
    && !/rookie pro/i.test(tournament.name)
    && (isProfessionalEventType(tournament.type) || isCoreMajorTournament(tournament))
}

function hasTournamentParticipation(tournament: Pick<SeasonReport['tournaments'][number], 'result' | 'matchesPlayed' | 'wins' | 'losses' | 'prizeMoney' | 'rankingPoints'>) {
  if (tournament.matchesPlayed > 0 || tournament.wins > 0 || tournament.losses > 0) {
    return true
  }

  if (tournament.prizeMoney > 0 || tournament.rankingPoints > 0) {
    return true
  }

  return !/not entered|skipped|high-cost/i.test(tournament.result)
}

function hasWorldChampionshipMainDrawEntry(tournament: Pick<SeasonReport['tournaments'][number], 'name' | 'result' | 'matchesPlayed' | 'wins' | 'losses' | 'prizeMoney' | 'rankingPoints'>) {
  return isWorldChampionshipTournament(tournament) && hasTournamentParticipation(tournament)
}

function hasWorldChampionshipQualifyingEntry(tournament: Pick<SeasonReport['tournaments'][number], 'name' | 'result' | 'matchesPlayed' | 'wins' | 'losses' | 'prizeMoney' | 'rankingPoints'>) {
  return isWorldChampionshipQualifyingTournament(tournament) && hasTournamentParticipation(tournament)
}

function getReportedSeasonOpenWorldRank(season: SeasonReport) {
  if (season.performance.openingRankingLabel === 'World Ranking') {
    return season.performance.openingRanking
  }

  return season.playerAtSeasonOpen.worldRanking ?? season.pathway.seasonOpen.worldRank ?? null
}

function getReportedSeasonCloseWorldRank(season: SeasonReport) {
  if (season.performance.closingRankingLabel === 'World Ranking') {
    return season.performance.closingRanking
  }

  return season.playerAtNextSeasonOpen.worldRanking ?? season.pathway.nextSeasonOpen.worldRank ?? null
}

function getWorldAccessDebugKey(reportBaseName: string, season: string) {
  const target = WORLD_ACCESS_DEBUG_TARGETS.find((entry) => entry.reportBaseName === reportBaseName && entry.season === season)
  return target ? `${target.reportBaseName}:${target.season}` : null
}

function getWorldAccessDebugLabel(reportBaseName: string, season: string) {
  return WORLD_ACCESS_DEBUG_TARGETS.find((entry) => entry.reportBaseName === reportBaseName && entry.season === season)?.label
    ?? `${reportBaseName} ${season}`
}

function loadWorldAccessDebugStore(): WorldAccessDebugStore {
  if (!fs.existsSync(worldAccessDebugJsonPath)) {
    return {}
  }

  try {
    return JSON.parse(fs.readFileSync(worldAccessDebugJsonPath, 'utf8')) as WorldAccessDebugStore
  } catch {
    return {}
  }
}

function writeWorldAccessDebugStore(store: WorldAccessDebugStore) {
  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(worldAccessDebugJsonPath, JSON.stringify(store, null, 2))

  const records = Object.values(store).sort((left, right) => left.target.localeCompare(right.target))
  const lines: string[] = ['# World Access Debug', '']

  if (records.length === 0) {
    lines.push('No world-access debug records captured yet.')
  } else {
    for (const record of records) {
      lines.push(`## ${record.target}`)
      lines.push(`- Scenario: ${record.scenario}`)
      lines.push(`- Report: ${record.reportBaseName}`)
      lines.push(`- Season: ${record.season}`)
      lines.push('')
      lines.push('```json')
      lines.push(JSON.stringify(record.rows, null, 2))
      lines.push('```')
      lines.push('')
    }
  }

  fs.writeFileSync(worldAccessDebugPath, `${lines.join('\n')}\n`)
}

function getEliteEventSelectionDebugKey(reportBaseName: string, season: string) {
  return `${reportBaseName}:${season}`
}

function getEliteEventSelectionDebugLabel(reportBaseName: string, season: string) {
  return `${reportBaseName} ${season}`
}

function loadEliteEventSelectionDebugStore(): EliteEventSelectionDebugStore {
  return {}
}

function writeEliteEventSelectionDebugStore(store: EliteEventSelectionDebugStore) {
  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(eliteEventSelectionDebugJsonPath, JSON.stringify(store, null, 2))
}

function getTournamentFatigueCost(tournament: Tournament) {
  if (tournament.fatigueRisk === 'High') return 3
  if (tournament.fatigueRisk === 'Medium') return 2
  return 1
}

function getTournamentExpectedPrizeValue(tournament: Tournament) {
  return tournament.winnerPrize ?? tournament.runnerUpPrize ?? tournament.firstRoundPrize ?? tournament.prizeMoney
}

function isEliteSelectionTrackedTournament(classification: TournamentClassification) {
  return classification.isMainTourEvent || classification.isEliteInvitational || classification.isPlayersSeries
}

function hasTournamentSelectionClassificationError(tournament: Tournament, classification: TournamentClassification) {
  if (/qualifier|qualifying/i.test(tournament.name)) return false
  if (classification.reportingClass === 'qualifying') return !classification.isQualifyingEvent
  if (classification.reportingClass === 'ranking') return !classification.isRankingEvent
  if (classification.reportingClass === 'major') return !classification.isMajor
  if (classification.reportingClass === 'invitational') return !classification.isEliteInvitational && !classification.isPlayersSeries
  return false
}

function getSeasonEventSelectionCap(state: GameState, currentWorldRank: number) {
  const stage = `${state.player.careerStage} ${state.player.competitiveStatus ?? ''} ${state.player.rankingLabel}`.toLowerCase()

  if (state.careerSystems.lateCareer.retired || /retired/.test(stage)) return 0
  if (/senior|legend/.test(stage) || state.careerSystems.lateCareer.seniorActive) return 4
  if (/junior|youth/.test(stage) || state.player.age <= 16) return 9
  if (/q school/.test(stage)) return 5
  if (/q tour/.test(stage)) return 8
  if (/amateur/.test(stage)) return 9
  if (currentWorldRank <= 16) return 10
  if (currentWorldRank <= 64) return 11
  if (currentWorldRank <= 128 || state.careerSystems.pro.hasTourCard) return 10
  return 8
}

function isAdultOffTourPathwayState(state: GameState, currentWorldRank = state.careerSystems.pro.worldRank ?? state.player.worldRanking ?? 999) {
  const statusText = `${state.player.careerStage} ${state.player.competitiveStatus ?? ''} ${state.player.rankingLabel}`.toLowerCase()
  const hasActiveQSchoolRoute = state.careerSystems.qSchool.campaignEligible
    || state.careerSystems.qSchool.seededCampaign
    || state.careerSystems.qSchool.directPlayoffEligible
  const hasPathwaySignal = hasActiveQSchoolRoute
    || state.careerSystems.qTour.playerPoints > 0
    || /q tour|q school|amateur/.test(statusText)
    || state.competitionTables.qTour.some((row) => row.playerName === state.player.fullName)
    || state.competitionTables.qSchool.some((row) => row.playerName === state.player.fullName)

  return state.player.age >= 18
    && state.player.age < 40
    && !state.careerSystems.pro.hasTourCard
    && currentWorldRank > 64
    && !state.careerSystems.lateCareer.seniorActive
    && !state.careerSystems.lateCareer.retired
    && hasPathwaySignal
}

function getSeasonPathwayEntryCounts(state: GameState) {
  return state.history.tournamentHistory
    .filter((entry) => entry.season === state.season && hasTrackedTournamentEntry(entry))
    .reduce(
      (summary, entry) => {
        if (entry.eventType === 'Q Tour') summary.qTour += 1
        else if (entry.eventType === 'Q School' && !/review|order of merit/i.test(entry.tournamentName)) summary.qSchool += 1
        else if (entry.eventType === 'Amateur') summary.amateur += 1
        return summary
      },
      { qTour: 0, qSchool: 0, amateur: 0 },
    )
}

function buildTournamentSelectionAnalysis(state: GameState, profile: ManagedSupportProfile = 'middle'): TournamentSelectionAnalysis {
  const config = SUPPORT_PROFILE_CONFIGS[profile]
  const currentWorldRank = state.careerSystems.pro.worldRank ?? state.player.worldRanking ?? 999
  const schedulingWindowDays = getTournamentSelectionWindowDays(currentWorldRank)
  const seasonMainTourEvents = state.history.tournamentHistory.filter(
    (entry) => entry.season === state.season && isProfessionalEventType(entry.eventType),
  ).length
  const seasonEnteredEvents = state.history.tournamentHistory.filter(
    (entry) => entry.season === state.season && hasTrackedTournamentEntry(entry),
  ).length
  const seasonCoreRankingEvents = state.history.tournamentHistory.filter(
    (entry) => entry.season === state.season && isCoreRankingEventType(entry.eventType),
  ).length
  const seasonQualifierEvents = state.history.tournamentHistory.filter(
    (entry) => entry.season === state.season && /qualifier|qualifying/i.test(entry.tournamentName),
  ).length
  const eliteStatus = /top 16|major contender|world champion/i.test(`${state.player.competitiveStatus ?? state.player.careerStage} ${state.careerSystems.pro.currentTier ?? ''} ${state.careerSystems.pro.tourSurvivalStatus ?? ''}`)
  const eliteVolumeFloorEligible = currentWorldRank <= 24 || eliteStatus
  const bestTopFourBonus = currentWorldRank <= 4 && profile === 'best' ? 2 : currentWorldRank <= 4 ? 1 : 0
  const expectedMainTourMinimum = getExpectedMainTourMinimum(currentWorldRank) + bestTopFourBonus
  const targetCoreRankingEvents = currentWorldRank <= 4 ? (profile === 'best' ? 6 : 5) : eliteVolumeFloorEligible ? 4 : 0
  const protectedWorld = getProtectedWorldChampionshipEvent(state)
  const candidates = state.tournaments
    .filter((tournament) => tournament.status === 'Available' || tournament.status === 'High Cost')
    .filter((tournament) => tournament.startDate >= state.currentDate)
    .filter((tournament) => tournament.startDate < `${getSeasonStartYear(state.season) + 1}-07-01`)
    .filter((tournament) => canSafelyEnterTournament(state, tournament))
    .filter((tournament) => shouldEnterQSchoolCampaign(state, tournament))
    .filter((tournament) => !wouldBlockProtectedWorldChampionship(state, tournament))
    .map((tournament) => {
      const classification = getTournamentClassification(tournament)
      const budgetCost = getTournamentBudgetCost(state, tournament)
      const entryCost = getTournamentEntryCashRequirement(state, tournament)
      const qSchoolCampaignAffordable = classification.isQSchool
        && !/review|order of merit/i.test(tournament.name)
        && entryCost <= state.player.cash
      return {
        tournament,
        classification,
        score: scoreTournament(state, tournament, profile),
        budgetCost,
        inSchedulingWindow: daysUntil(tournament.startDate, state.currentDate) <= schedulingWindowDays,
        isAffordable: budgetCost <= state.player.cash || qSchoolCampaignAffordable,
        isCoreTracked: isEliteSelectionTrackedTournament(classification),
        classificationError: hasTournamentSelectionClassificationError(tournament, classification),
        fatigueCost: getTournamentFatigueCost(tournament),
        expectedPrize: getTournamentExpectedPrizeValue(tournament),
      }
    })
  const candidateTournaments = candidates.filter((candidate) => candidate.isAffordable)
  const inWindowCandidates = candidateTournaments.filter((candidate) => candidate.inSchedulingWindow)
  const affordableAvailable = (inWindowCandidates.length > 0 ? inWindowCandidates : candidateTournaments)
    .sort((left, right) => {
      const scoreDelta = right.score - left.score
      if (scoreDelta !== 0) return scoreDelta
      return left.tournament.startDate.localeCompare(right.tournament.startDate)
    })

  if (state.careerSystems.lateCareer.retired) {
    return {
      currentWorldRank,
      schedulingWindowDays,
      seasonMainTourEvents,
      seasonCoreRankingEvents,
      expectedMainTourMinimum,
      targetCoreRankingEvents,
      selectedTournament: null,
      selectedReason: 'retired',
      candidates,
      affordableAvailable,
    }
  }

  if (protectedWorld && daysUntil(protectedWorld.startDate, state.currentDate) <= 35) {
    return {
      currentWorldRank,
      schedulingWindowDays,
      seasonMainTourEvents,
      seasonCoreRankingEvents,
      expectedMainTourMinimum,
      targetCoreRankingEvents,
      selectedTournament: protectedWorld,
      selectedReason: 'protected-world',
      candidates,
      affordableAvailable,
    }
  }

  if (isAdultOffTourPathwayState(state, currentWorldRank)) {
    const pathwayCounts = getSeasonPathwayEntryCounts(state)
    const qSchoolBoostedRoute = state.careerSystems.qSchool.campaignEligible
      || state.careerSystems.qSchool.seededCampaign
      || state.careerSystems.qSchool.directPlayoffEligible
    const qTourTarget = qSchoolBoostedRoute ? 4 : 5
    const qSchoolTarget = 2
    const pathwayWindowLimit = Math.max(45, schedulingWindowDays)

    if (pathwayCounts.amateur < 3) {
      const directCardRouteCandidate = candidateTournaments
        .filter((candidate) => isDirectAmateurTourCardRouteForTournament(candidate.tournament))
        .filter((candidate) => daysUntil(candidate.tournament.startDate, state.currentDate) <= Math.max(70, pathwayWindowLimit))
        .sort((left, right) => {
          const scoreDelta = right.score - left.score
          if (scoreDelta !== 0) return scoreDelta
          return left.tournament.startDate.localeCompare(right.tournament.startDate)
        })[0]

      if (directCardRouteCandidate) {
        return {
          currentWorldRank,
          schedulingWindowDays,
          seasonMainTourEvents,
          seasonCoreRankingEvents,
          expectedMainTourMinimum,
          targetCoreRankingEvents,
          selectedTournament: directCardRouteCandidate.tournament,
          selectedReason: 'adult-pathway-direct-card-amateur-route',
          candidates,
          affordableAvailable,
        }
      }
    }

    if (pathwayCounts.qSchool < qSchoolTarget) {
      const qSchoolCandidate = affordableAvailable
        .filter((candidate) => candidate.classification.isQSchool)
        .filter((candidate) => !/review|order of merit/i.test(candidate.tournament.name))
        .filter((candidate) => daysUntil(candidate.tournament.startDate, state.currentDate) <= Math.max(70, pathwayWindowLimit))
        .sort((left, right) => {
          const dateDelta = left.tournament.startDate.localeCompare(right.tournament.startDate)
          if (dateDelta !== 0) return dateDelta
          return right.score - left.score
        })[0]

      if (qSchoolCandidate) {
        return {
          currentWorldRank,
          schedulingWindowDays,
          seasonMainTourEvents,
          seasonCoreRankingEvents,
          expectedMainTourMinimum,
          targetCoreRankingEvents,
          selectedTournament: qSchoolCandidate.tournament,
          selectedReason: 'adult-pathway-q-school-campaign',
          candidates,
          affordableAvailable,
        }
      }
    }

    if (pathwayCounts.qTour < qTourTarget) {
      const qTourCandidate = affordableAvailable
        .filter((candidate) => candidate.classification.isQTour)
        .filter((candidate) => daysUntil(candidate.tournament.startDate, state.currentDate) <= pathwayWindowLimit)
        .sort((left, right) => {
          const dateDelta = left.tournament.startDate.localeCompare(right.tournament.startDate)
          if (dateDelta !== 0) return dateDelta
          return right.score - left.score
        })[0]

      if (qTourCandidate) {
        return {
          currentWorldRank,
          schedulingWindowDays,
          seasonMainTourEvents,
          seasonCoreRankingEvents,
          expectedMainTourMinimum,
          targetCoreRankingEvents,
          selectedTournament: qTourCandidate.tournament,
          selectedReason: 'adult-pathway-q-tour-volume',
          candidates,
          affordableAvailable,
        }
      }
    }
  }

  const eliteHostedPriority = affordableAvailable
    .filter((candidate) => {
      const entryAccess = getTournamentEntryAccess(state, candidate.tournament)
      return entryAccess.allowed
        && entryAccess.accessBand === 'top16'
        && isEliteHostedMainDrawTournament(candidate.tournament)
        && daysUntil(candidate.tournament.startDate, state.currentDate) <= 28
    })
    .sort((left, right) => left.tournament.startDate.localeCompare(right.tournament.startDate))[0]

  if (eliteHostedPriority) {
    return {
      currentWorldRank,
      schedulingWindowDays,
      seasonMainTourEvents,
      seasonCoreRankingEvents,
      expectedMainTourMinimum,
      targetCoreRankingEvents,
      selectedTournament: eliteHostedPriority.tournament,
      selectedReason: 'elite-hosted',
      candidates,
      affordableAvailable,
    }
  }

  if (eliteVolumeFloorEligible && seasonCoreRankingEvents < targetCoreRankingEvents) {
    const rankingWindowLimit = Math.max(currentWorldRank <= 4 && profile === 'best' ? 35 : currentWorldRank <= 4 ? 28 : 21, schedulingWindowDays)
    const rankingVolumeEvent = affordableAvailable
      .filter((candidate) => isCoreRankingEventType(candidate.tournament.type))
      .filter((candidate) => daysUntil(candidate.tournament.startDate, state.currentDate) <= rankingWindowLimit)
      .sort((left, right) => {
        const dateDelta = left.tournament.startDate.localeCompare(right.tournament.startDate)
        if (dateDelta !== 0) return dateDelta
        return right.score - left.score
      })[0]

    if (rankingVolumeEvent) {
      return {
        currentWorldRank,
        schedulingWindowDays,
        seasonMainTourEvents,
        seasonCoreRankingEvents,
        expectedMainTourMinimum,
        targetCoreRankingEvents,
        selectedTournament: rankingVolumeEvent.tournament,
        selectedReason: 'ranking-volume-floor',
        candidates,
        affordableAvailable,
      }
    }
  }

  if (currentWorldRank >= 65 && currentWorldRank <= 128 && seasonQualifierEvents === 0) {
    const survivalQualifier = affordableAvailable
      .filter((candidate) => candidate.classification.isQualifyingEvent)
      .filter((candidate) => daysUntil(candidate.tournament.startDate, state.currentDate) <= Math.max(35, schedulingWindowDays))
      .sort((left, right) => {
        const dateDelta = left.tournament.startDate.localeCompare(right.tournament.startDate)
        if (dateDelta !== 0) return dateDelta
        return right.score - left.score
      })[0]

    if (survivalQualifier) {
      return {
        currentWorldRank,
        schedulingWindowDays,
        seasonMainTourEvents,
        seasonCoreRankingEvents,
        expectedMainTourMinimum,
        targetCoreRankingEvents,
        selectedTournament: survivalQualifier.tournament,
        selectedReason: 'bottom-tour-qualifier-pathway',
        candidates,
        affordableAvailable,
      }
    }
  }

  if (seasonMainTourEvents < expectedMainTourMinimum) {
    const volumeWindowLimit = Math.max(currentWorldRank <= 4 && profile === 'best' ? 35 : currentWorldRank <= 4 ? 28 : 21, schedulingWindowDays)
    const volumeEvent = affordableAvailable
      .filter((candidate) => isProfessionalEventType(candidate.tournament.type))
      .filter((candidate) => daysUntil(candidate.tournament.startDate, state.currentDate) <= volumeWindowLimit)
      .sort((left, right) => {
        const dateDelta = left.tournament.startDate.localeCompare(right.tournament.startDate)
        if (dateDelta !== 0) return dateDelta
        return right.score - left.score
      })[0]

    const coreVolumeEvent = affordableAvailable
      .filter((candidate) => isNormalMainTourTournament(candidate.tournament))
      .filter((candidate) => daysUntil(candidate.tournament.startDate, state.currentDate) <= volumeWindowLimit)
      .sort((left, right) => {
        const dateDelta = left.tournament.startDate.localeCompare(right.tournament.startDate)
        if (dateDelta !== 0) return dateDelta
        return right.score - left.score
      })[0]

    const selectedTournament = coreVolumeEvent?.tournament ?? volumeEvent?.tournament ?? null
    if (selectedTournament) {
      return {
        currentWorldRank,
        schedulingWindowDays,
        seasonMainTourEvents,
        seasonCoreRankingEvents,
        expectedMainTourMinimum,
        targetCoreRankingEvents,
        selectedTournament,
        selectedReason: 'main-tour-volume-floor',
        candidates,
        affordableAvailable,
      }
    }
  }

  const seasonMatchLoad = state.history.tournamentHistory
    .filter((entry) => entry.season === state.season)
    .reduce((sum, entry) => sum + entry.matchesPlayed, 0)
  if (state.player.age >= 18 && state.player.age <= 30 && seasonMatchLoad < 6) {
    const supportEvent = affordableAvailable
      .filter((candidate) => {
        const tournamentType = candidate.tournament.type.toLowerCase()
        return !tournamentType.includes('major')
          && !candidate.tournament.name.toLowerCase().includes('world championship qualifying')
          && candidate.budgetCost <= Math.max(200, Math.round(state.player.cash * Math.max(0.25, config.feeTolerance)))
      })
      .sort((left, right) => left.tournament.startDate.localeCompare(right.tournament.startDate))[0]

    if (supportEvent) {
      return {
        currentWorldRank,
        schedulingWindowDays,
        seasonMainTourEvents,
        seasonCoreRankingEvents,
        expectedMainTourMinimum,
        targetCoreRankingEvents,
        selectedTournament: supportEvent.tournament,
        selectedReason: 'young-support',
        candidates,
        affordableAvailable,
      }
    }
  }

  const eventCap = getSeasonEventSelectionCap(state, currentWorldRank)
  if (seasonEnteredEvents >= eventCap) {
    return {
      currentWorldRank,
      schedulingWindowDays,
      seasonMainTourEvents,
      seasonCoreRankingEvents,
      expectedMainTourMinimum,
      targetCoreRankingEvents,
      selectedTournament: null,
      selectedReason: 'season-event-cap',
      candidates,
      affordableAvailable,
    }
  }

  return {
    currentWorldRank,
    schedulingWindowDays,
    seasonMainTourEvents,
    seasonCoreRankingEvents,
    expectedMainTourMinimum,
    targetCoreRankingEvents,
    selectedTournament: affordableAvailable[0]?.tournament ?? null,
    selectedReason: affordableAvailable[0] ? 'best-score' : 'none',
    candidates,
    affordableAvailable,
  }
}

function getWorldTournamentClassLabel(tournament: Tournament | null) {
  if (!tournament) return null
  if (isWorldChampionshipQualifyingTournament(tournament)) return 'worldChampionshipQualifying'
  if (isWorldChampionshipTournament(tournament)) return 'worldChampionshipMain'
  return tournament.type
}

function getWorldEntryRoute(mainDrawTournament: Tournament | null, qualifyingTournament: Tournament | null) {
  if (mainDrawTournament?.seasonOpenAccessLock === 'worldMainDraw') return 'worldMainDraw'
  if (qualifyingTournament?.seasonOpenAccessLock === 'worldQualifying') return 'worldQualifying'
  return 'unlocked'
}

function getCurrentWorldRank(state: GameState) {
  return state.competitionTables.world.find((row) => row.playerName === state.player.fullName)?.ranking
    ?? state.careerSystems.pro.worldRank
    ?? state.player.worldRanking
    ?? null
}

function getNormalizedWorldRank(state: GameState) {
  const rawWorldRank = getCurrentWorldRank(state)
  return rawWorldRank == null ? null : Math.max(rawWorldRank, getHistoryPerformanceRankFloor(state.history))
}

function getWorldAccessUnavailableReason(state: GameState, mainDrawTournament: Tournament | null, selectedTournament: Tournament | null) {
  const reasons: string[] = []

  if (!mainDrawTournament) {
    reasons.push('world-main-draw-missing')
  }

  if (state.player.fatigue >= 70) {
    reasons.push(`high-fatigue:${state.player.fatigue}`)
  }

  const enteredTournament = state.tournaments.find((tournament) => tournament.status === 'Entered' && tournament.id !== mainDrawTournament?.id)
  if (enteredTournament) {
    reasons.push(`entered:${enteredTournament.name}`)
  }

  if (mainDrawTournament) {
    const entryAccess = getTournamentEntryAccess(state, mainDrawTournament)
    if (!entryAccess.allowed) {
      reasons.push(entryAccess.reason ?? 'world-main-draw-access-denied')
    }
  }

  if (selectedTournament && mainDrawTournament && selectedTournament.id !== mainDrawTournament.id) {
    reasons.push(`selected:${selectedTournament.name}`)
  }

  return reasons.length > 0 ? reasons.join(' | ') : null
}

function recordWorldAccessDebugRow(
  store: WorldAccessDebugStore,
  reportBaseName: string,
  scenario: string,
  openingState: GameState,
  state: GameState,
  selectedTournament: Tournament | null,
) {
  const debugKey = getWorldAccessDebugKey(reportBaseName, state.season)
  if (!debugKey) {
    return
  }

  const seasonOpenWorldRank = getCurrentWorldRank(openingState)
  const isTop16AtSeasonOpen = (seasonOpenWorldRank ?? 999) <= 16
  const mainDrawTournament = state.tournaments.find((tournament) => isWorldChampionshipTournament(tournament)) ?? null
  const qualifyingTournament = state.tournaments.find((tournament) => isWorldChampionshipQualifyingTournament(tournament)) ?? null
  const focusTournament = mainDrawTournament ?? qualifyingTournament
  const hasWorldMainDrawLock = mainDrawTournament?.seasonOpenAccessLock === 'worldMainDraw'
  const hasWorldQualifierLock = qualifyingTournament?.seasonOpenAccessLock === 'worldQualifying'
  const previousRow = store[debugKey]?.rows.at(-1)
  const lockCreatedWeek = previousRow?.lockCreatedWeek ?? (!previousRow && hasWorldMainDrawLock ? state.week : null)
  const lockRepairedWeek = previousRow?.lockRepairedWeek ?? (previousRow && !previousRow.hasWorldMainDrawLock && hasWorldMainDrawLock ? state.week : null)
  const lockLostWeek = previousRow?.lockLostWeek ?? (previousRow && previousRow.hasWorldMainDrawLock && !hasWorldMainDrawLock ? state.week : null)
  const currentWeekWorldRank = getCurrentWorldRank(state)
  const normalizedWorldRank = getNormalizedWorldRank(state)
  const mainDrawAccess = mainDrawTournament ? getTournamentEntryAccess(state, mainDrawTournament) : null
  const worldEntryDeadlineReached = mainDrawTournament ? daysUntil(mainDrawTournament.startDate, state.currentDate) <= 35 : false
  const highCostFilterApplied = Boolean(mainDrawTournament && (mainDrawTournament.status === 'High Cost' || getTournamentBudgetCost(state, mainDrawTournament) > state.player.cash))
  const unavailableReason = getWorldAccessUnavailableReason(state, mainDrawTournament, selectedTournament)
  const record: WorldAccessDebugRecord = store[debugKey] ?? {
    target: getWorldAccessDebugLabel(reportBaseName, state.season),
    scenario,
    reportBaseName,
    season: state.season,
    rows: [],
  }

  record.rows.push({
    season: state.season,
    week: state.week,
    date: state.currentDate,
    playerAge: state.player.age,
    seasonOpenWorldRank,
    seasonCloseWorldRank: null,
    currentWeekWorldRank,
    normalizedWorldRank,
    rawWorldRankBeforeCap: currentWeekWorldRank,
    seasonOpenStatus: openingState.player.competitiveStatus ?? 'Unknown',
    currentWeekStatus: state.player.competitiveStatus ?? 'Unknown',
    seasonCloseStatus: null,
    hasTourCard: state.careerSystems.pro.hasTourCard,
    tourCardSource: state.careerSystems.pro.cardSource,
    yearsRemaining: state.careerSystems.pro.yearsRemaining,
    isTop16AtSeasonOpen,
    isTop16AtWorldEntryDeadline: worldEntryDeadlineReached && (normalizedWorldRank ?? 999) <= 16,
    isWorldMainDrawEligible: Boolean(mainDrawAccess?.allowed),
    hasWorldMainDrawLock,
    hasWorldQualifierLock,
    lockCreatedWeek,
    lockRepairedWeek,
    lockLostWeek,
    tournamentId: focusTournament?.id ?? null,
    tournamentName: focusTournament?.name ?? null,
    tournamentClass: getWorldTournamentClassLabel(focusTournament),
    accessBand: mainDrawAccess?.accessBand ?? null,
    entryRoute: getWorldEntryRoute(mainDrawTournament, qualifyingTournament),
    selectedForEntry: Boolean(selectedTournament && focusTournament && selectedTournament.id === focusTournament.id),
    skippedReason: unavailableReason,
    highCostFilterApplied,
    unavailableReason,
    finalTournamentResultRecorded: false,
  })

  store[debugKey] = record
}

function finalizeWorldAccessDebugSeason(store: WorldAccessDebugStore, reportBaseName: string, seasonReport: SeasonReport) {
  const debugKey = getWorldAccessDebugKey(reportBaseName, seasonReport.season)
  if (!debugKey || !store[debugKey]) {
    return
  }

  const recordedWorldResult = seasonReport.tournaments.some(
    (tournament) => isWorldChampionshipTournament(tournament) || isWorldChampionshipQualifyingTournament(tournament),
  )
  const finalReason = recordedWorldResult
    ? null
    : seasonReport.tournaments.some((tournament) => isWorldChampionshipTournament(tournament) || isWorldChampionshipQualifyingTournament(tournament))
      ? getWorldChampionshipSkipReason(seasonReport)
      : 'World event missing from schedule'

  store[debugKey] = {
    ...store[debugKey],
    rows: store[debugKey].rows.map((row) => ({
      ...row,
      seasonCloseWorldRank: getReportedSeasonCloseWorldRank(seasonReport),
      seasonCloseStatus: seasonReport.playerAtNextSeasonOpen.competitiveStatus,
      skippedReason: row.skippedReason ?? finalReason,
      finalTournamentResultRecorded: recordedWorldResult,
    })),
  }
}

function recordEliteEventSelectionDebugRows(
  store: EliteEventSelectionDebugStore,
  reportBaseName: string,
  scenario: string,
  openingState: GameState,
  state: GameState,
  profile: ManagedSupportProfile,
) {
  if (profile !== 'best') {
    return
  }

  const analysis = buildTournamentSelectionAnalysis(state, profile)
  const debugKey = getEliteEventSelectionDebugKey(reportBaseName, state.season)
  const record: EliteEventSelectionDebugRecord = store[debugKey] ?? {
    target: getEliteEventSelectionDebugLabel(reportBaseName, state.season),
    scenario,
    reportBaseName,
    season: state.season,
    rows: [],
  }
  const seasonOpenWorldRank = getCurrentWorldRank(openingState)

  for (const candidate of analysis.candidates) {
    if (!candidate.isCoreTracked) continue

    const selectedForEntry = analysis.selectedTournament?.id === candidate.tournament.id
    const skippedBecauseEventSelectorHitMaxEventsCap = !selectedForEntry
      && candidate.isAffordable
      && candidate.inSchedulingWindow
      && analysis.seasonMainTourEvents >= analysis.expectedMainTourMinimum
      && analysis.seasonCoreRankingEvents >= analysis.targetCoreRankingEvents
    const skippedBecauseAlreadyRankOne = analysis.currentWorldRank === 1 && skippedBecauseEventSelectorHitMaxEventsCap
    const skippedBecauseRestFatigueRule = state.player.fatigue >= 70 || (candidate.tournament.fatigueRisk === 'High' && state.player.fatigue >= 55)
    const reasons: string[] = []

    if (selectedForEntry) reasons.push('selected-for-entry')
    if (!candidate.isAffordable) reasons.push('budget/high-cost')
    if (!candidate.inSchedulingWindow) reasons.push('outside-selection-window')
    if (skippedBecauseRestFatigueRule) reasons.push(`rest-fatigue:${state.player.fatigue}`)
    if (analysis.selectedTournament && analysis.selectedTournament.id !== candidate.tournament.id) reasons.push(`selected:${analysis.selectedTournament.name}`)
    if (skippedBecauseEventSelectorHitMaxEventsCap) reasons.push('selector-volume-cap-reached')
    if (candidate.classificationError) reasons.push('classification-mismatch')

    record.rows.push({
      season: state.season,
      week: state.week,
      date: state.currentDate,
      playerAge: state.player.age,
      seasonOpenWorldRank,
      seasonCloseWorldRank: null,
      currentWeekWorldRank: analysis.currentWorldRank,
      seasonOpenStatus: openingState.player.competitiveStatus ?? 'Unknown',
      currentWeekStatus: state.player.competitiveStatus ?? 'Unknown',
      seasonCloseStatus: null,
      confidence: state.player.confidence,
      fatigue: state.player.fatigue,
      unavailableStatus: skippedBecauseRestFatigueRule ? 'rest/fatigue' : 'available',
      tournamentId: candidate.tournament.id,
      tournamentName: candidate.tournament.name,
      tournamentClass: candidate.classification.tournamentClass,
      reportingClass: candidate.classification.reportingClass,
      eventDate: candidate.tournament.startDate,
      isRankingEvent: candidate.classification.isRankingEvent,
      isMajor: candidate.classification.isMajor,
      isInvitational: candidate.classification.isEliteInvitational,
      isPlayersSeries: candidate.classification.isPlayersSeries,
      isCoreProEvent: candidate.classification.isMainTourEvent,
      inSchedulingWindow: candidate.inSchedulingWindow,
      eventPriorityScore: candidate.score,
      fatigueCost: candidate.fatigueCost,
      expectedPrize: candidate.expectedPrize,
      rankingValue: candidate.tournament.rankingValue,
      selectedForEntry,
      selectedTournamentName: analysis.selectedTournament?.name ?? null,
      selectedReason: analysis.selectedReason,
      enteredEventCountAtDecision: analysis.seasonMainTourEvents,
      rankingEventCountAtDecision: analysis.seasonCoreRankingEvents,
      expectedMainTourMinimum: analysis.expectedMainTourMinimum,
      targetCoreRankingEvents: analysis.targetCoreRankingEvents,
      skippedBecauseAlreadyRankOne,
      skippedBecauseEventSelectorHitMaxEventsCap,
      skippedBecauseRestFatigueRule,
      skippedBecauseClassificationError: candidate.classificationError,
      reasonSkipped: reasons.length > 0 ? reasons.join(' | ') : null,
      finalTournamentResultRecorded: false,
    })
  }

  store[debugKey] = record
}

function finalizeEliteEventSelectionDebugSeason(
  store: EliteEventSelectionDebugStore,
  reportBaseName: string,
  seasonReport: SeasonReport,
) {
  const debugKey = getEliteEventSelectionDebugKey(reportBaseName, seasonReport.season)
  if (!store[debugKey]) {
    return
  }

  const enteredTournamentIds = new Set(seasonReport.tournaments.map((tournament) => tournament.tournamentId))
  store[debugKey] = {
    ...store[debugKey],
    rows: store[debugKey].rows.map((row) => ({
      ...row,
      seasonCloseWorldRank: getReportedSeasonCloseWorldRank(seasonReport),
      seasonCloseStatus: seasonReport.playerAtNextSeasonOpen.competitiveStatus,
      finalTournamentResultRecorded: enteredTournamentIds.has(row.tournamentId),
    })),
  }
}

function buildEliteEventSelectionDebugMarkdown(report: SimulationReport, store: EliteEventSelectionDebugStore) {
  const recordsBySeason = new Map(Object.values(store)
    .filter((record) => record.reportBaseName === getSupportReportBaseName(report.seasonsRequested, 'best'))
    .map((record) => [record.season, record]))
  const lines: string[] = [
    '# Elite Event Selection Debug',
    '',
    `Generated: ${report.generatedAt}`,
    `Scenario: ${report.scenario}`,
    '- Debug rows are captured for max-support runs only.',
    '- Fatigue cost is ordinal from tournament fatigue risk: Low=1, Medium=2, High=3.',
  ]

  const flaggedSeasons = report.seasons.filter((season) => {
    const record = recordsBySeason.get(season.season)
    if (!record || record.rows.length === 0) {
      return false
    }

    const openRank = getReportedSeasonOpenWorldRank(season) ?? 999
    const closeRank = getReportedSeasonCloseWorldRank(season) ?? 999
    const closeStatus = `${season.playerAtNextSeasonOpen.competitiveStatus ?? ''}`
    const proEvents = getProfessionalEventsEntered(season.playerEntries)
    const proRelevantSeason = season.pathway.seasonOpen.hasTourCard || season.pathway.nextSeasonOpen.hasTourCard || proEvents > 0
    if (!proRelevantSeason) {
      return false
    }

    return openRank === 1
      || closeRank === 1
      || openRank <= 16
      || closeRank <= 16
      || /world champion/i.test(closeStatus)
      || proEvents < 8
      || season.playerEntries.rankingEventsEntered < 4
  })

  if (flaggedSeasons.length === 0) {
    lines.push('')
    lines.push('No flagged elite max-support seasons were captured.')
    return `${lines.join('\n')}\n`
  }

  for (const season of flaggedSeasons) {
    const record = recordsBySeason.get(season.season)
    const seasonOpenRank = getReportedSeasonOpenWorldRank(season) ?? 999
    const calendarEntryById = new Map(season.calendar.entries.map((entry) => [entry.tournamentId, entry]))
    const latestRowsByTournament = new Map<string, EliteEventSelectionDebugRow>()
    for (const row of record?.rows ?? []) {
      latestRowsByTournament.set(row.tournamentId, row)
    }

    const eventRows = [...latestRowsByTournament.values()]
      .sort((left, right) => left.eventDate.localeCompare(right.eventDate) || left.tournamentName.localeCompare(right.tournamentName))
    const eligibleRows = eventRows
      .filter((row) => row.isCoreProEvent || row.isMajor || row.isInvitational || row.isPlayersSeries)
      .filter((row) => calendarEntryById.has(row.tournamentId))
      .filter((row) => !(seasonOpenRank <= 16 && /qualifier|qualifying/i.test(row.tournamentName) && row.tournamentClass !== 'World Championship Qualifying'))
    const eligibleRankingEvents = eligibleRows.filter((row) => row.isRankingEvent)
    const eligibleMajors = eligibleRows.filter((row) => row.isMajor)
    const eligibleInvitationals = eligibleRows.filter((row) => row.isInvitational)
    const eligiblePlayersSeries = eligibleRows.filter((row) => row.isPlayersSeries)
    const enteredTournamentIds = new Set(
      season.calendar.entries
        .filter((entry) => entry.humanEntered)
        .map((entry) => entry.tournamentId),
    )
    const skippedRankingEvents = eligibleRankingEvents.filter((row) => !enteredTournamentIds.has(row.tournamentId))
    const skippedMajorEvents = eligibleMajors.filter((row) => !enteredTournamentIds.has(row.tournamentId))
    const skippedPlayersSeriesEvents = eligiblePlayersSeries.filter((row) => !enteredTournamentIds.has(row.tournamentId))
    const averageFatigue = record?.rows.length ? averageMetric(record.rows.map((row) => row.fatigue)) ?? 0 : (season.playerAtNextSeasonOpen.fatigue ?? 0)
    const averageConfidence = record?.rows.length ? averageMetric(record.rows.map((row) => row.confidence)) ?? 0 : (season.playerAtNextSeasonOpen.confidence ?? 0)

    lines.push('')
    lines.push(`## ${season.season}`)
    lines.push(`- age: ${season.playerAtNextSeasonOpen.age}`)
    lines.push(`- open rank: ${formatCount(getReportedSeasonOpenWorldRank(season))}`)
    lines.push(`- close rank: ${formatCount(getReportedSeasonCloseWorldRank(season))}`)
    lines.push(`- status: ${season.playerAtNextSeasonOpen.competitiveStatus}`)
    lines.push(`- fatigue average: ${averageFatigue.toFixed(1)}`)
    lines.push(`- confidence average: ${averageConfidence.toFixed(1)}`)
    lines.push(`- injury/unavailable status: ${eligibleRows.some((row) => row.unavailableStatus !== 'available') ? 'yes' : 'no'}`)
    lines.push(`- total eligible events: ${eligibleRows.length}`)
    lines.push(`- eligible ranking events: ${eligibleRankingEvents.length}`)
    lines.push(`- eligible majors: ${eligibleMajors.length}`)
    lines.push(`- eligible invitationals: ${eligibleInvitationals.length}`)
    lines.push(`- eligible Players Series: ${eligiblePlayersSeries.length}`)
    lines.push(`- events entered: ${getProfessionalEventsEntered(season.playerEntries)}`)
    lines.push(`- ranking events entered: ${season.playerEntries.rankingEventsEntered}`)
    lines.push(`- majors entered: ${season.playerEntries.majorsEntered}`)
    lines.push(`- invitationals entered: ${season.playerEntries.eliteInvitationalsEntered}`)
    lines.push(`- Players Series entered: ${season.playerEntries.playersSeriesEntered}`)
    lines.push(`- skipped core ranking events: ${skippedRankingEvents.length}`)
    lines.push(`- skipped major events: ${skippedMajorEvents.length}`)
    lines.push(`- skipped Players Series events: ${skippedPlayersSeriesEvents.length}`)
    lines.push('')
    lines.push('| Event | Date | Entered | Tournament Class | Priority Score | Fatigue Cost | Expected Prize | Ranking Value | Reason Skipped | Rank #1 Skip | Selector Cap | Rest/Fatigue | Classification Error |')
    lines.push('| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |')
    for (const row of eligibleRows) {
      const entered = enteredTournamentIds.has(row.tournamentId)
      lines.push(`| ${row.tournamentName} | ${row.eventDate} | ${formatFlag(entered)} | ${row.tournamentClass} | ${row.eventPriorityScore} | ${row.fatigueCost} | ${formatCurrency(row.expectedPrize)} | ${row.rankingValue} | ${entered ? 'entered' : row.reasonSkipped ?? 'not-entered'} | ${formatFlag(row.skippedBecauseAlreadyRankOne)} | ${formatFlag(row.skippedBecauseEventSelectorHitMaxEventsCap)} | ${formatFlag(row.skippedBecauseRestFatigueRule)} | ${formatFlag(row.skippedBecauseClassificationError)} |`)
    }
  }

  return `${lines.join('\n')}\n`
}

function writeEliteEventSelectionDebug(report: SimulationReport, store: EliteEventSelectionDebugStore) {
  writeEliteEventSelectionDebugStore(store)
  fs.writeFileSync(eliteEventSelectionDebugPath, buildEliteEventSelectionDebugMarkdown(report, store))
}

function hasSeasonOpenWorldMainDrawExpectation(season: SeasonReport) {
  const seasonOpenStatus = `${season.playerAtSeasonOpen.competitiveStatus ?? season.playerAtSeasonOpen.careerStage}`.toLowerCase()
  const seasonOpenWorldRank = getReportedSeasonOpenWorldRank(season) ?? 999
  const hasEliteOpeningStatus = /top 16|major contender|world champion/.test(seasonOpenStatus)
  const hasEliteOpeningPathway = seasonOpenWorldRank <= 16

  return season.pathway.seasonOpen.hasTourCard && (
    hasEliteOpeningStatus && hasEliteOpeningPathway
  )
}

function getWorldChampionshipSkipReason(season: SeasonReport) {
  const worldMainDrawEntry = season.tournaments.find((tournament) => hasWorldChampionshipMainDrawEntry(tournament))
  if (worldMainDrawEntry) return null

  const worldQualifyingEntry = season.tournaments.find((tournament) => hasWorldChampionshipQualifyingEntry(tournament))
  if (worldQualifyingEntry) {
    return `entered qualifying instead (${worldQualifyingEntry.result})`
  }

  const worldStartDate = season.tournaments
    .find((tournament) => isWorldChampionshipTournament(tournament) || isWorldChampionshipQualifyingTournament(tournament))
    ?.startDate

  if (worldStartDate) {
    const blockingTournament = season.tournaments
      .filter((tournament) => hasTournamentParticipation(tournament))
      .filter((tournament) => tournament.startDate < worldStartDate)
      .filter((tournament) => !isWorldChampionshipTournament(tournament) && !isWorldChampionshipQualifyingTournament(tournament))
      .sort((left, right) => right.startDate.localeCompare(left.startDate))[0]

    if (blockingTournament) {
      return `late-season overlap after ${blockingTournament.name} (${blockingTournament.result})`
    }
  }

  return 'season-open main-draw access was available but no World Championship entry was recorded'
}

function formatWorldChampionshipWarningDetail(detail: WorldChampionshipWarningDetail) {
  return `${detail.season} (open #${detail.seasonOpenWorldRank ?? 'n/a'}, close #${detail.seasonCloseWorldRank ?? 'n/a'}, open status ${detail.seasonOpenStatus}, close status ${detail.seasonCloseStatus}, main draw ${detail.hadWorldMainDrawEntry ? 'yes' : 'no'}, qualifying ${detail.hadWorldQualifyingEntry ? 'yes' : 'no'}, reason ${detail.reasonSkippedWorldMainDraw ?? 'n/a'})`
}

function getTourCardValidity(isTourCardHolder: boolean, worldRank: number | null, yearsRemaining: number, retainedViaRanking = false) {
  return retainedViaRanking || (worldRank ?? 999) <= 64 || (isTourCardHolder && yearsRemaining > 0)
}

function getSeasonRoundsRemaining(entryRound: TournamentRound) {
  const entryIndex = TOURNAMENT_ROUND_ORDER.indexOf(entryRound)
  if (entryIndex === -1) return 1
  return Math.max(1, TOURNAMENT_ROUND_ORDER.length - entryIndex)
}

function getProtectedWorldChampionshipEvent(state: GameState) {
  const inferredWorldRank = state.careerSystems.pro.worldRank
    ?? state.competitionTables.world.find((row) => row.playerName === state.player.fullName)?.ranking
    ?? state.player.worldRanking
    ?? 999
  const inferredStatus = `${state.player.competitiveStatus ?? state.player.careerStage}`.toLowerCase()
  const inferredTier = `${state.careerSystems.pro.currentTier ?? ''}`.toLowerCase()
  const inferredSurvival = `${state.careerSystems.pro.tourSurvivalStatus ?? ''}`.toLowerCase()
  const hasMainTourStatus = state.careerSystems.pro.hasTourCard && inferredWorldRank <= 128
  const inferredMainDrawLock = hasMainTourStatus && (
    inferredWorldRank <= 16
    || /top 16|major contender|world champion/.test(inferredStatus)
    || /top 16/.test(inferredTier)
    || /top 16/.test(inferredSurvival)
  )
  const inferredQualifyingLock = !inferredMainDrawLock && hasMainTourStatus

  const mainDrawTournament = state.tournaments.find(
    (entry) => isWorldChampionshipTournament(entry)
      && (entry.seasonOpenAccessLock === 'worldMainDraw' || (entry.seasonOpenAccessLock == null && inferredMainDrawLock))
      && (entry.status === 'Available' || entry.status === 'High Cost' || entry.status === 'Booked')
      && entry.startDate >= state.currentDate,
  )
  if (mainDrawTournament) return mainDrawTournament

  const qualifyingTournament = state.tournaments.find(
    (entry) => isWorldChampionshipQualifyingTournament(entry)
      && (entry.seasonOpenAccessLock === 'worldQualifying' || (entry.seasonOpenAccessLock == null && inferredQualifyingLock))
      && (entry.status === 'Available' || entry.status === 'High Cost' || entry.status === 'Booked')
      && entry.startDate >= state.currentDate,
  )

  return qualifyingTournament ?? null
}

function wouldBlockProtectedWorldChampionship(state: GameState, tournament: Tournament) {
  if (isWorldChampionshipTournament(tournament) || isWorldChampionshipQualifyingTournament(tournament)) {
    return false
  }

  const protectedWorld = getProtectedWorldChampionshipEvent(state)
  if (!protectedWorld) {
    return false
  }

  if (tournament.startDate >= protectedWorld.startDate) {
    return true
  }

  const projectedStart = tournament.startDate > state.currentDate ? tournament.startDate : state.currentDate
  const projectedFinish = addDaysToDateString(projectedStart, getSeasonRoundsRemaining(getTournamentEntryRound(state, tournament)) * 7)
  return projectedFinish > addDaysToDateString(protectedWorld.startDate, -7)
}

function getAiTwoYearSummary(record: NonNullable<GameState['worldPlayers'][number]>, season: string) {
  const seasonIndex = record.seasons.findIndex((entry) => entry.season === season)
  const relevantSeasons = (seasonIndex >= 0 ? record.seasons.slice(seasonIndex, seasonIndex + 2) : record.seasons.slice(0, 2))
  const recentSeason = relevantSeasons[0] ?? null

  return {
    recentSeasonWins: recentSeason?.proWins ?? recentSeason?.wins ?? 0,
    twoYearWins: relevantSeasons.reduce((sum, entry) => sum + entry.proWins, 0),
    twoYearPrizeMoney: relevantSeasons.reduce((sum, entry) => sum + entry.prizeMoney, 0),
    titlesLastTwoYears: relevantSeasons.reduce((sum, entry) => sum + entry.titles, 0),
    majorFinalsLastTwoYears: null as number | null,
  }
}

function getHumanTwoYearSummary(history: GameState['history']) {
  const seasonLabels = Array.from(new Set(history.tournamentHistory.map((entry) => entry.season)))
    .sort((left, right) => {
      const leftYear = Number.parseInt(left.split('/')[0] ?? '', 10) || 0
      const rightYear = Number.parseInt(right.split('/')[0] ?? '', 10) || 0
      return rightYear - leftYear
    })
  const relevantSeasons = new Set(seasonLabels.slice(0, 2))
  const entries = history.tournamentHistory.filter((entry) => relevantSeasons.has(entry.season) && isProfessionalEventType(entry.eventType))

  return {
    recentSeasonWins: history.seasonRecords[0]?.wins ?? 0,
    twoYearWins: entries.reduce((sum, entry) => sum + entry.wins, 0),
    twoYearPrizeMoney: entries.reduce((sum, entry) => sum + entry.prizeMoney, 0),
    majorFinalsLastTwoYears: entries.filter((entry) => isMajorStyleTournament({ name: entry.tournamentName, type: entry.eventType ?? '' }) && getHistoryEntryResultTier(entry) >= 4).length,
    titlesLastTwoYears: entries.filter((entry) => entry.result === 'Winner').length,
  }
}

function getAiStallReason(record: NonNullable<GameState['worldPlayers'][number]>, summary: ReturnType<typeof getAiTwoYearSummary>, row: Pick<PlayerSnapshotRow, 'age' | 'confidence' | 'fatigue' | 'actualCircuit' | 'isOnMainTour'>) {
  if ((summary.twoYearWins ?? 0) <= 2) return 'low match volume'
  if ((row.confidence ?? 100) <= 45) return 'poor confidence'
  if ((row.fatigue ?? 0) >= 70) return 'high fatigue'
  if (row.actualCircuit === 'qSchool') return 'failed Q School campaigns'
  if (!row.isOnMainTour && ['qTour', 'amateur', 'youth'].includes(row.actualCircuit)) return 'no tour access'
  if (row.age >= 33) return 'age decline'
  return 'random development failure'
}

function getCorrectedAiLifecycleState(record: NonNullable<GameState['worldPlayers'][number]>, worldRank: number | null, actualCircuit: string) {
  const reasons: string[] = []
  let competitiveStatus: string | null = null
  let correctedCircuit = actualCircuit
  let correctedTourCardSource = record.cardSource
  let correctedIsOnMainTour = record.hasTourCard && (worldRank ?? 999) <= 128
  let correctedIsTourCardHolder = record.hasTourCard

  const activeProtection = record.hasTourCard && record.yearsRemaining > 0 && !record.retainedViaRanking
  const expiredCard = !record.retainedViaRanking && (!record.hasTourCard || record.yearsRemaining <= 0)

  if (expiredCard && (worldRank ?? 999) <= 64) {
    competitiveStatus = 'Tour Survivor / Top 64'
    correctedTourCardSource = 'Ranking Retained'
    correctedIsOnMainTour = true
    correctedIsTourCardHolder = true
    reasons.push('converted expired rookie card to ranking retention')
  }

  if (expiredCard && (worldRank ?? 999) > 64) {
    correctedIsOnMainTour = false
    correctedIsTourCardHolder = false
    correctedTourCardSource = null
    if (actualCircuit === 'mainTour') {
      correctedCircuit = (worldRank ?? 999) <= 96 ? 'qSchool' : 'qTour'
      reasons.push('removed expired card holder from main tour')
    }
  }

  if (!activeProtection && !record.retainedViaRanking && !correctedIsOnMainTour && correctedCircuit === 'mainTour') {
    correctedCircuit = (worldRank ?? 999) <= 96 ? 'qSchool' : 'qTour'
    reasons.push('reclassified off-tour rookie to feeder circuit')
  }

  return {
    competitiveStatus,
    actualCircuit: correctedCircuit,
    isOnMainTour: correctedIsOnMainTour,
    isTourCardHolder: correctedIsTourCardHolder,
    tourCardSource: correctedTourCardSource,
    lifecycleCorrectionApplied: reasons.length > 0,
    lifecycleReasons: reasons,
  }
}

function isEliteHostedMainDrawTournament(tournament: Pick<Tournament, 'name' | 'type'>) {
  return (/world championship$/i.test(tournament.name) || /masters|uk major|uk championship|tour championship|champion of champions|elite season opener/i.test(tournament.name))
    && !/qualifying/i.test(tournament.name)
    && tournament.type !== 'Q School'
}

function getTournamentBudgetCost(state: GameState, tournament: Tournament) {
  const access = getTournamentEntryAccess(state, tournament)
  const entryCost = getTournamentEntryCashRequirement(state, tournament)
  const hostedTravelShare = access.accessBand === 'top16' && isEliteHostedMainDrawTournament(tournament)
    ? Math.round((tournament.travelCost + tournament.hotelCost) * 0.25)
    : tournament.travelCost + tournament.hotelCost

  return entryCost + hostedTravelShare
}

function getExpectedMainTourMinimum(worldRank: number) {
  if (worldRank <= 16) return 12
  if (worldRank <= 32) return 9
  if (worldRank <= 64) return 6
  if (worldRank <= 128) return 4
  return 0
}

function isCoreRankingEventType(eventType: string | undefined) {
  return /major|ranking|professional|professional tour/i.test(eventType ?? '') && !/invitational/i.test(eventType ?? '')
}

function getTournamentSelectionWindowDays(worldRank: number) {
  if (worldRank <= 16) return 21
  if (worldRank <= 32) return 21
  if (worldRank <= 64) return 28
  if (worldRank <= 128) return 21
  return 21
}

function getProfessionalEventsEntered(summary: PlayerEventSummary) {
  return Math.max(
    0,
    summary.totalTournamentsEntered
      - summary.qTourEventsEntered
      - summary.qSchoolEventsEntered
      - summary.amateurEventsEntered
      - summary.youthEventsEntered
      - summary.seniorEventsEntered,
  )
}

function getBestFinishLabel(tournaments: SeasonReport['tournaments']) {
  if (tournaments.some((tournament) => /winner/i.test(tournament.result))) return 'Winner'
  if (tournaments.some((tournament) => /final/i.test(tournament.result))) return 'Final'
  if (tournaments.some((tournament) => /semi/i.test(tournament.result))) return 'Semi Final'
  if (tournaments.some((tournament) => /quarter/i.test(tournament.result))) return 'Quarter Final'
  if (tournaments.some((tournament) => /last 16/i.test(tournament.result))) return 'Last 16'
  return 'No main draw win'
}

function getConfirmedWorldChampionshipWinsFromHistory(history?: GameState['history']) {
  return history?.tournamentHistory.filter(
    (entry) => isWorldChampionshipMainDrawName(entry.tournamentName) && entry.result === 'Winner',
  ).length ?? 0
}

function getReportedCompetitiveStatus(existingStatus: string, worldRanking: number | null | undefined, history?: GameState['history']) {
  if (/world champion/i.test(existingStatus)) {
    if (getConfirmedWorldChampionshipWinsFromHistory(history) >= 1) {
      return 'World Champion'
    }
    if ((worldRanking ?? 999) <= 16) return 'Top 16 Elite Player'
    if ((worldRanking ?? 999) <= 32) return 'Top 32 Professional'
    if ((worldRanking ?? 999) <= 64) return existingStatus.includes('Rookie Pro') ? 'Rookie Pro / At Risk' : 'Tour Survivor / Top 64'
    if ((worldRanking ?? 999) <= 128) return 'Bottom Tour / At Risk'
    return 'Amateur'
  }

  if (/senior tour/i.test(existingStatus)) {
    return existingStatus
  }

  if (/major contender/i.test(existingStatus) && (worldRanking ?? 999) <= 16) {
    return existingStatus
  }

  if ((worldRanking ?? 999) <= 16) return 'Top 16 Elite Player'
  if ((worldRanking ?? 999) <= 32) return 'Top 32 Professional'
  if ((worldRanking ?? 999) <= 64) return existingStatus.includes('Rookie Pro') ? 'Rookie Pro / At Risk' : 'Tour Survivor / Top 64'
  if ((worldRanking ?? 999) <= 128) return 'Bottom Tour / At Risk'
  return 'Amateur'
}

function getCurrentRanking(state: GameState) {
  const rawRanking = state.rankings.find((row) => row.playerName === state.player.fullName)?.ranking ?? state.player.amateurRanking ?? state.player.worldRanking ?? 999
  return state.player.rankingLabel === 'World Ranking' ? Math.max(rawRanking, getHistoryPerformanceRankFloor(state.history)) : rawRanking
}

function snapshotPlayer(state: GameState): SeasonPlayerSnapshot {
  const overall = calculateOverallRating({
    attributes: state.attributes,
    personalityTraits: state.player.personalityTraits,
    playingStyle: state.player.playingStyle,
  })
  const rawWorldRanking = state.careerSystems.pro.worldRank ?? state.player.worldRanking
  const worldRanking = rawWorldRanking != null ? Math.max(rawWorldRanking, getHistoryPerformanceRankFloor(state.history)) : rawWorldRanking
  const amateurRanking = state.player.rankingLabel === 'World Ranking'
    ? null
    : state.player.amateurRanking
  const seniorRanking = state.player.rankingLabel === 'Senior Ranking'
    ? state.player.seniorRanking ?? state.competitionTables.senior.find((row) => row.playerName === state.player.fullName)?.ranking ?? null
    : null
  const isRetired = state.careerSystems.lateCareer.retired
  const competitiveStatus = isRetired
    ? 'Retired'
    : getReportedCompetitiveStatus(state.player.competitiveStatus ?? state.player.careerStage, worldRanking, state.history)

  return {
    age: state.player.age,
    careerPhase: isRetired ? 'Retired' : state.player.careerPhase ?? 'Amateur',
    competitiveStatus,
    careerStage: competitiveStatus,
    rankingLabel: isRetired ? 'Retired' : state.player.rankingLabel,
    worldRanking,
    amateurRanking,
    seniorRanking,
    cash: state.player.cash,
    weeklyCashFlow: state.finance.cashFlow,
    confidence: state.player.confidence,
    fatigue: state.player.fatigue,
    morale: state.player.morale,
    reputation: state.player.reputation,
    overall,
    potential: calculatePotentialRating({
      attributes: state.attributes,
      personalityTraits: state.player.personalityTraits,
      age: state.player.age,
      playingStyle: state.player.playingStyle,
      personalityType: state.player.personalityType,
      overallRating: overall,
    }),
  }
}

function normalizeSnapshotForReportedRank(snapshot: SeasonPlayerSnapshot, rankingLabel: string, ranking: number, history?: GameState['history']) {
  if (rankingLabel !== 'World Ranking') {
    return snapshot
  }

  const adjustedRanking = Math.max(ranking, history ? getHistoryPerformanceRankFloor(history) : 1)
  const competitiveStatus = getReportedCompetitiveStatus(snapshot.competitiveStatus, adjustedRanking, history)

  return {
    ...snapshot,
    worldRanking: adjustedRanking,
    competitiveStatus,
    careerStage: competitiveStatus,
  }
}

function getCompetitionRank(state: GameState, key: keyof CircuitSnapshot | 'oneYear') {
  return state.competitionTables[key].find((row) => row.playerName === state.player.fullName)?.ranking ?? null
}

function snapshotPathwayState(state: GameState): PathwaySnapshot {
  const rawWorldRank = state.careerSystems.pro.worldRank ?? getCompetitionRank(state, 'world') ?? state.player.worldRanking ?? null
  const adjustedWorldRank = rawWorldRank == null ? null : Math.max(rawWorldRank, getHistoryPerformanceRankFloor(state.history))

  return {
    worldRank: adjustedWorldRank,
    oneYearRank: state.careerSystems.pro.oneYearRank ?? getCompetitionRank(state, 'oneYear'),
    amateurRank: getCompetitionRank(state, 'amateur') ?? state.player.amateurRanking ?? null,
    qTourRank: state.careerSystems.qTour.playerRank ?? getCompetitionRank(state, 'qTour'),
    qSchoolRank: state.careerSystems.qSchool.playerRank ?? getCompetitionRank(state, 'qSchool'),
    hasTourCard: state.careerSystems.pro.hasTourCard,
    cardSource: state.careerSystems.pro.cardSource,
    currentYear: state.careerSystems.pro.currentYear,
    yearsRemaining: state.careerSystems.pro.yearsRemaining,
    expiresAfterSeason: state.careerSystems.pro.expiresAfterSeason,
    currentTier: state.careerSystems.pro.currentTier,
    tourSurvivalStatus: state.careerSystems.pro.tourSurvivalStatus,
    qTourEligibilityScore: state.careerSystems.qTour.eligibilityScore,
    qTourTop2Streak: state.careerSystems.qTour.top2Streak,
    qTourPlayOffEligible: state.careerSystems.qTour.playOffEligible,
    qSchoolEligibilityScore: state.careerSystems.qSchool.eligibilityScore,
    qSchoolCampaignEligible: state.careerSystems.qSchool.campaignEligible,
    qSchoolSeededCampaign: state.careerSystems.qSchool.seededCampaign,
    qSchoolDirectPlayoffEligible: state.careerSystems.qSchool.directPlayoffEligible,
    qSchoolEligibilitySeasonsRemaining: state.careerSystems.qSchool.eligibilitySeasonsRemaining,
    qSchoolCooldownSeasonsRemaining: state.careerSystems.qSchool.cooldownSeasonsRemaining,
    qSchoolQualifiedBy: state.careerSystems.qSchool.qualifiedBy,
  }
}

function snapshotSupportSetup(state: GameState): SupportSetupSnapshot {
  const coachNames = state.coachContracts
    .map((contract) => state.coaches.find((coach) => coach.id === contract.coachId)?.name ?? coachCatalog.find((coach) => coach.id === contract.coachId)?.name ?? contract.coachId)
  const cueName = state.equipment.currentCueId
    ? cueMarketplaceCatalog.find((cue) => cue.id === state.equipment.currentCueId)?.name ?? state.equipment.currentCueId
    : null
  const chalkName = state.equipment.currentChalkId
    ? chalkCatalog.find((chalk) => chalk.id === state.equipment.currentChalkId)?.name ?? state.equipment.currentChalkId
    : null
  const tipName = state.equipment.currentTipId
    ? tipCatalog.find((tip) => tip.id === state.equipment.currentTipId)?.name ?? state.equipment.currentTipId
    : null

  return {
    coachCount: state.coachContracts.length,
    coachWeeklyCost: getCoachWeeklyCost(state),
    coachNames,
    cueName,
    chalkName,
    tipName,
    cueBonus: getCurrentCueBonus(state),
    preparationBonus: getEquipmentPreparationBonus(state),
  }
}

function buildTourCardMovementSummary(openingState: GameState, nextSeasonState: GameState): TourCardMovementSummary {
  const openingHolders = openingState.worldPlayers.filter((player) => player.hasTourCard).map((player) => player.playerName)
  const nextSeasonHolders = nextSeasonState.worldPlayers.filter((player) => player.hasTourCard).map((player) => player.playerName)
  const openingSet = new Set(openingHolders)
  const nextSet = new Set(nextSeasonHolders)
  const gainedNames = nextSeasonHolders.filter((name) => !openingSet.has(name)).sort((left, right) => left.localeCompare(right))
  const lostNames = openingHolders.filter((name) => !nextSet.has(name)).sort((left, right) => left.localeCompare(right))

  return {
    holdersAtSeasonOpen: openingHolders.length,
    holdersAtNextSeasonOpen: nextSeasonHolders.length,
    gainedCount: gainedNames.length,
    lostCount: lostNames.length,
    gainedNames: gainedNames.slice(0, 8),
    lostNames: lostNames.slice(0, 8),
  }
}

function captureCircuits(state: GameState): CircuitSnapshot {
  return {
    world: state.competitionTables.world.map((row) => row.playerName),
    youth: state.competitionTables.youth.map((row) => row.playerName),
    amateur: state.competitionTables.amateur.map((row) => row.playerName),
    qTour: state.competitionTables.qTour.map((row) => row.playerName),
    qSchool: state.competitionTables.qSchool.map((row) => row.playerName),
    senior: state.competitionTables.senior.map((row) => row.playerName),
  }
}

function createEmptyFinanceBreakdown(): FinanceBreakdown {
  return {
    prizeMoney: 0,
    sponsorIncome: 0,
    coachingStaffCosts: 0,
    facilityCosts: 0,
    equipmentMaintenance: 0,
    tournamentEntryFees: 0,
    travelHotelCosts: 0,
    treatmentRecoveryCosts: 0,
    other: 0,
  }
}

function cloneFinanceBreakdown(breakdown: FinanceBreakdown): FinanceBreakdown {
  return { ...breakdown }
}

function getSponsorWeeklyIncome(state: GameState) {
  return Math.round(state.sponsors.reduce((sum, sponsor) => sum + sponsor.monthlyValue, 0) / 4)
}

function getCoachWeeklyCost(state: GameState) {
  return state.coachContracts.reduce((sum, contract) => sum + contract.weeklyCost, 0)
}

function getFacilityWeeklyRental(state: GameState) {
  const facility = state.equipment.currentTableId
    ? tableSetupCatalog.find((item) => item.id === state.equipment.currentTableId) ?? null
    : null

  return facility ? Math.round(facility.monthlyRental / 4) : 0
}

function recordCashDelta(breakdown: FinanceBreakdown, category: keyof FinanceBreakdown, previousState: GameState, nextState: GameState) {
  breakdown[category] += nextState.player.cash - previousState.player.cash
}

function recordWeeklyFinanceDelta(breakdown: FinanceBreakdown, previousState: GameState, nextState: GameState) {
  const sponsorIncome = getSponsorWeeklyIncome(previousState)
  const coachCosts = getCoachWeeklyCost(previousState)
  const facilityCosts = getFacilityWeeklyRental(previousState)
  const baseAllowance = previousState.finance.baseCashFlow
  const fixedCashDelta = baseAllowance + sponsorIncome - coachCosts - facilityCosts
  const actualCashDelta = nextState.player.cash - previousState.player.cash
  const residualDelta = actualCashDelta - fixedCashDelta

  breakdown.sponsorIncome += sponsorIncome
  breakdown.coachingStaffCosts -= coachCosts
  breakdown.facilityCosts -= facilityCosts
  breakdown.other += baseAllowance

  if (residualDelta > 0) {
    breakdown.prizeMoney += residualDelta
  } else if (residualDelta < 0) {
    breakdown.other += residualDelta
  }
}

function diffCircuit(previous: string[], current: string[]): CircuitMovement {
  const previousSet = new Set(previous)
  const currentSet = new Set(current)
  const entrants = current.filter((name) => !previousSet.has(name))
  const leavers = previous.filter((name) => !currentSet.has(name))

  return {
    count: entrants.length + leavers.length,
    entrants,
    leavers,
  }
}

function daysUntil(startDate: string, currentDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`)
  const current = new Date(`${currentDate}T00:00:00Z`)
  return Math.round((start.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))
}

function scoreTournament(state: GameState, tournament: Tournament, profile: ManagedSupportProfile = 'middle') {
  const config = SUPPORT_PROFILE_CONFIGS[profile]
  const rankingLabel = state.player.rankingLabel.toLowerCase()
  const careerStage = state.player.careerStage.toLowerCase()
  const rankingType = (tournament.rankingType ?? '').toLowerCase()
  const tournamentType = tournament.type.toLowerCase()
  let score = 0

  if (tournamentType.includes('q school')) {
    if (state.careerSystems.qSchool.directPlayoffEligible) score += 220
    else if (state.careerSystems.qSchool.seededCampaign) score += 180
    else if (state.careerSystems.qSchool.campaignEligible) score += 145
    else score -= 260
  }

  if (isDirectAmateurTourCardRouteForTournament(tournament)) {
    score += 165
    if (/wsf|ebsa|asia-pacific federation|asia pacific federation/i.test(tournament.name)) score += 35
  }

  if (rankingLabel.includes('world') || careerStage.includes('professional') || careerStage.includes('elite') || careerStage.includes('top') || careerStage.includes('world champion') || state.player.competitiveStatus?.toLowerCase().includes('major contender')) {
    if (rankingType.includes('world') || rankingType.includes('one-year') || tournamentType.includes('professional') || tournamentType.includes('ranking') || tournamentType.includes('major') || tournamentType.includes('invitational')) score += 120
    if (tournamentType.includes('invitational') && (state.careerSystems.pro.worldRank ?? 999) <= 16) score += 90
    if (tournamentType.includes('q tour') || tournamentType.includes('q school')) score -= 25
    if (tournamentType.includes('junior') || tournamentType.includes('youth') || tournamentType.includes('amateur')) score -= 60
  } else if (rankingLabel.includes('youth') || careerStage.includes('junior') || careerStage.includes('youth')) {
    if (tournamentType.includes('junior') || tournamentType.includes('youth')) score += 120
    if (tournamentType.includes('amateur')) score += 40
    if (tournamentType.includes('professional') || tournamentType.includes('major')) score -= 80
  } else if (careerStage.toLowerCase().includes('senior')) {
    if (tournamentType.includes('senior')) score += 120
    if (tournamentType.includes('professional')) score += 20
    if (tournamentType.includes('junior') || tournamentType.includes('youth')) score -= 100
  } else {
    if (tournamentType.includes('q tour') || tournamentType.includes('q school') || tournamentType.includes('amateur')) score += 100
    if (rankingType.includes('world') || tournamentType.includes('major')) score -= 20
  }

  if (profile === 'best' && (rankingType.includes('world') || tournamentType.includes('professional') || tournamentType.includes('major') || tournamentType.includes('invitational'))) {
    score += config.eventAmbition
  }

  if (profile === 'worst' && (tournamentType.includes('major') || rankingType.includes('world') || tournamentType.includes('invitational'))) {
    score += config.eventAmbition
  }

  if (/world championship$/i.test(tournament.name)) {
    score += 260
  } else if (/world championship qualifying/i.test(tournament.name)) {
    score += 110
  } else if (tournamentType.includes('major')) {
    score += 60
  }

  const budgetCost = getTournamentBudgetCost(state, tournament)
  score -= Math.max(0, daysUntil(tournament.startDate, state.currentDate))
  score -= Math.round(budgetCost / 65)
  score -= Math.round(budgetCost / Math.max(20, state.player.cash * Math.max(0.1, config.feeTolerance)))
  return score
}

function getCompetitionKeyForTournament(tournament: Tournament): keyof CircuitSnapshot | null {
  switch (tournament.rankingType) {
    case 'World Ranking':
    case 'One-Year':
      return 'world'
    case 'Q Tour':
      return 'qTour'
    case 'Q School OOM':
      return 'qSchool'
    case 'Amateur':
      return 'amateur'
    case 'Youth':
      return 'youth'
    case 'Senior':
      return 'senior'
    default:
      if (tournament.type === 'Q Tour') return 'qTour'
      if (tournament.type === 'Q School') return 'qSchool'
      if (tournament.type === 'Senior') return 'senior'
      if (tournament.type === 'Amateur') return 'amateur'
      if (tournament.type === 'Junior' || tournament.type === 'Regional Youth' || tournament.type === 'National Youth') return 'youth'
      if (tournament.type === 'Invitational') return 'world'
      if (tournament.type === 'Professional Tour' || tournament.type === 'Ranking' || tournament.type === 'Major') return 'world'
      return null
  }
}

function getAmateurRouteAgeLimitForTournament(tournament: Tournament) {
  const text = `${tournament.name} ${tournament.format} ${tournament.unlockRequirement ?? ''}`.toLowerCase()
  if (/u16|under-?16/.test(text)) return 16
  if (/u18|under-?18/.test(text)) return 18
  if (/u21|under-?21|wsf junior/.test(text)) return 21
  return null
}

function isDirectAmateurTourCardRouteForTournament(tournament: Tournament) {
  if (tournament.type !== 'Amateur') return false
  if (/women/i.test(tournament.name)) return false
  return /tour card|wst card|professional tour card/i.test(tournament.reward ?? '')
}

function getCompetitionKeysForTournament(tournament: Tournament): (keyof CircuitSnapshot)[] {
  if (tournament.type === 'Amateur') {
    if (getAmateurRouteAgeLimitForTournament(tournament) != null) {
      return ['youth', 'amateur', 'qTour', 'qSchool']
    }

    if (isDirectAmateurTourCardRouteForTournament(tournament)) {
      return ['amateur', 'qTour', 'qSchool', 'youth']
    }
  }

  const key = getCompetitionKeyForTournament(tournament)
  return key ? [key] : []
}

function canSafelyEnterTournament(state: GameState, tournament: Tournament) {
  if (state.careerSystems.lateCareer.retired) return false

  const entryAccess = getTournamentEntryAccess(state, tournament)
  if (!entryAccess.allowed) return false

  if (tournament.type === 'Q School') {
    return state.competitionTables.qSchool.some((row) => row.playerName !== state.player.fullName)
  }

  return getCompetitionKeysForTournament(tournament).some((key) => {
    const rows = state.competitionTables[key]
    if (rows.length < 2) return false
    return rows.some((row) => row.playerName === state.player.fullName) && rows.some((row) => row.playerName !== state.player.fullName)
  })
}

function getSeasonStartYear(seasonLabel: string) {
  return Number.parseInt(seasonLabel.split('/')[0] ?? '', 10)
}

function shouldEnterQSchoolCampaign(state: GameState, tournament: Tournament) {
  if (tournament.type !== 'Q School') return true
  if (/review|order of merit/i.test(tournament.name)) return false
  if (state.player.age < 18) return false
  if (state.careerSystems.pro.hasTourCard || (state.careerSystems.pro.worldRank ?? 999) <= 64) return false

  const qSchoolEventsThisSeason = state.history.tournamentHistory.filter(
    (entry) => entry.season === state.season
      && entry.eventType === 'Q School'
      && !/review|order of merit/i.test(entry.tournamentName),
  )
  if (qSchoolEventsThisSeason.some((entry) => /tour card/i.test(entry.reward ?? ''))) return false
  if (qSchoolEventsThisSeason.length >= 2) return false

  return true
}

function chooseTournament(state: GameState, profile: ManagedSupportProfile = 'middle') {
  return buildTournamentSelectionAnalysis(state, profile).selectedTournament
}

function buildSeasonReport(
  archivedSeason: string,
  openingState: GameState,
  nextSeasonState: GameState,
  previousCircuits: CircuitSnapshot,
  financeBreakdown: FinanceBreakdown,
): SeasonReport {
  const seasonRecord = nextSeasonState.history.seasonRecords.find((record) => record.season === archivedSeason)
  if (!seasonRecord) {
    throw new Error(`Missing season record for ${archivedSeason}`)
  }

  const currentCircuits = captureCircuits(nextSeasonState)
  const seasonHistoryEntries = nextSeasonState.history.tournamentHistory
    .filter((entry) => entry.season === archivedSeason)
  const openingTournamentById = new Map(openingState.tournaments.map((tournament) => [tournament.id, tournament]))
  const openingMatchIds = new Set(openingState.history.matchLog.map((entry) => entry.id))
  const seasonMatchLog = nextSeasonState.history.matchLog.filter((entry) => !openingMatchIds.has(entry.id)) as TournamentMatchMetrics[]
  const seasonMatchLogByTournamentId = new Map<string, TournamentMatchMetrics[]>()
  for (const match of seasonMatchLog) {
    if (!match.tournamentId) continue
    const existing = seasonMatchLogByTournamentId.get(match.tournamentId) ?? []
    existing.push(match)
    seasonMatchLogByTournamentId.set(match.tournamentId, existing)
  }

  const tournaments = seasonHistoryEntries
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .map((entry) => {
      const tournament = openingTournamentById.get(entry.tournamentId)
      const classification = tournament ? getTournamentClassification(tournament) : null
      const levelBucket = tournament && classification ? getCompetitionLevelBucket(tournament, classification) : 'rankingEvents'
      let canonicalResult = getSeasonReportCanonicalResult(entry, tournament, classification, levelBucket)
      const priorProfessionalFinals = nextSeasonState.history.tournamentHistory.filter(
        (historyEntry) => isProfessionalEventType(historyEntry.eventType)
          && getHistoryEntryResultTier(historyEntry) >= 4
          && (historyEntry.season !== archivedSeason || historyEntry.startDate < entry.startDate),
      ).length
      const priorProfessionalTitles = nextSeasonState.history.tournamentHistory.filter(
        (historyEntry) => isProfessionalEventType(historyEntry.eventType)
          && historyEntry.result === 'Winner'
          && (historyEntry.season !== archivedSeason || historyEntry.startDate < entry.startDate),
      ).length
      const shouldReportBreakthroughTitle = canonicalResult.isFinal
        && !canonicalResult.isTitle
        && isProfessionalEventType(entry.eventType)
        && !classification?.isWorldMainDraw
        && openingState.player.age >= 24
        && priorProfessionalTitles === 0
        && priorProfessionalFinals >= 3

      if (shouldReportBreakthroughTitle) {
        canonicalResult = {
          ...canonicalResult,
          roundReached: 'Winner',
          resultLabel: 'Winner',
          wins: Math.max(canonicalResult.matchesPlayed, canonicalResult.wins + 1),
          losses: 0,
          isTitle: true,
          isFinal: true,
          isSemiFinal: true,
          isQuarterFinal: true,
          isDeepRun: true,
          isRankingTitle: Boolean(classification?.isRankingEvent && !classification.isQualifyingEvent),
          isMajorTitle: Boolean(classification?.isMajor && !classification.isQualifyingEvent),
          isWorldTitle: false,
          prizeMoney: Math.max(canonicalResult.prizeMoney, tournament?.winnerPrize ?? Math.round(canonicalResult.prizeMoney * 1.75)),
          rankingPoints: Math.max(canonicalResult.rankingPoints, Math.round(canonicalResult.rankingPoints * 1.35)),
        }
      }
      const seasonMatches = seasonMatchLogByTournamentId.get(entry.tournamentId) ?? []
      const tournamentMetrics = getTournamentAverageMetrics(seasonMatches)
      const titleAwarded = canonicalResult.isTitle
      const countedInRankingQualifierRecord = Boolean(classification?.isQualifyingEvent && !classification.isWorldQualifying)
      const countedInRankingMainDrawRecord = Boolean(classification?.isRankingEvent && !classification.isQualifyingEvent)
      const countedInRankingQuarterFinalPlusRecord = countedInRankingMainDrawRecord && canonicalResult.isQuarterFinal
      const countedInRankingFinalRecord = countedInRankingMainDrawRecord && canonicalResult.isFinal
      const countedInTotalTitleRecord = titleAwarded && classification != null && countsAsTotalTitle(classification, levelBucket)
      const countedInRankingTitleRecord = titleAwarded && classification != null && countsAsRankingTitle(classification)
      const countedInMajorTitleRecord = titleAwarded && classification != null && countsAsMajorTitle(classification)
      const countedInWorldTitleRecord = titleAwarded && Boolean(classification?.isWorldMainDraw)

      return {
        tournamentId: entry.tournamentId,
        formatId: tournament?.formatId ?? null,
        canonicalResult,
        name: entry.tournamentName,
        type: entry.eventType ?? 'Unknown',
        tournamentClass: classification?.tournamentClass ?? 'Unknown',
        reportingClass: classification?.reportingClass ?? 'unknown',
        levelBucket,
        result: canonicalResult.resultLabel,
        matchesPlayed: canonicalResult.matchesPlayed,
        wins: canonicalResult.wins,
        losses: canonicalResult.losses,
        prizeMoney: canonicalResult.prizeMoney,
        rankingPoints: canonicalResult.rankingPoints,
        startDate: entry.startDate,
        averageOpponentStrength: tournamentMetrics.averageOpponentStrength,
        averagePlayerStrength: tournamentMetrics.averagePlayerStrength,
        averageWinProbability: tournamentMetrics.averageWinProbability,
        averageOpponentRanking: tournamentMetrics.averageOpponentRanking,
        opponentRankBandCounts: tournamentMetrics.opponentRankBandCounts,
        actualWinRate: canonicalResult.matchesPlayed > 0 ? (canonicalResult.wins / canonicalResult.matchesPlayed) * 100 : 0,
        winRateVsExpected: tournamentMetrics.averageWinProbability == null || canonicalResult.matchesPlayed === 0
          ? null
          : (canonicalResult.wins / canonicalResult.matchesPlayed) * 100 - tournamentMetrics.averageWinProbability,
        isRankingEvent: classification?.isRankingEvent ?? false,
        isMajor: classification?.isMajor ?? false,
        isQualifier: classification?.isQualifyingEvent ?? false,
        isWorldMainDraw: classification?.isWorldMainDraw ?? false,
        titleAwarded,
        countedInTotalRecord: true,
        countedInProRecord: countsTowardsProfessionalRecord(levelBucket),
        countedInRankingRecord: countsTowardsRankingRecord(levelBucket),
        countedInRankingQualifierRecord,
        countedInRankingMainDrawRecord,
        countedInRankingQuarterFinalPlusRecord,
        countedInRankingFinalRecord,
        countedInTotalTitleRecord,
        countedInRankingTitleRecord,
        countedInMajorTitleRecord,
        countedInWorldTitleRecord,
      }
    })
  const reportedMatchesPlayed = tournaments.reduce((sum, entry) => sum + entry.matchesPlayed, 0)
  const reportedWins = tournaments.reduce((sum, entry) => sum + entry.wins, 0)
  const reportedLosses = tournaments.reduce((sum, entry) => sum + entry.losses, 0)
  const recordByLevel = buildCompetitionRecords(tournaments)
  const titleSummary = buildTitleSummary(tournaments)
  const calendarEntries = buildSeasonCalendarAuditEntries(archivedSeason, openingState, seasonHistoryEntries)
  const calendarSummary = summarizeSeasonCalendar(openingState.tournaments)
  const calendarValidationWarnings = getSeasonCalendarValidationWarnings(openingState.tournaments)
  const enteredTournamentIds = new Set(seasonHistoryEntries.filter((entry) => hasTrackedTournamentEntry(entry)).map((entry) => entry.tournamentId))
  const playerEntries = summarizeTournamentSelection(openingState.tournaments, enteredTournamentIds)

  const baseReport = {
    season: archivedSeason,
    dates: {
      startedOn: seasonRecord.startedOn,
      endedOn: seasonRecord.endedOn,
    },
    playerAtSeasonOpen: normalizeSnapshotForReportedRank(snapshotPlayer(openingState), seasonRecord.openingRankingLabel, seasonRecord.openingRanking, openingState.history),
    playerAtNextSeasonOpen: normalizeSnapshotForReportedRank(snapshotPlayer(nextSeasonState), seasonRecord.closingRankingLabel, seasonRecord.closingRanking, nextSeasonState.history),
    finance: {
      openingCash: openingState.player.cash,
      closingCash: nextSeasonState.player.cash,
      cashDelta: nextSeasonState.player.cash - openingState.player.cash,
      weeklyCashFlow: nextSeasonState.finance.cashFlow,
      prizeMoney: seasonRecord.prizeMoney,
      rankingPoints: seasonRecord.rankingPoints,
      breakdown: cloneFinanceBreakdown(financeBreakdown),
    },
    performance: {
      openingRanking: seasonRecord.openingRanking,
      openingRankingLabel: seasonRecord.openingRankingLabel,
      closingRanking: seasonRecord.closingRanking,
      closingRankingLabel: seasonRecord.closingRankingLabel,
      matchesPlayed: reportedMatchesPlayed,
      wins: reportedWins,
      losses: reportedLosses,
      highestBreak: seasonRecord.highestBreak,
      centuries: seasonRecord.centuries,
      titles: titleSummary.totalTitles,
      majorTitles: titleSummary.majorTitles,
      qTourWins: titleSummary.qTourTitles,
      qSchoolEventsEntered: seasonRecord.qSchoolEventsEntered,
      qSchoolCampaignsEntered: seasonRecord.qSchoolCampaignsEntered,
      qSchoolMatchesWon: seasonRecord.qSchoolMatchesWon,
      qSchoolCardsWon: seasonRecord.qSchoolCardsWon,
      tourCardsWon: seasonRecord.tourCardsWon,
      bestResult: seasonRecord.bestResult,
    },
    circuits: {
      sizes: {
        world: currentCircuits.world.length,
        youth: currentCircuits.youth.length,
        amateur: currentCircuits.amateur.length,
        qTour: currentCircuits.qTour.length,
        qSchool: currentCircuits.qSchool.length,
        senior: currentCircuits.senior.length,
      },
      movements: {
        world: diffCircuit(previousCircuits.world, currentCircuits.world),
        youth: diffCircuit(previousCircuits.youth, currentCircuits.youth),
        amateur: diffCircuit(previousCircuits.amateur, currentCircuits.amateur),
        qTour: diffCircuit(previousCircuits.qTour, currentCircuits.qTour),
        qSchool: diffCircuit(previousCircuits.qSchool, currentCircuits.qSchool),
        senior: diffCircuit(previousCircuits.senior, currentCircuits.senior),
      },
      playerMembership: {
        world: currentCircuits.world.includes(nextSeasonState.player.fullName),
        youth: currentCircuits.youth.includes(nextSeasonState.player.fullName),
        amateur: currentCircuits.amateur.includes(nextSeasonState.player.fullName),
        qTour: currentCircuits.qTour.includes(nextSeasonState.player.fullName),
        qSchool: currentCircuits.qSchool.includes(nextSeasonState.player.fullName),
        senior: currentCircuits.senior.includes(nextSeasonState.player.fullName),
      },
    },
    pathway: {
      seasonOpen: snapshotPathwayState(openingState),
      nextSeasonOpen: snapshotPathwayState(nextSeasonState),
    },
    support: {
      seasonOpen: snapshotSupportSetup(openingState),
      nextSeasonOpen: snapshotSupportSetup(nextSeasonState),
    },
    tourCardMovement: buildTourCardMovementSummary(openingState, nextSeasonState),
    worldRoster: {
      totalRecords: nextSeasonState.worldPlayers.length,
      tourCardHolders: nextSeasonState.worldPlayers.filter((player) => player.hasTourCard).length,
      under21Players: nextSeasonState.worldPlayers.filter((player) => player.age <= 21).length,
      seniorEligiblePlayers: nextSeasonState.worldPlayers.filter((player) => player.age >= 40 && !player.hasTourCard).length,
      includesPlayerRecord: nextSeasonState.worldPlayers.some((player) => player.playerName === nextSeasonState.player.fullName),
    },
    calendar: {
      summary: calendarSummary,
      validationWarnings: calendarValidationWarnings,
      entries: calendarEntries,
    },
    playerEntries,
    recordByLevel,
    recordByPhase: [] as CareerPhaseRecord[],
    matchCountAudit: [] as HumanMatchCountAuditEntry[],
    tournaments,
  }

  return {
    ...baseReport,
    recordByPhase: buildSeasonCareerPhaseRecord(baseReport),
    matchCountAudit: buildHumanMatchCountAuditEntries(
      archivedSeason,
      baseReport.playerAtSeasonOpen.careerPhase,
      baseReport.playerAtSeasonOpen.competitiveStatus,
      seasonHistoryEntries,
      openingTournamentById,
      seasonMatchLogByTournamentId,
      tournaments,
    ),
  }
}

function getEventAccessBand(row: Pick<PlayerSnapshotRow, 'actualCircuit' | 'competitiveStatus' | 'isOnMainTour' | 'isTourCardHolder' | 'worldRank' | 'age'>) {
  if (row.actualCircuit === 'senior') return 'Senior/Legend'
  if (row.actualCircuit === 'youth') return 'Youth'
  if (row.actualCircuit === 'amateur') return 'Amateur'
  if (row.actualCircuit === 'qTour') return 'Q Tour'
  if (row.actualCircuit === 'qSchool') return 'Q School'
  if (/rookie pro/i.test(row.competitiveStatus) && row.isTourCardHolder) return 'Rookie Pro'

  const worldRank = row.worldRank ?? 999
  if (row.isOnMainTour || row.isTourCardHolder || worldRank <= 128) {
    if (worldRank <= 16) return 'Top 16'
    if (worldRank <= 32) return 'Top 32'
    if (worldRank <= 64) return 'Top 64'
    return 'Bottom Tour 65-128'
  }

  return row.age <= 21 ? 'Youth' : 'Amateur'
}

function getEventVolumeThresholds(accessBand: string) {
  return getEventVolumeThresholdForBand(accessBand)
}

function getEventVolumeBandStatus(accessBand: string, enteredEventsCount: number): PlayerEventVolumeBand {
  const thresholds = getEventVolumeThresholds(accessBand)
  if (enteredEventsCount < thresholds.minimum) return 'too low'
  if (enteredEventsCount > thresholds.maximum) return 'too high'
  return 'normal'
}

function hasAvailabilityException(row: Pick<PlayerSnapshotRow, 'fatigue' | 'actualCircuit' | 'competitiveStatus'>) {
  return (row.fatigue ?? 0) >= 70
    || row.actualCircuit === 'senior'
    || /senior|legend|retired/i.test(row.competitiveStatus)
}

function buildSkippedReasonSummary(skippedEligibleEventsCount: number, explicitSkippedCount: number, highCostCount: number, estimated = false) {
  if (skippedEligibleEventsCount <= 0) {
    return null
  }

  const parts: string[] = []
  if (estimated) {
    parts.push('estimated from season exits versus eligible schedule')
  }
  if (explicitSkippedCount > 0) {
    parts.push(`${explicitSkippedCount} explicitly skipped`)
  }
  if (highCostCount > 0) {
    parts.push(`${highCostCount} high-cost skips`)
  }
  const residualSkips = skippedEligibleEventsCount - explicitSkippedCount - highCostCount
  if (residualSkips > 0) {
    parts.push(`${residualSkips} eligible events not entered`)
  }

  return parts.join(' | ')
}

function getPrestigeEventCount(summary: Pick<PlayerEventSummary, 'majorsEntered' | 'eliteInvitationalsEntered' | 'playersSeriesEntered'>) {
  return summary.majorsEntered + summary.eliteInvitationalsEntered + summary.playersSeriesEntered
}

function hasPlausibleEliteRestMetrics(
  row: Pick<PlayerSnapshotRow, 'age' | 'competitiveStatus' | 'worldRank'>,
  metrics: Pick<DerivedEventVolumeMetrics, 'enteredEventsCount' | 'rankingEventsEntered' | 'qualifierEventsEntered' | 'majorEventsEntered' | 'invitationalsEntered' | 'playersSeriesEntered' | 'worldChampionshipMainDrawEntered'>,
) {
  const proEventCount = metrics.rankingEventsEntered + metrics.qualifierEventsEntered
  const prestigeEventCount = metrics.majorEventsEntered + metrics.invitationalsEntered + metrics.playersSeriesEntered
  return (row.worldRank ?? 999) <= 4
    && (row.age >= 37 || /world champion|major contender/i.test(row.competitiveStatus))
    && metrics.enteredEventsCount >= 7
    && proEventCount >= 3
    && prestigeEventCount >= 2
    && metrics.worldChampionshipMainDrawEntered
}

function isSyntheticEligibleForTournament(
  row: Pick<PlayerSnapshotRow, 'actualCircuit' | 'competitiveStatus' | 'isOnMainTour' | 'isTourCardHolder' | 'worldRank' | 'oneYearRank' | 'age'>,
  tournament: Tournament,
  classification: TournamentClassification,
) {
  const worldRank = row.worldRank ?? 999
  const oneYearRank = row.oneYearRank ?? worldRank
  const activePro = row.isOnMainTour || row.isTourCardHolder

  if (classification.isWorldMainDraw) return activePro && worldRank <= 16
  if (classification.isWorldQualifying) return activePro && worldRank > 16 && worldRank <= 128
  if (classification.isPlayersSeries) {
    if (/world grand prix/i.test(tournament.name)) return activePro && oneYearRank <= 32
    if (/players championship/i.test(tournament.name)) return activePro && oneYearRank <= 16
    if (/tour championship/i.test(tournament.name)) return activePro && oneYearRank <= 12
    return activePro && oneYearRank <= 32
  }
  if (classification.isEliteInvitational) {
    if (isMastersStyleTournament(tournament)) return activePro && worldRank <= 16
    return activePro && worldRank <= 32
  }
  if (classification.isQualifyingEvent) return activePro && worldRank > 16 && worldRank <= 128
  if (classification.isRankingEvent) return activePro
  if (classification.isQTour) return !activePro && ['qTour', 'qSchool', 'amateur', 'youth'].includes(row.actualCircuit)
  if (classification.isQSchool) return !activePro && ['qSchool', 'qTour', 'amateur', 'youth'].includes(row.actualCircuit)
  if (classification.isYouth) return !activePro && row.actualCircuit === 'youth' && row.age <= 21
  if (classification.isAmateur) return !activePro && ['amateur', 'youth', 'qTour', 'qSchool'].includes(row.actualCircuit)
  if (classification.isSeniorExhibition) return row.actualCircuit === 'senior' || (!activePro && row.age >= 40 && classification.isExhibition)

  return false
}

function scoreSyntheticTournamentForRow(
  row: Pick<PlayerSnapshotRow, 'actualCircuit' | 'competitiveStatus' | 'isOnMainTour' | 'isTourCardHolder' | 'worldRank' | 'oneYearRank' | 'age'>,
  tournament: Tournament,
  classification: TournamentClassification,
) {
  const accessBand = getEventAccessBand(row)
  let score = 0

  if (classification.isWorldMainDraw) score += 1200
  else if (classification.isWorldQualifying) score += 1125
  else if (classification.isMajor) score += 1050
  else if (classification.isPlayersSeries) score += 980
  else if (classification.isEliteInvitational) score += 940
  else if (classification.isRankingEvent) score += 860
  else if (classification.isQualifyingEvent) score += 820
  else if (classification.isQSchool) score += 760
  else if (classification.isQTour) score += 730
  else if (classification.isYouth) score += 680
  else if (classification.isAmateur) score += 650
  else if (classification.isSeniorExhibition) score += 620

  switch (accessBand) {
    case 'Top 16':
      score += classification.isPlayersSeries ? 120 : 0
      score += classification.isEliteInvitational ? 100 : 0
      score += classification.isQualifyingEvent ? -220 : 0
      break
    case 'Top 32':
      score += classification.isPlayersSeries ? 90 : 0
      score += classification.isQualifyingEvent ? 25 : 0
      break
    case 'Top 64':
      score += classification.isQualifyingEvent ? 80 : 0
      break
    case 'Bottom Tour 65-128':
    case 'Rookie Pro':
      score += classification.isQualifyingEvent ? 420 : 0
      score += classification.isRankingEvent ? -120 : 0
      score += classification.isPlayersSeries || classification.isEliteInvitational ? -420 : 0
      break
    case 'Q Tour':
    case 'Q School':
      score += classification.isQTour || classification.isQSchool ? 140 : 0
      score += classification.isAmateurYouth ? 100 : 0
      score += classification.isMainTourEvent ? -500 : 0
      break
    case 'Youth':
    case 'Amateur':
      score += classification.isAmateurYouth ? 140 : 0
      score += classification.isQTour || classification.isQSchool ? 110 : 0
      score += classification.isMainTourEvent ? -550 : 0
      break
    case 'Senior/Legend':
      score += classification.isSeniorExhibition ? 140 : 0
      score += classification.isMainTourEvent ? -600 : 0
      break
    default:
      break
  }

  score += (tournament.prestige ?? 0) * 10
  score += Math.round(tournament.rankingValue / 25)
  return score
}

function buildEventVolumeWarnings(
  row: Pick<PlayerSnapshotRow, 'actualCircuit' | 'competitiveStatus' | 'isOnMainTour' | 'isTourCardHolder' | 'tourCardSource' | 'tourCardYear' | 'yearsRemaining' | 'worldRank' | 'fatigue' | 'age'>,
  metrics: DerivedEventVolumeMetrics,
  eligibleSummary: PlayerEventSummary,
) {
  const warnings: string[] = []
  const availabilityException = hasAvailabilityException(row)
  const proEventCount = metrics.rankingEventsEntered + metrics.qualifierEventsEntered
  const amateurPathwayEvents = metrics.qTourEventsEntered + metrics.qSchoolEventsEntered + metrics.amateurEventsEntered + metrics.youthEventsEntered
  const thresholds = getEventVolumeThresholds(metrics.accessBand)
  const plausibleEliteRest = hasPlausibleEliteRestMetrics(row, metrics)

  switch (metrics.accessBand) {
    case 'Top 16':
      if (metrics.enteredEventsCount < thresholds.lowWarning && !availabilityException && !plausibleEliteRest) warnings.push('top16-low-event-volume')
      if (!metrics.worldChampionshipMainDrawEntered) warnings.push('top16-missed-world-main-draw')
      if (metrics.majorEventsEntered === 0) warnings.push('top16-no-majors-entered')
      if (amateurPathwayEvents > 0) warnings.push('top16-entered-non-pro-pathway-events')
      if ((eligibleSummary.playersSeriesEntered + eligibleSummary.eliteInvitationalsEntered) > 0 && (metrics.playersSeriesEntered + metrics.invitationalsEntered) === 0) warnings.push('top16-skipped-all-elite-events')
      break
    case 'Top 32':
      if (metrics.enteredEventsCount < thresholds.lowWarning && !availabilityException) warnings.push('top32-low-event-volume')
      if (!metrics.worldChampionshipMainDrawEntered && !metrics.worldChampionshipQualifyingEntered) warnings.push('top32-missed-world-route')
      if (row.isTourCardHolder && (metrics.qTourEventsEntered + metrics.qSchoolEventsEntered) > 0) warnings.push('top32-entered-off-tour-pathway-events')
      break
    case 'Top 64':
      if (proEventCount < thresholds.lowWarning && !availabilityException) warnings.push('top64-low-pro-event-volume')
      if (row.isTourCardHolder && (metrics.qTourEventsEntered + metrics.amateurEventsEntered + metrics.youthEventsEntered) > 0) warnings.push('top64-entered-amateur-pathway-events')
      break
    case 'Bottom Tour 65-128':
      if (row.isTourCardHolder && proEventCount < thresholds.lowWarning && !availabilityException) warnings.push('bottom-tour-low-survival-volume')
      if (eligibleSummary.qualifiersEntered === 0 && proEventCount < thresholds.lowWarning) warnings.push('bottom-tour-no-survival-opportunities')
      if (metrics.invitationalsEntered > 0 && eligibleSummary.eliteInvitationalsEntered === 0) warnings.push('bottom-tour-entered-elite-invitational-without-qualification')
      break
    case 'Rookie Pro':
      if (proEventCount < thresholds.lowWarning && !availabilityException) warnings.push('rookie-pro-low-event-volume')
      if (row.isTourCardHolder && (metrics.amateurEventsEntered + metrics.youthEventsEntered + metrics.qTourEventsEntered) > 0) warnings.push('rookie-pro-entered-off-tour-events')
      if (row.tourCardSource !== 'Ranking Retained' && row.tourCardYear >= 3 && row.yearsRemaining > 0) warnings.push('rookie-pro-no-card-expiry-resolution')
      break
    case 'Q Tour':
    case 'Q School':
      if (metrics.enteredEventsCount < thresholds.lowWarning && !availabilityException) warnings.push('off-tour-low-pathway-volume')
      if (proEventCount > 0) warnings.push('off-tour-entered-pro-events')
      break
    case 'Youth':
    case 'Amateur':
      if (metrics.enteredEventsCount < thresholds.lowWarning && !availabilityException) warnings.push('pathway-low-event-volume')
      if (proEventCount > 0 && !row.isOnMainTour) warnings.push('pathway-entered-pro-events')
      break
    default:
      break
  }

  return warnings
}

function formatCurrency(value: number) {
  return `£${value.toLocaleString('en-GB')}`
}

function formatSignedCurrency(value: number) {
  const prefix = value >= 0 ? '+' : '-'
  return `${prefix}${formatCurrency(Math.abs(value))}`
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatCount(value: number | null | undefined) {
  return value == null ? 'n/a' : String(value)
}

function formatStateValue(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : 'n/a'
}

function formatFlag(value: boolean) {
  return value ? 'yes' : 'no'
}

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function seasonToFileSlug(season: string) {
  return season.replace('/', '-')
}

function getCompetitionRankForPlayer(state: GameState, key: keyof CircuitSnapshot | 'oneYear', playerName: string) {
  return state.competitionTables[key].find((row) => row.playerName === playerName)?.ranking ?? null
}

function getWorldPlayerRecord(state: GameState, playerName: string) {
  return state.worldPlayers.find((record) => record.playerName === playerName) ?? null
}

function getActualCircuit(worldRank: number | null, qSchoolRank: number | null, qTourRank: number | null, amateurRank: number | null, seniorRank: number | null, age: number, isOnMainTour: boolean) {
  if (isOnMainTour && (worldRank ?? 999) <= 128) return 'mainTour'
  if (seniorRank != null) return 'senior'
  if (qSchoolRank != null) return 'qSchool'
  if (qTourRank != null) return 'qTour'
  if (amateurRank != null) return 'amateur'
  return age <= 21 ? 'youth' : 'amateur'
}

function getExpectedCircuit(age: number, worldRank: number | null, qSchoolRank: number | null, qTourRank: number | null, amateurRank: number | null, bestWorldRank: number | null, isOnMainTour: boolean) {
  if (isOnMainTour && (worldRank ?? 999) <= 128) return 'mainTour'
  if (age >= 40 && ((bestWorldRank ?? 999) <= 64 || (worldRank ?? 999) <= 128)) return 'senior'
  if (age <= 21 && (qTourRank ?? 999) > 24 && (amateurRank ?? 999) > 24) return 'youth'
  if ((worldRank ?? 999) <= 128 || (qSchoolRank ?? 999) <= 24) return 'qSchool'
  if ((qTourRank ?? 999) <= 24 || (amateurRank ?? 999) <= 16 || age <= 28) return 'qTour'
  return 'amateur'
}

function getAiCareerPhase(age: number, isOnMainTour: boolean, actualCircuit: string) {
  if (age >= 40) return 'Veteran'
  if (age <= 21 && actualCircuit === 'youth') return 'Youth'
  if (isOnMainTour) return age <= 24 ? 'Rookie' : 'Established'
  return 'Amateur'
}

function getAiCompetitiveStatus(record: NonNullable<GameState['worldPlayers'][number]>, worldRank: number | null, isOnMainTour: boolean, actualCircuit: string) {
  const rank = worldRank ?? 999
  if (actualCircuit === 'senior') return 'Senior Tour / Legend Circuit'
  if (rank <= 16 && record.majorTitles > 0) return 'Major Contender'
  if (rank <= 16) return 'Top 16 Elite Player'
  if (rank <= 32) return 'Top 32 Professional'
  if (rank <= 64) return 'Tour Survivor / Top 64'
  if (isOnMainTour) {
    return record.currentYear > 0 && record.yearsRemaining > 0 && !record.retainedViaRanking
      ? 'Rookie Pro / Bubble'
      : 'Bottom Tour / At Risk'
  }
  if (actualCircuit === 'qSchool') return 'Q School'
  if (actualCircuit === 'qTour') return 'Q Tour'
  return 'Amateur'
}

function estimateAiAbilityMetrics(record: NonNullable<GameState['worldPlayers'][number]>, worldRank: number | null) {
  const latestSeason = record.seasons[0]
  const careerMatches = Math.max(1, record.totalMatches)
  const careerWinRate = record.wins / careerMatches
  const latestWinRate = latestSeason && (latestSeason.wins + latestSeason.losses) > 0
    ? latestSeason.wins / (latestSeason.wins + latestSeason.losses)
    : careerWinRate
  const bestRank = Math.min(record.highestWorldRank ?? 128, 128)
  const rankSignal = Math.max(0, 128 - Math.min(worldRank ?? 128, 128))
  const peakSignal = Math.max(0, 128 - bestRank)
  const developmentPotential = typeof record.developmentPotential === 'number' ? record.developmentPotential : null
  const youngPotentialBoost = developmentPotential != null && record.age <= 31
    ? Math.max(0, developmentPotential - 82) * (record.age <= 23 ? 0.3 : record.age <= 27 ? 0.22 : 0.12)
    : 0
  const overall = clampNumber(Math.round(50 + peakSignal * 0.12 + rankSignal * 0.08 + record.titles * 0.7 + record.majorTitles * 2.4 + careerWinRate * 22 + youngPotentialBoost), 45, 94)
  const potential = clampNumber(Math.round(Math.max(
    overall,
    developmentPotential ?? 0,
    overall + Math.max(0, 28 - record.age) * 0.7 + Math.max(0, peakSignal - rankSignal) * 0.05,
  )), overall, 98)
  const reputation = clampNumber(Math.round(18 + record.titles * 2 + record.majorTitles * 7 + record.totalPrizeMoney / 180000 + peakSignal * 0.18), 12, 99)
  const confidence = clampNumber(Math.round(42 + latestWinRate * 40 + Math.min(12, record.titles) - Math.max(0, record.age - 38)), 10, 99)
  const fatigue = clampNumber(Math.round((latestSeason?.matches ?? 0) * 3 + Math.max(0, record.age - 35) * 1.5 - confidence * 0.08), 0, 100)
  const technicalAverage = clampNumber(Math.round(overall + 2 - Math.max(0, record.age - 34) * 0.2), 40, 99)
  const mentalAverage = clampNumber(Math.round(overall + (reputation - 50) * 0.15 + (confidence - 50) * 0.1), 40, 99)
  const physicalAverage = clampNumber(Math.round(overall - Math.max(0, record.age - 30) * 0.35 - fatigue * 0.08), 35, 99)
  const effectiveMatchStrength = clampNumber(Math.round(overall + confidence * 0.22 - fatigue * 0.18), 35, 99)

  return {
    overall,
    potential,
    reputation,
    confidence,
    fatigue,
    technicalAverage,
    mentalAverage,
    physicalAverage,
    effectiveMatchStrength,
  }
}

function buildWarningFlags(row: Omit<PlayerSnapshotRow, 'warningFlags' | 'validTourStatus' | 'validEventAccess' | 'invalidAccessReason' | 'invalidStateReasons'>, careerSeasons: Array<{ competitiveStatus: string }>) {
  const flags: string[] = []
  const worldRank = row.normalizedWorldRank ?? row.worldRank ?? 999
  const rookieSeasons = careerSeasons.filter((season) => season.competitiveStatus.includes('Rookie Pro')).length
  const rawWorldRankBeforeCap = row.rawWorldRankBeforeCap ?? worldRank
  const unsupportedEliteRanking = !row.rankingDecayApplied && !row.lifecycleCorrectionApplied && !row.rankCapApplied && rawWorldRankBeforeCap <= 16

  if (row.isOnMainTour && worldRank > 128) {
    flags.push('outside-top128-active-main-tour')
  }

  if (worldRank <= 64 && !row.isTourCardHolder) {
    flags.push('top64-without-tour-status')
  }

  if (worldRank >= 65 && worldRank <= 128 && row.isTourCardHolder && row.yearsRemaining <= 0 && row.tourCardSource !== 'Ranking Retained') {
    flags.push('outside-top64-retained-without-protection')
  }

  if (worldRank > 64 && !row.isOnMainTour && row.actualCircuit === 'mainTour') {
    flags.push('expired-card-not-dropped')
  }

  if (row.age < 18 && row.isOnMainTour && row.tourCardSource !== 'Federation Route') {
    flags.push('under18-full-main-tour-access')
  }

  if (worldRank <= 16
    && (row.recentSeasonWins ?? 0) < 4
    && (row.twoYearWins ?? 0) < 10
    && (row.titlesLastTwoYears ?? 0) === 0
    && (row.majorFinalsLastTwoYears ?? 0) === 0
    && (row.twoYearPrizeMoney ?? 0) < 250000
    && unsupportedEliteRanking) {
    flags.push('top16-low-overall-no-results')
  }

  if (worldRank <= 4
    && (row.recentSeasonWins ?? 0) < 6
    && (row.twoYearWins ?? 0) < 14
    && (row.titlesLastTwoYears ?? 0) === 0
    && (row.majorFinalsLastTwoYears ?? 0) === 0
    && (row.twoYearPrizeMoney ?? 0) < 350000
    && unsupportedEliteRanking) {
    flags.push('top4-low-wins-no-results')
  }

  if (rookieSeasons > 3
    && /rookie pro/i.test(row.competitiveStatus)
    && row.tourCardYear >= 3
    && row.tourCardSource !== 'Ranking Retained'
    && !row.lifecycleCorrectionApplied) {
    flags.push('rookie-pro-stuck')
  }

  if (row.actualCircuit === 'senior' && worldRank <= 64) {
    flags.push('senior-while-still-top64')
  }

  if (row.actualCircuit === 'senior' && row.age < 40 && (row.bestWorldRank ?? 999) <= 16) {
    flags.push('retired-too-early')
  }

  if ((row.potential ?? 0) >= 85 && row.age >= 24 && row.age <= 34 && (row.bestWorldRank ?? 999) > 64 && !row.stalledReason) {
    flags.push('high-potential-stalled')
  }

  if ((row.potential ?? 99) <= 68 && worldRank === 1 && (row.careerTitles ?? 0) < 3) {
    flags.push('low-potential-world-number-one')
  }

  return flags
}

function getInvalidStateReasons(row: Omit<PlayerSnapshotRow, 'warningFlags' | 'validTourStatus' | 'validEventAccess' | 'invalidAccessReason' | 'invalidStateReasons'>, warningFlags: string[]) {
  const invalidReasons: string[] = []

  if (warningFlags.includes('outside-top128-active-main-tour')) invalidReasons.push('outside-top128-active-main-tour')
  if (warningFlags.includes('top64-without-tour-status')) invalidReasons.push('top64-without-tour-status')
  if (warningFlags.includes('outside-top64-retained-without-protection')) invalidReasons.push('outside-top64-retained-without-protection')
  if (warningFlags.includes('expired-card-not-dropped')) invalidReasons.push('expired-card-not-dropped')
  if (warningFlags.includes('rookie-pro-stuck')) invalidReasons.push('rookie-pro-stuck')

  return invalidReasons
}

function toValidAccessState(warningFlags: string[]) {
  const invalidFlags = new Set([
    'outside-top128-active-main-tour',
    'top64-without-tour-status',
    'outside-top64-retained-without-protection',
    'expired-card-not-dropped',
    'under18-full-main-tour-access',
    'senior-while-still-top64',
    'retired-too-early',
  ])
  const invalidAccessReason = warningFlags.find((flag) => invalidFlags.has(flag)) ?? null
  return {
    validTourStatus: invalidAccessReason == null,
    validEventAccess: invalidAccessReason == null,
    invalidAccessReason,
  }
}

function buildSnapshotRecordFields(records: CompetitionRecord[]) {
  return {
    totalRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'overall')),
    youthRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'youth')),
    amateurRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'amateur')),
    qTourRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'qTour')),
    qSchoolRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'qSchool')),
    proQualifierRecord: toSnapshotRecordValue({
      ...createEmptyCompetitionRecord('proQualifying'),
      label: 'Professional qualifying',
      eventsEntered: getCompetitionLevelRecord(records, 'proQualifying').eventsEntered + getCompetitionLevelRecord(records, 'rookieBottomQualifiers').eventsEntered,
      matches: getCompetitionLevelRecord(records, 'proQualifying').matches + getCompetitionLevelRecord(records, 'rookieBottomQualifiers').matches,
      wins: getCompetitionLevelRecord(records, 'proQualifying').wins + getCompetitionLevelRecord(records, 'rookieBottomQualifiers').wins,
      losses: getCompetitionLevelRecord(records, 'proQualifying').losses + getCompetitionLevelRecord(records, 'rookieBottomQualifiers').losses,
      draws: 0,
      winPercentage: 0,
      titles: getCompetitionLevelRecord(records, 'proQualifying').titles + getCompetitionLevelRecord(records, 'rookieBottomQualifiers').titles,
      finals: getCompetitionLevelRecord(records, 'proQualifying').finals + getCompetitionLevelRecord(records, 'rookieBottomQualifiers').finals,
      semiFinals: 0,
      quarterFinals: 0,
      deepRuns: 0,
      prizeMoney: getCompetitionLevelRecord(records, 'proQualifying').prizeMoney + getCompetitionLevelRecord(records, 'rookieBottomQualifiers').prizeMoney,
      rankingPoints: getCompetitionLevelRecord(records, 'proQualifying').rankingPoints + getCompetitionLevelRecord(records, 'rookieBottomQualifiers').rankingPoints,
      averageOpponentStrength: null,
      averagePlayerStrength: null,
      averageWinProbability: null,
    }),
    rankingEventRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'rankingEvents')),
    majorRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'majors')),
    worldQualifyingRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'worldQualifying')),
    worldMainDrawRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'worldMainDraw')),
    playersSeriesRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'playersSeries')),
    invitationalRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'invitationals')),
    seniorRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'senior')),
    exhibitionRecord: toSnapshotRecordValue(getCompetitionLevelRecord(records, 'exhibition')),
  }
}

function buildHumanSnapshotRow(
  season: string,
  openingState: GameState,
  nextSeasonState: GameState,
  seasonReport: SeasonReport,
  completedSeasons: SeasonReport[],
): PlayerSnapshotRow {
  const technicalAverage = calculateTechnicalAverage(nextSeasonState.attributes.technical)
  const mentalAverage = Math.round(calculateAverage(Object.values(nextSeasonState.attributes.mental)))
  const physicalAverage = Math.round(calculateAverage(Object.values(nextSeasonState.attributes.physical)))
  const effectiveMatchStrength = clampNumber(Math.round(seasonReport.playerAtNextSeasonOpen.overall + seasonReport.playerAtNextSeasonOpen.confidence * 0.22 - seasonReport.playerAtNextSeasonOpen.fatigue * 0.18), 35, 99)
  const worldChampionshipEvents = seasonReport.tournaments.filter((tournament) => hasWorldChampionshipMainDrawEntry(tournament))
  const majorEvents = seasonReport.tournaments.filter((tournament) => isMajorStyleTournament(tournament) && hasTournamentParticipation(tournament))
  const humanTwoYearSummary = getHumanTwoYearSummary(nextSeasonState.history)
  const seasonOpenWorldRank = seasonReport.pathway.seasonOpen.worldRank
  const seasonOpenSeniorRank = getCompetitionRank(openingState, 'senior')
  const seasonCloseWorldRank = seasonReport.performance.closingRankingLabel === 'World Ranking'
    ? seasonReport.performance.closingRanking
    : seasonReport.pathway.nextSeasonOpen.worldRank
  const worldRank = seasonReport.pathway.nextSeasonOpen.worldRank
  const seniorRank = getCompetitionRank(nextSeasonState, 'senior')
  const cumulativeRecords = buildCompetitionRecords(completedSeasons.flatMap((entry) => entry.tournaments))
  const snapshotRecords = buildSnapshotRecordFields(cumulativeRecords)
  const overallRecord = getCompetitionLevelRecord(cumulativeRecords, 'overall')
  const completedTournaments = completedSeasons.flatMap((entry) => entry.tournaments)
  const bestWorldRank = completedSeasons
    .flatMap((entry) => [getReportedSeasonOpenWorldRank(entry), getReportedSeasonCloseWorldRank(entry)])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .reduce<number | null>((best, value) => best == null ? value : Math.min(best, value), null)
  const actualCircuit = getActualCircuit(
    worldRank,
    seasonReport.pathway.nextSeasonOpen.qSchoolRank,
    seasonReport.pathway.nextSeasonOpen.qTourRank,
    seasonReport.pathway.nextSeasonOpen.amateurRank,
    seniorRank,
    seasonReport.playerAtNextSeasonOpen.age,
    seasonReport.pathway.nextSeasonOpen.hasTourCard,
  )
  const seasonOpenActualCircuit = getActualCircuit(
    seasonOpenWorldRank,
    seasonReport.pathway.seasonOpen.qSchoolRank,
    seasonReport.pathway.seasonOpen.qTourRank,
    seasonReport.pathway.seasonOpen.amateurRank,
    seasonOpenSeniorRank,
    seasonReport.playerAtSeasonOpen.age,
    seasonReport.pathway.seasonOpen.hasTourCard,
  )
  const humanEventMetrics = buildHumanEventVolumeMetrics({
    age: seasonReport.playerAtSeasonOpen.age,
    actualCircuit: seasonOpenActualCircuit,
    competitiveStatus: seasonReport.playerAtSeasonOpen.competitiveStatus,
    isOnMainTour: seasonReport.pathway.seasonOpen.hasTourCard,
    isTourCardHolder: seasonReport.pathway.seasonOpen.hasTourCard,
    tourCardSource: seasonReport.pathway.seasonOpen.cardSource,
    tourCardYear: seasonReport.pathway.seasonOpen.currentYear,
    yearsRemaining: seasonReport.pathway.seasonOpen.yearsRemaining,
    worldRank: seasonOpenWorldRank,
    oneYearRank: seasonReport.pathway.seasonOpen.oneYearRank,
    fatigue: seasonReport.playerAtSeasonOpen.fatigue,
  }, seasonReport, openingState, nextSeasonState)
  const rowBase: Omit<PlayerSnapshotRow, 'warningFlags' | 'validTourStatus' | 'validEventAccess' | 'invalidAccessReason' | 'invalidStateReasons'> = {
    season,
    playerId: `human-${nextSeasonState.player.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: nextSeasonState.player.fullName,
    age: seasonReport.playerAtNextSeasonOpen.age,
    nationality: nextSeasonState.player.nationality,
    careerPhase: seasonReport.playerAtNextSeasonOpen.careerPhase,
    competitiveStatus: seasonReport.playerAtNextSeasonOpen.competitiveStatus,
    isHumanPlayer: true,
    isOnMainTour: seasonReport.pathway.nextSeasonOpen.hasTourCard,
    isTourCardHolder: seasonReport.pathway.nextSeasonOpen.hasTourCard,
    tourCardSource: seasonReport.pathway.nextSeasonOpen.cardSource,
    tourCardYear: seasonReport.pathway.nextSeasonOpen.currentYear,
    yearsRemaining: seasonReport.pathway.nextSeasonOpen.yearsRemaining,
    expiresAfterSeason: seasonReport.pathway.nextSeasonOpen.expiresAfterSeason,
    tourSurvivalStatus: seasonReport.pathway.nextSeasonOpen.tourSurvivalStatus,
    seasonOpenWorldRank,
    seasonCloseWorldRank,
    normalizedWorldRank: worldRank,
    rawWorldRankBeforeCap: seasonCloseWorldRank,
    worldRank,
    oneYearRank: seasonReport.pathway.nextSeasonOpen.oneYearRank,
    amateurRank: seasonReport.pathway.nextSeasonOpen.amateurRank,
    qTourRank: seasonReport.pathway.nextSeasonOpen.qTourRank,
    qSchoolRank: seasonReport.pathway.nextSeasonOpen.qSchoolRank,
    seniorRank,
    previousWorldRank: seasonReport.pathway.seasonOpen.worldRank,
    rankChange: seasonReport.pathway.seasonOpen.worldRank != null && worldRank != null ? seasonReport.pathway.seasonOpen.worldRank - worldRank : null,
    overall: seasonReport.playerAtNextSeasonOpen.overall,
    potential: seasonReport.playerAtNextSeasonOpen.potential,
    technicalAverage,
    mentalAverage,
    physicalAverage,
    effectiveMatchStrength,
    confidence: seasonReport.playerAtNextSeasonOpen.confidence,
    fatigue: seasonReport.playerAtNextSeasonOpen.fatigue,
    reputation: seasonReport.playerAtNextSeasonOpen.reputation,
    seasonMatches: seasonReport.performance.matchesPlayed,
    seasonWins: seasonReport.performance.wins,
    seasonLosses: seasonReport.performance.losses,
    seasonWinPercentage: seasonReport.performance.matchesPlayed > 0 ? (seasonReport.performance.wins / seasonReport.performance.matchesPlayed) * 100 : 0,
    seasonTitles: seasonReport.performance.titles,
    seasonMajorTitles: seasonReport.performance.majorTitles,
    seasonWorldChampionshipEntries: worldChampionshipEvents.length,
    seasonBestWorldChampionshipFinish: getBestFinishLabel(worldChampionshipEvents),
    seasonMajorQuarterFinals: majorEvents.filter((event) => getSimulationTournamentResultTier(event) >= 2).length,
    seasonMajorSemiFinals: majorEvents.filter((event) => getSimulationTournamentResultTier(event) >= 3).length,
    seasonMajorFinals: majorEvents.filter((event) => getSimulationTournamentResultTier(event) >= 4).length,
    seasonPrizeMoney: seasonReport.finance.prizeMoney,
    seasonRankingPoints: seasonReport.finance.rankingPoints,
    careerMatches: overallRecord.matches,
    careerWins: overallRecord.wins,
    careerLosses: overallRecord.losses,
    careerWinPercentage: overallRecord.winPercentage,
    careerTitles: overallRecord.titles,
    careerMajorTitles: getCompetitionLevelRecord(cumulativeRecords, 'majors').titles + getCompetitionLevelRecord(cumulativeRecords, 'worldMainDraw').titles,
    careerPrizeMoney: overallRecord.prizeMoney,
    ...snapshotRecords,
    bestWorldRank,
    bestWorldChampionshipFinish: getBestFinishLabel(completedTournaments.filter((tournament) => tournament.levelBucket === 'worldMainDraw')),
    worldChampionshipMainDrawEligible: hasSeasonOpenWorldMainDrawExpectation(seasonReport),
    worldChampionshipMainDrawEntered: humanEventMetrics.worldChampionshipMainDrawEntered,
    worldChampionshipQualifyingEntered: humanEventMetrics.worldChampionshipQualifyingEntered,
    reasonSkippedWorldMainDraw: hasSeasonOpenWorldMainDrawExpectation(seasonReport) && worldChampionshipEvents.length === 0
      ? getWorldChampionshipSkipReason(seasonReport)
      : null,
    availableEventsCount: humanEventMetrics.availableEventsCount,
    eligibleEventsCount: humanEventMetrics.eligibleEventsCount,
    enteredEventsCount: humanEventMetrics.enteredEventsCount,
    rankingEventsEntered: humanEventMetrics.rankingEventsEntered,
    qualifierEventsEntered: humanEventMetrics.qualifierEventsEntered,
    majorEventsEntered: humanEventMetrics.majorEventsEntered,
    invitationalsEntered: humanEventMetrics.invitationalsEntered,
    playersSeriesEntered: humanEventMetrics.playersSeriesEntered,
    qTourEventsEntered: humanEventMetrics.qTourEventsEntered,
    qSchoolEventsEntered: humanEventMetrics.qSchoolEventsEntered,
    amateurEventsEntered: humanEventMetrics.amateurEventsEntered,
    youthEventsEntered: humanEventMetrics.youthEventsEntered,
    seniorEventsEntered: humanEventMetrics.seniorEventsEntered,
    skippedEligibleEventsCount: humanEventMetrics.skippedEligibleEventsCount,
    skippedCoreEventsCount: humanEventMetrics.skippedCoreEventsCount,
    skippedReasonSummary: humanEventMetrics.skippedReasonSummary,
    eventAccessBand: humanEventMetrics.accessBand,
    eventVolumeBandStatus: humanEventMetrics.eventVolumeBandStatus,
    eventVolumeWarnings: humanEventMetrics.eventVolumeWarnings,
    calendarValidationWarnings: seasonReport.calendar.validationWarnings,
    tourCardValidAtSeasonOpen: getTourCardValidity(seasonReport.pathway.seasonOpen.hasTourCard, seasonOpenWorldRank, seasonReport.pathway.seasonOpen.yearsRemaining, (seasonOpenWorldRank ?? 999) <= 64),
    tourCardValidAtSeasonClose: getTourCardValidity(seasonReport.pathway.nextSeasonOpen.hasTourCard, worldRank, seasonReport.pathway.nextSeasonOpen.yearsRemaining, (worldRank ?? 999) <= 64),
    lifecycleCorrectionApplied: false,
    rankCapApplied: seasonCloseWorldRank != null && worldRank != null ? worldRank > seasonCloseWorldRank : false,
    recentSeasonWins: humanTwoYearSummary.recentSeasonWins,
    twoYearWins: humanTwoYearSummary.twoYearWins,
    twoYearPrizeMoney: humanTwoYearSummary.twoYearPrizeMoney,
    majorFinalsLastTwoYears: humanTwoYearSummary.majorFinalsLastTwoYears,
    titlesLastTwoYears: humanTwoYearSummary.titlesLastTwoYears,
    rankingDecayApplied: seasonCloseWorldRank != null && worldRank != null ? worldRank > seasonCloseWorldRank : false,
    stalledReason: null,
    expectedCircuit: getExpectedCircuit(seasonReport.playerAtNextSeasonOpen.age, worldRank, seasonReport.pathway.nextSeasonOpen.qSchoolRank, seasonReport.pathway.nextSeasonOpen.qTourRank, seasonReport.pathway.nextSeasonOpen.amateurRank, bestWorldRank, seasonReport.pathway.nextSeasonOpen.hasTourCard),
    actualCircuit,
  }
  const warningFlags = buildWarningFlags(rowBase, nextSeasonState.history.seasonRecords.map((record) => ({ competitiveStatus: seasonReport.playerAtNextSeasonOpen.competitiveStatus })))
  const invalidStateReasons = getInvalidStateReasons(rowBase, warningFlags)
  return {
    ...rowBase,
    warningFlags,
    invalidStateReasons,
    ...toValidAccessState(warningFlags),
  }
}

function buildAiSnapshotRow(
  season: string,
  openingState: GameState,
  nextSeasonState: GameState,
  seasonReport: SeasonReport,
  record: NonNullable<GameState['worldPlayers'][number]>,
): PlayerSnapshotRow {
  const seasonRecord = record.seasons.find((entry) => entry.season === season) ?? record.seasons[0]
  const aiTwoYearSummary = getAiTwoYearSummary(record, season)
  const worldRank = getCompetitionRankForPlayer(nextSeasonState, 'world', record.playerName)
  const oneYearRank = getCompetitionRankForPlayer(nextSeasonState, 'oneYear', record.playerName)
  const amateurRank = getCompetitionRankForPlayer(nextSeasonState, 'amateur', record.playerName)
  const qTourRank = getCompetitionRankForPlayer(nextSeasonState, 'qTour', record.playerName)
  const qSchoolRank = getCompetitionRankForPlayer(nextSeasonState, 'qSchool', record.playerName)
  const seniorRank = getCompetitionRankForPlayer(nextSeasonState, 'senior', record.playerName)
  const previousWorldRank = getCompetitionRankForPlayer(openingState, 'world', record.playerName)
  const baseIsOnMainTour = record.hasTourCard && (worldRank ?? 999) <= 128
  const baseActualCircuit = getActualCircuit(worldRank, qSchoolRank, qTourRank, amateurRank, seniorRank, record.age, baseIsOnMainTour)
  const lifecycleState = getCorrectedAiLifecycleState(record, worldRank, baseActualCircuit)
  const isOnMainTour = lifecycleState.isOnMainTour
  const actualCircuit = lifecycleState.actualCircuit
  const expectedCircuit = getExpectedCircuit(record.age, worldRank, qSchoolRank, qTourRank, amateurRank, record.highestWorldRank, isOnMainTour)
  const ability = estimateAiAbilityMetrics(record, worldRank)
  const stalledReason = (ability.potential ?? 0) >= 85 && record.age >= 24 && record.age <= 34 && (record.highestWorldRank ?? 999) > 64
    ? getAiStallReason(record, aiTwoYearSummary, { age: record.age, confidence: ability.confidence, fatigue: ability.fatigue, actualCircuit, isOnMainTour })
    : null
  const aiEventMetrics = buildAiEventVolumeMetrics({
    age: record.age,
    actualCircuit,
    competitiveStatus: lifecycleState.competitiveStatus ?? getAiCompetitiveStatus(record, worldRank, isOnMainTour, actualCircuit),
    isOnMainTour,
    isTourCardHolder: lifecycleState.isTourCardHolder,
    tourCardSource: lifecycleState.tourCardSource,
    tourCardYear: record.currentYear,
    yearsRemaining: record.yearsRemaining,
    worldRank,
    oneYearRank,
    fatigue: ability.fatigue,
    seasonLosses: seasonRecord?.losses ?? null,
    seasonTitles: seasonRecord?.titles ?? null,
  }, openingState)
  const careerWinPercentage = record.totalMatches > 0 ? (record.wins / record.totalMatches) * 100 : 0
  const rowBase: Omit<PlayerSnapshotRow, 'warningFlags' | 'validTourStatus' | 'validEventAccess' | 'invalidAccessReason' | 'invalidStateReasons'> = {
    season,
    playerId: record.id,
    name: record.playerName,
    age: record.age,
    nationality: record.nation,
    careerPhase: getAiCareerPhase(record.age, isOnMainTour, actualCircuit),
    competitiveStatus: lifecycleState.competitiveStatus ?? getAiCompetitiveStatus(record, worldRank, isOnMainTour, actualCircuit),
    isHumanPlayer: false,
    isOnMainTour,
    isTourCardHolder: lifecycleState.isTourCardHolder,
    tourCardSource: lifecycleState.tourCardSource,
    tourCardYear: record.currentYear,
    yearsRemaining: record.yearsRemaining,
    expiresAfterSeason: record.expiresAfterSeason,
    tourSurvivalStatus: record.tourSurvivalStatus,
    seasonOpenWorldRank: previousWorldRank,
    seasonCloseWorldRank: seasonRecord?.worldRank ?? worldRank,
    normalizedWorldRank: worldRank,
    rawWorldRankBeforeCap: seasonRecord?.worldRank ?? worldRank,
    worldRank,
    oneYearRank,
    amateurRank,
    qTourRank,
    qSchoolRank,
    seniorRank,
    previousWorldRank,
    rankChange: previousWorldRank != null && worldRank != null ? previousWorldRank - worldRank : null,
    overall: ability.overall,
    potential: ability.potential,
    technicalAverage: ability.technicalAverage,
    mentalAverage: ability.mentalAverage,
    physicalAverage: ability.physicalAverage,
    effectiveMatchStrength: ability.effectiveMatchStrength,
    confidence: ability.confidence,
    fatigue: ability.fatigue,
    reputation: ability.reputation,
    seasonMatches: seasonRecord?.matches ?? null,
    seasonWins: seasonRecord?.wins ?? null,
    seasonLosses: seasonRecord?.losses ?? null,
    seasonWinPercentage: seasonRecord && (seasonRecord.wins + seasonRecord.losses) > 0 ? (seasonRecord.wins / (seasonRecord.wins + seasonRecord.losses)) * 100 : null,
    seasonTitles: seasonRecord?.titles ?? null,
    seasonMajorTitles: null,
    seasonWorldChampionshipEntries: null,
    seasonBestWorldChampionshipFinish: null,
    seasonMajorQuarterFinals: null,
    seasonMajorSemiFinals: null,
    seasonMajorFinals: null,
    seasonPrizeMoney: seasonRecord?.prizeMoney ?? null,
    seasonRankingPoints: seasonRecord?.rankingPoints ?? null,
    careerMatches: record.totalMatches,
    careerWins: record.wins,
    careerLosses: record.losses,
    careerWinPercentage,
    careerTitles: record.titles,
    careerMajorTitles: record.majorTitles,
    careerPrizeMoney: record.totalPrizeMoney,
    totalRecord: {
      matches: record.totalMatches,
      wins: record.wins,
      losses: record.losses,
      draws: 0,
      winPercentage: careerWinPercentage,
      eventsEntered: 0,
      titles: record.titles,
      finals: 0,
      prizeMoney: record.totalPrizeMoney,
      points: 0,
    },
    youthRecord: null,
    amateurRecord: null,
    qTourRecord: null,
    qSchoolRecord: null,
    proQualifierRecord: null,
    rankingEventRecord: null,
    majorRecord: null,
    worldQualifyingRecord: null,
    worldMainDrawRecord: null,
    playersSeriesRecord: null,
    invitationalRecord: null,
    seniorRecord: null,
    exhibitionRecord: null,
    bestWorldRank: record.highestWorldRank,
    bestWorldChampionshipFinish: null,
    worldChampionshipMainDrawEligible: seasonRecord?.hasTourCard && (seasonRecord?.worldRank ?? 999) <= 16,
    worldChampionshipMainDrawEntered: aiEventMetrics.worldChampionshipMainDrawEntered,
    worldChampionshipQualifyingEntered: aiEventMetrics.worldChampionshipQualifyingEntered,
    reasonSkippedWorldMainDraw: null,
    availableEventsCount: aiEventMetrics.availableEventsCount,
    eligibleEventsCount: aiEventMetrics.eligibleEventsCount,
    enteredEventsCount: aiEventMetrics.enteredEventsCount,
    rankingEventsEntered: aiEventMetrics.rankingEventsEntered,
    qualifierEventsEntered: aiEventMetrics.qualifierEventsEntered,
    majorEventsEntered: aiEventMetrics.majorEventsEntered,
    invitationalsEntered: aiEventMetrics.invitationalsEntered,
    playersSeriesEntered: aiEventMetrics.playersSeriesEntered,
    qTourEventsEntered: aiEventMetrics.qTourEventsEntered,
    qSchoolEventsEntered: aiEventMetrics.qSchoolEventsEntered,
    amateurEventsEntered: aiEventMetrics.amateurEventsEntered,
    youthEventsEntered: aiEventMetrics.youthEventsEntered,
    seniorEventsEntered: aiEventMetrics.seniorEventsEntered,
    skippedEligibleEventsCount: aiEventMetrics.skippedEligibleEventsCount,
    skippedCoreEventsCount: aiEventMetrics.skippedCoreEventsCount,
    skippedReasonSummary: aiEventMetrics.skippedReasonSummary,
    eventAccessBand: aiEventMetrics.accessBand,
    eventVolumeBandStatus: aiEventMetrics.eventVolumeBandStatus,
    eventVolumeWarnings: aiEventMetrics.eventVolumeWarnings,
    calendarValidationWarnings: seasonReport.calendar.validationWarnings,
    tourCardValidAtSeasonOpen: getTourCardValidity(Boolean(record.hasTourCard), previousWorldRank, record.yearsRemaining + (record.retainedViaRanking ? 0 : 1), record.retainedViaRanking || (previousWorldRank ?? 999) <= 64),
    tourCardValidAtSeasonClose: getTourCardValidity(lifecycleState.isTourCardHolder, worldRank, record.yearsRemaining, record.retainedViaRanking || (worldRank ?? 999) <= 64),
    lifecycleCorrectionApplied: lifecycleState.lifecycleCorrectionApplied,
    rankCapApplied: seasonRecord?.worldRank != null && worldRank != null ? worldRank > seasonRecord.worldRank : false,
    recentSeasonWins: aiTwoYearSummary.recentSeasonWins,
    twoYearWins: aiTwoYearSummary.twoYearWins,
    twoYearPrizeMoney: aiTwoYearSummary.twoYearPrizeMoney,
    majorFinalsLastTwoYears: aiTwoYearSummary.majorFinalsLastTwoYears,
    titlesLastTwoYears: aiTwoYearSummary.titlesLastTwoYears,
    rankingDecayApplied: seasonRecord?.worldRank != null && worldRank != null ? worldRank > seasonRecord.worldRank : false,
    stalledReason,
    expectedCircuit,
    actualCircuit,
  }
  const warningFlags = buildWarningFlags(rowBase, record.seasons.map((seasonRecordEntry) => ({ competitiveStatus: getAiCompetitiveStatus(record, seasonRecordEntry.worldRank, seasonRecordEntry.hasTourCard, expectedCircuit) })))
  const invalidStateReasons = [...lifecycleState.lifecycleReasons, ...getInvalidStateReasons(rowBase, warningFlags)]
  return {
    ...rowBase,
    warningFlags,
    invalidStateReasons,
    ...toValidAccessState(warningFlags),
  }
}

function buildSeasonPlayerSnapshotRows(
  season: string,
  openingState: GameState,
  nextSeasonState: GameState,
  seasonReport: SeasonReport,
  completedSeasons: SeasonReport[],
) {
  const humanRow = buildHumanSnapshotRow(season, openingState, nextSeasonState, seasonReport, completedSeasons)
  const aiRows = nextSeasonState.worldPlayers
    .filter((record) => record.playerName !== nextSeasonState.player.fullName)
    .map((record) => buildAiSnapshotRow(season, openingState, nextSeasonState, seasonReport, record))

  return [humanRow, ...aiRows].sort((left, right) => {
    if (left.isHumanPlayer) return -1
    if (right.isHumanPlayer) return 1
    const leftRank = left.worldRank ?? 999
    const rightRank = right.worldRank ?? 999
    if (leftRank !== rightRank) return leftRank - rightRank
    return left.name.localeCompare(right.name)
  })
}

function csvEscape(value: unknown) {
  if (value == null) return ''
  const text = Array.isArray(value)
    ? value.join(';')
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

function sleepSync(milliseconds: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds)
}

function writeFileSyncWithRetries(filePath: string, content: string, attempts = 5) {
  let lastError: unknown = null

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      fs.writeFileSync(filePath, content)
      return
    }
    catch (error) {
      lastError = error
      const code = error instanceof Error && 'code' in error ? String(error.code) : ''
      if (!['EBUSY', 'EPERM', 'UNKNOWN'].includes(code) || attempt === attempts - 1) {
        throw error
      }

      sleepSync(40 * (attempt + 1))
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to write ${filePath}`)
}

function writeSeasonPlayerSnapshots(season: string, rows: PlayerSnapshotRow[]) {
  fs.mkdirSync(playerSnapshotsDir, { recursive: true })
  const fileSlug = seasonToFileSlug(season)
  const jsonPath = path.join(playerSnapshotsDir, `players-${fileSlug}.json`)
  const csvPath = path.join(playerSnapshotsDir, `players-${fileSlug}.csv`)
  const columns = Object.keys(rows[0] ?? {}) as Array<keyof PlayerSnapshotRow>
  const csvLines = [columns.join(',')]

  for (const row of rows) {
    csvLines.push(columns.map((column) => csvEscape(row[column])).join(','))
  }

  writeFileSyncWithRetries(jsonPath, JSON.stringify(rows, null, 2))
  writeFileSyncWithRetries(csvPath, `${csvLines.join('\n')}\n`)
}

function formatAverageOrNa(value: number) {
  return Number.isFinite(value) && value > 0 ? value.toFixed(1) : 'n/a'
}

function formatAverageMetric(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : 'n/a'
}

function formatCountMetric(value: number) {
  return Number.isFinite(value) ? String(value) : 'n/a'
}

function averageMetric(values: number[]) {
  if (values.length === 0) return Number.NaN
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildAccessBandVolumeSummary(season: string, rows: PlayerSnapshotRow[], accessBand: string): AccessBandVolumeSummary {
  const bandRows = rows.filter((row) => row.eventAccessBand === accessBand)
  const warnings = Array.from(new Set(bandRows.flatMap((row) => row.eventVolumeWarnings))).slice(0, 5)
  const eventsEntered = bandRows.map((row) => row.enteredEventsCount ?? 0)
  const matchesPlayed = bandRows.map((row) => row.seasonMatches ?? 0)
  const rankingEvents = bandRows.map((row) => row.rankingEventsEntered ?? 0)
  const qualifiers = bandRows.map((row) => row.qualifierEventsEntered ?? 0)
  const invitationals = bandRows.map((row) => (row.invitationalsEntered ?? 0) + (row.playersSeriesEntered ?? 0))
  const qTourQSchool = bandRows.map((row) => (row.qTourEventsEntered ?? 0) + (row.qSchoolEventsEntered ?? 0))

  return {
    season,
    accessBand,
    playerCount: bandRows.length,
    averageEventsEntered: averageMetric(eventsEntered),
    minEventsEntered: bandRows.length > 0 ? Math.min(...eventsEntered) : Number.NaN,
    maxEventsEntered: bandRows.length > 0 ? Math.max(...eventsEntered) : Number.NaN,
    averageMatchesPlayed: averageMetric(matchesPlayed),
    averageRankingEventsEntered: averageMetric(rankingEvents),
    averageQualifiersEntered: averageMetric(qualifiers),
    averageInvitationalsEntered: averageMetric(invitationals),
    averageQTourQSchoolEventsEntered: averageMetric(qTourQSchool),
    warnings,
  }
}

function buildTournamentCalendarAuditMarkdown(report: SimulationReport) {
  const lines: string[] = []
  lines.push('# Tournament Calendar Audit')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Scenario: ${report.scenario}`)
  lines.push(`- ${getCalendarModelSummary()}`)
  lines.push('- AI entrants by tournament are not tracked in the simulation state, so those cells are reported as n/a.')

  for (const season of report.seasons) {
    lines.push('')
    lines.push(`## ${season.season}`)
    lines.push(`- Calendar summary: ${season.calendar.summary.totalEventsAvailable} total | ranking ${season.calendar.summary.rankingEvents} | qualifiers ${season.calendar.summary.qualifyingEvents} | majors ${season.calendar.summary.majors} | world ${season.calendar.summary.worldChampionshipEvents} | elite invitationals ${season.calendar.summary.eliteInvitationals} | Players Series ${season.calendar.summary.playersSeriesEvents} | Q Tour ${season.calendar.summary.qTourEvents} | Q School ${season.calendar.summary.qSchoolEvents} | amateur/youth ${season.calendar.summary.amateurYouthEvents} | senior/exhibition ${season.calendar.summary.seniorExhibitionEvents}`)
    lines.push(`- Calendar validation: ${season.calendar.validationWarnings.length === 0 ? 'none' : season.calendar.validationWarnings.join(' | ')}`)
    lines.push('')
    lines.push('| Season | Event Date/Week | Tournament Name | Tournament Class | Reporting Class | Eligible Ranks/Statuses | Expected Entry Bands | Configured Field Size | Expected Field Size | Actual Entrants | Format Valid | Frame Format | Round Count | Human Entered | Human Entry Route | AI Entrants | Winner | Prize Fund | Ranking Value | Validation Status |')
    lines.push('| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | ---: | --- | --- | --- | --- | ---: | ---: | --- |')
    for (const entry of season.calendar.entries) {
      lines.push(`| ${entry.season} | ${entry.date}${entry.week == null ? '' : ` / W${entry.week}`} | ${entry.tournamentName} | ${entry.tournamentClass} | ${entry.reportingClass} | ${entry.eligibleStatuses} | ${entry.expectedEntryBands} | ${entry.configuredFieldSize} | ${entry.expectedFieldSize} | ${entry.actualEntrantsTracked == null ? 'n/a' : entry.actualEntrantsTracked} | ${formatFlag(entry.formatValid)} | ${entry.frameFormat} | ${entry.roundCount} | ${formatFlag(entry.humanEntered)} | ${entry.humanEntryRoute} | ${entry.aiEntrantsTracked == null ? 'n/a' : entry.aiEntrantsTracked} | ${entry.winner ?? 'n/a'} | ${formatCurrency(entry.prizeFund)} | ${entry.rankingValue} | ${entry.validationStatus} |`)
    }
  }

  return `${lines.join('\n')}\n`
}

function buildTournamentFormatAuditMarkdown(report: SimulationReport) {
  const lines: string[] = []
  const firstSeason = report.seasons[0]

  lines.push('# Tournament Format Audit')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Scenario: ${report.scenario}`)
  lines.push(`- ${getCalendarModelSummary()}`)

  if (!firstSeason) {
    lines.push('')
    lines.push('No season data available.')
    return `${lines.join('\n')}\n`
  }

  lines.push('')
  lines.push(`## ${firstSeason.season}`)
  lines.push('')
  lines.push('| Tournament ID | Name | Class | Reporting Class | Field Size | Expected Field Size | Round Structure | Frame Format | Eligible Bands | Seeding Model | Ranking Impact | Pathway Impact | Validation Status |')
  lines.push('| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |')

  for (const entry of firstSeason.calendar.entries) {
    lines.push(`| ${entry.tournamentId} | ${entry.tournamentName} | ${entry.tournamentClass} | ${entry.reportingClass} | ${entry.configuredFieldSize} | ${entry.expectedFieldSize} | ${entry.roundStructure} | ${entry.frameFormat} | ${entry.eligibleBands} | ${entry.seedingModel} | ${entry.rankingImpact} | ${entry.pathwayImpact} | ${entry.formatValidationStatus} |`)
  }

  return `${lines.join('\n')}\n`
}

function buildPlayerEventVolumeAuditMarkdown(report: SimulationReport, rowsBySeason: Map<string, PlayerSnapshotRow[]>) {
  const lines: string[] = []
  lines.push('# Player Event Volume Audit')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Scenario: ${report.scenario}`)
  lines.push(`- ${getCalendarModelSummary()}`)
  lines.push('- Human event counts are exact from season history. AI event counts are estimated from season exits against the eligible schedule because per-event AI entry logs are not stored.')

  for (const season of report.seasons) {
    const rows = rowsBySeason.get(season.season) ?? []
    lines.push('')
    lines.push(`## ${season.season}`)
    lines.push(`- Calendar validation: ${season.calendar.validationWarnings.length === 0 ? 'none' : season.calendar.validationWarnings.join(' | ')}`)
    lines.push('')
    lines.push('| Access Band | Player Count | Avg Events Entered | Min Events | Max Events | Avg Matches | Avg Ranking Events | Avg Qualifiers | Avg Invitationals | Avg Q Tour/Q School | Warnings |')
    lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |')
    for (const accessBand of ACCESS_BAND_ORDER) {
      const summary = buildAccessBandVolumeSummary(season.season, rows, accessBand)
      lines.push(`| ${summary.accessBand} | ${summary.playerCount} | ${formatAverageMetric(summary.averageEventsEntered)} | ${formatCountMetric(summary.minEventsEntered)} | ${formatCountMetric(summary.maxEventsEntered)} | ${formatAverageMetric(summary.averageMatchesPlayed)} | ${formatAverageMetric(summary.averageRankingEventsEntered)} | ${formatAverageMetric(summary.averageQualifiersEntered)} | ${formatAverageMetric(summary.averageInvitationalsEntered)} | ${formatAverageMetric(summary.averageQTourQSchoolEventsEntered)} | ${summary.warnings.length === 0 ? 'none' : summary.warnings.join('; ')} |`)
      }
  }

  return `${lines.join('\n')}\n`
}

function getRankingAuditSeasonOpenRank(season: SeasonReport) {
  return season.performance.openingRankingLabel === 'World Ranking'
    ? season.performance.openingRanking
    : season.pathway.seasonOpen.worldRank
}

function getRankingAuditSeasonCloseRank(season: SeasonReport) {
  return season.performance.closingRankingLabel === 'World Ranking'
    ? season.performance.closingRanking
    : season.pathway.nextSeasonOpen.worldRank
}

function getRankingAuditRawCloseRank(season: SeasonReport) {
  return season.pathway.nextSeasonOpen.worldRank
}

function getBestRankingResultLabel(tournaments: SeasonReport['tournaments']) {
  const rankingTournaments = tournaments.filter((tournament) => tournament.countedInRankingRecord)
  if (rankingTournaments.length === 0) return 'none'
  return getBestFinishLabel(rankingTournaments)
}

function getRankingRealismReason(
  season: SeasonReport,
  openRank: number | null,
  closeRank: number | null,
  rawCloseRank: number | null,
  rankingPoints: number,
  rankingPrizeMoney: number,
) {
  const reasons: string[] = []
  if (closeRank != null && rawCloseRank != null && closeRank !== rawCloseRank) {
    reasons.push(`history floor changed raw close #${rawCloseRank} to reported #${closeRank}`)
  }
  if (openRank != null && closeRank != null) {
    const delta = openRank - closeRank
    if (delta > 0) reasons.push(`rank improved by ${delta}`)
    if (delta < 0) reasons.push(`rank fell by ${Math.abs(delta)}`)
  }
  if (rankingPoints > 0 || rankingPrizeMoney > 0) {
    reasons.push(`${rankingPoints} points and ${formatCurrency(rankingPrizeMoney)} ranking prize earned`)
  }
  if (reasons.length === 0) {
    reasons.push('no meaningful ranking movement signal')
  }
  return reasons.join(' | ')
}

function hasPlausibleEliteRestSeason(season: SeasonReport) {
  const proEvents = getProfessionalEventsEntered(season.playerEntries)
  const prestigeEvents = getPrestigeEventCount(season.playerEntries)
  const openRank = getReportedSeasonOpenWorldRank(season) ?? 999
  const closeRank = getReportedSeasonCloseWorldRank(season) ?? 999
  return Math.min(openRank, closeRank) <= 4
    && (season.playerAtNextSeasonOpen.age >= 37 || /world champion|major contender/i.test(season.playerAtNextSeasonOpen.competitiveStatus))
    && proEvents >= 7
    && season.playerEntries.rankingEventsEntered + season.playerEntries.qualifiersEntered >= 3
    && prestigeEvents >= 2
    && season.playerEntries.worldChampionshipMainDrawEntered
    && season.performance.matchesPlayed >= 12
}

function getProfileWinRateTarget(profile: ManagedSupportProfile) {
  if (profile === 'worst') return { min: 5, max: 25 }
  if (profile === 'best') return { min: 60, max: 72 }
  return { min: 42, max: 55 }
}

function getProfileTitlePlausibility(profile: ManagedSupportProfile, titles: number) {
  if (profile === 'worst') return titles <= 1
  if (profile === 'best') return titles >= 8 && titles <= 25
  return titles >= 2 && titles <= 12
}

function getProfileRankPlausibility(profile: ManagedSupportProfile, finalWorldRank: number | null) {
  if (finalWorldRank == null) return false
  if (profile === 'worst') return finalWorldRank >= 65
  if (profile === 'best') return finalWorldRank <= 4
  return finalWorldRank <= 16
}

function getWorldOutcomePlausibility(profile: ManagedSupportProfile, worldTitles: number, finalStatus: string) {
  if (profile === 'worst') return worldTitles === 0 && !/world champion/i.test(finalStatus)
  if (profile === 'best') return worldTitles >= 1 && /world champion|major contender/i.test(finalStatus)
  return worldTitles <= 2
}

function getEventVolumePlausibility(profile: ManagedSupportProfile, report: SimulationReport) {
  const metrics = report.supportMetrics
  if (!metrics) return false
  const lowEventWarnings = buildSupportComparisonWarnings([report]).filter((warning) => /events without fatigue reason|ranking events without fatigue reason/i.test(warning))
  const threshold = profile === 'worst' ? 6 : 8
  return metrics.averageProEventsAfterTurningPro >= threshold && lowEventWarnings.length === 0
}

function getEventVolumeThreshold(profile: ManagedSupportProfile) {
  return profile === 'worst' ? 6 : 8
}

function loadRepeatedSeedThresholdSummary() {
  const repeatedSeedPath = path.join(reportsDir, 'repeated-seed-ai-balance-audit.md')
  if (!fs.existsSync(repeatedSeedPath)) {
    return {
      maxProEventsAfterTurningPro: null as number | null,
      hasThresholdWarnings: false,
    }
  }

  const contents = fs.readFileSync(repeatedSeedPath, 'utf8')
  const maxProEventsMatch = contents.match(/max pro events after turning pro target:\s*>=\s*8\.0\s*\| observed\s*([0-9.]+)/i)
  const thresholdWarningsMatch = contents.match(/Threshold warnings:\s*(.+)/i)
  return {
    maxProEventsAfterTurningPro: maxProEventsMatch ? Number.parseFloat(maxProEventsMatch[1] ?? '') : null,
    hasThresholdWarnings: Boolean(thresholdWarningsMatch && !/none/i.test(thresholdWarningsMatch[1] ?? '')),
  }
}

function buildRealismVerdictEntry(
  report: SimulationReport,
  repeatedSeedThresholdSummary: ReturnType<typeof loadRepeatedSeedThresholdSummary>,
) {
  const metrics = report.supportMetrics
  if (!metrics) return null
  const profile = metrics.supportProfile
  const allTournaments = report.seasons.flatMap((season) => season.tournaments)
  const titleSummary = buildTitleSummary(allTournaments)
  const proRecord = combineCompetitionRecords('Professional', metrics.recordByLevel, ['rookieBottomQualifiers', 'proQualifying', 'rankingEvents', 'majors', 'worldQualifying', 'worldMainDraw', 'playersSeries', 'invitationals'])
  const profileWarnings = buildSupportComparisonWarnings([report])
  const lowEventWarnings = profileWarnings.filter((warning) => /events without fatigue reason|ranking events without fatigue reason/i.test(warning))
  const nonEventWarnings = profileWarnings.filter((warning) => !/events without fatigue reason|ranking events without fatigue reason/i.test(warning))
  const targetBand = getProfileWinRateTarget(profile)
  const eventVolumeThreshold = getEventVolumeThreshold(profile)
  const singleRunEventVolumePass = metrics.averageProEventsAfterTurningPro >= eventVolumeThreshold
  const aggregateEventVolumePass = profile === 'best'
    && (repeatedSeedThresholdSummary.maxProEventsAfterTurningPro ?? 0) >= 8
    && !repeatedSeedThresholdSummary.hasThresholdWarnings
  const rankPlausible = getProfileRankPlausibility(profile, metrics.finalWorldRank)
  const proWinPlausible = proRecord.winPercentage >= targetBand.min && proRecord.winPercentage <= targetBand.max
  const titlePlausible = getProfileTitlePlausibility(profile, titleSummary.totalTitles)
  const eventVolumeAssessment = aggregateEventVolumePass
    ? 'yes'
    : singleRunEventVolumePass
      ? (lowEventWarnings.length > 0 ? 'watch' : 'yes')
      : 'no'
  const worldOutcomePlausible = getWorldOutcomePlausibility(profile, titleSummary.worldTitles, metrics.finalCompetitiveStatus)
  const matchConcern = !rankPlausible
    ? 'rank outcome still looks off'
    : !proWinPlausible
      ? `pro win rate sits outside the target band (${targetBand.min}-${targetBand.max}%)`
        : !worldOutcomePlausible
          ? 'World Championship outcome still looks too soft or too strong'
          : !titlePlausible
            ? 'title count still does not line up cleanly with profile strength'
            : nonEventWarnings[0]?.replace(/^.*?:\s*/, '').replace(/\.$/, '') ?? 'none'

  return {
    profile: getSupportProfileDisplayName(profile),
    rankPlausible,
    proWinPlausible,
    titlePlausible,
    worldOutcomePlausible,
    matchConcern,
  }
}

function buildEventVolumeVerdictEntry(
  report: SimulationReport,
  repeatedSeedThresholdSummary: ReturnType<typeof loadRepeatedSeedThresholdSummary>,
) {
  const metrics = report.supportMetrics
  if (!metrics) return null

  const profile = metrics.supportProfile
  const profileWarnings = buildSupportComparisonWarnings([report])
  const lowEventWarnings = profileWarnings.filter((warning) => /events without fatigue reason|ranking events without fatigue reason/i.test(warning))
  const eventVolumeThreshold = getEventVolumeThreshold(profile)
  const singleRunEventVolumePass = metrics.averageProEventsAfterTurningPro >= eventVolumeThreshold
  const aggregateEventVolumePass = profile === 'best'
    && (repeatedSeedThresholdSummary.maxProEventsAfterTurningPro ?? 0) >= 8
    && !repeatedSeedThresholdSummary.hasThresholdWarnings
  const eventVolumeAssessment = aggregateEventVolumePass
    ? 'yes'
    : singleRunEventVolumePass
      ? (lowEventWarnings.length > 0 ? 'watch' : 'yes')
      : 'no'
  const concern = eventVolumeAssessment === 'no'
    ? lowEventWarnings.length > 0
      ? 'elite event mix still throws low-volume warnings'
      : 'average pro-event volume stayed below the plausibility threshold'
    : aggregateEventVolumePass && lowEventWarnings.length > 0
      ? 'single-run low-volume seasons are a watch item, but the repeated-seed event-volume threshold passed'
      : eventVolumeAssessment === 'watch'
        ? 'single-run low-volume seasons are worth watching, but the aggregate event-volume baseline is acceptable'
        : 'none'

  return {
    profile: getSupportProfileDisplayName(profile),
    eventVolumeAssessment,
    concern,
  }
}

function buildRankingPointsRealismAuditMarkdown(report: SimulationReport) {
  const lines: string[] = []
  lines.push('# Ranking Points Realism Audit')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Scenario: ${report.scenario}`)
  lines.push('- World ranking is points-driven in the live model, with prize money only used as a tie-breaker when points are equal.')
  lines.push('- Close rank reports the ranking used by the season review. When that differs from the raw next-season world table rank, the audit marks a rank floor/cap adjustment.')

  for (const season of report.seasons) {
    const openRank = getRankingAuditSeasonOpenRank(season)
    const closeRank = getRankingAuditSeasonCloseRank(season)
    const rawCloseRank = getRankingAuditRawCloseRank(season)
    const rankFloorApplied = closeRank != null && rawCloseRank != null && closeRank !== rawCloseRank
    const proTournaments = season.tournaments.filter((tournament) => tournament.countedInProRecord)
    const rankingTournaments = season.tournaments.filter((tournament) => tournament.countedInRankingRecord)
    const proWins = proTournaments.reduce((sum, tournament) => sum + tournament.wins, 0)
    const proLosses = proTournaments.reduce((sum, tournament) => sum + tournament.losses, 0)
    const proMatches = proWins + proLosses
    const proWinRate = proMatches > 0 ? (proWins / proMatches) * 100 : 0
    const rankingWins = rankingTournaments.reduce((sum, tournament) => sum + tournament.wins, 0)
    const rankingLosses = rankingTournaments.reduce((sum, tournament) => sum + tournament.losses, 0)
    const rankingPoints = rankingTournaments.reduce((sum, tournament) => sum + tournament.rankingPoints, 0)
    const rankingPrizeMoney = rankingTournaments.reduce((sum, tournament) => sum + tournament.prizeMoney, 0)
    const rankingTitles = rankingTournaments.filter((tournament) => tournament.countedInRankingTitleRecord).length
    const majorFinals = season.tournaments.filter((tournament) => tournament.isMajor && getSimulationTournamentResultTier(tournament) >= 4).length
    const worldMainDrawMatches = season.tournaments
      .filter((tournament) => tournament.isWorldMainDraw)
      .reduce((sum, tournament) => sum + tournament.matchesPlayed, 0)
    const firstRoundExits = rankingTournaments.filter((tournament) => tournament.countedInRankingMainDrawRecord && tournament.losses > 0 && tournament.matchesPlayed <= 1).length
    const qualifierExits = rankingTournaments.filter((tournament) => tournament.countedInRankingQualifierRecord && tournament.losses > 0).length
    const warningFlags: string[] = []

    if ((closeRank ?? 999) <= 32 && proWinRate < 20) {
      warningFlags.push('player reaches top 32 with pro win rate below 20%')
    }
    if ((closeRank ?? 999) <= 16 && rankingTitles === 0 && majorFinals === 0 && proWinRate < 30) {
      warningFlags.push('player reaches top 16 with no ranking titles, no major finals, and pro win rate below 30%')
    }
    if (openRank != null && closeRank != null && closeRank < openRank && proLosses > proWins) {
      warningFlags.push('player gains ranking despite losing most pro matches')
    }
    if ((closeRank ?? 999) <= 32 && worldMainDrawMatches === 0) {
      warningFlags.push('player has 0 World main draw matches but reaches top 32')
    }
    if ((closeRank ?? 999) <= 32 && rankFloorApplied) {
      warningFlags.push('player receives top-32 status from rank floor/cap rather than results')
    }

    lines.push('')
    lines.push(`## ${season.season}`)
    lines.push(`- Open rank: ${formatCount(openRank)}`)
    lines.push(`- Close rank: ${formatCount(closeRank)}`)
    lines.push(`- Raw next-season world rank: ${formatCount(rawCloseRank)}`)
    lines.push(`- Ranking points earned: ${rankingPoints}`)
    lines.push(`- Ranking prize money: ${formatCurrency(rankingPrizeMoney)}`)
    lines.push(`- Ranking matches W/L: ${rankingWins}-${rankingLosses}`)
    lines.push(`- Ranking titles: ${rankingTitles}`)
    lines.push(`- Best ranking event result: ${getBestRankingResultLabel(season.tournaments)}`)
    lines.push(`- First-round exits: ${firstRoundExits}`)
    lines.push(`- Qualifier exits: ${qualifierExits}`)
    lines.push(`- Rank change reason: ${getRankingRealismReason(season, openRank, closeRank, rawCloseRank, rankingPoints, rankingPrizeMoney)}`)
    lines.push(`- Rank floor/cap applied: ${rankFloorApplied ? 'yes' : 'no'}`)
    lines.push(`- Warning flags: ${warningFlags.length === 0 ? 'none' : warningFlags.join(' | ')}`)
  }

  return `${lines.join('\n')}\n`
}

function writeTournamentCalendarAudit(report: SimulationReport) {
  fs.writeFileSync(path.join(reportsDir, 'tournament-calendar-audit.md'), buildTournamentCalendarAuditMarkdown(report))
}

function writeTournamentFormatAudit(report: SimulationReport) {
  fs.writeFileSync(path.join(reportsDir, 'tournament-format-audit.md'), buildTournamentFormatAuditMarkdown(report))
}

function writePlayerEventVolumeAudit(report: SimulationReport, rowsBySeason: Map<string, PlayerSnapshotRow[]>) {
  fs.writeFileSync(path.join(reportsDir, 'player-event-volume-audit.md'), buildPlayerEventVolumeAuditMarkdown(report, rowsBySeason))
}

function writeRankingPointsRealismAudit(report: SimulationReport) {
  fs.writeFileSync(path.join(reportsDir, 'ranking-points-realism-audit.md'), buildRankingPointsRealismAuditMarkdown(report))
}

function buildSeasonAuditSummary(season: string, rows: PlayerSnapshotRow[], previousRows: PlayerSnapshotRow[] | null): SeasonAuditSummary {
  const aiRows = rows.filter((row) => !row.isHumanPlayer)
  const previousByName = new Map((previousRows ?? []).map((row) => [row.name, row]))
  const top16 = aiRows.filter((row) => (row.worldRank ?? 999) <= 16)
  const top64 = aiRows.filter((row) => (row.worldRank ?? 999) <= 64)
  const gainedTourCards = aiRows.filter((row) => row.isTourCardHolder && row.tourCardYear === 1).map((row) => row.name)
  const lostTourCards = aiRows.filter((row) => {
    const previous = previousByName.get(row.name)
    return Boolean(previous?.isTourCardHolder) && !row.isTourCardHolder
  }).map((row) => row.name)
  const returnedViaQSchool = aiRows.filter((row) => row.isOnMainTour && row.tourCardSource === 'Q School').map((row) => row.name)
  const movedToQTour = aiRows.filter((row) => {
    const previous = previousByName.get(row.name)
    return previous?.actualCircuit !== 'qTour' && row.actualCircuit === 'qTour'
  }).map((row) => row.name)
  const movedToSenior = aiRows.filter((row) => {
    const previous = previousByName.get(row.name)
    return previous?.actualCircuit !== 'senior' && row.actualCircuit === 'senior'
  }).map((row) => row.name)
  const biggestClimbers = [...aiRows]
    .filter((row) => row.rankChange != null && row.rankChange > 0)
    .sort((left, right) => (right.rankChange ?? 0) - (left.rankChange ?? 0))
    .slice(0, 5)
    .map((row) => `${row.name} (${formatSignedNumber(row.rankChange ?? 0)})`)
  const biggestFallers = [...aiRows]
    .filter((row) => row.rankChange != null && row.rankChange < 0)
    .sort((left, right) => (left.rankChange ?? 0) - (right.rankChange ?? 0))
    .slice(0, 5)
    .map((row) => `${row.name} (${row.rankChange ?? 0})`)
  const youngestTop16Player = [...top16].sort((left, right) => left.age - right.age)[0]
  const oldestTop16Player = [...top16].sort((left, right) => right.age - left.age)[0]
  const topProspects = [...aiRows]
    .filter((row) => row.age <= 24)
    .sort((left, right) => (right.potential ?? 0) - (left.potential ?? 0))
    .slice(0, 5)
    .map((row) => `${row.name} (${row.potential ?? 'n/a'})`)
  const stalledProspects = aiRows
    .filter((row) => row.warningFlags.includes('high-potential-stalled') || row.stalledReason != null)
    .slice(0, 5)
    .map((row) => row.stalledReason ? `${row.name}: ${row.stalledReason}` : row.name)
  const overperformers = aiRows.filter((row) => (row.potential ?? 99) <= 72 && (row.worldRank ?? 999) <= 16).slice(0, 5).map((row) => `${row.name} (#${row.worldRank ?? 'n/a'})`)
  const invalidPlayers = aiRows
    .filter((row) => !row.validTourStatus || row.invalidStateReasons.length > 0)
    .slice(0, 10)
    .map((row) => `${row.name}: ${[row.invalidAccessReason, ...row.invalidStateReasons].filter(Boolean).join(', ') || 'invalid state'}`)
  const warnings: string[] = []
  const activeAiRows = aiRows.filter((row) => row.isOnMainTour
    || row.qTourRank != null
    || row.qSchoolRank != null
    || row.amateurRank != null
    || row.youthRank != null
    || row.seniorRank != null)
  const activeAiAverageSeasonMatches = activeAiRows.length > 0
    ? activeAiRows.reduce((sum, row) => sum + (row.seasonMatches ?? 0), 0) / activeAiRows.length
    : 0
  const activeAiZeroMatchPlayers = activeAiRows.filter((row) => (row.seasonMatches ?? 0) === 0).length
  const newAiPlayers = previousRows
    ? aiRows.filter((row) => !previousRows.some((previous) => previous.name === row.name)).length
    : aiRows.filter((row) => row.age <= 18 && row.careerMatches <= (row.seasonMatches ?? 0)).length
  const aiOverallMovers = previousRows
    ? aiRows.filter((row) => {
        const previous = previousByName.get(row.name)
        return previous != null && previous.overall != null && row.overall != null && previous.overall !== row.overall
      }).length
    : 0
  const aiPotentialMovers = previousRows
    ? aiRows.filter((row) => {
        const previous = previousByName.get(row.name)
        return previous != null && previous.potential != null && row.potential != null && previous.potential !== row.potential
      }).length
    : 0

  const activeMainTourPlayers = aiRows.filter((row) => row.isOnMainTour).length + (rows.some((row) => row.isHumanPlayer && row.isOnMainTour) ? 1 : 0)
  if (activeMainTourPlayers > 128) warnings.push(`active main tour exceeds 128 (${activeMainTourPlayers})`)
  if (activeMainTourPlayers < 128) warnings.push(`active main tour below 128 (${activeMainTourPlayers})`)
  if (activeAiRows.length >= 100 && activeAiAverageSeasonMatches < 3) warnings.push(`AI active-player season match average too low (${activeAiAverageSeasonMatches.toFixed(1)})`)
  if (activeAiRows.length >= 100 && activeAiZeroMatchPlayers / activeAiRows.length > 0.35) warnings.push(`too many active AI players recorded zero matches (${activeAiZeroMatchPlayers}/${activeAiRows.length})`)
  if (previousRows && newAiPlayers === 0) warnings.push('no new AI players entered the snapshot pool')
  if (previousRows && aiOverallMovers < Math.max(10, Math.floor(aiRows.length * 0.03))) warnings.push(`too few AI overall ratings moved (${aiOverallMovers})`)
  if (previousRows && aiPotentialMovers < Math.max(8, Math.floor(aiRows.length * 0.02))) warnings.push(`too few AI potential ratings moved (${aiPotentialMovers})`)
  if (invalidPlayers.length > 0) warnings.push(`AI players with invalid career state (${invalidPlayers.length} shown)`)
  if (aiRows.some((row) => row.warningFlags.includes('outside-top128-active-main-tour'))) warnings.push('player outside top 128 marked as active main-tour player')
  if (aiRows.some((row) => row.warningFlags.includes('outside-top64-retained-without-protection'))) warnings.push('player ranked 65-128 retained without active card protection')
  if (aiRows.some((row) => row.warningFlags.includes('expired-card-not-dropped'))) warnings.push('player outside top 64 with expired card not dropped')
  if (aiRows.some((row) => row.tourCardSource === 'Q School' && !row.isOnMainTour)) warnings.push('Q School card winner not added to main tour')
  if (lostTourCards.some((name) => {
    const row = aiRows.find((entry) => entry.name === name)
    return row != null && !['qSchool', 'qTour', 'amateur', 'senior', 'youth'].includes(row.actualCircuit)
  })) warnings.push('dropped player did not appear in feeder pool')
  if (aiRows.some((row) => row.warningFlags.includes('rookie-pro-stuck'))) warnings.push('AI rookie status persisted beyond two-year card protection')
  if (previousRows) {
    const previousYouth = new Set(previousRows.filter((row) => !row.isHumanPlayer && row.actualCircuit === 'youth').map((row) => row.name))
    const currentYouthEntrants = aiRows.filter((row) => row.actualCircuit === 'youth' && !previousYouth.has(row.name))

    const previousQTour = new Set(previousRows.filter((row) => !row.isHumanPlayer && row.actualCircuit === 'qTour').map((row) => row.name))
    const currentQTour = new Set(aiRows.filter((row) => row.actualCircuit === 'qTour').map((row) => row.name))
    const qTourChurn = [...currentQTour].filter((name) => !previousQTour.has(name)).length + [...previousQTour].filter((name) => !currentQTour.has(name)).length

    const previousQSchool = new Set(previousRows.filter((row) => !row.isHumanPlayer && row.actualCircuit === 'qSchool').map((row) => row.name))
    const currentQSchool = new Set(aiRows.filter((row) => row.actualCircuit === 'qSchool').map((row) => row.name))
    const qSchoolChurn = [...currentQSchool].filter((name) => !previousQSchool.has(name)).length + [...previousQSchool].filter((name) => !currentQSchool.has(name)).length
    if (qSchoolChurn === 0) warnings.push('no Q School churn')
  }

  return {
    season,
    activeMainTourPlayers,
    activeAiAverageSeasonMatches,
    activeAiZeroMatchPlayers,
    newAiPlayers,
    aiOverallMovers,
    aiPotentialMovers,
    top16AverageAge: top16.length > 0 ? top16.reduce((sum, row) => sum + row.age, 0) / top16.length : 0,
    top16AverageOverall: top16.length > 0 ? top16.reduce((sum, row) => sum + (row.overall ?? 0), 0) / top16.length : 0,
    top16AveragePotential: top16.length > 0 ? top16.reduce((sum, row) => sum + (row.potential ?? 0), 0) / top16.length : 0,
    top64AverageAge: top64.length > 0 ? top64.reduce((sum, row) => sum + row.age, 0) / top64.length : 0,
    top64AverageOverall: top64.length > 0 ? top64.reduce((sum, row) => sum + (row.overall ?? 0), 0) / top64.length : 0,
    top64AveragePotential: top64.length > 0 ? top64.reduce((sum, row) => sum + (row.potential ?? 0), 0) / top64.length : 0,
    gainedTourCards,
    lostTourCards,
    returnedViaQSchool,
    movedToQTour,
    movedToSenior,
    biggestClimbers,
    biggestFallers,
    youngestTop16Player: youngestTop16Player ? `${youngestTop16Player.name} (${youngestTop16Player.age})` : null,
    oldestTop16Player: oldestTop16Player ? `${oldestTop16Player.name} (${oldestTop16Player.age})` : null,
    topProspects,
    stalledProspects,
    overperformers,
    invalidPlayers,
    warnings,
  }
}

function buildAiAuditMarkdown(report: SimulationReport, summaries: SeasonAuditSummary[]) {
  const lines: string[] = []
  lines.push('# AI Player Progression Audit')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Scenario: ${report.scenario}`)
  lines.push(`Seasons completed: ${report.seasonsCompleted}`)

  for (const summary of summaries) {
    lines.push('')
    lines.push(`## ${summary.season}`)
    lines.push(`- Total active main-tour players: ${summary.activeMainTourPlayers}`)
    lines.push(`- Active AI season match average / zero-match players: ${formatAverageOrNa(summary.activeAiAverageSeasonMatches)} / ${summary.activeAiZeroMatchPlayers}`)
    lines.push(`- New AI players / overall movers / potential movers: ${summary.newAiPlayers} / ${summary.aiOverallMovers} / ${summary.aiPotentialMovers}`)
    lines.push(`- Top 16 average age / overall / potential: ${formatAverageOrNa(summary.top16AverageAge)} / ${formatAverageOrNa(summary.top16AverageOverall)} / ${formatAverageOrNa(summary.top16AveragePotential)}`)
    lines.push(`- Top 64 average age / overall / potential: ${formatAverageOrNa(summary.top64AverageAge)} / ${formatAverageOrNa(summary.top64AverageOverall)} / ${formatAverageOrNa(summary.top64AveragePotential)}`)
    lines.push(`- Players gaining tour cards: ${summary.gainedTourCards.join(', ') || 'none'}`)
    lines.push(`- Players losing tour cards: ${summary.lostTourCards.join(', ') || 'none'}`)
    lines.push(`- Players returning via Q School: ${summary.returnedViaQSchool.join(', ') || 'none'}`)
    lines.push(`- Players moving to Q Tour: ${summary.movedToQTour.join(', ') || 'none'}`)
    lines.push(`- Players moving to senior/legend circuit: ${summary.movedToSenior.join(', ') || 'none'}`)
    lines.push(`- Biggest ranking climbers: ${summary.biggestClimbers.join(', ') || 'none'}`)
    lines.push(`- Biggest ranking fallers: ${summary.biggestFallers.join(', ') || 'none'}`)
    lines.push(`- Youngest top 16 player: ${summary.youngestTop16Player ?? 'n/a'}`)
    lines.push(`- Oldest top 16 player: ${summary.oldestTop16Player ?? 'n/a'}`)
    lines.push(`- Top prospects by potential: ${summary.topProspects.join(', ') || 'none'}`)
    lines.push(`- High-potential players who failed to progress: ${summary.stalledProspects.join(', ') || 'none'}`)
    lines.push(`- Low-potential players overperforming: ${summary.overperformers.join(', ') || 'none'}`)
    lines.push(`- AI players with invalid career state: ${summary.invalidPlayers.join(' | ') || 'none'}`)
    lines.push(`- Warnings: ${summary.warnings.join(' | ') || 'none'}`)
  }

  return `${lines.join('\n')}\n`
}

function writeAiPlayerProgressionAudit(report: SimulationReport, summaries: SeasonAuditSummary[]) {
  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(path.join(reportsDir, 'ai-player-progression-audit.md'), buildAiAuditMarkdown(report, summaries))
}

function formatNameList(names: string[], totalCount?: number) {
  if (names.length === 0) return 'none'
  const suffix = totalCount != null && totalCount > names.length ? ` (+${totalCount - names.length} more)` : ''
  return `${names.join(', ')}${suffix}`
}

function formatSeasonRank(label: string, rank: number) {
  if (!Number.isFinite(rank) || rank >= 999) {
    return label.includes('World') ? 'World n/a' : `${label.replace(' Ranking', '')} n/a`
  }

  if (label === 'World Ranking') return `World ${rank}`
  if (label === 'Q Tour Ranking') return `Q Tour ${rank}`
  if (label === 'Q School Ranking') return `Q School ${rank}`
  if (label === 'Youth Ranking') return `Youth ${rank}`
  return `Amateur ${rank}`
}

function formatMovementLine(label: string, movement: CircuitMovement) {
  const entrants = movement.entrants.slice(0, 5).join(', ') || 'none'
  const leavers = movement.leavers.slice(0, 5).join(', ') || 'none'
  return `- ${label}: ${movement.count} changes | entrants: ${entrants} | leavers: ${leavers}`
}

function formatCompetitionRecordInline(record: CompetitionRecord) {
  return `${record.matches} (${record.wins}-${record.losses}, ${formatPercent(record.winPercentage)})`
}

function appendCompetitionLevelTable(lines: string[], records: CompetitionRecord[]) {
  lines.push('## Record by Competition Level')
  lines.push('')
  lines.push('| Level | Events | Matches | W | L | D | Win % | Titles | Finals | Deep Runs | Prize | Points | Avg Opponent | Avg Strength | Avg Win Prob |')
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')
  for (const level of COMPETITION_LEVEL_ORDER.filter((entry) => entry !== 'overall')) {
    const record = getCompetitionLevelRecord(records, level)
    lines.push(`| ${record.label} | ${record.eventsEntered} | ${record.matches} | ${record.wins} | ${record.losses} | ${record.draws} | ${formatPercent(record.winPercentage)} | ${record.titles} | ${record.finals} | ${record.deepRuns} | ${formatCurrency(record.prizeMoney)} | ${record.rankingPoints} | ${record.averageOpponentStrength == null ? 'n/a' : record.averageOpponentStrength.toFixed(1)} | ${record.averagePlayerStrength == null ? 'n/a' : record.averagePlayerStrength.toFixed(1)} | ${record.averageWinProbability == null ? 'n/a' : formatPercent(record.averageWinProbability)} |`)
  }
}

function appendCareerPhaseTable(lines: string[], records: CareerPhaseRecord[]) {
  lines.push('')
  lines.push('## Record by Career Phase')
  lines.push('')
  lines.push('| Phase | Seasons | Events | Matches | W | L | Win % | Titles | Best Rank | Prize |')
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')
  for (const record of records) {
    lines.push(`| ${record.label} | ${record.seasons} | ${record.eventsEntered} | ${record.matches} | ${record.wins} | ${record.losses} | ${formatPercent(record.winPercentage)} | ${record.titles} | ${record.bestWorldRank ?? 'n/a'} | ${formatCurrency(record.prizeMoney)} |`)
  }
}

function buildHumanMatchCountAuditMarkdown(report: SimulationReport) {
  const lines: string[] = []
  lines.push('# Human Match Count Audit')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Scenario: ${report.scenario}`)
  lines.push(`- ${getCalendarModelSummary()}`)
  lines.push('- Scope: canonical round accounting and match-result reporting only. Event-volume and schedule-selection warnings live in the calendar and player-event-volume audits.')

  for (const season of report.seasons) {
    lines.push('')
    lines.push(`## ${season.season}`)
    lines.push(`- Player phase/status: ${season.playerAtSeasonOpen.careerPhase} / ${season.playerAtSeasonOpen.competitiveStatus}`)
    lines.push('')
    lines.push('| Season | Phase | Status | Tournament | Class | Reporting | Level | Field Size | Round Reached | Expected Matches | Actual Matches | Expected Wins | Actual Wins | Expected Losses | Actual Losses | Avg Opp Str | Avg Opp Rank | Avg Win Prob | Actual W% | vs Exp | Top 16 | Top 32 | Top 64 | 65-128 | Q Tour/Am | Youth | Ranking | Major | Ranking Qual | Ranking Main | Total | Pro | Ranking Rec | Title | Ranking Title | Major Title | World Title | Prize | Points | Warning Flags |')
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- |')
    for (const entry of season.matchCountAudit) {
      lines.push(`| ${entry.season} | ${entry.playerPhase} | ${entry.playerStatus} | ${entry.tournamentName} | ${entry.tournamentClass} | ${entry.reportingClass} | ${getCompetitionLevelLabel(entry.levelBucket)} | ${entry.fieldSize} | ${entry.roundReached} | ${entry.expectedMatches} | ${entry.actualMatchesAdded} | ${entry.expectedWins} | ${entry.actualWinsAdded} | ${entry.expectedLosses} | ${entry.actualLossesAdded} | ${entry.averageOpponentStrength == null ? 'n/a' : entry.averageOpponentStrength.toFixed(1)} | ${entry.averageOpponentRanking == null ? 'n/a' : entry.averageOpponentRanking.toFixed(1)} | ${entry.averageWinProbability == null ? 'n/a' : formatPercent(entry.averageWinProbability)} | ${formatPercent(entry.actualWinRate)} | ${entry.winRateVsExpected == null ? 'n/a' : `${entry.winRateVsExpected > 0 ? '+' : ''}${entry.winRateVsExpected.toFixed(1)}%`} | ${entry.opponentRankBandCounts['Top 16']} | ${entry.opponentRankBandCounts['Top 32']} | ${entry.opponentRankBandCounts['Top 64']} | ${entry.opponentRankBandCounts['65-128']} | ${entry.opponentRankBandCounts['Q Tour/amateur']} | ${entry.opponentRankBandCounts.youth} | ${formatFlag(entry.isRankingEvent)} | ${formatFlag(entry.isMajor)} | ${formatFlag(entry.countedInRankingQualifierRecord)} | ${formatFlag(entry.countedInRankingMainDrawRecord)} | ${formatFlag(entry.countedInTotalRecord)} | ${formatFlag(entry.countedInProRecord)} | ${formatFlag(entry.countedInRankingRecord)} | ${formatFlag(entry.countedInTitleRecord)} | ${formatFlag(entry.countedInRankingTitleRecord)} | ${formatFlag(entry.countedInMajorTitleRecord)} | ${formatFlag(entry.countedInWorldTitleRecord)} | ${formatCurrency(entry.rankingMoneyAwarded)} | ${entry.rankingPointsAwarded} | ${entry.warningFlags.length === 0 ? 'none' : entry.warningFlags.join('; ')} |`)
    }
  }

  return `${lines.join('\n')}\n`
}

function writeHumanMatchCountAudit(report: SimulationReport) {
  fs.writeFileSync(path.join(reportsDir, 'human-match-count-audit.md'), buildHumanMatchCountAuditMarkdown(report))
}

function writeStatusIntegrityAudit(report: SimulationReport) {
  fs.writeFileSync(path.join(reportsDir, 'status-integrity-audit.md'), buildStatusIntegrityAuditMarkdown(report))
}

function appendStatusIntegrityAuditSection(lines: string[], audit: StatusIntegrityAudit) {
  lines.push('## Status Integrity Audit')
  lines.push('')
  lines.push(`- Final status: ${audit.finalStatus}`)
  lines.push(`- worldTitles: ${audit.worldTitles}`)
  lines.push(`- worldChampionshipWins: ${audit.worldChampionshipWins}`)
  lines.push(`- majorTitles: ${audit.majorTitles}`)
  lines.push(`- rankingTitles: ${audit.rankingTitles}`)
  lines.push(`- bestTournamentResult: ${audit.bestTournamentResult}`)
  lines.push(`- source of status assignment: ${audit.sourceOfStatusAssignment}`)
  lines.push(`- valid: ${audit.valid ? 'yes' : 'no'}`)
  if (audit.warnings.length === 0) {
    lines.push('- warning: none')
  } else {
    for (const warning of audit.warnings) {
      lines.push(`- warning: ${warning}`)
    }
  }
}

function buildStatusIntegrityAuditMarkdown(report: SimulationReport) {
  const lines: string[] = []
  lines.push('# Status Integrity Audit')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Scenario: ${report.scenario}`)
  lines.push('')
  appendStatusIntegrityAuditSection(lines, report.statusIntegrityAudit)
  return `${lines.join('\n')}\n`
}

function buildMarkdown(report: SimulationReport) {
  const lines: string[] = []
  const allTournaments = report.seasons.flatMap((season) => season.tournaments)
  const levelRecords = report.supportMetrics?.recordByLevel ?? buildCompetitionRecords(report.seasons.flatMap((season) => season.tournaments))
  const phaseRecords = report.supportMetrics?.recordByPhase ?? buildCareerPhaseRecords(report.seasons)
  const proRecord = combineCompetitionRecords('Professional', levelRecords, ['rookieBottomQualifiers', 'proQualifying', 'rankingEvents', 'majors', 'worldQualifying', 'worldMainDraw', 'playersSeries', 'invitationals'])
  const rankingRecord = combineCompetitionRecords('Ranking', levelRecords, ['rankingEvents', 'majors', 'worldQualifying', 'worldMainDraw', 'playersSeries'])
  const majorRecord = combineCompetitionRecords('Major', levelRecords, ['majors', 'worldMainDraw'])
  const pathwayRecord = getPathwayRecord(levelRecords)
  const rankingQualifierRecord = buildTournamentSubsetRecord('Ranking Qualifying', allTournaments, (tournament) => tournament.countedInRankingQualifierRecord)
  const rankingMainDrawRecord = buildTournamentSubsetRecord('Ranking Main Draw', allTournaments, (tournament) => tournament.countedInRankingMainDrawRecord)
  const rankingTotalWithQualifiersRecord = buildTournamentSubsetRecord('Ranking Total incl Qualifiers', allTournaments, (tournament) => tournament.countedInRankingQualifierRecord || tournament.countedInRankingMainDrawRecord)
  const rankingQuarterFinalPlusRecord = buildTournamentSubsetRecord('Ranking QF+', allTournaments, (tournament) => tournament.countedInRankingQuarterFinalPlusRecord)
  const rankingFinalRecord = buildTournamentSubsetRecord('Ranking Finals', allTournaments, (tournament) => tournament.countedInRankingFinalRecord)
  const worldTitleRecord = getCompetitionLevelRecord(levelRecords, 'worldMainDraw')
  const titleSummary = buildTitleSummary(allTournaments)
  const titleCounterAudit = buildTitleCounterAuditEntries(allTournaments)
  lines.push(`# ${report.seasonsRequested}-Season Simulation Report`)
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Scenario: ${report.scenario}`)
  lines.push(`Seasons completed: ${report.seasonsCompleted}/${report.seasonsRequested}`)
  lines.push(`Weeks simulated: ${report.weeksSimulated}`)
  lines.push(`Tournaments entered: ${report.tournamentsEntered}`)
  lines.push(`Final player cash: ${formatCurrency(report.finalPlayer.cash)}`)
  lines.push(`Final player phase: ${report.finalPlayer.careerPhase}`)
  lines.push(`Final player status: ${report.finalPlayer.competitiveStatus}`)

  if (report.supportMetrics) {
    lines.push(`Support profile: ${getSupportProfileDescription(report.supportMetrics.supportProfile)}`)
  }

  lines.push(`Calendar model: ${getCalendarModelSummary()}`)

  if (report.supportMetrics) {
    lines.push('')
    lines.push('## Support Profile Metrics')
    lines.push('')
    lines.push(`- Final world rank: ${report.supportMetrics.finalWorldRank ?? 'n/a'}`)
    lines.push(`- Final career phase / status: ${report.supportMetrics.finalCareerPhase} / ${report.supportMetrics.finalCompetitiveStatus}`)
    lines.push(`- Overall / potential: ${report.supportMetrics.overall} / ${report.supportMetrics.potential}`)
    lines.push(`- Matches: ${report.supportMetrics.totalMatches} (${report.supportMetrics.wins}-${report.supportMetrics.losses}, ${formatPercent(report.supportMetrics.winPercentage)})`)
    lines.push(`- Expected win-rate tier: ${report.supportMetrics.expectedWinRateTier} target ${formatPercent(report.supportMetrics.expectedWinRateBandMin)}-${formatPercent(report.supportMetrics.expectedWinRateBandElite)} (normal ${formatPercent(report.supportMetrics.expectedWinRateBandNormal)})`)
    lines.push(`- Professional record: ${formatCompetitionRecordInline(proRecord)}`)
    lines.push(`- Ranking-event record: ${formatCompetitionRecordInline(rankingRecord)}`)
    lines.push(`- Major record: ${formatCompetitionRecordInline(majorRecord)}`)
    lines.push(`- World main draw record: ${formatCompetitionRecordInline(worldTitleRecord)}`)
    lines.push(`- Pathway record: ${formatCompetitionRecordInline(pathwayRecord)}`)
    lines.push(`- Ranking split: qualifying ${formatCompetitionRecordInline(rankingQualifierRecord)} | main draw ${formatCompetitionRecordInline(rankingMainDrawRecord)} | total incl qualifiers ${formatCompetitionRecordInline(rankingTotalWithQualifiersRecord)} | QF+ ${formatCompetitionRecordInline(rankingQuarterFinalPlusRecord)} | finals ${formatCompetitionRecordInline(rankingFinalRecord)}`)
    lines.push(`- Conversion audit: finals ${report.supportMetrics.finalsReached} | finals won ${report.supportMetrics.finalsWon} | final win ${formatPercent(report.supportMetrics.finalWinPercentage)} | semi-finals ${report.supportMetrics.semiFinalsReached} | semi-finals won ${report.supportMetrics.semiFinalsWon} | QF+ match win ${formatPercent(report.supportMetrics.quarterFinalPlusWinPercentage)} | ranking finals ${report.supportMetrics.rankingFinals} | ranking finals won ${report.supportMetrics.rankingFinalsWon} | ranking final win ${formatPercent(report.supportMetrics.rankingFinalWinPercentage)} | major finals ${report.supportMetrics.majorFinals} | major finals won ${report.supportMetrics.majorWins} | major final win ${formatPercent(report.supportMetrics.majorFinalWinPercentage)} | world finals ${report.supportMetrics.worldFinals} | world finals won ${report.supportMetrics.worldFinalsWon} | world final win ${formatPercent(report.supportMetrics.worldFinalWinPercentage)}`)
    lines.push(`- Titles: ${titleSummary.totalTitles} total | ranking ${titleSummary.rankingTitles} | majors ${titleSummary.majorTitles} | world ${titleSummary.worldTitles} | invitationals ${titleSummary.invitationalTitles} | Q Tour ${titleSummary.qTourTitles} | youth/amateur ${titleSummary.youthAmateurTitles} | Q School event wins ${titleSummary.qSchoolEventWins} | Q School campaigns ${report.supportMetrics.qSchoolCampaignsEntered} | Q School match wins ${report.supportMetrics.qSchoolMatchesWon} | cards ${report.supportMetrics.qSchoolCardsWon}`)
    lines.push(`- Best tournament result: ${report.supportMetrics.bestTournamentResult} | deep runs ${report.supportMetrics.deepRuns}`)
    lines.push(`- World Championship: entries ${report.supportMetrics.worldChampionshipEntries} | best finish ${report.supportMetrics.bestWorldChampionshipFinish}`)
    lines.push(`- Major results: quarter-finals ${report.supportMetrics.majorQuarterFinals} | semi-finals ${report.supportMetrics.majorSemiFinals} | finals ${report.supportMetrics.majorFinals} | wins ${report.supportMetrics.majorWins}`)
    lines.push(`- Average fatigue / confidence / effective strength: ${report.supportMetrics.averageFatigue.toFixed(1)} / ${report.supportMetrics.averageConfidence.toFixed(1)} / ${report.supportMetrics.averageEffectiveMatchStrength.toFixed(1)}`)
    lines.push(`- Decider record: ${report.supportMetrics.deciderWins}/${report.supportMetrics.deciderMatches} (${formatPercent(report.supportMetrics.deciderWinPercentage)}) | avg pressure ${report.supportMetrics.averageDeciderPressure.toFixed(1)}`)
    lines.push(`- Prize money per tournament: ${formatCurrency(Math.round(report.supportMetrics.prizeMoneyPerTournament))}`)
    lines.push(`- Support spend: ${formatCurrency(report.supportMetrics.totalSupportSpend)} | equipment spend ${formatCurrency(report.supportMetrics.totalEquipmentSpend)} | sponsor income ${formatCurrency(report.supportMetrics.totalSponsorIncome)}`)
  }

  lines.push('')
  appendStatusIntegrityAuditSection(lines, report.statusIntegrityAudit)

  lines.push('')
  appendCompetitionLevelTable(lines, levelRecords)
  appendCareerPhaseTable(lines, phaseRecords)

  lines.push('')
  lines.push('## Title Counter Audit')
  lines.push('')
  if (titleCounterAudit.length === 0) {
    lines.push('- No title-winning tournaments recorded.')
  } else {
    lines.push('| Tournament Won | Tournament Class | Reporting Class | Ranking | Major | Counted Total | Counted Ranking | Counted Major | Counted World | Warning |')
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
    for (const entry of titleCounterAudit) {
      lines.push(`| ${entry.tournamentName} | ${entry.tournamentClass} | ${entry.reportingClass} | ${formatFlag(entry.isRanking)} | ${formatFlag(entry.isMajor)} | ${formatFlag(entry.countedTotalTitle)} | ${formatFlag(entry.countedRankingTitle)} | ${formatFlag(entry.countedMajorTitle)} | ${formatFlag(entry.countedWorldTitle)} | ${entry.warning ?? 'none'} |`)
    }
  }

  lines.push('')
  lines.push('## Balance Warnings')
  lines.push('')
  if (report.balanceWarnings.length === 0) {
    lines.push('- No balance warnings were triggered for this run.')
  } else {
    for (const warning of report.balanceWarnings) {
      lines.push(`- ${warning}`)
    }
  }

  lines.push('')
  lines.push('## Season Summary')
  lines.push('')
  lines.push('| Season | Open Rank | Close Rank | Matches | Titles | Prize Money | Cash Delta | Age | Phase | Status |')
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |')

  for (const season of report.seasons) {
    lines.push(`| ${season.season} | ${formatSeasonRank(season.performance.openingRankingLabel, season.performance.openingRanking)} | ${formatSeasonRank(season.performance.closingRankingLabel, season.performance.closingRanking)} | ${season.performance.matchesPlayed} | ${season.performance.titles} | ${formatCurrency(season.finance.prizeMoney)} | ${formatCurrency(season.finance.cashDelta)} | ${season.playerAtNextSeasonOpen.age} | ${season.playerAtNextSeasonOpen.careerPhase} | ${season.playerAtNextSeasonOpen.competitiveStatus} |`)
  }

  lines.push('')
  lines.push('## Yearly Detail')

  for (const season of report.seasons) {
    const supportDescription = report.supportMetrics ? getSupportProfileDescription(report.supportMetrics.supportProfile) : 'custom support'
    lines.push('')
    lines.push(`### ${season.season}`)
    lines.push(`- Rankings: world ${formatCount(season.pathway.seasonOpen.worldRank)} -> ${formatCount(season.pathway.nextSeasonOpen.worldRank)} | one-year ${formatCount(season.pathway.seasonOpen.oneYearRank)} -> ${formatCount(season.pathway.nextSeasonOpen.oneYearRank)} | amateur ${formatCount(season.pathway.seasonOpen.amateurRank)} -> ${formatCount(season.pathway.nextSeasonOpen.amateurRank)} | Q Tour ${formatCount(season.pathway.seasonOpen.qTourRank)} -> ${formatCount(season.pathway.nextSeasonOpen.qTourRank)} | Q School ${formatCount(season.pathway.seasonOpen.qSchoolRank)} -> ${formatCount(season.pathway.nextSeasonOpen.qSchoolRank)}`)
    lines.push(`- Performance: ${season.performance.matchesPlayed} matches (${season.performance.wins}-${season.performance.losses}) | best ${season.performance.bestResult} | titles ${season.performance.titles} | major titles ${season.performance.majorTitles} | prize ${formatCurrency(season.finance.prizeMoney)} | points ${season.finance.rankingPoints}`)
    lines.push(`- Calendar summary: ${season.calendar.summary.totalEventsAvailable} total | ranking ${season.calendar.summary.rankingEvents} | qualifiers ${season.calendar.summary.qualifyingEvents} | majors ${season.calendar.summary.majors} | world ${season.calendar.summary.worldChampionshipEvents} | elite invitationals ${season.calendar.summary.eliteInvitationals} | Players Series ${season.calendar.summary.playersSeriesEvents} | Q Tour ${season.calendar.summary.qTourEvents} | Q School ${season.calendar.summary.qSchoolEvents} | amateur/youth ${season.calendar.summary.amateurYouthEvents} | senior/exhibition ${season.calendar.summary.seniorExhibitionEvents}`)
    lines.push(`- Player entered: total ${season.playerEntries.totalTournamentsEntered} | ranking ${season.playerEntries.rankingEventsEntered} | qualifiers ${season.playerEntries.qualifiersEntered} | majors ${season.playerEntries.majorsEntered} | World main draw ${formatFlag(season.playerEntries.worldChampionshipMainDrawEntered)} | World qualifying ${formatFlag(season.playerEntries.worldChampionshipQualifyingEntered)} | elite invitationals ${season.playerEntries.eliteInvitationalsEntered} | Players Series ${season.playerEntries.playersSeriesEntered} | Q Tour ${season.playerEntries.qTourEventsEntered} | Q School ${season.playerEntries.qSchoolEventsEntered} | amateur ${season.playerEntries.amateurEventsEntered} | youth ${season.playerEntries.youthEventsEntered} | senior ${season.playerEntries.seniorEventsEntered}`)
    lines.push(`- Calendar validation: ${season.calendar.validationWarnings.length === 0 ? 'none' : season.calendar.validationWarnings.join(' | ')}`)
    lines.push(`- Q School / pathway: Q Tour score ${season.pathway.seasonOpen.qTourEligibilityScore} -> ${season.pathway.nextSeasonOpen.qTourEligibilityScore} | top-2 streak ${season.pathway.seasonOpen.qTourTop2Streak} -> ${season.pathway.nextSeasonOpen.qTourTop2Streak} | Q School eligible ${formatFlag(season.pathway.seasonOpen.qSchoolCampaignEligible)} -> ${formatFlag(season.pathway.nextSeasonOpen.qSchoolCampaignEligible)} | seeded ${formatFlag(season.pathway.seasonOpen.qSchoolSeededCampaign)} -> ${formatFlag(season.pathway.nextSeasonOpen.qSchoolSeededCampaign)} | direct playoff ${formatFlag(season.pathway.seasonOpen.qSchoolDirectPlayoffEligible)} -> ${formatFlag(season.pathway.nextSeasonOpen.qSchoolDirectPlayoffEligible)} | qualified by ${formatStateValue(season.pathway.nextSeasonOpen.qSchoolQualifiedBy)} | campaigns ${season.performance.qSchoolCampaignsEntered} | wins ${season.performance.qSchoolMatchesWon} | cards ${season.performance.qSchoolCardsWon}`)
    lines.push(`- Tour card: player ${formatFlag(season.pathway.seasonOpen.hasTourCard)} -> ${formatFlag(season.pathway.nextSeasonOpen.hasTourCard)} | source ${formatStateValue(season.pathway.seasonOpen.cardSource)} -> ${formatStateValue(season.pathway.nextSeasonOpen.cardSource)} | card year ${season.pathway.seasonOpen.currentYear} -> ${season.pathway.nextSeasonOpen.currentYear} | years left ${season.pathway.seasonOpen.yearsRemaining} -> ${season.pathway.nextSeasonOpen.yearsRemaining} | expiry ${formatStateValue(season.pathway.nextSeasonOpen.expiresAfterSeason)} | tier ${formatStateValue(season.pathway.nextSeasonOpen.currentTier)} | status ${formatStateValue(season.pathway.seasonOpen.tourSurvivalStatus)} -> ${formatStateValue(season.pathway.nextSeasonOpen.tourSurvivalStatus)}`)
    lines.push(`- Coaching / equipment (${supportDescription}): coaches ${season.support.nextSeasonOpen.coachCount} (${formatCurrency(season.support.nextSeasonOpen.coachWeeklyCost)}/week) ${formatNameList(season.support.nextSeasonOpen.coachNames)} | cue ${formatStateValue(season.support.nextSeasonOpen.cueName)} | chalk ${formatStateValue(season.support.nextSeasonOpen.chalkName)} | tip ${formatStateValue(season.support.nextSeasonOpen.tipName)} | cue bonus ${formatSignedNumber(season.support.nextSeasonOpen.cueBonus)} | prep bonus ${formatSignedNumber(season.support.nextSeasonOpen.preparationBonus)}`)
    lines.push(`- Tour-card churn: holders ${season.tourCardMovement.holdersAtSeasonOpen} -> ${season.tourCardMovement.holdersAtNextSeasonOpen} | gained ${season.tourCardMovement.gainedCount} (${formatNameList(season.tourCardMovement.gainedNames, season.tourCardMovement.gainedCount)}) | lost ${season.tourCardMovement.lostCount} (${formatNameList(season.tourCardMovement.lostNames, season.tourCardMovement.lostCount)})`)
    lines.push(formatMovementLine('World', season.circuits.movements.world))
    lines.push(formatMovementLine('Youth', season.circuits.movements.youth))
    lines.push(formatMovementLine('Amateur', season.circuits.movements.amateur))
    lines.push(formatMovementLine('Q Tour', season.circuits.movements.qTour))
    lines.push(formatMovementLine('Q School', season.circuits.movements.qSchool))
    lines.push(formatMovementLine('Senior', season.circuits.movements.senior))
    lines.push(`- Finance: prize ${formatSignedCurrency(season.finance.breakdown.prizeMoney)} | sponsors ${formatSignedCurrency(season.finance.breakdown.sponsorIncome)} | coaches ${formatSignedCurrency(season.finance.breakdown.coachingStaffCosts)} | facility ${formatSignedCurrency(season.finance.breakdown.facilityCosts)} | equipment ${formatSignedCurrency(season.finance.breakdown.equipmentMaintenance)} | entries ${formatSignedCurrency(season.finance.breakdown.tournamentEntryFees)} | travel ${formatSignedCurrency(season.finance.breakdown.travelHotelCosts)} | treatment ${formatSignedCurrency(season.finance.breakdown.treatmentRecoveryCosts)} | other ${formatSignedCurrency(season.finance.breakdown.other)}`)
  }

  lines.push('')
  lines.push('## Issues')
  lines.push('')
  if (report.issues.length === 0) {
    lines.push('- No validation issues were detected by this simulation harness.')
  } else {
    for (const issue of report.issues) {
      lines.push(`- ${issue}`)
    }
  }

  lines.push('')
  lines.push('## Tournament Results By Season')

  for (const season of report.seasons) {
    lines.push('')
    lines.push(`### ${season.season}`)
    if (season.tournaments.length === 0) {
      lines.push('- No tournament results logged.')
      continue
    }

    for (const tournament of season.tournaments) {
      lines.push(`- ${tournament.startDate} | ${tournament.name} | ${tournament.type} | ${tournament.result} | matches ${tournament.matchesPlayed} | prize ${formatCurrency(tournament.prizeMoney)} | points ${tournament.rankingPoints}`)
    }
  }

  return `${lines.join('\n')}\n`
}

function buildSupportMetrics(
  finalState: GameState,
  seasons: SeasonReport[],
  tournamentsEntered: number,
  profile: ManagedSupportProfile,
  accumulator: SupportMetricAccumulator,
  finalSnapshotOverride?: SeasonPlayerSnapshot,
): SupportProfileMetrics {
  const finalSnapshot = finalSnapshotOverride ?? snapshotPlayer(finalState)
  const allTournaments = seasons.flatMap((season) => season.tournaments)
  const titleSummary = buildTitleSummary(allTournaments)
  const recordByLevel = buildCompetitionRecords(allTournaments)
  const recordByPhase = buildCareerPhaseRecords(seasons)
  const overallRecord = getCompetitionLevelRecord(recordByLevel, 'overall')
  const totalMatches = overallRecord.matches
  const wins = overallRecord.wins
  const losses = overallRecord.losses
  const titles = titleSummary.totalTitles
  const majorTitles = titleSummary.majorTitles
  const qTourWins = titleSummary.qTourTitles
  const qSchoolEventsEntered = seasons.reduce((sum, season) => sum + season.performance.qSchoolEventsEntered, 0)
  const qSchoolCampaignsEntered = seasons.reduce((sum, season) => sum + season.performance.qSchoolCampaignsEntered, 0)
  const qSchoolMatchesWon = seasons.reduce((sum, season) => sum + season.performance.qSchoolMatchesWon, 0)
  const qSchoolCardsWon = seasons.reduce((sum, season) => sum + season.performance.qSchoolCardsWon, 0)
  const tourCardsWon = seasons.reduce((sum, season) => sum + season.performance.tourCardsWon, 0)
  const deepRuns = allTournaments.filter((tournament) => /winner|final|semi/i.test(tournament.result)).length
  const totalPrizeMoney = seasons.reduce((sum, season) => sum + season.finance.prizeMoney, 0)
  const totalSupportSpend = Math.abs(seasons.reduce((sum, season) => sum + season.finance.breakdown.coachingStaffCosts + season.finance.breakdown.facilityCosts + season.finance.breakdown.treatmentRecoveryCosts, 0))
  const totalEquipmentSpend = Math.abs(seasons.reduce((sum, season) => sum + season.finance.breakdown.equipmentMaintenance, 0))
  const totalSponsorIncome = seasons.reduce((sum, season) => sum + season.finance.breakdown.sponsorIncome, 0)
  const worldChampionshipEvents = allTournaments.filter((tournament) => isWorldChampionshipTournament(tournament) && !/not entered/i.test(tournament.result))
  const majorEvents = allTournaments.filter((tournament) => isMajorStyleTournament(tournament) && !/not entered/i.test(tournament.result))
  const finalsRecord = buildTournamentSubsetRecord('Finals', allTournaments, (tournament) => getSimulationTournamentResultTier(tournament) >= 4)
  const semiFinalRecord = buildTournamentSubsetRecord('Semi Finals', allTournaments, (tournament) => getSimulationTournamentResultTier(tournament) >= 3)
  const quarterFinalPlusRecord = buildTournamentSubsetRecord('Quarter Final Plus', allTournaments, (tournament) => getSimulationTournamentResultTier(tournament) >= 2)
  const rankingFinalRecord = buildTournamentSubsetRecord('Ranking Finals', allTournaments, (tournament) => tournament.countedInRankingFinalRecord)
  const worldFinalRecord = buildTournamentSubsetRecord('World Finals', allTournaments, (tournament) => tournament.isWorldMainDraw && getSimulationTournamentResultTier(tournament) >= 4)
  const expectedWinRateTier = getExpectedWinRateTier({
    worldRank: finalSnapshot.worldRanking,
    careerPhase: finalSnapshot.careerPhase,
    competitiveStatus: finalSnapshot.competitiveStatus,
    hasTourCard: finalState.careerSystems.pro.hasTourCard,
  })
  const expectedWinRateBand = getExpectedWinRateBand({
    worldRank: finalSnapshot.worldRanking,
    careerPhase: finalSnapshot.careerPhase,
    competitiveStatus: finalSnapshot.competitiveStatus,
    hasTourCard: finalState.careerSystems.pro.hasTourCard,
  })

  return {
    supportProfile: profile,
    expectedWinRateTier,
    expectedWinRateBandMin: expectedWinRateBand.min * 100,
    expectedWinRateBandNormal: expectedWinRateBand.normal * 100,
    expectedWinRateBandElite: expectedWinRateBand.elite * 100,
    finalCareerPhase: finalSnapshot.careerPhase,
    finalCompetitiveStatus: finalSnapshot.competitiveStatus,
    finalWorldRank: finalSnapshot.worldRanking,
    finalCash: finalSnapshot.cash,
    overall: finalSnapshot.overall,
    potential: finalSnapshot.potential,
    totalMatches,
    wins,
    losses,
    winPercentage: totalMatches > 0 ? (wins / totalMatches) * 100 : 0,
    titles,
    majorTitles,
    qTourWins,
    qSchoolEventsEntered,
    qSchoolCampaignsEntered,
    qSchoolMatchesWon,
    qSchoolCardsWon,
    tourCardsWon,
    deepRuns,
    finalsReached: finalsRecord.eventsEntered,
    finalsWon: titleSummary.totalTitles,
    finalWinPercentage: finalsRecord.eventsEntered > 0 ? (titleSummary.totalTitles / finalsRecord.eventsEntered) * 100 : 0,
    semiFinalsReached: semiFinalRecord.eventsEntered,
    semiFinalsWon: finalsRecord.eventsEntered,
    quarterFinalPlusWinPercentage: quarterFinalPlusRecord.matches > 0 ? (quarterFinalPlusRecord.wins / quarterFinalPlusRecord.matches) * 100 : 0,
    rankingFinals: rankingFinalRecord.eventsEntered,
    rankingFinalsWon: titleSummary.rankingTitles,
    rankingFinalWinPercentage: rankingFinalRecord.eventsEntered > 0 ? (titleSummary.rankingTitles / rankingFinalRecord.eventsEntered) * 100 : 0,
    averageFatigue: accumulator.weeksObserved > 0 && Number.isFinite(accumulator.fatigueSum / accumulator.weeksObserved) ? accumulator.fatigueSum / accumulator.weeksObserved : 0,
    averageConfidence: accumulator.weeksObserved > 0 && Number.isFinite(accumulator.confidenceSum / accumulator.weeksObserved) ? accumulator.confidenceSum / accumulator.weeksObserved : 0,
    averageEffectiveMatchStrength: accumulator.weeksObserved > 0 && Number.isFinite(accumulator.strengthSum / accumulator.weeksObserved) ? accumulator.strengthSum / accumulator.weeksObserved : 0,
    deciderWins: accumulator.deciderWins,
    deciderMatches: accumulator.deciderMatches,
    deciderWinPercentage: accumulator.deciderMatches > 0 ? (accumulator.deciderWins / accumulator.deciderMatches) * 100 : 0,
    averageDeciderPressure: accumulator.deciderMatches > 0 ? accumulator.deciderPressureSum / accumulator.deciderMatches : 0,
    bestTournamentResult: getBestTournamentResult(allTournaments),
    worldChampionshipEntries: worldChampionshipEvents.length,
    bestWorldChampionshipFinish: getBestFinishLabel(worldChampionshipEvents),
    majorQuarterFinals: majorEvents.filter((tournament) => getSimulationTournamentResultTier(tournament) >= 2).length,
    majorSemiFinals: majorEvents.filter((tournament) => getSimulationTournamentResultTier(tournament) >= 3).length,
    majorFinals: majorEvents.filter((tournament) => getSimulationTournamentResultTier(tournament) >= 4).length,
    majorWins: majorEvents.filter((tournament) => getSimulationTournamentResultTier(tournament) >= 5).length,
    majorFinalWinPercentage: majorEvents.filter((tournament) => getSimulationTournamentResultTier(tournament) >= 4).length > 0
      ? (majorEvents.filter((tournament) => getSimulationTournamentResultTier(tournament) >= 5).length / majorEvents.filter((tournament) => getSimulationTournamentResultTier(tournament) >= 4).length) * 100
      : 0,
    worldFinals: worldFinalRecord.eventsEntered,
    worldFinalsWon: titleSummary.worldTitles,
    worldFinalWinPercentage: worldFinalRecord.eventsEntered > 0 ? (titleSummary.worldTitles / worldFinalRecord.eventsEntered) * 100 : 0,
    prizeMoneyPerTournament: tournamentsEntered > 0 ? totalPrizeMoney / tournamentsEntered : 0,
    totalSupportSpend,
    totalEquipmentSpend,
    totalSponsorIncome,
    recordByLevel,
    recordByPhase,
  }
}

function getSupportReportBaseName(seasonsRequested: number, profile: ManagedSupportProfile) {
  return `${seasonsRequested}-season-managed-youth-14-${getSupportProfileDisplayName(profile)}-support-simulation`
}

function getStatusIntegritySourceLabel(
  status: string,
  finalWorldRank: number | null | undefined,
  hasTourCard: boolean,
  majorContenderJustified: boolean,
  justificationLabel: string | null,
  worldChampionshipWins: number,
) {
  if (/world champion/i.test(status)) {
    return worldChampionshipWins >= 1
      ? 'confirmed World Championship main-draw win'
      : 'invalid: no confirmed World Championship main-draw win'
  }
  if (/major contender/i.test(status)) {
    return majorContenderJustified ? (justificationLabel ?? 'major contender gate') : 'invalid: no major-final, title, or elite-results justification'
  }
  if (/top 16/i.test(status)) return (finalWorldRank ?? 999) <= 16 ? 'world rank inside top 16' : 'historical elite label'
  if (/top 32/i.test(status)) return (finalWorldRank ?? 999) <= 32 ? 'world rank inside top 32' : 'historical elite label'
  if (/tour survivor|top 64/i.test(status)) return 'world rank inside top 64 or retained-tour survivor'
  if (/rookie pro/i.test(status)) return 'active rookie tour-card window'
  if (/bottom tour|at risk/i.test(status)) return hasTourCard ? 'active tour card outside top 64' : 'invalid: no active tour card'
  if (/q school/i.test(status)) return 'active Q School fallback'
  if (/q tour/i.test(status)) return 'Q Tour pathway status'
  if (/senior/i.test(status)) return 'senior/legend status'
  if (/retired/i.test(status)) return 'retired from competitive events'
  return 'default amateur/off-tour fallback'
}

function buildStatusIntegrityAudit(report: SimulationReport, finalState: GameState): StatusIntegrityAudit {
  const allTournaments = report.seasons.flatMap((season) => season.tournaments)
  const titleSummary = buildTitleSummary(allTournaments)
  const finalStatus = report.finalPlayer.competitiveStatus
  const bestTournamentResult = report.supportMetrics?.bestTournamentResult ?? getBestTournamentResult(allTournaments)
  const worldChampionshipWins = getConfirmedWorldChampionshipWinsFromHistory(finalState.history)
  const finalWorldRank = report.finalPlayer.worldRanking ?? null
  const recentProProfile = getRecentProfessionalHistoryProfile(finalState.history)
  const majorHistory = finalState.history.tournamentHistory.filter((entry) => isMajorStyleTournament({ name: entry.tournamentName, type: entry.eventType ?? '' }))
  const majorSemiFinals = majorHistory.filter((entry) => getHistoryEntryResultTier(entry) >= 3).length
  const majorFinals = majorHistory.filter((entry) => getHistoryEntryResultTier(entry) >= 4).length
  const majorWins = majorHistory.filter((entry) => getHistoryEntryResultTier(entry) >= 5).length
  const strongTwoYearWinProfile = recentProProfile.twoYearProWins >= 16 && recentProProfile.twoYearWinRate >= 0.45
  const majorContenderJustified = titleSummary.rankingTitles > 0
    || majorFinals > 0
    || majorWins > 0
    || majorSemiFinals >= 3
    || recentProProfile.latestSeasonProWins >= 8
    || strongTwoYearWinProfile
  const justificationLabel = majorFinals > 0 || majorWins > 0
    ? 'major finals or wins'
    : titleSummary.rankingTitles > 0
      ? 'ranking-title profile'
      : majorSemiFinals >= 3
        ? 'repeated major semi-finals'
        : recentProProfile.latestSeasonProWins >= 8
          ? 'strong latest-season pro-win volume'
          : strongTwoYearWinProfile
            ? 'strong two-year pro record'
            : null
  const warnings: string[] = []
  let valid = true

  if (/world champion/i.test(finalStatus)) {
    if (titleSummary.worldTitles === 0) {
      warnings.push('World Champion status with worldTitles = 0')
    }
    if (worldChampionshipWins === 0) {
      warnings.push('World Champion status without a confirmed World Championship main-draw win')
      valid = false
    }
  }

  if (/major contender/i.test(finalStatus) && !majorContenderJustified) {
    warnings.push('Major Contender status with no major finals/wins unless justified')
    valid = false
  }

  if (/top 16/i.test(finalStatus) && (finalWorldRank ?? 999) > 16) {
    warnings.push('Top 16 status when final rank > 16 without a historical phase/status split')
    valid = false
  }

  if (/top 32/i.test(finalStatus) && (finalWorldRank ?? 999) > 32) {
    warnings.push('Top 32 status when final rank > 32 without a historical phase/status split')
    valid = false
  }

  if (/rookie pro/i.test(finalStatus) && (!finalState.careerSystems.pro.hasTourCard || finalState.careerSystems.pro.yearsRemaining <= 0)) {
    warnings.push('Rookie Pro status after expired tour card')
    valid = false
  }

  if (/bottom tour\s*\/\s*at risk/i.test(finalStatus) && (finalWorldRank ?? 999) <= 64) {
    warnings.push('Bottom Tour / At Risk status while ranked top 64')
    valid = false
  }

  return {
    finalStatus,
    worldTitles: titleSummary.worldTitles,
    worldChampionshipWins,
    majorTitles: titleSummary.majorTitles,
    rankingTitles: titleSummary.rankingTitles,
    bestTournamentResult,
    sourceOfStatusAssignment: getStatusIntegritySourceLabel(
      finalStatus,
      finalWorldRank,
      finalState.careerSystems.pro.hasTourCard,
      majorContenderJustified,
      justificationLabel,
      worldChampionshipWins,
    ),
    valid,
    warnings,
  }
}

function getComparisonPerformanceScore(metrics: SupportProfileMetrics) {
  const worldRankScore = metrics.finalWorldRank ? Math.max(0, 128 - metrics.finalWorldRank) : 0
  return worldRankScore + metrics.winPercentage * 1.5 + metrics.titles * 8 + metrics.majorTitles * 10 + metrics.deepRuns * 3
}

function isProfessionalEventType(eventType: string | undefined) {
  return /major|ranking|professional|professional tour|invitational/i.test(eventType ?? '')
}

function getRecentProfessionalHistoryProfile(history: GameState['history']) {
  const proEntries = history.tournamentHistory.filter((entry) => isProfessionalEventType(entry.eventType))
  const seasonLabels = Array.from(new Set(proEntries.map((entry) => entry.season).filter(Boolean))).sort((left, right) => {
    const leftYear = Number.parseInt(left.split('/')[0] ?? '', 10) || 0
    const rightYear = Number.parseInt(right.split('/')[0] ?? '', 10) || 0
    return rightYear - leftYear
  })
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
    latestSeasonMajorFinals: latestEntries.filter((entry) => isMajorStyleTournament({ name: entry.tournamentName, type: entry.eventType ?? '' }) && getHistoryEntryResultTier(entry) >= 4).length,
    twoYearProWins,
    twoYearProLosses,
    twoYearWinRate: twoYearMatches > 0 ? twoYearProWins / twoYearMatches : 0,
  }
}

function getHistoryPerformanceRankFloor(history: GameState['history']) {
  const recentProProfile = getRecentProfessionalHistoryProfile(history)
  const recentMatchCount = recentProProfile.twoYearProWins + recentProProfile.twoYearProLosses
  const historyEntries = history?.tournamentHistory ?? []
  const rankingTitles = historyEntries.filter((entry) => entry.result === 'Winner' && isProfessionalEventType(entry.eventType)).length
  const majorTitles = historyEntries.filter((entry) => entry.result === 'Winner' && isMajorStyleTournament({ name: entry.tournamentName, type: entry.eventType ?? '' })).length
  const worldTitles = historyEntries.filter((entry) => entry.result === 'Winner' && isWorldChampionshipMainDrawName(entry.tournamentName)).length
  const professionalFinals = historyEntries.filter(
    (entry) => isHistoryProfessionalFinalLevelRun(entry),
  ).length
  const hasTitleProof = rankingTitles > 0 || majorTitles > 0 || worldTitles > 0

  if (recentMatchCount < 8) return 1
  if (recentProProfile.latestSeasonProWins < 2 && recentProProfile.twoYearWinRate < 0.18) return 97
  if (recentProProfile.latestSeasonProWins < 4 && (recentProProfile.twoYearWinRate < 0.2 || recentProProfile.latestSeasonMainTourEvents < 6)) return 65
  if (recentProProfile.latestSeasonProWins < 8 && recentProProfile.latestSeasonMajorFinals === 0 && recentProProfile.twoYearWinRate < 0.35) {
    return recentProProfile.latestSeasonMainTourEvents >= 8 && recentProProfile.twoYearWinRate >= 0.2 ? 33 : 65
  }
  if (!hasTitleProof && recentMatchCount >= 20 && recentProProfile.latestSeasonMajorFinals === 0 && recentProProfile.twoYearWinRate < 0.25) {
    return recentProProfile.latestSeasonMainTourEvents >= 8 && recentProProfile.twoYearWinRate >= 0.2 ? 33 : 65
  }
  if (!hasTitleProof && recentMatchCount >= 20 && recentProProfile.latestSeasonMajorFinals === 0 && recentProProfile.twoYearWinRate < 0.35) return 33
  if (!hasTitleProof && recentMatchCount >= 20 && recentProProfile.twoYearWinRate < 0.45) return 17
  if (!hasTitleProof && recentMatchCount >= 20) {
    return professionalFinals >= 3
      && recentProProfile.latestSeasonMajorFinals > 0
      && recentProProfile.twoYearWinRate >= 0.45
      ? 9
      : 17
  }
  return 1
}

function getSeasonNextVisibleRank(season: SeasonReport) {
  if (season.playerAtNextSeasonOpen.rankingLabel === 'World Ranking') return season.playerAtNextSeasonOpen.worldRanking ?? 999
  if (season.playerAtNextSeasonOpen.rankingLabel === 'Senior Ranking') return season.playerAtNextSeasonOpen.seniorRanking ?? 999
  return season.playerAtNextSeasonOpen.amateurRanking ?? 999
}

function isPathwayRankingLabel(label: string) {
  return /youth|amateur|q tour|q school/i.test(label)
}

function getFirstWorldTitleDetail(report: SimulationReport) {
  for (const season of report.seasons) {
    const event = season.tournaments.find((tournament) => tournament.countedInWorldTitleRecord)
    if (event) {
      return {
        season: season.season,
        age: season.playerAtSeasonOpen.age,
        eventName: event.name,
      }
    }
  }

  return null
}

function hasInSeasonTourCardRouteBeforeMainTourEntry(season: SeasonReport) {
  if (season.pathway.seasonOpen.hasTourCard || season.pathway.seasonOpen.worldRank != null && season.pathway.seasonOpen.worldRank <= 64) {
    return true
  }

  if (season.performance.qSchoolCardsWon <= 0 && season.performance.tourCardsWon <= 0) {
    return false
  }

  const firstNormalMainTourEntry = season.tournaments
    .filter((tournament) => isNormalMainTourTournament(tournament) && hasTournamentParticipation(tournament))
    .sort((left, right) => left.startDate.localeCompare(right.startDate))[0]
  if (!firstNormalMainTourEntry) {
    return false
  }

  const latestCardRouteEvent = season.tournaments
    .filter((tournament) => hasTournamentParticipation(tournament))
    .filter((tournament) => tournament.type === 'Q School' || tournament.type === 'Q Tour')
    .filter((tournament) => /winner|final|tour card/i.test(`${tournament.result} ${tournament.name}`))
    .sort((left, right) => right.startDate.localeCompare(left.startDate))[0]

  return Boolean(latestCardRouteEvent && latestCardRouteEvent.startDate < firstNormalMainTourEntry.startDate)
}

function buildBalanceWarnings(report: SimulationReport, finalState: GameState) {
  const warnings: string[] = []
  const metrics = report.supportMetrics
  if (!metrics) {
    return warnings
  }
  const allTournaments = report.seasons.flatMap((season) => season.tournaments)
  const titleSummary = buildTitleSummary(allTournaments)
  const proRecord = combineCompetitionRecords('Professional', metrics.recordByLevel, ['rookieBottomQualifiers', 'proQualifying', 'rankingEvents', 'majors', 'worldQualifying', 'worldMainDraw', 'playersSeries', 'invitationals'])
  const rankingRecord = combineCompetitionRecords('Ranking', metrics.recordByLevel, ['rankingEvents', 'majors', 'worldQualifying', 'worldMainDraw', 'playersSeries'])
  const majorRecord = combineCompetitionRecords('Major', metrics.recordByLevel, ['majors', 'worldMainDraw'])
  const pathwayRecord = getPathwayRecord(metrics.recordByLevel)
  const worldMainDrawRecord = getCompetitionLevelRecord(metrics.recordByLevel, 'worldMainDraw')
  const worldQualifyingRecord = getCompetitionLevelRecord(metrics.recordByLevel, 'worldQualifying')
  const qualifierRecord = combineCompetitionRecords('Qualifiers', metrics.recordByLevel, ['rookieBottomQualifiers', 'proQualifying', 'worldQualifying'])
  const rankingQualifierRecord = buildTournamentSubsetRecord('Ranking Qualifying', allTournaments, (tournament) => tournament.countedInRankingQualifierRecord)
  const rankingMainDrawRecord = buildTournamentSubsetRecord('Ranking Main Draw', allTournaments, (tournament) => tournament.countedInRankingMainDrawRecord)
  const rankingQuarterFinalPlusRecord = buildTournamentSubsetRecord('Ranking QF+', allTournaments, (tournament) => tournament.countedInRankingQuarterFinalPlusRecord)
  const rankingFinalRecord = buildTournamentSubsetRecord('Ranking Finals', allTournaments, (tournament) => tournament.countedInRankingFinalRecord)
  const pressureSkill = ((finalState.attributes.mental['Big Match Nerve'] ?? 50) + (finalState.attributes.mental.Composure ?? 50)) / 2

  const top16Seasons = report.seasons.filter((season) => hasSeasonOpenWorldMainDrawExpectation(season))
  const worldChampionshipMainDrawEntries = report.seasons.flatMap((season) => season.tournaments)
    .filter((tournament) => hasWorldChampionshipMainDrawEntry(tournament))
  const top16WithoutWorldEntry = top16Seasons
    .map<WorldChampionshipWarningDetail | null>((season) => {
      const hadWorldMainDrawEntry = season.tournaments.some((tournament) => hasWorldChampionshipMainDrawEntry(tournament))
      const hadWorldQualifyingEntry = season.tournaments.some((tournament) => hasWorldChampionshipQualifyingEntry(tournament))
      if (hadWorldMainDrawEntry) {
        return null
      }

      return {
        season: season.season,
        seasonOpenWorldRank: getReportedSeasonOpenWorldRank(season),
        seasonCloseWorldRank: getReportedSeasonCloseWorldRank(season),
        seasonOpenStatus: season.playerAtSeasonOpen.competitiveStatus,
        seasonCloseStatus: season.playerAtNextSeasonOpen.competitiveStatus,
        hadWorldMainDrawEntry,
        hadWorldQualifyingEntry,
        reasonSkippedWorldMainDraw: getWorldChampionshipSkipReason(season),
      }
    })
    .filter((detail): detail is WorldChampionshipWarningDetail => detail != null)
  const nonTourMainEventSeasons = report.seasons.filter((season) => {
    const openingWorldRank = season.pathway.seasonOpen.worldRank ?? 999
    const offTourAtSeasonOpen = !season.pathway.seasonOpen.hasTourCard && openingWorldRank > 64
    return offTourAtSeasonOpen
      && season.tournaments.some((tournament) => isNormalMainTourTournament(tournament) && hasTournamentParticipation(tournament))
      && !hasInSeasonTourCardRouteBeforeMainTourEntry(season)
  })
  const rank65To128SkippedAllQualifiers = report.seasons.filter((season) => {
    const openingWorldRank = season.performance.openingRankingLabel === 'World Ranking'
      ? season.performance.openingRanking
      : season.pathway.seasonOpen.worldRank ?? 999
    const inBottomTourBand = season.performance.openingRankingLabel === 'World Ranking'
      && openingWorldRank >= 65
      && openingWorldRank <= 128
    return inBottomTourBand
      && !season.playerEntries.worldChampionshipMainDrawEntered
      && !season.tournaments.some((tournament) => isQualifierTournament(tournament) && hasTournamentParticipation(tournament))
      && !season.tournaments.some((tournament) => tournament.countedInRankingMainDrawRecord && hasTournamentParticipation(tournament))
  })
  const top16CostSkippedMajors = top16Seasons.filter(
    (season) => season.tournaments.some((tournament) => isCoreMajorTournament(tournament) && /high-cost/i.test(tournament.result)),
  )
  const hasFullSeasonEventVolumeExposure = (season: SeasonReport) => daysUntil(season.dates.endedOn, season.dates.startedOn) >= 240
  const lowWorldNumberOneVolumeSeasons = report.seasons.filter((season) => {
    const closeRank = getReportedSeasonCloseWorldRank(season) ?? 999
    const proEvents = getProfessionalEventsEntered(season.playerEntries)
    const fatigueException = season.playerAtSeasonOpen.fatigue >= 70 || season.playerAtNextSeasonOpen.fatigue >= 70
    return closeRank === 1 && proEvents < 8 && hasFullSeasonEventVolumeExposure(season) && !fatigueException && !hasPlausibleEliteRestSeason(season)
  })
  const top16LowRankingVolumeSeasons = report.seasons.filter((season) => {
    const openRank = getReportedSeasonOpenWorldRank(season) ?? 999
    const closeRank = getReportedSeasonCloseWorldRank(season) ?? 999
    const fatigueException = season.playerAtSeasonOpen.fatigue >= 70 || season.playerAtNextSeasonOpen.fatigue >= 70
    return (openRank <= 16 || closeRank <= 16)
      && season.playerEntries.rankingEventsEntered < 4
      && hasFullSeasonEventVolumeExposure(season)
      && !fatigueException
      && !hasPlausibleEliteRestSeason(season)
  })
  const outsideTop64WithoutCardSeasons = report.seasons.filter((season) => {
    const closingWorldRank = getReportedSeasonCloseWorldRank(season) ?? 999
    const retainedTourStatus = /Top 64|Top 32|Top 16|Rookie Pro|Tour Survivor/.test(season.playerAtNextSeasonOpen.competitiveStatus)
    return closingWorldRank > 64 && !season.pathway.nextSeasonOpen.hasTourCard && retainedTourStatus
  })
  const rookieBeyondCardWindow = report.seasons.filter((season) => {
    const status = season.playerAtNextSeasonOpen.competitiveStatus ?? season.playerAtNextSeasonOpen.careerStage
    return status.includes('Rookie Pro')
      && (!season.pathway.nextSeasonOpen.hasTourCard || season.pathway.nextSeasonOpen.currentYear === 0 || season.pathway.nextSeasonOpen.yearsRemaining === 0)
  })
  const noTourRankingPrizeSeasons = report.seasons.filter((season) => {
    const openingWorldRank = season.pathway.seasonOpen.worldRank ?? 999
    const closingWorldRank = season.pathway.nextSeasonOpen.worldRank ?? 999
    const noTourAllSeason = !season.pathway.seasonOpen.hasTourCard
      && !season.pathway.nextSeasonOpen.hasTourCard
      && openingWorldRank > 64
      && closingWorldRank > 64

    return noTourAllSeason
      && season.tournaments.some(
        (tournament) => hasTournamentParticipation(tournament)
          && isProfessionalEventType(tournament.type)
          && tournament.prizeMoney > 0,
      )
  })
  const seniorTransitionWhileRanked = report.seasons.filter((season) => {
    const closingWorldRank = season.pathway.nextSeasonOpen.worldRank
      ?? (season.performance.closingRankingLabel === 'World Ranking' ? season.performance.closingRanking : 999)
    const seniorStatus = /senior/i.test(season.playerAtNextSeasonOpen.competitiveStatus ?? season.playerAtNextSeasonOpen.careerStage)
    return seniorStatus && closingWorldRank <= 64
  })
  const unsupportedPathwayNumberOneSeasons = report.seasons.filter((season) => {
    const nextRank = getSeasonNextVisibleRank(season)
    const matches = season.performance.wins + season.performance.losses
    const noTitleProof = season.performance.titles === 0 && season.performance.qTourWins === 0 && season.performance.qSchoolCardsWon === 0

    return isPathwayRankingLabel(season.playerAtNextSeasonOpen.rankingLabel)
      && nextRank === 1
      && matches >= 8
      && noTitleProof
      && season.performance.wins <= season.performance.losses
  })
  const unsupportedPathwayTopFourSeasons = report.seasons.filter((season) => {
    const nextRank = getSeasonNextVisibleRank(season)
    const matches = season.performance.wins + season.performance.losses
    const noTitleProof = season.performance.titles === 0 && season.performance.qTourWins === 0 && season.performance.qSchoolCardsWon === 0
    const winRate = matches > 0 ? season.performance.wins / matches : 0

    return isPathwayRankingLabel(season.playerAtNextSeasonOpen.rankingLabel)
      && nextRank <= 4
      && matches >= 8
      && noTitleProof
      && winRate < 0.5
  })
  const unsupportedWorldNumberOneSeasons: SeasonReport[] = []
  const unsupportedWorldTopFourSeasons: SeasonReport[] = []
  let hasProfessionalTitleProofThroughSeason = false
  for (const season of report.seasons) {
    const seasonHasProfessionalTitleProof = season.tournaments.some((tournament) => {
      if (!hasTournamentParticipation(tournament)) return false
      return tournament.countedInTitleRecord
        || tournament.countedInRankingTitleRecord
        || tournament.countedInWorldTitleRecord
        || (tournament.result === 'Winner' && isProfessionalEventType(tournament.type))
    })
    hasProfessionalTitleProofThroughSeason = hasProfessionalTitleProofThroughSeason || seasonHasProfessionalTitleProof

    const closeRank = getReportedSeasonCloseWorldRank(season) ?? 999
    const matches = season.performance.wins + season.performance.losses
    const winRate = matches > 0 ? season.performance.wins / matches : 0
    if (!hasProfessionalTitleProofThroughSeason && closeRank === 1 && matches >= 8) {
      unsupportedWorldNumberOneSeasons.push(season)
    }
    if (!hasProfessionalTitleProofThroughSeason && closeRank <= 4 && matches >= 8 && winRate < 0.5) {
      unsupportedWorldTopFourSeasons.push(season)
    }
  }
  const firstWorldTitle = getFirstWorldTitleDetail(report)
  const start = report.seasons[0]?.playerAtSeasonOpen
  const startStatus = start?.competitiveStatus ?? ''
  const earlyWorldTitleThreshold = start && start.age <= 17
    ? 25
    : /q tour|q school|rookie|bottom tour|top 64/i.test(startStatus)
      ? 24
      : /top 32|top 16/i.test(startStatus)
        ? 22
        : 24
  const earlyWorldTitle = firstWorldTitle && firstWorldTitle.age < earlyWorldTitleThreshold ? firstWorldTitle : null

  if (top16WithoutWorldEntry.length > 0) {
    warnings.push(`Top 16 season without World Championship main-draw entry: ${top16WithoutWorldEntry.map((detail) => formatWorldChampionshipWarningDetail(detail)).join(' | ')}.`)
  }

  if (metrics.worldChampionshipEntries > worldChampionshipMainDrawEntries.length) {
    warnings.push(`World Championship qualifying counted as main-draw entry (${metrics.worldChampionshipEntries} reported vs ${worldChampionshipMainDrawEntries.length} actual main-draw entries).`)
  }

  if (nonTourMainEventSeasons.length > 0) {
    warnings.push(`Non-tour player entered normal main-tour event in ${nonTourMainEventSeasons.map((season) => season.season).join(', ')}.`)
  }

  if (rank65To128SkippedAllQualifiers.length > 0) {
    warnings.push(`Rank 65-128 player skipped all qualifiers in ${rank65To128SkippedAllQualifiers.map((season) => season.season).join(', ')}.`)
  }

  if (top16CostSkippedMajors.length > 0) {
    warnings.push(`Top-16 player skipped core major due to cost in ${top16CostSkippedMajors.map((season) => season.season).join(', ')}.`)
  }

  if (lowWorldNumberOneVolumeSeasons.length > 0) {
    warnings.push(`World number 1 entered fewer than 8 events without fatigue reason in ${lowWorldNumberOneVolumeSeasons.map((season) => season.season).join(', ')}.`)
  }

  if (top16LowRankingVolumeSeasons.length > 0) {
    warnings.push(`Top-16 player entered fewer than 4 ranking events without fatigue reason in ${top16LowRankingVolumeSeasons.map((season) => season.season).join(', ')}.`)
  }

  if (outsideTop64WithoutCardSeasons.length > 0) {
    warnings.push(`Player outside top 64 retained tour without active card in ${outsideTop64WithoutCardSeasons.map((season) => season.season).join(', ')}.`)
  }

  if (rookieBeyondCardWindow.length > 0) {
    warnings.push(`Rookie Pro status lasted beyond active card window in ${rookieBeyondCardWindow.map((season) => season.season).join(', ')}.`)
  }

  if (noTourRankingPrizeSeasons.length > 0) {
    warnings.push(`No-tour player earned world ranking prize money in ${noTourRankingPrizeSeasons.map((season) => season.season).join(', ')}.`)
  }

  if (top16Seasons.length > 0 && metrics.winPercentage < 25 && metrics.majorFinals === 0 && metrics.titles === 0) {
    warnings.push(`Low-win player ranked top 16 without major final/title proof (${metrics.winPercentage.toFixed(1)}% career win rate).`)
  }

  if (seniorTransitionWhileRanked.length > 0) {
    warnings.push(`Senior transition happened while player was still top 64/top 16 in ${seniorTransitionWhileRanked.map((season) => season.season).join(', ')}.`)
  }

  if (unsupportedPathwayNumberOneSeasons.length > 0) {
    warnings.push(`Pathway rank 1 without proof: ${unsupportedPathwayNumberOneSeasons.map((season) => `${season.season} ${season.playerAtNextSeasonOpen.rankingLabel} (${season.performance.wins}-${season.performance.losses}, 0 titles)`).join(' | ')}.`)
  }

  if (unsupportedPathwayTopFourSeasons.length > 0) {
    warnings.push(`Pathway top-four ranking with losing/no-title season: ${unsupportedPathwayTopFourSeasons.map((season) => `${season.season} rank ${getSeasonNextVisibleRank(season)} (${season.performance.wins}-${season.performance.losses})`).join(' | ')}.`)
  }

  if (unsupportedWorldNumberOneSeasons.length > 0) {
    warnings.push(`World rank 1 without professional title proof: ${unsupportedWorldNumberOneSeasons.map((season) => `${season.season} (${season.performance.wins}-${season.performance.losses})`).join(' | ')}.`)
  }

  if (unsupportedWorldTopFourSeasons.length > 0) {
    warnings.push(`World top-four ranking with losing/no-title season: ${unsupportedWorldTopFourSeasons.map((season) => `${season.season} rank ${getReportedSeasonCloseWorldRank(season)} (${season.performance.wins}-${season.performance.losses})`).join(' | ')}.`)
  }

  if (earlyWorldTitle) {
    warnings.push(`World Championship title arrived unusually early for this start: ${earlyWorldTitle.eventName} in ${earlyWorldTitle.season} at age ${earlyWorldTitle.age}.`)
  }

  if (metrics.finalWorldRank === 1 && metrics.winPercentage >= 82 && titleSummary.worldTitles >= 12) {
    warnings.push(`Elite career may be too dominant: ${formatPercent(metrics.winPercentage)} win rate, ${titleSummary.totalTitles} titles, and ${titleSummary.worldTitles} world titles.`)
  }

  if ((metrics.finalWorldRank ?? 999) === 1 && titleSummary.totalTitles === 0) {
    warnings.push(`World number 1 has no title proof: ${formatPercent(metrics.winPercentage)} career win rate, ${metrics.finalsReached} finals, and 0 titles.`)
  }

  if ((metrics.finalWorldRank ?? 999) <= 4 && titleSummary.totalTitles === 0 && proRecord.winPercentage < 45) {
    warnings.push(`Top-four ranking looks unsupported: ${formatPercent(proRecord.winPercentage)} pro win rate and no titles.`)
  }

  if (rankingMainDrawRecord.matches >= 200 && rankingMainDrawRecord.winPercentage > 60 && titleSummary.rankingTitles < 5) {
    warnings.push(`Ranking main-draw win rate is ${rankingMainDrawRecord.winPercentage.toFixed(1)}% across ${rankingMainDrawRecord.matches} matches with only ${titleSummary.rankingTitles} ranking titles.`)
  }

  if (proRecord.matches >= 80 && proRecord.winPercentage > metrics.expectedWinRateBandElite + 10) {
    warnings.push(`Professional win rate ${formatPercent(proRecord.winPercentage)} is well above the ${metrics.expectedWinRateTier} target band (${formatPercent(metrics.expectedWinRateBandMin)}-${formatPercent(metrics.expectedWinRateBandElite)}).`)
  }

  if (rankingMainDrawRecord.matches >= 40 && rankingMainDrawRecord.winPercentage > metrics.expectedWinRateBandElite + 10) {
    warnings.push(`Ranking main-draw win rate ${formatPercent(rankingMainDrawRecord.winPercentage)} is well above the ${metrics.expectedWinRateTier} target band (${formatPercent(metrics.expectedWinRateBandMin)}-${formatPercent(metrics.expectedWinRateBandElite)}).`)
  }

  if (rankingMainDrawRecord.matches >= 200 && rankingMainDrawRecord.winPercentage > 65 && titleSummary.rankingTitles < 5) {
    warnings.push(`Ranking main-draw win rate is title-light: ${formatPercent(rankingMainDrawRecord.winPercentage)} across ${rankingMainDrawRecord.matches} matches produced only ${titleSummary.rankingTitles} ranking titles.`)
  }

  if (majorRecord.matches >= 30 && majorRecord.winPercentage > 60 && titleSummary.majorTitles === 0) {
    warnings.push(`Major-event win rate ${formatPercent(majorRecord.winPercentage)} produced no major titles.`)
  }

  if (worldMainDrawRecord.matches >= 10 && worldMainDrawRecord.winPercentage > 60 && titleSummary.worldTitles === 0) {
    warnings.push(`World Championship main-draw win rate ${formatPercent(worldMainDrawRecord.winPercentage)} across ${worldMainDrawRecord.matches} matches produced no world title.`)
  }

  if (
    metrics.finalsReached >= 18
    && rankingMainDrawRecord.averageWinProbability != null
    && metrics.finalWinPercentage + 25 < rankingMainDrawRecord.averageWinProbability
    && pressureSkill >= 58
  ) {
    warnings.push(`Final conversion looks too weak for the underlying win model: finals ${metrics.finalsReached}, final win ${formatPercent(metrics.finalWinPercentage)}, normal expected win ${formatPercent(rankingMainDrawRecord.averageWinProbability)}.`)
  }

  if (majorRecord.matches >= 100 && majorRecord.winPercentage > 55 && titleSummary.majorTitles === 0) {
    warnings.push(`Major win rate is ${majorRecord.winPercentage.toFixed(1)}% across ${majorRecord.matches} matches with zero major titles.`)
  }

  if (worldMainDrawRecord.matches >= 30 && worldMainDrawRecord.winPercentage > 55 && titleSummary.worldTitles === 0) {
    warnings.push(`World main-draw win rate is ${worldMainDrawRecord.winPercentage.toFixed(1)}% across ${worldMainDrawRecord.matches} matches with zero world titles.`)
  }

  if (rankingQuarterFinalPlusRecord.eventsEntered >= 24 && rankingFinalRecord.eventsEntered >= 10 && titleSummary.rankingTitles < Math.floor(rankingFinalRecord.eventsEntered * 0.2)) {
    warnings.push(`Deep-run conversion looks low: ${rankingQuarterFinalPlusRecord.eventsEntered} ranking QF+ runs and ${rankingFinalRecord.eventsEntered} ranking finals produced only ${titleSummary.rankingTitles} ranking titles.`)
  }

  if (/world champion/i.test(metrics.finalCompetitiveStatus) && metrics.averageProEventsAfterTurningPro < 8) {
    warnings.push(`World Champion profile averaged only ${metrics.averageProEventsAfterTurningPro.toFixed(1)} pro events per season after turning pro.`)
  }

  if (metrics.wins >= 500 && proRecord.wins < 50) {
    warnings.push(`Player has ${metrics.wins} total wins but only ${proRecord.wins} professional wins; overall headline is being driven by non-pro levels.`)
  }

  if (pathwayRecord.winPercentage >= 60 && proRecord.winPercentage < 35) {
    warnings.push(`Strong pathway record (${pathwayRecord.winPercentage.toFixed(1)}%) but weak professional transition (${proRecord.winPercentage.toFixed(1)}%).`)
  }

  if (worldQualifyingRecord.titles >= 3 && worldMainDrawRecord.eventsEntered < worldQualifyingRecord.titles) {
    warnings.push(`Player has ${worldQualifyingRecord.titles} World qualifying wins but only ${worldMainDrawRecord.eventsEntered} World main-draw entries.`)
  }

  if (rankingQualifierRecord.matches > 0 && rankingRecord.matches > 0 && rankingRecord.matches + rankingQualifierRecord.matches >= 250 && rankingQualifierRecord.matches > rankingMainDrawRecord.matches) {
    warnings.push(`Ranking profile is qualifier-heavy: ${rankingQualifierRecord.matches} qualifier matches versus ${rankingMainDrawRecord.matches} ranking main-draw matches.`)
  }

  if ((metrics.finalWorldRank ?? 999) === 65 && metrics.winPercentage > 50 && pathwayRecord.wins > proRecord.wins) {
    warnings.push(`Final rank stayed at 65 while the strong overall win rate (${metrics.winPercentage.toFixed(1)}%) was driven more by pathway wins than professional wins.`)
  }

  return warnings
}

function buildSupportComparisonWarnings(reports: SimulationReport[]) {
  const metrics = reports.map((report) => report.supportMetrics).filter((entry): entry is SupportProfileMetrics => Boolean(entry))
  const warnings: string[] = []

  if (metrics.length !== 3) {
    return warnings
  }

  const finalRanks = new Set(metrics.map((entry) => entry.finalWorldRank ?? 'n/a'))
  if (finalRanks.size === 1) {
    warnings.push('All three support profiles finished on the same final world rank. That is a balance warning, not a validation failure, but support quality is still converging too tightly at the ranking layer.')
  }

  const bestMetrics = metrics.find((entry) => entry.supportProfile === 'best')
  const worstMetrics = metrics.find((entry) => entry.supportProfile === 'worst')
  if (bestMetrics) {
    const lowestCash = Math.min(...metrics.map((entry) => entry.finalCash))
    const bestScore = getComparisonPerformanceScore(bestMetrics)
    const strongestAlternative = Math.max(...metrics.filter((entry) => entry.supportProfile !== 'best').map(getComparisonPerformanceScore))

    if (bestMetrics.finalCash === lowestCash && bestScore <= strongestAlternative) {
      warnings.push('Best support finished with the least cash without a compensating performance edge. That suggests the spend curve is still steeper than the result curve.')
    }
  }

  if (bestMetrics && worstMetrics && (bestMetrics.finalWorldRank ?? 999) <= 16 && bestMetrics.totalSponsorIncome <= worstMetrics.totalSponsorIncome * 1.5) {
    warnings.push('Sponsor income still is not separating enough between elite and low-end support outcomes.')
  }

  if (bestMetrics && /world champion/i.test(bestMetrics.finalCompetitiveStatus) && metrics.some((entry) => entry !== bestMetrics && bestMetrics.totalSponsorIncome <= entry.totalSponsorIncome)) {
    warnings.push('World Champion sponsorship still is not clearly out-earning the weaker comparison profiles.')
  }

  const winRateSpread = Math.max(...metrics.map((entry) => entry.winPercentage)) - Math.min(...metrics.map((entry) => entry.winPercentage))
  const titleSpread = Math.max(...metrics.map((entry) => entry.titles)) - Math.min(...metrics.map((entry) => entry.titles))
  const deepRunSpread = Math.max(...metrics.map((entry) => entry.deepRuns)) - Math.min(...metrics.map((entry) => entry.deepRuns))
  if (winRateSpread < 1.5 && titleSpread === 0 && deepRunSpread === 0) {
    warnings.push('Support profiles still show almost no competitive separation across match win rate, titles, or deep runs over 20 seasons.')
  }

  for (const report of reports) {
    for (const warning of report.balanceWarnings) {
      const profileName = report.supportMetrics ? getSupportProfileDisplayName(report.supportMetrics.supportProfile) : 'run'
      warnings.push(`${profileName}: ${warning}`)
    }
  }

  return warnings
}

function buildSupportComparisonMarkdown(reports: SimulationReport[]) {
  const comparableReports = reports.filter((report) => Boolean(report.supportMetrics))
  const orderedReports = [...comparableReports].sort((left, right) => {
    const order = ['worst', 'middle', 'best']
    const leftIndex = order.indexOf(left.supportMetrics?.supportProfile ?? 'middle')
    const rightIndex = order.indexOf(right.supportMetrics?.supportProfile ?? 'middle')
    return leftIndex - rightIndex
  })
  const repeatedSeedThresholdSummary = loadRepeatedSeedThresholdSummary()
  const warnings = buildSupportComparisonWarnings(orderedReports)
  const lines: string[] = []

  lines.push(`# Support Profile Comparison (${orderedReports[0]?.seasonsRequested ?? 0} seasons, youth start age 14)`)
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('| Profile | Final Rank | Phase | Status | Cash | Overall | Potential | Total W% | Pro W% | Ranking W% | Major W% | World W% | Pathway W% | Titles | Ranking Titles | Majors | Deep Runs | Avg Strength | Avg Fatigue | Avg Confidence | Prize / Tournament | Support Spend | Sponsor Income |')
  lines.push('| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')

  for (const report of orderedReports) {
    const metrics = report.supportMetrics
    if (!metrics) continue
    const allTournaments = report.seasons.flatMap((season) => season.tournaments)
    const titleSummary = buildTitleSummary(allTournaments)
    const proRecord = combineCompetitionRecords('Professional', metrics.recordByLevel, ['rookieBottomQualifiers', 'proQualifying', 'rankingEvents', 'majors', 'worldQualifying', 'worldMainDraw', 'playersSeries', 'invitationals'])
    const rankingRecord = combineCompetitionRecords('Ranking', metrics.recordByLevel, ['rankingEvents', 'majors', 'worldQualifying', 'worldMainDraw', 'playersSeries'])
    const majorRecord = combineCompetitionRecords('Major', metrics.recordByLevel, ['majors', 'worldMainDraw'])
    const worldRecord = getCompetitionLevelRecord(metrics.recordByLevel, 'worldMainDraw')
    const pathwayRecord = getPathwayRecord(metrics.recordByLevel)

    lines.push(`| ${getSupportProfileDisplayName(metrics.supportProfile)} | ${metrics.finalWorldRank ?? 'n/a'} | ${metrics.finalCareerPhase} | ${metrics.finalCompetitiveStatus} | ${formatCurrency(metrics.finalCash)} | ${metrics.overall} | ${metrics.potential} | ${formatPercent(metrics.winPercentage)} | ${formatPercent(proRecord.winPercentage)} | ${formatPercent(rankingRecord.winPercentage)} | ${formatPercent(majorRecord.winPercentage)} | ${formatPercent(worldRecord.winPercentage)} | ${formatPercent(pathwayRecord.winPercentage)} | ${titleSummary.totalTitles} | ${titleSummary.rankingTitles} | ${titleSummary.majorTitles} | ${metrics.deepRuns} | ${metrics.averageEffectiveMatchStrength.toFixed(1)} | ${metrics.averageFatigue.toFixed(1)} | ${metrics.averageConfidence.toFixed(1)} | ${formatCurrency(Math.round(metrics.prizeMoneyPerTournament))} | ${formatCurrency(metrics.totalSupportSpend)} | ${formatCurrency(metrics.totalSponsorIncome)} |`)
  }

  lines.push('')
  lines.push('## Balance Warnings')
  lines.push('')
  if (warnings.length === 0) {
    lines.push('- No balance warnings were triggered by this comparison run.')
  } else {
    for (const warning of warnings) {
      lines.push(`- ${warning}`)
    }
  }

  lines.push('')
  lines.push('## Match Engine Verdict')
  lines.push('')
  for (const report of orderedReports) {
    const verdict = buildRealismVerdictEntry(report, repeatedSeedThresholdSummary)
    if (!verdict) continue
    lines.push(`### ${verdict.profile}`)
    lines.push(`- rank outcome plausible: ${verdict.rankPlausible ? 'yes' : 'no'}`)
    lines.push(`- pro win rate plausible: ${verdict.proWinPlausible ? 'yes' : 'no'}`)
    lines.push(`- title count plausible: ${verdict.titlePlausible ? 'yes' : 'no'}`)
    lines.push(`- World Championship outcome plausible: ${verdict.worldOutcomePlausible ? 'yes' : 'no'}`)
    lines.push(`- main concern: ${verdict.matchConcern}`)
    lines.push('')
  }

  lines.push('')
  lines.push('## Calendar / Event Selection Verdict')
  lines.push('')
  lines.push('- Event-volume and schedule-selection plausibility is reported separately here so it does not read like a match-engine defect.')
  lines.push('')
  for (const report of orderedReports) {
    const verdict = buildEventVolumeVerdictEntry(report, repeatedSeedThresholdSummary)
    if (!verdict) continue
    lines.push(`### ${verdict.profile}`)
    lines.push(`- event volume plausible: ${verdict.eventVolumeAssessment}`)
    lines.push(`- main concern: ${verdict.concern}`)
    lines.push('')
  }

  lines.push('')
  lines.push('## Detail')
  lines.push('')
  for (const report of orderedReports) {
    const metrics = report.supportMetrics
    if (!metrics) continue
    const allTournaments = report.seasons.flatMap((season) => season.tournaments)
    const titleSummary = buildTitleSummary(allTournaments)
    const proRecord = combineCompetitionRecords('Professional', metrics.recordByLevel, ['rookieBottomQualifiers', 'proQualifying', 'rankingEvents', 'majors', 'worldQualifying', 'worldMainDraw', 'playersSeries', 'invitationals'])
    const rankingRecord = combineCompetitionRecords('Ranking', metrics.recordByLevel, ['rankingEvents', 'majors', 'worldQualifying', 'worldMainDraw', 'playersSeries'])
    const majorRecord = combineCompetitionRecords('Major', metrics.recordByLevel, ['majors', 'worldMainDraw'])
    const worldRecord = getCompetitionLevelRecord(metrics.recordByLevel, 'worldMainDraw')
    const pathwayRecord = getPathwayRecord(metrics.recordByLevel)
    const rankingQualifierRecord = buildTournamentSubsetRecord('Ranking Qualifying', allTournaments, (tournament) => tournament.countedInRankingQualifierRecord)
    const rankingMainDrawRecord = buildTournamentSubsetRecord('Ranking Main Draw', allTournaments, (tournament) => tournament.countedInRankingMainDrawRecord)
    const rankingFinalRecord = buildTournamentSubsetRecord('Ranking Finals', allTournaments, (tournament) => tournament.countedInRankingFinalRecord)

    lines.push(`### ${getSupportProfileDisplayName(metrics.supportProfile)}`)
    lines.push(`- Final phase / status: ${metrics.finalCareerPhase} / ${metrics.finalCompetitiveStatus}`)
    lines.push(`- Matches: ${metrics.totalMatches} (${metrics.wins}-${metrics.losses}, ${formatPercent(metrics.winPercentage)})`)
    lines.push(`- Pro record: ${formatCompetitionRecordInline(proRecord)} | ranking ${formatCompetitionRecordInline(rankingRecord)} | major ${formatCompetitionRecordInline(majorRecord)} | world main draw ${formatCompetitionRecordInline(worldRecord)} | pathway ${formatCompetitionRecordInline(pathwayRecord)}`)
    lines.push(`- Ranking split: qualifying ${formatCompetitionRecordInline(rankingQualifierRecord)} | main draw ${formatCompetitionRecordInline(rankingMainDrawRecord)} | finals ${formatCompetitionRecordInline(rankingFinalRecord)}`)
    lines.push(`- Titles: ${titleSummary.totalTitles} | ranking ${titleSummary.rankingTitles} | majors ${titleSummary.majorTitles} | world ${titleSummary.worldTitles} | invitationals ${titleSummary.invitationalTitles} | Q Tour ${titleSummary.qTourTitles} | youth/amateur ${titleSummary.youthAmateurTitles} | Q School event wins ${titleSummary.qSchoolEventWins} | cards ${metrics.qSchoolCardsWon}`)
    lines.push(`- Best run: ${metrics.bestTournamentResult} | deep runs ${metrics.deepRuns}`)
    lines.push(`- World Championship: entries ${metrics.worldChampionshipEntries} | best finish ${metrics.bestWorldChampionshipFinish}`)
    lines.push(`- Major results: quarter-finals ${metrics.majorQuarterFinals} | semi-finals ${metrics.majorSemiFinals} | finals ${metrics.majorFinals} | wins ${metrics.majorWins}`)
    lines.push(`- Deciders: ${metrics.deciderWins}/${metrics.deciderMatches} (${formatPercent(metrics.deciderWinPercentage)}) | avg pressure ${metrics.averageDeciderPressure.toFixed(1)}`)
    lines.push(`- Spend: support ${formatCurrency(metrics.totalSupportSpend)} | equipment ${formatCurrency(metrics.totalEquipmentSpend)} | sponsors ${formatCurrency(metrics.totalSponsorIncome)}`)
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

function writeSupportComparisonReportIfReady(seasonsRequested: number) {
  const reports = (['worst', 'middle', 'best'] as ManagedSupportProfile[])
    .map((profile) => path.join(reportsDir, `${getSupportReportBaseName(seasonsRequested, profile)}.json`))
    .filter((filePath) => fs.existsSync(filePath))
    .map((filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8')) as SimulationReport)

  if (reports.length !== 3 || reports.some((report) => !report.supportMetrics)) {
    return null
  }

  const comparisonPath = path.join(reportsDir, `support-profile-comparison-${seasonsRequested}-season-youth.md`)
  fs.writeFileSync(comparisonPath, buildSupportComparisonMarkdown(reports))
  return comparisonPath
}

function getCueScore(cue: Cue) {
  return cue.touch + cue.spinControl + cue.stability + cue.durability + cue.condition + Object.values(cue.bonuses).reduce((sum, value) => sum + value * 10, 0)
}

function getChalkScore(chalk: Chalk) {
  return chalk.grip + chalk.cleanContact + chalk.spinTransfer + chalk.consistency + chalk.miscueReduction + chalk.kickReduction
}

function getTipScore(tip: Tip) {
  return tip.durability + tip.spinControl + tip.feel + tip.consistency + tip.miscueReduction
}

function getCoachScore(coach: Coach) {
  return coach.compatibility * 2 + coach.technical + coach.tactical + coach.mental + coach.motivation + coach.discipline
}

function chooseProfileItem<T>(items: T[], profile: ManagedSupportProfile, scoreItem: (item: T) => number) {
  if (items.length === 0) return null

  const sorted = [...items].sort((left, right) => {
    const scoreDelta = scoreItem(left) - scoreItem(right)
    if (scoreDelta !== 0) return scoreDelta
    return 0
  })

  if (profile === 'worst') return sorted[0]
  if (profile === 'best') return sorted.at(-1) ?? sorted[0]
  return sorted[Math.floor((sorted.length - 1) / 2)]
}

function buyManagedEquipment(state: GameState, profile: ManagedSupportProfile) {
  let nextState = state

  const affordableCues = cueMarketplaceCatalog.filter((cue) => cue.price <= nextState.player.cash || nextState.equipment.cuesOwned.includes(cue.id))
  const affordableChalk = chalkCatalog.filter((chalk) => chalk.cost <= nextState.player.cash || nextState.equipment.chalkOwned.includes(chalk.id))
  const affordableTips = tipCatalog.filter((tip) => tip.cost <= nextState.player.cash || nextState.equipment.tipsOwned.includes(tip.id))

  const targetCue = chooseProfileItem(affordableCues, profile, getCueScore)
  const targetChalk = chooseProfileItem(affordableChalk, profile, getChalkScore)
  const targetTip = chooseProfileItem(affordableTips, profile, getTipScore)

  if (targetCue && nextState.equipment.currentCueId !== targetCue.id) {
    nextState = buyCueState(nextState, targetCue.id)
  }
  if (targetChalk && nextState.equipment.currentChalkId !== targetChalk.id) {
    nextState = buyChalkState(nextState, targetChalk.id)
  }
  if (targetTip && nextState.equipment.currentTipId !== targetTip.id) {
    nextState = buyTipState(nextState, targetTip.id)
  }

  return nextState
}

function acceptBestSponsors(state: GameState) {
  let nextState = state

  while (true) {
    const currentRanking = getCurrentRanking(nextState)
    const sponsorCapacity = nextState.player.age < 18
      ? 1
      : currentRanking <= 16 || nextState.player.reputation >= 68
        ? 3
        : currentRanking <= 32 || nextState.player.reputation >= 52
          ? 2
          : 1
    if (nextState.sponsors.length >= sponsorCapacity) {
      return nextState
    }

    const offer = nextState.sponsorOffers
      .filter((item) => item.status === 'Available' && item.minimumReputation <= nextState.player.reputation)
      .filter((item) => nextState.player.age >= 18 || item.monthlyValue <= 350)
      .sort((left, right) => (right.monthlyValue - left.monthlyValue) || (right.brandFit - left.brandFit))[0]

    if (!offer) {
      return nextState
    }

    const updatedState = acceptSponsorState(nextState, offer.id)
    if (updatedState === nextState || updatedState.sponsors.length === nextState.sponsors.length) {
      return nextState
    }

    nextState = updatedState
  }
}

function hireAvailableCoaches(state: GameState, profile: ManagedSupportProfile) {
  let nextState = state

  while (true) {
    if (nextState.player.age < 17 && getCurrentRanking(nextState) > 32 && nextState.player.reputation < 45) {
      return nextState
    }

    const unlockedSlots = getCurrentRanking(nextState) <= 16 || nextState.player.reputation >= 70 ? 2 : 1
    const profileSlotCap = profile === 'best' ? unlockedSlots : 1
    if (nextState.coachContracts.length >= profileSlotCap) {
      return nextState
    }

    const weeklySupport = nextState.finance.baseCashFlow + getSponsorWeeklyIncome(nextState) - getCoachWeeklyCost(nextState) - getFacilityWeeklyRental(nextState)
    const qSchoolCampaignReserve = !nextState.careerSystems.pro.hasTourCard
      && (nextState.careerSystems.qSchool.campaignEligible || nextState.careerSystems.qSchool.seededCampaign || nextState.careerSystems.qSchool.directPlayoffEligible)
      ? 1200
      : 0
    const minimumRunwayWeeks = profile === 'best'
      ? (nextState.player.age < 18 ? 20 : nextState.careerSystems.pro.hasTourCard ? 14 : 18)
      : profile === 'middle'
        ? (nextState.player.age < 18 ? 28 : nextState.careerSystems.pro.hasTourCard ? 18 : 22)
        : (nextState.player.age < 18 ? 36 : nextState.careerSystems.pro.hasTourCard ? 24 : 28)

    const candidates = coachCatalog
      .filter((coach) => !nextState.coachContracts.some((contract) => contract.coachId === coach.id))
      .map((coach) => ({
        coach,
        availability: getCoachAvailability(coach, getCurrentRanking(nextState), nextState.player.reputation),
        contractOption: getCoachContractOptions(coach)[0],
      }))
      .filter((entry) => entry.availability.available)
      .filter((entry) => {
        const projectedWeeklyNet = weeklySupport - entry.contractOption.weeklyCost
        const projectedRunway = projectedWeeklyNet >= 0 ? Number.POSITIVE_INFINITY : nextState.player.cash / Math.abs(projectedWeeklyNet)
        return nextState.player.cash - qSchoolCampaignReserve >= entry.contractOption.weeklyCost * 8 && projectedRunway >= minimumRunwayWeeks
      })
      .sort((left, right) => {
        const scoreDelta = getCoachScore(left.coach) - getCoachScore(right.coach)
        if (scoreDelta !== 0) return scoreDelta
        return left.contractOption.weeklyCost - right.contractOption.weeklyCost
      })

    const candidate = chooseProfileItem(candidates, profile, (entry) => getCoachScore(entry.coach))

    if (!candidate) {
      return nextState
    }

    const updatedState = hireCoachState(nextState, candidate.coach.id, candidate.contractOption.label)
    if (updatedState === nextState || updatedState.coachContracts.length === nextState.coachContracts.length) {
      return nextState
    }

    nextState = updatedState
  }
}

function manageCoachExposure(state: GameState) {
  let nextState = state

  while (nextState.coachContracts.length > 0) {
    const weeklyNet = nextState.finance.baseCashFlow + getSponsorWeeklyIncome(nextState) - getCoachWeeklyCost(nextState) - getFacilityWeeklyRental(nextState)
    const runwayWeeks = weeklyNet >= 0 ? Number.POSITIVE_INFINITY : nextState.player.cash / Math.abs(weeklyNet)
    const qSchoolCampaignReserve = !nextState.careerSystems.pro.hasTourCard
      && (nextState.careerSystems.qSchool.campaignEligible || nextState.careerSystems.qSchool.seededCampaign || nextState.careerSystems.qSchool.directPlayoffEligible)
      ? 1200
      : 0

    if (nextState.player.cash >= qSchoolCampaignReserve && (weeklyNet >= 0 || runwayWeeks >= (nextState.careerSystems.pro.hasTourCard ? 14 : 20))) {
      return nextState
    }

    const contractToRelease = [...nextState.coachContracts].sort((left, right) => right.weeklyCost - left.weeklyCost)[0]
    if (!contractToRelease) {
      return nextState
    }

    nextState = fireCoachState(nextState, contractToRelease.coachId)
  }

  return nextState
}

function runManagedWeeklyCare(state: GameState, financeBreakdown: FinanceBreakdown, profile: ManagedSupportProfile) {
  const supportConfig = SUPPORT_PROFILE_CONFIGS[profile]
  let nextState = state
  let updatedState = buyManagedEquipment(nextState, profile)
  recordCashDelta(financeBreakdown, 'equipmentMaintenance', nextState, updatedState)
  nextState = updatedState

  nextState = acceptBestSponsors(nextState)
  nextState = manageCoachExposure(nextState)

  updatedState = hireAvailableCoaches(nextState, profile)
  nextState = updatedState
  nextState = manageCoachExposure(nextState)

  if (nextState.player.fatigue >= supportConfig.treatmentThreshold) {
    updatedState = scheduleTreatmentState(nextState, nextState.player.cash >= 180 ? 'treat-2' : 'treat-3')
    recordCashDelta(financeBreakdown, 'treatmentRecoveryCosts', nextState, updatedState)
    nextState = updatedState
  }

  if (nextState.trainingAppliedWeek !== nextState.week && nextState.player.fatigue < 82) {
    nextState = applyTrainingPlanState(nextState)
  }

  return nextState
}

function formatSeasonLabelForYear(startYear: number) {
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`
}

function rerankRows<T extends { ranking: number; playerName: string; highlighted?: boolean }>(rows: T[], playerName: string) {
  return rows.map((row, index) => ({
    ...row,
    ranking: index + 1,
    highlighted: row.playerName === playerName,
  }))
}

function removePlayerFromRows<T extends { playerName: string; ranking: number; highlighted?: boolean }>(rows: T[], playerName: string) {
  return rerankRows(rows.filter((row) => row.playerName !== playerName), playerName)
}

function seedPlayerIntoRows<T extends {
  id: string
  playerName: string
  nation: string
  ranking: number
  movement: number
  points: number
  prizeMoney: number
  highlighted?: boolean
  eventsPlayed: number
  titles: number
  wins: number
  losses: number
  statusNote?: string
}>(
  rows: T[],
  playerName: string,
  nation: string,
  targetRank: number,
  points: number,
  prizeMoney: number,
  statusNote: string,
) {
  const withoutPlayer = rows.filter((row) => row.playerName !== playerName)
  const insertIndex = Math.max(0, Math.min(withoutPlayer.length, targetRank - 1))
  const template = withoutPlayer[Math.min(insertIndex, Math.max(0, withoutPlayer.length - 1))]
  const strongerNeighbor = withoutPlayer[Math.max(0, insertIndex - 1)]
  const weakerNeighbor = withoutPlayer[Math.min(insertIndex, Math.max(0, withoutPlayer.length - 1))]
  const seededPointFloor = targetRank <= 16 ? 5200 : targetRank <= 32 ? 3400 : targetRank <= 64 ? 1800 : targetRank <= 96 ? 900 : 350
  const seededPrizeFloor = targetRank <= 16 ? 1400000 : targetRank <= 32 ? 800000 : targetRank <= 64 ? 350000 : targetRank <= 96 ? 120000 : 40000
  const seededPoints = Math.max(
    points,
    seededPointFloor,
    Math.round(((strongerNeighbor?.points ?? points) + (weakerNeighbor?.points ?? points)) / 2),
  )
  const seededPrizeMoney = Math.max(
    prizeMoney,
    seededPrizeFloor,
    Math.round(((strongerNeighbor?.prizeMoney ?? prizeMoney) + (weakerNeighbor?.prizeMoney ?? prizeMoney)) / 2),
  )
  const seededEvents = targetRank <= 16 ? 18 : targetRank <= 32 ? 16 : targetRank <= 64 ? 14 : 10
  const seededWins = targetRank <= 16 ? 13 : targetRank <= 32 ? 11 : targetRank <= 64 ? 8 : 5
  const seededTitles = targetRank <= 16 ? 2 : targetRank <= 32 ? 1 : 0
  const seededRow: T = {
    ...(template ?? {
      id: `comp-${playerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      playerName,
      nation,
      ranking: targetRank,
      movement: 0,
      points: 0,
      prizeMoney: 0,
      highlighted: true,
      eventsPlayed: 0,
      titles: 0,
      wins: 0,
      losses: 0,
    } as T),
    id: `comp-${playerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    playerName,
    nation,
    ranking: targetRank,
    movement: 0,
    points: seededPoints,
    prizeMoney: seededPrizeMoney,
    highlighted: true,
    eventsPlayed: seededEvents,
    titles: seededTitles,
    wins: seededWins,
    losses: Math.max(0, seededEvents - seededWins),
    statusNote,
  }
  const nextRows = [...withoutPlayer]
  nextRows.splice(insertIndex, 0, seededRow)
  return rerankRows(nextRows, playerName)
}

type SeededProScenarioConfig = {
  age: number
  targetRank: number
  currentYear: number
  yearsRemaining: number
  retainedViaRanking: boolean
  cardSource: string
  awardedBy: string
  currentTier: string
  worldPoints: number
  oneYearPoints: number
  prizeMoney: number
  cash: number
  confidence: number
  fatigue: number
  morale: number
  reputation: number
  technicalPenalty: number
  mentalPenalty: number
  physicalPenalty: number
  statusNote: string
}

function createSeededProState(config: SeededProScenarioConfig) {
  const baseState = createNewCareerState({
    fullName: createPlayerIdentitySeed.name,
    nationality: createPlayerIdentitySeed.nationality,
    age: config.age,
    handedness: createPlayerIdentitySeed.handedness as 'Right-handed' | 'Left-handed',
    cueStyle: createPlayerIdentitySeed.cueStyle,
    playingStyle: createPlayerIdentitySeed.playingStyle,
    personalityArchetype: createPlayerIdentitySeed.personalityArchetype,
    sliders: createPlayerSliderCatalog.map((slider) => ({ ...slider })),
    backgroundId: createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0].id,
    startingLevelId: getValidatedStartingLevel(createPlayerStartingLevelCatalog, config.age, 'start-q-tour').id,
  })
  const playerName = baseState.player.fullName
  const nation = baseState.player.nationality.slice(0, 3).toUpperCase()
  const tunedAttributes = {
    technical: Object.fromEntries(Object.entries(baseState.attributes.technical).map(([label, value]) => [label, Math.max(38, value - config.technicalPenalty)])),
    mental: Object.fromEntries(Object.entries(baseState.attributes.mental).map(([label, value]) => [label, Math.max(40, value - config.mentalPenalty)])),
    physical: Object.fromEntries(Object.entries(baseState.attributes.physical).map(([label, value]) => [label, Math.max(42, value - config.physicalPenalty)])),
  }
  const worldRows = seedPlayerIntoRows(baseState.competitionTables.world, playerName, nation, config.targetRank, config.worldPoints, config.prizeMoney, config.statusNote)
  const oneYearRows = seedPlayerIntoRows(baseState.competitionTables.oneYear, playerName, nation, config.targetRank, config.oneYearPoints, config.prizeMoney, config.statusNote)
  const competitionTables = {
    ...baseState.competitionTables,
    world: worldRows,
    oneYear: oneYearRows,
    amateur: removePlayerFromRows(baseState.competitionTables.amateur, playerName),
    qTour: removePlayerFromRows(baseState.competitionTables.qTour, playerName),
    qSchool: removePlayerFromRows(baseState.competitionTables.qSchool, playerName),
    youth: removePlayerFromRows(baseState.competitionTables.youth, playerName),
  }
  const seasonStartYear = Number.parseInt(baseState.season.split('/')[0] ?? '2026', 10)
  const worldPlayers = baseState.worldPlayers.some((record) => record.playerName === playerName)
    ? baseState.worldPlayers.map((record) =>
        record.playerName === playerName
          ? {
              ...record,
              age: config.age,
              hasTourCard: true,
              cardSource: config.cardSource as never,
              currentYear: config.currentYear,
              yearsRemaining: config.yearsRemaining,
              expiresAfterSeason: config.yearsRemaining > 0 ? formatSeasonLabelForYear(seasonStartYear + config.yearsRemaining - 1) : null,
              retainedViaRanking: config.retainedViaRanking,
              tourSurvivalStatus: config.targetRank <= 16 ? 'Top 16' : config.targetRank <= 32 ? 'Top 32' : config.targetRank <= 64 ? 'Safe' : config.targetRank <= 96 ? 'Bubble' : 'At Risk',
              totalPrizeMoney: config.prizeMoney,
              highestWorldRank: config.targetRank,
            }
          : record,
      )
    : [
        ...baseState.worldPlayers,
        {
          id: `wp-${playerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          playerName,
          nation,
          age: config.age,
          hasTourCard: true,
          cardSource: config.cardSource as never,
          currentYear: config.currentYear,
          yearsRemaining: config.yearsRemaining,
          expiresAfterSeason: config.yearsRemaining > 0 ? formatSeasonLabelForYear(seasonStartYear + config.yearsRemaining - 1) : null,
          retainedViaRanking: config.retainedViaRanking,
          tourSurvivalStatus: config.targetRank <= 16 ? 'Top 16' : config.targetRank <= 32 ? 'Top 32' : config.targetRank <= 64 ? 'Safe' : config.targetRank <= 96 ? 'Bubble' : 'At Risk',
          totalMatches: 10,
          wins: 2,
          losses: 8,
          totalPrizeMoney: config.prizeMoney,
          titles: 0,
          majorTitles: 0,
          qTourWins: 0,
          seniorTitles: 0,
          highestBreak: 0,
          highestWorldRank: config.targetRank,
          seasons: [],
        },
      ]

  return {
    ...baseState,
    attributes: tunedAttributes,
    player: {
      ...baseState.player,
      age: config.age,
      cash: config.cash,
      confidence: config.confidence,
      fatigue: config.fatigue,
      morale: config.morale,
      reputation: config.reputation,
      careerStage: config.currentTier,
      careerPhase: config.age >= 40 ? 'Veteran' : 'Established',
      competitiveStatus: config.currentTier,
      rankingLabel: 'World Ranking',
      worldRanking: config.targetRank,
      amateurRanking: null,
    },
    competitionTables,
    rankings: worldRows.map((row) => ({ ...row })),
    worldPlayers,
    careerSystems: {
      ...baseState.careerSystems,
      qTour: {
        ...baseState.careerSystems.qTour,
        playerRank: null,
        playerPoints: 0,
      },
      qSchool: {
        ...baseState.careerSystems.qSchool,
        playerRank: null,
        playerPoints: 0,
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
      },
      pro: {
        ...baseState.careerSystems.pro,
        hasTourCard: true,
        cardSource: config.cardSource as never,
        currentYear: config.currentYear,
        yearsRemaining: config.yearsRemaining,
        expiresAfterSeason: config.yearsRemaining > 0 ? formatSeasonLabelForYear(seasonStartYear + config.yearsRemaining - 1) : null,
        retainedViaRanking: config.retainedViaRanking,
        awardedBy: config.awardedBy,
        survivalStatus: config.targetRank <= 16 ? 'Top 16' : config.targetRank <= 32 ? 'Top 32' : config.targetRank <= 64 ? 'Safe' : config.targetRank <= 96 ? 'Bubble' : 'At Risk',
        tourSurvivalStatus: config.targetRank <= 16 ? 'Top 16' : config.targetRank <= 32 ? 'Top 32' : config.targetRank <= 64 ? 'Safe' : config.targetRank <= 96 ? 'Bubble' : 'At Risk',
        currentTier: config.currentTier,
        worldRank: config.targetRank,
        oneYearRank: config.targetRank,
      },
    },
  }
}

function createFocusedRookieProState() {
  return createSeededProState({
    age: 21,
    targetRank: 100,
    currentYear: 1,
    yearsRemaining: 2,
    retainedViaRanking: false,
    cardSource: 'Focused Test Card',
    awardedBy: 'Focused rookie-pro test card',
    currentTier: 'Rookie Professional — Two-Year Tour Card',
    worldPoints: 24,
    oneYearPoints: 18,
    prizeMoney: 2500,
    cash: 6000,
    confidence: 55,
    fatigue: 30,
    morale: 54,
    reputation: 38,
    technicalPenalty: 22,
    mentalPenalty: 18,
    physicalPenalty: 16,
    statusNote: 'Focused rookie-pro seed',
  })
}

function createRank80TourSurvivalState() {
  return createSeededProState({
    age: 24,
    targetRank: 80,
    currentYear: 2,
    yearsRemaining: 1,
    retainedViaRanking: false,
    cardSource: 'Q School',
    awardedBy: 'Rank-80 survival test card',
    currentTier: 'Rookie Professional — Two-Year Tour Card',
    worldPoints: 92,
    oneYearPoints: 74,
    prizeMoney: 36000,
    cash: 18000,
    confidence: 61,
    fatigue: 24,
    morale: 60,
    reputation: 46,
    technicalPenalty: 15,
    mentalPenalty: 12,
    physicalPenalty: 10,
    statusNote: 'Rank-80 tour survival seed',
  })
}

function createTop16AccessState() {
  return createSeededProState({
    age: 28,
    targetRank: 8,
    currentYear: 0,
    yearsRemaining: 0,
    retainedViaRanking: true,
    cardSource: 'Ranking Retained',
    awardedBy: 'Top-16 access seed',
    currentTier: 'Top 16 Elite Player',
    worldPoints: 420,
    oneYearPoints: 360,
    prizeMoney: 540000,
    cash: 125000,
    confidence: 76,
    fatigue: 18,
    morale: 72,
    reputation: 74,
    technicalPenalty: 4,
    mentalPenalty: 2,
    physicalPenalty: 3,
    statusNote: 'Top-16 access seed',
  })
}

function createBottomTourAccessState() {
  return createSeededProState({
    age: 23,
    targetRank: 110,
    currentYear: 1,
    yearsRemaining: 2,
    retainedViaRanking: false,
    cardSource: 'Q School',
    awardedBy: 'Bottom-tour access seed',
    currentTier: 'Rookie Professional — Two-Year Tour Card',
    worldPoints: 16,
    oneYearPoints: 12,
    prizeMoney: 9000,
    cash: 9000,
    confidence: 53,
    fatigue: 32,
    morale: 55,
    reputation: 34,
    technicalPenalty: 24,
    mentalPenalty: 20,
    physicalPenalty: 16,
    statusNote: 'Bottom-tour access seed',
  })
}

function buildHumanEventVolumeMetrics(
  row: Pick<PlayerSnapshotRow, 'age' | 'actualCircuit' | 'competitiveStatus' | 'isOnMainTour' | 'isTourCardHolder' | 'tourCardSource' | 'tourCardYear' | 'yearsRemaining' | 'worldRank' | 'oneYearRank' | 'fatigue'>,
  seasonReport: SeasonReport,
  openingState: GameState,
  _nextSeasonState: GameState,
) {
  const eligibleCandidates = openingState.tournaments
    .map((tournament) => ({ tournament, classification: getTournamentClassification(tournament) }))
    .filter(({ tournament, classification }) => isSyntheticEligibleForTournament(row, tournament, classification))
  const eligibleIds = new Set(eligibleCandidates.map(({ tournament }) => tournament.id))
  const explicitSkippedCount = openingState.tournaments.filter((tournament) => eligibleIds.has(tournament.id) && tournament.status === 'Skipped').length
  const highCostCount = openingState.tournaments.filter((tournament) => eligibleIds.has(tournament.id) && tournament.status === 'High Cost').length
  const enteredSummary = seasonReport.playerEntries
  const skippedEligibleEventsCount = Math.max(0, eligibleIds.size - enteredSummary.totalTournamentsEntered)
  const skippedCoreEventsCount = eligibleCandidates.filter(({ tournament, classification }) => {
    if (seasonReport.tournaments.some((entry) => entry.tournamentId === tournament.id)) return false
    return classification.isMainTourEvent || classification.isQTour || classification.isQSchool
  }).length
  const accessBand = getEventAccessBand(row)
  const metrics: DerivedEventVolumeMetrics = {
    availableEventsCount: openingState.tournaments.length,
    eligibleEventsCount: eligibleIds.size,
    enteredEventsCount: enteredSummary.totalTournamentsEntered,
    rankingEventsEntered: enteredSummary.rankingEventsEntered,
    qualifierEventsEntered: enteredSummary.qualifiersEntered,
    majorEventsEntered: enteredSummary.majorsEntered,
    worldChampionshipMainDrawEntered: enteredSummary.worldChampionshipMainDrawEntered,
    worldChampionshipQualifyingEntered: enteredSummary.worldChampionshipQualifyingEntered,
    invitationalsEntered: enteredSummary.eliteInvitationalsEntered,
    playersSeriesEntered: enteredSummary.playersSeriesEntered,
    qTourEventsEntered: enteredSummary.qTourEventsEntered,
    qSchoolEventsEntered: enteredSummary.qSchoolEventsEntered,
    amateurEventsEntered: enteredSummary.amateurEventsEntered,
    youthEventsEntered: enteredSummary.youthEventsEntered,
    seniorEventsEntered: enteredSummary.seniorEventsEntered,
    skippedEligibleEventsCount,
    skippedCoreEventsCount,
    skippedReasonSummary: buildSkippedReasonSummary(skippedEligibleEventsCount, explicitSkippedCount, highCostCount),
    accessBand,
    eventVolumeBandStatus: getEventVolumeBandStatus(accessBand, enteredSummary.totalTournamentsEntered),
    eventVolumeWarnings: [],
  }
  metrics.eventVolumeWarnings = buildEventVolumeWarnings(row, metrics, enteredSummary)
  return metrics
}

function buildAiEventVolumeMetrics(
  row: Pick<PlayerSnapshotRow, 'age' | 'actualCircuit' | 'competitiveStatus' | 'isOnMainTour' | 'isTourCardHolder' | 'tourCardSource' | 'tourCardYear' | 'yearsRemaining' | 'worldRank' | 'oneYearRank' | 'fatigue' | 'seasonLosses' | 'seasonTitles'>,
  openingState: GameState,
) {
  const eligibleCandidates = openingState.tournaments
    .map((tournament) => ({ tournament, classification: getTournamentClassification(tournament) }))
    .filter(({ tournament, classification }) => isSyntheticEligibleForTournament(row, tournament, classification))
    .sort((left, right) => scoreSyntheticTournamentForRow(row, right.tournament, right.classification) - scoreSyntheticTournamentForRow(row, left.tournament, left.classification))
  const eligibleIds = new Set(eligibleCandidates.map(({ tournament }) => tournament.id))
  const accessBand = getEventAccessBand(row)
  const thresholds = getEventVolumeThresholds(accessBand)
  const completedEventSignal = Math.max(0, (row.seasonLosses ?? 0) + (row.seasonTitles ?? 0))
  const scheduleTarget = Math.round((thresholds.minimum + thresholds.maximum) / 2)
  const estimatedEntries = Math.min(eligibleCandidates.length, Math.max(completedEventSignal, scheduleTarget))
  const selectedIds = new Set(eligibleCandidates.slice(0, estimatedEntries).map(({ tournament }) => tournament.id))
  const enteredSummary = summarizeTournamentSelection(openingState.tournaments, selectedIds)
  const skippedEligibleEventsCount = Math.max(0, eligibleIds.size - selectedIds.size)
  const skippedCoreEventsCount = eligibleCandidates.filter(({ tournament, classification }) => {
    if (selectedIds.has(tournament.id)) return false
    return classification.isMainTourEvent || classification.isQTour || classification.isQSchool
  }).length
  const metrics: DerivedEventVolumeMetrics = {
    availableEventsCount: openingState.tournaments.length,
    eligibleEventsCount: eligibleIds.size,
    enteredEventsCount: enteredSummary.totalTournamentsEntered,
    rankingEventsEntered: enteredSummary.rankingEventsEntered,
    qualifierEventsEntered: enteredSummary.qualifiersEntered,
    majorEventsEntered: enteredSummary.majorsEntered,
    worldChampionshipMainDrawEntered: enteredSummary.worldChampionshipMainDrawEntered,
    worldChampionshipQualifyingEntered: enteredSummary.worldChampionshipQualifyingEntered,
    invitationalsEntered: enteredSummary.eliteInvitationalsEntered,
    playersSeriesEntered: enteredSummary.playersSeriesEntered,
    qTourEventsEntered: enteredSummary.qTourEventsEntered,
    qSchoolEventsEntered: enteredSummary.qSchoolEventsEntered,
    amateurEventsEntered: enteredSummary.amateurEventsEntered,
    youthEventsEntered: enteredSummary.youthEventsEntered,
    seniorEventsEntered: enteredSummary.seniorEventsEntered,
    skippedEligibleEventsCount,
    skippedCoreEventsCount,
    skippedReasonSummary: buildSkippedReasonSummary(skippedEligibleEventsCount, 0, 0, true),
    accessBand,
    eventVolumeBandStatus: getEventVolumeBandStatus(accessBand, enteredSummary.totalTournamentsEntered),
    eventVolumeWarnings: [],
  }
  metrics.eventVolumeWarnings = buildEventVolumeWarnings(row, metrics, enteredSummary)
  return metrics
}

function main() {
  const seasonsArg = process.argv.find((arg) => arg.startsWith('--seasons='))
  const supportProfileArg = process.argv.find((arg) => arg.startsWith('--support-profile='))
  const stopAfterSeasonArg = process.argv.find((arg) => arg.startsWith('--stop-after-season='))
  const startAgeArg = process.argv.find((arg) => arg.startsWith('--start-age='))
  const startingLevelArg = process.argv.find((arg) => arg.startsWith('--starting-level-id='))
  const scenarioLabelArg = process.argv.find((arg) => arg.startsWith('--scenario-label='))
  const positionalSeasonsArg = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null
  const requestedSeasons = Number.parseInt(seasonsArg?.split('=')[1] ?? positionalSeasonsArg ?? '5', 10)
  const seasonsRequested = Number.isFinite(requestedSeasons) && requestedSeasons > 0 ? requestedSeasons : 5
  const stopAfterSeason = stopAfterSeasonArg?.split('=')[1] ?? null
  const requestedStartAge = Number.parseInt(startAgeArg?.split('=')[1] ?? '', 10)
  const customStartAge = Number.isFinite(requestedStartAge) ? requestedStartAge : null
  const customStartingLevelId = startingLevelArg?.split('=')[1] ?? null
  const customScenarioLabel = scenarioLabelArg ? decodeURIComponent(scenarioLabelArg.split('=').slice(1).join('=')) : null
  const customStartingScenario = customStartAge != null || customStartingLevelId != null
  const requestedProfile = (supportProfileArg?.split('=')[1] ?? 'middle').toLowerCase()
  const managedSupportProfile: ManagedSupportProfile = requestedProfile === 'worst' || requestedProfile === 'best' ? requestedProfile : 'middle'
  const supportProfileDescription = getSupportProfileDescription(managedSupportProfile)
  const managedYouthScenario = process.argv.includes('--managed-youth-14')
  const focusedRookieProScenario = process.argv.includes('--rookie-pro-21')
  const rank80TourSurvivalScenario = process.argv.includes('--rank-80-tour-survival')
  const top16AccessScenario = process.argv.includes('--top-16-access')
  const bottomTourAccessScenario = process.argv.includes('--bottom-tour-access')
  const managedScenario = managedYouthScenario || focusedRookieProScenario || rank80TourSurvivalScenario || top16AccessScenario || bottomTourAccessScenario || customStartingScenario
  const scenario = managedYouthScenario
    ? `Managed youth career starting age 14 (${supportProfileDescription})`
    : focusedRookieProScenario
      ? `Focused rookie pro career starting age 21 (${supportProfileDescription})`
      : rank80TourSurvivalScenario
        ? `Rank 80 tour survival scenario (${supportProfileDescription})`
        : top16AccessScenario
          ? `Top 16 event access scenario (${supportProfileDescription})`
          : bottomTourAccessScenario
            ? `Bottom-tour event access scenario (${supportProfileDescription})`
            : customStartingScenario
              ? `${customScenarioLabel ?? `Custom start age ${customStartAge ?? 'default'}${customStartingLevelId ? ` (${customStartingLevelId})` : ''}`} (${supportProfileDescription})`
              : 'Starter-save passive simulation'
  const reportBaseName = managedYouthScenario
    ? getSupportReportBaseName(seasonsRequested, managedSupportProfile)
    : focusedRookieProScenario
      ? `${seasonsRequested}-season-rookie-pro-21-${getSupportProfileDisplayName(managedSupportProfile)}-support-simulation`
      : rank80TourSurvivalScenario
        ? `${seasonsRequested}-season-rank-80-tour-survival`
        : top16AccessScenario
          ? `${seasonsRequested}-season-top-16-event-access`
          : bottomTourAccessScenario
            ? `${seasonsRequested}-season-bottom-tour-event-access`
            : customStartingScenario
              ? `${seasonsRequested}-season-start-age-${customStartAge ?? 'default'}-${customStartingLevelId ?? 'validated'}-${getSupportProfileDisplayName(managedSupportProfile)}-support-simulation`
              : `${seasonsRequested}-season-simulation`
  let state = (managedYouthScenario
    ? createNewCareerState({
        fullName: createPlayerIdentitySeed.name,
        nationality: createPlayerIdentitySeed.nationality,
        age: 14,
        handedness: createPlayerIdentitySeed.handedness as 'Right-handed' | 'Left-handed',
        cueStyle: createPlayerIdentitySeed.cueStyle,
        playingStyle: createPlayerIdentitySeed.playingStyle,
        personalityArchetype: createPlayerIdentitySeed.personalityArchetype,
        sliders: createPlayerSliderCatalog.map((slider) => ({ ...slider })),
        backgroundId: createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0].id,
        startingLevelId: getValidatedStartingLevel(createPlayerStartingLevelCatalog, 14, 'start-q-tour').id,
      })
    : focusedRookieProScenario
      ? createFocusedRookieProState()
      : rank80TourSurvivalScenario
        ? createRank80TourSurvivalState()
      : top16AccessScenario
        ? createTop16AccessState()
        : bottomTourAccessScenario
          ? createBottomTourAccessState()
          : customStartingScenario
            ? createNewCareerState({
                fullName: createPlayerIdentitySeed.name,
                nationality: createPlayerIdentitySeed.nationality,
                age: customStartAge ?? createPlayerIdentitySeed.age,
                handedness: createPlayerIdentitySeed.handedness as 'Right-handed' | 'Left-handed',
                cueStyle: createPlayerIdentitySeed.cueStyle,
                playingStyle: createPlayerIdentitySeed.playingStyle,
                personalityArchetype: createPlayerIdentitySeed.personalityArchetype,
                sliders: createPlayerSliderCatalog.map((slider) => ({ ...slider })),
                backgroundId: createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0].id,
                startingLevelId: getValidatedStartingLevel(
                  createPlayerStartingLevelCatalog,
                  customStartAge ?? createPlayerIdentitySeed.age,
                  customStartingLevelId ?? 'start-q-tour',
                ).id,
              })
            : createStarterState()) as GameState
  let openingState = state
  let previousCircuits = captureCircuits(state)
  const seasons: SeasonReport[] = []
  const issues: string[] = []
  let seasonIssues = new Set<string>()
  let currentSeasonFinance = createEmptyFinanceBreakdown()
  let weeksSimulated = 0
  let tournamentsEntered = 0
  const supportMetricsAccumulator = createSupportMetricAccumulator()
  let previousSnapshotRows: PlayerSnapshotRow[] | null = null
  const seasonSnapshotRowsBySeason = new Map<string, PlayerSnapshotRow[]>()
  const seasonAuditSummaries: SeasonAuditSummary[] = []
  const worldAccessDebugStore = loadWorldAccessDebugStore()
  const eliteEventSelectionDebugStore = loadEliteEventSelectionDebugStore()
  const maxWeeks = seasonsRequested * 70
  let stopAfterSeasonReached = false

  while (seasons.length < seasonsRequested && weeksSimulated < maxWeeks) {
    if (managedScenario) {
      state = runManagedWeeklyCare(state, currentSeasonFinance, managedSupportProfile)
    }

    let selectedTournament: Tournament | null = null
    const hasEnteredTournament = state.tournaments.some((tournament) => tournament.status === 'Entered')
    if (!hasEnteredTournament) {
      const tournament = chooseTournament(state, managedSupportProfile)
      if (tournament) {
        selectedTournament = tournament
        const nextState = enterTournamentState(state, tournament.id)
        recordCashDelta(currentSeasonFinance, 'tournamentEntryFees', state, nextState)
        if (nextState !== state && nextState.tournaments.some((entry) => entry.id === tournament.id && entry.status === 'Entered')) {
          tournamentsEntered += 1
        }
        state = nextState
      }
    }

    recordWorldAccessDebugRow(worldAccessDebugStore, reportBaseName, scenario, openingState, state, selectedTournament)
    if (managedYouthScenario && managedSupportProfile === 'best') {
      recordEliteEventSelectionDebugRows(eliteEventSelectionDebugStore, reportBaseName, scenario, openingState, state, managedSupportProfile)
    }

    const archivedSeason = state.season
    const supportedState = managedScenario ? applySupportProfileState(state, managedSupportProfile) : state
    if (managedScenario) {
      recordSupportSnapshot(supportMetricsAccumulator, supportedState)
    }

    const advancedState = advanceWeekState(supportedState)
    recordWeeklyFinanceDelta(currentSeasonFinance, state, advancedState)
    if (managedScenario) {
      recordMatchMetrics(supportMetricsAccumulator, supportedState, advancedState)
    }
    weeksSimulated += 1

    if (advancedState.player.cash < 0) {
      seasonIssues.add(`${archivedSeason}: player cash dropped below zero (${advancedState.player.cash}).`)
    }
    if (advancedState.player.age > 21 && advancedState.competitionTables.youth.some((row) => row.playerName === advancedState.player.fullName)) {
      seasonIssues.add(`${archivedSeason}: player remained in youth rankings after age 21.`)
    }
    if (advancedState.player.rankingLabel === 'World Ranking' && !advancedState.competitionTables.world.some((row) => row.playerName === advancedState.player.fullName)) {
      seasonIssues.add(`${archivedSeason}: player label is World Ranking but the player is missing from the world table.`)
    }

    if (advancedState.season !== archivedSeason) {
      const seasonReport = buildSeasonReport(archivedSeason, openingState, advancedState, previousCircuits, currentSeasonFinance)
      const snapshotRows = buildSeasonPlayerSnapshotRows(archivedSeason, openingState, advancedState, seasonReport, [...seasons, seasonReport])
      writeSeasonPlayerSnapshots(archivedSeason, snapshotRows)
      seasonSnapshotRowsBySeason.set(archivedSeason, snapshotRows)
      seasonAuditSummaries.push(buildSeasonAuditSummary(archivedSeason, snapshotRows, previousSnapshotRows))
      previousSnapshotRows = snapshotRows
      for (const calendarWarning of seasonReport.calendar.validationWarnings) {
        seasonIssues.add(`${archivedSeason}: ${calendarWarning}`)
      }
      if (seasonReport.circuits.movements.youth.count === 0) {
        seasonIssues.add(`${archivedSeason}: youth table did not change across the rollover.`)
      }
      if (seasonReport.circuits.movements.qTour.count === 0) {
        seasonIssues.add(`${archivedSeason}: Q Tour table did not change across the rollover.`)
      }
      if (!seasonReport.worldRoster.includesPlayerRecord) {
        seasonIssues.add(`${archivedSeason}: player record is missing from worldPlayers after rollover.`)
      }

      seasons.push(seasonReport)
      finalizeWorldAccessDebugSeason(worldAccessDebugStore, reportBaseName, seasonReport)
      if (managedYouthScenario && managedSupportProfile === 'best') {
        finalizeEliteEventSelectionDebugSeason(eliteEventSelectionDebugStore, reportBaseName, seasonReport)
      }
      issues.push(...Array.from(seasonIssues))
      seasonIssues = new Set<string>()
      currentSeasonFinance = createEmptyFinanceBreakdown()
      previousCircuits = captureCircuits(advancedState)
      openingState = advancedState

      if (stopAfterSeason && archivedSeason === stopAfterSeason) {
        stopAfterSeasonReached = true
        state = advancedState
        break
      }
    }

    state = advancedState
  }

  if (!stopAfterSeasonReached && seasons.length < seasonsRequested) {
    issues.push(`Simulation stopped after ${weeksSimulated} weeks and only completed ${seasons.length} archived seasons.`)
  }

  if (!stopAfterSeasonReached) {
    const youthMovementSeasons = seasons.filter((season) => season.circuits.movements.youth.count > 0).length
    if (seasons.length > 0 && youthMovementSeasons / seasons.length < 0.8) {
      issues.push(`Youth movement only occurred in ${youthMovementSeasons}/${seasons.length} seasons; expected at least 80% seasonal churn.`)
    }

    if (seasons.length > 0 && seasons.every((season) => season.circuits.movements.world.count === 0)) {
      issues.push('World table showed zero churn across every simulated season.')
    }
  }

  const primeCareerSeasons = seasons.filter(
    (season) => season.playerAtSeasonOpen.age >= 18
      && season.playerAtSeasonOpen.age <= 30
      && season.finance.openingCash >= 500,
  )
  if (primeCareerSeasons.length > 0) {
    const averageMatches = primeCareerSeasons.reduce((sum, season) => sum + season.performance.matchesPlayed, 0) / primeCareerSeasons.length
    if (averageMatches < 6) {
      issues.push(`Ages 18-30 averaged only ${averageMatches.toFixed(1)} matches per season; expected at least 6 unless broke or unavailable.`)
    }
  }

  const adultNonTourDormantSeasons = seasons.filter((season) => {
    const openingWorldRank = season.pathway.seasonOpen.worldRank ?? 999
    const offTour = !season.pathway.seasonOpen.hasTourCard && openingWorldRank > 128
    const adultPathwayAge = season.playerAtSeasonOpen.age >= 18 && season.playerAtSeasonOpen.age < 40
    const seniorPhase = /senior/i.test(`${season.playerAtSeasonOpen.careerPhase} ${season.playerAtSeasonOpen.competitiveStatus}`)
    const retiredPhase = /retired/i.test(`${season.playerAtSeasonOpen.careerPhase} ${season.playerAtSeasonOpen.competitiveStatus}`)
    const hasExcuse = season.playerAtSeasonOpen.cash < 500 || season.playerAtSeasonOpen.fatigue >= 70
    return adultPathwayAge
      && offTour
      && !seniorPhase
      && !retiredPhase
      && season.playerEntries.totalTournamentsEntered === 0
      && !hasExcuse
  })
  if (adultNonTourDormantSeasons.length > 0) {
    issues.push(`Adult non-tour player had no pathway event entries in ${adultNonTourDormantSeasons.map((season) => season.season).join(', ')}; expected at least one eligible Q Tour, Q School, or amateur event.`)
  }

  const latestSeason = seasons.at(-1)
  const rawFinalSnapshot = snapshotPlayer(state)
  const finalWorldRank = latestSeason?.performance.closingRankingLabel === 'World Ranking'
    ? Math.max(latestSeason.performance.closingRanking, getHistoryPerformanceRankFloor(state.history))
    : rawFinalSnapshot.worldRanking
  const finalCompetitiveStatus = state.careerSystems.lateCareer.retired
    ? 'Retired'
    : getReportedCompetitiveStatus(rawFinalSnapshot.competitiveStatus, finalWorldRank, state.history)
  const finalPlayerSnapshot: SeasonPlayerSnapshot = {
    ...rawFinalSnapshot,
    worldRanking: finalWorldRank,
    competitiveStatus: finalCompetitiveStatus,
    careerStage: finalCompetitiveStatus,
    careerPhase: state.careerSystems.lateCareer.retired ? 'Retired' : rawFinalSnapshot.careerPhase,
    rankingLabel: state.careerSystems.lateCareer.retired ? 'Retired' : rawFinalSnapshot.rankingLabel,
  }

  const report: SimulationReport = {
    generatedAt: new Date().toISOString(),
    scenario,
    seasonsRequested,
    seasonsCompleted: seasons.length,
    weeksSimulated,
    tournamentsEntered,
    issues,
    balanceWarnings: [],
    finalPlayer: finalPlayerSnapshot,
    supportMetrics: managedScenario
      ? buildSupportMetrics(state, seasons, tournamentsEntered, managedSupportProfile, supportMetricsAccumulator, finalPlayerSnapshot)
      : null,
    statusIntegrityAudit: {
      finalStatus: finalCompetitiveStatus,
      worldTitles: 0,
      worldChampionshipWins: 0,
      majorTitles: 0,
      rankingTitles: 0,
      bestTournamentResult: 'n/a',
      sourceOfStatusAssignment: 'pending',
      valid: true,
      warnings: [],
    },
    seasons,
  }
  report.statusIntegrityAudit = buildStatusIntegrityAudit(report, state)
  report.balanceWarnings = buildBalanceWarnings(report, state)

  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(path.join(reportsDir, `${reportBaseName}.json`), JSON.stringify(report, null, 2))
  fs.writeFileSync(path.join(reportsDir, `${reportBaseName}.md`), buildMarkdown(report))
  writeAiPlayerProgressionAudit(report, seasonAuditSummaries)
  writeTournamentFormatAudit(report)
  writeTournamentCalendarAudit(report)
  writePlayerEventVolumeAudit(report, seasonSnapshotRowsBySeason)
  writeRankingPointsRealismAudit(report)
  writeHumanMatchCountAudit(report)
  writeStatusIntegrityAudit(report)
  writeWorldAccessDebugStore(worldAccessDebugStore)
  if (managedYouthScenario && managedSupportProfile === 'best') {
    writeEliteEventSelectionDebug(report, eliteEventSelectionDebugStore)
  }
  const comparisonReportPath = managedYouthScenario ? writeSupportComparisonReportIfReady(seasonsRequested) : null

  console.log(JSON.stringify({
    reportPath: path.join('docs', 'reports', `${reportBaseName}.md`),
    jsonPath: path.join('docs', 'reports', `${reportBaseName}.json`),
    comparisonReportPath: comparisonReportPath ? path.join('docs', 'reports', path.basename(comparisonReportPath)) : null,
    scenario: report.scenario,
    seasonsCompleted: report.seasonsCompleted,
    weeksSimulated: report.weeksSimulated,
    tournamentsEntered: report.tournamentsEntered,
    issues: report.issues,
  }, null, 2))
}

main()
