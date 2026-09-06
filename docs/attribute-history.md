# Attribute development comparisons

Player Attributes defaults to Since start and also offers This season, 3, 6, 12 and 24 months. The selected baseline drives attribute gains and declines, the development summary, and the overall-rating change in both grouped and flat views.

New careers retain an immutable starting snapshot. Career state recalculation records dated attributes and the actual overall rating, replacing duplicate same-day readings. Each season keeps its own baseline across rollover. Records within 26 months stay exact; older months retain their first and last readings. Career and season baselines are retained separately.

Rolling periods subtract calendar months with month-end clamping. The comparison uses the latest saved measurement on or before the requested date, and displays that measurement date. When the career began within the window, its starting measurement is used. No interpolation is performed.

Existing saves recover the current season baseline and the surviving complete fortnightly report. Its full change list can reconstruct the report's starting attributes. Earlier history that was never retained is marked partial; missing historical overall ratings are not calculated using today's personality/style and presented as historical facts.

Recover from older save merges measurements from an exported JSON or compressed save with the same world seed and player identity. It rejects future saves and invalid attributes. Only attribute history changes: dates, current attributes, match progress, cash and all other game state remain intact. Existing records win when dates or seasons overlap. This feature does not restore an older career.

Validation: unit coverage for calendar boundaries, gains/declines, legacy report reconstruction, immutable baselines, save serialization, recovery isolation, long-term retention and actual season rollover; browser coverage for comparison controls, both views, reload, recovery and desktop/mobile layout.
