import { useNavigate } from 'react-router-dom'
import { Award, LineChart as LineChartIcon, Medal, Target, Trophy, Wallet } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
  const archiveMatchLog = gameState.history.matchLog
  const tournamentArchive = gameState.history.tournamentHistory
  const matchesPlayed = archiveMatchLog.length
  const matchesWon = archiveMatchLog.filter((match) => match.result === 'Won').length
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0
  const centuryBreaks = tournamentArchive.reduce((sum, event) => sum + event.centuries, 0)
  const maximumBreaks = tournamentArchive.filter((event) => event.highestBreak >= 147).length
  const totalPrizeMoney = archiveMatchLog.reduce((sum, match) => sum + match.prizeMoney, 0)
  const currentRanking = gameState.rankings.find((row) => row.playerName === gameState.player.fullName)?.ranking ?? gameState.player.amateurRanking ?? gameState.player.worldRanking ?? 0
  const legacyScore = Math.min(100, Math.round((gameState.player.reputation + gameState.player.legacyScore + Math.min(30, matchesWon * 4)) / 2))
  const legacyTier = legacyScore >= 85 ? 'World Champion' : legacyScore >= 70 ? 'Ranking Winner' : legacyScore >= 50 ? 'Tour Pro' : 'Club Player'
  const historySnapshots = gameState.history.snapshots.length
    ? gameState.history.snapshots
    : [{ label: 'Current', season: gameState.season, week: gameState.week, date: gameState.currentDate, ranking: currentRanking, cash: gameState.player.cash, confidence: gameState.player.confidence, fatigue: gameState.player.fatigue, morale: gameState.player.morale, reputation: gameState.player.reputation, sponsorCount: gameState.sponsors.length, matchesPlayed, wins: matchesWon, losses: matchesPlayed - matchesWon, totalPrizeMoney }]
  const trendSnapshots = historySnapshots.slice(-6)
  const summary = {
    legacyScore,
    legacyTier,
    matchesPlayed,
    matchesWon,
    winRate,
    titles: tournamentArchive.filter((event) => event.result === 'Winner').length,
    majorTitles: tournamentArchive.filter((event) => event.result === 'Winner' && event.eventType === 'Major').length,
    centuryBreaks,
    maximumBreaks,
    highestRanking: currentRanking > 0 ? `#${currentRanking}` : 'Unranked',
    totalPrizeMoney,
  }
  const legacyBreakdown = [
    { label: 'Results', value: Math.min(30, matchesWon * 3), max: 30 },
    { label: 'Ranking', value: currentRanking > 0 ? Math.max(0, 25 - currentRanking) : 4, max: 25 },
    { label: 'Reputation', value: Math.min(20, Math.round(gameState.player.reputation / 5)), max: 20 },
    { label: 'Earnings', value: Math.min(15, Math.round(totalPrizeMoney / 500)), max: 15 },
    { label: 'Longevity', value: Math.min(10, historySnapshots.length), max: 10 },
  ]
  const rankingTrend = trendSnapshots.map((snapshot) => ({ label: `W${snapshot.week}`, value: snapshot.ranking || currentRanking }))
  const prizeTrend = trendSnapshots.map((snapshot) => ({ label: `W${snapshot.week}`, value: snapshot.totalPrizeMoney }))
  const confidenceTrend = trendSnapshots.map((snapshot) => ({ label: `W${snapshot.week}`, value: snapshot.confidence }))
  const prizeByEvent = tournamentArchive.slice(0, 8).map((event) => ({ event: event.tournamentName.replace(/ Championship| Masters| Open/g, ''), prize: event.prizeMoney }))
  const finalsData: LegacyFinalRow[] = tournamentArchive
    .filter((event) => event.status === 'Completed' && event.matchesPlayed > 0)
    .slice(0, 7)
    .map((event) => ({
      id: event.id,
      year: event.startDate.slice(0, 4) || gameState.season,
      event: event.tournamentName,
      category: event.eventType ?? 'Career Event',
      opponent: event.rounds.at(-1)?.split(':')[0] ?? 'Archive result',
      result: event.result,
      score: event.rounds.at(-1)?.split(': ')[1] ?? '-',
      prize: event.prizeMoney,
      impact: Number((event.rankingPoints / 12).toFixed(1)),
    }))

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">Career</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Career Stats & Legacy</h1>
          <p className="mt-1 text-sm text-gray-400">Your journey, your numbers, your legacy for {gameState.player.fullName}.</p>
        </div>
        <div className="flex gap-2"><button type="button" className="btn-secondary text-xs" onClick={() => navigate('/season-review')}>Season Review</button><button type="button" className="btn-primary text-xs" onClick={continueWeek}>Continue Career</button></div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Matches Played', value: summary.matchesPlayed, sub: 'Career Total', icon: Target },
          { label: 'Matches Won', value: summary.matchesWon, sub: `${summary.winRate}% Win Rate`, icon: Trophy },
          { label: 'Titles', value: summary.titles, sub: 'Career Total', icon: Award },
          { label: 'Major Titles', value: summary.majorTitles, sub: 'Career Total', icon: Medal },
          { label: 'Total Prize Money', value: compactMoney(summary.totalPrizeMoney), sub: 'Career Earnings', icon: Wallet },
        ].map((stat) => {
          const Icon = stat.icon
          return <div key={stat.label} className="card card-body text-center"><Icon className="mx-auto mb-1 h-4 w-4 text-green-400" /><p className="metric-label">{stat.label}</p><p className="mt-1 text-xl font-bold text-white">{stat.value}</p><p className="text-[10px] text-gray-400">{stat.sub}</p></div>
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-3">
          <div className="card card-body text-center">
            <p className="text-[10px] font-semibold uppercase text-gray-500">Legacy Score</p>
            <div className="mx-auto mt-3 flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-green-500">
              <span className="text-4xl font-bold text-white">{summary.legacyScore}</span>
              <span className="text-xs text-gray-400">/100</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-green-400">{summary.legacyTier}</p>
          </div>

          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">Legacy Breakdown</h3>
            <div className="space-y-3">
              {legacyBreakdown.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">{item.label}</span><span className="text-white">{item.value}/{item.max}</span></div><ProgressBar value={item.value} max={item.max} compact /></div>)}
            </div>
          </div>

          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">Career Snapshot</h3>
            <div className="space-y-2 text-xs">
              {[
                ['Current Rank', currentRanking > 0 ? `#${currentRanking}` : 'Unranked'],
                ['Century Breaks', summary.centuryBreaks],
                ['Maximums', summary.maximumBreaks],
                ['Sponsors', gameState.sponsors.length],
                ['Week', gameState.week],
              ].map(([label, value]) => <div key={label} className="flex justify-between rounded bg-surface-light/50 px-3 py-2"><span className="text-gray-400">{label}</span><span className="text-white">{value}</span></div>)}
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-9">
          <div className="grid grid-cols-3 gap-4">
            <div className="card"><div className="card-header"><h3 className="text-sm font-semibold text-white">Ranking Over Time</h3></div><div className="card-body h-[170px]"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}><LineChart data={rankingTrend}><CartesianGrid stroke="#203449" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} /><YAxis reversed tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={36} /><Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} /><Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} /></LineChart></ResponsiveContainer></div></div>
            <div className="card"><div className="card-header"><h3 className="text-sm font-semibold text-white">Prize Trend</h3></div><div className="card-body h-[170px]"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}><AreaChart data={prizeTrend}><CartesianGrid stroke="#203449" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={48} /><Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} /><Area type="monotone" dataKey="value" stroke="#22c55e" fill="#22c55e22" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div>
            <div className="card"><div className="card-header"><h3 className="text-sm font-semibold text-white">Confidence</h3></div><div className="card-body h-[170px]"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}><AreaChart data={confidenceTrend}><CartesianGrid stroke="#203449" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={36} /><Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} /><Area type="monotone" dataKey="value" stroke="#7ad34b" fill="#7ad34b22" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Prize Money by Event</h3><LineChartIcon className="h-4 w-4 text-green-400" /></div>
            <div className="card-body h-[190px]"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}><BarChart data={prizeByEvent}><XAxis dataKey="event" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} /><Bar dataKey="prize" fill="#22c55e" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Career Finals & Completed Events</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border text-gray-500"><th className="px-4 py-2 text-left">Year</th><th className="px-4 py-2 text-left">Event</th><th className="px-4 py-2 text-left">Opponent</th><th className="px-4 py-2 text-left">Result</th><th className="px-4 py-2 text-left">Score</th><th className="px-4 py-2 text-right">Prize</th><th className="px-4 py-2 text-right">Legacy Impact</th></tr></thead>
                <tbody>
                  {finalsData.length > 0 ? finalsData.map((final) => <tr key={final.id} className="border-b border-border/50 hover:bg-surface-light/50"><td className="px-4 py-2 text-gray-400">{final.year}</td><td className="px-4 py-2 text-white">{final.event}</td><td className="px-4 py-2 text-white">{final.opponent}</td><td className={final.result === 'Winner' || final.result === 'Won' ? 'px-4 py-2 text-green-400' : 'px-4 py-2 text-red-400'}>{final.result}</td><td className="px-4 py-2 text-white">{final.score}</td><td className="px-4 py-2 text-right text-green-400">{formatMoney(final.prize)}</td><td className={final.impact >= 0 ? 'px-4 py-2 text-right font-medium text-green-400' : 'px-4 py-2 text-right font-medium text-red-400'}>{final.impact >= 0 ? '+' : ''}{final.impact}</td></tr>) : <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No completed tournament finals are archived yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
