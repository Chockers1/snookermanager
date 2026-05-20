import { Handshake, ChevronRight, Check } from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';

const offers = [
  { id: '1', brand: 'Maxwell Sports', type: 'Equipment', value: '£500/week', fit: 88, risk: 'Low', status: 'Available', tier: 'Premium' },
  { id: '2', brand: 'CueMaster Pro', type: 'Equipment', value: '£350/week', fit: 76, risk: 'Low', status: 'Available', tier: 'Standard' },
  { id: '3', brand: 'SportsFuel UK', type: 'Nutrition', value: '£200/week', fit: 62, risk: 'Medium', status: 'Available', tier: 'Standard' },
  { id: '4', brand: 'Elite Wear', type: 'Clothing', value: '£450/week', fit: 81, risk: 'Low', status: 'Negotiable', tier: 'Premium' },
];

const activeSponsors = [
  { name: 'Peradon Cues', type: 'Equipment', income: '£300/week', expires: 'Aug 2025' },
  { name: 'Snooker Weekly', type: 'Media', income: '£150/week', expires: 'Dec 2025' },
];

export default function Sponsorship() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sponsorship</h1>
          <p className="text-sm text-gray-400 mt-1">Manage endorsements and commercial partnerships</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Active Sponsors */}
        <div className="col-span-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Handshake size={14} className="text-green-400" />
                Active Sponsors
              </h3>
            </div>
            <div className="card-body space-y-3">
              {activeSponsors.map((s) => (
                <div key={s.name} className="p-3 bg-surface-light/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{s.name}</span>
                    <Check size={12} className="text-green-400" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{s.type}</span>
                    <span className="text-green-400">{s.income}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Expires: {s.expires}</p>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Total Sponsor Income</span>
                  <span className="text-green-400 font-bold">£450/week</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-400">Slots Used</span>
                  <span className="text-white">2 / 4</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Offers */}
        <div className="col-span-8">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-white">Available Offers</h3>
            </div>
            <div className="card-body space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="p-4 bg-surface-light/50 rounded-lg hover:bg-surface-light transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center">
                        <Handshake size={18} className="text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">{offer.brand}</h4>
                          <StatusBadge text={offer.tier} variant={offer.tier === 'Premium' ? 'success' : 'neutral'} />
                          <StatusBadge text={offer.status} variant={offer.status === 'Available' ? 'info' : 'warning'} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{offer.type} Sponsorship</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">{offer.value}</p>
                        <p className="text-[10px] text-gray-500">Offer Value</p>
                      </div>
                      <div className="text-center w-16">
                        <p className="text-sm font-bold text-white">{offer.fit}%</p>
                        <p className="text-[10px] text-gray-500">Brand Fit</p>
                        <div className="mt-1"><ProgressBar value={offer.fit} size="sm" showValue={false} /></div>
                      </div>
                      <div className="text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${
                          offer.risk === 'Low' ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'
                        }`}>{offer.risk} Risk</span>
                      </div>
                      <button className="btn-primary text-xs">
                        View <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
