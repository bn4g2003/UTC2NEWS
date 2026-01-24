'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatSidebar } from './ChatSidebar';
import { NewChatModal } from './NewChatModal';
import { useAuthStore } from '@/store/authStore';

export function ChatWindow() {
  const { user } = useAuthStore();
  const {
    rooms,
    messages,
    activeRoomId,
    typingUsers,
    isConnected,
    setActiveRoom,
    loadRooms,
    loadMessages,
    createRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    deleteMessage,
    deleteRoom,
  } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadRooms();
    }
  }, [isConnected, loadRooms]);

  useEffect(() => {
    if (activeRoomId) {
      loadMessages(activeRoomId);
      markAsRead(activeRoomId);
    }
  }, [activeRoomId, loadMessages, markAsRead]);

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenModal = () => setIsNewChatModalOpen(true);
    window.addEventListener('openNewChatModal', handleOpenModal);
    return () => window.removeEventListener('openNewChatModal', handleOpenModal);
  }, []);

  const activeRoom = Array.isArray(rooms) ? rooms.find((r) => r.id === activeRoomId) : undefined;
  const activeMessages = activeRoomId && messages ? messages[activeRoomId] || [] : [];

  // Get typing users for active room
  const activeTypingUsers = typingUsers.filter((tu) => tu.roomId === activeRoomId);

  const handleSendMessage = (content: string) => {
    if (activeRoomId) {
      sendMessage(activeRoomId, content);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (activeRoomId) {
      if (isTyping) {
        startTyping(activeRoomId);
      } else {
        stopTyping(activeRoomId);
      }
    }
  };

  const handleCreateRoom = async (participantIds: string[], name?: string, type?: string, isPublic?: boolean, description?: string) => {
    try {
      await createRoom(participantIds, name, type, isPublic, description);
      setIsNewChatModalOpen(false);
    } catch (error: any) {
      alert(error.message || 'Không thể tạo phòng chat');
    }
  };

  const getRoomName = (room: typeof activeRoom) => {
    if (!room) return '';
    if (room.type === 'DIRECT') {
      const otherParticipant = room.participants.find(
        (p) => p.userId !== user?.id,
      );
      return otherParticipant?.user.fullName || 'Unknown';
    }
    return room.name || 'Group Chat';
  };

  const getRoomAvatar = (room: typeof activeRoom) => {
    const name = getRoomName(room);
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] bg-white">
        {/* Sidebar */}
        <ChatSidebar
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelectRoom={setActiveRoom}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onCreateRoom={handleCreateRoom}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Toggle sidebar on mobile */}
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>

                  {/* Room Avatar */}
                  <div className={`w-10 h-10 rounded flex items-center justify-center text-white font-semibold ${activeRoom.type === 'DIRECT' ? 'bg-purple-500' : 'bg-green-500'
                    }`}>
                    {getRoomAvatar(activeRoom)}
                  </div>

                  {/* Room Info */}
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      {getRoomName(activeRoom)}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {isConnected ? (
                        activeTypingUsers.length > 0 ? (
                          <span className="text-green-600 font-medium">
                            {activeTypingUsers.length === 1
                              ? 'đang nhập...'
                              : `${activeTypingUsers.length} người đang nhập...`}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Đang hoạt động
                          </span>
                        )
                      ) : (
                        'Đang kết nối...'
                      )}
                    </p>
                  </div>
                </div>

                {/* Room Actions */}
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Tìm kiếm">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Thông tin">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {/* Delete Room Button (Admin only, non-direct) */}
                  {activeRoom.type !== 'DIRECT' &&
                    activeRoom.participants?.find((p) => p.userId === user?.id)?.role === 'ADMIN' && (
                      <button
                        onClick={async () => {
                          if (confirm('Bạn có chắc chắn muốn xóa nhóm/cộng đồng này không? Hành động này không thể hoàn tác.')) {
                            try {
                              await deleteRoom(activeRoom.id);
                            } catch (e: any) {
                              alert(e.message || 'Lỗi khi xóa phòng');
                            }
                          }
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                        title="Xóa nhóm/cộng đồng"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                </div>
              </div>

              {/* Messages */}
              <MessageList
                messages={activeMessages}
                currentUserId={user?.id}
                typingUsers={activeTypingUsers}
                room={activeRoom}
                onDeleteMessage={deleteMessage}
              />

              {/* Input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                disabled={!isConnected}
                placeholder={`Nhắn tin tới ${getRoomName(activeRoom)}`}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md px-6">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Chào mừng đến với Chat
                </h3>
                <p className="text-gray-600 mb-6">
                  Chọn một cuộc trò chuyện từ thanh bên hoặc bắt đầu cuộc trò chuyện mới
                </p>
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Bắt đầu trò chuyện
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </>
  );
}
