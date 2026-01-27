import { AlertCircle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { TaskPriority } from '@/types/jira';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

const priorityConfig = {
  [TaskPriority.URGENT]: {
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Khẩn cấp',
  },
  [TaskPriority.HIGH]: {
    icon: ArrowUp,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Cao',
  },
  [TaskPriority.MEDIUM]: {
    icon: ArrowRight,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Trung bình',
  },
  [TaskPriority.LOW]: {
    icon: ArrowDown,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Thấp',
  },
};

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${config.bg} ${config.color} ${config.border} ${className}`}
      title={config.label}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  );
}
