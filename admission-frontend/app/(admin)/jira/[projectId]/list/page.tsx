'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, LayoutGrid, List, Search } from 'lucide-react';
import { Project, Task, TaskPriority } from '@/types/jira';
import { TaskDetailModal } from '@/components/jira/TaskDetailModal';
import { format } from 'date-fns';
import { jiraApi } from '@/lib/jira-api';

export default function ProjectListPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const data = await jiraApi.projects.getById(projectId);
      setProject(data);
      
      // Flatten all tasks from columns
      const allTasks = data.columns.flatMap((col: any) => 
        (col.tasks || []).map((task: Task) => ({ ...task, column: col }))
      );
      setTasks(allTasks);
    } catch (error: any) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: string, field: string, value: any) => {
    try {
      await jiraApi.tasks.update(taskId, { [field]: value });
      fetchProject();
    } catch (error: any) {
      console.error('Failed to update task:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  if (!project) {
    return <div className="p-8">Không tìm thấy dự án</div>;
  }

  const filteredTasks = tasks.filter((task) =>
    !searchQuery ||
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeColors: Record<string, string> = {
    BUG: 'bg-red-100 text-red-800',
    FEATURE: 'bg-green-100 text-green-800',
    STORY: 'bg-purple-100 text-purple-800',
    TASK: 'bg-blue-100 text-blue-800',
  };

  const typeLabels: Record<string, string> = {
    BUG: 'Lỗi',
    FEATURE: 'Tính năng',
    STORY: 'Story',
    TASK: 'Công việc',
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/jira')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-gray-500">{project.key}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/jira/${projectId}`)}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Dạng Bảng
            </Button>
            <Button variant="default" size="sm">
              <List className="w-4 h-4 mr-2" />
              Dạng Danh Sách
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm công việc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Công Việc</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Độ Ưu Tiên</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead>Người Thực Hiện</TableHead>
              <TableHead>Hạn Hoàn Thành</TableHead>
              <TableHead>Cập Nhật</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedTask(task)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{task.title}</p>
                    {task.labels && task.labels.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {task.labels.map((tl) => (
                          <Badge
                            key={tl.labelId}
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: tl.label.color + '20',
                              color: tl.label.color,
                            }}
                          >
                            {tl.label.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={typeColors[task.type]}>
                    {typeLabels[task.type] || task.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={task.priority}
                    onValueChange={(value: string) =>
                      handleUpdateTask(task.id, 'priority', value)
                    }
                  >
                    <SelectTrigger
                      className="w-32"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TaskPriority.LOW}>Thấp</SelectItem>
                      <SelectItem value={TaskPriority.MEDIUM}>Trung bình</SelectItem>
                      <SelectItem value={TaskPriority.HIGH}>Cao</SelectItem>
                      <SelectItem value={TaskPriority.URGENT}>Khẩn cấp</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={task.columnId}
                    onValueChange={(value: string) =>
                      handleUpdateTask(task.id, 'columnId', value)
                    }
                  >
                    <SelectTrigger
                      className="w-32"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {project.columns.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {task.assignee.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Chưa phân công</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.dueDate ? (
                    <span className="text-sm">
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {format(new Date(task.updatedAt), 'MMM d, HH:mm')}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy công việc
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            fetchProject();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
