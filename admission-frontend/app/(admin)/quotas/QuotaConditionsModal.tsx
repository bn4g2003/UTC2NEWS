'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Plus, Trash2, Info } from 'lucide-react';

interface QuotaConditionsModalProps {
  open: boolean;
  onClose: () => void;
  quota: any;
  onSubmit: (conditions: any) => Promise<void>;
}

export function QuotaConditionsModal({
  open,
  onClose,
  quota,
  onSubmit,
}: QuotaConditionsModalProps) {
  const [conditions, setConditions] = useState<any>({
    minTotalScore: undefined,
    minSubjectScores: {},
    requiredSubjects: [],
    subjectCombinations: [],
  });
  const [loading, setLoading] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMinScore, setNewMinScore] = useState('');
  const [newCombination, setNewCombination] = useState<string[]>([]);
  const [newCombSubject, setNewCombSubject] = useState('');

  // ... (keep state variables)

  useEffect(() => {
    if (quota?.conditions) {
      setConditions(quota.conditions);
    } else {
      setConditions({
        minTotalScore: undefined,
        minSubjectScores: {},
        requiredSubjects: [],
        subjectCombinations: [],
      });
    }
  }, [quota]);

  // ... (keep logic)

  {/* Info Alert */ }
  <Card className="p-4 bg-blue-50 border-blue-200">
    <div className="flex gap-2">
      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-blue-800">
        <p className="font-medium mb-1">Quy định xét tuyển:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><b>Điểm sàn (Tổng điểm tối thiểu):</b> Thí sinh có tổng điểm (đã cộng ưu tiên) thấp hơn mức này sẽ bị <b>TRƯỢT</b>.</li>
          <li><b>Điểm ưu tiên:</b> Hệ thống tự động tính và cộng theo Quy chế 2025 (giảm dần nếu tổng điểm ≥ 22.5). Không cần cấu hình ở đây.</li>
          <li>Tất cả điều kiện nhập bên dưới phải thỏa mãn thì thí sinh mới đủ điều kiện xét tuyển.</li>
        </ul>
      </div>
    </div>
  </Card>

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Clean up empty values
      const cleanConditions = {
        ...conditions,
        minTotalScore: conditions.minTotalScore || undefined,
        minSubjectScores:
          Object.keys(conditions.minSubjectScores || {}).length > 0
            ? conditions.minSubjectScores
            : undefined,
        requiredSubjects:
          conditions.requiredSubjects?.length > 0
            ? conditions.requiredSubjects
            : undefined,
        subjectCombinations:
          conditions.subjectCombinations?.length > 0
            ? conditions.subjectCombinations
            : undefined,
      };
      await onSubmit(cleanConditions);
      onClose();
    } catch (error) {
      console.error('Failed to save conditions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMinSubjectScore = () => {
    if (newSubject && newMinScore) {
      setConditions({
        ...conditions,
        minSubjectScores: {
          ...conditions.minSubjectScores,
          [newSubject]: parseFloat(newMinScore),
        },
      });
      setNewSubject('');
      setNewMinScore('');
    }
  };

  const removeMinSubjectScore = (subject: string) => {
    const { [subject]: _, ...rest } = conditions.minSubjectScores;
    setConditions({
      ...conditions,
      minSubjectScores: rest,
    });
  };

  const addRequiredSubject = () => {
    if (newSubject && !conditions.requiredSubjects?.includes(newSubject)) {
      setConditions({
        ...conditions,
        requiredSubjects: [...(conditions.requiredSubjects || []), newSubject],
      });
      setNewSubject('');
    }
  };

  const removeRequiredSubject = (subject: string) => {
    setConditions({
      ...conditions,
      requiredSubjects: conditions.requiredSubjects.filter(
        (s: string) => s !== subject
      ),
    });
  };

  const addSubjectToCombination = () => {
    if (newCombSubject && !newCombination.includes(newCombSubject)) {
      setNewCombination([...newCombination, newCombSubject]);
      setNewCombSubject('');
    }
  };

  const removeSubjectFromCombination = (subject: string) => {
    setNewCombination(newCombination.filter((s) => s !== subject));
  };

  const saveCombination = () => {
    if (newCombination.length > 0) {
      setConditions({
        ...conditions,
        subjectCombinations: [
          ...(conditions.subjectCombinations || []),
          newCombination,
        ],
      });
      setNewCombination([]);
    }
  };

  const removeCombination = (index: number) => {
    setConditions({
      ...conditions,
      subjectCombinations: conditions.subjectCombinations.filter(
        (_: any, i: number) => i !== index
      ),
    });
  };

  const commonSubjects = [
    { value: 'math', label: 'Toán' },
    { value: 'physics', label: 'Lý' },
    { value: 'chemistry', label: 'Hóa' },
    { value: 'biology', label: 'Sinh' },
    { value: 'literature', label: 'Văn' },
    { value: 'english', label: 'Anh' },
    { value: 'history', label: 'Sử' },
    { value: 'geography', label: 'Địa' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Cấu hình điều kiện</h2>
            <p className="text-sm text-gray-600 mt-1">
              {quota?.major?.name} - {quota?.session?.name}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Alert */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Lưu ý:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Điểm tổng tối thiểu được kiểm tra TRƯỚC khi cộng điểm ưu tiên</li>
                  <li>Tất cả điều kiện phải thỏa mãn để thí sinh đủ điều kiện</li>
                  <li>Để trống nếu không muốn áp dụng điều kiện đó</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Minimum Total Score */}
          <div>
            <Label>Điểm tổng tối thiểu (chưa cộng ưu tiên)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="30"
              value={conditions.minTotalScore || ''}
              onChange={(e) =>
                setConditions({
                  ...conditions,
                  minTotalScore: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="Ví dụ: 18.0"
            />
            <p className="text-sm text-gray-500 mt-1">
              Tổng điểm các môn phải đạt tối thiểu
            </p>
          </div>

          {/* Minimum Subject Scores */}
          <div>
            <Label>Điểm tối thiểu từng môn</Label>
            <div className="space-y-2 mt-2">
              {Object.entries(conditions.minSubjectScores || {}).map(
                ([subject, score]: [string, any]) => (
                  <div
                    key={subject}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium capitalize flex-1">
                      {commonSubjects.find((s) => s.value === subject)?.label ||
                        subject}
                    </span>
                    <span className="text-gray-600">≥ {score}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeMinSubjectScore(subject)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <select
                className="flex-1 border rounded px-3 py-2"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              >
                <option value="">Chọn môn học</option>
                {commonSubjects.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="Điểm"
                value={newMinScore}
                onChange={(e) => setNewMinScore(e.target.value)}
                className="w-24"
              />
              <Button type="button" onClick={addMinSubjectScore}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Required Subjects */}
          <div>
            <Label>Môn bắt buộc</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {conditions.requiredSubjects?.map((subject: string) => (
                <div
                  key={subject}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                >
                  <span className="capitalize">
                    {commonSubjects.find((s) => s.value === subject)?.label ||
                      subject}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRequiredSubject(subject)}
                    className="hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <select
                className="flex-1 border rounded px-3 py-2"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              >
                <option value="">Chọn môn học</option>
                {commonSubjects.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Button type="button" onClick={addRequiredSubject}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Subject Combinations */}
          <div>
            <Label>Tổ hợp môn được phép</Label>

            {/* Quick Combinations Selection */}
            <div className="mt-2">
              <Label className="text-xs text-gray-500 mb-2 block">Chọn nhanh tổ hợp phổ biến:</Label>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { code: 'A00', subjects: ['math', 'physics', 'chemistry'] },
                  { code: 'A01', subjects: ['math', 'physics', 'english'] },
                  { code: 'B00', subjects: ['math', 'chemistry', 'biology'] },
                  { code: 'C00', subjects: ['literature', 'history', 'geography'] },
                  { code: 'D01', subjects: ['math', 'literature', 'english'] },
                  { code: 'A02', subjects: ['math', 'physics', 'biology'] },
                  { code: 'D07', subjects: ['math', 'chemistry', 'english'] },
                ].map((comb) => {
                  const isSelected = conditions.subjectCombinations?.some(
                    (c: string[]) => JSON.stringify(c.sort()) === JSON.stringify([...comb.subjects].sort())
                  );
                  return (
                    <Button
                      key={comb.code}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        if (isSelected) {
                          setConditions({
                            ...conditions,
                            subjectCombinations: conditions.subjectCombinations.filter(
                              (c: string[]) => JSON.stringify(c.sort()) !== JSON.stringify([...comb.subjects].sort())
                            ),
                          });
                        } else {
                          setConditions({
                            ...conditions,
                            subjectCombinations: [...(conditions.subjectCombinations || []), comb.subjects],
                          });
                        }
                      }}
                    >
                      {comb.code}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 mt-2">
              {conditions.subjectCombinations?.map(
                (combination: string[], index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <span className="flex-1">
                      {combination
                        .map(
                          (s) =>
                            commonSubjects.find((cs) => cs.value === s)?.label || s
                        )
                        .join(' + ')}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeCombination(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              )}
            </div>
            <Card className="p-4 mt-2 bg-gray-50">
              <Label className="text-sm">Tạo tổ hợp tự chọn</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {newCombination.map((subject) => (
                  <div
                    key={subject}
                    className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full"
                  >
                    <span className="capitalize">
                      {commonSubjects.find((s) => s.value === subject)?.label ||
                        subject}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubjectFromCombination(subject)}
                      className="hover:text-green-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <select
                  className="flex-1 border rounded px-3 py-2"
                  value={newCombSubject}
                  onChange={(e) => setNewCombSubject(e.target.value)}
                >
                  <option value="">Chọn môn học</option>
                  {commonSubjects.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={addSubjectToCombination}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={saveCombination}
                  disabled={newCombination.length === 0}
                >
                  Lưu tổ hợp
                </Button>
              </div>
            </Card>
          </div>

          {/* Priority Bonus */}
          <div>
            <Label>Điểm ưu tiên</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="priorityEnabled"
                  checked={conditions.priorityBonus?.enabled ?? true}
                  onChange={(e) =>
                    setConditions({
                      ...conditions,
                      priorityBonus: {
                        ...conditions.priorityBonus,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="priorityEnabled" className="cursor-pointer">
                  Cho phép cộng điểm ưu tiên
                </Label>
              </div>
              {conditions.priorityBonus?.enabled && (
                <div>
                  <Label>Điểm ưu tiên tối đa</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={conditions.priorityBonus?.maxBonus || 2.0}
                    onChange={(e) =>
                      setConditions({
                        ...conditions,
                        priorityBonus: {
                          ...conditions.priorityBonus,
                          maxBonus: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Giới hạn điểm ưu tiên được cộng vào tổng điểm
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu điều kiện'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
