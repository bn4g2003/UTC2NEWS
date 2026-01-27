'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, Crown, Shield, User } from 'lucide-react';
import { ProjectMember } from '@/types/jira';
import { jiraApi } from '@/lib/jira-api';

interface ProjectMembersModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: ProjectMember[];
  onUpdate: () => void;
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
};

const roleLabels = {
  OWNER: 'Chủ dự án',
  ADMIN: 'Quản trị viên',
  MEMBER: 'Thành viên',
};

const roleColors = {
  OWNER: 'text-yellow-600 bg-yellow-50',
  ADMIN: 'text-blue-600 bg-blue-50',
  MEMBER: 'text-gray-600 bg-gray-50',
};

export function ProjectMembersModal({
  open,
  onClose,
  projectId,
  members,
  onUpdate,
}: ProjectMembersModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await jiraApi.members.add(projectId, email, role);
      setEmail('');
      setRole('MEMBER');
      onUpdate();
    } catch (error: any) {
      console.error('Failed to add member:', error);
      setError(error.message || 'Không thể thêm thành viên');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thành viên này?')) return;

    try {
      await jiraApi.members.remove(projectId, memberId);
      onUpdate();
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      alert(error.message || 'Không thể xóa thành viên');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quản lý thành viên dự án</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Add Member Form */}
          <form onSubmit={handleAddMember} className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Thêm thành viên mới
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Vai trò</Label>
                <Select value={role} onValueChange={(v: 'ADMIN' | 'MEMBER') => setRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Thành viên</SelectItem>
                    <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Đang thêm...' : 'Thêm thành viên'}
            </Button>
          </form>

          {/* Members List */}
          <div className="space-y-2">
            <h3 className="font-semibold">Danh sách thành viên ({members.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role];
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {member.user.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.user.fullName}</p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${roleColors[member.role]}`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {roleLabels[member.role]}
                      </span>

                      {member.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
