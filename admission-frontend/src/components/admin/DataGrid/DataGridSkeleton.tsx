import React from 'react';
import { Table, Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export interface DataGridSkeletonProps {
  columns: number;
  rows?: number;
}

export function DataGridSkeleton({ columns, rows = 5 }: DataGridSkeletonProps) {
  // Generate skeleton columns
  const skeletonColumns: ColumnsType<any> = Array.from({ length: columns }, (_, index) => ({
    key: `skeleton-col-${index}`,
    title: <Skeleton.Input active size="small" style={{ width: 100 }} />,
    dataIndex: `col${index}`,
    render: () => <Skeleton.Input active size="small" style={{ width: '100%' }} />,
  }));

  // Generate skeleton data
  const skeletonData = Array.from({ length: rows }, (_, index) => ({
    key: `skeleton-row-${index}`,
  }));

  return (
    <Table
      columns={skeletonColumns}
      dataSource={skeletonData}
      pagination={false}
      showHeader={true}
    />
  );
}
