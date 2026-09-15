import { TrainingWeekGrid } from '../components/career/TrainingWeekGrid';
import { SectionTabs } from '../components/ui/SectionTabs';
import { FormRecoveryPanel } from '../components/career/SeasonLifePanels';
import { formatPercent, formatAttribute, formatAttributeChange } from '../utils/formatters';
import { seasonWeekLabel } from "../game/seasonClock";
import { useState } from "react";
import { DevelopmentPanel } from "../components/career/CareerDepthPanels";
import { TrainingBasePanel } from '../components/career/RealismPanels';
import { previewTrainingDevelopment } from "../hooks/useGameState";
import { baseTrainingMultiplier } from '../game/realism/base';
import { protectPartnerSessions } from "../game/careerDepth/developmentProjects";
import { protectCommitmentSessions } from "../game/careerDepth/commitments";
import { depthOf, plusDays } from "../game/careerDepth/shared";
import { useNavigate } from "react-router-dom";
import { Activity, CalendarDays, ChevronRight, RotateCcw, Save, Sparkles, ShieldCheck, Target } from "lucide-react";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import {
  getFacilityTrainingMultiplier,
  getTrainingAdaptationMultiplier,
} from "../hooks/useGameState";
import { buildTrainingPlannerData } from "../utils/liveRouteData";
import {
  buildFocusedTrainingPlan,
  buildTrainingCell,
  cloneTrainingPlan,
  summarizeTrainingPlan,
  TRAINING_FOCUS_PRESETS,
  type TrainingFocusPresetId,
  type TrainingSessionKey,
} from "../utils/trainingPlan";

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
  >("custom");
  const summary = summarizeTrainingPlan(
    plannerWeek,
    {
      fatigue: gameState.player.fatigue,
      confidence: gameState.player.confidence,
    },
    gameState.attributes,
    currentCoach?.compatibility ?? 0,
  );
  const [summaryTab, setSummaryTab] = useState<"Plan" | "Development" | "Events">("Plan");
  const developmentGains = previewTrainingDevelopment(gameState, plannerWeek);
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
      value: `${formatPercent(summary.weekLoad)}`,
      score: summary.weekLoad,
      text: "text-white",
      bar: "green" as const,
    },
    {
      label: "Fatigue",
      value: `${formatPercent(gameState.player.fatigue)} → ${formatPercent(fatigueForecast)}`,
      score: fatigueForecast,
      text: riskTone(fatigueForecast),
      bar: riskBarTone(fatigueForecast),
    },
    {
      label: "Strain",
      value: `${formatPercent(gameState.trainingCondition.strain)} → ${formatPercent(strainForecast)}`,
      score: strainForecast,
      text: riskTone(strainForecast),
      bar: riskBarTone(strainForecast),
    },
    {
      label: "Adaptation",
      value: `${formatPercent(adaptationPreview)}`,
      score: adaptationPreview,
      text: "text-green-400",
      bar: "green" as const,
    },
  ];

  const dirty = JSON.stringify(plannerWeek) !== JSON.stringify(plannerData.week);
  const gainTotal = developmentGains.reduce((total, gain) => total + gain.value, 0);
  const balance = [...summary.balance, { label: "Rest & recovery", sessions: summary.restSessions, value: summary.restSessions / Math.max(1, summary.totalSessions) * 100, tone: "sky" }];
  return <div className="training-workspace" data-testid="training-planner">
    <header className="training-page-heading">
      <span className="training-heading-icon"><Activity aria-hidden="true" /></span>
      <div><p>Training planner</p><h1>Build This Week</h1><span>{seasonWeekLabel(gameState)} · {weekStart}–{weekEnd}</span></div>
      <div className="training-page-actions"><span className={dirty ? 'training-draft' : 'training-saved'} role="status">{dirty ? 'Unsaved changes' : 'Current schedule'}</span><button className="btn-secondary text-xs" onClick={() => { setSelectedFocus('custom'); setPlannerWeek(cloneTrainingPlan(plannerData.week)); }}><RotateCcw /> Reset</button><button className="btn-primary text-xs" onClick={() => applyTrainingPlan(plannerWeek)}><Save /> Apply Plan</button></div>
    </header>
    <div className="training-support-row" aria-label="Training support"><DevelopmentPanel compact /><FormRecoveryPanel compact /><TrainingBasePanel compact /></div>
    <section className="training-focus-panel" aria-label="Training focus">
      <header><Sparkles /><h2>Choose a focus</h2><p>Fill the week, then adjust individual sessions.</p></header>
      <div className="training-focus-options">{TRAINING_FOCUS_PRESETS.map(preset => <button key={preset.id} aria-pressed={selectedFocus === preset.id} onClick={() => chooseFocus(preset.id)}><strong>{preset.label}</strong><span>{preset.outcome}</span></button>)}</div>
    </section>
    <div className="training-work-area">
      <div className="training-schedule-column"><TrainingWeekGrid week={plannerWeek} onChange={changeSession} eventName={plannerData.enteredCompetitions[0]?.name} />
        <section className="training-forecasts" aria-label="Weekly forecast">{forecasts.map(card => <div key={card.label}><span>{card.label}</span><strong className={card.text}>{card.value}</strong><ProgressBar value={card.score} tone={card.bar} compact /></div>)}</section>
      </div>
      <aside className="training-outlook" aria-label="Training summary">
        <SectionTabs id="training-summary" label="Training summary" tabs={['Plan', 'Development', 'Events'] as const} active={summaryTab} onChange={setSummaryTab} />
        <div id="training-summary-panel" role="tabpanel" aria-labelledby={`training-summary-tab-${['Plan', 'Development', 'Events'].indexOf(summaryTab)}`} className="training-outlook-content">
          {summaryTab === 'Plan' && <>
            <section className="training-plan-card"><header><span className="training-eyebrow">Weekly approach</span>{selectedPreset ? <button onClick={() => chooseFocus(selectedPreset.id)}>Refill week <RotateCcw /></button> : <Target />}</header><h2>{selectedPreset?.label ?? (dirty ? 'Custom week' : 'Saved schedule')}</h2><p>{selectedPreset?.description ?? (dirty ? 'Your individually selected sessions.' : 'Your saved sessions for this week.')}</p><div className="training-risk"><span>Fatigue risk</span><strong className={riskTone(summary.fatigueRisk)}>{formatPercent(summary.fatigueRisk)}</strong></div><ProgressBar value={summary.fatigueRisk} tone={riskBarTone(summary.fatigueRisk)} compact /></section>
            <section className="training-balance-card"><header><h2>Weekly Balance</h2><span>{summary.totalSessions} sessions</span></header><div className="training-balance-list">{balance.map(item => <div className={`training-balance-${item.label.toLowerCase().replaceAll(' ', '-')}`} key={item.label}><span>{item.label}</span><strong>{item.sessions}</strong><ProgressBar value={item.value} compact /></div>)}</div><button onClick={() => navigate('/training/report')}>Full report <ChevronRight /></button></section>
          </>}
          {summaryTab === 'Development' && <section className="training-development-card"><header><span className="training-eyebrow">Projected gains</span><h2>Expected Development</h2><p>All modifiers applied · estimated</p></header><div className="training-gain-total"><strong>+{formatAttribute(gainTotal)}</strong><span>combined skill points</span></div><div className="training-development-list">{developmentGains.map(gain => <div key={gain.label}><span>{gain.label}</span><strong>{gain.value > 0 && gain.value < 0.005 ? '<0.01' : formatAttributeChange(gain.value)}</strong><ProgressBar value={Math.min(100, Math.max(0, gain.value) * 100)} compact /></div>)}{!developmentGains.length && <p>{gameState.trainingAppliedWeek === gameState.week ? 'This week’s gains are already applied.' : 'Recovery, competition or injury takes priority this week.'}</p>}</div><p className="training-outlook-note">A forecast of this plan, applied through the normal training settlement.</p></section>}
          {summaryTab === 'Events' && <section className="training-events-card"><header><ShieldCheck /><span className="training-eyebrow">Protect your schedule</span><h2>Competition Protection</h2></header><p>Review event and travel commitments alongside your training.</p><div className="training-event-list">{plannerData.enteredCompetitions.map(competition => <button key={competition.id} onClick={() => navigate(`/calendar?tournament=${encodeURIComponent(competition.id)}`)}><span className={competition.travelBooked ? 'training-saved' : 'training-draft'}>{competition.travelBooked ? 'Travel booked' : 'Travel pending'}</span><h3>{competition.name}</h3><p>{competition.date} · {competition.location}</p><span className="training-event-action">Review event <ChevronRight /></span></button>)}{!plannerData.enteredCompetitions.length && <div className="training-events-empty"><CalendarDays /><h3>No entered events</h3><p>No entered event is shaping this week.</p></div>}</div><button className="training-outlook-link" onClick={() => navigate('/calendar')}>Calendar <ChevronRight /></button></section>}
        </div>
      </aside>
    </div>
  </div>;
}
