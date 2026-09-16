import { PlayerNames } from '../components/game/PlayerNames';
import { PlayerLink } from '../components/game/PlayerLink';
import { GroupFixtures } from '../components/tournaments/GroupFixtures';
import { isGroupDraw } from '../game/championshipLeague';
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download, Route, Trophy } from "lucide-react";
import { TournamentBracket } from "../components/tournaments/TournamentBracket";
import { SectionTabs } from "../components/ui/SectionTabs";
import "./TournamentDrawPage.css";
import { useGame } from "../context/useGame";
import { formatMoney } from "../utils/formatters";
import { buildTournamentDrawData } from "../utils/liveRouteData";

function difficultyClass(
  difficulty: "Moderate" | "Challenging" | "Very Tough",
) {
  if (difficulty === "Very Tough") return "text-red-400";
  if (difficulty === "Challenging") return "text-amber-400";
  return "text-green-400";
}

function progressClass(status: "completed" | "current" | "upcoming") {
  if (status === "completed")
    return "border-green-600/30 bg-green-600/10 text-green-400";
  if (status === "current")
    return "border-amber-600/30 bg-amber-600/10 text-amber-400";
  return "border-border bg-surface-light text-gray-500";
}

export function TournamentDrawPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { gameState } = useGame();
  const [compactView, setCompactView] = useState(false);
  const [outlookTab, setOutlookTab] = useState<"Summary" | "Opponents">("Summary");
  const [roundSelection, setRoundSelection] = useState<{ label: string } | null>(null);
  const drawRef = useRef<HTMLDivElement>(null);
  const tournamentId = searchParams.get("tournament");
  const drawData = buildTournamentDrawData(gameState, tournamentId);
  const groupCompetition = isGroupDraw(drawData.bracket);
  const visibleBracket = compactView
    ? drawData.bracket.map((round) => ({
        ...round,
        matches: round.matches.slice(0, 2),
      }))
    : drawData.bracket;

  useEffect(() => {
    if (!roundSelection || !drawRef.current) return;
    const target = groupCompetition
      ? drawRef.current.querySelector<HTMLSelectElement>('select[aria-label="Group stage"]')
      : [...drawRef.current.querySelectorAll<HTMLElement>('[data-round-label]')].find(el => el.dataset.roundLabel === roundSelection.label);
    target?.scrollIntoView({ block: 'start', inline: 'center', behavior: 'auto' });
    target?.focus({ preventScroll: true });
  }, [roundSelection, groupCompetition]);

  if (!drawData.tournamentId) return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h1 className="text-2xl font-bold text-white">No tournament draw</h1>
      <p className="mt-3 text-sm text-gray-400">Choose an event from the calendar to view its draw.</p>
      <button type="button" className="btn-primary mt-5" onClick={() => navigate('/calendar')}>View Tournament Calendar</button>
    </section>
  );

  return (
    <div className="draw-workspace">
      <div className="flex shrink-0 flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase text-gray-500">
            Tournaments
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {drawData.tournamentName}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {drawData.eventCompleted
              ? `${drawData.resultLabel ?? "Event complete"} · full tournament bracket`
              : "Projected route, bracket position, and opponent difficulty."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={
              compactView ? "btn-secondary text-xs" : "btn-primary text-xs"
            }
            onClick={() => setCompactView(false)}
          >
            Full Draw
          </button>
          <button
            type="button"
            className={
              compactView ? "btn-primary text-xs" : "btn-secondary text-xs"
            }
            onClick={() => setCompactView(true)}
          >
            Compact
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => typeof window !== "undefined" && window.print()}
          >
            <Download className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {drawData.eventCompleted && drawData.eventSummary ? (
        <section
          className="grid shrink-0 gap-2 rounded-xl border border-green-500/25 bg-green-500/5 p-3 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Completed event summary"
        >
          <div className="rounded-lg bg-surface/70 p-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">
              Your finish
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {drawData.resultLabel}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              {drawData.eventSummary.wins}-{drawData.eventSummary.losses} match
              record
            </p>
          </div>
          <div className="rounded-lg bg-surface/70 p-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">
              Event reward
            </p>
            <p className="mt-1 text-sm font-semibold text-green-400">
              {formatMoney(drawData.eventSummary.prizeMoney)}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              +{drawData.eventSummary.rankingPoints} ranking points
            </p>
          </div>
          <div className="rounded-lg bg-surface/70 p-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">
              Event finances
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${drawData.eventSummary.net >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {drawData.eventSummary.net >= 0 ? "+" : "−"}
              {formatMoney(Math.abs(drawData.eventSummary.net))}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              {formatMoney(drawData.eventSummary.costs)} entry and travel costs
            </p>
          </div>
          <div className="rounded-lg bg-surface/70 p-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">
              Performance
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              High break {drawData.eventSummary.highestBreak}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              Full bracket resolved below
            </p>
          </div>
        </section>
      ) : null}

      <div className="draw-workspace-content">
        <div className="draw-workspace-bracket">
          <div className="card flex min-h-0 flex-1 flex-col">
            <div className="card-header">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Trophy className="h-3.5 w-3.5 text-green-400" />{" "}
                {groupCompetition ? "Groups and Fixtures" : drawData.eventCompleted ? "Completed Bracket" : "Bracket"}
              </h3>
              <span
                className={
                  drawData.eventCompleted
                    ? "text-[10px] font-semibold text-green-400"
                    : "text-[10px] text-gray-400"
                }
              >
                {drawData.currentPosition.currentRound}
              </span>
            </div>
            <div ref={drawRef} className="card-body min-h-0 flex-1 overflow-auto" tabIndex={0} aria-label="Tournament draw scroll area">
              <>{groupCompetition ? <GroupFixtures tournament={gameState.tournaments.find(t => t.id === drawData.tournamentId) ?? null} rounds={drawData.bracket} playerName={gameState.player.fullName} currentRound={drawData.currentPosition.currentRound} selectedStage={roundSelection?.label} onStageChange={label => setRoundSelection({ label })} /> : <TournamentBracket
                rounds={visibleBracket}
                playerName={gameState.player.fullName}
                currentRound={drawData.currentPosition.currentRound}
                dense={compactView}
              />}</>
            </div>
          </div>

          <div className="card shrink-0">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">
                Route Progress
              </h3>
            </div>
            <nav aria-label="Route Progress" className="card-body flex gap-2 overflow-x-auto">
              {drawData.progress.map((step) => (
                <button
                  type="button"
                  key={step.label}
                  onClick={() => setRoundSelection({ label: step.label })}
                  aria-current={roundSelection?.label === step.label ? 'location' : undefined}
                  aria-label={`View ${step.label}`}
                  className={`min-w-28 cursor-pointer hover:brightness-125 flex-1 rounded-lg border px-3 py-3 text-center text-[10px] font-semibold uppercase ${progressClass(step.status)}`}
                >
                  {step.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <aside className="draw-workspace-outlook draw-outlook-tabs" aria-label="Draw outlook and navigation">
          <SectionTabs id="draw-outlook" label="Draw details" tabs={['Summary', 'Opponents']} active={outlookTab} onChange={setOutlookTab} />
          <div id="draw-outlook-panel" role="tabpanel" aria-labelledby={`draw-outlook-tab-${outlookTab === 'Summary' ? 0 : 1}`} className="draw-outlook-panel">
            {outlookTab === 'Summary' ? <section className="draw-summary-panel">
              <header><p>{drawData.eventCompleted ? 'Event complete' : 'Your tournament'}</p><h3>Current Position</h3></header>
              <dl className="draw-summary-rows">
                {[
                  { label: 'Current Round', value: drawData.currentPosition.currentRound },
                  { label: 'Best Result', value: drawData.currentPosition.bestResult },
                  { label: 'Projected Route', value: drawData.currentPosition.projectedRoute },
                  { label: 'Bracket Difficulty', value: drawData.currentPosition.difficultyLabel },
                  ...drawData.insights.filter(item => !['Tournament', 'Status', 'Your Result', 'Current Round'].includes(item.label)),
                ].map(item => <div key={item.label}><dt>{item.label}</dt><dd><PlayerNames text={item.value}/></dd></div>)}
              </dl>
            </section> : <section className="draw-opponents-panel">
              <header><h3>Path &amp; Opponent Outlook</h3><p>Selected players in the draw · career head-to-head</p></header>
              <div className="draw-opponent-grid">
                {drawData.opponentOutlook.map(opponent => <article key={opponent.id} className="draw-opponent-card">
                  <h4><PlayerLink name={opponent.name}/></h4>
                  <p>Rank {opponent.rank} · {opponent.nation}</p>
                  <span className={difficultyClass(opponent.difficulty)}>{opponent.difficulty}</span>
                  <div><span>H2H</span><strong>{opponent.headToHead}</strong></div>
                </article>)}
                {!drawData.opponentOutlook.length && <p className="draw-no-opponents">Opponent details appear when the draw is available.</p>}
              </div>
            </section>}
          </div>
          <footer className="draw-outlook-actions">
            <button type="button" className="btn-primary" onClick={() => navigate(drawData.eventCompleted ? '/' : '/match/preview')}>
              <Route className="h-3.5 w-3.5" />{drawData.eventCompleted ? 'Back to Dashboard' : 'Scout Next Opponent'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/rankings')}>View Rankings</button>
          </footer>
        </aside>

      </div>
    </div>
  );
}
