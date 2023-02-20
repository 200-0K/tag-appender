import React from 'react'

function Button({ children, className, ...props }) {
  return (
    <button
      className={[
        'text-white bg-button rounded px-2 disabled:opacity-70 select-none active:scale-95 transition',
        props.disabled && 'pointer-events-none',
        className
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

export default React.memo(Button)
