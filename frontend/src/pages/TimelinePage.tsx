import React, { useState, useEffect } from 'react';
import {
  Clock,
  Pill,
  Calendar,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { timelineService } from '../services/api';
import { TimelineEvent } from '../types';

export const TimelinePage: React.FC = () => {
  const { currentProfile } = useProfile();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysSpan, setDaysSpan] = useState(7);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchTimeline = async () => {
    if (!currentProfile) return;
    setLoading(true);
    try {
      const data = await timelineService.getTimeline(currentProfile.id, daysSpan, daysSpan);
      setEvents(data);
    } catch (e) {
      console.error('Failed to load timeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [currentProfile, daysSpan]);

  const filteredEvents = events.filter((e) => {
    if (categoryFilter === 'ALL') return true;
    return e.category === categoryFilter;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MEDICATION_DOSE':
        return Pill;
      case 'APPOINTMENT':
        return Calendar;
      case 'CARE_ACTIVITY':
        return Activity;
      default:
        return FileText;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-teal-600" />
            <span>Daily Care Activity Timeline</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chronological log of medications, vitals, clinic visits, and care updates for {currentProfile?.full_name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={daysSpan}
            onChange={(e) => setDaysSpan(Number(e.target.value))}
            className="text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value={3}>Last 3 Days</option>
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap border-b border-slate-200 pb-2">
        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        {[
          { label: 'All Activities', value: 'ALL' },
          { label: 'Medications', value: 'MEDICATION_DOSE' },
          { label: 'Doctor Visits', value: 'APPOINTMENT' },
          { label: 'Vitals & Care', value: 'CARE_ACTIVITY' },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setCategoryFilter(btn.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              categoryFilter === btn.value
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500 mt-2">Loading timeline...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl text-xs text-slate-500">
          No care activity recorded within this time window.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6">
          {filteredEvents.map((evt) => {
            const Icon = getCategoryIcon(evt.category);
            const dt = new Date(evt.timestamp);
            const formattedDate = dt.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const formattedTime = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const badgeColorMap: Record<string, string> = {
              green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              amber: 'bg-amber-100 text-amber-800 border-amber-200',
              red: 'bg-rose-100 text-rose-800 border-rose-200',
              blue: 'bg-sky-100 text-sky-800 border-sky-200',
              gray: 'bg-slate-100 text-slate-700 border-slate-200',
              teal: 'bg-teal-100 text-teal-800 border-teal-200',
            };

            const iconBgMap: Record<string, string> = {
              green: 'bg-emerald-600 text-white',
              amber: 'bg-amber-500 text-white',
              red: 'bg-rose-600 text-white',
              blue: 'bg-sky-600 text-white',
              gray: 'bg-slate-400 text-white',
              teal: 'bg-teal-600 text-white',
            };

            return (
              <div key={evt.id} className="relative group">
                {/* Node icon on vertical line */}
                <div
                  className={`absolute -left-[35px] sm:-left-[43px] top-1 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border-2 border-white ${
                    iconBgMap[evt.status_color] || 'bg-teal-600 text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Event Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm group-hover:border-teal-300 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h3 className="text-base font-bold text-slate-900">{evt.title}</h3>
                    <div className="flex items-center gap-2">
                      {evt.status && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            badgeColorMap[evt.status_color] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {evt.status}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-400">
                        {formattedDate} • {formattedTime}
                      </span>
                    </div>
                  </div>

                  {evt.subtitle && <p className="text-xs text-slate-600 mt-1">{evt.subtitle}</p>}

                  {/* Custom Metrics (for Care Activities) */}
                  {evt.details?.metrics && (
                    <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800 flex items-center gap-3 font-semibold">
                      {evt.details.metrics.systolic && evt.details.metrics.diastolic && (
                        <span className="text-teal-800">
                          Blood Pressure: {evt.details.metrics.systolic}/{evt.details.metrics.diastolic} mmHg
                        </span>
                      )}
                      {evt.details.metrics.glucose && (
                        <span className="text-sky-800">Glucose: {evt.details.metrics.glucose} mg/dL</span>
                      )}
                      {evt.details.metrics.pulse && (
                        <span className="text-rose-800">Pulse: {evt.details.metrics.pulse} bpm</span>
                      )}
                    </div>
                  )}

                  {/* Recorded By attribution */}
                  {evt.recorded_by && (
                    <p className="mt-2 text-[11px] font-medium text-slate-400">
                      Confirmed by: <span className="text-slate-600 font-semibold">{evt.recorded_by}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
