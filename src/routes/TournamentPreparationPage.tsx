import { useMemo, useState } from "react";
import "./TournamentPreparationPage.css";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Target,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SectionTabs } from "../components/ui/SectionTabs";
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
import { formatMoney, formatPercent, formatAttribute } from "../utils/formatters";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function ForecastMetric({ label, before, after, lowerIsBetter = false, suffix = "%" }: {
  label: string; before: number; after: number; lowerIsBetter?: boolean; suffix?: string;
}) {
  const delta = Number((after - before).toFixed(2));
  const tone = getPreparationTone(delta, lowerIsBetter);
  const display = (value: number) => suffix === "%" ? formatPercent(value) : formatAttribute(value);
  return <div className="prep-metric">
    <span>{label}</span>
    <div><span className="prep-before">{display(before)}</span><span aria-hidden="true">→</span><strong>{display(after)}</strong></div>
    <small className={`prep-delta prep-delta-${tone}`}>{delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${formatAttribute(delta)}${suffix === "%" ? " pts" : ""}`}</small>
  </div>;
}

export function TournamentPreparationPage() {
  const navigate = useNavigate();
  const [forecastTab, setForecastTab] = useState<"Condition" | "Skill boosts">("Condition");
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

  const baseConfidence = existingPlan?.confidenceBaseline ?? clamp(gameState.player.confidence - (existingPlan?.effects.confidenceDelta ?? 0));
  const effects = useMemo(
    () => calculatePreparationEffects(allocations, supportIds, baseConfidence),
    [allocations, supportIds, baseConfidence],
  );
  const oldEffects = existingPlan?.effects;
  const availableCash = gameState.player.cash + (oldEffects?.cost ?? 0);
  const canConfirm = Boolean(booking && tournament?.status === "Entered" && effects.cost <= availableCash);
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
    setFocusId("custom");
    setAllocations((current) => {
      const next = { ...current };
      if (change > 0) {
        const currentTotal = Object.values(next).reduce(
          (total, value) => total + value,
          0,
        );
        if (currentTotal >= 100 || next[id] >= 100) return current;
        next[id] += 5;
      } else {
        if (next[id] < 5) return current;
        next[id] -= 5;
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
    navigate("/tournaments/hub");
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

  const readinessWarning = preparedFatigue >= 75
    ? "Fatigue remains high. Increase recovery or add physio."
    : preparedStrain >= 65 ? "Body strain remains high. Reduce fitness load or add physio."
    : preparedFatigue >= 55 || preparedStrain >= 45 ? "Some fatigue or strain remains. Consider more recovery."
    : "Your plan is ready for the opening match.";
  const blockedReason = totalAllocation !== 100 ? "Allocate 100% before confirming."
    : effects.cost > availableCash ? "Reduce optional support to fit your available funds."
    : tournament.status !== "Entered" ? "Enter this event before confirming preparation." : null;

  return (
    <div data-testid="tournament-preparation-viewport" className="prep-page">
      <header className="prep-header">
        <div className="prep-event-icon"><Target aria-hidden="true" /></div>
        <div className="prep-heading">
          <p className="prep-eyebrow">Tournament preparation</p>
          <h1>Prepare for {tournament.name}</h1>
          <p>Travel booked <span>·</span> Set your opening-match condition</p>
        </div>
        <div className="prep-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate("/travel")}><ArrowLeft aria-hidden="true" /> Travel</button>
          <button type="button" className="btn-secondary" onClick={resetPlan}><RotateCcw aria-hidden="true" /> Reset</button>
          <button type="button" disabled={!canConfirm || totalAllocation !== 100} aria-describedby={blockedReason ? "prep-confirm-reason" : undefined} className="btn-primary" onClick={confirmPlan}><Check aria-hidden="true" /> Confirm plan</button>
        </div>
      </header>

      <section className="prep-focus" aria-label="Choose a preparation focus">
        <div className="prep-focus-heading"><span className="prep-eyebrow">Your approach</span><span>Choose a focus, then fine-tune</span></div>
        <div className="prep-presets">
          {preparationFocuses.map(focus => <button key={focus.id} type="button" aria-pressed={focus.id === focusId} onClick={() => chooseFocus(focus.id)}>
            <strong>{focus.label}</strong><span>{focus.description}</span>
          </button>)}
        </div>
      </section>

      <div className="prep-workspace">
        <div className="prep-planning">
          <section className="prep-panel prep-allocation">
            <div className="prep-panel-heading"><div><h2><SlidersHorizontal aria-hidden="true" /> Preparation allocation</h2><p>Move 5% at a time between priorities.</p></div>
              <span className={`prep-badge ${totalAllocation !== 100 ? "prep-badge-warning" : ""}`} role="status">{formatPercent(totalAllocation)} allocated{totalAllocation < 100 ? ` · ${formatPercent(100 - totalAllocation)} free` : ""}</span>
            </div>
            <div className="prep-allocation-grid">
              {preparationAllocationMeta.map(item => <article key={item.id} className={`prep-allocation-card ${item.id === "recovery" ? "prep-recovery" : ""}`}>
                <h3>{item.label}</h3><p>{item.description}</p>
                <div className="prep-stepper"><button type="button" aria-label={`Decrease ${item.label}`} disabled={allocations[item.id] === 0} onClick={() => adjustAllocation(item.id, -5)}>−</button><strong>{formatPercent(allocations[item.id])}</strong><button type="button" aria-label={`Increase ${item.label}`} disabled={totalAllocation >= 100 || allocations[item.id] >= 100} onClick={() => adjustAllocation(item.id, 5)}>+</button></div>
                <ProgressBar value={allocations[item.id]} tone={item.id === "recovery" ? "blue" : "green"} compact />
              </article>)}
            </div>
          </section>

          <section className="prep-panel prep-support">
            <div className="prep-panel-heading"><div><h2><Sparkles aria-hidden="true" /> Optional support</h2><p>One-off services for this event</p></div><span className="prep-service-total">{formatMoney(effects.cost)}<small>selected</small></span></div>
            <div className="prep-support-grid">
              {preparationSupports.map(support => {
                const selected = supportIds.includes(support.id);
                return <button key={support.id} type="button" aria-pressed={selected} onClick={() => toggleSupport(support.id)} className="prep-service">
                  <span className="prep-checkbox" aria-hidden="true">{selected && <Check />}</span>
                  <span className="prep-service-copy"><strong>{support.label}</strong><span>{support.detail}</span></span>
                  <b>{formatMoney(support.cost)}</b>
                </button>;
              })}
              <div className="prep-cash"><Wallet aria-hidden="true" /><span>Cash after support<strong className={effects.cost > availableCash ? "text-red-400" : ""}>{formatMoney(availableCash - effects.cost)}</strong></span></div>
            </div>
          </section>
        </div>

        <aside className="prep-panel prep-forecast" aria-label="Opening-match forecast">
          <div className="prep-panel-heading"><div><p className="prep-eyebrow">Opening-match forecast</p><h2>{getPreparationFocus(focusId).label}</h2></div><span className="prep-live"><span aria-hidden="true" />Live forecast</span></div>
          <div className="prep-readiness">
            <div><span>Opening readiness</span><div><span className="prep-before">{formatPercent(baselineReadiness)}</span><span aria-hidden="true">→</span><strong>{formatPercent(preparedReadiness)}</strong></div></div>
            <span className={`prep-delta prep-delta-${getPreparationTone(preparedReadiness - baselineReadiness)}`}>{preparedReadiness === baselineReadiness ? "No change" : `${preparedReadiness > baselineReadiness ? "+" : ""}${preparedReadiness - baselineReadiness} pts`}</span>
            <ProgressBar value={preparedReadiness} compact />
          </div>
          <SectionTabs id="preparation-forecast" label="Preparation forecast" tabs={["Condition", "Skill boosts"]} active={forecastTab} onChange={setForecastTab} />
          <div className="prep-forecast-tab" role="tabpanel" id="preparation-forecast-panel" aria-labelledby={`preparation-forecast-tab-${forecastTab === "Condition" ? 0 : 1}`}>
          {forecastTab === "Condition" ? <div className="prep-metrics">
            <ForecastMetric label="Confidence" before={baseConfidence} after={preparedConfidence} />
            <ForecastMetric label="Fatigue" before={baseFatigue} after={preparedFatigue} lowerIsBetter />
            <ForecastMetric label="Strain" before={baseStrain} after={preparedStrain} lowerIsBetter />
            <ForecastMetric label="Sharpness" before={0} after={effects.sharpnessDelta} suffix="" />
          </div> : <section className="prep-form">
            <div className="prep-form-heading"><h3>Temporary tournament form</h3><span>Opening peak</span></div>
            <p>Permanent attributes stay unchanged.</p>
            <div className="prep-form-grid">
              {temporaryAttributes.map(attribute => <div key={attribute.label}><span>{attribute.label}</span><strong><span>{formatAttribute(attribute.before)}</span><span aria-hidden="true"> → </span>{formatAttribute(clamp(attribute.before + attribute.bonus))}</strong></div>)}
            </div>
          </section>}
          </div>
          <p className={`prep-check ${preparedFatigue >= 55 || preparedStrain >= 45 ? "prep-check-warning" : ""}`}><AlertTriangle aria-hidden="true" />{readinessWarning}</p>
        </aside>
      </div>
      <footer className="prep-footer"><span>Temporary form peaks in the opening round <span aria-hidden="true">·</span> Bonuses decay 18% per round</span><strong id="prep-confirm-reason" role="status">{blockedReason ?? `Preparation load ${formatPercent(100 - allocations.recovery)}`}</strong></footer>
    </div>
  );
}
