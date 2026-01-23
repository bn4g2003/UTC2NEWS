import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('should render with placeholder', () => {
    const onSearch = vi.fn();
    render(<SearchBar placeholder="Search users" onSearch={onSearch} />);

    expect(screen.getByPlaceholderText('Search users')).toBeInTheDocument();
  });

  it('should call onSearch after debounce delay', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} debounceMs={100} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test query' } });

    // Should not call immediately
    expect(onSearch).not.toHaveBeenCalled();

    // Should call after debounce
    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('test query');
      },
      { timeout: 200 }
    );
  });

  it('should debounce multiple rapid changes', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} debounceMs={100} />);

    const input = screen.getByPlaceholderText('Search...');
    
    fireEvent.change(input, { target: { value: 't' } });
    fireEvent.change(input, { target: { value: 'te' } });
    fireEvent.change(input, { target: { value: 'tes' } });
    fireEvent.change(input, { target: { value: 'test' } });

    // Should only call once with final value
    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('test');
      },
      { timeout: 200 }
    );
  });

  it('should clear search value', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} debounceMs={50} />);

    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(input.value).toBe('test');
    });

    // Clear the input
    fireEvent.change(input, { target: { value: '' } });

    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('');
      },
      { timeout: 100 }
    );
  });
});
