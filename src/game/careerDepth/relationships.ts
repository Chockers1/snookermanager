import type { GameState } from '../../hooks/useGameState';
import type { Match } from '../../types/game';
import { bounded, depthOf, uniqueOpponentId, plusDays } from './shared';

export function recordEncounter(state: GameState, match: Match): GameState {
  const id = match.opponentId ?? uniqueOpponentId(state, match.opponentName);
  if (!id || match.result === 'In Progress') return state;
  const depth = depthOf(state);
  const old = depth.relationships[id] ?? { opponentId: id, name: match.opponentName,
    wins: 0, losses: 0, deciders: 0, rivalry: false, recent: [], tactics: {} };
  const won = match.result === 'Won';
  const deciders = old.deciders + Number(match.playerFrames + match.opponentFrames === match.bestOf);
  const tactic = match.playerTactic;
  return { ...state, careerDepth: { ...depth, relationships: { ...depth.relationships,
    [id]: { ...old, wins: old.wins + Number(won), losses: old.losses + Number(!won), deciders,
      rivalry: old.wins + old.losses + 1 >= 3 && deciders >= 2,
      recent: [...old.recent, won ? 'W' as const : 'L' as const].slice(-10),
      tactics: tactic ? { ...old.tactics, [tactic]: (old.tactics[tactic] ?? 0) + 1 } : old.tactics },
  } } };
}
export function getRivalry(state: GameState, name: string) {
  const id = uniqueOpponentId(state, name);
  return id ? depthOf(state).relationships[id] : undefined;
}
export function learnedCounter(state: GameState, name: string): 'Measured' | 'Pressing' | 'Tight' | undefined {
  const id = uniqueOpponentId(state, name);
  if (!id || state.worldPlayers.find(p => p.id === id)?.retired) return undefined;
  const relation = getRivalry(state, name);
  if (!relation?.rivalry) return undefined;
  const [style, count] = Object.entries(relation.tactics).sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!count || count < 3) return undefined;
  return style === 'Attack' ? 'Tight' : style === 'Safety' ? 'Pressing' : 'Measured';
}
export function partnerCandidates(state: GameState) {
  const overall = Object.values(state.attributes.technical).reduce((a, b) => a + b, 0) / Object.keys(state.attributes.technical).length;
  return state.worldPlayers.filter(p => !p.retired && p.playerName !== state.player.fullName && !p.injuryWeeks &&
    Math.abs(p.age - state.player.age) <= 12 && Math.abs((p.overallRating ?? overall) - overall) <= 15)
    .sort((a, b) => Math.abs((a.overallRating ?? overall) - overall) - Math.abs((b.overallRating ?? overall) - overall) || a.id.localeCompare(b.id))
    .slice(0, state.realism?.base === 'academy' ? 24 : state.realism?.base === 'rented' ? 16 : 12);
}
export function coachRelationshipLabel(trust: number) {
  return trust >= 70 ? 'Strong working relationship' : trust < 40 ? 'Plan needs a conversation' : 'Building understanding';
}
export function coachNegotiationAdjustment(state: GameState, coachId: string) {
  const trust = depthOf(state).coachRelationships[coachId]?.trust ?? 55;
  return bounded((55 - trust) / 1000, -0.03, 0.03);
}

export function reviewCoachPlan(state: GameState, id: string): GameState {
  const d = depthOf(state), old = d.coachRelationships[id] ?? { trust: 55, note: 'Building understanding' };
  if (!state.coachContracts.some(c => c.coachId === id)) return { ...state, lastAction: 'This coach is no longer on your staff.' };
  if (old.lastReviewDate && state.currentDate < plusDays(old.lastReviewDate, 28)) return { ...state, lastAction: `Your next coaching review is available on ${plusDays(old.lastReviewDate, 28)}.` };
  const overloaded = state.trainingCondition.strain >= 70 || state.trainingCondition.burnout >= 70 || state.player.fatigue >= 75;
  const note = overloaded ? 'Agreed to prioritise recovery before pushing the development project.' : d.project?.status === 'active' ? 'Agreed to complete three relevant sessions per free training week; review the evidence in four weeks.' : 'Choose a named development project together in Training; no contract change is needed.';
  return { ...state, careerDepth: { ...d, coachRelationships: { ...d.coachRelationships, [id]: { ...old, lastReviewDate: state.currentDate, note, trust: bounded(old.trust + 1, 25, 90) } } }, lastAction: note };
}
