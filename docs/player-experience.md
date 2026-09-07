# Guided first week, accessibility and diagnostics

New careers automatically show a first-week guide above the current page. It follows applied training, equipment checks, event entry, travel, preparation and the first match. It waits for actual actions; links do not buy equipment, advance time or play matches. Equipment must include an equipped cue, usable chalk and a fitted tip. Existing equipment satisfies the check.

Each explanation can be skipped, or the whole guide dismissed. Completed and skipped steps are distinct and saved with the career. The guide remains available until finished or dismissed, even if the first event is more than a week away. Existing careers are opt-in through Settings & help; resuming clears skipped steps while preserving completed milestones.

## Where to find the controls

Open the gear menu in the top bar, then **Settings & help**. The career launcher also has a Settings, accessibility & bug reports link, so reports remain available before loading a career. A pending season review does not block Settings or Save Manager.

Text size choices are 100%, 115% and 130%. Higher text contrast and reduced motion are separate switches. Preferences are stored on the browser and apply across careers. The system reduced-motion preference is respected too. Larger text can require scrolling, including within wide tables.

Ranking form indicators visibly show W, L or D, with accessible Win/Loss/Draw labels, as well as their colours. Keyboard focus is outlined. Tab and Shift+Tab traverse native controls; Enter activates links/buttons and Space activates focused buttons/checkboxes. Selects retain native arrow-key behavior. Mobile navigation is removed from the focus order while closed, contains focus while open, and closes with Escape.

Optional navigation shortcuts use **Alt + Shift**:

| Key | Destination |
| --- | --- |
| D | Dashboard |
| T | Training |
| E | Equipment |
| C | Calendar |
| I | Inbox |
| M | Match centre |
| S | Settings & help |

Shortcuts are disabled by default and ignored while editing, choosing select options or inside modal dialogs. They only navigate. Escape also closes the career options menu. This adds keyboard/readability support; it is not a claim of a complete accessibility compliance audit.

## Bug reports

In Settings, describe what happened and choose **Download bug report**. The JSON contains the complete current save, package version, Git revision plus a modified marker where appropriate, build time, game date/progress, browser/viewport/preferences, up to 50 recent actions/navigation observations for the current career, and up to 10 interface errors captured in the current session.

Nothing uploads automatically. The file includes the player name and career data and can be attached to a report. Actions are persisted locally in a bounded buffer and begin accumulating after this update; past actions cannot be reconstructed. An error-screen export falls back to the active stored save and retains unreadable raw data if decoding fails. Malformed diagnostic records cannot block exporting a report. No other named saves or automatic backups are included.

## Verification and balance data

Focused tests cover guide milestones/dismissal, preferences, shortcut safeguards, bounded diagnostics, cross-career filtering and damaged saves. Browser checks cover training guidance and reloads, desktop/mobile text scaling, non-colour results, keyboard navigation/focus and an actual downloaded report.

The four-start, twelve-career balance comparison is in [the detailed report](reports/career-start-balance-2026-09-07.md), with seed-level machine-readable data alongside it. It records three brief cash-deficit flags, sponsorship dependence and development/promotion limitations without declaring the game fully balanced.
