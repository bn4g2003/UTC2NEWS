'use client';

import { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  senderId: string;
  sender: {
    fullName: string;
  };
}

interface TypingUser {
  userId: string;
  roomId: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  typingUsers?: TypingUser[];
  room?: any;
  onDeleteMessage?: (messageId: string) => void;
}

export function MessageList({ messages, currentUserId, typingUsers = [], room, onDeleteMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  const formatDateDivider = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return 'Hôm nay';
    } else if (isYesterday(date)) {
      return 'Hôm qua';
    } else {
      return format(date, 'EEEE, dd/MM/yyyy');
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt);
    const lastGroup = groupedMessages[groupedMessages.length - 1];

    if (lastGroup && isSameDay(new Date(lastGroup.date), messageDate)) {
      lastGroup.messages.push(message);
    } else {
      groupedMessages.push({
        date: message.createdAt,
        messages: [message],
      });
    }
  });

  // Get typing user names
  const typingUserNames = typingUsers
    .map((tu) => {
      const participant = room?.participants?.find((p: any) => p.userId === tu.userId);
      return participant?.user?.fullName;
    })
    .filter(Boolean);

  const getAvatarColor = (senderId: string) => {
    const colors = [
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index = senderId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-medium text-gray-700">Chưa có tin nhắn</p>
            <p className="text-sm mt-1">Bắt đầu cuộc trò chuyện!</p>
          </div>
        </div>
      ) : (
        <div className="px-6 py-4">
          {groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date Divider */}
              <div className="flex items-center justify-center my-4">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-xs font-semibold text-gray-600 bg-white">
                  {formatDateDivider(group.date)}
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Messages */}
              {group.messages.map((message, index) => {
                const isOwnMessage = message.senderId === currentUserId;
                const prevMessage = index > 0 ? group.messages[index - 1] : null;
                const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
                const isHovered = hoveredMessageId === message.id;

                return (
                  <div
                    key={message.id}
                    onMouseEnter={() => setHoveredMessageId(message.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                    className={`group relative ${showAvatar ? 'mt-4' : 'mt-1'} hover:bg-gray-50 -mx-4 px-4 py-1 rounded transition-colors`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 flex-shrink-0">
                        {showAvatar && (
                          <div className={`w-9 h-9 rounded flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(message.senderId)}`}>
                            {message.sender.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        {showAvatar && (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-sm text-gray-900">
                              {message.sender.fullName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(message.createdAt)}
                            </span>
                          </div>
                        )}

                        <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      </div>

                      {/* Hover Actions */}
                      {isHovered && (
                        <div className="absolute -top-3 right-4 bg-white border border-gray-200 rounded-lg shadow-lg flex items-center gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Thêm reaction"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Trả lời"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                          {isOwnMessage && (
                            <button
                              onClick={() => onDeleteMessage && onDeleteMessage(message.id)}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors text-red-500"
                              title="Xóa tin nhắn"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Thêm tùy chọn"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Typing indicator */}
          {typingUserNames.length > 0 && (
            <div className="mt-4 flex items-start gap-3">
              <div className="w-9 h-9 bg-gray-300 rounded flex items-center justify-center text-white font-semibold text-sm">
                ...
              </div>
              <div className="flex-1">
                <div className="inline-block bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-1">
                  {typingUserNames.join(', ')} đang nhập...
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
