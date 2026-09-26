'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import {
  Tv, Maximize2, Minimize2, Wifi, WifiOff, Volume2, VolumeX,
  Heart, Users, Clock, Stethoscope, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface QueueItem {
  doctorId: number;
  doctorName: string;
  departmentName: string;
  room: string;
  nowServing: number;
  nextInLine: number;
  waitingCount: number;
  status: string;
}

function QueueDisplayContent() {
  const searchParams = useSearchParams();
  const deptFilter = searchParams.get('dept') || '';

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connected, setConnected] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>(deptFilter);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState<string>('');

  // Clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch departments and doctors to construct initial queues
  const fetchQueueData = useCallback(async () => {
    try {
      setLoading(true);
      const [deptRes, docRes] = await Promise.all([
        api.get('/api/departments').catch(() => ({ data: [] })),
        api.get('/api/doctors').catch(() => ({ data: [] }))
      ]);

      setDepartments(deptRes.data);

      const activeDocs = docRes.data.filter((d: any) => d.STATUS === 'Active');

      const initialQueues: QueueItem[] = activeDocs.map((doc: any, idx: number) => ({
        doctorId: doc.DOCTOR_ID,
        doctorName: doc.NAME,
        departmentName: doc.DEPARTMENT_NAME || 'General Medicine',
        room: `Room ${101 + idx}`,
        nowServing: Math.max(1, (idx * 3) + 1),
        nextInLine: Math.max(2, (idx * 3) + 2),
        waitingCount: 4 + (idx % 3),
        status: 'Active'
      }));

      setQueues(initialQueues);
    } catch (e) {
      console.error('Failed to load queue data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  // Audio chime synthesizer using Web Audio API
  const playChime = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // AudioContext policy suppression
    }
  }, [soundEnabled]);

  // Socket.IO realtime subscription for each doctor
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const handleQueueUpdate = (data: any) => {
      setQueues((prev) =>
        prev.map((q) => {
          if (q.doctorId === Number(data.doctorId)) {
            const nextServing = q.nowServing + 1;
            const updated = {
              ...q,
              nowServing: nextServing,
              nextInLine: nextServing + 1,
              waitingCount: Math.max(0, q.waitingCount - 1),
            };
            // Trigger audio alert
            playChime();
            setLastAnnouncedToken(`Token #${nextServing} for Dr. ${q.doctorName}`);
            return updated;
          }
          return q;
        })
      );
    };

    socket.on('queue:updated', handleQueueUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('queue:updated', handleQueueUpdate);
    };
  }, [playChime]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Filter queues
  const filteredQueues = selectedDept
    ? queues.filter((q) => q.departmentName.toLowerCase().includes(selectedDept.toLowerCase()))
    : queues;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col select-none overflow-x-hidden">
      {/* Top Banner Header */}
      <header className="h-auto sm:h-24 py-3 sm:py-0 px-4 sm:px-6 md:px-12 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden shadow-lg shrink-0 group">
            <img
              src="/images/logo.jpg"
              alt="MediCore Logo"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </Link>
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
              Medi<span className="text-blue-500">Core</span>
              <span className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/30">
                Live Queue Display
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-slate-400 font-medium">Outpatient Consultation Waiting Hall</p>
          </div>
        </div>

        {/* Live Clock & Controls */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-8 ml-auto sm:ml-0">
          {/* Realtime Clock */}
          <div className="text-right">
            <p className="text-lg sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-cyan-400">{currentTime}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:block">{currentDate}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 sm:p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute announcement chime' : 'Enable announcement chime'}
              aria-label="Toggle chime sound"
            >
              {soundEnabled ? <Volume2 size={18} className="text-cyan-400" /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 sm:p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit full screen' : 'Enter full screen TV mode'}
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Sub-bar Filter & Announcements */}
      <div className="px-4 sm:px-6 md:px-12 py-2.5 sm:py-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm shrink-0">
        {/* Department tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 custom-scrollbar max-w-full">
          <span className="text-slate-400 font-semibold mr-1 text-xs shrink-0">Filter:</span>
          <button
            onClick={() => setSelectedDept('')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition-all cursor-pointer text-xs shrink-0 ${
              selectedDept === ''
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Departments
          </button>
          {departments.map((d: any) => (
            <button
              key={d.DEPARTMENT_ID}
              onClick={() => setSelectedDept(d.DEPARTMENT_NAME)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-xs shrink-0 ${
                selectedDept.toLowerCase() === d.DEPARTMENT_NAME.toLowerCase()
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d.DEPARTMENT_NAME}
            </button>
          ))}
        </div>

        {/* Realtime Announcement Banner */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {lastAnnouncedToken && (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 px-2.5 sm:px-3 py-1 rounded-lg animate-pulse text-xs sm:text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Calling: {lastAnnouncedToken}
            </span>
          )}
          <span
            className={`flex items-center gap-1.5 font-semibold px-2 sm:px-2.5 py-1 rounded-lg text-xs ${
              connected
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
            }`}
          >
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{connected ? 'Socket Connected' : 'Reconnecting'}</span>
          </span>
        </div>
      </div>

      {/* Main Display Grid */}
      <main className="flex-1 p-4 sm:p-6 md:p-12 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center py-32">
            <RefreshCw size={48} className="animate-spin text-blue-500 mb-4" />
            <p className="text-lg text-slate-400 font-medium">Connecting to MediCore Realtime Queue Hub...</p>
          </div>
        ) : filteredQueues.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-500 mb-6">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-200 mb-2">No Active Doctor Queues</h3>
            <p className="text-slate-400 max-w-md text-sm">
              {selectedDept
                ? `No consultation sessions currently active for "${selectedDept}".`
                : 'No physicians are actively running queues at this moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {filteredQueues.map((item) => (
              <div
                key={item.doctorId}
                className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl hover:border-blue-500/50 transition-colors"
              >
                {/* Doctor Header */}
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Stethoscope size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                        Dr. {item.doctorName}
                      </h3>
                      <p className="text-xs md:text-sm text-cyan-400 font-bold uppercase tracking-wider mt-0.5">
                        {item.departmentName}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs md:text-sm font-bold border border-slate-700">
                    {item.room}
                  </span>
                </div>

                {/* Token Counters (Huge Typography) */}
                <div className="my-8 grid grid-cols-2 gap-4 text-center">
                  {/* NOW SERVING */}
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-950/80 to-slate-900 border-2 border-blue-500/60 shadow-lg">
                    <p className="text-xs md:text-sm font-black uppercase tracking-widest text-blue-400 mb-2">
                      Now Serving
                    </p>
                    <p className="text-6xl md:text-7xl font-black text-white font-mono tracking-tighter">
                      #{item.nowServing}
                    </p>
                    <p className="text-[11px] text-blue-300/80 font-bold uppercase mt-2 flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      In Consultation
                    </p>
                  </div>

                  {/* NEXT IN LINE */}
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                    <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 mb-2">
                      Next in Line
                    </p>
                    <p className="text-6xl md:text-7xl font-black text-slate-300 font-mono tracking-tighter">
                      #{item.nextInLine}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium uppercase mt-2">
                      Prepare Entry
                    </p>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} className="text-slate-500" /> Waiting: {item.waitingCount} patients
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Clock size={14} /> Est. ~15m / patient
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Ticker Footer */}
      <footer className="h-12 px-6 md:px-12 bg-blue-950 border-t border-blue-900 text-blue-200 text-xs md:text-sm font-semibold flex items-center justify-between shrink-0">
        <span className="truncate flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span>MediCore Smart Queue: Please be seated in the waiting hall until your token is called on the screen.</span>
        </span>
        <span className="hidden md:block shrink-0 text-blue-300">Emergency Triage: Contact Reception Desk</span>
      </footer>
    </div>
  );
}

export default function QueueDisplayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-lg text-slate-400">Loading Queue Display...</p>
      </div>
    }>
      <QueueDisplayContent />
    </Suspense>
  );
}
