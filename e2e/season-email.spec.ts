import { expect, test } from '@playwright/test';
import { createStarterState, finishSeasonState, startNextSeasonState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
function fixture() {
  const state = createStarterState();
  state.currentDate = '2027-06-29';
  state.tournaments = state.tournaments.map(t => ({ ...t, status: 'Skipped' }));
  const finished = finishSeasonState(state);
  const email = finished.inbox.find(m => m.seasonReport)!;
  const report = email.seasonReport!;
  Object.assign(report.record, { matchesPlayed:39, wins:23, losses:15, titles:0, majorTitles:0, prizeMoney:239650, highestBreak:109, centuries:7, openingRanking:30, closingRanking:18, openingRankingLabel:'World Ranking', closingRankingLabel:'World Ranking', bestResult:'Semi Final · Shoot Out' });
  report.decision = { title:'Professional tour card retained', detail:'Your World Ranking of #18 keeps your professional career active for 2027/28.', expectation:'Improve your seeding and secure another season inside the Top 64.' };
  report.majorWinners = ['World Championship', 'UK Championship', 'Masters', 'Tour Championship', 'Champion of Champions'].map(tournamentName => ({ tournamentName, winner:'Malik Langford', playerWon:false }));
  report.finalRankings = [1,2,3].map(ranking => ({ ranking, playerName:['Malik Langford','Mateo Harrington','Tobias Harrington'][ranking-1], points:1500000-ranking*10000 }));
  report.closingCash=188275;
  report.cashMovement={from:'2026-06-30',to:'2027-06-30',change:1275};
  const next = startNextSeasonState(finished);
  next.inbox = [email];
  return next;
}
for (const viewport of [{width:1280,height:720},{width:390,height:844},{width:320,height:568}]) test('season-end email at '+viewport.width+'px', async ({page}) => {
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(fixture())});
  await page.goto('/'); await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(()=>{history.pushState({},'','/inbox');dispatchEvent(new PopStateEvent('popstate'))});
  const report=page.getByRole('region',{name:'End of season report'}), body=page.getByTestId('inbox-message-body'), actions=page.getByTestId('inbox-message-actions');
  await expect(report).toBeVisible();
  for(const text of ['23W · 15L · 1D','59% won','Up 12 places','£239,650','7 centuries','Professional tour card retained','Major tournament winners','Closing world rankings','£188,275']) await expect(report).toContainText(text);
  await expect(actions.getByRole('button',{name:'Open Season Review'})).toBeInViewport();
  const dimensions=await body.evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,width:e.clientWidth,scrollWidth:e.scrollWidth}));
  if(viewport.width>=1280)expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.height+1);
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width+1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await body.evaluate(e=>e.scrollTo(0,e.scrollHeight));
  await expect(report.getByText('Closing world rankings')).toBeInViewport();
  await page.screenshot({path:'artifacts/season-email-'+viewport.width+'.png'});
  expect(errors).toEqual([]);
});
