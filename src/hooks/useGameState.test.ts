import { afterEach, describe, expect, it, vi } from "vitest";
import {
  chalkCatalog,
  createPlayerBackgroundCatalog,
  createPlayerIdentitySeed,
  createPlayerSliderCatalog,
  cueMarketplaceCatalog,
  tableSetupCatalog,
  tipCatalog,
} from "../data/gameContent";
import {
  acceptSponsorState,
  advanceLiveVisit,
  applyEquipmentMatchWear,
  applyTrainingPlanState,
  createNewCareerState,
  createStarterState,
  advanceWeekState,
  bookTravelState,
  buyChalkState,
  buyCueState,
  buyTipState,
  calculateSponsorMatchBonus,
  continueToNextTournamentState,
  confirmTournamentPreparationState,
  enterTournamentState,
  getNextEligibleTournament,
  getEquipmentPerformanceProfile,
  getFacilityTrainingMultiplier,
  getLiveTempoEffects,
  getSponsorObligationProfile,
  getTrainingAdaptationMultiplier,
  getTournamentEntryAccess,
  getTournamentPlayability,
  hireCoachState,
  recordFinanceExpenseState,
  renegotiateSponsorState,
  repairGameState,
  renewSponsorState,
  SAVE_SCHEMA_VERSION,
  scheduleTreatmentState,
  simulateSyntheticLiveVisitMatch,
  skipTournamentState,
  startLiveMatchState,
  startNextSeasonState,
  simulateTournamentMatchState,
  updateBudgetTargetsState,
  withdrawTournamentState,
} from "./useGameState";
import { getDefaultPreparationAllocations } from "../game/tournamentPreparation";
import {
  buildTrainingCell,
  calculateTrainingEffects,
  summarizeTrainingPlan,
} from "../utils/trainingPlan";
import {
  buildHealthCentreData,
  buildMentalStateData,
  buildTournamentDrawData,
} from "../utils/liveRouteData";

afterEach(() => {
  vi.restoreAllMocks();
});

function bookAndPrepareTournament(
  state: ReturnType<typeof createStarterState>,
  tournamentId: string,
) {
  return confirmTournamentPreparationState(
    bookTravelState(state, tournamentId),
    tournamentId,
    "balanced",
    getDefaultPreparationAllocations(),
    [],
  );
}

describe("mental and health support data", () => {
  it("uses the stored burnout state instead of treating confidence as burnout", () => {
    const state = createStarterState();
    state.player.fatigue = 20;
    state.player.confidence = 90;
    state.trainingCondition.burnout = 10;

    const burnout = buildMentalStateData(state).metrics.find(
      (metric) => metric.label === "Burnout Risk",
    );

    expect(burnout?.value).toBe(13);
    expect(burnout?.detail).toBe("Low");
  });

  it("shows the stored injury details and calculates a future return date", () => {
    const state = createStarterState();
    state.currentDate = "2026-05-11";
    state.health.activeIssue = {
      id: "test-shoulder",
      issue: "Shoulder strain",
      bodyArea: "Shoulder",
      severity: "Moderate",
      cause: "Heavy practice load",
      startedDate: "2026-05-04",
      weeksRemaining: 2,
      recoveryProgress: 40,
    };

    const issue = buildHealthCentreData(state).currentIssue;

    expect(issue.bodyArea).toBe("Shoulder");
    expect(issue.severity).toBe("Moderate");
    expect(issue.estimatedReturn).toBe("2026-05-25");
  });
});

function createProfessionalStart(
  startingLevelId:
    | "start-rookie-pro"
    | "start-bottom-tour"
    | "start-top-64"
    | "start-top-32"
    | "start-top-16"
    | "start-masters",
) {
  return createNewCareerState({
    fullName: createPlayerIdentitySeed.name,
    nationality: createPlayerIdentitySeed.nationality,
    age: 18,
    handedness: createPlayerIdentitySeed.handedness as
      "Right-handed" | "Left-handed",
    cueStyle: createPlayerIdentitySeed.cueStyle,
    playingStyle: createPlayerIdentitySeed.playingStyle,
    personalityArchetype: createPlayerIdentitySeed.personalityArchetype,
    sliders: createPlayerSliderCatalog.map((slider) => ({ ...slider })),
    backgroundId:
      createPlayerBackgroundCatalog[1]?.id ??
      createPlayerBackgroundCatalog[0].id,
    startingLevelId,
  });
}

describe("new career records", () => {
  it("starts every professional route without invented results, money, or titles", () => {
    const career = createProfessionalStart("start-top-16");
    const worldRow = career.competitionTables.world.find(
      (row) => row.playerName === career.player.fullName,
    );
    const oneYearRow = career.competitionTables.oneYear.find(
      (row) => row.playerName === career.player.fullName,
    );

    expect(worldRow?.points).toBeGreaterThan(0);
    expect(worldRow).toMatchObject({
      prizeMoney: 0,
      eventsPlayed: 0,
      wins: 0,
      losses: 0,
      titles: 0,
    });
    expect(oneYearRow).toMatchObject({
      points: 0,
      prizeMoney: 0,
      eventsPlayed: 0,
      wins: 0,
      losses: 0,
      titles: 0,
    });
    expect(career.matches).toHaveLength(0);
    expect(career.history.matchLog).toHaveLength(0);
    expect(career.history.tournamentHistory).toHaveLength(0);
  });

  it("removes seeded and qualifying titles when upgrading an existing save", () => {
    const career = createProfessionalStart("start-top-16");
    const qualifier = career.tournaments.find((event) =>
      /qualifying/i.test(event.name),
    );
    expect(qualifier).toBeDefined();
    if (!qualifier) return;

    career.schemaVersion = 6;
    career.competitionTables.world = career.competitionTables.world.map((row) =>
      row.playerName === career.player.fullName ? { ...row, titles: 2 } : row,
    );
    career.competitionTables.oneYear = career.competitionTables.oneYear.map(
      (row) =>
        row.playerName === career.player.fullName ? { ...row, titles: 2 } : row,
    );
    career.history.tournamentHistory = [
      {
        id: `${career.season}-${qualifier.id}`,
        season: career.season,
        tournamentId: qualifier.id,
        formatId: qualifier.formatId,
        tournamentName: qualifier.name,
        eventType: qualifier.eventClass ?? qualifier.type,
        stageId: qualifier.stageId ?? null,
        tourCircuit: qualifier.tourCircuit ?? "World Snooker Tour",
        location: qualifier.location,
        startDate: qualifier.startDate,
        endDate: qualifier.endDate,
        status: "Completed",
        result: "Winner",
        rounds: [],
        matchesPlayed: 1,
        wins: 1,
        losses: 0,
        prizeMoney: 0,
        rankingPoints: 0,
        highestBreak: 50,
        centuries: 0,
        fatigueChange: 5,
        entryFee: qualifier.entryFee,
        bookedTravelCost: 0,
      },
    ];

    const repaired = repairGameState(career);
    expect(
      repaired.competitionTables.world.find(
        (row) => row.playerName === career.player.fullName,
      )?.titles,
    ).toBe(0);
    expect(
      repaired.competitionTables.oneYear.find(
        (row) => row.playerName === career.player.fullName,
      )?.titles,
    ).toBe(0);
  });
});

describe("tournament entry and match-start rules", () => {
  it("builds configured real-world fields and seeded entry rounds", () => {
    const state = createStarterState();
    state.player.worldRanking = 12;
    state.careerSystems.pro = {
      ...state.careerSystems.pro,
      hasTourCard: true,
      worldRank: 12,
      oneYearRank: 12,
      currentTier: "Top 16 Elite Player",
    };
    const playerWorldRow = state.competitionTables.world.find(
      (row) => row.playerName === state.player.fullName,
    );
    state.competitionTables.world = state.competitionTables.world
      .filter((row) => row.playerName !== state.player.fullName)
      .toSpliced(11, 0, { ...playerWorldRow!, ranking: 12 })
      .map((row, index) => ({ ...row, ranking: index + 1 }));
    const playerOneYearRow = state.competitionTables.oneYear.find(
      (row) => row.playerName === state.player.fullName,
    );
    state.competitionTables.oneYear = state.competitionTables.oneYear
      .filter((row) => row.playerName !== state.player.fullName)
      .toSpliced(11, 0, { ...playerOneYearRow!, ranking: 12 })
      .map((row, index) => ({ ...row, ranking: index + 1 }));
    state.tournaments = state.tournaments.map((event) => ({
      ...event,
      status: "Available",
    }));

    const shanghai = state.tournaments.find(
      (event) => event.name === "Shanghai Masters",
    );
    const saudi = state.tournaments.find(
      (event) => event.name === "Saudi Arabia Masters",
    );
    expect(shanghai).toBeDefined();
    expect(saudi).toBeDefined();
    if (!shanghai || !saudi) return;

    const shanghaiEntry = enterTournamentState(state, shanghai.id);
    const shanghaiEntrants = new Set(
      shanghaiEntry.tournamentProgress.draw
        .flatMap((round) =>
          round.matches.flatMap((match) => [match.top.name, match.bottom.name]),
        )
        .filter((name) => name !== "TBD"),
    );
    expect(
      shanghaiEntry.tournamentProgress.draw.map((round) => round.label),
    ).toEqual(["Round 1", "Last 16", "Quarter Final", "Semi Final", "Final"]);
    expect(
      shanghaiEntry.tournamentProgress.draw.map(
        (round) => round.matches.length,
      ),
    ).toEqual([8, 8, 4, 2, 1]);
    expect(shanghaiEntrants.size).toBe(24);
    expect(shanghaiEntry.tournamentProgress.currentRound).toBe("Round 1");

    const saudiEntry = enterTournamentState(state, saudi.id);
    const saudiEntrants = new Set(
      saudiEntry.tournamentProgress.draw
        .flatMap((round) =>
          round.matches.flatMap((match) => [match.top.name, match.bottom.name]),
        )
        .filter((name) => name !== "TBD"),
    );
    expect(
      saudiEntry.tournamentProgress.draw.map((round) => round.label),
    ).toEqual([
      "Round 1",
      "Round 2",
      "Round 3",
      "Round 4",
      "Last 32",
      "Last 16",
      "Quarter Final",
      "Semi Final",
      "Final",
    ]);
    expect(
      saudiEntry.tournamentProgress.draw.map((round) => round.matches.length),
    ).toEqual([32, 32, 32, 16, 16, 8, 4, 2, 1]);
    expect(saudiEntrants.size).toBe(144);
    expect(saudiEntry.tournamentProgress.currentRound).toBe("Last 32");

    const tourChampionship = state.tournaments.find(
      (event) => event.formatId === "tourChampionshipTop8",
    );
    expect(tourChampionship).toBeDefined();
    if (!tourChampionship) return;
    expect(
      getTournamentEntryAccess(state, tourChampionship).allowed,
      getTournamentEntryAccess(state, tourChampionship).reason ?? undefined,
    ).toBe(true);
    const tourEntry = enterTournamentState(state, tourChampionship.id);
    const tourEntrants = new Set(
      tourEntry.tournamentProgress.draw
        .flatMap((round) =>
          round.matches.flatMap((match) => [match.top.name, match.bottom.name]),
        )
        .filter((name) => name !== "TBD"),
    );
    expect(
      tourEntry.tournamentProgress.draw.map((round) => round.matches.length),
    ).toEqual([4, 4, 2, 1]);
    expect(tourEntrants.size).toBe(12);
    expect(tourEntry.tournamentProgress.currentRound).toBe("Round One");
  });

  it("does not select an ineligible entered junior event for the starter professional", () => {
    const state = createStarterState();
    const junior = state.tournaments.find(
      (tournament) => tournament.type === "Junior",
    );
    expect(junior).toBeDefined();
    if (!junior) return;

    junior.status = "Entered";
    expect(getTournamentEntryAccess(state, junior).allowed).toBe(false);

    const nextTournament = getNextEligibleTournament(state);
    expect(nextTournament).toBeDefined();
    expect(nextTournament?.id).not.toBe(junior.id);
    expect(
      nextTournament && getTournamentEntryAccess(state, nextTournament).allowed,
    ).toBe(true);
  });

  it("requires entry, tournament week, and booked travel before a match can start", () => {
    const state = createStarterState();
    const tournament = getNextEligibleTournament(state);
    expect(tournament).toBeDefined();
    if (!tournament) return;

    expect(getTournamentPlayability(state, tournament).reason).toMatch(/Enter/);
    tournament.status = "Entered";
    expect(getTournamentPlayability(state, tournament).reason).toMatch(
      /starts in .* days/,
    );

    state.currentDate = tournament.startDate;
    expect(getTournamentPlayability(state, tournament).reason).toMatch(
      /travel/i,
    );

    state.travel.bookings[tournament.id] = {
      tournamentId: tournament.id,
      travelOptionId: "test-travel",
      hotelOptionId: "test-hotel",
      totalCost: 0,
      bookedWeek: state.week,
      bookedDate: state.currentDate,
    };
    expect(getTournamentPlayability(state, tournament).reason).toMatch(
      /preparation/i,
    );
    const prepared = confirmTournamentPreparationState(
      state,
      tournament.id,
      "balanced",
      getDefaultPreparationAllocations(),
      [],
    );
    expect(getTournamentPlayability(prepared, tournament)).toMatchObject({
      canPlay: true,
      reason: null,
      travelBooked: true,
    });
  });

  it("applies tournament preparation once and stores temporary match bonuses", () => {
    const state = createStarterState();
    const tournament = getNextEligibleTournament(state);
    expect(tournament).toBeDefined();
    if (!tournament) return;

    const entered = enterTournamentState(state, tournament.id);
    const atEvent = continueToNextTournamentState(entered);
    const travelled = bookTravelState(atEvent, tournament.id);
    const cashBefore = travelled.player.cash;
    const confidenceBefore = travelled.player.confidence;
    const prepared = confirmTournamentPreparationState(
      travelled,
      tournament.id,
      "balanced",
      getDefaultPreparationAllocations(),
      ["physio", "psychologist"],
    );
    const plan = prepared.travel.bookings[tournament.id]?.preparation;

    expect(plan?.effects.cost).toBe(160);
    expect(plan?.effects.attributeBonuses["Break Building"]).toBeGreaterThan(0);
    expect(prepared.player.cash).toBe(cashBefore - 160);
    expect(plan?.effects.confidenceDelta).toBeGreaterThan(0);
    expect(prepared.player.confidence).toBeGreaterThanOrEqual(confidenceBefore);
    expect(
      getTournamentPlayability(
        prepared,
        prepared.tournaments.find((item) => item.id === tournament.id)!,
      ).canPlay,
    ).toBe(true);

    const reconfirmed = confirmTournamentPreparationState(
      prepared,
      tournament.id,
      "balanced",
      getDefaultPreparationAllocations(),
      ["physio", "psychologist"],
    );
    expect(reconfirmed.player.cash).toBe(prepared.player.cash);
    expect(reconfirmed.player.confidence).toBe(prepared.player.confidence);
    expect(reconfirmed.player.fatigue).toBe(prepared.player.fatigue);
    expect(reconfirmed.trainingCondition.strain).toBe(
      prepared.trainingCondition.strain,
    );
  });

  it("repairs legacy impossible entries and match records when a save is loaded", () => {
    const state = createStarterState();
    const junior = state.tournaments.find(
      (tournament) => tournament.type === "Junior",
    );
    expect(junior).toBeDefined();
    if (!junior) return;
    junior.status = "Entered";
    state.matches.push({
      id: "impossible-match",
      tournamentId: junior.id,
      round: "Round 1",
      bestOf: 7,
      playerName: state.player.fullName,
      opponentName: "Test Player",
      playerRanking: 20,
      opponentRanking: 120,
      playerFrames: 4,
      opponentFrames: 0,
      result: "Won",
      highestBreak: 72,
      opponentHighestBreak: 24,
      fifties: 1,
      centuries: 0,
      potSuccess: 89,
      longPotSuccess: 48,
      safetySuccess: 71,
      fouls: 2,
      confidenceChange: 2,
      fatigueChange: 4,
      prizeMoneyEarned: 0,
      rankingPointsGained: 0,
      playedOn: "2025-05-11",
    });

    const repaired = repairGameState(state);
    expect(repaired.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(
      repaired.tournaments.find((event) => event.id === junior.id)?.status,
    ).not.toBe("Entered");
    expect(
      repaired.matches.some((match) => match.id === "impossible-match"),
    ).toBe(false);
  });

  it("allows only one active event and supports an early withdrawal refund", () => {
    const state = createStarterState();
    const first = getNextEligibleTournament(state);
    expect(first).toBeDefined();
    if (!first) return;
    const entered = enterTournamentState(state, first.id);
    expect(
      entered.tournaments.find((event) => event.id === first.id)?.status,
    ).toBe("Entered");

    const second = entered.tournaments.find(
      (event) =>
        event.id !== first.id &&
        event.status === "Available" &&
        getTournamentEntryAccess(entered, event).allowed,
    );
    expect(second).toBeDefined();
    if (!second) return;
    const blocked = enterTournamentState(entered, second.id);
    expect(
      blocked.tournaments.find((event) => event.id === second.id)?.status,
    ).not.toBe("Entered");
    expect(blocked.lastAction).toMatch(/withdraw from or finish/i);

    const withdrawn = withdrawTournamentState(entered, first.id);
    expect(
      withdrawn.tournaments.find((event) => event.id === first.id)?.status,
    ).toBe("Available");
    expect(withdrawn.tournamentProgress.tournamentId).toBeNull();
    expect(withdrawn.player.cash).toBeGreaterThanOrEqual(entered.player.cash);
  });

  it("advances to an entered event without auto-playing or bypassing travel", () => {
    const state = createStarterState();
    const tournament = getNextEligibleTournament(state);
    expect(tournament).toBeDefined();
    if (!tournament) return;

    const entered = enterTournamentState(state, tournament.id);
    const advanced = continueToNextTournamentState(entered);

    expect(advanced.currentDate).toBe(tournament.startDate);
    expect(
      advanced.tournaments.find((event) => event.id === tournament.id)?.status,
    ).toBe("Entered");
    expect(advanced.matches).toHaveLength(entered.matches.length);
    expect(advanced.tournamentProgress.tournamentId).toBe(tournament.id);
    expect(
      getTournamentPlayability(
        advanced,
        advanced.tournaments.find((event) => event.id === tournament.id)!,
      ),
    ).toMatchObject({
      canPlay: false,
      travelBooked: false,
    });
    expect(advanced.lastAction).toMatch(/book travel/i);
  });

  it("skips an unentered event and invites the player to the next eligible event", () => {
    const state = createStarterState();
    const tournament = getNextEligibleTournament(state);
    expect(tournament).toBeDefined();
    if (!tournament) return;

    const skipped = skipTournamentState(state, tournament.id);
    const nextTournament = getNextEligibleTournament(skipped);

    expect(
      skipped.tournaments.find((event) => event.id === tournament.id)?.status,
    ).toBe("Skipped");
    expect(nextTournament?.id).not.toBe(tournament.id);
    expect(skipped.inbox[0]?.subject).toBe(
      nextTournament ? `Invitation: ${nextTournament.name}` : undefined,
    );
    if (nextTournament) {
      expect(skipped.inbox[0]?.preview).toMatch(/prize fund is £[\d,]+/i);
      expect(skipped.inbox[0]?.preview).toMatch(/for the champion/i);
      expect(skipped.inbox[0]?.summary).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Total prize fund" }),
          expect.objectContaining({ label: "Winner's prize" }),
          expect.objectContaining({ label: "Ranking value" }),
          expect.objectContaining({ label: "Entry fee" }),
          expect.objectContaining({ label: "Estimated travel" }),
        ]),
      );
      const repaired = repairGameState({
        ...skipped,
        inbox: [
          {
            ...skipped.inbox[0],
            preview: `${nextTournament.name} is your next eligible event.`,
            summary: undefined,
          },
        ],
      });
      expect(repaired.inbox[0]?.preview).toMatch(/prize fund is £[\d,]+/i);
      expect(repaired.inbox[0]?.summary).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Winner's prize" }),
        ]),
      );
    }
    expect(skipped.lastAction).toMatch(/Skipped/);
  });
});

describe("inbox action repair", () => {
  it("links legacy messages from each game system to a working destination", () => {
    const state = createStarterState();
    state.inbox = [
      {
        id: "travel",
        sender: "Travel Desk",
        subject: "Travel pack ready",
        preview: "Logistics confirmed.",
        priority: "High",
        date: "Today",
      },
      {
        id: "staff",
        sender: "Staff Office",
        subject: "Coach hired",
        preview: "A coach joined.",
        priority: "Medium",
        date: "Today",
      },
      {
        id: "equipment",
        sender: "Equipment Shop",
        subject: "New cue purchased",
        preview: "The cue is equipped.",
        priority: "Low",
        date: "Today",
      },
      {
        id: "training",
        sender: "Head Coach",
        subject: "Training week completed",
        preview: "The block is complete.",
        priority: "Medium",
        date: "Today",
      },
      {
        id: "finance",
        sender: "Finance Office",
        subject: "Weekly money",
        preview: "Cash flow changed.",
        priority: "Medium",
        date: "Today",
      },
      {
        id: "sponsor",
        sender: "Commercial Team",
        subject: "Sponsor renewal",
        preview: "Review the offer.",
        priority: "High",
        date: "Today",
      },
      {
        id: "health",
        sender: "Medical Team",
        subject: "Treatment scheduled",
        preview: "Recovery started.",
        priority: "High",
        date: "Today",
      },
    ];

    const repaired = repairGameState(state);
    expect(repaired.inbox.map((message) => message.actionRoute)).toEqual([
      "/travel",
      "/staff/coaches",
      "/equipment/cues",
      "/training",
      "/finance",
      "/sponsorship",
      "/health",
    ]);
    expect(repaired.inbox.every((message) => message.read === false)).toBe(
      true,
    );
  });
});

describe("finance state", () => {
  it("stores budget targets in the save and records a cash expense", () => {
    const state = createStarterState();
    const budgeted = updateBudgetTargetsState(state, {
      Competition: 45,
      Coaching: 25,
    });
    expect(budgeted.finance.budgetTargets).toMatchObject({
      Competition: 45,
      Coaching: 25,
    });

    const expensed = recordFinanceExpenseState(
      budgeted,
      "Club membership",
      "Training",
      125,
    );
    expect(expensed.player.cash).toBe(budgeted.player.cash - 125);
    expect(expensed.finance.cash).toBe(budgeted.finance.cash - 125);
    expect(expensed.finance.ledger[0]).toMatchObject({
      description: "Club membership",
      category: "Training",
      amount: -125,
      type: "Expense",
    });
  });

  it("rejects invalid or unaffordable expenses", () => {
    const state = createStarterState();
    expect(
      recordFinanceExpenseState(state, "", "Other", 20).finance.ledger,
    ).toHaveLength(0);
    expect(
      recordFinanceExpenseState(
        state,
        "Impossible",
        "Other",
        state.player.cash + 1,
      ).finance.ledger,
    ).toHaveLength(0);
  });
});

describe("career lifecycle presets", () => {
  it("gives rookie-pro and bottom-tour starts meaningfully different survival pressure", () => {
    const rookie = createProfessionalStart("start-rookie-pro");
    const bottomTour = createProfessionalStart("start-bottom-tour");

    expect(rookie.careerSystems.pro.worldRank).toBeLessThan(
      bottomTour.careerSystems.pro.worldRank ?? 999,
    );
    expect(rookie.careerSystems.pro.yearsRemaining).toBe(2);
    expect(bottomTour.careerSystems.pro.yearsRemaining).toBe(1);
    expect(rookie.player.cash).toBeGreaterThan(bottomTour.player.cash);
    expect(rookie.finance.cashFlow).toBeGreaterThan(
      bottomTour.finance.cashFlow,
    );
  });

  it("migrates CPU lifecycle records to explicit non-retired state", () => {
    const state = createStarterState();
    const legacy = structuredClone(state) as typeof state;
    for (const record of legacy.worldPlayers) {
      delete (record as Partial<typeof record>).retired;
      delete (record as Partial<typeof record>).retiredSeason;
      delete (record as Partial<typeof record>).overallRating;
      delete (record as Partial<typeof record>).recentResults;
    }

    const repaired = repairGameState(legacy);
    expect(
      repaired.worldPlayers.every(
        (record) => record.retired === false && record.retiredSeason === null,
      ),
    ).toBe(true);
    expect(
      repaired.worldPlayers.every(
        (record) =>
          typeof record.overallRating === "number" &&
          Array.isArray(record.recentResults),
      ),
    ).toBe(true);
  });

  it("repairs a points-rich player row that was artificially held down", () => {
    const state = createProfessionalStart("start-bottom-tour");
    const playerName = state.player.fullName;
    const highestCpuPoints = Math.max(
      ...state.competitionTables.world
        .filter((row) => row.playerName !== playerName)
        .map((row) => row.points),
    );
    state.competitionTables.world = state.competitionTables.world
      .map((row) =>
        row.playerName === playerName
          ? { ...row, ranking: 65, points: highestCpuPoints + 100 }
          : row,
      )
      .sort((left, right) => left.ranking - right.ranking);

    const repaired = repairGameState(state);
    const playerRow = repaired.competitionTables.world.find(
      (row) => row.playerName === playerName,
    );

    expect(playerRow?.ranking).toBe(1);
    expect(playerRow?.movement).toBe(64);
    expect(repaired.lastAction).toMatch(/rebuilt every ranking table/i);
  });

  it("rebuilds recent player form from match history and removes temporary qualifiers", () => {
    const state = createProfessionalStart("start-rookie-pro");
    const equipped = buyTipState(
      buyChalkState(
        buyCueState(state, cueMarketplaceCatalog[0].id),
        chalkCatalog[0].id,
      ),
      tipCatalog[0].id,
    );
    const tournament = getNextEligibleTournament(equipped);
    expect(tournament).toBeDefined();
    if (!tournament) return;

    const entered = enterTournamentState(equipped, tournament.id);
    const atEvent = continueToNextTournamentState(entered);
    const travelled = bookAndPrepareTournament(atEvent, tournament.id);
    const afterMatch = simulateTournamentMatchState(travelled, tournament.id);
    const baseLog = afterMatch.history.matchLog[0];
    expect(baseLog).toBeDefined();
    if (!baseLog) return;

    const qualifierRow = {
      ...afterMatch.competitionTables.world.at(-1)!,
      id: "temporary-qualifier",
      playerName: "Qualifier 144",
      nation: tournament.location,
      ranking: afterMatch.competitionTables.world.length + 1,
    };
    const legacy = {
      ...afterMatch,
      schemaVersion: 7,
      player: { ...afterMatch.player, form: ["L" as const] },
      history: {
        ...afterMatch.history,
        matchLog: [
          { ...baseLog, id: "form-3", result: "Lost" as const },
          { ...baseLog, id: "form-2", result: "Won" as const },
          { ...baseLog, id: "form-1", result: "Won" as const },
        ],
      },
      competitionTables: {
        ...afterMatch.competitionTables,
        world: [...afterMatch.competitionTables.world, qualifierRow],
        oneYear: [...afterMatch.competitionTables.oneYear, qualifierRow],
      },
    };

    const repaired = repairGameState(legacy);

    expect(repaired.player.form).toEqual(["W", "W", "L"]);
    expect(
      repaired.competitionTables.world.some((row) =>
        /^Qualifier \d+$/.test(row.playerName),
      ),
    ).toBe(false);
    expect(
      repaired.competitionTables.oneYear.some((row) =>
        /^Qualifier \d+$/.test(row.playerName),
      ),
    ).toBe(false);
  });

  it("archives a season and explicitly retires an over-age CPU player", () => {
    const state = createStarterState();
    state.currentDate = "2027-06-29";
    const cpuPlayer = state.worldPlayers.find(
      (record) => record.playerName !== state.player.fullName,
    );
    expect(cpuPlayer).toBeDefined();
    if (!cpuPlayer) return;
    cpuPlayer.age = 79;

    const rolledOver = advanceWeekState(state);
    const retiredPlayer = rolledOver.worldPlayers.find(
      (record) => record.id === cpuPlayer.id,
    );

    expect(rolledOver.season).not.toBe(state.season);
    expect(rolledOver.history.seasonRecords).toHaveLength(1);
    expect(rolledOver.seasonReview).toMatchObject({
      pending: true,
      nextSeason: rolledOver.season,
    });
    expect(rolledOver.seasonReview?.majorWinners.length).toBeGreaterThan(0);
    expect(retiredPlayer).toMatchObject({
      retired: true,
      hasTourCard: false,
      tourSurvivalStatus: "Amateur",
    });
    expect(retiredPlayer?.retiredSeason).toBe(rolledOver.season);
    expect(retiredPlayer).toMatchObject({
      coachQuality: expect.any(Number),
      equipmentQuality: expect.any(Number),
      trainingLoad: expect.any(Number),
      fatigue: expect.any(Number),
      injuryWeeks: expect.any(Number),
      sponsorLevel: expect.any(Number),
    });

    const blockedAdvance = advanceWeekState(rolledOver);
    expect(blockedAdvance.currentDate).toBe(rolledOver.currentDate);
    expect(blockedAdvance.seasonReview?.pending).toBe(true);

    const started = startNextSeasonState(rolledOver);
    expect(started.seasonReview).toBeNull();
    expect(
      started.inbox.some((message) => /^Invitation:/.test(message.subject)),
    ).toBe(true);
  });
});

describe("complete tournament journey", () => {
  it("keeps a continuous scoring break as one real visit in the live feed", () => {
    const career = createProfessionalStart("start-rookie-pro");
    const equipped = buyTipState(
      buyChalkState(
        buyCueState(career, cueMarketplaceCatalog[0].id),
        chalkCatalog[0].id,
      ),
      tipCatalog[0].id,
    );
    const tournament = getNextEligibleTournament(equipped);
    expect(tournament).toBeDefined();
    if (!tournament) return;

    const entered = enterTournamentState(equipped, tournament.id);
    const atEvent = continueToNextTournamentState(entered);
    const travelled = bookAndPrepareTournament(atEvent, tournament.id);
    const started = startLiveMatchState(travelled, tournament.id);
    expect(started.liveMatch).not.toBeNull();
    if (!started.liveMatch) return;

    vi.spyOn(Math, "random").mockReturnValue(0);
    const opening = advanceLiveVisit(started.liveMatch, "Break Build", "manual");
    const openingFeedSize = opening.feed.length;
    const openingFeedId = opening.feed[0]?.id;
    const continued = advanceLiveVisit(opening, "Break Build", "manual");
    const actorStats =
      started.liveMatch.playerAtTable === started.liveMatch.playerName
        ? continued.playerStats
        : continued.opponentStats;

    expect(opening.currentBreak).toBeGreaterThan(0);
    expect(continued.currentBreak).toBeGreaterThan(opening.currentBreak);
    expect(continued.currentVisit).toBe(1);
    expect(actorStats.visits).toBe(1);
    expect(continued.feed).toHaveLength(openingFeedSize);
    expect(continued.feed[0]?.id).toBe(openingFeedId);
    expect(continued.feed[0]?.text).toMatch(/break reaches/i);
  });

  it("advances Auto Play one red or colour at a time", () => {
    const career = createProfessionalStart("start-rookie-pro");
    const equipped = buyTipState(
      buyChalkState(
        buyCueState(career, cueMarketplaceCatalog[0].id),
        chalkCatalog[0].id,
      ),
      tipCatalog[0].id,
    );
    const tournament = getNextEligibleTournament(equipped);
    expect(tournament).toBeDefined();
    if (!tournament) return;

    const entered = enterTournamentState(equipped, tournament.id);
    const atEvent = continueToNextTournamentState(entered);
    const travelled = bookAndPrepareTournament(atEvent, tournament.id);
    const started = startLiveMatchState(travelled, tournament.id);
    expect(started.liveMatch).not.toBeNull();
    if (!started.liveMatch) return;

    vi.spyOn(Math, "random").mockReturnValue(0);
    const red = advanceLiveVisit(
      started.liveMatch,
      "Break Build",
      "manual",
      "shot",
    );
    const colour = advanceLiveVisit(
      red,
      "Break Build",
      "manual",
      "shot",
    );

    expect(red.currentBreak).toBe(1);
    expect(red.tableState.redsRemaining).toBe(14);
    expect(red.tableState.ballOn).toBe("Colour");
    expect(red.feed[0]?.text).toMatch(/potted a red/i);
    expect(colour.currentBreak).toBeGreaterThan(red.currentBreak);
    expect(colour.currentBreak - red.currentBreak).toBeLessThanOrEqual(7);
    expect(colour.tableState.redsRemaining).toBe(14);
    expect(colour.tableState.ballOn).toBe("Red");
    expect(colour.feed).toHaveLength(red.feed.length + 1);
    expect(colour.feed[0]?.id).not.toBe(red.feed[0]?.id);
    expect(colour.feed[0]?.text).toMatch(/potted the/i);
  });

  it("creates a career, enters an event, books travel, plays, records a result, and advances the tournament state", () => {
    let randomState = 11731;
    vi.spyOn(Math, "random").mockImplementation(() => {
      randomState = (randomState * 16807) % 2147483647;
      return (randomState - 1) / 2147483646;
    });
    const career = createProfessionalStart("start-rookie-pro");
    const equipped = buyTipState(
      buyChalkState(
        buyCueState(career, cueMarketplaceCatalog[0].id),
        chalkCatalog[0].id,
      ),
      tipCatalog[0].id,
    );
    const tournament = getNextEligibleTournament(equipped);
    expect(tournament).toBeDefined();
    if (!tournament) return;

    const entered = enterTournamentState(equipped, tournament.id);
    const atEvent = continueToNextTournamentState(entered);
    const travelled = bookAndPrepareTournament(atEvent, tournament.id);
    expect(
      getTournamentPlayability(
        travelled,
        travelled.tournaments.find((event) => event.id === tournament.id)!,
      ),
    ).toMatchObject({ canPlay: true });

    const afterMatch = simulateTournamentMatchState(travelled, tournament.id);
    const result = afterMatch.matches[0];

    expect(result?.tournamentId).toBe(tournament.id);
    expect(result?.playedOn).toBe(tournament.startDate);
    expect(["Won", "Lost"]).toContain(result?.result);
    expect(result).toMatchObject({
      sponsorBonusEarned: expect.any(Number),
      equipmentWear: expect.any(Number),
      familiarityGained: expect.any(Number),
      strainImpact: expect.any(Number),
    });
    expect(afterMatch.history.matchLog[0]?.tournamentName).toBe(
      tournament.name,
    );
    expect(
      afterMatch.history.tournamentHistory.some(
        (entry) =>
          entry.tournamentId === tournament.id &&
          entry.canonicalResult?.matchesPlayed === 1,
      ),
    ).toBe(true);
    expect(
      afterMatch.tournamentProgress.tournamentId === tournament.id ||
        afterMatch.tournamentProgress.tournamentId === null,
    ).toBe(true);
  });

  it("preserves the eliminated event and resolves its completed draw", () => {
    const career = createProfessionalStart("start-rookie-pro");
    const equipped = buyTipState(
      buyChalkState(
        buyCueState(career, cueMarketplaceCatalog[0].id),
        chalkCatalog[0].id,
      ),
      tipCatalog[0].id,
    );
    const tournament = getNextEligibleTournament(equipped);
    expect(tournament).toBeDefined();
    if (!tournament) return;

    const entered = enterTournamentState(equipped, tournament.id);
    const atEvent = continueToNextTournamentState(entered);
    const travelled = bookAndPrepareTournament(atEvent, tournament.id);
    const cpuFormBefore = new Map(
      travelled.worldPlayers.map((record) => [
        record.playerName,
        (record.recentResults ?? []).join(""),
      ]),
    );
    let randomState = 90210;
    vi.spyOn(Math, "random").mockImplementation(() => {
      randomState = (randomState * 16807) % 2147483647;
      return (randomState - 1) / 2147483646;
    });
    const afterMatch = simulateTournamentMatchState(
      {
        ...travelled,
        player: { ...travelled.player, confidence: 25, fatigue: 100 },
      },
      tournament.id,
    );
    const result = afterMatch.matches[0];

    expect(result?.result).toBe("Lost");
    expect(
      afterMatch.tournaments.find((event) => event.id === tournament.id)
        ?.status,
    ).toBe("Completed");
    expect(afterMatch.tournamentProgress).toMatchObject({
      tournamentId: tournament.id,
      currentRound: null,
    });

    const historyEntry = afterMatch.history.tournamentHistory.find(
      (entry) => entry.tournamentId === tournament.id,
    );
    expect(historyEntry?.bracket?.length).toBeGreaterThan(1);
    expect(
      historyEntry?.bracket
        ?.flatMap((round) => round.matches)
        .filter((match) => !match.placeholder)
        .every(
          (match) =>
            typeof match.top.score === "number" &&
            typeof match.bottom.score === "number",
        ),
    ).toBe(true);

    const drawData = buildTournamentDrawData(afterMatch, tournament.id);
    expect(drawData).toMatchObject({
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      eventCompleted: true,
    });
    expect(drawData.progress.every((step) => step.status === "completed")).toBe(
      true,
    );

    const eventCountChanges = Object.entries(
      afterMatch.competitionTables,
    ).flatMap(([tableKey, rows]) =>
      rows.flatMap((row) => {
        const previousRow = travelled.competitionTables[
          tableKey as keyof typeof travelled.competitionTables
        ].find((entry) => entry.playerName === row.playerName);
        const delta = row.eventsPlayed - (previousRow?.eventsPlayed ?? 0);
        return delta > 0
          ? [{ tableKey, playerName: row.playerName, delta }]
          : [];
      }),
    );
    expect(
      new Set(eventCountChanges.map((change) => change.playerName)).size,
    ).toBeGreaterThan(2);
    expect(
      eventCountChanges
        .filter((change) => change.playerName === afterMatch.player.fullName)
        .every((change) => change.delta === 1),
    ).toBe(true);
    expect(eventCountChanges.every((change) => change.delta === 1)).toBe(true);
    expect(
      afterMatch.worldPlayers.some(
        (record) =>
          record.playerName !== afterMatch.player.fullName &&
          (record.recentResults ?? []).join("") !==
            cpuFormBefore.get(record.playerName),
      ),
    ).toBe(true);
    eventCountChanges.forEach((change) => {
      const tableKey =
        change.tableKey as keyof typeof travelled.competitionTables;
      const beforeRow = travelled.competitionTables[tableKey].find(
        (row) => row.playerName === change.playerName,
      );
      const afterRow = afterMatch.competitionTables[tableKey].find(
        (row) => row.playerName === change.playerName,
      );
      if (beforeRow && afterRow) {
        expect(afterRow.movement).toBe(beforeRow.ranking - afterRow.ranking);
      }
    });

    expect(
      afterMatch.inbox.find((message) =>
        message.subject.includes(`Post-event report: ${tournament.name}`),
      ),
    ).toMatchObject({
      actionLabel: "View Completed Draw",
      actionRoute: `/tournaments/draw?tournament=${encodeURIComponent(tournament.id)}`,
      summary: expect.arrayContaining([
        expect.objectContaining({ label: "Tournament finish" }),
        expect.objectContaining({ label: "Pot success" }),
        expect.objectContaining({ label: "Safety success" }),
        expect.objectContaining({ label: "Net finances" }),
      ]),
    });
  });
});

describe("connected career systems", () => {
  it("upgrades legacy saves to the expanded coach market and enforces affordability", () => {
    const state = createStarterState();
    const legacy = structuredClone(state);
    legacy.coaches = legacy.coaches.slice(0, 10);
    const repaired = repairGameState(legacy);
    expect(repaired.coaches).toHaveLength(32);

    const candidate = repaired.coaches.find(
      (coach) =>
        !repaired.coachContracts.some(
          (contract) => contract.coachId === coach.id,
        ),
    );
    expect(candidate).toBeDefined();
    if (!candidate) return;
    const blocked = hireCoachState(
      {
        ...repaired,
        coachContracts: [],
        player: { ...repaired.player, cash: 0 },
        finance: { ...repaired.finance, cash: 0, cashFlow: 0 },
      },
      candidate.id,
      "4 Week Clinic",
    );
    expect(blocked.coachContracts).toHaveLength(0);
    expect(blocked.lastAction).toMatch(/outside the current coaching budget/i);
  });

  it("hires a coach into the selected unlocked staff slot", () => {
    const state = createStarterState();
    const candidate = state.coaches.find(
      (coach) =>
        !state.coachContracts.some(
          (contract) => contract.coachId === coach.id,
        ),
    );
    expect(candidate).toBeDefined();
    if (!candidate) return;

    const staffed = hireCoachState(
      {
        ...state,
        coachContracts: [],
        player: {
          ...state.player,
          cash: 100_000,
          reputation: 100,
          worldRanking: 1,
        },
        finance: { ...state.finance, cash: 100_000, cashFlow: 10_000 },
      },
      candidate.id,
      "4 Week Clinic",
      "Specialist Coach",
    );

    expect(staffed.coachContracts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          coachId: candidate.id,
          slot: "Specialist Coach",
        }),
      ]),
    );
  });

  it("does not overwrite an occupied selected staff slot", () => {
    const state = createStarterState();
    const candidate = state.coaches.find(
      (coach) =>
        !state.coachContracts.some(
          (contract) => contract.coachId === coach.id,
        ),
    );
    expect(candidate).toBeDefined();
    if (!candidate) return;

    const attempted = hireCoachState(
      {
        ...state,
        player: {
          ...state.player,
          cash: 100_000,
          reputation: 100,
          worldRanking: 1,
        },
        finance: { ...state.finance, cash: 100_000, cashFlow: 10_000 },
      },
      candidate.id,
      "4 Week Clinic",
      "Lead Coach",
    );

    expect(attempted.coachContracts).toHaveLength(
      state.coachContracts.length,
    );
    expect(attempted.lastAction).toMatch(/already occupied/i);
  });

  it("keeps safety tactical while still taking scoring chances", () => {
    const state = createStarterState();
    const result = simulateSyntheticLiveVisitMatch({
      simulationMode: "liveVisitCalibration",
      playerName: state.player.fullName,
      opponentName: "Safety Plan Test",
      playerTacticalPlan: "Safety",
      opponentTacticalPlan: "Balanced",
      bestOf: 7,
      seed: 4412,
      playerAttributes: state.attributes,
      opponentAttributes: state.attributes,
      opponentProfileMode: "attributes",
      playerConfidence: 70,
      playerFatigue: 20,
      playerClutch: 68,
      playerStrength: 68,
      opponentRanking: 40,
      opponentConfidence: 68,
      opponentFatigue: 20,
      opponentClutch: 66,
      opponentStrength: 67,
      plannedMatchWinChance: 52,
    });

    const playerVisits = result.fullVisitLog.filter(
      (visit) => visit.actor === "Player",
    );
    expect(
      playerVisits.some((visit) => visit.decision === "Safety Exchange"),
    ).toBe(true);
    expect(
      playerVisits.some(
        (visit) =>
          visit.decision === "Pot Attempt" || visit.decision === "Break Build",
      ),
    ).toBe(true);
    expect(playerVisits.some((visit) => visit.points > 0)).toBe(true);
  });

  it("produces stronger break-building output for tour-level attributes", () => {
    const state = createStarterState();
    const withRating = (rating: number) => ({
      technical: Object.fromEntries(
        Object.keys(state.attributes.technical).map((key) => [key, rating]),
      ),
      mental: Object.fromEntries(
        Object.keys(state.attributes.mental).map((key) => [key, rating]),
      ),
      physical: Object.fromEntries(
        Object.keys(state.attributes.physical).map((key) => [key, rating]),
      ),
    });
    const simulateBand = (rating: number) =>
      Array.from({ length: 12 }, (_, seed) =>
        simulateSyntheticLiveVisitMatch({
          simulationMode: "liveVisitCalibration",
          playerName: "Calibration Player",
          opponentName: "Calibration Opponent",
          playerTacticalPlan: "Balanced",
          opponentTacticalPlan: "Balanced",
          bestOf: 7,
          seed: 7100 + seed,
          playerAttributes: withRating(rating),
          opponentAttributes: withRating(rating),
          opponentProfileMode: "attributes",
          playerConfidence: 70,
          playerFatigue: 25,
          playerClutch: rating,
          playerStrength: rating,
          opponentRanking: rating >= 80 ? 24 : 96,
          opponentConfidence: 70,
          opponentFatigue: 25,
          opponentClutch: rating,
          opponentStrength: rating,
          plannedMatchWinChance: 50,
        }).playerHighestBreak,
      );
    const clubBreaks = simulateBand(48);
    const tourBreaks = simulateBand(82);
    const average = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;

    expect(average(tourBreaks)).toBeGreaterThan(average(clubBreaks) + 12);
    expect(average(tourBreaks)).toBeGreaterThan(45);
    expect(tourBreaks.some((value) => value >= 70)).toBe(true);
  });

  it("makes deliberate tempo a real disruption tradeoff", () => {
    expect(getLiveTempoEffects("Deliberate")).toEqual({
      playerShotModifier: -1.5,
      opponentShotModifier: -3,
      playerFatigueCost: 0.45,
      visitMinutes: 6,
    });
    expect(getLiveTempoEffects("Steady")).toMatchObject({
      playerShotModifier: 0,
      opponentShotModifier: 0,
      playerFatigueCost: 0,
      visitMinutes: 4,
    });
  });

  it("makes recovery weeks restorative without granting unrelated skill gains", () => {
    const state = createStarterState();
    state.player.fatigue = 92;
    const rest = buildTrainingCell("rest");
    const restWeek = state.trainingPlan.map((day) => ({
      ...day,
      morning: rest,
      afternoon: rest,
      evening: rest,
    }));
    const before = structuredClone(state.attributes);
    const effects = calculateTrainingEffects(restWeek);
    const forecast = summarizeTrainingPlan(
      restWeek,
      state.player,
      state.attributes,
    );
    const after = applyTrainingPlanState(state, restWeek);

    expect(effects).toMatchObject({
      fatigueDelta: -30,
      technicalGain: 0,
      cueControlGain: 0,
      breakBuildingGain: 0,
      focusGain: 0,
      staminaGain: 0,
      weekLoad: 0,
    });
    expect(forecast.fatigueTrend).toBe(effects.fatigueDelta);
    expect(after.attributes).toEqual(before);
    expect(after.player.fatigue).toBe(62);
  });

  it("automatically applies training and sends a detailed inbox report every two advanced weeks", () => {
    const state = createStarterState();
    const firstWeek = advanceWeekState(state);

    expect(
      firstWeek.inbox.some((message) =>
        message.subject.startsWith("Fortnightly training report:"),
      ),
    ).toBe(false);
    expect(firstWeek.trainingCondition.reportSnapshot?.weeksTracked).toBe(1);

    const secondWeek = advanceWeekState(firstWeek);
    const report = secondWeek.inbox.find((message) =>
      message.subject.startsWith("Fortnightly training report:"),
    );

    expect(report).toMatchObject({
      sender: "Head Coach",
      actionLabel: "View Training Report",
      actionRoute: "/training/report",
      read: false,
    });
    expect(report?.preview).toMatch(/Review your development/);
    expect(report?.summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Recent form" }),
        expect.objectContaining({ label: "Confidence" }),
        expect.objectContaining({ label: "Training load" }),
        expect.objectContaining({ label: "Fatigue" }),
        expect.objectContaining({ label: "Strain / burnout" }),
      ]),
    );
    expect(secondWeek.trainingCondition.reportSnapshot?.weeksTracked).toBe(0);
    expect(
      secondWeek.trainingCondition.reportSnapshot?.lastReport,
    ).toMatchObject({
      changes: expect.any(Array),
      trainingLoad: expect.any(Number),
      adaptation: expect.any(Number),
      fatigueChange: expect.any(Number),
      strainChange: expect.any(Number),
      burnoutChange: expect.any(Number),
    });

    const duplicateApply = applyTrainingPlanState(secondWeek);
    expect(
      duplicateApply.inbox.filter((message) =>
        message.subject.startsWith("Fortnightly training report:"),
      ),
    ).toHaveLength(1);
  });

  it("reports exact weekly changes instead of a generic update", () => {
    const state = createStarterState();
    const advanced = advanceWeekState(state);
    const report = advanced.inbox.find(
      (message) => message.subject === `Week ${advanced.week} report`,
    );

    expect(report?.preview).toMatch(/Cash [+-]£[\d,]+/);
    expect(report?.preview).toMatch(/confidence [+-]?\d+/i);
    expect(report?.preview).toMatch(/fatigue [+-]?\d+/i);
    expect(report?.preview).not.toMatch(/updated for the new week/i);
    expect(report?.summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Weekly cash flow" }),
        expect.objectContaining({ label: "Confidence" }),
        expect.objectContaining({ label: "Fatigue" }),
        expect.objectContaining({ label: "Training progress" }),
        expect.objectContaining({ label: "Strain / burnout" }),
      ]),
    );
  });

  it("reduces adaptation when fatigue, strain, and burnout accumulate", () => {
    expect(getTrainingAdaptationMultiplier(25, 10, 5)).toBe(1);
    expect(getTrainingAdaptationMultiplier(88, 85, 75)).toBeLessThan(0.2);
  });

  it("uses bounded equipment effects and adds familiarity while equipment wears", () => {
    const state = createStarterState();
    const before = getEquipmentPerformanceProfile(state.equipment);
    const cueId = state.equipment.currentCueId;
    expect(before.totalBonus).toBeGreaterThan(0);
    expect(before.totalBonus).toBeLessThanOrEqual(9);
    expect(cueId).not.toBeNull();
    if (!cueId) return;

    const used = applyEquipmentMatchWear(state.equipment, 11);
    expect(used.cueStates[cueId].condition).toBeLessThan(
      state.equipment.cueStates[cueId].condition,
    );
    expect(used.cueStates[cueId].tipCondition).toBeLessThan(
      state.equipment.cueStates[cueId].tipCondition,
    );
    expect(used.cueStates[cueId].familiarity).toBeGreaterThan(
      state.equipment.cueStates[cueId].familiarity,
    );
    expect(used.chalkCondition).toBeLessThan(state.equipment.chalkCondition);
  });

  it("makes a better practice facility improve training efficiency without exceeding the cap", () => {
    const state = createStarterState();
    const noFacility = getFacilityTrainingMultiplier({
      ...state.equipment,
      currentTableId: null,
    });
    const eliteFacility = getFacilityTrainingMultiplier({
      ...state.equipment,
      currentTableId: tableSetupCatalog.at(-1)?.id ?? null,
    });
    expect(eliteFacility).toBeGreaterThan(noFacility);
    expect(eliteFacility).toBeLessThanOrEqual(1.15);
  });

  it("persists sponsor clauses and applies real weekly obligation costs", () => {
    const state = createStarterState();
    state.sponsors = [];
    state.player.reputation = 100;
    const offer = state.sponsorOffers.find(
      (item) => item.status === "Available",
    );
    expect(offer).toBeDefined();
    if (!offer) return;

    const accepted = acceptSponsorState(state, offer.id);
    const deal = accepted.sponsors.find((item) => item.id === offer.id);
    expect(deal).toMatchObject({
      bonusClause: offer.bonusClause,
      behaviour: offer.behaviour,
    });
    expect(deal?.obligationLoad).toBe(
      getSponsorObligationProfile(deal!).obligationLoad,
    );

    if (!deal) return;
    deal.weeklyFatigueCost = 3;
    const withoutSponsor = advanceWeekState({ ...accepted, sponsors: [] });
    const advanced = advanceWeekState(accepted);
    expect(advanced.player.fatigue).toBeGreaterThanOrEqual(
      withoutSponsor.player.fatigue + 2,
    );
  });

  it("fills the vacant sponsor slot selected by the player", () => {
    const state = createStarterState();
    state.sponsors = [];
    state.player.reputation = 100;
    state.player.worldRanking = 8;
    const offers = state.sponsorOffers.filter(
      (item) => item.status === "Available",
    );

    const cueCaseDeal = acceptSponsorState(state, offers[0].id, "Cue Case");
    const socialDeal = acceptSponsorState(
      cueCaseDeal,
      offers[1].id,
      "Social Media Partner",
    );

    expect(cueCaseDeal.sponsors.find((item) => item.id === offers[0].id)?.slot).toBe(
      "Cue Case",
    );
    expect(socialDeal.sponsors.find((item) => item.id === offers[1].id)?.slot).toBe(
      "Social Media Partner",
    );
  });

  it("turns sponsor performance clauses into bounded, auditable match bonuses", () => {
    const tournament = createStarterState().tournaments[0];
    const award = calculateSponsorMatchBonus(
      {
        id: "bonus-test",
        name: "Test Sponsor",
        category: "Cue Maker",
        slot: "Cue Case",
        monthlyValue: 500,
        contractLength: "12 months",
        weeksRemaining: 48,
        brandFit: 80,
        risk: "Low",
        bonusClause: "Century break +£250",
      },
      tournament,
      {
        round: "Quarter Final",
        result: "Won",
        centuries: 2,
        highestBreak: 121,
      },
      40,
    );

    expect(award).toMatchObject({ amount: 500, reason: "2 century breaks" });
    expect(award?.key).toContain(tournament.id);
  });

  it("uses treatment to reduce fatigue, strain, burnout, and persistent injury time", () => {
    const state = createStarterState();
    state.player.fatigue = 76;
    state.trainingCondition = {
      rollingLoad: 80,
      strain: 72,
      burnout: 64,
      injuryWeeks: 3,
      seasonStartAttributes: structuredClone(state.attributes),
    };
    state.health.activeIssue = {
      id: "injury-test",
      issue: "Shoulder strain",
      bodyArea: "Shoulder",
      severity: "Moderate",
      cause: "Training overload",
      startedDate: state.currentDate,
      weeksRemaining: 3,
      recoveryProgress: 10,
    };

    const treated = scheduleTreatmentState(state, "treat-2");

    expect(treated.player.fatigue).toBeLessThan(state.player.fatigue);
    expect(treated.trainingCondition.strain).toBeLessThan(
      state.trainingCondition.strain,
    );
    expect(treated.trainingCondition.burnout).toBeLessThan(
      state.trainingCondition.burnout,
    );
    expect(treated.trainingCondition.injuryWeeks).toBe(1);
    expect(treated.health.activeIssue?.weeksRemaining).toBe(1);
    expect(
      treated.trainingCondition.seasonStartAttributes.physical["Shoulder Health"],
    ).toBe(state.attributes.physical["Shoulder Health"]);
    expect(treated.attributes.physical["Shoulder Health"]).toBeGreaterThan(
      treated.trainingCondition.seasonStartAttributes.physical["Shoulder Health"],
    );
    expect(treated.health.history[0]).toMatchObject({
      issue: "Shoulder strain",
      treatment: "Physio Treatment",
    });
  });

  it("offers and accepts a compliant sponsor renewal near expiry", () => {
    const state = createStarterState();
    const sponsor = state.sponsors[0];
    sponsor.weeksRemaining = 4;
    sponsor.compliance = 92;
    sponsor.renewalStatus = "None";

    const offered = advanceWeekState(state);
    const offeredSponsor = offered.sponsors.find(
      (item) => item.id === sponsor.id,
    );
    expect(offeredSponsor).toMatchObject({
      renewalStatus: "Offered",
      renewalOfferValue: expect.any(Number),
    });

    offered.player.reputation = 100;
    const negotiated = renegotiateSponsorState(offered, sponsor.id);
    expect(
      negotiated.sponsors.find((item) => item.id === sponsor.id)
        ?.renewalOfferValue,
    ).toBeGreaterThanOrEqual(offeredSponsor?.renewalOfferValue ?? 0);

    const renewed = renewSponsorState(negotiated, sponsor.id);
    expect(
      renewed.sponsors.find((item) => item.id === sponsor.id),
    ).toMatchObject({ weeksRemaining: 48, renewalStatus: "Accepted" });
  });

  it("terminates a sponsor after a third missed obligation", () => {
    const state = createStarterState();
    const sponsor = state.sponsors[0];
    const cadence = Math.max(2, 7 - (sponsor.obligationLoad ?? 2));
    const sponsorSeed = sponsor.id
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    state.week =
      Array.from({ length: cadence }, (_, index) => index + 1).find(
        (week) => (week + sponsorSeed) % cadence === 0,
      ) ?? state.week;
    state.player.fatigue = 95;
    sponsor.missedObligations = 2;
    sponsor.compliance = 52;

    const breached = advanceWeekState(state);
    expect(breached.sponsors.some((item) => item.id === sponsor.id)).toBe(
      false,
    );
    expect(
      breached.inbox.some((message) =>
        message.subject.includes("contract terminated"),
      ),
    ).toBe(true);
  });

  it("charges for depleted chalk instead of refilling it by re-equipping", () => {
    const state = createStarterState();
    const chalk = chalkCatalog.find(
      (item) => item.id === state.equipment.currentChalkId,
    );
    expect(chalk).toBeDefined();
    if (!chalk) return;
    state.equipment.chalkCondition = 0;
    state.equipment.chalkStock[chalk.id] = 0;
    const cashBefore = state.player.cash;

    const replenished = buyChalkState(state, chalk.id);
    expect(replenished.player.cash).toBe(cashBefore - chalk.cost);
    expect(replenished.equipment.chalkCondition).toBe(100);
    expect(replenished.equipment.chalkStock[chalk.id]).toBe(5);
  });
});
