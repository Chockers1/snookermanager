import { useState } from 'react';
import { SectionTabs } from '../components/ui/SectionTabs';
import { CareerEditor } from '../components/career/CareerDepthPanels';
import { FormAssessmentEditor } from '../components/career/FormAssessmentEditor';
import { currentPublishedRanking } from '../game/rankingPresentation';
import { getRivalry } from '../game/careerDepth/relationships';
import './MatchResultPage.css';

import { VictoryCelebration } from '../components/game/VictoryCelebration';
import { victoryCelebration } from '../game/victoryCelebration';
import { BetweenMatchPanel } from '../components/tournaments/BetweenMatchPanel';
import { PlayerLink } from '../components/game/PlayerLink';
import { MatchReviewPanel } from "../components/career/MatchInsightPanels";
import { GroupFixtures } from '../components/tournaments/GroupFixtures';
import { isGroupDraw } from '../game/championshipLeague';
import { useNavigate } from "react-router-dom";
import { RivalryContext } from "../components/career/CareerDepthPanels";
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
import { formatMoney, formatPercent, formatAttributeChange } from "../utils/formatters";
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
  const amount = Math.round((value ?? 0) * 100) / 100;
  return `${amount > 0 ? "+" : ""}${suffix === "%" ? amount.toFixed(2) : amount}${suffix}`;
}

export function MatchResultPage() {
  const { gameState } = useGame();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Overview');
  const [analysisTab, setAnalysisTab] = useState('Match outlook');
  const [preparationOpen, setPreparationOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [rivalryOpen, setRivalryOpen] = useState(false);
  const publishedRank = currentPublishedRanking(gameState);
  const latestMatch = gameState.matches[0];
  const victory = victoryCelebration(gameState, latestMatch);
  const {
    equipmentImpact,
    coachFeedback,
    matchSummary,
    strengthBreakdown,
    matchModifiers,
    resultExplanation,
    pressureDiagnosis,
  } = buildMatchResultData(gameState);
  const latestTournament = gameState.tournaments.find(
    (item) => item.id === latestMatch?.tournamentId,
  );
  const playerName = latestMatch?.playerName ?? gameState.player.fullName;
  const opponentName = latestMatch?.opponentName ?? "Opponent TBD";
  const rivalry = getRivalry(gameState, opponentName);
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
          player: `${formatPercent(latestMatch.potSuccess)}`,
          opponent: null,
        },
        {
          label: "Long Pot",
          player: `${formatPercent(latestMatch.longPotSuccess)}`,
          opponent: null,
        },
        {
          label: "Safety",
          player: `${formatPercent(latestMatch.safetySuccess)}`,
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
      sub: `Now ${formatPercent(gameState.player.fatigue)}`,
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
      value: `-${formatPercent(latestMatch?.equipmentWear ?? 0)}`,
      detail: "Active cue condition",
      tone: "text-amber-400",
    },
    {
      label: "Cue Familiarity",
      value: `+${formatPercent(latestMatch?.familiarityGained ?? 0)}`,
      detail: "Gained from match use",
      tone: "text-sky-400",
    },
    {
      label: "Strain Penalty",
      value: formatAttributeChange(-(latestMatch?.strainImpact ?? 0)),
      detail: `Current strain ${formatPercent(gameState.trainingCondition.strain)}`,
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

  const tabs = ['Overview', 'Statistics', 'Career Impact', 'Analysis', ...(groupCompetition ? ['Group standings'] : [])];
  const analysisTabs = ['Match outlook', 'Equipment', 'Pressure & coaching'];
  return <div className="result-workspace" data-view={tab}>
    {victory && <VictoryCelebration key={victory.key} victory={victory} compact />}
    <header className="result-header">
      <div><p className="result-eyebrow">{latestTournament?.name ?? 'Completed match'} · {latestMatch.round} · Best of {latestMatch.bestOf}</p><h1>Match Review</h1><p className="result-muted">{tournamentContinues ? 'Match complete · your tournament continues' : `Event complete · ${playerWon && latestMatch.round === 'Final' ? 'tournament won' : `eliminated in the ${latestMatch.round}`}`}</p></div>
      <button type="button" onClick={() => navigate(primaryRoute)} className="btn-primary">{primaryLabel}<ChevronRight size={15}/></button>
    </header>
    <section aria-label="Match result" className={`result-scoreboard ${drawn ? 'is-drawn' : playerWon ? 'is-won' : 'is-lost'}`}>
      <div className="result-player"><span className="result-avatar">{getInitials(playerName)}</span><div><h2><PlayerLink name={playerName}/></h2><p>{gameState.player.rankingLabel} {publishedRank ? `#${publishedRank.ranking}` : 'Unranked'}</p><strong>{drawn ? 'Match drawn · 1 point' : playerWon ? 'Match won' : 'Match lost'}</strong></div></div>
      <div className="result-score"><div><b>{playerFrames}</b><span>—</span><b>{opponentFrames}</b></div><p>{matchSummary?.actualResult ?? latestMatch.result}</p></div>
      <div className="result-player result-opponent"><div><h2><PlayerLink name={opponentName}/></h2><p>Opponent ranking #{latestMatch.opponentRanking}</p><span>{latestMatch.opponentRankBand ?? 'Ranking band'}</span></div><span className="result-avatar">{getInitials(opponentName)}</span></div>
    </section>
    <SectionTabs id="result" label="Match review sections" tabs={tabs} active={tab} onChange={setTab}/>
    <div id="result-panel" role="tabpanel" aria-labelledby={`result-tab-${tabs.indexOf(tab)}`} className="result-panel" tabIndex={0}>
      {tab === 'Overview' && <div className="result-overview">
        <MatchReviewPanel match={latestMatch}/>
        <div className="result-quick-impact">{careerImpact.slice(0,4).map(metric => <div key={metric.label}><span>{metric.label}</span><strong className={metric.color}>{metric.value}</strong>{metric.sub && <small>{metric.sub}</small>}</div>)}</div>
      </div>}
      {tab === 'Statistics' && <section className="result-card result-statistics"><header><div><h2>Match Statistics</h2><p>Recorded performance · rates are simulation estimates</p></div><span className="result-badge">{frameRows.length} frames recorded</span></header>
        <div className="result-stat-grid">{statRows.map(stat => <div key={stat.label}><span>{stat.label}</span><strong>{stat.player}</strong>{stat.opponent !== null && <small>Opponent {stat.opponent}</small>}</div>)}</div>
        <div className="result-frames"><div className="result-frame-heading"><h3>Frame by frame</h3><p>W · won / L · lost</p></div><div className="result-frame-grid">{frameRows.length ? frameRows.map(frame => {const won = frame.winner === 'Player' || frame.winner === playerName;return <div key={frame.frame} className={won ? 'frame-won' : 'frame-lost'}><span>{frame.frame.startsWith('F') ? frame.frame : `F${frame.frame}`}</span><b>{frame.player}–{frame.opponent}</b><strong>{won ? 'W' : 'L'}</strong></div>}) : <p>No frame history recorded.</p>}</div></div>
      </section>}
      {tab === 'Career Impact' && <section className="result-card result-impact"><header><div><h2>Career Impact</h2><p>Match changes and current career condition</p></div><span className="result-badge">Saved result</span></header><div className="result-impact-grid">{careerImpact.map(metric => <div key={metric.label}><div><metric.icon size={18}/><span>{metric.label}</span></div><strong className={metric.color}>{metric.value}</strong><p>{metric.sub ?? (metric.label === 'Prize Money' || metric.label === 'Sponsor Bonus' ? 'Recorded match award' : 'Gained from match use')}</p></div>)}</div>
        <div className="result-system-changes">{systemChanges.filter(change => ['Equipment Wear','Strain Penalty'].includes(change.label)).map(change => <div key={change.label}><h3>{change.label}</h3><strong className={change.tone}>{change.value}</strong><p>{change.detail}</p></div>)}<div><h3>Attribute development</h3><strong>No direct change</strong><p>Permanent development comes from training; age and health can cause decline.</p></div></div>
      </section>}
      {tab === 'Analysis' && <div className="result-analysis"><SectionTabs id="result-analysis" label="Analysis sections" tabs={analysisTabs} active={analysisTab} onChange={setAnalysisTab}/><div id="result-analysis-panel" role="tabpanel" aria-labelledby={`result-analysis-tab-${analysisTabs.indexOf(analysisTab)}`} className="result-analysis-content" tabIndex={0}>
        {analysisTab === 'Match outlook' && <><section className="result-card result-outlook"><header><h2>{resultExplanation?.title ?? 'Match outlook'}</h2><span className="result-badge">Simulation assessment</span></header><div className="result-card-body"><p>{resultExplanation?.summary ?? `You entered with a ${formatPercent(matchSummary?.expectedWinChance ?? 50)} expected chance.`}</p><div className="result-strengths">{strengthBreakdown.slice(0,3).map(row => <div key={row.label}><span>{row.label}</span><strong className={row.edge >= 0 ? 'text-green-300' : 'text-rose-300'}>{formatAttributeChange(row.edge)}</strong><small>Estimated edge</small></div>)}</div><p className="result-muted">These estimates describe the matchup; they do not establish a single cause for the result.</p></div></section><section className="result-card"><header><h2>Match Modifiers</h2></header><div className="result-modifiers">{matchModifiers.map(modifier => <div key={modifier.label}><h3>{modifier.label}</h3><strong className={modifier.impact.startsWith('-') ? 'text-rose-300' : 'text-green-300'}>{modifier.impact}</strong><p>{modifier.detail}</p></div>)}</div></section></>}
        {analysisTab === 'Equipment' && <section className="result-card"><header><h2><ShieldCheck size={16}/> Equipment Impact</h2></header><div className="result-equipment">{equipmentImpact.map(item => <div key={item.label}><h3>{item.label}<strong>{formatPercent(item.condition)}</strong></h3><ProgressBar value={item.condition} compact/><p>{item.highlight}</p><p className="result-muted">{item.detail}</p></div>)}</div></section>}
        {analysisTab === 'Pressure & coaching' && <><section className="result-card"><header><h2>Pressure profile</h2></header><div className="result-card-body"><div className="result-strengths"><div><span>QF+ Record</span><strong>{pressureDiagnosis.qfPlusRecord}</strong></div><div><span>Deciders</span><strong>{pressureDiagnosis.deciderRecord}</strong></div></div><p>{pressureDiagnosis.diagnosis}</p></div></section><section className="result-card"><header><h2>Coaching assessment</h2></header><div className="result-card-body">{coachFeedback.filter(group => group.title !== 'Equipment Readout').map(group => <div key={group.title}><h3 className={feedbackTone(group.tone)}>{group.title}</h3>{group.items.map(item => <p key={item}>{item}</p>)}</div>)}<button type="button" className="btn-secondary" onClick={() => navigate('/training')}>Review Training</button></div></section></>}
      </div></div>}
      {tab === 'Group standings' && <div className="result-card result-group"><GroupFixtures tournament={latestTournament ?? null} key={latestMatch.id} rounds={gameState.tournamentProgress.draw} playerName={playerName} currentRound={latestMatch.round}/></div>}
    </div>
    <footer className="result-footer"><div>{rivalry && <button type="button" className="result-history" onClick={() => setRivalryOpen(true)}>Opponent history · H2H {rivalry.wins}–{rivalry.losses}{rivalry.draws ? `–${rivalry.draws}` : ''}<ChevronRight size={14}/></button>}</div><div className="result-actions">{tournamentContinues && <button type="button" className="btn-secondary" onClick={() => setPreparationOpen(true)}>Prepare next match</button>}<button type="button" className="btn-secondary" onClick={() => setFormOpen(true)}>Form assessment</button><button type="button" className="btn-secondary" onClick={() => navigate('/rankings')}>Season Rankings</button></div></footer>
    {rivalryOpen && <CareerEditor title="Opponent history" onClose={() => setRivalryOpen(false)}><div className="result-dialog-body"><RivalryContext opponent={latestMatch.opponentName}/></div></CareerEditor>}
    {preparationOpen && <CareerEditor title="Prepare your next match" onClose={() => setPreparationOpen(false)}><div className="result-dialog-body"><BetweenMatchPanel tournamentId={latestMatch.tournamentId}/></div></CareerEditor>}
    {formOpen && <CareerEditor title="Form evidence and recovery" onClose={() => setFormOpen(false)}><FormAssessmentEditor/></CareerEditor>}
  </div>;
}
