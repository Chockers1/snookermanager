import {expect,test} from '@playwright/test';
import {createStarterState} from '../src/hooks/useGameState';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
import {ACCESSIBILITY_KEY} from '../src/game/accessibility';
for (const [width,height,scale] of [[1920,1080,100],[1366,768,130],[1280,720,100],[390,844,100]]) test(`calendar workspace fits at ${width} and ${scale}%`,async({page})=>{
 const state=createStarterState();state.currentDate='2026-05-11';state.seasonReview=null;
 state.firstWeekGuide={version:1,dismissed:true,completed:[],skipped:[]};
 state.tournaments=state.tournaments.map((event,index)=>index<5?{...event,startDate:`2026-05-${String(12+index*3).padStart(2,'0')}`,endDate:`2026-05-${String(14+index*3).padStart(2,'0')}`,status:'Available'}:event);
 state.tournaments.push({...state.tournaments[0],id:'six-week-layout',name:'August layout tournament',startDate:'2026-08-01',endDate:'2026-08-31',status:'Available'});
 await page.setViewportSize({width,height});const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({key,value,accessibility,scale})=>{localStorage.setItem(key,value);localStorage.setItem(accessibility,JSON.stringify({textScale:scale,reducedMotion:true}));},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state),accessibility:ACCESSIBILITY_KEY,scale});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
 await page.evaluate(()=>{history.pushState({},'','/calendar');dispatchEvent(new PopStateEvent('popstate'))});
 const fits=async()=>expect(await page.locator('main').evaluate(el=>el.scrollHeight<=el.clientHeight+2&&el.scrollWidth<=el.clientWidth+2)).toBe(true);
 const calendar=page.getByRole('region',{name:'Month calendar'});await expect(calendar).toBeVisible();await fits();
 for(const week of await calendar.getByRole('group').all()){const first=week.getByRole('button').first();if(await first.count()){const area=await week.boundingBox(),bar=await first.boundingBox();expect(bar!.height).toBeGreaterThanOrEqual(22);expect(bar!.y+bar!.height).toBeLessThanOrEqual(area!.y+area!.height+1);}}
 await page.screenshot({path:`artifacts/calendar-redesign-${width}-month.png`});
 await page.getByLabel('Find an event',{exact:true}).fill(state.tournaments[0].name);
 const event=calendar.getByRole('button',{name:new RegExp(state.tournaments[0].name+',')}).first();await event.click();
 await expect(page.getByRole('dialog',{name:'Tournament details'}).getByRole('heading',{name:state.tournaments[0].name,exact:true})).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByLabel('Find an event',{exact:true}).fill('nonexistent-event');await expect(page.getByText('No tournaments match this month and tour filter.',{exact:true})).toBeVisible();await fits();
 await page.getByRole('button',{name:'Reset filters',exact:true}).click();
 await page.getByRole('button',{name:'List view',exact:true}).click();await fits();
 await page.getByLabel('Find an event',{exact:true}).fill(state.tournaments[0].name);await expect(page.locator('tbody tr')).toHaveCount(1);
 await page.getByRole('region',{name:'Tournament list'}).getByRole('button',{name:state.tournaments[0].name,exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Entry Requirements');await page.keyboard.press('Escape');
 await page.getByLabel('Find an event',{exact:true}).fill('');await page.screenshot({path:`artifacts/calendar-redesign-${width}-list.png`});
 for(const mode of ['Planning board','Commitments']){await page.getByRole('button',{name:mode,exact:true}).click();await fits();await page.screenshot({path:`artifacts/calendar-redesign-${width}-${mode.replaceAll(' ','-')}.png`});}
 await page.getByRole('button',{name:'Month view',exact:true}).click();
 await page.getByLabel('Event status',{exact:true}).selectOption('Completed');await expect(calendar.getByRole('button')).toHaveCount(0);
 await page.getByLabel('Event status',{exact:true}).selectOption('All statuses');
 await page.getByRole('button',{name:'Next month',exact:true}).click();await expect(page.getByText('June 2026',{exact:true})).toBeVisible();await fits();
 await page.getByRole('button',{name:'Today',exact:true}).click();await expect(page.getByText('May 2026',{exact:true})).toBeVisible();
 for(let month=0;month<3;month++)await page.getByRole('button',{name:'Next month',exact:true}).click();
 await expect(page.getByText('August 2026',{exact:true})).toBeVisible();await expect(calendar.getByRole('group')).toHaveCount(6);await fits();
 for(const week of await calendar.getByRole('group').all()){const event=week.getByRole('button',{name:/August layout tournament/});await event.scrollIntoViewIfNeeded();const bar=await event.boundingBox();const area=await week.boundingBox();expect(bar!.y+bar!.height).toBeLessThanOrEqual(area!.y+area!.height+1);const day=await week.locator('..').locator('time').first().boundingBox();expect(bar!.y).toBeGreaterThanOrEqual(day!.y+day!.height);}
 await page.getByRole('button',{name:'Today',exact:true}).click();await page.screenshot({path:`artifacts/calendar-redesign-${width}-month.png`});
 await page.getByRole('button',{name:'Month view',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('button',{name:'List view',exact:true})).toHaveAttribute('aria-pressed','true');
 expect(errors).toEqual([]);
});
