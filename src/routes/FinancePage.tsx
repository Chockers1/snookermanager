import { careerBudget, nextClubWorkDate } from '../game/careerBudget';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coins,
  Download,
  Plus,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
} from "recharts";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import { buildFinanceData } from "../utils/liveRouteData";
import { formatMoney } from "../utils/formatters";

function formatSignedMoney(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`;
}

function formatCompactDate(dateValue: string) {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return dateValue;
  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function getDateValue(dateValue: string) {
  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function statusPillClass(status: string) {
  if (/complete|active/i.test(status))
    return "rounded bg-green-600/20 px-2 py-1 text-[10px] font-medium text-green-300";
  if (/pending|booked/i.test(status))
    return "rounded bg-amber-600/20 px-2 py-1 text-[10px] font-medium text-amber-300";
  return "rounded bg-surface-light/70 px-2 py-1 text-[10px] font-medium text-gray-300";
}

const incomeColors = ["#22c55e", "#16a34a", "#3b82f6", "#38bdf8"];
const expenseColors = ["#ef4444", "#f97316", "#fbbf24", "#64748b"];

export function FinancePage() {
  const { gameState, updateBudgetTargets, actOnCareer } = useGame();
  const budget = careerBudget(gameState);
  const workDate = nextClubWorkDate(gameState);
  const navigate = useNavigate();
  const {
    incomeBreakdown,
    expenseBreakdown,
    budgetAllocation,
    tournamentPlanner,
    forecastCards,
  } = buildFinanceData(gameState);
  const [budgetEditorOpen, setBudgetEditorOpen] = useState(false);
  const [budgetTargets, setBudgetTargets] = useState<Record<string, number>>(
    () => ({ ...gameState.finance.budgetTargets }),
  );

  const sponsorMonthlyIncome = gameState.sponsors.reduce(
    (sum, sponsor) => sum + sponsor.monthlyValue,
    0,
  );
  const sponsorWeeklyIncome = Math.round(sponsorMonthlyIncome / 4);
  const coachWeeklyCost = gameState.coachContracts.reduce(
    (sum, contract) => sum + contract.weeklyCost,
    0,
  );
  const travelSpend = Object.values(gameState.travel.bookings).reduce(
    (sum, booking) => sum + booking.totalCost,
    0,
  );
  const equipmentSpend = gameState.maintenance.history.reduce(
    (sum, item) => sum + item.cost,
    0,
  );
  const recordedExpenseSpend = gameState.finance.ledger.reduce(
    (sum, item) => sum + (item.type === "Expense" ? Math.abs(item.amount) : 0),
    0,
  );
  const prizeIncome = gameState.matches.reduce(
    (sum, match) => sum + match.prizeMoneyEarned,
    0,
  );
  const currentMonthIncome = incomeBreakdown.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const currentMonthExpenses = expenseBreakdown.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const currentMonthNet = currentMonthIncome - currentMonthExpenses;
  const projectedMonthEnd =
    forecastCards[0]?.projectedBalance ??
    gameState.player.cash + currentMonthNet;
  const planningBudget = Math.max(
    currentMonthExpenses,
    budgetAllocation.reduce((sum, item) => sum + item.amount, 0),
    1,
  );
  const weeksElapsed = Math.max(1, gameState.week);
  const ytdIncome =
    prizeIncome +
    sponsorWeeklyIncome * weeksElapsed +
    Math.max(0, gameState.finance.baseCashFlow) * weeksElapsed;
  const ytdExpenses =
    coachWeeklyCost * weeksElapsed +
    travelSpend +
    equipmentSpend +
    recordedExpenseSpend +
    Math.max(0, -gameState.finance.baseCashFlow) * weeksElapsed;
  const ytdNet = ytdIncome - ytdExpenses;

  const monthlyComparisonData = [
    { label: "Income", value: currentMonthIncome, fill: "#22c55e" },
    { label: "Expenses", value: currentMonthExpenses, fill: "#ef4444" },
  ];

  const recentTransactions = [
    ...gameState.finance.ledger.map((transaction) => ({
      ...transaction,
      status: "Completed",
    })),
    ...gameState.matches
      .filter((match) => match.prizeMoneyEarned > 0)
      .map((match) => {
        const tournament = gameState.tournaments.find(
          (event) => event.id === match.tournamentId,
        );
        return {
          id: `match-${match.id}`,
          date:
            match.playedOn ?? tournament?.startDate ?? gameState.currentDate,
          description: `${tournament?.name ?? match.round} Prize`,
          category: "Prize Money",
          type: "Income",
          amount: match.prizeMoneyEarned,
          status: "Completed",
        };
      }),
    ...gameState.sponsors.map((sponsor) => ({
      id: `sponsor-${sponsor.id}`,
      date: gameState.currentDate,
      description: sponsor.name,
      category: "Sponsorship",
      type: "Income",
      amount: sponsor.monthlyValue,
      status: "Active",
    })),
    ...Object.entries(gameState.travel.bookings).map(
      ([tournamentId, booking]) => {
        const tournament = gameState.tournaments.find(
          (event) => event.id === tournamentId,
        );
        return {
          id: `travel-${tournamentId}`,
          date: tournament?.startDate ?? gameState.currentDate,
          description: `Travel · ${tournament?.location ?? "Booked trip"}`,
          category: "Travel",
          type: "Expense",
          amount: -booking.totalCost,
          status: "Booked",
        };
      },
    ),
    ...gameState.maintenance.history.map((item) => ({
      id: item.id,
      date: item.date,
      description: item.service,
      category: "Equipment",
      type: "Expense",
      amount: -item.cost,
      status: item.result,
    })),
  ]
    .sort((left, right) => getDateValue(right.date) - getDateValue(left.date))
    .slice(0, 5);

  const upcomingExpenses = tournamentPlanner
    .map((item) => ({
      id: item.id,
      date: item.date,
      description: item.event,
      amount: item.entryCost + item.travelCost + item.hotelCost,
    }))
    .filter((item) => item.amount > 0)
    .sort((left, right) => getDateValue(left.date) - getDateValue(right.date))
    .slice(0, 3);

  const pendingExpensesTotal = upcomingExpenses.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  function getBudgetLimit(label: string, amount: number, maximumShare: number) {
    return (
      budgetTargets[label] ??
      Math.max(amount, Math.round((planningBudget * maximumShare) / 100))
    );
  }

  function saveBudgetTargets() {
    updateBudgetTargets(budgetTargets);
    setBudgetEditorOpen(false);
  }

  function exportFinanceReport() {
    const rows = [
      ["Snooker Manager Finance Report"],
      ["Date", gameState.currentDate],
      ["Current balance", gameState.player.cash],
      ["Monthly income", currentMonthIncome],
      ["Monthly expenses", currentMonthExpenses],
      ["Monthly net", currentMonthNet],
      [],
      [
        "Transaction date",
        "Description",
        "Category",
        "Type",
        "Amount",
        "Status",
      ],
      ...recentTransactions.map((transaction) => [
        transaction.date,
        transaction.description,
        transaction.category,
        transaction.type,
        transaction.amount,
        transaction.status,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `snooker-finance-${gameState.currentDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-full min-w-0 flex-col gap-3 pb-6 xl:-m-6 xl:p-2">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface/85 px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-white">
            Finance Dashboard
          </h1>
          <p className="mt-1 truncate text-xs text-gray-400">
            Track your financial health and budget performance for the team.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-[11px]"
            onClick={exportFinanceReport}
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button
            type="button"
            className="btn-primary px-3 py-1.5 text-[11px]"
            onClick={() => navigate("/sponsorship")}
          >
            <Plus className="h-3.5 w-3.5" /> Add Funds
          </button>
        </div>
      </div>

      <div className={"card flex flex-wrap items-center justify-between gap-3 p-3 " + (budget.warning ? "border-amber-500/50" : "")}>
        <div className="min-w-0 text-sm"><p className="font-semibold text-white">{budget.warning ? 'Cash needs attention' : 'Career cash outlook'}</p><p className="text-gray-400">Four-week projection {formatMoney(budget.projected)}{budget.runway !== null ? ' · ' + budget.runway + ' weeks of funds at current spending' : ''}. Club work pays £120 for one reserved day, once per week.</p></div>
        <button className="btn-secondary shrink-0 px-3 py-2" disabled={!workDate} onClick={() => workDate && actOnCareer({type:'commitment',kind:'club-work',startDate:workDate})}>{workDate ? 'Book club work · '+workDate : 'No free work date in next 28 days'}</button>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="card min-h-0 p-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-green-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Current Balance
            </p>
          </div>
          <p className="mt-2 truncate text-3xl font-bold text-white">
            {formatMoney(gameState.player.cash)}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Available funds</p>
        </div>
        <div className="card min-h-0 p-3">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-green-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Monthly Cash Flow
            </p>
          </div>
          <p
            className={`mt-2 truncate text-3xl font-bold ${currentMonthNet >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            {formatSignedMoney(currentMonthNet)}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            Income less recorded expenses
          </p>
        </div>
        <div className="card min-h-0 p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Projected Month End
            </p>
          </div>
          <p
            className={`mt-2 truncate text-3xl font-bold ${projectedMonthEnd >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            {projectedMonthEnd >= 0 ? "+" : "-"}
            {formatMoney(Math.abs(projectedMonthEnd))}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            Based on current trend
          </p>
        </div>
        <div className="card min-h-0 p-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-green-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Pending Expenses
            </p>
          </div>
          <p
            className={`mt-2 truncate text-3xl font-bold ${pendingExpensesTotal > 0 ? "text-red-400" : "text-white"}`}
          >
            {formatMoney(pendingExpensesTotal)}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            {pendingExpensesTotal > 0
              ? `${upcomingExpenses.length} scheduled cost items`
              : "No pending expenses"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="card flex h-56 min-h-0 flex-col overflow-hidden sm:h-64">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-white">
              Income vs Expenses (This Month)
            </h3>
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px]">
              <span className="text-green-400">
                Income: {formatMoney(currentMonthIncome)}
              </span>
              <span className="text-red-400">
                Expenses: {formatMoney(currentMonthExpenses)}
              </span>
              <span
                className={
                  currentMonthNet >= 0 ? "text-green-400" : "text-red-400"
                }
              >
                Net: {formatSignedMoney(currentMonthNet)}
              </span>
            </div>
          </div>
          <div className="card-body h-full min-h-0 p-3">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              initialDimension={{ width: 1, height: 1 }}
            >
              <BarChart
                data={monthlyComparisonData}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#203449" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#141e2a",
                    border: "1px solid #1e2d3d",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(value) => formatMoney(Number(value ?? 0))}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {monthlyComparisonData.map((entry) => (
                    <Cell key={entry.label} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-2">
          {[
            {
              title: "Income Breakdown (This Month)",
              items: incomeBreakdown,
              total: currentMonthIncome,
              colors: incomeColors,
            },
            {
              title: "Expense Breakdown (This Month)",
              items: expenseBreakdown,
              total: currentMonthExpenses,
              colors: expenseColors,
            },
          ].map((group) => (
            <div
              key={group.title}
              className="card flex min-h-52 flex-col overflow-hidden"
            >
              <div className="card-header">
                <h3 className="text-sm font-semibold text-white">
                  {group.title}
                </h3>
              </div>
              <div className="card-body grid min-h-0 flex-1 grid-cols-[0.85fr_0.75fr_1.25fr] gap-4 p-4">
                <div className="flex min-h-0 flex-col justify-center">
                  <p className="text-3xl font-bold text-white">
                    {formatMoney(group.total)}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Total{" "}
                    {group.title.startsWith("Income") ? "income" : "expenses"}
                  </p>
                </div>
                <div className="min-h-0">
                  {group.items.length > 0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={0}
                      minHeight={0}
                      initialDimension={{ width: 1, height: 1 }}
                    >
                      <PieChart>
                        <Pie
                          data={group.items}
                          dataKey="value"
                          nameKey="label"
                          innerRadius={28}
                          outerRadius={44}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {group.items.map((item, index) => (
                            <Cell
                              key={item.label}
                              fill={group.colors[index % group.colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#141e2a",
                            border: "1px solid #1e2d3d",
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                          formatter={(value) => formatMoney(Number(value ?? 0))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
                <div className="space-y-2 overflow-auto pr-1 scrollbar-thin">
                  {group.items.map((item, index) => (
                    <div
                      key={item.label}
                      className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 text-[11px]"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            group.colors[index % group.colors.length],
                        }}
                      />
                      <span className="truncate text-gray-300">
                        {item.label}
                      </span>
                      <span className="whitespace-nowrap text-white">
                        {formatMoney(item.value)}
                      </span>
                      <span className="whitespace-nowrap text-gray-500">
                        {item.share}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="card flex min-h-72 flex-col overflow-hidden lg:col-span-5">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">
                Recent Transactions
              </h3>
            </div>
            <div className="card-body min-h-0 flex-1 overflow-auto p-0 scrollbar-thin">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 z-10 bg-surface">
                  <tr className="border-b border-border bg-surface-light/50 text-gray-500">
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Description
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="px-3 py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-border/50"
                    >
                      <td className="px-3 py-2 text-gray-400">
                        {formatCompactDate(transaction.date)}
                      </td>
                      <td className="px-3 py-2">
                        <p className="truncate text-white">
                          {transaction.description}
                        </p>
                        <p className="truncate text-[10px] text-gray-500">
                          {transaction.category}
                        </p>
                      </td>
                      <td
                        className={
                          transaction.type === "Income"
                            ? "px-3 py-2 text-green-400"
                            : "px-3 py-2 text-red-400"
                        }
                      >
                        {transaction.type}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-medium ${transaction.amount >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {formatSignedMoney(transaction.amount)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={statusPillClass(transaction.status)}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card flex min-h-72 flex-col overflow-hidden lg:col-span-4">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">
                Monthly Budget Overview
              </h3>
            </div>
            <div className="card-body flex h-full min-h-0 flex-col justify-between gap-2 p-3">
              <div className="grid grid-cols-[1.1fr_0.6fr_0.6fr_0.65fr] gap-2 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <span>Category</span>
                <span className="text-right">Budget</span>
                <span className="text-right">Spent</span>
                <span className="text-right">Remaining</span>
              </div>
              <div className="flex-1 space-y-2 overflow-auto pr-1 scrollbar-thin">
                {budgetAllocation.map((item) => {
                  const budgetLimit = getBudgetLimit(
                    item.label,
                    item.amount,
                    item.max,
                  );
                  const remaining = budgetLimit - item.amount;

                  return (
                    <div
                      key={item.label}
                      className="rounded-lg bg-surface-light/45 p-2"
                    >
                      <div className="grid grid-cols-[1.1fr_0.6fr_0.6fr_0.65fr] items-center gap-2 text-[11px]">
                        <span className="truncate text-white">
                          {item.label}
                        </span>
                        <span className="text-right text-gray-400">
                          {formatMoney(budgetLimit)}
                        </span>
                        <span className="text-right text-white">
                          {formatMoney(item.amount)}
                        </span>
                        <span
                          className={`text-right ${remaining >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {formatMoney(remaining)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <ProgressBar
                          value={item.current}
                          max={item.max}
                          compact
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className="btn-secondary w-full justify-center py-2 text-[11px]"
                onClick={() => setBudgetEditorOpen(true)}
              >
                Manage Budget
              </button>
            </div>
          </div>

          <div className="card flex min-h-72 flex-col overflow-hidden lg:col-span-3">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">
                Upcoming Expenses
              </h3>
            </div>
            <div className="card-body flex h-full min-h-0 flex-col justify-between gap-2 p-3">
              <div className="space-y-2 overflow-auto pr-1 scrollbar-thin">
                {upcomingExpenses.length > 0 ? (
                  upcomingExpenses.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-lg bg-surface-light/45 p-3 text-[11px]"
                    >
                      <div className="min-w-0">
                        <p className="text-gray-400">
                          {formatCompactDate(item.date)}
                        </p>
                        <p className="mt-1 truncate text-white">
                          {item.description}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold text-red-400">
                        -{formatMoney(item.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-surface-light/45 p-3 text-xs text-gray-400">
                    No upcoming expenses queued.
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn-secondary w-full justify-center py-2 text-[11px]"
                onClick={() => navigate("/calendar")}
              >
                View All Upcoming
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="card min-h-32 p-4">
            <p className="metric-label">Year To Date Income</p>
            <p className="mt-2 truncate text-2xl font-bold text-white">
              {formatMoney(ytdIncome)}
            </p>
            <p className="mt-1 text-[11px] text-green-400">
              Prize money plus sponsor flow
            </p>
          </div>
          <div className="card min-h-32 p-4">
            <p className="metric-label">Year To Date Expenses</p>
            <p className="mt-2 truncate text-2xl font-bold text-white">
              {formatMoney(ytdExpenses)}
            </p>
            <p className="mt-1 text-[11px] text-red-400">
              Coaching, travel, and equipment
            </p>
          </div>
          <div className="card min-h-32 p-4">
            <p className="metric-label">Net Profit (YTD)</p>
            <p
              className={`mt-2 truncate text-2xl font-bold ${ytdNet >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {formatSignedMoney(ytdNet)}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              Current season position
            </p>
          </div>
        </div>
      </div>

      {budgetEditorOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-editor-title"
        >
          <div className="card w-full max-w-lg p-5 shadow-2xl">
            <h2
              id="budget-editor-title"
              className="text-lg font-semibold text-white"
            >
              Monthly Budget Manager
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Move your planned funds between categories. This changes planning
              limits, not your cash balance.
            </p>
            <div className="mt-4 space-y-3">
              {budgetAllocation.map((item) => (
                <label
                  key={item.label}
                  className="grid grid-cols-[1fr_8rem] items-center gap-3 text-sm text-gray-300"
                >
                  <span>
                    {item.label}
                    <span className="ml-2 text-xs text-gray-500">
                      Spent {formatMoney(item.amount)}
                    </span>
                  </span>
                  <input
                    className="rounded border border-border bg-surface-light px-2 py-1.5 text-right text-white"
                    type="number"
                    min={item.amount}
                    step={100}
                    value={getBudgetLimit(item.label, item.amount, item.max)}
                    onChange={(event) =>
                      setBudgetTargets((current) => ({
                        ...current,
                        [item.label]: Math.max(
                          item.amount,
                          Number(event.target.value) || 0,
                        ),
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setBudgetEditorOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={saveBudgetTargets}
              >
                Save Allocation
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
