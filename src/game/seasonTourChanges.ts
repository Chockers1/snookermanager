import type { GameState } from '../hooks/useGameState';
import type { InboxMessage } from '../types/game';

type WorldPlayer = GameState['worldPlayers'][number];
export type TourChangePerson = { id: string; name: string; nation: string; age: number; detail: string };
export type TourChangeSection = { id: string; title: string; people: TourChangePerson[] };
export type SeasonTourChanges = { season: string; previousSeason: string; asOf: string; complete: boolean; sections: TourChangeSection[] };
const previousSeasonOf = (season: string) => (Number(season.slice(0,4))-1)+'/'+season.slice(2,4);
const sectionTitles = [
  ['retirements','Retirements'], ['seniors','Joining the seniors tour'],
  ['qSchool','Q School graduates'], ['promotions','Other new professional cards'],
  ['youth','New youth players'], ['pathway','New pathway players'], ['cardLosses','Players losing tour cards'],
] as const;
const person = (p: WorldPlayer, detail: string): TourChangePerson => ({id:p.id,name:p.playerName,nation:p.nation,age:p.age,detail});
const careerDetail = (p: WorldPlayer) => [p.titles ? p.titles+' career title'+(p.titles===1?'':'s') : 'No career titles',p.highestWorldRank ? 'career-best #'+p.highestWorldRank : ''].filter(Boolean).join(' · ');

/** Compare confirmed transitions; age alone never establishes a seniors move. */
export function createSeasonTourChanges(after: GameState, before?: GameState): SeasonTourChanges {
  const previousSeason=before?.season ?? previousSeasonOf(after.season);
  const previous = new Map((before?.worldPlayers ?? after.worldPlayers.flatMap(p=>{
    const record=p.seasons.find(s=>s.season===previousSeason);
    return record ? [{...p,age:p.age-1,hasTourCard:record.hasTourCard,cardSource:record.cardSource,retired:Boolean(p.retiredSeason && p.retiredSeason < after.season)}] : [];
  })).map(p=>[p.playerName,p]));
  const knownNames=before ? new Set([...before.worldPlayers.map(p=>p.playerName),...Object.values(before.competitionTables).flatMap(rows=>rows.map(r=>r.playerName))]) : new Set(previous.keys());
  const seniors=new Set(after.competitionTables.senior.map(r=>r.playerName));
  const formerSeniors=new Set(before ? before.competitionTables.senior.map(r=>r.playerName) : after.worldPlayers.filter(p=>p.seasons.find(s=>s.season===previousSeason)?.seniorRank!=null).map(p=>p.playerName));
  const qSchool=new Set(after.competitionTables.qSchool.map(r=>r.playerName));
  const qTour=new Set(after.competitionTables.qTour.map(r=>r.playerName));
  const sections: TourChangeSection[]=sectionTitles.map(([id,title])=>({id,title,people:[]}));
  const add=(id:string,p:WorldPlayer,detail:string)=>sections.find(s=>s.id===id)!.people.push(person(p,detail));
  const players=after.worldPlayers.filter(p=>p.playerName!==after.player.fullName && !/^Qualifier \d+$/i.test(p.playerName));
  // Lead with established careers and the strongest incoming prospects; ties are stable.
  players.sort((a,b)=>b.majorTitles-a.majorTitles || b.titles-a.titles || (a.highestWorldRank??999)-(b.highestWorldRank??999) || (b.developmentPotential??0)-(a.developmentPotential??0) || a.playerName.localeCompare(b.playerName));
  for(const p of players) {
    const old=previous.get(p.playerName);
    if(p.retired) {
      if(before ? old && !old.retired : p.retiredSeason===after.season) add('retirements',p,careerDetail(p));
      continue;
    }
    if(p.age>=40 && !p.hasTourCard && seniors.has(p.playerName) && !formerSeniors.has(p.playerName) && old) add('seniors',p,(old.hasTourCard?'Leaves the main tour for seniors':'New to the seniors field')+' · '+careerDetail(p));
    const newcomer=before ? !knownNames.has(p.playerName) : p.id.startsWith('recruit-'+after.season.slice(0,4)+'-');
    const qSchoolRenewal=p.cardSource==='Q School' && p.currentYear===1 && old?.hasTourCard && (old.cardSource!=='Q School' || old.expiresAfterSeason!==p.expiresAfterSeason);
    if(p.hasTourCard && (qSchoolRenewal || (old ? !old.hasTourCard : before && newcomer))) {
      const returning=p.seasons.some(s=>s.season<previousSeason && s.hasTourCard);
      add(p.cardSource==='Q School'?'qSchool':'promotions',p,(qSchoolRenewal?'Requalifies via ':returning?'Returns via ':'Tour card via ')+(p.cardSource??'recorded qualification'));
    }
    if(newcomer && !p.hasTourCard) {
      if(p.age<=21) add('youth',p,'New under-21 prospect');
      else if(p.age<40) add('pathway',p,qSchool.has(p.playerName)?'Joins the Q School field':qTour.has(p.playerName)?'Joins the Q Tour field':'New amateur / qualifying-pathway player');
    }
    if(old?.hasTourCard && !p.hasTourCard) add('cardLosses',p,seniors.has(p.playerName)&&p.age>=40?'Continues on the seniors tour':'Returns to the amateur / qualifying pathway');
  }
  return {season:after.season,previousSeason,asOf:after.currentDate,complete:Boolean(before),sections};
}
export function tourChangesMessage(report: SeasonTourChanges): InboxMessage {
  const count=(id:string)=>report.sections.find(s=>s.id===id)?.people.length ?? 0;
  return {id:'tour-changes:'+report.season,sender:'Tour Newsdesk',subject:report.season+' · Changes around the tour',preview:(report.complete?'':'From retained records: ')+count('retirements')+' retirements · '+count('seniors')+' seniors arrivals · '+count('qSchool')+' Q School graduates · '+count('youth')+' youth arrivals. Review the names and other pathway changes.',date:report.asOf,priority:'Medium',read:false,actionLabel:'View Rankings',actionRoute:'/rankings',tourChangesReport:report};
}
export function announceSeasonTourChanges(state: GameState): GameState {
  if(state.seasonReview?.pending || state.tourChangesAnnouncedSeason===state.season) return state;
  if(state.inbox.some(m=>m.id==='tour-changes:'+state.season)) return {...state,tourChangesAnnouncedSeason:state.season};
  let report=state.tourChangesReport?.season===state.season ? state.tourChangesReport : undefined;
  if(!report) {
    const previousSeason=previousSeasonOf(state.season);
    const hasPrevious=state.history.seasonRecords.some(s=>s.season===previousSeason) || state.worldPlayers.some(p=>p.seasons.some(s=>s.season===previousSeason));
    if(!hasPrevious) return state;
    report=createSeasonTourChanges(state);
  }
  const inbox=[tourChangesMessage(report),...state.inbox].slice(0,18);
  const unread=Math.min(99,inbox.filter(m=>!m.read).length);
  return {...state,tourChangesReport:report,tourChangesAnnouncedSeason:state.season,inbox,player:{...state.player,inboxCount:unread,notificationCount:unread}};
}
