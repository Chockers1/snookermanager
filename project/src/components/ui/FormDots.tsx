interface FormDotsProps {
  form: ('W' | 'L' | 'D')[];
  size?: 'sm' | 'md';
}

export default function FormDots({ form, size = 'md' }: FormDotsProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className="flex gap-1 items-center">
      {form.map((result, i) => (
        <div
          key={i}
          className={`${dotSize} rounded-full ${
            result === 'W' ? 'bg-green-500' : result === 'L' ? 'bg-red-500' : 'bg-amber-500'
          }`}
          title={result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
        />
      ))}
    </div>
  );
}
