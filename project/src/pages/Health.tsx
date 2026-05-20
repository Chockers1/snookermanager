import { HeartPulse, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import ProgressBar from '../components/ui/ProgressBar';

const bodyAreas = [
  { area: 'Back', status: 'Good', risk: 15 },
  { area: 'Shoulder', status: 'Minor Strain', risk: 35 },
  { area: 'Wrist', status: 'Good', risk: 10 },
  { area: 'Eyes', status: 'Good', risk: 10 },
  { area: 'Fatigue', status: 'Elevated', risk: 55 },
  { area: 'Sleep', status: 'Good', risk: 20 },
  { area: 'Mental Burnout', status: 'Low Risk', risk: 20 },
];

const treatments = [
  { name: 'Rest', desc: 'Complete rest to allow natural recovery.', cost: '£0', time: '3-5 days', selected: true },
  { name: 'Physio Treatment', desc: 'Hands-on therapy to reduce inflammation.', cost: '£180', time: '2-3 days' },
  { name: 'Reduced Training', desc: 'Light training to maintain fitness without strain.', cost: '£50', time: '3-7 days' },
  { name: 'Fitness Plan', desc: 'Targeted exercises to strengthen the area.', cost: '£150', time: '5-10 days' },
  { name: 'Medical Review', desc: 'Detailed assessment by medical team.', cost: '£120', time: '1 day' },
];

const history = [
  { date: '12 Apr 2025', issue: 'Lower Back Tightness', severity: 'Minor', treatment: 'Physio', time: '3 days', status: 'Resolved' },
  { date: '3 Mar 2025', issue: 'Wrist Stiffness', severity: 'Minor', treatment: 'Reduced Training', time: '2 days', status: 'Resolved' },
  { date: '18 Jan 2025', issue: 'Eye Strain', severity: 'Minor', treatment: 'Rest', time: '1 day', status: 'Resolved' },
];

export default function Health() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Health & Injury Centre</h1>
        <p className="text-sm text-gray-400 mt-1">Monitor your physical condition, injuries and recovery</p>
      </div>

      {/* Current Issue */}
      <div className="card card-body bg-amber-600/5 border-amber-600/30">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-amber-600/20 flex items-center justify-center">
            <HeartPulse size={24} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-amber-400 font-semibold uppercase">Current Issue</p>
            <h2 className="text-lg font-bold text-white">Minor Shoulder Strain</h2>
            <p className="text-xs text-gray-400 mt-1">Sustained during practice - Occurred on 31 May 2025</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Overall Risk Level</p>
            <p className="text-xl font-bold text-green-400">Low</p>
            <p className="text-xs text-gray-400">Manageable with proper treatment and load control.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Body Status */}
        <div className="col-span-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Body Status</h3>
            </div>
            <div className="card-body">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-border">
                    <th className="text-left py-2">Area</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {bodyAreas.map((b) => (
                    <tr key={b.area} className="border-b border-border/50">
                      <td className="py-2 text-white">{b.area}</td>
                      <td className="py-2">
                        <span className={`${
                          b.status === 'Good' ? 'text-green-400' :
                          b.status.includes('Strain') || b.status === 'Elevated' ? 'text-amber-400' :
                          'text-green-400'
                        }`}>{b.status}</span>
                      </td>
                      <td className="py-2 w-24">
                        <ProgressBar value={b.risk} size="sm" showValue={true} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Treatment Options */}
        <div className="col-span-5">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Treatment Options</h3>
            </div>
            <div className="card-body space-y-2">
              {treatments.map((t) => (
                <div key={t.name} className={`p-3 rounded-lg flex items-start gap-3 cursor-pointer transition-colors ${
                  t.selected ? 'bg-green-600/10 border border-green-600/30' : 'bg-surface-light/50 border border-transparent hover:border-border-light'
                }`}>
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                    t.selected ? 'border-green-500 bg-green-600' : 'border-gray-600'
                  }`}>
                    {t.selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-white font-medium">{t.cost}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 justify-end"><Clock size={9} /> {t.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Injury Detail */}
        <div className="col-span-3 space-y-4">
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Injury Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Injury</span><span className="text-white">Minor Shoulder Strain</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Type</span><span className="text-white">Soft Tissue Strain</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Severity</span><span className="text-amber-400">Minor</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Sustained</span><span className="text-white">31 May 2025</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Cause</span><span className="text-white">Overuse / Repetitive</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Pain Level</span><span className="text-white">2 / 10</span></div>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Recovery Overview</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Expected Recovery</span><span className="text-white">3-7 days</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Estimated Return</span><span className="text-white">6 Jun 2025</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Progress</span><span className="text-green-400">40%</span></div>
            </div>
            <div className="mt-2"><ProgressBar value={40} size="md" showValue={false} /></div>
          </div>

          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-2">Match Impact</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Performance</span><span className="text-red-400">-10% to -15%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Long Potting</span><span className="text-red-400">-8%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Safety Play</span><span className="text-red-400">-5%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Cue Control</span><span className="text-red-400">-5%</span></div>
            </div>
            <div className="mt-3 p-2 bg-amber-600/10 rounded border border-amber-600/20">
              <p className="text-[10px] text-amber-400 flex items-center gap-1">
                <AlertTriangle size={10} /> High risk of injury worsening if playing through.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-white">Recent Injury / Treatment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-border">
                <th className="text-left py-2 px-4">Date</th>
                <th className="text-left py-2 px-4">Issue</th>
                <th className="text-left py-2 px-4">Severity</th>
                <th className="text-left py-2 px-4">Treatment</th>
                <th className="text-left py-2 px-4">Time Out</th>
                <th className="text-left py-2 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.date} className="border-b border-border/50">
                  <td className="py-2 px-4 text-gray-400">{h.date}</td>
                  <td className="py-2 px-4 text-white">{h.issue}</td>
                  <td className="py-2 px-4 text-amber-400">{h.severity}</td>
                  <td className="py-2 px-4 text-white">{h.treatment}</td>
                  <td className="py-2 px-4 text-gray-400">{h.time}</td>
                  <td className="py-2 px-4 text-green-400">{h.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button className="btn-primary text-xs">Schedule Treatment <ChevronRight size={12} /></button>
        <button className="btn-secondary text-xs">Return to Training Plan</button>
      </div>
    </div>
  );
}
