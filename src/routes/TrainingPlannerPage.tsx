import { useState } from "react";
import { DevelopmentPanel } from "../components/career/CareerDepthPanels";
import { TrainingBasePanel } from '../components/career/RealismPanels';
import { developmentTrainingBonus } from "../game/careerDepth/developmentProjects";
import { baseTrainingMultiplier } from '../game/realism/base';
import { protectPartnerSessions } from "../game/careerDepth/developmentProjects";
import { protectCommitmentSessions } from "../game/careerDepth/commitments";
import { depthOf, plusDays } from "../game/careerDepth/shared";
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
  return value >= 70
    ? "text-red-400"
    : value >= 50
      ? "text-amber-400"
      : "text-green-400";
}
function riskBarTone(value: number): "red" | "amber" | "green" {
  return value >= 70 ? "red" : value >= 50 ? "amber" : "green";
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
    ) * Math.min(1.15, getFacilityTrainingMultiplier(gameState.equipment) * baseTrainingMultiplier({ ...gameState, trainingPlan: plannerWeek }));
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
      protectCommitmentSessions(gameState, protectPartnerSessions(gameState, buildFocusedTrainingPlan(
        focusId,
        plusDays(depthOf(gameState).nextSettlementDate, -7),
        gameState.player.fatigue,
        competitionPlan,
        plannerData.travelBooked,
      ))),
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
  const forecasts = [
    {
      label: "Weekly load",
      value: `${summary.weekLoad}%`,
      score: summary.weekLoad,
      text: "text-white",
      bar: "green" as const,
    },
    {
      label: "Fatigue",
      value: `${gameState.player.fatigue}% → ${fatigueForecast}%`,
      score: fatigueForecast,
      text: riskTone(fatigueForecast),
      bar: riskBarTone(fatigueForecast),
    },
    {
      label: "Strain",
      value: `${gameState.trainingCondition.strain}% → ${strainForecast}%`,
      score: strainForecast,
      text: riskTone(strainForecast),
      bar: riskBarTone(strainForecast),
    },
    {
      label: "Adaptation",
      value: `${adaptationPreview}%`,
      score: adaptationPreview,
      text: "text-green-400",
      bar: "green" as const,
    },
  ];

  return (
    <div
      className="mx-auto flex w-full max-w-[1680px] flex-col gap-2 pb-5 xl:h-full xl:min-h-0 xl:overflow-hidden xl:pb-0"
      data-testid="training-planner"
    >
      <DevelopmentPanel />
      <TrainingBasePanel />
      <header className="flex shrink-0 flex-col gap-2 rounded-xl border border-border bg-surface/85 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-green-400">
            Training Planner
          </p>
          <h1 className="text-lg font-bold text-white">Build This Week</h1>
          <p className="text-[9px] text-gray-400">
            Week {gameState.week} · {weekStart}–{weekEnd} · choose, check, apply
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary text-[10px]"
            onClick={() => {
              setSelectedFocus("custom");
              setPlannerWeek(cloneTrainingPlan(plannerData.week));
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            type="button"
            className="btn-primary text-[10px]"
            onClick={() => applyTrainingPlan(plannerWeek)}
          >
            <Save className="h-3.5 w-3.5" /> Apply Plan
          </button>
        </div>
      </header>

      <section className="card shrink-0 p-2">
        <div className="mb-1.5 flex items-center gap-2 px-1">
          <Sparkles className="h-3.5 w-3.5 text-green-400" />
          <h2 className="text-xs font-semibold">Choose a focus</h2>
          <span className="hidden text-[8px] text-gray-500 md:inline">
            Auto-fills the week · event and travel sessions remain protected
          </span>
        </div>
        <div className="scrollbar-thin grid auto-cols-[145px] grid-flow-col gap-1.5 overflow-x-auto xl:grid-flow-row xl:grid-cols-7">
          {TRAINING_FOCUS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={selectedFocus === preset.id}
              onClick={() => chooseFocus(preset.id)}
              className={`min-h-10 rounded-lg border px-2.5 py-1 text-left ${selectedFocus === preset.id ? "border-green-500 bg-green-500/10 text-white" : "border-border bg-surface-light/35 text-gray-300"}`}
            >
              <span className="block truncate text-[10px] font-semibold">
                {preset.label}
              </span>
              <span className="block truncate text-[8px] text-gray-500">
                {preset.outcome}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto xl:overflow-hidden">
        <div className="grid min-h-full gap-2 xl:h-full xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="flex min-h-0 flex-col gap-2">
            <section className="card flex min-h-[390px] flex-1 flex-col overflow-hidden xl:min-h-0">
              <div className="card-header shrink-0 py-2">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-green-400" /> Weekly
                    Timetable
                  </h2>
                  <p className="text-[8px] text-gray-500">
                    Select any session to change it
                  </p>
                </div>
                <span className="max-w-[45%] truncate text-[8px] text-gray-400">
                  {plannerData.enteredCompetitions[0]?.name ??
                    "No event entered"}
                </span>
              </div>
              <div className="scrollbar-thin hidden min-h-0 flex-1 overflow-auto p-2 md:block">
                <div className="grid min-w-[980px] grid-cols-[72px_repeat(7,minmax(118px,1fr))] gap-1.5">
                  <div className="flex items-end px-1 pb-1 text-[8px] uppercase text-gray-600">
                    Session
                  </div>
                  {plannerWeek.map((day) => (
                    <div
                      key={`head-${day.day}`}
                      className="rounded-md border border-border bg-surface-light/35 px-2 py-1.5"
                    >
                      <div className="flex justify-between gap-1">
                        <b className="text-[10px]">{day.day}</b>
                        <span
                          className={`rounded px-1 text-[7px] ${day.load >= 70 ? "bg-red-500/10 text-red-400" : day.load >= 50 ? "bg-amber-500/10 text-amber-400" : "bg-green-500/10 text-green-400"}`}
                        >
                          {day.loadLabel}
                        </span>
                      </div>
                      <p
                        className={
                          day.competitionName
                            ? "text-[8px] text-amber-400"
                            : "text-[8px] text-gray-500"
                        }
                      >
                        {day.dateLabel}
                      </p>
                    </div>
                  ))}
                  {sessionRows.flatMap((row) => [
                    <div
                      key={`label-${row.key}`}
                      className="flex flex-col justify-center rounded-md bg-surface-light/20 px-2"
                    >
                      <b className="text-[9px] text-gray-300">{row.label}</b>
                      <span className="text-[7px] text-gray-600">
                        {row.time}
                      </span>
                    </div>,
                    ...plannerWeek.map((day, dayIndex) => {
                      const session = day[row.key];
                      const option = getTrainingSessionOption(
                        getTrainingSessionOptionId(session),
                      );
                      return (
                        <label
                          key={`${day.day}-${row.key}`}
                          className="min-w-0 rounded-md border border-border bg-surface-light/25 p-1.5"
                        >
                          <select
                            aria-label={`${day.day} ${row.label}`}
                            disabled={Boolean(day.careerCommitmentId)}
                            title={day.careerCommitmentId ? session.subtitle : session.subtitle.startsWith('Practice partner:') ? session.subtitle : undefined}
                            value={getTrainingSessionOptionId(session)}
                            onChange={(event) =>
                              changeSession(
                                dayIndex,
                                row.key,
                                event.target.value,
                              )
                            }
                            className="h-8 w-full rounded border border-border bg-surface px-1.5 text-[9px] font-medium text-white"
                          >
                            <option value="" disabled>
                              Select session
                            </option>
                            {TRAINING_SESSION_OPTIONS.map((choice) => (
                              <option key={choice.id} value={choice.id}>
                                {choice.title}
                              </option>
                            ))}
                          </select>
                          <span className="mt-1 flex justify-between gap-1">
                            <span
                              className={`truncate rounded border px-1 text-[7px] ${categoryStyles[session.category]}`}
                            >
                              {session.category}
                            </span>
                            <span className="text-[7px] text-gray-500">
                              {option.load}
                            </span>
                          </span>
                        </label>
                      );
                    }),
                  ])}
                </div>
              </div>
              <div className="grid gap-2 p-2 md:hidden">
                {plannerWeek.map((day, dayIndex) => (
                  <article
                    key={`mobile-${day.day}`}
                    className="rounded-lg border border-border bg-surface-light/25 p-2.5"
                  >
                    <div className="mb-2 flex justify-between">
                      <b className="text-xs">
                        {day.day}{" "}
                        <span className="font-normal text-gray-500">
                          {day.dateLabel}
                        </span>
                      </b>
                      <span className="text-[9px] text-green-400">
                        {day.loadLabel}
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {sessionRows.map((row) => {
                        const session = day[row.key];
                        return (
                          <label key={`${day.day}-${row.key}`}>
                            <span className="mb-1 block text-[8px] uppercase text-gray-500">
                              {row.label}
                            </span>
                              <select
                              aria-label={`${day.day} ${row.label}`}
                              disabled={Boolean(day.careerCommitmentId)}
                              title={day.careerCommitmentId ? session.subtitle : undefined}
                              value={getTrainingSessionOptionId(session)}
                              onChange={(event) =>
                                changeSession(
                                  dayIndex,
                                  row.key,
                                  event.target.value,
                                )
                              }
                              className="min-h-10 w-full rounded-md border border-border bg-surface px-2 text-[10px] text-white"
                            >
                              {TRAINING_SESSION_OPTIONS.map((choice) => (
                                <option key={choice.id} value={choice.id}>
                                  {choice.title}
                                </option>
                              ))}
                            </select>
                          </label>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section className="grid shrink-0 grid-cols-2 gap-1.5 lg:grid-cols-4">
              {forecasts.map((card) => (
                <div key={card.label} className="card px-3 py-2">
                  <div className="mb-1.5 flex justify-between gap-2">
                    <span className="text-[8px] uppercase text-gray-500">
                      {card.label}
                    </span>
                    <b className={`text-sm ${card.text}`}>{card.value}</b>
                  </div>
                  <ProgressBar value={card.score} tone={card.bar} compact />
                </div>
              ))}
            </section>
          </div>

          <aside className="scrollbar-thin flex min-h-0 flex-col gap-2 overflow-y-auto">
            <section className="card shrink-0 border-green-500/25 p-3">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-green-400">
                    Current plan
                  </p>
                  <h2 className="mt-1 text-sm font-bold">
                    {selectedPreset?.label ?? "Custom week"}
                  </h2>
                </div>
                {selectedPreset ? (
                  <button
                    type="button"
                    className="btn-secondary shrink-0 px-2 py-1 text-[9px]"
                    onClick={() => chooseFocus(selectedPreset.id)}
                  >
                    Refill week
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-gray-400">
                {selectedPreset?.description ??
                  "You have manually adjusted one or more sessions."}
              </p>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-[9px]">
                <span className="text-gray-400">Fatigue risk</span>
                <b className={riskTone(summary.fatigueRisk)}>
                  {summary.fatigueRisk}%
                </b>
              </div>
            </section>
            <section className="card shrink-0 overflow-hidden">
              <div className="card-header py-2">
                <div>
                  <h2 className="text-xs font-semibold">
                    Expected Development
                  </h2>
                  <p className="text-[8px] text-gray-500">
                    All modifiers applied
                  </p>
                </div>
                <span className="text-[8px] text-green-400">Estimated</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3">
                {summary.expectedGains.map((gain) => {
                  const adjusted = Math.max(
                    0,
                    Math.round(
                      gain.value *
                        adaptationMultiplier *
                        developmentTrainingBonus(gameState, plannerWeek, gain.label) *
                        (1 + summary.coachImpact / 100) *
                        10,
                    ) / 10,
                  );
                  return (
                    <div key={gain.label}>
                      <div className="mb-1 flex justify-between gap-2 text-[9px]">
                        <span className="truncate text-gray-400">
                          {gain.label}
                        </span>
                        <b className="text-green-400">+{adjusted}</b>
                      </div>
                      <ProgressBar
                        value={Math.min(100, adjusted * 15)}
                        compact
                      />
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="card shrink-0 p-3">
              <div className="mb-2 flex justify-between">
                <h2 className="text-xs font-semibold">Weekly Balance</h2>
                <button
                  type="button"
                  className="text-[9px] text-green-400"
                  onClick={() => navigate("/training/report")}
                >
                  <Activity className="mr-1 inline h-3 w-3" />
                  Full report
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {summary.balance.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-[8px]">
                      <span className="text-gray-400">{item.label}</span>
                      <span>{item.sessions}</span>
                    </div>
                    <ProgressBar value={item.value} compact />
                  </div>
                ))}
              </div>
            </section>
            <section className="card shrink-0 p-3">
              <div className="flex justify-between">
                <h2 className="text-xs font-semibold">
                  Competition Protection
                </h2>
                <button
                  type="button"
                  className="text-[9px] text-green-400"
                  onClick={() => navigate("/calendar")}
                >
                  Calendar
                </button>
              </div>
              {plannerData.enteredCompetitions.length ? (
                <div className="mt-2 space-y-1.5">
                  {plannerData.enteredCompetitions
                    .slice(0, 2)
                    .map((competition) => (
                      <div
                        key={competition.id}
                        className="rounded-md bg-surface-light/40 p-2"
                      >
                        <div className="flex justify-between gap-2">
                          <b className="truncate text-[9px]">
                            {competition.name}
                          </b>
                          <span
                            className={
                              competition.travelBooked
                                ? "shrink-0 text-[8px] text-green-400"
                                : "shrink-0 text-[8px] text-amber-400"
                            }
                          >
                            {competition.travelBooked
                              ? "Travel booked"
                              : "Travel pending"}
                          </span>
                        </div>
                        <p className="truncate text-[8px] text-gray-500">
                          {competition.date} · {competition.location}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="mt-2 text-[9px] text-gray-500">
                  No entered event is shaping this week.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
