interface StatusBadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export default function StatusBadge({ text, variant = 'neutral' }: StatusBadgeProps) {
  const variants = {
    success: 'bg-green-600/20 text-green-400 border-green-600/30',
    warning: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
    danger: 'bg-red-600/20 text-red-400 border-red-600/30',
    info: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    neutral: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${variants[variant]}`}>
      {text}
    </span>
  );
}
