import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Brain,
  Check,
  ChevronRight,
  Flame,
  Target,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import { buildMentalStateData } from "../utils/liveRouteData";
import { formatPercent } from "../utils/formatters";

function toneClass(tone: "green" | "amber" | "red") {
  if (tone === "red") return "text-red-400";
  if (tone === "amber") return "text-amber-400";
  return "text-green-400";
}

function progressTone(value: number): "green" | "amber" | "red" {
  if (value >= 70) return "green";
  if (value >= 45) return "amber";
  return "red";
}

export function MentalStatePage() {
  const { gameState, applyRecoveryPlan, continueWeek } = useGame();
  const navigate = useNavigate();
  const mentalData = buildMentalStateData(gameState);
  const [selectedPlanTitle, setSelectedPlanTitle] = useState(
    mentalData.actionPlan[0]?.title ?? "",
  );
  const selectedPlan =
    mentalData.actionPlan.find((item) => item.title === selectedPlanTitle) ??
    mentalData.actionPlan[0];

  return (
    <div
      className="mx-auto flex w-full max-w-[1680px] flex-col gap-3 pb-4 xl:-m-6 xl:h-[calc(100vh-5.5rem)] xl:w-[calc(100%+3rem)] xl:max-w-none xl:gap-2 xl:overflow-hidden xl:p-1.5 xl:pb-1.5"
      data-testid="mental-viewport"
    >
      <header className="card flex shrink-0 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between xl:py-2">
        <div className="min-w-0">
          <p className="metric-label text-green-400">Mental performance</p>
          <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
            Mental State
          </h1>
          <p className="mt-1 text-xs text-gray-400 xl:hidden">
            See what is affecting performance and choose one clear recovery
            plan.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary min-h-10 shrink-0 justify-center text-xs"
          onClick={() => applyRecoveryPlan(selectedPlanTitle)}
        >
          Apply selected plan <ChevronRight className="h-4 w-4" />
        </button>
      </header>

      <section
        aria-label="Mental state summary"
        className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
      >
        {mentalData.metrics.slice(0, 6).map((metric) => (
          <article
            key={metric.label}
            className="card min-w-0 px-3 py-3 xl:py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="metric-label truncate">{metric.label}</p>
              <span
                className={`text-[10px] font-medium ${toneClass(metric.tone)}`}
              >
                {metric.detail}
              </span>
            </div>
            <p className="my-2 text-2xl font-bold leading-none text-white xl:my-1 xl:text-xl">
              {formatPercent(metric.value)}
            </p>
            <ProgressBar value={metric.value} tone={metric.tone} compact />
          </article>
        ))}
      </section>

      <div className="grid min-h-0 min-w-0 gap-3 xl:flex-1 xl:grid-cols-12 xl:gap-2">
        <div className="min-h-0 min-w-0 space-y-3 xl:col-span-8 xl:grid xl:grid-rows-[auto_auto_minmax(0,1fr)] xl:gap-2 xl:space-y-0">
          <section className="card overflow-hidden">
            <div className="card-header py-2.5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Brain className="h-4 w-4 text-amber-400" /> Current diagnosis
              </h2>
              <span className="text-xs text-amber-400">
                Severity {mentalData.diagnosis.severity}%
              </span>
            </div>
            <div className="grid gap-3 p-3 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white">
                  {mentalData.diagnosis.title}
                </h3>
                <p className="mt-1 text-xs leading-4 text-gray-400">
                  {mentalData.diagnosis.description}
                </p>
                <ul className="mt-2 grid gap-1 text-[11px] text-gray-300 sm:grid-cols-2">
                  {mentalData.diagnosis.factors.map((factor) => (
                    <li key={factor} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                <div className="rounded-lg border border-border bg-surface-light/40 p-3">
                  <p className="metric-label">Recovery outlook</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {mentalData.diagnosis.recoveryOutlook}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-light/40 p-3">
                  <p className="metric-label">Recovery chance</p>
                  <p className="mt-2 text-lg font-bold text-green-400">
                    {mentalData.diagnosis.recoveryChance}%
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="card-header py-2.5">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Recovery plans
                </h2>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Select a plan to preview its time and effect.
                </p>
              </div>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2">
              {mentalData.actionPlan.map((item) => {
                const selected = selectedPlanTitle === item.title;
                return (
                  <button
                    key={item.title}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedPlanTitle(item.title)}
                    className={`min-h-28 rounded-lg border p-3 text-left transition xl:min-h-0 xl:p-2 ${selected ? "border-green-500/50 bg-green-600/10" : "border-border bg-surface-light/35 hover:border-border-light"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      {selected ? (
                        <Check className="h-4 w-4 shrink-0 text-green-400" />
                      ) : null}
                    </div>
                    <p
                      className={`mt-1 text-xs font-medium ${item.effectTone === "red" ? "text-red-400" : "text-green-400"}`}
                    >
                      {item.effect}
                    </p>
                    <p className="mt-2 text-xs leading-4 text-gray-400 xl:line-clamp-1 xl:mt-1">
                      {item.description}
                    </p>
                    <p className="mt-2 text-[10px] text-gray-500 xl:mt-1">
                      {item.time} · Cost {item.cost}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card flex min-h-0 flex-col overflow-hidden">
            <div className="card-header py-2.5">
              <h2 className="text-sm font-semibold text-white">
                Six-week mental trend
              </h2>
              <div className="hidden gap-3 text-[10px] text-gray-400 sm:flex">
                <span className="text-green-400">Confidence</span>
                <span className="text-red-400">Stress</span>
                <span className="text-blue-400">Focus</span>
              </div>
            </div>
            <div className="h-56 min-h-0 min-w-0 p-3 sm:h-64 xl:h-auto xl:flex-1">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
                initialDimension={{ width: 600, height: 240 }}
              >
                <LineChart data={mentalData.trend}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#141e2a",
                      border: "1px solid #1e2d3d",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="focus"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <aside className="min-h-0 min-w-0 space-y-3 xl:col-span-4 xl:grid xl:grid-cols-2 xl:grid-rows-[auto_auto_auto] xl:gap-2 xl:space-y-0">
          <section className="card border-green-600/30 bg-green-600/5 p-4 xl:p-3">
            <p className="metric-label text-green-400">Selected plan</p>
            <h2 className="mt-2 text-lg font-bold text-white">
              {selectedPlan?.title}
            </h2>
            <p className="mt-2 text-xs leading-5 text-gray-400 xl:line-clamp-2 xl:leading-4">
              {selectedPlan?.description}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded bg-surface/70 p-2.5">
                <p className="metric-label">Expected effect</p>
                <p className="mt-1 text-xs font-semibold text-green-400">
                  {selectedPlan?.effect}
                </p>
              </div>
              <div className="rounded bg-surface/70 p-2.5">
                <p className="metric-label">Time</p>
                <p className="mt-1 text-xs font-semibold text-white">
                  {selectedPlan?.time}
                </p>
              </div>
            </div>
          </section>

          <section className="card p-4 xl:p-3">
            <p className="metric-label">Recommended next focus</p>
            <h2 className="mt-2 text-lg font-bold text-green-400">
              {mentalData.nextFocus.title}
            </h2>
            <ul className="mt-3 space-y-2 text-xs text-gray-300 xl:mt-2 xl:space-y-1">
              {mentalData.nextFocus.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-4 xl:p-3">
            <p className="metric-label">Recovery progress</p>
            <div className="mt-3 space-y-3 xl:mt-2 xl:space-y-2">
              {mentalData.recoveryProgress.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between gap-3 text-xs">
                    <span className="truncate text-gray-400">{item.label}</span>
                    <span className="text-white">{formatPercent(item.value)}</span>
                  </div>
                  <ProgressBar
                    value={item.value}
                    tone={progressTone(item.value)}
                    compact
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4 xl:p-3">
            <p className="metric-label">Recent triggers</p>
            <div className="mt-3 space-y-2 xl:mt-2 xl:space-y-1">
              {mentalData.triggers.map((trigger) => (
                <div
                  key={trigger.label}
                  className="flex items-start justify-between gap-3 rounded bg-surface-light/40 p-2.5 text-xs xl:p-1.5 xl:text-[10px]"
                >
                  <span className="text-gray-300">{trigger.label}</span>
                  <span className="shrink-0 text-gray-500">
                    {trigger.timing}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4 xl:col-span-2 xl:p-3">
            <p className="metric-label">Coach note</p>
            <p className="mt-2 text-xs italic leading-5 text-gray-400 xl:line-clamp-2 xl:mt-1 xl:leading-4">
              {mentalData.nextFocus.psychologistNote}
            </p>
          </section>
        </aside>
      </div>

      <footer className="card flex shrink-0 flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between xl:py-2">
        <p className="flex min-w-0 items-start gap-2 text-xs text-gray-400">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          Confidence {formatPercent(gameState.player.confidence)}, fatigue{" "}
          {gameState.player.fatigue}%, morale {gameState.player.morale}%.
          Recovery choices update the live save.
        </p>
        <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            className="btn-secondary min-h-10 justify-center text-xs"
            onClick={() => navigate("/training")}
          >
            <Flame className="h-4 w-4" /> Training
          </button>
          <button
            type="button"
            className="btn-secondary min-h-10 justify-center text-xs"
            onClick={continueWeek}
          >
            <Target className="h-4 w-4" /> Advance week
          </button>
          <button
            type="button"
            className="btn-primary min-h-10 justify-center text-xs"
            onClick={() => applyRecoveryPlan(selectedPlanTitle)}
          >
            Apply plan
          </button>
        </div>
      </footer>
    </div>
  );
}
