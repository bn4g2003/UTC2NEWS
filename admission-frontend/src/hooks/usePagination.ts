import { useState, useCallback, useEffect, useMemo } from 'react';

export interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
}

export function usePagination(initialPageSize: number = 10): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [total, setTotalState] = useState(0);

  const totalPages = Math.ceil(total / pageSize) || 1;

  // Ensure current page doesn't exceed total pages when total changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  const setTotal = useCallback((newTotal: number) => {
    setTotalState((prev) => {
      if (prev === newTotal) return prev;
      return newTotal;
    });
  }, []);

  return useMemo(() => ({
    currentPage,
    pageSize,
    total,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    setTotal,
  }), [
    currentPage,
    pageSize,
    total,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    setTotal
  ]);
}
