import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, BarChart3, CalendarDays, Trophy } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { CircularMeter } from '../components/ui/CircularMeter'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'
import { buildSeasonReviewData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

function getMetricTone(label: string) {
  if (label === 'Worst Defeat') return 'text-rose-300'
  if (label === 'Financial Result' || label === 'Ranking Movement') return 'text-emerald-300'
  return 'text-scm-text'
}

export function SeasonReviewPage() {
  const { gameState, continueWeek } = useGame()
  const navigate = useNavigate()
  const seasonData = buildSeasonReviewData(gameState)
  const currentCoach = gameState.coaches.find((coach) => coach.id === gameState.currentCoachId)
  const currentSeasonMatches = gameState.history.matchLog.filter((match) => match.season === gameState.season)
  const currentSeasonEvents = gameState.history.tournamentHistory.filter((event) => event.season === gameState.season)
  const archivedSeasons = gameState.history.seasonRecords.slice(0, 3)
  const totalPrizeMoney = currentSeasonMatches.reduce((sum, match) => sum + match.prizeMoney, 0)
  const sponsorIncome = gameState.sponsors.reduce((sum, sponsor) => sum + sponsor.monthlyValue, 0)
  const totalIncome = totalPrizeMoney + sponsorIncome
  const totalExpenses = -Math.max(0, (gameState.finance.baseCashFlow - gameState.finance.cashFlow) * gameState.week)
  const netProfit = totalIncome + totalExpenses
  const winCount = currentSeasonMatches.filter((match) => match.result === 'Won').length
  const lossCount = currentSeasonMatches.filter((match) => match.result === 'Lost').length
  const playerRank = gameState.rankings.find((row) => row.playerName === gameState.player.fullName)
  const historySnapshots = gameState.history.snapshots.length
    ? gameState.history.snapshots.filter((snapshot) => snapshot.season === gameState.season)
    : [{ label: 'Current', season: gameState.season, week: gameState.week, date: gameState.currentDate, ranking: playerRank?.ranking ?? 0, cash: gameState.player.cash, confidence: gameState.player.confidence, fatigue: gameState.player.fatigue, morale: gameState.player.morale, reputation: gameState.player.reputation, sponsorCount: gameState.sponsors.length, matchesPlayed: currentSeasonMatches.length, wins: winCount, losses: lossCount, totalPrizeMoney }]
  const seasonHistory = historySnapshots.slice(-8)
  const rankingMovementData = seasonHistory.map((snapshot) => ({
    label: `W${snapshot.week}`,
    value: snapshot.ranking || (playerRank?.ranking ?? 0),
  }))
  const prizeMoneyByEvent = (currentSeasonEvents.length ? currentSeasonEvents.slice(0, 6).reverse().map((event) => ({
    label: event.tournamentName.length > 16 ? `${event.tournamentName.slice(0, 16)}...` : event.tournamentName,
    value: event.prizeMoney,
  })) : currentSeasonMatches.slice(0, 6).reverse().map((match) => ({
    label: match.tournamentName.length > 16 ? `${match.tournamentName.slice(0, 16)}...` : match.tournamentName,
    value: match.prizeMoney,
  })))
  const seasonHighlights = {
    record: [
      `${winCount} wins and ${lossCount} losses are currently recorded this save.`,
      `Current ranking sits at #${playerRank?.ranking ?? '-'}.`,
    ],
    milestones: [
      `${currentSeasonEvents.length} tournament records are logged for ${gameState.season}.`,
      `${gameState.history.seasonRecords.length} completed seasons are archived in persistent history.`,
    ],
    notableResults: (currentSeasonEvents.length
      ? currentSeasonEvents.slice(0, 3).map((event) => `${event.result} at ${event.tournamentName}${event.rounds.length ? ` (${event.rounds.at(-1)})` : ''}`)
      : currentSeasonMatches.slice(0, 3).map((match) => `${match.result} vs ${match.opponentName} in the ${match.round} of ${match.tournamentName} (${match.score})`)),
  }
  const seasonArchiveCards = [
    {
      season: gameState.season,
      record: `${winCount}-${lossCount}`,
      titles: currentSeasonEvents.filter((event) => event.result === 'Winner').length,
      prizeMoney: totalPrizeMoney,
      bestResult: currentSeasonEvents.some((event) => event.result === 'Winner') ? 'Winner' : currentSeasonEvents[0]?.result ?? 'No deep run yet',
    },
    ...archivedSeasons.map((season) => ({
      season: season.season,
      record: `${season.wins}-${season.losses}`,
      titles: season.titles,
      prizeMoney: season.prizeMoney,
      bestResult: season.bestResult,
    })),
  ].slice(0, 3)
  const liveHeadlineMetrics = [
    { label: 'Record', value: `${winCount}-${lossCount}`, detail: 'Live save results' },
    { label: 'Current Rank', value: `#${playerRank?.ranking ?? '-'}`, detail: gameState.player.rankingLabel },
    { label: 'Financial Result', value: formatMoney(netProfit), detail: 'Cash movement from the current save' },
    { label: 'Confidence', value: `${gameState.player.confidence}%`, detail: 'Current mental edge' },
    { label: 'Fatigue', value: `${gameState.player.fatigue}%`, detail: 'Recovery pressure' },
    { label: 'Sponsors', value: `${gameState.sponsors.length}`, detail: 'Active commercial deals' },
  ]
  const liveFinancialSummary = [
    { label: 'Prize Money', value: totalPrizeMoney },
    { label: 'Sponsor Income', value: sponsorIncome },
    { label: 'Current Cash', value: gameState.player.cash },
    { label: 'Staff Costs Exposure', value: totalExpenses },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="End Of Season Review"
        description={`Current ${gameState.season} save review for ${gameState.player.fullName} across results, development, finances, and support systems.`}
        actions={<div className="flex items-center gap-3"><ActionButton tone="secondary" onClick={() => navigate('/career/stats')}>View Season Summary Report</ActionButton></div>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.55fr_320px]">
        <div className="space-y-6">
          <SectionCard title="Season Summary">
            <div className="grid gap-4 xl:grid-cols-11">
              {liveHeadlineMetrics.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 xl:col-span-1">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{metric.label}</p>
                  <p className={`mt-3 text-3xl font-semibold ${getMetricTone(metric.label)}`}>{metric.value}</p>
                  <p className="mt-2 text-xs text-scm-textMuted">{metric.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_1.1fr_0.9fr]">
            <SectionCard title="Ranking Movement Over Season">
              <div className="h-[220px] w-full">
                <ResponsiveContainer>
                  <LineChart data={rankingMovementData}>
                    <CartesianGrid stroke="#203449" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={38} reversed />
                    <Tooltip contentStyle={{ backgroundColor: '#102033', border: '1px solid #31506f', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="value" stroke="#7ad34b" strokeWidth={3} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Prize Money Earned By Event">
              <div className="h-[220px] w-full">
                <ResponsiveContainer>
                  <BarChart data={prizeMoneyByEvent}>
                    <CartesianGrid stroke="#203449" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={56} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={48} />
                    <Tooltip contentStyle={{ backgroundColor: '#102033', border: '1px solid #31506f', borderRadius: '12px' }} />
                    <Bar dataKey="value" fill="#7ad34b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Attribute Growth By Category">
              <div className="space-y-4">
                {seasonData.attributeGrowth.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{item.label}</span><span className="text-emerald-300">+{item.value}</span></div>
                    <ProgressBar value={(item.value / 3) * 100} tone="green" />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-4">
            <SectionCard title="Coach Grade">
              <p className="text-5xl font-semibold text-scm-green">{seasonData.panels.coachGrade.grade}</p>
              <p className="mt-2 text-scm-text">{seasonData.panels.coachGrade.detail}</p>
              <p className="mt-3 text-sm text-scm-textSoft">{seasonData.panels.coachGrade.note}</p>
            </SectionCard>

            <SectionCard title="Sponsor Grade">
              <p className="text-5xl font-semibold text-scm-green">{seasonData.panels.sponsorGrade.grade}</p>
              <p className="mt-2 text-scm-text">{seasonData.panels.sponsorGrade.detail}</p>
              <p className="mt-3 text-sm text-scm-textSoft">{seasonData.panels.sponsorGrade.note}</p>
            </SectionCard>

            <SectionCard title="Fan Growth">
              <p className="text-4xl font-semibold text-scm-green">{seasonData.panels.fanGrowth.growth}</p>
              <p className="mt-2 text-scm-text">{seasonData.panels.fanGrowth.fans} total fans</p>
              <p className="mt-3 text-sm text-scm-textSoft">{seasonData.panels.fanGrowth.delta}</p>
            </SectionCard>

            <SectionCard title="Next Season Objectives">
              <div className="space-y-3">
                {seasonData.objectives.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{item.label}</span><span className={item.completed ? 'text-emerald-300' : 'text-amber-300'}>{item.progress}</span></div>
                    <ProgressBar value={item.completed ? 100 : 70} tone={item.completed ? 'green' : 'amber'} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard>
            <div className="grid gap-4 md:grid-cols-[110px_1fr]">
              <div className="flex justify-center"><CircularMeter value={88} label={`Grade ${seasonData.grade.grade}`} /></div>
              <div>
                <p className="text-xl font-semibold text-scm-text">Season Grade</p>
                <p className="mt-2 text-sm text-scm-textSoft">The live save currently sits at rank #{playerRank?.ranking ?? '-'} with {winCount} wins, {lossCount} losses, and {gameState.sponsors.length} active sponsor deals.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Season Highlights">
            <div className="space-y-5 text-sm">
              <div>
                <p className="font-semibold text-scm-green">Record Summary</p>
                <ul className="mt-3 space-y-2 text-scm-textSoft">
                  {seasonHighlights.record.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-scm-green">Milestones Achieved</p>
                <ul className="mt-3 space-y-2 text-scm-textSoft">
                  {seasonHighlights.milestones.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-scm-green">Notable Results</p>
                <ul className="mt-3 space-y-2 text-scm-textSoft">
                  {seasonHighlights.notableResults.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Financial Summary">
            <div className="space-y-3 text-sm">
              {liveFinancialSummary.map((item) => (
                <div key={item.label} className="flex items-center justify-between"><span className="text-scm-textSoft">{item.label}</span><span className={item.value >= 0 ? 'text-scm-text' : 'text-rose-300'}>{formatMoney(item.value)}</span></div>
              ))}
              <div className="border-t border-scm-border pt-3 flex items-center justify-between text-base"><span className="text-scm-text">Net Profit</span><span className="text-scm-green">{formatMoney(netProfit)}</span></div>
            </div>
          </SectionCard>

          <SectionCard title="Overall Verdict">
            <p className="text-3xl font-semibold text-scm-green">{seasonData.panels.verdict.grade}</p>
            <p className="mt-2 text-xl text-scm-text">{seasonData.panels.verdict.title}</p>
            <p className="mt-3 text-sm text-scm-textSoft">{seasonData.panels.verdict.summary}</p>
          </SectionCard>

          <SectionCard title="Season Archive">
            <div className="space-y-3">
              {seasonArchiveCards.map((season) => (
                <div key={season.season} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-scm-text">{season.season}</span>
                    <span className="text-scm-gold">{season.bestResult}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-scm-textSoft"><span>Record</span><span>{season.record}</span></div>
                  <div className="mt-1 flex items-center justify-between text-scm-textSoft"><span>Titles</span><span>{season.titles}</span></div>
                  <div className="mt-1 flex items-center justify-between text-scm-textSoft"><span>Prize Money</span><span>{formatMoney(season.prizeMoney)}</span></div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard title="Sponsor Sentiment">
              <div className="flex justify-center"><CircularMeter value={seasonData.panels.sponsorSentiment.value} label={seasonData.panels.sponsorSentiment.detail} /></div>
            </SectionCard>
            <SectionCard title="Fan Sentiment">
              <div className="flex justify-center"><CircularMeter value={Math.round(seasonData.panels.fanSentiment.value * 20)} label={seasonData.panels.fanSentiment.detail} /></div>
            </SectionCard>
          </div>
        </div>
      </div>

      <SectionCard title="Coach Review">
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr_1fr] xl:items-center">
          <div>
            <p className="text-lg font-semibold text-scm-text">{currentCoach?.name ?? 'No active coach'}</p>
            <p className="mt-2 text-sm text-scm-green">{currentCoach?.type ?? 'Support Team'}</p>
          </div>
          <div className="xl:col-span-2">
            <p className="text-sm leading-7 text-scm-textSoft">{currentCoach ? `${currentCoach.name} remains the active coach in the save, with ${currentCoach.compatibility}% compatibility and a weekly cost of ${formatMoney(currentCoach.weeklyCost)}.` : seasonData.panels.coachReview}</p>
          </div>
          <div className="flex items-center justify-end gap-3 text-scm-gold">
            <Award className="h-6 w-6" />
            <BarChart3 className="h-6 w-6" />
            <Trophy className="h-6 w-6" />
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-3 md:grid-cols-3">
        <ActionButton tone="secondary" className="justify-center" icon={<BarChart3 className="h-4 w-4" />} onClick={() => navigate('/career/stats')}>View Full Stats</ActionButton>
        <ActionButton tone="secondary" className="justify-center" icon={<CalendarDays className="h-4 w-4" />} onClick={() => navigate('/calendar')}>Set Next Season Plan</ActionButton>
        <ActionButton className="justify-center" icon={<Trophy className="h-4 w-4" />} onClick={continueWeek}>Continue To Offseason</ActionButton>
      </div>
    </div>
  )
}