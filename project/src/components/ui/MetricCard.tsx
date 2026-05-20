import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export default function MetricCard({ label, value, subValue, trend, icon: Icon, variant = 'default' }: MetricCardProps) {
  const variantColors = {
    default: 'text-white',
    success: 'text-green-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  };

  return (
    <div className="card card-body flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="metric-label">{label}</span>
        {Icon && <Icon size={14} className="text-gray-500" />}
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${variantColors[variant]}`}>{value}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={`flex items-center text-xs ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="ml-0.5">{trend > 0 ? '+' : ''}{trend}</span>
          </span>
        )}
      </div>
      {subValue && <span className="text-[11px] text-gray-400">{subValue}</span>}
    </div>
  );
}
