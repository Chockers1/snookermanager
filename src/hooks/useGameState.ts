import { repairTournamentPayouts, type PayoutRepair } from '../game/payoutRepair';
import { scheduledPlacementPrize } from '../data/tournamentPrizes';
import { captureVictoryMessages } from '../game/victoryInbox';
import { capturePostEventRankings } from '../game/postEventRanking';
import { prepareBetweenMatchesState, type BetweenMatchChoice, type BetweenMatchPreparation } from '../game/betweenMatches';
import { qualificationReport } from '../game/qualificationReport';
import { formatInboxConfidence } from '../utils/inboxFormatting';
import { freshGuide, reconcileFirstWeekGuide, type GuideStep } from '../game/firstWeekGuide';
import { eventAtmosphere, matchWalkout, crowdReaction } from '../game/tournamentAtmosphere';
import { announceSeasonTourChanges, createSeasonTourChanges, type SeasonTourChanges } from '../game/seasonTourChanges';
import { enrichTournamentMessages, retainTournamentArchive, recoverTournamentArchive } from '../game/tournamentCareerHistory';
import { initialAttributeHistory, recordAttributeHistory, recoverAttributeHistory, type AttributeHistory } from '../game/attributeHistory';
import { reconcileSponsorMarket, seasonalSponsorBlocker } from '../game/sponsorMarket';
import { createSeasonStartReport, preserveSeasonStartEmails } from '../game/seasonStartReport';
import { createSeasonEndReport, preserveSeasonEmails } from '../game/seasonEndReport';
import { ensureSeasonClock, seasonPosition, seasonWeekLabel, rolloverSeasonClock, type SeasonClock } from '../game/seasonClock';
import { playerDecline, ageAttributeLoss, type DeclineProfile } from '../game/playerAgeing';
import { reconcileCareerBudget } from '../game/careerBudget';
import { repairCpuHistoricalRecords, ensureWorldPopulation, cpuSeasonEvidence, annualCpuDevelopment, uniqueRankingRows } from '../game/worldIntegrity';
import { recordedSeasonWinners } from '../game/seasonReview';
import { eventFinancialReport, financialSummary } from '../game/eventFinancialReport';
import { reconcileAchievements } from '../game/careerAchievements';
import { entryClosed, entryDeadline } from '../game/tournamentEntry';
import { applyTourSkills, developmentEdge, evolveTourSkills } from '../game/tourDevelopment';
import { frameStory, visitStory } from '../game/contextCommentary';
import { matchObjectives, assessMatchObjectives, matchDebrief } from "../game/matchInsights";
import { sponsorPerformance, sponsorRanking, reviewSponsorPerformance } from "../game/sponsorPerformance";
import { careerLegacyOf, careerLegacyRating, recordLegacyMatch, type CareerLegacy } from '../game/careerLegacy';
import { pathwayEntryReason, pathwayAgeLimit, pathwayPlacementPrize, nationRegion, residenceRegion, qTourRegion, Q_TOUR_POINTS, qTourQualification, seniorQualification, pathwayCardAwards, securedPathwayCards } from '../game/pathwayRules';
import { stepShootOut, stepBallShootOut, attemptGoldenBall, handicapAllowance } from '../game/specialMatchRules';
import { isChampionshipLeague, isGroupDraw, nextGroupFixture, groupFrameOrder } from '../game/championshipLeague';
import { createGroupCompetition, resolveGroupCompetitionStage, applyGroupCompetitionResult, groupCompetitionAward, groupCompetitionChampion } from '../game/groupCompetition';
import { useEffect, useMemo, useRef, useState } from "react";
import { queueProtectedSave, readRecoveryState, storeRecoverySave, listRecoverySaves, validatedRecoveryPayload } from '../game/recoverySaves';
import type { CareerDepthState, CareerDepthAction } from "../game/careerDepth/types";
import { initializeCareerDepth, reconcileCareerDepth, careerDepthAction, nextCareerBoundary } from "../game/careerDepth";
import { depthOf, pendingStory, plusDays, uniqueOpponentId } from "../game/careerDepth/shared";
import { initializeRollingRankings, recordRankingEvent, rebuildRollingRankings, lockTournamentSeedings, seedingRows, rankingEventKey, rankingCutoffDate, countsForWorldRanking, scheduleRankingExpiries, compactRankingLedger, isMajorQualifying, isAttachedQualifying, attachedMainDirectSeeds, recordedMajorQualifiers, type RollingRankingsState } from "../game/rollingRankings";
import { runScheduleAssistance } from "../game/careerDepth/seasonPlanning";
import { developmentTrainingBonus, effectiveCareerAttributes, progressDevelopment, protectPartnerSessions } from "../game/careerDepth/developmentProjects";
import { realismAction, reconcileRealism, realismOf, protectRealismSessions, overseasWeeklyCost } from '../game/realism';
import type { RealismAction } from '../game/realism/types';
import { sessionPlan, pendingMatchBreak, resolveSessionBreak } from '../game/realism/sessions';
import { venueConditions, conditionAdjustment, familiarisedFor } from '../game/realism/conditions';
import { travelOptionsFor, journeyQuote } from '../game/realism/travel';
import { hotelStayPlan } from '../game/realism/accommodation';
import { trainingBaseCost, baseTrainingMultiplier } from '../game/realism/base';
import { protectCommitmentSessions, tournamentCommitmentConflict } from "../game/careerDepth/commitments";
import { learnedCounter, getRivalry, coachNegotiationAdjustment } from "../game/careerDepth/relationships";
import { recordProjectOutcome } from "../game/careerDepth/developmentProjects";
import { matchConfidenceChange, settledConfidence, supportedConfidence } from "../game/confidenceSystem";
import {
  caseCatalog,
  chalkCatalog,
  coachCatalog,
  createPlayerBackgroundCatalog,
  createPlayerIdentitySeed,
  createPlayerStartingLevelCatalog,
  createPlayerSliderCatalog,
  cueCatalog,
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
} from "../data/gameContent";
import {
  getPlayableRounds,
  getBestOfForRound,
  tournamentFormatSummary,
  getTournamentResultExpectation,
  normalizeTournamentRoundLabel,
  resolveTournamentFormat,
} from "../data/tournamentFormats";
import type {
  BracketPlayer,
  BracketRound,
  Coach,
  CoachContract,
  CueConditionState,
  EquipmentState,
  FrameScoreRow,
  HotelOption,
  HealthState,
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
  TrainingConditionState,
  TravelOption,
} from "../types/game";
import {
  calculateAverage,
  calculateMatchStrength,
  calculateOverallRating,
  calculateTechnicalAverage,
} from "../utils/calculations";
import {
  buildCanonicalTournamentResult,
  type CanonicalTournamentResult,
  getCanonicalFinishFlags,
  isNonCompetitiveTournamentResult,
} from "../utils/canonicalTournamentResult";
import {
  getCoachAffordabilityForecast,
  getCoachAvailability,
  getCoachContractOptions,
  getCoachContractWeeks,
  getCoachSlotLimit as getCoachSlotLimitForRanking,
} from "../utils/coachMarket";
import {
  convertMatchWinProbabilityToFrameWinProbability,
  getOpponentRankBand,
  getRoundDifficultyBonus,
  getRoundPressureMultiplier,
} from "../utils/matchOutcomeModel";
import {
  applyPlayingStyleToSliders,
  buildCareerPersonality,
  buildNewCareerAttributes,
  getValidatedStartingLevel,
} from "../utils/newCareerConfig";
import { SIMULATION_MODE, type SimulationMode } from "../utils/simulationMode";
import {
  buildAutoTrainingPlan,
  calculateTrainingEffects,
  normalizeTrainingPlan,
} from "../utils/trainingPlan";
import { shouldRetireCpuPlayer as evaluateCpuRetirement } from "../game/cpuLifecycle";
import {
  evaluateTournamentPlayability,
  getTournamentDateValue,
  selectNextEligibleTournament,
  type TournamentPlayability,
} from "../game/tournamentScheduling";
import {
  ACTIVE_SAVE_KEY,
  readActiveSaveSlotId,
  readSaveSlotIndex,
  SAVE_SLOT_PREFIX,
  encodeCareerSave,
  decodeCareerSave,
  writeCareerStorage,
  writeCareerStorageBatch,
  SAVE_SLOT_INDEX_KEY,
  ACTIVE_SAVE_SLOT_KEY,
  type SaveSlotSummary,
  writeActiveSaveSlotId,
  writeSaveSlotIndex,
} from "../game/saveStorage";
import {
  getProTourAccessBand as getRankAccessBandFromWorldRank,
  getSeededProtection as getSeededProtectionForBand,
  type ProTourAccessBand,
} from "../game/rankingPolicy";
import {
  getFacilityTrainingMultiplier,
  getTrainingAdaptationMultiplier,
  recoverTrainingCondition,
} from "../game/trainingSystem";
import {
  applyEquipmentMatchWear,
  getCueState,
  getEquipmentPerformanceProfile,
} from "../game/equipmentSystem";
import {
  calculateSponsorMatchBonus,
  getSponsorObligationProfile,
} from "../game/sponsorshipSystem";
import { getTreatmentEffect, needsHealthRecovery, treatmentPreview } from "../game/healthSystem";
import {
  calculatePreparationEffects,
  type PreparationAllocations,
  type PreparationFocusId,
  type PreparationSupportId,
  type TournamentPreparationPlan,
} from "../game/tournamentPreparation";

export {
  getFacilityTrainingMultiplier,
  getTrainingAdaptationMultiplier,
} from "../game/trainingSystem";
export {
  applyEquipmentMatchWear,
  getEquipmentPerformanceProfile,
} from "../game/equipmentSystem";
export {
  calculateSponsorMatchBonus,
  getSponsorObligationProfile,
} from "../game/sponsorshipSystem";

type FinanceState = {
  cash: number;
  budgetWarningPeriod?: string;
  baseCashFlow: number;
  cashFlow: number;
  budgetTargets: Record<string, number>;
  ledger: FinanceTransaction[];
};

export type FinanceTransaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "Income" | "Expense";
};

export type TravelBookingState = {
  tournamentId: string;
  travelOptionId: string;
  hotelOptionId: string;
  totalCost: number;
  bookedWeek: number;
  bookedDate: string;
  preparation?: TournamentPreparationPlan;
  betweenMatches?: BetweenMatchPreparation;
};

type TravelState = {
  bookings: Record<string, TravelBookingState>;
};

type MaintenanceState = {
  history: MaintenanceHistoryItem[];
};

type SponsorOfferState = SponsorOfferCard & {
  status: "Available" | "Accepted" | "Rejected";
  negotiationCount: number;
  notes: string[];
};

export type TournamentRound = string;

export type SyntheticLiveVisitMatchInput = {
  simulationMode: Extract<SimulationMode, "liveVisitCalibration">;
  playerName: string;
  opponentName: string;
  playerRankBand?: string;
  opponentRankBand?: string;
  playerTacticalPlan?: "Attack" | "Balanced" | "Safety";
  opponentTacticalPlan?: "Attack" | "Balanced" | "Safety";
  playerTempo?: "Deliberate" | "Steady" | "Quick";
  bestOf: number;
  round?: TournamentRound;
  seed: number;
  playerAttributes: PlayerAttributes;
  playerEquipmentBonus?: number;
  opponentAttributes?: PlayerAttributes;
  opponentEquipmentBonus?: number;
  opponentProfileMode?: "rankBased" | "attributes";
  startingPlayer?: "player" | "opponent";
  playerConfidence: number;
  playerFatigue: number;
  playerClutch: number;
  playerStrength: number;
  opponentRanking: number;
  opponentConfidence: number;
  opponentFatigue: number;
  opponentClutch: number;
  opponentStrength: number;
  plannedMatchWinChance: number;
  preserveTacticalEdge?: boolean;
  initialPlayerFrames?: number;
  initialOpponentFrames?: number;
  initialPressureValue?: number;
};

export type SyntheticLiveVisitMatchResult = {
  playerWon: boolean;
  playerFrames: number;
  opponentFrames: number;
  score: string;
  frameWinChance: number;
  decidingFrame: boolean;
  whitewash: boolean;
  playerHighestBreak: number;
  opponentHighestBreak: number;
  playerFifties: number;
  playerCenturies: number;
  playerMaximums?: number;
  totalVisits: number;
  decisionCounts: Record<LiveVisitDecision, number>;
  frameHistory: FrameScoreRow[];
  frameSummaries: SyntheticLiveVisitFrameSummary[];
  fullVisitLog: SyntheticLiveVisitVisitLogEntry[];
  debugMetrics: SyntheticLiveVisitDebugMetrics;
  constructedProfiles: {
    player: ConstructedLiveVisitProfile;
    opponent: ConstructedLiveVisitProfile;
  };
  finalState: {
    playerConfidence: number;
    opponentConfidence: number;
    playerFatigue: number;
    opponentFatigue: number;
    pressureValue: number;
    pressureLabel: string;
  };
};

type SimulatedFrameOutcome = {
  playerWonFrame: boolean;
  playerPoints: number;
  opponentPoints: number;
  playerBreak: number;
  opponentBreak: number;
};

type CareerMatchResolution = {
  playerWonMatch: boolean;
  loserFrames: number;
  frameOrder: boolean[];
};

type SyntheticLiveVisitSideMetrics = {
  frameStarts: number;
  firstScoringChances: number;
  visits: number;
  pointsScored: number;
  frameWins: number;
  potAttempts: number;
  potSuccesses: number;
  breakBuildAttempts: number;
  breakBuildSuccesses: number;
  safetyAttempts: number;
  safetySuccesses: number;
  snookerHuntAttempts: number;
  snookerHuntSuccesses: number;
  respottedBlackAttempts: number;
  respottedBlackSuccesses: number;
  foulsCommitted: number;
  unforcedErrors: number;
  scoringVisitCount: number;
  totalScoringBreak: number;
  totalTacticalEdge: number;
  totalDecisionBonus: number;
  totalSuccessChance: number;
  totalConfidence: number;
  totalFatigue: number;
};

export type SyntheticLiveVisitDebugMetrics = {
  player: SyntheticLiveVisitSideMetrics;
  opponent: SyntheticLiveVisitSideMetrics;
};

export type ConstructedLiveVisitProfile = {
  side: "player" | "opponent";
  name: string;
  sourceKind: "attributes" | "rankBased";
  sourceRankBand: string;
  overall: number;
  technicalAverage: number;
  mentalAverage: number;
  physicalAverage: number;
  confidence: number;
  fatigue: number;
  pressureHandling: number;
  composure: number;
  breakBuilding: number;
  safety: number;
  potting: number;
  longPotting: number;
  tacticalRating: number;
  consistency: number;
  errorRate: number;
  equipmentBonus: number;
  tacticalPlan: "Attack" | "Balanced" | "Safety";
  startsFrameProbability: number;
  initialMomentum: number;
  constructedStrength: number;
  visitProfile: LiveVisitSkillProfile;
};

export type NewCareerConfig = {
  fullName: string;
  nationality: string;
  age: number;
  dateOfBirth?: string;
  handedness: Player["handedness"];
  cueStyle: string;
  playingStyle: string;
  personalityArchetype: string;
  sliders: Array<{ label: string; value: number }>;
  backgroundId: string;
  startingLevelId: string;
};

type TournamentProgressState = {
  rulesVersion?: number;
  tournamentId: string | null;
  currentRound: TournamentRound | null;
  draw: BracketRound[];
  rankingBaseline: Partial<
    Record<CompetitionTableKey, Record<string, number>>
  >;
  completedRounds: Array<{
    round: TournamentRound;
    opponentName: string;
    result: Match["result"];
    playerFrames: number;
    opponentFrames: number;
  }>;
};

type LiveMatchTacticalPlan = "Attack" | "Balanced" | "Safety";
type LiveMatchMentalFocus = "Composed" | "Confident" | "Counter";
export type LiveMatchTempo = "Deliberate" | "Steady" | "Quick";
type LiveMatchResolutionMode = "manual" | "simulated";
type LiveMatchOpponentApproach = "Pressing" | "Measured" | "Tight";
type LiveMatchOpponentArchetype =
  "Serial Scorer" | "Tactical Grinder" | "Counter Puncher" | "Tempo Disruptor";
type LiveEndgameColour =
  "Yellow" | "Green" | "Brown" | "Blue" | "Pink" | "Black";
type LiveVisitDecision =
  | "Pot Attempt"
  | "Break Build"
  | "Safety Exchange"
  | "Snooker Hunt"
  | "Respotted Black";
type LiveVisitActor = "Player" | "Opponent";

type LiveFrameTableState = {
  redsRemaining: number;
  coloursRemaining: LiveEndgameColour[];
  ballOn?: "Red" | "Colour" | "Colours";
};

type LiveMatchCoachPrompt = {
  title: string;
  note: string;
  recommendedPlan: LiveMatchTacticalPlan;
  recommendedMentalFocus: LiveMatchMentalFocus;
  recommendedTempo: LiveMatchTempo;
};

type LiveMatchOpponentAdjustment = {
  title: string;
  note: string;
  trigger: "Frame Swing" | "Timeout" | "Pressure";
  fromApproach: LiveMatchOpponentApproach;
  toApproach: LiveMatchOpponentApproach;
  frameLabel: string;
};

type LiveVisitLogEntry = {
  id: string;
  frameLabel: string;
  visit: number;
  actor: LiveVisitActor;
  decision: LiveVisitDecision;
  outcome: string;
  points: number;
  breakTotal: number;
  retainedTable: boolean;
  success: boolean;
  foulOccurred: boolean;
  successChance: number;
  tacticalEdge: number;
  decisionBonus: number;
  actorConfidence: number;
  actorFatigue: number;
  pressureValue: number;
  playerPointsAfter: number;
  opponentPointsAfter: number;
};

type LiveMatchSideStats = {
  visits: number;
  pointsScored: number;
  potAttempts: number;
  potsMade: number;
  safetyAttempts: number;
  safetiesWon: number;
  fouls: number;
};

type LiveFrameTactics = {
  frame: string;
  tacticalPlan: LiveMatchTacticalPlan;
  mentalFocus: LiveMatchMentalFocus;
  tempo: LiveMatchTempo;
};

export type SyntheticLiveVisitVisitLogEntry = LiveVisitLogEntry;

export type SyntheticLiveVisitFrameSummary = {
  frameNumber: number;
  winner: "Player" | "Opponent";
  score: string;
  playerPoints: number;
  opponentPoints: number;
  keyBreak: number;
  closeFrame: boolean;
  decidingFrame: boolean;
  pressurePhase: "Standard" | "Closing" | "Decider" | "Final";
  firstScoreBy: "Player" | "Opponent" | "None";
  hadLeadChange: boolean;
  winnerCameFromBehind: boolean;
  playerConfidenceStart: number;
  playerConfidenceEnd: number;
  opponentConfidenceStart: number;
  opponentConfidenceEnd: number;
  playerFatigueStart: number;
  playerFatigueEnd: number;
  opponentFatigueStart: number;
  opponentFatigueEnd: number;
  pressureStart: number;
  pressureEnd: number;
  keyMoments: string[];
  reason: string;
};

type LiveVisitSkillProfile = {
  longPotting: number;
  breakBuilding: number;
  cueBallControl: number;
  safetyPlay: number;
  consistency: number;
  composure: number;
  focus: number;
  bigMatchNerve: number;
  handSteadiness: number;
  stamina: number;
};

export type LiveMatchState = {
  atmosphere?: import('../game/tournamentAtmosphere').MatchAtmosphere;
  careerBestAtStart?: number;
  objectives?: import("../game/matchInsights").PersonalMatchObjective[];
  special?: import('../game/specialMatchRules').SpecialMatchState;
  sessions?: import('../game/realism/types').MatchSessions;
  venue?: import('../game/realism/types').VenueConditions;
  conditionEffect?: number;
  sessionId?: string;
  tournamentId: string;
  round: TournamentRound;
  bestOf: number;
  framesNeeded: number;
  playerName: string;
  opponentName: string;
  opponentRanking: number;
  opponentArchetype: LiveMatchOpponentArchetype;
  playerFrames: number;
  opponentFrames: number;
  currentFrame: number;
  playerPoints: number;
  opponentPoints: number;
  currentVisit: number;
  currentBreak: number;
  tableState: LiveFrameTableState;
  ballsRemaining: number;
  playerAtTable: string;
  frameStarterName: string;
  shotClock: number;
  playerConfidence: number;
  opponentConfidence: number;
  playerFatigue: number;
  opponentFatigue: number;
  playerClutch: number;
  opponentClutch: number;
  playerHighestBreak: number;
  opponentHighestBreak: number;
  playerFifties: number;
  playerCenturies: number;
  playerMaximums?: number;
  pressureValue: number;
  pressureLabel: string;
  timeElapsedMinutes: number;
  startedAt: string;
  table: string;
  referee: string;
  conditions: string;
  intervalText: string;
  framesRemainingText: string;
  plannedWinChance: number;
  plannedMatchWinChance: number;
  plannedPlayerStrength: number;
  plannedOpponentStrength: number;
  feed: LiveFeedItem[];
  momentum: LiveMomentumPoint[];
  frameHistory: FrameScoreRow[];
  frameTactics: LiveFrameTactics[];
  playerStats: LiveMatchSideStats;
  opponentStats: LiveMatchSideStats;
  tacticalPlan: LiveMatchTacticalPlan;
  mentalFocus: LiveMatchMentalFocus;
  tempo: LiveMatchTempo;
  timeoutsRemaining: number;
  lastFrameMode: "Played" | "Simmed" | null;
  lastTacticalNote: string;
  lastVisitSummary: string;
  opponentApproach: LiveMatchOpponentApproach;
  tacticalEdge: number;
  coachPrompt: LiveMatchCoachPrompt;
  lastOpponentAdjustment: LiveMatchOpponentAdjustment | null;
  opponentAdjustmentHistory: LiveMatchOpponentAdjustment[];
  visitHistory: LiveVisitLogEntry[];
  playerVisitProfile: LiveVisitSkillProfile;
  opponentVisitProfile: LiveVisitSkillProfile;
  status: "In Progress" | "Completed";
};

type CareerSnapshot = {
  seasonNumber?: number;
  seasonWeek?: number;
  label: string;
  season: string;
  week: number;
  date: string;
  ranking: number;
  rankingLabel: string;
  cash: number;
  confidence: number;
  fatigue: number;
  morale: number;
  reputation: number;
  sponsorCount: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  totalPrizeMoney: number;
};

type CareerMatchLogEntry = {
  id: string;
  season: string;
  date: string;
  tournamentId: string;
  tournamentName: string;
  eventType: Tournament["eventClass"] | Tournament["type"];
  tournamentClass?: string;
  round: string;
  opponentName: string;
  playerRanking?: number;
  opponentRanking?: number;
  winProbability?: number;
  playerStrength?: number;
  opponentStrength?: number;
  opponentRankBand?: string;
  result: Match["result"];
  score: string;
  bestOf: number;
  playerFrames: number;
  opponentFrames: number;
  wentToDecider: boolean;
  pressurePeak: number;
  prizeMoney: number;
  rankingPoints: number;
};

type TournamentHistoryEntry = {
  recoveredFromLedger?: { prizeKnown: boolean };
  entryPaid?: number;
  preparationPaid?: number;
  venuePracticePaid?: number;
  sponsorBonusesPaid?: number;
  id: string;
  season: string;
  tournamentId: string;
  formatId?: string | null;
  tournamentName: string;
  eventType: Tournament["eventClass"] | Tournament["type"];
  stageId: number | null;
  tourCircuit: string;
  location: string;
  startDate: string;
  endDate?: string;
  status:
    | "Entered"
    | "Booked"
    | "Skipped"
    | "High Cost"
    | "In Progress"
    | "Completed";
  result: string;
  rounds: string[];
  matchesPlayed: number;
  wins: number;
  losses: number;
  prizeMoney: number;
  rankingPoints: number;
  highestBreak: number;
  centuries: number;
  fatigueChange: number;
  entryFee: number;
  bookedTravelCost: number;
  reward?: string;
  progressionImpact?: string;
  canonicalResult?: CanonicalTournamentResult;
  bracket?: BracketRound[];
  roundResults?: TournamentProgressState["completedRounds"];
};

type CareerSeasonRecord = {
  season: string;
  startedOn: string;
  endedOn: string;
  openingRanking: number;
  openingRankingLabel: string;
  closingRanking: number;
  closingRankingLabel: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  prizeMoney: number;
  rankingPoints: number;
  highestBreak: number;
  centuries: number;
  titles: number;
  majorTitles: number;
  qTourWins: number;
  qSchoolEventsEntered: number;
  qSchoolCampaignsEntered: number;
  qSchoolMatchesWon: number;
  qSchoolCardsWon: number;
  tourCardsWon: number;
  bestResult: string;
};

type CareerHistoryState = {
  legacy?: CareerLegacy;
  snapshots: CareerSnapshot[];
  matchLog: CareerMatchLogEntry[];
  tournamentHistory: TournamentHistoryEntry[];
  seasonRecords: CareerSeasonRecord[];
};

type SeasonWorldHeadline = {
  tournamentName: string;
  winner: string;
  playerWon: boolean;
};

type SeasonReviewTransition = {
  pending: boolean;
  popupDismissed?: boolean;
  finalRankings?: { ranking: number; playerName: string; points: number }[];
  completedSeason: CareerSeasonRecord;
  nextSeason: string;
  financialChange: number;
  careerDecision: {
    title: string;
    detail: string;
    expectation: string;
  };
  worldNumberOne: {
    playerName: string;
    nation: string;
    titles: number;
    wins: number;
    losses: number;
  } | null;
  majorWinners: SeasonWorldHeadline[];
  promotedPlayers: string[];
  cardLosses: string[];
  retirements: string[];
  newcomers: string[];
};

type CompetitionTableKey =
  "world" | "oneYear" | "amateur" | "qTour" | "qSchool" | "senior" | "youth";

export type CompetitionTableRow = RankingRow & {
  eventsPlayed: number;
  titles: number;
  wins: number;
  losses: number;
  statusNote?: string;
};

type CompetitionTablesState = Record<
  CompetitionTableKey,
  CompetitionTableRow[]
>;

type TourCardSource =
  | "Q School"
  | "Q Tour"
  | "Top Up"
  | "Playoff Route"
  | "Federation Route"
  | "Ranking Retained"
  | "Seeded Main Tour"
  | "Focused Test Card"
  | "Unknown"
  | null;

type TourSurvivalStatus =
  | "Amateur"
  | "Rookie Year 1"
  | "Rookie Year 2"
  | "Safe"
  | "Bubble"
  | "At Risk"
  | "Lost Card"
  | "Top 32"
  | "Top 16"
  | "Elite";

type WorldPlayerSeasonRecord = {
  season: string;
  worldRank: number | null;
  oneYearRank: number | null;
  amateurRank: number | null;
  qTourRank: number | null;
  qSchoolRank: number | null;
  seniorRank: number | null;
  youthRank: number | null;
  matches: number;
  wins: number;
  losses: number;
  prizeMoney: number;
  rankingPoints: number;
  titles: number;
  proWins: number;
  proLosses: number;
  mainTourEvents: number;
  status: string;
  hasTourCard: boolean;
  yearsRemaining: number;
  retainedViaRanking: boolean;
  cardSource: TourCardSource;
  tourSurvivalStatus: TourSurvivalStatus;
};

type WorldPlayerRecord = {
  declineProfile?: DeclineProfile;
  centuries?: number;
  breakRecordsMatches?: number;
  skillDevelopment?: import("../game/tourDevelopment").TourDevelopment;
  id: string;
  playerName: string;
  nation: string;
  age: number;
  hasTourCard: boolean;
  cardSource: TourCardSource;
  currentYear: number;
  yearsRemaining: number;
  expiresAfterSeason: string | null;
  retainedViaRanking: boolean;
  tourSurvivalStatus: TourSurvivalStatus;
  totalMatches: number;
  wins: number;
  losses: number;
  totalPrizeMoney: number;
  titles: number;
  majorTitles: number;
  qTourWins: number;
  seniorTitles: number;
  highestBreak: number;
  highestWorldRank: number | null;
  overallRating?: number;
  ratingProgress?: number;
  recentResults?: Array<"W" | "L">;
  developmentPotential?: number;
  coachQuality?: number;
  equipmentQuality?: number;
  trainingLoad?: number;
  fatigue?: number;
  injuryWeeks?: number;
  sponsorLevel?: number;
  retired: boolean;
  retiredSeason: string | null;
  seasons: WorldPlayerSeasonRecord[];
};

type QTourSystemState = {
  playerRank: number | null;
  playerPoints: number;
  leader: string | null;
  top16Bonus: boolean;
  top32Bonus: boolean;
  top16Streak: number;
  top8Streak: number;
  top2Streak: number;
  eligibilityScore: number;
  directCardAwarded: boolean;
  playOffEligible: boolean;
  playOffWinner: string | null;
};

type QSchoolSystemState = {
  playerRank: number | null;
  playerPoints: number;
  leader: string | null;
  campaignsEntered: number;
  eventWins: number;
  repeatedFailures: number;
  eligibilityScore: number;
  campaignEligible: boolean;
  seededCampaign: boolean;
  directPlayoffEligible: boolean;
  eligibilitySeasonsRemaining: number;
  cooldownSeasonsRemaining: number;
  qualifiedBy: string | null;
  topUpEligible: boolean;
  slumpRisk: boolean;
};

type ProCareerSystemState = {
  hasTourCard: boolean;
  cardSource: TourCardSource;
  currentYear: number;
  yearsRemaining: number;
  expiresAfterSeason: string | null;
  retainedViaRanking: boolean;
  awardedBy: string | null;
  survivalStatus: TourSurvivalStatus;
  tourSurvivalStatus: TourSurvivalStatus;
  currentTier: string;
  worldRank: number | null;
  oneYearRank: number | null;
};

type LateCareerSystemState = {
  veteranActive: boolean;
  seniorEligible: boolean;
  seniorActive: boolean;
  legendStatus: boolean;
  retired: boolean;
};

type CareerSystemsState = {
  qTour: QTourSystemState;
  qSchool: QSchoolSystemState;
  pro: ProCareerSystemState;
  lateCareer: LateCareerSystemState;
};

export type GameState = {
  firstWeekGuide?: import('../game/firstWeekGuide').FirstWeekGuideState;
  seasonClock?: SeasonClock;
  worldPopulationSeason?: string;
  realism?: import('../game/realism/types').RealismState;
  rollingRankings?: RollingRankingsState;
  careerDepth?: CareerDepthState;
  schemaVersion: number;
  payoutRepair?: PayoutRepair;
  worldSeed: number;
  currentDate: string;
  season: string;
  week: number;
  player: Player;
  attributes: PlayerAttributes;
  coaches: Coach[];
  currentCoachId: string | null;
  equipment: EquipmentState;
  finance: FinanceState;
  tournaments: Tournament[];
  matches: Match[];
  rankings: RankingRow[];
  competitionTables: CompetitionTablesState;
  worldPlayers: WorldPlayerRecord[];
  careerSystems: CareerSystemsState;
  sponsors: SponsorDeal[];
  sponsorMarket?: import("../game/sponsorMarket").SponsorMarketState;
  sponsorOffers: SponsorOfferState[];
  inbox: InboxMessage[];
  travel: TravelState;
  maintenance: MaintenanceState;
  tournamentProgress: TournamentProgressState;
  liveMatch: LiveMatchState | null;
  history: CareerHistoryState;
  seasonReview: SeasonReviewTransition | null;
  tourChangesReport?: SeasonTourChanges;
  tourChangesAnnouncedSeason?: string;
  coachContracts: CoachContract[];
  trainingPlan: TrainingPlannerDay[];
  trainingAppliedWeek: number | null;
  trainingCondition: TrainingConditionState;
  attributeHistory?: AttributeHistory;
  health: HealthState;
  lastAction: string;
};

export const SAVE_SCHEMA_VERSION = 13;
const STORAGE_KEY = ACTIVE_SAVE_KEY;
const TOURNAMENT_ROUNDS: TournamentRound[] = [
  "Last 16",
  "Quarter Final",
  "Semi Final",
  "Final",
];

function getTournamentRounds(tournament: Tournament): TournamentRound[] {
  const configured = getPlayableRounds(resolveTournamentFormat(tournament));
  return configured.length > 0 || resolveTournamentFormat(tournament).formatFamily === "administrative" ? configured : TOURNAMENT_ROUNDS;
}

function getNamedKnockoutMatchCount(round: string) {
  const normalized = normalizeTournamentRoundLabel(round);
  const lastMatch = normalized.match(/^last\s*(\d+)$/);
  if (lastMatch) return Math.max(1, Number(lastMatch[1]) / 2);
  if (/quarter.?final/.test(normalized)) return 4;
  if (/semi.?final/.test(normalized)) return 2;
  if (/\bfinal\b/.test(normalized) && !/qualifying|section/.test(normalized))
    return 1;
  return null;
}

function getTournamentRoundMatchCount(
  tournament: Tournament,
  round: TournamentRound,
  roundIndex: number,
) {
  const format = resolveTournamentFormat(tournament);
  const rounds = getTournamentRounds(tournament);
  const fieldSize = format.fieldSize ?? 16;

  if (format.id === "championshipLeagueRanking") {
    return [32, 8, 2, 1][roundIndex] ?? 1;
  }
  if (format.id === "championshipLeagueInvitational") {
    return [7, 1][roundIndex] ?? 1;
  }

  let priorWinners = 0;
  for (let index = 0; index <= roundIndex; index += 1) {
    const entrantsAtRound = Array.from({ length: fieldSize }, (_, rankIndex) =>
      getConfiguredEntryRoundForRank(tournament, rankIndex + 1 + (format.seedOffset ?? 0), rounds),
    ).filter((entryRound) => entryRound === rounds[index]).length;
    const matchCount = Math.max(
      1,
      Math.ceil((priorWinners + entrantsAtRound) / 2),
    );
    if (index === roundIndex) return matchCount;
    priorWinners = matchCount;
  }

  return getNamedKnockoutMatchCount(round) ?? 1;
}
const HISTORY_LIMIT = 40;
const MATCH_LOG_LIMIT = 240;
const JUNIOR_FIRST_NAMES = [
  "Luca",
  "Noah",
  "Arlo",
  "Mika",
  "Toby",
  "Evan",
  "Rory",
  "Jude",
  "Finn",
  "Kai",
  "Aiden",
  "Ben",
  "Caleb",
  "Dev",
  "Eli",
  "Hugo",
  "Ivo",
  "Jonah",
  "Kian",
  "Louis",
  "Milo",
  "Nico",
  "Owen",
  "Pavel",
  "Ren",
  "Sacha",
  "Theo",
  "Victor",
  "Will",
  "Yuri",
  "Zhen",
  "Mateo",
];
const JUNIOR_LAST_NAMES = [
  "Mercer",
  "Sloan",
  "Hale",
  "Bennett",
  "Cross",
  "Mori",
  "Dawes",
  "Pryce",
  "Vale",
  "Keane",
  "Aoki",
  "Bauer",
  "Chen",
  "Dubois",
  "Evans",
  "Fischer",
  "Garcia",
  "Huang",
  "Ito",
  "Jones",
  "Khan",
  "Larsen",
  "Martin",
  "Novak",
  "Ortega",
  "Park",
  "Quinn",
  "Rossi",
  "Singh",
  "Tan",
  "Usman",
  "Wilson",
];
const JUNIOR_NATIONS = ["ENG", "CHN", "SCO", "WAL", "BEL", "IRL", "THA", "AUS"];
const FEEDER_FIRST_NAMES = [
  "Mason",
  "Leo",
  "Owen",
  "Isaac",
  "Felix",
  "Harvey",
  "Ethan",
  "Adam",
  "Lewis",
  "Cian",
  "Daniel",
  "George",
  "Henry",
  "Jack",
  "Leon",
  "Max",
  "Nathan",
  "Oscar",
  "Ruben",
  "Sam",
  "Tom",
  "Wei",
  "Xavi",
  "Yann",
  "Zaid",
];
const FEEDER_LAST_NAMES = [
  "Turner",
  "Nash",
  "Walsh",
  "Frost",
  "Reeve",
  "Bell",
  "Cairn",
  "Flint",
  "Pike",
  "Arden",
  "Brooks",
  "Clarke",
  "Diaz",
  "Ellis",
  "Ford",
  "Green",
  "Hill",
  "Ibrahim",
  "Jensen",
  "Kim",
  "Lopez",
  "Moore",
  "Nguyen",
  "Owens",
  "Price",
];
const FEEDER_NATIONS = [
  "ENG",
  "SCO",
  "WAL",
  "IRL",
  "NIR",
  "BEL",
  "GER",
  "NED",
  "POL",
  "AUS",
];
const SEASON_RECORD_LIMIT = 12;
const COMPETITION_TABLE_KEYS: CompetitionTableKey[] = [
  "world",
  "oneYear",
  "amateur",
  "qTour",
  "qSchool",
  "senior",
  "youth",
];
const SPONSOR_SLOT_NAMES = [
  "Waistcoat Front",
  "Cue Case",
  "Social Media Partner",
] as const;
const COACH_SLOT_NAMES = ["Lead Coach", "Specialist Coach"] as const;
const MAIN_TOUR_POOL_SIZE = 128;
const TOP_16_RANK_CUTOFF = 16;
const TOP_32_RANK_CUTOFF = 32;
const TOP_64_RANK_CUTOFF = 64;

const ROUND_PLANS: Record<
  TournamentRound,
  {
    bestOf: number;
    winPrizeShare: number;
    lossPrizeShare: number;
    winPointsShare: number;
    lossPointsShare: number;
  }
> = {
  "Last 16": {
    bestOf: 7,
    winPrizeShare: 0.08,
    lossPrizeShare: 0.02,
    winPointsShare: 0.12,
    lossPointsShare: 0.03,
  },
  "Quarter Final": {
    bestOf: 7,
    winPrizeShare: 0.14,
    lossPrizeShare: 0.05,
    winPointsShare: 0.22,
    lossPointsShare: 0.06,
  },
  "Semi Final": {
    bestOf: 9,
    winPrizeShare: 0.24,
    lossPrizeShare: 0.1,
    winPointsShare: 0.36,
    lossPointsShare: 0.12,
  },
  Final: {
    bestOf: 11,
    winPrizeShare: 0.45,
    lossPrizeShare: 0.18,
    winPointsShare: 0.62,
    lossPointsShare: 0.2,
  },
};

export function getTournamentRoundPlan(
  tournament: Tournament,
  round: TournamentRound,
) {
  const rounds = getTournamentRounds(tournament);
  const roundIndex = Math.max(0, rounds.indexOf(round));
  const roundsRemaining = Math.max(0, rounds.length - roundIndex - 1);
  const basePlan = ROUND_PLANS[round as keyof typeof ROUND_PLANS] ?? {
    bestOf: 7,
    winPrizeShare: Math.max(0.015, 0.45 / 2 ** roundsRemaining),
    lossPrizeShare: Math.max(0.008, 0.18 / 2 ** roundsRemaining),
    winPointsShare: Math.max(0.015, 0.62 / 2 ** roundsRemaining),
    lossPointsShare: Math.max(0.008, 0.2 / 2 ** roundsRemaining),
  };
  return {
    ...basePlan,
    bestOf: getBestOfForRound(tournament, round, basePlan.bestOf),
  };
}

export function getTournamentPlacementAwards(
  tournament: Tournament,
  round: TournamentRound,
  champion: boolean,
) {
  // Qualifying is not a championship title or an extra winner's purse.
  // Successful qualifiers receive their eventual main-draw finishing award.
  if (champion && isAttachedQualifying(tournament)) return { prizeMoney: 0, rankingPoints: 0 };
  const plan = getTournamentRoundPlan(tournament, round);
  const normalizedRound = normalizeTournamentRoundLabel(round);
  const prizeMoney = scheduledPlacementPrize(tournament, round, champion) ?? pathwayPlacementPrize(tournament, round, champion) ?? (champion
    ? (tournament.winnerPrize ?? Math.round(tournament.prizeMoney * 0.5))
    : /\bfinal\b/.test(normalizedRound) &&
        !/semi|quarter|section/.test(normalizedRound)
      ? (tournament.runnerUpPrize ?? Math.round(tournament.prizeMoney * 0.22))
      : /semi.?final/.test(normalizedRound)
        ? (tournament.semiFinalPrize ??
          Math.round(tournament.prizeMoney * 0.08))
        : /quarter.?final/.test(normalizedRound)
          ? (tournament.quarterFinalPrize ??
            Math.round(tournament.prizeMoney * 0.03))
          : (tournament.firstRoundPrize ??
            Math.max(
              0,
              Math.round(tournament.prizeMoney * plan.lossPrizeShare),
            )));
  const awardsRankingPoints =
    tournament.rankingValue > 0 && tournament.rankingType !== "None";
  const rankingPoints = tournament.type === 'Q Tour' && qTourRegion(tournament) === 'Europe' ? Q_TOUR_POINTS[champion ? 'Winner' : round] ?? 0 : countsForWorldRanking(tournament)
    ? prizeMoney
    : !awardsRankingPoints
    ? 0
    : champion
      ? tournament.rankingValue
      : Math.max(0, Math.round(tournament.rankingValue * plan.lossPointsShare));

  return { prizeMoney, rankingPoints };
}

function getQSchoolRoute(tournament: Tournament) {
  const name = tournament.name.toLowerCase();
  if (/asia[\s-]*oceania/.test(name)) return "asiaOceania";
  if (/uk[\s/-]*europe|europe q school/.test(name)) return "ukEurope";
  return "generic";
}

function getQSchoolCardWinningRound(tournament: Tournament): TournamentRound {
  return getQSchoolRoute(tournament) === "asiaOceania" ? "Semi Final" : "Quarter Final";
}
const LIVE_ENDGAME_COLOURS: LiveEndgameColour[] = [
  "Yellow",
  "Green",
  "Brown",
  "Blue",
  "Pink",
  "Black",
];
const LIVE_ENDGAME_COLOUR_POINTS: Record<LiveEndgameColour, number> = {
  Yellow: 2,
  Green: 3,
  Brown: 4,
  Blue: 5,
  Pink: 6,
  Black: 7,
};
const LIVE_OPPONENT_ARCHETYPES: LiveMatchOpponentArchetype[] = [
  "Serial Scorer",
  "Tactical Grinder",
  "Counter Puncher",
  "Tempo Disruptor",
];
const LIVE_FRAME_START_REDS = 15;

function createEmptyLiveMatchStats(): LiveMatchSideStats {
  return {
    visits: 0,
    pointsScored: 0,
    potAttempts: 0,
    potsMade: 0,
    safetyAttempts: 0,
    safetiesWon: 0,
    fouls: 0,
  };
}

function deriveLiveMatchStats(
  visits: LiveVisitLogEntry[],
  actor: LiveVisitActor,
): LiveMatchSideStats {
  return visits
    .filter((visit) => visit.actor === actor)
    .reduce((stats, visit) => {
      const isPot =
        visit.decision === "Pot Attempt" ||
        visit.decision === "Break Build" ||
        visit.decision === "Respotted Black";
      const isSafety =
        visit.decision === "Safety Exchange" ||
        visit.decision === "Snooker Hunt";
      stats.visits += 1;
      stats.pointsScored += Math.max(0, visit.points);
      stats.potAttempts += isPot ? 1 : 0;
      stats.potsMade += isPot && visit.success ? 1 : 0;
      stats.safetyAttempts += isSafety ? 1 : 0;
      stats.safetiesWon += isSafety && visit.success ? 1 : 0;
      stats.fouls += visit.foulOccurred ? 1 : 0;
      return stats;
    }, createEmptyLiveMatchStats());
}

function createEmptyTournamentProgress(): TournamentProgressState {
  return {
    tournamentId: null,
    currentRound: null,
    draw: [],
    rankingBaseline: {},
    completedRounds: [],
  };
}

function normalizeLiveMatchState(
  liveMatch: LiveMatchState | null | undefined,
): LiveMatchState | null {
  if (!liveMatch) return null;

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
  };

  const sourceTableState =
    liveMatch.tableState ??
    createTableStateFromLegacyBallCount(liveMatch.ballsRemaining ?? 12);
  const normalizedTableState: LiveFrameTableState = {
    ...sourceTableState,
    ballOn: getBallOn(sourceTableState),
  };

  return {
    ...liveMatch,
    sessions: liveMatch.sessions ?? sessionPlan(liveMatch.bestOf),
    currentVisit: liveMatch.currentVisit ?? 1,
    tableState: normalizedTableState,
    ballsRemaining: getLegacyBallUnitsFromTableState(normalizedTableState),
    tacticalPlan: liveMatch.tacticalPlan ?? "Balanced",
    mentalFocus: liveMatch.mentalFocus ?? "Composed",
    tempo: liveMatch.tempo ?? "Steady",
    timeoutsRemaining: liveMatch.timeoutsRemaining ?? 2,
    lastFrameMode: liveMatch.lastFrameMode ?? null,
    lastTacticalNote:
      liveMatch.lastTacticalNote ??
      "Balanced plan is active for the next frame.",
    lastVisitSummary: liveMatch.lastVisitSummary ?? "Opening visit is ready.",
    opponentArchetype:
      liveMatch.opponentArchetype ??
      getOpponentArchetype(liveMatch.opponentName, liveMatch.opponentRanking),
    opponentApproach: liveMatch.opponentApproach ?? "Measured",
    tacticalEdge: liveMatch.tacticalEdge ?? 0,
    coachPrompt: liveMatch.coachPrompt ?? {
      title: "Stay on plan",
      note: "Balanced plan is active for the next frame.",
      recommendedPlan: "Balanced",
      recommendedMentalFocus: "Composed",
      recommendedTempo: "Steady",
    },
    lastOpponentAdjustment: liveMatch.lastOpponentAdjustment ?? null,
    opponentAdjustmentHistory: liveMatch.opponentAdjustmentHistory ?? [],
    visitHistory: liveMatch.visitHistory ?? [],
    frameTactics: liveMatch.frameTactics ?? [],
    playerStats:
      liveMatch.playerStats ??
      deriveLiveMatchStats(liveMatch.visitHistory ?? [], "Player"),
    opponentStats:
      liveMatch.opponentStats ??
      deriveLiveMatchStats(liveMatch.visitHistory ?? [], "Opponent"),
    playerVisitProfile: liveMatch.playerVisitProfile ?? defaultVisitProfile,
    opponentVisitProfile: liveMatch.opponentVisitProfile ?? defaultVisitProfile,
  };
}

function getFrameStartTableState(): LiveFrameTableState {
  return {
    redsRemaining: LIVE_FRAME_START_REDS,
    coloursRemaining: [...LIVE_ENDGAME_COLOURS],
    ballOn: "Red",
  };
}

function getLegacyBallUnitsFromTableState(tableState: LiveFrameTableState) {
  return tableState.redsRemaining + tableState.coloursRemaining.length;
}

function createTableStateFromLegacyBallCount(
  ballCount: number,
): LiveFrameTableState {
  const safeBallCount = clamp(
    Math.round(ballCount),
    0,
    LIVE_FRAME_START_REDS + LIVE_ENDGAME_COLOURS.length,
  );

  if (safeBallCount > LIVE_ENDGAME_COLOURS.length) {
    return {
      redsRemaining: safeBallCount - LIVE_ENDGAME_COLOURS.length,
      coloursRemaining: [...LIVE_ENDGAME_COLOURS],
      ballOn: "Red",
    };
  }

  return {
    redsRemaining: 0,
    coloursRemaining: LIVE_ENDGAME_COLOURS.slice(
      LIVE_ENDGAME_COLOURS.length - safeBallCount,
    ),
    ballOn: "Colours",
  };
}

function getBallOn(tableState: LiveFrameTableState) {
  return (
    tableState.ballOn ??
    (tableState.redsRemaining > 0 ? "Red" : "Colours")
  );
}

function getRemainingTablePointsFromState(tableState: LiveFrameTableState) {
  return (
    tableState.redsRemaining * 8 +
    (getBallOn(tableState) === "Colour" ? 7 : 0) +
    tableState.coloursRemaining.reduce(
      (total, colour) => total + LIVE_ENDGAME_COLOUR_POINTS[colour],
      0,
    )
  );
}

function getCurrentEndgameColour(tableState: LiveFrameTableState) {
  return tableState.coloursRemaining[0] ?? null;
}

function getFrameTableSummary(tableState: LiveFrameTableState) {
  if (tableState.redsRemaining > 0) {
    return `${tableState.redsRemaining} red${tableState.redsRemaining === 1 ? "" : "s"} plus colours remain`;
  }

  const currentColour = getCurrentEndgameColour(tableState);
  return currentColour
    ? `${currentColour.toLowerCase()} to black remain`
    : "Colours cleared";
}

function isRespottedBlackVisit(liveMatch: LiveMatchState) {
  return (
    liveMatch.tableState.redsRemaining === 0 &&
    liveMatch.tableState.coloursRemaining.length === 0 &&
    liveMatch.playerPoints === liveMatch.opponentPoints
  );
}

function getRemainingTablePoints(liveMatch: LiveMatchState) {
  return getRemainingTablePointsFromState(liveMatch.tableState);
}

function areSnookersRequired(
  trailingPoints: number,
  remainingTablePoints: number,
) {
  return trailingPoints > remainingTablePoints;
}

function hashStringToNumber(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }

  return Math.abs(hash);
}

function getOpponentArchetype(
  opponentName: string,
  opponentRank: number,
): LiveMatchOpponentArchetype {
  const seed = hashStringToNumber(`${opponentName}-${opponentRank}`);
  return LIVE_OPPONENT_ARCHETYPES[seed % LIVE_OPPONENT_ARCHETYPES.length];
}

function getOpponentArchetypeNote(
  opponentArchetype: LiveMatchOpponentArchetype,
) {
  if (opponentArchetype === "Serial Scorer")
    return "heavy scorer who backs break-building chances";
  if (opponentArchetype === "Tactical Grinder")
    return "safety-first grinder who likes low-risk frames";
  if (opponentArchetype === "Counter Puncher")
    return "measured counter-puncher who waits for loose entries";
  return "tempo disruptor who tries to make frames awkward and scrappy";
}

function getAutoOpponentVisitDecision(
  liveMatch: LiveMatchState,
): LiveVisitDecision {
  if (isRespottedBlackVisit(liveMatch)) return "Respotted Black";
  if (
    areSnookersRequired(
      liveMatch.playerPoints - liveMatch.opponentPoints,
      getRemainingTablePoints(liveMatch),
    ) &&
    liveMatch.tableState.redsRemaining === 0
  ) {
    return "Snooker Hunt";
  }
  if (liveMatch.currentBreak > 0) return "Break Build";
  if (liveMatch.opponentApproach === "Pressing") return "Break Build";
  if (liveMatch.opponentApproach === "Tight") return "Safety Exchange";
  if (
    liveMatch.opponentArchetype === "Tempo Disruptor" &&
    liveMatch.tableState.redsRemaining === 0
  )
    return "Safety Exchange";
  return "Pot Attempt";
}

function getDefaultManualVisitDecision(
  liveMatch: LiveMatchState,
): LiveVisitDecision {
  if (isRespottedBlackVisit(liveMatch)) return "Respotted Black";
  if (
    areSnookersRequired(
      liveMatch.opponentPoints - liveMatch.playerPoints,
      getRemainingTablePoints(liveMatch),
    ) &&
    liveMatch.tableState.redsRemaining === 0
  ) {
    return "Snooker Hunt";
  }
  if (liveMatch.currentBreak > 0) return "Break Build";
  if (liveMatch.tacticalPlan === "Attack") return "Break Build";
  if (liveMatch.tacticalPlan === "Safety") {
    const attackingReadiness =
      liveMatch.playerVisitProfile.longPotting * 0.35 +
      liveMatch.playerVisitProfile.cueBallControl * 0.25 +
      liveMatch.playerVisitProfile.composure * 0.2 +
      liveMatch.playerConfidence * 0.2 -
      Math.max(0, liveMatch.pressureValue - 55) * 0.15;
    const isClearAttackingChance =
      liveMatch.tableState.redsRemaining > 0 &&
      attackingReadiness >= 45 &&
      liveMatch.currentVisit % 3 === 0;

    if (liveMatch.currentBreak > 0) return "Break Build";
    if (isClearAttackingChance) return "Pot Attempt";
    return "Safety Exchange";
  }
  return "Pot Attempt";
}

export function getLiveTempoEffects(tempo: LiveMatchTempo) {
  if (tempo === "Deliberate") {
    return {
      playerShotModifier: -1.5,
      opponentShotModifier: -3,
      playerFatigueCost: 0.45,
      visitMinutes: 6,
    };
  }

  return {
    playerShotModifier: 0,
    opponentShotModifier: 0,
    playerFatigueCost: 0,
    visitMinutes: 4,
  };
}

function formatLiveClock(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function getLiveVisitRankBand(rank: number) {
  if (rank <= 1) return "World Champion";
  if (rank <= 4) return "Top 4";
  if (rank <= 16) return "Top 16";
  if (rank <= 32) return "Top 32";
  if (rank <= 64) return "Top 64";
  if (rank <= 80) return "Rookie Pro";
  if (rank <= 96) return "Q Tour";
  if (rank <= 128) return "Amateur";
  return "Youth";
}

function buildLiveVisitProfileFromAttributes(
  attributes: PlayerAttributes,
  equipmentBonus = 0,
): LiveVisitSkillProfile {
  return {
    longPotting: clamp(
      attributes.technical["Long Potting"] + Math.round(equipmentBonus * 0.2),
      1,
      100,
    ),
    breakBuilding: clamp(
      attributes.technical["Break Building"] +
        Math.round(equipmentBonus * 0.15),
      1,
      100,
    ),
    cueBallControl: clamp(
      attributes.technical["Cue Ball Control"] +
        Math.round(equipmentBonus * 0.25),
      1,
      100,
    ),
    safetyPlay: clamp(
      attributes.technical["Safety Play"] + Math.round(equipmentBonus * 0.1),
      1,
      100,
    ),
    consistency: attributes.technical.Consistency,
    composure: attributes.mental.Composure,
    focus: attributes.mental.Focus,
    bigMatchNerve: attributes.mental["Big Match Nerve"],
    handSteadiness: attributes.physical["Hand Steadiness"],
    stamina: attributes.physical.Stamina,
  };
}

function getLiveVisitTacticalPlan(
  visitProfile: LiveVisitSkillProfile,
): LiveMatchTacticalPlan {
  if (
    visitProfile.breakBuilding >= visitProfile.safetyPlay + 5 ||
    visitProfile.longPotting >= visitProfile.safetyPlay + 7
  ) {
    return "Attack";
  }

  if (
    visitProfile.safetyPlay >= visitProfile.breakBuilding + 5 ||
    visitProfile.focus >= visitProfile.longPotting + 6
  ) {
    return "Safety";
  }

  return "Balanced";
}

const LIVE_VISIT_RANK_BASELINES: Partial<
  Record<string, { technical: number; mental: number; physical: number }>
> = {
  Youth: { technical: 57, mental: 54, physical: 58 },
  Amateur: { technical: 63, mental: 60, physical: 61 },
  "Q Tour": { technical: 69, mental: 66, physical: 65 },
  "Rookie Pro": { technical: 74, mental: 70, physical: 68 },
  "Top 64": { technical: 79, mental: 75, physical: 71 },
  "Top 32": { technical: 83, mental: 79, physical: 73 },
  "Top 16": { technical: 88, mental: 84, physical: 76 },
  "Top 4": { technical: 91, mental: 87, physical: 79 },
  "World Champion": { technical: 94, mental: 91, physical: 82 },
  "Veteran Min Support": { technical: 80, mental: 76, physical: 67 },
};

function buildRankBasedLiveVisitAttributes(
  opponentRank: number,
  opponentStrength: number,
  opponentArchetype: LiveMatchOpponentArchetype,
  sourceRankBand?: string,
  useArchetypeBias = true,
): PlayerAttributes {
  const derivedRankBand = sourceRankBand ?? getLiveVisitRankBand(opponentRank);
  const baseline = LIVE_VISIT_RANK_BASELINES[derivedRankBand];
  const eliteFactor = clamp(Math.round((100 - opponentRank) * 0.45), 6, 44);
  const technicalBase = baseline
    ? clamp(
        baseline.technical +
          Math.round((opponentStrength - baseline.technical) * 0.25),
        42,
        94,
      )
    : clamp(Math.round(opponentStrength + eliteFactor * 0.16), 42, 94);
  const mentalBase = baseline
    ? clamp(
        baseline.mental +
          Math.round((opponentStrength - baseline.mental) * 0.18),
        40,
        93,
      )
    : clamp(Math.round(opponentStrength - 2 + eliteFactor * 0.12), 40, 93);
  const physicalBase = baseline
    ? clamp(
        baseline.physical +
          Math.round((opponentStrength - baseline.physical) * 0.12),
        38,
        90,
      )
    : clamp(Math.round(opponentStrength - 5 + eliteFactor * 0.08), 38, 90);
  const attributes: PlayerAttributes = {
    technical: {
      "Long Potting": technicalBase,
      "Break Building": clamp(technicalBase + 2, 1, 99),
      "Cue Ball Control": clamp(technicalBase - 1, 1, 99),
      "Safety Play": clamp(technicalBase, 1, 99),
      Consistency: clamp(technicalBase - 2, 1, 99),
    },
    mental: {
      Focus: mentalBase,
      Composure: clamp(mentalBase - 1, 1, 99),
      "Big Match Nerve": clamp(mentalBase + 1, 1, 99),
      Resilience: clamp(mentalBase - 1, 1, 99),
      Professionalism: clamp(mentalBase, 1, 99),
    },
    physical: {
      Stamina: physicalBase,
      "Recovery Rate": clamp(physicalBase - 2, 1, 99),
      Balance: clamp(physicalBase - 1, 1, 99),
      "Hand Steadiness": clamp(physicalBase - 1, 1, 99),
      "Shoulder Health": clamp(physicalBase - 2, 1, 99),
    },
  };

  if (!useArchetypeBias) {
    return attributes;
  }

  if (opponentArchetype === "Serial Scorer") {
    attributes.technical["Long Potting"] = clamp(
      attributes.technical["Long Potting"] + 7,
      1,
      99,
    );
    attributes.technical["Break Building"] = clamp(
      attributes.technical["Break Building"] + 9,
      1,
      99,
    );
    attributes.technical["Cue Ball Control"] = clamp(
      attributes.technical["Cue Ball Control"] + 4,
      1,
      99,
    );
    attributes.technical["Safety Play"] = clamp(
      attributes.technical["Safety Play"] - 5,
      1,
      99,
    );
  } else if (opponentArchetype === "Tactical Grinder") {
    attributes.technical["Safety Play"] = clamp(
      attributes.technical["Safety Play"] + 9,
      1,
      99,
    );
    attributes.mental.Focus = clamp(attributes.mental.Focus + 6, 1, 99);
    attributes.mental.Composure = clamp(attributes.mental.Composure + 5, 1, 99);
    attributes.technical["Break Building"] = clamp(
      attributes.technical["Break Building"] - 6,
      1,
      99,
    );
  } else if (opponentArchetype === "Counter Puncher") {
    attributes.technical["Cue Ball Control"] = clamp(
      attributes.technical["Cue Ball Control"] + 6,
      1,
      99,
    );
    attributes.technical.Consistency = clamp(
      attributes.technical.Consistency + 7,
      1,
      99,
    );
    attributes.mental.Focus = clamp(attributes.mental.Focus + 5, 1, 99);
    attributes.technical["Break Building"] = clamp(
      attributes.technical["Break Building"] - 2,
      1,
      99,
    );
  } else {
    attributes.technical["Safety Play"] = clamp(
      attributes.technical["Safety Play"] + 5,
      1,
      99,
    );
    attributes.physical["Hand Steadiness"] = clamp(
      attributes.physical["Hand Steadiness"] + 5,
      1,
      99,
    );
    attributes.mental.Focus = clamp(attributes.mental.Focus + 4, 1, 99);
    attributes.technical["Long Potting"] = clamp(
      attributes.technical["Long Potting"] - 2,
      1,
      99,
    );
  }

  return attributes;
}

export function buildLiveVisitProfile(inputProfile: {
  side: "player" | "opponent";
  name: string;
  sourceKind: "attributes" | "rankBased";
  attributes: PlayerAttributes;
  confidence: number;
  fatigue: number;
  equipmentBonus: number;
  sourceRankBand: string;
  tacticalPlan?: "Attack" | "Balanced" | "Safety";
  startsFrameProbability?: number;
  initialMomentum?: number;
}): ConstructedLiveVisitProfile {
  const technicalAverage = calculateTechnicalAverage(
    inputProfile.attributes.technical,
  );
  const mentalAverage = calculateAverage(
    Object.values(inputProfile.attributes.mental),
  );
  const physicalAverage = calculateAverage(
    Object.values(inputProfile.attributes.physical),
  );
  const visitProfile = buildLiveVisitProfileFromAttributes(
    inputProfile.attributes,
    inputProfile.equipmentBonus,
  );
  const tacticalPlan =
    inputProfile.tacticalPlan ?? getLiveVisitTacticalPlan(visitProfile);
  const pressureHandling = Math.round(
    (visitProfile.bigMatchNerve + visitProfile.composure + visitProfile.focus) /
      3,
  );
  const potting = Math.round(
    (visitProfile.longPotting +
      visitProfile.cueBallControl +
      visitProfile.handSteadiness) /
      3,
  );
  const tacticalRating = Math.round(
    (visitProfile.safetyPlay +
      visitProfile.cueBallControl +
      visitProfile.focus +
      visitProfile.composure) /
      4,
  );
  const errorRate = clamp(
    Math.round(
      100 -
        (visitProfile.consistency * 0.45 +
          visitProfile.focus * 0.35 +
          visitProfile.composure * 0.2),
    ),
    2,
    60,
  );
  const constructedStrength = calculateMatchStrength({
    technical: technicalAverage,
    mental: mentalAverage,
    physical: physicalAverage,
    confidence: inputProfile.confidence,
    fatigue: inputProfile.fatigue,
    equipmentBonus: inputProfile.equipmentBonus,
  });

  return {
    side: inputProfile.side,
    name: inputProfile.name,
    sourceKind: inputProfile.sourceKind,
    sourceRankBand: inputProfile.sourceRankBand,
    overall: Math.round(
      (technicalAverage + mentalAverage + physicalAverage) / 3,
    ),
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
  };
}

function createSeededLiveMatchRandom(seed: number) {
  let current = seed >>> 0;

  return () => {
    current += 0x6d2b79f5;
    let value = current;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function withSeededLiveMatchRandom<T>(seed: number, callback: () => T) {
  const originalRandom = Math.random;
  Math.random = createSeededLiveMatchRandom(seed);

  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}

function getSyntheticLiveMatchRound(bestOf: number): TournamentRound {
  if (bestOf <= 7) return "Last 16";
  if (bestOf <= 11) return "Quarter Final";
  if (bestOf <= 19) return "Semi Final";
  return "Final";
}

export function simulateCareerFrameOutcome(
  playerFrameWinChance: number,
  playerStrength: number,
  opponentStrength: number,
  forcedWinner: boolean | null = null,
): SimulatedFrameOutcome {
  const playerWonFrame =
    forcedWinner ?? Math.random() * 100 < playerFrameWinChance;
  const winningStrength = playerWonFrame ? playerStrength : opponentStrength;
  const losingStrength = playerWonFrame ? opponentStrength : playerStrength;
  const getFrameBreak = (strength: number, wonFrame: boolean) => {
    const centuryRunChance = clamp((strength - 62) * 0.012, 0, 0.4);
    const highRunBonus =
      Math.random() < centuryRunChance ? 18 + Math.random() * 45 : 0;
    const winnerAdjustment = wonFrame ? 5 : -7;
    return clamp(
      Math.round(
        8 +
          strength * 0.38 +
          Math.random() * 30 +
          highRunBonus +
          winnerAdjustment,
      ),
      wonFrame ? 12 : 0,
      147,
    );
  };
  const winningBreak = getFrameBreak(winningStrength, true);
  const winningPoints = clamp(
    Math.max(
      winningBreak,
      Math.round(32 + winningStrength * 0.4 + Math.random() * 38),
    ),
    45,
    147,
  );
  // These generated scores contain no simulated foul/free-ball awards.
  // Both players therefore share the same 147-point table budget.
  const losingCap = Math.max(0, Math.min(winningPoints - 5, 147 - winningPoints));
  const losingPoints = clamp(
    Math.round(Math.random() * Math.min(losingCap, 18 + losingStrength * 0.42)),
    0,
    losingCap,
  );
  const losingBreak =
    losingPoints > 0
      ? clamp(
          Math.min(getFrameBreak(losingStrength, false), losingPoints),
          0,
          losingPoints,
        )
      : 0;

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
      };
}

function buildCareerFrameOrder(
  playerWonMatch: boolean,
  framesNeeded: number,
  loserFrames: number,
): boolean[] {
  const frameOrder = Array<boolean>(framesNeeded + loserFrames).fill(
    playerWonMatch,
  );
  const loserFrameSlots = new Set<number>();

  while (loserFrameSlots.size < loserFrames) {
    loserFrameSlots.add(
      Math.floor(Math.random() * Math.max(1, frameOrder.length - 1)),
    );
  }

  loserFrameSlots.forEach((index) => {
    frameOrder[index] = !playerWonMatch;
  });
  frameOrder[frameOrder.length - 1] = playerWonMatch;

  return frameOrder;
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
  };
}

function recordSyntheticDecisionMetrics(
  sideMetrics: SyntheticLiveVisitSideMetrics,
  decision: LiveVisitDecision,
  success: boolean,
) {
  if (decision === "Pot Attempt") {
    sideMetrics.potAttempts += 1;
    if (success) sideMetrics.potSuccesses += 1;
    return;
  }

  if (decision === "Break Build") {
    sideMetrics.breakBuildAttempts += 1;
    if (success) sideMetrics.breakBuildSuccesses += 1;
    return;
  }

  if (decision === "Safety Exchange") {
    sideMetrics.safetyAttempts += 1;
    if (success) sideMetrics.safetySuccesses += 1;
    return;
  }

  if (decision === "Snooker Hunt") {
    sideMetrics.snookerHuntAttempts += 1;
    if (success) sideMetrics.snookerHuntSuccesses += 1;
    return;
  }

  sideMetrics.respottedBlackAttempts += 1;
  if (success) sideMetrics.respottedBlackSuccesses += 1;
}

function getSyntheticDefaultPressureValue(
  playerFrames: number,
  opponentFrames: number,
  framesNeeded: number,
) {
  return clamp(
    38 +
      Math.abs(playerFrames - opponentFrames) * 8 +
      (Math.max(playerFrames, opponentFrames) >= framesNeeded - 1 ? 18 : 0),
    24,
    96,
  );
}

function getSyntheticPressurePhase(
  liveMatch: Pick<
    LiveMatchState,
    "round" | "playerFrames" | "opponentFrames" | "framesNeeded"
  >,
): SyntheticLiveVisitFrameSummary["pressurePhase"] {
  if (
    liveMatch.round === "Final" &&
    Math.max(liveMatch.playerFrames, liveMatch.opponentFrames) >=
      liveMatch.framesNeeded - 3
  ) {
    return "Final";
  }

  if (
    liveMatch.playerFrames === liveMatch.framesNeeded - 1 &&
    liveMatch.opponentFrames === liveMatch.framesNeeded - 1
  ) {
    return "Decider";
  }

  if (
    Math.max(liveMatch.playerFrames, liveMatch.opponentFrames) >=
    liveMatch.framesNeeded - 2
  ) {
    return "Closing";
  }

  return "Standard";
}

function buildSyntheticFrameSummary(
  frameStartState: LiveMatchState,
  frameEndState: LiveMatchState,
  frameRow: FrameScoreRow,
  frameVisits: SyntheticLiveVisitVisitLogEntry[],
): SyntheticLiveVisitFrameSummary {
  const winner =
    frameRow.winner === frameStartState.playerName ? "Player" : "Opponent";
  const loser = winner === "Player" ? "Opponent" : "Player";
  const playerPoints = Number(frameRow.player);
  const opponentPoints = Number(frameRow.opponent);
  const margin = Math.abs(playerPoints - opponentPoints);
  const winnerVisits = frameVisits.filter((visit) => visit.actor === winner);
  const loserVisits = frameVisits.filter((visit) => visit.actor === loser);
  const keyBreak = winnerVisits.reduce(
    (best, visit) => Math.max(best, visit.breakTotal),
    0,
  );
  const firstScoringVisit = frameVisits.find((visit) => visit.points > 0);
  const firstScoreBy = firstScoringVisit?.actor ?? "None";

  let hadLeadChange = false;
  let winnerCameFromBehind = false;
  let leadState = 0;

  frameVisits.forEach((visit) => {
    const lead = Math.sign(visit.playerPointsAfter - visit.opponentPointsAfter);
    if (lead !== 0) {
      if (leadState !== 0 && leadState !== lead) {
        hadLeadChange = true;
      }
      leadState = lead;
    }

    if (
      (winner === "Player" && lead < 0) ||
      (winner === "Opponent" && lead > 0)
    ) {
      winnerCameFromBehind = true;
    }
  });

  const latePressureError = loserVisits.find(
    (visit) =>
      !visit.success &&
      (visit.pressureValue >= 72 || visit.actorFatigue >= 62) &&
      visit.visit >= Math.max(2, frameVisits.length - 2),
  );
  const forcedFoul = winnerVisits.find(
    (visit) => visit.decision === "Snooker Hunt" && visit.success,
  );
  const safetyWin = winnerVisits.find(
    (visit) => visit.decision === "Safety Exchange" && visit.success,
  );
  const openingBurst = winnerVisits.find(
    (visit) => visit.visit <= 2 && visit.breakTotal >= 30,
  );
  const closeFrame = margin <= 24;
  const keyMoments: string[] = [];

  if (openingBurst)
    keyMoments.push(
      `${winner} struck first with an early ${openingBurst.breakTotal} break.`,
    );
  if (keyBreak >= 40 && !openingBurst)
    keyMoments.push(
      `${winner} made the decisive scoring visit with a ${keyBreak} break.`,
    );
  if (forcedFoul)
    keyMoments.push(
      `${winner} forced foul points when the table tightened up.`,
    );
  if (safetyWin) keyMoments.push(`${winner} won the key safety exchange.`);
  if (winnerCameFromBehind)
    keyMoments.push(`${winner} recovered after trailing earlier in the frame.`);
  if (hadLeadChange)
    keyMoments.push("The lead changed hands before the colours.");
  if (latePressureError)
    keyMoments.push(`${loser} made a late mistake under pressure or fatigue.`);
  if (closeFrame && keyMoments.length === 0)
    keyMoments.push("The frame stayed close until the final colours.");

  let reason = `${winner} created the better scoring chances across the frame.`;
  if (openingBurst && latePressureError) {
    reason = `${winner} started quickly with a scoring burst and then punished a late pressure mistake.`;
  } else if (keyBreak >= 50) {
    reason = `${winner} took the frame with a heavy break that the other side could not answer.`;
  } else if (forcedFoul) {
    reason = `${winner} squeezed the frame with foul pressure and better composure late on.`;
  } else if (closeFrame && winnerCameFromBehind) {
    reason = `${winner} stole a close frame after trailing and handled the late pressure better.`;
  } else if (closeFrame) {
    reason = `${winner} held nerve better on a close set of colours.`;
  } else if (latePressureError) {
    reason = `${winner} took over after ${loser.toLowerCase()} made a fatigue or pressure error.`;
  } else if (safetyWin) {
    reason = `${winner} won the safety exchanges and converted the cleaner openings.`;
  } else if (openingBurst) {
    reason = `${winner} scored first and controlled the frame from there.`;
  }

  return {
    frameNumber: Number(frameRow.frame.replace("F", "")),
    winner,
    score: `${playerPoints}-${opponentPoints}`,
    playerPoints,
    opponentPoints,
    keyBreak,
    closeFrame,
    decidingFrame:
      frameStartState.playerFrames === frameStartState.framesNeeded - 1 &&
      frameStartState.opponentFrames === frameStartState.framesNeeded - 1,
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
  };
}

function getLiveVisitFatigueCost(
  activeProfile: LiveVisitSkillProfile,
  decision: LiveVisitDecision,
  baseCost: number,
) {
  const staminaRelief =
    activeProfile.stamina * 0.012 + activeProfile.handSteadiness * 0.004;
  const decisionLoad =
    decision === "Break Build"
      ? 0.22
      : decision === "Safety Exchange"
        ? -0.14
        : 0;
  return clamp((baseCost + decisionLoad - staminaRelief) * 0.68, 0.22, 1.55);
}

function getLiveVisitFrameFatigueCost(activeProfile: LiveVisitSkillProfile) {
  return clamp(
    (1.15 -
      activeProfile.stamina * 0.008 -
      activeProfile.handSteadiness * 0.004) *
      0.62,
    0.22,
    0.75,
  );
}

function getLiveVisitColourChoice(
  activeProfile: LiveVisitSkillProfile,
  decision: LiveVisitDecision,
) {
  const blackBias =
    activeProfile.breakBuilding +
    activeProfile.cueBallControl +
    activeProfile.focus;
  const roll = Math.random() * 100;

  if (decision === "Break Build") {
    if (blackBias >= 238 && roll < 68) return 7;
    if (blackBias >= 210 && roll < 54) return 7;
    if (roll < 26) return 7;
    if (roll < 54) return 6;
    if (roll < 76) return 5;
    return 4;
  }

  if (roll < 18 + activeProfile.cueBallControl * 0.18) return 7;
  if (roll < 42 + activeProfile.cueBallControl * 0.12) return 6;
  if (roll < 64) return 5;
  if (roll < 82) return 4;
  return 2 + Math.floor(Math.random() * 3);
}

function getLiveVisitRedClearance(
  activeProfile: LiveVisitSkillProfile,
  decision: LiveVisitDecision,
  retainedTable: boolean,
  redsRemaining: number,
) {
  if (
    redsRemaining <= 0 ||
    decision === "Safety Exchange" ||
    decision === "Snooker Hunt" ||
    decision === "Respotted Black"
  )
    return 0;
  if (decision === "Pot Attempt") return 1;

  const scoringCeiling =
    activeProfile.breakBuilding * 0.45 +
    activeProfile.cueBallControl * 0.25 +
    activeProfile.consistency * 0.18 +
    activeProfile.focus * 0.12;
  const baseClearance =
    scoringCeiling >= 80
      ? 4
      : scoringCeiling >= 70
        ? 3
        : scoringCeiling >= 60
          ? 2
          : 1;
  const extraClearance =
    retainedTable && Math.random() * 100 < Math.max(0, scoringCeiling - 62)
      ? 1
      : 0;

  return Math.min(redsRemaining, baseClearance + extraClearance);
}

function getLiveScoringSuccessBaseline(
  activeProfile: LiveVisitSkillProfile,
  decision: LiveVisitDecision,
) {
  const skill =
    decision === "Break Build"
      ? activeProfile.breakBuilding * 0.34 +
        activeProfile.cueBallControl * 0.28 +
        activeProfile.consistency * 0.2 +
        activeProfile.focus * 0.1 +
        activeProfile.stamina * 0.08
      : decision === "Pot Attempt" || decision === "Respotted Black"
        ? activeProfile.longPotting * 0.34 +
          activeProfile.cueBallControl * 0.24 +
          activeProfile.consistency * 0.18 +
          activeProfile.handSteadiness * 0.14 +
          activeProfile.composure * 0.1
        : activeProfile.safetyPlay * 0.36 +
          activeProfile.focus * 0.22 +
          activeProfile.composure * 0.18 +
          activeProfile.cueBallControl * 0.14 +
          activeProfile.bigMatchNerve * 0.1;

  return clamp(35 + skill * 0.62, 55, 94);
}

function getLiveBreakContinuationChance(
  activeProfile: LiveVisitSkillProfile,
  decision: LiveVisitDecision,
  fatigue: number,
  pressureValue: number,
) {
  if (decision !== "Break Build" && decision !== "Pot Attempt") return 0;

  const control =
    activeProfile.breakBuilding * 0.38 +
    activeProfile.cueBallControl * 0.3 +
    activeProfile.consistency * 0.2 +
    activeProfile.focus * 0.12;
  const base = decision === "Break Build" ? 55 : 38;
  return clamp(
    base +
      control * 0.42 -
      Math.max(0, fatigue - 45) * 0.12 -
      Math.max(0, pressureValue - 68) * 0.08,
    decision === "Break Build" ? 66 : 46,
    decision === "Break Build" ? 94 : 76,
  );
}

function getRealisticMatchSuccessRate(
  profile: LiveVisitSkillProfile,
  discipline: "pot" | "long" | "safety",
  stats: LiveMatchSideStats,
  confidence: number,
  fatigue: number,
) {
  const skill =
    discipline === "pot"
      ? profile.breakBuilding * 0.24 +
        profile.cueBallControl * 0.28 +
        profile.consistency * 0.22 +
        profile.longPotting * 0.14 +
        profile.handSteadiness * 0.12
      : discipline === "long"
        ? profile.longPotting * 0.48 +
          profile.cueBallControl * 0.18 +
          profile.consistency * 0.18 +
          profile.composure * 0.16
        : profile.safetyPlay * 0.46 +
          profile.focus * 0.2 +
          profile.composure * 0.18 +
          profile.cueBallControl * 0.16;
  const base =
    discipline === "pot" ? 35 + skill * 0.62 : 27 + skill * 0.62;
  const attempts =
    discipline === "safety" ? stats.safetyAttempts : stats.potAttempts;
  const successes =
    discipline === "safety" ? stats.safetiesWon : stats.potsMade;
  const observed = attempts > 0 ? (successes / attempts) * 100 : base;
  const observedWeight = clamp(attempts / 40, 0, 0.28);
  const conditionAdjustment =
    (confidence - 65) * 0.05 - Math.max(0, fatigue - 35) * 0.05;

  return clamp(
    Math.round(
      base * (1 - observedWeight) +
        observed * observedWeight +
        conditionAdjustment,
    ),
    discipline === "pot" ? 52 : 38,
    discipline === "pot" ? 96 : 92,
  );
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
    ballOn: getBallOn(tableState),
  };
  let scoredPoints = 0;
  let tableProgressLabel: string;

  if (decision === "Snooker Hunt") {
    scoredPoints = clamp(4 + Math.round(Math.random() * 3), 4, 7);
    tableProgressLabel = `forced ${scoredPoints} foul points`;
    return { scoredPoints, nextTableState, tableProgressLabel };
  }

  if (decision === "Respotted Black") {
    scoredPoints = 7;
    tableProgressLabel = "potted the respotted black";
    return { scoredPoints, nextTableState, tableProgressLabel };
  }

  if (decision === "Safety Exchange") {
    tableProgressLabel = "left the cue ball safe";
    return { scoredPoints, nextTableState, tableProgressLabel };
  }

  if (tableState.redsRemaining > 0) {
    const redsCleared = getLiveVisitRedClearance(
      activeProfile,
      decision,
      retainedTable,
      tableState.redsRemaining,
    );
    const colourScores = Array.from({ length: redsCleared }).map(() =>
      getLiveVisitColourChoice(activeProfile, decision),
    );
    scoredPoints =
      redsCleared + colourScores.reduce((total, value) => total + value, 0);
    nextTableState.redsRemaining = Math.max(
      0,
      nextTableState.redsRemaining - redsCleared,
    );
    nextTableState.ballOn =
      nextTableState.redsRemaining > 0 ? "Red" : "Colours";
    tableProgressLabel =
      redsCleared > 0
        ? `made ${scoredPoints} from ${redsCleared} red${redsCleared === 1 ? "" : "s"} and colour${redsCleared === 1 ? "" : "s"}`
        : "could not open the scoring chance";

    if (
      retainedTable &&
      nextTableState.redsRemaining === 0 &&
      nextTableState.coloursRemaining.length > 0 &&
      decision === "Break Build"
    ) {
      const colourRun = Math.min(
        nextTableState.coloursRemaining.length,
        activeProfile.breakBuilding >= 84
          ? 3
          : activeProfile.breakBuilding >= 72
            ? 2
            : 1,
      );
      const pottedColours = nextTableState.coloursRemaining.slice(0, colourRun);
      scoredPoints += pottedColours.reduce(
        (total, colour) => total + LIVE_ENDGAME_COLOUR_POINTS[colour],
        0,
      );
      nextTableState.coloursRemaining = nextTableState.coloursRemaining.slice(
        pottedColours.length,
      );
      tableProgressLabel += `, then cleared ${pottedColours.map((colour) => colour.toLowerCase()).join(", ")}`;
    }

    return { scoredPoints, nextTableState, tableProgressLabel };
  }

  const colourRun =
    decision === "Break Build"
      ? Math.min(
          nextTableState.coloursRemaining.length,
          activeProfile.breakBuilding >= 84 && retainedTable
            ? 4
            : retainedTable
              ? 2
              : 1,
        )
      : 1;
  const pottedColours = nextTableState.coloursRemaining.slice(0, colourRun);
  scoredPoints = pottedColours.reduce(
    (total, colour) => total + LIVE_ENDGAME_COLOUR_POINTS[colour],
    0,
  );
  nextTableState.coloursRemaining = nextTableState.coloursRemaining.slice(
    pottedColours.length,
  );
  nextTableState.ballOn = "Colours";
  tableProgressLabel =
    pottedColours.length > 0
      ? `cleared ${pottedColours.map((colour) => colour.toLowerCase()).join(", ")}`
      : "cleared the table";

  return { scoredPoints, nextTableState, tableProgressLabel };
}

function resolveLiveShotScoring(
  activeProfile: LiveVisitSkillProfile,
  decision: LiveVisitDecision,
  tableState: LiveFrameTableState,
) {
  const nextTableState: LiveFrameTableState = {
    redsRemaining: tableState.redsRemaining,
    coloursRemaining: [...tableState.coloursRemaining],
    ballOn: getBallOn(tableState),
  };

  if (decision === "Snooker Hunt") {
    const scoredPoints = clamp(4 + Math.round(Math.random() * 3), 4, 7);
    return {
      scoredPoints,
      nextTableState,
      tableProgressLabel: `forced ${scoredPoints} foul points`,
    };
  }

  if (decision === "Respotted Black") {
    return {
      scoredPoints: 7,
      nextTableState,
      tableProgressLabel: "potted the respotted black",
    };
  }

  if (decision === "Safety Exchange") {
    return {
      scoredPoints: 0,
      nextTableState,
      tableProgressLabel: "left the cue ball safe",
    };
  }

  if (getBallOn(tableState) === "Colour") {
    const scoredPoints = getLiveVisitColourChoice(activeProfile, decision);
    nextTableState.ballOn =
      nextTableState.redsRemaining > 0 ? "Red" : "Colours";
    return {
      scoredPoints,
      nextTableState,
      tableProgressLabel: `potted the ${getLiveColourName(scoredPoints)}`,
    };
  }

  if (tableState.redsRemaining > 0) {
    nextTableState.redsRemaining -= 1;
    nextTableState.ballOn = "Colour";
    return {
      scoredPoints: 1,
      nextTableState,
      tableProgressLabel: "potted a red",
    };
  }

  const colour = nextTableState.coloursRemaining[0];
  if (!colour) {
    return {
      scoredPoints: 0,
      nextTableState,
      tableProgressLabel: "cleared the table",
    };
  }

  const scoredPoints = LIVE_ENDGAME_COLOUR_POINTS[colour];
  nextTableState.coloursRemaining = nextTableState.coloursRemaining.slice(1);
  nextTableState.ballOn = "Colours";
  return {
    scoredPoints,
    nextTableState,
    tableProgressLabel: `potted the ${colour.toLowerCase()}`,
  };
}

function getLiveColourName(points: number) {
  if (points === 2) return "yellow";
  if (points === 3) return "green";
  if (points === 4) return "brown";
  if (points === 5) return "blue";
  if (points === 6) return "pink";
  return "black";
}

function getSyntheticCalibrationVisitDecision(
  liveMatch: LiveMatchState,
  tacticalPlanOverride?: LiveMatchTacticalPlan,
): LiveVisitDecision {
  const actorIsPlayer = liveMatch.playerAtTable === liveMatch.playerName;
  const activeProfile = actorIsPlayer
    ? liveMatch.playerVisitProfile
    : liveMatch.opponentVisitProfile;
  const actorPoints = actorIsPlayer
    ? liveMatch.playerPoints
    : liveMatch.opponentPoints;
  const defendingPoints = actorIsPlayer
    ? liveMatch.opponentPoints
    : liveMatch.playerPoints;
  const tacticalPlan =
    tacticalPlanOverride ?? getLiveVisitTacticalPlan(activeProfile);

  if (isRespottedBlackVisit(liveMatch)) return "Respotted Black";
  if (
    areSnookersRequired(
      defendingPoints - actorPoints,
      getRemainingTablePoints(liveMatch),
    ) &&
    liveMatch.tableState.redsRemaining === 0
  ) {
    return "Snooker Hunt";
  }

  if (liveMatch.tableState.redsRemaining === 0 && tacticalPlan === "Safety") {
    return "Safety Exchange";
  }

  if (liveMatch.currentBreak > 0) return "Break Build";

  if (tacticalPlan === "Attack" && liveMatch.tableState.redsRemaining > 0) {
    return "Break Build";
  }

  if (liveMatch.pressureValue >= 64 && tacticalPlan === "Safety") {
    return "Safety Exchange";
  }

  return "Pot Attempt";
}

function resolveCareerMatchResult(
  matchWinChance: number,
  framesNeeded: number,
): CareerMatchResolution {
  const playerWonMatch = Math.random() * 100 < matchWinChance;
  const dominance = Math.abs(matchWinChance - 50) / 50;
  const closeness = 1 - dominance;
  const expectedLoserFrames = (framesNeeded - 1) * (0.2 + closeness * 0.65);
  const volatility = Math.max(0.6, (framesNeeded - 1) * 0.18);
  const loserFrames = clamp(
    Math.round(expectedLoserFrames + (Math.random() - 0.5) * volatility * 2),
    0,
    framesNeeded - 1,
  );

  return {
    playerWonMatch,
    loserFrames,
    frameOrder: buildCareerFrameOrder(
      playerWonMatch,
      framesNeeded,
      loserFrames,
    ),
  };
}

let liveFeedSequence = 0;

function buildVisitFeedEntry(
  time: string,
  text: string,
  actor: LiveVisitActor | "System",
  tone: "green" | "amber" | "red" | "blue",
): LiveFeedItem {
  return {
    id: `feed-visit-${Date.now()}-${Math.floor(Math.random() * 1000)}-${liveFeedSequence++}`,
    time,
    text,
    actor,
    tone,
  };
}

function buildRealisticVisitFeedText(input: {
  actorName: string;
  opponentName: string;
  decision: LiveVisitDecision;
  foulOccurred: boolean;
  foulPoints: number;
  success: boolean;
  scoredPoints: number;
  previousBreak: number;
  completedBreakTotal: number;
  retainedTable: boolean;
  tableProgressLabel: string;
  redsRemaining: number;
  deliberateRhythmPressure: number;
  ballOn: "Red" | "Colour" | "Colours";
}) {
  const {
    actorName,
    opponentName,
    decision,
    foulOccurred,
    foulPoints,
    success,
    scoredPoints,
    previousBreak,
    completedBreakTotal,
    retainedTable,
    tableProgressLabel,
    redsRemaining,
    deliberateRhythmPressure,
    ballOn,
  } = input;
  const nextBall =
    ballOn === "Red"
      ? "red"
      : ballOn === "Colour"
        ? "nominated colour"
        : "colour";
  const tableProgress = tableProgressLabel
    ? tableProgressLabel.replace(/^made /, "")
    : `${scoredPoints} points`;
  const rhythmNote =
    deliberateRhythmPressure > 0
      ? " The deliberate pace disrupts the opponent's rhythm."
      : "";

  if (foulOccurred) {
    const breakNote = previousBreak > 0 ? ` Break ends at ${previousBreak}.` : "";
    return `Foul by ${actorName}: ${foulPoints} points conceded.${breakNote} ${opponentName} comes to the table.`;
  }

  if (decision === "Safety Exchange") {
    return success
      ? `${actorName} plays a containing safety. ${opponentName} must respond.${rhythmNote}`
      : `${actorName}'s safety leaves a chance. ${opponentName} comes to the table.`;
  }

  if (decision === "Snooker Hunt") {
    return success
      ? `${actorName} lays a snooker and forces a ${scoredPoints}-point foul. ${opponentName} returns to the table.${rhythmNote}`
      : `${actorName} cannot find the snooker. ${opponentName} comes to the table.`;
  }

  if (!success) {
    return previousBreak > 0
      ? `${actorName}'s break ends at ${previousBreak} after missing the next ${nextBall}. ${opponentName} comes to the table.`
      : `${actorName} misses the opening ${nextBall}. ${opponentName} comes to the table.`;
  }

  if (decision === "Respotted Black") {
    return `${actorName} pots the respotted black to decide the frame.`;
  }

  const redsNote =
    redsRemaining > 0
      ? ` ${redsRemaining} red${redsRemaining === 1 ? " remains" : "s remain"}.`
      : " The colours remain.";
  if (retainedTable) {
    const opening =
      previousBreak > 0
        ? `${actorName}'s break reaches ${completedBreakTotal}`
        : `${actorName} starts a break of ${completedBreakTotal}`;
    return `${opening}: ${tableProgress}.${redsNote}${rhythmNote}`;
  }

  return `${actorName}'s break ends at ${completedBreakTotal}: ${tableProgress}. ${opponentName} comes to the table.${rhythmNote}`;
}

function playOutLiveFrame(
  liveMatch: LiveMatchState,
  mode: LiveMatchResolutionMode,
): LiveMatchState {
  let nextLiveMatch = liveMatch;
  const startingFrame = liveMatch.currentFrame;
  let guard = 0;

  while (
    nextLiveMatch.status === "In Progress" &&
    !pendingMatchBreak(nextLiveMatch) &&
    nextLiveMatch.currentFrame === startingFrame &&
    guard < 60
  ) {
    const decision =
      nextLiveMatch.playerAtTable === nextLiveMatch.playerName &&
      mode === "manual"
        ? getDefaultManualVisitDecision(nextLiveMatch)
        : undefined;
    nextLiveMatch = advanceLiveVisit(nextLiveMatch, decision, mode);
    guard += 1;
  }

  return nextLiveMatch;
}

function buildPlayerLiveVisitProfile(state: GameState): LiveVisitSkillProfile {
  state = { ...state, attributes: effectiveCareerAttributes(state, state.attributes) };
  return buildLiveVisitProfile({
    side: "player",
    name: state.player.fullName,
    sourceKind: "attributes",
    attributes: state.attributes,
    confidence: state.player.confidence,
    fatigue: state.player.fatigue,
    equipmentBonus: getCurrentCueBonus(state.equipment),
    sourceRankBand:
      state.player.worldRanking != null
        ? getLiveVisitRankBand(state.player.worldRanking)
        : "Player",
  }).visitProfile;
}

function buildOpponentLiveVisitProfile(
  opponentRank: number,
  opponentStrength: number,
  opponentArchetype: LiveMatchOpponentArchetype,
  confidence = 62,
  fatigue = 18,
  equipmentBonus = 0,
): LiveVisitSkillProfile {
  const sourceRankBand = getLiveVisitRankBand(opponentRank);
  return buildLiveVisitProfile({
    side: "opponent",
    name: `Rank ${opponentRank} Opponent`,
    sourceKind: "rankBased",
    attributes: buildRankBasedLiveVisitAttributes(
      opponentRank,
      opponentStrength,
      opponentArchetype,
      sourceRankBand,
    ),
    confidence,
    fatigue,
    equipmentBonus,
    sourceRankBand,
  }).visitProfile;
}

function getLiveMatchCoachPrompt(
  liveMatch: Pick<
    LiveMatchState,
    | "playerFrames"
    | "opponentFrames"
    | "pressureValue"
    | "playerFatigue"
    | "opponentApproach"
    | "tacticalPlan"
    | "mentalFocus"
    | "tempo"
  >,
  coachName?: string | null,
): LiveMatchCoachPrompt {
  const prefix = coachName ? `${coachName} says` : "Coach note";

  if (liveMatch.pressureValue >= 72 || liveMatch.playerFatigue >= 68) {
    return {
      title: "Settle The Table",
      note: `${prefix} slow the pace, tighten the safety exchange, and make the opponent earn first chances.`,
      recommendedPlan: "Safety",
      recommendedMentalFocus: "Composed",
      recommendedTempo: "Steady",
    };
  }

  if (liveMatch.playerFrames < liveMatch.opponentFrames) {
    return {
      title: "Change Momentum",
      note: `${prefix} lean into quick counter-punching before the opponent settles into a measured rhythm.`,
      recommendedPlan: "Attack",
      recommendedMentalFocus: "Counter",
      recommendedTempo: "Quick",
    };
  }

  if (liveMatch.opponentApproach === "Tight") {
    return {
      title: "Keep The Heat On",
      note: `${prefix} stay positive and force the tight opponent to take on awkward openers.`,
      recommendedPlan: "Attack",
      recommendedMentalFocus: "Confident",
      recommendedTempo: "Steady",
    };
  }

  return {
    title: "Hold Shape",
    note: `${prefix} keep the frame tidy and deny easy counters with a balanced structure.`,
    recommendedPlan: "Balanced",
    recommendedMentalFocus: "Composed",
    recommendedTempo: "Steady",
  };
}

function getLiveMatchOpponentApproach(
  liveMatch: Pick<
    LiveMatchState,
    | "playerFrames"
    | "opponentFrames"
    | "opponentConfidence"
    | "opponentFatigue"
    | "pressureValue"
    | "opponentArchetype"
  >,
): LiveMatchOpponentApproach {
  if (liveMatch.opponentFatigue >= 68) {
    return "Tight";
  }

  if (
    liveMatch.opponentFrames < liveMatch.playerFrames &&
    liveMatch.opponentConfidence >= 56
  ) {
    return liveMatch.opponentArchetype === "Tactical Grinder"
      ? "Measured"
      : "Pressing";
  }

  if (liveMatch.pressureValue >= 78) {
    return liveMatch.opponentArchetype === "Serial Scorer"
      ? "Measured"
      : "Tight";
  }

  if (liveMatch.opponentArchetype === "Serial Scorer") return "Pressing";
  if (liveMatch.opponentArchetype === "Tactical Grinder") return "Tight";
  if (liveMatch.opponentArchetype === "Tempo Disruptor")
    return liveMatch.opponentConfidence >= 64 ? "Measured" : "Tight";
  return "Measured";
}

function getTacticalMatchupEdge(
  plan: LiveMatchTacticalPlan,
  opponentApproach: LiveMatchOpponentApproach,
) {
  if (
    (plan === "Safety" && opponentApproach === "Pressing") ||
    (plan === "Attack" && opponentApproach === "Tight") ||
    (plan === "Balanced" && opponentApproach === "Measured")
  ) {
    return 4;
  }
  if (
    (plan === "Attack" && opponentApproach === "Measured") ||
    (plan === "Safety" && opponentApproach === "Tight")
  ) {
    return 1;
  }
  return -3;
}

function getSyntheticTacticalStyleEdge(
  playerPlan: LiveMatchTacticalPlan,
  opponentPlan: LiveMatchTacticalPlan,
) {
  if (playerPlan === opponentPlan) {
    return 0;
  }

  if (
    (playerPlan === "Safety" && opponentPlan === "Attack") ||
    (playerPlan === "Attack" && opponentPlan === "Balanced") ||
    (playerPlan === "Balanced" && opponentPlan === "Safety")
  ) {
    return 1.4;
  }

  return -1.4;
}

function buildOpponentAdjustmentEvent(params: {
  previousApproach: LiveMatchOpponentApproach;
  nextApproach: LiveMatchOpponentApproach;
  frameLabel: string;
  nextPlayerFrames: number;
  nextOpponentFrames: number;
  pressureValue: number;
  trigger?: "Frame Swing" | "Timeout" | "Pressure";
}) {
  const {
    previousApproach,
    nextApproach,
    frameLabel,
    nextPlayerFrames,
    nextOpponentFrames,
    pressureValue,
  } = params;
  const trigger =
    params.trigger ?? (pressureValue >= 78 ? "Pressure" : "Frame Swing");

  if (previousApproach === nextApproach && trigger !== "Timeout") {
    return null;
  }

  const note =
    trigger === "Timeout"
      ? `The opponent reset after the stoppage and shifted from ${previousApproach.toLowerCase()} to ${nextApproach.toLowerCase()}.`
      : trigger === "Pressure"
        ? `Under heavy scoreboard pressure, the opponent moved from ${previousApproach.toLowerCase()} to ${nextApproach.toLowerCase()}.`
        : nextOpponentFrames > nextPlayerFrames
          ? `With the lead in hand, the opponent changed from ${previousApproach.toLowerCase()} to ${nextApproach.toLowerCase()}.`
          : `After the swing in score, the opponent changed from ${previousApproach.toLowerCase()} to ${nextApproach.toLowerCase()}.`;

  return {
    title: `${nextApproach} adjustment`,
    note,
    trigger,
    fromApproach: previousApproach,
    toApproach: nextApproach,
    frameLabel,
  } satisfies LiveMatchOpponentAdjustment;
}

export function shuffleInPlace<T>(items: T[], random = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
  return items;
}

function getBracketSeedOrder(fieldSize: number): number[] {
  if (fieldSize <= 2) return [1, 2];
  const previousOrder = getBracketSeedOrder(fieldSize / 2);
  return previousOrder.flatMap((seed) => [seed, fieldSize + 1 - seed]);
}

function getConfiguredEntryRoundForRank(
  tournament: Tournament,
  playerRank: number,
  rounds = getTournamentRounds(tournament),
) {
  const format = resolveTournamentFormat(tournament);
  const findRound = (pattern: RegExp) =>
    rounds.find((round) => pattern.test(round));

  if (format.entryTiers) return format.entryTiers.find(tier => playerRank <= tier.through)?.round ?? rounds[0];

  if (format.id === "shanghaiMasters") {
    return playerRank <= 8 ? (findRound(/last\s*16/i) ?? rounds[0]) : rounds[0];
  }
  if (isMajorQualifying(tournament)) {
    return playerRank <= 48 ? rounds[2] ?? rounds[0] : playerRank <= 80 ? rounds[1] ?? rounds[0] : rounds[0];
  }
  if (format.id === "saudiArabiaMasters") {
    if (playerRank <= 16)
      return findRound(/last\s*32/i) ?? rounds.at(-5) ?? rounds[0];
    if (playerRank <= 48) return findRound(/^round\s*3$/i) ?? rounds[0];
    if (playerRank <= 80) return findRound(/^round\s*2$/i) ?? rounds[0];
    return rounds[0];
  }

  if (format.id === "riyadhSeasonChampionship") {
    if (playerRank <= 6) return findRound(/^quarter\s*final$/i) ?? rounds[0];
    if (playerRank <= 8)
      return findRound(/quarter\s*final\s*play-in/i) ?? rounds[0];
    return rounds[0];
  }

  if (format.id === "tourChampionshipTop8") {
    return playerRank <= 4
      ? (findRound(/^quarter\s*final$/i) ?? rounds[0])
      : rounds[0];
  }

  const numberWords: Record<string, number> = {
    four: 4,
    eight: 8,
    ten: 10,
    twelve: 12,
    sixteen: 16,
    "thirty two": 32,
    "sixty four": 64,
  };
  const parseSeedCount = (value: string) =>
    Number(value) || numberWords[value.toLowerCase().replace(/-/g, " ")] || 0;

  const seededEntry = format.seedingModel.match(
    /top\s+(\d+|four|eight|ten|twelve|sixteen|thirty[- ]two|sixty[- ]four)(?:\s+seeds?)?.*?enter(?:s|ed)?(?:\s+at|\s+in|\s+into)?\s+(last\s+\d+)/i,
  );
  if (seededEntry && playerRank <= parseSeedCount(seededEntry[1])) {
    const target = normalizeTournamentRoundLabel(seededEntry[2]);
    return (
      rounds.find((round) => normalizeTournamentRoundLabel(round) === target) ??
      rounds[0]
    );
  }

  return rounds[0];
}

function createBracketPlayer(
  name: string,
  rank: number,
  nation: string,
  highlighted = false,
): BracketPlayer {
  return {
    name,
    rank,
    nation,
    highlighted,
  };
}

function createEmptyBracketPlayer(): BracketPlayer {
  return createBracketPlayer("TBD", 0, "");
}

function cloneBracketRounds(rounds: BracketRound[]): BracketRound[] {
  return rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => ({
      ...match,
      top: { ...match.top },
      bottom: { ...match.bottom },
    })),
  }));
}

function findPlayerBracketMatch(
  rounds: BracketRound[],
  roundLabel: TournamentRound,
  playerName: string,
) {
  const round = rounds.find((item) => item.label === roundLabel);
  if (!round) return null;
  if (isGroupDraw(rounds)) return nextGroupFixture(rounds, roundLabel, playerName);
  return (
    round.matches.find(
      (match) =>
        match.top.name === playerName || match.bottom.name === playerName,
    ) ?? null
  );
}

function getBracketMatchWinner(
  match: BracketRound["matches"][number],
): BracketPlayer | null {
  if (
    typeof match.top.score !== "number" ||
    typeof match.bottom.score !== "number"
  ) {
    return null;
  }

  return match.top.score > match.bottom.score
    ? { ...match.top, score: undefined }
    : { ...match.bottom, score: undefined };
}

function buildTournamentDrawField(
  state: GameState,
  tournament: Tournament,
  fieldSize: number,
  includePlayer = true,
): BracketPlayer[] {
  let liveRows = getCompetitionRowsForTournament(state, tournament);
  let selectedPathwayNames: string[] | undefined;
  if (tournament.type === 'Q Tour' && /play.off/i.test(tournament.name)) selectedPathwayNames = qTourQualification(state, tournament.startDate).playoff;
  if (tournament.type === 'Senior') {
    const selection = seniorQualification(state, tournament.startDate);
    selectedPathwayNames = /golden ticket/i.test(tournament.name) ? selection.goldenField : /world seniors championship/i.test(tournament.name) ? selection.championship : /british seniors open/i.test(tournament.name) ? selection.british : undefined;
  }
  if (selectedPathwayNames?.length) liveRows = selectedPathwayNames.map((name, i) => ({ ...(liveRows.find(r => r.playerName === name) ?? state.competitionTables.world.find(r => r.playerName === name) ?? { id: 'qualified-' + name, playerName: name, nation: 'INT', points: 0, movement: 0, prizeMoney: 0 }), ranking: i + 1 }));
  const rankingRows = countsForWorldRanking(tournament) || tournament.type === 'Invitational' ? seedingRows(state, tournament, liveRows) : liveRows;
  const playerRow = rankingRows.find(
    (row) => row.playerName === state.player.fullName,
  );
  const playerRank =
    playerRow?.ranking ??
    state.player.amateurRanking ??
    state.player.worldRanking ??
    rankingRows.length + 1;
  const playerEntry = createBracketPlayer(
    state.player.fullName,
    playerRank,
    state.player.nationality,
    true,
  );
  const qualified = recordedMajorQualifiers(state, tournament);
  const pathwayEvent = ['Junior', 'Regional Youth', 'National Youth', 'Amateur', 'Q Tour', 'Q School', 'Senior'].includes(tournament.type);
  const rosterRows = state.worldPlayers.filter(p => !p.retired).map((p, i) => ({ id:p.id, playerName:p.playerName, nation:p.nation, ranking:rankingRows.length+i+1, points:0, movement:0, prizeMoney:0 }));
  const pathwayCandidates = pathwayEvent ? [...rankingRows, ...rosterRows] : rankingRows;
  const playerRecords = new Map(state.worldPlayers.map(p => [p.playerName, p]));
  const pathwayCheckState = { ...state, securedCards: tournament.type === 'Q School' ? securedPathwayCards(state, tournament.startDate) : undefined };
  const eligibleOpponent = (row: RankingRow) => {
    const record = playerRecords.get(row.playerName);
    if (!record || isTemporaryQualifierName(record.playerName)) return false;
    return !pathwayEntryReason(tournament, { name: record.playerName, nation: record.nation, age: record.age, hasTourCard: record.hasTourCard, retired: record.retired }, pathwayCheckState);
  };
  const opponentEntries = pathwayCandidates
    .filter(eligibleOpponent)
    .filter(row => !selectedPathwayNames?.length || selectedPathwayNames.includes(row.playerName))
    .filter((row) => row.playerName !== state.player.fullName)
    .filter(row => !playerRecords.get(row.playerName)?.retired)
    .filter(row => row.ranking > (resolveTournamentFormat(tournament).seedOffset ?? 0))
    .filter(row => qualified === null || row.ranking <= attachedMainDirectSeeds(tournament) || qualified.includes(row.playerName))
    .filter(
      (row, index, rows) =>
        rows.findIndex((entry) => entry.playerName === row.playerName) ===
        index,
    )
    .sort((left, right) => left.ranking - right.ranking)
    .map((row) => createBracketPlayer(row.playerName, row.ranking, row.nation));

  // Main-tour fields can include amateur top-ups. Use real persisted identities,
  // so every simulated entrant can receive an auditable finishing award.
  if (countsForWorldRanking(tournament) && opponentEntries.length < fieldSize) {
    const topUps = [...state.competitionTables.qSchool, ...state.competitionTables.amateur, ...rosterRows];
    for (const row of topUps) {
      if (opponentEntries.length >= fieldSize) break;
      if (row.playerName === state.player.fullName || opponentEntries.some(p => p.name === row.playerName) || playerRecords.get(row.playerName)?.retired) continue;
      if (qualified !== null && !qualified.includes(row.playerName)) continue;
      opponentEntries.push(createBracketPlayer(row.playerName, opponentEntries.length + 1 + (resolveTournamentFormat(tournament).seedOffset ?? 0), row.nation));
    }
  }
  // A withdrawn direct seed leaves a vacancy, filled by the highest-seeded losing qualifier.
  if (qualified !== null && opponentEntries.length + Number(includePlayer) < fieldSize) {
    const qualifier = Object.values(state.rollingRankings?.events ?? {}).filter(e => e.season === state.season && e.completedOn <= tournament.startDate && e.name.startsWith(tournament.name) && /qualif/i.test(e.name)).sort((a,b)=>b.completedOn.localeCompare(a.completedOn))[0];
    const reserves = (qualifier?.bracket.at(-1)?.matches ?? []).flatMap(m => typeof m.top.score === 'number' && typeof m.bottom.score === 'number' ? [m.top.score < m.bottom.score ? m.top : m.bottom] : []).sort((a,b)=>a.rank-b.rank);
    for (const entrant of reserves) {
      if (opponentEntries.length + Number(includePlayer) >= fieldSize) break;
      if (entrant.name === state.player.fullName || opponentEntries.some(p=>p.name===entrant.name) || !playerRecords.has(entrant.name) || playerRecords.get(entrant.name)?.retired) continue;
      opponentEntries.push({...entrant,score:undefined,rank:opponentEntries.length+1});
    }
  }
  // Early senior previews precede the qualifying results. Complete provisional
  // invitation places with eligible registered seniors; cutoff rebuilds use earned places.
  if (tournament.type === 'Senior' && selectedPathwayNames?.length && opponentEntries.length + Number(includePlayer) < fieldSize) {
    for (const row of pathwayCandidates.filter(eligibleOpponent).sort((a,b)=>a.ranking-b.ranking)) {
      if (opponentEntries.length + Number(includePlayer) >= fieldSize) break;
      if (row.playerName === state.player.fullName || opponentEntries.some(p=>p.name===row.playerName)) continue;
      opponentEntries.push(createBracketPlayer(row.playerName,opponentEntries.length+1,row.nation));
    }
  }
  let field = [...(includePlayer ? [playerEntry] : []), ...opponentEntries]
    .sort((left, right) => left.rank - right.rank)
    .slice(0, fieldSize);

  if (includePlayer && !field.some((entry) => entry.name === state.player.fullName)) {
    field = [...field.slice(0, fieldSize - 1), playerEntry].sort(
      (left, right) => left.rank - right.rank,
    );
  }

  if (field.length < fieldSize) {
    throw new Error(`Insufficient eligible registered entrants for ${tournament.name}: ${field.length}/${fieldSize}`);
  }

  return field.map((p, i) => ({ ...p, developmentEdge: developmentEdge(playerRecords.get(p.name)?.skillDevelopment) + ((playerRecords.get(p.name)?.overallRating ?? 65) - 75) * 2, seed: i + 1 + (resolveTournamentFormat(tournament).seedOffset ?? 0) }));
}

export function buildTournamentDraw(
  state: GameState,
  tournament: Tournament,
  entryRound: TournamentRound,
  includePlayer = true,
  random = Math.random,
): BracketRound[] {
  const roundLabels = getTournamentRounds(tournament);
  if (!roundLabels.length) return [];
  const format = resolveTournamentFormat(tournament);
  const fieldSize =
    format.fieldSize ??
    Math.max(
      16,
      getTournamentRoundMatchCount(tournament, roundLabels[0], 0) * 2,
    );
  const field = buildTournamentDrawField(state, tournament, fieldSize, includePlayer);
  if (format.drawPolicy === "randomEachRound") shuffleInPlace(field, random);
  if (format.groupMode) return createGroupCompetition(tournament, field);
  const playerEntry = getConfiguredEntryRoundForRank(
    tournament,
    field.find((entrant) => entrant.name === state.player.fullName)?.seed ??
      fieldSize,
    roundLabels,
  );

  const rounds: BracketRound[] = roundLabels.map((roundLabel, roundIndex) => ({
    label: roundLabel,
    matches: Array.from(
      {
        length: getTournamentRoundMatchCount(
          tournament,
          roundLabel,
          roundIndex,
        ),
      },
      (_, matchIndex) => ({
        id: `${tournament.id}-${roundLabel}-${matchIndex + 1}`,
        top: createEmptyBracketPlayer(),
        bottom: createEmptyBracketPlayer(),
        placeholder: true,
      }),
    ),
  }));

  const entryIndexFor = (entrant: BracketPlayer) => roundLabels.indexOf(getConfiguredEntryRoundForRank(tournament, entrant.seed ?? entrant.rank, roundLabels));
  const lastEntryIndex = Math.max(...field.map(entryIndexFor));
  const seedOffset = format.seedOffset ?? 0;
  const cursors = rounds.map(() => 0);
  // Construct feeders backwards from the last entry tier. Each qualifier owns a
  // fixed slot in the main tree, so high seeds stay in opposite halves even when
  // lower-ranked players win their feeder matches.
  function slot(roundIndex: number, virtualSeed: number): BracketPlayer {
    const direct = field.find(p => (p.seed ?? p.rank) === virtualSeed && entryIndexFor(p) === roundIndex);
    if (direct) return direct;
    if (roundIndex === 0) throw new Error('Missing draw entrant for seed ' + virtualSeed + ' in ' + tournament.name);
    const previousIndex = roundIndex - 1;
    const minSeed = Math.min(...field.filter(p => entryIndexFor(p) <= previousIndex).map(p => p.seed ?? p.rank));
    const opponentSeed = 2 * minSeed + rounds[previousIndex].matches.length * 2 - 1 - virtualSeed;
    const match = rounds[previousIndex].matches[cursors[previousIndex]++];
    match.top = slot(previousIndex, virtualSeed);
    match.bottom = slot(previousIndex, opponentSeed);
    match.placeholder = match.top.name === 'TBD' || match.bottom.name === 'TBD';
    return createEmptyBracketPlayer();
  }
  const target = rounds[lastEntryIndex];
  const capacity = target.matches.length * 2;
  let orderedSeeds: number[];
  if (format.drawPolicy === 'randomEachRound') orderedSeeds = field.map(p => p.seed ?? p.rank);
  else if (format.id === 'qTourPlayoff') {
    const sections = Array.from({ length: 3 }, () => [] as number[]);
    field.forEach((p, i) => sections[Math.floor(i / 3) % 2 ? 2 - i % 3 : i % 3].push(p.seed ?? p.rank));
    orderedSeeds = sections.flatMap(section => getBracketSeedOrder(8).map(n => section[n - 1]));
  } else orderedSeeds = getBracketSeedOrder(capacity).map(seed => seed + seedOffset);
  if (['ukMajor', 'worldChampionshipMain'].includes(format.id)) {
    const qualifiers = shuffleInPlace(field.filter(p => (p.seed ?? p.rank) > 16).map(p => p.seed ?? p.rank), random);
    orderedSeeds = orderedSeeds.map(seed => seed > 16 ? qualifiers[seed - 17] : seed);
  }
  target.matches.forEach((match, i) => {
    match.top = slot(lastEntryIndex, orderedSeeds[i * 2]);
    match.bottom = slot(lastEntryIndex, orderedSeeds[i * 2 + 1]);
    match.placeholder = match.top.name === 'TBD' || match.bottom.name === 'TBD';
  });

  let preparedRounds = rounds;
  const entryIndex = includePlayer ? roundLabels.indexOf(playerEntry || entryRound) : 0;
  for (let roundIndex = 0; roundIndex < entryIndex; roundIndex += 1) {
    preparedRounds = resolveTournamentDrawRound(
      preparedRounds,
      tournament,
      roundLabels[roundIndex],
      state.player.fullName,
    );
  }
  return preparedRounds;
}

function simulateBracketScore(
  tournament: Tournament,
  round: TournamentRound,
  topRank: number,
  bottomRank: number,
  random = Math.random,
  developmentDifference = 0,
) {
  const bestOf = getTournamentRoundPlan(tournament, round).bestOf;
  const framesNeeded = Math.ceil(bestOf / 2);
  const topWinChance = clamp(50 + clamp((bottomRank - topRank) * 0.15, -12, 12) + developmentDifference, 18, 82);
  const topWon = random() * 100 < topWinChance;
  const loserFrames = clamp(
    Math.round(
      random() * Math.max(0, framesNeeded - 1) +
        Math.max(0, 4 - Math.abs(bottomRank - topRank) / 12),
    ),
    0,
    framesNeeded - 1,
  );

  return topWon
    ? { topScore: framesNeeded, bottomScore: loserFrames }
    : { topScore: loserFrames, bottomScore: framesNeeded };
}

export function resolveTournamentDrawRound(
  rounds: BracketRound[],
  tournament: Tournament,
  roundLabel: TournamentRound,
  playerName: string,
  random = Math.random,
) {
  if (isGroupDraw(rounds)) return resolveGroupCompetitionStage(rounds, tournament, roundLabel, random);
  const roundIndex = rounds.findIndex((round) => round.label === roundLabel);
  if (roundIndex === -1) return rounds;

  const round = rounds[roundIndex];
  const resolvedMatches = round.matches.map((match) => {
    if (
      typeof match.top.score === "number" &&
      typeof match.bottom.score === "number"
    ) {
      return { ...match, placeholder: false };
    }
    if (
      match.placeholder ||
      match.top.name === "TBD" ||
      match.bottom.name === "TBD"
    ) {
      return match;
    }
    if (match.top.name === playerName || match.bottom.name === playerName) {
      return match;
    }

    const result = simulateBracketScore(
      tournament,
      roundLabel,
      match.top.rank,
      match.bottom.rank,
      random,
      (match.top.developmentEdge ?? 0) - (match.bottom.developmentEdge ?? 0),
    );
    return {
      ...match,
      top: { ...match.top, score: result.topScore },
      bottom: { ...match.bottom, score: result.bottomScore },
      placeholder: false,
    };
  });

  rounds[roundIndex] = {
    ...round,
    matches: resolvedMatches,
  };

  const nextRound = rounds[roundIndex + 1];
  if (!nextRound) return rounds;
  const winners = resolvedMatches
    .map(getBracketMatchWinner)
    .filter((winner): winner is BracketPlayer => Boolean(winner));
  if (resolveTournamentFormat(tournament).drawPolicy === "randomEachRound" && winners.length === resolvedMatches.length) shuffleInPlace(winners, random);
  const nextSlots = nextRound.matches.flatMap((match) => [
    { ...match.top },
    { ...match.bottom },
  ]);
  const openSlotIndexes = nextSlots
    .map((entrant, index) => (entrant.name === "TBD" ? index : -1))
    .filter((index) => index >= 0);
  winners.forEach((winner, index) => {
    const slotIndex = openSlotIndexes[index];
    if (slotIndex != null) nextSlots[slotIndex] = winner;
  });
  rounds[roundIndex + 1] = {
    ...nextRound,
    matches: nextRound.matches.map((match, matchIndex) => {
      const top = nextSlots[matchIndex * 2] ?? createEmptyBracketPlayer();
      const bottom =
        nextSlots[matchIndex * 2 + 1] ?? createEmptyBracketPlayer();
      return {
        ...match,
        top,
        bottom,
        placeholder: top.name === "TBD" || bottom.name === "TBD",
      };
    }),
  };

  return rounds;
}

function applyCompletedMatchToTournamentDraw(
  rounds: BracketRound[],
  tournament: Tournament,
  roundLabel: TournamentRound,
  playerName: string,
  playerFrames: number,
  opponentFrames: number,
) {
  const nextRounds = cloneBracketRounds(rounds);
  const roundIndex = nextRounds.findIndex(
    (round) => round.label === roundLabel,
  );
  if (roundIndex === -1) return nextRounds;

  const matchIndex = nextRounds[roundIndex].matches.findIndex(
    (match) =>
      match.top.name === playerName || match.bottom.name === playerName,
  );
  if (matchIndex === -1) return nextRounds;

  const match = nextRounds[roundIndex].matches[matchIndex];
  const playerIsTop = match.top.name === playerName;
  nextRounds[roundIndex].matches[matchIndex] = {
    ...match,
    top: { ...match.top, score: playerIsTop ? playerFrames : opponentFrames },
    bottom: {
      ...match.bottom,
      score: playerIsTop ? opponentFrames : playerFrames,
    },
    placeholder: false,
  };

  return resolveTournamentDrawRound(
    nextRounds,
    tournament,
    roundLabel,
    playerName,
  );
}

function completeRemainingTournamentDraw(
  rounds: BracketRound[],
  tournament: Tournament,
  completedRound: TournamentRound,
  playerName: string,
) {
  let completedDraw = cloneBracketRounds(rounds);
  const completedRoundIndex = completedDraw.findIndex(
    (round) => round.label === completedRound,
  );

  for (
    let roundIndex = completedRoundIndex + 1;
    roundIndex < completedDraw.length;
    roundIndex += 1
  ) {
    completedDraw = resolveTournamentDrawRound(
      completedDraw,
      tournament,
      completedDraw[roundIndex].label as TournamentRound,
      playerName,
    );
  }

  return completedDraw;
}

/** Complete the world calendar in date order, independently of human entry.
 * This function never advances training, cash settlement or the player's match. */
export function processRankingCalendar(input: GameState): GameState {
  let state = ensureSeasonClock(ensureWorldPopulation(scheduleRankingExpiries(initializeRollingRankings(input))));
  state = { ...state, tournaments: state.tournaments.map(t => isChampionshipLeague(t) && t.status !== 'Completed' ? { ...t, format: 'Groups: up to 4 frames, draws allowed · final best of 5', prizeMoney: 328000, winnerPrize: 33000, runnerUpPrize: 23000 } : t) };
  const through = state.currentDate;
  const ledger = state.rollingRankings!;
  const dates = new Set<string>();
  for (const t of state.tournaments) {
    const date = t.endDate ?? t.startDate;
    const key = rankingEventKey(t);
    if (date <= through && !ledger.events[key]?.applied && !ledger.legacyEventKeys.includes(key) && t.status !== 'Entered') dates.add(date);
    const cutoff = rankingCutoffDate(t);
    if (cutoff > ledger.processedThrough && cutoff <= through && !ledger.seedings[key]) dates.add(cutoff);
  }
  for (const e of ledger.earnings) if (e.expiresOn > ledger.processedThrough && e.expiresOn <= through) dates.add(e.expiresOn);
  for (const date of [...dates].sort()) {
    state = { ...evolveTourSkills({ ...state, currentDate: date }), currentDate: state.currentDate };
    state = lockTournamentSeedings(state, new Date(Date.parse(`${date}T12:00:00Z`) - 86400000).toISOString().slice(0, 10));
    const events = state.tournaments.filter(t => (t.endDate ?? t.startDate) === date && t.status !== 'Entered');
    for (const t of events) {
      const key = rankingEventKey(t);
      if (state.rollingRankings!.legacyEventKeys.includes(key) || state.rollingRankings!.events[key]) continue;
      // The random stream is event-local: reloads and advancing in larger steps agree.
      let seed = [...`${state.worldSeed}:${key}`].reduce((s, c) => Math.imul(s ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
      const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      const draw = buildTournamentDraw(state, t, getTournamentRounds(t)[0], false, random);
      for (const round of draw) resolveTournamentDrawRound(draw, t, round.label, state.player.fullName, random);
      const tables = updateCompetitionTablesFromCpuDraw(state.competitionTables, state.competitionTables, {}, t, draw, state.player, []);
      state = recordRankingEvent({ ...state, competitionTables: tables, worldPlayers: updateWorldPlayersFromCompletedDraw(state.worldPlayers, tables, draw, state.player.fullName) }, t, draw, getTournamentPlacementAwards);
      state = { ...state, tournaments: state.tournaments.map(item => item.id === t.id && item.status !== 'Skipped' ? { ...item, status: 'Completed' } : item) };
    }
    const hasRevision = events.some(t => countsForWorldRanking(t)) || state.rollingRankings!.earnings.some(e => e.expiresOn === date);
    state = rebuildRollingRankings(state, date, hasRevision);
    state = lockTournamentSeedings(state, date);
  }
  state = lockTournamentSeedings(state, through);
  const entered = state.tournaments.find(t => t.id === state.tournamentProgress.tournamentId && t.status === 'Entered');
  if (entered && !state.liveMatch && state.tournamentProgress.completedRounds.length === 0 && !ledger.seedings[rankingEventKey(entered)] && state.rollingRankings!.seedings[rankingEventKey(entered)]) {
    const currentRound = getTournamentEntryRound(state, entered);
    state = { ...state, tournamentProgress: { ...state.tournamentProgress, currentRound, draw: buildTournamentDraw(state, entered, currentRound) } };
  }
  if (entered && isChampionshipLeague(entered) && !isGroupDraw(state.tournamentProgress.draw) && !state.liveMatch && state.tournamentProgress.completedRounds.length === 0) {
    state = { ...state, tournamentProgress: { ...state.tournamentProgress, currentRound: 'Stage One Groups', draw: buildTournamentDraw(state, entered, 'Stage One Groups') } };
  }
  return compactRankingLedger({ ...state, rollingRankings: { ...state.rollingRankings!, processedThrough: through } });
}

function createEmptyTravelState(): TravelState {
  return {
    bookings: {},
  };
}

function createEmptyHistory(): CareerHistoryState {
  return {
    snapshots: [],
    matchLog: [],
    tournamentHistory: [],
    seasonRecords: [],
  };
}

function getNationCode(nation: string) {
  return nation.slice(0, 3).toUpperCase();
}

function rerankCompetitionRows(
  rows: CompetitionTableRow[],
  playerName: string,
  baselineRankings?: ReadonlyMap<string, number>,
) {
  const sorted = uniqueRankingRows(rows).sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    if (right.prizeMoney !== left.prizeMoney)
      return right.prizeMoney - left.prizeMoney;
    if (right.titles !== left.titles) return right.titles - left.titles;
    if (right.wins !== left.wins) return right.wins - left.wins;
    if (left.losses !== right.losses) return left.losses - right.losses;
    return left.playerName.localeCompare(right.playerName);
  });

  return sorted.map((row, index) => ({
    ...row,
    movement: baselineRankings
      ? (baselineRankings.get(row.playerName) ?? row.ranking) - (index + 1)
      : row.ranking === index + 1
        ? row.movement
        : row.ranking - (index + 1),
    ranking: index + 1,
    highlighted: row.playerName === playerName,
  }));
}

function isTemporaryQualifierName(playerName: string) {
  return /^Qualifier \d+$/i.test(playerName.trim());
}

function ensurePlayerSeedRow(rows: RankingRow[], player: Player): RankingRow[] {
  if (rows.some((row) => row.playerName === player.fullName))
    return rows.map((row) => ({
      ...row,
      highlighted: row.playerName === player.fullName,
    }));

  return [
    ...rows,
    {
      id: `rank-player-${player.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      playerName: player.fullName,
      nation: getNationCode(player.nationality),
      ranking: rows.length + 1,
      movement: 0,
      points: Math.max(
        0,
        player.worldRanking != null
          ? 480
          : player.amateurRanking != null
            ? Math.max(120, 720 - player.amateurRanking * 18)
            : 200,
      ),
      prizeMoney: Math.max(0, player.cash),
      highlighted: true,
    },
  ];
}

function createCompetitionRowsFromBase(
  baseRows: RankingRow[],
  player: Player,
  pointsMultiplier: number,
  prizeMultiplier: number,
  eventBase: number,
): CompetitionTableRow[] {
  return rerankCompetitionRows(
    ensurePlayerSeedRow(baseRows, player).map((row) => {
      const eventsPlayed = Math.max(
        0,
        eventBase + Math.max(0, 8 - row.ranking),
      );
      const wins = Math.max(
        0,
        Math.min(eventsPlayed, eventBase + Math.max(0, 6 - row.ranking)),
      );
      const losses = Math.max(0, eventsPlayed - wins);
      const titles = row.ranking <= 4 ? 1 : 0;

      return {
        ...row,
        points: Math.max(0, Math.round(row.points * pointsMultiplier)),
        prizeMoney: Math.max(0, Math.round(row.prizeMoney * prizeMultiplier)),
        eventsPlayed,
        wins,
        losses,
        titles,
      };
    }),
    player.fullName,
  );
}

const GENERATED_COMPETITOR_FIRST_NAMES = [
  "Adrian",
  "Bartosz",
  "Cedric",
  "Dylan",
  "Emil",
  "Fraser",
  "Gareth",
  "Hamza",
  "Ivan",
  "Jasper",
  "Kaito",
  "Lennon",
  "Mateo",
  "Nathan",
  "Oskar",
  "Pavel",
  "Quentin",
  "Rafael",
  "Sebastian",
  "Tariq",
  "Ulrich",
  "Viktor",
  "Wesley",
  "Xander",
  "Yannick",
  "Zane",
  "Bailey",
  "Connor",
  "Dario",
  "Euan",
  "Freddie",
  "Gianni",
  "Harris",
  "Ilyas",
  "Joel",
  "Kieran",
  "Lorenzo",
  "Malik",
  "Niall",
  "Otis",
  "Patrick",
  "Reuben",
  "Samir",
  "Tobias",
  "Vincent",
  "Warren",
  "Yusuf",
  "Zac",
];

const GENERATED_COMPETITOR_LAST_NAMES = [
  "Ashford",
  "Barker",
  "Caldwell",
  "Drayton",
  "Easton",
  "Forster",
  "Grimaldi",
  "Harrington",
  "Iqbal",
  "Janssen",
  "Kovacs",
  "Langford",
  "Madsen",
  "Novak",
  "Olsen",
  "Patel",
  "Quinnell",
  "Rossi",
  "Sinclair",
  "Tanaka",
  "Upton",
  "Vos",
  "Westbrook",
  "Xu",
  "Yilmaz",
  "Zimmer",
  "Ainsley",
  "Bouchard",
  "Costa",
  "Davenport",
  "El-Sayed",
  "Fletcher",
  "Gallagher",
  "Hayashi",
  "Iversen",
  "Kowalski",
  "Lombardi",
  "Mendoza",
  "Nakamura",
  "Otero",
  "Petrov",
  "Rahman",
  "Sorensen",
  "Tremblay",
  "Urban",
  "Verma",
  "Whitaker",
  "Yates",
];

const GENERATED_COMPETITOR_NATIONS = [
  "ENG",
  "SCO",
  "WAL",
  "IRL",
  "NIR",
  "BEL",
  "GER",
  "NED",
  "POL",
  "AUS",
  "THA",
  "CHN",
  "IND",
  "PAK",
  "CAN",
  "BRA",
  "JPN",
  "NOR",
  "SWE",
  "ITA",
  "ESP",
  "FRA",
];

const COMPETITION_POOL_PROFILES: Record<
  Exclude<CompetitionTableKey, "world" | "oneYear">,
  {
    count: number;
    pointsStart: number;
    pointsStep: number;
    prizeStart: number;
    prizeStep: number;
    eventBase: number;
    seedOffset: number;
  }
> = {
  amateur: {
    count: 96,
    pointsStart: 4600,
    pointsStep: 34,
    prizeStart: 92000,
    prizeStep: 640,
    eventBase: 7,
    seedOffset: 11,
  },
  qTour: {
    count: 72,
    pointsStart: 2800,
    pointsStep: 28,
    prizeStart: 48000,
    prizeStep: 420,
    eventBase: 6,
    seedOffset: 173,
  },
  qSchool: {
    count: 64,
    pointsStart: 1200,
    pointsStep: 15,
    prizeStart: 0,
    prizeStep: 0,
    eventBase: 4,
    seedOffset: 347,
  },
  senior: {
    count: 48,
    pointsStart: 2100,
    pointsStep: 24,
    prizeStart: 36000,
    prizeStep: 380,
    eventBase: 5,
    seedOffset: 521,
  },
  youth: {
    count: 64,
    pointsStart: 1800,
    pointsStep: 21,
    prizeStart: 12000,
    prizeStep: 120,
    eventBase: 6,
    seedOffset: 701,
  },
};

function createGeneratedRankingIdentity(seenNames: Set<string>, seed: number) {
  const maxAttempts =
    GENERATED_COMPETITOR_FIRST_NAMES.length *
    GENERATED_COMPETITOR_LAST_NAMES.length;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const value = seed + attempt;
    const firstName =
      GENERATED_COMPETITOR_FIRST_NAMES[
        value % GENERATED_COMPETITOR_FIRST_NAMES.length
      ];
    const lastName =
      GENERATED_COMPETITOR_LAST_NAMES[
        Math.floor(value / GENERATED_COMPETITOR_FIRST_NAMES.length) %
          GENERATED_COMPETITOR_LAST_NAMES.length
      ];
    const playerName = `${firstName} ${lastName}`;

    if (!seenNames.has(playerName)) {
      seenNames.add(playerName);
      return {
        playerName,
        nation:
          GENERATED_COMPETITOR_NATIONS[
            value % GENERATED_COMPETITOR_NATIONS.length
          ],
      };
    }
  }

  const playerName = `Tour Player ${seed}`;
  seenNames.add(playerName);
  return {
    playerName,
    nation:
      GENERATED_COMPETITOR_NATIONS[seed % GENERATED_COMPETITOR_NATIONS.length],
  };
}

function createCompetitionPoolRows(
  key: Exclude<CompetitionTableKey, "world" | "oneYear">,
  seenNames: Set<string>,
  worldSeed = 0,
): RankingRow[] {
  const profile = COMPETITION_POOL_PROFILES[key];

  return Array.from({ length: profile.count }, (_, index) => {
    const seed = worldSeed + profile.seedOffset + index * 7;
    const identity = createGeneratedRankingIdentity(seenNames, seed);
    const ranking = index + 1;
    const pointsOffset = getSeededSignedOffset(
      worldSeed,
      profile.seedOffset + index * 13,
      Math.max(3, Math.round(profile.pointsStart * 0.025)),
    );
    const prizeOffset = getSeededSignedOffset(
      worldSeed,
      profile.seedOffset + index * 17,
      Math.max(0, Math.round(profile.prizeStart * 0.025)),
    );

    return {
      id: `rank-${key}-${ranking}`,
      playerName: identity.playerName,
      nation: identity.nation,
      ranking,
      movement: getSeededSignedOffset(
        worldSeed,
        profile.seedOffset + index * 19,
        3,
      ),
      points: Math.max(
        12,
        profile.pointsStart -
          index * profile.pointsStep +
          (index % 5) * 3 +
          pointsOffset,
      ),
      prizeMoney: Math.max(
        0,
        profile.prizeStart - index * profile.prizeStep + prizeOffset,
      ),
      highlighted: false,
    };
  });
}

function buildCompetitionTables(
  baseRows: RankingRow[],
  player: Player,
  options?: { reservePlayerName?: boolean; worldSeed?: number },
): CompetitionTablesState {
  const worldSeed = options?.worldSeed ?? 0;
  const seededBaseRows =
    worldSeed > 0
      ? buildSeededWorldRankingRows(
          baseRows,
          player,
          worldSeed,
          options?.reservePlayerName,
        )
      : baseRows;
  const seenNames = new Set<string>([player.fullName]);
  seededBaseRows.forEach((row) => {
    if (options?.reservePlayerName && row.playerName === player.fullName)
      return;
    seenNames.add(row.playerName);
  });
  const competitionBaseRows = seededBaseRows.map((row) => {
    if (!options?.reservePlayerName || row.playerName !== player.fullName)
      return row;

    const identity = createGeneratedRankingIdentity(
      seenNames,
      worldSeed + 997 + row.ranking * 13,
    );
    return {
      ...row,
      id: `${row.id}-reserve`,
      playerName: identity.playerName,
      nation: identity.nation,
      highlighted: false,
    };
  });

  return {
    world: createCompetitionRowsFromBase(competitionBaseRows, player, 1, 1, 8),
    oneYear: createCompetitionRowsFromBase(
      competitionBaseRows,
      player,
      0.46,
      0.46,
      6,
    ),
    amateur: createCompetitionRowsFromBase(
      createCompetitionPoolRows("amateur", seenNames, worldSeed),
      player,
      1,
      1,
      7,
    ),
    qTour: createCompetitionRowsFromBase(
      createCompetitionPoolRows("qTour", seenNames, worldSeed),
      player,
      1,
      1,
      6,
    ),
    qSchool: createCompetitionRowsFromBase(
      createCompetitionPoolRows("qSchool", seenNames, worldSeed),
      player,
      1,
      0,
      4,
    ).map((row) => ({ ...row, prizeMoney: 0 })),
    senior: createCompetitionRowsFromBase(
      createCompetitionPoolRows("senior", seenNames, worldSeed),
      player,
      1,
      1,
      5,
    ),
    youth: createCompetitionRowsFromBase(
      createCompetitionPoolRows("youth", seenNames, worldSeed),
      player,
      1,
      1,
      6,
    ),
  };
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function createWorldSeed() {
  return Math.floor(Math.random() * 2_147_483_647);
}

function seededNoise(seed: number, salt: number) {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function getSeededSignedOffset(seed: number, salt: number, range: number) {
  return Math.round((seededNoise(seed, salt) * 2 - 1) * range);
}

function buildSeededWorldRankingRows(
  baseRows: RankingRow[],
  player: Player,
  worldSeed: number,
  reservePlayerName = false,
): RankingRow[] {
  const seenNames = new Set<string>([player.fullName]);

  return baseRows.map((row) => {
    const preservePlayer =
      row.playerName === player.fullName && !reservePlayerName;
    const identity = preservePlayer
      ? {
          playerName: player.fullName,
          nation: getNationCode(player.nationality),
        }
      : createGeneratedRankingIdentity(seenNames, worldSeed + row.ranking * 31);
    const pointsOffset = getSeededSignedOffset(
      worldSeed,
      row.ranking * 17,
      Math.max(24, Math.round(row.points * 0.08)),
    );
    const prizeOffset = getSeededSignedOffset(
      worldSeed,
      row.ranking * 19,
      Math.max(1500, Math.round(row.prizeMoney * 0.08)),
    );

    return {
      ...row,
      id: preservePlayer ? row.id : `rank-world-${worldSeed}-${row.ranking}`,
      playerName: identity.playerName,
      nation: identity.nation,
      movement: getSeededSignedOffset(worldSeed, row.ranking * 23, 4),
      points: Math.max(160, row.points + pointsOffset),
      prizeMoney: Math.max(12000, row.prizeMoney + prizeOffset),
      highlighted: preservePlayer,
    };
  });
}

function getCompetitionRowForPlayer(
  tables: CompetitionTablesState,
  key: CompetitionTableKey,
  playerName: string,
) {
  return tables[key].find((row) => row.playerName === playerName);
}

function getAllCompetitionPlayerNames(tables: CompetitionTablesState) {
  return COMPETITION_TABLE_KEYS.flatMap((key) =>
    tables[key].map((row) => row.playerName),
  ).filter(Boolean);
}

function inferWorldPlayerAge(
  playerName: string,
  tables: CompetitionTablesState,
  player?: Player,
) {
  if (player && playerName === player.fullName) return player.age;

  const worldRank =
    getCompetitionRowForPlayer(tables, "world", playerName)?.ranking ?? 999;
  const seed = hashString(playerName);

  if (seed % 11 === 0) return 40 + (seed % 15);
  if (worldRank <= 16) return 25 + (seed % 10);
  if (worldRank <= 64) return 21 + (seed % 13);
  if (seed % 5 === 0) return 14 + (seed % 8);
  if (seed % 3 === 0) return 18 + (seed % 10);

  return 20 + (seed % 12);
}

function inferWorldPlayerOverallRating(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
) {
  const rankedCircuit = (
    ["world", "qSchool", "qTour", "amateur", "senior", "youth"] as const
  ).find((key) =>
    tables[key].some((row) => row.playerName === record.playerName),
  );
  const row = rankedCircuit
    ? getCompetitionRowForPlayer(tables, rankedCircuit, record.playerName)
    : undefined;
  const rank = row?.ranking ?? record.highestWorldRank ?? 128;
  const base =
    rankedCircuit === "world"
      ? 68
      : rankedCircuit === "qSchool"
        ? 69
        : rankedCircuit === "qTour"
          ? 64
          : rankedCircuit === "amateur"
            ? 56
            : rankedCircuit === "senior"
              ? 54
              : 48;
  const weight =
    rankedCircuit === "world"
      ? 0.32
      : rankedCircuit === "qSchool"
        ? 0.3
        : rankedCircuit === "qTour"
          ? 0.28
          : rankedCircuit === "amateur"
            ? 0.22
            : rankedCircuit === "senior"
              ? 0.16
              : 0.18;
  const identityVariation = (hashString(record.playerName) % 7) - 3;

  return clamp(Math.round(base + (100 - rank) * weight + identityVariation), 42, 97);
}

function buildLegacyRecentResults(record: WorldPlayerRecord) {
  const matches = Math.min(8, Math.max(0, record.wins + record.losses));
  if (matches === 0) return [];
  const winRate = record.wins / Math.max(1, record.wins + record.losses);
  return Array.from({ length: matches }, (_, index): "W" | "L" => {
    const roll = seededNoise(hashString(record.playerName), index + 71);
    return roll < winRate ? "W" : "L";
  });
}

function normalizeWorldPlayerRecord(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
  player?: Player,
): WorldPlayerRecord {
  const worldRank =
    getCompetitionRowForPlayer(tables, "world", record.playerName)?.ranking ??
    record.highestWorldRank ??
    999;
  const defaultHasTourCard = worldRank <= MAIN_TOUR_POOL_SIZE;
  const supportSeed = hashString(record.playerName);

  return {
    ...record,
    age:
      typeof record.age === "number"
        ? record.age
        : inferWorldPlayerAge(record.playerName, tables, player),
    hasTourCard:
      typeof record.hasTourCard === "boolean"
        ? record.hasTourCard
        : defaultHasTourCard,
    cardSource:
      record.cardSource ??
      (worldRank <= TOP_64_RANK_CUTOFF
        ? "Ranking Retained"
        : defaultHasTourCard
          ? "Seeded Main Tour"
          : null),
    currentYear:
      typeof record.currentYear === "number" ? record.currentYear : 0,
    yearsRemaining:
      typeof record.yearsRemaining === "number" ? record.yearsRemaining : 0,
    expiresAfterSeason: record.expiresAfterSeason ?? null,
    retainedViaRanking:
      typeof record.retainedViaRanking === "boolean"
        ? record.retainedViaRanking
        : worldRank <= TOP_64_RANK_CUTOFF,
    tourSurvivalStatus:
      record.tourSurvivalStatus ??
      (worldRank <= TOP_16_RANK_CUTOFF
        ? "Top 16"
        : worldRank <= TOP_32_RANK_CUTOFF
          ? "Top 32"
          : worldRank <= TOP_64_RANK_CUTOFF
            ? "Safe"
            : defaultHasTourCard
              ? "At Risk"
              : "Amateur"),
    coachQuality:
      typeof record.coachQuality === "number"
        ? record.coachQuality
        : clamp(
            42 + Math.max(0, 80 - worldRank) / 2 + (supportSeed % 13),
            35,
            94,
          ),
    equipmentQuality:
      typeof record.equipmentQuality === "number"
        ? record.equipmentQuality
        : clamp(
            45 + Math.max(0, 72 - worldRank) / 2 + (supportSeed % 11),
            38,
            96,
          ),
    trainingLoad:
      typeof record.trainingLoad === "number"
        ? record.trainingLoad
        : 48 + (supportSeed % 34),
    fatigue:
      typeof record.fatigue === "number"
        ? record.fatigue
        : 20 + (supportSeed % 38),
    injuryWeeks:
      typeof record.injuryWeeks === "number" ? record.injuryWeeks : 0,
    sponsorLevel:
      typeof record.sponsorLevel === "number"
        ? record.sponsorLevel
        : clamp(Math.round(15 + Math.max(0, 96 - worldRank) * 0.7), 5, 95),
    overallRating:
      typeof record.overallRating === "number"
        ? clamp(record.overallRating, 35, 99)
        : inferWorldPlayerOverallRating(record, tables),
    ratingProgress:
      typeof record.ratingProgress === "number" ? record.ratingProgress : 0,
    recentResults: Array.isArray(record.recentResults)
      ? record.recentResults.filter(
          (result): result is "W" | "L" => result === "W" || result === "L",
        ).slice(-10)
      : buildLegacyRecentResults(record),
    retired: typeof record.retired === "boolean" ? record.retired : false,
    retiredSeason: record.retiredSeason ?? null,
  };
}

function normalizeWorldPlayers(
  players: WorldPlayerRecord[],
  tables: CompetitionTablesState,
  player?: Player,
) {
  return players.map((record) =>
    normalizeWorldPlayerRecord(record, tables, player),
  );
}

function buildWorldPlayersFromTables(
  tables: CompetitionTablesState,
  player?: Player,
): WorldPlayerRecord[] {
  const seen = new Map<string, WorldPlayerRecord>();

  getAllCompetitionPlayerNames(tables).forEach((playerName) => {
    if (!playerName || seen.has(playerName)) {
      return;
    }

    const worldRow = getCompetitionRowForPlayer(tables, "world", playerName);
    const oneYearRow = getCompetitionRowForPlayer(
      tables,
      "oneYear",
      playerName,
    );
    const amateurRow = getCompetitionRowForPlayer(
      tables,
      "amateur",
      playerName,
    );
    const qTourRow = getCompetitionRowForPlayer(tables, "qTour", playerName);
    const qSchoolRow = getCompetitionRowForPlayer(
      tables,
      "qSchool",
      playerName,
    );
    const seniorRow = getCompetitionRowForPlayer(tables, "senior", playerName);
    const youthRow = getCompetitionRowForPlayer(tables, "youth", playerName);
    const nation =
      worldRow?.nation ??
      amateurRow?.nation ??
      qTourRow?.nation ??
      qSchoolRow?.nation ??
      seniorRow?.nation ??
      youthRow?.nation ??
      getNationCode(player?.nationality ?? "International");
    const totalMatches =
      (oneYearRow?.eventsPlayed ?? worldRow?.eventsPlayed ?? 0) +
      (amateurRow?.eventsPlayed ?? 0) +
      (qTourRow?.eventsPlayed ?? 0) +
      (qSchoolRow?.eventsPlayed ?? 0) +
      (seniorRow?.eventsPlayed ?? 0) +
      (youthRow?.eventsPlayed ?? 0);
    const wins =
      (oneYearRow?.wins ?? worldRow?.wins ?? 0) +
      (amateurRow?.wins ?? 0) +
      (qTourRow?.wins ?? 0) +
      (qSchoolRow?.wins ?? 0) +
      (seniorRow?.wins ?? 0) +
      (youthRow?.wins ?? 0);
    const losses =
      (oneYearRow?.losses ?? worldRow?.losses ?? 0) +
      (amateurRow?.losses ?? 0) +
      (qTourRow?.losses ?? 0) +
      (qSchoolRow?.losses ?? 0) +
      (seniorRow?.losses ?? 0) +
      (youthRow?.losses ?? 0);

    seen.set(
      playerName,
      normalizeWorldPlayerRecord(
        {
          id: `wp-${playerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          playerName,
          nation,
          age: inferWorldPlayerAge(playerName, tables, player),
          hasTourCard: (worldRow?.ranking ?? 999) <= MAIN_TOUR_POOL_SIZE,
          cardSource:
            (worldRow?.ranking ?? 999) <= TOP_64_RANK_CUTOFF
              ? "Ranking Retained"
              : (worldRow?.ranking ?? 999) <= MAIN_TOUR_POOL_SIZE
                ? "Seeded Main Tour"
                : null,
          currentYear: 0,
          yearsRemaining: 0,
          expiresAfterSeason: null,
          retainedViaRanking: (worldRow?.ranking ?? 999) <= TOP_64_RANK_CUTOFF,
          tourSurvivalStatus:
            (worldRow?.ranking ?? 999) <= TOP_16_RANK_CUTOFF
              ? "Top 16"
              : (worldRow?.ranking ?? 999) <= TOP_32_RANK_CUTOFF
                ? "Top 32"
                : (worldRow?.ranking ?? 999) <= TOP_64_RANK_CUTOFF
                  ? "Safe"
                  : (worldRow?.ranking ?? 999) <= MAIN_TOUR_POOL_SIZE
                    ? "At Risk"
                    : "Amateur",
          totalMatches,
          wins,
          losses,
          totalPrizeMoney: oneYearRow?.prizeMoney ?? worldRow?.prizeMoney ?? 0,
          titles:
            (oneYearRow?.titles ?? 0) +
            (amateurRow?.titles ?? 0) +
            (qTourRow?.titles ?? 0) +
            (qSchoolRow?.titles ?? 0) +
            (seniorRow?.titles ?? 0) +
            (youthRow?.titles ?? 0),
          majorTitles: 0,
          qTourWins: qTourRow?.titles ?? 0,
          seniorTitles: seniorRow?.titles ?? 0,
          highestBreak: 0,
          highestWorldRank: worldRow?.ranking ?? null,
          retired: false,
          retiredSeason: null,
          seasons: [],
        },
        tables,
        player,
      ),
    );
  });

  return Array.from(seen.values());
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
      survivalStatus: "Amateur",
      tourSurvivalStatus: "Amateur",
      currentTier: "Amateur",
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
  };
}

function createCareerSystemsForStartingLevel(
  level: NewCareerStartingLevel,
): CareerSystemsState {
  const systems = createEmptyCareerSystems();

  if (level.competitionTable === "qSchool") {
    return {
      ...systems,
      qSchool: {
        ...systems.qSchool,
        campaignsEntered: 1,
        eligibilityScore: Math.max(80, level.targetPoints),
        campaignEligible: true,
        seededCampaign: true,
        eligibilitySeasonsRemaining: 1,
        qualifiedBy: "New career Q School start",
      },
    };
  }

  if (level.competitionTable !== "world") {
    return systems;
  }

  const retainedViaRanking = level.targetRanking <= TOP_64_RANK_CUTOFF;
  const rookieCard = !retainedViaRanking;
  const bottomTourStart = level.id === "start-bottom-tour";

  return {
    ...systems,
    pro: {
      ...systems.pro,
      hasTourCard: true,
      cardSource: retainedViaRanking ? "Ranking Retained" : "Seeded Main Tour",
      currentYear: rookieCard ? (bottomTourStart ? 2 : 1) : 0,
      yearsRemaining: rookieCard ? (bottomTourStart ? 1 : 2) : 0,
      expiresAfterSeason: rookieCard
        ? bottomTourStart
          ? "2026/27"
          : "2027/28"
        : null,
      retainedViaRanking,
      awardedBy: "New career professional start",
      survivalStatus:
        level.targetRanking <= TOP_16_RANK_CUTOFF
          ? "Top 16"
          : level.targetRanking <= TOP_32_RANK_CUTOFF
            ? "Top 32"
            : level.targetRanking <= TOP_64_RANK_CUTOFF
              ? "Safe"
              : level.targetRanking <= 96
                ? "Bubble"
                : "At Risk",
      tourSurvivalStatus:
        level.targetRanking <= TOP_16_RANK_CUTOFF
          ? "Top 16"
          : level.targetRanking <= TOP_32_RANK_CUTOFF
            ? "Top 32"
            : level.targetRanking <= TOP_64_RANK_CUTOFF
              ? "Safe"
              : level.targetRanking <= 96
                ? "Bubble"
                : "At Risk",
      currentTier: level.careerStage,
      worldRank: level.targetRanking,
      oneYearRank: level.targetRanking,
    },
  };
}

function getCompetitionKeysForTournament(
  tournament: Tournament,
): CompetitionTableKey[] {
  if (tournament.type === "Amateur") {
    if (pathwayAgeLimit(tournament) != null) {
      return ["youth", "amateur"];
    }

    if (isDirectAmateurTourCardRoute(tournament)) {
      return ["amateur"];
    }
  }

  switch (tournament.rankingType) {
    case "World Ranking":
      return ["world", "oneYear"];
    case "One-Year":
      return ["oneYear"];
    case "Q Tour":
      return ["qTour"];
    case "Q School OOM":
      return ["qSchool"];
    case "Amateur":
      return ["amateur"];
    case "Youth":
      return ["youth"];
    case "Senior":
      return ["senior"];
    default:
      if (tournament.type === "Q Tour") return ["qTour"];
      if (tournament.type === "Q School") return ["qSchool"];
      if (tournament.type === "Senior") return ["senior"];
      if (tournament.type === "Amateur") return ["amateur"];
      if (
        tournament.type === "Junior" ||
        tournament.type === "Regional Youth" ||
        tournament.type === "National Youth"
      )
        return ["youth"];
      if (tournament.type === "Invitational") return ["world"];
      if (
        tournament.type === "Professional Tour" ||
        tournament.type === "Ranking" ||
        tournament.type === "Major"
      )
        return ["world", "oneYear"];
      return [];
  }
}

function tournamentAwardsCareerTitle(
  tournament: Pick<Tournament, "name" | "format" | "type">,
) {
  const eventDescription = tournament.name;
  return (
    tournament.type !== "Q School" &&
    tournament.type !== "Exhibition" &&
    !/qualif(?:ier|ication|ying)/i.test(eventDescription) &&
    !/play[ -]?off/i.test(eventDescription)
  );
}

function historyEntryAwardsCareerTitle(
  entry: TournamentHistoryEntry,
  tournaments: Tournament[],
) {
  if (entry.result !== "Winner") return false;
  const tournament = tournaments.find(
    (event) =>
      event.id === entry.tournamentId || event.name === entry.tournamentName,
  );
  if (tournament) return tournamentAwardsCareerTitle(tournament);

  return (
    entry.eventType !== "Q School" &&
    entry.eventType !== "Exhibition" &&
    !/qualif(?:ier|ication|ying)|play[ -]?off/i.test(entry.tournamentName)
  );
}

function formatSeasonLabel(startYear: number) {
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
}

function getSeasonStartYearForDate(dateString: string) {
  const year = Number(dateString.slice(0, 4));

  return dateString.slice(5) >= "06-30" ? year : year - 1;
}

function getSeasonLabelForDate(dateString: string) {
  return formatSeasonLabel(getSeasonStartYearForDate(dateString));
}

function getTournamentSeasonStartYear(tournaments: Tournament[]) {
  const anchorDate = tournaments
    .map((tournament) => tournament.startDate)
    .sort()[0];

  return anchorDate
    ? getSeasonStartYearForDate(anchorDate)
    : getSeasonStartYearForDate(new Date().toISOString().slice(0, 10));
}

function getSeasonLabelForTournaments(tournaments: Tournament[]) {
  return formatSeasonLabel(getTournamentSeasonStartYear(tournaments));
}

function getNextSeasonStartDate(tournaments: Tournament[]) {
  return `${getTournamentSeasonStartYear(tournaments) + 1}-06-30`;
}

function addYears(dateString: string, years: number) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString().slice(0, 10);
}

function normalizeTournamentStatusForSeason() {
  return "Available";
}

function buildTournamentScheduleForSeason(
  seasonStartYear: number,
): Tournament[] {
  return tournamentCatalog.map((tournament) => {
    const yearOffset =
      seasonStartYear - getSeasonStartYearForDate(tournament.startDate);
    return {
      ...tournament,
      startDate: addYears(tournament.startDate, yearOffset),
      endDate: tournament.endDate
        ? addYears(tournament.endDate, yearOffset)
        : undefined,
      status: normalizeTournamentStatusForSeason() as Tournament["status"],
    };
  });
}

function getTournamentHistoryId(season: string, tournamentId: string) {
  return `${season}-${tournamentId}`;
}

function buildTournamentHistoryCanonicalResult(
  tournament: Tournament,
  resultLabel: string,
  prizeMoney: number,
  rankingPoints: number,
  playedRounds?: string[],
) {
  const rankingTitleEligible =
    isProfessionalEventType(tournament.eventClass ?? tournament.type) &&
    !/qualifying/i.test(tournament.name) &&
    tournament.type !== "Q School";
  const majorTitleEligible =
    isMajorCareerEvent({
      eventType: tournament.eventClass ?? tournament.type,
      tournamentName: tournament.name,
    }) && !/qualifying/i.test(tournament.name);
  const worldTitleEligible = isWorldChampionshipMainDrawName(tournament.name);

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
  );
}

function createTournamentHistoryEntry(
  tournament: Tournament,
  season: string,
): TournamentHistoryEntry {
  const potentialTourCardReward =
    tournament.type === "Q School" ||
    tournament.name.toLowerCase().includes("play-off") ||
    /tour card|wst card|professional tour card/i.test(tournament.reward ?? "");
  const reward = potentialTourCardReward ? undefined : tournament.reward;

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
    status:
      tournament.status === "Completed"
        ? "Completed"
        : tournament.status === "Entered"
          ? "Entered"
          : tournament.status === "Booked"
            ? "Booked"
            : tournament.status === "Skipped"
              ? "Skipped"
              : tournament.status === "High Cost"
                ? "High Cost"
                : "Entered",
    result:
      tournament.status === "Completed"
        ? "Completed"
        : tournament.status === "Skipped"
          ? "Skipped"
          : tournament.status === "High Cost"
            ? "High-cost event not entered"
            : "Entered",
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
    canonicalResult: buildTournamentHistoryCanonicalResult(
      tournament,
      tournament.status === "Skipped"
        ? "Skipped"
        : tournament.status === "Completed"
          ? "Completed"
          : tournament.status === "High Cost"
            ? "High-cost event not entered"
            : "Entered",
      0,
      0,
    ),
  };
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
  );

  return {
    ...entry,
    canonicalResult,
    matchesPlayed: canonicalResult.matchesPlayed,
    wins: canonicalResult.wins,
    losses: canonicalResult.losses,
    prizeMoney: canonicalResult.prizeMoney,
    rankingPoints: canonicalResult.rankingPoints,
  };
}

function getTournamentHistoryCanonicalResult(entry: TournamentHistoryEntry) {
  if (entry.canonicalResult) {
    return entry.canonicalResult;
  }

  const catalogTournament = tournamentCatalog.find(
    (tournament) => tournament.id === entry.tournamentId,
  );
  if (catalogTournament) {
    return buildTournamentHistoryCanonicalResult(
      catalogTournament,
      entry.result,
      entry.prizeMoney,
      entry.rankingPoints,
    );
  }

  const roundReached = getTournamentHistoryRoundReached(entry) ?? entry.result;
  const finishFlags = getCanonicalFinishFlags(roundReached, entry.result);

  return {
    tournamentId: entry.tournamentId,
    tournamentName: entry.tournamentName,
    fieldSize: null,
    roundReached,
    resultLabel: entry.result,
    matchesPlayed: isNonCompetitiveTournamentResult(entry.result)
      ? 0
      : entry.matchesPlayed,
    wins: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.wins,
    losses: isNonCompetitiveTournamentResult(entry.result) ? 0 : entry.losses,
    isTitle: finishFlags.isTitle,
    isFinal: finishFlags.isFinal,
    isSemiFinal: finishFlags.isSemiFinal,
    isQuarterFinal: finishFlags.isQuarterFinal,
    isDeepRun: finishFlags.isDeepRun,
    isRankingTitle:
      finishFlags.isTitle && isProfessionalEventType(entry.eventType),
    isMajorTitle: finishFlags.isTitle && isMajorCareerEvent(entry),
    isWorldTitle:
      finishFlags.isTitle &&
      isWorldChampionshipMainDrawName(entry.tournamentName),
    prizeMoney: isNonCompetitiveTournamentResult(entry.result)
      ? 0
      : entry.prizeMoney,
    rankingPoints: isNonCompetitiveTournamentResult(entry.result)
      ? 0
      : entry.rankingPoints,
  };
}

function upsertTournamentHistoryEntry(
  entries: TournamentHistoryEntry[],
  entry: TournamentHistoryEntry,
) {
  const withoutExisting = entries.filter((item) => item.id !== entry.id);
  return retainTournamentArchive([entry, ...withoutExisting]);
}

function finalizeTournamentHistoryForSeason(
  entries: TournamentHistoryEntry[],
  tournaments: Tournament[],
  season: string,
) {
  return tournaments.reduce((nextEntries, tournament) => {
    if (tournament.status === "Available") return nextEntries;

    const existing = nextEntries.find(
      (item) => item.id === getTournamentHistoryId(season, tournament.id),
    );
    const baseEntry =
      existing ?? createTournamentHistoryEntry(tournament, season);
    const result =
      existing?.result ??
      (tournament.status === "Skipped"
        ? "Skipped"
        : tournament.status === "Completed"
          ? "Completed"
          : tournament.status === "Booked"
            ? "Completed"
            : tournament.status === "Entered"
              ? "Season ended before completion"
              : "High-cost event not entered");

    return upsertTournamentHistoryEntry(
      nextEntries,
      synchronizeTournamentHistoryEntry(tournament, {
        ...baseEntry,
        status:
          tournament.status === "Completed" || tournament.status === "Booked"
            ? "Completed"
            : tournament.status === "Entered"
              ? "Completed"
              : baseEntry.status,
        result,
      }),
    );
  }, entries);
}

function getBestSeasonResult(entries: TournamentHistoryEntry[]) {
  const bestTier = entries.reduce(
    (best, entry) => Math.max(best, getTournamentHistoryFinishTier(entry)),
    0,
  );

  if (bestTier >= 5) return "Winner";
  if (bestTier >= 4) return "Finalist";
  if (bestTier >= 3) return "Semi Final";
  if (bestTier >= 2) return "Quarter Final";
  if (
    entries.some(
      (entry) => getTournamentHistoryCanonicalResult(entry).matchesPlayed > 0,
    )
  )
    return "Match wins logged";
  return "No deep run recorded";
}

function getQSchoolCampaignCount(entries: TournamentHistoryEntry[]) {
  return entries.some((entry) => entry.eventType === "Q School") ? 1 : 0;
}

function normalizeTournamentHistoryType(
  eventType: TournamentHistoryEntry["eventType"],
): Tournament["type"] {
  return eventType === "Professional"
    ? "Professional Tour"
    : (eventType ?? "Amateur");
}

function normalizeTournamentHistoryEventClass(
  eventType: TournamentHistoryEntry["eventType"],
): Tournament["eventClass"] {
  if (eventType === "Professional Tour" || eventType === "Ranking") {
    return "Professional";
  }

  return eventType ?? "Amateur";
}

function getTournamentHistoryRoundReached(
  entry: Pick<
    TournamentHistoryEntry,
    | "tournamentId"
    | "formatId"
    | "tournamentName"
    | "eventType"
    | "stageId"
    | "result"
  >,
) {
  const catalogTournament = tournamentCatalog.find(
    (tournament) => tournament.id === entry.tournamentId,
  );
  const expectation = getTournamentResultExpectation(
    {
      name: entry.tournamentName,
      type:
        catalogTournament?.type ??
        normalizeTournamentHistoryType(entry.eventType ?? "Amateur"),
      eventClass:
        catalogTournament?.eventClass ??
        normalizeTournamentHistoryEventClass(entry.eventType),
      rankingType: catalogTournament?.rankingType,
      stageId: entry.stageId ?? catalogTournament?.stageId,
      formatId: entry.formatId ?? catalogTournament?.formatId ?? undefined,
    },
    entry.result,
  );

  return expectation?.roundReached ?? null;
}

function getFinishTierFromRoundReached(
  roundReached: string | null | undefined,
  result: string,
) {
  if (/winner|champion/i.test(result)) return 5;

  const normalizedRound = normalizeTournamentRoundLabel(roundReached ?? "");

  if (normalizedRound === "final") return 4;
  if (normalizedRound === "semi final") return 3;
  if (normalizedRound === "quarter final") return 2;
  if (normalizedRound === "last 16") return 1;

  if (/quarter/i.test(result)) return 2;
  if (/semi/i.test(result)) return 3;
  if (/(^|\s)final(ist)?(\s|$)/i.test(result)) return 4;
  if (/last 16/i.test(result)) return 1;

  return 0;
}

function getTournamentHistoryFinishTier(
  entry: Pick<
    TournamentHistoryEntry,
    | "tournamentId"
    | "formatId"
    | "tournamentName"
    | "eventType"
    | "stageId"
    | "result"
  >,
) {
  return getFinishTierFromRoundReached(
    getTournamentHistoryRoundReached(entry),
    entry.result,
  );
}

function isProfessionalFinalLevelRun(entry: TournamentHistoryEntry) {
  return (
    isProfessionalEventType(entry.eventType) &&
    (getTournamentHistoryFinishTier(entry) >= 4 ||
      entry.result === "Winner" ||
      (entry.matchesPlayed >= 4 && entry.wins >= 3 && entry.losses >= 1))
  );
}

function isDeepRunResult(entry: TournamentHistoryEntry) {
  return getTournamentHistoryFinishTier(entry) >= 3;
}

function calculateCurrentEffectiveStrength(
  state: Pick<GameState, "attributes" | "player" | "equipment">,
) {
  const technical = calculateTechnicalAverage(state.attributes.technical);
  const mental = calculateAverage(Object.values(state.attributes.mental));
  const physical = calculateAverage(Object.values(state.attributes.physical));

  return calculateMatchStrength({
    technical,
    mental,
    physical,
    confidence: state.player.confidence,
    fatigue: state.player.fatigue,
    equipmentBonus: getCurrentCueBonus(state.equipment),
  });
}

function getQTourEligibilityAssessment(state: GameState, season: string) {
  const activeSeasonEvents = state.history.tournamentHistory.filter(
    (entry) =>
      entry.season === season &&
      (getTournamentHistoryCanonicalResult(entry).matchesPlayed > 0 ||
        entry.status === "In Progress"),
  );
  const qTourEvents = activeSeasonEvents.filter(
    (entry) => entry.eventType === "Q Tour",
  );
  const eliteAmateurEvents = activeSeasonEvents.filter(
    (entry) => entry.eventType === "Amateur",
  );
  const qTourRank = state.careerSystems.qTour.playerRank ?? 999;
  const qTourPoints = state.careerSystems.qTour.playerPoints ?? 0;
  const qTourDeepRuns = qTourEvents.filter((entry) =>
    isDeepRunResult(entry),
  ).length;
  const eliteAmateurDeepRuns = eliteAmateurEvents.filter((entry) =>
    isDeepRunResult(entry),
  ).length;
  const qTourFinals = qTourEvents.filter(
    (entry) => getTournamentHistoryFinishTier(entry) >= 4,
  ).length;
  const qTourWins = qTourEvents.filter(
    (entry) => entry.result === "Winner",
  ).length;
  const qTourMatchesPlayed = qTourEvents.reduce(
    (sum, entry) =>
      sum + getTournamentHistoryCanonicalResult(entry).matchesPlayed,
    0,
  );
  const qTourWinsTotal = qTourEvents.reduce(
    (sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).wins,
    0,
  );
  const qTourWinRate =
    qTourMatchesPlayed > 0 ? (qTourWinsTotal / qTourMatchesPlayed) * 100 : 0;
  const effectiveStrength = calculateCurrentEffectiveStrength(state);
  const previousTop16Streak = state.careerSystems.qTour.top16Streak ?? 0;
  const previousTop8Streak = state.careerSystems.qTour.top8Streak ?? 0;
  const previousTop2Streak = state.careerSystems.qTour.top2Streak ?? 0;
  const top16Streak = qTourRank <= 16 ? previousTop16Streak + 1 : 0;
  const top8Streak = qTourRank <= 8 ? previousTop8Streak + 1 : 0;
  const top2Streak = qTourRank <= 2 ? previousTop2Streak + 1 : 0;
  const rankScore =
    qTourRank <= 2
      ? 92
      : qTourRank <= 4
        ? 62
        : qTourRank <= 8
          ? 34
          : qTourRank <= 16
            ? 16
            : 0;
  const pointsScore = Math.min(72, Math.round(qTourPoints * 0.24));
  const deepRunScore = Math.min(
    64,
    qTourDeepRuns * 20 + eliteAmateurDeepRuns * 12,
  );
  const finalsScore = qTourFinals * 34;
  const winScore = qTourWins * 95 + Math.round(qTourWinRate * 0.75);
  const reputationScore = Math.max(
    0,
    Math.round((state.player.reputation - 50) * 0.25),
  );
  const strengthScore =
    effectiveStrength > 170
      ? 30
      : effectiveStrength > 150
        ? 22
        : effectiveStrength > 130
          ? 10
          : 0;
  const streakScore =
    (top16Streak >= 2 ? 18 : 0) +
    (top8Streak >= 2 ? 16 : 0) +
    (top2Streak >= 2 ? 26 : 0);
  const score =
    rankScore +
    pointsScore +
    deepRunScore +
    finalsScore +
    winScore +
    reputationScore +
    strengthScore +
    streakScore;
  const top2Route = qTourRank <= 2;
  const top8DeepRunRoute =
    qTourRank <= 8 && qTourDeepRuns + eliteAmateurDeepRuns >= 2;
  const top16ConsistencyRoute = top16Streak >= 2;
  const finalsRoute = qTourFinals >= 1;
  const winRoute = qTourWins >= 1;
  const rawCampaignEligible =
    score >= 100 ||
    top2Route ||
    top8DeepRunRoute ||
    top16ConsistencyRoute ||
    finalsRoute ||
    winRoute;
  const seededCampaign =
    score >= 160 ||
    top2Route ||
    (qTourRank <= 4 && qTourFinals >= 1) ||
    winRoute;
  const directPlayoffEligible =
    score >= 230 || winRoute || (qTourRank <= 2 && qTourFinals >= 1);
  const qualifiedBy = directPlayoffEligible
    ? "Q Tour qualification"
    : seededCampaign
      ? "Seeded Q School route"
      : rawCampaignEligible
        ? "Q Tour consistency route"
        : null;

  return {
    score,
    rawCampaignEligible,
    seededCampaign,
    directPlayoffEligible,
    qualifiedBy,
    top16Streak,
    top8Streak,
    top2Streak,
  };
}

function appendSeasonRecord(
  records: CareerSeasonRecord[],
  record: CareerSeasonRecord,
) {
  const withoutExisting = records.filter(
    (item) => item.season !== record.season,
  );
  return [record, ...withoutExisting].slice(0, SEASON_RECORD_LIMIT);
}

function seedPathwayFallbackRow(
  rows: CompetitionTableRow[],
  player: Player,
  points: number,
  statusNote: string,
) {
  const playerName = player.fullName;
  const withoutPlayer = rows.filter((row) => row.playerName !== playerName);
  const fallbackRow: CompetitionTableRow = {
    ...createCompetitionDefaultRow(
      playerName,
      getNationCode(player.nationality),
      withoutPlayer.length + 1,
    ),
    points,
    prizeMoney: Math.max(0, Math.round(points * 0.25)),
    eventsPlayed: 0,
    wins: 0,
    losses: 0,
    titles: 0,
    statusNote,
  };

  return rerankCompetitionRows([...withoutPlayer, fallbackRow], playerName);
}

function seedLostCardFallbackCompetitionTables(
  tables: CompetitionTablesState,
  player: Player,
): CompetitionTablesState {
  return {
    ...tables,
    amateur: seedPathwayFallbackRow(
      tables.amateur,
      player,
      260,
      "Lost-card amateur fallback",
    ),
    qTour: seedPathwayFallbackRow(
      tables.qTour,
      player,
      180,
      "Lost-card Q Tour fallback",
    ),
    qSchool: seedPathwayFallbackRow(
      tables.qSchool,
      player,
      140,
      "Lost-card Q School route",
    ),
  };
}

function removeOveragePlayerFromYouthTable(
  tables: CompetitionTablesState,
  player: Player,
): CompetitionTablesState {
  if (
    player.age <= 21 ||
    !tables.youth.some((row) => row.playerName === player.fullName)
  ) {
    return tables;
  }

  return {
    ...tables,
    youth: rerankCompetitionRows(
      tables.youth.filter((row) => row.playerName !== player.fullName),
      player.fullName,
    ),
  };
}

function getDisplayedRanking(
  state: Pick<
    GameState,
    "player" | "careerSystems" | "competitionTables" | "rankings"
  > &
    Partial<Pick<GameState, "history">>,
) {
  const worldRanking =
    state.careerSystems.pro.worldRank ??
    state.competitionTables.world.find(
      (row) => row.playerName === state.player.fullName,
    )?.ranking ??
    state.player.worldRanking ??
    null;
  const effectiveWorldRanking =
    worldRanking;
  const qSchoolRanking =
    state.competitionTables.qSchool.find(
      (row) => row.playerName === state.player.fullName,
    )?.ranking ??
    state.careerSystems.qSchool.playerRank ??
    null;
  const qTourRanking =
    state.competitionTables.qTour.find(
      (row) => row.playerName === state.player.fullName,
    )?.ranking ??
    state.careerSystems.qTour.playerRank ??
    null;
  const amateurRanking =
    state.competitionTables.amateur.find(
      (row) => row.playerName === state.player.fullName,
    )?.ranking ??
    state.player.amateurRanking ??
    null;
  const seniorRanking =
    state.competitionTables.senior.find(
      (row) => row.playerName === state.player.fullName,
    )?.ranking ??
    state.player.seniorRanking ??
    null;
  const youthRanking =
    state.competitionTables.youth.find(
      (row) => row.playerName === state.player.fullName,
    )?.ranking ?? null;

  if (state.careerSystems.lateCareer.retired) {
    return { ranking: 999, rankingLabel: "Retired" };
  }

  if (
    state.careerSystems.lateCareer.seniorActive ||
    state.player.rankingLabel === "Senior Ranking"
  ) {
    return { ranking: seniorRanking ?? 999, rankingLabel: "Senior Ranking" };
  }

  if (
    state.careerSystems.pro.hasTourCard ||
    (effectiveWorldRanking ?? 999) <= 64 ||
    state.player.rankingLabel === "World Ranking"
  ) {
    return {
      ranking: effectiveWorldRanking ?? 999,
      rankingLabel: "World Ranking",
    };
  }

  if (
    (qSchoolRanking ?? 999) < 999 ||
    state.player.rankingLabel === "Q School Ranking"
  ) {
    return { ranking: qSchoolRanking ?? 999, rankingLabel: "Q School Ranking" };
  }

  if (
    (qTourRanking ?? 999) < 999 ||
    state.player.rankingLabel === "Q Tour Ranking" ||
    state.player.careerStage.toLowerCase().includes("q tour")
  ) {
    return { ranking: qTourRanking ?? 999, rankingLabel: "Q Tour Ranking" };
  }

  if (
    (youthRanking ?? 999) < 999 &&
    state.player.age < 21 &&
    /youth|junior/i.test(state.player.careerStage)
  ) {
    return { ranking: youthRanking ?? 999, rankingLabel: "Youth Ranking" };
  }

  return { ranking: amateurRanking ?? 999, rankingLabel: "Amateur Ranking" };
}

function createSeasonRecord(
  state: GameState,
  season: string,
): CareerSeasonRecord {
  const seasonSnapshots = state.history.snapshots.filter(
    (snapshot) => snapshot.season === season,
  );
  const seasonEvents = state.history.tournamentHistory.filter(
    (entry) => entry.season === season,
  );
  const activeSeasonEvents = seasonEvents.filter(
    (entry) =>
      getTournamentHistoryCanonicalResult(entry).matchesPlayed > 0 ||
      entry.status === "In Progress",
  );
  const qSchoolEvents = activeSeasonEvents.filter(
    (entry) => entry.eventType === "Q School",
  );
  const openingSnapshot = seasonSnapshots[0];
  const closingSnapshot = seasonSnapshots.at(-1);
  const currentRankingDisplay = getDisplayedRanking(state);
  const matchesPlayed = activeSeasonEvents.reduce(
    (sum, entry) =>
      sum + getTournamentHistoryCanonicalResult(entry).matchesPlayed,
    0,
  );
  const wins = activeSeasonEvents.reduce(
    (sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).wins,
    0,
  );
  const losses = activeSeasonEvents.reduce(
    (sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).losses,
    0,
  );
  const prizeMoney = activeSeasonEvents.reduce(
    (sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).prizeMoney,
    0,
  );
  const rankingPoints = activeSeasonEvents.reduce(
    (sum, entry) =>
      sum + getTournamentHistoryCanonicalResult(entry).rankingPoints,
    0,
  );
  const qSchoolCardWins = qSchoolEvents.filter((entry) =>
    entry.reward?.toLowerCase().includes("tour card"),
  ).length;
  const totalTourCardWins = seasonEvents.filter((entry) =>
    entry.reward?.toLowerCase().includes("tour card"),
  ).length;
  const qSchoolMatchesWon = qSchoolEvents.reduce(
    (sum, entry) => sum + getTournamentHistoryCanonicalResult(entry).wins,
    0,
  );

  return {
    season,
    startedOn: openingSnapshot?.date ?? state.currentDate,
    endedOn: closingSnapshot?.date ?? state.currentDate,
    openingRanking: openingSnapshot?.ranking ?? currentRankingDisplay.ranking,
    openingRankingLabel:
      openingSnapshot?.rankingLabel ?? currentRankingDisplay.rankingLabel,
    closingRanking: closingSnapshot?.ranking ?? currentRankingDisplay.ranking,
    closingRankingLabel:
      closingSnapshot?.rankingLabel ?? currentRankingDisplay.rankingLabel,
    matchesPlayed,
    wins,
    losses,
    prizeMoney,
    rankingPoints,
    highestBreak: seasonEvents.reduce(
      (best, entry) => Math.max(best, entry.highestBreak),
      0,
    ),
    centuries: seasonEvents.reduce((sum, entry) => sum + entry.centuries, 0),
    titles: seasonEvents.filter((entry) => entry.result === "Winner").length,
    majorTitles: seasonEvents.filter(
      (entry) => entry.result === "Winner" && entry.eventType === "Major",
    ).length,
    qTourWins: seasonEvents.filter(
      (entry) => entry.result === "Winner" && entry.eventType === "Q Tour",
    ).length,
    qSchoolEventsEntered: qSchoolEvents.length,
    qSchoolCampaignsEntered: getQSchoolCampaignCount(qSchoolEvents),
    qSchoolMatchesWon,
    qSchoolCardsWon: qSchoolCardWins,
    tourCardsWon: totalTourCardWins,
    bestResult: getBestSeasonResult(seasonEvents),
  };
}

function applySeasonRollover(state: GameState) {
  state = enrichTournamentMessages(state);
  state = preserveSeasonStartEmails(state, getTournamentEntryAccess);
  state = ensureSeasonClock(state);
  const archivedTournamentHistory = finalizeTournamentHistoryForSeason(
    state.history.tournamentHistory,
    state.tournaments,
    state.season,
  );
  const archivedState = {
    ...state,
    history: {
      ...state.history,
      tournamentHistory: archivedTournamentHistory,
    },
  };
  const seasonRecord = createSeasonRecord(archivedState, state.season);
  const qTourEligibility = getQTourEligibilityAssessment(
    archivedState,
    state.season,
  );
  const nextSeasonStartYear =
    getTournamentSeasonStartYear(state.tournaments) + 1;
  const nextSeasonLabel = formatSeasonLabel(nextSeasonStartYear);
  const rawCurrentWorldRank =
    state.competitionTables.world.find(
      (row) => row.playerName === state.player.fullName,
    )?.ranking ??
    state.careerSystems.pro.worldRank ??
    state.player.worldRanking ??
    999;
  const currentWorldRank = rawCurrentWorldRank;
  const currentHasTourCard =
    state.careerSystems.pro.hasTourCard || currentWorldRank <= 64;
  const qTourPromotionEligible = state.history.tournamentHistory.some(e => e.season === state.season && e.eventType === 'Q Tour' && /tour card/i.test(e.reward ?? ''));
  const qTourRankingCardEligible = qTourQualification(archivedState).automatic === state.player.fullName;
  const awardedQTourCard =
    !currentHasTourCard && (qTourPromotionEligible || qTourRankingCardEligible);
  const awardedQSchoolCard =
    !currentHasTourCard && seasonRecord.qSchoolCardsWon > 0;
  const federationCardEvent = state.history.tournamentHistory.find(
    (entry) =>
      entry.season === state.season &&
      entry.eventType === "Amateur" &&
      entry.reward?.toLowerCase().includes("tour card"),
  );
  const awardedFederationCard =
    !currentHasTourCard && (federationCardEvent != null || pathwayCardAwards(archivedState).get(state.player.fullName) === 'Federation Route');
  const rankingRetentionSafe = currentWorldRank <= TOP_64_RANK_CUTOFF;
  const retainedCard = currentHasTourCard && rankingRetentionSafe;
  const protectedCardSeason =
    state.careerSystems.pro.hasTourCard &&
    !rankingRetentionSafe &&
    state.careerSystems.pro.yearsRemaining > 1;
  const lostCard =
    currentHasTourCard && !rankingRetentionSafe && !protectedCardSeason;
  const playerHasTourCardNextSeason =
    awardedQTourCard ||
    awardedQSchoolCard ||
    awardedFederationCard ||
    retainedCard ||
    protectedCardSeason;
  const previousEligibilityWindow = Math.max(
    0,
    (state.careerSystems.qSchool.eligibilitySeasonsRemaining ?? 0) - 1,
  );
  const reducedQSchoolCooldown = Math.max(
    0,
    (state.careerSystems.qSchool.cooldownSeasonsRemaining ?? 0) - 1,
  );
  const failedQSchoolCampaign =
    seasonRecord.qSchoolCampaignsEntered > 0 &&
    seasonRecord.qSchoolCardsWon === 0;
  const qSchoolCooldown = failedQSchoolCampaign
    ? qTourEligibility.directPlayoffEligible
      ? 1
      : 2
    : reducedQSchoolCooldown;
  const lostCardFallbackEligible = lostCard && state.player.age < 45;
  const unlockedEligibilityWindow =
    qTourEligibility.rawCampaignEligible || lostCardFallbackEligible ? 1 : 0;
  const qSchoolEligibilityWindow = Math.max(
    previousEligibilityWindow,
    unlockedEligibilityWindow,
  );
  const qSchoolCampaignEligible =
    !playerHasTourCardNextSeason &&
    qSchoolEligibilityWindow > 0 &&
    (qSchoolCooldown === 0 || qTourEligibility.directPlayoffEligible);
  const qSchoolSeededEligible =
    !playerHasTourCardNextSeason &&
    (qTourEligibility.seededCampaign || lostCardFallbackEligible) &&
    (qSchoolCooldown === 0 || qTourEligibility.directPlayoffEligible);
  const qSchoolDirectPlayoffEligible =
    !playerHasTourCardNextSeason && qTourEligibility.directPlayoffEligible;
  const rawRolledCompetitionTables = rollCompetitionTablesForward(
    state.competitionTables,
    state.player.fullName,
    state.worldPlayers,
    Boolean(state.rollingRankings),
  );
  const fallbackCompetitionTables =
    lostCardFallbackEligible && !playerHasTourCardNextSeason
      ? seedLostCardFallbackCompetitionTables(
          rawRolledCompetitionTables,
          state.player,
        )
      : rawRolledCompetitionTables;
  const rolledCompetitionTables = enforcePathwayRankingProofFloors(
    fallbackCompetitionTables,
    state.player.fullName,
    seasonRecord,
    state.player.age,
  );
  const nextYearsRemaining =
    awardedQTourCard || awardedQSchoolCard || awardedFederationCard
      ? 2
      : retainedCard
        ? 0
        : protectedCardSeason
          ? Math.max(0, state.careerSystems.pro.yearsRemaining - 1)
          : 0;
  const nextCurrentYear = playerHasTourCardNextSeason
    ? nextYearsRemaining >= 2
      ? 1
      : nextYearsRemaining === 1
        ? 2
        : 0
    : 0;
  const nextExpiresAfterSeason =
    playerHasTourCardNextSeason && nextYearsRemaining > 0
      ? formatSeasonLabel(nextSeasonStartYear + nextYearsRemaining - 1)
      : null;
  const careerSystemsSeed: CareerSystemsState = {
    ...state.careerSystems,
    qTour: {
      ...state.careerSystems.qTour,
      top16Streak: qTourEligibility.top16Streak,
      top8Streak: qTourEligibility.top8Streak,
      top2Streak: qTourEligibility.top2Streak,
      eligibilityScore: qTourEligibility.score,
      directCardAwarded:
        state.careerSystems.qTour.directCardAwarded || awardedQTourCard,
      playOffEligible: qSchoolDirectPlayoffEligible,
    },
    qSchool: {
      ...state.careerSystems.qSchool,
      repeatedFailures: awardedQSchoolCard
        ? 0
        : state.careerSystems.qSchool.repeatedFailures,
      eligibilityScore: qTourEligibility.score,
      campaignEligible: qSchoolCampaignEligible,
      seededCampaign: qSchoolSeededEligible,
      directPlayoffEligible: qSchoolDirectPlayoffEligible,
      eligibilitySeasonsRemaining: qSchoolEligibilityWindow,
      cooldownSeasonsRemaining: qSchoolCooldown,
      qualifiedBy:
        qSchoolCampaignEligible ||
        qSchoolSeededEligible ||
        qSchoolDirectPlayoffEligible
          ? lostCardFallbackEligible
            ? "Tour card fallback route"
            : qTourEligibility.qualifiedBy
          : null,
      topUpEligible: false,
      slumpRisk: false,
    },
    pro: {
      ...state.careerSystems.pro,
      hasTourCard: playerHasTourCardNextSeason,
      cardSource: awardedQTourCard
        ? "Q Tour"
        : awardedQSchoolCard
          ? "Q School"
          : awardedFederationCard
            ? "Federation Route"
            : retainedCard
              ? "Ranking Retained"
              : protectedCardSeason
                ? (state.careerSystems.pro.cardSource ?? "Unknown")
                : null,
      currentYear: nextCurrentYear,
      yearsRemaining: nextYearsRemaining,
      expiresAfterSeason: nextExpiresAfterSeason,
      retainedViaRanking: retainedCard,
      awardedBy: awardedQTourCard
        ? "Q Tour playoff route"
        : awardedQSchoolCard
          ? "Q School campaign win"
          : awardedFederationCard
            ? (federationCardEvent?.tournamentName ?? "Federation qualification from recorded results")
            : lostCard
              ? state.careerSystems.pro.awardedBy
              : state.careerSystems.pro.awardedBy,
      tourSurvivalStatus: retainedCard
        ? "Safe"
        : protectedCardSeason
          ? currentWorldRank <= 96
            ? "Bubble"
            : "At Risk"
          : lostCard
            ? "Lost Card"
            : state.careerSystems.pro.tourSurvivalStatus,
    },
  };
  const attributesForNextSeason = applySeasonalAgeRegression(
    state.attributes,
    state.player.age,
    playerDecline({id:"human",declineProfile:state.player.declineProfile},state.worldSeed),
  );
  const playerForNextSeason: Player = {
    ...state.player,
    age: state.player.age + 1,
    worldRanking:
      rolledCompetitionTables.world.find(
        (row) => row.playerName === state.player.fullName,
      )?.ranking ?? state.player.worldRanking,
    amateurRanking:
      rolledCompetitionTables.amateur.find(
        (row) => row.playerName === state.player.fullName,
      )?.ranking ?? state.player.amateurRanking,
    seniorRanking:
      rolledCompetitionTables.senior.find(
        (row) => row.playerName === state.player.fullName,
      )?.ranking ?? state.player.seniorRanking,
  };
  const archivedWorldPlayers = archiveWorldPlayersForSeason(
    state.worldPlayers,
    state.competitionTables,
    state.season,
    state.player.fullName,
    careerSystemsSeed.pro.currentTier,
    state.player,
    seasonRecord,
    state,
  );
  const nextWorldPlayers = evolveWorldPlayersForNextSeason(
    archivedWorldPlayers,
    state.competitionTables,
    playerForNextSeason,
    playerHasTourCardNextSeason,
    careerSystemsSeed.pro,
    nextSeasonStartYear,
    pathwayCardAwards(archivedState),
    state.worldSeed,
  );
  const livingCompetitionTables = rebuildLivingCompetitionTables(
    rolledCompetitionTables,
    nextWorldPlayers,
    state.player.fullName,
    nextSeasonStartYear,
  );
  const flooredLivingCompetitionTables = enforcePathwayRankingProofFloors(
    livingCompetitionTables,
    state.player.fullName,
    seasonRecord,
    state.player.age,
  );
  const ageEligibleCompetitionTables = removeOveragePlayerFromYouthTable(
    flooredLivingCompetitionTables,
    playerForNextSeason,
  );
  const rebuiltCompetitionTables = rebuildRollingRankings({ ...state, season: formatSeasonLabel(nextSeasonStartYear), competitionTables: ageEligibleCompetitionTables }, state.currentDate, false).competitionTables;
  const syncedCareerSystems = syncCareerSystems({
    competitionTables: rebuiltCompetitionTables,
    player: playerForNextSeason,
    careerSystems: careerSystemsSeed,
    history: archivedState.history,
  });
  const careerSystems = syncedCareerSystems;
  const primaryKey = getPrimaryCompetitionKey({
    player: playerForNextSeason,
    careerSystems,
  });
  const retired = careerSystems.lateCareer.retired;
  const nextPlayer: Player = {
    ...playerForNextSeason,
    worldRanking:
      careerSystems.pro.worldRank ??
      rebuiltCompetitionTables.world.find(
        (row) => row.playerName === state.player.fullName,
      )?.ranking ??
      playerForNextSeason.worldRanking,
    amateurRanking:
      retired || primaryKey === "senior" || primaryKey === "world"
        ? null
        : (rebuiltCompetitionTables.amateur.find(
            (row) => row.playerName === state.player.fullName,
          )?.ranking ?? playerForNextSeason.amateurRanking),
    seniorRanking:
      rebuiltCompetitionTables.senior.find(
        (row) => row.playerName === state.player.fullName,
      )?.ranking ?? playerForNextSeason.seniorRanking,
    careerPhase: getCareerPhaseFromSystems(playerForNextSeason, careerSystems),
    competitiveStatus: getCareerStageFromSystems(
      playerForNextSeason,
      careerSystems,
      archivedState.history,
    ),
    careerStage: getCareerStageFromSystems(
      playerForNextSeason,
      careerSystems,
      archivedState.history,
    ),
    rankingLabel: retired
      ? "Retired"
      : getRankingLabelForCompetitionKey(primaryKey),
  };
  const nextSeasonSchedule = buildTournamentScheduleForSeason(nextSeasonStartYear);
  const verifiedWorldRank = nextPlayer.worldRanking ?? 999;
  const verifiedPlayer = nextPlayer;
  const verifiedCareerSystems = careerSystems;
  const previousWorldPlayers = new Map(
    state.worldPlayers.map((record) => [record.playerName, record]),
  );
  const promotedPlayers = nextWorldPlayers
    .filter((record) => {
      const previous = previousWorldPlayers.get(record.playerName);
      return record.hasTourCard && previous && !previous.hasTourCard;
    })
    .map(
      (record) => `${record.playerName} · ${record.cardSource ?? "Tour card"}`,
    )
    .slice(0, 6);
  const cardLosses = nextWorldPlayers
    .filter((record) => {
      const previous = previousWorldPlayers.get(record.playerName);
      return previous?.hasTourCard && !record.hasTourCard && !record.retired;
    })
    .map((record) => `${record.playerName} · card lost`)
    .slice(0, 6);
  const retirements = nextWorldPlayers
    .filter((record) => {
      const previous = previousWorldPlayers.get(record.playerName);
      return record.retired && previous && !previous.retired;
    })
    .map((record) => `${record.playerName} · age ${record.age}`)
    .slice(0, 6);
  const newcomers = nextWorldPlayers
    .filter((record) => !previousWorldPlayers.has(record.playerName))
    .map((record) => `${record.playerName} · age ${record.age}`)
    .slice(0, 6);
  // Preserve the closing standings before next-season tables are rebuilt.
  const finalRankings = state.competitionTables.world.map(row => ({ ranking: row.ranking, playerName: row.playerName, points: row.points }));
  const worldNumberOneRow = state.competitionTables.world[0];
  const worldNumberOne = worldNumberOneRow ? {
    playerName: worldNumberOneRow.playerName, nation: worldNumberOneRow.nation,
    titles: worldNumberOneRow.titles, wins: worldNumberOneRow.wins, losses: worldNumberOneRow.losses,
  } : null;
  const majorWinners = recordedSeasonWinners(archivedState);
  const seasonSnapshots = archivedState.history.snapshots.filter(
    (snapshot) => snapshot.season === state.season,
  );
  const financialChange =
    (seasonSnapshots.at(-1)?.cash ?? state.player.cash) -
    (seasonSnapshots[0]?.cash ?? state.player.cash);
  const careerDecision = retired
    ? {
        title: "Career retirement confirmed",
        detail:
          "Your competitive career has concluded and your final record is now archived.",
        expectation:
          "Review your legacy, records and place in snooker history.",
      }
    : awardedQTourCard || awardedQSchoolCard || awardedFederationCard
      ? {
          title: "Professional tour card earned",
          detail: `You qualified through ${verifiedCareerSystems.pro.cardSource ?? "the pathway system"} and enter ${nextSeasonLabel} as a professional.`,
          expectation:
            "Establish a safe ranking and build results across the main tour.",
        }
      : retainedCard || protectedCardSeason
        ? {
            title: "Professional tour card retained",
            detail: `Your World Ranking of #${verifiedWorldRank} keeps your professional career active for ${nextSeasonLabel}.`,
            expectation:
              verifiedWorldRank <= 16
                ? "Defend elite seeding and challenge for major titles."
                : verifiedWorldRank <= 64
                  ? "Improve your seeding and secure another season inside the Top 64."
                  : "Use the protected card season to climb back into ranking safety.",
          }
        : lostCard
          ? {
              title: "Professional tour card lost",
              detail: `Your closing World Ranking of #${currentWorldRank} was outside the retention places.`,
              expectation: qSchoolCampaignEligible
                ? "A Q School route is available to regain professional status."
                : "Rebuild through the available amateur and Q Tour pathway.",
            }
          : {
              title: `${nextPlayer.careerStage} pathway confirmed`,
              detail: `Your results place you on the ${nextPlayer.rankingLabel} pathway for ${nextSeasonLabel}.`,
              expectation: qSchoolCampaignEligible
                ? "A Q School campaign is available this season."
                : "Keep developing and target the next promotion threshold.",
            };

  const seasonReview: SeasonReviewTransition = {
      pending: true,
      completedSeason: seasonRecord,
      nextSeason: nextSeasonLabel,
      financialChange,
      careerDecision,
      worldNumberOne,
      majorWinners,
      finalRankings,
      promotedPlayers,
      cardLosses,
      retirements,
      newcomers,
    };

  const rolledState: GameState = {
    ...archivedState,
    player: verifiedPlayer,
    attributes: attributesForNextSeason,
    trainingCondition: {
      ...archivedState.trainingCondition,
      seasonStartAttributes: deepCloneAttributes(attributesForNextSeason),
    },
    season: nextSeasonLabel,
    seasonClock: rolloverSeasonClock(state,nextSeasonLabel),
    tournaments: nextSeasonSchedule,
    rankings: rebuiltCompetitionTables[primaryKey].map((row) => ({ ...row })),
    competitionTables: rebuiltCompetitionTables,
    worldPlayers: nextWorldPlayers,
    careerSystems: verifiedCareerSystems,
    tournamentProgress: createEmptyTournamentProgress(),
    travel: createEmptyTravelState(),
    history: {
      ...archivedState.history,
      seasonRecords: appendSeasonRecord(
        archivedState.history.seasonRecords,
        seasonRecord,
      ),
    },
    seasonReview,
    inbox: [
      createInboxMessage(
        {
          sender: "Career Manager",
          subject: `${state.season} end of season report ready`,
          seasonReport: createSeasonEndReport(seasonReview, archivedState),
          preview: `${seasonRecord.wins} wins from ${seasonRecord.matchesPlayed} matches · ${seasonRecord.titles} titles · £${seasonRecord.prizeMoney.toLocaleString("en-GB")} prize money. ${seasonRecord.closingRankingLabel} #${seasonRecord.closingRanking}. ${careerDecision.title}.`,
          priority: "High",
          actionLabel: "Open Season Review",
          actionRoute: "/season-review",
        },
        "Today",
      ),
      ...state.inbox,
    ].slice(0, 18),
  };
  const populatedState = ensureWorldPopulation(rolledState);
  return { ...populatedState, tourChangesReport: createSeasonTourChanges(populatedState, archivedState) };
}

/** Finish free weeks through the existing settlement clock; never skip an entry or decision. */
export function finishSeasonState(previousState: GameState): GameState {
  let state = initializeCareerDepth(previousState);
  if (state.seasonReview?.pending) return { ...state, seasonReview: { ...state.seasonReview, popupDismissed: false } };
  // More than enough for every daily boundary in a July-to-June season.
  for (let step = 0; step < 400; step++) {
    if (state.liveMatch?.status === 'In Progress') return { ...state, lastAction: 'Resume your live match before finishing the season.' };
    if (pendingStory(state)) return { ...state, lastAction: 'Season advance paused: choose a response to the career decision in your inbox, then continue.' };
    const event = getNextEligibleTournament(state);
    if (event) return { ...state, lastAction: 'Season advance paused: ' + event.name + ' is available. Play or skip it in the calendar before finishing the season.' };
    const before = state;
    state = advanceWeekState(state);
    if (state.seasonReview?.pending) return state;
    if (state.currentDate === before.currentDate) return state;
  }
  return { ...state, lastAction: 'Season advance paused. Review your calendar before continuing.' };
}

export function startNextSeasonState(previousState: GameState): GameState {
  previousState = preserveSeasonEmails(previousState);
  if (!previousState.seasonReview?.pending) {
    return finalizeState(
      previousState,
      "There is no new season waiting to start.",
    );
  }

  const unlockedState: GameState = {
    ...previousState,
    seasonReview: null,
  };
  const firstTournament = getNextEligibleTournament(unlockedState);

  return finalizeState(
    {
      ...unlockedState,
      inbox: [
        ...(firstTournament
          ? [
              createTournamentInvitationMessage(
                firstTournament,
                unlockedState.currentDate,
                "season",
              ),
            ]
          : []),
        createInboxMessage(
          {
            sender: "Career Manager",
            subject: `${unlockedState.season} season started`,
            seasonStartReport: createSeasonStartReport(unlockedState, getTournamentEntryAccess),
            preview: `${unlockedState.player.careerStage} · £${unlockedState.player.cash.toLocaleString("en-GB")} available. ${firstTournament ? `Next: ${firstTournament.name}.` : "No eligible event is currently available."} Your season briefing includes entry dates and last season’s tournament finishes.`,
            priority: "High",
            actionLabel: "Plan Season",
            actionRoute: "/calendar",
          },
          "Today",
        ),
        ...unlockedState.inbox,
      ].slice(0, 18),
    },
    firstTournament
      ? `Started ${unlockedState.season}. Enter or skip ${firstTournament.name}.`
      : `Started ${unlockedState.season}. No eligible event is currently available.`,
    "New Season",
  );
}

export function advanceWeekState(previousState: GameState): GameState {
  previousState = processRankingCalendar(previousState);
  previousState = reconcileCareerDepth(previousState);
  if (depthOf(previousState).nextSettlementDate <= previousState.currentDate) {
    // Imported/legacy simulations may move the date outside the recorded weekly clock.
    // Re-anchor without retroactive cash or training and never move the date backwards.
    previousState = { ...previousState, careerDepth: { ...depthOf(previousState), nextSettlementDate: plusDays(previousState.currentDate, 7) } };
  }
  if (previousState.seasonReview?.pending) return { ...previousState, lastAction: 'Complete the Season Review before advancing.' };
  if (pendingStory(previousState)) return { ...previousState, lastAction: 'A career decision is waiting in your inbox. Choose a response before advancing.' };
  const assistanceWasEnabled = depthOf(previousState).schedule?.enabled;
  previousState = runScheduleAssistance(previousState);
  if (assistanceWasEnabled && !depthOf(previousState).schedule?.enabled) return previousState;
  const entered = previousState.tournaments.find(t => t.status === 'Entered');
  if (entered && previousState.currentDate >= entered.startDate && previousState.currentDate <= (entered.endDate ?? entered.startDate)) return { ...previousState, lastAction: 'Your tournament is ready. Complete preparation and play, or explicitly withdraw, before advancing.' };
  if (entered && previousState.travel.bookings[entered.id] && !previousState.travel.bookings[entered.id].preparation) return { ...previousState, lastAction: 'Choose and confirm your tournament preparation before advancing.' };
  const boundary = nextCareerBoundary(previousState);
  if (entered && !previousState.travel.bookings[entered.id] && boundary >= journeyQuote(previousState, entered, '').departure) return { ...previousState, lastAction: 'Book travel before advancing through the departure window.' };
  const seasonBoundary = getNextSeasonStartDate(previousState.tournaments);
  if (seasonBoundary <= boundary && seasonBoundary < depthOf(previousState).nextSettlementDate) {
    // Close on July 1 without settling the following full week early or missing opening events.
    const closingState = finalizeState({ ...previousState, currentDate: seasonBoundary > previousState.currentDate ? seasonBoundary : previousState.currentDate }, 'Season complete.');
    return finalizeState(applySeasonRollover(closingState), 'Season complete. Review your results and start the new season.');
  }
  if (boundary < depthOf(previousState).nextSettlementDate) return finalizeState({ ...previousState, currentDate: boundary }, 'Reached a career calendar commitment. Review your calendar before continuing.');
  return advanceWholeWeekState(previousState);
}

function advanceWholeWeekState(previousState: GameState): GameState {
  if (previousState.seasonReview?.pending) {
    return finalizeState(
      previousState,
      `Review ${previousState.seasonReview.completedSeason.season} before starting ${previousState.seasonReview.nextSeason}.`,
    );
  }
  const trainedState =
    previousState.trainingAppliedWeek === previousState.week
      ? previousState
      : applyTrainingPlanState(previousState);
  const protectedState = ensureLockedWorldChampionshipEntry(trainedState);
  const normalizedActiveSponsors = normalizeSponsors(protectedState.sponsors);
  const sponsorObligationFatigue = clamp(
    normalizedActiveSponsors.reduce(
      (sum, sponsor) => sum + (sponsor.weeklyFatigueCost ?? 0),
      0,
    ),
    0,
    4,
  );
  const recoverySupport = normalizedActiveSponsors.some(
    (sponsor) => sponsor.perk === "Recovery",
  )
    ? 1
    : 0;
  const monthlyBrandMorale =
    protectedState.week % 4 === 0
      ? clamp(
          Math.round(
            normalizedActiveSponsors.reduce(
              (sum, sponsor) =>
                sum +
                (sponsor.brandFit >= 80 ? 1 : sponsor.brandFit < 55 ? -1 : 0),
              0,
            ),
          ),
          -2,
          2,
        )
      : 0;
  const monthlyPublicityReputation =
    protectedState.week % 4 === 0 &&
    normalizedActiveSponsors.some((sponsor) => sponsor.perk === "Publicity")
      ? 1
      : 0;
  const resolvingHealthIssue =
    protectedState.health.activeIssue?.weeksRemaining === 1
      ? protectedState.health.activeIssue
      : null;
  const nextHealthIssue = protectedState.health.activeIssue
    ? protectedState.health.activeIssue.weeksRemaining <= 1
      ? null
      : {
          ...protectedState.health.activeIssue,
          weeksRemaining: protectedState.health.activeIssue.weeksRemaining - 1,
          recoveryProgress: clamp(
            protectedState.health.activeIssue.recoveryProgress + 25,
            0,
            100,
          ),
        }
    : null;
  const sponsorLifecycle = normalizedActiveSponsors.map((sponsor) => {
    const cadence = Math.max(2, 7 - (sponsor.obligationLoad ?? 2));
    const seed = sponsor.id
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const obligationDue = (protectedState.week + seed) % cadence === 0;
    const missed =
      obligationDue &&
      (protectedState.player.fatigue >= 82 ||
        protectedState.trainingCondition.burnout >= 82 ||
        Boolean(
          protectedState.health.activeIssue &&
          protectedState.health.activeIssue.severity === "Serious",
        ));
    const nextCompliance = clamp(
      (sponsor.compliance ?? 100) + (obligationDue ? (missed ? -18 : 2) : 0),
      0,
      100,
    );
    const nextMissed = (sponsor.missedObligations ?? 0) + (missed ? 1 : 0);
    const breached = nextCompliance < 40 || nextMissed >= 3;
    const renewalOffered =
      sponsor.weeksRemaining <= 5 &&
      sponsor.weeksRemaining > 1 &&
      (sponsor.renewalStatus ?? "None") === "None" &&
      nextCompliance >= 65 &&
      (sponsor.performance?.satisfaction ?? 75) >= 50;
    const renewalOfferValue = renewalOffered
      ? Math.round(
          sponsor.monthlyValue *
            clamp(
              0.92 + sponsor.brandFit / 500 + nextCompliance / 1000,
              0.95,
              1.18,
            ),
        )
      : sponsor.renewalOfferValue;

    return {
      sponsor: {
        ...sponsor,
        weeksRemaining: sponsor.weeksRemaining - 1,
        compliance: nextCompliance,
        missedObligations: nextMissed,
        fulfilledObligations:
          (sponsor.fulfilledObligations ?? 0) +
          (obligationDue && !missed ? 1 : 0),
        renewalStatus: renewalOffered
          ? ("Offered" as const)
          : sponsor.renewalStatus,
        renewalOfferValue,
        lastLifecycleEvent: breached
          ? "Contract terminated for breach"
          : missed
            ? "Sponsor obligation missed"
            : renewalOffered
              ? "Renewal offer received"
              : obligationDue
                ? "Sponsor obligation fulfilled"
                : sponsor.lastLifecycleEvent,
      },
      missed,
      breached,
      renewalOffered,
    };
  });
  const expiringSponsors = sponsorLifecycle
    .filter(({ sponsor, breached }) => sponsor.weeksRemaining <= 0 && !breached)
    .map(({ sponsor }) => sponsor);
  const activeSponsors = sponsorLifecycle
    .filter(({ sponsor, breached }) => sponsor.weeksRemaining > 0 && !breached)
    .map(({ sponsor }) => sponsor);
  const sponsorLifecycleMessages = sponsorLifecycle.flatMap(
    ({ sponsor, missed, breached, renewalOffered }) => {
      if (breached)
        return [
          createInboxMessage(
            {
              sender: "Commercial Team",
              subject: `${sponsor.name} contract terminated`,
              preview: `Repeated missed obligations reduced compliance to ${sponsor.compliance}%. The deal has ended immediately.`,
              priority: "High",
              actionLabel: "Open Sponsorships",
              actionRoute: "/sponsorship",
            },
            "Today",
          ),
        ];
      if (renewalOffered)
        return [
          createInboxMessage(
            {
              sender: "Commercial Team",
              subject: `${sponsor.name} renewal available`,
              preview: `${sponsor.name} has offered £${sponsor.renewalOfferValue?.toLocaleString("en-GB")}/month for a fresh 12-month term. Review it before the current contract expires.`,
              priority: "High",
              actionLabel: "Review Renewal",
              actionRoute: "/sponsorship",
            },
            "Today",
          ),
        ];
      if (missed)
        return [
          createInboxMessage(
            {
              sender: sponsor.name,
              subject: "Sponsor obligation missed",
              preview: `Fatigue or availability prevented the scheduled obligation. Compliance is now ${sponsor.compliance}%; three misses can terminate the deal.`,
              priority: "High",
              actionLabel: "Open Health Centre",
              actionRoute: "/health",
            },
            "Today",
          ),
        ];
      return [];
    },
  );
  const expiringCoachContracts = protectedState.coachContracts.filter(
    (contract) => contract.weeksRemaining <= 1,
  );
  const activeCoachContracts = protectedState.coachContracts
    .map((contract) => ({
      ...contract,
      weeksRemaining: contract.weeksRemaining - 1,
    }))
    .filter((contract) => contract.weeksRemaining > 0);
  const sponsorExpiryMessages = expiringSponsors.map((sponsor) =>
    createInboxMessage(
      {
        sender: "Commercial Team",
        subject: `${sponsor.name} deal ended`,
        preview: `${sponsor.name} has rolled off the ${sponsor.slot} slot. Monthly income of £${sponsor.monthlyValue} has been removed from the save.`,
        priority: "Medium",
        actionLabel: "Open Sponsorships",
        actionRoute: "/sponsorship",
      },
      "Today",
    ),
  );
  const coachExpiryMessages = expiringCoachContracts.map((contract) => {
    const coach = protectedState.coaches.find(
      (entry) => entry.id === contract.coachId,
    );

    return createInboxMessage(
      {
        sender: "Staff Office",
        subject: `${coach?.name ?? "Coach"} contract ended`,
        preview: `${coach?.name ?? "Your coach"} has left the ${contract.slot} slot after the ${contract.contractLabel.toLowerCase()}. Weekly staff costs have been updated.`,
        priority: "Medium",
        actionLabel: "Open Staff Market",
        actionRoute: "/staff/coaches",
      },
      "Today",
    );
  });
  let nextState: GameState = {
    ...protectedState,
    currentDate: depthOf(protectedState).nextSettlementDate,
    careerDepth: { ...depthOf(protectedState), nextSettlementDate: plusDays(depthOf(protectedState).nextSettlementDate, 7) },
    week: protectedState.week + 1,
    sponsors: activeSponsors,
    coachContracts: activeCoachContracts,
    inbox: [
      ...sponsorLifecycleMessages,
      ...coachExpiryMessages,
      ...sponsorExpiryMessages,
      ...protectedState.inbox,
    ].slice(0, 18),
    player: {
      ...protectedState.player,
      cash: protectedState.player.cash + protectedState.finance.cashFlow + trainingBaseCost(protectedState) + overseasWeeklyCost(protectedState),
      confidence: settledConfidence(protectedState.player.confidence, protectedState.player.form, protectedState.attributes.mental.Composure ?? 60),
      fatigue: clamp(
        protectedState.player.fatigue +
          sponsorObligationFatigue -
          recoverySupport,
        0,
        100,
      ),
      morale: clamp(
        protectedState.player.morale +
          monthlyBrandMorale -
          sponsorLifecycle.filter((entry) => entry.missed).length * 2,
        0,
        100,
      ),
      reputation: clamp(
        protectedState.player.reputation + monthlyPublicityReputation,
        0,
        100,
      ),
    },
    trainingCondition: recoverTrainingCondition(
      protectedState.trainingCondition,
      recoverySupport,
    ),
    health: {
      activeIssue: nextHealthIssue,
      history: resolvingHealthIssue
        ? [
            {
              id: `${resolvingHealthIssue.id}-resolved`,
              date: protectedState.currentDate,
              issue: resolvingHealthIssue.issue,
              severity: resolvingHealthIssue.severity,
              treatment: "Natural recovery",
              timeOut: `${Math.max(1, resolvingHealthIssue.weeksRemaining)} week`,
              notes: "Returned to full availability.",
            },
            ...protectedState.health.history,
          ].slice(0, 24)
        : protectedState.health.history,
    },
  };

  const weeklyAttributeChanges = getTrainingAttributeChanges(
    previousState.attributes,
    nextState.attributes,
  );
  const weeklyImprovements = weeklyAttributeChanges
    .filter((change) => change.delta > 0)
    .sort((left, right) => right.delta - left.delta);
  const confidenceDelta =
    nextState.player.confidence - previousState.player.confidence;
  const fatigueDelta = nextState.player.fatigue - previousState.player.fatigue;
  const moraleDelta = nextState.player.morale - previousState.player.morale;
  const cashFlow = nextState.finance.cashFlow;
  const weeklyReportMessage = createInboxMessage(
    {
      sender: "Career Manager",
      subject: `${seasonWeekLabel(protectedState)} report`,
      preview: `Cash ${cashFlow >= 0 ? "+" : "-"}£${Math.abs(cashFlow).toLocaleString("en-GB")} · confidence ${formatTrainingMetricChange(confidenceDelta)} · fatigue ${formatTrainingMetricChange(fatigueDelta)} · ${weeklyImprovements.length} attribute${weeklyImprovements.length === 1 ? "" : "s"} improved.`,
      priority:
        nextState.player.fatigue >= 75 ||
        nextState.trainingCondition.strain >= 70
          ? "High"
          : "Medium",
      actionLabel: "View Training Report",
      actionRoute: "/training/report",
      summary: [
        {
          label: "Weekly cash flow",
          value: `${cashFlow >= 0 ? "+" : "-"}£${Math.abs(cashFlow).toLocaleString("en-GB")}`,
          detail: `Balance £${nextState.player.cash.toLocaleString("en-GB")}`,
          tone: cashFlow >= 0 ? "positive" : "negative",
        },
        {
          label: "Confidence",
          value: `${nextState.player.confidence}%`,
          detail: `${formatTrainingMetricChange(confidenceDelta)} this week`,
          tone:
            confidenceDelta > 0
              ? "positive"
              : confidenceDelta < 0
                ? "warning"
                : "neutral",
        },
        {
          label: "Fatigue",
          value: `${nextState.player.fatigue}%`,
          detail: `${formatTrainingMetricChange(fatigueDelta)} this week`,
          tone:
            nextState.player.fatigue >= 75
              ? "negative"
              : fatigueDelta > 0
                ? "warning"
                : "positive",
        },
        {
          label: "Morale",
          value: `${nextState.player.morale}%`,
          detail: `${formatTrainingMetricChange(moraleDelta)} this week`,
          tone:
            moraleDelta > 0
              ? "positive"
              : moraleDelta < 0
                ? "warning"
                : "neutral",
        },
        {
          label: "Training progress",
          value:
            weeklyImprovements.length > 0
              ? `${weeklyImprovements.length} improved`
              : "No rating change",
          detail:
            weeklyImprovements.length > 0
              ? weeklyImprovements
                  .slice(0, 4)
                  .map(
                    (change) =>
                      `${change.label} +${change.delta} (now ${change.current})`,
                  )
                  .join(" · ")
              : "Development may be accumulating toward a future rating increase.",
          tone: weeklyImprovements.length > 0 ? "positive" : "neutral",
        },
        {
          label: "Strain / burnout",
          value: `${nextState.trainingCondition.strain}% / ${nextState.trainingCondition.burnout}%`,
          detail: nextState.trainingCondition.strain === 0 && nextState.trainingCondition.burnout === 0 ? "Recovered — no accumulated strain or burnout" : "Current training health",
          tone:
            nextState.trainingCondition.strain >= 70 ||
            nextState.trainingCondition.burnout >= 70
              ? "negative"
              : "neutral",
        },
      ],
    },
    "Today",
  );

  const enteredTournament =
    protectedState.tournaments.find((event) => event.status === "Entered") ??
    protectedState.tournaments.find((event) => event.status === "Booked");
  const enteredTournamentDaysUntilStart = enteredTournament
    ? daysUntil(enteredTournament.startDate, protectedState.currentDate)
    : null;
  if (enteredTournament && (enteredTournamentDaysUntilStart ?? 999) <= 7) {
    nextState = finalizeState(
      {
        ...nextState,
        inbox: [
          weeklyReportMessage,
          createInboxMessage(
            {
              sender: "Tournament Office",
              subject: `${enteredTournament.name} is ready`,
              preview: `The event week has arrived. Confirm travel and start the match from the Tournament Hub. No match will be played automatically.`,
              priority: "High",
              actionLabel: "Open Tournament Hub",
              actionRoute: "/tournaments/hub",
            },
            "Today",
          ),
          ...nextState.inbox,
        ].slice(0, 18),
      },
      `Advanced to ${enteredTournament.name} event week. Book travel and start the match when ready.`,
      `${enteredTournament.name} ready`,
    );
  } else {
    nextState = finalizeState(
      {
        ...nextState,
        inbox: [
          weeklyReportMessage,
          ...nextState.inbox,
        ].slice(0, 18),
      },
      `Advanced to ${seasonWeekLabel(nextState)}.`,
      seasonWeekLabel(nextState),
    );
  }

  if (
    nextState.currentDate >= getNextSeasonStartDate(protectedState.tournaments)
  ) {
    nextState = finalizeState(
      applySeasonRollover(nextState),
      `Rolled into the ${formatSeasonLabel(getTournamentSeasonStartYear(protectedState.tournaments) + 1)} season.`,
      `${protectedState.season} archived`,
    );
  }

  return {
    ...nextState,
    trainingPlan: buildAutoTrainingPlanFromState(nextState),
  };
}

export function enterTournamentState(
  previousState: GameState,
  tournamentId: string,
): GameState {
  previousState = lockTournamentSeedings(processRankingCalendar(previousState), previousState.currentDate);
  const tournament = previousState.tournaments.find(
    (item) => item.id === tournamentId,
  );
  if (!tournament) return previousState;
  if (tournament.status === "Entered") {
    return finalizeState(
      previousState,
      `${tournament.name} is already entered.`,
    );
  }

  if (!ENTERABLE_TOURNAMENT_STATUSES.has(tournament.status)) {
    return finalizeState(
      previousState,
      `${tournament.name} can no longer be entered.`,
    );
  }

  const currentDateValue = getTournamentDateValue(previousState.currentDate);
  const tournamentEndValue = getTournamentDateValue(
    tournament.endDate ?? tournament.startDate,
  );
  if (currentDateValue > tournamentEndValue) {
    return finalizeState(
      previousState,
      `${tournament.name} has already finished.`,
    );
  }

  const existingEntry = previousState.tournaments.find(
    (item) => item.id !== tournamentId && item.status === "Entered",
  );
  const commitmentBlocker = tournamentCommitmentConflict(previousState, tournament);
  if (commitmentBlocker) {
    return finalizeState(previousState, commitmentBlocker);
  }
  if (existingEntry) {
    return finalizeState(
      previousState,
      `Withdraw from or finish ${existingEntry.name} before entering another event.`,
    );
  }

  const entryAccess = getTournamentEntryAccess(previousState, tournament);
  if (!entryAccess.allowed) {
    return finalizeState(
      previousState,
      entryAccess.reason ??
        `You do not have valid access for ${tournament.name}.`,
    );
  }

  const equipmentMessage = getTournamentEquipmentMessage(
    previousState.equipment,
  );
  if (equipmentMessage) {
    return finalizeState(previousState, equipmentMessage);
  }

  const cashRequirement = getTournamentEntryCashRequirement(
    previousState,
    tournament,
  );

  if (previousState.player.cash < cashRequirement) {
    return finalizeState(
      previousState,
      `Insufficient funds to enter ${tournament.name}.`,
    );
  }

  return finalizeState(
    {
      ...previousState,
      player: {
        ...previousState.player,
        cash: previousState.player.cash - cashRequirement,
        morale: clamp(previousState.player.morale + 1, 0, 100),
      },
      tournaments: previousState.tournaments.map((item) =>
        item.id === tournamentId ? { ...item, status: "Entered" } : item,
      ),
      travel: {
        ...previousState.travel,
        bookings: Object.fromEntries(
          Object.entries(previousState.travel.bookings).filter(
            ([key]) => key !== tournamentId,
          ),
        ),
      },
      tournamentProgress: {
        tournamentId,
        rulesVersion: 3,
        currentRound: getTournamentEntryRound(previousState, tournament),
        draw: buildTournamentDraw(
          previousState,
          tournament,
          getTournamentEntryRound(previousState, tournament),
        ),
        rankingBaseline: Object.fromEntries(
          COMPETITION_TABLE_KEYS.map((key) => [
            key,
            Object.fromEntries(
              previousState.competitionTables[key].map((row) => [
                row.playerName,
                row.ranking,
              ]),
            ),
          ]),
        ),
        completedRounds: [],
      },
      history: {
        ...previousState.history,
        tournamentHistory: upsertTournamentHistoryEntry(
          previousState.history.tournamentHistory,
          synchronizeTournamentHistoryEntry(tournament, {
            ...(previousState.history.tournamentHistory.find(
              (entry) =>
                entry.id ===
                getTournamentHistoryId(previousState.season, tournament.id),
            ) ??
              createTournamentHistoryEntry(tournament, previousState.season)),
            status: "Entered",
            entryPaid: cashRequirement,
            result: "Entered",
          }),
        ),
      },
      inbox: [
        createInboxMessage(
          {
            sender: "Tournament Office",
            subject: `Entered ${tournament.name}`,
            preview: `Entry fee of £${cashRequirement} has been paid. Travel and hotel can now be booked separately.`,
            priority: "High",
            actionLabel: "Book Travel",
            actionRoute: "/travel",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Entered ${tournament.name}.`,
    "Tournament Entry",
  );
}

export function skipTournamentState(
  previousState: GameState,
  tournamentId: string,
): GameState {
  const tournament = previousState.tournaments.find(
    (item) => item.id === tournamentId,
  );
  if (!tournament) return previousState;
  if (tournament.status === "Entered") {
    return finalizeState(
      previousState,
      `Withdraw from ${tournament.name} if you no longer want to play it.`,
    );
  }
  if (!ENTERABLE_TOURNAMENT_STATUSES.has(tournament.status)) {
    return finalizeState(
      previousState,
      `${tournament.name} cannot be skipped from its current state.`,
    );
  }

  const skippedState: GameState = {
    ...previousState,
    tournaments: previousState.tournaments.map((item) =>
      item.id === tournamentId ? { ...item, status: "Skipped" } : item,
    ),
    history: {
      ...previousState.history,
      tournamentHistory: upsertTournamentHistoryEntry(
        previousState.history.tournamentHistory,
        synchronizeTournamentHistoryEntry(tournament, {
          ...(previousState.history.tournamentHistory.find(
            (entry) =>
              entry.id ===
              getTournamentHistoryId(previousState.season, tournament.id),
          ) ?? createTournamentHistoryEntry(tournament, previousState.season)),
          status: "Skipped",
          result: "Skipped",
        }),
      ),
    },
  };
  const nextTournament = getNextEligibleTournament(skippedState);

  return finalizeState(
    {
      ...skippedState,
      inbox: [
        ...(nextTournament
          ? [
              createTournamentInvitationMessage(
                nextTournament,
                skippedState.currentDate,
                "next",
              ),
            ]
          : []),
        createInboxMessage(
          {
            sender: "Tournament Office",
            subject: `Skipped ${tournament.name}`,
            preview: `You chose not to enter ${tournament.name}. No entry or travel costs were charged.`,
            priority: "Low",
            actionLabel: "Open Calendar",
            actionRoute: "/calendar",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    nextTournament
      ? `Skipped ${tournament.name}. ${nextTournament.name} is now the next event to consider.`
      : `Skipped ${tournament.name}. No other eligible event is currently available.`,
    "Tournament Decision",
  );
}

function ensureLockedWorldChampionshipEntry(state: GameState) {
  const tournament = state.tournaments.find(isWorldChampionshipMainDrawTournament);
  // An early-season reputation or reservation cannot decide the April field.
  if (!tournament || !state.rollingRankings?.seedings[rankingEventKey(tournament)] ||
      !getTournamentEntryAccess(state, tournament).allowed ||
      !ENTERABLE_TOURNAMENT_STATUSES.has(tournament.status) ||
      state.tournaments.some(t => t.status === 'Entered') ||
      state.history.tournamentHistory.some(h => h.season === state.season && h.tournamentId === tournament.id)) return state;
  const days = daysUntil(tournament.startDate, state.currentDate);
  return days >= 0 && days <= 35 ? enterTournamentState(state, tournament.id) : state;
}

function getEnteredCompetitions(state: Pick<GameState, "tournaments">) {
  return state.tournaments
    .filter((tournament) => tournament.status === "Entered")
    .map((tournament) => ({
      name: tournament.name,
      location: tournament.location,
      startDate: tournament.startDate,
    }));
}

function buildAutoTrainingPlanFromState(
  state: Pick<GameState, "currentDate" | "player" | "tournaments" | "travel">,
) {
  const enteredCompetitions = getEnteredCompetitions({
    tournaments: state.tournaments,
  });
  const nextCompetition = state.tournaments.find(
    (tournament) => tournament.status === "Entered",
  );
  const travelBooked = nextCompetition
    ? Boolean(state.travel.bookings[nextCompetition.id])
    : false;

  return buildAutoTrainingPlan(
    state.currentDate,
    state.player.fatigue,
    enteredCompetitions,
    travelBooked,
  );
}

function parseCoachContractWeeks(contractLabel?: string) {
  return getCoachContractWeeks(contractLabel);
}

function mergeCoachCatalog(savedCoaches: Coach[]) {
  return [
    ...coachCatalog.map((catalogCoach) => {
      const savedCoach = savedCoaches.find(
        (coach) => coach.id === catalogCoach.id,
      );
      return savedCoach
        ? { ...catalogCoach, ...savedCoach }
        : { ...catalogCoach };
    }),
    ...savedCoaches.filter(
      (coach) =>
        !coachCatalog.some((catalogCoach) => catalogCoach.id === coach.id),
    ),
  ];
}

function getCareerRanking(state: Pick<GameState, "player" | "rankings">) {
  return (
    state.rankings.find((row) => row.playerName === state.player.fullName)
      ?.ranking ??
    state.player.amateurRanking ??
    state.player.worldRanking ??
    0
  );
}

function getCoachSlotLimit(state: Pick<GameState, "player" | "rankings">) {
  return getCoachSlotLimitForRanking(
    getCareerRanking(state),
    state.player.reputation,
  );
}

function normalizeCoachContracts(contracts: CoachContract[], coaches: Coach[]) {
  return contracts
    .filter((contract) =>
      coaches.some((coach) => coach.id === contract.coachId),
    )
    .map((contract, index) => {
      const coach =
        coaches.find((entry) => entry.id === contract.coachId) ?? coaches[0];
      const contractOptions = getCoachContractOptions(coach);
      const matchedOption =
        contractOptions.find(
          (option) => option.label === contract.contractLabel,
        ) ?? contractOptions[0];

      return {
        coachId: contract.coachId,
        slot:
          contract.slot ||
          COACH_SLOT_NAMES[index] ||
          COACH_SLOT_NAMES[COACH_SLOT_NAMES.length - 1],
        contractLabel: matchedOption.label,
        contractWeeks:
          typeof contract.contractWeeks === "number"
            ? contract.contractWeeks
            : parseCoachContractWeeks(matchedOption.label),
        weeklyCost: contract.weeklyCost ?? matchedOption.weeklyCost,
        totalCost: contract.totalCost ?? matchedOption.totalCost,
        weeksRemaining:
          typeof contract.weeksRemaining === "number"
            ? contract.weeksRemaining
            : parseCoachContractWeeks(matchedOption.label),
        startedWeek: contract.startedWeek ?? 1,
      };
    });
}

function buildLegacyCoachContracts(
  currentCoachId: string | null,
  coaches: Coach[],
  currentWeek: number,
) {
  if (!currentCoachId) return [];

  const coach = coaches.find((entry) => entry.id === currentCoachId);
  if (!coach) return [];

  const defaultOption = getCoachContractOptions(coach)[0];

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
  ];
}

function getCoachNegotiationOutcome(
  contract: CoachContract,
  coach: Coach,
  playerReputation: number,
  tone: "Conservative" | "Balanced" | "Ambitious",
) {
  const levelPenalty =
    coach.level === "Elite"
      ? 10
      : coach.level === "High"
        ? 6
        : coach.level === "Mid"
          ? 3
          : 0;
  const threshold =
    tone === "Conservative" ? 98 : tone === "Balanced" ? 114 : 130;
  const reduction =
    tone === "Conservative" ? 0.03 : tone === "Balanced" ? 0.06 : 0.09;
  const leverageScore = playerReputation + coach.compatibility - levelPenalty;
  const floorWeeklyCost = Math.round(coach.weeklyCost * 0.82);
  const nextWeeklyCost = Math.max(
    floorWeeklyCost,
    Math.round(contract.weeklyCost * (1 - reduction)),
  );

  return {
    success: leverageScore >= threshold && nextWeeklyCost < contract.weeklyCost,
    nextWeeklyCost,
  };
}

function getPrimaryCoachId(coachContracts: CoachContract[]) {
  return (
    coachContracts.find((contract) => contract.slot === COACH_SLOT_NAMES[0])
      ?.coachId ??
    coachContracts[0]?.coachId ??
    null
  );
}

function getNextCoachSlot(
  state: Pick<GameState, "coachContracts" | "player" | "rankings">,
) {
  const unlockedSlots = COACH_SLOT_NAMES.slice(0, getCoachSlotLimit(state));
  return (
    unlockedSlots.find(
      (slot) =>
        !state.coachContracts.some((contract) => contract.slot === slot),
    ) ?? null
  );
}

function getCoachAvailabilityStatus(
  state: Pick<GameState, "player" | "rankings">,
  coach: Coach,
) {
  return getCoachAvailability(
    coach,
    getCareerRanking(state),
    state.player.reputation,
  );
}

function applyCoachTrainingBonus(
  trainingEffects: ReturnType<typeof calculateTrainingEffects>,
  coachContracts: CoachContract[],
  coaches: Coach[],
) {
  if (trainingEffects.weekLoad === 0) return trainingEffects;
  return coachContracts.reduce(
    (bonus, contract) => {
      const coach = coaches.find((entry) => entry.id === contract.coachId);
      if (!coach) return bonus;

      const levelBonus =
        coach.level === "Elite" ? 2 : coach.level === "High" ? 1 : 0;
      const chemistryBonus = coach.compatibility >= 82 ? 1 : 0;

      if (coach.type === "Technical" || coach.type === "Break Building") {
        bonus.technicalGain += 1 + levelBonus;
        bonus.breakBuildingGain += 1 + levelBonus;
        bonus.cueControlGain += chemistryBonus;
      }

      if (coach.type === "Cue Action") {
        bonus.cueControlGain += 1 + levelBonus;
        bonus.technicalGain += chemistryBonus;
      }

      if (coach.type === "Tactical") {
        bonus.technicalGain += 1 + levelBonus;
        bonus.focusGain += chemistryBonus;
      }

      if (coach.type === "Mental") {
        bonus.focusGain += 1 + levelBonus;
        bonus.confidenceDelta += 1 + chemistryBonus;
        bonus.moraleDelta += 1;
        bonus.fatigueDelta -= 1;
      }

      if (coach.type === "Fitness") {
        bonus.staminaGain += 1 + levelBonus;
        bonus.fatigueDelta -= 1 + chemistryBonus;
      }

      if (coach.type !== "Mental" && coach.discipline >= 80) {
        bonus.staminaGain += chemistryBonus;
        bonus.fatigueDelta -= chemistryBonus;
      }

      return bonus;
    },
    { ...trainingEffects },
  );
}

function buildSponsorOffers(existingOffers: SponsorOfferState[] = []): SponsorOfferState[] {
  return existingOffers.map(offer => ({ ...offer,
    status: offer.status ?? 'Available',
    negotiationCount: offer.negotiationCount ?? 0,
    notes: offer.notes ?? [],
  }));
}

function roundToNearestFifty(value: number) {
  return Math.max(200, Math.round(value / 50) * 50);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function deepCloneAttributes(attributes: PlayerAttributes): PlayerAttributes {
  return {
    technical: { ...attributes.technical },
    mental: { ...attributes.mental },
    physical: { ...attributes.physical },
  };
}

function getTrainingAttributeChanges(
  before: PlayerAttributes,
  after: PlayerAttributes,
) {
  return (["technical", "mental", "physical"] as const).flatMap((group) =>
    Object.entries(after[group]).flatMap(([label, current]) => {
      const previous = before[group][label] ?? current;
      const delta = current - previous;
      return delta === 0 ? [] : [{ group, label, delta, current }];
    }),
  );
}

function formatTrainingMetricChange(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function buildPersistedPersonalityTraits(
  traits: Player["personalityTraits"] | undefined,
  playingStyle: string,
) {
  if (traits?.length) return traits.map((trait) => ({ ...trait }));
  return applyPlayingStyleToSliders(
    createPlayerSliderCatalog.map((slider) => ({ ...slider })),
    playingStyle,
  );
}

function daysUntil(dateString: string, currentDate: string) {
  const target = new Date(`${dateString}T00:00:00`).getTime();
  const current = new Date(`${currentDate}T00:00:00`).getTime();
  return Math.max(0, Math.round((target - current) / (1000 * 60 * 60 * 24)));
}

function createInboxMessage(
  partial: Omit<InboxMessage, "id" | "date">,
  date: string,
): InboxMessage {
  return formatInboxConfidence({
    id: `inbox-${date}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    read: false,
    ...partial,
  });
}

function buildTournamentInvitationContent(
  tournament: Tournament,
  currentDate: string,
  context: "season" | "next" | "post-event" = "next",
): Omit<InboxMessage, "id" | "date"> {
  const prizeFund = tournament.totalPrizeFund ?? tournament.prizeMoney;
  const winnerPrize =
    tournament.winnerPrize ?? Math.round(tournament.prizeMoney * 0.5);
  const estimatedTripCost = tournament.travelCost + tournament.hotelCost;
  const startsIn = daysUntil(tournament.startDate, currentDate);
  const contextLead =
    context === "season"
      ? `${tournament.name} is the first eligible event of the new season.`
      : context === "post-event"
        ? `${tournament.name} is your next eligible event.`
        : `${tournament.name} is the next eligible event on your pathway.`;

  return {
    sender: "Tournament Office",
    subject: `Invitation: ${tournament.name}`,
    tournamentReference: { id: tournament.id, startDate: tournament.startDate },
    preview: `${contextLead} The prize fund is £${prizeFund.toLocaleString("en-GB")}, with £${winnerPrize.toLocaleString("en-GB")} for the champion${tournament.rankingValue > 0 ? ` and ${tournament.rankingValue.toLocaleString("en-GB")} ranking points at stake` : " in this non-ranking event"}. Enter or skip the event, then book travel if entering.`,
    priority: "High",
    actionLabel: "Review Event",
    actionRoute: "/calendar",
    summary: [
        {
          label: "Total prize fund",
          value: `£${prizeFund.toLocaleString("en-GB")}`,
          detail: tournament.name,
          tone: "positive",
        },
        {
          label: "Winner's prize",
          value: `£${winnerPrize.toLocaleString("en-GB")}`,
          detail: "Paid for winning the tournament",
          tone: "positive",
        },
        {
          label: "Ranking value",
          value:
            tournament.rankingValue > 0
              ? `${tournament.rankingValue.toLocaleString("en-GB")} pts`
              : "Non-ranking",
          detail: tournament.rankingType ?? "No ranking points",
          tone: tournament.rankingValue > 0 ? "positive" : "neutral",
        },
        {
          label: "Format",
          value: tournament.type,
          detail: `${tournament.format} · ${tournament.location} · starts in ${startsIn} day${startsIn === 1 ? "" : "s"}`,
          tone: "neutral",
        },
        {
          label: "Entry fee",
          value:
            tournament.entryFee > 0
              ? `£${tournament.entryFee.toLocaleString("en-GB")}`
              : "Free",
          detail: "Charged when entry is confirmed",
          tone: tournament.entryFee > 0 ? "warning" : "positive",
        },
        {
          label: "Estimated travel",
          value: `£${estimatedTripCost.toLocaleString("en-GB")}`,
          detail: "Base travel and hotel estimate before package selection",
          tone: estimatedTripCost > 0 ? "warning" : "neutral",
        },
    ],
  };
}

function createTournamentInvitationMessage(
  tournament: Tournament,
  currentDate: string,
  context: "season" | "next" | "post-event" = "next",
) {
  return createInboxMessage(
    buildTournamentInvitationContent(tournament, currentDate, context),
    "Today",
  );
}

function inferInboxAction(
  message: InboxMessage,
): Pick<InboxMessage, "actionLabel" | "actionRoute"> {
  const text =
    `${message.sender} ${message.subject} ${message.preview}`.toLowerCase();

  if (/commercial team|sponsor/.test(text)) {
    return {
      actionLabel: /renewal|negotiation|review deal|reopen deal/.test(text)
        ? "Review Sponsorship"
        : "Open Sponsorships",
      actionRoute: "/sponsorship",
    };
  }

  if (/travel desk|travel booked|logistics confirmed|travel pack/.test(text)) {
    return { actionLabel: "Open Travel", actionRoute: "/travel" };
  }

  if (
    /tournament office|tour office|entered |tournament|event week/.test(text)
  ) {
    if (/entered |entry fee|booked separately/.test(text))
      return { actionLabel: "Book Travel", actionRoute: "/travel" };
    if (/ready|next round|win at|loss at|tournament won/.test(text))
      return {
        actionLabel: "Open Tournament Hub",
        actionRoute: "/tournaments/hub",
      };
    return { actionLabel: "Open Calendar", actionRoute: "/calendar" };
  }

  if (/maintenance|serviced/.test(text)) {
    return {
      actionLabel: "Open Maintenance",
      actionRoute: "/equipment/maintenance",
    };
  }

  if (/chalk|tip|equipment shop|equipment room|cue /.test(text)) {
    if (/chalk|tip|setup/.test(text))
      return {
        actionLabel: "Open Chalk & Tips",
        actionRoute: "/equipment/chalk-tips",
      };
    if (/case/.test(text))
      return { actionLabel: "Open Cases", actionRoute: "/equipment/cases" };
    return { actionLabel: "Open Equipment", actionRoute: "/equipment/cues" };
  }

  if (/facility manager|training facility|membership/.test(text))
    return {
      actionLabel: "Open Training Facility",
      actionRoute: "/equipment/table-setup",
    };
  if (/medical team|injury|health centre|treatment/.test(text))
    return { actionLabel: "Open Health Centre", actionRoute: "/health" };
  if (/sports psychologist|mental state|recovery plan/.test(text))
    return { actionLabel: "Open Mental State", actionRoute: "/mental" };
  if (/head coach|training week|training block|training planner/.test(text))
    return { actionLabel: "Open Training Planner", actionRoute: "/training" };
  if (/staff office|coach|mara kestrel/.test(text))
    return { actionLabel: "Open Staff Market", actionRoute: "/staff/coaches" };
  if (
    /finance office|finance advisor|cash flow|weekly money|surplus/.test(text)
  )
    return { actionLabel: "Open Finance", actionRoute: "/finance" };
  if (/career manager|season loaded|week \d+ complete/.test(text))
    return { actionLabel: "Open Dashboard", actionRoute: "/" };

  return {};
}

function normalizeInboxMessages(
  messages: InboxMessage[],
  tournaments: Tournament[] = [],
  currentDate?: string,
): InboxMessage[] {
  return messages.map((message) => {
    const normalizedMessage = formatInboxConfidence({ ...message, read: Boolean(message.read) });
    if (message.subject.startsWith("Invitation: ")) {
      const tournamentName = message.subject.slice("Invitation: ".length);
      const tournament = tournaments.find(
        (event) => event.name === tournamentName,
      );
      if (tournament && (!message.tournamentBriefings?.length || message.tournamentBriefings[0].startDate === tournament.startDate) && (!message.tournamentReference || message.tournamentReference.startDate === tournament.startDate)) {
        return {
          ...normalizedMessage,
          ...buildTournamentInvitationContent(
            tournament,
            currentDate ?? tournament.startDate,
          ),
          id: message.id,
          date: message.date,
          read: Boolean(message.read),
        };
      }
    }
    if (message.actionLabel && message.actionRoute) {
      return normalizedMessage;
    }

    return {
      ...normalizedMessage,
      ...inferInboxAction(message),
    };
  });
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
        sender: "Career Manager",
        subject: "Start here: opening save briefing",
        preview: `${fullName} starts on the ${startingLevelName} route with the ${backgroundName} background and ${backgroundDifficulty.toLowerCase()} opening conditions. Open the inbox first, then work through the setup notes below in order.`,
        priority: "High",
        actionLabel: "Open Inbox",
        actionRoute: "/inbox",
      },
      "Today",
    ),
    createInboxMessage(
      {
        sender: "Commercial Team",
        subject: "Tutorial: review sponsor options",
        preview:
          "Sponsors shape early weekly income and unlock longer-term stability. Review the current market, see what is realistic for a new save, and learn where future offers will appear.",
        priority: "Medium",
        actionLabel: "Open Sponsorships",
        actionRoute: "/sponsorship",
      },
      "Today",
    ),
    createInboxMessage(
      {
        sender: "Finance Office",
        subject: "Tutorial: understand your weekly money",
        preview: `You begin with ${startingCashFlow >= 0 ? "+" : ""}£${Math.abs(startingCashFlow)} weekly flow. Check the finance screen now so entry fees, travel, and staff costs do not catch you out in the first month.`,
        priority: "Medium",
        actionLabel: "Open Finance",
        actionRoute: "/finance",
      },
      "Today",
    ),
    createInboxMessage(
      {
        sender: "Equipment Room",
        subject: "Tutorial: set up your playing hardware",
        preview:
          "Your first event preparation starts with equipment. Review cue options and then work through chalk, tip, and maintenance so the save has a proper base setup.",
        priority: "Medium",
        actionLabel: "Open Equipment",
        actionRoute: "/equipment/cues",
      },
      "Today",
    ),
    createInboxMessage(
      {
        sender: "Staff Office",
        subject: "Tutorial: learn the coach market",
        preview:
          "You do not need to hire immediately, but you should understand fit, cost, and unlock rules early. Open the coach market and see what support is realistically available at this stage.",
        priority: "Low",
        actionLabel: "Open Staff Market",
        actionRoute: "/staff/coaches",
      },
      "Today",
    ),
    createInboxMessage(
      {
        sender: "Head Coach",
        subject: "Tutorial: lock in your first training week",
        preview:
          "Training, travel, and tournament prep now all feed the live save. Open the planner, review the auto-built week, and use it as the first guided step before entering events.",
        priority: "Medium",
        actionLabel: "Open Training Planner",
        actionRoute: "/training",
      },
      "Today",
    ),
  ];
}

function formatDisplayDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildCueStates(): Record<string, CueConditionState> {
  return Object.fromEntries(
    cueCatalog.map((cue) => [
      cue.id,
      {
        condition: cue.condition,
        familiarity: cue.familiarity,
        durability: cue.durability,
        tipCondition: clamp(cue.condition - 12, 28, 100),
        shaftStraightness: clamp(cue.condition - 6, 40, 100),
      },
    ]),
  );
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
    chalkCondition: 100,
    chalkStock: Object.fromEntries(
      starterEquipmentState.chalkOwned.map((id) => [
        id,
        id === starterEquipmentState.currentChalkId ? 5 : 3,
      ]),
    ),
    tipStock: Object.fromEntries(
      starterEquipmentState.tipsOwned.map((id) => [id, 0]),
    ),
  };
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
    chalkCondition: 100,
    chalkStock: {},
    tipStock: {},
  };
}

function getTravelOption(travelOptionId?: string): TravelOption {
  return (
    travelOptionCatalog.find((option) => option.id === travelOptionId) ??
    travelOptionCatalog[0]
  );
}

function getHotelOption(hotelOptionId?: string): HotelOption {
  return (
    hotelOptionCatalog.find((option) => option.id === hotelOptionId) ??
    hotelOptionCatalog[0]
  );
}

export function getTravelPackageEstimate(state: GameState, travelOptionId?: string, hotelOptionId?: string, tournamentId?: string) {
  const event = state.tournaments.find(t => t.id === tournamentId) ?? state.tournaments.find(t => t.status === 'Entered');
  const savedJourney = event && state.realism?.journeys[`${event.id}:${event.startDate}`];
  const booking = event && state.travel.bookings[event.id];
  const locked = Boolean(booking && savedJourney && (savedJourney.applied || savedJourney.departure <= state.currentDate));
  const options = travelOptionsFor(state, event);
  const option = options.find(o => o.id === (locked ? booking?.travelOptionId : travelOptionId)) ?? options[0];
  const hotel = getHotelOption(locked ? booking?.hotelOptionId : hotelOptionId);
  const discount = state.sponsors.some(sponsor => normalizeSponsor(sponsor, 0).perk === 'Travel') ? 0.12 : 0;
  const stay = event ? hotelStayPlan(event, journeyQuote(state, event, option.id).arrival, getTournamentEntryRound(state, event)) : { minNights: 1, maxNights: 1 };
  const nightlyRate = locked && savedJourney?.hotelNightlyRate !== undefined ? savedJourney.hotelNightlyRate : Math.round(hotel.cost * (1 - discount) * 100) / 100;
  const minNights = locked ? savedJourney?.hotelInitialNights ?? stay.maxNights : stay.minNights;
  const maxNights = locked ? savedJourney?.hotelMaximumNights ?? stay.maxNights : stay.maxNights;
  const paidNights = locked && savedJourney?.hotelThrough ? Math.max(1, Math.round((Date.parse(savedJourney.hotelThrough) - Date.parse(savedJourney.arrival)) / 86400000) + 1) : minNights;
  const fixedCost = locked && booking ? Math.round((booking.totalCost - paidNights * nightlyRate) * 100) / 100 : Math.round((option.cost + 55) * (1 - discount) * 100) / 100;
  const minCost = Math.round((fixedCost + minNights * nightlyRate) * 100) / 100;
  const maxCost = Math.round((fixedCost + maxNights * nightlyRate) * 100) / 100;
  return { nightlyRate, minNights, maxNights, paidNights, fixedCost, minCost, maxCost, totalCost: locked && booking ? booking.totalCost : minCost };
}
export function getTravelPackageCost(state: GameState, travelOptionId?: string, hotelOptionId?: string, tournamentId?: string) {
  return getTravelPackageEstimate(state, travelOptionId, hotelOptionId, tournamentId).totalCost;
}

function normalizeSponsor(sponsor: SponsorDeal, index: number): SponsorDeal {
  const profile = getSponsorObligationProfile(sponsor);
  return {
    ...sponsor,
    slot:
      sponsor.slot ||
      SPONSOR_SLOT_NAMES[index] ||
      SPONSOR_SLOT_NAMES[SPONSOR_SLOT_NAMES.length - 1],
    contractLength: sponsor.contractLength || "24 months",
    weeksRemaining:
      typeof sponsor.weeksRemaining === "number"
        ? sponsor.weeksRemaining
        : parseContractWeeks(sponsor.contractLength),
    bonusClause: sponsor.bonusClause ?? "No performance bonus",
    behaviour: sponsor.behaviour ?? "Standard professional conduct",
    obligationLoad: sponsor.obligationLoad ?? profile.obligationLoad,
    weeklyFatigueCost: sponsor.weeklyFatigueCost ?? profile.weeklyFatigueCost,
    perk: sponsor.perk ?? profile.perk,
    bonusesPaid: sponsor.bonusesPaid ?? [],
    totalBonusPaid: sponsor.totalBonusPaid ?? 0,
    compliance: sponsor.compliance ?? 100,
    missedObligations: sponsor.missedObligations ?? 0,
    fulfilledObligations: sponsor.fulfilledObligations ?? 0,
    renewalStatus: sponsor.renewalStatus ?? "None",
    renewalOfferValue: sponsor.renewalOfferValue,
    lastLifecycleEvent: sponsor.lastLifecycleEvent ?? "Contract active",
  };
}

export function bookTravelState(
  previousState: GameState,
  tournamentId?: string,
  travelOptionId?: string,
  hotelOptionId?: string,
) {
  const tournament =
    previousState.tournaments.find((item) => item.id === tournamentId) ??
    previousState.tournaments.find((item) => item.status === "Entered");
  if (!tournament)
    return finalizeState(
      previousState,
      "Enter a tournament before booking travel.",
    );
  if (tournament.status !== "Entered")
    return finalizeState(
      previousState,
      `Enter ${tournament.name} before booking its travel.`,
    );

  const entryAccess = getTournamentEntryAccess(previousState, tournament);
  if (
    !entryAccess.allowed ||
    getTournamentDateValue(previousState.currentDate) >
      getTournamentDateValue(tournament.endDate ?? tournament.startDate)
  ) {
    return finalizeState(
      previousState,
      entryAccess.reason ?? `${tournament.name} has already finished.`,
    );
  }

  if (previousState.liveMatch?.status === 'In Progress') return finalizeState(previousState, 'Finish the current match before changing travel.');
  const options = travelOptionsFor(previousState, tournament);
  const travelOption = options.find(o => o.id === travelOptionId) ?? options[0];
  const hotelOption = getHotelOption(hotelOptionId);
  const estimate = getTravelPackageEstimate(previousState, travelOption.id, hotelOption.id, tournament.id);
  const totalCost = estimate.totalCost;
  const existingBooking = previousState.travel.bookings[tournament.id];
  const realism = realismOf(previousState);
  const quote = journeyQuote(previousState, tournament, travelOption.id);
  const stay = hotelStayPlan(tournament, quote.arrival, getTournamentEntryRound(previousState, tournament));
  const journey = { ...quote, hotelThrough: stay.through, hotelNightlyRate: estimate.nightlyRate, hotelInitialNights: stay.minNights, hotelMaximumNights: stay.maxNights };
  if (journey.arrival > tournament.startDate) return finalizeState(previousState, 'This journey cannot arrive before the tournament starts. Choose a later event.');
  const oldJourney = realism.journeys[journey.eventKey];
  if (oldJourney?.applied || (oldJourney && oldJourney.departure <= previousState.currentDate)) return finalizeState(previousState, 'This journey has started. Its package is now locked.');
  if (Object.values(realism.journeys).some(j => j.eventKey !== journey.eventKey && !j.applied && j.departure <= journey.arrival && j.arrival >= journey.departure)) return finalizeState(previousState, 'This journey overlaps another booked trip.');
  if (previousState.careerDepth?.commitments.some(c => c.status === 'scheduled' && c.startDate <= journey.arrival && c.endDate >= journey.departure)) return finalizeState(previousState, 'Travel conflicts with a protected career commitment.');
  if (existingBooking && Object.values(realism.journeys).some(j => j.eventKey !== journey.eventKey && !j.applied && j.departure > journey.arrival)) return finalizeState(previousState, 'A later journey depends on this itinerary; keep the existing booking.');
  const delta = totalCost - (existingBooking?.totalCost ?? 0);
  if (previousState.player.cash < delta)
    return finalizeState(
      previousState,
      `Not enough cash to lock the ${travelOption.name} and ${hotelOption.name} package.`,
    );

  return finalizeState(
    {
      ...previousState,
      realism: { ...realism, journeys: { ...realism.journeys, [journey.eventKey]: journey } },
      player: {
        ...previousState.player,
        cash: previousState.player.cash - delta,
        fatigue: previousState.player.fatigue,
        confidence: previousState.player.confidence,
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
            preparation: existingBooking?.preparation,
          },
        },
      },
      history: {
        ...previousState.history,
        tournamentHistory: upsertTournamentHistoryEntry(
          previousState.history.tournamentHistory,
          synchronizeTournamentHistoryEntry(tournament, {
            ...(previousState.history.tournamentHistory.find(
              (entry) =>
                entry.id ===
                getTournamentHistoryId(previousState.season, tournament.id),
            ) ??
              createTournamentHistoryEntry(tournament, previousState.season)),
            status: "Entered",
            result: "Travel booked",
            bookedTravelCost: totalCost,
          }),
        ),
      },
      inbox: [
        createInboxMessage(
          {
            sender: "Travel Desk",
            subject: `${tournament.name} travel booked`,
            preview: `${travelOption.name} and ${hotelOption.name} are now locked in for £${totalCost}. Arrival ${journey.arrival}; ${stay.minNights} hotel nights through ${journey.hotelThrough}. Later rounds extend your stay at £${estimate.nightlyRate}/night; full-run trip estimate £${estimate.maxCost}.`,
            priority: "Medium",
            actionLabel: "Review Travel",
            actionRoute: "/travel",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Booked travel for ${tournament.name}.`,
    "Travel Booking",
  );
}

export function confirmTournamentPreparationState(
  previousState: GameState,
  tournamentId: string,
  focusId: PreparationFocusId,
  allocations: PreparationAllocations,
  supportIds: PreparationSupportId[],
) {
  const tournament = previousState.tournaments.find(
    (item) => item.id === tournamentId,
  );
  const booking = previousState.travel.bookings[tournamentId];
  if (!tournament || tournament.status !== "Entered") {
    return finalizeState(
      previousState,
      "Enter a tournament before confirming preparation.",
    );
  }
  if (!booking) {
    return finalizeState(
      previousState,
      `Book travel for ${tournament.name} before confirming preparation.`,
    );
  }

  const allocationTotal = Object.values(allocations).reduce(
    (total, value) => total + value,
    0,
  );
  const allocationsValid = Object.values(allocations).every(
    (value) => Number.isFinite(value) && value >= 0 && value <= 100,
  );
  if (!allocationsValid || allocationTotal !== 100) {
    return finalizeState(
      previousState,
      "Preparation time must add up to exactly 100%.",
    );
  }

  const uniqueSupportIds = [...new Set(supportIds)];
  const previousEffects = booking.preparation?.effects;
  const confidenceBaseline = booking.preparation?.confidenceBaseline ?? previousState.player.confidence - (previousEffects?.confidenceDelta ?? 0);
  const effects = calculatePreparationEffects(allocations, uniqueSupportIds, confidenceBaseline);
  const costDelta = effects.cost - (previousEffects?.cost ?? 0);
  if (costDelta > previousState.player.cash) {
    return finalizeState(
      previousState,
      `Not enough cash to add the selected preparation support for ${tournament.name}.`,
    );
  }

  const confidenceDelta =
    effects.confidenceDelta - (previousEffects?.confidenceDelta ?? 0);
  const fatigueDelta =
    effects.fatigueDelta - (previousEffects?.fatigueDelta ?? 0);
  const strainDelta = effects.strainDelta - (previousEffects?.strainDelta ?? 0);
  const plan: TournamentPreparationPlan = {
    confidenceBaseline,
    focusId,
    allocations: { ...allocations },
    supportIds: uniqueSupportIds,
    effects,
    confirmedWeek: previousState.week,
    confirmedDate: previousState.currentDate,
  };
  const ledgerId = `preparation-${tournament.id}-${previousState.season}`;
  const ledger = previousState.finance.ledger.filter(
    (entry) => entry.id !== ledgerId,
  );
  if (effects.cost > 0) {
    ledger.unshift({
      id: ledgerId,
      date: previousState.currentDate,
      description: `${tournament.name} preparation support`,
      category: "Preparation",
      amount: effects.cost,
      type: "Expense",
    });
  }

  return finalizeState(
    {
      ...previousState,
      player: {
        ...previousState.player,
        cash: previousState.player.cash - costDelta,
        confidence: clamp(
          previousState.player.confidence + confidenceDelta,
          0,
          100,
        ),
        fatigue: clamp(previousState.player.fatigue + fatigueDelta, 0, 100),
      },
      trainingCondition: {
        ...previousState.trainingCondition,
        strain: clamp(
          previousState.trainingCondition.strain + strainDelta,
          0,
          100,
        ),
      },
      finance: {
        ...previousState.finance,
        ledger,
      },
      history: { ...previousState.history, tournamentHistory: previousState.history.tournamentHistory.map(h=>h.tournamentId===tournament.id && h.startDate===tournament.startDate ? {...h,preparationPaid:effects.cost}:h) },
      travel: {
        ...previousState.travel,
        bookings: {
          ...previousState.travel.bookings,
          [tournamentId]: {
            ...booking,
            preparation: plan,
          },
        },
      },
      inbox: [
        createInboxMessage(
          {
            sender: "Performance Team",
            subject: `${tournament.name} preparation confirmed`,
            preview: `${effects.sharpnessDelta >= 0 ? "+" : ""}${effects.sharpnessDelta} sharpness, ${effects.confidenceDelta >= 0 ? "+" : ""}${effects.confidenceDelta} confidence, ${effects.fatigueDelta} fatigue and ${effects.strainDelta} strain. Temporary form will peak in the opening round.`,
            priority: "Medium",
            actionLabel: "Match Preview",
            actionRoute: "/match/preview",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Confirmed ${tournament.name} preparation. Temporary match form is ready.`,
    "Tournament Preparation",
  );
}

function getTravelBooking(state: GameState, tournamentId: string) {
  return state.travel.bookings[tournamentId] ?? null;
}

function getTravelReadinessModifier(state: GameState, tournamentId: string) {
  const booking = getTravelBooking(state, tournamentId);
  if (!booking) return -4;

  const travelOption = getTravelOption(booking.travelOptionId);
  const hotelOption = getHotelOption(booking.hotelOptionId);
  const caseComfort = state.equipment.currentCaseId
    ? (caseCatalog.find((item) => item.id === state.equipment.currentCaseId)
        ?.travelComfort ?? 0) / 35
    : 0;
  const sponsorSupport = state.sponsors.some(
    (sponsor) => normalizeSponsor(sponsor, 0).perk === "Travel",
  )
    ? 1.5
    : 0;
  return Math.round(
    (100 - travelOption.fatigueValue) / 12 +
      hotelOption.preparationValue / 20 +
      hotelOption.recoveryValue / 25 -
      travelOption.delayRisk / 20 +
      caseComfort +
      sponsorSupport,
  );
}

function getCurrentRanking(state: GameState) {
  if (
    state.player.rankingLabel === "World Ranking" &&
    state.careerSystems.pro.worldRank != null
  ) {
    return state.careerSystems.pro.worldRank;
  }

  const rawRanking =
    state.rankings.find((row) => row.playerName === state.player.fullName)
      ?.ranking ??
    state.player.amateurRanking ??
    state.player.worldRanking ??
    0;
  return rawRanking;
}

function getSponsorSlotLimit(state: GameState) {
  const ranking = getCurrentRanking(state);
  if (ranking <= 16 || state.player.reputation >= 68) return 3;
  if (ranking <= 32 || state.player.reputation >= 52) return 2;
  return 1;
}

function parseContractWeeks(contractLength?: string) {
  const months = Number(contractLength?.match(/(\d+)/)?.[1] ?? 24);
  return Math.max(4, months * 4);
}

function normalizeSponsors(sponsors: SponsorDeal[]) {
  return sponsors.map(normalizeSponsor);
}

function getNextSponsorSlot(state: GameState) {
  const unlockedSlots = SPONSOR_SLOT_NAMES.slice(0, getSponsorSlotLimit(state));
  return (
    unlockedSlots.find(
      (slot) => !state.sponsors.some((sponsor) => sponsor.slot === slot),
    ) ?? null
  );
}

function refreshSponsorOffers(state: GameState) {
  const ranking = getCurrentRanking(state);
  const sponsorCapacity = getSponsorSlotLimit(state);
  const accessBand = getProTourAccessBand(state);
  const recentProProfile = getRecentProfessionalHistoryProfile(state.history);
  const effectiveStrength = calculateCurrentEffectiveStrength(state);
  const recentTitles = state.history.tournamentHistory.filter(
    (entry) => entry.result === "Winner",
  ).length;
  const recentMajorFinals = state.history.tournamentHistory.filter(
    (entry) =>
      isMajorCareerEvent(entry) && getTournamentHistoryFinishTier(entry) >= 4,
  ).length;
  const recentWorldFinals = state.history.tournamentHistory.filter(
    (entry) =>
      /world championship/i.test(entry.tournamentName) &&
      getTournamentHistoryFinishTier(entry) >= 4,
  ).length;
  const recentMajorWins = state.history.tournamentHistory.filter(
    (entry) => isMajorCareerEvent(entry) && entry.result === "Winner",
  ).length;
  const recentWorldWins = state.history.tournamentHistory.filter(
    (entry) =>
      /world championship/i.test(entry.tournamentName) &&
      entry.result === "Winner",
  ).length;
  const careerRankingTitles = state.history.tournamentHistory.filter(
    (entry) =>
      entry.result === "Winner" && isProfessionalEventType(entry.eventType),
  ).length;
  const careerMajorWins = state.history.tournamentHistory.filter(
    (entry) => isMajorCareerEvent(entry) && entry.result === "Winner",
  ).length;
  const careerWorldWins = state.history.tournamentHistory.filter(
    (entry) =>
      /world championship/i.test(entry.tournamentName) &&
      entry.result === "Winner",
  ).length;
  const championStatusMultiplier = /world champion/i.test(
    state.player.competitiveStatus ?? state.player.careerStage,
  )
    ? 1.22
    : 1;
  const legacyMultiplier =
    1 +
    Math.min(0.28, careerRankingTitles * 0.012) +
    Math.min(0.32, careerMajorWins * 0.07) +
    Math.min(0.28, careerWorldWins * 0.16);
  const rankingMultiplier =
    ranking <= 1
      ? 2.9
      : ranking <= 4
        ? 2.35
        : ranking <= 8
          ? 2.05
          : accessBand === "top16"
            ? 1.78
            : accessBand === "top32"
              ? 1.36
              : accessBand === "top64"
                ? 1.08
                : accessBand === "bottomTour"
                  ? 0.74
                  : state.careerSystems.lateCareer.seniorActive
                    ? 0.46
                    : state.careerSystems.qTour.playerPoints > 0
                      ? 0.58
                      : ranking <= 32
                        ? 0.82
                        : 0.6;
  const reputationMultiplier = clamp(
    0.84 + state.player.reputation / 165,
    0.84,
    1.5,
  );
  const resultsMultiplier =
    1 +
    Math.min(0.35, recentTitles * 0.03) +
    Math.min(0.45, recentMajorFinals * 0.07) +
    Math.min(0.5, recentMajorWins * 0.12) +
    Math.min(0.38, recentWorldFinals * 0.12) +
    Math.min(0.6, recentWorldWins * 0.22);
  const volumeMultiplier =
    recentProProfile.latestSeasonMainTourEvents >= 8
      ? 1.12
      : recentProProfile.latestSeasonMainTourEvents >= 6
        ? 1.02
        : recentProProfile.latestSeasonMainTourEvents >= 4
          ? 0.86
          : 0.68;
  const winProfileMultiplier =
    recentProProfile.latestSeasonProWins >= 8
      ? 1.18
      : recentProProfile.latestSeasonProWins >= 4
        ? 1.02
        : recentProProfile.latestSeasonProWins >= 2
          ? 0.84
          : 0.62;
  const formMultiplier =
    recentProProfile.twoYearWinRate >= 0.5
      ? 1.16
      : recentProProfile.twoYearWinRate >= 0.35
        ? 1.04
        : recentProProfile.twoYearWinRate >= 0.2
          ? 0.9
          : 0.7;
  const strengthMultiplier =
    effectiveStrength >= 150
      ? 1.16
      : effectiveStrength >= 120
        ? 1.08
        : effectiveStrength >= 80
          ? 1
          : 0.78;
  const loadModifier = state.sponsors.length >= sponsorCapacity ? 0.96 : 1;
  const normalizedOffers = buildSponsorOffers(state.sponsorOffers);
  return normalizedOffers.map((offer) => {
    if (offer.status !== "Available" || offer.seasonal) return offer;

    const baseOffer =
      sponsorOfferCatalog.find((item) => item.id === offer.id) ?? offer;
    const categoryModifier =
      baseOffer.category === "Cue Maker"
        ? 0.04
        : baseOffer.category === "Social Media Partner"
          ? 0.06
          : baseOffer.category === "Clothing Sponsor"
            ? 0.05
            : 0;
    const rankingAccessReduction =
      ranking <= 1
        ? 24
        : accessBand === "top16"
          ? 18
          : accessBand === "top32"
            ? 10
            : accessBand === "top64"
              ? 4
              : accessBand === "bottomTour"
                ? -2
                : -8;
    const fitAdjustment =
      ranking <= 8
        ? 10
        : accessBand === "top16"
          ? 7
          : accessBand === "top32"
            ? 4
            : accessBand === "top64"
              ? 2
              : -5;
    const offTourPenalty = state.careerSystems.lateCareer.seniorActive
      ? -0.2
      : accessBand === "offTour"
        ? -0.14
        : 0;
    const marketMultiplier = clamp(
      rankingMultiplier *
        reputationMultiplier *
        resultsMultiplier *
        volumeMultiplier *
        winProfileMultiplier *
        formMultiplier *
        strengthMultiplier *
        championStatusMultiplier *
        legacyMultiplier *
        loadModifier +
        categoryModifier +
        offTourPenalty,
      0.3,
      5.8,
    );
    const monthlyValue = roundToNearestFifty(
      baseOffer.monthlyValue * marketMultiplier,
    );
    const minimumReputation = clamp(
      baseOffer.minimumReputation - rankingAccessReduction,
      28,
      92,
    );
    const brandFit = clamp(
      baseOffer.brandFit +
        fitAdjustment +
        Math.round((state.player.confidence - 60) / 8),
      35,
      98,
    );
    const tierNote =
      ranking <= 1
        ? "World number one status is driving peak sponsor competition."
        : recentWorldWins > 0
          ? "World Championship success is sharply lifting commercial demand."
          : accessBand === "top16"
            ? "Top-16 status and elite-event volume are lifting market demand."
            : accessBand === "top32"
              ? "Current main-tour results are lifting sponsor confidence."
              : accessBand === "top64"
                ? "Top-64 stability is starting to move commercial interest."
                : state.careerSystems.lateCareer.seniorActive
                  ? "Senior-tour positioning limits sponsor upside unless reputation is exceptional."
                  : state.careerSystems.qTour.playerPoints > 0
                    ? "Off-tour sponsor interest remains modest until main-tour status is secured."
                    : baseOffer.note;

    return {
      ...offer,
      monthlyValue,
      minimumReputation,
      brandFit,
      note: tierNote,
      tags:
        ranking <= 16 && !baseOffer.tags?.includes("Rising Stock")
          ? [...(baseOffer.tags ?? []), "Rising Stock"]
          : baseOffer.tags,
    };
  });
}

function createCareerSnapshot(state: GameState, label: string): CareerSnapshot {
  const completedTournamentResults = state.history.tournamentHistory
    .map((entry) => getTournamentHistoryCanonicalResult(entry))
    .filter((entry) => entry.matchesPlayed > 0);
  const wins = completedTournamentResults.reduce(
    (sum, entry) => sum + entry.wins,
    0,
  );
  const losses = completedTournamentResults.reduce(
    (sum, entry) => sum + entry.losses,
    0,
  );
  const matchesPlayed = completedTournamentResults.reduce(
    (sum, entry) => sum + entry.matchesPlayed,
    0,
  );
  const totalPrizeMoney = completedTournamentResults.reduce(
    (sum, entry) => sum + entry.prizeMoney,
    0,
  );
  const rankingDisplay = getDisplayedRanking(state);
  return {
    label,
    season: state.season,
    seasonNumber: seasonPosition(state).season,
    seasonWeek: seasonPosition(state).week,
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
  };
}

function appendSnapshot(snapshots: CareerSnapshot[], snapshot: CareerSnapshot) {
  const withoutDuplicate = snapshots.filter(
    (item) => !(item.week === snapshot.week && item.label === snapshot.label),
  );
  return [...withoutDuplicate.slice(-(HISTORY_LIMIT - 1)), snapshot];
}

function appendMatchLog(
  matchLog: CareerMatchLogEntry[],
  entry: CareerMatchLogEntry,
) {
  return [entry, ...matchLog].slice(0, MATCH_LOG_LIMIT);
}

function withHistorySnapshot(state: GameState, label: string) {
  return {
    ...state,
    history: {
      ...state.history,
      snapshots: appendSnapshot(
        state.history.snapshots,
        createCareerSnapshot(state, label),
      ),
    },
  };
}

function findSponsorOfferFromState(state: GameState, sponsorId: string) {
  return state.sponsorOffers.find((item) => item.id === sponsorId);
}

function improveAttribute(
  attributes: PlayerAttributes,
  label: string,
  delta: number,
) {
  for (const group of [
    attributes.technical,
    attributes.mental,
    attributes.physical,
  ]) {
    if (label in group) {
      group[label] = clamp(group[label] + delta, 1, 100);
      return;
    }
  }
}

function adjustAttribute(
  group: Record<string, number>,
  label: string,
  delta: number,
) {
  if (!(label in group) || delta === 0) return;
  group[label] = clamp(group[label] + delta, 1, 100);
}

function applySeasonalAgeRegression(
  attributes: PlayerAttributes,
  age: number,
  decline: DeclineProfile,
): PlayerAttributes {
  const profile = ageAttributeLoss(age,decline);
  const nextAttributes = deepCloneAttributes(attributes);
  const physicalLabels = [
    "Stamina",
    "Recovery Rate",
    "Shoulder Health",
    "Hand Steadiness",
    "Balance",
  ];
  const technicalLabels = [
    "Long Potting",
    "Cue Ball Control",
    "Break Building",
    "Safety Play",
    "Consistency",
  ];
  const mentalLabels = ["Focus", "Composure", "Resilience", "Big Match Nerve"];

  physicalLabels.forEach((label, index) => {
    const easedDelta =
      index >= 3 ? profile.physical * .65 : profile.physical;
    adjustAttribute(nextAttributes.physical, label, easedDelta);
  });
  technicalLabels.forEach((label, index) => {
    const easedDelta =
      index >= 3 ? profile.technical * .55 : profile.technical;
    adjustAttribute(nextAttributes.technical, label, easedDelta);
  });
  mentalLabels.forEach((label, index) => {
    const easedDelta = index >= 2 ? profile.mental * .4 : profile.mental;
    adjustAttribute(nextAttributes.mental, label, easedDelta);
  });

  return nextAttributes;
}

function getAttributeTrainingInterval(
  player: Player,
  attributes: PlayerAttributes,
) {
  const overall = calculateOverallRating({
    attributes,
    personalityTraits: player.personalityTraits,
    playingStyle: player.playingStyle,
  });

  if (player.age >= 65) return 44;
  if (player.age >= 55) return 34;
  if (player.age >= 45) return 24;
  if (player.age >= 40) return 16;
  if (player.age >= 35) return 10;
  if (overall >= 90) return 12;
  if (overall >= 85) return 9;
  if (overall >= 80) return 7;
  if (player.age <= 16) return 5;
  if (player.age <= 20) return 4;
  return 3;
}

function getTrainingLabelSeed(label: string) {
  return label
    .split("")
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function getVeteranDevelopmentOverallCeiling(age: number) {
  if (age >= 70) return 62;
  if (age >= 65) return 65;
  if (age >= 60) return 68;
  if (age >= 55) return 71;
  if (age >= 50) return 74;
  if (age >= 45) return 78;
  if (age >= 40) return 84;
  if (age >= 35) return 90;
  return 99;
}

function getScaledTrainingGain(
  state: Pick<GameState, "week" | "player" | "attributes">,
  label: string,
  rawGain: number,
) {
  if (rawGain <= 0) return 0;

  const overall = calculateOverallRating({
    attributes: state.attributes,
    personalityTraits: state.player.personalityTraits,
    playingStyle: state.player.playingStyle,
  });
  if (
    state.player.age >= 35 &&
    overall >= getVeteranDevelopmentOverallCeiling(state.player.age) - 1
  ) {
    return 0;
  }

  const interval = getAttributeTrainingInterval(state.player, state.attributes);
  const labelSeed = getTrainingLabelSeed(label);
  const pulseDue = (state.week + labelSeed) % interval === 0;
  const highLoadBonus =
    rawGain >= 5 &&
    interval <= 4 &&
    (state.week + labelSeed) % (interval * 2) === 0;

  return pulseDue || highLoadBonus ? 1 : 0;
}

function getSponsorWeeklyIncome(sponsors: SponsorDeal[]) {
  return Math.round(
    sponsors.reduce((sum, sponsor) => sum + sponsor.monthlyValue, 0) / 4,
  );
}

function getCoachCost(coachContracts: CoachContract[]) {
  return coachContracts.reduce((sum, contract) => sum + contract.weeklyCost, 0);
}

function createCompetitionDefaultRow(
  playerName: string,
  nation: string,
  ranking: number,
): CompetitionTableRow {
  return {
    id: `comp-${playerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
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
  };
}

function getPlayerProfessionalStatusNote(
  state: Pick<GameState, "player" | "careerSystems">,
  ranking?: number | null,
) {
  if (
    state.careerSystems.lateCareer.veteranActive &&
    state.careerSystems.pro.hasTourCard
  )
    return "Veteran Pro";
  if (ranking != null && ranking <= TOP_16_RANK_CUTOFF) return "Top 16";
  if (ranking != null && ranking <= TOP_32_RANK_CUTOFF) return "Top 32";
  if (ranking != null && ranking <= TOP_64_RANK_CUTOFF) return "Safe";
  if (
    ranking != null &&
    ranking <= MAIN_TOUR_POOL_SIZE &&
    state.careerSystems.pro.hasTourCard
  )
    return "At Risk";
  if (state.careerSystems.pro.retainedViaRanking) return "Retained Pro";

  switch (state.careerSystems.pro.survivalStatus) {
    case "Bubble":
      return "Bubble";
    case "At Risk":
      return "At Risk";
    case "Rookie Year 1":
    case "Rookie Year 2":
      return "Rookie Pro";
    case "Lost Card":
      return "Lost Card";
    default:
      return state.careerSystems.pro.hasTourCard ? "Rookie Pro" : "Development";
  }
}

type TournamentCircuitClass =
  | "youth"
  | "amateur"
  | "qTour"
  | "qSchool"
  | "rookieQualifier"
  | "ranking"
  | "playersSeries"
  | "eliteInvitational"
  | "ukMajor"
  | "worldChampionshipQualifying"
  | "worldChampionshipMain"
  | "senior"
  | "exhibition";

type PlayerTournamentProfile = {
  worldRank: number;
  accessBand: ProTourAccessBand;
  primaryCircuit: CompetitionTableKey;
  playerAge: number;
  hasTourCard: boolean;
  hasMainTourStatus: boolean;
  isYouthEligible: boolean;
  isEliteAmateur: boolean;
  isQTourPathway: boolean;
  isQSchoolPathway: boolean;
  isRookieOrProtected: boolean;
  isTop64: boolean;
  isTop32: boolean;
  isTop16: boolean;
  isMajorContender: boolean;
  isWorldChampion: boolean;
  isSeniorCircuit: boolean;
  isSeniorEligible: boolean;
  competitiveStatus: string;
  currentTier: string;
};

type TournamentEntryAccess = {
  allowed: boolean;
  accessBand: ProTourAccessBand;
  seededProtection: number;
  reason: string | null;
};

function getWorldRankForAccess(
  state: Pick<GameState, "player" | "careerSystems" | "competitionTables"> &
    Partial<Pick<GameState, "history">>,
) {
  const rawWorldRank =
    state.careerSystems.pro.worldRank ??
    state.competitionTables.world.find(
      (row) => row.playerName === state.player.fullName,
    )?.ranking ??
    state.player.worldRanking ??
    999;

  // Entry and seeding follow the earned ranking, including at the start of a new season.
  return rawWorldRank;
}

function isWorldChampionshipQualifierTournament(tournament: Tournament) {
  return /world championship qualifying/i.test(tournament.name);
}

function isWorldChampionshipMainDrawTournament(tournament: Tournament) {
  return (
    /world championship/i.test(tournament.name) &&
    !/qualifying/i.test(tournament.name) &&
    !/seniors world championship/i.test(tournament.name)
  );
}

function isPlayersSeriesTournament(
  tournament: Pick<Tournament, "name" | "type">,
) {
  return (
    (tournament.type === "Ranking" ||
      tournament.type === "Major" ||
      tournament.type === "Invitational") &&
    /world grand prix|players championship|tour championship/i.test(
      tournament.name,
    )
  );
}

function getPlayersSeriesOneYearCutoff(tournament: Pick<Tournament, "name">) {
  if (/tour championship/i.test(tournament.name)) return 12;
  if (/players championship/i.test(tournament.name)) return 16;
  return 32;
}

function isDirectAmateurTourCardRoute(tournament: Tournament) {
  if (tournament.type !== "Amateur") return false;
  if (/women/i.test(tournament.name)) return false;
  return /tour card|wst card|professional tour card/i.test(
    tournament.reward ?? "",
  );
}

function isOpenOffTourQSchoolPlayer(
  state: Pick<GameState, "player" | "careerSystems">,
) {
  return (
    state.player.age >= 0 &&
    !state.careerSystems.pro.hasTourCard &&
    (state.careerSystems.pro.worldRank ?? state.player.worldRanking ?? 999) >
      TOP_64_RANK_CUTOFF
  );
}

function getTournamentCircuitClass(
  tournament: Tournament,
): TournamentCircuitClass {
  if (
    tournament.type === "Junior" ||
    tournament.type === "Regional Youth" ||
    tournament.type === "National Youth"
  )
    return "youth";
  if (tournament.type === "Amateur") return "amateur";
  if (tournament.type === "Q Tour") return "qTour";
  if (tournament.type === "Q School") return "qSchool";
  if (tournament.type === "Senior") return "senior";
  if (tournament.type === "Exhibition") return "exhibition";
  if (isWorldChampionshipMainDrawTournament(tournament))
    return "worldChampionshipMain";
  if (isWorldChampionshipQualifierTournament(tournament))
    return "worldChampionshipQualifying";
  if (isPlayersSeriesTournament(tournament)) return "playersSeries";
  if (tournament.type === "Invitational") return "eliteInvitational";
  if (tournament.type === "Major" && /tour championship/i.test(tournament.name))
    return "eliteInvitational";
  if (
    tournament.type === "Major" &&
    /uk major|uk championship/i.test(tournament.name) &&
    !/qualifying/i.test(tournament.name)
  )
    return "ukMajor";
  if (
    (tournament.type === "Professional Tour" || tournament.type === "Major") &&
    /qualifying|qualifier|rookie/i.test(tournament.name)
  )
    return "rookieQualifier";
  return "ranking";
}

function hasExplicitQSchoolEligibility(
  state: Pick<GameState, "careerSystems">,
) {
  return (
    state.careerSystems.qSchool.cooldownSeasonsRemaining <= 0 &&
    (state.careerSystems.qSchool.campaignEligible ||
      state.careerSystems.qSchool.seededCampaign ||
      state.careerSystems.qSchool.directPlayoffEligible)
  );
}

function getPlayerTournamentProfile(
  state: Pick<
    GameState,
    "player" | "careerSystems" | "competitionTables" | "history"
  >,
): PlayerTournamentProfile {
  const worldRank = getWorldRankForAccess(state);
  const accessBand = getRankAccessBandFromWorldRank(
    worldRank,
    state.careerSystems.pro.hasTourCard,
  );
  const competitiveStatus =
    `${state.player.competitiveStatus ?? state.player.careerStage}`.toLowerCase();
  const currentTier = state.careerSystems.pro.currentTier.toLowerCase();
  const primaryCircuit = getPrimaryCompetitionKey(state);
  const hasTourCard = state.careerSystems.pro.hasTourCard;
  const hasMainTourStatus = hasTourCard || worldRank <= TOP_64_RANK_CUTOFF;
  const isEliteAmateur =
    !hasMainTourStatus &&
    (primaryCircuit === "amateur" ||
      state.player.rankingLabel === "Amateur Ranking" ||
      /elite amateur|amateur/.test(state.player.careerStage.toLowerCase()));
  const isQTourPathway =
    !hasMainTourStatus &&
    (primaryCircuit === "qTour" ||
      state.careerSystems.qTour.playerPoints > 0 ||
      /q tour/.test(currentTier) ||
      /q tour/.test(competitiveStatus));
  const isQSchoolPathway =
    !hasMainTourStatus && hasExplicitQSchoolEligibility(state);
  const isYouthEligible =
    state.player.age <= 21 &&
    !hasMainTourStatus &&
    (primaryCircuit === "youth" ||
      /junior|youth/.test(state.player.careerStage.toLowerCase()) ||
      isEliteAmateur);

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
    isRookieOrProtected:
      hasTourCard &&
      (state.careerSystems.pro.currentYear <= 2 ||
        state.careerSystems.pro.yearsRemaining > 0 ||
        /rookie/.test(currentTier) ||
        /at risk|bubble/.test(competitiveStatus)),
    isTop64: worldRank <= TOP_64_RANK_CUTOFF,
    isTop32: worldRank <= TOP_32_RANK_CUTOFF,
    isTop16: worldRank <= TOP_16_RANK_CUTOFF,
    isMajorContender: /major contender/.test(competitiveStatus),
    isWorldChampion: /world champion/.test(competitiveStatus),
    isSeniorCircuit:
      state.careerSystems.lateCareer.seniorActive ||
      state.careerSystems.lateCareer.legendStatus,
    isSeniorEligible: state.player.age >= 40,
    competitiveStatus,
    currentTier,
  };
}

function isMainTourEventType(tournament: Tournament) {
  return (
    tournament.type === "Professional Tour" ||
    tournament.type === "Ranking" ||
    tournament.type === "Major" ||
    tournament.type === "Invitational" ||
    tournament.eventClass === "Professional"
  );
}

function getProTourAccessBand(
  state: Pick<GameState, "player" | "careerSystems" | "competitionTables"> &
    Partial<Pick<GameState, "history">>,
): ProTourAccessBand {
  const worldRank = getWorldRankForAccess(state);

  return getRankAccessBandFromWorldRank(
    worldRank,
    state.careerSystems.pro.hasTourCard,
  );
}

export function getTournamentEntryAccess(
  state: Pick<
    GameState,
    "player" | "careerSystems" | "competitionTables" | "history"
  > & Partial<Pick<GameState, 'rollingRankings' | 'season' | 'realism' | 'worldPlayers' | 'currentDate'>>,
  tournament: Tournament,
): TournamentEntryAccess {
  const profile = getPlayerTournamentProfile(state);
  if (entryClosed(state.currentDate,tournament)) return {allowed:false,accessBand:profile.accessBand,seededProtection:0,reason:'Entry closed on '+entryDeadline(tournament)+'. Choose another event in the calendar.'};
  if (resolveTournamentFormat(tournament).formatFamily === 'administrative') return { allowed: false, accessBand: profile.accessBand, seededProtection: 0, reason: 'Automatic Order of Merit review; there are no matches to enter.' };
  const frozen = state.rollingRankings?.seedings[rankingEventKey(tournament)];
  const lockedWorldRank = frozen?.world[state.player.fullName];
  if (lockedWorldRank && (countsForWorldRanking(tournament) || tournament.type === 'Invitational')) {
    profile.worldRank = lockedWorldRank;
    profile.isTop16 = lockedWorldRank <= 16;
    profile.isTop32 = lockedWorldRank <= 32;
  }
  const accessBand = profile.accessBand;
  const seededProtection = getSeededProtectionForBand(accessBand);
  const hasMajorWin = state.history.tournamentHistory.some(
    (entry) =>
      /major|world championship|masters|tour championship/i.test(
        entry.tournamentName,
      ) && entry.result === "Winner",
  );
  const tournamentClass = getTournamentCircuitClass(tournament);

  if (state.careerSystems.lateCareer.retired) {
    return {
      allowed: false,
      accessBand,
      seededProtection,
      reason: "This player is retired from competitive events.",
    };
  }

  // Entry rules select a field; ranking changes during that same event must not
  // disqualify an established entrant. Date, travel and equipment still gate play.
  if (tournament.status === "Entered" && state.history.tournamentHistory.some(entry =>
    entry.tournamentId === tournament.id && entry.startDate === tournament.startDate && entry.matchesPlayed > 0)) {
    return { allowed: true, accessBand, seededProtection, reason: null };
  }

  const pathwayReason = pathwayEntryReason(tournament, {
    name: state.player.fullName, nation: state.player.nationality, age: state.player.age,
    dateOfBirth: state.player.dateOfBirth, hasTourCard: profile.hasMainTourStatus,
    residence: state.realism?.relocationDate ? residenceRegion(state.realism.home) : nationRegion(state.player.nationality),
    residentSince: state.realism?.regionalResidenceSince ?? state.realism?.relocationDate,
  }, state);
  if (tournament.type === 'Q Tour' && /play.off/i.test(tournament.name) && state.season) {
    const qualified = qTourQualification({ rollingRankings: state.rollingRankings, season: state.season }, tournament.startDate);
    if (!qualified.playoff.includes(state.player.fullName)) return { allowed: false, accessBand, seededProtection: 0, reason: qualified.automatic === state.player.fullName ? 'You won the Q Tour Europe automatic tour card.' : 'Qualify through the Q Tour Europe or regional standings to enter the Global Play-Offs.' };
  }
  if (tournament.type === 'Senior' && state.season && state.worldPlayers) {
    const selection = seniorQualification({ ...state, season: state.season, worldPlayers: state.worldPlayers }, tournament.startDate);
    const list = /golden ticket/i.test(tournament.name) ? selection.goldenField : /world seniors championship/i.test(tournament.name) ? selection.championship : /british seniors open/i.test(tournament.name) ? selection.british : null;
    if (list && !list.includes(state.player.fullName)) return { allowed: false, accessBand, seededProtection: 0, reason: 'Requires a seniors ranking place, qualifying win or invitation for this event.' };
  }
  const pendingHumanCard = tournament.type === 'Q School' && state.history.tournamentHistory.some(e =>
    (!state.season || e.season === state.season) && e.startDate <= tournament.startDate && /tour card/i.test(e.reward ?? ''));
  if (pathwayReason || pendingHumanCard) return { allowed: false, accessBand, seededProtection: 0, reason: pathwayReason ?? 'You have already secured a next-season tour card.' };

  if (
    isAttachedQualifying(tournament) &&
    profile.worldRank <= (resolveTournamentFormat(tournament).seedOffset ?? 0)
  ) {
    return {
      allowed: false,
      accessBand,
      seededProtection,
      reason:
        `Top-${resolveTournamentFormat(tournament).seedOffset} main-tour players should enter the main draw directly rather than qualifier routes.`,
    };
  }

  const attachedQualified = recordedMajorQualifiers(state, tournament);
  if (['internationalChampionship', 'worldOpen', 'homeNationsMain'].includes(resolveTournamentFormat(tournament).id)) {
    const allowed = profile.hasMainTourStatus && (profile.worldRank <= attachedMainDirectSeeds(tournament) || (attachedQualified ?? []).includes(state.player.fullName));
    return { allowed, accessBand, seededProtection, reason: allowed ? null : 'You did not qualify for this main draw.' };
  }

  switch (tournamentClass) {
    case "youth": {
      const allowed = !profile.hasMainTourStatus;
      return {
        allowed,
        accessBand,
        seededProtection: 0,
        reason: allowed
          ? null
          : "Youth events are limited to youth-phase and age-eligible off-tour players.",
      };
    }
    case "amateur": {
      const ageLimit = pathwayAgeLimit(tournament);
      const directCardRoute = isDirectAmateurTourCardRoute(tournament);
      const ageEligible = true; // Event-specific age and federation checks run above.
      const allowed = /pro.am/i.test(tournament.name) || (
        ageEligible &&
        !profile.hasMainTourStatus &&
        (profile.isEliteAmateur ||
          profile.isQTourPathway ||
          profile.isQSchoolPathway ||
          profile.primaryCircuit === "amateur" ||
          profile.primaryCircuit === "youth" ||
          profile.isSeniorCircuit ||
          directCardRoute ||
          ageLimit != null));
      const reason =
        ageLimit != null
          ? `This route is limited to age-eligible off-tour players under the event age limit (${ageLimit}).`
          : directCardRoute
            ? "Direct-card amateur routes are for eligible off-tour amateurs in good standing."
            : "Amateur events are for off-tour amateur, Q Tour, Q School, and youth pathway players.";
      return {
        allowed,
        accessBand,
        seededProtection: 0,
        reason: allowed ? null : reason,
      };
    }
    case "qTour": {
      const allowed = !profile.hasMainTourStatus;
      return {
        allowed,
        accessBand,
        seededProtection: 0,
        reason: allowed
          ? null
          : "Q Tour is reserved for amateur and off-tour pre-pro pathways.",
      };
    }
    case "qSchool": {
      const allowed =
        isOpenOffTourQSchoolPlayer(state) &&
        !/review|order of merit/i.test(tournament.name);
      return {
        allowed,
        accessBand,
        seededProtection: 0,
        reason: allowed
          ? null
          : "Q School is open to eligible off-tour players; junior entries include guardian consent.",
      };
    }
    case "senior": {
      const allowed = true; // Age checked above; professionals may enter seniors events.
      return {
        allowed,
        accessBand,
        seededProtection: 0,
        reason: allowed
          ? null
          : "Senior events require age 40+; active professionals are eligible.",
      };
    }
    case "exhibition": {
      const allowed =
        state.player.age >= 40 ||
        state.player.reputation >= 70 ||
        profile.hasMainTourStatus ||
        profile.isEliteAmateur ||
        profile.isSeniorCircuit;
      return {
        allowed,
        accessBand,
        seededProtection,
        reason: allowed
          ? null
          : "This exhibition is aimed at invited amateur, pro, veteran, or high-reputation players.",
      };
    }
    case "worldChampionshipMain": {
      const allowed = profile.hasMainTourStatus && (profile.isTop16 || tournament.legacyEntryHonoured === true || Boolean(recordedMajorQualifiers(state, tournament)?.includes(state.player.fullName)));
      return { allowed, accessBand, seededProtection, reason: allowed ? null : 'Requires a top-16 place at the seeding cut-off or a completed qualifying win.' };
    }
    case "worldChampionshipQualifying": {
      if (frozen) {
        const allowed = profile.hasMainTourStatus && !profile.isTop16 && profile.worldRank <= MAIN_TOUR_POOL_SIZE;
        return { allowed, accessBand, seededProtection, reason: allowed ? null : 'Qualifying is for players outside the top 16 at the designated cut-off.' };
      }
      const allowed =
        profile.hasMainTourStatus &&
        !profile.isTop16 &&
        profile.worldRank <= MAIN_TOUR_POOL_SIZE;
      return {
        allowed,
        accessBand,
        seededProtection,
        reason: allowed
          ? null
          : "World Championship qualifying is for ranks 17-128 with active main-tour status.",
      };
    }
    case "eliteInvitational": {
      if (/masters-style|elite season opener/i.test(tournament.name)) {
        const allowed =
          profile.isTop16 ||
          profile.isMajorContender ||
          profile.isWorldChampion;
        return {
          allowed,
          accessBand,
          seededProtection,
          reason: allowed
            ? null
            : "This elite invitational is reserved for top-16 and proven elite players.",
        };
      }

      if (/champion of champions/i.test(tournament.name)) {
        const allowed =
          profile.isTop16 || hasMajorWin || profile.isWorldChampion;
        return {
          allowed,
          accessBand,
          seededProtection,
          reason: allowed
            ? null
            : "Champion-style invitationals require Top 16 status or a title-winning route.",
        };
      }

      if (/tour championship/i.test(tournament.name)) {
        const allowed =
          profile.worldRank <= 12 ||
          profile.isMajorContender ||
          profile.isWorldChampion;
        return {
          allowed,
          accessBand,
          seededProtection,
          reason: allowed
            ? null
            : "This elite final-field event is reserved for top-end main-tour contenders.",
        };
      }

      const allowed = profile.isTop16 || profile.isTop32;
      return {
        allowed,
        accessBand,
        seededProtection,
        reason: allowed
          ? null
          : "This invitational is limited to upper main-tour seeds.",
      };
    }
    case "playersSeries": {
      const oneYearRank =
        state.rollingRankings?.seedings[rankingEventKey(tournament)]?.oneYear[state.player.fullName] ??
        state.careerSystems.pro.oneYearRank ??
        getCompetitionRowForPlayer(
          state.competitionTables,
          "oneYear",
          state.player.fullName,
        )?.ranking ??
        999;
      const cutoff = getPlayersSeriesOneYearCutoff(tournament);
      const allowed = profile.hasMainTourStatus && oneYearRank <= cutoff;
      return {
        allowed,
        accessBand,
        seededProtection,
        reason: allowed
          ? null
          : `This Players Series event is restricted to the top ${cutoff} on the one-year list.`,
      };
    }
    case "ukMajor": {
      if (state.rollingRankings) {
        const allowed = profile.hasMainTourStatus && (profile.isTop16 || Boolean(recordedMajorQualifiers(state, tournament)?.includes(state.player.fullName)));
        return { allowed, accessBand, seededProtection, reason: allowed ? null : 'Requires a top-16 place at the seeding cut-off or a completed qualifying win.' };
      }
      const allowed =
        profile.hasMainTourStatus && profile.worldRank <= MAIN_TOUR_POOL_SIZE;
      return {
        allowed,
        accessBand,
        seededProtection,
        reason: allowed
          ? null
          : "UK-style majors are open to active main-tour players only.",
      };
    }
    case "rookieQualifier": {
      const allowed =
        profile.hasMainTourStatus &&
        profile.worldRank <= MAIN_TOUR_POOL_SIZE &&
        profile.worldRank > (resolveTournamentFormat(tournament).seedOffset ?? 0);
      return {
        allowed,
        accessBand,
        seededProtection,
        reason: allowed
          ? null
          : "This qualifier requires main-tour status and a place outside its protected seed band.",
      };
    }
    case "ranking": {
      const allowed =
        profile.hasMainTourStatus && profile.worldRank <= MAIN_TOUR_POOL_SIZE;
      return {
        allowed,
        accessBand,
        seededProtection,
        reason: allowed
          ? null
          : "Ranking events require active main-tour status or retained Top 64 standing.",
      };
    }
    default:
      return {
        allowed: false,
        accessBand,
        seededProtection: 0,
        reason: "This event is not open from the current pathway.",
      };
  }
}

function isEliteHostedMainDrawTournament(tournament: Tournament) {
  if (isWorldChampionshipQualifierTournament(tournament)) {
    return false;
  }

  return (
    isWorldChampionshipMainDrawTournament(tournament) ||
    (/masters|uk major|uk championship|tour championship|champion of champions/i.test(
      tournament.name,
    ) &&
      tournament.type !== "Q School") ||
    (tournament.type === "Invitational" &&
      /elite|masters-style/i.test(tournament.name))
  );
}

export function getTournamentEntryCashRequirement(
  state: Pick<
    GameState,
    "player" | "careerSystems" | "competitionTables" | "history"
  >,
  tournament: Tournament,
) {
  const entryAccess = getTournamentEntryAccess(state, tournament);
  if (
    entryAccess.allowed &&
    entryAccess.accessBand === "top16" &&
    isEliteHostedMainDrawTournament(tournament)
  ) {
    if (isWorldChampionshipMainDrawTournament(tournament)) {
      return 0;
    }

    return Math.round(tournament.entryFee * 0.15);
  }

  if (tournament.type === 'Q School' && !/review/i.test(tournament.name) && state.history.tournamentHistory.some(e => e.startDate.slice(0,4) === tournament.startDate.slice(0,4) && e.eventType === 'Q School' && e.entryFee > 0 && (/asia[ -]*oceania/i.test(e.tournamentName) === /asia[ -]*oceania/i.test(tournament.name)))) return 0;
  return tournament.entryFee;
}

export function withdrawTournamentState(
  previousState: GameState,
  tournamentId: string,
): GameState {
  const tournament = previousState.tournaments.find(
    (item) => item.id === tournamentId,
  );
  if (!tournament || tournament.status !== "Entered") {
    return finalizeState(
      previousState,
      "There is no active entry to withdraw.",
    );
  }
  if (
    previousState.liveMatch?.tournamentId === tournamentId &&
    previousState.liveMatch.status === "In Progress"
  ) {
    return finalizeState(
      previousState,
      "Finish the live match before withdrawing from this event.",
    );
  }
  if (
    previousState.tournamentProgress.tournamentId === tournamentId &&
    previousState.tournamentProgress.completedRounds.length > 0
  ) {
    return finalizeState(
      previousState,
      "This event has already started and can no longer be withdrawn from.",
    );
  }

  const cashRequirement = getTournamentEntryCashRequirement(
    previousState,
    tournament,
  );
  const daysUntilStart = Math.ceil(
    (getTournamentDateValue(tournament.startDate) -
      getTournamentDateValue(previousState.currentDate)) /
      86_400_000,
  );
  const entryRefund =
    daysUntilStart >= 7 ? Math.round(cashRequirement * 0.75) : 0;
  const travelRefund =
    daysUntilStart >= 7
      ? Math.round(
          (previousState.travel.bookings[tournamentId]?.totalCost ?? 0) * 0.5,
        )
      : 0;
  const totalRefund = entryRefund + travelRefund;

  return finalizeState(
    {
      ...previousState,
      player: {
        ...previousState.player,
        cash: previousState.player.cash + totalRefund,
      },
      tournaments: previousState.tournaments.map((item) =>
        item.id === tournamentId ? { ...item, status: "Available" } : item,
      ),
      travel: {
        bookings: Object.fromEntries(
          Object.entries(previousState.travel.bookings).filter(
            ([id]) => id !== tournamentId,
          ),
        ),
      },
      tournamentProgress:
        previousState.tournamentProgress.tournamentId === tournamentId
          ? createEmptyTournamentProgress()
          : previousState.tournamentProgress,
      liveMatch:
        previousState.liveMatch?.tournamentId === tournamentId
          ? null
          : previousState.liveMatch,
      history: {
        ...previousState.history,
        tournamentHistory: previousState.history.tournamentHistory.filter(
          (entry) =>
            entry.tournamentId !== tournamentId ||
            entry.season !== previousState.season,
        ),
      },
    },
    totalRefund > 0
      ? `Withdrew from ${tournament.name}; £${totalRefund} was refunded.`
      : `Withdrew from ${tournament.name}; the late cancellation was non-refundable.`,
    "Tournament Withdrawal",
  );
}

const ENTERABLE_TOURNAMENT_STATUSES = new Set<Tournament["status"]>([
  "Booked",
  "Available",
  "High Cost",
]);

export function getNextEligibleTournament(state: GameState) {
  return selectNextEligibleTournament(state, getTournamentEntryAccess);
}

export type { TournamentPlayability };

export function getTournamentPlayability(
  state: GameState,
  tournament: Tournament,
): TournamentPlayability {
  return evaluateTournamentPlayability(
    state,
    tournament,
    getTournamentEntryAccess,
  );
}

function isDateInsideTournament(
  dateValue: string | undefined,
  tournament: Tournament,
) {
  if (!dateValue) return true;
  const playedOn = getTournamentDateValue(dateValue);
  return (
    playedOn >= getTournamentDateValue(tournament.startDate) &&
    playedOn <=
      getTournamentDateValue(tournament.endDate ?? tournament.startDate)
  );
}

/** Preserve an entry the old season-open rules already accepted. This is a
 * one-time compatibility exception, never a title, win, or qualifying result. */
function repairLegacyWorldEntry(state: GameState): GameState {
  if (state.schemaVersion >= 12) return state;
  const main = state.tournaments.find(isWorldChampionshipMainDrawTournament);
  const qualifier = state.tournaments.find(isWorldChampionshipQualifierTournament);
  if (!main || !qualifier) return state;
  const history = state.history.tournamentHistory.filter(h => h.season === state.season);
  const accepted = history.find(h => h.tournamentId === main.id && h.status === 'Entered' && h.matchesPlayed === 0);
  const automaticQualifyingSkip = qualifier.seasonOpenAccessLock === 'worldMainDraw' && qualifier.status === 'Skipped' && !history.some(h => h.tournamentId === qualifier.id);
  const honour = main.seasonOpenAccessLock === 'worldMainDraw' && automaticQualifyingSkip && accepted &&
    (main.status === 'Available' || main.status === 'Booked' || main.status === 'Entered') &&
    (main.endDate ?? main.startDate) >= state.currentDate && state.careerSystems.pro.hasTourCard;
  const otherActive = state.tournaments.some(t => t.id !== main.id && t.status === 'Entered');
  const tournaments = state.tournaments.map(t => {
    if (t.id === main.id) return { ...t, seasonOpenAccessLock: null,
      ...(honour ? { legacyEntryHonoured: true, status: otherActive ? 'Booked' as const : 'Entered' as const } : {}) };
    if (t.id === qualifier.id) return { ...t, seasonOpenAccessLock: null,
      ...(!honour && automaticQualifyingSkip && (t.endDate ?? t.startDate) > state.currentDate ? { status: 'Available' as const } : {}) };
    return t;
  });
  let repaired = { ...state, tournaments };
  if (honour && !otherActive && state.tournamentProgress.tournamentId !== main.id) {
    const event = tournaments.find(t => t.id === main.id)!;
    const currentRound = getTournamentEntryRound(repaired, event);
    repaired = { ...repaired, tournamentProgress: { ...createEmptyTournamentProgress(), tournamentId: main.id, rulesVersion: 3, currentRound, draw: buildTournamentDraw(repaired, event, currentRound) } };
  }
  return repaired;
}

export function repairGameState(state: GameState): GameState {
  state = recoverTournamentArchive(state);
  state = preserveSeasonEmails(state);
  state = repairTournamentPayouts(initializeRollingRankings(state), getTournamentPlacementAwards);
  state = ensureSeasonClock(state);
  state = ensureWorldPopulation(repairCpuHistoricalRecords(repairLegacyWorldEntry(initializeRollingRankings(state))));
  state = { ...state, tournaments: state.tournaments.map(t => isChampionshipLeague(t) && t.status !== 'Completed' ? { ...t, format: 'Groups: up to 4 frames, draws allowed · final best of 5', prizeMoney: 328000, winnerPrize: 33000, runnerUpPrize: 23000 } : t) };
  state = { ...state, tournaments: state.tournaments.map(t => {
    if (t.status === 'Completed') return t;
    const audited = tournamentCatalog.find(a => a.id === t.id);
    const economics = audited && (t.type === 'Q School' || t.type === 'Q Tour' && qTourRegion(t) === 'Europe' || /seniors tour.*event/i.test(t.name)) ? { prizeMoney: audited.prizeMoney, totalPrizeFund: audited.totalPrizeFund, winnerPrize: audited.winnerPrize, runnerUpPrize: audited.runnerUpPrize, semiFinalPrize: audited.semiFinalPrize, quarterFinalPrize: audited.quarterFinalPrize, rankingValue: audited.rankingValue, unlockRequirement: audited.unlockRequirement, ...(t.status !== 'Entered' ? { entryFee: audited.entryFee } : {}) } : {};
    return { ...t, ...economics, format: tournamentFormatSummary(t) };
  }) };
  const activeRulesEvent = state.tournaments.find(t => t.id === state.tournamentProgress.tournamentId && t.status === 'Entered');
  if (activeRulesEvent && (state.tournamentProgress.rulesVersion !== 3 || (resolveTournamentFormat(activeRulesEvent).groupMode && !isGroupDraw(state.tournamentProgress.draw))) && !state.liveMatch && state.tournamentProgress.completedRounds.length === 0) {
    const currentRound = getTournamentEntryRound(state, activeRulesEvent);
    state = { ...state, tournamentProgress: { ...state.tournamentProgress, rulesVersion: 3, currentRound, draw: buildTournamentDraw(state, activeRulesEvent, currentRound) } };
  }
  if (!state.equipment.chalkConditions && state.equipment.currentChalkId) {
    const id = state.equipment.currentChalkId;
    state = { ...state, equipment: { ...state.equipment,
      chalkConditions: { [id]: state.equipment.chalkCondition },
      chalkStock: { ...state.equipment.chalkStock, [id]: Math.max(state.equipment.chalkStock[id] ?? 0, state.equipment.chalkCondition > 0 ? 1 : 0) },
    } };
  }
  state = initializeCareerDepth(state);
  state = { ...state, realism: realismOf(state) };
  state = { ...state, tournaments: state.tournaments.map(t => ({ ...t, televisedRounds: t.televisedRounds ?? tournamentCatalog.find(event => event.id === t.id)?.televisedRounds ?? [] })) };
  const currentDateValue = getTournamentDateValue(state.currentDate);
  const invalidMatchIds = new Set(
    state.matches
      .filter((match) => {
        if (match.season && match.season !== state.season) return false;
        const tournament = state.tournaments.find(
          (event) => event.id === match.tournamentId,
        );
        if (!tournament) return false;
        if (match.playedOn)
          return !isDateInsideTournament(match.playedOn, tournament);
        return (
          getTournamentDateValue(state.currentDate) <
          getTournamentDateValue(tournament.startDate)
        );
      })
      .map((match) => match.id),
  );
  const invalidTournamentIds = new Set(
    state.matches
      .filter((match) => invalidMatchIds.has(match.id))
      .map((match) => match.tournamentId)
      .filter((id): id is string => Boolean(id)),
  );
  const repairedTournaments = state.tournaments.map((tournament) => {
    const eventEnded =
      getTournamentDateValue(tournament.endDate ?? tournament.startDate) <
      currentDateValue;
    const invalidEntry =
      tournament.status === "Entered" &&
      ((!getTournamentEntryAccess(state, tournament).allowed && state.tournamentProgress.tournamentId !== tournament.id) || eventEnded);
    const invalidHistory = invalidTournamentIds.has(tournament.id);
    if (!invalidEntry && !invalidHistory) return tournament;
    return {
      ...tournament,
      status: (eventEnded ? "Skipped" : "Available") as Tournament["status"],
    };
  });
  const activeProgressTournament = repairedTournaments.find(
    (tournament) => tournament.id === state.tournamentProgress.tournamentId,
  );
  const keepProgress = Boolean(
    activeProgressTournament?.status === "Entered",
  );
  const keepLiveMatch =
    Boolean(
      state.liveMatch &&
      state.liveMatch.status === "Completed" &&
      !invalidTournamentIds.has(state.liveMatch.tournamentId),
    ) ||
    Boolean(
      state.liveMatch &&
      keepProgress &&
      state.liveMatch.tournamentId === activeProgressTournament?.id,
    );
  const repairedMatches = state.matches.filter(
    (match) => !invalidMatchIds.has(match.id),
  );
  const repairedMatchLog = state.history.matchLog.filter((entry) => {
    if (entry.season !== state.season) return true;
    const tournament = repairedTournaments.find(
      (event) => event.id === entry.tournamentId,
    );
    return tournament ? isDateInsideTournament(entry.date, tournament) : true;
  });
  const recordedResults = (
    repairedMatchLog.length > 0 ? repairedMatchLog : repairedMatches
  )
    .slice(0, 10)
    .reverse()
    .map((entry) => (entry.result === "Drawn" ? "D" : entry.result === "Won" ? "W" : "L"));
  const repairedPlayerForm =
    recordedResults.length > 0 ? recordedResults : state.player.form.slice(-10);
  const playerFormRepaired =
    repairedPlayerForm.join("") !== state.player.form.join("");
  const migrateHumanTitles = state.schemaVersion < 7;
  const archivedCareerTitles = state.history.seasonRecords.reduce(
    (total, season) => total + season.titles,
    0,
  );
  const currentTitleEntries = state.history.tournamentHistory.filter((entry) =>
    historyEntryAwardsCareerTitle(entry, repairedTournaments),
  );
  const repairedCompetitionTables = COMPETITION_TABLE_KEYS.reduce<CompetitionTablesState>(
    (tables, key) => {
      const currentTableTitles = currentTitleEntries.filter((entry) => {
        const tournament = repairedTournaments.find(
          (event) =>
            event.id === entry.tournamentId ||
            event.name === entry.tournamentName,
        );
        return tournament
          ? getCompetitionKeysForTournament(tournament).includes(key)
          : key === "world" || key === "oneYear";
      }).length;
      const canonicalHumanTitles =
        (key === "world" ? archivedCareerTitles : 0) + currentTableTitles;

      return {
        ...tables,
        [key]: rerankCompetitionRows(
          (state.competitionTables[key] ?? [])
            .filter((row) => !isTemporaryQualifierName(row.playerName))
            .map((row) =>
              migrateHumanTitles && row.playerName === state.player.fullName
                ? { ...row, titles: canonicalHumanTitles }
                : row,
            ),
          state.player.fullName,
        ),
      };
    },
    state.competitionTables,
  );
  const repairedRankingOrder = COMPETITION_TABLE_KEYS.some((key) =>
    repairedCompetitionTables[key].some(
      (row, index) => row.playerName !== state.competitionTables[key]?.[index]?.playerName,
    ),
  );

  const repairedLegacy = state.history.legacy ?? careerLegacyOf({ ...state, matches: repairedMatches, history: { ...state.history, matchLog: repairedMatchLog, tournamentHistory: state.history.tournamentHistory.filter(entry => (entry.season !== state.season || !invalidTournamentIds.has(entry.tournamentId))) } });
  return evolveTourSkills(reconcileAchievements({
    ...state,
    schemaVersion: SAVE_SCHEMA_VERSION,
    player: {
      ...state.player,
      form: repairedPlayerForm,
      legacyScore: careerLegacyRating(repairedLegacy).score,
    },
    coaches: mergeCoachCatalog(state.coaches),
    inbox: normalizeInboxMessages(
      state.inbox,
      repairedTournaments,
      state.currentDate,
    ),
    tournaments: repairedTournaments,
    matches: repairedMatches,
    competitionTables: repairedCompetitionTables,
    worldPlayers: normalizeWorldPlayers(
      state.worldPlayers.filter(
        (record) => !isTemporaryQualifierName(record.playerName),
      ),
      repairedCompetitionTables,
      state.player,
    ),
    travel: {
      bookings: Object.fromEntries(
        Object.entries(state.travel.bookings).filter(([tournamentId]) => {
          const tournament = repairedTournaments.find(
            (event) => event.id === tournamentId,
          );
          return Boolean(
            tournament && (tournament.status === "Entered" || getTournamentEntryAccess(state, tournament).allowed),
          );
        }),
      ),
    },
    tournamentProgress: keepProgress
      ? {
          ...state.tournamentProgress,
          rankingBaseline: state.tournamentProgress.rankingBaseline ?? {},
        }
      : createEmptyTournamentProgress(),
    liveMatch: keepLiveMatch ? normalizeLiveMatchState(state.liveMatch) : null,
    history: {
      ...state.history,
      legacy: repairedLegacy,
      matchLog: repairedMatchLog,
      tournamentHistory: state.history.tournamentHistory.filter(
        (entry) => (entry.season !== state.season || !invalidTournamentIds.has(entry.tournamentId)),
      ),
    },
    lastAction:
      invalidMatchIds.size > 0 ||
      playerFormRepaired ||
      migrateHumanTitles ||
      repairedRankingOrder ||
      repairedTournaments.some(
        (tournament, index) =>
          tournament.status !== state.tournaments[index]?.status,
      )
        ? "Save upgraded: repaired recent form, tournament records and title totals, then rebuilt every ranking table strictly by points."
        : state.lastAction,
  }));
}

function shouldPlayerBeInWorldTable(
  state: Pick<
    GameState,
    "player" | "careerSystems" | "competitionTables" | "tournaments"
  >,
) {
  return (
    state.careerSystems.pro.hasTourCard ||
    (state.careerSystems.pro.worldRank ?? 999) <= TOP_64_RANK_CUTOFF
  );
}

function buildPlayerCompetitionRowForTable(
  state: Pick<
    GameState,
    "player" | "careerSystems" | "competitionTables" | "worldPlayers"
  >,
  tableKey: "world" | "oneYear",
  rows: CompetitionTableRow[],
) {
  const existingWorldRow = getCompetitionRowForPlayer(
    state.competitionTables,
    "world",
    state.player.fullName,
  );
  const existingOneYearRow = getCompetitionRowForPlayer(
    state.competitionTables,
    "oneYear",
    state.player.fullName,
  );
  const playerWorldRecord = state.worldPlayers.find(
    (record) => record.playerName === state.player.fullName,
  );
  const currentRow = rows.find(
    (row) => row.playerName === state.player.fullName,
  );
  const companionRow =
    tableKey === "world" ? existingOneYearRow : existingWorldRow;
  const bestKnownRanking =
    tableKey === "world"
      ? (existingWorldRow?.ranking ??
        state.careerSystems.pro.worldRank ??
        state.player.worldRanking ??
        null)
      : (existingOneYearRow?.ranking ??
        state.careerSystems.pro.oneYearRank ??
        null);
  const fallbackEvents =
    currentRow?.eventsPlayed ??
    companionRow?.eventsPlayed ??
    (tableKey === "world" ? 0 : 0);
  const fallbackWins = currentRow?.wins ?? companionRow?.wins ?? 0;
  const fallbackLosses =
    currentRow?.losses ??
    companionRow?.losses ??
    Math.max(0, fallbackEvents - fallbackWins);

  return {
    ...createCompetitionDefaultRow(
      state.player.fullName,
      getNationCode(state.player.nationality),
      rows.length + 1,
    ),
    ...(currentRow ?? companionRow ?? {}),
    playerName: state.player.fullName,
    nation: getNationCode(state.player.nationality),
    points: Math.max(0, currentRow?.points ?? companionRow?.points ?? 0),
    prizeMoney: Math.max(
      0,
      currentRow?.prizeMoney ??
        companionRow?.prizeMoney ??
        (tableKey === "world" ? 0 : 0),
    ),
    eventsPlayed: fallbackEvents,
    wins: fallbackWins,
    losses: fallbackLosses,
    titles: Math.max(0, currentRow?.titles ?? companionRow?.titles ?? 0),
    statusNote: getPlayerProfessionalStatusNote(
      state,
      bestKnownRanking ?? playerWorldRecord?.highestWorldRank ?? null,
    ),
  };
}

function ensurePlayerInCompetitionTable(
  state: Pick<
    GameState,
    | "player"
    | "careerSystems"
    | "competitionTables"
    | "worldPlayers"
    | "tournaments"
  >,
  tableKey: CompetitionTableKey,
): CompetitionTablesState {
  const dedupedRows = state.competitionTables[tableKey].filter(
    (row, index, rows) =>
      rows.findIndex((entry) => entry.playerName === row.playerName) === index,
  );

  if (tableKey !== "world" && tableKey !== "oneYear") {
    return {
      ...state.competitionTables,
      [tableKey]: rerankCompetitionRows(dedupedRows, state.player.fullName),
    };
  }

  const shouldHaveWorldRow = shouldPlayerBeInWorldTable(state);
  const withoutPlayer = dedupedRows.filter(
    (row) => row.playerName !== state.player.fullName,
  );
  const rebuiltPlayerRow = shouldHaveWorldRow
    ? buildPlayerCompetitionRowForTable(state, tableKey, dedupedRows)
    : null;
  const nextRows = shouldHaveWorldRow
    ? [...withoutPlayer, rebuiltPlayerRow!]
    : withoutPlayer;

  return {
    ...state.competitionTables,
    [tableKey]: rerankCompetitionRows(nextRows, state.player.fullName),
  };
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
  playerEventComplete: boolean,
  opponentEventComplete: boolean,
  statusNote?: string,
) {
  let nextRows = [...rows];

  if (!nextRows.some((row) => row.playerName === playerName)) {
    nextRows.push(
      createCompetitionDefaultRow(
        playerName,
        playerNation,
        nextRows.length + 1,
      ),
    );
  }

  if (!nextRows.some((row) => row.playerName === opponentName)) {
    nextRows.push(
      createCompetitionDefaultRow(
        opponentName,
        opponentNation,
        nextRows.length + 1,
      ),
    );
  }

  nextRows = nextRows.map((row) => {
    if (row.playerName === playerName) {
      return {
        ...row,
        points: row.points + playerPointsDelta,
        prizeMoney: row.prizeMoney + playerPrizeDelta,
        eventsPlayed: row.eventsPlayed + (playerEventComplete ? 1 : 0),
        wins: row.wins + (won ? 1 : 0),
        losses: row.losses + (won ? 0 : 1),
        titles: row.titles + (playerWonTitle ? 1 : 0),
        statusNote,
      };
    }

    if (row.playerName === opponentName) {
      return {
        ...row,
        points: row.points + opponentPointsDelta,
        prizeMoney: row.prizeMoney + opponentPrizeDelta,
        eventsPlayed: row.eventsPlayed + (opponentEventComplete ? 1 : 0),
        wins: row.wins + (won ? 0 : 1),
        losses: row.losses + (won ? 1 : 0),
        titles: row.titles + (opponentWonTitle ? 1 : 0),
      };
    }

    return row;
  });

  return rerankCompetitionRows(nextRows, playerName);
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
  playerEventComplete: boolean,
  opponentEventComplete: boolean,
  statusNote?: string,
) {
  const keys = getCompetitionKeysForTournament(tournament);
  if (keys.length === 0) return tables;

  return keys.reduce<CompetitionTablesState>(
    (nextTables, key) => ({
      ...nextTables,
      [key]: updateCompetitionTableRows(
        nextTables[key].map((row) => ({ ...row, movement: 0 })),
        player.fullName,
        getNationCode(player.nationality),
        opponentName,
        opponentNation,
        playerPointsDelta,
        key === "qSchool" ? 0 : playerPrizeDelta,
        opponentPointsDelta,
        key === "qSchool" ? 0 : opponentPrizeDelta,
        won,
        playerWonTitle,
        opponentWonTitle,
        playerEventComplete,
        opponentEventComplete,
        statusNote,
      ),
    }),
    tables,
  );
}

function updateCompetitionTablesFromCpuDraw(
  tables: CompetitionTablesState,
  baselineTables: CompetitionTablesState,
  rankingBaseline: TournamentProgressState["rankingBaseline"],
  tournament: Tournament,
  draw: BracketRound[],
  player: Player,
  playerOpponents: string[],
) {
  const keys = getCompetitionKeysForTournament(tournament);
  if (keys.length === 0) return tables;
  const playerOpponentSet = new Set(playerOpponents);
  const participants = new Map<string, { nation: string; rank: number }>();
  const changes = new Map<
    string,
    {
      wins: number;
      losses: number;
      points: number;
      prizeMoney: number;
      titles: number;
    }
  >();
  const placements = new Map<
    string,
    { round: TournamentRound; champion: boolean }
  >();
  const getChange = (name: string) => {
    const existing = changes.get(name) ?? {
      wins: 0,
      losses: 0,
      points: 0,
      prizeMoney: 0,
      titles: 0,
    };
    changes.set(name, existing);
    return existing;
  };

  draw.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.top.name !== "TBD")
        participants.set(match.top.name, {
          nation: match.top.nation,
          rank: match.top.rank,
        });
      if (match.bottom.name !== "TBD")
        participants.set(match.bottom.name, {
          nation: match.bottom.nation,
          rank: match.bottom.rank,
        });
      if (
        match.top.name === player.fullName ||
        match.bottom.name === player.fullName ||
        typeof match.top.score !== "number" ||
        typeof match.bottom.score !== "number"
      )
        return;
      if (tournament.type === 'Q School' || /seniors tour\s*-\s*event/i.test(tournament.name)) { getChange(match.top.name).points += match.top.score; getChange(match.bottom.name).points += match.bottom.score; }
      if (match.top.score === match.bottom.score) return;
      const topWon = match.top.score > match.bottom.score;
      const winner = topWon ? match.top.name : match.bottom.name;
      const loser = topWon ? match.bottom.name : match.top.name;
      const winnerChange = getChange(winner);
      const loserChange = getChange(loser);
      winnerChange.wins += 1;
      loserChange.losses += 1;
      placements.set(loser, { round: round.label, champion: false });
      if (/^final$/i.test(round.label)) {
        if (tournamentAwardsCareerTitle(tournament)) {
          winnerChange.titles += 1;
        }
        placements.set(winner, { round: round.label, champion: true });
      }
    });
  });

  if (isGroupDraw(draw)) {
    participants.forEach((_, name) => {
      if (name !== player.fullName) Object.assign(getChange(name), { prizeMoney: groupCompetitionAward(draw, tournament, name, getTournamentPlacementAwards).prizeMoney, points: groupCompetitionAward(draw, tournament, name, getTournamentPlacementAwards).rankingPoints });
    });
  }
  placements.forEach((placement, name) => {
    if (isGroupDraw(draw)) return;
    const change = getChange(name);
    const award = getTournamentPlacementAwards(
      tournament,
      placement.round,
      placement.champion,
    );
    const frameRanking = tournament.type === 'Q School' || /seniors tour\s*-\s*event/i.test(tournament.name);
    const openingQTourLoss = tournament.type === 'Q Tour' && qTourRegion(tournament) === 'Europe' && change.wins === 0;
    if (!frameRanking && !openingQTourLoss) change.points += award.rankingPoints;
    change.prizeMoney += award.prizeMoney;
  });

  return keys.reduce<CompetitionTablesState>((nextTables, key) => {
    let rows = [...nextTables[key]];
    const storedBaseline = rankingBaseline[key];
    const baselineRankings = new Map(
      storedBaseline
        ? Object.entries(storedBaseline)
        : baselineTables[key].map((row) => [row.playerName, row.ranking]),
    );
    participants.forEach((identity, name) => {
      if (
        isTemporaryQualifierName(name) ||
        name === player.fullName ||
        rows.some((row) => row.playerName === name)
      )
        return;
      rows.push(
        createCompetitionDefaultRow(
          name,
          identity.nation || "INT",
          identity.rank || rows.length + 1,
        ),
      );
    });
    rows = rows.map((row) => {
      if (row.playerName === player.fullName) return row;
      const change = changes.get(row.playerName);
      if (!change && !participants.has(row.playerName)) return row;
      return {
        ...row,
        points: row.points + (change?.points ?? 0),
        prizeMoney:
          row.prizeMoney + (key === "qSchool" ? 0 : (change?.prizeMoney ?? 0)),
        eventsPlayed:
          row.eventsPlayed + (!isGroupDraw(draw) && playerOpponentSet.has(row.playerName) ? 0 : 1),
        wins: row.wins + (change?.wins ?? 0),
        losses: row.losses + (change?.losses ?? 0),
        titles: row.titles + (change?.titles ?? 0),
      };
    });
    return {
      ...nextTables,
      [key]: rerankCompetitionRows(rows, player.fullName, baselineRankings),
    };
  }, tables);
}

function updateWorldPlayersFromCompletedDraw(
  players: WorldPlayerRecord[],
  tables: CompetitionTablesState,
  draw: BracketRound[],
  humanPlayerName: string,
) {
  const results = new Map<string, Array<{ result: "W" | "L"; opponent: string }>>();
  const addResult = (name: string, result: "W" | "L", opponent: string) => {
    if (name === "TBD" || name === humanPlayerName) return;
    results.set(name, [...(results.get(name) ?? []), { result, opponent }]);
  };

  draw.forEach((round) => {
    round.matches.forEach((match) => {
      if (
        typeof match.top.score !== "number" ||
        typeof match.bottom.score !== "number" ||
        match.top.name === "TBD" ||
        match.bottom.name === "TBD"
      ) {
        return;
      }
      if (match.top.score === match.bottom.score) return;
      const topWon = match.top.score > match.bottom.score;
      addResult(match.top.name, topWon ? "W" : "L", match.bottom.name);
      addResult(match.bottom.name, topWon ? "L" : "W", match.top.name);
    });
  });

  const ratingByName = new Map(
    players.map((record) => [
      record.playerName,
      record.overallRating ?? inferWorldPlayerOverallRating(record, tables),
    ]),
  );

  return players.map((record) => {
    const playerResults = results.get(record.playerName);
    if (!playerResults || playerResults.length === 0) return record;
    const currentOverall =
      record.overallRating ?? inferWorldPlayerOverallRating(record, tables);
    const performanceProgress = playerResults.reduce((sum, entry) => {
      const opponentOverall = ratingByName.get(entry.opponent) ?? currentOverall;
      const expected = 1 / (1 + Math.pow(10, (opponentOverall - currentOverall) / 12));
      return sum + ((entry.result === "W" ? 1 : 0) - expected) * 0.42;
    }, 0);
    const developmentDrift =
      record.age <= 24 ? 0.04 * playerResults.length : 0;
    const nextProgress =
      (record.ratingProgress ?? 0) + performanceProgress + developmentDrift;
    const wholeChange =
      nextProgress >= 1
        ? Math.floor(nextProgress)
        : nextProgress <= -1
          ? Math.ceil(nextProgress)
          : 0;
    const potential = getWorldPlayerDevelopmentPotential(record);

    return {
      ...record,
      overallRating: clamp(
        currentOverall + (record.age >= playerDecline(record).startAge ? Math.min(0, wholeChange) : wholeChange),
        35,
        Math.max(currentOverall, potential),
      ),
      ratingProgress: nextProgress - wholeChange,
      recentResults: [
        ...(record.recentResults ?? []),
        ...playerResults.map((entry) => entry.result),
      ].slice(-10),
    };
  });
}

function seedCompetitionTableForStartingLevel(
  rows: CompetitionTableRow[],
  playerName: string,
  level: NewCareerStartingLevel,
) {
  const competitors = rows
    .filter((row) => row.playerName !== playerName)
    .sort(
      (left, right) =>
        right.points - left.points ||
        right.prizeMoney - left.prizeMoney ||
        left.playerName.localeCompare(right.playerName),
    );
  const targetIndex = Math.max(
    0,
    Math.min(competitors.length, level.targetRanking - 1),
  );
  const higherPoints =
    targetIndex > 0
      ? (competitors[targetIndex - 1]?.points ?? level.targetPoints + 1)
      : null;
  const lowerPoints =
    competitors[targetIndex]?.points ?? Math.max(0, level.targetPoints - 1);
  const seededPoints =
    higherPoints == null
      ? Math.max(level.targetPoints, lowerPoints + 1)
      : higherPoints > lowerPoints
        ? Math.floor((higherPoints + lowerPoints) / 2)
        : lowerPoints;
  return rerankCompetitionRows(
    rows.map((row) =>
      row.playerName === playerName
        ? {
            ...row,
            points: seededPoints,
            prizeMoney: 0,
            eventsPlayed: 0,
            wins: 0,
            losses: 0,
            titles: 0,
            statusNote: `Starting at ${level.name}`,
          }
        : row,
    ),
    playerName,
  );
}

function applyStartingLevelToCompetitionTables(
  tables: CompetitionTablesState,
  playerName: string,
  level: NewCareerStartingLevel,
): CompetitionTablesState {
  const removePlayerFromTable = (rows: CompetitionTableRow[]) =>
    rerankCompetitionRows(
      rows.filter((row) => row.playerName !== playerName),
      playerName,
    );
  const worldRows =
    level.competitionTable === "world"
      ? seedCompetitionTableForStartingLevel(tables.world, playerName, level)
      : removePlayerFromTable(tables.world);
  const oneYearRows =
    level.competitionTable === "world"
      ? rerankCompetitionRows(
          tables.oneYear.map((row) =>
            row.playerName === playerName
              ? {
                  ...row,
                  points: 0,
                  prizeMoney: 0,
                  eventsPlayed: 0,
                  wins: 0,
                  losses: 0,
                  titles: 0,
                  statusNote: "New season",
                }
              : row,
          ),
          playerName,
        )
      : removePlayerFromTable(tables.oneYear);

  return {
    world: worldRows,
    oneYear: oneYearRows,
    amateur:
      level.competitionTable === "amateur"
        ? seedCompetitionTableForStartingLevel(
            tables.amateur,
            playerName,
            level,
          )
        : removePlayerFromTable(tables.amateur),
    qTour:
      level.competitionTable === "qTour"
        ? seedCompetitionTableForStartingLevel(tables.qTour, playerName, level)
        : removePlayerFromTable(tables.qTour),
    qSchool:
      level.competitionTable === "qSchool"
        ? seedCompetitionTableForStartingLevel(
            tables.qSchool,
            playerName,
            level,
          )
        : removePlayerFromTable(tables.qSchool),
    senior:
      level.competitionTable === "senior"
        ? seedCompetitionTableForStartingLevel(tables.senior, playerName, level)
        : removePlayerFromTable(tables.senior),
    youth:
      level.competitionTable === "youth"
        ? seedCompetitionTableForStartingLevel(tables.youth, playerName, level)
        : removePlayerFromTable(tables.youth),
  };
}

function getCompetitionRowsForTournament(
  state: GameState,
  tournament: Tournament,
) {
  const key = getCompetitionKeysForTournament(tournament)[0];
  return key ? state.competitionTables[key] : state.rankings;
}

function getPrimaryCompetitionKey(
  state: Pick<GameState, "careerSystems" | "player"> &
    Partial<Pick<GameState, "competitionTables">>,
): CompetitionTableKey {
  const hasActiveQSchoolRoute =
    state.careerSystems.qSchool.campaignEligible ||
    state.careerSystems.qSchool.seededCampaign ||
    state.careerSystems.qSchool.directPlayoffEligible ||
    !!state.competitionTables?.qSchool.some(
      (row) => row.playerName === state.player.fullName,
    );
  if (state.careerSystems.lateCareer.seniorActive) return "senior";
  if (
    state.careerSystems.pro.hasTourCard ||
    (state.careerSystems.pro.worldRank ?? 999) <= 64
  )
    return "world";
  if (hasActiveQSchoolRoute && !state.careerSystems.pro.hasTourCard)
    return "qSchool";
  if (
    (state.player.rankingLabel === "Youth Ranking" ||
      /junior|youth/i.test(state.player.careerStage)) &&
    state.player.age <= 21
  )
    return "youth";
  if (
    state.careerSystems.qTour.playerPoints > 0 ||
    state.player.careerStage.toLowerCase().includes("q tour")
  )
    return "qTour";
  if (state.player.rankingLabel === "Amateur Ranking") return "amateur";
  if (state.player.age < 18) return "youth";
  return "amateur";
}

function getWorldRankingAgeDecayMultiplier(
  row: CompetitionTableRow,
  record?: WorldPlayerRecord,
) {
  if (!record || record.age <= 34) return 1;

  const matchesPlayed = row.wins + row.losses;
  const winRate = matchesPlayed > 0 ? row.wins / matchesPlayed : 0;
  const currentEliteRun =
    row.titles > 0 || (matchesPlayed >= 8 && row.wins >= 5 && winRate >= 0.48);
  const legacyEliteRelief =
    !currentEliteRun &&
    ((record.highestWorldRank ?? 999) <= TOP_16_RANK_CUTOFF ||
      record.majorTitles > 0 ||
      record.titles >= 4);
  const baseMultiplier =
    record.age <= 39
      ? 0.98 - (record.age - 35) * 0.015
      : record.age <= 44
        ? 0.86 - (record.age - 40) * 0.05
        : record.age <= 49
          ? 0.46 - (record.age - 45) * 0.055
          : Math.max(0.06, 0.18 - Math.min(10, record.age - 50) * 0.018);
  const relief = currentEliteRun ? 0.16 : legacyEliteRelief ? 0.08 : 0;

  return Math.min(1, Math.max(0.08, baseMultiplier + relief));
}

function applyWorldRankingDecay(
  row: CompetitionTableRow,
  record?: WorldPlayerRecord,
) {
  const matchesPlayed = row.wins + row.losses;
  const winRate = matchesPlayed > 0 ? row.wins / matchesPlayed : 0;
  const basePointsDecay =
    row.ranking <= 4
      ? 0.6
      : row.ranking <= 16
        ? 0.56
        : row.ranking <= 32
          ? 0.52
          : row.ranking <= 64
            ? 0.48
            : 0.42;
  const basePrizeDecay =
    row.ranking <= 4
      ? 0.58
      : row.ranking <= 16
        ? 0.54
        : row.ranking <= 32
          ? 0.5
          : row.ranking <= 64
            ? 0.46
            : 0.4;
  const inactivityPenalty =
    matchesPlayed < 6 ? (row.ranking <= 16 ? 0.92 : 0.78) : 1;
  const poorRunPenalty =
    matchesPlayed >= 6 && winRate < 0.35
      ? row.ranking <= 16
        ? 0.88
        : 0.74
      : 1;
  const titleRetention = row.titles > 0 ? 1.04 : 1;
  const eliteStabilityBonus =
    row.ranking <= 16 && matchesPlayed >= 8 && winRate >= 0.5 ? 1.02 : 1;
  const ageDecay = getWorldRankingAgeDecayMultiplier(row, record);
  const pointsDecay =
    basePointsDecay *
    inactivityPenalty *
    poorRunPenalty *
    titleRetention *
    eliteStabilityBonus *
    ageDecay;
  const prizeDecay =
    basePrizeDecay *
    inactivityPenalty *
    poorRunPenalty *
    titleRetention *
    ageDecay;

  return {
    ...row,
    points: Math.max(0, Math.round(row.points * pointsDecay)),
    prizeMoney: Math.max(0, Math.round(row.prizeMoney * prizeDecay)),
    eventsPlayed: Math.max(0, Math.round(row.eventsPlayed * 0.5)),
    wins: Math.max(0, Math.round(row.wins * 0.55)),
    losses: Math.max(0, Math.round(row.losses * 0.55)),
    titles: row.titles > 0 ? 1 : 0,
    statusNote: undefined,
  };
}

function resetSeasonalCompetitionRows(
  rows: CompetitionTableRow[],
  playerName: string,
) {
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
  }));
}

function movePlayerToMinimumRank(
  rows: CompetitionTableRow[],
  playerName: string,
  minimumRank: number,
) {
  const currentIndex = rows.findIndex((row) => row.playerName === playerName);
  if (currentIndex === -1 || currentIndex + 1 >= minimumRank) {
    return rows;
  }

  const nextRows = [...rows];
  const [playerRow] = nextRows.splice(currentIndex, 1);
  const targetIndex = Math.min(nextRows.length, Math.max(0, minimumRank - 1));
  const targetRow = nextRows[targetIndex] ?? nextRows.at(-1);
  const cappedPoints = targetRow
    ? Math.min(playerRow.points, Math.max(0, targetRow.points - 1))
    : playerRow.points;
  const cappedPrizeMoney = targetRow
    ? Math.min(playerRow.prizeMoney, Math.max(0, targetRow.prizeMoney - 1))
    : playerRow.prizeMoney;

  nextRows.splice(targetIndex, 0, {
    ...playerRow,
    points: cappedPoints,
    prizeMoney: cappedPrizeMoney,
    statusNote: playerRow.statusNote ?? "Ranking proof required",
  });

  return nextRows.map((row, index) => ({
    ...row,
    ranking: index + 1,
    movement: row.ranking - (index + 1),
    highlighted: row.playerName === playerName,
  }));
}

function getPathwayRankProofFloor(
  key: CompetitionTableKey,
  seasonRecord: CareerSeasonRecord,
  age: number,
) {
  if (key === "world" || key === "oneYear" || key === "senior") return 1;

  const matches = seasonRecord.wins + seasonRecord.losses;
  const winRate = matches > 0 ? seasonRecord.wins / matches : 0;
  const hasTitle =
    seasonRecord.titles > 0 ||
    seasonRecord.qTourWins > 0 ||
    seasonRecord.qSchoolCardsWon > 0;
  const losingNoTitleSeason =
    matches >= 8 && seasonRecord.wins <= seasonRecord.losses && !hasTitle;
  const lowWinNoTitleSeason = matches >= 8 && winRate < 0.45 && !hasTitle;
  const thinEvidenceSeason = matches < 8 && !hasTitle;

  if (key === "youth") {
    if (age <= 16 && losingNoTitleSeason) return 16;
    if (losingNoTitleSeason || lowWinNoTitleSeason) return 12;
    if (thinEvidenceSeason) return 8;
    if (!hasTitle && winRate < 0.55) return 4;
    return 1;
  }

  if (key === "amateur") {
    if (losingNoTitleSeason || lowWinNoTitleSeason) return 18;
    if (thinEvidenceSeason) return 12;
    if (!hasTitle && winRate < 0.55) return 6;
    return 1;
  }

  if (key === "qTour") {
    if (losingNoTitleSeason || lowWinNoTitleSeason) return 20;
    if (thinEvidenceSeason) return 14;
    if (!hasTitle && winRate < 0.55) return 8;
    return 1;
  }

  if (key === "qSchool") {
    if (seasonRecord.qSchoolCardsWon > 0) return 1;
    if (losingNoTitleSeason || lowWinNoTitleSeason) return 14;
    if (thinEvidenceSeason) return 10;
    if (!hasTitle && winRate < 0.6) return 5;
  }

  return 1;
}

function enforcePathwayRankingProofFloors(
  tables: CompetitionTablesState,
  playerName: string,
  seasonRecord: CareerSeasonRecord,
  age: number,
): CompetitionTablesState {
  return COMPETITION_TABLE_KEYS.reduce<CompetitionTablesState>(
    (nextTables, key) => {
      const floor = getPathwayRankProofFloor(key, seasonRecord, age);
      if (floor <= 1) return nextTables;

      return {
        ...nextTables,
        [key]: movePlayerToMinimumRank(nextTables[key], playerName, floor),
      };
    },
    tables,
  );
}

function initializeCompetitionTablesForNewCareer(
  tables: CompetitionTablesState,
  playerName: string,
  level: NewCareerStartingLevel,
): CompetitionTablesState {
  const rankRows = (rows: CompetitionTableRow[]) =>
    rerankCompetitionRows(rows, playerName);
  const primaryRows = rankRows(tables[level.competitionTable]).map((row) =>
    row.playerName === playerName
      ? {
          ...row,
          statusNote: `Starting at ${level.name}`,
        }
      : row,
  );

  return {
    world:
      level.competitionTable === "world" ? primaryRows : rankRows(tables.world),
    oneYear:
      level.competitionTable === "world"
        ? rankRows(tables.oneYear).map((row) =>
            row.playerName === playerName
              ? { ...row, statusNote: `Starting at ${level.name}` }
              : row,
          )
        : rankRows(tables.oneYear),
    amateur:
      level.competitionTable === "amateur"
        ? primaryRows
        : rankRows(tables.amateur),
    qTour:
      level.competitionTable === "qTour" ? primaryRows : rankRows(tables.qTour),
    qSchool:
      level.competitionTable === "qSchool"
        ? primaryRows
        : rankRows(tables.qSchool),
    senior:
      level.competitionTable === "senior"
        ? primaryRows
        : rankRows(tables.senior),
    youth:
      level.competitionTable === "youth" ? primaryRows : rankRows(tables.youth),
  };
}

function getNextUpcomingTournament(state: GameState) {
  return getNextEligibleTournament(state);
}

export function continueToNextTournamentState(previousState: GameState) {
  previousState = initializeCareerDepth(previousState);
  if (pendingStory(previousState) || previousState.seasonReview?.pending) return advanceWeekState(previousState);
  const initialTarget = getNextUpcomingTournament(previousState);
  if (!initialTarget) {
    return finalizeState(
      previousState,
      "No upcoming tournament is available to advance toward.",
    );
  }

  if (
    getTournamentDateValue(previousState.currentDate) >=
    getTournamentDateValue(initialTarget.startDate)
  ) {
    return finalizeState(
      previousState,
      `${initialTarget.name} has reached its start date.`,
    );
  }

  let nextState = previousState;
  let iterations = 0;

  while (iterations < 52) {
    const target = getNextUpcomingTournament(nextState);
    if (!target) break;
    if (
      getTournamentDateValue(nextState.currentDate) >=
      getTournamentDateValue(target.startDate)
    )
      break;

    const before = nextState;
    nextState = advanceWeekState(nextState);
    iterations += 1;
    if (nextState.currentDate === before.currentDate || pendingStory(nextState) || nextState.seasonReview?.pending) return nextState;
    if (depthOf(nextState).commitments.some(c => c.status === 'scheduled' && c.startDate === nextState.currentDate)) return nextState;

    if (nextState.liveMatch?.status === "In Progress") break;
    if (
      target.id !== getNextUpcomingTournament(nextState)?.id &&
      getTournamentDateValue(nextState.currentDate) >=
        getTournamentDateValue(target.startDate)
    )
      break;
  }

  const arrivedTarget = getNextUpcomingTournament(nextState);
  if (!arrivedTarget) {
    return finalizeState(
      nextState,
      `Advanced ${iterations} week${iterations === 1 ? "" : "s"} with no upcoming tournament now selected.`,
    );
  }

  return finalizeState(
    nextState,
    `Advanced ${iterations} week${iterations === 1 ? "" : "s"} to the ${arrivedTarget.name} tournament week.${getTournamentPlayability(nextState, arrivedTarget).travelBooked ? " Start the match from the Tournament Hub when ready." : " Book travel before starting the match."}`,
  );
}

function rollCompetitionTablesForward(
  tables: CompetitionTablesState,
  playerName: string,
  worldPlayers: WorldPlayerRecord[] = [],
  rolling = false,
): CompetitionTablesState {
  const worldPlayersByName = new Map(
    worldPlayers.map((record) => [record.playerName, record]),
  );

  return {
    world: tables.world.map((row, index) => ({
      ...(rolling ? row : applyWorldRankingDecay(row, worldPlayersByName.get(row.playerName))),
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
  };
}

function getWeightedRecentSeasonValue(
  record: WorldPlayerRecord,
  selector: (season: WorldPlayerSeasonRecord) => number,
) {
  const weights = [1, 0.45, 0.18, 0.08];

  return record.seasons
    .slice(0, weights.length)
    .reduce((sum, season, index) => sum + selector(season) * weights[index], 0);
}

function getRecentSeasonStat(
  record: WorldPlayerRecord,
  selector: (season: WorldPlayerSeasonRecord) => number,
  fallback = 0,
  currentValue?: number,
) {
  const latestArchivedValue = record.seasons[0]
    ? selector(record.seasons[0])
    : fallback;
  if (typeof currentValue === "number" && currentValue > 0) {
    return currentValue;
  }

  return latestArchivedValue || fallback;
}

function getMainTourAgeDecline(record: WorldPlayerRecord) {
  const profile = playerDecline(record);
  const age = 35 + record.age - profile.startAge;
  if (age <= 34) return 0;

  const rawDecline =
    age <= 38
      ? (age - 34) * 0.8
      : age <= 42
        ? 3.2 + (age - 38) * 1.6
        : age <= 47
          ? 9.6 + (age - 42) * 2.5
          : 22.1 + (age - 47) * 4.2;
  const activeLegendRelief =
    (record.highestWorldRank ?? 999) <= TOP_16_RANK_CUTOFF ||
    record.majorTitles > 0 ||
    record.titles >= 4
      ? 0.82
      : (record.highestWorldRank ?? 999) <= TOP_32_RANK_CUTOFF
        ? 0.92
        : 1;

  return rawDecline * activeLegendRelief * profile.rate;
}

function getMainTourYouthUpside(record: WorldPlayerRecord) {
  if (!record.hasTourCard) return 0;
  if (record.age <= 23) return 4;
  if (record.age <= 26) return 2.5;
  if (record.age <= 29) return 1;
  return 0;
}

function getWorldPlayerDevelopmentPotential(record: WorldPlayerRecord) {
  if (typeof record.developmentPotential === "number") {
    return clamp(record.developmentPotential, 55, 99);
  }

  const peakRank = record.highestWorldRank ?? 999;
  if (peakRank <= 4) return 96;
  if (peakRank <= TOP_16_RANK_CUTOFF) return 91;
  if (peakRank <= TOP_32_RANK_CUTOFF) return 86;
  if (peakRank <= TOP_64_RANK_CUTOFF) return 80;
  if (record.age <= 23) return 78;
  return 72;
}

function getCompetitiveStrengthBand(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
) {
  const worldRow = getCompetitionRowForPlayer(
    tables,
    "world",
    record.playerName,
  );
  const oneYearRow = getCompetitionRowForPlayer(
    tables,
    "oneYear",
    record.playerName,
  );
  const worldRank = worldRow?.ranking ?? 999;
  const oneYearRank = oneYearRow?.ranking ?? 999;
  const latestWins = getRecentSeasonStat(
    record,
    (season) => season.proWins,
    0,
    oneYearRow?.wins ?? 0,
  );
  const latestMainTourEvents = getRecentSeasonStat(
    record,
    (season) => season.mainTourEvents,
    0,
    oneYearRow?.eventsPlayed ?? 0,
  );
  const latestTitles = getRecentSeasonStat(
    record,
    (season) => season.titles,
    0,
    oneYearRow?.titles ?? 0,
  );
  const recentWeightedWins = getWeightedRecentSeasonValue(
    record,
    (season) => season.proWins,
  );
  const recentWeightedLosses = getWeightedRecentSeasonValue(
    record,
    (season) => season.proLosses,
  );
  const recentWinRate =
    recentWeightedWins + recentWeightedLosses > 0
      ? recentWeightedWins / (recentWeightedWins + recentWeightedLosses)
      : 0;
  const rankSignal = Math.max(0, 18 - Math.min(worldRank, oneYearRank) / 6);
  const developmentPotential = getWorldPlayerDevelopmentPotential(record);
  const prospectGrowthSignal =
    Math.max(0, developmentPotential - 82) *
    (record.age <= 23
      ? 0.85
      : record.age <= 27
        ? 0.65
        : record.age <= 31
          ? 0.38
          : 0.12);
  const strengthEstimate =
    48 +
    rankSignal +
    latestWins * 3.2 +
    latestTitles * 7 +
    record.majorTitles * 9 +
    recentWinRate * 36 +
    Math.min(14, latestMainTourEvents * 1.4) +
    prospectGrowthSignal +
    getMainTourYouthUpside(record) -
    Math.max(0, 5 - latestWins) * 2.2 -
    Math.max(0, 6 - latestMainTourEvents) * 1.4 -
    getMainTourAgeDecline(record);

  return clamp(Math.round(strengthEstimate), 42, 96);
}

function getWorldRankingCeiling(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
) {
  const oneYearRow = getCompetitionRowForPlayer(
    tables,
    "oneYear",
    record.playerName,
  );
  const latestSeasonWins = getRecentSeasonStat(
    record,
    (season) => season.proWins,
    0,
    oneYearRow?.wins ?? 0,
  );
  const latestSeasonLosses = getRecentSeasonStat(
    record,
    (season) => season.proLosses,
    0,
    oneYearRow?.losses ?? 0,
  );
  const latestMainTourEvents = getRecentSeasonStat(
    record,
    (season) => season.mainTourEvents,
    0,
    oneYearRow?.eventsPlayed ?? 0,
  );
  const latestSeasonTitles = getRecentSeasonStat(
    record,
    (season) => season.titles,
    0,
    oneYearRow?.titles ?? 0,
  );
  const weightedTwoYearWins =
    getWeightedRecentSeasonValue(record, (season) => season.proWins) +
    latestSeasonWins * 0.2;
  const weightedTwoYearLosses =
    getWeightedRecentSeasonValue(record, (season) => season.proLosses) +
    latestSeasonLosses * 0.2;
  const weightedTwoYearMatches = weightedTwoYearWins + weightedTwoYearLosses;
  const twoYearWinRate =
    weightedTwoYearMatches > 0
      ? weightedTwoYearWins / weightedTwoYearMatches
      : 0;
  const weightedMainTourEvents =
    getWeightedRecentSeasonValue(record, (season) => season.mainTourEvents) +
    latestMainTourEvents * 0.25;
  const rollingTwoYearPrize = getWeightedRecentSeasonValue(
    record,
    (season) => season.prizeMoney,
  );
  const rollingTitleScore = getWeightedRecentSeasonValue(
    record,
    (season) => season.titles,
  );
  const strengthBand = getCompetitiveStrengthBand(record, tables);
  const hasCurrentEliteResult =
    latestSeasonTitles > 0 || rollingTitleScore >= 1.25;
  const youngBreakthroughEligible =
    (record.age <= 30 &&
      latestSeasonWins >= 7 &&
      twoYearWinRate >= 0.38 &&
      strengthBand >= 82) ||
    (record.age <= 35 &&
      getWorldPlayerDevelopmentPotential(record) >= 92 &&
      latestSeasonWins >= 5 &&
      twoYearWinRate >= 0.32 &&
      strengthBand >= 82);
  const eliteTop16Eligible =
    latestMainTourEvents >= 6 &&
    latestSeasonWins >= 4 &&
    twoYearWinRate >= 0.2 &&
    strengthBand >= 80 &&
    (hasCurrentEliteResult || youngBreakthroughEligible);
  const top4Eligible =
    (latestSeasonWins >= 9 && twoYearWinRate >= 0.45) ||
    latestSeasonTitles >= 2 ||
    (latestSeasonTitles > 0 &&
      rollingTwoYearPrize >= 350000 &&
      weightedMainTourEvents >= 8 &&
      twoYearWinRate >= 0.4);

  if (
    (record.cardSource === "Q School" ||
      record.cardSource === "Q Tour" ||
      record.cardSource === "Playoff Route" ||
      record.cardSource === "Federation Route") &&
    record.currentYear <= 1 &&
    latestMainTourEvents === 0
  ) {
    return 96;
  }

  if (latestSeasonWins < 2 && twoYearWinRate < 0.18 && strengthBand < 75) {
    return 65;
  }

  if (!eliteTop16Eligible) {
    return 17;
  }

  if (record.age >= 50 && latestSeasonTitles === 0 && rollingTitleScore < 1.6) {
    return 33;
  }

  if (record.age >= 45 && latestSeasonTitles === 0 && rollingTitleScore < 1) {
    return 33;
  }

  if (!top4Eligible) {
    return 5;
  }

  return 1;
}

function getWorldSeedScore(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
) {
  const worldRank =
    getCompetitionRowForPlayer(tables, "world", record.playerName)?.ranking ??
    999;
  const oneYearRank =
    getCompetitionRowForPlayer(tables, "oneYear", record.playerName)?.ranking ??
    999;
  const worldRow = getCompetitionRowForPlayer(
    tables,
    "world",
    record.playerName,
  );
  const oneYearRow = getCompetitionRowForPlayer(
    tables,
    "oneYear",
    record.playerName,
  );
  const totalMatches = Math.max(
    0,
    (worldRow?.wins ?? 0) + (worldRow?.losses ?? 0),
  );
  const winRate = totalMatches > 0 ? (worldRow?.wins ?? 0) / totalMatches : 0;
  const latestSeason = record.seasons[0];
  const latestSeasonPrize = latestSeason?.prizeMoney ?? 0;
  const latestSeasonTitles = getRecentSeasonStat(
    record,
    (season) => season.titles,
    0,
    oneYearRow?.titles ?? 0,
  );
  const rollingTwoYearPrize = getWeightedRecentSeasonValue(
    record,
    (season) => season.prizeMoney,
  );
  const rollingRankScore = getWeightedRecentSeasonValue(record, (season) => {
    const bestRank = Math.min(
      season.worldRank ?? 999,
      season.oneYearRank ?? 999,
    );

    return Math.max(0, 80 - bestRank * 2.5);
  });
  const rollingTitleScore = getWeightedRecentSeasonValue(
    record,
    (season) => season.titles,
  );
  const latestSeasonWins = getRecentSeasonStat(
    record,
    (season) => season.proWins,
    0,
    oneYearRow?.wins ?? 0,
  );
  const latestSeasonLosses = getRecentSeasonStat(
    record,
    (season) => season.proLosses,
    0,
    oneYearRow?.losses ?? 0,
  );
  const latestSeasonMatches = latestSeasonWins + latestSeasonLosses;
  const latestSeasonWinRate =
    latestSeasonMatches > 0 ? latestSeasonWins / latestSeasonMatches : 0;
  const latestMainTourEvents = getRecentSeasonStat(
    record,
    (season) => season.mainTourEvents,
    0,
    oneYearRow?.eventsPlayed ?? 0,
  );
  const weightedTwoYearWins =
    getWeightedRecentSeasonValue(record, (season) => season.proWins) +
    latestSeasonWins * 0.2;
  const weightedTwoYearLosses =
    getWeightedRecentSeasonValue(record, (season) => season.proLosses) +
    latestSeasonLosses * 0.2;
  const weightedTwoYearMatches = weightedTwoYearWins + weightedTwoYearLosses;
  const twoYearWinRate =
    weightedTwoYearMatches > 0
      ? weightedTwoYearWins / weightedTwoYearMatches
      : 0;
  const weightedMainTourEvents =
    getWeightedRecentSeasonValue(record, (season) => season.mainTourEvents) +
    latestMainTourEvents * 0.25;
  const repeatedHighRankLowVolumeSeasons = record.seasons.filter(
    (season) =>
      (season.worldRank ?? 999) <= TOP_16_RANK_CUTOFF &&
      season.mainTourEvents < 6,
  ).length;
  const strengthBand = getCompetitiveStrengthBand(record, tables);
  const youngBreakthroughResult =
    record.age <= 30 &&
    latestSeasonWins >= 7 &&
    latestSeasonWinRate >= 0.38 &&
    strengthBand >= 82;
  const developmentPotential = getWorldPlayerDevelopmentPotential(record);
  const eliteProspectBreakthrough =
    record.age <= 35 &&
    developmentPotential >= 92 &&
    latestSeasonWins >= 5 &&
    latestSeasonWinRate >= 0.32 &&
    strengthBand >= 82;
  const hasMeaningfulEliteResult =
    latestSeasonTitles > 0 ||
    rollingTitleScore >= 1.25 ||
    youngBreakthroughResult ||
    eliteProspectBreakthrough;
  const ageDecline = getMainTourAgeDecline(record);
  const youthUpside = getMainTourYouthUpside(record);
  const eliteTop16Eligible =
    latestMainTourEvents >= 6 &&
    latestSeasonWins >= 4 &&
    twoYearWinRate >= 0.2 &&
    strengthBand >= 80 &&
    hasMeaningfulEliteResult;
  const top4Eligible =
    (latestSeasonWins >= 9 && latestSeasonWinRate >= 0.45) ||
    latestSeasonTitles >= 2 ||
    (latestSeasonTitles > 0 &&
      rollingTwoYearPrize >= 300000 &&
      weightedMainTourEvents >= 8 &&
      twoYearWinRate >= 0.4);
  const lowLatestWinsPenalty =
    latestSeasonWins < 4 ? (4 - latestSeasonWins) * 95 : 0;
  const lowTwoYearWinRatePenalty =
    twoYearWinRate < 0.2 ? Math.round((0.2 - twoYearWinRate) * 900) : 0;
  const lowVolumePenalty =
    latestMainTourEvents < 6 ? (6 - latestMainTourEvents) * 72 : 0;
  const noEliteResultsPenalty = !hasMeaningfulEliteResult ? 130 : 0;
  const weakStrengthPenalty = strengthBand < 80 ? (80 - strengthBand) * 12 : 0;
  const repeatedHighRankLowVolumePenalty =
    repeatedHighRankLowVolumeSeasons * 88;
  const eliteCredibilityPenalty =
    worldRank <= 4 && !top4Eligible
      ? 950
      : worldRank <= TOP_16_RANK_CUTOFF && !eliteTop16Eligible
        ? 420
        : 0;
  const bottomTourProtectionPenalty =
    worldRank > TOP_64_RANK_CUTOFF && record.hasTourCard && latestSeasonWins < 3
      ? (3 - latestSeasonWins) * 24
      : 0;
  const veteranBonus =
    record.age >= 35 &&
    record.age <= 42 &&
    (record.highestWorldRank ?? 999) <= 32 &&
    twoYearWinRate >= 0.3
      ? 18
      : 0;
  const ageDeclinePenalty =
    Math.round(ageDecline * 160) +
    (record.age >= 40 && latestSeasonTitles === 0 && rollingTitleScore < 1
      ? 300
      : 0) +
    (record.age >= 44 && latestSeasonTitles === 0 && rollingTitleScore < 1
      ? 950
      : 0) +
    (record.age >= 48 && latestSeasonTitles === 0 ? 1700 : 0) +
    (record.age >= 52 && latestSeasonTitles === 0 ? 2600 : 0) +
    (record.age >= 45 && latestSeasonWins < 4
      ? (4 - latestSeasonWins) * 190
      : 0);
  const youthUpsideBonus =
    Math.round(youthUpside * 110) +
    (record.age <= 26 && record.hasTourCard && latestSeasonWins >= 3
      ? 220
      : 0) +
    (record.age <= 30 &&
    latestSeasonWinRate >= 0.42 &&
    latestMainTourEvents >= 6
      ? 180
      : 0) +
    (record.age <= 28 && latestSeasonTitles > 0 ? 260 : 0);
  const eliteProspectBonus = record.hasTourCard
    ? Math.max(0, developmentPotential - 88) *
      (record.age <= 30 ? 190 : record.age <= 35 ? 95 : 0)
    : 0;

  return (
    (record.hasTourCard ? 85 : 0) +
    Math.max(0, 48 - worldRank * 0.35) +
    Math.max(0, 72 - oneYearRank * 0.85) +
    (worldRow?.points ?? 0) * 0.14 +
    (worldRow?.prizeMoney ?? 0) * 0.0012 +
    (oneYearRow?.points ?? 0) * 0.25 +
    (oneYearRow?.prizeMoney ?? 0) * 0.003 +
    latestSeasonWins * 62 +
    weightedTwoYearWins * 28 -
    weightedTwoYearLosses * 8 +
    latestMainTourEvents * 12 +
    weightedMainTourEvents * 6 +
    latestSeasonTitles * 220 +
    record.majorTitles * 20 +
    record.titles * 3 +
    rollingTwoYearPrize * 0.004 +
    rollingRankScore * 1.8 +
    rollingTitleScore * 120 +
    latestSeasonPrize * 0.002 +
    Math.round(latestSeasonWinRate * 260) +
    Math.round(twoYearWinRate * 320) +
    Math.round(winRate * 100) +
    strengthBand * 10 +
    veteranBonus +
    youthUpsideBonus +
    eliteProspectBonus -
    lowLatestWinsPenalty -
    lowTwoYearWinRatePenalty -
    lowVolumePenalty -
    noEliteResultsPenalty -
    weakStrengthPenalty -
    repeatedHighRankLowVolumePenalty -
    eliteCredibilityPenalty -
    bottomTourProtectionPenalty -
    ageDeclinePenalty
  );
}

function isEligibleForWorldTable(record: WorldPlayerRecord) {
  return !record.retired && (record.hasTourCard || record.retainedViaRanking);
}

function buildWorldCompetitionRows(
  players: WorldPlayerRecord[],
  tables: CompetitionTablesState,
  playerName: string,
) {
  const sortedPlayers = players.sort((left, right) => {
    const scoreDelta =
      getWorldSeedScore(right, tables) - getWorldSeedScore(left, tables);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    const leftOneYearRank =
      getCompetitionRowForPlayer(tables, "oneYear", left.playerName)?.ranking ??
      999;
    const rightOneYearRank =
      getCompetitionRowForPlayer(tables, "oneYear", right.playerName)
        ?.ranking ?? 999;
    if (leftOneYearRank !== rightOneYearRank) {
      return leftOneYearRank - rightOneYearRank;
    }

    const leftWorldRank =
      getCompetitionRowForPlayer(tables, "world", left.playerName)?.ranking ??
      null;
    const rightWorldRank =
      getCompetitionRowForPlayer(tables, "world", right.playerName)?.ranking ??
      null;

    if (
      leftWorldRank != null &&
      rightWorldRank != null &&
      leftWorldRank !== rightWorldRank
    ) {
      return leftWorldRank - rightWorldRank;
    }

    if (leftWorldRank != null && rightWorldRank == null) {
      return -1;
    }

    if (leftWorldRank == null && rightWorldRank != null) {
      return 1;
    }

    return left.playerName.localeCompare(right.playerName);
  });
  const limit = Math.min(MAIN_TOUR_POOL_SIZE, sortedPlayers.length);
  const eligiblePlayers = sortedPlayers
    .filter((record) => isEligibleForWorldTable(record))
    .slice(0, limit);

  const remainingPlayers = eligiblePlayers.slice(0, limit).map((record) => ({
    record,
    bestAllowedRank: getWorldRankingCeiling(record, tables),
  }));
  const finalPlayers: WorldPlayerRecord[] = [];

  for (let rank = 1; rank <= limit && remainingPlayers.length > 0; rank += 1) {
    let selectedIndex = remainingPlayers.findIndex(
      (entry) => entry.bestAllowedRank <= rank,
    );
    if (selectedIndex === -1) {
      selectedIndex = remainingPlayers.reduce(
        (bestIndex, entry, index, entries) => {
          if (entry.bestAllowedRank < entries[bestIndex].bestAllowedRank) {
            return index;
          }

          return bestIndex;
        },
        0,
      );
    }

    const [selected] = remainingPlayers.splice(selectedIndex, 1);
    finalPlayers.push(selected.record);
  }

  const rows = finalPlayers.map((record, index) => {
    const existingWorldRow = getCompetitionRowForPlayer(
      tables,
      "world",
      record.playerName,
    );
    const ranking = index + 1;
    const statusNote =
      existingWorldRow?.statusNote ??
      (ranking <= TOP_16_RANK_CUTOFF
        ? "Top 16"
        : ranking <= TOP_32_RANK_CUTOFF
          ? "Top 32"
          : ranking <= TOP_64_RANK_CUTOFF
            ? "Safe"
            : record.hasTourCard
              ? "At Risk"
              : "Development");

    return {
      ...createCompetitionDefaultRow(
        record.playerName,
        record.nation,
        index + 1,
      ),
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
    };
  });

  return rerankCompetitionRows(rows, playerName);
}

function buildOneYearCompetitionRows(
  worldRows: CompetitionTableRow[],
  tables: CompetitionTablesState,
  playerName: string,
) {
  return rerankCompetitionRows(
    worldRows.map((worldRow, index) => {
      const existingOneYearRow = getCompetitionRowForPlayer(
        tables,
        "oneYear",
        worldRow.playerName,
      );

      return {
        ...createCompetitionDefaultRow(
          worldRow.playerName,
          worldRow.nation,
          index + 1,
        ),
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
      };
    }),
    playerName,
  );
}

function getCircuitSeedScore(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
  key: Exclude<CompetitionTableKey, "world" | "oneYear">,
) {
  const getRankScore = (tableKey: CompetitionTableKey, fallback = 0) => {
    const row = getCompetitionRowForPlayer(tables, tableKey, record.playerName);
    if (!row) return fallback;
    return Math.max(0, 140 - row.ranking * 3) + row.titles * 18 + row.wins * 2;
  };
  const developmentPotential = getWorldPlayerDevelopmentPotential(record);
  const youngProspectScore =
    Math.max(0, developmentPotential - 78) *
    (record.age <= 21 ? 3.2 : record.age <= 27 ? 2.2 : 0.8);

  switch (key) {
    case "youth":
      return (
        getRankScore("youth") * 1.5 +
        getRankScore("amateur") * 0.35 +
        Math.max(0, 24 - record.age) * 4 +
        youngProspectScore
      );
    case "amateur":
      return (
        getRankScore("amateur") * 1.5 +
        getRankScore("youth") * 0.8 +
        getRankScore("qTour") * 0.5 +
        Math.max(0, 34 - record.age) * 2 +
        youngProspectScore
      );
    case "qTour":
      return (
        getRankScore("qTour") * 1.8 +
        getRankScore("amateur") * 1.1 +
        getRankScore("youth") * 0.8 +
        Math.max(0, 32 - record.age) * 2 +
        youngProspectScore
      );
    case "qSchool":
      return (
        getRankScore("qSchool") * 2 +
        getRankScore("qTour") * 1.4 +
        getRankScore("amateur") * 0.9 +
        Math.max(0, 36 - record.age) +
        youngProspectScore
      );
    case "senior":
      return (
        getRankScore("senior") * 1.8 +
        getRankScore("world") * 0.9 +
        (record.highestWorldRank != null && record.highestWorldRank <= 32
          ? 50 - record.highestWorldRank
          : 0) +
        Math.max(0, record.age - 39) * 3
      );
  }
}

function getLatestArchivedCircuitRank(
  record: WorldPlayerRecord,
  key: keyof WorldPlayerSeasonRecord,
) {
  const rank = record.seasons[0]?.[key];
  return typeof rank === "number" ? rank : null;
}

function getWorldPlayerCircuitRank(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
  key: CompetitionTableKey,
) {
  const currentRank = getCompetitionRowForPlayer(
    tables,
    key,
    record.playerName,
  )?.ranking;
  if (typeof currentRank === "number") return currentRank;

  switch (key) {
    case "world":
      return getLatestArchivedCircuitRank(record, "worldRank");
    case "oneYear":
      return getLatestArchivedCircuitRank(record, "oneYearRank");
    case "amateur":
      return getLatestArchivedCircuitRank(record, "amateurRank");
    case "qTour":
      return getLatestArchivedCircuitRank(record, "qTourRank");
    case "qSchool":
      return getLatestArchivedCircuitRank(record, "qSchoolRank");
    case "senior":
      return getLatestArchivedCircuitRank(record, "seniorRank");
    case "youth":
      return getLatestArchivedCircuitRank(record, "youthRank");
  }
}

function getWorldPlayerExpectedCircuit(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
) {
  if (record.retired) return "retired";

  const worldRank = getWorldPlayerCircuitRank(record, tables, "world") ?? 999;
  const qTourRank = getWorldPlayerCircuitRank(record, tables, "qTour") ?? 999;
  const qSchoolRank =
    getWorldPlayerCircuitRank(record, tables, "qSchool") ?? 999;
  const amateurRank =
    getWorldPlayerCircuitRank(record, tables, "amateur") ?? 999;
  const youthRank = getWorldPlayerCircuitRank(record, tables, "youth") ?? 999;
  const recentMainTourEvents = getRecentSeasonStat(
    record,
    (season) => season.mainTourEvents,
  );
  const strongAmateurSignal =
    amateurRank <= 12 || qTourRank <= 12 || youthRank <= 6;

  if (
    record.age >= 40 &&
    !record.hasTourCard &&
    worldRank > TOP_64_RANK_CUTOFF &&
    ((record.highestWorldRank ?? 999) <= 64 || recentMainTourEvents > 0)
  ) {
    return "senior";
  }

  if (record.age <= 21 && !record.hasTourCard && !strongAmateurSignal) {
    return "youth";
  }

  if (
    worldRank <= MAIN_TOUR_POOL_SIZE ||
    qSchoolRank <= 24 ||
    recentMainTourEvents >= 4
  ) {
    return "qSchool";
  }

  if (
    qTourRank <= 24 ||
    amateurRank <= 16 ||
    (record.age <= 28 && strongAmateurSignal)
  ) {
    return "qTour";
  }

  return "amateur";
}

function getWorldPlayerTourSurvivalStatus(
  worldRank: number,
  hasTourCard: boolean,
  retainedViaRanking: boolean,
  yearsRemaining: number,
): TourSurvivalStatus {
  if (worldRank <= TOP_16_RANK_CUTOFF) return "Top 16";
  if (worldRank <= TOP_32_RANK_CUTOFF) return "Top 32";
  if (worldRank <= TOP_64_RANK_CUTOFF) return "Safe";
  if (hasTourCard && yearsRemaining >= 2 && !retainedViaRanking)
    return "Rookie Year 1";
  if (hasTourCard && yearsRemaining === 1 && !retainedViaRanking)
    return "Rookie Year 2";
  if (hasTourCard && worldRank <= 96) return "Bubble";
  if (hasTourCard && worldRank <= MAIN_TOUR_POOL_SIZE) return "At Risk";
  return "Amateur";
}

function getWorldPlayerPromotionSource(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
): TourCardSource {
  if (record.retired || record.age < 18) return null;

  const qSchoolRank =
    getWorldPlayerCircuitRank(record, tables, "qSchool") ?? 999;
  const qTourRank = getWorldPlayerCircuitRank(record, tables, "qTour") ?? 999;
  const amateurRank =
    getWorldPlayerCircuitRank(record, tables, "amateur") ?? 999;
  const youthRank = getWorldPlayerCircuitRank(record, tables, "youth") ?? 999;
  const hasRecordedFeederSeason = record.seasons.length > 0;

  if (
    record.age <= 18 &&
    hasRecordedFeederSeason &&
    (youthRank <= 12 ||
      amateurRank <= 20 ||
      qTourRank <= 24 ||
      qSchoolRank <= 16)
  ) {
    return "Federation Route";
  }

  if (record.age < 18) {
    return null;
  }

  if (qSchoolRank <= 24)
    return qSchoolRank <= 12 ? "Q School" : "Playoff Route";
  if (qTourRank <= 24) return qTourRank <= 4 ? "Q Tour" : "Playoff Route";
  if (amateurRank <= 40 || (record.age <= 21 && youthRank <= 24))
    return "Federation Route";
  return null;
}

function shouldProtectFeederPlayerFromFallbackPromotion(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
) {
  if (record.age <= 18) {
    return true;
  }

  return getWorldPlayerExpectedCircuit(record, tables) === "youth";
}

function shouldAiWorldPlayerRetainMainTourCard(
  record: WorldPlayerRecord,
  worldRank: number,
  tables: CompetitionTablesState,
) {
  if (record.retired) return false;
  if (worldRank > TOP_64_RANK_CUTOFF) return false;

  const oneYearRow = getCompetitionRowForPlayer(
    tables,
    "oneYear",
    record.playerName,
  );
  const latestWins = getRecentSeasonStat(
    record,
    (season) => season.proWins,
    0,
    oneYearRow?.wins ?? 0,
  );
  const latestLosses = getRecentSeasonStat(
    record,
    (season) => season.proLosses,
    0,
    oneYearRow?.losses ?? 0,
  );
  const latestMatches = latestWins + latestLosses;
  const latestWinRate = latestMatches > 0 ? latestWins / latestMatches : 0;
  const latestTitles = getRecentSeasonStat(
    record,
    (season) => season.titles,
    0,
    oneYearRow?.titles ?? 0,
  );
  const rollingTitleScore = getWeightedRecentSeasonValue(
    record,
    (season) => season.titles,
  );
  const nextAge = record.age + 1;

  if (nextAge < 42) return true;
  if (latestTitles > 0) return true;

  if (nextAge >= 55) {
    return (
      rollingTitleScore >= 2 ||
      (latestWins >= 9 &&
        latestWinRate >= 0.58 &&
        worldRank <= TOP_16_RANK_CUTOFF)
    );
  }

  if (nextAge >= 50) {
    return (
      rollingTitleScore >= 1.6 ||
      (latestWins >= 8 &&
        latestWinRate >= 0.52 &&
        worldRank <= TOP_32_RANK_CUTOFF)
    );
  }

  if (nextAge >= 45) {
    return (
      rollingTitleScore >= 1 ||
      latestWins >= 6 ||
      (worldRank <= TOP_16_RANK_CUTOFF &&
        latestWins >= 5 &&
        latestWinRate >= 0.45)
    );
  }

  return (
    latestWins >= 4 ||
    rollingTitleScore >= 0.6 ||
    worldRank <= TOP_32_RANK_CUTOFF
  );
}

function getWorldPlayerPromotionScore(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
  source: Exclude<TourCardSource, null>,
) {
  const qSchoolRank =
    getWorldPlayerCircuitRank(record, tables, "qSchool") ?? 999;
  const qTourRank = getWorldPlayerCircuitRank(record, tables, "qTour") ?? 999;
  const amateurRank =
    getWorldPlayerCircuitRank(record, tables, "amateur") ?? 999;
  const youthRank = getWorldPlayerCircuitRank(record, tables, "youth") ?? 999;
  const recentWins = getRecentSeasonStat(record, (season) => season.proWins);
  const recentTitles = getRecentSeasonStat(record, (season) => season.titles);
  const strengthBand = getCompetitiveStrengthBand(record, tables);
  const peakRankBonus = Math.max(
    0,
    96 - Math.min(record.highestWorldRank ?? 128, 128),
  );
  const prospectBonus =
    Math.max(0, getWorldPlayerDevelopmentPotential(record) - 80) *
    (record.age <= 24 ? 26 : record.age <= 29 ? 18 : 8);
  const sourceBonus =
    source === "Q School"
      ? 320
      : source === "Q Tour"
        ? 280
        : source === "Playoff Route"
          ? 250
          : 220;

  return (
    sourceBonus +
    strengthBand * 10 +
    recentWins * 20 +
    recentTitles * 30 +
    peakRankBonus +
    prospectBonus +
    Math.max(0, 48 - qSchoolRank * 4) +
    Math.max(0, 40 - qTourRank * 3) +
    Math.max(0, 36 - amateurRank * 2) +
    Math.max(0, 20 - youthRank * 2)
  );
}

function awardWorldPlayerTourCard(
  record: WorldPlayerRecord,
  source: Exclude<TourCardSource, null>,
  nextSeasonStartYear: number,
): WorldPlayerRecord {
  return {
    ...record,
    hasTourCard: true,
    cardSource: source,
    currentYear: 1,
    yearsRemaining: 2,
    expiresAfterSeason: formatSeasonLabel(nextSeasonStartYear + 1),
    retainedViaRanking: false,
    tourSurvivalStatus: "At Risk",
  };
}

function isEligibleForCircuit(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
  key: Exclude<CompetitionTableKey, "world" | "oneYear">,
) {
  if (record.retired) return false;

  const youthRank = getWorldPlayerCircuitRank(record, tables, "youth") ?? 999;
  const amateurRank =
    getWorldPlayerCircuitRank(record, tables, "amateur") ?? 999;
  const qTourRank = getWorldPlayerCircuitRank(record, tables, "qTour") ?? 999;
  const qSchoolRank =
    getWorldPlayerCircuitRank(record, tables, "qSchool") ?? 999;
  const worldRank = getWorldPlayerCircuitRank(record, tables, "world") ?? 999;
  const expectedCircuit = getWorldPlayerExpectedCircuit(record, tables);

  switch (key) {
    case "youth":
      return (
        !record.hasTourCard &&
        record.age <= 21 &&
        (expectedCircuit === "youth" || youthRank <= 32)
      );
    case "amateur":
      return (
        !record.hasTourCard &&
        record.age >= 18 &&
        record.age < 40 &&
        expectedCircuit !== "senior"
      );
    case "qTour":
      return (
        !record.hasTourCard &&
        record.age >= 18 &&
        record.age < 40 &&
        (expectedCircuit === "qTour" ||
          qTourRank <= 48 ||
          amateurRank <= 32 ||
          youthRank <= 8)
      );
    case "qSchool":
      return (
        !record.hasTourCard &&
        record.age >= 18 &&
        record.age < 45 &&
        (expectedCircuit === "qSchool" ||
          qSchoolRank <= 24 ||
          qTourRank <= 24 ||
          amateurRank <= 16 ||
          worldRank <= 96)
      );
    case "senior":
      return (
        expectedCircuit === "senior" ||
        (record.age >= 40 &&
          !record.hasTourCard &&
          worldRank > TOP_64_RANK_CUTOFF)
      );
  }
}

function buildSeasonalCircuitRows(
  players: WorldPlayerRecord[],
  tables: CompetitionTablesState,
  key: Exclude<CompetitionTableKey, "world" | "oneYear">,
  playerName: string,
  seasonSeed = 0,
) {
  const limits: Record<
    Exclude<CompetitionTableKey, "world" | "oneYear">,
    number
  > = {
    youth: 32,
    amateur: 64,
    qTour: 48,
    qSchool: 32,
    senior: 24,
  };

  const eligiblePlayers = players
    .filter((record) => isEligibleForCircuit(record, tables, key))
    .sort(
      (left, right) =>
        getCircuitSeedScore(right, tables, key) -
        getCircuitSeedScore(left, tables, key),
    );
  const selectedPlayers = eligiblePlayers.slice(0, limits[key]);

  if (key === "youth") {
    const newcomerPool = eligiblePlayers.filter(
      (record) => record.seasons.length === 0 && record.age <= 16,
    );
    const selectedNewcomers = selectedPlayers.filter(
      (record) => record.seasons.length === 0 && record.age <= 16,
    );
    const requiredNewcomers = Math.min(3, newcomerPool.length);
    const missingNewcomers = newcomerPool
      .filter(
        (record) =>
          !selectedNewcomers.some(
            (entry) => entry.playerName === record.playerName,
          ),
      )
      .slice(0, Math.max(0, requiredNewcomers - selectedNewcomers.length));

    if (missingNewcomers.length > 0) {
      const protectedNames = new Set([
        playerName,
        ...selectedPlayers
          .slice(0, Math.min(4, selectedPlayers.length))
          .map((record) => record.playerName),
        ...selectedNewcomers.map((record) => record.playerName),
      ]);
      const replaceableIndexes = selectedPlayers
        .map((record, index) => ({
          index,
          record,
          seedScore: getCircuitSeedScore(record, tables, key),
        }))
        .filter((entry) => !protectedNames.has(entry.record.playerName))
        .sort(
          (left, right) =>
            left.seedScore - right.seedScore ||
            right.record.age - left.record.age,
        );

      missingNewcomers.forEach((record, newcomerIndex) => {
        const target = replaceableIndexes[newcomerIndex];
        if (!target) return;
        selectedPlayers[target.index] = record;
      });
    }
  }

  if (key === "qTour" || key === "qSchool") {
    const selectedNames = new Set(
      selectedPlayers.map((record) => record.playerName),
    );
    const wildcardPool = players.filter((record) => {
      if (
        selectedNames.has(record.playerName) ||
        record.playerName === playerName ||
        record.hasTourCard
      )
        return false;
      if (key === "qTour")
        return (
          record.age >= 18 &&
          record.age < 40 &&
          getWorldPlayerExpectedCircuit(record, tables) !== "senior"
        );
      return (
        record.age >= 18 &&
        record.age < 40 &&
        !["youth", "senior"].includes(
          getWorldPlayerExpectedCircuit(record, tables),
        )
      );
    });
    const refreshCandidates = [...eligiblePlayers, ...wildcardPool]
      .filter(
        (record) =>
          !selectedNames.has(record.playerName) &&
          record.playerName !== playerName,
      )
      .sort((left, right) => {
        const leftFreshness =
          left.seasons.length === 0 ? 2 : left.seasons.length <= 2 ? 1 : 0;
        const rightFreshness =
          right.seasons.length === 0 ? 2 : right.seasons.length <= 2 ? 1 : 0;
        const leftRotation =
          hashStringToNumber(`${seasonSeed}-${key}-${left.playerName}`) % 97;
        const rightRotation =
          hashStringToNumber(`${seasonSeed}-${key}-${right.playerName}`) % 97;
        return (
          rightFreshness - leftFreshness ||
          rightRotation - leftRotation ||
          getCircuitSeedScore(right, tables, key) -
            getCircuitSeedScore(left, tables, key) ||
          left.age - right.age
        );
      });
    const requiredRefresh = Math.min(
      key === "qTour" ? 3 : 2,
      refreshCandidates.length,
    );

    if (requiredRefresh > 0) {
      const protectedNames = new Set([
        playerName,
        ...selectedPlayers
          .slice(0, Math.min(key === "qTour" ? 8 : 6, selectedPlayers.length))
          .map((record) => record.playerName),
      ]);
      const replaceableIndexes = selectedPlayers
        .map((record, index) => ({
          index,
          record,
          seedScore: getCircuitSeedScore(record, tables, key),
        }))
        .filter((entry) => !protectedNames.has(entry.record.playerName))
        .sort(
          (left, right) =>
            left.seedScore - right.seedScore ||
            right.record.age - left.record.age,
        );

      refreshCandidates
        .slice(0, requiredRefresh)
        .forEach((record, refreshIndex) => {
          const target = replaceableIndexes[refreshIndex];
          if (!target) return;
          selectedPlayers[target.index] = record;
        });
    }
  }

  const rows = selectedPlayers.map((record, index, rankedPlayers) => ({
    ...createCompetitionDefaultRow(record.playerName, record.nation, index + 1),
    points: Math.max(1, rankedPlayers.length - index),
    statusNote: `Seeded from ${key} pathway pool`,
  }));

  return rerankCompetitionRows(rows, playerName);
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
  const firstOffset = getFirstIndex(baseSeed) % firstNames.length;
  const lastOffset = getLastIndex(baseSeed) % lastNames.length;
  const combinations = firstNames.length * lastNames.length;

  for (let attempt = 0; attempt < combinations; attempt += 1) {
    const firstIndex = (firstOffset + attempt) % firstNames.length;
    const lastIndex =
      (lastOffset + Math.floor(attempt / firstNames.length)) % lastNames.length;
    const seed = baseSeed + attempt * 23;
    const fullName = `${firstNames[firstIndex]} ${lastNames[lastIndex]}`;

    if (!seenNames.has(fullName) && fullName !== playerName) {
      return { fullName, seed };
    }
  }

  return null;
}

function createCpuDevelopmentPotential(
  fullName: string,
  seasonStartYear: number,
  intakeIndex: number,
  age: number,
  source: "junior" | "feeder",
) {
  const roll =
    hashStringToNumber(
      `${source}-${seasonStartYear}-${intakeIndex}-${fullName}`,
    ) % 100;
  const ageBonus = source === "junior" && age <= 16 ? 2 : 0;

  if (roll >= 94) return 96 + (roll % 3);
  if (roll >= 78) return 90 + (roll % 6) + ageBonus;
  if (roll >= 48) return 84 + (roll % 6) + ageBonus;
  if (roll >= 18) return 78 + (roll % 7);
  return 70 + (roll % 8);
}

function createJuniorIntake(
  players: WorldPlayerRecord[],
  seasonStartYear: number,
  playerName: string,
) {
  const seenNames = new Set(players.map((record) => record.playerName));
  const additions: WorldPlayerRecord[] = [];

  for (let index = 0; index < 8; index += 1) {
    const intakeName = createUniqueIntakeName(
      seenNames,
      playerName,
      JUNIOR_FIRST_NAMES,
      JUNIOR_LAST_NAMES,
      seasonStartYear * 17 + index * 11,
      (seed) => seed,
      (seed) => seed * 3,
    );

    if (!intakeName) {
      continue;
    }

    const { fullName, seed: finalSeed } = intakeName;
    seenNames.add(fullName);
    const age = 14 + (finalSeed % 3);
    additions.push({
      id: `wp-${fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      playerName: fullName,
      nation: JUNIOR_NATIONS[(finalSeed * 5) % JUNIOR_NATIONS.length],
      age,
      hasTourCard: false,
      cardSource: null,
      currentYear: 0,
      yearsRemaining: 0,
      expiresAfterSeason: null,
      retainedViaRanking: false,
      tourSurvivalStatus: "Amateur",
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
      developmentPotential: createCpuDevelopmentPotential(
        fullName,
        seasonStartYear,
        index,
        age,
        "junior",
      ),
      retired: false,
      retiredSeason: null,
      seasons: [],
    });
  }

  return [...players, ...additions];
}

function createFeederIntake(
  players: WorldPlayerRecord[],
  seasonStartYear: number,
  playerName: string,
) {
  const seenNames = new Set(players.map((record) => record.playerName));
  const additions: WorldPlayerRecord[] = [];
  const activeAmateurPool = players.filter(
    (record) => !record.hasTourCard && record.age >= 18 && record.age < 40,
  ).length;
  const seniorPool = players.filter(
    (record) =>
      record.age >= 40 &&
      (!record.hasTourCard || record.highestWorldRank != null),
  ).length;
  const developmentTarget = Math.max(0, 8 - activeAmateurPool);
  const seniorTarget = Math.max(0, 4 - seniorPool);

  for (let index = 0; index < developmentTarget; index += 1) {
    const intakeName = createUniqueIntakeName(
      seenNames,
      playerName,
      FEEDER_FIRST_NAMES,
      FEEDER_LAST_NAMES,
      seasonStartYear * 13 + index * 11,
      (seed) => seed,
      (seed) => seed * 5,
    );

    if (!intakeName) {
      continue;
    }

    const { fullName, seed } = intakeName;
    seenNames.add(fullName);
    const age = 18 + (seed % 10);
    additions.push({
      id: `wp-${fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      playerName: fullName,
      nation: FEEDER_NATIONS[(seed * 7) % FEEDER_NATIONS.length],
      age,
      hasTourCard: false,
      cardSource: null,
      currentYear: 0,
      yearsRemaining: 0,
      expiresAfterSeason: null,
      retainedViaRanking: false,
      tourSurvivalStatus: "Amateur",
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
      developmentPotential: createCpuDevelopmentPotential(
        fullName,
        seasonStartYear,
        index,
        age,
        "feeder",
      ),
      retired: false,
      retiredSeason: null,
      seasons: [],
    });
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
    );

    if (!intakeName) {
      continue;
    }

    const { fullName, seed } = intakeName;
    seenNames.add(fullName);
    additions.push({
      id: `wp-${fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      playerName: fullName,
      nation: FEEDER_NATIONS[(seed * 11) % FEEDER_NATIONS.length],
      age: 40 + (seed % 7),
      hasTourCard: false,
      cardSource: null,
      currentYear: 0,
      yearsRemaining: 0,
      expiresAfterSeason: null,
      retainedViaRanking: false,
      tourSurvivalStatus: "Amateur",
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
      retired: false,
      retiredSeason: null,
      seasons: [],
    });
  }

  return [...players, ...additions];
}

function shouldRetireCpuPlayer(
  record: WorldPlayerRecord,
  tables: CompetitionTablesState,
  nextAge: number,
) {
  const worldRank = getWorldPlayerCircuitRank(record, tables, "world") ?? 999;
  const recentWins = getRecentSeasonStat(record, (season) => season.proWins);
  const recentLosses = getRecentSeasonStat(
    record,
    (season) => season.proLosses,
  );
  const recentTitles = getRecentSeasonStat(record, (season) => season.titles);
  return evaluateCpuRetirement({
    alreadyRetired: record.retired,
    nextAge,
    hasTourCard: record.hasTourCard,
    worldRank,
    recentWins,
    recentLosses,
    recentTitles,
  });
}

export function evolveWorldPlayersForNextSeason(
  players: WorldPlayerRecord[],
  tables: CompetitionTablesState,
  nextPlayer: Player,
  playerHasTourCard: boolean,
  playerProState: ProCareerSystemState,
  nextSeasonStartYear: number,
  earnedCards?: Map<string, 'Q School' | 'Q Tour' | 'Federation Route'>,
  worldSeed = 0,
) {
  const agedPlayers = players.map((record) => {
    const isHumanPlayer = record.playerName === nextPlayer.fullName;
    const nextAge = isHumanPlayer ? nextPlayer.age : record.age + 1;
    const retired =
      !isHumanPlayer && !earnedCards?.has(record.playerName) && shouldRetireCpuPlayer(record, tables, nextAge);
    const worldRank =
      getCompetitionRowForPlayer(tables, "world", record.playerName)?.ranking ??
      999;
    const retainedViaRanking =
      !retired &&
      worldRank <= TOP_64_RANK_CUTOFF &&
      (isHumanPlayer ||
        shouldAiWorldPlayerRetainMainTourCard(record, worldRank, tables));
    const protectedCardSeason =
      !retired &&
      !isHumanPlayer &&
      record.hasTourCard &&
      worldRank > TOP_64_RANK_CUTOFF &&
      worldRank <= MAIN_TOUR_POOL_SIZE &&
      record.yearsRemaining > 1;
    const nextYearsRemaining = isHumanPlayer
      ? playerProState.yearsRemaining
      : protectedCardSeason
        ? Math.max(0, record.yearsRemaining - 1)
        : 0;
    const hasTourCard = retired
      ? false
      : isHumanPlayer
        ? playerHasTourCard
        : retainedViaRanking || protectedCardSeason;

    return {
      ...record,
      age: nextAge,
      hasTourCard,
      cardSource: retired
        ? null
        : isHumanPlayer
          ? playerProState.cardSource
          : retainedViaRanking
            ? "Ranking Retained"
            : hasTourCard
              ? (record.cardSource ?? "Seeded Main Tour")
              : null,
      currentYear: retired
        ? 0
        : isHumanPlayer
          ? playerProState.currentYear
          : hasTourCard && nextYearsRemaining > 0
            ? Math.min(2, Math.max(1, record.currentYear + 1))
            : 0,
      yearsRemaining: nextYearsRemaining,
      expiresAfterSeason: retired
        ? null
        : isHumanPlayer
          ? playerProState.expiresAfterSeason
          : hasTourCard && nextYearsRemaining > 0
            ? formatSeasonLabel(nextSeasonStartYear + nextYearsRemaining - 1)
            : null,
      retainedViaRanking: retired
        ? false
        : isHumanPlayer
          ? playerProState.retainedViaRanking
          : retainedViaRanking,
      tourSurvivalStatus: retired
        ? "Amateur"
        : isHumanPlayer
          ? playerProState.tourSurvivalStatus
          : getWorldPlayerTourSurvivalStatus(
              worldRank,
              hasTourCard,
              retainedViaRanking,
              nextYearsRemaining,
            ),
      retired,
      retiredSeason: retired
        ? (record.retiredSeason ?? formatSeasonLabel(nextSeasonStartYear))
        : null,
    };
  });

  const normalizedPlayers = agedPlayers.map((record) => {
    if (record.playerName === nextPlayer.fullName) {
      return record;
    }
    if (record.retired) {
      return {
        ...record,
        hasTourCard: false,
        cardSource: null,
        currentYear: 0,
        yearsRemaining: 0,
        expiresAfterSeason: null,
        retainedViaRanking: false,
        tourSurvivalStatus: "Amateur" as const,
      };
    }

    const worldRank =
      getCompetitionRowForPlayer(tables, "world", record.playerName)?.ranking ??
      999;
    const retainedViaRanking =
      worldRank <= TOP_64_RANK_CUTOFF &&
      shouldAiWorldPlayerRetainMainTourCard(record, worldRank, tables);
    const protectedBottomTourPlayer =
      worldRank > TOP_64_RANK_CUTOFF &&
      worldRank <= MAIN_TOUR_POOL_SIZE &&
      record.yearsRemaining > 0;
    const nextYearsRemaining = retainedViaRanking
      ? 0
      : protectedBottomTourPlayer
        ? record.yearsRemaining
        : 0;
    const hasTourCard = retainedViaRanking || protectedBottomTourPlayer;

    return {
      ...record,
      hasTourCard,
      cardSource: retainedViaRanking
        ? "Ranking Retained"
        : protectedBottomTourPlayer
          ? (record.cardSource ?? "Seeded Main Tour")
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
      tourSurvivalStatus: getWorldPlayerTourSurvivalStatus(
        worldRank,
        hasTourCard,
        retainedViaRanking,
        nextYearsRemaining,
      ),
    };
  });

  const expandedPlayerPool = createFeederIntake(
    createJuniorIntake(
      normalizedPlayers,
      nextSeasonStartYear,
      nextPlayer.fullName,
    ),
    nextSeasonStartYear,
    nextPlayer.fullName,
  );
  const provisionalYouthRows = buildSeasonalCircuitRows(
    expandedPlayerPool,
    tables,
    "youth",
    nextPlayer.fullName,
    nextSeasonStartYear,
  );
  const provisionalAmateurRows = buildSeasonalCircuitRows(
    expandedPlayerPool,
    { ...tables, youth: provisionalYouthRows },
    "amateur",
    nextPlayer.fullName,
    nextSeasonStartYear,
  );
  const provisionalQTourRows = buildSeasonalCircuitRows(
    expandedPlayerPool,
    { ...tables, youth: provisionalYouthRows, amateur: provisionalAmateurRows },
    "qTour",
    nextPlayer.fullName,
    nextSeasonStartYear,
  );
  const provisionalQSchoolRows = buildSeasonalCircuitRows(
    expandedPlayerPool,
    {
      ...tables,
      youth: provisionalYouthRows,
      amateur: provisionalAmateurRows,
      qTour: provisionalQTourRows,
    },
    "qSchool",
    nextPlayer.fullName,
    nextSeasonStartYear,
  );
  const provisionalSeniorRows = buildSeasonalCircuitRows(
    expandedPlayerPool,
    {
      ...tables,
      youth: provisionalYouthRows,
      amateur: provisionalAmateurRows,
      qTour: provisionalQTourRows,
      qSchool: provisionalQSchoolRows,
    },
    "senior",
    nextPlayer.fullName,
    nextSeasonStartYear,
  );
  const promotionTables = {
    ...tables,
    youth: provisionalYouthRows,
    amateur: provisionalAmateurRows,
    qTour: provisionalQTourRows,
    qSchool: provisionalQSchoolRows,
    senior: provisionalSeniorRows,
  };
  const activeMainTourPlayers = expandedPlayerPool.filter(
    (record) => !record.retired && record.hasTourCard,
  );
  const openSlots = Math.max(
    0,
    MAIN_TOUR_POOL_SIZE - activeMainTourPlayers.length,
  );
  const promotedPlayers = expandedPlayerPool
    .filter(
      (record) =>
        record.playerName !== nextPlayer.fullName &&
        !record.retired &&
        !record.hasTourCard,
    )
    .map((record) => ({
      record,
      source: earnedCards ? earnedCards.get(record.playerName) ?? null : getWorldPlayerPromotionSource(record, promotionTables),
    }))
    .filter(
      (
        entry,
      ): entry is {
        record: WorldPlayerRecord;
        source: Exclude<TourCardSource, null>;
      } => entry.source != null,
    )
    .sort(
      (left, right) =>
        getWorldPlayerPromotionScore(
          right.record,
          promotionTables,
          right.source,
        ) -
        getWorldPlayerPromotionScore(left.record, promotionTables, left.source),
    )
    .slice(0, earnedCards ? undefined : openSlots)
    .map((entry) =>
      awardWorldPlayerTourCard(entry.record, entry.source, nextSeasonStartYear),
    );
  const remainingOpenSlots = Math.max(0, openSlots - promotedPlayers.length);
  const promotedNames = new Set(
    promotedPlayers.map((record) => record.playerName),
  );
  const fallbackPromotions = expandedPlayerPool
    .filter(
      (record) =>
        record.playerName !== nextPlayer.fullName &&
        !record.retired &&
        !record.hasTourCard &&
        !promotedNames.has(record.playerName),
    )
    .filter(
      (record) =>
        getWorldPlayerExpectedCircuit(record, promotionTables) !== "senior",
    )
    .filter(
      (record) =>
        !shouldProtectFeederPlayerFromFallbackPromotion(
          record,
          promotionTables,
        ),
    )
    .sort(
      (left, right) =>
        getWorldPlayerPromotionScore(
          right,
          promotionTables,
          "Federation Route",
        ) -
        getWorldPlayerPromotionScore(left, promotionTables, "Federation Route"),
    )
    .slice(0, remainingOpenSlots)
    .map((record) =>
      ({ ...awardWorldPlayerTourCard(record, "Top Up", nextSeasonStartYear), yearsRemaining:1, expiresAfterSeason:formatSeasonLabel(nextSeasonStartYear) }),
    );
  for (const record of fallbackPromotions) {
    promotedNames.add(record.playerName);
  }
  const nextSeasonPlayers = expandedPlayerPool.map((record) =>
    promotedNames.has(record.playerName)
      ? (promotedPlayers.find(
          (entry) => entry.playerName === record.playerName,
        ) ??
        fallbackPromotions.find(
          (entry) => entry.playerName === record.playerName,
        ) ??
        record)
      : record,
  );

  return nextSeasonPlayers.map(record => ({...record,declineProfile:record.playerName===nextPlayer.fullName ? playerDecline({id:"human",declineProfile:nextPlayer.declineProfile},worldSeed) : playerDecline(record,worldSeed)}));
}

function rebuildLivingCompetitionTables(
  rolledTables: CompetitionTablesState,
  players: WorldPlayerRecord[],
  playerName: string,
  seasonSeed = 0,
) {
  const withWorld = {
    ...rolledTables,
    world: buildWorldCompetitionRows(players, rolledTables, playerName),
  };
  const withOneYear = {
    ...withWorld,
    oneYear: buildOneYearCompetitionRows(
      withWorld.world,
      withWorld,
      playerName,
    ),
  };
  const withYouth = {
    ...withOneYear,
    youth: buildSeasonalCircuitRows(
      players,
      withOneYear,
      "youth",
      playerName,
      seasonSeed,
    ),
  };
  const withAmateur = {
    ...withYouth,
    amateur: buildSeasonalCircuitRows(
      players,
      withYouth,
      "amateur",
      playerName,
      seasonSeed,
    ),
  };
  const withQTour = {
    ...withAmateur,
    qTour: buildSeasonalCircuitRows(
      players,
      withAmateur,
      "qTour",
      playerName,
      seasonSeed,
    ),
  };
  const withQSchool = {
    ...withQTour,
    qSchool: buildSeasonalCircuitRows(
      players,
      withQTour,
      "qSchool",
      playerName,
      seasonSeed,
    ),
  };

  return {
    ...withQSchool,
    senior: buildSeasonalCircuitRows(
      players,
      withQSchool,
      "senior",
      playerName,
      seasonSeed,
    ),
  };
}

type AiSeasonCircuitStats = {
  events: number;
  wins: number;
  losses: number;
  titles: number;
  prizeMoney: number;
  rankingPoints: number;
};

function getAiSeasonVariance(
  playerName: string,
  season: string,
  key: CompetitionTableKey,
) {
  return (hashStringToNumber(`${season}-${key}-${playerName}`) % 1000) / 999;
}

function simulateAiSeasonCircuitStats(
  playerName: string,
  season: string,
  key: CompetitionTableKey,
  row: CompetitionTableRow | undefined,
  record: WorldPlayerRecord,
): AiSeasonCircuitStats {
  const effectiveRow =
    row ??
    (key === "oneYear" && record.hasTourCard && !record.retired
      ? createCompetitionDefaultRow(
          playerName,
          record.nation,
          record.highestWorldRank ?? MAIN_TOUR_POOL_SIZE,
        )
      : undefined);

  if (!effectiveRow) {
    return {
      events: 0,
      wins: 0,
      losses: 0,
      titles: 0,
      prizeMoney: 0,
      rankingPoints: 0,
    };
  }

  const playedMatches = Math.max(0, effectiveRow.eventsPlayed);
  if (
    playedMatches > 0 ||
    effectiveRow.wins > 0 ||
    effectiveRow.losses > 0 ||
    effectiveRow.titles > 0
  ) {
    return {
      events: playedMatches,
      wins: Math.max(0, effectiveRow.wins),
      losses: Math.max(0, effectiveRow.losses),
      titles: Math.max(0, effectiveRow.titles),
      prizeMoney: Math.max(0, effectiveRow.prizeMoney),
      rankingPoints: Math.max(0, effectiveRow.points),
    };
  }

  const variance = getAiSeasonVariance(playerName, season, key);
  const rank = effectiveRow.ranking;
  const age = record.age;
  const rankStrength = Math.max(
    0,
    1 -
      (rank - 1) /
        (key === "world" || key === "oneYear" ? MAIN_TOUR_POOL_SIZE : 64),
  );
  const youthGrowth = age <= 24 ? 0.08 : 0;
  const veteranDrag =
    Math.max(0, age - 38) * (key === "senior" ? -0.004 : 0.012);
  const supportModifier =
    ((record.coachQuality ?? 55) - 55) / 350 +
    ((record.equipmentQuality ?? 55) - 55) / 420;
  const load = record.trainingLoad ?? 60;
  const trainingModifier =
    load >= 48 && load <= 76 ? 0.025 : load > 90 ? -0.055 : -0.01;
  const conditionPenalty =
    (record.fatigue ?? 30) / 900 + (record.injuryWeeks ?? 0) * 0.035;
  const baseWinRate = clamp(
    0.34 +
      rankStrength * 0.38 +
      youthGrowth -
      veteranDrag +
      supportModifier +
      trainingModifier -
      conditionPenalty +
      (variance - 0.5) * 0.1,
    0.16,
    0.84,
  );
  const eventBaseline: Record<CompetitionTableKey, number> = {
    world: rank <= TOP_16_RANK_CUTOFF ? 12 : rank <= TOP_64_RANK_CUTOFF ? 9 : 6,
    oneYear:
      rank <= TOP_16_RANK_CUTOFF ? 12 : rank <= TOP_64_RANK_CUTOFF ? 9 : 6,
    amateur: 9,
    qTour: 7,
    qSchool: 4,
    senior: 6,
    youth: 8,
  };
  const eventVariance = Math.round((variance - 0.5) * 2);
  const events = clamp(
    eventBaseline[key] + eventVariance,
    key === "qSchool" ? 3 : 5,
    key === "world" || key === "oneYear" ? 14 : 10,
  );
  const losses = clamp(Math.round(events * (1 - baseWinRate)), 0, events);
  const wins = Math.max(0, events - losses);
  const titleChance =
    rankStrength *
      (key === "world" || key === "oneYear"
        ? 0.28
        : key === "qSchool"
          ? 0.16
          : 0.22) +
    Math.max(0, wins - Math.ceil(events * 0.68)) * 0.08;
  const titles =
    wins >= Math.ceil(events * 0.72) && variance < titleChance ? 1 : 0;
  const pointsPerWin: Record<CompetitionTableKey, number> = {
    world: 115,
    oneYear: 115,
    amateur: 42,
    qTour: 34,
    qSchool: 16,
    senior: 28,
    youth: 18,
  };
  const prizePerWin: Record<CompetitionTableKey, number> = {
    world: 18500,
    oneYear: 18500,
    amateur: 900,
    qTour: 700,
    qSchool: 0,
    senior: 1200,
    youth: 120,
  };
  const rankingPoints = Math.max(
    effectiveRow.points,
    Math.round(
      wins * pointsPerWin[key] +
        titles * pointsPerWin[key] * 3 +
        rankStrength * pointsPerWin[key] * 2,
    ),
  );
  const prizeMoney = Math.max(
    effectiveRow.prizeMoney,
    Math.round(
      wins * prizePerWin[key] +
        titles * prizePerWin[key] * 4 +
        rankStrength * prizePerWin[key] * 2,
    ),
  );

  return { events, wins, losses, titles, prizeMoney, rankingPoints };
}

function archiveWorldPlayersForSeason(
  players: WorldPlayerRecord[],
  tables: CompetitionTablesState,
  season: string,
  playerName: string,
  playerStatus: string,
  player?: Player,
  playerSeasonRecord?: CareerSeasonRecord,
  evidenceState?: GameState,
) {
  const evidence = evidenceState ? cpuSeasonEvidence(evidenceState, getTournamentPlacementAwards) : undefined;
  const currentNames = new Set([
    ...players.map((entry) => entry.playerName),
    ...getAllCompetitionPlayerNames(tables),
  ]);

  return Array.from(currentNames).map((entryName) => {
    const existing = normalizeWorldPlayerRecord(
      players.find(
        (currentPlayer) => currentPlayer.playerName === entryName,
      ) ?? {
        id: `wp-${entryName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        playerName: entryName,
        nation:
          getCompetitionRowForPlayer(tables, "world", entryName)?.nation ??
          getCompetitionRowForPlayer(tables, "amateur", entryName)?.nation ??
          "INT",
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
        tourSurvivalStatus: "Amateur",
        retired: false,
        retiredSeason: null,
        seasons: [],
      },
      tables,
      player,
    );
    const worldRow = getCompetitionRowForPlayer(tables, "world", entryName);
    const oneYearRow = getCompetitionRowForPlayer(tables, "oneYear", entryName);
    const amateurRow = getCompetitionRowForPlayer(tables, "amateur", entryName);
    const qTourRow = getCompetitionRowForPlayer(tables, "qTour", entryName);
    const qSchoolRow = getCompetitionRowForPlayer(tables, "qSchool", entryName);
    const seniorRow = getCompetitionRowForPlayer(tables, "senior", entryName);
    const youthRow = getCompetitionRowForPlayer(tables, "youth", entryName);
    const isHumanPlayer = entryName === playerName;
    const oneYearStats = isHumanPlayer
      ? null
      : simulateAiSeasonCircuitStats(
          entryName,
          season,
          "oneYear",
          oneYearRow ?? worldRow,
          existing,
        );
    const qTourStats = isHumanPlayer
      ? null
      : simulateAiSeasonCircuitStats(
          entryName,
          season,
          "qTour",
          qTourRow,
          existing,
        );
    const qSchoolStats = isHumanPlayer
      ? null
      : simulateAiSeasonCircuitStats(
          entryName,
          season,
          "qSchool",
          qSchoolRow,
          existing,
        );
    const seniorStats = isHumanPlayer
      ? null
      : simulateAiSeasonCircuitStats(
          entryName,
          season,
          "senior",
          seniorRow,
          existing,
        );
    const amateurStats = isHumanPlayer
      ? null
      : simulateAiSeasonCircuitStats(
          entryName,
          season,
          "amateur",
          amateurRow,
          existing,
        );
    const youthStats = isHumanPlayer
      ? null
      : simulateAiSeasonCircuitStats(
          entryName,
          season,
          "youth",
          youthRow,
          existing,
        );
    const oneYearEvents =
      oneYearStats?.events ??
      oneYearRow?.eventsPlayed ??
      worldRow?.eventsPlayed ??
      0;
    const oneYearWins =
      oneYearStats?.wins ?? oneYearRow?.wins ?? worldRow?.wins ?? 0;
    const oneYearLosses =
      oneYearStats?.losses ?? oneYearRow?.losses ?? worldRow?.losses ?? 0;
    const oneYearPrize =
      oneYearStats?.prizeMoney ??
      oneYearRow?.prizeMoney ??
      worldRow?.prizeMoney ??
      0;
    const oneYearPoints =
      oneYearStats?.rankingPoints ?? oneYearRow?.points ?? 0;
    const oneYearTitles = oneYearStats?.titles ?? oneYearRow?.titles ?? 0;
    const qTourEvents = qTourStats?.events ?? qTourRow?.eventsPlayed ?? 0;
    const qTourWins = qTourStats?.wins ?? qTourRow?.wins ?? 0;
    const qTourLosses = qTourStats?.losses ?? qTourRow?.losses ?? 0;
    const qTourPoints = qTourStats?.rankingPoints ?? qTourRow?.points ?? 0;
    const qTourTitles = qTourStats?.titles ?? qTourRow?.titles ?? 0;
    const qSchoolEvents = qSchoolStats?.events ?? qSchoolRow?.eventsPlayed ?? 0;
    const qSchoolWins = qSchoolStats?.wins ?? qSchoolRow?.wins ?? 0;
    const qSchoolLosses = qSchoolStats?.losses ?? qSchoolRow?.losses ?? 0;
    const qSchoolPoints =
      qSchoolStats?.rankingPoints ?? qSchoolRow?.points ?? 0;
    const seniorEvents = seniorStats?.events ?? seniorRow?.eventsPlayed ?? 0;
    const seniorWins = seniorStats?.wins ?? seniorRow?.wins ?? 0;
    const seniorLosses = seniorStats?.losses ?? seniorRow?.losses ?? 0;
    const seniorPoints = seniorStats?.rankingPoints ?? seniorRow?.points ?? 0;
    const seniorTitles = seniorStats?.titles ?? seniorRow?.titles ?? 0;
    const amateurEvents = amateurStats?.events ?? amateurRow?.eventsPlayed ?? 0;
    const amateurWins = amateurStats?.wins ?? amateurRow?.wins ?? 0;
    const amateurLosses = amateurStats?.losses ?? amateurRow?.losses ?? 0;
    const amateurPoints =
      amateurStats?.rankingPoints ?? amateurRow?.points ?? 0;
    const amateurTitles = amateurStats?.titles ?? amateurRow?.titles ?? 0;
    const youthEvents = youthStats?.events ?? youthRow?.eventsPlayed ?? 0;
    const youthWins = youthStats?.wins ?? youthRow?.wins ?? 0;
    const youthLosses = youthStats?.losses ?? youthRow?.losses ?? 0;
    const youthPoints = youthStats?.rankingPoints ?? youthRow?.points ?? 0;
    const youthTitles = youthStats?.titles ?? youthRow?.titles ?? 0;
    const seasonRecord: WorldPlayerSeasonRecord = {
      season,
      worldRank: worldRow?.ranking ?? null,
      oneYearRank: oneYearRow?.ranking ?? null,
      amateurRank: amateurRow?.ranking ?? null,
      qTourRank: qTourRow?.ranking ?? null,
      qSchoolRank: qSchoolRow?.ranking ?? null,
      seniorRank: seniorRow?.ranking ?? null,
      youthRank: youthRow?.ranking ?? null,
      matches:
        oneYearEvents +
        qTourEvents +
        qSchoolEvents +
        seniorEvents +
        amateurEvents +
        youthEvents,
      wins:
        oneYearWins +
        qTourWins +
        qSchoolWins +
        seniorWins +
        amateurWins +
        youthWins,
      losses:
        oneYearLosses +
        qTourLosses +
        qSchoolLosses +
        seniorLosses +
        amateurLosses +
        youthLosses,
      prizeMoney: oneYearPrize,
      rankingPoints:
        oneYearPoints +
        qTourPoints +
        qSchoolPoints +
        seniorPoints +
        amateurPoints +
        youthPoints,
      titles:
        oneYearTitles +
        qTourTitles +
        seniorTitles +
        amateurTitles +
        youthTitles,
      proWins: oneYearWins,
      proLosses: oneYearLosses,
      mainTourEvents: oneYearEvents,
      hasTourCard: existing.hasTourCard,
      yearsRemaining: existing.yearsRemaining,
      retainedViaRanking: existing.retainedViaRanking,
      cardSource: existing.cardSource,
      tourSurvivalStatus: existing.tourSurvivalStatus,
      status:
        entryName === playerName
          ? playerStatus
          : existing.retired
            ? "Retired"
            : seniorRow != null
              ? "Senior"
              : youthRow != null && existing.age <= 21
                ? "Youth"
                : (worldRow?.ranking ?? 999) <= 16
                  ? "Elite"
                  : (worldRow?.ranking ?? 999) <= 32
                    ? "Top 32"
                    : (worldRow?.ranking ?? 999) <= 64
                      ? "Top 64"
                      : qSchoolRow != null
                        ? "Q School"
                        : qTourRow != null
                          ? "Q Tour"
                          : "Development",
    };
    const actual = evidence?.get(entryName);
    if (!isHumanPlayer && evidence) {
      Object.assign(seasonRecord, { matches:actual?.matches ?? 0, wins:actual?.wins ?? 0, losses:actual?.losses ?? 0, draws:actual?.draws ?? 0, titles:actual?.titles ?? 0, prizeMoney:actual?.prize ?? 0, proWins:actual?.proWins ?? 0, proLosses:actual?.proLosses ?? 0, mainTourEvents:actual?.proEvents ?? 0 });
    }
    const seasonRows = [
      seasonRecord,
      ...existing.seasons.filter((entry) => entry.season !== season),
    ];
    const seasonMatches = seasonRecord.matches;
    const seasonWins = seasonRecord.wins;
    const seasonLosses = seasonRecord.losses;
    const supportVariance = getAiSeasonVariance(entryName, season, "world");
    const nextTrainingLoad = isHumanPlayer
      ? (existing.trainingLoad ?? 60)
      : clamp(
          Math.round(48 + supportVariance * 38 + (seasonWins < 2 ? -6 : 0)),
          32,
          96,
        );
    const nextInjuryWeeks = isHumanPlayer
      ? existing.injuryWeeks
      : supportVariance > 0.965 && (existing.fatigue ?? 30) >= 58
        ? 2
        : Math.max(0, (existing.injuryWeeks ?? 0) - 1);
    const nextFatigue = isHumanPlayer
      ? existing.fatigue
      : clamp(
          Math.round(
            24 +
              nextTrainingLoad * 0.38 +
              seasonRecord.matches * 0.8 -
              seasonWins * 0.45,
          ),
          12,
          88,
        );
    const performanceGrowth = seasonWins >= 5 ? 2 : seasonWins <= 1 ? -1 : 0;
    const currentOverall =
      existing.overallRating ?? inferWorldPlayerOverallRating(existing, tables);
    const seasonalRatingChange = isHumanPlayer ? 0 : annualCpuDevelopment(existing.age, currentOverall, getWorldPlayerDevelopmentPotential(existing), existing.playerName, playerDecline(existing));

    return {
      ...existing,
      nation:
        worldRow?.nation ??
        amateurRow?.nation ??
        qTourRow?.nation ??
        seniorRow?.nation ??
        youthRow?.nation ??
        existing.nation,
      totalMatches: existing.totalMatches + seasonMatches,
      wins: existing.wins + seasonWins,
      losses: existing.losses + seasonLosses,
      totalPrizeMoney: existing.totalPrizeMoney + seasonRecord.prizeMoney,
      titles: existing.titles + seasonRecord.titles,
      majorTitles:
        existing.majorTitles +
        (entryName === playerName ? (playerSeasonRecord?.majorTitles ?? 0) : actual?.majors ?? 0),
      highestBreak: Math.max(existing.highestBreak, actual?.highestBreak ?? 0),
      centuries: (existing.centuries ?? 0) + (actual?.centuries ?? 0),
      breakRecordsMatches: (existing.breakRecordsMatches ?? 0) + (actual?.breakMatches ?? 0),
      qTourWins: existing.qTourWins + (evidence ? actual?.qTourTitles ?? 0 : qTourTitles),
      seniorTitles: existing.seniorTitles + (evidence ? actual?.seniorTitles ?? 0 : seniorTitles),
      highestWorldRank:
        existing.highestWorldRank == null
          ? (worldRow?.ranking ?? null)
          : worldRow?.ranking != null
            ? Math.min(existing.highestWorldRank, worldRow.ranking)
            : existing.highestWorldRank,
      overallRating: isHumanPlayer
        ? existing.overallRating
        : clamp(
            currentOverall + seasonalRatingChange,
            35,
            Math.max(currentOverall, getWorldPlayerDevelopmentPotential(existing)),
          ),
      ratingProgress: isHumanPlayer ? existing.ratingProgress : 0,
      coachQuality: isHumanPlayer
        ? existing.coachQuality
        : clamp((existing.coachQuality ?? 55) + performanceGrowth, 30, 96),
      equipmentQuality: isHumanPlayer
        ? existing.equipmentQuality
        : clamp(
            (existing.equipmentQuality ?? 55) +
              (seasonRecord.prizeMoney >= 100000
                ? 2
                : seasonRecord.prizeMoney >= 25000
                  ? 1
                  : 0),
            32,
            98,
          ),
      trainingLoad: nextTrainingLoad,
      fatigue: nextFatigue,
      injuryWeeks: nextInjuryWeeks,
      sponsorLevel: isHumanPlayer
        ? existing.sponsorLevel
        : clamp(
            (existing.sponsorLevel ?? 35) +
              (seasonRecord.titles > 0 ? 7 : performanceGrowth),
            5,
            99,
          ),
      seasons: seasonRows.slice(0, 12),
    };
  });
}

function syncCareerSystems(
  state: Pick<GameState, "competitionTables" | "player" | "careerSystems"> &
    Partial<Pick<GameState, "history">>,
): CareerSystemsState {
  const qTourRow = state.competitionTables.qTour.find(
    (row) => row.playerName === state.player.fullName,
  );
  const qSchoolRow = state.competitionTables.qSchool.find(
    (row) => row.playerName === state.player.fullName,
  );
  const worldRow = state.competitionTables.world.find(
    (row) => row.playerName === state.player.fullName,
  );
  const oneYearRow = state.competitionTables.oneYear.find(
    (row) => row.playerName === state.player.fullName,
  );
  const seniorRow = state.competitionTables.senior.find(
    (row) => row.playerName === state.player.fullName,
  );
  const youthRow = state.competitionTables.youth.find(
    (row) => row.playerName === state.player.fullName,
  );
  const qTourLeader = state.competitionTables.qTour[0]?.playerName ?? null;
  const qSchoolLeader = state.competitionTables.qSchool[0]?.playerName ?? null;
  const worldRank = worldRow?.ranking ?? 999;
  const normalizedHasTourCard =
    state.careerSystems.pro.hasTourCard || worldRank <= TOP_64_RANK_CUTOFF;
  const proBase = {
    ...state.careerSystems.pro,
    hasTourCard: normalizedHasTourCard,
    cardSource:
      state.careerSystems.pro.cardSource ??
      (worldRank <= TOP_64_RANK_CUTOFF
        ? "Ranking Retained"
        : normalizedHasTourCard
          ? "Unknown"
          : null),
    worldRank:
      worldRow?.ranking == null
        ? null
        : worldRow.ranking,
    oneYearRank: oneYearRow?.ranking ?? null,
  };
  let survivalStatus: ProCareerSystemState["survivalStatus"] =
    proBase.hasTourCard
      ? proBase.yearsRemaining >= 2
        ? "Rookie Year 1"
        : proBase.yearsRemaining === 1
          ? "Rookie Year 2"
          : proBase.retainedViaRanking
            ? "Safe"
            : "At Risk"
      : "Amateur";
  let currentTier =
    state.player.age < 18 ? "Junior Amateur Circuit" : "Amateur Circuit";

  if (proBase.hasTourCard || worldRank <= TOP_64_RANK_CUTOFF) {
    if (worldRank <= TOP_16_RANK_CUTOFF) {
      survivalStatus = "Top 16";
      currentTier = "Top 16 Elite Player";
    } else if (worldRank <= TOP_32_RANK_CUTOFF) {
      survivalStatus = "Top 32";
      currentTier = "Top 32 Professional";
    } else if (worldRank <= TOP_64_RANK_CUTOFF) {
      survivalStatus = "Safe";
      currentTier = "Tour Survivor / Top 64";
    } else if (proBase.hasTourCard && worldRank <= 96) {
      survivalStatus = "Bubble";
      currentTier = "Rookie Professional — Two-Year Tour Card";
    } else if (proBase.hasTourCard && worldRank <= MAIN_TOUR_POOL_SIZE) {
      survivalStatus = "At Risk";
      currentTier = "Rookie Professional — Two-Year Tour Card";
    } else if (
      !proBase.hasTourCard &&
      proBase.yearsRemaining === 0 &&
      state.careerSystems.pro.awardedBy
    ) {
      survivalStatus = "Lost Card";
      currentTier = "Q School / Tour Fightback";
    }
  } else if (
    (qSchoolRow?.points ?? 0) > 0 ||
    state.careerSystems.qSchool.campaignsEntered > 0
  ) {
    currentTier = "Q School Campaigner";
  } else if ((qTourRow?.points ?? 0) > 0) {
    currentTier = "Q Tour / Global Amateur Pathway";
  } else if ((youthRow?.ranking ?? 999) <= 32 && state.player.age <= 21) {
    currentTier = "Junior Amateur Circuit";
  }

  const retired =
    state.player.age >= 78 &&
    !proBase.hasTourCard &&
    worldRank > TOP_64_RANK_CUTOFF &&
    ((seniorRow?.eventsPlayed ?? 0) > 0 ||
      (seniorRow?.ranking ?? 999) <= 24 ||
      state.player.rankingLabel === "Senior Ranking");
  const lateCareer: LateCareerSystemState = {
    veteranActive:
      state.player.age >= 40 &&
      (worldRank <= MAIN_TOUR_POOL_SIZE ||
        proBase.hasTourCard ||
        state.player.reputation >= 68),
    seniorEligible: state.player.age >= 40,
    seniorActive:
      !retired &&
      state.player.age >= 40 &&
      !proBase.hasTourCard &&
      worldRank > TOP_64_RANK_CUTOFF &&
      ((seniorRow?.eventsPlayed ?? 0) > 0 || (seniorRow?.ranking ?? 999) <= 24),
    legendStatus: state.player.age >= 40 && state.player.reputation >= 70,
    retired,
  };

  if (lateCareer.retired) {
    currentTier = "Retired";
  } else if (lateCareer.seniorActive) {
    currentTier = "Senior Tour / Legend Circuit";
  } else if (
    lateCareer.veteranActive &&
    worldRank > TOP_64_RANK_CUTOFF &&
    !proBase.hasTourCard
  ) {
    currentTier = "Veteran Amateur / Pro-Am Circuit";
  } else if (lateCareer.veteranActive && worldRank > TOP_32_RANK_CUTOFF) {
    currentTier = "Veteran Professional";
  }

  return {
    qTour: {
      ...state.careerSystems.qTour,
      playerRank: qTourRow?.ranking ?? null,
      playerPoints: qTourRow?.points ?? 0,
      leader: qTourLeader,
      top16Bonus:
        (qTourRow?.ranking ?? 999) <= 16 && (qTourRow?.points ?? 0) > 0,
      top32Bonus:
        (qTourRow?.ranking ?? 999) <= 32 && (qTourRow?.points ?? 0) > 0,
    },
    qSchool: {
      ...state.careerSystems.qSchool,
      playerRank: qSchoolRow?.ranking ?? null,
      playerPoints: qSchoolRow?.points ?? 0,
      leader: qSchoolLeader,
      topUpEligible:
        (qSchoolRow?.ranking ?? 999) === 1 && (qSchoolRow?.points ?? 0) > 0,
      slumpRisk: state.careerSystems.qSchool.repeatedFailures >= 2,
    },
    pro: {
      ...proBase,
      survivalStatus,
      tourSurvivalStatus: survivalStatus,
      currentTier,
    },
    lateCareer,
  };
}

function isMajorCareerEvent(
  entry: Pick<TournamentHistoryEntry, "eventType" | "tournamentName">,
) {
  return (
    /major/i.test(entry.eventType ?? "") ||
    /world championship|uk major|uk championship|tour championship|masters-style|champion of champions/i.test(
      entry.tournamentName ?? "",
    )
  );
}

function isProfessionalEventType(eventType: string | undefined) {
  return /major|ranking|professional|professional tour|invitational/i.test(
    eventType ?? "",
  );
}

function getSeasonSortKey(season: string) {
  return Number.parseInt(season.split("/")[0] ?? "", 10) || 0;
}

function getRecentProfessionalHistoryProfile(history?: CareerHistoryState) {
  const entries = history?.tournamentHistory ?? [];
  const proEntries = entries.filter((entry) =>
    isProfessionalEventType(entry.eventType),
  );
  const seasonLabels = Array.from(
    new Set(proEntries.map((entry) => entry.season).filter(Boolean)),
  ).sort((left, right) => getSeasonSortKey(right) - getSeasonSortKey(left));
  const latestSeason = seasonLabels[0] ?? null;
  const twoYearSeasons = new Set(seasonLabels.slice(0, 2));
  const latestEntries = latestSeason
    ? proEntries.filter((entry) => entry.season === latestSeason)
    : [];
  const twoYearEntries = proEntries.filter((entry) =>
    twoYearSeasons.has(entry.season),
  );
  const latestSeasonProWins = latestEntries.reduce(
    (sum, entry) => sum + entry.wins,
    0,
  );
  const latestSeasonProLosses = latestEntries.reduce(
    (sum, entry) => sum + entry.losses,
    0,
  );
  const twoYearProWins = twoYearEntries.reduce(
    (sum, entry) => sum + entry.wins,
    0,
  );
  const twoYearProLosses = twoYearEntries.reduce(
    (sum, entry) => sum + entry.losses,
    0,
  );
  const twoYearMatches = twoYearProWins + twoYearProLosses;

  return {
    latestSeasonProWins,
    latestSeasonProLosses,
    latestSeasonMainTourEvents: latestEntries.length,
    latestSeasonMajorFinals: latestEntries.filter(
      (entry) =>
        isMajorCareerEvent(entry) && getTournamentFinishTier(entry.result) >= 4,
    ).length,
    latestSeasonRankingTitles: latestEntries.filter(
      (entry) =>
        entry.result === "Winner" && isProfessionalEventType(entry.eventType),
    ).length,
    latestSeasonMajorTitles: latestEntries.filter(
      (entry) => entry.result === "Winner" && isMajorCareerEvent(entry),
    ).length,
    latestSeasonWorldTitles: latestEntries.filter(
      (entry) =>
        entry.result === "Winner" &&
        isWorldChampionshipMainDrawName(entry.tournamentName),
    ).length,
    twoYearProWins,
    twoYearProLosses,
    twoYearMainTourEvents: twoYearEntries.length,
    twoYearWinRate: twoYearMatches > 0 ? twoYearProWins / twoYearMatches : 0,
  };
}

function getTournamentFinishTier(result: string) {
  if (/winner/i.test(result)) return 5;
  if (/quarter/i.test(result)) return 2;
  if (/semi/i.test(result)) return 3;
  if (/(^|\s)final(ist)?(\s|$)/i.test(result)) return 4;
  return 0;
}

function isWorldChampionshipMainDrawName(name: string | undefined) {
  return (
    /world championship/i.test(name ?? "") &&
    !/qualifying/i.test(name ?? "") &&
    !/seniors world championship/i.test(name ?? "")
  );
}

function getCareerPhaseFromSystems(
  player: Player,
  careerSystems: CareerSystemsState,
) {
  const worldRank = careerSystems.pro.worldRank ?? 999;
  const rookieStatus =
    careerSystems.pro.hasTourCard &&
    careerSystems.pro.currentYear > 0 &&
    careerSystems.pro.yearsRemaining > 0 &&
    !careerSystems.pro.retainedViaRanking &&
    worldRank > 32;

  if (careerSystems.lateCareer.retired) return "Retired";
  if (careerSystems.lateCareer.seniorActive) return "Senior";
  if (careerSystems.lateCareer.veteranActive) return "Veteran";
  if (rookieStatus) return "Rookie";
  if (careerSystems.pro.hasTourCard || worldRank <= 64) return "Established";
  if (player.age < 18 || player.rankingLabel === "Youth Ranking")
    return "Youth";
  return "Amateur";
}

function getCareerStageFromSystems(
  player: Player,
  careerSystems: CareerSystemsState,
  history?: CareerHistoryState,
) {
  const worldRank = careerSystems.pro.worldRank ?? 999;
  const majorHistory =
    history?.tournamentHistory.filter((entry) => isMajorCareerEvent(entry)) ??
    [];
  const recentProProfile = getRecentProfessionalHistoryProfile(history);
  const recentProMatches =
    recentProProfile.twoYearProWins + recentProProfile.twoYearProLosses;
  if (
    recentProMatches < 8 &&
    player.rankingLabel === "World Ranking" &&
    /Top 16 Elite Player|Top 32 Professional|Tour Survivor \/ Top 64/.test(
      player.careerStage,
    )
  ) {
    return player.careerStage;
  }
  const hasWorldTitle = history?.tournamentHistory.some(
    (entry) =>
      isWorldChampionshipMainDrawName(entry.tournamentName) &&
      entry.result === "Winner",
  );
  const rankingTitles =
    history?.tournamentHistory.filter(
      (entry) =>
        entry.result === "Winner" &&
        /major|ranking|professional tour/i.test(entry.eventType ?? ""),
    ).length ?? 0;
  const majorSemiFinals = majorHistory.filter(
    (entry) => getTournamentHistoryFinishTier(entry) >= 3,
  ).length;
  const majorFinals = majorHistory.filter(
    (entry) => getTournamentHistoryFinishTier(entry) >= 4,
  ).length;
  const strongTwoYearWinProfile =
    recentProProfile.twoYearProWins >= 16 &&
    recentProProfile.twoYearWinRate >= 0.45;
  const sufficientEliteVolume =
    recentProProfile.latestSeasonMainTourEvents >= 6 ||
    recentProProfile.twoYearMainTourEvents >= 12;
  const lowWinRateOutlier =
    recentProProfile.twoYearProWins + recentProProfile.twoYearProLosses >= 10 &&
    recentProProfile.twoYearWinRate < 0.2;
  const majorContenderGate =
    rankingTitles > 0 ||
    majorFinals > 0 ||
    majorSemiFinals >= 3 ||
    recentProProfile.latestSeasonProWins >= 8 ||
    strongTwoYearWinProfile;
  const rookieStatus =
    careerSystems.pro.hasTourCard &&
    careerSystems.pro.currentYear > 0 &&
    careerSystems.pro.yearsRemaining > 0 &&
    !careerSystems.pro.retainedViaRanking &&
    worldRank > 32;

  if (careerSystems.lateCareer.retired) return "Retired";
  if (careerSystems.lateCareer.seniorActive)
    return "Senior Tour / Legend Circuit";
  if (hasWorldTitle) return "World Champion";
  if (worldRank <= TOP_16_RANK_CUTOFF && majorContenderGate)
    return "Major Contender";
  if (
    worldRank <= TOP_16_RANK_CUTOFF &&
    sufficientEliteVolume &&
    !lowWinRateOutlier
  )
    return "Top 16 Elite Player";
  if (worldRank <= TOP_32_RANK_CUTOFF) return "Top 32 Professional";
  if (
    worldRank <= TOP_64_RANK_CUTOFF &&
    (careerSystems.pro.retainedViaRanking || careerSystems.pro.hasTourCard)
  )
    return "Tour Survivor / Top 64";
  if (careerSystems.pro.hasTourCard && worldRank <= MAIN_TOUR_POOL_SIZE) {
    return careerSystems.pro.currentYear > 0 &&
      careerSystems.pro.yearsRemaining > 0
      ? rookieStatus
        ? "Rookie Pro / At Risk"
        : "Rookie Pro / Bubble"
      : "Bottom Tour / At Risk";
  }
  if (
    (player.rankingLabel === "Youth Ranking" ||
      /junior|youth/i.test(player.careerStage)) &&
    player.age <= 21
  ) {
    return /junior|youth/i.test(player.careerStage)
      ? player.careerStage
      : "Youth";
  }
  if (
    careerSystems.qSchool.campaignsEntered > 0 &&
    !careerSystems.pro.hasTourCard
  )
    return "Q School";
  if (
    (careerSystems.qTour.playerPoints > 0 ||
      player.careerStage.toLowerCase().includes("q tour")) &&
    !careerSystems.pro.hasTourCard
  )
    return "Q Tour";
  return "Amateur";
}

export function getPlayerWorldRankingCeiling(
  state: Pick<
    GameState,
    "history" | "competitionTables" | "player" | "attributes" | "equipment"
  >,
) {
  const recentProProfile = getRecentProfessionalHistoryProfile(state.history);
  const recentProMatches =
    recentProProfile.twoYearProWins + recentProProfile.twoYearProLosses;
  const seededPlayerRow = state.competitionTables.world.find(
    (row) => row.playerName === state.player.fullName,
  );
  if (
    recentProMatches < 8 &&
    state.player.rankingLabel === "World Ranking" &&
    seededPlayerRow &&
    (seededPlayerRow?.statusNote?.startsWith("Starting at ") ||
      /Top 16 Elite Player|Top 32 Professional|Tour Survivor \/ Top 64/.test(
        state.player.careerStage,
      ))
  ) {
    return seededPlayerRow.ranking;
  }
  const effectiveStrength = calculateCurrentEffectiveStrength(state);
  const professionalFinals = state.history.tournamentHistory.filter((entry) =>
    isProfessionalFinalLevelRun(entry),
  ).length;
  const rankingTitles = state.history.tournamentHistory.filter(
    (entry) =>
      entry.result === "Winner" && isProfessionalEventType(entry.eventType),
  ).length;
  const majorTitles = state.history.tournamentHistory.filter(
    (entry) => entry.result === "Winner" && isMajorCareerEvent(entry),
  ).length;
  const worldTitles = state.history.tournamentHistory.filter(
    (entry) =>
      entry.result === "Winner" &&
      isWorldChampionshipMainDrawName(entry.tournamentName),
  ).length;
  const hasTitleProof = rankingTitles > 0 || majorTitles > 0 || worldTitles > 0;
  const strongTwoYearWinProfile =
    recentProProfile.twoYearProWins >= 16 &&
    recentProProfile.twoYearWinRate >= 0.45;
  const recentTitleProof =
    recentProProfile.latestSeasonRankingTitles > 0 ||
    recentProProfile.latestSeasonMajorTitles > 0 ||
    recentProProfile.latestSeasonWorldTitles > 0;
  const eliteTop16Eligible =
    recentProProfile.latestSeasonMainTourEvents >= 6 &&
    recentProProfile.latestSeasonProWins >= 4 &&
    recentProProfile.twoYearWinRate >= 0.3 &&
    effectiveStrength >= 80 &&
    (recentTitleProof ||
      recentProProfile.latestSeasonMajorFinals > 0 ||
      strongTwoYearWinProfile);
  const top4Eligible =
    (recentProProfile.latestSeasonProWins >= 8 &&
      recentProProfile.twoYearMainTourEvents >= 10 &&
      recentProProfile.twoYearWinRate >= 0.5 &&
      effectiveStrength >= 120) ||
    recentProProfile.latestSeasonMajorFinals > 0 ||
    recentTitleProof ||
    (recentProProfile.twoYearMainTourEvents >= 12 &&
      recentProProfile.twoYearWinRate >= 0.55 &&
      effectiveStrength >= 125);

  if (recentProMatches < 8 && state.player.rankingLabel !== "World Ranking") {
    return 65;
  }

  if (
    recentProProfile.latestSeasonProWins < 2 &&
    recentProProfile.twoYearWinRate < 0.18 &&
    effectiveStrength < 80
  ) {
    return 65;
  }

  if (
    !hasTitleProof &&
    recentProMatches >= 20 &&
    recentProProfile.latestSeasonMajorFinals === 0 &&
    recentProProfile.twoYearWinRate < 0.25
  ) {
    return 65;
  }

  if (
    !hasTitleProof &&
    recentProMatches >= 20 &&
    recentProProfile.latestSeasonMajorFinals === 0 &&
    recentProProfile.twoYearWinRate < 0.35
  ) {
    return 33;
  }

  if (
    !hasTitleProof &&
    recentProMatches >= 20 &&
    recentProProfile.twoYearWinRate < 0.45
  ) {
    return 17;
  }

  if (!hasTitleProof && recentProMatches >= 20) {
    return professionalFinals >= 3 &&
      recentProProfile.latestSeasonMajorFinals > 0 &&
      recentProProfile.twoYearWinRate >= 0.45 &&
      effectiveStrength >= 110
      ? 9
      : 17;
  }

  if (!eliteTop16Eligible) {
    return 17;
  }

  if (!top4Eligible) {
    return 5;
  }

  // No. 1 is a current achievement, not a permanent reward for lifetime titles.
  // Other elite seasons can reach No. 2; winning the current season's Worlds is
  // the explicit proof required to occupy the top ranking slot.
  const rankOneEligible = recentProProfile.latestSeasonWorldTitles > 0;

  return rankOneEligible ? 1 : 2;
}

function getRankingLabelForCompetitionKey(key: CompetitionTableKey) {
  switch (key) {
    case "world":
    case "oneYear":
      return "World Ranking";
    case "amateur":
      return "Amateur Ranking";
    case "qTour":
      return "Q Tour Ranking";
    case "qSchool":
      return "Q School Order of Merit";
    case "senior":
      return "Senior Ranking";
    case "youth":
      return "Youth Ranking";
  }
}

function getCurrentCueBonus(equipment: EquipmentState) {
  return getEquipmentPerformanceProfile(equipment).totalBonus;
}

export function getMissingTournamentEquipment(equipment: EquipmentState) {
  const missing: string[] = [];

  if (!equipment.currentCueId) missing.push("cue");
  if (
    !equipment.currentChalkId ||
    (equipment.chalkStock[equipment.currentChalkId] ?? 0) <= 0 ||
    equipment.chalkCondition <= 0
  )
    missing.push("usable chalk");
  if (
    !equipment.currentTipId ||
    (equipment.currentCueId
      ? getCueState(equipment, equipment.currentCueId).tipCondition <= 0
      : true)
  )
    missing.push("fitted tip");

  return missing;
}

function getTournamentEquipmentMessage(equipment: EquipmentState) {
  const missing = getMissingTournamentEquipment(equipment);
  if (missing.length === 0) return null;

  return `Equip a ${missing.join(", ")} before entering a tournament.`;
}

function finalizeState(
  state: GameState,
  lastAction: string,
  snapshotLabel?: string,
) {
  state = { ...state, history: { ...state.history, legacy: careerLegacyOf(state) } };
  const recalculated = reconcileCareerBudget(recalculateState(reconcileRealism(reconcileCareerDepth(processRankingCalendar(state))), lastAction));
  const nextState = { ...recalculated, player: { ...recalculated.player, legacyScore: careerLegacyRating(careerLegacyOf(recalculated)).score } };
  return snapshotLabel
    ? withHistorySnapshot(nextState, snapshotLabel)
    : nextState;
}

export function getTournamentEntryRound(
  state: GameState,
  tournament: Tournament,
): TournamentRound {
  const rawRows = getCompetitionRowsForTournament(state, tournament);
  const rankingRows = countsForWorldRanking(tournament) || tournament.type === 'Invitational' ? seedingRows(state, tournament, rawRows) : rawRows;
  const playerRank =
    rankingRows.find((row) => row.playerName === state.player.fullName)
      ?.ranking ??
    state.player.worldRanking ??
    state.player.amateurRanking ??
    999;
  return getConfiguredEntryRoundForRank(tournament, playerRank);
}

function getPreferredOpponentRank(
  playerRank: number,
  accessBand: ProTourAccessBand,
  currentRoundIndex: number,
  tournament: Tournament,
) {
  const tournamentClass = getTournamentCircuitClass(tournament);

  if (tournamentClass === "youth") {
    return clamp(playerRank + 10 - currentRoundIndex * 2, 4, 48);
  }

  if (tournamentClass === "amateur") {
    return clamp(playerRank + 12 - currentRoundIndex * 2, 4, 48);
  }

  if (tournamentClass === "qTour") {
    return currentRoundIndex === 0
      ? clamp(playerRank + 18, 8, 48)
      : clamp(playerRank + 8, 4, 24);
  }

  if (tournamentClass === "qSchool") {
    return currentRoundIndex === 0
      ? clamp(playerRank + 14, 8, 48)
      : clamp(playerRank + 6, 4, 20);
  }

  if (tournamentClass === "senior" || tournamentClass === "exhibition") {
    return clamp(playerRank + 8 - currentRoundIndex, 4, 48);
  }

  switch (accessBand) {
    case "top16":
      return currentRoundIndex === 0 ? 56 : currentRoundIndex === 1 ? 28 : 12;
    case "top32":
      return currentRoundIndex === 0 ? 48 : currentRoundIndex === 1 ? 24 : 12;
    case "top64":
      return currentRoundIndex === 0
        ? clamp(Math.round(playerRank * 0.82), 20, 56)
        : currentRoundIndex === 1
          ? clamp(Math.round(playerRank * 0.62), 12, 36)
          : clamp(Math.round(playerRank * 0.42), 6, 20);
    case "bottomTour":
      return currentRoundIndex === 0
        ? clamp(Math.round(playerRank * 0.56), 16, 42)
        : currentRoundIndex === 1
          ? clamp(Math.round(playerRank * 0.4), 10, 28)
          : clamp(Math.round(playerRank * 0.25), 4, 16);
    default:
      return playerRank;
  }
}

function getWorldPlayerTournamentSnapshot(
  state: GameState,
  playerName: string,
) {
  const record = state.worldPlayers.find(
    (entry) => entry.playerName === playerName,
  );
  const worldRank =
    state.competitionTables.world.find((row) => row.playerName === playerName)
      ?.ranking ??
    record?.highestWorldRank ??
    999;

  return {
    age:
      record?.age ??
      inferWorldPlayerAge(playerName, state.competitionTables, state.player),
    worldRank,
    hasTourCard: record?.hasTourCard ?? worldRank <= MAIN_TOUR_POOL_SIZE,
    hasMainTourStatus:
      (record?.hasTourCard ?? false) || worldRank <= TOP_64_RANK_CUTOFF,
  };
}

function getTournamentFieldRows(state: GameState, tournament: Tournament) {
  const baseRows = getCompetitionRowsForTournament(state, tournament);
  const tournamentClass = getTournamentCircuitClass(tournament);
  const proAmAllowed = /pro-am/i.test(
    `${tournament.name} ${tournament.format} ${tournament.progressionImpact ?? ""}`,
  );

  return baseRows.filter((row) => {
    const opponent = getWorldPlayerTournamentSnapshot(state, row.playerName);

    switch (tournamentClass) {
      case "youth":
      case "qTour":
      case "qSchool":
      case "senior":
        return !pathwayEntryReason(tournament, { name: row.playerName, nation: row.nation, age: opponent.age, hasTourCard: opponent.hasTourCard }, state);
      case "amateur":
        return !opponent.hasMainTourStatus || proAmAllowed;
      case "exhibition":
        return opponent.age >= 35 || opponent.hasMainTourStatus;
      default:
        return (
          opponent.hasTourCard || opponent.worldRank <= MAIN_TOUR_POOL_SIZE
        );
    }
  });
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
  const rankingRows = getTournamentFieldRows(state, tournament);
  const availableRows = rankingRows.filter(
    (row) =>
      row.playerName !== playerName && !excludeNames.includes(row.playerName),
  );
  const tournamentClass = getTournamentCircuitClass(tournament);

  if (availableRows.length === 0) {
    return (
      rankingRows.find((row) => row.playerName !== playerName) ?? rankingRows[0]
    );
  }

  let candidateRows = availableRows;

  if (isMainTourEventType(tournament)) {
    if (
      (tournamentClass === "eliteInvitational" ||
        tournamentClass === "worldChampionshipMain") &&
      accessBand === "top16" &&
      currentRoundIndex === 0
    ) {
      candidateRows = candidateRows.filter(
        (row) => row.ranking > TOP_16_RANK_CUTOFF,
      );
    }

    if (
      (tournamentClass === "eliteInvitational" ||
        tournamentClass === "worldChampionshipMain") &&
      accessBand === "top16" &&
      currentRoundIndex === 1
    ) {
      candidateRows = candidateRows.filter((row) => row.ranking > 8);
    }

    if (
      tournamentClass === "worldChampionshipQualifying" &&
      accessBand === "top32"
    ) {
      candidateRows = candidateRows.filter(
        (row) => row.ranking > TOP_16_RANK_CUTOFF,
      );
    }

    if (tournamentClass === "rookieQualifier" && accessBand === "top64") {
      candidateRows = candidateRows.filter((row) => row.ranking >= 33);
    }

    if (accessBand === "bottomTour") {
      candidateRows = candidateRows.filter(
        (row) => row.ranking >= 17 && row.ranking <= 80,
      );
      if (tournamentClass === "ranking" || tournamentClass === "ukMajor") {
        candidateRows = candidateRows.filter(
          (row) => row.ranking <= (currentRoundIndex === 0 ? 64 : 32),
        );
      }
      if (
        tournamentClass === "eliteInvitational" ||
        tournamentClass === "worldChampionshipMain"
      ) {
        candidateRows = candidateRows.filter((row) => row.ranking <= 32);
      }
      if (tournamentClass === "worldChampionshipQualifying") {
        candidateRows = candidateRows.filter(
          (row) => row.ranking <= (currentRoundIndex === 0 ? 64 : 48),
        );
      }
    }

    if (
      accessBand === "top64" &&
      (tournamentClass === "ranking" || tournamentClass === "ukMajor")
    ) {
      candidateRows = candidateRows.filter(
        (row) => row.ranking <= (currentRoundIndex === 0 ? 72 : 40),
      );
    }
  }

  if (candidateRows.length === 0) {
    candidateRows = availableRows;
  }

  const preferredRank = getPreferredOpponentRank(
    playerRank,
    accessBand,
    currentRoundIndex,
    tournament,
  );
  return candidateRows.sort(
    (left, right) =>
      Math.abs(left.ranking - preferredRank) -
      Math.abs(right.ranking - preferredRank),
  )[0];
}

function createMatchSetup(state: GameState, tournament: Tournament) {
  state = { ...state, attributes: effectiveCareerAttributes(state, state.attributes) };
  const touch = conditionAdjustment(venueConditions(tournament), state.attributes.technical['Cue Ball Control'] ?? 50, state.attributes.technical['Safety Play'] ?? 50, familiarisedFor(state, tournament));
  state = { ...state, attributes: { ...state.attributes, technical: { ...state.attributes.technical, 'Cue Ball Control': clamp((state.attributes.technical['Cue Ball Control'] ?? 50) + touch, 1, 99), 'Safety Play': clamp((state.attributes.technical['Safety Play'] ?? 50) + touch, 1, 99) } } };
  const currentRound =
    state.tournamentProgress.tournamentId === tournament.id &&
    state.tournamentProgress.currentRound
      ? state.tournamentProgress.currentRound
      : getTournamentEntryRound(state, tournament);
  const currentRoundIndex =
    getTournamentRounds(tournament).indexOf(currentRound);
  const roundPlan = getTournamentRoundPlan(tournament, currentRound);
  const preparationEffects = getTravelBooking(
    state,
    tournament.id,
  )?.preparation?.effects;
  const preparationRoundsPlayed =
    state.tournamentProgress.tournamentId === tournament.id
      ? state.tournamentProgress.completedRounds.length
      : 0;
  const preparationDecay = Math.max(
    0.35,
    1 - preparationRoundsPlayed * 0.18,
  );
  const preparationBonus = (label: string) =>
    (preparationEffects?.attributeBonuses[label] ?? 0) * preparationDecay;
  const technical =
    calculateTechnicalAverage(state.attributes.technical) +
    calculateAverage([
      preparationBonus("Long Potting"),
      preparationBonus("Break Building"),
      preparationBonus("Cue Ball Control"),
      preparationBonus("Safety Play"),
      preparationBonus("Consistency"),
    ]);
  const mental =
    calculateAverage(Object.values(state.attributes.mental)) +
    calculateAverage([
      preparationBonus("Composure"),
      preparationBonus("Focus"),
      preparationBonus("Big Match Nerve"),
    ]);
  const physical =
    calculateAverage(Object.values(state.attributes.physical)) +
    calculateAverage([
      preparationBonus("Stamina"),
      preparationBonus("Balance"),
    ]);
  const bigMatchNerve = state.attributes.mental["Big Match Nerve"] ?? mental;
  const composure = state.attributes.mental.Composure ?? mental;
  const equipmentBonus =
    getCurrentCueBonus(state.equipment) +
    (preparationEffects?.familiarityBonus ?? 0) * preparationDecay;
  const activeCoach = state.coaches.find(
    (coach) => coach.id === state.currentCoachId,
  );
  const coachMatchBonus = activeCoach
    ? clamp(
        (activeCoach.tactical - 50) / 18 +
          (activeCoach.motivation - 50) / 35 +
          (activeCoach.compatibility - 60) / 40,
        0,
        3,
      )
    : 0;
  const travelModifier = getTravelReadinessModifier(state, tournament.id);
  const worldRank =
    state.careerSystems.pro.worldRank ?? state.player.worldRanking ?? 999;
  const entryAccess = getTournamentEntryAccess(state, tournament);
  const bracketMatch =
    state.tournamentProgress.tournamentId === tournament.id
      ? findPlayerBracketMatch(
          state.tournamentProgress.draw,
          currentRound,
          state.player.fullName,
        )
      : null;
  const bracketOpponent = bracketMatch
    ? bracketMatch.top.name === state.player.fullName
      ? bracketMatch.bottom
      : bracketMatch.top
    : null;
  const playerBaseStrength =
    calculateMatchStrength({
      technical,
      mental,
      physical,
      confidence: state.player.confidence,
      fatigue: clamp(state.player.fatigue - travelModifier, 0, 100),
      equipmentBonus,
    }) +
    coachMatchBonus +
    depthOf(state).temporarySharpness +
    (preparationEffects?.sharpnessDelta ?? 0) * preparationDecay +
    travelModifier -
    (state.trainingCondition.injuryWeeks > 0 ? 6 : 0) -
    state.trainingCondition.strain / 25 -
    state.trainingCondition.burnout / 35;
  const opponent =
    bracketOpponent && bracketOpponent.name !== "TBD"
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
          state.tournamentProgress.completedRounds.map(
            (round) => round.opponentName,
          ),
          worldRank,
          entryAccess.accessBand,
          tournament,
          currentRoundIndex,
        );
  const qSchoolAdvantage =
    tournament.type === "Q School"
      ? state.careerSystems.qSchool.directPlayoffEligible
        ? 14
        : state.careerSystems.qSchool.seededCampaign
          ? 8
          : state.careerSystems.qSchool.campaignEligible
            ? 4
            : 0
      : 0;
  const seededBoost = entryAccess.seededProtection * 4;
  const bottomTourPenalty = entryAccess.accessBand === "bottomTour" ? 5 : 0;
  const tournamentClass = getTournamentCircuitClass(tournament);
  const pressureSkill = Math.round((bigMatchNerve + composure) / 2);
  const opponentBaseStrength =
    tournamentClass === "youth"
      ? 48
      : tournamentClass === "amateur"
        ? 56
        : tournamentClass === "qTour"
          ? 64
          : tournamentClass === "qSchool"
            ? 69
            : tournamentClass === "senior"
              ? 54
              : tournamentClass === "exhibition"
                ? 58
                : tournamentClass === "eliteInvitational"
                  ? 82
                  : tournamentClass === "worldChampionshipMain"
                    ? 88
                    : tournamentClass === "worldChampionshipQualifying"
                      ? 76
                      : tournamentClass === "rookieQualifier"
                        ? 71
                        : 68;
  const rankingWeight =
    tournamentClass === "youth"
      ? 0.18
      : tournamentClass === "amateur"
        ? 0.22
        : tournamentClass === "qTour"
          ? 0.28
          : tournamentClass === "qSchool"
            ? 0.3
            : tournamentClass === "senior" || tournamentClass === "exhibition"
              ? 0.16
              : tournamentClass === "eliteInvitational" ||
                  tournamentClass === "worldChampionshipMain"
                ? 0.38
                : 0.32;
  const roundDifficulty = getRoundDifficultyBonus(
    currentRound,
    tournamentClass,
  );
  const roundPressureMultiplier = getRoundPressureMultiplier(
    currentRound,
    tournamentClass,
  );
  const mainTourEvent = isMainTourEventType(tournament);
  const lowConfidencePenalty = Math.max(0, 52 - state.player.confidence) * 0.22;
  const fatiguePenalty =
    Math.max(0, state.player.fatigue - 24) * 0.16 +
    Math.max(0, state.player.fatigue - 52) * 0.24;
  const lowMentalPenalty = Math.max(0, 55 - mental) * 0.18;
  const clutchPenalty =
    Math.max(0, 60 - pressureSkill) * roundPressureMultiplier * 0.14;
  const supportPenalty = Math.max(0, equipmentBonus - 8) * 0.35;
  const eliteReadinessBonus =
    mainTourEvent &&
    playerBaseStrength >= 74 &&
    state.player.confidence >= 68 &&
    state.player.fatigue <= 50
      ? Math.min(
          3,
          Math.max(0, state.player.confidence - 72) * 0.045 +
            Math.max(0, 42 - state.player.fatigue) * 0.035 +
            Math.max(0, pressureSkill - 76) * 0.035,
        )
      : 0;
  const eliteSupportBonus =
    mainTourEvent &&
    playerBaseStrength >= 76 &&
    state.player.confidence >= 72 &&
    state.player.fatigue <= 45
      ? Math.min(1.5, Math.max(0, equipmentBonus - 18) * 0.015)
      : 0;
  const playerStrength = clamp(
    playerBaseStrength -
      lowConfidencePenalty -
      fatiguePenalty -
      lowMentalPenalty -
      clutchPenalty -
      supportPenalty +
      eliteReadinessBonus +
      eliteSupportBonus,
    18,
    96,
  );
  const opponentProfile = state.worldPlayers.find(
    (record) => record.playerName === opponent.playerName,
  );
  const opponentSupportModifier = opponentProfile
    ? ((opponentProfile.coachQuality ?? 55) - 55) / 12 +
      ((opponentProfile.equipmentQuality ?? 55) - 55) / 16 -
      (opponentProfile.fatigue ?? 30) / 35 -
      (opponentProfile.injuryWeeks ?? 0) * 3
    : 0;
  const persistentAbilityModifier = opponentProfile
    ? ((opponentProfile.overallRating ??
        inferWorldPlayerOverallRating(opponentProfile, state.competitionTables)) -
        inferWorldPlayerOverallRating(opponentProfile, state.competitionTables)) *
      0.7
    : 0;
  const opponentStrength = clamp(
    opponentBaseStrength +
      (100 - opponent.ranking) * rankingWeight +
      roundDifficulty +
      opponentSupportModifier +
      persistentAbilityModifier +
      developmentEdge(opponentProfile?.skillDevelopment) +
      Math.random() * 8 -
      qSchoolAdvantage * 0.35 -
      seededBoost * 0.75 +
      bottomTourPenalty,
    44,
    97,
  );
  const winChanceBase = mainTourEvent
    ? 50
    : tournamentClass === "qSchool"
      ? 49
      : 50;
  const accessBandBonus =
    entryAccess.accessBand === "top16"
      ? currentRoundIndex === 0
        ? 3
        : currentRoundIndex === 1
          ? 2
          : 1
      : entryAccess.accessBand === "top32"
        ? currentRoundIndex === 0
          ? 2
          : currentRoundIndex === 1
            ? 1
            : 0
        : entryAccess.accessBand === "top64"
          ? currentRoundIndex === 0
            ? 1
            : 0
          : 0;
  const eliteClutchBonus = mainTourEvent
    ? Math.min(
        3,
        Math.max(0, pressureSkill - 76) * 0.08 +
          Math.max(0, state.player.confidence - 74) * 0.05,
      )
    : 0;
  const eliteRankSeparationBonus =
    mainTourEvent && worldRank <= TOP_16_RANK_CUTOFF
      ? Math.min(
          worldRank <= 4 ? 3 : 1.5,
          (worldRank <= 4 ? 1.5 : 0.75) +
            Math.max(0, state.player.reputation - 82) * 0.025 +
            Math.max(0, pressureSkill - 82) * 0.03,
        )
      : 0;
  const eliteFinalConversionBonus =
    mainTourEvent && currentRound === "Final" && worldRank <= TOP_16_RANK_CUTOFF
      ? Math.min(
          worldRank <= 4 ? 3 : 1.5,
          0.75 +
            Math.max(0, pressureSkill - 84) * 0.04 +
            Math.max(0, state.player.confidence - 84) * 0.03 +
            Math.max(0, state.player.reputation - 86) * 0.03,
        )
      : 0;
  const eliteLateRoundControlBonus =
    mainTourEvent && worldRank <= TOP_16_RANK_CUTOFF
      ? Math.min(
          worldRank <= 4 ? 3 : 1.5,
          (currentRound === "Semi Final"
            ? 1.5
            : currentRound === "Quarter Final"
              ? 1
              : currentRound === "Last 16"
                ? 0.5
                : 0) +
            Math.max(0, pressureSkill - 84) * 0.03 +
            Math.max(0, state.player.confidence - 84) * 0.025 +
            Math.max(0, state.player.reputation - 84) * 0.02,
        )
      : 0;
  const matureEliteSemiConversionBonus =
    mainTourEvent &&
    currentRound === "Semi Final" &&
    worldRank <= TOP_16_RANK_CUTOFF &&
    state.player.age >= 24 &&
    state.player.age <= 36 &&
    pressureSkill >= 80 &&
    state.player.confidence >= 74
      ? Math.min(
          worldRank <= 4 ? 2 : 1,
          0.5 +
            Math.max(0, pressureSkill - 86) * 0.035 +
            Math.max(0, state.player.confidence - 86) * 0.03,
        )
      : 0;
  const matureEliteFinalConversionBonus =
    mainTourEvent &&
    currentRound === "Final" &&
    worldRank <= TOP_16_RANK_CUTOFF &&
    state.player.age >= 27 &&
    state.player.age <= 38 &&
    pressureSkill >= 78 &&
    state.player.confidence >= 70
      ? Math.min(
          worldRank <= 4 ? 4 : 2,
          1 +
            Math.max(0, pressureSkill - 82) * 0.05 +
            Math.max(0, state.player.confidence - 78) * 0.04 +
            Math.max(0, state.player.reputation - 82) * 0.03,
        )
      : 0;
  const matureTourContenderBonus =
    mainTourEvent &&
    worldRank <= 33 &&
    state.player.age >= 27 &&
    state.player.age <= 48 &&
    playerBaseStrength >= 80 &&
    pressureSkill >= 72
      ? Math.min(
          worldRank <= TOP_16_RANK_CUTOFF ? 4 : 3,
          (currentRound === "Final"
            ? 2.4
            : currentRound === "Semi Final"
              ? 2
              : currentRound === "Quarter Final"
                ? 1.6
                : currentRound === "Last 16"
                  ? 1.2
                  : 0.8) +
            Math.max(0, state.player.confidence - 76) * 0.035 +
            Math.max(0, pressureSkill - 78) * 0.035 +
            Math.max(0, state.player.reputation - 78) * 0.025,
        )
      : 0;
  const risingEliteConversionBonus =
    mainTourEvent && worldRank <= 4 && state.player.age <= 34
      ? Math.min(
          2,
          (currentRound === "Final"
            ? 1.5
            : currentRound === "Semi Final"
              ? 1
              : currentRound === "Quarter Final"
                ? 0.5
                : 0) +
            Math.max(0, state.player.confidence - 88) * 0.025 +
            Math.max(0, pressureSkill - 88) * 0.025,
        )
      : 0;
  const eliteMajorConversionBonus =
    mainTourEvent &&
    worldRank <= 4 &&
    (tournamentClass === "worldChampionshipMain" ||
      tournamentClass === "ukMajor" ||
      tournamentClass === "eliteInvitational")
      ? Math.min(
          tournamentClass === "worldChampionshipMain" ? 2 : 1.5,
          (currentRound === "Final"
            ? 1.5
            : currentRound === "Semi Final"
              ? 1
              : currentRound === "Quarter Final"
                ? 0.5
                : 0) +
            Math.max(0, state.player.reputation - 88) * 0.02 +
            Math.max(0, pressureSkill - 88) * 0.02,
        )
      : 0;
  const matureWorldContenderBonus =
    mainTourEvent &&
    tournamentClass === "worldChampionshipMain" &&
    worldRank <= 33 &&
    state.player.age >= 27 &&
    state.player.age <= 42 &&
    pressureSkill >= 74 &&
    state.player.confidence >= 68
      ? Math.min(
          currentRound === "Final"
            ? 4.5
            : currentRound === "Semi Final"
              ? 4
              : currentRound === "Quarter Final"
                ? 3
                : currentRound === "Last 16"
                  ? 2
                  : 1,
          1 +
            Math.max(0, pressureSkill - 78) * 0.055 +
            Math.max(0, state.player.confidence - 74) * 0.045 +
            Math.max(0, state.player.reputation - 78) * 0.035,
        )
      : 0;
  const professionalFinals = state.history.tournamentHistory.filter((entry) =>
    isProfessionalFinalLevelRun(entry),
  ).length;
  const professionalTitles = state.history.tournamentHistory.filter(
    (entry) =>
      isProfessionalEventType(entry.eventType) && entry.result === "Winner",
  ).length;
  const finalDroughtConversionBonus =
    mainTourEvent &&
    tournamentClass !== "worldChampionshipMain" &&
    currentRound === "Final" &&
    playerBaseStrength >= 76 &&
    professionalTitles === 0 &&
    professionalFinals >= 1
      ? Math.min(
          24,
          10 +
            (professionalFinals - 1) * 1.6 +
            Math.max(0, playerBaseStrength - 78) * 0.22 +
            Math.max(0, pressureSkill - 70) * 0.08,
        )
      : 0;
  const earlyMajorPressurePenalty =
    mainTourEvent &&
    (tournamentClass === "worldChampionshipMain" ||
      tournamentClass === "ukMajor" ||
      tournamentClass === "eliteInvitational")
      ? state.player.age <= 22
        ? currentRound === "Final"
          ? 12
          : currentRound === "Semi Final"
            ? 9
            : currentRound === "Quarter Final"
              ? 5
              : 2
        : state.player.age <= 24
          ? currentRound === "Final"
            ? 8
            : currentRound === "Semi Final"
              ? 5
              : currentRound === "Quarter Final"
                ? 3
                : 1
          : state.player.age <= 26
            ? currentRound === "Final"
              ? 4
              : currentRound === "Semi Final"
                ? 2
                : 0
            : 0
      : 0;
  const worldTitleBurdenPenalty =
    tournamentClass === "worldChampionshipMain"
      ? state.player.age <= 24
        ? currentRound === "Final"
          ? 7
          : currentRound === "Semi Final"
            ? 4
            : 2
        : state.player.age <= 26
          ? currentRound === "Final"
            ? 3
            : currentRound === "Semi Final"
              ? 1
              : 0
          : 0
      : 0;
  const worldChampionshipDifficultyPenalty =
    tournamentClass === "worldChampionshipMain"
      ? currentRound === "Final"
        ? 18
        : currentRound === "Semi Final"
          ? 15
          : currentRound === "Quarter Final"
            ? 12
            : currentRound === "Last 16"
              ? 10
              : 8
      : 0;
  const baseWinChanceCeiling =
    mainTourEvent &&
    worldRank <= 4 &&
    (currentRound === "Final" || currentRound === "Semi Final")
      ? tournamentClass === "worldChampionshipMain"
        ? 68
        : tournamentClass === "ukMajor"
          ? 84
          : 82
      : mainTourEvent && worldRank <= 4 && currentRound === "Quarter Final"
        ? tournamentClass === "worldChampionshipMain"
          ? 68
          : tournamentClass === "ukMajor"
            ? 80
            : 78
        : mainTourEvent &&
            worldRank <= TOP_16_RANK_CUTOFF &&
            (currentRound === "Final" || currentRound === "Semi Final")
          ? tournamentClass === "worldChampionshipMain"
            ? 66
            : 80
          : mainTourEvent
            ? 78
            : tournamentClass === "senior"
              ? 72
              : 82;
  const youngWorldChampionshipCeiling =
    tournamentClass === "worldChampionshipMain" && state.player.age <= 24
      ? currentRound === "Final"
        ? 18
        : currentRound === "Semi Final"
          ? 22
          : currentRound === "Quarter Final"
            ? 28
            : currentRound === "Last 16"
              ? 35
              : 40
      : null;
  const eliteWinChanceCeiling =
    youngWorldChampionshipCeiling == null
      ? baseWinChanceCeiling
      : Math.min(baseWinChanceCeiling, youngWorldChampionshipCeiling);
  const rawWinChance = clamp(
    winChanceBase +
      (playerStrength - opponentStrength) * 0.92 +
      qSchoolAdvantage +
      seededBoost * 0.45 +
      accessBandBonus +
      eliteClutchBonus +
      eliteRankSeparationBonus +
      eliteFinalConversionBonus +
      eliteLateRoundControlBonus +
      matureEliteSemiConversionBonus +
      matureEliteFinalConversionBonus +
      matureTourContenderBonus +
      risingEliteConversionBonus +
      eliteMajorConversionBonus +
      matureWorldContenderBonus +
      finalDroughtConversionBonus -
      earlyMajorPressurePenalty -
      worldTitleBurdenPenalty -
      worldChampionshipDifficultyPenalty -
      bottomTourPenalty,
    mainTourEvent ? 14 : 12,
    eliteWinChanceCeiling,
  );
  const finalDroughtWinChanceFloor =
    finalDroughtConversionBonus > 0
      ? Math.min(
          eliteWinChanceCeiling,
          64 +
            Math.min(14, Math.max(0, professionalFinals - 1) * 1.6) +
            Math.min(4, Math.max(0, playerBaseStrength - 82) * 0.2),
        )
      : null;
  const winChanceFloor = Math.max(finalDroughtWinChanceFloor ?? 0);
  const winChance =
    winChanceFloor <= 0 ? rawWinChance : Math.max(rawWinChance, winChanceFloor);

  return {
    currentRound,
    currentRoundIndex,
    roundPlan,
    opponent,
    playerStrength,
    opponentStrength,
    pressureSkill,
    winChance,
  };
}

function createLiveMatchState(
  state: GameState,
  tournament: Tournament,
): LiveMatchState {
  const setup = createMatchSetup(state, tournament);
  const framesNeeded = Math.floor(setup.roundPlan.bestOf / 2) + 1;
  const plannedFrameWinChance = convertMatchWinProbabilityToFrameWinProbability(
    setup.winChance,
    setup.roundPlan.bestOf === 4 ? 5 : setup.roundPlan.bestOf,
  );
  const travelBooking = getTravelBooking(state, tournament.id);
  const travelSummary = travelBooking
    ? `${getTravelOption(travelBooking.travelOptionId).name} · ${getHotelOption(travelBooking.hotelOptionId).name}`
    : "No travel package locked";
  const activeCoach = state.coaches.find(
    (coach) => coach.id === state.currentCoachId,
  );
  const opponentArchetype = getOpponentArchetype(
    setup.opponent.playerName,
    setup.opponent.ranking,
  );
  const tableState = getFrameStartTableState();
  const opponentConfidence = clamp(
    Math.round(54 + (100 - setup.opponent.ranking) * 0.35 + Math.random() * 12),
    52,
    92,
  );
  const opponentFatigue = clamp(Math.round(26 + Math.random() * 22), 18, 62);
  const opponentClutch = clamp(
    Math.round(52 + (100 - setup.opponent.ranking) * 0.24 + Math.random() * 10),
    42,
    92,
  );
  const playerVisitProfile = buildPlayerLiveVisitProfile(state);
  const opponentVisitProfile = applyTourSkills(buildOpponentLiveVisitProfile(
    setup.opponent.ranking,
    setup.opponentStrength,
    opponentArchetype,
    opponentConfidence,
    opponentFatigue,
    clamp(Math.round((100 - setup.opponent.ranking) / 14), 0, 8),
  ), state.worldPlayers.find(p=>p.playerName===setup.opponent.playerName)?.skillDevelopment);
  const opponentApproach = learnedCounter(state, setup.opponent.playerName) ?? getLiveMatchOpponentApproach({
    playerFrames: 0,
    opponentFrames: 0,
    opponentConfidence,
    opponentFatigue,
    pressureValue: 38,
    opponentArchetype,
  });
  const coachPrompt = getLiveMatchCoachPrompt(
    {
      playerFrames: 0,
      opponentFrames: 0,
      pressureValue: 38,
      playerFatigue: state.player.fatigue,
      opponentApproach,
      tacticalPlan: "Balanced",
      mentalFocus: "Composed",
      tempo: "Steady",
    },
    activeCoach?.name,
  );

  const rules = resolveTournamentFormat(tournament).specialRules ?? [];
  const handicap = rules.includes('handicap') ? handicapAllowance(getCompetitionRowsForTournament(state, tournament).find(r => r.playerName === state.player.fullName)?.ranking ?? 1, setup.opponent.ranking) : { playerHandicap: 0, opponentHandicap: 0 };
  const openingPlayer = rules.includes('shootOut') && Math.random() < .5 ? setup.opponent.playerName : state.player.fullName;
  return {
    tournamentId: tournament.id,
    round: setup.currentRound,
    atmosphere: eventAtmosphere(state, tournament),
    sessions: sessionPlan(setup.roundPlan.bestOf, tournament),
    special: { rules, elapsedSeconds: 0, ...handicap },
    venue: venueConditions(tournament),
    conditionEffect: conditionAdjustment(venueConditions(tournament), playerVisitProfile.cueBallControl, playerVisitProfile.safetyPlay, familiarisedFor(state, tournament)),
    objectives: matchObjectives(state, setup.opponent.ranking, setup.roundPlan.bestOf),
    sessionId: `${state.season}:${tournament.id}:${setup.currentRound}:${setup.opponent.playerName}:${state.history.matchLog.length}`,
    bestOf: setup.roundPlan.bestOf,
    framesNeeded,
    playerName: state.player.fullName,
    opponentName: setup.opponent.playerName,
    opponentRanking: setup.opponent.ranking,
    opponentArchetype,
    playerFrames: 0,
    opponentFrames: 0,
    currentFrame: 1,
    playerPoints: handicap.playerHandicap,
    opponentPoints: handicap.opponentHandicap,
    currentVisit: 1,
    currentBreak: 0,
    tableState,
    ballsRemaining: getLegacyBallUnitsFromTableState(tableState),
    playerAtTable: openingPlayer,
    frameStarterName: openingPlayer,
    shotClock: rules.includes('shootOut') ? 15 : 30,
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
    playerMaximums: 0,
    pressureValue: 38,
    pressureLabel: "Stable",
    timeElapsedMinutes: 0,
    startedAt: formatDisplayDate(state.currentDate),
    table: `Table ${Math.max(1, Math.ceil(Math.random() * 4))}`,
    referee: ["A. Hughes", "L. Carter", "N. Moss"][
      Math.floor(Math.random() * 3)
    ],
    conditions: travelBooking
      ? `Prepared · ${travelSummary}`
      : "Fast table · short prep window",
    intervalText: `Opening session in ${setup.currentRound}. ${travelBooking ? "Travel and hotel package are confirmed." : "Travel has not been customised yet."} Rival profile: ${getOpponentArchetypeNote(opponentArchetype)}.`,
    framesRemainingText: `${framesNeeded} frames needed to win`,
    plannedWinChance: plannedFrameWinChance,
    plannedMatchWinChance: setup.winChance,
    plannedPlayerStrength: setup.playerStrength,
    plannedOpponentStrength: setup.opponentStrength,
    careerBestAtStart: careerLegacyOf(state).highestBreak,
    feed: [
      {
        id: `feed-start-${Date.now()}`,
        time: "00:00",
        text: `${matchWalkout(eventAtmosphere(state, tournament), [state.player.fullName, setup.opponent.playerName])} ${state.player.fullName} walks out to face ${setup.opponent.playerName} in the ${setup.currentRound}. Rival profile: ${getOpponentArchetypeNote(opponentArchetype)}. ${getRivalry(state,setup.opponent.playerName)?.rivalry ? "An established rivalry resumes: " + getRivalry(state,setup.opponent.playerName)!.wins + " wins and " + getRivalry(state,setup.opponent.playerName)!.losses + " losses in their recorded meetings." : ""}`,
        actor: "System",
        tone: "blue",
      },
    ],
    momentum: [{ label: "Start", player: 50, opponent: 50 }],
    frameHistory: [],
    frameTactics: [],
    playerStats: createEmptyLiveMatchStats(),
    opponentStats: createEmptyLiveMatchStats(),
    tacticalPlan: "Balanced",
    mentalFocus: "Composed",
    tempo: "Steady",
    timeoutsRemaining: 2,
    lastFrameMode: null,
    lastTacticalNote: coachPrompt.note,
    lastVisitSummary: "Opening visit is ready.",
    opponentApproach,
    tacticalEdge: getTacticalMatchupEdge("Balanced", opponentApproach),
    coachPrompt,
    lastOpponentAdjustment: null,
    opponentAdjustmentHistory: [],
    visitHistory: [],
    playerVisitProfile,
    opponentVisitProfile,
    status: "In Progress" as const,
  };
}

export function startLiveMatchState(
  previousState: GameState,
  tournamentId?: string,
) {
  const tournament =
    previousState.tournaments.find((item) => item.id === tournamentId) ??
    previousState.tournaments.find((item) => item.status === "Entered");
  if (!tournament) {
    return finalizeState(
      previousState,
      "No entered tournament is ready to go live.",
    );
  }

  if (
    previousState.liveMatch &&
    previousState.liveMatch.tournamentId === tournament.id &&
    previousState.liveMatch.status === "In Progress"
  ) {
    return finalizeState(
      previousState,
      `Resumed the live match against ${previousState.liveMatch.opponentName}.`,
    );
  }

  const playability = getTournamentPlayability(previousState, tournament);
  if (!playability.canPlay) {
    return finalizeState(
      previousState,
      playability.reason ?? `${tournament.name} is not ready to go live.`,
    );
  }

  const equipmentMessage = getTournamentEquipmentMessage(
    previousState.equipment,
  );
  if (equipmentMessage) return finalizeState(previousState, equipmentMessage);

  previousState = prepareBetweenMatchesState(previousState, 'rest', tournament.id);
  return finalizeState(
    {
      ...previousState,
      liveMatch: createLiveMatchState(previousState, tournament),
    },
    `Started the live match at ${tournament.name}.`,
  );
}

export function simulateSyntheticLiveVisitMatch(
  input: SyntheticLiveVisitMatchInput,
): SyntheticLiveVisitMatchResult {
  if (input.simulationMode !== SIMULATION_MODE.liveVisitCalibration) {
    throw new Error(
      "Synthetic live-visit simulation is only available in liveVisitCalibration mode.",
    );
  }

  return withSeededLiveMatchRandom(input.seed, () => {
    const round = input.round ?? getSyntheticLiveMatchRound(input.bestOf);
    const framesNeeded = Math.ceil(input.bestOf / 2);
    const initialPlayerFrames = input.initialPlayerFrames ?? 0;
    const initialOpponentFrames = input.initialOpponentFrames ?? 0;
    const plannedFrameWinChance =
      convertMatchWinProbabilityToFrameWinProbability(
        input.plannedMatchWinChance,
        input.bestOf,
      );
    const opponentArchetype = getOpponentArchetype(
      input.opponentName,
      input.opponentRanking,
    );
    const initialPressureValue =
      input.initialPressureValue ??
      getSyntheticDefaultPressureValue(
        initialPlayerFrames,
        initialOpponentFrames,
        framesNeeded,
      );
    const playerConstructedProfile = buildLiveVisitProfile({
      side: "player",
      name: input.playerName,
      sourceKind: "attributes",
      attributes: input.playerAttributes,
      confidence: input.playerConfidence,
      fatigue: input.playerFatigue,
      equipmentBonus: input.playerEquipmentBonus ?? 0,
      sourceRankBand: input.playerRankBand ?? "Synthetic Player",
      tacticalPlan: input.playerTacticalPlan,
      startsFrameProbability: input.startingPlayer === "opponent" ? 0 : 100,
      initialMomentum: 50,
    });
    const opponentConstructedProfile =
      input.opponentProfileMode === "attributes" && input.opponentAttributes
        ? buildLiveVisitProfile({
            side: "opponent",
            name: input.opponentName,
            sourceKind: "attributes",
            attributes: input.opponentAttributes,
            confidence: input.opponentConfidence,
            fatigue: input.opponentFatigue,
            equipmentBonus: input.opponentEquipmentBonus ?? 0,
            sourceRankBand: input.opponentRankBand ?? "Synthetic Opponent",
            tacticalPlan: input.opponentTacticalPlan,
            startsFrameProbability:
              input.startingPlayer === "opponent" ? 100 : 0,
            initialMomentum: 50,
          })
        : buildLiveVisitProfile({
            side: "opponent",
            name: input.opponentName,
            sourceKind: "rankBased",
            attributes: buildRankBasedLiveVisitAttributes(
              input.opponentRanking,
              input.opponentStrength,
              opponentArchetype,
              input.opponentRankBand ??
                getLiveVisitRankBand(input.opponentRanking),
              false,
            ),
            confidence: input.opponentConfidence,
            fatigue: input.opponentFatigue,
            equipmentBonus:
              input.opponentEquipmentBonus ??
              clamp(Math.round((100 - input.opponentRanking) / 14), 0, 8),
            sourceRankBand:
              input.opponentRankBand ??
              getLiveVisitRankBand(input.opponentRanking),
            tacticalPlan: input.opponentTacticalPlan,
            startsFrameProbability:
              input.startingPlayer === "opponent" ? 100 : 0,
            initialMomentum: 50,
          });
    const playerVisitProfile = playerConstructedProfile.visitProfile;
    const opponentVisitProfile = opponentConstructedProfile.visitProfile;
    const opponentApproach = getLiveMatchOpponentApproach({
      playerFrames: initialPlayerFrames,
      opponentFrames: initialOpponentFrames,
      opponentConfidence: input.opponentConfidence,
      opponentFatigue: input.opponentFatigue,
      pressureValue: initialPressureValue,
      opponentArchetype,
    });
    const coachPrompt = getLiveMatchCoachPrompt({
      playerFrames: initialPlayerFrames,
      opponentFrames: initialOpponentFrames,
      pressureValue: initialPressureValue,
      playerFatigue: input.playerFatigue,
      opponentApproach,
      tacticalPlan: "Balanced",
      mentalFocus: "Composed",
      tempo: input.playerTempo ?? "Steady",
    });
    const tableState = getFrameStartTableState();
    const decisionCounts: Record<LiveVisitDecision, number> = {
      "Pot Attempt": 0,
      "Break Build": 0,
      "Safety Exchange": 0,
      "Snooker Hunt": 0,
      "Respotted Black": 0,
    };
    let totalVisits = 0;
    let guard = 0;
    const firstScoringFrames = new Set<string>();
    const fullVisitLog: SyntheticLiveVisitVisitLogEntry[] = [];
    const frameSummaries: SyntheticLiveVisitFrameSummary[] = [];
    const debugMetrics: SyntheticLiveVisitDebugMetrics = {
      player: createSyntheticLiveVisitSideMetrics(),
      opponent: createSyntheticLiveVisitSideMetrics(),
    };
    const syntheticTacticalEdge = input.preserveTacticalEdge
      ? getSyntheticTacticalStyleEdge(
          playerConstructedProfile.tacticalPlan,
          opponentConstructedProfile.tacticalPlan,
        )
      : 0;

    let liveMatch: LiveMatchState = {
      tournamentId: "synthetic-live-visit",
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
      playerAtTable:
        input.startingPlayer === "opponent"
          ? input.opponentName
          : input.playerName,
      frameStarterName:
        input.startingPlayer === "opponent"
          ? input.opponentName
          : input.playerName,
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
    playerMaximums: 0,
      pressureValue: initialPressureValue,
      pressureLabel:
        initialPressureValue >= 78
          ? "High"
          : initialPressureValue >= 58
            ? "Building"
            : "Stable",
      timeElapsedMinutes: 0,
      startedAt: "Synthetic Calibration",
      table: "Calibration Table",
      referee: "Synthetic Referee",
      conditions: "Controlled live-visit simulation",
      intervalText: `Synthetic ${round} calibration match. Rival profile: ${getOpponentArchetypeNote(opponentArchetype)}.`,
      framesRemainingText: `${framesNeeded} frames needed to win`,
      plannedWinChance: plannedFrameWinChance,
      plannedMatchWinChance: input.plannedMatchWinChance,
      plannedPlayerStrength: input.playerStrength,
      plannedOpponentStrength: input.opponentStrength,
      feed: [
        {
          id: "feed-start-synthetic",
          time: "00:00",
          text: `${input.playerName} faces ${input.opponentName} in a synthetic ${round} calibration match.`,
          actor: "System",
          tone: "blue",
        },
      ],
      momentum: [{ label: "Start", player: 50, opponent: 50 }],
      frameHistory: [],
      frameTactics: [],
      playerStats: createEmptyLiveMatchStats(),
      opponentStats: createEmptyLiveMatchStats(),
      tacticalPlan: "Balanced",
      mentalFocus: "Composed",
      tempo: input.playerTempo ?? "Steady",
      timeoutsRemaining: 2,
      lastFrameMode: null,
      lastTacticalNote: coachPrompt.note,
      lastVisitSummary: "Opening visit is ready.",
      opponentApproach,
      tacticalEdge: syntheticTacticalEdge,
      coachPrompt,
      lastOpponentAdjustment: null,
      opponentAdjustmentHistory: [],
      visitHistory: [],
      playerVisitProfile,
      opponentVisitProfile,
      status: "In Progress",
    };
    let currentFrameStartState = liveMatch;
    let currentFrameVisits: SyntheticLiveVisitVisitLogEntry[] = [];

    while (liveMatch.status === "In Progress" && guard < 4000) {
      if (liveMatch.currentVisit === 1 && currentFrameVisits.length === 0) {
        const startingSide =
          liveMatch.playerAtTable === liveMatch.playerName
            ? debugMetrics.player
            : debugMetrics.opponent;
        startingSide.frameStarts += 1;
      }
      const calibrationState = {
        ...liveMatch,
        tacticalEdge: syntheticTacticalEdge,
      };
      const activePlan =
        calibrationState.playerAtTable === calibrationState.playerName
          ? playerConstructedProfile.tacticalPlan
          : opponentConstructedProfile.tacticalPlan;
      const nextLiveMatch = advanceLiveVisit(
        calibrationState,
        getSyntheticCalibrationVisitDecision(calibrationState, activePlan),
        "simulated",
      );
      const latestVisit = nextLiveMatch.visitHistory[0];
      if (latestVisit) {
        const capturedVisit = { ...latestVisit };
        decisionCounts[latestVisit.decision] += 1;
        totalVisits += 1;
        fullVisitLog.push(capturedVisit);
        currentFrameVisits.push(capturedVisit);
        const actorMetrics =
          latestVisit.actor === "Player"
            ? debugMetrics.player
            : debugMetrics.opponent;
        actorMetrics.visits += 1;
        actorMetrics.pointsScored += latestVisit.points;
        actorMetrics.totalTacticalEdge += latestVisit.tacticalEdge;
        actorMetrics.totalDecisionBonus += latestVisit.decisionBonus;
        actorMetrics.totalSuccessChance += latestVisit.successChance;
        actorMetrics.totalConfidence += latestVisit.actorConfidence;
        actorMetrics.totalFatigue += latestVisit.actorFatigue;
        if (latestVisit.points > 0) {
          actorMetrics.scoringVisitCount += 1;
          actorMetrics.totalScoringBreak += latestVisit.breakTotal;
          if (!firstScoringFrames.has(latestVisit.frameLabel)) {
            actorMetrics.firstScoringChances += 1;
            firstScoringFrames.add(latestVisit.frameLabel);
          }
        }
        if (latestVisit.foulOccurred) {
          actorMetrics.foulsCommitted += 1;
        } else if (!latestVisit.success) {
          actorMetrics.unforcedErrors += 1;
        }
        recordSyntheticDecisionMetrics(
          actorMetrics,
          latestVisit.decision,
          latestVisit.success,
        );
      }
      if (nextLiveMatch.frameHistory.length > liveMatch.frameHistory.length) {
        const completedFrame =
          nextLiveMatch.frameHistory[nextLiveMatch.frameHistory.length - 1];
        frameSummaries.push(
          buildSyntheticFrameSummary(
            currentFrameStartState,
            nextLiveMatch,
            completedFrame,
            currentFrameVisits,
          ),
        );
        currentFrameVisits = [];
        currentFrameStartState = nextLiveMatch;
      }
      liveMatch = { ...nextLiveMatch, tacticalEdge: syntheticTacticalEdge };
      guard += 1;
    }

    debugMetrics.player.frameWins = liveMatch.frameHistory.filter(
      (frame) => frame.winner === liveMatch.playerName,
    ).length;
    debugMetrics.opponent.frameWins = liveMatch.frameHistory.filter(
      (frame) => frame.winner === liveMatch.opponentName,
    ).length;

    return {
      playerWon: liveMatch.playerFrames > liveMatch.opponentFrames,
      playerFrames: liveMatch.playerFrames,
      opponentFrames: liveMatch.opponentFrames,
      score: `${liveMatch.playerFrames}-${liveMatch.opponentFrames}`,
      frameWinChance: plannedFrameWinChance,
      decidingFrame:
        Math.max(liveMatch.playerFrames, liveMatch.opponentFrames) ===
          liveMatch.framesNeeded &&
        Math.min(liveMatch.playerFrames, liveMatch.opponentFrames) ===
          liveMatch.framesNeeded - 1,
      whitewash:
        Math.min(liveMatch.playerFrames, liveMatch.opponentFrames) === 0,
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
    };
  });
}

export function resolveCompletedLiveFrame(
  liveMatch: LiveMatchState,
  mode: "Played" | "Simmed",
  concededBy?: "Player" | "Opponent",
): LiveMatchState {
  if (!concededBy) liveMatch = attemptGoldenBall(liveMatch);
  let nextPlayerPoints = liveMatch.playerPoints;
  let nextOpponentPoints = liveMatch.opponentPoints;
  let playerWinsFrame = nextPlayerPoints > nextOpponentPoints;

  // The visits have already decided the score. Simulating must not reroll
  // the winner or manufacture points after the table has been cleared.
  if (concededBy) {
    playerWinsFrame = concededBy === 'Opponent';
  } else if (nextPlayerPoints === nextOpponentPoints) {
    const respottedBlackWinChance = clamp(
      50 +
        ((liveMatch.plannedWinChance ?? 50) - 50) * 0.3 +
        (liveMatch.playerClutch - liveMatch.opponentClutch) * 0.2 +
        (liveMatch.playerConfidence - liveMatch.opponentConfidence) * 0.08,
      35,
      65,
    );
    playerWinsFrame = Math.random() * 100 < respottedBlackWinChance;
    if (playerWinsFrame) {
      nextPlayerPoints += 7;
    } else {
      nextOpponentPoints += 7;
    }
  }

  const frameLabel = `F${liveMatch.currentFrame}`;
  const nextPlayerFrames = liveMatch.playerFrames + (playerWinsFrame ? 1 : 0);
  const nextOpponentFrames =
    liveMatch.opponentFrames + (playerWinsFrame ? 0 : 1);
  const matchComplete =
    nextPlayerFrames >= liveMatch.framesNeeded ||
    nextOpponentFrames >= liveMatch.framesNeeded ||
    (liveMatch.bestOf === 4 && nextPlayerFrames + nextOpponentFrames >= 4);
  const pressureValue = clamp(
    38 +
      Math.abs(nextPlayerFrames - nextOpponentFrames) * 8 +
      (matchComplete ? 18 : 0),
    24,
    96,
  );
  const nextPlayerConfidence = clamp(
    liveMatch.playerConfidence + (playerWinsFrame ? 2 : -2),
    25,
    99,
  );
  const nextOpponentConfidence = clamp(
    liveMatch.opponentConfidence + (playerWinsFrame ? -2 : 2),
    25,
    99,
  );
  const nextPlayerFatigue = clamp(
    liveMatch.playerFatigue +
      getLiveVisitFrameFatigueCost(liveMatch.playerVisitProfile),
    0,
    100,
  );
  const nextOpponentFatigue = clamp(
    liveMatch.opponentFatigue +
      getLiveVisitFrameFatigueCost(liveMatch.opponentVisitProfile),
    0,
    100,
  );
  const nextOpponentApproach = getLiveMatchOpponentApproach({
    playerFrames: nextPlayerFrames,
    opponentFrames: nextOpponentFrames,
    opponentConfidence: nextOpponentConfidence,
    opponentFatigue: nextOpponentFatigue,
    pressureValue,
    opponentArchetype: liveMatch.opponentArchetype,
  });
  const opponentAdjustment = buildOpponentAdjustmentEvent({
    previousApproach: liveMatch.opponentApproach,
    nextApproach: nextOpponentApproach,
    frameLabel,
    nextPlayerFrames,
    nextOpponentFrames,
    pressureValue,
  });
  const nextCoachPrompt = getLiveMatchCoachPrompt({
    playerFrames: nextPlayerFrames,
    opponentFrames: nextOpponentFrames,
    pressureValue,
    playerFatigue: nextPlayerFatigue,
    opponentApproach: nextOpponentApproach,
    tacticalPlan: liveMatch.tacticalPlan,
    mentalFocus: liveMatch.mentalFocus,
    tempo: liveMatch.tempo,
  });
  const frameFeed = buildVisitFeedEntry(
    formatLiveClock(liveMatch.timeElapsedMinutes),
    `${mode} ${frameLabel}: ${playerWinsFrame ? liveMatch.playerName : liveMatch.opponentName} wins the frame ${nextPlayerPoints}-${nextOpponentPoints}. ${frameStory(liveMatch,playerWinsFrame)} ${liveMatch.bestOf > 1 && (playerWinsFrame ? liveMatch.playerFrames + 1 === liveMatch.framesNeeded - 1 && liveMatch.opponentFrames === liveMatch.framesNeeded - 1 : liveMatch.opponentFrames + 1 === liveMatch.framesNeeded - 1 && liveMatch.playerFrames === liveMatch.framesNeeded - 1) ? crowdReaction(liveMatch.atmosphere, liveMatch.playerName, "decider") : ""}`,
    playerWinsFrame ? "Player" : "Opponent",
    playerWinsFrame ? "green" : "amber",
  );
  const adjustmentFeed = opponentAdjustment
    ? buildVisitFeedEntry(
        formatLiveClock(liveMatch.timeElapsedMinutes),
        `Opponent adjustment: ${opponentAdjustment.note}`,
        "System",
        "blue",
      )
    : null;
  const frameRow: FrameScoreRow = {
    frame: frameLabel,
    player: `${nextPlayerPoints}`,
    opponent: `${nextOpponentPoints}`,
    winner: playerWinsFrame ? liveMatch.playerName : liveMatch.opponentName,
  };
  const nextFrameStarterName =
    liveMatch.frameStarterName === liveMatch.playerName
      ? liveMatch.opponentName
      : liveMatch.playerName;

  return {
    ...liveMatch,
    playerFrames: nextPlayerFrames,
    opponentFrames: nextOpponentFrames,
    currentFrame: matchComplete
      ? liveMatch.currentFrame
      : liveMatch.currentFrame + 1,
    playerPoints: matchComplete ? nextPlayerPoints : liveMatch.special?.playerHandicap ?? 0,
    opponentPoints: matchComplete ? nextOpponentPoints : liveMatch.special?.opponentHandicap ?? 0,
    currentVisit: 1,
    currentBreak: 0,
    tableState: matchComplete
      ? { redsRemaining: 0, coloursRemaining: [] }
      : getFrameStartTableState(),
    ballsRemaining: matchComplete
      ? 0
      : getLegacyBallUnitsFromTableState(getFrameStartTableState()),
    playerAtTable: matchComplete
      ? playerWinsFrame
        ? liveMatch.playerName
        : liveMatch.opponentName
      : nextFrameStarterName,
    frameStarterName: matchComplete
      ? liveMatch.frameStarterName
      : nextFrameStarterName,
    shotClock: matchComplete ? 0 : 30,
    playerConfidence: nextPlayerConfidence,
    opponentConfidence: nextOpponentConfidence,
    playerFatigue: nextPlayerFatigue,
    opponentFatigue: nextOpponentFatigue,
    pressureValue,
    pressureLabel:
      pressureValue >= 78
        ? "High"
        : pressureValue >= 58
          ? "Building"
          : "Stable",
    intervalText: matchComplete
      ? "Final frame completed. Result is being confirmed."
      : `${liveMatch.framesNeeded - Math.max(nextPlayerFrames, nextOpponentFrames)} more frame wins secure the match. ${nextCoachPrompt.note}`,
    framesRemainingText: matchComplete
      ? "Match complete"
      : `${liveMatch.framesNeeded - nextPlayerFrames} frames to win`,
    feed: (
      [frameFeed, adjustmentFeed, ...liveMatch.feed].filter(
        Boolean,
      ) as LiveFeedItem[]
    ).slice(0, 16),
    momentum: [
      ...liveMatch.momentum.slice(-(liveMatch.bestOf - 1)),
      {
        label: frameLabel,
        player: nextPlayerFrames,
        opponent: nextOpponentFrames,
      },
    ],
    frameHistory: [...liveMatch.frameHistory, frameRow],
    frameTactics: [
      ...liveMatch.frameTactics,
      {
        frame: frameLabel,
        tacticalPlan: liveMatch.tacticalPlan,
        mentalFocus: liveMatch.mentalFocus,
        tempo: liveMatch.tempo,
      },
    ],
    lastFrameMode: mode,
    lastVisitSummary: `${frameLabel} complete. ${playerWinsFrame ? liveMatch.playerName : liveMatch.opponentName} took the frame ${nextPlayerPoints}-${nextOpponentPoints}.`,
    lastTacticalNote: `${liveMatch.lastTacticalNote}${nextPlayerPoints === nextOpponentPoints ? " Respotted black decided the frame." : ""}`,
    opponentApproach: nextOpponentApproach,
    tacticalEdge: getTacticalMatchupEdge(
      liveMatch.tacticalPlan,
      nextOpponentApproach,
    ),
    coachPrompt: nextCoachPrompt,
    lastOpponentAdjustment: opponentAdjustment,
    opponentAdjustmentHistory: opponentAdjustment
      ? [opponentAdjustment, ...liveMatch.opponentAdjustmentHistory].slice(0, 4)
      : liveMatch.opponentAdjustmentHistory,
    status: (matchComplete
      ? "Completed"
      : "In Progress") as LiveMatchState["status"],
  };
}

export function advanceLiveVisit(
  liveMatch: LiveMatchState,
  decision?: LiveVisitDecision,
  mode: LiveMatchResolutionMode = "manual",
  granularity: "visit" | "shot" = "visit",
): LiveMatchState {
  if (liveMatch.status === 'Completed' || pendingMatchBreak(liveMatch)) return liveMatch;
  if (liveMatch.special?.rules.includes('shootOut')) {
    const next = stepShootOut(liveMatch, decision);
    return next.special?.frameComplete ? resolveCompletedLiveFrame(next, 'Played') : next;
  }
  if (liveMatch.special?.rules.includes('blackBallDecider') && liveMatch.playerFrames === liveMatch.framesNeeded - 1 && liveMatch.opponentFrames === liveMatch.framesNeeded - 1) {
    const next = stepBallShootOut(liveMatch, 'Black');
    return next.special?.frameComplete ? resolveCompletedLiveFrame(next, 'Played') : next;
  }
  const actorIsPlayer = liveMatch.playerAtTable === liveMatch.playerName;
  const actor: LiveVisitActor = actorIsPlayer ? "Player" : "Opponent";
  const resolvedDecision =
    decision ??
    (actorIsPlayer
      ? getDefaultManualVisitDecision(liveMatch)
      : getAutoOpponentVisitDecision(liveMatch));
  const tacticalModifiers = getLiveMatchTacticalModifiers(
    liveMatch,
    actorIsPlayer && mode === "manual" ? "manual" : "simulated",
  );
  const tacticalEdge = actorIsPlayer
    ? liveMatch.tacticalEdge
    : -liveMatch.tacticalEdge;
  const rawProfile = actorIsPlayer
    ? liveMatch.playerVisitProfile
    : liveMatch.opponentVisitProfile;
  const conditionEffect = actorIsPlayer ? liveMatch.conditionEffect ?? 0 : liveMatch.venue ? conditionAdjustment(liveMatch.venue, rawProfile.cueBallControl, rawProfile.safetyPlay, false) : 0;
  const activeProfile = { ...rawProfile, cueBallControl: clamp(rawProfile.cueBallControl + conditionEffect, 1, 99), safetyPlay: clamp(rawProfile.safetyPlay + (liveMatch.tacticalPlan === 'Safety' ? conditionEffect * 0.5 : conditionEffect), 1, 99) };
  const defendingProfile = actorIsPlayer
    ? liveMatch.opponentVisitProfile
    : liveMatch.playerVisitProfile;
  const actorConfidence = actorIsPlayer
    ? liveMatch.playerConfidence
    : liveMatch.opponentConfidence;
  const actorFatigue = actorIsPlayer
    ? liveMatch.playerFatigue
    : liveMatch.opponentFatigue;
  const actorClutch = actorIsPlayer
    ? liveMatch.playerClutch
    : liveMatch.opponentClutch;
  const pressureHandling =
    activeProfile.bigMatchNerve * 0.4 +
    activeProfile.composure * 0.35 +
    activeProfile.focus * 0.25;
  const pressureLoad = Math.max(0, liveMatch.pressureValue - 58);
  const pressureModifier = (pressureHandling - 60) * (pressureLoad / 24) * 0.14;
  const plannedFrameWinChance =
    liveMatch.plannedWinChance ??
    convertMatchWinProbabilityToFrameWinProbability(
      liveMatch.plannedMatchWinChance,
      liveMatch.bestOf === 4 ? 5 : liveMatch.bestOf,
    );
  const actorFrameExpectation = actorIsPlayer
    ? plannedFrameWinChance
    : 100 - plannedFrameWinChance;
  const actorMatchExpectation = actorIsPlayer
    ? liveMatch.plannedMatchWinChance
    : 100 - liveMatch.plannedMatchWinChance;
  const actorBaselineChance =
    50 +
    (actorFrameExpectation - 50) * 0.32 +
    (actorMatchExpectation - 50) * 0.1;
  const remainingTablePoints = getRemainingTablePoints(liveMatch);
  const technicalSkill =
    resolvedDecision === "Break Build"
      ? activeProfile.breakBuilding * 0.34 +
        activeProfile.cueBallControl * 0.24 +
        activeProfile.consistency * 0.18 +
        activeProfile.focus * 0.12 +
        activeProfile.stamina * 0.12
      : resolvedDecision === "Pot Attempt"
        ? activeProfile.longPotting * 0.34 +
          activeProfile.cueBallControl * 0.22 +
          activeProfile.consistency * 0.16 +
          activeProfile.handSteadiness * 0.14 +
          activeProfile.composure * 0.14
        : resolvedDecision === "Safety Exchange"
          ? activeProfile.safetyPlay * 0.36 +
            activeProfile.focus * 0.2 +
            activeProfile.composure * 0.18 +
            activeProfile.cueBallControl * 0.16 +
            activeProfile.bigMatchNerve * 0.1
          : resolvedDecision === "Snooker Hunt"
            ? activeProfile.safetyPlay * 0.26 +
              activeProfile.focus * 0.2 +
              activeProfile.composure * 0.18 +
              activeProfile.bigMatchNerve * 0.2 +
              activeProfile.cueBallControl * 0.16
            : activeProfile.longPotting * 0.28 +
              activeProfile.cueBallControl * 0.2 +
              activeProfile.consistency * 0.14 +
              activeProfile.composure * 0.18 +
              activeProfile.bigMatchNerve * 0.14 +
              activeProfile.handSteadiness * 0.06;
  const defensiveResistance =
    resolvedDecision === "Safety Exchange" ||
    resolvedDecision === "Snooker Hunt"
      ? defendingProfile.safetyPlay * 0.18 +
        defendingProfile.focus * 0.16 +
        defendingProfile.composure * 0.12
      : defendingProfile.safetyPlay * 0.1 + defendingProfile.composure * 0.08;
  const decisionBonus =
    resolvedDecision === "Break Build"
      ? 2 + tacticalModifiers.playerBreakBonus * 0.12
      : resolvedDecision === "Safety Exchange"
        ? Math.max(0, liveMatch.pressureValue - 48) * 0.05
        : resolvedDecision === "Snooker Hunt"
          ? Math.max(
              0,
              (actorIsPlayer
                ? liveMatch.opponentPoints - liveMatch.playerPoints
                : liveMatch.playerPoints - liveMatch.opponentPoints) -
                remainingTablePoints,
            ) *
              0.45 +
            3
          : resolvedDecision === "Respotted Black"
            ? Math.max(0, liveMatch.pressureValue - 56) * 0.04
            : 0;
  const profileEdge =
    (technicalSkill - 64) * 0.26 -
    (defensiveResistance - 16) *
      (resolvedDecision === "Safety Exchange" ||
      resolvedDecision === "Snooker Hunt"
        ? 0.13
        : 0.08);
  const confidenceEdge = (actorConfidence - 62) * 0.1;
  const clutchEdge = (actorClutch - 62) * 0.08;
  const fatigueDrag = Math.max(0, actorFatigue - 12) * 0.08;
  const deliberateTempoActive =
    mode === "manual" && liveMatch.tempo === "Deliberate";
  const tempoEffects = getLiveTempoEffects(liveMatch.tempo);
  const deliberateTempoShotModifier = deliberateTempoActive
    ? actorIsPlayer
      ? tempoEffects.playerShotModifier
      : tempoEffects.opponentShotModifier
    : 0;
  const scoringSuccessBaseline = getLiveScoringSuccessBaseline(
    activeProfile,
    resolvedDecision,
  );
  const expectationAdjustment = (actorFrameExpectation - 50) * 0.08;
  const successChance = clamp(
    scoringSuccessBaseline +
      expectationAdjustment +
      profileEdge * 0.35 +
      confidenceEdge +
      clutchEdge +
      tacticalEdge * (mode === "manual" ? 0.8 : 0.35) +
      pressureModifier +
      decisionBonus * 0.55 -
      fatigueDrag +
      deliberateTempoShotModifier,
    resolvedDecision === "Respotted Black" ? 22 : 16,
    resolvedDecision === "Safety Exchange" ||
      resolvedDecision === "Snooker Hunt"
      ? 88
      : 92,
  );
  const success = Math.random() * 100 < successChance;
  const foulRisk = clamp(
    (resolvedDecision === "Break Build"
      ? 18
      : resolvedDecision === "Snooker Hunt"
        ? 20
        : resolvedDecision === "Respotted Black"
          ? 16
          : resolvedDecision === "Safety Exchange"
            ? 14
            : 12) +
      Math.max(0, liveMatch.pressureValue - 64) * 0.15 +
      Math.max(0, actorFatigue - 54) * 0.08 +
      Math.max(0, 60 - pressureHandling) * 0.09 +
      Math.max(0, 50 - actorBaselineChance) * 0.08 -
      Math.max(0, actorBaselineChance - 50) * 0.04 -
      activeProfile.consistency * 0.06 -
      activeProfile.focus * 0.04 -
      activeProfile.handSteadiness * 0.03,
    4,
    42,
  );
  const foulOccurred = !success && Math.random() * 100 < foulRisk;
  const foulPoints = foulOccurred
    ? clamp(4 + Math.round(Math.random() * 3), 4, 7)
    : 0;
  const retainChance = getLiveBreakContinuationChance(
    activeProfile,
    resolvedDecision,
    actorFatigue,
    liveMatch.pressureValue,
  );
  const isScoringDecision =
    resolvedDecision === "Pot Attempt" ||
    resolvedDecision === "Break Build" ||
    resolvedDecision === "Respotted Black";
  const retainedTable =
    success &&
    (granularity === "shot" && isScoringDecision
      ? true
      : Math.random() * 100 < retainChance);
  const visitScoring =
    success && !foulOccurred
      ? granularity === "shot"
        ? resolveLiveShotScoring(
            activeProfile,
            resolvedDecision,
            liveMatch.tableState,
          )
        : resolveLiveVisitScoring(
            activeProfile,
            resolvedDecision,
            liveMatch.tableState,
            retainedTable,
          )
      : {
          scoredPoints: 0,
          nextTableState: {
            redsRemaining: liveMatch.tableState.redsRemaining,
            coloursRemaining: [...liveMatch.tableState.coloursRemaining],
            ballOn: getBallOn(liveMatch.tableState),
          },
          tableProgressLabel: "",
        };
  const { scoredPoints, nextTableState, tableProgressLabel } = visitScoring;
  if (
    (!success || foulOccurred) &&
    getBallOn(liveMatch.tableState) === "Colour"
  ) {
    nextTableState.ballOn =
      nextTableState.redsRemaining > 0 ? "Red" : "Colours";
  }

  const nextBallsRemaining = getLegacyBallUnitsFromTableState(nextTableState);
  const nextRemainingTablePoints =
    getRemainingTablePointsFromState(nextTableState);
  const playerPointDelta = actorIsPlayer
    ? scoredPoints
    : foulOccurred
      ? foulPoints
      : 0;
  const opponentPointDelta = actorIsPlayer
    ? foulOccurred
      ? foulPoints
      : 0
    : scoredPoints;
  const nextPlayerPoints = liveMatch.playerPoints + playerPointDelta;
  const nextOpponentPoints = liveMatch.opponentPoints + opponentPointDelta;
  const completedBreakTotal =
    success &&
    !foulOccurred &&
    (resolvedDecision === "Pot Attempt" ||
      resolvedDecision === "Break Build" ||
      resolvedDecision === "Respotted Black")
      ? liveMatch.currentBreak + scoredPoints
      : 0;
  const nextCurrentBreak = retainedTable ? completedBreakTotal : 0;
  const nextPlayerAtTable = retainedTable
    ? liveMatch.playerAtTable
    : actorIsPlayer
      ? liveMatch.opponentName
      : liveMatch.playerName;
  const confidenceSwing = granularity === "shot" && retainedTable ? 0 : 1;
  const nextPlayerConfidence = clamp(
    liveMatch.playerConfidence +
      (actorIsPlayer
        ? success
          ? confidenceSwing
          : -confidenceSwing
        : success
          ? -confidenceSwing
          : confidenceSwing),
    25,
    99,
  );
  const deliberateRhythmPressure =
    deliberateTempoActive &&
    actorIsPlayer &&
    (success || resolvedDecision === "Safety Exchange")
      ? success
        ? 2
        : 1
      : 0;
  const nextOpponentConfidence = clamp(
    liveMatch.opponentConfidence +
      (!actorIsPlayer ? (success ? 1 : -1) : success ? -1 : 1) -
      deliberateRhythmPressure,
    25,
    99,
  );
  const actingFatigueCost =
    getLiveVisitFatigueCost(
      activeProfile,
      resolvedDecision,
      resolvedDecision === "Break Build" ? 1.15 : 0.65,
    ) * (granularity === "shot" ? 0.16 : 1);
  const nextPlayerFatigue = clamp(
    liveMatch.playerFatigue +
      (actorIsPlayer
        ? actingFatigueCost +
          (deliberateTempoActive
            ? tempoEffects.playerFatigueCost *
              (granularity === "shot" ? 0.16 : 1)
            : 0)
        : 0),
    0,
    100,
  );
  const nextOpponentFatigue = clamp(
    liveMatch.opponentFatigue + (!actorIsPlayer ? actingFatigueCost : 0),
    0,
    100,
  );
  const pressureScale = granularity === "shot" ? 0.2 : 1;
  const nextPressureValue = clamp(
    liveMatch.pressureValue +
      ((success ? -2 : 3) + (retainedTable ? -1 : 2)) * pressureScale,
    24,
    96,
  );
  const frameLabel = `F${liveMatch.currentFrame}`;
  const successOutcome =
    resolvedDecision === "Safety Exchange"
      ? "Won the safety exchange"
      : resolvedDecision === "Snooker Hunt"
        ? `Forced a foul worth ${scoredPoints}`
        : tableProgressLabel
          ? retainedTable
            ? `${tableProgressLabel} and stayed in`
            : `${tableProgressLabel} but left a chance`
          : retainedTable
            ? "Scored and stayed in"
            : "Scored but left a chance";
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
        : "Missed the chance",
    points: actorIsPlayer
      ? playerPointDelta - (foulOccurred ? foulPoints : 0)
      : opponentPointDelta,
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
  };
  const currentSideStats = actorIsPlayer
    ? liveMatch.playerStats
    : liveMatch.opponentStats;
  const isPotDecision =
    resolvedDecision === "Pot Attempt" ||
    resolvedDecision === "Break Build" ||
    resolvedDecision === "Respotted Black";
  const isSafetyDecision =
    resolvedDecision === "Safety Exchange" ||
    resolvedDecision === "Snooker Hunt";
  const updatedSideStats: LiveMatchSideStats = {
    visits:
      currentSideStats.visits + (liveMatch.currentBreak === 0 ? 1 : 0),
    pointsScored: currentSideStats.pointsScored + Math.max(0, scoredPoints),
    potAttempts: currentSideStats.potAttempts + (isPotDecision ? 1 : 0),
    potsMade: currentSideStats.potsMade + (isPotDecision && success ? 1 : 0),
    safetyAttempts:
      currentSideStats.safetyAttempts + (isSafetyDecision ? 1 : 0),
    safetiesWon:
      currentSideStats.safetiesWon + (isSafetyDecision && success ? 1 : 0),
    fouls: currentSideStats.fouls + (foulOccurred ? 1 : 0),
  };
  const contextualText = visitStory({actorName:actorIsPlayer?liveMatch.playerName:liveMatch.opponentName,success,foul:foulOccurred,pot:isPotDecision,previousBreak:liveMatch.currentBreak,breakTotal:completedBreakTotal,personalBest:liveMatch.careerBestAtStart,previousMatchBest:liveMatch.playerHighestBreak,player:actorIsPlayer,pointsBefore:actorIsPlayer?liveMatch.playerPoints:liveMatch.opponentPoints,otherPoints:actorIsPlayer?liveMatch.opponentPoints:liveMatch.playerPoints,remaining:getRemainingTablePoints(liveMatch)}) + (success && completedBreakTotal >= 100 && liveMatch.currentBreak < 100 ? ' ' + crowdReaction(liveMatch.atmosphere, actorIsPlayer ? liveMatch.playerName : liveMatch.opponentName, 'century') : '');
  const feedText = buildRealisticVisitFeedText({
    actorName: actorIsPlayer ? liveMatch.playerName : liveMatch.opponentName,
    opponentName: actorIsPlayer
      ? liveMatch.opponentName
      : liveMatch.playerName,
    decision: resolvedDecision,
    foulOccurred,
    foulPoints,
    success,
    scoredPoints,
    previousBreak: liveMatch.currentBreak,
    completedBreakTotal,
    retainedTable,
    tableProgressLabel,
    redsRemaining: nextTableState.redsRemaining,
    deliberateRhythmPressure,
    ballOn: getBallOn(liveMatch.tableState),
  });
  const elapsedIncrement =
    granularity === "shot"
      ? deliberateTempoActive
        ? 2
        : 1
      : deliberateTempoActive
        ? tempoEffects.visitMinutes
        : 4;
  const feedEntry = buildVisitFeedEntry(
    formatLiveClock(liveMatch.timeElapsedMinutes + elapsedIncrement),
    feedText + (contextualText ? " " + contextualText : ""),
    foulOccurred ? "System" : actor,
    foulOccurred
      ? "red"
      : success
        ? actorIsPlayer
          ? "green"
          : "amber"
        : "blue",
  );
  const continuesExistingBreak =
    granularity === "visit" &&
    liveMatch.currentBreak > 0 &&
    liveMatch.feed[0]?.actor === actor;
  const nextFeed = continuesExistingBreak
    ? [
        {
          ...feedEntry,
          id: liveMatch.feed[0].id,
        },
        ...liveMatch.feed.slice(1),
      ]
    : [feedEntry, ...liveMatch.feed];
  const frameClinched =
    (nextRemainingTablePoints === 0 &&
      nextPlayerPoints !== nextOpponentPoints) ||
    nextPlayerPoints > nextOpponentPoints + nextRemainingTablePoints ||
    nextOpponentPoints > nextPlayerPoints + nextRemainingTablePoints ||
    (liveMatch.currentVisit >= 42 && nextPlayerPoints !== nextOpponentPoints);

  const progressedLiveMatch: LiveMatchState = {
    ...liveMatch,
    playerPoints: nextPlayerPoints,
    opponentPoints: nextOpponentPoints,
    currentVisit: liveMatch.currentVisit + (retainedTable ? 0 : 1),
    currentBreak: nextCurrentBreak,
    tableState: nextTableState,
    ballsRemaining: nextBallsRemaining,
    playerAtTable: nextPlayerAtTable,
    shotClock: success && retainedTable ? 22 : 30,
    playerConfidence: nextPlayerConfidence,
    opponentConfidence: nextOpponentConfidence,
    playerFatigue: nextPlayerFatigue,
    opponentFatigue: nextOpponentFatigue,
    playerHighestBreak: actorIsPlayer
      ? Math.max(liveMatch.playerHighestBreak, completedBreakTotal)
      : liveMatch.playerHighestBreak,
    opponentHighestBreak: !actorIsPlayer
      ? Math.max(liveMatch.opponentHighestBreak, completedBreakTotal)
      : liveMatch.opponentHighestBreak,
    playerFifties:
      actorIsPlayer && completedBreakTotal >= 50 && liveMatch.currentBreak < 50
        ? liveMatch.playerFifties + 1
        : liveMatch.playerFifties,
    playerMaximums: liveMatch.playerMaximums === undefined ? undefined : liveMatch.playerMaximums + Number(actorIsPlayer && completedBreakTotal === 147 && liveMatch.currentBreak < 147),
    playerCenturies:
      actorIsPlayer &&
      completedBreakTotal >= 100 &&
      liveMatch.currentBreak < 100
        ? liveMatch.playerCenturies + 1
        : liveMatch.playerCenturies,
    pressureValue: nextPressureValue,
    pressureLabel:
      nextPressureValue >= 78
        ? "High"
        : nextPressureValue >= 58
          ? "Building"
          : "Stable",
    timeElapsedMinutes: liveMatch.timeElapsedMinutes + elapsedIncrement,
    intervalText: isRespottedBlackVisit({
      ...liveMatch,
      playerPoints: nextPlayerPoints,
      opponentPoints: nextOpponentPoints,
      tableState: nextTableState,
      ballsRemaining: nextBallsRemaining,
    } as LiveMatchState)
      ? "Scores are level on the black. The next visit is for the respotted black."
      : frameClinched
        ? "Frame is ready to be closed out."
        : `${getFrameTableSummary(nextTableState)} in ${frameLabel}. ${areSnookersRequired(Math.max(0, nextOpponentPoints - nextPlayerPoints), nextRemainingTablePoints) ? "You now need foul points." : nextPlayerAtTable === liveMatch.playerName ? "You are back in control." : `${liveMatch.opponentName} is back at the table.`}`,
    feed: nextFeed.slice(0, granularity === "shot" ? 120 : 24),
    visitHistory: [visitLogEntry, ...liveMatch.visitHistory].slice(
      0,
      granularity === "shot" ? 160 : 18,
    ),
    playerStats: actorIsPlayer ? updatedSideStats : liveMatch.playerStats,
    opponentStats: actorIsPlayer ? liveMatch.opponentStats : updatedSideStats,
    lastVisitSummary: `${frameLabel} V${liveMatch.currentVisit}: ${visitLogEntry.outcome}${scoredPoints > 0 ? ` (${scoredPoints} pts)` : ""}`,
    status: "In Progress",
  };

  const needsRespottedBlack = isRespottedBlackVisit(progressedLiveMatch);
  return frameClinched && !needsRespottedBlack
    ? resolveCompletedLiveFrame(
        progressedLiveMatch,
        mode === "manual" ? "Played" : "Simmed",
      )
    : progressedLiveMatch;
}

function getLiveMatchTacticalModifiers(
  liveMatch: LiveMatchState,
  mode: LiveMatchResolutionMode,
) {
  if (mode === "simulated") {
    return {
      winChanceModifier: 0,
      volatilityBoost: 0,
      playerBreakBonus: 0,
      opponentBreakPenalty: 0,
      pressureRelief: 0,
      fatigueCost: 2,
      note: "Frame simulated with neutral tactics.",
    };
  }

  let winChanceModifier = 0;
  let volatilityBoost = 0;
  let playerBreakBonus = 0;
  let opponentBreakPenalty = 0;
  let pressureRelief = 0;
  let fatigueCost = 2;
  const notes: string[] = [];

  if (liveMatch.tacticalPlan === "Attack") {
    winChanceModifier += liveMatch.playerConfidence >= 58 ? 4 : 1;
    volatilityBoost += 10;
    playerBreakBonus += 10;
    fatigueCost += 1;
    notes.push("Attacking plan applied.");
  } else if (liveMatch.tacticalPlan === "Safety") {
    winChanceModifier += liveMatch.pressureValue >= 58 ? 4 : 2;
    opponentBreakPenalty += 10;
    pressureRelief += 4;
    notes.push("Safety-first frame plan applied.");
  } else {
    winChanceModifier += 1;
    pressureRelief += 1;
    notes.push("Balanced frame management applied.");
  }

  if (liveMatch.mentalFocus === "Composed") {
    winChanceModifier += Math.max(0, liveMatch.pressureValue - 48) * 0.08;
    pressureRelief += 3;
    notes.push("Composure focus steadied the player.");
  } else if (liveMatch.mentalFocus === "Confident") {
    winChanceModifier +=
      2 +
      Math.max(0, liveMatch.playerConfidence - liveMatch.opponentConfidence) *
        0.05;
    volatilityBoost += 4;
    notes.push("Confidence focus encouraged front-foot play.");
  } else {
    winChanceModifier +=
      liveMatch.playerFrames < liveMatch.opponentFrames ? 4 : 1;
    opponentBreakPenalty += 4;
    notes.push("Counter-punching focus targeted momentum swings.");
  }

  if (liveMatch.tempo === "Quick") {
    winChanceModifier += liveMatch.playerFatigue <= 55 ? 2 : -1;
    playerBreakBonus += 4;
    fatigueCost += 1;
    notes.push("Quick tempo increased urgency.");
  } else if (liveMatch.tempo === "Deliberate") {
    winChanceModifier += liveMatch.opponentConfidence >= 60 ? 2 : 1;
    opponentBreakPenalty += 7;
    pressureRelief += 1;
    fatigueCost += 1;
    notes.push(
      "Deliberate tempo disrupted the opponent's rhythm but cost extra energy.",
    );
  } else {
    winChanceModifier += 1;
    pressureRelief += 2;
    notes.push("Steady tempo reduced chaos.");
  }

  return {
    winChanceModifier,
    volatilityBoost,
    playerBreakBonus,
    opponentBreakPenalty,
    pressureRelief,
    fatigueCost,
    note: notes.join(" "),
  };
}

function resolveCareerSimulationLiveMatch(
  state: GameState,
  tournament: Tournament,
): LiveMatchState {
  let liveMatch = createLiveMatchState(state, tournament);
  if (liveMatch.special?.rules.length) {
    for (let visits = 0; visits < 20000 && liveMatch.status !== 'Completed'; visits++) {
      if (pendingMatchBreak(liveMatch)) liveMatch = resolveSessionBreak(liveMatch, 'recover');
      else liveMatch = advanceLiveVisit(liveMatch, undefined, 'manual');
    }
    if (liveMatch.status !== 'Completed') throw new Error('Special-format match did not finish');
    return liveMatch;
  }
  const frameWinChance = convertMatchWinProbabilityToFrameWinProbability(
    liveMatch.plannedMatchWinChance,
    liveMatch.bestOf === 4 ? 5 : liveMatch.bestOf,
  );
  const resolvedMatch = liveMatch.bestOf === 4
    ? { frameOrder: groupFrameOrder(frameWinChance / 100) }
    : resolveCareerMatchResult(liveMatch.plannedMatchWinChance, liveMatch.framesNeeded);
  let playerFrames = 0;
  let opponentFrames = 0;
  let playerHighestBreak = 0;
  let opponentHighestBreak = 0;
  let playerFifties = 0;
  let playerCenturies = 0;
  let playerMaximums = 0;
  let playerPoints = 0;
  let opponentPoints = 0;
  const frameHistory: FrameScoreRow[] = [];

  for (const playerWonFrame of resolvedMatch.frameOrder) {
    const frameNumber = frameHistory.length + 1;
    const frameOutcome = simulateCareerFrameOutcome(
      playerWonFrame
        ? Math.max(frameWinChance, 50)
        : Math.min(frameWinChance, 50),
      liveMatch.plannedPlayerStrength,
      liveMatch.plannedOpponentStrength,
      playerWonFrame,
    );
    playerPoints = frameOutcome.playerPoints;
    opponentPoints = frameOutcome.opponentPoints;
    if (frameOutcome.playerWonFrame) {
      playerFrames += 1;
    } else {
      opponentFrames += 1;
    }

    playerHighestBreak = Math.max(playerHighestBreak, frameOutcome.playerBreak);
    opponentHighestBreak = Math.max(
      opponentHighestBreak,
      frameOutcome.opponentBreak,
    );
    if (frameOutcome.playerBreak >= 50) playerFifties += 1;
    if (frameOutcome.playerBreak >= 100) playerCenturies += 1;
    if (frameOutcome.playerBreak === 147) playerMaximums += 1;
    frameHistory.push({
      frame: `F${frameNumber}`,
      player: `${playerPoints}`,
      opponent: `${opponentPoints}`,
      winner: frameOutcome.playerWonFrame
        ? liveMatch.playerName
        : liveMatch.opponentName,
    });
    // Quick simulation delegates interval decisions to the conservative rest
    // option, records them once, and preserves the same break/recovery rules.
    liveMatch = { ...liveMatch, playerFrames, opponentFrames, status: playerFrames >= liveMatch.framesNeeded || opponentFrames >= liveMatch.framesNeeded ? 'Completed' : 'In Progress' };
    if (pendingMatchBreak(liveMatch)) liveMatch = resolveSessionBreak(liveMatch, 'recover');
  }

  const pressureValue = clamp(
    38 +
      Math.abs(playerFrames - opponentFrames) * 8 +
      (Math.min(playerFrames, opponentFrames) === liveMatch.framesNeeded - 1
        ? 12
        : 0),
    24,
    96,
  );

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
    playerMaximums,
    pressureValue,
    pressureLabel:
      pressureValue >= 78
        ? "High"
        : pressureValue >= 58
          ? "Building"
          : "Stable",
    timeElapsedMinutes: frameHistory.length * 18,
    intervalText:
      "Career simulation resolved through the baseline match model.",
    framesRemainingText: "Match complete",
    feed: liveMatch.feed,
    momentum: [
      ...liveMatch.momentum,
      { label: "Finish", player: playerFrames, opponent: opponentFrames },
    ].slice(-Math.max(2, liveMatch.bestOf)),
    frameHistory,
    lastFrameMode: "Simmed",
    lastVisitSummary:
      "Career simulation completed through the baseline match model.",
    status: "Completed",
  };
}

export function finalizeLiveMatch(
  state: GameState,
  liveMatch: LiveMatchState,
): GameState {
  const sourceMatchId = liveMatch.sessionId ?? `${state.season}:${liveMatch.tournamentId}:${liveMatch.round}:${liveMatch.opponentName}`;
  if (state.matches.some(m => m.sourceMatchId === sourceMatchId)) return state;
  if (liveMatch.status !== 'Completed') return state;
  const tournament = state.tournaments.find(
    (item) => item.id === liveMatch.tournamentId,
  );
  if (!tournament) {
    return finalizeState(
      { ...state, liveMatch: null },
      "The active live match could not be resolved.",
    );
  }

  const tournamentRounds = getTournamentRounds(tournament);
  const currentRoundIndex = tournamentRounds.indexOf(liveMatch.round);
  const won = liveMatch.playerFrames > liveMatch.opponentFrames;
  const drawn = liveMatch.playerFrames === liveMatch.opponentFrames;
  const groupMatch = isGroupDraw(state.tournamentProgress.draw);
  const groupResult = groupMatch ? applyGroupCompetitionResult(state.tournamentProgress.draw, tournament, liveMatch.round, state.player.fullName, liveMatch.opponentName, liveMatch.playerFrames, liveMatch.opponentFrames, [liveMatch.playerHighestBreak], [liveMatch.opponentHighestBreak]) : null;
  const isFinalRound = currentRoundIndex === tournamentRounds.length - 1;
  const nextRound = groupResult ? groupResult.nextRound : won
    ? (tournamentRounds[currentRoundIndex + 1] ?? null)
    : null;
  const isQSchoolTournament = tournament.type === "Q School";
  const isSeniorTournament = tournament.type === "Senior";
  const isSeniorRegularRankingTournament =
    isSeniorTournament && /seniors tour\s*-\s*event/i.test(tournament.name);
  const awardsRankingPoints =
    isQSchoolTournament ||
    isSeniorRegularRankingTournament ||
    (tournament.rankingValue > 0 && tournament.rankingType !== "None");
  const playerEventComplete = !nextRound;
  const opponentEventComplete = groupMatch ? false : won || !nextRound;
  const opponentPlacementKnown = groupMatch ? false : won || isFinalRound;
  const playerPlacement = groupResult ? groupCompetitionAward(groupResult.draw, tournament, state.player.fullName, getTournamentPlacementAwards) : getTournamentPlacementAwards(
    tournament,
    liveMatch.round,
    won && !nextRound,
  );
  const opponentPlacement = getTournamentPlacementAwards(
    tournament,
    liveMatch.round,
    !won && isFinalRound,
  );
  const qTourOpeningLoss = tournament.type === 'Q Tour' && qTourRegion(tournament) === 'Europe' && !won && state.tournamentProgress.completedRounds.length === 0;
  const protectedOpeningLoss = countsForWorldRanking(tournament) && !won && state.tournamentProgress.completedRounds.length === 0 && (
    getTournamentEntryRound(state, tournament) !== tournamentRounds[0] ||
    (['ukMajor', 'worldChampionshipMain'].includes(resolveTournamentFormat(tournament).id) && (seedingRows(state, tournament, state.competitionTables.world).find(r => r.playerName === state.player.fullName)?.ranking ?? 999) <= 16) ||
    /shoot.?out/i.test(tournament.name) ||
    (/saudi arabia/i.test(tournament.name) && liveMatch.round === 'Round 1')
  );
  const rankingPointsGained = !awardsRankingPoints || protectedOpeningLoss || qTourOpeningLoss
    ? 0
    : isQSchoolTournament
      ? liveMatch.playerFrames
      : isSeniorRegularRankingTournament
        ? liveMatch.playerFrames
        : !playerEventComplete ||
            (isSeniorTournament && tournament.rankingValue <= 0)
          ? 0
          : playerPlacement.rankingPoints;
  const prizeMoneyEarned = isQSchoolTournament
    ? 0
    : playerEventComplete
      ? playerPlacement.prizeMoney
      : 0;
  const opponentQTourOpeningLoss = tournament.type === 'Q Tour' && qTourRegion(tournament) === 'Europe' && won && !state.tournamentProgress.draw.some(r => r.matches.some(m => typeof m.top.score === 'number' && typeof m.bottom.score === 'number' && (m.top.name === liveMatch.opponentName && m.top.score > m.bottom.score || m.bottom.name === liveMatch.opponentName && m.bottom.score > m.top.score)));
  const opponentPointsGained = !awardsRankingPoints || opponentQTourOpeningLoss
    ? 0
    : isQSchoolTournament
      ? liveMatch.opponentFrames
      : isSeniorRegularRankingTournament
        ? liveMatch.opponentFrames
        : !opponentPlacementKnown ||
            (isSeniorTournament && tournament.rankingValue <= 0)
          ? 0
          : opponentPlacement.rankingPoints;
  const opponentPrizeMoney = isQSchoolTournament
    ? 0
    : opponentPlacementKnown
      ? opponentPlacement.prizeMoney
      : 0;
  const confidenceChange = drawn ? 0 : matchConfidenceChange(state.player.confidence, won, liveMatch.plannedMatchWinChance, isFinalRound, (depthOf(state).mediaExpectationsUntil ?? '') > state.currentDate);
  const sessionRecovery = Math.min(20, (liveMatch.sessions?.completedBreaks ?? []).reduce((n, b) => n + (b.kind === 'overnight' ? 10 : b.kind === 'session' ? 5 : 2) + (b.choice === 'recover' ? 2 : 0), 0));
  const fatigueChange = clamp(
    Math.round(liveMatch.frameHistory.length * 1.5) + (won ? 2 : 1),
    4,
    16,
  ) - sessionRecovery;
  const playerWonTournament = groupResult ? groupCompetitionChampion(groupResult.draw, tournament) === state.player.fullName && !nextRound : won && isFinalRound;
  const opponentWonTournament = groupResult ? groupCompetitionChampion(groupResult.draw, tournament) === liveMatch.opponentName && !nextRound : !won && isFinalRound;
  const awardsCareerTitle = tournamentAwardsCareerTitle(tournament);
  const playerWonTitle = playerWonTournament && awardsCareerTitle;
  const opponentWonTitle = opponentWonTournament && awardsCareerTitle;
  const rankingRows = getCompetitionRowsForTournament(state, tournament);
  const opponentRow = rankingRows.find(
    (row) => row.playerName === liveMatch.opponentName,
  );
  const tournamentClass = getTournamentCircuitClass(tournament);
  const equipmentProfile = getEquipmentPerformanceProfile(state.equipment);
  const latestMatch: Match = {
    televised: tournament.televisedRounds?.includes(liveMatch.round) ?? false,
    sourceMatchId,
    season: state.season,
    id: `match-${Date.now()}-${tournament.id}-${liveMatch.round.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${state.history.matchLog.length + 1}`,
    tournamentId: tournament.id,
    playedOn: state.currentDate,
    round: liveMatch.round,
    bestOf: liveMatch.bestOf,
    playerName: state.player.fullName,
    opponentName: liveMatch.opponentName,
    opponentId: uniqueOpponentId(state, liveMatch.opponentName),
    playerTactic: liveMatch.tacticalPlan,
    playerRanking:
      state.player.amateurRanking ?? state.player.worldRanking ?? 0,
    opponentRanking: liveMatch.opponentRanking,
    playerFrames: liveMatch.playerFrames,
    opponentFrames: liveMatch.opponentFrames,
    result: drawn ? "Drawn" : won ? "Won" : "Lost",
    highestBreak: liveMatch.playerHighestBreak,
    opponentHighestBreak: liveMatch.opponentHighestBreak,
    fifties: liveMatch.playerFifties,
    centuries: liveMatch.playerCenturies,
    maximumBreaks: liveMatch.playerMaximums,
    potSuccess: getRealisticMatchSuccessRate(
      liveMatch.playerVisitProfile,
      "pot",
      liveMatch.playerStats,
      liveMatch.playerConfidence,
      liveMatch.playerFatigue,
    ),
    longPotSuccess: getRealisticMatchSuccessRate(
      liveMatch.playerVisitProfile,
      "long",
      liveMatch.playerStats,
      liveMatch.playerConfidence,
      liveMatch.playerFatigue,
    ),
    safetySuccess: getRealisticMatchSuccessRate(
      liveMatch.playerVisitProfile,
      "safety",
      liveMatch.playerStats,
      liveMatch.playerConfidence,
      liveMatch.playerFatigue,
    ),
    fouls: liveMatch.playerStats.visits > 0 ? liveMatch.playerStats.fouls : clamp(
      Math.round(Math.random() * 4 - equipmentProfile.miscueReduction / 2),
      0,
      5,
    ),
    confidenceChange,
    fatigueChange,
    prizeMoneyEarned,
    rankingPointsGained,
    plannedWinChance: liveMatch.plannedMatchWinChance,
    winProbability: liveMatch.plannedMatchWinChance,
    playerStrength: liveMatch.plannedPlayerStrength,
    opponentStrength: liveMatch.plannedOpponentStrength,
    opponentRankBand: getOpponentRankBand(
      liveMatch.opponentRanking,
      tournamentClass,
    ),
    tournamentClass,
    frameHistory: liveMatch.frameHistory,
  };
  latestMatch.objectives = assessMatchObjectives(liveMatch.objectives, latestMatch);
  const completedObjectives = latestMatch.objectives.length > 0 && latestMatch.objectives.every(o => o.achieved);
  const previousRival = getRivalry(state, liveMatch.opponentName);
  const rivalryRebound = Boolean(won && previousRival?.rivalry && previousRival.recent.at(-1) === 'L');
  const confidenceAfterResult = clamp(state.player.confidence + confidenceChange, 25, 99);
  const developmentBonus = Math.min(99 - confidenceAfterResult, Number(completedObjectives) + Number(rivalryRebound));
  latestMatch.confidenceChange = confidenceAfterResult + developmentBonus - state.player.confidence;
  latestMatch.debrief = { ...matchDebrief(state, latestMatch), confidenceBonus: developmentBonus,
    bonusReason: [completedObjectives ? 'Personal objectives completed' : '', rivalryRebound ? 'A winning response in your rivalry' : ''].filter(Boolean).join(' · ') };
  const normalizedSponsors = normalizeSponsors(state.sponsors);
  const careerCenturies =
    state.history.tournamentHistory.reduce(
      (sum, entry) => sum + entry.centuries,
      0,
    ) + latestMatch.centuries;
  const sponsorAwards = normalizedSponsors.flatMap((sponsor) => {
    const award = calculateSponsorMatchBonus(
      sponsor,
      tournament,
      latestMatch,
      state.player.worldRanking ?? null,
      careerCenturies,
    );
    return award && !(sponsor.bonusesPaid ?? []).includes(award.key)
      ? [{ sponsor, award }]
      : [];
  });
  const sponsorBonusTotal = sponsorAwards.reduce(
    (sum, entry) => sum + entry.award.amount,
    0,
  );
  const sponsorsWithBonuses = normalizedSponsors.map((sponsor) => {
    const awards = sponsorAwards.filter(
      (entry) => entry.sponsor.id === sponsor.id,
    );
    if (awards.length === 0) return sponsor;
    return {
      ...sponsor,
      bonusesPaid: [
        ...(sponsor.bonusesPaid ?? []),
        ...awards.map((entry) => entry.award.key),
      ],
      totalBonusPaid:
        (sponsor.totalBonusPaid ?? 0) +
        awards.reduce((sum, entry) => sum + entry.award.amount, 0),
    };
  });
  const commercialRanking = sponsorRanking(state);
  const sponsorReviews = sponsorsWithBonuses.map(sponsor => reviewSponsorPerformance(sponsor, {
    matchId: sourceMatchId, result: drawn ? "Drawn" : won ? "Won" : "Lost", rank: commercialRanking.rank, rankingLabel: commercialRanking.label,
    playerMatchRank: latestMatch.playerRanking, opponentRank: liveMatch.opponentRanking, bestOf: liveMatch.bestOf,
    competitive: !/exhibition|pro.am/i.test(tournament.name) && tournament.type !== 'Exhibition',
  }));
  const sponsorsAfterMatch = sponsorReviews.filter(review => review.notice !== 'terminated').map(review => review.sponsor);
  const performanceMessages = sponsorReviews.flatMap(({ sponsor, notice }) => !notice ? [] : [createInboxMessage({
    sender: sponsor.name,
    subject: notice === 'terminated' ? 'Sponsorship ended after performance review' : notice === 'warning' ? 'Sponsor performance warning' : notice === 'recovered' ? 'Sponsor confidence restored' : 'Sponsor concerned about results',
    preview: notice === 'terminated' ? `${sponsor.name} ended the deal after the six-match recovery period with satisfaction below 25/100. The ${sponsor.slot} slot is free and £${sponsor.monthlyValue}/month has been removed.` : notice === 'warning' ? `Satisfaction is ${Math.round(sponsor.performance!.satisfaction)}/100. You have at least six further competitive matches to recover. Stay at 25 or above to avoid cancellation; reach 50 to clear the warning.` : notice === 'recovered' ? 'Satisfaction is back to 50 or above. Your performance warning has been cleared.' : 'Satisfaction has fallen below 50/100. Wins and maintaining your agreed ranking help rebuild confidence. There is no immediate cancellation.',
    priority: notice === 'warning' || notice === 'terminated' ? 'High' : 'Medium', actionLabel: 'Review Sponsors', actionRoute: '/sponsorship',
  }, 'Today')]);

  const equipmentAfterMatch = applyEquipmentMatchWear(
    state.equipment,
    liveMatch.frameHistory.length,
    normalizedSponsors.some((sponsor) => sponsor.perk === "Equipment"),
  );
  const activeCueId = state.equipment.currentCueId;
  const equipmentWear = activeCueId
    ? Math.max(
        0,
        getCueState(state.equipment, activeCueId).condition -
          getCueState(equipmentAfterMatch, activeCueId).condition,
      )
    : 0;
  const familiarityGained = activeCueId
    ? Math.max(
        0,
        getCueState(equipmentAfterMatch, activeCueId).familiarity -
          getCueState(state.equipment, activeCueId).familiarity,
      )
    : 0;
  latestMatch.sponsorBonusEarned = sponsorBonusTotal;
  latestMatch.equipmentWear = equipmentWear;
  latestMatch.familiarityGained = familiarityGained;
  latestMatch.strainImpact = Math.round(
    state.trainingCondition.strain / 25 +
      (state.trainingCondition.injuryWeeks > 0 ? 6 : 0),
  );
  const equipmentWarnings = [
    equipmentAfterMatch.currentChalkId &&
    (equipmentAfterMatch.chalkStock[equipmentAfterMatch.currentChalkId] ?? 0) <=
      1
      ? createInboxMessage(
          {
            sender: "Equipment Manager",
            subject: "Chalk stock running low",
            preview:
              "Only one usable chalk unit remains. Buy another pack before it blocks tournament entry.",
            priority: "High",
            actionLabel: "Buy Chalk",
            actionRoute: "/equipment/chalk-tips",
          },
          "Today",
        )
      : null,
    activeCueId &&
    getCueState(equipmentAfterMatch, activeCueId).tipCondition <= 30
      ? createInboxMessage(
          {
            sender: "Equipment Manager",
            subject: "Cue tip needs replacing",
            preview: `Tip condition is ${getCueState(equipmentAfterMatch, activeCueId).tipCondition}%. Fit a replacement before it reaches zero.`,
            priority: "High",
            actionLabel: "Replace Tip",
            actionRoute: "/equipment/chalk-tips",
          },
          "Today",
        )
      : null,
    activeCueId && getCueState(equipmentAfterMatch, activeCueId).condition <= 35
      ? createInboxMessage(
          {
            sender: "Equipment Manager",
            subject: "Cue maintenance required",
            preview: `Cue condition is ${getCueState(equipmentAfterMatch, activeCueId).condition}%. Service it to recover consistency.`,
            priority: "High",
            actionLabel: "Open Maintenance",
            actionRoute: "/equipment/maintenance",
          },
          "Today",
        )
      : null,
  ].filter((message): message is InboxMessage => Boolean(message));
  const completedRounds = [
    ...state.tournamentProgress.completedRounds,
    {
      round: liveMatch.round,
      opponentName: liveMatch.opponentName,
      result: latestMatch.result,
      playerFrames: liveMatch.playerFrames,
      opponentFrames: liveMatch.opponentFrames,
    },
  ];
  const drawAfterMatch = groupResult?.draw ?? applyCompletedMatchToTournamentDraw(
    state.tournamentProgress.draw,
    tournament,
    liveMatch.round,
    state.player.fullName,
    liveMatch.playerFrames,
    liveMatch.opponentFrames,
  );
  const completedEventDraw =
    nextRound
      ? drawAfterMatch
      : completeRemainingTournamentDraw(
          drawAfterMatch,
          tournament,
          liveMatch.round,
          state.player.fullName,
        );
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
    wentToDecider:
      Math.min(liveMatch.playerFrames, liveMatch.opponentFrames) ===
      liveMatch.framesNeeded - 1,
    pressurePeak: liveMatch.pressureValue,
    prizeMoney: prizeMoneyEarned,
    rankingPoints: rankingPointsGained,
  };
  const playerAfterMatch: Player = {
    ...state.player,
    cash: state.player.cash + prizeMoneyEarned + sponsorBonusTotal,
    confidence: clamp(state.player.confidence + latestMatch.confidenceChange, 25, 99),
    fatigue: clamp(state.player.fatigue + fatigueChange, 0, 100),
    morale: clamp(state.player.morale + (drawn ? 0 : won ? 3 : -2), 0, 100),
    form: [...state.player.form.slice(-9), drawn ? "D" : won ? "W" : "L"],
    reputation: clamp(
      state.player.reputation + (won ? (nextRound ? 2 : 4) : 0),
      0,
      100,
    ),
  };
  const qSchoolCardClinched =
    isQSchoolTournament &&
    won &&
    liveMatch.round === getQSchoolCardWinningRound(tournament);
  const playoffCardClinched =
    playerWonTournament && tournament.name.toLowerCase().includes("play-off");
  const directAmateurCardClinched = isDirectAmateurTourCardRoute(tournament) && (
    playerWonTournament && !securedPathwayCards(state, tournament.startDate).has(state.player.fullName) ||
    !won && isFinalRound && /ebsa/i.test(tournament.name) && securedPathwayCards(state, tournament.startDate).has(liveMatch.opponentName)
  );
  const directTourCardSource: Exclude<TourCardSource, null> | null =
    qSchoolCardClinched
      ? "Q School"
      : playoffCardClinched
        ? "Q Tour"
        : directAmateurCardClinched
          ? "Federation Route"
          : null;
  const tourCardClinched = directTourCardSource != null;
  let competitionTables = updateCompetitionTables(
    state.competitionTables,
    tournament,
    playerAfterMatch,
    liveMatch.opponentName,
    opponentRow?.nation ?? "INT",
    rankingPointsGained,
    prizeMoneyEarned,
    opponentPointsGained,
    opponentPrizeMoney,
    won,
    playerWonTitle,
    opponentWonTitle,
    playerEventComplete,
    opponentEventComplete,
    playerWonTournament
      ? awardsCareerTitle
        ? "Champion"
        : "Qualified"
      : nextRound
        ? `Advanced to ${nextRound}`
        : `Lost in ${liveMatch.round}`,
  );
  if (drawn) {
    for (const key of getCompetitionKeysForTournament(tournament)) competitionTables[key] = competitionTables[key].map(row => {
      const before = state.competitionTables[key].find(r => r.playerName === row.playerName);
      return before && [state.player.fullName, liveMatch.opponentName].includes(row.playerName) ? { ...row, wins: before.wins, losses: before.losses } : row;
    });
  }
  if (!nextRound) {
    competitionTables = updateCompetitionTablesFromCpuDraw(
      competitionTables,
      state.competitionTables,
      state.tournamentProgress.rankingBaseline,
      tournament,
      completedEventDraw,
      playerAfterMatch,
      completedRounds.map((round) => round.opponentName),
    );
  }
  const careerSystemsSeed: CareerSystemsState = {
    ...state.careerSystems,
    qTour: {
      ...state.careerSystems.qTour,
      playOffWinner:
        playerWonTournament && tournament.name.toLowerCase().includes("play-off")
          ? state.player.fullName
          : state.careerSystems.qTour.playOffWinner,
      directCardAwarded:
        playerWonTournament && tournament.name.toLowerCase().includes("play-off")
          ? true
          : state.careerSystems.qTour.directCardAwarded,
    },
    qSchool: {
      ...state.careerSystems.qSchool,
      campaignsEntered:
        state.careerSystems.qSchool.campaignsEntered +
        (tournament.type === "Q School" &&
        liveMatch.round === tournamentRounds[0] &&
        !state.history.tournamentHistory.some(
          (entry) =>
            entry.season === state.season && entry.eventType === "Q School",
        )
          ? 1
          : 0),
      eventWins:
        state.careerSystems.qSchool.eventWins +
        (tournament.type === "Q School" && playerWonTournament ? 1 : 0),
      repeatedFailures:
        tournament.type === "Q School" && !won && nextRound == null
          ? state.careerSystems.qSchool.repeatedFailures + 1
          : tournament.type === "Q School" &&
              (playerWonTournament || qSchoolCardClinched)
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
  };
  const careerSystems = syncCareerSystems({
    competitionTables,
    player: playerAfterMatch,
    careerSystems: careerSystemsSeed,
    history: state.history,
  });
  const rankings = competitionTables[
    getPrimaryCompetitionKey({ player: playerAfterMatch, careerSystems })
  ].map((row) => ({ ...row }));
  const worldPlayers =
    nextRound
      ? state.worldPlayers
      : updateWorldPlayersFromCompletedDraw(
          state.worldPlayers,
          competitionTables,
          completedEventDraw,
          state.player.fullName,
        );

  const nextState = finalizeState(
    {
      ...state,
      player: playerAfterMatch,
      equipment: equipmentAfterMatch,
      sponsors: sponsorsAfterMatch,
      finance: {
        ...state.finance,
        ledger: [
          ...sponsorAwards.map(({ sponsor, award }, index) => ({
            id: `sponsor-bonus-${latestMatch.id}-${index}`,
            date: state.currentDate,
            description: `${sponsor.name}: ${award.reason}`,
            category: "Sponsorship Bonus",
            amount: award.amount,
            type: "Income" as const,
          })),
          ...state.finance.ledger,
        ].slice(0, 200),
      },
      matches: [latestMatch, ...state.matches].slice(0, 24),
      rankings,
      competitionTables,
      worldPlayers,
      careerSystems,
      rollingRankings: playerEventComplete ? recordRankingEvent(state, tournament, completedEventDraw, getTournamentPlacementAwards).rollingRankings : state.rollingRankings,
      tournaments: state.tournaments.map((item) =>
        item.id === tournament.id
          ? {
              ...item,
              status: (nextRound
                ? "Entered"
                : "Completed") as Tournament["status"],
            }
          : item,
      ),
      tournamentProgress:
        nextRound
          ? {
              tournamentId: tournament.id,
              currentRound: nextRound,
              draw: drawAfterMatch,
              rankingBaseline: state.tournamentProgress.rankingBaseline,
              completedRounds,
            }
          : {
              tournamentId: tournament.id,
              currentRound: null,
              draw: completedEventDraw,
              rankingBaseline: state.tournamentProgress.rankingBaseline,
              completedRounds,
            },
      liveMatch,
      inbox: [
        ...equipmentWarnings,
        ...performanceMessages,
        ...sponsorAwards.map(({ sponsor, award }) =>
          createInboxMessage(
            {
              sender: "Commercial Team",
              subject: `${sponsor.name} bonus paid`,
              preview: `${award.reason} triggered a £${award.amount.toLocaleString("en-GB")} performance bonus. The payment is now in your finance ledger.`,
              priority: "High",
              actionLabel: "Open Finance",
              actionRoute: "/finance",
            },
            "Today",
          ),
        ),
        ...(nextRound
          ? [
              createInboxMessage(
                {
                  sender: "Tournament Office",
                  subject: `Win at ${tournament.name}`,
                  preview: `${state.player.fullName} ${drawn ? "drew with" : won ? "beat" : "lost to"} ${liveMatch.opponentName} ${liveMatch.playerFrames}-${liveMatch.opponentFrames} in the ${liveMatch.round}. Prize: £${prizeMoneyEarned}. Ranking points: ${rankingPointsGained}. Next round: ${nextRound}.`,
                  priority: "High",
                  actionLabel: "Continue Tournament",
                  actionRoute: "/tournaments/hub",
                },
                "Today",
              ),
            ]
          : []),
        ...state.inbox,
      ].slice(0, 18),
      history: {
        ...state.history,
        legacy: recordLegacyMatch(careerLegacyOf(state), latestMatch, playerWonTitle ? {
          id: state.season + ':' + tournament.id, tournamentId: tournament.id, name: tournament.name,
          season: state.season, date: state.currentDate, category: tournament.eventClass ?? tournament.type,
          rankingType: tournament.rankingType, circuit: tournament.tourCircuit ?? tournament.type, opponent: liveMatch.opponentName,
          score: liveMatch.playerFrames + '–' + liveMatch.opponentFrames, prizeMoney: playerPlacement.prizeMoney,
        } : undefined),
        matchLog: appendMatchLog(state.history.matchLog, matchLogEntry),
        tournamentHistory: upsertTournamentHistoryEntry(
          state.history.tournamentHistory,
          synchronizeTournamentHistoryEntry(tournament, {
            ...(state.history.tournamentHistory.find(
              (entry) =>
                entry.id ===
                getTournamentHistoryId(state.season, tournament.id),
            ) ?? createTournamentHistoryEntry(tournament, state.season)),
            status: nextRound ? "In Progress" : "Completed",
            sponsorBonusesPaid: (state.history.tournamentHistory.find(h=>h.tournamentId===tournament.id && h.startDate===tournament.startDate)?.sponsorBonusesPaid ?? state.matches.filter(m=>m.tournamentId===tournament.id && (m.season??state.season)===state.season).reduce((n,m)=>n+(m.sponsorBonusEarned??0),0)) + sponsorBonusTotal,
            result: playerWonTournament ? "Winner" : groupMatch ? (nextRound ? `Group play continues · ${nextRound}` : `Eliminated in ${liveMatch.round}`) : won
              ? tourCardClinched && nextRound
                ? `Advanced to ${nextRound} · Tour card secured`
                : nextRound
                  ? `Advanced to ${nextRound}`
                  : "Winner"
              : `Lost in ${liveMatch.round}`,
            rounds: completedRounds.map(
              (round) =>
                `${round.round}: ${round.result} ${round.playerFrames}-${round.opponentFrames}`,
            ),
            prizeMoney:
              (state.history.tournamentHistory.find(
                (entry) =>
                  entry.id ===
                  getTournamentHistoryId(state.season, tournament.id),
              )?.prizeMoney ?? 0) + prizeMoneyEarned,
            rankingPoints:
              (state.history.tournamentHistory.find(
                (entry) =>
                  entry.id ===
                  getTournamentHistoryId(state.season, tournament.id),
              )?.rankingPoints ?? 0) + rankingPointsGained,
            highestBreak: Math.max(
              state.history.tournamentHistory.find(
                (entry) =>
                  entry.id ===
                  getTournamentHistoryId(state.season, tournament.id),
              )?.highestBreak ?? 0,
              latestMatch.highestBreak,
            ),
            centuries:
              (state.history.tournamentHistory.find(
                (entry) =>
                  entry.id ===
                  getTournamentHistoryId(state.season, tournament.id),
              )?.centuries ?? 0) + latestMatch.centuries,
            fatigueChange:
              (state.history.tournamentHistory.find(
                (entry) =>
                  entry.id ===
                  getTournamentHistoryId(state.season, tournament.id),
              )?.fatigueChange ?? 0) + fatigueChange,
            reward: tourCardClinched
              ? "Two-year tour card"
              : state.history.tournamentHistory.find(
                  (entry) =>
                    entry.id ===
                    getTournamentHistoryId(state.season, tournament.id),
                )?.reward,
            bracket: completedEventDraw,
            roundResults: completedRounds,
          }),
        ),
      },
    },
    nextRound
      ? `${drawn ? "Drew" : won ? "Won" : "Lost"} ${liveMatch.playerFrames}-${liveMatch.opponentFrames} at ${tournament.name}. Next match: ${nextRound}.`
      : groupMatch
        ? `Group complete at ${tournament.name}. You did not qualify from ${liveMatch.round}.`
        : won
        ? isAttachedQualifying(tournament) ? `Qualified for ${tournament.name.replace(/\s+Qualifying.*$/i, "")}. Your main-draw place is secured.` : `Won the ${liveMatch.round} at ${tournament.name} and took the title.`
        : `Lost in the ${liveMatch.round} at ${tournament.name}.`,
    `${tournament.name} ${liveMatch.round}`,
  );

  const completedMatchState: GameState = {
    ...nextState,
    liveMatch: {
      ...liveMatch,
      status: "Completed" as const,
    },
  };
  if (nextRound) return completedMatchState;

  const previousRank =
    state.rankings.find((row) => row.playerName === state.player.fullName)
      ?.ranking ??
    state.player.worldRanking ??
    state.player.amateurRanking;
  const currentRank =
    nextState.rankings.find((row) => row.playerName === state.player.fullName)
      ?.ranking ??
    nextState.player.worldRanking ??
    nextState.player.amateurRanking;
  const rankingMovement =
    previousRank && currentRank ? previousRank - currentRank : 0;
  const eventFinance = eventFinancialReport(completedMatchState, tournament);
  const qualification = qualificationReport(completedMatchState, tournament);
  const nextTournament = getNextEligibleTournament(completedMatchState);
  const finish = qualification ? `Qualified for ${qualification.mainEventName}` : playerWonTournament ? "Winner" : groupMatch ? `Eliminated in ${liveMatch.round}` : `Lost in ${liveMatch.round}`;
  const rankingSummary = currentRank
    ? `${nextState.player.rankingLabel} #${currentRank}${rankingMovement === 0 ? " (no change)" : ` (${rankingMovement > 0 ? "up" : "down"} ${Math.abs(rankingMovement)})`}`
    : `${nextState.player.rankingLabel} unchanged`;

  return finalizeState(
    {
      ...completedMatchState,
      inbox: [
        ...(nextTournament
          ? [
              createTournamentInvitationMessage(
                nextTournament,
                completedMatchState.currentDate,
                "post-event",
              ),
            ]
          : []),
        createInboxMessage(
          {
            sender: "Tournament Office",
            subject: `Post-event report: ${tournament.name}`,
            eventFinance,
            qualificationReport: qualification,
            preview: `${finish} after a ${latestMatch.playerFrames}-${latestMatch.opponentFrames} result. ${qualification ? qualification.explanation : "Review the performance, ranking and financial outcome below."}`,
            priority: won ? "High" : "Medium",
            actionLabel: "View Completed Draw",
            actionRoute: `/tournaments/draw?tournament=${encodeURIComponent(tournament.id)}`,
            summary: [
              {
                label: "Tournament finish",
                value: finish,
                detail: `${latestMatch.playerFrames}-${latestMatch.opponentFrames} against ${latestMatch.opponentName}`,
                tone: won ? "positive" : "negative",
              },
              {
                label: rankingSummary.split(" #")[0],
                value: currentRank ? `#${currentRank}` : "Unranked",
                detail:
                  rankingMovement === 0
                    ? "No movement"
                    : `${rankingMovement > 0 ? "Up" : "Down"} ${Math.abs(rankingMovement)} place${Math.abs(rankingMovement) === 1 ? "" : "s"}`,
                tone:
                  rankingMovement > 0
                    ? "positive"
                    : rankingMovement < 0
                      ? "negative"
                      : "neutral",
              },
              {
                label: "Pot success",
                value: `${latestMatch.potSuccess}%`,
                tone: latestMatch.potSuccess >= 80 ? "positive" : "warning",
              },
              {
                label: "Safety success",
                value: `${latestMatch.safetySuccess}%`,
                tone: latestMatch.safetySuccess >= 70 ? "positive" : "warning",
              },
              {
                label: "Highest break",
                value: `${latestMatch.highestBreak}`,
                tone: latestMatch.highestBreak >= 50 ? "positive" : "neutral",
              },
              ...financialSummary(eventFinance),
            ],
          },
          "Today",
        ),
        ...completedMatchState.inbox,
      ].slice(0, 18),
    },
    nextState.lastAction,
  );
}

function recalculateState(
  state: GameState,
  lastAction = state.lastAction,
): GameState {
  state = reconcileFirstWeekGuide(enrichTournamentMessages(recordAttributeHistory(state)));
  state = rebuildRollingRankings(initializeRollingRankings(state), state.currentDate, false);
  state = captureVictoryMessages(capturePostEventRankings(state));
  const coachContracts = normalizeCoachContracts(
    state.coachContracts,
    state.coaches,
  ).filter((contract) => contract.weeksRemaining > 0);
  const coachCost = getCoachCost(coachContracts);
  const sponsorWeeklyIncome = getSponsorWeeklyIncome(state.sponsors);
  const activeFacility = state.equipment.currentTableId
    ? (tableSetupCatalog.find(
        (facility) => facility.id === state.equipment.currentTableId,
      ) ?? null)
    : null;
  const facilityWeeklyRental = activeFacility
    ? Math.round(activeFacility.monthlyRental / 4)
    : 0;
  const weeklyCashFlow =
    state.finance.baseCashFlow +
    sponsorWeeklyIncome -
    coachCost -
    facilityWeeklyRental - trainingBaseCost(state) - overseasWeeklyCost(state);
  let competitionTables = COMPETITION_TABLE_KEYS.reduce<CompetitionTablesState>(
    (tables, key) => ({
      ...tables,
      [key]: rerankCompetitionRows(
        state.competitionTables[key] ?? [],
        state.player.fullName,
      ),
    }),
    state.competitionTables,
  );
  competitionTables = ensurePlayerInCompetitionTable(
    {
      player: state.player,
      careerSystems: state.careerSystems,
      competitionTables,
      worldPlayers: state.worldPlayers,
      tournaments: state.tournaments,
    },
    "world",
  );
  competitionTables = ensurePlayerInCompetitionTable(
    {
      player: state.player,
      careerSystems: state.careerSystems,
      competitionTables,
      worldPlayers: state.worldPlayers,
      tournaments: state.tournaments,
    },
    "oneYear",
  );
  competitionTables = removeOveragePlayerFromYouthTable(
    competitionTables,
    state.player,
  );
  competitionTables = rebuildRollingRankings({ ...state, competitionTables }, state.currentDate, false).competitionTables;
  const careerSystems = syncCareerSystems({
    competitionTables,
    player: state.player,
    careerSystems: state.careerSystems,
    history: state.history,
  });
  const primaryCompetitionKey = getPrimaryCompetitionKey({
    player: state.player,
    careerSystems,
  });
  const activeRankings = competitionTables[primaryCompetitionKey].map(
    (row) => ({ ...row }),
  );
  const nextEvent = getNextEligibleTournament({
    ...state,
    rankings: activeRankings,
    competitionTables,
    careerSystems,
  });
  const activePlayerRow = activeRankings.find(
    (row) => row.playerName === state.player.fullName,
  );
  const playerWorldRow = competitionTables.world.find(
    (row) => row.playerName === state.player.fullName,
  );
  const playerSeniorRow = competitionTables.senior.find(
    (row) => row.playerName === state.player.fullName,
  );
  const normalizedInbox = normalizeInboxMessages(state.inbox);
  const unreadCount = Math.min(
    99,
    normalizedInbox.filter((message) => !message.read).length,
  );
  const retired = careerSystems.lateCareer.retired;
  const player = {
    ...state.player,
    cash: state.player.cash,
    cashFlow: weeklyCashFlow,
    worldRanking: playerWorldRow?.ranking ?? state.player.worldRanking,
    amateurRanking:
      retired ||
      primaryCompetitionKey === "senior" ||
      primaryCompetitionKey === "world"
        ? null
        : (activePlayerRow?.ranking ?? state.player.amateurRanking),
    seniorRanking: playerSeniorRow?.ranking ?? state.player.seniorRanking,
    rankingLabel: retired
      ? "Retired"
      : getRankingLabelForCompetitionKey(primaryCompetitionKey),
    careerPhase: getCareerPhaseFromSystems(state.player, careerSystems),
    competitiveStatus: getCareerStageFromSystems(
      state.player,
      careerSystems,
      state.history,
    ),
    careerStage: getCareerStageFromSystems(
      state.player,
      careerSystems,
      state.history,
    ),
    nextEvent: nextEvent?.name ?? "No eligible event",
    daysUntilEvent: nextEvent
      ? daysUntil(nextEvent.startDate, state.currentDate)
      : 0,
    inboxCount: unreadCount,
    notificationCount: unreadCount,
  };

  return announceSeasonTourChanges(reconcileSponsorMarket({
    ...state,
    inbox: normalizedInbox,
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
    sponsors: normalizeSponsors(state.sponsors).filter(
      (sponsor) => sponsor.weeksRemaining > 0,
    ).map(sponsor => ({ ...sponsor, performance: sponsorPerformance(sponsor, sponsorRanking({ player, rankings: activeRankings }).rank, player.rankingLabel) })),
    lastAction,
  }));
}

export function createStarterState(): GameState {
  const worldSeed = createWorldSeed();
  const starterPlayer: Player = {
    ...starterPlayerProfile,
    personalityTraits: buildPersistedPersonalityTraits(
      starterPlayerProfile.personalityTraits,
      starterPlayerProfile.playingStyle,
    ),
  };
  const starterCoachContracts = buildLegacyCoachContracts(
    coachCatalog[0]?.id ?? null,
    coachCatalog,
    19,
  );
  const competitionTables = buildCompetitionTables(
    starterRankings,
    starterPlayer,
    { worldSeed },
  );
  const careerSystems = syncCareerSystems({
    competitionTables,
    player: starterPlayer,
    careerSystems: createEmptyCareerSystems(),
  });

  const baseState: GameState = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    worldSeed,
    currentDate: "2026-05-11",
    season: "2026/27",
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
      budgetTargets: {},
      ledger: [],
    },
    tournaments: buildTournamentScheduleForSeason(2026),
    matches: starterMatches.map((match) => ({ ...match })),
    rankings: competitionTables.qTour.map((row) => ({ ...row })),
    competitionTables,
    worldPlayers: buildWorldPlayersFromTables(competitionTables, starterPlayer),
    careerSystems,
    sponsors: starterSponsors.map((sponsor) => ({ ...sponsor })),
    sponsorOffers: [],
    inbox: normalizeInboxMessages(
      starterInboxMessages.map((message) => ({ ...message })),
    ),
    travel: createEmptyTravelState(),
    maintenance: {
      history: starterMaintenanceHistory.map((item) => ({ ...item })),
    },
    tournamentProgress: createEmptyTournamentProgress(),
    liveMatch: null,
    history: createEmptyHistory(),
    seasonReview: null,
    coachContracts: starterCoachContracts,
    trainingPlan: [],
    trainingAppliedWeek: null,
    trainingCondition: {
      rollingLoad: 0,
      strain: 0,
      injuryWeeks: 0,
      burnout: 0,
      seasonStartAttributes: deepCloneAttributes(starterAttributes),
    },
    health: { activeIssue: null, history: [] },
    lastAction: "Career loaded from the starter save.",
  };

  baseState.attributeHistory = initialAttributeHistory(baseState);
  baseState.trainingPlan = buildAutoTrainingPlanFromState(baseState);

  return withHistorySnapshot(
    recalculateState(repairGameState(baseState), baseState.lastAction),
    "Starter Save",
  );
}

export function createNewCareerState(config?: NewCareerConfig): GameState {
  const worldSeed = createWorldSeed();
  const selectedBackground =
    createPlayerBackgroundCatalog.find(
      (background) => background.id === config?.backgroundId,
    ) ??
    createPlayerBackgroundCatalog[1] ??
    createPlayerBackgroundCatalog[0];
  const selectedStartingLevel = getValidatedStartingLevel(
    createPlayerStartingLevelCatalog,
    config?.age ?? createPlayerIdentitySeed.age,
    config?.startingLevelId,
  );
  const careerConfig: NewCareerConfig = {
    fullName: config?.fullName?.trim() || createPlayerIdentitySeed.name,
    nationality: config?.nationality || createPlayerIdentitySeed.nationality,
    age: config?.age ?? createPlayerIdentitySeed.age,
    dateOfBirth: config?.dateOfBirth,
    handedness:
      config?.handedness ??
      (createPlayerIdentitySeed.handedness as Player["handedness"]),
    cueStyle: config?.cueStyle || createPlayerIdentitySeed.cueStyle,
    playingStyle: config?.playingStyle || createPlayerIdentitySeed.playingStyle,
    personalityArchetype:
      config?.personalityArchetype ||
      createPlayerIdentitySeed.personalityArchetype,
    sliders: config?.sliders?.length
      ? config.sliders
      : createPlayerSliderCatalog.map((slider) => ({ ...slider })),
    backgroundId: selectedBackground.id,
    startingLevelId: selectedStartingLevel.id,
  };
  const [firstName, ...rest] = careerConfig.fullName.split(" ");
  const effectiveSliders = applyPlayingStyleToSliders(
    careerConfig.sliders,
    careerConfig.playingStyle,
  );
  const attributes = buildNewCareerAttributes({
    starterAttributes,
    background: selectedBackground,
    startingLevel: selectedStartingLevel,
    age: careerConfig.age,
    sliders: careerConfig.sliders,
    cueStyle: careerConfig.cueStyle,
    playingStyle: careerConfig.playingStyle,
  });

  const competitiveness =
    effectiveSliders.find((slider) => slider.label === "Competitiveness")
      ?.value ?? 50;
  const perseverance =
    effectiveSliders.find((slider) => slider.label === "Perseverance")?.value ??
    50;
  const mediaHandling =
    effectiveSliders.find((slider) => slider.label === "Media Handling")
      ?.value ?? 50;
  const startingWeeklyCashFlow = (() => {
    let weekly =
      careerConfig.age <= 16 ? 85 : careerConfig.age <= 19 ? 130 : 170;

    if (selectedStartingLevel.rankingLabel === "Amateur Ranking") weekly += 35;
    if (selectedStartingLevel.rankingLabel === "Q Tour Ranking") weekly += 70;
    if (selectedStartingLevel.rankingLabel === "Q School Ranking") weekly += 70;
    if (selectedStartingLevel.rankingLabel === "World Ranking") weekly += 180;
    if (selectedStartingLevel.rankingLabel === "Senior Ranking") weekly += 95;
    if (selectedBackground.funds >= 10000) weekly += 20;
    if (selectedBackground.funds <= 4500) weekly -= 15;

    return Math.max(60, weekly);
  })();
  const baseStartingFunds =
    selectedStartingLevel.competitionTable === "qSchool"
      ? Math.max(selectedBackground.funds, 2500)
      : selectedBackground.funds;
  const startingFunds =
    selectedStartingLevel.id === "start-bottom-tour"
      ? Math.max(1500, Math.round(baseStartingFunds * 0.65))
      : baseStartingFunds;
  const adjustedStartingWeeklyCashFlow =
    selectedStartingLevel.id === "start-bottom-tour"
      ? Math.max(60, startingWeeklyCashFlow - 55)
      : startingWeeklyCashFlow;

  const player: Player = {
    ...starterPlayerProfile,
    firstName,
    lastName: rest.join(" ") || "Player",
    fullName: careerConfig.fullName,
    nationality: careerConfig.nationality,
    age: careerConfig.age,
    dateOfBirth: careerConfig.dateOfBirth,
    handedness: careerConfig.handedness,
    cueStyle: careerConfig.cueStyle,
    careerStage: selectedStartingLevel.careerStage,
    rankingLabel: selectedStartingLevel.rankingLabel,
    worldRanking:
      selectedStartingLevel.competitionTable === "world"
        ? selectedStartingLevel.targetRanking
        : null,
    seniorRanking:
      selectedStartingLevel.competitionTable === "senior"
        ? selectedStartingLevel.targetRanking
        : null,
    form: [],
    playingStyle: careerConfig.playingStyle,
    personalityType: buildCareerPersonality(
      careerConfig.personalityArchetype,
      careerConfig.playingStyle,
    ),
    personalityTraits: effectiveSliders.map((slider) => ({ ...slider })),
    amateurRanking:
      selectedStartingLevel.competitionTable === "world" ||
      selectedStartingLevel.competitionTable === "senior"
        ? null
        : selectedStartingLevel.targetRanking,
    cash: startingFunds,
    cashFlow: adjustedStartingWeeklyCashFlow,
    confidence: clamp(58 + Math.round((competitiveness - 50) / 3), 45, 82),
    fatigue: 18,
    morale: clamp(62 + Math.round((perseverance - 50) / 4), 48, 86),
    reputation: clamp(36 + Math.round((mediaHandling - 50) / 5), 25, 64),
    legacyScore: 0,
    nextEvent:
      tournamentCatalog.find(
        (tournament) => tournament.stageId === selectedStartingLevel.stage,
      )?.name ??
      tournamentCatalog[0]?.name ??
      starterPlayerProfile.nextEvent,
    daysUntilEvent: 5,
    inboxCount: 2,
    notificationCount: 2,
  };
  const competitionTables = initializeCompetitionTablesForNewCareer(
    applyStartingLevelToCompetitionTables(
      buildCompetitionTables(starterRankings, player, {
        reservePlayerName: true,
        worldSeed,
      }),
      player.fullName,
      selectedStartingLevel,
    ),
    player.fullName,
    selectedStartingLevel,
  );
  const careerSystems = syncCareerSystems({
    competitionTables,
    player,
    careerSystems: createCareerSystemsForStartingLevel(selectedStartingLevel),
  });

  const baseState: GameState = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    worldSeed,
    currentDate: "2026-05-11",
    season: "2026/27",
    week: 1,
    player,
    attributes,
    coaches: coachCatalog.map((coach) => ({ ...coach })),
    currentCoachId: null,
    equipment: buildEmptyEquipmentState(),
    finance: {
      cash: startingFunds,
      baseCashFlow: adjustedStartingWeeklyCashFlow,
      cashFlow: adjustedStartingWeeklyCashFlow,
      budgetTargets: {},
      ledger: [],
    },
    tournaments: buildTournamentScheduleForSeason(2026),
    matches: [],
    rankings: competitionTables[selectedStartingLevel.competitionTable].map(
      (row) => ({ ...row }),
    ),
    competitionTables,
    worldPlayers: buildWorldPlayersFromTables(competitionTables, player),
    careerSystems,
    sponsors: [],
    sponsorOffers: [],
    inbox: buildNewCareerInboxMessages(
      careerConfig.fullName,
      selectedBackground.name,
      selectedBackground.difficulty,
      selectedStartingLevel.name,
      adjustedStartingWeeklyCashFlow,
    ),
    travel: createEmptyTravelState(),
    maintenance: { history: [] },
    tournamentProgress: createEmptyTournamentProgress(),
    liveMatch: null,
    history: createEmptyHistory(),
    seasonReview: null,
    coachContracts: [],
    trainingPlan: [],
    trainingAppliedWeek: null,
    trainingCondition: {
      rollingLoad: 0,
      strain: 0,
      injuryWeeks: 0,
      burnout: 0,
      seasonStartAttributes: deepCloneAttributes(attributes),
    },
    health: { activeIssue: null, history: [] },
    lastAction: `Created a new ${selectedBackground.name} career for ${careerConfig.fullName}.`,
  };

  baseState.firstWeekGuide = freshGuide(baseState);
  baseState.attributeHistory = initialAttributeHistory(baseState);
  baseState.trainingPlan = buildAutoTrainingPlanFromState(baseState);

  return withHistorySnapshot(
    recalculateState(repairGameState(baseState), baseState.lastAction),
    "Career Created",
  );
}

function loadStoredState(input?: string): GameState {
  if (typeof window === "undefined") return createStarterState();

  const saved = input ?? window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return createStarterState();

  try {
    const parsed = JSON.parse(decodeCareerSave(saved)) as Partial<GameState> & {
      tournamentProgress?: TournamentProgressState;
    };
    const fallbackState = createStarterState();
    const parsedPlayer = parsed.player
      ? {
          ...fallbackState.player,
          ...parsed.player,
          personalityTraits: buildPersistedPersonalityTraits(
            parsed.player.personalityTraits,
            parsed.player.playingStyle ?? fallbackState.player.playingStyle,
          ),
        }
      : fallbackState.player;
    const hydratedState: GameState = {
      ...fallbackState,
      ...parsed,
      rollingRankings: parsed.rollingRankings,
      payoutRepair: parsed.payoutRepair,
      sponsorMarket: parsed.sponsorMarket,
      careerDepth: parsed.careerDepth,
      realism: parsed.realism,
      worldSeed: parsed.worldSeed ?? fallbackState.worldSeed,
      player: parsedPlayer,
      attributes: parsed.attributes
        ? deepCloneAttributes(parsed.attributes as PlayerAttributes)
        : fallbackState.attributes,
      coaches: Array.isArray(parsed.coaches)
        ? mergeCoachCatalog(parsed.coaches as Coach[])
        : fallbackState.coaches,
      equipment: {
        ...fallbackState.equipment,
        ...parsed.equipment,
        cuesOwned:
          parsed.equipment?.cuesOwned ?? fallbackState.equipment.cuesOwned,
        chalkOwned:
          parsed.equipment?.chalkOwned ?? fallbackState.equipment.chalkOwned,
        tipsOwned:
          parsed.equipment?.tipsOwned ?? fallbackState.equipment.tipsOwned,
        casesOwned:
          parsed.equipment?.casesOwned ?? fallbackState.equipment.casesOwned,
        tablesOwned:
          parsed.equipment?.tablesOwned ?? fallbackState.equipment.tablesOwned,
        cueStates: {
          ...fallbackState.equipment.cueStates,
          ...(parsed.equipment?.cueStates ?? {}),
        },
        chalkCondition:
          parsed.equipment?.chalkCondition ??
          fallbackState.equipment.chalkCondition,
        chalkStock:
          parsed.equipment?.chalkStock ??
          Object.fromEntries(
            (
              parsed.equipment?.chalkOwned ?? fallbackState.equipment.chalkOwned
            ).map((id) => [
              id,
              id ===
              (parsed.equipment?.currentChalkId ??
                fallbackState.equipment.currentChalkId)
                ? 4
                : 2,
            ]),
          ),
        tipStock:
          parsed.equipment?.tipStock ??
          Object.fromEntries(
            (
              parsed.equipment?.tipsOwned ?? fallbackState.equipment.tipsOwned
            ).map((id) => [id, 0]),
          ),
      },
      finance: {
        ...fallbackState.finance,
        ...parsed.finance,
        budgetTargets: parsed.finance?.budgetTargets ?? {},
        ledger: Array.isArray(parsed.finance?.ledger)
          ? parsed.finance.ledger
          : [],
      },
      tournaments: Array.isArray(parsed.tournaments)
        ? parsed.tournaments
        : fallbackState.tournaments,
      matches: Array.isArray(parsed.matches)
        ? parsed.matches
        : fallbackState.matches,
      rankings: Array.isArray(parsed.rankings)
        ? parsed.rankings
        : fallbackState.rankings,
      competitionTables:
        parsed.competitionTables ?? fallbackState.competitionTables,
      worldPlayers: normalizeWorldPlayers(
        Array.isArray(parsed.worldPlayers)
          ? (parsed.worldPlayers as WorldPlayerRecord[])
          : fallbackState.worldPlayers,
        parsed.competitionTables ?? fallbackState.competitionTables,
        parsedPlayer,
      ),
      careerSystems: parsed.careerSystems ?? fallbackState.careerSystems,
      sponsors: Array.isArray(parsed.sponsors)
        ? parsed.sponsors
        : fallbackState.sponsors,
      sponsorOffers: Array.isArray(parsed.sponsorOffers)
        ? buildSponsorOffers(parsed.sponsorOffers as SponsorOfferState[])
        : fallbackState.sponsorOffers,
      coachContracts: Array.isArray(parsed.coachContracts)
        ? normalizeCoachContracts(
            parsed.coachContracts as CoachContract[],
            Array.isArray(parsed.coaches)
              ? (parsed.coaches as Coach[])
              : fallbackState.coaches,
          )
        : buildLegacyCoachContracts(
            parsed.currentCoachId ?? fallbackState.currentCoachId,
            Array.isArray(parsed.coaches)
              ? (parsed.coaches as Coach[])
              : fallbackState.coaches,
            parsed.week ?? fallbackState.week,
          ),
      inbox: normalizeInboxMessages(
        Array.isArray(parsed.inbox) ? parsed.inbox : fallbackState.inbox,
      ),
      travel: parsed.travel
        ? { bookings: parsed.travel.bookings ?? {} }
        : fallbackState.travel,
      maintenance: parsed.maintenance
        ? {
            history:
              parsed.maintenance.history ?? fallbackState.maintenance.history,
          }
        : fallbackState.maintenance,
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
            legacy: parsed.history.legacy,
            snapshots: (
              parsed.history.snapshots ?? fallbackState.history.snapshots
            ).map((snapshot) => ({
              ...snapshot,
              season:
                snapshot.season ??
                getSeasonLabelForDate(
                  snapshot.date ??
                    parsed.currentDate ??
                    fallbackState.currentDate,
                ),
            })),
            matchLog: (parsed.history.matchLog ?? []).map((entry) => ({
              ...entry,
              season: entry.season ?? getSeasonLabelForDate(entry.date),
            })),
            tournamentHistory:
              parsed.history.tournamentHistory ??
              fallbackState.history.tournamentHistory,
            seasonRecords:
              parsed.history.seasonRecords ??
              fallbackState.history.seasonRecords,
          }
        : fallbackState.history,
      seasonReview: parsed.seasonReview ?? null,
      tourChangesReport: parsed.tourChangesReport,
      tourChangesAnnouncedSeason: parsed.tourChangesAnnouncedSeason,
      trainingPlan: Array.isArray(parsed.trainingPlan)
        ? normalizeTrainingPlan(
            parsed.trainingPlan as TrainingPlannerDay[],
            parsed.currentDate ?? fallbackState.currentDate,
            getEnteredCompetitions({
              tournaments: Array.isArray(parsed.tournaments)
                ? (parsed.tournaments as Tournament[])
                : fallbackState.tournaments,
            }),
          )
        : fallbackState.trainingPlan,
      attributeHistory: parsed.attributeHistory,
      trainingAppliedWeek: parsed.trainingAppliedWeek ?? null,
      trainingCondition: {
        ...fallbackState.trainingCondition,
        ...(parsed.trainingCondition ?? {}),
        seasonStartAttributes: deepCloneAttributes(
          parsed.trainingCondition?.seasonStartAttributes ??
            parsed.trainingCondition?.reportSnapshot?.attributes ??
            parsed.attributes ??
            fallbackState.attributes,
        ),
      },
      health: {
        activeIssue: parsed.health?.activeIssue ?? null,
        history: Array.isArray(parsed.health?.history)
          ? parsed.health.history
          : [],
      },
      lastAction: parsed.lastAction ?? "Loaded saved career.",
    };

    const repairedState = repairGameState(hydratedState);
    return recalculateState(repairedState, repairedState.lastAction);
  } catch (error) {
    if (input !== undefined) throw error;
    return createStarterState();
  }
}

function runMatchSimulation(
  state: GameState,
  tournament: Tournament,
  simulationMode: SimulationMode = SIMULATION_MODE.career,
) {
  if (simulationMode !== SIMULATION_MODE.career) {
    throw new Error(
      `runMatchSimulation only supports career mode. Received ${simulationMode}.`,
    );
  }

  const resolvedLiveMatch = resolveCareerSimulationLiveMatch(state, tournament);
  return finalizeLiveMatch(
    { ...state, liveMatch: resolvedLiveMatch },
    resolvedLiveMatch,
  );
}

export function simulateTournamentMatchState(
  previousState: GameState,
  tournamentId?: string,
) {
  const tournament =
    previousState.tournaments.find((item) => item.id === tournamentId) ??
    previousState.tournaments.find((item) => item.status === "Entered");
  if (!tournament)
    return finalizeState(
      previousState,
      "No entered tournament is ready for simulation.",
    );
  const playability = getTournamentPlayability(previousState, tournament);
  if (!playability.canPlay)
    return finalizeState(
      previousState,
      playability.reason ?? `${tournament.name} is not ready to simulate.`,
    );
  const equipmentMessage = getTournamentEquipmentMessage(
    previousState.equipment,
  );
  if (equipmentMessage) return finalizeState(previousState, equipmentMessage);
  return runMatchSimulation(prepareBetweenMatchesState(previousState, 'rest', tournament.id), tournament);
}

export function hireCoachState(
  previousState: GameState,
  coachId: string,
  contractLabel?: string,
  requestedSlot?: (typeof COACH_SLOT_NAMES)[number],
) {
  const coach = previousState.coaches.find((item) => item.id === coachId);
  if (!coach) return previousState;

  if (
    previousState.coachContracts.some(
      (contract) => contract.coachId === coachId,
    )
  ) {
    return recalculateState(
      previousState,
      "This coach is already under contract.",
    );
  }

  const availability = getCoachAvailabilityStatus(previousState, coach);
  if (!availability.available) {
    return recalculateState(previousState, availability.reason);
  }

  const unlockedSlots = COACH_SLOT_NAMES.slice(
    0,
    getCoachSlotLimit(previousState),
  );
  const requestedSlotAvailable = Boolean(
    requestedSlot &&
      unlockedSlots.includes(requestedSlot) &&
      !previousState.coachContracts.some(
        (contract) => contract.slot === requestedSlot,
      ),
  );
  const nextSlot = requestedSlotAvailable
    ? requestedSlot
    : requestedSlot
      ? null
      : getNextCoachSlot(previousState);
  if (!nextSlot) {
    return recalculateState(
      previousState,
      requestedSlot && !unlockedSlots.includes(requestedSlot)
        ? `${requestedSlot} is not unlocked yet. Improve your ranking or reputation first.`
        : requestedSlot
          ? `${requestedSlot} is already occupied. Release that coach or choose another open slot.`
          : "No staff slot is available for another coach yet.",
    );
  }

  const contractOption =
    getCoachContractOptions(coach).find(
      (option) => option.label === contractLabel,
    ) ?? getCoachContractOptions(coach)[0];
  const currentCoachSpend = previousState.coachContracts.reduce(
    (sum, contract) => sum + contract.weeklyCost,
    0,
  );
  const affordability = getCoachAffordabilityForecast(
    previousState.player.cash,
    previousState.finance.cashFlow,
    currentCoachSpend,
    contractOption,
  );
  if (!affordability.affordable) {
    return recalculateState(
      previousState,
      `${coach.name} is outside the current coaching budget. Choose a shorter or lower-cost contract.`,
    );
  }

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
confidence: previousState.player.confidence,
        morale: clamp(previousState.player.morale + 2, 0, 100),
      },
      inbox: [
        createInboxMessage(
          {
            sender: "Staff Office",
            subject: `${coach.name} hired`,
            preview: `${coach.name} signed into the ${nextSlot} slot on a ${contractOption.label.toLowerCase()}. Weekly cost: £${contractOption.weeklyCost}.`,
            priority: "Medium",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Signed ${coach.name} to the ${nextSlot} slot.`,
    "Coach Change",
  );
}

export function fireCoachState(previousState: GameState, coachId: string) {
  const contract = previousState.coachContracts.find(
    (item) => item.coachId === coachId,
  );
  const coach = previousState.coaches.find((item) => item.id === coachId);
  if (!contract || !coach) return previousState;

  return finalizeState(
    {
      ...previousState,
      coachContracts: previousState.coachContracts.filter(
        (item) => item.coachId !== coachId,
      ),
      player: {
        ...previousState.player,
        morale: clamp(previousState.player.morale - 2, 0, 100),
      },
      inbox: [
        createInboxMessage(
          {
            sender: "Staff Office",
            subject: `${coach.name} released`,
            preview: `${coach.name} has been removed from the ${contract.slot} slot. Weekly staff exposure has dropped by £${contract.weeklyCost}.`,
            priority: "Medium",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Released ${coach.name} from the ${contract.slot} slot.`,
    "Coach Change",
  );
}

export function buyCueState(previousState: GameState, cueId: string) {
  if (previousState.equipment.cuesOwned.includes(cueId)) {
    return finalizeState(
      {
        ...previousState,
        equipment: { ...previousState.equipment, currentCueId: cueId },
        player: {
          ...previousState.player,
          confidence: previousState.player.confidence,
        },
      },
      "Equipped an owned cue.",
    );
  }

  const cue = cueMarketplaceCatalog.find((item) => item.id === cueId);
  if (!cue) return previousState;
  if (previousState.player.cash < cue.price) {
    return finalizeState(previousState, `Not enough cash to buy ${cue.name}.`);
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
        confidence: previousState.player.confidence,
      },
      inbox: [
        createInboxMessage(
          {
            sender: "Equipment Shop",
            subject: `${cue.name} purchased`,
            preview: `You bought and equipped ${cue.name} for £${cue.price}. Familiarity will improve over time.`,
            priority: "Medium",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Purchased ${cue.name}.`,
    "Equipment Purchase",
  );
}

export function buyChalkState(previousState: GameState, chalkId: string) {
  const chalk = chalkCatalog.find((item) => item.id === chalkId);
  if (!chalk) return previousState;
  const stock = previousState.equipment.chalkStock[chalkId] ?? 0;
  const previousChalkId = previousState.equipment.currentChalkId;
  const savedConditions = { ...previousState.equipment.chalkConditions,
    ...(previousChalkId ? { [previousChalkId]: previousState.equipment.chalkCondition } : {}),
  };
  const storedCondition = savedConditions[chalkId] ?? 100;
  const availableUnits = stock - Number(storedCondition <= 0);
  if (
    previousState.equipment.currentChalkId === chalkId &&
    stock > 0 &&
    previousState.equipment.chalkCondition > 0
  ) {
    return finalizeState(
      previousState,
      `${chalk.name} is already equipped with ${stock} unit${stock === 1 ? "" : "s"} remaining.`,
    );
  }
  if (previousState.equipment.chalkOwned.includes(chalkId) && availableUnits > 0) {
    return finalizeState(
      {
        ...previousState,
        equipment: {
          ...previousState.equipment,
          currentChalkId: chalkId,
          chalkCondition: storedCondition > 0 ? storedCondition : 100,
          chalkConditions: { ...savedConditions, [chalkId]: storedCondition > 0 ? storedCondition : 100 },
          chalkStock: {
            ...previousState.equipment.chalkStock,
            [chalkId]: availableUnits,
          },
        },
        player: {
          ...previousState.player,
          confidence: previousState.player.confidence,
        },
      },
      `Opened and equipped a stocked unit of ${chalk.name}.`,
    );
  }

  if (previousState.player.cash < chalk.cost) {
    return finalizeState(
      previousState,
      `Not enough cash to buy ${chalk.name}.`,
    );
  }

  return finalizeState(
    {
      ...previousState,
      equipment: {
        ...previousState.equipment,
        currentChalkId: chalkId,
        chalkOwned: previousState.equipment.chalkOwned.includes(chalkId)
          ? previousState.equipment.chalkOwned
          : [...previousState.equipment.chalkOwned, chalkId],
        chalkCondition: 100,
        chalkConditions: { ...savedConditions, [chalkId]: 100 },
        chalkStock: { ...previousState.equipment.chalkStock, [chalkId]: 5 },
      },
      player: {
        ...previousState.player,
        cash: previousState.player.cash - chalk.cost,
        confidence: previousState.player.confidence,
      },
      inbox: [
        createInboxMessage(
          {
            sender: "Equipment Shop",
            subject: `${chalk.name} purchased`,
            preview: `You bought a five-unit pack of ${chalk.name} for £${chalk.cost} and equipped the first unit.`,
            priority: "Low",
            actionLabel: "Open Chalk & Tip Setup",
            actionRoute: "/equipment/chalk-tips",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Purchased ${chalk.name}.`,
    "Equipment Purchase",
  );
}

/** Buy more consumable stock without replacing a usable unit or changing chalk brands. */
export function restockChalkState(previousState: GameState, chalkId: string) {
  const chalk = chalkCatalog.find(item => item.id === chalkId);
  if (!chalk) return previousState;
  if (!previousState.equipment.chalkOwned.includes(chalkId)) return buyChalkState(previousState, chalkId);
  if (previousState.player.cash < chalk.cost) return finalizeState(previousState, `Not enough cash to buy a pack of ${chalk.name}.`);
  const equipment = previousState.equipment;
  const equipped = equipment.currentChalkId === chalkId;
  const condition = equipped ? equipment.chalkCondition : equipment.chalkConditions?.[chalkId] ?? 100;
  const usableStock = Math.max(0, (equipment.chalkStock[chalkId] ?? 0) - Number(condition <= 0));
  const nextStock = usableStock + 5;
  const nextCondition = usableStock > 0 && condition > 0 ? condition : 100;
  return finalizeState({
    ...previousState,
    player: { ...previousState.player, cash: previousState.player.cash - chalk.cost },
    equipment: { ...equipment,
      chalkStock: { ...equipment.chalkStock, [chalkId]: nextStock },
      chalkConditions: { ...equipment.chalkConditions, [chalkId]: nextCondition },
      chalkCondition: equipped ? nextCondition : equipment.chalkCondition,
    },
  }, `Bought five more units of ${chalk.name} for £${chalk.cost}. Stock: ${nextStock} units.`, 'Equipment Purchase');
}

export function buyTipState(previousState: GameState, tipId: string) {
  const tip = tipCatalog.find((item) => item.id === tipId);
  if (!tip) return previousState;
  const currentTipCondition = previousState.equipment.currentCueId
    ? getCueState(previousState.equipment, previousState.equipment.currentCueId)
        .tipCondition
    : 0;
  if (
    previousState.equipment.currentTipId === tipId &&
    currentTipCondition >= 90
  ) {
    return finalizeState(
      previousState,
      `${tip.name} is already fitted and does not need replacing.`,
    );
  }
  if (previousState.player.cash < tip.cost) {
    return finalizeState(previousState, `Not enough cash to buy ${tip.name}.`);
  }

  return finalizeState(
    {
      ...previousState,
      equipment: {
        ...previousState.equipment,
        currentTipId: tipId,
        tipsOwned: previousState.equipment.tipsOwned.includes(tipId)
          ? previousState.equipment.tipsOwned
          : [...previousState.equipment.tipsOwned, tipId],
        tipStock: { ...previousState.equipment.tipStock, [tipId]: 0 },
        cueStates: previousState.equipment.currentCueId
          ? {
              ...previousState.equipment.cueStates,
              [previousState.equipment.currentCueId]: {
                ...getCueState(
                  previousState.equipment,
                  previousState.equipment.currentCueId,
                ),
                tipCondition: 100,
              },
            }
          : previousState.equipment.cueStates,
      },
      player: {
        ...previousState.player,
        cash: previousState.player.cash - tip.cost,
        confidence: previousState.player.confidence,
      },
      inbox: [
        createInboxMessage(
          {
            sender: "Equipment Shop",
            subject: `${tip.name} purchased`,
            preview: `You paid £${tip.cost} to fit a fresh ${tip.name}. Tip condition is now 100%.`,
            priority: "Low",
            actionLabel: "Open Chalk & Tip Setup",
            actionRoute: "/equipment/chalk-tips",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Purchased ${tip.name}.`,
    "Equipment Purchase",
  );
}

export function applyTrainingPlanState(
  previousState: GameState,
  nextWeek?: TrainingPlannerDay[],
) {
  if (previousState.trainingAppliedWeek === previousState.week) {
    return finalizeState(
      previousState,
      "Training effects already applied for this week.",
    );
  }

  const normalizedTrainingPlan = protectRealismSessions(previousState, protectCommitmentSessions(previousState, protectPartnerSessions(previousState, normalizeTrainingPlan(
    nextWeek ?? previousState.trainingPlan,
    plusDays(depthOf(previousState).nextSettlementDate, -7),
    getEnteredCompetitions(previousState),
  ))));
  const trainingEffects = applyCoachTrainingBonus(
    calculateTrainingEffects(normalizedTrainingPlan),
    previousState.coachContracts,
    previousState.coaches,
  );
  const adaptationMultiplier = getTrainingAdaptationMultiplier(
    previousState.player.fatigue,
    previousState.trainingCondition.strain,
    previousState.trainingCondition.burnout,
  );
  const facilityMultiplier = getFacilityTrainingMultiplier(
    previousState.equipment,
  );
  const developmentState = previousState;
  const activeDevelopmentKind = depthOf(previousState).project?.status === 'active' ? depthOf(previousState).project?.kind : undefined;
  previousState = progressDevelopment(previousState, normalizedTrainingPlan);
  const adaptedGain = (gain: number, skill: string) =>
    gain * adaptationMultiplier * Math.min(1.15, facilityMultiplier * baseTrainingMultiplier(developmentState)) * developmentTrainingBonus(developmentState, normalizedTrainingPlan, skill);
  const recoveryCapacity =
    trainingEffects.recoverySessions * 5 + trainingEffects.restSessions * 4;
  const nextStrain = clamp(
    Math.round(
      previousState.trainingCondition.strain * 0.72 +
        Math.max(0, trainingEffects.weekLoad - 68) * 0.7 +
        Math.max(0, previousState.player.fatigue - 55) * 0.35 -
        recoveryCapacity,
    ),
    0,
    100,
  );
  const nextBurnout = clamp(
    Math.round(
      previousState.trainingCondition.burnout * 0.82 +
        Math.max(0, trainingEffects.highIntensitySessions - 10) * 3 -
        recoveryCapacity / 2,
    ),
    0,
    100,
  );
  const overloadInjury = nextStrain >= 85 && previousState.player.fatigue >= 78;
  const overloadIssue = overloadInjury
    ? (previousState.health.activeIssue ?? {
        id: `injury-${previousState.week}-${previousState.currentDate}`,
        issue:
          nextStrain >= 95
            ? "Shoulder overuse strain"
            : "Training overload strain",
        bodyArea:
          nextStrain >= 95 ? ("Shoulder" as const) : ("General" as const),
        severity: nextStrain >= 95 ? ("Moderate" as const) : ("Minor" as const),
        cause: "Training load exceeded recovery capacity",
        startedDate: previousState.currentDate,
        weeksRemaining: nextStrain >= 95 ? 2 : 1,
        recoveryProgress: 10,
      })
    : previousState.health.activeIssue;
  const nextAttributes = deepCloneAttributes(previousState.attributes);
  const completedCells = normalizedTrainingPlan.filter(d => !d.careerCommitmentId).flatMap(d => [d.morning, d.afternoon, d.evening]);
  for (const [kind, skill, title] of [
    ['safety', 'Safety Play', 'Safety Exchanges'], ['cue-action', 'Consistency', 'Line-Up Drill'], ['pressure', 'Composure', 'Mental Training'], ['stamina', 'Recovery Rate', 'Fitness'],
  ]) {
    if (activeDevelopmentKind !== kind || previousState.health.activeIssue) continue;
    const sessions = completedCells.filter(c => c.title === title).length;
    if (sessions > 0) improveAttribute(nextAttributes, skill, getScaledTrainingGain(previousState, skill, adaptedGain(sessions / 6, skill)));
  }
  improveAttribute(
    nextAttributes,
    "Long Potting",
    getScaledTrainingGain(
      previousState,
      "Long Potting",
      adaptedGain(trainingEffects.technicalGain, 'Long Potting'),
    ),
  );
  improveAttribute(
    nextAttributes,
    "Cue Ball Control",
    getScaledTrainingGain(
      previousState,
      "Cue Ball Control",
      adaptedGain(trainingEffects.cueControlGain, 'Cue Ball Control'),
    ),
  );
  improveAttribute(
    nextAttributes,
    "Break Building",
    getScaledTrainingGain(
      previousState,
      "Break Building",
      adaptedGain(trainingEffects.breakBuildingGain, 'Break Building'),
    ),
  );
  improveAttribute(
    nextAttributes,
    "Focus",
    getScaledTrainingGain(
      previousState,
      "Focus",
      adaptedGain(trainingEffects.focusGain, 'Focus'),
    ),
  );
  improveAttribute(
    nextAttributes,
    "Stamina",
    getScaledTrainingGain(
      previousState,
      "Stamina",
      adaptedGain(trainingEffects.staminaGain, 'Stamina'),
    ),
  );
  const currentCareerRank =
    previousState.rankings.find(
      (row) => row.playerName === previousState.player.fullName,
    )?.ranking ??
    previousState.player.worldRanking ??
    previousState.player.amateurRanking ??
    null;
  const recentMatches = previousState.matches.slice(0, 10);
  const currentForm =
    recentMatches.length > 0
      ? Math.round(
          (recentMatches.filter((match) => match.result === "Won").length /
            recentMatches.length) *
            100,
        )
      : 0;
  const previousReportSnapshot = previousState.trainingCondition
    .reportSnapshot ?? {
    weeksTracked: 0,
    attributes: deepCloneAttributes(previousState.attributes),
    fatigue: previousState.player.fatigue,
    strain: previousState.trainingCondition.strain,
    burnout: previousState.trainingCondition.burnout,
    date: previousState.currentDate,
    confidence: previousState.player.confidence,
    morale: previousState.player.morale,
    ranking: currentCareerRank,
    form: currentForm,
  };
  const reportWeeksTracked = previousReportSnapshot.weeksTracked + 1;
  const fortnightlyReportDue = reportWeeksTracked >= 2;
  const attributeChanges = getTrainingAttributeChanges(
    previousReportSnapshot.attributes,
    nextAttributes,
  );
  const improvements = attributeChanges
    .filter((change) => change.delta > 0)
    .sort(
      (left, right) =>
        right.delta - left.delta || left.label.localeCompare(right.label),
    );
  const declines = attributeChanges
    .filter((change) => change.delta < 0)
    .sort(
      (left, right) =>
        left.delta - right.delta || left.label.localeCompare(right.label),
    );
  const nextPlayerFatigue = clamp(
    previousState.player.fatigue +
      trainingEffects.fatigueDelta +
      (overloadInjury ? 6 : 0),
    0,
    100,
  );
  const nextPlayerConfidence = supportedConfidence(previousState.player.confidence, trainingEffects.confidenceDelta);
  const nextPlayerMorale = clamp(
    previousState.player.morale +
      trainingEffects.moraleDelta -
      (nextBurnout >= 70 ? 3 : 0),
    0,
    100,
  );
  const improvementSummary =
    improvements.length > 0
      ? improvements
          .slice(0, 6)
          .map(
            (change) =>
              `${change.label} +${change.delta} (now ${change.current})`,
          )
          .join(", ")
      : "No attributes increased in this block";
  const trainingPreview = overloadInjury
    ? "The training load exceeded your recovery capacity. A one-week strain injury has been recorded; reduce intensity before returning."
    : adaptationMultiplier < 0.7
      ? `Fatigue and accumulated strain limited this block to ${Math.round(adaptationMultiplier * 100)}% adaptation. Recovery will restore learning efficiency.`
      : trainingEffects.fatigueDelta < 0
        ? `Rest and recovery worked as planned. Fatigue dropped by ${Math.abs(trainingEffects.fatigueDelta)} and adaptation capacity recovered.`
        : `Training effects have been applied for the week. Fatigue shifted by ${trainingEffects.fatigueDelta} based on the current schedule.`;

  return finalizeState(
    {
      ...previousState,
      attributes: nextAttributes,
      trainingPlan: normalizedTrainingPlan,
      careerDepth: recordProjectOutcome(previousState, nextAttributes),
      trainingAppliedWeek: previousState.week,
      trainingCondition: {
        ...previousState.trainingCondition,
        rollingLoad: Math.round(
          previousState.trainingCondition.rollingLoad * 0.55 +
            trainingEffects.weekLoad * 0.45,
        ),
        strain: nextStrain,
        injuryWeeks: overloadInjury
          ? Math.max(1, previousState.trainingCondition.injuryWeeks)
          : previousState.trainingCondition.injuryWeeks,
        burnout: nextBurnout,
        reportSnapshot: fortnightlyReportDue
          ? {
              weeksTracked: 0,
              attributes: deepCloneAttributes(nextAttributes),
              fatigue: nextPlayerFatigue,
              strain: nextStrain,
              burnout: nextBurnout,
              date: previousState.currentDate,
              confidence: nextPlayerConfidence,
              morale: nextPlayerMorale,
              ranking: currentCareerRank,
              form: currentForm,
              lastReport: {
                seasonNumber: seasonPosition(previousState).season,
                seasonWeek: seasonPosition(previousState).week,
                startDate: previousReportSnapshot.date,
                endDate: previousState.currentDate,
                changes: attributeChanges,
                trainingLoad: trainingEffects.weekLoad,
                adaptation: Math.round(
                  adaptationMultiplier * facilityMultiplier * 100,
                ),
                fatigueChange:
                  nextPlayerFatigue - previousReportSnapshot.fatigue,
                strainChange: nextStrain - previousReportSnapshot.strain,
                burnoutChange: nextBurnout - previousReportSnapshot.burnout,
              },
            }
          : {
              ...previousReportSnapshot,
              weeksTracked: reportWeeksTracked,
            },
      },
      health: { ...previousState.health, activeIssue: overloadIssue },
      player: {
        ...previousState.player,
        confidence: nextPlayerConfidence,
        fatigue: nextPlayerFatigue,
        morale: nextPlayerMorale,
      },
      inbox: [
        ...(fortnightlyReportDue
          ? [
              createInboxMessage(
                {
                  sender: "Head Coach",
                  subject: `Fortnightly training report: ${seasonWeekLabel(previousState)} · ${improvements.length} improved`,
                  preview: `${improvementSummary}. Review your development, form, ranking and workload below.`,
                  priority:
                    overloadInjury || declines.length > improvements.length
                      ? "High"
                      : "Medium",
                  actionLabel: "View Training Report",
                  actionRoute: "/training/report",
                  summary: [
                    ...improvements.slice(0, 6).map((change) => ({
                      label: change.label,
                      value: `+${change.delta}`,
                      detail: `Now ${change.current} · ${change.group}`,
                      tone: "positive" as const,
                    })),
                    ...declines.slice(0, 4).map((change) => ({
                      label: change.label,
                      value: `${change.delta}`,
                      detail: `Now ${change.current} · ${change.group}`,
                      tone: "negative" as const,
                    })),
                    {
                      label: "Recent form",
                      value: `${currentForm}%`,
                      detail: `${recentMatches.filter((match) => match.result === "Won").length}-${recentMatches.filter((match) => match.result === "Lost").length} across the last ${recentMatches.length} match${recentMatches.length === 1 ? "" : "es"}`,
                      tone:
                        currentForm >= 60
                          ? ("positive" as const)
                          : currentForm < 40
                            ? ("warning" as const)
                            : ("neutral" as const),
                    },
                    {
                      label: previousState.player.rankingLabel,
                      value: currentCareerRank ? `#${currentCareerRank}` : "Unranked",
                      detail:
                        previousReportSnapshot.ranking && currentCareerRank
                          ? currentCareerRank < previousReportSnapshot.ranking
                            ? `Up ${previousReportSnapshot.ranking - currentCareerRank}`
                            : currentCareerRank > previousReportSnapshot.ranking
                              ? `Down ${currentCareerRank - previousReportSnapshot.ranking}`
                              : "No movement"
                          : "Current position",
                      tone:
                        previousReportSnapshot.ranking &&
                        currentCareerRank &&
                        currentCareerRank < previousReportSnapshot.ranking
                          ? ("positive" as const)
                          : ("neutral" as const),
                    },
                    {
                      label: "Confidence",
                      value: `${nextPlayerConfidence}%`,
                      detail: `${formatTrainingMetricChange(nextPlayerConfidence - (previousReportSnapshot.confidence ?? previousState.player.confidence))}% over two weeks`,
                      tone:
                        nextPlayerConfidence >=
                        (previousReportSnapshot.confidence ??
                          previousState.player.confidence)
                          ? ("positive" as const)
                          : ("warning" as const),
                    },
                    {
                      label: "Training load",
                      value: `${trainingEffects.weekLoad}%`,
                      detail: `${Math.round(adaptationMultiplier * facilityMultiplier * 100)}% adaptation`,
                      tone:
                        trainingEffects.weekLoad > 80
                          ? ("warning" as const)
                          : ("neutral" as const),
                    },
                    {
                      label: "Fatigue",
                      value: `${nextPlayerFatigue}%`,
                      detail: `${formatTrainingMetricChange(nextPlayerFatigue - previousReportSnapshot.fatigue)}% over two weeks`,
                      tone:
                        nextPlayerFatigue >= 70
                          ? ("negative" as const)
                          : nextPlayerFatigue >= 50
                            ? ("warning" as const)
                            : ("positive" as const),
                    },
                    {
                      label: "Strain / burnout",
                      value: `${nextStrain}% / ${nextBurnout}%`,
                      detail: `${formatTrainingMetricChange(nextStrain - previousReportSnapshot.strain)} strain · ${formatTrainingMetricChange(nextBurnout - previousReportSnapshot.burnout)} burnout`,
                      tone:
                        nextStrain >= 70 || nextBurnout >= 70
                          ? ("negative" as const)
                          : nextStrain >= 50 || nextBurnout >= 50
                            ? ("warning" as const)
                            : ("positive" as const),
                    },
                  ],
                },
                "Today",
              ),
            ]
          : overloadInjury
            ? [
                createInboxMessage(
                  {
                    sender: "Head Coach",
                    subject: "Training overload warning",
                    preview: trainingPreview,
                    priority: "High",
                    actionLabel: "Open Health Centre",
                    actionRoute: "/health",
                  },
                  "Today",
                ),
              ]
            : []),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Applied training gains for week ${previousState.week}.`,
    "Training Block",
  );
}

export function acceptSponsorState(
  previousState: GameState,
  sponsorId: string,
  requestedSlot?: string,
) {
  const offer = findSponsorOfferFromState(previousState, sponsorId);
  if (!offer) return previousState;
  const marketBlocker = seasonalSponsorBlocker(previousState, offer);
  if (marketBlocker) return finalizeState(previousState, marketBlocker);
  if (offer.status === "Rejected") {
    return finalizeState(
      previousState,
      `${offer.name} has already been rejected.`,
    );
  }
  if (previousState.sponsors.some((sponsor) => sponsor.name === offer.name)) {
    return finalizeState(previousState, `${offer.name} is already active.`);
  }
  if (offer.status === "Accepted") return finalizeState(previousState, `${offer.name} has already been signed. Wait for a new approach or review your existing contract renewal.`);
  if (previousState.player.reputation < offer.minimumReputation) {
    return finalizeState(
      previousState,
      `${offer.name} needs at least ${offer.minimumReputation} reputation before it can be signed.`,
    );
  }
  if (previousState.sponsors.length >= getSponsorSlotLimit(previousState)) {
    return finalizeState(
      previousState,
      "All currently unlocked sponsor slots are already occupied.",
    );
  }
  const unlockedSponsorSlots = SPONSOR_SLOT_NAMES.slice(
    0,
    getSponsorSlotLimit(previousState),
  );
  if (
    requestedSlot &&
    !unlockedSponsorSlots.some((slot) => slot === requestedSlot)
  ) {
    return finalizeState(
      previousState,
      `${requestedSlot} is not currently unlocked.`,
    );
  }
  if (
    requestedSlot &&
    previousState.sponsors.some((sponsor) => sponsor.slot === requestedSlot)
  ) {
    return finalizeState(previousState, `${requestedSlot} is already occupied.`);
  }
  const sponsorSlot = requestedSlot
    ? unlockedSponsorSlots.find((slot) => slot === requestedSlot) ?? null
    : getNextSponsorSlot(previousState);
  if (!sponsorSlot) {
    return finalizeState(
      previousState,
      "No sponsor slot is currently free for this deal.",
    );
  }

  const acceptedSponsor: SponsorDeal = {
    signedSeason: previousState.season,
    id: offer.id,
    name: offer.name,
    category: offer.category,
    slot: sponsorSlot,
    monthlyValue: offer.monthlyValue,
    contractLength: offer.contractLength,
    weeksRemaining: parseContractWeeks(offer.contractLength),
    brandFit: offer.brandFit,
    risk:
      offer.risk === "Risky Terms"
        ? "High"
        : offer.risk === "Medium Risk"
          ? "Medium"
          : "Low",
    bonusClause: offer.bonusClause,
    behaviour: offer.behaviour,
    obligationLoad: 0,
    weeklyFatigueCost: 0,
    perk: "None",
    bonusesPaid: [],
    totalBonusPaid: 0,
  };
  Object.assign(acceptedSponsor, getSponsorObligationProfile(acceptedSponsor));

  return finalizeState(
    {
      ...previousState,
      sponsors: [...previousState.sponsors, acceptedSponsor],
      sponsorOffers: previousState.sponsorOffers.map((item) =>
        item.id === sponsorId
          ? {
              ...item,
              status: "Accepted",
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
            sender: "Commercial Team",
            subject: `${offer.name} deal accepted`,
            preview: `${offer.name} now occupies the ${sponsorSlot} slot, contributes £${offer.monthlyValue}/month, and runs for ${offer.contractLength.toLowerCase()}.`,
            priority: "High",
            actionLabel: "Open Sponsorships",
            actionRoute: "/sponsorship",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Accepted the ${offer.name} sponsorship deal.`,
    "Sponsor Signed",
  );
}

export function renewSponsorState(previousState: GameState, sponsorId: string) {
  const sponsor = previousState.sponsors.find((item) => item.id === sponsorId);
  if (
    !sponsor ||
    sponsor.renewalStatus !== "Offered" ||
    !sponsor.renewalOfferValue ||
    (sponsor.performance?.satisfaction ?? 75) < 50
  ) {
    return finalizeState(
      previousState,
      "No sponsor renewal is currently available.",
    );
  }

  return finalizeState(
    {
      ...previousState,
      sponsors: previousState.sponsors.map((item) =>
        item.id === sponsorId
          ? {
              ...item,
              monthlyValue: sponsor.renewalOfferValue!,
              contractLength: "12 months",
              weeksRemaining: 48,
              renewalStatus: "Accepted",
              renewalOfferValue: undefined,
              compliance: clamp((item.compliance ?? 100) + 5, 0, 100),
              missedObligations: 0,
              lastLifecycleEvent: "Renewal accepted",
            }
          : item,
      ),
      inbox: [
        createInboxMessage(
          {
            sender: "Commercial Team",
            subject: `${sponsor.name} renewed`,
            preview: `A new 12-month deal is active at £${sponsor.renewalOfferValue.toLocaleString("en-GB")}/month.`,
            priority: "High",
            actionLabel: "Open Sponsorships",
            actionRoute: "/sponsorship",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Renewed the ${sponsor.name} sponsorship.`,
    "Sponsor Renewed",
  );
}

export function declineSponsorRenewalState(
  previousState: GameState,
  sponsorId: string,
) {
  const sponsor = previousState.sponsors.find((item) => item.id === sponsorId);
  if (!sponsor || sponsor.renewalStatus !== "Offered")
    return finalizeState(
      previousState,
      "No sponsor renewal is currently available.",
    );
  return finalizeState(
    {
      ...previousState,
      sponsors: previousState.sponsors.map((item) =>
        item.id === sponsorId
          ? {
              ...item,
              renewalStatus: "Declined",
              renewalOfferValue: undefined,
              lastLifecycleEvent: "Renewal declined",
            }
          : item,
      ),
    },
    `Declined the ${sponsor.name} renewal.`,
    "Sponsor Renewal Declined",
  );
}

export function renegotiateSponsorState(
  previousState: GameState,
  sponsorId: string,
) {
  const sponsor = previousState.sponsors.find((item) => item.id === sponsorId);
  if (
    !sponsor ||
    sponsor.renewalStatus !== "Offered" ||
    !sponsor.renewalOfferValue
  ) {
    return finalizeState(
      previousState,
      "No sponsor renewal is currently available to renegotiate.",
    );
  }

  const leverage =
    (sponsor.compliance ?? 100) +
    sponsor.brandFit +
    Math.round(previousState.player.reputation / 2);
  const accepted = leverage >= 170;
  const counterValue = accepted
    ? Math.round(
        sponsor.renewalOfferValue *
          clamp(1.03 + previousState.player.reputation / 1000, 1.03, 1.12),
      )
    : sponsor.renewalOfferValue;

  return finalizeState(
    {
      ...previousState,
      sponsors: previousState.sponsors.map((item) =>
        item.id === sponsorId
          ? {
              ...item,
              renewalOfferValue: counterValue,
              compliance: clamp(
                (item.compliance ?? 100) - (accepted ? 1 : 5),
                0,
                100,
              ),
              lastLifecycleEvent: accepted
                ? "Improved renewal terms negotiated"
                : "Renewal counter-offer declined",
            }
          : item,
      ),
      inbox: [
        createInboxMessage(
          {
            sender: "Commercial Team",
            subject: accepted
              ? `${sponsor.name} improves renewal offer`
              : `${sponsor.name} holds renewal terms`,
            preview: accepted
              ? `Your leverage secured a revised offer of £${counterValue.toLocaleString("en-GB")}/month.`
              : `The counter-offer was declined. The original £${counterValue.toLocaleString("en-GB")}/month offer remains available, but compliance fell slightly.`,
            priority: "Medium",
            actionLabel: "Review Renewal",
            actionRoute: "/sponsorship",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    accepted
      ? `Negotiated improved terms with ${sponsor.name}.`
      : `${sponsor.name} declined the counter-offer.`,
    "Sponsor Renegotiation",
  );
}

export function scheduleTreatmentState(
  previousState: GameState,
  optionId?: string,
) {
  const treatmentChoice = getTreatmentEffect(optionId);
  if (!needsHealthRecovery(previousState)) {
    return { ...previousState, lastAction: 'No treatment needed: no active injury, fatigue, strain or burnout. No money spent.' };
  }
  if (previousState.liveMatch?.status === 'In Progress') {
    return { ...previousState, lastAction: 'Finish your current match before applying treatment. Use interval recovery during play.' };
  }
  const outcome = treatmentPreview(previousState, optionId).map(row => `${row.label} ${Number(row.before.toFixed(2))}${row.unit} → ${Number(row.after.toFixed(2))}${row.unit}`).join(' · ');

  if (previousState.player.cash < treatmentChoice.cost) {
    return finalizeState(
      previousState,
      `Not enough cash to schedule ${treatmentChoice.title.toLowerCase()}.`,
    );
  }

  const nextAttributes = deepCloneAttributes(previousState.attributes);
  improveAttribute(nextAttributes, "Shoulder Health", 3);
  improveAttribute(nextAttributes, "Recovery Rate", 2);
  const previousIssue = previousState.health.activeIssue;
  const remainingIssueWeeks = Math.max(
    0,
    (previousIssue?.weeksRemaining ??
      previousState.trainingCondition.injuryWeeks) -
      treatmentChoice.injuryWeeks,
  );
  const issueResolved = Boolean(previousIssue && remainingIssueWeeks === 0);

  return finalizeState(
    {
      ...previousState,
      attributes: nextAttributes,
      trainingCondition: {
        ...previousState.trainingCondition,
        strain: clamp(
          previousState.trainingCondition.strain - treatmentChoice.strain,
          0,
          100,
        ),
        burnout: clamp(
          previousState.trainingCondition.burnout - treatmentChoice.burnout,
          0,
          100,
        ),
        injuryWeeks: remainingIssueWeeks,
      },
      health: {
        activeIssue:
          previousIssue && !issueResolved
            ? {
                ...previousIssue,
                weeksRemaining: remainingIssueWeeks,
                recoveryProgress: clamp(
                  previousIssue.recoveryProgress + treatmentChoice.strain,
                  0,
                  100,
                ),
              }
            : null,
        history: [
              {
                id: `treatment-${previousIssue?.id ?? "recovery"}-${Date.now()}`,
                date: previousState.currentDate,
                issue: previousIssue?.issue ?? "Recovery support",
                severity: previousIssue?.severity ?? "Minor",
                treatment: treatmentChoice.title,
                timeOut: issueResolved
                  ? "Cleared"
                  : `${remainingIssueWeeks} week${remainingIssueWeeks === 1 ? "" : "s"} remaining`,
                notes: outcome + (issueResolved ? " · Cleared to return." : ""),
              },
              ...previousState.health.history,
            ].slice(0, 24),
      },
      finance:
        treatmentChoice.cost > 0
          ? {
              ...previousState.finance,
              ledger: [
                {
                  id: `treatment-${Date.now()}`,
                  date: previousState.currentDate,
                  description: treatmentChoice.title,
                  category: "Health",
                  amount: treatmentChoice.cost,
                  type: "Expense" as const,
                },
                ...previousState.finance.ledger,
              ].slice(0, 200),
            }
          : previousState.finance,
      player: {
        ...previousState.player,
        cash: previousState.player.cash - treatmentChoice.cost,
        fatigue: clamp(
          previousState.player.fatigue - treatmentChoice.fatigue,
          0,
          100,
        ),
        morale: clamp(previousState.player.morale + 1, 0, 100),
      },
      inbox: [
        createInboxMessage(
          {
            sender: "Medical Team",
            subject: `${treatmentChoice.title} applied`,
            preview: `${outcome}. Cost £${treatmentChoice.cost}. Recovery effects applied immediately; the calendar date is unchanged.`,
            priority: "Medium",
            actionLabel: "Open Health Centre",
            actionRoute: "/health",
          },
          "Today",
        ),
        ...previousState.inbox,
      ].slice(0, 18),
    },
    `Applied ${treatmentChoice.title.toLowerCase()}: ${outcome}. Cost £${treatmentChoice.cost}.`,
    "Treatment Applied",
  );
}

export function updateBudgetTargetsState(
  previousState: GameState,
  targets: Record<string, number>,
) {
  const budgetTargets = Object.fromEntries(
    Object.entries(targets).map(([category, amount]) => [
      category,
      Math.max(0, Math.round(Number(amount) || 0)),
    ]),
  );
  return finalizeState(
    { ...previousState, finance: { ...previousState.finance, budgetTargets } },
    "Updated the monthly budget allocation.",
    "Budget Updated",
  );
}

export function recordFinanceExpenseState(
  previousState: GameState,
  description: string,
  category: string,
  amount: number,
) {
  const normalizedAmount = Math.max(0, Math.round(Number(amount) || 0));
  const normalizedDescription = description.trim();
  if (!normalizedDescription || normalizedAmount <= 0)
    return finalizeState(
      previousState,
      "Enter an expense description and positive amount.",
    );
  if (normalizedAmount > previousState.player.cash)
    return finalizeState(
      previousState,
      "There is not enough cash to record that expense.",
    );

  const transaction: FinanceTransaction = {
    id: `finance-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    date: previousState.currentDate,
    description: normalizedDescription,
    category: category.trim() || "Other",
    amount: -normalizedAmount,
    type: "Expense",
  };
  return finalizeState(
    {
      ...previousState,
      player: {
        ...previousState.player,
        cash: previousState.player.cash - normalizedAmount,
      },
      finance: {
        ...previousState.finance,
        cash: previousState.player.cash - normalizedAmount,
        ledger: [transaction, ...previousState.finance.ledger].slice(0, 240),
      },
    },
    `Recorded ${normalizedDescription} for £${normalizedAmount.toLocaleString("en-GB")}.`,
    "Expense Recorded",
  );
}

export type { SaveSlotSummary };

export type CareerSessionMode = "launcher" | "creating" | "active";

function createSaveSlotId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function getUniqueSaveSlotName(baseName: string, excludedId?: string) {
  const trimmedName = baseName.trim() || "Snooker Career";
  const existingNames = new Set(
    readSaveSlotIndex()
      .filter((slot) => slot.id !== excludedId)
      .map((slot) => slot.name.toLocaleLowerCase()),
  );
  if (!existingNames.has(trimmedName.toLocaleLowerCase())) return trimmedName;

  let suffix = 2;
  while (existingNames.has(`${trimmedName} (${suffix})`.toLocaleLowerCase())) {
    suffix += 1;
  }
  return `${trimmedName} (${suffix})`;
}

function persistCareerSlot(
  state: GameState,
  options: { id?: string; name?: string; serialized?: string } = {},
) {
  const id = options.id ?? createSaveSlotId();
  const existing = readSaveSlotIndex().find((slot) => slot.id === id);
  const name = options.name
    ? getUniqueSaveSlotName(options.name, id)
    : existing?.name ?? getUniqueSaveSlotName(state.player.fullName, id);
  const summary: SaveSlotSummary = {
    id,
    name,
    playerName: state.player.fullName,
    season: state.season,
    date: state.currentDate,
    updatedAt: new Date().toISOString(),
  };
  writeCareerStorage(
    `${SAVE_SLOT_PREFIX}${id}`,
    options.serialized ?? encodeCareerSave({ ...state, schemaVersion: SAVE_SCHEMA_VERSION }),
  );
  writeSaveSlotIndex([
    summary,
    ...readSaveSlotIndex().filter((slot) => slot.id !== id),
  ]);
  return summary;
}

export function useGameState() {
  const [saveWarning, setSaveWarning] = useState('');
  const saveRevision = useRef(0);
  const lastAutosaveSnapshot = useRef<{slotId: string | null; serialized: string} | null>(null);
  const [gameState, setGameState] = useState<GameState>(() =>
    loadStoredState(),
  );
  const [careerSessionMode, setCareerSessionMode] =
    useState<CareerSessionMode>("launcher");
  const [hasActiveCareer, setHasActiveCareer] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.localStorage.getItem(STORAGE_KEY)),
  );
  const [activeSaveSlotId, setActiveSaveSlotId] = useState<string | null>(() => {
    const existingId = readActiveSaveSlotId();
    if (existingId || !hasActiveCareer || typeof window === "undefined") {
      return existingId;
    }
    const slot = persistCareerSlot(gameState, {
      id: "migrated-active-career",
      name: `${gameState.player.fullName} · ${gameState.season}`,
    });
    writeActiveSaveSlotId(slot.id);
    return slot.id;
  });

  useEffect(() => {
    if (typeof window === "undefined" || careerSessionMode !== "active") return;
    const reportSaveWarning = (message: string) => queueMicrotask(() => setSaveWarning(message));
    const revision = ++saveRevision.current;
    const serialized = encodeCareerSave(gameState);
    const publish = () => {
      writeCareerStorage(STORAGE_KEY, serialized);
      if (activeSaveSlotId) persistCareerSlot(gameState, { id: activeSaveSlotId, serialized });
    };
    const previous = window.localStorage.getItem(STORAGE_KEY);
    const rendered = lastAutosaveSnapshot.current?.slotId === activeSaveSlotId ? lastAutosaveSnapshot.current.serialized : null;
    lastAutosaveSnapshot.current = { slotId: activeSaveSlotId, serialized };
    const rolloverPayloads = [...new Set([previous, rendered].filter((payload): payload is string => {
      if (!payload) return false;
      try {
        const old = readRecoveryState(payload);
        return old.player.id === gameState.player.id && (old.season !== gameState.season || Boolean(old.seasonReview?.pending && !gameState.seasonReview?.pending));
      } catch { return false; }
    }))];
    const prizeCorrection = Boolean(previous && gameState.payoutRepair?.version === 1 && (() => {
      try { const old=readRecoveryState(previous); return old.player.id===gameState.player.id && !old.payoutRepair && Boolean(gameState.payoutRepair.events || gameState.payoutRepair.adjustments.length); } catch { return false; }
    })());
    if (typeof indexedDB === 'undefined') {
      if(prizeCorrection) {reportSaveWarning('Prize correction is not saved: backup storage is unavailable. Your original save is preserved. Enable browser storage and reload to retry.');return;}
      try { publish(); reportSaveWarning('Automatic backups unavailable. Export a portable backup in Save Manager.'); }
      catch (error) { reportSaveWarning(error instanceof Error ? error.message : 'Autosave failed.'); }
      return;
    }
    const rollover = rolloverPayloads.length > 0 || prizeCorrection;
    const careerId = activeSaveSlotId ?? gameState.player.id;
    if (!rollover) {
      try { publish(); }
      catch (error) { reportSaveWarning(error instanceof Error ? error.message : 'Autosave failed.'); return; }
    }
    void queueProtectedSave(async () => {
      if (readActiveSaveSlotId() !== activeSaveSlotId) return;
      // Commit the recovery transaction before the old season is overwritten.
      if (rollover) {
        for (const payload of rolloverPayloads) await storeRecoverySave(careerId, payload, 'Before season rollover');
        if (prizeCorrection && previous) await storeRecoverySave(careerId, previous, 'Before prize correction');
        if (readActiveSaveSlotId() !== activeSaveSlotId || saveRevision.current !== revision) return;
        publish();
      }
      await storeRecoverySave(careerId, serialized, 'Automatic');
      if (readActiveSaveSlotId() === activeSaveSlotId) reportSaveWarning('');
    }).catch(error => reportSaveWarning((rollover ? 'Check Save Manager before closing: recovery backup or autosave failed. ' : '') + (error instanceof Error ? error.message : 'Automatic backup failed. Export a portable backup.')));
  }, [activeSaveSlotId, careerSessionMode, gameState]);

  const actions = useMemo(
    () => ({
      updateFirstWeekGuide(action:'dismiss'|'resume'|'skip'|'equipment',step?:GuideStep) {
        setGameState(previous=>{
          const guide=previous.firstWeekGuide??freshGuide(previous);
          return reconcileFirstWeekGuide({...previous,firstWeekGuide:{...guide,dismissed:action==='dismiss'?true:action==='resume'?false:guide.dismissed,skipped:action==='resume'?[]:action==='skip'&&step?[...new Set([...guide.skipped,step])]:guide.skipped,equipmentReviewed:action==='equipment'&&getMissingTournamentEquipment(previous.equipment).length===0||guide.equipmentReviewed}});
        });
      },
      actOnRealism(action: RealismAction) {
        setGameState(previous => {
          const next = realismAction(previous, action);
          return finalizeState(next, next.lastAction);
        });
      },
      actOnCareer(action: CareerDepthAction) {
        setGameState(previous => {
          const next = careerDepthAction(previous, action);
          return finalizeState(next, next.lastAction);
        });
      },
      beginNewCareer() {
        setCareerSessionMode("creating");
      },
      continueActiveCareer() {
        if (
          typeof window === "undefined" ||
          !window.localStorage.getItem(STORAGE_KEY)
        )
          return false;
        const storedState = loadStoredState();
        let slotId = readActiveSaveSlotId();
        if (!slotId) {
          const slot = persistCareerSlot(storedState, {
            name: `${storedState.player.fullName} · ${storedState.season}`,
          });
          slotId = slot.id;
          writeActiveSaveSlotId(slotId);
        }
        setActiveSaveSlotId(slotId);
        setGameState(storedState);
        setCareerSessionMode("active");
        return true;
      },
      startDemoCareer() {
        const demoState = createStarterState();
        const slot = persistCareerSlot(demoState, { name: "Demo Career" });
        window.localStorage.setItem(STORAGE_KEY, encodeCareerSave(demoState));
        writeActiveSaveSlotId(slot.id);
        setActiveSaveSlotId(slot.id);
        setGameState(demoState);
        setCareerSessionMode("active");
        setHasActiveCareer(true);
      },
      listSaveSlots() {
        return readSaveSlotIndex();
      },
      saveToSlot(name: string) {
        if (typeof window === "undefined") return null;
        const normalizedName =
          name.trim() || `${gameState.player.fullName} · ${gameState.season}`;
        const summary = persistCareerSlot(gameState, { name: normalizedName });
        window.localStorage.setItem(STORAGE_KEY, encodeCareerSave(gameState));
        writeActiveSaveSlotId(summary.id);
        setActiveSaveSlotId(summary.id);
        return summary;
      },
      loadSaveSlot(id: string) {
        if (typeof window === "undefined") return false;
        const saved = window.localStorage.getItem(`${SAVE_SLOT_PREFIX}${id}`);
        if (!saved) return false;
        window.localStorage.setItem(STORAGE_KEY, saved);
        writeActiveSaveSlotId(id);
        setActiveSaveSlotId(id);
        setGameState(loadStoredState());
        setCareerSessionMode("active");
        setHasActiveCareer(true);
        return true;
      },
      deleteSaveSlot(id: string) {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(`${SAVE_SLOT_PREFIX}${id}`);
        writeSaveSlotIndex(
          readSaveSlotIndex().filter((slot) => slot.id !== id),
        );
        if (id === activeSaveSlotId) {
          window.localStorage.removeItem(STORAGE_KEY);
          writeActiveSaveSlotId(null);
          setActiveSaveSlotId(null);
          setHasActiveCareer(false);
          setCareerSessionMode("launcher");
        }
      },
      exportCareer() {
        return JSON.stringify(
          { ...gameState, schemaVersion: SAVE_SCHEMA_VERSION },
          null,
          2,
        );
      },
      async restoreRecoverySave(id: string) {
        try {
          await queueProtectedSave(async () => undefined);
          const record = (await listRecoverySaves()).find(item => item.id === id);
          if (!record) throw new Error('That backup is no longer available. Refresh the list.');
          const restored = loadStoredState(validatedRecoveryPayload(record));
          if (careerSessionMode === 'active') {
            await storeRecoverySave(activeSaveSlotId ?? gameState.player.id, encodeCareerSave(gameState), 'Before restore');
          }
          const slot: SaveSlotSummary = { id: createSaveSlotId(), name: getUniqueSaveSlotName(record.player + ' · Recovered'), playerName: restored.player.fullName, season: restored.season, date: restored.currentDate, updatedAt: new Date().toISOString() };
          const payload = encodeCareerSave(restored);
          writeCareerStorageBatch([
            [SAVE_SLOT_PREFIX + slot.id, payload],
            [SAVE_SLOT_INDEX_KEY, JSON.stringify([slot, ...readSaveSlotIndex()])],
            [STORAGE_KEY, payload], [ACTIVE_SAVE_SLOT_KEY, slot.id],
          ]);
          setActiveSaveSlotId(slot.id); setGameState(restored); setCareerSessionMode('active'); setHasActiveCareer(true); setSaveWarning('');
          return { success: true, message: 'Backup restored as a new career copy. Your previous named save is retained.' };
        } catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Could not restore this backup.' }; }
      },
      recoverAttributeHistory(serializedState: string) {
        try {
          recoverAttributeHistory(gameState, serializedState);
          setGameState(previous => recoverAttributeHistory(previous, serializedState));
          return { success: true, message: 'Earlier attribute history recovered. Your career progress is unchanged.' };
        } catch (error) {
          return { success: false, message: error instanceof Error ? error.message : 'Could not read attribute history.' };
        }
      },
      importCareer(serializedState: string) {
        if (typeof window === "undefined") return false;
        try {
          const parsed = JSON.parse(serializedState) as Partial<GameState>;
          if (
            !parsed.player ||
            !Array.isArray(parsed.tournaments) ||
            !parsed.currentDate
          )
            return false;
          window.localStorage.setItem(STORAGE_KEY, encodeCareerSave(parsed));
          const importedState = loadStoredState();
          const slot = persistCareerSlot(importedState, {
            name: `${importedState.player.fullName} · Imported`,
          });
          writeActiveSaveSlotId(slot.id);
          setActiveSaveSlotId(slot.id);
          setGameState(importedState);
          setCareerSessionMode("active");
          setHasActiveCareer(true);
          return true;
        } catch {
          return false;
        }
      },
      markInboxMessageRead(messageId: string, read = true) {
        setGameState((previousState) =>
          finalizeState(
            {
              ...previousState,
              inbox: previousState.inbox.map((message) =>
                message.id === messageId ? { ...message, read } : message,
              ),
            },
            read
              ? "Marked inbox message as read."
              : "Marked inbox message as unread.",
          ),
        );
      },
      markAllInboxRead() {
        setGameState((previousState) =>
          finalizeState(
            {
              ...previousState,
              inbox: previousState.inbox.map((message) => ({
                ...message,
                read: true,
              })),
            },
            "Marked all inbox messages as read.",
          ),
        );
      },
      updateBudgetTargets(targets: Record<string, number>) {
        setGameState((previousState) =>
          updateBudgetTargetsState(previousState, targets),
        );
      },
      recordFinanceExpense(
        description: string,
        category: string,
        amount: number,
      ) {
        setGameState((previousState) =>
          recordFinanceExpenseState(
            previousState,
            description,
            category,
            amount,
          ),
        );
      },
      resetCareer(config?: NewCareerConfig) {
        const newCareer = createNewCareerState(config);
        const slot: SaveSlotSummary = {
          id: createSaveSlotId(),
          name: getUniqueSaveSlotName(newCareer.player.fullName),
          playerName: newCareer.player.fullName,
          season: newCareer.season,
          date: newCareer.currentDate,
          updatedAt: new Date().toISOString(),
        };
        const serialized = encodeCareerSave(newCareer);
        writeCareerStorageBatch([
          [`${SAVE_SLOT_PREFIX}${slot.id}`, serialized],
          [SAVE_SLOT_INDEX_KEY, JSON.stringify([slot, ...readSaveSlotIndex()])],
          [STORAGE_KEY, serialized],
          [ACTIVE_SAVE_SLOT_KEY, slot.id],
        ]);
        setActiveSaveSlotId(slot.id);
        setGameState(newCareer);
        setCareerSessionMode("active");
        setHasActiveCareer(true);
      },
      continueWeek() {
        setGameState((previousState) => advanceWeekState(previousState));
      },
      continueToNextTournament() {
        setGameState((previousState) =>
          continueToNextTournamentState(previousState),
        );
      },
      finishSeason() {
        setGameState(previousState => finishSeasonState(previousState));
      },
      dismissSeasonReview() {
        setGameState(state => state.seasonReview ? { ...state, seasonReview: { ...state.seasonReview, popupDismissed: true } } : state);
      },
      startNextSeason() {
        setGameState((previousState) => startNextSeasonState(previousState));
      },
      hireCoach(
        coachId: string,
        contractLabel?: string,
        requestedSlot?: (typeof COACH_SLOT_NAMES)[number],
      ) {
        setGameState((previousState) =>
          hireCoachState(
            previousState,
            coachId,
            contractLabel,
            requestedSlot,
          ),
        );
      },
      fireCoach(coachId: string) {
        setGameState((previousState) => fireCoachState(previousState, coachId));
      },
      extendCoachContract(coachId: string, contractLabel?: string) {
        setGameState((previousState) => {
          const contract = previousState.coachContracts.find(
            (item) => item.coachId === coachId,
          );
          const coach = previousState.coaches.find(
            (item) => item.id === coachId,
          );
          if (!contract || !coach) return previousState;

          const extensionOption =
            getCoachContractOptions(coach).find(
              (option) => option.label === contractLabel,
            ) ?? getCoachContractOptions(coach)[0];
          const extensionWeeks = parseCoachContractWeeks(extensionOption.label);
          const nextWeeksRemaining = contract.weeksRemaining + extensionWeeks;

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
                      totalCost:
                        extensionOption.weeklyCost *
                        (item.contractWeeks + extensionWeeks),
                      weeksRemaining: nextWeeksRemaining,
                    }
                  : item,
              ),
              inbox: [
                createInboxMessage(
                  {
                    sender: "Staff Office",
                    subject: `${coach.name} contract extended`,
                    preview: `${coach.name} agreed to a ${extensionOption.label.toLowerCase()} extension. ${nextWeeksRemaining} weeks are now remaining at £${extensionOption.weeklyCost} per week.`,
                    priority: "Medium",
                  },
                  "Today",
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Extended ${coach.name}'s contract by ${extensionWeeks} weeks.`,
            "Coach Change",
          );
        });
      },
      negotiateCoachContract(
        coachId: string,
        tone: "Conservative" | "Balanced" | "Ambitious" = "Balanced",
      ) {
        setGameState((previousState) => {
          const contract = previousState.coachContracts.find(
            (item) => item.coachId === coachId,
          );
          const coach = previousState.coaches.find(
            (item) => item.id === coachId,
          );
          if (!contract || !coach) return previousState;

          const outcome = getCoachNegotiationOutcome(
            contract,
            coach,
            previousState.player.reputation,
            tone,
          );
          outcome.nextWeeklyCost = Math.min(contract.weeklyCost, Math.round(outcome.nextWeeklyCost * (1 + coachNegotiationAdjustment(previousState, coachId))));
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
                      sender: "Staff Office",
                      subject: `${coach.name} held firm`,
                      preview: `${tone} cost talks with ${coach.name} did not move the weekly number. The current rate remains £${contract.weeklyCost}.`,
                      priority: "Low",
                    },
                    "Today",
                  ),
                  ...previousState.inbox,
                ].slice(0, 18),
              },
              `${coach.name} rejected the ${tone.toLowerCase()} negotiation approach.`,
              "Coach Change",
            );
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
                confidence: previousState.player.confidence,
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: "Staff Office",
                    subject: `${coach.name} accepted new terms`,
                    preview: `${tone} talks succeeded. ${coach.name}'s weekly cost is now £${outcome.nextWeeklyCost} for the current contract.`,
                    priority: "Medium",
                  },
                  "Today",
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Negotiated ${coach.name}'s weekly cost down to £${outcome.nextWeeklyCost}.`,
            "Coach Change",
          );
        });
      },
      buyCue(cueId: string) {
        setGameState((previousState) => buyCueState(previousState, cueId));
      },
      restockChalk(chalkId: string) {
        setGameState(previousState => restockChalkState(previousState, chalkId));
      },
      buyChalk(chalkId: string) {
        setGameState((previousState) => buyChalkState(previousState, chalkId));
      },
      buyTip(tipId: string) {
        setGameState((previousState) => buyTipState(previousState, tipId));
      },
      buyCase(caseId: string) {
        setGameState((previousState) => {
          if (previousState.equipment.casesOwned.includes(caseId)) {
            return finalizeState(
              {
                ...previousState,
                equipment: {
                  ...previousState.equipment,
                  currentCaseId: caseId,
                },
                player: {
                  ...previousState.player,
                  confidence: previousState.player.confidence,
                },
              },
              "Equipped an owned case.",
            );
          }

          const equipmentCase = caseCatalog.find((item) => item.id === caseId);
          if (!equipmentCase) return previousState;
          if (previousState.player.cash < equipmentCase.price) {
            return finalizeState(
              previousState,
              `Not enough cash to buy ${equipmentCase.name}.`,
            );
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
                confidence: previousState.player.confidence,
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: "Equipment Shop",
                    subject: `${equipmentCase.name} purchased`,
                    preview: `You bought and equipped ${equipmentCase.name} for £${equipmentCase.price}.`,
                    priority: "Low",
                    actionLabel: "Open Cases",
                    actionRoute: "/equipment/cases",
                  },
                  "Today",
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Purchased ${equipmentCase.name}.`,
            "Equipment Purchase",
          );
        });
      },
      buyTableSetup(tableId: string) {
        setGameState((previousState) => {
          if (previousState.equipment.tablesOwned.includes(tableId)) {
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
                  confidence: previousState.player.confidence,
                },
              },
              "Switched your active training facility membership.",
            );
          }

          const tableSetup = tableSetupCatalog.find(
            (item) => item.id === tableId,
          );
          if (!tableSetup) return previousState;
          if (previousState.player.cash < tableSetup.monthlyRental) {
            return finalizeState(
              previousState,
              `Not enough cash buffer to start a membership at ${tableSetup.name}.`,
            );
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
                confidence: previousState.player.confidence,
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: "Facility Manager",
                    subject: `${tableSetup.name} membership started`,
                    preview: `You joined ${tableSetup.name} as your active training facility at ${tableSetup.monthlyRental}/month. Weekly cash flow now reflects the membership.`,
                    priority: "Low",
                    actionLabel: "Open Training Facility",
                    actionRoute: "/equipment/table-setup",
                  },
                  "Today",
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Started a membership at ${tableSetup.name}.`,
            "Facility Membership",
          );
        });
      },
      applyTrainingPlan(nextWeek?: TrainingPlannerDay[]) {
        setGameState((previousState) =>
          applyTrainingPlanState(previousState, nextWeek),
        );
      },
      updateTrainingPlan(trainingPlan: TrainingPlannerDay[]) {
        setGameState((previousState) => ({
          ...previousState,
          trainingPlan: normalizeTrainingPlan(
            trainingPlan,
            previousState.currentDate,
            getEnteredCompetitions(previousState),
          ),
        }));
      },
      enterTournament(tournamentId: string) {
        setGameState((previousState) =>
          enterTournamentState(previousState, tournamentId),
        );
      },
      skipTournament(tournamentId: string) {
        setGameState((previousState) =>
          skipTournamentState(previousState, tournamentId),
        );
      },
      withdrawTournament(tournamentId: string) {
        setGameState((previousState) =>
          withdrawTournamentState(previousState, tournamentId),
        );
      },
      bookTravel(
        tournamentId?: string,
        travelOptionId?: string,
        hotelOptionId?: string,
      ) {
        setGameState((previousState) =>
          bookTravelState(
            previousState,
            tournamentId,
            travelOptionId,
            hotelOptionId,
          ),
        );
      },
      confirmTournamentPreparation(
        tournamentId: string,
        focusId: PreparationFocusId,
        allocations: PreparationAllocations,
        supportIds: PreparationSupportId[],
      ) {
        setGameState((previousState) =>
          confirmTournamentPreparationState(
            previousState,
            tournamentId,
            focusId,
            allocations,
            supportIds,
          ),
        );
      },
      prepareBetweenMatches(choice: BetweenMatchChoice, tournamentId?: string) {
        setGameState(previousState => prepareBetweenMatchesState(previousState, choice, tournamentId));
      },
      simulateMatch(tournamentId?: string) {
        setGameState((previousState) =>
          simulateTournamentMatchState(previousState, tournamentId),
        );
      },
      startLiveMatch(tournamentId?: string) {
        setGameState((previousState) =>
          startLiveMatchState(previousState, tournamentId),
        );
      },
      playLiveVisit(decision: LiveVisitDecision) {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(
              previousState,
              "There is no active live match.",
            );
          }

          const progressedLiveMatch: LiveMatchState = advanceLiveVisit(
            previousState.liveMatch,
            decision,
            "manual",
          );
          return progressedLiveMatch.status === "Completed"
            ? finalizeLiveMatch(
                { ...previousState, liveMatch: progressedLiveMatch },
                progressedLiveMatch,
              )
            : finalizeState(
                { ...previousState, liveMatch: progressedLiveMatch },
                progressedLiveMatch.lastVisitSummary,
              );
        });
      },
      simulateLiveVisit() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(
              previousState,
              "There is no live visit to simulate.",
            );
          }

          const progressedLiveMatch: LiveMatchState = advanceLiveVisit(
            previousState.liveMatch,
            undefined,
            "simulated",
          );
          return progressedLiveMatch.status === "Completed"
            ? finalizeLiveMatch(
                { ...previousState, liveMatch: progressedLiveMatch },
                progressedLiveMatch,
              )
            : finalizeState(
                { ...previousState, liveMatch: progressedLiveMatch },
                progressedLiveMatch.lastVisitSummary,
              );
        });
      },
      simulateLiveShot() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(
              previousState,
              "There is no live shot to simulate.",
            );
          }

          const progressedLiveMatch: LiveMatchState = advanceLiveVisit(
            previousState.liveMatch,
            undefined,
            "manual",
            "shot",
          );
          return progressedLiveMatch.status === "Completed"
            ? finalizeLiveMatch(
                { ...previousState, liveMatch: progressedLiveMatch },
                progressedLiveMatch,
              )
            : finalizeState(
                { ...previousState, liveMatch: progressedLiveMatch },
                progressedLiveMatch.lastVisitSummary,
              );
        });
      },
      continueLiveFrame() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(
              previousState,
              "There is no active live match.",
            );
          }

          const progressedLiveMatch: LiveMatchState = playOutLiveFrame(
            previousState.liveMatch,
            "manual",
          );
          return progressedLiveMatch.status === "Completed"
            ? finalizeLiveMatch(
                { ...previousState, liveMatch: progressedLiveMatch },
                progressedLiveMatch,
              )
            : finalizeState(
                { ...previousState, liveMatch: progressedLiveMatch },
                `Played out ${progressedLiveMatch.frameHistory.at(-1)?.frame ?? "the current frame"} through the visit engine.`,
              );
        });
      },
      simulateLiveFrame() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(
              previousState,
              "There is no live frame to simulate.",
            );
          }

          const progressedLiveMatch: LiveMatchState = playOutLiveFrame(
            previousState.liveMatch,
            "simulated",
          );
          return progressedLiveMatch.status === "Completed"
            ? finalizeLiveMatch(
                { ...previousState, liveMatch: progressedLiveMatch },
                progressedLiveMatch,
              )
            : finalizeState(
                { ...previousState, liveMatch: progressedLiveMatch },
                `Simulated ${progressedLiveMatch.frameHistory.at(-1)?.frame ?? "the next frame"}.`,
              );
        });
      },
      simulateLiveMatch() {
        setGameState((previousState) => {
          let nextState: GameState = previousState;

          const equipmentMessage = getTournamentEquipmentMessage(
            nextState.equipment,
          );
          if (equipmentMessage) {
            return finalizeState(nextState, equipmentMessage);
          }

          if (!nextState.liveMatch) {
            const tournament = getNextEligibleTournament(nextState);
            if (!tournament) {
              return finalizeState(
                nextState,
                "There is no live match to simulate.",
              );
            }

            const playability = getTournamentPlayability(nextState, tournament);
            if (!playability.canPlay) {
              return finalizeState(
                nextState,
                playability.reason ??
                  `${tournament.name} is not ready to simulate.`,
              );
            }

            nextState = {
              ...nextState,
              liveMatch: createLiveMatchState(nextState, tournament),
            };
          }

          while (
            nextState.liveMatch &&
            nextState.liveMatch.status === "In Progress" &&
            !pendingMatchBreak(nextState.liveMatch)
          ) {
            const progressedLiveMatch: LiveMatchState = playOutLiveFrame(
              nextState.liveMatch,
              "simulated",
            );
            nextState =
              progressedLiveMatch.status === "Completed"
                ? finalizeLiveMatch(
                    { ...nextState, liveMatch: progressedLiveMatch },
                    progressedLiveMatch,
                  )
                : { ...nextState, liveMatch: progressedLiveMatch };
          }

          return nextState;
        });
      },
      updateLiveMatchTactics(
        updates: Partial<
          Pick<LiveMatchState, "tacticalPlan" | "mentalFocus" | "tempo">
        >,
      ) {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(
              previousState,
              "There is no active live match to adjust.",
            );
          }

          const nextSelections = {
            tacticalPlan:
              updates.tacticalPlan ?? previousState.liveMatch.tacticalPlan,
            mentalFocus:
              updates.mentalFocus ?? previousState.liveMatch.mentalFocus,
            tempo: updates.tempo ?? previousState.liveMatch.tempo,
          };
          const nextPrompt = getLiveMatchCoachPrompt({
            playerFrames: previousState.liveMatch.playerFrames,
            opponentFrames: previousState.liveMatch.opponentFrames,
            pressureValue: previousState.liveMatch.pressureValue,
            playerFatigue: previousState.liveMatch.playerFatigue,
            opponentApproach: previousState.liveMatch.opponentApproach,
            ...nextSelections,
          });
          const nextLiveMatch: LiveMatchState = {
            ...previousState.liveMatch,
            ...updates,
            tacticalEdge: getTacticalMatchupEdge(
              nextSelections.tacticalPlan,
              previousState.liveMatch.opponentApproach,
            ),
            coachPrompt: nextPrompt,
            lastTacticalNote: `${nextSelections.tacticalPlan} plan, ${nextSelections.mentalFocus.toLowerCase()} focus, ${nextSelections.tempo.toLowerCase()} tempo ready for the next frame.`,
          };

          return finalizeState(
            {
              ...previousState,
              liveMatch: nextLiveMatch,
            },
            `Updated the live tactical settings against a ${previousState.liveMatch.opponentApproach.toLowerCase()} opponent.`,
          );
        });
      },
      applyLiveCoachCue() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(
              previousState,
              "There is no active live match for a coach cue.",
            );
          }

          const prompt = previousState.liveMatch.coachPrompt;
          const nextLiveMatch: LiveMatchState = {
            ...previousState.liveMatch,
            tacticalPlan: prompt.recommendedPlan,
            mentalFocus: prompt.recommendedMentalFocus,
            tempo: prompt.recommendedTempo,
            tacticalEdge:
              getTacticalMatchupEdge(
                prompt.recommendedPlan,
                previousState.liveMatch.opponentApproach,
              ),
            playerConfidence: previousState.liveMatch.playerConfidence,
            lastTacticalNote: `${prompt.title}: ${prompt.note}`,
            feed: (
              [
                {
                  id: `feed-coach-${Date.now()}`,
                  time: `${String(Math.floor(previousState.liveMatch.timeElapsedMinutes / 60)).padStart(2, "0")}:${String(previousState.liveMatch.timeElapsedMinutes % 60).padStart(2, "0")}`,
                  text: `Coach cue applied: ${prompt.recommendedPlan.toLowerCase()} plan, ${prompt.recommendedMentalFocus.toLowerCase()} focus, ${prompt.recommendedTempo.toLowerCase()} tempo.`,
                  actor: "System" as const,
                  tone: "blue" as const,
                },
                ...previousState.liveMatch.feed,
              ] satisfies LiveFeedItem[]
            ).slice(0, 12),
          };

          return finalizeState(
            {
              ...previousState,
              liveMatch: nextLiveMatch,
            },
            `Applied coach cue: ${prompt.title}.`,
          );
        });
      },
      takeLiveMatchTimeout() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(
              previousState,
              "There is no active live match to pause.",
            );
          }
          if (previousState.liveMatch.timeoutsRemaining <= 0) {
            return finalizeState(
              previousState,
              "No live-match timeouts remain.",
            );
          }

          const nextOpponentApproach =
            previousState.liveMatch.playerFrames <
            previousState.liveMatch.opponentFrames
              ? "Tight"
              : previousState.liveMatch.playerFrames >
                  previousState.liveMatch.opponentFrames
                ? "Pressing"
                : "Measured";
          const timeoutAdjustment = buildOpponentAdjustmentEvent({
            previousApproach: previousState.liveMatch.opponentApproach,
            nextApproach: nextOpponentApproach,
            frameLabel:
              previousState.liveMatch.currentFrame === 1
                ? "Pre-frame"
                : `F${previousState.liveMatch.currentFrame}`,
            nextPlayerFrames: previousState.liveMatch.playerFrames,
            nextOpponentFrames: previousState.liveMatch.opponentFrames,
            pressureValue: clamp(
              previousState.liveMatch.pressureValue - 10,
              20,
              96,
            ),
            trigger: "Timeout",
          });

          const nextLiveMatch: LiveMatchState = {
            ...previousState.liveMatch,
            timeoutsRemaining: previousState.liveMatch.timeoutsRemaining - 1,
            playerConfidence: clamp(
              previousState.liveMatch.playerConfidence + 4,
              25,
              99,
            ),
            playerFatigue: clamp(
              previousState.liveMatch.playerFatigue - 3,
              0,
              100,
            ),
            pressureValue: clamp(
              previousState.liveMatch.pressureValue - 10,
              20,
              96,
            ),
            pressureLabel:
              previousState.liveMatch.pressureValue - 10 >= 78
                ? "High"
                : previousState.liveMatch.pressureValue - 10 >= 58
                  ? "Building"
                  : "Stable",
            intervalText:
              "Timeout taken. The player had a reset, slowed the pace, and settled before the next frame.",
            lastTacticalNote:
              "Timeout used to reset confidence and reduce pressure before the next frame.",
            opponentApproach: nextOpponentApproach,
            feed: (
              [
                {
                  id: `feed-timeout-${Date.now()}`,
                  time: `${String(Math.floor(previousState.liveMatch.timeElapsedMinutes / 60)).padStart(2, "0")}:${String(previousState.liveMatch.timeElapsedMinutes % 60).padStart(2, "0")}`,
                  text: `${previousState.liveMatch.playerName} uses a timeout to regroup before ${previousState.liveMatch.currentFrame === 1 ? "the opening frame" : `F${previousState.liveMatch.currentFrame}`}.`,
                  actor: "System" as const,
                  tone: "blue" as const,
                },
                timeoutAdjustment
                  ? {
                      id: `feed-timeout-adjustment-${Date.now()}`,
                      time: `${String(Math.floor(previousState.liveMatch.timeElapsedMinutes / 60)).padStart(2, "0")}:${String(previousState.liveMatch.timeElapsedMinutes % 60).padStart(2, "0")}`,
                      text: `Opponent adjustment: ${timeoutAdjustment.note}`,
                      actor: "System" as const,
                      tone: "blue" as const,
                    }
                  : null,
                ...previousState.liveMatch.feed,
              ].filter(Boolean) as LiveFeedItem[]
            ).slice(0, 12),
            coachPrompt: getLiveMatchCoachPrompt({
              playerFrames: previousState.liveMatch.playerFrames,
              opponentFrames: previousState.liveMatch.opponentFrames,
              pressureValue: clamp(
                previousState.liveMatch.pressureValue - 10,
                20,
                96,
              ),
              playerFatigue: clamp(
                previousState.liveMatch.playerFatigue - 3,
                0,
                100,
              ),
              opponentApproach: nextOpponentApproach,
              tacticalPlan: previousState.liveMatch.tacticalPlan,
              mentalFocus: previousState.liveMatch.mentalFocus,
              tempo: previousState.liveMatch.tempo,
            }),
            lastOpponentAdjustment: timeoutAdjustment,
            opponentAdjustmentHistory: timeoutAdjustment
              ? [
                  timeoutAdjustment,
                  ...previousState.liveMatch.opponentAdjustmentHistory,
                ].slice(0, 4)
              : previousState.liveMatch.opponentAdjustmentHistory,
          };

          return finalizeState(
            {
              ...previousState,
              liveMatch: nextLiveMatch,
            },
            "Used a live-match timeout to reset the player.",
          );
        });
      },
      concedeLiveFrame() {
        setGameState((previousState) => {
          if (!previousState.liveMatch) {
            return finalizeState(
              previousState,
              "There is no active live frame to concede.",
            );
          }

          const liveMatch = previousState.liveMatch;
          if (pendingMatchBreak(liveMatch) || liveMatch.status === 'Completed') return previousState;
          const concededLiveMatch: LiveMatchState = {
            ...liveMatch,
            currentBreak: 0,
            playerAtTable: liveMatch.opponentName,
            tableState: { redsRemaining: 0, coloursRemaining: [] },
            ballsRemaining: 0,
            timeElapsedMinutes: liveMatch.timeElapsedMinutes + 2,
            intervalText: `${liveMatch.playerName} conceded frame ${liveMatch.currentFrame}.`,
            lastVisitSummary: `Frame ${liveMatch.currentFrame} conceded.`,
            feed: (
              [
                {
                  id: `feed-concede-${Date.now()}`,
                  time: `${String(Math.floor(liveMatch.timeElapsedMinutes / 60)).padStart(2, "0")}:${String(liveMatch.timeElapsedMinutes % 60).padStart(2, "0")}`,
                  text: `${liveMatch.playerName} concedes frame ${liveMatch.currentFrame}.`,
                  actor: "System" as const,
                  tone: "amber" as const,
                },
                ...liveMatch.feed,
              ] satisfies LiveFeedItem[]
            ).slice(0, 16),
          };
          const progressedLiveMatch = resolveCompletedLiveFrame(
            concededLiveMatch,
            "Played",
            "Player",
          );

          return progressedLiveMatch.status === "Completed"
            ? finalizeLiveMatch(
                { ...previousState, liveMatch: progressedLiveMatch },
                progressedLiveMatch,
              )
            : finalizeState(
                { ...previousState, liveMatch: progressedLiveMatch },
                progressedLiveMatch.lastVisitSummary,
              );
        });
      },
      acceptSponsor(sponsorId: string, requestedSlot?: string) {
        setGameState((previousState) =>
          acceptSponsorState(previousState, sponsorId, requestedSlot),
        );
      },
      renewSponsor(sponsorId: string) {
        setGameState((previousState) =>
          renewSponsorState(previousState, sponsorId),
        );
      },
      renegotiateSponsor(sponsorId: string) {
        setGameState((previousState) =>
          renegotiateSponsorState(previousState, sponsorId),
        );
      },
      declineSponsorRenewal(sponsorId: string) {
        setGameState((previousState) =>
          declineSponsorRenewalState(previousState, sponsorId),
        );
      },
      rejectSponsor(sponsorId: string) {
        setGameState((previousState) => {
          const offer = findSponsorOfferFromState(previousState, sponsorId);
          if (!offer) return previousState;
          if (offer.status === "Rejected") {
            return finalizeState(
              previousState,
              `${offer.name} has already been rejected.`,
            );
          }
          if (offer.status === "Accepted") {
            return finalizeState(
              previousState,
              `${offer.name} is already active and cannot be rejected from this screen.`,
            );
          }

          return finalizeState(
            {
              ...previousState,
              sponsorOffers: previousState.sponsorOffers.map((item) =>
                item.id === sponsorId
                  ? {
                      ...item,
                      status: "Rejected",
                      notes: [
                        ...item.notes,
                        `Rejected in week ${previousState.week}.`,
                      ],
                    }
                  : item,
              ),
              player: {
                ...previousState.player,
                morale: clamp(
                  previousState.player.morale - (offer.brandFit < 55 ? 0 : 1),
                  0,
                  100,
                ),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: "Commercial Team",
                    subject: `${offer.name} offer declined`,
                    preview: `${offer.name} has been removed from the current offer list. Your team can reopen talks later if needed.`,
                    priority: "Low",
                    actionLabel: "Review Offers",
                    actionRoute: "/sponsorship",
                  },
                  "Today",
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Rejected the ${offer.name} sponsorship offer.`,
            "Sponsor Decision",
          );
        });
      },
      negotiateSponsor(
        sponsorId: string,
        negotiationLabel?: string,
        tone: "Conservative" | "Balanced" | "Ambitious" = "Balanced",
      ) {
        setGameState((previousState) => {
          const offer = findSponsorOfferFromState(previousState, sponsorId);
          if (!offer) return previousState;
          const marketBlocker = seasonalSponsorBlocker(previousState, offer);
          if (marketBlocker) return finalizeState(previousState, marketBlocker);
          if (offer.status !== "Available") {
            return finalizeState(
              previousState,
              `${offer.name} is no longer open for negotiation.`,
            );
          }
          if (offer.negotiationCount >= 2) {
            return finalizeState(
              previousState,
              `${offer.name} has no further room for negotiation right now.`,
            );
          }

          const selectedOption =
            negotiationOptionCatalog.find(
              (item) => item.label === negotiationLabel,
            ) ?? negotiationOptionCatalog[0];
          const toneModifier =
            tone === "Conservative" ? 8 : tone === "Ambitious" ? -10 : 0;
          const introduction = depthOf(previousState).commercialIntroduction;
          const introductionApplies = introduction?.offerId === sponsorId && !introduction.used && introduction.expiresDate >= previousState.currentDate;
          const success =
            Math.random() * 100 <
            clamp(selectedOption.probability + toneModifier + (introductionApplies ? 5 : 0), 10, 90);

          const updatedOffers = previousState.sponsorOffers.map((item) => {
            if (item.id !== sponsorId) return item;

            if (!success) {
              return {
                ...item,
                negotiationCount: item.negotiationCount + 1,
                notes: [
                  ...item.notes,
                  `${selectedOption.label} request declined (${tone.toLowerCase()}).`,
                ],
              };
            }

            let monthlyValue = item.monthlyValue;
            let contractLength = item.contractLength;
            let behaviour = item.behaviour;
            let bonusClause = item.bonusClause;

            if (selectedOption.label === "Increase Base Pay") {
              monthlyValue = Math.round(item.monthlyValue * 1.1);
            }
            if (selectedOption.label === "Reduce Obligations") {
              monthlyValue = Math.max(item.seasonal ? 50 : 200, item.monthlyValue - 150);
              behaviour = `${item.behaviour} · Reduced appearance load`;
            }
            if (selectedOption.label === "Add Title Bonus") {
              monthlyValue = Math.max(item.seasonal ? 50 : 200, item.monthlyValue - 250);
              bonusClause = `${item.bonusClause} · Ranking title +£5,000`;
            }
            if (selectedOption.label === "Shorten Contract Length") {
              monthlyValue = Math.max(item.seasonal ? 50 : 200, item.monthlyValue - 200);
              contractLength = item.seasonal ? Math.max(3, Math.min(18, Number.parseInt(item.contractLength, 10) - 3)) + " months" : "18 months";
            }

            return {
              ...item,
              monthlyValue,
              contractLength,
              behaviour,
              bonusClause,
              negotiationCount: item.negotiationCount + 1,
              note: `${selectedOption.label} approved`,
              notes: [
                ...item.notes,
                `${selectedOption.label} approved with a ${tone.toLowerCase()} tone.`,
              ],
            };
          });

          return finalizeState(
            {
              ...previousState,
              sponsorOffers: updatedOffers,
              careerDepth: { ...depthOf(previousState), commercialIntroduction: introductionApplies ? { ...introduction!, used: true } : introduction },
              player: {
                ...previousState.player,
                confidence: supportedConfidence(previousState.player.confidence, success ? 1 : -1),
                morale: clamp(
                  previousState.player.morale + (success ? 2 : -1),
                  0,
                  100,
                ),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: "Commercial Team",
                    subject: `${offer.name} negotiation ${success ? "updated" : "stalled"}`,
                    preview: success
                      ? `${selectedOption.label} was accepted. Revised monthly value is now under review.`
                      : `${offer.name} pushed back on the ${selectedOption.label.toLowerCase()} request.`,
                    priority: success ? "Medium" : "Low",
                    actionLabel: success ? "Review Deal" : "Reopen Deal",
                    actionRoute: `/sponsorship/contract?offer=${offer.id}`,
                  },
                  "Today",
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            success
              ? `Negotiated improved terms with ${offer.name}.`
              : `${offer.name} declined the latest negotiation request.`,
            "Sponsor Negotiation",
          );
        });
      },
      updateEquipmentSetup(setup: {
        cueId?: string;
        chalkId?: string;
        tipId?: string;
      }) {
        setGameState((previousState) => {
          if (
            setup.cueId &&
            !previousState.equipment.cuesOwned.includes(setup.cueId)
          ) {
            return finalizeState(
              previousState,
              "You need to own a cue before equipping it.",
            );
          }

          const selectedChalk = setup.chalkId
            ? chalkCatalog.find((item) => item.id === setup.chalkId)
            : undefined;
          const selectedTip = setup.tipId
            ? tipCatalog.find((item) => item.id === setup.tipId)
            : undefined;
          const chalkCost =
            selectedChalk &&
            !previousState.equipment.chalkOwned.includes(selectedChalk.id)
              ? selectedChalk.cost
              : 0;
          const tipCost =
            selectedTip &&
            !previousState.equipment.tipsOwned.includes(selectedTip.id)
              ? selectedTip.cost
              : 0;
          const totalCost = chalkCost + tipCost;

          if (previousState.player.cash < totalCost) {
            return finalizeState(
              previousState,
              `Not enough cash to complete this setup change (£${totalCost}).`,
            );
          }

          const nextEquipment = {
            ...previousState.equipment,
            currentCueId: setup.cueId ?? previousState.equipment.currentCueId,
            currentChalkId:
              setup.chalkId ?? previousState.equipment.currentChalkId,
            currentTipId: setup.tipId ?? previousState.equipment.currentTipId,
            chalkOwned:
              selectedChalk &&
              !previousState.equipment.chalkOwned.includes(selectedChalk.id)
                ? [...previousState.equipment.chalkOwned, selectedChalk.id]
                : previousState.equipment.chalkOwned,
            tipsOwned:
              selectedTip &&
              !previousState.equipment.tipsOwned.includes(selectedTip.id)
                ? [...previousState.equipment.tipsOwned, selectedTip.id]
                : previousState.equipment.tipsOwned,
          };

          const purchasedItems = [
            selectedChalk && chalkCost > 0 ? selectedChalk.name : null,
            selectedTip && tipCost > 0 ? selectedTip.name : null,
          ].filter(Boolean);
          const equippedItems = [selectedChalk?.name, selectedTip?.name].filter(
            Boolean,
          );

          return finalizeState(
            {
              ...previousState,
              equipment: nextEquipment,
              player: {
                ...previousState.player,
                cash: previousState.player.cash - totalCost,
                confidence: previousState.player.confidence,
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: "Equipment Room",
                    subject: "Setup updated",
                    preview: `${equippedItems.join(" and ")} ${purchasedItems.length > 0 ? `prepared. Purchases: ${purchasedItems.join(", ")}.` : "equipped from your current inventory."}`,
                    priority: "Low",
                    actionLabel: "Open Chalk & Tip Setup",
                    actionRoute: "/equipment/chalk-tips",
                  },
                  "Today",
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            totalCost > 0
              ? `Updated the active equipment setup for £${totalCost}.`
              : "Updated the active equipment setup.",
          );
        });
      },
      performMaintenance(actionId?: string) {
        setGameState((previousState) => {
          const maintenanceAction =
            maintenanceActionCatalog.find((item) => item.id === actionId) ??
            maintenanceActionCatalog[0];
          if (!maintenanceAction) return previousState;
          if (!previousState.equipment.currentCueId) {
            return finalizeState(
              previousState,
              "You need to equip a cue before using maintenance.",
            );
          }
          if (previousState.player.cash < maintenanceAction.cost) {
            return finalizeState(
              previousState,
              `Not enough cash to ${maintenanceAction.action.toLowerCase()}.`,
            );
          }

          const currentCueState = getCueState(
            previousState.equipment,
            previousState.equipment.currentCueId,
          );
          const restorationScore = maintenanceAction.restoration.reduce(
            (sum, item) => sum + item.value,
            0,
          );
          const durabilityGain =
            maintenanceAction.restoration.find(
              (item) => item.label === "Durability",
            )?.value ?? Math.round(restorationScore / 5);
          const updatedCueState: CueConditionState = {
            condition: clamp(
              currentCueState.condition + Math.round(restorationScore / 2),
              0,
              100,
            ),
            familiarity: clamp(currentCueState.familiarity + 1, 0, 100),
            durability: clamp(
              currentCueState.durability + durabilityGain,
              0,
              100,
            ),
            tipCondition: clamp(
              currentCueState.tipCondition + Math.round(restorationScore / 1.8),
              0,
              100,
            ),
            shaftStraightness: clamp(
              currentCueState.shaftStraightness +
                Math.round(restorationScore / 3),
              0,
              100,
            ),
          };

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
                    technician: "Career Workshop",
                    result: "Complete",
                  },
                  ...previousState.maintenance.history,
                ].slice(0, 20),
              },
              player: {
                ...previousState.player,
                cash: previousState.player.cash - maintenanceAction.cost,
                confidence: previousState.player.confidence,
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: "Equipment Room",
                    subject: `${maintenanceAction.action} completed`,
                    preview: `The active cue has been serviced. Condition and reliability improved immediately.`,
                    priority: "Medium",
                    actionLabel: "Open Maintenance",
                    actionRoute: "/equipment/maintenance",
                  },
                  "Today",
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Completed ${maintenanceAction.action.toLowerCase()} on the active cue.`,
            "Cue Maintenance",
          );
        });
      },
      scheduleTreatment(optionId?: string) {
        setGameState((previousState) =>
          scheduleTreatmentState(previousState, optionId),
        );
      },
      applyRecoveryPlan(actionTitle?: string) {
        setGameState((previousState) => {
          const nextAttributes = deepCloneAttributes(previousState.attributes);
          improveAttribute(nextAttributes, "Focus", 2);
          improveAttribute(nextAttributes, "Composure", 1);

          return finalizeState(
            {
              ...previousState,
              attributes: nextAttributes,
              player: {
                ...previousState.player,
                confidence: supportedConfidence(previousState.player.confidence, 6),
                morale: clamp(previousState.player.morale + 4, 0, 100),
                fatigue: clamp(previousState.player.fatigue - 10, 0, 100),
              },
              inbox: [
                createInboxMessage(
                  {
                    sender: "Sports Psychologist",
                    subject: "Recovery plan applied",
                    preview: `${actionTitle ?? "The recovery block"} improved confidence, reduced fatigue, and steadied focus ahead of the next match.`,
                    priority: "Medium",
                    actionLabel: "Open Mental State",
                    actionRoute: "/mental",
                  },
                  "Today",
                ),
                ...previousState.inbox,
              ].slice(0, 18),
            },
            `Applied ${actionTitle?.toLowerCase() ?? "the recovery plan"}.`,
            "Recovery Work",
          );
        });
      },
    }),
    [activeSaveSlotId, careerSessionMode, gameState],
  );

  return useMemo(
    () => ({
      gameState,
      careerSessionMode,
      hasActiveCareer,
      activeSaveSlotId,
      saveWarning,
      ...actions,
    }),
    [actions, activeSaveSlotId, careerSessionMode, gameState, hasActiveCareer, saveWarning],
  );
}
