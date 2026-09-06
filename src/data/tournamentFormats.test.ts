import { describe, expect, it } from 'vitest';
import { detailedTournamentCatalog } from './pathwayCalendarData';
import { getBestOfForRound, resolveTournamentFormat } from './tournamentFormats';

describe('Shoot Out match lengths', () => {
  const tournament = detailedTournamentCatalog.find(event => event.name === 'Shoot Out')!;
  it.each(['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'])(
    'plays %s over a single frame even with a normal ranking-event fallback',
    round => {
      expect(resolveTournamentFormat(tournament).roundStructure).toContain(round);
      expect(getBestOfForRound(tournament, round, 7)).toBe(1);
    },
  );
});
