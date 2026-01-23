'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2, Settings } from 'lucide-react';
import { DataGrid } from '@/components/admin/DataGrid';
import { FormModal } from '@/components/admin/FormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { QuotaConditionsModal } from '../../quotas/QuotaConditionsModal';
import { quotaSchema } from '../../quotas/schema';
import type { Column } from '@/components/admin/DataGrid/types';
import { Form, Select, InputNumber, Tag, Tabs, message, Button as AntButton } from 'antd';
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

interface SessionDetailsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function SessionDetailsPage({ params }: SessionDetailsPageProps) {
    const resolvedParams = use(params);
    const sessionId = resolvedParams.id;
    const router = useRouter();

    const [session, setSession] = useState<any>(null);
    const [quotas, setQuotas] = useState<Quota[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuota, setSelectedQuota] = useState<Quota | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConditionsOpen, setIsConditionsOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [majors, setMajors] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [sessionId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [sessionData, quotasData, majorsData] = await Promise.all([
                ProgramsService.programControllerFindSessionById(sessionId),
                ProgramsService.programControllerFindAllQuotas(sessionId),
                ProgramsService.programControllerFindAllMajors(),
            ]);
            setSession(sessionData); // Direct data assignment assuming API returns data directly or axios inteceptor handles it
            setQuotas(quotasData as Quota[]);
            setMajors(majorsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            message.error('Failed to load session details');
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
            // Ensure sessionId is set to current session
            const submitData = { ...data, sessionId };

            if (selectedQuota) {
                await ProgramsService.programControllerUpdateQuota(
                    selectedQuota.id,
                    submitData
                );
                message.success('Quota updated successfully');
            } else {
                await ProgramsService.programControllerCreateQuota(submitData);
                message.success('Quota created successfully');
            }
            await loadData();
            setIsFormOpen(false);
        } catch (error) {
            console.error('Failed to save quota:', error);
            message.error('Failed to save quota');
        }
    };

    const handleSubmitConditions = async (conditions: any) => {
        if (!selectedQuota) return;

        try {
            await ProgramsService.programControllerUpdateQuota(selectedQuota.id, {
                conditions,
            });
            message.success('Conditions updated successfully');
            await loadData();
            setIsConditionsOpen(false);
        } catch (error) {
            console.error('Failed to save conditions:', error);
            message.error('Failed to save conditions');
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedQuota) return;

        try {
            await ProgramsService.programControllerDeleteQuota(selectedQuota.id);
            message.success('Quota deleted successfully');
            await loadData();
            setIsDeleteOpen(false);
        } catch (error) {
            console.error('Failed to delete quota:', error);
            message.error('Failed to delete quota');
        }
    };

    const columns: Column<Quota>[] = [
        {
            key: 'major',
            title: 'Major',
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
            title: 'Method',
            dataIndex: 'admissionMethod',
            render: (_, quota) => {
                const methodLabels: Record<string, string> = {
                    entrance_exam: 'Thi đầu vào',
                    high_school_transcript: 'Xét học bạ',
                    direct_admission: 'Xét tuyển thẳng',
                };
                return <Tag color="blue">{methodLabels[quota.admissionMethod] || quota.admissionMethod}</Tag>;
            },
        },
        {
            key: 'subjectCombinations',
            title: 'Subject Combinations',
            dataIndex: 'conditions',
            render: (_, quota) => {
                const conditions = quota.conditions as any;
                if (!conditions?.subjectCombinations || conditions.subjectCombinations.length === 0) {
                    return <span className="text-gray-400">Not configured</span>;
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
            title: 'Target',
            dataIndex: 'quota',
            render: (_, quota) => (
                <span className="font-semibold text-blue-600">{quota.quota}</span>
            ),
        },
        {
            key: 'conditions',
            title: 'Conditions',
            dataIndex: 'conditions',
            render: (_, quota) => {
                if (!quota.conditions) {
                    return <span className="text-gray-400">Not configured</span>;
                }
                const cond = quota.conditions as any;
                return (
                    <div className="text-sm">
                        {cond.minTotalScore && (
                            <div>Floor Score: <Tag color="orange" className="mr-1 mb-1">≥{cond.minTotalScore}</Tag></div>
                        )}
                        {cond.minSubjectScores && Object.keys(cond.minSubjectScores).length > 0 && (
                            <div className="mt-1">
                                Subject Score: {Object.entries(cond.minSubjectScores).map(([sub, score]: [string, any]) => (
                                    <Tag key={sub} className="mr-1 mb-1">{sub}:{score}</Tag>
                                ))}
                            </div>
                        )}
                        {cond.priorityBonus?.enabled && (
                            <div className="text-green-600 mt-1">
                                Priority: +{cond.priorityBonus.maxBonus}
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
            label: 'Conditions',
            icon: <Settings className="h-4 w-4" />,
            onClick: handleEditConditions,
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <Edit className="h-4 w-4" />,
            onClick: handleEdit,
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: handleDelete,
            danger: true,
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">
                        {session ? session.name : 'Loading...'}
                    </h1>
                    <p className="text-gray-500">
                        Admission Session Details & Quota Management
                    </p>
                </div>
            </div>

            <Tabs defaultActiveKey="quotas" items={[
                {
                    key: 'quotas',
                    label: 'Quotas & Targets',
                    children: (
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Session Quotas</h3>
                                <Button onClick={handleCreate}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Quota
                                </Button>
                            </div>

                            <DataGrid
                                data={quotas}
                                columns={columns}
                                loading={loading}
                                actions={actions}
                            />
                        </Card>
                    )
                }
            ]} />

            <FormModal<any>
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={selectedQuota ? 'Update Quota' : 'Add New Quota'}
                onSubmit={handleSubmit}
                initialValues={selectedQuota || { sessionId }}
                schema={quotaSchema}
            >
                {(form) => (
                    <div className="space-y-4 py-4">
                        {/* Hidden sessionId field as we are in the context of a session */}
                        <div className="hidden">
                            <Form.Item label="Session">
                                <Select
                                    value={form.watch('sessionId')}
                                    disabled
                                    options={[]}
                                />
                            </Form.Item>
                        </div>

                        <Form.Item label="Major" required>
                            <Select
                                placeholder="Select Major"
                                value={form.watch('majorId')}
                                onChange={(val) => form.setValue('majorId', val)}
                                options={majors.map((m) => ({
                                    value: m.id,
                                    label: `${m.name} (${m.code})`,
                                }))}
                            />
                        </Form.Item>
                        <Form.Item label="Method" required>
                            <Select
                                placeholder="Select Method"
                                value={form.watch('admissionMethod')}
                                onChange={(val) => form.setValue('admissionMethod', val)}
                                options={[
                                    { value: 'entrance_exam', label: 'Thi đầu vào' },
                                    { value: 'high_school_transcript', label: 'Xét học bạ' },
                                    { value: 'direct_admission', label: 'Xét tuyển thẳng' },
                                ]}
                            />
                        </Form.Item>
                        <Form.Item label="Target Quota" required>
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
                title="Delete Quota"
                content={`Are you sure you want to delete this quota? This action cannot be undone.`}
            />
        </div>
    );
}
