import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';
for(const viewport of [{width:1280,height:720},{width:390,height:844}])test('seasonal sponsor offers at '+viewport.width+'px',async({page})=>{
  const fixture=createStarterState();fixture.player.reputation=100;fixture.sponsors=fixture.sponsors.slice(0,1);const existing=fixture.sponsors[0];const offer=fixture.sponsorOffers.find(o=>o.seasonal)!;
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize(viewport);
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('seasonal-sponsors')){localStorage.setItem(key,value);sessionStorage.setItem('seasonal-sponsors','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(fixture)});
  await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
  const navigate=async(path:string)=>page.evaluate(path=>{history.pushState({},'',path);dispatchEvent(new PopStateEvent('popstate'))},path);
  await navigate('/sponsorship');await expect(page.getByText(/2026\/27 sponsor market/)).toBeVisible();await expect(page.getByRole('heading',{name:offer.name,exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await navigate('/sponsorship/contract?offer='+offer.id);
  await page.getByRole('button',{name:/Increase Base Pay/}).click();await page.evaluate(()=>{Math.random=()=>0});await page.getByRole('button',{name:'Negotiate Terms',exact:true}).click();
  await expect.poll(async()=>((await readCareerSave(page)).sponsorOffers.find(o=>o.id===offer.id)?.monthlyValue??0)).toBeGreaterThan(offer.monthlyValue);
  const quote=(await readCareerSave(page)).sponsorOffers.find(o=>o.id===offer.id)!;
  await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();await navigate('/sponsorship/contract?offer='+offer.id);
  expect((await readCareerSave(page)).sponsorOffers.find(o=>o.id===offer.id)?.monthlyValue).toBe(quote.monthlyValue);
  await page.getByRole('button',{name:'Accept Contract',exact:true}).click();
  await expect.poll(async()=>(await readCareerSave(page)).sponsors.some(s=>s.id===offer.id)).toBe(true);
  const saved=await readCareerSave(page);expect(saved.sponsors.find(s=>s.id===offer.id)?.monthlyValue).toBe(quote.monthlyValue);expect(saved.sponsors.find(s=>s.id===existing.id)?.monthlyValue).toBe(existing.monthlyValue);expect(saved.sponsors.find(s=>s.id===existing.id)?.weeksRemaining).toBe(existing.weeksRemaining);
  await navigate('/sponsorship/contract?offer=expired-company-last-season');await expect(page.getByText('Offer unavailable',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Accept Contract',exact:true})).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('small seasonal contracts negotiate down without increasing pay or duration',async({page})=>{
  const fixture=createStarterState();fixture.player.reputation=100;const offer=fixture.sponsorOffers.find(o=>o.seasonal)!;offer.monthlyValue=125;offer.contractLength='6 months';
  await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(fixture)});
  await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(path=>{history.pushState({},'',path);dispatchEvent(new PopStateEvent('popstate'));Math.random=()=>0},'/sponsorship/contract?offer='+offer.id);
  await page.getByRole('button',{name:/Reduce Obligations/}).click();await page.getByRole('button',{name:'Negotiate Terms',exact:true}).click();
  await expect.poll(async()=>(await readCareerSave(page)).sponsorOffers.find(o=>o.id===offer.id)?.monthlyValue).toBe(50);
  await page.getByRole('button',{name:/Shorten Contract Length/}).click();await page.getByRole('button',{name:'Negotiate Terms',exact:true}).click();
  await expect.poll(async()=>(await readCareerSave(page)).sponsorOffers.find(o=>o.id===offer.id)?.contractLength).toBe('3 months');
  expect((await readCareerSave(page)).sponsorOffers.find(o=>o.id===offer.id)?.monthlyValue).toBe(50);
});
