import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'danger' | 'ghost'
  icon?: ReactNode
}

export function ActionButton({
  children,
  className,
  tone = 'primary',
  icon,
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors',
        {
          'border-scm-green/50 bg-scm-green text-scm-deep hover:bg-emerald-400': tone === 'primary',
          'border-scm-borderStrong bg-scm-panelSoft text-scm-text hover:bg-scm-panelHover': tone === 'secondary',
          'border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20': tone === 'danger',
          'border-transparent bg-transparent text-scm-textSoft hover:bg-scm-panelSoft': tone === 'ghost',
        },
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}