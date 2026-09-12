import type { GameState } from '../hooks/useGameState';
import type { InboxMessage, PlayerAttributes } from '../types/game';
import { formatAttribute, formatAttributeChange, formatPercent } from '../utils/formatters';

export type ManagementReportBaseline = {
  version: 1;
  date: string;
  cash: number;
  confidence: number;
  fatigue: number;
  morale: number;
  attributes: PlayerAttributes;
};

function capture(state: GameState): ManagementReportBaseline {
  return { version: 1, date: state.currentDate, cash: state.player.cash,
    confidence: state.player.confidence, fatigue: state.player.fatigue, morale: state.player.morale,
    attributes: { technical: { ...state.attributes.technical }, mental: { ...state.attributes.mental }, physical: { ...state.attributes.physical } } };
}

/** Older saves start tracking now; loading never invents past monthly reports. */
export function ensureManagementReportBaseline(state: GameState): GameState {
  const baseline = state.managementReportBaseline;
  return baseline?.version === 1 && baseline.date <= state.currentDate ? state : { ...state, managementReportBaseline: capture(state) };
}

const money = (value: number) => Math.abs(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signedMoney = (value: number) => `${Number(value.toFixed(2)) < 0 ? '−' : '+'}£${money(value)}`;

/** Constant-size snapshot comparison after gameplay mutations, never a history scan. */
export function settleMonthlyManagementReport(input: GameState): GameState {
  const state = ensureManagementReportBaseline(input);
  const baseline = state.managementReportBaseline!;
  if (baseline.date.slice(0, 7) === state.currentDate.slice(0, 7)) return state;
  const period = `${baseline.date} to ${state.currentDate}`;
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${baseline.date}T00:00:00Z`));
  const cash = state.player.cash - baseline.cash;
  const confidence = state.player.confidence - baseline.confidence;
  const fatigue = state.player.fatigue - baseline.fatigue;
  const improvements = (['technical', 'mental', 'physical'] as const).flatMap(group =>
    Object.entries(state.attributes[group]).map(([label, current]) => ({ label, current, delta: current - (baseline.attributes[group][label] ?? current) }))
  ).filter(change => change.delta > 0).sort((a, b) => b.delta - a.delta);
  const summary: NonNullable<InboxMessage['summary']> = [
    { label: 'Cash change', value: signedMoney(cash), detail: `Balance ${state.player.cash < 0 ? '−' : ''}£${money(state.player.cash)} · all income and spending during this report period`, tone: cash >= 0 ? 'positive' : 'negative' },
    { label: 'Confidence', value: formatPercent(state.player.confidence), detail: `${formatAttributeChange(confidence)} over this report period`, tone: confidence < 0 ? 'warning' : confidence > 0 ? 'positive' : 'neutral' },
    { label: 'Fatigue', value: formatPercent(state.player.fatigue), detail: `${formatAttributeChange(fatigue)} over this report period`, tone: state.player.fatigue >= 75 ? 'negative' : fatigue > 0 ? 'warning' : 'positive' },
    { label: 'Morale', value: formatPercent(state.player.morale), detail: `${formatAttributeChange(state.player.morale - baseline.morale)} over this report period`, tone: state.player.morale < baseline.morale ? 'warning' : 'neutral' },
    { label: 'Training progress', value: `${improvements.length} improved`, detail: improvements.length ? improvements.slice(0, 4).map(change => `${change.label} ${formatAttributeChange(change.delta)} (now ${formatAttribute(change.current)})`).join(' · ') : 'No net attribute increases during this report period.', tone: improvements.length ? 'positive' : 'neutral' },
    { label: 'Strain / burnout', value: `${formatPercent(state.trainingCondition.strain)} / ${formatPercent(state.trainingCondition.burnout)}`, detail: state.trainingCondition.strain === 0 && state.trainingCondition.burnout === 0 ? 'Recovered — no accumulated strain or burnout' : 'Current training health', tone: state.trainingCondition.strain >= 70 || state.trainingCondition.burnout >= 70 ? 'negative' : 'neutral' },
  ];
  const message: InboxMessage = {
    id: `monthly-management:${baseline.date}:${state.currentDate}`, sender: 'Career Manager',
    subject: `Monthly management report · ${month}`, date: state.currentDate, read: false,
    priority: state.player.fatigue >= 75 || state.trainingCondition.strain >= 70 ? 'High' : 'Medium',
    preview: `${period}. Cash ${signedMoney(cash)} · confidence ${formatAttributeChange(confidence)} · fatigue ${formatAttributeChange(fatigue)} · ${improvements.length} attributes improved. Reports arrive when the calendar moves into a new month; figures cover the dates shown.`,
    actionLabel: 'View Training Report', actionRoute: '/training/report', summary,
  };
  const inbox = [message, ...state.inbox.filter(item => item.id !== message.id)].slice(0, 18);
  const unread = inbox.filter(item => !item.read).length;
  return { ...state, managementReportBaseline: capture(state), inbox, player: { ...state.player, inboxCount: unread, notificationCount: unread } };
}
