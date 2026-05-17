import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { simulateSyntheticLiveVisitMatch } from '../src/hooks/useGameState'
import type { PlayerAttributes } from '../src/types/game'
import { SIMULATION_MODE } from '../src/utils/simulationMode'
import {
  CALIBRATION_FORMATS,
  MATCHUPS,
  PROFILE_STYLES,
  buildSyntheticProfile,
  getBaselineMatchWinChance,
  type ProfileTier,
} from './matchSimulationShared'

type LiveVisitRow = {
  matchup: string
  bestOf: number
  playerTier: string
  playerStyle: string
  opponentTier: string
  opponentStyle: string
  expectedWinRate: number
  playerFrames: number
  opponentFrames: number
  winner: 'Player' | 'Opponent'
  totalVisits: number
  playerHighestBreak: number
  opponentHighestBreak: number
  playerFifties: number
  playerCenturies: number
  decisionCounts: Record<'Pot Attempt' | 'Break Build' | 'Safety Exchange' | 'Snooker Hunt' | 'Respotted Black', number>
}

type MatchupSummary = {
  matchup: string
  cases: number
  expectedWinRate: number
  actualWinRate: number
  difference: number
  averageScoreline: string
  averageVisits: number
  averagePlayerHighBreak: number
  averageOpponentHighBreak: number
  decisions: Record<'Pot Attempt' | 'Break Build' | 'Safety Exchange' | 'Snooker Hunt' | 'Respotted Black', number>
}

const MATCHES_PER_MATCHUP = 10

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..')
const reportsDir = path.join(workspaceRoot, 'docs', 'reports')
const markdownPath = path.join(reportsDir, 'match-simulation-live-visit-100.md')

function getSyntheticRanking(tier: ProfileTier) {
  switch (tier) {
    case 'Youth': return 180
    case 'Amateur': return 128
    case 'Q Tour': return 96
    case 'Rookie Pro': return 72
    case 'Top 64': return 48
    case 'Top 32': return 24
    case 'Top 16': return 12
    case 'Top 4': return 3
    case 'World Champion': return 1
    case 'Veteran Min Support': return 56
    default: return 64
  }
}

function getClutch(attributes: PlayerAttributes) {
  return Math.round((attributes.mental['Big Match Nerve'] + attributes.mental.Composure + attributes.mental.Focus) / 3)
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function getDecisionSummary(decisions: LiveVisitRow['decisionCounts']) {
  return `P ${decisions['Pot Attempt']} / B ${decisions['Break Build']} / S ${decisions['Safety Exchange']} / H ${decisions['Snooker Hunt']} / RB ${decisions['Respotted Black']}`
}

function buildRows() {
  const rows: LiveVisitRow[] = []

  MATCHUPS.forEach((matchup, matchupIndex) => {
    for (let index = 0; index < MATCHES_PER_MATCHUP; index += 1) {
      const bestOf = CALIBRATION_FORMATS[(matchupIndex + index) % CALIBRATION_FORMATS.length]
      const playerStyle = PROFILE_STYLES[index % PROFILE_STYLES.length]
      const opponentStyle = PROFILE_STYLES[(index + 2) % PROFILE_STYLES.length]
      const player = buildSyntheticProfile(matchup.playerTier, playerStyle, matchupIndex * 1000 + index * 2 + 1)
      const opponent = buildSyntheticProfile(matchup.opponentTier, opponentStyle, matchupIndex * 1000 + index * 2 + 2)
      const expectedWinRate = getBaselineMatchWinChance(player.strength, opponent.strength)
      const result = simulateSyntheticLiveVisitMatch({
        simulationMode: SIMULATION_MODE.liveVisitCalibration,
        playerName: `${player.tier} ${player.style}`,
        opponentName: `${opponent.tier} ${opponent.style}`,
        bestOf,
        seed: matchupIndex * 5000 + bestOf * 100 + index,
        playerAttributes: player.attributes,
        playerEquipmentBonus: player.equipmentBonus,
        playerConfidence: player.confidence,
        playerFatigue: player.fatigue,
        playerClutch: getClutch(player.attributes),
        playerStrength: player.strength,
        opponentRanking: getSyntheticRanking(opponent.tier),
        opponentConfidence: opponent.confidence,
        opponentFatigue: opponent.fatigue,
        opponentClutch: getClutch(opponent.attributes),
        opponentStrength: opponent.strength,
        plannedMatchWinChance: expectedWinRate,
        preserveTacticalEdge: true,
      })

      rows.push({
        matchup: matchup.label,
        bestOf,
        playerTier: player.tier,
        playerStyle: player.style,
        opponentTier: opponent.tier,
        opponentStyle: opponent.style,
        expectedWinRate,
        playerFrames: result.playerFrames,
        opponentFrames: result.opponentFrames,
        winner: result.playerWon ? 'Player' : 'Opponent',
        totalVisits: result.totalVisits,
        playerHighestBreak: result.playerHighestBreak,
        opponentHighestBreak: result.opponentHighestBreak,
        playerFifties: result.playerFifties,
        playerCenturies: result.playerCenturies,
        decisionCounts: result.decisionCounts,
      })
    }
  })

  return rows
}

function buildSummary(rows: LiveVisitRow[]) {
  return MATCHUPS.map((matchup) => {
    const matchupRows = rows.filter((row) => row.matchup === matchup.label)
    const cases = matchupRows.length
    const expectedWinRate = matchupRows.reduce((sum, row) => sum + row.expectedWinRate, 0) / Math.max(1, cases)
    const actualWinRate = matchupRows.reduce((sum, row) => sum + (row.winner === 'Player' ? 1 : 0), 0) / Math.max(1, cases) * 100
    const averagePlayerFrames = matchupRows.reduce((sum, row) => sum + row.playerFrames, 0) / Math.max(1, cases)
    const averageOpponentFrames = matchupRows.reduce((sum, row) => sum + row.opponentFrames, 0) / Math.max(1, cases)
    const decisions: MatchupSummary['decisions'] = {
      'Pot Attempt': 0,
      'Break Build': 0,
      'Safety Exchange': 0,
      'Snooker Hunt': 0,
      'Respotted Black': 0,
    }

    matchupRows.forEach((row) => {
      decisions['Pot Attempt'] += row.decisionCounts['Pot Attempt']
      decisions['Break Build'] += row.decisionCounts['Break Build']
      decisions['Safety Exchange'] += row.decisionCounts['Safety Exchange']
      decisions['Snooker Hunt'] += row.decisionCounts['Snooker Hunt']
      decisions['Respotted Black'] += row.decisionCounts['Respotted Black']
    })

    return {
      matchup: matchup.label,
      cases,
      expectedWinRate,
      actualWinRate,
      difference: actualWinRate - expectedWinRate,
      averageScoreline: `${averagePlayerFrames.toFixed(1)}-${averageOpponentFrames.toFixed(1)}`,
      averageVisits: matchupRows.reduce((sum, row) => sum + row.totalVisits, 0) / Math.max(1, cases),
      averagePlayerHighBreak: matchupRows.reduce((sum, row) => sum + row.playerHighestBreak, 0) / Math.max(1, cases),
      averageOpponentHighBreak: matchupRows.reduce((sum, row) => sum + row.opponentHighestBreak, 0) / Math.max(1, cases),
      decisions,
    } satisfies MatchupSummary
  })
}

function buildMarkdown(rows: LiveVisitRow[]) {
  const summaries = buildSummary(rows)
  const lines = [
    '# Match Simulation Live Visit 100',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '- 100 synthetic matches were run through the live visit engine.',
    '- Each row uses the same synthetic tier/style profiles as the baseline calibration, but match play is resolved visit by visit through the live engine.',
    '- Opponent live-visit profiles still use the in-game rank/strength/archetype model, matching current live-match behaviour.',
    '',
    '## Matchup Summary',
    '',
    '| Matchup | Cases | Expected Win % | Actual Win % | Diff | Avg Scoreline | Avg Visits | Avg Player High Break | Avg Opponent High Break | Decision Mix |',
    '| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- |',
  ]

  summaries.forEach((summary) => {
    lines.push(`| ${summary.matchup} | ${summary.cases} | ${formatPercent(summary.expectedWinRate)} | ${formatPercent(summary.actualWinRate)} | ${formatPercent(summary.difference)} | ${summary.averageScoreline} | ${summary.averageVisits.toFixed(1)} | ${summary.averagePlayerHighBreak.toFixed(1)} | ${summary.averageOpponentHighBreak.toFixed(1)} | ${getDecisionSummary(summary.decisions)} |`)
  })

  const driftWarnings = summaries.filter((summary) => Math.abs(summary.difference) >= 10)
  lines.push('')
  lines.push('## Live Engine Warnings')
  lines.push('')

  if (driftWarnings.length === 0) {
    lines.push('No live-engine drift warnings were triggered.')
  } else {
    driftWarnings.forEach((summary) => {
      lines.push(`- ${summary.matchup}: expected ${summary.expectedWinRate.toFixed(1)}%, actual ${summary.actualWinRate.toFixed(1)}%, drift ${summary.difference.toFixed(1)}%, avg visits ${summary.averageVisits.toFixed(1)}.`)
    })
  }

  const notableRows = rows.filter((row) => (row.bestOf >= 19 && row.expectedWinRate < 20 && row.winner === 'Player') || row.playerCenturies > 0 || row.playerHighestBreak >= 100 || row.opponentHighestBreak >= 100)
  lines.push('')
  lines.push('## Notable Cases')
  lines.push('')

  if (notableRows.length === 0) {
    lines.push('No notable live-visit cases were triggered.')
  } else {
    notableRows.slice(0, 20).forEach((row) => {
      lines.push(`- ${row.matchup}, BO${row.bestOf}: ${row.winner} won ${row.playerFrames}-${row.opponentFrames}, expected ${row.expectedWinRate.toFixed(1)}%, visits ${row.totalVisits}, player high break ${row.playerHighestBreak}, opponent high break ${row.opponentHighestBreak}.`)
    })
  }

  lines.push('')
  lines.push('## Full 100 Cases')
  lines.push('')
  lines.push('| # | Matchup | BO | Player | Opponent | Expected Win % | Score | Winner | Visits | Player HB | Opponent HB | Player 50+ | Player 100+ | Decision Mix |')
  lines.push('| ---: | --- | ---: | --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |')

  rows.forEach((row, index) => {
    lines.push(`| ${index + 1} | ${row.matchup} | ${row.bestOf} | ${row.playerTier} ${row.playerStyle} | ${row.opponentTier} ${row.opponentStyle} | ${formatPercent(row.expectedWinRate)} | ${row.playerFrames}-${row.opponentFrames} | ${row.winner} | ${row.totalVisits} | ${row.playerHighestBreak} | ${row.opponentHighestBreak} | ${row.playerFifties} | ${row.playerCenturies} | ${getDecisionSummary(row.decisionCounts)} |`)
  })

  return `${lines.join('\n')}\n`
}

function main() {
  const rows = buildRows()
  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(markdownPath, buildMarkdown(rows))
  console.log(`Wrote live visit report to ${markdownPath}`)
}

main()