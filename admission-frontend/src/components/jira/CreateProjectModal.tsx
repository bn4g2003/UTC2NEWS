'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { jiraApi } from '@/lib/jira-api';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ open, onClose, onSuccess }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await jiraApi.projects.create(formData);
      setFormData({ name: '', key: '', description: '' });
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create project:', error);
      setError(error.message || 'Không thể tạo dự án');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo Dự Án Mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Tên Dự Án <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Hệ thống quản lý tuyển sinh"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key" className="text-sm font-medium">
              Mã Dự Án <span className="text-red-500">*</span>
            </Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, key: e.target.value.toUpperCase() })
              }
              placeholder="Ví dụ: QLTS"
              maxLength={10}
              required
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              2-10 ký tự IN HOA, không dấu (VD: QLTS, PROJ, TASK)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Mô Tả (Tùy chọn)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả ngắn gọn về dự án..."
              rows={3}
              className="w-full resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo Dự Án'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
