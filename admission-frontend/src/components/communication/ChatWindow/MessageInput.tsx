'use client';

import { useState, useRef, useEffect } from 'react';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  onUploadFile?: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
  replyTo?: any;
  onCancelReply?: () => void;
  participants?: any[];
}

export function MessageInput({
  onSendMessage,
  onTyping,
  onUploadFile,
  disabled = false,
  placeholder = 'Nhập tin nhắn...',
  replyTo,
  onCancelReply,
  participants = []
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    setMessage(value);
    setCursorPosition(selectionStart);

    // Mention logic
    const lastChar = value.slice(selectionStart - 1, selectionStart);
    // Simple check: if last char is @, start mention
    // Or if we are in mention mode (detected by looking back to last @)
    // Complex implementation needed for robust mentions, but simple version:
    // If user types @, show list. If they type space, hide list.

    // Check for mention trigger
    const textBeforeCursor = value.slice(0, selectionStart);
    const lastAtRate = textBeforeCursor.lastIndexOf('@');

    if (lastAtRate !== -1) {
      const textFromAt = textBeforeCursor.slice(lastAtRate + 1);
      // If no spaces, we are typing a mention
      if (!textFromAt.includes(' ')) {
        setShowMentions(true);
        setMentionFilter(textFromAt.toLowerCase());
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    // Typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 1000);
    } else {
      // Stop typing immediately if message is empty
      setIsTyping(false);
      onTyping(false);
    }
  };

  const handleSelectMention = (user: any) => {
    const textBeforeCursor = message.slice(0, cursorPosition);
    const lastAtRate = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = message.slice(cursorPosition);

    const newText = message.slice(0, lastAtRate) + `@${user.user.fullName} ` + textAfterCursor;
    setMessage(newText);
    setShowMentions(false);

    // Reset focus
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const cursorPos = textareaRef.current?.selectionStart || message.length;
    const newMessage = message.slice(0, cursorPos) + emoji + message.slice(cursorPos);
    setMessage(newMessage);
    setShowEmojiPicker(false);

    // Reset focus and cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = cursorPos + emoji.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage);
    setMessage('');
    setIsTyping(false);
    onTyping(false);
    onCancelReply?.();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // If mentions open and item selected? For now manual click or improve later
      handleSubmit(e);
    }
    // TODO: Arrow keys for mention navigation
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter participants
  const filteredParticipants = participants.filter(p =>
    p.user.fullName.toLowerCase().includes(mentionFilter)
  );

  return (
    <div className="bg-white border-t">
      {/* Reply Preview */}
      {replyTo && (
        <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-1 h-8 bg-purple-500 rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-purple-600">
                Đang trả lời {replyTo.sender.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {replyTo.content}
              </p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="px-4 py-3 relative">
        {/* Mention Popup */}
        {showMentions && filteredParticipants.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-20">
            <div className="max-h-48 overflow-y-auto">
              {filteredParticipants.map(participant => (
                <div
                  key={participant.id}
                  className="px-4 py-2 hover:bg-purple-50 cursor-pointer flex items-center gap-2"
                  onClick={() => handleSelectMention(participant)}
                  role="button"
                >
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-600">
                    {participant.user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 truncate">{participant.user.fullName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* Toolbar */}
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              disabled={disabled}
            />
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Thêm file"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>

          {/* Input Container */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'Đang kết nối...' : placeholder}
              disabled={disabled}
              className="w-full resize-none border border-gray-300 rounded-lg px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              rows={1}
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />

            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 bottom-2 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Emoji"
              disabled={disabled}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Emoji Picker */}
            <EmojiPicker
              isOpen={showEmojiPicker}
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="p-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Gửi (Enter)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 mt-2 px-1">
          <span className="font-medium">Enter</span> để gửi, <span className="font-medium">Shift + Enter</span> để xuống dòng. <span className="font-medium">@</span> để nhắc đến ai đó.
        </p>
      </div>
    </div>
  );
}
