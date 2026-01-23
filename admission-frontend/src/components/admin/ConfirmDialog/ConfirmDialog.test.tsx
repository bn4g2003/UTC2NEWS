import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('should render when open is true', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        title="Delete User"
        content="Are you sure you want to delete this user?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Delete User')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this user?')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(
      <ConfirmDialog
        open={false}
        title="Delete User"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    // Modal should not be visible
    expect(container.querySelector('.ant-modal')).not.toBeInTheDocument();
  });

  it('should call onConfirm when OK button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const okButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(okButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Cancel button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should display custom button text', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        okText="Delete"
        cancelText="Keep"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
  });

  it('should show loading state on OK button', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        loading={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const okButton = screen.getByRole('button', { name: /confirm/i });
    expect(okButton).toHaveClass('ant-btn-loading');
  });

  it('should disable cancel button when loading', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        loading={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('should render danger button for delete actions', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        okType="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const okButton = screen.getByRole('button', { name: /confirm/i });
    expect(okButton).toHaveClass('ant-btn-dangerous');
  });
});
