import { useState } from 'react';
import { useGame } from '../../context/useGame';
import { CareerDisclosure } from './CareerDepthPanels';
import { qualificationRaces, survivalRace } from '../../game/realism/races';
import { TRAINING_BASES, baseTrainingMultiplier } from '../../game/realism/base';
import { realismOf, overseasWeeklyCost } from '../../game/realism';
import { LOCATIONS, journeyQuote, routeBetween } from '../../game/realism/travel';
import { venueConditions, conditionAdjustment, familiarisedFor } from '../../game/realism/conditions';
import { scoutingReport, watchableMatch } from '../../game/realism/scouting';
import type { BaseKind } from '../../game/realism/types';
import type { Tournament } from '../../types/game';

const money = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;
const body = 'min-h-0 space-y-4 overflow-y-auto border-t border-border p-4 text-xs';
const input = 'min-h-10 max-w-full rounded border border-border bg-background px-3 text-xs';
const button = 'btn-secondary min-h-10 text-xs';

export function QualificationRacesPanel() {
  const { gameState } = useGame();
  const races = qualificationRaces(gameState), survival = survivalRace(gameState);
  return <CareerDisclosure title="Qualification and tour survival" summary="Qualification races · defending earnings · tour survival">
    <div className={body}>
      <p className="text-gray-400">Counting earnings, not match win percentage, determine these races. Projections remove scheduled expiries but never invent future winnings. Dates are the game’s configured cut-offs.</p>
      {races.length === 0 && <p>No upcoming ranking-cut-off events on this calendar.</p>}
      {races.map(r => <section key={r.id} className="rounded-lg border border-border p-3">
        <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold">{r.name} · top {r.places}</h3><b className={r.position && r.position <= r.places ? 'text-green-400' : 'text-amber-300'}>{r.status}</b></div>
        <p className="mt-2 text-gray-400">{r.oneYear ? 'One-year earnings' : 'Two-year earnings'} · cut-off {r.cutoff} · your position {r.position ? `#${r.position}` : '—'}</p>
        <p className="my-2">Defending <b className="text-amber-300">{money(r.defending)}</b> · gap to line <b>{money(r.gap)}</b></p>
        <ul className="divide-y divide-border">{r.rivals.map(row => <li key={row.name} className="flex flex-wrap justify-between gap-2 py-1.5"><span>#{row.rank} {row.name}</span><span>{money(row.total)} · defending {money(row.defending)}</span></li>)}</ul>
        <p className="mt-2 text-gray-500">{r.note}</p>
      </section>)}
      <section className="rounded-lg border border-border p-3"><h3 className="font-bold">Tour survival · top 64</h3><p className="my-2">{survival.confirmed ? 'Season-end table' : 'Provisional, expiry-adjusted position'}: {survival.position ? `#${survival.position}` : 'not on world ladder'} · defending {money(survival.defending)} · gap {money(survival.gap)}</p><p className="text-green-400">{survival.protectedCard ? 'You have a protected second year on your card.' : 'Ranking and alternative qualification routes remain separate.'}</p><p className="mt-2 text-gray-400">Current one-year rescue places, excluding projected top 64 and protected cards: {survival.oneYearRescue.join(', ') || 'No eligible players yet'}. This is an outlook, not a new card award.</p></section>
    </div>
  </CareerDisclosure>;
}

export function TrainingBasePanel() {
  const { gameState, actOnRealism } = useGame();
  const r = realismOf(gameState), current = TRAINING_BASES[r.base];
  const [base, setBase] = useState<BaseKind>(r.base), [location, setLocation] = useState(r.home);
  const option = TRAINING_BASES[base], moving = location !== r.home;
  const joining = base === r.base && !moving ? 0 : option.joining + (moving ? Math.round(300 + routeBetween(r.location, location).distanceKm * 0.065) : 0);
  return <CareerDisclosure title="Training base and relocation" summary={`Training base · ${current.name} · ${r.home} · ${money(current.weekly)}/week`}>
    <div className={body}>
      <p>Current location <b>{r.location}</b> · home base <b>{r.home}</b> · access-adjusted training factor <b>{Math.round(baseTrainingMultiplier(gameState) * 100)}%</b></p>
      <div className="grid gap-3 sm:grid-cols-3">{Object.entries(TRAINING_BASES).map(([id, b]) => <button key={id} aria-pressed={base === id} className={`rounded-lg border p-3 text-left ${base === id ? 'border-green-500 bg-green-500/10' : 'border-border'}`} onClick={() => setBase(id as BaseKind)}><b className="block">{b.name}</b><span className="my-2 block text-green-400">{money(b.weekly)}/week · {b.tableSessions} priority sessions</span><span className="text-gray-400">{b.description}</span></button>)}</div>
      <label className="flex flex-wrap items-center gap-3">Base location<select aria-label="Base location" className={input} value={location} onChange={e => setLocation(e.target.value)}>{Object.keys(LOCATIONS).map(name => <option key={name}>{name}</option>)}</select></label>
      <p>Joining / relocation <b className="text-amber-300">{money(joining)}</b> · recurring <b>{money(option.weekly)}/week</b> · four-week base cost {money(option.weekly * 4)} · cash after joining {money(gameState.player.cash - joining)}</p>
      <p className="text-gray-400">Equipment rental and coaches are separate. Facility/base efficiency combined is capped at 115%; projects and partners retain their shared 10% allowance. Base benefits are reduced while away. Relocation reserves travel time and can be reviewed after four weeks.</p>
      <button className={button} disabled={base === r.base && location === r.home} onClick={() => actOnRealism({ type: 'base', base, location })}>Confirm base and costs</button><p role="status" className="text-amber-300">{gameState.lastAction}</p>
    </div>
  </CareerDisclosure>;
}

export function TravelLocationPanel({ tournament, travelId }: { tournament?: Tournament; travelId?: string }) {
  const { gameState, actOnRealism } = useGame();
  const r = realismOf(gameState), quote = tournament ? journeyQuote(gameState, tournament, travelId ?? '') : null;
  const route = routeBetween(r.location, r.home), returnCost = Math.round(45 + route.distanceKm * 0.065);
  return <CareerDisclosure title="Journey and acclimatisation" summary={quote ? `${quote.origin} → ${quote.destination} · ${quote.mode} · arrival ${quote.arrival}` : `Current location · ${r.location} · home ${r.home}`}>
    <div className={body}>
      {quote && <><p>{quote.origin} → {quote.destination} · about {quote.distanceKm.toLocaleString()} km · {quote.zoneHours} hours time-zone difference</p><p>Depart {quote.departure} · arrive {quote.arrival} · recommended acclimatisation {quote.acclimatisationDays} days</p><p className="text-amber-300">Trip fatigue +{quote.fatigue}; each full day before play offsets 2 points of this travel load. Later arrivals sacrifice that recovery.</p></>}
      <p>After an event you remain at its location. You may travel directly to the next event, or return to your training base.</p><p>Overseas lodging outside prepaid event nights: £35/night · currently projected {money(overseasWeeklyCost(gameState))}/week.</p>
      {r.location !== r.home && <button className={button} onClick={() => actOnRealism({ type: 'return-home' })}>Book return to {r.home} · {money(returnCost)} · {route.flight ? '2 days, +12 fatigue' : '1 day, +4 fatigue'}</button>}
      <p className="text-gray-500">Game estimates: regional geography, standard time zones and authored costs—not live fares or an airline schedule.</p><p role="status" className="text-amber-300">{gameState.lastAction}</p>
    </div>
  </CareerDisclosure>;
}

export function VenueScoutingPanel({ tournament, opponent }: { tournament?: Tournament | null; opponent?: string }) {
  const { gameState, actOnRealism } = useGame();
  const report = scoutingReport(gameState, opponent ?? ''), conditions = tournament ? venueConditions(tournament) : null;
  const familiar = tournament ? familiarisedFor(gameState, tournament) : false;
  const watch = report.id ? watchableMatch(gameState, report.id) : null;
  return <CareerDisclosure title="Conditions and scouting evidence" summary={`Conditions & scouting · ${conditions?.description ?? 'No venue'} · ${report.samples} observations`}>
    <div className={body}>
      {conditions && <section><h3 className="font-bold">{conditions.description}</h3><p className="mt-2">Cloth speed {conditions.speed}/100 · cushion response {conditions.cushions}/100 · room humidity {conditions.humidity}/100</p><p className="mt-2 text-gray-400">Authored venue observations, not live weather. Effects depend on cue-ball control and safety, are capped at −2 to +1 effective skill points and never change permanent attributes.</p><p className="my-2">Current touch adjustment: <b className="text-amber-300">{conditionAdjustment(conditions, gameState.attributes.technical['Cue Ball Control'] ?? 50, gameState.attributes.technical['Safety Play'] ?? 50, familiar)}</b></p><button className={button} disabled={familiar || !tournament || realismOf(gameState).familiarised.includes(`${tournament.id}:${tournament.startDate}`)} onClick={() => tournament && actOnRealism({ type: 'familiarise', eventId: tournament.id })}>{familiar ? 'Familiarisation completed' : tournament && realismOf(gameState).familiarised.includes(`${tournament.id}:${tournament.startDate}`) ? 'Familiarisation booked' : 'Reserve evening table familiarisation · £35'}</button></section>}
      {opponent && <section className="border-t border-border pt-3"><h3 className="font-bold">{opponent} · estimated OVR {report.ability}</h3><p className="my-2 text-gray-400">{report.note}</p><ul className="my-2 list-inside list-disc text-gray-300">{report.evidence.map(line => <li key={line}>{line}</li>)}</ul><p>Scouting confidence {report.confidence}% · estimates improve through direct matches, shared practice and recorded match reviews.</p><p className="my-2 text-gray-500">Your recorded approaches in meetings: {report.observedPlans.join(' · ') || 'No observed history'}. This is not proof of the opponent’s preferred tactics.</p><button className={button} disabled={!watch} onClick={() => report.id && actOnRealism({ type: 'scout', opponentId: report.id })}>Review recorded match · one evening</button>{watch && <p className="mt-2">{watch.event} · {watch.round} · replaces evening training</p>}</section>}
      <p role="status" className="text-amber-300">{gameState.lastAction}</p>
    </div>
  </CareerDisclosure>;
}

export function WorldDigestPanel({ messageId }: { messageId?: string }) {
  const { gameState } = useGame();
  const digests = realismOf(gameState).digest;
  const selected = messageId ? digests.filter(d => d.id === messageId) : digests.slice(0, 12);
  if (!selected.length) return null;
  const contents = <div className={body}>{selected.map(d => <section key={d.id}><h3 className="font-bold text-green-400">{d.title} · {d.date}</h3><ul className="mt-2 divide-y divide-border">{d.lines.map((line, i) => <li key={i} className="py-2 text-gray-200">{line}</li>)}</ul></section>)}</div>;
  return messageId ? contents : <CareerDisclosure title="World results and career milestones" summary="Around the tour · actual results and milestones">{contents}</CareerDisclosure>;
}
