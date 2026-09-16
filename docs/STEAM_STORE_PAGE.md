# Steam store page — offline draft

Based on the implemented repository as of v0.1.9. Nothing here has been submitted. Product branding and all feature claims require Rob's final review.

## Identity

- **Product:** Snooker Career Manager
- **Developer:** [ROB TO CONFIRM]
- **Publisher:** [ROB TO CONFIRM]
- **Release wording:** Coming Soon. Launch date and full release versus Early Access: [ROB TO CONFIRM].
- **Support contact:** [ROB TO CONFIRM]
- **Website:** [ROB TO CONFIRM]
- **Pricing / territories:** [ROB TO CONFIRM]
- **Genre recommendation:** Sports, Simulation, Strategy; final store selection [ROB TO CONFIRM].
- **Platform:** Windows x64. macOS, Linux, Steam Deck and controller compatibility are not claimed.
- **Language:** English interface. No implemented localisation catalogue or voiced dialogue found; do not tick unsupported languages or full audio.

## Short description

Build a snooker career from the junior circuit to the world stage. Plan training, manage coaches and sponsors, enter tournaments and guide your player through tactical, frame-by-frame matches. Every season adds results, rivals and decisions to your career story.

## About This Game

### Build your place on the tour

Create a player and choose your starting path. Develop through youth and amateur competition, pursue professional qualification, or begin on the main tour. Plan the events that matter, understand entry requirements and follow your progress through the rankings.

### Manage the player behind the results

Build a training week around your strengths, weaknesses and schedule. Hire specialist coaches, choose equipment and balance preparation with rest. Confidence, fatigue, health and working relationships give you decisions beyond simply entering the next tournament.

### Make the calls during a match

Choose your tactical approach and follow simulated visits, breaks and frame results in Match Centre. Use Auto Play or simulation controls to set your pace. Review the evidence afterwards and decide what deserves attention in training. This is a career-management simulation, not a direct cue-control or 3D shot-playing game.

### Build a career that lasts

Negotiate sponsorship, budget for travel and accommodation, and react to opportunities and setbacks. Follow named opponents, developing rivalries, qualifying routes and an evolving tour. Look back through season reviews, titles, records and tournament histories as your career grows.

### Play at your pace

Play single-player offline. Keep independent local careers, export portable backups and use automatic recovery saves. Readability controls, optional navigation shortcuts and a dismissible first-week guide help you find your way around the game.

## Key features

- Multiple starting paths and season-by-season progression.
- Tournament calendar, entry criteria, qualification, draws and ranking lists.
- Tactical simulated match play, Auto Play, Quick Sim and post-match analysis.
- Training, development projects, form assessment and practice partners.
- Coach contracts, equipment, travel, sponsorship and financial management.
- Health/recovery and mental-state management.
- Rivalries, selected interviews, seasonal stories and fictional pairs side events.
- Player profiles, career histories, achievements and season reviews.
- Local autosaves, named careers, recovery backups and portable exports.

Do not market the fictional roster as licensed real players. Do not market in-game achievements as Steam achievements. Evidence is recorded in the claim table below.

## Suggested categories and tags

Category: **Single-player**. Mouse/keyboard interface. Do not select online multiplayer, co-op, Steam Cloud, Steam Achievements, Workshop, full controller support or Steam Deck verification without implementing/testing those integrations. Team competitions are single-player simulated events, not multiplayer.

Suggested tags, strongest first: **Sports, Management, Simulation, Strategy, Singleplayer, Resource Management, Choices Matter, Replay Value**. Verify actual tag availability and final relevance manually [ROB TO CONFIRM]. “Pool” is an optional discoverability tag only if Rob accepts the mismatch with snooker; it is not a claim of American pool rules. Avoid tags implying direct cue control or a physics game.

## System requirements — proposals, not measured minimums

| | Minimum proposal | Recommended proposal |
| --- | --- | --- |
| OS | Windows 10 64-bit, fully updated; confirm Electron support at release | Windows 11 64-bit |
| CPU | Modern dual-core x64 processor | Modern four-core x64 processor |
| RAM | 8 GB | 16 GB for long careers |
| Graphics | Integrated GPU capable of running current Chromium | Recent integrated/dedicated GPU with current drivers |
| Display | 1366 × 768, keyboard and mouse | 1920 × 1080 or higher |
| Storage | 2 GB available, plus growing save data | SSD and 4 GB available for long careers/backups |
| Network | Steam installation/updates; no gameplay server dependency | Same |

Do **not** submit these as verified requirements yet. The current portable package is approximately 397 MB, but save histories and recovery copies grow. Cold load and simulation on weak hardware, 4 GB machines, integrated graphics, Windows display scaling and decades-long careers require physical-device testing. Electron/Chromium supplies the runtime; users do not install Node, npm, a browser or a dev server. No DirectX version claim is established by this audit.

## Content survey preparation

| Topic | Repository evidence / draft answer |
| --- | --- |
| Violence/gore | No combat or graphic violence identified. Sports injuries are described in management UI. |
| Sexual content/nudity | None identified in game screens or reviewed artwork. |
| Gambling | No real-money wagering, casino mechanics, loot boxes or external betting found. Tournament prize money and costs are simulated. Rob must review all text/assets. |
| Mature language | No deliberate mature-language system identified; complete authored-text review remains required. |
| UGC | Player names and local save imports are user-controlled; no public sharing/workshop/mod service found. |
| Multiplayer/online interaction | None implemented; CPU opponents and team events are simulated locally. |
| Third-party account | No game account/login. Steam ownership/access is separate. |
| External purchases | No real-money shop/payment service found. In-game funds are simulation currency. |
| DRM | No Steam DRM wrapper or ownership check added. ASAR packaging is not DRM. |
| AI content | A file named `ChatGPT Image Sep 7, 2026, 08_15_52 PM.png` and derivative asset-pack notes indicate AI-assisted artwork may be present. The game has no runtime generative-AI API found. Rob must confirm origin, rights and exact pre-generated AI disclosure. Do not answer “no AI” from absence of an online API. |

## Rob must confirm before submission

Developer/publisher legal names; pricing/territories; tax details; customer-support contact and privacy policy; release date versus Early Access; rights to artwork, logo/fonts, tournament/venue names and other referenced branding; complete age/content survey; pre-generated AI provenance and disclosure; hardware requirements; Windows versions tested. Decide whether existing demo/financial-support UI is appropriate for the commercial product, without changing gameplay in this packaging task.

Valve's current [Content Survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey) distinguishes pre-generated and live-generated AI content. Review and answer it in Steamworks using actual provenance. [Coming Soon](https://partner.steamgames.com/doc/store/coming_soon) and [release process](https://partner.steamgames.com/doc/store/releasing) requirements should be rechecked when Rob schedules submission.


## STORE CLAIM VALIDATION

Second-pass fact check against implemented v0.1.9. Internal review table; do not paste this evidence section into consumer-facing copy. Windows/platform support beyond local tests and proposed hardware minima remain [ROB TO CONFIRM]. Existing Steam links above are retained from the first pass; none was accessed this pass.

| Claim | Evidence in game / repository | Valid? | Notes |
| --- | --- | --- | --- |
| Choose youth, amateur, qualification or main-tour starts | `src/routes/NewCareerPage.tsx`, `src/data/gameSeedData.ts`, new-career actions in `src/hooks/useGameState.ts` | Yes | Progression is possible, not guaranteed promotion from every start |
| Plan tournament entries, qualifying routes and rankings | `src/routes/TournamentCalendarPage.tsx`, `TournamentHubPage.tsx`, `RankingsPage.tsx`; `src/data/tournamentRules.ts`, `pathwayCalendarData.ts` | Yes | Invitations/entry are conditional; no official licence implied |
| Guide tactical simulated matches; Auto Play / simulation | `src/routes/LiveMatchPage.tsx`, `MatchPreviewPage.tsx`, match actions in `src/hooks/useGameState.ts` | Yes | No manual cue aiming, 3D physics or multiplayer claim |
| Training, projects, partners and recorded development | `src/routes/TrainingPlannerPage.tsx`; `src/game/careerDepth/developmentProjects.ts`; `src/game/seasonLife/form.ts` | Yes | Permanent improvements are training-led; no guaranteed cure/win from a routine |
| Manage coaches and equipment | `src/game/seasonLife/staff.ts`, `src/routes/CoachMarketPage.tsx`, equipment routes/data | Yes | Real slot, contract and affordability limits apply |
| Manage sponsors and budgets | `src/game/sponsorMarket.ts`, `sponsorPerformance.ts`, `sponsorshipSystem.ts`; sponsorship/finance routes | Yes | Simulated currency, no real-money earning or external purchases |
| Travel, accommodation, injuries and recovery | `src/routes/TravelPlannerPage.tsx`, `HealthCentrePage.tsx`, `MentalStatePage.tsx`; `src/game/healthSystem.ts` | Yes | Management game estimates, not medical advice or measured shot causation |
| An evolving tour and rivalries | `src/game/tourDevelopment.ts`, `src/game/careerDepth/rivalryView.ts`, `relationships.ts` | Yes | Generated fictional opponents; avoid “licensed real players” |
| Selected interviews, stories and fictional pairs | `src/game/seasonLife/media.ts`, `teams.ts`, `src/game/careerDepth/careerStories.ts` | Yes | Occasional single-player events; not online doubles/co-op |
| Histories, titles, records, season reviews | `src/game/careerLegacy.ts`, `src/routes/LegacyStatsPage.tsx`, `SeasonReviewPage.tsx`, `OpponentProfilePage.tsx` | Yes | In-game achievements are not Steam achievements |
| A career that lasts / season-by-season play | Existing real 25-season export; 50-season audits in repository; long-history storage and packaged import/reopen checks | Qualified | Retain modest wording. Do not promise fast decades-long play on all PCs or unlimited flawless careers. External performance still needs testing |
| Single-player offline Windows x64 | `desktop/main.cjs`, `scripts/package-windows.mjs`; packaged smoke reports no HTTP requests | Yes for tested package | Steam installation/update access is separate. Other OS, Deck, controller not verified |
| Independent careers, portable backup and recovery | `src/game/saveStorage.ts`, `recoverySaves.ts`, `src/routes/SaveManagerPage.tsx`; packaged save/import/restart smoke | Yes | Local saves; no Steam Cloud integration |
| Readability, shortcuts and first-week guide | Settings route and layout/onboarding components; responsive browser tests from first pass | Yes | Enlarged text/small displays may need scrolling; do not advertise all resolutions as no-scroll |
| English interface; no full audio claim | Authored UI strings in source; no localization catalogue/voiced content found | Yes | Other languages [ROB TO CONFIRM] only after implementation/testing |
| Minimum / recommended hardware | Single local Windows environment and prior throttled simulations | Not validated | Entire requirements table is a proposal [ROB TO CONFIRM] following external-PC QA; do not submit as measured minima |

Main feature headings are the four management sections and “Play at your pace” above. Final developer/publisher, customer support, website, price, release model/date, tags, content survey, rights and proposed requirements all remain [ROB TO CONFIRM]. The store draft is editorially prepared, not submission-approved.
