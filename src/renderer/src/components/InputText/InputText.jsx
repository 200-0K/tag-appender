import React from 'react'

function InputText({ className, onValueEnter, value, title, ...props }) {
  return (
    <input
      className={[
        'bg-white/5 dark:bg-slate-800 border border-slate-700 placeholder-slate-400',
        'text-slate-900 dark:text-slate-100',
        'px-4 rounded-lg py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition',
        className
      ].join(' ')}
      type="text"
      onKeyDown={(e) => {
        const {
          key,
          target: { value }
        } = e
        if (!(key === 'Enter' && value.length > 0)) return
        onValueEnter?.(value, e)
      }}
      value={value}
      title={title ?? value}
      {...props}
    />
  )
}

export default React.memo(InputText)
