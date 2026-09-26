'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FullPageSpinner } from '@/components/LoadingSpinner';

export default function DashboardRootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        switch (user.role) {
          case 'Admin':
            router.replace('/dashboard/admin');
            break;
          case 'Doctor':
            router.replace('/dashboard/doctor');
            break;
          case 'Patient':
            router.replace('/dashboard/patient');
            break;
          case 'Lab':
            router.replace('/dashboard/lab');
            break;
          default:
            router.replace('/login');
        }
      }
    }
  }, [user, loading, router]);

  return <FullPageSpinner />;
}
