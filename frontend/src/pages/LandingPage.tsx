import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShieldCheck,
  Users2,
  Pill,
  Clock,
  Calendar,
  Lock,
  ArrowRight,
  CheckCircle2,
  BellRing
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                CareCircle
              </span>
              <span className="text-[11px] font-semibold text-teal-700">Better Care. Together.</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={
                  user.role === 'ELDERLY'
                    ? '/elderly-dashboard'
                    : user.role === 'FAMILY_MEMBER'
                    ? '/family-dashboard'
                    : '/caretaker-dashboard'
                }
                className="px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition flex items-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
                >
                  Join CareCircle
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-teal-50/60 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/80 border border-teal-300 text-teal-800 text-xs font-bold mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span>Catalyst Hackathon — Autonomous Full-Stack Healthcare Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Shared, secure healthcare management for the people you{' '}
            <span className="text-teal-600 underline decoration-teal-300 decoration-wavy decoration-2">
              love most
            </span>
            .
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            CareCircle bridges the gap between elderly individuals, family members, and professional
            caretakers. Coordinate medications, track doctor visits, and automate missed-dose escalations
            with privacy-first role security.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2"
            >
              Launch Live Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm transition"
            >
              Create Account
            </Link>
          </div>

          {/* Quick Demo Logins banner */}
          <div className="mt-12 max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              Instant Hackathon Evaluator Credentials (Password: CareCircle2026!)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">👵 Elderly User</span>
                <span className="text-slate-600 truncate block">eleanor@carecircle.demo</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">👨‍👩‍👧 Family Member</span>
                <span className="text-slate-600 truncate block">sarah@carecircle.demo</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">🩺 Caretaker (RN)</span>
                <span className="text-slate-600 truncate block">marcus@carecircle.demo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Ecosystem Pillars */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600">Built for Three Pillars</h2>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              Everyone stays connected, informed, and in control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Elderly Pillar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">1. Elderly Individuals</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Retain full agency over your health. One-touch dose confirmation, accessible large-font view,
                and emergency contact access right from your personalized dashboard.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Large text & high-contrast modes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Invite family & caretakers via expiring codes
                </li>
              </ul>
            </div>

            {/* Family Pillar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-4">
                <Users2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">2. Family Members</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Stay confident and reassured from anywhere. View live adherence trends, check appointment schedules,
                and receive immediate alerts if a medication dose is overdue.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  Live adherence analytics with Recharts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  Read-only or care collaboration rights
                </li>
              </ul>
            </div>

            {/* Caretaker Pillar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">3. Professional Caretakers</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Administer medications accurately with duplicate prevention, record clinical vitals (blood pressure,
                glucose), and maintain an unalterable medical audit trail.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Dose administration & care activity logging
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Missed-dose notification workflows
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <Clock className="w-8 h-8 text-teal-600 mb-3" />
              <h4 className="font-bold text-slate-900">Daily Care Timeline</h4>
              <p className="text-xs text-slate-600 mt-1">
                Unified chronological stream of doses, appointments, vitals, and actions.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <BellRing className="w-8 h-8 text-rose-600 mb-3" />
              <h4 className="font-bold text-slate-900">Missed-Dose Escalation</h4>
              <p className="text-xs text-slate-600 mt-1">
                Configurable grace periods trigger automated caretaker and family notifications.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <Calendar className="w-8 h-8 text-sky-600 mb-3" />
              <h4 className="font-bold text-slate-900">Doctor Appointments</h4>
              <p className="text-xs text-slate-600 mt-1">
                Shared medical calendar with clinics, notes, and appointment reminders.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="font-bold text-slate-900">Zero-Leakage RBAC</h4>
              <p className="text-xs text-slate-600 mt-1">
                Backend permission enforcement preventing IDOR and unauthorized patient record access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 text-center text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold text-white text-sm">CareCircle — Better Care. Together.</p>
          <p className="mt-1">Built for the Catalyst Solo AI Hackathon • Production-Ready Full-Stack Health Platform</p>
        </div>
      </footer>
    </div>
  );
};
