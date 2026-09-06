import { test, expect, type Page } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
async function open(page: Page) {
  const state = createStarterState(); state.currentDate = '2026-05-11';
  state.tournaments = [
    { ...state.tournaments.find(t => t.name === 'World Championship')!, startDate: '2026-04-28', endDate: '2026-05-04', status: 'Available' as const },
    { ...state.tournaments.find(t => t.id === 'pc-31')!, startDate: '2026-05-05', endDate: '2026-05-07', status: 'Available' as const },
    { ...state.tournaments.find(t => t.id === 'pc-29')!, startDate: '2026-05-05', endDate: '2026-05-08', status: 'Available' as const },
  ];
  state.tournamentProgress = { ...state.tournamentProgress, tournamentId: null, currentRound: null, draw: [], completedRounds: [] };
  await page.addInitScript(({key,save}) => localStorage.setItem(key,save), {key:ACTIVE_SAVE_KEY,save:encodeCareerSave(state)});
  await page.goto('/'); await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(() => {history.pushState({},'', '/calendar');dispatchEvent(new PopStateEvent('popstate'));});
  await page.getByRole('button',{name:'Month view',exact:true}).click();
  await expect(page.getByRole('region',{name:'Month calendar'})).toBeVisible();
}
test('month mode fills the screen, maps multi-day events and opens entry details', async({page}) => {
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:900}); await open(page);
  const calendar=page.getByRole('region',{name:'Month calendar'});
  await expect(calendar.getByRole('button',{name:/World Championship,/})).toHaveCount(2);
  await expect(calendar.locator('time[aria-current=date]')).toHaveAttribute('datetime','2026-05-11');
  const dimensions=await page.locator('#main-content').evaluate(el=>({height:el.clientHeight,scrollHeight:el.scrollHeight,width:el.clientWidth,scrollWidth:el.scrollWidth}));
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.height+1);expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width+1);
  await calendar.getByRole('button',{name:/World Championship,/}).first().click();
  const dialog=page.getByRole('dialog',{name:'Tournament details'});await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading',{name:'World Championship',exact:true})).toBeVisible();
  await expect(dialog.getByText('Entry Requirements', {exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
  await page.screenshot({path:'test-results/month-calendar-desktop.png'});expect(errors).toEqual([]);
});
test('tour and circuit filters combine, and months include empty months and year changes',async({page})=>{
  await open(page);const calendar=page.getByRole('region',{name:'Month calendar'});
  await page.getByLabel('Tour filter',{exact:true}).selectOption('Q Tour');
  await expect(calendar.getByRole('button',{name:/World Championship,/})).toHaveCount(0);
  const options=await page.getByLabel('Specific circuit').locator('option').allTextContents();
  const europe=options.find(o=>/Europe/.test(o))!;await page.getByLabel('Specific circuit').selectOption(europe);
  await expect(calendar.getByRole('button')).toHaveCount(1);
  await page.getByRole('button',{name:'Next month',exact:true}).click();await expect(page.getByText('June 2026',{exact:true})).toBeVisible();
  await expect(page.getByText('No tournaments match this month and tour filter.',{exact:true})).toBeVisible();
  for(let i=0;i<7;i++)await page.getByRole('button',{name:'Next month',exact:true}).click();
  await expect(page.getByText('January 2027',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Today',exact:true}).click();await expect(page.getByText('May 2026',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Previous month',exact:true}).click();await expect(page.getByText('April 2026',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'List view',exact:true}).click();await expect(page.getByRole('region',{name:'Month calendar'})).toHaveCount(0);
});
test('phone month view keeps seven days and event details accessible',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page);
  const calendar=page.getByRole('region',{name:'Month calendar'});
  const width=await page.locator('#main-content').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));expect(width.scroll).toBeLessThanOrEqual(width.client+1);
  await expect(calendar.getByText('Sun',{exact:true})).toBeVisible();
  await calendar.getByRole('button',{name:/World Championship,/}).first().click();
  await expect(page.getByRole('dialog',{name:'Tournament details'})).toBeVisible();
  await page.getByRole('button',{name:'Close tournament details'}).click();
  await page.screenshot({path:'test-results/month-calendar-phone.png'});
});
