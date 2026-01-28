'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/store/chatStore';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatSidebar } from './ChatSidebar';
import { NewChatModal } from './NewChatModal';
import { ChatInfoDrawer } from './ChatInfoDrawer';
import { MessageSearchModal } from './MessageSearchModal';
import { VideoCallManager } from '../VideoCall/VideoCallManager';
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
    addMembers,
    removeMember,
    pinMessage,
    unpinMessage,
    uploadFile,
    loadPinnedMessages,
    socketRef,
  } = useChat();
  
  // Import updateMessage from chatStore for optimistic updates
  const { updateMessage } = useChatStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadRooms();
    }
  }, [isConnected, loadRooms]);

  useEffect(() => {
    if (activeRoomId) {
      loadMessages(activeRoomId);
      markAsRead(activeRoomId);
      loadPinnedMessages(activeRoomId).then(setPinnedMessages);
    }
  }, [activeRoomId, loadMessages, markAsRead, loadPinnedMessages]);

  useEffect(() => {
    if (activeRoomId && messages[activeRoomId]) {
      loadPinnedMessages(activeRoomId).then(setPinnedMessages);
    }
  }, [messages, activeRoomId, loadPinnedMessages]);

  // Update activeRoom to clear reply if room changes
  useEffect(() => {
    setReplyingToMessage(null);
  }, [activeRoomId]);

  useEffect(() => {
    const handleOpenModal = () => setIsNewChatModalOpen(true);
    window.addEventListener('openNewChatModal', handleOpenModal);
    return () => window.removeEventListener('openNewChatModal', handleOpenModal);
  }, []);

  // Listen for meeting link messages
  useEffect(() => {
    const handleSendMeetingLink = (event: any) => {
      const { roomId, content, type, metadata } = event.detail;
      if (roomId === activeRoomId) {
        sendMessage(roomId, content, type, metadata);
      }
    };

    window.addEventListener('send:meeting:link', handleSendMeetingLink);
    return () => window.removeEventListener('send:meeting:link', handleSendMeetingLink);
  }, [activeRoomId, sendMessage]);

  // Listen for meeting creation status
  useEffect(() => {
    const handleMeetingCreating = () => setIsCreatingMeeting(true);
    const handleMeetingCreated = () => setIsCreatingMeeting(false);
    const handleMeetingError = () => setIsCreatingMeeting(false);

    window.addEventListener('meeting:creating', handleMeetingCreating);
    window.addEventListener('meeting:created', handleMeetingCreated);
    window.addEventListener('meeting:error', handleMeetingError);

    return () => {
      window.removeEventListener('meeting:creating', handleMeetingCreating);
      window.removeEventListener('meeting:created', handleMeetingCreated);
      window.removeEventListener('meeting:error', handleMeetingError);
    };
  }, []);

  const activeRoom = Array.isArray(rooms) ? rooms.find((r) => r.id === activeRoomId) : undefined;
  const activeMessages = activeRoomId && messages ? messages[activeRoomId] || [] : [];
  const activeTypingUsers = typingUsers.filter((tu) => tu.roomId === activeRoomId);

  const handleSendMessage = (content: string, type: string = 'TEXT', metadata: any = {}) => {
    if (activeRoomId) {
      let finalMetadata = { ...metadata };
      if (replyingToMessage) {
        finalMetadata.replyTo = {
          id: replyingToMessage.id,
          content: replyingToMessage.content,
          sender: replyingToMessage.sender
        };
      }
      sendMessage(activeRoomId, content, type, finalMetadata);
      setReplyingToMessage(null);
    }
  };

  const handleSendMessageWrapper = (content: string) => {
    handleSendMessage(content);
  }

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
        (p: any) => p.userId !== user?.id,
      );
      return otherParticipant?.user.fullName || 'Unknown';
    }
    return room.name || 'Group Chat';
  };

  const getRoomAvatar = (room: typeof activeRoom) => {
    const name = getRoomName(room);
    return name.charAt(0).toUpperCase();
  };

  const handleForwardMessage = (message: any) => {
    navigator.clipboard.writeText(message.content);
    alert('Đã sao chép nội dung tin nhắn để chuyển tiếp');
  };

  const handleUploadFile = async (file: File) => {
    if (activeRoomId) {
      try {
        const result = await uploadFile(file);
        const type = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
        const metadata = {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        };
        handleSendMessage(result.url || result.storagePath, type, metadata);
      } catch (error) {
        console.error(error);
        alert('Lỗi tải lên file');
      }
    }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] bg-white">
        <ChatSidebar
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelectRoom={setActiveRoom}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onCreateRoom={handleCreateRoom}
        />

        <div className="flex-1 flex flex-col">
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>

                  <div className={`w-10 h-10 rounded flex items-center justify-center text-white font-semibold ${activeRoom.type === 'DIRECT' ? 'bg-purple-500' : 'bg-green-500'}`}>
                    {getRoomAvatar(activeRoom)}
                  </div>

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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const event = new CustomEvent('call:start:request', {
                        detail: {
                          roomId: activeRoomId,
                          roomName: getRoomName(activeRoom),
                          type: activeRoom.type
                        }
                      });
                      window.dispatchEvent(event);
                    }}
                    disabled={isCreatingMeeting}
                    className={`p-2 rounded-lg transition-colors ${
                      isCreatingMeeting
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-purple-100 text-purple-600'
                    }`}
                    title={isCreatingMeeting ? 'Đang tạo cuộc họp...' : 'Gọi Video'}
                  >
                    {isCreatingMeeting ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setIsSearchModalOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Tìm kiếm"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsInfoDrawerOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Thông tin"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {activeRoom.type !== 'DIRECT' &&
                    activeRoom.participants?.find((p: any) => p.userId === user?.id)?.role === 'ADMIN' && (
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

              {/* Pinned Messages Section */}
              {pinnedMessages.length > 0 && (
                <div className="bg-yellow-50 border-b px-6 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">
                        {pinnedMessages.length} tin nhắn được ghim
                      </span>
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {pinnedMessages.map((msg) => (
                      <div key={msg.id} className="flex items-center justify-between py-1 border-b border-yellow-100 last:border-0 hover:bg-yellow-100 rounded px-1 transition-colors">
                        <span className="text-sm text-gray-700 truncate flex-1 mr-2 cursor-pointer" title={msg.content}>
                          <span className="font-semibold mr-1">{msg.sender?.fullName}:</span>
                          {msg.content}
                        </span>
                        <button
                          onClick={() => unpinMessage(msg.id)}
                          className="p-1 hover:bg-yellow-200 rounded text-yellow-700"
                          title="Bỏ ghim"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <MessageList
                messages={activeMessages}
                currentUserId={user?.id}
                typingUsers={activeTypingUsers}
                room={activeRoom}
                onDeleteMessage={deleteMessage}
                onPinMessage={pinMessage}
                onUnpinMessage={unpinMessage}
                onForwardMessage={handleForwardMessage}
                onReplyMessage={setReplyingToMessage}
                onAddReaction={(messageId, emoji) => {
                  // Optimistic update - cập nhật ngay lập tức
                  if (!activeRoomId) return;
                  const currentMessages = messages[activeRoomId] || [];
                  const messageIndex = currentMessages.findIndex(m => m.id === messageId);
                  
                  if (messageIndex !== -1) {
                    const message = currentMessages[messageIndex];
                    const reactions = message.reactions || [];
                    
                    // Check if user already reacted with this emoji
                    const existingReaction = reactions.find(
                      r => r.emoji === emoji && r.userId === user?.id
                    );
                    
                    if (!existingReaction) {
                      // Add reaction optimistically
                      const updatedMessage = {
                        ...message,
                        reactions: [
                          ...reactions,
                          {
                            emoji,
                            userId: user?.id || '',
                            userName: user?.fullName || 'You'
                          }
                        ]
                      };
                      updateMessage(updatedMessage);
                    }
                  }
                  
                  // Send to server
                  if (socketRef.current?.connected) {
                    socketRef.current.emit('message:react', {
                      messageId,
                      emoji,
                    });
                  }
                }}
                onRemoveReaction={(messageId, emoji) => {
                  // Optimistic update - xóa ngay lập tức
                  if (!activeRoomId) return;
                  const currentMessages = messages[activeRoomId] || [];
                  const messageIndex = currentMessages.findIndex(m => m.id === messageId);
                  
                  if (messageIndex !== -1) {
                    const message = currentMessages[messageIndex];
                    const reactions = message.reactions || [];
                    
                    // Remove reaction optimistically
                    const updatedMessage = {
                      ...message,
                      reactions: reactions.filter(
                        r => !(r.emoji === emoji && r.userId === user?.id)
                      )
                    };
                    updateMessage(updatedMessage);
                  }
                  
                  // Send to server
                  if (socketRef.current?.connected) {
                    socketRef.current.emit('message:unreact', {
                      messageId,
                      emoji,
                    });
                  }
                }}
              />

              <MessageInput
                onSendMessage={handleSendMessageWrapper}
                onTyping={handleTyping}
                onUploadFile={handleUploadFile}
                disabled={!isConnected}
                placeholder={`Nhắn tin tới ${getRoomName(activeRoom)}`}
                replyTo={replyingToMessage}
                onCancelReply={() => setReplyingToMessage(null)}
                participants={activeRoom?.participants}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md px-6">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chào mừng đến với Chat</h3>
                <p className="text-gray-600 mb-6">Chọn một cuộc trò chuyện từ thanh bên hoặc bắt đầu cuộc trò chuyện mới</p>
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

      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      <ChatInfoDrawer
        isOpen={isInfoDrawerOpen}
        onClose={() => setIsInfoDrawerOpen(false)}
        room={activeRoom}
        currentUserId={user?.id}
        onAddMembers={async (userIds) => {
          if (activeRoomId) {
            await addMembers(activeRoomId, userIds);
          }
        }}
        onRemoveMember={async (userId) => {
          if (activeRoomId) {
            await removeMember(activeRoomId, userId);
          }
        }}
      />

      {activeRoomId && (
        <MessageSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          roomId={activeRoomId}
          onMessageSelect={(messageId) => {
            // Scroll to message
            const el = document.getElementById(`message-${messageId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight message briefly
              el.classList.add('bg-yellow-100');
              setTimeout(() => {
                el.classList.remove('bg-yellow-100');
              }, 2000);
            }
          }}
        />
      )}

      <VideoCallManager />
    </>
  );
}
