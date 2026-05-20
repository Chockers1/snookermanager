import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, Check, CheckCircle2, ChevronRight, Mail, Trophy } from 'lucide-react'
import { useGame } from '../context/GameStateContext'
import { buildInboxData } from '../utils/liveRouteData'

function priorityClass(priority: 'Low' | 'Medium' | 'High') {
  if (priority === 'High') return 'bg-red-600/20 text-red-400'
  if (priority === 'Medium') return 'bg-amber-600/20 text-amber-400'
  return 'bg-sky-600/20 text-sky-400'
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

  const filteredInbox = useMemo(() => gameState.inbox.filter((item) => {
    if (showActionableOnly && !item.actionRoute) return false
    if (categoryFilter === 'High Priority') return item.priority === 'High'
    if (categoryFilter === 'Staff') return /coach|staff|medical/i.test(item.sender)
    if (categoryFilter === 'Events') return /tournament|event|tour/i.test(`${item.subject} ${item.preview}`)
    return true
  }), [categoryFilter, gameState.inbox, showActionableOnly])

  const uniqueNewsCards = useMemo(() => {
    const seen = new Set<string>()
    return newsCards.filter((card) => {
      const key = `${card.title}-${card.source}-${card.date}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [newsCards])

  const selectedMessage = filteredInbox.find((item) => item.id === selectedMessageId) ?? filteredInbox[0] ?? null
  const featuredTournament =
    gameState.tournaments.find((item) => item.status === 'Booked' || item.status === 'Available' || item.status === 'High Cost') ??
    gameState.tournaments.find((item) => item.status === 'Entered') ??
    gameState.tournaments[0]
  const tabs = [
    { id: 'All', label: 'All', count: gameState.inbox.length },
    { id: 'High Priority', label: 'High Priority', count: gameState.inbox.filter((item) => item.priority === 'High').length },
    { id: 'Staff', label: 'Staff', count: gameState.inbox.filter((item) => /coach|staff|medical/i.test(item.sender)).length },
    { id: 'Events', label: 'Events', count: gameState.inbox.filter((item) => /tournament|event|tour/i.test(`${item.subject} ${item.preview}`)).length },
  ] as const

  useEffect(() => {
    if (!selectedMessage && filteredInbox[0]) setSelectedMessageId(filteredInbox[0].id)
  }, [filteredInbox, selectedMessage])

  function openMessage(messageId: string) {
    setSelectedMessageId(messageId)
    setReviewedIds((previous) => previous.includes(messageId) ? previous : [...previous, messageId])
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">Support</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Inbox & News Centre</h1>
          <p className="mt-1 text-sm text-gray-400">Career updates, media stories, tournament decisions, and support alerts.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={() => setReviewedIds(filteredInbox.map((item) => item.id))}>
            <Check className="h-3.5 w-3.5" /> Mark All Read
          </button>
          <button type="button" className="btn-secondary text-xs" onClick={() => setShowActionableOnly((value) => !value)}>
            {showActionableOnly ? 'Show All' : 'Actionable'}
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setCategoryFilter(tab.id)} className={categoryFilter === tab.id ? 'tab-active text-xs' : 'tab-inactive text-xs'}>
            {tab.label} <span className="ml-1 rounded bg-surface px-1.5 py-0.5">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 items-stretch gap-4">
        <div className="col-span-5 card flex min-h-0 overflow-hidden">
          <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
            {filteredInbox.map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => openMessage(message.id)}
                className={`flex w-full items-start gap-3 p-3 text-left transition-colors ${selectedMessage?.id === message.id ? 'bg-green-600/10' : 'hover:bg-surface-light/50'} ${reviewedIds.includes(message.id) ? 'opacity-60' : ''}`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${reviewedIds.includes(message.id) ? 'bg-transparent' : 'bg-green-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-white">{message.subject}</span>
                    {!reviewedIds.includes(message.id) ? <span className="rounded bg-green-600 px-1 text-[9px] text-white">New</span> : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-400">{message.preview}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">{message.sender}</span>
                    <span className="text-[10px] text-gray-600">|</span>
                    <span className="text-[10px] text-gray-500">{message.date}</span>
                  </div>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${priorityClass(message.priority)}`}>{message.priority}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-7 flex min-h-0 flex-col gap-4 overflow-hidden">
          {selectedMessage ? (
            <div className="card shrink-0">
              <div className="card-header">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{selectedMessage.subject}</h3>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${priorityClass(selectedMessage.priority)}`}>{selectedMessage.priority}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">From: {selectedMessage.sender} - {selectedMessage.date}</p>
                </div>
              </div>
              <div className="card-body">
                <p className="text-sm leading-relaxed text-gray-300">{selectedMessage.preview}</p>
                {selectedMessage.actionRoute && selectedMessage.actionLabel ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    <Link to={selectedMessage.actionRoute} className="btn-primary text-xs">
                      {selectedMessage.actionLabel} <ChevronRight className="h-3 w-3" />
                    </Link>
                    <button type="button" className="btn-secondary text-xs" onClick={() => setReviewedIds((previous) => previous.filter((id) => id !== selectedMessage.id))}>
                      Mark Unread
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="card card-body shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase text-amber-400">Tournament Invite</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{featuredTournament?.name ?? 'No featured event'}</h3>
                <p className="mt-2 text-sm text-gray-400">
                  {featuredTournament ? `${featuredTournament.location} - ${featuredTournament.status}` : 'No active tournament decision is waiting right now.'}
                </p>
              </div>
              <Mail className="h-8 w-8 text-green-400" />
            </div>
            {featuredTournament ? (
              <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
                <div><span className="text-gray-500">Prize Money</span><p className="text-green-400">£{featuredTournament.prizeMoney.toLocaleString('en-GB')}</p></div>
                <div><span className="text-gray-500">Ranking Value</span><p className="text-white">{featuredTournament.rankingValue} pts</p></div>
                <div><span className="text-gray-500">Total Cost</span><p className="text-white">£{(featuredTournament.entryFee + featuredTournament.travelCost + featuredTournament.hotelCost).toLocaleString('en-GB')}</p></div>
                <div><span className="text-gray-500">Cash</span><p className="text-white">£{gameState.player.cash.toLocaleString('en-GB')}</p></div>
              </div>
            ) : null}
            <div className="mt-4 flex items-center gap-2 rounded border border-amber-600/30 bg-amber-600/10 p-3 text-xs text-amber-100">
              <AlertTriangle className="h-4 w-4" /> {equipmentReady ? 'Equipment ready for entry.' : 'Equip cue, chalk, and tip before entering.'}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="btn-primary justify-center text-xs" onClick={() => equipmentReady ? (featuredTournament && enterTournament(featuredTournament.id)) : navigate('/equipment/cues')}>
                <CheckCircle2 className="h-3.5 w-3.5" /> {equipmentReady ? 'Accept Invite' : 'Open Equipment'}
              </button>
              <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/calendar')}>Decline Invite</button>
              <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/finance')}>Open Finance</button>
              <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/staff/coaches')}><Bell className="h-3.5 w-3.5" /> Speak To Coach</button>
              <button type="button" className="btn-secondary col-span-2 justify-center text-xs" onClick={() => navigate('/tournaments/hub')}>
                <Trophy className="h-3.5 w-3.5" /> Tournament Hub
              </button>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-4">
            <div className="card card-body">
              <h4 className="mb-3 text-xs font-semibold text-white">Latest News</h4>
              <div className="space-y-2">
                {uniqueNewsCards.slice(0, 3).map((card) => (
                  <div key={card.id} className="rounded bg-surface-light/50 p-3">
                    <p className="text-[10px] uppercase text-green-400">{card.tag}</p>
                    <p className="mt-1 text-xs font-medium text-white">{card.title}</p>
                    <p className="mt-1 text-[10px] text-gray-500">{card.source} - {card.date}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card card-body">
              <h4 className="mb-3 text-xs font-semibold text-white">Upcoming Deadlines</h4>
              <div className="space-y-2">
                {deadlines.map((item) => (
                  <div key={item.id} className="rounded bg-surface-light/50 p-3">
                    <div className="flex justify-between">
                      <p className="text-xs font-medium text-white">{item.title}</p>
                      <span className="text-[10px] text-amber-400">{item.countdown}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-gray-500">{item.dueText}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}