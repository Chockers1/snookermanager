import { useState } from 'react';
import { Clock, MapPin, Shield, Swords, ChevronRight, Zap, Target, AlertTriangle } from 'lucide-react';
import { mockPlayer, mockAttributes } from '../../data/mockData';
import { matchOpponent, matchInfo, headToHead, matchPreviewTactics } from '../../data/matchData';
import ProgressBar from '../../components/ui/ProgressBar';
import FormDots from '../../components/ui/FormDots';
import StatusBadge from '../../components/ui/StatusBadge';

export default function MatchPreview() {
  const [plan, setPlan] = useState<'Attack' | 'Balanced' | 'Safety'>(matchPreviewTactics.recommendedPlan);
  const [focus, setFocus] = useState<'Composed' | 'Confident' | 'Counter'>(matchPreviewTactics.recommendedFocus);
  const [tempo, setTempo] = useState<'Steady' | 'Quick'>(matchPreviewTactics.recommendedTempo);

  const p = mockPlayer;
  const opp = matchOpponent;

  const readinessScore = Math.round((p.confidence + (100 - p.fatigue) + 88 + 82) / 4);
  const difficultyLabel = p.worldRanking < opp.ranking ? 'Slight Favourite' : 'Even Match';

  return (
    <div className="space-y-5">
      {/* Event Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{matchInfo.tournament}</span>
            <span className="text-gray-600">/</span>
            <span>{matchInfo.round}</span>
            <span className="text-gray-600">/</span>
            <span>{matchInfo.format}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Match Preview</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="card card-body px-4 py-2 text-center">
            <p className="text-[9px] text-gray-500 uppercase">Difficulty</p>
            <p className="text-sm font-bold text-green-400">{difficultyLabel}</p>
          </div>
          <div className="card card-body px-4 py-2 text-center">
            <p className="text-[9px] text-gray-500 uppercase">Readiness</p>
            <p className="text-sm font-bold text-white">{readinessScore}%</p>
          </div>
        </div>
      </div>

      {/* Match Info Bar */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { icon: Clock, label: 'Kick-off', value: matchInfo.matchTime },
          { icon: MapPin, label: 'Venue', value: matchInfo.city },
          { icon: Target, label: 'Table', value: matchInfo.table },
          { icon: Shield, label: 'Referee', value: matchInfo.referee },
          { icon: Zap, label: 'Conditions', value: matchInfo.conditions, color: 'text-green-400' },
          { icon: Swords, label: 'Format', value: matchInfo.format },
        ].map((item) => (
          <div key={item.label} className="card card-body flex items-center gap-2 py-2">
            <item.icon size={13} className="text-gray-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-gray-500">{item.label}</p>
              <p className={`text-[11px] font-medium truncate ${item.color || 'text-white'}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* VS Hero Panel */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-2">
          {/* Player Side */}
          <div className="p-5 border-r border-border bg-gradient-to-r from-green-600/5 to-transparent">
            <div className="flex items-center gap-1 text-[10px] text-green-400 font-semibold mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> YOU
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-600/10 border border-green-600/30 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-green-400">{p.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{p.name} {p.flag}</h2>
                <p className="text-xs text-gray-400">{p.status}</p>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="text-xs text-gray-400">Rank <span className="text-white font-medium">#{p.worldRanking}</span></span>
                  <span className="text-xs text-gray-400">OVR <span className="text-white font-medium">{p.overall}</span></span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <FormDots form={p.form} size="sm" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border/50">
              <div><p className="text-[9px] text-gray-500">Confidence</p><p className="text-sm font-bold text-green-400">{p.confidence}%</p></div>
              <div><p className="text-[9px] text-gray-500">Fatigue</p><p className="text-sm font-bold text-white">{p.fatigue}%</p></div>
              <div><p className="text-[9px] text-gray-500">Fitness</p><p className="text-sm font-bold text-white">{p.fitness}%</p></div>
            </div>
          </div>

          {/* Opponent Side */}
          <div className="p-5 bg-gradient-to-l from-red-600/5 to-transparent">
            <div className="flex items-center gap-1 text-[10px] text-red-400 font-semibold mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> OPPONENT
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-red-600/10 border border-red-600/30 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-red-400">{opp.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{opp.name} {opp.flag}</h2>
                <p className="text-xs text-gray-400">{opp.archetype}</p>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="text-xs text-gray-400">Rank <span className="text-white font-medium">#{opp.ranking}</span></span>
                  <span className="text-xs text-gray-400">Approach <span className="text-white font-medium">{opp.approach}</span></span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <FormDots form={opp.form} size="sm" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border/50">
              <div><p className="text-[9px] text-gray-500">Confidence</p><p className="text-sm font-bold text-white">{opp.confidence}%</p></div>
              <div><p className="text-[9px] text-gray-500">Fatigue</p><p className="text-sm font-bold text-white">{opp.fatigue}%</p></div>
              <div><p className="text-[9px] text-gray-500">Style</p><p className="text-sm font-bold text-amber-400 truncate">{opp.archetype}</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left Column - Intelligence */}
        <div className="col-span-4 space-y-4">
          {/* Head to Head */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Head-to-Head</h3>
              <span className="text-[10px] text-gray-400">{headToHead.played} meetings</span>
            </div>
            <div className="card-body space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-2xl font-bold text-green-400">{headToHead.playerWins}</p><p className="text-[9px] text-gray-500">Your Wins</p></div>
                <div><p className="text-2xl font-bold text-gray-500">-</p><p className="text-[9px] text-gray-500">Draws</p></div>
                <div><p className="text-2xl font-bold text-red-400">{headToHead.opponentWins}</p><p className="text-[9px] text-gray-500">Their Wins</p></div>
              </div>
              <div className="space-y-1.5">
                {headToHead.history.map((h) => (
                  <div key={h.event} className="flex items-center justify-between text-[10px] py-1 border-b border-border/30">
                    <span className="text-gray-400 truncate flex-1">{h.event}</span>
                    <span className={`font-medium ml-2 ${h.result === 'W' ? 'text-green-400' : 'text-red-400'}`}>{h.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scout Report */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Scout Report</h3>
            </div>
            <div className="card-body space-y-3">
              <div>
                <p className="text-[9px] text-green-400 font-semibold uppercase mb-1.5">Opponent Strengths</p>
                <div className="space-y-1.5">
                  {opp.strengths.map((s) => (
                    <p key={s} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5 shrink-0">+</span>{s}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] text-red-400 font-semibold uppercase mb-1.5">Opponent Weaknesses</p>
                <div className="space-y-1.5">
                  {opp.weaknesses.map((w) => (
                    <p key={w} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5 shrink-0">-</span>{w}
                    </p>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-[9px] text-gray-500 font-semibold uppercase mb-1">Key Attributes</p>
                <div className="space-y-1.5">
                  <ProgressBar label="Long Potting" value={opp.stats.longPotting} size="sm" />
                  <ProgressBar label="Break Building" value={opp.stats.breakBuilding} size="sm" />
                  <ProgressBar label="Safety Play" value={opp.stats.safetyPlay} size="sm" />
                  <ProgressBar label="Composure" value={opp.stats.composure} size="sm" />
                  <ProgressBar label="Big Match Nerve" value={opp.stats.bigMatchNerve} size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column - Tactical Plan */}
        <div className="col-span-4 space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Tactical Plan</h3>
              <StatusBadge text="Pre-Match" variant="info" />
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-[9px] text-gray-500 font-semibold uppercase mb-2">Frame Plan</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['Attack', 'Balanced', 'Safety'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPlan(opt)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        plan === opt
                          ? 'bg-green-600/20 text-green-400 border border-green-600/40'
                          : 'bg-surface-light text-gray-400 border border-border hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] text-gray-500 font-semibold uppercase mb-2">Mental Focus</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['Composed', 'Confident', 'Counter'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFocus(opt)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        focus === opt
                          ? 'bg-green-600/20 text-green-400 border border-green-600/40'
                          : 'bg-surface-light text-gray-400 border border-border hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] text-gray-500 font-semibold uppercase mb-2">Tempo</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['Steady', 'Quick'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTempo(opt)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        tempo === opt
                          ? 'bg-green-600/20 text-green-400 border border-green-600/40'
                          : 'bg-surface-light text-gray-400 border border-border hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-green-600/5 rounded-lg border border-green-600/20">
                <p className="text-[9px] text-green-400 font-semibold uppercase mb-1">Coach Recommendation</p>
                <p className="text-[11px] text-gray-300 leading-relaxed">{matchPreviewTactics.reasoning}</p>
              </div>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Matchup Analysis</h3>
            <div className="space-y-3">
              <div className="p-2.5 bg-surface-light/50 rounded-lg">
                <p className="text-[9px] text-gray-500 font-semibold uppercase mb-1">Key Battle</p>
                <p className="text-xs text-white">{matchPreviewTactics.keyMatchup}</p>
              </div>
              <div className="p-2.5 bg-amber-600/5 rounded-lg border border-amber-600/20">
                <p className="text-[9px] text-amber-400 font-semibold uppercase mb-1 flex items-center gap-1"><AlertTriangle size={9} /> Danger Zone</p>
                <p className="text-[11px] text-gray-300">{matchPreviewTactics.dangerZone}</p>
              </div>
              <div className="p-2.5 bg-surface-light/50 rounded-lg">
                <p className="text-[9px] text-gray-500 font-semibold uppercase mb-1">Format Insight</p>
                <p className="text-[11px] text-gray-300">Best of 9 suits your consistency. Build an early lead and Holt will struggle to recover.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Readiness */}
        <div className="col-span-4 space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Your Match Profile</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2.5 bg-surface-light/50 rounded-lg">
                  <p className="text-[9px] text-gray-500">Attack</p>
                  <p className="text-lg font-bold text-white">{Math.round((mockAttributes.technical['Long Potting'].value + mockAttributes.technical['Break Building'].value) / 2)}</p>
                </div>
                <div className="text-center p-2.5 bg-surface-light/50 rounded-lg">
                  <p className="text-[9px] text-gray-500">Tactical</p>
                  <p className="text-lg font-bold text-white">{Math.round((mockAttributes.technical['Safety Play'].value + mockAttributes.technical['Tactical Awareness'].value) / 2)}</p>
                </div>
                <div className="text-center p-2.5 bg-surface-light/50 rounded-lg">
                  <p className="text-[9px] text-gray-500">Clutch</p>
                  <p className="text-lg font-bold text-white">{Math.round((mockAttributes.mental['Composure'].value + mockAttributes.mental['Big Match Nerve'].value) / 2)}</p>
                </div>
                <div className="text-center p-2.5 bg-surface-light/50 rounded-lg">
                  <p className="text-[9px] text-gray-500">Endurance</p>
                  <p className="text-lg font-bold text-white">{Math.round((mockAttributes.physical['Stamina'].value + mockAttributes.physical['Hand Steadiness'].value) / 2)}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <ProgressBar label="Long Potting" value={mockAttributes.technical['Long Potting'].value} size="sm" />
                <ProgressBar label="Break Building" value={mockAttributes.technical['Break Building'].value} size="sm" />
                <ProgressBar label="Cue Ball Control" value={mockAttributes.technical['Cue Ball Control'].value} size="sm" />
                <ProgressBar label="Safety Play" value={mockAttributes.technical['Safety Play'].value} size="sm" />
                <ProgressBar label="Composure" value={mockAttributes.mental['Composure'].value} size="sm" />
                <ProgressBar label="Focus" value={mockAttributes.mental['Focus'].value} size="sm" />
              </div>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Equipment Check</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Cue', name: 'Crucible Control X', condition: 88 },
                { label: 'Chalk', name: 'Green Diamond Pro', condition: 95 },
                { label: 'Tip', name: 'Elk Master 9.5mm', condition: 82 },
              ].map((eq) => (
                <div key={eq.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-surface-light flex items-center justify-center text-[9px] font-bold text-green-400 shrink-0">
                    {eq.label.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{eq.name}</p>
                    <p className="text-[10px] text-gray-400">Condition: <span className="text-green-400">{eq.condition}%</span></p>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Cue Familiarity</span>
                  <span className="text-green-400 font-bold">100%</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-400">Equipment Bonus</span>
                  <span className="text-green-400 font-bold">+3.2</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Mental Readiness</h3>
            <div className="space-y-1.5">
              <ProgressBar label="Confidence" value={p.confidence} size="sm" />
              <ProgressBar label="Focus" value={mockAttributes.mental['Focus'].value} size="sm" />
              <ProgressBar label="Composure" value={mockAttributes.mental['Composure'].value} size="sm" />
              <ProgressBar label="Big Match Nerve" value={mockAttributes.mental['Big Match Nerve'].value} size="sm" />
            </div>
            <div className="mt-3 p-2.5 bg-green-600/10 rounded border border-green-600/20">
              <p className="text-[10px] text-green-400 font-medium">Ready to compete</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Strong cueing edge, well rested. Fatigue is a non-factor.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Match Summary */}
      <div className="card card-body">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="text-green-400 font-semibold shrink-0">Pre-Match Summary:</span>
          <span className="truncate">Strong technical advantage (Long Potting +2, Break Building +12 vs Holt)</span>
          <span className="text-gray-600 shrink-0">|</span>
          <span className="truncate">Mental edge in composure and big match moments</span>
          <span className="text-gray-600 shrink-0">|</span>
          <span className="text-amber-400 truncate">Watch for Holt's counter-attacking rhythm if he settles</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-center gap-3 pt-2">
        <button className="btn-secondary text-xs">Back to Tournament</button>
        <button className="btn-secondary text-xs">Adjust Training</button>
        <button className="btn-secondary text-xs">Change Equipment</button>
        <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl transition-all flex items-center gap-3 text-sm shadow-lg shadow-green-600/20 hover:shadow-green-600/30">
          Start Match <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
