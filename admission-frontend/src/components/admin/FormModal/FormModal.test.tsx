import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormModal } from './FormModal';
import { z } from 'zod';
import { Form, Input } from 'antd';

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

type TestFormData = z.infer<typeof testSchema>;

describe('FormModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open is true', () => {
    render(
      <FormModal
        open={true}
        title="Test Form"
        schema={testSchema}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => (
          <Form.Item label="Name">
            <Input {...form.register('name')} />
          </Form.Item>
        )}
      </FormModal>
    );

    expect(screen.getByText('Test Form')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    const { container } = render(
      <FormModal
        open={false}
        title="Test Form"
        schema={testSchema}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => <div>Form content</div>}
      </FormModal>
    );

    expect(container.querySelector('.ant-modal')).not.toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <FormModal
        open={true}
        title="Test Form"
        schema={testSchema}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => <div>Form content</div>}
      </FormModal>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should accept initialValues prop', () => {
    const initialValues = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(
      <FormModal
        open={true}
        title="Edit Form"
        schema={testSchema}
        initialValues={initialValues}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => (
          <>
            <Form.Item label="Name">
              <Input {...form.register('name')} data-testid="name-input" />
            </Form.Item>
            <Form.Item label="Email">
              <Input {...form.register('email')} data-testid="email-input" />
            </Form.Item>
          </>
        )}
      </FormModal>
    );

    // Form should render with initial values passed to form
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(
      <FormModal
        open={true}
        title="Test Form"
        schema={testSchema}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => (
          <>
            <Form.Item label="Name">
              <Input {...form.register('name')} data-testid="name-input" />
            </Form.Item>
            <Form.Item label="Email">
              <Input {...form.register('email')} data-testid="email-input" />
            </Form.Item>
          </>
        )}
      </FormModal>
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('should have form elements', () => {
    render(
      <FormModal
        open={true}
        title="Test Form"
        schema={testSchema}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => (
          <>
            <Form.Item label="Name">
              <Input {...form.register('name')} data-testid="name-input" />
            </Form.Item>
            <Form.Item label="Email">
              <Input {...form.register('email')} data-testid="email-input" />
            </Form.Item>
          </>
        )}
      </FormModal>
    );

    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
  });

  it('should provide form instance to children', () => {
    render(
      <FormModal
        open={true}
        title="Test Form"
        schema={testSchema}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => (
          <>
            <Form.Item label="Name">
              <Input {...form.register('name')} data-testid="name-input" />
            </Form.Item>
            <Form.Item label="Email">
              <Input {...form.register('email')} data-testid="email-input" />
            </Form.Item>
          </>
        )}
      </FormModal>
    );

    // Form should be rendered
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
  });

  it('should render with correct placement class', () => {
    const { container } = render(
      <FormModal
        open={true}
        title="Test Form"
        schema={testSchema}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => <div>Form content</div>}
      </FormModal>
    );

    // Modal should be rendered
    expect(container.querySelector('.ant-modal')).toBeInTheDocument();
  });

  it('should display custom button text', () => {
    render(
      <FormModal
        open={true}
        title="Test Form"
        schema={testSchema}
        okText="Save"
        cancelText="Discard"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => <div>Form content</div>}
      </FormModal>
    );

    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
  });
});
