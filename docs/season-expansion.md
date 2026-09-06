# Season planning and tour progression

## Where to find the features

- Calendar → event details, and Tournament Hub → Event Details: entry closing date, ranking selection cutoff and the current eligibility explanation.
- Inbox: one-week and final-day entry reminders for eligible available events.
- Calendar → Planning board: star priority events, filter tours, change months and reserve seven-day training/rest blocks. The existing optional six-week entry/travel assistance is below the board.
- Training: planned blocks appear on the timetable, with reserved sessions locked. Remove an unapplied block from the planning board before editing those dates.
- Rankings → Tour development: monthly reports covering prospects, veterans and rivals, with rivals listed first.
- Career Stats → Career achievement goals: first televised win, century, final and professional tour card.
- Live match feed: real comeback/decider situations, scoring chances ending, centuries, recorded personal bests and established rivalry introductions.

## Entry rules

Entry deadlines are game rules, separate from ranking seeding cutoffs. An authored `entryDeadline` overrides the default inclusive first playing date. `seedingCutoffDate` still controls the ranking snapshot (default seven days before the start). Confirmed/Booked entries survive the deadline. A player cannot newly enter after the closing date; the existing qualification, invitation, age, equipment, cash and conflict checks still apply. Existing accepted legacy World entries remain honoured.

Reminder keys persist separately from the limited inbox so a reload or inbox cleanup cannot replay notifications. Date advancement observes eligible event reminder boundaries.

## Planning and costs

Priority markers do not enter tournaments or spend money. Blocks reserve seven days and reject overlaps with confirmed events, other blocks, paid commitments, already applied training and protected major preparation. Training blocks use a focused morning session, review and evening rest; rest blocks use rest throughout. Training blocks count toward relevant development projects. They charge no additional booking fee and use normal weekly settlement.

The board estimates all future priority events and blocks: unpaid entry and selected travel packages, hotel nights from opening participation through the final, and current recurring weekly commitments through the final planned date. Already paid bookings are deducted. Neither prizes nor future sponsor payments are assumed; future journeys and prices may change. Schedule assistance also rejects protected block conflicts.

## Development, achievements and saves

Tour skill development is initialized at the current save month, without invented historical gains. It reviews each elapsed month deterministically and stores twelve reports per player. Age, potential, coaching, training and injuries influence bounded individual skill offsets. Existing overall seasonal development remains in place. Skill offsets affect live opponent profiles, frame simulation strength and CPU knockout/group probabilities; bracket snapshots retain the development level at draw creation. Retired players and the human player are excluded. Scouting keeps rounded uncertainty ranges.

Achievements use surviving competitive match/trophy records and explicit televised-round evidence, not reputation or prize thresholds. Qualifying finals and exhibitions do not count as tournament finals. Existing tour cards and reliable historical century totals can unlock goals with unknown original dates. Future achievements persist, notify once and award no extra money or legacy points. Newly settled matches store their televised status so later seasons cannot overwrite that evidence.

Personal-best commentary compares against the recorded career maximum captured at match start. Comebacks use the actual sequence of frame winners; missed-chance commentary requires a recorded scoring run or a live contest on the colours.

## Verification

`src/game/seasonExpansion.test.ts` covers deadlines, reminders, real training/rest effects, conflicts, achievement evidence/idempotence, deterministic development, CPU/live integration and commentary conditions. `e2e/season-expansion.spec.ts` exercises the board at desktop and phone widths, entry details, save/reload, protected timetable sessions, achievements and tour reports. Existing calendar, match and training browser checks provide regression coverage.
