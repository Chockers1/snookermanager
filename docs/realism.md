# Career realism features

Implemented locally on 6 September 2026, continuing the interrupted seven-feature build. The existing navigation and visual theme are retained.

## Where to use each feature

| Feature | Existing screen |
| --- | --- |
| Match sessions, intervals and overnight decisions | Live Match; simulation pauses for the interval dialog |
| Qualification and tour survival | Rankings and Calendar |
| Journey planning, acclimatisation and returning home | Travel; current location and return options also appear in Calendar |
| Venue conditions and table familiarisation | Match Preview and Tournament Hub |
| Training base and relocation | Training |
| Scouting confidence and recorded reviews | Match Preview and Tournament Hub |
| Around the tour digest | Inbox and Season Review |

## Match sessions

Long formats use separate sessions: best-of-17 (8/9), 19 (9/10), 21 (10/11), 25 (8/8/9), 33 (8/8/8/9), and 35 (8/9/8/10). Tournaments can override session lengths and overnight boundaries. Longer individual sessions include an interval after four frames.

The interval shows the score, fatigue, confidence, actual potting/safety statistics and coach assessment. Choose extra recovery, a bounded mental reset or tactical review, then adjust the existing tactics controls. Auto Play and Sim Match stop at these decisions. Quick Sim resolves breaks with recovery automatically.

Choices and elapsed match time are saved, so reloads cannot repeat recovery. Overnight breaks add match-clock time; the career date and weekly accounts remain on the event's calendar clock. Older active matches receive a session plan without replaying past benefits.

## Travel and conditions

Routes use the current or planned previous location, approximate distance and standard time zones. Flights replace domestic transport options when appropriate. A following event's journey cannot depart before an entered event finishes. Bookings must be made before departure; Advance to Tournament passes through booked transit and arrival dates without playing a match.

Packages include hotel nights from arrival through the event's end. Original routes, dates and paid prices remain fixed once travel starts. Players remain at the event location afterwards, allowing direct onward travel. Return-home travel costs money and occupies the timetable.

Arrival fatigue is applied once. Elapsed days reduce the remaining travel load, with a saved recovery cursor. Overseas nights outside prepaid event accommodation cost £35. Base subscriptions and uncovered lodging charge only for elapsed days, including partial weeks, without duplicating the weekly cash-flow deduction.

Venue cloth speed, cushions and humidity produce small effective cue-control/safety adjustments, bounded from -2 to +1. A £35 familiarisation evening occupies an existing training slot and reduces unfamiliarity after its scheduled date. These effects do not edit permanent attributes.

Geography, fares, venues and session schedules are game estimates/configuration, not live travel services or a complete reproduction of official schedules.

## Training bases

Local club: no additional weekly subscription, eight priority table sessions.
Dedicated table: £180 joining, £90/week, fourteen sessions.
Academy: £600 joining, £260/week, twenty-one sessions and a wider practice-partner pool.

Excess table work becomes less productive; base access benefits are reduced away from home. Combined base/facility efficiency is capped at 115%; existing development project and partner limits remain. Coaches and equipment facilities retain separate contracts. Relocation requires travel time, affordability and a four-week review interval.

## Qualification, scouting and news

Races use recorded earnings, scheduled expiry and the ranking engine's countback. Locked fields retain the saved cut-off positions. The World Championship top-16 race refers to direct seeding; qualifying routes remain separate. Tour survival shows the projected top 64, protected cards and the one-year rescue outlook. These are forecasts, not automatic new card awards.

Opponent ratings are uncertain ranges. Direct meetings, shared practice and reviews of available recorded matches narrow them. Reports distinguish small samples from recorded scoring evidence. Opponent form comes from completed bracket results; it is never invented from ranking position. Repeated review cannot generate duplicate knowledge.

The tour digest uses settled results for champions, upsets, rivals and ranking movement, plus recorded milestones, retirements and recovery. Qualifying sections are not reported as champions. Saved event/match IDs prevent duplicate news. History is retained in Season Review even when older inbox items are trimmed.

## Code and verification

Core logic: src/game/realism/. Interface: src/components/career/RealismPanels.tsx and the existing route components.
Tests: src/game/realism/realism.test.ts and e2e/realism.spec.ts.
Detailed verification: docs/reports/realism-qa.md.

The changes are local. No commit, push or deployment was performed.
