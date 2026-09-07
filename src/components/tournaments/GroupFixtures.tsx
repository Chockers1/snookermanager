import { PlayerLink } from '../game/PlayerLink';
import { useState } from 'react';
import type { BracketRound } from '../../types/game';
import { fixtureComplete, groupsInRound, groupTable } from '../../game/championshipLeague';

export function GroupFixtures({ rounds, playerName, currentRound, selectedStage, onStageChange }: { rounds: BracketRound[]; playerName: string; currentRound?: string | null; selectedStage?: string; onStageChange?: (stage: string) => void }) {
  const initial = rounds.find(r=>r.label===currentRound) ?? [...rounds].reverse().find(r=>r.matches.some(m=>m.group && (m.top.name===playerName||m.bottom.name===playerName))) ?? rounds[0];
  const [stage, setStage] = useState(initial?.label ?? 'Stage One Groups');
  const [chosenGroup, setChosenGroup] = useState('');
  const round = rounds.find(r=>r.label===(selectedStage ?? stage)) ?? rounds[0];
  const groups = groupsInRound(round);
  const group = groups.find(g=>g.name===chosenGroup) ?? groups.find(g=>g.matches.some(m=>m.top.name===playerName||m.bottom.name===playerName)) ?? groups[0];
  const table = group ? groupTable(group.matches, round?.groupRule, round?.groupTieOrder?.[group.name]) : [];
  const ranking = !round?.groupRule || round.groupRule === 'ranking';
  const advancing = round?.groupAdvance ?? 1;
  const scheduled = table.length - 1;
  const complete = Boolean(group?.matches.every(fixtureComplete));
  const position = table.findIndex(p=>p.name===playerName);
  const upcoming = group?.matches.find(m=>!fixtureComplete(m) && (m.top.name===playerName||m.bottom.name===playerName));
  return <section aria-label="Group standings and fixtures" className="h-full min-h-0 space-y-3 overflow-y-auto p-1 text-xs">
    <div className="flex flex-wrap items-center gap-2">
      <label>Stage <select aria-label="Group stage" value={round?.label} onChange={e=>{setStage(e.target.value);onStageChange?.(e.target.value);setChosenGroup('');}} className="ml-2 min-h-10 rounded border border-border bg-surface px-2">{rounds.map(r=><option key={r.label}>{r.label}</option>)}</select></label>
      {!!groups.length && <label>Group <select aria-label="Group" value={group?.name} onChange={e=>setChosenGroup(e.target.value)} className="ml-2 min-h-10 rounded border border-border bg-surface px-2">{groups.map(g=><option key={g.name} value={g.name}>{g.name}{g.matches.some(m=>m.top.name===playerName||m.bottom.name===playerName)?' · Your group':''}</option>)}</select></label>}
    </div>
    {group ? <>
      <p role="status" className="rounded bg-green-600/10 p-2 text-green-300">{position>=0 ? `You are ${position+1} of ${table.length} · ${table[position].points} ${table[position].points === 1 ? 'point' : 'points'} from ${table[position].played} of ${scheduled} matches. ` : ''}{complete ? round?.groupRule === 'league' ? `${table[0].name} wins the league.` : `${table.slice(0, advancing).map(p => p.name).join(', ')} advance.` : `Provisional table · ${round?.groupRule === 'league' ? 'first place wins the league' : `top ${advancing} advance`}.`}</p>
      <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-right" aria-label="Group table"><thead className="text-gray-400"><tr>{['Pos','Player','P','W','D','L','FF','FA','FD','Pts','HB'].map(label=><th key={label} className="px-2 py-2">{label}</th>)}</tr></thead><tbody>{table.map((p,i)=><tr key={p.name} className={p.name===playerName?'bg-green-600/15 font-semibold text-green-300':'border-t border-border text-gray-200'}><td className="p-2">{i+1}</td><td className="p-2 text-left"><PlayerLink name={p.name}/></td>{[p.played,p.won,p.drawn,p.lost,p.framesFor,p.framesAgainst,p.difference,p.points,p.breaks[0]??'–'].map((n,j)=><td key={j} className="p-2">{n}</td>)}</tr>)}</tbody></table></div>
      <p className="text-[10px] text-gray-400">{ranking ? 'Win 3 points · draw 1 · loss 0. Up to four frames: 3–0, 3–1 or 2–2. Ties: points, frame difference, head-to-head/mini-table, recorded breaks.' : `Win 1 point · no draws · best of ${round?.bestOf}. Ties: ${round?.groupRule === 'winsFrames' ? 'wins, frames won, fewest frames lost, highest break' : 'wins, frame difference, head-to-head'}.`} {round?.groupRule === 'amateur' ? 'Unresolved ties use best-of-five re-spotted-black play-offs.' : 'Exact ties use the saved draw order.'}</p>
      {round?.groupTieMatches?.filter(m => m.group === group.name).map((m, i) => <p key={i} className="text-amber-200">Black-ball tie-break: {m.top} {m.topFrames}–{m.bottomFrames} {m.bottom}</p>)}
      <h3 className="font-semibold">{group.name} fixtures and results</h3>
      <div className="divide-y divide-border">{group.matches.map((m,i)=><div key={m.id} className={`flex items-center justify-between gap-3 px-2 py-2 ${m.id===upcoming?.id?'rounded bg-amber-500/10 text-amber-200':''}`}><span className="text-gray-500">{i+1}</span><span className="flex-1"><PlayerLink name={m.top.name}/></span><b className="shrink-0">{fixtureComplete(m)?`${m.top.score}–${m.bottom.score}`:'vs'}</b><span className="flex-1 text-right"><PlayerLink name={m.bottom.name}/></span><span className="w-16 text-right text-[10px]">{fixtureComplete(m)?'Played':m.id===upcoming?.id?'Next match':'Scheduled'}</span></div>)}</div>
    </> : round?.matches.length ? <section aria-label={`${round.label} fixtures`} className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-white">{round.label}</h3>
        <span className="text-[11px] text-gray-400">Best of {round.bestOf ?? 5} · first to {Math.floor((round.bestOf ?? 5) / 2) + 1}</span>
      </header>
      <div className={round.matches.length > 1 ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'max-w-xl'}>
        {round.matches.map((match, index) => {
          const played = fixtureComplete(match);
          const containsPlayer = match.top.name === playerName || match.bottom.name === playerName;
          const waiting = match.placeholder || [match.top.name, match.bottom.name].some(name => name === 'TBD');
          const status = played ? 'Completed' : waiting ? 'Awaiting players' : containsPlayer && round.label === currentRound ? 'Your next match' : 'Scheduled';
          return <article key={match.id} aria-label={`${round.label} match ${index + 1}`} className={`min-w-0 overflow-hidden rounded-lg border ${containsPlayer ? 'border-green-500/50 bg-green-500/5' : 'border-border bg-background/30'}`}>
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 text-[10px]">
              <span className="font-semibold text-gray-300">Match {index + 1}{containsPlayer ? ' · Your match' : ''}</span>
              <span className={containsPlayer ? 'text-green-300' : 'text-gray-400'}>{status}</span>
            </header>
            {[match.top, match.bottom].map((player, side) => {
              const won = played && (player.score ?? 0) > ((side === 0 ? match.bottom : match.top).score ?? 0);
              return <div key={side} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 ${side ? 'border-t border-border/60' : ''} ${player.name === playerName ? 'bg-green-500/10' : ''}`}>
                <span className="min-w-0 break-words text-sm font-medium text-white"><PlayerLink name={player.name} />{won && <span className="ml-2 text-[10px] font-semibold text-green-300">Won</span>}</span>
                <span className="min-w-8 rounded bg-black/20 px-2 py-1 text-center text-lg font-bold tabular-nums text-white">{typeof player.score === 'number' ? player.score : '–'}</span>
              </div>;
            })}
          </article>;
        })}
      </div>
    </section> : <p className="p-3 text-gray-400">Fixtures are drawn when the previous stage finishes.</p>}

  </section>;
}
