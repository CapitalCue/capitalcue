import React from 'react';
import { cn } from '../utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  closable?: boolean;
  onClose?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, closable, onClose, children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-50 border-gray-200 text-gray-800',
      success: 'bg-success-50 border-success-200 text-success-800',
      warning: 'bg-warning-50 border-warning-200 text-warning-800',
      danger: 'bg-danger-50 border-danger-200 text-danger-800',
      info: 'bg-primary-50 border-primary-200 text-primary-800',
    };

    return (
      <div
        className={cn(
          'relative rounded-lg border p-4',
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        {closable && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {title && (
          <h4 className="mb-2 font-medium">{title}</h4>
        )}
        <div>{children}</div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';