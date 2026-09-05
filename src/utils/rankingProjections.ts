import { getPlayableRounds, resolveTournamentFormat } from "../data/tournamentFormats";
import type { Tournament } from "../types/game";
import { countsForWorldRanking, isMajorQualifying } from '../game/rollingRankings';

export type RankingTableKey =
  | "world"
  | "oneYear"
  | "amateur"
  | "qTour"
  | "qSchool"
  | "senior"
  | "youth";

type RankingProjectionRow = {
  playerName: string;
  ranking: number;
  points: number;
};

type TournamentRankingHistory = {
  tournamentId: string;
  tournamentName: string;
  status: string;
  result: string;
  rankingPoints: number;
  prizeMoney: number;
};

export function tournamentAffectsRankingTable(
  tournament: Tournament | undefined,
  tableKey: RankingTableKey,
) {
  if (!tournament || tournament.rankingType === "None") return false;
  if (tournament.rankingType === "World Ranking") {
    return tableKey === "world" || tableKey === "oneYear";
  }
  if (tournament.rankingType === "One-Year") return tableKey === "oneYear" || tableKey === "world";
  if (tournament.rankingType === "Youth") return tableKey === "youth";
  if (tournament.rankingType === "Amateur") return tableKey === "amateur";
  if (tournament.rankingType === "Q Tour") return tableKey === "qTour";
  if (tournament.rankingType === "Q School OOM") return tableKey === "qSchool";
  return tournament.rankingType === "Senior" && tableKey === "senior";
}
export function buildTournamentRankingSources(
  history: TournamentRankingHistory[],
  tournaments: Tournament[],
  tableKey: RankingTableKey,
  limit = 4,
) {
  const tournamentsById = new Map(tournaments.map((event) => [event.id, event]));
  return history
    .filter((entry) => entry.status === "Completed")
    .filter((entry) =>
      tournamentAffectsRankingTable(tournamentsById.get(entry.tournamentId), tableKey),
    )
    .slice(0, limit)
    .map((entry) => ({
      label: `${entry.tournamentName} · ${entry.result}`,
      points: entry.rankingPoints,
      prizeMoney: entry.prizeMoney,
    }));
}

function getPlacementShare(round: string, champion: boolean, rounds: string[]) {
  if (champion) return 1;
  const normalized = round.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (/^final$/.test(normalized)) return 0.2;
  if (/semi final/.test(normalized)) return 0.12;
  if (/quarter final/.test(normalized)) return 0.07;
  if (/last 16/.test(normalized)) return 0.035;
  if (/last 32/.test(normalized)) return 0.018;
  const roundIndex = Math.max(0, rounds.indexOf(round));
  return Math.max(0.005, 0.12 / 2 ** Math.max(1, rounds.length - roundIndex - 1));
}

export function getProjectedTournamentRankingPoints(
  tournament: Tournament | undefined,
  round: string,
  champion = false,
) {
  if (
    !tournament ||
    tournament.rankingType === "None" ||
    tournament.rankingValue <= 0
  ) {
    return 0;
  }
  const rounds = getPlayableRounds(resolveTournamentFormat(tournament));
  if (countsForWorldRanking(tournament)) {
    if (champion && isMajorQualifying(tournament)) return 0;
    if (champion) return tournament.winnerPrize ?? Math.round(tournament.prizeMoney * 0.5);
    if (/^final$/i.test(round)) return tournament.runnerUpPrize ?? Math.round(tournament.prizeMoney * 0.22);
    if (/semi.?final/i.test(round)) return tournament.semiFinalPrize ?? Math.round(tournament.prizeMoney * 0.08);
    if (/quarter.?final/i.test(round)) return tournament.quarterFinalPrize ?? Math.round(tournament.prizeMoney * 0.03);
    return tournament.firstRoundPrize ?? Math.round(tournament.prizeMoney * getPlacementShare(round, false, rounds));
  }
  return Math.max(
    0,
    Math.round(
      tournament.rankingValue * getPlacementShare(round, champion, rounds),
    ),
  );
}

export function projectRankingAfterEvent(
  rows: RankingProjectionRow[],
  playerName: string,
  tournament: Tournament | undefined,
  playerPointsGained: number,
) {
  const fieldSize = tournament
    ? Math.min(resolveTournamentFormat(tournament).fieldSize ?? rows.length, rows.length)
    : 0;
  const eventValue = tournament && countsForWorldRanking(tournament) ? tournament.winnerPrize ?? tournament.prizeMoney * 0.5 : tournament?.rankingValue ?? 0;
  const rankingEvent =
    tournament && tournament.rankingType !== "None" && eventValue > 0;
  const projected = rows.map((row) => {
    if (row.playerName === playerName) {
      return { ...row, projectedPoints: row.points + playerPointsGained };
    }
    const isExpectedEntrant = rankingEvent && row.ranking <= fieldSize;
    const seedStrength = isExpectedEntrant
      ? Math.max(0, (fieldSize - row.ranking + 1) / Math.max(1, fieldSize))
      : 0;
    const expectedPoints = isExpectedEntrant
      ? Math.round(eventValue * (0.008 + seedStrength ** 2 * 0.07))
      : 0;
    return { ...row, projectedPoints: row.points + expectedPoints };
  });

  projected.sort((left, right) => {
    if (right.projectedPoints !== left.projectedPoints) {
      return right.projectedPoints - left.projectedPoints;
    }
    return left.ranking - right.ranking;
  });
  return Math.max(
    1,
    projected.findIndex((row) => row.playerName === playerName) + 1,
  );
}
