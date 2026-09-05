import type { GameState } from '../../hooks/useGameState';
import type { CareerDepthState } from './types';

export const bounded = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
export const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000);
export const plusDays = (date: string, days: number) => new Date((dayNumber(date) + days) * 86400000).toISOString().slice(0, 10);
export const overlaps = (a: string, b: string, c: string, d: string) => a <= d && c <= b;
export function createCareerDepth(state: GameState): CareerDepthState {
  return {
    version: 1, seenMatchIds: state.matches.map(m => m.id),
    seenEventIds: state.tournaments.filter(t => t.status === 'Completed').map(t => `${state.season}:${t.id}`),
    milestones: [], stories: [], relationships: {}, coachRelationships: {},
    partnerId: null, project: null, projectHistory: [], trainingWeeks: 0,
    commitments: [], schedule: null, strategy: 'ranking', targets: [],
    nextSettlementDate: plusDays(state.currentDate, 7), temporarySharpness: 0,
  };
}
export const depthOf = (state: GameState) => state.careerDepth ?? createCareerDepth(state);
export const pendingStory = (state: GameState) => depthOf(state).stories.find(s => s.status === 'pending');
export function peakPreparationWindows(state: GameState) {
  const plan = depthOf(state).schedule;
  if (!plan?.enabled || plan.strategy !== 'majors') return [];
  return state.tournaments.filter(t => plan.targets.includes(t.id) && plan.eventIds.includes(t.id) && !['Completed', 'Skipped'].includes(t.status))
    .map(t => ({ eventId: t.id, name: t.name, startDate: plusDays(t.startDate, -3), endDate: plusDays(t.startDate, -1) }));
}
export function uniqueOpponentId(state: GameState, name: string) {
  const candidates = state.worldPlayers.filter(p => p.playerName === name);
  return candidates.length === 1 ? candidates[0].id : undefined;
}
export function careerMessage(state: GameState, id: string, subject: string, preview: string, route = '/inbox'): GameState {
  if (state.inbox.some(m => m.id === id)) return state;
  return { ...state, inbox: [{ id, sender: 'Career Manager', subject, preview,
    priority: 'Medium' as const, date: state.currentDate, read: false,
    actionLabel: 'Review career update', actionRoute: route,
  }, ...state.inbox].slice(0, 18) };
}
