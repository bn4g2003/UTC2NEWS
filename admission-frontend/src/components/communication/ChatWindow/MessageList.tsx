'use client';

import { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ReactionPicker } from './ReactionPicker';
import { ImagePreviewModal } from './ImagePreviewModal';

interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  senderId: string;
  isPinned?: boolean;
  metadata?: any;
  isDeleted?: boolean;
  reactions?: Array<{
    emoji: string;
    userId: string;
    userName: string;
  }>;
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
  onPinMessage?: (messageId: string) => void;
  onUnpinMessage?: (messageId: string) => void;
  onForwardMessage?: (message: Message) => void;
  onReplyMessage?: (message: Message) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  typingUsers = [],
  room,
  onDeleteMessage,
  onPinMessage,
  onUnpinMessage,
  onForwardMessage,
  onReplyMessage,
  onAddReaction,
  onRemoveReaction,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);
  const [shouldScrollBottom, setShouldScrollBottom] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Check scroll position
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      // If within 100px of bottom, auto-scroll
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldScrollBottom(isNearBottom);
    }
  };

  const scrollToBottom = (force = false) => {
    if (force || shouldScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, typingUsers.length]);

  useEffect(() => {
    // Initial scroll
    setShouldScrollBottom(true);
    setTimeout(() => scrollToBottom(true), 100);
  }, [room?.id]);

  const handleDelete = (messageId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
      onDeleteMessage?.(messageId);
    }
  };

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

  const renderMessageContent = (message: Message, isOwnMessage: boolean) => {
    if (message.isDeleted || message.content === 'Tin nhắn đã bị thu hồi') {
      return (
        <div className="text-sm italic text-gray-400">
          Tin nhắn đã bị thu hồi
        </div>
      );
    }

    const replyTo = message.metadata?.replyTo;

    return (
      <div className="flex flex-col gap-1">
        {replyTo && (
          <div className="bg-gray-50 border-l-2 border-purple-500 pl-2 py-1 mb-1 rounded text-xs cursor-pointer opacity-75 hover:opacity-100 overflow-hidden"
            onClick={() => {
              const el = document.getElementById(`message-${replyTo.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            <p className="font-semibold text-purple-600 truncate break-all">{replyTo.sender.fullName}</p>
            <p className="text-gray-600 truncate break-all">{replyTo.content}</p>
          </div>
        )}

        {(() => {
          switch (message.type) {
            case 'MEETING_LINK':
              return (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 max-w-md">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h4 className="font-semibold text-gray-900 mb-1 break-words">📹 Cuộc họp video</h4>
                      <p className="text-sm text-gray-700 mb-3 break-words">
                        <span className="font-medium">{message.metadata?.createdByName}</span> đã tạo cuộc họp video
                      </p>
                      <button
                        onClick={() => {
                          // Open meeting in new tab or modal
                          window.open(message.metadata?.meetingLink, '_blank');
                        }}
                        className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Tham gia ngay
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Bạn có thể tham gia bất kỳ lúc nào
                      </p>
                    </div>
                  </div>
                </div>
              );
            case 'IMAGE':
              return (
                <div className="max-w-sm rounded-lg overflow-hidden shadow-md">
                  <img
                    src={message.content}
                    alt="Sent image"
                    className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewImageUrl(message.content)}
                  />
                </div>
              );
            case 'FILE':
              return (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-sm">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-sm font-medium text-gray-900 truncate break-all">
                      {message.metadata?.fileName || 'File đính kèm'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {message.metadata?.fileSize ? `${(message.metadata.fileSize / 1024 / 1024).toFixed(2)} MB` : 'File'}
                    </div>
                  </div>
                  <a
                    href={message.content}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    title="Tải xuống"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
              );
            default:
              return (
                <div className="text-sm text-gray-900 whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word">
                  {message.content}
                </div>
              );
          }
        })()}
      </div>
    );
  };

  // Group reactions by emoji
  const groupReactions = (reactions?: Message['reactions']) => {
    if (!reactions || reactions.length === 0) return [];

    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasCurrentUser: false,
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.userName);
      if (reaction.userId === currentUserId) {
        acc[reaction.emoji].hasCurrentUser = true;
      }
      return acc;
    }, {} as Record<string, { emoji: string; count: number; users: string[]; hasCurrentUser: boolean }>);

    return Object.values(grouped);
  };

  const handleReactionClick = (messageId: string, emoji: string, hasCurrentUser: boolean) => {
    if (hasCurrentUser) {
      onRemoveReaction?.(messageId, emoji);
    } else {
      onAddReaction?.(messageId, emoji);
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
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden bg-white"
      ref={containerRef}
      onScroll={handleScroll}
    >
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
                const isDeleted = message.isDeleted || message.content === 'Tin nhắn đã bị thu hồi';

                return (
                  <div
                    key={message.id}
                    id={`message-${message.id}`}
                    onMouseEnter={() => setHoveredMessageId(message.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                    className={`group relative ${showAvatar ? 'mt-3' : 'mt-0.5'} hover:bg-gray-50 -mx-4 px-4 py-1 rounded transition-colors ${message.isPinned ? 'bg-yellow-50 hover:bg-yellow-100' : ''}`}
                  >
                    <div className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className="w-9 h-9 flex-shrink-0">
                        {showAvatar && !isOwnMessage && (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(message.senderId)}`}>
                            {message.sender.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className={`flex-1 min-w-0 max-w-[70%] break-words ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
                        {showAvatar && (
                          <div className={`flex items-baseline gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                            <span className="font-semibold text-sm text-gray-900">
                              {isOwnMessage ? 'Bạn' : message.sender.fullName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(message.createdAt)}
                            </span>
                          </div>
                        )}

                        <div className="relative inline-block">
                          {message.isPinned && !isDeleted && (
                            <div className={`absolute ${isOwnMessage ? '-right-3' : '-left-3'} top-0 transform ${isOwnMessage ? 'translate-x-full' : '-translate-x-full'} text-yellow-500`}>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                          )}
                          {renderMessageContent(message, isOwnMessage)}
                        </div>
                        
                        {/* Reactions Display - Bên dưới tin nhắn - Only show if not deleted */}
                        {!isDeleted && message.reactions && message.reactions.length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            {groupReactions(message.reactions).map((reaction) => (
                              <button
                                key={reaction.emoji}
                                onClick={() => handleReactionClick(message.id, reaction.emoji, reaction.hasCurrentUser)}
                                className={`group/reaction relative flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-all hover:scale-105 shadow-sm ${
                                  reaction.hasCurrentUser
                                    ? 'bg-purple-100 border border-purple-300'
                                    : 'bg-white border border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                <span className="text-xs leading-none">{reaction.emoji}</span>
                                <span className={`text-xs font-medium leading-none ${reaction.hasCurrentUser ? 'text-purple-700' : 'text-gray-700'}`}>
                                  {reaction.count}
                                </span>
                                
                                {/* Tooltip hiển thị người thả */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/reaction:opacity-100 transition-opacity pointer-events-none z-50">
                                  {reaction.users.join(', ')}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Hover Actions */}
                      {isHovered && !isDeleted && (
                        <div className={`absolute ${isOwnMessage ? 'left-8' : 'right-8'} -top-3 bg-white border border-gray-200 rounded-lg shadow-lg flex items-center gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReactionPickerMessageId(message.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Thêm reaction"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => onReplyMessage?.(message)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Trả lời"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>

                          <button
                            onClick={() => onForwardMessage?.(message)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Chuyển tiếp"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => message.isPinned ? onUnpinMessage?.(message.id) : onPinMessage?.(message.id)}
                            className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${message.isPinned ? 'text-yellow-600' : 'text-gray-600'}`}
                            title={message.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}
                          >
                            <svg className="w-4 h-4" fill={message.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>

                          {isOwnMessage && (
                            <button
                              onClick={() => handleDelete(message.id)}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors text-red-500"
                              title="Xóa tin nhắn"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {typingUserNames.length > 0 && (
            <div className="mt-3 flex items-start gap-3">
              <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="inline-block bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1.5">
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
      
      {/* Reaction Picker - render ở giữa màn hình */}
      <ReactionPicker
        isOpen={reactionPickerMessageId !== null}
        onSelect={(emoji) => {
          if (reactionPickerMessageId) {
            onAddReaction?.(reactionPickerMessageId, emoji);
            setReactionPickerMessageId(null);
          }
        }}
        onClose={() => setReactionPickerMessageId(null)}
      />
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </div>
  );
}
