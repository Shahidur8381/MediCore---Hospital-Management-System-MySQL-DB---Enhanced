'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FullPageSpinner } from '@/components/LoadingSpinner';
import { DashboardShell } from '@/components/shell';
import { PrescriptionCard, PrescriptionData } from '@/components/prescription/PrescriptionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Pill } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function PrescriptionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setFetching(true);
      const res = await api.get('/api/prescriptions/patient/all');
      setPrescriptions(res.data);
    } catch {
      toast('Failed to fetch patient prescriptions', 'error');
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

  if (loading || !user) return <FullPageSpinner />;

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FileText className="text-blue-600 dark:text-blue-400" />
            <span>Digital Prescriptions</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Access verified digital prescriptions issued by your attending physicians with official PDF download.
          </p>
        </div>
      </div>

      {/* Main List */}
      {fetching ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No Prescriptions on Record"
          description="Once your doctor completes a consultation session, your digital prescription and printable PDF will appear here."
        />
      ) : (
        <div className="space-y-6">
          {prescriptions.map((px) => (
            <PrescriptionCard key={px.PRESCRIPTION_ID} prescription={px} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
