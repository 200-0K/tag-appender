import React from 'react'
import { cn } from '../../pages/App/utils/cn'

function Button({
  children,
  className,
  variant = 'primary',
  size = 'sm',
  type,
  ...props
}) {
  const variants = {
    primary: 'bg-indigo-600 text-white active:bg-indigo-700',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
    outline: 'border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800',
    ghost: 'bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200',
    destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
  }

  const sizes = {
    xs: 'h-7 px-2 text-xs rounded-md',
    sm: 'h-8 px-2.5 text-xs rounded-md',
    md: 'h-9 px-3 text-sm rounded-lg'
  }

  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'inline-flex items-center justify-center font-medium leading-none',
        'transition-colors active:translate-y-px',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.sm,
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default React.memo(Button)
