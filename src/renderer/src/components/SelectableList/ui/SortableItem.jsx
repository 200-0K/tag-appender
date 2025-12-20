import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical } from '@tabler/icons-react'

export function SortableItem({ id, item, isSelected, onSelect, idx }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center bg-white border border-black/40 group"
    >
      <div
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <IconGripVertical size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <input
          className="hidden peer"
          id={`item-${idx}`}
          type="checkbox"
          value={item.value ?? item}
          checked={isSelected}
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
            'cursor-pointer block py-2 px-1 break-words',
            (item.color === 'green' && `peer-checked:bg-green-400`) ||
              (item.color === 'yellow' && `peer-checked:bg-yellow-400`) ||
              'peer-checked:bg-blue-400'
          ].join(' ')}
          htmlFor={`item-${idx}`}
        >
          {item.value ?? item}
        </label>
      </div>
    </div>
  )
}
