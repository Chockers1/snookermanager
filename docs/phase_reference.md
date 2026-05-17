# Snooker Career Manager Phase Reference

This is the working roadmap for the build. It is split into two clear ideas for every phase:

- what is already built in the current app
- what remains in future phases

## Current overall status

- Phase 1: built
- Phase 2: built
- Phase 3: built
- Phase 4: built
- Phase 5: built
- Phase 6: built
- Phase 7: built

## Phase 1 — App Shell and Dashboard

Built now:

- App shell
- Sidebar
- Top status bar
- Shared UI primitives
- Shared game cards used by dashboard
- Placeholder route structure for the wider game map
- Career Dashboard with mock data

Still future inside this area:

- Real continue-week logic
- Real local save data flow

Key routes already live:

- `/`

## Phase 2 — Core Player Screens

Built now:

- New Career / Create Player screen
- Player Attributes screen
- Career Stage Progression screen
- Legacy / Career Stats screen

Still future inside this area:

- Editable attributes and profile state
- Longer-term career history depth beyond the current saved snapshot and match log

Key routes already live:

- `/new-career`
- `/player/attributes`
- `/career/progression`
- `/career/stats`

## Phase 3 — Training and Staff

Built now:

- Weekly Training Planner screen
- Weekly Training Report screen
- Coach Market screen
- Coach Profile Detail screen

Still future inside this area:

- Drag/drop planning polish
- Richer drill assignment logic and week-to-week automation
- Deeper staff contracts, negotiation, and shortlist persistence

Key routes already live:

- `/training`
- `/training/report`
- `/staff/coaches`
- `/staff/coaches/:id`

Primary screenshot references:

- Weekly Training Planner Screen.png
- Training Report  Coach Feedback.png
- Coach Market Screen.png
- Coach Profile Detail Screen.png

## Phase 4 — Finance and Equipment

Built now:

- Finance Dashboard
- Cue Shop
- Chalk & Tip Shop
- Equipment Maintenance

Still future inside this area:

- Scenario planning and budget forecasting depth
- Expanded equipment categories beyond the current cue, chalk, and tip systems
- Deeper maintenance branching, backup cue consequences, and long-term wear modelling

Key routes already live:

- `/finance`
- `/equipment/cues`
- `/equipment/chalk-tips`
- `/equipment/maintenance`

Primary screenshot references:

- Finance Dashboard Screen.png
- Equipment  Cue Shop Screen.png
- Chalk and Tip Shop Screen.png
- Equipment Maintenance Screen.png

## Phase 5 — Tournaments, Travel, Match, Rankings

Built now:

- Tournament Calendar
- Travel Planner
- Tournament Hub
- Tournament Draw / Bracket
- Match Preview
- Live Match Simulation
- Match Result Summary
- Rankings

Still future inside this area:

- Broader tactical choices layered onto the live frame flow
- More dynamic bracket generation and opponent scouting depth
- Richer travel and tournament knock-on effects across a full season schedule

Key routes already live:

- `/calendar`
- `/travel`
- `/tournaments/hub`
- `/tournaments/draw`
- `/match/preview`
- `/match/live`
- `/match/result`
- `/rankings`

Primary screenshot references:

- Tournament Calendar Screen.png
- Travel Planner.png
- Tournament Hub.png
- Tournament Draw  Bracket.png
- Match Preview Screen.png
- Live Match Simulation Screen.png
- Match Result Summary Screen.png
- Rankings Screen.png

## Phase 6 — Career Support Systems

Built now:

- Inbox & News Centre
- Sponsorship Offers
- Sponsorship Contract Detail
- Mental State / Slump Recovery
- Injury / Health Centre
- End of Season Review

Still future inside this area:

- More inbox categories and persistent message preferences
- Deeper sponsorship negotiation and contract branching
- Mental and health systems with broader long-term form, fatigue, and availability effects
- Deeper season review coverage from a larger long-term history model

Key routes already live:

- `/inbox`
- `/sponsorship`
- `/sponsorship/contract`
- `/mental`
- `/health`
- `/season-review`

Primary screenshot references:

- Inbox  News Centre.png
- Sponsorship Offers Screen.png
- Sponsorship Contract Detail.png
- Mental State  Slump Recovery.png
- Injury  Health Centre.png
- End of Season Review.png

## Phase 7 — MVP Logic

Built now:

- Create new career from New Career screen
- Interactive player identity, background, and temperament setup feeding career creation
- Save/load game state in localStorage
- Continue week
- Training effects
- Fatigue and confidence changes
- Coach weekly costs
- Interactive coach market selection and live coach profile hiring
- Equipment purchases and setup changes
- Cue maintenance actions with saved condition/history updates
- Tournament entry costs
- Travel booking with saved package selection and readiness impact
- Quick match simulation
- Live frame-by-frame match progression with saved frame history
- Multi-round tournament progression across entered events
- Ranking movement
- Inbox/news generation
- Interactive sponsorship offer selection and contract acceptance flow
- Persistent weekly snapshots and match logs feeding season review and legacy trends
- Live save state surfaced on the dashboard, finance, inbox, rankings, travel planner, tournament hub, match preview/result, and season review screens
- Live save state also surfaced on player attributes, training report, cue maintenance, and legacy stats screens
- Remaining route controls wired so every current page has functional navigation, toggles, selections, or save actions instead of dead buttons

Still future inside this area:

- Add deeper simulation layers behind the now-functional route controls
- Expand economy, staff contracts, equipment maintenance, and calendar consequences
- Feed more inbox branches, support systems, and contract systems from the growing history model

## Notes

- Use the screenshots in [designs/screenshots](/c:/dev/snooker_career/designs/screenshots) as the visual source of truth.
- Keep the build single-player, mock-data-first, and desktop-first.
- Do not add backend, database, or authentication during the MVP UI phases.
- When a phase is completed, update this file before moving to the next one.