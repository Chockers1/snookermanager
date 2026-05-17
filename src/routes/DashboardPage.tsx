import { ArrowRight, BadgePoundSterling, CalendarRange, Mail, ShieldCheck, Swords, Trophy, Star } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { RightContextPanel } from '../components/layout/RightContextPanel'
import { AttributeGroupPanel } from '../components/game/AttributeGroupPanel'
import { CoachTable } from '../components/game/CoachTable'
import { EquipmentCard } from '../components/game/EquipmentCard'
import { FundsCard } from '../components/game/FundsCard'
import { InboxMessageList } from '../components/game/InboxMessageList'
import { NextEventCard } from '../components/game/NextEventCard'
import { PlayerSummaryCard } from '../components/game/PlayerSummaryCard'
import { RankingTable } from '../components/game/RankingTable'
import { TrainingWeekGrid } from '../components/game/TrainingWeekGrid'
import { ActionButton } from '../components/ui/ActionButton'
import { AlertBox } from '../components/ui/AlertBox'
import { DecisionPanel } from '../components/ui/DecisionPanel'
import { MetricCard } from '../components/ui/MetricCard'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import { getCoachAvailability } from '../utils/coachMarket'
import { buildDashboardData } from '../utils/liveRouteData'
import { formatMoney, formatSigned } from '../utils/formatters'

export function DashboardPage() {
  const { gameState, continueWeek, continueToNextTournament } = useGame()
  const navigate = useNavigate()
  const { currentCue, scoutedCue, financeChart, trainingWeek, newsRail } = buildDashboardData(gameState)
  const enteredEvent = gameState.tournaments.find((event) => event.status === 'Entered')
  const nextEvent = enteredEvent ?? gameState.tournaments.find((event) => event.status === 'Available' || event.status === 'High Cost') ?? gameState.tournaments[0]
  const canPlayTournament = !!enteredEvent && gameState.player.daysUntilEvent <= 7
  const nextMatchRoute = gameState.liveMatch?.status === 'In Progress' ? '/match/live' : '/match/preview'
  const nextMatchLabel = gameState.liveMatch?.status === 'In Progress'
    ? 'Resume Live Match'
    : canPlayTournament
      ? 'Play Tournament'
      : 'Open Match Centre'
  const currentRanking = gameState.rankings.find((row) => row.playerName === gameState.player.fullName)?.ranking
    ?? gameState.player.worldRanking
    ?? gameState.player.amateurRanking
  const coachSnapshot = gameState.coaches
    .filter((coach) => getCoachAvailability(coach, currentRanking ?? 999, gameState.player.reputation).available)
    .slice()
    .sort((left, right) => right.compatibility - left.compatibility)
    .slice(0, 6)
  const latestMatches = gameState.matches.slice(0, 4)
  const nextEventTravelTotal = nextEvent.travelCost + nextEvent.hotelCost
  const nextEventSummary = canPlayTournament
    ? `${nextEvent.name} is live this week. The draw is set and the next match is ready to start.`
    : nextEventTravelTotal > 0
      ? `${nextEvent.name} is the next target. Travel and lodging are the main costs this week, with ${nextEvent.rankingValue} ranking points available.`
      : `${nextEvent.name} is the next target. Travel overhead is light, so the focus can stay on preparation and match reps.`
  const dashboardMetrics = [
    {
      label: 'Current Ranking',
      value: currentRanking != null ? `#${currentRanking}` : 'Unranked',
      subValue: gameState.player.careerStage,
      tone: 'gold' as const,
    },
    {
      label: 'Weekly Cash Flow',
      value: `${gameState.player.cashFlow >= 0 ? '+' : ''}${formatMoney(gameState.player.cashFlow)}`,
      subValue: `${formatMoney(gameState.player.cash)} balance`,
      tone: gameState.player.cashFlow >= 0 ? 'green' as const : 'red' as const,
    },
    {
      label: 'Confidence',
      value: `${gameState.player.confidence}%`,
      subValue: `${gameState.player.morale}% morale`,
      tone: gameState.player.confidence >= 75 ? 'green' as const : 'amber' as const,
    },
    {
      label: 'Fatigue Risk',
      value: `${gameState.player.fatigue}%`,
      subValue: gameState.player.fatigue >= 60 ? 'Recovery needed' : 'Manageable',
      tone: gameState.player.fatigue >= 60 ? 'red' as const : 'amber' as const,
    },
  ]
  const financeSnapshot = {
    income: Math.max(gameState.finance.cashFlow, 0),
    expenses: Math.max(-gameState.finance.cashFlow, 0),
    surplus: gameState.finance.cashFlow,
    burnRate: Math.max(-gameState.finance.cashFlow, 0),
  }
  const topInboxMessages = gameState.inbox.slice(0, 2)
  const topNavigationCards = [
    {
      title: 'Inbox',
      subtitle: topInboxMessages[0]?.subject ?? 'No urgent messages',
      detail: `${gameState.player.inboxCount} messages waiting in the current save.`,
      icon: <Mail className="h-5 w-5" />,
      route: '/inbox',
    },
    {
      title: 'Next Tournament',
      subtitle: nextEvent.name,
      detail: `${nextEvent.location} · ${nextEvent.startDate}`,
      icon: <Trophy className="h-5 w-5" />,
      route: '/tournaments/hub',
    },
    {
      title: 'Next Match',
      subtitle: gameState.liveMatch?.status === 'In Progress' ? `${gameState.liveMatch.playerFrames}-${gameState.liveMatch.opponentFrames} vs ${gameState.liveMatch.opponentName}` : nextEvent.name,
      detail: nextMatchLabel,
      icon: <Swords className="h-5 w-5" />,
      route: nextMatchRoute,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Career Dashboard"
        title="Command Centre"
        description="Dense overview of form, finances, preparation, and the next event for the active local save."
        actions={
          <div className="flex items-center gap-3">
            <ActionButton tone="secondary" icon={<CalendarRange className="h-4 w-4" />} onClick={() => navigate('/training')}>
              Weekly Planner
            </ActionButton>
            {canPlayTournament ? (
              <ActionButton tone="secondary" icon={<Trophy className="h-4 w-4" />} onClick={() => navigate(nextMatchRoute)}>Play Tournament</ActionButton>
            ) : (
              <ActionButton tone="secondary" icon={<Trophy className="h-4 w-4" />} onClick={continueToNextTournament}>Continue To Tournament</ActionButton>
            )}
            <ActionButton icon={<ArrowRight className="h-4 w-4" />} onClick={continueWeek}>Continue Week</ActionButton>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <button
            key={metric.label}
            type="button"
            onClick={() => navigate(metric.label === 'Current Ranking' ? '/rankings' : metric.label === 'Weekly Cash Flow' ? '/finance' : metric.label === 'Fatigue Risk' ? '/health' : '/mental')}
            className="text-left"
          >
            <MetricCard
              label={metric.label}
              value={metric.value}
              subValue={metric.subValue}
              tone={metric.tone}
              icon={
                metric.label === 'Current Ranking' ? (
                  <Star className="h-5 w-5" />
                ) : metric.label === 'Weekly Cash Flow' ? (
                  <BadgePoundSterling className="h-5 w-5" />
                ) : metric.label === 'Fatigue Risk' ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : (
                  <Star className="h-5 w-5" />
                )
              }
            />
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {topNavigationCards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.route)}
            className="rounded-xl border border-scm-border bg-scm-panel/95 p-4 text-left shadow-panel transition hover:border-scm-green/45 hover:bg-scm-panelSoft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-scm-textMuted">{card.title}</p>
                <p className="mt-2 text-xl font-semibold text-scm-text">{card.subtitle}</p>
              </div>
              <div className="rounded-full border border-scm-borderStrong bg-scm-deep/70 p-2 text-scm-green">{card.icon}</div>
            </div>
            <p className="mt-3 text-sm text-scm-textSoft">{card.detail}</p>
            {card.title === 'Inbox' && topInboxMessages.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-scm-border pt-3">
                {topInboxMessages.map((message) => (
                  <div key={message.id} className="rounded-lg bg-scm-panelSoft/80 px-3 py-2">
                    <p className="text-sm font-semibold text-scm-text">{message.subject}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-scm-textMuted">{message.sender}</p>
                  </div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <button type="button" onClick={() => navigate('/career/progression')} className="block w-full text-left">
            <PlayerSummaryCard player={gameState.player} />
          </button>

          <div className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard title="Weekly Training Overview" subtitle="Current seven-day plan with compact morning, afternoon, and evening blocks." onClick={() => navigate('/training')}>
              <TrainingWeekGrid week={trainingWeek} />
            </SectionCard>

            <SectionCard title="Recent Results" subtitle="Latest competitive outcomes feeding confidence and ranking movement." onClick={() => navigate('/match/result')}>
              {latestMatches.length > 0 ? (
                <div className="space-y-3">
                  {latestMatches.map((match) => (
                  <div key={match.id} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-scm-text">{match.playerName} {match.playerFrames}-{match.opponentFrames} {match.opponentName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-scm-textMuted">{match.round} · Best of {match.bestOf}</p>
                      </div>
                      <StatusBadge tone={match.result === 'Won' ? 'green' : 'amber'}>{match.result}</StatusBadge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-scm-textSoft">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Highest break</p>
                        <p className="mt-1 text-scm-text">{match.highestBreak}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Confidence</p>
                        <p className="mt-1 text-scm-text">{formatSigned(match.confidenceChange)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Prize money</p>
                        <p className="mt-1 text-scm-text">{formatMoney(match.prizeMoneyEarned)}</p>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-scm-border bg-scm-panelSoft/70 p-4 text-sm text-scm-textSoft">
                  No competitive matches have been played in this save yet. Enter the next event or continue the week to start building live form.
                </div>
              )}
            </SectionCard>
          </div>

          <div className="grid gap-6 2xl:grid-cols-3">
            <button type="button" onClick={() => navigate('/player/attributes')} className="text-left">
              <AttributeGroupPanel title="Technical Profile" attributes={gameState.attributes.technical} />
            </button>
            <button type="button" onClick={() => navigate('/player/attributes')} className="text-left">
              <AttributeGroupPanel title="Mental Profile" attributes={gameState.attributes.mental} />
            </button>
            <button type="button" onClick={() => navigate('/player/attributes')} className="text-left">
              <AttributeGroupPanel title="Physical Profile" attributes={gameState.attributes.physical} />
            </button>
          </div>

          <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard title="Finance Trend" subtitle="Income versus expense line for the current cycle." onClick={() => navigate('/finance')}>
              <div className="h-[280px] w-full">
                <ResponsiveContainer>
                  <AreaChart data={financeChart}>
                    <defs>
                      <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f2b705" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#f2b705" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#203449" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={56} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#102033',
                        border: '1px solid #31506f',
                        borderRadius: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incomeFill)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" stroke="#f2b705" fill="url(#expenseFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
            <SectionCard title="Coach Market Snapshot" subtitle="Currently unlocked staff options ranked by fit for the active save." onClick={() => navigate('/staff/coaches')}>
              <CoachTable coaches={coachSnapshot} />
            </SectionCard>
          </div>

          <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard title="Equipment Summary" subtitle="Current cue with a scouted alternative ready for later equipment flow." onClick={() => navigate('/equipment/cues')}>
              <div className="grid gap-4 lg:grid-cols-2">
                <EquipmentCard cue={currentCue} />
                <EquipmentCard cue={scoutedCue} />
              </div>
            </SectionCard>
            <SectionCard title="Ranking Snapshot" subtitle={`Current player highlighted inside the live ${gameState.player.rankingLabel.toLowerCase()} table.`} onClick={() => navigate('/rankings')}>
              <RankingTable rows={gameState.rankings.slice(0, 8)} />
            </SectionCard>
          </div>
        </div>

        <RightContextPanel>
          <button type="button" onClick={() => navigate('/tournaments/hub')} className="block w-full text-left">
            <NextEventCard tournament={nextEvent} />
          </button>
          <button type="button" onClick={() => navigate('/finance')} className="block w-full text-left">
            <FundsCard snapshot={financeSnapshot} />
          </button>

          <SectionCard title="News Feed" subtitle="Inbox-driven Football Manager-style information rail." onClick={() => navigate('/inbox')}>
            <div className="space-y-3">
              {newsRail.map((item) => (
                <div key={item.id} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                  <StatusBadge tone="slate">{item.tag}</StatusBadge>
                  <p className="mt-3 font-semibold text-scm-text">{item.title}</p>
                  <p className="mt-2 text-sm text-scm-textSoft">{item.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <DecisionPanel
            title="Up Next"
            summary={nextEventSummary}
          >
            <div className="space-y-3 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between">
                <span>Travel + stay</span>
                <span>{formatMoney(nextEvent.travelCost + nextEvent.hotelCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Entry fee</span>
                <span>{formatMoney(nextEvent.entryFee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ranking value</span>
                <span>{nextEvent.rankingValue} pts</span>
              </div>
              <div className="flex gap-2 pt-2">
                <ActionButton className="flex-1" onClick={continueWeek}>Continue Week</ActionButton>
                {canPlayTournament ? (
                  <ActionButton tone="secondary" className="flex-1" onClick={() => navigate(nextMatchRoute)}>Play Tournament</ActionButton>
                ) : (
                  <ActionButton tone="secondary" className="flex-1" onClick={continueToNextTournament}>Continue To Tournament</ActionButton>
                )}
              </div>
            </div>
          </DecisionPanel>

          <AlertBox title="Latest Update">
            {gameState.lastAction}
          </AlertBox>

          <SectionCard title="Inbox Preview" subtitle="Latest messages surfaced without leaving the dashboard." onClick={() => navigate('/inbox')}>
            <InboxMessageList messages={gameState.inbox.slice(0, 4)} />
          </SectionCard>
        </RightContextPanel>
      </div>
    </div>
  )
}