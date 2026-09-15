import {test,expect} from '@playwright/test';

test('new youth career shows rosters, unranked status and no club-event ranking projection',async({page})=>{
 await page.goto('/');
 await page.evaluate(async()=>{
  const game=await import('/src/hooks/useGameState.ts');const storage=await import('/src/game/saveStorage.ts');
  const s=game.createNewCareerState({fullName:'Rob Taylor',age:15,startingLevelId:'start-national-youth'} as never);
  s.seasonReview=null;s.firstWeekGuide={version:1,dismissed:true,completed:[],skipped:[]};
  await storage.prepareCareerStorage();await storage.commitCareerStorage([[storage.ACTIVE_SAVE_KEY,storage.encodeCareerSave(s)]]);
 });
 await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();
 await page.evaluate(()=>{history.pushState({},'', '/rankings');dispatchEvent(new PopStateEvent('popstate'))});
 await expect(page.getByRole('button',{name:'Youth Ranking Unranked',exact:true})).toBeVisible();
 await expect(page.getByText('Player roster · awaiting results',{exact:true})).toBeVisible();
 await expect(page.locator('tbody tr').first()).toBeVisible();
 await expect(page.locator('tbody').getByText('Rob Taylor',{exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Your race',exact:true}).click();
 await expect(page.getByText(/awards no points for this ranking list/)).toBeVisible();
 await expect(page.getByText('Rank 1',{exact:true})).toHaveCount(0);
 await expect(page.getByText('No published ranking history yet.',{exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Standings',exact:true}).click();
 for(const tab of ['Amateur Ranking','Q Tour Ranking','Q School OOM','Senior Ranking']){
  await page.getByRole('button',{name:tab,exact:true}).click();
  await expect(page.getByText('Player roster · awaiting results',{exact:true})).toBeVisible();
  await expect(page.locator('tbody tr').first()).toBeVisible();
  if(tab==='Q Tour Ranking')for(const region of ['Asia Pacific','Middle East','Americas']){
   await page.getByLabel('Pathway standings',{exact:true}).selectOption(region);
   await expect(page.getByText(/circuit-wide roster, not a confirmed regional entry list/)).toBeVisible();
  }
 }
 await page.getByRole('button',{name:'Current Path',exact:true}).click();
 await expect(page.locator('tbody').getByText('Rob Taylor',{exact:true})).toBeVisible();
 await page.screenshot({path:'artifacts/career-v012/starting-rankings.png',fullPage:true});
});
