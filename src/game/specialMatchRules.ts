import type { GameState } from '../hooks/useGameState';
type Live = NonNullable<GameState['liveMatch']>;
export type SpecialMatchState = { rules: string[]; elapsedSeconds: number; playerHandicap?: number; opponentHandicap?: number; ballInHand?: boolean; frameComplete?: boolean; tieBall?: 'Blue' | 'Black'; tiePlayerPot?: boolean; tieAttempt?: number; goldenAttemptFrame?: number };
const cap = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const colourPoints = { Yellow: 2, Green: 3, Brown: 4, Blue: 5, Pink: 6, Black: 7 };
export function shootOutClock(seconds: number) { return seconds < 300 ? 15 : 10; }
function note(live: Live, text: string): Live {
  return { ...live, lastVisitSummary: text, feed: [{ id: `special:${live.currentFrame}:${live.currentVisit}`, actor: 'System' as const, tone: 'blue' as const, time: live.special?.tieBall ? 'Shoot-out' : `${Math.floor((600 - (live.special?.elapsedSeconds ?? 0)) / 60)}:${String(Math.floor((600 - (live.special?.elapsedSeconds ?? 0)) % 60)).padStart(2, '0')}`, text }, ...live.feed].slice(0, 80) };
}
/** Alternate attempts, with equal attempts before deciding the winner. */
export function stepBallShootOut(live: Live, ball: 'Blue' | 'Black', random = Math.random): Live {
  const special = { ...live.special!, tieBall: ball, tieAttempt: (live.special?.tieAttempt ?? 0) + 1 };
  const first = special.tieAttempt % 2 === 1;
  const profile = first ? live.playerVisitProfile : live.opponentVisitProfile;
  const potted = random() < cap(.35 + profile.longPotting * .004, .35, .85);
  let next: Live = { ...live, special, currentVisit: live.currentVisit + 1, currentBreak: 0 };
  if (first) special.tiePlayerPot = potted;
  else if (special.tiePlayerPot !== potted) {
    special.frameComplete = true;
    if (special.tiePlayerPot) next.playerPoints += colourPoints[ball]; else next.opponentPoints += colourPoints[ball];
  }
  next = note(next, `${ball}-ball shoot-out · ${first ? live.playerName : live.opponentName} ${potted ? 'pots' : 'misses'}.${special.frameComplete ? ' Equal attempts completed; the frame is decided.' : ''}`);
  return next;
}
/** One simulated shot, including shot-clock fouls and the ten-minute frame limit. */
export function stepShootOut(live: Live, decision = 'Pot Attempt', random = Math.random): Live {
  if (live.special?.tieBall) return stepBallShootOut(live, 'Blue', random);
  const special = { ...live.special! }, actor = live.playerAtTable === live.playerName;
  const profile = actor ? live.playerVisitProfile : live.opponentVisitProfile;
  const limit = shootOutClock(special.elapsedSeconds);
  const seconds = 4 + Math.floor(random() * (live.tempo === 'Deliberate' ? 14 : live.tempo === 'Quick' ? 8 : 12));
  const remaining = 600 - special.elapsedSeconds;
  // The timekeeper ends the frame before a shot whose clock would expire after time.
  if (Math.min(seconds, limit) >= remaining) {
    special.elapsedSeconds = 600;
    special.frameComplete = live.playerPoints !== live.opponentPoints;
    if (!special.frameComplete) special.tieBall = 'Blue';
    return note({ ...live, special, timeElapsedMinutes: 10, shotClock: 0 }, special.frameComplete ? 'Ten minutes elapsed. The higher score wins.' : 'Ten minutes elapsed with scores level. Blue-ball shoot-out, equal attempts.');
  }
  special.elapsedSeconds += Math.min(seconds, limit);
  const table = { ...live.tableState, coloursRemaining: [...live.tableState.coloursRemaining] };
  const ball = table.ballOn === 'Colour' ? 'Black' : table.redsRemaining > 0 ? 'Red' : table.coloursRemaining[0];
  const value = ball === 'Red' ? 1 : ball ? colourPoints[ball] : 0;
  const safety = /Safety|Snooker/.test(decision);
  const clockFoul = seconds > limit;
  const foul = clockFoul || random() < .035;
  const pot = !foul && !safety && random() < cap(.3 + profile.breakBuilding * .006 + (special.ballInHand ? .15 : 0), .3, .94);
  let a = live.playerPoints, b = live.opponentPoints;
  const stats = { ...(actor ? live.playerStats : live.opponentStats) };
  stats.visits++; if (!safety) stats.potAttempts++; else stats.safetyAttempts++;
  let text: string;
  if (foul) {
    const penalty = Math.max(4, value); if (actor) b += penalty; else a += penalty;
    stats.fouls++; special.ballInHand = true;
    text = `${actor ? live.playerName : live.opponentName}: ${clockFoul ? `${limit}-second shot-clock foul` : 'foul (including the cushion requirement)'}. ${penalty} points and cue ball in hand anywhere for the incoming player. No foul-and-miss replacement.`;
  } else {
    special.ballInHand = false;
    if (pot) {
      stats.potsMade++; stats.pointsScored += value;
      if (actor) a += value; else b += value;
      if (ball === 'Red') { table.redsRemaining--; table.ballOn = 'Colour'; }
      else if (table.ballOn === 'Colour') table.ballOn = table.redsRemaining ? 'Red' : 'Colours';
      else { table.coloursRemaining.shift(); table.ballOn = 'Colours'; }
    } else if (table.ballOn === 'Colour') table.ballOn = table.redsRemaining ? 'Red' : 'Colours';
    text = `${actor ? live.playerName : live.opponentName}: ${pot ? `pots ${ball?.toLowerCase()} for ${value}` : safety ? 'legal safety; cushion reached' : 'misses; cushion reached'}. ${Math.ceil(600 - special.elapsedSeconds)} seconds remain.`;
  }
  const run = pot ? live.currentBreak + value : 0;
  if (table.coloursRemaining.length === 0) { special.frameComplete = a !== b; if (!special.frameComplete) special.tieBall = 'Blue'; }
  return note({ ...live, special, tableState: table, playerPoints: a, opponentPoints: b, currentBreak: run, currentVisit: live.currentVisit + 1,
    playerAtTable: pot ? live.playerAtTable : actor ? live.opponentName : live.playerName,
    playerStats: actor ? stats : live.playerStats, opponentStats: actor ? live.opponentStats : stats,
    playerHighestBreak: actor ? Math.max(live.playerHighestBreak, run) : live.playerHighestBreak,
    opponentHighestBreak: actor ? live.opponentHighestBreak : Math.max(live.opponentHighestBreak, run),
    playerFifties: live.playerFifties + (actor && pot && live.currentBreak < 50 && run >= 50 ? 1 : 0),
    playerMaximums: live.playerMaximums === undefined ? undefined : live.playerMaximums + Number(actor && pot && live.currentBreak < 147 && run === 147),
    playerCenturies: live.playerCenturies + (actor && pot && live.currentBreak < 100 && run >= 100 ? 1 : 0),
    timeElapsedMinutes: special.elapsedSeconds / 60, shotClock: shootOutClock(special.elapsedSeconds),
    ballsRemaining: table.redsRemaining * 2 + table.coloursRemaining.length,
  }, text);
}
export function attemptGoldenBall(live: Live, random = Math.random): Live {
  if (!live.special?.rules.includes('goldenBall') || live.currentBreak !== 147 || live.special.goldenAttemptFrame === live.currentFrame) return live;
  const actor = live.playerAtTable === live.playerName;
  const potted = random() < cap(.3 + (actor ? live.playerVisitProfile.longPotting : live.opponentVisitProfile.longPotting) * .006, .3, .9);
  return note({ ...live, special: { ...live.special, goldenAttemptFrame: live.currentFrame }, currentBreak: potted ? 167 : 147,
    playerPoints: live.playerPoints + (actor && potted ? 20 : 0), opponentPoints: live.opponentPoints + (!actor && potted ? 20 : 0),
    playerHighestBreak: actor && potted ? 167 : live.playerHighestBreak, opponentHighestBreak: !actor && potted ? 167 : live.opponentHighestBreak,
  }, `147 maximum: ${actor ? live.playerName : live.opponentName} ${potted ? 'pots the golden ball for a 167' : 'misses the golden ball'}.`);
}

export function handicapAllowance(playerRank: number, opponentRank: number) { return { playerHandicap: cap((playerRank - opponentRank) * 2, 0, 28), opponentHandicap: cap((opponentRank - playerRank) * 2, 0, 28) }; }
