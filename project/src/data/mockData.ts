import type { Player, PlayerAttributes, Tournament, MatchResult, Coach, Equipment, InboxMessage, FinanceData, GameState } from '../types/game';

export const mockPlayer: Player = {
  id: '1',
  name: 'Jack Harrison',
  age: 21,
  nationality: 'England',
  flag: '🇬🇧',
  handedness: 'Right',
  cueStyle: 'Traditional',
  playingStyle: 'Balanced',
  turnedPro: 2022,
  homeTown: 'Leeds, England',
  worldRanking: 21,
  rankingMovement: 2,
  rankPoints: 556420,
  overall: 79,
  potential: 84,
  confidence: 78,
  morale: 'High',
  fatigue: 18,
  fitness: 93,
  cashBalance: 1245830,
  cashFlow: 48710,
  form: ['W', 'W', 'W', 'L', 'W', 'W', 'D', 'W', 'L', 'W'],
  coach: 'Steve Feeney',
  status: 'Main Tour Professional',
  personalityArchetype: 'Driven Leader',
};

export const mockAttributes: PlayerAttributes = {
  technical: {
    'Long Potting': { value: 84, trend: 2 },
    'Break Building': { value: 86, trend: 1 },
    'Cue Ball Control': { value: 82, trend: 1 },
    'Safety Play': { value: 78, trend: -1 },
    'Tactical Awareness': { value: 81, trend: 2 },
    'Rest Play': { value: 72, trend: -1 },
    'Pack Splitting': { value: 69, trend: 0 },
    'Colour Clearance': { value: 80, trend: 1 },
    'Shot-to-Nothing': { value: 76, trend: 0 },
    'Consistency': { value: 83, trend: 2 },
  },
  mental: {
    'Composure': { value: 83, trend: 1 },
    'Focus': { value: 85, trend: 2 },
    'Temperament': { value: 78, trend: 0 },
    'Fighting Spirit': { value: 82, trend: 1 },
    'Killer Instinct': { value: 77, trend: 1 },
    'Resilience': { value: 80, trend: 1 },
    'Decider Mentality': { value: 74, trend: -1 },
    'Big Match Nerve': { value: 76, trend: 0 },
    'Professionalism': { value: 88, trend: 2 },
  },
  physical: {
    'Stamina': { value: 81, trend: 0 },
    'Core Stability': { value: 78, trend: 0 },
    'Balance': { value: 80, trend: 0 },
    'Shoulder Health': { value: 76, trend: -1 },
    'Back Health': { value: 74, trend: -1 },
    'Hand Steadiness': { value: 86, trend: 0 },
    'Visual Sharpness': { value: 84, trend: 2 },
    'Recovery Rate': { value: 73, trend: -1 },
  },
};

export const mockNextTournament: Tournament = {
  id: '1',
  name: 'World Championship',
  location: 'Sheffield, England',
  country: 'England',
  startDate: '14 May 2025',
  endDate: '21 May 2025',
  tier: 1,
  prizeMoney: 500000,
  rankingPoints: 10000,
  format: 'Best of 19',
  round: 'Qualifying Round 1',
  status: 'upcoming',
};

export const mockRecentResults: MatchResult[] = [
  { id: '1', date: '11/05', tournament: 'Players Championship', round: 'R2', opponent: 'Stuart Bingham', opponentFlag: '🇬🇧', playerScore: 4, opponentScore: 2, prize: 15000, rankingPoints: 10000 },
  { id: '2', date: '09/05', tournament: 'Players Championship', round: 'R1', opponent: 'Lyu Haotian', opponentFlag: '🇨🇳', playerScore: 4, opponentScore: 1, prize: 10000, rankingPoints: 10000 },
  { id: '3', date: '04/05', tournament: 'Tour Championship', round: 'QF', opponent: 'Mark Allen', opponentFlag: '🇬🇧', playerScore: 3, opponentScore: 6, prize: 20000, rankingPoints: 10000 },
  { id: '4', date: '02/05', tournament: 'Tour Championship', round: 'R2', opponent: 'Zhou Yuelong', opponentFlag: '🇨🇳', playerScore: 6, opponentScore: 3, prize: 12500, rankingPoints: 10000 },
  { id: '5', date: '28/04', tournament: 'Tour Championship', round: 'R1', opponent: 'Jackson Page', opponentFlag: '🇬🇧', playerScore: 6, opponentScore: 1, prize: 7500, rankingPoints: 10000 },
];

export const mockCoaches: Coach[] = [
  { id: '1', name: 'Steve Feeney', nationality: 'England', flag: '🇬🇧', age: 52, type: 'Technical', specialism: 'Technical', level: 'High', weeklyCost: 800, reputation: 88, compatibility: 88, technical: 92, tactical: 78, mental: 86, motivation: 80, personality: 'Driven Leader', strengths: ['Exceptional long potting development', 'Advanced cue mechanics expertise', 'Excellent break building techniques', 'Strong tactical fundamentals'], weaknesses: ['Less focus on mental conditioning', 'Limited fitness & physical training', 'Prefers structured sessions'], contractLength: '12 Months', fitLabel: 'Strong Fit' },
  { id: '2', name: 'Mark Selby', nationality: 'England', flag: '🇬🇧', age: 41, type: 'Technical', specialism: 'Technical', level: 'Elite', weeklyCost: 1200, reputation: 92, compatibility: 92, technical: 78, tactical: 80, mental: 85, motivation: 80, personality: 'Methodical', strengths: ['World-class safety play', 'Elite tactical knowledge', 'Exceptional match preparation'], weaknesses: ['High cost', 'Limited availability'], contractLength: '6 Months', fitLabel: 'Strong Fit' },
  { id: '3', name: 'Chris Henry', nationality: 'England', flag: '🇬🇧', age: 44, type: 'Technical', specialism: 'Potting', level: 'High', weeklyCost: 900, reputation: 84, compatibility: 86, technical: 72, tactical: 76, mental: 80, motivation: 96, personality: 'Energetic', strengths: ['Potting consistency drills', 'Break building patterns'], weaknesses: ['Limited tactical depth'], contractLength: '12 Months', fitLabel: 'Available Now' },
  { id: '4', name: 'Joe Perry', nationality: 'England', flag: '🇬🇧', age: 49, type: 'Technical', specialism: 'Mental', level: 'High', weeklyCost: 850, reputation: 80, compatibility: 74, technical: 70, tactical: 78, mental: 74, motivation: 78, personality: 'Calm', strengths: ['Mental resilience training', 'Composure under pressure'], weaknesses: ['Limited physical training'], contractLength: '6 Months', fitLabel: '' },
  { id: '5', name: 'Alan McManus', nationality: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', age: 53, type: 'Technical', specialism: 'Technical', level: 'Mid', weeklyCost: 650, reputation: 72, compatibility: 76, technical: 66, tactical: 70, mental: 75, motivation: 70, personality: 'Patient', strengths: ['Solid fundamentals coaching'], weaknesses: ['Lower intensity'], contractLength: '12 Months', fitLabel: '' },
];

export const mockEquipment: Equipment[] = [
  { id: '1', name: 'Crucible Control X', type: 'cue', tier: 'Elite', price: 950, condition: 88, familiarity: 100, owned: true, equipped: true, stats: { touch: 86, spinControl: 88, stability: 87, durability: 92 } },
  { id: '2', name: 'Classic Ash Pro', type: 'cue', tier: 'Mid-Tier', price: 320, condition: 82, familiarity: 68, owned: true, equipped: false, stats: { touch: 68, spinControl: 64, stability: 66, durability: 80 } },
  { id: '3', name: 'Sheffield Match Pro', type: 'cue', tier: 'Mid-Tier', price: 620, condition: 100, familiarity: 15, owned: false, equipped: false, stats: { touch: 72, spinControl: 70, stability: 72, durability: 82 } },
  { id: '4', name: 'Century Maker 147', type: 'cue', tier: 'Elite', price: 1150, condition: 100, familiarity: 0, owned: false, equipped: false, stats: { touch: 90, spinControl: 92, stability: 88, durability: 90 } },
  { id: '5', name: 'Black Ball Custom', type: 'cue', tier: 'Elite', price: 1350, condition: 100, familiarity: 0, owned: false, equipped: false, stats: { touch: 92, spinControl: 94, stability: 93, durability: 93 } },
  { id: '6', name: 'Mastercraft One-Piece', type: 'cue', tier: 'Elite', price: 1350, condition: 100, familiarity: 0, owned: false, equipped: false, stats: { touch: 84, spinControl: 76, stability: 87, durability: 95 } },
];

export const mockInbox: InboxMessage[] = [
  { id: '1', type: 'staff', subject: 'Coach Report', sender: 'Head Coach', senderRole: 'Andy Lee', preview: 'Your latest training report is ready. Focus areas identified...', date: '11 May 2025', priority: 'informational', read: false, content: 'Your latest training report is ready. Key focus areas have been identified for the coming weeks.' },
  { id: '2', type: 'tournament', subject: 'Tournament Invite', sender: 'World Snooker Tour', senderRole: 'Official', preview: 'You have been invited to enter the European Masters 2025...', date: '11 May 2025', priority: 'awaiting_decision', read: false, content: 'Dear Ryan Taylor, You are invited to enter the European Masters 2025. This event offers a strong ranking opportunity.' },
  { id: '3', type: 'finance', subject: 'Sponsor Offer', sender: 'Brand Relations', senderRole: 'Maxwell Sports', preview: 'New sponsorship proposal from a premium equipment brand...', date: '10 May 2025', priority: 'awaiting_decision', read: false, content: 'A new sponsorship proposal has arrived from Maxwell Sports.' },
  { id: '4', type: 'medical', subject: 'Cue Maintenance Warning', sender: 'Equipment Manager', senderRole: 'Tom Bradley', preview: 'Your cue requires maintenance to avoid performance issues.', date: '10 May 2025', priority: 'warning', read: false, content: 'Your cue condition has dropped. Maintenance is recommended.' },
  { id: '5', type: 'media', subject: 'Media Article', sender: 'Snooker Weekly', senderRole: 'Media', preview: '"Taylor\'s consistency earning respect" - Snooker Weekly...', date: '9 May 2025', priority: 'informational', read: true, content: 'A positive article has been published about your recent form.' },
  { id: '6', type: 'career', subject: 'Ranking Update', sender: 'World Snooker', senderRole: 'Rankings Dept.', preview: 'Your ranking points have been updated.', date: '9 May 2025', priority: 'informational', read: true, content: 'Your ranking has been updated following recent results.' },
  { id: '7', type: 'medical', subject: 'Injury Concern', sender: 'Physiotherapist', senderRole: 'Dr. Sarah Collins', preview: 'Physio report regarding your lower back strain.', date: '8 May 2025', priority: 'urgent', read: false, content: 'A minor strain has been detected in your lower back area.' },
];

export const mockFinances: FinanceData = {
  cashBalance: 1245830,
  weeklyChange: -830,
  monthlyDeficit: -2140,
  burnRate: 1010,
  runway: 4.2,
  income: [
    { name: 'Prize Money', amount: 1250, percentOfTotal: 14, vsLastMonth: -18 },
    { name: 'Sponsorship', amount: 600, percentOfTotal: 7, vsLastMonth: 5 },
    { name: 'Exhibitions', amount: 450, percentOfTotal: 5, vsLastMonth: -20 },
    { name: 'Coaching Clinics', amount: 150, percentOfTotal: 2, vsLastMonth: -25 },
    { name: 'Media', amount: 150, percentOfTotal: 2, vsLastMonth: 0 },
  ],
  expenses: [
    { name: 'Coaches', amount: 1000, percentOfTotal: 26, vsLastMonth: -5 },
    { name: 'Travel', amount: 900, percentOfTotal: 24, vsLastMonth: 13 },
    { name: 'Hotels', amount: 650, percentOfTotal: 17, vsLastMonth: 8 },
    { name: 'Entry Fees', amount: 450, percentOfTotal: 12, vsLastMonth: 0 },
    { name: 'Equipment', amount: 300, percentOfTotal: 8, vsLastMonth: -20 },
    { name: 'Physio', amount: 250, percentOfTotal: 5, vsLastMonth: -10 },
    { name: 'Practice Table', amount: 200, percentOfTotal: 5, vsLastMonth: 0 },
  ],
  cashFlowHistory: [
    { month: 'Nov', income: 15100, expenses: 9600 },
    { month: 'Dec', income: 12400, expenses: 9800 },
    { month: 'Jan', income: 7800, expenses: 10600 },
    { month: 'Feb', income: 6300, expenses: 10100 },
    { month: 'Mar', income: 8700, expenses: 10300 },
    { month: 'Apr', income: 7900, expenses: 9200 },
    { month: 'May', income: 2600, expenses: 3800 },
  ],
};

export const mockGameState: GameState = {
  player: mockPlayer,
  attributes: mockAttributes,
  season: '2024/25',
  week: 32,
  date: '12 May 2025',
  nextTournament: mockNextTournament,
  recentResults: mockRecentResults,
  inbox: mockInbox,
  finances: mockFinances,
};
