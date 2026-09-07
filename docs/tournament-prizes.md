# Tournament prize schedules

The main-tour calendar uses a fixed **2025/26 published baseline**, including for later fictional seasons. These are finishing awards, never cumulative round payments. This does not claim that 2027/28 purses have been announced. The calendar's retained events and formats are not replaced by a real-world later calendar.

Sources checked 7 September 2026:

- [WST Wuhan Open draw and full prize table](https://www.wst.tv/news/2023/august/29/wuhan-open-draw/): unchanged Wuhan structure, £140,000 winner, £30,000 semi-final, £12,000 last 16, £8,000 last 32.
- [WST Shanghai draw and full prize table](https://www.wst.tv/news/2023/august/11/ding-to-meet-si-in-shanghai/): £210,000 winner through £10,000 last 24.
- [2025/26 ranking-stage schedule](https://en.wikipedia.org/wiki/2025%E2%80%9326_snooker_season#World_ranking_points): event-specific ranking cash amounts. Cash-only first-round awards are separately accounted for.
- [WST World Grand Prix 2026 announcement](https://www.wst.tv/news/2025/december/19/tickets-on-sale-for-2026-world-grand-prix-in-hong-kong/): £700,000 fund, £180,000 winner.
- [International 2025 results and prize breakdown](https://www.snooker.org/res/index.asp?event=2342): £9,000 last 32.
- [UK 2025 breakdown](https://en.wikipedia.org/wiki/2025_UK_Championship#Prize_fund), [World 2026 breakdown](https://en.wikipedia.org/wiki/2026_World_Snooker_Championship#Prize_fund), [Masters 2026 breakdown](https://en.wikipedia.org/wiki/2026_Masters_(snooker)#Prize_fund).
- [Champion of Champions](https://en.wikipedia.org/wiki/2025_Champion_of_Champions#Prize_fund), [Riyadh Season](https://en.wikipedia.org/wiki/2025_Riyadh_Season_Snooker_Championship#Prize_money), [Saudi Arabia Masters](https://en.wikipedia.org/wiki/2025_Saudi_Arabia_Snooker_Masters#Prize_fund).
- [WPBSA ranking exclusions](https://www.wpbsa.com/rankings/rankings-faq/): invitations, high-break bonuses, Shoot Out opening losses and protected seeded losses are distinct from counting ranking credit.

`src/data/tournamentPrizes.ts` is the explicit shared finishing schedule. Existing Championship League group/frame payments, Q School zero purses and authored Q Tour/senior schedules remain specialized. Fictional local events retain their authored economy. Declared total funds can include high-break money; this change covers finishing awards, not new bonus mechanics. Attached qualifying purses cover eliminated qualifiers, not an extra trophy or duplicate main-event payment.

## Existing-save correction

A versioned, idempotent migration recalculates every retained, recognizable complete event draw for all entrants. It replaces ledger award amounts while retaining publication and expiry dates, separates cash awards from ranking credit, updates retained human result/financial/trophy records and reconciles cash once. CPU seasonal/career prize totals receive the corresponding differences. The migration report lists cash corrections, including negative corrections for old overpayments.

Missing or obsolete draw stages are reported as unresolved. Estimated opening balances are retained. A human cash award can be recovered from their known finishing stage even when there is insufficient whole-tour evidence to recalculate that historical ranking event; the migration report flags that limitation. Saved ranking positions lack the expired underlying earnings needed for reliable historical reconstruction, so corrected ranking revisions restart at the repair date. Recorded matches and locked seedings are preserved rather than replayed.

Before autosave publishes a migrated career, the previous serialized save is retained in Save Manager as **Before prize correction**. Restoring an old save re-applies the deterministic repair once to that original balance; restoring a repaired save does not pay again.

The retained game formats for Wuhan and Xi’an contain three preliminary stages. Only their last preliminary stage carries the published last-64 award; the two earlier game stages are unpaid. Shanghai's “Round 1” means last 24, and Tour Championship's “Round One” means last 12. Champion of Champions group semi-finals/finals carry the last-16/quarter-final awards. The UI lists only stages present in that event's current format.

For old events without separate cash receipts, a complete retained draw and the previous fixed prize formula provide the previous CPU/human cash award. A recovered human history row containing only ranking credit is insufficient by itself. Unrecognized stages and missing draws are left unresolved and listed in the correction inbox message. The original historical ranking positions and cash snapshots are not rewritten as if the new prizes had always existed; cumulative prize records are restated where supported.
