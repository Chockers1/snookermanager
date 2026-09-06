import type { GameState } from '../hooks/useGameState';
import type { Match } from '../types/game';

export type CareerTrophy = {
  id: string; tournamentId: string; name: string; season: string; date: string;
  category: string; circuit: string; rankingType?: string; opponent: string; score: string; prizeMoney: number;
};
export type CareerLegacy = {
  version: 1; matchesPlayed: number; wins: number; losses: number; draws: number;
  framesWon: number; framesLost: number; frameMatches: number; centuries: number;
  highestBreak: number; fifties: number; detailedMatches: number; maximums: number; maximumMatches: number;
  performanceFrames: number; performanceMatches: number; potTotal: number; longPotTotal: number; safetyTotal: number;
  fouls: number; prizeMoney: number; deciders: number; decidersWon: number; whitewashes: number;
  currentWinStreak: number; bestWinStreak: number; trophies: CareerTrophy[];
  recoveredHistory: boolean; lastMatchId?: string;
};
const empty = (): CareerLegacy => ({ version: 1, matchesPlayed: 0, wins: 0, losses: 0, draws: 0,
  framesWon: 0, framesLost: 0, frameMatches: 0, centuries: 0, highestBreak: 0, fifties: 0, detailedMatches: 0,
  maximums: 0, maximumMatches: 0, performanceFrames: 0, performanceMatches: 0, potTotal: 0,
  longPotTotal: 0, safetyTotal: 0, fouls: 0, prizeMoney: 0, deciders: 0, decidersWon: 0,
  whitewashes: 0, currentWinStreak: 0, bestWinStreak: 0, trophies: [], recoveredHistory: false });
const completed = (m: { result: string }) => ['Won', 'Lost', 'Drawn'].includes(m.result);
const sum = <T,>(rows: T[], value: (row: T) => number) => rows.reduce((n, row) => n + (value(row) || 0), 0);

function addFrames(s: CareerLegacy, m: Pick<Match, 'playerFrames' | 'opponentFrames' | 'bestOf' | 'result'>) {
  s.framesWon += m.playerFrames; s.framesLost += m.opponentFrames; s.frameMatches++;
  const decider = m.bestOf > 1 && m.bestOf % 2 === 1 && m.playerFrames + m.opponentFrames === m.bestOf;
  s.deciders += Number(decider); s.decidersWon += Number(decider && m.result === 'Won');
  s.whitewashes += Number(m.result === 'Won' && m.opponentFrames === 0 && m.bestOf > 1);
  s.currentWinStreak = m.result === 'Won' ? s.currentWinStreak + 1 : 0;
  s.bestWinStreak = Math.max(s.bestWinStreak, s.currentWinStreak);
}
function addDetail(s: CareerLegacy, m: Match) {
  s.detailedMatches++; s.fifties += m.fifties; s.fouls += m.fouls;
  s.highestBreak = Math.max(s.highestBreak, m.highestBreak);
  if (m.maximumBreaks !== undefined) { s.maximums += m.maximumBreaks; s.maximumMatches++; }
  const frames = m.playerFrames + m.opponentFrames;
  if (frames > 0 && [m.potSuccess, m.longPotSuccess, m.safetySuccess].every(Number.isFinite)) {
    s.performanceFrames += frames; s.performanceMatches++;
    s.potTotal += m.potSuccess * frames; s.longPotTotal += m.longPotSuccess * frames; s.safetyTotal += m.safetySuccess * frames;
  }
}
export function recordLegacyMatch(previous: CareerLegacy, match: Match, trophy?: CareerTrophy): CareerLegacy {
  if (!completed(match) || previous.lastMatchId === match.id) return previous;
  const next = { ...previous, trophies: [...previous.trophies], lastMatchId: match.id };
  next.matchesPlayed++; next.wins += Number(match.result === 'Won'); next.losses += Number(match.result === 'Lost');
  next.draws += Number(match.result === 'Drawn'); next.centuries += match.centuries; next.prizeMoney += match.prizeMoneyEarned;
  addFrames(next, match); addDetail(next, match);
  if (trophy && !next.trophies.some(t => t.id === trophy.id)) next.trophies.unshift(trophy);
  return next;
}

/** Import only surviving evidence. Event and season totals overlap match records, so never add both. */
export function careerLegacyOf(state: GameState): CareerLegacy {
  if (state.history.legacy?.version === 1) return state.history.legacy;
  const s = empty();
  const logs = [...new Map(state.history.matchLog.filter(completed).map(m => [m.id, m])).values()];
  const details = [...new Map(state.matches.filter(completed).map(m => [m.id, m])).values()];
  const events = [...new Map(state.history.tournamentHistory.map(e => [e.id, e])).values()];
  const records = state.history.seasonRecords;
  const seasons = new Set([...logs.map(m => m.season), ...details.map(m => m.season ?? state.season), ...events.map(e => e.season), ...records.map(r => r.season)]);
  for (const season of seasons) {
    const log = logs.filter(m => m.season === season);
    const detail = details.filter(m => (m.season ?? state.season) === season);
    const all = [...log, ...detail.filter(m => !log.some(l => l.id === m.id))];
    const archive = events.filter(e => e.season === season);
    const record = records.find(r => r.season === season);
    s.matchesPlayed += Math.max(all.length, sum(archive, e => e.matchesPlayed), record?.matchesPlayed ?? 0);
    s.wins += Math.max(all.filter(m => m.result === 'Won').length, sum(archive, e => e.wins), record?.wins ?? 0);
    s.losses += Math.max(all.filter(m => m.result === 'Lost').length, sum(archive, e => e.losses), record?.losses ?? 0);
    // Reconcile each event before comparing with its season summary.
    const eventIds = new Set([...archive.map(e => e.tournamentId), ...detail.map(m => m.tournamentId)]);
    s.centuries += Math.max(record?.centuries ?? 0, sum([...eventIds], id => Math.max(sum(archive.filter(e => e.tournamentId === id), e => e.centuries), sum(detail.filter(m => m.tournamentId === id), m => m.centuries))));
    s.highestBreak = Math.max(s.highestBreak, record?.highestBreak ?? 0, ...archive.map(e => e.highestBreak));
    s.prizeMoney += Math.max(record?.prizeMoney ?? 0, sum(archive, e => e.prizeMoney), sum(log, m => m.prizeMoney) + sum(detail.filter(m => !log.some(l => l.id === m.id)), m => m.prizeMoneyEarned));
  }
  s.draws = Math.max(0, s.matchesPlayed - s.wins - s.losses);
  const allFrames = [...logs.map(m => ({ ...m, playedOn: m.date })), ...details.filter(m => !logs.some(l => l.id === m.id))]
    .sort((a, b) => (a.playedOn ?? '').localeCompare(b.playedOn ?? '') || 0);
  // Archives are newest first; reverse equal-day matches to retain their playing order.
  allFrames.sort((a, b) => (a.playedOn ?? '').localeCompare(b.playedOn ?? '') || logs.findIndex(m => m.id === b.id) - logs.findIndex(m => m.id === a.id));
  for (const m of allFrames) addFrames(s, m);
  for (const m of details) addDetail(s, m);
  s.trophies = events.filter(e => e.status === 'Completed' && e.result === 'Winner' && e.eventType !== 'Q School' && e.eventType !== 'Exhibition' && !/qualif(?:ier|ication|ying)|play[ -]?off/i.test(e.tournamentName) && e.canonicalResult?.isTitle !== false)
    .map(e => {
      const final = e.roundResults?.at(-1);
      const match = logs.find(m => m.season === e.season && m.tournamentId === e.tournamentId && m.round === 'Final');
      return { id: e.season + ':' + e.tournamentId, tournamentId: e.tournamentId, name: e.tournamentName, season: e.season, date: match?.date ?? e.endDate ?? e.startDate,
        category: e.eventType ?? 'Career Event', circuit: e.tourCircuit, rankingType: state.tournaments.find(t => t.id === e.tournamentId)?.rankingType, opponent: final?.opponentName ?? match?.opponentName ?? '',
        score: final ? final.playerFrames + '–' + final.opponentFrames : match?.score ?? '', prizeMoney: e.prizeMoney };
    }).sort((a, b) => b.date.localeCompare(a.date));
  s.recoveredHistory = s.matchesPlayed > 0;
  s.lastMatchId = logs[0]?.id ?? details[0]?.id;
  return s;
}

export function legacyRate(total: number, weight: number): string {
  return weight > 0 ? (total / weight).toFixed(1) + '%' : '—';
}

/** Achievement score: money, reputation, weeks and the old saved score are deliberately not inputs. */
export function careerLegacyRating(career: CareerLegacy, professional = false) {
  const trophies = [...new Map(career.trophies.map(t => [t.id, t])).values()];
  const isWorld = (t: CareerTrophy) => !/youth|junior|senior|amateur/i.test(t.category + ' ' + t.circuit) && /^world (?:snooker )?championship$/i.test(t.name.trim());
  const isMainTour = (t: CareerTrophy) => !/youth|junior|under.?\d|senior|amateur|q tour|q school/i.test(t.category + ' ' + t.circuit + ' ' + t.name)
    && (isWorld(t) || /world snooker tour/i.test(t.circuit) || ['Major', 'Ranking', 'Professional Tour', 'Invitational'].includes(t.category));
  const worldTitles = trophies.filter(isWorld).length;
  const mainTitles = trophies.filter(t => isMainTour(t) && !isWorld(t)).length;
  const otherTitles = trophies.filter(t => !isWorld(t) && !isMainTour(t)).length;
  const rankingTitles = trophies.filter(t => isMainTour(t) && (isWorld(t) || t.rankingType === 'World Ranking' || t.category === 'Ranking')).length;
  const breakdown = [
    { label: 'Tournament titles', value: Math.min(75, worldTitles * 15 + mainTitles * 5 + Math.min(10, otherTitles)), max: 75, detail: '15 per World Championship; 5 per other main-tour title; 1 per other title (up to 10).' },
    { label: 'Career wins', value: Math.min(10, Math.floor(career.wins / 10)), max: 10, detail: '1 point per 10 match wins.' },
    { label: 'Century breaks', value: Math.min(10, Math.floor(career.centuries / 25)), max: 10, detail: '1 point per 25 centuries.' },
    { label: '147 maximums', value: Math.min(5, career.maximums), max: 5, detail: '1 point per recorded 147.' },
  ];
  const score = breakdown.reduce((n, item) => n + item.value, 0);
  const tier = worldTitles > 0 ? 'World Champion' : rankingTitles > 0 ? 'Ranking Winner'
    : mainTitles > 0 ? 'Main Tour Winner' : otherTitles > 0 ? 'Tournament Winner'
    : professional ? 'Tour Professional' : 'Building a Career';
  return { score, tier, breakdown, worldTitles, rankingTitles };
}
