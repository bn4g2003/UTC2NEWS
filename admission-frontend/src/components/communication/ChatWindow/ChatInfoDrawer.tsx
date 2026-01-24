'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { AddMembersModal } from './AddMembersModal';

interface ChatInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  room: any;
  currentUserId?: string;
  onAddMembers?: (userIds: string[]) => void;
  onRemoveMember?: (userId: string) => void;
}

export function ChatInfoDrawer({
  isOpen,
  onClose,
  room,
  currentUserId,
  onAddMembers,
  onRemoveMember,
}: ChatInfoDrawerProps) {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'members' | 'media' | 'files'>('members');
  const [mediaMessages, setMediaMessages] = useState<any[]>([]);
  const [fileMessages, setFileMessages] = useState<any[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);

  const isAdmin = room?.participants?.find(
    (p: any) => p.userId === currentUserId
  )?.role === 'ADMIN';

  // Load media and files when drawer opens
  useEffect(() => {
    if (isOpen && room?.id) {
      loadMediaAndFiles();
    }
  }, [isOpen, room?.id]);

  const loadMediaAndFiles = async () => {
    if (!room?.id) return;

    setIsLoadingMedia(true);
    try {
      if (!token) {
        console.error('No token found for loading media');
        return;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/rooms/${room.id}/messages?limit=200`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const messages = await response.json();

        // Filter media (images)
        const media = messages.filter((m: any) => m.type === 'IMAGE' && !m.deletedAt);
        setMediaMessages(media);

        // Filter files
        const files = messages.filter((m: any) => m.type === 'FILE' && !m.deletedAt);
        setFileMessages(files);
      }
    } catch (error) {
      console.error('Failed to load media and files:', error);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const getRoomName = () => {
    if (!room) return '';
    if (room.type === 'DIRECT') {
      const otherParticipant = room.participants.find(
        (p: any) => p.userId !== currentUserId
      );
      return otherParticipant?.user.fullName || 'Unknown';
    }
    return room.name || 'Group Chat';
  };

  const getRoomAvatar = () => {
    const name = getRoomName();
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (userId: string) => {
    const colors = [
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!isOpen || !room) return null;

  return (
    <>
      {/* Overlay - Adjusted opacity to prevent "pitch black" look */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[100] transition-opacity duration-300"
        onClick={onClose}
        style={{ backdropFilter: 'blur(4px)' }}
      />

      {/* Drawer - Added dark mode support and refined shadow */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white dark:bg-slate-900 shadow-[-8px_0_24px_-12px_rgba(0,0,0,0.3)] z-[101] flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Thông tin chi tiết</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Room Info */}
          <div className="flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3 ${room.type === 'DIRECT' ? 'bg-purple-400' : 'bg-purple-500'}`}>
              {getRoomAvatar()}
            </div>
            <h3 className="text-xl font-bold mb-1">{getRoomName()}</h3>
            {room.type !== 'DIRECT' && (
              <p className="text-purple-100 text-sm">
                {room.participants?.length || 0} thành viên
              </p>
            )}
            {room.description && (
              <p className="text-purple-100 text-sm mt-2 text-center">
                {room.description}
              </p>
            )}
          </div>
        </div>

        {/* Tabs - Added dark mode support */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${activeTab === 'members'
              ? 'text-purple-600 border-b-3 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Thành viên</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${activeTab === 'media'
              ? 'text-purple-600 border-b-3 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Media</span>
              {mediaMessages.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                  {mediaMessages.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${activeTab === 'files'
              ? 'text-purple-600 border-b-3 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Files</span>
              {fileMessages.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                  {fileMessages.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="p-6">
              {isAdmin && room.type !== 'DIRECT' && (
                <button
                  onClick={() => setIsAddMembersModalOpen(true)}
                  className="w-full mb-6 px-6 py-3.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm thành viên
                </button>
              )}

              <div className="space-y-3">
                {room.participants?.map((participant: any) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md ${getAvatarColor(participant.userId)}`}>
                        {participant.user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate text-base">
                          {participant.user.fullName}
                          {participant.userId === currentUserId && (
                            <span className="text-xs text-purple-600 dark:text-purple-400 ml-2 font-normal">(Bạn)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {participant.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {participant.role === 'ADMIN' && (
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                          Admin
                        </span>
                      )}
                      {isAdmin &&
                        participant.userId !== currentUserId &&
                        room.type !== 'DIRECT' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Xóa ${participant.user.fullName} khỏi nhóm?`)) {
                                onRemoveMember?.(participant.userId);
                              }
                            }}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa khỏi nhóm"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="p-6">
              {isLoadingMedia ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm">Đang tải media...</p>
                  </div>
                </div>
              ) : mediaMessages.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {mediaMessages.map((message) => (
                    <div
                      key={message.id}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:scale-105 shadow-md hover:shadow-xl"
                      onClick={() => window.open(message.content, '_blank')}
                    >
                      <img
                        src={message.content}
                        alt="Media"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Chưa có ảnh</p>
                  <p className="text-sm text-gray-500">Ảnh được chia sẻ sẽ hiển thị ở đây</p>
                </div>
              )}
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="p-6">
              {isLoadingMedia ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Đang tải files...</p>
                  </div>
                </div>
              ) : fileMessages.length > 0 ? (
                <div className="space-y-3">
                  {fileMessages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md cursor-pointer"
                    >
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl flex-shrink-0">
                        <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {message.metadata?.fileName || 'File đính kèm'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {message.metadata?.fileSize
                              ? formatFileSize(message.metadata.fileSize)
                              : 'Unknown size'}
                          </p>
                          <span className="text-gray-300">•</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(message.createdAt), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                      <a
                        href={message.content}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors flex-shrink-0 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                        title="Tải xuống"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Chưa có file</p>
                  <p className="text-sm text-gray-500">File được chia sẻ sẽ hiển thị ở đây</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info - Added dark mode support */}
        {room && (
          <div className="border-t border-gray-200 dark:border-slate-800 p-4 bg-gray-50 dark:bg-slate-900/50">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>
                <span className="font-medium">Loại:</span>{' '}
                {room.type === 'DIRECT'
                  ? 'Trò chuyện trực tiếp'
                  : room.type === 'GROUP'
                    ? 'Nhóm'
                    : 'Cộng đồng'}
              </p>
              <p>
                <span className="font-medium">Tạo lúc:</span>{' '}
                {format(new Date(room.createdAt), 'dd/MM/yyyy HH:mm')}
              </p>
              {room.type === 'CHANNEL' && (
                <p>
                  <span className="font-medium">Trạng thái:</span>{' '}
                  {room.isPublic ? 'Công khai' : 'Riêng tư'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <AddMembersModal
        isOpen={isAddMembersModalOpen}
        onClose={() => setIsAddMembersModalOpen(false)}
        onAddMembers={async (userIds) => {
          await onAddMembers?.(userIds);
          setIsAddMembersModalOpen(false);
        }}
        existingMemberIds={room.participants?.map((p: any) => p.userId)}
      />
    </>
  );
}
