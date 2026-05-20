import { Trophy, PoundSterling, TrendingUp, Activity, ChevronRight, Zap, Target, Users, Wrench } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { mockPlayer, mockRecentResults, mockAttributes, mockFinances } from '../data/mockData';
import ProgressBar from '../components/ui/ProgressBar';
import FormDots from '../components/ui/FormDots';

const rankingData = [
  { month: 'Jul', rank: 45 }, { month: 'Aug', rank: 42 }, { month: 'Sep', rank: 38 },
  { month: 'Oct', rank: 35 }, { month: 'Nov', rank: 30 }, { month: 'Dec', rank: 28 },
  { month: 'Jan', rank: 25 }, { month: 'Feb', rank: 24 }, { month: 'Mar', rank: 22 },
  { month: 'Apr', rank: 21 }, { month: 'May', rank: 21 },
];

const cashFlowData = mockFinances.cashFlowHistory;

export default function Dashboard() {
  const p = mockPlayer;

  return (
    <div className="space-y-5">
      {/* Player Hero */}
      <div className="flex items-start gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-green-400">{p.worldRanking}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white truncate">{p.name}</h1>
              <span className="text-lg shrink-0">{p.flag}</span>
            </div>
            <p className="text-xs text-gray-400 truncate">The Green Hurricane</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-[10px] text-gray-500">Age: <span className="text-white">{p.age}</span></span>
              <span className="text-[10px] text-gray-500">Hand: <span className="text-white">{p.handedness}</span></span>
              <span className="text-[10px] text-gray-500">Coach: <span className="text-green-400">{p.coach}</span></span>
              <span className="text-[10px] text-gray-500">Status: <span className="text-white">Main Tour Pro</span></span>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Form (Last 10)</p>
            <FormDots form={p.form} />
          </div>
          <div className="text-center px-3 py-2 card">
            <p className="text-[10px] text-gray-500">Confidence</p>
            <p className="text-base font-bold text-white">{p.confidence}%</p>
          </div>
          <div className="text-center px-3 py-2 card">
            <p className="text-[10px] text-gray-500">Morale</p>
            <p className="text-xs font-medium text-green-400">+ {p.morale}</p>
          </div>
          <div className="text-center px-3 py-2 card">
            <p className="text-[10px] text-gray-500">Fatigue</p>
            <p className="text-base font-bold text-white">{p.fatigue}%</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column - Results & Training */}
        <div className="col-span-5 space-y-4">
          {/* Recent Results */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <Trophy size={12} className="text-green-400 shrink-0" />
                <span className="truncate">Upcoming & Recent Results</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-gray-500 border-b border-border">
                    <th className="text-left py-1.5 px-3 font-medium whitespace-nowrap">Date</th>
                    <th className="text-left py-1.5 px-3 font-medium whitespace-nowrap">Tournament</th>
                    <th className="text-left py-1.5 px-3 font-medium whitespace-nowrap">Rd</th>
                    <th className="text-left py-1.5 px-3 font-medium whitespace-nowrap">Opponent</th>
                    <th className="text-left py-1.5 px-3 font-medium whitespace-nowrap">Result</th>
                    <th className="text-right py-1.5 px-3 font-medium whitespace-nowrap">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {mockRecentResults.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-surface-light/50 transition-colors">
                      <td className="py-1.5 px-3 text-gray-400 whitespace-nowrap">{r.date}</td>
                      <td className="py-1.5 px-3 text-white whitespace-nowrap">{r.tournament}</td>
                      <td className="py-1.5 px-3 text-gray-400">{r.round}</td>
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        <span className="text-white">{r.opponentFlag} {r.opponent}</span>
                      </td>
                      <td className="py-1.5 px-3">
                        <span className={`font-medium ${r.playerScore > r.opponentScore ? 'text-green-400' : 'text-red-400'}`}>
                          {r.playerScore} - {r.opponentScore}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right text-green-400 whitespace-nowrap">£{r.prize.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-border">
              <div className="text-[9px] text-gray-500 font-medium uppercase">Upcoming Fixtures</div>
              <div className="mt-1">
                <div className="flex items-center justify-between text-[10px] py-0.5">
                  <span className="text-gray-400">14/05</span>
                  <span className="text-white truncate mx-2">World Champ Qual.</span>
                  <span className="text-gray-400">R1</span>
                  <span className="text-white ml-2 truncate">🇬🇧 Ian Burns</span>
                  <span className="text-gray-400 ml-auto pl-2 whitespace-nowrap">£7,500</span>
                </div>
              </div>
            </div>
          </div>

          {/* Training Week Overview */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <Zap size={12} className="text-green-400 shrink-0" />
                <span className="truncate">Training Week Overview</span>
              </h3>
              <span className="text-[9px] text-gray-400 whitespace-nowrap">Wk 32 (12-18 May)</span>
            </div>
            <div className="card-body space-y-2.5">
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <Users size={10} className="shrink-0" />
                <span className="truncate">Coach: Steve Feeney</span>
              </div>
              <div className="space-y-2">
                {[
                  { focus: 'Long Potting', intensity: 'Very High', progress: 82 },
                  { focus: 'Break Building', intensity: 'High', progress: 76 },
                  { focus: 'Safety Play', intensity: 'High', progress: 71 },
                  { focus: 'Mental Resilience', intensity: 'Medium', progress: 58 },
                ].map((s) => (
                  <div key={s.focus} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-300 w-24 shrink-0 truncate">{s.focus}</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded whitespace-nowrap shrink-0 ${
                      s.intensity === 'Very High' ? 'bg-green-600/20 text-green-400' :
                      s.intensity === 'High' ? 'bg-blue-600/20 text-blue-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>{s.intensity}</span>
                    <div className="flex-1 min-w-0">
                      <ProgressBar value={s.progress} showValue={true} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-[9px] text-gray-500 font-medium mb-1">THIS WEEK'S SCHEDULE</p>
                <div className="grid grid-cols-7 gap-0.5 text-[9px]">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} className="text-center text-gray-500">{day}</div>
                  ))}
                  {['Potting', 'Match', 'Safety', 'Rest', 'Breaks', 'Physical', 'Review'].map((s) => (
                    <div key={s} className="text-center text-gray-300 bg-surface-light rounded px-0.5 py-0.5 truncate">{s}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Attributes */}
        <div className="col-span-3 space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-xs font-semibold text-white truncate">Attributes Summary</h3>
            </div>
            <div className="card-body space-y-2">
              {Object.entries(mockAttributes.technical).slice(0, 5).map(([name, attr]) => (
                <ProgressBar key={name} label={name} value={attr.value} size="sm" />
              ))}
              <div className="pt-2 border-t border-border mt-2">
                <p className="text-[9px] text-gray-500 font-medium mb-1.5">POSITIONAL PLAY</p>
                {Object.entries(mockAttributes.mental).slice(0, 3).map(([name, attr]) => (
                  <ProgressBar key={name} label={name} value={attr.value} size="sm" />
                ))}
              </div>
              <div className="pt-2 border-t border-border mt-2">
                <p className="text-[9px] text-gray-500 font-medium mb-1.5">MATCHPLAY</p>
                {Object.entries(mockAttributes.mental).slice(3, 5).map(([name, attr]) => (
                  <ProgressBar key={name} label={name} value={attr.value} size="sm" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Rankings, Finance, Equipment */}
        <div className="col-span-4 space-y-4">
          {/* Ranking Progression */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <TrendingUp size={12} className="text-green-400 shrink-0" />
                <span className="truncate">Ranking Progression</span>
              </h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={rankingData}>
                  <defs>
                    <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis reversed tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={[1, 50]} />
                  <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 10 }} />
                  <Area type="monotone" dataKey="rank" stroke="#22c55e" fill="url(#rankGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-4 gap-1 mt-2">
                {[
                  { label: 'Current', value: '21' },
                  { label: 'Season High', value: '18' },
                  { label: 'Best', value: '18' },
                  { label: 'Win Rate', value: '70%' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-[9px] text-gray-500">{s.label}</p>
                    <p className="text-xs font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Up Next */}
          <div className="card border-green-600/30">
            <div className="card-header">
              <h3 className="text-xs font-semibold text-white">Up Next</h3>
            </div>
            <div className="card-body">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-600/20 flex items-center justify-center shrink-0">
                  <Target size={16} className="text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">World Championship</p>
                  <p className="text-[10px] text-gray-400 truncate">Qualifying Round 1</p>
                  <p className="text-[10px] text-gray-400">Sheffield - 14-21 May 2025</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[9px] text-gray-500 font-medium">FIRST ROUND OPPONENT</p>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center text-[9px] font-bold text-white shrink-0">IB</div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-white font-medium truncate">Ian Burns</p>
                      <p className="text-[9px] text-gray-400">Ranking 68</p>
                    </div>
                  </div>
                  <button className="btn-primary text-[10px] py-1 px-2 shrink-0">
                    Enter <ChevronRight size={10} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Finance Snapshot */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <PoundSterling size={12} className="text-green-400 shrink-0" />
                <span className="truncate">Finances Overview</span>
              </h3>
              <span className="text-[9px] text-gray-400 whitespace-nowrap">This Month</span>
            </div>
            <div className="card-body">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-lg font-bold text-white">£{(p.cashBalance).toLocaleString()}</span>
                <span className="text-[10px] text-gray-400">Balance</span>
              </div>
              <ResponsiveContainer width="100%" height={70}>
                <LineChart data={cashFlowData}>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 10 }} />
                  <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
                <div><p className="text-gray-500">Sponsorship</p><p className="text-white font-medium">£32,500</p></div>
                <div><p className="text-gray-500">Tournament</p><p className="text-white font-medium">£68,750</p></div>
                <div><p className="text-gray-500">Staff Costs</p><p className="text-red-400 font-medium">-£18,900</p></div>
                <div><p className="text-gray-500">Monthly Flow</p><p className="text-green-400 font-bold">£61,710</p></div>
              </div>
            </div>
          </div>

          {/* Equipment & Coaching */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card card-body">
              <div className="flex items-center gap-1.5 mb-2">
                <Wrench size={12} className="text-green-400 shrink-0" />
                <span className="text-[10px] font-semibold text-white truncate">Equipment</span>
              </div>
              <p className="text-[9px] text-gray-500">Overall Bonus</p>
              <p className="text-[10px] text-green-400 font-medium">+7.8 to key attrs</p>
              <div className="mt-1.5 space-y-0.5 text-[9px]">
                <div className="flex justify-between"><span className="text-gray-400">Cue</span><span className="text-white truncate ml-1">Peradon P3</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Tip</span><span className="text-white truncate ml-1">Kamui Black</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Chalk</span><span className="text-white truncate ml-1">Taom Pyro</span></div>
              </div>
            </div>
            <div className="card card-body">
              <div className="flex items-center gap-1.5 mb-2">
                <Users size={12} className="text-green-400 shrink-0" />
                <span className="text-[10px] font-semibold text-white truncate">Coaching</span>
              </div>
              <div className="space-y-1.5 text-[9px]">
                {[
                  { name: 'Steve Feeney', role: 'Head' },
                  { name: 'Chris Henry', role: 'Potting' },
                ].map((c) => (
                  <div key={c.name}>
                    <p className="text-white truncate">{c.name}</p>
                    <p className="text-gray-500">{c.role} Coach</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-12 right-6 z-40">
        <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center gap-2 text-xs">
          <Activity size={14} />
          Continue
          <span className="bg-green-700 px-1.5 py-0.5 rounded text-[10px]">1 Day</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
