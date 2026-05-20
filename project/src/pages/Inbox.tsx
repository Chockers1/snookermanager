import { useState } from 'react';
import { Mail, Check, ChevronRight, AlertTriangle } from 'lucide-react';
import { mockInbox } from '../data/mockData';
import TabGroup from '../components/ui/TabGroup';
import StatusBadge from '../components/ui/StatusBadge';

const tabs = [
  { id: 'all', label: 'All', count: 7 },
  { id: 'unread', label: 'Unread', count: 5 },
  { id: 'career', label: 'Career', count: 3 },
  { id: 'finance', label: 'Finance', count: 2 },
  { id: 'media', label: 'Media', count: 1 },
  { id: 'medical', label: 'Medical', count: 1 },
];

const priorityVariant = {
  informational: 'info' as const,
  awaiting_decision: 'warning' as const,
  warning: 'warning' as const,
  urgent: 'danger' as const,
};

export default function Inbox() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(mockInbox[1]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inbox & News Centre</h1>
          <p className="text-sm text-gray-400 mt-1">Your hub for all career updates, news and decisions that shape your career journey.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs"><Check size={12} /> Mark All Read</button>
          <button className="btn-secondary text-xs">Message Settings</button>
        </div>
      </div>

      <TabGroup tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="grid grid-cols-12 gap-4">
        {/* Message List */}
        <div className="col-span-5">
          <div className="card overflow-hidden">
            <div className="divide-y divide-border">
              {mockInbox.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`p-3 cursor-pointer transition-colors flex items-start gap-3 ${
                    selectedMessage.id === msg.id ? 'bg-green-600/10' : 'hover:bg-surface-light/50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${msg.read ? 'bg-transparent' : 'bg-green-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{msg.subject}</span>
                      {!msg.read && <span className="text-[9px] bg-green-600 text-white px-1 rounded">New</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{msg.preview}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-500">{msg.sender}</span>
                      <span className="text-[10px] text-gray-600">|</span>
                      <span className="text-[10px] text-gray-500">{msg.date}</span>
                    </div>
                  </div>
                  <StatusBadge
                    text={msg.priority.replace('_', ' ')}
                    variant={priorityVariant[msg.priority]}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message Detail */}
        <div className="col-span-7 space-y-4">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{selectedMessage.subject}</h3>
                  <StatusBadge text={selectedMessage.priority.replace('_', ' ')} variant={priorityVariant[selectedMessage.priority]} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">From: {selectedMessage.sender} - {selectedMessage.date}</p>
              </div>
            </div>
            <div className="card-body">
              <p className="text-sm text-gray-300 leading-relaxed">{selectedMessage.content}</p>

              {selectedMessage.priority === 'awaiting_decision' && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="card card-body bg-surface-light/50">
                    <h4 className="text-xs font-semibold text-white mb-2">Event Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Event</span><p className="text-white">European Masters 2025</p></div>
                      <div><span className="text-gray-500">Entry Fee</span><p className="text-white">£2,000</p></div>
                      <div><span className="text-gray-500">Location</span><p className="text-white">Nuremberg, Germany</p></div>
                      <div><span className="text-gray-500">Prize Money</span><p className="text-green-400">£375,000</p></div>
                      <div><span className="text-gray-500">Dates</span><p className="text-white">22-28 May 2025</p></div>
                      <div><span className="text-gray-500">Ranking Points</span><p className="text-white">8,000</p></div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
                      <AlertTriangle size={12} /> Why It Matters
                    </h4>
                    <p className="text-xs text-gray-400">A strong performance could move you inside the Top 20 and boost qualification chances for the World Championship.</p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="btn-primary text-xs">Accept Invite <ChevronRight size={12} /></button>
                    <button className="btn-secondary text-xs">Decline Invite</button>
                    <button className="btn-secondary text-xs">View Tournament</button>
                  </div>
                </div>
              )}

              {selectedMessage.priority === 'urgent' && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex gap-2">
                    <button className="btn-primary text-xs">View Health Centre <ChevronRight size={12} /></button>
                    <button className="btn-secondary text-xs">Speak to Coach</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Decision Impact */}
          {selectedMessage.priority === 'awaiting_decision' && (
            <div className="card card-body">
              <h4 className="text-xs font-semibold text-white mb-3">Decision Impact (If Accepted)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500">Ranking</p>
                  <p className="text-lg font-bold text-green-400">+8,000 pts</p>
                  <p className="text-[10px] text-gray-400">Potential +3 to +6 places</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500">Confidence</p>
                  <p className="text-lg font-bold text-green-400">+5%</p>
                  <p className="text-[10px] text-gray-400">Performance Opportunity</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500">Finances</p>
                  <p className="text-lg font-bold text-green-400">+£28,000</p>
                  <p className="text-[10px] text-gray-400">Potential Net Earnings</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
