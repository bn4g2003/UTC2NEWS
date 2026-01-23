import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  title: string;
  dataIndex: keyof T;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T) => ReactNode;
  width?: number | string;
}

export interface DataGridAction<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: (record: T) => void;
  permission?: string;
  danger?: boolean;
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

export interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: Error | null;
  
  // Pagination
  pagination?: PaginationConfig;
  
  // Sorting
  sortable?: boolean;
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  
  // Selection
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selectedRows: T[]) => void;
  
  // Actions
  actions?: DataGridAction<T>[];
  
  // Row key
  rowKey?: keyof T | ((record: T) => string);
}
