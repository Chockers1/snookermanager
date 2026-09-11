import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import type { InboxMessage } from '../src/types/game';
for (const width of [1366, 390]) test('routine messages consolidate without hiding deadlines at ' + width, async ({ page }) => {
 const state = createStarterState();
 const event = state.tournaments[0];
 const base: InboxMessage = { id: 'receipt-prep', subject: `${event.name} preparation confirmed`, sender: 'Performance Team', preview: 'Preparation confirmed for the opening round.', date: '2026-09-16', read: false, priority: 'Medium', tournamentReference: { id: event.id, startDate: event.startDate } };
 state.inbox = [base,
  { ...base, id: 'receipt-travel', subject: `${event.name} travel booked`, sender: 'Travel Desk', preview: 'Two hotel nights booked for £190.' },
  { ...base, id: 'receipt-entry', subject: `Entered ${event.name}`, sender: 'Tournament Office', preview: 'Entry fee £100 paid.' },
  { id: 'deadline', subject: 'Tournament entry reminders', sender: 'Career Manager', preview: 'Another event closes in 7 days.', priority: 'Medium', read: false, date: '2026-09-16' },
  { id: 'weekly', subject: 'Season 1 · Week 18 report', sender: 'Career Manager', preview: 'Cash +£46.92 this week.', priority: 'Medium', read: false, date: '2026-09-16', summary: [{ label: 'Cash flow', value: '+£46.92' }] },
  { id: 'training', subject: 'Fortnightly training report: Season 1 · Week 18 · 14 improved', sender: 'Head Coach', preview: 'Focus +0.32 (now 66.06).', priority: 'Medium', read: false, date: '2026-09-16', summary: [{ label: 'Focus', value: '+0.32' }] },
 ];
 await page.setViewportSize({ width, height: 900 });
 await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
 await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
 await expect(page.locator('#main-content')).toBeVisible();
 await page.evaluate(() => { history.pushState({}, '', '/inbox?message=receipt-prep'); dispatchEvent(new PopStateEvent('popstate')); });
 const list = page.getByLabel('Inbox messages', { exact: true });
 await expect(list.getByRole('button', { name: /Event arrangements:/ })).toHaveCount(1);
 await expect(list.getByRole('button', { name: /travel booked|preparation confirmed|Entered / })).toHaveCount(0);
 await expect(page.getByTestId('inbox-message-body')).toContainText('Two hotel nights booked for £190.');
 await expect(page.getByTestId('inbox-message-body')).toContainText('Entry fee £100 paid.');
 await list.getByRole('button', { name: /Fortnightly training report/ }).click();
 await expect(page.getByTestId('inbox-message-body')).toContainText('+£46.92');
 await page.getByRole('tab', { name: /^Unread/ }).click();
 await expect(list.getByRole('button', { name: /Tournament entry reminders/ })).toBeVisible();
 await expect(list.getByRole('button', { name: /Event arrangements:/ })).toHaveCount(0);
 await page.screenshot({ path: `artifacts/inbox-cadence-${width}.png` });
});
