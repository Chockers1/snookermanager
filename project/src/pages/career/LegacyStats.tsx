import { Trophy, Target, Award, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';

const rankingHistory = [
  { year: "May '18", rank: 128 }, { year: "May '20", rank: 85 }, { year: "May '22", rank: 50 },
  { year: "May '24", rank: 30 }, { year: "May '25", rank: 26 },
];

const prizeByEvent = [
  { event: 'Q Tour', prize: 20000 }, { event: 'German Masters', prize: 80000 },
  { event: 'UK Champ', prize: 255000 }, { event: 'Players Champ', prize: 60000 },
  { event: 'World Grand Prix', prize: 100000 }, { event: 'World Champ', prize: 612500 },
];

const careerFinals = [
  { year: '2025', event: 'Q Tour Event 1', opponent: 'Mark Selby', flag: '🇬🇧', result: 'Won', score: '4 - 2', prize: 20000, impact: 6.8 },
  { year: '2025', event: 'German Masters', opponent: 'Neil Robertson', flag: '🇦🇺', result: 'Won', score: '9 - 6', prize: 80000, impact: 9.2 },
  { year: '2024', event: 'UK Championship', opponent: 'Mark Allen', flag: '🇬🇧', result: 'Won', score: '10 - 8', prize: 255000, impact: 14.7 },
  { year: '2024', event: 'Players Championship', opponent: 'Kyren Wilson', flag: '🇬🇧', result: 'Lost', score: '4 - 6', prize: 600000, impact: -2.1 },
  { year: '2024', event: 'World Grand Prix', opponent: 'Mark Williams', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', result: 'Won', score: '10 - 4', prize: 100000, impact: 9.6 },
];

export default function LegacyStats() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Career Stats & Legacy</h1>
        <p className="text-sm text-gray-400 mt-1">Your journey. Your numbers. Your legacy.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Matches Played', value: '378', sub: 'Career Total', icon: Target },
          { label: 'Matches Won', value: '247', sub: '65.3% Win Rate', icon: Trophy },
          { label: 'Titles', value: '17', sub: 'Career Total', icon: Award },
          { label: 'Major Titles', value: '3', sub: 'Career Total', icon: Trophy },
          { label: 'Total Prize Money', value: '£2.49M', sub: 'Career Earnings', icon: TrendingUp },
        ].map((stat) => (
          <div key={stat.label} className="card card-body text-center">
            <stat.icon size={16} className="text-green-400 mx-auto mb-1" />
            <p className="metric-label">{stat.label}</p>
            <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
            <p className="text-[10px] text-gray-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Legacy Score */}
        <div className="col-span-3">
          <div className="card card-body text-center">
            <p className="text-[10px] text-gray-500 font-semibold uppercase">Legacy Score</p>
            <div className="w-28 h-28 rounded-full border-4 border-green-500 flex flex-col items-center justify-center mx-auto mt-3">
              <span className="text-4xl font-bold text-white">78</span>
              <span className="text-xs text-gray-400">/100</span>
            </div>
            <p className="text-sm font-semibold text-green-400 mt-3">LEGEND IN THE MAKING</p>
          </div>

          <div className="card card-body mt-4">
            <h3 className="text-xs font-semibold text-white mb-3">Legacy Breakdown</h3>
            <p className="text-[10px] text-gray-500 mb-2">How your Legacy Score is built</p>
            <div className="space-y-2 text-xs">
              {[
                { name: 'Titles & Major Honours', value: '22 / 25', score: 13 },
                { name: 'Big-Match Performance', value: '16 / 20', score: 16 },
                { name: 'Longevity & Consistency', value: '13 / 15', score: 13 },
                { name: 'Ranking Peak', value: '12 / 15', score: 12 },
                { name: 'Century Scoring', value: '8 / 10', score: 8 },
                { name: 'Fan Reputation', value: '7 / 10', score: 7 },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-gray-400">{item.name}</span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border flex items-center justify-between font-semibold">
                <span className="text-white">TOTAL</span>
                <span className="text-green-400">78 / 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-9 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">Ranking Over Time</h3></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={rankingHistory}>
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis reversed tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} />
                    <Line type="monotone" dataKey="rank" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">Prize Money by Event</h3></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={prizeByEvent}>
                    <XAxis dataKey="event" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="prize" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Career Finals */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Career Finals</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-border">
                    <th className="text-left py-2 px-4">Year</th>
                    <th className="text-left py-2 px-4">Event</th>
                    <th className="text-left py-2 px-4">Opponent</th>
                    <th className="text-left py-2 px-4">Result</th>
                    <th className="text-left py-2 px-4">Score</th>
                    <th className="text-right py-2 px-4">Prize</th>
                    <th className="text-right py-2 px-4">Legacy Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {careerFinals.map((f, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-surface-light/50">
                      <td className="py-2 px-4 text-gray-400">{f.year}</td>
                      <td className="py-2 px-4 text-white">{f.event}</td>
                      <td className="py-2 px-4 text-white">{f.flag} {f.opponent}</td>
                      <td className="py-2 px-4">
                        <span className={f.result === 'Won' ? 'text-green-400' : 'text-red-400'}>{f.result}</span>
                      </td>
                      <td className="py-2 px-4 text-white">{f.score}</td>
                      <td className="py-2 px-4 text-right text-green-400">£{f.prize.toLocaleString()}</td>
                      <td className={`py-2 px-4 text-right font-medium ${f.impact > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {f.impact > 0 ? '+' : ''}{f.impact}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
