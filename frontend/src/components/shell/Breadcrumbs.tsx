'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  customItems?: BreadcrumbItem[];
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  admin: 'Admin Console',
  doctor: 'Doctor Portal',
  appointments: 'Appointments',
  consultation: 'Clinical Consultation',
  patient: 'Patient Portal',
  prescriptions: 'Prescriptions',
  'lab-results': 'Lab Results',
  lab: 'Laboratory',
  queue: 'Queue Monitor',
};

export function Breadcrumbs({ customItems }: BreadcrumbsProps) {
  const pathname = usePathname();

  let items: BreadcrumbItem[] = [];

  if (customItems && customItems.length > 0) {
    items = customItems;
  } else {
    const segments = pathname.split('/').filter(Boolean);
    let currentHref = '';

    items = segments.map((seg, idx) => {
      currentHref += `/${seg}`;
      const isLast = idx === segments.length - 1;
      const label = routeLabels[seg] || (isNaN(Number(seg)) ? seg.charAt(0).toUpperCase() + seg.slice(1) : `#${seg}`);

      let targetHref: string | undefined = isLast ? undefined : currentHref;
      if (seg === 'consultation' && !isLast) {
        targetHref = '/dashboard/doctor/appointments';
      }

      return {
        label,
        href: targetHref,
      };
    });
  }

  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 dark:text-slate-400">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition-colors p-1 -ml-1 rounded"
        title="Home"
      >
        <Home size={13} />
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight size={12} className="mx-1 text-slate-400 dark:text-slate-600 shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors font-medium truncate max-w-[150px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
