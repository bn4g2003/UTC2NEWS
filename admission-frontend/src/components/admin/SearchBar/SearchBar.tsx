import React, { useState, useEffect, useCallback } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  defaultValue?: string;
  className?: string;
}

export function SearchBar({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  defaultValue = '',
  className,
}: SearchBarProps) {
  const [searchValue, setSearchValue] = useState(defaultValue);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs, onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setSearchValue('');
  }, []);

  return (
    <Input
      placeholder={placeholder}
      prefix={<SearchOutlined />}
      value={searchValue}
      onChange={handleChange}
      allowClear
      onClear={handleClear}
      className={className}
      style={{ width: '100%', maxWidth: 400 }}
    />
  );
}
