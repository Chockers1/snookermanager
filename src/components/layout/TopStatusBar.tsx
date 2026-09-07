import { PlayerLink } from '../game/PlayerLink';
import {
  CalendarDays,
  CalendarClock,
  ChevronRight,
  Mail,
  Play,
  Route,
  Save,
  Settings,
  SkipForward,
  Swords,
  TrendingDown,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { Player } from "../../types/game";
import { useGame } from "../../context/useGame";
import {
  getNextEligibleTournament,
  getTournamentPlayability,
} from "../../hooks/useGameState";
import { formatMoney, formatPercent } from "../../utils/formatters";
import { tournamentCommitmentConflict } from "../../game/careerDepth/commitments";

type TopStatusBarProps = {
  player: Player;
};

export function TopStatusBar({ player }: TopStatusBarProps) {
  const {
    gameState,
    continueToNextTournament,
    finishSeason,
    enterTournament,
    skipTournament,
  } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const [careerMenuOpen, setCareerMenuOpen] = useState(false);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const isDashboard = location.pathname === "/";
  const playerRankingRow = gameState.rankings.find(
    (row) => row.playerName === player.fullName,
  );
  const currentRanking =
    playerRankingRow?.ranking ?? player.worldRanking ?? player.amateurRanking;
  const rankingMovement = playerRankingRow?.movement ?? 0;
  const reviewPending = Boolean(gameState.seasonReview?.pending);
  const nextEvent = reviewPending ? undefined : getNextEligibleTournament(gameState);
  const enteredEvent = nextEvent?.status === "Entered" ? nextEvent : undefined;
  const entryConflict = nextEvent && !enteredEvent ? tournamentCommitmentConflict(gameState, nextEvent) : null;
  const tournamentPlayability = enteredEvent
    ? getTournamentPlayability(gameState, enteredEvent)
    : null;
  const canPlayTournament = tournamentPlayability?.canPlay ?? false;
  const hasLiveMatchInProgress = gameState.liveMatch?.status === "In Progress";
  const upcomingOpponent = gameState.tournamentProgress.draw
    .filter((round) => gameState.tournamentProgress.tournamentId === enteredEvent?.id && round.label === gameState.tournamentProgress.currentRound)
    .flatMap((round) => round.matches)
    .find(
      (match) =>
        match.top.name === player.fullName ||
        match.bottom.name === player.fullName,
    );
  const opponentName = upcomingOpponent
    ? upcomingOpponent.top.name === player.fullName
      ? upcomingOpponent.bottom.name
      : upcomingOpponent.top.name
    : "Opponent TBD";
  const unreadInboxCount = gameState.inbox.filter(
    (message) => !message.read,
  ).length;
  const recentForm = player.form.slice(-10);
  const formPercent =
    recentForm.length > 0
      ? Math.round(
          (recentForm.filter((result) => result === "W").length /
            recentForm.length) *
            100,
        )
      : 0;
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
    : (enteredEvent && gameState.tournamentProgress.tournamentId === enteredEvent.id ? gameState.tournamentProgress.currentRound ?? "Entry" : "Entry");
  const primaryEventActionLabel = hasLiveMatchInProgress
    ? "Resume Live Match"
    : enteredEvent
      ? canPlayTournament
        ? "Play Next Match"
        : !tournamentPlayability?.travelBooked
          ? "Book Travel"
          : !tournamentPlayability?.preparationConfirmed
            ? "Prepare Tournament"
            : (tournamentPlayability?.daysUntilStart ?? 0) > 0
              ? "Advance to Tournament"
              : "Open Tournament Hub"
      : nextEvent
        ? entryConflict ? "Manage Calendar Clash" : "Enter Tournament"
        : reviewPending ? "Open Season Review" : "Finish Season";

  function handlePrimaryEventAction() {
    setEventMenuOpen(false);
    if (hasLiveMatchInProgress) {
      navigate("/match/live");
      return;
    }

    if (enteredEvent) {
      if (canPlayTournament) navigate("/match/preview");
      else if (!tournamentPlayability?.travelBooked) navigate("/travel");
      else if (!tournamentPlayability?.preparationConfirmed)
        navigate("/tournament/preparation");
      else if ((tournamentPlayability?.daysUntilStart ?? 0) > 0) {
        continueToNextTournament();
        navigate("/tournaments/hub");
      } else navigate("/tournaments/hub");
      return;
    }

    if (nextEvent) {
      if (entryConflict) {
        navigate("/calendar?commitments=1");
        return;
      }
      enterTournament(nextEvent.id);
      navigate("/tournaments/hub");
      return;
    }

    finishSeason();
    navigate("/season-review");
  }

  function handleSecondaryEventAction() {
    setEventMenuOpen(false);
    if (enteredEvent || hasLiveMatchInProgress) {
      navigate("/tournaments/hub");
      return;
    }

    if (nextEvent) skipTournament(nextEvent.id);
    else navigate("/calendar");
  }

  return (
    <header
      className={`relative z-30 flex min-w-0 shrink-0 items-center border-b border-border bg-sidebar pl-14 pr-1 sm:pr-2 xl:px-4 ${isDashboard ? "h-[68px]" : "h-14"}`}
    >
      <div
        className={`flex min-w-0 shrink items-center gap-2 border-r border-border pr-2 sm:pr-4 ${isDashboard ? "sm:shrink-0 sm:w-44 2xl:w-56" : "sm:shrink-0"}`}
      >
        <button
          type="button"
          onClick={() => navigate("/career/progression")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-white transition hover:bg-surface-light"
        >
          {player.firstName[0]}
        </button>
        <button
          type="button"
          onClick={() => navigate("/career/progression")}
          className="min-w-0 text-left"
        >
          <div className="flex items-center gap-1.5">
            <span
              title={player.fullName}
              className={`truncate text-xs font-semibold text-white ${isDashboard ? "max-w-[110px] sm:max-w-[128px] xl:max-w-[158px] 2xl:max-w-[190px]" : "max-w-[100px] sm:max-w-[120px]"}`}
            >
              {player.fullName}
            </span>
            <span className="hidden shrink-0 text-[10px] text-gray-500 sm:inline">
              {player.nationality}
            </span>
          </div>
          <p
            title={player.careerStage}
            className="hidden max-w-full truncate text-[10px] text-gray-500 sm:block"
          >
            {player.careerStage}
          </p>
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate("/rankings")}
        className="flex min-h-11 shrink-0 items-center gap-1 border-r border-border px-2 transition hover:bg-white/5 sm:px-3"
      >
        <span className="hidden whitespace-nowrap text-[9px] uppercase text-gray-500 sm:inline">
          {player.rankingLabel}
        </span>
        <span className="text-base font-bold text-white">
          {currentRanking ?? "-"}
        </span>
        {rankingMovement > 0 ? (
          <span className="flex items-center text-[10px] text-green-400">
            <TrendingUp className="h-2.5 w-2.5" />
            <span className="ml-0.5">{rankingMovement}</span>
          </span>
        ) : rankingMovement < 0 ? (
          <span className="flex items-center text-[10px] text-red-400">
            <TrendingDown className="h-2.5 w-2.5" />
            <span className="ml-0.5">{Math.abs(rankingMovement)}</span>
          </span>
        ) : null}
      </button>

      <button
        type="button"
        onClick={() => navigate("/career/stats")}
        className={`hidden min-h-11 shrink-0 items-center gap-1.5 border-r border-border px-3 transition hover:bg-white/5 ${isDashboard ? "2xl:flex" : "xl:flex"}`}
      >
        <span className="whitespace-nowrap text-[9px] uppercase text-gray-500">
          Form
        </span>
        <span className="text-xs font-bold text-white">{formPercent}%</span>
      </button>

      <button
        type="button"
        onClick={() => navigate("/mental")}
        className={`hidden min-h-11 shrink-0 items-center gap-1.5 border-r border-border px-3 transition hover:bg-white/5 ${isDashboard ? "2xl:flex" : "xl:flex"}`}
      >
        <span className="whitespace-nowrap text-[9px] uppercase text-gray-500">
          Confidence
        </span>
        <span className="text-xs font-bold text-white">
          {formatPercent(player.confidence)}
        </span>
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${player.confidence}%` }}
          />
        </div>
      </button>

      <button
        type="button"
        onClick={() => navigate("/finance")}
        className="hidden min-h-11 shrink-0 items-center gap-1.5 border-r border-border px-3 transition hover:bg-white/5 sm:flex"
      >
        <span className="whitespace-nowrap text-[9px] uppercase text-gray-500">
          Funds
        </span>
        <span className="whitespace-nowrap text-xs font-bold text-white">
          {formatMoney(player.cash)}
        </span>
        <span
          className={`whitespace-nowrap text-[10px] ${player.cashFlow >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {player.cashFlow >= 0 ? "+" : ""}
          {formatMoney(player.cashFlow)}
        </span>
      </button>

      <button
        type="button"
        onClick={() => navigate("/tournaments/hub")}
        className={`hidden min-w-0 flex-1 items-center gap-1.5 px-3 text-left transition hover:bg-white/5 md:flex ${isDashboard ? "border-r border-border" : "shrink"}`}
      >
        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-green-400" />
        <span className="shrink-0 whitespace-nowrap text-[9px] uppercase text-gray-500">
          Next
        </span>
        <div className="min-w-0 flex-1">
          <p
            title={nextEvent?.name ?? (reviewPending ? "Season review ready" : "Season run-in")}
            className="truncate text-[11px] font-medium text-white"
          >
            {nextEvent?.name ?? (reviewPending ? "Season review ready" : "Season run-in")}
          </p>
          <p className="truncate text-[9px] text-gray-500">
            {isDashboard
              ? nextEvent ? `${eventStageLabel} · ${nextEvent.format} · ${eventStatusLabel}` : "Finish the season to review and start next year"
              : (nextEvent?.format ?? "Review and continue into next season")}
          </p>
        </div>
      </button>

      {isDashboard ? (
        <>
          <div className="hidden min-h-11 w-32 shrink-0 flex-col justify-center border-r border-border px-3 2xl:flex">
            <span className="text-[9px] uppercase text-gray-500">
              Required action
            </span>
            <span
              title={primaryEventActionLabel}
              className="truncate text-[11px] font-semibold text-white"
            >
              {primaryEventActionLabel}
            </span>
          </div>
          <div className="hidden min-h-11 w-36 shrink-0 flex-col justify-center border-r border-border px-3 min-[1800px]:flex">
            <span className="text-[9px] uppercase text-gray-500">Opponent</span>
            <span
              title={opponentName}
              className="truncate text-[11px] font-semibold text-white"
            >
              <PlayerLink name={opponentName}/>
            </span>
          </div>
          <div className="hidden shrink-0 items-center gap-2 px-2 xl:flex">
            <button
              type="button"
              onClick={handleSecondaryEventAction}
              aria-label={enteredEvent || hasLiveMatchInProgress ? "Tournament Hub" : nextEvent ? "Skip This Event" : "View Calendar"}
              title={enteredEvent || hasLiveMatchInProgress ? "Tournament Hub" : nextEvent ? "Skip This Event" : "View Calendar"}
              className="btn-secondary h-9 whitespace-nowrap px-3 text-[11px]"
            >
              {enteredEvent || hasLiveMatchInProgress ? (
                <Route className="h-3.5 w-3.5" />
              ) : nextEvent ? (
                <SkipForward className="h-3.5 w-3.5" />
              ) : (
                <CalendarDays className="h-3.5 w-3.5" />
              )}
              <span className="hidden 2xl:inline">
                {enteredEvent || hasLiveMatchInProgress
                  ? "Tournament Hub"
                  : nextEvent
                    ? "Skip This Event"
                    : "View Calendar"}
              </span>
            </button>
            <button
              type="button"
              onClick={handlePrimaryEventAction}
              title={primaryEventActionLabel}
              aria-label={primaryEventActionLabel}
              className="btn-primary h-9 whitespace-nowrap px-3 text-[11px]"
            >
              {hasLiveMatchInProgress || canPlayTournament ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Swords className="h-3.5 w-3.5" />
              )}
              <span>{primaryEventActionLabel}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative ml-auto shrink-0 xl:hidden">
            <button
              type="button"
              aria-label="Tournament next step"
              aria-expanded={eventMenuOpen}
              onClick={() => setEventMenuOpen((open) => !open)}
              className="grid h-11 w-11 place-items-center rounded-lg text-green-400 hover:bg-white/5"
            >
              <Swords className="h-5 w-5" />
            </button>
            {eventMenuOpen ? (
              <div className="absolute right-0 top-12 z-50 w-56 max-w-[calc(100vw-6rem)] space-y-2 rounded-lg border border-border bg-sidebar p-3 shadow-2xl">
                <p className="break-words text-xs font-semibold text-white">{nextEvent?.name ?? (reviewPending ? "Season review ready" : "Season run-in")}</p>
                <p className="text-[10px] text-gray-400">{eventStatusLabel}</p>
                <button type="button" onClick={handlePrimaryEventAction} className="btn-primary min-h-11 w-full text-xs">{primaryEventActionLabel}</button>
                <button type="button" onClick={handleSecondaryEventAction} className="btn-secondary min-h-11 w-full text-xs">{enteredEvent || hasLiveMatchInProgress ? "Tournament Hub" : nextEvent ? "Skip This Event" : "View Calendar"}</button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="ml-auto flex shrink-0 items-center gap-0 pl-1 sm:gap-1 sm:pl-2">
        <button
          type="button"
          aria-label={`Open inbox (${unreadInboxCount} unread messages)`}
          title="Inbox"
          onClick={() => navigate("/inbox")}
          className="relative grid h-11 w-10 place-items-center text-gray-400 transition-colors hover:text-white sm:w-11"
        >
          <Mail aria-hidden="true" className="h-4 w-4" />
          {unreadInboxCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-green-600 px-1 text-[8px] font-bold text-white">
              {unreadInboxCount}
            </span>
          ) : null}
        </button>
        <div className="relative" onKeyDown={event => { if (event.key === "Escape") { setCareerMenuOpen(false); event.currentTarget.querySelector("button")?.focus(); } }}>
          <button
            type="button"
            aria-label="Career and save options"
            aria-expanded={careerMenuOpen}
            title="Career and saves"
            onClick={() => setCareerMenuOpen((open) => !open)}
            className="grid h-11 w-10 place-items-center text-gray-400 transition-colors hover:text-white sm:w-11"
          >
            <Settings aria-hidden="true" className="h-4 w-4" />
          </button>
          {careerMenuOpen ? (
            <div className="absolute right-0 top-11 z-50 w-56 rounded-lg border border-border bg-sidebar p-2 shadow-2xl shadow-black/50">
              <div className="border-b border-border px-2 pb-2 pt-1">
                <p className="text-xs font-semibold text-white">
                  Career &amp; saves
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Manage the active career outside the game navigation.
                </p>
              </div>
              <Link to="/settings" onClick={() => setCareerMenuOpen(false)} className="mt-1 flex min-h-10 items-center gap-3 rounded-md px-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white"><Settings className="h-4 w-4 text-green-400" /> Settings &amp; help</Link>
              <Link
                to="/saves"
                onClick={() => setCareerMenuOpen(false)}
                className="mt-1 flex min-h-10 items-center gap-3 rounded-md px-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <Save className="h-4 w-4 text-green-400" /> Save Manager
              </Link>
              <Link
                to="/new-career"
                onClick={() => setCareerMenuOpen(false)}
                className="flex min-h-10 items-center gap-3 rounded-md px-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <UserPlus className="h-4 w-4 text-green-400" /> Start New Career
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
