'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, RefreshCw, ArrowLeft, Heart, AlertTriangle } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const tranId = searchParams.get('tran_id') || '';
  const errorReason = searchParams.get('error') || 'Payment verification was declined or timed out.';

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
        <Card className="overflow-hidden border-rose-200 dark:border-rose-900/60 shadow-xl bg-white dark:bg-slate-900">
          {/* Top Banner */}
          <div className="bg-gradient-to-br from-rose-500 to-red-600 p-8 text-center text-white">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
              <XCircle size={44} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Payment Failed</h1>
            <p className="text-rose-100 text-xs sm:text-sm mt-1">
              Your transaction could not be completed by the payment provider.
            </p>
          </div>

          {/* Details Body */}
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 p-4 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                <span>What Happened?</span>
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                The card or mobile banking session was not authorized. No charges were deducted from your account. Your appointment booking context remains preserved.
              </p>
              {tranId && (
                <p className="font-mono text-[11px] text-slate-400 pt-1 border-t border-rose-200/40 dark:border-rose-900/40">
                  Ref ID: {tranId}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/dashboard/patient/appointments" className="w-full sm:w-1/2">
                <Button variant="primary" size="md" className="w-full" icon={<RefreshCw size={15} />}>
                  Retry Payment
                </Button>
              </Link>
              <Link href="/dashboard/patient" className="w-full sm:w-1/2">
                <Button variant="outline" size="md" className="w-full" icon={<ArrowLeft size={15} />}>
                  My Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
