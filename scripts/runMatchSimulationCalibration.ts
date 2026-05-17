import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CALIBRATION_FORMATS,
  MATCHUPS,
  PROFILE_STYLES,
  buildSyntheticProfile,
  createSeededRandom,
  getAverageScoreline,
  getBaselineMatchWinChance,
  getCalibrationTargetBand,
  simulateBaselineMatch,
} from './matchSimulationShared'

type SummaryRow = {
  matchup: string
  bestOf: number
  cases: number
  expectedWinRate: number
  frameWinRate: number
  actualWinRate: number
  difference: number
  standardDeviation: number
  varianceBandLow: number
  varianceBandHigh: number
  averageScoreline: string
  whitewashes: number
  decidingFrames: number
  upsetWins: number
  favouriteWins: number
  targetBand: string
  warnings: string[]
}

type CsvRow = {
  matchup: string
  bestOf: number
  simulation: number
  playerTier: string
  playerStyle: string
  opponentTier: string
  opponentStyle: string
  playerOverall: number
  opponentOverall: number
  playerStrength: number
  opponentStrength: number
  expectedMatchWinPercent: number
  frameWinPercent: number
  playerFrames: number
  opponentFrames: number
  score: string
  winner: 'Player' | 'Opponent'
  underdogWin: boolean
  decidingFrame: boolean
  whitewash: boolean
}

const RUNS_PER_MATCHUP_FORMAT = 1000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..')
const reportsDir = path.join(workspaceRoot, 'docs', 'reports')
const markdownPath = path.join(reportsDir, 'match-simulation-calibration.md')
const csvPath = path.join(reportsDir, 'match-simulation-calibration.csv')

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatBand(low: number, high: number) {
  return `${low.toFixed(1)}% to ${high.toFixed(1)}%`
}

function formatTargetBand(matchup: string, bestOf: number) {
  const target = getCalibrationTargetBand(matchup, bestOf)
  return target ? `${target.min}-${target.max}%` : 'n/a'
}

function getBernoulliStandardDeviation(probabilityPercent: number) {
  const probability = probabilityPercent / 100
  return Math.sqrt(probability * (1 - probability)) * 100
}

function getVarianceBand(actualWinRate: number, cases: number) {
  const probability = actualWinRate / 100
  const margin = 1.96 * Math.sqrt((probability * (1 - probability)) / Math.max(1, cases)) * 100
  return {
    low: Math.max(0, actualWinRate - margin),
    high: Math.min(100, actualWinRate + margin),
  }
}

function getWarnings(summary: Omit<SummaryRow, 'warnings'>) {
  const warnings: string[] = []
  const target = getCalibrationTargetBand(summary.matchup, summary.bestOf)

  if (target && (summary.expectedWinRate < target.min || summary.expectedWinRate > target.max)) {
    warnings.push(`expected ${summary.expectedWinRate.toFixed(1)}% outside target ${target.min}-${target.max}%`)
  }

  if (summary.expectedWinRate < 30 && summary.actualWinRate > 35) {
    warnings.push('underdog expected below 30% but actual win rate exceeded 35%')
  }

  if (summary.bestOf >= 19 && summary.expectedWinRate < 20 && summary.actualWinRate > 20) {
    warnings.push('underdog expected below 20% is winning long matches too often')
  }

  if (summary.matchup === 'Veteran Min Support vs World Champion' && summary.bestOf >= 19 && summary.actualWinRate > 15) {
    warnings.push('world champion loses too often to min-support veteran in long formats')
  }

  if (summary.matchup === 'Youth vs Top 64' && summary.bestOf >= 19 && summary.actualWinRate > 12) {
    warnings.push('youth beats top-64 too often in long formats')
  }

  if (Math.abs(summary.difference) > 4) {
    warnings.push(`expected vs actual drift is ${summary.difference.toFixed(1)}%`)
  }

  return warnings
}

function buildCalibrationData() {
  const summaryRows: SummaryRow[] = []
  const csvRows: CsvRow[] = []

  MATCHUPS.forEach((matchup, matchupIndex) => {
    CALIBRATION_FORMATS.forEach((bestOf) => {
      let expectedSum = 0
      let frameSum = 0
      let actualWins = 0
      let whitewashes = 0
      let decidingFrames = 0
      let upsetWins = 0
      let favouriteWins = 0
      const playerScores: number[] = []
      const opponentScores: number[] = []

      for (let simulation = 0; simulation < RUNS_PER_MATCHUP_FORMAT; simulation += 1) {
        const playerStyle = PROFILE_STYLES[(simulation + bestOf) % PROFILE_STYLES.length]
        const opponentStyle = PROFILE_STYLES[(simulation + bestOf + 2) % PROFILE_STYLES.length]
        const player = buildSyntheticProfile(matchup.playerTier, playerStyle, matchupIndex * 100000 + bestOf * 1000 + simulation * 2 + 1)
        const opponent = buildSyntheticProfile(matchup.opponentTier, opponentStyle, matchupIndex * 100000 + bestOf * 1000 + simulation * 2 + 2)
        const expectedWinRate = getBaselineMatchWinChance(player.strength, opponent.strength)
        const outcome = simulateBaselineMatch(expectedWinRate, bestOf, createSeededRandom(matchupIndex * 1000000 + bestOf * 10000 + simulation))
        const underdogIsPlayer = expectedWinRate < 50

        expectedSum += expectedWinRate
        frameSum += outcome.frameWinChance
        actualWins += outcome.playerWon ? 1 : 0
        whitewashes += outcome.whitewash ? 1 : 0
        decidingFrames += outcome.decidingFrame ? 1 : 0
        upsetWins += outcome.playerWon && underdogIsPlayer ? 1 : 0
        favouriteWins += outcome.playerWon && !underdogIsPlayer ? 1 : !outcome.playerWon && underdogIsPlayer ? 1 : 0
        playerScores.push(outcome.playerFrames)
        opponentScores.push(outcome.opponentFrames)

        csvRows.push({
          matchup: matchup.label,
          bestOf,
          simulation: simulation + 1,
          playerTier: player.tier,
          playerStyle: player.style,
          opponentTier: opponent.tier,
          opponentStyle: opponent.style,
          playerOverall: player.overall,
          opponentOverall: opponent.overall,
          playerStrength: player.strength,
          opponentStrength: opponent.strength,
          expectedMatchWinPercent: Number(expectedWinRate.toFixed(4)),
          frameWinPercent: Number(outcome.frameWinChance.toFixed(4)),
          playerFrames: outcome.playerFrames,
          opponentFrames: outcome.opponentFrames,
          score: `${outcome.playerFrames}-${outcome.opponentFrames}`,
          winner: outcome.playerWon ? 'Player' : 'Opponent',
          underdogWin: outcome.playerWon && underdogIsPlayer,
          decidingFrame: outcome.decidingFrame,
          whitewash: outcome.whitewash,
        })
      }

      const expectedWinRate = expectedSum / RUNS_PER_MATCHUP_FORMAT
      const frameWinRate = frameSum / RUNS_PER_MATCHUP_FORMAT
      const actualWinRate = (actualWins / RUNS_PER_MATCHUP_FORMAT) * 100
      const difference = actualWinRate - expectedWinRate
      const standardDeviation = getBernoulliStandardDeviation(actualWinRate)
      const varianceBand = getVarianceBand(actualWinRate, RUNS_PER_MATCHUP_FORMAT)
      const rowWithoutWarnings = {
        matchup: matchup.label,
        bestOf,
        cases: RUNS_PER_MATCHUP_FORMAT,
        expectedWinRate,
        frameWinRate,
        actualWinRate,
        difference,
        standardDeviation,
        varianceBandLow: varianceBand.low,
        varianceBandHigh: varianceBand.high,
        averageScoreline: getAverageScoreline(playerScores, opponentScores),
        whitewashes,
        decidingFrames,
        upsetWins,
        favouriteWins,
        targetBand: formatTargetBand(matchup.label, bestOf),
      }

      summaryRows.push({
        ...rowWithoutWarnings,
        warnings: getWarnings(rowWithoutWarnings),
      })
    })
  })

  return { summaryRows, csvRows }
}

function buildMarkdown(summaryRows: SummaryRow[]) {
  const lines = [
    '# Match Simulation Calibration',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '- 1,000 simulations were run for each matchup and each best-of format.',
    '- Formats: Best of 7, 9, 11, 19, 25, 33, 35.',
    '- This report is baseline match calibration only. It uses the shared pre-match strength and frame-conversion utilities, not calendar or career-world systems.',
    '- Detailed case rows are written to `match-simulation-calibration.csv`.',
    '',
    '## Global Warnings',
    '',
  ]

  const globalWarnings = summaryRows.flatMap((row) => row.warnings.map((warning) => `${row.matchup} | BO${row.bestOf}: ${warning}`))
  if (globalWarnings.length === 0) {
    lines.push('No calibration warnings were triggered.')
  } else {
    globalWarnings.forEach((warning) => lines.push(`- ${warning}`))
  }

  for (const matchup of MATCHUPS) {
    const matchupRows = summaryRows.filter((row) => row.matchup === matchup.label)
    lines.push('')
    lines.push(`## ${matchup.label}`)
    lines.push('')
    lines.push('| Best Of | Cases | Expected Win % | Frame Win % | Actual Win % | Diff | Std Dev | 95% Band | Avg Scoreline | Whitewashes | Deciders | Upset Wins | Favourite Wins | Target Band | Warnings |')
    lines.push('| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |')

    matchupRows.forEach((row) => {
      lines.push(`| ${row.bestOf} | ${row.cases} | ${formatPercent(row.expectedWinRate)} | ${formatPercent(row.frameWinRate)} | ${formatPercent(row.actualWinRate)} | ${formatPercent(row.difference)} | ${formatPercent(row.standardDeviation)} | ${formatBand(row.varianceBandLow, row.varianceBandHigh)} | ${row.averageScoreline} | ${row.whitewashes} | ${row.decidingFrames} | ${row.upsetWins} | ${row.favouriteWins} | ${row.targetBand} | ${row.warnings.join('; ') || 'none'} |`)
    })
  }

  return `${lines.join('\n')}\n`
}

function buildCsv(rows: CsvRow[]) {
  const headers = [
    'matchup',
    'bestOf',
    'simulation',
    'playerTier',
    'playerStyle',
    'opponentTier',
    'opponentStyle',
    'playerOverall',
    'opponentOverall',
    'playerStrength',
    'opponentStrength',
    'expectedMatchWinPercent',
    'frameWinPercent',
    'playerFrames',
    'opponentFrames',
    'score',
    'winner',
    'underdogWin',
    'decidingFrame',
    'whitewash',
  ]
  const lines = [headers.join(',')]

  rows.forEach((row) => {
    lines.push([
      row.matchup,
      row.bestOf,
      row.simulation,
      row.playerTier,
      row.playerStyle,
      row.opponentTier,
      row.opponentStyle,
      row.playerOverall,
      row.opponentOverall,
      row.playerStrength,
      row.opponentStrength,
      row.expectedMatchWinPercent,
      row.frameWinPercent,
      row.playerFrames,
      row.opponentFrames,
      row.score,
      row.winner,
      row.underdogWin,
      row.decidingFrame,
      row.whitewash,
    ].join(','))
  })

  return `${lines.join('\n')}\n`
}

function main() {
  const { summaryRows, csvRows } = buildCalibrationData()
  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(markdownPath, buildMarkdown(summaryRows))
  fs.writeFileSync(csvPath, buildCsv(csvRows))
  console.log(`Wrote calibration summary to ${markdownPath}`)
  console.log(`Wrote calibration rows to ${csvPath}`)
}

main()