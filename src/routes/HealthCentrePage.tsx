import { getTreatmentEffect, needsHealthRecovery, treatmentPreview } from '../game/healthSystem';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BedDouble,
  CalendarClock,
  ChevronRight,
  HeartPulse,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import { formatMoney } from "../utils/formatters";
import { buildHealthCentreData } from "../utils/liveRouteData";

function toneClass(tone: "green" | "amber" | "red") {
  if (tone === "red") return "text-red-400";
  if (tone === "amber") return "text-amber-400";
  return "text-green-400";
}

export function HealthCentrePage() {
  const { gameState, scheduleTreatment, continueWeek } = useGame();
  const navigate = useNavigate();
  const { bodyStatus, currentIssue, treatments, matchImpact, injuryHistory } =
    buildHealthCentreData(gameState);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(
    treatments.find((option) => option.selected)?.id ?? treatments[0].id,
  );
  const selectedTreatment =
    treatments.find((option) => option.id === selectedTreatmentId) ??
    treatments[0];
  const recoveryNeeded = needsHealthRecovery(gameState);
  const preview = treatmentPreview(gameState, selectedTreatment.id);
  const duringMatch = gameState.liveMatch?.status === "In Progress";
  const summary = [
    {
      label: "Fatigue",
      value: `${Number(gameState.player.fatigue.toFixed(2))}%`,
      tone:
        gameState.player.fatigue >= 65 ? "text-amber-400" : "text-green-400",
    },
    {
      label: "Body strain",
      value: `${gameState.trainingCondition.strain}%`,
      tone:
        gameState.trainingCondition.strain >= 55
          ? "text-amber-400"
          : "text-green-400",
    },
    {
      label: "Burnout",
      value: `${gameState.trainingCondition.burnout}%`,
      tone:
        gameState.trainingCondition.burnout >= 55
          ? "text-amber-400"
          : "text-green-400",
    },
    {
      label: "Injury time",
      value: `${gameState.trainingCondition.injuryWeeks} wk`,
      tone:
        gameState.trainingCondition.injuryWeeks > 0
          ? "text-red-400"
          : "text-green-400",
    },
  ];

  return (
    <div
      className="mx-auto flex w-full max-w-[1680px] flex-col gap-3 pb-4 xl:-m-6 xl:h-[calc(100vh-5.5rem)] xl:w-[calc(100%+3rem)] xl:max-w-none xl:gap-2 xl:overflow-hidden xl:p-1.5 xl:pb-1.5"
      data-testid="health-viewport"
    >
      <header className="card flex shrink-0 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between xl:py-2">
        <div>
          <p className="metric-label text-green-400">Player care</p>
          <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
            Health Centre
          </h1>
          <p className="mt-0.5 hidden text-[10px] text-amber-300 xl:block">
            {currentIssue.title} · {currentIssue.overallRisk} risk · return{" "}
            {currentIssue.estimatedReturn}
          </p>
          <p className="mt-1 text-xs text-gray-400 xl:hidden">
            Manage fatigue, strain, injury recovery, and readiness from the live
            save.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-light/40 px-3 py-2">
          <Wallet className="h-4 w-4 text-green-400" />
          <div>
            <p className="metric-label">Available cash</p>
            <p className="text-sm font-bold text-white">
              {formatMoney(gameState.player.cash)}
            </p>
          </div>
        </div>
      </header>

      <section
        aria-label="Health summary"
        className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4"
      >
        {summary.map((item) => (
          <article
            key={item.label}
            className="card flex items-center justify-between gap-3 px-3 py-3 xl:py-2"
          >
            <p className="metric-label">{item.label}</p>
            <p className={`text-xl font-bold ${item.tone}`}>{item.value}</p>
          </article>
        ))}
      </section>

      <section className="card shrink-0 overflow-hidden border-amber-600/30 bg-amber-600/5 xl:hidden">
        <div className="grid gap-3 p-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-600/15">
            <HeartPulse className="h-5 w-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="metric-label text-amber-400">Current issue</p>
            <h2 className="mt-1 text-lg font-bold text-white">
              {currentIssue.title}
            </h2>
            <p className="mt-1 text-xs leading-5 text-gray-400">
              {currentIssue.bodyArea} · {currentIssue.severity} ·{" "}
              {currentIssue.cause}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-left lg:text-right">
            <div className="rounded bg-surface/60 px-3 py-2">
              <p className="metric-label">Risk</p>
              <p className="mt-1 text-sm font-bold text-amber-400">
                {currentIssue.overallRisk}
              </p>
            </div>
            <div className="rounded bg-surface/60 px-3 py-2">
              <p className="metric-label">Return</p>
              <p className="mt-1 text-sm font-bold text-white">
                {currentIssue.estimatedReturn}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-h-0 min-w-0 gap-3 xl:flex-[0.82] xl:grid-cols-12 xl:gap-2">
        <section className="card min-h-0 min-w-0 overflow-hidden xl:col-span-5">
          <div className="card-header py-2.5">
            <h2 className="text-sm font-semibold text-white">Body status</h2>
            <span className="text-[10px] text-gray-500">Live risk by area</span>
          </div>
          <div className="divide-y divide-border/60 px-4 xl:px-3">
            {bodyStatus.map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-[minmax(72px,0.8fr)_minmax(92px,1fr)_minmax(100px,1.4fr)] items-center gap-3 py-3 text-xs xl:py-1.5 xl:text-[10px]"
              >
                <span className="font-medium text-white">{item.label}</span>
                <span className={toneClass(item.tone)}>{item.status}</span>
                <div className="flex items-center gap-2">
                  <ProgressBar value={item.risk} tone={item.tone} compact />
                  <span className="w-7 text-right text-gray-400">
                    {item.risk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card min-h-0 min-w-0 overflow-hidden xl:col-span-7">
          <div className="card-header py-2.5">
            <h2 className="text-sm font-semibold text-white">
              Issue and match impact
            </h2>
            <span className="text-[10px] text-gray-500">
              Before your next match
            </span>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:gap-3 xl:p-3">
            <div className="space-y-2 text-xs">
              {[
                ["Body area", currentIssue.bodyArea],
                ["Severity", currentIssue.severity],
                ["Pain", currentIssue.painLevel],
                ["Recovery time", currentIssue.recoveryTime],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 border-b border-border/50 pb-2"
                >
                  <span className="text-gray-400">{label}</span>
                  <span className="text-right font-medium text-white">
                    {value}
                  </span>
                </div>
              ))}
              <div className="pt-1">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-400">Recovery progress</span>
                  <span className="text-green-400">
                    {currentIssue.recoveryProgress}%
                  </span>
                </div>
                <ProgressBar value={currentIssue.recoveryProgress} compact />
              </div>
            </div>
            <div className="space-y-2">
              {matchImpact.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded bg-surface-light/40 px-3 py-2 text-xs"
                >
                  <span className="text-gray-300">{item.label}</span>
                  <span className="font-semibold text-red-400">
                    {item.impact}
                  </span>
                </div>
              ))}
              <div className="flex items-start gap-2 rounded border border-amber-600/25 bg-amber-600/10 p-2.5 text-xs text-amber-300 xl:p-2 xl:text-[10px]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {recoveryNeeded ? `${currentIssue.riskOfPlaying}% risk of worsening if you play without recovery.` : "No active injury or recovery load. Treatment is not needed."}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid min-h-0 min-w-0 gap-3 xl:flex-1 xl:grid-cols-12 xl:gap-2">
        <section className="card min-h-0 min-w-0 overflow-hidden xl:col-span-8">
          <div className="card-header py-2.5">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Treatment options
              </h2>
              <p className="mt-0.5 text-[10px] text-gray-500">
                Recovery effects apply immediately. Review the changes and cost before confirming.
              </p>
            </div>
          </div>
          <div className="grid gap-2 p-3 sm:grid-cols-2 xl:p-2">
            {treatments.map((option) => {
              const selected = option.id === selectedTreatment.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedTreatmentId(option.id)}
                  className={`min-h-28 rounded-lg border p-3 text-left transition xl:min-h-0 xl:p-2 ${selected ? "border-green-500/50 bg-green-600/10" : "border-border bg-surface-light/35 hover:border-border-light"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white">
                      {option.title}
                    </p>
                    <p className="shrink-0 text-sm font-bold text-white">
                      {option.cost === 0 ? "£0" : formatMoney(option.cost)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-4 text-gray-400 xl:line-clamp-1 xl:mt-1">
                    {option.description}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-gray-500 xl:mt-1">
                    <CalendarClock className="h-3 w-3" /> Up to −{getTreatmentEffect(option.id).fatigue} fatigue · −{getTreatmentEffect(option.id).strain} strain
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="card min-h-0 min-w-0 border-green-600/30 bg-green-600/5 p-4 overflow-y-auto xl:col-span-4 xl:p-3">
          <p className="metric-label text-green-400">Selected treatment</p>
          <h2 className="mt-2 text-lg font-bold text-white">
            {selectedTreatment.title}
          </h2>
          <p className="mt-2 text-xs leading-5 text-gray-400 xl:line-clamp-2 xl:leading-4">
            {selectedTreatment.description}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 xl:mt-2">
            <div className="rounded bg-surface/70 p-2.5">
              <p className="metric-label">Cost</p>
              <p className="mt-1 text-sm font-bold text-white">
                {selectedTreatment.cost === 0
                  ? "£0"
                  : formatMoney(selectedTreatment.cost)}
              </p>
            </div>
            <div className="rounded bg-surface/70 p-2.5">
              <p className="metric-label">Effect</p>
              <p className="mt-1 text-sm font-bold text-white">
                Immediate
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-gray-300">{recoveryNeeded ? preview.filter(r => r.before !== r.after).map(r => `${r.label} ${Number(r.before.toFixed(2))}${r.unit} → ${Number(r.after.toFixed(2))}${r.unit}`).join(' · ') || 'Clear the recorded issue.' : 'No treatment needed. Fatigue, strain, burnout and injury time are already zero.'}</p>
          <button
            type="button"
            disabled={!recoveryNeeded || duringMatch || gameState.player.cash < selectedTreatment.cost}
            className="btn-primary mt-4 min-h-11 w-full justify-center text-xs xl:mt-2 xl:min-h-9"
            onClick={() => scheduleTreatment(selectedTreatment.id)}
          >
            <BedDouble className="h-4 w-4" /> {recoveryNeeded ? "Apply treatment" : "No treatment needed"}{" "}
            <ChevronRight className="h-4 w-4" />
          </button>
          <p role="status" className="mt-2 text-[11px] text-amber-300">{duringMatch ? 'Use interval recovery during your match; treatment is available afterwards.' : gameState.player.cash < selectedTreatment.cost && recoveryNeeded ? 'Not enough cash for this treatment.' : gameState.lastAction}</p>
        </aside>
      </div>

      <section className="card min-h-0 min-w-0 shrink overflow-hidden xl:flex-[0.5]">
        <div className="card-header py-2.5">
          <h2 className="text-sm font-semibold text-white">
            Injury and treatment history
          </h2>
          <span className="text-[10px] text-gray-500">Most recent first</span>
        </div>
        <div className="scrollbar-thin h-full overflow-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-light/25 text-gray-500">
                {[
                  "Date",
                  "Issue",
                  "Severity",
                  "Treatment",
                  "Time out",
                  "Notes",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-2 text-left font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {injuryHistory.length > 0 ? (
                injuryHistory.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-gray-400 xl:py-1.5">
                      {row.date}
                    </td>
                    <td className="px-4 py-3 font-medium text-white xl:py-1.5">
                      {row.issue}
                    </td>
                    <td className="px-4 py-3 text-amber-400 xl:py-1.5">
                      {row.severity}
                    </td>
                    <td className="px-4 py-3 text-white xl:py-1.5">
                      {row.treatment}
                    </td>
                    <td className="px-4 py-3 text-gray-400 xl:py-1.5">
                      {row.timeOut}
                    </td>
                    <td className="px-4 py-3 text-green-400 xl:py-1.5">
                      {row.notes}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No injuries or treatments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="card flex shrink-0 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between xl:py-2">
        <p className="text-xs text-gray-400">
          Treatments update fatigue, strain, burnout, injury duration, cash, and
          health history.
        </p>
        <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            className="btn-secondary min-h-10 justify-center text-xs"
            onClick={() => navigate("/training")}
          >
            <Activity className="h-4 w-4" /> Training
          </button>
          <button
            type="button"
            className="btn-secondary min-h-10 justify-center text-xs"
            onClick={() => navigate("/mental")}
          >
            <ShieldCheck className="h-4 w-4" /> Mental state
          </button>
          <button
            type="button"
            className="btn-secondary min-h-10 justify-center text-xs"
            onClick={continueWeek}
          >
            <HeartPulse className="h-4 w-4" /> Advance week
          </button>
        </div>
      </footer>
    </div>
  );
}
