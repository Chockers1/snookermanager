import { describe, it, expect } from 'vitest';
import { detailedTournamentCatalog } from './pathwayCalendarData';
import { TOURNAMENT_FORMATS, resolveTournamentFormat, getPlayableRounds, getBestOfForRound } from './tournamentFormats';
import { createStarterState, buildTournamentDraw, resolveTournamentDrawRound, getTournamentRoundPlan } from '../hooks/useGameState';
import { fixtureComplete, isGroupDraw } from '../game/championshipLeague';

describe('exhaustive tournament rules audit', () => {
  it.each(Object.entries(TOURNAMENT_FORMATS))('%s defines every round explicitly', (_, f) => {
    for (const round of getPlayableRounds(f)) {
      expect(Number.isInteger(f.roundBestOf?.[round]), round).toBe(true);
      expect(f.roundBestOf?.[round], round).toBeGreaterThan(0);
    }
  });
  const state = createStarterState();
  it.each(detailedTournamentCatalog)('$name has a complete playable draw with no phantom rounds', t => {
    const format = resolveTournamentFormat(t), labels = getPlayableRounds(format);
    if (!labels.length) return;
    const draw = buildTournamentDraw(state, t, labels[0], false);
    for (const label of labels) resolveTournamentDrawRound(draw, t, label, '', () => .21);
    for (const round of draw) {
      expect(round.matches.length, round.label).toBeGreaterThan(0);
      expect(getTournamentRoundPlan(t, round.label).bestOf).toBe(getBestOfForRound(t, round.label, -1));
      for (const m of round.matches) {
        expect(fixtureComplete(m), `${round.label}: ${m.top.name} v ${m.bottom.name}`).toBe(true);
        expect(m.top.name).not.toBe(m.bottom.name);
        const n = getBestOfForRound(t, round.label, -1);
        expect(Math.max(m.top.score!, m.bottom.score!)).toBe(n === 4 ? 3 : Math.floor(n / 2) + 1);
      }
    }
    const names = new Set(draw.flatMap(r => r.matches.flatMap(m => [m.top.name, m.bottom.name])));
    expect(names.size).toBe(format.fieldSize);
    if (!isGroupDraw(draw)) {
      expect(draw.at(-1)!.matches.length).toBe(format.qualifiers ?? 1);
      expect(draw.reduce((n, r) => n + r.matches.length, 0)).toBe(format.fieldSize! - (format.qualifiers ?? 1));
    }
  });
  it.each([
    ['World Championship', [19, 25, 25, 33, 35]],
    ['World Championship Qualifying', [19, 19, 19, 19]],
    ['UK Championship', [11, 11, 11, 11, 19]],
    ['UK Championship Qualifying', [11, 11, 11, 11]],
    ['British Open', [7, 7, 7, 7, 9, 11, 19]],
    ['English Open', [7, 7, 7, 11, 11, 17]],
    ['Tour Championship', [19, 19, 19, 19]],
    ['World Grand Prix', [9, 9, 9, 11, 19]],
    ['Shanghai Masters', [11, 11, 11, 19, 21]],
    ['Saudi Arabia Masters', [7, 7, 7, 9, 9, 11, 11, 11, 19]],
    ['International Championship Qualifying', [11]],
    ['World Open Qualifying', [9]],
    ['English Open Qualifying', [7, 7]],
    ['German Masters', [9, 9, 9, 9, 9, 9, 11, 19]],
  ] as const)('%s plays the published frame sequence', (name, expected) => {
    const t = detailedTournamentCatalog.find(t => t.name === name)!;
    expect(getPlayableRounds(resolveTournamentFormat(t)).map(r => getTournamentRoundPlan(t, r).bestOf)).toEqual(expected);
  });
});
