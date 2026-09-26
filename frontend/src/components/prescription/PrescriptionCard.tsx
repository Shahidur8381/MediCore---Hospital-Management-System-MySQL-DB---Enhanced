'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PrescriptionViewer } from './PrescriptionViewer';
import {
  FileText, Calendar, Pill, AlertCircle, Download,
  Eye, Stethoscope, CheckCircle2, ShieldCheck
} from 'lucide-react';

export interface PrescriptionData {
  PRESCRIPTION_ID: number;
  APPOINTMENT_ID: number;
  PATIENT_ID: number;
  DOCTOR_ID: number;
  DOCTOR_NAME: string;
  SPECIALIZATION?: string;
  DEPARTMENT_NAME?: string;
  DIAGNOSIS: string;
  MEDICINES: string;
  NOTES?: string;
  PRESCRIPTION_DATE: string;
}

interface PrescriptionCardProps {
  prescription: PrescriptionData;
}

export function PrescriptionCard({ prescription }: PrescriptionCardProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Clear cached preview blob if prescription changes
  React.useEffect(() => {
    setBlobUrl(null);
  }, [prescription.PRESCRIPTION_ID]);

  // Clean up object URL on unmount
  React.useEffect(() => {
    return () => {
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const fetchPdfBlob = async (): Promise<Blob | null> => {
    try {
      const response = await api.get(`/api/prescriptions/${prescription.PRESCRIPTION_ID}/pdf?prescriptionId=${prescription.PRESCRIPTION_ID}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast('Access Denied: You are not authorized to access this prescription', 'error');
      } else {
        toast('Failed to download prescription PDF. Please try again.', 'error');
      }
      return null;
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await fetchPdfBlob();
      if (!blob) return;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MediCore_Prescription_#${prescription.PRESCRIPTION_ID}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast('Prescription PDF downloaded successfully', 'success');
    } catch (e) {
      toast('Download failed', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      if (!blobUrl) {
        const blob = await fetchPdfBlob();
        if (!blob) return;
        const url = window.URL.createObjectURL(blob);
        setBlobUrl(url);
      }
      setViewerOpen(true);
    } catch (e) {
      toast('Preview failed', 'error');
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-900/60">
              <Stethoscope size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Dr. {prescription.DOCTOR_NAME}
                </h3>
                <Badge variant="success" size="sm">
                  <ShieldCheck size={11} className="mr-1" /> Verified Rx
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>{prescription.SPECIALIZATION || prescription.DEPARTMENT_NAME || 'Consultant Physician'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {new Date(prescription.PRESCRIPTION_DATE).toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              icon={<Eye size={14} />}
              loading={previewing}
              onClick={handlePreview}
            >
              Preview
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Download size={14} />}
              loading={downloading}
              onClick={handleDownload}
            >
              Download PDF
            </Button>
          </div>
        </div>

        {/* Content Details */}
        <CardContent className="p-5 md:p-6 space-y-5">
          {/* Diagnosis */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              Clinical Diagnosis
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              {prescription.DIAGNOSIS || 'General Clinical Consultation'}
            </p>
          </div>

          {/* Medicines & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1.5">
                <Pill size={12} className="text-blue-500" /> Prescribed Medications
              </span>
              <div className="bg-blue-50/40 dark:bg-blue-950/20 rounded-xl p-4 text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono border border-blue-100 dark:border-blue-900/40 leading-relaxed min-h-[90px]">
                {prescription.MEDICINES || 'No medications prescribed.'}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1.5">
                <AlertCircle size={12} className="text-amber-500" /> Instructions & Follow-up
              </span>
              <div className="bg-amber-50/40 dark:bg-amber-950/20 rounded-xl p-4 text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap border border-amber-100 dark:border-amber-900/40 leading-relaxed min-h-[90px]">
                {prescription.NOTES || 'Follow standard health guidelines. Return if symptoms persist.'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embedded PDF Viewer Modal */}
      <PrescriptionViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        pdfBlobUrl={blobUrl}
        appointmentId={prescription.APPOINTMENT_ID}
        prescriptionId={prescription.PRESCRIPTION_ID}
        doctorName={prescription.DOCTOR_NAME}
        onDownload={handleDownload}
      />
    </>
  );
}
