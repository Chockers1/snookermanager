# Tournament entry recovery

Save schema 12 repairs the conflict between old season-open World Championship reservations and the later ranking-cutoff entry rules.

An older save qualifies for the one-event compatibility exception only when it has an accepted, unplayed World main-draw history entry, both legacy main-draw route locks, an automatically skipped qualifier with no human history, a current tour card, and a main event that has not finished. Explicit withdrawals, completed events, newer saves, and careers without that accepted entry do not receive the exception. Another active entry is preserved.

The accepted entry is restored without charging another fee, advancing the date, rewriting the ranking ledger, or inventing match results. Missing progress is rebuilt as a Last 32 draw. A notice in the Hub identifies the exception. The event flag is not carried into a new season, whose schedule is built from the catalog.

Future World entries no longer use season-open reputation labels or automatically skip qualifying. Automatic main-draw entry waits for the cutoff and valid access, and never withdraws another entered event.

Without an eligible event, the Hub provides Calendar and Advance One Week actions. The status bar clears its stale event name, and the full-draw page displays an empty state instead of invented opponents.

Validation: five unit regressions, browser coverage of the empty Hub and both actions, and a private isolated-browser reproduction of the affected RT save. The local diagnostic copy also completed travel, preparation, advancement to the event, and starting a best-of-19 Last 32 match. Private save copies remain outside version control.
