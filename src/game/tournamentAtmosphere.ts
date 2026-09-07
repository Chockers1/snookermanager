import type { GameState } from '../hooks/useGameState';
import type { Tournament, BracketRound } from '../types/game';
import { recordedMajorQualifiers } from './rollingRankings';
export type MatchAtmosphere = { name: string; tone: 'theatre'|'lively'|'club'|'tour'; defendingChampion?: string; locals: string[]; qualifiers: string[]; description: string };
export function eventAtmosphere(state: GameState, event: Tournament): MatchAtmosphere {
 const earlier=Object.values(state.rollingRankings?.events??{}).filter(e=>e.tournamentId===event.id&&e.applied&&e.completedOn<event.startDate&&e.completedOn<=state.currentDate).sort((a,b)=>b.completedOn.localeCompare(a.completedOn))[0];
 const final=earlier?.bracket.slice().reverse().find(r=>/^final$/i.test(r.label))?.matches[0];
 const defendingChampion=earlier?.outcomes?.find(o=>o.finish==='Winner')?.player??(final&&typeof final.top.score==='number'&&typeof final.bottom.score==='number'&&final.top.score!==final.bottom.score?(final.top.score>final.bottom.score?final.top.name:final.bottom.name):undefined);
 const location=event.location;
 const nation=/sheffield|leicester|london|york|brentwood|manchester|bournemouth|cheltenham|telford|wolverhampton|blackpool|barnsley/i.test(location)?'ENG':/belfast/i.test(location)?'NIR':/edinburgh|glasgow/i.test(location)?'SCO':/cardiff|llandudno|newport/i.test(location)?'WAL':/shanghai|beijing|wuhan|yushan|nanjing|xi.an|dalian|china/i.test(location)?'CHN':/berlin|oberhausen/i.test(location)?'GER':/dublin/i.test(location)?'IRL':undefined;
 const locals=state.worldPlayers.filter(p=>nation&&p.nation===nation).map(p=>p.playerName);
 const humanNation:Record<string,string>={England:'ENG',Scotland:'SCO',Wales:'WAL','Northern Ireland':'NIR',China:'CHN',Germany:'GER',Ireland:'IRL'};
 if(nation&&humanNation[state.player.nationality]===nation&&!locals.includes(state.player.fullName))locals.push(state.player.fullName);
 const tone=/shoot out/i.test(event.name)||event.type==='Exhibition'?'lively':/world championship$/i.test(event.name)?'theatre':['Junior','Regional Youth','National Youth','Amateur','Q Tour','Q School'].includes(event.type)?'club':'tour';
 const description=tone==='lively'?'A lively crowd greets bold pots and dramatic finishes.':tone==='theatre'?'A hushed arena, long sessions and applause that breaks the tension.':event.type==='Senior'?'Familiar names, appreciative applause and experienced match play.':tone==='club'?'Close spectators and every frame feeling like a step towards the next level.':'The arena settles as the players prepare; momentum builds with each big break.';
 // Only published qualifying results can identify a qualifier.
 const published={...state,rollingRankings:state.rollingRankings?{...state.rollingRankings,events:Object.fromEntries(Object.entries(state.rollingRankings.events).filter(([,e])=>e.applied&&e.completedOn<=state.currentDate))}:undefined};
 return {name:event.name,tone,defendingChampion,locals,qualifiers:recordedMajorQualifiers(published,event)??[],description};
}
export function matchWalkout(atmosphere: MatchAtmosphere, names: string[]) {
 return [atmosphere.description,...names.flatMap(name=>[
  ...(name===atmosphere.defendingChampion?[name+' begins another match as the defending champion.']:[]),
  ...(atmosphere.qualifiers.includes(name)?[name+' earned this place through qualifying.']:[]),
  ...(atmosphere.locals.includes(name)?['The home crowd gives '+name+' a warm reception.']:[]),
 ])].join(' ');
}
export function crowdReaction(atmosphere: MatchAtmosphere|undefined, name:string, moment:'century'|'decider'|'comeback') {
 if(!atmosphere)return '';
 if(moment==='century')return atmosphere.tone==='lively'?'The crowd roars its approval of the century!':atmosphere.locals.includes(name)?'A long round of applause for the home favourite’s century.':'The crowd applauds the century before settling again.';
 if(moment==='decider')return atmosphere.tone==='club'?'Spectators gather closer for the deciding frame.':'Applause gives way to a tense hush for the decider.';
 return 'The crowd responds as the match turns around.';
}
export function notableDrawMatches(rounds:BracketRound[], human:string) {
 return rounds.flatMap(r=>r.matches.flatMap(m=>{
  if([m.top.name,m.bottom.name].includes(human)||typeof m.top.score!=='number'||typeof m.bottom.score!=='number'||m.top.score===m.bottom.score)return [];
  const winner=m.top.score>m.bottom.score?m.top:m.bottom,loser=winner===m.top?m.bottom:m.top;
  const upset=winner.rank>0&&loser.rank>0&&winner.rank-loser.rank>=16;
  const close=(winner.score ?? 0) >= 2 && (winner.score ?? 0) - (loser.score ?? 0) === 1;
  if(!upset&&!close&&!/^final$/i.test(r.label))return [];
  return [{id:m.id,round:r.label,winner:winner.name,loser:loser.name,score:winner.score+'–'+loser.score,label:upset?'Seed upset':close?'Deciding-frame finish':'Champion confirmed'}];
 })).reverse().slice(0,4);
}
