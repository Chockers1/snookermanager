/** Positive support has diminishing returns. Administrative actions must not call this. */
export function supportedConfidence(current: number, delta: number) {
  const effective = delta > 0 ? delta * Math.max(0, Math.min(1, (90 - current) / 25)) : delta;
  return Math.max(20, Math.min(99, Math.round((current + effective) * 10) / 10));
}
export function settledConfidence(current: number, recentResults: string[], composure: number) {
  const results = recentResults.slice(-10);
  const form = results.length ? results.filter(r => r === 'W').length / results.length : 0.5;
  const baseline = Math.max(45, Math.min(82, 55 + form * 22 + (composure - 60) * 0.1));
  return Math.round((current + (baseline - current) * 0.12) * 10) / 10;
}
export function matchConfidenceChange(current: number, won: boolean, chance: number, final: boolean, mediaExpectations = false) {
  const expected = Math.max(0.05, Math.min(0.95, chance / 100));
  const delta = won ? 3 + (1 - expected) * 5 + (final ? 1 : 0) : -(2 + expected * 5 + Number(mediaExpectations));
  return Math.round((supportedConfidence(current, delta) - current) * 10) / 10;
}
