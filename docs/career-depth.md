# Career depth

Career depth adds decisions between tournaments without changing the application's header, navigation or visual theme. It uses authored situations, recorded results and existing money/condition systems; no AI service or subscription is involved.

## Where to find it

| Existing screen | Addition |
| --- | --- |
| Inbox | Major choices, disclosed consequences and four-week follow-ups |
| Calendar | Season strategy, six-week booking approval, spending limits and dated commitments |
| Training | Multi-week project, measured progress, shared practice and partner focus |
| Staff | Working relationship, agreed goals and development review conversation |
| Tournament Hub / Match Preview / Match Review | Relevant rivalry context and pending-decision notice |
| Season Review | Durable career story, project and relationship history; link to next-season planning |

Training and calendar editors open over the existing workspace and scroll internally when necessary. They do not compress the timetable. Editors use native dialogs with keyboard focus containment, Escape and an explicit Close button.

## Stories

Qualifying evidence creates at most one unresolved major decision, with at least 28 game days between new stories. Reading the inbox is not a response. Decisions expire after 14 days without a decline penalty. Resolve a choice explicitly; its consequences are applied once and its four-week review remains in career history even if its inbox message is trimmed.

- Three deciding-frame defeats in the last ten matches: pressure project, paid support, or retain the approach.
- A first recorded top-eight breakthrough on a competition ladder: an exhibition, a sponsor introduction, or protect preparation.
- Three consecutive opening-match eliminations: cue-action rebuild, coaching review, or continue unchanged.
- A first explicitly televised quarter-final: media appearance, coached pressure work, or decline optional media.

Broadcast rounds are explicit tournament metadata, not inferred from every quarter-final. A warm sponsor introduction gives one eligible offer +5 percentage points on one negotiation for 28 days. It does not sign a contract or bypass capacity/reputation checks. Media acceptance discloses the fee, reserved day, fatigue and extra one-point confidence cost of defeats during the next 28 days.

Follow-ups separate results from training adherence, flag small samples and count matches played later on the day of the choice. They do not claim that a programme caused a result merely because the player won.

## Relationships and development

Three meetings with at least two deciding frames establish a rivalry. Stable world-player IDs keep encounters separate; ambiguous historical names are not merged. Repeated observed tactics can select an existing opponent counter. Rivals receive no new raw attributes or probability boost. Retirement stops new competitive/partner availability without deleting history.

One practice partner and one development project may be active. A partner replaces an existing technical session, never adds time. Choose long potting, break building, cue-ball control or safety as the shared focus. Competition, travel and injury can make the partner unavailable.

| Project | Relevant sessions | Training weeks |
| --- | --- | ---: |
| Long-pot reliability | Long Pot Routine / Line-Up Drill | 4 |
| Opening safety | Safety Exchanges | 4 |
| Repeatable cue action | Line-Up Drill / Long Pot Routine | 6 |
| Long-match stamina | Fitness | 6 |
| Pressure management | Mental Training / Review | 4 |

Three relevant completed sessions are required for a week to count. Injury or protected competition weeks pause rather than fail the project. Training still goes through fatigue, facility, health and coaching modifiers. Project/partner additional efficiency is capped at 10% and targets the relevant skills. Completion awards no attribute lump sum. Completed project records retain their closing attribute values, rather than changing as the player trains later.

Cue-action work applies a temporary two-point effective Consistency reduction until two relevant training weeks are complete. Permanent attributes are untouched by the penalty; cancellation or completion removes it. Matches supply potting/safety statistics, highest break and long-match results—not permanent development rewards.

Coach understanding responds to agreed sessions, workload and periodic review conversations. Reviews can occur once every four weeks. Relationship effects on future negotiated weekly costs are capped at 3%; no automatic hiring, dismissal, departure or mid-contract price change occurs.

## Planning and commitments

Strategies recommend ranking opportunities, selected peak events, longer development gaps or affordable competition. Every included/omitted event has a reason. Only six weeks of execution can be approved at once. The player supplies the event list, booking ceiling and minimum reserve. The suggested reserve covers four weeks of current recurring commitments; uncertain winnings are never treated as available money.

Assistance is initially off. Once approved, it calls the same validated entry/travel operations as manual play and rechecks costs, cash, eligibility, equipment, health and conflicts. It pauses for material changes and does not buy equipment, hire staff, accept contracts, withdraw, select optional support or play matches. Preparation, major decisions and Season Review stay with the player.

Approved peak events protect the three preceding days for light match preparation, review and rest. Competing commitments cannot consume this window.

- **Exhibition:** available through a breakthrough invitation, one reserved day, disclosed income on completion, +6 fatigue. No playable match, result, title or ranking points.
- **Practice camp:** three reserved days, disclosed upfront cost, +4 fatigue, +3 temporary sharpness. Combined camp sharpness caps at five and expires after 14 days.
- **Sponsor appearance:** requires an active sponsor or media invitation, one reserved day, disclosed completion income and +3 fatigue. Ordinary paid sponsor appearances are limited to one every four weeks and contribute to existing sponsor compliance.
- **Recovery block:** two reserved days, no participation fee, -8 fatigue and -4 strain, bounded by current condition.

Quotes show actual dates, displaced session count, cash and condition implications. Committed days replace all three sessions and cannot also claim ordinary training/recovery rewards. Upfront costs are non-refundable if a future commitment is cancelled; unpaid appearance income is forfeited. Started commitments cannot be cancelled.

## Confidence

Positive training/support effects diminish above 65 and cannot keep pushing confidence beyond 90. Weekly confidence moves 12% toward a form-sensitive baseline. An upset produces a different response from an expected win; losing runs lower confidence. Equipping an owned purchase and reconfirming travel/preparation do not farm rewards. Existing careers converge through play, with no abrupt confidence reset.

## Persistence and time

Save schema 9 adds `careerDepth`. Existing careers retain their saves, cash, history and named slots. Migration reconstructs uniquely identifiable encounters but does not replay historical stories or rewards. Pending decisions live outside the inbox's 18-message presentation limit.

The weekly settlement anchor is persisted separately from the current date. Partial advances stop at commitment/event/review boundaries without repeating cash or training. Completed live matches retain a source session ID, so finalization cannot settle the same live result twice. Commitment IDs and story decisions are likewise once-only.

New rules are split across `src/game/careerDepth/` (stories, relationships, projects, commitments, planning and typed actions) and `src/game/confidenceSystem.ts`; the game-state hook integrates them with existing actions.

## Verification

Run `npm test`, `npm run lint`, `npm run build` and `npx playwright test`.

The long-career matrix command is:

```text
npm run simulate:balance-matrix -- --seasons=30 --seeds=104729,130363 --concurrency=3
```

This covers all 12 starting paths with two derived seeds each. The matrix agent uses conservative story responses and existing managed support. It checks confidence saturation, story cadence, duplicated reward ledger IDs, spending ceilings and match-driven permanent-attribute inflation. Paid choices, project completion, reservations and assistance boundaries are exercised separately by unit/browser tests; the matrix is not proof that every possible player strategy is optimally balanced.

Raw simulation JSON, browser screenshots and generated logs remain in ignored `artifacts/`. See the dated career-depth QA report for results and any remaining review flags.
