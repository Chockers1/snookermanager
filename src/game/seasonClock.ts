import type { GameState } from '../hooks/useGameState';
export type SeasonClock = {firstSeasonYear:number;season:string;firstWeek:number};
const yearOf=(season:string)=>Number(season.slice(0,4));
const day=(date:string)=>Math.floor(Date.parse(date+'T12:00:00Z')/86400000);
export function seasonClockOf(state:GameState):SeasonClock {
  if(state.seasonClock?.season===state.season)return state.seasonClock;
  const year=yearOf(state.season);
  const recordedYears=[...state.history.seasonRecords.map(r=>yearOf(r.season)),...state.history.tournamentHistory.map(r=>yearOf(r.season)),...state.history.snapshots.map(r=>yearOf(r.season)),...Object.values(state.rollingRankings?.events??{}).map(r=>yearOf(r.season))].filter(Number.isFinite);
  const firstSeasonYear=state.seasonClock?.firstSeasonYear??Math.min(year,...recordedYears);
  const lastSettlement=state.careerDepth?.nextSettlementDate ? day(state.careerDepth.nextSettlementDate)-7 : day(state.currentDate);
  const boundary=day(year+'-06-30');
  const settlements=lastSettlement<boundary ? 0 : Math.floor((lastSettlement-boundary)/7)+1;
  return {firstSeasonYear,season:state.season,firstWeek:firstSeasonYear===year ? 1 : Math.max(1,state.week-settlements)};
}
export function ensureSeasonClock(state:GameState):GameState {
  const clock=seasonClockOf(state);
  if(clock===state.seasonClock)return state;
  const season=Math.max(1,yearOf(state.season)-clock.firstSeasonYear+1);
  const inbox=state.inbox.map(message=>{
    const old=/^Week (\d+) report$/.exec(message.subject);
    // The old subject used the following lifetime week. Only relabel periods
    // whose current-season mapping is known; preserve older historical mail.
    const completed=old?Number(old[1])-1:0;
    return old&&completed>=clock.firstWeek?{...message,subject:'Season '+season+' · Week '+(completed-clock.firstWeek+1)+' report'}:message;
  });
  return {...state,seasonClock:clock,inbox};
}
export function seasonPosition(state:GameState) {
  const c=seasonClockOf(state);return {season:Math.max(1,yearOf(state.season)-c.firstSeasonYear+1),week:Math.max(1,state.week-c.firstWeek+1)};
}
export function seasonWeekLabel(state:GameState) {const p=seasonPosition(state);return 'Season '+p.season+' · Week '+p.week;}
export function seasonTitle(state:GameState,season=state.season) {return 'Season '+Math.max(1,yearOf(season)-seasonClockOf(state).firstSeasonYear+1)+' ('+season+')';}
export function rolloverSeasonClock(state:GameState,nextSeason:string):SeasonClock {return {...seasonClockOf(state),season:nextSeason,firstWeek:state.week};}
export function snapshotWeekLabel(snapshot:{season:string;week:number;date:string;seasonNumber?:number;seasonWeek?:number},state:GameState) {
  const clock=seasonClockOf(state),season=snapshot.seasonNumber??Math.max(1,yearOf(snapshot.season)-clock.firstSeasonYear+1);
  const week=snapshot.seasonWeek??(snapshot.season===state.season?Math.max(1,snapshot.week-clock.firstWeek+1):season===1?snapshot.week:Math.max(1,Math.floor((day(snapshot.date)-day(yearOf(snapshot.season)+'-06-30'))/7)+1));
  return 'S'+season+' W'+week;
}
