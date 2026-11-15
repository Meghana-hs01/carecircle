import React, { useState, useEffect } from 'react';
import { Activity, Plus, Clock, User, HeartPulse, Utensils, Footprints, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { careActivityService } from '../services/api';
import { CareActivity } from '../types';

export const CareActivitiesPage: React.FC = () => {
  const { currentProfile } = useProfile();
  const [activities, setActivities] = useState<CareActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // New Activity Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activityType, setActivityType] = useState('VITALS');
  const [title, setTitle] = useState('Morning Blood Pressure Check');
  const [description, setDescription] = useState('');
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('72');
  const [glucose, setGlucose] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    if (!currentProfile) return;
    setLoading(true);
    try {
      const data = await careActivityService.listActivities(currentProfile.id);
      setActivities(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [currentProfile]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    setSubmitting(true);
    setError(null);

    const metrics: Record<string, any> = {};
    if (activityType === 'VITALS') {
      if (systolic && diastolic) {
        metrics.systolic = Number(systolic);
        metrics.diastolic = Number(diastolic);
      }
      if (pulse) metrics.pulse = Number(pulse);
      if (glucose) metrics.glucose = Number(glucose);
      metrics.unit = 'mmHg';
    } else if (activityType === 'MOBILITY' && duration) {
      metrics.duration_minutes = Number(duration);
    }

    try {
      await careActivityService.logActivity(currentProfile.id, {
        activity_type: activityType,
        title,
        description: description || undefined,
        metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      await fetchActivities();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to record care activity.');
    } finally {
      setSubmitting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'VITALS':
        return HeartPulse;
      case 'MEAL':
        return Utensils;
      case 'MOBILITY':
        return Footprints;
      default:
        return Activity;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-7 h-7 text-emerald-600" />
            <span>Daily Care Activities & Vitals</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Clinical vitals, meals, mobility checks, and physical therapy for {currentProfile?.full_name}.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Care Activity</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500 mt-2">Loading care activities...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <Activity className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-900 mt-2">No Care Activities Logged Yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Record blood pressure checks, blood glucose tests, meal assistance, or mobility walks.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Log First Activity</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((act) => {
            const Icon = getActivityIcon(act.activity_type);
            const dt = new Date(act.activity_time);

            return (
              <div
                key={act.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{act.title}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                        {act.activity_type}
                      </span>
                    </div>

                    {act.metrics && (
                      <div className="mt-1.5 flex items-center gap-3 text-xs font-bold text-emerald-800 flex-wrap">
                        {act.metrics.systolic && act.metrics.diastolic && (
                          <span className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            BP: {act.metrics.systolic}/{act.metrics.diastolic} mmHg
                          </span>
                        )}
                        {act.metrics.glucose && (
                          <span className="bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 text-sky-800">
                            Glucose: {act.metrics.glucose} mg/dL
                          </span>
                        )}
                        {act.metrics.pulse && (
                          <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-800">
                            Pulse: {act.metrics.pulse} bpm
                          </span>
                        )}
                        {act.metrics.duration_minutes && (
                          <span className="bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-800">
                            Duration: {act.metrics.duration_minutes} mins
                          </span>
                        )}
                      </div>
                    )}

                    {act.description && (
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{act.description}</p>
                    )}

                    <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{dt.toLocaleDateString()} at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>Recorded by: <strong className="text-slate-600">{act.recorded_by_name}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Log Daily Care Activity
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="my-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Activity Category</label>
                <select
                  value={activityType}
                  onChange={(e) => {
                    setActivityType(e.target.value);
                    if (e.target.value === 'VITALS') setTitle('Blood Pressure & Pulse Check');
                    else if (e.target.value === 'MEAL') setTitle('Meal & Hydration Check');
                    else if (e.target.value === 'MOBILITY') setTitle('Afternoon Walk');
                    else setTitle('General Observation');
                  }}
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="VITALS">Vitals (BP, Glucose, Pulse)</option>
                  <option value="MEAL">Meal & Hydration</option>
                  <option value="MOBILITY">Mobility & Therapy Walk</option>
                  <option value="HYGIENE">Personal Care & Hygiene</option>
                  <option value="OTHER">General Clinical Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {activityType === 'VITALS' && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Systolic BP</label>
                      <input
                        type="number"
                        value={systolic}
                        onChange={(e) => setSystolic(e.target.value)}
                        className="w-full text-sm p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Diastolic BP</label>
                      <input
                        type="number"
                        value={diastolic}
                        onChange={(e) => setDiastolic(e.target.value)}
                        className="w-full text-sm p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Pulse (bpm)</label>
                      <input
                        type="number"
                        value={pulse}
                        onChange={(e) => setPulse(e.target.value)}
                        className="w-full text-sm p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Glucose (mg/dL)</label>
                      <input
                        type="number"
                        value={glucose}
                        onChange={(e) => setGlucose(e.target.value)}
                        placeholder="e.g. 95"
                        className="w-full text-sm p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activityType === 'MOBILITY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full text-sm p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observations / Details</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Patient in good spirits. Rested 5 mins before vitals check."
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
