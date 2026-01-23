'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { DataGrid } from '@/components/admin/DataGrid';
import { FormModal } from '@/components/admin/FormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { QuotaConditionsModal } from './QuotaConditionsModal';
import { quotaSchema } from './schema';
import type { Column } from '@/components/admin/DataGrid/types';
import { Form, Select, InputNumber, Tag } from 'antd';
import { ProgramsService } from '@/api/services/ProgramsService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getBlockCode } from '@/lib/block-code-mapper';

interface Quota {
  id: string;
  sessionId: string;
  majorId: string;
  admissionMethod: string;
  quota: number;
  conditions?: any;
  session?: {
    name: string;
    year: number;
  };
  major?: {
    code: string;
    name: string;
  };
}

export default function QuotasPage() {
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuota, setSelectedQuota] = useState<Quota | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConditionsOpen, setIsConditionsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quotasData, sessionsData, majorsData] = await Promise.all([
        ProgramsService.programControllerFindAllQuotas(),
        ProgramsService.programControllerFindAllSessions(),
        ProgramsService.programControllerFindAllMajors(),
      ]);
      setQuotas(quotasData as Quota[]);
      setSessions(sessionsData);
      setMajors(majorsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedQuota(null);
    setIsFormOpen(true);
  };

  const handleEdit = (quota: Quota) => {
    setSelectedQuota(quota);
    setIsFormOpen(true);
  };

  const handleEditConditions = (quota: Quota) => {
    setSelectedQuota(quota);
    setIsConditionsOpen(true);
  };

  const handleDelete = (quota: Quota) => {
    setSelectedQuota(quota);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedQuota) {
        await ProgramsService.programControllerUpdateQuota(
          selectedQuota.id,
          data
        );
      } else {
        await ProgramsService.programControllerCreateQuota(data);
      }
      await loadData();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to save quota:', error);
      throw error;
    }
  };

  const handleSubmitConditions = async (conditions: any) => {
    if (!selectedQuota) return;

    try {
      await ProgramsService.programControllerUpdateQuota(selectedQuota.id, {
        conditions,
      });
      await loadData();
      setIsConditionsOpen(false);
    } catch (error) {
      console.error('Failed to save conditions:', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuota) return;

    try {
      await ProgramsService.programControllerDeleteQuota(selectedQuota.id);
      await loadData();
      setIsDeleteOpen(false);
    } catch (error) {
      console.error('Failed to delete quota:', error);
    }
  };

  const columns: Column<Quota>[] = [
    {
      key: 'session',
      title: 'Đợt tuyển sinh',
      dataIndex: 'sessionId',
      render: (_, quota) => (
        <div>
          <div className="font-medium">{quota.session?.name}</div>
          <div className="text-sm text-gray-500">Năm {quota.session?.year}</div>
        </div>
      ),
    },
    {
      key: 'major',
      title: 'Ngành',
      dataIndex: 'majorId',
      render: (_, quota) => (
        <div>
          <div className="font-medium">{quota.major?.name}</div>
          <div className="text-sm text-gray-500">{quota.major?.code}</div>
        </div>
      ),
    },
    {
      key: 'admissionMethod',
      title: 'Phương thức',
      dataIndex: 'admissionMethod',
      render: (_, quota) => {
        const methodLabels: Record<string, string> = {
          entrance_exam: 'Thi đầu vào',
          high_school_transcript: 'Xét học bạ',
          direct_admission: 'Xét tuyển thẳng',
        };
        return <Tag color="blue" variant="outlined">{methodLabels[quota.admissionMethod] || quota.admissionMethod}</Tag>;
      },
    },
    {
      key: 'subjectCombinations',
      title: 'Khối/Tổ hợp',
      dataIndex: 'conditions',
      render: (_, quota) => {
        const conditions = quota.conditions as any;
        if (!conditions?.subjectCombinations || conditions.subjectCombinations.length === 0) {
          return <span className="text-gray-400">Chưa cấu hình</span>;
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {conditions.subjectCombinations.map((comb: any, idx: number) => {
              const blockCode = getBlockCode(comb);
              return (
                <Tag key={idx} color="cyan">
                  {blockCode}
                </Tag>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'quota',
      title: 'Chỉ tiêu',
      dataIndex: 'quota',
      render: (_, quota) => (
        <span className="font-semibold text-blue-600">{quota.quota}</span>
      ),
    },
    {
      key: 'conditions',
      title: 'Điều kiện',
      dataIndex: 'conditions',
      render: (_, quota) => {
        if (!quota.conditions) {
          return <span className="text-gray-400">Chưa cấu hình</span>;
        }
        const cond = quota.conditions as any;
        return (
          <div className="text-sm">
            {cond.minTotalScore && (
              <div>Điểm sàn: <Tag color="orange" className="mr-1 mb-1">≥{cond.minTotalScore}</Tag></div>
            )}
            {cond.minSubjectScores && (
              <div className="mt-1">
                Điểm môn: {Object.entries(cond.minSubjectScores).map(([sub, score]: [string, any]) => (
                  <Tag key={sub} className="mr-1 mb-1">{sub}:{score}</Tag>
                ))}
              </div>
            )}
            {cond.subjectCombinations && (
              <div className="mt-1">
                Tổ hợp: {cond.subjectCombinations.map((comb: any, idx: number) => (
                  <Tag key={idx} color="cyan" className="mr-1 mb-1">
                    {Array.isArray(comb) ? comb.join('-') : comb}
                  </Tag>
                ))}
              </div>
            )}
            {cond.priorityBonus?.enabled && (
              <div className="text-green-600 mt-1">
                Ưu tiên: +{cond.priorityBonus.maxBonus}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  const actions = [
    {
      key: 'configure',
      label: 'Cấu hình điều kiện',
      icon: <Settings className="h-4 w-4" />,
      onClick: handleEditConditions,
    },
    {
      key: 'edit',
      label: 'Sửa',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      label: 'Xóa',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      danger: true,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Chỉ tiêu</h1>
          <p className="text-gray-600 mt-1">
            Cấu hình chỉ tiêu và điều kiện tuyển sinh
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm chỉ tiêu
        </Button>
      </div>

      <Card className="p-6">
        <DataGrid
          data={quotas}
          columns={columns}
          loading={loading}
          actions={actions}
        />
      </Card>

      <FormModal<any>
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedQuota ? 'Cập nhật chỉ tiêu' : 'Thêm chỉ tiêu mới'}
        onSubmit={handleSubmit}
        initialValues={selectedQuota || {}}
        schema={quotaSchema}
      >
        {(form) => (
          <div className="space-y-4 py-4">
            <Form.Item label="Đợt tuyển sinh" required>
              <Select
                placeholder="Chọn đợt tuyển sinh"
                value={form.watch('sessionId')}
                onChange={(val) => form.setValue('sessionId', val)}
                options={sessions.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.year})`,
                }))}
              />
            </Form.Item>
            <Form.Item label="Ngành" required>
              <Select
                placeholder="Chọn ngành"
                value={form.watch('majorId')}
                onChange={(val) => form.setValue('majorId', val)}
                options={majors.map((m) => ({
                  value: m.id,
                  label: `${m.name} (${m.code})`,
                }))}
              />
            </Form.Item>
            <Form.Item label="Phương thức" required>
              <Select
                placeholder="Chọn phương thức"
                value={form.watch('admissionMethod')}
                onChange={(val) => form.setValue('admissionMethod', val)}
                options={[
                  { value: 'entrance_exam', label: 'Thi đầu vào' },
                  { value: 'high_school_transcript', label: 'Xét học bạ' },
                  { value: 'direct_admission', label: 'Xét tuyển thẳng' },
                ]}
              />
            </Form.Item>
            <Form.Item label="Chỉ tiêu" required>
              <InputNumber
                className="w-full"
                min={1}
                value={form.watch('quota')}
                onChange={(val) => form.setValue('quota', val || 0)}
              />
            </Form.Item>
          </div>
        )}
      </FormModal>

      <QuotaConditionsModal
        open={isConditionsOpen}
        onClose={() => setIsConditionsOpen(false)}
        quota={selectedQuota}
        onSubmit={handleSubmitConditions}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa chỉ tiêu"
        content={`Bạn có chắc chắn muốn xóa chỉ tiêu này không? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
}
