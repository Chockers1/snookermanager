import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { BadgeCheck, Handshake } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import { buildSponsorshipOffersData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

function getRiskTone(risk: 'Low Risk' | 'Medium Risk' | 'Risky Terms'): 'green' | 'amber' | 'red' {
  if (risk === 'Risky Terms') return 'red'
  if (risk === 'Medium Risk') return 'amber'
  return 'green'
}

function getOfferStatus(
  offer: {
    minimumReputation: number
  },
  playerReputation: number,
  sponsorSlotsFull: boolean,
) {
  const missingReputation = Math.max(0, offer.minimumReputation - playerReputation)

  if (sponsorSlotsFull) {
    return {
      canAccept: false,
      missingReputation,
      label: 'Unlocked slots full',
      tone: 'amber' as const,
      detail: 'Improve ranking or reputation to open more sponsor room.',
    }
  }

  if (missingReputation > 0) {
    return {
      canAccept: false,
      missingReputation,
      label: `${missingReputation} rep short`,
      tone: 'red' as const,
      detail: `Need ${missingReputation} more reputation before this deal can be signed.`,
    }
  }

  return {
    canAccept: true,
    missingReputation,
    label: 'Ready to sign',
    tone: 'green' as const,
    detail: 'This deal can be signed immediately and will fill the next open slot.',
  }
}

export function SponsorshipOffersPage() {
  const { gameState, acceptSponsor, rejectSponsor } = useGame()
  const { currentSlots, brandMetrics, sponsorCapacity, activeRevenue } = buildSponsorshipOffersData(gameState)
  const availableOffers = useMemo(
    () => gameState.sponsorOffers.filter((offer) => offer.status === 'Available'),
    [gameState.sponsorOffers],
  )
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const activeSponsorRevenue = gameState.sponsors.reduce((sum, sponsor) => sum + sponsor.monthlyValue, 0)
  const selectedOffer = availableOffers.find((offer) => offer.id === selectedOfferId) ?? null
  const sponsorSlotsFull = gameState.sponsors.length >= sponsorCapacity
  const selectedOfferStatus = selectedOffer
    ? getOfferStatus(selectedOffer, gameState.player.reputation, sponsorSlotsFull)
    : null
  const cannotAcceptSelectedOffer = selectedOfferStatus ? !selectedOfferStatus.canAccept : true

  useEffect(() => {
    if (selectedOfferId && !availableOffers.some((offer) => offer.id === selectedOfferId)) {
      setSelectedOfferId(null)
    }
  }, [availableOffers, selectedOfferId])

  const openOfferModal = (offerId: string) => {
    setSelectedOfferId(offerId)
  }

  const closeOfferModal = () => {
    setSelectedOfferId(null)
  }

  const handleAcceptSelectedOffer = () => {
    if (!selectedOffer || cannotAcceptSelectedOffer) {
      return
    }

    acceptSponsor(selectedOffer.id)
    closeOfferModal()
  }

  const handleRejectSelectedOffer = () => {
    if (!selectedOffer) {
      return
    }

    rejectSponsor(selectedOffer.id)
    closeOfferModal()
  }

  if (availableOffers.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Support"
          title="Sponsorship Offers"
          description="All current sponsor offers have been accepted or cleared from the desk."
        />

        <SectionCard>
          <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-8 text-center">
            <BadgeCheck className="mx-auto h-12 w-12 text-scm-green" />
            <p className="mt-4 text-2xl font-semibold text-scm-text">No open sponsor offers</p>
            <p className="mt-3 text-sm text-scm-textSoft">The current pipeline is empty. Review your active deals or continue the career until new offers arrive.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/"><ActionButton>Back To Dashboard</ActionButton></Link>
              <Link to="/inbox"><ActionButton tone="secondary">Open Inbox</ActionButton></Link>
            </div>
          </div>
        </SectionCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="Sponsorship Offers"
        description="Review and compare sponsor proposals to grow monthly income, brand fit, and long-term reputation."
        actions={<div className="flex items-center gap-3"><ActionButton tone="secondary">Compare Offers</ActionButton><ActionButton tone="secondary">Filters</ActionButton></div>}
      />

      <SectionCard title="Player Brand Metrics" subtitle="Commercial standing at a glance.">
        <div className="grid gap-3 xl:grid-cols-4">
          {brandMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-scm-border bg-scm-panelSoft px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{metric.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-scm-text">{metric.value}%</p>
                </div>
                <p className="max-w-[14rem] text-right text-xs text-scm-textSoft">{metric.detail}</p>
              </div>
              <div className="mt-3">
                <ProgressBar value={metric.value} tone={metric.value >= 75 ? 'green' : metric.value >= 50 ? 'amber' : 'red'} compact />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Active Sponsor Slots" subtitle="A maximum of 3 sponsor deals can be active. Better ranking bands unlock the second and third slots.">
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Active Monthly Income</p>
            <p className="mt-2 text-2xl font-semibold text-scm-green">{formatMoney(activeRevenue)}</p>
          </div>
          <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Slots Filled</p>
            <p className="mt-2 text-2xl font-semibold text-scm-text">{gameState.sponsors.length} / {sponsorCapacity}</p>
          </div>
          <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Max Sponsors</p>
            <p className="mt-2 text-2xl font-semibold text-scm-text">3 total</p>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {currentSlots.map((slot) => (
            <div key={slot.slot} className="rounded-2xl border border-scm-border bg-scm-panelSoft p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{slot.slot}</p>
                  <p className="mt-2 text-lg font-semibold text-scm-text">{slot.sponsor}</p>
                </div>
                <StatusBadge tone={slot.status === 'Active' ? 'green' : slot.status === 'Locked' ? 'amber' : 'blue'}>{slot.status}</StatusBadge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-scm-border bg-scm-panel px-3 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Monthly Income</p>
                  <p className="mt-2 text-scm-text">{slot.monthlyIncome ?? '--'}</p>
                </div>
                <div className="rounded-xl border border-scm-border bg-scm-panel px-3 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Time Left</p>
                  <p className="mt-2 text-scm-text">{slot.timeLeft ?? '--'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard title="Available Sponsor Deals" subtitle="Click any deal to review it and decide whether to accept or decline.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {availableOffers.map((offer) => {
              const offerStatus = getOfferStatus(offer, gameState.player.reputation, sponsorSlotsFull)
              const isReputationLocked = !offerStatus.canAccept && offerStatus.missingReputation > 0

              return (
                <button
                  type="button"
                  key={offer.id}
                  onClick={() => openOfferModal(offer.id)}
                  className={clsx(
                    'rounded-xl border p-4 text-left transition',
                    offerStatus.canAccept && 'border-scm-border bg-scm-panelSoft hover:border-emerald-500/30 hover:bg-scm-panel',
                    !offerStatus.canAccept && !isReputationLocked && 'border-scm-amber/40 bg-scm-amber/10 hover:border-scm-amber/60',
                    isReputationLocked && 'border-scm-red/40 bg-scm-red/10 hover:border-scm-red/60 hover:bg-scm-red/15',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-scm-text">{offer.name}</p>
                      <p className="text-sm text-scm-textMuted">{offer.category}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {offer.tags?.slice(0, 1).map((tag) => <StatusBadge key={tag} tone="green">{tag}</StatusBadge>)}
                    </div>
                  </div>

                  <p className="mt-3 text-3xl font-semibold text-scm-green">{formatMoney(offer.monthlyValue)}<span className="ml-2 text-base font-normal text-scm-textMuted">/mo</span></p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge tone={offerStatus.tone}>{offerStatus.label}</StatusBadge>
                    <StatusBadge tone={getRiskTone(offer.risk)}>{offer.risk}</StatusBadge>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-lg border border-scm-border/70 bg-scm-panel/80 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-scm-textMuted">Contract</p>
                      <p className="mt-1 text-scm-text">{offer.contractLength}</p>
                    </div>
                    <div className="rounded-lg border border-scm-border/70 bg-scm-panel/80 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-scm-textMuted">Min Rep</p>
                      <p className="mt-1 text-scm-text">{offer.minimumReputation}</p>
                    </div>
                    <div className="rounded-lg border border-scm-border/70 bg-scm-panel/80 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-scm-textMuted">Fit</p>
                      <p className="mt-1 text-scm-text">{offer.brandFit}%</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textMuted">Brand Fit</span><span className="text-scm-text">{offer.brandFit}%</span></div>
                    <ProgressBar value={offer.brandFit} tone={offer.brandFit >= 80 ? 'green' : offer.brandFit >= 60 ? 'amber' : 'red'} />
                  </div>

                  <p className={clsx('mt-3 text-sm', isReputationLocked ? 'text-rose-200' : 'text-scm-textSoft')}>
                    {offerStatus.detail}
                  </p>
                </button>
              )
            })}
          </div>
        </SectionCard>
      </div>

      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scm-deep/75 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="sponsor-offer-modal-title">
          <div className="w-full max-w-3xl rounded-3xl border border-scm-borderStrong bg-scm-panel p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-scm-textMuted">Sponsor Offer</p>
                <h2 id="sponsor-offer-modal-title" className="mt-2 text-3xl font-semibold text-scm-text">{selectedOffer.name}</h2>
                <p className="mt-2 text-sm text-scm-textSoft">{selectedOffer.category}</p>
              </div>
              <ActionButton tone="ghost" onClick={closeOfferModal}>Close</ActionButton>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Monthly Payment</p>
                <p className="mt-2 text-2xl font-semibold text-scm-green">{formatMoney(selectedOffer.monthlyValue)}</p>
              </div>
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Contract Length</p>
                <p className="mt-2 text-lg font-semibold text-scm-text">{selectedOffer.contractLength}</p>
              </div>
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Required Reputation</p>
                <p className="mt-2 text-lg font-semibold text-scm-text">{selectedOffer.minimumReputation}</p>
              </div>
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Projected Total</p>
                <p className="mt-2 text-2xl font-semibold text-scm-text">{formatMoney(activeSponsorRevenue + selectedOffer.monthlyValue)}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between"><span className="text-scm-textMuted">Bonus Clause</span><span className="text-scm-text">{selectedOffer.bonusClause}</span></div>
                  <div className="flex justify-between"><span className="text-scm-textMuted">Behaviour</span><span className="text-scm-text">{selectedOffer.behaviour}</span></div>
                  <div className="flex justify-between"><span className="text-scm-textMuted">Risk Profile</span><StatusBadge tone={getRiskTone(selectedOffer.risk)}>{selectedOffer.risk}</StatusBadge></div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textMuted">Brand Fit</span><span className="text-scm-text">{selectedOffer.brandFit}%</span></div>
                  <ProgressBar value={selectedOffer.brandFit} tone={selectedOffer.brandFit >= 80 ? 'green' : selectedOffer.brandFit >= 60 ? 'amber' : 'red'} />
                </div>
              </div>

              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
                <p>Choose whether to sign this deal now, reject it, or open the full contract page for negotiation.</p>
                {cannotAcceptSelectedOffer && (
                  <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-amber-100">
                    {sponsorSlotsFull
                      ? 'All unlocked sponsor slots are full. Improve ranking or reputation to unlock more space.'
                      : selectedOfferStatus?.detail}
                  </div>
                )}
                {!cannotAcceptSelectedOffer && (
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-100">
                    This offer can be signed immediately and will occupy the next open sponsor slot.
                  </div>
                )}
                {selectedOffer.note && <p className="mt-4 text-xs uppercase tracking-[0.16em] text-rose-300">{selectedOffer.note}</p>}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <ActionButton tone="secondary" onClick={handleRejectSelectedOffer}>Decline</ActionButton>
              <Link to={`/sponsorship/contract?offer=${selectedOffer.id}`} onClick={closeOfferModal}><ActionButton tone="secondary" icon={<BadgeCheck className="h-4 w-4" />}>View Details</ActionButton></Link>
              <Link to={`/sponsorship/contract?offer=${selectedOffer.id}`} onClick={closeOfferModal}><ActionButton tone="secondary">Negotiate</ActionButton></Link>
              <ActionButton
                icon={<Handshake className="h-4 w-4" />}
                onClick={handleAcceptSelectedOffer}
                disabled={cannotAcceptSelectedOffer}
                title={cannotAcceptSelectedOffer ? selectedOfferStatus?.detail : 'Accept Deal'}
              >
                {cannotAcceptSelectedOffer
                  ? sponsorSlotsFull
                    ? 'Unlocked Slots Full'
                    : selectedOfferStatus?.label ?? 'Not Ready To Sign'
                  : 'Accept Deal'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}