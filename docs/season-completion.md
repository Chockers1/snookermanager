# Season completion and review

When no eligible event remains, the dashboard next step and Tournament Hub offer Finish Season. This uses the existing calendar and weekly settlement logic, including training, contracts, finances and CPU results. It pauses for a live match, eligible entry, pending career decision or blocked calendar action.

Rollover now stops on June 30, the opening date of the Championship League, if it falls before the next weekly settlement. The entire League belongs to the new sporting season. Calendar year shifts use UTC so a local timezone cannot move event dates back a day. The next full week is not charged early and opening calendar days are not skipped. The season remains locked for review until Start New Season.

An automatic, scrollable native dialog shows the season record, final rank, titles, prize earnings, tour-card decision, closing world top ten and player position, and major champions. Closing it is saved; Open Review Popup on the full report reopens it. Full Season Review retains the report and next-season action.

Champions come from recorded finals or surviving player title records, excluding qualifiers. Missing legacy champions remain explicitly unknown. Closing rankings are captured before next-season tables are rebuilt.

Validation: 462 unit tests, desktop and phone browser checks at 1280, 390 and 320 pixels, lint and production build. The private RT save copy was replayed through an 8-10 World Championship exit on 17 April, then advanced to the July 1 review and unlocked 2027/28. The live player save was not changed.
