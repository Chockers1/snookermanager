import { createTournamentBriefing } from './tournamentCareerHistory';
import type { GameState } from '../hooks/useGameState';
import type { InboxMessage, Tournament } from '../types/game';
import { selectNextEligibleTournament } from './tournamentScheduling';
import { entryDeadline } from './tournamentEntry';

type EntryAccess = (state: GameState, event: Tournament) => { allowed: boolean; reason: string | null };
export type SeasonStartReport = {
  season: string; previousSeason: string; asOf: string; careerStage: string;
  rankingLabel: string; ranking: number | null; cash: number; confidence: number; freshness: number;
  sponsorIncome: number; sponsorCount: number; tourStatus: string;
  lastSeason?: { wins: number; losses: number; matches: number; titles: number; prize: number };
  nextEventId?: string;
  events: { id: string; name: string; date: string; location: string; status: string; reason: string | null; deadline: string; previousFinish: string; previousPrize?: number; priority: boolean }[];
};
const seasonFromMessage = (message: InboxMessage) => message.subject.match(/^(\d{4}\/\d{2,4}) season started$/i)?.[1];

export function createSeasonStartReport(state: GameState, entryAccess: EntryAccess): SeasonStartReport {
  const year = Number(state.season.slice(0, 4));
  const previousSeason = (year - 1) + '/' + String(year).slice(-2);
  const previous = state.history.seasonRecords.find(r => r.season === previousSeason);
  const next = selectNextEligibleTournament(state, entryAccess);
  const priorities = new Set(state.careerDepth?.board?.priorities ?? []);
  const upcoming = state.tournaments.filter(t => (t.endDate ?? t.startDate) >= state.currentDate && !['Skipped', 'Completed'].includes(t.status))
    .sort((a,b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id));
  const pro = state.careerSystems.pro;
  const mainTour = pro.hasTourCard && !state.careerSystems.lateCareer.seniorActive;
  const selected: Tournament[] = [];
  const add = (event: Tournament | undefined) => { if (event && selected.length < 5 && !selected.some(t => t.id === event.id)) selected.push(event); };
  add(next);
  if (mainTour) upcoming.filter(t => /^(world championship|uk championship|uk major|masters)$/i.test(t.name)).forEach(add);
  upcoming.filter(t => priorities.has(t.id)).forEach(add);
  // Pathway careers see their own eligible highlights, not an unrelated professional calendar.
  upcoming.filter(t => entryAccess(state,t).allowed).sort((a,b) => (b.prestige ?? 0) - (a.prestige ?? 0) || a.startDate.localeCompare(b.startDate)).slice(0,2).forEach(add);
  upcoming.filter(t => entryAccess(state,t).allowed).forEach(add);
  selected.sort((a,b) => a.startDate.localeCompare(b.startDate));
  const rankingTables: Record<string, keyof GameState['competitionTables']> = { 'World Ranking':'world', 'Q Tour Ranking':'qTour', 'Q School Ranking':'qSchool', 'Q School OOM':'qSchool', 'Amateur Ranking':'amateur', 'Senior Ranking':'senior', 'Youth Ranking':'youth', 'One-Year Ranking':'oneYear' };
  const tableKey = rankingTables[state.player.rankingLabel];
  const ranking = (tableKey ? state.competitionTables[tableKey].find(r => r.playerName === state.player.fullName)?.ranking : undefined)
    ?? (state.player.rankingLabel === 'World Ranking' ? pro.worldRank ?? state.player.worldRanking : undefined) ?? null;
  return {
    season: state.season, previousSeason, asOf: state.currentDate, careerStage: state.player.careerStage,
    rankingLabel: state.player.rankingLabel, ranking, cash: state.player.cash,
    confidence: state.player.confidence, freshness: Math.max(0,100-state.player.fatigue),
    sponsorIncome: state.sponsors.reduce((sum,s) => sum+s.monthlyValue,0), sponsorCount: state.sponsors.length,
    tourStatus: state.careerSystems.lateCareer.retired ? 'Retired from competition' : pro.hasTourCard ? 'Professional tour card active' + (pro.expiresAfterSeason ? ' · through '+pro.expiresAfterSeason : '') : state.player.careerStage + ' pathway',
    ...(previous ? { lastSeason: { wins:previous.wins, losses:previous.losses, matches:previous.matchesPlayed, titles:previous.titles, prize:previous.prizeMoney } } : {}),
    nextEventId: next?.id,
    events: selected.map(t => {
      const access = entryAccess(state,t);
      const result = createTournamentBriefing(state,t).previous;
      return { id:t.id, name:t.name, date:t.startDate, location:t.location, deadline:entryDeadline(t),
        status: ['Entered','Booked'].includes(t.status) ? t.status : access.allowed ? 'Entry available' : 'Not eligible',
        reason: access.allowed || ['Entered','Booked'].includes(t.status) ? null : access.reason,
        previousFinish: result?.finish ?? 'No recorded appearance',
        ...(result?.played && result.prize !== null ? { previousPrize:result.prize } : {}), priority:priorities.has(t.id) };
    }),
  };
}

/** Current-season briefings stay live; archived briefings keep their saved facts. */
export function seasonStartReportForMessage(state: GameState, message: InboxMessage | null, entryAccess: EntryAccess): SeasonStartReport | null {
  if (!message) return null;
  const season = message.seasonStartReport?.season ?? seasonFromMessage(message);
  if (season === state.season) return createSeasonStartReport(state, entryAccess);
  return message.seasonStartReport ?? null;
}

export function preserveSeasonStartEmails(state: GameState, entryAccess: EntryAccess): GameState {
  let changed = false;
  const inbox = state.inbox.map(message => {
    if (message.seasonStartReport || seasonFromMessage(message) !== state.season) return message;
    changed = true;
    return { ...message, seasonStartReport:createSeasonStartReport(state, entryAccess) };
  });
  return changed ? { ...state, inbox } : state;
}
