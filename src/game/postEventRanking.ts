import type { GameState } from '../hooks/useGameState';
import type { InboxMessage } from '../types/game';
import type { EventFinancialReport } from './eventFinancialReport';
import { financialReportForMessage, reportMoney } from './eventFinancialReport';

export type PostEventRankingSnapshot = {
  eventKey: string; publication: string; credit?: number;
  before?: number; after?: number;
};
export function postEventRanking(state: GameState, finance: EventFinancialReport, saved?: PostEventRankingSnapshot) {
  const key = `${finance.tournamentId}:${finance.startDate}`;
  const snapshot = saved?.eventKey === key ? saved : undefined;
  const ledger = state.rollingRankings;
  const event = ledger?.events[key];
  const tournament = state.tournaments.find(t => t.id === finance.tournamentId && t.startDate === finance.startDate);
  if (!snapshot && !event?.ranking && !['World Ranking', 'One-Year'].includes(tournament?.rankingType ?? '')) return undefined;
  const earning = ledger?.earnings.find(e => e.eventKey === key && e.playerName === state.player.fullName);
  const publication = earning?.earnedOn ?? event?.completedOn ?? snapshot?.publication ?? tournament?.endDate ?? finance.startDate;
  const pending = publication > state.currentDate;
  const revisions = ledger?.revisions ?? [];
  const before = [...revisions].filter(r => r.date < publication).sort((a,b) => b.date.localeCompare(a.date))[0]?.world[state.player.fullName] ?? snapshot?.before;
  // Only the exact publication snapshot can establish the result. A later list
  // includes other events and must never be presented as this event's movement.
  const after = pending ? undefined : revisions.find(r => r.date === publication)?.world[state.player.fullName] ?? snapshot?.after;
  const credit = earning?.amount ?? snapshot?.credit;
  const movement = before !== undefined && after !== undefined ? before - after : undefined;
  const currentRank = state.competitionTables.world.find(r => r.playerName === state.player.fullName)?.ranking;
  const value = pending ? currentRank ? `#${currentRank}` : 'Unranked' : after ? `#${after}` : 'Not recorded';
  const detail = pending ? 'Ranking credit pending' : movement === undefined ? 'Publication movement unavailable' : movement > 0 ? `Up ${movement} ${movement === 1 ? 'place' : 'places'}` : movement < 0 ? `Down ${-movement} ${movement === -1 ? 'place' : 'places'}` : 'No movement at publication';
  return { snapshot: { eventKey:key, publication, credit, before, after }, pending, value, detail, movement,
    creditLabel: credit === undefined ? 'Credit not recorded' : credit === 0 ? 'No ranking credit' : `+${reportMoney(credit)} ranking credit`,
    rankLabel: pending ? 'Current world ranking' : 'World ranking at publication',
    change: before !== undefined && after !== undefined ? `#${before} → #${after}` : undefined };
}
export function capturePostEventRankings(state: GameState): GameState {
  return { ...state, inbox: state.inbox.map(message => {
    const finance = financialReportForMessage(state, message);
    if (!finance) return message;
    const report = postEventRanking(state, finance, message.eventRanking);
    if (!report) return message;
    const summary: InboxMessage['summary'] = message.summary?.map(item => item.label.includes('Ranking') ? { ...item, label:'World Ranking', value:report.value, detail:report.detail, tone:report.pending ? 'warning' : (report.movement ?? 0) > 0 ? 'positive' : (report.movement ?? 0) < 0 ? 'negative' : 'neutral' } : item);
    return { ...message, eventRanking:report.snapshot, summary };
  }) };
}
