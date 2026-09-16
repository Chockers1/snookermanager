import { useState } from 'react';
import { Check, Wallet, WandSparkles, Plane, BedDouble } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TravelLocationPanel } from '../components/career/RealismPanels';
import { useGame } from '../context/useGame';
import { hotelOptionCatalog, travelOptionCatalog } from '../data/catalogs';
import { getNextEligibleTournament, getTravelPackageEstimate } from '../hooks/useGameState';
import { travelOptionsFor, journeyQuote } from '../game/realism/travel';
import { requiredDecisionBlocker } from '../game/requiredDecision';
import { formatMoney, formatPercent } from '../utils/formatters';
import './TravelPlannerPage.css';


export function TravelPlannerPage() {
  const { gameState } = useGame();
  const event = getNextEligibleTournament(gameState);
  const booking = event ? gameState.travel.bookings[event.id] : undefined;
  return <TravelPlannerContent key={`${event?.id}:${booking?.travelOptionId}:${booking?.hotelOptionId}`} />;
}

function TravelPlannerContent() {
  const { gameState, bookTravel } = useGame();
  const navigate = useNavigate();
  const event = getNextEligibleTournament(gameState);
  const booking = event ? gameState.travel.bookings[event.id] : undefined;
  const options = travelOptionsFor(gameState, event ?? undefined);
  const [travelId, setTravelId] = useState(booking?.travelOptionId ?? travelOptionCatalog.find(o => o.selected)?.id ?? options[0].id);
  const [hotelId, setHotelId] = useState(booking?.hotelOptionId ?? hotelOptionCatalog.find(o => o.selected)?.id ?? hotelOptionCatalog[0].id);
  const [autoNote, setAutoNote] = useState('');
  const travel = options.find(o => o.id === travelId) ?? options[0];
  const hotel = hotelOptionCatalog.find(o => o.id === hotelId) ?? hotelOptionCatalog[0];
  const estimate = getTravelPackageEstimate(gameState, travel.id, hotel.id, event?.id);
  const quote = event ? journeyQuote(gameState, event, travel.id) : undefined;
  const savedJourney = event ? gameState.realism?.journeys[`${event.id}:${event.startDate}`] : undefined;
  const locked = Boolean(savedJourney && (savedJourney.applied || savedJourney.departure <= gameState.currentDate));
  const delta = locked ? 0 : estimate.totalCost - (booking?.totalCost ?? 0);
  const cashLeft = gameState.player.cash - delta;
  const requiredDecision = requiredDecisionBlocker(gameState);
  const late = Boolean(event && quote && quote.arrival > event.startDate);
  const blockedReason = requiredDecision?.reason
    ?? (event?.status !== 'Entered' ? 'Enter an event before booking travel.'
      : locked ? 'Journey started. Your booked package is locked.'
      : late ? 'This route arrives after the event starts. Choose a later event.'
      : cashLeft < 0 ? `You need ${formatMoney(-cashLeft)} more to book this package.` : null);
  const multiplier = estimate.nightlyRate / hotel.cost;
  const chooseTravel = (id: string) => { setTravelId(id); setAutoNote(''); };
  const chooseHotel = (id: string) => { setHotelId(id); setAutoNote(''); };

  function autoPlan() {
    const packages = options.flatMap(t => hotelOptionCatalog.map(h => {
      const cost = getTravelPackageEstimate(gameState, t.id, h.id, event?.id).totalCost;
      return { travelId: t.id, hotelId: h.id, cost,
        score: h.recoveryValue + h.preparationValue - t.fatigueValue - t.delayRisk * 1.2 - cost / 6 };
    }));
    const affordable = packages.filter(p => p.cost <= gameState.player.cash + (booking?.totalCost ?? 0));
    const best = affordable.sort((a, b) => b.score - a.score)[0] ?? packages.sort((a, b) => a.cost - b.cost)[0];
    setTravelId(best.travelId); setHotelId(best.hotelId);
    setAutoNote(affordable.length ? 'Balanced for cost, recovery and reliability within your available cash.' : 'Lowest-cost package selected; more funds are still needed.');
  }

  function confirm() {
    if (!event || blockedReason) return;
    bookTravel(event.id, travel.id, hotel.id);
    navigate('/tournament/preparation');
  }

  return <div className="trip-page" data-testid="travel-planner-viewport">
    <header className="trip-header">
      <div className="trip-heading"><p className="trip-eyebrow">Tournament travel</p><h1>Travel Planner</h1><p>{event?.name ?? 'Choose an event'} · {event?.location ?? 'No venue selected'}</p></div>
      <div className="trip-header-actions">
        <button className="btn-secondary" onClick={autoPlan} disabled={locked || !event}><WandSparkles size={15} />Auto Plan</button>
        <button className="btn-secondary" onClick={() => navigate('/finance')}><Wallet size={15} />Finance</button>
      </div>
    </header>
    <TravelLocationPanel tournament={event ?? undefined} travelId={travel.id} />
    <div className="trip-workspace">
      <section className="trip-choices trip-transport" aria-label="Transport choices">
        <header className="trip-section-heading"><div className="trip-section-title"><span className="trip-section-icon"><Plane size={18} aria-hidden="true"/></span><div><h2>Travel Options</h2><p>Fare · fatigue · reliability</p></div></div><span className="trip-pill">6 choices</span></header>
        <div className="trip-option-grid">
          {[...options].sort((a,b) => a.cost-b.cost).map(option => {
            const selected = travel.id === option.id;
            const load = event ? journeyQuote(gameState, event, option.id).fatigue : Math.round(option.fatigueValue / 10);
            return <button key={option.id} type="button" className="trip-option" aria-pressed={selected} disabled={locked} onClick={() => chooseTravel(option.id)}>
              <span className="trip-option-heading"><strong><span className="trip-selection-mark" aria-label={selected ? "Selected" : undefined}>{selected && <Check size={11} aria-hidden="true"/>}</span>{option.name}</strong><span className="trip-fare">{formatMoney(option.cost)}<small>fare</small></span></span>
              <span className="trip-row-metrics"><span className="trip-stat trip-stat-fatigue"><span>Fatigue</span> <b>+{load}</b></span><span className="trip-stat trip-stat-delay"><span>Delay</span> <b>{formatPercent(option.delayRisk)}</b></span><span className="trip-stat trip-stat-comfort"><span>Comfort</span> <b>{option.comfort}/5</b></span></span>
            </button>;
          })}
        </div>
        <p className="trip-choice-note">{autoNote || 'Travel fatigue is added on arrival. Acclimatisation can offset it. Fares and delay risks are game estimates.'}</p>
      </section>
      <section className="trip-choices trip-hotels" aria-label="Accommodation choices">
        <header className="trip-section-heading"><div className="trip-section-title"><span className="trip-section-icon"><BedDouble size={18} aria-hidden="true"/></span><div><h2>Hotel Options</h2><p>Nightly rate · recovery · preparation</p></div></div><span className="trip-pill">6 choices</span></header>
        <div className="trip-option-grid">
          {[...hotelOptionCatalog].sort((a,b) => a.cost-b.cost).map(option => {
            const rate = Math.round(option.cost * multiplier * 100) / 100;
            const selected = hotel.id === option.id;
            return <button key={option.id} type="button" className="trip-option" aria-pressed={selected} disabled={locked} onClick={() => chooseHotel(option.id)}>
              <span className="trip-option-heading"><strong><span className="trip-selection-mark" aria-label={selected ? "Selected" : undefined}>{selected && <Check size={11} aria-hidden="true"/>}</span>{option.name}</strong><span className="trip-fare">{formatMoney(rate)}<small>/night</small></span></span>
              <span className="trip-row-metrics"><span className="trip-stat trip-stat-recovery"><span>Recovery</span> <b>{option.recoveryValue}/100</b></span><span className="trip-stat trip-stat-prep"><span>Prep</span> <b>{option.preparationValue}/100</b></span></span>
            </button>;
          })}
        </div>
        <p className="trip-choice-note">{hotel.name}: {hotel.noise} · {hotel.distance}. Ratings are game estimates.</p>
      </section>
      <aside className="trip-summary" aria-label="Trip summary">
        <header className="trip-summary-heading"><p className="trip-eyebrow">Your package</p><h2>Trip Summary</h2><span>{booking ? 'Existing booking' : 'Review before booking'}</span></header>
        <div className="trip-selected"><div><span>Transport</span><strong>{travel.name}</strong></div><div><span>Accommodation</span><strong>{hotel.name}</strong></div></div>
        <dl className="trip-breakdown">
          <div><dt>Travel, transfers & fees</dt><dd>{formatMoney(estimate.fixedCost)}</dd></div>
          <div><dt>Hotel · {formatMoney(estimate.nightlyRate)}/night</dt><dd>{estimate.minNights}–{estimate.maxNights} nights</dd></div>
          <div><dt>Trip estimate · early exit to final</dt><dd>{formatMoney(estimate.minCost)}–{formatMoney(estimate.maxCost)}</dd></div>
        </dl>
        <div className="trip-pay"><span>{locked ? 'Paid so far' : booking ? delta < 0 ? 'Refund on update' : 'Pay to update' : 'Pay on booking'}</span><strong>{formatMoney(locked ? estimate.totalCost : Math.abs(delta))}</strong><div>Cash after booking <b className={cashLeft < 0 ? 'trip-negative' : ''}>{formatMoney(cashLeft)}</b></div></div>
        <p className="trip-billing-note">{booking && !locked ? `${formatMoney(booking.totalCost)} already paid; only the difference is settled. ` : ''}{locked && savedJourney?.hotelNightlyRate === undefined ? 'This older booking covers the full event.' : `Includes ${locked ? estimate.paidNights : estimate.minNights} hotel nights. A longer run costs ${formatMoney(estimate.nightlyRate)} per extra night. Round dates are estimates.`}</p>
        {blockedReason && <p role="status" className="trip-warning">{blockedReason}{requiredDecision && <button onClick={() => navigate(requiredDecision.route)}>Open Inbox →</button>}</p>}
        <div className="trip-summary-actions">
          <button className="btn-primary" aria-label="Confirm Travel" disabled={!!blockedReason} onClick={confirm}>{booking && !locked ? 'Update & prepare' : 'Confirm Travel'}</button>
          <div><button className="btn-secondary" onClick={() => navigate(booking?.preparation ? '/tournaments/hub' : '/tournament/preparation')}>{booking?.preparation ? 'Tournament Hub' : 'Preparation'}</button><button className="btn-secondary" aria-label="Back To Calendar" onClick={() => navigate('/calendar')}>Calendar</button></div>
        </div>
      </aside>
    </div>
  </div>;
}
