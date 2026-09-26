'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageSpinner } from '@/components/LoadingSpinner';

export default function DoctorConsultationIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/doctor/appointments');
  }, [router]);

  return <FullPageSpinner />;
}
