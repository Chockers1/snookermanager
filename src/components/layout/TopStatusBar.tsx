import {
  CalendarClock,
  Mail,
  Save,
  Settings,
  TrendingDown,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { Player } from "../../types/game";
import { useGame } from "../../context/useGame";
import { getNextEligibleTournament } from "../../hooks/useGameState";
import { formatMoney } from "../../utils/formatters";

type TopStatusBarProps = {
  player: Player;
};

export function TopStatusBar({ player }: TopStatusBarProps) {
  const { gameState } = useGame();
  const navigate = useNavigate();
  const [careerMenuOpen, setCareerMenuOpen] = useState(false);
  const playerRankingRow = gameState.rankings.find(
    (row) => row.playerName === player.fullName,
  );
  const currentRanking =
    playerRankingRow?.ranking ?? player.worldRanking ?? player.amateurRanking;
  const rankingMovement = playerRankingRow?.movement ?? 0;
  const nextEvent = getNextEligibleTournament(gameState);
  const unreadInboxCount = gameState.inbox.filter(
    (message) => !message.read,
  ).length;
  const recentForm = player.form.slice(0, 10);
  const formPercent =
    recentForm.length > 0
      ? Math.round(
          (recentForm.filter((result) => result === "W").length /
            recentForm.length) *
            100,
        )
      : 0;

  return (
    <header className="relative z-30 flex h-14 min-w-0 shrink-0 items-center border-b border-border bg-sidebar pl-14 pr-1 sm:pr-2 xl:px-4">
      <div className="flex min-w-0 shrink items-center gap-2 border-r border-border pr-2 sm:shrink-0 sm:pr-4">
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
            <span className="max-w-[100px] truncate text-xs font-semibold text-white sm:max-w-[120px]">
              {player.fullName}
            </span>
            <span className="hidden shrink-0 text-[10px] text-gray-500 sm:inline">
              {player.nationality}
            </span>
          </div>
          <p className="hidden max-w-[140px] truncate text-[10px] text-gray-500 sm:block">
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
        className="hidden min-h-11 shrink-0 items-center gap-1.5 border-r border-border px-3 transition hover:bg-white/5 lg:flex"
      >
        <span className="whitespace-nowrap text-[9px] uppercase text-gray-500">
          Form
        </span>
        <span className="text-xs font-bold text-white">{formPercent}%</span>
      </button>

      <button
        type="button"
        onClick={() => navigate("/mental")}
        className="hidden min-h-11 shrink-0 items-center gap-1.5 border-r border-border px-3 transition hover:bg-white/5 lg:flex"
      >
        <span className="whitespace-nowrap text-[9px] uppercase text-gray-500">
          Confidence
        </span>
        <span className="text-xs font-bold text-white">
          {player.confidence}%
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
        className="hidden min-w-0 shrink items-center gap-1.5 px-3 text-left transition hover:bg-white/5 md:flex"
      >
        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-green-400" />
        <span className="shrink-0 whitespace-nowrap text-[9px] uppercase text-gray-500">
          Next
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-white">
            {nextEvent?.name ?? player.nextEvent}
          </p>
          <p className="truncate text-[9px] text-gray-500">
            {nextEvent?.format ?? "No event scheduled"}
          </p>
        </div>
      </button>

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
        <div className="relative">
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
