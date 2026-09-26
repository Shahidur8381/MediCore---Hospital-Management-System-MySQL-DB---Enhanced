'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  TestTubes,
  Tv,
  ChevronLeft,
  ChevronRight,
  Heart,
  X,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    switch (user.role) {
      case 'Admin':
        return [
          { label: 'Overview', href: '/dashboard/admin', icon: <LayoutDashboard size={18} /> },
          { label: 'Queue Display TV', href: '/queue/display', icon: <Tv size={18} />, badge: 'Live' },
        ];
      case 'Doctor':
        return [
          { label: 'Overview', href: '/dashboard/doctor', icon: <LayoutDashboard size={18} /> },
          { label: 'Appointments & Queue', href: '/dashboard/doctor/appointments', icon: <Calendar size={18} /> },
          { label: 'Queue Display TV', href: '/queue/display', icon: <Tv size={18} />, badge: 'Live' },
        ];
      case 'Patient':
        return [
          { label: 'Overview', href: '/dashboard/patient', icon: <LayoutDashboard size={18} /> },
          { label: 'My Appointments', href: '/dashboard/patient/appointments', icon: <Calendar size={18} /> },
          { label: 'Prescriptions', href: '/dashboard/patient/prescriptions', icon: <FileText size={18} /> },
          { label: 'Lab Results', href: '/dashboard/patient/lab-results', icon: <TestTubes size={18} /> },
          { label: 'Waiting Room TV', href: '/queue/display', icon: <Tv size={18} />, badge: 'Live' },
        ];
      case 'Lab':
        return [
          { label: 'Overview', href: '/dashboard/lab', icon: <LayoutDashboard size={18} /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
          <img
            src="/images/logo.jpg"
            alt="MediCore Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-sm shrink-0 group-hover:scale-105 transition-transform"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1">
                Medi<span className="text-blue-600">Core</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Healthcare OS</span>
            </div>
          )}
        </Link>
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span
                className={`shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Collapse Toggle Footer (Desktop only) */}
      <div className="hidden md:flex p-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="ml-2 text-xs font-medium">Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-overlay-in"
          onClick={onCloseMobile}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl z-50 animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
