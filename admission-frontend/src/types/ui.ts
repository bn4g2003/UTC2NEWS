/**
 * UI-related TypeScript types
 */

import { ReactNode } from 'react';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterState {
  [key: string]: any;
}

export interface DataGridState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationState;
  sort: SortState | null;
  filters: FilterState;
  selectedRows: T[];
}

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

export interface MenuItem {
  key: string;
  label: string;
  icon: ReactNode;
  path: string;
  permission?: string;
  children?: MenuItem[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface NavItem {
  label: string;
  path: string;
  children?: NavItem[];
}

export interface FooterLink {
  label: string;
  path: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}
