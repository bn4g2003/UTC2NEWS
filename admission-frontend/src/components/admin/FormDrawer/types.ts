import { ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ZodSchema } from 'zod';

export interface FormDrawerProps<T extends Record<string, any>> {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
  initialValues?: Partial<T>;
  schema: ZodSchema<T>;
  children: (form: UseFormReturn<T>) => ReactNode;
  width?: number | string;
  loading?: boolean;
  placement?: 'left' | 'right';
  okText?: string;
  cancelText?: string;
}
