'use client';

import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

// Danh sách 5 emoji phổ biến nhất
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🙏'];

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
      // Delay để tránh đóng ngay khi mở
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleReactionClick = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  // Render ở giữa màn hình với portal
  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-[9998] animate-in fade-in duration-150"
        onClick={onClose}
      />
      
      {/* Picker ở giữa màn hình */}
      <div
        ref={pickerRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-[9999] animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              className="w-12 h-12 flex items-center justify-center text-2xl hover:bg-purple-50 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}
