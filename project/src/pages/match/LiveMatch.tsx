import { useState } from 'react';
import { Play, FastForward, SkipForward, Pause, Clock, Zap, Eye, MessageSquare, Target, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { mockPlayer } from '../../data/mockData';
import {
  matchOpponent, matchInfo, liveMatchState, tacticalState,
  coachPrompt, opponentAdjustments, momentumData, visitLog, frameHistory,
} from '../../data/matchData';
import ProgressBar from '../../components/ui/ProgressBar';

export default function LiveMatch() {
  const [plan, setPlan] = useState(tacticalState.plan);
  const [focus, setFocus] = useState(tacticalState.focus);
  const [tempo, setTempo] = useState(tacticalState.tempo);

  const ms = liveMatchState;
  const p = mockPlayer;
  const opp = matchOpponent;

  return (
    <div className="space-y-3">
      {/* Zone A: Persistent Top Scoreboard */}
      <div className="card overflow-hidden">
        <div className="flex items-center px-4 py-3">
          {/* Tournament Info */}
          <div className="shrink-0 pr-4 border-r border-border">
            <p className="text-[9px] text-gray-500 uppercase">{matchInfo.tournament}</p>
            <p className="text-[10px] text-white font-medium">{matchInfo.round} - {matchInfo.format}</p>
          </div>

          {/* Player */}
          <div className="flex items-center gap-3 px-4 flex-1">
            <div className="w-9 h-9 rounded-lg bg-green-600/20 border border-green-600/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-green-400">JH</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{p.name}</p>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-gray-400">#{p.worldRanking}</span>
                <span className="text-green-400">Conf {ms.playerConfidence}%</span>
                <span className="text-gray-400">Fat {ms.playerFatigue}%</span>
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-4 px-6 shrink-0">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-400">{ms.playerFrames}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Best of 9</p>
              <p className="text-lg font-bold text-gray-400">-</p>
              <p className="text-[10px] text-gray-500">Frame {ms.currentFrame}</p>
              <div className="flex gap-0.5 mt-1 justify-center">
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                    i < ms.playerFrames ? 'bg-green-500' :
                    i < ms.playerFrames + ms.opponentFrames ? 'bg-red-500' :
                    'bg-gray-600'
                  }`} />
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white">{ms.opponentFrames}</p>
            </div>
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-3 px-4 flex-1 justify-end">
            <div className="text-right min-w-0">
              <p className="text-sm font-bold text-white truncate">{opp.name}</p>
              <div className="flex items-center gap-2 text-[10px] justify-end">
                <span className="text-gray-400">#{opp.ranking}</span>
                <span className="text-gray-400">Conf {ms.opponentConfidence}%</span>
                <span className="text-gray-400">Fat {ms.opponentFatigue}%</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-red-600/10 border border-red-600/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-red-400">MH</span>
            </div>
          </div>

          {/* Match Time */}
          <div className="pl-4 border-l border-border shrink-0 text-center">
            <p className="text-[9px] text-gray-500">Duration</p>
            <p className="text-xs font-bold text-white">{ms.matchDuration}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* Zone B + C: Central Frame + Momentum */}
        <div className="col-span-5 space-y-3">
          {/* Current Frame Panel */}
          <div className="card">
            <div className="card-header py-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h3 className="text-xs font-semibold text-green-400 uppercase">Live - Frame {ms.currentFrame}</h3>
              </div>
              <span className="text-[10px] text-gray-400">{ms.tableState} - {ms.phase} Phase</span>
            </div>
            <div className="card-body space-y-4">
              {/* Frame Score */}
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{ms.playerPoints}</p>
                  <p className="text-[9px] text-gray-500">{p.name.split(' ')[1]}</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[9px] text-gray-500">Visit {ms.currentVisit}</p>
                  <div className="px-3 py-1 bg-surface-light rounded text-[10px] text-white">
                    <Clock size={9} className="inline mr-1" />{ms.shotClock}s
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-400">{ms.opponentPoints}</p>
                  <p className="text-[9px] text-gray-500">{opp.name.split(' ')[1]}</p>
                </div>
              </div>

              {/* Table State Info */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-surface-light/50 rounded">
                  <p className="text-[9px] text-gray-500">Break</p>
                  <p className="text-sm font-bold text-green-400">{ms.currentBreak}</p>
                </div>
                <div className="p-2 bg-surface-light/50 rounded">
                  <p className="text-[9px] text-gray-500">Target</p>
                  <p className="text-sm font-bold text-red-500">{ms.targetBall}</p>
                </div>
                <div className="p-2 bg-surface-light/50 rounded">
                  <p className="text-[9px] text-gray-500">Reds Left</p>
                  <p className="text-sm font-bold text-white">{ms.redsRemaining}</p>
                </div>
                <div className="p-2 bg-surface-light/50 rounded">
                  <p className="text-[9px] text-gray-500">Pts on Table</p>
                  <p className="text-sm font-bold text-white">{ms.pointsOnTable}</p>
                </div>
              </div>

              {/* Player at Table */}
              <div className="p-2.5 bg-green-600/10 rounded-lg border border-green-600/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-400 font-medium">
                      {ms.playerAtTable ? p.name : opp.name} at table
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">Mode: {ms.decisionMode}</span>
                </div>
              </div>

              {/* Latest Visit */}
              {visitLog[0] && (
                <div className="p-2 bg-surface-light/50 rounded text-xs">
                  <p className="text-gray-500 text-[9px]">Latest Visit</p>
                  <p className="text-white">{visitLog[0].player}: <span className="text-green-400">{visitLog[0].action}</span> - {visitLog[0].result}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pressure + Momentum */}
          <div className="card">
            <div className="card-header py-2">
              <h3 className="text-xs font-semibold text-white">Momentum & Pressure</h3>
            </div>
            <div className="card-body space-y-3">
              {/* Pressure Meter */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-400">Pressure</span>
                    <span className={`font-medium ${
                      ms.pressure >= 75 ? 'text-red-400' :
                      ms.pressure >= 50 ? 'text-amber-400' : 'text-green-400'
                    }`}>{ms.pressureLabel}</span>
                  </div>
                  <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        ms.pressure >= 75 ? 'bg-red-500' :
                        ms.pressure >= 50 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${ms.pressure}%` }}
                    />
                  </div>
                </div>
                <span className="text-lg font-bold text-white shrink-0">{ms.pressure}%</span>
              </div>

              {/* Momentum Chart */}
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={momentumData}>
                  <XAxis dataKey="frame" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[-100, 100]} tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} hide />
                  <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-gray-400 text-center">You have the momentum. Holt is rattled after the safety error.</p>
            </div>
          </div>
        </div>

        {/* Zone D + E: Tactical + Coach + Opponent */}
        <div className="col-span-4 space-y-3">
          {/* Tactical Controls */}
          <div className="card">
            <div className="card-header py-2">
              <h3 className="text-xs font-semibold text-white">Tactics</h3>
              <span className="text-[10px] text-green-400">Edge +{ms.tacticalEdge}</span>
            </div>
            <div className="card-body space-y-3">
              <div>
                <p className="text-[9px] text-gray-500 mb-1.5">Plan</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Attack', 'Balanced', 'Safety'] as const).map((opt) => (
                    <button key={opt} onClick={() => setPlan(opt)}
                      className={`px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                        plan === opt ? 'bg-green-600/20 text-green-400 border border-green-600/40' : 'bg-surface-light text-gray-400 border border-transparent hover:text-white'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 mb-1.5">Focus</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Composed', 'Confident', 'Counter'] as const).map((opt) => (
                    <button key={opt} onClick={() => setFocus(opt)}
                      className={`px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                        focus === opt ? 'bg-green-600/20 text-green-400 border border-green-600/40' : 'bg-surface-light text-gray-400 border border-transparent hover:text-white'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 mb-1.5">Tempo</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Steady', 'Quick'] as const).map((opt) => (
                    <button key={opt} onClick={() => setTempo(opt)}
                      className={`px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                        tempo === opt ? 'bg-green-600/20 text-green-400 border border-green-600/40' : 'bg-surface-light text-gray-400 border border-transparent hover:text-white'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>
              <button className="w-full btn-secondary text-[10px] justify-center py-1.5">
                <Clock size={10} /> Use Timeout ({ms.timeoutsRemaining} left)
              </button>
            </div>
          </div>

          {/* Coach Corner */}
          <div className="card">
            <div className="card-header py-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <MessageSquare size={11} className="text-green-400" /> Coach
              </h3>
            </div>
            <div className="card-body space-y-2">
              <p className="text-xs font-medium text-white">{coachPrompt.title}</p>
              <p className="text-[10px] text-gray-400 leading-relaxed">{coachPrompt.note}</p>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-gray-500">Suggests:</span>
                <span className="px-1.5 py-0.5 bg-green-600/20 text-green-400 rounded">{coachPrompt.recommendedPlan}</span>
                <span className="px-1.5 py-0.5 bg-green-600/20 text-green-400 rounded">{coachPrompt.recommendedFocus}</span>
              </div>
              <button className="w-full bg-green-600/10 border border-green-600/30 text-green-400 text-[10px] font-medium px-3 py-1.5 rounded-lg hover:bg-green-600/20 transition-colors">
                Apply Coach Cue
              </button>
            </div>
          </div>

          {/* Opponent Intelligence */}
          <div className="card">
            <div className="card-header py-2">
              <h3 className="text-xs font-semibold text-white">Opponent</h3>
              <span className="text-[10px] text-amber-400">{opp.archetype}</span>
            </div>
            <div className="card-body space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Current Approach</span>
                <span className="text-white font-medium">{opponentAdjustments[0]?.to || opp.approach}</span>
              </div>
              <div className="space-y-1.5">
                {opponentAdjustments.slice(0, 2).map((adj, i) => (
                  <div key={i} className="p-2 bg-surface-light/50 rounded text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400">F{adj.frame}: {adj.from} → {adj.to}</span>
                    </div>
                    <p className="text-gray-400 mt-0.5">{adj.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Zone F: Match Log + Frame History + Player States */}
        <div className="col-span-3 space-y-3">
          {/* Player States */}
          <div className="card card-body">
            <h3 className="text-[10px] font-semibold text-white uppercase mb-2">Condition</h3>
            <div className="space-y-1.5">
              <ProgressBar label="Confidence" value={ms.playerConfidence} size="sm" />
              <ProgressBar label="Fatigue" value={ms.playerFatigue} size="sm" />
            </div>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase mb-2 mt-3">Opponent</h3>
            <div className="space-y-1.5">
              <ProgressBar label="Confidence" value={ms.opponentConfidence} size="sm" />
              <ProgressBar label="Fatigue" value={ms.opponentFatigue} size="sm" />
            </div>
          </div>

          {/* Frame History */}
          <div className="card">
            <div className="card-header py-2">
              <h3 className="text-xs font-semibold text-white">Frames</h3>
            </div>
            <div className="card-body">
              <div className="space-y-1">
                {frameHistory.map((f) => (
                  <div key={f.frame} className="flex items-center gap-2 text-[10px] py-1 border-b border-border/30">
                    <span className="text-gray-500 w-4">F{f.frame}</span>
                    <span className={`font-medium ${f.winner === 'player' ? 'text-green-400' : 'text-white'}`}>{f.playerScore}</span>
                    <span className="text-gray-600">-</span>
                    <span className={`font-medium ${f.winner === 'opponent' ? 'text-red-400' : 'text-white'}`}>{f.opponentScore}</span>
                    <span className={`ml-auto ${f.winner === 'player' ? 'text-green-400' : 'text-red-400'}`}>
                      {f.winner === 'player' ? 'W' : 'L'}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-[10px] py-1 text-amber-400">
                  <span className="w-4">F{ms.currentFrame}</span>
                  <span className="font-medium">{ms.playerPoints}</span>
                  <span className="text-gray-600">-</span>
                  <span className="font-medium">{ms.opponentPoints}</span>
                  <span className="ml-auto animate-pulse">LIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visit Log */}
          <div className="card">
            <div className="card-header py-2">
              <h3 className="text-xs font-semibold text-white">Visit Log</h3>
            </div>
            <div className="card-body max-h-36 overflow-y-auto">
              <div className="space-y-1">
                {visitLog.slice(0, 6).map((v, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] py-0.5 border-b border-border/20">
                    <span className="text-gray-600 w-5">V{v.visit}</span>
                    <span className={`px-1 rounded ${v.player === p.name ? 'bg-green-600/20 text-green-400' : 'bg-surface-light text-gray-400'}`}>
                      {v.player.split(' ')[1]?.[0] || v.player[0]}H
                    </span>
                    <span className="text-gray-300 truncate flex-1">{v.action}</span>
                    <span className={v.success ? 'text-green-400' : 'text-red-400'}>{v.success ? '+' : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone G: Decision Action Bar */}
      <div className="card card-body py-3">
        <div className="flex items-center gap-3">
          {/* Decision Buttons */}
          <div className="flex-1 flex items-center gap-2">
            {ms.playerAtTable ? (
              <>
                <p className="text-[9px] text-gray-500 uppercase font-semibold shrink-0 mr-1">Decision:</p>
                <button className="flex-1 bg-green-600/20 border border-green-600/40 text-green-400 font-medium text-xs px-4 py-2.5 rounded-lg hover:bg-green-600/30 transition-all">
                  <Target size={12} className="inline mr-1.5" />Pot Attempt
                </button>
                <button className="flex-1 bg-green-600/20 border border-green-600/40 text-green-400 font-medium text-xs px-4 py-2.5 rounded-lg hover:bg-green-600/30 transition-all">
                  <Zap size={12} className="inline mr-1.5" />Break Build
                </button>
                <button className="flex-1 bg-green-600/20 border border-green-600/40 text-green-400 font-medium text-xs px-4 py-2.5 rounded-lg hover:bg-green-600/30 transition-all">
                  <Shield size={12} className="inline mr-1.5" />Safety
                </button>
              </>
            ) : (
              <button className="flex-1 bg-surface-light border border-border text-white font-medium text-xs px-4 py-2.5 rounded-lg hover:bg-surface-light/80 transition-all">
                <Eye size={12} className="inline mr-1.5" />Watch Opponent Visit
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border shrink-0" />

          {/* Simulation Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="btn-secondary text-[10px] px-3 py-2"><Play size={11} /> Sim Visit</button>
            <button className="btn-secondary text-[10px] px-3 py-2"><FastForward size={11} /> Sim Frame</button>
            <button className="btn-secondary text-[10px] px-3 py-2"><SkipForward size={11} /> Sim Match</button>
            <button className="btn-secondary text-[10px] px-3 py-2"><Pause size={11} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
