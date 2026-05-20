interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorByValue?: boolean;
}

function getColor(value: number): string {
  if (value >= 90) return 'bg-green-400';
  if (value >= 75) return 'bg-green-500';
  if (value >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function ProgressBar({ value, max = 100, label, showValue = true, size = 'md', colorByValue = true }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      {label && <span className="text-[10px] text-gray-400 w-28 shrink-0 truncate">{label}</span>}
      <div className={`flex-1 min-w-0 ${heights[size]} bg-gray-700/50 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorByValue ? getColor(value) : 'bg-green-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && <span className="text-[10px] font-medium text-gray-300 w-7 shrink-0 text-right">{value}</span>}
    </div>
  );
}
