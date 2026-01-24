'use client';

import { useRef, useEffect } from 'react';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

// Danh sách emoji phổ biến cho reactions
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥'];

export function ReactionPicker({ onSelect, onClose, isOpen }: ReactionPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
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

  if (!isOpen) return null;

  const handleReactionClick = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50 flex items-center gap-1"
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReactionClick(emoji)}
          className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 rounded-lg transition-all hover:scale-110"
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
