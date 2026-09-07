import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createPlayerStartingLevelCatalog } from '../src/data/gameContent'

type MatrixRow = {
  startingLevelId: string
  startingLevel: string
  seed: number
  seasons: number
  issues: string[]
  reportPath: string
  exitCode: number
  careerDepthAudit?: { stories: number; averageConfidence: number; saturatedConfidenceWeeks: number; confidenceSamples: number; policy: string }
}

function readNumberArg(name: string, fallback: number) {
  const value = process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1]
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

function readSeeds() {
  const value = process.argv.find((arg) => arg.startsWith('--seeds='))?.split('=')[1]
  return (value ?? '104729,130363,155921').split(',').map(Number).filter(Number.isFinite)
}

async function runScenario(level: (typeof createPlayerStartingLevelCatalog)[number], seed: number, seasons: number): Promise<MatrixRow> {
  const executable = process.execPath
  const args = [path.resolve('node_modules', 'tsx', 'dist', 'cli.mjs'), 'scripts/simulateFiveSeasons.ts', `--seasons=${seasons}`, `--seed=${seed}`, `--starting-level-id=${level.id}`, `--start-age=${level.minAge}`, `--scenario-label=matrix-${level.id}-${seed}`, '--skip-player-snapshots', '--skip-shared-audits', ...(process.argv.includes('--progress') ? ['--progress'] : []), ...(process.argv.includes('--calibration-adjustments') ? ['--calibration-adjustments'] : [])]

  return new Promise((resolve) => {
    const child = spawn(executable, args, { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += String(chunk) })
    child.stderr.on('data', (chunk) => { stderr += String(chunk); if(process.argv.includes('--progress')) process.stderr.write(`[${level.id}/${seed}] ${String(chunk)}`) })
    child.on('close', (code) => {
      try {
        const jsonStart = stdout.lastIndexOf('\n{')
        const result = JSON.parse(stdout.slice(jsonStart >= 0 ? jsonStart + 1 : 0)) as { reportPath: string; issues?: string[]; careerDepthAudit?: MatrixRow['careerDepthAudit'] }
        resolve({ startingLevelId: level.id, startingLevel: level.name, seed, seasons, issues: result.issues ?? [], reportPath: result.reportPath, exitCode: code ?? 1, careerDepthAudit: result.careerDepthAudit })
      } catch {
        resolve({ startingLevelId: level.id, startingLevel: level.name, seed, seasons, issues: [stderr.trim() || 'Simulation output could not be parsed.'], reportPath: '', exitCode: code ?? 1 })
      }
    })
  })
}

async function main() {
  const seasons = readNumberArg('seasons', 30)
  const concurrency = Math.max(1, readNumberArg('concurrency', 3))
  const baseSeeds = readSeeds()
  const requestedPaths = process.argv.find(arg => arg.startsWith('--paths='))?.split('=')[1]?.split(',');
  const levels = createPlayerStartingLevelCatalog.filter(level => !requestedPaths || requestedPaths.includes(level.id));
  if (!levels.length || requestedPaths?.some(id => !levels.some(level => level.id === id))) throw new Error('Unknown starting path in --paths.');
  const queue = levels.flatMap((level, levelIndex) => baseSeeds.map((seed) => ({ level, seed: seed + levelIndex * 100003 })))
  const rows: MatrixRow[] = []

  async function worker() {
    while (queue.length > 0) {
      const scenario = queue.shift()
      if (!scenario) return
      const row = await runScenario(scenario.level, scenario.seed, seasons)
      rows.push(row)
      process.stdout.write(`${row.startingLevelId} seed ${row.seed}: ${row.exitCode === 0 && row.issues.length === 0 ? 'pass' : 'review'}\n`)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  rows.sort((left, right) => left.startingLevelId.localeCompare(right.startingLevelId) || left.seed - right.seed)
  const failed = rows.filter((row) => row.exitCode !== 0 || row.issues.length > 0)
  const outputDirectory = path.resolve('artifacts', 'simulations')
  fs.mkdirSync(outputDirectory, { recursive: true })
  fs.writeFileSync(path.join(outputDirectory, 'balance-matrix-latest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), seasons, seedsPerPath: baseSeeds.length, scenarios: rows.length, failed: failed.length, rows }, null, 2))
  fs.writeFileSync(path.join(outputDirectory, 'balance-matrix-latest.md'), [
    '# Career Balance Matrix', '',
    `- Seasons per scenario: ${seasons}`,
    `- Starting paths: ${levels.length}`,
    `- Seeds per path: ${baseSeeds.length}`,
    `- Scenarios: ${rows.length}`,
    `- Requiring review: ${failed.length}`,
    '', '| Starting path | Seed | Result | Issues | Report |', '| --- | ---: | --- | --- | --- |',
    ...rows.map((row) => `| ${row.startingLevel} | ${row.seed} | ${row.exitCode === 0 && row.issues.length === 0 ? 'Pass' : 'Review'} | ${row.issues.join('; ') || 'None'} | ${row.reportPath} |`),
    '',
  ].join('\n'))

  console.log(`Completed ${rows.length} scenarios; ${failed.length} require review.`)
  if (failed.length > 0) process.exitCode = 1
}

void main()
