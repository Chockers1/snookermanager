import { expect, test } from '@playwright/test';
import { createNewCareerState, buildTournamentDraw } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';

for (const width of [1366, 390]) test('junior preview explains cross-circuit opposition and rounds attributes at ' + width, async ({ page }) => {
 const s = createNewCareerState({ fullName: 'Rob Taylor', nationality: 'England', age: 15, handedness: 'Right-handed', cueStyle: '', playingStyle: '', personalityArchetype: '', sliders: [], backgroundId: '', startingLevelId: 'start-club-junior' });
 s.firstWeekGuide!.dismissed = true;
 const event = s.tournaments.find(t => t.name === 'Summer Junior Club League')!;
 s.tournaments.forEach(t => { if(t.status === 'Entered')t.status = 'Available'; });
 event.status = 'Entered';
 for(const p of s.worldPlayers)if(p.playerName!==s.player.fullName&&!p.hasTourCard){p.age=20;p.overallRating=73;}
 s.attributes.technical['Long Potting'] = 47.11653333333334;
 s.tournamentProgress = { ...s.tournamentProgress, rulesVersion: 3, tournamentId: event.id, currentRound: 'League', draw: buildTournamentDraw(s,event,'League') };
 await page.setViewportSize({width, height: 900});
 await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('junior-preview')){localStorage.setItem(key,value);sessionStorage.setItem('junior-preview','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(s)});
 await page.goto('/'); await page.getByRole('button',{name:/Continue Career/}).click(); await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
 await page.evaluate(()=>{history.pushState({},'', '/match/preview');dispatchEvent(new PopStateEvent('popstate'))});
 await expect(page.getByRole('heading',{name:'Match Preview',exact:true})).toBeVisible();
 await expect(page.getByLabel('Opponent profile')).toContainText('Age 20');
 await expect(page.getByLabel('Opponent profile')).toContainText('Under-21 event');
 await expect(page.getByText('Lower rated',{exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Scouting',exact:true}).click();
 await expect(page.getByText('47.12',{exact:true}).first()).toBeVisible();
 expect(await page.locator('#main-content').innerText()).not.toMatch(/\d+\.\d{3,}/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
 await page.getByRole('tab',{name:'Equipment & event',exact:true}).click();
 const previewCriteria=page.getByLabel('Tournament entry criteria');
 await expect(previewCriteria).toContainText('stronger eligible players');
 await page.screenshot({path:`artifacts/career-v012/junior-preview-${width}.png`,fullPage:true});
 await page.evaluate(id=>{history.pushState({},'', '/calendar?tournament='+encodeURIComponent(id));dispatchEvent(new PopStateEvent('popstate'))},event.id);
 const calendarCriteria=page.getByRole('region',{name:'Tournament entry criteria'});
 await expect(calendarCriteria).toContainText('Under-21 mixed youth field');
 await expect(calendarCriteria).toContainText('club juniors, national youth players, amateurs, Q Tour and Q School');
 await expect(calendarCriteria).toContainText('Age 15');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
 await page.screenshot({path:`artifacts/career-v012/entry-criteria-calendar-${width}.png`,fullPage:true});
});
