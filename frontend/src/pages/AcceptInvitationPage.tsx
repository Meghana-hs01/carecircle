import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { careCircleService } from '../services/api';

export const AcceptInvitationPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshProfiles } = useProfile();
  const navigate = useNavigate();

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const member = await careCircleService.acceptInvitation(inviteCode.trim().toUpperCase());
      setSuccess(`Successfully joined Care Circle as ${member.relationship_title}!`);
      await refreshProfiles();
      setTimeout(() => {
        if (user?.role === 'FAMILY_MEMBER') {
          navigate('/family-dashboard');
        } else if (user?.role === 'CARETAKER') {
          navigate('/caretaker-dashboard');
        } else {
          navigate('/elderly-dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid or expired invitation code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <KeyRound className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Join a Care Circle</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Enter the secure 8-character invitation code provided by the elderly individual or family administrator.
        </p>

        {success && (
          <div className="my-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 text-left">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{success} Redirecting to your dashboard...</span>
          </div>
        )}

        {error && (
          <div className="my-5 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2 text-left">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAccept} className="space-y-4 mt-6 text-left">
          <div>
            <label htmlFor="invitation-code" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Invitation Code
            </label>
            <input
              id="invitation-code"
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g., CC-A3B9-4F2E"
              className="w-full text-center font-mono font-bold text-lg tracking-wider p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inviteCode.trim()}
            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? 'Validating Code...' : 'Accept Invitation & Connect'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Cryptographically validated & single-use protected</span>
        </div>
      </div>
    </div>
  );
};
