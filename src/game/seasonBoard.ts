import type { GameState } from '../hooks/useGameState';
import { depthOf, overlaps, plusDays } from './careerDepth/shared';
import { commitmentConflict } from './careerDepth/commitments';
export type SeasonBlock = { id: string; start: string; end: string; kind: 'training' | 'rest'; focus: 'long-pot' | 'safety' | 'pressure' | 'stamina' | 'cue-action' };
export type SeasonBoard = { priorities: string[]; blocks: SeasonBlock[] };
export const boardOf = (state: GameState): SeasonBoard => depthOf(state).board ?? { priorities: [], blocks: [] };
export function setPriority(state: GameState, id: string): GameState {
  const board = boardOf(state);
  if (!state.tournaments.some(t => t.id === id)) return state;
  return { ...state, careerDepth: { ...depthOf(state), board: { ...board, priorities: board.priorities.includes(id) ? board.priorities.filter(x => x !== id) : [...board.priorities, id] } }, lastAction: 'Season priority updated. Entry and travel still require booking.' };
}
export function blockConflict(state: GameState, start: string, end: string) {
  return commitmentConflict(state, start, end) ?? (state.tournaments.some(t => t.status === 'Booked' && overlaps(start,end,plusDays(t.startDate,-1),t.endDate ?? t.startDate)) ? 'Conflicts with a booked event.' : null)
    ?? (boardOf(state).blocks.some(b => overlaps(start,end,b.start,b.end)) ? 'Conflicts with another planning block.' : null);
}
export function reserveSeasonBlock(state: GameState, block: Omit<SeasonBlock,'id'|'end'>): GameState {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(block.start) || !Number.isFinite(Date.parse(block.start)) || !['training','rest'].includes(block.kind) || !['long-pot','safety','pressure','stamina','cue-action'].includes(block.focus)) return { ...state, lastAction: 'Choose a valid date and training focus.' };
  if (plusDays(block.start,0) !== block.start) return {...state,lastAction:'Choose a valid date.'};
  const end = plusDays(block.start,6), conflict = blockConflict(state,block.start,end);
  if (conflict) return { ...state,lastAction:conflict };
  const board = boardOf(state);
  return { ...state, careerDepth: { ...depthOf(state), board: { ...board, blocks: [...board.blocks,{ ...block,end,id:`${block.kind}:${block.start}` }] } }, lastAction: `Protected ${block.kind} week reserved. Existing weekly costs apply; no extra booking charge.` };
}
export function removeSeasonBlock(state: GameState,id: string): GameState {
  const board = boardOf(state), block = board.blocks.find(b => b.id === id);
  if (!block || block.start < state.currentDate || (state.trainingAppliedWeek === state.week && block.start < depthOf(state).nextSettlementDate)) return { ...state,lastAction:'An active or already applied block cannot be removed.' };
  return { ...state,careerDepth:{ ...depthOf(state),board:{ ...board,blocks:board.blocks.filter(b=>b.id!==id) } },lastAction:'Planning block removed.' };
}
