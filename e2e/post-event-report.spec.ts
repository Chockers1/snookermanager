import {expect,test} from '@playwright/test';
import {createStarterState} from '../src/hooks/useGameState';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
import type {EventFinancialReport} from '../src/game/eventFinancialReport';
import {financialSummary} from '../src/game/eventFinancialReport';
function fixture(){
  const state=createStarterState(),event=state.tournaments.find(t=>t.name==='World Championship')!;
  state.tournaments=state.tournaments.map(t=>t.id===event.id?{...t,status:'Completed'}:t);
  const finance:EventFinancialReport={tournamentId:event.id,startDate:event.startDate,name:event.name,location:'Crucible Theatre, Sheffield',entry:0,transport:55,hotel:800,nights:5,nightlyRate:160,extraNights:3,combinedTravel:false,preparation:85,venuePractice:35,prize:0,sponsor:0,income:0,costs:975,net:-975};
  state.inbox=[{id:'post-event-layout',sender:'Tournament Office',subject:'Post-event report: World Championship',preview:'Lost in Last 32 after a 8-10 result. Review the performance, ranking and financial outcome below.',date:'Today',priority:'Medium',read:true,actionLabel:'View Completed Draw',actionRoute:'/tournaments/draw?tournament='+event.id,eventFinance:finance,summary:[{label:'Tournament finish',value:'Lost in Last 32',detail:'8-10 against Malik Langford',tone:'negative'},{label:'World Ranking',value:'#18',detail:'No movement'},{label:'Pot success',value:'92%'},{label:'Safety success',value:'77%'},{label:'Highest break',value:'95'},...financialSummary(finance)]}];
  return state;
}
for(const viewport of [{width:1920,height:1080},{width:1280,height:720},{width:390,height:844},{width:320,height:568}])test(`complete post-event costs at ${viewport.width}px`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize(viewport);
  await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(fixture())});
  await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(()=>{history.pushState({},'','/inbox');dispatchEvent(new PopStateEvent('popstate'))});
  const body=page.getByTestId('inbox-message-body'),report=page.getByRole('region',{name:'Post-event report'}),actions=page.getByTestId('inbox-message-actions');
  await expect(report).toBeVisible();await expect(report).toContainText('5 nights × £160 · includes 3 extra nights');await expect(report).toContainText('Venue practice');await expect(report).toContainText('−£975');
  await expect(actions.getByRole('button',{name:'View Completed Draw'})).toBeVisible();await expect(actions).toBeInViewport();
  const dimensions=await body.evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,width:e.clientWidth,scrollWidth:e.scrollWidth}));
  if(viewport.width>=1280)expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.height+1);
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width+1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(viewport.width<768)await expect(page.getByLabel('Select inbox message')).toBeVisible();
  await body.evaluate(e=>e.scrollTo(0,e.scrollHeight));await expect(report.getByText('Net event finances')).toBeInViewport();
  expect(errors).toEqual([]);
});
