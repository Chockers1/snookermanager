import type { Cue } from '../../types/game'
import { ComparisonPanel } from '../ui/ComparisonPanel'
import { AttributeBar } from '../ui/AttributeBar'

type CueComparisonPanelProps = {
  currentCue: Cue
  targetCue: Cue
}

function CueStats({ cue }: { cue: Cue }) {
  return (
    <div className="space-y-4">
      <AttributeBar label="Touch" value={cue.touch} />
      <AttributeBar label="Spin Control" value={cue.spinControl} />
      <AttributeBar label="Stability" value={cue.stability} />
      <AttributeBar label="Durability" value={cue.durability} />
    </div>
  )
}

export function CueComparisonPanel({ currentCue, targetCue }: CueComparisonPanelProps) {
  return (
    <ComparisonPanel
      leftTitle={`Current · ${currentCue.name}`}
      rightTitle={`Scouted · ${targetCue.name}`}
      leftContent={<CueStats cue={currentCue} />}
      rightContent={<CueStats cue={targetCue} />}
    />
  )
}