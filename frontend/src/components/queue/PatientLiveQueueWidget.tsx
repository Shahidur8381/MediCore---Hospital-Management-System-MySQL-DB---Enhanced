'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getSocket, subscribeToQueue, unsubscribeFromQueue } from '@/lib/socket';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Clock, Users, Wifi, WifiOff, RefreshCw, AlertCircle,
  CheckCircle2, Stethoscope, Sparkles
} from 'lucide-react';

interface PatientLiveQueueWidgetProps {
  appointment: {
    APPOINTMENT_ID: number;
    QUEUE_NUMBER: number;
    DOCTOR_ID: number;
    DOCTOR_NAME: string;
    DEPARTMENT_NAME?: string;
    STATUS: string;
    APPOINTMENT_DATE: string;
  };
  onStatusChange?: (newStatus: string) => void;
}

export function PatientLiveQueueWidget({ appointment, onStatusChange }: PatientLiveQueueWidgetProps) {
  const [nowServing, setNowServing] = useState<number>(() => {
    // If appointment is confirmed/in consultation, nowServing is close to queue number
    if (appointment.STATUS === 'In Consultation') return appointment.QUEUE_NUMBER;
    if (appointment.STATUS === 'Completed') return appointment.QUEUE_NUMBER;
    return Math.max(1, appointment.QUEUE_NUMBER - 2);
  });
  const [status, setStatus] = useState<string>(appointment.STATUS);
  const [connected, setConnected] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('Live');

  const myToken = appointment.QUEUE_NUMBER;
  const tokensAhead = Math.max(0, myToken - nowServing);
  const estimatedWaitMins = tokensAhead * 15;

  const handleQueueUpdate = useCallback((data: any) => {
    setLastUpdated(new Date().toLocaleTimeString());
    if (data.status) {
      setStatus(data.status);
      if (onStatusChange) onStatusChange(data.status);
    }
    if (data.nowServing !== undefined) {
      setNowServing(Number(data.nowServing));
    } else if (data.status === 'Confirmed') {
      setNowServing((prev) => Math.min(prev + 1, myToken));
    } else if (data.status === 'Completed') {
      setNowServing((prev) => Math.min(prev + 1, myToken));
    }
  }, [myToken, onStatusChange]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const timer = setTimeout(() => {
        setConnected(socket.connected);
      }, 0);

      const onConnect = () => setConnected(true);
      const onDisconnect = () => setConnected(false);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      subscribeToQueue(appointment.DOCTOR_ID, handleQueueUpdate);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        unsubscribeFromQueue(appointment.DOCTOR_ID, handleQueueUpdate);
      };
    }
  }, [appointment.DOCTOR_ID, handleQueueUpdate]);

  const isMyTurn = status === 'Confirmed' && nowServing === myToken;
  const isCompleted = status === 'Completed';

  // Calculate progress percentage
  const totalTokens = Math.max(myToken, nowServing);
  const progressPercent = totalTokens > 0 ? Math.min(100, Math.round((nowServing / totalTokens) * 100)) : 50;

  return (
    <Card className="overflow-hidden border-blue-200/80 dark:border-blue-900/60 shadow-md bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900">
      <CardContent className="p-5 md:p-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Stethoscope size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Dr. {appointment.DOCTOR_NAME}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {appointment.DEPARTMENT_NAME || 'Consultation Clinic'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {connected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <Wifi size={11} /> Realtime Connected
                </>
              ) : (
                <>
                  <WifiOff size={11} /> Reconnecting...
                </>
              )}
            </span>
            <Badge
              variant={
                status === 'Completed'
                  ? 'success'
                  : status === 'Confirmed'
                  ? 'primary'
                  : 'warning'
              }
              size="sm"
            >
              {status}
            </Badge>
          </div>
        </div>

        {/* Banner Alert if it's the patient's turn */}
        {isMyTurn && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <Sparkles size={24} className="text-yellow-300 shrink-0" />
              <div>
                <p className="font-bold text-sm">It&apos;s Your Turn! Please proceed to Consultation Room.</p>
                <p className="text-xs text-blue-100 mt-0.5">Your token #{myToken} is currently being called.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tokens Display Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 text-center">
          {/* Now Serving */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
              Now Serving
            </p>
            <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">
              #{nowServing}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-1">
              <Users size={11} /> In Consultation
            </p>
          </div>

          {/* Your Token */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-blue-500/40 dark:border-blue-500/40 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
              YOU
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              Your Token
            </p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
              #{myToken}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Appointment #{appointment.APPOINTMENT_ID}
            </p>
          </div>

          {/* Estimated Wait */}
          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
              Est. Wait Time
            </p>
            <p className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-200">
              {isCompleted ? '0m' : tokensAhead === 0 ? '< 5m' : `~${estimatedWaitMins}m`}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-1">
              <Clock size={11} /> {tokensAhead} patients ahead
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Queue Progress</span>
            <span>{isCompleted ? 'Completed' : `${progressPercent}%`}</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer info & Refresh */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Last sync: {lastUpdated}</span>
          <span className="flex items-center gap-1">
            <RefreshCw size={11} className="animate-spin text-blue-500" style={{ animationDuration: '4s' }} /> Auto-syncing
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
