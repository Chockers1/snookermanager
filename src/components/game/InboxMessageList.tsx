import type { InboxMessage } from '../../types/game'
import { StatusBadge } from '../ui/StatusBadge'

type InboxMessageListProps = {
  messages: InboxMessage[]
}

export function InboxMessageList({ messages }: InboxMessageListProps) {
  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div key={message.id} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-scm-text">{message.subject}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-scm-textMuted">{message.sender}</p>
            </div>
            <StatusBadge tone={message.priority === 'High' ? 'amber' : message.priority === 'Medium' ? 'blue' : 'slate'}>
              {message.priority}
            </StatusBadge>
          </div>
          <p className="mt-3 text-sm text-scm-textSoft">{message.preview}</p>
        </div>
      ))}
    </div>
  )
}