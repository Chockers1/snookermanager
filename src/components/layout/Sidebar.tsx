import { BookOpen, Brain, Calendar, Dumbbell, Handshake, HeartPulse, LayoutDashboard, Mail, Medal, PoundSterling, Swords, Target, TrendingUp, Trophy, User, UserPlus, Users, Wrench } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useGame } from '../../context/GameStateContext'
import { sidebarGroups } from '../../utils/routing'

const iconMap: Record<string, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard,
  'New Career': UserPlus,
  Inbox: Mail,
  Attributes: User,
  'Career Progression': TrendingUp,
  'Legacy Stats': Trophy,
  Training: Dumbbell,
  Staff: Users,
  Equipment: Wrench,
  Finance: PoundSterling,
  Calendar,
  'Tournament Hub': Target,
  'Match Centre': Swords,
  Rankings: Medal,
  Sponsorship: Handshake,
  Mental: Brain,
  Health: HeartPulse,
  'Season Review': BookOpen,
}

export function Sidebar() {
  const { gameState } = useGame()
  const nextEvent = gameState.tournaments.find((event) => event.status === 'Entered')
    ?? gameState.tournaments.find((event) => event.status === 'Booked' || event.status === 'Available' || event.status === 'High Cost')
    ?? gameState.tournaments[0]

  return (
    <aside className="scrollbar-thin flex h-full w-52 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar">
      <div className="border-b border-border p-4">
        <h1 className="text-lg font-bold leading-tight tracking-tight text-white">SNOOKER</h1>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-green-400">Career Manager</p>
      </div>
      <nav className="flex-1 space-y-4 px-2 py-2">
        {sidebarGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = iconMap[item.label] ?? LayoutDashboard
                const badge = item.path === '/inbox' ? gameState.inbox.length : null
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-green-600/20 font-medium text-green-400'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white',
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {badge ? (
                        <span className="ml-auto rounded-full bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>
                      ) : null}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-border p-2">
        <div className="rounded-lg bg-surface p-2.5">
          <p className="text-[9px] font-semibold uppercase text-gray-500">Next Event</p>
          <p className="mt-0.5 truncate text-xs font-medium text-white">{nextEvent?.name ?? gameState.player.nextEvent}</p>
          <p className="truncate text-[10px] text-gray-400">{nextEvent?.location ?? gameState.player.careerStage}</p>
          <p className="mt-0.5 text-[10px] text-green-400">{nextEvent ? nextEvent.startDate : `${gameState.player.daysUntilEvent} days`}</p>
        </div>
      </div>
    </aside>
  )
}