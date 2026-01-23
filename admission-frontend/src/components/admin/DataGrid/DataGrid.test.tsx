import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataGrid } from './DataGrid';
import type { Column, DataGridAction } from './types';

interface TestData {
  id: string;
  name: string;
  email: string;
  age: number;
}

describe('DataGrid', () => {
  const mockData: TestData[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
  ];

  const mockColumns: Column<TestData>[] = [
    { key: 'name', title: 'Name', dataIndex: 'name' },
    { key: 'email', title: 'Email', dataIndex: 'email' },
    { key: 'age', title: 'Age', dataIndex: 'age', sortable: true },
  ];

  it('should render table with data', () => {
    render(<DataGrid columns={mockColumns} data={mockData} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('should render column headers', () => {
    render(<DataGrid columns={mockColumns} data={mockData} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('should show loading skeleton when loading with no data', () => {
    render(<DataGrid columns={mockColumns} data={[]} loading={true} />);

    // Skeleton should be rendered (check for skeleton class or structure)
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('should show error message when error is present', () => {
    const error = new Error('Failed to load data');
    render(<DataGrid columns={mockColumns} data={[]} error={error} />);

    expect(screen.getByText('Error loading data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const actions: DataGridAction<TestData>[] = [
      { key: 'edit', label: 'Edit', onClick: onEdit },
      { key: 'delete', label: 'Delete', onClick: onDelete, danger: true },
    ];

    render(<DataGrid columns={mockColumns} data={mockData} actions={actions} />);

    // Actions column should be present
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should handle pagination', () => {
    const onPageChange = vi.fn();
    const pagination = {
      current: 1,
      pageSize: 10,
      total: 30,
      onChange: onPageChange,
    };

    render(<DataGrid columns={mockColumns} data={mockData} pagination={pagination} />);

    // Check pagination info is displayed
    expect(screen.getByText(/1-3 of 30 items/)).toBeInTheDocument();
  });

  it('should render with custom row key', () => {
    render(<DataGrid columns={mockColumns} data={mockData} rowKey="email" />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render with custom row key function', () => {
    const rowKeyFn = (record: TestData) => `user-${record.id}`;
    render(<DataGrid columns={mockColumns} data={mockData} rowKey={rowKeyFn} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    render(<DataGrid columns={mockColumns} data={[]} />);

    // Ant Design shows "No data" message
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });
});
