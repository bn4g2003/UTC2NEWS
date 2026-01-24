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

interface AddMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMembers: (userIds: string[]) => Promise<void>;
    existingMemberIds?: string[];
}

export function AddMembersModal({ isOpen, onClose, onAddMembers, existingMemberIds = [] }: AddMembersModalProps) {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadUsers('');
            setSelectedUsers([]);
            setSearchQuery('');
        }
    }, [isOpen]);

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
            // Filter out current user AND existing members
            const filteredUsers = Array.isArray(allUsers)
                ? allUsers.filter((u: User) => u.id !== currentUser?.id && !existingMemberIds.includes(u.id))
                : [];
            setUsers(filteredUsers);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserToggle = (userId: string) => {
        setSelectedUsers((prev) => {
            if (prev.includes(userId)) {
                return prev.filter((id) => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleAdd = async () => {
        if (selectedUsers.length === 0) return;
        setLoading(true);
        try {
            await onAddMembers(selectedUsers);
            onClose();
        } catch (error) {
            console.error('Failed to add members:', error);
            alert('Không thể thêm thành viên. Vui lòng thử lại.');
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
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thêm thành viên</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm kiếm người dùng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 dark:text-white"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Selected Pills */}
                {selectedUsers.length > 0 && (
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-900/10 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {selectedUsers.map(userId => {
                            const user = users.find(u => u.id === userId);
                            if (!user) return null;
                            return (
                                <span key={userId} className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                                    {user.fullName}
                                    <button onClick={() => handleUserToggle(userId)} className="hover:text-purple-900 dark:hover:text-purple-200 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading && users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Đang tìm kiếm...</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {users.map((user) => {
                                const isSelected = selectedUsers.includes(user.id);
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => handleUserToggle(user.id)}
                                        className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-200 dark:ring-purple-900/50' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${getAvatarColor(user.id)}`}>
                                            {user.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="font-bold text-gray-900 dark:text-white truncate text-sm">{user.fullName}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</div>
                                        </div>
                                        {isSelected ? (
                                            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 border-2 border-gray-200 dark:border-slate-700 rounded-full"></div>
                                        )}
                                    </button>
                                );
                            })}
                            {users.length === 0 && !loading && (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium">Không tìm thấy người dùng</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {selectedUsers.length > 0 ? `Đã chọn ${selectedUsers.length} người` : 'Chọn người cần thêm'}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm font-bold"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={loading || selectedUsers.length === 0}
                            className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all text-sm font-bold shadow-lg shadow-purple-200 dark:shadow-none"
                        >
                            {loading ? 'Đang thêm...' : 'Thêm'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
