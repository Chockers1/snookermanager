import { useState } from 'react';
import { Building2, MapPin, Wallet } from 'lucide-react';
import { useGame } from '../../context/useGame';
import { realismOf } from '../../game/realism';
import { TRAINING_BASES, baseTrainingMultiplier, trainingLocationProfile } from '../../game/realism/base';
import { LOCATIONS, routeBetween } from '../../game/realism/travel';
import type { BaseKind } from '../../game/realism/types';
import { formatMoney, formatPercent } from '../../utils/formatters';
import { PlayerNames } from '../game/PlayerNames';

const locationName = (name: string) => ({ SanJose: 'San José', RiodeJaneiro: 'Rio de Janeiro', HongKong: 'Hong Kong' }[name] ?? name);

export function TrainingBaseEditor() {
  const { gameState, actOnRealism } = useGame();
  const current = realismOf(gameState);
  const [base, setBase] = useState<BaseKind>(current.base);
  const [location, setLocation] = useState(current.home);
  const [submitted, setSubmitted] = useState(false);
  const option = TRAINING_BASES[base], profile = trainingLocationProfile(location);
  const moving = location !== current.home, unchanged = !moving && base === current.base;
  const relocation = moving ? Math.round(300 + routeBetween(current.location, location).distanceKm * 0.065) : 0;
  const joining = unchanged ? 0 : option.joining;
  const cost = joining + relocation, cashAfter = gameState.player.cash - cost;
  const reserve = gameState.careerDepth?.schedule?.enabled ? gameState.careerDepth.schedule.reserve : 0;
  const affordable = cashAfter >= option.weekly * 4 + reserve;

  return <div className="base-editor">
    <div className="development-editor-intro base-current"><div><span>Your training home</span><strong>{TRAINING_BASES[current.base].name} <small>· {locationName(current.home)}</small></strong><p>Currently in {locationName(current.location)}{current.location !== current.home ? ' · Home programme inactive while away' : ' · Home programme available'}</p></div><div><strong>{formatPercent(baseTrainingMultiplier(gameState) * 100)}</strong><span>Current base factor</span><small>Adjusted for table access</small></div></div>
    <div className="base-editor-grid">
      <section className="development-project-card" aria-label="Facility choices">
        <header className="development-card-heading"><div><Building2/><h3>Choose your facility</h3></div><span className="development-status">3 levels of access</span></header>
        <div className="development-card-body">
          <div className="base-options">{Object.entries(TRAINING_BASES).map(([id, facility]) => <button type="button" key={id} aria-pressed={base === id} className="base-option" onClick={() => { setBase(id as BaseKind); setSubmitted(false); }}>
            <span className="base-option-title"><strong>{facility.name}</strong><span>{id === current.base ? 'Current' : base === id ? 'Selected' : 'Select'}</span></span>
            <span className="base-option-metrics"><span><b>{formatMoney(facility.weekly)}</b><small>per week</small></span><span><b>{facility.tableSessions}</b><small>priority sessions</small></span><span><b>{formatPercent(facility.efficiency * 100)}</b><small>base efficiency</small></span></span>
          </button>)}</div>
          <p className="base-option-description">{option.description}</p>
          <details className="base-explanation"><summary>How table access affects training</summary><p>Technical and Match Prep sessions use priority table access. Sessions above the limit receive 75% access credit. Away from home, access returns to eight priority sessions and 100% base efficiency.</p><p>Equipment rental and coaches are separate. The facility, base and location factor is capped at 115%; projects and partners keep their shared 10% allowance.</p></details>
        </div>
      </section>
      <section className="development-partner-card" aria-label="Location training benefits">
        <header className="development-card-heading"><div><MapPin/><h3>Location & programme</h3></div></header>
        <div className="development-card-body">
          <label className="development-field">Base location<select aria-label="Base location" value={location} onChange={event => { setLocation(event.target.value); setSubmitted(false); }}>{Object.keys(LOCATIONS).map(name => <option key={name} value={name}>{locationName(name)} · {trainingLocationProfile(name)?.name}</option>)}</select></label>
          {profile && <><div className="base-programme"><span>{locationName(location)}</span><h4>{profile.name}</h4><p>A practice programme available with any facility tier.</p></div><div className="base-benefits">{profile.strengths.map(skill => <article key={skill}><span>Faster development</span><h4>{skill}</h4><strong>+6% <small>training gains</small></strong></article>)}<article className="base-tradeoff"><span>Trade-off</span><h4>{profile.tradeoff}</h4><strong>−4% <small>training gains</small></strong></article></div>
          <p className="base-note">These change gains from scheduled training, not current ratings. Other skills develop normally. Benefits start after arrival and pause while away.</p></>}
          <details className="base-explanation"><summary>Location benefits & moving home</summary><p>Location bonuses share the 115% facility cap, so equipment and access can reduce the extra benefit. Expected Development includes these effects.</p><p>Relocation reserves travel time. Complete booked journeys and this week’s competition first; after moving, wait four weeks before reviewing your base again.</p><p>Fictional practice programmes. Fees depend on facility tier; relocation and event travel costs depend on location.</p></details>
        </div>
      </section>
    </div>
    <footer className="base-quote" aria-label="Base cost summary">
      <div className="base-quote-title"><Wallet/><h3>Your selection</h3><span>{option.name} · {locationName(location)}</span></div>
      <div className="base-costs"><div><span>Pay on confirmation</span><strong>{formatMoney(cost)}</strong><small>Joining {formatMoney(joining)} · relocation {formatMoney(relocation)}</small></div><div><span>Recurring cost</span><strong>{formatMoney(option.weekly)}<small>/week</small></strong><small>{formatMoney(option.weekly * 4)} over four weeks</small></div><div><span>Cash after joining</span><strong>{formatMoney(cashAfter)}</strong><small>Before future weekly fees</small></div></div>
      <div className="base-confirm"><p>{unchanged ? 'This is your current base. Choose a facility or location to change it.' : `Keep ${formatMoney(option.weekly * 4)} for four weeks of fees${reserve > 0 ? ` plus your ${formatMoney(reserve)} approved reserve` : ''}. Weekly fees are charged as time advances.`}{!unchanged && !affordable && <b> Not enough cash for this selection and reserve.</b>}</p><button className="btn-primary text-xs" disabled={unchanged || !affordable} onClick={() => { setSubmitted(true); actOnRealism({ type: 'base', base, location }); }}>Confirm base and costs</button></div>
      {submitted && <p role="status" className="base-feedback"><PlayerNames text={gameState.lastAction}/></p>}
    </footer>
  </div>;
}
