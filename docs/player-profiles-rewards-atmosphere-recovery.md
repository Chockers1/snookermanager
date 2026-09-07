# Player profiles, event records, atmosphere and recovery

## Where to find the features

- Select a player name in Rankings, a tournament draw or group fixture, match preparation/results, Rivalries, or season reports. Profiles show age, current ranking, recorded form, career totals, seasonal results across circuits, ranking history, event finishes and your head-to-head. Scouting a recorded match takes one evening and improves the estimated ability range. Exact CPU ratings and potential are not disclosed.
- Open Results & rewards in the Tournament Hub, a calendar event, a past tournament run in Legacy Stats, or the post-event email. The summary separates prize cash, ranking credit, publication date and trophy/qualification status. Legacy Stats has a separate Exhibition achievements section.
- Open Around the arena in the Tournament Hub or match preview. It uses published past winners, recorded qualifiers, venue/nation matches and completed matches elsewhere in the draw. Live walkouts and century/decider commentary use the same event context. No playing probabilities were changed.
- Open Save Manager for Automatic backups & recovery, or Restore automatic backup on the career start screen. Each career keeps six progress snapshots, two pre-rollover snapshots and two pre-restore snapshots. A restore creates a new named copy and retains the previous career.

## Record integrity

Profiles never invent missing earlier results. When old CPU brackets are compacted after two years, compact player/event finishes now survive. This preserves future career title/finish lists while keeping full recent score histories. CPU seasonal ranking/results records remain available for older seasons. Existing saves whose old draws were already removed cannot reconstruct those individual events.

Reward summaries read the existing event archive and ranking ledger; viewing them does not pay money or change statistics. Exhibitions remain separate from competitive titles and world-ranking earnings. Incomplete recovered historical prize records display Not recorded. Pending world credit uses its stored publication date, rather than the date a human finishes their last match.

Atmosphere does not reveal a CPU draw simulated ahead of the current date after human elimination. Qualifiers require a published qualifying result. Home support requires a recognised venue location and matching recorded nationality. Missing evidence produces no claim.

## Save protection

Recovery snapshots use a separate IndexedDB database, snooker-career-recovery-v1. They contain compressed full game states and a checksum for accidental corruption detection. Insertion and rotation share one transaction, so a failed insertion does not delete older snapshots. Limits apply independently to each career and backup reason.

Normal active/named autosaves remain immediate. At season rollover, the recovery transaction completes before the old active season is overwritten. The completed season review is also protected before starting the next season, including an immediate click while earlier backup work is queued. A revision check prevents older queued saves from overwriting newer progress.

Restore checks the payload before hydration or save publication, backs up an active career, then publishes the recovered copy with the existing atomic local-storage batch writer. Failed validation leaves the active career unchanged. Browser storage errors appear in the app and Save Manager. If the browser has no IndexedDB, regular autosave remains available with a visible warning that automatic recovery is unavailable.

These backups stay on this browser and origin. Portable JSON export remains the way to retain an external copy or move between devices. Recovery snapshots are not uploaded.

## Validation

- 542 unit/hook tests pass, including public-history filtering, compacted CPU finishes, reward timing, exhibition separation, snapshot integrity, rotation isolation and save queue recovery.
- Production build and lint pass.
- Browser coverage uses isolated fixtures: desktop/mobile profile navigation and scouting; exhibition achievements; real IndexedDB rotation; corrupt payload rejection; failed insertion retaining older backups; restoration into a separate named copy; pre-rollover storage failure and recovery; retained season-review snapshot on the start screen.
- Adjacent browser checks cover rankings card layout, post-event reports and owned-chalk restocking.
