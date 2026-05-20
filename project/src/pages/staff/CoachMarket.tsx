import { useState } from 'react';
import { Search, Filter, Star, ChevronRight } from 'lucide-react';
import { mockCoaches } from '../../data/mockData';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';

const specialisms = ['Technical', 'Tactical', 'Mental', 'Fitness', 'Cue Action', 'Break Building'];

export default function CoachMarket() {
  const [selectedCoach, setSelectedCoach] = useState(mockCoaches[0]);
  const [activeFilter, setActiveFilter] = useState('Technical');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hire Coaches</h1>
          <p className="text-sm text-gray-400 mt-1">Find the perfect coach to elevate your performance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Sort by: Overall Rating</span>
          <button className="btn-secondary text-xs"><Filter size={12} /> Filters</button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {specialisms.map((s) => (
          <button
            key={s}
            onClick={() => setActiveFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === s ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-surface text-gray-400 border border-border hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Coach List */}
        <div className="col-span-7">
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-gray-500 border-b border-border bg-surface-light/50">
                  <th className="text-left py-2 px-2.5 font-medium whitespace-nowrap">Name</th>
                  <th className="text-left py-2 px-2.5 font-medium whitespace-nowrap">Type</th>
                  <th className="text-left py-2 px-2.5 font-medium whitespace-nowrap">Level</th>
                  <th className="text-left py-2 px-2.5 font-medium whitespace-nowrap">Cost</th>
                  <th className="text-left py-2 px-2.5 font-medium whitespace-nowrap">Rep.</th>
                  <th className="text-left py-2 px-2.5 font-medium whitespace-nowrap">Fit</th>
                  <th className="text-left py-2 px-2.5 font-medium whitespace-nowrap">Tech</th>
                  <th className="text-left py-2 px-2.5 font-medium whitespace-nowrap">Mental</th>
                </tr>
              </thead>
              <tbody>
                {mockCoaches.map((coach) => (
                  <tr
                    key={coach.id}
                    onClick={() => setSelectedCoach(coach)}
                    className={`border-b border-border/50 cursor-pointer transition-colors ${
                      selectedCoach.id === coach.id ? 'bg-green-600/10' : 'hover:bg-surface-light/50'
                    }`}
                  >
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-1.5">
                        <Star size={9} className={coach.id === '1' ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} />
                        <span className="text-white font-medium whitespace-nowrap">{coach.name}</span>
                        {coach.fitLabel && (
                          <StatusBadge text={coach.fitLabel} variant={coach.fitLabel === 'Strong Fit' ? 'success' : 'info'} />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2.5 text-gray-400 whitespace-nowrap">{coach.type}</td>
                    <td className="py-2 px-2.5 text-gray-400 whitespace-nowrap">{coach.level}</td>
                    <td className="py-2 px-2.5 text-white whitespace-nowrap">£{coach.weeklyCost}</td>
                    <td className="py-2 px-2.5">
                      <div className="w-12"><ProgressBar value={coach.reputation} size="sm" showValue={false} /></div>
                    </td>
                    <td className="py-2 px-2.5 text-green-400 whitespace-nowrap">{coach.compatibility}%</td>
                    <td className="py-2 px-2.5">
                      <div className="w-12"><ProgressBar value={coach.technical} size="sm" showValue={false} /></div>
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="w-12"><ProgressBar value={coach.mental} size="sm" showValue={false} /></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Coach Detail */}
        <div className="col-span-5 space-y-4">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{selectedCoach.name}</h3>
                {selectedCoach.fitLabel && <StatusBadge text={selectedCoach.fitLabel} variant="success" />}
              </div>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-gray-500">Specialism:</span><p className="text-green-400 font-medium">{selectedCoach.specialism}</p></div>
                <div><span className="text-gray-500">Coach Level</span><p className="text-white">{selectedCoach.level}</p></div>
                <div><span className="text-gray-500">Weekly Cost</span><p className="text-white">£{selectedCoach.weeklyCost}</p></div>
                <div><span className="text-gray-500">Contract Length</span><p className="text-white">{selectedCoach.contractLength}</p></div>
                <div><span className="text-gray-500">Compatibility</span><p className="text-green-400">{selectedCoach.compatibility}%</p></div>
                <div><span className="text-gray-500">Personality</span><p className="text-white">{selectedCoach.personality}</p></div>
              </div>

              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase mb-2">Coach Attributes</p>
                <div className="space-y-2">
                  <ProgressBar label="Technical Knowledge" value={selectedCoach.technical} size="sm" />
                  <ProgressBar label="Tactical Knowledge" value={selectedCoach.tactical} size="sm" />
                  <ProgressBar label="Mental Support" value={selectedCoach.mental} size="sm" />
                  <ProgressBar label="Motivation" value={selectedCoach.motivation} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-green-400 font-semibold mb-1">Strengths</p>
                  <ul className="space-y-0.5">
                    {selectedCoach.strengths.map((s) => (
                      <li key={s} className="text-[10px] text-gray-300 flex items-start gap-1">
                        <span className="text-green-400 mt-0.5">+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] text-red-400 font-semibold mb-1">Weaknesses</p>
                  <ul className="space-y-0.5">
                    {selectedCoach.weaknesses.map((w) => (
                      <li key={w} className="text-[10px] text-gray-300 flex items-start gap-1">
                        <span className="text-red-400 mt-0.5">-</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex gap-2">
                <button className="btn-primary flex-1 text-xs justify-center">
                  Hire Coach <ChevronRight size={12} />
                </button>
                <button className="btn-secondary text-xs">Shortlist</button>
                <button className="btn-secondary text-xs">Compare</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
