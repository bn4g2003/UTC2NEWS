import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModal } from './useModal';

describe('useModal', () => {
  it('should initialize with default closed state', () => {
    const { result } = renderHook(() => useModal());
    
    expect(result.current.isOpen).toBe(false);
  });

  it('should initialize with provided initial state', () => {
    const { result } = renderHook(() => useModal(true));
    
    expect(result.current.isOpen).toBe(true);
  });

  it('should open modal when open is called', () => {
    const { result } = renderHook(() => useModal());
    
    act(() => {
      result.current.open();
    });
    
    expect(result.current.isOpen).toBe(true);
  });

  it('should close modal when close is called', () => {
    const { result } = renderHook(() => useModal(true));
    
    act(() => {
      result.current.close();
    });
    
    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle modal state', () => {
    const { result } = renderHook(() => useModal());
    
    // Toggle to open
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);
    
    // Toggle to close
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useModal());
    
    const initialOpen = result.current.open;
    const initialClose = result.current.close;
    const initialToggle = result.current.toggle;
    
    rerender();
    
    expect(result.current.open).toBe(initialOpen);
    expect(result.current.close).toBe(initialClose);
    expect(result.current.toggle).toBe(initialToggle);
  });
});
