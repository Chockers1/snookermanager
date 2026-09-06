import type { GameState } from '../hooks/useGameState';
import type { InboxMessage } from '../types/game';

type Review = NonNullable<GameState['seasonReview']>;
export type SeasonEndReport = {
  record: Review['completedSeason'];
  nextSeason?: string;
  decision?: Review['careerDecision'];
  majorWinners?: Review['majorWinners'];
  finalRankings?: Review['finalRankings'];
  worldNumberOne?: string;
  closingCash?: number;
  cashMovement?: { from: string; to: string; change: number };
};

/** Archive facts before the calendar, rankings and review transition are replaced. */
export function createSeasonEndReport(review: Review, closingState?: GameState): SeasonEndReport {
  const snapshots = closingState?.history.snapshots.filter(s => s.season === review.completedSeason.season);
  const first = snapshots?.[0];
  return structuredClone({
    record: review.completedSeason, nextSeason: review.nextSeason,
    decision: review.careerDecision, majorWinners: review.majorWinners,
    finalRankings: review.finalRankings?.filter(r => r.ranking <= 3),
    worldNumberOne: review.worldNumberOne?.playerName,
    ...(closingState ? { closingCash: closingState.player.cash } : {}),
    ...(first && closingState ? { cashMovement: { from: first.date, to: closingState.currentDate, change: closingState.player.cash - first.cash } } : {}),
  });
}

export function seasonReportForMessage(state: GameState, message: InboxMessage | null): SeasonEndReport | null {
  if (!message) return null;
  if (message.seasonReport) return message.seasonReport;
  const season = message.subject.match(/^(\d{4}\/\d{2,4}) end of season report(?: ready)?$/i)?.[1];
  if (!season) return null;
  if (state.seasonReview?.completedSeason.season === season) return createSeasonEndReport(state.seasonReview);
  const record = state.history.seasonRecords.find(r => r.season === season);
  // Older saves may retain only the season record. Never substitute current standings or cash.
  return record ? { record: structuredClone(record) } : null;
}

export function preserveSeasonEmails(state: GameState): GameState {
  let changed = false;
  const inbox = state.inbox.map(message => {
    if (message.seasonReport) return message;
    const seasonReport = seasonReportForMessage(state, message);
    if (!seasonReport) return message;
    changed = true;
    return { ...message, seasonReport };
  });
  return changed ? { ...state, inbox } : state;
}
