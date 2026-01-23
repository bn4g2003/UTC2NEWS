import { useState, useCallback } from 'react';

/**
 * Hook for managing modal/drawer open/close state
 * 
 * @param initialState - Initial open state (default: false)
 * @returns Object with isOpen state and control functions
 */
export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useModal(initialState: boolean = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
