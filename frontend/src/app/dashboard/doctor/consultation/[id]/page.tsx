'use client';

import React, { useEffect, useState, useMemo, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FullPageSpinner } from '@/components/LoadingSpinner';
import { 
  ArrowLeft, FileText, TestTubes, CheckCircle2, User, Calendar, Plus, 
  Trash2, Clock, Hash, FileCheck2, Activity, Heart, Thermometer, 
  Scale, Pill, AlertTriangle, Sparkles, ClipboardList, Info, 
  Search, ShieldAlert, Phone, Mail, Droplet, MapPin, AlertCircle, Check
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { DashboardShell } from '@/components/shell';
import { Badge, Button, Card, Modal } from '@/components/ui';

interface MedicineRow {
  name: string;
  dosage: string;
  timing: string;
  duration: string;
  instructions: string;
}

// Common clinical medicine database for autocomplete & presets
const COMMON_MEDICINES = [
  { name: 'Paracetamol 500mg', defaultDosage: '1+0+1', defaultTiming: 'After Meal', defaultDuration: '5 Days' },
  { name: 'Amoxicillin 500mg', defaultDosage: '1+1+1', defaultTiming: 'After Meal', defaultDuration: '7 Days' },
  { name: 'Azithromycin 500mg', defaultDosage: '1+0+0', defaultTiming: 'Before Meal', defaultDuration: '3 Days' },
  { name: 'Omeprazole 20mg', defaultDosage: '1+0+1', defaultTiming: 'Before Meal', defaultDuration: '14 Days' },
  { name: 'Esomeprazole 20mg', defaultDosage: '1+0+1', defaultTiming: 'Before Meal', defaultDuration: '14 Days' },
  { name: 'Metformin 500mg', defaultDosage: '1+0+1', defaultTiming: 'With Food', defaultDuration: '1 Month' },
  { name: 'Gliclazide 80mg', defaultDosage: '1+0+0', defaultTiming: 'Before Meal', defaultDuration: '1 Month' },
  { name: 'Amlodipine 5mg', defaultDosage: '0+0+1', defaultTiming: 'After Meal', defaultDuration: '1 Month' },
  { name: 'Losartan Potassium 50mg', defaultDosage: '1+0+0', defaultTiming: 'After Meal', defaultDuration: '1 Month' },
  { name: 'Montelukast 10mg', defaultDosage: '0+0+1', defaultTiming: 'After Meal', defaultDuration: '14 Days' },
  { name: 'Cetirizine 10mg', defaultDosage: '0+0+1', defaultTiming: 'After Meal', defaultDuration: '7 Days' },
  { name: 'Levocetirizine 5mg', defaultDosage: '0+0+1', defaultTiming: 'After Meal', defaultDuration: '7 Days' },
  { name: 'Fexofenadine 120mg', defaultDosage: '1+0+0', defaultTiming: 'After Meal', defaultDuration: '10 Days' },
  { name: 'Ciprofloxacin 500mg', defaultDosage: '1+0+1', defaultTiming: 'After Meal', defaultDuration: '5 Days' },
  { name: 'Ibuprofen 400mg', defaultDosage: '1+0+1', defaultTiming: 'After Meal', defaultDuration: '3 Days' },
  { name: 'Naproxen 500mg', defaultDosage: '1+0+1', defaultTiming: 'After Meal', defaultDuration: '5 Days' },
  { name: 'Aceclofenac 100mg', defaultDosage: '1+0+1', defaultTiming: 'After Meal', defaultDuration: '7 Days' },
  { name: 'Tolperisone 50mg', defaultDosage: '1+0+1', defaultTiming: 'After Meal', defaultDuration: '7 Days' },
  { name: 'Flavoxate 200mg', defaultDosage: '1+1+1', defaultTiming: 'After Meal', defaultDuration: '5 Days' },
  { name: 'Flunarizine 10mg', defaultDosage: '0+0+1', defaultTiming: 'After Meal', defaultDuration: '1 Month' },
  { name: 'Domperidone 10mg', defaultDosage: '1+0+1', defaultTiming: 'Before Meal', defaultDuration: '5 Days' },
  { name: 'Ondansetron 4mg', defaultDosage: '1+0+1', defaultTiming: 'Before Meal', defaultDuration: '3 Days' },
  { name: 'Oral Rehydration Salts (ORS)', defaultDosage: '1 Packet', defaultTiming: 'After Meal', defaultDuration: '3 Days' },
  { name: 'Zinc 20mg', defaultDosage: '1+0+0', defaultTiming: 'After Meal', defaultDuration: '10 Days' },
  { name: 'Calcium 500mg + Vitamin D3', defaultDosage: '0+0+1', defaultTiming: 'After Meal', defaultDuration: '1 Month' },
  { name: 'Doxophylline 400mg', defaultDosage: '1+0+1', defaultTiming: 'After Meal', defaultDuration: '14 Days' },
  { name: 'Salbutamol Inhaler 100mcg', defaultDosage: '2 Puffs', defaultTiming: 'As Needed', defaultDuration: '1 Month' },
];

const CLINICAL_TEMPLATES = [
  {
    id: 'fever',
    title: 'Viral Fever / URI',
    category: 'Infection',
    diagnosis: 'Acute Upper Respiratory Tract Infection with Fever',
    medicines: [
      { name: 'Paracetamol 500mg', dosage: '1+0+1', timing: 'After Meal', duration: '5 Days', instructions: 'Take for fever or body ache' },
      { name: 'Cetirizine 10mg', dosage: '0+0+1', timing: 'After Meal', duration: '5 Days', instructions: 'Take at night' },
      { name: 'Esomeprazole 20mg', dosage: '1+0+1', timing: 'Before Meal', duration: '5 Days', instructions: '30 mins before breakfast & dinner' },
    ],
    notes: 'Adequate oral hydration, steam inhalation twice daily, and bed rest. Report immediately if breathing difficulty occurs.'
  },
  {
    id: 'gastritis',
    title: 'Acute Gastritis / GERD',
    category: 'Gastrointestinal',
    diagnosis: 'Acute Peptic / Acid Peptic Disorder (Gastritis)',
    medicines: [
      { name: 'Omeprazole 20mg', dosage: '1+0+1', timing: 'Before Meal', duration: '14 Days', instructions: '30 mins before food' },
      { name: 'Domperidone 10mg', dosage: '1+0+1', timing: 'Before Meal', duration: '7 Days', instructions: '15 mins before meals' },
      { name: 'Esomeprazole 20mg', dosage: '1+0+1', timing: 'Before Meal', duration: '14 Days', instructions: 'Before breakfast and dinner' },
    ],
    notes: 'Avoid spicy, oily, and fried foods. Maintain timely meals and avoid lying down immediately after dining.'
  },
  {
    id: 'hypertension',
    title: 'Hypertension Check',
    category: 'Cardiovascular',
    diagnosis: 'Essential Hypertension (Stage 1 / 2)',
    medicines: [
      { name: 'Amlodipine 5mg', dosage: '0+0+1', timing: 'After Meal', duration: '1 Month', instructions: 'Daily at bedtime' },
      { name: 'Losartan Potassium 50mg', dosage: '1+0+0', timing: 'After Meal', duration: '1 Month', instructions: 'Take once daily in morning' },
    ],
    notes: 'Low sodium (salt) diet. 30 minutes of brisk walking daily. Monitor and record blood pressure weekly.'
  },
  {
    id: 'diabetes',
    title: 'Type 2 Diabetes (T2DM)',
    category: 'Endocrine',
    diagnosis: 'Type 2 Diabetes Mellitus - Glycemic Optimization',
    medicines: [
      { name: 'Metformin 500mg', dosage: '1+0+1', timing: 'With Food', duration: '1 Month', instructions: 'Take during or immediately after meals' },
      { name: 'Gliclazide 80mg', dosage: '1+0+0', timing: 'Before Meal', duration: '1 Month', instructions: '30 mins before breakfast' },
      { name: 'Esomeprazole 20mg', dosage: '1+0+0', timing: 'Before Meal', duration: '14 Days', instructions: 'Before breakfast' },
    ],
    notes: 'Strict diabetic diet. Avoid sweets, soft drinks, and refined carbohydrates. Perform regular blood sugar profile test.'
  },
  {
    id: 'asthma',
    title: 'Asthma / Bronchitis',
    category: 'Respiratory',
    diagnosis: 'Bronchial Asthma with Acute Wheeze & Bronchospasm',
    medicines: [
      { name: 'Salbutamol Inhaler 100mcg', dosage: '2 Puffs', timing: 'As Needed', duration: '1 Month', instructions: 'Inhale 2 puffs during shortness of breath' },
      { name: 'Montelukast 10mg', dosage: '0+0+1', timing: 'After Meal', duration: '1 Month', instructions: 'Take 1 tablet every night' },
      { name: 'Doxophylline 400mg', dosage: '1+0+1', timing: 'After Meal', duration: '14 Days', instructions: 'Take twice daily after meals' },
      { name: 'Levocetirizine 5mg', dosage: '0+0+1', timing: 'After Meal', duration: '7 Days', instructions: 'Take at bedtime' },
    ],
    notes: 'Avoid exposure to cold air, smoke, and household dust. Rinse mouth with water after using inhaler.'
  },
  {
    id: 'uti',
    title: 'Urinary Tract Infection (UTI)',
    category: 'Urology',
    diagnosis: 'Acute Uncomplicated Urinary Tract Infection',
    medicines: [
      { name: 'Ciprofloxacin 500mg', dosage: '1+0+1', timing: 'After Meal', duration: '7 Days', instructions: 'Must complete full 7-day antibiotic course' },
      { name: 'Flavoxate 200mg', dosage: '1+1+1', timing: 'After Meal', duration: '5 Days', instructions: 'For urinary burning sensation and bladder spasm' },
      { name: 'Paracetamol 500mg', dosage: '1+0+1', timing: 'After Meal', duration: '3 Days', instructions: 'Take if fever or pelvic pain persists' },
    ],
    notes: 'Drink plenty of water (at least 2.5 to 3 liters daily). Do not delay urination.'
  },
  {
    id: 'migraine',
    title: 'Migraine / Headache',
    category: 'Neurology',
    diagnosis: 'Migraine / Tension-Type Vascular Headache',
    medicines: [
      { name: 'Naproxen 500mg', dosage: '1+0+1', timing: 'After Meal', duration: '3 Days', instructions: 'Take with meal for acute headache episode' },
      { name: 'Flunarizine 10mg', dosage: '0+0+1', timing: 'After Meal', duration: '1 Month', instructions: 'Take at night for migraine prevention' },
      { name: 'Domperidone 10mg', dosage: '1+0+1', timing: 'Before Meal', duration: '5 Days', instructions: 'Take 15 mins before food for nausea' },
      { name: 'Esomeprazole 20mg', dosage: '1+0+1', timing: 'Before Meal', duration: '7 Days', instructions: 'Gastric protection with pain medication' },
    ],
    notes: 'Rest in a quiet, dimly lit room during attacks. Avoid known food triggers, late nights, and screen strain.'
  },
  {
    id: 'allergy',
    title: 'Allergic Rhinitis / Allergy',
    category: 'Dermatology & ENT',
    diagnosis: 'Allergic Rhinitis with Atopic Allergic Reaction',
    medicines: [
      { name: 'Fexofenadine 120mg', dosage: '1+0+0', timing: 'After Meal', duration: '10 Days', instructions: 'Take once daily in morning' },
      { name: 'Montelukast 10mg', dosage: '0+0+1', timing: 'After Meal', duration: '14 Days', instructions: 'Take 1 tablet at night' },
      { name: 'Esomeprazole 20mg', dosage: '1+0+0', timing: 'Before Meal', duration: '10 Days', instructions: 'Before breakfast' },
    ],
    notes: 'Avoid allergenic foods (shrimp, beef, eggplant), pet hair, and strong perfumes.'
  },
  {
    id: 'backpain',
    title: 'Back Pain / Musculoskeletal',
    category: 'Orthopedics',
    diagnosis: 'Acute Lumbar Strain / Musculoskeletal Back Pain',
    medicines: [
      { name: 'Aceclofenac 100mg', dosage: '1+0+1', timing: 'After Meal', duration: '7 Days', instructions: 'Take after meals for severe pain' },
      { name: 'Tolperisone 50mg', dosage: '1+0+1', timing: 'After Meal', duration: '7 Days', instructions: 'Muscle relaxant after meals' },
      { name: 'Calcium 500mg + Vitamin D3', dosage: '0+0+1', timing: 'After Meal', duration: '1 Month', instructions: 'Take 1 tablet at night' },
      { name: 'Esomeprazole 20mg', dosage: '1+0+1', timing: 'Before Meal', duration: '10 Days', instructions: 'Take 30 mins before meals' },
    ],
    notes: 'Avoid lifting heavy objects and sudden twisting. Apply hot fomentation over lumbar area twice daily.'
  },
  {
    id: 'gastroenteritis',
    title: 'Gastroenteritis / Diarrhea',
    category: 'Gastrointestinal',
    diagnosis: 'Acute Gastroenteritis with Mild Dehydration',
    medicines: [
      { name: 'Ciprofloxacin 500mg', dosage: '1+0+1', timing: 'After Meal', duration: '5 Days', instructions: 'Antibiotic twice daily after meals' },
      { name: 'Oral Rehydration Salts (ORS)', dosage: '1 Packet', timing: 'After Meal', duration: '3 Days', instructions: 'Dissolve in 500ml pure water; drink after each loose stool' },
      { name: 'Zinc 20mg', dosage: '1+0+0', timing: 'After Meal', duration: '10 Days', instructions: 'Take once daily after food' },
      { name: 'Ondansetron 4mg', dosage: '1+0+1', timing: 'Before Meal', duration: '3 Days', instructions: 'Take 15 mins before food if nausea occurs' },
    ],
    notes: 'Drink plenty of oral fluids. Avoid oily, spicy, and dairy food until stool consistency normalizes.'
  }
];

export default function DoctorConsultationCockpit({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const appointmentId = resolvedParams.id;

  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [appointment, setAppointment] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [allPatientVisits, setAllPatientVisits] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [patientLabRecords, setPatientLabRecords] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // Clinical Vitals
  const [vitals, setVitals] = useState({
    bpSystolic: '120',
    bpDiastolic: '80',
    pulse: '76',
    temperature: '98.6',
    spo2: '98',
    weight: '68'
  });

  // Chief complaint & Diagnosis
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Itemized Prescription Composer
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { name: '', dosage: '1+0+1', timing: 'After Meal', duration: '5 Days', instructions: '' }
  ]);

  // Autocomplete state
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Lab Ordering State
  const [selectedTest, setSelectedTest] = useState('');
  const [waiveCommission, setWaiveCommission] = useState(false);
  const [orderingLab, setOrderingLab] = useState(false);
  const [submittingRx, setSubmittingRx] = useState(false);
  const [waitingForLab, setWaitingForLab] = useState(false);
  const [expandedLabReport, setExpandedLabReport] = useState<number | null>(null);

  // Preset explorer modal state
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetSearch, setPresetSearch] = useState('');
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<string>('All');

  // Filtered clinical presets
  const filteredPresets = useMemo(() => {
    return CLINICAL_TEMPLATES.filter(p => {
      const matchesCategory = selectedPresetCategory === 'All' || p.category === selectedPresetCategory;
      if (!matchesCategory) return false;
      if (!presetSearch.trim()) return true;
      const q = presetSearch.toLowerCase();
      const inTitle = p.title.toLowerCase().includes(q);
      const inDiag = p.diagnosis.toLowerCase().includes(q);
      const inMeds = p.medicines.some(m => m.name.toLowerCase().includes(q));
      return inTitle || inDiag || inMeds;
    });
  }, [presetSearch, selectedPresetCategory]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Doctor')) {
      router.push('/login');
    } else if (user) {
      loadCockpitData();
    }
  }, [user, loading, appointmentId]);

  const loadCockpitData = async () => {
    try {
      setFetching(true);
      const [aptRes, labTestsRes, labRecordsRes] = await Promise.all([
        api.get('/api/appointments'),
        api.get('/api/lab/tests'),
        api.get('/api/lab/records'),
      ]);

      const currentApt = aptRes.data.find((a: any) => a.APPOINTMENT_ID.toString() === appointmentId);
      if (!currentApt) {
        toast('Appointment not found or not assigned to you', 'error');
        router.push('/dashboard/doctor/appointments');
        return;
      }

      setAppointment(currentApt);
      setLabTests(labTestsRes.data || []);

      // Filter all appointments for this patient
      const patientVisits = aptRes.data.filter((a: any) => a.PATIENT_ID === currentApt.PATIENT_ID);
      setAllPatientVisits(patientVisits);

      // Filter lab tests for this patient
      const patientLabs = (labRecordsRes.data || []).filter((r: any) => r.PATIENT_ID === currentApt.PATIENT_ID);
      setPatientLabRecords(patientLabs);

      // Fetch patient demographic details
      try {
        const patientRes = await api.get(`/api/patients/${currentApt.PATIENT_ID}`);
        setPatientDetails(patientRes.data);
      } catch (pErr) {
        console.warn('Could not fetch patient demographics:', pErr);
      }

    } catch (err) {
      toast('Failed to load consultation cockpit', 'error');
    } finally {
      setFetching(false);
    }
  };

  const handleAddMedicine = () => {
    setMedicines(prev => [...prev, { name: '', dosage: '1+0+1', timing: 'After Meal', duration: '5 Days', instructions: '' }]);
  };

  const handleRemoveMedicine = (index: number) => {
    if (medicines.length === 1) {
      setMedicines([{ name: '', dosage: '1+0+1', timing: 'After Meal', duration: '5 Days', instructions: '' }]);
      return;
    }
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMedicine = (index: number, field: keyof MedicineRow, value: string) => {
    setMedicines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSelectAutocomplete = (index: number, item: typeof COMMON_MEDICINES[0]) => {
    setMedicines(prev => {
      const updated = [...prev];
      updated[index] = {
        name: item.name,
        dosage: item.defaultDosage,
        timing: item.defaultTiming,
        duration: item.defaultDuration,
        instructions: ''
      };
      return updated;
    });
    setActiveSearchIndex(null);
    setSearchTerm('');
  };

  // Add a single medicine from preset without overwriting existing entries
  const addMedicineToPrescription = (med: MedicineRow) => {
    setMedicines(prev => {
      // If the list only contains 1 empty row, replace it
      if (prev.length === 1 && !prev[0].name.trim()) {
        return [{ ...med }];
      }
      // Check if medicine already exists (case-insensitive)
      const exists = prev.some(m => m.name.trim().toLowerCase() === med.name.trim().toLowerCase());
      if (exists) {
        toast(`"${med.name}" is already in your prescription`, 'info');
        return prev;
      }
      toast(`Added "${med.name}" to prescription`, 'success');
      return [...prev, { ...med }];
    });
  };

  // Add all medicines from a clinical preset without overwriting existing entries
  const addPresetMedicines = (preset: typeof CLINICAL_TEMPLATES[0]) => {
    let addedCount = 0;
    let alreadyExistsCount = 0;

    setMedicines(prev => {
      // If the list only has an empty row, clear it
      const initial = (prev.length === 1 && !prev[0].name.trim()) ? [] : [...prev];
      const merged = [...initial];

      for (const med of preset.medicines) {
        const isDuplicate = merged.some(m => m.name.trim().toLowerCase() === med.name.trim().toLowerCase());
        if (isDuplicate) {
          alreadyExistsCount++;
        } else {
          merged.push({ ...med });
          addedCount++;
        }
      }

      return merged.length > 0 ? merged : prev;
    });

    // Populate diagnosis if empty
    if (!diagnosis.trim()) {
      setDiagnosis(preset.diagnosis);
    }

    // Populate clinical notes if empty, or append if not already present
    if (!clinicalNotes.trim()) {
      setClinicalNotes(preset.notes);
    } else if (!clinicalNotes.includes(preset.notes)) {
      setClinicalNotes(prev => `${prev}\n• ${preset.notes}`);
    }

    if (addedCount > 0) {
      toast(`Added ${addedCount} medicine(s) from "${preset.title}" (without overwriting)!`, 'success');
    } else if (alreadyExistsCount > 0) {
      toast(`All medicines from "${preset.title}" already exist in your prescription`, 'info');
    }
  };

  // Backwards compatibility alias
  const applyClinicalTemplate = (template: typeof CLINICAL_TEMPLATES[0]) => {
    addPresetMedicines(template);
  };

  const handleOrderLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;
    try {
      setOrderingLab(true);
      await api.post('/api/lab/records', {
        Patient_ID: appointment.PATIENT_ID,
        Test_ID: selectedTest,
        waiveCommission
      });
      toast('Lab test ordered successfully!', 'success');
      setSelectedTest('');
      setWaiveCommission(false);

      // Refresh lab records
      const labRecordsRes = await api.get('/api/lab/records');
      const patientLabs = (labRecordsRes.data || []).filter((r: any) => r.PATIENT_ID === appointment.PATIENT_ID);
      setPatientLabRecords(patientLabs);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to order lab test', 'error');
    } finally {
      setOrderingLab(false);
    }
  };

  const handleWaitForLab = async () => {
    try {
      setWaitingForLab(true);
      await api.put(`/api/appointments/${appointmentId}/status`, { status: 'Waiting' });
      toast('Appointment marked as Waiting for Lab Results', 'success');
      router.push('/dashboard/doctor/appointments');
    } catch (err: any) {
      toast('Failed to update status', 'error');
    } finally {
      setWaitingForLab(false);
    }
  };

  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!diagnosis.trim()) {
      toast('Please enter a clinical diagnosis', 'error');
      return;
    }

    // Format itemized medicines into clean text representation
    const validMeds = medicines.filter(m => m.name.trim().length > 0);
    const medicinesText = validMeds.map((m, idx) => {
      let line = `${idx + 1}. ${m.name.trim()} — ${m.dosage} (${m.timing}) for ${m.duration}`;
      if (m.instructions.trim()) {
        line += ` [${m.instructions.trim()}]`;
      }
      return line;
    }).join('\n');

    // Format Vitals and Clinical notes
    const vitalsSummary = `Vitals: BP: ${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg | Pulse: ${vitals.pulse} bpm | Temp: ${vitals.temperature}°F | SpO2: ${vitals.spo2}% | Wt: ${vitals.weight}kg`;
    
    let combinedNotes = '';
    if (chiefComplaint.trim()) {
      combinedNotes += `Chief Complaint: ${chiefComplaint.trim()}\n`;
    }
    combinedNotes += `${vitalsSummary}\n`;
    if (clinicalNotes.trim()) {
      combinedNotes += `\nClinical Advice & Notes:\n${clinicalNotes.trim()}`;
    }

    try {
      setSubmittingRx(true);
      await api.post('/api/prescriptions', {
        Appointment_ID: appointment.APPOINTMENT_ID,
        Patient_ID: appointment.PATIENT_ID,
        Diagnosis: diagnosis.trim(),
        Medicines: medicinesText || 'No medicines prescribed.',
        Notes: combinedNotes
      });

      toast('Consultation completed and prescription saved!', 'success');
      router.push('/dashboard/doctor/appointments');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to complete consultation', 'error');
    } finally {
      setSubmittingRx(false);
    }
  };

  if (loading || !user || fetching || !appointment) return <FullPageSpinner />;

  // Calculate age if DOB exists
  let calculatedAge = 'N/A';
  if (patientDetails?.DATE_OF_BIRTH) {
    const birthYear = new Date(patientDetails.DATE_OF_BIRTH).getFullYear();
    const currentYear = new Date().getFullYear();
    calculatedAge = `${currentYear - birthYear} yrs`;
  }

  const filteredAutocomplete = searchTerm.trim() 
    ? COMMON_MEDICINES.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : COMMON_MEDICINES.slice(0, 6);

  return (
    <DashboardShell fullWidth>
      {/* Top Banner Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <Link
            href="/dashboard/doctor/appointments"
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Clinical Consultation Cockpit
              </h1>
              <Badge variant="primary" size="sm">Queue #{appointment.QUEUE_NUMBER}</Badge>
              <Badge variant={appointment.STATUS === 'Completed' ? 'success' : appointment.STATUS === 'Waiting' ? 'warning' : 'default'} size="sm">
                {appointment.STATUS}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="flex items-center gap-1.5"><Calendar size={13} className="text-blue-500" /> {new Date(appointment.APPOINTMENT_DATE).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5"><Clock size={13} className="text-amber-500" /> Session ID #{appointment.APPOINTMENT_ID}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          <Button
            type="button"
            variant="outline"
            disabled={waitingForLab}
            onClick={handleWaitForLab}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs sm:text-sm"
          >
            <Clock size={16} />
            {waitingForLab ? 'Updating...' : 'Wait for Lab'}
          </Button>
          <Button
            onClick={handleCompleteConsultation}
            disabled={submittingRx}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 text-xs sm:text-sm"
          >
            <CheckCircle2 size={16} />
            {submittingRx ? 'Finalizing...' : 'Complete & Prescribe'}
          </Button>
        </div>
      </div>

      {/* Split Screen Clinical Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL (Demographics, History, Past Records, Lab Results) - 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Patient Demographic Card */}
          <Card className="p-5 border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                  {appointment.PATIENT_NAME.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                    {appointment.PATIENT_NAME}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    PID #{appointment.PATIENT_ID} • {patientDetails?.GENDER || 'Not specified'} • {calculatedAge}
                  </p>
                </div>
              </div>
              {patientDetails?.BLOOD_GROUP && (
                <div className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Droplet size={12} className="fill-rose-500" />
                  {patientDetails.BLOOD_GROUP}
                </div>
              )}
            </div>

            {/* Quick Demographics Grid */}
            <div className="py-3.5 grid grid-cols-2 gap-3 text-xs border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Phone</span>
                <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" />
                  {patientDetails?.PHONE || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Emergency</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {patientDetails?.EMERGENCY_CONTACT || 'None listed'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Address</span>
                <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{patientDetails?.ADDRESS || 'No address registered'}</span>
                </span>
              </div>
            </div>

            {/* Allergy Flagging Warning Guard */}
            <div className="pt-3">
              <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
                <AlertCircle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Allergy Guard:</strong> Verify penicillin & NSAID tolerances with patient prior to prescribing.
                </span>
              </div>
            </div>
          </Card>

          {/* Previous Visits / History Card */}
          <Card className="p-5 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                <ClipboardList size={16} className="text-indigo-500" />
                Previous Visits ({allPatientVisits.length})
              </h3>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {allPatientVisits.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">First recorded visit for this patient.</p>
              ) : (
                allPatientVisits.map(v => (
                  <div 
                    key={v.APPOINTMENT_ID}
                    className={`p-2.5 rounded-xl border text-xs transition-colors flex items-center justify-between ${
                      v.APPOINTMENT_ID.toString() === appointmentId
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(v.APPOINTMENT_DATE).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Queue #{v.QUEUE_NUMBER} • Dr. {v.DOCTOR_NAME}
                      </div>
                    </div>
                    <Badge variant={v.STATUS === 'Completed' ? 'success' : v.STATUS === 'Waiting' ? 'warning' : 'default'}>
                      {v.STATUS}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Patient Lab Records / Investigation Card */}
          <Card className="p-5 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                <TestTubes size={16} className="text-amber-500" />
                Lab Investigations ({patientLabRecords.length})
              </h3>
            </div>

            {/* Quick Order New Test */}
            <form onSubmit={handleOrderLab} className="mb-4 p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2">
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300">
                Order Diagnostic Test
              </label>
              <select
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={selectedTest}
                onChange={e => setSelectedTest(e.target.value)}
              >
                <option value="">Select test...</option>
                {labTests.map(t => (
                  <option key={t.TEST_ID} value={t.TEST_ID}>
                    {t.TEST_NAME} — ৳{t.TEST_FEE}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waiveCommission}
                    onChange={e => setWaiveCommission(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Waive my 25% fee</span>
                </label>
                <Button
                  type="submit"
                  size="sm"
                  disabled={orderingLab || !selectedTest}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs py-1 px-2.5 h-auto"
                >
                  <Plus size={13} className="mr-1" />
                  {orderingLab ? 'Ordering...' : 'Order'}
                </Button>
              </div>
            </form>

            {/* Investigation History Feed */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {patientLabRecords.length === 0 ? (
                <p className="text-xs text-slate-400 py-1">No lab records on file for this patient.</p>
              ) : (
                patientLabRecords.map(r => {
                  const isCompleted = r.STATUS === 'Completed';
                  const isExpanded = expandedLabReport === r.RECORD_ID;

                  return (
                    <div 
                      key={r.RECORD_ID}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 text-xs"
                    >
                      <div className="p-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {r.TEST_NAME}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            ৳{r.TEST_FEE} • {r.PAYMENT_STATUS === 'Paid' ? 'Paid' : 'Unpaid'}
                            {r.WAIVE_COMMISSION === 'Y' && ' • (Fee Waived)'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={isCompleted ? 'success' : r.PAYMENT_STATUS === 'Paid' ? 'info' : 'warning'}>
                            {r.STATUS}
                          </Badge>
                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => setExpandedLabReport(isExpanded ? null : r.RECORD_ID)}
                              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded"
                              title="View Result Details"
                            >
                              <FileCheck2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Result Details */}
                      {isCompleted && isExpanded && (
                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border-t border-emerald-100 dark:border-emerald-900/60">
                          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                            <span>Lab Diagnostic Findings</span>
                            {r.REPORT_DATE && <span>{new Date(r.REPORT_DATE).toLocaleDateString()}</span>}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                            {r.RESULT_DETAILS || 'Normal results within reference ranges.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT PANEL (Clinical Workspace, Vitals, Diagnosis, Prescription Composer) - 8 cols */}
        <div className="lg:col-span-8 space-y-6">

          {/* Quick Clinical Templates Bar */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl flex flex-wrap items-center gap-2 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 mr-1 shrink-0">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Quick Presets:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              {CLINICAL_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => addPresetMedicines(tmpl)}
                  className="text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-500 hover:text-amber-600 dark:hover:border-amber-400 dark:hover:text-amber-300 font-medium transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
                  title={`Add all medicines from ${tmpl.title} to prescription without overwriting`}
                >
                  <Plus size={11} className="text-amber-500" />
                  <span>{tmpl.title}</span>
                </button>
              ))}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsPresetModalOpen(true)}
              className="text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 shrink-0 ml-auto font-semibold"
              icon={<Sparkles size={13} className="text-amber-500" />}
            >
              Browse Presets ({CLINICAL_TEMPLATES.length})
            </Button>
          </div>

          {/* Clinical Vitals Station */}
          <Card className="p-5 border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <Activity size={18} className="text-blue-500" />
              Patient Vitals & Biometrics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* BP */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Heart size={12} className="text-rose-500" /> BP (mmHg)
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={vitals.bpSystolic}
                    onChange={e => setVitals({ ...vitals, bpSystolic: e.target.value })}
                    className="w-12 text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-center text-slate-800 dark:text-slate-100"
                    placeholder="120"
                  />
                  <span className="text-slate-400 font-bold">/</span>
                  <input
                    type="text"
                    value={vitals.bpDiastolic}
                    onChange={e => setVitals({ ...vitals, bpDiastolic: e.target.value })}
                    className="w-12 text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-center text-slate-800 dark:text-slate-100"
                    placeholder="80"
                  />
                </div>
              </div>

              {/* Pulse */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Activity size={12} className="text-emerald-500" /> Pulse (bpm)
                </span>
                <input
                  type="text"
                  value={vitals.pulse}
                  onChange={e => setVitals({ ...vitals, pulse: e.target.value })}
                  className="w-full text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100"
                  placeholder="72"
                />
              </div>

              {/* Temp */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Thermometer size={12} className="text-amber-500" /> Temp (°F)
                </span>
                <input
                  type="text"
                  value={vitals.temperature}
                  onChange={e => setVitals({ ...vitals, temperature: e.target.value })}
                  className="w-full text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100"
                  placeholder="98.6"
                />
              </div>

              {/* SpO2 */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Activity size={12} className="text-cyan-500" /> SpO2 (%)
                </span>
                <input
                  type="text"
                  value={vitals.spo2}
                  onChange={e => setVitals({ ...vitals, spo2: e.target.value })}
                  className="w-full text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100"
                  placeholder="98"
                />
              </div>

              {/* Weight */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Scale size={12} className="text-indigo-500" /> Wt (kg)
                </span>
                <input
                  type="text"
                  value={vitals.weight}
                  onChange={e => setVitals({ ...vitals, weight: e.target.value })}
                  className="w-full text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100"
                  placeholder="70"
                />
              </div>
            </div>
          </Card>

          {/* Chief Complaint & Diagnosis */}
          <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Chief Complaint / Presenting Symptoms
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={e => setChiefComplaint(e.target.value)}
                placeholder="e.g. High fever for 3 days accompanied by dry cough and headache"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Diagnosis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Viral Bronchitis"
                className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </Card>

          {/* Medicine Prescription Composer */}
          <Card className="p-5 border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Pill size={18} className="text-indigo-500" />
                  Prescription Composer (Rx)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Itemized medications with dosage, frequency, and duration</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsPresetModalOpen(true)}
                  className="text-xs flex items-center gap-1.5 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  icon={<Sparkles size={13} className="text-amber-500" />}
                >
                  Add from Preset
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddMedicine}
                  className="text-xs flex items-center gap-1.5 border-slate-200 dark:border-slate-700"
                  icon={<Plus size={14} />}
                >
                  Add Blank Row
                </Button>
              </div>
            </div>

            {/* Inline Quick Preset Pills Ribbon (No horizontal scrollbar, wraps neatly) */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1 mr-1">
                <Sparkles size={11} className="text-amber-500" /> Click preset to add:
              </span>
              {CLINICAL_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => addPresetMedicines(tmpl)}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                  title={`Add all medicines from ${tmpl.title} without overwriting existing medicines`}
                >
                  <Plus size={10} className="text-amber-500" />
                  {tmpl.title}
                </button>
              ))}
            </div>

            {/* Medicine Rows */}
            <div className="space-y-4">
              {medicines.map((row, index) => (
                <div 
                  key={index}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 relative space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    
                    {/* Medicine Name with Autocomplete */}
                    <div className="sm:col-span-6 relative">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Medicine Name
                      </label>
                      <input
                        type="text"
                        value={row.name}
                        onChange={e => {
                          handleUpdateMedicine(index, 'name', e.target.value);
                          setSearchTerm(e.target.value);
                          setActiveSearchIndex(index);
                        }}
                        onFocus={() => {
                          setSearchTerm(row.name);
                          setActiveSearchIndex(index);
                        }}
                        placeholder="Search e.g. Paracetamol, Azithromycin..."
                        className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />

                      {/* Dropdown Suggestions */}
                      {activeSearchIndex === index && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto">
                          {filteredAutocomplete.map((item, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectAutocomplete(index, item)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/40 last:border-0"
                            >
                              <span className="font-semibold">{item.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {item.defaultDosage} • {item.defaultTiming}
                              </span>
                            </button>
                          ))}
                          <div className="p-1.5 bg-slate-50 dark:bg-slate-900 text-right">
                            <button
                              type="button"
                              onClick={() => setActiveSearchIndex(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 px-2"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dosage Frequency */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Frequency
                      </label>
                      <select
                        value={row.dosage}
                        onChange={e => handleUpdateMedicine(index, 'dosage', e.target.value)}
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="1+0+1">1+0+1 (Morning & Night)</option>
                        <option value="1+1+1">1+1+1 (3 times daily)</option>
                        <option value="1+0+0">1+0+0 (Morning only)</option>
                        <option value="0+0+1">0+0+1 (Night only)</option>
                        <option value="0+1+0">0+1+0 (Noon only)</option>
                        <option value="1+1+1+1">1+1+1+1 (4 times daily)</option>
                        <option value="SOS">SOS (As needed)</option>
                      </select>
                    </div>

                    {/* Meal Timing */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Meal Timing
                      </label>
                      <select
                        value={row.timing}
                        onChange={e => handleUpdateMedicine(index, 'timing', e.target.value)}
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="After Meal">After Meal</option>
                        <option value="Before Meal">Before Meal</option>
                        <option value="With Food">With Food</option>
                        <option value="Empty Stomach">Empty Stomach</option>
                      </select>
                    </div>
                  </div>

                  {/* Duration, Specific Instructions, and Delete */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Duration
                      </label>
                      <select
                        value={row.duration}
                        onChange={e => handleUpdateMedicine(index, 'duration', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="3 Days">3 Days</option>
                        <option value="5 Days">5 Days</option>
                        <option value="7 Days">7 Days</option>
                        <option value="10 Days">10 Days</option>
                        <option value="14 Days">14 Days</option>
                        <option value="1 Month">1 Month</option>
                        <option value="Continue">Continue / Long-term</option>
                      </select>
                    </div>

                    <div className="sm:col-span-7">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Special Instructions
                      </label>
                      <input
                        type="text"
                        value={row.instructions}
                        onChange={e => handleUpdateMedicine(index, 'instructions', e.target.value)}
                        placeholder="e.g. Take with plenty of warm water"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end pt-5">
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Remove Medicine"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Advice & Follow-up Notes */}
          <Card className="p-5 border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" />
              General Advice, Dietary Guidance & Notes
            </h3>

            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={e => setClinicalNotes(e.target.value)}
              placeholder="e.g. Adequate oral hydration, salt restriction, rest for 3 days. Return to clinic if high fever persists after 48 hours."
              className="w-full px-4 py-3 text-xs leading-relaxed rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={waitingForLab}
                onClick={handleWaitForLab}
                className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <Clock size={16} className="mr-1.5" />
                Wait for Lab
              </Button>
              <Button
                type="button"
                disabled={submittingRx}
                onClick={handleCompleteConsultation}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                <CheckCircle2 size={16} className="mr-1.5" />
                {submittingRx ? 'Saving Prescription...' : 'Finalize & Sign Off'}
              </Button>
            </div>
          </Card>

        </div>
      </div>

      {/* Clinical Presets & Medicine Explorer Modal */}
      <Modal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        title="Clinical Presets & Medication Packages"
        description="Select any preset to add all its medicines at once, or click individual medicines to add them directly into your prescription without overwriting existing entries."
        size="xl"
      >
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={presetSearch}
                onChange={e => setPresetSearch(e.target.value)}
                placeholder="Search presets by condition, diagnosis, or medicine name..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {presetSearch && (
                <button
                  type="button"
                  onClick={() => setPresetSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {['All', 'Infection', 'Gastrointestinal', 'Cardiovascular', 'Endocrine', 'Respiratory', 'Urology', 'Neurology', 'Dermatology & ENT', 'Orthopedics'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedPresetCategory(cat)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                    selectedPresetCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Presets List */}
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
            {filteredPresets.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Pill size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No presets matched your search</p>
                <p className="text-xs text-slate-400">Try searching for fever, diabetes, pain, cough, or pressure.</p>
              </div>
            ) : (
              filteredPresets.map(preset => (
                <div
                  key={preset.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Preset Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {preset.title}
                        </h4>
                        <Badge variant="primary" size="sm">
                          {preset.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Diagnosis:</span> {preset.diagnosis}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => addPresetMedicines(preset)}
                      className="text-xs bg-amber-600 hover:bg-amber-700 font-semibold shadow-sm shrink-0"
                      icon={<Plus size={14} />}
                    >
                      Add All ({preset.medicines.length}) to Rx
                    </Button>
                  </div>

                  {/* Medicines Itemized Grid */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Medicines in this preset (Click any to add individually):
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {preset.medicines.map((med, mIdx) => {
                        const isAdded = medicines.some(
                          m => m.name.trim().toLowerCase() === med.name.trim().toLowerCase()
                        );

                        return (
                          <div
                            key={mIdx}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                              isAdded
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                  {med.name}
                                </span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {med.dosage}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {med.timing} • {med.duration} {med.instructions ? `• ${med.instructions}` : ''}
                              </p>
                            </div>

                            {isAdded ? (
                              <span className="shrink-0 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                                <Check size={12} strokeWidth={3} /> Added
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addMedicineToPrescription(med)}
                                className="shrink-0 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                                title={`Add only ${med.name} to prescription`}
                              >
                                <Plus size={12} /> Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes snippet */}
                  {preset.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white/70 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                      <span className="font-semibold not-italic text-slate-600 dark:text-slate-300">Clinical Advice: </span>
                      {preset.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {medicines.filter(m => m.name.trim()).length} medication(s) currently in prescription
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPresetModalOpen(false)}
            >
              Done & Return to Prescription
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
