import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Mail,
  User,
  TrendingUp,
  Trophy,
  Dumbbell,
  Users,
  Wrench,
  PoundSterling,
  Calendar,
  Target,
  Swords,
  Medal,
  Handshake,
  Brain,
  HeartPulse,
  BookOpen,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/new-career', icon: UserPlus, label: 'New Career' },
      { to: '/inbox', icon: Mail, label: 'Inbox', badge: 5 },
    ],
  },
  {
    label: 'Player',
    items: [
      { to: '/player/attributes', icon: User, label: 'Attributes' },
      { to: '/career/progression', icon: TrendingUp, label: 'Career Progression' },
      { to: '/career/stats', icon: Trophy, label: 'Legacy Stats' },
    ],
  },
  {
    label: 'Preparation',
    items: [
      { to: '/training', icon: Dumbbell, label: 'Training' },
      { to: '/staff/coaches', icon: Users, label: 'Staff' },
      { to: '/equipment/cues', icon: Wrench, label: 'Equipment' },
      { to: '/finance', icon: PoundSterling, label: 'Finance' },
    ],
  },
  {
    label: 'Competition',
    items: [
      { to: '/calendar', icon: Calendar, label: 'Calendar' },
      { to: '/tournaments/hub', icon: Target, label: 'Tournament Hub' },
      { to: '/match/preview', icon: Swords, label: 'Match Centre' },
      { to: '/rankings', icon: Medal, label: 'Rankings' },
    ],
  },
  {
    label: 'Career Support',
    items: [
      { to: '/sponsorship', icon: Handshake, label: 'Sponsorship' },
      { to: '/mental', icon: Brain, label: 'Mental' },
      { to: '/health', icon: HeartPulse, label: 'Health' },
      { to: '/season-review', icon: BookOpen, label: 'Season Review' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-52 bg-sidebar border-r border-border flex flex-col h-full overflow-y-auto scrollbar-thin shrink-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
          SNOOKER
        </h1>
        <p className="text-[10px] font-semibold text-green-400 tracking-widest uppercase">
          Career Manager
        </p>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-green-600/20 text-green-400 font-medium'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon size={16} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-border shrink-0">
        <div className="bg-surface rounded-lg p-2.5">
          <p className="text-[9px] text-gray-500 uppercase font-semibold">Next Event</p>
          <p className="text-xs text-white font-medium mt-0.5 truncate">World Championship</p>
          <p className="text-[10px] text-gray-400 truncate">Sheffield, England</p>
          <p className="text-[10px] text-green-400 mt-0.5">Starts in 9 days</p>
        </div>
      </div>
    </aside>
  );
}
