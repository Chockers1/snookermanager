export const mockPlayer = {
  id: "player-001",
  firstName: "Ryan",
  lastName: "Taylor",
  fullName: "Ryan Taylor",
  nationality: "England",
  age: 17,
  handedness: "Right-handed",
  careerStage: "Amateur Circuit",
  playingStyle: "Balanced Break Builder",
  personalityType: "Focused Perfectionist",
  ranking: "Amateur #12",
  worldRanking: null,
  cash: 4250,
  form: "Good",
  confidence: 72,
  fatigue: 28,
  reputation: 34,
  morale: 78,
  legacyScore: 8,
};

export const mockAttributes = {
  technical: {
    longPotting: 64,
    midRangePotting: 68,
    closePotting: 72,
    breakBuilding: 61,
    cueBallControl: 59,
    safetyPlay: 55,
    tacticalAwareness: 52,
    snookerEscapes: 48,
    restPlay: 44,
    cannonControl: 51,
    packSplitting: 47,
    breakOff: 58,
    colourClearance: 62,
    shotToNothing: 50,
    consistency: 57,
  },
  mental: {
    composure: 61,
    focus: 73,
    temperament: 58,
    patience: 64,
    fightingSpirit: 69,
    killerInstinct: 54,
    deciderMentality: 49,
    bigMatchNerve: 46,
    resilience: 66,
    adaptability: 59,
    professionalism: 74,
    ambition: 82,
    pressureHandling: 52,
    mediaHandling: 38,
    burnoutResistance: 56,
  },
  physical: {
    stamina: 62,
    coreStability: 58,
    balance: 66,
    shoulderHealth: 79,
    backHealth: 76,
    handSteadiness: 67,
    visualSharpness: 71,
    recoveryRate: 63,
    sleepQuality: 69,
    travelAdaptability: 42,
  },
};

export const mockCoach = {
  id: "coach-001",
  name: "Alan Whitmore",
  type: "Technical Coach",
  level: 2,
  weeklyCost: 180,
  reputation: 55,
  compatibility: 82,
  technicalKnowledge: 74,
  tacticalKnowledge: 48,
  mentalSupport: 51,
  motivation: 67,
  discipline: 72,
  specialism: "Cue Action",
};

export const mockEquipment = {
  cue: {
    id: "cue-001",
    name: "Classic Ash Pro",
    tier: 3,
    condition: 88,
    familiarity: 76,
    bonuses: {
      cueBallControl: 2,
      consistency: 1,
      touch: 1,
    },
  },
  chalk: {
    id: "chalk-001",
    name: "Pro Contact",
    tier: 3,
    bonuses: {
      spinTransfer: 1,
      miscueReduction: 1,
    },
  },
  tip: {
    id: "tip-001",
    name: "Medium Layered Tip",
    condition: 81,
    bonuses: {
      spinGrip: 1,
      feel: 1,
    },
  },
};

export const mockNextTournament = {
  id: "tournament-001",
  name: "Q Tour Event 3",
  type: "Q Tour",
  location: "Berlin",
  startDate: "2028-05-21",
  entryFee: 150,
  travelCost: 420,
  hotelCost: 280,
  prizeMoney: 5000,
  rankingValue: "High",
  format: "Best of 7",
  status: "Entered",
};

export const mockRecentResults = [
  {
    event: "English Amateur Open",
    round: "Quarter Final",
    opponent: "Lewis Grant",
    result: "Won 4-2",
    highestBreak: 82,
    prizeMoney: 750,
  },
  {
    event: "Q Tour Event 2",
    round: "Last 32",
    opponent: "Marcus Holt",
    result: "Lost 3-4",
    highestBreak: 67,
    prizeMoney: 300,
  },
  {
    event: "Northern Pro-Am",
    round: "Final",
    opponent: "Daniel Reeves",
    result: "Won 5-3",
    highestBreak: 94,
    prizeMoney: 1200,
  },
];

export const mockUpcomingDecisions = [
  {
    title: "Cue tip wearing down",
    type: "Equipment",
    urgency: "Medium",
    action: "Replace or shape tip before next event",
  },
  {
    title: "Q Tour Event 3 travel booking required",
    type: "Travel",
    urgency: "High",
    action: "Choose travel and hotel option",
  },
  {
    title: "Coach recommends safety focus",
    type: "Training",
    urgency: "Low",
    action: "Add safety exchanges to next week",
  },
];

export const mockRankings = [
  { rank: 1, move: "+1", player: "Oliver Crane", nation: "ENG", prizeMoney: 18200, form: "Excellent" },
  { rank: 2, move: "-1", player: "Liam Zhou", nation: "CHN", prizeMoney: 17650, form: "Good" },
  { rank: 3, move: "0", player: "Marcus Holt", nation: "WAL", prizeMoney: 15900, form: "Good" },
  { rank: 12, move: "+4", player: "Ryan Taylor", nation: "ENG", prizeMoney: 8200, form: "Good" },
];