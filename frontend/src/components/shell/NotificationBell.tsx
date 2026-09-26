'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bell, Check, Clock, CheckCheck, Trash2, 
  Calendar, TestTubes, CreditCard, Activity, Volume2, VolumeX 
} from 'lucide-react';
import { getSocket } from '@/lib/socket';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'lab' | 'payment';
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'init-1',
      title: 'MediCore Platform Ready',
      message: 'Secure real-time healthcare connection established.',
      timestamp: 'Just now',
      read: false,
      type: 'info',
    },
  ]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Gentle notification sound using Web Audio API
  const playNotificationChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // AudioContext autoplay restrictions handled safely
    }
  }, [soundEnabled]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to realtime socket events for queue & appointment updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleQueue = (data: any) => {
      playNotificationChime();
      setNotifications((prev) => [
        {
          id: String(Date.now()),
          title: 'Queue Call Update',
          message: data.type === 'called' 
            ? `Doctor has called Token #${data.queueNumber} to consultation room!`
            : `Doctor queue status updated: ${data.status || 'Active'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          type: 'warning',
        },
        ...prev,
      ]);
    };

    const handleApt = (data: any) => {
      playNotificationChime();
      setNotifications((prev) => [
        {
          id: String(Date.now()),
          title: 'Appointment Status Changed',
          message: `Appointment #${data.appointmentId || ''} status is now "${data.status}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          type: data.status === 'Completed' ? 'success' : 'info',
        },
        ...prev,
      ]);
    };

    socket.on('queue:updated', handleQueue);
    socket.on('appointment:status_updated', handleApt);

    return () => {
      socket.off('queue:updated', handleQueue);
      socket.off('appointment:status_updated', handleApt);
    };
  }, [playNotificationChime]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markItemRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getIconForType = (type?: string) => {
    switch (type) {
      case 'warning':
        return <Activity size={14} className="text-amber-500 shrink-0" />;
      case 'success':
        return <Check size={14} className="text-emerald-500 shrink-0" />;
      case 'lab':
        return <TestTubes size={14} className="text-cyan-500 shrink-0" />;
      case 'payment':
        return <CreditCard size={14} className="text-purple-500 shrink-0" />;
      default:
        return <Calendar size={14} className="text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 animate-modal-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Live Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} className="text-slate-300" />}
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-0.5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-1.5">
                <Bell size={20} className="text-slate-300 dark:text-slate-700" />
                <span>No notifications at this time</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markItemRead(n.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-transparent border-slate-100 dark:border-slate-800/60 opacity-60'
                      : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getIconForType(n.type)}
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0">
                      <Clock size={10} /> {n.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed pl-5">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
