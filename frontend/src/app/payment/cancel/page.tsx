'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft, Heart } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const tranId = searchParams.get('tran_id') || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Brand header */}
      <div className="flex items-center gap-2.5 mb-6">
        <img
          src="/images/logo.jpg"
          alt="MediCore Logo"
          className="w-10 h-10 rounded-2xl object-cover shadow-sm"
        />
        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Medi<span className="text-blue-600">Core</span>
        </span>
      </div>

      <div className="w-full max-w-md">
        <Card className="overflow-hidden border-amber-200 dark:border-amber-900/60 shadow-xl bg-white dark:bg-slate-900">
          {/* Top Banner */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-center text-white">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
              <AlertCircle size={44} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Payment Cancelled</h1>
            <p className="text-amber-100 text-xs sm:text-sm mt-1">
              You cancelled the payment transaction before it was completed.
            </p>
          </div>

          {/* Details Body */}
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 p-4 border border-amber-100 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                No money was deducted. Your appointment and lab invoices remain pending and you can complete payment whenever you are ready.
              </p>
              {tranId && (
                <p className="font-mono text-[11px] text-slate-400 pt-1 border-t border-amber-200/40 dark:border-amber-900/40">
                  Ref ID: {tranId}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/dashboard/patient/appointments" className="w-full sm:w-1/2">
                <Button variant="primary" size="md" className="w-full" icon={<RefreshCw size={15} />}>
                  Resume Payment
                </Button>
              </Link>
              <Link href="/dashboard/patient" className="w-full sm:w-1/2">
                <Button variant="outline" size="md" className="w-full" icon={<ArrowLeft size={15} />}>
                  Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
}
