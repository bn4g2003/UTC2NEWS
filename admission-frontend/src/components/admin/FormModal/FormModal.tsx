'use client';

import { Modal, message } from 'antd';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { FormModalProps } from './types';

/**
 * FormModal component - Modal dialog with integrated form
 * 
 * Features:
 * - React Hook Form integration
 * - Zod schema validation
 * - Automatic error handling
 * - Loading states
 * - Success/error notifications
 * 
 * @example
 * ```tsx
 * const userSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 * });
 * 
 * <FormModal
 *   open={isOpen}
 *   title="Create User"
 *   schema={userSchema}
 *   onClose={handleClose}
 *   onSubmit={handleSubmit}
 * >
 *   {(form) => (
 *     <>
 *       <Form.Item label="Name">
 *         <Input {...form.register('name')} />
 *         {form.formState.errors.name && (
 *           <span>{form.formState.errors.name.message}</span>
 *         )}
 *       </Form.Item>
 *     </>
 *   )}
 * </FormModal>
 * ```
 */
export function FormModal<T extends Record<string, any>>({
  open,
  title,
  onClose,
  onSubmit,
  initialValues,
  schema,
  children,
  width = 600,
  loading: externalLoading = false,
  okText = 'Submit',
  cancelText = 'Cancel',
}: FormModalProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: initialValues as any,
    mode: 'onChange', // Validate khi user nhập
    reValidateMode: 'onChange',
    shouldUnregister: false,
    criteriaMode: 'all',
  });

  // Reset form when modal opens/closes or initialValues change
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
    <Modal
      open={open}
      title={title}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText={okText}
      cancelText={cancelText}
      width={width}
      confirmLoading={loading}
      cancelButtonProps={{ disabled: loading }}
      closable={!loading}
      maskClosable={!loading}
      keyboard={!loading}
    >
      <form onSubmit={handleSubmit}>
        {children(form)}
      </form>
    </Modal>
  );
}
