import React from 'react';
import type { ToastItem } from './types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface NotificationToastsProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const NotificationToasts: React.FC<NotificationToastsProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const icon =
          toast.type === 'error' ? (
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-6 h-6 text-blue-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
          );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white dark:bg-gray-800/95 backdrop-blur-md border-2 border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl p-4 flex items-start space-x-3 transition-all transform translate-y-0 animate-bounce-short"
          >
            {icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{toast.title}</h4>
                <span className="text-xs text-gray-400 ml-2 shrink-0">{toast.timestamp}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
