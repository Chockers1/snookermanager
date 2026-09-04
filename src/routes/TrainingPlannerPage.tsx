import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Calendar, RotateCcw, Save, Sparkles } from "lucide-react";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import {
  getFacilityTrainingMultiplier,
  getTrainingAdaptationMultiplier,
} from "../hooks/useGameState";
import type { TrainingCell } from "../types/game";
import { buildTrainingPlannerData } from "../utils/liveRouteData";
import {
  buildFocusedTrainingPlan,
  buildTrainingCell,
  cloneTrainingPlan,
  getTrainingSessionOption,
  getTrainingSessionOptionId,
  summarizeTrainingPlan,
  TRAINING_FOCUS_PRESETS,
  TRAINING_SESSION_OPTIONS,
  type TrainingFocusPresetId,
  type TrainingSessionKey,
} from "../utils/trainingPlan";

const sessionRows = [
  { key: "morning", label: "Morning", time: "08:00–11:00" },
  { key: "afternoon", label: "Afternoon", time: "13:00–16:00" },
  { key: "evening", label: "Evening", time: "18:00–21:00" },
] as const;

const categoryStyles: Record<TrainingCell["category"], string> = {
  Technical: "border-green-600/30 bg-green-600/10 text-green-400",
  Mental: "border-amber-600/30 bg-amber-600/10 text-amber-400",
  Physical: "border-blue-600/30 bg-blue-600/10 text-blue-400",
  "Match Prep": "border-violet-600/30 bg-violet-600/10 text-violet-400",
  Recovery: "border-sky-600/30 bg-sky-600/10 text-sky-400",
  Travel: "border-gray-500/30 bg-gray-500/10 text-gray-400",
  Rest: "border-gray-600/30 bg-gray-600/10 text-gray-400",
};

function riskTone(value: number) {
  if (value >= 70) return "text-red-400";
  if (value >= 50) return "text-amber-400";
  return "text-green-400";
}

export function TrainingPlannerPage() {
  const { gameState } = useGame();
  const plannerKey = `${gameState.currentDate}-${gameState.week}-${JSON.stringify(gameState.trainingPlan)}`;
  return <TrainingPlannerContent key={plannerKey} />;
}

function TrainingPlannerContent() {
  const { gameState, applyTrainingPlan } = useGame();
  const navigate = useNavigate();
  const plannerData = buildTrainingPlannerData(gameState);
  const currentCoach = gameState.coaches.find(
    (coach) => coach.id === gameState.currentCoachId,
  );
  const competitionPlan = plannerData.enteredCompetitions.map(
    (competition) => ({
      name: competition.name,
      location: competition.location,
      startDate: competition.date,
    }),
  );
  const [plannerWeek, setPlannerWeek] = useState(
    cloneTrainingPlan(plannerData.week),
  );
  const [selectedFocus, setSelectedFocus] = useState<
    TrainingFocusPresetId | "custom"
  >("balanced");
  const summary = summarizeTrainingPlan(
    plannerWeek,
    {
      fatigue: gameState.player.fatigue,
      confidence: gameState.player.confidence,
    },
    gameState.attributes,
    currentCoach?.compatibility ?? 0,
  );
  const selectedPreset = TRAINING_FOCUS_PRESETS.find(
    (preset) => preset.id === selectedFocus,
  );
  const adaptationMultiplier =
    getTrainingAdaptationMultiplier(
      gameState.player.fatigue,
      gameState.trainingCondition.strain,
      gameState.trainingCondition.burnout,
    ) * getFacilityTrainingMultiplier(gameState.equipment);
  const adaptationPreview = Math.round(adaptationMultiplier * 100);
  const fatigueForecast = Math.max(
    0,
    Math.min(100, gameState.player.fatigue + summary.fatigueTrend),
  );
  const strainForecast = Math.max(
    0,
    Math.min(
      100,
      gameState.trainingCondition.strain +
        Math.round(Math.max(0, summary.weekLoad - 55) / 6) -
        Math.max(0, summary.restSessions - 4),
    ),
  );
  const weekStart = plannerWeek[0]?.dateLabel ?? gameState.currentDate;
  const weekEnd = plannerWeek.at(-1)?.dateLabel ?? gameState.currentDate;

  function chooseFocus(focusId: TrainingFocusPresetId) {
    setSelectedFocus(focusId);
    setPlannerWeek(
      buildFocusedTrainingPlan(
        focusId,
        gameState.currentDate,
        gameState.player.fatigue,
        competitionPlan,
        plannerData.travelBooked,
      ),
    );
  }

  function changeSession(
    dayIndex: number,
    sessionKey: TrainingSessionKey,
    optionId: string,
  ) {
    setSelectedFocus("custom");
    setPlannerWeek((currentWeek) => {
      const nextWeek = cloneTrainingPlan(currentWeek);
      nextWeek[dayIndex] = {
        ...nextWeek[dayIndex],
        [sessionKey]: buildTrainingCell(optionId),
      };
      return nextWeek;
    });
  }

  return (
    <div
      className="mx-auto flex w-full max-w-[1680px] flex-col gap-2 pb-6 xl:h-full xl:min-h-0 xl:overflow-hidden xl:pb-0"
      data-testid="training-planner"
    >
      <header className="flex shrink-0 flex-col gap-2 rounded-xl border border-border bg-surface/85 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400">
            Training Planner
          </p>
          <h1 className="mt-0.5 text-xl font-bold leading-tight text-white">
            Build This Week
          </h1>
          <p className="mt-0.5 text-[10px] text-gray-400">
            Week {gameState.week} · {weekStart}–{weekEnd} · changes apply when
            you confirm the plan
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary text-[11px]"
            onClick={() => {
              setSelectedFocus("custom");
              setPlannerWeek(cloneTrainingPlan(plannerData.week));
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            type="button"
            className="btn-primary text-[11px]"
            onClick={() => applyTrainingPlan(plannerWeek)}
          >
            <Save className="h-3.5 w-3.5" /> Apply Plan
          </button>
        </div>
      </header>

      <section className="card shrink-0 overflow-hidden">
        <div className="card-header py-2">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Auto-select a focus
            </h2>
            <p className="text-[10px] text-gray-500">
              Choose the outcome you want; event and travel sessions stay
              protected.
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-green-400" />
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-3 xl:grid-cols-7">
          {TRAINING_FOCUS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={selectedFocus === preset.id}
              onClick={() => chooseFocus(preset.id)}
              className={`min-h-12 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${selectedFocus === preset.id ? "border-green-500 bg-green-500/10 text-white" : "border-border bg-surface-light/35 text-gray-300 hover:border-gray-600"}`}
            >
              <span className="block text-xs font-semibold">
                {preset.label}
              </span>
              <span className="mt-0.5 block text-[9px] text-gray-500">
                {preset.outcome}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1 border-t border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-white">
              {selectedPreset?.label ?? "Custom week"}
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              {selectedPreset?.description ??
                "You have manually adjusted one or more sessions."}
            </p>
          </div>
          {selectedPreset ? (
            <button
              type="button"
              className="btn-secondary shrink-0 text-[10px]"
              onClick={() => chooseFocus(selectedPreset.id)}
            >
              Fill Week With This Focus
            </button>
          ) : null}
        </div>
      </section>

      <div className="scrollbar-thin min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
        <div className="grid min-h-0 gap-2 2xl:grid-cols-[minmax(0,1fr)_330px]">
          <section className="card flex min-h-0 flex-col overflow-hidden">
            <div className="card-header shrink-0 py-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Calendar className="h-3.5 w-3.5 text-green-400" /> Weekly
                  Schedule
                </h2>
                <p className="text-[10px] text-gray-500">
                  Every session remains editable.
                </p>
              </div>
              <span className="text-[10px] text-gray-400">
                {plannerData.enteredCompetitions[0]?.name ?? "No event entered"}
              </span>
            </div>
            <div className="scrollbar-thin grid min-h-0 gap-1.5 overflow-auto p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
              {plannerWeek.map((day, dayIndex) => (
                <article
                  key={`${day.day}-${day.dateLabel}`}
                  className="min-w-0 rounded-lg border border-border bg-surface-light/30 p-2"
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2 border-b border-border pb-1.5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                        {day.day}
                      </p>
                      <p
                        className={
                          day.competitionName
                            ? "text-[10px] text-amber-400"
                            : "text-[10px] text-gray-500"
                        }
                      >
                        {day.dateLabel}
                      </p>
                    </div>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] ${day.load >= 70 ? "bg-red-500/10 text-red-400" : day.load >= 50 ? "bg-amber-500/10 text-amber-400" : "bg-green-500/10 text-green-400"}`}
                    >
                      {day.loadLabel}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {sessionRows.map((row) => {
                      const session = day[row.key];
                      const option = getTrainingSessionOption(
                        getTrainingSessionOptionId(session),
                      );
                      return (
                        <label key={row.key} className="block">
                          <span className="mb-0.5 flex justify-between text-[9px]">
                            <span className="font-medium text-gray-300">
                              {row.label}
                            </span>
                            <span className="text-gray-600">{row.time}</span>
                          </span>
                          <select
                            value={getTrainingSessionOptionId(session)}
                            onChange={(event) =>
                              changeSession(
                                dayIndex,
                                row.key,
                                event.target.value,
                              )
                            }
                            className="min-h-8 w-full rounded-md border border-border bg-surface px-2 text-[10px] font-medium text-white focus:border-green-500/50 focus:outline-none"
                          >
                            {TRAINING_SESSION_OPTIONS.map((choice) => (
                              <option key={choice.id} value={choice.id}>
                                {choice.title}
                              </option>
                            ))}
                          </select>
                          <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span
                              className={`rounded border px-1.5 py-0.5 text-[8px] ${categoryStyles[session.category]}`}
                            >
                              {session.category}
                            </span>
                            <span className="truncate text-[8px] text-gray-500">
                              Load {option.load}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {day.competitionName ? (
                    <p className="mt-2 rounded bg-amber-500/10 px-2 py-1 text-[9px] text-amber-300">
                      Event: {day.competitionName}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <aside className="grid min-h-0 gap-2 sm:grid-cols-2 2xl:grid-cols-1">
            <section className="card overflow-hidden">
              <div className="card-header">
                <h2 className="text-sm font-semibold text-white">
                  Plan Forecast
                </h2>
                <span className="text-[10px] text-gray-500">
                  Before applying
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3">
                {[
                  ["Weekly load", `${summary.weekLoad}%`, summary.weekLoad],
                  [
                    "Fatigue",
                    `${gameState.player.fatigue}% → ${fatigueForecast}%`,
                    fatigueForecast,
                  ],
                  [
                    "Strain",
                    `${gameState.trainingCondition.strain}% → ${strainForecast}%`,
                    strainForecast,
                  ],
                  ["Adaptation", `${adaptationPreview}%`, adaptationPreview],
                ].map(([label, value, score]) => (
                  <div
                    key={label as string}
                    className="rounded-lg bg-surface-light/45 p-2.5"
                  >
                    <p className="text-[9px] uppercase tracking-[0.12em] text-gray-500">
                      {label}
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${label === "Fatigue" || label === "Strain" ? riskTone(Number(score)) : "text-white"}`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-border p-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">Fatigue risk</span>
                  <span className={riskTone(summary.fatigueRisk)}>
                    {summary.fatigueRisk}%
                  </span>
                </div>
                <ProgressBar
                  value={summary.fatigueRisk}
                  tone={
                    summary.fatigueRisk >= 70
                      ? "red"
                      : summary.fatigueRisk >= 50
                        ? "amber"
                        : "green"
                  }
                  compact
                />
                <p className="text-[10px] leading-relaxed text-gray-400">
                  Facility, current fatigue, body strain, burnout and coach fit
                  are included in this forecast.
                </p>
              </div>
            </section>

            <section className="card overflow-hidden">
              <div className="card-header">
                <h2 className="text-sm font-semibold text-white">
                  Expected Development
                </h2>
                <span className="text-[10px] text-green-400">
                  Modified gains
                </span>
              </div>
              <div className="space-y-2 p-3">
                {summary.expectedGains.map((gain) => {
                  const adjusted = Math.max(
                    0,
                    Math.round(
                      gain.value *
                        adaptationMultiplier *
                        (1 + summary.coachImpact / 100) *
                        10,
                    ) / 10,
                  );
                  return (
                    <div key={gain.label}>
                      <div className="mb-1 flex justify-between text-[10px]">
                        <span className="text-gray-400">{gain.label}</span>
                        <span className="font-semibold text-green-400">
                          +{adjusted}
                        </span>
                      </div>
                      <ProgressBar
                        value={Math.min(100, adjusted * 15)}
                        compact
                      />
                    </div>
                  );
                })}
              </div>
              <p className="border-t border-border px-3 py-2 text-[9px] leading-relaxed text-gray-500">
                Preview values are estimates. Actual gains are applied when the
                week advances.
              </p>
            </section>
          </aside>
        </div>

        <div className="grid gap-2 lg:grid-cols-2">
          <section className="card overflow-hidden">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-white">
                Competition Protection
              </h2>
              <button
                type="button"
                className="text-[10px] text-green-400"
                onClick={() => navigate("/calendar")}
              >
                Open Calendar
              </button>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2">
              {plannerData.enteredCompetitions.length ? (
                plannerData.enteredCompetitions
                  .slice(0, 4)
                  .map((competition) => (
                    <div
                      key={competition.id}
                      className="rounded-lg bg-surface-light/45 p-3"
                    >
                      <div className="flex justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-white">
                          {competition.name}
                        </p>
                        <span
                          className={
                            competition.travelBooked
                              ? "text-[9px] text-green-400"
                              : "text-[9px] text-amber-400"
                          }
                        >
                          {competition.travelBooked
                            ? "Travel booked"
                            : "Travel pending"}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-gray-400">
                        {competition.date} · {competition.location}
                      </p>
                      <p className="mt-1 text-[9px] text-gray-500">
                        {competition.daysAway <= 0
                          ? "Event week is live"
                          : `${competition.daysAway} days away`}{" "}
                        · protected in every preset
                      </p>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-gray-400">
                  No entered event is currently shaping the plan.
                </p>
              )}
            </div>
          </section>
          <section className="card overflow-hidden">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-white">
                Weekly Balance
              </h2>
              <button
                type="button"
                className="text-[10px] text-green-400"
                onClick={() => navigate("/training/report")}
              >
                <Activity className="mr-1 inline h-3 w-3" /> Training Report
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 sm:grid-cols-4">
              {summary.balance.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-[10px]">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white">{item.sessions}</span>
                  </div>
                  <ProgressBar value={item.value} compact />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
