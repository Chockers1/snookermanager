export type BaseKind = 'club' | 'rented' | 'academy';
export type BreakChoice = 'recover' | 'reset' | 'review';
export type Journey = {
  eventKey: string; origin: string; destination: string; distanceKm: number; zoneHours: number;
  mode: 'Ground' | 'Flight'; departure: string; arrival: string; acclimatisationDays: number;
  fatigue: number; cost: number; applied: boolean;
  fatigueRemaining?: number; acclimatisedThrough?: string; hotelThrough?: string;
};
export type VenueConditions = { speed: number; cushions: number; humidity: number; description: string };
export type MatchSessions = {
  frames: number[]; overnightAfter: number[];
  completedBreaks: { afterFrame: number; choice: BreakChoice; kind: 'interval' | 'session' | 'overnight' }[];
};
export type RealismState = {
  version: 1; initializedOn: string; home: string; location: string;
  base: BaseKind; basePaidThrough: string; relocationDate?: string;
  journeys: Record<string, Journey>;
  familiarised: string[];
  activities: { id: string; date: string; kind: 'scout' | 'familiarise'; label: string }[];
  scouting: Record<string, { watched: string[]; lastDate: string }>;
  seenEvents: string[]; seenMatches: string[];
  digest: { id: string; date: string; title: string; lines: string[] }[];
  worldReviewedOn?: string;
  worldConditions?: Record<string, { injured: boolean; retired: boolean }>;
};
export type RealismAction =
  | { type: 'break'; choice: BreakChoice }
  | { type: 'base'; base: BaseKind; location: string }
  | { type: 'return-home' }
  | { type: 'familiarise'; eventId: string }
  | { type: 'scout'; opponentId: string };
