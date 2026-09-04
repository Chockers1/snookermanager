import {
  Activity,
  BadgePoundSterling,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Play,
  Route,
  SkipForward,
  Swords,
  Target,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/useGame";
import {
  getNextEligibleTournament,
  getTournamentPlayability,
} from "../hooks/useGameState";
import { buildDashboardData } from "../utils/liveRouteData";
import { formatMoney } from "../utils/formatters";

function compactMoney(value: number) {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000)
    return `${sign}£${(absolute / 1_000_000).toFixed(1)}m`;
  if (absolute >= 1_000) return `${sign}£${Math.round(absolute / 1_000)}k`;
  return `${sign}£${absolute}`;
}

function formatFinanceValue(
  value: number | null | undefined,
  fallback = "TBA",
) {
  return typeof value === "number" && Number.isFinite(value)
    ? compactMoney(value)
    : fallback;
}

function attributeRows(attributes: Record<string, number>, count: number) {
  return Object.entries(attributes)
    .sort((left, right) => right[1] - left[1])
    .slice(0, count);
}

export function DashboardPage() {
  const {
    gameState,
    continueWeek,
    continueToNextTournament,
    enterTournament,
    skipTournament,
  } = useGame();
  const navigate = useNavigate();
  const { currentCue, financeChart } = buildDashboardData(gameState);
  const nextEvent = getNextEligibleTournament(gameState);
  const enteredEvent = nextEvent?.status === "Entered" ? nextEvent : undefined;
  const currentRanking =
    gameState.rankings.find(
      (row) => row.playerName === gameState.player.fullName,
    )?.ranking ??
    gameState.player.worldRanking ??
    gameState.player.amateurRanking;
  const tournamentPlayability = enteredEvent
    ? getTournamentPlayability(gameState, enteredEvent)
    : null;
  const canPlayTournament = tournamentPlayability?.canPlay ?? false;
  const hasLiveMatchInProgress = gameState.liveMatch?.status === "In Progress";
  const activeCoach = gameState.coaches.find(
    (coach) => coach.id === gameState.currentCoachId,
  );
  const latestMatches = gameState.matches.slice(0, 5);
  const upcomingOpponent = gameState.tournamentProgress.draw
    .flatMap((round) => round.matches)
    .find(
      (match) =>
        match.top.name === gameState.player.fullName ||
        match.bottom.name === gameState.player.fullName,
    );
  const opponentName = upcomingOpponent
    ? upcomingOpponent.top.name === gameState.player.fullName
      ? upcomingOpponent.bottom.name
      : upcomingOpponent.top.name
    : "Opponent TBD";
  const rankingTrend = gameState.history.snapshots
    .slice(-10)
    .map((snapshot) => ({
      label: `W${snapshot.week}`,
      rank: snapshot.ranking || currentRanking || 0,
    }));
  const fallbackRankingTrend = Array.from({ length: 8 }, (_, index) => ({
    label: `W${Math.max(1, gameState.week - (7 - index))}`,
    rank: Math.max(1, (currentRanking ?? 40) + (7 - index)),
  }));
  const activeRankingTrend =
    rankingTrend.length > 1 ? rankingTrend : fallbackRankingTrend;
  const topTechnicalRows = attributeRows(gameState.attributes.technical, 5);
  const topMentalRows = attributeRows(gameState.attributes.mental, 4);
  const seasonMatches = gameState.matches.length;
  const seasonWins = gameState.matches.filter(
    (match) => match.result === "Won",
  ).length;
  const seasonWinRate =
    seasonMatches > 0 ? Math.round((seasonWins / seasonMatches) * 100) : 0;
  const latestFinancePoint = financeChart[financeChart.length - 1] ?? {
    income: 0,
    expenses: 0,
  };
  const eventStatusLabel = hasLiveMatchInProgress
    ? "Match live"
    : enteredEvent
      ? canPlayTournament
        ? "Ready to play"
        : "Entry accepted"
      : nextEvent
        ? "Entry pending"
        : "No event selected";
  const eventStageLabel = hasLiveMatchInProgress
    ? (gameState.liveMatch?.round ?? "Live match")
    : (gameState.tournamentProgress.currentRound ?? "Entry");
  const primaryEventActionLabel = hasLiveMatchInProgress
    ? "Resume Live Match"
    : enteredEvent
      ? canPlayTournament
        ? "Play Next Match"
        : !tournamentPlayability?.travelBooked
          ? "Book Travel"
          : (tournamentPlayability?.daysUntilStart ?? 0) > 0
            ? "Advance to Tournament"
            : "Open Tournament Hub"
      : nextEvent
        ? "Enter Tournament"
        : "View Tournament Calendar";
  const currentCueBonus = Object.entries(currentCue?.bonuses ?? {}).sort(
    (left, right) => right[1] - left[1],
  )[0];
  const rankingBest =
    activeRankingTrend.length > 0
      ? Math.min(...activeRankingTrend.map((point) => point.rank))
      : (currentRanking ?? 0);
  const rankingAverage =
    activeRankingTrend.length > 0
      ? Math.round(
          activeRankingTrend.reduce((sum, point) => sum + point.rank, 0) /
            activeRankingTrend.length,
        )
      : (currentRanking ?? 0);
  const rankingLowest =
    activeRankingTrend.length > 0
      ? Math.max(...activeRankingTrend.map((point) => point.rank))
      : (currentRanking ?? 0);
  const latestResult = latestMatches[0];
  const nextTargetRank = Math.max(1, (currentRanking ?? 2) - 1);
  const goalFocus =
    [topTechnicalRows[0]?.[0], topMentalRows[0]?.[0]]
      .filter(Boolean)
      .join(" & ") || "Match readiness";

  function handlePrimaryEventAction() {
    if (hasLiveMatchInProgress) {
      navigate("/match/live");
      return;
    }

    if (enteredEvent) {
      if (canPlayTournament) {
        navigate("/match/preview");
      } else if (!tournamentPlayability?.travelBooked) {
        navigate("/travel");
      } else if ((tournamentPlayability?.daysUntilStart ?? 0) > 0) {
        continueToNextTournament();
        navigate("/tournaments/hub");
      } else {
        navigate("/tournaments/hub");
      }
      return;
    }

    if (nextEvent) {
      enterTournament(nextEvent.id);
      navigate("/tournaments/hub");
      return;
    }

    navigate("/calendar");
  }

  function handleSecondaryEventAction() {
    if (enteredEvent || hasLiveMatchInProgress) {
      navigate("/tournaments/hub");
      return;
    }

    if (nextEvent) {
      skipTournament(nextEvent.id);
      return;
    }

    navigate("/calendar");
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:-m-6 xl:h-[calc(100vh-5.5rem)] xl:gap-2 xl:overflow-hidden xl:p-1.5">
      <div className="card shrink-0 overflow-hidden border-green-600/30 bg-gradient-to-r from-green-600/10 via-surface to-surface">
        <div className="grid gap-3 px-3 py-3 sm:grid-cols-2 sm:px-4 lg:grid-cols-12 lg:gap-2">
          <div className="sm:col-span-2 lg:col-span-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-green-500/40 bg-green-600/10">
                <Trophy className="h-5 w-5 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-green-400">
                  Career Next Step
                </p>
                <h2 className="mt-1 truncate text-base font-bold text-white">
                  {nextEvent?.name ?? "No tournament scheduled"}
                </h2>
                <p className="mt-1 truncate text-[11px] text-gray-400">
                  {eventStageLabel} · {nextEvent?.format ?? "Awaiting format"} ·{" "}
                  {eventStatusLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:col-span-3">
            <div className="rounded-xl border border-border bg-surface/80 px-3 py-3 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                Required Action
              </p>
              <p className="mt-1 truncate text-sm font-bold text-white">
                {primaryEventActionLabel}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/80 px-3 py-3 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                Opponent
              </p>
              <p className="mt-1 truncate text-sm font-bold text-white">
                {opponentName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end lg:col-span-4">
            <button
              type="button"
              onClick={handleSecondaryEventAction}
              className="btn-secondary text-xs"
            >
              {enteredEvent || hasLiveMatchInProgress ? (
                <Route className="h-3.5 w-3.5" />
              ) : nextEvent ? (
                <SkipForward className="h-3.5 w-3.5" />
              ) : (
                <CalendarDays className="h-3.5 w-3.5" />
              )}
              {enteredEvent || hasLiveMatchInProgress
                ? "Tournament Hub"
                : nextEvent
                  ? "Skip This Event"
                  : "View Calendar"}
            </button>
            <button
              type="button"
              onClick={handlePrimaryEventAction}
              className="btn-primary px-5 text-xs"
            >
              {hasLiveMatchInProgress || canPlayTournament ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Swords className="h-3.5 w-3.5" />
              )}
              {primaryEventActionLabel}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-2">
        <div className="grid min-h-0 gap-3 xl:col-span-4 xl:grid-rows-[1.18fr_0.92fr_0.62fr] xl:gap-2">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-green-400" />
                <span className="truncate">Upcoming & Recent Results</span>
              </h3>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-x-auto px-3">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-border text-gray-500">
                      <th className="whitespace-nowrap py-1.5 pr-3 text-left font-medium">
                        Date
                      </th>
                      <th className="whitespace-nowrap px-3 py-1.5 text-left font-medium">
                        Tournament
                      </th>
                      <th className="whitespace-nowrap px-3 py-1.5 text-left font-medium">
                        Round
                      </th>
                      <th className="whitespace-nowrap px-3 py-1.5 text-left font-medium">
                        Opponent
                      </th>
                      <th className="whitespace-nowrap px-3 py-1.5 text-left font-medium">
                        Result
                      </th>
                      <th className="whitespace-nowrap py-1.5 pl-3 text-right font-medium">
                        Prize
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestMatches.length > 0 ? (
                      latestMatches.map((match) => (
                        <tr
                          key={match.id}
                          className="border-b border-border/50 transition-colors hover:bg-surface-light/40"
                        >
                          <td className="whitespace-nowrap py-1.5 pr-3 text-gray-400">
                            {match.playedOn ?? gameState.currentDate}
                          </td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-white">
                            {gameState.tournaments.find(
                              (event) => event.id === match.tournamentId,
                            )?.name ?? "Career match"}
                          </td>
                          <td className="px-3 py-1.5 text-gray-400">
                            {match.round}
                          </td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-white">
                            {match.opponentName}
                          </td>
                          <td className="px-3 py-1.5">
                            <span
                              className={
                                match.result === "Won"
                                  ? "font-medium text-green-400"
                                  : "font-medium text-red-400"
                              }
                            >
                              {match.playerFrames}-{match.opponentFrames}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-1.5 pl-3 text-right text-green-400">
                            {compactMoney(match.prizeMoneyEarned)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-gray-400"
                        >
                          No completed matches yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/training")}
            className="card min-h-0 flex h-full flex-col overflow-hidden text-left transition hover:border-green-500/50"
          >
            <div className="card-header">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
                <Dumbbell className="h-3.5 w-3.5 shrink-0 text-green-400" />
                <span className="truncate">Training Week Overview</span>
              </h3>
              <span className="text-[9px] text-gray-400">
                Week {gameState.week}
              </span>
            </div>
            <div className="card-body flex min-h-0 flex-1 flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <Users className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  Focus: {activeCoach?.name ?? "Self-managed training"} week
                </span>
              </div>
              <div className="space-y-2">
                {topTechnicalRows.slice(0, 5).map(([label, value]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 truncate text-[10px] text-gray-300">
                      {label}
                    </span>
                    <span className="shrink-0 rounded bg-green-600/15 px-1 py-0.5 text-[9px] font-medium text-green-400">
                      Focus
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="progress-bar h-1.5">
                        <div
                          className="progress-fill bg-green-500"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-7 shrink-0 text-right text-[9px] text-gray-400">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-2 text-[9px]">
                <span className="text-gray-500">Detailed sessions are in Training</span>
                <span className="font-semibold text-green-400">Open planner →</span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/equipment/cues")}
            className="card min-h-0 flex h-full flex-col text-left transition hover:border-green-500/50"
          >
            <div className="card-header">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
                <Wrench className="h-3.5 w-3.5 shrink-0 text-green-400" />
                <span className="truncate">Equipment</span>
              </h3>
            </div>
            <div className="card-body flex h-full flex-col justify-between gap-2">
              <div>
                <p className="truncate text-sm font-semibold text-white">
                  {currentCue?.name ?? "No cue selected"}
                </p>
                <p className="mt-1 text-[10px] text-gray-400">
                  {gameState.player.cueStyle ?? "Traditional"} ·{" "}
                  {currentCueBonus
                    ? `${currentCueBonus[0]} +${currentCueBonus[1]}`
                    : "No active bonus"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <p className="text-gray-500">Condition</p>
                  <p className="font-semibold text-white">
                    {currentCue?.condition ?? 0}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Familiarity</p>
                  <p className="font-semibold text-white">
                    {currentCue?.familiarity ?? 0}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Cue Ball</p>
                  <p className="font-semibold text-green-400">
                    +{currentCue?.bonuses["Cue Ball Control"] ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="grid min-h-0 gap-3 xl:col-span-4 xl:grid-rows-[1.18fr_0.92fr_0.62fr] xl:gap-2">
          <button
            type="button"
            onClick={() => navigate("/player/attributes")}
            className="card min-h-0 flex h-full flex-col text-left transition hover:border-green-500/50"
          >
            <div className="card-header">
              <h3 className="truncate text-xs font-semibold text-white">
                Attributes Summary
              </h3>
            </div>
            <div className="card-body flex min-h-0 flex-1 flex-col gap-2">
              <div>
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Technical Skills
                </p>
                <div className="space-y-1.5">
                  {topTechnicalRows.slice(0, 3).map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px]">
                        <span className="truncate text-gray-300">{label}</span>
                        <span className="font-medium text-white">{value}</span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <div
                          className="progress-fill bg-green-500"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-1.5">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Mental Skills
                </p>
                <div className="space-y-1.5">
                  {topMentalRows.slice(0, 3).map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px]">
                        <span className="truncate text-gray-300">{label}</span>
                        <span className="font-medium text-white">{value}</span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <div
                          className="progress-fill bg-amber-500"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto flex justify-end border-t border-border pt-1.5 text-[9px] font-semibold text-green-400">
                View all attributes →
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/rankings")}
            className="card min-h-0 flex h-full flex-col text-left transition hover:border-green-500/50"
          >
            <div className="card-header">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
                <Target className="h-3.5 w-3.5 shrink-0 text-green-400" />
                <span className="truncate">Ranking Progression</span>
              </h3>
            </div>
            <div className="card-body flex h-full flex-col">
              <div className="flex-1">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={0}
                  initialDimension={{ width: 1, height: 1 }}
                >
                  <AreaChart data={activeRankingTrend}>
                    <defs>
                      <linearGradient
                        id="dashboardRankGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#22c55e"
                          stopOpacity={0.32}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22c55e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      reversed
                      tick={{ fontSize: 9, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#141e2a",
                        border: "1px solid #1e2d3d",
                        borderRadius: 8,
                        fontSize: 10,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rank"
                      stroke="#22c55e"
                      fill="url(#dashboardRankGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-[9px] text-gray-500">Current</p>
                  <p className="text-xs font-bold text-white">
                    {currentRanking ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500">Best</p>
                  <p className="text-xs font-bold text-white">
                    {rankingBest || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500">Average</p>
                  <p className="text-xs font-bold text-white">
                    {rankingAverage || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500">Lowest</p>
                  <p className="text-xs font-bold text-white">
                    {rankingLowest || "-"}
                  </p>
                </div>
              </div>
            </div>
          </button>

          <div className="card min-h-0 flex h-full flex-col">
            <div className="card-header">
              <h3 className="text-xs font-semibold text-white">Goals</h3>
            </div>
            <div className="card-body grid h-full gap-2 text-[10px] text-gray-300">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Main Goal</span>
                <span className="truncate text-right font-medium text-green-400">
                  {enteredEvent
                    ? `Win ${nextEvent?.name ?? "next event"}`
                    : "Lock in next event"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Ranking Push</span>
                <span className="truncate text-right font-medium text-white">
                  Reach #{nextTargetRank}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Season Win Rate</span>
                <span className="truncate text-right font-medium text-white">
                  {seasonWinRate}%
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Focus</span>
                <span className="truncate text-right font-medium text-white">
                  {goalFocus}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 gap-3 xl:col-span-4 xl:grid-rows-[1.18fr_0.92fr_0.62fr] xl:gap-2">
          <button
            type="button"
            onClick={() => navigate("/career/progression")}
            className="card min-h-0 flex h-full flex-col text-left transition hover:border-green-500/50"
          >
            <div className="card-header">
              <h3 className="text-xs font-semibold text-white">
                Career Details
              </h3>
            </div>
            <div className="card-body grid h-full grid-cols-2 content-center gap-x-4 gap-y-2 text-[10px]">
              <div>
                <p className="text-gray-500">Age</p>
                <p className="mt-0.5 font-semibold text-white">
                  {gameState.player.age}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Hand</p>
                <p className="mt-0.5 truncate font-semibold text-white">
                  {gameState.player.handedness}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Coach</p>
                <p className="mt-0.5 truncate font-semibold text-green-400">
                  {activeCoach?.name ?? "Open slot"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="mt-0.5 truncate font-semibold text-white">
                  {gameState.player.competitiveStatus ??
                    gameState.player.rankingLabel}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Style</p>
                <p className="mt-0.5 truncate font-semibold text-white">
                  {gameState.player.playingStyle} ·{" "}
                  {gameState.player.cueStyle ?? "Traditional Cue Action"}
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/finance")}
            className="card min-h-0 flex h-full flex-col text-left transition hover:border-green-500/50"
          >
            <div className="card-header">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
                <BadgePoundSterling className="h-3.5 w-3.5 shrink-0 text-green-400" />
                <span className="truncate">Finances Overview</span>
              </h3>
              <span className="text-[9px] text-gray-400">This Month</span>
            </div>
            <div className="card-body flex h-full flex-col justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Balance
                </p>
                <p className="mt-1.5 truncate text-2xl font-bold text-white">
                  {formatMoney(gameState.player.cash)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                <div className="min-w-0">
                  <p className="truncate text-gray-500">Winnings</p>
                  <p className="mt-1 truncate font-semibold text-green-400">
                    {formatFinanceValue(latestFinancePoint.income, "TBA")}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-gray-500">Expenses</p>
                  <p className="mt-1 truncate font-semibold text-red-400">
                    {formatFinanceValue(latestFinancePoint.expenses, "TBA")}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-gray-500">Entries</p>
                  <p className="mt-1 truncate font-semibold text-white">
                    {nextEvent ? formatFinanceValue(nextEvent.entryFee) : "TBA"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-gray-500">Status</p>
                  <p className="mt-1 truncate font-semibold text-green-400">
                    {gameState.player.cash >= 10_000
                      ? "Stable"
                      : gameState.player.cash >= 5_000
                        ? "Caution"
                        : "Tight"}
                  </p>
                </div>
              </div>
            </div>
          </button>

          <div className="card min-h-0 flex h-full flex-col">
            <div className="card-header">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
                <Activity className="h-3.5 w-3.5 shrink-0 text-green-400" />
                <span className="truncate">Quick Actions</span>
              </h3>
            </div>
            <div className="card-body flex h-full flex-col justify-between gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/mental")}
                  className="btn-secondary justify-center text-[10px]"
                >
                  Before Match Routine
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(latestResult ? "/match/result" : "/calendar")
                  }
                  className="btn-secondary justify-center text-[10px]"
                >
                  Review Last Event
                </button>
              </div>
              <button
                type="button"
                onClick={continueWeek}
                className="btn-secondary w-full justify-center text-[10px]"
              >
                Advance One Week
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
