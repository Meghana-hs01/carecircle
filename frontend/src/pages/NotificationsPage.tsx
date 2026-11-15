import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Mail,
  AlertTriangle,
  Clock,
  Settings,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play
} from 'lucide-react';
import { notificationService, schedulerService } from '../services/api';
import { NotificationItem, NotificationPreference } from '../types';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPref, setSavingPref] = useState(false);
  const [triggeringJob, setTriggeringJob] = useState(false);
  const [jobResult, setJobResult] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notifs, prefs] = await Promise.all([
        notificationService.listNotifications(50),
        notificationService.getPreferences(),
      ]);
      setNotifications(notifs);
      setPreferences(prefs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrefChange = async (updated: Partial<NotificationPreference>) => {
    if (!preferences) return;
    setSavingPref(true);
    try {
      const saved = await notificationService.updatePreferences(updated);
      setPreferences(saved);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPref(false);
    }
  };

  const handleTriggerEscalationJob = async () => {
    setTriggeringJob(true);
    setJobResult(null);
    try {
      const res = await schedulerService.triggerReminders();
      setJobResult(`Job executed: ${res.details.escalated_doses} escalated, ${res.details.emails_dispatched} emails processed.`);
      await loadNotifications();
    } catch (e: any) {
      setJobResult(`Error running job: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setTriggeringJob(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-7 h-7 text-teal-600" />
            <span>Notification & Alert Centre</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time healthcare updates, missed-dose escalation alerts, and delivery audit logs.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Cloud Scheduler / Escalation Simulation Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Automated Escalation & Cloud Scheduler Job
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Endpoint <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono">/api/internal/jobs/process-reminders</code> triggered by Cloud Scheduler.
            </p>
          </div>
          <button
            onClick={handleTriggerEscalationJob}
            disabled={triggeringJob}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{triggeringJob ? 'Processing...' : 'Run Escalation Check Now'}</span>
          </button>
        </div>
        {jobResult && (
          <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 font-medium">
            {jobResult}
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      {preferences && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-slate-500" />
            Escalation Rules & Preferences
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email_notifications_enabled}
                onChange={(e) => handlePrefChange({ email_notifications_enabled: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Enable SMTP Email Alerts</span>
            </label>

            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.missed_dose_alerts}
                onChange={(e) => handlePrefChange({ missed_dose_alerts: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Missed-Dose Alerts</span>
            </label>

            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.appointment_reminders}
                onChange={(e) => handlePrefChange({ appointment_reminders: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Appointment Reminders</span>
            </label>

            <div className="flex items-center gap-2">
              <label htmlFor="pref-grace" className="text-slate-600 font-bold whitespace-nowrap">Grace Period:</label>
              <select
                id="pref-grace"
                value={preferences.grace_period_minutes}
                onChange={(e) => handlePrefChange({ grace_period_minutes: Number(e.target.value) })}
                className="p-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-bold text-slate-800"
              >
                <option value={15}>15 mins</option>
                <option value={30}>30 mins (Default)</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-500 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl text-xs text-slate-500">
            No notifications yet. Alerts and reminders will appear here in real time.
          </div>
        ) : (
          notifications.map((n) => {
            const isMissed = n.type === 'MISSED_DOSE_ALERT';
            const isRead = n.is_read;

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 rounded-2xl border transition shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !isRead ? 'bg-teal-50/40 border-teal-200' : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isMissed ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {n.type.replace(/_/g, ' ')}
                    </span>
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-teal-600" title="Unread"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                    <span>{new Date(n.created_at).toLocaleString()}</span>

                    {/* Email delivery status badge */}
                    <span className="flex items-center gap-1 font-medium">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Email Delivery:{' '}
                      {n.email_delivery_status === 'DELIVERED' && (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Delivered
                        </span>
                      )}
                      {n.email_delivery_status === 'SKIPPED_NO_CREDENTIALS' && (
                        <span className="text-slate-500 font-medium italic">
                          Skipped (SMTP credentials not set in .env)
                        </span>
                      )}
                      {n.email_delivery_status === 'FAILED' && (
                        <span className="text-rose-600 font-bold flex items-center gap-0.5">
                          <XCircle className="w-3 h-3 text-rose-600" /> Failed
                        </span>
                      )}
                      {n.email_delivery_status === 'PENDING' && (
                        <span className="text-amber-600 font-medium">Pending</span>
                      )}
                    </span>
                  </div>
                </div>

                {!isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:bg-teal-100/60 px-3 py-1.5 rounded-xl border border-teal-200 transition"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
