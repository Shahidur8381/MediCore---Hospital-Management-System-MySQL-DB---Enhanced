'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FullPageSpinner } from '@/components/LoadingSpinner';
import { DashboardShell } from '@/components/shell';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import {
  Stethoscope, Calendar, FileText, ClipboardList,
  Phone, Mail, Award, Clock, Wallet, Banknote, ArrowRight
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ todayAppointments: 0, totalPrescriptions: 0, totalLabOrders: 0 });
  const [financeStats, setFinanceStats] = useState({ available: 0, pending: 0, cleared: 0, total: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setStatsLoading(true);
      setProfile(user.profile);
      const [dashStatsRes, financeRes] = await Promise.all([
        api.get('/api/appointments/stats'),
        api.get('/api/finance/doctor-stats').catch(() => ({ data: { available: 0, pending: 0, cleared: 0, total: 0 } }))
      ]);
      setStats(dashStatsRes.data);
      setFinanceStats(financeRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Doctor')) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, loading, router, fetchData]);

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      await api.post('/api/finance/withdraw');
      toast('Withdrawal requested successfully', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to request withdrawal', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading || !user) return <FullPageSpinner />;

  const quickStats = [
    { label: "Today's Appointments", value: stats.todayAppointments, icon: Calendar, color: 'blue', href: '/dashboard/doctor/appointments' },
    { label: 'Prescriptions Written', value: stats.totalPrescriptions, icon: FileText, color: 'violet', href: '/dashboard/doctor/appointments' },
    { label: 'Lab Tests Ordered', value: stats.totalLabOrders, icon: ClipboardList, color: 'amber', href: '/dashboard/doctor/appointments' },
  ];

  return (
    <DashboardShell>
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 p-6 md:p-8 text-white shadow-lg mb-8">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full filter blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-inner shrink-0">
              <Stethoscope size={36} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white/90 mb-2">
                <Award size={12} /> {profile?.SPECIALIZATION || 'Specialist Physician'}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Dr. {profile?.NAME || user.username}
              </h1>
              <p className="text-white/80 text-xs md:text-sm mt-1">
                Department of {profile?.DEPARTMENT_NAME || 'General Medicine'} • {profile?.QUALIFICATION || 'MBBS'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/doctor/appointments"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 font-semibold text-sm hover:bg-white/90 transition-colors shadow-sm"
            >
              <Calendar size={16} /> Patient Queue
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {quickStats.map((stat) => (
          <Link
            href={stat.href}
            key={stat.label}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform">
                  <stat.icon size={22} />
                </div>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {statsLoading ? '—' : stat.value}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{stat.label}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>View appointments</span>
              <ArrowRight size={13} />
            </div>
          </Link>
        ))}
      </div>

      {/* Profile Details Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Physician Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Specialization', value: profile?.SPECIALIZATION, icon: Stethoscope },
              { label: 'Qualification', value: profile?.QUALIFICATION, icon: Award },
              { label: 'Phone', value: profile?.PHONE, icon: Phone },
              { label: 'Email', value: profile?.EMAIL, icon: Mail },
              { label: 'Consultation Fee', value: profile?.CONSULTATION_FEE ? `৳${profile.CONSULTATION_FEE}` : null, icon: FileText },
              { label: 'Status', value: profile?.STATUS, icon: Clock },
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

      {/* Earnings & Withdrawals Card */}
      <Card>
        <CardHeader
          action={
            <Button
              variant="success"
              size="sm"
              icon={<Banknote size={15} />}
              loading={withdrawing}
              disabled={withdrawing || financeStats.available === 0}
              onClick={handleWithdraw}
            >
              Request Withdrawal
            </Button>
          }
        >
          <CardTitle className="flex items-center gap-2">
            <Wallet size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span>Earnings & Withdrawals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Earned</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">৳{financeStats.total}</p>
            </div>
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Available to Withdraw</p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">৳{financeStats.available}</p>
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/40">
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Pending Clearance</p>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">৳{financeStats.pending}</p>
            </div>
            <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/40">
              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Total Cleared (Paid)</p>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">৳{financeStats.cleared}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
