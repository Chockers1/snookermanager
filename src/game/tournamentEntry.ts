import type { GameState } from '../hooks/useGameState';
import type { Tournament } from '../types/game';
import { rankingCutoffDate, rankingEventKey } from './rollingRankings';
import { careerMessage, dayNumber, depthOf, plusDays } from './careerDepth/shared';

// Game entry closes on the first playing date unless a bespoke deadline is authored.
// Ranking selection locks separately; it must never silently become an entry deadline.
export const entryDeadline = (event: Tournament) => event.entryDeadline ?? event.startDate;
export function entryClosed(date: string | undefined, event: Tournament) {
  return Boolean(date && date > entryDeadline(event) && !['Entered', 'Booked', 'Completed'].includes(event.status));
}
export function entryTimeline(state: GameState, event: Tournament) {
  const deadline = entryDeadline(event), cutoff = rankingCutoffDate(event);
  const locked = Boolean(state.rollingRankings?.seedings[rankingEventKey(event)]);
  const remaining = dayNumber(deadline) - dayNumber(state.currentDate);
  return { deadline, cutoff, locked, remaining, label: ['Entered', 'Booked'].includes(event.status) ? 'Entry secured' : event.status === 'Completed' ? 'Event completed' : remaining < 0 ? 'Entry closed' : remaining === 0 ? 'Last day to enter' : `Entry closes in ${remaining} days`,
    explanation: `Entries accepted through ${deadline}. Ranking selection: ${cutoff} (${locked ? 'locked' : 'provisional until cutoff'}). Qualification and invitation requirements still apply.` };
}
export function entryReminderDates(state: GameState, eligible: (event: Tournament) => boolean = () => true) {
  return state.tournaments.filter(t => t.status === 'Available' && eligible(t)).flatMap(t => [plusDays(entryDeadline(t), -7), plusDays(entryDeadline(t), -1)]);
}
export function reconcileEntryReminders(state: GameState, eligible: (event: Tournament) => boolean) {
  const d = depthOf(state), previous = d.entryReminders ?? [];
  const notices = state.tournaments.filter(t => t.status === 'Available' && eligible(t)).flatMap(t => {
    const days = dayNumber(entryDeadline(t)) - dayNumber(state.currentDate);
    const stage = days <= 1 ? 'last' : 'week';
    const key = `${state.season}:${t.id}:${entryDeadline(t)}:${stage}`;
    return days >= 0 && days <= 7 && !previous.includes(key) ? [{ t, days, key }] : [];
  });
  if (!notices.length) return state;
  // One digest per calendar day, with persistent keys independent of inbox trimming.
  let next: GameState = { ...state, careerDepth: { ...d, entryReminders: [...previous, ...notices.map(n => n.key)].slice(-500) } };
  next = careerMessage(next, `entry-reminders:${state.currentDate}:${notices.map(n => n.key).join('|')}`, 'Tournament entry reminders', notices.map(({t,days}) => `${t.name}: ${days === 0 ? 'last day' : days + ' days left'}, closes ${entryDeadline(t)}; ranking cutoff ${rankingCutoffDate(t)}.`).join(' '), '/calendar');
  return next;
}
