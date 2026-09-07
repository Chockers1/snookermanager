import { expect, it } from 'vitest';
import { formatPercent } from './formatters';
it.each([
  [100 - 5.21, '94.79%'],
  [87.00000000000001, '87%'],
  [83.05000000000001, '83.05%'],
  [-1.2000000000000028, '-1.2%'],
  [1.005, '1.01%'],
  [0.99999, '1%'],
  [-0.00001, '0%'],
  [0, '0%'],
  [100, '100%'],
  [Number.NaN, '—'],
  [Number.POSITIVE_INFINITY, '—'],
])('formats percentage %s as %s', (value, expected) => {
  expect(formatPercent(value as number)).toBe(expected);
});
