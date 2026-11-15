import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Pill,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  PlusCircle,
  FileText,
  Calendar,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { medicationService, careActivityService, appointmentService } from '../services/api';
import { MedicationDose, CareActivity, Appointment } from '../types';
import { DoseActionModal } from '../components/DoseActionModal';

export const CaretakerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentProfile, profiles } = useProfile();

  const [doses, setDoses] = useState<MedicationDose[]>([]);
  const [activities, setActivities] = useState<CareActivity[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Dose modal
  const [selectedDose, setSelectedDose] = useState<MedicationDose | null>(null);
  const [doseModalOpen, setDoseModalOpen] = useState(false);

  // Vitals modal
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [vitalType, setVitalType] = useState('VITALS');
  const [vitalTitle, setVitalTitle] = useState('Blood Pressure Check');
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('72');
  const [vitalNotes, setVitalNotes] = useState('');
  const [submittingVital, setSubmittingVital] = useState(false);

  const loadData = async () => {
    if (!currentProfile) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [dosesData, actData, apptData] = await Promise.all([
        medicationService.listDoses(currentProfile.id, todayStr, 1),
        careActivityService.listActivities(currentProfile.id),
        appointmentService.listAppointments(currentProfile.id, 'SCHEDULED'),
      ]);
      setDoses(dosesData);
      setActivities(actData);
      setAppointments(apptData);
    } catch (e) {
      console.error('Failed to load caretaker dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentProfile) {
      loadData();
    }
  }, [currentProfile]);

  const handleDoseSubmit = async (doseId: number, status: 'TAKEN' | 'SKIPPED', notes?: string) => {
    await medicationService.recordDose(doseId, status, notes);
    await loadData();
  };

  const handleVitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    setSubmittingVital(true);
    try {
      await careActivityService.logActivity(currentProfile.id, {
        activity_type: vitalType,
        title: vitalTitle,
        description: vitalNotes || 'Routine checkup logged by nurse/caretaker.',
        metrics: {
          systolic: Number(systolic),
          diastolic: Number(diastolic),
          pulse: Number(pulse),
          unit: 'mmHg',
        },
      });
      setVitalsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Failed to log vital:', e);
    } finally {
      setSubmittingVital(false);
    }
  };

  if (!currentProfile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Stethoscope className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Patient Assigned Yet</h2>
        <p className="text-xs text-slate-600">
          Enter the invitation code provided by the elderly patient or family administrator to link their profile.
        </p>
        <Link
          to="/accept-invitation"
          className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl"
        >
          Enter Invitation Code
        </Link>
      </div>
    );
  }

  const pendingDoses = doses.filter((d) => d.status === 'UPCOMING' || d.status === 'MISSED');

  return (
    <div className="space-y-6">
      {/* Caretaker Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block mb-1">
            Clinical Caregiver Station
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Patient: {currentProfile.full_name}
          </h1>
          <p className="text-sm text-emerald-100 mt-1">
            Logged in as {user?.full_name} • Authorised Caretaker with medication administration rights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setVitalsModalOpen(true)}
            className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-emerald-700" />
            <span>Record Vitals & Care</span>
          </button>
        </div>
      </div>

      {/* Clinical Alert Banner for Missed Doses */}
      {doses.some((d) => d.status === 'MISSED') && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 animate-bounce" />
          <div className="text-xs text-rose-900">
            <span className="font-bold block text-sm">Escalation Notice: Unconfirmed Scheduled Doses</span>
            One or more prescribed doses passed their scheduled grace period without confirmation. Please verify patient intake and resolve the dose record.
          </div>
        </div>
      )}

      {/* Main Caretaker Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Doses for Administration */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              <span>Today's Prescribed Administrations</span>
            </h2>
            <span className="text-xs font-bold text-slate-500">
              {pendingDoses.length} pending / unconfirmed
            </span>
          </div>

          <div className="space-y-3">
            {doses.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
                No medication doses scheduled for today.
              </div>
            ) : (
              doses.map((dose) => {
                const timeStr = new Date(dose.scheduled_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isTaken = dose.status === 'TAKEN';
                const isMissed = dose.status === 'MISSED';
                const isSkipped = dose.status === 'SKIPPED';

                return (
                  <div
                    key={dose.id}
                    className={`p-4 rounded-2xl border transition shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isTaken
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : isMissed
                        ? 'bg-rose-50 border-rose-300'
                        : isSkipped
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{dose.medication_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {dose.medication_dosage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Scheduled: {timeStr}
                        {dose.medication_instructions && ` • ${dose.medication_instructions}`}
                      </p>
                      {dose.actual_time && (
                        <p className="text-xs text-emerald-700 font-semibold mt-1">
                          Administered at {new Date(dose.actual_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {dose.recorded_by_name ? ` by ${dose.recorded_by_name}` : ''}
                        </p>
                      )}
                      {dose.notes && (
                        <p className="text-xs text-slate-600 bg-white/80 p-1.5 rounded mt-1 border border-slate-200">
                          Note: {dose.notes}
                        </p>
                      )}
                    </div>

                    <div className="w-full sm:w-auto">
                      {isTaken ? (
                        <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Administered
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedDose(dose);
                            setDoseModalOpen(true);
                          }}
                          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition flex items-center justify-center gap-1.5 ${
                            isMissed
                              ? 'bg-rose-600 hover:bg-rose-700'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isMissed ? 'Resolve Missed Dose' : 'Record Admin'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Recent Vitals & Appointments */}
        <div className="space-y-6">
          {/* Recent Vitals Stream */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                Recent Care Logs & Vitals
              </h3>
              <Link to="/activities" className="text-xs font-bold text-emerald-700 hover:underline">
                View All
              </Link>
            </div>

            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No care activities recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {activities.slice(0, 4).map((act) => (
                  <div key={act.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{act.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(act.activity_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {act.metrics && (
                      <div className="mt-1 text-emerald-700 font-bold">
                        {act.metrics.systolic && act.metrics.diastolic && (
                          <span>BP: {act.metrics.systolic}/{act.metrics.diastolic} mmHg </span>
                        )}
                        {act.metrics.glucose && (
                          <span>Glucose: {act.metrics.glucose} mg/dL </span>
                        )}
                        {act.metrics.pulse && <span>• Pulse: {act.metrics.pulse} bpm</span>}
                      </div>
                    )}
                    {act.description && <p className="text-slate-600 mt-1">{act.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Medical Visits */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-800 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Upcoming Doctor Appointments
            </h3>
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">No visits scheduled.</p>
            ) : (
              <div className="space-y-2">
                {appointments.slice(0, 2).map((a) => (
                  <div key={a.id} className="p-2.5 bg-sky-50/70 border border-sky-100 rounded-xl text-xs">
                    <p className="font-bold text-slate-900">{a.doctor_name}</p>
                    <p className="text-sky-900 font-semibold">
                      {new Date(a.appointment_date).toLocaleDateString()} at {a.appointment_time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dose Record Modal */}
      <DoseActionModal
        dose={selectedDose}
        isOpen={doseModalOpen}
        onClose={() => {
          setDoseModalOpen(false);
          setSelectedDose(null);
        }}
        onSubmit={handleDoseSubmit}
      />

      {/* Vitals & Care Logging Modal */}
      {vitalsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Record Vitals / Care Activity
              </h2>
              <button
                onClick={() => setVitalsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVitalSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Activity Type
                </label>
                <select
                  value={vitalType}
                  onChange={(e) => {
                    setVitalType(e.target.value);
                    if (e.target.value === 'VITALS') setVitalTitle('Blood Pressure & Pulse Check');
                    else if (e.target.value === 'MEAL') setVitalTitle('Meal Assistance');
                    else if (e.target.value === 'MOBILITY') setVitalTitle('Physical Therapy & Walk');
                    else setVitalTitle('General Care Activity');
                  }}
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="VITALS">Vitals (BP, Pulse, Glucose)</option>
                  <option value="MEAL">Meal & Hydration</option>
                  <option value="MOBILITY">Mobility & Exercise</option>
                  <option value="HYGIENE">Hygiene & Bathing</option>
                  <option value="OTHER">Other Clinical Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Activity Title
                </label>
                <input
                  type="text"
                  required
                  value={vitalTitle}
                  onChange={(e) => setVitalTitle(e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {vitalType === 'VITALS' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Systolic</label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full text-sm p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Diastolic</label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full text-sm p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Pulse</label>
                    <input
                      type="number"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      className="w-full text-sm p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Observations / Notes
                </label>
                <textarea
                  rows={2}
                  value={vitalNotes}
                  onChange={(e) => setVitalNotes(e.target.value)}
                  placeholder="e.g., Patient seated 5 minutes prior to BP reading. Normal breath sounds."
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVitalsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVital}
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submittingVital ? 'Logging...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
