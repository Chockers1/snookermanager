import { useState } from "react";
import { Check, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import {
  getCoachAffordabilityForecast,
  getCoachAvailability,
  getCoachContractOptions,
  getCoachPriceBand,
  getCoachProjectedImpact,
  getCoachSlotLimit,
  type CoachPriceBand,
} from "../utils/coachMarket";
import { formatMoney } from "../utils/formatters";

const COACH_SLOT_NAMES = ["Lead Coach", "Specialist Coach"] as const;
const PRICE_BANDS: { key: CoachPriceBand; label: string }[] = [
  { key: "All", label: "All prices" },
  { key: "Budget", label: "Budget · under £250" },
  { key: "Value", label: "Value · £250–£450" },
  { key: "Premium", label: "Premium · £450–£700" },
  { key: "Elite", label: "Elite · £700+" },
  { key: "Short-term", label: "Short-term specialists" },
];

function getPlayerRanking(
  fullName: string,
  rows: { playerName: string; ranking: number }[],
  fallback?: number | null,
) {
  return (
    rows.find((row) => row.playerName === fullName)?.ranking ?? fallback ?? 0
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function CoachMarketPage() {
  const {
    gameState,
    hireCoach,
    fireCoach,
    extendCoachContract,
    negotiateCoachContract,
  } = useGame();
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"fit" | "overall" | "cost">("fit");
  const [typeFilter, setTypeFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available"
  >("available");
  const [priceBand, setPriceBand] = useState<CoachPriceBand>("All");
  const [selectedCoachId, setSelectedCoachId] = useState(
    gameState.coaches[0]?.id ?? "",
  );
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedContractLabel, setSelectedContractLabel] =
    useState("8 Week Trial");
  const [negotiationTone, setNegotiationTone] = useState<
    "Conservative" | "Balanced" | "Ambitious"
  >("Balanced");

  const ranking = getPlayerRanking(
    gameState.player.fullName,
    gameState.rankings,
    gameState.player.amateurRanking ?? gameState.player.worldRanking,
  );
  const slotLimit = getCoachSlotLimit(ranking, gameState.player.reputation);
  const activeContracts = gameState.coachContracts.map((contract) => ({
    ...contract,
    coach: gameState.coaches.find((coach) => coach.id === contract.coachId),
  }));
  const openSlot =
    COACH_SLOT_NAMES.slice(0, slotLimit).find(
      (slot) =>
        !gameState.coachContracts.some((contract) => contract.slot === slot),
    ) ?? null;
  const totalCoachCost = gameState.coachContracts.reduce(
    (sum, contract) => sum + contract.weeklyCost,
    0,
  );
  const specialisms = [
    "All",
    ...Array.from(new Set(gameState.coaches.map((coach) => coach.type))),
  ];
  const visibleCoaches = gameState.coaches
    .filter((coach) => typeFilter === "All" || coach.type === typeFilter)
    .filter(
      (coach) =>
        priceBand === "All" ||
        (priceBand === "Short-term"
          ? coach.level === "Low" && coach.weeklyCost <= 250
          : getCoachPriceBand(coach) === priceBand),
    )
    .filter(
      (coach) =>
        availabilityFilter === "all" ||
        getCoachAvailability(coach, ranking, gameState.player.reputation)
          .available,
    )
    .filter((coach) =>
      `${coach.name} ${coach.type} ${coach.specialism}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    )
    .slice()
    .sort((left, right) =>
      sortMode === "cost"
        ? left.weeklyCost - right.weeklyCost
        : sortMode === "fit"
          ? right.compatibility - left.compatibility
          : right.technical +
            right.tactical +
            right.mental +
            right.motivation -
            (left.technical + left.tactical + left.mental + left.motivation),
    );

  const selectedCoach =
    gameState.coaches.find((coach) => coach.id === selectedCoachId) ??
    visibleCoaches[0] ??
    gameState.coaches[0];
  const selectedContract =
    activeContracts.find(
      (contract) => contract.coachId === selectedCoach?.id,
    ) ?? null;
  const selectedOptions = selectedCoach
    ? getCoachContractOptions(selectedCoach)
    : [];
  const selectedOption =
    selectedOptions.find((option) => option.label === selectedContractLabel) ??
    selectedOptions[0];
  const availability = selectedCoach
    ? getCoachAvailability(selectedCoach, ranking, gameState.player.reputation)
    : { available: false, reason: "No coach selected" };
  const forecast = getCoachAffordabilityForecast(
    gameState.player.cash,
    gameState.finance.cashFlow + (selectedContract?.weeklyCost ?? 0),
    totalCoachCost - (selectedContract?.weeklyCost ?? 0),
    selectedOption,
  );
  const alreadySigned = Boolean(selectedContract);
  const canHire = Boolean(
    selectedCoach &&
    availability.available &&
    openSlot &&
    !alreadySigned &&
    forecast.affordable,
  );
  const allAvailableCount = gameState.coaches.filter(
    (coach) =>
      getCoachAvailability(coach, ranking, gameState.player.reputation)
        .available,
  ).length;
  const overall = selectedCoach
    ? Math.round(
        (selectedCoach.technical +
          selectedCoach.tactical +
          selectedCoach.mental +
          selectedCoach.motivation) /
          4,
      )
    : 0;
  const impact = selectedCoach ? getCoachProjectedImpact(selectedCoach) : null;
  const comparisonCoaches = compareIds
    .map((id) => gameState.coaches.find((coach) => coach.id === id))
    .filter((coach): coach is NonNullable<typeof coach> => Boolean(coach));

  function toggleCompare(coachId: string) {
    setCompareIds((current) =>
      current.includes(coachId)
        ? current.filter((id) => id !== coachId)
        : current.length < 3
          ? [...current, coachId]
          : current,
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:-m-6 xl:h-[calc(100vh-5.5rem)] xl:gap-2 xl:overflow-hidden xl:p-1.5">
      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface/85 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400">
            Staff
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Coach Market</h1>
          <p className="mt-1 text-xs text-gray-400">
            Build a coaching team that fits your goals and budget.
          </p>
        </div>
        <div className="ml-auto grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Coaches", gameState.coaches.length],
            ["Available", allAvailableCount],
            ["Open slots", Math.max(0, slotLimit - activeContracts.length)],
            ["Staff spend", `${formatMoney(totalCoachCost)}/wk`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="min-w-[88px] rounded-lg bg-surface-light px-3 py-2 text-center"
            >
              <span className="block text-[9px] uppercase text-gray-500">
                {label}
              </span>
              <b className="text-sm text-white">{value}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {COACH_SLOT_NAMES.map((slot, index) => {
          const contract = activeContracts.find((entry) => entry.slot === slot);
          const unlocked = index < slotLimit;
          return (
            <button
              key={slot}
              type="button"
              disabled={!contract}
              onClick={() => contract && setSelectedCoachId(contract.coachId)}
              className={`card min-h-[72px] p-3 text-left ${contract ? "border-green-600/30 bg-green-600/10" : unlocked ? "border-dashed" : "border-red-600/20 opacity-60"}`}
            >
              <p className="metric-label">{slot}</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">
                {contract?.coach?.name ?? (unlocked ? "Open slot" : "Locked")}
              </p>
              <p className="mt-1 truncate text-[10px] text-gray-400">
                {contract
                  ? `${contract.weeksRemaining} weeks · ${formatMoney(contract.weeklyCost)}/wk`
                  : unlocked
                    ? "Ready for a new appointment"
                    : "Raise ranking or reputation"}
              </p>
            </button>
          );
        })}
        <div className="card min-h-[72px] p-3">
          <div className="flex justify-between">
            <p className="metric-label">Budget headroom</p>
            <span
              className={`text-[10px] ${gameState.finance.cashFlow >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {gameState.finance.cashFlow >= 0 ? "Healthy" : "Under pressure"}
            </span>
          </div>
          <p className="mt-1 text-lg font-bold text-white">
            {formatMoney(Math.max(0, gameState.finance.cashFlow))}/wk
          </p>
          <p className="text-[10px] text-gray-400">
            Current cash flow after staff commitments
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface/85 p-3">
        <div className="flex flex-col gap-2 lg:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              aria-label="Search coaches"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search coach or specialism"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-white outline-none focus:border-green-500/50"
            />
          </label>
          <select
            aria-label="Specialism"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-white"
          >
            {specialisms.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All specialisms" : item}
              </option>
            ))}
          </select>
          <select
            aria-label="Availability"
            value={availabilityFilter}
            onChange={(event) =>
              setAvailabilityFilter(event.target.value as "all" | "available")
            }
            className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-white"
          >
            <option value="available">Available now</option>
            <option value="all">All availability</option>
          </select>
          <select
            aria-label="Sort coaches"
            value={sortMode}
            onChange={(event) =>
              setSortMode(event.target.value as typeof sortMode)
            }
            className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-white"
          >
            <option value="fit">Best fit</option>
            <option value="overall">Overall rating</option>
            <option value="cost">Lowest cost</option>
          </select>
          <button
            type="button"
            disabled={compareIds.length < 2}
            onClick={() => setShowComparison(true)}
            className="btn-secondary h-9 justify-center px-3 text-xs"
          >
            <Users className="h-3.5 w-3.5" /> Compare {compareIds.length}/3
          </button>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
          {PRICE_BANDS.map((band) => (
            <button
              key={band.key}
              type="button"
              onClick={() => setPriceBand(band.key)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[10px] ${priceBand === band.key ? "border-green-500 bg-green-500 text-gray-950" : "border-border text-gray-300 hover:border-green-500/40"}`}
            >
              {band.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-2">
        <section className="card flex min-h-[420px] flex-col overflow-hidden xl:col-span-7 xl:min-h-0">
          <div className="card-header">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Available Coaches
              </h2>
              <p className="text-[10px] text-gray-400">
                {visibleCoaches.length} of {gameState.coaches.length} shown
              </p>
            </div>
            <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto p-2 sm:grid-cols-2 scrollbar-thin">
            {visibleCoaches.map((coach) => {
              const available = getCoachAvailability(
                coach,
                ranking,
                gameState.player.reputation,
              );
              const cardImpact = getCoachProjectedImpact(coach);
              const compared = compareIds.includes(coach.id);
              const strongest = Math.max(
                coach.technical,
                coach.tactical,
                coach.mental,
                coach.motivation,
              );
              return (
                <article
                  key={coach.id}
                  className={`rounded-lg border p-3 text-left transition-colors ${selectedCoach?.id === coach.id ? "border-green-500 bg-green-500/10" : "border-border bg-surface-light/55 hover:border-green-500/35"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCoachId(coach.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold text-white">
                        {coach.name}
                      </p>
                      <p className="truncate text-[10px] text-green-300">
                        {coach.type} · {coach.specialism}
                      </p>
                    </button>
                    <label className="flex shrink-0 items-center gap-1 text-[9px] text-gray-400">
                      <input
                        type="checkbox"
                        checked={compared}
                        onChange={() => toggleCompare(coach.id)}
                      />{" "}
                      Compare
                    </label>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                    <div>
                      <b className="block text-sm text-white">
                        {coach.compatibility}%
                      </b>
                      <span className="text-[8px] text-gray-500">FIT</span>
                    </div>
                    <div>
                      <b className="block text-sm text-white">{strongest}</b>
                      <span className="text-[8px] text-gray-500">BEST</span>
                    </div>
                    <div>
                      <b className="block text-sm text-white">
                        +{cardImpact.primaryGain}
                      </b>
                      <span className="text-[8px] text-gray-500">IMPACT</span>
                    </div>
                    <div>
                      <b className="block text-sm text-green-300">
                        {formatMoney(coach.weeklyCost)}
                      </b>
                      <span className="text-[8px] text-gray-500">PER WEEK</span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-[9px]">
                    <span className="rounded bg-background/70 px-2 py-1 text-gray-300">
                      {getCoachPriceBand(coach)}
                    </span>
                    <span
                      className={
                        available.available
                          ? "text-green-400"
                          : "text-amber-400"
                      }
                    >
                      {available.available ? "Available now" : "Locked"}
                    </span>
                  </div>
                </article>
              );
            })}
            {visibleCoaches.length === 0 ? (
              <div className="col-span-full grid place-items-center py-12 text-sm text-gray-400">
                No coaches match these filters.
              </div>
            ) : null}
          </div>
        </section>

        {selectedCoach ? (
          <aside className="grid min-h-0 gap-2 xl:col-span-5 xl:grid-rows-[minmax(0,1fr)_230px]">
            <section className="card flex min-h-[360px] flex-col overflow-hidden border-green-500/30 xl:min-h-0">
              <div className="card-header">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-500/15 font-bold text-green-300">
                    {initials(selectedCoach.name)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-white">
                      {selectedCoach.name}
                    </h2>
                    <p className="truncate text-[10px] text-gray-400">
                      {selectedCoach.type} · {selectedCoach.specialism} ·{" "}
                      {selectedCoach.level}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[9px] ${availability.available ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}
                >
                  {availability.available ? "Available" : "Locked"}
                </span>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 sm:grid-cols-2 scrollbar-thin">
                <div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      ["Player fit", `${selectedCoach.compatibility}%`],
                      ["Overall", overall],
                      ["Base/wk", formatMoney(selectedCoach.weeklyCost)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded bg-surface-light p-2">
                        <b className="block text-sm text-white">{value}</b>
                        <span className="text-[8px] uppercase text-gray-500">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mb-2 mt-3 metric-label">Ratings</p>
                  <div className="space-y-2">
                    {[
                      ["Technical", selectedCoach.technical],
                      ["Tactical", selectedCoach.tactical],
                      ["Mental", selectedCoach.mental],
                      ["Motivation", selectedCoach.motivation],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <div className="mb-1 flex justify-between text-[10px]">
                          <span className="text-gray-400">{label}</span>
                          <b className="text-white">{value}</b>
                        </div>
                        <ProgressBar value={value as number} compact />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="metric-label">Projected weekly impact</p>
                  <div className="mt-2 rounded-lg border border-green-500/20 bg-green-500/10 p-2.5 text-[10px]">
                    <div className="flex justify-between">
                      <span>{impact?.primaryLabel}</span>
                      <b className="text-green-300">+{impact?.primaryGain}</b>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>Tactical plan bonus</span>
                      <b className="text-green-300">
                        +{impact?.tacticalBonus}%
                      </b>
                    </div>
                    {impact?.fatigueReduction ? (
                      <div className="mt-2 flex justify-between">
                        <span>Fatigue impact</span>
                        <b className="text-green-300">
                          -{impact.fatigueReduction}%
                        </b>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-3 metric-label">Strengths</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-gray-300">
                    {selectedCoach.strengths.join(" · ")}
                  </p>
                  <p className="mt-3 metric-label">Limitation</p>
                  <p className="mt-1 text-[10px] text-red-300">
                    {selectedCoach.weaknesses.join(" · ")}
                  </p>
                </div>
              </div>
            </section>
            <section className="card overflow-hidden p-3">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xs font-bold text-white">
                    Contract Options
                  </h2>
                  <p className="text-[9px] text-gray-500">
                    {selectedContract?.slot ?? openSlot ?? "No open slot"}
                  </p>
                </div>
                <span
                  className={`text-[10px] ${forecast.affordable ? "text-green-300" : "text-red-300"}`}
                >
                  {forecast.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {selectedOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedContractLabel(option.label)}
                    className={`rounded-lg border p-2 text-left text-[10px] ${selectedOption?.label === option.label ? "border-green-500 bg-green-500/10" : "border-border bg-surface-light/50"}`}
                  >
                    <b className="block text-white">{option.label}</b>
                    <span className="text-gray-400">
                      {formatMoney(option.weeklyCost)}/wk
                    </span>
                    <strong className="mt-1 block text-green-300">
                      {formatMoney(option.totalCost)}
                    </strong>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-[9px] text-gray-500">After signing</p>
                  <b className="text-xs text-white">
                    Staff {formatMoney(forecast.projectedStaffSpend)}/wk · Cash
                    flow {forecast.projectedWeeklyCashFlow >= 0 ? "+" : "-"}
                    {formatMoney(Math.abs(forecast.projectedWeeklyCashFlow))}/wk
                  </b>
                </div>
                <div className="ml-auto flex gap-2">
                  {alreadySigned ? (
                    <>
                      <select
                        aria-label="Negotiation approach"
                        value={negotiationTone}
                        onChange={(event) =>
                          setNegotiationTone(
                            event.target.value as typeof negotiationTone,
                          )
                        }
                        className="rounded border border-border bg-background px-2 text-[10px] text-white"
                      >
                        <option>Conservative</option>
                        <option>Balanced</option>
                        <option>Ambitious</option>
                      </select>
                      <button
                        type="button"
                        className="btn-secondary px-3 py-2 text-xs"
                        onClick={() =>
                          negotiateCoachContract(
                            selectedCoach.id,
                            negotiationTone,
                          )
                        }
                      >
                        Negotiate
                      </button>
                      <button
                        type="button"
                        className="btn-primary px-3 py-2 text-xs"
                        onClick={() =>
                          extendCoachContract(
                            selectedCoach.id,
                            selectedOption?.label,
                          )
                        }
                      >
                        Extend
                      </button>
                      <button
                        type="button"
                        className="btn-secondary px-3 py-2 text-xs"
                        onClick={() => fireCoach(selectedCoach.id)}
                      >
                        Release
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary px-5 py-2 text-xs"
                      disabled={!canHire}
                      onClick={() =>
                        selectedCoach &&
                        canHire &&
                        hireCoach(selectedCoach.id, selectedOption?.label)
                      }
                    >
                      {canHire
                        ? `Hire as ${openSlot}`
                        : forecast.affordable
                          ? "Unavailable"
                          : "Budget too tight"}
                    </button>
                  )}
                </div>
              </div>
            </section>
          </aside>
        ) : null}
      </div>

      {showComparison ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Coach comparison"
        >
          <div className="w-full max-w-5xl rounded-xl border border-border bg-surface p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Compare Coaches
                </h2>
                <p className="text-xs text-gray-400">
                  Side-by-side cost, fit and projected development.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary p-2"
                onClick={() => setShowComparison(false)}
                aria-label="Close comparison"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {comparisonCoaches.map((coach) => {
                const coachImpact = getCoachProjectedImpact(coach);
                return (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => {
                      setSelectedCoachId(coach.id);
                      setShowComparison(false);
                    }}
                    className="rounded-lg border border-border bg-surface-light p-4 text-left hover:border-green-500/40"
                  >
                    <div className="flex justify-between">
                      <b className="text-white">{coach.name}</b>
                      <Check className="h-4 w-4 text-green-400" />
                    </div>
                    <p className="mt-1 text-[10px] text-green-300">
                      {coach.type} · {coach.specialism}
                    </p>
                    <div className="mt-4 space-y-2 text-xs text-gray-300">
                      <p className="flex justify-between">
                        <span>Fit</span>
                        <b>{coach.compatibility}%</b>
                      </p>
                      <p className="flex justify-between">
                        <span>Weekly cost</span>
                        <b>{formatMoney(coach.weeklyCost)}</b>
                      </p>
                      <p className="flex justify-between">
                        <span>{coachImpact.primaryLabel}</span>
                        <b className="text-green-300">
                          +{coachImpact.primaryGain}/wk
                        </b>
                      </p>
                      <p className="flex justify-between">
                        <span>Tactical bonus</span>
                        <b className="text-green-300">
                          +{coachImpact.tacticalBonus}%
                        </b>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
