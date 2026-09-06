export type MonthCalendarEvent = { id: string; name: string; startDate: string; endDate?: string; accent: string; status: string; tourCircuit: string };
export type CalendarSegment = { event: MonthCalendarEvent; column: number; span: number; lane: number; continuesBefore: boolean; continuesAfter: boolean };
const dayMs = 86400000;
const dayValue = (date: string) => Date.parse(date + 'T00:00:00Z');
export function buildMonthWeeks(year: number, month: number, events: MonthCalendarEvent[]) {
  const first = Date.UTC(year, month, 1), last = Date.UTC(year, month + 1, 0);
  const start = first - ((new Date(first).getUTCDay() + 6) % 7) * dayMs;
  const count = Math.ceil(((last - start) / dayMs + 1) / 7);
  return Array.from({ length: count }, (_, week) => {
    const weekStart = start + week * 7 * dayMs, weekEnd = weekStart + 6 * dayMs;
    const days = Array.from({ length: 7 }, (_, day) => {
      const value = weekStart + day * dayMs;
      return { date: new Date(value).toISOString().slice(0, 10), day: new Date(value).getUTCDate(), inMonth: value >= first && value <= last };
    });
    const segments: CalendarSegment[] = [];
    const laneEnds: number[] = [];
    const candidates = events.map(event => ({ event, start: dayValue(event.startDate), end: Math.max(dayValue(event.startDate), dayValue(event.endDate ?? event.startDate)) }))
      .filter(e => e.start <= Math.min(last, weekEnd) && e.end >= Math.max(first, weekStart))
      .sort((a, b) => a.start - b.start || b.end - a.end || a.event.id.localeCompare(b.event.id));
    for (const candidate of candidates) {
      const from = Math.max(first, weekStart, candidate.start), to = Math.min(last, weekEnd, candidate.end);
      const column = (from - weekStart) / dayMs, span = (to - from) / dayMs + 1;
      let lane = laneEnds.findIndex(end => end < column);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = column + span - 1;
      segments.push({ event: candidate.event, column, span, lane, continuesBefore: candidate.start < from, continuesAfter: candidate.end > to });
    }
    return { days, segments };
  });
}
