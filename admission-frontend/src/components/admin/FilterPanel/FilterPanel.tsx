import React, { useState } from 'react';
import { Button, Space, Drawer } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

export interface FilterConfig {
  key: string;
  label: string;
  component: React.ReactNode;
}

export interface FilterPanelProps {
  filters: FilterConfig[];
  onApply: (values: Record<string, any>) => void;
  onReset: () => void;
  placement?: 'left' | 'right';
  title?: string;
}

export function FilterPanel({
  filters,
  onApply,
  onReset,
  placement = 'right',
  title = 'Filters',
}: FilterPanelProps) {
  const [visible, setVisible] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const showDrawer = () => {
    setVisible(true);
  };

  const closeDrawer = () => {
    setVisible(false);
  };

  const handleApply = () => {
    onApply(filterValues);
    closeDrawer();
  };

  const handleReset = () => {
    setFilterValues({});
    onReset();
    closeDrawer();
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <>
      <Button icon={<FilterOutlined />} onClick={showDrawer}>
        Filters
      </Button>
      <Drawer
        title={title}
        placement={placement}
        onClose={closeDrawer}
        open={visible}
        width={400}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={handleReset}>Reset</Button>
            <Button type="primary" onClick={handleApply}>
              Apply
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {filters.map(filter => (
            <div key={filter.key}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                {filter.label}
              </label>
              {React.isValidElement(filter.component) &&
                React.cloneElement(filter.component as React.ReactElement<any>, {
                  value: filterValues[filter.key],
                  onChange: (value: any) => handleFilterChange(filter.key, value),
                })}
            </div>
          ))}
        </Space>
      </Drawer>
    </>
  );
}
