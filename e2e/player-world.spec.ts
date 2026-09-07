import {expect,test} from '@playwright/test';
import {playerWorldFixture} from '../test-support/playerWorldFixture';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
for(const width of [1280,390])test('player profiles and exhibition achievements at '+width,async({page})=>{
 const {state,opponent}=playerWorldFixture();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:844});
 await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('profile-fixture')){localStorage.setItem(key,value);sessionStorage.setItem('profile-fixture','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 const navigate=async(path:string)=>page.evaluate(path=>{history.pushState({},'',path);dispatchEvent(new PopStateEvent('popstate'))},path);
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await navigate('/rankings');await page.getByRole('link',{name:opponent.playerName,exact:true}).first().click();
 await expect(page.getByRole('heading',{name:opponent.playerName,exact:true})).toBeVisible();await expect(page.getByText('Not scouted',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Your head-to-head'})).toBeVisible();await expect(page.getByRole('heading',{name:'Ranking history'})).toBeVisible();await expect(page.getByText(/Exhibition achievement/)).toBeVisible();
 await page.getByRole('button',{name:'Scout recorded match · one evening'}).click();await expect(page.getByText('Not scouted',{exact:true})).toHaveCount(0);await expect(page.getByText(/1 observations/)).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'artifacts/player-profile-'+width+'.png'});
 await navigate('/career/stats');await expect(page.getByRole('region',{name:'Exhibition achievements'})).toContainText('Profile Open');await expect(page.getByRole('region',{name:'Exhibition achievements'})).toContainText('£7,500');expect(errors).toEqual([]);
});
