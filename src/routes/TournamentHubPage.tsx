import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Maximize2,
  Play,
  Search,
  SkipForward,
  Trophy,
} from "lucide-react";
import { TournamentBracket } from "../components/tournaments/TournamentBracket";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import { chalkCatalog, cueCatalog, tipCatalog } from "../data/catalogs";
import {
  getNextEligibleTournament,
  getTournamentPlayability,
} from "../hooks/useGameState";
import {
  buildTournamentDrawData,
  buildTournamentHubData,
} from "../utils/liveRouteData";
import { formatMoney } from "../utils/formatters";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TournamentHubPage() {
  const {
    gameState,
    simulateMatch,
    enterTournament,
    skipTournament,
    continueToNextTournament,
  } = useGame();
  const navigate = useNavigate();
  const hubData = buildTournamentHubData(gameState);
  const drawData = buildTournamentDrawData(gameState);
  const currentCue = cueCatalog.find(
    (cue) => cue.id === gameState.equipment.currentCueId,
  );
  const currentChalk = chalkCatalog.find(
    (chalk) => chalk.id === gameState.equipment.currentChalkId,
  );
  const currentTip = tipCatalog.find(
    (tip) => tip.id === gameState.equipment.currentTipId,
  );
  const equipmentReady = Boolean(currentCue && currentChalk && currentTip);
  const activeTournament = getNextEligibleTournament(gameState);
  const tournamentEntered = activeTournament?.status === "Entered";
  const playability = activeTournament
    ? getTournamentPlayability(gameState, activeTournament)
    : null;
  const playerRow = gameState.rankings.find(
    (row) => row.playerName === gameState.player.fullName,
  );
  const activeRound =
    gameState.tournamentProgress.tournamentId === activeTournament?.id
      ? gameState.tournamentProgress.currentRound
      : null;
  const completedRounds =
    gameState.tournamentProgress.tournamentId === activeTournament?.id
      ? gameState.tournamentProgress.completedRounds
      : [];
  const activeBracketMatch = drawData.bracket
    .find((round) => round.label === activeRound)
    ?.matches.find(
      (match) =>
        match.top.name === gameState.player.fullName ||
        match.bottom.name === gameState.player.fullName,
    );
  const bracketOpponent = activeBracketMatch
    ? activeBracketMatch.top.name === gameState.player.fullName
      ? activeBracketMatch.bottom
      : activeBracketMatch.top
    : null;
  const nextOpponent =
    bracketOpponent && bracketOpponent.name !== "TBD"
      ? (gameState.rankings.find(
          (row) => row.playerName === bracketOpponent.name,
        ) ?? {
          playerName: bracketOpponent.name,
          ranking: bracketOpponent.rank,
          nation: bracketOpponent.nation,
        })
      : (gameState.rankings.find(
          (row) =>
            row.playerName !== gameState.player.fullName &&
            Math.abs(row.ranking - (playerRow?.ranking ?? 1)) <= 3,
        ) ??
        gameState.rankings.find(
          (row) => row.playerName !== gameState.player.fullName,
        ));
  const technicalAverage = average(
    Object.values(gameState.attributes.technical),
  );
  const freshness = Math.max(0, 100 - gameState.player.fatigue);
  const readiness = Math.round(
    (gameState.player.confidence +
      freshness +
      gameState.player.morale +
      technicalAverage) /
      4,
  );
  const nextMatchStageLabel = tournamentEntered
    ? (activeRound ?? "Awaiting Draw")
    : "Awaiting Draw";
  const primaryActionLabel = !equipmentReady
    ? "Open Equipment"
    : !tournamentEntered
      ? "Enter Tournament"
      : !playability?.travelBooked
        ? "Book Travel"
        : (playability?.daysUntilStart ?? 0) > 0
          ? "Advance to Tournament"
          : "Play Next Match";
  const stageLabels =
    drawData.progress.length > 0
      ? drawData.progress
      : [
          { label: "Last 16", status: "current" as const },
          { label: "Quarter Final", status: "upcoming" as const },
          { label: "Semi Final", status: "upcoming" as const },
          { label: "Final", status: "upcoming" as const },
        ];
  const lastResult = hubData.recentResults.at(-1);

  function handleQuickSim() {
    if (!activeTournament) return;
    if (!equipmentReady) {
      navigate("/equipment/cues");
      return;
    }
    if (!playability?.canPlay) return;
    simulateMatch(activeTournament.id);
    navigate("/match/result");
  }

  function handlePlayLiveMatch() {
    if (!activeTournament) return;
    if (!equipmentReady) {
      navigate("/equipment/cues");
      return;
    }
    if (!tournamentEntered) {
      enterTournament(activeTournament.id);
      return;
    }
    if (!playability?.travelBooked) {
      navigate("/travel");
      return;
    }
    if ((playability?.daysUntilStart ?? 0) > 0) {
      continueToNextTournament();
      return;
    }
    navigate("/match/preview");
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:-m-6 xl:h-[calc(100vh-5.5rem)] xl:gap-2 xl:overflow-hidden xl:p-1.5">
      <header className="flex shrink-0 flex-col gap-3 rounded-xl border border-border bg-surface/85 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400">
            Tournament Hub
          </p>
          <div className="mt-1 flex min-w-0 flex-col gap-1 lg:flex-row lg:items-baseline lg:gap-3">
            <h1 className="truncate text-xl font-bold leading-tight text-white sm:text-2xl">
              {activeTournament?.name ?? "No Active Tournament"}
            </h1>
            <p className="truncate text-xs text-gray-400">
              {activeTournament?.location ?? "Location TBD"} ·{" "}
              {activeTournament?.format ?? "Format pending"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between rounded-lg border border-border bg-surface-light/60 px-4 py-2 sm:block sm:text-center">
          <p className="text-[9px] uppercase tracking-[0.16em] text-gray-500">
            Current Round
          </p>
          <p className="text-lg font-bold text-green-400">
            {activeRound ?? "Entry"}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary min-h-11 shrink-0 justify-center px-4 text-xs"
          onClick={() => navigate("/travel")}
        >
          <MapPin className="h-3.5 w-3.5" /> Travel
        </button>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-2">
        <div className="grid min-h-0 gap-3 xl:grid-rows-[12.25rem_minmax(0,1fr)] xl:gap-2">
          <section className="card flex min-h-0 flex-col overflow-hidden border-green-600/40 bg-gradient-to-r from-green-600/10 via-surface to-surface">
            <div className="card-header shrink-0">
              <h2 className="text-sm font-semibold text-white">
                Next Match{" "}
                <span className="font-normal text-gray-400">
                  · {nextMatchStageLabel}
                </span>
              </h2>
              <span
                className={`text-[9px] font-semibold uppercase tracking-[0.16em] ${playability?.canPlay ? "text-green-400" : "text-amber-400"}`}
              >
                {playability?.canPlay
                  ? "Playable"
                  : tournamentEntered
                    ? "Preparation Needed"
                    : "Entry Needed"}
              </span>
            </div>
            <div className="grid min-h-0 flex-1 gap-3 p-3 md:grid-cols-[minmax(0,1fr)_15rem] md:items-center">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-600/20 font-bold text-white">
                    {initials(gameState.player.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white sm:text-base">
                      {gameState.player.fullName}
                    </p>
                    <p className="text-[11px] text-green-400">
                      Rank{" "}
                      {playerRow?.ranking ??
                        gameState.player.amateurRanking ??
                        gameState.player.worldRanking ??
                        "-"}{" "}
                      · {gameState.player.confidence}% confidence
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-500">VS</p>
                <div className="flex min-w-0 flex-col-reverse items-center gap-2 text-center sm:flex-row sm:text-left">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white sm:text-base">
                      {nextOpponent?.playerName ?? "Opponent TBD"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Rank {nextOpponent?.ranking ?? "-"} ·{" "}
                      {nextOpponent?.nation ?? "Nation TBD"}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-red-500/60 bg-red-600/20 font-bold text-white">
                    {initials(nextOpponent?.playerName ?? "Opponent")}
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <button
                  type="button"
                  className="btn-primary min-h-11 w-full justify-center px-5 text-sm"
                  onClick={handlePlayLiveMatch}
                >
                  <Play className="h-4 w-4" /> {primaryActionLabel}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="btn-secondary min-h-10 justify-center px-3 text-xs"
                    onClick={() => navigate("/match/preview")}
                  >
                    <Search className="h-3.5 w-3.5" /> Scout
                  </button>
                  {tournamentEntered ? (
                    <button
                      type="button"
                      className="btn-secondary min-h-10 justify-center px-3 text-xs"
                      disabled={!playability?.canPlay}
                      onClick={handleQuickSim}
                    >
                      Quick Sim
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary min-h-10 justify-center px-3 text-xs"
                      onClick={() =>
                        activeTournament && skipTournament(activeTournament.id)
                      }
                    >
                      <SkipForward className="h-3.5 w-3.5" /> Skip Event
                    </button>
                  )}
                </div>
                {tournamentEntered && !playability?.canPlay ? (
                  <p className="line-clamp-2 text-center text-[9px] leading-tight text-amber-300">
                    {playability?.reason}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="card flex min-h-[22rem] flex-col overflow-hidden xl:min-h-0">
            <div className="card-header shrink-0">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Trophy className="h-3.5 w-3.5 text-green-400" /> Tournament
                  Bracket
                </h2>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Live draw · your route is highlighted
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary min-h-10 justify-center px-3 text-xs"
                onClick={() => navigate("/tournaments/draw")}
              >
                <Maximize2 className="h-3.5 w-3.5" /> Open Full Draw
              </button>
            </div>
            <div className="min-h-0 flex-1 p-2.5">
              <TournamentBracket
                rounds={drawData.bracket}
                playerName={gameState.player.fullName}
                currentRound={activeRound}
                dense
              />
            </div>
          </section>
        </div>

        <aside className="grid min-h-0 gap-3 md:grid-cols-3 xl:grid-cols-1 xl:grid-rows-[auto_auto_minmax(0,1fr)] xl:gap-2">
          <section className="card card-body">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Match Readiness
              </h2>
              <span
                className={`text-xs font-semibold ${readiness >= 65 && equipmentReady ? "text-green-400" : "text-amber-400"}`}
              >
                {readiness >= 65 && equipmentReady
                  ? "Ready"
                  : "Needs attention"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-surface-light/50 p-2">
                <span className="block text-[9px] uppercase text-gray-500">
                  Confidence
                </span>
                <b className="text-sm text-white">
                  {gameState.player.confidence}%
                </b>
              </div>
              <div className="rounded-lg bg-surface-light/50 p-2">
                <span className="block text-[9px] uppercase text-gray-500">
                  Freshness
                </span>
                <b className="text-sm text-white">{freshness}%</b>
              </div>
              <div className="rounded-lg bg-surface-light/50 p-2">
                <span className="block text-[9px] uppercase text-gray-500">
                  Equipment
                </span>
                <b
                  className={`text-sm ${equipmentReady ? "text-green-400" : "text-red-400"}`}
                >
                  {equipmentReady ? "Ready" : "Check"}
                </b>
              </div>
            </div>
          </section>

          <section className="card card-body">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Tournament Progress
              </h2>
              <span className="text-[11px] text-amber-400">
                {completedRounds.length} / {stageLabels.length} rounds
              </span>
            </div>
            <div
              className="mt-3 grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${stageLabels.length}, minmax(0, 1fr))`,
              }}
            >
              {stageLabels.map((stage) => (
                <ProgressBar
                  key={stage.label}
                  value={
                    stage.status === "completed"
                      ? 100
                      : stage.status === "current"
                        ? 32
                        : 0
                  }
                  tone={stage.status === "completed" ? "green" : "amber"}
                  compact
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between gap-1 text-[9px] text-gray-500">
              {stageLabels.map((stage) => (
                <span
                  key={stage.label}
                  className={
                    stage.status === "current"
                      ? "text-amber-400"
                      : stage.status === "completed"
                        ? "text-green-400"
                        : ""
                  }
                >
                  {stage.label
                    .replace("Quarter Final", "QF")
                    .replace("Semi Final", "SF")
                    .replace("Last 16", "L16")}
                </span>
              ))}
            </div>
          </section>

          <section className="card flex min-h-0 flex-col overflow-hidden">
            <div className="card-header shrink-0">
              <h2 className="text-sm font-semibold text-white">
                Event Details
              </h2>
            </div>
            <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-auto p-3 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Winner prize</span>
                <b className="text-green-400">
                  {formatMoney(
                    activeTournament?.winnerPrize ??
                      activeTournament?.prizeMoney ??
                      0,
                  )}
                </b>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Ranking value</span>
                <b className="text-white">
                  {activeTournament?.rankingValue ?? 0} pts
                </b>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Entry</span>
                <b
                  className={
                    tournamentEntered ? "text-green-400" : "text-amber-400"
                  }
                >
                  {tournamentEntered ? "Confirmed" : "Required"}
                </b>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-[9px] uppercase tracking-[0.16em] text-gray-500">
                  Objective
                </p>
                <p className="mt-1 text-white">
                  {hubData.objectives[0]?.label ?? "Advance through the draw"}
                </p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-[9px] uppercase tracking-[0.16em] text-gray-500">
                  Last Result
                </p>
                <p className="mt-1 text-gray-400">
                  {lastResult
                    ? `${lastResult.winner} def. ${lastResult.loser} ${lastResult.score}`
                    : "No completed matches yet"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
