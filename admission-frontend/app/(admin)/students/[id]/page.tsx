'use client';

import { useState, useEffect, use } from 'react';
import { Descriptions, Table, Tag, Card, Spin, Button, Form, Input, Row, Col, InputNumber, message, Space } from 'antd';
import { EditOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { StudentsService } from '@/api/services/StudentsService';
import { ImageUpload } from '@/components/admin/ImageUpload/ImageUpload';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (id) {
            loadStudentDetail();
        }
    }, [id]);

    const loadStudentDetail = async () => {
        if (!id) return;

        setLoading(true);
        try {
            const data = await StudentsService.studentControllerGetStudent(id);
            setStudent(data);
            form.setFieldsValue({
                ...data,
                dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth).format('YYYY-MM-DD') : undefined,
                scores: data.scores || {},
            });
        } catch (error) {
            console.error('Failed to load student detail:', error);
            message.error('Không thể tải thông tin thí sinh');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (values: any) => {
        if (!id) return;

        setUpdating(true);
        try {
            const updateData = {
                ...values,
                dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : undefined,
                priorityPoints: Number(values.priorityPoints),
            };

            await StudentsService.studentControllerUpdateStudent(id, updateData);
            message.success('Cập nhật thông tin thành công');
            setIsEditing(false);
            loadStudentDetail();
        } catch (error) {
            console.error('Failed to update student:', error);
            message.error('Cập nhật thất bại');
        } finally {
            setUpdating(false);
        }
    };

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
            render: (score: any) => (
                <span className="font-semibold text-blue-600">
                    {score !== null && score !== undefined && !isNaN(Number(score)) ? Number(score).toFixed(2) : 'Chưa tính'}
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

    if (loading && !student) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (!student && !loading) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold mb-4">Không tìm thấy thông tin thí sinh</h2>
                <Link href="/students">
                    <Button icon={<ArrowLeftOutlined />}>Quay lại danh sách</Button>
                </Link>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.back()}
                    >
                        Quay lại
                    </Button>
                    <h1 className="text-2xl font-semibold m-0">
                        {isEditing ? 'Chỉnh sửa thông tin thí sinh' : 'Chi tiết thông tin thí sinh'}
                    </h1>
                </div>

                <Space>
                    {isEditing ? (
                        <>
                            <Button onClick={() => setIsEditing(false)}>
                                Hủy bỏ
                            </Button>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={updating}
                                onClick={() => form.submit()}
                            >
                                Lưu thay đổi
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => setIsEditing(true)}
                        >
                            Chỉnh sửa
                        </Button>
                    )}
                </Space>
            </div>

            {isEditing ? (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                    initialValues={{
                        ...student,
                        dateOfBirth: student.dateOfBirth ? dayjs(student.dateOfBirth).format('YYYY-MM-DD') : undefined,
                    }}
                >
                    <Row gutter={24}>
                        <Col span={16}>
                            <Card title="Thông tin chung" size="small" className="mb-4">
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="fullName"
                                            label="Họ và tên"
                                            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                                        >
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="idCard"
                                            label="CCCD/CMND"
                                            rules={[{ required: true, message: 'Vui lòng nhập số CCCD/CMND' }]}
                                        >
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="dateOfBirth"
                                            label="Ngày sinh"
                                            rules={[{ required: true, message: 'Vui lòng nhập ngày sinh' }]}
                                        >
                                            <Input type="date" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="email" label="Email">
                                            <Input type="email" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="phone" label="Số điện thoại">
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="priorityPoints" label="Điểm ưu tiên">
                                            <InputNumber min={0} max={3} step={0.01} style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="address" label="Địa chỉ">
                                            <Input.TextArea rows={2} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card title="Điểm số (Học bạ/Thi)" size="small">
                                <Row gutter={16}>
                                    {Object.keys(subjectLabels).map((subject) => (
                                        <Col span={6} key={subject}>
                                            <Form.Item
                                                name={['scores', subject]}
                                                label={subjectLabels[subject]}
                                            >
                                                <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                    ))}
                                </Row>
                            </Card>
                        </Col>

                        <Col span={8}>
                            <Card title="Hình ảnh & Tài liệu" size="small">
                                <Form.Item name="photo3x4" label="Ảnh chân dung (3x4)">
                                    <ImageUpload />
                                </Form.Item>
                                <Form.Item name="idCardPhoto" label="Ảnh CCCD/CMND">
                                    <ImageUpload />
                                </Form.Item>
                                <Form.Item name="documentPdf" label="Tài liệu/Hồ sơ (PDF URL)">
                                    <Input placeholder="Link đến tài liệu PDF" />
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            ) : (
                <div className="space-y-6">
                    <Row gutter={24}>
                        <Col span={16}>
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
                                    <Descriptions.Item label="Hồ sơ">
                                        {student.documentPdf ? (
                                            <a href={student.documentPdf} target="_blank" rel="noopener noreferrer">Xem hồ sơ</a>
                                        ) : 'Chưa có'}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>

                            {/* Điểm các môn */}
                            {student.scores && (
                                <Card title="Điểm các môn học" size="small" className="mt-6">
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
                            <Card title="Danh sách nguyện vọng" size="small" className="mt-6">
                                {student.applications && student.applications.length > 0 ? (
                                    <Table
                                        dataSource={student.applications}
                                        columns={applicationColumns}
                                        pagination={false}
                                        size="small"
                                        rowKey="id"
                                        scroll={{ x: 'max-content' }}
                                    />
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        Chưa có nguyện vọng nào
                                    </div>
                                )}
                            </Card>
                        </Col>

                        <Col span={8}>
                            <Card title="Hình ảnh" size="small">
                                <div style={{ marginBottom: 16 }}>
                                    <div className="font-semibold mb-2">Ảnh chân dung (3x4)</div>
                                    {student.photo3x4 ? (
                                        <img
                                            src={student.photo3x4}
                                            alt="3x4"
                                            style={{ width: '100%', maxWidth: '200px', borderRadius: '4px', border: '1px solid #eee' }}
                                        />
                                    ) : <div className="text-gray-400 italic">Chưa có ảnh</div>}
                                </div>

                                <div>
                                    <div className="font-semibold mb-2">Ảnh CCCD/CMND</div>
                                    {student.idCardPhoto ? (
                                        <img
                                            src={student.idCardPhoto}
                                            alt="CCCD"
                                            style={{ width: '100%', borderRadius: '4px', border: '1px solid #eee' }}
                                        />
                                    ) : <div className="text-gray-400 italic">Chưa có ảnh</div>}
                                </div>
                            </Card>

                            {/* Thông tin đợt tuyển sinh */}
                            {student.session && (
                                <Card title="Đợt tuyển sinh" size="small" className="mt-6">
                                    <Descriptions column={1} bordered size="small">
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
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    );
}
