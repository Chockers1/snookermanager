import { expect, test } from '@playwright/test';
import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';
import { depthOf, plusDays } from '../src/game/careerDepth/shared';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const width of [1280, 390]) test(`Wuhan preparation opens its hub before advancement and match preview at ${width}`, async ({page}) => {
  let state=createStarterState(); state.player.cash=100000;
  const event=state.tournaments.find(t=>t.name==='Wuhan Open')!;
  state=bookTravelState(enterTournamentState(state,event.id),event.id);
  state.currentDate=plusDays(event.startDate,-1);
  if(state.firstWeekGuide) state.firstWeekGuide.dismissed=true;
  await page.setViewportSize({width,height:900});
  await page.addInitScript(({key,save})=>{if(!sessionStorage.getItem('wuhan-flow')){localStorage.setItem(key,save);sessionStorage.setItem('wuhan-flow','1');}}, {key:ACTIVE_SAVE_KEY,save:encodeCareerSave(state)});
  await page.goto('/'); await page.getByRole('button',{name:/Continue Career/}).click();
  await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
  await page.evaluate(()=>{history.pushState({},'','/tournament/preparation');dispatchEvent(new PopStateEvent('popstate'));});
  await page.getByRole('button',{name:'Confirm plan',exact:true}).click();
  await expect(page).toHaveURL(/\/tournaments\/hub$/);
  await expect(page.getByRole('heading',{name:'Wuhan Open',exact:true})).toBeVisible();
  const prepared=await readCareerSave(page);
  expect(prepared.currentDate).toBe(state.currentDate);
  expect(prepared.travel.bookings[event.id].preparation).toBeTruthy();
  expect(prepared.liveMatch?.status).not.toBe('In Progress');
  await page.getByRole('button',{name:'Advance to Tournament',exact:true}).click();
  await expect.poll(async()=>(await readCareerSave(page)).currentDate).toBe(event.startDate);
  await expect(page).toHaveURL(/\/tournaments\/hub$/);
  await expect(page.getByRole('heading',{name:'Wuhan Open',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Play Next Match',exact:true}).click();
  await expect(page).toHaveURL(/\/match\/preview$/);
  await expect(page.getByRole('button',{name:'Start Match',exact:true})).toBeVisible();
  expect((await readCareerSave(page)).matches).toHaveLength(state.matches.length);
  await page.evaluate(()=>{history.pushState({},'','/travel');dispatchEvent(new PopStateEvent('popstate'));});
  await page.getByRole('button',{name:'Tournament Hub',exact:true}).click();
  await expect(page).toHaveURL(/\/tournaments\/hub$/);
});

for (const blocked of [false, true]) test(`preview advancement returns to the tournament hub and starts safely (decision: ${blocked})`, async ({ page }) => {
  let state = createStarterState();
  state.player.cash = 100000;
  const event = state.tournaments.find(t => t.name === 'Shanghai Masters')!;
  state = enterTournamentState(state, event.id);
  state = bookTravelState(state, event.id);
  state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state.currentDate = plusDays(event.startDate, -1);
  state.careerDepth = { ...depthOf(state), stories: blocked ? [{
    id: 'story:preview:block', kind: 'breakthrough', title: 'A breakthrough victory',
    evidence: 'You beat a leading player.', createdDate: state.currentDate,
    expiresDate: plusDays(state.currentDate, 28), status: 'pending', updates: [],
    matchCount: state.matches.length, trainingWeeks: 0,
  }] : [] };
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, save), { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/match/preview'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('heading', { name: 'Match Preview', exact: true })).toBeVisible();
  if (blocked) {
    await expect(page.getByRole('button', { name: 'Advance to Tournament' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Resolve Inbox Decision', exact: true }).click();
    await expect(page).toHaveURL(/inbox\?message=story%3Apreview%3Ablock/);
    expect((await readCareerSave(page)).currentDate).toBe(state.currentDate);
    return;
  }
  await page.getByRole('button', { name: 'Advance to Tournament', exact: true }).click();
  await expect.poll(async () => (await readCareerSave(page)).currentDate).toBe(event.startDate);
  await expect(page).toHaveURL(/\/tournaments\/hub$/);
  expect((await readCareerSave(page)).matches.length).toBe(state.matches.length);
  await page.getByRole('button', { name: 'Play Next Match', exact: true }).click();
  await expect(page).toHaveURL(/\/match\/preview$/);
  await page.getByRole('button', { name: 'Start Match', exact: true }).click();
  await expect(page).toHaveURL(/\/match\/live$/);
  await expect.poll(async () => (await readCareerSave(page)).liveMatch?.status).toBe('In Progress');
});
