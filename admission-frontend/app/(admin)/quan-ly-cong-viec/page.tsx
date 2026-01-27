'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, FolderKanban, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Project } from '@/types/jira';
import { CreateProjectModal } from '@/components/jira/CreateProjectModal';
import { jiraApi } from '@/lib/jira-api';

export default function WorkManagementPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [projectsData, summaryData] = await Promise.all([
        jiraApi.projects.getAll(),
        jiraApi.statistics.getMySummary(),
      ]);
      setProjects(projectsData);
      setSummary(summaryData);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setError(error.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    setShowCreateModal(false);
    fetchData();
  };

  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Công Việc</h1>
          <p className="text-gray-600 mt-1">Quản lý dự án và công việc của bạn</p>
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Công việc được giao</p>
                <p className="text-3xl font-bold mt-2">{summary.assignedToMe}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Công việc đã tạo</p>
                <p className="text-3xl font-bold mt-2">{summary.reportedByMe}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dự án tham gia</p>
                <p className="text-3xl font-bold mt-2">{summary.totalProjects}</p>
              </div>
              <FolderKanban className="w-10 h-10 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Projects Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Dự án của bạn</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/quan-ly-cong-viec/${project.id}`)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.key}</p>
                  {project.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {project._count?.tasks || 0} công việc
                    </span>
                    <span className="flex items-center gap-1">
                      <FolderKanban className="w-4 h-4" />
                      {project.members?.length || 0} thành viên
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {projects.length === 0 && !error && (
        <div className="text-center py-12">
          <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có dự án nào
          </h3>
          <p className="text-gray-500 mb-4">
            Tạo dự án đầu tiên để bắt đầu quản lý công việc
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
