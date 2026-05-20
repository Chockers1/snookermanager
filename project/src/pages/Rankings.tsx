import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import TabGroup from '../components/ui/TabGroup';
import FormDots from '../components/ui/FormDots';

const tabs = [
  { id: 'world', label: 'World Ranking' },
  { id: 'provisional', label: 'Provisional Ranking' },
  { id: 'oneyear', label: 'One-Year Ranking' },
  { id: 'amateur', label: 'Amateur Ranking' },
];

const rankings = [
  { rank: 1, move: 0, name: 'Judd Trump', flag: '🇬🇧', prize: '£1,487,500', events: 17, titles: 5, form: ['W', 'W', 'W', 'L', 'W', 'W', 'L', 'W'] as ('W'|'L'|'D')[] },
  { rank: 2, move: 0, name: 'Kyren Wilson', flag: '🇬🇧', prize: '£1,157,000', events: 16, titles: 3, form: ['W', 'W', 'L', 'W', 'W', 'W', 'L', 'W'] as ('W'|'L'|'D')[] },
  { rank: 3, move: 1, name: 'Mark Selby', flag: '🇬🇧', prize: '£1,002,750', events: 16, titles: 2, form: ['W', 'L', 'W', 'W', 'W', 'L', 'W', 'W'] as ('W'|'L'|'D')[] },
  { rank: 4, move: -1, name: 'Neil Robertson', flag: '🇦🇺', prize: '£889,500', events: 16, titles: 2, form: ['L', 'W', 'W', 'W', 'L', 'L', 'W', 'W'] as ('W'|'L'|'D')[] },
  { rank: 5, move: 1, name: 'Mark Allen', flag: '🇬🇧', prize: '£821,000', events: 18, titles: 2, form: ['W', 'W', 'W', 'L', 'W', 'W', 'W', 'L'] as ('W'|'L'|'D')[] },
  { rank: 21, move: 2, name: 'Jack Harrison', flag: '🇬🇧', prize: '£242,750', events: 15, titles: 0, form: ['W', 'W', 'W', 'L', 'W', 'W', 'D', 'W'] as ('W'|'L'|'D')[], isPlayer: true },
  { rank: 22, move: -1, name: 'Xiao Guodong', flag: '🇨🇳', prize: '£238,500', events: 16, titles: 0, form: ['W', 'L', 'W', 'W', 'L', 'W', 'W', 'L'] as ('W'|'L'|'D')[] },
  { rank: 23, move: 0, name: 'Luca Brecel', flag: '🇧🇪', prize: '£233,000', events: 14, titles: 1, form: ['L', 'W', 'W', 'L', 'L', 'W', 'L', 'W'] as ('W'|'L'|'D')[] },
  { rank: 24, move: -3, name: 'Robert Milkins', flag: '🇬🇧', prize: '£228,000', events: 16, titles: 0, form: ['W', 'L', 'L', 'W', 'W', 'L', 'W', 'L'] as ('W'|'L'|'D')[] },
];

const movementData = [
  { month: "May '23", rank: 65 }, { month: "Sep '23", rank: 50 }, { month: "Jan '24", rank: 38 },
  { month: "May '24", rank: 30 }, { month: "Sep '24", rank: 28 }, { month: "Jan '25", rank: 24 },
  { month: "May '25", rank: 21 },
];

export default function Rankings() {
  const [activeTab, setActiveTab] = useState('world');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Rankings</h1>

      <TabGroup tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="grid grid-cols-12 gap-4">
        {/* Main Table */}
        <div className="col-span-8">
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-border bg-surface-light/50">
                    <th className="text-left py-2.5 px-3 font-medium">Rank</th>
                    <th className="text-center py-2.5 px-2 font-medium">Move</th>
                    <th className="text-left py-2.5 px-3 font-medium">Player</th>
                    <th className="text-left py-2.5 px-3 font-medium">Nation</th>
                    <th className="text-right py-2.5 px-3 font-medium">Prize Money</th>
                    <th className="text-center py-2.5 px-3 font-medium">Events</th>
                    <th className="text-center py-2.5 px-3 font-medium">Titles</th>
                    <th className="text-center py-2.5 px-3 font-medium">Form (Last 10)</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r) => (
                    <tr key={r.rank} className={`border-b border-border/50 ${r.isPlayer ? 'bg-green-600/10' : 'hover:bg-surface-light/50'}`}>
                      <td className="py-2.5 px-3 font-bold text-white">{r.rank}</td>
                      <td className="py-2.5 px-2 text-center">
                        {r.move > 0 ? <span className="text-green-400 flex items-center justify-center gap-0.5"><TrendingUp size={10} />{r.move}</span> :
                         r.move < 0 ? <span className="text-red-400 flex items-center justify-center gap-0.5"><TrendingDown size={10} />{Math.abs(r.move)}</span> :
                         <Minus size={10} className="text-gray-600 mx-auto" />}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-medium ${r.isPlayer ? 'text-green-400' : 'text-white'}`}>{r.name}</span>
                      </td>
                      <td className="py-2.5 px-3">{r.flag}</td>
                      <td className="py-2.5 px-3 text-right text-white">{r.prize}</td>
                      <td className="py-2.5 px-3 text-center text-gray-400">{r.events}</td>
                      <td className="py-2.5 px-3 text-center text-white">{r.titles}</td>
                      <td className="py-2.5 px-3"><FormDots form={r.form} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Player Ranking Detail */}
        <div className="col-span-4 space-y-4">
          <div className="card card-body text-center">
            <p className="text-[10px] text-gray-500 uppercase">Your World Ranking</p>
            <p className="text-4xl font-bold text-white mt-1">26</p>
            <div className="flex items-center justify-center gap-1 text-green-400 text-xs mt-1">
              <TrendingUp size={12} />
              <span>1 to 23</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">(+19,000 pts)</p>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Ranking Movement (24 Months)</h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={movementData}>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis reversed tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={[1, 80]} />
                  <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="rank" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Next Target</h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">23</p>
              <p className="text-xs text-gray-400 mt-1">Target Rank</p>
              <p className="text-xs text-green-400 mt-0.5">Needs +19,000 pts</p>
              <p className="text-[10px] text-gray-500 mt-2">Top 26 secured for World Championship qualification</p>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-2">Ranking Insights</h3>
            <div className="space-y-2 text-[10px] text-gray-400">
              <div className="p-2 bg-surface-light rounded">£21,000 at risk in the next 30 days. Protect your earnings.</div>
              <div className="p-2 bg-surface-light rounded">8 of 15 events counting towards your ranking.</div>
              <div className="p-2 bg-surface-light rounded">Your recent form is strong. 7 wins in last 10 matches.</div>
              <div className="p-2 bg-surface-light rounded">5 players within 10K pts (Ranks 24-28). Every frame matters.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
