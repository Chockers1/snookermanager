import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Check, ChevronRight, Handshake } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/GameStateContext'
import { buildSponsorshipOffersData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

function riskClass(risk: 'Low Risk' | 'Medium Risk' | 'Risky Terms') {
  if (risk === 'Risky Terms') return 'bg-red-600/20 text-red-400'
  if (risk === 'Medium Risk') return 'bg-amber-600/20 text-amber-400'
  return 'bg-green-600/20 text-green-400'
}

function getOfferStatus(offer: { minimumReputation: number }, reputation: number, slotsFull: boolean) {
  const missingReputation = Math.max(0, offer.minimumReputation - reputation)
  if (slotsFull) return { canAccept: false, label: 'Slots Full', detail: 'Improve ranking or reputation to open more sponsor room.' }
  if (missingReputation > 0) return { canAccept: false, label: `${missingReputation} rep short`, detail: `Need ${missingReputation} more reputation before this deal can be signed.` }
  return { canAccept: true, label: 'Ready', detail: 'This deal can be signed immediately.' }
}

export function SponsorshipOffersPage() {
  const { gameState, acceptSponsor, rejectSponsor } = useGame()
  const { currentSlots, brandMetrics, sponsorCapacity, activeRevenue } = buildSponsorshipOffersData(gameState)
  const availableOffers = useMemo(() => gameState.sponsorOffers.filter((offer) => offer.status === 'Available'), [gameState.sponsorOffers])
  const [selectedOfferId, setSelectedOfferId] = useState(availableOffers[0]?.id ?? '')
  const sponsorSlotsFull = gameState.sponsors.length >= sponsorCapacity
  const selectedOffer = availableOffers.find((offer) => offer.id === selectedOfferId) ?? availableOffers[0] ?? null
  const selectedOfferStatus = selectedOffer ? getOfferStatus(selectedOffer, gameState.player.reputation, sponsorSlotsFull) : null

  useEffect(() => {
    if (selectedOfferId && !availableOffers.some((offer) => offer.id === selectedOfferId)) setSelectedOfferId(availableOffers[0]?.id ?? '')
  }, [availableOffers, selectedOfferId])

  if (availableOffers.length === 0) {
    return (
      <div className="-m-6 flex h-[calc(100vh-5.5rem)] min-h-0 flex-col gap-2 overflow-hidden p-1.5">
        <div className="rounded-xl border border-border bg-surface/85 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Support</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-white">Sponsorship Offers</h1>
          <p className="mt-1 text-xs text-gray-400">All current sponsor offers have been accepted or cleared.</p>
        </div>

        <div className="card card-body flex min-h-0 flex-1 items-center justify-center px-8 text-center">
          <div>
            <BadgeCheck className="mx-auto h-12 w-12 text-green-400" />
            <p className="mt-4 text-2xl font-semibold text-white">No open sponsor offers</p>
            <p className="mt-3 text-sm text-gray-400">Review active deals or continue the career until new offers arrive.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/" className="btn-primary">Back To Dashboard</Link>
              <Link to="/inbox" className="btn-secondary">Open Inbox</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-5.5rem)] min-h-0 flex-col gap-2 overflow-hidden p-1.5">
      <div className="rounded-xl border border-border bg-surface/85 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Support</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-white">Sponsorship</h1>
            <p className="mt-1 truncate text-xs text-gray-400">Manage endorsements and commercial partnerships.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn-secondary px-3 py-2 text-xs">Compare Offers</button>
            <button type="button" className="btn-secondary px-3 py-2 text-xs">Filters</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {brandMetrics.map((metric) => (
          <div key={metric.label} className="card min-h-0 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{metric.value}%</p>
            <p className="text-[10px] text-gray-400">{metric.detail}</p>
            <div className="mt-2">
              <ProgressBar value={metric.value} tone={metric.value >= 75 ? 'green' : metric.value >= 50 ? 'amber' : 'red'} compact />
            </div>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-[0.63fr_0.37fr] gap-2">
        <div className="col-span-3 card min-h-0 flex h-full flex-col overflow-hidden">
          <div className="card-header px-3 py-2"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Handshake className="h-4 w-4 text-green-400" /> Active Sponsors</h3></div>
          <div className="card-body flex h-full min-h-0 flex-col gap-2 overflow-auto px-3 py-3 scrollbar-thin">
            {currentSlots.map((slot) => (
              <div key={slot.slot} className="rounded-lg bg-surface-light/50 px-3 py-2.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-white">{slot.sponsor}</span>
                  {slot.status === 'Active' ? <Check className="h-3 w-3 shrink-0 text-green-400" /> : null}
                </div>
                <div className="flex justify-between text-xs text-gray-400"><span>{slot.slot}</span><span className="text-green-400">{slot.monthlyIncome ?? '--'}</span></div>
                <p className="mt-1 text-[10px] text-gray-500">{slot.status}{slot.timeLeft ? ` - ${slot.timeLeft}` : ''}</p>
              </div>
            ))}
            <div className="mt-auto border-t border-border pt-2.5">
              <div className="flex justify-between text-xs"><span className="text-gray-400">Total Sponsored Income</span><span className="font-bold text-green-400">{formatMoney(activeRevenue)}/mo</span></div>
              <div className="mt-1 flex justify-between text-xs"><span className="text-gray-400">Slots Used</span><span className="text-white">{gameState.sponsors.length} / {sponsorCapacity}</span></div>
            </div>
          </div>
        </div>

        <div className="col-span-9 card min-h-0 flex h-full flex-col overflow-hidden">
          <div className="card-header px-3 py-2"><h3 className="text-sm font-semibold text-white">Available Offers</h3></div>
          <div className="card-body flex h-full min-h-0 flex-col gap-2 overflow-auto px-3 py-3 scrollbar-thin">
            {availableOffers.map((offer) => {
              const status = getOfferStatus(offer, gameState.player.reputation, sponsorSlotsFull)

              return (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => setSelectedOfferId(offer.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${selectedOffer?.id === offer.id ? 'bg-green-600/10 ring-1 ring-green-600/30' : 'bg-surface-light/50 hover:bg-surface-light'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
                        <Handshake className="h-[18px] w-[18px] text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="truncate text-sm font-semibold text-white">{offer.name}</h4>
                          <span className="rounded bg-green-600/20 px-1.5 py-0.5 text-[10px] text-green-400">{offer.category}</span>
                          <span className={status.canAccept ? 'rounded bg-sky-600/20 px-1.5 py-0.5 text-[10px] text-sky-400' : 'rounded bg-amber-600/20 px-1.5 py-0.5 text-[10px] text-amber-400'}>{status.label}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-400">{offer.contractLength} - {offer.behaviour}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">{formatMoney(offer.monthlyValue)}/mo</p>
                        <p className="text-[10px] text-gray-500">Offer Value</p>
                      </div>
                      <div className="w-[76px] text-center">
                        <p className="text-sm font-bold text-white">{offer.brandFit}%</p>
                        <p className="text-[10px] text-gray-500">Brand Fit</p>
                        <ProgressBar value={offer.brandFit} compact />
                      </div>
                      <span className={`rounded px-2 py-0.5 text-[10px] ${riskClass(offer.risk)}`}>{offer.risk}</span>
                      <ChevronRight className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {selectedOffer ? (
          <>
            <div className="col-span-8 card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header px-3 py-2"><h3 className="text-sm font-semibold text-white">Selected Offer</h3><span className={`rounded px-2 py-0.5 text-[10px] ${riskClass(selectedOffer.risk)}`}>{selectedOffer.risk}</span></div>
              <div className="card-body flex h-full min-h-0 flex-col justify-between gap-3 px-3 py-3">
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div><span className="text-gray-500">Monthly Payment</span><p className="text-lg font-bold text-green-400">{formatMoney(selectedOffer.monthlyValue)}</p></div>
                  <div><span className="text-gray-500">Contract</span><p className="text-white">{selectedOffer.contractLength}</p></div>
                  <div><span className="text-gray-500">Min Rep</span><p className="text-white">{selectedOffer.minimumReputation}</p></div>
                  <div><span className="text-gray-500">Brand Fit</span><p className="text-white">{selectedOffer.brandFit}%</p></div>
                </div>
                <p className="text-[11px] text-gray-400">{selectedOfferStatus?.detail}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-primary px-3 py-2 text-xs" disabled={!selectedOfferStatus?.canAccept} onClick={() => acceptSponsor(selectedOffer.id)}><Handshake className="h-3.5 w-3.5" /> Accept Deal</button>
                  <Link to={`/sponsorship/contract?offer=${selectedOffer.id}`} className="btn-secondary px-3 py-2 text-xs">View Details</Link>
                  <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => rejectSponsor(selectedOffer.id)}>Decline</button>
                </div>
              </div>
            </div>

            <div className="col-span-4 card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-body flex h-full min-h-0 flex-col justify-between px-3 py-3">
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-white">Brand Notes</h3>
                  <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex justify-between gap-3"><span>Bonus Clause</span><span className="text-right text-white">{selectedOffer.bonusClause}</span></div>
                    <div className="flex justify-between gap-3"><span>Behaviour</span><span className="text-right text-white">{selectedOffer.behaviour}</span></div>
                    <div className="flex justify-between gap-3"><span>Category</span><span className="text-right text-white">{selectedOffer.category}</span></div>
                    <div className="flex justify-between gap-3"><span>Projected Revenue</span><span className="text-right text-green-400">{formatMoney(activeRevenue + selectedOffer.monthlyValue)}/mo</span></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}