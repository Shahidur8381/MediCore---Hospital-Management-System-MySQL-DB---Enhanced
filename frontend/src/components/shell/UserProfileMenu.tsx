'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RoleBadge } from './RoleBadge';
import { LogOut, ChevronDown, Mail, Phone, Building } from 'lucide-react';

export function UserProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const profile = user.profile;
  const displayName = profile?.NAME || user.username;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleColors: Record<string, string> = {
    Admin: 'bg-purple-600 text-white',
    Doctor: 'bg-blue-600 text-white',
    Patient: 'bg-emerald-600 text-white',
    Lab: 'bg-amber-600 text-white',
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${
            roleColors[user.role] || 'bg-slate-700 text-white'
          }`}
        >
          {initials}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
            {displayName}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user.role}</span>
        </div>
        <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 hidden md:block" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 animate-modal-in">
          {/* Header */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{displayName}</span>
              <RoleBadge role={user.role} size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
          </div>

          {/* Details */}
          <div className="px-3 py-2 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {profile?.EMAIL && (
              <div className="flex items-center gap-2 truncate">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{profile.EMAIL}</span>
              </div>
            )}
            {profile?.PHONE && (
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span>{profile.PHONE}</span>
              </div>
            )}
            {profile?.DEPARTMENT_NAME && (
              <div className="flex items-center gap-2">
                <Building size={13} className="text-slate-400 shrink-0" />
                <span>{profile.DEPARTMENT_NAME}</span>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
