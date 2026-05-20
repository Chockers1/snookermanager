# Snooker Career Manager Match Experience Specification for Bolt

## Purpose of this document

This is a separate, match-only handoff document for Bolt.

It should be used to design the full Match Centre experience, including:

- Match Preview
- Live Match
- Match Result
- the underlying match logic and decision model
- the attributes that affect match outcomes
- all information, controls, and feedback the player should see while a match is being played

This document is intentionally more detailed than the main UI spec because the match experience is the most game-like, most emotionally important, and most information-sensitive part of the product.

## Product role of the match experience

The match flow is the payoff loop of the whole career sim.

Everything else in the game exists to influence what happens here:

- training improves the relevant match attributes
- staff affects preparation and match support
- equipment changes reliability and bonuses
- finance determines whether the player can afford the best prep
- travel affects readiness
- confidence and fatigue carry into the match
- rankings, prize money, and reputation are largely shaped by match results

For Bolt, this means the match UI cannot feel like a generic table of stats. It must feel like a tense sports-control experience with visible consequences.

## Match experience goals

Bolt should design the match journey to deliver five things at all times:

1. clarity
2. tension
3. tactical agency
4. momentum feedback
5. payoff

### Clarity

The player must always understand:

- the current score
- who is at the table
- what phase the frame is in
- what the available decisions are
- what the likely risks are

### Tension

The UI should make pressure, score swings, and clutch moments feel dramatic.

### Tactical agency

The player should feel that tactical plan, focus, tempo, timeouts, and visit choices matter.

### Momentum feedback

The UI should constantly show when the match is turning.

### Payoff

The result screen should explain not only what happened, but why it happened.

## Match route map

The match experience is spread across three primary routes and several supporting transitions.

### Primary match routes

- Match Preview: `/match/preview`
- Live Match: `/match/live`
- Match Result: `/match/result`

### Supporting routes in the wider match loop

- Tournament Hub: `/tournaments/hub`
- Tournament Draw: `/tournaments/draw`
- Calendar: `/calendar`
- Travel Planner: `/travel`
- Training Report: `/training/report`
- Equipment area: `/equipment/cues` and related routes

## End-to-end match flow

### Stage 1: Pre-match setup

The player reaches Match Preview after tournament entry and prep.

The system seeds the match from:

- tournament class
- round difficulty
- opponent ranking band
- player technical, mental, and physical profile
- confidence
- fatigue
- equipment state
- travel readiness
- pressure context

### Stage 2: Live match creation

When the player starts the match, the game creates a persistent live-match session.

This session tracks:

- frame score
- current frame and visit
- points in the frame
- break state
- table state
- current player at the table
- player and opponent condition
- tactical selections
- pressure and momentum
- opponent behaviour changes
- visit history

### Stage 3: Live decisions

During live play the player can:

- choose a visit decision when at the table
- watch the opponent visit
- simulate a visit
- play out the current frame
- simulate the frame
- simulate the full match
- change tactical plan
- change mental focus
- change tempo
- apply a coach cue
- use a timeout

### Stage 4: Result and explanation

When the match completes, the app updates:

- prize money
- ranking points
- confidence
- fatigue
- tournament progression
- match history
- frame history
- result explanation data

The result screen then turns the match outcome into readable player-facing feedback.

## Design direction for Bolt

### Overall visual direction

The match flow should feel more broadcast-like and more intense than the rest of the product.

It should combine:

- live sports presentation
- tactical control panel energy
- premium snooker atmosphere
- management-sim clarity

### Screen personality by route

#### Match Preview

Should feel like a pre-broadcast package and tactical briefing.

#### Live Match

Should feel like a live command center.

#### Match Result

Should feel like a post-match studio breakdown.

### Strong visual themes Bolt should emphasize

- scoreline hierarchy
- momentum shifts
- pressure state
- phase-of-frame clarity
- tactical consequence
- coach and opponent adaptation

## Match logic summary for UI design

Bolt does not need to expose raw formulas, but it does need to design around the real logic model.

The current engine has five layers:

1. pre-match seeding
2. visit-by-visit resolution
3. tactical and psychological modifiers
4. opponent adaptation
5. result explanation and audit reporting

## 1. Pre-match seeding model

Before the live match starts, the game builds an overall competitive model.

### Inputs used in match setup

- player technical average
- player mental average
- player physical average
- current confidence
- current fatigue
- cue and equipment bonus
- travel readiness modifier
- opponent quality
- tournament class
- round pressure
- seeded access or ranking protection
- pressure skill from `Big Match Nerve` and `Composure`

### What the engine produces before live play

- planned match win chance
- frame-level expected win chance
- planned player strength
- planned opponent strength

### UI implication for Bolt

The preview and result screens should communicate expectation and matchup difficulty clearly, but they should do it in readable, narrative terms rather than showing raw hidden equations.

Good examples of player-facing phrasing:

- slight favorite
- toss-up match
- difficult underdog test
- long-format edge favors the stronger baseline player
- fatigue is dragging the expected level down

## 2. Live match state model

Once the live match begins, the game tracks a persistent `LiveMatchState`.

### Important live-match state fields

- tournament and round
- best-of format and frames needed
- player and opponent names
- opponent ranking
- opponent archetype
- current frame score
- current frame number
- player and opponent points in the frame
- current visit number
- current break
- table state
- player at table
- shot clock
- player confidence and fatigue
- opponent confidence and fatigue
- pressure value and label
- tactical plan
- mental focus
- tempo
- timeouts remaining
- tactical edge
- coach prompt
- opponent approach
- opponent adjustment history
- momentum history
- frame history
- visit history
- live status

### UI implication for Bolt

The live screen should be built as a genuine stateful match console, not just a score page with a few buttons.

## 3. Match phases the UI must understand

The live UI must react to the current frame phase.

### Reds phase

This is the normal early and middle frame state while reds remain.

The UI should show:

- reds remaining
- expected scoring opportunities
- standard visit decisions

### Colours clearance

When reds are gone, the frame becomes an ordered color sequence.

The UI should show:

- current target color
- points remaining on the table
- whether the player is ahead, level, or behind
- whether normal scoring is still enough

### Snooker phase

If the player is behind by more than the remaining table value, the UI should signal a recovery state.

The UI should show:

- that the player needs snookers
- why a normal scoring route is insufficient
- that `Snooker Hunt` is now available

### Respotted black state

If the frame is tied after all colors are gone, the UI should enter a special clutch state.

The UI should show:

- respotted black status
- a unique decision mode label
- a more dramatic visual treatment
- a simplified set of relevant actions

## 4. Visit decisions and what they mean

The player does not choose individual cue-ball geometry. The player chooses a visit intention.

### Standard decisions

- `Pot Attempt`
- `Break Build`
- `Safety Exchange`

### Conditional decisions

- `Snooker Hunt`
- `Respotted Black`

### Player-facing meaning of each option

#### Pot Attempt

- the balanced default scoring option
- moderate upside
- moderate risk
- good for normal chances and steady scoring

#### Break Build

- the high-upside attacking option
- more likely to create meaningful scoring visits
- more likely to retain the table on success
- costs more energy and carries more collapse risk under pressure or fatigue

#### Safety Exchange

- lower direct scoring upside
- better for pressure control
- stronger in tactical or messy table states
- useful when the opponent is scoring heavily or the player needs to settle

#### Snooker Hunt

- late-frame comeback option
- aims to force fouls rather than score normally
- should only appear when the frame state requires it

#### Respotted Black

- ultra-clutch final-ball decision state
- should feel special, high pressure, and visually distinct from normal play

## 5. Attribute model for match play

This is one of the most important sections for Bolt because the UI should make these attribute influences legible.

The current live visit profile uses these player attributes:

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

### Supporting match-state factors

- confidence
- fatigue
- equipment condition and familiarity
- tactical plan
- mental focus
- tempo
- pressure state
- opponent resistance
- opponent archetype and current approach

## 6. Attribute-to-decision mapping

Bolt should use this mapping when designing tooltips, side panels, badges, and decision explanations.

### Pot Attempt is driven mainly by

- `Long Potting`
- `Cue Ball Control`
- `Consistency`
- `Hand Steadiness`
- `Composure`

### Break Build is driven mainly by

- `Break Building`
- `Cue Ball Control`
- `Consistency`
- `Focus`
- `Stamina`

### Safety Exchange is driven mainly by

- `Safety Play`
- `Focus`
- `Composure`
- `Cue Ball Control`
- `Big Match Nerve`

### Snooker Hunt is driven mainly by

- `Safety Play`
- `Focus`
- `Composure`
- `Big Match Nerve`
- `Cue Ball Control`

### Respotted Black is driven mainly by

- `Long Potting`
- `Cue Ball Control`
- `Consistency`
- `Composure`
- `Big Match Nerve`
- `Hand Steadiness`

## 7. Confidence, fatigue, and pressure

These should be treated as live systems, not passive stats.

### Confidence

Confidence affects:

- pre-match win expectation
- live visit success
- resilience after bad sequences
- response to coach cues and frame swings

Confidence can change during the match because of:

- strong visits
- poor visits
- frame wins
- frame losses
- coach cues
- timeouts

### Fatigue

Fatigue affects:

- pre-match match strength
- late-match drop-off
- foul risk
- difficulty sustaining break-building play
- ability to hold quality in long or high-pressure frames

Fatigue rises more through:

- aggressive scoring choices
- long frames
- repeated visits
- pressure-heavy sequences

Timeouts can slightly relieve fatigue.

### Pressure

Pressure is one of the key dramatic systems in the match UI.

It should be visible as both:

- a quantitative indicator
- a human-readable label or state

Pressure should feel connected to:

- current scoreline
- round importance
- frame importance
- decider situations
- respotted black moments

## 8. Foul logic and comeback states

### Foul risk inputs

Foul risk rises with:

- harder decision types
- higher pressure
- higher fatigue

Foul risk falls with:

- `Consistency`
- `Focus`
- `Hand Steadiness`

### Foul points

The engine currently uses practical foul awards in the 4-to-7-point range.

### UI implication for Bolt

The live screen should surface foul swings as meaningful tactical events, especially during safety exchanges, snooker hunts, and late-frame pressure moments.

## 9. Tactical layer

Above the raw visit model sits a tactical layer.

### Tactical settings controlled by the player

- frame plan: `Attack`, `Balanced`, `Safety`
- mental focus: `Composed`, `Confident`, `Counter`
- tempo: `Steady`, `Quick`

### What tactics affect behind the scenes

- tactical edge
- volatility
- break scoring upside
- suppression of the opponent rhythm
- pressure handling
- fatigue cost

### UI implication for Bolt

The tactical controls should feel important and accessible without cluttering the screen.

Changing tactics should visibly update:

- selected-state treatment
- current tactical summary
- tactical edge readout
- a short human-readable explanation of what the current setup is trying to do

## 10. Coach cues and timeouts

### Coach cues

The coach system is not just flavor.

The game generates a live coach prompt based on:

- scoreline
- pressure
- fatigue
- opponent approach

Applying the coach cue can:

- shift tactical selections to the recommended setup
- give a small confidence boost
- improve tactical edge for the next sequence

### Timeouts

Timeouts are limited.

They can:

- help reset rhythm
- help recover confidence
- reduce fatigue slightly
- trigger or interrupt opponent adaptation patterns

### UI implication for Bolt

Coach cues and timeouts should feel meaningful and scarce. They should be presented as high-value intervention tools, not secondary admin buttons.

## 11. Opponent model and adaptation

The opponent has both a broad identity and a current tactical posture.

### Opponent archetypes

- `Serial Scorer`
- `Tactical Grinder`
- `Counter Puncher`
- `Tempo Disruptor`

### Opponent approaches

- `Pressing`
- `Measured`
- `Tight`

### What can cause adaptation

- frame swings
- pressure spikes
- timeouts
- fatigue changes

### UI implication for Bolt

The player should be able to read the opponent as a living tactical entity.

The live screen should show:

- the current opponent archetype
- the current approach
- the latest adjustment
- the reason for the adjustment if available
- a short history of the recent changes

## 12. Fast-forward and simulation paths

The system supports different play depths.

### Available speed controls

- watch or simulate the current visit
- play out the current frame
- simulate the current frame
- simulate the full match

### Important rule for Bolt

These are not separate disconnected systems. They all route through the same visit engine, so the UI should make them feel like speed modes on the same simulation, not like unrelated shortcuts.

## Screen-by-screen specification

---

## 1. Match Preview

### Route

`/match/preview`

### Purpose

This screen prepares the player emotionally and tactically before the match starts.

It should answer:

- how difficult is this match
- who is the opponent really
- what are my strengths here
- what is my biggest risk
- am I ready to start right now

### Current content that must be preserved

- player identity card
- ranking card
- recent form strip
- confidence card
- funds card
- next event card
- head-to-head module
- opponent scout report
- tactical plan panel
- equipment check panel
- mental readiness panel
- recent results for both players
- match information panel
- actions to start or resume the match
- actions to adjust training or change equipment

### Match Preview ideal page structure for Bolt

#### Top hero band

- event name
- round
- match format
- player vs opponent identity treatment
- immediate readiness verdict

#### Left main zone

- player card
- opponent card
- head-to-head story
- strengths and weaknesses comparison
- pre-match tactical plan

#### Right support zone

- equipment readiness
- mental readiness
- match conditions
- travel/arena conditions
- primary CTA to start the match

#### Lower analysis zone

- recent form for both players
- scout notes
- matchup narrative
- risk factors

### Information that should be visible on Match Preview

- opponent ranking
- opponent style or archetype summary
- player confidence
- player fatigue
- cue familiarity
- cue, chalk, and tip condition
- likely pressure level
- tactical recommendations
- recent meeting history
- recent form comparison
- key danger areas
- best chance of advantage

### Extra recommended additions Bolt should include

- a clearer matchup difficulty badge such as Favorite, Even, or Underdog
- a pre-match readiness score
- a short plain-English summary such as "Strong cueing edge, but fatigue is a concern"
- a compact panel showing which attributes matter most in this specific match
- a note on long-format vs short-format implications

---

## 2. Live Match

### Route

`/match/live`

### Purpose

This is the live control surface for visit-by-visit snooker play.

This screen must make the player feel:

- in control
- informed
- under pressure
- tactically engaged

### Current content that must be preserved

- player and opponent identity header
- frames scoreline
- current visit module
- points on table
- target ball
- decision mode label
- latest visit summary
- momentum chart
- pressure meter
- player state panel
- visit log
- frame history
- match information card
- coach corner
- opponent adjustments panel
- tactical settings panel
- interval information panel
- live decision buttons
- simulation buttons
- pause action

## Live Match layout blueprint for Bolt

Bolt should design this as a true match HUD.

### Zone A: Persistent top scoreboard

This must always be visible.

#### Must show

- tournament name
- round
- best-of format
- player name
- opponent name
- frames score
- current frame number
- player confidence
- opponent confidence
- player fatigue
- opponent fatigue
- opponent ranking
- opponent archetype

### Zone B: Central live frame panel

This is the heart of the screen.

#### Must show

- player points in the current frame
- opponent points in the current frame
- current visit number
- current break
- player at table
- shot clock
- table-state label
- target ball
- points on table
- decision mode
- latest visit summary

### Zone C: Pressure and momentum panel

#### Must show

- pressure meter
- pressure label
- momentum chart or momentum rail
- current match swing note

### Zone D: Tactical control panel

#### Must show

- selected frame plan
- selected mental focus
- selected tempo
- tactical edge value
- opponent approach
- last tactical note

#### Controls required

- set frame plan
- set mental focus
- set tempo
- use timeout

### Zone E: Coach and opponent intelligence panel

#### Must show

- current coach prompt title
- coach note
- recommended plan
- recommended focus
- recommended tempo
- apply coach cue action
- latest opponent adjustment
- adjustment trigger
- approach shift from and to
- short history of recent opponent adjustments

### Zone F: Match log and history panel

#### Must show

- visit history log
- frame history table
- latest key events

### Zone G: Decision action bar

This is the most important interaction area.

#### If player is at the table, show:

- `Pot Attempt`
- `Break Build`
- `Safety Exchange`
- `Snooker Hunt` when available
- `Respotted Black` when available

#### If opponent is at the table, show:

- `Watch Opponent Visit`

#### Also always show fast-path controls:

- `Sim Visit`
- `Play Out Frame`
- `Sim Frame`
- `Sim Match`
- `Pause`

## Everything the user should ideally see while a match is live

This is the exhaustive player-facing list Bolt should treat as the match HUD content inventory.

### Core scoreboard information

- tournament name
- tournament stage or round
- best-of format
- frames needed to win
- player frames won
- opponent frames won
- current frame number
- current frame points for both players

### Current table and sequence information

- current visit number
- current break
- player at table
- table-state label
- reds remaining
- colors remaining or current color phase
- points remaining on the table
- target ball
- decision mode
- respotted-black status when relevant
- snookers-required status when relevant

### Condition and psychology information

- player confidence
- opponent confidence
- player fatigue
- opponent fatigue
- pressure meter
- pressure label
- clutch state cue
- recent confidence shift if available

### Tactical information

- current tactical plan
- current mental focus
- current tempo
- tactical edge value
- short explanation of current tactical posture
- opponent current approach
- opponent archetype

### Support and intervention information

- coach prompt
- coach recommendation details
- timeouts remaining
- effect reminder for timeout or coach cue

### Match-story information

- latest visit summary
- visit log
- frame history
- momentum trend
- recent opponent tactical shifts
- reason for latest opponent shift

### Equipment and readiness information that should remain accessible

- cue familiarity
- cue condition
- tip condition
- chalk reliability
- equipment bonus summary

This does not need to dominate the live screen, but it should be available via a compact sidebar, drawer, hover state, or expandable module.

### Advanced optional overlays Bolt should consider

- a compact "why this decision is strong" panel
- a live "attribute influence" panel for the currently highlighted decision
- a match-flow timeline showing turning points
- a mini panel showing pre-match expectation vs current live reality
- a clutch-state banner for deciders and respotted-black moments

## Decision explanation UX

Bolt should add better explanatory UX around decisions than the current app has.

### For every visit decision, the UI should be capable of showing

- what the decision is trying to do
- the primary strengths it relies on
- the main risk
- the current situational fit

### Example structure for a decision tooltip or side panel

- decision name
- plain-English objective
- relevant attributes
- likely upside
- likely downside
- recommended when
- avoid when

## Attribute communication model for the live UI

The user should not need to understand hidden formulas, but they should understand what parts of their player profile are driving the current match.

### Match-critical attributes to surface most often

- `Long Potting`
- `Break Building`
- `Cue Ball Control`
- `Safety Play`
- `Composure`
- `Focus`
- `Big Match Nerve`
- `Stamina`

### Attributes best treated as secondary support data

- `Consistency`
- `Hand Steadiness`

These still matter, but they can appear in tooltips, explanation panels, or detail drawers rather than the primary header area.

### Recommended live attribute presentation

Use a compact "match attributes" module that highlights:

- attack rating
- tactical rating
- clutch rating
- stamina or endurance rating

These can be derived player-facing summaries rather than raw backend calculations.

## Momentum and commentary model

The current live state already tracks momentum and a visit log. Bolt should make this feel far richer.

### Momentum UI should communicate

- whether the player is rising or fading
- whether the opponent has seized initiative
- whether the frame is stabilizing or becoming chaotic

### Commentary-style language the UI should encourage

- "You have steadied the frame"
- "Opponent is pressing after the timeout"
- "Break-building route is opening up"
- "Pressure is climbing and safety errors are becoming expensive"
- "You now need snookers"
- "Respotted black: pure nerve moment"

## Result screen logic and explanation model

The match result screen should explain what happened using the seeded model and the actual outcome.

### Current explanation blocks that should be preserved

- Match Summary
- Strength Breakdown
- Match Modifiers
- Why The Result Happened
- Improvement Advice
- Pressure Diagnosis
- Equipment Impact
- Coach Feedback
- Frame-by-frame summary
- match stats comparison

### Core result details to show

- final frames score
- win or loss status
- prize money earned
- ranking points earned
- confidence change
- fatigue change
- highest breaks and match stats
- frame history
- tactical and equipment influence
- coach and preparation feedback

### UI notes for Bolt

- use strong emotional contrast between win and loss
- make the scoreline the hero
- make the explanation readable in seconds, with deeper detail available below
- separate outcome, reasoning, and next steps into clearly distinct sections

## Match result explanation inputs

The current explanation layer derives readable feedback from values such as:

- strength edge
- pre-match confidence
- pre-match fatigue
- equipment modifier
- confidence modifier
- fatigue impact
- format impact
- pressure impact
- tactical fit

### UI implication for Bolt

The result screen should not just say "you lost" or "you won." It should explain:

- whether the player overperformed or underperformed expectation
- whether fatigue mattered
- whether pressure mattered
- whether the format favored or hurt the player
- whether equipment and familiarity helped
- what to fix before the next match

## Recommended match-specific component system for Bolt

Bolt should create reusable match-focused components such as:

- MatchHeroHeader
- LiveScoreRibbon
- FrameStateCard
- VisitDecisionTray
- TacticalToggleCluster
- PressureMeter
- MomentumRail or MomentumChart
- CoachPromptCard
- OpponentAdjustmentFeed
- VisitLogPanel
- FrameHistoryTable
- MatchAttributeRadar or MatchAttributeStrip
- ResultExplainerCard
- MatchModifierList
- ImprovementAdviceList

## Match-state UX states Bolt must support

### No live match state

Used when the player opens Live Match without an active session.

### Match about to begin

Transition from preview into live presentation.

### Standard frame control

Normal in-play decision state.

### Opponent at table

Player mostly observes, with sim or watch options.

### Pressure spike state

Visual emphasis should increase.

### Snookers required state

Recovery framing should become explicit.

### Respotted black state

Unique clutch presentation.

### Match complete state

Automatic handoff to result screen.

## What Bolt should deliver for the match experience

Bolt should use this document to produce:

- a much stronger Match Preview screen
- a premium live-match HUD with clear zones and rich feedback
- a highly readable decision tray for visit choices and fast-forward actions
- more dramatic and more understandable pressure, momentum, and tactical feedback
- an opponent-intelligence presentation that feels alive
- a result screen that explains the match in plain English and performance terms

If Bolt simplifies anything, it should simplify visual presentation only. It should not remove the tactical depth, state awareness, or explanatory systems that make the match experience feel like the core payoff of the game.