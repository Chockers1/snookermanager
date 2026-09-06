import { describe, expect, it } from 'vitest';
import { buildMonthWeeks, type MonthCalendarEvent } from './monthCalendar';
const event = (id: string, startDate: string, endDate = startDate): MonthCalendarEvent => ({ id, name: id, startDate, endDate, status: 'Available', accent: 'green', tourCircuit: 'Main Tour' });
describe('month tournament placement', () => {
  it('uses Monday-first weeks and includes leap day', () => {
    const weeks = buildMonthWeeks(2028, 1, []);
    expect(weeks[0].days[0].date).toBe('2028-01-31');
    expect(weeks.flatMap(w => w.days).filter(d => d.inMonth)).toHaveLength(29);
    expect(weeks.flatMap(w => w.days).find(d => d.date === '2028-02-29')?.inMonth).toBe(true);
  });
  it('supports four-, five- and six-week months', () => {
    expect(buildMonthWeeks(2027, 1, [])).toHaveLength(4);
    expect(buildMonthWeeks(2026, 4, [])).toHaveLength(5);
    expect(buildMonthWeeks(2026, 2, [])).toHaveLength(6);
  });
  it('clips cross-month events to their actual inclusive dates with continuation arrows', () => {
    const weeks = buildMonthWeeks(2026, 4, [event('World', '2026-04-28', '2026-05-04')]);
    expect(weeks[0].segments[0]).toMatchObject({ column: 4, span: 3, continuesBefore: true, continuesAfter: true });
    expect(weeks[1].segments[0]).toMatchObject({ column: 0, span: 1, continuesBefore: true, continuesAfter: false });
    expect(weeks.slice(2).flatMap(w => w.segments)).toHaveLength(0);
  });
  it('separates overlapping events and reuses lanes after events finish', () => {
    const week = buildMonthWeeks(2026, 4, [event('A', '2026-05-04', '2026-05-06'), event('B', '2026-05-05', '2026-05-07'), event('C', '2026-05-07', '2026-05-08')])[1];
    expect(week.segments.map(s => [s.event.id, s.lane])).toEqual([['A', 0], ['B', 1], ['C', 0]]);
  });
  it('handles year boundaries and excludes events outside the displayed month', () => {
    const weeks = buildMonthWeeks(2027, 0, [event('New year', '2026-12-30', '2027-01-03'), event('Later', '2027-02-01')]);
    expect(weeks[0].segments).toHaveLength(1);
    expect(weeks[0].segments[0]).toMatchObject({ column: 4, span: 3 });
    expect(weeks.flatMap(w => w.segments).some(s => s.event.id === 'Later')).toBe(false);
  });
});
