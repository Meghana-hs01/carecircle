import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { MedicationDose } from '../types';

interface DoseActionModalProps {
  dose: MedicationDose | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (doseId: number, status: 'TAKEN' | 'SKIPPED', notes?: string) => Promise<void>;
}

export const DoseActionModal: React.FC<DoseActionModalProps> = ({
  dose,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'TAKEN' | 'SKIPPED'>('TAKEN');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !dose) return null;

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(dose.id, selectedStatus, notes);
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to record dose status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formattedTime = new Date(dose.scheduled_time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dose-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 id="dose-modal-title" className="text-lg font-bold text-slate-900">
            Record Dose Administration
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-base font-bold text-slate-900">{dose.medication_name}</p>
          <p className="text-sm text-teal-700 font-semibold">{dose.medication_dosage}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled for {formattedTime}</span>
          </div>
          {dose.medication_instructions && (
            <p className="text-xs text-slate-600 mt-2 bg-white p-2 rounded border border-slate-200">
              {dose.medication_instructions}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAction} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Action Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedStatus('TAKEN')}
                className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border-2 transition ${
                  selectedStatus === 'TAKEN'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Dose Taken
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('SKIPPED')}
                className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border-2 transition ${
                  selectedStatus === 'SKIPPED'
                    ? 'border-amber-600 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Skip Dose
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="dose-notes" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Optional Notes / Reason
            </label>
            <textarea
              id="dose-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                selectedStatus === 'TAKEN'
                  ? 'e.g., Taken with lunch and warm water'
                  : 'e.g., Doctor advised skipping due to low blood pressure'
              }
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Confirm Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
