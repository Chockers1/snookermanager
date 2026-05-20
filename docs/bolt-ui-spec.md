# Snooker Career Manager UI Specification for Bolt

## Purpose of this document

This document is a single handoff brief for Bolt to rebuild the UI for the current Snooker Career Manager app.

The current codebase already defines the information architecture, routes, core game loop, and the data each screen needs. Bolt should treat this as a product and screen-spec document, not as a visual copy of the existing interface.

The goal is to build a much better-looking UI while preserving:

- the menu structure
- the screen purposes
- the major widgets and data blocks on each screen
- the action flow between screens
- the simulation-management feel of a desktop-first sports career dashboard

## Product summary

This app is a desktop-first snooker career simulation. The player manages a single career over multiple seasons.

The experience combines:

- player creation
- training and progression
- staffing and equipment decisions
- finance and sponsorship management
- tournament planning and travel
- live match decision-making
- rankings, legacy, and season review

The UI needs to feel like a premium management game rather than a generic admin panel. It should feel data-rich, confident, and easy to scan, with strong hierarchy and clear consequences for decisions.

## Core UX principles for Bolt

- Build for desktop first. The current shell assumes a wide-layout management sim.
- Prioritize fast scanning. Every screen should surface the most important metrics high on the page.
- Keep decisions obvious. Primary actions should be visually clear and tied to visible outcomes.
- Use strong information grouping. Dense pages are acceptable if sections are clearly separated.
- Preserve game-state awareness. Confidence, fatigue, money, ranking, and next event should feel present across the app.
- Do not flatten the experience into a generic CRUD tool. This is a sports career sim with momentum, pressure, and progression.

## Global shell

### Shell structure

The app uses a persistent shell with:

- a left sidebar for navigation
- a top status bar for player identity and high-value summary state
- a thin action-feedback strip below the top bar showing the most recent system update
- a large scrollable main content area

### Sidebar groups

The main menu is grouped into five visible sections.

#### Overview

- Dashboard: `/`
- New Career: `/new-career`
- Inbox: `/inbox`

#### Player

- Attributes: `/player/attributes`
- Career Progression: `/career/progression`
- Legacy Stats: `/career/stats`

#### Preparation

- Training: `/training`
- Staff: `/staff/coaches`
- Equipment: `/equipment/cues`
- Finance: `/finance`

#### Competition

- Calendar: `/calendar`
- Tournament Hub: `/tournaments/hub`
- Match Centre: `/match/preview`
- Rankings: `/rankings`

#### Career Support

- Sponsorship: `/sponsorship`
- Mental: `/mental`
- Health: `/health`
- Season Review: `/season-review`

### Important routes not directly visible in the sidebar

These are still real screens and need proper UI treatment.

- Training Report: `/training/report`
- Coach Profile: `/staff/coaches/:id`
- Travel Planner: `/travel`
- Tournament Draw: `/tournaments/draw`
- Live Match: `/match/live`
- Match Result: `/match/result`
- Sponsor Contract: `/sponsorship/contract`

### Global state that should remain visible or quickly accessible

Most screens depend on the same shared career state. The UI should make these feel like the always-on heartbeat of the game.

- player name and identity
- current ranking and ranking movement
- cash balance
- confidence
- fatigue
- morale or mental state
- next event or next important calendar item
- current coach/equipment readiness where relevant

## Design direction for Bolt

Bolt should preserve the structure but redesign the visual language completely.

### Desired look and feel

- premium sports management sim
- editorial and cinematic rather than plain dashboard software
- dark, atmospheric, competitive, high-contrast desktop UI
- card-rich layout with clear depth and hierarchy
- strong typography and bold section headers
- charts and progress bars that feel like game HUD elements rather than business analytics widgets

### Layout behavior

- use a persistent left nav
- use a dense but readable content grid
- allow hero summary areas at the top of important pages
- treat each screen as a composed dashboard, not as a long plain form
- use modular cards so major sections can reorder responsively

### Reusable UI patterns

Bolt should create a reusable component language for:

- hero headers
- metric cards
- split-pane list-detail views
- tab clusters
- data tables
- progress bars and condition meters
- status badges
- timeline and progression modules
- chart cards
- recommendation cards
- action trays and sticky CTA areas

## Main game loops

Understanding the loops matters more than styling any one page in isolation.

### Loop 1: New career setup

1. Create a player identity and profile.
2. Choose background and difficulty shape.
3. Allocate starting strengths.
4. Confirm the save and enter the dashboard.

### Loop 2: Weekly preparation cycle

1. Review current condition on the dashboard.
2. Plan training for the week.
3. Optionally sign staff, buy equipment, manage finances, or review sponsorship.
4. Advance time and review the training report.
5. Check readiness for the next event.

### Loop 3: Tournament participation

1. Open the calendar.
2. Enter a tournament.
3. Book travel and accommodation if needed.
4. Review the tournament hub and draw.
5. Open match preview.
6. Play or simulate the live match.
7. Review the match result.
8. Repeat until eliminated or the event is won.

### Loop 4: Long-term career progression

1. Improve attributes and results.
2. Climb ranking systems.
3. Unlock better tournaments, coaches, and sponsors.
4. Manage health, confidence, and money.
5. Review season performance and continue to the next stage.

## Screen-by-screen specification

Each screen below includes purpose, required content, and how it connects to the rest of the app.

---

## 1. Dashboard

### Route

`/`

### Purpose

This is the main operations hub. It should answer, at a glance:

- how the player is doing
- what the next important event is
- what the biggest immediate decision is
- whether the career is healthy or drifting

### Key content blocks

- top summary metrics for ranking, weekly cash flow, confidence, and fatigue
- next event or next tournament card
- a preparation grid covering equipment, finance, training, and current news
- recent results list
- recommended coaches or staff opportunities
- finance snapshot with runway or risk indicator
- tournament readiness summary
- quick link into Match Centre when a match is pending

### Important interactions

- continue the week
- continue to the next tournament phase
- jump directly into training, finance, staff, equipment, or match flow

### UI notes for Bolt

- treat this as a command center, not a homepage
- the top of the page should feel urgent and useful
- use a strong hero cluster plus modular dashboard tiles
- this page should make state changes feel alive

---

## 2. New Career

### Route

`/new-career`

### Purpose

A multi-step onboarding flow for creating the player profile and starting save state.

### Required steps

1. Identity
2. Background
3. Attributes
4. Confirmation

### Step details

#### Identity

- player full name
- age
- handedness
- cue style
- playing style

#### Background

- starting career stage
- opening difficulty or challenge level
- reputation seed or starting profile context

#### Attributes

- editable sliders for core starting strengths
- live recalculation of overall and potential
- visible balance or budget logic so the player understands tradeoffs

#### Confirmation

- final profile snapshot
- starting ranking position
- starting financial position
- overall and potential overview

### Important interactions

- step forward/back
- validate inputs
- create the career and route to dashboard

### UI notes for Bolt

- this should feel like premium game onboarding, not a plain form wizard
- use side previews, profile panels, archetype visuals, and live summary panels
- make the attribute allocation step feel meaningful and dramatic

---

## 3. Inbox

### Route

`/inbox`

### Purpose

A message center for tournament notices, staff updates, ranking movement, and career alerts.

### Key content blocks

- category filters such as all, high priority, staff, and events
- message list with sender, title, preview, and urgency tone
- selected message detail area
- contextual action area when the message points to another page or decision
- featured event or highlighted item panel

### Important interactions

- filter messages
- select a message
- mark as read
- jump to linked screens

### UI notes for Bolt

- use a polished split-pane communication layout
- urgency should be obvious through hierarchy, not just color
- this page should feel like a career control room, not email software

---

## 4. Player Attributes

### Route

`/player/attributes`

### Purpose

The player profile screen for technical, mental, and physical ability, plus coach influence and current condition.

### Key content blocks

- hero metrics for overall, potential, morale, fitness, and fatigue
- grouped attribute presentation by technical, mental, and physical categories
- optional flat view for all attributes
- progress bars or meters for every attribute
- current coach summary and how coaching affects development
- strengths and weaknesses summary

### Important interactions

- toggle grouped vs flat view
- jump to rankings for comparison
- jump to coach market

### UI notes for Bolt

- this screen should feel like a player scouting dossier mixed with RPG stats
- attribute visualization needs to be elegant and readable under density

---

## 5. Career Progression

### Route

`/career/progression`

### Purpose

Explains where the player is in the full career ladder and what is required to move forward.

### Key content blocks

- current stage summary
- progression roadmap from early development to top-tier and legacy phases
- stage requirement checklists
- season structure overview
- tour and qualification rules explainer
- previous season milestones or archived progress snapshots

### Important interactions

- mostly read-only
- links out to rankings, tournaments, sponsors, or related areas

### UI notes for Bolt

- use timeline, ladder, or milestone visual language
- this page should clearly communicate long-term aspiration and unlock logic

---

## 6. Legacy Stats

### Route

`/career/stats`

### Purpose

The historical record of the career. This is the long-term memory of wins, titles, money, and legacy score.

### Key content blocks

- legacy tier or status badge
- summary statistics such as matches, wins, titles, centuries, peak ranking, and total prize money
- legacy score breakdown
- ranking trend chart
- prize money by event chart
- full match archive table
- season archive cards

### Important interactions

- inspect past results
- compare historical performance trends

### UI notes for Bolt

- this should feel prestigious and archival
- use trophy-case energy rather than spreadsheet energy

---

## 7. Training Planner

### Route

`/training`

### Purpose

The weekly scheduling screen where the player allocates time across the week and sees the likely effect on development and readiness.

### Key content blocks

- summary of the next competition or next important date
- week grid for days and session slots
- category selectors for the training session types
- live calculated load, fatigue, confidence impact, and coach bonus
- recommendations panel
- quick preset actions such as auto-plan, recovery plan, and clone previous

### Important interactions

- assign sessions to slots
- auto-generate plans
- apply and save the weekly plan

### UI notes for Bolt

- this should feel like planning a real training week
- use a visually satisfying planner layout with strong affordance for drag-select or slot editing
- projected consequences should update instantly and visibly

---

## 8. Training Report

### Route

`/training/report`

### Purpose

Shows the outcome of the week that was just completed.

### Key content blocks

- condition metrics such as confidence, fatigue, morale, and fitness
- attribute gains summary
- training load chart by day
- gains by category chart
- next focus recommendations
- recovery or adjustment advice
- drill or practice performance summary

### Important interactions

- review outcomes
- continue into the next week or return to planning

### UI notes for Bolt

- this should feel like a satisfying debrief screen
- use before-and-after language, gain highlights, and concise coaching commentary

---

## 9. Coach Market

### Route

`/staff/coaches`

### Purpose

The staff recruitment screen for browsing, comparing, and hiring coaches.

### Key content blocks

- filter and sort controls
- active coaching slots and roster status
- market list or table of available coaches
- selected coach detail panel
- strengths and predicted impact summary
- contract options and costs
- budget summary for staff spending

### Important interactions

- filter the market
- select a coach
- hire, fire, extend, or negotiate contracts depending on state

### UI notes for Bolt

- use a list-detail layout with strong comparison affordances
- compatibility, price, and predicted impact should be immediately visible

---

## 10. Coach Profile

### Route

`/staff/coaches/:id`

### Purpose

Detailed decision page for a single coach.

### Key content blocks

- coach identity header
- ratings bars
- profile summary and personality or style notes
- predicted weekly gains or influence areas
- strengths list
- contract options
- recommendation text

### Important interactions

- choose contract terms
- hire from this page

### UI notes for Bolt

- treat this like a premium candidate dossier
- it should feel more like signing a key team member than opening a plain detail record

---

## 11. Finance

### Route

`/finance`

### Purpose

The economic control center for cash flow, runway, cost planning, and risk.

### Key content blocks

- current cash balance and financial health indicator
- weekly and monthly cash-change metrics
- burn rate and runway view
- income and expense breakdowns
- cash-flow trend chart
- budget allocation view
- next tournament cost planner
- scenario forecasting for best case, expected case, and worst case

### Important interactions

- switch between finance sub-modes or tabs
- inspect spending categories
- review if the next event is affordable
- jump to calendar or sponsorship for corrective action

### UI notes for Bolt

- this page should make financial pressure feel real
- risk should be readable immediately
- use clear contrast between stability and danger

---

## 12. Equipment Hub

### Primary route

`/equipment/cues`

### Additional routes using the same overall experience

- `/equipment/chalk-tips`
- `/equipment/cases`
- `/equipment/maintenance`
- `/equipment/table-setup`

### Purpose

The equipment management area. This is really one multi-tab product area rather than five completely separate pages.

### Shared content expectations

- current equipment loadout
- owned inventory vs shop inventory
- prices and affordability
- durability, condition, familiarity, and performance effects
- actions to buy, equip, maintain, or upgrade

### Tab 1: Cues

- list of available cues
- sort and filter tools
- selected cue detail panel
- buy and equip actions
- cue familiarity and condition indicators

### Tab 2: Chalk and Tips

- consumable or accessory marketplace
- product effects and price comparison
- buy and equip actions

### Tab 3: Cases

- case options affecting protection or transport value
- buy and equip actions

### Tab 4: Maintenance

- maintenance history
- current wear condition
- maintenance action selection and scheduling

### Tab 5: Training Facility or Table Setup

- available training environments or setup options
- cost, performance, and comfort-style tradeoffs

### UI notes for Bolt

- build this as a polished tabbed commerce-and-loadout experience
- make owned vs equipped vs purchasable status extremely clear
- use visual cards, product panels, and condition indicators rather than plain tables everywhere

---

## 13. Tournament Calendar

### Route

`/calendar`

### Purpose

The event discovery and entry screen.

### Key content blocks

- month navigation
- calendar grid
- color-coded tournament level indicators
- event detail panel for the selected tournament
- filters by tour or event type
- readiness check for equipment or eligibility
- enter-tournament call to action

### Important interactions

- move through months
- filter the schedule
- select a tournament
- enter an event
- branch to travel planning

### UI notes for Bolt

- this should feel like a real season schedule, not a bare date picker
- events need strong visual identity and competitive importance

---

## 14. Travel Planner

### Route

`/travel`

### Purpose

A tactical booking screen balancing cost, comfort, timing, and fatigue.

### Key content blocks

- current tournament summary
- travel options with cost, arrival, fatigue impact, and risk
- hotel options with comfort and cost
- trip total breakdown
- cash remaining warning
- booking confirmation area

### Important interactions

- choose a travel option
- choose a hotel
- confirm booking

### UI notes for Bolt

- this page should feel like trip planning with consequences
- cost and condition tradeoffs should be highly legible

---

## 15. Tournament Hub

### Route

`/tournaments/hub`

### Purpose

The event command screen once a tournament is active.

### Key content blocks

- tournament title and current round state
- sub-navigation tabs such as overview, draw, schedule, players, history, and analytics
- match-path or bracket progression view
- next opponent card
- player condition summary for the event
- equipment readiness summary
- objectives and rewards panel
- event schedule and contextual stats

### Important interactions

- move between tournament subviews
- inspect the next opponent
- go to the draw
- start the next match

### UI notes for Bolt

- this should feel like living inside a tournament week
- the current round and next decision should dominate the top of the page

---

## 16. Tournament Draw

### Route

`/tournaments/draw`

### Purpose

The bracket screen for route analysis and prize-path awareness.

### Key content blocks

- full bracket visualization
- route progression markers
- compact vs expanded view
- projected difficulty or opponent challenge readout
- prize progression by round

### Important interactions

- inspect bracket path
- toggle compact view
- print or export if supported

### UI notes for Bolt

- make this screen visually striking
- the bracket should be easy to read and satisfying to explore

---

## 17. Match Preview

### Route

`/match/preview`

### Purpose

Pre-match analysis screen covering readiness, scouting, and tactical framing.

### Key content blocks

- player and opponent comparison
- recent form snapshots
- head-to-head summary
- opponent strengths and weaknesses
- scouting notes
- tactical recommendation
- cue familiarity and equipment readiness
- mental outlook or pressure indicator
- match metadata such as event, round, and format

### Important interactions

- review matchup context
- adjust mental framing if exposed in the UI
- launch the live match

### UI notes for Bolt

- this should feel like a television pre-game package fused with a strategy screen
- the player should understand the story of the match before it starts

---

## 18. Live Match

### Route

`/match/live`

### Purpose

The most game-like screen in the app. This is the live simulation and tactical control surface.

### Key content blocks

- large live scoreline
- current frame state
- table-state information such as reds and colors remaining
- current visit or turn state
- tactical controls
- mental focus controls
- tempo controls
- coach cue or timeout controls where available
- simulation controls for visit, frame, or full match
- frame-progress or race tracker

### Important interactions

- choose tactics
- apply coach input
- take a timeout
- simulate visit, frame, or match
- continue live play until the result is determined

### UI notes for Bolt

- this screen needs the highest intensity in the whole app
- it should feel like a match-control desk or broadcast-grade tactical panel
- state changes must be instant and dramatic

---

## 19. Match Result

### Route

`/match/result`

### Purpose

Post-match review screen summarizing the outcome and immediate consequences.

### Key content blocks

- final score presentation
- win or loss status treatment
- prize money and ranking points
- confidence and fatigue change
- detailed match stats
- frame-by-frame breakdown if available
- equipment impact note
- coach feedback
- analysis of what went well or badly
- next-step guidance

### Important interactions

- return to dashboard
- return to tournament hub

### UI notes for Bolt

- this should feel like the payoff screen after the match
- use strong emotional contrast between winning and losing states

---

## 20. Rankings

### Route

`/rankings`

### Purpose

Multi-system ranking overview for world standings, progression paths, and eligibility targets.

### Key content blocks

- ranking system tabs
- ranking table for the selected system
- highlighted player row or comparison block
- next reachable target
- scenario-based rank projections
- ranking-momentum trend chart
- qualification or tour-card information cards
- recent points sources

### Important interactions

- switch ranking systems
- inspect nearby competitors
- compare current position to next target

### UI notes for Bolt

- this should feel competitive and consequential
- avoid generic table-only treatment; add a strong sense of ladder pressure and momentum

---

## 21. Sponsorship Offers

### Route

`/sponsorship`

### Purpose

Commercial management screen for browsing, evaluating, and accepting sponsor offers.

### Key content blocks

- active sponsor slot summary
- available offers list
- selected offer detail panel
- brand fit and growth potential
- risk level treatment
- slot or reputation lock messaging
- current active sponsors and income summary

### Important interactions

- select an offer
- accept or reject it
- open full contract view

### UI notes for Bolt

- this page should feel more like managing endorsements than signing invoices
- make brand fit, risk, and commercial upside visually intuitive

---

## 22. Sponsor Contract

### Route

`/sponsorship/contract`

### Purpose

Detailed negotiation screen for one sponsor package.

### Key content blocks

- sponsor identity header
- package summary
- brand fit metrics
- negotiation posture selector
- likely negotiation outcomes
- commercial obligations
- exclusivity clauses
- term-length choices
- full terms summary

### Important interactions

- choose a negotiation stance
- accept or reject the offer
- negotiate before accepting

### UI notes for Bolt

- this should feel like reviewing a serious commercial deal
- use premium contract-panel design, not a bland terms page

---

## 23. Mental State

### Route

`/mental`

### Purpose

Tracks confidence, morale, pressure, slump diagnosis, and recovery planning.

### Key content blocks

- mental-condition metrics
- diagnosis card describing the current psychological state
- contributing factors
- recovery plan options
- trend chart over recent weeks
- estimate of recovery outlook

### Important interactions

- choose a recovery plan
- continue the week after setting it

### UI notes for Bolt

- this page should feel reflective but still performance-driven
- present the mental model clearly without making the screen visually soft or passive

---

## 24. Health Centre

### Route

`/health`

### Purpose

The injury and physical-risk management screen.

### Key content blocks

- current issue summary
- overall risk level
- body-area status map or body-zone grid
- treatment options with cost, time, and effect
- recovery schedule or timeline
- match-performance impact summary
- injury history

### Important interactions

- choose a treatment option
- schedule treatment
- continue the week

### UI notes for Bolt

- use a strong medical-performance hybrid visual language
- this page should feel clinical, useful, and consequence-heavy

---

## 25. Season Review

### Route

`/season-review`

### Purpose

End-of-season summary and archive handoff into the next season.

### Key content blocks

- season header and record
- titles, prize money, financial result, and ranking movement
- notable moments or headline results
- archive cards for recent seasons
- ranking trend chart
- event earnings chart
- sponsor income analysis
- coach impact summary
- prompt for next season continuation

### Important interactions

- review the completed season
- continue to the next season cycle

### UI notes for Bolt

- this should feel like a season finale package
- celebrate progress while making unresolved problems obvious

## Cross-screen dependencies Bolt should respect

The same underlying game state drives most pages. The UI should consistently reflect how these systems connect.

### Key systemic dependencies

- training affects attributes, fatigue, morale, and readiness
- coaches modify development and performance support
- equipment affects readiness, confidence, familiarity, and match bonuses
- finances gate staff, travel, equipment, and event participation
- sponsorship helps cash flow and status progression
- calendar and travel feed tournament readiness
- match results affect ranking, prize money, confidence, fatigue, and historical records
- mental and health systems shape performance stability and recovery decisions
- season review and legacy stats accumulate the long-tail story of the career

## Known structure notes and implementation realities

- The equipment area behaves as one shared multi-tab experience even though it has multiple routes.
- Match Centre is really a multi-step flow across preview, live match, and result.
- Tournament play is also multi-step across calendar, travel, hub, draw, preview, live, and result.
- Some tournament hub sub-tabs may be lighter or more placeholder-like than the core overview.
- The product is already content-rich. Bolt should improve the experience through layout, hierarchy, and visual identity rather than by reducing the feature surface.

## What Bolt should deliver

Bolt should use this document to produce:

- a cleaner and far more premium overall UI
- a consistent shell and component system
- a redesigned version of every routed screen listed here
- a strong desktop-first information layout
- clear action priority on every page
- polished chart, table, planner, bracket, and card treatments

If Bolt needs to simplify anything visually, it should simplify presentation, not remove important content blocks or flows.