'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FullPageSpinner } from '@/components/LoadingSpinner';
import { DashboardShell } from '@/components/shell';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, EmptyState } from '@/components/ui';
import { PatientLiveQueueWidget } from '@/components/queue/PatientLiveQueueWidget';
import { AppointmentSlotPicker } from '@/components/appointments/AppointmentSlotPicker';
import {
  Calendar, Plus, Hash, CheckCircle2,
  Stethoscope, CreditCard, Clock, User
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function AppointmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setFetching(true);
      const [aptRes, deptRes, docRes] = await Promise.all([
        api.get('/api/appointments'),
        api.get('/api/departments'),
        api.get('/api/doctors')
      ]);
      setAppointments(aptRes.data);
      setDepartments(deptRes.data);
      setDoctors(docRes.data);
    } catch {
      toast('Failed to fetch appointments data', 'error');
    } finally {
      setFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Patient')) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, loading, router, fetchData]);


  const handlePayDirect = async (aptId: number) => {
    try {
      setPayingId(aptId);
      const payRes = await api.post('/api/payment/initiate', {
        itemType: 'Appointment',
        itemId: aptId
      });

      if (payRes.data.gatewayUrl) {
        toast('Redirecting to SSLCommerz Gateway...', 'info');
        window.location.href = payRes.data.gatewayUrl;
      }
    } catch (err: any) {
      toast(err.response?.data?.message || 'Payment initiation failed', 'error');
    } finally {
      setPayingId(null);
    }
  };

  if (loading || !user) return <FullPageSpinner />;


  // Active appointment for live queue widget (most recent uncompleted appointment)
  const activeAppointment = appointments.find(
    a => a.STATUS !== 'Completed' && a.STATUS !== 'Cancelled'
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <Badge variant="primary" size="sm" dot>Confirmed</Badge>;
      case 'Completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'Cancelled':
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      case 'Waiting':
        return <Badge variant="purple" size="sm" dot>Waiting</Badge>;
      default:
        return <Badge variant="warning" size="sm" dot>{status || 'Pending'}</Badge>;
    }
  };

  return (
    <DashboardShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Calendar className="text-blue-600 dark:text-blue-400" />
            <span>Consultation Appointments</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Schedule visits with specialists, pay consultation fees online, and monitor live tokens.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus size={16} />}
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-center"
        >
          Book Appointment
        </Button>
      </div>

      {/* Live Queue Banner for active appointment */}
      {activeAppointment && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
            <span>Active Live Consultation Queue</span>
          </div>
          <PatientLiveQueueWidget
            appointment={activeAppointment}
            onStatusChange={() => fetchData()}
          />
        </div>
      )}

      {/* Appointments List */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock size={16} />
            <span>All Scheduled Consultations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fetching ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Appointments Scheduled"
              description="Click 'Book Appointment' to select a doctor and reserve your consultation token."
              actionLabel="Book First Appointment"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {appointments.map((apt) => (
                <div
                  key={apt.APPOINTMENT_ID}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Date badge */}
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex flex-col items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
                      <span className="text-[10px] font-bold uppercase leading-none">
                        {new Date(apt.APPOINTMENT_DATE).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-xl font-black leading-tight">
                        {new Date(apt.APPOINTMENT_DATE).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          Dr. {apt.DOCTOR_NAME}
                        </h3>
                        {getStatusBadge(apt.STATUS)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {apt.DEPARTMENT_NAME || 'Department Clinic'}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Hash size={12} className="text-blue-500" /> Token Queue #{apt.QUEUE_NUMBER}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center w-full sm:w-auto justify-end">
                    {apt.STATUS === 'Pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<CreditCard size={14} />}
                        loading={payingId === apt.APPOINTMENT_ID}
                        onClick={() => handlePayDirect(apt.APPOINTMENT_ID)}
                      >
                        Pay Online
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Appointment Booking & Availability Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Visual Doctor Availability & Slot Reservation"
        description="Select a doctor, pick an open consultation time slot, and reserve your queue token."
      >
        <AppointmentSlotPicker
          doctors={doctors}
          departments={departments}
          onBookingSuccess={async (aptId, queueNum) => {
            setIsModalOpen(false);
            fetchData();
            // Prompt online payment
            try {
              const payRes = await api.post('/api/payment/initiate', {
                itemType: 'Appointment',
                itemId: aptId
              });
              if (payRes.data.gatewayUrl) {
                toast('Redirecting to SSLCommerz Checkout Gateway...', 'info');
                window.location.href = payRes.data.gatewayUrl;
              }
            } catch (payErr: any) {
              toast('Appointment booked! Online payment can be completed anytime.', 'info');
            }
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </DashboardShell>
  );
}
