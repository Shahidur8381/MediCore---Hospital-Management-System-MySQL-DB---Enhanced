'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

interface DashboardShellProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function DashboardShell({ children, fullWidth = false }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <TopNavbar onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 w-full ${
            fullWidth ? 'max-w-full' : 'max-w-7xl mx-auto'
          } animate-fade-in`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
