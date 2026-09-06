import { GroupFixtures } from '../components/tournaments/GroupFixtures';
import { isGroupDraw } from '../game/championshipLeague';
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download, Route, Trophy } from "lucide-react";
import { TournamentBracket } from "../components/tournaments/TournamentBracket";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import { formatMoney } from "../utils/formatters";
import { buildTournamentDrawData } from "../utils/liveRouteData";

function difficultyClass(
  difficulty: "Moderate" | "Challenging" | "Very Tough",
) {
  if (difficulty === "Very Tough") return "text-red-400";
  if (difficulty === "Challenging") return "text-amber-400";
  return "text-green-400";
}

function difficultyValue(
  difficulty: "Moderate" | "Challenging" | "Very Tough",
) {
  if (difficulty === "Very Tough") return 84;
  if (difficulty === "Challenging") return 62;
  return 44;
}

function progressClass(status: "completed" | "current" | "upcoming") {
  if (status === "completed")
    return "border-green-600/30 bg-green-600/10 text-green-400";
  if (status === "current")
    return "border-amber-600/30 bg-amber-600/10 text-amber-400";
  return "border-border bg-surface-light text-gray-500";
}

export function TournamentDrawPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { gameState } = useGame();
  const [compactView, setCompactView] = useState(false);
  const tournamentId = searchParams.get("tournament");
  const drawData = buildTournamentDrawData(gameState, tournamentId);
  const groupCompetition = isGroupDraw(drawData.bracket);
  const visibleBracket = compactView
    ? drawData.bracket.map((round) => ({
        ...round,
        matches: round.matches.slice(0, 2),
      }))
    : drawData.bracket;

  if (!drawData.tournamentId) return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h1 className="text-2xl font-bold text-white">No tournament draw</h1>
      <p className="mt-3 text-sm text-gray-400">Choose an event from the calendar to view its draw.</p>
      <button type="button" className="btn-primary mt-5" onClick={() => navigate('/calendar')}>View Tournament Calendar</button>
    </section>
  );

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase text-gray-500">
            Tournaments
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {drawData.tournamentName}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {drawData.eventCompleted
              ? `${drawData.resultLabel ?? "Event complete"} · full tournament bracket`
              : "Projected route, bracket position, and opponent difficulty."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={
              compactView ? "btn-secondary text-xs" : "btn-primary text-xs"
            }
            onClick={() => setCompactView(false)}
          >
            Full Draw
          </button>
          <button
            type="button"
            className={
              compactView ? "btn-primary text-xs" : "btn-secondary text-xs"
            }
            onClick={() => setCompactView(true)}
          >
            Compact
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => typeof window !== "undefined" && window.print()}
          >
            <Download className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {drawData.eventCompleted && drawData.eventSummary ? (
        <section
          className="grid gap-2 rounded-xl border border-green-500/25 bg-green-500/5 p-3 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Completed event summary"
        >
          <div className="rounded-lg bg-surface/70 p-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">
              Your finish
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {drawData.resultLabel}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              {drawData.eventSummary.wins}-{drawData.eventSummary.losses} match
              record
            </p>
          </div>
          <div className="rounded-lg bg-surface/70 p-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">
              Event reward
            </p>
            <p className="mt-1 text-sm font-semibold text-green-400">
              {formatMoney(drawData.eventSummary.prizeMoney)}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              +{drawData.eventSummary.rankingPoints} ranking points
            </p>
          </div>
          <div className="rounded-lg bg-surface/70 p-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">
              Event finances
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${drawData.eventSummary.net >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {drawData.eventSummary.net >= 0 ? "+" : "−"}
              {formatMoney(Math.abs(drawData.eventSummary.net))}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              {formatMoney(drawData.eventSummary.costs)} entry and travel costs
            </p>
          </div>
          <div className="rounded-lg bg-surface/70 p-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">
              Performance
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              High break {drawData.eventSummary.highestBreak}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              Full bracket resolved below
            </p>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="card">
            <div className="card-header">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Trophy className="h-3.5 w-3.5 text-green-400" />{" "}
                {groupCompetition ? "Groups and Fixtures" : drawData.eventCompleted ? "Completed Bracket" : "Bracket"}
              </h3>
              <span
                className={
                  drawData.eventCompleted
                    ? "text-[10px] font-semibold text-green-400"
                    : "text-[10px] text-gray-400"
                }
              >
                {drawData.currentPosition.currentRound}
              </span>
            </div>
            <div className="card-body min-h-[32rem] overflow-hidden">
              <>{groupCompetition ? <GroupFixtures rounds={drawData.bracket} playerName={gameState.player.fullName} currentRound={drawData.currentPosition.currentRound} /> : <TournamentBracket
                rounds={visibleBracket}
                playerName={gameState.player.fullName}
                currentRound={drawData.currentPosition.currentRound}
                dense={compactView}
              />}</>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">
                Route Progress
              </h3>
            </div>
            <div className="card-body flex gap-2 overflow-x-auto">
              {drawData.progress.map((step) => (
                <div
                  key={step.label}
                  className={`min-w-28 flex-1 rounded-lg border px-3 py-3 text-center text-[10px] font-semibold uppercase ${progressClass(step.status)}`}
                >
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">
              Path & Opponent Outlook
            </h3>
            <div className="space-y-2">
              {drawData.opponentOutlook.map((opponent) => (
                <div
                  key={opponent.id}
                  className="rounded-lg bg-surface-light/50 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {opponent.name}
                      </p>
                      <p className="text-gray-400">
                        Rank {opponent.rank} - {opponent.nation}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 ${difficultyClass(opponent.difficulty)}`}
                    >
                      {opponent.difficulty}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                    <span>H2H</span>
                    <span>{opponent.headToHead}</span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar
                      value={difficultyValue(opponent.difficulty)}
                      tone={
                        opponent.difficulty === "Very Tough"
                          ? "red"
                          : opponent.difficulty === "Challenging"
                            ? "amber"
                            : "green"
                      }
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">
              Current Position
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Round</span>
                <span className="text-white">
                  {drawData.currentPosition.currentRound}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Best Result</span>
                <span className="text-white">
                  {drawData.currentPosition.bestResult}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Projected Route</span>
                <span className="text-white">
                  {drawData.currentPosition.projectedRoute}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-gray-400">Bracket Difficulty</span>
                <span className="text-amber-400">
                  {drawData.currentPosition.difficultyLabel}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gradient-to-r from-green-500 via-amber-400 to-red-500">
                <div
                  className="h-full bg-white/20"
                  style={{ width: `${drawData.difficultyScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">
              Draw Insights
            </h3>
            <div className="space-y-2">
              {drawData.insights.map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between rounded bg-surface-light/50 px-3 py-2 text-xs"
                >
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn-primary w-full justify-center text-xs"
            onClick={() =>
              navigate(drawData.eventCompleted ? "/" : "/match/preview")
            }
          >
            <Route className="h-3.5 w-3.5" />{" "}
            {drawData.eventCompleted
              ? "Back to Dashboard"
              : "Scout Next Opponent"}
          </button>
          <button
            type="button"
            className="btn-secondary w-full justify-center text-xs"
            onClick={() => navigate("/rankings")}
          >
            View Rankings
          </button>
        </div>
      </div>
    </div>
  );
}
