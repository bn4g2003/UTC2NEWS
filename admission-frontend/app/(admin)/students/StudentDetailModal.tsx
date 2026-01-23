'use client';

import { useState, useEffect } from 'react';
import { Modal, Descriptions, Table, Tag, Card, Divider, Spin } from 'antd';
import { StudentsService } from '@/api/services/StudentsService';

interface StudentDetailModalProps {
  open: boolean;
  studentId: string | null;
  onClose: () => void;
}

export function StudentDetailModal({
  open,
  studentId,
  onClose,
}: StudentDetailModalProps) {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && studentId) {
      loadStudentDetail();
    }
  }, [open, studentId]);

  const loadStudentDetail = async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      const data = await StudentsService.studentControllerFindOneStudent(studentId);
      setStudent(data);
    } catch (error) {
      console.error('Failed to load student detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const subjectLabels: Record<string, string> = {
    math: 'Toán',
    physics: 'Lý',
    chemistry: 'Hóa',
    biology: 'Sinh',
    literature: 'Văn',
    english: 'Anh',
    history: 'Sử',
    geography: 'Địa',
  };

  const getBlockName = (subjects: string[]) => {
    const blockMap: Record<string, string> = {
      'math,physics,chemistry': 'A00',
      'math,physics,english': 'A01',
      'math,chemistry,biology': 'B00',
      'math,chemistry,english': 'D07',
      'math,literature,english': 'D01',
      'literature,history,geography': 'C00',
    };
    
    const key = subjects.sort().join(',');
    return blockMap[key] || 'Khác';
  };

  const applicationColumns = [
    {
      title: 'NV',
      dataIndex: 'preferencePriority',
      key: 'priority',
      width: 60,
      render: (priority: number) => (
        <Tag color="blue">NV{priority}</Tag>
      ),
    },
    {
      title: 'Ngành',
      key: 'major',
      render: (_: any, record: any) => (
        <div>
          <div className="font-medium">{record.major?.name}</div>
          <div className="text-sm text-gray-500">{record.major?.code}</div>
        </div>
      ),
    },
    {
      title: 'Phương thức',
      dataIndex: 'admissionMethod',
      key: 'method',
      render: (method: string) => {
        const methodLabels: Record<string, string> = {
          entrance_exam: 'Thi đầu vào',
          high_school_transcript: 'Xét học bạ',
          direct_admission: 'Xét tuyển thẳng',
        };
        return methodLabels[method] || method;
      },
    },
    {
      title: 'Tổ hợp',
      key: 'block',
      render: (_: any, record: any) => {
        if (!record.subjectScores) return '-';
        const subjects = Object.keys(record.subjectScores);
        return getBlockName(subjects);
      },
    },
    {
      title: 'Điểm các môn',
      key: 'scores',
      render: (_: any, record: any) => {
        if (!record.subjectScores) return '-';
        return (
          <div className="text-sm">
            {Object.entries(record.subjectScores).map(([subject, score]: [string, any]) => (
              <div key={subject}>
                {subjectLabels[subject] || subject}: <strong>{score}</strong>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Điểm xét tuyển',
      dataIndex: 'calculatedScore',
      key: 'calculatedScore',
      render: (score: number) => (
        <span className="font-semibold text-blue-600">
          {score ? score.toFixed(2) : 'Chưa tính'}
        </span>
      ),
    },
    {
      title: 'Rank',
      dataIndex: 'rankInMajor',
      key: 'rank',
      render: (rank: number) => rank || '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'admissionStatus',
      key: 'status',
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; label: string }> = {
          pending: { color: 'default', label: 'Chờ xử lý' },
          admitted: { color: 'green', label: 'Trúng tuyển' },
          not_admitted: { color: 'red', label: 'Không trúng tuyển' },
        };
        const config = statusConfig[status] || { color: 'default', label: status };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Chi tiết thông tin thí sinh"
      width={1200}
      footer={null}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : student ? (
        <div className="space-y-6">
          {/* Thông tin cá nhân */}
          <Card title="Thông tin cá nhân" size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Họ và tên">
                <strong>{student.fullName}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="CMND/CCCD">
                {student.idCard}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {new Date(student.dateOfBirth).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm ưu tiên">
                <Tag color={student.priorityPoints > 0 ? 'blue' : 'default'}>
                  {student.priorityPoints} điểm
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {student.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {student.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {student.address || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Điểm các môn */}
          {student.scores && (
            <Card title="Điểm các môn học" size="small">
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(student.scores).map(([subject, score]: [string, any]) => (
                  <div
                    key={subject}
                    className="p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="text-sm text-gray-600">
                      {subjectLabels[subject] || subject}
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {score}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Nguyện vọng */}
          <Card title="Danh sách nguyện vọng" size="small">
            {student.applications && student.applications.length > 0 ? (
              <Table
                dataSource={student.applications}
                columns={applicationColumns}
                pagination={false}
                size="small"
                rowKey="id"
                scroll={{ x: 1000 }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Chưa có nguyện vọng nào
              </div>
            )}
          </Card>

          {/* Thông tin đợt tuyển sinh */}
          {student.session && (
            <Card title="Đợt tuyển sinh" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Tên đợt">
                  {student.session.name}
                </Descriptions.Item>
                <Descriptions.Item label="Năm">
                  {student.session.year}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={
                    student.session.status === 'active' ? 'green' :
                    student.session.status === 'upcoming' ? 'blue' : 'default'
                  }>
                    {student.session.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian">
                  {new Date(student.session.startDate).toLocaleDateString('vi-VN')} -{' '}
                  {new Date(student.session.endDate).toLocaleDateString('vi-VN')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Không tìm thấy thông tin thí sinh
        </div>
      )}
    </Modal>
  );
}
