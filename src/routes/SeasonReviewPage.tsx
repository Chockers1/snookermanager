import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Crown, Trophy } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PlayerLink } from '../components/game/PlayerLink';
import { PlayerNames } from '../components/game/PlayerNames';
import { SeasonRankings } from '../components/game/SeasonReviewPopup';
import { SectionTabs } from '../components/ui/SectionTabs';
import { CareerSeasonSummary } from '../components/career/CareerDepthPanels';
import { WorldDigestPanel } from '../components/career/RealismPanels';
import { useGame } from '../context/useGame';
import { createSeasonRecord, getNextEligibleTournament, seasonTitleEntries } from '../hooks/useGameState';
import { seasonTitle, snapshotWeekLabel } from '../game/seasonClock';
import { currentPublishedRanking } from '../game/rankingPresentation';
import { formatAttribute, formatMoney, formatPercent } from '../utils/formatters';

const tabs = ['Overview', 'Results', 'Development', 'Around the tour', 'Next season'] as const;
const signed = (value: number) => `${value > 0 ? '+' : ''}${formatAttribute(value)}`;
const signedMoney = (value: number) => `${value >= 0 ? '+' : '−'}${formatMoney(Math.abs(value))}`;
const rankText = (value?: number) => value && value < 999 ? `#${value}` : 'Unranked';

export function SeasonReviewPage() {
  const { gameState, finishSeason, startNextSeason } = useGame();
  const navigate = useNavigate();
  const [tab, setTab] = useState<typeof tabs[number]>('Overview');
  const transition = gameState.seasonReview?.pending ? gameState.seasonReview : null;
  const record = transition?.completedSeason ?? createSeasonRecord(gameState, gameState.season);
  const titleEntries = seasonTitleEntries(gameState, record.season);
  const events = gameState.history.tournamentHistory.filter(event => event.season === record.season && (event.matchesPlayed > 0 || event.status === 'In Progress'));
  const snapshots = gameState.history.snapshots.filter(snapshot => snapshot.season === record.season);
  const opening = gameState.history.seasonOpenings?.[record.season];
  const cashChange = transition?.financialChange ?? (opening ? gameState.player.cash - opening.snapshot.cash : null);
  const finalWorldRank = record.closingRankingLabel === 'World Ranking' ? transition?.finalRankings?.find(row => row.playerName === gameState.player.fullName)?.ranking : undefined;
  const currentRank = transition ? finalWorldRank ?? record.closingRanking : currentPublishedRanking(gameState)?.ranking;
  const rankLabel = transition ? record.closingRankingLabel : gameState.player.rankingLabel;
  const comparableRank = record.openingRankingLabel === rankLabel && record.openingRanking > 0 && record.openingRanking < 999 && currentRank && currentRank < 999;
  const movement = comparableRank ? record.openingRanking - currentRank : null;
  const winRate = record.matchesPlayed ? record.wins / record.matchesPlayed * 100 : null;
  const draws = Math.max(0, record.matchesPlayed - record.wins - record.losses);
  const baseline = gameState.attributeHistory?.seasons[record.season];
  const closingAttributes = transition ? gameState.attributeHistory?.snapshots.filter(point => point.date <= record.endedOn).at(-1)?.attributes : gameState.attributes;
  const development = (['technical', 'mental', 'physical'] as const).map(group => ({
    group, rows: Object.entries((closingAttributes ?? gameState.attributes)[group]).map(([name, value]) => ({name, value, delta: baseline && closingAttributes ? value - baseline.attributes[group][name] : null})),
  }));
  const improvements = development.flatMap(group => group.rows).filter(row => row.delta !== null && row.delta > 0.005).length;
  const sponsorMonthly = gameState.sponsors.reduce((sum, sponsor) => sum + sponsor.monthlyValue, 0);
  const coach = gameState.coaches.find(item => item.id === gameState.currentCoachId);
  const nextEvent = getNextEligibleTournament(gameState);
  const worldLists = transition ? [
    {title:'Promoted & Tour Cards',items:transition.promotedPlayers,empty:'No new tour-card awards recorded.'},
    {title:'Tour Card Losses',items:transition.cardLosses,empty:'No tour-card losses recorded.'},
    {title:'Retirements',items:transition.retirements,empty:'No retirements recorded.'},
    {title:'New Names to Watch',items:transition.newcomers,empty:'No new intake recorded.'},
  ] : [];
  const trend = snapshots.filter(point => point.ranking > 0 && point.ranking < 999 && (!point.rankingLabel || point.rankingLabel === rankLabel)).map(point => ({label:snapshotWeekLabel(point, gameState), date:point.date, rank:point.ranking}));
  const metrics = [
    {label:'Season record',value:`${record.wins}–${record.losses}${draws ? `–${draws}` : ''}`,detail:`${record.matchesPlayed} matches · W–L${draws ? '–D' : ''}`},
    {label:transition?'Closing ranking':'Current ranking',value:rankText(currentRank),detail:rankLabel},
    {label:'Tournament titles',value:String(record.titles),detail:`${record.majorTitles} major titles`},
    {label:'Prize money',value:formatMoney(record.prizeMoney),detail:'Recorded season awards'},
  ];
  return <div className="season-review-page" data-testid="season-review-viewport">
    <header className="season-review-header">
      <div><p className="wellbeing-eyebrow">{transition?'Season complete':'Your season so far'}</p><h1>Season Review</h1><p>{seasonTitle(gameState, record.season)} · <PlayerLink name={gameState.player.fullName}/></p></div>
      <div className="season-review-stamp"><Trophy aria-hidden="true"/><div><span>{transition?'Final report':'Live report'}</span><strong>{record.season}</strong></div></div>
    </header>
    <section className="season-review-metrics" aria-label="Season summary">{metrics.map(metric=><article key={metric.label}><p>{metric.label}</p><strong>{metric.value}</strong><span>{metric.detail}</span></article>)}</section>
    <SectionTabs id="season-review-sections" label="Season review sections" tabs={tabs} active={tab} onChange={setTab}/>
    <div className="season-review-content" role="tabpanel" id="season-review-sections-panel" aria-labelledby={`season-review-sections-tab-${tabs.indexOf(tab)}`}>
      {tab==='Overview'&&<div className="season-review-overview">
        <section className="care-panel care-panel-gold" aria-label="Season Snapshot"><div className="care-panel-heading"><span className="wellbeing-eyebrow">The campaign</span><span className="care-badge">{transition?'Final results':'In progress'}</span></div><div className="care-panel-body">
          <h2>{record.matchesPlayed===0?'Your season is waiting to unfold':record.titles>0?`${record.titles} title${record.titles===1?'':'s'} to remember`:record.wins>record.losses?'A season to build on':'Finding your next step'}</h2>
          <p>{record.matchesPlayed ? `${record.wins} wins across ${record.matchesPlayed} matches. ${transition?'Your recorded results are ready to review.':'Every event adds to this season’s story.'}`:'Enter your first event to begin your season record.'}</p>
          <div className="season-review-feature-stats"><div><span>Win rate</span><strong>{winRate===null?'—':formatPercent(winRate)}</strong></div><div><span>Highest break</span><strong>{record.highestBreak||'—'}</strong></div><div><span>Centuries</span><strong>{record.centuries}</strong></div></div>
          <h3>Season silverware</h3>{titleEntries.length?<ul className="season-review-titles">{titleEntries.map(event=><li key={event.id}><Trophy className="h-4 w-4 shrink-0 text-amber-200"/><span>{event.tournamentName}</span></li>)}</ul>:<p>No tournament titles recorded this season. Qualifying places are separate achievements.</p>}
          <div className="care-note"><h3>Best recorded result</h3><p>{record.bestResult}</p></div>
        </div><footer className="care-panel-actions"><button className="btn-secondary text-xs" onClick={()=>setTab('Results')}>Explore season results <ArrowUpRight className="h-3 w-3"/></button></footer></section>
        <div className="season-review-overview-side">
          <section className="care-panel care-panel-green"><div className="care-panel-heading"><span className="wellbeing-eyebrow">Standing & direction</span></div><div className="care-panel-body"><h2>{transition?transition.careerDecision.title:gameState.player.careerStage}</h2><p>{transition?transition.careerDecision.detail:'Review your position, keep entry dates in view and choose the events that support your career.'}</p><dl className="season-review-facts"><div><dt>Opening position</dt><dd>{rankText(record.openingRanking)} · {record.openingRankingLabel}</dd></div><div><dt>Season movement</dt><dd>{movement===null?'Different or unrecorded lists':movement===0?'No change':`${movement>0?'Up':'Down'} ${Math.abs(movement)} places`}</dd></div></dl>{record.openingSnapshotPartial&&<p className="season-review-caveat">Opening comparison uses the earliest retained snapshot ({record.startedOn}); the exact season-start ranking was not saved.</p>}</div></section>
          <section className="care-panel"><div className="care-panel-heading"><span className="wellbeing-eyebrow">Financial snapshot</span></div><div className="care-panel-body"><div className="season-review-cash"><span>{transition?'Season cash change':'Cash change since opening'}</span><strong>{cashChange===null?'Not recorded':signedMoney(cashChange)}</strong></div><p>{opening?.partial?'Compared with the earliest saved opening balance.':'Cash change includes income, purchases and other spending; it is not prize money alone.'}</p><dl className="season-review-facts"><div><dt>Available cash now</dt><dd>{formatMoney(gameState.player.cash)}</dd></div><div><dt>Current sponsor income</dt><dd>{formatMoney(sponsorMonthly)}/mo</dd></div></dl></div><footer className="care-panel-actions"><button className="btn-secondary text-xs" onClick={()=>navigate('/finance')}>View finances</button></footer></section>
        </div>
      </div>}
      {tab==='Results'&&<div className="season-review-results">
        <section className="care-panel"><div className="care-panel-heading"><div><h2>Tournament results</h2><p>{events.length} recorded appearances · Every circuit</p></div><button className="btn-secondary text-xs" onClick={()=>navigate('/career/stats#tournament-history')}>Full history</button></div><div className="season-review-table-scroll" tabIndex={0} aria-label="Season results"><table className="season-review-table"><thead><tr><th>Event / date</th><th>Finish</th><th>W–L</th><th>Prize</th></tr></thead><tbody>{events.map(event=><tr key={event.id}><td><strong>{event.tournamentName}</strong><span>{event.startDate} · {event.tourCircuit||event.eventType}</span></td><td>{event.result}</td><td>{event.wins}–{event.losses}</td><td>{formatMoney(event.prizeMoney)}</td></tr>)}{!events.length&&<tr><td colSpan={4}>No tournament appearances recorded yet.</td></tr>}</tbody></table></div></section>
        <section className="care-panel"><div className="care-panel-heading"><div><h2>Ranking over the season</h2><p>{rankLabel} · Saved positions only</p></div></div>{trend.length?<div className="season-review-chart"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}><LineChart data={trend}><CartesianGrid stroke="#ffffff0b" vertical={false}/><XAxis dataKey="label" tick={{fontSize:11,fill:'#cbd5e1'}} axisLine={false} tickLine={false}/><YAxis reversed allowDecimals={false} domain={['dataMin','dataMax']} width={36} tick={{fontSize:11,fill:'#cbd5e1'}} axisLine={false} tickLine={false}/><Tooltip formatter={value=>rankText(Number(value))} contentStyle={{background:'#14202b',border:'1px solid #304459',borderRadius:8}}/><Line dataKey="rank" name="Ranking" stroke="#34d399" strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer></div>:<div className="care-panel-body"><p>No published ranking history for this list yet.</p></div>}<footer className="care-panel-actions"><button className="btn-secondary text-xs" onClick={()=>navigate('/rankings')}>Open rankings</button></footer></section>
      </div>}
      {tab==='Development'&&<div className="season-review-development"><div className="season-review-development-heading"><div><h2>How your game changed</h2><p>{baseline&&closingAttributes?`${improvements} attributes improved · ${baseline.date??'Saved season baseline'} → ${transition?record.endedOn:gameState.currentDate}`:'No complete season comparison recorded. Current attributes are shown; missing changes are not counted as zero.'}</p></div><button className="btn-secondary text-xs" onClick={()=>navigate('/player/attributes')}>Full attributes</button></div><div className="season-review-attribute-grid">{development.map(group=><section className="care-panel" key={group.group}><div className="care-panel-heading"><h2 className="capitalize">{group.group}</h2><span className="care-badge">Season change</span></div><div className="care-panel-body">{group.rows.map(row=><div className="season-review-attribute" key={row.name}><span>{row.name}</span><strong>{formatAttribute(row.value)}</strong><em className={row.delta!==null&&row.delta<0?'text-amber-200':'text-emerald-300'}>{row.delta===null?'—':signed(row.delta)}</em></div>)}</div></section>)}</div><div className="season-review-development-footer"><span>{coach?`${coach.name} · ${formatPercent(coach.compatibility)} player fit`:'No active coach · Independent training remains available.'}</span><button className="btn-secondary text-xs" onClick={()=>navigate('/training')}>Review training</button></div></div>}
      {tab==='Around the tour'&&<div className="season-review-world" tabIndex={0} aria-label="Season world report">
        {transition?<><div className="season-review-world-top"><section className="care-panel"><div className="care-panel-heading"><h2>Major Tournament Winners</h2><Crown className="h-5 w-5 text-amber-200"/></div><div className="care-panel-body"><div className="season-review-winners">{transition.majorWinners.map(event=><article key={event.tournamentName}><span>{event.tournamentName}</span><strong className={event.playerWon?'text-emerald-300':''}><PlayerLink name={event.winner}/></strong><p>Season champion</p></article>)}</div>{!transition.majorWinners.length&&<p>No major tournament winners were recorded.</p>}</div></section><div className="season-review-world-rankings"><div className="season-review-number-one"><Crown className="h-6 w-6 text-amber-200"/><div><span>World Number One</span><strong>{transition.worldNumberOne?<PlayerLink name={transition.worldNumberOne.playerName}/>: 'Not recorded'}</strong></div></div><SeasonRankings review={transition} playerName={gameState.player.fullName}/></div></div><div className="season-review-movements">{worldLists.map(group=><section className="care-panel" key={group.title}><div className="care-panel-heading"><h2>{group.title}</h2><span className="care-badge">{group.items.length}</span></div><div className="care-panel-body"><ul>{group.items.length?group.items.map(item=><li key={item}><PlayerNames text={item}/></li>):<li>{group.empty}</li>}</ul></div></section>)}</div></>:<section className="care-panel"><div className="care-panel-heading"><h2>The season is still in play</h2></div><div className="care-panel-body"><p>Final champions, closing rankings, tour-card changes and new arrivals appear when the season is complete. Recent world reports remain available below.</p><button className="btn-secondary text-xs" onClick={()=>navigate('/rankings')}>View current rankings</button></div></section>}
        <WorldDigestPanel/><CareerSeasonSummary/>
      </div>}
      {tab==='Next season'&&<div className="season-review-next">
        <section className="care-panel care-panel-gold"><div className="care-panel-heading"><span className="wellbeing-eyebrow">{transition?'Your next chapter':'Plan ahead'}</span><CalendarDays className="h-5 w-5 text-amber-200"/></div><div className="care-panel-body"><h2>{transition?`Ready for ${transition.nextSeason}?`:'Finish with a clear direction'}</h2><p>{transition?transition.careerDecision.expectation:'Choose priority events, protect training time and leave room in your budget for travel and recovery.'}</p><div className="care-note"><h3>{transition?'New calendar ready':'Before finishing this season'}</h3><p>{transition?'Starting unlocks the new calendar and sends your first eligible event invitation.':'Finish or skip eligible events and resolve required inbox decisions. Finish Season follows those checks before advancing through the remaining weeks.'}</p></div>{nextEvent&&<div className="season-review-next-event"><span>{transition?'Next eligible event':'Next event to review'}</span><strong>{nextEvent.name}</strong><p>{nextEvent.startDate} · {nextEvent.location}</p></div>}</div><footer className="care-panel-actions"><button className="btn-secondary text-xs" onClick={()=>navigate('/calendar')}>View Calendar</button>{transition&&<button className="btn-secondary text-xs" onClick={finishSeason}>Open Review Popup</button>}</footer></section>
        <section className="care-panel care-panel-green"><div className="care-panel-heading"><span className="wellbeing-eyebrow">Prepare your campaign</span></div><div className="care-panel-body"><div className="season-review-planning-links">{[{title:'Schedule & priorities',detail:'Choose your events, training blocks and rest weeks.',route:'/calendar'},{title:'Training & development',detail:'Build a weekly routine around the parts of your game that need work.',route:'/training'},{title:'Staff & contracts',detail:'Review coaching costs and upcoming renewals.',route:'/staff/coaches'},{title:'Budget & sponsors',detail:'Check recurring commitments before booking your next trip.',route:'/finance'}].map(item=><button key={item.title} onClick={()=>navigate(item.route)}><div><strong>{item.title}</strong><span>{item.detail}</span></div><ArrowUpRight className="h-4 w-4 shrink-0"/></button>)}</div></div></section>
      </div>}
    </div>
    <footer className="season-review-footer"><p role="status"><PlayerNames text={gameState.lastAction}/></p><div><button className="btn-secondary text-xs" onClick={()=>navigate('/career/stats')}>View Full Stats</button>{transition?<button className="btn-primary text-xs" onClick={()=>{startNextSeason();navigate('/')}}>Start New Season <ArrowUpRight className="h-4 w-4"/></button>:<button className="btn-primary text-xs" onClick={finishSeason}>Finish Season <ArrowUpRight className="h-4 w-4"/></button>}</div></footer>
  </div>;
}
