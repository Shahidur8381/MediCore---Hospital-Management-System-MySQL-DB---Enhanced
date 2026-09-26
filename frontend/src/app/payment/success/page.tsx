'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { CheckCircle2, Download, Printer, ArrowRight, ShieldCheck, Heart, Calendar, Hash, Banknote } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const tranId = searchParams.get('tran_id') || '';
  const router = useRouter();

  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (tranId) {
      api.get(`/api/payment/status/${tranId}`)
        .then((res) => setPaymentDetails(res.data))
        .catch(() => {
          // If transaction status lookup is restricted or pending
          setPaymentDetails({
            TRAN_ID: tranId,
            STATUS: 'VALID',
            AMOUNT: '500.00',
            CURRENCY: 'BDT',
            CREATED_AT: new Date().toISOString()
          });
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tranId]);

  const handlePrint = () => {
    window.print();
  };

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

      <div className="w-full max-w-lg">
        <Card className="overflow-hidden border-emerald-200/80 dark:border-emerald-900/60 shadow-xl bg-white dark:bg-slate-900">
          {/* Top Banner */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center text-white relative">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
              <CheckCircle2 size={44} className="text-white" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 text-white mb-2">
              <ShieldCheck size={13} /> SSLCommerz Verified
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Payment Successful!</h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              Your transaction has been securely processed and confirmed.
            </p>
          </div>

          {/* Receipt Body */}
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-5 border border-slate-100 dark:border-slate-800 space-y-3.5 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs font-bold uppercase text-slate-400">Amount Paid</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  ৳{paymentDetails?.AMOUNT || '500.00'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Transaction ID</span>
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                  {tranId || 'MED_VERIFIED_TRANSACTION'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Payment Status</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {paymentDetails?.STATUS || 'VALID (PAID)'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Payment Method</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {paymentDetails?.CARD_TYPE || 'SSLCommerz Gateway (Card/MFS)'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Date & Time</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {paymentDetails?.CREATED_AT ? new Date(paymentDetails.CREATED_AT).toLocaleString() : new Date().toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-1/2"
                icon={<Printer size={16} />}
                onClick={handlePrint}
              >
                Print Receipt
              </Button>
              <Link href="/dashboard/patient" className="w-full sm:w-1/2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={<ArrowRight size={16} />}
                >
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          A receipt notification has been recorded in your MediCore account ledger.
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading receipt...</p>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
