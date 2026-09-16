import { SectionTabs } from '../components/ui/SectionTabs';
import { CareerEditor } from '../components/career/CareerDepthPanels';
import { sponsorRenewalCeiling } from '../game/sponsorEconomy';
import { careerDifficulty } from '../game/careerDifficulty';
import { sponsorVolatility, sponsorVolatilityDescription } from '../game/sponsorVolatility';
import { seasonalSponsorBlocker, sponsorMarketProfile, sponsorSigningRequirements } from '../game/sponsorMarket'
import type { SponsorOfferCard } from '../types/game'
import { SponsorPerformancePanel } from '../components/game/SponsorPerformancePanel'
import { sponsorExpectations, sponsorRanking, sponsorPerformance, sponsorPerformanceTermsText } from '../game/sponsorPerformance'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Handshake } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import { buildSponsorshipOffersData } from '../utils/liveRouteData'
import { formatMoney, formatPercent } from '../utils/formatters'

function riskClass(risk: 'Low Risk' | 'Medium Risk' | 'Risky Terms') {
  if (risk === 'Risky Terms') return 'bg-red-600/20 text-red-400'
  if (risk === 'Medium Risk') return 'bg-amber-600/20 text-amber-400'
  return 'bg-green-600/20 text-green-400'
}

function getOfferStatus(offer: SponsorOfferCard, reputation: number, slotsFull: boolean, blocker: string | null) {
  if (blocker) return { canAccept: false, label: "Requirements changed", detail: blocker }
  const missingReputation = Math.max(0, offer.minimumReputation - reputation)
  if (slotsFull) return { canAccept: false, label: 'Slots Full', detail: 'All unlocked slots are occupied. A slot must be available before signing another deal.' }
  if (missingReputation > 0) return { canAccept: false, label: `${missingReputation} rep short`, detail: `Need ${missingReputation} more reputation before this deal can be signed.` }
  return { canAccept: true, label: 'Ready', detail: 'This deal can be signed immediately.' }
}

export function SponsorshipOffersPage() {
  const { gameState, acceptSponsor, rejectSponsor, renewSponsor, renegotiateSponsor, declineSponsorRenewal } = useGame()
  const { currentSlots, brandMetrics, sponsorCapacity, activeRevenue } = buildSponsorshipOffersData(gameState)
  const availableOffers = useMemo(() => gameState.sponsorOffers.filter((offer) => offer.status === 'Available'), [gameState.sponsorOffers])
  const [filter, setFilter] = useState<'All' | 'Ready' | 'Low Risk'>('All')
  const [tab, setTab] = useState<'Offers' | 'Comparison' | 'Commercial Profile'>('Offers')
  const [mobilePane, setMobilePane] = useState<'Offers' | 'Details'>('Offers')
  const [sponsorDialogId, setSponsorDialogId] = useState<string | null>(null)
  const sponsorDialog = gameState.sponsors.find(s => s.id === sponsorDialogId)

  const [selectedOfferId, setSelectedOfferId] = useState(availableOffers[0]?.id ?? '')
  const [selectedSlot, setSelectedSlot] = useState(() => currentSlots.find((slot) => slot.status === 'Vacant')?.slot ?? '')
  const activeSelectedSlot = currentSlots.some((slot) => slot.slot === selectedSlot && slot.status === 'Vacant')
    ? selectedSlot
    : currentSlots.find((slot) => slot.status === 'Vacant')?.slot ?? ''
  const commercial = sponsorRanking(gameState)
  const sponsorSlotsFull = gameState.sponsors.length >= sponsorCapacity
  const filteredOffers = availableOffers.filter((offer) => {
    if (filter === 'Ready') return getOfferStatus(offer, gameState.player.reputation, sponsorSlotsFull, seasonalSponsorBlocker(gameState, offer)).canAccept
    if (filter === 'Low Risk') return offer.risk === 'Low Risk'
    return true
  })
  const selectedOffer = filteredOffers.find((offer) => offer.id === selectedOfferId) ?? filteredOffers[0] ?? null
  const selectedOfferStatus = selectedOffer ? getOfferStatus(selectedOffer, gameState.player.reputation, sponsorSlotsFull, seasonalSponsorBlocker(gameState, selectedOffer)) : null

  function cycleFilter() {
    setFilter((current) => current === 'All' ? 'Ready' : current === 'Ready' ? 'Low Risk' : 'All')
  }


  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden" data-testid="sponsorship-page">
      <header className="card flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0"><h1 className="text-2xl font-bold text-white">Sponsorship</h1><p className="mt-1 text-xs text-gray-300">{gameState.season} · {sponsorMarketProfile(gameState).label}</p></div>
        <div className="text-right text-xs text-gray-300"><p><b className="text-lg text-green-300">{formatMoney(activeRevenue)}/mo</b></p><p>{gameState.sponsors.length} / {sponsorCapacity} unlocked slots used</p></div>
      </header>
      <div className="grid shrink-0 grid-cols-3 gap-2" aria-label="Sponsor slots" role="group">
        {currentSlots.map((slot, index) => {
          const sponsor = gameState.sponsors.find(s => s.slot === slot.slot)
          const performance = sponsor ? sponsorPerformance(sponsor, commercial.rank, commercial.label) : null
          return <button key={slot.slot} type="button" aria-label={`${slot.sponsor} ${slot.slot} ${slot.status}`} aria-haspopup={sponsor ? 'dialog' : undefined} aria-pressed={!sponsor && slot.status === 'Vacant' ? activeSelectedSlot === slot.slot : undefined} disabled={slot.status === 'Locked'} onClick={() => { if (sponsor) setSponsorDialogId(sponsor.id); else { setSelectedSlot(slot.slot); setTab('Offers'); setMobilePane('Details'); } }} className={`min-w-0 rounded-xl border p-3 text-left disabled:opacity-100 ${sponsor ? 'border-green-500/30 bg-surface' : activeSelectedSlot === slot.slot ? 'border-green-400 bg-green-500/10' : 'border-dashed border-border bg-surface/50'}`}>
            <p className="text-[10px] text-gray-300">Slot {index + 1} · {slot.slot}</p>
            <h2 className="mt-1 truncate text-sm font-bold text-white" title={slot.sponsor}>{sponsor ? sponsor.name : slot.status === 'Locked' ? 'Locked slot' : 'Available slot'}</h2>
            <p className="mt-1 text-xs font-semibold text-green-300">{sponsor ? slot.monthlyIncome : slot.status === 'Locked' ? 'Progress to unlock' : activeSelectedSlot === slot.slot ? 'Selected · choose an offer' : 'Choose this slot'}</p>
            <p className="mt-1 text-[10px] text-gray-300">{sponsor ? slot.timeLeft : slot.status === 'Locked' ? slot.sponsor : 'No active contract'}</p>
            {performance && <p className="mt-1 text-[10px] text-white">Satisfaction {formatPercent(performance.satisfaction)}{sponsor?.renewalStatus === 'Offered' ? ' · Renewal offered' : ' · View contract'}</p>}
          </button>
        })}
      </div>
      <SectionTabs id="sponsorship" label="Sponsorship sections" tabs={['Offers', 'Comparison', 'Commercial Profile'] as const} active={tab} onChange={setTab} />
      <div id="sponsorship-panel" role="tabpanel" aria-labelledby={`sponsorship-tab-${['Offers', 'Comparison', 'Commercial Profile'].indexOf(tab)}`} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab !== 'Commercial Profile' && <div className="mb-2 flex shrink-0 items-center justify-between gap-2"><p className="text-xs text-gray-300">{filteredOffers.length} available offers</p><button className="btn-secondary px-3 py-1.5 text-xs" onClick={cycleFilter}>Filter: {filter}</button></div>}
        {tab === 'Offers' && <>
          <div className="mb-2 shrink-0 lg:hidden"><SectionTabs id="sponsor-mobile" label="Offer view" tabs={['Offers', 'Details'] as const} active={mobilePane} onChange={setMobilePane} /></div>
          <div id="sponsor-mobile-panel" className="grid min-h-0 flex-1 gap-3 lg:grid-cols-12">
        <div className={`${mobilePane === 'Offers' ? 'flex' : 'hidden'} card min-h-0 flex-col overflow-hidden lg:col-span-7 lg:flex`}>
          <div className="card-header shrink-0 px-3 py-2"><h3 className="text-sm font-semibold text-white">Available Offers</h3><span className="text-[10px] text-gray-500">{filteredOffers.length} shown</span></div>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[560px] table-fixed text-xs" aria-label="Available sponsor offers">
              <thead className="sticky top-0 z-10 bg-surface-light text-white"><tr><th className="w-[36%] px-3 py-3 text-left font-semibold">Company</th><th className="w-[20%] px-3 py-3 text-left font-semibold">Contract</th><th className="w-[17%] px-3 py-3 text-right font-semibold">Monthly Pay</th><th className="w-[12%] px-2 py-3 text-right font-semibold">Brand Fit</th><th className="w-[15%] px-3 py-3 text-right font-semibold">Risk</th></tr></thead>
              <tbody>
                {filteredOffers.map(offer => {
                  const status = getOfferStatus(offer, gameState.player.reputation, sponsorSlotsFull, seasonalSponsorBlocker(gameState, offer))
                  return <tr key={offer.id} onClick={() => { setSelectedOfferId(offer.id); setMobilePane('Details'); }} className={`cursor-pointer border-b border-border transition-colors ${selectedOffer?.id === offer.id ? 'bg-green-500/10' : 'hover:bg-surface-light/60'}`}>
                    <td className="px-3 py-3 align-top"><button type="button" aria-pressed={selectedOffer?.id === offer.id} className="text-left text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-400">{offer.name}</button><p className="mt-1 text-[10px] text-gray-300">{offer.category}</p>{offer.seasonal && <p className="mt-1 text-[10px] text-green-300">New {offer.seasonal.season}</p>}</td>
                    <td className="px-3 py-3 align-top text-white" title={offer.behaviour}><p>{offer.contractLength}</p><span className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] ${status.canAccept ? 'bg-sky-500/15 text-sky-300' : 'bg-amber-500/15 text-amber-300'}`}>{status.label}</span></td>
                    <td className="px-3 py-3 text-right align-top font-bold tabular-nums text-green-300">{formatMoney(offer.monthlyValue)}</td>
                    <td className="px-2 py-3 text-right align-top font-semibold tabular-nums text-white">{formatPercent(offer.brandFit)}</td>
                    <td className="px-3 py-3 text-right align-top"><span className={`inline-block rounded px-2 py-1 text-[10px] ${riskClass(offer.risk)}`}>{offer.risk}</span><p className="mt-1 text-[10px] text-gray-300" title={sponsorVolatilityDescription(offer)}>{sponsorVolatility(offer).label} volatility</p></td>
                  </tr>
                })}
                {filteredOffers.length === 0 && <tr><td colSpan={5} className="p-4 text-sm text-gray-300">No offers match this filter. Your active contracts and reviews remain available above.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

            <div className={`${mobilePane === 'Details' ? 'flex' : 'hidden'} min-h-0 flex-col lg:col-span-5 lg:flex`}>
              {selectedOffer ? <>
            <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="card-header shrink-0 px-3 py-2"><h3 className="text-sm font-semibold text-white">Selected Offer</h3><span className={`rounded px-2 py-0.5 text-[10px] ${riskClass(selectedOffer.risk)}`}>{selectedOffer.risk}</span></div>
              <div className="card-body flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto px-3 py-3">
                <h4 className="text-base font-bold text-white">{selectedOffer.name}</h4><div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-gray-500">Monthly Payment</span><p className="text-lg font-bold text-green-400">{formatMoney(selectedOffer.monthlyValue)}</p></div>
                  <div><span className="text-gray-500">Contract</span><p className="text-white">{selectedOffer.contractLength}</p></div>
                  <div><span className="text-gray-500">Min Rep</span><p className="text-white">{selectedOffer.minimumReputation}</p></div>
                  <div><span className="text-gray-500">Brand Fit</span><p className="text-white">{selectedOffer.brandFit}%</p></div>
                </div>
                <p className="text-[11px] text-gray-300">{sponsorSigningRequirements(selectedOffer)}</p>
                <p className="rounded-lg border border-border bg-surface-light p-2 text-[11px] text-white">{sponsorVolatilityDescription(selectedOffer)}</p>
                <p className="text-[11px] text-gray-300">Starts at 75/100 satisfaction · Target: {sponsorExpectations(selectedOffer.risk === "Risky Terms" ? "High" : selectedOffer.risk === "Medium Risk" ? "Medium" : "Low", commercial.rank, commercial.label).expectedWinRate}% match wins. {sponsorPerformanceTermsText}</p>
                <p className="text-[11px] text-gray-400">{activeSelectedSlot ? `Signing into ${activeSelectedSlot}. ` : ''}{selectedOfferStatus?.detail}</p>
                <details className="shrink-0 rounded-lg border border-border p-3 text-xs text-gray-300"><summary className="cursor-pointer font-semibold text-white">Brand notes & bonuses</summary><div className="mt-3 space-y-2">{selectedOffer.seasonal && <p>{selectedOffer.note}</p>}<p>Bonus: {selectedOffer.bonusClause}</p><p>Behaviour: {selectedOffer.behaviour}</p><p>Category: {selectedOffer.category}</p><p>Income after signing: {formatMoney(activeRevenue + selectedOffer.monthlyValue)}/mo</p></div></details>
                <div className="mt-auto flex shrink-0 flex-wrap gap-2">
                  <button type="button" className="btn-primary px-3 py-2 text-xs" disabled={!selectedOfferStatus?.canAccept || !activeSelectedSlot} onClick={() => acceptSponsor(selectedOffer.id, activeSelectedSlot)}><Handshake className="h-3.5 w-3.5" /> Fill {activeSelectedSlot || 'Sponsor Slot'}</button>
                  <Link to={`/sponsorship/contract?offer=${selectedOffer.id}${activeSelectedSlot ? `&slot=${encodeURIComponent(activeSelectedSlot)}` : ''}`} className="btn-secondary px-3 py-2 text-xs">View Details</Link>
                  <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => rejectSponsor(selectedOffer.id)}>Decline</button>
                </div>
              </div>
            </div>

              </> : <div className="card flex flex-1 items-center justify-center p-4 text-sm text-gray-300">Choose another filter to see available offers.</div>}
            </div>
          </div>
        </>}
        {tab === 'Comparison' && <>
          <div className="card min-h-0 flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface text-gray-500"><tr><th className="px-3 py-2 text-left">Sponsor</th><th className="px-3 py-2 text-right">Monthly</th><th className="px-3 py-2 text-right">Brand Fit</th><th className="px-3 py-2 text-right">Minimum Rep</th><th className="px-3 py-2 text-right">Risk</th><th className="px-3 py-2 text-right">Status</th></tr></thead>
              <tbody>{filteredOffers.map((offer) => {
                const status = getOfferStatus(offer, gameState.player.reputation, sponsorSlotsFull, seasonalSponsorBlocker(gameState, offer))
                return <tr key={offer.id} className="border-t border-border/60"><td className="px-3 py-2 font-medium text-white">{offer.name}</td><td className="px-3 py-2 text-right text-green-400">{formatMoney(offer.monthlyValue)}</td><td className="px-3 py-2 text-right text-white">{offer.brandFit}%</td><td className="px-3 py-2 text-right text-white">{offer.minimumReputation}</td><td className="px-3 py-2 text-right text-gray-300">{offer.risk}</td><td className={status.canAccept ? 'px-3 py-2 text-right text-green-400' : 'px-3 py-2 text-right text-amber-400'}>{status.label}</td></tr>
              })}</tbody>
            </table>
          </div>
        </>}
        {tab === 'Commercial Profile' && <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{brandMetrics.map(metric => <div key={metric.label} className="card p-4"><p className="text-xs font-semibold text-white">{metric.label}</p><p className="my-2 text-2xl font-bold text-white">{formatPercent(metric.value)}</p><p className="mb-3 text-xs text-gray-300">{metric.detail}</p><ProgressBar value={metric.value} compact /></div>)}</div>
          <div className="card space-y-3 p-4 text-sm text-gray-300"><h2 className="font-bold text-white">How the sponsor market works</h2><p>Fresh approaches each season and as your profile grows. Signed contracts retain their agreed terms.</p><p>Publicity builds reputation up to 60; higher reputation must be earned through career results. Senior national offers require a top-16 position and a singles final in this or the previous season.</p><p>Click an active slot to review satisfaction, expectations and any renewal offer.</p></div>
        </div>}
      </div>
      {sponsorDialog && <CareerEditor title={`${sponsorDialog.name} · Contract`} onClose={() => setSponsorDialogId(null)}><div className="min-h-0 space-y-4 overflow-y-auto p-4 text-sm">
        <div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-surface-light p-3"><p className="text-xs text-gray-300">Monthly income</p><b>{formatMoney(sponsorDialog.monthlyValue)}</b></div><div className="rounded-lg bg-surface-light p-3"><p className="text-xs text-gray-300">Contract remaining</p><b>{sponsorDialog.weeksRemaining} weeks</b></div></div>
        <p className="text-gray-300">{sponsorDialog.slot}</p>
        <SponsorPerformancePanel sponsor={sponsorDialog} rank={commercial.rank} rankingLabel={commercial.label} missedLimit={careerDifficulty(gameState).missedLimit} />
        {sponsorDialog.renewalStatus === 'Offered' ? <div className="space-y-3 rounded-lg border border-amber-500/30 p-3"><h3 className="font-semibold text-amber-300">Renewal offered · {formatMoney(Math.min(sponsorDialog.renewalOfferValue ?? sponsorDialog.monthlyValue, sponsorRenewalCeiling(gameState)))}/mo</h3><p className="text-xs text-gray-300">Current exposure limits new terms to {formatMoney(sponsorRenewalCeiling(gameState))}/month. Existing payments continue to expiry. One counter-offer per renewal; retired players receive no new contract.</p><div className="flex flex-wrap gap-2"><button className="btn-primary text-xs" disabled={sponsorRenewalCeiling(gameState) === 0} onClick={() => renewSponsor(sponsorDialog.id)}>Renew 12 months</button><button className="btn-secondary text-xs" disabled={sponsorDialog.renewalCountered || sponsorRenewalCeiling(gameState) === 0} onClick={() => renegotiateSponsor(sponsorDialog.id)}>Renegotiate</button><button className="btn-secondary text-xs" onClick={() => declineSponsorRenewal(sponsorDialog.id)}>Decline renewal</button></div></div> : <p className="text-xs text-gray-300">No renewal offer is currently awaiting a response.</p>}
      </div></CareerEditor>}
    </div>
  )
}
