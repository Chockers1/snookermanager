# In-season career systems

## Where players find them

- Training and Match Review: **Form assessment** opens recorded evidence and recovery choices.
- Staff: **Staff ambitions, renewals & junior development** shows contract dates, promises, costs, CPU destinations and replacement suggestions.
- Calendar: **Club & national pairs** opens optional invitations, partner selection, ties and separate team records. Accepted dates also appear beside the calendar link and protect training/entry scheduling.
- Inbox: significant interviews and linked story updates use the normal message body. Required older career decisions take initial-selection priority over optional interviews.
- Legacy Stats: **Season stories, interviews & team trophies** opens stored conclusions and media history, with a link to team results.
- Match Centre: team singles and deciding doubles use the existing playback and tactics controls. A compact participant section shows playing order and individual condition. Doubles scorecards clearly label pair-average condition, while the at-table label names the actual striker. Leaving Match Centre returns to the team page, where Resume match continues the saved rubber.

## Form evidence and limits

The live engine records modelled long-opening decisions, successes, and frames with a late lead of at least 25 points while at most 75 remain. A lost lead is recorded when that frame is lost. These are simulation events, not measured real-world shot distances; estimated match percentages are never expanded into invented attempts.

Evidence comes from Match Centre visits, including Auto Play and its simulation controls. Aggregate Quick Sim outcomes do not manufacture or dilute shot evidence. While a form issue is active, Quick Sim uses the visit engine so the same situational effects apply.

An established baseline plus three consistently weaker matches is required. Long-opening diagnosis requires at least twelve attempts in each window and a twenty-percentage-point decline; closing diagnosis requires losses from strong positions in each of three matches and deterioration against the player's own baseline. Fifteen compact evidence rows are retained.

One issue can be active. The temporary effect is at most three effective points in long potting or closing composure. Permanent attributes are unchanged. Episodes are spaced at least eight weeks apart. Patience clears the effect within six weeks. Three suitable training weeks target earlier recovery; only one credit can be earned per training week. Coaching, training and tactical protection do not stack into an instant cure. Protection uses a safety-first approach, sacrificing speculative attacking chances. An active cue-action project retains its existing adjustment cost without an additional form penalty.

## Staff and contracts

Stable ambitions are stored per coach. New renewal notices are generated with 14–35 days remaining. Legacy short contracts receive no backdated demand. Signed terms remain binding. Extensions add thirteen explicitly approved weeks billed through the existing weekly ledger; they require an adequate cash reserve. Facility/workload promises have dates and a later trust review. A player can make a promise and explicitly extend the contract separately.

Unanswered notices spend nothing. Contract expiry can move the coach to a named CPU player for a year, with employment history and recruitment exclusion. Departures do not stop training. Junior coaches occupy normal unlocked slots, earn experience only through completed relevant coaching work, and can be mentored only by an employed senior in another actual slot. A milestone offers a responsibility review; silence retains the supported role and pay.

## Fictional pairs events

Youth Club Pairs, Amateur Club Pairs and Nations Pairs Invitational are explicitly fictional local-host events. Eligible named fields are required; unavailable/retired/injured players are excluded. Young players established on the amateur/Q Tour path receive amateur pairs. National selection uses the available country ranking at the stated cutoff.

Invitations search free two-day windows and are capped at two accepted events per season. Costs, host support and equal per-player award shares are disclosed before booking. Unanswered invitations expire without penalty; missed accepted events are withdrawn without an award. Booking expenses are not charged again on match completion.

Four two-player teams play semi-finals and a final. Every tie consists of two singles rubbers, then doubles only at 1–1. Every rubber is best of three frames. The user's singles and doubles are playable; the teammate's singles and the other ties use the same visit engine.

Doubles preserves a fixed four-player playing order per frame, alternates the starting side, retains a striker throughout their break, and rotates after a visit ends. After an opponent foul the user can request that the offender play again without changing the order. Four individual profiles, confidence/fatigue, visits, points, fouls and highest breaks survive reload. Individual abilities drive play; partnership coordination is capped at 1.5 cue-control points.

Rules reference: [WPBSA official rules](https://www.wpbsa.com/rules/), four-handed snooker. This uses the game's existing visit-based simulation, rather than a physical table simulation.

Team rubbers, trophies and per-player award shares are kept in the team ledger. They do not enter singles matches, singles head-to-head, ranking earnings, major-title totals or singles invitation qualification.

## Media and connected stories

Significant finals, televised breakthroughs, consequential rivalry matches and team outcomes may offer an interview. One interview is allowed per event instance; future seasons can have a fresh interview at the same named tournament. Replies expire after three days. Silence is private/no comment without punishment.

Praise, candour and challenges make small persistent changes to respect, rivalry or coach trust, with saved fictional media temperaments and short public expectations. Three relevant challenges within ninety days can slightly raise sponsor performance expectations; the sponsor review explains the link. An answer never directly pays money or cancels a sponsor.

Stored arcs cover form assessment/recovery, coach renewal/preparation, junior development/responsibility, recorded rival injury returns/next meetings, and team invitations/outcomes. IDs suppress duplicates. Unanswered optional choices never join the old mandatory-career-decision queue. Only recorded injuries can generate an injury-return story.

## Persistence and performance

`CareerDepthState.seasonLife` is a separately versioned record. Migration initialises neutral evidence and cursors, preserving contracts, existing projects and finances. No old result is replayed as a new slump, interview, departure or reward. Team context is optional in live saves; the default path remains singles.

Updates run after new matches, training settlements or date changes. Same-date/same-match reconciliation returns immediately. Inbox navigation displays stored records. Diagnostic rows, story steps, media history, employment history and seasonal summaries are bounded. Completed story conclusions are preserved in a compact archive; pending arcs are not discarded by the detailed-history limit. Older team events retain concise named results, awards and trophy records when their detailed frame records are archived. Failed team invitation searches have a 28-day retry interval rather than scanning the tour on every click.

Visit IDs now use a saved sequence counter: the previous clock-only ID could collide during fast simulation.
