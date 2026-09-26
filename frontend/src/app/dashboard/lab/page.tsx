'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FullPageSpinner } from '@/components/LoadingSpinner';
import { DashboardShell } from '@/components/shell';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, EmptyState } from '@/components/ui';
import { TestTubes, CheckCircle2, Clock, FileCheck2, User, Send, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function LabDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [records, setRecords] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reportText, setReportText] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setFetching(true);
      const res = await api.get('/api/lab/records');
      setRecords(res.data);
    } catch {
      toast('Failed to fetch lab records', 'error');
    } finally {
      setFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Lab')) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, loading, router, fetchData]);

  const handleSubmitReport = async (recordId: number) => {
    const report = reportText[recordId]?.trim();
    if (!report) {
      toast('Please enter the result details', 'error');
      return;
    }
    try {
      setSubmittingId(recordId);
      await api.put(`/api/lab/records/${recordId}/complete`, { Result_Details: report });
      toast('Report submitted successfully!', 'success');
      setExpandedId(null);
      setReportText(prev => { const n = { ...prev }; delete n[recordId]; return n; });
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to submit report', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading || !user) return <FullPageSpinner />;

  const pendingRecords = records.filter(r => r.STATUS !== 'Completed');
  const completedRecords = records.filter(r => r.STATUS === 'Completed');
  const displayRecords = activeTab === 'pending' ? pendingRecords : completedRecords;

  return (
    <DashboardShell>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <TestTubes className="text-teal-600 dark:text-teal-400" />
            <span>Laboratory Testing Panel</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Process physician diagnostic test orders and submit official patient reports.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock size={14} />
            <span>Pending Tests</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold">
              {fetching ? '…' : pendingRecords.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Completed</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold">
              {fetching ? '…' : completedRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main List */}
      {fetching ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayRecords.length === 0 ? (
        <EmptyState
          icon={TestTubes}
          title={activeTab === 'pending' ? 'No Pending Lab Tests' : 'No Completed Reports'}
          description={
            activeTab === 'pending'
              ? 'All ordered lab tests have been completed and processed.'
              : 'Completed lab investigations will appear here for audit.'
          }
        />
      ) : (
        <div className="space-y-4">
          {displayRecords.map((record) => {
            const isExpanded = expandedId === record.RECORD_ID;

            return (
              <Card key={record.RECORD_ID} className="overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        record.STATUS === 'Completed'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400'
                      }`}
                    >
                      <TestTubes size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          {record.TEST_NAME}
                        </h3>
                        <Badge
                          variant={record.STATUS === 'Completed' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {record.STATUS}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <User size={13} /> Patient: {record.PATIENT_NAME}
                        </span>
                        <span>•</span>
                        <span>Dr. {record.DOCTOR_NAME}</span>
                        <span>•</span>
                        <span>{new Date(record.ORDER_DATE).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center w-full sm:w-auto justify-end">
                    {record.STATUS === 'Completed' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        onClick={() => setExpandedId(isExpanded ? null : record.RECORD_ID)}
                      >
                        {isExpanded ? 'Hide Result' : 'View Result'}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<FileCheck2 size={15} />}
                        onClick={() => setExpandedId(isExpanded ? null : record.RECORD_ID)}
                      >
                        {isExpanded ? 'Cancel' : 'Enter Report'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Enter Report Panel */}
                {!record.RESULT_DETAILS && isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                      <FileCheck2 size={14} className="text-teal-600" /> Enter Laboratory Investigation Findings
                    </h4>
                    <textarea
                      rows={5}
                      placeholder={
                        'Sample Findings:\nHaemoglobin: 13.5 g/dL (Normal: 12.0 - 15.5)\nWBC Count: 7,500 /uL (Normal: 4,000 - 11,000)\nPlatelets: 250,000 /uL (Normal: 150,000 - 450,000)\n\nConclusion: All parameters within standard reference ranges.'
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none resize-none font-mono"
                      value={reportText[record.RECORD_ID] || ''}
                      onChange={e => setReportText(prev => ({ ...prev, [record.RECORD_ID]: e.target.value }))}
                    />
                    <div className="flex justify-end mt-3">
                      <Button
                        variant="primary"
                        size="md"
                        icon={<Send size={14} />}
                        loading={submittingId === record.RECORD_ID}
                        onClick={() => handleSubmitReport(record.RECORD_ID)}
                      >
                        Submit Report
                      </Button>
                    </div>
                  </div>
                )}

                {/* Completed Report View */}
                {record.STATUS === 'Completed' && isExpanded && record.RESULT_DETAILS && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Verified Report Findings
                    </h4>
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
    </DashboardShell>
  );
}
