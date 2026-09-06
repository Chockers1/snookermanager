# Season-two entry recovery

Reproduced on an isolated copy of RT's save before Shanghai entry: world rank 18 and top-32 access were valid. Adding an Entered history row for the new season reset the recent-season win count used by a hidden ranking floor. That floor changed eligibility to bottom-tour rank 65 while the visible ranking stayed 18. Shanghai remained Entered, the next-event selector moved to Saudi, and the one-entry guard prevented entering Saudi.

Removed the performance ranking floor from entry eligibility, career-stage labels and season-end card assessment. Those decisions now use the earned ranking. Form and title history still inform separate career achievements and contender labels.

Established active draws remain visible if eligibility later changes, preserving their booking and progress on reload. The hub offers Withdraw Entry before any match starts, using existing withdrawal/refund rules. Invalid legacy entries without an established draw still receive the existing save repair.

Validation: reproduced entry now retains rank 18, Top 32 Professional and Shanghai as the active event. Dedicated regression tests cover the zero-win new-season record, reload, changed eligibility, withdrawal and Saudi Round 3 seeding. Browser test covers entry, reload, withdrawal, skipping Shanghai and entering Saudi. An isolated browser loaded RT's latest 7 August 2027 save: £199,015 cash, one completed Saudi round, the complete draw and the live match were unchanged. The live browser save was not edited or rewound.
