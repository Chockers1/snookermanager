import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { mockPlayer, mockAttributes } from '../../data/mockData';
import ProgressBar from '../../components/ui/ProgressBar';

export default function Attributes() {
  const [view, setView] = useState<'grouped' | 'flat'>('grouped');
  const p = mockPlayer;

  function TrendIcon({ trend }: { trend: number }) {
    if (trend > 0) return <span className="flex items-center text-green-400 text-xs"><TrendingUp size={10} /><span className="ml-0.5">{trend}</span></span>;
    if (trend < 0) return <span className="flex items-center text-red-400 text-xs"><TrendingDown size={10} /><span className="ml-0.5">{trend}</span></span>;
    return <span className="text-gray-600"><Minus size={10} /></span>;
  }

  function renderCategory(title: string, attrs: Record<string, { value: number; trend: number }>) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className="card-body space-y-2.5">
          {Object.entries(attrs).map(([name, attr]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-[11px] text-gray-300 w-28 shrink-0 truncate">{name}</span>
              <div className="flex-1 min-w-0">
                <ProgressBar value={attr.value} showValue={false} size="sm" />
              </div>
              <span className="text-xs font-medium text-white w-7 shrink-0 text-right">{attr.value}</span>
              <div className="w-7 shrink-0"><TrendIcon trend={attr.trend} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Player Attributes - {p.name}</h1>
        <p className="text-sm text-gray-400 mt-1">Professional Player - Age {p.age} - Turned Pro {p.turnedPro} - {p.handedness}</p>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="card card-body text-center">
          <p className="metric-label">Overall Rating</p>
          <div className="w-14 h-14 rounded-full bg-green-600/20 border-2 border-green-500 flex items-center justify-center mx-auto mt-2">
            <span className="text-xl font-bold text-white">{p.overall}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">/ 100</p>
        </div>
        <div className="card card-body text-center">
          <p className="metric-label">Potential</p>
          <div className="w-14 h-14 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center mx-auto mt-2">
            <span className="text-xl font-bold text-white">{p.potential}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">/ 100</p>
        </div>
        <div className="card card-body text-center">
          <p className="metric-label">Morale</p>
          <p className="text-xl font-bold text-green-400 mt-3">Very Good</p>
        </div>
        <div className="card card-body text-center">
          <p className="metric-label">Match Fitness</p>
          <p className="text-2xl font-bold text-white mt-2">{p.fitness}%</p>
        </div>
        <div className="card card-body text-center">
          <p className="metric-label">Fatigue</p>
          <p className="text-2xl font-bold text-green-400 mt-2">Low</p>
          <p className="text-xs text-gray-400">{p.fatigue}%</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button onClick={() => setView('grouped')} className={view === 'grouped' ? 'btn-primary text-xs' : 'btn-secondary text-xs'}>Grouped</button>
        <button onClick={() => setView('flat')} className={view === 'flat' ? 'btn-primary text-xs' : 'btn-secondary text-xs'}>All</button>
      </div>

      {/* Attributes Grid */}
      <div className="grid grid-cols-3 gap-4">
        {renderCategory('Technical', mockAttributes.technical)}
        {renderCategory('Mental', mockAttributes.mental)}
        {renderCategory('Physical', mockAttributes.physical)}
      </div>

      {/* Legend & Coach Notes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card card-body">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-green-400" /><span className="text-gray-400">90+ Elite</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-green-500" /><span className="text-gray-400">75-89 Strong</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-amber-500" /><span className="text-gray-400">60-74 Average</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-red-500" /><span className="text-gray-400">Below 60 Weak</span></div>
          </div>
        </div>
        <div className="card card-body">
          <h4 className="text-xs font-semibold text-white mb-2">Coach Notes</h4>
          <p className="text-xs text-gray-400 italic">
            "Ryan continues to develop into a well-rounded professional. Recent improvements in focus and professionalism are evident in his consistency. Prioritise rest play and pack splitting drills in training."
          </p>
          <p className="text-[10px] text-gray-500 mt-2">-- Coach: Steve Feeney</p>
        </div>
      </div>
    </div>
  );
}
