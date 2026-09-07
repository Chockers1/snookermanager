import type { GameState } from '../hooks/useGameState';
import type { InboxMessage } from '../types/game';
import { financialReportForMessage, reportMoney } from './eventFinancialReport';
import { victoryCelebration } from './victoryCelebration';

export function victoryForMessage(state: GameState, message: InboxMessage) {
  if (message.victoryReport) return message.victoryReport;
  const finance = financialReportForMessage(state, message);
  if (!finance) return undefined;
  const event = state.history.tournamentHistory.find(h => h.tournamentId === finance.tournamentId && h.startDate === finance.startDate);
  if (!event || event.result !== 'Winner' || event.status !== 'Completed') return undefined;
  const match = state.matches.find(m => m.tournamentId === event.tournamentId && (m.season ?? state.season) === event.season && m.round === event.roundResults?.at(-1)?.round);
  return victoryCelebration(state, match) ?? undefined;
}

export function captureVictoryMessages(state: GameState): GameState {
  let changed = false;
  const inbox = state.inbox.map(message => {
    if (message.victoryReport) return message;
    const victoryReport = victoryForMessage(state, message);
    if (!victoryReport) return message;
    changed = true;
    return { ...message, victoryReport };
  });
  return changed ? { ...state, inbox } : state;
}

export function victoryMessageTitle(message: InboxMessage) {
  const victory = message.victoryReport;
  return victory ? `${victory.exhibition ? 'Exhibition victory' : 'Champion'}: ${victory.name}` : message.subject;
}
export function victoryMessagePreview(message: InboxMessage) {
  const victory = message.victoryReport;
  return victory ? `${victory.player} defeats ${victory.opponent} ${victory.score}. ${victory.milestone} · ${reportMoney(victory.prize)} prize secured.` : message.preview;
}
