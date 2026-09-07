import { useGame } from '../../context/useGame';
import type { Tournament, BracketRound } from '../../types/game';
import { eventAtmosphere, notableDrawMatches, matchWalkout } from '../../game/tournamentAtmosphere';
import { PlayerLink } from './PlayerLink';
export function TournamentAtmosphere({event,rounds=[],opponent}:{event:Tournament;rounds?:BracketRound[];opponent?:string}){
 const {gameState}=useGame();const atmosphere=eventAtmosphere(gameState,event);
 const ledger=gameState.rollingRankings?.events[event.id+':'+event.startDate];
 // A completed CPU draw may already be stored after your elimination. Do not reveal it early.
 const visible=ledger&&ledger.completedOn>gameState.currentDate?[]:rounds;
 const notable=notableDrawMatches(visible,gameState.player.fullName);
 return <details className={'rounded-lg border p-3 text-xs '+(atmosphere.tone==='theatre'?'border-amber-500/30 bg-amber-500/5':'border-border bg-surface')}><summary className="cursor-pointer font-semibold text-white">Around the arena · {event.name}{atmosphere.defendingChampion?' · Defending champion: '+atmosphere.defendingChampion:''}{notable.length?' · '+notable.length+' notable results':''}</summary><p className="mt-3 text-gray-300">{matchWalkout(atmosphere,opponent?[gameState.player.fullName,opponent]:[])}</p>{atmosphere.defendingChampion&&<p className="mt-2 text-amber-300">Defending champion: <PlayerLink name={atmosphere.defendingChampion}/></p>}<ul className="mt-3 space-y-2 text-gray-300">{notable.map(m=><li key={m.id}>{m.label} · {m.round}: <PlayerLink name={m.winner}/> beat <PlayerLink name={m.loser}/> {m.score}</li>)}</ul>{!notable.length&&<p className="mt-2 text-gray-500">Notable results appear as matches elsewhere in the draw are recorded.</p>}</details>;
}
