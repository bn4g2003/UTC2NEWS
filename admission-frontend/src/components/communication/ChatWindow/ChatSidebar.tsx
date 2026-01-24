'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

interface ChatRoom {
  id: string;
  name?: string;
  type: string;
  participants: Array<{
    userId: string;
    user: {
      id: string;
      fullName: string;
      username: string;
    };
  }>;
  messages?: Array<{
    content: string;
    createdAt: string;
    sender: {
      fullName: string;
    };
  }>;
  unreadCount?: number;
  updatedAt: string;
}

interface ChatSidebarProps {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onCreateRoom: (participantIds: string[], name?: string, type?: string) => Promise<void>;
}

export function ChatSidebar({
  rooms,
  activeRoomId,
  onSelectRoom,
  isOpen,
  onToggle,
  onCreateRoom,
}: ChatSidebarProps) {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatInput, setShowNewChatInput] = useState(false);

  // Separate direct messages, group chats, and channels
  const directMessages = Array.isArray(rooms)
    ? rooms.filter((room) => room.type === 'DIRECT')
    : [];
  const groupChats = Array.isArray(rooms)
    ? rooms.filter((room) => room.type === 'GROUP')
    : [];
  const channels = Array.isArray(rooms)
    ? rooms.filter((room) => room.type === 'CHANNEL')
    : [];

  const filterRooms = (roomList: ChatRoom[]) => {
    if (!searchQuery) return roomList;

    return roomList.filter((room) => {
      let roomName = '';
      if (room.type === 'DIRECT') {
        const otherParticipant = room.participants.find(
          (p) => p.userId !== user?.id,
        );
        roomName = otherParticipant?.user.fullName || 'Unknown';
      } else {
        roomName = room.name || (room.type === 'CHANNEL' ? 'Channel' : 'Group Chat');
      }

      return roomName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  const filteredDirectMessages = filterRooms(directMessages);
  const filteredGroupChats = filterRooms(groupChats);
  const filteredChannels = filterRooms(channels);

  const getRoomName = (room: ChatRoom) => {
    if (room.type === 'DIRECT') {
      const otherParticipant = room.participants.find(
        (p) => p.userId !== user?.id,
      );
      return otherParticipant?.user.fullName || 'Unknown';
    }
    return room.name || (room.type === 'CHANNEL' ? 'Channel' : 'Group Chat');
  };

  const getRoomAvatar = (room: ChatRoom) => {
    const name = getRoomName(room);
    return name.charAt(0).toUpperCase();
  };

  const RoomItem = ({ room }: { room: ChatRoom }) => {
    const lastMessage = room.messages?.[0];
    const isActive = activeRoomId === room.id;

    return (
      <button
        onClick={() => onSelectRoom(room.id)}
        className={`w-full px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-left group ${isActive ? 'bg-blue-50 hover:bg-blue-50' : ''
          }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 text-white font-semibold ${room.type === 'DIRECT' ? 'bg-purple-500' : 'bg-green-500'
            }`}>
            {getRoomAvatar(room)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <span className={`font-semibold text-sm truncate ${isActive ? 'text-blue-700' : 'text-gray-900'
                }`}>
                {getRoomName(room)}
              </span>
              {lastMessage && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {format(new Date(room.updatedAt), 'HH:mm')}
                </span>
              )}
            </div>

            {lastMessage && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-600 truncate">
                  {lastMessage.content}
                </p>
                {room.unreadCount && room.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 flex-shrink-0">
                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div
      className={`${isOpen ? 'w-64' : 'w-0'
        } bg-blue-50 text-gray-900 border-r border-blue-200 transition-all duration-300 overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 border-b border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold truncate text-blue-900">Tin nhắn</h2>
          <button
            onClick={() => {
              const event = new CustomEvent('openNewChatModal');
              window.dispatchEvent(event);
            }}
            className="p-1.5 hover:bg-blue-100 rounded transition-colors text-blue-600"
            title="Tạo cuộc trò chuyện mới"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
        />
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {/* Direct Messages */}
        {filteredDirectMessages.length > 0 && (
          <div className="py-2">
            <div className="px-4 py-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tin nhắn trực tiếp
              </h3>
              <span className="text-xs text-gray-400">
                {filteredDirectMessages.length}
              </span>
            </div>
            <div className="px-2 space-y-0.5">
              {filteredDirectMessages.map((room) => (
                <RoomItem key={room.id} room={room} />
              ))}
            </div>
          </div>
        )}

        {/* Group Chats */}
        {filteredGroupChats.length > 0 && (
          <div className="py-2">
            <div className="px-4 py-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Nhóm chat
              </h3>
              <span className="text-xs text-gray-400">
                {filteredGroupChats.length}
              </span>
            </div>
            <div className="px-2 space-y-0.5">
              {filteredGroupChats.map((room) => (
                <RoomItem key={room.id} room={room} />
              ))}
            </div>
          </div>
        )}

        {/* Channels */}
        {filteredChannels.length > 0 && (
          <div className="py-2">
            <div className="px-4 py-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Cộng đồng
              </h3>
              <span className="text-xs text-gray-400">
                {filteredChannels.length}
              </span>
            </div>
            <div className="px-2 space-y-0.5">
              {filteredChannels.map((room) => (
                <RoomItem key={room.id} room={room} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredDirectMessages.length === 0 && filteredGroupChats.length === 0 && filteredChannels.length === 0 && (
          <div className="p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300 mb-3"
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
            <p className="text-sm text-gray-500 font-medium mb-1">
              {searchQuery ? 'Không tìm thấy' : 'Chưa có cuộc trò chuyện'}
            </p>
            <p className="text-xs text-gray-400">
              {searchQuery ? 'Thử từ khóa khác' : 'Nhấn + để bắt đầu'}
            </p>
          </div>
        )}
      </div>

      {/* New Chat Quick Action */}
      {showNewChatInput && (
        <div className="p-3 border-t border-blue-200 bg-blue-100/50">
          <p className="text-xs text-gray-500 mb-2">Tạo cuộc trò chuyện mới:</p>
          <button
            onClick={() => {
              setShowNewChatInput(false);
              // Open full modal - we'll create this next
              const event = new CustomEvent('openNewChatModal');
              window.dispatchEvent(event);
            }}
            className="w-full px-3 py-2 bg-white hover:bg-blue-50 border border-blue-200 rounded text-sm transition-colors text-left text-blue-700"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Chọn người dùng...</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
