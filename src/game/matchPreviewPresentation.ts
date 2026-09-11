/** Public ability comparison, not win odds and never a comparison of ranks from different circuits. */
export function previewDifficulty(playerOverall: number, opponentOverall?: number) {
  if (opponentOverall == null || !Number.isFinite(opponentOverall)) return 'Unknown strength';
  const edge = playerOverall - opponentOverall;
  if (edge >= 5) return 'Higher rated';
  if (edge <= -5) return 'Lower rated';
  return 'Similar ratings';
}
