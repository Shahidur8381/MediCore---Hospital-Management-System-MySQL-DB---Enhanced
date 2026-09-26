import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
        <AlertCircle size={24} />
      </div>
      <h4 className="text-base font-bold text-rose-900 dark:text-rose-200 mb-1">{title}</h4>
      <p className="text-sm text-rose-700 dark:text-rose-400 max-w-sm mb-5">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" icon={<RefreshCw size={14} />} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
