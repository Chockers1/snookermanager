import type { GameState } from '../../hooks/useGameState';
import type { OpponentRelationship } from './types';

export const rivalryExplanation = 'A rivalry forms after at least three meetings, including two deciders, three close matches, or two finals. Intensity measures the shared history; it is not an unlock percentage.';
export function rivalryStage(r: OpponentRelationship) {
  return r.rivalry ? 'Established rivalry' : r.wins + r.losses + (r.draws ?? 0) >= 2 ? 'Developing history' : 'First meeting';
}
export function rivalryRecords(state: GameState) {
  return Object.values(state.careerDepth?.relationships ?? {}).sort((a,b) => Number(b.rivalry)-Number(a.rivalry) || (b.intensity ?? 0)-(a.intensity ?? 0) || (b.wins+b.losses+(b.draws??0))-(a.wins+a.losses+(a.draws??0)) || a.name.localeCompare(b.name));
}
export function rivalryMeetings(state: GameState, relation: OpponentRelationship) {
  const names = state.worldPlayers.filter(p => p.playerName === relation.name);
  const unambiguous = names.length <= 1 && (!names[0] || names[0].id === relation.opponentId);
  const retained = state.history.matchLog.filter(m => unambiguous && m.result !== 'In Progress' && m.opponentName === relation.name).map(m => ({
    id: m.id, date: m.date, event: m.tournamentName,
    round: m.round, score: m.playerFrames + '–' + m.opponentFrames, result: m.result,
  }));
  const byId = new Map([...retained, ...(relation.meetings ?? [])].map(m => [m.id,m]));
  return [...byId.values()].sort((a,b) => b.date.localeCompare(a.date)).slice(0,8);
}
