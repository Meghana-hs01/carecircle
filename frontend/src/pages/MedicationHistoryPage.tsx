import React, { useState, useEffect } from 'react';
import { History, Filter, CheckCircle2, AlertCircle, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { medicationService } from '../services/api';
import { MedicationDose, DoseStatus } from '../types';
import { DoseActionModal } from '../components/DoseActionModal';

export const MedicationHistoryPage: React.FC = () => {
  const { currentProfile } = useProfile();
  const [doses, setDoses] = useState<MedicationDose[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  const [selectedDose, setSelectedDose] = useState<MedicationDose | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const fetchDoses = async () => {
    if (!currentProfile) return;
    setLoading(true);
    try {
      const data = await medicationService.listDoses(
        currentProfile.id,
        dateFilter || undefined,
        14
      );
      setDoses(data);
    } catch (e) {
      console.error('Failed to load dose history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoses();
  }, [currentProfile, dateFilter]);

  const handleDoseSubmit = async (doseId: number, status: 'TAKEN' | 'SKIPPED', notes?: string) => {
    await medicationService.recordDose(doseId, status, notes);
    await fetchDoses();
  };

  const filteredDoses = doses.filter((d) => {
    if (statusFilter === 'ALL') return true;
    return d.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-teal-600" />
            <span>Medication Administration History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete administration log and audit trail for {currentProfile?.full_name}.
          </p>
        </div>

        <Link
          to="/medications"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Active Prescriptions</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </span>
          {['ALL', 'TAKEN', 'MISSED', 'SKIPPED', 'UPCOMING'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="history-date" className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Date:
          </label>
          <input
            id="history-date"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs p-2 border border-slate-200 rounded-xl bg-slate-50"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs font-bold text-teal-700 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Doses Table / List */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500 mt-2">Loading dose records...</p>
        </div>
      ) : filteredDoses.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl text-xs text-slate-500">
          No dose records match your filter criteria.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Medication</th>
                  <th className="py-3 px-4">Scheduled Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Administered At</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoses.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{d.medication_name}</span>
                      <span className="text-[11px] text-teal-700">{d.medication_dosage}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {new Date(d.scheduled_time).toLocaleDateString()} at{' '}
                      {new Date(d.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          d.status === 'TAKEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'MISSED'
                            ? 'bg-rose-100 text-rose-800'
                            : d.status === 'SKIPPED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {d.actual_time
                        ? new Date(d.actual_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {d.recorded_by_name || (d.status === 'MISSED' ? 'Auto-Escalation Engine' : '—')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{d.notes || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
                      {d.status !== 'TAKEN' && (
                        <button
                          onClick={() => {
                            setSelectedDose(d);
                            setModalOpen(true);
                          }}
                          className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg transition"
                        >
                          Record / Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
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
