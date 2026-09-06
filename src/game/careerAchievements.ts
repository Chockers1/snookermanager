import { careerLegacyOf } from './careerLegacy';
import { resolveTournamentFormat } from '../data/tournamentFormats';
import type { GameState } from '../hooks/useGameState';
import type { Match } from '../types/game';
import { careerMessage, depthOf } from './careerDepth/shared';
export type AchievementId = 'televised-win' | 'century' | 'final' | 'tour-card';
export type Achievement = { id: AchievementId; date?: string; evidence: string; matchId?: string };
export const ACHIEVEMENTS: { id: AchievementId; title: string; target: string }[] = [
  { id: 'televised-win', title: 'First televised win', target: 'Win a match in a televised round.' },
  { id: 'century', title: 'First century', target: 'Make a break of at least 100 in competition.' },
  { id: 'final', title: 'First final', target: 'Reach a tournament final. Qualifying places are separate.' },
  { id: 'tour-card', title: 'Secure a tour card', target: 'Earn or hold a professional tour card.' },
];
export function reconcileAchievements(state: GameState): GameState {
  const d = depthOf(state), initialized = d.achievements !== undefined;
  const awards = [...(d.achievements ?? [])];
  const add = (id: AchievementId, evidence: string, match?: Match) => {
    if (!awards.some(a => a.id === id)) awards.push({ id, evidence, date: match?.playedOn, matchId: match?.id });
  };
  const matches = [...state.matches].filter(m => m.result !== 'In Progress').sort((a,b) => (a.playedOn ?? '').localeCompare(b.playedOn ?? ''));
  for (const m of matches) {
    const event = state.tournaments.find(t => t.id === m.tournamentId);
    if (event?.type === 'Exhibition' || /pro-am/i.test(event?.name ?? '')) continue;
    if (m.highestBreak >= 100) add('century', `Recorded break of ${m.highestBreak} against ${m.opponentName}.`, m);
    if (m.result === 'Won' && (m.televised ?? event?.televisedRounds?.includes(m.round))) add('televised-win', `${event?.name ?? 'Recorded event'}: won the televised ${m.round} against ${m.opponentName}.`, m);
    const isQualifier = /qualif|q school/i.test(event?.name ?? '') || m.tournamentClass === 'qSchool' || Boolean(event && resolveTournamentFormat(event).qualifiers);
    if (!isQualifier && (m.round === 'Final' || (m.round === 'Semi Final' && m.result === 'Won'))) add('final', `${event?.name ?? 'Recorded event'}: reached the final.`, m);
  }
  if (careerLegacyOf(state).centuries > 0 || careerLegacyOf(state).highestBreak >= 100) add('century','A century is recorded in the surviving career totals; original match date unavailable.');
  if (careerLegacyOf(state).trophies.length) add('final','A tournament title is recorded in the career trophy cabinet.');
  if (state.careerSystems.pro.hasTourCard) add('tour-card', initialized ? 'Professional tour card secured.' : 'Professional tour card present in this save; original award date unavailable.');
  if (awards.length === d.achievements?.length) return state;
  const fresh = awards.filter(a => !d.achievements?.some(old => old.id === a.id));
  let next: GameState = { ...state, careerDepth: { ...d, achievements: awards } };
  if (initialized) for (const a of fresh) {
    if (!a.date) a.date = state.currentDate;
    next = careerMessage(next, `achievement:${a.id}`, `Career achievement: ${ACHIEVEMENTS.find(g => g.id === a.id)!.title}`, a.evidence, '/career/stats');
  }
  return next;
}
