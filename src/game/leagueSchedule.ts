import type { GameState } from '../hooks/useGameState';
import type { Tournament, BracketRound, BracketMatchup } from '../types/game';
import { dayNumber, plusDays } from './careerDepth/shared';

export function leagueFixtureSchedule(event: Tournament, round: BracketRound, fixture: BracketMatchup) {
  if (round.groupRule !== 'league') return null;
  const players = new Set(round.matches.flatMap(m => [m.top.name, m.bottom.name]));
  const perRound = Math.max(1, Math.floor(players.size / 2));
  const matchday = fixture.matchday ?? Math.floor(round.matches.findIndex(m => m.id === fixture.id) / perRound);
  const rounds = Math.max(1, ...round.matches.map((m, i) => (m.matchday ?? Math.floor(i / perRound)) + 1));
  const days = Math.max(1, dayNumber(event.endDate ?? event.startDate) - dayNumber(event.startDate) + 1);
  const offset = Math.min(days - 1, Math.floor(Math.max(0, matchday) * days / rounds));
  return { date: plusDays(event.startDate, offset), matchday: matchday + 1, rounds, days };
}
export function nextLeagueFixture(state: GameState, event?: Tournament) {
  event ??= state.tournaments.find(t => t.id === state.tournamentProgress.tournamentId);
  if (!event || event.id !== state.tournamentProgress.tournamentId || event.status !== 'Entered') return null;
  const round = state.tournamentProgress.draw.find(r => r.label === state.tournamentProgress.currentRound);
  const fixture = round?.matches.find(m => (m.top.name === state.player.fullName || m.bottom.name === state.player.fullName) && (m.top.score === undefined || m.bottom.score === undefined));
  const schedule = round && fixture ? leagueFixtureSchedule(event, round, fixture) : null;
  return schedule && round && fixture ? { ...schedule, round, fixture, event } : null;
}
