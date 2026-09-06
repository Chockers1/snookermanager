# Frame scoring integrity

147 is the normal maximum break in standard 15-red snooker, not an absolute cap on either a player's frame total or the combined score. Foul awards, free balls and a respotted black can add points. The game also has explicit special-event rules.

Completed live and simulated-visit frames now retain the points earned by visits. The old simulated-frame settlement rerolled the winner and could increase the selected winner's score above the other player's score after play ended. This has been removed; a tied frame still awards the deciding black's seven points.

Quick career frame scores share a 147-point budget because that generator does not simulate extra foul/free-ball awards. Breaks remain bounded by the corresponding player's frame score. Conceding awards the frame to the opponent while retaining actual scores, including when the conceding player is leading or scores are tied.

Existing saved results are not rewritten: high totals alone cannot distinguish legitimate foul awards from old inflation. The fix applies to subsequent frame settlements.

Regression coverage includes 4,000 generated frame outcomes, both winner directions, preserved completed scores, genuine high totals, tied black scores, concessions and live final-pot integration. The existing tactical test samples 12 seeded matches so its scoring/safety assertions do not depend on one random sequence.
