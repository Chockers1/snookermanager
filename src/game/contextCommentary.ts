import type { LiveMatchState } from '../hooks/useGameState';
export function frameStory(live: Pick<LiveMatchState,'playerName'|'opponentName'|'frameHistory'|'playerFrames'|'opponentFrames'|'bestOf'|'framesNeeded'>, playerWon: boolean) {
  const name = playerWon ? live.playerName : live.opponentName;
  const own = playerWon ? live.playerFrames : live.opponentFrames, other = playerWon ? live.opponentFrames : live.playerFrames;
  let balance=0, worst=0;
  for (const frame of live.frameHistory) { balance += frame.winner===name ? 1 : -1; worst=Math.min(worst,balance); }
  if (worst<=-2 && own+1>other) return `${name} ${own+1>=live.framesNeeded?'completes':'moves ahead in'} the comeback after trailing by ${-worst} frames.`;
  if (live.bestOf>1 && live.bestOf%2===1 && own+1===live.framesNeeded-1 && other===live.framesNeeded-1) return 'We are going to a deciding frame. One last chance for both players.';
  if (own+1===other && other>=2) return `${name} brings the match level at ${other}–${other}.`;
  return '';
}
export function visitStory(args: { actorName: string; success: boolean; foul: boolean; pot: boolean; previousBreak: number; breakTotal: number; personalBest?: number; previousMatchBest: number; player: boolean; pointsBefore: number; otherPoints: number; remaining: number }) {
  const a=args;
  if (a.player && a.success && a.personalBest !== undefined && a.personalBest>0 && a.breakTotal>a.personalBest && a.previousBreak<=a.personalBest && a.previousMatchBest<=a.personalBest) return `${a.actorName} passes their recorded career best of ${a.personalBest}.`;
  if (a.success && a.breakTotal>=100 && a.previousBreak<100) return `A century for ${a.actorName}; the break reaches ${a.breakTotal}.`;
  if (!a.success && !a.foul && a.pot && a.previousBreak>=30) return `${a.actorName}'s scoring chance ends on ${a.previousBreak}; the opponent has another opening.`;
  if (!a.success && !a.foul && a.pot && a.pointsBefore>a.otherPoints && a.pointsBefore-a.otherPoints<=a.remaining && a.remaining<=27) return `${a.actorName} misses with the frame still in reach on the colours.`;
  return '';
}
