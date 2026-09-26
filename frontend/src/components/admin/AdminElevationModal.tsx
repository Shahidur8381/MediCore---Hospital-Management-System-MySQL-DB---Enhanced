'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button, Modal } from '@/components/ui';
import { ShieldAlert, Key } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface AdminElevationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminElevationModal({ isOpen, onClose }: AdminElevationModalProps) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [totpCode, setTotpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleElevate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) {
      setError('Code must be exactly 6 digits');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/api/auth/verify-admin-token', { totpCode });
      
      // Update session with new token and user details
      await login(res.data.token, res.data.user);
      
      toast('Super Admin Access Granted', 'success');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid Authenticator Code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Administrator Authentication">
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
          Restricted Action
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm">
          You are currently in <strong>Read-Only Guest Mode</strong>. To modify data, please enter the 6-digit code from your Google Authenticator app.
        </p>

        {error && (
          <div className="w-full mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleElevate} className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
              Authenticator Code
            </label>
            <div className="relative max-w-[240px] mx-auto">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="000000"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <Button 
              type="submit" 
              variant="primary" 
              className="w-full py-3"
              loading={isLoading}
              disabled={totpCode.length !== 6 || isLoading}
            >
              Verify & Unlock Access
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="w-full text-slate-500"
            >
              I am a Guest (Continue in Read-Only)
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
