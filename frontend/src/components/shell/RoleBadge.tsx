import React from 'react';
import { ShieldCheck, Stethoscope, User, FlaskConical } from 'lucide-react';

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function RoleBadge({ role, size = 'md', className = '' }: RoleBadgeProps) {
  const configs: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
    Admin: {
      label: 'Administrator',
      icon: <ShieldCheck size={size === 'sm' ? 12 : 14} className="text-purple-600 dark:text-purple-400" />,
      classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    },
    Doctor: {
      label: 'Doctor',
      icon: <Stethoscope size={size === 'sm' ? 12 : 14} className="text-blue-600 dark:text-blue-400" />,
      classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    },
    Patient: {
      label: 'Patient',
      icon: <User size={size === 'sm' ? 12 : 14} className="text-emerald-600 dark:text-emerald-400" />,
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    },
    Lab: {
      label: 'Lab Specialist',
      icon: <FlaskConical size={size === 'sm' ? 12 : 14} className="text-amber-600 dark:text-amber-400" />,
      classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    },
  };

  const conf = configs[role] || {
    label: role,
    icon: <User size={size === 'sm' ? 12 : 14} />,
    classes: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-2xs ${sizeClasses} ${conf.classes} ${className}`}
    >
      {conf.icon}
      <span>{conf.label}</span>
    </span>
  );
}
