import React from 'react'

function SelectableList({ items, selectedItems, onSelect, className } = {}) {
  return (
    <div
      className={[
        'flex flex-col border border-black/50 border-dashed select-none overflow-auto',
        className
      ].join(' ')}
    >
      {items?.map((item, idx) => (
        <div key={`item-${idx}`}>
          <input
            className="hidden peer"
            id={`item-${idx}`}
            type="checkbox"
            value={item.value ?? item}
            checked={selectedItems?.includes(item.value ?? item)}
            onChange={(e) => {
              const {
                nativeEvent: { ctrlKey },
                target: { value, checked }
              } = e
              onSelect?.(value, { checked, ctrlKey })
            }}
          />
          <label
            className={[
              'cursor-pointer block bg-white py-2 border border:black/40 p-1 break-words',
              (item.color === 'green' && `peer-checked:bg-green-400`) ||
                (item.color === 'yellow' && `peer-checked:bg-yellow-400`) ||
                'peer-checked:bg-blue-400'
            ].join(' ')}
            htmlFor={`item-${idx}`}
          >
            {item.value ?? item}
          </label>
        </div>
      ))}
    </div>
  )
}

export default React.memo(SelectableList)
