# Snooker Career Manager — Master Build Brief for VS Code / Copilot

**Version:** 3.0 — includes all screenshot references, technical stack, routing, components, formulas, save schema, testing checklist and phased prompts

## Purpose of this document

This is the single source-of-truth build brief for **Snooker Career Manager**.

Use this document together with the screenshots in:

```txt
/design/screenshots/
```

The screenshots define the visual direction. This document defines the product scope, screen behaviour, layout rules, build order, data model, and exact implementation prompts.

---

# 1. Game Vision

**Snooker Career Manager** is a full-width, Football Manager-style desktop management game where the user creates and manages **one snooker player’s career**.

The user does **not** directly play shots. Instead, they manage:

- Player creation
- Career pathway
- Attributes
- Training
- Coaches
- Finances
- Equipment
- Cue, chalk and tip setup
- Tournaments
- Travel
- Rankings
- Match preparation
- Match simulation
- Sponsorships
- Inbox/news
- Injuries
- Mental state
- Slumps
- Career stats
- Legacy

The career should progress from junior/amateur level through Q School, the professional tour, elite ranking status, veteran years, and eventual senior/legacy status.

---

# 2. Non-Negotiable Scope Rules

## Build this game as:

```txt
Single created-player career management only.
```

## Do not build:

- Academy mode
- Stable management
- Multiple managed players
- Multiplayer
- Real licensed snooker players
- Real sponsor brands
- 3D snooker physics
- Direct cue control
- Online backend
- Database integration in the first build

The MVP should use **mock data first**.

---

# 3. Core Gameplay Loop

The full game loop is:

```txt
Create player
→ Train weekly
→ Improve attributes
→ Hire better coaches
→ Buy better equipment
→ Enter tournaments
→ Plan travel
→ Prepare tactics
→ Simulate matches
→ Earn prize money
→ Gain ranking points
→ Receive sponsorship offers
→ Manage fatigue, confidence and injuries
→ Advance career stage
→ Build legacy
```

Every screen should support this loop.

---

# 4. Visual Style

The UI should look like a premium sports management simulation inspired by Football Manager, but original.

## Main visual principles

- Full-width desktop layout
- Dark navy/slate theme
- Emerald green and muted gold accents
- Dense dashboard style
- Left sidebar navigation
- Top status/status bar
- Data-rich panels
- Tables, stat cards, badges, tabs and progress bars
- Compact spacing
- Minimal wasted space
- Designed for long sessions
- Professional, serious and polished

## Suggested colour tokens

```ts
const theme = {
  background: "#07111f",
  backgroundDeep: "#050b14",
  panel: "#0d1b2a",
  panelSoft: "#102033",
  panelHover: "#132b43",
  border: "#203449",
  borderStrong: "#31506f",
  textPrimary: "#f8fafc",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  green: "#22c55e",
  greenDark: "#14532d",
  gold: "#f2b705",
  amber: "#f59e0b",
  red: "#ef4444",
  blue: "#38bdf8",
  purple: "#a855f7",
};
```

---

# 5. App Shell Layout

Every main screen should use the same shell.

## Layout

```txt
┌──────────────────────────────────────────────────────────────┐
│ Top Status Bar                                                │
├───────────────┬──────────────────────────────────────────────┤
│ Left Sidebar  │ Main Page Content                             │
│               │ Optional right context panel                  │
└───────────────┴──────────────────────────────────────────────┘
```

## Top Status Bar should show

- Player name
- Nationality flag
- Career level/stage
- World ranking or amateur ranking
- Form last 10
- Confidence %
- Funds
- Cash flow
- Next event
- Days until next event
- Inbox icon with count
- Notification icon with count
- Settings icon

## Left Sidebar should include

- Dashboard / Home
- Career
- Player
- Training
- Staff / Coaches
- Equipment
- Finance
- Calendar
- Tournaments / Events
- Rankings
- Matches / Match Centre
- Sponsorship
- Inbox / News Centre
- Reports / Stats
- Health / Mental
- Legacy
- Settings

Use nested sub-navigation where required, for example:

```txt
Equipment
  Cue Shop
  My Equipment
  Chalk & Tips
  Table Setup
  Maintenance
```

---

# 6. Screenshot Reference Map

Use the existing screenshots as the visual source of truth.

## Core UI screens

| Route | Screen | Screenshot |
|---|---|---|
| `/` | Career Dashboard | `Career Dashboard Screen.png` |
| `/inbox` | Inbox & News Centre | `Inbox News Centre.png` |
| `/career/progression` | Career Stage Progression | `Career Stage Progression Screen.png` |
| `/new-career` | New Career / Create Player | `New Career Create Player Screen.png` |
| `/career/stats` | Legacy & Career Stats | `Legacy Career Stats Screen.png` |
| `/sponsorship` | Sponsorship Offers | `Sponsorship Offers Screen.png` |
| `/rankings` | Rankings | `Rankings Screen.png` |
| `/match/result` | Match Result Summary | `Match Result Summary Screen.png` |
| `/match/live` | Live Match Simulation | `Live Match Simulation Screen.png` |
| `/match/preview` | Match Preview | `Match Preview Screen.png` |
| `/calendar` | Tournament Calendar | `Tournament Calendar Screen.png` |
| `/equipment/chalk-tips` | Chalk & Tip Shop | `Chalk and Tip Shop Screen.png` |
| `/equipment/cues` | Equipment / Cue Shop | `Equipment Cue Shop Screen.png` |
| `/staff/coaches` | Coach Market | `Coach Market Screen.png` |
| `/finance` | Finance Dashboard | `Finance Dashboard Screen.png` |
| `/training` | Weekly Training Planner | `Weekly Training Planner Screen.png` |
| `/player/attributes` | Player Attributes | `Player Attributes Screen.png` |
| `/staff/coaches/:id` | Coach Profile Detail | `Coach Profile Detail Screen.png` |

## Additional screenshots already created

Use these when implementing later phases:

| Route | Screen |
|---|---|
| `/season-review` | End of Season Review |
| `/health` | Injury / Health Centre |
| `/mental` | Mental State / Slump Recovery |
| `/sponsorship/contract` | Sponsorship Contract Detail |
| `/equipment/maintenance` | Equipment Maintenance |
| `/travel` | Travel Planner |
| `/tournaments/draw` | Tournament Draw / Bracket |
| `/tournaments/hub` | Tournament Hub |
| `/training/report` | Training Report / Coach Feedback |

---

# 7. Screen Requirements

## 7.1 Career Dashboard

Purpose: main save hub.

Must show:

- Player identity card
- Ranking
- Form
- Confidence
- Funds
- Next event
- Days until event
- Recent results
- Training week overview
- Attribute summary
- Finance summary
- Equipment summary
- Coaching team summary
- Up next panel
- Continue button
- News ticker/feed

Dashboard should feel like the main Football Manager home screen.

---

## 7.2 New Career / Create Player

Purpose: start a new save.

Must include:

- Stepper: Identity → Background → Attributes → Confirm
- Name
- Nationality
- Age
- Handedness
- Cue style
- Playing style
- Personality sliders
- Starting background cards
- Player preview card
- Starting rating
- Prospect stars
- Starting attribute preview
- Starting funds
- Starting strengths and weaknesses
- Career difficulty gauge
- Confirm / continue button

Starting background options:

- Club Junior
- Academy Prospect
- Family-Funded Talent
- Working-Class Grinder
- Overseas Prodigy

Each background should affect starting money, starting attributes, development speed and difficulty.

---

## 7.3 Career Stage Progression

Purpose: show long-term career pathway.

Stages:

1. Junior Club Player
2. Regional Youth
3. National Youth
4. Amateur Circuit
5. Q Tour
6. Q School
7. Professional Tour
8. Top 64
9. Top 32
10. Top 16
11. World Champion
12. Veteran
13. Senior Tour

Must show:

- Overall progress %
- Current stage
- Stage cards
- Progress bars per stage
- Requirements for next stage
- Typical events
- Prize level
- Coaching access
- Sponsor access
- Ranking opportunities
- Stage filter
- View mode toggle

---

## 7.4 Player Attributes

Purpose: view and manage player abilities.

Attribute categories:

### Technical

- Long Potting
- Break Building
- Cue Ball Control
- Safety Play
- Tactical Awareness
- Rest Play
- Pack Splitting
- Colour Clearance
- Shot-to-Nothing
- Consistency

### Mental

- Composure
- Focus
- Temperament
- Fighting Spirit
- Killer Instinct
- Decider Mentality
- Big Match Nerve
- Resilience
- Professionalism

### Physical

- Stamina
- Core Stability
- Balance
- Shoulder Health
- Back Health
- Hand Steadiness
- Visual Sharpness
- Recovery Rate

Must show:

- Attribute bars
- Rating out of 100
- Trend arrows
- Overall rating
- Potential
- Morale
- Match fitness
- Fatigue
- Playing style
- Personality type
- Strengths
- Weaknesses
- Coach notes

---

## 7.5 Weekly Training Planner

Purpose: schedule weekly development.

Must show:

- Weekly grid
- Days Monday to Sunday
- Morning / Afternoon / Evening slots
- Training blocks
- Training load
- Fatigue risk
- Expected attribute gains
- Coach impact
- Confidence impact
- Training balance chart
- Drill library
- Weekly summary
- Auto Plan
- Clear Week
- Save Schedule
- Continue

Training categories:

- Technical
- Mental
- Physical
- Match Prep
- Recovery
- Travel
- Rest

Example drills:

- Line-Up Drill
- Safety Exchanges
- Long Pot Routine
- Break Building
- Match Practice
- Mental Training
- Fitness
- Recovery
- Table Time
- Travel
- Rest

---

## 7.6 Training Report / Coach Feedback

Purpose: end-of-week training summary.

Must show:

- Attribute gains
- Fatigue change
- Confidence change
- Coach notes
- Drill performance
- Training load
- Injury risk
- Recommended next focus
- Warnings where needed

---

## 7.7 Coach Market

Purpose: hire staff.

Must show:

- Coach category tabs
- Sort/filter
- Coach table
- Coach profile panel
- Current coach vs selected coach
- Market summary
- Recommendation panel
- Hire coach
- Shortlist
- Compare

Coach categories:

- Technical
- Tactical
- Mental
- Fitness
- Cue Action
- Break Building

Coach fields:

- Name
- Type
- Level
- Weekly cost
- Reputation
- Compatibility
- Technical
- Tactical
- Mental
- Motivation
- Specialism
- Availability

---

## 7.8 Coach Profile Detail

Purpose: detailed coach decision screen.

Must show:

- Coach name
- Portrait placeholder
- Specialism
- Coach type
- Level
- Weekly cost
- Reputation
- Compatibility
- Personality
- Summary
- Career highlights
- Languages
- Coach attributes
- Predicted player attribute impact over 12 weeks
- Contract options
- Budget warning
- Strengths
- Weaknesses
- Style fit
- Advisor recommendation
- Back to Market
- Hire Coach
- Negotiate Contract
- Add to Shortlist

---

## 7.9 Finance Dashboard

Purpose: manage career money.

Must show:

- Cash balance
- Low cash warning
- Weekly change
- Monthly surplus/deficit
- Monthly burn rate
- Income vs expenses graph
- Income breakdown
- Expense breakdown
- Monthly budget allocation sliders
- Tournament cost planner
- Financial forecast
- Financial indicators
- Buttons:
  - Adjust Budget
  - Scenario Planner
  - Cost Cutting Options
  - Sponsorship Hub
  - View Cash Flow
  - Go to Calendar

Income categories:

- Prize Money
- Sponsorship
- Exhibitions
- Coaching Clinics
- Media

Expense categories:

- Coaches
- Travel
- Hotels
- Entry Fees
- Equipment
- Physio
- Practice Table

---

## 7.10 Equipment / Cue Shop

Purpose: buy and manage cues.

Must show:

- Tabs: Cues, Chalk, Tips, Cases, Table Setup, Maintenance
- Filters
- Sort by
- Cue product cards
- Selected cue detail panel
- Current cue vs selected cue comparison
- Cue familiarity
- Strengths
- Trade-offs
- Buy Cue
- Test in Practice
- Compare
- Equipment summary
- Budget panel

Cue stats:

- Price
- Tier
- Condition
- Weight
- Balance
- Touch
- Spin Control
- Stability
- Durability
- Familiarity
- Cue Ball Control bonus
- Break Building bonus
- Consistency bonus
- Miscue Reduction bonus

---

## 7.11 Chalk & Tip Shop

Purpose: manage chalk and cue tips.

Must show:

- Tabs: Chalk, Cue Tips, Maintenance
- Chalk table
- Tip table
- Current setup panel
- Setup bonuses
- Maintenance actions
- Apply setup
- Reset default

Chalk stats:

- Cost
- Grip
- Clean Contact
- Spin Transfer
- Consistency
- Miscue Reduction
- Kick Reduction

Tip stats:

- Cost
- Hardness
- Durability
- Spin Control
- Feel
- Consistency
- Miscue Reduction

Maintenance actions:

- Shape Tip
- Replace Tip
- Full Cue Service

---

## 7.12 Equipment Maintenance

Purpose: keep gear in good condition.

Must show:

- Cue condition
- Tip condition
- Shaft condition
- Ferrule condition
- Chalk supply
- Cue familiarity
- Durability
- Maintenance actions
- Cost
- Time required
- Attribute restoration
- Warning if ignored

Equipment degradation should matter, but not dominate.

---

## 7.13 Tournament Calendar

Purpose: choose events and manage schedule.

Must show:

- Monthly calendar
- Event colour types
- Upcoming event table
- Event details panel
- Format
- Match length
- Prize money
- Ranking value
- Entry fee
- Travel/stay cost
- Fatigue risk
- Decision impact
- Budget/ranking/fatigue meters
- Buttons:
  - Enter Event
  - Skip Event
  - View Draw
  - Travel Plan

Event types:

- Junior
- Amateur
- Q Tour
- Q School
- Ranking
- Invitational
- Senior

---

## 7.14 Travel Planner

Purpose: manage tournament travel cost vs fatigue.

Must show:

- Travel options
- Hotel options
- Cost
- Fatigue impact
- Preparation quality
- Delay risk
- Total trip cost
- Cash remaining
- Recommended option

Travel should affect finances, fatigue and performance.

---

## 7.15 Tournament Hub

Purpose: central tournament event screen.

Must show:

- Event name
- Current round
- Prize ladder
- Player path
- Next opponent
- Venue
- Match schedule
- Event objectives
- Player condition
- Confidence
- Fatigue
- Cue condition
- Form
- Pressure level
- Recent results from other matches
- Play Next Match
- View Draw
- Scout Opponent
- Change Equipment
- Withdraw

---

## 7.16 Tournament Draw / Bracket

Purpose: show knockout path.

Must show:

- Last 64
- Last 32
- Last 16
- Quarter Final
- Semi Final
- Final
- Player highlighted
- Seeds
- Rankings
- Scores
- Upset indicators
- Possible next opponents
- Difficulty rating

---

## 7.17 Match Preview

Purpose: prepare for match.

Must show:

- Player vs opponent panel
- Ranking
- Form
- Confidence
- Fatigue
- Highest break
- Recent results
- Head-to-head
- Opponent scout report
- Strengths and weaknesses
- Tactical sliders
- Equipment check
- Cue familiarity
- Mental readiness
- Recent results table
- Buttons:
  - Start Match
  - Adjust Training
  - Change Equipment
  - View Tactics Board

Tactical sliders:

- Aggression
- Safety Priority
- Long Pot Risk
- Pace of Play
- Break Building Risk

---

## 7.18 Live Match Simulation

Purpose: watch match unfold.

Must show:

- Event and round
- Player score
- Opponent score
- Best-of format
- Current frame score
- Current break
- Balls remaining
- Player at table
- Shot clock
- Momentum graph
- Pressure meter
- Confidence and fatigue bars
- Event feed
- Frame history
- Tactical settings locked during frame
- Interval information
- Buttons:
  - Continue Frame
  - Sim Frame
  - Sim Match
  - Pause

Important gameplay rule:

```txt
Tactical changes are locked during frames.
Coaching/tactics are only available at intervals.
```

---

## 7.19 Match Result Summary

Purpose: show outcome and consequences.

Must show:

- Final result
- Player photos/silhouettes
- Prize money earned
- Ranking points gained
- Confidence change
- Fatigue change
- Match stats
- Frame-by-frame result
- Coach feedback
- Equipment impact
- Continue Tournament
- View Draw
- Review Training

Match stats:

- Pot Success
- Long Pot Success
- Safety Success
- Highest Break
- 50+ Breaks
- Centuries
- Fouls
- Decider Performance

---

## 7.20 Rankings

Purpose: track ranking climb.

Must show:

- Ranking tabs:
  - World Ranking
  - Provisional Ranking
  - One-Year Ranking
  - Amateur Ranking
  - Q Tour Ranking
  - Youth Ranking
- Season filter
- Sortable table
- Player highlighted
- Ranking breakdown panel
- Projected movement
- Ranking points
- Prize money
- Source of points
- Recent results
- Next target
- Ranking movement graph
- Scenario impact if player performs well in next event
- Buttons:
  - View Player
  - View Event History

Ranking should be based on a two-year rolling list in later versions.

---

## 7.21 Sponsorship Offers

Purpose: commercial career management.

Must show:

- Sponsor deal cards
- Current sponsor slots
- Player brand metrics
- Warnings
- Sponsorship summary
- Contract comparison
- Advisor notes
- Accept Deal
- Negotiate
- Reject
- View Details

Sponsor categories:

- Local Business
- Cue Maker
- Chalk Brand
- Clothing Sponsor
- Social Media Partner

Sponsor slots:

- Waistcoat Left
- Waistcoat Right
- Cue
- Chalk
- Clothing
- Social Media

Sponsor metrics:

- Reputation
- TV exposure
- Brand fit
- Risk/trust
- Behaviour expectations

---

## 7.22 Sponsorship Contract Detail

Purpose: detailed deal negotiation.

Must show:

- Monthly payment
- Win bonuses
- TV appearance bonuses
- Social media obligations
- Behaviour clauses
- Contract length
- Reputation impact
- Sponsor slots
- Negotiation options:
  - Increase base pay
  - Reduce obligations
  - Add title bonus
  - Shorten contract

---

## 7.23 Inbox & News Centre

Purpose: messages and decision hub.

Must show:

- Message tabs
- All / Unread / Career / Finance / Media / Medical
- Message list
- Status indicators
- Subject
- Preview
- Sender
- Date
- Priority
- Selected message detail
- Event decision panel
- Accept/decline/view action buttons
- Latest news strip
- Upcoming deadlines
- Decision impact panel

Message types:

- Coach Report
- Tournament Invite
- Sponsor Offer
- Cue Maintenance Warning
- Media Article
- Ranking Update
- Injury Concern

Inbox should drive decisions, like Football Manager.

---

## 7.24 Mental State / Slump Recovery

Purpose: manage confidence, stress and form.

Must show:

- Confidence
- Stress
- Motivation
- Focus
- Burnout risk
- Pressure handling
- Overthinking risk
- Diagnosis
- Recommended actions
- Recent triggers
- Recovery plan

Possible diagnosis examples:

- Technical overthinking after heavy defeat
- Low confidence after decider loss
- Burnout from overloaded schedule
- Media pressure affecting focus
- Tactical frustration against defensive opponents

Recovery actions:

- Reduce match load
- Simple potting drills
- Sports psychologist
- Confidence-building event
- Rest week
- Avoid media
- Change coach
- Change training focus

---

## 7.25 Injury / Health Centre

Purpose: manage physical risk.

Must show:

- Back
- Shoulder
- Wrist
- Eyes
- Fatigue
- Sleep
- Mental Burnout
- Current issue
- Treatment options
- Recovery time
- Cost
- Match impact
- Risk of playing through injury

Treatment options:

- Rest
- Physio
- Reduced Training
- Fitness Plan
- Medical Review

---

## 7.26 Legacy & Career Stats

Purpose: long-term career reward screen.

Must show:

- Legacy score out of 100
- Matches played
- Matches won
- Win rate
- Titles
- Major titles
- Century breaks
- Maximum breaks
- Highest ranking
- Total prize money
- Tabs:
  - Career
  - Season
  - Tournaments
  - Opponents
  - Pressure
  - Equipment
- Ranking over time
- Prize money over time
- Confidence over time
- Career finals table
- Legacy breakdown
- Hall of fame benchmark
- Achievements and reputation
- Continue career

Legacy tiers:

- Club Player
- Tour Pro
- Ranking Winner
- World Champion
- All-Time Legend

---

## 7.27 End of Season Review

Purpose: season summary milestone.

Must show:

- Final ranking
- Ranking movement
- Prize money earned
- Titles won
- Best tournament run
- Highest break
- Centuries
- Biggest win
- Worst defeat
- Attribute growth
- Financial profit/loss
- Coach grade
- Sponsor grade
- Fan growth
- Next season objectives

---

# 8. Data Model

Create mock data first in:

```txt
src/data/mockGameData.ts
```

## Player

```ts
type Player = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationality: string;
  age: number;
  handedness: "Right-handed" | "Left-handed";
  careerStage: string;
  playingStyle: string;
  personalityType: string;
  rankingLabel: string;
  worldRanking?: number | null;
  amateurRanking?: number | null;
  cash: number;
  form: string;
  confidence: number;
  fatigue: number;
  reputation: number;
  morale: number;
  legacyScore: number;
};
```

## Attributes

```ts
type AttributeGroup = Record<string, number>;

type PlayerAttributes = {
  technical: AttributeGroup;
  mental: AttributeGroup;
  physical: AttributeGroup;
};
```

## Coach

```ts
type Coach = {
  id: string;
  name: string;
  type: "Technical" | "Tactical" | "Mental" | "Fitness" | "Cue Action" | "Break Building";
  level: "Low" | "Mid" | "High" | "Elite";
  weeklyCost: number;
  reputation: number;
  compatibility: number;
  technical: number;
  tactical: number;
  mental: number;
  motivation: number;
  discipline: number;
  specialism: string;
  strengths: string[];
  weaknesses: string[];
};
```

## Equipment

```ts
type Cue = {
  id: string;
  name: string;
  price: number;
  tier: "Budget" | "Mid-Tier" | "Elite" | "Legendary";
  condition: number;
  familiarity: number;
  weight: string;
  balance: string;
  touch: number;
  spinControl: number;
  stability: number;
  durability: number;
  bonuses: Record<string, number>;
};

type Chalk = {
  id: string;
  name: string;
  cost: number;
  grip: number;
  cleanContact: number;
  spinTransfer: number;
  consistency: number;
  miscueReduction: number;
  kickReduction: number;
};

type Tip = {
  id: string;
  name: string;
  cost: number;
  hardness: string;
  durability: number;
  spinControl: number;
  feel: number;
  consistency: number;
  miscueReduction: number;
};
```

## Tournament

```ts
type Tournament = {
  id: string;
  name: string;
  type: "Junior" | "Amateur" | "Q Tour" | "Q School" | "Ranking" | "Invitational" | "Senior";
  location: string;
  startDate: string;
  endDate?: string;
  entryFee: number;
  travelCost: number;
  hotelCost: number;
  prizeMoney: number;
  rankingValue: number;
  format: string;
  status: "Available" | "Booked" | "Entered" | "Skipped" | "High Cost";
  fatigueRisk: "Low" | "Medium" | "High";
};
```

## Match

```ts
type Match = {
  id: string;
  tournamentId: string;
  round: string;
  bestOf: number;
  playerName: string;
  opponentName: string;
  playerRanking: number;
  opponentRanking: number;
  playerFrames: number;
  opponentFrames: number;
  result: "Won" | "Lost" | "In Progress";
  highestBreak: number;
  opponentHighestBreak: number;
  fifties: number;
  centuries: number;
  potSuccess: number;
  longPotSuccess: number;
  safetySuccess: number;
  fouls: number;
  confidenceChange: number;
  fatigueChange: number;
  prizeMoneyEarned: number;
  rankingPointsGained: number;
};
```

---

# 9. Reusable Components

Build these first.

## App-level

- `AppShell`
- `Sidebar`
- `TopStatusBar`
- `PageHeader`
- `RightContextPanel`

## UI primitives

- `SectionCard`
- `StatCard`
- `DataTable`
- `StatusBadge`
- `ActionButton`
- `ProgressBar`
- `CircularProgress`
- `AttributeBar`
- `TabNavigation`
- `FilterBar`
- `MetricTile`
- `AlertBox`
- `DecisionPanel`
- `ComparisonPanel`

## Game-specific

- `PlayerSummaryCard`
- `FormDots`
- `ConfidenceMeter`
- `FundsCard`
- `NextEventCard`
- `AttributeGroupPanel`
- `TrainingWeekGrid`
- `CoachTable`
- `EquipmentCard`
- `CueComparisonPanel`
- `TournamentCalendarGrid`
- `MatchScoreboard`
- `FrameHistoryTable`
- `RankingTable`
- `SponsorDealCard`
- `InboxMessageList`

---

# 10. Build Order

## Phase 1 — App Shell and Dashboard

Build:

- App shell
- Sidebar
- Top status bar
- Shared components
- Placeholder routes
- Career Dashboard with mock data

Do not build logic yet.

## Phase 2 — Core Player Screens

Build:

- New Career / Create Player
- Player Attributes
- Career Stage Progression
- Legacy / Career Stats

## Phase 3 — Training and Staff

Build:

- Weekly Training Planner
- Training Report
- Coach Market
- Coach Profile Detail

## Phase 4 — Finance and Equipment

Build:

- Finance Dashboard
- Cue Shop
- Chalk & Tip Shop
- Equipment Maintenance

## Phase 5 — Tournament and Match Flow

Build:

- Tournament Calendar
- Travel Planner
- Tournament Hub
- Tournament Draw
- Match Preview
- Live Match Simulation
- Match Result Summary
- Rankings

## Phase 6 — Career Support Systems

Build:

- Inbox & News Centre
- Sponsorship Offers
- Sponsorship Contract Detail
- Mental State / Slump Recovery
- Injury / Health Centre
- End of Season Review

## Phase 7 — Basic Game Logic

Only after the screens exist, add:

- New career save creation
- LocalStorage save/load
- Weekly advance
- Training effects
- Coach costs
- Equipment buying
- Equipment bonuses
- Tournament entry costs
- Basic match simulation
- Ranking movement
- Sponsorship income
- Fatigue/confidence changes

---

# 11. MVP Logic Rules

## Weekly advance

When the user clicks Continue:

- Apply scheduled training
- Increase/decrease attributes
- Apply coach bonuses
- Apply fatigue changes
- Deduct weekly costs
- Apply sponsor income
- Update inbox/news
- Move calendar forward

## Training effects

Technical training improves technical attributes but increases fatigue.

Mental training improves confidence/composure/focus and can reduce slump risk.

Physical training improves stamina/recovery but can increase short-term fatigue.

Recovery/rest reduces fatigue and injury risk.

## Coach effects

Coaches provide multipliers to training gains.

Higher compatibility gives better results.

High weekly cost affects finances.

## Equipment effects

Equipment should provide small but meaningful bonuses.

Better cue/chalk/tip should affect:

- Cue Ball Control
- Touch
- Spin Control
- Consistency
- Miscue Reduction
- Kick Reduction
- Break Building

New cues require familiarity before full benefit.

## Tournament entry

Entering an event should:

- Deduct entry fee
- Deduct estimated travel/hotel cost
- Add fatigue/travel load
- Add event to schedule
- Create match preview when event begins

## Match simulation

Use simplified attributes first.

Match outcome should consider:

- Technical average
- Mental average
- Physical/fatigue state
- Confidence
- Opponent strength
- Equipment bonuses
- Tactical settings
- Random variance

Result should update:

- Cash
- Ranking points
- Confidence
- Fatigue
- Recent results
- Career stats
- Inbox/news

---

# 12. First VS Code Prompt

Paste this into VS Code / Copilot first:

```txt
Read docs/SNOOKER_CAREER_MANAGER_MASTER_BUILD_BRIEF.md first.

Build Phase 1 only.

Use the screenshots in /design/screenshots as the visual source of truth, especially:
- Career Dashboard Screen.png
- Player Attributes Screen.png
- Weekly Training Planner Screen.png
- Finance Dashboard Screen.png
- Equipment Cue Shop Screen.png

Create the full-width desktop app shell for Snooker Career Manager.

Requirements:
- Dark navy/slate Football Manager-style UI
- Left sidebar navigation
- Top status bar
- Main content area
- Reusable dashboard components
- Placeholder routes for all screens listed in the master brief
- Career Dashboard implemented as the first real screen
- Use mock data only
- Do not build backend logic
- Do not build database integration
- Do not build match simulation yet
- Do not build academy/stable management

Create reusable components:
- AppShell
- Sidebar
- TopStatusBar
- PageHeader
- SectionCard
- StatCard
- DataTable
- StatusBadge
- ActionButton
- ProgressBar
- CircularProgress
- AttributeBar
- TabNavigation
- DetailPanel
- DecisionPanel

Create mock data in src/data/mockGameData.ts.

The Career Dashboard should visually match design/screenshots/Career Dashboard Screen.png as closely as possible while using clean reusable code.

Stop after Phase 1 is working.
```

---

# 13. Second VS Code Prompt

Use this only after Phase 1 works:

```txt
Now build Phase 2 from the master brief.

Implement these screens using the screenshot references:
- New Career / Create Player
- Player Attributes
- Career Stage Progression
- Legacy / Career Stats

Use mock data only.

Keep the same AppShell, Sidebar, TopStatusBar and shared components.

Do not add backend logic yet.
Do not add match simulation yet.

Focus on matching the screenshots and keeping components reusable.
```

---

# 14. Third VS Code Prompt

Use this after Phase 2 works:

```txt
Now build Phase 3 from the master brief.

Implement:
- Weekly Training Planner
- Training Report / Coach Feedback
- Coach Market
- Coach Profile Detail

Use mock data only.

The Weekly Training Planner should match the screenshot with a weekly grid, training blocks, drill library, training load, fatigue risk and expected attribute gains.

The Coach Market and Coach Profile screens should support tables, filters, coach comparison, contract options and hiring actions as UI only.

No backend yet.
```

---

# 15. Fourth VS Code Prompt

Use this after Phase 3 works:

```txt
Now build Phase 4 from the master brief.

Implement:
- Finance Dashboard
- Equipment / Cue Shop
- Chalk & Tip Shop
- Equipment Maintenance

Use mock data only.

The finance screen should show cash balance, income, expenses, budget sliders, tournament cost planner and forecasts.

The equipment screens should support cue cards, selected cue comparison, current equipment summary, chalk/tip tables and maintenance actions as UI only.

No real purchasing logic yet unless it is simple local mock state.
```

---

# 16. Fifth VS Code Prompt

Use this after Phase 4 works:

```txt
Now build Phase 5 from the master brief.

Implement:
- Tournament Calendar
- Travel Planner
- Tournament Hub
- Tournament Draw / Bracket
- Match Preview
- Live Match Simulation
- Match Result Summary
- Rankings

Use mock data only.

Match screens should be data-driven UI, not real simulation yet.

The Live Match Simulation screen should show scoreboard, current frame, momentum, pressure, event feed, frame history and locked tactics during frame.

The Rankings screen should highlight the created player row and show ranking breakdown.
```

---

# 17. Sixth VS Code Prompt

Use this after Phase 5 works:

```txt
Now build Phase 6 from the master brief.

Implement:
- Inbox & News Centre
- Sponsorship Offers
- Sponsorship Contract Detail
- Mental State / Slump Recovery
- Injury / Health Centre
- End of Season Review

Use mock data only.

These screens should make the game feel alive with decisions, alerts, warnings, sponsorship choices, health risks and season outcomes.
```

---

# 18. Seventh VS Code Prompt — Basic Game Logic

Use this only after the UI screens are built:

```txt
Now add basic MVP game logic using local state and localStorage.

Implement:
- Save/load career from localStorage
- Create new career from New Career screen
- Weekly Continue button
- Training effects on attributes
- Fatigue/confidence changes
- Coach weekly costs
- Sponsor monthly income
- Equipment purchases using funds
- Equipment bonuses applied to effective attributes
- Tournament entry costs
- Basic match simulation
- Match result updates
- Ranking point movement
- Recent results tracking
- Inbox message generation

Keep the logic simple and readable.

Do not add backend, database or authentication yet.
```

---

# 19. Development Guardrails

Always follow these rules:

- Build one phase at a time.
- Keep the game single-player created career only.
- Use mock data first.
- Keep components reusable.
- Keep screen layout consistent.
- Keep the dark full-width dashboard style.
- Do not introduce unnecessary frameworks.
- Do not add backend before the frontend MVP is stable.
- Do not overcomplicate simulation logic early.
- Every screen should show current player context.
- Every decision should affect at least one of:
  - Attributes
  - Money
  - Confidence
  - Fatigue
  - Ranking
  - Reputation
  - Career progression

---

# 20. Recommended initial folder structure

```txt
src/
  app/
    routes/
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      TopStatusBar.tsx
      PageHeader.tsx
    ui/
      SectionCard.tsx
      StatCard.tsx
      DataTable.tsx
      StatusBadge.tsx
      ActionButton.tsx
      ProgressBar.tsx
      CircularProgress.tsx
      AttributeBar.tsx
      TabNavigation.tsx
      DetailPanel.tsx
      DecisionPanel.tsx
    game/
      PlayerSummaryCard.tsx
      FormDots.tsx
      ConfidenceMeter.tsx
      FundsCard.tsx
      NextEventCard.tsx
      TrainingWeekGrid.tsx
      CoachTable.tsx
      EquipmentCard.tsx
      CueComparisonPanel.tsx
      TournamentCalendarGrid.tsx
      MatchScoreboard.tsx
      RankingTable.tsx
      SponsorDealCard.tsx
      InboxMessageList.tsx
  data/
    mockGameData.ts
  types/
    game.ts
  utils/
    formatters.ts
    calculations.ts
  styles/
    globals.css
docs/
  SNOOKER_CAREER_MANAGER_MASTER_BUILD_BRIEF.md
design/
  screenshots/
```

---



---

# 22. Additional Screenshot Coverage Added

The remaining screenshot set adds more complete detail for the later game loops. Treat these as part of the visual source of truth.

## Additional screenshot reference map

| Route | Screen | Screenshot |
|---|---|---|
| `/season-review` | End of Season Review | `End of Season Review.png` |
| `/equipment/maintenance` | Equipment Maintenance | `Equipment Maintenance Screen.png` |
| `/travel` | Travel Planner | `Travel Planner.png` |
| `/tournaments/draw` | Tournament Draw / Bracket | `Tournament Draw Bracket.png` |
| `/tournaments/hub` | Tournament Hub | `Tournament Hub.png` |
| `/training/report` | Weekly Training Report / Coach Feedback | `Training Report Coach Feedback.png` |
| `/health` | Injury / Health Centre | `Injury Health Centre.png` |
| `/mental` | Mental State / Slump Recovery | `Mental State Slump Recovery.png` |
| `/sponsorship/contract` | Sponsorship Contract Detail | `Sponsorship Contract Detail.png` |

---

# 23. Deciphered UI Patterns from Screenshots

Use these patterns consistently across the build.

## 23.1 Common screen structure

Most screenshots follow this structure:

```txt
Top Status Bar
Left Navigation
Page Header
Primary Content Grid
Right Decision / Detail Panel
Bottom Action Row
```

## 23.2 Top status bar pattern

The status bar is not just decoration. It is the player's constant career context.

It should usually include:

- Player portrait or silhouette
- Player name
- Nationality flag
- Career status
- World ranking / amateur ranking
- Recent form dots
- Confidence ring or percentage
- Funds
- Cash flow
- Next tournament
- Days until next event
- Inbox count
- Notification count
- Settings icon

## 23.3 Left sidebar pattern

The sidebar should stay visible on desktop.

Main navigation should support section highlighting and nested menus.

Example nested menus:

```txt
Staff
  Overview
  Hire Coaches
  Coach Assignments
  Staff Contracts

Equipment
  Cue Shop
  My Equipment
  Table Setup
  Maintenance

Tournaments
  Calendar
  Schedule
  History

Player
  Overview
  Attributes
  Statistics
  Records
  Awards
```

## 23.4 Decision panels

Several screens have clear decision panels.

Examples:

- Inbox selected message: Accept invite / Decline invite / View tournament
- Tournament Calendar: Enter event / Skip event / View draw / Travel plan
- Travel Planner: Confirm travel
- Coach Profile: Hire / Negotiate / Shortlist
- Cue Shop: Buy / Test / Compare
- Sponsorship Contract: Accept / Negotiate / Reject
- Mental State: Apply recovery plan / Book psychologist / Adjust schedule
- Health Centre: Schedule treatment / Return to training plan

Decision panels should show consequences before the user confirms.

Consequences should usually include:

- Cash impact
- Confidence impact
- Fatigue impact
- Ranking impact
- Attribute impact
- Risk level
- Time required

## 23.5 Tables

Tables are a major part of the game.

All tables should support:

- Compact row height
- Clear headings
- Highlighted selected row
- Status badges
- Sorting-ready structure
- Optional filters
- Hover states
- Icons where useful
- Right-aligned numeric columns

## 23.6 Cards and metrics

Metric cards are used everywhere.

Common cards:

- Ranking
- Funds
- Confidence
- Fatigue
- Form
- Prize money
- Ranking points
- Training load
- Injury risk
- Legacy score
- Sponsor sentiment
- Fan sentiment

Cards should be reusable and data-driven.

---

# 24. Technical Stack Recommendation

Build the MVP as a browser-based frontend first.

## Recommended stack

Use this unless there is already a project stack selected:

```txt
React + TypeScript + Vite
Tailwind CSS
React Router
Lucide React icons
Recharts for charts
localStorage for MVP saves
```

## Why this stack

- Fast to build in VS Code
- Easy to keep component-based
- Good for a desktop dashboard UI
- No backend needed initially
- Easy to add game state later
- Easy to deploy as a static app

## Do not use initially

Avoid these in the MVP:

- Backend API
- Database
- Authentication
- Multiplayer services
- Server-side rendering
- Real snooker data integrations
- Complex physics engines

---

# 25. Recommended Project Setup

## Create project

```bash
npm create vite@latest snooker-career-manager -- --template react-ts
cd snooker-career-manager
npm install
npm install react-router-dom lucide-react recharts clsx
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Tailwind config

`tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scm: {
          bg: "#07111f",
          deep: "#050b14",
          panel: "#0d1b2a",
          panelSoft: "#102033",
          panelHover: "#132b43",
          border: "#203449",
          borderStrong: "#31506f",
          green: "#22c55e",
          greenDark: "#14532d",
          gold: "#f2b705",
          amber: "#f59e0b",
          red: "#ef4444",
          blue: "#38bdf8",
          purple: "#a855f7",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 12px 30px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
};
```

## Global CSS

`src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body,
#root {
  height: 100%;
  min-height: 100%;
  background: #07111f;
  color: #f8fafc;
}

body {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

button,
input,
select {
  font: inherit;
}
```

---

# 26. Recommended Folder Structure — Technical

Use this exact structure for the frontend MVP.

```txt
src/
  main.tsx
  App.tsx

  data/
    mockGameData.ts

  types/
    game.ts

  routes/
    DashboardPage.tsx
    NewCareerPage.tsx
    CareerProgressionPage.tsx
    PlayerAttributesPage.tsx
    TrainingPlannerPage.tsx
    TrainingReportPage.tsx
    CoachMarketPage.tsx
    CoachProfilePage.tsx
    FinancePage.tsx
    CueShopPage.tsx
    ChalkTipPage.tsx
    EquipmentMaintenancePage.tsx
    TournamentCalendarPage.tsx
    TournamentHubPage.tsx
    TournamentDrawPage.tsx
    TravelPlannerPage.tsx
    MatchPreviewPage.tsx
    LiveMatchPage.tsx
    MatchResultPage.tsx
    RankingsPage.tsx
    SponsorshipOffersPage.tsx
    SponsorshipContractPage.tsx
    InboxPage.tsx
    MentalStatePage.tsx
    HealthCentrePage.tsx
    LegacyStatsPage.tsx
    EndSeasonReviewPage.tsx

  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      TopStatusBar.tsx
      PageHeader.tsx

    ui/
      ActionButton.tsx
      AlertBox.tsx
      AttributeBar.tsx
      Badge.tsx
      Card.tsx
      CircularMeter.tsx
      DataTable.tsx
      EmptyState.tsx
      FormDots.tsx
      MetricCard.tsx
      ProgressBar.tsx
      SectionCard.tsx
      Tabs.tsx

    game/
      PlayerIdentityCard.tsx
      NextEventCard.tsx
      FundsSummary.tsx
      TrainingWeekGrid.tsx
      CoachTable.tsx
      CoachDetailPanel.tsx
      EquipmentCard.tsx
      CueComparison.tsx
      CalendarGrid.tsx
      TournamentBracket.tsx
      MatchScoreboard.tsx
      FrameHistory.tsx
      RankingTable.tsx
      SponsorDealCard.tsx
      InboxList.tsx

  hooks/
    useGameState.ts

  utils/
    calculations.ts
    formatters.ts
    routing.ts

  styles/
    globals.css
```

---

# 27. Routing Specification

Use React Router.

## Route list

```tsx
const routes = [
  { path: "/", element: <DashboardPage /> },
  { path: "/new-career", element: <NewCareerPage /> },
  { path: "/career/progression", element: <CareerProgressionPage /> },
  { path: "/career/stats", element: <LegacyStatsPage /> },
  { path: "/season-review", element: <EndSeasonReviewPage /> },

  { path: "/player/attributes", element: <PlayerAttributesPage /> },

  { path: "/training", element: <TrainingPlannerPage /> },
  { path: "/training/report", element: <TrainingReportPage /> },

  { path: "/staff/coaches", element: <CoachMarketPage /> },
  { path: "/staff/coaches/:id", element: <CoachProfilePage /> },

  { path: "/finance", element: <FinancePage /> },

  { path: "/equipment/cues", element: <CueShopPage /> },
  { path: "/equipment/chalk-tips", element: <ChalkTipPage /> },
  { path: "/equipment/maintenance", element: <EquipmentMaintenancePage /> },

  { path: "/calendar", element: <TournamentCalendarPage /> },
  { path: "/travel", element: <TravelPlannerPage /> },
  { path: "/tournaments/hub", element: <TournamentHubPage /> },
  { path: "/tournaments/draw", element: <TournamentDrawPage /> },

  { path: "/match/preview", element: <MatchPreviewPage /> },
  { path: "/match/live", element: <LiveMatchPage /> },
  { path: "/match/result", element: <MatchResultPage /> },

  { path: "/rankings", element: <RankingsPage /> },

  { path: "/sponsorship", element: <SponsorshipOffersPage /> },
  { path: "/sponsorship/contract", element: <SponsorshipContractPage /> },

  { path: "/inbox", element: <InboxPage /> },
  { path: "/mental", element: <MentalStatePage /> },
  { path: "/health", element: <HealthCentrePage /> },
];
```

---

# 28. Game State Architecture for MVP

Use local React state first. Then add `localStorage`.

## Simple state shape

```ts
type GameState = {
  currentDate: string;
  season: string;
  week: number;
  player: Player;
  attributes: PlayerAttributes;
  coaches: Coach[];
  currentCoachId: string | null;
  equipment: {
    currentCueId: string;
    currentChalkId: string;
    currentTipId: string;
    cuesOwned: string[];
    chalkOwned: string[];
    tipsOwned: string[];
  };
  finance: FinanceState;
  tournaments: Tournament[];
  matches: Match[];
  inbox: InboxMessage[];
  sponsors: SponsorDeal[];
  careerStats: CareerStats;
};
```

## MVP hook

Create:

```txt
src/hooks/useGameState.ts
```

It should expose:

```ts
const {
  gameState,
  continueWeek,
  hireCoach,
  buyCue,
  applyTrainingPlan,
  enterTournament,
  simulateMatch,
  acceptSponsor,
  updateEquipmentSetup,
  scheduleTreatment,
  applyRecoveryPlan,
} = useGameState();
```

In Phase 1 to Phase 6, these can be placeholder functions.

In Phase 7, they should update local state.

---

# 29. Mock Data Requirements

Create `src/data/mockGameData.ts`.

It should include:

- `mockPlayer`
- `mockAttributes`
- `mockCoaches`
- `mockCurrentCoach`
- `mockCues`
- `mockChalks`
- `mockTips`
- `mockEquipment`
- `mockTournaments`
- `mockMatches`
- `mockRankings`
- `mockSponsors`
- `mockInboxMessages`
- `mockTrainingWeek`
- `mockCareerStages`
- `mockSeasonReview`
- `mockHealthStatus`
- `mockMentalState`

Use fictional names only.

---

# 30. Formatting Utilities

Create `src/utils/formatters.ts`.

Include:

```ts
export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

export function getRatingColour(value: number): "green" | "amber" | "red" {
  if (value >= 75) return "green";
  if (value >= 55) return "amber";
  return "red";
}
```

---

# 31. Calculation Utilities

Create `src/utils/calculations.ts`.

Include simple MVP functions:

```ts
export function calculateAverage(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function calculateTechnicalAverage(attributes: Record<string, number>): number {
  return calculateAverage(Object.values(attributes));
}

export function calculateEffectiveAttribute(
  base: number,
  equipmentBonus = 0,
  coachBonus = 0,
  fatiguePenalty = 0
): number {
  return Math.max(1, Math.min(100, base + equipmentBonus + coachBonus - fatiguePenalty));
}

export function calculateMatchStrength(params: {
  technical: number;
  mental: number;
  physical: number;
  confidence: number;
  fatigue: number;
  equipmentBonus: number;
}): number {
  const fatiguePenalty = params.fatigue * 0.25;
  return Math.round(
    params.technical * 0.4 +
    params.mental * 0.3 +
    params.physical * 0.15 +
    params.confidence * 0.1 +
    params.equipmentBonus -
    fatiguePenalty
  );
}
```

---

# 32. UI Component Implementation Rules

## SectionCard

Use for most panels.

Props:

```ts
type SectionCardProps = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};
```

Style:

- Dark panel background
- Thin border
- Rounded corners
- Compact padding
- Optional title row

## MetricCard

Props:

```ts
type MetricCardProps = {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  tone?: "green" | "gold" | "amber" | "red" | "blue";
};
```

## AttributeBar

Props:

```ts
type AttributeBarProps = {
  label: string;
  value: number;
  trend?: number;
  max?: number;
};
```

## DataTable

Keep generic.

Props:

```ts
type DataTableColumn<T> = {
  key: keyof T | string;
  header: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  selectedId?: string;
  onRowClick?: (row: T) => void;
};
```

---

# 33. Technical Build Guardrails

## Avoid

- Building all logic before UI
- Large monolithic components
- Hardcoding every screen separately
- Creating a backend too early
- Adding authentication
- Adding database
- Using real brands or real players
- Letting visual styles drift between pages

## Prefer

- Small reusable components
- Mock data
- Types first
- Layout consistency
- Single source of truth for mock state
- Simple local state
- Clear route structure
- Shared formatting helpers

---

# 34. Updated First VS Code Prompt — With Technical Details

Use this as the first prompt now.

```txt
Read docs/SNOOKER_CAREER_MANAGER_MASTER_BUILD_BRIEF.md first.

Build Phase 1 only.

Use React + TypeScript. If the project is not created yet, create a Vite React TypeScript app.

Use:
- Tailwind CSS
- React Router
- lucide-react icons
- recharts for charts
- local mock data only

Do not build backend logic.
Do not build a database.
Do not build authentication.
Do not build real match simulation yet.
Do not build academy or multi-player stable management.

Create the technical structure from the master brief:
- src/components/layout
- src/components/ui
- src/components/game
- src/routes
- src/data
- src/types
- src/utils
- src/hooks

Create:
- AppShell
- Sidebar
- TopStatusBar
- PageHeader
- SectionCard
- MetricCard
- DataTable
- StatusBadge
- ActionButton
- ProgressBar
- CircularMeter
- AttributeBar
- Tabs

Create React Router routes for all screens in the master brief, but most can be placeholders in Phase 1.

Implement the Career Dashboard as the first real screen using mock data from src/data/mockGameData.ts.

Use the screenshots in /design/screenshots as visual source of truth, especially:
- Career Dashboard Screen.png
- Player Attributes Screen.png
- Weekly Training Planner Screen.png
- Finance Dashboard Screen.png
- Equipment Cue Shop Screen.png

The UI must be:
- Full-width desktop
- Dark navy/slate
- Emerald and gold accents
- Left sidebar
- Top status bar
- Dense Football Manager-style dashboard
- Reusable components
- Compact data-rich cards and tables

Stop after Phase 1 is working.
```

---

# 35. Updated Phase 2 Prompt — Core Player Screens

```txt
Now build Phase 2 from docs/SNOOKER_CAREER_MANAGER_MASTER_BUILD_BRIEF.md.

Implement these screens with mock data:
- New Career / Create Player
- Player Attributes
- Career Stage Progression
- Legacy / Career Stats

Use these screenshot references:
- New Career Create Player Screen.png
- Player Attributes Screen.png
- Career Stage Progression Screen.png
- Legacy Career Stats Screen.png

Keep the shared AppShell, Sidebar and TopStatusBar.

Use existing reusable components where possible:
- SectionCard
- MetricCard
- AttributeBar
- ProgressBar
- CircularMeter
- DataTable
- Tabs
- StatusBadge

No backend.
No database.
No real game logic yet.
```

---

# 36. Updated Phase 3 Prompt — Training and Staff

```txt
Now build Phase 3.

Implement these screens with mock data:
- Weekly Training Planner
- Weekly Training Report / Coach Feedback
- Coach Market
- Coach Profile Detail

Use screenshot references:
- Weekly Training Planner Screen.png
- Training Report Coach Feedback.png
- Coach Market Screen.png
- Coach Profile Detail Screen.png

Requirements:
- Weekly planner grid with morning/afternoon/evening sessions
- Drill library
- Training load
- Fatigue risk
- Expected gains
- Coach impact
- Coach market table
- Coach detail panel
- Contract options
- Hiring buttons as UI only

No backend.
No persistent hiring logic yet.
```

---

# 37. Updated Phase 4 Prompt — Finance and Equipment

```txt
Now build Phase 4.

Implement these screens with mock data:
- Finance Dashboard
- Equipment / Cue Shop
- Chalk & Tip Shop
- Equipment Maintenance

Use screenshot references:
- Finance Dashboard Screen.png
- Equipment Cue Shop Screen.png
- Chalk and Tip Shop Screen.png
- Equipment Maintenance Screen.png

Requirements:
- Finance cards, income/expense panels, forecast panels, budget sliders
- Cue product cards
- Selected cue comparison panel
- Current equipment summary
- Chalk table
- Tip table
- Maintenance actions
- Equipment reliability and warning panels

Actions can be UI-only for now.
No backend.
```

---

# 38. Updated Phase 5 Prompt — Tournaments, Travel, Match and Rankings

```txt
Now build Phase 5.

Implement these screens with mock data:
- Tournament Calendar
- Travel Planner
- Tournament Hub
- Tournament Draw / Bracket
- Match Preview
- Live Match Simulation
- Match Result Summary
- Rankings

Use screenshot references:
- Tournament Calendar Screen.png
- Travel Planner.png
- Tournament Hub.png
- Tournament Draw Bracket.png
- Match Preview Screen.png
- Live Match Simulation Screen.png
- Match Result Summary Screen.png
- Rankings Screen.png

Requirements:
- Calendar with events by type
- Event details and decision impact panel
- Travel and hotel option selection UI
- Tournament hub with draw, opponent, event objectives and player condition
- Bracket view with highlighted player path
- Match preview with tactics sliders and scouting report
- Live match screen with scoreboard, current frame, pressure meter, event feed and frame history
- Match result summary with rewards, stats, coach feedback and equipment impact
- Rankings table with highlighted player row and ranking breakdown

No real simulation yet.
Use static mock data.
```

---

# 39. Updated Phase 6 Prompt — Career Support Screens

```txt
Now build Phase 6.

Implement these screens with mock data:
- Inbox & News Centre
- Sponsorship Offers
- Sponsorship Contract Detail
- Mental State / Slump Recovery
- Injury / Health Centre
- End of Season Review

Use screenshot references:
- Inbox News Centre.png
- Sponsorship Offers Screen.png
- Sponsorship Contract Detail.png
- Mental State Slump Recovery.png
- Injury Health Centre.png
- End of Season Review.png

Requirements:
- Inbox message list and selected message decision panel
- Sponsor offer cards and sponsor slot summary
- Contract detail with negotiation options
- Mental state metrics, diagnosis and recovery plan
- Health centre with body status, treatment options and injury risk
- End of season review with summary cards, charts, objectives and verdict

Actions can be UI-only for now.
```

---

# 40. Phase 7 Prompt — Add MVP Game Logic

```txt
Now add Phase 7 MVP game logic.

Use local React state and localStorage only.

Implement:
- Create new career from New Career screen
- Save/load game state to localStorage
- Continue week
- Apply weekly training effects
- Apply fatigue and confidence changes
- Deduct coach costs
- Add sponsorship income
- Buy cue/chalk/tip using funds
- Update equipment setup
- Equipment bonuses affect effective attributes
- Enter tournament and deduct costs
- Basic mock match simulation
- Match result updates funds, ranking points, confidence, fatigue and career stats
- Inbox message generation after key events
- End of season summary from career stats

Keep logic simple, readable and easy to change.

No backend.
No database.
No authentication.
```



# 21. Definition of MVP Success

The MVP is successful when the user can:

1. Create a player
2. See the full career dashboard
3. View attributes
4. Plan training
5. Hire a coach
6. Manage money
7. Buy equipment
8. Enter a tournament
9. Preview a match
10. Simulate a match
11. View result summary
12. Gain money/ranking/confidence changes
13. Continue through multiple weeks
14. Track career progression
15. View legacy stats

The first build does not need to be perfect. It needs to be coherent, navigable, visually consistent, and ready for game logic.

---

# 41. MVP Acceptance Criteria

The MVP is complete when:

- The app opens to a full-width dashboard.
- Sidebar navigation works across all main screens.
- Top status bar remains consistent on every screen.
- All Phase 1–6 screens exist with mock data.
- User can create a player.
- User can continue to the next week.
- Training changes attributes.
- Coach costs reduce funds.
- Equipment purchases reduce funds.
- Equipment bonuses affect effective attributes.
- Tournament entry reduces funds and adds an event.
- Match simulation creates a result.
- Match result updates confidence, fatigue, funds, ranking points and career stats.
- Game state saves to localStorage.
- Refreshing the browser keeps the save.
- No real player names, real sponsor brands or licensed assets are used.
- The app remains desktop-first and visually consistent with the screenshot pack.

---

# 42. Build Checklist

Use this checklist to keep the build controlled and avoid trying to build the entire game at once.

## Phase 1 — App Shell and Dashboard

- [ ] Create Vite React TypeScript project.
- [ ] Install Tailwind CSS.
- [ ] Install React Router.
- [ ] Install lucide-react.
- [ ] Install recharts.
- [ ] Create folder structure.
- [ ] Create `AppShell`.
- [ ] Create `Sidebar`.
- [ ] Create `TopStatusBar`.
- [ ] Create `PageHeader`.
- [ ] Create shared UI components.
- [ ] Create `mockGameData.ts`.
- [ ] Create placeholder routes for all main screens.
- [ ] Build Career Dashboard using mock data.
- [ ] Confirm visual style matches the dashboard screenshot.

## Phase 2 — Core Player Screens

- [ ] Build New Career / Create Player screen.
- [ ] Build Player Attributes screen.
- [ ] Build Career Stage Progression screen.
- [ ] Build Legacy / Career Stats screen.

## Phase 3 — Training and Staff

- [ ] Build Weekly Training Planner.
- [ ] Build Weekly Training Report / Coach Feedback.
- [ ] Build Coach Market.
- [ ] Build Coach Profile Detail.

## Phase 4 — Finance and Equipment

- [ ] Build Finance Dashboard.
- [ ] Build Equipment / Cue Shop.
- [ ] Build Chalk & Tip Setup.
- [ ] Build Equipment Maintenance.

## Phase 5 — Tournament, Travel, Match and Rankings

- [ ] Build Tournament Calendar.
- [ ] Build Travel Planner.
- [ ] Build Tournament Hub.
- [ ] Build Tournament Draw / Bracket.
- [ ] Build Match Preview.
- [ ] Build Live Match Simulation.
- [ ] Build Match Result Summary.
- [ ] Build Rankings.

## Phase 6 — Career Support Screens

- [ ] Build Inbox & News Centre.
- [ ] Build Sponsorship Offers.
- [ ] Build Sponsorship Contract Detail.
- [ ] Build Mental State / Slump Recovery.
- [ ] Build Injury / Health Centre.
- [ ] Build End of Season Review.

## Phase 7 — MVP Game Logic

- [ ] Add localStorage save/load.
- [ ] Add new career creation.
- [ ] Add weekly advance.
- [ ] Add simple training effects.
- [ ] Add coach hiring.
- [ ] Add coach weekly cost deduction.
- [ ] Add equipment buying.
- [ ] Add equipment setup changes.
- [ ] Add tournament entry.
- [ ] Add travel planning.
- [ ] Add basic match simulation.
- [ ] Add ranking movement.
- [ ] Add sponsor acceptance.
- [ ] Add inbox message generation.
- [ ] Add end-of-season summary generation.

---

# 43. MVP Game Logic Formulas

These formulas are intentionally simple. They are for the first playable version only and can be refined later.

## 43.1 Effective Attribute

```txt
effectiveAttribute =
baseAttribute
+ equipmentBonus
+ coachBonus
- fatiguePenalty
+ confidenceModifier
```

Clamp result between `1` and `100`.

## 43.2 Fatigue Penalty

| Fatigue | Penalty |
|---:|---:|
| 0–30 | 0 |
| 31–50 | -2 |
| 51–70 | -5 |
| 71–85 | -8 |
| 86+ | -12 |

## 43.3 Confidence Modifier

| Confidence | Modifier |
|---:|---:|
| 85+ | +5 |
| 70–84 | +2 |
| 50–69 | 0 |
| 35–49 | -3 |
| Below 35 | -7 |

## 43.4 Training Gain

```txt
trainingGain =
baseGain
* coachMultiplier
* professionalismMultiplier
* fatigueMultiplier
```

## 43.5 Coach Multiplier

| Coach compatibility | Multiplier |
|---:|---:|
| 90+ | 1.25 |
| 75–89 | 1.15 |
| 60–74 | 1.05 |
| 40–59 | 0.95 |
| Below 40 | 0.85 |

## 43.6 Professionalism Multiplier

| Professionalism | Multiplier |
|---:|---:|
| 85+ | 1.20 |
| 70–84 | 1.10 |
| 50–69 | 1.00 |
| 35–49 | 0.90 |
| Below 35 | 0.80 |

## 43.7 Fatigue Multiplier

| Fatigue level | Multiplier |
|---|---:|
| Low | 1.20 |
| Normal | 1.00 |
| High | 0.70 |
| Extreme | 0.40 |

## 43.8 Match Strength

```txt
matchStrength =
technicalAverage * 0.40
+ mentalAverage * 0.30
+ physicalAverage * 0.10
+ confidence * 0.10
+ equipmentBonus
- fatiguePenalty
+ tacticalFitBonus
+ randomVariance
```

For MVP, `randomVariance` should be between `-8` and `+8`.

## 43.9 Frame Win Chance

```txt
frameWinChance =
50 + ((playerMatchStrength - opponentMatchStrength) * 1.2)
```

Clamp between `20` and `80`.

This prevents one player from becoming unbeatable too early.

## 43.10 Prize Money Update

```txt
funds =
funds
+ prizeMoneyEarned
+ sponsorIncome
- coachCosts
- travelCosts
- entryFees
- equipmentCosts
- treatmentCosts
```

## 43.11 Ranking Movement

For MVP only:

| Result | Ranking movement |
|---|---:|
| Tournament win | +5 to +15 places |
| Runner-up | +3 to +8 places |
| Semi-final | +1 to +5 places |
| Quarter-final | 0 to +3 places |
| Early exit | -1 to -5 places |

Lower ranking number is better.

## 43.12 Confidence Changes

| Event | Confidence impact |
|---|---:|
| Win match | +2 |
| Beat higher-ranked opponent | +4 |
| Lose close decider | -3 |
| Heavy defeat | -6 |
| Win tournament | +8 |
| Lose final | -2 to +2 depending on expectation |
| Complete good training week | +1 to +3 |
| High fatigue week | -1 to -4 |

## 43.13 Fatigue Changes

| Action | Fatigue impact |
|---|---:|
| Light training day | +1 |
| Normal training day | +2 |
| Heavy training day | +4 |
| Match day | +5 |
| Travel day | +3 to +8 depending on option |
| Recovery session | -3 |
| Full rest day | -6 |
| Physio treatment | -4 |

---

# 44. Save Game Schema

Use localStorage for the MVP.

## localStorage key

```txt
snooker-career-manager-save-v1
```

## Save wrapper

Always version the save file.

```json
{
  "version": 1,
  "savedAt": "2026-05-11T00:00:00.000Z",
  "gameState": {}
}
```

## Saved state should include

- `currentDate`
- `season`
- `week`
- `player`
- `attributes`
- `coaches`
- `currentCoachId`
- `equipment`
- `finance`
- `tournaments`
- `matches`
- `rankings`
- `sponsors`
- `inbox`
- `trainingPlan`
- `careerStats`
- `mentalState`
- `healthState`
- `settings`

## Save behaviour

- Save after every confirmed decision.
- Save after pressing Continue.
- Save after match simulation.
- Save after equipment purchase.
- Save after coach hire.
- Save after tournament entry.
- Save after sponsor acceptance.
- Save after treatment scheduling.

## Load behaviour

- On app start, check for local save.
- If save exists, load it.
- If no save exists, load mock career state.
- If save version is unsupported, show safe fallback message and load mock state.

---

# 45. Navigation Flow

## 45.1 Main weekly flow

```txt
Dashboard
→ Training Planner
→ Continue Week
→ Inbox / Calendar / Match Preview
→ Live Match
→ Match Result
→ Tournament Hub
→ Dashboard
```

## 45.2 Tournament flow

```txt
Calendar
→ Event Details
→ Travel Planner
→ Tournament Hub
→ Tournament Draw
→ Match Preview
→ Live Match
→ Match Result
```

## 45.3 Equipment flow

```txt
Equipment Overview
→ Cue Shop
→ Chalk & Tip Setup
→ Equipment Maintenance
→ Match Preview
```

## 45.4 Staff flow

```txt
Coach Market
→ Coach Profile
→ Hire Coach
→ Training Planner
```

## 45.5 Sponsorship flow

```txt
Sponsorship Offers
→ Sponsorship Contract Detail
→ Accept / Negotiate / Reject
→ Finance Dashboard
```

## 45.6 Health and mental flow

```txt
Dashboard / Inbox Warning
→ Mental State or Health Centre
→ Apply Recovery Plan / Schedule Treatment
→ Training Planner
```

## 45.7 End-of-season flow

```txt
Final event completed
→ End of Season Review
→ Set Next Season Plan
→ Continue to Offseason
→ Dashboard
```

---

# 46. Component Usage Map

## AppShell

Used on every game screen.

## Sidebar

Used on every game screen.

Must support:

- Active route highlighting
- Nested navigation
- Notification badges
- Collapsed icon-only mode later

## TopStatusBar

Used on every game screen.

Must consume current game state and display consistent player context.

## MetricCard

Used on:

- Dashboard
- Finance
- Match Result
- Legacy
- Training Report
- End of Season Review
- Mental State
- Health Centre

## DataTable

Used on:

- Rankings
- Finance
- Coach Market
- Tournament Calendar
- Match Result
- Inbox
- Chalk & Tip Shop
- Maintenance History

## AttributeBar

Used on:

- Player Attributes
- Coach Profile
- Equipment Comparison
- Match Preview
- Training Report
- Mental State

## CircularMeter

Used on:

- Confidence
- Legacy Score
- Health Risk
- Mental State
- Training Load
- Sponsor Sentiment
- Fan Sentiment

## DecisionPanel

Used on:

- Inbox
- Tournament Calendar
- Travel Planner
- Coach Profile
- Sponsorship Contract
- Health Centre
- Mental State
- Equipment Maintenance

## ProgressBar

Used on:

- Training
- Attributes
- Career Progression
- Finance
- Equipment
- Health
- Mental State
- Sponsorship

## StatusBadge

Used everywhere for:

- Form
- Risk
- Urgency
- Decision status
- Contract status
- Sponsor fit
- Injury severity
- Career stage

## Tabs

Used on:

- Player screens
- Training screens
- Staff screens
- Equipment screens
- Tournament screens
- Rankings
- Legacy stats

---

# 47. Responsive Rules

The MVP is desktop-first.

## Target resolution

- Primary: `1920x1080`
- Minimum supported: `1366x768`

## Behaviour at smaller desktop widths

- Sidebar may collapse to icons.
- Right panels may stack below the main content.
- Tables may scroll horizontally.
- Cards may wrap into fewer columns.
- Top status bar may hide secondary metadata first.
- Do not build mobile-specific screens for MVP.

## Overflow rules

- No page should require horizontal browser scrolling at 1920x1080.
- Large tables may use internal horizontal scrolling.
- Main app shell should remain fixed-height where useful.
- Content-heavy screens may scroll vertically.

---

# 48. UI Consistency Rules

- Every screen must use the same top status bar.
- Every screen must use the same sidebar.
- All panels should use the same border radius and border colour.
- Positive values use green.
- Warnings use amber.
- Dangerous/negative states use red.
- Premium/elite status uses gold.
- Selected rows use a dark green highlight.
- Primary action buttons are green.
- Secondary buttons are dark slate.
- Risk/destructive buttons are red.
- Avoid large empty whitespace.
- Prefer compact panels and dense information.
- Use icons consistently.
- Use the same spacing scale across all screens.
- Use one typography scale across all screens.
- Every screen should show current player context.
- Every decision should show consequences before confirmation.
- Avoid one-off styling unless absolutely necessary.

---

# 49. Mock Data Minimum Requirements

The mock data file must include enough data to fully populate every screenshot-style screen.

Minimum records:

- 1 current player
- 25 ranking players
- 10 coaches
- 8 cues
- 8 chalks
- 7 cue tips
- 12 tournaments
- 10 recent matches
- 8 inbox messages
- 8 sponsor offers
- 13 career stages
- 7 technical training drills
- 7 mental training drills
- 7 physical training drills
- 7 match preparation drills
- 6 travel options
- 4 hotel options
- 1 active injury
- 1 mental slump scenario
- 1 end-of-season review object
- 1 current tournament draw
- 1 live match state
- 1 match result object
- 1 financial forecast object
- 1 equipment maintenance state
- 1 sponsorship contract object

## Mock data quality rules

- Use fictional player names.
- Use fictional coach names.
- Use fictional sponsor names.
- Use fictional equipment brands.
- Use plausible snooker-style event names.
- Keep numbers internally consistent.
- Ensure the current player appears in rankings, tournament draw, recent results and dashboard data.
- Ensure funds, confidence and next event match across top status bar examples.

---

# 50. Manual Testing Checklist

After each phase, test:

- App loads without console errors.
- Sidebar links navigate correctly.
- Top status bar displays player data.
- Active navigation state is visible.
- Page does not overflow badly at 1920x1080.
- Page remains usable at 1366x768.
- Tables are readable.
- Buttons have hover states.
- Selected rows are visible.
- Mock data renders correctly.
- Charts render without errors.
- Empty placeholder routes do not crash.
- No screen uses real player or real sponsor names.
- No component has hardcoded one-off styling that should be reusable.
- All primary action buttons are clearly visible.
- Green/amber/red status colours are used consistently.
- The current player is highlighted where relevant.
- The app still works after browser refresh once localStorage is added.

---

# 51. Phase Completion Checks

## Phase 1 is complete when

- App shell exists.
- Sidebar exists.
- Top status bar exists.
- Career Dashboard exists.
- All routes exist as placeholders.
- Shared components are in place.
- Mock data file exists.
- App runs without errors.

## Phase 2 is complete when

- Create Player screen works visually.
- Player Attributes screen works visually.
- Career Progression screen works visually.
- Legacy Stats screen works visually.
- All use shared components.

## Phase 3 is complete when

- Training Planner screen works visually.
- Training Report screen works visually.
- Coach Market works visually.
- Coach Profile works visually.
- Coach data is mock-driven.

## Phase 4 is complete when

- Finance Dashboard works visually.
- Cue Shop works visually.
- Chalk & Tip screen works visually.
- Maintenance screen works visually.
- Equipment data is mock-driven.

## Phase 5 is complete when

- Calendar works visually.
- Travel Planner works visually.
- Tournament Hub works visually.
- Tournament Draw works visually.
- Match Preview works visually.
- Live Match works visually.
- Match Result works visually.
- Rankings works visually.

## Phase 6 is complete when

- Inbox works visually.
- Sponsorship Offers works visually.
- Sponsorship Contract works visually.
- Mental State works visually.
- Health Centre works visually.
- End of Season Review works visually.

## Phase 7 is complete when

- A new career can be created.
- Game can be saved and loaded.
- Continue week updates state.
- Training changes attributes.
- Coach costs reduce funds.
- Equipment purchases reduce funds.
- Tournament entry reduces funds.
- Match result updates career state.
- Inbox messages can be generated.
- Browser refresh keeps the save.

---

# 52. Error Handling Rules for MVP

The MVP should handle simple errors gracefully.

## Required error states

- Not enough funds to buy equipment.
- Not enough funds to enter tournament.
- Not enough funds to hire coach.
- No save file found.
- Save file version unsupported.
- No tournament selected.
- No coach selected.
- No equipment selected.
- Match cannot start because tournament is not active.
- Player is too injured or fatigued warning before match.

## Error UI

Use `AlertBox`.

Error states should:

- Explain the issue.
- Show the consequence.
- Offer a clear next action.

Example:

```txt
Not enough funds to enter this tournament.
Required: £650
Available: £420
Suggested action: choose a cheaper event, accept a sponsor deal, or reduce monthly expenses.
```

---

# 53. Accessibility and Usability Rules

- Text must remain readable on dark backgrounds.
- Do not rely on colour alone; use icons and labels.
- Buttons must have visible focus states.
- Tables must have readable row spacing.
- Important warnings should use both icon and colour.
- Avoid tiny click targets.
- Do not use low-contrast grey text for important numbers.
- Use semantic HTML where practical.
- The Continue button should be easy to find.
- Primary decision actions should be visually distinct from secondary actions.

---

# 54. Data Consistency Rules

Across all mock screens:

- Current player name should be consistent.
- Current ranking should be consistent unless the screen is showing a different save example.
- Funds should be consistent within the same game state.
- Next tournament should be consistent within the same game state.
- Confidence should be consistent within the same game state.
- Active coach should match between dashboard, training and coach screens.
- Current cue/chalk/tip should match between equipment, match preview and match result.
- Recent results should match between dashboard, player profile, rankings and legacy screens.
- Tournament draw should match tournament hub and match preview.

If screenshots contain inconsistent example values, prefer coherent mock data over copying every number exactly.

---

# 55. Suggested `package.json` Scripts

Use these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```

If linting is not configured initially, at minimum ensure:

```bash
npm run build
```

passes before each phase is considered complete.

---

# 56. Recommended Implementation Order Inside Each Screen

When building each screen:

1. Create route file.
2. Add route to router.
3. Add navigation item.
4. Build static layout.
5. Connect mock data.
6. Replace repeated UI with reusable components.
7. Add responsive behaviour.
8. Add hover/selected states.
9. Add empty/error states if relevant.
10. Run build.

---

# 57. Updated Final First Prompt for VS Code

Use this prompt if starting from nothing.

```txt
Read docs/SNOOKER_CAREER_MANAGER_MASTER_BUILD_BRIEF_V3.md first.

Build Phase 1 only.

Create a Vite React TypeScript app if one does not already exist.

Use:
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- lucide-react
- recharts
- local mock data only

Do not build backend logic.
Do not build a database.
Do not build authentication.
Do not build real match simulation yet.
Do not build academy or multi-player stable management.

Create the technical structure from the master brief:
- src/components/layout
- src/components/ui
- src/components/game
- src/routes
- src/data
- src/types
- src/utils
- src/hooks

Create the reusable components listed in the master brief.

Create mock data in src/data/mockGameData.ts.

Create React Router routes for all screens in the master brief, but most can be placeholders in Phase 1.

Implement the Career Dashboard as the first real screen using mock data.

Use the screenshots in /design/screenshots as the visual source of truth, especially:
- Career Dashboard Screen.png
- Player Attributes Screen.png
- Weekly Training Planner Screen.png
- Finance Dashboard Screen.png
- Equipment Cue Shop Screen.png

The UI must be:
- Full-width desktop
- Dark navy/slate
- Emerald and gold accents
- Left sidebar
- Top status bar
- Dense Football Manager-style dashboard
- Reusable components
- Compact data-rich cards and tables

Stop after Phase 1 is working.

Before finishing, run:
npm run build

Fix any build errors before reporting completion.
```

