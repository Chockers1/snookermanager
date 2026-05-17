import clsx from 'clsx'

type FormDotsProps = {
  values: string[]
}

export function FormDots({ values }: FormDotsProps) {
  if (values.length === 0) {
    return <span className="text-xs text-scm-textMuted">No form yet</span>
  }

  return (
    <div className="flex items-center gap-1.5">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={clsx('flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold', {
            'bg-scm-green/20 text-emerald-200': value === 'W',
            'bg-scm-red/20 text-rose-200': value === 'L',
            'bg-scm-amber/20 text-amber-100': value === 'D',
          })}
        >
          {value}
        </span>
      ))}
    </div>
  )
}