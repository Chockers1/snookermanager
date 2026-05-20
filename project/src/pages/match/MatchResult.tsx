import { Trophy, ChevronRight, TrendingUp, TrendingDown, Award, Zap } from 'lucide-react';
import { mockPlayer } from '../../data/mockData';
import { matchOpponent, matchInfo, matchResultData } from '../../data/matchData';
import ProgressBar from '../../components/ui/ProgressBar';

export default function MatchResult() {
  const p = mockPlayer;
  const opp = matchOpponent;
  const r = matchResultData;
  const isWin = r.finalScore.player > r.finalScore.opponent;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 flex items-center gap-2">
        <span>{matchInfo.tournament}</span>
        <span className="text-gray-600">/</span>
        <span>{matchInfo.round}</span>
        <span className="text-gray-600">/</span>
        <span>{matchInfo.format}</span>
        <span className="text-gray-600">/</span>
        <span className="text-white font-medium">Result</span>
      </div>

      {/* Result Hero */}
      <div className={`card overflow-hidden border ${isWin ? 'border-green-600/30' : 'border-red-600/30'}`}>
        <div className={`p-6 bg-gradient-to-r ${isWin ? 'from-green-600/10 via-transparent to-transparent' : 'from-red-600/10 via-transparent to-transparent'}`}>
          <div className="flex items-center justify-between">
            {/* Player */}
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-xl ${isWin ? 'bg-green-600/20 border-2 border-green-500' : 'bg-surface-light border-2 border-border'} flex items-center justify-center`}>
                <span className={`text-xl font-bold ${isWin ? 'text-green-400' : 'text-white'}`}>JH</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {isWin && <Trophy size={16} className="text-amber-400" />}
                  <p className="text-lg font-bold text-white">{p.name} {p.flag}</p>
                </div>
                <p className="text-xs text-gray-400">World Ranking #{p.worldRanking}</p>
                <p className={`text-xs mt-0.5 ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                  {isWin ? 'MATCH WON' : 'MATCH LOST'}
                </p>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center gap-5 text-center">
              <p className={`text-5xl font-bold ${isWin ? 'text-green-400' : 'text-white'}`}>{r.finalScore.player}</p>
              <div>
                <p className="text-2xl text-gray-500 font-bold">-</p>
                <p className="text-[10px] text-gray-500 mt-1">{r.matchDuration}</p>
              </div>
              <p className={`text-5xl font-bold ${!isWin ? 'text-red-400' : 'text-white'}`}>{r.finalScore.opponent}</p>
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-lg font-bold text-white">{opp.name} {opp.flag}</p>
                <p className="text-xs text-gray-400">World Ranking #{opp.ranking}</p>
                <p className="text-xs text-gray-400">{opp.archetype}</p>
              </div>
              <div className="w-16 h-16 rounded-xl bg-surface-light border-2 border-border/50 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-400">MH</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Metrics */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Prize Money', value: `£${r.prizeMoney.toLocaleString()}`, color: 'text-green-400', icon: Award },
          { label: 'Ranking Points', value: r.rankingPoints.toLocaleString(), color: 'text-white', icon: TrendingUp },
          { label: 'Confidence', value: `+${r.confidenceChange}%`, sub: `Now ${r.newConfidence}%`, color: 'text-green-400', icon: Zap },
          { label: 'Fatigue', value: `+${r.fatigueChange}%`, sub: `Now ${r.newFatigue}%`, color: 'text-amber-400', icon: TrendingUp },
          { label: 'Highest Break', value: r.highestBreak.toString(), color: 'text-white', icon: Trophy },
          { label: 'Centuries', value: r.centuriesPlayer.toString(), sub: `${r.fiftyPlusPlayer} x 50+`, color: 'text-green-400', icon: Trophy },
        ].map((m) => (
          <div key={m.label} className="card card-body text-center">
            <m.icon size={14} className="text-gray-500 mx-auto mb-1" />
            <p className="metric-label">{m.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${m.color}`}>{m.value}</p>
            {m.sub && <p className="text-[10px] text-gray-400">{m.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Match Stats Comparison */}
        <div className="col-span-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Match Stats</h3>
            </div>
            <div className="card-body">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-border">
                    <th className="text-left py-1.5">{p.name.split(' ')[1]}</th>
                    <th className="text-center py-1.5">Stat</th>
                    <th className="text-right py-1.5">{opp.name.split(' ')[1]}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { left: `${r.potSuccessPlayer}%`, stat: 'Pot Success', right: `${r.potSuccessOpponent}%` },
                    { left: `${r.longPotSuccessPlayer}%`, stat: 'Long Pot', right: `${r.longPotSuccessOpponent}%` },
                    { left: `${r.safetySuccessPlayer}%`, stat: 'Safety', right: `${r.safetySuccessOpponent}%` },
                    { left: r.highestBreak.toString(), stat: 'Highest Break', right: '62' },
                    { left: r.centuriesPlayer.toString(), stat: 'Centuries', right: r.centuriesOpponent.toString() },
                    { left: r.fiftyPlusPlayer.toString(), stat: '50+ Breaks', right: r.fiftyPlusOpponent.toString() },
                    { left: r.foulsPlayer.toString(), stat: 'Fouls', right: r.foulsOpponent.toString() },
                    { left: r.averageBreakPlayer.toString(), stat: 'Avg Break', right: r.averageBreakOpponent.toString() },
                  ].map((row) => (
                    <tr key={row.stat} className="border-b border-border/30">
                      <td className="py-1.5 text-green-400 font-medium">{row.left}</td>
                      <td className="py-1.5 text-center text-gray-400">{row.stat}</td>
                      <td className="py-1.5 text-right text-white">{row.right}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Frame by Frame + Why it Happened */}
        <div className="col-span-4 space-y-4">
          {/* Frame History */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Frame by Frame</h3>
            </div>
            <div className="card-body">
              <div className="space-y-1">
                {r.frameHistory.map((f) => (
                  <div key={f.frame} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/30">
                    <span className="text-gray-500 w-7">F{f.frame}</span>
                    <span className={`font-medium w-8 ${f.winner === 'player' ? 'text-green-400' : 'text-white'}`}>{f.playerScore}</span>
                    <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${f.winner === 'player' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${(f.playerScore / (f.playerScore + f.opponentScore)) * 100}%` }}
                      />
                    </div>
                    <span className={`font-medium w-8 text-right ${f.winner === 'opponent' ? 'text-red-400' : 'text-white'}`}>{f.opponentScore}</span>
                    <span className={`w-5 text-right font-bold ${f.winner === 'player' ? 'text-green-400' : 'text-red-400'}`}>
                      {f.winner === 'player' ? 'W' : 'L'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Why It Happened */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Why The Result Happened</h3>
            </div>
            <div className="card-body space-y-2">
              {r.explanation.keyFactors.map((f) => (
                <div key={f.factor} className="flex items-start gap-2 text-xs p-2 bg-surface-light/50 rounded">
                  <span className={`shrink-0 mt-0.5 ${
                    f.impact === 'positive' ? 'text-green-400' : f.impact === 'negative' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {f.impact === 'positive' ? '+' : f.impact === 'negative' ? '-' : '='}
                  </span>
                  <div>
                    <p className="text-white font-medium">{f.factor}</p>
                    <p className="text-[10px] text-gray-400">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Explanation + Coach + Improvement */}
        <div className="col-span-4 space-y-4">
          {/* Match Summary */}
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-2">Match Summary</h3>
            <p className="text-xs text-gray-300 leading-relaxed">{r.explanation.summary}</p>
            <div className="mt-3 pt-2 border-t border-border">
              <p className="text-[9px] text-gray-500 uppercase font-semibold mb-1">Strength Edge</p>
              <p className="text-xs text-green-400 font-medium">{r.explanation.strengthEdge}</p>
            </div>
          </div>

          {/* Match Modifiers */}
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-2">Match Modifiers</h3>
            <div className="space-y-1.5 text-[10px]">
              {Object.entries(r.modifiers).map(([key, val]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-gray-500 capitalize w-16 shrink-0">{key}</span>
                  <span className="text-gray-300">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coach Feedback */}
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-2">Coach Feedback</h3>
            <p className="text-[11px] text-gray-300 italic leading-relaxed">"{r.explanation.coachFeedback}"</p>
            <p className="text-[10px] text-gray-500 mt-2">-- {p.coach}, Head Coach</p>
          </div>

          {/* Improvement Areas */}
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-2">Improvement Areas</h3>
            <div className="space-y-1.5">
              {r.explanation.improvementAreas.map((area) => (
                <div key={area} className="flex items-start gap-2 text-[10px]">
                  <span className="text-amber-400 mt-0.5 shrink-0">!</span>
                  <span className="text-gray-300">{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3 pt-3">
        <button className="btn-secondary text-xs">View Full Stats</button>
        <button className="btn-secondary text-xs">Review Training</button>
        <button className="btn-secondary text-xs">View Draw</button>
        <button className="btn-primary flex items-center gap-2">
          <Trophy size={14} /> Continue Tournament <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
