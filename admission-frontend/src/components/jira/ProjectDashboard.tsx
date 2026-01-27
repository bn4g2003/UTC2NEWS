'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Users,
  ListTodo
} from 'lucide-react';
import { jiraApi } from '@/lib/jira-api';

interface ProjectStatistics {
  totalTasks: number;
  overdueTasksCount: number;
  tasksByStatus: Array<{
    columnId: string;
    columnName: string;
    color?: string;
    count: number;
  }>;
  tasksByPriority: Array<{
    priority: string;
    count: number;
  }>;
  tasksByType: Array<{
    type: string;
    count: number;
  }>;
  tasksByAssignee: Array<{
    assigneeId: string;
    assigneeName: string;
    count: number;
  }>;
  recentActivity: any[];
}

interface ProjectDashboardProps {
  projectId: string;
}

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-blue-500',
};

const priorityLabels: Record<string, string> = {
  URGENT: 'Khẩn cấp',
  HIGH: 'Cao',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
};

const typeLabels: Record<string, string> = {
  BUG: 'Lỗi',
  FEATURE: 'Tính năng',
  STORY: 'User Story',
  TASK: 'Công việc',
};

const actionLabels: Record<string, string> = {
  created: 'đã tạo',
  updated: 'đã cập nhật',
  moved: 'đã di chuyển',
  commented: 'đã bình luận',
  deleted: 'đã xóa',
  uploaded_attachment: 'đã tải lên file',
  deleted_attachment: 'đã xóa file',
  created_project: 'đã tạo dự án',
  added_member: 'đã thêm thành viên',
  removed_member: 'đã xóa thành viên',
};

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const [stats, setStats] = useState<ProjectStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [projectId]);

  const fetchStatistics = async () => {
    try {
      const data = await jiraApi.statistics.getProjectStats(projectId);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải thống kê...</div>;
  }

  if (!stats) {
    return <div className="p-6">Không thể tải thống kê</div>;
  }

  const completedTasks = stats.tasksByStatus.find(s => s.columnName === 'Hoàn Thành')?.count || 0;
  const completionRate = stats.totalTasks > 0 ? Math.round((completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng công việc</p>
              <p className="text-3xl font-bold mt-2">{stats.totalTasks}</p>
            </div>
            <ListTodo className="w-10 h-10 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hoàn thành</p>
              <p className="text-3xl font-bold mt-2">{completedTasks}</p>
              <p className="text-xs text-green-600 mt-1">{completionRate}% hoàn thành</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Quá hạn</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{stats.overdueTasksCount}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Thành viên</p>
              <p className="text-3xl font-bold mt-2">{stats.tasksByAssignee.length}</p>
            </div>
            <Users className="w-10 h-10 text-purple-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Công việc theo trạng thái
          </h3>
          <div className="space-y-3">
            {stats.tasksByStatus.map((item) => (
              <div key={item.columnId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.columnName}</span>
                  <span className="text-gray-600">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${(item.count / stats.totalTasks) * 100}%`,
                      backgroundColor: item.color || '#3b82f6',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tasks by Priority */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Công việc theo độ ưu tiên
          </h3>
          <div className="space-y-3">
            {stats.tasksByPriority.map((item) => (
              <div key={item.priority} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${priorityColors[item.priority]}`} />
                  <span className="text-sm font-medium">{priorityLabels[item.priority]}</span>
                </div>
                <span className="text-sm text-gray-600">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Tasks by Type */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Công việc theo loại</h3>
          <div className="space-y-3">
            {stats.tasksByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm font-medium">{typeLabels[item.type]}</span>
                <span className="text-sm text-gray-600">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Tasks by Assignee */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Công việc theo người thực hiện
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stats.tasksByAssignee.map((item) => (
              <div key={item.assigneeId} className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{item.assigneeName}</span>
                <span className="text-sm text-gray-600">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Hoạt động gần đây
        </h3>
        <div className="space-y-3">
          {stats.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 text-sm border-b pb-3 last:border-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-blue-600">
                  {activity.user.fullName.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p>
                  <span className="font-medium">{activity.user.fullName}</span>
                  {' '}{actionLabels[activity.action] || activity.action}{' '}
                  {activity.task && (
                    <span className="font-medium">{activity.task.title}</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
