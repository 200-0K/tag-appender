import React from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableItem } from './SortableItem'
import { cn } from '../../../pages/App/utils/cn'

export function SortableGroup({ id, name, items, selectedItems, onSelect, isDefault }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: id,
    data: {
      type: 'group',
      name
    }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col">
      <div
        {...attributes}
        {...listeners}
        className="flex items-center w-full rounded-md py-1 mb-2 cursor-grab active:cursor-grabbing"
      >
        <span
          className={cn(
            "w-full flex items-center text-[0.65rem] tracking-widest font-bold dark:text-slate-300",
            "before:content-[''] before:block before:flex-1 before:border-t before:border-slate-600 before:mr-2 before:border-dotted",
            "after:content-['']  after:block  after:flex-1  after:border-t  after:border-slate-600  after:ml-2 after:border-dotted"
          )}
        >
          <span className="px-2">{name}</span>
        </span>
      </div>
      <div className="flex flex-col space-y-1 min-h-[20px]">
        <SortableContext items={items.map((item) => item.value)} strategy={verticalListSortingStrategy}>
          {items.map((item, idx) => (
            <SortableItem
              key={item.value}
              id={item.value}
              item={item}
              isSelected={selectedItems?.includes(item.value)}
              onSelect={onSelect}
              idx={idx}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
