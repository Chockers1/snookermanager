# Season-local weeks

Visible dates use Season 1 · Week N, then Season 2 · Week 1 at sporting-season rollover. The footer, dashboard training overview, planner, legacy snapshot and chart labels use the same clock. Calendar year labels remain visible where useful.

The persisted seasonClock stores the first career season and the lifetime week at the current season opening. The lifetime week remains unchanged for contracts, sponsor cadence, training idempotency and financial settlement. This prevents resetting a visible number from charging bills twice or replaying training. The first season retains its existing week number; subsequent seasons start at one.

Weekly report titles describe the completed week, so settling Season 2 Week 1 produces that report and moves the display to Week 2. New historical snapshots and fortnightly reports retain their own season/week metadata. The season origin persists beyond the twelve-season archive limit. Existing saves initialise their clock from surviving season records and the weekly settlement anchor; migration neither advances time nor charges cash.

Strain and burnout are training-health measures. Zero is a valid recovered state. Heavy training increases both; the weekly report now explains recovered 0/0 values rather than implying missing data.

Validation: 477 unit tests passed. Rollover and footer checks passed at 1280, 390 and 320 pixels. Current-season legacy weekly email titles migrate when their completed-week mapping is known; older historical mail retains its existing subject.
