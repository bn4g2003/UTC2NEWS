/**
 * Rich Text Editor Component
 * A simple rich text editor wrapper using textarea
 * Can be enhanced with a proper WYSIWYG editor when React 19 compatible libraries are available
 */

'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { Input } from 'antd';

const { TextArea } = Input;

interface RichTextEditorProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  status?: '' | 'error' | 'warning';
  minRows?: number;
  maxRows?: number;
}

/**
 * RichTextEditor component
 * Currently uses a textarea, but can be replaced with a full WYSIWYG editor
 * Supports HTML/Markdown content
 */
export const RichTextEditor = forwardRef<HTMLTextAreaElement, RichTextEditorProps>(
  ({ value, onChange, placeholder, disabled, status, minRows = 10, maxRows = 30, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div className="rich-text-editor">
        <TextArea
          ref={ref}
          value={value}
          onChange={handleChange}
          placeholder={placeholder || 'Enter content here... (HTML/Markdown supported)'}
          disabled={disabled}
          status={status}
          autoSize={{ minRows, maxRows }}
          style={{
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
          {...props}
        />
        <div style={{ 
          marginTop: '8px', 
          fontSize: '12px', 
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Supports HTML and Markdown formatting</span>
          {value && (
            <span>{value.length} characters</span>
          )}
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
