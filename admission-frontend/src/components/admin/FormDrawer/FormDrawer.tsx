'use client';

import { Drawer, Button, Space, message } from 'antd';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { FormDrawerProps } from './types';

/**
 * FormDrawer component - Drawer panel with integrated form
 * 
 * Features:
 * - React Hook Form integration
 * - Zod schema validation
 * - Automatic error handling
 * - Loading states
 * - Success/error notifications
 * - Larger form area compared to modal
 * 
 * @example
 * ```tsx
 * const studentSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   scores: z.object({
 *     math: z.number().min(0).max(10),
 *   }),
 * });
 * 
 * <FormDrawer
 *   open={isOpen}
 *   title="Create Student"
 *   schema={studentSchema}
 *   onClose={handleClose}
 *   onSubmit={handleSubmit}
 *   placement="right"
 * >
 *   {(form) => (
 *     <>
 *       <Form.Item label="Name">
 *         <Input {...form.register('name')} />
 *       </Form.Item>
 *     </>
 *   )}
 * </FormDrawer>
 * ```
 */
export function FormDrawer<T extends Record<string, any>>({
  open,
  title,
  onClose,
  onSubmit,
  initialValues,
  schema,
  children,
  width = 720,
  loading: externalLoading = false,
  placement = 'right',
  okText = 'Submit',
  cancelText = 'Cancel',
}: FormDrawerProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: initialValues as any,
    mode: 'onChange', // Validate khi user nhập
    reValidateMode: 'onChange',
    shouldUnregister: false,
    criteriaMode: 'all',
  });

  // Reset form when drawer opens/closes or initialValues change
  useEffect(() => {
    if (open) {
      form.reset(initialValues as any);
    }
  }, [open, initialValues]); // Removed 'form' from dependencies

  const handleSubmit = form.handleSubmit(
    async (data) => {
      try {
        setIsSubmitting(true);
        await onSubmit(data);
        message.success('Operation completed successfully');
        form.reset();
        onClose();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        message.error(errorMessage);
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    (validationErrors) => {
      // Validation failed - show first error message
      const firstError = Object.values(validationErrors)[0];
      if (firstError?.message) {
        message.error(firstError.message as string);
      } else {
        message.error('Please check the form for errors');
      }
    }
  );

  const handleCancel = () => {
    if (!isSubmitting && !externalLoading) {
      form.reset();
      onClose();
    }
  };

  const loading = isSubmitting || externalLoading;

  return (
    <Drawer
      open={open}
      title={title}
      onClose={handleCancel}
      size="large"
      placement={placement}
      closable={!loading}
      maskClosable={!loading}
      keyboard={!loading}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel} disabled={loading}>
              {cancelText}
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
            >
              {okText}
            </Button>
          </Space>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        {children(form)}
      </form>
    </Drawer>
  );
}
