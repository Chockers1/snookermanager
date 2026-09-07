import { describe, expect, it } from 'vitest';
import { victoryFixture } from '../../test-support/victoryFixture';
import { qualificationFixture } from '../../test-support/qualificationFixture';
import { postEventRankingFixture } from '../../test-support/postEventRankingFixture';
import { victoryCelebration } from './victoryCelebration';

describe('tournament victory recognition', () => {
  it('celebrates a real title with recorded comeback, decider, trophy and rewards without mutating the save', () => {
    const {state,match} = victoryFixture();
    const before = JSON.stringify(state);
    const info = victoryCelebration(state,match)!;
    expect(info.score).toBe('10–9');
    expect(info.highlight).toContain('From 2 frames behind');
    expect(info.frameHighlight).toBe('Deciding frame: 106–0');
    expect(info.breakHighlight).toBe('1 century in the final · highest break 106');
    expect(info.milestone).toBe('First recorded ranking title');
    expect(info.prize).toBe(140000);
    expect(info.credit).toBe(info.prize);
    expect(info.pending).toBe(true);
    expect(info.trophyRecorded).toBe(true);
    expect(JSON.stringify(state)).toBe(before);
  });
  it('does not celebrate qualifying places or an ordinary match as a title', () => {
    const state = qualificationFixture();
    expect(victoryCelebration(state,state.matches[0])).toBeNull();
    const other = postEventRankingFixture().state;
    expect(victoryCelebration(other,other.matches[0])).toBeNull();
    expect(victoryCelebration(other,other.matches[1])).toBeNull();
  });
  it('keeps exhibition achievements separate from ranking titles', () => {
    const {state,match} = victoryFixture();
    state.history.tournamentHistory.find(h=>h.tournamentId===match.tournamentId)!.eventType='Exhibition';
    const info = victoryCelebration(state,match)!;
    expect(info.exhibition).toBe(true);
    expect(info.ranking).toBe(false);
    expect(info.headline).toBe('Exhibition victory');
    expect(info.milestone).toBe('Exhibition achievement recorded');
  });
  it('does not invent a comeback or deciding-frame score from incomplete records', () => {
    const {state,match} = victoryFixture();
    const info = victoryCelebration(state,{...match,frameHistory:[]})!;
    expect(info.frameHighlight).toBeUndefined();
    expect(info.highlight).not.toContain('behind');
    expect(info.highlight).toContain('deciding-frame victory');
  });
});
