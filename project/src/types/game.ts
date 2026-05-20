export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  flag: string;
  handedness: 'Right' | 'Left';
  cueStyle: string;
  playingStyle: string;
  turnedPro: number;
  homeTown: string;
  worldRanking: number;
  rankingMovement: number;
  rankPoints: number;
  overall: number;
  potential: number;
  confidence: number;
  morale: string;
  fatigue: number;
  fitness: number;
  cashBalance: number;
  cashFlow: number;
  form: ('W' | 'L' | 'D')[];
  coach: string;
  status: string;
  personalityArchetype: string;
}

export interface PlayerAttributes {
  technical: AttributeCategory;
  mental: AttributeCategory;
  physical: AttributeCategory;
}

export interface AttributeCategory {
  [key: string]: AttributeValue;
}

export interface AttributeValue {
  value: number;
  trend: number;
}

export interface Coach {
  id: string;
  name: string;
  nationality: string;
  flag: string;
  age: number;
  type: string;
  specialism: string;
  level: string;
  weeklyCost: number;
  reputation: number;
  compatibility: number;
  technical: number;
  tactical: number;
  mental: number;
  motivation: number;
  personality: string;
  strengths: string[];
  weaknesses: string[];
  contractLength: string;
  fitLabel: string;
}

export interface Tournament {
  id: string;
  name: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  tier: number;
  prizeMoney: number;
  rankingPoints: number;
  format: string;
  round: string;
  status: 'upcoming' | 'active' | 'completed';
}

export interface MatchResult {
  id: string;
  date: string;
  tournament: string;
  round: string;
  opponent: string;
  opponentFlag: string;
  playerScore: number;
  opponentScore: number;
  prize: number;
  rankingPoints: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'cue' | 'chalk' | 'tip' | 'case';
  tier: string;
  price: number;
  condition: number;
  familiarity: number;
  owned: boolean;
  equipped: boolean;
  stats: Record<string, number>;
}

export interface InboxMessage {
  id: string;
  type: 'career' | 'finance' | 'media' | 'medical' | 'tournament' | 'staff';
  subject: string;
  sender: string;
  senderRole: string;
  preview: string;
  date: string;
  priority: 'informational' | 'awaiting_decision' | 'warning' | 'urgent';
  read: boolean;
  content: string;
}

export interface FinanceData {
  cashBalance: number;
  weeklyChange: number;
  monthlyDeficit: number;
  burnRate: number;
  runway: number;
  income: FinanceCategory[];
  expenses: FinanceCategory[];
  cashFlowHistory: { month: string; income: number; expenses: number }[];
}

export interface FinanceCategory {
  name: string;
  amount: number;
  percentOfTotal: number;
  vsLastMonth: number;
}

export interface SeasonStats {
  season: string;
  finalRanking: number;
  rankingMovement: number;
  prizeMoney: number;
  titlesWon: number;
  matchesPlayed: number;
  matchesWon: number;
  winRate: number;
  centuries: number;
  highestBreak: number;
  attributeGrowth: number;
  financialResult: number;
}

export interface GameState {
  player: Player;
  attributes: PlayerAttributes;
  season: string;
  week: number;
  date: string;
  nextTournament: Tournament | null;
  recentResults: MatchResult[];
  inbox: InboxMessage[];
  finances: FinanceData;
}
