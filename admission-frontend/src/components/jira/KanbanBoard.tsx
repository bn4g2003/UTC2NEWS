'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { Column, Task } from '@/types/jira';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { jiraApi } from '@/lib/jira-api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface KanbanBoardProps {
  columns: Column[];
  onTaskClick: (task: Task) => void;
  onTaskUpdate: () => void;
}

export function KanbanBoard({ columns, onTaskClick, onTaskUpdate }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [pendingMove, setPendingMove] = useState<{
    taskId: string;
    columnId: string;
    position: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = columns
      .flatMap((col) => col.tasks || [])
      .find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find source task
    const sourceColumn = columns.find((col) =>
      col.tasks?.some((t) => t.id === taskId)
    );
    const task = sourceColumn?.tasks?.find((t) => t.id === taskId);

    if (!task) return;

    // Determine target column
    let targetColumnId: string;
    let targetPosition: number;

    // Check if dropped on a column
    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      targetColumnId = targetColumn.id;
      // Place at the end of the column
      const maxPos = Math.max(...(targetColumn.tasks?.map(t => t.position) || [0]), 0);
      targetPosition = maxPos + 1000;
    } else {
      // Dropped on another task
      const targetTask = columns
        .flatMap((col) => col.tasks || [])
        .find((t) => t.id === overId);

      if (!targetTask) return;

      targetColumnId = targetTask.columnId;
      targetPosition = targetTask.position;
    }

    // Don't update if nothing changed
    if (task.columnId === targetColumnId && task.position === targetPosition) {
      return;
    }

    // Check if moving to "Dừng" column
    const targetCol = columns.find((col) => col.id === targetColumnId);
    if (targetCol && targetCol.name === 'Dừng') {
      // Show dialog to ask for reason
      setPendingMove({ taskId, columnId: targetColumnId, position: targetPosition });
      setShowBlockedDialog(true);
      return;
    }

    // Update task position normally
    try {
      await jiraApi.tasks.move(taskId, {
        columnId: targetColumnId,
        position: targetPosition,
      });
      onTaskUpdate();
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleConfirmBlocked = async () => {
    if (!pendingMove || !blockedReason.trim()) return;

    try {
      await jiraApi.tasks.move(pendingMove.taskId, {
        columnId: pendingMove.columnId,
        position: pendingMove.position,
        blockedReason: blockedReason.trim(),
      });
      setShowBlockedDialog(false);
      setBlockedReason('');
      setPendingMove(null);
      onTaskUpdate();
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleCancelBlocked = () => {
    setShowBlockedDialog(false);
    setBlockedReason('');
    setPendingMove(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex gap-4 p-4 h-full min-w-max">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={column.tasks || []}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-80">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>

      {/* Blocked Reason Dialog */}
      <Dialog open={showBlockedDialog} onOpenChange={setShowBlockedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lý Do Dừng Công Việc</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blockedReason" className="text-sm font-medium">
                Vui lòng nhập lý do tại sao công việc này bị dừng hoặc không thể hoàn thành:
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="blockedReason"
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="Ví dụ: Thiếu tài nguyên, chờ phê duyệt, phụ thuộc vào task khác..."
                rows={4}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelBlocked}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirmBlocked}
              disabled={!blockedReason.trim()}
            >
              Xác Nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
