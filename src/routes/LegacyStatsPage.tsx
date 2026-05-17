import { useNavigate } from 'react-router-dom'
import { Activity, Award, LineChart as LineChartIcon, Medal, Trophy, Wallet } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { CircularMeter } from '../components/ui/CircularMeter'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { MetricCard } from '../components/ui/MetricCard'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'
import type { LegacyFinalRow } from '../types/game'
import { formatMoney } from '../utils/formatters'

const finalColumns: DataTableColumn<LegacyFinalRow>[] = [
  { key: 'year', header: 'Year' },
  { key: 'event', header: 'Event' },
  { key: 'category', header: 'Category' },
  { key: 'opponent', header: 'Opponent' },
  { key: 'result', header: 'Result' },
  { key: 'score', header: 'Score', align: 'right' },
  { key: 'prize', header: 'Prize', align: 'right', render: (row) => formatMoney(row.prize) },
  {
    key: 'impact',
    header: 'Legacy Impact',
    align: 'right',
    render: (row) => <span className={row.impact >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{row.impact >= 0 ? '+' : ''}{row.impact.toFixed(1)}</span>,
  },
]

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SectionCard title={title} className="h-[280px]">
      <div className="h-[220px] w-full">{children}</div>
    </SectionCard>
  )
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
  const rankingTrend = trendSnapshots.map((snapshot) => ({
    label: `W${snapshot.week}`,
    value: snapshot.ranking || currentRanking,
  }))
  const prizeTrend = trendSnapshots.map((snapshot) => ({
    label: `W${snapshot.week}`,
    value: snapshot.totalPrizeMoney,
  }))
  const confidenceTrend = trendSnapshots.map((snapshot) => ({
    label: `W${snapshot.week}`,
    value: snapshot.confidence,
  }))
  const finalsData: LegacyFinalRow[] = tournamentArchive
    .filter((event) => event.status === 'Completed' && event.matchesPlayed > 0)
    .slice(0, 6)
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
  const dynamicMilestones = [
    currentRanking > 0 ? `Highest ranking reached: #${currentRanking}` : 'Ranking progress still to come',
    `${matchesWon} wins recorded in the persistent career log`,
    `${tournamentArchive.length} tournament records now archived across ${Math.max(1, gameState.history.seasonRecords.length || 1)} season windows`,
    `${historySnapshots.length} weekly snapshots are available for trend review`,
  ]
  const liveSnapshot = [
    { label: 'Current Rank', value: currentRanking > 0 ? `#${currentRanking}` : 'Unranked' },
    { label: 'Confidence', value: `${gameState.player.confidence}%` },
    { label: 'Morale', value: `${gameState.player.morale}%` },
    { label: 'Cash', value: formatMoney(gameState.player.cash) },
    { label: 'Sponsors', value: `${gameState.sponsors.length}` },
  ]
  const liveAchievements = [
    { label: 'Reputation', value: `${gameState.player.reputation}%`, detail: 'Current standing in the live save' },
    { label: 'Inbox Activity', value: `${gameState.inbox.length}`, detail: 'Messages generated so far' },
    { label: 'Weekly Progress', value: `Week ${gameState.week}`, detail: 'Current save timeline' },
    { label: 'Support System', value: gameState.currentCoachId ? 'Staffed' : 'Lean', detail: 'Coach and support setup' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Career"
        title="Career Stats & Legacy"
        description={`Your journey, your numbers, your legacy. Current-save outcomes for ${gameState.player.fullName}, combining results, ranking position, reputation, and benchmark status.`}
        actions={<ActionButton onClick={continueWeek}>Continue Career</ActionButton>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_360px]">
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
            <SectionCard title="Legacy Score" subtitle={summary.legacyTier}>
              <div className="flex items-center justify-center py-4">
                <CircularMeter value={summary.legacyScore} label="Legacy" />
              </div>
            </SectionCard>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              <MetricCard label="Matches Played" value={summary.matchesPlayed} subValue="Career Total" tone="blue" icon={<Activity className="h-5 w-5" />} />
              <MetricCard label="Matches Won" value={summary.matchesWon} subValue={`${summary.winRate}% Win Rate`} tone="green" icon={<Trophy className="h-5 w-5" />} />
              <MetricCard label="Titles" value={summary.titles} subValue="Career Total" tone="gold" icon={<Award className="h-5 w-5" />} />
              <MetricCard label="Major Titles" value={summary.majorTitles} subValue="Career Total" tone="gold" icon={<Medal className="h-5 w-5" />} />
              <MetricCard label="Century Breaks" value={summary.centuryBreaks} subValue="Career Total" tone="blue" icon={<LineChartIcon className="h-5 w-5" />} />
              <MetricCard label="Maximum Breaks" value={summary.maximumBreaks} subValue="Career Total" tone="amber" icon={<Award className="h-5 w-5" />} />
              <MetricCard label="Highest Ranking" value={summary.highestRanking} subValue="Best Achieved" tone="green" icon={<LineChartIcon className="h-5 w-5" />} />
              <MetricCard label="Total Prize Money" value={formatMoney(summary.totalPrizeMoney)} subValue="Career Earnings" tone="gold" icon={<Wallet className="h-5 w-5" />} />
            </div>
          </div>

          <div className="rounded-xl border border-scm-border bg-scm-panel/80 px-4 py-3 text-sm text-scm-textSoft">
            This page is the live career archive for the current save, combining results, trends, milestones, and reputation into one history view.
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <ChartCard title="Ranking Over Time">
              <ResponsiveContainer>
                <LineChart data={rankingTrend}>
                  <CartesianGrid stroke="#203449" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis reversed stroke="#94a3b8" tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={{ backgroundColor: '#102033', border: '1px solid #31506f', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="value" stroke="#7ad34b" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Prize Money Over Time">
              <ResponsiveContainer>
                <AreaChart data={prizeTrend}>
                  <CartesianGrid stroke="#203449" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={56} />
                  <Tooltip contentStyle={{ backgroundColor: '#102033', border: '1px solid #31506f', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="value" stroke="#22c55e" fill="#22c55e22" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Confidence Over Time">
              <ResponsiveContainer>
                <AreaChart data={confidenceTrend}>
                  <CartesianGrid stroke="#203449" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={{ backgroundColor: '#102033', border: '1px solid #31506f', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="value" stroke="#7ad34b" fill="#7ad34b22" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <SectionCard title="Career Finals" subtitle="Major final appearances and legacy impact from big-stage results.">
            <DataTable columns={finalColumns} data={finalsData.length > 0 ? finalsData : []} />
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[1fr_320px_1.1fr]">
            <SectionCard title="Career Snapshot" subtitle="Top-level career markers in one row.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {liveSnapshot.map((item) => (
                  <div key={item.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{item.label}</p>
                    <p className="mt-2 font-semibold text-scm-text">{item.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Milestone Highlights" subtitle="Career peaks reached so far.">
              <ul className="space-y-3 text-sm text-scm-textSoft">
                {dynamicMilestones.map((milestone) => (
                  <li key={milestone} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-green" />{milestone}</li>
                ))}
              </ul>
            </SectionCard>

            <div className="grid gap-4 md:grid-cols-3">
              <ActionButton tone="secondary" className="justify-center py-6" onClick={() => navigate('/rankings')}>View Records</ActionButton>
              <ActionButton tone="secondary" className="justify-center py-6" onClick={() => navigate('/season-review')}>Compare Eras</ActionButton>
              <ActionButton className="justify-center py-6" onClick={continueWeek}>Continue Career</ActionButton>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Legacy Breakdown" subtitle={`${summary.legacyScore} / 100`}>
            <div className="space-y-4">
              {legacyBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-scm-textSoft">{item.label}</span>
                    <span className="text-scm-text">{item.value} / {item.max}</span>
                  </div>
                  <ProgressBar value={item.value} max={item.max} tone="green" />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Hall of Fame Benchmark" subtitle="Where this save currently lands among all-time tiers.">
            <div className="space-y-4 text-sm">
              {[
                ['All-Time Legend', 100],
                ['World Champion', 85],
                ['Ranking Winner', 70],
                ['Tour Pro', 50],
                ['Club Player', 25],
              ].map(([label, threshold]) => (
                <div key={label} className={`rounded-xl border px-4 py-3 ${summary.legacyScore >= Number(threshold) && Number(threshold) === 70 ? 'border-scm-green bg-scm-green/10' : 'border-scm-border bg-scm-panelSoft'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-scm-text">{label}</span>
                    <span className="text-scm-textSoft">{threshold}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Achievements & Reputation" subtitle="How the broader career is perceived.">
            <div className="grid gap-4 md:grid-cols-2">
              {liveAchievements.map((achievement) => (
                <div key={achievement.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{achievement.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-scm-text">{achievement.value}</p>
                  <p className="mt-1 text-sm text-scm-textSoft">{achievement.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}