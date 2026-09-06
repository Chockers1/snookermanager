import { expect, test, type Page } from '@playwright/test';
import { createStarterState, repairGameState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';
import { depthOf, plusDays } from '../src/game/careerDepth/shared';
import { evolveTourSkills } from '../src/game/tourDevelopment';
async function open(page:Page,state:ReturnType<typeof createStarterState>,route:string){
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('expansion-fixture')){localStorage.clear();localStorage.setItem(key,value);sessionStorage.setItem('expansion-fixture','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
  await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(route=>{history.pushState({},'',route);dispatchEvent(new PopStateEvent('popstate'))},route);
}
for(const width of [1280,390])test(`planning board priority, protected rest and entry details work at ${width}px`,async({page})=>{
  const state=createStarterState();state.trainingAppliedWeek=null;
  state.tournaments[0]={...state.tournaments[0],startDate:state.currentDate,endDate:plusDays(state.currentDate,2),status:"Available"};
  await page.setViewportSize({width,height:width===390?844:720});await open(page,state,'/calendar');
  await page.getByRole('button',{name:'Planning board',exact:true}).click();
  const board=page.getByRole('region',{name:'Season planning board'});await expect(board).toBeVisible();
  const priority=board.getByRole('button',{name:/Prioritise /}).first();await priority.click();await expect(priority).toHaveAttribute('aria-pressed','true');
  await page.getByLabel('Block start date').fill(state.currentDate);await page.getByLabel('Block type').selectOption('rest');await page.getByRole('button',{name:'Reserve week',exact:true}).click();
  await expect(board.getByRole('status')).toContainText('rest week reserved');
  const saved=await readCareerSave(page);expect(saved.careerDepth?.board?.priorities).toHaveLength(1);expect(saved.careerDepth?.board?.blocks).toHaveLength(1);
  const event=state.tournaments.find(t=>t.id===saved.careerDepth!.board!.priorities[0])!;
  await board.getByRole('button',{name:event.name,exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('region',{name:'Entry dates'})).toContainText('Ranking selection');
  await page.getByRole('button',{name:'Close tournament details'}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();
  expect((await readCareerSave(page)).careerDepth?.board).toEqual(saved.careerDepth?.board);
  await page.evaluate(()=>{history.pushState({},'','/training');dispatchEvent(new PopStateEvent('popstate'))});
  await expect(page.locator('p:visible').filter({hasText:'Planned rest week'}).first()).toBeVisible();
  await expect(page.getByRole('combobox',{name:/Morning/}).first()).toBeDisabled();
  await expect(page.getByRole('combobox',{name:/Morning/}).first()).toHaveValue('rest');
});
test('achievement goals and monthly tour reports show persisted evidence',async({page})=>{
  let state=createStarterState();state=evolveTourSkills(state);state=evolveTourSkills({...state,currentDate:plusDays(state.currentDate,40)});
  state.careerDepth={...depthOf(state),achievements:[{id:'century',date:state.currentDate,evidence:'Recorded break of 109.'}]};state=repairGameState(state);
  await open(page,state,'/career/stats');
  const goals=page.getByRole('region',{name:'Career achievement goals'});await expect(goals).toContainText('Recorded break of 109.');
  await page.evaluate(()=>{history.pushState({},'','/rankings');dispatchEvent(new PopStateEvent('popstate'))});
  await page.locator('summary').filter({hasText:'Tour development · prospects, veterans and rivals'}).click();
  await expect(page.getByText(/Practice focus:/).first()).toBeVisible();
});
