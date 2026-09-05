import { CareerDecisionNotice } from '../components/career/CareerDepthPanels';
import { DashboardCareerSummary, DashboardFinanceSummary } from '../components/game/DashboardSummaryCards';
import {
  Activity,
  BadgePoundSterling,
  CalendarDays,
  Dumbbell,
  Target,
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
} from "../hooks/useGameState";
import { buildDashboardData } from "../utils/liveRouteData";

function compactMoney(value: number) {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000)
    return `${sign}£${(absolute / 1_000_000).toFixed(1)}m`;
  if (absolute >= 1_000) return `${sign}£${Math.round(absolute / 1_000)}k`;
  return `${sign}£${absolute}`;
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
  } = useGame();
  const navigate = useNavigate();
  const { currentCue } = buildDashboardData(gameState);
  const nextEvent = getNextEligibleTournament(gameState);
  const enteredEvent = nextEvent?.status === "Entered" ? nextEvent : undefined;
  const currentRanking =
    gameState.rankings.find(
      (row) => row.playerName === gameState.player.fullName,
    )?.ranking ??
    gameState.player.worldRanking ??
    gameState.player.amateurRanking;
  const activeCoach = gameState.coaches.find(
    (coach) => coach.id === gameState.currentCoachId,
  );
  const latestMatches = gameState.matches.slice(0, 5);
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

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:-m-6 xl:h-[calc(100vh-6.25rem)] xl:gap-2 xl:overflow-hidden xl:p-1.5">
      <CareerDecisionNotice />
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
            <DashboardCareerSummary state={gameState} coachName={activeCoach?.name} />
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
            <DashboardFinanceSummary state={gameState} />
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
