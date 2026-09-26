'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Key, Users, ArrowRight, Lock } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Admin 2-Step Option State
  const [adminAuthPending, setAdminAuthPending] = useState<{
    token: string;
    user: any;
  } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await api.post('/api/auth/login', { username, password });
      
      const role = res.data.user.role;
      if (role === 'Admin') {
        // Admin must select between Access Token (Super Admin) or Guest Mode
        setAdminAuthPending({
          token: res.data.token,
          user: res.data.user
        });
        return;
      }

      await login(res.data.token, res.data.user);
      if (role === 'Doctor') router.push('/dashboard/doctor');
      else if (role === 'Patient') router.push('/dashboard/patient');
      else if (role === 'Lab') router.push('/dashboard/lab');
      else router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAdminTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAuthPending) return;
    if (totpCode.length !== 6) {
      setTotpError('Code must be exactly 6 digits');
      return;
    }

    setTotpError('');
    setTotpLoading(true);

    try {
      const res = await api.post(
        '/api/auth/verify-admin-token',
        { totpCode },
        { headers: { Authorization: `Bearer ${adminAuthPending.token}` } }
      );
      
      // Successfully authenticated with Google Authenticator
      await login(res.data.token, res.data.user);
      router.push('/dashboard/admin');
    } catch (err: any) {
      setTotpError(err.response?.data?.message || 'Invalid Authenticator Code. Please verify with Google Authenticator.');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    if (!adminAuthPending) return;
    await login(adminAuthPending.token, adminAuthPending.user);
    router.push('/dashboard/admin');
  };

  return (
    <div className="flex-1 flex items-center justify-center gradient-mesh relative overflow-hidden px-4 py-12">
      {/* Animated blobs */}
      <div className="absolute top-10 left-[15%] w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
      <div className="absolute top-20 right-[10%] w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 left-[40%] w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md glass-card p-6 sm:p-8 animate-fade-in-up z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <img
              src="/images/logo.jpg"
              alt="MediCore Logo"
              className="w-12 h-12 rounded-2xl object-cover shadow-md hover:scale-105 transition-transform mx-auto"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
            {adminAuthPending ? 'Admin Security Check' : 'Welcome Back'}
          </h1>
          <p className="text-gray-500 mt-1.5 text-xs sm:text-sm">
            {adminAuthPending 
              ? 'Select your authorization level to proceed'
              : 'Sign in to your MediCore account'}
          </p>
        </div>

        {/* Global Error */}
        {error && !adminAuthPending && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-slide-down">
            {error}
          </div>
        )}

        {/* ================= ADMIN SELECTION VIEW ================= */}
        {adminAuthPending ? (
          <div className="space-y-5 animate-fade-in-up">
            {totpError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-medium text-center animate-shake">
                {totpError}
              </div>
            )}

            {/* Option 1: Insert Access Token (Super Admin) */}
            <form onSubmit={handleVerifyAdminTotp} className="p-4 sm:p-5 rounded-2xl border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 space-y-3 transition-all hover:border-blue-500/60 shadow-sm">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <Key size={14} />
                </div>
                <span>1. Insert Access Token</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Enter the 6-digit code from your <strong>Google Authenticator</strong> app for full administrative write access (valid for 60 mins).
              </p>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  disabled={totpLoading}
                  placeholder="000000"
                  autoFocus
                  className="w-full px-4 py-2.5 text-center font-mono tracking-widest text-xl border border-blue-200 dark:border-blue-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={totpCode.length !== 6 || totpLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 cursor-pointer disabled:cursor-not-allowed"
              >
                {totpLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="border-white/30 border-t-white" />
                    Verifying Token...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Verify & Unlock Super Admin
                  </>
                )}
              </button>
            </form>

            {/* Visual Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-gray-200 dark:border-gray-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold tracking-wider text-gray-400 uppercase absolute">
                OR
              </span>
            </div>

            {/* Option 2: Guest Mode */}
            <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-slate-900/40 space-y-3 transition-all hover:border-gray-300 shadow-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold text-sm">
                <div className="p-1.5 bg-gray-600 text-white rounded-lg">
                  <Users size={14} />
                </div>
                <span>2. I am a Guest</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Explore the complete admin panel, view departments, doctor rosters, and financial audit logs in <strong>Read-Only</strong> mode.
              </p>

              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold text-xs sm:text-sm rounded-xl transition-all border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                Continue as Guest (Read-Only)
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Cancel / Back Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setAdminAuthPending(null);
                  setTotpCode('');
                  setTotpError('');
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ← Back to standard login
              </button>
            </div>
          </div>
        ) : (
          /* ================= STANDARD LOGIN FORM ================= */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white/70 disabled:opacity-50"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white/70 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        )}

        {/* Developer Helper Box (only shown on initial login) */}
        {!adminAuthPending && (
          <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2 text-indigo-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
              <span className="text-sm font-bold">Developer Credentials</span>
            </div>
            <div className="text-xs text-indigo-600 space-y-1.5">
              <div className="flex justify-between border-b border-indigo-100 pb-1">
                <span>Admin:</span> <span className="font-mono bg-indigo-100 px-1 rounded">admin</span>
              </div>
              <div className="flex justify-between border-b border-indigo-100 pb-1">
                <span>Doctor:</span> <span className="font-mono bg-indigo-100 px-1 rounded">Doctor1</span> - <span className="font-mono bg-indigo-100 px-1 rounded">Doctor5</span>
              </div>
              <div className="flex justify-between border-b border-indigo-100 pb-1">
                <span>Patient:</span> <span className="font-mono bg-indigo-100 px-1 rounded">Patient1</span> - <span className="font-mono bg-indigo-100 px-1 rounded">Patient5</span>
              </div>
              <div className="flex justify-between border-b border-indigo-100 pb-1">
                <span>Lab:</span> <span className="font-mono bg-indigo-100 px-1 rounded">lab</span>
              </div>
              <div className="flex justify-between pt-1 font-medium">
                <span>Password (All):</span> <span className="font-mono bg-indigo-100 px-1 rounded">MediCore</span>
              </div>
            </div>
          </div>
        )}

        {/* Divider + Register */}
        {!adminAuthPending && (
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            New patient?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Register here
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
