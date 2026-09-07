import type { GameState } from '../hooks/useGameState';
import type { InboxMessage, Tournament } from '../types/game';
import { resolveTournamentFormat } from '../data/tournamentFormats';

export type QualificationReport = {
  mainEventName: string;
  mainEvent?: { id: string; startDate: string; location: string };
  explanation: string;
};

export function qualificationReport(state: GameState, event: Pick<Tournament, 'id' | 'name' | 'startDate'>): QualificationReport | undefined {
  const history = state.history.tournamentHistory.find(h => h.tournamentId === event.id && h.startDate === event.startDate);
  if (history?.status !== 'Completed' || history.result !== 'Winner' || history.wins < 1) return undefined;
  const current = state.tournaments.find(t => t.id === event.id && t.startDate === event.startDate);
  const format = resolveTournamentFormat(current ?? { name: event.name, type: 'Professional Tour', formatId: history.formatId ?? undefined });
  if (!['internationalQualifier', 'worldOpenQualifier', 'proQualifier', 'ukMajorQualifying', 'worldChampionshipQualifying'].includes(format.id)) return undefined;
  const mainEventName = event.name.replace(/\s+Qualifying.*$/i, '');
  const main = state.tournaments.find(t => t.name === mainEventName && t.startDate >= event.startDate
    && Date.parse(t.startDate) - Date.parse(event.startDate) < 90 * 86400000);
  const bestOf = format.roundBestOf?.[format.roundStructure[0]];
  const explanation = format.roundStructure.length === 1
    ? `One ${bestOf ? `best-of-${bestOf} ` : ''}qualifying match was required. You won it and secured your main-draw place. No further qualifying match is needed.`
    : `You completed your qualifying route with ${history.wins} win${history.wins === 1 ? '' : 's'} and secured your main-draw place. No further qualifying match is needed.`;
  return { mainEventName, mainEvent: main ? { id: main.id, startDate: main.startDate, location: main.location } : undefined, explanation };
}

export function qualificationReportForMessage(state: GameState, message: InboxMessage | null, event?: Pick<Tournament, 'id' | 'name' | 'startDate'>) {
  return message?.qualificationReport ?? (event ? qualificationReport(state, event) : undefined);
}
