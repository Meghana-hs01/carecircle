import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Bell,
  LogOut,
  Type,
  Eye,
  Users,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Sparkles,
  User,
  X,
  PhoneCall,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useProfile } from '../context/ProfileContext';
import { notificationService } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, login, logout } = useAuth();
  const { highContrast, largeText, toggleHighContrast, toggleLargeText } = useAccessibility();
  const { profiles, currentProfile, setCurrentProfileId } = useProfile();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showPatientModal, setShowPatientModal] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      notificationService
        .listNotifications(10)
        .then((notifs) => {
          setUnreadCount(notifs.filter((n) => !n.is_read).length);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleDemoSwitch = async (email: string) => {
    try {
      const loggedUser = await login(email, 'CareCircle2026!');
      if (loggedUser.role === 'ELDERLY') {
        navigate('/elderly-dashboard');
      } else if (loggedUser.role === 'FAMILY_MEMBER') {
        navigate('/family-dashboard');
      } else if (loggedUser.role === 'CARETAKER') {
        navigate('/caretaker-dashboard');
      }
    } catch (err) {
      console.error('Demo switch error', err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group" aria-label="CareCircle Home">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:bg-teal-700 transition">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                CareCircle
              </span>
              <span className="hidden sm:block text-xs font-medium text-teal-700 tracking-wide">
                Better Care. Together.
              </span>
            </div>
          </Link>
        </div>

        {/* Center Section: Patient Details Dropdown Button (Requested by User) */}
        {user && currentProfile && (
          <div className="relative">
            <button
              onClick={() => setShowPatientModal(!showPatientModal)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100/80 text-teal-900 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Click to view comprehensive patient clinical details"
            >
              <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black">
                {currentProfile.full_name ? currentProfile.full_name.charAt(0) : 'P'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-[10px] text-teal-700 uppercase font-bold tracking-wider block leading-none">
                  Patient Details
                </span>
                <span className="text-xs font-black text-slate-900 leading-tight">
                  {currentProfile.full_name}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-teal-700" />
            </button>

            {/* Patient Details Popover Card */}
            {showPatientModal && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPatientModal(false)}
                />
                <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 text-xs space-y-3">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center">
                        {currentProfile.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{currentProfile.full_name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {currentProfile.gender || 'Female'} • Age: 78 • Blood Group: O+
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPatientModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 10-Digit Indian Phone Numbers & Emergency Contacts */}
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Patient Mobile:</span>
                      <span className="font-bold text-slate-900">
                        +91 {currentProfile.contact_phone || '9845012345'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Primary Emergency:</span>
                      <span className="font-bold text-rose-700">
                        {currentProfile.emergency_contact_name || 'Pooja Sharma'} (+91 {currentProfile.emergency_contact_phone || '9876543210'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-semibold">Helplines:</span>
                      <span className="font-bold text-slate-800">
                        112 (Police) • 108 (Ambulance) • 14567 (Elderline)
                      </span>
                    </div>
                  </div>

                  {/* Clinical Profile Details */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Medical Conditions
                      </span>
                      <p className="text-slate-800 font-medium mt-0.5">
                        {currentProfile.medical_conditions || 'Hypertension, Type-2 Diabetes Mellitus, Osteoarthritis'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Known Allergies (Clinical Guard)
                      </span>
                      <p className="text-rose-700 font-bold mt-0.5">
                        {currentProfile.known_allergies || 'Penicillin (Cross-reactive with Amoxicillin)'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Attending Hospital & Doctor
                      </span>
                      <p className="text-slate-800 font-medium mt-0.5">
                        Apollo Hospitals, Bannerghatta Road • Dr. Ramesh Rao, MD
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to="/profile"
                      onClick={() => setShowPatientModal(false)}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
                    >
                      Open Full Health Profile →
                    </Link>
                    <span className="text-[10px] text-slate-400 font-mono">ID: #CC-{currentProfile.id}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 1-Click Demo Persona Switcher (Proper Indian Names, No Cartoon Emojis) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 shadow-xs">
          <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Persona:
          </span>
          <button
            onClick={() => handleDemoSwitch('kausalya@carecircle.demo')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              user?.email === 'kausalya@carecircle.demo' || user?.email === 'eleanor@carecircle.demo'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Switch to Kausalya Sharma (Elderly Patient Persona)"
          >
            Kausalya Sharma (Patient)
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => handleDemoSwitch('pooja@carecircle.demo')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              user?.email === 'pooja@carecircle.demo' || user?.email === 'sarah@carecircle.demo'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Switch to Pooja Sharma (Family Member Persona)"
          >
            Pooja Sharma (Family)
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => handleDemoSwitch('rajesh@carecircle.demo')}
            className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
              user?.email === 'rajesh@carecircle.demo' || user?.email === 'marcus@carecircle.demo'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Switch to Rajesh Kumar, RN (Clinical Caretaker Persona)"
          >
            Rajesh (Nurse)
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => handleDemoSwitch('ramesh@carecircle.demo')}
            className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
              user?.email === 'ramesh@carecircle.demo' || user?.email === 'doctor@carecircle.demo'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Switch to Dr. Ramesh Rao, MD (Attending Physician Persona)"
          >
            Dr. Ramesh (Doctor)
          </button>
        </div>

        {/* Action Controls & User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Bell */}
          {user && (
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              aria-label={`Notification Centre. ${unreadCount} unread`}
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User info & Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user.full_name}</p>
                <span className={`inline-block text-[10px] font-bold border px-1.5 py-0.2 rounded mt-0.5 ${
                  user.email.includes('ramesh') || user.email.includes('doctor') || user.full_name.includes('Dr.')
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : user.role === 'ELDERLY'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : user.role === 'FAMILY_MEMBER'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}>
                  {user.email.includes('ramesh') || user.email.includes('doctor') || user.full_name.includes('Dr.')
                    ? 'ATTENDING PHYSICIAN'
                    : user.role === 'ELDERLY'
                    ? 'PATIENT'
                    : user.role === 'FAMILY_MEMBER'
                    ? 'FAMILY MEMBER'
                    : 'REGISTERED NURSE'}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                aria-label="Log Out of CareCircle"
                className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 rounded-lg transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
