import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill,
  Plus,
  Clock,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Trash2,
  History,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { medicationService } from '../services/api';
import { Medication } from '../types';

export const MedicationsPage: React.FC = () => {
  const { user } = useAuth();
  const { currentProfile } = useProfile();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [safetyAnalysis, setSafetyAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterActive, setFilterActive] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [discontinuingId, setDiscontinuingId] = useState<number | null>(null);

  const fetchMedications = async () => {
    if (!currentProfile) return;
    setLoading(true);
    setActionError(null);
    try {
      const [data, safety] = await Promise.all([
        medicationService.listMedications(currentProfile.id, filterActive),
        medicationService.getSafetyAnalysis(currentProfile.id).catch(() => null)
      ]);
      setMedications(data);
      setSafetyAnalysis(safety);
    } catch (err: any) {
      console.error(err);
      setActionError('Failed to load medications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [currentProfile, filterActive]);

  const handleDiscontinue = async (medId: number, medName: string) => {
    if (!window.confirm(`Are you sure you want to discontinue ${medName}? Dose history will be preserved.`)) {
      return;
    }
    setDiscontinuingId(medId);
    try {
      await medicationService.discontinueMedication(medId);
      await fetchMedications();
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || 'Failed to discontinue medication.');
    } finally {
      setDiscontinuingId(null);
    }
  };

  if (!currentProfile) {
    return (
      <div className="text-center py-16 text-slate-500">
        Please select or link an elderly profile first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-7 h-7 text-teal-600" />
            <span>Medication Prescriptions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Active medication schedules and administration guidance for {currentProfile.full_name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/medication-history"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            <span>Dose History</span>
          </Link>
          <Link
            to="/medications/new"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication</span>
          </Link>
        </div>
      </div>

      {/* Clinical Drug-Drug & Allergy Safety Analysis Card */}
      {safetyAnalysis && (
        <div className="bg-white border border-teal-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Clinical Safety & Drug Interaction Guard</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {safetyAnalysis.overall_status === 'OPTIMAL' ? 'Optimal • No Critical Conflicts' : safetyAnalysis.overall_status}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Automated contraindication & allergy verification for {safetyAnalysis.patient_name}.
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Allergies Cleared:{' '}
              <span className="font-bold text-slate-700">
                {safetyAnalysis.allergies_evaluated.join(', ')}
              </span>
            </div>
          </div>

          {safetyAnalysis.clinical_warnings.length > 0 && (
            <div className="space-y-2">
              {safetyAnalysis.clinical_warnings.map((w: any, idx: number) => (
                <div key={idx} className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{w.title}: </span>
                    <span>{w.description}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {safetyAnalysis.administration_insights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {safetyAnalysis.administration_insights.map((ins: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700">
                  <span className="font-bold text-teal-800 block mb-0.5">{ins.title}</span>
                  <span className="text-[11px] text-slate-600 leading-tight block">{ins.recommendation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterActive(true)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filterActive
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Active Prescriptions
        </button>
        <button
          onClick={() => setFilterActive(false)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            !filterActive
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All (Including Discontinued)
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Medication Cards List */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500 mt-2">Loading prescriptions...</p>
        </div>
      ) : medications.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <Pill className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-900 mt-2">No Medications Found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add prescribed medicines to generate scheduled daily dose trackers automatically.
          </p>
          <Link
            to="/medications/new"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Prescribe Medication</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medications.map((med) => (
            <div
              key={med.id}
              className={`p-5 rounded-3xl border transition shadow-sm bg-white ${
                med.is_active ? 'border-slate-200 hover:border-teal-300' : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{med.name}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800">
                      {med.dosage}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Frequency: {med.frequency.replace('_', ' ')}
                  </p>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    med.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {med.is_active ? 'Active' : 'Discontinued'}
                </span>
              </div>

              {/* Scheduled Daily Times */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  Scheduled Times:
                </span>
                {med.scheduled_times.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Instructions */}
              {med.instructions && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                  <span className="font-bold block text-slate-900 mb-0.5">Instructions:</span>
                  {med.instructions}
                </div>
              )}

              {/* Prescribing Doctor & Dates */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>{med.prescribing_doctor || 'Doctor not specified'}</span>
                </div>
                <div>
                  <span>Started: {new Date(med.start_date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Discontinue action */}
              {med.is_active && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleDiscontinue(med.id, med.name)}
                    disabled={discontinuingId === med.id}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{discontinuingId === med.id ? 'Discontinuing...' : 'Discontinue Medication'}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
