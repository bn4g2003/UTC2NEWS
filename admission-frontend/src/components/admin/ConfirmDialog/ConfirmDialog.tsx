'use client';

import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  content?: ReactNode;
  okText?: string;
  cancelText?: string;
  okType?: 'primary' | 'danger' | 'default';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * ConfirmDialog component for delete actions and other confirmations
 * Uses Ant Design Modal.confirm pattern
 */
export function ConfirmDialog({
  open,
  title = 'Confirm Action',
  content = 'Are you sure you want to proceed?',
  okText = 'Confirm',
  cancelText = 'Cancel',
  okType = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <span>{title}</span>
        </div>
      }
      onOk={onConfirm}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ 
        danger: okType === 'danger',
        loading,
      }}
      cancelButtonProps={{ disabled: loading }}
      closable={!loading}
      maskClosable={!loading}
    >
      {content}
    </Modal>
  );
}

/**
 * Utility function to show confirm dialog imperatively
 * Useful for quick confirmations without managing state
 */
export function showConfirm({
  title = 'Confirm Action',
  content = 'Are you sure you want to proceed?',
  okText = 'Confirm',
  cancelText = 'Cancel',
  okType = 'danger',
  onConfirm,
  onCancel,
}: Omit<ConfirmDialogProps, 'open' | 'loading'>) {
  Modal.confirm({
    title: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ExclamationCircleOutlined style={{ color: '#faad14' }} />
        <span>{title}</span>
      </div>
    ),
    content,
    okText,
    cancelText,
    okButtonProps: { danger: okType === 'danger' },
    onOk: onConfirm,
    onCancel,
  });
}
