import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarDays, Coins } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { CircularMeter } from '../components/ui/CircularMeter'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import { buildFinanceData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

function BreakdownCard({ title, items, totalLabel }: { title: string; items: Array<{ label: string; value: number; share: number; delta: number }>; totalLabel: string }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return (
    <SectionCard title={title}>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{item.label}</p>
            <p className="mt-2 text-xl font-semibold text-scm-text">{formatMoney(item.value)}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-scm-textSoft">
              <span>{item.share}% of total</span>
              <span className={item.delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{item.delta > 0 ? '+' : ''}{item.delta}%</span>
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-scm-borderStrong bg-scm-panelSoft p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{totalLabel}</p>
          <p className="mt-2 text-2xl font-semibold text-scm-text">{formatMoney(total)}</p>
        </div>
      </div>
    </SectionCard>
  )
}

export function FinancePage() {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const { financeChart, incomeBreakdown, expenseBreakdown, budgetAllocation, tournamentPlanner, forecastCards, financialIndicators } = buildFinanceData(gameState)
  const [financeAction, setFinanceAction] = useState<'cashflow' | 'budget' | 'planner' | 'cost'>('cashflow')
  const weeklyCashChange = gameState.finance.cashFlow
  const monthlySurplus = weeklyCashChange * 4
  const monthlyBurnRate = Math.max(0, -monthlySurplus)
  const runwayMonths = monthlyBurnRate > 0 ? gameState.player.cash / monthlyBurnRate : null
  const nextTournament =
    gameState.tournaments.find((event) => event.status === 'Entered') ??
    gameState.tournaments.find((event) => event.status === 'Available' || event.status === 'High Cost') ??
    gameState.tournaments[0]
  const financeActionMessage =
    financeAction === 'budget'
      ? 'Budget mode is active. Use the allocation and tournament planning panels below to guide the next spend decision.'
      : financeAction === 'planner'
        ? 'Scenario mode is active. Compare runway, next-event costs, and sponsor income before committing cash.'
        : financeAction === 'cost'
          ? 'Cost-control mode is active. Focus on runway, burn rate, and the highest discretionary spend items.'
          : 'Cash-flow mode is active. Review the chart and monthly inflow versus expense balance below.'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Finance Dashboard"
        description="Cash flow, monthly outlook, tournament planning, and budget allocation. The headline finance surface now reflects the current local save state."
        actions={<div className="flex items-center gap-3"><ActionButton tone="secondary" onClick={() => setFinanceAction('cashflow')}>View Cash Flow</ActionButton><ActionButton icon={<CalendarDays className="h-4 w-4" />} onClick={() => navigate('/calendar')}>Go To Calendar</ActionButton></div>}
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_180px_180px_260px]">
        <SectionCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Current Cash Balance</p>
              <p className="mt-2 text-5xl font-semibold text-scm-gold">{formatMoney(gameState.player.cash)}</p>
              <p className={`mt-2 flex items-center gap-2 ${gameState.player.cash < 5000 ? 'text-rose-300' : 'text-emerald-300'}`}><AlertTriangle className="h-4 w-4" />{gameState.player.cash < 5000 ? 'Low cash warning' : 'Cash position stable'}</p>
            </div>
            <Coins className="h-10 w-10 text-scm-gold" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Weekly Cash Change</p><p className={`mt-2 text-2xl font-semibold ${weeklyCashChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{weeklyCashChange >= 0 ? '+' : '-'}{formatMoney(Math.abs(weeklyCashChange))}</p></div>
            <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Monthly Surplus / Deficit</p><p className={`mt-2 text-2xl font-semibold ${monthlySurplus >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{monthlySurplus >= 0 ? '+' : '-'}{formatMoney(Math.abs(monthlySurplus))}</p></div>
            <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Monthly Burn Rate</p><p className="mt-2 text-2xl font-semibold text-scm-text">{formatMoney(monthlyBurnRate)}</p></div>
          </div>
        </SectionCard>
        <SectionCard className="flex items-center justify-center"><CircularMeter value={gameState.player.confidence} label="Confidence" /></SectionCard>
        <SectionCard className="flex items-center justify-center"><div className="text-center"><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Form</p><div className="mt-4 flex gap-2">{gameState.player.form.map((f,i)=><span key={i} className={`flex h-8 w-8 items-center justify-center rounded-full ${f==='W'?'bg-scm-green/20 text-emerald-200':'bg-scm-red/20 text-rose-200'}`}>{f}</span>)}</div></div></SectionCard>
        <SectionCard>
          <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Next Tournament</p>
          <p className="mt-3 text-xl font-semibold text-scm-text">{nextTournament?.name ?? 'No event scheduled'}</p>
          <p className="mt-2 text-sm text-scm-textSoft">{nextTournament?.location ?? 'TBD'}</p>
          <p className="mt-3 text-sm text-scm-gold">{gameState.player.daysUntilEvent} days to go</p>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_320px]">
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard title="Cash Runway" subtitle="Estimated runway based on current spend profile.">
              <div className={`rounded-xl border p-4 text-center ${runwayMonths === null ? 'border-emerald-500/35 bg-emerald-500/10' : runwayMonths < 4 ? 'border-scm-red/35 bg-scm-red/10' : 'border-amber-500/35 bg-amber-500/10'}`}>
                <p className={`text-lg font-semibold ${runwayMonths === null ? 'text-emerald-100' : runwayMonths < 4 ? 'text-rose-100' : 'text-amber-100'}`}>Cash runway: {runwayMonths === null ? 'stable positive flow' : `${runwayMonths.toFixed(1)} months`}</p>
              </div>
            </SectionCard>
            <SectionCard title="Income vs Expenses (Monthly)">
              <div className="h-[280px] w-full">
                <ResponsiveContainer>
                  <BarChart data={financeChart}>
                    <CartesianGrid stroke="#203449" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={50} />
                    <Tooltip contentStyle={{ backgroundColor: '#102033', border: '1px solid #31506f', borderRadius: '12px' }} />
                    <Bar dataKey="income" fill="#7ad34b" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          <BreakdownCard title="Income Breakdown (This Month)" items={incomeBreakdown} totalLabel="Total Income (MTD)" />
          <BreakdownCard title="Expense Breakdown (This Month)" items={expenseBreakdown} totalLabel="Total Expenses (MTD)" />

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard title="Monthly Budget Allocation" subtitle="Total budget: £3,800 / month">
              <div className="space-y-4">
                {budgetAllocation.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{item.label}</span><span className="text-scm-text">{item.current}% · {formatMoney(item.amount)}</span></div>
                    <ProgressBar value={item.current} max={item.max} tone="green" />
                  </div>
                ))}
                <p className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">Adjust allocations to match your strategy and financial situation.</p>
              </div>
            </SectionCard>

            <SectionCard title="Tournament Cost Planner (Upcoming)">
              <div className="space-y-3">
                {tournamentPlanner.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-xl border border-scm-border bg-scm-panelSoft p-4 md:grid-cols-[1.5fr_repeat(4,0.7fr)_0.6fr] text-sm">
                    <div><p className="font-semibold text-scm-text">{item.event}</p><p className="mt-1 text-xs text-scm-textMuted">{item.location} · {item.date}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Entry</p><p className="mt-1 text-scm-text">{formatMoney(item.entryCost)}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Travel</p><p className="mt-1 text-scm-text">{formatMoney(item.travelCost)}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Hotel</p><p className="mt-1 text-scm-text">{formatMoney(item.hotelCost)}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Prize</p><p className="mt-1 text-scm-text">{item.prizePotential}</p></div>
                    <div className="flex items-center justify-end"><StatusBadge tone={item.risk === 'High' ? 'red' : item.risk === 'Medium' ? 'amber' : 'green'}>{item.risk}</StatusBadge></div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-3 md:grid-cols-6">
            <ActionButton className="justify-center" onClick={() => setFinanceAction('budget')}>Adjust Budget</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => setFinanceAction('planner')}>Scenario Planner</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => setFinanceAction('cost')}>Cost Cutting Options</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/sponsorship')}>Sponsorship Hub</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => setFinanceAction('cashflow')}>View Cash Flow</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/calendar')}>Go To Calendar</ActionButton>
          </div>

          <div className="rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm text-scm-textSoft">
            {financeActionMessage}
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Financial Forecast">
            <div className="space-y-4">
              {forecastCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{card.label}</p><p className={`mt-2 text-2xl font-semibold ${card.projectedBalance >= 0 ? 'text-scm-gold' : 'text-rose-300'}`}>{formatMoney(card.projectedBalance)}</p></div><StatusBadge tone={card.outlook === 'Stable' ? 'green' : card.outlook === 'Caution' ? 'amber' : 'red'}>{card.outlook}</StatusBadge></div>
                  <div className="mt-4 flex items-end gap-2">
                    {card.trend.map((value, index) => <div key={index} className={`h-10 flex-1 rounded-full ${card.outlook === 'Stable' ? 'bg-scm-green/80' : card.outlook === 'Caution' ? 'bg-scm-gold/80' : 'bg-scm-red/80'}`} style={{ opacity: 0.35 + value / 20 }} />)}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Financial Indicators">
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-4"><CircularMeter value={financialIndicators.savings.value} label="Savings" /><div><p className="text-sm text-scm-textMuted">{financialIndicators.savings.label}</p><p className="mt-1 text-2xl font-semibold text-scm-text">{financialIndicators.savings.status}</p></div></div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{financialIndicators.stability.label}</span><span className="text-scm-text">{financialIndicators.stability.value}%</span></div>
                <ProgressBar value={financialIndicators.stability.value} tone="amber" />
                <p className="mt-2 text-sm text-scm-textSoft">{financialIndicators.stability.status}</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}