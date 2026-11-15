import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill,
  Calendar,
  CheckCircle2,
  Clock,
  PhoneCall,
  UserPlus,
  ArrowRight,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { medicationService, appointmentService, careCircleService } from '../services/api';
import { MedicationDose, Appointment, CareCircleMember } from '../types';
import { DoseActionModal } from '../components/DoseActionModal';

export const ElderlyDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentProfile, loading: profileLoading } = useProfile();
  const { largeText, toggleLargeText } = useAccessibility();

  const [todayDoses, setTodayDoses] = useState<MedicationDose[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [circleMembers, setCircleMembers] = useState<CareCircleMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedDose, setSelectedDose] = useState<MedicationDose | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const loadDashboardData = async () => {
    if (!currentProfile) return;
    setLoading(true);
    setError(null);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [doses, appts, members] = await Promise.all([
        medicationService.listDoses(currentProfile.id, todayStr, 1),
        appointmentService.listAppointments(currentProfile.id, 'SCHEDULED'),
        careCircleService.listMembers(currentProfile.id),
      ]);
      setTodayDoses(doses);
      setUpcomingAppointments(appts);
      setCircleMembers(members);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load healthcare data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentProfile) {
      loadDashboardData();
    }
  }, [currentProfile]);

  const handleDoseSubmit = async (doseId: number, status: 'TAKEN' | 'SKIPPED', notes?: string) => {
    await medicationService.recordDose(doseId, status, notes);
    await loadDashboardData();
  };

  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  return (
    <div className="space-y-6">
      {/* Welcome & Accessibility Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-teal-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-200 block mb-1">
            Personal Healthcare Dashboard
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Hello, {currentProfile?.full_name || user?.full_name}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-teal-100 max-w-xl">
            Here is your daily care schedule. Confirm medicines with a single tap, or view your upcoming doctor visits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleLargeText}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 border transition ${
              largeText
                ? 'bg-white text-teal-900 border-white shadow-md'
                : 'bg-teal-600/50 hover:bg-teal-600 text-white border-teal-500'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{largeText ? 'Large Text Active' : 'Enable Large Text'}</span>
          </button>
          <button
            onClick={loadDashboardData}
            title="Refresh Dashboard"
            className="p-2.5 rounded-xl bg-teal-600/50 hover:bg-teal-600 text-white border border-teal-500 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Emergency Contact Banner */}
      {currentProfile?.emergency_contact_phone && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-600/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 block">
                Primary Emergency Contact
              </span>
              <p className="text-sm font-bold text-slate-900">
                {currentProfile.emergency_contact_name} ({currentProfile.emergency_contact_relation || 'Family'})
              </p>
            </div>
          </div>
          <a
            href={`tel:${currentProfile.emergency_contact_phone}`}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call {currentProfile.emergency_contact_phone}</span>
          </a>
        </div>
      )}

      {/* Main Grid: Today's Medications & Quick Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Doses (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Pill className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Today's Medication Schedule</h2>
            </div>
            <Link
              to="/medications"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>Manage Prescriptions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold text-slate-500 mt-2">Checking schedule...</p>
            </div>
          ) : todayDoses.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto opacity-70" />
              <p className="text-base font-bold text-slate-900 mt-2">No Scheduled Doses for Today</p>
              <p className="text-xs text-slate-500 mt-1">
                You're all clear! Add prescribed medications in the Prescriptions tab.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayDoses.map((dose) => {
                const timeStr = new Date(dose.scheduled_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isTaken = dose.status === 'TAKEN';
                const isSkipped = dose.status === 'SKIPPED';
                const isMissed = dose.status === 'MISSED';

                return (
                  <div
                    key={dose.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isTaken
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isMissed
                        ? 'bg-rose-50/50 border-rose-300'
                        : isSkipped
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{dose.medication_name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {dose.medication_dosage}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>Scheduled: {timeStr}</span>
                        {dose.actual_time && (
                          <span className="text-emerald-700 font-medium">
                            • Taken at {new Date(dose.actual_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {dose.medication_instructions && (
                        <p className="text-xs text-slate-600 italic mt-1">{dose.medication_instructions}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {isTaken ? (
                        <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 w-full sm:w-auto justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Taken
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedDose(dose);
                            setModalOpen(true);
                          }}
                          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-1.5 ${
                            isMissed
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isMissed ? 'Resolve Missed Dose' : 'Mark as Taken'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Next Appointment & Care Circle */}
        <div className="space-y-6">
          {/* Next Appointment Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Next Doctor Visit
              </span>
              <Link to="/appointments" className="text-xs font-bold text-sky-700 hover:underline">
                View All
              </Link>
            </div>

            {nextAppointment ? (
              <div className="space-y-2">
                <p className="text-base font-bold text-slate-900">{nextAppointment.doctor_name}</p>
                <p className="text-xs text-slate-600">{nextAppointment.hospital_clinic}</p>
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-900 font-semibold flex items-center justify-between">
                  <span>{new Date(nextAppointment.appointment_date).toLocaleDateString()}</span>
                  <span>{nextAppointment.appointment_time}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{nextAppointment.purpose}</p>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                <p>No upcoming appointments scheduled.</p>
                <Link
                  to="/appointments"
                  className="mt-2 inline-block px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Schedule Appointment
                </Link>
              </div>
            )}
          </div>

          {/* Care Circle Members Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                My Care Circle
              </span>
              <Link to="/care-circle" className="text-xs font-bold text-teal-700 hover:underline">
                Invite
              </Link>
            </div>

            {circleMembers.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                <p>No family or caretakers linked yet.</p>
                <Link
                  to="/care-circle"
                  className="mt-2 inline-block px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                >
                  Generate Invitation Code
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {circleMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{m.user_name}</p>
                      <p className="text-slate-500">{m.relationship_title}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold text-[10px]">
                      {m.role === 'CARETAKER' ? 'Caretaker' : 'Family'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dose Action Modal */}
      <DoseActionModal
        dose={selectedDose}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedDose(null);
        }}
        onSubmit={handleDoseSubmit}
      />
    </div>
  );
};
