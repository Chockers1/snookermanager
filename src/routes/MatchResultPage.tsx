import { MatchReviewPanel } from "../components/career/MatchInsightPanels";
import { GroupFixtures } from '../components/tournaments/GroupFixtures';
import { isGroupDraw } from '../game/championshipLeague';
import { useNavigate } from "react-router-dom";
import { RivalryContext, CareerDecisionNotice } from "../components/career/CareerDepthPanels";
import {
  Award,
  ChevronRight,
  ShieldCheck,
  SignalHigh,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import { buildMatchResultData } from "../utils/liveRouteData";
import { formatMoney, formatPercent } from "../utils/formatters";
import { countsForWorldRanking, rankingEventKey } from "../game/rollingRankings";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function feedbackTone(tone: "green" | "amber" | "blue") {
  if (tone === "green") return "text-green-400";
  if (tone === "amber") return "text-amber-400";
  return "text-sky-400";
}

function signedValue(value: number | undefined, suffix = "") {
  const amount = value ?? 0;
  return `${amount > 0 ? "+" : ""}${amount}${suffix}`;
}

export function MatchResultPage() {
  const { gameState } = useGame();
  const navigate = useNavigate();
  const latestMatch = gameState.matches[0];
  const {
    equipmentImpact,
    coachFeedback,
    matchSummary,
    strengthBreakdown,
    matchModifiers,
    resultExplanation,
    improvementAdvice,
    pressureDiagnosis,
  } = buildMatchResultData(gameState);
  const latestTournament = gameState.tournaments.find(
    (item) => item.id === latestMatch?.tournamentId,
  );
  const playerName = latestMatch?.playerName ?? gameState.player.fullName;
  const opponentName = latestMatch?.opponentName ?? "Opponent TBD";
  const playerFrames = latestMatch?.playerFrames ?? 0;
  const opponentFrames = latestMatch?.opponentFrames ?? 0;
  const playerWon = latestMatch?.result === "Won";
  const drawn = latestMatch?.result === "Drawn";
  const groupCompetition = isGroupDraw(gameState.tournamentProgress.draw) && gameState.tournamentProgress.tournamentId === latestMatch?.tournamentId;
  const tournamentContinues = Boolean(
    latestMatch &&
    gameState.tournamentProgress.tournamentId === latestMatch.tournamentId &&
    gameState.tournamentProgress.currentRound,
  );
  const frameRows = latestMatch?.frameHistory?.length
    ? latestMatch.frameHistory
    : [];
  const statRows = latestMatch
    ? [
        {
          label: "Pot Success",
          player: `${latestMatch.potSuccess}%`,
          opponent: null,
        },
        {
          label: "Long Pot",
          player: `${latestMatch.longPotSuccess}%`,
          opponent: null,
        },
        {
          label: "Safety",
          player: `${latestMatch.safetySuccess}%`,
          opponent: null,
        },
        {
          label: "Highest Break",
          player: latestMatch.highestBreak,
          opponent: latestMatch.opponentHighestBreak,
        },
        { label: "Centuries", player: latestMatch.centuries, opponent: null },
        { label: "50+ Breaks", player: latestMatch.fifties, opponent: null },
        { label: "Fouls", player: latestMatch.fouls, opponent: null },
      ]
    : [];
  const careerImpact = [
    {
      label: "Prize Money",
      value: formatMoney(latestMatch?.prizeMoneyEarned ?? 0),
      color: "text-green-400",
      icon: Award,
    },
    {
      label: latestTournament && countsForWorldRanking(latestTournament) ? "Ranking Earnings" : "Ranking Points",
      value: latestTournament && countsForWorldRanking(latestTournament)
        ? formatMoney(gameState.rollingRankings?.earnings.find(e => e.eventKey === rankingEventKey(latestTournament) && e.playerName === playerName)?.amount ?? 0)
        : signedValue(latestMatch?.rankingPointsGained),
      sub: latestTournament && countsForWorldRanking(latestTournament) ? tournamentContinues ? "Final award decided on event exit" : `Counts at event finish: ${latestTournament.endDate ?? latestTournament.startDate}` : undefined,
      color: "text-white",
      icon: TrendingUp,
    },
    {
      label: "Confidence",
      value: signedValue(latestMatch?.confidenceChange, "%"),
      sub: `Now ${formatPercent(gameState.player.confidence)}`,
      color:
        (latestMatch?.confidenceChange ?? 0) >= 0
          ? "text-green-400"
          : "text-red-400",
      icon: Zap,
    },
    {
      label: "Fatigue",
      value: signedValue(latestMatch?.fatigueChange, "%"),
      sub: `Now ${gameState.player.fatigue}%`,
      color: "text-amber-400",
      icon: TrendingUp,
    },
    {
      label: "Sponsor Bonus",
      value: formatMoney(latestMatch?.sponsorBonusEarned ?? 0),
      color: "text-green-400",
      icon: Award,
    },
    {
      label: "Cue Familiarity",
      value: signedValue(latestMatch?.familiarityGained, "%"),
      color: "text-sky-400",
      icon: SignalHigh,
    },
  ];
  const systemChanges = [
    {
      label: "Sponsor Bonus",
      value: formatMoney(latestMatch?.sponsorBonusEarned ?? 0),
      detail:
        (latestMatch?.sponsorBonusEarned ?? 0) > 0
          ? "Paid to finance ledger"
          : "No clause triggered",
      tone: "text-green-400",
    },
    {
      label: "Equipment Wear",
      value: `-${latestMatch?.equipmentWear ?? 0}%`,
      detail: "Active cue condition",
      tone: "text-amber-400",
    },
    {
      label: "Cue Familiarity",
      value: `+${latestMatch?.familiarityGained ?? 0}%`,
      detail: "Gained from match use",
      tone: "text-sky-400",
    },
    {
      label: "Strain Penalty",
      value: `-${latestMatch?.strainImpact ?? 0}`,
      detail: `Current strain ${gameState.trainingCondition.strain}%`,
      tone:
        (latestMatch?.strainImpact ?? 0) > 0
          ? "text-red-400"
          : "text-green-400",
    },
  ];

  if (!latestMatch) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">
            Match Centre
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Match Result</h1>
        </div>
        <div className="card card-body p-8 text-center">
          <Trophy className="mx-auto h-14 w-14 text-gray-500" />
          <p className="mt-4 text-xl font-semibold text-white">
            No completed match yet
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Play or simulate a match before opening the result breakdown.
          </p>
          <button
            type="button"
            onClick={() => navigate("/tournaments/hub")}
            className="btn-primary mx-auto mt-6 text-xs"
          >
            Go To Tournament Hub
          </button>
        </div>
      </div>
    );
  }

  const primaryRoute = tournamentContinues
    ? "/tournaments/hub"
    : `/tournaments/draw?tournament=${encodeURIComponent(latestMatch.tournamentId)}`;
  const primaryLabel = tournamentContinues
    ? "Continue Tournament"
    : "View Completed Bracket";

  return (
    <div className="space-y-3 pb-8">
      <CareerDecisionNotice />
      <RivalryContext opponent={latestMatch.opponentName} />
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-green-400">
            {latestTournament?.name ?? "Completed match"} · {latestMatch.round}{" "}
            · Best of {latestMatch.bestOf}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Match Review</h1>
          <p className="mt-1 text-xs text-gray-400">
            {tournamentContinues
              ? "Match complete · your tournament continues"
              : `Event complete · ${playerWon && latestMatch.round === "Final" ? "tournament won" : `eliminated in the ${latestMatch.round}`}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(primaryRoute)}
          className="btn-primary shrink-0 text-xs"
        >
          {primaryLabel} <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {groupCompetition && <div className="card max-h-[34rem] overflow-y-auto p-3"><GroupFixtures key={latestMatch.id} rounds={gameState.tournamentProgress.draw} playerName={playerName} currentRound={latestMatch.round} /></div>}
      <section
        className={`grid overflow-hidden rounded-xl border bg-surface md:grid-cols-[1fr_190px_1fr] ${drawn ? "border-amber-500/30" : playerWon ? "border-green-600/30" : "border-red-600/30"}`}
      >
        <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border font-bold ${playerWon ? "border-green-500 bg-green-600/15 text-green-400" : "border-border bg-surface-light text-white"}`}
          >
            {getInitials(playerName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-white">
              {playerName}
            </p>
            <p className="text-xs text-gray-400">
              {gameState.player.rankingLabel} #
              {gameState.player.amateurRanking ??
                gameState.player.worldRanking ??
                "-"}
            </p>
            <p
              className={`mt-1 text-[10px] font-semibold uppercase ${drawn ? "text-amber-300" : playerWon ? "text-green-400" : "text-red-400"}`}
            >
              {drawn ? "Match drawn · 1 point" : playerWon ? "Match won" : "Match lost"}
            </p>
          </div>
        </div>
        <div className="order-first grid place-items-center border-b border-border/70 bg-black/15 py-4 text-center md:order-none md:border-x md:border-y-0">
          <div>
            <div className="flex items-center gap-4">
              <span
                className={`text-4xl font-bold ${playerWon ? "text-green-400" : "text-white"}`}
              >
                {playerFrames}
              </span>
              <span className="text-gray-600">—</span>
              <span
                className={`text-4xl font-bold ${playerWon ? "text-white" : "text-red-400"}`}
              >
                {opponentFrames}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">
              {matchSummary?.actualResult ?? latestMatch.result}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-4 py-4 text-right sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-white">
              {opponentName}
            </p>
            <p className="text-xs text-gray-400">
              Opponent ranking #{latestMatch.opponentRanking}
            </p>
            <p className="text-[10px] text-gray-500">
              {latestMatch.opponentRankBand ?? "Ranking band"}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 font-bold text-red-200">
            {getInitials(opponentName)}
          </div>
        </div>
      </section>

      <MatchReviewPanel match={latestMatch} />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,.9fr)]">
        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Match Statistics
              </h2>
              <p className="text-[10px] text-gray-500">
                What happened on the table
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] ${playerWon ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}
            >
              {drawn ? "Draw reviewed" : playerWon ? "Winning performance" : "Defeat reviewed"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 xl:grid-cols-7">
            {statRows.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg bg-surface-light/45 px-2 py-2 text-center"
              >
                <p className="text-base font-bold text-white">{stat.player}</p>
                <p className="text-[9px] text-gray-500">{stat.label}</p>
                {stat.opponent !== null ? (
                  <p className="mt-0.5 text-[9px] text-gray-400">
                    Opponent {stat.opponent}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[9px] text-gray-600">
                    Your match stat
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-border px-3 py-3">
            <div className="mb-2 flex justify-between text-[10px]">
              <span className="font-semibold text-white">Frame by frame</span>
              <span className="text-gray-500">
                {playerName} {playerFrames} · {opponentName} {opponentFrames}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
              {frameRows.length > 0 ? (
                frameRows.map((frame) => {
                  const wonFrame =
                    frame.winner === "Player" || frame.winner === playerName;
                  return (
                    <div
                      key={frame.frame}
                      className={`rounded-md border p-2 text-center text-[10px] ${wonFrame ? "border-green-500/20 bg-green-500/10" : "border-red-500/20 bg-red-500/10"}`}
                    >
                      <span className="text-gray-500">F{frame.frame}</span>
                      <strong className="block text-white">
                        {frame.player}–{frame.opponent}
                      </strong>
                      <span
                        className={wonFrame ? "text-green-400" : "text-red-400"}
                      >
                        {wonFrame ? "W" : "L"}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="col-span-full py-3 text-center text-xs text-gray-400">
                  No frame history recorded.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Career Impact
              </h2>
              <p className="text-[10px] text-gray-500">
                Changes applied to the live save
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
            {careerImpact.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg bg-surface-light/50 p-2 text-center"
              >
                <metric.icon className="mx-auto mb-1 h-3.5 w-3.5 text-gray-500" />
                <p className={`text-sm font-bold ${metric.color}`}>
                  {metric.value}
                </p>
                <p className="text-[9px] text-gray-500">{metric.label}</p>
                {"sub" in metric && metric.sub ? (
                  <p className="text-[9px] text-gray-400">{metric.sub}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mx-3 grid grid-cols-2 gap-2 border-t border-border py-3">
            {systemChanges
              .filter(
                (change) =>
                  change.label === "Equipment Wear" ||
                  change.label === "Strain Penalty",
              )
              .map((change) => (
                <div key={change.label}>
                  <p className="text-[9px] uppercase text-gray-500">
                    {change.label}
                  </p>
                  <p className={`text-xs font-semibold ${change.tone}`}>
                    {change.value}{" "}
                    <span className="font-normal text-gray-400">
                      · {change.detail}
                    </span>
                  </p>
                </div>
              ))}
          </div>
          <div className="mx-3 mb-3 rounded-lg border border-sky-500/25 bg-sky-500/5 p-3">
            <div className="flex justify-between gap-2">
              <p className="text-xs font-semibold text-white">
                Attribute development
              </p>
              <span className="text-[10px] text-sky-300">No direct change</span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-gray-400">
              Match performance changes form, confidence and fatigue. Permanent
              technical, mental and physical improvement remains training-led;
              ageing and health can cause decline.
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="card card-body">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Why the result happened
          </p>
          <h3 className="mt-2 text-sm font-semibold text-white">
            {resultExplanation?.title ??
              matchSummary?.actualResult ??
              latestMatch.result}
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
            {resultExplanation?.summary ??
              `You entered with a ${matchSummary?.expectedWinChance ?? 50}% expected chance.`}
          </p>
        </section>
        <section className="card card-body">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Performance diagnosis
          </p>
          <div className="mt-2 space-y-1.5">
            {strengthBreakdown.slice(0, 3).map((row) => (
              <div key={row.label} className="flex justify-between text-xs">
                <span className="text-gray-300">{row.label}</span>
                <strong
                  className={row.edge >= 0 ? "text-green-400" : "text-red-400"}
                >
                  {row.edge > 0 ? "+" : ""}
                  {row.edge}
                </strong>
              </div>
            ))}
          </div>
        </section>
        <section className="card card-body">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Coach’s next step
          </p>
          <h3 className="mt-2 text-sm font-semibold text-white">
            {latestMatch.debrief?.training.title ?? (gameState.player.fatigue >= 65
              ? "Recover, then rebuild"
              : "Build on the evidence")}
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
            {latestMatch.debrief?.training.sessions ?? improvementAdvice[0] ??
              coachFeedback[0]?.items[0] ??
              "Keep the next training block balanced and protect match readiness."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/training/report")}
            className="btn-secondary mt-3 text-[10px]"
          >
            Review Training
          </button>
        </section>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-green-400">
            Next step
          </p>
          <p className="mt-1 text-xs text-gray-300">
            {tournamentContinues
              ? "Return to the Tournament Hub for the next round."
              : "Review the completed bracket and tournament winner, then return to the Dashboard."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/rankings")}
            className="btn-secondary text-[10px]"
          >
            Season Rankings
          </button>
          <a href="#full-analysis" className="btn-secondary text-[10px]">
            Full Analysis
          </a>
        </div>
      </div>

      <details id="full-analysis" className="group card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-white hover:bg-surface-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
          <span>
            <span className="text-green-400">Full analysis</span>
            <span className="ml-2 text-xs font-normal text-gray-400">
              Equipment, modifiers, pressure and coaching detail
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
        </summary>
        <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-3">
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-green-400" /> Equipment
              Impact
            </h3>
            {equipmentImpact.map((item) => (
              <div
                key={item.label}
                className="rounded-lg bg-surface-light/50 p-3"
              >
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-white">{item.label}</span>
                  <span className="text-green-400">
                    {Math.round(item.condition)}%
                  </span>
                </div>
                <ProgressBar value={item.condition} compact />
                <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
                  {item.highlight} {item.detail}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Match Modifiers
            </h3>
            {matchModifiers.map((modifier) => (
              <div
                key={modifier.label}
                className="rounded-lg bg-surface-light/50 p-3"
              >
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-white">
                    {modifier.label}
                  </span>
                  <span
                    className={
                      modifier.impact.startsWith("-")
                        ? "text-red-400"
                        : "text-green-400"
                    }
                  >
                    {modifier.impact}
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-gray-400">
                  {modifier.detail}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Pressure & Coaching
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded bg-surface-light/50 p-2">
                <p className="text-gray-500">QF+ Record</p>
                <p className="text-white">{pressureDiagnosis.qfPlusRecord}</p>
              </div>
              <div className="rounded bg-surface-light/50 p-2">
                <p className="text-gray-500">Deciders</p>
                <p className="text-white">{pressureDiagnosis.deciderRecord}</p>
              </div>
            </div>
            <p className="rounded-lg bg-surface-light/50 p-3 text-[10px] leading-relaxed text-gray-400">
              {pressureDiagnosis.diagnosis}
            </p>
            {coachFeedback.map((group) => (
              <div key={group.title}>
                <p
                  className={`text-[11px] font-semibold ${feedbackTone(group.tone)}`}
                >
                  {group.title}
                </p>
                {group.items.map((item) => (
                  <p
                    key={item}
                    className="mt-1 text-[10px] leading-relaxed text-gray-400"
                  >
                    {item}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
