import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users2,
  KeyRound,
  ArrowRight,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { medicationService, appointmentService, analyticsService, careCircleService } from '../services/api';
import { MedicationDose, Appointment, AdherenceStats, CareCircleMember } from '../types';
import { StatCard } from '../components/StatCard';

export const FamilyDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentProfile, profiles, loading: profilesLoading } = useProfile();

  const [doses, setDoses] = useState<MedicationDose[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [adherence, setAdherence] = useState<AdherenceStats | null>(null);
  const [members, setMembers] = useState<CareCircleMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentProfile) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [dosesData, apptsData, statsData, membersData] = await Promise.all([
          medicationService.listDoses(currentProfile.id, todayStr, 1),
          appointmentService.listAppointments(currentProfile.id, 'SCHEDULED'),
          analyticsService.getAdherence(currentProfile.id, 14),
          careCircleService.listMembers(currentProfile.id),
        ]);
        setDoses(dosesData);
        setAppointments(apptsData);
        setAdherence(statsData);
        setMembers(membersData);
      } catch (e) {
        console.error('Failed to load family dashboard:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentProfile]);

  if (!currentProfile && !profilesLoading) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto shadow-md">
          <KeyRound className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">No Patient Profiles Linked</h2>
        <p className="text-sm text-slate-600">
          To view your loved one's medications and appointments, enter the secure invitation code provided by the elderly individual.
        </p>
        <div className="pt-2">
          <Link
            to="/accept-invitation"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition"
          >
            <KeyRound className="w-4 h-4" />
            <span>Enter Invitation Code</span>
          </Link>
        </div>
      </div>
    );
  }

  const adherenceRate = adherence?.adherence_percentage ?? 100;
  const missedCount = adherence?.missed ?? 0;
  const takenCount = adherence?.taken ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-700 to-sky-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-sky-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-200 block mb-1">
            Family Care Circle
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Caring for {currentProfile?.full_name}
          </h1>
          <p className="text-sm text-sky-100 mt-1">
            Real-time adherence monitoring, medication logs, and doctor appointment oversight.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/timeline"
            className="px-4 py-2.5 bg-white text-sky-900 hover:bg-sky-50 font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2"
          >
            <span>View Full Timeline</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="14-Day Adherence"
          value={`${adherenceRate}%`}
          subtitle="Based on recorded doses"
          icon={TrendingUp}
          colorScheme={adherenceRate >= 80 ? 'emerald' : adherenceRate >= 60 ? 'amber' : 'rose'}
          trend={adherenceRate >= 80 ? 'Optimal Adherence' : 'Needs Attention'}
        />
        <StatCard
          title="Doses Confirmed"
          value={takenCount}
          subtitle="Administered on time"
          icon={CheckCircle2}
          colorScheme="teal"
        />
        <StatCard
          title="Missed Doses"
          value={missedCount}
          subtitle="Escalated to Care Circle"
          icon={AlertTriangle}
          colorScheme={missedCount > 0 ? 'rose' : 'blue'}
        />
        <StatCard
          title="Care Team Members"
          value={members.length}
          subtitle="Family & Caretakers"
          icon={Users2}
          colorScheme="blue"
        />
      </div>

      {/* Grid: Medication Schedule & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span>Today's Medication Adherence</span>
            </h2>
            <Link to="/medication-history" className="text-xs font-bold text-teal-700 hover:underline">
              View History
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : doses.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
              No doses scheduled for today.
            </div>
          ) : (
            <div className="space-y-3">
              {doses.map((dose) => {
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
                    className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{dose.medication_name}</p>
                      <p className="text-xs text-slate-500">
                        {dose.medication_dosage} • Scheduled for {timeStr}
                      </p>
                      {dose.actual_time && (
                        <p className="text-xs text-emerald-700 font-medium mt-0.5">
                          Administered at {new Date(dose.actual_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {dose.recorded_by_name ? ` by ${dose.recorded_by_name}` : ''}
                        </p>
                      )}
                    </div>
                    <div>
                      {isTaken && (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          Confirmed Taken
                        </span>
                      )}
                      {isMissed && (
                        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Missed Dose
                        </span>
                      )}
                      {isSkipped && (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                          Skipped
                        </span>
                      )}
                      {dose.status === 'UPCOMING' && (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Upcoming Appointments & Circle */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-800 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Upcoming Doctor Visits
            </h3>

            {appointments.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No upcoming visits.</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <p className="font-bold text-slate-900">{a.doctor_name}</p>
                    <p className="text-slate-600">{a.hospital_clinic}</p>
                    <div className="mt-1 font-semibold text-sky-800">
                      {new Date(a.appointment_date).toLocaleDateString()} at {a.appointment_time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-1.5">
              <Users2 className="w-4 h-4" />
              Care Team Roster
            </h3>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                  <div>
                    <span className="font-bold text-slate-800 block">{m.user_name}</span>
                    <span className="text-slate-500">{m.relationship_title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    {m.role === 'CARETAKER' ? 'Caretaker' : 'Family'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
