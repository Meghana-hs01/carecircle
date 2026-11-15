import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, Clock, Plus, Trash2, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { medicationService } from '../services/api';

export const AddEditMedicationPage: React.FC = () => {
  const { currentProfile } = useProfile();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('ONCE_DAILY');
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['08:00']);
  const [newTimeInput, setNewTimeInput] = useState('20:00');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [prescribingDoctor, setPrescribingDoctor] = useState('');
  const [instructions, setInstructions] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFrequencyChange = (newFreq: string) => {
    setFrequency(newFreq);
    if (newFreq === 'ONCE_DAILY') {
      setScheduledTimes(['08:00']);
    } else if (newFreq === 'TWICE_DAILY') {
      setScheduledTimes(['08:00', '20:00']);
    } else if (newFreq === 'THRICE_DAILY') {
      setScheduledTimes(['08:00', '14:00', '20:00']);
    }
  };

  const addTime = () => {
    if (newTimeInput && !scheduledTimes.includes(newTimeInput)) {
      setScheduledTimes([...scheduledTimes, newTimeInput].sort());
    }
  };

  const removeTime = (timeToRemove: string) => {
    if (scheduledTimes.length === 1) {
      alert('At least one daily administration time is required.');
      return;
    }
    setScheduledTimes(scheduledTimes.filter((t) => t !== timeToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    setError(null);
    setLoading(true);

    try {
      await medicationService.createMedication(currentProfile.id, {
        name,
        dosage,
        frequency,
        scheduled_times: scheduledTimes,
        start_date: startDate,
        end_date: endDate || null,
        prescribing_doctor: prescribingDoctor || null,
        instructions: instructions || null,
      });
      navigate('/medications');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save medication. Check required fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/medications"
        className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Prescriptions</span>
      </Link>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Prescribe New Medication</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Adding a medication generates scheduled dose records automatically for {currentProfile?.full_name}.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="med-name" className="block text-xs font-bold text-slate-700 mb-1">
                Medication Name *
              </label>
              <input
                id="med-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lisinopril, Metformin HCl"
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="med-dosage" className="block text-xs font-bold text-slate-700 mb-1">
                Dosage & Form *
              </label>
              <input
                id="med-dosage"
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 20mg, 1 tablet, 5ml"
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="med-freq" className="block text-xs font-bold text-slate-700 mb-1">
                Frequency
              </label>
              <select
                id="med-freq"
                value={frequency}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="ONCE_DAILY">Once Daily</option>
                <option value="TWICE_DAILY">Twice Daily</option>
                <option value="THRICE_DAILY">Three Times Daily</option>
                <option value="CUSTOM">Custom Schedule</option>
              </select>
            </div>

            <div>
              <label htmlFor="med-doc" className="block text-xs font-bold text-slate-700 mb-1">
                Prescribing Doctor (Optional)
              </label>
              <input
                id="med-doc"
                type="text"
                value={prescribingDoctor}
                onChange={(e) => setPrescribingDoctor(e.target.value)}
                placeholder="e.g., Dr. Robert Hayes"
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Scheduled Times */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              Daily Scheduled Administration Times
            </label>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {scheduledTimes.map((t) => (
                <div
                  key={t}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-sm"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => removeTime(t)}
                    className="hover:text-rose-200 transition"
                    title={`Remove ${t}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={newTimeInput}
                onChange={(e) => setNewTimeInput(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
              />
              <button
                type="button"
                onClick={addTime}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Time
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="med-start" className="block text-xs font-bold text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                id="med-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="med-end" className="block text-xs font-bold text-slate-700 mb-1">
                End Date (Optional, leave blank for ongoing)
              </label>
              <input
                id="med-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="med-instr" className="block text-xs font-bold text-slate-700 mb-1">
              Instructions & Warnings (Optional)
            </label>
            <textarea
              id="med-instr"
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Take after morning meal with plenty of water. Monitor blood pressure weekly."
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/medications')}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Prescribing...' : 'Prescribe & Generate Doses'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
