import { formatAttribute, formatAttributeChange } from './formatters';
import type { InboxMessage } from '../types/game';

function confidenceNumber(raw: string): string {
  const value = Number(raw);
  if (!Number.isFinite(value)) return raw;
  const rounded = Number(value.toFixed(2));
  return `${raw.startsWith('+') && rounded > 0 ? '+' : ''}${rounded.toFixed(2)}`;
}

/** Format display text only; retain the full-precision simulation values. */
export function formatInboxConfidence<T extends Pick<InboxMessage, 'preview' | 'summary'>>(message: T): T {
  return {
    ...message,
    preview: message.preview
      .replace(/(\bconfidence\s+)([+-]?\d+(?:\.\d+)?)/gi, (_, prefix: string, value: string) => prefix + confidenceNumber(value))
      .replace(/([+-]?\d+(?:\.\d+)?)(%?\s+confidence\b)/gi, (_, value: string, suffix: string) => confidenceNumber(value) + suffix),
    summary: message.summary?.map(item => /confidence/i.test(item.label) ? {
      ...item,
      value: item.value.replace(/^[+-]?\d+(?:\.\d+)?/, confidenceNumber),
      detail: item.detail?.replace(/^[+-]?\d+(?:\.\d+)?/, confidenceNumber),
    } : item),
  };
}

/** Old inbox strings retain their historical values; round their presentation without rebuilding reports. */
export function formatInboxTrainingReport<T extends Pick<InboxMessage, 'subject' | 'preview' | 'summary'>>(message: T): T {
  if (!/^(?:Monthly|Fortnightly) training report:/.test(message.subject)) return message;
  return {
    ...message,
    preview: message.preview.replace(/([+-]?\d+(?:\.\d+)?) \(now ([+-]?\d+(?:\.\d+)?)\)/g,
      (_, delta: string, current: string) => `${formatAttributeChange(Number(delta))} (now ${formatAttribute(Number(current))})`),
    summary: message.summary?.map(item => /^Now [+-]?\d/.test(item.detail ?? '') && /· (technical|mental|physical)$/.test(item.detail ?? '') ? {
      ...item,
      value: formatAttributeChange(Number(item.value)),
      detail: item.detail!.replace(/^(Now )([+-]?\d+(?:\.\d+)?)/, (_, prefix: string, current: string) => prefix + formatAttribute(Number(current))),
    } : item),
  };
}
