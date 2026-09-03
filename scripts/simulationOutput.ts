import fs from 'node:fs'
import path from 'node:path'

export function getSimulationOutputDirectories(workspaceRoot: string) {
  const artifacts = path.join(workspaceRoot, 'artifacts', 'simulations')
  return {
    artifacts,
    playerSnapshots: path.join(artifacts, 'player-snapshots'),
    canonicalReports: path.join(workspaceRoot, 'docs', 'reports'),
  }
}

export function writeSimulationArtifacts(outputDirectory: string, reportBaseName: string, report: unknown, markdown: string) {
  fs.mkdirSync(outputDirectory, { recursive: true })
  const jsonPath = path.join(outputDirectory, `${reportBaseName}.json`)
  const markdownPath = path.join(outputDirectory, `${reportBaseName}.md`)
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))
  fs.writeFileSync(markdownPath, markdown)
  return { jsonPath, markdownPath }
}
