import React from 'react'
import { cn } from '../../pages/App/utils/cn'

function Button({
  children,
  className,
  dark = false,
  size = 'sm',
  type,
  ...props
}) {
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
        sizes[size] ?? sizes.sm,
        dark
          ? 'bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-600'
          : 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default React.memo(Button)
