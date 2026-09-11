# Long-career corrections — 11 September 2026

## Changes

- Active careers and named slots use IndexedDB instead of sharing the small localStorage quota. Startup migrates legacy payloads before opening the game; original keys are removed only after a successful database commit. Slot payload, active selection and slot index change in a single transaction. Inactive saves are loaded on demand. Portable export and rotating recovery snapshots remain available.
- Coaches retain an explicit contract end date. Older contracts reuse their already-announced deadline where available. Weekly billing no longer decides the departure date; dated advancement honours the deadline and then records the named CPU destination. Renewals extend both the contract and staff-market date.
- Each season has a permanent opening snapshot containing its date and ranking. The short graph history can roll forward without replacing this baseline. Older missing opening data is marked partial instead of reconstructed as fact.
- Human season summaries no longer have a twelve-season retention limit. Already discarded summaries and missing opening ranks cannot be recreated exactly; surviving tournament and world-player histories remain available.
- Zero-point ranking ties use deterministic name order. Same-date ranking rebuilds also preserve the displayed movement instead of clearing it.
- Save failure handling preserves a completed in-memory season for the pre-rollover backup even if its last autosave failed. Legacy prize corrections retain the original payload until their protective backup succeeds.

## Verification

The complete unit/simulation suite passed: **712 tests in 64 files**, with two workers. A final focused rerun passed **22 tests** covering opening history, retention, midweek contract expiry, migration, ranking stability and save-slot handling. TypeScript/production build and ESLint passed. The build retains its existing large-bundle warning.

A real 25-season checkpoint contains 51,388,485 JSON bytes and compresses to 2,745,650 UTF-16 characters (5,491,300 bytes). Its previous localStorage named-slot copy failed. The new database test migrated it, committed active and named copies, then reloaded both with identical payloads.

**20 distinct browser scenarios passed across the final runs:** seven career journeys, twelve storage/recovery checks, and the real 25-season Save Manager flow. The latter migrated the original payload, closed its pending review, created a named copy through the UI, reloaded the page and continued that copy with the same player, date and season. It completed in 1.9 minutes, including repeated large-save compression and loading.

Coverage includes transaction aborts, migration retry, preserving unrelated settings, new careers, named-slot switching, inbox overlays, recovery rotation, corrupt-save rejection, interrupted compression and protected rollover/prize correction. See `artifacts/century-fixes-storage-ui.log` (seven journeys), `artifacts/century-fixes-final-browser.log` (twelve other passing scenarios), and `artifacts/century-fixes-long-save-ui.log` (25-season flow). The initial long-save UI attempt was blocked by its pending review dialog; the final test explicitly closes it before using Save Manager.

## Scope

These are post-audit fixes. The original 100-year simulation continues using its preserved baseline; its results do not certify this changed implementation. Browser storage is larger, not unlimited, and clearing site data still removes local careers. Portable exports remain independent backups.
