'use client'

import { DragDropContext, Droppable, Draggable, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { ReactNode } from 'react'

interface DragDropProviderProps {
  children: ReactNode
  onDragEnd: (result: import('@hello-pangea/dnd').DropResult) => void
}

export function DragDropProvider({ children, onDragEnd }: DragDropProviderProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  )
}

export { Droppable, Draggable }