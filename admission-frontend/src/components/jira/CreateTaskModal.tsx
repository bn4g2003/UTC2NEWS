'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from './RichTextEditor';
import { Column, ProjectMember, TaskType, TaskPriority } from '@/types/jira';
import { jiraApi } from '@/lib/jira-api';
import { X, Upload } from 'lucide-react';

interface CreateTaskModalProps {
  projectId: string;
  columns: Column[];
  members: ProjectMember[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTaskModal({
  projectId,
  columns,
  members,
  open,
  onClose,
  onSuccess,
}: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    columnId: columns[0]?.id || '',
    type: TaskType.TASK,
    priority: TaskPriority.MEDIUM,
    assigneeId: 'unassigned',
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check total size
    const totalSize = [...selectedFiles, ...files].reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 50 * 1024 * 1024) { // 50MB total
      setError('Tổng kích thước file không được vượt quá 50MB');
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const task = await jiraApi.tasks.create(projectId, {
        ...formData,
        assigneeId: formData.assigneeId === 'unassigned' ? undefined : formData.assigneeId,
        dueDate: formData.dueDate || undefined,
      });
      
      // Upload files if any
      if (selectedFiles.length > 0) {
        await Promise.all(
          selectedFiles.map(file => jiraApi.attachments.upload(task.id, file))
        );
      }

      setFormData({
        title: '',
        description: '',
        columnId: columns[0]?.id || '',
        type: TaskType.TASK,
        priority: TaskPriority.MEDIUM,
        assigneeId: 'unassigned',
        dueDate: '',
      });
      setSelectedFiles([]);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create task:', error);
      setError(error.message || 'Không thể tạo công việc');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Công Việc Mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Tiêu Đề <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nhập tiêu đề công việc..."
              required
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Loại Công Việc
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, type: value as TaskType })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskType.TASK}>Công việc</SelectItem>
                  <SelectItem value={TaskType.BUG}>Lỗi</SelectItem>
                  <SelectItem value={TaskType.FEATURE}>Tính năng</SelectItem>
                  <SelectItem value={TaskType.STORY}>User Story</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                Độ Ưu Tiên
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, priority: value as TaskPriority })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Thấp</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Trung bình</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>Cao</SelectItem>
                  <SelectItem value={TaskPriority.URGENT}>Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="columnId" className="text-sm font-medium">
                Trạng Thái <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.columnId}
                onValueChange={(value: string) => setFormData({ ...formData, columnId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigneeId" className="text-sm font-medium">
                Người Thực Hiện
              </Label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value: string) => setFormData({ ...formData, assigneeId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chưa phân công" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Chưa phân công</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-medium">
              Hạn Hoàn Thành
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Mô Tả Chi Tiết</Label>
            <RichTextEditor
              content={formData.description}
              onChange={(content) => setFormData({ ...formData, description: content })}
              placeholder="Mô tả chi tiết công việc..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">File Đính Kèm</Label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                multiple
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Chọn File
              </Button>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo Công Việc'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
