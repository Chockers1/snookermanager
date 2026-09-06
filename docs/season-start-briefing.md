# New-season inbox briefing

The season-start email shows current ranking, funds, confidence, freshness, sponsorship income and tour-card status. It compares up to five key upcoming events with the same events in the immediately preceding season, including recorded finishing round and prize money. The next event, dates, entry deadlines and eligibility explanations use the existing game rules. Professional careers include the World Championship, UK Championship and Masters; other careers receive eligible pathway highlights and marked priorities.

Current-season briefings refresh from the save when viewed, including legacy messages without an embedded report. New messages also retain a dated snapshot for future seasons. Old messages with neither a snapshot nor a matching current season are not filled with unrelated current data. Older current-season messages are archived before calendar rollover. Missing previous appearances are explicitly labelled, and qualifiers are never matched to their main event by partial name.

The briefing uses the full reading area with a message selector. Desktop career details and event comparisons sit side by side; phones scroll the report while keeping actions visible. Plan Season opens the calendar; Tournament Hub opens match preparation.

Validation: five dedicated unit tests plus season rollover/archive regressions, browser coverage at 1280×720, 390×844 and 320×568, lint and production build. The browser fixture includes an unavailable tournament with its complete entry explanation.
