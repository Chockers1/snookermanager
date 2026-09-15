import { useState } from 'react';
import { SectionTabs } from '../components/ui/SectionTabs';
import { betweenMatchInfo } from '../game/betweenMatches';
import { PlayerNames } from '../components/game/PlayerNames';
import { ActionBlockerNotice } from '../components/game/ActionBlockerNotice';
import { tournamentEntryBlocker, advancementBlocker } from '../hooks/useGameState';
import { pendingStory } from '../game/careerDepth/shared';
import { BetweenMatchPanel } from '../components/tournaments/BetweenMatchPanel';
import { TournamentAtmosphere } from '../components/game/TournamentAtmosphere';
import { TournamentRewards } from '../components/game/TournamentRewards';
import { PlayerLink } from '../components/game/PlayerLink';
import { EntryTimelinePanel } from '../components/career/SeasonExpansionPanels';
import { pathwayRuleSummary } from '../game/pathwayRules'
import { resolveTournamentFormat, tournamentFormatSummary } from '../data/tournamentFormats';
import { GroupFixtures } from '../components/tournaments/GroupFixtures';
import { isGroupDraw } from '../game/championshipLeague';
import { useNavigate } from "react-router-dom";
import { tournamentCommitmentConflict } from "../game/careerDepth/commitments";
import { RivalryContext } from "../components/career/CareerDepthPanels";
import { VenueScoutingPanel } from '../components/career/RealismPanels';
import {
  Crown,
  MapPin,
  Maximize2,
  Play,
  Search,
  SkipForward,
  Trophy,
} from "lucide-react";
import { TournamentBracket } from "../components/tournaments/TournamentBracket";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import { chalkCatalog, cueCatalog, tipCatalog } from "../data/catalogs";
import {
  getNextEligibleTournament,
  getTournamentPlayability,
  getTournamentEntryAccess,
} from "../hooks/useGameState";
import {
  buildTournamentDrawData,
  buildTournamentHubData,
} from "../utils/liveRouteData";
import { formatMoney, formatPercent } from "../utils/formatters";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const hubTabs = ['Draw', 'Preparation', 'Match briefing', 'Event details'] as const;

export function TournamentHubPage() {
  const {
    gameState,
    simulateMatch,
    enterTournament,
    withdrawTournament,
    skipTournament,
    continueToNextTournament,
    continueWeek,
    finishSeason,
  } = useGame();
  const navigate = useNavigate();
  const [tab, setTab] = useState<typeof hubTabs[number]>('Draw');
  const hubData = buildTournamentHubData(gameState);
  const drawData = buildTournamentDrawData(gameState);
  const groupCompetition = isGroupDraw(drawData.bracket);
  const currentCue = cueCatalog.find(
    (cue) => cue.id === gameState.equipment.currentCueId,
  );
  const currentChalk = chalkCatalog.find(
    (chalk) => chalk.id === gameState.equipment.currentChalkId,
  );
  const currentTip = tipCatalog.find(
    (tip) => tip.id === gameState.equipment.currentTipId,
  );
  const equipmentReady = Boolean(currentCue && currentChalk && currentTip);
  const activeTournament = gameState.seasonReview?.pending ? undefined : getNextEligibleTournament(gameState);
  const tournamentName = activeTournament?.name.toLowerCase() ?? "";
  const isQualifier = /qualif|q school/.test(tournamentName);
  const isWorldChampionship =
    /world championship/.test(tournamentName) && !isQualifier;
  const isTripleCrown =
    !isQualifier &&
    (/world championship/.test(tournamentName) ||
      /uk championship/.test(tournamentName) ||
      /^masters$/.test(tournamentName));
  const isMajorEvent =
    !isQualifier &&
    (isTripleCrown ||
      (activeTournament?.prestige ?? 0) >= 5 ||
      activeTournament?.eventClass === "Major" ||
      activeTournament?.type === "Major");
  const majorLabel = isWorldChampionship
    ? "World Championship"
    : isTripleCrown
      ? "Triple Crown"
      : "Major Event";
  const majorMessage = isWorldChampionship
    ? "The sport's defining stage · every session shapes your legacy"
    : isTripleCrown
      ? "A career-defining stage with history, pressure and prestige"
      : "A season-defining tournament with elite rewards and pressure";
  const tournamentEntered = activeTournament?.status === "Entered";
  const entryConflict = activeTournament && !tournamentEntered ? tournamentCommitmentConflict(gameState, activeTournament) : null;
  const entryBlocker = activeTournament && !tournamentEntered ? tournamentEntryBlocker(gameState, activeTournament) : null;
  const advanceBlocker = advancementBlocker(gameState);
  const playability = activeTournament
    ? getTournamentPlayability(gameState, activeTournament)
    : null;
  const playerRow = gameState.rankings.find(
    (row) => row.playerName === gameState.player.fullName,
  );
  const activeRound =
    gameState.tournamentProgress.tournamentId === activeTournament?.id
      ? gameState.tournamentProgress.currentRound
      : null;
  const completedRounds =
    gameState.tournamentProgress.tournamentId === activeTournament?.id
      ? gameState.tournamentProgress.completedRounds
      : [];
  const activeBracketMatch = drawData.bracket
    .find((round) => round.label === activeRound)
    ?.matches.find(
      (match) =>
        (!groupCompetition || match.top.score === undefined) && (match.top.name === gameState.player.fullName ||
        match.bottom.name === gameState.player.fullName),
    );
  const bracketOpponent = activeBracketMatch
    ? activeBracketMatch.top.name === gameState.player.fullName
      ? activeBracketMatch.bottom
      : activeBracketMatch.top
    : null;
  const nextOpponent =
    bracketOpponent && bracketOpponent.name !== "TBD"
      ? (gameState.rankings.find(
          (row) => row.playerName === bracketOpponent.name,
        ) ?? {
          playerName: bracketOpponent.name,
          ranking: bracketOpponent.rank,
          nation: bracketOpponent.nation,
        })
      : (gameState.rankings.find(
          (row) =>
            row.playerName !== gameState.player.fullName &&
            Math.abs(row.ranking - (playerRow?.ranking ?? 1)) <= 3,
        ) ??
        gameState.rankings.find(
          (row) => row.playerName !== gameState.player.fullName,
        ));
  const technicalAverage = average(
    Object.values(gameState.attributes.technical),
  );
  const freshness = Math.max(0, 100 - gameState.player.fatigue);
  const readiness = Math.round(
    (gameState.player.confidence +
      freshness +
      gameState.player.morale +
      technicalAverage) /
      4,
  );
  const nextMatchStageLabel = tournamentEntered
    ? (activeRound ?? "Awaiting Draw")
    : "Awaiting Draw";
  const advancementDecision = pendingStory(gameState);
  const primaryActionLabel = entryBlocker ? entryBlocker.label : advancementDecision
    ? "Resolve Inbox Decision"
    : entryConflict
    ? "Manage Calendar Clash"
    : !equipmentReady
    ? "Open Equipment"
    : !tournamentEntered
      ? "Enter Tournament"
      : !playability?.travelBooked
        ? "Book Travel"
        : !playability?.preparationConfirmed
          ? "Prepare Tournament"
        : (playability?.daysUntilStart ?? 0) > 0
          ? "Advance to Tournament"
          : "Play Next Match";
  const stageLabels =
    drawData.progress.length > 0
      ? drawData.progress
      : [
          { label: "Last 16", status: "current" as const },
          { label: "Quarter Final", status: "upcoming" as const },
          { label: "Semi Final", status: "upcoming" as const },
          { label: "Final", status: "upcoming" as const },
        ];
  const lastResult = hubData.recentResults.at(-1);
  const matchGap = betweenMatchInfo(gameState, activeTournament);

  function handleQuickSim() {
    if (!activeTournament) return;
    if (!equipmentReady) {
      navigate("/equipment/cues");
      return;
    }
    if (!playability?.canPlay) return;
    simulateMatch(activeTournament.id);
    navigate("/match/result");
  }

  function handlePlayLiveMatch() {
    if (!activeTournament) return;
    if (entryBlocker) { navigate(entryBlocker.route); return; }
    if (advancementDecision) {
      navigate(`/inbox?message=${encodeURIComponent(advancementDecision.id)}`);
      return;
    }
    if (entryConflict) {
      navigate("/calendar?commitments=1");
      return;
    }
    if (!equipmentReady) {
      navigate("/equipment/cues");
      return;
    }
    if (!tournamentEntered) {
      enterTournament(activeTournament.id);
      return;
    }
    if (!playability?.travelBooked) {
      navigate("/travel");
      return;
    }
    if (!playability?.preparationConfirmed) {
      navigate("/tournament/preparation");
      return;
    }
    if ((playability?.daysUntilStart ?? 0) > 0) {
      if (advanceBlocker) { navigate(advanceBlocker.route); return; }
      continueToNextTournament();
      return;
    }
    navigate("/match/preview");
  }

  if (!activeTournament) {
    const nextRestricted = gameState.tournaments.filter(t =>
      (t.endDate ?? t.startDate) >= gameState.currentDate && t.status !== 'Completed' && t.status !== 'Skipped' &&
      (t.type === 'Major' || t.type === 'Ranking' || t.type === 'Professional Tour') &&
      !getTournamentEntryAccess(gameState, t).allowed
    ).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    return (
      <div className="tournament-hub-page hub-empty" data-testid="tournament-hub-viewport">

        <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-400">Tournament Hub</p>
          <h1 className="mt-3 text-2xl font-bold text-white">No eligible tournament</h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-400">Your remaining season is clear. Finish Season advances the remaining weeks, including training, living costs and tour results, then opens your season review. It pauses if an event or career decision needs attention.</p>
          {nextRestricted && <div className="mt-5 rounded-lg border border-border bg-surface-light p-4">
            <p className="font-semibold text-white">{nextRestricted.name}</p>
            <p className="mt-1 text-sm text-gray-400">{getTournamentEntryAccess(gameState, nextRestricted).reason}</p>
          </div>}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={() => { finishSeason(); navigate('/season-review'); }}>{gameState.seasonReview?.pending ? 'Open Season Review' : 'Finish Season'}</button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/calendar')}>View Tournament Calendar</button>
            <button type="button" className="btn-secondary" title={advanceBlocker?.reason} onClick={() => advanceBlocker ? navigate(advanceBlocker.route) : continueWeek()}>{advanceBlocker?.label ?? "Advance One Week"}</button>
          </div>
        </section>
      </div>
    );
  }

  return <div className="tournament-hub-page" data-testid="tournament-hub-viewport">
    <header className={`hub-header ${isMajorEvent ? 'hub-major' : ''}`}>
      <div className="hub-event-name"><p className="wellbeing-eyebrow">{isMajorEvent ? majorLabel : 'Tournament Hub'}</p><h1>{activeTournament.name}</h1><p>{activeTournament.location} · {tournamentFormatSummary(activeTournament)}</p></div>
      <div className="hub-round"><span>Current Round</span><strong>{activeRound ?? 'Entry'}</strong></div>
      <button className="btn-secondary text-xs" onClick={()=>navigate('/travel')}><MapPin className="h-3.5 w-3.5"/>Travel</button>
    </header>
    <section className={`hub-next-match ${isMajorEvent ? 'hub-major-match' : ''}`} aria-label="Next match">
      <div className="hub-match-heading"><h2>Next Match <span>· {nextMatchStageLabel}</span></h2><span>{advancementDecision?'Decision Needed':playability?.canPlay?'Playable':tournamentEntered?'Preparation Needed':'Entry Needed'}</span></div>
      <div className="hub-match-content">
        <div className="hub-contestants">
          <div className="hub-contestant"><div className="hub-avatar">{initials(gameState.player.fullName)}</div><div><h3><PlayerLink name={gameState.player.fullName}/></h3><p>Rank {playerRow?.ranking ?? gameState.player.amateurRanking ?? gameState.player.worldRanking ?? '—'} · {formatPercent(gameState.player.confidence)} confidence</p></div></div>
          <span className="hub-versus">VS</span>
          <div className="hub-contestant hub-opponent"><div className="hub-avatar">{initials(nextOpponent?.playerName ?? 'Opponent')}</div><div><h3><PlayerLink name={nextOpponent?.playerName ?? 'Opponent TBD'}/></h3><p>Rank {nextOpponent?.ranking ?? '—'} · {nextOpponent?.nation ?? 'Nation TBD'}</p></div></div>
        </div>
        <div className="hub-match-actions">
          <button className="btn-primary hub-play" onClick={handlePlayLiveMatch}><Play className="h-4 w-4"/>{primaryActionLabel}</button>
          <button className="btn-secondary text-xs" onClick={()=>navigate(playability?.preparationConfirmed?'/match/preview':'/tournament/preparation')}><Search className="h-3.5 w-3.5"/>Scout</button>
          {tournamentEntered?<button className="btn-secondary text-xs" disabled={!playability?.canPlay} title={!playability?.canPlay?(entryBlocker?.reason??playability?.reason??'Complete tournament preparation first.'):undefined} onClick={handleQuickSim}>Quick Sim</button>:<button className="btn-secondary text-xs" onClick={()=>skipTournament(activeTournament.id)}><SkipForward className="h-3.5 w-3.5"/>Skip Event</button>}
        </div>
      </div>
      {(entryBlocker||(!playability?.canPlay&&tournamentEntered&&!advancementDecision))&&<div className="hub-match-notice">{entryBlocker?<ActionBlockerNotice blocker={entryBlocker}/>:<p>{playability?.reason}</p>}</div>}
    </section>
    <SectionTabs id="hub-sections" label="Tournament hub sections" tabs={hubTabs} active={tab} onChange={setTab}/>
    <div className="hub-tab-content" role="tabpanel" id="hub-sections-panel" aria-labelledby={`hub-sections-tab-${hubTabs.indexOf(tab)}`}>
      {tab==='Draw'&&<section className="hub-draw-panel" aria-label="Tournament draw">
        <div className="hub-draw-heading"><div><h2>{isMajorEvent?<Crown className="h-4 w-4 text-amber-200"/>:<Trophy className="h-4 w-4 text-emerald-300"/>}{groupCompetition?'Groups and Fixtures':isMajorEvent?'Championship Draw':'Tournament Bracket'}</h2><p>{groupCompetition?'Standings and results update after every match.':'Your route is highlighted. Scroll within the draw to explore every match.'}</p></div><button className="btn-secondary text-xs" onClick={()=>navigate('/tournaments/draw')}><Maximize2 className="h-3.5 w-3.5"/>{groupCompetition?'All Groups & Fixtures':'Open Full Draw'}</button></div>
        <div className="hub-draw-canvas">{groupCompetition?<GroupFixtures tournament={activeTournament} key={activeRound} rounds={drawData.bracket} playerName={gameState.player.fullName} currentRound={activeRound}/>:<TournamentBracket rounds={drawData.bracket} playerName={gameState.player.fullName} currentRound={activeRound}/>}</div>
        <footer className="hub-draw-footer"><span>{groupCompetition?stageLabels.filter(stage=>stage.status==='completed').length:completedRounds.length} / {stageLabels.length} {groupCompetition?'stages':'rounds'} complete</span><span><PlayerNames text={lastResult?`${lastResult.winner} def. ${lastResult.loser} ${lastResult.score}`:'No completed matches yet'}/></span></footer>
      </section>}
      {tab==='Preparation'&&<div className="hub-support-scroll"><div className="hub-preparation-top"><section className="care-panel care-panel-green"><div className="care-panel-heading"><h2>Match Readiness</h2><span className="care-badge">{readiness>=65&&equipmentReady?'Ready':'Needs attention'}</span></div><div className="care-panel-body"><div className="hub-readiness-values">{[['Confidence',formatPercent(gameState.player.confidence)],['Freshness',formatPercent(freshness)],['Equipment',equipmentReady?'Ready':'Check']].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><p>Check your recovery, travel and preparation before starting the match.</p></div><footer className="care-panel-actions"><button className="btn-secondary text-xs" onClick={()=>navigate('/equipment/cues')}>Equipment</button><button className="btn-secondary text-xs" onClick={()=>navigate('/training')}>Training</button></footer></section><section className="care-panel"><div className="care-panel-heading"><h2>Event preparation</h2></div><div className="care-panel-body"><dl className="hub-preparation-checks"><div><dt>Entry</dt><dd>{tournamentEntered?'Confirmed':'Required'}</dd></div><div><dt>Travel</dt><dd>{playability?.travelBooked?'Booked':'Not booked'}</dd></div><div><dt>Preparation</dt><dd>{playability?.preparationConfirmed?'Confirmed':'Required'}</dd></div></dl></div><footer className="care-panel-actions"><button className="btn-secondary text-xs" onClick={()=>navigate('/travel')}>Review travel</button><button className="btn-secondary text-xs" onClick={()=>navigate('/tournament/preparation')}>Tournament preparation</button></footer></section></div>{matchGap?<BetweenMatchPanel tournamentId={activeTournament.id}/>:<div className="hub-support-note">Between-match recovery options appear after your first match when another fixture is scheduled.</div>}</div>}
      {tab==='Match briefing'&&<div className="hub-support-scroll"><section className="care-panel"><div className="care-panel-heading"><h2>Opponent, venue & atmosphere</h2></div><div className="care-panel-body hub-briefing"><RivalryContext opponent={nextOpponent?.playerName??''}/><TournamentAtmosphere event={activeTournament} rounds={drawData.bracket} opponent={nextOpponent?.playerName}/><VenueScoutingPanel tournament={activeTournament} opponent={nextOpponent?.playerName}/></div></section></div>}
      {tab==='Event details'&&<div className="hub-support-scroll hub-event-details">
          <section className="card flex min-h-0 flex-col overflow-hidden">
            <div className="card-header shrink-0">
              <h2 className="text-sm font-semibold text-white">
                Event Details
              </h2>
            </div>
            <div className="space-y-3 p-3 text-xs">
              {activeTournament && <EntryTimelinePanel event={activeTournament} />}
              {activeTournament && <details className="rounded border border-border p-2">
                <summary className="cursor-pointer font-semibold text-white">Round rules and format</summary>
                <dl className="mt-2 space-y-1">{resolveTournamentFormat(activeTournament).roundStructure.map(round => <div key={round} className="flex justify-between gap-2"><dt className="text-gray-400">{round}</dt><dd className="text-white">{resolveTournamentFormat(activeTournament).roundBestOf?.[round] === 4 ? 'Up to 4 · draws' : 'Best of ' + resolveTournamentFormat(activeTournament).roundBestOf?.[round]}</dd></div>)}</dl>
                <p className="mt-2 text-gray-400">{resolveTournamentFormat(activeTournament).seedingModel}</p>
                {resolveTournamentFormat(activeTournament).qualifiers && <p className="mt-2 text-amber-200">{resolveTournamentFormat(activeTournament).qualifiers} qualification places; play stops at the deciding qualifying round.</p>}
                {resolveTournamentFormat(activeTournament).specialRules?.map(rule => <p key={rule} className="mt-2 text-amber-200">{rule === 'shootOut' ? '10-minute frame; 15-second shot clock, then 10 seconds after five minutes. Fouls give ball in hand. Level scores use a blue-ball shoot-out.' : rule === 'blackBallDecider' ? 'A black-ball shoot-out replaces the deciding frame.' : rule === 'handicap' ? 'Club handicap: the lower seed receives two points per ranking-place gap, capped at 28, at the start of every frame.' : 'After a 147, a golden ball worth 20 points makes a 167 possible.'}</p>)}
                {pathwayRuleSummary(activeTournament).map(rule => <p key={rule} className="mt-2 text-gray-300">{rule}</p>)}
                {resolveTournamentFormat(activeTournament).sourceStatus && <p className="mt-2 text-[10px] text-gray-500">{resolveTournamentFormat(activeTournament).sourceStatus}</p>}
              </details>}
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Winner prize</span>
                <b className="text-green-400">
                  {formatMoney(
                    activeTournament?.winnerPrize ??
                      activeTournament?.prizeMoney ??
                      0,
                  )}
                </b>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Ranking credit</span>
                <b className="text-white">
                  {activeTournament?.rankingType === 'World Ranking' || activeTournament?.rankingType === 'One-Year' ? 'Finishing prize earnings' : `${activeTournament?.rankingValue ?? 0} pts`}
                </b>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Entry</span>
                <b
                  className={
                    tournamentEntered ? "text-green-400" : "text-amber-400"
                  }
                >
                  {tournamentEntered ? "Confirmed" : "Required"}
                </b>
              </div>
              <div className="border-t border-border pt-3">
                {isMajorEvent ? (
                  <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-2.5">
                    <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                      <Crown className="h-3 w-3" /> Championship stakes
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-50/80">
                      {activeTournament?.progressionImpact ?? majorMessage}
                    </p>
                  </div>
                ) : null}
                <p className="text-[9px] uppercase tracking-[0.16em] text-gray-500">
                  Objective
                </p>
                <p className="mt-1 text-white">
                  {hubData.objectives[0]?.label ?? "Advance through the draw"}
                </p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-[9px] uppercase tracking-[0.16em] text-gray-500">
                  Last Result
                </p>
                <p className="mt-1 text-gray-400">
                  <PlayerNames text={lastResult
                    ? `${lastResult.winner} def. ${lastResult.loser} ${lastResult.score}`
                    : "No completed matches yet"}/>
                </p>
              </div>
            </div>
          </section>

        <section className="care-panel"><div className="care-panel-heading"><h2>Results & rewards</h2></div><div className="care-panel-body"><TournamentRewards event={activeTournament}/></div></section>
        <section className="care-panel"><div className="care-panel-heading"><h2>Tournament Progress</h2></div><div className="care-panel-body"><div className="hub-stage-list">{stageLabels.map(stage=><div key={stage.label}><span>{stage.label}</span><span>{stage.status}</span><ProgressBar value={stage.status==='completed'?100:stage.status==='current'?32:0} tone={stage.status==='completed'?'green':'amber'} compact/></div>)}</div></div></section>
        {activeTournament.legacyEntryHonoured&&<p className="hub-support-note">Your previously accepted entry has been restored after a save rules update. This exception applies to this event only; future World Championship entries use the ranking cutoff and qualifying results.</p>}
        {tournamentEntered&&completedRounds.length===0&&!(gameState.liveMatch?.tournamentId===activeTournament.id&&gameState.liveMatch.status==='In Progress')&&<button className="btn-secondary text-xs" onClick={()=>withdrawTournament(activeTournament.id)}>Withdraw Entry</button>}
      </div>}
    </div>
    <footer className="hub-workspace-footer"><div><span>Confidence <strong>{formatPercent(gameState.player.confidence)}</strong></span><span>Freshness <strong>{formatPercent(freshness)}</strong></span><span>Equipment <strong>{equipmentReady?'Ready':'Check'}</strong></span></div><button className="hub-prep-shortcut" onClick={()=>setTab('Preparation')}>{matchGap?`${matchGap.days===0?'Same-day turnaround':`${matchGap.days}-day gap`} · ${matchGap.applied?'Preparation complete':'Choose recovery'}`:'Review preparation'}</button></footer>
  </div>;
}
