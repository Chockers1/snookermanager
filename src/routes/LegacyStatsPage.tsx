import { LegacyAchievementsTab, LegacyHistoryTab, LegacyStoriesTab, LegacyTrendsTab, LegacyTrophiesTab } from '../components/career/LegacyDetailViews'
import { PlayerNames } from '../components/game/PlayerNames';
import { PlayerLink } from '../components/game/PlayerLink';
import { ActionBlockerNotice } from '../components/game/ActionBlockerNotice';
import { advancementBlocker } from '../hooks/useGameState';
import { SectionTabs } from '../components/ui/SectionTabs';
const legacyTabs = ['Overview', 'Records', 'Trophies', 'Tournament History', 'Trends', 'Achievements', 'Stories'] as const;
type LegacyTab = typeof legacyTabs[number];
import { tournamentRoundHistory } from '../game/tournamentCareerHistory';
import { seasonWeekLabel } from "../game/seasonClock";
import { careerLegacyOf, careerLegacyRating } from '../game/careerLegacy'
import { LegacyRecords } from '../components/career/LegacyRecords'
import { useNavigate, useLocation } from 'react-router-dom'
import { Award, Target, Trophy, ChevronRight } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import type { LegacyFinalRow } from '../types/game'
import { formatMoney } from '../utils/formatters'

function compactMoney(value: number) {
  const sign = value < 0 ? '-' : ''
  const absolute = Math.abs(value)
  if (absolute >= 1_000_000) return `${sign}£${(absolute / 1_000_000).toFixed(1)}m`
  if (absolute >= 1_000) return `${sign}£${Math.round(absolute / 1_000)}k`
  return `${sign}£${absolute}`
}

export function LegacyStatsPage() {
  const { gameState, continueWeek } = useGame()
  const navigate = useNavigate()
  const advanceBlocker = advancementBlocker(gameState);
  const { hash } = useLocation()
  const tabHashes: Record<LegacyTab, string> = { Overview: '', Records: '#records', Trophies: '#trophy-cabinet', 'Tournament History': '#tournament-history', Trends: '#trends', Achievements: '#achievements', Stories: '#stories' };
  const tab: LegacyTab = hash === '#goals' ? 'Achievements' : hash === '#exhibition-achievements' ? 'Trophies' : ['#season-archive', '#completed-events'].includes(hash) ? 'Tournament History' : legacyTabs.find(name => tabHashes[name] === hash) ?? 'Overview';
  const setTab = (name: LegacyTab) => navigate({ hash: tabHashes[name] }, { replace: true });
  const career = careerLegacyOf(gameState)
  const tournamentArchive = gameState.history.tournamentHistory
  const matchesPlayed = career.matchesPlayed
  const matchesWon = career.wins
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0
  const centuryBreaks = career.centuries
  const maximumBreaks = career.maximumMatches ? career.maximums : '—'
  const totalPrizeMoney = career.prizeMoney
  const currentRanking = gameState.rankings.find((row) => row.playerName === gameState.player.fullName)?.ranking ?? gameState.player.amateurRanking ?? gameState.player.worldRanking ?? 0
  const rating = careerLegacyRating(career, gameState.careerSystems.pro.hasTourCard)
  const legacyScore = rating.score
  const legacyTier = rating.tier
  const summary = {
    legacyScore,
    legacyTier,
    matchesPlayed,
    matchesWon,
    winRate,
    titles: career.trophies.length,
    majorTitles: career.trophies.filter(t => t.category === 'Major').length,
    centuryBreaks,
    maximumBreaks,
    highestRanking: currentRanking > 0 ? `#${currentRanking}` : 'Unranked',
    totalPrizeMoney,
  }
  const legacyBreakdown = rating.breakdown
  const finalsData: Array<LegacyFinalRow & { prizeKnown: boolean; impactKnown: boolean }> = tournamentArchive
    .filter((event) => event.status === 'Completed' && event.matchesPlayed > 0)
    .slice(0, 7)
    .map((event) => ({
      id: event.id,
      year: event.startDate.slice(0, 4) || gameState.season,
      event: event.tournamentName,
      category: event.eventType ?? 'Career Event',
      opponent: tournamentRoundHistory(gameState,event).at(-1)?.opponent ?? 'Not recorded',
      result: event.result,
      score: tournamentRoundHistory(gameState,event).at(-1)?.score || '-',
      prize: event.prizeMoney,
      impact: event.rankingPoints,
      prizeKnown: event.recoveredFromLedger?.prizeKnown ?? true,
      impactKnown: !event.recoveredFromLedger,
    }))

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden" data-testid="legacy-stats-page">
      <ActionBlockerNotice blocker={advanceBlocker} />
      <header className="legacy-page-heading card flex shrink-0 flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">Career</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Career Stats & Legacy</h1>
          <p className="mt-1 text-sm text-gray-400">The career of <PlayerLink name={gameState.player.fullName}/>.</p>
        </div>
        <div className="flex gap-2"><button type="button" className="btn-secondary text-xs" onClick={() => navigate('/season-review')}>Season Review</button><button type="button" className="btn-primary text-xs" title={advanceBlocker?.reason} onClick={() => advanceBlocker ? navigate(advanceBlocker.route) : continueWeek()}>Continue Career</button></div>
      </header>

      <SectionTabs id="legacy" label="Legacy sections" tabs={legacyTabs} active={tab} onChange={setTab} />
      <div key={tab} id="legacy-panel" role="tabpanel" aria-labelledby={`legacy-tab-${legacyTabs.indexOf(tab)}`} tabIndex={0}
        className={`legacy-tab-content min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain ${tab === 'Overview' ? 'legacy-tab-overview' : 'legacy-tab-details'}`}>
        {tab === 'Overview' && <div className="legacy-overview">
          <section className="legacy-identity" role="region" aria-label="Legacy score">
            <header><Trophy aria-hidden="true" /><span>Your legacy</span></header>
            <div className="legacy-score-display"><span className="text-4xl">{summary.legacyScore}</span><span>/ 100</span></div>
            <h2>{summary.legacyTier}</h2>
            <p>Built through the titles and achievements you earn.</p>
            <div className="legacy-honours"><div><strong>{summary.titles}</strong><span>Career titles</span></div><div><strong>{summary.majorTitles}</strong><span>Major titles</span></div></div>
            <div className="legacy-score-note">Titles carry 75 of 100 points. Your label reflects titles actually won.</div>
            <button className="legacy-panel-link" onClick={() => setTab('Trophies')}>Open trophy cabinet <ChevronRight aria-hidden="true" /></button>
          </section>
          <div className="legacy-overview-main">
            <div className="legacy-headline-stats">
              {[['Matches played', summary.matchesPlayed, `${summary.matchesWon} wins · ${summary.winRate}% win rate`], ['Career prize money', compactMoney(summary.totalPrizeMoney), formatMoney(summary.totalPrizeMoney)], ['Century breaks', summary.centuryBreaks, `${summary.maximumBreaks} maximums recorded`]].map(([label,value,note]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}
            </div>
            <section className="legacy-breakdown-panel">
              <header><Award aria-hidden="true" /><h2>What shapes your legacy</h2></header>
              <div className="legacy-breakdown-grid">{legacyBreakdown.map(item => <div key={item.label} className="legacy-breakdown-item"><div><strong>{item.label}</strong><span>{item.value}<small> / {item.max}</small></span></div><ProgressBar value={item.value} max={item.max} compact /><p><PlayerNames text={item.label === 'Tournament titles' ? 'World title: 15 · Other main-tour title: 5 · Other title: 1 (up to 10).' : item.detail}/></p></div>)}</div>
            </section>
            <footer className="legacy-overview-footer"><div><span>Current rank</span><strong>{currentRanking > 0 ? `#${currentRanking}` : 'Unranked'}</strong></div><div><span>Career date</span><strong>{seasonWeekLabel(gameState)}</strong></div><button onClick={() => setTab('Achievements')}>Career achievements <Target aria-hidden="true" /><ChevronRight aria-hidden="true" /></button></footer>
          </div>
        </div>}
        {tab === 'Achievements' && <LegacyAchievementsTab />}
        {tab === 'Records' && <LegacyRecords stats={career} view="records" />}
        {tab === 'Trophies' && <LegacyTrophiesTab />}
        {tab === 'Tournament History' && <LegacyHistoryTab completed={
          <div className="card overflow-hidden">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Recent completed events</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border text-gray-500"><th className="px-4 py-2 text-left">Year</th><th className="px-4 py-2 text-left">Event</th><th className="px-4 py-2 text-left">Opponent</th><th className="px-4 py-2 text-left">Result</th><th className="px-4 py-2 text-left">Score</th><th className="px-4 py-2 text-right">Prize</th><th className="px-4 py-2 text-right">Ranking Credit</th></tr></thead>
                <tbody>
                  {finalsData.length > 0 ? finalsData.map((final) => <tr key={final.id} className="border-b border-border/50 hover:bg-surface-light/50"><td className="px-4 py-2 text-gray-400">{final.year}</td><td className="px-4 py-2 text-white">{final.event}</td><td className="px-4 py-2 text-white"><PlayerNames text={final.opponent}/></td><td className={final.result === 'Winner' || final.result === 'Won' ? 'px-4 py-2 text-green-400' : 'px-4 py-2 text-red-400'}>{final.result}</td><td className="px-4 py-2 text-white">{final.score}</td><td className="px-4 py-2 text-right text-green-400">{final.prizeKnown ? formatMoney(final.prize) : '—'}</td><td className={final.impact >= 0 ? 'px-4 py-2 text-right font-medium text-green-400' : 'px-4 py-2 text-right font-medium text-red-400'}>{final.impactKnown ? (final.impact >= 0 ? '+' : '') + final.impact : '—'}</td></tr>) : <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No completed tournaments are archived yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>} />}
        {tab === 'Trends' && <LegacyTrendsTab />}
        {tab === 'Stories' && <LegacyStoriesTab />}
      </div>
    </div>
  )
}
