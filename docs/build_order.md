# Build Order

## Rule

Do not try to build the whole game at once.

Build the game in small working layers.

Each phase should leave the app usable, even if the data is still mocked.

---

## Phase 1 - Visual App Shell

Goal: Create the full-width Football Manager-style layout.

Build:

- Left sidebar navigation
- Top status bar
- Main content area
- Right context panel support
- Dark navy/slate theme
- Reusable cards, tables, badges and buttons
- Placeholder pages for all MVP routes

Do not build game logic yet.

---

## Phase 2 - Career Dashboard

Goal: Build the main home screen.

Build:

- Player summary
- Ranking card
- Cash card
- Form card
- Confidence card
- Fatigue card
- Next tournament panel
- Weekly training summary
- Current coach panel
- Current equipment panel
- Recent results table
- Upcoming decisions panel

Use mock data only.

---

## Phase 3 - Core Player Screens

Build:

- Player Attributes screen
- Career Stage Progression screen
- Legacy / Career Stats screen
- Mental State screen
- Injury / Health Centre screen

---

## Phase 4 - Training and Coaches

Build:

- Weekly Training Planner
- Training Report
- Coach Market
- Coach Profile Detail

Use mock data first.

---

## Phase 5 - Finance and Equipment

Build:

- Finance Dashboard
- Equipment / Cue Shop
- Chalk and Tip Shop
- Equipment Maintenance

Add mock buying logic only if easy.

---

## Phase 6 - Tournaments and Match Flow

Build:

- Tournament Calendar
- Travel Planner
- Tournament Hub
- Tournament Draw
- Match Preview
- Live Match Simulation
- Match Result Summary

Use fake tournament and match data first.

---

## Phase 7 - Sponsorship and Inbox

Build:

- Sponsorship Offers
- Sponsorship Contract Detail
- Inbox / News Centre

---

## Phase 8 - Basic Game Logic

Only after the UI exists, add:

- Player creation
- Save/load to localStorage
- Weekly advance button
- Training effects
- Coach costs
- Equipment purchases
- Tournament entry costs
- Basic match simulation
- Ranking movement