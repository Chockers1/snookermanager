import { useState } from 'react';
import { Trophy, Users, Calendar, BarChart3, ChevronRight } from 'lucide-react';
import TabGroup from '../../components/ui/TabGroup';
import ProgressBar from '../../components/ui/ProgressBar';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'draw', label: 'Draw' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'players', label: 'Players' },
  { id: 'history', label: 'History' },
];

export default function TournamentHub() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Q Tour Event 3 - Last 32</h1>
          <p className="text-sm text-gray-400 mt-1">Sheffield, England - Best of 7 Frames - Round 5</p>
        </div>
        <div className="card card-body px-4 py-2 text-center">
          <p className="text-[10px] text-gray-500">Current Round</p>
          <p className="text-lg font-bold text-green-400">Last 32</p>
        </div>
      </div>

      <TabGroup tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="grid grid-cols-12 gap-4">
        {/* Main Content */}
        <div className="col-span-8 space-y-4">
          {/* Match Path */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Trophy size={14} className="text-green-400" />
                Your Tournament Path
              </h3>
            </div>
            <div className="card-body">
              <div className="flex items-center gap-2">
                {[
                  { round: 'R1', result: 'W', opponent: 'L. Pritchard', score: '4-1' },
                  { round: 'R2', result: 'W', opponent: 'G. Wilson', score: '4-3' },
                  { round: 'R3', result: 'W', opponent: 'A. McGill', score: '4-2' },
                  { round: 'R4', result: 'W', opponent: 'J. Astley', score: '4-1' },
                  { round: 'L32', result: 'next', opponent: 'M. Holt', score: '--' },
                  { round: 'L16', result: 'locked', opponent: 'TBD', score: '--' },
                  { round: 'QF', result: 'locked', opponent: 'TBD', score: '--' },
                  { round: 'SF', result: 'locked', opponent: 'TBD', score: '--' },
                  { round: 'F', result: 'locked', opponent: 'TBD', score: '--' },
                ].map((match, i) => (
                  <div key={i} className={`flex-1 text-center p-2 rounded-lg border ${
                    match.result === 'W' ? 'bg-green-600/10 border-green-600/30' :
                    match.result === 'next' ? 'bg-amber-600/10 border-amber-600/30' :
                    'bg-surface-light border-border'
                  }`}>
                    <p className="text-[9px] text-gray-500">{match.round}</p>
                    <p className={`text-[10px] font-medium ${
                      match.result === 'W' ? 'text-green-400' :
                      match.result === 'next' ? 'text-amber-400' :
                      'text-gray-500'
                    }`}>{match.score}</p>
                    <p className="text-[9px] text-gray-400 truncate">{match.opponent}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Opponent */}
          <div className="card border-amber-600/30">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Next Match - Last 32</h3>
              <span className="text-[10px] text-amber-400">UPCOMING</span>
            </div>
            <div className="card-body">
              <div className="flex items-center gap-6">
                <div className="flex-1 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-600/20 border-2 border-green-500 flex items-center justify-center mx-auto">
                    <span className="text-lg font-bold text-white">JH</span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-2">Jack Harrison</p>
                  <p className="text-xs text-gray-400">World Ranking 21</p>
                  <p className="text-xs text-green-400">Confidence 78%</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-500">VS</p>
                  <p className="text-[10px] text-gray-500 mt-1">Best of 7</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-600/20 border-2 border-red-500/50 flex items-center justify-center mx-auto">
                    <span className="text-lg font-bold text-white">MH</span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-2">Marcus Holt</p>
                  <p className="text-xs text-gray-400">World Ranking 41</p>
                  <p className="text-xs text-gray-400">Confidence 68%</p>
                </div>
              </div>
              <div className="flex justify-center mt-4">
                <button className="btn-primary text-xs">
                  Match Preview <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Event Schedule */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar size={14} className="text-green-400" />
                Event Schedule
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-2 text-xs">
                {[
                  { round: 'Round 1', date: '7 May', status: 'Completed', matches: 64 },
                  { round: 'Round 2', date: '8 May', status: 'Completed', matches: 32 },
                  { round: 'Round 3', date: '9 May', status: 'Completed', matches: 16 },
                  { round: 'Round 4', date: '10 May', status: 'Completed', matches: 8 },
                  { round: 'Last 32', date: '11 May', status: 'In Progress', matches: 16 },
                  { round: 'Last 16', date: '12 May', status: 'Upcoming', matches: 8 },
                  { round: 'Quarter Final', date: '13 May', status: 'Upcoming', matches: 4 },
                  { round: 'Semi Final', date: '14 May', status: 'Upcoming', matches: 2 },
                  { round: 'Final', date: '14 May', status: 'Upcoming', matches: 1 },
                ].map((r) => (
                  <div key={r.round} className={`flex items-center gap-3 p-2 rounded ${
                    r.status === 'In Progress' ? 'bg-green-600/10' : ''
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      r.status === 'Completed' ? 'bg-green-500' :
                      r.status === 'In Progress' ? 'bg-amber-500' :
                      'bg-gray-600'
                    }`} />
                    <span className="text-white w-28">{r.round}</span>
                    <span className="text-gray-400 w-16">{r.date}</span>
                    <span className={`${
                      r.status === 'In Progress' ? 'text-amber-400' :
                      r.status === 'Completed' ? 'text-green-400' :
                      'text-gray-500'
                    }`}>{r.status}</span>
                    <span className="ml-auto text-gray-500">{r.matches} matches</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-4">
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Your Condition</h3>
            <div className="space-y-2">
              <ProgressBar label="Confidence" value={78} size="sm" />
              <ProgressBar label="Fatigue" value={18} size="sm" />
              <ProgressBar label="Focus" value={85} size="sm" />
              <ProgressBar label="Composure" value={83} size="sm" />
            </div>
          </div>

          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Equipment Readiness</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Cue Condition</span><span className="text-green-400">88%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Tip Condition</span><span className="text-amber-400">72%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Chalk Supply</span><span className="text-green-400">Good</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Familiarity</span><span className="text-green-400">100%</span></div>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Prize Structure</h3>
            <div className="space-y-1.5 text-xs">
              {[
                { round: 'Winner', prize: '£20,000' },
                { round: 'Runner-Up', prize: '£10,000' },
                { round: 'Semi Final', prize: '£5,000' },
                { round: 'Quarter Final', prize: '£3,000' },
                { round: 'Last 16', prize: '£2,000' },
                { round: 'Last 32', prize: '£1,500' },
              ].map((p) => (
                <div key={p.round} className="flex justify-between">
                  <span className="text-gray-400">{p.round}</span>
                  <span className="text-green-400 font-medium">{p.prize}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
