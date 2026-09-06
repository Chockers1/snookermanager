import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
function fixture(){
  const state=createStarterState();state.season='2027/28';state.currentDate='2027-07-01';
  state.player.cash=188275;state.player.rankingLabel='World Ranking';state.player.careerStage='Top 32 Professional';
  Object.assign(state.careerSystems.pro,{hasTourCard:true,yearsRemaining:2,expiresAfterSeason:'2028/29',worldRank:18});
  const shift=(date:string)=>String(Number(date.slice(0,4))+1)+date.slice(4);
  state.tournaments=state.tournaments.map(t=>({...t,startDate:shift(t.startDate),endDate:t.endDate?shift(t.endDate):undefined,entryDeadline:t.entryDeadline?shift(t.entryDeadline):undefined,status:'Available'}));
  const masters=state.tournaments.find(t=>t.name==='Masters');
  if(masters)masters.entryDeadline='2027-06-29';
  const world=state.tournaments.find(t=>t.name==='World Championship')!;
  state.history.tournamentHistory=[{id:'previous-world',season:'2026/27',tournamentId:world.id,tournamentName:world.name,eventType:world.type,stageId:null,tourCircuit:'Main Tour',location:world.location,startDate:'2027-04-17',endDate:'2027-05-03',status:'Completed',result:'Lost in Last 32',rounds:['Last 32'],matchesPlayed:1,wins:0,losses:1,prizeMoney:0,rankingPoints:0,highestBreak:95,centuries:0,fatigueChange:0,entryFee:0,bookedTravelCost:855}];
  state.inbox=[{id:'legacy-season-start',sender:'Career Manager',subject:'2027/28 season started',preview:'The new July-to-June calendar is active. Shanghai Masters is your first eligible event.',date:'Today',priority:'High',read:true,actionLabel:'Open Dashboard',actionRoute:'/'}];
  return state;
}
for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:320,height:568}])test('current season briefing at '+viewport.width+'px',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize(viewport);
  await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(fixture())});
  await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(()=>{history.pushState({},'','/inbox');dispatchEvent(new PopStateEvent('popstate'))});
  const report=page.getByRole('region',{name:'New season briefing'}),body=page.getByTestId('inbox-message-body'),actions=page.getByTestId('inbox-message-actions');
  await expect(report).toBeVisible();
  for(const text of ['Current season briefing','£188,275','Key tournaments','World Championship','Lost in Last 32','No recorded appearance','Entry closed on 2027-06-29'])await expect(report).toContainText(text);
  await expect(actions.getByRole('button',{name:'Plan Season'})).toBeInViewport();
  const dimensions=await body.evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,width:e.clientWidth,scrollWidth:e.scrollWidth}));
  if(viewport.width>=1280)expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.height+1);
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width+1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await body.evaluate(e=>e.scrollTo(0,e.scrollHeight));await expect(report.getByText(/Eligibility can change/)).toBeInViewport();
  await page.screenshot({path:'artifacts/season-start-email-'+viewport.width+'.png'});
  await actions.getByRole('button',{name:'Plan Season'}).click();await expect(page).toHaveURL('/calendar');
  expect(errors).toEqual([]);
});
