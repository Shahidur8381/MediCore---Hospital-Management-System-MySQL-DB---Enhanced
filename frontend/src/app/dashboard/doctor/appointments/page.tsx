'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FullPageSpinner } from '@/components/LoadingSpinner';
import { DashboardShell } from '@/components/shell';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, EmptyState } from '@/components/ui';
import {
  Calendar, Hash, User, ClipboardList, CheckCircle2,
  XCircle, Clock, Stethoscope, Tv, ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

export default function DoctorAppointmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setFetching(true);
      const res = await api.get('/api/appointments');
      setAppointments(res.data);
    } catch {
      toast('Failed to fetch appointments', 'error');
    } finally {
      setFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Doctor')) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, loading, router, fetchData]);

  const updateStatus = async (id: number, status: string) => {
    try {
      setUpdatingId(id);
      await api.put(`/api/appointments/${id}/status`, { status });
      toast(`Appointment status updated to ${status}`, 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || !user) return <FullPageSpinner />;

  // Group appointments by date
  const grouped = appointments.reduce((acc: any, apt: any) => {
    const dateKey = new Date(apt.APPOINTMENT_DATE).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {});

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <Badge variant="primary" size="sm" dot>Confirmed</Badge>;
      case 'Completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'Cancelled':
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      case 'Waiting':
        return <Badge variant="purple" size="sm" dot>Waiting Room</Badge>;
      default:
        return <Badge variant="warning" size="sm" dot>{status || 'Pending'}</Badge>;
    }
  };

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Calendar className="text-blue-600 dark:text-blue-400" />
            <span>Consultation Schedule & Patient Queue</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Call queue numbers in real time. Updating appointment status broadcasts to the waiting room TV instantly.
          </p>
        </div>

        <Link
          href="/queue/display"
          target="_blank"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-center"
        >
          <Tv size={14} /> Open Waiting Room TV
        </Link>
      </div>

      {fetching ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Scheduled Appointments"
          description="Patients booking consultation slots will appear here with calculated queue numbers."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dateKey, apts]: [string, any]) => (
            <div key={dateKey} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                <Clock size={13} className="text-blue-500" />
                <span>{dateKey}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                  {apts.length} appointments
                </span>
              </div>

              <Card className="overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {apts.map((apt: any) => {
                    const isCompleted = apt.STATUS === 'Completed';
                    const isCancelled = apt.STATUS === 'Cancelled';
                    const isConfirmed = apt.STATUS === 'Confirmed';

                    return (
                      <div
                        key={apt.APPOINTMENT_ID}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Patient & Queue info */}
                        <div className="flex items-start sm:items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex flex-col items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
                            <span className="text-[10px] uppercase font-bold leading-none">Token</span>
                            <span className="text-lg font-black leading-tight">#{apt.QUEUE_NUMBER}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                                {apt.PATIENT_NAME}
                              </h3>
                              {getStatusBadge(apt.STATUS)}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <User size={12} /> Patient ID #{apt.PATIENT_ID}
                              </span>
                              <span>•</span>
                              <span>Appointment #{apt.APPOINTMENT_ID}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Controls */}
                        <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                          {!isCompleted && !isCancelled && (
                            <>
                              {apt.STATUS !== 'Confirmed' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  loading={updatingId === apt.APPOINTMENT_ID}
                                  onClick={() => updateStatus(apt.APPOINTMENT_ID, 'Confirmed')}
                                >
                                  Call / Confirm
                                </Button>
                              )}

                              <Link href={`/dashboard/doctor/consultation/${apt.APPOINTMENT_ID}`}>
                                <Button
                                  variant={isConfirmed ? 'success' : 'secondary'}
                                  size="sm"
                                  icon={<Stethoscope size={14} />}
                                >
                                  Consultation
                                </Button>
                              </Link>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                loading={updatingId === apt.APPOINTMENT_ID}
                                onClick={() => updateStatus(apt.APPOINTMENT_ID, 'Cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}

                          {isCompleted && (
                            <Link href={`/dashboard/doctor/consultation/${apt.APPOINTMENT_ID}`}>
                              <Button variant="ghost" size="sm" icon={<ClipboardList size={14} />}>
                                View Prescription
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
