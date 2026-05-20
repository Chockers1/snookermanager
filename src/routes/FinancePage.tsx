import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarDays,
  Coins,
  Download,
  Landmark,
  PiggyBank,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/GameStateContext'
import { buildFinanceData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

type FinanceActionMode = 'cashflow' | 'budget' | 'planner' | 'cost'

function formatSignedMoney(value: number) {
  return `${value >= 0 ? '+' : '-'}${formatMoney(Math.abs(value))}`
}

function formatCompactDate(dateValue: string) {
  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) return dateValue
  return parsedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function getDateValue(dateValue: string) {
  const parsedDate = new Date(dateValue)
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime()
}

function statusPillClass(status: string) {
  if (/complete|active/i.test(status)) return 'rounded bg-green-600/20 px-1.5 py-0.5 text-[9px] text-green-400'
  if (/pending|booked/i.test(status)) return 'rounded bg-amber-600/20 px-1.5 py-0.5 text-[9px] text-amber-400'
  return 'rounded bg-surface-light/70 px-1.5 py-0.5 text-[9px] text-gray-300'
}

const incomeColors = ['#22c55e', '#16a34a', '#3b82f6', '#38bdf8']
const expenseColors = ['#ef4444', '#f97316', '#fbbf24', '#64748b']

export function FinancePage() {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const { incomeBreakdown, expenseBreakdown, budgetAllocation, tournamentPlanner, forecastCards, financialIndicators } = buildFinanceData(gameState)
  const [financeAction, setFinanceAction] = useState<FinanceActionMode>('budget')

  const weeklyCashChange = gameState.finance.cashFlow
  const monthlySurplus = weeklyCashChange * 4
  const monthlyBurnRate = Math.max(0, -monthlySurplus)
  const sponsorMonthlyIncome = gameState.sponsors.reduce((sum, sponsor) => sum + sponsor.monthlyValue, 0)
  const sponsorWeeklyIncome = Math.round(sponsorMonthlyIncome / 4)
  const coachWeeklyCost = gameState.coachContracts.reduce((sum, contract) => sum + contract.weeklyCost, 0)
  const travelSpend = Object.values(gameState.travel.bookings).reduce((sum, booking) => sum + booking.totalCost, 0)
  const equipmentSpend = gameState.maintenance.history.reduce((sum, item) => sum + item.cost, 0)
  const prizeIncome = gameState.matches.reduce((sum, match) => sum + match.prizeMoneyEarned, 0)
  const currentMonthIncome = incomeBreakdown.reduce((sum, item) => sum + item.value, 0)
  const currentMonthExpenses = expenseBreakdown.reduce((sum, item) => sum + item.value, 0)
  const currentMonthNet = currentMonthIncome - currentMonthExpenses
  const projectedMonthEnd = forecastCards[0]?.projectedBalance ?? (gameState.player.cash + currentMonthNet)
  const planningBudget = Math.max(currentMonthExpenses, budgetAllocation.reduce((sum, item) => sum + item.amount, 0), 1)
  const weeksElapsed = Math.max(1, gameState.week)
  const ytdIncome = prizeIncome + sponsorWeeklyIncome * weeksElapsed + Math.max(0, gameState.finance.baseCashFlow) * weeksElapsed
  const ytdExpenses = coachWeeklyCost * weeksElapsed + travelSpend + equipmentSpend + Math.max(0, -gameState.finance.baseCashFlow) * weeksElapsed
  const ytdNet = ytdIncome - ytdExpenses
  const savingsTarget = gameState.player.cash >= 20000 ? 25000 : gameState.player.cash >= 10000 ? 15000 : 5000
  const savingsProgress = Math.min(100, Math.round((gameState.player.cash / savingsTarget) * 100))

  const monthlyComparisonData = [
    { label: 'Income', value: currentMonthIncome, fill: '#22c55e' },
    { label: 'Expenses', value: currentMonthExpenses, fill: '#ef4444' },
  ]

  const recentTransactions = [
    ...gameState.matches
      .filter((match) => match.prizeMoneyEarned > 0)
      .map((match) => {
        const tournament = gameState.tournaments.find((event) => event.id === match.tournamentId)
        return {
          id: `match-${match.id}`,
          date: match.playedOn ?? tournament?.startDate ?? gameState.currentDate,
          description: `${tournament?.name ?? match.round} Prize`,
          category: 'Prize Money',
          type: 'Income',
          amount: match.prizeMoneyEarned,
          status: 'Completed',
        }
      }),
    ...gameState.sponsors.map((sponsor) => ({
      id: `sponsor-${sponsor.id}`,
      date: gameState.currentDate,
      description: sponsor.name,
      category: 'Sponsorship',
      type: 'Income',
      amount: sponsor.monthlyValue,
      status: 'Active',
    })),
    ...Object.entries(gameState.travel.bookings).map(([tournamentId, booking]) => {
      const tournament = gameState.tournaments.find((event) => event.id === tournamentId)
      return {
        id: `travel-${tournamentId}`,
        date: tournament?.startDate ?? gameState.currentDate,
        description: `Travel · ${tournament?.location ?? 'Booked trip'}`,
        category: 'Travel',
        type: 'Expense',
        amount: -booking.totalCost,
        status: 'Booked',
      }
    }),
    ...gameState.maintenance.history.map((item) => ({
      id: item.id,
      date: item.date,
      description: item.service,
      category: 'Equipment',
      type: 'Expense',
      amount: -item.cost,
      status: item.result,
    })),
  ]
    .sort((left, right) => getDateValue(right.date) - getDateValue(left.date))
    .slice(0, 5)

  const upcomingExpenses = tournamentPlanner
    .map((item) => ({
      id: item.id,
      date: item.date,
      description: item.event,
      amount: item.entryCost + item.travelCost + item.hotelCost,
    }))
    .filter((item) => item.amount > 0)
    .sort((left, right) => getDateValue(left.date) - getDateValue(right.date))
    .slice(0, 3)

  const pendingExpensesTotal = upcomingExpenses.reduce((sum, item) => sum + item.amount, 0)
  const budgetGap = Math.max(0, pendingExpensesTotal - Math.max(0, currentMonthNet))
  const alertTitle = budgetGap > 0 ? 'Budget optimisation alert' : 'Finance position stable'
  const alertToneClass = budgetGap > 0 ? 'border-amber-600/30 bg-amber-600/10 text-amber-400' : 'border-green-600/30 bg-green-600/10 text-green-400'
  const financeActionMessage = {
    cashflow: 'Review income versus expense balance before locking in another event.',
    budget: budgetGap > 0 ? `You are projected to exceed your event budget by ${formatMoney(budgetGap)} this cycle.` : 'Current commitments remain within your monthly plan.',
    planner: pendingExpensesTotal > 0 ? `${upcomingExpenses.length} planned expense${upcomingExpenses.length === 1 ? '' : 's'} are still on the board for this cycle.` : 'No major upcoming expenses are currently queued.',
    cost: monthlyBurnRate > 0 ? `Monthly burn rate is ${formatMoney(monthlyBurnRate)} at the current pace.` : 'Spending is currently under control with no live monthly burn.',
  }[financeAction]

  return (
    <div className="-m-6 flex h-[calc(100vh-5.5rem)] min-h-0 flex-col gap-2 overflow-hidden p-1.5">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface/85 px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-white">Finance Dashboard</h1>
          <p className="mt-1 truncate text-xs text-gray-400">Track your financial health and budget performance for the team.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn-secondary px-3 py-1.5 text-[11px]" onClick={() => setFinanceAction('cashflow')}><Download className="h-3.5 w-3.5" /> Export</button>
          <button type="button" className="btn-primary px-3 py-1.5 text-[11px]" onClick={() => navigate('/sponsorship')}><Plus className="h-3.5 w-3.5" /> Add Funds</button>
        </div>
      </div>

      <div className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${alertToneClass}`}>
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold">{alertTitle}</p>
          <p className="truncate text-[10px] text-gray-300">{financeActionMessage}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="card min-h-0 p-3">
          <div className="flex items-center gap-2"><Wallet className="h-3.5 w-3.5 text-green-400" /><p className="metric-label">Current Balance</p></div>
          <p className="mt-2 truncate text-3xl font-bold text-white">{formatMoney(gameState.player.cash)}</p>
          <p className="mt-1 text-[10px] text-gray-400">Available funds</p>
        </div>
        <div className="card min-h-0 p-3">
          <div className="flex items-center gap-2"><Coins className="h-3.5 w-3.5 text-green-400" /><p className="metric-label">Monthly Cash Flow</p></div>
          <p className={`mt-2 truncate text-3xl font-bold ${currentMonthNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatSignedMoney(currentMonthNet)}</p>
          <p className="mt-1 text-[10px] text-gray-400">vs current month mix</p>
        </div>
        <div className="card min-h-0 p-3">
          <div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-green-400" /><p className="metric-label">Projected Month End</p></div>
          <p className={`mt-2 truncate text-3xl font-bold ${projectedMonthEnd >= 0 ? 'text-green-400' : 'text-red-400'}`}>{projectedMonthEnd >= 0 ? '+' : '-'}{formatMoney(Math.abs(projectedMonthEnd))}</p>
          <p className="mt-1 text-[10px] text-gray-400">Based on current trend</p>
        </div>
        <div className="card min-h-0 p-3">
          <div className="flex items-center gap-2"><Receipt className="h-3.5 w-3.5 text-green-400" /><p className="metric-label">Pending Expenses</p></div>
          <p className={`mt-2 truncate text-3xl font-bold ${pendingExpensesTotal > 0 ? 'text-red-400' : 'text-white'}`}>{formatMoney(pendingExpensesTotal)}</p>
          <p className="mt-1 text-[10px] text-gray-400">{pendingExpensesTotal > 0 ? `${upcomingExpenses.length} scheduled cost items` : 'No pending expenses'}</p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[0.98fr_0.72fr_0.9fr_0.56fr] gap-2">
        <div className="card min-h-0 flex h-full flex-col overflow-hidden">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-white">Income vs Expenses (This Month)</h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-green-400">Income: {formatMoney(currentMonthIncome)}</span>
              <span className="text-red-400">Expenses: {formatMoney(currentMonthExpenses)}</span>
              <span className={currentMonthNet >= 0 ? 'text-green-400' : 'text-red-400'}>Net: {formatSignedMoney(currentMonthNet)}</span>
            </div>
          </div>
          <div className="card-body h-full min-h-0 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#203449" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} formatter={(value) => formatMoney(Number(value ?? 0))} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {monthlyComparisonData.map((entry) => <Cell key={entry.label} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-2 gap-2">
          {[{ title: 'Income Breakdown (This Month)', items: incomeBreakdown, total: currentMonthIncome, colors: incomeColors }, { title: 'Expense Breakdown (This Month)', items: expenseBreakdown, total: currentMonthExpenses, colors: expenseColors }].map((group) => (
            <div key={group.title} className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">{group.title}</h3></div>
              <div className="card-body grid h-full min-h-0 grid-cols-[0.95fr_0.7fr_1.1fr] gap-3 p-3">
                <div className="flex min-h-0 flex-col justify-center">
                  <p className="text-3xl font-bold text-white">{formatMoney(group.total)}</p>
                  <p className="mt-1 text-[10px] text-gray-400">Total {group.title.startsWith('Income') ? 'income' : 'expenses'}</p>
                </div>
                <div className="min-h-0">
                  {group.items.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={group.items} dataKey="value" nameKey="label" innerRadius={28} outerRadius={44} paddingAngle={2} stroke="none">
                          {group.items.map((item, index) => <Cell key={item.label} fill={group.colors[index % group.colors.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} formatter={(value) => formatMoney(Number(value ?? 0))} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
                <div className="space-y-2 overflow-auto pr-1 scrollbar-thin">
                  {group.items.map((item, index) => (
                    <div key={item.label} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 text-[10px]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.colors[index % group.colors.length] }} />
                      <span className="truncate text-gray-300">{item.label}</span>
                      <span className="whitespace-nowrap text-white">{formatMoney(item.value)}</span>
                      <span className="whitespace-nowrap text-gray-500">{item.share}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid min-h-0 grid-cols-12 gap-2">
          <div className="col-span-4 card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Recent Transactions</h3></div>
            <div className="card-body min-h-0 flex-1 overflow-auto p-0 scrollbar-thin">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 z-10 bg-surface">
                  <tr className="border-b border-border bg-surface-light/50 text-gray-500">
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="px-3 py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border/50">
                      <td className="px-3 py-2 text-gray-400">{formatCompactDate(transaction.date)}</td>
                      <td className="px-3 py-2">
                        <p className="truncate text-white">{transaction.description}</p>
                        <p className="truncate text-[9px] text-gray-500">{transaction.category}</p>
                      </td>
                      <td className={transaction.type === 'Income' ? 'px-3 py-2 text-green-400' : 'px-3 py-2 text-red-400'}>{transaction.type}</td>
                      <td className={`px-3 py-2 text-right font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatSignedMoney(transaction.amount)}</td>
                      <td className="px-3 py-2 text-right"><span className={statusPillClass(transaction.status)}>{transaction.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-span-4 card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Monthly Budget Overview</h3></div>
            <div className="card-body flex h-full min-h-0 flex-col justify-between gap-2 p-3">
              <div className="grid grid-cols-[1.1fr_0.55fr_0.55fr_0.55fr] gap-2 text-[9px] uppercase tracking-[0.16em] text-gray-500">
                <span>Category</span>
                <span className="text-right">Budget</span>
                <span className="text-right">Spent</span>
                <span className="text-right">Remaining</span>
              </div>
              <div className="flex-1 space-y-2 overflow-auto pr-1 scrollbar-thin">
                {budgetAllocation.map((item) => {
                  const budgetLimit = Math.max(item.amount, Math.round((planningBudget * item.max) / 100))
                  const remaining = budgetLimit - item.amount

                  return (
                    <div key={item.label} className="rounded-lg bg-surface-light/45 p-2">
                      <div className="grid grid-cols-[1.1fr_0.55fr_0.55fr_0.55fr] items-center gap-2 text-[10px]">
                        <span className="truncate text-white">{item.label}</span>
                        <span className="text-right text-gray-400">{formatMoney(budgetLimit)}</span>
                        <span className="text-right text-white">{formatMoney(item.amount)}</span>
                        <span className={`text-right ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatMoney(remaining)}</span>
                      </div>
                      <div className="mt-2"><ProgressBar value={item.current} max={item.max} compact /></div>
                    </div>
                  )
                })}
              </div>
              <button type="button" className="btn-secondary w-full justify-center py-2 text-[11px]" onClick={() => setFinanceAction('budget')}>Manage Budget</button>
            </div>
          </div>

          <div className="col-span-4 card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Upcoming Expenses</h3></div>
            <div className="card-body flex h-full min-h-0 flex-col justify-between gap-2 p-3">
              <div className="space-y-2 overflow-auto pr-1 scrollbar-thin">
                {upcomingExpenses.length > 0 ? upcomingExpenses.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-surface-light/45 p-2.5 text-[10px]">
                    <div className="min-w-0">
                      <p className="text-gray-400">{formatCompactDate(item.date)}</p>
                      <p className="mt-1 truncate text-white">{item.description}</p>
                    </div>
                    <span className="shrink-0 font-semibold text-red-400">-{formatMoney(item.amount)}</span>
                  </div>
                )) : <div className="rounded-lg bg-surface-light/45 p-3 text-xs text-gray-400">No upcoming expenses queued.</div>}
              </div>
              <button type="button" className="btn-secondary w-full justify-center py-2 text-[11px]" onClick={() => navigate('/calendar')}>View All Upcoming</button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-12 gap-2">
          <div className="col-span-2 card min-h-0 p-3">
            <p className="metric-label">Year To Date Income</p>
            <p className="mt-2 truncate text-2xl font-bold text-white">{formatMoney(ytdIncome)}</p>
            <p className="mt-1 text-[10px] text-green-400">Prize money plus sponsor flow</p>
          </div>
          <div className="col-span-2 card min-h-0 p-3">
            <p className="metric-label">Year To Date Expenses</p>
            <p className="mt-2 truncate text-2xl font-bold text-white">{formatMoney(ytdExpenses)}</p>
            <p className="mt-1 text-[10px] text-red-400">Coaching, travel, and equipment</p>
          </div>
          <div className="col-span-2 card min-h-0 p-3">
            <p className="metric-label">Net Profit (YTD)</p>
            <p className={`mt-2 truncate text-2xl font-bold ${ytdNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatSignedMoney(ytdNet)}</p>
            <p className="mt-1 text-[10px] text-gray-400">Current season position</p>
          </div>
          <div className="col-span-2 card min-h-0 p-3">
            <div className="flex items-center gap-2"><PiggyBank className="h-3.5 w-3.5 text-green-400" /><p className="metric-label">Savings Goal Progress</p></div>
            <p className="mt-2 text-2xl font-bold text-white">{savingsProgress}%</p>
            <div className="mt-2"><ProgressBar value={savingsProgress} compact /></div>
            <p className="mt-1 text-[10px] text-gray-400">{formatMoney(gameState.player.cash)} / {formatMoney(savingsTarget)}</p>
          </div>
          <div className="col-span-4 card min-h-0 p-3">
            <div className="flex items-center gap-2"><Landmark className="h-3.5 w-3.5 text-green-400" /><p className="metric-label">Quick Actions</p></div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              <button type="button" className="btn-secondary justify-center px-2 py-2 text-[10px]" onClick={() => navigate('/sponsorship')}><Coins className="h-3.5 w-3.5" /> Add Income</button>
              <button type="button" className="btn-secondary justify-center px-2 py-2 text-[10px]" onClick={() => setFinanceAction('cost')}><TrendingDown className="h-3.5 w-3.5" /> Add Expense</button>
              <button type="button" className="btn-secondary justify-center px-2 py-2 text-[10px]" onClick={() => setFinanceAction('budget')}><Wallet className="h-3.5 w-3.5" /> Transfer Funds</button>
              <button type="button" className="btn-secondary justify-center px-2 py-2 text-[10px]" onClick={() => navigate('/calendar')}><CalendarDays className="h-3.5 w-3.5" /> View Reports</button>
            </div>
            <p className="mt-2 truncate text-[10px] text-gray-400">{financialIndicators.stability.status}</p>
          </div>
        </div>
      </div>
    </div>
  )
}