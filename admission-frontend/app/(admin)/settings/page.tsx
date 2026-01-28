'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, Tag, Space, message, Modal, Input as AntInput, Form } from 'antd';
import { Settings, Save, RotateCcw, Plus, Trash2, Info } from 'lucide-react';
import { ConfigurationService } from '@/api/services/ConfigurationService';

interface BlockDefinition {
    code: string;
    subjects: string[];
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>({});
    const [blocks, setBlocks] = useState<BlockDefinition[]>([]);
    const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const allSettings = await ConfigurationService.configControllerGetAllSettings();
            setSettings(allSettings);

            const admissionBlocks = allSettings.admission_blocks || {};
            const blockArray = Object.entries(admissionBlocks).map(([code, subjects]) => ({
                code,
                subjects: subjects as string[],
            }));
            setBlocks(blockArray);
        } catch (error) {
            console.error('Failed to load settings:', error);
            message.error('Không thể tải cấu hình hệ thống');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBlocks = async () => {
        try {
            setLoading(true);
            const admissionBlocks: Record<string, string[]> = {};
            blocks.forEach(b => {
                admissionBlocks[b.code] = b.subjects;
            });

            await ConfigurationService.configControllerUpdateSetting('admission_blocks', {
                value: admissionBlocks,
            });
            message.success('Cập nhật danh sách tổ hợp thành công');
        } catch (error) {
            console.error('Failed to save blocks:', error);
            message.error('Không thể lưu cấu hình tổ hợp');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBlock = (values: any) => {
        const subjects = values.subjects.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        const newBlock = { code: values.code.toUpperCase(), subjects };

        if (blocks.find(b => b.code === newBlock.code)) {
            message.error('Mã tổ hợp đã tồn tại');
            return;
        }

        setBlocks([...blocks, newBlock]);
        setIsAddBlockOpen(false);
        form.resetFields();
    };

    const removeBlock = (code: string) => {
        setBlocks(blocks.filter(b => b.code !== code));
    };

    const columns = [
        {
            title: 'Mã tổ hợp',
            dataIndex: 'code',
            key: 'code',
            render: (text: string) => <Tag color="blue" className="font-bold">{text}</Tag>,
        },
        {
            title: 'Các môn học',
            dataIndex: 'subjects',
            key: 'subjects',
            render: (subjects: string[]) => (
                <Space wrap>
                    {subjects.map(s => (
                        <Tag key={s} color="geekblue">{s}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: BlockDefinition) => (
                <Button variant="ghost" size="icon" onClick={() => removeBlock(record.code)} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        Cấu hình hệ thống
                    </h1>
                    <p className="text-gray-500">Quản lý các tham số và quy định xét tuyển</p>
                </div>
                <Space>
                    <Button variant="outline" onClick={loadSettings} disabled={loading}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                    <Button onClick={handleSaveBlocks} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu thay đổi
                    </Button>
                </Space>
            </div>

            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">Tổ hợp xét tuyển</h2>
                        <Tooltip title="Định nghĩa danh sách các tổ hợp (Khối) và các môn học tương ứng. Thông tin này được dùng khi Import nguyện vọng và tính toán điều kiện.">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                        </Tooltip>
                    </div>
                    <Button onClick={() => setIsAddBlockOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm tổ hợp
                    </Button>
                </div>

                <Table
                    dataSource={blocks}
                    columns={columns}
                    rowKey="code"
                    pagination={false}
                    loading={loading}
                />
            </Card>

            <Modal
                title="Thêm tổ hợp mới"
                open={isAddBlockOpen}
                onCancel={() => setIsAddBlockOpen(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleAddBlock}>
                    <Form.Item
                        name="code"
                        label="Mã tổ hợp (VD: A00, D01)"
                        rules={[{ required: true, message: 'Vui lòng nhập mã tổ hợp' }]}
                    >
                        <AntInput placeholder="Nhập mã tổ hợp..." />
                    </Form.Item>
                    <Form.Item
                        name="subjects"
                        label="Danh sách môn (phân cách bằng dấu phẩy)"
                        rules={[{ required: true, message: 'Vui lòng nhập các môn học' }]}
                        help="Ví dụ: math, physics, chemistry"
                    >
                        <AntInput placeholder="math, physics, chemistry..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

// Giả lập Tooltip vì lucide không có Tooltip component trực tiếp, dùng Antd nếu cần hoặc bỏ qua
const Tooltip = ({ children, title }: { children: React.ReactNode; title: string }) => {
    return (
        <span title={title} className="inline-flex items-center">
            {children}
        </span>
    );
};
