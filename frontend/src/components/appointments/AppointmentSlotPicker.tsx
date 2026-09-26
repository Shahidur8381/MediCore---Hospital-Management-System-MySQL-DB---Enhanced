'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, 
  User, RefreshCw, ChevronRight, ShieldCheck, Sparkles 
} from 'lucide-react';
import api from '@/lib/api';
import { Badge, Button, Card } from '@/components/ui';
import { useToast } from '@/components/Toast';

export interface Slot {
  token: number;
  time: string;
  session: string;
  status: 'available' | 'booked' | 'unavailable';
}

interface Doctor {
  DOCTOR_ID: number;
  NAME: string;
  SPECIALIZATION?: string;
  DEPARTMENT_ID?: number;
  DEPARTMENT_NAME?: string;
  CONSULTATION_FEE: string | number;
}

interface Department {
  DEPARTMENT_ID: number;
  DEPARTMENT_NAME: string;
}

interface AppointmentSlotPickerProps {
  doctors: Doctor[];
  departments: Department[];
  onBookingSuccess: (appointmentId: number, queueNumber: number) => void;
  onCancel: () => void;
}

export function AppointmentSlotPicker({
  doctors,
  departments,
  onBookingSuccess,
  onCancel,
}: AppointmentSlotPickerProps) {
  const { toast } = useToast();

  // Wizard Steps: 1: Doctor -> 2: Date & Slots -> 3: Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selections
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  
  // Default to tomorrow's date or today
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Availability State
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [alreadyBookedByYou, setAlreadyBookedByYou] = useState<boolean>(false);
  const [totalBooked, setTotalBooked] = useState<number>(0);

  // Submission State
  const [booking, setBooking] = useState<boolean>(false);

  // Selected doctor object
  const selectedDoctor = doctors.find(d => d.DOCTOR_ID === selectedDoctorId);

  // Generate next 5 days for quick date selection
  const quickDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  // Fetch real-time availability from backend
  const fetchAvailability = useCallback(async (docId: number, dateStr: string) => {
    try {
      setLoadingSlots(true);
      const res = await api.get(`/api/appointments/availability?doctorId=${docId}&date=${dateStr}`);
      setSlots(res.data.slots || []);
      setAlreadyBookedByYou(!!res.data.alreadyBookedByYou);
      setTotalBooked(res.data.totalBooked || 0);
      setSelectedSlot(null); // Reset choice on date/doc change
    } catch (err: any) {
      toast('Failed to load doctor slot availability', 'error');
    } finally {
      setLoadingSlots(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      fetchAvailability(selectedDoctorId, selectedDate);
    }
  }, [selectedDoctorId, selectedDate, fetchAvailability]);

  // Handle final booking submission with race-condition guard
  const handleConfirmBooking = async () => {
    if (!selectedDoctorId || !selectedDate) {
      toast('Please select a doctor and date', 'error');
      return;
    }

    try {
      setBooking(true);
      const res = await api.post('/api/appointments', {
        Doctor_ID: selectedDoctorId,
        Appointment_Date: selectedDate
      });

      const { appointmentId, queueNumber } = res.data;
      toast(`Appointment reserved! Token Queue #${queueNumber}`, 'success');
      onBookingSuccess(appointmentId, queueNumber);
    } catch (err: any) {
      // Race condition or duplicate booking caught by backend
      const errMsg = err.response?.data?.message || 'Failed to book slot';
      toast(errMsg, 'error');

      // Gracefully refresh availability to reflect live state
      if (selectedDoctorId) {
        fetchAvailability(selectedDoctorId, selectedDate);
      }
      setStep(2); // return to slot picker
    } finally {
      setBooking(false);
    }
  };

  const filteredDoctors = doctors.filter(
    d => !selectedDept || d.DEPARTMENT_ID === parseInt(selectedDept)
  );

  return (
    <div className="space-y-6">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>1</span>
          <span className={step === 1 ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-500'}>
            Doctor
          </span>

          <ChevronRight size={14} className="text-slate-300 dark:text-slate-700" />

          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>2</span>
          <span className={step === 2 ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-500'}>
            Date & Slots
          </span>

          <ChevronRight size={14} className="text-slate-300 dark:text-slate-700" />

          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>3</span>
          <span className={step === 3 ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-500'}>
            Confirm
          </span>
        </div>

        {selectedDoctor && (
          <div className="text-xs text-right">
            <span className="text-slate-400 block">Fee</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">৳{selectedDoctor.CONSULTATION_FEE}</span>
          </div>
        )}
      </div>

      {/* STEP 1: Select Specialist & Department */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Filter by Clinical Department
            </label>
            <select
              value={selectedDept}
              onChange={e => {
                setSelectedDept(e.target.value);
                setSelectedDoctorId(null);
              }}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Clinical Departments</option>
              {departments.map(dept => (
                <option key={dept.DEPARTMENT_ID} value={dept.DEPARTMENT_ID}>
                  {dept.DEPARTMENT_NAME}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Select Specialist Doctor
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredDoctors.map(doc => {
                const isSelected = selectedDoctorId === doc.DOCTOR_ID;
                return (
                  <button
                    key={doc.DOCTOR_ID}
                    type="button"
                    onClick={() => setSelectedDoctorId(doc.DOCTOR_ID)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                      <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        Dr. {doc.NAME}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {doc.SPECIALIZATION || 'General Physician'}
                      </div>
                      <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                        ৳{doc.CONSULTATION_FEE}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="md" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              disabled={!selectedDoctorId}
              onClick={() => setStep(2)}
            >
              Continue to Slots
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Visual Date & Slot Availability */}
      {step === 2 && selectedDoctor && (
        <div className="space-y-5">
          {/* Doctor Header Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                Dr
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                  Dr. {selectedDoctor.NAME}
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedDoctor.SPECIALIZATION} • ৳{selectedDoctor.CONSULTATION_FEE}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-blue-600 hover:underline"
            >
              Change
            </button>
          </div>

          {/* Quick Date Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Select Consultation Date
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 mb-2">
              {quickDates.map(qd => {
                const isSelected = selectedDate === qd.dateStr;
                return (
                  <button
                    key={qd.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(qd.dateStr)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[11px] font-bold block">{qd.dayName}</span>
                    <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {qd.formatted}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Date Input */}
            <div className="flex items-center gap-2 mt-2">
              <CalendarIcon size={14} className="text-slate-400" />
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
              />
              <button
                type="button"
                onClick={() => fetchAvailability(selectedDoctor.DOCTOR_ID, selectedDate)}
                className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                title="Refresh Availability"
              >
                <RefreshCw size={13} className={loadingSlots ? 'animate-spin text-blue-500' : ''} />
              </button>
            </div>
          </div>

          {/* Already Booked Warning */}
          {alreadyBookedByYou && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-amber-600" />
              <span>
                <strong>Notice:</strong> You already have a consultation booked with this doctor on {selectedDate}. To book another session, choose a different date.
              </span>
            </div>
          )}

          {/* Slot Grid Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Available Time Slots
              </label>
              <span className="text-[11px] text-slate-400">
                {totalBooked} booked • {slots.filter(s => s.status === 'available').length} open
              </span>
            </div>

            {loadingSlots ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Checking slot availability...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No slots configured for this date.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Morning Slots */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">
                    Morning Sessions
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.filter(s => s.session === 'Morning').map(slot => {
                      const isAvailable = slot.status === 'available';
                      const isSelected = selectedSlot?.token === slot.token;

                      return (
                        <button
                          key={slot.token}
                          type="button"
                          disabled={!isAvailable || alreadyBookedByYou}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500'
                              : isAvailable
                              ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-800 dark:text-slate-200'
                              : 'border-slate-100 dark:border-slate-800/40 bg-slate-100/60 dark:bg-slate-900/30 text-slate-400 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{slot.time}</span>
                            <span className={`text-[10px] font-semibold ${
                              isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                            }`}>
                              {isAvailable ? `Token #${slot.token}` : 'Booked'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Afternoon & Evening Slots */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">
                    Afternoon & Evening Sessions
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.filter(s => s.session !== 'Morning').map(slot => {
                      const isAvailable = slot.status === 'available';
                      const isSelected = selectedSlot?.token === slot.token;

                      return (
                        <button
                          key={slot.token}
                          type="button"
                          disabled={!isAvailable || alreadyBookedByYou}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500'
                              : isAvailable
                              ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-800 dark:text-slate-200'
                              : 'border-slate-100 dark:border-slate-800/40 bg-slate-100/60 dark:bg-slate-900/30 text-slate-400 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{slot.time}</span>
                            <span className={`text-[10px] font-semibold ${
                              isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                            }`}>
                              {isAvailable ? `Token #${slot.token}` : 'Booked'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="md" type="button" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!selectedSlot || alreadyBookedByYou}
              onClick={() => setStep(3)}
            >
              Review Booking
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Confirmation */}
      {step === 3 && selectedDoctor && selectedSlot && (
        <div className="space-y-4">
          <Card className="p-4 border-slate-200 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-950/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-blue-600" />
              Appointment Reservation Summary
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/40">
                <span className="text-slate-500">Specialist:</span>
                <span className="font-bold text-slate-900 dark:text-white">Dr. {selectedDoctor.NAME}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/40">
                <span className="text-slate-500">Specialization:</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{selectedDoctor.SPECIALIZATION || 'General Physician'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/40">
                <span className="text-slate-500">Consultation Date:</span>
                <span className="font-bold text-slate-900 dark:text-white">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/40">
                <span className="text-slate-500">Reserved Time Slot:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{selectedSlot.time} ({selectedSlot.session})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/40">
                <span className="text-slate-500">Queue Token Allocation:</span>
                <span className="font-bold text-emerald-600">Token #{selectedSlot.token}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold">
                <span className="text-slate-800 dark:text-slate-200">Consultation Fee:</span>
                <span className="text-blue-600 dark:text-blue-400">৳{selectedDoctor.CONSULTATION_FEE}</span>
              </div>
            </div>
          </Card>

          <p className="text-[11px] text-slate-500 leading-normal">
            By confirming, your appointment slot and queue token will be reserved in the MediCore live hospital system. You can pay securely online via SSLCommerz Sandbox or directly at the hospital reception.
          </p>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="md" type="button" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={booking}
              onClick={handleConfirmBooking}
              icon={<CheckCircle2 size={16} />}
            >
              Confirm & Book Slot
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
