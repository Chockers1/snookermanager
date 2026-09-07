import { playerDecline, annualDecline, ensurePlayerDeclines, type DeclineProfile } from './playerAgeing';
import type { GameState, CompetitionTableRow } from '../hooks/useGameState';
import type { Tournament, BracketRound } from '../types/game';
import { resolveTournamentFormat } from '../data/tournamentFormats';
import { pathwayEntryReason, pathwayAgeLimit } from './pathwayRules';
import { countsForWorldRanking, isAttachedQualifying } from './rollingRankings';
import { championshipEarnings, isChampionshipLeague } from './championshipLeague';

type WorldPlayer = GameState['worldPlayers'][number];
const hash = (text: string) => [...text].reduce((n,c) => Math.imul(n ^ c.charCodeAt(0),16777619) >>> 0,2166136261);
const first = 'Adam Ben Callum Daniel Elias Finn Gabriel Harry Isaac Jacob Kai Leo Max Nathan Oliver Pavel Quinn Rafael Sam Theo Umar Victor William Xavier Yusuf Zane Aaron Bruno Connor Dylan Emil Felix Gareth Hugo Ivan Jasper Kian Louis Mika Noah Oscar Patrick Reuben Sacha Tomas'.split(' ');
const last = 'Abbott Bennett Carter Davies Ellis Foster Green Hayes Irving Jones Khan Lewis Morgan Novak Olsen Patel Quinn Rossi Shaw Turner Usman Varga Walker Xu Young Zimmer Anders Brown Chen Dubois Evans Fraser Garcia Hall Iversen Janssen Kovacs Langford Mercer Nakamura Ortega Petrov Reed Silva Tanaka Urban Vos Westbrook Yates'.split(' ');

/** Ability ages independently of success. Practice slows, but never cancels, veteran decline. */
export function annualCpuDevelopment(age: number, rating: number, potential: number, name: string, profile: DeclineProfile = playerDecline({id:name})) {
  const pace = .85 + (hash(name) % 31) / 100;
  if (age >= profile.startAge) return -annualDecline(age,profile);
  const headroom = Math.max(0,potential-rating);
  return Math.min(headroom, age <= 23 ? 2.2*pace : age <= 28 ? 1.1*pace : age <= 34 ? .25*pace : 0);
}

/** A copied row is not a second performance. Keep the most complete version, never sum copies. */
export function uniqueRankingRows<T extends CompetitionTableRow>(rows: T[]): T[] {
  const byName = new Map<string,T>();
  for (const row of rows) {
    if (/^(Qualifier \d+|Tour Player \d+)$/.test(row.playerName)) continue;
    const old=byName.get(row.playerName);
    if (!old || row.eventsPlayed > old.eventsPlayed || row.eventsPlayed === old.eventsPlayed && row.points > old.points) byName.set(row.playerName,row);
  }
  return [...byName.values()];
}

/** Maintain eligible regional and age cohorts before the season's draws are selected.
 * Recruits are durable profiles; the same individual ages, develops and retires normally. */
export function ensureWorldPopulation(state: GameState): GameState {
  state = ensurePlayerDeclines(state);
  if (state.worldPopulationSeason === state.season) return state;
  const players = [...state.worldPlayers];
  const names = new Set(players.map(p=>p.playerName));
  const seasonYear=Number(state.season.slice(0,4));
  let serial=0;
  for (const t of state.tournaments) {
    if (!['Junior','Regional Youth','National Youth','Amateur','Q Tour','Q School','Senior'].includes(t.type)) continue;
    const needed=(resolveTournamentFormat(t).fieldSize ?? 32)+(t.type==='Q School'?24:0);
    const eligible=(p:WorldPlayer)=>p.playerName!==state.player.fullName && !pathwayEntryReason(t,{ name:p.playerName,nation:p.nation,age:p.age,hasTourCard:p.hasTourCard,retired:p.retired });
    const deficit=Math.max(0,needed-players.filter(eligible).length);
    for(let i=0;i<deficit;i++) {
      const n=hash(state.worldSeed+':'+seasonYear+':'+t.id+':'+serial++);
      let name='';
      for(let attempt=0;attempt<100000;attempt++) {
        const k=(n+attempt)>>>0;
        name=first[k%first.length]+' '+(attempt<first.length*last.length?'':first[Math.floor(k/(first.length*last.length))%first.length]+' ')+last[Math.floor(k/first.length)%last.length];
        if(!names.has(name)) break;
      }
      if(names.has(name)) throw new Error('Unique recruit name space exhausted');
      const limit=pathwayAgeLimit(t);
      const age=limit ? Math.max(12,limit-4+n%3) : t.type==='Senior'?40+n%8:18+n%12;
      const nations=['ENG','CHN','THA','AUS','KSA','QAT','UAE','CAN','BRA','RSA','EGY','FRA'];
      const nation=nations.find(nation=>!pathwayEntryReason(t,{name,nation,age,hasTourCard:false}));
      if(!nation) throw new Error('No eligible recruit region for '+t.name);
      const potential=72+n%26;
      players.push({id:'recruit-'+seasonYear+'-'+n+'-'+serial,playerName:name,nation,age,hasTourCard:false,cardSource:null,currentYear:0,yearsRemaining:0,expiresAfterSeason:null,retainedViaRanking:false,tourSurvivalStatus:'Amateur',totalMatches:0,wins:0,losses:0,totalPrizeMoney:0,titles:0,majorTitles:0,qTourWins:0,seniorTitles:0,highestBreak:0,highestWorldRank:null,overallRating:Math.min(potential,age<18?46+n%18:58+n%23),developmentPotential:potential,coachQuality:45+n%25,equipmentQuality:50+n%25,trainingLoad:60,fatigue:20,retired:false,retiredSeason:null,seasons:[]});
      names.add(name);
    }
  }
  return ensurePlayerDeclines({...state,worldPlayers:players,worldPopulationSeason:state.season});
}

type Evidence={matches:number;wins:number;losses:number;draws:number;titles:number;majors:number;prize:number;highestBreak:number;centuries:number;breakMatches:number;proEvents:number;proWins:number;proLosses:number;qTourTitles:number;seniorTitles:number};
export function cpuSeasonEvidence(state:GameState, award:(t:Tournament,round:string,champion:boolean)=>{prizeMoney:number}) {
  const result=new Map<string,Evidence>();
  const get=(name:string)=>{let r=result.get(name);if(!r){r={matches:0,wins:0,losses:0,draws:0,titles:0,majors:0,prize:0,highestBreak:0,centuries:0,breakMatches:0,proEvents:0,proWins:0,proLosses:0,qTourTitles:0,seniorTitles:0};result.set(name,r);}return r;};
  for(const e of Object.values(state.rollingRankings?.events ?? {})) {
    if(e.season!==state.season) continue;
    const t=state.tournaments.find(t=>t.id===e.tournamentId);
    if(!t) continue;
    const pro=countsForWorldRanking(t)||t.type==='Major'||t.type==='Invitational';
    const title=t.type!=='Q School'&&t.type!=='Exhibition'&&!/qualif(?:ier|ication|ying)|play[ -]?off/i.test(t.name);
    const major=title&&(t.type==='Major'||/^(world championship|uk championship|uk major|masters|tour championship|champion of champions)$/i.test(t.name));
    const finishes=new Map<string,{round:string;winner:boolean}>();
    for(const round of e.bracket) for(const m of round.matches) {
      if(typeof m.top.score!=='number'||typeof m.bottom.score!=='number'||m.placeholder) continue;
      for(const [p,other,breaks] of [[m.top,m.bottom,m.topBreaks],[m.bottom,m.top,m.bottomBreaks]] as const) {
        if(p.name==='TBD'||/^Qualifier \d+$/.test(p.name)) continue;
        const r=get(p.name),won=p.score!>other.score!,lost=p.score!<other.score!;
        r.matches++;r.wins+=Number(won);r.losses+=Number(lost);r.draws+=Number(!won&&!lost);
        if(pro){r.proWins+=Number(won);r.proLosses+=Number(lost);}
        if(breaks){r.breakMatches++;r.highestBreak=Math.max(r.highestBreak,...breaks,0);r.centuries+=breaks.filter(b=>b>=100).length;}
        const champion=round.label==='Final'&&won;
        if(champion&&title){r.titles++;r.majors+=Number(major);r.qTourTitles+=Number(t.type==='Q Tour');r.seniorTitles+=Number(t.type==='Senior');}
        finishes.set(p.name,{round:round.label,winner:champion});
      }
    }
    for(const [name,finish] of finishes) {
      const r=get(name);r.proEvents+=Number(pro);
      r.prize+=e.prizeAwards?.[name] ?? (isChampionshipLeague(t)?championshipEarnings(e.bracket,name):isAttachedQualifying(t)&&finish.winner?0:award(t,finish.round,finish.winner).prizeMoney);
    }
  }
  return result;
}

/** Secondary simulation stream records breaks without changing the draw's outcome stream. */
export function withCpuBreakRecords(bracket:BracketRound[],eventKey:string,players:WorldPlayer[],human:string):BracketRound[] {
  const ratings=new Map(players.map(p=>[p.playerName,p.overallRating??65]));
  return bracket.map(round=>({...round,matches:round.matches.map(m=>{
    if(typeof m.top.score!=='number'||typeof m.bottom.score!=='number'||m.placeholder) return m;
    const breaks=(name:string,won:number,lost:number)=>{
      let seed=hash(eventKey+':'+m.id+':'+name);const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const rating=ratings.get(name)??65;
      return Array.from({length:won+lost},(_,i)=>{
        const century=i<won&&random()<Math.max(.005,(rating-55)/400);
        return century?100+Math.floor(random()*41):Math.round((i<won?25:0)+random()*(i<won?70:55));
      });
    };
    // Human detailed match logs remain authoritative for their own records.
    return {...m,topBreaks:m.topBreaks??(m.top.name===human?undefined:breaks(m.top.name,m.top.score,m.bottom.score)),bottomBreaks:m.bottomBreaks??(m.bottom.name===human?undefined:breaks(m.bottom.name,m.bottom.score,m.top.score))};
  })}));
}

/** Repair only conclusions supported by surviving records; never fabricate old shot data. */
export function repairCpuHistoricalRecords(state:GameState):GameState {
  const majors=new Map<string,number>(), breaks=new Map<string,number>();
  for(const e of Object.values(state.rollingRankings?.events??{})) {
    if(e.season===state.season) continue;
    const t=state.tournaments.find(t=>t.id===e.tournamentId);
    const major=(t?.type==='Major'||/^(world championship|uk championship|uk major|masters|tour championship|champion of champions)$/i.test(e.name))&&!/qualif/i.test(e.name);
    for(const r of e.bracket)for(const m of r.matches){
      if(major&&r.label==='Final'&&typeof m.top.score==='number'&&typeof m.bottom.score==='number'&&m.top.score!==m.bottom.score){const name=m.top.score>m.bottom.score?m.top.name:m.bottom.name;majors.set(name,(majors.get(name)??0)+1);}
      for(const [p,b] of [[m.top,m.topBreaks],[m.bottom,m.bottomBreaks]] as const)if(b)breaks.set(p.name,Math.max(breaks.get(p.name)??0,...b));
    }
  }
  return {...state,worldPlayers:state.worldPlayers.map(p=>p.playerName===state.player.fullName?p:{...p,totalMatches:Math.max(p.totalMatches,p.wins+p.losses),majorTitles:Math.max(p.majorTitles,majors.get(p.playerName)??0),highestBreak:Math.max(p.highestBreak,breaks.get(p.playerName)??0),seasons:p.seasons.map(s=>({...s,matches:Math.max(s.matches,s.wins+s.losses)})),...(/^Qualifier \d+$/.test(p.playerName)?{retired:true,hasTourCard:false,yearsRemaining:0}: {})})};
}
