import { resolveTournamentFormat } from '../../data/tournamentFormats';
import type { GameState } from '../../hooks/useGameState';
import type { Tournament } from '../../types/game';
import type { BreakChoice, MatchSessions } from './types';
type Live = NonNullable<GameState['liveMatch']>;
export function sessionPlan(bestOf: number, tournament?: Tournament): MatchSessions {
  const id = tournament ? resolveTournamentFormat(tournament).id : undefined;
  const publishedNineteen = bestOf === 19 && id && !['worldChampionshipMain', 'worldChampionshipQualifying', 'shanghaiMasters'].includes(id) ? [8, 11] : undefined;
  const configured = tournament?.sessionFrames?.[bestOf] ?? publishedNineteen;
  const defaults: Record<number, number[]> = { 17: [8, 9], 19: [9, 10], 21: [10, 11], 25: [8, 8, 9], 33: [8, 8, 8, 9], 35: [8, 9, 8, 10] };
  const frames = configured?.length && configured.every(n => Number.isInteger(n) && n > 0) && configured.reduce((n, x) => n + x, 0) === bestOf ? configured : defaults[bestOf] ?? [bestOf];
  return { frames, overnightAfter: tournament?.overnightAfterSessions ?? (bestOf === 33 ? [1, 3] : frames.length >= 3 ? [2] : []), completedBreaks: [] };
}
export function pendingMatchBreak(live: Live) {
  if (!live.sessions || live.status === 'Completed' || live.playerPoints > 0 || live.opponentPoints > 0 || live.currentBreak > 0) return null;
  const played = live.playerFrames + live.opponentFrames;
  if (!played || live.sessions.completedBreaks.some(b => b.afterFrame === played)) return null;
  let start = 0;
  for (let i = 0; i < live.sessions.frames.length; i++) {
    const end = start + live.sessions.frames[i];
    if (played === end && i < live.sessions.frames.length - 1) return { afterFrame: played, kind: live.sessions.overnightAfter.includes(i + 1) ? 'overnight' as const : 'session' as const, nextSession: i + 2 };
    if (played < end && ((played === start + 4 && (end - start >= 9 || live.sessions.frames.length > 1)) || (end - start === 13 && played === start + 8))) return { afterFrame: played, kind: 'interval' as const, nextSession: i + 1 };
    start = end;
  }
  return null;
}
export function resolveSessionBreak(live: Live, choice: BreakChoice): Live {
  const pause = pendingMatchBreak(live);
  if (!pause || !live.sessions || !['recover', 'reset', 'review'].includes(choice)) return live;
  const rest = pause.kind === 'overnight' ? 10 : pause.kind === 'session' ? 5 : 2;
  const fatigue = Math.max(0, live.playerFatigue - rest - (choice === 'recover' ? 2 : 0));
  const confidence = Math.min(90, live.playerConfidence + (choice === 'reset' && live.playerConfidence < 90 ? 2 : 0));
  const text = `${pause.kind === 'overnight' ? 'Overnight recovery' : pause.kind === 'session' ? 'Session break' : 'Mid-session interval'} after ${pause.afterFrame} frames: ${choice === 'recover' ? 'rest and hydrate' : choice === 'reset' ? 'mental reset' : 'review the tactical plan'}. Fatigue ${Math.round(live.playerFatigue)} → ${Math.round(fatigue)}. ${choice === 'review' ? live.coachPrompt.note : ''}`;
  return { ...live, playerFatigue: fatigue, opponentFatigue: Math.max(0, live.opponentFatigue - rest),
    playerConfidence: choice === 'reset' ? Math.max(live.playerConfidence, confidence) : live.playerConfidence,
    pressureValue: Math.max(0, live.pressureValue - (choice === 'reset' ? 3 : 0)),
    timeElapsedMinutes: live.timeElapsedMinutes + (pause.kind === 'overnight' ? 720 : pause.kind === 'session' ? 120 : 15),
    sessions: { ...live.sessions, completedBreaks: [...live.sessions.completedBreaks, { ...pause, choice }] },
    lastVisitSummary: text, intervalText: `Session ${pause.nextSession} · ${text}`,
    feed: [{ id: `break:${pause.afterFrame}`, time: 'Break', actor: 'System' as const, tone: 'blue' as const, text }, ...live.feed].slice(0, 80) };
}

export function sessionAssessment(live: Live): string[] {
  const rate = (made: number, attempted: number) => attempted ? `${Math.round(made / attempted * 100)}%` : 'no attempts';
  return [
    `Potting: ${rate(live.playerStats.potsMade, live.playerStats.potAttempts)} from ${live.playerStats.potAttempts} attempts; opponent ${rate(live.opponentStats.potsMade, live.opponentStats.potAttempts)}.`,
    `Safety success: ${rate(live.playerStats.safetiesWon, live.playerStats.safetyAttempts)}; ${live.playerStats.fouls} fouls so far. ${live.playerFatigue >= 60 ? 'Fatigue is high: recovery is worth considering.' : 'Use the score and observed exchanges to choose your next approach.'}`,
  ];
}
