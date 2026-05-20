import { Calendar, Zap, RotateCcw, Copy } from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const sessions = [
  { day: 'Monday', session: 'Long Potting Session', category: 'Technical', intensity: 'High' },
  { day: 'Tuesday', session: 'Match Practice', category: 'Technical', intensity: 'Medium' },
  { day: 'Wednesday', session: 'Safety Drills', category: 'Technical', intensity: 'High' },
  { day: 'Thursday', session: 'Rest Day', category: 'Recovery', intensity: 'None' },
  { day: 'Friday', session: 'Break Building', category: 'Technical', intensity: 'High' },
  { day: 'Saturday', session: 'Physical Training', category: 'Physical', intensity: 'Medium' },
  { day: 'Sunday', session: 'Analysis & Review', category: 'Mental', intensity: 'Low' },
];

const categoryColors: Record<string, string> = {
  Technical: 'bg-green-600/20 text-green-400 border-green-600/30',
  Physical: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  Mental: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  Recovery: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
};

export default function TrainingPlanner() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Training Planner</h1>
          <p className="text-sm text-gray-400 mt-1">Week 32 (12 May - 18 May 2025)</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs"><Zap size={14} /> Auto-Plan</button>
          <button className="btn-secondary text-xs"><RotateCcw size={14} /> Recovery Plan</button>
          <button className="btn-secondary text-xs"><Copy size={14} /> Clone Previous</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Week Grid */}
        <div className="col-span-8">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar size={14} className="text-green-400" />
                Weekly Schedule
              </h3>
              <span className="text-[10px] text-gray-400">Next Competition: World Championship Qualifying - 14 May</span>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.day} className="flex items-center gap-3 p-3 bg-surface-light/50 rounded-lg hover:bg-surface-light transition-colors">
                    <span className="text-xs text-gray-400 w-24 shrink-0">{s.day}</span>
                    <div className={`px-2 py-1 rounded border text-[10px] font-medium ${categoryColors[s.category]}`}>
                      {s.category}
                    </div>
                    <span className="text-sm text-white flex-1">{s.session}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      s.intensity === 'High' ? 'bg-red-600/20 text-red-400' :
                      s.intensity === 'Medium' ? 'bg-amber-600/20 text-amber-400' :
                      s.intensity === 'Low' ? 'bg-blue-600/20 text-blue-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {s.intensity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-4">
          {/* Load Summary */}
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Training Load</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Weekly Load</span>
                  <span className="text-white">72%</span>
                </div>
                <ProgressBar value={72} size="sm" showValue={false} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Fatigue Impact</span>
                  <span className="text-amber-400">+12%</span>
                </div>
                <ProgressBar value={12} size="sm" showValue={false} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Confidence Boost</span>
                  <span className="text-green-400">+5%</span>
                </div>
                <ProgressBar value={60} size="sm" showValue={false} colorByValue={false} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Coach Bonus</span>
                  <span className="text-green-400">+8%</span>
                </div>
                <ProgressBar value={80} size="sm" showValue={false} colorByValue={false} />
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Recommendations</h3>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="p-2 bg-green-600/10 rounded border border-green-600/20">
                <p className="text-green-400 font-medium">Focus on Long Potting</p>
                <p className="text-[10px] mt-0.5">Your coach recommends prioritising long pot accuracy ahead of the World Championship qualifier.</p>
              </div>
              <div className="p-2 bg-amber-600/10 rounded border border-amber-600/20">
                <p className="text-amber-400 font-medium">Monitor Fatigue</p>
                <p className="text-[10px] mt-0.5">Consider adding a recovery session to keep fatigue below 25% before match day.</p>
              </div>
            </div>
          </div>

          {/* Focus Areas */}
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Weekly Focus Areas</h3>
            <div className="space-y-2">
              {[
                { area: 'Long Potting', progress: 82, focus: 'Very High' },
                { area: 'Break Building', progress: 76, focus: 'High' },
                { area: 'Safety Play', progress: 71, focus: 'High' },
                { area: 'Mental Resilience', progress: 58, focus: 'Medium' },
              ].map((f) => (
                <div key={f.area} className="flex items-center gap-2">
                  <span className="text-xs text-gray-300 w-28 shrink-0">{f.area}</span>
                  <div className="flex-1">
                    <ProgressBar value={f.progress} size="sm" showValue={true} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end gap-3">
        <button className="btn-secondary">Reset Week</button>
        <button className="btn-primary">Apply Training Plan</button>
      </div>
    </div>
  );
}
