import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import {
  calculatePreparationEffects,
  getDefaultPreparationAllocations,
  getPreparationFocus,
  getPreparationTone,
  preparationAllocationMeta,
  preparationFocuses,
  preparationSupports,
  type PreparationAllocationId,
  type PreparationAllocations,
  type PreparationFocusId,
  type PreparationSupportId,
} from "../game/tournamentPreparation";
import { getNextEligibleTournament } from "../hooks/useGameState";
import { formatMoney } from "../utils/formatters";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const toneClasses = {
  positive: "border-green-500/35 bg-green-500/10 text-green-400",
  negative: "border-red-500/35 bg-red-500/10 text-red-400",
  neutral: "border-border bg-surface-light/40 text-gray-300",
};

function DeltaValue({
  before,
  after,
  lowerIsBetter = false,
  suffix = "%",
}: {
  before: number;
  after: number;
  lowerIsBetter?: boolean;
  suffix?: string;
}) {
  const delta = after - before;
  const tone = getPreparationTone(delta, lowerIsBetter);
  return (
    <div className={`rounded-md border px-2 py-1.5 ${toneClasses[tone]}`}>
      <p className="text-[8px] uppercase tracking-wide text-gray-500">Before → prepared</p>
      <p className="mt-0.5 text-xs font-bold text-white">
        {before}{suffix} <span className="text-gray-500">→</span> {after}{suffix}
        {delta !== 0 ? (
          <span className={`ml-1 ${tone === "positive" ? "text-green-400" : "text-red-400"}`}>
            {delta > 0 ? "+" : ""}{delta}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function TournamentPreparationPage() {
  const navigate = useNavigate();
  const { gameState, confirmTournamentPreparation } = useGame();
  const tournament = getNextEligibleTournament(gameState);
  const booking = tournament ? gameState.travel.bookings[tournament.id] : undefined;
  const existingPlan = booking?.preparation;
  const [focusId, setFocusId] = useState<PreparationFocusId>(
    existingPlan?.focusId ?? "balanced",
  );
  const [allocations, setAllocations] = useState<PreparationAllocations>(
    existingPlan?.allocations ?? getDefaultPreparationAllocations(),
  );
  const [supportIds, setSupportIds] = useState<PreparationSupportId[]>(
    existingPlan?.supportIds ?? [],
  );

  const effects = useMemo(
    () => calculatePreparationEffects(allocations, supportIds),
    [allocations, supportIds],
  );
  const oldEffects = existingPlan?.effects;
  const availableCash = gameState.player.cash + (oldEffects?.cost ?? 0);
  const canConfirm = Boolean(booking && tournament?.status === "Entered" && effects.cost <= availableCash);
  const baseConfidence = clamp(gameState.player.confidence - (oldEffects?.confidenceDelta ?? 0));
  const baseFatigue = clamp(gameState.player.fatigue - (oldEffects?.fatigueDelta ?? 0));
  const baseStrain = clamp(gameState.trainingCondition.strain - (oldEffects?.strainDelta ?? 0));
  const preparedConfidence = clamp(baseConfidence + effects.confidenceDelta);
  const preparedFatigue = clamp(baseFatigue + effects.fatigueDelta);
  const preparedStrain = clamp(baseStrain + effects.strainDelta);
  const baselineReadiness = clamp(
    55 + baseConfidence * 0.2 - baseFatigue * 0.35 - baseStrain * 0.18,
  );
  const preparedReadiness = clamp(baselineReadiness + effects.readinessDelta);
  const totalAllocation = Object.values(allocations).reduce((total, value) => total + value, 0);

  function chooseFocus(nextFocusId: PreparationFocusId) {
    const focus = getPreparationFocus(nextFocusId);
    setFocusId(nextFocusId);
    setAllocations({ ...focus.allocations });
  }

  function adjustAllocation(id: PreparationAllocationId, change: -5 | 5) {
    setFocusId("balanced");
    setAllocations((current) => {
      const next = { ...current };
      if (change > 0) {
        const donor = preparationAllocationMeta
          .map((item) => item.id)
          .filter((candidate) => candidate !== id && next[candidate] >= 5)
          .sort((left, right) => next[right] - next[left])[0];
        if (!donor || next[id] >= 100) return current;
        next[id] += 5;
        next[donor] -= 5;
      } else {
        if (next[id] < 5) return current;
        const receiver = id === "recovery" ? "mental" : "recovery";
        next[id] -= 5;
        next[receiver] += 5;
      }
      return next;
    });
  }

  function toggleSupport(id: PreparationSupportId) {
    setSupportIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function resetPlan() {
    setFocusId("balanced");
    setAllocations(getDefaultPreparationAllocations());
    setSupportIds([]);
  }

  function confirmPlan() {
    if (!tournament || !canConfirm) return;
    confirmTournamentPreparation(
      tournament.id,
      focusId,
      allocations,
      supportIds,
    );
    navigate("/match/preview");
  }

  if (!tournament || !booking) {
    return (
      <div className="card flex h-full min-h-0 flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <h1 className="mt-3 text-xl font-bold text-white">Travel must be booked first</h1>
        <p className="mt-2 max-w-md text-xs text-gray-400">
          Enter your next tournament and confirm its travel package before building a preparation plan.
        </p>
        <button type="button" className="btn-primary mt-5" onClick={() => navigate("/travel")}>
          Open Travel Planner
        </button>
      </div>
    );
  }

  const temporaryAttributes = [
    "Long Potting",
    "Break Building",
    "Cue Ball Control",
    "Safety Play",
    "Consistency",
    "Composure",
    "Focus",
    "Big Match Nerve",
    "Stamina",
    "Balance",
  ].map((label) => {
    const source = {
      ...gameState.attributes.technical,
      ...gameState.attributes.mental,
      ...gameState.attributes.physical,
    } as Record<string, number>;
    const bonus = effects.attributeBonuses[label] ?? 0;
    return { label, before: source[label] ?? 0, bonus };
  }).filter((item) => item.bonus > 0);

  return (
    <div data-testid="tournament-preparation-viewport" className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-2 overflow-hidden">
      <header className="card flex min-w-0 items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-green-400">Tournament preparation</p>
          <h1 className="mt-0.5 truncate text-xl font-bold text-white">Prepare for {tournament.name}</h1>
          <p className="truncate text-[10px] text-gray-400">Travel booked · set your opening-match condition</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn-secondary min-h-10 px-3 text-xs" onClick={() => navigate("/travel")}>
            <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Travel</span>
          </button>
          <button type="button" className="btn-secondary min-h-10 px-3 text-xs" onClick={resetPlan}>
            <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Reset</span>
          </button>
          <button type="button" disabled={!canConfirm || totalAllocation !== 100} className="btn-primary min-h-10 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50" onClick={confirmPlan}>
            <Check className="h-3.5 w-3.5" /> Confirm plan
          </button>
        </div>
      </header>

      <section className="card px-3 py-2">
        <div className="mb-1.5 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-green-400" />
          <h2 className="text-xs font-semibold text-white">Choose a preparation focus</h2>
          <span className="hidden text-[9px] text-gray-500 sm:inline">Auto-fills the allocation</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4 xl:grid-cols-7">
          {preparationFocuses.map((focus) => {
            const selected = focus.id === focusId;
            return (
              <button key={focus.id} type="button" aria-pressed={selected} onClick={() => chooseFocus(focus.id)} className={`min-h-10 rounded-lg border px-2.5 py-1.5 text-left transition ${selected ? "border-green-500 bg-green-500/10" : "border-border bg-surface-light/35 hover:border-gray-600"}`}>
                <span className="block text-[10px] font-semibold text-white">{focus.label}</span>
                <span className={`block text-[8px] ${selected ? "text-green-400" : "text-gray-500"}`}>{focus.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid min-h-0 gap-2 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_350px] xl:overflow-hidden">
        <section className="card flex min-h-[520px] flex-col overflow-hidden xl:min-h-0">
          <div className="card-header shrink-0 py-2.5">
            <div><h2 className="flex items-center gap-2 text-xs font-semibold text-white"><SlidersHorizontal className="h-4 w-4 text-green-400" />Preparation allocation</h2><p className="text-[8px] text-gray-500">Every change updates the forecast immediately.</p></div>
            <span className={totalAllocation === 100 ? "text-[9px] font-semibold text-green-400" : "text-[9px] font-semibold text-red-400"}>{totalAllocation}% allocated</span>
          </div>
          <div className="grid min-h-0 flex-1 gap-2 p-2.5 xl:grid-cols-[minmax(0,1fr)_310px] xl:grid-rows-[auto_minmax(0,1fr)]">
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
              {preparationAllocationMeta.map((item) => {
                const value = allocations[item.id];
                const recovery = item.id === "recovery";
                return (
                  <div key={item.id} className={`rounded-lg border p-2.5 ${recovery ? "border-green-500/35 bg-green-500/10" : "border-border bg-surface-light/35"}`}>
                    <div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-semibold text-white">{item.label}</p><p className={`text-[8px] ${recovery ? "text-green-400" : "text-gray-500"}`}>{item.description}</p></div><b className="text-sm text-green-400">{value}%</b></div>
                    <div className="mt-2.5 flex gap-1"><button type="button" aria-label={`Decrease ${item.label}`} className="min-h-8 flex-1 rounded border border-border bg-surface text-xs text-gray-300 hover:border-green-500/40" onClick={() => adjustAllocation(item.id, -5)}>−</button><button type="button" aria-label={`Increase ${item.label}`} className="min-h-8 flex-1 rounded border border-border bg-surface text-xs text-gray-300 hover:border-green-500/40" onClick={() => adjustAllocation(item.id, 5)}>+</button></div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-border bg-surface-light/20 p-2.5">
              <div className="mb-2 flex items-center justify-between"><div><h3 className="text-[10px] font-semibold text-white">Optional support</h3><p className="text-[8px] text-gray-500">One-off event services</p></div><span className={`rounded px-2 py-1 text-[8px] font-semibold ${effects.cost > availableCash ? "bg-red-500/10 text-red-400" : effects.cost > 0 ? "bg-amber-500/10 text-amber-400" : "bg-surface-light text-gray-400"}`}>{formatMoney(effects.cost)}</span></div>
              <div className="grid gap-1.5">
                {preparationSupports.map((support) => {
                  const selected = supportIds.includes(support.id);
                  return (
                    <button key={support.id} type="button" aria-pressed={selected} onClick={() => toggleSupport(support.id)} className={`flex min-h-9 items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left transition ${selected ? "border-green-500/40 bg-green-500/10" : "border-border bg-surface hover:border-gray-600"}`}>
                      <span className="text-[9px] font-semibold text-white">{support.label}</span>
                      <span className={`text-right text-[8px] ${selected ? "text-green-400" : "text-gray-500"}`}>{support.detail} · {formatMoney(support.cost)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid min-h-[150px] grid-cols-1 gap-1.5 md:grid-cols-3 xl:col-span-2">
              <div className="flex flex-col rounded-lg border border-border bg-surface-light/25 p-3"><div className="flex justify-between"><b className="text-[10px] text-white">Arrival and reset</b><span className="text-[8px] text-sky-300">Day 1</span></div><p className="mt-1 text-[8px] text-gray-400">Recovery absorbs the booked travel load before table work.</p><div className="mt-3 grid gap-1.5 text-[8px]"><div className="flex justify-between border-b border-border/60 pb-1"><span className="text-gray-500">Recovery allocation</span><b className="text-white">{allocations.recovery}%</b></div><div className="flex justify-between border-b border-border/60 pb-1"><span className="text-gray-500">Physio support</span><b className={supportIds.includes("physio") ? "text-green-400" : "text-gray-400"}>{supportIds.includes("physio") ? "Selected" : "Not selected"}</b></div><div className="flex justify-between"><span>Fatigue <b className={effects.fatigueDelta <= 0 ? "text-green-400" : "text-red-400"}>{effects.fatigueDelta > 0 ? "+" : ""}{effects.fatigueDelta}</b></span><span>Strain <b className={effects.strainDelta <= 0 ? "text-green-400" : "text-red-400"}>{effects.strainDelta > 0 ? "+" : ""}{effects.strainDelta}</b></span></div></div></div>
              <div className="flex flex-col rounded-lg border border-border bg-surface-light/25 p-3"><div className="flex justify-between"><b className="text-[10px] text-white">Table and tactics</b><span className="text-[8px] text-green-400">Day 2</span></div><p className="mt-1 text-[8px] text-gray-400">Practice creates temporary form for the opening match.</p><div className="mt-3 grid gap-1.5 text-[8px]"><div className="flex justify-between border-b border-border/60 pb-1"><span className="text-gray-500">Table allocation</span><b className="text-white">{allocations.potting + allocations.breakBuilding + allocations.tactical}%</b></div><div className="flex justify-between border-b border-border/60 pb-1"><span className="text-gray-500">Coach support</span><b className={supportIds.includes("coach") ? "text-green-400" : "text-gray-400"}>{supportIds.includes("coach") ? "Selected" : "Not selected"}</b></div><div className="flex justify-between"><span>Sharpness <b className="text-green-400">+{effects.sharpnessDelta}</b></span><span>Best skill boost <b className="text-green-400">+{Math.max(...Object.values(effects.attributeBonuses))}</b></span></div></div></div>
              <div className="flex flex-col rounded-lg border border-green-500/30 bg-green-500/5 p-3"><div className="flex justify-between"><b className="text-[10px] text-white">Match-day routine</b><span className="text-[8px] text-green-400">Opening round</span></div><p className="mt-1 text-[8px] text-gray-400">Temporary bonuses peak now and decay through later rounds.</p><div className="mt-3 grid gap-1.5 text-[8px]"><div className="flex justify-between border-b border-green-500/15 pb-1"><span className="text-gray-500">Opening readiness</span><b className={preparedReadiness >= baselineReadiness ? "text-green-400" : "text-red-400"}>{baselineReadiness}% → {preparedReadiness}%</b></div><div className="flex justify-between border-b border-green-500/15 pb-1"><span className="text-gray-500">Confidence</span><b className={preparedConfidence >= baseConfidence ? "text-green-400" : "text-red-400"}>{baseConfidence}% → {preparedConfidence}%</b></div><div className="flex justify-between"><span className="text-gray-500">Later rounds</span><b className="text-amber-400">Bonuses decay 18% per round</b></div></div></div>
            </div>
          </div>
        </section>

        <aside className="grid max-h-full min-h-0 content-start gap-2 overflow-y-auto rounded-xl border border-border bg-[#0d141a] p-2.5">
          <section className="rounded-lg border border-green-500/35 bg-surface p-3">
            <div className="flex justify-between gap-3"><div><p className="text-[8px] font-semibold uppercase tracking-wider text-green-400">Current plan</p><h2 className="mt-1 text-sm font-semibold text-white">{getPreparationFocus(focusId).label}</h2></div><span className="text-[9px] font-semibold text-green-400">Live forecast</span></div>
            <p className="mt-2 text-[9px] text-gray-400">Cash after support: <b className={effects.cost <= availableCash ? "text-white" : "text-red-400"}>{formatMoney(availableCash - effects.cost)}</b></p>
          </section>

          <section className="rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-3 py-2"><h2 className="text-[11px] font-semibold text-white">Opening-match forecast</h2><p className="text-[8px] text-gray-500">Colour-coded against your pre-plan condition</p></div>
            <div className="grid grid-cols-2 gap-1.5 p-2.5">
              <div><p className="metric-label mb-1">Readiness</p><DeltaValue before={baselineReadiness} after={preparedReadiness} /></div>
              <div><p className="metric-label mb-1">Confidence</p><DeltaValue before={baseConfidence} after={preparedConfidence} /></div>
              <div><p className="metric-label mb-1">Fatigue</p><DeltaValue before={baseFatigue} after={preparedFatigue} lowerIsBetter /></div>
              <div><p className="metric-label mb-1">Strain</p><DeltaValue before={baseStrain} after={preparedStrain} lowerIsBetter /></div>
              <div><p className="metric-label mb-1">Sharpness</p><DeltaValue before={0} after={effects.sharpnessDelta} suffix="" /></div>
              <div><p className="metric-label mb-1">Support cost</p><div className={`rounded-md border px-2 py-1.5 ${effects.cost ? "border-amber-500/35 bg-amber-500/10" : "border-border bg-surface-light/40"}`}><p className="text-[8px] uppercase text-gray-500">Selected</p><p className={`mt-0.5 text-xs font-bold ${effects.cost ? "text-amber-400" : "text-gray-300"}`}>{formatMoney(effects.cost)}</p></div></div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-3">
            <div className="flex justify-between"><div><h2 className="text-[11px] font-semibold text-white">Temporary tournament form</h2><p className="text-[8px] text-gray-500">Permanent attributes are unchanged</p></div><span className="text-[8px] text-green-400">Opening peak</span></div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[8px]">
              {temporaryAttributes.map((attribute) => <div key={attribute.label} className="flex justify-between gap-2"><span className="truncate text-gray-400">{attribute.label}</span><b className="shrink-0 text-green-400">{attribute.before} → {clamp(attribute.before + attribute.bonus)}</b></div>)}
            </div>
          </section>

          <section className={`rounded-lg border p-2.5 ${preparedFatigue >= 75 || preparedStrain >= 65 ? "border-red-500/30 bg-red-500/10" : preparedFatigue >= 55 || preparedStrain >= 45 ? "border-amber-500/30 bg-amber-500/10" : "border-green-500/30 bg-green-500/10"}`}>
            <p className="flex gap-2 text-[9px]"><AlertTriangle className={`h-4 w-4 shrink-0 ${preparedFatigue >= 75 || preparedStrain >= 65 ? "text-red-400" : preparedFatigue >= 55 || preparedStrain >= 45 ? "text-amber-400" : "text-green-400"}`} /><span className="text-gray-200"><b>Readiness check:</b> {preparedFatigue >= 75 ? "Fatigue remains too high. Increase recovery or add physio." : preparedStrain >= 65 ? "Body strain remains high. Reduce fitness load or add physio." : "The current plan is safe for the opening match."}</span></p>
          </section>
        </aside>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          ["Preparation load", `${100 - allocations.recovery}%`, 100 - allocations.recovery, preparedFatigue >= 75 ? "red" : "green"],
          ["Fatigue", `${baseFatigue}% → ${preparedFatigue}%`, preparedFatigue, preparedFatigue > baseFatigue ? "red" : "green"],
          ["Strain", `${baseStrain}% → ${preparedStrain}%`, preparedStrain, preparedStrain > baseStrain ? "red" : "green"],
          ["Opening readiness", `${preparedReadiness}%`, preparedReadiness, preparedReadiness < baselineReadiness ? "red" : "green"],
        ].map(([label, value, progress, tone]) => <div key={String(label)} className="card px-3 py-2"><div className="mb-1.5 flex justify-between gap-2"><span className="metric-label truncate">{label}</span><b className={`text-xs ${tone === "red" ? "text-red-400" : "text-green-400"}`}>{value}</b></div><ProgressBar value={Number(progress)} tone={tone as "red" | "green"} compact /></div>)}
      </div>
    </div>
  );
}
