import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePagination } from './usePagination';

describe('usePagination', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePagination(10));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.total).toBe(0);
    expect(result.current.totalPages).toBe(1);
  });

  it('should calculate total pages correctly', () => {
    const { result } = renderHook(() => usePagination(10));

    act(() => {
      result.current.setTotal(25);
    });

    expect(result.current.totalPages).toBe(3);
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() => usePagination(10));

    act(() => {
      result.current.setTotal(30);
    });

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('should navigate to previous page', () => {
    const { result } = renderHook(() => usePagination(10));

    act(() => {
      result.current.setTotal(30);
      result.current.goToPage(2);
    });

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should not go below page 1', () => {
    const { result } = renderHook(() => usePagination(10));

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should not exceed total pages', () => {
    const { result } = renderHook(() => usePagination(10));

    act(() => {
      result.current.setTotal(20);
      result.current.goToPage(5);
    });

    expect(result.current.currentPage).toBe(2); // Max is 2 pages
  });

  it('should reset to page 1 when page size changes', () => {
    const { result } = renderHook(() => usePagination(10));

    act(() => {
      result.current.setTotal(50);
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.setPageSize(20);
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(20);
  });
});
