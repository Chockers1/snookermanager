import { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';

const events = [
  { id: '1', name: 'World Championship Qualifying', date: '14-21 May', location: 'Sheffield, England', tier: 1, status: 'upcoming', prizeMoney: '£500,000' },
  { id: '2', name: 'Championship League', date: '2-7 Jun', location: 'Leicester, England', tier: 3, status: 'upcoming', prizeMoney: '£10,000' },
  { id: '3', name: 'British Open', date: '16-22 Jun', location: 'Milton Keynes, England', tier: 2, status: 'upcoming', prizeMoney: '£100,000' },
  { id: '4', name: 'European Masters Qualifiers', date: '1-3 Jul', location: 'Nuremberg, Germany', tier: 3, status: 'upcoming', prizeMoney: '£5,000' },
  { id: '5', name: 'WST ProAm', date: '10-12 Jul', location: 'Cardiff, Wales', tier: 4, status: 'upcoming', prizeMoney: '£2,000' },
  { id: '6', name: 'Shanghai Masters', date: '15-21 Sep', location: 'Shanghai, China', tier: 1, status: 'upcoming', prizeMoney: '£375,000' },
];

const tierColors: Record<number, string> = {
  1: 'bg-amber-500',
  2: 'bg-green-500',
  3: 'bg-blue-500',
  4: 'bg-gray-500',
};

export default function TournamentCalendar() {
  const [selectedEvent, setSelectedEvent] = useState(events[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tournament Calendar</h1>
          <p className="text-sm text-gray-400 mt-1">Season 2024/25 Event Schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary text-xs"><ChevronLeft size={14} /></button>
          <span className="text-sm font-medium text-white">May - July 2025</span>
          <button className="btn-secondary text-xs"><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Event List */}
        <div className="col-span-7">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-500" /><span className="text-gray-400">Tier 1 - Major</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500" /><span className="text-gray-400">Tier 2 - Ranking</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500" /><span className="text-gray-400">Tier 3 - Standard</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-gray-500" /><span className="text-gray-400">Tier 4 - Minor</span></div>
              </div>
            </div>
            <div className="card-body space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedEvent.id === event.id ? 'bg-green-600/10 border border-green-600/30' : 'bg-surface-light/50 hover:bg-surface-light border border-transparent'
                  }`}
                >
                  <div className={`w-1.5 h-10 rounded-full ${tierColors[event.tier]}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white">{event.name}</h3>
                      <StatusBadge text={`Tier ${event.tier}`} variant={event.tier === 1 ? 'warning' : event.tier === 2 ? 'success' : 'neutral'} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{event.date}</span>
                      <span className="flex items-center gap-1"><MapPin size={10} /> {event.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-green-400">{event.prizeMoney}</p>
                    <p className="text-[10px] text-gray-500">Prize Pool</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Event Detail */}
        <div className="col-span-5 space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">{selectedEvent.name}</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-gray-500">Date</span><p className="text-white">{selectedEvent.date}</p></div>
                <div><span className="text-gray-500">Location</span><p className="text-white">{selectedEvent.location}</p></div>
                <div><span className="text-gray-500">Tier</span><p className="text-white">Tier {selectedEvent.tier}</p></div>
                <div><span className="text-gray-500">Prize Money</span><p className="text-green-400 font-bold">{selectedEvent.prizeMoney}</p></div>
                <div><span className="text-gray-500">Ranking Points</span><p className="text-white">10,000</p></div>
                <div><span className="text-gray-500">Format</span><p className="text-white">Best of 9 Frames</p></div>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-[10px] text-gray-500 font-semibold uppercase mb-2">Entry Requirements</p>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> World Ranking Top 128</li>
                  <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> Tour Card Holder</li>
                  <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> Entry Fee: £500</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-[10px] text-gray-500 font-semibold uppercase mb-2">Travel Estimate</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Travel + Hotel</span>
                  <span className="text-white">£480</span>
                </div>
              </div>

              <button className="btn-primary w-full text-xs justify-center mt-3">
                Enter Tournament <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
