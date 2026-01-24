'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

interface MessageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  onMessageSelect?: (messageId: string) => void;
}

export function MessageSearchModal({
  isOpen,
  onClose,
  roomId,
  onMessageSelect,
}: MessageSearchModalProps) {
  const { token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Search messages
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (!token) {
          console.error('No token found for searching');
          return;
        }
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/rooms/${roomId}/messages?limit=200`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const messages = await response.json();

          // Filter messages by search query
          const filtered = messages.filter((msg: any) =>
            !msg.deletedAt &&
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
          );

          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Failed to search messages:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, roomId]);

  const handleMessageClick = (messageId: string) => {
    onMessageSelect?.(messageId);
    onClose();
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[110] flex items-start justify-center pt-20 transition-all duration-300" style={{ backdropFilter: 'blur(4px)' }}>
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden animate-fade-in-up"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tìm kiếm tin nhắn</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nội dung tin nhắn..."
              autoFocus
              className="w-full px-4 py-2.5 pl-11 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {!searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Nhập từ khóa để tìm kiếm</p>
              <p className="text-sm mt-1">Tìm kiếm sẽ được thực hiện trong toàn bộ cuộc trò chuyện</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleMessageClick(message.id)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-all border border-gray-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900/50 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {message.sender.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          {message.sender.fullName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                        {highlightText(message.content, searchQuery)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Không tìm thấy kết quả</p>
              <p className="text-sm mt-1">Bạn hãy thử tìm kiếm với từ khóa khác nhé</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {searchResults.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center font-medium">
              Tìm thấy {searchResults.length} kết quả
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
