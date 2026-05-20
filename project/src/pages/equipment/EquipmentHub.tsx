import { useState } from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { mockEquipment } from '../../data/mockData';
import ProgressBar from '../../components/ui/ProgressBar';
import TabGroup from '../../components/ui/TabGroup';
import StatusBadge from '../../components/ui/StatusBadge';

const tabs = [
  { id: 'cues', label: 'Cues' },
  { id: 'chalk', label: 'Chalk' },
  { id: 'tips', label: 'Tips' },
  { id: 'cases', label: 'Cases' },
  { id: 'maintenance', label: 'Maintenance' },
];

export default function EquipmentHub() {
  const [activeTab, setActiveTab] = useState('cues');
  const [selectedCue, setSelectedCue] = useState(mockEquipment[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cue Shop</h1>
          <p className="text-sm text-gray-400 mt-1">Equipment marketplace and current equipment management.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <select className="bg-surface-light border border-border rounded-lg px-3 py-1.5 text-white">
            <option>All Tiers</option>
            <option>Budget</option>
            <option>Mid-Tier</option>
            <option>Elite</option>
          </select>
          <select className="bg-surface-light border border-border rounded-lg px-3 py-1.5 text-white">
            <option>All Conditions</option>
            <option>New</option>
            <option>Good</option>
            <option>Worn</option>
          </select>
        </div>
      </div>

      <TabGroup tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="grid grid-cols-12 gap-4">
        {/* Cue Grid */}
        <div className="col-span-8">
          <div className="grid grid-cols-2 gap-3">
            {mockEquipment.map((cue) => (
              <div
                key={cue.id}
                onClick={() => setSelectedCue(cue)}
                className={`card card-body cursor-pointer transition-colors ${
                  selectedCue.id === cue.id ? 'border-green-500' : 'hover:border-border-light'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{cue.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-lg font-bold text-green-400">£{cue.price}</span>
                      <StatusBadge text={cue.tier} variant={cue.tier === 'Elite' ? 'warning' : 'neutral'} />
                    </div>
                  </div>
                  {cue.owned && cue.equipped && (
                    <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  {Object.entries(cue.stats).map(([stat, value]) => (
                    <div key={stat} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-20 capitalize">{stat.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex-1"><ProgressBar value={value} size="sm" showValue={true} /></div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px]">
                  <span className="text-gray-400">Condition: <span className="text-white">{cue.condition}%</span></span>
                  {cue.owned && <StatusBadge text="Owned" variant="success" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Cue Detail */}
        <div className="col-span-4 space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-bold text-white">{selectedCue.name}</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">Price</span><p className="text-green-400 font-bold">£{selectedCue.price}</p></div>
                <div><span className="text-gray-500">Tier</span><p className="text-white">{selectedCue.tier}</p></div>
                <div><span className="text-gray-500">Condition</span><p className="text-white">{selectedCue.condition}%</p></div>
                <div><span className="text-gray-500">Familiarity</span><p className="text-white">{selectedCue.familiarity}%</p></div>
              </div>

              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase mb-2">Stats</p>
                <div className="space-y-2">
                  {Object.entries(selectedCue.stats).map(([stat, value]) => (
                    <ProgressBar key={stat} label={stat.replace(/([A-Z])/g, ' $1').trim()} value={value} size="md" />
                  ))}
                </div>
              </div>

              {selectedCue.owned && selectedCue.equipped && (
                <div className="p-2 bg-green-600/10 rounded border border-green-600/20 text-xs text-green-400">
                  Currently Equipped
                </div>
              )}

              {!selectedCue.owned && (
                <button className="btn-primary w-full text-xs justify-center">
                  <ShoppingCart size={14} /> Buy Cue - £{selectedCue.price}
                </button>
              )}
            </div>
          </div>

          {/* Current Setup */}
          <div className="card card-body">
            <h3 className="text-xs font-semibold text-white mb-3">Current Equipment Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Cue</span><span className="text-white">Crucible Control X</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Chalk</span><span className="text-white">Pro Contact</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Tip</span><span className="text-white">Premium Medium</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Case</span><span className="text-white">Hard Case Pro</span></div>
            </div>
            <div className="mt-3 pt-2 border-t border-border">
              <p className="text-[10px] text-gray-500">Equipment Bonus</p>
              <p className="text-sm font-bold text-green-400">+7.8 to key attributes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
