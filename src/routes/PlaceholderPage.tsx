import { Construction, LayoutTemplate } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { SectionCard } from '../components/ui/SectionCard'

type PlaceholderPageProps = {
  title: string
  description: string
  section: string
}

export function PlaceholderPage({ title, description, section }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={section}
        title={title}
        description={description}
        actions={<ActionButton tone="secondary" icon={<LayoutTemplate className="h-4 w-4" />}>Route Status</ActionButton>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_340px]">
        <SectionCard title="Planned Screen" subtitle="This route is available in navigation, but its gameplay systems are not wired yet.">
          <div className="rounded-xl border border-dashed border-scm-borderStrong bg-scm-deep/60 p-10 text-center">
            <Construction className="mx-auto h-10 w-10 text-scm-gold" />
            <p className="mt-4 text-lg font-semibold text-scm-text">{title} is not implemented yet</p>
            <p className="mt-2 text-sm text-scm-textMuted">The route stays visible so navigation and shell structure remain consistent while the underlying systems are still being built.</p>
          </div>
        </SectionCard>
        <SectionCard title="Route Status" subtitle="Current implementation state for this screen.">
          <div className="mt-4 space-y-3 text-sm text-scm-textSoft">
            <p>The shared shell, card language, and navigation structure are already in place.</p>
            <p>Route-specific gameplay data will appear here once the screen is connected to live save systems.</p>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}