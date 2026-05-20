import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { mockFinances } from '../../data/mockData';

export default function Finance() {
  const f = mockFinances;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Season 2024/25 - Week 18 (May 12 - May 18, 2025)</p>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-3 flex items-center gap-3">
        <AlertTriangle size={18} className="text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-400">Cash runway: 4.2 months</p>
          <p className="text-xs text-gray-400">At current burn rate, funds will be exhausted by September 2025.</p>
        </div>
      </div>

      {/* Cash Balance Hero */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card card-body col-span-1">
          <p className="metric-label">Current Cash Balance</p>
          <p className="text-3xl font-bold text-white mt-2">£{(f.cashBalance / 1000).toFixed(0)}k</p>
          <div className="flex items-center gap-2 mt-2">
            <AlertTriangle size={12} className="text-amber-400" />
            <span className="text-[10px] text-amber-400">LOW CASH WARNING</span>
          </div>
        </div>
        <div className="card card-body">
          <p className="metric-label">Weekly Cash Change</p>
          <p className="text-xl font-bold text-red-400 mt-2">-£{Math.abs(f.weeklyChange).toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDown size={10} className="text-red-400" />
            <span className="text-[10px] text-gray-400">vs last week</span>
          </div>
        </div>
        <div className="card card-body">
          <p className="metric-label">Monthly Surplus / Deficit</p>
          <p className="text-xl font-bold text-red-400 mt-2">-£{Math.abs(f.monthlyDeficit).toLocaleString()}</p>
          <span className="text-[10px] text-gray-400">Apr 12 - May 12</span>
        </div>
        <div className="card card-body">
          <p className="metric-label">Monthly Burn Rate</p>
          <p className="text-xl font-bold text-white mt-2">£{f.burnRate.toLocaleString()}</p>
          <span className="text-[10px] text-gray-400">Avg. per month</span>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-white">Income vs Expenses (Monthly)</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={f.cashFlowHistory}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Income */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-white">Income Breakdown (This Month)</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-3">
              {f.income.map((item) => (
                <div key={item.name} className="p-3 bg-surface-light/50 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase">{item.name}</p>
                  <p className="text-lg font-bold text-white mt-0.5">£{item.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">{item.percentOfTotal}% of total</p>
                  <div className="flex items-center gap-1 mt-1">
                    {item.vsLastMonth >= 0 ? (
                      <TrendingUp size={10} className="text-green-400" />
                    ) : (
                      <TrendingDown size={10} className="text-red-400" />
                    )}
                    <span className={`text-[10px] ${item.vsLastMonth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {item.vsLastMonth >= 0 ? '+' : ''}{item.vsLastMonth}% vs Apr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-white">Expense Breakdown (This Month)</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-3">
              {f.expenses.slice(0, 6).map((item) => (
                <div key={item.name} className="p-3 bg-surface-light/50 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase">{item.name}</p>
                  <p className="text-lg font-bold text-white mt-0.5">£{item.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">{item.percentOfTotal}% of total</p>
                  <div className="flex items-center gap-1 mt-1">
                    {item.vsLastMonth <= 0 ? (
                      <TrendingDown size={10} className="text-green-400" />
                    ) : (
                      <TrendingUp size={10} className="text-red-400" />
                    )}
                    <span className={`text-[10px] ${item.vsLastMonth <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {item.vsLastMonth >= 0 ? '+' : ''}{item.vsLastMonth}% vs Apr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Cost Planner */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-white">Tournament Cost Planner (Upcoming)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-border">
                <th className="text-left py-2 px-4">Tournament</th>
                <th className="text-right py-2 px-4">Entry Cost</th>
                <th className="text-right py-2 px-4">Travel Cost</th>
                <th className="text-right py-2 px-4">Hotel</th>
                <th className="text-right py-2 px-4">Prize Potential</th>
                <th className="text-center py-2 px-4">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Q School - Event 2', entry: 500, travel: 120, hotel: 360, prize: '£20,000+', risk: 'HIGH' },
                { name: 'WST Championship League', entry: 300, travel: 90, hotel: 280, prize: '£10,000', risk: 'MEDIUM' },
                { name: 'British Open', entry: 1000, travel: 180, hotel: 420, prize: '£100,000+', risk: 'HIGH' },
              ].map((t) => (
                <tr key={t.name} className="border-b border-border/50 hover:bg-surface-light/50">
                  <td className="py-2 px-4 text-white">{t.name}</td>
                  <td className="py-2 px-4 text-right text-white">£{t.entry}</td>
                  <td className="py-2 px-4 text-right text-white">£{t.travel}</td>
                  <td className="py-2 px-4 text-right text-white">£{t.hotel}</td>
                  <td className="py-2 px-4 text-right text-green-400">{t.prize}</td>
                  <td className="py-2 px-4 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      t.risk === 'HIGH' ? 'bg-red-600/20 text-red-400' : 'bg-amber-600/20 text-amber-400'
                    }`}>{t.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
