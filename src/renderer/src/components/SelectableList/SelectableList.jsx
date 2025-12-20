import React, { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { SortableGroup } from './ui/SortableGroup'
import { SortableItem } from './ui/SortableItem'
import { cn } from '../../pages/App/utils/cn'

function SelectableList({ tags, groups, mediaTags, selectedItems, onSelect, onReorder, className }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const [activeId, setActiveId] = useState(null)
  const [activeType, setActiveType] = useState(null)

  // Custom collision detection strategy
  const customCollisionDetection = useCallback(
    (args) => {
      const { active, droppableContainers } = args

      // If dragging a group, only interact with other groups
      if (active.data.current?.type === 'group') {
        const groupContainers = droppableContainers.filter(
          (container) => container.data.current?.type === 'group'
        )
        return closestCorners({
          ...args,
          droppableContainers: groupContainers
        })
      }

      return closestCorners(args)
    },
    []
  )

  // Prepare groups including the default one
  const allGroups = [...groups, { id: 'default', name: 'Default' }]

  // Helper to get tags for a specific group
  const getGroupTags = (groupId) => {
    const profileTags = tags
      .filter((tag) => (tag.groupId || 'default') === groupId)
      .map((tag) => ({
        value: tag.name,
        color: mediaTags.includes(tag.name) ? 'green' : undefined,
        groupId: tag.groupId || 'default'
      }))

    if (groupId === 'default') {
      const orphanMediaTags = mediaTags
        .filter((name) => !tags.some((t) => t.name === name))
        .map((name) => ({
          value: name,
          color: 'yellow',
          groupId: 'default'
        }))
      return [...profileTags, ...orphanMediaTags]
    }

    return profileTags
  }

  const handleDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)
    setActiveType(active.data.current?.type || 'tag')
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const activeType = active.data.current?.type || 'tag'
    const overType = over.data.current?.type || 'tag'

    if (activeType === 'tag') {
      let activeTag = tags.find((t) => t.name === activeId)
      let isNewTag = false

      if (!activeTag) {
        if (mediaTags.includes(activeId)) {
          activeTag = { name: activeId, groupId: 'default' }
          isNewTag = true
        } else {
          return
        }
      }

      let overGroupId = null
      if (overType === 'group') {
        overGroupId = overId
      } else {
        const overTag = tags.find((t) => t.name === overId)
        overGroupId = overTag?.groupId || 'default'
      }

      const activeGroupId = activeTag.groupId || 'default'

      if (activeGroupId !== overGroupId) {
        let newTags
        if (isNewTag) {
          newTags = [...tags, { ...activeTag, groupId: overGroupId === 'default' ? undefined : overGroupId }]
        } else {
          newTags = tags.map((t) => {
            if (t.name === activeId) {
              return { ...t, groupId: overGroupId === 'default' ? undefined : overGroupId }
            }
            return t
          })
        }
        onReorder(newTags, groups)
      }
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    setActiveType(null)

    if (!over) return

    if (active.id !== over.id) {
      const activeType = active.data.current?.type || 'tag'
      const overType = over.data.current?.type || 'tag'

      if (activeType === 'group' && overType === 'group') {
        // Reordering groups
        const oldIndex = allGroups.findIndex((g) => g.id === active.id)
        const newIndex = allGroups.findIndex((g) => g.id === over.id)

        // Don't reorder if it's the default group being moved? 
        // Actually user said "can also reorder group"
        const reorderedGroups = arrayMove(allGroups, oldIndex, newIndex)
        // Filter out 'default' before saving
        const finalGroups = reorderedGroups.filter(g => g.id !== 'default')
        onReorder(tags, finalGroups)
      } else if (activeType === 'tag') {
        // Reordering tags within or across groups
        const oldIndex = tags.findIndex((t) => t.name === active.id)
        let newIndex = tags.findIndex((t) => t.name === over.id)

        if (newIndex === -1) {
          // Dropped over a group header
          const overGroupId = over.id
          // Move to the end of that group
          const groupTags = tags.filter(t => (t.groupId || 'default') === overGroupId)
          if (groupTags.length > 0) {
            const lastTagInGroup = groupTags[groupTags.length - 1]
            newIndex = tags.findIndex(t => t.name === lastTagInGroup.name)
          } else {
            newIndex = tags.length // Fallback
          }
        }

        if (oldIndex !== -1 && newIndex !== -1) {
          onReorder(arrayMove(tags, oldIndex, newIndex), groups)
        }
      }
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl bg-slate-800/30 select-none overflow-auto overflow-x-hidden space-y-2 thin-scrollbar p-2',
        className
      )}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={allGroups.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          {allGroups.map((group) => (
            <SortableGroup
              key={group.id}
              id={group.id}
              name={group.name}
              items={getGroupTags(group.id)}
              selectedItems={selectedItems}
              onSelect={onSelect}
              isDefault={group.id === 'default'}
            />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            activeType === 'group' ? (
              <div className="py-1 px-2 bg-slate-700 rounded-md opacity-80 flex items-center justify-center">
                <span className="text-[0.65rem] tracking-widest font-bold text-slate-400 before:border-l-2 before:border-slate-600 before:mr-2 after:border-r-2 after:border-slate-600 after:ml-2">
                  {allGroups.find(g => g.id === activeId)?.name}
                </span>
              </div>
            ) : (
              <div className="bg-slate-700 p-2 rounded-md opacity-80 text-white">
                {activeId}
              </div>
            )
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default React.memo(SelectableList)
