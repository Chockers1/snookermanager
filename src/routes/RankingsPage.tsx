import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'
import { formatMoney, formatSigned } from '../utils/formatters'

const rankingTabs = [
  { key: 'world', label: 'World Ranking', seasonLabel: 'Two-year list', rankField: 'worldRank' },
  { key: 'oneYear', label: 'One-Year Ranking', seasonLabel: 'Current season race', rankField: 'oneYearRank' },
  { key: 'amateur', label: 'Amateur Ranking', seasonLabel: 'Amateur pathway', rankField: 'amateurRank' },
  { key: 'qTour', label: 'Q Tour Ranking', seasonLabel: 'Global Q Tour', rankField: 'qTourRank' },
  { key: 'qSchool', label: 'Q School OOM', seasonLabel: 'Top-up race', rankField: 'qSchoolRank' },
  { key: 'senior', label: 'Senior Ranking', seasonLabel: 'Late-career circuit', rankField: 'seniorRank' },
  { key: 'youth', label: 'Youth Ranking', seasonLabel: 'Junior development', rankField: 'youthRank' },
] as const

export function RankingsPage() {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const defaultTab = gameState.careerSystems.lateCareer.seniorActive
    ? 'senior'
    : gameState.careerSystems.pro.hasTourCard
      ? 'world'
      : gameState.careerSystems.qSchool.campaignsEntered > 0
        ? 'qSchool'
        : gameState.careerSystems.qTour.playerPoints > 0
          ? 'qTour'
          : 'amateur'
  const [activeTab, setActiveTab] = useState<(typeof rankingTabs)[number]['key']>(defaultTab)
  const activeConfig = rankingTabs.find((tab) => tab.key === activeTab) ?? rankingTabs[0]
  const activeRows = gameState.competitionTables[activeConfig.key]
  const playerRow = activeRows.find((row) => row.playerName === gameState.player.fullName) ?? activeRows[0]
  const nextTournament =
    gameState.tournaments.find((item) => item.status === 'Entered') ??
    gameState.tournaments.find((item) => item.status === 'Available' || item.status === 'High Cost') ??
    gameState.tournaments[0]
  const nextTarget = activeRows.find((row) => row.ranking === Math.max(1, (playerRow?.ranking ?? 2) - 1))
  const rankingSources = gameState.matches.slice(0, 4).map((match) => ({
    label: `${match.round} vs ${match.opponentName}`,
    points: match.rankingPointsGained,
    prizeMoney: match.prizeMoneyEarned,
  }))
  const rankingScenarios = [
    { label: 'Reach Last 16', points: Math.max(6, Math.round((nextTournament?.rankingValue ?? 0) * 0.12)), projectedRank: Math.max(1, (playerRow?.ranking ?? 1) - 1) },
    { label: 'Semi Final', points: Math.max(14, Math.round((nextTournament?.rankingValue ?? 0) * 0.28)), projectedRank: Math.max(1, (playerRow?.ranking ?? 1) - 2) },
    { label: 'Win Event', points: Math.max(24, Math.round((nextTournament?.rankingValue ?? 0) * 0.45)), projectedRank: Math.max(1, (playerRow?.ranking ?? 1) - 4) },
  ]
  const playerArchive = gameState.worldPlayers.find((player) => player.playerName === gameState.player.fullName)
  const archivedMomentum = (playerArchive?.seasons ?? [])
    .slice(0, 6)
    .reverse()
    .map((season) => ({
      label: season.season,
      value: season[activeConfig.rankField] ?? playerRow?.ranking ?? 1,
    }))
  const rankingMomentum = archivedMomentum.length > 0
    ? archivedMomentum
    : Array.from({ length: 6 }, (_, index) => ({
        label: `W${index + 1}`,
        value: Math.max(1, (playerRow?.ranking ?? 1) + (5 - index) - Math.max(0, playerRow?.movement ?? 0)),
      }))
  const rankingCards = [
    {
      title: 'Tour Card',
      body: gameState.careerSystems.pro.hasTourCard
        ? `${gameState.careerSystems.pro.survivalStatus} · ${gameState.careerSystems.pro.yearsRemaining > 0 ? `${gameState.careerSystems.pro.yearsRemaining} season(s) left` : 'retained on merit'}`
        : 'No active main-tour card yet.',
    },
    {
      title: 'Q Tour',
      body: gameState.careerSystems.qTour.playerRank
        ? `Rank ${gameState.careerSystems.qTour.playerRank} · ${gameState.careerSystems.qTour.playerPoints} pts${gameState.careerSystems.qTour.directCardAwarded ? ' · card secured' : ''}`
        : 'No Q Tour points logged yet.',
    },
    {
      title: 'Q School',
      body: `${gameState.careerSystems.qSchool.campaignsEntered} campaigns · ${gameState.careerSystems.qSchool.repeatedFailures} failed runs${gameState.careerSystems.qSchool.topUpEligible ? ' · top-up live' : ''}`,
    },
    {
      title: 'Late Career',
      body: gameState.careerSystems.lateCareer.seniorActive
        ? 'Senior circuit active.'
        : gameState.careerSystems.lateCareer.seniorEligible
          ? 'Senior eligible; veteran path open.'
          : gameState.careerSystems.lateCareer.veteranActive
            ? 'Veteran phase active.'
            : 'Standard career phase.',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rankings"
        title="Rankings"
        description="Track the live ladder, follow the active pathway race, and see how the next event changes card pressure, top-up chances, and season position."
        actions={<div className="flex items-center gap-3"><ActionButton tone="secondary" onClick={() => setActiveTab(defaultTab)}>Current Path</ActionButton><ActionButton tone="secondary" onClick={() => setActiveTab('world')}>Main Tour</ActionButton></div>}
      />

      <div className="flex flex-wrap gap-3 border-b border-scm-border pb-4 text-sm">
        {rankingTabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`rounded-full px-4 py-2 ${tab.key === activeTab ? 'bg-scm-green/15 text-emerald-200' : 'text-scm-textMuted'}`}>{tab.label}</button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_360px]">
        <div className="space-y-6">
          <SectionCard title={activeConfig.label} subtitle={activeConfig.seasonLabel}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
                  <tr>
                    <th className="px-3 py-2">Rank</th>
                    <th className="px-3 py-2">Move</th>
                    <th className="px-3 py-2">Player</th>
                    <th className="px-3 py-2">Nation</th>
                    <th className="px-3 py-2 text-right">Points</th>
                    <th className="px-3 py-2 text-right">Prize Money</th>
                    <th className="px-3 py-2 text-right">Events</th>
                    <th className="px-3 py-2 text-right">Titles</th>
                    <th className="px-3 py-2 text-right">Record</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((row) => {
                    return (
                    <tr key={row.id} className={`border-t border-scm-border ${row.highlighted ? 'bg-emerald-500/10' : ''}`}>
                      <td className="px-3 py-3 text-scm-text">{row.ranking}</td>
                      <td className={`px-3 py-3 ${row.movement > 0 ? 'text-emerald-300' : row.movement < 0 ? 'text-rose-300' : 'text-scm-textMuted'}`}>{row.movement === 0 ? '—' : formatSigned(row.movement)}</td>
                      <td className="px-3 py-3 font-medium text-scm-text">{row.playerName}</td>
                      <td className="px-3 py-3 text-scm-textSoft">{row.nation}</td>
                      <td className="px-3 py-3 text-right text-scm-text">{row.points}</td>
                      <td className="px-3 py-3 text-right text-scm-text">{formatMoney(row.prizeMoney)}</td>
                      <td className="px-3 py-3 text-right text-scm-text">{row.eventsPlayed}</td>
                      <td className="px-3 py-3 text-right text-scm-text">{row.titles}</td>
                      <td className="px-3 py-3 text-right text-scm-text">{row.wins}-{row.losses}</td>
                      <td className="px-3 py-3 text-scm-textSoft">{row.statusNote ?? 'Active'}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="grid gap-4 md:grid-cols-4">
            {rankingCards.map((card) => <SectionCard key={card.title}><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{card.title}</p><p className="mt-3 text-sm text-scm-textSoft">{card.body}</p></SectionCard>)}
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title={`${gameState.player.fullName} · Ranking Breakdown`}>
            <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-5xl font-semibold text-emerald-300">#{playerRow?.ranking ?? '-'}</p>
                  <p className="mt-2 text-sm text-scm-textSoft">{activeConfig.label} · {gameState.careerSystems.pro.currentTier}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-scm-textMuted">Projected movement</p>
                  <p className="mt-2 text-emerald-300">+{rankingScenarios[2]?.points ?? 0} pts</p>
                  <p className="text-scm-text">toward rank {Math.max(1, (playerRow?.ranking ?? 1) - 1)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-center"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Ranking Points</p><p className="mt-2 text-2xl font-semibold text-scm-text">{playerRow?.points ?? 0}</p></div>
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-center"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Prize Money</p><p className="mt-2 text-2xl font-semibold text-scm-text">{formatMoney(playerRow?.prizeMoney ?? 0)}</p></div>
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-center"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Match Record</p><p className="mt-2 text-2xl font-semibold text-emerald-300">{playerRow ? `${playerRow.wins}-${playerRow.losses}` : '0-0'}</p></div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Source of Points</p>
                <div className="mt-3 space-y-3 text-sm text-scm-textSoft">
                  {rankingSources.length > 0 ? rankingSources.map((item) => (
                    <div key={item.label} className="flex items-center justify-between"><span>{item.label}</span><span className="text-scm-text">{item.points} pts · {formatMoney(item.prizeMoney)}</span></div>
                  )) : <div className="text-scm-textSoft">No ranked matches logged yet.</div>}
                </div>
              </div>
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Recent Results</p>
                <div className="mt-3 space-y-3 text-sm text-scm-textSoft">
                  {gameState.matches.slice(0, 4).map((match) => <div key={match.id}>{`${match.result} ${match.playerFrames}-${match.opponentFrames} vs ${match.opponentName}`}</div>)}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Next Target">
            <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
              <p className="text-4xl font-semibold text-emerald-300">#{nextTarget?.ranking ?? Math.max(1, (playerRow?.ranking ?? 2) - 1)}</p>
              <p className="mt-2 text-sm text-scm-textSoft">Needs {Math.max(0, (nextTarget?.points ?? 0) - (playerRow?.points ?? 0) + 1)} pts</p>
              <p className="mt-3 text-sm text-scm-textSoft">A solid run in {nextTournament?.name ?? 'the next event'} is enough to pressure the next rung of the {activeConfig.label.toLowerCase()}.</p>
            </div>
          </SectionCard>

          <SectionCard title="Ranking Movement">
            <div className="h-[180px] w-full">
              <ResponsiveContainer>
                <LineChart data={rankingMomentum}>
                  <CartesianGrid stroke="#203449" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={30} reversed />
                  <Tooltip contentStyle={{ backgroundColor: '#102033', border: '1px solid #31506f', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="value" stroke="#7ad34b" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="If The Next Event Goes Well">
            <div className="grid gap-3 sm:grid-cols-3">
              {rankingScenarios.map((scenario) => (
                <div key={scenario.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{scenario.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-300">+{scenario.points}</p>
                  <p className="mt-1 text-sm text-scm-textSoft">Rank {scenario.projectedRank}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-3 sm:grid-cols-2">
            <ActionButton className="justify-center" onClick={() => navigate('/player/attributes')}>View Player</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/season-review')}>View Event History</ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}