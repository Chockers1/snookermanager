import { describe, expect, it } from "vitest";
import type { Tournament } from "../types/game";
import {
  buildTournamentRankingSources,
  getProjectedTournamentRankingPoints,
  projectRankingAfterEvent,
} from "./rankingProjections";

function createTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: "ranking-event",
    name: "Ranking Event",
    type: "Ranking",
    formatId: "standardRanking128",
    location: "Test Venue",
    startDate: "2026-09-01",
    entryFee: 0,
    travelCost: 0,
    hotelCost: 0,
    prizeMoney: 500_000,
    rankingType: "World Ranking",
    rankingValue: 1000,
    format: "Best of 7",
    status: "Available",
    fatigueRisk: "Medium",
    ...overrides,
  };
}

describe("live ranking projections", () => {
  it("shows one completed tournament contribution rather than its individual matches", () => {
    const tournament = createTournament();
    const sources = buildTournamentRankingSources(
      [
        {
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          status: "Completed",
          result: "Quarter Final",
          rankingPoints: 70,
          prizeMoney: 15_000,
        },
        {
          tournamentId: "unfinished",
          tournamentName: "Unfinished Event",
          status: "In Progress",
          result: "Last 16",
          rankingPoints: 20,
          prizeMoney: 2_000,
        },
      ],
      [tournament, createTournament({ id: "unfinished" })],
      "world",
    );

    expect(sources).toEqual([
      {
        label: "Ranking Event · Quarter Final",
        points: 70,
        prizeMoney: 15_000,
      },
    ]);
  });

  it("returns no points for a non-ranking invitational", () => {
    const invitational = createTournament({
      rankingType: "None",
      rankingValue: 0,
    });
    expect(getProjectedTournamentRankingPoints(invitational, "Final", true)).toBe(0);
  });

  it("recalculates projected position against expected competitor results", () => {
    const tournament = createTournament({ rankingValue: 400, winnerPrize: 400 });
    const rows = [
      { playerName: "Leader", ranking: 1, points: 1_050 },
      { playerName: "Target", ranking: 2, points: 1_000 },
      { playerName: "Player", ranking: 3, points: 900 },
      { playerName: "Chaser", ranking: 4, points: 880 },
    ];

    expect(projectRankingAfterEvent(rows, "Player", tournament, 0)).toBe(3);
    expect(projectRankingAfterEvent(rows, "Player", tournament, 400)).toBe(1);
  });
});
