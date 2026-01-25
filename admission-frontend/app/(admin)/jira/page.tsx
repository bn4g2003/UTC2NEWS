'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, FolderKanban } from 'lucide-react';
import { Project } from '@/types/jira';
import { CreateProjectModal } from '@/components/jira/CreateProjectModal';
import { jiraApi } from '@/lib/jira-api';

export default function JiraProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setError(null);
      const data = await jiraApi.projects.getAll();
      setProjects(data);
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      setError(error.message || 'Không thể tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    setShowCreateModal(false);
    fetchProjects();
  };

  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dự Án</h1>
          <p className="text-gray-600 mt-1">Quản lý các dự án Jira của bạn</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo Dự Án
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(`/jira/${project.id}`)}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{project.name}</h3>
                <p className="text-sm text-gray-500">{project.key}</p>
                {project.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>{project._count?.tasks || 0} công việc</span>
                  <span>{project.members?.length || 0} thành viên</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {projects.length === 0 && !error && (
        <div className="text-center py-12">
          <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có dự án nào
          </h3>
          <p className="text-gray-500 mb-4">
            Tạo dự án đầu tiên để bắt đầu
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo Dự Án
          </Button>
        </div>
      )}

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}
