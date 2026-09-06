import { createStarterState, type GameState } from '../src/hooks/useGameState';
import { createSeasonTourChanges } from '../src/game/seasonTourChanges';
export function seasonTourChangesFixture() {
  const before=createStarterState();
  const seed=before.worldPlayers.find(p=>p.playerName!==before.player.fullName)!;
  const player=(name:string,age:number,card=false)=>({...structuredClone(seed),id:'news-'+name,playerName:name,nation:'ENG',age,hasTourCard:card,retired:false,retiredSeason:null,seasons:[],titles:0,majorTitles:0,highestWorldRank:null});
  before.worldPlayers=[player('Retiring Champion',49,true),player('Senior Arrival',41,true),player('Q School Graduate',22),player('Q Tour Graduate',23),player('Card Lost',31,true),player('Still Professional',39,true),{...player('Already Retired',55),retired:true,retiredSeason:'2025/26'}];
  const row={...before.competitionTables.senior[0],id:'senior-news',playerName:'Senior Arrival'};
  before.competitionTables.senior=[];
  const after:GameState=structuredClone(before);after.season='2027/28';after.currentDate='2027-07-01';
  const shift=(date:string)=>String(Number(date.slice(0,4))+1)+date.slice(4);
  after.tournaments=after.tournaments.map(t=>({...t,startDate:shift(t.startDate),endDate:t.endDate?shift(t.endDate):undefined,status:'Available'}));
  after.worldPlayers=after.worldPlayers.map(p=>({...p,age:p.age+1}));
  Object.assign(after.worldPlayers[0],{retired:true,retiredSeason:after.season,hasTourCard:false,titles:12,majorTitles:3,highestWorldRank:1});
  after.worldPlayers[1].hasTourCard=false;
  Object.assign(after.worldPlayers[2],{hasTourCard:true,cardSource:'Q School',currentYear:1,expiresAfterSeason:'2028/29'});
  Object.assign(after.worldPlayers[3],{hasTourCard:true,cardSource:'Q Tour'});
  after.worldPlayers[4].hasTourCard=false;
  after.competitionTables.senior=[row];
  for(let i=1;i<=4;i++)after.worldPlayers.push(player('Youth Arrival '+i,14+i));
  after.worldPlayers.push(player('New Q School Contender',24));
  after.competitionTables.qSchool=[{...row,id:'school-news',playerName:'New Q School Contender'}];
  after.tourChangesReport=createSeasonTourChanges(after,before);
  return {before,after};
}
