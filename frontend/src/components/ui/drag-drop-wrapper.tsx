'use client'

import { DragDropContext, Droppable, Draggable, DragEndHandler } from '@hello-pangea/dnd'
import { ReactNode } from 'react'

interface DragDropProviderProps {
  children: ReactNode
  onDragEnd: DragEndHandler
}

export function DragDropProvider({ children, onDragEnd }: DragDropProviderProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  )
}

export { Droppable, Draggable }