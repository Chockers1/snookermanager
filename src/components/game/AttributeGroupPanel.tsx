import type { AttributeGroup } from '../../types/game'
import { AttributeBar } from '../ui/AttributeBar'

type AttributeGroupPanelProps = {
  title: string
  attributes: AttributeGroup
}

export function AttributeGroupPanel({ title, attributes }: AttributeGroupPanelProps) {
  return (
    <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-scm-textMuted">{title}</p>
      <div className="mt-4 space-y-4">
        {Object.entries(attributes).map(([label, value]) => (
          <AttributeBar key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  )
}