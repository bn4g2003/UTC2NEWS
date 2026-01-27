'use client';

import { useState, useEffect, useRef } from 'react';
import { useHMSStore, useHMSActions, selectHMSMessages } from '@100mslive/react-sdk';
import { format } from 'date-fns';

interface MeetingChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserName: string;
}

export function MeetingChat({ isOpen, onClose, currentUserName }: MeetingChatProps) {
  const hmsActions = useHMSActions();
  const messages = useHMSStore(selectHMSMessages);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    try {
      await hmsActions.sendBroadcastMessage(inputMessage.trim());
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-gray-800 border-l border-gray-700 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-white font-semibold">Chat trong cuộc họp</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-12 h-12 mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">Chưa có tin nhắn</p>
            <p className="text-xs mt-1">Gửi tin nhắn đầu tiên!</p>
          </div>
        ) : (
          messages.map((message: any) => {
            const isOwnMessage = message.senderName === currentUserName;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} w-full`}
              >
                <div className={`max-w-[85%] min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isOwnMessage && (
                    <span className="text-xs text-gray-400 mb-1 px-1 truncate max-w-full">
                      {message.senderName}
                    </span>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 break-words overflow-wrap-anywhere ${
                      isOwnMessage
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words word-break-break-word">
                      {message.message}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 px-1">
                    {format(new Date(message.time), 'HH:mm')}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {inputMessage.length}/500 ký tự
        </p>
      </form>
    </div>
  );
}
