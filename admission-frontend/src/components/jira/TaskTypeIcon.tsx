import { Bug, Sparkles, BookOpen, CheckSquare } from 'lucide-react';
import { TaskType } from '@/types/jira';

interface TaskTypeIconProps {
  type: TaskType;
  className?: string;
}

const typeConfig = {
  [TaskType.BUG]: {
    icon: Bug,
    color: 'text-red-600',
    bg: 'bg-red-50',
    label: 'Lỗi',
  },
  [TaskType.FEATURE]: {
    icon: Sparkles,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    label: 'Tính năng',
  },
  [TaskType.STORY]: {
    icon: BookOpen,
    color: 'text-green-600',
    bg: 'bg-green-50',
    label: 'User Story',
  },
  [TaskType.TASK]: {
    icon: CheckSquare,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    label: 'Công việc',
  },
};

export function TaskTypeIcon({ type, className = '' }: TaskTypeIconProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.color} ${className}`}
      title={config.label}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  );
}
