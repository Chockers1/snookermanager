# Post-event financial report

Post-event emails use a compact statement showing the finish, ranking, final-match performance, all event income, and these charged costs:

- Entry fee actually paid, including entry discounts or package waivers.
- Travel, transfers and fees.
- Hotel accommodation: paid nights × the booked nightly rate, with extra nights identified.
- Preparation support after changes and refunds.
- Venue familiarisation/practice.
- Total event costs and net event finances.

Hotel extensions are already included in the travel booking's total. The report splits this existing total into transport and accommodation rather than adding hotel nights twice. Prize money and sponsor bonuses cover the whole event, not only the last match. Future return travel and unrelated ongoing career bills are not assumed to be event charges.

New reports store an immutable financial snapshot on the inbox message. Tournament history stores actual entry, preparation, venue and sponsor amounts. This preserves the figures when future seasons reuse tournament IDs or old match/ledger entries are trimmed. Reporting does not move cash.

Older emails are enhanced from uniquely matching completed-event history and retained receipts. If an older prepaid booking has no nightly rate, the total remains under Travel & hotel package and the missing night count is stated. Ambiguous historical emails are not attached to another season's charges.

The event statement removes duplicated result text and the repeated venue card. All costs and actions fit without scrolling at 1920×1080 and 1280×720. Phones use a message selector to give the report more room, with internal scrolling retained on very small screens.

Validation: `eventFinancialReport.test.ts` covers charge reconciliation, extra nights, refunds, venue practice, cumulative income, historical fallback and immutable save/reload. `post-event-report.spec.ts` checks desktop, laptop and two phone widths; the existing inbox layout tests cover ordinary messages and training reports.
