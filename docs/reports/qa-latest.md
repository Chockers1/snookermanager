# Local game QA — 5 September 2026

## Scope and save safety

Checked the current application using isolated Chromium contexts and test careers on port 4174. The user's browser storage and active career on port 5173 were not edited. Changes are local, not committed or pushed.

## Verified

- Lint and production build pass; `npm audit` reports zero vulnerabilities, including development dependencies.
- 92 unit tests pass, covering state migration, save isolation, training and recovery, sponsor obligations, equipment wear, complete fields, CPU results, ranking movement and retirement.
- 82 browser tests pass. Coverage includes career creation with nationality/date of birth, named saves and reload, persistent inbox read state, entry → travel → preparation → preview → live/quick simulation → review → completed draw, post-event messages, and mandatory season review.
- Added actual active-career route checks. Opening a saved URL intentionally shows the launcher; previous route smoke tests only checked that launcher. Unit tests now name that behavior correctly, while browser tests visit the active pages.
- Added regression coverage for dashboard event actions and long names at 320, 768, 1280 and 1920 pixels, preparation's 100% limit and reload, sponsor-slot selection/signing, finance CSV export and budget editing.
- Responsive checks cover 1920×1080, 1280×720, 1024×768, 768×1024, 390×844 and 320×568. These are Chromium viewport tests, not physical-device/Safari certification.

## Fixed in this pass

1. Restored dashboard tournament actions below laptop width through a compact next-step menu. Reserved space for player names and removed the generic desktop “Continue” label in favor of the actual action. Added accessible names/tooltips for the compact controls.
2. Dashboard opponent and round now come from the active event/current round, not the first match in an old draw.
3. Travel's accessible action label now matches its destination: Preparation until a plan exists, then Match Preview.
4. Updated stale browser selectors and test fixtures to respect the current preparation and travel gates.
5. Excluded generated browser artifacts from ESLint, preventing a race when Playwright recreates its output directory.
6. Updated the long-career harness to confirm preparation and acknowledge season reviews. Previously it tried blocked matches and stopped progressing after the first season.
7. Removed an audit-only rule that promoted lost finals into invented breakthrough titles/rewards. Best-finish reporting no longer treats semi-finals and quarter-finals as finals; regression tests cover this.
8. Removed the audit planner's Q School exception that checked only entry fees. Simulation budgeting now uses the same travel-package quote as actual booking, including sponsor discounts. Booking failures retain the actual reason in the report.

## Simulation evidence

- Three seasons on all 12 starting paths, one seed per path: completed with no harness issues after restoring the preparation/review flow.
- Thirty-season multi-seed audit: all 24 careers completed 30 seasons (720 total). Fourteen scenarios had no harness issues; ten junior/amateur-path scenarios flagged travel affordability or unavailable chalk. All professional and senior starts completed without harness issues. Two of the 24 careers recorded a World Championship title, not all starts. See `artifacts/simulations/balance-matrix-latest.json` for per-path flags. This is exploratory baseline evidence: reporting and audit-budget fixes were made during the batch, so it is not a uniform post-fix release-certification run.
- Independent post-budget-fix Club Junior seed 104730: 30/30 seasons, 1,662 weeks, 274 entered tournaments, 474 matches, zero harness issues. Final career remained amateur, with no invented titles. Detailed report: `artifacts/simulations/30-season-start-age-12-start-club-junior-middle-support-simulation-seed-104730.md`.

## Performance evidence and limits

The website audit skill checked five entry URLs in development mode: median load 1,089 ms, slowest 1,170 ms, zero failed requests or console errors. These measurements cover the launcher guard, not active-route performance. Active routes were checked separately in the browser suite, including uncaught errors and chart-sizing warnings. Concurrent simulation load makes these timings unsuitable as release performance budgets.

## Still worth addressing

- Long-run confidence is routinely near the cap: all 24 matrix careers averaged approximately 98.7–98.9%. This deserves a separate balance pass, not an unsupported claim that realism is finished.
- The matrix's pass/review status checks harness issues, not optional balance warnings. One Top 32 seed also flagged a 57.9% World Championship match win rate over 38 matches without a world title; that is a statistical review flag, not proof of a broken tournament.
- Baseline junior/amateur runs encountered travel/chalk affordability failures, especially around Q School. The audit-budget defect is fixed and one fresh long run passes; the full multi-seed matrix should be repeated unchanged before certifying all long-term paths.
- Real iPad Safari/touch testing and exhaustive combinations of careers, contracts and equipment remain outside this pass. Passing automated checks is not proof that no bugs exist.
- The large game-state module remains a maintenance risk; this pass deliberately did not rewrite the career model.

Raw reports/screenshots remain in ignored `artifacts/`; only this concise summary belongs in version control.
