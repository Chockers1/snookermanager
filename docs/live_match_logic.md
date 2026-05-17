# Live Match Logic

This document describes the current match engine in the career simulator after the live-match upgrades.

It focuses on five layers:

1. How a match is seeded before the first ball is struck.
2. How live visits are resolved.
3. How attributes, confidence, fatigue, tactics, and opponent behaviour affect outcomes.
4. How the result screen and audit layer explain what happened.
5. What is still abstracted rather than fully simulated.

## 1. Match Flow Overview

The match pipeline works like this:

1. A tournament is entered and a draw is generated.
2. When a live match starts, the game creates a `LiveMatchState`.
3. The live match is seeded from the tournament context, player pathway state, rankings, opponent quality, equipment, travel readiness, and current attributes.
4. The player can then:
   - play visit by visit,
   - simulate a single visit,
   - play out the rest of the current frame,
   - simulate the current frame,
   - simulate the whole match.
5. When a frame or the full match completes, the normal tournament progression system updates rankings, prize money, confidence, fatigue, match history, and tournament draw progress.

## 2. Pre-Match Seeding

Before live play begins, the system builds a pre-match competitive model.

### 2.1 Match setup inputs

The match setup uses:

- player technical average
- player mental average
- player physical average
- current confidence
- current fatigue
- cue/equipment bonus
- travel readiness modifier
- opponent selection based on ranking band and event class
- tournament class and round difficulty
- access band and seeded protection
- pressure skill using `Big Match Nerve` and `Composure`

### 2.2 Match strength

The base player match strength is seeded from a weighted formula:

- technical: 40%
- mental: 30%
- physical: 15%
- confidence: 10%
- equipment bonus: additive
- fatigue: penalty

At this stage, the game is still modelling the overall match, not yet individual visits.

### 2.3 Opponent strength and win chance

The opponent strength is generated from:

- tournament class
- opponent ranking
- round difficulty
- event pressure
- seeded access adjustments

This produces:

- `plannedMatchWinChance`
- `plannedWinChance` for frame-level seeding
- `plannedPlayerStrength`
- `plannedOpponentStrength`

These values still matter later. The visit engine does not replace the match setup layer; it sits on top of it.

## 3. Live Match State

Once the live match starts, the engine stores:

- scoreboard state
- current frame
- current visit number
- points in the current frame
- current break
- frame table state (`tableState`) with reds remaining and ordered endgame colours
- player at table
- shot clock
- player and opponent confidence/fatigue
- pressure value and label
- tactical selections
- opponent archetype
- opponent approach
- coach prompt
- opponent adjustment history
- visit history

The match screen is therefore no longer just a display over a full-frame sim. It contains persistent state for the live session.

## 4. Visit-by-Visit System

The live engine now resolves the match visit by visit.

### 4.1 Available visit decisions

When the player is at the table, the engine can expose:

- `Pot Attempt`
- `Break Build`
- `Safety Exchange`
- `Snooker Hunt`
- `Respotted Black`

The last two are conditional.

`Snooker Hunt` appears when the player is behind and the remaining table points are no longer enough without foul points.

`Respotted Black` appears when:

- all endgame colours are gone, and
- the frame score is level.

When the opponent is at the table, the player can watch or simulate the opponent visit.

### 4.2 Opponent visit selection

The opponent does not choose randomly. Each rival is first assigned a deterministic archetype from their identity, so repeat meetings keep the same broad personality. The current opponent approach then informs the default visit style:

- `Serial Scorer`
- `Tactical Grinder`
- `Counter Puncher`
- `Tempo Disruptor`

- `Pressing` tends toward `Break Build`
- `Measured` tends toward `Pot Attempt`
- `Tight` tends toward `Safety Exchange`

The opponent archetype affects both the visit profile and the default approach bias. A `Serial Scorer` is naturally more aggressive, a `Tactical Grinder` is naturally tighter, and the others sit between those poles until scoreline, fatigue, or pressure force an adjustment.

The opponent can also switch into `Snooker Hunt` or `Respotted Black` mode when the frame state requires it.

## 5. Attribute-Driven Visit Profiles

The player now uses a dedicated live visit profile built from actual save attributes.

### 5.1 Player visit profile

The player visit profile is built from the active save using:

- `Long Potting`
- `Break Building`
- `Cue Ball Control`
- `Safety Play`
- `Consistency`
- `Composure`
- `Focus`
- `Big Match Nerve`
- `Hand Steadiness`
- `Stamina`

Equipment bonus is folded into parts of that profile, especially:

- cue ball control
- break building
- long potting
- safety play

### 5.2 Opponent visit profile

The opponent does not use the player's raw attribute sheet, because the opponent is not persisted as a full mirror player card.

Instead, the engine builds an opponent visit profile from:

- opponent ranking
- generated opponent strength from match setup

That gives the opponent a realistic live profile for:

- potting
- scoring
- safety
- composure
- nerve
- stamina

This is stronger than the earlier generic visit model because visit success is no longer based mostly on global confidence and tactical flags.

## 6. How Each Visit Type Uses Attributes

Each visit type now weights different skills.

### 6.1 Pot Attempt

Main drivers:

- `Long Potting`
- `Cue Ball Control`
- `Consistency`
- `Hand Steadiness`
- `Composure`

Typical role:

- normal scoring chance
- medium reward
- medium risk

### 6.2 Break Build

Main drivers:

- `Break Building`
- `Cue Ball Control`
- `Consistency`
- `Focus`
- `Stamina`

Typical role:

- higher upside
- better chance of a meaningful scoring visit
- higher fatigue cost
- more likely to keep the table on success

### 6.3 Safety Exchange

Main drivers:

- `Safety Play`
- `Focus`
- `Composure`
- `Cue Ball Control`
- `Big Match Nerve`

Typical role:

- lower direct scoring upside
- strong under pressure
- can reduce chaos and change the table pattern

### 6.4 Snooker Hunt

Main drivers:

- `Safety Play`
- `Focus`
- `Composure`
- `Big Match Nerve`
- `Cue Ball Control`

Typical role:

- late-frame recovery decision
- aims to force foul points rather than potting points
- becomes relevant when behind with little table value left

### 6.5 Respotted Black

Main drivers:

- `Long Potting`
- `Cue Ball Control`
- `Consistency`
- `Composure`
- `Big Match Nerve`
- `Hand Steadiness`

Typical role:

- special clutch decision when the frame is tied on the black
- pure pressure shot with no remaining table value

## 7. Success Chance Model

Visit success is not a single fixed number.

It now combines:

- decision-specific technical skill composite
- current confidence
- clutch / nerve component
- tactical edge
- decision bonus
- fatigue penalty
- defensive resistance from the opponent

The defensive resistance is stronger for tactical decisions like safety exchanges and snooker hunts.

This means a player with excellent break building but poor safety will feel different in the visit model from a player with the reverse profile.

At a practical level, the engine does this in two stages:

1. It builds a decision-specific skill composite from the visit profile.
2. It then adjusts that composite with current match-state modifiers.

The important match-state modifiers are:

- confidence shift
- clutch / nerve strength under pressure
- tactical matchup edge
- opponent defensive resistance
- fatigue drag

So the current model is closer to:

`visit quality = skill composite + confidence + clutch + tactical edge + decision bias - fatigue drag - resistance`

The exact weights differ by decision type, but the rule is consistent:

- scoring visits care more about potting, break building, and cue-ball control
- tactical visits care more about safety, focus, and composure
- clutch states care more about nerve, composure, and steadiness

That same logic is shared by manual play and the fast paths, so `Sim Visit`, `Sim Frame`, and `Sim Match` all resolve from the same visit framework rather than separate shortcut logic.

## 8. Fouls

Fouls are now part of the visit engine rather than being absent from the model.

### 8.1 Foul risk inputs

Foul risk rises with:

- harder decision types
- higher pressure
- higher fatigue

Foul risk falls with:

- `Consistency`
- `Focus`
- `Hand Steadiness`

### 8.2 Foul points

When a foul occurs, the other side is awarded foul points.

The current model uses a practical foul-point range of:

- 4 to 7 points

This is an abstraction over the full snooker foul rule set, but it is enough to create:

- tactical punishment
- pressure swings
- snooker-hunt comeback paths

## 9. Snookers

Snookers are represented through the `Snooker Hunt` visit decision.

This is not a full ball-position geometry model. Instead, it is a decision layer that says:

- the player is behind,
- the table is nearly gone,
- a normal scoring route may be insufficient,
- so the player hunts foul points.

If successful, the result is typically foul points rather than a standard potting visit.

This gives the game a real late-frame comeback mechanic without needing a physical table simulation.

## 10. Respotted Black

When the frame is level and no table value remains, the engine enters respotted-black mode.

In this state:

- the player can be offered `Respotted Black`
- the opponent can auto-play a respotted black visit when it is their turn

This replaces the earlier approach where a tied frame would simply auto-resolve in a simplified way.

Fast-path frame simulation can still resolve tied frames automatically, but live visit play now exposes the clutch black as a real decision state.

## 11. Confidence

Confidence matters in two places.

### 11.1 Pre-match

Confidence contributes to overall match strength and therefore to pre-match win chance.

### 11.2 During live play

Confidence affects visit success.

It also moves during the live match:

- good visits can increase confidence
- bad visits can reduce confidence
- coach cues can raise confidence
- timeouts can help confidence recover
- frame wins and losses adjust confidence more strongly

In short, confidence is both an input and a feedback loop.

## 12. Fatigue

Fatigue is also active before and during the match.

### 12.1 Pre-match

Fatigue is part of the player match-strength penalty.

### 12.2 During live play

Fatigue rises through visits and frames.

It matters more for:

- long or aggressive scoring choices
- break-building visits
- high-pressure sequences

Timeouts can reduce fatigue slightly.

This makes pacing meaningful: the player can push for heavy scoring, but it becomes harder to keep control later in the match.

## 13. Tactical Layer

The tactical layer still sits above the visit engine.

The player sets:

- frame plan
- mental focus
- tempo

These feed into tactical modifiers, including:

- win chance modifier
- volatility boost
- break bonus
- opponent break suppression
- pressure relief
- fatigue cost

Those tactical settings affect both full-frame fast paths and the visit engine.

## 14. Coach Cues

The coach system now does more than show flavour text.

The game generates a live coach prompt based on:

- scoreline
- pressure
- fatigue
- opponent approach

The player can then apply the coach cue, which:

- changes tactical selections to the recommended setup
- slightly boosts confidence
- can improve tactical edge for the next sequence

## 15. Opponent Adaptation

The opponent can adapt mid-match.

Current opponent approaches are:

- `Pressing`
- `Measured`
- `Tight`

Current opponent archetypes are:

- `Serial Scorer`
- `Tactical Grinder`
- `Counter Puncher`
- `Tempo Disruptor`

Shifts happen from:

- frame swings
- heavy pressure
- timeouts

The live screen keeps:

- the current opponent approach
- the latest opponent adjustment
- a short recent history of adjustment events

This is important because visit outcomes are no longer only about the player pressing buttons. The opponent is now reacting to match state.

## 16. Fast Paths Still Available

The match still supports faster progression:

- `Sim Visit`
- `Play Out Frame`
- `Sim Frame`
- `Sim Match`

The important design change is that the frame fast paths now run through the visit engine instead of using a completely separate abstract frame result.

That keeps behaviour more consistent between:

- manual visit play
- partial sim
- full frame fast-forward

## 17. What Is Still Abstracted

The live engine is much richer than before, but it is still not a full shot physics simulation.

Current abstractions include:

- reds are still abstracted into red-phase chunks rather than a full 15-red table map
- the endgame is explicit colour-by-colour from yellow through black, but not full shot geometry
- there is no exact cue-ball path, contact angle, or positional geometry
- snookers are modelled as a decision-and-foul system, not a true table trap solver
- fouls use practical point bands rather than a full foul taxonomy
- opponent attributes are inferred from rank and strength rather than loaded from a full opponent career sheet, but the archetype is persistent for the rival identity

These are deliberate tradeoffs to keep the system playable inside a career-management game.

## 18. Practical Reading Of The System

The easiest way to think about the current engine is:

- match setup decides what kind of contest this should be overall
- visit profiles decide what each player is actually good at shot-to-shot
- tactics decide how aggressively or safely the player is trying to solve the frame
- confidence and fatigue decide whether the player can execute those choices right now
- opponent adaptation decides whether the same plan still works as the match changes

## 19. Current Gameplay Consequences

As implemented right now:

- a high `Break Building` player should feel better when choosing `Break Build`
- a player with poor `Safety Play` and `Focus` will be less reliable in tactical exchanges
- a composed player with strong `Big Match Nerve` is better equipped for the black-ball moment
- high fatigue and low steadiness make fouls more likely
- late-frame deficits create real tactical branches instead of just waiting for a frame result

## 20. Reporting Layer

The live engine does not stop when the final frame ends. It also writes a reporting layer used by the match result screen and the audit scripts.

### 20.1 Match data persisted after the match

When the match finalises, the save stores the main pre-match and in-match explanation fields on the latest match record, including:

- planned win chance
- final displayed win probability
- player strength
- opponent strength
- opponent rank band
- tournament class
- frame history

That means the result screen is not trying to guess after the fact. It is reading the same seeded model that was used when the match was created, then combining it with the actual stat line from the played match.

### 20.2 Result screen sections

The match result page is currently built from six explanation blocks:

- `Match Summary`: tournament, round, best-of, expected win chance, and the actual scoreline margin
- `Strength Breakdown`: technical, mental, physical, confidence, fatigue, and equipment comparisons
- `Match Modifiers`: format, pressure, fatigue, confidence, equipment familiarity, and tactical fit
- `Why The Result Happened`: short natural-language explanation from the strongest signals
- `Improvement Advice`: next training or preparation priorities
- `Pressure Diagnosis`: quarter-final-plus record, semi-final conversion, final conversion, decider record, and a pressure trait label

### 20.3 Calculation rules used by the result screen

The result page re-derives a few explanation values from the stored match plus the current player state.

`strength edge`

- `playerStrength - opponentStrength`

`pre-match confidence`

- current confidence minus the confidence delta earned or lost in the completed match

`pre-match fatigue`

- current fatigue minus the fatigue change from the completed match

`equipment modifier`

- `clamp(round((familiarity - 60) / 10 + (condition - 70) / 15), -4, 6)`

`confidence modifier`

- `clamp(round((preMatchConfidence - 55) / 6), -6, 8)`

`fatigue impact`

- starts once pre-match fatigue rises above `22`
- scales harder in longer matches
- denominator is `4` for best-of `19+`, `6` for best-of `11-17`, `8` for shorter formats
- final value is stored as a negative drag capped between `0` and `-12`

`format impact`

- longer matches reward the stronger baseline profile
- short matches compress the edge and increase upset risk
- best-of `11+` uses positive scaling from strength edge
- short formats invert that logic into volatility pressure

`pressure impact`

- `clamp(round((Composure + Big Match Nerve + preMatchConfidence) / 30 - roundPressureWeight - longMatchPenalty), -10, 6)`
- the long-match penalty is `2` for best-of `19+`, `1` for best-of `11-17`, and `0` otherwise

`tactical fit`

- `clamp(round(((potSuccess + longPotSuccess + safetySuccess) / 3 - 60) / 6), -5, 6)`

Those values are not the match engine itself. They are the explanation layer that translates the engine's seeded strength and the final stat line into something readable by the player.

### 20.4 Pressure diagnosis rules

The pressure diagnosis block is deliberately career-wide rather than match-local.

It looks at:

- all quarter-final-or-later matches
- all semi-finals
- all finals
- all matches that reached a decider

From that it builds:

- quarter-final-plus record
- semi-final conversion
- final conversion
- decider record
- a pressure trait label and diagnosis string

So the page is answering two different questions:

- why did this match go this way?
- what does your bigger pressure profile currently look like?

## 21. Canonical Result Accounting

The reporting layer now uses a shared canonical round-record helper instead of relying on ad-hoc string checks.

### 21.1 What the helper does

The canonical helper starts from:

- tournament field size
- the recorded result string such as `Winner`, `Lost in Quarter Final`, or `Advanced to Final`

From that it derives:

- expected matches played
- expected wins
- expected losses
- whether the run counts as a title
- whether it counts as a final
- whether it counts as a deep run
- the resolved round reached

### 21.2 Where it is now used

The shared round-record logic now feeds:

- the human match-count audit
- ranking main-draw and final sub-records in the simulation reports
- season best-result summaries in archive records
- recent major-final counts used by rank-floor and career-stage logic
- support-profile comparison summaries that count finals, deep runs, and major finishes

### 21.3 Why this matters

Without canonical round accounting, different parts of the game can interpret the same result string differently.

Examples:

- `Advanced to Final` can be misread as already being a final result instead of a semi-final win
- a short-format event and a long-format event can be given the same textual label but imply different expected match counts
- audit warnings can appear to be match-engine problems when they are really event-selection or schedule-volume issues

The current split is now:

- `human-match-count-audit.md` checks canonical round accounting and result-report consistency
- `player-event-volume-audit.md` checks whether the player is entering a plausible number of events
- `tournament-calendar-audit.md` checks the calendar structure and access windows
- the support comparison report now prints a separate `Match Engine Verdict` and `Calendar / Event Selection Verdict`

## 22. What Is Still Abstracted

The live engine is much richer than before, but it is still not a full shot physics simulation.

Current abstractions include:

- reds are still abstracted into red-phase chunks rather than a full 15-red table map
- the endgame is explicit colour-by-colour from yellow through black, but not full shot geometry
- there is no exact cue-ball path, contact angle, or positional geometry
- snookers are modelled as a decision-and-foul system, not a true table trap solver
- fouls use practical point bands rather than a full foul taxonomy
- opponent attributes are inferred from rank and strength rather than loaded from a full opponent career sheet, but the archetype is persistent for the rival identity

These are deliberate tradeoffs to keep the system playable inside a career-management game.

## 23. Recommended Next Steps

If the model needs to go deeper still, the most natural follow-on upgrades now are:

1. Separate foul types and severities while keeping the current comeback logic.
2. Add richer late-frame table-state detail for safety exchanges on the colours.
3. Persist fuller opponent attribute sheets instead of only inferred live profiles.
4. Let coach specialisms alter live decision weights directly, not just recommendations.
5. Add a true positional shot model if the game ever needs to move beyond visit-level abstraction.

At the current stage, the system is best described as a visit-by-visit tactical snooker engine with a full explanation layer for result diagnostics and audit reporting, rather than a pure table-physics simulator.