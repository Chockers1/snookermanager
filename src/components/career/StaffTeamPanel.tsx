import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../../context/useGame';
import { depthOf, plusDays } from '../../game/careerDepth/shared';
import { PROJECTS } from '../../game/careerDepth/developmentProjects';
import { coachRelationshipLabel } from '../../game/careerDepth/relationships';
import { getCoachTerminationCost, getCoachContractOptions, getCoachContractWeeks, getCoachProjectedImpact } from '../../utils/coachMarket';
import { formatMoney as money, formatPercent } from '../../utils/formatters';
import { CareerEditor } from './CareerDepthPanels';
import { StaffMovementPanel } from './SeasonLifePanels';
const button = 'btn-secondary min-h-9 text-xs';
export function StaffTeamPanel<T extends string>({ slots, slotLimit, onManage }: {
  slots: readonly T[]; slotLimit: number; onManage: (slot: T, coachId?: string) => void;
}) {
  const { gameState } = useGame();
  const d = depthOf(gameState);
  const [historyOpen, setHistoryOpen] = useState(false);
  return <div className="flex min-h-0 flex-1 flex-col gap-3" data-testid="staff-team">
    <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
      {slots.map((slot, index) => <TeamCoachCard key={slot} slot={slot} unlocked={index < slotLimit} onRecruit={() => onManage(slot)} />)}
    </div>
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-xs">
      <div><span className="text-white">Shared development goal</span><p className="mt-1 font-semibold text-green-300">{d.project?.status === 'active' ? PROJECTS[d.project.kind].name : 'No active project'}</p></div>
      <button className={button} onClick={() => setHistoryOpen(true)}>Staff history & commitments</button>
      <Link className={button} to="/training">Review development project</Link>
      <div><span className="text-white">Cash flow after staff</span><p className={`mt-1 font-semibold ${gameState.finance.cashFlow >= 0 ? 'text-green-300' : 'text-amber-300'}`}>{gameState.finance.cashFlow >= 0 ? '+' : '−'}{money(Math.abs(gameState.finance.cashFlow))}/week</p></div>
    </footer>
    {historyOpen && <CareerEditor title="Staff commitments and movement" onClose={() => setHistoryOpen(false)}><div className="min-h-0 overflow-y-auto p-4"><StaffMovementPanel inline /></div></CareerEditor>}
  </div>;
}


function TeamCoachCard({ slot, unlocked, onRecruit }: { slot: string; unlocked: boolean; onRecruit: () => void }) {
  const { gameState, actOnCareer, extendCoachContract, fireCoach, negotiateCoachContract } = useGame();
  const [contractLabel, setContractLabel] = useState('8 Week Trial');
  const [dialog, setDialog] = useState<'contract' | 'renew' | 'terminate' | 'notice' | null>(null);
  const [tone, setTone] = useState<'Conservative' | 'Balanced' | 'Ambitious'>('Balanced');
  const contract = gameState.coachContracts.find(c => c.slot === slot);
  const coach = gameState.coaches.find(c => c.id === contract?.coachId);
  const relation = contract ? depthOf(gameState).coachRelationships[contract.coachId] : undefined;
  const record = contract ? gameState.careerDepth?.seasonLife?.staff[contract.coachId] : undefined;
  const impact = coach ? getCoachProjectedImpact(coach) : undefined;
  const options = coach ? getCoachContractOptions(coach) : [];
  const option = options.find(o => o.label === contractLabel) ?? options[0];
  const payout = contract ? getCoachTerminationCost(contract) : 0;
  const canTerminate = gameState.player.cash >= payout;
  const end = contract?.endsOn ?? record?.end ?? (contract ? plusDays(gameState.currentDate, contract.weeksRemaining * 7) : undefined);
  const ratings = coach ? [['Technical', coach.technical], ['Tactical', coach.tactical], ['Mental', coach.mental], ['Motivation', coach.motivation], ['Discipline', coach.discipline]] as const : [];
  const overall = coach ? Math.round((coach.technical + coach.tactical + coach.mental + coach.motivation) / 4) : 0;
  return <section aria-label={slot} className={`flex min-h-0 flex-col gap-1.5 rounded-xl border p-3 ${contract ? 'border-green-500/30 bg-surface' : 'border-dashed border-border bg-surface/50'}`}>
    <header className="flex shrink-0 items-center justify-between gap-2"><h2 className="text-sm font-bold text-white">{slot}</h2><span className="text-xs text-gray-300">{contract ? 'Hired' : unlocked ? 'Open slot' : 'Locked'}</span></header>
    {contract && coach ? <>
      <div className="flex shrink-0 items-center justify-between gap-2"><div className="min-w-0"><h3 className="text-base font-bold text-white">{coach.name}</h3><p className="text-xs text-green-300">{coach.type} · {coach.specialism}</p></div><div className="flex shrink-0 items-center gap-2 rounded-lg bg-green-500/10 px-2 py-1 text-center"><span className="block text-[10px] text-white">Overall</span><b className="text-lg text-green-300">{overall}</b></div></div>
      <div className="flex min-h-0 flex-1 flex-col justify-evenly gap-4 overflow-y-auto py-3 text-xs">
          <dl className="grid grid-cols-3 gap-3 rounded-lg bg-background/40 p-3">{ratings.map(([label, value]) => <div key={label}><dt className="text-[10px] text-white">{label}</dt><dd className="mt-1 text-sm font-bold">{value}</dd></div>)}</dl>
          <p><b className="text-white">Trains:</b> {impact?.skills.join(' · ')} <b className="text-green-300">(+{formatPercent((impact?.trainingBonus ?? 0) * 100)} gains)</b></p>
          <div className="grid grid-cols-2 gap-3"><div><h4 className="font-semibold text-white">Strengths</h4><p className="mt-1 leading-relaxed text-gray-300">{coach.strengths.join(' · ') || 'None recorded'}</p></div><div><h4 className="font-semibold text-white">Weaknesses</h4><p className="mt-1 leading-relaxed text-amber-200">{coach.weaknesses.join(' · ') || 'None recorded'}</p></div></div>
          <p className="text-green-300">{coachRelationshipLabel(relation?.trust ?? 55)} · {formatPercent(coach.compatibility)} fit</p>
          <div><h4 className="font-semibold text-white">Coach notes</h4><p className="mt-1 text-gray-300">{relation?.note ?? 'Review your development goal together.'}</p></div>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs"><span>{contract.weeksRemaining} weeks · {money(contract.weeklyCost)}/wk</span><button className="text-[10px] font-semibold text-green-300 underline" onClick={() => actOnCareer({ type: 'coach-review', id: contract.coachId })}>Review development together</button><button className={button} onClick={() => setDialog('contract')}>Manage contract</button>{record?.notice && <button className="text-amber-200 underline" onClick={() => setDialog('notice')}>Renewal request</button>}</footer>
      {dialog && <CareerEditor title={dialog === 'contract' ? `${coach.name} · Contract` : dialog === 'notice' ? 'Staff commitments and movement' : `${dialog === 'renew' ? 'Renew' : 'Terminate'} ${coach.name}`} onClose={() => setDialog(null)}><div className="min-h-0 space-y-4 overflow-y-auto p-4 text-sm">
        {dialog === 'contract' ? <>
          <dl className="grid grid-cols-3 gap-2 rounded-lg bg-background/40 p-2"><div><dt>Contract left</dt><dd className="mt-1 font-bold">{contract.weeksRemaining} weeks</dd></div><div><dt>Weekly cost</dt><dd className="mt-1 font-bold">{money(contract.weeklyCost)}</dd></div><div><dt>Ends</dt><dd className="mt-1 font-bold">{end}</dd></div></dl>
          {record?.notice && <div className="rounded-lg border border-amber-500/30 p-2"><p className="text-amber-200">Renewal request · respond by {record.notice.deadline}</p><p className="my-1">{record.notice.reason}</p><button className={button} onClick={() => setDialog('notice')}>Review renewal request</button></div>}
          {record?.promise && <p>Agreed {record.promise.kind} commitment · due {record.promise.due} · {record.promise.met === undefined ? 'awaiting review' : record.promise.met ? 'fulfilled' : 'missed'}</p>}
          <label className="block text-white">Extension length<select aria-label={`${slot} extension length`} className="mt-1 block w-full rounded border border-border bg-background p-2" value={contractLabel} onChange={e => setContractLabel(e.target.value)}>{options.map(o => <option key={o.label}>{o.label}</option>)}</select></label>
          {option && <p>Add {getCoachContractWeeks(option.label)} weeks · new rate {money(option.weeklyCost)}/week. Rate applies to the remaining contract and extension; paid weekly.</p>}
          <div className="flex flex-wrap gap-2"><button className="btn-primary text-xs" onClick={() => setDialog('renew')}>Renew contract</button><button className={button} onClick={() => setDialog('terminate')}>Terminate contract</button></div>
          <div className="flex flex-wrap gap-2"><select aria-label={`${slot} negotiation approach`} className="rounded border border-border bg-background p-2" value={tone} onChange={e => setTone(e.target.value as typeof tone)}><option>Conservative</option><option>Balanced</option><option>Ambitious</option></select><button className={button} onClick={() => negotiateCoachContract(coach.id, tone)}>Negotiate rate</button></div>
        </> : dialog === 'notice' ? <StaffMovementPanel inline coachId={coach.id} /> : dialog === 'renew' && option ? <>
          <p>Add {getCoachContractWeeks(option.label)} weeks. New end date: {plusDays(end!, getCoachContractWeeks(option.label) * 7)}.</p>
          <p>Weekly rate: {money(contract.weeklyCost)} → {money(option.weeklyCost)}. Total remaining commitment: {money((contract.weeksRemaining + getCoachContractWeeks(option.label)) * option.weeklyCost)}. Paid weekly, no upfront charge.</p>
          <button className="btn-primary" onClick={() => { extendCoachContract(coach.id, option.label); setDialog(null); }}>Confirm renewal</button>
        </> : <><p>Release {coach.name} from {slot} now. Pay the remaining contract: {contract.weeksRemaining} weeks × {money(contract.weeklyCost)} = <b>{money(payout)}</b>. Weekly staff costs fall by {money(contract.weeklyCost)}; morale falls by 2 points. Training benefits end immediately.</p><p>Cash after payout: <b>{money(gameState.player.cash - payout)}</b>.</p>{!canTerminate && <p className="text-amber-200">Insufficient funds. Keep the current contract until you can afford the payout or it expires.</p>}<button disabled={!canTerminate} className="btn-primary" onClick={() => { setDialog(null); fireCoach(coach.id); }}>Confirm termination</button></>}
      </div></CareerEditor>}
    </> : <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-2 text-center"><div aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-gray-500 text-3xl text-gray-300">{unlocked ? '+' : '—'}</div><h3 className="text-lg font-bold text-white">{unlocked ? 'No coach hired' : 'Specialist slot locked'}</h3><p className="max-w-xs text-sm text-gray-300">{unlocked ? 'Recruit a coach and their ratings, strengths and contract will appear here.' : 'Reach the top 16 or 58 reputation to unlock your second coaching slot.'}</p><button className="btn-primary text-xs" disabled={!unlocked} onClick={onRecruit}>Find {slot}</button></div>}
  </section>;
}
