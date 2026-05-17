import { LayoutDashboard, Trophy, UserRound, Dumbbell, Briefcase, Wallet, CalendarDays, Star, Mail, HeartPulse, Brain, Medal } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { sidebarGroups } from '../../utils/routing'

const iconMap: Record<string, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard,
  'New Career': Star,
  Inbox: Mail,
  Attributes: UserRound,
  'Career Progression': Trophy,
  'Legacy Stats': Medal,
  Training: Dumbbell,
  Staff: Briefcase,
  Equipment: Star,
  Finance: Wallet,
  Calendar: CalendarDays,
  'Tournament Hub': Trophy,
  'Match Centre': Trophy,
  Rankings: Medal,
  Sponsorship: Briefcase,
  Mental: Brain,
  Health: HeartPulse,
  'Season Review': Medal,
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-scm-border bg-scm-deep/95 px-4 py-5">
      <div className="rounded-xl border border-scm-borderStrong bg-scm-panelSoft p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-scm-gold">Snooker Career Manager</p>
        <p className="mt-2 text-lg font-semibold text-scm-text">Phase 1 Shell</p>
        <p className="mt-1 text-sm text-scm-textMuted">Desktop-first career dashboard and route framework.</p>
      </div>
      <nav className="mt-6 space-y-6 overflow-y-auto pr-1">
        {sidebarGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.24em] text-scm-textMuted">{group.title}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = iconMap[item.label] ?? LayoutDashboard
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-scm-green/15 text-emerald-200'
                          : 'text-scm-textSoft hover:bg-scm-panelSoft hover:text-scm-text',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}