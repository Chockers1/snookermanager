import { readCareerSave } from './read-career-save';
import { expect, test } from '@playwright/test';
import { createNewCareerState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
import { plusDays } from '../src/game/careerDepth/shared';

for (const width of [1920, 1366, 1280, 390]) for (const populated of [false, true]) {
 test(`form evidence is readable at ${width}, records: ${populated}`, async ({ page }) => {
  const height = width === 1280 ? 720 : width === 1920 ? 1080 : 900;
  const state = createNewCareerState(); state.firstWeekGuide!.dismissed = true;
  const life = state.careerDepth!.seasonLife!;
  if (populated) {
   life.evidence = Array.from({ length: 7 }, (_, i) => ({ id: 'evidence-' + i, date: state.currentDate, openings: 10, openingsMade: 5, strongLeads: 3, leadsLost: 1 }));
   life.form = { id: 'form:layout', kind: 'long-pot', started: state.currentDate, ends: plusDays(state.currentDate, 42), progress: 34, route: 'training', evidence: 'Repeated long-opening results below your earlier baseline.', fatigue: 34, confidence: 67 };
  } else { life.evidence = []; delete life.form; }
  if(populated&&width===1920)state.coachContracts=[{coachId:state.coaches[0].id,slot:'Lead Coach',startedWeek:state.week,contractWeeks:24,weeksRemaining:24,contractLabel:'Season contract',weeklyCost:100,totalCost:2400}];
  if(populated&&width===1366){life.form!.kind='closing';life.form!.evidence='Repeated lost strong late-frame leads across three matches.';}
  if (width === 390) state.coachContracts = [];
  await page.setViewportSize({ width, height });
  await page.addInitScript(({ key, value, accessibility }) => {
   localStorage.setItem(key, value);
   localStorage.setItem(accessibility, JSON.stringify({ textScale: 130, reducedMotion: true }));
  }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state), accessibility: ACCESSIBILITY_KEY });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/training'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.locator('#main-content')).not.toContainText('Tactical & scheduling advice');
  const support = page.getByLabel('Training support');
  await expect(support).toContainText('Development & practice'); await expect(support).toContainText('Training base');
  if (width >= 1280) {
    const tops = await support.locator(':scope > section').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().top));
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
    expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
  }
  await page.screenshot({ path: `artifacts/training-support-${width}-${populated}.png` });
  await page.getByRole('button', { name: /Form assessment/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Form evidence and recovery', exact: true });
  await expect(dialog).toBeVisible();
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(width); expect(bounds.y + bounds.height).toBeLessThanOrEqual(height);
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const records = dialog.getByRole('region', { name: 'Recorded form evidence' });
  if (populated) {
   await expect(dialog.getByRole('button', { name: 'Targeted training', exact: true })).toHaveAttribute('aria-pressed', 'true');
   if(width===1366)await expect(dialog).toContainText('Match practice, Mental Training and Safety Exchanges');
   await page.screenshot({path:`artifacts/form-editor-assessment-${width}-${populated}.png`});
   const coach = dialog.getByRole('button',{name:'Coach-supported recovery',exact:true});
   if (!state.coachContracts.length) await expect(coach).toBeDisabled();
   for (const [label,route] of [['Tactical protection','protect'],['Patience','patience'],['Targeted training','training']]) {
    await dialog.getByRole('button',{name:label,exact:true}).click();
    await expect.poll(async()=> (await readCareerSave(page)).careerDepth?.seasonLife?.form?.route).toBe(route);
    expect((await readCareerSave(page)).careerDepth?.seasonLife?.form?.progress).toBe(34);
   }
   if(state.coachContracts.length){await coach.click();await expect.poll(async()=> (await readCareerSave(page)).careerDepth?.seasonLife?.form?.route).toBe('coach');}
   await dialog.getByRole('tab',{name:'Match evidence',exact:true}).click();
   await expect(records.locator('dl')).toHaveCount(6);
   await expect(records.locator('dl').first()).toContainText('5 of 10');
   await expect(records.locator('dl').first()).toContainText('1 of 3');
   await records.locator('dl').last().scrollIntoViewIfNeeded();
  } else {
   await expect(dialog.getByRole('heading', { name: 'No match evidence recorded yet' })).toBeVisible();
   await page.screenshot({path:`artifacts/form-editor-assessment-${width}-${populated}.png`});
   await dialog.getByRole('tab',{name:'Match evidence',exact:true}).click();
   await expect(dialog.locator('table')).toHaveCount(0);
   await expect(records).toContainText('Play matches in Match Centre');
  }
  await page.screenshot({ path: `artifacts/career-v012/form-recovery-${width}-${populated}.png` });
  expect(await dialog.innerText()).not.toMatch(/\d+\.\d{3,}/);
  await expect(dialog.getByRole('button',{name:'Close editor'})).toBeInViewport();
  await dialog.getByRole('tab',{name:'Match evidence',exact:true}).focus();await page.keyboard.press('ArrowLeft');await expect(dialog.getByRole('tab',{name:'Assessment & recovery',exact:true})).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
 });
}
