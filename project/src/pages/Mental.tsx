import { Brain, AlertTriangle, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ProgressBar from '../components/ui/ProgressBar';

const mentalTrend = [
  { week: 'WK-6', confidence: 75, stress: 60, focus: 80, motivation: 82 },
  { week: 'WK-5', confidence: 72, stress: 65, focus: 78, motivation: 78 },
  { week: 'WK-4', confidence: 68, stress: 70, focus: 72, motivation: 74 },
  { week: 'WK-3', confidence: 65, stress: 75, focus: 70, motivation: 72 },
  { week: 'WK-2', confidence: 67, stress: 72, focus: 74, motivation: 74 },
  { week: 'WK-1', confidence: 67, stress: 72, focus: 64, motivation: 74 },
];

const actionPlan = [
  { name: 'Reduce match load', effect: '+15% Stress', cost: 'Low', time: '1-2 weeks' },
  { name: 'Simple potting drills', effect: '+10% Confidence', cost: 'Low', time: 'Ongoing' },
  { name: 'Sports psychologist', effect: '+15% Focus', cost: '£600', time: '1 session/week' },
  { name: 'Confidence-building local event', effect: '+8% Confidence', cost: '£300', time: '1 weekend' },
  { name: 'Rest week', effect: '-20% Burnout Risk', cost: 'Medium', time: '1 week' },
  { name: 'Avoid media', effect: '+10% Stress', cost: 'Low', time: '1-2 weeks' },
];

export default function Mental() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mental State & Slump Recovery</h1>
          <p className="text-sm text-gray-400 mt-1">Monitor psychological well-being, diagnose issues, and apply targeted recovery strategies.</p>
        </div>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Confidence', value: 67, status: 'Good', color: 'text-green-400' },
          { label: 'Stress', value: 72, status: 'Elevated', color: 'text-amber-400' },
          { label: 'Motivation', value: 74, status: 'Good', color: 'text-green-400' },
          { label: 'Focus', value: 64, status: 'Needs Work', color: 'text-amber-400' },
          { label: 'Burnout Risk', value: 62, status: 'Moderate', color: 'text-amber-400' },
          { label: 'Overthinking Risk', value: 78, status: 'High Risk', color: 'text-red-400' },
        ].map((m) => (
          <div key={m.label} className="card card-body text-center">
            <p className="metric-label">{m.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{m.value}%</p>
            <p className={`text-[10px] font-medium ${m.color}`}>{m.status}</p>
            <div className="mt-2"><ProgressBar value={m.value} size="sm" showValue={false} /></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Diagnosis */}
        <div className="col-span-8 space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Brain size={14} className="text-amber-400" />
                Diagnosis
              </h3>
            </div>
            <div className="card-body">
              <h2 className="text-xl font-bold text-white mb-2">Technical Overthinking After Heavy Defeat</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Ryan is second-guessing his cue action and decision-making following a poor recent loss.
                This is creating hesitation, reduced confidence, and tension under pressure, leading to
                inconsistent shot execution and match flow disruption.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-[10px] text-red-400 font-semibold uppercase mb-1">Contributing Factors</p>
                  <ul className="space-y-1 text-xs text-gray-400">
                    <li>Recent close loss in final-frame decider</li>
                    <li>Missed crucial black at key moment</li>
                    <li>Negative external feedback (media)</li>
                    <li>High match load with limited recovery</li>
                  </ul>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Severity</p>
                  <p className="text-2xl font-bold text-amber-400">78%</p>
                  <p className="text-xs text-amber-400">Significant Impact on Performance</p>
                </div>
                <div>
                  <p className="text-[10px] text-green-400 font-semibold uppercase mb-1">Recovery Outlook</p>
                  <p className="text-lg font-bold text-white">3-4 Weeks</p>
                  <p className="text-xs text-gray-400">With consistent recovery plan adherence.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Plan */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Recommended Action Plan</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-3 gap-3">
                {actionPlan.map((action) => (
                  <div key={action.name} className="p-3 bg-surface-light/50 rounded-lg hover:bg-surface-light transition-colors cursor-pointer border border-transparent hover:border-green-600/30">
                    <p className="text-xs font-medium text-white">{action.name}</p>
                    <p className="text-[10px] text-green-400 mt-1">{action.effect}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                      <span>Cost: {action.cost}</span>
                      <span>Time: {action.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Mental Trend (Last 6 Weeks)</h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={mentalTrend}>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={[50, 100]} />
                  <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="confidence" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Confidence" />
                  <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Stress" />
                  <Line type="monotone" dataKey="focus" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Focus" />
                  <Line type="monotone" dataKey="motivation" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Motivation" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-4">
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Recent Triggers</h3>
            <div className="space-y-2">
              {[
                { trigger: 'Lost final-frame decider', ago: '2 days ago' },
                { trigger: 'Missed black', ago: '2 days ago' },
                { trigger: 'Media criticism', ago: '1 day ago' },
              ].map((t) => (
                <div key={t.trigger} className="flex items-center justify-between text-xs p-2 bg-surface-light/50 rounded">
                  <span className="text-gray-300">{t.trigger}</span>
                  <span className="text-gray-500">{t.ago}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Coach / Psychologist Notes</h3>
            <p className="text-xs text-gray-400 italic leading-relaxed">
              "You're caught in a loop of analysis and doubt. Simplify your process, trust your routine, and give yourself
              permission to play freely again. Protect your headspace and reduce external noise."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center text-xs font-bold text-green-400">JH</div>
              <div>
                <p className="text-xs text-white">Dr. James Holloway</p>
                <p className="text-[10px] text-gray-400">Sports Psychologist</p>
              </div>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Recommended Next Focus</h3>
            <p className="text-lg font-bold text-green-400">Simplicity & Trust</p>
            <p className="text-xs text-gray-400 mt-1">Focus on keeping your game simple and trusting your strengths.</p>
            <ul className="mt-2 space-y-1 text-xs text-gray-400">
              <li className="flex items-center gap-1"><Check size={10} className="text-green-400" /> One shot at a time</li>
              <li className="flex items-center gap-1"><Check size={10} className="text-green-400" /> Commit to your routine</li>
              <li className="flex items-center gap-1"><Check size={10} className="text-green-400" /> Play with freedom, not fear</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-3 flex items-center gap-3">
        <AlertTriangle size={16} className="text-amber-400 shrink-0" />
        <p className="text-xs text-gray-300">Mental fatigue and overthinking are significantly affecting performance. Immediate action is recommended to prevent deeper slump.</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button className="btn-primary text-xs">Apply Recovery Plan <ChevronRight size={12} /></button>
        <button className="btn-secondary text-xs">Book Psychologist</button>
        <button className="btn-secondary text-xs">Adjust Schedule</button>
        <button className="btn-secondary text-xs">Continue</button>
      </div>
    </div>
  );
}

function Check({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
