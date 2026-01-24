'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { UsersService } from '@/api';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (participantIds: string[], name?: string, type?: string, isPublic?: boolean, description?: string) => Promise<void>;
}

type ChatType = 'direct' | 'group' | 'channel';

export function NewChatModal({ isOpen, onClose, onCreateRoom }: NewChatModalProps) {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ChatType>('direct');

  // State for user search/selection
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // State for group/channel details
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Load initial users if in Direct or Group mode for quick selection
      loadUsers('');

      // Reset state
      setSelectedUsers([]);
      setGroupName('');
      setDescription('');
      setSearchQuery('');
      setIsPublic(true);
      // Default to direct tab on open
      setActiveTab('direct');
    }
  }, [isOpen]);

  // Handle auto-search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        loadUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  const loadUsers = async (query: string) => {
    setLoading(true);
    try {
      const response = await UsersService.usersControllerSearch(query, 50);
      const allUsers = response;
      // Filter out current user
      const filteredUsers = Array.isArray(allUsers)
        ? allUsers.filter((u: User) => u.id !== currentUser?.id)
        : [];
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    if (activeTab === 'direct') {
      // Direct chat only allows 1 user
      setSelectedUsers([userId]);
    } else {
      // Group/Channel chat allows multiple
      setSelectedUsers((prev) => {
        if (prev.includes(userId)) {
          return prev.filter((id) => id !== userId);
        } else {
          return [...prev, userId];
        }
      });
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);

      if (activeTab === 'direct') {
        if (selectedUsers.length !== 1) return;
        await onCreateRoom(selectedUsers, undefined, 'DIRECT');
      } else if (activeTab === 'group') {
        if (selectedUsers.length === 0) {
          alert('Vui lòng chọn ít nhất 1 thành viên');
          setLoading(false);
          return;
        }
        const name = groupName.trim() || undefined; // Auto-generated if empty
        await onCreateRoom(selectedUsers, name, 'GROUP');
      } else if (activeTab === 'channel') {
        if (!groupName.trim()) {
          alert('Tên kênh là bắt buộc');
          setLoading(false);
          return;
        }
        // Channel can be created with or without members
        await onCreateRoom(selectedUsers, groupName.trim(), 'CHANNEL', isPublic, description);
      }

      onClose();
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (userId: string) => {
    const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-pink-500'];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 text-gray-900">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Tạo cuộc trò chuyện mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => { setActiveTab('direct'); setSelectedUsers([]); }}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'direct' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Chat 1-1
          </button>
          <button
            onClick={() => { setActiveTab('group'); setSelectedUsers([]); }}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'group' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Nhóm
          </button>
          <button
            onClick={() => { setActiveTab('channel'); setSelectedUsers([]); }}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'channel' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Kênh/Cộng đồng
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Top Inputs Section (based on tab) */}
          <div className={`px-4 pt-4 space-y-3 ${activeTab !== 'direct' ? 'pb-2' : ''}`}>
            {activeTab === 'group' && (
              <div>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Đặt tên nhóm (Tùy chọn)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            )}

            {activeTab === 'channel' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tên Kênh <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="#thong-bao-chung"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} className="text-purple-600" />
                    <span>Công khai</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} className="text-purple-600" />
                    <span>Riêng tư</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* User Search & List (Available for ALL tabs) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="px-4 py-3 border-b border-t mt-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={activeTab === 'direct' ? "Tìm người để chat..." : "Thêm thành viên..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            {/* Selected Pills */}
            {selectedUsers.length > 0 && (
              <div className="px-4 py-2 border-b bg-purple-50 flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {users.filter(u => selectedUsers.includes(u.id)).map(user => (
                  <span key={user.id} className="inline-flex items-center gap-1 bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                    {user.fullName}
                    <button onClick={() => handleUserToggle(user.id)} className="hover:text-purple-900"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </span>
                ))}
                {/* If user selected isn't in current list (rare but possible with pagination), show count */}
                {selectedUsers.length > users.filter(u => selectedUsers.includes(u.id)).length && (
                  <span className="text-xs text-gray-500 self-center">+{selectedUsers.length - users.filter(u => selectedUsers.includes(u.id)).length} hidden</span>
                )}
              </div>
            )}

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="text-center py-8 text-gray-500 text-sm">Đang tải...</div>
              ) : (
                <div className="space-y-1">
                  {users.map((user) => {
                    const isSelected = selectedUsers.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleUserToggle(user.id)}
                        className={`w-full p-2.5 rounded-lg flex items-center gap-3 transition-colors ${isSelected ? 'bg-purple-100' : 'hover:bg-gray-100'}`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(user.id)}`}>
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-semibold text-gray-900 truncate text-sm">{user.fullName}</div>
                          <div className="text-xs text-gray-500 truncate">@{user.username}</div>
                        </div>
                        {isSelected && (
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                  {users.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500 text-sm">Không tìm thấy người dùng</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {activeTab === 'direct' && 'Chọn 1 người'}
            {activeTab === 'group' && `Đã chọn: ${selectedUsers.length} thành viên`}
            {activeTab === 'channel' && `${selectedUsers.length} thành viên`}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || (activeTab === 'direct' && selectedUsers.length !== 1) || (activeTab === 'group' && selectedUsers.length === 0)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
            >
              {loading ? 'Đang tạo...' : 'Tạo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
