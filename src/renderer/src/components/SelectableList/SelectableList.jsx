import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { SortableItem } from './ui/SortableItem'

function SelectableList({ items, selectedItems, onSelect, onReorder, className } = {}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5 // 5px movement required to start dragging, allows clicking
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active && over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => (item.value ?? item) === active.id)
      const newIndex = items.findIndex((item) => (item.value ?? item) === over.id)
      onReorder?.(arrayMove(items, oldIndex, newIndex))
    }
  }

  return (
    <div
      className={[
        'flex flex-col border border-black/50 border-dashed select-none overflow-auto overflow-x-hidden',
        className
      ].join(' ')}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map((item) => item.value ?? item)}
          strategy={verticalListSortingStrategy}
        >
          {items?.map((item, idx) => {
            const id = item.value ?? item
            return (
              <SortableItem
                key={id}
                id={id}
                item={item}
                isSelected={selectedItems?.includes(id)}
                onSelect={onSelect}
                idx={idx}
              />
            )
          })}
        </SortableContext>
      </DndContext>
    </div>
  )
}

export default React.memo(SelectableList)
