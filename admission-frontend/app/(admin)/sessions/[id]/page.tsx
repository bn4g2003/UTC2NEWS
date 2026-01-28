'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2, Settings, FlaskConical, Users, BookOpen, GraduationCap, Info as LucideInfo } from 'lucide-react';
import { DataGrid } from '@/components/admin/DataGrid';
import { FormModal } from '@/components/admin/FormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { QuotaConditionsModal } from '../../quotas/QuotaConditionsModal';
import { quotaSchema } from '../../quotas/schema';
import { formulaSchema } from '../../formulas/schema'; // Import formula schema
import type { Column } from '@/components/admin/DataGrid/types';
import { Form, Select, InputNumber, Input, Tag, Tabs, message, Tooltip, Badge, Button as AntButton, Row, Col } from 'antd';
import { ProgramsService } from '@/api/services/ProgramsService';
import { FormulasService } from '@/api/services/FormulasService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getBlockCode } from '@/lib/block-code-mapper';

interface FormulaDto {
    id?: string;
    name: string;
    formula: string;
    description?: string;
}

interface Quota {
    id: string;
    sessionId: string;
    majorId: string;
    formulaId?: string;
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
    formula?: {
        id: string;
        name: string;
        formula: string;
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
    const [formulas, setFormulas] = useState<FormulaDto[]>([]);
    const [loading, setLoading] = useState(true);

    // State cho Quota Management
    const [selectedQuota, setSelectedQuota] = useState<Quota | null>(null);
    const [isQuotaFormOpen, setIsQuotaFormOpen] = useState(false);
    const [isConditionsOpen, setIsConditionsOpen] = useState(false);
    const [isQuotaDeleteOpen, setIsQuotaDeleteOpen] = useState(false);

    // State cho Formula Management
    const [selectedFormula, setSelectedFormula] = useState<FormulaDto | null>(null);
    const [isFormulaFormOpen, setIsFormulaFormOpen] = useState(false);
    const [isFormulaDeleteOpen, setIsFormulaDeleteOpen] = useState(false);

    const [majors, setMajors] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalQuotas: 0, totalStudents: 0 });

    useEffect(() => {
        loadData();
    }, [sessionId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [sessionData, quotasData, majorsData, formulasData] = await Promise.all([
                ProgramsService.programControllerFindSessionById(sessionId),
                ProgramsService.programControllerFindAllQuotas(sessionId),
                ProgramsService.programControllerFindAllMajors(),
                FormulasService.formulaControllerFindAll(),
            ]);
            setSession(sessionData);
            setQuotas(quotasData as Quota[]);
            setMajors(majorsData);
            setFormulas(formulasData);

            // Tính thống kê
            const totalQuotas = (quotasData as Quota[]).reduce((sum, q) => sum + q.quota, 0);
            setStats({ totalQuotas, totalStudents: 0 });
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
            message.error('Không thể tải thông tin đợt tuyển sinh');
        } finally {
            setLoading(false);
        }
    };

    /* --- QUOTA HANDLERS --- */
    const handleCreateQuota = () => {
        setSelectedQuota(null);
        setIsQuotaFormOpen(true);
    };

    const handleEditQuota = (quota: Quota) => {
        setSelectedQuota(quota);
        setIsQuotaFormOpen(true);
    };

    const handleEditConditions = (quota: Quota) => {
        setSelectedQuota(quota);
        setIsConditionsOpen(true);
    };

    const handleDeleteQuota = (quota: Quota) => {
        setSelectedQuota(quota);
        setIsQuotaDeleteOpen(true);
    };

    const handleSubmitQuota = async (data: any) => {
        try {
            if (selectedQuota) {
                // Update: Remove fields not allowed in UpdateQuotaDto
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { sessionId: _s, majorId: _m, admissionMethod: _a, ...updateData } = data;

                await ProgramsService.programControllerUpdateQuota(
                    selectedQuota.id,
                    updateData
                );
                message.success('Cập nhật chỉ tiêu thành công');
            } else {
                // Create: Needs sessionId and all fields
                const submitData = { ...data, sessionId };
                delete submitData.admissionMethod; // Ensure deprecated field is removed

                await ProgramsService.programControllerCreateQuota(submitData);
                message.success('Thêm chỉ tiêu thành công');
            }
            await loadData();
            setIsQuotaFormOpen(false);
        } catch (error) {
            console.error('Lỗi lưu chỉ tiêu:', error);
            message.error('Không thể lưu chỉ tiêu');
        }
    };

    const handleSubmitConditions = async (conditions: any) => {
        if (!selectedQuota) return;
        try {
            await ProgramsService.programControllerUpdateQuota(selectedQuota.id, {
                conditions,
            });
            message.success('Cập nhật điều kiện thành công');
            await loadData();
            setIsConditionsOpen(false);
        } catch (error) {
            console.error('Lỗi lưu điều kiện:', error);
            message.error('Không thể lưu điều kiện');
        }
    };

    const handleConfirmDeleteQuota = async () => {
        if (!selectedQuota) return;
        try {
            await ProgramsService.programControllerDeleteQuota(selectedQuota.id);
            message.success('Xóa chỉ tiêu thành công');
            await loadData();
            setIsQuotaDeleteOpen(false);
        } catch (error) {
            console.error('Lỗi xóa chỉ tiêu:', error);
            message.error('Không thể xóa chỉ tiêu');
        }
    };

    /* --- FORMULA HANDLERS --- */
    const handleCreateFormula = () => {
        setSelectedFormula(null);
        setIsFormulaFormOpen(true);
    };

    const handleEditFormula = (formula: FormulaDto) => {
        setSelectedFormula(formula);
        setIsFormulaFormOpen(true);
    };

    const handleDeleteFormula = (formula: FormulaDto) => {
        setSelectedFormula(formula);
        setIsFormulaDeleteOpen(true);
    };

    const handleSubmitFormula = async (data: any) => {
        try {
            if (selectedFormula && selectedFormula.id) {
                await FormulasService.formulaControllerUpdate(selectedFormula.id, data);
                message.success('Cập nhật công thức thành công');
            } else {
                await FormulasService.formulaControllerCreate(data);
                message.success('Tạo công thức mới thành công');
            }
            await loadData();
            setIsFormulaFormOpen(false);
        } catch (error: any) {
            console.error('Lỗi lưu công thức:', error);
            if (error.body && error.body.message) {
                message.error(`Lỗi: ${error.body.message}`);
            } else {
                message.error('Không thể lưu công thức. Kiểm tra cú pháp biểu thức.');
            }
        }
    };

    const handleConfirmDeleteFormula = async () => {
        if (!selectedFormula || !selectedFormula.id) return;
        try {
            await FormulasService.formulaControllerRemove(selectedFormula.id);
            message.success('Xóa công thức thành công');
            await loadData();
            setIsFormulaDeleteOpen(false);
        } catch (error: any) {
            console.error('Lỗi xóa công thức:', error);
            if (error.body && error.body.message) {
                message.error(`Không thể xóa: ${error.body.message}`); // E.g., being used
            } else {
                message.error('Không thể xóa công thức');
            }
        }
    };


    const quotaColumns: Column<Quota>[] = [
        {
            key: 'major',
            title: 'Ngành học',
            dataIndex: 'majorId',
            render: (_, quota) => (
                <div>
                    <div className="font-medium flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-500" />
                        {quota.major?.name}
                    </div>
                    <div className="text-sm text-gray-500">Mã ngành: {quota.major?.code}</div>
                </div>
            ),
        },
        {
            key: 'formula',
            title: 'Công thức tính điểm',
            dataIndex: 'formulaId',
            render: (_, quota) => {
                if (!quota.formula) {
                    return <span className="text-gray-400 italic">Chưa cấu hình</span>;
                }
                return (
                    <Tooltip title={quota.formula.formula}>
                        <Tag color="purple" className="cursor-help">
                            <FlaskConical className="h-3 w-3 inline mr-1" />
                            {quota.formula.name}
                        </Tag>
                    </Tooltip>
                );
            },
        },
        {
            key: 'quota',
            title: 'Chỉ tiêu',
            dataIndex: 'quota',
            render: (_, quota) => (
                <Badge
                    count={quota.quota}
                    showZero
                    style={{ backgroundColor: '#1890ff' }}
                    overflowCount={9999}
                />
            ),
        },
        {
            key: 'conditions',
            title: 'Điều kiện xét tuyển',
            dataIndex: 'conditions',
            render: (_, quota) => {
                const cond = quota.conditions as any;
                if (!cond) return <span className="text-gray-400 italic">Chưa cấu hình</span>;

                return (
                    <div className="text-sm space-y-1">
                        {cond.minTotalScore && (
                            <div>Điểm sàn: <Tag color="orange">≥{cond.minTotalScore}</Tag></div>
                        )}
                        {cond.subjectCombinations && cond.subjectCombinations.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {cond.subjectCombinations.map((c: any, i: number) => (
                                    <Tag key={i} color="cyan">{getBlockCode(c)}</Tag>
                                ))}
                            </div>
                        )}
                    </div>
                );
            },
        },
    ];

    const quotaActions = [
        {
            key: 'configure',
            label: 'Điều kiện',
            icon: <Settings className="h-4 w-4" />,
            onClick: handleEditConditions,
        },
        {
            key: 'edit',
            label: 'Sửa',
            icon: <Edit className="h-4 w-4" />,
            onClick: handleEditQuota,
        },
        {
            key: 'delete',
            label: 'Xóa',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: handleDeleteQuota,
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
                    <h1 className="text-2xl font-bold">{session?.name || 'Đang tải...'}</h1>
                    <p className="text-gray-500">Quản lý đợt tuyển sinh và cấu hình chỉ tiêu</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-full"><BookOpen className="text-blue-600" /></div>
                    <div>
                        <div className="text-gray-500">Số ngành tuyển sinh</div>
                        <div className="text-2xl font-bold">{quotas.length}</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-full"><Users className="text-green-600" /></div>
                    <div>
                        <div className="text-gray-500">Tổng chỉ tiêu</div>
                        <div className="text-2xl font-bold">{stats.totalQuotas}</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-purple-100 rounded-full"><FlaskConical className="text-purple-600" /></div>
                    <div>
                        <div className="text-gray-500">Công thức tính điểm</div>
                        <div className="text-2xl font-bold">{formulas.length}</div>
                    </div>
                </Card>
            </div>

            <Tabs defaultActiveKey="quotas" items={[
                {
                    key: 'quotas',
                    label: '📊 Chỉ tiêu tuyển sinh',
                    children: (
                        <Card className="p-6">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-medium">Danh sách chỉ tiêu</h3>
                                <Button onClick={handleCreateQuota}><Plus className="w-4 h-4 mr-2" /> Thêm chỉ tiêu</Button>
                            </div>
                            <DataGrid
                                data={quotas}
                                columns={quotaColumns}
                                loading={loading}
                                actions={quotaActions}
                            />
                        </Card>
                    )
                },
                {
                    key: 'formulas',
                    label: '🧪 Quản lý công thức',
                    children: (
                        <Card className="p-6">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-medium">Danh sách công thức tính điểm</h3>
                                <Button onClick={handleCreateFormula}><Plus className="w-4 h-4 mr-2" /> Tạo công thức mới</Button>
                            </div>
                            <div className="space-y-4">
                                {formulas.map(f => (
                                    <div key={f.id} className="border p-4 rounded-lg flex justify-between items-center hover:bg-slate-50">
                                        <div>
                                            <div className="font-semibold flex items-center gap-2">
                                                <FlaskConical className="w-4 h-4 text-purple-600" />
                                                {f.name}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">{f.description}</div>
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-2 font-mono w-fit">
                                                {f.formula}
                                            </code>
                                        </div>
                                        <div className="flex gap-2">
                                            <AntButton icon={<Edit className="w-4 h-4" />} onClick={() => handleEditFormula(f)} />
                                            <AntButton danger icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDeleteFormula(f)} />
                                        </div>
                                    </div>
                                ))}
                                {formulas.length === 0 && <div className="text-center text-gray-400 py-8">Chưa có công thức nào.</div>}
                            </div>
                        </Card>
                    )
                }
            ]} />

            {/* Modal Quota */}
            <FormModal
                open={isQuotaFormOpen}
                onClose={() => setIsQuotaFormOpen(false)}
                title={selectedQuota ? "Cập nhật chỉ tiêu" : "Thêm chỉ tiêu mới"}
                onSubmit={handleSubmitQuota}
                initialValues={selectedQuota || { sessionId }}
                schema={quotaSchema}
            >
                {(form) => (
                    <div className="space-y-4 py-4">
                        <Form.Item label="Ngành học" required>
                            <Select
                                placeholder="Chọn ngành học"
                                value={form.watch('majorId')}
                                onChange={(val) => form.setValue('majorId', val)}
                                options={majors.map(m => ({ value: m.id, label: `${m.name} (${m.code})` }))}
                            />
                        </Form.Item>
                        <Form.Item label="Công thức tính điểm">
                            <Select
                                placeholder="Chọn công thức áp dụng"
                                value={form.watch('formulaId')}
                                onChange={(val) => form.setValue('formulaId', val)}
                                allowClear
                                options={formulas.map(f => ({ value: f.id, label: f.name }))}
                            />
                        </Form.Item>
                        <Form.Item label="Số lượng chỉ tiêu" required>
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

            {/* Modal Formula */}
            <FormModal
                open={isFormulaFormOpen}
                onClose={() => setIsFormulaFormOpen(false)}
                title={selectedFormula ? "Cập nhật công thức" : "Tạo công thức mới"}
                onSubmit={handleSubmitFormula}
                initialValues={selectedFormula || {}}
                schema={formulaSchema}
            >
                {(form) => {
                    const FORMULA_VARIABLES = [
                        { code: 'math', label: 'Toán' },
                        { code: 'literature', label: 'Văn' },
                        { code: 'english', label: 'Ngoại ngữ' },
                        { code: 'physics', label: 'Lý' },
                        { code: 'chemistry', label: 'Hóa' },
                        { code: 'biology', label: 'Sinh' },
                        { code: 'history', label: 'Sử' },
                        { code: 'geography', label: 'Địa' },
                        { code: 'civic_education', label: 'GDCD' },
                        { code: 'method', label: 'Tổ hợp (Mã)' },
                        { code: 'majorCode', label: 'Mã ngành' },
                        { code: 'majorName', label: 'Tên ngành' },
                        { code: 'priorityPoints', label: 'Điểm ưu tiên gốc' },
                    ];

                    const FORMULA_FUNCTIONS = [
                        { code: 'max()', label: 'Max' },
                        { code: 'min()', label: 'Min' },
                        { code: 'avg()', label: 'Avg' },
                        { code: 'round(,2)', label: 'Round' },
                        { code: 'abs()', label: 'Abs' },
                        { code: 'ceil()', label: 'Ceil' },
                        { code: 'floor()', label: 'Floor' },
                    ];

                    const FORMULA_EXAMPLES = [
                        { code: "method == 'A00' ? (math + physics + chemistry) : (method == 'D01' ? (math + literature + english) : 0)", label: 'Xét 2 tổ hợp (A00 hoặc D01) - Ghi rõ' },
                        { code: "math + physics + chemistry + literature + english + history", label: 'Tổng tất cả môn (nhanh)' },
                    ];

                    const insertVariable = (code: string) => {
                        const current = form.watch('formula') || '';
                        const spacer = current.length > 0 && !current.endsWith(' ') && !current.endsWith('(') && !code.includes('(') ? ' + ' : '';
                        form.setValue('formula', current + spacer + code);
                    };

                    return (
                        <div className="space-y-4 py-4">
                            <Form.Item label="Tên công thức" required>
                                <Input
                                    placeholder="Ví dụ: Toán nhân đôi, Khối A00..."
                                    value={form.watch('name')}
                                    onChange={(e) => form.setValue('name', e.target.value)}
                                />
                            </Form.Item>

                            <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Biến số</label>
                                        <div className="flex flex-wrap gap-1">
                                            {FORMULA_VARIABLES.map(v => (
                                                <Tag
                                                    key={v.code}
                                                    color="blue"
                                                    className="cursor-pointer m-0 text-[10px] px-1 line-height-1"
                                                    onClick={() => insertVariable(v.code)}
                                                >
                                                    {v.label}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Hàm toán học</label>
                                        <div className="flex flex-wrap gap-1">
                                            {FORMULA_FUNCTIONS.map(v => (
                                                <Tag
                                                    key={v.code}
                                                    color="purple"
                                                    className="cursor-pointer m-0 text-[10px] px-1"
                                                    onClick={() => insertVariable(v.code)}
                                                >
                                                    {v.label}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Mẫu công thức (Click để chép)</label>
                                    <div className="space-y-1">
                                        {FORMULA_EXAMPLES.map((ex, idx) => (
                                            <div
                                                key={idx}
                                                className="text-[10px] bg-white border border-slate-100 p-1 rounded cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                                onClick={() => form.setValue('formula', ex.code)}
                                            >
                                                <span className="font-semibold text-blue-600">[{ex.label}]:</span>
                                                <code className="ml-1 text-gray-500">{ex.code}</code>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Form.Item label="Biểu thức tính điểm" required className="mb-2">
                                <Input.TextArea
                                    placeholder="Nhập biểu thức tính toán..."
                                    rows={3}
                                    value={form.watch('formula')}
                                    onChange={(e) => form.setValue('formula', e.target.value)}
                                    className="font-mono text-xs"
                                />
                            </Form.Item>

                            <Form.Item label="Mô tả">
                                <Input.TextArea
                                    placeholder="Mô tả chi tiết về cách tính..."
                                    value={form.watch('description')}
                                    onChange={(e) => form.setValue('description', e.target.value)}
                                />
                            </Form.Item>

                            <div className="bg-blue-50/50 border border-blue-100 text-blue-600 px-3 py-2 rounded text-[11px] leading-relaxed mt-4">
                                <p className="font-semibold mb-1 flex items-center gap-1">
                                    <LucideInfo className="w-3 h-3" /> GHI CHÚ QUY CHẾ:
                                </p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>Hệ thống <b>TỰ ĐỘNG CỘNG ĐIỂM ƯU TIÊN</b> khi lọc ảo - <b>KHÔNG</b> cần đưa vào công thức.</li>
                                    <li>Công thức trên chỉ dùng để tính <b>TỔNG ĐIỂM 3 MÔN</b> (hoặc môn nhân hệ số).</li>
                                    <li>Sử dụng cấu trúc <code>điều_kiện ? đúng : sai</code> để viết công thức cho nhiều tổ hợp.</li>
                                    <li>Các môn không nằm trong tổ hợp thí sinh chọn sẽ tự động bằng 0.</li>
                                </ul>
                            </div>
                        </div>
                    );
                }}
            </FormModal>

            <QuotaConditionsModal
                open={isConditionsOpen}
                onClose={() => setIsConditionsOpen(false)}
                quota={selectedQuota}
                onSubmit={handleSubmitConditions}
            />

            <ConfirmDialog
                open={isQuotaDeleteOpen}
                onCancel={() => setIsQuotaDeleteOpen(false)}
                onConfirm={handleConfirmDeleteQuota}
                title="Xóa chỉ tiêu"
                content="Bạn có chắc chắn muốn xóa chỉ tiêu này không?"
            />

            <ConfirmDialog
                open={isFormulaDeleteOpen}
                onCancel={() => setIsFormulaDeleteOpen(false)}
                onConfirm={handleConfirmDeleteFormula}
                title="Xóa công thức"
                content="Bạn có chắc chắn muốn xóa công thức này? Nếu công thức đang được sử dụng trong các chỉ tiêu, bạn sẽ không thể xóa nó."
            />
        </div>
    );
}
