import { useMemo } from 'react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Info, Scale, Star } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import { buildSponsorshipContractData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

function renderStars(value: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < value ? 'text-scm-gold' : 'text-scm-borderStrong'}>★</span>
  ))
}

function getProbabilityTone(value: number): 'green' | 'amber' | 'red' {
  if (value >= 65) return 'green'
  if (value >= 45) return 'amber'
  return 'red'
}

export function SponsorshipContractPage() {
  const [searchParams] = useSearchParams()
  const { gameState, acceptSponsor, rejectSponsor, negotiateSponsor } = useGame()
  const selectedOfferId = searchParams.get('offer')
  const selectedOffer = useMemo(
    () => gameState.sponsorOffers.find((offer) => offer.id === selectedOfferId) ?? gameState.sponsorOffers.find((offer) => offer.status === 'Available') ?? gameState.sponsorOffers[0],
    [gameState.sponsorOffers, selectedOfferId],
  )
  const contractData = selectedOffer ? buildSponsorshipContractData(gameState, selectedOffer) : null
  const [selectedNegotiationLabel, setSelectedNegotiationLabel] = useState(contractData?.negotiationOptions[0]?.label ?? '')
  const [negotiationTone, setNegotiationTone] = useState<'Conservative' | 'Balanced' | 'Ambitious'>('Balanced')

  if (!selectedOffer || selectedOffer.status !== 'Available' || !contractData) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Support"
          title="Sponsorship Contract Detail"
          description="That offer is no longer available for action."
        />

        <SectionCard>
          <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-8 text-center">
            <p className="text-2xl font-semibold text-scm-text">Offer unavailable</p>
            <p className="mt-3 text-sm text-scm-textSoft">The selected sponsor offer has already been accepted or rejected.</p>
            <div className="mt-6">
              <Link to="/sponsorship"><ActionButton>Back To Offers</ActionButton></Link>
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
        title="Sponsorship Contract Detail"
        description={`Sponsor: ${selectedOffer.name}. Review the full commercial package, negotiation levers, and overall brand impact before signing.`}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr_0.95fr]">
        <div className="space-y-6">
          <SectionCard>
            <div className="grid gap-4 xl:grid-cols-[180px_1fr]">
              <div className="flex items-center justify-center rounded-3xl border border-scm-border bg-scm-panelSoft p-6 text-center text-4xl font-semibold text-scm-green">
                A
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-semibold text-scm-text">{selectedOffer.name}</h2>
                  <StatusBadge tone="green">Exclusive</StatusBadge>
                </div>
                <p className="mt-2 text-scm-textMuted">{selectedOffer.category}</p>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Brand Fit</p><p className="mt-2 text-2xl font-semibold text-emerald-300">{selectedOffer.brandFit}%</p></div>
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Reputation Tier</p><p className="mt-2 text-2xl font-semibold text-scm-gold">{selectedOffer.minimumReputation}+</p></div>
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Contract Status</p><p className="mt-2 text-2xl font-semibold text-scm-text">Under Review</p></div>
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Deal Rating</p><p className="mt-2 text-2xl font-semibold text-emerald-300">{Math.round((selectedOffer.brandFit + Math.min(100, selectedOffer.monthlyValue / 25)) / 2)}/100</p></div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4 text-sm">
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Monthly Payment</p><p className="mt-2 text-scm-green">{formatMoney(selectedOffer.monthlyValue)}</p></div>
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Win Bonuses</p><p className="mt-2 text-scm-text">{selectedOffer.bonusClause}</p></div>
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Contract Length</p><p className="mt-2 text-scm-text">{selectedOffer.contractLength}</p></div>
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Behaviour</p><p className="mt-2 text-scm-text">{selectedOffer.behaviour}</p></div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Sponsor Slots Included">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
                  <tr>
                    <th className="px-3 py-2">Slot</th>
                    <th className="px-3 py-2">Annual Value</th>
                    <th className="px-3 py-2">Visibility</th>
                    <th className="px-3 py-2">Fit</th>
                  </tr>
                </thead>
                <tbody>
                  {contractData.includedSlots.map((slot) => (
                    <tr key={slot.slot} className="border-t border-scm-border">
                      <td className="px-3 py-3 text-scm-text">{slot.slot}</td>
                      <td className="px-3 py-3 text-scm-text">{formatMoney(slot.annualValue)}</td>
                      <td className="px-3 py-3 text-scm-textSoft">{slot.visibility}</td>
                      <td className="px-3 py-3"><div className="flex items-center gap-1">{renderStars(Math.max(1, Math.round(slot.fit / 20)))}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Advisor Notes">
              <div className="space-y-4 text-sm text-scm-textSoft">
                <p>{contractData.advisor.note}</p>
                <p className="text-emerald-300">Recommendation: {contractData.advisor.recommendation}</p>
              </div>
            </SectionCard>

            <SectionCard title="Deal Comparison">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
                    <tr>
                      <th className="px-3 py-2">Metric</th>
                      <th className="px-3 py-2">Current</th>
                      <th className="px-3 py-2">Apex Deal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractData.comparisonRows.map((row) => (
                      <tr key={row.metric} className="border-t border-scm-border">
                        <td className="px-3 py-3 text-scm-text">{row.metric}</td>
                        <td className="px-3 py-3 text-scm-textSoft">{row.current}</td>
                        <td className="px-3 py-3 text-emerald-300">{row.proposed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Contract Terms">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
                  <tr>
                    <th className="px-3 py-2">Terms</th>
                    <th className="px-3 py-2">Details</th>
                    <th className="px-3 py-2">Value / Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {contractData.terms.map((term) => (
                    <tr key={term.label} className="border-t border-scm-border">
                      <td className="px-3 py-3 text-scm-text">{term.label}</td>
                      <td className="px-3 py-3 text-scm-textSoft">{term.details}</td>
                      <td className="px-3 py-3 text-emerald-300">{term.valueImpact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Obligations & Brand Impact">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">Reputation Impact</span><span className="text-emerald-300">+8</span></div>
                <ProgressBar value={80} tone="green" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">Fan Reaction / Brand Fit</span><span className="text-emerald-300">92%</span></div>
                <ProgressBar value={92} tone="green" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">Obligation Load</span><span className="text-amber-300">3 / 5</span></div>
                <ProgressBar value={60} tone="amber" />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="flex items-center gap-2"><Info className="h-4 w-4" />Consideration: obligation load</p>
              <p className="mt-2">You already carry several visible sponsor commitments. Taking this deal is strong commercially, but it leaves less room for low-effort additions later.</p>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Negotiation Options">
            <div className="space-y-4 text-sm">
              {contractData.negotiationOptions.map((item) => (
                <button key={item.label} type="button" onClick={() => setSelectedNegotiationLabel(item.label)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedNegotiationLabel === item.label ? 'border-emerald-500/45 bg-emerald-500/10' : 'border-scm-border bg-scm-panelSoft hover:border-emerald-500/30'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-scm-text">{item.label}</p>
                      <p className="mt-1 text-scm-textMuted">{item.adjustment}</p>
                    </div>
                    <StatusBadge tone={getProbabilityTone(item.probability)}>{item.sponsorResponse}</StatusBadge>
                  </div>
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textMuted">Response chance</span><span className="text-scm-text">{item.probability}%</span></div>
                    <ProgressBar value={item.probability} tone={getProbabilityTone(item.probability)} />
                  </div>
                  <p className="mt-3 text-emerald-300">{item.impact}</p>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Negotiation Tone">
            <div className="grid gap-3">
              {(['Conservative', 'Balanced', 'Ambitious'] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setNegotiationTone(tone)}
                  className={`rounded-xl border px-4 py-3 text-sm ${negotiationTone === tone ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200' : 'border-scm-border bg-scm-panelSoft text-scm-text'}`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Strengths">
            <ul className="space-y-3 text-sm text-scm-textSoft">
              {contractData.advisor.strengths.map((item) => (
                <li key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />{item}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Risks / Considerations">
            <ul className="space-y-3 text-sm text-scm-textSoft">
              {contractData.advisor.risks.map((item) => (
                <li key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-rose-500" />{item}</li>
              ))}
            </ul>
          </SectionCard>

          <div className="grid gap-3">
            <ActionButton className="justify-center" icon={<Star className="h-4 w-4" />} onClick={() => acceptSponsor(selectedOffer.id)}>Accept Contract</ActionButton>
            <ActionButton tone="secondary" className="justify-center" icon={<Scale className="h-4 w-4" />} onClick={() => negotiateSponsor(selectedOffer.id, selectedNegotiationLabel, negotiationTone)}>Negotiate Terms</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => rejectSponsor(selectedOffer.id)}>Reject Deal</ActionButton>
            <Link to="/sponsorship"><ActionButton tone="secondary" className="w-full justify-center">Compare Offers</ActionButton></Link>
          </div>
        </div>
      </div>
    </div>
  )
}