'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Download, Printer, FileText } from 'lucide-react';

interface PrescriptionViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlobUrl: string | null;
  appointmentId: number;
  doctorName?: string;
  onDownload: () => void;
}

export function PrescriptionViewer({
  isOpen,
  onClose,
  pdfBlobUrl,
  appointmentId,
  doctorName,
  onDownload,
}: PrescriptionViewerProps) {
  const handlePrint = () => {
    if (pdfBlobUrl) {
      const iframe = document.getElementById('pdf-preview-frame') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Prescription Preview (Appointment #${appointmentId})`}
      description={doctorName ? `Prescribed by Dr. ${doctorName}` : 'Official MediCore Medical Prescription'}
      size="xl"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Toolbar */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <FileText size={14} className="text-blue-500" />
            Verified Medical Document Format
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={handlePrint}>
              Print
            </Button>
            <Button variant="primary" size="sm" icon={<Download size={14} />} onClick={onDownload}>
              Download PDF
            </Button>
          </div>
        </div>

        {/* PDF Frame */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {pdfBlobUrl ? (
            <iframe
              id="pdf-preview-frame"
              src={pdfBlobUrl}
              className="w-full h-full rounded-xl"
              title="Prescription PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Rendering digital prescription stream...
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
