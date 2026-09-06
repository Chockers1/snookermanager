import type { Tournament } from '../../types/game';
import { getPlayableRounds, resolveTournamentFormat } from '../../data/tournamentFormats';
import { dayNumber, plusDays } from '../careerDepth/shared';

// The career plays event rounds on one calendar anchor. Spread accommodation
// nights across the configured event dates, allowing several rounds on one day.
export function hotelRoundDate(tournament: Tournament, round: string) {
  const rounds = getPlayableRounds(resolveTournamentFormat(tournament));
  const index = Math.max(0, rounds.indexOf(round));
  const span = Math.max(0, dayNumber(tournament.endDate ?? tournament.startDate) - dayNumber(tournament.startDate));
  return plusDays(tournament.startDate, Math.floor(span * index / Math.max(1, rounds.length - 1)));
}
export function hotelStayPlan(tournament: Tournament, arrival: string, entryRound: string) {
  const through = hotelRoundDate(tournament, entryRound);
  return {
    through,
    minNights: Math.max(1, dayNumber(through) - dayNumber(arrival) + 1),
    maxNights: Math.max(1, dayNumber(tournament.endDate ?? tournament.startDate) - dayNumber(arrival) + 1),
  };
}
