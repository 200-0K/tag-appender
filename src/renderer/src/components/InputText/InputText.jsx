import React from 'react'

function InputText({ className, onValueEnter, value, title, ...props }) {
  return (
    <input
      className={['bg-gray-100 px-4 rounded py-1', className].join(' ')}
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
