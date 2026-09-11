import type { InboxMessage, Tournament } from '../types/game';

function arrangement(message: InboxMessage, tournaments: Tournament[]) {
  if (message.routineArrangement) return message.routineArrangement;
  const match = message.sender === 'Tournament Office' ? /^Entered (.+)$/.exec(message.subject)
    : message.sender === 'Travel Desk' ? /^(.+) travel booked$/.exec(message.subject)
      : message.sender === 'Performance Team' ? /^(.+) preparation confirmed$/.exec(message.subject) : null;
  if (!match) return null;
  const name = match[1];
  const event = tournaments.find(t => t.name === name);
  const reference = message.tournamentReference ?? (event ? { id: event.id, startDate: event.startDate } : undefined);
  // Without an edition we cannot safely combine confirmations across seasons.
  if (!reference) return null;
  const stage = message.sender === 'Tournament Office' ? 'Entry' : message.sender === 'Travel Desk' ? 'Travel' : 'Preparation';
  return { name, reference, confirmations: [{ stage, text: message.preview }] };
}

/** Only combine stored routine messages. Decisions, deadlines and results are never classified by priority. */
export function compactRoutineInbox(messages: InboxMessage[], tournaments: Tournament[] = []): InboxMessage[] {
  const result: InboxMessage[] = [];
  const arrangements = new Map<string, number>();
  for (const message of messages) {
    const receipt = arrangement(message, tournaments);
    if (!receipt) { result.push(message); continue; }
    const key = `${receipt.reference.id}:${receipt.reference.startDate}`;
    const index = arrangements.get(key);
    if (index === undefined) {
      arrangements.set(key, result.length);
      result.push(message.routineArrangement ? message : {
        ...message, subject: `Event arrangements: ${receipt.name}`, sender: 'Tournament Office',
        priority: 'Low', read: true, routineArrangement: receipt, tournamentReference: receipt.reference,
        preview: 'Your entry, travel and preparation confirmations are kept here. Completed bookings need no reply.',
        summary: receipt.confirmations.map(c => ({ label: c.stage, value: 'Confirmed', detail: c.text })),
      });
    } else {
      const current = result[index];
      const confirmations = [...current.routineArrangement!.confirmations];
      for (const confirmation of receipt.confirmations) {
        if (!confirmations.some(c => c.stage === confirmation.stage)) confirmations.push(confirmation);
      }
      result[index] = { ...current, routineArrangement: { ...receipt, confirmations },
        summary: confirmations.map(c => ({ label: c.stage, value: 'Confirmed', detail: c.text })) };
    }
  }
  // Entering resolves the earlier invitation; it should no longer inflate the unread count.
  const resolved = result.map(message => {
    const reference = message.tournamentReference;
    return message.subject.startsWith('Invitation: ') && reference && arrangements.has(`${reference.id}:${reference.startDate}`) && !message.read
      ? { ...message, read: true } : message;
  });
  const training = new Map<string, InboxMessage>();
  for (const message of resolved) {
    const week = /^(?:Monthly|Fortnightly) training report: (Season \d+ · Week \d+) ·/.exec(message.subject)?.[1];
    if (week) training.set(week, message);
  }
  const weekly = new Map<string, InboxMessage>();
  for (const message of resolved) {
    const week = /^(Season \d+ · Week \d+) report$/.exec(message.subject)?.[1];
    if (week && training.has(week)) weekly.set(week, message);
  }
  return resolved.filter(message => ![...weekly.values()].includes(message)).map(message => {
    const week = /^(?:Monthly|Fortnightly) training report: (Season \d+ · Week \d+) ·/.exec(message.subject)?.[1];
    const report = week ? weekly.get(week) : undefined;
    if (!report) return message;
    return { ...message, priority: message.priority === 'High' || report.priority === 'High' ? 'High' : message.priority,
      read: Boolean(message.read && report.read),
      preview: `${message.preview}\nWeekly management update: ${report.preview}`,
      summary: [...message.summary ?? [], ...report.summary?.map(item => ({ ...item, label: `Weekly · ${item.label}` })) ?? []] };
  });
}
