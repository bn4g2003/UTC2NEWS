'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Task } from '@/types/jira';
import { X, MessageSquare, Send, Trash2, Paperclip, Upload, Download, FileIcon } from 'lucide-react';
import { format } from 'date-fns';
import { jiraApi } from '@/lib/jira-api';

interface TaskDetailModalProps {
  taskId: string;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function TaskDetailModal({ taskId, open, onClose, onUpdate }: TaskDetailModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && taskId) {
      fetchTask();
    }
  }, [taskId, open]);

  const fetchTask = async () => {
    try {
      setError(null);
      const data = await jiraApi.tasks.getById(taskId);
      setTask(data as Task);
    } catch (error: any) {
      console.error('Failed to fetch task:', error);
      setError(error.message || 'Không thể tải công việc');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      await jiraApi.comments.create(taskId, commentText);
      setCommentText('');
      fetchTask();
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      setError(error.message || 'Không thể thêm bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;

    try {
      await jiraApi.tasks.delete(taskId);
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      setError(error.message || 'Không thể xóa công việc');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await jiraApi.attachments.upload(taskId, file);
      fetchTask(); // Refresh task to show new attachment
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      setError(error.message || 'Không thể tải lên file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa file đính kèm này?')) return;

    try {
      await jiraApi.attachments.delete(attachmentId);
      fetchTask(); // Refresh task
    } catch (error: any) {
      console.error('Failed to delete attachment:', error);
      setError(error.message || 'Không thể xóa file đính kèm');
    }
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading || !task) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="p-8 text-center">
            {error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              'Đang tải...'
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="flex h-full max-h-[90vh]">
          {/* Left Column - Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{task.type}</Badge>
                  <Badge variant="outline">{task.priority}</Badge>
                </div>
                <h2 className="text-2xl font-bold">{task.title}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Mô Tả</h3>
              {task.description ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              ) : (
                <p className="text-gray-500 italic">Chưa có mô tả</p>
              )}
            </div>

            <Separator className="my-6" />

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  <h3 className="font-semibold">
                    File Đính Kèm ({task.attachments?.length || 0})
                  </h3>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Đang tải...' : 'Tải lên'}
                  </Button>
                </div>
              </div>

              {/* Attachments List */}
              <div className="space-y-3">
                {task.attachments?.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    {isImageFile(attachment.mimeType) ? (
                      <div className="space-y-2">
                        <img
                          src={attachment.storagePath}
                          alt={attachment.originalName}
                          className="w-full max-h-64 object-contain rounded"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {attachment.originalName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.sizeBytes)} • {attachment.uploader.fullName}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(attachment.storagePath, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {attachment.originalName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.sizeBytes)} • {attachment.uploader.fullName}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(attachment.storagePath, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {(!task.attachments || task.attachments.length === 0) && (
                  <p className="text-gray-500 text-sm italic">Chưa có file đính kèm</p>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-semibold">
                  Bình Luận ({task.comments?.length || 0})
                </h3>
              </div>

              {/* Comment Form */}
              <form onSubmit={handleAddComment} className="mb-4">
                <div className="flex gap-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Thêm bình luận..."
                    rows={3}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={submitting || !commentText.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {task.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {comment.user.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.user.fullName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}

                {(!task.comments || task.comments.length === 0) && (
                  <p className="text-gray-500 text-sm italic">Chưa có bình luận</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="w-80 border-l bg-gray-50 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Trạng Thái
                </label>
                <Badge>{task.column?.name}</Badge>
              </div>

              {/* Blocked Reason */}
              {task.blockedReason && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Lý Do Dừng
                  </label>
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-800">{task.blockedReason}</p>
                  </div>
                </div>
              )}

              {/* Assignee */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Người Thực Hiện
                </label>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {task.assignee.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{task.assignee.fullName}</p>
                      <p className="text-xs text-gray-500">{task.assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Chưa phân công</p>
                )}
              </div>

              {/* Reporter */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Người Tạo
                </label>
                {task.reporter ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {task.reporter.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{task.reporter.fullName}</p>
                      <p className="text-xs text-gray-500">{task.reporter.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Không rõ</p>
                )}
              </div>

              {/* Due Date */}
              {task.dueDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Hạn Hoàn Thành
                  </label>
                  <p className="text-sm">
                    {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                  </p>
                </div>
              )}

              {/* Labels */}
              {task.labels && task.labels.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Nhãn
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {task.labels.map((tl) => (
                      <Badge
                        key={tl.labelId}
                        style={{
                          backgroundColor: tl.label.color + '20',
                          color: tl.label.color,
                          borderColor: tl.label.color,
                        }}
                      >
                        {tl.label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Ngày Tạo
                </label>
                <p className="text-sm text-gray-600">
                  {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Cập Nhật Lần Cuối
                </label>
                <p className="text-sm text-gray-600">
                  {format(new Date(task.updatedAt), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>

              <Separator />

              {/* Actions */}
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa Công Việc
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
