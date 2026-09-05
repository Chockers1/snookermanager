import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { GameState } from '../../hooks/useGameState';
import { dashboardFinance } from '../../utils/dashboardFinance';
import { formatMoney } from '../../utils/formatters';

function shortMoney(value: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function DashboardFinanceSummary({ state }: { state: GameState }) {
  const data = dashboardFinance(state);
  const metrics = [
    { label: 'Balance', value: data.balance, color: 'text-white' },
    { label: 'Income', value: data.income, color: 'text-green-400' },
    { label: 'Expenses', value: data.expenses, color: 'text-red-400' },
    { label: 'Net', value: data.net, color: data.net < 0 ? 'text-red-400' : 'text-green-400' },
  ];
  return <div data-testid="dashboard-finance-content" className="flex min-h-0 flex-1 flex-col gap-2 px-3 py-2">
    <div className="min-h-[84px] flex-1" role="img" aria-label={`Recorded cash balance this month, currently ${formatMoney(data.balance)}`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={84} initialDimension={{ width: 1, height: 84 }}>
        <AreaChart data={data.trend} margin={{ top: 5, right: 7, bottom: 0, left: 0 }}>
          <defs><linearGradient id="dashboardCashGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.28} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} height={20} minTickGap={24} />
          <YAxis tickFormatter={shortMoney} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={43} tickCount={3} domain={['auto', 'auto']} />
          <Tooltip formatter={value => [formatMoney(Number(value)), 'Balance']} contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} />
          <Area type="linear" dataKey="balance" stroke="#22c55e" strokeWidth={2} fill="url(#dashboardCashGradient)" dot={data.trend.length === 1 ? { r: 3, fill: '#22c55e' } : false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <dl className="grid shrink-0 grid-cols-4 gap-1 border-t border-border pt-2 text-center">
      {metrics.map(metric => <div key={metric.label} className="min-w-0"><dt className="text-[9px] text-gray-400">{metric.label}</dt><dd title={formatMoney(metric.value)} className={`mt-0.5 whitespace-nowrap text-xs font-bold ${metric.color}`}>{shortMoney(metric.value)}</dd></div>)}
    </dl>
  </div>;
}

export function DashboardCareerSummary({ state, coachName }: { state: GameState; coachName?: string }) {
  return <div data-testid="dashboard-career-content" className="grid min-h-0 flex-1 grid-rows-[auto_1fr_auto] gap-2 p-3">
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2">
      <span className="h-2 w-2 shrink-0 rounded-full bg-green-400" />
      <p className="min-w-0 text-xs font-semibold leading-snug text-green-400">{state.player.competitiveStatus ?? state.player.rankingLabel}</p>
    </div>
    <dl className="grid min-w-0 grid-cols-[0.55fr_1fr_1.35fr] gap-2">
      <div className="flex flex-col justify-center rounded-lg bg-surface-light/50 p-2"><dt className="text-[9px] text-gray-400">Age</dt><dd className="mt-1 text-lg font-bold leading-tight text-white">{state.player.age}</dd></div>
      <div className="flex min-w-0 flex-col justify-center rounded-lg bg-surface-light/50 p-2"><dt className="text-[9px] text-gray-400">Plays</dt><dd className="mt-1 break-words text-[11px] font-semibold leading-snug text-white">{state.player.handedness}</dd></div>
      <div className="flex min-w-0 flex-col justify-center rounded-lg bg-surface-light/50 p-2"><dt className="text-[9px] text-gray-400">Lead coach</dt><dd className={`mt-1 break-words text-[11px] font-semibold leading-snug ${coachName ? 'text-white' : 'text-amber-400'}`}>{coachName ?? 'Open slot'}</dd></div>
    </dl>
    <dl className="grid min-w-0 grid-cols-2 gap-3 border-t border-border pt-2">
      <div className="min-w-0"><dt className="text-[9px] text-gray-400">Playing style</dt><dd className="mt-0.5 break-words text-[10px] font-medium leading-snug text-white">{state.player.playingStyle}</dd></div>
      <div className="min-w-0"><dt className="text-[9px] text-gray-400">Cue style</dt><dd className="mt-0.5 break-words text-[10px] font-medium leading-snug text-white">{state.player.cueStyle ?? 'Traditional Cue Action'}</dd></div>
    </dl>
  </div>;
}
