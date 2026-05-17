import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle2, MailOpen, Settings, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import { buildInboxData } from '../utils/liveRouteData'

const accentStyles = {
  green: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
  gold: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
  blue: 'border-sky-500/25 bg-sky-500/10 text-sky-200',
  amber: 'border-orange-500/25 bg-orange-500/10 text-orange-100',
  red: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
  violet: 'border-violet-500/25 bg-violet-500/10 text-violet-200',
} as const

function getPriorityTone(priority: 'Low' | 'Medium' | 'High'): 'blue' | 'amber' | 'red' | 'green' {
  if (priority === 'High') return 'red'
  if (priority === 'Medium') return 'amber'
  return 'blue'
}

export function InboxPage() {
  const navigate = useNavigate()
  const { gameState, enterTournament } = useGame()
  const { newsCards, deadlines } = buildInboxData(gameState)
  const equipmentReady = Boolean(gameState.equipment.currentCueId && gameState.equipment.currentChalkId && gameState.equipment.currentTipId)
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'High Priority' | 'Staff' | 'Events'>('All')
  const [showActionableOnly, setShowActionableOnly] = useState(false)
  const [reviewedIds, setReviewedIds] = useState<string[]>([])
  const [selectedMessageId, setSelectedMessageId] = useState(gameState.inbox[0]?.id ?? '')
  const categoryBadges = [
    { label: 'All', count: gameState.inbox.length },
    { label: 'High Priority', count: gameState.inbox.filter((item) => item.priority === 'High').length },
    { label: 'Staff', count: gameState.inbox.filter((item) => /coach|staff|medical/i.test(item.sender)).length },
    { label: 'Events', count: gameState.inbox.filter((item) => /tournament|event|tour/i.test(`${item.subject} ${item.preview}`)).length },
  ]
  const featuredTournament =
    gameState.tournaments.find((item) => item.status === 'Available' || item.status === 'High Cost') ??
    gameState.tournaments.find((item) => item.status === 'Entered') ??
    gameState.tournaments[0]
  const filteredInbox = useMemo(() => gameState.inbox.filter((item) => {
    if (showActionableOnly && !item.actionRoute) return false
    if (categoryFilter === 'High Priority') return item.priority === 'High'
    if (categoryFilter === 'Staff') return /coach|staff|medical/i.test(item.sender)
    if (categoryFilter === 'Events') return /tournament|event|tour/i.test(`${item.subject} ${item.preview}`)
    return true
  }), [categoryFilter, gameState.inbox, showActionableOnly])
  const selectedMessage = filteredInbox.find((item) => item.id === selectedMessageId) ?? filteredInbox[0] ?? null

  useEffect(() => {
    if (!selectedMessage && filteredInbox[0]) {
      setSelectedMessageId(filteredInbox[0].id)
    }
  }, [filteredInbox, selectedMessage])

  const openMessage = (messageId: string) => {
    setSelectedMessageId(messageId)
    setReviewedIds((previous) => (previous.includes(messageId) ? previous : [...previous, messageId]))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="Inbox & News Centre"
        description="Your hub for career updates, media stories, tournament decisions, and support-system alerts."
        actions={
          <div className="flex items-center gap-3">
            <ActionButton tone="secondary" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setReviewedIds(filteredInbox.map((item) => item.id))}>Mark All Read</ActionButton>
            <ActionButton tone="secondary" icon={<Settings className="h-4 w-4" />} onClick={() => setShowActionableOnly((value) => !value)}>{showActionableOnly ? 'Show All Messages' : 'Message Settings'}</ActionButton>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_420px]">
        <div className="space-y-6">
          <SectionCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {categoryBadges.map((badge, index) => (
                  <button
                    key={badge.label}
                    onClick={() => setCategoryFilter(badge.label as 'All' | 'High Priority' | 'Staff' | 'Events')}
                    className={`rounded-full border px-3 py-2 text-sm ${categoryFilter === badge.label || (index === 0 && categoryFilter === 'All') ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200' : 'border-scm-border bg-scm-panelSoft text-scm-textMuted'}`}
                  >
                    {badge.label} <span className="ml-2 rounded-full bg-scm-panel px-2 py-0.5 text-xs">{badge.count}</span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setCategoryFilter('All')} className="rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-2 text-sm text-scm-text">All Priorities</button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
                  <tr>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">Preview</th>
                    <th className="px-3 py-2">Sender</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInbox.map((item, index) => {
                    const active = selectedMessage?.id === item.id

                    return (
                    <tr
                      key={item.id}
                      onClick={() => openMessage(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openMessage(item.id)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={active}
                      className={`border-t border-scm-border transition ${reviewedIds.includes(item.id) ? 'opacity-60' : ''} ${active ? 'bg-emerald-500/12' : index === 1 ? 'bg-emerald-500/8' : 'hover:bg-scm-panelSoft/80'} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scm-green/35`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`h-3 w-3 rounded-full ${item.priority === 'High' ? 'bg-rose-500' : item.priority === 'Medium' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                          <div className={`rounded-xl border p-2 ${item.priority === 'High' ? accentStyles.red : item.priority === 'Medium' ? accentStyles.amber : accentStyles.green}`}><MailOpen className="h-4 w-4" /></div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <p className="font-semibold text-scm-text">{item.subject}</p>
                          <p className="mt-1 text-xs text-scm-textMuted">{item.priority} priority</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-scm-textSoft">{item.preview}</td>
                      <td className="px-3 py-3">
                        <p className="text-scm-text">{item.sender}</p>
                        <p className="text-xs text-scm-textMuted">Career update</p>
                      </td>
                      <td className="px-3 py-3 text-scm-textSoft">{item.date}<br />Today</td>
                      <td className="px-3 py-3"><StatusBadge tone={getPriorityTone(item.priority)}>{item.priority}</StatusBadge></td>
                      <td className="px-3 py-3">
                        {item.actionRoute && item.actionLabel ? (
                          <Link to={item.actionRoute}>
                            <ActionButton tone="secondary" className="whitespace-nowrap px-2 py-1 text-xs">
                              {item.actionLabel}
                            </ActionButton>
                          </Link>
                        ) : (
                          <span className="text-xs text-scm-textMuted">No action</span>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-scm-textMuted">Showing 1 to {filteredInbox.length} of {gameState.inbox.length} messages</p>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard title="Latest News" subtitle="Stories shaping fan sentiment and tour context.">
              <div className="grid gap-4 md:grid-cols-3">
                {newsCards.map((card) => (
                  <div key={card.id} className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-green">{card.tag}</p>
                    <p className="mt-3 font-semibold text-scm-text">{card.title}</p>
                    <p className="mt-4 text-sm text-scm-textMuted">{card.source}</p>
                    <p className="mt-1 text-xs text-scm-textMuted">{card.date}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Upcoming Deadlines">
              <div className="space-y-3">
                {deadlines.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-scm-text">{item.title}</p>
                        <p className="mt-1 text-scm-textMuted">{item.dueText}</p>
                      </div>
                      <span className="text-scm-gold">{item.countdown}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Selected Message" subtitle={selectedMessage ? 'Click any inbox row to read the message in full context.' : 'No messages match the current filter.'}>
            {selectedMessage ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">From {selectedMessage.sender}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-scm-text">{selectedMessage.subject}</h3>
                  </div>
                  <StatusBadge tone={getPriorityTone(selectedMessage.priority)}>{selectedMessage.priority}</StatusBadge>
                </div>

                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Message Body</p>
                  <p className="mt-3 text-sm leading-7 text-scm-textSoft">{selectedMessage.preview}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Sender</p>
                    <p className="mt-2 text-scm-text">{selectedMessage.sender}</p>
                  </div>
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Date</p>
                    <p className="mt-2 text-scm-text">{selectedMessage.date}</p>
                  </div>
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Status</p>
                    <p className="mt-2 text-scm-text">{reviewedIds.includes(selectedMessage.id) ? 'Reviewed' : 'Unread'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {selectedMessage.actionRoute && selectedMessage.actionLabel ? (
                    <Link to={selectedMessage.actionRoute}>
                      <ActionButton>{selectedMessage.actionLabel}</ActionButton>
                    </Link>
                  ) : null}
                  <ActionButton tone="secondary" onClick={() => setReviewedIds((previous) => previous.filter((item) => item !== selectedMessage.id))}>
                    Mark As Unread
                  </ActionButton>
                </div>
              </div>
            ) : (
              <p className="text-sm text-scm-textMuted">No messages are available for the current filter.</p>
            )}
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-scm-gold">Tournament Invite</p>
                <h3 className="mt-2 text-3xl font-semibold text-scm-text">{featuredTournament?.name ?? 'No featured event'}</h3>
                <p className="mt-2 text-sm text-scm-textSoft">From Tournament Office</p>
              </div>
              <StatusBadge tone="amber">{featuredTournament?.status ?? 'Awaiting'}</StatusBadge>
            </div>

            <p className="mt-4 text-sm text-scm-textMuted">Current week {gameState.week}</p>
            <p className="mt-5 text-sm leading-7 text-scm-textSoft">{featuredTournament ? `${featuredTournament.name} is the clearest next decision in the save. Entering now commits entry, travel, and hotel costs, but creates a direct route into prize money and ranking movement.` : 'No active tournament decision is waiting right now.'}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {featuredTournament ? [
                { label: 'Location', value: featuredTournament.location },
                { label: 'Prize Money', value: `£${featuredTournament.prizeMoney.toLocaleString('en-GB')}` },
                { label: 'Ranking Value', value: `${featuredTournament.rankingValue} pts` },
                { label: 'Total Cost', value: `£${(featuredTournament.entryFee + featuredTournament.travelCost + featuredTournament.hotelCost).toLocaleString('en-GB')}` },
              ].map((detail) => (
                <div key={detail.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{detail.label}</p>
                  <p className="mt-2 text-scm-text">{detail.value}</p>
                </div>
              )) : null}
            </div>

            <div className="mt-5 rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-scm-gold"><Trophy className="h-4 w-4" />Why It Matters</p>
              <p className="mt-3 text-sm text-scm-textSoft">{featuredTournament ? `${featuredTournament.name} can shift the save immediately: entry affects cash, match simulation affects confidence and fatigue, and results feed the ladder right away.` : 'The inbox will surface bigger decisions once new events and offers arrive.'}</p>
            </div>

            {!equipmentReady ? (
              <div className="mt-5 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-100">
                Tournament invites stay blocked until a cue, chalk, and tip are equipped.
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {featuredTournament ? [
                { label: 'Ranking Upside', value: `${featuredTournament.rankingValue}`, detail: 'Points available' },
                { label: 'Prize Pool', value: `£${featuredTournament.prizeMoney.toLocaleString('en-GB')}`, detail: 'Top-end return' },
                { label: 'Cash On Hand', value: `£${gameState.player.cash.toLocaleString('en-GB')}`, detail: 'Current save balance' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-300">{item.value}</p>
                  <p className="mt-1 text-sm text-scm-textSoft">{item.detail}</p>
                </div>
              )) : null}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ActionButton className="justify-center" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => equipmentReady ? (featuredTournament && enterTournament(featuredTournament.id)) : navigate('/equipment/cues')}>{equipmentReady ? 'Accept Invite' : 'Open Equipment'}</ActionButton>
              <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/calendar')}>Decline Invite</ActionButton>
              <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/finance')}>Open Finance</ActionButton>
              <ActionButton tone="secondary" className="justify-center" icon={<Bell className="h-4 w-4" />} onClick={() => navigate('/staff/coaches')}>Speak To Coach</ActionButton>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}