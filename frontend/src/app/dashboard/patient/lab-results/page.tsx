'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FullPageSpinner } from '@/components/LoadingSpinner';
import { DashboardShell } from '@/components/shell';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import {
  TestTubes, FileCheck2, Clock, CheckCircle2,
  CreditCard, ChevronDown, ChevronUp, ShieldCheck,
  CheckSquare, Square, AlertCircle, ArrowRight, Check
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function LabResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [labRecords, setLabRecords] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payingBulk, setPayingBulk] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setFetching(true);
      const res = await api.get('/api/lab/records');
      setLabRecords(res.data);
    } catch {
      toast('Failed to fetch lab results', 'error');
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

  // Derived states
  const unpaidRecords = useMemo(
    () => labRecords.filter((r) => r.PAYMENT_STATUS !== 'Paid'),
    [labRecords]
  );

  const paidRecords = useMemo(
    () => labRecords.filter((r) => r.PAYMENT_STATUS === 'Paid'),
    [labRecords]
  );

  const allUnpaidSelected = useMemo(
    () =>
      unpaidRecords.length > 0 &&
      unpaidRecords.every((r) => selectedIds.includes(r.RECORD_ID)),
    [unpaidRecords, selectedIds]
  );

  const selectedUnpaidRecords = useMemo(
    () => unpaidRecords.filter((r) => selectedIds.includes(r.RECORD_ID)),
    [unpaidRecords, selectedIds]
  );

  const selectedTotalAmount = useMemo(
    () =>
      selectedUnpaidRecords.reduce((sum, r) => {
        const fee = parseFloat(r.TEST_FEE) || 0;
        return sum + (r.WAIVE_COMMISSION === 'Y' ? Math.ceil(fee * 0.75) : fee);
      }, 0),
    [selectedUnpaidRecords]
  );

  const totalUnpaidAmount = useMemo(
    () =>
      unpaidRecords.reduce((sum, r) => {
        const fee = parseFloat(r.TEST_FEE) || 0;
        return sum + (r.WAIVE_COMMISSION === 'Y' ? Math.ceil(fee * 0.75) : fee);
      }, 0),
    [unpaidRecords]
  );

  // Toggle selection for a single record
  const toggleSelectRecord = (recordId: number) => {
    setSelectedIds((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    );
  };

  // Toggle select all unpaid records
  const handleToggleSelectAll = () => {
    if (allUnpaidSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unpaidRecords.map((r) => r.RECORD_ID));
    }
  };

  // Select all helper
  const handleSelectAll = () => {
    setSelectedIds(unpaidRecords.map((r) => r.RECORD_ID));
  };

  // Deselect all helper
  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Real SSLCommerz payment initiation for single item
  const handlePaySingle = async (record: any) => {
    try {
      setPayingId(record.RECORD_ID);
      const res = await api.post('/api/payment/initiate', {
        itemType: 'Lab Test',
        itemId: record.RECORD_ID,
      });

      if (res.data.gatewayUrl) {
        toast('Redirecting to SSLCommerz Sandbox Gateway...', 'info');
        window.location.href = res.data.gatewayUrl;
      } else {
        toast('Unable to initialize payment session', 'error');
      }
    } catch (err: any) {
      toast(err.response?.data?.message || 'Payment initiation failed', 'error');
    } finally {
      setPayingId(null);
    }
  };

  // Real SSLCommerz payment initiation for selected / bulk items
  const handlePaySelected = async () => {
    if (selectedIds.length === 0) {
      toast('Please select at least one unpaid lab test to proceed', 'warning');
      return;
    }

    try {
      setPayingBulk(true);
      const res = await api.post('/api/payment/initiate', {
        itemType: selectedIds.length > 1 ? 'Bulk Lab Tests' : 'Lab Test',
        itemId: selectedIds[0],
        itemIds: selectedIds,
      });

      if (res.data.gatewayUrl) {
        toast(
          `Redirecting to SSLCommerz Gateway for ${selectedIds.length} test(s) (৳${res.data.amount || selectedTotalAmount})...`,
          'info'
        );
        window.location.href = res.data.gatewayUrl;
      } else {
        toast('Unable to initialize payment session', 'error');
      }
    } catch (err: any) {
      toast(err.response?.data?.message || 'Payment initiation failed', 'error');
    } finally {
      setPayingBulk(false);
    }
  };

  if (loading || !user) return <FullPageSpinner />;

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <TestTubes className="text-amber-600 dark:text-amber-400" />
            <span>Diagnostic Lab Results</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pay diagnostic test invoices online via SSLCommerz and access verified clinical findings.
          </p>
        </div>

        {/* Stats Badges */}
        {!fetching && labRecords.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Total: {labRecords.length} Tests
            </span>
            {unpaidRecords.length > 0 ? (
              <Badge variant="danger" dot>
                {unpaidRecords.length} Unpaid (৳{totalUnpaidAmount.toLocaleString()})
              </Badge>
            ) : (
              <Badge variant="success" dot>
                All Bills Cleared
              </Badge>
            )}
          </div>
        )}
      </div>

      {fetching ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : labRecords.length === 0 ? (
        <EmptyState
          icon={TestTubes}
          title="No Lab Tests Ordered"
          description="Diagnostic tests prescribed by your attending doctor will be available here for payment and review."
        />
      ) : (
        <div className="space-y-4 pb-24">
          {/* Bulk Payment & Selection Toolbar (when unpaid tests exist) */}
          {unpaidRecords.length > 0 && (
            <Card className="p-4 sm:p-5 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 border-amber-200 dark:border-amber-900/60 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Select All Checkbox Area */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-400 transition-colors focus:outline-none cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        allUnpaidSelected
                          ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                          : selectedIds.length > 0
                          ? 'bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-900/50 dark:border-amber-400 dark:text-amber-300'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {allUnpaidSelected ? (
                        <Check size={14} strokeWidth={3} />
                      ) : selectedIds.length > 0 ? (
                        <span className="w-2 h-2 rounded-sm bg-amber-600 dark:bg-amber-400" />
                      ) : null}
                    </div>
                    <span>Select All Unpaid Tests ({unpaidRecords.length})</span>
                  </button>

                  {selectedIds.length > 0 && (
                    <Badge variant="warning" size="sm">
                      {selectedIds.length} of {unpaidRecords.length} selected
                    </Badge>
                  )}
                </div>

                {/* Amount and Pay Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between md:justify-end w-full md:w-auto">
                  <div className="text-left sm:text-right flex items-center justify-between sm:block">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                      {selectedIds.length > 0 ? 'Selected Amount' : 'Total Unpaid'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                      ৳{selectedIds.length > 0 ? selectedTotalAmount.toLocaleString() : totalUnpaidAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {selectedIds.length > 0 ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDeselectAll}
                          className="text-xs"
                        >
                          Clear
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<CreditCard size={15} />}
                          loading={payingBulk}
                          onClick={handlePaySelected}
                          className="bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500 shadow-md font-semibold text-xs sm:text-sm"
                        >
                          Pay Selected (৳{selectedTotalAmount.toLocaleString()})
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<CreditCard size={15} />}
                        onClick={handleSelectAll}
                        className="bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500 shadow-sm font-semibold text-xs sm:text-sm w-full sm:w-auto"
                      >
                        Select All & Pay (৳{totalUnpaidAmount.toLocaleString()})
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* List of Lab Records */}
          {labRecords.map((record) => {
            const isPaid = record.PAYMENT_STATUS === 'Paid';
            const isCompleted = record.STATUS === 'Completed';
            const isExpanded = expandedReport === record.RECORD_ID;
            const isSelected = selectedIds.includes(record.RECORD_ID);

            return (
              <Card
                key={record.RECORD_ID}
                className={`overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-amber-500/70 dark:ring-amber-400/80 border-amber-300 dark:border-amber-700 bg-amber-50/15 dark:bg-amber-950/10'
                    : ''
                }`}
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox for Unpaid Records */}
                    {!isPaid ? (
                      <button
                        type="button"
                        onClick={() => toggleSelectRecord(record.RECORD_ID)}
                        className="mt-2 text-slate-400 hover:text-amber-600 transition-colors focus:outline-none cursor-pointer shrink-0"
                        title={isSelected ? 'Deselect test' : 'Select test for payment'}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-amber-500'
                          }`}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </button>
                    ) : (
                      <div className="w-5 shrink-0" />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : isPaid
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                      }`}
                    >
                      <TestTubes size={22} />
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          {record.TEST_NAME}
                        </h3>
                        {isPaid ? (
                          <Badge variant={isCompleted ? 'success' : 'purple'} size="sm" dot>
                            {isCompleted ? 'Report Ready' : 'Processing in Lab'}
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm" dot>
                            Payment Due
                          </Badge>
                        )}
                        {isSelected && !isPaid && (
                          <Badge variant="warning" size="sm">
                            Selected
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>Dr. {record.DOCTOR_NAME}</span>
                        <span>•</span>
                        <span>Ordered: {new Date(record.ORDER_DATE).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Fee: ৳{record.TEST_FEE}
                        </span>
                        {record.WAIVE_COMMISSION === 'Y' && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            (25% Concession Applied)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center w-full sm:w-auto justify-end">
                    {!isPaid ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isSelected ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => toggleSelectRecord(record.RECORD_ID)}
                          className="text-xs"
                        >
                          {isSelected ? 'Deselect' : 'Select'}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<CreditCard size={14} />}
                          loading={payingId === record.RECORD_ID}
                          onClick={() => handlePaySingle(record)}
                        >
                          Pay Online (৳{record.TEST_FEE})
                        </Button>
                      </div>
                    ) : isCompleted ? (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        onClick={() => setExpandedReport(isExpanded ? null : record.RECORD_ID)}
                      >
                        {isExpanded ? 'Hide Report' : 'View Report'}
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <Clock size={13} /> Awaiting Technician
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Report View */}
                {isCompleted && isExpanded && record.RESULT_DETAILS && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <FileCheck2 size={14} className="text-emerald-600" /> Verified Laboratory Results
                      </h4>
                      <Badge variant="success" size="sm">
                        <ShieldCheck size={11} className="mr-1" /> Medical Grade Verified
                      </Badge>
                    </div>
                    <pre className="text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 font-mono">
                      {record.RESULT_DETAILS}
                    </pre>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Sticky Bottom Bar for Selection Checkout */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl p-4 sm:p-5 bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-md shadow-2xl border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <CreditCard size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">
                  {selectedIds.length} lab test{selectedIds.length > 1 ? 's' : ''} selected
                </span>
                <span className="text-xl font-black text-amber-400">
                  ৳{selectedTotalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Clear Selection
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<CreditCard size={16} />}
                loading={payingBulk}
                onClick={handlePaySelected}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold focus-visible:ring-amber-400 shadow-lg cursor-pointer"
              >
                Pay Total Bill (৳{selectedTotalAmount.toLocaleString()})
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
