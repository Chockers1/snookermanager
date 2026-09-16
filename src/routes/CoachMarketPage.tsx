import { SectionTabs } from '../components/ui/SectionTabs';
import { staffUnavailable } from '../game/seasonLife/staff';
import { useState } from "react";
import { useSearchParams } from 'react-router-dom';
import { StaffTeamPanel } from "../components/career/StaffTeamPanel";
import { Search, SlidersHorizontal } from "lucide-react";
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
import { formatMoney, formatPercent } from "../utils/formatters";

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
    extendCoachContract,
    negotiateCoachContract,
  } = useGame();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'Recruitment' | 'My team'>(searchParams.get('tab') === 'team' ? 'My team' : 'Recruitment');
  const [coachTab, setCoachTab] = useState<'Profile' | 'Impact' | 'Contract'>('Profile');
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
  const [selectedContractLabel, setSelectedContractLabel] =
    useState("8 Week Trial");
  const [selectedHiringSlot, setSelectedHiringSlot] =
    useState<(typeof COACH_SLOT_NAMES)[number]>("Lead Coach");
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
  const selectedSlotIsOpen = Boolean(
    selectedHiringSlot &&
      COACH_SLOT_NAMES.slice(0, slotLimit).includes(selectedHiringSlot) &&
      !gameState.coachContracts.some(
        (contract) => contract.slot === selectedHiringSlot,
      ),
  );
  const hiringSlot = selectedSlotIsOpen ? selectedHiringSlot : openSlot;
  const totalCoachCost = gameState.coachContracts.reduce(
    (sum, contract) => sum + contract.weeklyCost,
    0,
  );
  const specialisms = [
    "All",
    ...Array.from(new Set(gameState.coaches.map((coach) => coach.type))),
  ];
  const visibleCoaches = gameState.coaches
    .filter(coach => !staffUnavailable(gameState, coach.id))
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
    visibleCoaches.find((coach) => coach.id === selectedCoachId) ??
    visibleCoaches[0];
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
    hiringSlot &&
    !alreadySigned &&
    forecast.affordable,
  );
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
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden" data-testid="staff-page">
      <section className="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/85 px-3 py-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400">
            Staff
          </p>
          <h1 className="text-xl font-bold text-white">Staff</h1>
          <p className="text-xs text-gray-300">
            Build a coaching team that fits your goals and budget.
          </p>
        </div>
      </section>

      <SectionTabs id="staff" label="Staff sections" tabs={['Recruitment', 'My team'] as const} active={tab} onChange={setTab} />
      <div id="staff-panel" role="tabpanel" aria-labelledby={`staff-tab-${['Recruitment', 'My team'].indexOf(tab)}`} className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      {tab === 'My team' && <StaffTeamPanel slots={COACH_SLOT_NAMES} slotLimit={slotLimit} onManage={(slot, coachId) => {
        setSelectedHiringSlot(slot);
        if (coachId) setSelectedCoachId(coachId);
        setSearch(''); setTypeFilter('All'); setPriceBand('All'); setAvailabilityFilter('all');
        setTab('Recruitment'); setCoachTab(coachId ? 'Contract' : 'Profile');
      }} />}
      {tab === 'Recruitment' && <>
      <section className="shrink-0 rounded-xl border border-border bg-surface/85 p-2">
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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto lg:grid-cols-12 lg:overflow-hidden">
        <section className="card flex min-h-[420px] flex-col overflow-hidden lg:col-span-6 lg:min-h-0">
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
              const strongest = Math.max(
                coach.technical,
                coach.tactical,
                coach.mental,
                coach.motivation,
              );
              return (
                <button
                  type="button"
                  aria-label={`View ${coach.name}`}
                  aria-pressed={selectedCoach?.id === coach.id}
                  onClick={() => { setSelectedCoachId(coach.id); setCoachTab('Profile'); }}
                  key={coach.id}
                  className={`min-w-0 rounded-lg border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-400 ${selectedCoach?.id === coach.id ? "border-green-500 bg-green-500/10" : "border-border bg-surface-light/55 hover:border-green-500/35"}`}
                >
                  <span className="block truncate text-sm font-semibold text-white">{coach.name}</span>
                  <span className="block text-[10px] font-semibold text-green-300">{coach.type} specialist</span>
                  <span className="mt-1 block text-[10px] leading-relaxed text-gray-200">Trains: {cardImpact.skills.join(' · ')}</span>
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
                        +{formatPercent(cardImpact.trainingBonus * 100)}
                      </b>
                      <span className="text-[8px] text-gray-500">TRAINING</span>
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
                </button>
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
          <aside className="flex min-h-0 flex-col gap-2 lg:col-span-6">
            <SectionTabs id="coach-detail" label="Selected coach" tabs={['Profile', 'Impact', 'Contract'] as const} active={coachTab} onChange={setCoachTab} />
            <div id="coach-detail-panel" role="tabpanel" aria-labelledby={`coach-detail-tab-${['Profile', 'Impact', 'Contract'].indexOf(coachTab)}`} className="flex min-h-0 flex-1 flex-col">
            {coachTab === 'Profile' && <section className="card flex min-h-0 flex-1 flex-col overflow-hidden border-green-500/30">
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
              <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
                <div className="grid shrink-0 grid-cols-2 gap-2 text-center">
                  {[
                    ["Player fit", `${selectedCoach.compatibility}%`],
                    ["Base/wk", formatMoney(selectedCoach.weeklyCost)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-surface-light p-2">
                      <b className="block text-sm text-white">{value}</b>
                      <span className="text-[9px] uppercase tracking-wide text-white">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mb-2 mt-3 shrink-0 text-xs font-semibold text-white">
                  Coach ratings
                </p>
                <div className="grid flex-1 auto-rows-fr grid-cols-3 gap-3">
                  {[
                    ["Overall", overall],
                    ["Technical", selectedCoach.technical],
                    ["Tactical", selectedCoach.tactical],
                    ["Mental", selectedCoach.mental],
                    ["Motivation", selectedCoach.motivation],
                    ["Discipline", selectedCoach.discipline],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex min-h-28 min-w-0 flex-col justify-center rounded-lg border border-border bg-surface-light/50 p-3">
                      <div className="flex flex-col items-start gap-2">
                        <span className="text-xs text-white">{label}</span>
                        <b className="text-2xl text-green-300">{value}</b>
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={value as number} compact />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>}
            {coachTab === 'Impact' && <section className="card flex min-h-0 flex-1 flex-col overflow-hidden">
              <h2 className="card-header text-sm font-bold text-white">{selectedCoach.name} · Development impact</h2>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <h3 className="mb-2 text-sm font-semibold text-white">{selectedCoach.type} specialist</h3>
                <p className="mb-3 text-xs text-gray-300">{selectedCoach.specialism}</p>
                <div className="grid gap-2 sm:grid-cols-2">{impact?.skills.map(skill => <div key={skill} className="rounded-lg border border-green-500/20 bg-green-500/10 p-2 text-xs"><span className="block text-white">{skill}</span><b className="text-green-300">+{formatPercent(impact.trainingBonus * 100)} training gains</b></div>)}</div>
                <p className="mt-3 text-xs leading-relaxed text-gray-200">The boost applies to gains from relevant training sessions, in either staff slot. A 0.20-point session gain becomes {(0.2 * (1 + (impact?.trainingBonus ?? 0))).toFixed(2)} before other limits; this is not a guaranteed weekly attribute increase.</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-300">Both contracted coaches contribute. Bonuses on the same skill add together, capped at 30%. Level and player fit set this coach’s rate. Skills outside this list receive no direct development bonus. Training workload, fatigue and development limits still apply.</p>
                <p className="mt-2 text-xs text-gray-300">Training → Development shows the forecast for your actual weekly plan and current staff.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-surface-light/50 p-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-white">Strengths</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-gray-300">{selectedCoach.strengths.join(" · ")}</p>
                  </div>
                  <div className="rounded-lg bg-red-500/5 p-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-red-400">Limitations</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-red-300">{selectedCoach.weaknesses.join(" · ")}</p>
                  </div>
                </div>
              </div>
            </section>
            }
            {coachTab === 'Contract' && <section className="card flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
              <p className="shrink-0 text-sm font-semibold text-white">{selectedCoach.name}</p>
              <div className="flex shrink-0 items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Contract Options
                  </h2>
                  <p className="text-xs text-gray-300">
                    {selectedContract?.slot ?? hiringSlot ?? "No open slot"}
                  </p>
                </div>
                <span
                  className={`text-[10px] ${forecast.affordable ? "text-green-300" : "text-red-300"}`}
                >
                  {forecast.status}
                </span>
              </div>
              <div className="grid flex-1 grid-cols-2 auto-rows-fr gap-3">
                {selectedOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={selectedOption?.label === option.label}
                    onClick={() => setSelectedContractLabel(option.label)}
                    className={`flex min-h-28 min-w-0 flex-col justify-center rounded-lg border p-3 text-left text-xs ${selectedOption?.label === option.label ? "border-green-500 bg-green-500/10" : "border-border bg-surface-light/50"}`}
                  >
                    <b className="block text-sm text-white">{option.label}</b>
                    <span className="mt-2 text-gray-300">
                      {formatMoney(option.weeklyCost)}/wk
                    </span>
                    <strong className="mt-1 block text-lg text-green-300">
                      {formatMoney(option.totalCost)}
                    </strong>
                    <span className="text-[10px] text-gray-300">Total contract cost</span>
                  </button>
                ))}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-xs text-gray-300">After signing</p>
                  <p className="text-[10px] text-gray-300">Paid weekly. Early termination pays out all remaining weeks.</p>
                  <b className="text-xs text-white">
                    Staff {formatMoney(forecast.projectedStaffSpend)}/wk · Cash
                    flow {forecast.projectedWeeklyCashFlow >= 0 ? "+" : "-"}
                    {formatMoney(Math.abs(forecast.projectedWeeklyCashFlow))}/wk
                  </b>
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
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
                        onClick={() => setTab('My team')}
                      >
                        Manage contract
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
                        hiringSlot &&
                        hireCoach(
                          selectedCoach.id,
                          selectedOption?.label,
                          hiringSlot,
                        )
                      }
                    >
                      {canHire
                        ? `Hire as ${hiringSlot}`
                        : forecast.affordable
                          ? "Unavailable"
                          : "Budget too tight"}
                    </button>
                  )}
                </div>
              </div>
            </section>
            }
            </div>
          </aside>
        ) : null}
      </div>

      </>}
      </div>


    </div>
  );
}
