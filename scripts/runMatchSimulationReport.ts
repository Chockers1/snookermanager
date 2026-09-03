import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSimulationOutputDirectories } from './simulationOutput'

import type { PlayerAttributes } from '../src/types/game'
import {
  calculateAverage,
  calculateMatchStrength,
  calculateOverallRating,
  calculateTechnicalAverage,
} from '../src/utils/calculations'
import { convertMatchWinProbabilityToFrameWinProbability } from '../src/utils/matchOutcomeModel'

type ProfileTier =
  | 'Youth'
  | 'Amateur'
  | 'Q Tour'
  | 'Rookie Pro'
  | 'Top 64'
  | 'Top 32'
  | 'Top 16'
  | 'Top 4'
  | 'World Champion'
  | 'Veteran Min Support'

type ProfileStyle =
  | 'Scorer'
  | 'Tactical'
  | 'Break Builder'
  | 'Counter'
  | 'Nerve'
  | 'Stamina'

type MatchupDefinition = {
  label: string
  playerTier: ProfileTier
  opponentTier: ProfileTier
}

type Profile = {
  tier: ProfileTier
  style: ProfileStyle
  overall: number
  technical: number
  mental: number
  physical: number
  confidence: number
  fatigue: number
  equipmentBonus: number
  strength: number
  attributes: PlayerAttributes
  summary: string
}

type SimulationRow = {
  caseNumber: number
  matchup: string
  bestOf: number
  player: Profile
  opponent: Profile
  winChance: number
  frameWinChance: number
  playerFrames: number
  opponentFrames: number
  playerWon: boolean
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..')
const reportsDir = getSimulationOutputDirectories(workspaceRoot).artifacts
const reportPath = path.join(reportsDir, 'match-simulation-100.md')

const TECHNICAL_KEYS = ['Long Potting', 'Break Building', 'Cue Ball Control', 'Safety Play', 'Consistency'] as const
const MENTAL_KEYS = ['Focus', 'Composure', 'Big Match Nerve', 'Resilience', 'Professionalism'] as const
const PHYSICAL_KEYS = ['Stamina', 'Recovery Rate', 'Balance', 'Hand Steadiness', 'Shoulder Health'] as const

const PROFILE_BASELINES: Record<ProfileTier, { technical: number; mental: number; physical: number; confidence: number; fatigue: number; equipmentBonus: number }> = {
  Youth: { technical: 57, mental: 54, physical: 58, confidence: 56, fatigue: 14, equipmentBonus: 0 },
  Amateur: { technical: 63, mental: 60, physical: 61, confidence: 59, fatigue: 15, equipmentBonus: 1 },
  'Q Tour': { technical: 69, mental: 66, physical: 65, confidence: 62, fatigue: 16, equipmentBonus: 2 },
  'Rookie Pro': { technical: 74, mental: 70, physical: 68, confidence: 64, fatigue: 18, equipmentBonus: 3 },
  'Top 64': { technical: 79, mental: 75, physical: 71, confidence: 67, fatigue: 18, equipmentBonus: 4 },
  'Top 32': { technical: 83, mental: 79, physical: 73, confidence: 70, fatigue: 17, equipmentBonus: 5 },
  'Top 16': { technical: 88, mental: 84, physical: 76, confidence: 73, fatigue: 16, equipmentBonus: 6 },
  'Top 4': { technical: 91, mental: 87, physical: 79, confidence: 76, fatigue: 15, equipmentBonus: 7 },
  'World Champion': { technical: 94, mental: 91, physical: 82, confidence: 79, fatigue: 14, equipmentBonus: 8 },
  'Veteran Min Support': { technical: 80, mental: 76, physical: 67, confidence: 62, fatigue: 24, equipmentBonus: 7 },
}

const STYLE_OFFSETS: Record<ProfileStyle, {
  technical: Partial<Record<(typeof TECHNICAL_KEYS)[number], number>>
  mental: Partial<Record<(typeof MENTAL_KEYS)[number], number>>
  physical: Partial<Record<(typeof PHYSICAL_KEYS)[number], number>>
  playingStyle: string
  personalityType: string
}> = {
  Scorer: {
    technical: { 'Long Potting': 5, 'Break Building': 7, 'Cue Ball Control': 2, 'Safety Play': -4, Consistency: 1 },
    mental: { Focus: 1, Composure: -1, 'Big Match Nerve': 1 },
    physical: { Stamina: 1, 'Hand Steadiness': 1 },
    playingStyle: 'Attacking Scorer',
    personalityType: 'Driven Competitor',
  },
  Tactical: {
    technical: { 'Long Potting': -2, 'Break Building': -3, 'Cue Ball Control': 4, 'Safety Play': 7, Consistency: 2 },
    mental: { Focus: 3, Composure: 3, 'Big Match Nerve': 1, Professionalism: 2 },
    physical: { Balance: 2, 'Hand Steadiness': 2 },
    playingStyle: 'Safety First',
    personalityType: 'Disciplined Professional',
  },
  'Break Builder': {
    technical: { 'Long Potting': 2, 'Break Building': 8, 'Cue Ball Control': 5, 'Safety Play': -2, Consistency: 3 },
    mental: { Focus: 2, Composure: 1 },
    physical: { Stamina: 2, Balance: 1 },
    playingStyle: 'Measured Break Builder',
    personalityType: 'Calm Builder',
  },
  Counter: {
    technical: { 'Long Potting': 1, 'Break Building': 1, 'Cue Ball Control': 4, 'Safety Play': 3, Consistency: 4 },
    mental: { Focus: 3, Composure: 2, Resilience: 3 },
    physical: { Balance: 2, 'Hand Steadiness': 2 },
    playingStyle: 'Balanced Match Player',
    personalityType: 'Counter Puncher',
  },
  Nerve: {
    technical: { Consistency: 2, 'Cue Ball Control': 1 },
    mental: { Focus: 2, Composure: 5, 'Big Match Nerve': 6, Resilience: 2 },
    physical: { 'Hand Steadiness': 3 },
    playingStyle: 'Balanced Match Player',
    personalityType: 'Ice Cool Competitor',
  },
  Stamina: {
    technical: { Consistency: 1, 'Cue Ball Control': 1 },
    mental: { Focus: 1, Professionalism: 2 },
    physical: { Stamina: 6, 'Recovery Rate': 4, Balance: 2, 'Shoulder Health': 2 },
    playingStyle: 'Balanced Match Player',
    personalityType: 'Relentless Worker',
  },
}

const MATCHUPS: MatchupDefinition[] = [
  { label: 'Youth vs Youth', playerTier: 'Youth', opponentTier: 'Youth' },
  { label: 'Youth vs Amateur', playerTier: 'Youth', opponentTier: 'Amateur' },
  { label: 'Youth vs Top 64', playerTier: 'Youth', opponentTier: 'Top 64' },
  { label: 'Amateur vs Q Tour', playerTier: 'Amateur', opponentTier: 'Q Tour' },
  { label: 'Q Tour vs Rookie Pro', playerTier: 'Q Tour', opponentTier: 'Rookie Pro' },
  { label: 'Rookie Pro vs Top 64', playerTier: 'Rookie Pro', opponentTier: 'Top 64' },
  { label: 'Top 64 vs Top 32', playerTier: 'Top 64', opponentTier: 'Top 32' },
  { label: 'Top 32 vs Top 16', playerTier: 'Top 32', opponentTier: 'Top 16' },
  { label: 'Top 16 vs Top 4', playerTier: 'Top 16', opponentTier: 'Top 4' },
  { label: 'Veteran Min Support vs World Champion', playerTier: 'Veteran Min Support', opponentTier: 'World Champion' },
]

const STYLE_SEQUENCE: ProfileStyle[] = ['Scorer', 'Tactical', 'Break Builder', 'Counter', 'Nerve', 'Stamina', 'Scorer', 'Counter', 'Tactical', 'Break Builder']
const BEST_OF_SEQUENCE = [7, 9, 11, 19, 11, 9, 7, 19, 11, 9]

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value))
}

function createSeededRandom(seed: number) {
  let current = seed >>> 0
  return () => {
    current += 0x6d2b79f5
    let value = current
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function buildAttributeGroup<T extends string>(
  keys: readonly T[],
  baseValue: number,
  offsets: Partial<Record<T, number>>,
  seed: number,
) {
  const random = createSeededRandom(seed)

  return Object.fromEntries(keys.map((key) => {
    const jitter = Math.round((random() - 0.5) * 6)
    const offset = offsets[key] ?? 0
    return [key, clamp(baseValue + offset + jitter, 1, 99)]
  })) as Record<T, number>
}

function buildProfile(tier: ProfileTier, style: ProfileStyle, seed: number): Profile {
  const baseline = PROFILE_BASELINES[tier]
  const styleOffsets = STYLE_OFFSETS[style]
  const attributes: PlayerAttributes = {
    technical: buildAttributeGroup(TECHNICAL_KEYS, baseline.technical, styleOffsets.technical, seed * 11 + 1),
    mental: buildAttributeGroup(MENTAL_KEYS, baseline.mental, styleOffsets.mental, seed * 11 + 2),
    physical: buildAttributeGroup(PHYSICAL_KEYS, baseline.physical, styleOffsets.physical, seed * 11 + 3),
  }
  const technical = calculateTechnicalAverage(attributes.technical)
  const mental = calculateAverage(Object.values(attributes.mental))
  const physical = calculateAverage(Object.values(attributes.physical))
  const confidence = clamp(baseline.confidence + Math.round((createSeededRandom(seed * 11 + 4)() - 0.5) * 8), 25, 99)
  const fatigue = clamp(baseline.fatigue + Math.round((createSeededRandom(seed * 11 + 5)() - 0.5) * 6), 0, 99)
  const equipmentBonus = baseline.equipmentBonus
  const overall = calculateOverallRating({
    attributes,
    playingStyle: styleOffsets.playingStyle,
  })
  const strength = calculateMatchStrength({
    technical,
    mental,
    physical,
    confidence,
    fatigue,
    equipmentBonus,
  })

  return {
    tier,
    style,
    overall,
    technical,
    mental,
    physical,
    confidence,
    fatigue,
    equipmentBonus,
    strength,
    attributes,
    summary: `LP ${attributes.technical['Long Potting']}, BB ${attributes.technical['Break Building']}, SAF ${attributes.technical['Safety Play']}, COMP ${attributes.mental.Composure}, STM ${attributes.physical.Stamina}`,
  }
}

function getWinChance(playerStrength: number, opponentStrength: number) {
  return clamp(50 + (playerStrength - opponentStrength) * 1.18, 14, 84)
}

function simulateMatch(winChance: number, bestOf: number, random: () => number) {
  const frameWinChance = convertMatchWinProbabilityToFrameWinProbability(winChance, bestOf)
  const frameProbability = frameWinChance / 100
  const framesNeeded = Math.ceil(bestOf / 2)
  let playerFrames = 0
  let opponentFrames = 0

  while (playerFrames < framesNeeded && opponentFrames < framesNeeded) {
    if (random() < frameProbability) {
      playerFrames += 1
    } else {
      opponentFrames += 1
    }
  }

  return {
    frameWinChance,
    playerFrames,
    opponentFrames,
    playerWon: playerFrames > opponentFrames,
  }
}

function buildRows() {
  const rows: SimulationRow[] = []

  for (let caseNumber = 1; caseNumber <= 100; caseNumber += 1) {
    const matchup = MATCHUPS[Math.floor((caseNumber - 1) / 10)]
    const variantIndex = (caseNumber - 1) % 10
    const playerStyle = STYLE_SEQUENCE[variantIndex]
    const opponentStyle = STYLE_SEQUENCE[(variantIndex + 3) % STYLE_SEQUENCE.length]
    const player = buildProfile(matchup.playerTier, playerStyle, caseNumber * 17)
    const opponent = buildProfile(matchup.opponentTier, opponentStyle, caseNumber * 17 + 5)
    const bestOf = BEST_OF_SEQUENCE[variantIndex]
    const winChance = getWinChance(player.strength, opponent.strength)
    const simulated = simulateMatch(winChance, bestOf, createSeededRandom(caseNumber * 101 + bestOf))

    rows.push({
      caseNumber,
      matchup: matchup.label,
      bestOf,
      player,
      opponent,
      winChance,
      frameWinChance: simulated.frameWinChance,
      playerFrames: simulated.playerFrames,
      opponentFrames: simulated.opponentFrames,
      playerWon: simulated.playerWon,
    })
  }

  return rows
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function buildMarkdown(rows: SimulationRow[]) {
  const generatedAt = new Date().toISOString()
  const grouped = new Map<string, SimulationRow[]>()

  for (const row of rows) {
    const current = grouped.get(row.matchup) ?? []
    current.push(row)
    grouped.set(row.matchup, current)
  }

  const upsetRows = rows.filter((row) => (row.winChance < 40 && row.playerWon) || (row.winChance > 60 && !row.playerWon))
  const lines = [
    '# Match Simulation Report',
    '',
    `Generated: ${generatedAt}`,
    '',
    'This report is match-simulation only. It does not use calendar, career status, event access, or tournament progression logic.',
    '',
    '## Method',
    '',
    '- 100 deterministic synthetic match simulations were generated.',
    '- Profiles are built from live-match attribute families: technical, mental, and physical groups.',
    '- Overall rating comes from the shared overall-rating utility.',
    '- Match strength comes from the shared pre-match strength formula.',
    '- Baseline win chance uses the same match seeding curve shape as the live engine: `50 + (playerStrength - opponentStrength) * 1.18`, clamped to the normal match bounds.',
    '- Each case simulates one full match after converting match win chance into frame win chance for the selected format.',
    '',
    '## Matchup Summary',
    '',
    '| Matchup | Cases | Avg Player Overall | Avg Opponent Overall | Avg Player Strength | Avg Opponent Strength | Avg Win Chance | Sim Wins |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]

  for (const [matchup, matchupRows] of grouped) {
    const count = matchupRows.length
    const averagePlayerOverall = matchupRows.reduce((sum, row) => sum + row.player.overall, 0) / count
    const averageOpponentOverall = matchupRows.reduce((sum, row) => sum + row.opponent.overall, 0) / count
    const averagePlayerStrength = matchupRows.reduce((sum, row) => sum + row.player.strength, 0) / count
    const averageOpponentStrength = matchupRows.reduce((sum, row) => sum + row.opponent.strength, 0) / count
    const averageWinChance = matchupRows.reduce((sum, row) => sum + row.winChance, 0) / count
    const simWins = matchupRows.filter((row) => row.playerWon).length

    lines.push(`| ${matchup} | ${count} | ${averagePlayerOverall.toFixed(1)} | ${averageOpponentOverall.toFixed(1)} | ${averagePlayerStrength.toFixed(1)} | ${averageOpponentStrength.toFixed(1)} | ${formatPercent(averageWinChance)} | ${simWins}/${count} |`)
  }

  lines.push('')
  lines.push('## Notable Upsets')
  lines.push('')

  if (upsetRows.length === 0) {
    lines.push('No upsets crossed the report threshold.')
  } else {
    for (const row of upsetRows.slice(0, 12)) {
      const result = row.playerWon ? `${row.playerFrames}-${row.opponentFrames}` : `${row.playerFrames}-${row.opponentFrames}`
      lines.push(`- Case ${row.caseNumber}: ${row.matchup} | ${row.player.tier} ${row.player.style} (${row.player.overall}) vs ${row.opponent.tier} ${row.opponent.style} (${row.opponent.overall}) | expected ${formatPercent(row.winChance)} | result ${result}`)
    }
  }

  lines.push('')
  lines.push('## Full 100 Simulations')
  lines.push('')
  lines.push('| # | Matchup | Best Of | Player | Player Attrs | Opponent | Opponent Attrs | Player OVR | Opp OVR | Player STR | Opp STR | Match Win % | Frame Win % | Score | Winner |')
  lines.push('| ---: | --- | ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |')

  for (const row of rows) {
    lines.push(
      `| ${row.caseNumber} | ${row.matchup} | ${row.bestOf} | ${row.player.tier} ${row.player.style} | ${row.player.summary} | ${row.opponent.tier} ${row.opponent.style} | ${row.opponent.summary} | ${row.player.overall} | ${row.opponent.overall} | ${row.player.strength} | ${row.opponent.strength} | ${formatPercent(row.winChance)} | ${formatPercent(row.frameWinChance)} | ${row.playerFrames}-${row.opponentFrames} | ${row.playerWon ? 'Player' : 'Opponent'} |`,
    )
  }

  return `${lines.join('\n')}\n`
}

function main() {
  const rows = buildRows()
  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(reportPath, buildMarkdown(rows))
  console.log(`Wrote ${rows.length} simulations to ${reportPath}`)
}

main()
