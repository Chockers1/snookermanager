import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
for (const [width, height, scale] of [[1920,1080,100],[1366,768,130],[1100,768,100],[390,844,100]]) {
 test(`sponsor contracts fit one screen at ${width}, ${scale}%`, async ({page}) => {
  const state = createStarterState(); state.sponsors = [];
  if (state.firstWeekGuide) state.firstWeekGuide.dismissed = true;
  const offers = state.sponsorOffers.filter(offer => offer.status === 'Available');
  expect(offers.length).toBeGreaterThan(0);
  await page.setViewportSize({width,height});
  await page.addInitScript(({key,save,accessibility,scale}) => {
   localStorage.setItem(key,save); localStorage.setItem(accessibility,JSON.stringify({textScale:scale,reducedMotion:true}));
  },{key:ACTIVE_SAVE_KEY,save:encodeCareerSave(state),accessibility:ACCESSIBILITY_KEY,scale});
  await page.goto('/'); await page.getByRole('button',{name:/Continue Career/}).click();
  await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
  const fits = async () => {
   expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2)).toBe(true);
   const footer = await page.getByTestId('sponsor-contract-page').locator('footer').boundingBox();
   expect(footer!.y + footer!.height).toBeLessThanOrEqual(height);
  };
  for (const offer of offers) {
   await page.evaluate(id => {history.pushState({},'',`/sponsorship/contract?offer=${id}&slot=Waistcoat%20Front`); dispatchEvent(new PopStateEvent('popstate'));},offer.id);
   await expect(page.getByRole('heading',{name:offer.name,exact:true})).toBeVisible(); await fits();
  }
  const tabs = page.getByRole('tablist',{name:'Contract sections'});
  for (const name of ['Package','Comparison','Negotiation','Performance']) {
   await tabs.getByRole('tab',{name,exact:true}).click(); await fits();
   if (name === 'Negotiation') {
    await page.getByRole('button',{name:/Reduce Obligations/}).click();
    await page.getByRole('button',{name:'Conservative',exact:true}).click();
    await expect(page.getByRole('button',{name:'Conservative',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.getByRole('button',{name:'Submit Negotiation'})).toBeVisible();
   }
   await page.screenshot({path:`artifacts/sponsor-contract-${width}-${name}.png`});
  }
  await tabs.getByRole('tab',{name:'Performance'}).focus(); await page.keyboard.press('Home');
  await expect(tabs.getByRole('tab',{name:'Package',exact:true})).toHaveAttribute('aria-selected','true');
  await page.getByRole('button',{name:'Negotiate Terms'}).click();
  await expect(tabs.getByRole('tab',{name:'Negotiation',exact:true})).toHaveAttribute('aria-selected','true');
 });
}
