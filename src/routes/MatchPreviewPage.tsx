import { PlayerNames } from '../components/game/PlayerNames';
import { EntryCriteriaPanel } from '../components/game/EntryCriteriaPanel'
import { currentPublishedRanking } from '../game/rankingPresentation'
import { pathwayAgeLimit } from '../game/pathwayRules'
import { previewDifficulty } from '../game/matchPreviewPresentation'
import { PlayerLink } from '../components/game/PlayerLink';
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { scoutingReport } from '../game/realism/scouting'
import { ChevronRight, Swords, Target, Users, Wrench, Search } from 'lucide-react'
import { SectionTabs } from '../components/ui/SectionTabs'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import { advancementBlocker, getTournamentPlayability } from '../hooks/useGameState'
import { requiredDecisionBlocker } from '../game/requiredDecision'
import { buildMatchPreviewData } from '../utils/liveRouteData'
import { formatMoney, formatPercent, formatAttribute } from '../utils/formatters'

const PREVIEW_TABS = ['Matchup', 'Scouting', 'Equipment & event'] as const

const FRAME_PLANS = ['Attack', 'Balanced', 'Safety'] as const
const MENTAL_FOCUS_OPTIONS = ['Composed', 'Confident', 'Counter'] as const
const TEMPO_OPTIONS = ['Steady', 'Quick'] as const

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getReadinessScore(confidence: number, fatigue: number, cueFamiliarity: number, pressureLevel: number) {
  return clamp(Math.round((confidence + (100 - fatigue) + cueFamiliarity + (100 - pressureLevel)) / 4), 0, 100)
}

function metricTone(value: number, inverse = false) {
  const adjusted = inverse ? 100 - value : value
  if (adjusted >= 72) return 'text-green-400'
  if (adjusted >= 52) return 'text-amber-400'
  return 'text-red-400'
}

function getEdgeTone(edge: number | null) {
  if (edge == null) return 'text-gray-500'
  if (edge >= 5) return 'text-green-400'
  if (edge <= -5) return 'text-red-400'
  return 'text-amber-400'
}

function formatEdgeLabel(edge: number | null) {
  if (edge == null) return 'Scout estimate pending'
  if (edge > 0) return `You +${formatAttribute(edge)}`
  if (edge < 0) return `Opponent +${formatAttribute(Math.abs(edge))}`
  return 'Even matchup'
}

export function MatchPreviewPage() {
  const { gameState, startLiveMatch, updateLiveMatchTactics, continueToNextTournament } = useGame()
  const navigate = useNavigate()
  const [tab, setTab] = useState<typeof PREVIEW_TABS[number]>('Matchup')
  const [plan, setPlan] = useState<(typeof FRAME_PLANS)[number]>('Balanced')
  const [focus, setFocus] = useState<(typeof MENTAL_FOCUS_OPTIONS)[number]>('Composed')
  const [tempo, setTempo] = useState<(typeof TEMPO_OPTIONS)[number]>('Steady')
  const {
    activeTournament,
    activeRound,
    nextOpponent,
    playerOverall,
    playerPotential,
    opponentConfidence,
    opponentFatigue,
    opponentPressure,
    currentCue,
    currentCueState,
    currentChalk,
    currentTip,
    bestOf,
    totalMeetings,
    wins,
    losses,
    eventWins,
    eventLosses,
    eventFrameDifferential,
    strengths,
    weaknesses,
    matchAttributeComparison,
    attributeComparison,
    scoutNotes,
    scoutConfidence,
    tacticalPlan,
    cueFamiliarity,
    recentOpponentResults,
    matchInfo,
    pressureLevel,
  } = buildMatchPreviewData(gameState)
  const playerRank = currentPublishedRanking(gameState)?.ranking
  const activeLiveMatch = gameState.liveMatch?.status === 'In Progress' ? gameState.liveMatch : null
  const playability = activeTournament ? getTournamentPlayability(gameState, activeTournament) : null
  const opponentName = nextOpponent?.playerName ?? 'Opponent TBD'
  const scouting = scoutingReport(gameState, opponentName)
  const estimateRange = (value: number | null | undefined) => value == null ? 'Unknown' : `${Math.max(1, Math.round(value / 5) * 5 - scouting.uncertainty)}–${Math.min(99, Math.round(value / 5) * 5 + scouting.uncertainty)}`
  const opponentProfile = gameState.worldPlayers.find(player => player.playerName === opponentName)
  const ageLimit = activeTournament ? pathwayAgeLimit(activeTournament) : undefined
  const readinessScore = getReadinessScore(gameState.player.confidence, gameState.player.fatigue, cueFamiliarity, pressureLevel)
  const difficultyLabel = previewDifficulty(playerOverall, opponentProfile?.overallRating)
  const equipmentRows = [
    { label: 'Cue', name: currentCue?.name ?? 'No cue selected', condition: currentCueState?.condition ?? currentCue?.condition ?? 0 },
    { label: 'Chalk', name: currentChalk?.name ?? 'Standard chalk', condition: clamp(70 + (currentChalk?.consistency ?? 0) / 2, 0, 100) },
    { label: 'Tip', name: currentTip?.name ?? 'Standard tip', condition: currentCueState?.tipCondition ?? currentTip?.durability ?? 0 },
  ]
  const keyScoutRows = strengths.slice(0, 3)
  const riskScoutRows = weaknesses.slice(0, 3)
  const opponentPatternText = recentOpponentResults.map((result) => `${result.result} ${result.score}`).join(' • ') || 'No recent data yet'

  const decisionBlocker = requiredDecisionBlocker(gameState)
  const daysUntilStart = playability?.daysUntilStart ?? 0
  const advanceBlocker = daysUntilStart > 0 ? advancementBlocker(gameState) : null
  const nextAction = decisionBlocker
    ? { label: decisionBlocker.label, route: decisionBlocker.route }
    : activeLiveMatch ? { label: 'Resume Match' }
    : !activeTournament || activeTournament.status !== 'Entered' ? { label: 'Tournament Hub', route: '/tournaments/hub' }
    : !playability?.travelBooked ? { label: 'Book Travel', route: '/travel' }
    : !playability?.preparationConfirmed ? { label: 'Prepare', route: '/tournament/preparation' }
    : advanceBlocker ? { label: advanceBlocker.label, route: advanceBlocker.route }
    : daysUntilStart > 0 ? { label: 'Advance to Tournament' }
    : playability?.canPlay ? { label: 'Start Match' }
    : { label: 'Tournament Hub', route: '/tournaments/hub' }

  function handleStartMatch() {
    if (nextAction.route) {
      navigate(nextAction.route)
      return
    }
    if (daysUntilStart > 0 && !activeLiveMatch) {
      continueToNextTournament()
      return
    }
    if (activeLiveMatch) {
      navigate('/match/live')
      return
    }
    if (!activeTournament?.id) return
    if (!playability?.canPlay) {
      navigate(!playability?.travelBooked ? '/travel' : !playability?.preparationConfirmed ? '/tournament/preparation' : '/tournaments/hub')
      return
    }
    startLiveMatch(activeTournament.id)
    updateLiveMatchTactics({ tacticalPlan: plan, mentalFocus: focus, tempo })
    navigate('/match/live')
  }

  return <div className="match-preview-page" data-testid="match-preview-viewport">
    <header className="preview-header">
      <div className="preview-title"><p>{activeTournament?.name ?? 'Match Centre'} · {activeRound ?? 'Awaiting Entry'} · {bestOf}</p><h1>Match Preview</h1><span>{activeTournament?.location ?? 'Venue TBC'} · {matchInfo.time}</span></div>
      <div className="preview-header-metrics"><div><span>Ability comparison</span><strong>{difficultyLabel}</strong></div><div><span>Readiness</span><strong>{readinessScore}%</strong></div></div>
      <button type="button" onClick={handleStartMatch} className="btn-primary preview-start">{nextAction.label}<ChevronRight className="h-4 w-4"/></button>
    </header>
    {!activeLiveMatch&&!playability?.canPlay&&<p role="status" className="preview-blocker">{decisionBlocker?.reason??advanceBlocker?.reason??playability?.reason}{daysUntilStart>0&&!decisionBlocker&&!advanceBlocker&&` Advance to ${activeTournament?.startDate} here, then review your updated condition and start the match.`}</p>}
    <SectionTabs id="preview-sections" label="Match preview sections" tabs={PREVIEW_TABS} active={tab} onChange={setTab}/>
    <div className="preview-content" role="tabpanel" id="preview-sections-panel" aria-labelledby={`preview-sections-tab-${PREVIEW_TABS.indexOf(tab)}`}>
      {tab==='Matchup'&&<div className="preview-matchup">
        <section className="preview-duel">
      <div className="preview-players">
        <div aria-label="Player profile" className="card min-h-0 border-green-600/70 bg-gradient-to-r from-green-600/15 via-green-600/5 to-surface p-3">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> You
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-green-500 bg-green-600/10 text-xl font-bold text-green-400">
              {getInitials(gameState.player.fullName)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-white"><PlayerLink name={gameState.player.fullName}/></h2>
              <p className="truncate text-[11px] text-gray-400">{gameState.player.careerStage} - {gameState.player.playingStyle}</p>
              <p className="mt-1.5 text-[11px] text-gray-400">
                {gameState.player.rankingLabel} <span className="font-bold text-white">{playerRank == null ? 'Unranked' : `#${playerRank}`}</span>
                <span className="mx-2 text-border">|</span>
                Cash <span className="font-bold text-green-400">{formatMoney(gameState.player.cash)}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                OVR <span className="font-bold text-white">{playerOverall}</span>
                <span className="mx-2 text-border">|</span>
                POT <span className="font-bold text-green-400">{playerPotential}</span>
              </p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 border-t border-border/60 pt-1.5 text-center">
            <div><p className="text-[10px] text-gray-400">Confidence</p><p className={`text-[15px] font-bold ${metricTone(gameState.player.confidence)}`}>{formatPercent(gameState.player.confidence)}</p></div>
            <div className="border-x border-border"><p className="text-[10px] text-gray-400">Fatigue</p><p className={`text-[15px] font-bold ${metricTone(gameState.player.fatigue, true)}`}>{formatPercent(gameState.player.fatigue)}</p></div>
            <div><p className="text-[10px] text-gray-400">Pressure</p><p className={`text-[15px] font-bold ${metricTone(pressureLevel, true)}`}>{formatPercent(pressureLevel)}</p></div>
          </div>
        </div>

        <div aria-label="Opponent profile" className="card min-h-0 border-red-600/70 bg-gradient-to-l from-red-600/15 via-red-600/5 to-surface p-3">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Opponent
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-500 bg-red-600/10 text-xl font-bold text-red-400">
              {getInitials(opponentName)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-white"><PlayerLink name={opponentName}/></h2>
              <p className="truncate text-[11px] text-gray-400">{opponentProfile ? `Age ${opponentProfile.age} · ${opponentProfile.hasTourCard ? 'Professional' : 'Off-tour player'}` : 'Player information unavailable'}</p>
              <p className="mt-1.5 text-[11px] text-gray-400">
                <button className="font-bold text-white underline decoration-white/30 underline-offset-2" onClick={()=>setTab('Equipment & event')}>{ageLimit ? `Under-${ageLimit} event · no professional cards` : 'Check event eligibility'}</button>
                <span className="mx-2 text-border">|</span>
                Scout <span className={`font-bold ${metricTone(scoutConfidence)}`}>{scoutConfidence}%</span>
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                OVR <span className="font-bold text-white">{scouting.ability}</span>
                <span className="mx-2 text-border">|</span>
                <span className="text-amber-400">Public rating · {scouting.samples} observations</span>
              </p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 border-t border-border/60 pt-1.5 text-center">
            <div><p className="text-[10px] text-gray-400">Confidence</p><p className={`text-[15px] font-bold ${metricTone(opponentConfidence)}`}>{formatPercent(opponentConfidence)}</p></div>
            <div className="border-x border-border"><p className="text-[10px] text-gray-400">Fatigue</p><p className={`text-[15px] font-bold ${metricTone(opponentFatigue, true)}`}>{formatPercent(opponentFatigue)}</p></div>
            <div><p className="text-[10px] text-gray-400">Pressure</p><p className={`text-[15px] font-bold ${metricTone(opponentPressure, true)}`}>{formatPercent(opponentPressure)}</p></div>
          </div>
        </div>
      </div>


          <div className="preview-h2h"><div><h2><Users className="h-4 w-4"/>Head-to-Head</h2><span>Your recorded meetings</span></div><dl><div><dt>Your Wins</dt><dd>{wins}</dd></div><div><dt>Meetings</dt><dd>{totalMeetings}</dd></div><div><dt>Losses</dt><dd>{losses}</dd></div></dl><button className="preview-text-link" onClick={()=>navigate('/career/rivalries')}>View history →</button></div>
        </section>
        <section className="care-panel preview-analysis"><div className="care-panel-heading"><h2><Swords className="h-4 w-4"/>Matchup Analysis</h2><span className="care-badge">Pre-match outlook</span></div><div className="care-panel-body">
          <p>Compare your approaches before choosing the opening frame tactics.</p>
          <div className="preview-approaches">{tacticalPlan.map(item=><article key={item.label}><div><h3>{item.label}</h3><strong>{formatPercent(item.level)}</strong></div><ProgressBar value={item.level} tone={item.level>=65?'green':'amber'} compact/><p>{item.description}</p></article>)}</div>
        </div><footer className="care-panel-actions"><span className="text-xs text-gray-300">Detailed opponent attributes are scouting estimates.</span><button className="preview-text-link" onClick={()=>setTab('Scouting')}>View comparison →</button></footer></section>
      </div>}
      {tab==='Scouting'&&<div className="preview-scouting">
        <section className="care-panel"><div className="care-panel-heading"><h2><Search className="h-4 w-4"/>Scout Report</h2><span className="care-badge">{formatPercent(scoutConfidence)} confidence</span></div><div className="care-panel-body">
          <div className="preview-strengths">{[{label:'Your strongest routes',rows:keyScoutRows},{label:'Risk watch',rows:riskScoutRows}].map(group=><div key={group.label}><h3>{group.label}</h3>{group.rows.map(trait=><div className="preview-trait" key={trait.label}><span>{trait.label}</span><strong>{formatAttribute(trait.value)}</strong><ProgressBar value={trait.value} compact/></div>)}</div>)}</div>
          <div className="care-note"><PlayerNames text={scoutNotes}/></div><h3>Recent opponent pattern</h3><p><PlayerNames text={opponentPatternText}/></p><p>Event {eventWins}–{eventLosses} · Frame difference {eventFrameDifferential>0?'+':''}{eventFrameDifferential}</p>
        </div></section>
        <section className="care-panel"><div className="care-panel-heading"><h2>Match Profile Comparison</h2><span className="care-badge">You vs {getInitials(opponentName)}</span></div><div className="care-panel-body">
          <div className="preview-comparison-summary">{matchAttributeComparison.map(item=><div key={item.label}><span>{item.label}</span><strong>{formatAttribute(item.player)} <small>/ {estimateRange(item.opponent)}</small></strong><em className={getEdgeTone(item.edge)}>{formatEdgeLabel(item.edge)}</em></div>)}</div>
          <div className="preview-comparison-table"><div className="preview-comparison-row preview-comparison-head"><span>Attribute</span><span>You</span><span>Opponent estimate</span><span>Edge estimate</span></div>{attributeComparison.map(item=><div className="preview-comparison-row" key={item.label}><span>{item.label}</span><strong>{formatAttribute(item.player)}</strong><span>{estimateRange(item.opponent)}</span><span className={getEdgeTone(item.edge)}>{formatEdgeLabel(item.edge)}</span></div>)}</div>
        </div></section>
      </div>}
      {tab==='Equipment & event'&&<div className="preview-equipment-layout">
        <section className="care-panel"><div className="care-panel-heading"><h2><Wrench className="h-4 w-4"/>Equipment Check</h2><span className="care-badge">Match setup</span></div><div className="care-panel-body"><div className="preview-equipment-list">{equipmentRows.map(item=><article key={item.label}><span>{item.label}</span><h3>{item.name}</h3><strong>{formatPercent(item.condition)}</strong><ProgressBar value={item.condition} compact/></article>)}</div><dl className="preview-facts"><div><dt>Familiarity</dt><dd>{formatPercent(cueFamiliarity)}</dd></div><div><dt>Primary Bonus</dt><dd>+{formatAttribute(currentCue?.bonuses['Cue Ball Control']??0)} cue ball</dd></div></dl></div><footer className="care-panel-actions"><button className="btn-secondary text-xs" onClick={()=>navigate('/equipment/chalk-tips')}>Change Equipment</button><button className="btn-secondary text-xs" onClick={()=>navigate('/training')}>Adjust Training</button></footer></section>
        <section className="care-panel"><div className="care-panel-heading"><h2>Event information</h2></div><div className="care-panel-body"><dl className="preview-facts">{[['Match Time',matchInfo.time],['Venue',activeTournament?.location??'Venue TBC'],['Format',bestOf],['Referee',matchInfo.referee],['Conditions',matchInfo.conditions]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{activeTournament&&<EntryCriteriaPanel event={activeTournament}/>}</div><footer className="care-panel-actions"><button className="btn-secondary text-xs" onClick={()=>navigate('/tournaments/hub')}>Tournament Hub</button></footer></section>
      </div>}
    </div>
    <section className="preview-tactics" data-testid="tactical-plan" aria-label="Tactical Plan"><div className="preview-tactics-title"><Target className="h-4 w-4"/><h2>Tactical Plan</h2><span>Opening frame</span></div><div className="preview-tactic-groups">
      <fieldset><legend>Frame Plan</legend><div>{FRAME_PLANS.map(option=><button key={option} type="button" aria-pressed={plan===option} onClick={()=>setPlan(option)}>{option}</button>)}</div></fieldset>
      <fieldset><legend>Mental Focus</legend><div>{MENTAL_FOCUS_OPTIONS.map(option=><button key={option} type="button" aria-pressed={focus===option} onClick={()=>setFocus(option)}>{option}</button>)}</div></fieldset>
      <fieldset><legend>Tempo</legend><div>{TEMPO_OPTIONS.map(option=><button key={option} type="button" aria-pressed={tempo===option} onClick={()=>setTempo(option)}>{option}</button>)}</div></fieldset>
    </div><p className="preview-coach-note"><strong>Coach:</strong> {tacticalPlan[0]?.description} {tacticalPlan[0]?.impact}</p></section>
  </div>
}
