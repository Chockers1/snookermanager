import { seasonalSponsorBlocker, sponsorSigningRequirements } from '../game/sponsorMarket';
import { sponsorExpectations, sponsorRanking, sponsorPerformanceTermsText } from "../game/sponsorPerformance";
import { sponsorVolatilityDescription } from '../game/sponsorVolatility';
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Scale, Star } from "lucide-react";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import { buildSponsorshipContractData } from "../utils/liveRouteData";
import { formatMoney, formatPercent } from "../utils/formatters";
import { getSponsorObligationProfile } from "../hooks/useGameState";
import { SectionTabs } from "../components/ui/SectionTabs";
import { depthOf } from "../game/careerDepth/shared";

function probabilityClass(value: number) {
  if (value >= 65) return "bg-green-600/20 text-green-400";
  if (value >= 45) return "bg-amber-600/20 text-amber-400";
  return "bg-red-600/20 text-red-400";
}

function stars(value: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <span
      key={index}
      className={index < value ? "text-amber-400" : "text-gray-700"}
    >
      ★
    </span>
  ));
}

export function SponsorshipContractPage() {
  const [searchParams] = useSearchParams();
  const { gameState, acceptSponsor, rejectSponsor, negotiateSponsor } =
    useGame();
  const selectedOfferId = searchParams.get("offer");
  const introduction = depthOf(gameState).commercialIntroduction;
  const selectedSponsorSlot = searchParams.get("slot") ?? undefined;
  const selectedOffer = useMemo(
    () =>
      selectedOfferId
        ? gameState.sponsorOffers.find((offer) => offer.id === selectedOfferId)
        : gameState.sponsorOffers.find((offer) => offer.status === "Available") ?? gameState.sponsorOffers[0],
    [gameState.sponsorOffers, selectedOfferId],
  );
  const contractData = selectedOffer
    ? buildSponsorshipContractData(gameState, selectedOffer)
    : null;
  const [selectedNegotiationLabel, setSelectedNegotiationLabel] = useState(
    contractData?.negotiationOptions[0]?.label ?? "",
  );
  const [negotiationTone, setNegotiationTone] = useState<
    "Conservative" | "Balanced" | "Ambitious"
  >("Balanced");

  const tabs = ["Package", "Comparison", "Negotiation", "Performance"] as const;
  const [tab, setTab] = useState<typeof tabs[number]>("Package");

  if (!selectedOffer || selectedOffer.status !== "Available" || !contractData) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto">
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">
            Support
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            Sponsorship Contract Detail
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            That offer is no longer available.
          </p>
        </div>
        <div className="card card-body p-8 text-center">
          <p className="text-2xl font-semibold text-white">Offer unavailable</p>
          <p className="mt-3 text-sm text-gray-400">
            The selected sponsor offer has already been accepted or rejected.
          </p>
          <Link to="/sponsorship" className="btn-primary mt-6 inline-flex">
            Back To Offers
          </Link>
        </div>
      </div>
    );
  }

  const marketBlocker = seasonalSponsorBlocker(gameState, selectedOffer);
  const commercial = sponsorRanking(gameState);
  const expectations = sponsorExpectations(selectedOffer.risk === "Risky Terms" ? "High" : selectedOffer.risk === "Medium Risk" ? "Medium" : "Low", commercial.rank, commercial.label);
  const obligationProfile = getSponsorObligationProfile({
    category: selectedOffer.category,
    brandFit: selectedOffer.brandFit,
    risk:
      selectedOffer.risk === "Risky Terms"
        ? "High"
        : selectedOffer.risk === "Medium Risk"
          ? "Medium"
          : "Low",
    behaviour: selectedOffer.behaviour,
  });
  const reputationImpact = Math.max(
    1,
    Math.round((selectedOffer.brandFit - 45) / 8),
  );

  return (
    <div data-testid="sponsor-contract-page" className="flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden">
      <header className="card flex shrink-0 flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs text-emerald-300">Sponsorship Contract Detail</p>
          <h1 className="mt-1 text-xl font-bold text-white">{selectedOffer.name}</h1>
          <p className="mt-1 text-xs text-gray-300">{selectedOffer.category} · {selectedSponsorSlot ?? "Choose an available sponsor slot"}</p>
        </div>
        <div className="text-right"><p className="text-xl font-bold text-emerald-400">{formatMoney(selectedOffer.monthlyValue)}<span className="text-xs"> /mo</span></p><p className="mt-1 text-xs text-gray-300">{selectedOffer.contractLength} · {formatPercent(selectedOffer.brandFit)} fit</p></div>
      </header>
      <SectionTabs id="sponsor-contract" label="Contract sections" tabs={tabs} active={tab} onChange={setTab} />
      <div id="sponsor-contract-panel" role="tabpanel" aria-labelledby={`sponsor-contract-tab-${tabs.indexOf(tab)}`} tabIndex={0} className="min-h-0 flex-1 overflow-auto">
        {tab === "Package" && <div className="grid min-h-full gap-3 lg:grid-cols-2">
          <section className="card flex flex-col p-4">
            <h2 className="text-sm font-bold text-white">Your package</h2>
            <div className="my-4 grid grid-cols-2 gap-3">
              {[["Monthly payment", formatMoney(selectedOffer.monthlyValue)], ["Contract length", selectedOffer.contractLength], ["Brand fit", formatPercent(selectedOffer.brandFit)], ["Required reputation", `${selectedOffer.minimumReputation}+`]].map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-surface-light p-3"><p className="text-xs text-gray-300">{label}</p><p className="mt-2 text-lg font-bold text-white">{value}</p></div>)}
            </div>
            <dl className="space-y-3 text-sm"><div><dt className="text-gray-300">Win bonuses</dt><dd className="mt-1 font-semibold text-emerald-300">{selectedOffer.bonusClause}</dd></div><div><dt className="text-gray-300">Behaviour clause</dt><dd className="mt-1 text-white">{selectedOffer.behaviour}</dd></div></dl>
            {selectedOffer.seasonal && <p className="mt-4 border-t border-border pt-3 text-xs text-gray-300">{selectedOffer.note}</p>}
          </section>
          <section className="card p-4">
            <h2 className="text-sm font-bold text-white">Advisor notes</h2><p className="mt-3 text-sm text-gray-300">{contractData.advisor.note}</p><p className="mt-3 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{contractData.advisor.recommendation}</p>
            <h3 className="mb-2 mt-5 text-sm font-semibold text-white">Strengths</h3><ul className="space-y-2 text-xs text-gray-300">{contractData.advisor.strengths.map(item => <li key={item}>+ {item}</li>)}</ul>
            <h3 className="mb-2 mt-5 text-sm font-semibold text-white">Risks</h3><ul className="space-y-2 text-xs text-gray-300">{contractData.advisor.risks.map(item => <li key={item}>− {item}</li>)}</ul>
          </section>
        </div>}
        {tab === "Comparison" && <div className="grid min-h-full gap-3 lg:grid-cols-2">
          <section className="card overflow-hidden"><h2 className="card-header text-sm font-bold text-white">Deal comparison</h2><div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-300"><th className="p-3">Metric</th><th className="p-3">Current</th><th className="p-3">Proposed</th></tr></thead><tbody>{contractData.comparisonRows.map(row => <tr key={row.metric} className="border-t border-border"><th className="p-3 text-left font-medium text-white">{row.metric}</th><td className="p-3 text-gray-300">{row.current}</td><td className="p-3 text-emerald-300">{row.proposed}</td></tr>)}</tbody></table></div></section>
          <section className="card overflow-hidden"><h2 className="card-header text-sm font-bold text-white">Sponsor slots included</h2><div className="overflow-auto"><table className="w-full text-xs"><thead><tr className="text-left text-gray-300">{["Slot", "Annual value", "Visibility", "Fit"].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{contractData.includedSlots.map(slot => <tr key={slot.slot} className="border-t border-border"><th className="p-3 text-left font-medium text-white">{slot.slot}</th><td className="p-3 text-white">{formatMoney(slot.annualValue)}</td><td className="p-3 text-gray-300">{slot.visibility}</td><td className="whitespace-nowrap p-3" aria-label={formatPercent(slot.fit)}>{stars(Math.max(1, Math.round(slot.fit / 20)))}</td></tr>)}</tbody></table></div></section>
        </div>}
        {tab === "Negotiation" && <div className="grid min-h-full gap-3 lg:grid-cols-[2fr_1fr]">
          <section className="card flex flex-col p-4"><h2 className="text-sm font-bold text-white">Negotiation options</h2>
            {introduction?.offerId === selectedOffer.id && !introduction.used && introduction.expiresDate >= gameState.currentDate && <p className="mt-3 rounded border border-green-500/30 bg-green-500/10 p-2 text-xs text-green-400">Warm introduction: +5 percentage points on your next negotiation, available until {introduction.expiresDate}. Existing contract and slot rules still apply.</p>}
            <div className="mt-3 grid flex-1 gap-3 sm:grid-cols-2">{contractData.negotiationOptions.map(item => <button key={item.label} type="button" aria-pressed={selectedNegotiationLabel === item.label} onClick={() => setSelectedNegotiationLabel(item.label)} className={`flex flex-col justify-center rounded-lg border p-4 text-left ${selectedNegotiationLabel === item.label ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-surface-light"}`}><span className="flex flex-wrap items-start justify-between gap-2"><span className="text-sm font-bold text-white">{item.label}</span><span className={`rounded px-2 py-1 text-xs ${probabilityClass(item.probability)}`}>{item.sponsorResponse}</span></span><span className="mt-2 text-xs text-gray-300">{item.adjustment}</span><span className="my-3 block w-full"><ProgressBar value={item.probability} compact /></span><span className="text-sm font-semibold text-emerald-300">{item.impact}</span></button>)}</div>
          </section>
          <section className="card flex flex-col p-4"><h2 className="text-sm font-bold text-white">Negotiation tone</h2><p className="mt-3 text-xs text-gray-300">Choose a proposal and tone before submitting.</p><div className="my-4 grid gap-2">{(["Conservative", "Balanced", "Ambitious"] as const).map(tone => <button key={tone} type="button" aria-pressed={negotiationTone === tone} onClick={() => setNegotiationTone(tone)} className={negotiationTone === tone ? "tab-active" : "tab-inactive"}>{tone}</button>)}</div><div className="mt-auto rounded-lg border border-border p-3 text-sm text-white"><p className="text-xs text-gray-300">Selected proposal</p><p className="mt-2 font-semibold">{selectedNegotiationLabel}</p><p className="mt-1 text-emerald-300">{negotiationTone} approach</p></div></section>
        </div>}
        {tab === "Performance" && <div className="grid min-h-full gap-3 lg:grid-cols-2">
          <section className="card p-4"><h2 className="text-sm font-bold text-white">Obligations & brand impact</h2><div className="my-4 grid gap-3">{[["Reputation potential", `+${reputationImpact}`], ["Fan reaction", formatPercent(selectedOffer.brandFit)], ["Obligation load", `${obligationProfile.obligationLoad}/5`], ["Weekly fatigue cost", `${obligationProfile.weeklyFatigueCost}`], ["Category perk", obligationProfile.perk]].map(([label,value]) => <div key={label} className="flex items-center justify-between gap-4 rounded-lg bg-surface-light p-3"><span className="text-sm text-gray-300">{label}</span><strong className="text-sm text-white">{value}</strong></div>)}</div><p className="text-xs text-gray-300">Performance bonuses are paid automatically when earned.</p></section>
          <section className="card p-4"><h2 className="text-sm font-bold text-white">Performance terms</h2><p className="mt-3 rounded-lg border border-border bg-surface-light p-3 text-xs text-white">{sponsorVolatilityDescription(selectedOffer)}</p><p className="mt-2 text-xs text-gray-300">{sponsorSigningRequirements(selectedOffer)}</p><div className="my-4 grid grid-cols-2 gap-3"><div className="rounded-lg bg-surface-light p-4"><p className="text-xs text-gray-300">Starting satisfaction</p><p className="mt-2 text-2xl font-bold text-emerald-300">75/100</p></div><div className="rounded-lg bg-surface-light p-4"><p className="text-xs text-gray-300">Target match wins</p><p className="mt-2 text-2xl font-bold text-white">{expectations.expectedWinRate}%</p></div></div>{expectations.rankingTarget !== null && <p className="mb-4 text-sm text-white">Ranking target: top {expectations.rankingTarget} in {expectations.rankingLabel}.</p>}<p className="text-sm text-gray-300">{sponsorPerformanceTermsText}</p><p className="mt-3 text-sm text-gray-300">Wins rebuild confidence. Weeks without matches do not lower satisfaction. Missed promotional obligations are reviewed separately.</p></section>
        </div>}
      </div>
      <footer className="card shrink-0 p-3">
        {marketBlocker && <p role="status" className="mb-2 text-xs text-amber-300">{marketBlocker}</p>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" className="btn-primary justify-center text-xs" disabled={Boolean(marketBlocker)} onClick={() => acceptSponsor(selectedOffer.id, selectedSponsorSlot)}><Star className="h-3.5 w-3.5" />Accept Contract</button>
          <button type="button" className="btn-secondary justify-center text-xs" disabled={Boolean(marketBlocker)} onClick={() => tab !== "Negotiation" ? setTab("Negotiation") : negotiateSponsor(selectedOffer.id, selectedNegotiationLabel, negotiationTone)}><Scale className="h-3.5 w-3.5" />{tab === "Negotiation" ? "Submit Negotiation" : "Negotiate Terms"}</button>
          <button type="button" className="btn-secondary justify-center text-xs" onClick={() => rejectSponsor(selectedOffer.id)}>Reject Deal</button>
          <Link to="/sponsorship" className="btn-secondary justify-center text-xs">Compare Offers</Link>
        </div>
      </footer>
    </div>
  );
}
