'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KanbanBoard } from '@/components/jira/KanbanBoard';
import { TaskDetailModal } from '@/components/jira/TaskDetailModal';
import { CreateTaskModal } from '@/components/jira/CreateTaskModal';
import { ProjectDashboard } from '@/components/jira/ProjectDashboard';
import { ProjectMembersModal } from '@/components/jira/ProjectMembersModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Search, Filter, BarChart3, Users, Kanban } from 'lucide-react';
import { Project, Task } from '@/types/jira';
import { jiraApi } from '@/lib/jira-api';

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setError(null);
      const data = await jiraApi.projects.getById(projectId);
      setProject(data);
    } catch (error: any) {
      console.error('Failed to fetch project:', error);
      setError(error.message || 'Không thể tải dự án');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTaskUpdate = () => {
    fetchProject();
    setSelectedTask(null);
  };

  const handleTaskCreated = () => {
    setShowCreateTask(false);
    fetchProject();
  };

  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  if (!project) {
    return (
      <div className="p-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          'Không tìm thấy dự án'
        )}
      </div>
    );
  }

  const userId = localStorage.getItem('userId');
  const filteredColumns = project.columns.map((column) => ({
    ...column,
    tasks: column.tasks?.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAssignee =
        !filterAssignedToMe || task.assigneeId === userId;
      return matchesSearch && matchesAssignee;
    }),
  }));

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/quan-ly-cong-viec')}
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
              onClick={() => setShowMembers(true)}
            >
              <Users className="w-4 h-4 mr-2" />
              Thành viên ({project.members?.length || 0})
            </Button>
            <Button onClick={() => setShowCreateTask(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo Công Việc
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="board" className="flex items-center gap-2">
              <Kanban className="w-4 h-4" />
              Bảng Kanban
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Thống kê
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters - Only show on board tab */}
        {activeTab === 'board' && (
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm công việc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={filterAssignedToMe ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterAssignedToMe(!filterAssignedToMe)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Của tôi
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'board' ? (
          <KanbanBoard
            columns={filteredColumns}
            onTaskClick={handleTaskClick}
            onTaskUpdate={fetchProject}
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <ProjectDashboard projectId={projectId} />
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          projectId={projectId}
          columns={project.columns}
          members={project.members}
          open={showCreateTask}
          onClose={() => setShowCreateTask(false)}
          onSuccess={handleTaskCreated}
        />
      )}

      {showMembers && (
        <ProjectMembersModal
          open={showMembers}
          onClose={() => setShowMembers(false)}
          projectId={projectId}
          members={project.members}
          onUpdate={fetchProject}
        />
      )}
    </div>
  );
}
