'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/Toast';

export function ServiceWorkerRegister() {
  const { toast } = useToast();

  useEffect(() => {
    // 1. Register Service Worker if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('MediCore Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('MediCore Service Worker registration error:', error);
          });
      });
    }

    // 2. Online / Offline network status listeners
    const handleOnline = () => {
      toast('Network connection restored. Realtime syncing active.', 'success');
    };

    const handleOffline = () => {
      toast('Network connection lost. Offline shell active.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  return null;
}
