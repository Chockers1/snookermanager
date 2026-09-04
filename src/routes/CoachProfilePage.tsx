import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import {
  getCoachAvailability,
  getCoachContractOptions,
} from "../utils/coachMarket";
import { formatMoney } from "../utils/formatters";

function getPlayerRanking(
  fullName: string,
  rankingRows: { playerName: string; ranking: number }[],
  fallbackRanking?: number | null,
) {
  return (
    rankingRows.find((row) => row.playerName === fullName)?.ranking ??
    fallbackRanking ??
    0
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function CoachProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { gameState, hireCoach } = useGame();
  const coach =
    gameState.coaches.find((entry) => entry.id === id) ?? gameState.coaches[0];
  const ranking = getPlayerRanking(
    gameState.player.fullName,
    gameState.rankings,
    gameState.player.amateurRanking,
  );
  const availability = getCoachAvailability(
    coach,
    ranking,
    gameState.player.reputation,
  );
  const contractOptions = getCoachContractOptions(coach);
  const [selectedContractLabel, setSelectedContractLabel] = useState(
    contractOptions.find((option) => option.selected)?.label ??
      contractOptions[0]?.label ??
      "",
  );
  const [shortlisted, setShortlisted] = useState(false);
  const selectedOption =
    contractOptions.find((option) => option.label === selectedContractLabel) ??
    contractOptions[0];
  const ratings = [
    ["Technical Knowledge", coach.technical],
    ["Tactical Knowledge", coach.tactical],
    ["Mental Support", coach.mental],
    ["Motivation", coach.motivation],
    ["Compatibility", coach.compatibility],
  ] as const;
  const predictedImpact = [
    {
      label: "Long Potting",
      value: Math.max(1, Math.round(coach.technical / 18)),
    },
    {
      label: "Safety Play",
      value: Math.max(1, Math.round(coach.tactical / 18)),
    },
    { label: "Focus", value: Math.max(1, Math.round(coach.mental / 18)) },
    { label: "Stamina", value: Math.max(1, Math.round(coach.motivation / 20)) },
  ];

  function handleHireCoach() {
    if (!availability.available) return;
    hireCoach(coach.id, selectedOption?.label);
    navigate("/staff/coaches");
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">
            Staff
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Coach Profile</h1>
          <p className="mt-1 text-sm text-gray-400">
            Detailed coach decision screen with strengths, contract options, and
            advisor guidance.
          </p>
        </div>
        <span
          className={
            availability.available
              ? "rounded bg-green-600/20 px-2 py-1 text-[10px] text-green-400"
              : "rounded bg-red-600/20 px-2 py-1 text-[10px] text-red-400"
          }
        >
          {availability.available ? "Available Now" : "Stage Locked"}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="card card-body">
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="flex h-[180px] items-center justify-center rounded-xl border border-border bg-surface-light text-4xl text-gray-500">
                {initials(coach.name)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-white sm:text-4xl">
                    {coach.name}
                  </h2>
                  <span className="rounded bg-green-600/20 px-2 py-1 text-[10px] text-green-400">
                    {coach.compatibility >= 75
                      ? "Strong Fit"
                      : "Specialist Fit"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-green-400">
                  Specialism: {coach.specialism}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-400 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] uppercase text-gray-500">
                      Coach Type
                    </p>
                    <p className="mt-1 text-white">{coach.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500">
                      Reputation
                    </p>
                    <p className="mt-1 text-white">{coach.reputation}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500">Level</p>
                    <p className="mt-1 text-white">{coach.level}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500">
                      Compatibility
                    </p>
                    <p className="mt-1 text-white">{coach.compatibility}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500">
                      Weekly Cost
                    </p>
                    <p className="mt-1 text-white">
                      {formatMoney(coach.weeklyCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500">
                      Working Style
                    </p>
                    <p className="mt-1 text-white">
                      {coach.motivation >= 80
                        ? "Demanding Professional"
                        : coach.mental >= 75
                          ? "Measured Mentor"
                          : "Development Specialist"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="card card-body">
              <h3 className="mb-3 text-xs font-semibold text-white">
                Coach Attributes
              </h3>
              <div className="space-y-3">
                {ratings.map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white">{value}</span>
                    </div>
                    <ProgressBar value={value} compact />
                  </div>
                ))}
              </div>
            </div>
            <div className="card card-body">
              <h3 className="mb-3 text-xs font-semibold text-white">
                Predicted Impact
              </h3>
              <div className="space-y-3">
                {predictedImpact.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-green-400">+{item.value}</span>
                    </div>
                    <ProgressBar value={item.value * 12} compact />
                  </div>
                ))}
              </div>
            </div>
            <div className="card card-body">
              <h3 className="mb-3 text-xs font-semibold text-white">
                Advisor Recommendation
              </h3>
              <p className="text-xs leading-relaxed text-gray-400">
                {coach.compatibility >= 75
                  ? "This is a strong fit if the weekly budget can absorb the staff cost."
                  : "Useful specialist coach, but best if the current weakness matches the specialism."}
              </p>
              <p className="mt-4 text-lg font-semibold text-green-400">
                Recommendation: {availability.available ? "Hire" : "Monitor"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card card-body">
              <h3 className="mb-3 text-xs font-semibold text-white">
                Strengths
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                {coach.strengths.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-green-400">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card card-body">
              <h3 className="mb-3 text-xs font-semibold text-white">
                Weaknesses
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                {coach.weaknesses.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-red-400">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">
              Contract Options
            </h3>
            <div className="space-y-2">
              {contractOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setSelectedContractLabel(option.label)}
                  className={`w-full rounded border p-3 text-left text-xs ${selectedContractLabel === option.label ? "border-green-600/30 bg-green-600/10" : "border-border bg-surface-light/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">
                      {option.label}
                    </span>
                    <span className="text-green-400">
                      {formatMoney(option.totalCost)}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-400">
                    {formatMoney(option.weeklyCost)} per week
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded border border-amber-600/30 bg-amber-600/10 p-3 text-xs text-amber-100">
              Selected contract: {selectedContractLabel}.{" "}
              {availability.available
                ? "Available to sign now if the budget works."
                : availability.reason}
            </div>
          </div>
          <div className="card card-body text-center">
            <Star className="mx-auto h-5 w-5 fill-amber-400 text-amber-400" />
            <p className="metric-label mt-2">Style Fit</p>
            <p className="mt-1 text-3xl font-bold text-white">
              {coach.compatibility}%
            </p>
            <ProgressBar value={coach.compatibility} compact />
          </div>
          <div className="card card-body space-y-3">
            <Link
              to="/staff/coaches"
              className="btn-secondary w-full justify-center text-xs"
            >
              Back to Market
            </Link>
            <button
              type="button"
              className="btn-primary w-full justify-center text-xs"
              disabled={!availability.available}
              onClick={handleHireCoach}
            >
              Hire Coach <ChevronRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              className="btn-secondary w-full justify-center text-xs"
              onClick={() =>
                setSelectedContractLabel(
                  contractOptions.at(-1)?.label ?? selectedContractLabel,
                )
              }
            >
              Negotiate Contract
            </button>
            <button
              type="button"
              className="btn-secondary w-full justify-center text-xs"
              onClick={() => setShortlisted((value) => !value)}
            >
              {shortlisted ? "Remove From Shortlist" : "Add to Shortlist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
