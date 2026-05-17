# Data Model

## Player

Fields:

- id
- firstName
- lastName
- nationality
- age
- handedness
- playingStyle
- personalityType
- careerStage
- worldRanking
- amateurRanking
- youthRanking
- cash
- reputation
- fame
- form
- confidence
- fatigue
- morale
- legacyScore

## Technical Attributes

Scale: 1-100

- longPotting
- midRangePotting
- closePotting
- breakBuilding
- cueBallControl
- safetyPlay
- tacticalAwareness
- snookerEscapes
- restPlay
- cannonControl
- packSplitting
- breakOff
- colourClearance
- shotToNothing
- maximumBreakPotential
- consistency

## Mental Attributes

Scale: 1-100

- composure
- focus
- temperament
- patience
- fightingSpirit
- killerInstinct
- deciderMentality
- bigMatchNerve
- resilience
- adaptability
- professionalism
- ambition
- pressureHandling
- mediaHandling
- burnoutResistance

## Physical Attributes

Scale: 1-100

- stamina
- coreStability
- balance
- shoulderHealth
- backHealth
- handSteadiness
- visualSharpness
- recoveryRate
- sleepQuality
- travelAdaptability

## Coach

Fields:

- id
- name
- level
- type
- weeklyCost
- reputation
- compatibility
- technicalKnowledge
- tacticalKnowledge
- mentalSupport
- motivation
- discipline
- specialism

## Equipment

Fields:

- id
- name
- type
- tier
- cost
- condition
- familiarity
- durability
- bonuses

Equipment types:

- cue
- chalk
- tip
- case
- extension
- practiceTable
- lighting
- analysisSystem

## Cue

Fields:

- id
- name
- tier
- cost
- weight
- balance
- shaftQuality
- touch
- spinControl
- powerTransfer
- stability
- durability
- familiarity
- condition
- bonuses

## Tournament

Fields:

- id
- name
- type
- careerStage
- location
- startDate
- endDate
- entryFee
- travelCost
- hotelCost
- prizeMoney
- rankingValue
- format
- prestige
- requiredRanking

## Match

Fields:

- id
- tournamentId
- opponentName
- opponentRanking
- round
- bestOf
- playerFrames
- opponentFrames
- result
- playerHighestBreak
- opponentHighestBreak
- centuries
- longPotSuccess
- safetySuccess
- pressureRating
- confidenceChange
- prizeMoneyEarned