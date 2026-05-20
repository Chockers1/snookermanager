export const matchOpponent = {
  name: 'Marcus Holt',
  flag: '🇬🇧',
  ranking: 41,
  rankingMovement: -2,
  confidence: 68,
  fatigue: 22,
  archetype: 'Counter Puncher' as const,
  approach: 'Measured' as const,
  form: ['W', 'L', 'L', 'W', 'W', 'L', 'W', 'W', 'L', 'W'] as ('W' | 'L' | 'D')[],
  strengths: ['Long potting accuracy', 'Counter-attacking after safety', 'Rhythm player when settled'],
  weaknesses: ['Tactical consistency under pressure', 'Break building under fatigue', 'Slow to adapt tempo'],
  stats: {
    longPotting: 82,
    breakBuilding: 74,
    safetyPlay: 78,
    cueBallControl: 76,
    composure: 65,
    focus: 70,
    bigMatchNerve: 58,
    stamina: 72,
  },
  recentResults: [
    { opponent: 'J. Robertson', result: 'W', score: '4-2' },
    { opponent: 'S. Murphy', result: 'L', score: '3-4' },
    { opponent: 'L. Brecel', result: 'L', score: '1-4' },
    { opponent: 'D. Gilbert', result: 'W', score: '4-1' },
    { opponent: 'R. Milkins', result: 'W', score: '4-3' },
  ],
};

export const matchInfo = {
  tournament: 'World Championship Qualifying',
  round: 'Round 5 - Last 32',
  format: 'Best of 9 Frames',
  framesNeeded: 5,
  venue: 'English Institute of Sport',
  city: 'Sheffield, England',
  table: 'Table 3',
  referee: 'Marcel Eckardt',
  temperature: '20°C',
  conditions: 'Excellent',
  matchTime: '19:00',
  broadcast: 'Eurosport 2',
};

export const headToHead = {
  played: 4,
  playerWins: 3,
  opponentWins: 1,
  lastMet: 'Players Championship R1 - Jan 2025',
  lastResult: 'Won 4-2',
  history: [
    { event: 'Players Champ R1', date: 'Jan 2025', result: 'W', score: '4-2' },
    { event: 'UK Championship R3', date: 'Nov 2024', result: 'W', score: '6-3' },
    { event: 'European Masters QF', date: 'Sep 2024', result: 'L', score: '3-5' },
    { event: 'Championship League', date: 'Jun 2024', result: 'W', score: '3-1' },
  ],
};

export const matchPreviewTactics = {
  recommendedPlan: 'Balanced' as const,
  recommendedFocus: 'Composed' as const,
  recommendedTempo: 'Steady' as const,
  reasoning: 'Holt is dangerous in rhythm. Controlled aggression with patient safety will limit his counter-attacking opportunities while keeping scoring options open.',
  keyMatchup: 'Your break building vs his safety recovery',
  dangerZone: 'If Holt settles into rhythm after Frame 3, his long potting becomes lethal',
};

export const liveMatchState = {
  playerFrames: 3,
  opponentFrames: 2,
  currentFrame: 6,
  playerPoints: 42,
  opponentPoints: 17,
  currentVisit: 14,
  currentBreak: 42,
  playerAtTable: true,
  shotClock: 18,
  tableState: 'Open Table' as const,
  targetBall: 'Red',
  redsRemaining: 9,
  pointsOnTable: 99,
  decisionMode: 'Standard' as const,
  phase: 'Reds' as const,
  pressure: 65,
  pressureLabel: 'High' as const,
  tacticalEdge: 12,
  playerConfidence: 82,
  playerFatigue: 28,
  opponentConfidence: 58,
  opponentFatigue: 35,
  matchDuration: '1h 42m',
  timeoutsRemaining: 2,
};

export const tacticalState = {
  plan: 'Balanced' as const,
  focus: 'Composed' as const,
  tempo: 'Steady' as const,
};

export const coachPrompt = {
  title: 'Maintain Composure',
  note: 'You\'re in a strong position. Don\'t over-attack - keep the pressure on Holt\'s safety and wait for clear opportunities. He\'s starting to rush his shots under pressure.',
  recommendedPlan: 'Balanced' as const,
  recommendedFocus: 'Composed' as const,
  recommendedTempo: 'Steady' as const,
};

export const opponentAdjustments = [
  { frame: 6, trigger: 'Falling behind in frames', from: 'Measured', to: 'Pressing', note: 'Holt is pressing now - expect more risky long pots' },
  { frame: 4, trigger: 'Lost two consecutive frames', from: 'Tight', to: 'Measured', note: 'Shifted from defensive to measured play' },
  { frame: 2, trigger: 'Won frame with high break', from: 'Measured', to: 'Tight', note: 'Tightened up after gaining momentum' },
];

export const momentumData = [
  { frame: 'F1', value: 45 },
  { frame: 'F2', value: -35 },
  { frame: 'F3', value: 55 },
  { frame: 'F4', value: -15 },
  { frame: 'F5', value: 70 },
  { frame: 'V1', value: 60 },
  { frame: 'V5', value: 50 },
  { frame: 'V10', value: 65 },
  { frame: 'V14', value: 72 },
];

export const visitLog = [
  { visit: 14, player: 'Jack Harrison', action: 'Break Build', result: 'On 42, still at table', points: 42, success: true },
  { visit: 13, player: 'Marcus Holt', action: 'Safety Exchange', result: 'Missed safety, left chance', points: 0, success: false },
  { visit: 12, player: 'Jack Harrison', action: 'Pot Attempt', result: 'Potted red, positional error', points: 1, success: true },
  { visit: 11, player: 'Marcus Holt', action: 'Break Build', result: 'Break of 16, missed pink', points: 16, success: false },
  { visit: 10, player: 'Jack Harrison', action: 'Safety Exchange', result: 'Won the exchange', points: 0, success: true },
  { visit: 9, player: 'Marcus Holt', action: 'Pot Attempt', result: 'Long red potted', points: 1, success: true },
  { visit: 8, player: 'Jack Harrison', action: 'Safety Exchange', result: 'Tight safety, good position', points: 0, success: true },
  { visit: 7, player: 'Marcus Holt', action: 'Pot Attempt', result: 'Missed mid-range red', points: 0, success: false },
];

export const frameHistory = [
  { frame: 1, playerScore: 93, opponentScore: 12, winner: 'player' as const, highBreak: 76, keyMoment: 'Century chance missed at 76' },
  { frame: 2, playerScore: 18, opponentScore: 74, winner: 'opponent' as const, highBreak: 58, keyMoment: 'Holt break of 58 settled early' },
  { frame: 3, playerScore: 89, opponentScore: 41, winner: 'player' as const, highBreak: 67, keyMoment: 'Brilliant clearance under pressure' },
  { frame: 4, playerScore: 28, opponentScore: 79, winner: 'opponent' as const, highBreak: 62, keyMoment: 'Lost safety exchange, Holt capitalized' },
  { frame: 5, playerScore: 102, opponentScore: 37, winner: 'player' as const, highBreak: 102, keyMoment: 'Century break sealed the frame' },
];

export const matchResultData = {
  finalScore: { player: 5, opponent: 3 },
  matchDuration: '2h 18m',
  prizeMoney: 7500,
  rankingPoints: 6350,
  confidenceChange: 4,
  fatigueChange: 12,
  newConfidence: 82,
  newFatigue: 30,
  highestBreak: 102,
  centuriesPlayer: 1,
  centuriesOpponent: 0,
  fiftyPlusPlayer: 3,
  fiftyPlusOpponent: 2,
  potSuccessPlayer: 92,
  potSuccessOpponent: 84,
  longPotSuccessPlayer: 78,
  longPotSuccessOpponent: 68,
  safetySuccessPlayer: 88,
  safetySuccessOpponent: 76,
  foulsPlayer: 3,
  foulsOpponent: 7,
  averageBreakPlayer: 34,
  averageBreakOpponent: 22,
  frameHistory: [
    { frame: 1, playerScore: 93, opponentScore: 12, winner: 'player' as const },
    { frame: 2, playerScore: 18, opponentScore: 74, winner: 'opponent' as const },
    { frame: 3, playerScore: 89, opponentScore: 41, winner: 'player' as const },
    { frame: 4, playerScore: 28, opponentScore: 79, winner: 'opponent' as const },
    { frame: 5, playerScore: 102, opponentScore: 37, winner: 'player' as const },
    { frame: 6, playerScore: 76, opponentScore: 41, winner: 'player' as const },
    { frame: 7, playerScore: 31, opponentScore: 68, winner: 'opponent' as const },
    { frame: 8, playerScore: 84, opponentScore: 52, winner: 'player' as const },
  ],
  explanation: {
    summary: 'A composed, professional performance. You controlled the match through superior break building and tactical awareness, converting key moments when Holt pressured.',
    strengthEdge: 'Significant technical advantage',
    keyFactors: [
      { factor: 'Break Building', impact: 'positive', detail: 'Century and three 50+ breaks demonstrated elite scoring' },
      { factor: 'Composure', impact: 'positive', detail: 'Held nerve in tight frames 6 and 8 when Holt pressed' },
      { factor: 'Equipment', impact: 'positive', detail: 'Cue familiarity at 100% provided consistent strike quality' },
      { factor: 'Fatigue', impact: 'neutral', detail: 'Energy managed well across the match duration' },
      { factor: 'Pressure', impact: 'positive', detail: 'Big Match Nerve held in crucial 5th and 8th frames' },
    ],
    coachFeedback: 'Excellent execution of the balanced game plan. Your scoring in frames 1, 3, and 5 was world-class. The brief dip in frames 2 and 4 shows concentration needs work in the opening exchanges. Overall, a performance that shows real championship quality.',
    improvementAreas: [
      'Early frame concentration - lost frames 2 and 4 through slow starts',
      'Safety recovery after positional errors - two frames required reactive play',
      'Long match endurance - slight dip in frame quality after frame 6',
    ],
  },
  modifiers: {
    confidence: '+4% (Strong performance boost)',
    fatigue: '+12% (Extended match, high scoring output)',
    equipment: '+3.2 attribute bonus from cue familiarity',
    tactical: 'Balanced plan effective against counter-puncher',
    pressure: 'Handled high-pressure moments in frames 5 and 8',
    format: 'Best of 9 format suited your consistency advantage',
  },
};
