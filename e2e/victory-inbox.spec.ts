import { test, expect } from '@playwright/test';
import { victoryFixture } from '../test-support/victoryFixture';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
for (const width of [390,1440]) test('title winning inbox report stands out at '+width, async ({page}) => {
  const {state,event}=victoryFixture();
  const message=state.inbox.find(m=>m.subject===`Post-event report: ${event.name}`)!;
  delete message.victoryReport; // Existing saves also receive the treatment.
  await page.setViewportSize({width,height:960});
  await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
  await page.goto('/'); await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(()=>{history.pushState({},'','/inbox');dispatchEvent(new PopStateEvent('popstate'));});
  const select=page.getByRole('combobox',{name:'Select inbox message'});
  if(await select.isVisible()) await select.selectOption(message.id);
  else {
    const row=page.getByRole('button',{name:/Champion: Wuhan Open/});
    await expect(row).toContainText('prize secured');
    await expect(row.getByLabel('Tournament victory')).toBeVisible();
    await row.click();
  }
  await expect(page.getByRole('heading',{name:'Champion: Wuhan Open',exact:true})).toBeVisible();
  const banner=page.getByRole('region',{name:'Champion announcement'});
  await expect(banner).toContainText('10–9');
  await expect(banner).toContainText('From 2 frames behind');
  await expect(banner).toContainText('Deciding frame: 106–0');
  await expect(banner).toContainText('First recorded ranking title');
  const report=page.getByRole('region',{name:'Post-event report'});
  await expect(report).toContainText('£140,000');
  await expect(report).toContainText('Hotel accommodation');
  await expect(report).toContainText('Publishes');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await report.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await banner.getByRole('link',{name:'View trophy cabinet'}).click();
  await expect(page.getByRole('region',{name:/Trophy Cabinet/})).toBeInViewport();
});
