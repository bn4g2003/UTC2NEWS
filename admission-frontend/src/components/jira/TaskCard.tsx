'use client';

import { Task, TaskPriority, TaskType } from '@/types/jira';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Bug,
  Lightbulb,
  BookOpen,
  CheckSquare,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Paperclip,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const typeIcons = {
  BUG: Bug,
  FEATURE: Lightbulb,
  STORY: BookOpen,
  TASK: CheckSquare,
};

const typeColors = {
  BUG: 'text-red-600 bg-red-50 border-red-200',
  FEATURE: 'text-green-600 bg-green-50 border-green-200',
  STORY: 'text-purple-600 bg-purple-50 border-purple-200',
  TASK: 'text-blue-600 bg-blue-50 border-blue-200',
};

const priorityConfig = {
  URGENT: { icon: ArrowUp, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Khẩn cấp' },
  HIGH: { icon: ArrowUp, color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Cao' },
  MEDIUM: { icon: ArrowDown, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Trung bình' },
  LOW: { icon: ArrowDown, color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'Thấp' },
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const TypeIcon = typeIcons[task.type as TaskType];
  const typeColor = typeColors[task.type as TaskType];
  const priorityInfo = priorityConfig[task.priority as TaskPriority];
  const PriorityIcon = priorityInfo.icon;

  return (
    <Card
      className="p-2.5 hover:shadow-lg transition-all cursor-pointer bg-white border-l-4"
      style={{ borderLeftColor: typeColors[task.type as TaskType].split(' ')[0].replace('text-', '#') }}
      onClick={onClick}
    >
      {/* Header - Type and Priority */}
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${typeColor}`}>
          <TypeIcon className="w-3 h-3" />
          <span className="text-[10px]">
            {task.type === 'BUG' && 'Lỗi'}
            {task.type === 'FEATURE' && 'Tính năng'}
            {task.type === 'STORY' && 'Story'}
            {task.type === 'TASK' && 'Công việc'}
          </span>
        </div>
        <div className={`flex items-center gap-0.5 ${priorityInfo.color}`} title={priorityInfo.label}>
          <PriorityIcon className="w-3 h-3" />
        </div>
      </div>

      {/* Title */}
      <h4 className="font-medium text-xs mb-2 line-clamp-2 leading-tight">{task.title}</h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 2).map((tl: any) => (
            <Badge
              key={tl.labelId}
              variant="secondary"
              className="text-[9px] px-1 py-0 h-4"
              style={{
                backgroundColor: tl.label.color + '20',
                color: tl.label.color,
                borderColor: tl.label.color,
              }}
            >
              {tl.label.name}
            </Badge>
          ))}
          {task.labels.length > 2 && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
              +{task.labels.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {/* Assignee Avatar */}
          {task.assignee ? (
            <Avatar className="w-5 h-5 border border-gray-200">
              <AvatarFallback className="text-[9px] bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                {task.assignee.fullName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-[9px] text-gray-400">?</span>
            </div>
          )}

          {/* Counts */}
          <div className="flex items-center gap-1.5">
            {task._count && task._count.comments > 0 && (
              <div className="flex items-center gap-0.5 text-gray-500">
                <MessageSquare className="w-3 h-3" />
                <span className="text-[10px]">{task._count.comments}</span>
              </div>
            )}
            {task._count && task._count.attachments > 0 && (
              <div className="flex items-center gap-0.5 text-gray-500">
                <Paperclip className="w-3 h-3" />
                <span className="text-[10px]">{task._count.attachments}</span>
              </div>
            )}
          </div>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            new Date(task.dueDate) < new Date() 
              ? 'bg-red-100 text-red-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {new Date(task.dueDate).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
