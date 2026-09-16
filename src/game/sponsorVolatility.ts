export const SPONSOR_VOLATILITY = {
  patient: { label: 'Patient', multiplier: 0.7 },
  steady: { label: 'Steady', multiplier: 0.85 },
  balanced: { label: 'Balanced', multiplier: 1 },
  reactive: { label: 'Reactive', multiplier: 1.2 },
  volatile: { label: 'Volatile', multiplier: 1.4 },
} as const;
export type SponsorVolatility = keyof typeof SPONSOR_VOLATILITY;
type SponsorIdentity = { name: string; volatility?: SponsorVolatility };

/** Company identity, not seasonal offer IDs or random rolls, defines temperament. */
export function sponsorVolatility(sponsor: SponsorIdentity) {
  let key = sponsor.volatility;
  if (!key || !Object.hasOwn(SPONSOR_VOLATILITY, key)) {
    let hash = 2166136261;
    for (const c of sponsor.name.trim().toLowerCase().replace(/\s+/g, ' ')) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
    const levels = Object.keys(SPONSOR_VOLATILITY) as SponsorVolatility[];
    key = levels[(hash >>> 0) % levels.length];
  }
  return { key, ...SPONSOR_VOLATILITY[key] };
}

export function sponsorVolatilityDescription(sponsor: SponsorIdentity) {
  const profile = sponsorVolatility(sponsor);
  return `${profile.label} volatility · ${Math.round(profile.multiplier * 100)}% result reaction. Wins and defeats move satisfaction ${profile.multiplier < 1 ? 'more slowly' : profile.multiplier > 1 ? 'more sharply' : 'at the standard rate'}; at most ${(5 * profile.multiplier).toFixed(2)} points per match. Warning thresholds and the six-match recovery period stay the same.`;
}
