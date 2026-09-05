export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationality: string;
  age: number;
  dateOfBirth?: string;
  handedness: "Right-handed" | "Left-handed";
  cueStyle?: string;
  careerStage: string;
  careerPhase?: string;
  competitiveStatus?: string;
  playingStyle: string;
  personalityType: string;
  personalityTraits?: PersonalitySlider[];
  rankingLabel: string;
  worldRanking?: number | null;
  amateurRanking?: number | null;
  seniorRanking?: number | null;
  cash: number;
  cashFlow: number;
  form: string[];
  confidence: number;
  fatigue: number;
  reputation: number;
  morale: number;
  legacyScore: number;
  nextEvent: string;
  daysUntilEvent: number;
  inboxCount: number;
  notificationCount: number;
};

export type AttributeGroup = Record<string, number>;

export type PlayerAttributes = {
  technical: AttributeGroup;
  mental: AttributeGroup;
  physical: AttributeGroup;
};

export type Coach = {
  id: string;
  name: string;
  type:
    | "Technical"
    | "Tactical"
    | "Mental"
    | "Fitness"
    | "Cue Action"
    | "Break Building";
  level: "Low" | "Mid" | "High" | "Elite";
  unlockLabel?: string;
  minimumRanking?: number;
  minimumReputation?: number;
  weeklyCost: number;
  reputation: number;
  compatibility: number;
  technical: number;
  tactical: number;
  mental: number;
  motivation: number;
  discipline: number;
  specialism: string;
  strengths: string[];
  weaknesses: string[];
};

export type Cue = {
  id: string;
  name: string;
  price: number;
  tier: "Budget" | "Mid-Tier" | "Elite" | "Legendary";
  condition: number;
  familiarity: number;
  weight: string;
  balance: string;
  touch: number;
  spinControl: number;
  stability: number;
  durability: number;
  bonuses: Record<string, number>;
};

export type Chalk = {
  id: string;
  name: string;
  cost: number;
  grip: number;
  cleanContact: number;
  spinTransfer: number;
  consistency: number;
  miscueReduction: number;
  kickReduction: number;
};

export type Tip = {
  id: string;
  name: string;
  cost: number;
  hardness: string;
  durability: number;
  spinControl: number;
  feel: number;
  consistency: number;
  miscueReduction: number;
};

export type EquipmentCase = {
  id: string;
  name: string;
  price: number;
  tier: "Budget" | "Mid-Tier" | "Elite" | "Legendary";
  protection: number;
  storage: number;
  travelComfort: number;
  presentation: number;
  bonuses: Record<string, number>;
};

export type TableSetup = {
  id: string;
  name: string;
  price: number;
  monthlyRental: number;
  tier:
    | "Budget"
    | "Entry"
    | "Mid-Tier"
    | "High Performance"
    | "Elite"
    | "Championship";
  clothSpeed: number;
  cushionResponse: number;
  pocketForgiveness: number;
  napQuality: number;
  bonuses: Record<string, number>;
};

export type Tournament = {
  sessionFrames?: Record<number, number[]>;
  overnightAfterSessions?: number[];
  venueConditions?: import('../game/realism/types').VenueConditions;
  id: string;
  name: string;
  type:
    | "Junior"
    | "Regional Youth"
    | "National Youth"
    | "Amateur"
    | "Q Tour"
    | "Q School"
    | "Professional Tour"
    | "Ranking"
    | "Major"
    | "Invitational"
    | "Exhibition"
    | "Senior";
  formatId?: string;
  stageId?: number;
  pathwayTier?: string;
  tourCircuit?: string;
  month?: string;
  week?: number;
  eventClass?:
    | "Junior"
    | "Regional Youth"
    | "National Youth"
    | "Amateur"
    | "Q Tour"
    | "Q School"
    | "Professional"
    | "Major"
    | "Invitational"
    | "Exhibition"
    | "Senior";
  location: string;
  startDate: string;
  endDate?: string;
  /** Designated draw lock and ranking removal dates; absent dates use the game calendar defaults. */
  seedingCutoffDate?: string;
  rankingExpiryDate?: string;
  entryFee: number;
  travelCost: number;
  hotelCost: number;
  totalPrizeFund?: number;
  prizeMoney: number;
  winnerPrize?: number;
  runnerUpPrize?: number;
  semiFinalPrize?: number;
  quarterFinalPrize?: number;
  firstRoundPrize?: number;
  rankingType?:
    | "None"
    | "Youth"
    | "Amateur"
    | "Q Tour"
    | "Q School OOM"
    | "World Ranking"
    | "One-Year"
    | "Senior";
  rankingValue: number;
  prestige?: 1 | 2 | 3 | 4 | 5;
  televisedRounds?: string[];
  unlockRequirement?: string;
  progressionImpact?: string;
  seasonOpenAccessLock?: "worldMainDraw" | "worldQualifying" | null;
  reward?: string;
  format: string;
  status:
    | "Available"
    | "Booked"
    | "Entered"
    | "Skipped"
    | "High Cost"
    | "Completed";
  fatigueRisk: "Low" | "Medium" | "High";
};

export type Match = {
  sourceMatchId?: string;
  season?: string;
  opponentId?: string;
  playerTactic?: "Attack" | "Balanced" | "Safety";
  id: string;
  tournamentId: string;
  playedOn?: string;
  round: string;
  bestOf: number;
  playerName: string;
  opponentName: string;
  playerRanking: number;
  opponentRanking: number;
  playerFrames: number;
  opponentFrames: number;
  result: "Won" | "Lost" | "In Progress";
  highestBreak: number;
  opponentHighestBreak: number;
  fifties: number;
  centuries: number;
  potSuccess: number;
  longPotSuccess: number;
  safetySuccess: number;
  fouls: number;
  confidenceChange: number;
  fatigueChange: number;
  prizeMoneyEarned: number;
  rankingPointsGained: number;
  plannedWinChance?: number;
  winProbability?: number;
  playerStrength?: number;
  opponentStrength?: number;
  opponentRankBand?: string;
  tournamentClass?: string;
  frameHistory?: FrameScoreRow[];
  sponsorBonusEarned?: number;
  equipmentWear?: number;
  familiarityGained?: number;
  strainImpact?: number;
};

export type RankingRow = {
  id: string;
  playerName: string;
  nation: string;
  ranking: number;
  movement: number;
  points: number;
  prizeMoney: number;
  highlighted?: boolean;
};

export type TrainingSlot = {
  day: string;
  morning: string;
  afternoon: string;
  evening: string;
};

export type InboxMessage = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  priority: "Low" | "Medium" | "High";
  date: string;
  read?: boolean;
  actionLabel?: string;
  actionRoute?: string;
  summary?: Array<{
    label: string;
    value: string;
    detail?: string;
    tone?: "positive" | "negative" | "warning" | "neutral";
  }>;
};

export type SponsorDeal = {
  id: string;
  name: string;
  category: string;
  slot: string;
  monthlyValue: number;
  contractLength: string;
  weeksRemaining: number;
  brandFit: number;
  risk: "Low" | "Medium" | "High";
  bonusClause?: string;
  behaviour?: string;
  obligationLoad?: number;
  weeklyFatigueCost?: number;
  perk?: "Equipment" | "Travel" | "Recovery" | "Publicity" | "None";
  bonusesPaid?: string[];
  totalBonusPaid?: number;
  compliance?: number;
  missedObligations?: number;
  fulfilledObligations?: number;
  renewalStatus?: "None" | "Offered" | "Accepted" | "Declined";
  renewalOfferValue?: number;
  lastLifecycleEvent?: string;
};

export type CueConditionState = {
  condition: number;
  familiarity: number;
  durability: number;
  tipCondition: number;
  shaftStraightness: number;
};

export type EquipmentState = {
  currentCueId: string | null;
  currentChalkId: string | null;
  currentTipId: string | null;
  currentCaseId: string | null;
  currentTableId: string | null;
  cuesOwned: string[];
  chalkOwned: string[];
  tipsOwned: string[];
  casesOwned: string[];
  tablesOwned: string[];
  cueStates: Record<string, CueConditionState>;
  chalkCondition: number;
  chalkStock: Record<string, number>;
  /** Condition of the active unit for each owned product; stock includes that unit. */
  chalkConditions?: Record<string, number>;
  tipStock: Record<string, number>;
};

export type TrainingConditionState = {
  rollingLoad: number;
  strain: number;
  injuryWeeks: number;
  burnout: number;
  seasonStartAttributes: PlayerAttributes;
  reportSnapshot?: {
    weeksTracked: number;
    attributes: PlayerAttributes;
    fatigue: number;
    strain: number;
    burnout: number;
    date: string;
    confidence?: number;
    morale?: number;
    ranking?: number | null;
    form?: number;
    lastReport?: {
      startDate: string;
      endDate: string;
      changes: Array<{
        group: "technical" | "mental" | "physical";
        label: string;
        delta: number;
        current: number;
      }>;
      trainingLoad: number;
      adaptation: number;
      fatigueChange: number;
      strainChange: number;
      burnoutChange: number;
    };
  };
};

export type HealthIssue = {
  id: string;
  issue: string;
  bodyArea: "Back" | "Shoulder" | "Wrist" | "General";
  severity: "Minor" | "Moderate" | "Serious";
  cause: string;
  startedDate: string;
  weeksRemaining: number;
  recoveryProgress: number;
};

export type HealthState = {
  activeIssue: HealthIssue | null;
  history: InjuryHistoryRow[];
};

export type CareerStage = {
  id: string;
  name: string;
  progress: number;
  current?: boolean;
};

export type BackgroundOption = {
  id: string;
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  funds: number;
  personality: string;
  bonuses: { label: string; value: number }[];
  weaknesses: { label: string; value: number }[];
};

export type NewCareerStartingLevel = {
  id: string;
  name: string;
  description: string;
  careerStage: string;
  rankingLabel: string;
  competitionTable:
    "youth" | "amateur" | "qTour" | "qSchool" | "world" | "senior";
  stage: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 14;
  minAge: number;
  maxAge: number;
  targetRanking: number;
  targetPoints: number;
};

export type PersonalitySlider = {
  label: string;
  value: number;
};

export type AttributeSnapshot = {
  label: string;
  value: number;
};

export type PlayerAttributeSummary = {
  overallRating: number;
  potential: number;
  moraleLabel: string;
  morale: number;
  matchFitness: number;
  fatigueLabel: string;
  fatigue: number;
  strengths: string[];
  weaknesses: string[];
  coachNotes: string;
};

export type CareerPathStage = {
  id: string;
  stage: number;
  name: string;
  tier: string;
  tourCircuit?: string;
  eventAccess?: string;
  progressionType?: string;
  progress: number;
  current?: boolean;
  description: string;
  requirements: string[];
  moveUpWhen?: string[];
  unlocks?: string[];
  tournaments: string;
  coaching: string;
  sponsor: string;
};

export type LegacySummary = {
  legacyScore: number;
  legacyTier: string;
  matchesPlayed: number;
  matchesWon: number;
  winRate: number;
  titles: number;
  majorTitles: number;
  centuryBreaks: number;
  maximumBreaks: number;
  highestRanking: number;
  totalPrizeMoney: number;
};

export type LegacyBreakdownItem = {
  label: string;
  value: number;
  max: number;
};

export type LegacyFinalRow = {
  id: string;
  year: string;
  event: string;
  category: string;
  opponent: string;
  result: string;
  score: string;
  prize: number;
  impact: number;
};

export type LegacySnapshotItem = {
  label: string;
  value: string;
};

export type TrainingCell = {
  title: string;
  subtitle: string;
  category:
    | "Technical"
    | "Mental"
    | "Physical"
    | "Match Prep"
    | "Recovery"
    | "Travel"
    | "Rest";
};

export type TrainingPlannerDay = {
  careerCommitmentId?: string;
  day: string;
  dateLabel: string;
  morning: TrainingCell;
  afternoon: TrainingCell;
  evening: TrainingCell;
  competitionName?: string;
  competitionLocation?: string;
  load: number;
  loadLabel: string;
};

export type DrillLibraryGroup = {
  title: string;
  accent: "green" | "violet" | "blue" | "gold";
  drills: { name: string; intensity: "High" | "Medium" | "Low" }[];
};

export type TrainingPlannerSummary = {
  weekLoad: number;
  weekLoadLabel: string;
  fatigueRisk: number;
  fatigueTrend: number;
  expectedGains: { label: string; value: number }[];
  coachImpact: number;
  confidenceProjection: number;
  confidenceLabel: string;
  balance: {
    label: string;
    value: number;
    sessions: number;
    tone: "green" | "violet" | "blue" | "gold";
  }[];
  totalSessions: number;
  averageIntensity: string;
  restSessions: number;
  travelSessions: number;
};

export type TrainingReportMetric = {
  label: string;
  value: string;
  tone: "green" | "amber" | "red" | "blue" | "gold";
  subtitle: string;
};

export type TrainingReportAttributeGain = {
  label: string;
  current: number;
  change: number;
};

export type TrainingReportDrillPerformance = {
  drill: string;
  performance: number;
};

export type TrainingReportCondition = {
  label: string;
  value: number;
  tone: "green" | "amber" | "red" | "blue";
  subtitle: string;
};

export type TrainingLoadPoint = {
  label: string;
  value: number;
  optimal?: number;
};

export type CategoryGainPoint = {
  label: string;
  value: number;
};

export type CoachContractOption = {
  label: string;
  weeklyCost: number;
  totalCost: number;
  selected?: boolean;
};

export type CoachContract = {
  coachId: string;
  slot: string;
  contractLabel: string;
  contractWeeks: number;
  weeklyCost: number;
  totalCost: number;
  weeksRemaining: number;
  startedWeek: number;
};

export type CoachImpactItem = {
  label: string;
  value: number;
};

export type FinanceBreakdownItem = {
  label: string;
  value: number;
  share: number;
  delta: number;
};

export type BudgetAllocationItem = {
  label: string;
  min: number;
  max: number;
  current: number;
  amount: number;
};

export type TournamentCostPlanItem = {
  id: string;
  event: string;
  location: string;
  date: string;
  entryCost: number;
  travelCost: number;
  hotelCost: number;
  prizePotential: string;
  risk: "Low" | "Medium" | "High";
};

export type ForecastOutlookCard = {
  label: string;
  projectedBalance: number;
  outlook: "Caution" | "Stable" | "At Risk";
  trend: number[];
};

export type FinancialIndicator = {
  label: string;
  value: number;
  target?: number;
  status: string;
};

export type CueTag =
  "Best Value" | "Tournament Grade" | "High Precision" | "One-Piece";

export type CueMarketplaceItem = Cue & {
  style: string;
  ownershipStatus: string;
  tags?: CueTag[];
};

export type SetupBonusItem = {
  label: string;
  value: number;
};

export type MaintenanceAction = {
  id: string;
  action: string;
  description: string;
  cost: number;
  timeRequired: string;
  restoration: { label: string; value: number }[];
  riskIfIgnored: string;
};

export type EquipmentConditionItem = {
  label: string;
  value: number;
  description: string;
};

export type MaintenanceHistoryItem = {
  id: string;
  date: string;
  service: string;
  cost: number;
  technician: string;
  result: string;
};

export type CalendarEvent = {
  id: string;
  name: string;
  type: Tournament["type"];
  location: string;
  startDay: number;
  endDay?: number;
  monthLabel: string;
  entryFee: number;
  travelCost: number;
  hotelCost: number;
  prizeMoney: number;
  rankingValue: number;
  format: string;
  status: Tournament["status"] | "Considering";
  fatigueRisk: "Low" | "Medium" | "High";
  accent: "green" | "violet" | "gold" | "orange" | "blue";
};

export type CalendarEventDetail = {
  eventId: string;
  venue: string;
  dates: string;
  location: string;
  format: string;
  matchLength: string;
  prizeMoney: number;
  rankingValue: number;
  entryFee: number;
  estimatedTotalCost: number;
  travelAndStay: string;
  fatigueRisk: "Low" | "Medium" | "High";
  summary: string;
  alertTitle: string;
  alertText: string;
  decisionImpact: {
    label: string;
    value: string;
    tone: "green" | "amber" | "red";
  }[];
  progressMeters: {
    label: string;
    value: number;
    max: number;
    detail: string;
    tone: "green" | "amber" | "red" | "blue";
  }[];
};

export type TravelOption = {
  id: string;
  name: string;
  icon: "Plane" | "Clock3" | "BriefcaseBusiness" | "Train";
  cost: number;
  fatigueLabel: "Very Low" | "Low" | "Medium" | "High";
  fatigueValue: number;
  arrivalTime: string;
  comfort: number;
  delayLabel: "Very Low" | "Low" | "Medium" | "High";
  delayRisk: number;
  selected?: boolean;
};

export type HotelOption = {
  id: string;
  name: string;
  cost: number;
  recoveryLabel: "Poor" | "Good" | "Very Good" | "Excellent";
  recoveryValue: number;
  preparationLabel: "Low" | "Good" | "Very Good" | "Excellent";
  preparationValue: number;
  noise: string;
  distance: string;
  selected?: boolean;
};

export type TripBreakdownItem = {
  label: string;
  amount: number;
};

export type TournamentObjective = {
  label: string;
  current: number;
  target: number;
  reward: number;
  status: string;
};

export type PlayerConditionMetric = {
  label: string;
  value: number;
  detail: string;
  tone: "green" | "amber" | "red";
};

export type ScheduleMatchItem = {
  id: string;
  time: string;
  table: string;
  home: string;
  away: string;
};

export type TopPerformerItem = {
  id: string;
  name: string;
  score: number;
};

export type TournamentStageProgress = {
  label: string;
  status: "completed" | "current" | "upcoming";
};

export type BracketPlayer = {
  name: string;
  rank: number;
  nation: string;
  score?: number;
  highlighted?: boolean;
};

export type BracketMatchup = {
  id: string;
  top: BracketPlayer;
  bottom: BracketPlayer;
  placeholder?: boolean;
  upset?: boolean;
};

export type BracketRound = {
  label: string;
  matches: BracketMatchup[];
};

export type OpponentOutlookItem = {
  id: string;
  name: string;
  rank: number;
  nation: string;
  headToHead: string;
  difficulty: "Moderate" | "Challenging" | "Very Tough";
};

export type DrawInsightItem = {
  label: string;
  value: string;
};

export type MatchPreviewPlanItem = {
  label: string;
  description: string;
  level: number;
  impact: string;
};

export type ScoutTrait = {
  label: string;
  value: number;
};

export type RecentMatchResult = {
  id: string;
  date: string;
  tournament: string;
  opponent: string;
  result: "W" | "L";
  score: string;
};

export type LiveMomentumPoint = {
  label: string;
  player: number;
  opponent: number;
};

export type LiveFeedItem = {
  id: string;
  time: string;
  text: string;
  actor: "Player" | "Opponent" | "System";
  tone: "green" | "amber" | "red" | "blue";
};

export type FrameScoreRow = {
  frame: string;
  player: string;
  opponent: string;
  winner: string;
};

export type MatchStatRow = {
  label: string;
  player: string;
  opponent: string;
};

export type CoachFeedbackGroup = {
  title: string;
  tone: "green" | "amber" | "blue";
  items: string[];
};

export type EquipmentImpactCard = {
  label: string;
  detail: string;
  condition: number;
  highlight: string;
};

export type DetailedRankingRow = {
  id: string;
  rank: number;
  movement: number;
  playerName: string;
  nation: string;
  prizeMoney: number;
  eventsPlayed: number;
  titles: number;
  form: string;
  moneyDropping: number;
  highlighted?: boolean;
};

export type RankingSourceItem = {
  label: string;
  points: number;
  prizeMoney: number;
};

export type RankingScenario = {
  label: string;
  points: number;
  projectedRank: number;
};

export type InboxCategoryBadge = {
  label: string;
  count: number;
};

export type SupportInboxItem = {
  id: string;
  title: string;
  sender: string;
  senderRole: string;
  preview: string;
  date: string;
  time: string;
  status: "New" | "Unread" | "Read" | "Warning" | "Urgent";
  priority: "Informational" | "Awaiting Decision" | "Warning" | "Urgent";
  category: "Career" | "Finance" | "Media" | "Medical" | "Tournament";
  accent: "green" | "gold" | "blue" | "amber" | "red" | "violet";
};

export type NewsCard = {
  id: string;
  title: string;
  source: string;
  date: string;
  tag: string;
};

export type DeadlineItem = {
  id: string;
  title: string;
  dueText: string;
  countdown: string;
};

export type SponsorOfferCard = {
  id: string;
  name: string;
  category: string;
  monthlyValue: number;
  bonusClause: string;
  contractLength: string;
  minimumReputation: number;
  behaviour: string;
  brandFit: number;
  risk: "Low Risk" | "Medium Risk" | "Risky Terms";
  tags?: string[];
  note?: string;
};

export type SponsorSlotItem = {
  slot: string;
  sponsor: string;
  status: "Active" | "Vacant" | "Locked";
  monthlyIncome?: string;
  timeLeft?: string;
};

export type BrandMetric = {
  label: string;
  value: number;
  detail: string;
};

export type SponsorComparisonRow = {
  sponsor: string;
  exclusivity: string;
  obligations: string;
  reputationImpact: string;
  valueScore: number;
  notes: string;
};

export type SponsorAdvisorNote = {
  summary: string;
  recommendation: string;
  confidence: number;
  bulletPoints: string[];
};

export type SponsorContractSummary = {
  name: string;
  category: string;
  brandFit: number;
  reputationTier: string;
  contractStatus: string;
  dealRating: number;
  monthlyPayment: number;
  winBonuses: string;
  appearanceBonus: string;
  socialRequirement: string;
  behaviourClause: string;
  contractLength: string;
  reputationImpact: number;
  exclusivity: string;
  terminationFee: number;
  renewalOption: string;
  mediaDays: string;
};

export type ContractTermRow = {
  label: string;
  details: string;
  valueImpact: string;
};

export type IncludedSponsorSlot = {
  slot: string;
  annualValue: number;
  visibility: string;
  fit: number;
};

export type NegotiationOptionRow = {
  label: string;
  adjustment: string;
  sponsorResponse: string;
  probability: number;
  impact: string;
};

export type DealComparisonRow = {
  metric: string;
  current: string;
  proposed: string;
};

export type MentalMetric = {
  label: string;
  value: number;
  detail: string;
  tone: "green" | "amber" | "red";
};

export type MentalTriggerItem = {
  label: string;
  timing: string;
};

export type RecoveryActionCard = {
  title: string;
  description: string;
  effect: string;
  effectTone: "green" | "amber" | "red";
  cost: string;
  time: string;
};

export type MultiLinePoint = {
  label: string;
  confidence: number;
  stress: number;
  focus: number;
  motivation: number;
};

export type RecoveryProgressItem = {
  label: string;
  value: number;
};

export type CopingStrategyItem = {
  label: string;
  rating: number;
};

export type BodyStatusItem = {
  label: string;
  status: string;
  risk: number;
  tone: "green" | "amber" | "red";
};

export type TreatmentOptionItem = {
  id: string;
  title: string;
  description: string;
  cost: number;
  timeRequired: string;
  selected?: boolean;
};

export type InjuryHistoryRow = {
  id: string;
  date: string;
  issue: string;
  severity: string;
  treatment: string;
  timeOut: string;
  notes: string;
};

export type MatchImpactRow = {
  label: string;
  impact: string;
};

export type SeasonHeadlineMetric = {
  label: string;
  value: string;
  detail: string;
};

export type AttributeGrowthRow = {
  label: string;
  value: number;
};

export type ObjectiveProgressRow = {
  label: string;
  progress: string;
  completed: boolean;
};

export type FinancialSummaryRow = {
  label: string;
  value: number;
};

export type DashboardNewsItem = {
  id: string;
  tag: string;
  title: string;
  detail: string;
};

export type FinanceSnapshot = {
  income: number;
  expenses: number;
  surplus: number;
  burnRate: number;
};

export type ChartPoint = {
  label: string;
  income: number;
  expenses: number;
};

export type AppRoute = {
  path: string;
  label: string;
  section: string;
  children?: AppRoute[];
};
