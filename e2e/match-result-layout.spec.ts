import { test, expect, type Page } from '@playwright/test';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { victoryFixture } from '../test-support/victoryFixture';
import { readCareerSave } from './read-career-save';

async function open(page: Page, won: boolean, scale = 100) {
  const { state } = victoryFixture();
  state.careerDepth!.stories = [];
  if (!won) {
    state.matches[0].result = 'Lost'; state.matches[0].playerFrames = 0; state.matches[0].opponentFrames = 5;
    state.matches[0].round = 'Last 32'; state.matches[0].confidenceChange = -4.90000000000001;
    state.matches[0].debrief = undefined;
  }
  state.matches[0].frameHistory = Array.from({ length: 35 }, (_, i) => ({ frame: `F${i+1}`, player: i % 2 ? '0' : '106', opponent: i % 2 ? '100' : '0', winner: i % 2 ? state.matches[0].opponentName : state.player.fullName }));
  await page.addInitScript(({ key, value, scale }) => {
    if (!sessionStorage.getItem('result-layout')) { localStorage.setItem(key,value); sessionStorage.setItem('result-layout','1'); }
    localStorage.setItem('snooker-accessibility-v1', JSON.stringify({ textScale: scale, highContrast: false, reducedMotion: true, shortcuts: true }));
  }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state), scale });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', {name:'Upcoming & Recent Results', exact:true})).toBeVisible();
  await page.evaluate(() => { history.pushState({},'', '/match/result');dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('heading',{ name:'Match Review',exact:true })).toBeVisible();
  if (won) await page.getByRole('button',{name:'Continue to match review',exact:true}).click();
}

for (const [width,height,scale] of [[1920,1080,100],[1366,768,100],[1280,720,100],[1366,768,130],[390,844,100]]) test(`match review cards and tabs at ${width}, ${scale}%`, async ({page}) => {
  const errors: string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height});await open(page,false,scale);
  const saved=await readCareerSave(page);
  for (const tab of ['Overview','Statistics','Career Impact','Analysis']) {
    await page.getByRole('tab',{name:tab,exact:true}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
    if (width >= 1280 && scale === 100) {
      expect(await page.locator('#main-content').evaluate(el=>el.scrollHeight-el.clientHeight), tab+' page overflow').toBeLessThanOrEqual(2);
      expect(await page.locator('#result-panel').evaluate(el=>el.scrollHeight-el.clientHeight), tab+' content overflow').toBeLessThanOrEqual(2);
      if (tab === 'Statistics') expect(await page.locator('.result-statistics').evaluate(el=>el.scrollHeight-el.clientHeight), 'All 35 frames fit').toBeLessThanOrEqual(2);
      expect(await page.locator('#result-panel .result-card').evaluateAll(cards=>Math.max(0,...cards.map(el=>el.scrollHeight-el.clientHeight))), tab+' cards fit').toBeLessThanOrEqual(2);
    }
    await page.screenshot({path:`artifacts/match-result-redesign/${width}-${scale}-${tab.replaceAll(' ','-')}.png`});
  }
  await page.getByRole('tab',{name:'Equipment',exact:true}).click();await expect(page.getByRole('heading',{name:'Equipment Impact',exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Pressure & coaching',exact:true}).click();await expect(page.getByRole('heading',{name:'Pressure profile',exact:true})).toBeVisible();
  expect(await page.locator('#result-panel').innerText()).not.toMatch(/\d+\.\d{3,}/);
  if (width >= 1280 && scale === 100) expect(await page.locator('#result-panel .result-card').evaluateAll(cards=>Math.max(0,...cards.map(el=>el.scrollHeight-el.clientHeight))), 'Pressure cards fit').toBeLessThanOrEqual(2);
  await page.getByRole('button',{name:'Form assessment',exact:true}).click();await expect(page.getByRole('dialog',{name:'Form evidence and recovery'})).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  const after=await readCareerSave(page);expect(after.player.cash).toBe(saved.player.cash);expect(after.matches).toEqual(saved.matches);expect(errors).toEqual([]);
});

test('title summary stays compact and keyboard tabs work',async({page})=>{
  await page.setViewportSize({width:1280,height:720});await open(page,true);
  await expect(page.getByRole('region',{name:'Tournament victory'})).toContainText('Added to your trophy cabinet');
  expect(await page.locator('#result-panel').evaluate(el=>el.scrollHeight-el.clientHeight), 'Victory overview fits').toBeLessThanOrEqual(2);
  await page.screenshot({path:'artifacts/match-result-redesign/victory-1280.png'});
  await page.getByRole('tab',{name:'Overview',exact:true}).focus();await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab',{name:'Statistics',exact:true})).toBeFocused();
  expect(await page.locator('#main-content').evaluate(el=>el.scrollHeight-el.clientHeight)).toBeLessThanOrEqual(2);
  expect(await page.locator('.result-statistics').evaluate(el=>el.scrollHeight-el.clientHeight), 'Winning 35-frame review fits').toBeLessThanOrEqual(2);
  await page.getByRole('tab',{name:'Overview',exact:true}).click();
  await page.getByRole('button',{name:'Relive the celebration'}).click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'View Completed Bracket'}).click();await expect(page).toHaveURL(/tournaments\/draw/);
});
