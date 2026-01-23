import React, { useState, useMemo } from 'react';
import { Table, Button, Space, Dropdown, Alert } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { DataGridProps, Column, DataGridAction } from './types';
import { DataGridSkeleton } from './DataGridSkeleton';

export function DataGrid<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  error = null,
  pagination,
  sortable = true,
  onSort,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  actions = [],
  rowKey = 'id',
}: DataGridProps<T>) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Convert custom columns to Ant Design columns
  const antColumns: ColumnsType<T> = useMemo(() => {
    const cols: ColumnsType<T> = columns.map(col => ({
      key: col.key,
      title: col.title,
      dataIndex: col.dataIndex as string,
      width: col.width,
      sorter: sortable && col.sortable ? true : undefined,
      render: col.render,
    }));

    // Add actions column if actions are provided
    if (actions.length > 0) {
      cols.push({
        key: 'actions',
        title: 'Actions',
        width: 120,
        fixed: 'right',
        render: (_, record) => {
          const menuItems = actions.map(action => ({
            key: action.key,
            label: action.label,
            icon: action.icon,
            danger: action.danger,
            onClick: () => action.onClick(record),
          }));

          return (
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      });
    }

    return cols;
  }, [columns, actions, sortable]);

  // Handle table change (pagination, sorting, filtering)
  const handleTableChange: TableProps<T>['onChange'] = (paginationConfig, filters, sorter) => {
    // Handle sorting
    if (!Array.isArray(sorter) && sorter.field && sorter.order) {
      const field = String(sorter.field);
      const order = sorter.order === 'ascend' ? 'asc' : 'desc';
      setSortField(field);
      setSortOrder(order);
      onSort?.(field, order);
    }

    // Handle pagination
    if (pagination && paginationConfig.current && paginationConfig.pageSize) {
      pagination.onChange(paginationConfig.current, paginationConfig.pageSize);
    }
  };

  // Handle row selection
  const rowSelection = selectable
    ? {
        selectedRowKeys: selectedRows.map(row => {
          if (typeof rowKey === 'function') {
            return rowKey(row);
          }
          return String(row[rowKey]);
        }),
        onChange: (_: React.Key[], selectedRowsData: T[]) => {
          onSelectionChange?.(selectedRowsData);
        },
      }
    : undefined;

  // Get row key
  const getRowKey = (record: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return String(record[rowKey]);
  };

  // Show error if present
  if (error) {
    return (
      <Alert title="Error loading data"
        description={error.message}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  // Show skeleton while loading
  if (loading && data.length === 0) {
    return <DataGridSkeleton columns={columns.length + (actions.length > 0 ? 1 : 0)} rows={5} />;
  }

  return (
    <Table<T>
      columns={antColumns}
      dataSource={data}
      loading={loading}
      rowKey={getRowKey}
      rowSelection={rowSelection}
      pagination={
        pagination
          ? {
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }
          : false
      }
      onChange={handleTableChange}
      scroll={{ x: 'max-content' }}
    />
  );
}

