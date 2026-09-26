'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FullPageSpinner } from '@/components/LoadingSpinner';
import { DashboardShell } from '@/components/shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import api from '@/lib/api';
import {
  Calendar, FileText, TestTubes, Phone, Mail, MapPin, User,
  Droplets, AlertCircle, Shield, ArrowRight, Tv
} from 'lucide-react';

export default function PatientDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({ appointments: 0, labTests: 0, prescriptions: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Patient')) {
      router.push('/login');
    }
    if (user?.role === 'Patient') {
      api.get('/api/appointments/stats')
        .then(r => setStats(r.data))
        .catch(() => {})
        .finally(() => setStatsLoading(false));
    }
  }, [user, loading, router]);

  if (loading || !user) return <FullPageSpinner />;

  const profile = user.profile;

  const quickActions = [
    {
      label: 'Book Appointment',
      description: 'Schedule a visit or view token queues',
      icon: Calendar,
      color: 'blue',
      stat: stats.appointments,
      statLabel: 'Appointments',
      href: '/dashboard/patient/appointments',
    },
    {
      label: 'My Prescriptions',
      description: 'View digital Rx and download PDF',
      icon: FileText,
      color: 'violet',
      stat: stats.prescriptions,
      statLabel: 'Prescriptions',
      href: '/dashboard/patient/prescriptions',
    },
    {
      label: 'Lab Results',
      description: 'Check reports and clear pending invoices',
      icon: TestTubes,
      color: 'amber',
      stat: stats.labTests,
      statLabel: 'Tests',
      href: '/dashboard/patient/lab-results',
    },
  ];

  return (
    <DashboardShell>
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-8 text-white shadow-lg mb-8">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full filter blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-inner shrink-0">
              <User size={36} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white/90 mb-2">
                <Shield size={12} /> Patient Portal
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {profile?.NAME || user.username}
              </h1>
              <p className="text-white/80 text-xs md:text-sm mt-1">
                Access your consultation queues, digital prescriptions, and lab tests anytime.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {profile?.BLOOD_GROUP && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20">
                <Droplets size={14} className="text-rose-200" /> {profile.BLOOD_GROUP}
              </span>
            )}
            <Link
              href="/queue/display"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white text-teal-800 hover:bg-white/90 transition-colors shadow-sm"
            >
              <Tv size={14} /> Live TV Queue
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {quickActions.map((action) => (
          <Link
            href={action.href}
            key={action.label}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform">
                  <action.icon size={22} />
                </div>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {statsLoading ? '—' : action.stat}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {action.label}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {action.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>View details</span>
              <ArrowRight size={13} />
            </div>
          </Link>
        ))}
      </div>

      {/* Patient Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Personal Health Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Gender', value: profile?.GENDER, icon: User },
              { label: 'Blood Group', value: profile?.BLOOD_GROUP, icon: Droplets },
              { label: 'Phone', value: profile?.PHONE, icon: Phone },
              { label: 'Email', value: profile?.EMAIL, icon: Mail },
              { label: 'Address', value: profile?.ADDRESS, icon: MapPin },
              { label: 'Emergency Contact', value: profile?.EMERGENCY_CONTACT, icon: AlertCircle },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{item.value || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
