import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { appointmentService } from '../services/api';
import { Appointment } from '../types';

export const AppointmentsPage: React.FC = () => {
  const { currentProfile } = useProfile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // New appointment modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [clinic, setClinic] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    if (!currentProfile) return;
    setLoading(true);
    try {
      const data = await appointmentService.listAppointments(currentProfile.id);
      setAppointments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentProfile]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    setSubmitting(true);
    setError(null);
    try {
      await appointmentService.createAppointment(currentProfile.id, {
        doctor_name: doctorName,
        hospital_clinic: clinic,
        appointment_date: apptDate,
        appointment_time: apptTime,
        purpose,
        notes: notes || null,
      });
      setIsModalOpen(false);
      setDoctorName('');
      setClinic('');
      setApptDate('');
      setPurpose('');
      setNotes('');
      await fetchAppointments();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to schedule appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') => {
    try {
      await appointmentService.updateAppointment(id, { status: newStatus });
      await fetchAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  const upcoming = appointments.filter((a) => a.status === 'SCHEDULED');
  const past = appointments.filter((a) => a.status !== 'SCHEDULED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-sky-600" />
            <span>Doctor Appointments & Consultations</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Coordinate medical visits and hospital follow-ups for {currentProfile?.full_name}.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-sky-600/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Appointment</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500 mt-2">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-900 mt-2">No Appointments Scheduled</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Schedule visits with cardiologists, primary care doctors, or physical therapists.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Appointment</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Upcoming Visits ({upcoming.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcoming.map((a) => (
                <div key={a.id} className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm hover:border-sky-300 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{a.doctor_name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        {a.hospital_clinic}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold uppercase">
                      Scheduled
                    </span>
                  </div>

                  <div className="mt-3 p-3 bg-sky-50/70 border border-sky-100 rounded-xl text-xs flex items-center justify-between text-sky-950 font-semibold">
                    <span>{new Date(a.appointment_date).toLocaleDateString()}</span>
                    <span>{a.appointment_time}</span>
                  </div>

                  <p className="text-xs text-slate-700 mt-3 font-medium">
                    <span className="font-bold text-slate-900">Purpose: </span>
                    {a.purpose}
                  </p>
                  {a.notes && <p className="text-xs text-slate-500 italic mt-1">Notes: {a.notes}</p>}

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleStatusChange(a.id, 'COMPLETED')}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Completed
                    </button>
                    <button
                      onClick={() => handleStatusChange(a.id, 'CANCELLED')}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past / Completed / Cancelled Section */}
          {past.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Past Appointments ({past.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {past.map((a) => (
                  <div key={a.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs opacity-70">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{a.doctor_name}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                        {a.status}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">{a.hospital_clinic} • {new Date(a.appointment_date).toLocaleDateString()}</p>
                    <p className="text-slate-600 mt-1">{a.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Schedule Medical Appointment</h2>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g., Dr. Robert Hayes (Cardiology)"
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic *</label>
                <input
                  type="text"
                  required
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  placeholder="e.g., St. Jude Medical Center, Suite 402"
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time (HH:MM) *</label>
                  <input
                    type="time"
                    required
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Purpose / Reason *</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g., Routine Blood Pressure & Medication Check"
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preparation Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Fast 8 hours prior for bloodwork. Bring insurance card."
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                  className="px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
