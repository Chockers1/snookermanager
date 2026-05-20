import { Trophy, TrendingUp, ChevronRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const rankingMovement = [
  { month: "May '25", rank: 35 }, { month: "Jul '25", rank: 30 }, { month: "Sep '25", rank: 28 },
  { month: "Nov '25", rank: 25 }, { month: "Jan '26", rank: 22 }, { month: "Mar '26", rank: 20 },
  { month: "May '26", rank: 18 },
];

const prizeByEvent = [
  { event: 'Q School', prize: 15000 }, { event: 'UK Champ', prize: 73000 },
  { event: 'Int. Champ', prize: 65000 }, { event: 'European', prize: 38000 },
  { event: 'World GP', prize: 80000 }, { event: 'Players', prize: 53000 },
  { event: 'World Champ', prize: 612500 },
];

export default function SeasonReview() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">End of Season Review</h1>
          <p className="text-sm text-gray-400 mt-1">Season 2025/26 Review</p>
        </div>
        <div className="card card-body flex items-center gap-3 px-6">
          <div className="w-12 h-12 rounded-full bg-green-600/20 border-2 border-green-500 flex items-center justify-center">
            <span className="text-lg font-bold text-green-400">A-</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Season Grade</p>
            <p className="text-xs text-gray-400">A very strong season with significant progress on and off the table.</p>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-8 gap-3">
        {[
          { label: 'Final Ranking', value: '12', sub: 'Career Best: 12th' },
          { label: 'Ranking Movement', value: '+6', sub: 'From 18th to 12th', color: 'text-green-400' },
          { label: 'Prize Money', value: '£612,500', sub: 'Last Season: £414,000' },
          { label: 'Titles Won', value: '2', sub: '+1 vs Last Season' },
          { label: 'Highest Break', value: '147', sub: 'vs Ronnie O\'Sullivan' },
          { label: 'Centuries', value: '45', sub: 'Last Season: 37' },
          { label: 'Attribute Growth', value: '+12.4', sub: 'Across All Attributes', color: 'text-green-400' },
          { label: 'Financial Result', value: '+£198k', sub: 'Profit', color: 'text-green-400' },
        ].map((m) => (
          <div key={m.label} className="card card-body text-center">
            <p className="metric-label">{m.label}</p>
            <p className={`text-lg font-bold mt-1 ${m.color || 'text-white'}`}>{m.value}</p>
            <p className="text-[10px] text-gray-400">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Ranking Chart */}
        <div className="card">
          <div className="card-header"><h3 className="text-sm font-semibold text-white">Ranking Movement Over Season</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={rankingMovement}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis reversed tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={[1, 40]} />
                <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="rank" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prize by Event */}
        <div className="card">
          <div className="card-header"><h3 className="text-sm font-semibold text-white">Prize Money Earned by Event</h3></div>
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

      <div className="grid grid-cols-12 gap-4">
        {/* Grades */}
        <div className="col-span-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Coach Grade', grade: 'A-', desc: 'Very Good' },
              { label: 'Sponsor Grade', grade: 'A', desc: 'Excellent' },
              { label: 'Fan Growth', grade: '+18%', desc: '128,450 Total' },
            ].map((g) => (
              <div key={g.label} className="card card-body text-center">
                <p className="text-[10px] text-gray-500 uppercase">{g.label}</p>
                <p className="text-xl font-bold text-green-400 mt-1">{g.grade}</p>
                <p className="text-[10px] text-gray-400">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="col-span-4">
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Season Highlights</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-400">Matches Played</span><p className="text-white font-medium">78</p></div>
              <div><span className="text-gray-400">Matches Won</span><p className="text-white font-medium">52 (66.7%)</p></div>
              <div><span className="text-gray-400">Centuries</span><p className="text-white font-medium">45</p></div>
              <div><span className="text-gray-400">Maximum Breaks</span><p className="text-white font-medium">2</p></div>
              <div><span className="text-gray-400">Total Frames Won</span><p className="text-white font-medium">312</p></div>
              <div><span className="text-gray-400">Win Rate vs Top 16</span><p className="text-white font-medium">58%</p></div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Milestones Achieved</p>
              <ul className="space-y-1 text-xs text-green-400">
                <li>Career-high world ranking (12th)</li>
                <li>Reached World Championship Final</li>
                <li>Won European Masters</li>
                <li>45+ centuries in a season</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Financial */}
        <div className="col-span-4">
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Financial Summary</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Prize Money</span><span className="text-white">£380,000</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Sponsorship Income</span><span className="text-white">£120,000</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Other Income</span><span className="text-white">£45,000</span></div>
              <div className="flex justify-between pt-2 border-t border-border"><span className="text-gray-400 font-medium">Total Income</span><span className="text-white font-medium">£1,157,500</span></div>
              <div className="flex justify-between mt-2"><span className="text-gray-400">Staff Salaries</span><span className="text-red-400">-£210,000</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Travel & Accomm.</span><span className="text-red-400">-£165,000</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Training & Facilities</span><span className="text-red-400">-£98,000</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Other Expenses</span><span className="text-red-400">-£85,850</span></div>
              <div className="flex justify-between pt-2 border-t border-border"><span className="text-gray-400 font-medium">Total Expenses</span><span className="text-red-400 font-medium">-£558,850</span></div>
              <div className="flex justify-between pt-2 border-t border-border font-bold"><span className="text-white">NET PROFIT</span><span className="text-green-400">+£598,650</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Review */}
      <div className="card card-body">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center text-sm font-bold text-green-400">SH</div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Coach Review</h3>
            <p className="text-xs text-gray-400 italic mt-2 leading-relaxed">
              "A fantastic season from Ryan. His tactical awareness and consistency against top players improved massively.
              The World Championship final showed he belongs at the very top. Focus now is on closing out big matches and managing energy across a long season."
            </p>
            <p className="text-xs text-gray-500 mt-2">-- Stephen Hendry, Head Coach</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3 pt-2">
        <button className="btn-secondary"><TrendingUp size={14} /> View Full Stats</button>
        <button className="btn-secondary">Set Next Season Plan</button>
        <button className="btn-primary">
          <Trophy size={14} /> Continue to Offseason <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
