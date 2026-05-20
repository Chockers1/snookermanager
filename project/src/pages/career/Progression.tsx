import { Check, Lock, ChevronRight } from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';

const stages = [
  { id: 1, name: 'Junior Club Player', tier: 1, status: 'completed', progress: 100, requirements: ['Local Events', 'Basic Coaching', 'Club Standard'] },
  { id: 2, name: 'Regional Youth', tier: 1, status: 'completed', progress: 100, requirements: ['Regional Events', 'Basic Coaching', 'Regional Level'] },
  { id: 3, name: 'National Youth', tier: 2, status: 'completed', progress: 100, requirements: ['National Events', 'Intermediate Coaching', 'National Level'] },
  { id: 4, name: 'Amateur Circuit', tier: 2, status: 'current', progress: 62, requirements: ['Amateur Standard', 'Amateur Circuit Events', 'Intermediate Coaching', 'Regional Sponsor'] },
  { id: 5, name: 'Q Tour', tier: 3, status: 'locked', progress: 0, requirements: ['Q Tour Standard', 'Q Tour Events', 'Advanced Coaching', 'National Sponsor'] },
  { id: 6, name: 'Q School', tier: 3, status: 'locked', progress: 0, requirements: ['Q School Standard', 'Q School Events', 'Advanced Coaching'] },
  { id: 7, name: 'Professional Tour', tier: 3, status: 'locked', progress: 0, requirements: ['Pro Tour Standard', 'Pro Tour Events', 'Advanced Coaching', 'National+ Sponsor'] },
  { id: 8, name: 'Top 64', tier: 4, status: 'locked', progress: 0, requirements: ['Top 64 Ranking', 'Ranked Events', 'Elite Coaching'] },
  { id: 9, name: 'Top 32', tier: 4, status: 'locked', progress: 0, requirements: ['Top 32 Ranking', 'Ranked Events', 'Elite Coaching'] },
  { id: 10, name: 'Top 16', tier: 5, status: 'locked', progress: 0, requirements: ['Top 16 Ranking', 'Major Events', 'Elite Coaching'] },
  { id: 11, name: 'World Champion', tier: 5, status: 'locked', progress: 0, requirements: ['Win World Championship', 'World Championships', 'Legendary Coaching'] },
];

const currentStage = stages.find((s) => s.status === 'current')!;

export default function Progression() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Career Pathway</h1>
          <p className="text-sm text-gray-400 mt-1">Your journey from junior clubs to snooker immortality.</p>
        </div>
        <div className="card card-body text-center px-6">
          <p className="text-[10px] text-gray-500 uppercase">Career Progression</p>
          <p className="text-3xl font-bold text-green-400 mt-1">37%</p>
          <p className="text-xs text-gray-400 mt-0.5">Stage 4 of 11</p>
        </div>
      </div>

      {/* Stage Grid */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="grid grid-cols-3 gap-3">
            {stages.slice(0, 9).map((stage) => (
              <div key={stage.id} className={`card card-body relative ${
                stage.status === 'current' ? 'border-green-500' :
                stage.status === 'completed' ? 'border-green-600/30' :
                'opacity-60'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    stage.status === 'completed' ? 'bg-green-600 text-white' :
                    stage.status === 'current' ? 'bg-green-600/20 text-green-400 border border-green-500' :
                    'bg-surface-light text-gray-500'
                  }`}>
                    {stage.status === 'completed' ? <Check size={10} /> : stage.id}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    stage.tier <= 2 ? 'bg-green-600/20 text-green-400' :
                    stage.tier === 3 ? 'bg-blue-600/20 text-blue-400' :
                    stage.tier === 4 ? 'bg-amber-600/20 text-amber-400' :
                    'bg-red-600/20 text-red-400'
                  }`}>Tier {stage.tier}</span>
                </div>
                <h3 className="text-xs font-semibold text-white">{stage.name}</h3>
                <div className="mt-2">
                  <ProgressBar value={stage.progress} size="sm" showValue={false} />
                  <span className="text-[10px] text-gray-400">{stage.progress}%</span>
                </div>
                {stage.status === 'locked' && (
                  <Lock size={12} className="absolute top-3 right-3 text-gray-600" />
                )}
                {stage.status === 'current' && (
                  <span className="absolute top-2 right-2 text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded font-semibold">CURRENT</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Stage Detail */}
        <div className="col-span-4 space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">{currentStage.name}</h3>
              <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded">Current Stage</span>
            </div>
            <div className="card-body space-y-3">
              <p className="text-xs text-gray-400">
                Compete across national amateur circuits to gain experience, earn ranking points, and prove you have what it takes to challenge for a place on the Q Tour.
              </p>
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase mb-2">Requirements</p>
                <div className="space-y-1.5">
                  {['Top 300 Amateur Ranking', 'Match Wins 25/25', 'Event Participation 12/12', 'Head-to-Head Record 56%', 'Highest Break 80/100', 'Recommendation'].map((req, i) => (
                    <div key={req} className="flex items-center gap-2 text-xs">
                      <div className={`w-3.5 h-3.5 rounded-full border ${i < 3 ? 'bg-green-600 border-green-500' : 'border-gray-600'} flex items-center justify-center`}>
                        {i < 3 && <Check size={8} className="text-white" />}
                      </div>
                      <span className={i < 3 ? 'text-green-400' : 'text-gray-400'}>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn-primary w-full text-xs mt-3">
                View Q Tour Stage <ChevronRight size={12} />
              </button>
            </div>
          </div>

          <div className="card card-body">
            <p className="text-[10px] text-gray-500 font-semibold uppercase mb-2">Pathway Tips</p>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>Focus on consistent match wins to climb the rankings.</li>
              <li>Higher breaks improve your ranking potential.</li>
              <li>Work with your coach to unlock advanced training.</li>
              <li>Strong performances attract better sponsors.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
