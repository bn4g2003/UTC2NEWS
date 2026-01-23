'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Input, Select, Tag, message } from 'antd';
import { PlusOutlined, SearchOutlined, ImportOutlined } from '@ant-design/icons';
import { DataGrid } from '@/components/admin/DataGrid';
import { usePagination } from '@/hooks/usePagination';
import { useModal } from '@/hooks/useModal';
import { StudentsService } from '@/api/services/StudentsService';
import dynamic from 'next/dynamic';

const ImportPreferencesModal = dynamic(() => import('./ImportPreferencesModal'), { ssr: false });

export default function PreferencesPage() {
    const [preferences, setPreferences] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');

    const pagination = usePagination(10);
    const importModal = useModal();

    // Load admission sessions
    useEffect(() => {
        const loadSessions = async () => {
            try {
                const { ProgramsService } = await import('@/api/services/ProgramsService');
                const response = await ProgramsService.programControllerFindAllSessions();
                const sessionList = response.data || response || [];
                setSessions(sessionList);
                if (sessionList.length > 0 && !selectedSessionId) {
                    setSelectedSessionId(sessionList[0].id);
                }
            } catch (error) {
                message.error('Không thể tải danh sách đợt tuyển sinh');
            }
        };
        loadSessions();
    }, []);

    const fetchPreferences = useCallback(async () => {
        if (!selectedSessionId) return;
        setLoading(true);
        try {
            // For now, we reuse student listing with applications
            const response = await StudentsService.studentControllerFindAllStudents(
                '1', '1000', searchQuery, selectedSessionId
            );

            const allPrefs: any[] = [];
            response.data?.forEach((student: any) => {
                student.applications?.forEach((app: any) => {
                    allPrefs.push({
                        id: app.id,
                        idCard: student.idCard,
                        fullName: student.fullName,
                        majorName: app.major?.name,
                        majorCode: app.major?.code,
                        priority: app.preferencePriority,
                        method: app.admissionMethod,
                        status: app.admissionStatus,
                        score: app.calculatedScore,
                    });
                });
            });

            setPreferences(allPrefs);
            pagination.setTotal(allPrefs.length);
        } catch (err) {
            setError(err as Error);
            message.error('Failed to load preferences');
        } finally {
            setLoading(false);
        }
    }, [selectedSessionId, searchQuery]); // Removed pagination from dependencies

    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    const columns = [
        { key: 'idCard', title: 'Số CCCD', dataIndex: 'idCard', sortable: true },
        { key: 'fullName', title: 'Họ tên', dataIndex: 'fullName', sortable: true },
        { key: 'majorCode', title: 'Mã ngành', dataIndex: 'majorCode' },
        { key: 'majorName', title: 'Tên ngành', dataIndex: 'majorName' },
        { key: 'priority', title: 'Ưu tiên', dataIndex: 'priority', sortable: true },
        { key: 'method', title: 'Tổ hợp/PT', dataIndex: 'method' },
        { key: 'score', title: 'Điểm XT', dataIndex: 'score', render: (val: any) => val?.toFixed(2) || 'N/A' },
        {
            key: 'status',
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (status: string) => <Tag color={status === 'admitted' ? 'green' : 'blue'}>{status}</Tag>
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Quản lý Nguyện vọng</h1>
                <Space>
                    <Select
                        placeholder="Chọn đợt tuyển sinh"
                        style={{ width: 250 }}
                        value={selectedSessionId}
                        onChange={setSelectedSessionId}
                    >
                        {sessions.map(s => (
                            <Select.Option key={s.id} value={s.id}>{s.name} ({s.year})</Select.Option>
                        ))}
                    </Select>
                    <Button
                        icon={<ImportOutlined />}
                        onClick={importModal.open}
                        disabled={!selectedSessionId}
                    >
                        Import Nguyện vọng
                    </Button>
                </Space>
            </div>

            <Space style={{ marginBottom: '16px', width: '100%' }}>
                <Input
                    placeholder="Tìm theo CCCD hoặc họ tên"
                    prefix={<SearchOutlined />}
                    style={{ width: 400 }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    allowClear
                />
            </Space>

            <DataGrid
                columns={columns}
                data={preferences}
                loading={loading}
                error={error}
                rowKey="id"
            />

            {importModal.isOpen && (
                <ImportPreferencesModal
                    open={importModal.isOpen}
                    onClose={importModal.close}
                    onSuccess={() => {
                        importModal.close();
                        fetchPreferences();
                    }}
                    sessionId={selectedSessionId}
                />
            )}
        </div>
    );
}
