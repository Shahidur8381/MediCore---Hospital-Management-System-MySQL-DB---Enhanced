'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationBell } from './NotificationBell';
import { UserProfileMenu } from './UserProfileMenu';
import { RoleBadge } from './RoleBadge';
import { useAuth } from '@/context/AuthContext';

interface TopNavbarProps {
  onOpenMobileSidebar: () => void;
}

export function TopNavbar({ onOpenMobileSidebar }: TopNavbarProps) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial dark mode state
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setTimeout(() => setIsDark(true), 0);
    } else {
      document.documentElement.classList.remove('dark');
      setTimeout(() => setIsDark(false), 0);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex items-center justify-between gap-4 transition-colors">
      {/* Left section: Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <Breadcrumbs />
      </div>

      {/* Right section: Role, Notifications, Theme, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {user?.role && (
          <div className="hidden sm:block">
            <RoleBadge role={user.role} size="sm" />
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User profile */}
        <UserProfileMenu />
      </div>
    </header>
  );
}
