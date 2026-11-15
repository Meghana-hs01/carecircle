import React, { useState, useEffect } from 'react';
import {
  Users2,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { careCircleService } from '../services/api';
import { CareCircleMember, Invitation } from '../types';

export const CareCirclePage: React.FC = () => {
  const { user } = useAuth();
  const { currentProfile } = useProfile();

  const [members, setMembers] = useState<CareCircleMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [role, setRole] = useState<'FAMILY_MEMBER' | 'CARETAKER'>('FAMILY_MEMBER');
  const [relationTitle, setRelationTitle] = useState('Daughter');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [canViewHealth, setCanViewHealth] = useState(true);
  const [canManageCare, setCanManageCare] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!currentProfile) return;
    setLoading(true);
    try {
      const data = await careCircleService.listMembers(currentProfile.id);
      setMembers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentProfile]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    setSubmitting(true);
    setError(null);
    try {
      const invite = await careCircleService.createInvitation({
        profile_id: currentProfile.id,
        role,
        relationship_title: relationTitle,
        recipient_email: recipientEmail || undefined,
        can_view_health: canViewHealth,
        can_manage_care: canManageCare,
        expiry_days: expiryDays,
      });
      setGeneratedInvite(invite);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to generate invitation code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedInvite?.invitation_code) {
      navigator.clipboard.writeText(generatedInvite.invitation_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async (memberId: number, memberName: string) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${memberName}?`)) {
      return;
    }
    try {
      await careCircleService.revokeMember(memberId);
      await fetchMembers();
    } catch (e) {
      console.error(e);
      alert('Failed to revoke member access.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="w-7 h-7 text-teal-600" />
            <span>Care Circle & Access Permissions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authorize family members and professional caretakers with custom permission boundaries for {currentProfile?.full_name}.
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedInvite(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite New Member</span>
        </button>
      </div>

      {/* Members List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Active Care Circle Members ({members.length})</span>
        </h2>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No family or caretakers joined yet. Generate a secure invitation code to grant access.
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{m.user_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase">
                      {m.role === 'CARETAKER' ? 'Caretaker' : 'Family Member'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {m.relationship_title} • {m.user_email}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      View Health Records: <strong className="text-slate-800">Allowed</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      {m.can_manage_care ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Manage Care & Administer Meds: <strong className="text-emerald-800">Yes</strong>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Manage Care: <strong className="text-slate-500">Read-Only</strong>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(m.id, m.user_name)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke Access</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-teal-600" />
                Invite to Care Circle
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedInvite ? (
              <div className="space-y-4 my-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-900">Invitation Code Generated!</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Share this single-use expiring code with your family member or caretaker:
                  </p>
                  <div className="mt-3 p-3 bg-white border border-emerald-300 rounded-xl font-mono text-xl font-black tracking-widest text-slate-900 select-all">
                    {generatedInvite.invitation_code}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Invitation Code'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Valid for {expiryDays} days. Once accepted, access is bound directly to their verified account.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    fetchMembers();
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4 mt-4">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRole('FAMILY_MEMBER');
                        setRelationTitle('Daughter');
                        setCanManageCare(false);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        role === 'FAMILY_MEMBER'
                          ? 'border-teal-600 bg-teal-50 text-teal-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      Family Member
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRole('CARETAKER');
                        setRelationTitle('Nurse / Caregiver');
                        setCanManageCare(true);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        role === 'CARETAKER'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      Caretaker / Nurse
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Relationship Title</label>
                  <input
                    type="text"
                    required
                    value={relationTitle}
                    onChange={(e) => setRelationTitle(e.target.value)}
                    placeholder="e.g., Daughter, Son, Visiting Nurse, Primary Caregiver"
                    className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Recipient Email (Optional Notification)
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="family@example.com"
                    className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Granular Permissions */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Permissions
                  </span>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canViewHealth}
                      onChange={(e) => setCanViewHealth(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Allow viewing medical records, adherence, and appointments</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canManageCare}
                      onChange={(e) => setCanManageCare(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Allow recording medication administration and care activities</span>
                  </label>
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
                    className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {submitting ? 'Generating...' : 'Generate Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
