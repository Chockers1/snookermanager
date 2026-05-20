# Thread Change Summary

Date: 2026-05-20

## Overview

This thread moved the live snooker career app onto the rebuilt UI surface, documented the main game screens, and then compressed key career routes into fixed-height single-screen dashboards and wizards so they match the target visual direction while keeping existing game logic intact.

## Documentation Added

- `docs/bolt-ui-spec.md` documents the menu structure, every main screen, the purpose of each page, and how the interface flows through the career mode.
- `docs/bolt-match-ui-spec.md` documents the intended match screens, live match information, match logic, player attributes, and the data the user should see during match play.

## Shared Logic And Data Changes

- Reworked shared player rating helpers in `src/utils/calculations.ts` so overall and potential values can be reused consistently across live routes and previews.
- Expanded the derived route data surface in `src/utils/liveRouteData.ts` to drive finance, training, tournament hub, match preview, sponsorship, mental, health, and season review pages from a common source.
- Fixed tournament selection logic so `Booked` tournaments are treated as active upcoming events alongside entered events. This resolved the broken-feeling tournament entry flow and aligned current-event displays across the app.
- Propagated that tournament-state fix into shared selectors used by dashboard and navigation surfaces, including the top status bar, sidebar, inbox, travel planner, rankings, and tournament hub.

## Live UI Migration And Screen Rebuilds

- Kept the live app surface in `src` as the source of truth and treated the separate visual prototype folder as reference-only.
- Standardized a fixed-height route shell for one-screen layouts, using internal panel scrolling instead of whole-page scrolling.
- Rebuilt the dashboard into a denser one-screen overview with compact finance and next-event coverage.
- Rebuilt training, coach market, finance, and tournament hub screens into one-screen dashboard layouts.
- Converted the match preview page into a one-screen pre-match briefing layout and fixed the start-match action so in-progress live matches resume correctly.
- Rebuilt rankings into a one-screen layout with an internally scrolling table, compact summary rail, and projection cards.
- Rebuilt sponsorship offers into a one-screen commercial dashboard, including the empty state and active-offer detail flow.
- Rebuilt mental state into a one-screen recovery dashboard with diagnosis, action planning, trends, and next-focus guidance.
- Rebuilt health centre into a one-screen treatment and injury-management dashboard.
- Rebuilt season review into a one-screen end-of-season dashboard and then refined it further to better match the requested screenshot, including icon-led KPI cards and a more unified left analysis panel.
- Rebuilt the new-career flow in `src/routes/NewCareerPage.tsx` into a fixed-height four-step wizard where Identity, Background, Attributes, and Confirm all fit within one screen.

## Validation And Cleanup

- Used repeated `npm run build` validation after the major route rewrites to confirm the live app compiled cleanly.
- Resolved follow-up issues found during validation, including an unused import in the rankings route.
- Replaced invalid Tailwind fractional size classes on affected icons with valid explicit sizing.

## Result

The main career-management surfaces requested during this thread now follow the new rebuilt UI direction in the live application, the tournament flow bug is fixed at the selector level, the new-career wizard fits inside a single screen, and the supporting route and match documentation has been added to the repository.