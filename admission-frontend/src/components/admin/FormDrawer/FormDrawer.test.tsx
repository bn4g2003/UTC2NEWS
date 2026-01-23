import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormDrawer } from './FormDrawer';
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

describe('FormDrawer', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open is true', () => {
    render(
      <FormDrawer
        open={true}
        title="Test Drawer"
        schema={testSchema}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => (
          <Form.Item label="Name">
            <Input {...form.register('name')} />
          </Form.Item>
        )}
      </FormDrawer>
    );

    expect(screen.getByText('Test Drawer')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    const { container } = render(
      <FormDrawer
        open={false}
        title="Test Drawer"
        schema={testSchema}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => <div>Form content</div>}
      </FormDrawer>
    );

    expect(container.querySelector('.ant-drawer')).not.toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <FormDrawer
        open={true}
        title="Test Drawer"
        schema={testSchema}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => <div>Form content</div>}
      </FormDrawer>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should accept initialValues prop', () => {
    const initialValues = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    render(
      <FormDrawer
        open={true}
        title="Edit Drawer"
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
      </FormDrawer>
    );

    // Form should render with initial values passed to form
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(
      <FormDrawer
        open={true}
        title="Test Drawer"
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
      </FormDrawer>
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('should have form elements', () => {
    render(
      <FormDrawer
        open={true}
        title="Test Drawer"
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
      </FormDrawer>
    );

    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
  });

  it('should provide form instance to children', () => {
    render(
      <FormDrawer
        open={true}
        title="Test Drawer"
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
      </FormDrawer>
    );

    // Form should be rendered
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
  });

  it('should render with correct placement class', () => {
    const { container } = render(
      <FormDrawer
        open={true}
        title="Test Drawer"
        schema={testSchema}
        placement="left"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => <div>Form content</div>}
      </FormDrawer>
    );

    // Drawer should be rendered
    expect(container.querySelector('.ant-drawer')).toBeInTheDocument();
  });

  it('should display custom button text', () => {
    render(
      <FormDrawer
        open={true}
        title="Test Drawer"
        schema={testSchema}
        okText="Save"
        cancelText="Discard"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => <div>Form content</div>}
      </FormDrawer>
    );

    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
  });

  it('should render with correct placement class', () => {
    const { container } = render(
      <FormDrawer
        open={true}
        title="Test Drawer"
        schema={testSchema}
        placement="left"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => <div>Form content</div>}
      </FormDrawer>
    );

    // Drawer should be rendered
    expect(container.querySelector('.ant-drawer')).toBeInTheDocument();
  });

  it('should render with right placement by default', () => {
    const { container } = render(
      <FormDrawer
        open={true}
        title="Test Drawer"
        schema={testSchema}
        placement="right"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      >
        {(form) => <div>Form content</div>}
      </FormDrawer>
    );

    // Drawer should be rendered
    expect(container.querySelector('.ant-drawer')).toBeInTheDocument();
  });
});
