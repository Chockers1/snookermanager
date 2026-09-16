import {expect,test,type Page} from '@playwright/test';
import {createNewCareerState,createStarterState,getNextEligibleTournament,type NewCareerConfig} from '../src/hooks/useGameState';
import {cueMarketplaceCatalog,chalkCatalog,tipCatalog} from '../src/data/catalogs';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
import {readCareerSave} from './read-career-save';
const navigate=(page:Page,path:string)=>page.evaluate(path=>{history.pushState({},'',path);dispatchEvent(new PopStateEvent('popstate'))},path);
for(const [startingLevelId,age] of [['start-club-junior',12],['start-rookie-pro',18]] as const)test('unboosted first-week guide reaches a recorded match: '+startingLevelId,async({page})=>{
 test.setTimeout(180000);page.setDefaultTimeout(15000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const state=createNewCareerState({startingLevelId,age,fullName:'First Week Player',nationality:'England'} as NewCareerConfig);
 await page.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,value)},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 const guide=page.getByRole('region',{name:'First week guide'});
 await guide.getByRole('link',{name:'Open training',exact:true}).click();await page.getByRole('button',{name:'Apply Plan',exact:true}).click();await page.getByRole('button',{name:'Open first-week guide',exact:true}).click();
 await guide.getByRole('list',{name:'Six first-week steps'}).getByRole('button',{name:/Check your match equipment/}).click();
 await guide.getByRole('link',{name:'Check equipment',exact:true}).click();
 const cue=[...cueMarketplaceCatalog].sort((a,b)=>a.price-b.price)[0];
 await page.getByRole('button').filter({has:page.getByRole('heading',{name:cue.name,exact:true})}).click();
 await page.getByRole('button',{name:/Buy Cue -/}).click();
 await page.getByRole('tablist',{name:'Equipment categories'}).getByRole('tab',{name:'Chalk',exact:true}).click();
 const chalk=[...chalkCatalog].sort((a,b)=>a.cost-b.cost)[0];await page.getByRole('button').filter({has:page.getByRole('heading',{name:chalk.name,exact:true})}).click();await page.getByRole('button',{name:/Buy chalk pack/}).click();
 await page.getByRole('tablist',{name:'Equipment categories'}).getByRole('tab',{name:'Tips',exact:true}).click();
 const tip=[...tipCatalog].sort((a,b)=>a.cost-b.cost)[0];await page.getByRole('button').filter({has:page.getByRole('heading',{name:tip.name,exact:true})}).click();await page.getByRole('button',{name:'Buy Tip',exact:true}).click();
 await page.getByRole('button',{name:'Open first-week guide',exact:true}).click();await expect(guide.getByRole('list',{name:'Six first-week steps'}).getByRole('button',{name:/Check your match equipment Completed/})).toBeVisible();
 await expect(guide).toContainText('Choose and enter an event');
 const equipped=await readCareerSave(page);const event=getNextEligibleTournament(equipped)!;expect(event).toBeTruthy();
 await guide.getByRole('link',{name:'Open calendar',exact:true}).click();await navigate(page,'/calendar?tournament='+event.id);
 await page.getByRole('button',{name:'Enter Tournament',exact:true}).click();
 await page.getByRole('dialog',{name:'Tournament details'}).getByRole('button',{name:/Close/}).click();
 await page.getByRole('button',{name:'Open first-week guide',exact:true}).click();await expect(guide).toContainText('Arrange travel and accommodation');await guide.getByRole('link',{name:'Open travel',exact:true}).click();
 await page.getByRole('button',{name:'Confirm Travel',exact:true}).click();await page.getByRole('button',{name:'Confirm plan',exact:true}).click();
 await page.getByRole('button',{name:'Open first-week guide',exact:true}).click();await guide.getByRole('link',{name:'Open Tournament Hub',exact:true}).click();
 await expect(page).toHaveURL('/tournaments/hub');await expect(page.getByText('Next Match ·',{exact:false}).first()).toBeVisible();
 const advance=page.getByRole('button',{name:'Advance to Tournament',exact:true});if(await advance.isVisible())await advance.click();
 await page.getByRole('button',{name:'Quick Sim',exact:true}).click();await expect(page.getByRole('heading',{name:'Match Review',exact:true})).toBeVisible();
 const completed=await readCareerSave(page);expect(completed.firstWeekGuide?.completed).toHaveLength(6);expect(completed.history.matchLog.length).toBeGreaterThan(0);expect(errors).toEqual([]);
 await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();expect((await readCareerSave(page)).firstWeekGuide?.completed).toHaveLength(6);
});
for(const [width,zoom] of [[390,1],[1280,2]] as const)test('long names and large text stay usable at '+width+' with layout zoom '+zoom,async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:width/zoom,height:900/zoom});
 const state=createStarterState();state.player.fullName='Alexander Montgomery-Worthington-Smythe';
 await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await readCareerSave(page);
 await navigate(page,'/settings');await page.getByLabel('Text size',{exact:true}).selectOption('130');await page.getByLabel('Higher text contrast').check();await page.getByRole('tab',{name:'Controls',exact:true}).click();await page.getByLabel('Enable keyboard navigation shortcuts').check();
 // A half-width CSS viewport approximates 200% browser zoom reflow; OS/browser zoom remains a manual check.
 for(const route of ['/','/calendar','/rankings','/player/attributes','/inbox','/training','/tournaments/hub','/tournaments/draw','/finance','/saves']){
  await navigate(page,route);await expect(page.locator('#main-content')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),route).toBe(true);
  const broken=await page.locator('#main-content button').evaluateAll(buttons=>buttons.filter(el=>{const box=el.getBoundingClientRect(),style=getComputedStyle(el);return box.width>0&&box.height>0&&el.scrollWidth>el.clientWidth+3&&!['auto','scroll','hidden'].includes(style.overflowX)}).map(el=>el.textContent));
  expect(broken,route+' overflowing controls').toEqual([]);
 }
 await page.keyboard.press('Alt+Shift+KeyT');await expect(page).toHaveURL('/training');await expect(page.getByRole('heading',{name:'Weekly Timetable',exact:true})).toBeVisible();await page.screenshot({path:'artifacts/release-readiness-2026-09-08/large-text-'+width+'.png',fullPage:true});expect(errors).toEqual([]);
});
