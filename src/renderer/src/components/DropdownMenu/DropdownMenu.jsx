import React from 'react'

function DropdownMenu({ items, handleItemChange, selectedItem, className, ...props }) {
  return (
    <select
      value={selectedItem || false}
      className={[
        'bg-slate-800 border border-slate-700 rounded-lg px-2 py-1',
        'text-slate-900 dark:text-slate-200',
        className
      ].join(' ')}
      onChange={(e) => e.target.value && handleItemChange(e.target.value)}
      {...props}
    >
      {items?.map((item, idx) => (
        <option key={`opt-${idx}`} value={item.value ?? item}>
          {item.displayValue ?? item}
        </option>
      ))}
    </select>
  )
}

export default React.memo(DropdownMenu)
