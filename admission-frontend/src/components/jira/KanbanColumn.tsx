'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Task } from '@/types/jira';
import { SortableTaskCard } from './SortableTaskCard';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function KanbanColumn({ column, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  // Determine if this is the "Dừng" column for special styling
  const isBlockedColumn = column.name === 'Dừng';

  return (
    <div className={`flex flex-col flex-1 min-w-[280px] max-w-[320px] rounded-lg shadow-sm border ${
      isBlockedColumn ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Column Header */}
      <div className={`p-3 border-b ${
        isBlockedColumn ? 'bg-red-100 border-red-200' : 'bg-white border-gray-200'
      } rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: column.color || '#94a3b8' }}
            />
            <h3 className={`font-semibold text-sm ${
              isBlockedColumn ? 'text-red-800' : 'text-gray-800'
            }`}>
              {column.name}
            </h3>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              isBlockedColumn 
                ? 'bg-red-200 text-red-700' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-250px)]"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className={`text-center py-8 text-xs italic ${
            isBlockedColumn ? 'text-red-400' : 'text-gray-400'
          }`}>
            {isBlockedColumn ? 'Công việc bị dừng sẽ hiện ở đây' : 'Kéo thả công việc vào đây'}
          </div>
        )}
      </div>
    </div>
  );
}
