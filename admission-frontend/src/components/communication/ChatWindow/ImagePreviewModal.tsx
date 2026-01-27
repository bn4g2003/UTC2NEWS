'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (imageUrl) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
        title="Đóng (Esc)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Download button */}
      <a
        href={imageUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-16 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
        title="Tải xuống"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </a>

      {/* Image */}
      <img
        src={imageUrl}
        alt="Preview"
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
        Click bên ngoài hoặc nhấn ESC để đóng
      </div>
    </div>,
    document.body
  );
}
