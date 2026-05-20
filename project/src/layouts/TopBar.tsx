import { Bell, Mail, Settings, TrendingUp, TrendingDown } from 'lucide-react';
import { mockPlayer } from '../data/mockData';

function FormDots({ form }: { form: ('W' | 'L' | 'D')[] }) {
  return (
    <div className="flex gap-0.5 items-center">
      {form.slice(0, 10).map((result, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            result === 'W' ? 'bg-green-500' : result === 'L' ? 'bg-red-500' : 'bg-amber-500'
          }`}
        />
      ))}
    </div>
  );
}

export default function TopBar() {
  const p = mockPlayer;

  return (
    <header className="h-14 bg-sidebar border-b border-border flex items-center px-4 shrink-0 overflow-hidden">
      {/* Player Identity */}
      <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-border min-w-0">
        <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-xs font-bold text-white shrink-0">
          {p.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white truncate max-w-[100px]">{p.name}</span>
            <span className="text-xs shrink-0">{p.flag}</span>
          </div>
          <p className="text-[10px] text-gray-500 truncate max-w-[120px]">Pro Player</p>
        </div>
      </div>

      {/* World Ranking */}
      <div className="flex items-center gap-1.5 px-4 border-r border-border shrink-0">
        <span className="text-[9px] text-gray-500 uppercase whitespace-nowrap">World Ranking</span>
        <span className="text-base font-bold text-white">{p.worldRanking}</span>
        {p.rankingMovement > 0 ? (
          <span className="flex items-center text-green-400 text-[10px]">
            <TrendingUp size={10} />
            <span className="ml-0.5">{p.rankingMovement}</span>
          </span>
        ) : p.rankingMovement < 0 ? (
          <span className="flex items-center text-red-400 text-[10px]">
            <TrendingDown size={10} />
            <span className="ml-0.5">{Math.abs(p.rankingMovement)}</span>
          </span>
        ) : null}
      </div>

      {/* Form */}
      <div className="flex items-center gap-1.5 px-4 border-r border-border shrink-0">
        <span className="text-[9px] text-gray-500 uppercase whitespace-nowrap">Form (Last 10)</span>
        <FormDots form={p.form} />
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-1.5 px-4 border-r border-border shrink-0">
        <span className="text-[9px] text-gray-500 uppercase whitespace-nowrap">Confidence</span>
        <span className="text-xs font-bold text-white">{p.confidence}%</span>
        <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full" style={{ width: `${p.confidence}%` }} />
        </div>
      </div>

      {/* Funds */}
      <div className="flex items-center gap-1.5 px-4 border-r border-border shrink-0">
        <span className="text-[9px] text-gray-500 uppercase whitespace-nowrap">Funds</span>
        <span className="text-xs font-bold text-white whitespace-nowrap">
          £{(p.cashBalance / 1000).toFixed(0)}k
        </span>
        <span className={`text-[10px] whitespace-nowrap ${p.cashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {p.cashFlow >= 0 ? '+' : ''}£{(p.cashFlow / 1000).toFixed(1)}k
        </span>
      </div>

      {/* Next Tournament */}
      <div className="flex items-center gap-1.5 px-4 min-w-0 shrink">
        <span className="text-[9px] text-gray-500 uppercase whitespace-nowrap shrink-0">Next</span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-white truncate">World Championship</p>
          <p className="text-[9px] text-gray-500 truncate">Qual. Round 1</p>
        </div>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2 shrink-0 pl-3">
        <button className="relative p-1.5 text-gray-400 hover:text-white transition-colors">
          <Mail size={16} />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-600 rounded-full text-[8px] font-bold flex items-center justify-center text-white">
            5
          </span>
        </button>
        <button className="relative p-1.5 text-gray-400 hover:text-white transition-colors">
          <Bell size={16} />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">
            2
          </span>
        </button>
        <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
