import { describe, expect, it } from 'vitest';
import { createStarterState, finishSeasonState, startNextSeasonState } from '../hooks/useGameState';
import { createSeasonEndReport, preserveSeasonEmails, seasonReportForMessage } from './seasonEndReport';

function completed() {
  const state = createStarterState();
  state.currentDate = '2027-06-29';
  state.tournaments = state.tournaments.map(t => ({ ...t, status: 'Skipped' }));
  return finishSeasonState(state);
}

describe('season-end email archive', () => {
  it('upgrades a legacy pending email and preserves it when starting the new season', () => {
    const state = completed();
    const email = state.inbox.find(m => m.seasonReport)!;
    delete email.seasonReport;
    const expected = createSeasonEndReport(state.seasonReview!);
    const next = startNextSeasonState(state);
    expect(next.seasonReview).toBeNull();
    const saved = next.inbox.find(m => m.id === email.id)!;
    expect(saved.seasonReport).toEqual(expected);
    next.player.cash = 999999;
    next.competitionTables.world.reverse();
    expect(seasonReportForMessage(next, saved)).toEqual(expected);
    expect(saved.seasonReport?.closingCash).toBeUndefined();
    expect(preserveSeasonEmails(next)).toBe(next);
  }, 30000);
  it('recovers an older season record without borrowing current rankings, winners or cash', () => {
    const state = completed();
    const email = state.inbox.find(m => m.seasonReport)!;
    delete email.seasonReport;
    const record = state.seasonReview!.completedSeason;
    state.seasonReview = null;
    const report = seasonReportForMessage(state, email)!;
    expect(report).toEqual({ record });
    expect(report.record.matchesPlayed).toBe(0);
    expect(report.record.titles).toBe(0);
    report.record.wins = 999;
    expect(record.wins).toBe(0);
    expect(seasonReportForMessage(state, { ...email, subject: '2025/26 end of season report ready' })).toBeNull();
    expect(seasonReportForMessage(state, { ...email, subject: 'Weekly report' })).toBeNull();
  }, 30000);
  it('freezes the closing facts and labels partial cash history with its actual dates', () => {
    const state = completed(), closing = createStarterState();
    closing.currentDate = '2027-06-29';
    closing.player.cash = 188275;
    closing.history.snapshots = [{ ...closing.history.snapshots[0], season:'2026/27', date:'2027-04-13', cash:187000 }];
    const review = state.seasonReview!;
    const report = createSeasonEndReport(review, closing);
    expect(report.cashMovement).toEqual({ from:'2027-04-13', to:'2027-06-29', change:1275 });
    expect(report.closingCash).toBe(188275);
    review.completedSeason.prizeMoney = 999999;
    review.majorWinners[0].winner = 'Changed later';
    expect(report.record.prizeMoney).not.toBe(999999);
    expect(report.majorWinners?.[0].winner).not.toBe('Changed later');
    expect(report.finalRankings?.every(row => row.ranking <= 3)).toBe(true);
  }, 30000);
});
