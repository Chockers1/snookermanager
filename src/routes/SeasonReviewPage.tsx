import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Brain,
  Crown,
  ChevronRight,
  Coins,
  Handshake,
  HeartPulse,
  Medal,
  Trophy,
  TrendingUp,
  UserMinus,
  UserPlus,
  Wallet,
} from "lucide-react";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import { buildSeasonReviewData } from "../utils/liveRouteData";
import { formatMoney } from "../utils/formatters";

function metricColor(label: string) {
  if (label === "Financial Result" || label === "Ranking Movement")
    return "text-green-400";
  if (label === "Fatigue") return "text-amber-400";
  return "text-white";
}

function getMetricIcon(label: string) {
  if (label === "Record") return Trophy;
  if (label === "Current Rank") return Medal;
  if (label === "Ranking Movement") return TrendingUp;
  if (label === "Prize Money") return Coins;
  if (label === "Financial Result") return Wallet;
  if (label === "Confidence") return Brain;
  if (label === "Fatigue") return HeartPulse;
  return Handshake;
}

export function SeasonReviewPage() {
  const { gameState, continueWeek, startNextSeason } = useGame();
  const navigate = useNavigate();
  const transition = gameState.seasonReview;

  if (transition?.pending) {
    const record = transition.completedSeason;
    const rankingMovement = record.openingRanking - record.closingRanking;
    const worldNumberOne = transition.worldNumberOne;
    const worldLists = [
      {
        title: "Promoted & Tour Cards",
        icon: UserPlus,
        items: transition.promotedPlayers,
        empty: "No new tour-card awards recorded.",
        tone: "text-green-400",
      },
      {
        title: "Tour Card Losses",
        icon: UserMinus,
        items: transition.cardLosses,
        empty: "No tour-card losses recorded.",
        tone: "text-amber-400",
      },
      {
        title: "Retirements",
        icon: UserMinus,
        items: transition.retirements,
        empty: "No retirements recorded.",
        tone: "text-red-400",
      },
      {
        title: "New Names to Watch",
        icon: UserPlus,
        items: transition.newcomers,
        empty: "No new intake recorded.",
        tone: "text-sky-400",
      },
    ];

    return (
      <div className="space-y-4 pb-24">
        <header className="flex flex-col gap-3 rounded-xl border border-border bg-surface/85 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400">Season complete</p>
            <h1 className="mt-1 text-2xl font-bold text-white">{record.season} End of Season Report</h1>
            <p className="mt-1 text-sm text-gray-400">Review your career decision and the major changes across the snooker world.</p>
          </div>
          <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">Review required</span>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="card overflow-hidden border-green-500/40 bg-gradient-to-r from-green-600/10 via-surface to-surface p-4">
            <div className="flex items-start justify-between gap-4"><div><p className="metric-label">Your Season</p><h2 className="mt-1 text-xl font-semibold text-white">{gameState.player.fullName}</h2></div><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-green-500 text-xl font-bold text-green-400">{record.titles > 1 ? 'A' : record.wins > record.losses ? 'B' : 'C'}</div></div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg bg-background/40 p-3"><p className="metric-label">Final Rank</p><p className="mt-1 text-lg font-bold text-white">#{record.closingRanking}</p><p className={rankingMovement >= 0 ? "text-xs text-green-400" : "text-xs text-red-400"}>{rankingMovement === 0 ? 'No change' : `${rankingMovement > 0 ? 'Up' : 'Down'} ${Math.abs(rankingMovement)}`}</p></div>
              <div className="rounded-lg bg-background/40 p-3"><p className="metric-label">Record</p><p className="mt-1 text-lg font-bold text-white">{record.wins}-{record.losses}</p><p className="text-xs text-gray-400">{record.matchesPlayed} matches</p></div>
              <div className="rounded-lg bg-background/40 p-3"><p className="metric-label">Titles</p><p className="mt-1 text-lg font-bold text-white">{record.titles}</p><p className="truncate text-xs text-gray-400">{record.bestResult}</p></div>
              <div className="rounded-lg bg-background/40 p-3"><p className="metric-label">Financial Change</p><p className={`mt-1 text-lg font-bold ${transition.financialChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>{transition.financialChange >= 0 ? '+' : ''}{formatMoney(transition.financialChange)}</p><p className="text-xs text-gray-400">{formatMoney(record.prizeMoney)} prize</p></div>
            </div>
          </div>

          <div className="card border-amber-500/30 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">Career Status Decision</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{transition.careerDecision.title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">{transition.careerDecision.detail}</p>
            <div className="mt-4 rounded-lg border border-border bg-background/40 p-3"><p className="metric-label">Next-season expectation</p><p className="mt-1 text-xs leading-5 text-gray-300">{transition.careerDecision.expectation}</p></div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_18rem]">
          <div className="card overflow-hidden"><div className="card-header"><h2 className="text-sm font-semibold text-white">Major Tournament Winners</h2></div><div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">{transition.majorWinners.length ? transition.majorWinners.map((headline) => <div key={headline.tournamentName} className="bg-surface p-4"><p className="truncate text-[10px] font-semibold uppercase text-amber-400">{headline.tournamentName}</p><p className={`mt-2 truncate font-semibold ${headline.playerWon ? 'text-green-400' : 'text-white'}`}>{headline.winner}</p><p className="mt-1 text-[10px] text-gray-500">Season champion</p></div>) : <p className="col-span-full bg-surface p-6 text-center text-sm text-gray-400">No major tournament winners were recorded.</p>}</div></div>
          <div className="card p-5 text-center"><Crown className="mx-auto h-8 w-8 text-amber-400" /><p className="mt-2 metric-label">World Number One</p><p className="mt-2 text-xl font-bold text-white">{worldNumberOne?.playerName ?? 'Not recorded'}</p>{worldNumberOne ? <><p className="text-xs text-gray-400">{worldNumberOne.nation}</p><p className="mt-3 text-xs text-green-400">{worldNumberOne.titles} titles · {worldNumberOne.wins}-{worldNumberOne.losses}</p></> : null}</div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{worldLists.map((group) => { const Icon = group.icon; return <div key={group.title} className="card p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Icon className={`h-4 w-4 ${group.tone}`} />{group.title}</h3><ul className="mt-3 space-y-2 text-xs text-gray-300">{group.items.length ? group.items.map((item) => <li key={item} className="rounded bg-surface-light/50 px-3 py-2">{item}</li>) : <li className="text-gray-500">{group.empty}</li>}</ul></div> })}</section>

        <div className="fixed inset-x-0 bottom-8 z-20 border-t border-green-500/30 bg-sidebar/95 p-3 shadow-2xl backdrop-blur lg:left-52"><div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-white">Ready for {transition.nextSeason}?</p><p className="text-xs text-gray-400">Starting unlocks the new calendar and sends your first eligible event invitation.</p></div><button type="button" className="btn-primary min-h-11 justify-center px-5 text-sm" onClick={() => { startNextSeason(); navigate('/') }}>Start New Season <ChevronRight className="h-4 w-4" /></button></div></div>
      </div>
    );
  }
  const seasonData = buildSeasonReviewData(gameState);
  const currentCoach = gameState.coaches.find(
    (coach) => coach.id === gameState.currentCoachId,
  );
  const currentSeasonMatches = gameState.history.matchLog.filter(
    (match) => match.season === gameState.season,
  );
  const currentSeasonEvents = gameState.history.tournamentHistory.filter(
    (event) => event.season === gameState.season,
  );
  const totalPrizeMoney = currentSeasonMatches.reduce(
    (sum, match) => sum + match.prizeMoney,
    0,
  );
  const sponsorIncome = gameState.sponsors.reduce(
    (sum, sponsor) => sum + sponsor.monthlyValue,
    0,
  );
  const totalIncome = totalPrizeMoney + sponsorIncome;
  const totalExpenses = -Math.max(
    0,
    (gameState.finance.baseCashFlow - gameState.finance.cashFlow) *
      gameState.week,
  );
  const netProfit = totalIncome + totalExpenses;
  const winCount = currentSeasonMatches.filter(
    (match) => match.result === "Won",
  ).length;
  const lossCount = currentSeasonMatches.filter(
    (match) => match.result === "Lost",
  ).length;
  const playerRank = gameState.rankings.find(
    (row) => row.playerName === gameState.player.fullName,
  );
  const historySnapshots = gameState.history.snapshots.length
    ? gameState.history.snapshots.filter(
        (snapshot) => snapshot.season === gameState.season,
      )
    : [
        {
          label: "Current",
          season: gameState.season,
          week: gameState.week,
          date: gameState.currentDate,
          ranking: playerRank?.ranking ?? 0,
          cash: gameState.player.cash,
          confidence: gameState.player.confidence,
          fatigue: gameState.player.fatigue,
          morale: gameState.player.morale,
          reputation: gameState.player.reputation,
          sponsorCount: gameState.sponsors.length,
          matchesPlayed: currentSeasonMatches.length,
          wins: winCount,
          losses: lossCount,
          totalPrizeMoney,
        },
      ];
  const seasonHistory = historySnapshots.slice(-8);
  const rankingMovementData = seasonHistory.map((snapshot) => ({
    label: `W${snapshot.week}`,
    value: snapshot.ranking || (playerRank?.ranking ?? 0),
  }));
  const prizeMoneyByEvent = currentSeasonEvents.length
    ? currentSeasonEvents
        .slice(0, 7)
        .reverse()
        .map((event) => ({
          label:
            event.tournamentName.length > 12
              ? `${event.tournamentName.slice(0, 12)}...`
              : event.tournamentName,
          value: event.prizeMoney,
        }))
    : currentSeasonMatches
        .slice(0, 7)
        .reverse()
        .map((match) => ({
          label:
            match.tournamentName.length > 12
              ? `${match.tournamentName.slice(0, 12)}...`
              : match.tournamentName,
          value: match.prizeMoney,
        }));
  const currentSeasonSnapshot = {
    season: gameState.season,
    record: `${winCount}-${lossCount}`,
    titles: currentSeasonEvents.filter((event) => event.result === "Winner")
      .length,
    prizeMoney: totalPrizeMoney,
    bestResult: currentSeasonEvents.some((event) => event.result === "Winner")
      ? "Winner"
      : (currentSeasonEvents[0]?.result ?? "No deep run yet"),
    note: currentSeasonEvents.some((event) => event.result === "Winner")
      ? "Silverware is now setting the tone for the next campaign."
      : currentSeasonEvents.length > 0
        ? "A platform is in place for stronger deep runs next season."
        : "Plenty of opportunities in the new season.",
  };
  const metrics = [
    {
      label: "Record",
      value: `${winCount}-${lossCount}`,
      sub: "Live save results",
    },
    {
      label: "Current Rank",
      value: `#${playerRank?.ranking ?? "-"}`,
      sub: gameState.player.rankingLabel,
    },
    {
      label: "Ranking Movement",
      value: playerRank?.movement
        ? `${playerRank.movement > 0 ? "+" : ""}${playerRank.movement}`
        : "0",
      sub: "Current table movement",
    },
    {
      label: "Prize Money",
      value: formatMoney(totalPrizeMoney),
      sub: "Season earnings",
    },
    {
      label: "Financial Result",
      value: formatMoney(netProfit),
      sub: netProfit >= 0 ? "Profit" : "Deficit",
    },
    {
      label: "Confidence",
      value: `${gameState.player.confidence}%`,
      sub: "Mental edge",
    },
    {
      label: "Fatigue",
      value: `${gameState.player.fatigue}%`,
      sub: "Recovery pressure",
    },
    {
      label: "Sponsors",
      value: `${gameState.sponsors.length}`,
      sub: "Commercial deals",
    },
  ];
  const highlights = currentSeasonEvents.length
    ? currentSeasonEvents
        .slice(0, 4)
        .map(
          (event) =>
            `${event.result} at ${event.tournamentName}${event.rounds.length ? ` (${event.rounds.at(-1)})` : ""}`,
        )
    : currentSeasonMatches
        .slice(0, 4)
        .map(
          (match) =>
            `${match.result} vs ${match.opponentName} in ${match.tournamentName} (${match.score})`,
        );

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:-m-6 xl:h-[calc(100vh-5.5rem)] xl:gap-2 xl:overflow-hidden xl:p-1.5">
      <div className="rounded-xl border border-border bg-surface/85 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-white">
              End of Season Review
            </h1>
            <p className="mt-1 truncate text-xs text-gray-400">
              Season {gameState.season} review for {gameState.player.fullName}.
            </p>
          </div>
          <div className="card flex shrink-0 items-center gap-3 px-4 py-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-500 bg-green-600/20">
              <span className="text-lg font-bold text-green-400">
                {seasonData.grade.grade}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">
                Season Grade
              </p>
              <p className="text-xs text-gray-400">
                {seasonData.panels.verdict.summary}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2">
        {metrics.map((metric) => {
          const Icon = getMetricIcon(metric.label);

          return (
            <div key={metric.label} className="card min-h-0 px-3 py-2.5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-light/50">
                  <Icon className={`h-4 w-4 ${metricColor(metric.label)}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                    {metric.label}
                  </p>
                  <p
                    className={`mt-1 text-lg font-bold ${metricColor(metric.label)}`}
                  >
                    {metric.value}
                  </p>
                  <p className="text-[10px] text-gray-400">{metric.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12 xl:grid-rows-[0.37fr_0.33fr_0.3fr] xl:gap-2">
        <div className="card flex min-h-64 flex-col overflow-hidden xl:col-span-6 xl:min-h-0">
          <div className="card-header px-3 py-2">
            <h3 className="text-sm font-semibold text-white">
              Ranking Movement Over Season
            </h3>
          </div>
          <div className="card-body h-full min-h-0 px-2 py-2">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              initialDimension={{ width: 1, height: 1 }}
            >
              <LineChart data={rankingMovementData}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  reversed
                  tick={{ fontSize: 9, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={26}
                />
                <Tooltip
                  contentStyle={{
                    background: "#141e2a",
                    border: "1px solid #1e2d3d",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: "#22c55e", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card flex min-h-64 flex-col overflow-hidden xl:col-span-6 xl:min-h-0">
          <div className="card-header px-3 py-2">
            <h3 className="text-sm font-semibold text-white">
              Prize Money Earned by Event
            </h3>
          </div>
          <div className="card-body h-full min-h-0 px-2 py-2">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              initialDimension={{ width: 1, height: 1 }}
            >
              <BarChart data={prizeMoneyByEvent}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "#141e2a",
                    border: "1px solid #1e2d3d",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3 xl:col-span-4">
          <div className="grid grid-cols-3 gap-2 border-b border-border pb-3">
            <div className="rounded-lg bg-surface-light/50 px-2.5 py-2 text-center">
              <p className="text-[10px] uppercase text-gray-500">Coach Grade</p>
              <p className="mt-1 text-xl font-bold text-green-400">
                {seasonData.panels.coachGrade.grade}
              </p>
              <p className="text-[10px] text-gray-400">
                {seasonData.panels.coachGrade.detail}
              </p>
            </div>
            <div className="rounded-lg bg-surface-light/50 px-2.5 py-2 text-center">
              <p className="text-[10px] uppercase text-gray-500">
                Sponsor Grade
              </p>
              <p className="mt-1 text-xl font-bold text-green-400">
                {seasonData.panels.sponsorGrade.grade}
              </p>
              <p className="text-[10px] text-gray-400">
                {seasonData.panels.sponsorGrade.detail}
              </p>
            </div>
            <div className="rounded-lg bg-surface-light/50 px-2.5 py-2 text-center">
              <p className="text-[10px] uppercase text-gray-500">Fan Growth</p>
              <p className="mt-1 text-xl font-bold text-green-400">
                {seasonData.panels.fanGrowth.growth}
              </p>
              <p className="text-[10px] text-gray-400">
                {seasonData.panels.fanGrowth.fans} fans
              </p>
            </div>
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-auto scrollbar-thin">
            <h3 className="mb-2 text-xs font-semibold text-white">
              Attribute Growth
            </h3>
            <div className="space-y-2">
              {seasonData.attributeGrowth.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-green-400">+{item.value}</span>
                  </div>
                  <ProgressBar value={(item.value / 3) * 100} compact />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3 xl:col-span-4">
          <h3 className="mb-2 text-xs font-semibold text-white">
            Season Highlights
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Matches Played</span>
              <p className="font-medium text-white">
                {currentSeasonMatches.length}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Matches Won</span>
              <p className="font-medium text-white">{winCount}</p>
            </div>
            <div>
              <span className="text-gray-400">Tournaments Logged</span>
              <p className="font-medium text-white">
                {currentSeasonEvents.length}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Titles</span>
              <p className="font-medium text-white">
                {
                  currentSeasonEvents.filter(
                    (event) => event.result === "Winner",
                  ).length
                }
              </p>
            </div>
          </div>
          <div className="mt-2 border-t border-border pt-2">
            <p className="mb-1 text-[10px] font-semibold uppercase text-gray-500">
              Notable Results
            </p>
            <ul className="min-h-0 space-y-1 overflow-auto text-xs text-green-400 scrollbar-thin">
              {highlights.length ? (
                highlights.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>No notable results logged yet.</li>
              )}
            </ul>
          </div>
        </div>
        <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3 xl:col-span-4">
          <h3 className="mb-2 text-xs font-semibold text-white">
            Financial Summary
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Prize Money</span>
              <span className="text-white">{formatMoney(totalPrizeMoney)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sponsorship Income</span>
              <span className="text-white">{formatMoney(sponsorIncome)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-medium text-gray-400">Total Income</span>
              <span className="font-medium text-white">
                {formatMoney(totalIncome)}
              </span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-gray-400">Costs Exposure</span>
              <span className="text-red-400">{formatMoney(totalExpenses)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span className="text-white">NET PROFIT</span>
              <span
                className={netProfit >= 0 ? "text-green-400" : "text-red-400"}
              >
                {formatMoney(netProfit)}
              </span>
            </div>
          </div>
        </div>

        <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3 xl:col-span-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-light text-sm font-bold text-green-400">
              {currentCoach?.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2) ?? "ST"}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-white">Coach Review</h3>
              <p className="mt-2 line-clamp-4 text-xs italic leading-relaxed text-gray-400">
                {seasonData.panels.coachGrade.note}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                -- {currentCoach?.name ?? "Support Team"}
              </p>
            </div>
          </div>
        </div>
        <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3 xl:col-span-7">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-light/50">
              <Trophy className="h-4 w-4 text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                {currentSeasonSnapshot.season} Season Snapshot
              </p>
            </div>
          </div>
          <div className="mt-3 grid min-h-0 flex-1 grid-cols-[0.2fr_0.2fr_0.2fr_0.4fr] gap-0 overflow-hidden rounded-lg border border-border bg-surface-light/35">
            <div className="flex flex-col justify-center border-r border-border px-4">
              <p className="text-[10px] uppercase text-gray-500">Record</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {currentSeasonSnapshot.record}
              </p>
            </div>
            <div className="flex flex-col justify-center border-r border-border px-4">
              <p className="text-[10px] uppercase text-gray-500">Titles</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {currentSeasonSnapshot.titles}
              </p>
            </div>
            <div className="flex flex-col justify-center border-r border-border px-4">
              <p className="text-[10px] uppercase text-gray-500">Prize</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {formatMoney(currentSeasonSnapshot.prizeMoney)}
              </p>
            </div>
            <div className="flex flex-col justify-center px-5">
              <p className="text-2xl font-bold text-green-400">
                {currentSeasonSnapshot.bestResult}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {currentSeasonSnapshot.note}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 rounded-lg border border-border bg-surface-light/40 px-3 py-2.5">
        <button
          type="button"
          className="btn-secondary px-3 py-2 text-xs"
          onClick={() => navigate("/career/stats")}
        >
          <TrendingUp className="h-3.5 w-3.5" /> View Full Stats
        </button>
        <button
          type="button"
          className="btn-secondary px-3 py-2 text-xs"
          onClick={() => navigate("/training")}
        >
          Set Next Season Plan
        </button>
        <button
          type="button"
          className="btn-primary px-3 py-2 text-xs"
          onClick={continueWeek}
        >
          <Trophy className="h-3.5 w-3.5" /> Continue to Offseason{" "}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
