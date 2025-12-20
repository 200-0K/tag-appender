import React from 'react'
import { cn } from '../../../pages/App/utils/cn'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical } from '@tabler/icons-react'

export function SortableItem({ id, item, isSelected, onSelect, idx }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: id,
    data: {
      type: 'tag'
    }
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
      className={cn(
        'flex items-center border rounded-md',
        'transition-colors',
        // base dark item appearance
        'bg-slate-800 border-slate-700',
        // selected variants applied to whole item
        {
          'bg-emerald-500 text-white border-emerald-500 shadow-md': isSelected && item.color === 'green',
          'bg-amber-500 text-slate-900 border-amber-500 shadow-md': isSelected && item.color === 'yellow',
          'bg-indigo-600 text-white border-indigo-600 shadow-md': isSelected && item.color !== 'green' && item.color !== 'yellow'
        }
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn('p-1 cursor-grab active:cursor-grabbing', {
          'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200': !isSelected,
          'text-white': isSelected
        })}
      >
        <IconGripVertical size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <input
          className="hidden"
          id={`checkbox-${id}`}
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
          className={cn('cursor-pointer block py-2 px-3 break-words truncate', {
            // label text color: dark in light-mode, light in dark-mode when not selected
            'text-slate-900 dark:text-slate-200': !isSelected,
            'text-white': isSelected
          })}
          htmlFor={`checkbox-${id}`}
        >
          {item.value ?? item}
        </label>
      </div>
    </div>
  )
}
