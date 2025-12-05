'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Portal } from './portal';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TOAST_STYLES = {
  success: {
    container: 'border-[#e6e0d3] bg-gradient-to-r from-[#f7f2e7] to-[#f0ead9]',
    icon: 'text-[#b8a176]',
    title: 'text-[#2c261d]',
    description: 'text-[#5a5245]',
  },
  error: {
    container: 'border-red-200 bg-gradient-to-r from-red-50 to-red-100',
    icon: 'text-red-600',
    title: 'text-red-900',
    description: 'text-red-700',
  },
  info: {
    container: 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    description: 'text-blue-700',
  },
  warning: {
    container: 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    description: 'text-yellow-700',
  },
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  description,
  duration = 3000,
  onClose,
}) => {
  const [isExiting, setIsExiting] = React.useState(false);
  const Icon = TOAST_ICONS[type];
  const styles = TOAST_STYLES[type];

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border-2 p-4 shadow-xl backdrop-blur-lg transition-all duration-300',
        styles.container,
        isExiting
          ? 'translate-x-[120%] opacity-0'
          : 'translate-x-0 opacity-100'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 pt-0.5">
        <Icon className={cn('h-5 w-5', styles.icon)} />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        <p className={cn('font-inter text-sm font-semibold', styles.title)}>
          {title}
        </p>
        {description && (
          <p className={cn('font-inter text-xs', styles.description)}>
            {description}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-black/5"
        aria-label="Fechar"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <Portal>
      <div className="pointer-events-none fixed right-0 top-0 z-[200] flex max-h-screen w-full flex-col items-end gap-3 p-6">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </div>
    </Portal>
  );
};

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [
      ...prev,
      {
        ...toast,
        id,
        onClose: (toastId) => {
          setToasts((current) => current.filter((t) => t.id !== toastId));
        },
      },
    ]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
  };
}
