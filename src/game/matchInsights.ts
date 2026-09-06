import type { GameState } from '../hooks/useGameState';
import type { Match, Tournament } from '../types/game';
import type { ProjectKind } from './careerDepth/types';
import { getRivalry } from './careerDepth/relationships';

export type PersonalMatchObjective = { id: 'frames' | 'break'; label: string; target: number; actual?: number; achieved?: boolean };
export type MatchDebrief = { headline: string; evidence: string[]; training: { kind: ProjectKind; title: string; reason: string; sessions: string }; confidenceBonus: number; bonusReason?: string };
export function matchObjectives(state: GameState, opponentRank: number, bestOf: number): PersonalMatchObjective[] {
  const rank = state.rankings.find(r => r.playerName === state.player.fullName)?.ranking ?? state.player.worldRanking ?? state.player.amateurRanking ?? opponentRank;
  const underdog = opponentRank > 0 && rank > opponentRank * 1.5;
  const frames = bestOf === 4 ? 2 : Math.floor(bestOf / 2) + 1;
  const target = underdog ? Math.max(1, Math.floor(frames / 3)) : Math.max(1, Math.ceil(frames / 2));
  const skill = state.attributes.technical['Break Building'] ?? 50;
  const breakTarget = bestOf === 1 ? skill >= 75 ? 30 : 20 : skill >= 80 ? 60 : skill >= 65 ? 40 : 25;
  const objectives: PersonalMatchObjective[] = [{ id: 'break', label: `Make a break of ${breakTarget}+`, target: breakTarget }];
  if (bestOf > 1) objectives.unshift({ id: 'frames', label: `Win at least ${target} frame${target === 1 ? '' : 's'}${underdog ? ' against the stronger seed' : ''}`, target });
  return objectives;
}
export function assessMatchObjectives(objectives: PersonalMatchObjective[] | undefined, match: Match): PersonalMatchObjective[] {
  return (objectives ?? []).map(goal => { const actual = goal.id === 'frames' ? match.playerFrames : match.highestBreak; return { ...goal, actual, achieved: actual >= goal.target }; });
}
export function matchDebrief(state: GameState, match: Match): MatchDebrief {
  const frames = match.playerFrames + match.opponentFrames;
  const evidence: string[] = [`You ${match.result === 'Won' ? 'won' : match.result === 'Drawn' ? 'drew' : 'lost'} ${match.playerFrames}–${match.opponentFrames}. Highest breaks: ${match.highestBreak} for you, ${match.opponentHighestBreak} for ${match.opponentName}.`];
  const tight = (match.frameHistory ?? []).filter(f => /^\d+$/.test(f.player) && /^\d+$/.test(f.opponent) && Math.abs(Number(f.player) - Number(f.opponent)) <= 15);
  if (tight.length) evidence.push(`${tight.length} frame${tight.length === 1 ? '' : 's'} finished within 15 points; you won ${tight.filter(f => f.winner === match.playerName).length} of them. Small margins mattered.`);
  if (match.fifties || match.centuries) evidence.push(`${match.fifties} breaks of 50+ and ${match.centuries} centuries recorded. A century is included in the 50+ total.`);
  const baseline = state.matches.filter(m => m.id !== match.id && m.result !== 'In Progress' && Number.isFinite(m.potSuccess) && (!match.playedOn || !m.playedOn || m.playedOn <= match.playedOn)).slice(0, 5);
  if (baseline.length >= 3 && Number.isFinite(match.potSuccess)) {
    const avg = baseline.reduce((n, m) => n + m.potSuccess, 0) / baseline.length;
    evidence.push(`Estimated pot success was ${match.potSuccess.toFixed(1)}%, compared with ${avg.toFixed(1)}% across your previous ${baseline.length} recorded matches.`);
  }
  let training: MatchDebrief['training'];
  const decider = match.bestOf > 1 && match.bestOf % 2 === 1 && frames === match.bestOf;
  if (frames && match.fouls / frames > .75) training = { kind: 'cue-action', title: 'Tighten cue-ball control', reason: `${match.fouls} fouls in ${frames} frames gave away avoidable points.`, sessions: 'Three Line-Up Drill sessions over the next free training week.' };
  else if (match.safetySuccess < 65) training = { kind: 'safety', title: 'Make safety more dependable', reason: `Estimated safety success was ${match.safetySuccess.toFixed(1)}%. Work on control before relying on difficult escapes.`, sessions: 'Three Safety Exchanges sessions over the next free training week.' };
  else if (match.longPotSuccess < 65) training = { kind: 'long-pot', title: 'Improve the opening chance', reason: `Estimated long-pot success was ${match.longPotSuccess.toFixed(1)}%. Be selective with long openings.`, sessions: 'Two Long Pot Routine sessions and one Line-Up Drill in a free week.' };
  else if (decider && match.result === 'Lost') training = { kind: 'pressure', title: 'Rehearse deciding frames', reason: 'This match went the distance. One decider does not prove a mental weakness; practise your routine under a score target.', sessions: 'Two Mental Training sessions and one Review in a free week.' };
  else if (frames >= 12 && match.fatigueChange >= 10) training = { kind: 'stamina', title: 'Build long-match endurance', reason: `${frames} frames added ${match.fatigueChange} fatigue.`, sessions: 'Recover first, then three Fitness sessions in a free week.' };
  else training = { kind: 'cue-action', title: 'Repeat your scoring routine', reason: `Your best break was ${match.highestBreak}. Use controlled cue-action practice to make chances repeatable.`, sessions: 'Two Line-Up Drill sessions and one Long Pot Routine in a free week.' };
  return { headline: tight.length && match.result !== 'Drawn' ? 'The tight frames deserve a closer look' : match.result === 'Won' ? 'Build on the parts that worked' : match.result === 'Drawn' ? 'A shared result, with useful progress to measure' : 'A defeat with a specific next step', evidence, training, confidenceBonus: 0 };
}
export function coachingAdvice(state: GameState, opponent: string, tournament?: Tournament) {
  const coach = state.coaches.find(c => state.coachContracts.some(contract => contract.coachId === c.id) && c.id === state.currentCoachId) ?? state.coaches.find(c => state.coachContracts.some(contract => contract.coachId === c.id));
  const encounters = state.matches.filter(m => m.opponentName === opponent && m.result !== 'In Progress');
  const relation = getRivalry(state, opponent);
  const fatigue = state.player.fatigue;
  let tactic: 'Attack' | 'Balanced' | 'Safety' = 'Balanced';
  let tactical = 'Start with controlled scoring and avoid forcing low-percentage long pots. Review the opening frames before changing approach.';
  if (fatigue >= 65) { tactic = 'Safety'; tactical = `Fatigue is ${Math.round(fatigue)}%. Reduce ambitious openings and take recovery opportunities between sessions.`; }
  else if (encounters.length >= 3 && encounters.reduce((n,m) => n + m.opponentHighestBreak, 0) / encounters.length >= 65) { tactic = 'Safety'; tactical = `${opponent} averaged a highest break of ${Math.round(encounters.reduce((n,m) => n + m.opponentHighestBreak, 0) / encounters.length)} across ${encounters.length} meetings. Prioritise leaving the cue ball safe when a pot is uncertain.`; }
  else if ((state.attributes.technical['Safety Play'] ?? 50) < 60 && (state.attributes.technical['Long Potting'] ?? 50) >= 75) { tactic = 'Attack'; tactical = 'Your long potting is stronger than your safety. Take clear openings, while avoiding speculative shots that expose the table.'; }
  if (relation?.rivalry && Math.max(0, ...Object.values(relation.tactics)) >= 3) tactical += ' This rival has seen your preferred approach repeatedly; vary it when the table calls for it.';
  const days = tournament ? Math.ceil((Date.parse(tournament.startDate) - Date.parse(state.currentDate)) / 86400000) : null;
  const schedule = !tournament ? 'No eligible event is selected. Use a free week for development, then check the calendar before adding a commitment.' : days !== null && days <= 3 ? `${tournament.name} ${days <= 0 ? 'is under way' : `starts in ${days} days`}. Keep remaining sessions light: Match Prep, Review and Rest.` : fatigue >= 65 ? `${tournament.name} starts on ${tournament.startDate}. Recover before increasing training load; review overlapping entries in the calendar.` : `${tournament.name} starts on ${tournament.startDate}. Work on one development project now and protect the final three days for light preparation.`;
  return { coach: coach?.name ?? 'Preparation guidance', tactic, tactical, schedule, evidence: encounters.length < 3 ? 'Fewer than three recorded meetings: this is a cautious plan, not a reliable read of the opponent.' : `Based on ${encounters.length} recorded meetings and your current condition.` };
}
