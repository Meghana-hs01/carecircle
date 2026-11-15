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
  RefreshCw,
  Shield,
  HeartPulse,
  LifeBuoy,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { medicationService, appointmentService, careCircleService } from '../services/api';
import { MedicationDose, Appointment, CareCircleMember } from '../types';
import { DoseActionModal } from '../components/DoseActionModal';

export const ElderlyDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentProfile } = useProfile();

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
      {/* Executive Clinical Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
              Patient Portal
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">
              Age: 78 • Blood Group: O+
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hello, {currentProfile?.full_name || user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Care protocol and daily medication schedule. One-tap dose verification with real-time audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboardData}
            title="Refresh Patient Records"
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Indian Healthcare Emergency Action Center */}
      <div className="bg-rose-50/50 border border-rose-200/90 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-rose-600/30">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                Primary Emergency Contact
              </span>
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.2 rounded">
                Verified
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {currentProfile?.emergency_contact_name || 'Pooja Sharma'} ({currentProfile?.emergency_contact_relation || 'Daughter'})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Family Contact (10-Digit) */}
          <a
            href={`tel:${currentProfile?.emergency_contact_phone || '9876543210'}`}
            className="flex-1 sm:flex-initial px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call {currentProfile?.emergency_contact_phone || '9876543210'}</span>
          </a>

          {/* National Emergency 112 */}
          <a
            href="tel:112"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
            title="National Emergency Helpline"
          >
            <Shield className="w-3.5 h-3.5 text-rose-600" />
            <span>112 Emergency</span>
          </a>

          {/* 108 Ambulance */}
          <a
            href="tel:108"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
            title="National Medical Ambulance"
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
            <span>108 Ambulance</span>
          </a>

          {/* 14567 Elderline */}
          <a
            href="tel:14567"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
            title="Senior Citizens National Helpline"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-teal-600" />
            <span>14567 Elderline</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Today's Medication Schedule & Clinical Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Doses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Today's Medication Schedule</h2>
                <p className="text-[11px] text-slate-500">Scheduled prescriptions for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
            <Link
              to="/medications"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
            >
              <span>Manage Prescriptions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white border border-slate-200/90 rounded-2xl shadow-xs">
              <div className="w-7 h-7 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold text-slate-500 mt-2.5">Retrieving active doses...</p>
            </div>
          ) : todayDoses.length === 0 ? (
            <div className="p-10 text-center bg-white border border-slate-200/90 rounded-2xl shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto opacity-70" />
              <p className="text-sm font-bold text-slate-900 mt-2">All Clear for Today</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No outstanding medication doses scheduled for today. Add or modify prescriptions via the Prescriptions tab.
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
                    className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isTaken
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isMissed
                        ? 'bg-rose-50/40 border-rose-300'
                        : isSkipped
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-slate-200/90 hover:border-teal-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{dose.medication_name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {dose.medication_dosage}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>Scheduled: {timeStr}</span>
                        {dose.actual_time && (
                          <span className="text-emerald-700 font-semibold">
                            • Recorded at {new Date(dose.actual_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {dose.medication_instructions && (
                        <p className="text-xs text-slate-600 mt-1">{dose.medication_instructions}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {isTaken ? (
                        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100/80 text-emerald-800 text-xs font-bold flex items-center gap-1.5 w-full sm:w-auto justify-center border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Taken
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedDose(dose);
                            setModalOpen(true);
                          }}
                          className={`w-full sm:w-auto px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 ${
                            isMissed
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-teal-600 hover:bg-teal-700 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
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
        <div className="space-y-5">
          {/* Next Doctor Appointment Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                Upcoming Consultation
              </span>
              <Link to="/appointments" className="text-xs font-bold text-teal-700 hover:underline">
                View All
              </Link>
            </div>

            {nextAppointment ? (
              <div className="space-y-2.5">
                <div>
                  <p className="text-sm font-bold text-slate-900">{nextAppointment.doctor_name}</p>
                  <p className="text-xs text-slate-500">{nextAppointment.hospital_clinic}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-semibold flex items-center justify-between">
                  <span>{new Date(nextAppointment.appointment_date).toLocaleDateString()}</span>
                  <span className="text-teal-700 font-bold">{nextAppointment.appointment_time}</span>
                </div>
                <p className="text-[11px] text-slate-500 italic">{nextAppointment.purpose}</p>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                <p>No upcoming appointments scheduled.</p>
                <Link
                  to="/appointments"
                  className="mt-2.5 inline-block px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold"
                >
                  Schedule Appointment
                </Link>
              </div>
            )}
          </div>

          {/* Care Circle Members Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-teal-600" />
                Care Circle Team
              </span>
              <Link to="/care-circle" className="text-xs font-bold text-teal-700 hover:underline">
                Manage
              </Link>
            </div>

            {circleMembers.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                <p>No family or caretakers linked yet.</p>
                <Link
                  to="/care-circle"
                  className="mt-2 inline-block px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs"
                >
                  Generate Invitation Code
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {circleMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50/60 rounded-xl border border-slate-200/80 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{m.user_name}</p>
                      <p className="text-[11px] text-slate-500">{m.relationship_title}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[10px]">
                      {m.role === 'CARETAKER' ? 'Clinical Caregiver' : 'Family Guardian'}
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
